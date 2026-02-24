import { getDonutProfile, type DonutProfile } from "../config";
import {
  listInvestors,
  updateInvestor,
  type Investor,
} from "../database/investors";
import { closeDb } from "../storage/db";

export interface MatchResult {
  investor: Investor;
  score: number;
  breakdown: ScoreBreakdown;
  reasons: string[];
}

export interface ScoreBreakdown {
  thesisMatch: number; // 0-30
  stageMatch: number; // 0-20
  checkSizeMatch: number; // 0-15
  portfolioSynergy: number; // 0-15
  geoMatch: number; // 0-10
  activityRecency: number; // 0-10
}

const WEIGHTS = {
  thesisMatch: 30,
  stageMatch: 20,
  checkSizeMatch: 15,
  portfolioSynergy: 15,
  geoMatch: 10,
  activityRecency: 10,
} as const;

// Donut's sectors mapped to broader matching terms
const DONUT_KEYWORDS = [
  "AI",
  "DeFi",
  "Trading",
  "Infrastructure",
  "Solana",
  "Trading Infrastructure",
  "Crypto",
];

// Competitors / related portfolio companies that show thesis alignment
const SYNERGY_COMPANIES = [
  "Jupiter",
  "Drift",
  "Zeta Markets",
  "Tensor",
  "Jito",
  "Phantom",
  "dYdX",
  "Pyth",
  "Flashbots",
  "1inch",
  "Nansen",
  "Perpetual Protocol",
  "SushiSwap",
  "GMX",
];

// Companies that might indicate competitive conflict
const COMPETITOR_COMPANIES = ["3Commas", "Shrimpy", "Pionex"];

function parseTargetRaise(raise: string): { min: number; max: number } {
  // Parse "$2M-3M" format
  const match = raise.match(
    /\$?([\d.]+)\s*[Mm]\s*-\s*\$?([\d.]+)\s*[Mm]/
  );
  if (match) {
    return {
      min: parseFloat(match[1]) * 1_000_000,
      max: parseFloat(match[2]) * 1_000_000,
    };
  }
  return { min: 2_000_000, max: 3_000_000 };
}

function scoreThesisMatch(investor: Investor, profile: DonutProfile): number {
  const investorThesis = investor.thesis.map((t) => t.toLowerCase());
  const donutSectors = [...profile.sector, ...DONUT_KEYWORDS].map((s) =>
    s.toLowerCase()
  );

  let matches = 0;
  const uniqueMatches = new Set<string>();
  for (const sector of donutSectors) {
    for (const thesis of investorThesis) {
      if (
        thesis.includes(sector) ||
        sector.includes(thesis) ||
        thesis === sector
      ) {
        uniqueMatches.add(sector);
      }
    }
  }
  matches = uniqueMatches.size;

  // Normalize: 4+ unique matches = full score
  const ratio = Math.min(matches / 4, 1);
  return Math.round(ratio * WEIGHTS.thesisMatch);
}

function scoreStageMatch(investor: Investor, profile: DonutProfile): number {
  const donutStage = profile.stage.toLowerCase();
  const investorStages = investor.stage.map((s) => s.toLowerCase());

  if (investorStages.includes(donutStage)) {
    return WEIGHTS.stageMatch; // Perfect match
  }

  // Adjacent stage still gets partial credit
  if (donutStage === "pre-seed" && investorStages.includes("seed")) {
    return Math.round(WEIGHTS.stageMatch * 0.7);
  }
  if (donutStage === "seed" && investorStages.includes("pre-seed")) {
    return Math.round(WEIGHTS.stageMatch * 0.7);
  }

  return 0;
}

function scoreCheckSize(investor: Investor, profile: DonutProfile): number {
  const target = parseTargetRaise(profile.target_raise);
  const { min, max } = investor.check_size;

  // If investor has no check size data, give neutral score
  if (min === 0 && max === 0) return Math.round(WEIGHTS.checkSizeMatch * 0.5);

  // Check if there's overlap between investor range and target
  const overlapMin = Math.max(min, target.min);
  const overlapMax = Math.min(max, target.max);

  if (overlapMin <= overlapMax) {
    // There is overlap - score based on how much
    const overlapSize = overlapMax - overlapMin;
    const targetSize = target.max - target.min;
    const ratio = Math.min(overlapSize / targetSize, 1);
    return Math.round(
      WEIGHTS.checkSizeMatch * (0.6 + 0.4 * ratio)
    );
  }

  // No overlap - check how close
  if (max < target.min) {
    // Investor max is below our min - they write smaller checks
    const gap = target.min - max;
    if (gap < 500_000) return Math.round(WEIGHTS.checkSizeMatch * 0.3);
    return 0;
  }

  // Investor min is above our max - they write bigger checks
  return Math.round(WEIGHTS.checkSizeMatch * 0.2);
}

function scorePortfolioSynergy(investor: Investor): number {
  const portfolio = investor.portfolio.map((p) => p.toLowerCase());

  let synergyCount = 0;
  let competitorCount = 0;

  for (const company of SYNERGY_COMPANIES) {
    if (portfolio.some((p) => p.toLowerCase() === company.toLowerCase())) {
      synergyCount++;
    }
  }

  for (const company of COMPETITOR_COMPANIES) {
    if (portfolio.some((p) => p.toLowerCase() === company.toLowerCase())) {
      competitorCount++;
    }
  }

  // Competitors reduce score
  if (competitorCount > 0) return 0;

  // Synergy: 3+ related companies = full score
  const ratio = Math.min(synergyCount / 3, 1);
  return Math.round(ratio * WEIGHTS.portfolioSynergy);
}

