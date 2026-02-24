import { readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { getDb, closeDb } from "../storage/db";
import { createInvestor, type Investor } from "./investors";

interface SeedInvestor {
  name: string;
  type: Investor["type"];
  thesis: string[];
  stage: string[];
  check_size: { min: number; max: number };
  portfolio: string[];
  partners: Array<{
    name: string;
    title: string;
    twitter?: string;
    linkedin?: string;
    email?: string;
    focus: string[];
  }>;
  geo: string[];
  status: Investor["status"];
  notes: string;
  source: string;
}

const seedPath = join(import.meta.dir, "../../data/seed-investors.json");

function seed(): void {
  const raw = readFileSync(seedPath, "utf-8");
  const seedData: SeedInvestor[] = JSON.parse(raw);

  // Ensure DB is initialized
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
