# Donut Investor Pipeline

## 项目目标
投资人 CRM + 自动化 outreach 系统。追踪 VC 动态，匹配投资 thesis，自动生成定制化 outreach 内容。

## 技术栈
- Runtime: Bun (TypeScript)
- HTTP: fetch (内置)
- LLM: Anthropic Claude API (`@anthropic-ai/sdk`)
- Storage: SQLite (via `bun:sqlite`)
- Web UI: Hono + htmx (轻量级 dashboard)
- Output: Markdown + JSON

## 核心功能模块

### 1. Investor Database (`src/database/investors.ts`)
投资人 CRM 核心数据模型：

```typescript
interface Investor {
  id: string;
  name: string;              // Fund name
  type: 'vc' | 'angel' | 'family_office' | 'crypto_fund';
  thesis: string[];          // Investment themes: ["AI", "DeFi", "Infra"]
  stage: string[];           // ["pre-seed", "seed", "series-a"]
  check_size: { min: number; max: number }; // USD
  portfolio: string[];       // Known portfolio companies
  partners: Partner[];       // Decision makers
  geo: string[];             // Focus regions
  status: 'researching' | 'to_reach' | 'reached_out' | 'in_conversation' | 'passed' | 'committed';
  score: number;             // 0-100 match score
  notes: string;
  last_activity: string;     // ISO date
  source: string;            // Where we found them
}

interface Partner {
  name: string;
  title: string;
  twitter?: string;
  linkedin?: string;
  email?: string;
  focus: string[];           // Personal investment interests
}
```

### 2. Investor Scraper (`src/scrapers/`)
从公开来源抓取 VC 信息：

- **`twitter.ts`**: Crypto VC Twitter 活动，投资公告，thesis threads
- **`crunchbase-lite.ts`**: 公开 Crunchbase profile (不用付费 API)
- **`portfolio-tracker.ts`**: 追踪已知 crypto VC 的 on-chain 投资 (Etherscan/Solscan 公开)
- **`news.ts`**: TechCrunch, The Block, CoinDesk 投资新闻
- **Seed data**: 手动维护的初始 VC list (JSON)

### 3. Matching Engine (`src/matching/engine.ts`)
投资人匹配评分系统：
- **Thesis match**: VC 投资主题 vs Donut 定位 (AI + Crypto Trading Infra)
- **Stage match**: VC 阶段偏好 vs Donut 当前阶段
- **Check size match**: VC 票额范围 vs 目标融资额
- **Portfolio synergy**: 已投项目是否有协同/竞争
- **Activity recency**: 最近是否活跃投资
- **Warm intro potential**: 是否有共同连接
- **输出**: 0-100 加权评分 + 评分理由

### 4. Outreach Generator (`src/outreach/generator.ts`)
用 Claude 生成个性化 outreach：
- **Cold email**: 根据 VC thesis 定制 narrative angle
- **Twitter DM**: 简短版，带 hook
- **Intro request**: 给 mutual connection 的转介绍请求
- **Follow-up sequence**: 7-day, 14-day, 30-day follow-up 模板
- **Deck talking points**: 针对该 VC 的 pitch 要点

### 5. Dashboard (`src/web/`)
轻量级 pipeline 可视化：
- **Kanban view**: researching → to_reach → reached_out → in_conversation → committed/passed
- **Investor cards**: score, thesis, last activity, next action
- **Analytics**: outreach response rate, conversion funnel
- **Search + Filter**: by thesis, stage, score, status
- Hono + htmx，极简实现，不用 React

## 项目结构

```
donut-investor-pipe/
├── src/
│   ├── index.ts              # Entry point
│   ├── config.ts             # API keys, Donut profile
│   ├── database/
│   │   ├── investors.ts      # Investor CRUD
│   │   ├── interactions.ts   # Outreach history
│   │   └── schema.sql        # SQLite schema
│   ├── scrapers/
│   │   ├── twitter.ts        # Twitter/X monitoring
│   │   ├── crunchbase-lite.ts # Public Crunchbase
│   │   ├── news.ts           # Investment news
│   │   └── portfolio-tracker.ts # On-chain tracking
│   ├── matching/
│   │   └── engine.ts         # Score calculator
│   ├── outreach/
│   │   ├── generator.ts      # Claude-powered content
│   │   └── templates/        # Email/DM templates
│   ├── web/
│   │   ├── server.ts         # Hono server
│   │   ├── routes/           # API routes
│   │   └── views/            # htmx templates
│   ├── storage/
│   │   └── db.ts             # SQLite wrapper
│   └── utils/
│       └── fetch-retry.ts
├── data/
│   ├── seed-investors.json   # Initial VC list (50+ entries)
│   └── donut-profile.json    # Company profile for matching
├── reports/                  # Generated outreach content
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Seed Investor List (初始数据)
预填以下 crypto-native VCs (agent 负责补充详细信息):

**Tier 1 - Crypto Native**:
- a16z crypto, Paradigm, Polychain, Multicoin Capital, Framework Ventures
- Dragonfly, Electric Capital, Hack VC, Pantera Capital, Galaxy Digital

**Tier 2 - AI + Crypto Crossover**:
- Delphi Ventures, Placeholder, Variant Fund, Robot Ventures, 1kx
- Mechanism Capital, Amber Group, DeFiance Capital, Spartan Group

**Tier 3 - Solana Ecosystem**:
- Colosseum, Solana Ventures (legacy), Superteam Grants
- Big Brain Holdings, Sino Global Capital

**Angel / Operator**:
- Crypto Twitter KOLs who angel invest (agent to research)

## Donut Profile (for matching)
```json
{
  "name": "Donut Labs",
  "stage": "pre-seed",
  "sector": ["AI", "DeFi", "Trading Infrastructure", "Solana"],
  "product": "AI-powered crypto trading terminal with browser agent",
  "differentiator": "Browser-native AI agent + MCP tool ecosystem + guardrails system",
  "target_raise": "$2M-3M",
  "traction": "See donut-dd-room for latest metrics",
  "team_size": "5-10",
  "location": "Hong Kong / Remote"
}
```

## API Keys 需要
- `ANTHROPIC_API_KEY` - Claude API for outreach generation
- `GITHUB_TOKEN` - GitHub API (optional, for portfolio research)
- 不依赖付费 API，优先公开数据源

## 实现优先级
1. **先做 Database + Seed Data** - SQLite schema + 50 VC seed JSON
2. **再做 Matching Engine** - 评分算法，即使只有 seed data 也能用
3. **再做 Outreach Generator** - Claude 生成定制化内容
4. **再做 Dashboard** - Hono + htmx kanban view
5. **最后做 Scrapers** - 逐步丰富数据源

## 约束
- 第一版必须用 seed data 就能跑，不依赖 scraping
- Dashboard 必须极简 (htmx, 不用 React/Vue)
- Outreach 内容要真实、不 spammy，读起来像人写的
- 所有投资人数据必须可手动编辑 (SQLite + JSON export)
- 隐私: 不存储非公开个人信息
