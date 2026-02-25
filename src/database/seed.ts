import { readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { createInvestor, type Investor } from "./investors";

const seedPath = join(import.meta.dir, "../../data/seed-investors.json");
const raw = readFileSync(seedPath, "utf-8");
const data = JSON.parse(raw);

let created = 0;
for (const e of data) {
  const investor: Investor = {
    id: randomUUID(),
    name: e.name,
    type: e.type || "vc",
    aum: e.aum || 0,
    aum_rank: e.aum_rank || 0,
    location: e.location || "",
    thesis: e.thesis || [],
    stage: e.stage || [],
    check_size: e.check_size || { min: 0, max: 0 },
    portfolio: e.portfolio || [],
    partners: e.partners || [],
    geo: e.geo || [],
    status: e.status || "researching",
    score: e.score || 0,
    notes: e.notes || "",
    recent_deals: e.recent_deals || [],
    donut_relevance: e.donut_relevance || "",
    fund_size: e.fund_size || "",
    recent_coverage: e.recent_coverage || [],
    last_activity: new Date().toISOString().split("T")[0],
    source: e.source || "seed-list",
  };
  createInvestor(investor);
  created++;
}
console.log(`Seeded ${created} investors.`);
