CREATE TABLE IF NOT EXISTS investors (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'vc',
  aum REAL DEFAULT 0,
  aum_rank INTEGER DEFAULT 0,
  location TEXT DEFAULT '',
  thesis TEXT NOT NULL DEFAULT '[]',
  stage TEXT NOT NULL DEFAULT '[]',
  check_size_min REAL DEFAULT 0,
  check_size_max REAL DEFAULT 0,
  portfolio TEXT NOT NULL DEFAULT '[]',
  partners TEXT NOT NULL DEFAULT '[]',
  geo TEXT NOT NULL DEFAULT '[]',
  status TEXT DEFAULT 'researching',
  score INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  recent_deals TEXT NOT NULL DEFAULT '[]',
  donut_relevance TEXT NOT NULL DEFAULT '',
  fund_size TEXT DEFAULT '',
  recent_coverage TEXT NOT NULL DEFAULT '[]',
  last_activity TEXT DEFAULT '',
  source TEXT DEFAULT 'seed-list',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_investors_aum ON investors(aum DESC);
CREATE INDEX IF NOT EXISTS idx_investors_aum_rank ON investors(aum_rank ASC);
CREATE INDEX IF NOT EXISTS idx_investors_status ON investors(status);
CREATE INDEX IF NOT EXISTS idx_investors_type ON investors(type);
CREATE INDEX IF NOT EXISTS idx_investors_score ON investors(score DESC);

CREATE TABLE IF NOT EXISTS interactions (
  id TEXT PRIMARY KEY,
  investor_id TEXT NOT NULL REFERENCES investors(id),
  type TEXT DEFAULT 'note',
  channel TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  content TEXT DEFAULT '',
  sent_at TEXT DEFAULT '',
  response TEXT DEFAULT '',
  responded_at TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_interactions_investor ON interactions(investor_id);
