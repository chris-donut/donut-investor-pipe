import { Hono } from "hono";
import { listInvestors, countByStatus } from "../../database/investors";
import { getOutreachStats } from "../../database/interactions";
import { runMatchingAndUpdate } from "../../matching/engine";
import { layout } from "../views/layout";
import {
  kanbanBoard,
  investorTable,
  analyticsView,
} from "../views/components";

const pages = new Hono();

// Kanban dashboard (home)
pages.get("/", (c) => {
  // Ensure scores are up to date
  runMatchingAndUpdate();
  const investors = listInvestors();

  const totalCount = investors.length;
  const statusCounts = countByStatus();
  const avgScore =
    totalCount > 0
      ? Math.round(
          investors.reduce((sum, inv) => sum + inv.score, 0) / totalCount
        )
      : 0;

  const body = `
    <h1>Investor Pipeline</h1>
    <div class="stats">
      <div class="stat-card">
        <div class="label">Total Investors</div>
        <div class="value">${totalCount}</div>
      </div>
      <div class="stat-card">
        <div class="label">To Reach</div>
        <div class="value">${statusCounts["to_reach"] || 0}</div>
      </div>
      <div class="stat-card">
        <div class="label">In Conversation</div>
        <div class="value">${statusCounts["in_conversation"] || 0}</div>
      </div>
      <div class="stat-card">
        <div class="label">Avg Score</div>
        <div class="value">${avgScore}</div>
      </div>
    </div>

    <div class="filters">
      <input type="text" placeholder="Search investors..."
             hx-get="/search"
             hx-trigger="keyup changed delay:300ms"
             hx-target="#kanban-board"
             hx-swap="outerHTML"
             name="q">
      <select hx-get="/filter"
              hx-trigger="change"
              hx-target="#kanban-board"
              hx-swap="outerHTML"
              name="thesis">
        <option value="">All Themes</option>
        <option value="AI">AI</option>
        <option value="DeFi">DeFi</option>
        <option value="Solana">Solana</option>
        <option value="Trading">Trading</option>
        <option value="Infrastructure">Infrastructure</option>
      </select>
      <button class="btn btn-outline"
              hx-post="/api/match"
              hx-swap="none">
        Re-score All
      </button>
    </div>

    ${kanbanBoard(investors)}

    <div id="detail-panel" style="margin-top:16px"></div>
  `;

  return c.html(layout("Pipeline", body));
});

// List view
pages.get("/list", (c) => {
  runMatchingAndUpdate();
  const investors = listInvestors();

  const body = `
    <h1>Investor List</h1>
    <div class="filters">
      <input type="text" placeholder="Search investors..."
             hx-get="/search-table"
             hx-trigger="keyup changed delay:300ms"
             hx-target="#investor-table"
             hx-swap="innerHTML"
             name="q">
      <select hx-get="/filter-table"
              hx-trigger="change"
              hx-target="#investor-table"
              hx-swap="innerHTML"
              name="thesis">
        <option value="">All Themes</option>
        <option value="AI">AI</option>
        <option value="DeFi">DeFi</option>
        <option value="Solana">Solana</option>
        <option value="Trading">Trading</option>
        <option value="Infrastructure">Infrastructure</option>
      </select>
      <a href="/api/export" class="btn btn-outline">Export JSON</a>
    </div>
    <div id="investor-table">
      ${investorTable(investors)}
    </div>
    <div id="detail-panel" style="margin-top:16px"></div>
  `;

  return c.html(layout("Investor List", body));
});

// Analytics view
pages.get("/analytics", (c) => {
  const statusCounts = countByStatus();
  const outreachStats = getOutreachStats();
  const investors = listInvestors();

  const body = analyticsView(statusCounts, outreachStats, investors.length);
  return c.html(layout("Analytics", body));
});

// Htmx search/filter partials
pages.get("/search", (c) => {
  const q = (c.req.query("q") || "").toLowerCase();
  let investors = listInvestors();
  if (q) {
    investors = investors.filter(
      (inv) =>
        inv.name.toLowerCase().includes(q) ||
        inv.thesis.some((t) => t.toLowerCase().includes(q)) ||
        inv.notes.toLowerCase().includes(q)
    );
  }
  return c.html(kanbanBoard(investors));
});

pages.get("/filter", (c) => {
  const thesis = c.req.query("thesis") || "";
  const investors = listInvestors({ thesis: thesis || undefined });
  return c.html(kanbanBoard(investors));
});

pages.get("/search-table", (c) => {
  const q = (c.req.query("q") || "").toLowerCase();
  let investors = listInvestors();
  if (q) {
    investors = investors.filter(
      (inv) =>
        inv.name.toLowerCase().includes(q) ||
        inv.thesis.some((t) => t.toLowerCase().includes(q))
    );
  }
  return c.html(investorTable(investors));
});

pages.get("/filter-table", (c) => {
  const thesis = c.req.query("thesis") || "";
  const investors = listInvestors({ thesis: thesis || undefined });
  return c.html(investorTable(investors));
});

export default pages;
