import type { Investor } from "../../database/investors";
import type { MatchResult, ScoreBreakdown } from "../../matching/engine";

function getThesisTagClass(thesis: string): string {
  const lower = thesis.toLowerCase();
  if (lower === "ai") return "tag ai";
  if (lower.includes("defi")) return "tag defi";
  if (lower.includes("solana")) return "tag solana";
  if (lower.includes("trading")) return "tag trading";
  if (lower.includes("infra")) return "tag infra";
  return "tag";
}

function getScoreClass(score: number): string {
  if (score >= 75) return "score-high";
  if (score >= 50) return "score-mid";
  return "score-low";
}

export function investorCard(investor: Investor): string {
  const thesis = investor.thesis.slice(0, 4);
  return `
    <div class="investor-card"
         hx-get="/api/investors/${investor.id}"
         hx-target="#detail-panel"
         hx-swap="innerHTML">
      <div class="score-badge ${getScoreClass(investor.score)}">${investor.score}</div>
      <div class="name">${investor.name}</div>
      <div class="meta">${investor.type} · ${investor.stage.join(", ")}</div>
      <div class="tags">
        ${thesis.map((t) => `<span class="${getThesisTagClass(t)}">${t}</span>`).join("")}
      </div>
      <select class="status-select"
              hx-post="/api/investors/${investor.id}/status"
              hx-target="#kanban-board"
              hx-swap="outerHTML"
              name="status"
              onclick="event.stopPropagation()">
        ${statusOptions(investor.status)}
      </select>
    </div>`;
}

