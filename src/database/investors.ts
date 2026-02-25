import { Database } from "bun:sqlite";
import { readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const dbPath = join(import.meta.dir, "../../data/investors.db");
const schemaPath = join(import.meta.dir, "schema.sql");

let db: Database;
function getDb(): Database {
  if (!db) {
    db = new Database(dbPath, { create: true });
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA busy_timeout = 5000");
    const schema = readFileSync(schemaPath, "utf-8");
    db.exec(schema);
  }
  return db;
}

export interface Partner {
  name: string;
  title: string;
  linkedin?: string;
  twitter?: string;
  email_pattern?: string;
  focus: string[];
  notes?: string;
}

export interface RecentDeal {
  company: string;
  round: string;
  amount: string;
  date: string;
  relevance?: string;
}

export interface CoverageItem {
  title: string;
  source: string;
  date: string;
  url?: string;
}

export interface Investor {
  id: string;
  name: string;
  type: string;
  aum: number;
  aum_rank: number;
  location: string;
  thesis: string[];
  stage: string[];
  check_size: { min: number; max: number };
  portfolio: string[];
  partners: Partner[];
  geo: string[];
  status: string;
  score: number;
  notes: string;
  recent_deals: RecentDeal[];
  donut_relevance: string;
  fund_size: string;
  recent_coverage: CoverageItem[];
  last_activity: string;
  source: string;
}

interface InvestorRow {
  id: string; name: string; type: string; aum: number; aum_rank: number;
  location: string; thesis: string; stage: string; check_size_min: number;
  check_size_max: number; portfolio: string; partners: string; geo: string;
  status: string; score: number; notes: string; recent_deals: string;
  donut_relevance: string; fund_size: string; recent_coverage: string;
  last_activity: string; source: string; created_at: string; updated_at: string;
}

function rowToInvestor(r: InvestorRow): Investor {
  return {
    id: r.id, name: r.name, type: r.type, aum: r.aum, aum_rank: r.aum_rank,
    location: r.location, thesis: JSON.parse(r.thesis), stage: JSON.parse(r.stage),
    check_size: { min: r.check_size_min, max: r.check_size_max },
    portfolio: JSON.parse(r.portfolio), partners: JSON.parse(r.partners),
    geo: JSON.parse(r.geo), status: r.status, score: r.score, notes: r.notes,
    recent_deals: JSON.parse(r.recent_deals), donut_relevance: r.donut_relevance,
    fund_size: r.fund_size, recent_coverage: JSON.parse(r.recent_coverage),
    last_activity: r.last_activity, source: r.source,
  };
}

export function createInvestor(i: Investor): void {
  getDb().run(
    `INSERT OR REPLACE INTO investors (id,name,type,aum,aum_rank,location,thesis,stage,check_size_min,check_size_max,portfolio,partners,geo,status,score,notes,recent_deals,donut_relevance,fund_size,recent_coverage,last_activity,source)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [i.id, i.name, i.type, i.aum, i.aum_rank, i.location,
     JSON.stringify(i.thesis), JSON.stringify(i.stage),
     i.check_size.min, i.check_size.max,
     JSON.stringify(i.portfolio), JSON.stringify(i.partners), JSON.stringify(i.geo),
     i.status, i.score, i.notes, JSON.stringify(i.recent_deals),
     i.donut_relevance, i.fund_size, JSON.stringify(i.recent_coverage),
     i.last_activity, i.source]
  );
}

export function getInvestor(id: string): Investor | null {
  const r = getDb().query("SELECT * FROM investors WHERE id = ?").get(id) as InvestorRow | null;
  return r ? rowToInvestor(r) : null;
}

export function listInvestors(opts?: {
  type?: string; status?: string; search?: string;
  sort?: string; dir?: string; limit?: number;
}): Investor[] {
  let sql = "SELECT * FROM investors WHERE 1=1";
  const params: any[] = [];
  if (opts?.type) { sql += " AND type = ?"; params.push(opts.type); }
  if (opts?.status) { sql += " AND status = ?"; params.push(opts.status); }
  if (opts?.search) { sql += " AND (name LIKE ? OR location LIKE ? OR thesis LIKE ?)"; const s = `%${opts.search}%`; params.push(s, s, s); }
  const sortCol = opts?.sort || "aum"; const dir = opts?.dir === "asc" ? "ASC" : "DESC";
  const validSorts: Record<string, string> = { aum: "aum", rank: "aum_rank", name: "name", location: "location", status: "status", score: "score" };
  sql += ` ORDER BY ${validSorts[sortCol] || "aum"} ${sortCol === "rank" || sortCol === "name" ? "ASC" : dir}`;
  if (opts?.limit) { sql += " LIMIT ?"; params.push(opts.limit); }
  return (getDb().query(sql).all(...params) as InvestorRow[]).map(rowToInvestor);
}

export function updateInvestor(id: string, updates: Partial<Investor>): void {
  const sets: string[] = []; const params: any[] = [];
  if (updates.status !== undefined) { sets.push("status = ?"); params.push(updates.status); }
  if (updates.score !== undefined) { sets.push("score = ?"); params.push(updates.score); }
  if (updates.notes !== undefined) { sets.push("notes = ?"); params.push(updates.notes); }
  if (updates.aum !== undefined) { sets.push("aum = ?"); params.push(updates.aum); }
  if (updates.location !== undefined) { sets.push("location = ?"); params.push(updates.location); }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  params.push(id);
  getDb().run(`UPDATE investors SET ${sets.join(",")} WHERE id = ?`, params);
}

export function countByStatus(): Record<string, number> {
  const rows = getDb().query("SELECT status, COUNT(*) as c FROM investors GROUP BY status").all() as any[];
  const m: Record<string, number> = {};
  rows.forEach(r => m[r.status] = r.c);
  return m;
}

export function countByType(): Record<string, number> {
  const rows = getDb().query("SELECT type, COUNT(*) as c FROM investors GROUP BY type").all() as any[];
  const m: Record<string, number> = {};
  rows.forEach(r => m[r.type] = r.c);
  return m;
}

export function totalAum(): number {
  const r = getDb().query("SELECT SUM(aum) as total FROM investors").get() as any;
  return r?.total || 0;
}

export function computeScore(i: Investor): number {
  let score = 0;
  const thesisStr = i.thesis.join(" ").toLowerCase();
  ["ai", "crypto", "defi", "fintech", "trading"].forEach(kw => {
    if (thesisStr.includes(kw)) score += 6;
  });
  if (i.type === "crypto_fund") score += 15;
  else if (i.type === "vc" && thesisStr.includes("crypto")) score += 8;
  const stageStr = i.stage.join(" ").toLowerCase();
  if (stageStr.includes("seed") || stageStr.includes("series-a") || stageStr.includes("series a")) score += 15;
  if (i.check_size.min <= 10000000 && i.check_size.max >= 500000) score += 10;
  let dealScore = 0;
  i.recent_deals.forEach(d => {
    const dStr = (d.company + " " + d.round + " " + (d.relevance || "")).toLowerCase();
    if (["crypto","defi","blockchain","trading","web3","token","chain"].some(kw => dStr.includes(kw))) dealScore += 5;
  });
  score += Math.min(dealScore, 15);
  if (i.donut_relevance) {
    const rel = i.donut_relevance.toUpperCase();
    if (rel.includes("PRIORITY") || rel.includes("TOP")) score += 15;
    else if (i.donut_relevance.length > 100) score += 10;
    else if (i.donut_relevance.length > 0) score += 5;
  }
  return Math.min(score, 100);
}

export function updateAllScores(): void {
  const all = listInvestors();
  for (const inv of all) {
    const s = computeScore(inv);
    updateInvestor(inv.id, { score: s });
  }
  console.log("Updated scores for " + all.length + " investors");
}
