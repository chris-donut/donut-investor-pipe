-- Donut Investor Pipeline Schema

CREATE TABLE IF NOT EXISTS investors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK(type IN ('vc', 'angel', 'family_office', 'crypto_fund')),
  thesis TEXT NOT NULL DEFAULT '[]',          -- JSON array of strings
  stage TEXT NOT NULL DEFAULT '[]',           -- JSON array of strings
  check_size_min REAL DEFAULT 0,
  check_size_max REAL DEFAULT 0,
  portfolio TEXT NOT NULL DEFAULT '[]',       -- JSON array of strings
  partners TEXT NOT NULL DEFAULT '[]',        -- JSON array of Partner objects
  geo TEXT NOT NULL DEFAULT '[]',             -- JSON array of strings
  status TEXT NOT NULL DEFAULT 'researching'
    CHECK(status IN ('researching', 'to_reach', 'reached_out', 'in_conversation', 'passed', 'committed')),
  score INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  last_activity TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interactions (
  id TEXT PRIMARY KEY,
  investor_id TEXT NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('cold_email', 'twitter_dm', 'intro_request', 'follow_up', 'meeting', 'note')),
  channel TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  sent_at TEXT,
  response TEXT,
  responded_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_investors_status ON investors(status);
CREATE INDEX IF NOT EXISTS idx_investors_score ON investors(score DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_investor ON interactions(investor_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(type);