function statusOptions(current: string): string {
  const statuses = [
    "researching",
    "to_reach",
    "reached_out",
    "in_conversation",
    "passed",
    "committed",
  ];
  return statuses
    .map(
      (s) =>
        `<option value="${s}" ${s === current ? "selected" : ""}>${formatStatus(s)}</option>`
    )
    .join("");
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function kanbanBoard(investors: Investor[]): string {
  const columns: Record<string, Investor[]> = {
    researching: [],
    to_reach: [],
    reached_out: [],
    in_conversation: [],
    committed: [],
    passed: [],
  };

  for (const inv of investors) {
    if (columns[inv.status]) {
      columns[inv.status].push(inv);
    }
  }

  const colOrder = [
    "researching",
    "to_reach",
    "reached_out",
    "in_conversation",
    "committed",
    "passed",
  ];

  return `<div class="kanban" id="kanban-board">
    ${colOrder
      .map(
        (status) => `
      <div class="kanban-col">
        <h3>${formatStatus(status)} <span class="count">${columns[status].length}</span></h3>
        ${columns[status]
          .sort((a, b) => b.score - a.score)
          .map(investorCard)
          .join("")}
      </div>`
      )
      .join("")}
  </div>`;
}

export function investorDetail(
  investor: Investor,
  matchResult: MatchResult
): string {
  const b = matchResult.breakdown;
  return `
    <div class="detail-panel">
      <div style="display:flex; justify-content:space-between; align-items:center">
        <h2>${investor.name}</h2>
        <span class="score-badge ${getScoreClass(matchResult.score)}" style="font-size:20px;padding:6px 14px">
          ${matchResult.score}/100
        </span>
      </div>

      <div class="detail-grid" style="margin-top:16px">
        <div class="detail-field">
          <div class="label">Type</div>
          <div class="value">${investor.type}</div>
        </div>
        <div class="detail-field">
          <div class="label">Status</div>
          <div class="value">${formatStatus(investor.status)}</div>
        </div>
        <div class="detail-field">
          <div class="label">Thesis</div>
          <div class="value">${investor.thesis.map((t) => `<span class="${getThesisTagClass(t)}">${t}</span>`).join(" ")}</div>
        </div>
        <div class="detail-field">
          <div class="label">Stage</div>
          <div class="value">${investor.stage.join(", ")}</div>
        </div>
        <div class="detail-field">
          <div class="label">Check Size</div>
          <div class="value">$${(investor.check_size.min / 1e6).toFixed(1)}M — $${(investor.check_size.max / 1e6).toFixed(1)}M</div>
        </div>
        <div class="detail-field">
          <div class="label">Geography</div>
          <div class="value">${investor.geo.join(", ")}</div>
        </div>
        <div class="detail-field">
          <div class="label">Portfolio</div>
          <div class="value">${investor.portfolio.length > 0 ? investor.portfolio.join(", ") : "—"}</div>
        </div>
        <div class="detail-field">
          <div class="label">Source</div>
          <div class="value">${investor.source}</div>
        </div>
      </div>

      ${investor.partners.length > 0 ? `
        <h2 style="margin-top:20px">Partners</h2>
        <table>
          <thead>
            <tr><th>Name</th><th>Title</th><th>Focus</th><th>Twitter</th></tr>
          </thead>
          <tbody>
            ${investor.partners
              .map(
                (p) => `
              <tr>
                <td>${p.name}</td>
                <td>${p.title}</td>
                <td>${p.focus.join(", ")}</td>
                <td>${p.twitter ? `@${p.twitter}` : "—"}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      ` : ""}

      <h2 style="margin-top:20px">Score Breakdown</h2>
      <div class="score-breakdown">
        ${scoreItem("Thesis", b.thesisMatch, 30)}
        ${scoreItem("Stage", b.stageMatch, 20)}
        ${scoreItem("Check Size", b.checkSizeMatch, 15)}
        ${scoreItem("Portfolio", b.portfolioSynergy, 15)}
        ${scoreItem("Geography", b.geoMatch, 10)}
        ${scoreItem("Activity", b.activityRecency, 10)}
      </div>

      ${matchResult.reasons.length > 0 ? `
        <h2 style="margin-top:20px">Match Reasons</h2>
        <ul class="reasons-list">
          ${matchResult.reasons.map((r) => `<li>${r}</li>`).join("")}
        </ul>
      ` : ""}

      ${investor.notes ? `
        <h2 style="margin-top:20px">Notes</h2>
        <p style="color:var(--text-dim);font-size:14px">${investor.notes}</p>
      ` : ""}

      <div class="btn-group">
        <button class="btn btn-primary"
                hx-post="/api/investors/${investor.id}/generate/cold_email"
                hx-target="#generated-content"
                hx-swap="innerHTML"
                hx-indicator="#gen-loading">
          Generate Cold Email
        </button>
        <button class="btn btn-outline"
                hx-post="/api/investors/${investor.id}/generate/twitter_dm"
                hx-target="#generated-content"
                hx-swap="innerHTML"
                hx-indicator="#gen-loading">
          Generate DM
        </button>
        <button class="btn btn-outline"
                hx-post="/api/investors/${investor.id}/generate/talking_points"
                hx-target="#generated-content"
                hx-swap="innerHTML"
                hx-indicator="#gen-loading">
          Talking Points
        </button>
        <span id="gen-loading" class="htmx-indicator" style="color:var(--text-dim);font-size:13px">Generating...</span>
      </div>
      <div id="generated-content" style="margin-top:16px"></div>
    </div>`;
}

function scoreItem(label: string, value: number, max: number): string {
  const pct = Math.round((value / max) * 100);
  const color =
    pct >= 70 ? "var(--green)" : pct >= 40 ? "var(--yellow)" : "var(--red)";
  return `
    <div class="score-item">
      <div class="score-label">${label}</div>
      <div class="score-val" style="color:${color}">${value}<span style="font-size:12px;color:var(--text-dim)">/${max}</span></div>
    </div>`;
}

export function investorTable(investors: Investor[]): string {
  return `
    <table>
      <thead>
        <tr>
          <th>Score</th>
          <th>Name</th>
          <th>Type</th>
          <th>Thesis</th>
          <th>Stage</th>
          <th>Check Size</th>
          <th>Status</th>
          <th>Geo</th>
        </tr>
      </thead>
      <tbody>
        ${investors
          .sort((a, b) => b.score - a.score)
          .map(
            (inv) => `
          <tr hx-get="/api/investors/${inv.id}" hx-target="#detail-panel" hx-swap="innerHTML" style="cursor:pointer">
            <td><span class="score-badge ${getScoreClass(inv.score)}">${inv.score}</span></td>
            <td style="font-weight:600">${inv.name}</td>
            <td>${inv.type}</td>
            <td>${inv.thesis.slice(0, 3).map((t) => `<span class="${getThesisTagClass(t)}">${t}</span>`).join(" ")}</td>
            <td>${inv.stage.join(", ")}</td>
            <td>$${(inv.check_size.min / 1e6).toFixed(1)}M-$${(inv.check_size.max / 1e6).toFixed(1)}M</td>
            <td>${formatStatus(inv.status)}</td>
            <td>${inv.geo.join(", ")}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
}

export function analyticsView(
  statusCounts: Record<string, number>,
  outreachStats: { total: number; sent: number; responded: number; responseRate: number },
  totalInvestors: number
): string {
  return `
    <h1>Analytics</h1>
    <div class="stats">
      <div class="stat-card">
        <div class="label">Total Investors</div>
        <div class="value">${totalInvestors}</div>
      </div>
      <div class="stat-card">
        <div class="label">Outreach Sent</div>
        <div class="value">${outreachStats.sent}</div>
      </div>
      <div class="stat-card">
        <div class="label">Responses</div>
        <div class="value">${outreachStats.responded}</div>
      </div>
      <div class="stat-card">
        <div class="label">Response Rate</div>
        <div class="value">${outreachStats.responseRate}%</div>
      </div>
    </div>

    <h2>Pipeline Funnel</h2>
    <div style="margin-top:12px">
      ${["researching", "to_reach", "reached_out", "in_conversation", "committed", "passed"]
        .map((s) => {
          const count = statusCounts[s] || 0;
          const pct = totalInvestors > 0 ? Math.round((count / totalInvestors) * 100) : 0;
          return `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
              <div style="width:140px;font-size:13px;color:var(--text-dim)">${formatStatus(s)}</div>
              <div style="flex:1;height:24px;background:var(--surface);border-radius:4px;overflow:hidden">
                <div style="width:${pct}%;height:100%;background:var(--accent);border-radius:4px;min-width:${count > 0 ? '2px' : '0'}"></div>
              </div>
              <div style="width:40px;text-align:right;font-weight:600">${count}</div>
            </div>`;
        })
        .join("")}
    </div>`;
}

export function generatedContentView(content: string, type: string): string {
  return `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:16px;margin-top:8px">
      <div style="font-size:12px;color:var(--text-dim);text-transform:uppercase;margin-bottom:8px">${type.replace(/_/g, " ")}</div>
      <pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;color:var(--text)">${escapeHtml(content)}</pre>
    </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