function scoreGeoMatch(investor: Investor, profile: DonutProfile): number {
  const investorGeo = investor.geo.map((g) => g.toLowerCase());
  const donutLocation = profile.location.toLowerCase();

  // Check for direct geo match
  if (
    investorGeo.some(
      (g) =>
        donutLocation.includes(g) ||
        g === "global" ||
        g === "asia" ||
        g === "hong kong"
    )
  ) {
    // Global or Asia or HK match
    if (investorGeo.includes("hong kong")) return WEIGHTS.geoMatch;
    if (investorGeo.includes("asia")) return Math.round(WEIGHTS.geoMatch * 0.8);
    if (investorGeo.includes("singapore"))
      return Math.round(WEIGHTS.geoMatch * 0.7);
    if (investorGeo.includes("global"))
      return Math.round(WEIGHTS.geoMatch * 0.6);
    return Math.round(WEIGHTS.geoMatch * 0.5);
  }

  return Math.round(WEIGHTS.geoMatch * 0.3); // US-only funds still accessible
}

function scoreActivityRecency(investor: Investor): number {
  if (!investor.last_activity) return Math.round(WEIGHTS.activityRecency * 0.5);

  const lastDate = new Date(investor.last_activity);
  const now = new Date();
  const daysSince = Math.floor(
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince <= 30) return WEIGHTS.activityRecency;
  if (daysSince <= 90) return Math.round(WEIGHTS.activityRecency * 0.7);
  if (daysSince <= 180) return Math.round(WEIGHTS.activityRecency * 0.4);
  return Math.round(WEIGHTS.activityRecency * 0.2);
}

function generateReasons(
  investor: Investor,
  breakdown: ScoreBreakdown,
  profile: DonutProfile
): string[] {
  const reasons: string[] = [];

  if (breakdown.thesisMatch >= 20) {
    const overlap = investor.thesis.filter((t) =>
      profile.sector.some(
        (s) =>
          t.toLowerCase().includes(s.toLowerCase()) ||
          s.toLowerCase().includes(t.toLowerCase())
      )
    );
    reasons.push(`Strong thesis alignment: ${overlap.join(", ")}`);
  }

  if (breakdown.stageMatch >= 15) {
    reasons.push(`Invests at ${profile.stage} stage`);
  } else if (breakdown.stageMatch > 0) {
    reasons.push(`Adjacent stage investor (may flex to ${profile.stage})`);
  }

  if (breakdown.checkSizeMatch >= 10) {
    reasons.push(
      `Check size fits: $${(investor.check_size.min / 1e6).toFixed(1)}M-$${(investor.check_size.max / 1e6).toFixed(1)}M`
    );
  }

  if (breakdown.portfolioSynergy >= 8) {
    const synergies = investor.portfolio.filter((p) =>
      SYNERGY_COMPANIES.some((s) => s.toLowerCase() === p.toLowerCase())
    );
    reasons.push(`Portfolio synergy: ${synergies.join(", ")}`);
  }

  if (breakdown.geoMatch >= 8) {
    reasons.push(`Geographic alignment: ${investor.geo.join(", ")}`);
  }

  if (investor.partners.length > 0) {
    const relevantPartners = investor.partners.filter((p) =>
      p.focus.some((f) =>
        profile.sector.some(
          (s) =>
            f.toLowerCase().includes(s.toLowerCase()) ||
            s.toLowerCase().includes(f.toLowerCase())
        )
      )
    );
    if (relevantPartners.length > 0) {
      reasons.push(
        `Key contact: ${relevantPartners.map((p) => `${p.name} (${p.title})`).join(", ")}`
      );
    }
  }

  return reasons;
}

export function scoreInvestor(investor: Investor): MatchResult {
  const profile = getDonutProfile();

  const breakdown: ScoreBreakdown = {
    thesisMatch: scoreThesisMatch(investor, profile),
    stageMatch: scoreStageMatch(investor, profile),
    checkSizeMatch: scoreCheckSize(investor, profile),
    portfolioSynergy: scorePortfolioSynergy(investor),
    geoMatch: scoreGeoMatch(investor, profile),
    activityRecency: scoreActivityRecency(investor),
  };

  const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const reasons = generateReasons(investor, breakdown, profile);

  return { investor, score, breakdown, reasons };
}

export function scoreAllInvestors(): MatchResult[] {
  const investors = listInvestors();
  const results = investors.map(scoreInvestor);

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}

export function runMatchingAndUpdate(): MatchResult[] {
  const results = scoreAllInvestors();

  for (const result of results) {
    updateInvestor(result.investor.id, { score: result.score });
  }

  return results;
}

// CLI runner
if (import.meta.main) {
  console.log("Running matching engine...\n");
  const results = runMatchingAndUpdate();

  console.log(`Scored ${results.length} investors:\n`);
  console.log("Top 15 matches:");
  console.log("─".repeat(80));

  for (const result of results.slice(0, 15)) {
    console.log(
      `[${result.score}/100] ${result.investor.name} (${result.investor.type})`
    );
    console.log(
      `  Thesis: ${result.breakdown.thesisMatch}/30 | Stage: ${result.breakdown.stageMatch}/20 | Check: ${result.breakdown.checkSizeMatch}/15 | Portfolio: ${result.breakdown.portfolioSynergy}/15 | Geo: ${result.breakdown.geoMatch}/10 | Activity: ${result.breakdown.activityRecency}/10`
    );
    for (const reason of result.reasons) {
      console.log(`  → ${reason}`);
    }
    console.log();
  }

  closeDb();
}
