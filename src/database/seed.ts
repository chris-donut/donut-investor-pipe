import { readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { getDb, closeDb } from "../storage/db";
import { createInvestor, type Investor } from "./investors";

const seedPath = join(import.meta.dir, "../../data/seed-investors.json");

function seed(): void {
  const raw = readFileSync(seedPath, "utf-8");
  const seedData: any[] = JSON.parse(raw);

  getDb();

  let created = 0;
  for (const entry of seedData) {
    const investor: Investor = {
      id: randomUUID(),
      name: entry.name,
      type: entry.type,
      thesis: entry.thesis,
      stage: entry.stage,
      check_size: entry.check_size,
      portfolio: entry.portfolio,
      partners: entry.partners,
      geo: entry.geo,
      status: entry.status || "researching",
      score: 0,
      notes: entry.notes || "",
      recent_deals: entry.recent_deals || [],
      donut_relevance: entry.donut_relevance || "",
      last_activity: new Date().toISOString().split("T")[0],
      source: entry.source || "seed-list",
    };
    createInvestor(investor);
    created++;
  }

  console.log(`Seeded ${created} investors into database.`);
  closeDb();
}

seed();
