import { getDb } from "../storage/db";

export interface Partner {
  name: string;
  title: string;
  twitter?: string;
  linkedin?: string;
  email?: string;
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

export interface Investor {
  id: string;
  name: string;
  type: "vc" | "angel" | "family_office" | "crypto_fund";
  thesis: string[];
  stage: string[];
  check_size: { min: number; max: number };
  portfolio: string[];
  partners: Partner[];
  geo: string[];
  status:
    | "researching"
    | "to_reach"
    | "reached_out"
    | "in_conversation"
    | "passed"
    | "committed";
  score: number;
  notes: string;
  recent_deals: RecentDeal[];
  donut_relevance: string;
  last_activity: string;
  source: string;
}

interface InvestorRow {
  id: string;
  name: string;
  type: string;
  thesis: string;
  stage: string;
  check_size_min: number;
  check_size_max: number;
  portfolio: string;
  partners: string;
  geo: string;
  status: string;
  score: number;
  notes: string;
  recent_deals: string;
  donut_relevance: string;
  last_activity: string;
  source: string;
}

function rowToInvestor(row: InvestorRow): Investor {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Investor["type"],
    thesis: JSON.parse(row.thesis),
    stage: JSON.parse(row.stage),
    check_size: { min: row.check_size_min, max: row.check_size_max },
    portfolio: JSON.parse(row.portfolio),
    partners: JSON.parse(row.partners),
    geo: JSON.parse(row.geo),
    status: row.status as Investor["status"],
    score: row.score,
    notes: row.notes,
    recent_deals: JSON.parse(row.recent_deals || "[]"),
    donut_relevance: row.donut_relevance || "",
    last_activity: row.last_activity,
    source: row.source,
  };
}

export function createInvestor(investor: Investor): void {
  const db = getDb();
  db.run(
    `INSERT OR REPLACE INTO investors (id, name, type, thesis, stage, check_size_min, check_size_max, portfolio, partners, geo, status, score, notes, recent_deals, donut_relevance, last_activity, source, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      investor.id,
      investor.name,
      investor.type,
      JSON.stringify(investor.thesis),
      JSON.stringify(investor.stage),
      investor.check_size.min,
      investor.check_size.max,
      JSON.stringify(investor.portfolio),
      JSON.stringify(investor.partners),
      JSON.stringify(investor.geo),
      investor.status,
      investor.score,
      investor.notes,
      JSON.stringify(investor.recent_deals || []),
      investor.donut_relevance || "",
      investor.last_activity,
      investor.source,
    ]
  );
}

export function getInvestor(id: string): Investor | null {
  const db = getDb();
  const row = db
    .query<InvestorRow, [string]>("SELECT * FROM investors WHERE id = ?")
    .get(id);
  return row ? rowToInvestor(row) : null;
}

export function getInvestorByName(name: string): Investor | null {
  const db = getDb();
  const row = db
    .query<InvestorRow, [string]>("SELECT * FROM investors WHERE name = ?")
    .get(name);
  return row ? rowToInvestor(row) : null;
}

export function listInvestors(filters?: {
  status?: Investor["status"];
  minScore?: number;
  thesis?: string;
}): Investor[] {
  const db = getDb();
  let sql = "SELECT * FROM investors WHERE 1=1";
  const params: string[] = [];

  if (filters?.status) {
    sql += " AND status = ?";
    params.push(filters.status);
  }
  if (filters?.minScore !== undefined) {
    sql += " AND score >= ?";
    params.push(String(filters.minScore));
  }
  if (filters?.thesis) {
    sql += " AND thesis LIKE ?";
    params.push(`%${filters.thesis}%`);
  }

  sql += " ORDER BY score DESC, name ASC";

  const rows = db.query<InvestorRow, string[]>(sql).all(...params);
  return rows.map(rowToInvestor);
}

export function updateInvestor(
  id: string,
  updates: Partial<Omit<Investor, "id">>
): void {
  const db = getDb();
  const setClauses: string[] = [];
  const params: (string | number)[] = [];

  if (updates.name !== undefined) { setClauses.push("name = ?"); params.push(updates.name); }
  if (updates.type !== undefined) { setClauses.push("type = ?"); params.push(updates.type); }
  if (updates.thesis !== undefined) { setClauses.push("thesis = ?"); params.push(JSON.stringify(updates.thesis)); }
  if (updates.stage !== undefined) { setClauses.push("stage = ?"); params.push(JSON.stringify(updates.stage)); }
  if (updates.check_size !== undefined) { setClauses.push("check_size_min = ?"); params.push(updates.check_size.min); setClauses.push("check_size_max = ?"); params.push(updates.check_size.max); }
  if (updates.portfolio !== undefined) { setClauses.push("portfolio = ?"); params.push(JSON.stringify(updates.portfolio)); }
  if (updates.partners !== undefined) { setClauses.push("partners = ?"); params.push(JSON.stringify(updates.partners)); }
  if (updates.geo !== undefined) { setClauses.push("geo = ?"); params.push(JSON.stringify(updates.geo)); }
  if (updates.status !== undefined) { setClauses.push("status = ?"); params.push(updates.status); }
  if (updates.score !== undefined) { setClauses.push("score = ?"); params.push(updates.score); }
  if (updates.notes !== undefined) { setClauses.push("notes = ?"); params.push(updates.notes); }
  if (updates.recent_deals !== undefined) { setClauses.push("recent_deals = ?"); params.push(JSON.stringify(updates.recent_deals)); }
  if (updates.donut_relevance !== undefined) { setClauses.push("donut_relevance = ?"); params.push(updates.donut_relevance); }
  if (updates.last_activity !== undefined) { setClauses.push("last_activity = ?"); params.push(updates.last_activity); }
  if (updates.source !== undefined) { setClauses.push("source = ?"); params.push(updates.source); }

  if (setClauses.length === 0) return;

  setClauses.push("updated_at = datetime('now')");
  params.push(id);

  db.run(`UPDATE investors SET ${setClauses.join(", ")} WHERE id = ?`, params);
}

export function deleteInvestor(id: string): void {
  const db = getDb();
  db.run("DELETE FROM investors WHERE id = ?", [id]);
}

export function countByStatus(): Record<string, number> {
  const db = getDb();
  const rows = db
    .query<{ status: string; count: number }, []>(
      "SELECT status, COUNT(*) as count FROM investors GROUP BY status"
    )
    .all();
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.status] = row.count;
  }
  return result;
}

export function exportInvestorsJson(): string {
  const investors = listInvestors();
  return JSON.stringify(investors, null, 2);
}
