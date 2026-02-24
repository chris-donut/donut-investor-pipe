import { randomUUID } from "crypto";
import { getDb } from "../storage/db";

export interface Interaction {
  id: string;
  investor_id: string;
  type:
    | "cold_email"
    | "twitter_dm"
    | "intro_request"
    | "follow_up"
    | "meeting"
    | "note";
  channel: string;
  subject: string;
  content: string;
  sent_at: string | null;
  response: string | null;
  responded_at: string | null;
  created_at: string;
}

interface InteractionRow {
  id: string;
  investor_id: string;
  type: string;
  channel: string;
  subject: string;
  content: string;
  sent_at: string | null;
  response: string | null;
  responded_at: string | null;
  created_at: string;
}

function rowToInteraction(row: InteractionRow): Interaction {
  return {
    ...row,
    type: row.type as Interaction["type"],
  };
}

export function createInteraction(
  data: Omit<Interaction, "id" | "created_at">
): Interaction {
  const db = getDb();
  const id = randomUUID();
  db.run(
    `INSERT INTO interactions (id, investor_id, type, channel, subject, content, sent_at, response, responded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.investor_id,
      data.type,
      data.channel,
      data.subject,
      data.content,
      data.sent_at,
      data.response,
      data.responded_at,
    ]
  );
  return getInteraction(id)!;
}

export function getInteraction(id: string): Interaction | null {
  const db = getDb();
  const row = db
    .query<InteractionRow, [string]>("SELECT * FROM interactions WHERE id = ?")
    .get(id);
  return row ? rowToInteraction(row) : null;
}

export function listInteractionsByInvestor(
  investorId: string
): Interaction[] {
  const db = getDb();
  const rows = db
    .query<InteractionRow, [string]>(
      "SELECT * FROM interactions WHERE investor_id = ? ORDER BY created_at DESC"
    )
    .all(investorId);
  return rows.map(rowToInteraction);
}

export function listRecentInteractions(limit = 20): Interaction[] {
  const db = getDb();
  const rows = db
    .query<InteractionRow, [number]>(
      "SELECT * FROM interactions ORDER BY created_at DESC LIMIT ?"
    )
    .all(limit);
  return rows.map(rowToInteraction);
}

export function getOutreachStats(): {
  total: number;
  sent: number;
  responded: number;
  responseRate: number;
} {
  const db = getDb();
  const total = db
    .query<{ c: number }, []>("SELECT COUNT(*) as c FROM interactions")
    .get()!.c;
  const sent = db
    .query<{ c: number }, []>(
      "SELECT COUNT(*) as c FROM interactions WHERE sent_at IS NOT NULL"
    )
    .get()!.c;
  const responded = db
    .query<{ c: number }, []>(
      "SELECT COUNT(*) as c FROM interactions WHERE responded_at IS NOT NULL"
    )
    .get()!.c;
  return {
    total,
    sent,
    responded,
    responseRate: sent > 0 ? Math.round((responded / sent) * 100) : 0,
  };
}
