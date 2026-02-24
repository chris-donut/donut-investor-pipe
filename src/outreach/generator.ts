import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { getAnthropicKey, getDonutProfile } from "../config";
import type { Investor } from "../database/investors";
import { createInteraction } from "../database/interactions";
import { scoreInvestor, type MatchResult } from "../matching/engine";

export type OutreachType =
  | "cold_email"
  | "twitter_dm"
  | "intro_request"
  | "follow_up"
  | "talking_points";

export interface GeneratedOutreach {
  type: OutreachType;
  investor: string;
  subject?: string;
  content: string;
}

function loadTemplate(name: string): string {
  const templatePath = join(import.meta.dir, "templates", `${name}.md`);
  return readFileSync(templatePath, "utf-8");
}

function buildContext(investor: Investor, matchResult: MatchResult): string {
  const profile = getDonutProfile();
  return `
INVESTOR PROFILE:
- Name: ${investor.name}
- Type: ${investor.type}
- Investment Thesis: ${investor.thesis.join(", ")}
- Stage Focus: ${investor.stage.join(", ")}
- Check Size: $${(investor.check_size.min / 1e6).toFixed(1)}M - $${(investor.check_size.max / 1e6).toFixed(1)}M
- Portfolio: ${investor.portfolio.length > 0 ? investor.portfolio.join(", ") : "Not tracked"}
- Key Partners: ${investor.partners.map((p) => `${p.name} (${p.title}, focus: ${p.focus.join("/")})`).join("; ") || "Unknown"}
- Geography: ${investor.geo.join(", ")}
- Notes: ${investor.notes}

MATCH ANALYSIS (Score: ${matchResult.score}/100):
${matchResult.reasons.map((r) => `- ${r}`).join("\n")}

DONUT LABS PROFILE:
- Product: ${profile.product}
- Differentiator: ${profile.differentiator}
- Stage: ${profile.stage}
- Sectors: ${profile.sector.join(", ")}
- Target Raise: ${profile.target_raise}
- Location: ${profile.location}
- Team Size: ${profile.team_size}
`.trim();
}

async function generateWithClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const client = new Anthropic({ apiKey: getAnthropicKey() });

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];
  if (block.type === "text") return block.text;
  throw new Error("Unexpected response type from Claude");
}

export async function generateColdEmail(
  investor: Investor
): Promise<GeneratedOutreach> {
  const matchResult = scoreInvestor(investor);
  const context = buildContext(investor, matchResult);
  const template = loadTemplate("cold-email");

  const partnerName =
    investor.partners[0]?.name || "team";

  const systemPrompt = `You are a startup founder writing a personalized cold outreach email to a crypto VC.
Your writing style is direct, authentic, and conversational — not salesy or generic.
You deeply understand the crypto/DeFi space and can speak the investor's language.
Keep emails concise (under 200 words body). Sound like a real person, not a template.
Never use buzzwords like "synergy", "leverage", "disruptive" or excessive exclamation marks.`;

  const userPrompt = `Generate a personalized cold email for this investor. Use the template structure below as a guide, but make it feel natural and specific to this investor.

${context}

TEMPLATE STRUCTURE:
${template}

Fill in all {{placeholders}} with appropriate content. The opening_hook should reference something specific about the investor's thesis or recent activity. The thesis_connection should explain why this investor specifically would be interested. The portfolio_reference should mention relevant portfolio companies if any exist.

Output ONLY the email (subject line + body), no explanations. Use "Subject:" prefix for the subject line.`;

  const content = await generateWithClaude(systemPrompt, userPrompt);

  const subjectMatch = content.match(/^Subject:\s*(.+)$/m);
  const subject = subjectMatch?.[1] || `Donut Labs — AI Trading Terminal for ${investor.thesis[0]}`;

  return {
    type: "cold_email",
    investor: investor.name,
    subject,
    content,
  };
}

export async function generateTwitterDM(
  investor: Investor
): Promise<GeneratedOutreach> {
  const matchResult = scoreInvestor(investor);
  const context = buildContext(investor, matchResult);
  const template = loadTemplate("twitter-dm");

  const systemPrompt = `You are a startup founder crafting a brief Twitter DM to a crypto investor.
Keep it under 100 words. Be casual but professional. Get to the point fast.
Sound like a real crypto-native person, not a marketer.`;

  const userPrompt = `Write a short Twitter DM to this investor. Use the template as a loose guide.

${context}

TEMPLATE:
${template}

Output ONLY the DM text, no explanations.`;

  const content = await generateWithClaude(systemPrompt, userPrompt);
  return { type: "twitter_dm", investor: investor.name, content };
}

export async function generateIntroRequest(
  investor: Investor,
  mutualName: string
): Promise<GeneratedOutreach> {
  const matchResult = scoreInvestor(investor);
  const context = buildContext(investor, matchResult);
  const template = loadTemplate("intro-request");

  const systemPrompt = `You are a startup founder asking a mutual connection for an intro to an investor.
Be respectful of the mutual's time. Make it easy for them to forward.
Keep it concise and genuine.`;

  const userPrompt = `Write an intro request email asking ${mutualName} for an introduction to this investor.

${context}

TEMPLATE:
${template}

Output ONLY the email text, no explanations.`;

  const content = await generateWithClaude(systemPrompt, userPrompt);
  return {
    type: "intro_request",
    investor: investor.name,
    subject: `Intro request: ${investor.name}`,
    content,
  };
}

export async function generateFollowUp(
  investor: Investor,
  daysSince: number,
  previousContext?: string
): Promise<GeneratedOutreach> {
  const matchResult = scoreInvestor(investor);
  const context = buildContext(investor, matchResult);
  const template = loadTemplate("follow-up");

  const systemPrompt = `You are a startup founder sending a follow-up to an investor you previously contacted.
Be brief, add new value (don't just "check in"). Mention a recent milestone or update.
Don't be pushy. Sound natural.`;

  const userPrompt = `Write a ${daysSince}-day follow-up email for this investor.
${previousContext ? `Previous context: ${previousContext}` : "This is a first follow-up after initial cold outreach."}

${context}

TEMPLATE:
${template}

The follow_up_opener should acknowledge the time passed naturally. The update_content should include a plausible recent milestone or insight.

Output ONLY the email text, no explanations.`;

  const content = await generateWithClaude(systemPrompt, userPrompt);
  return {
    type: "follow_up",
    investor: investor.name,
    subject: `Following up — Donut Labs`,
    content,
  };
}

export async function generateTalkingPoints(
  investor: Investor
): Promise<GeneratedOutreach> {
  const matchResult = scoreInvestor(investor);
  const context = buildContext(investor, matchResult);

  const systemPrompt = `You are preparing pitch talking points for a startup founder meeting with a crypto VC.
Focus on angles that resonate with this specific investor's thesis and portfolio.
Be strategic and specific, not generic.`;

  const userPrompt = `Generate 5-7 tailored talking points for a pitch meeting with this investor.

${context}

For each point, include:
1. The key message
2. Why it resonates with THIS investor specifically
3. A supporting data point or comparison if relevant

Format as a clean numbered list. Output ONLY the talking points.`;

  const content = await generateWithClaude(systemPrompt, userPrompt);
  return { type: "talking_points", investor: investor.name, content };
}

export function saveOutreach(outreach: GeneratedOutreach): string {
  const reportsDir = join(import.meta.dir, "../../reports");
  mkdirSync(reportsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeName = outreach.investor.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const filename = `${safeName}_${outreach.type}_${timestamp}.md`;
  const filepath = join(reportsDir, filename);

  let content = `# ${outreach.type.replace(/_/g, " ").toUpperCase()}: ${outreach.investor}\n`;
  content += `Generated: ${new Date().toISOString()}\n\n`;
  if (outreach.subject) content += `**Subject:** ${outreach.subject}\n\n`;
  content += `---\n\n${outreach.content}\n`;

  writeFileSync(filepath, content);
  return filepath;
}

export function saveOutreachAsInteraction(
  outreach: GeneratedOutreach,
  investorId: string
): void {
  createInteraction({
    investor_id: investorId,
    type: outreach.type === "talking_points" ? "note" : outreach.type as "cold_email" | "twitter_dm" | "intro_request" | "follow_up",
    channel: outreach.type === "twitter_dm" ? "twitter" : "email",
    subject: outreach.subject || "",
    content: outreach.content,
    sent_at: null,
    response: null,
    responded_at: null,
  });
}

// CLI runner: generate outreach for top-scored investors
if (import.meta.main) {
  const { listInvestors } = await import("../database/investors");
  const { closeDb } = await import("../storage/db");

  const investors = listInvestors();
  const topInvestors = investors
    .map((inv) => ({ inv, result: scoreInvestor(inv) }))
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, 3);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("ANTHROPIC_API_KEY not set. Showing template previews instead.\n");
    for (const { inv, result } of topInvestors) {
      console.log(`[${result.score}/100] ${inv.name}`);
      console.log(`  Thesis: ${inv.thesis.join(", ")}`);
      console.log(`  Partners: ${inv.partners.map((p) => p.name).join(", ") || "N/A"}`);
      console.log(`  Would generate: cold_email, twitter_dm, talking_points`);
      console.log();
    }
    closeDb();
  } else {
    console.log("Generating outreach for top 3 investors...\n");
    for (const { inv, result } of topInvestors) {
      console.log(`[${result.score}/100] ${inv.name}`);
      try {
        const email = await generateColdEmail(inv);
        const path = saveOutreach(email);
        saveOutreachAsInteraction(email, inv.id);
        console.log(`  → Cold email saved: ${path}`);
      } catch (err) {
        console.error(`  → Error: ${err}`);
      }
      console.log();
    }
    closeDb();
  }
}
