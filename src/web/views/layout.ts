export function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Donut Investor Pipeline</title>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <style>
    :root {
      --bg: #0f1117;
      --surface: #1a1d27;
      --border: #2a2d3a;
      --text: #e1e4ed;
      --text-dim: #8b8fa3;
      --accent: #6366f1;
      --accent-hover: #818cf8;
      --green: #22c55e;
      --yellow: #eab308;
      --red: #ef4444;
      --blue: #3b82f6;
      --orange: #f97316;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    .nav {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .nav-brand {
      font-weight: 700;
      font-size: 18px;
      color: var(--accent);
      text-decoration: none;
    }
    .nav a {
      color: var(--text-dim);
      text-decoration: none;
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 6px;
      transition: all 0.15s;
    }
    .nav a:hover, .nav a.active {
      color: var(--text);
      background: var(--border);
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 24px; margin-bottom: 16px; }
    h2 { font-size: 18px; margin-bottom: 12px; }

    /* Stats bar */
    .stats {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px 20px;
      min-width: 140px;
    }
    .stat-card .label { font-size: 12px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-card .value { font-size: 28px; font-weight: 700; margin-top: 4px; }

    /* Kanban */
    .kanban {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .kanban-col {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      min-height: 200px;
    }
    .kanban-col h3 {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-dim);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .kanban-col h3 .count {
      background: var(--border);
      border-radius: 10px;
      padding: 1px 8px;
      font-size: 12px;
    }

    /* Investor cards */
    .investor-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .investor-card:hover { border-color: var(--accent); }
    .investor-card .name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .investor-card .meta { font-size: 12px; color: var(--text-dim); }
    .investor-card .tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; }
    .tag {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--border);
      color: var(--text-dim);
    }
    .tag.ai { background: #6366f120; color: #818cf8; }
    .tag.defi { background: #22c55e20; color: #22c55e; }
    .tag.solana { background: #9945ff20; color: #b87fff; }
    .tag.trading { background: #f9731620; color: #f97316; }
    .tag.infra { background: #3b82f620; color: #3b82f6; }

    .score-badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      margin-bottom: 4px;
    }
    .score-high { background: #22c55e20; color: #22c55e; }
    .score-mid { background: #eab30820; color: #eab308; }
    .score-low { background: #ef444420; color: #ef4444; }

    /* Status select */
    .status-select {
      font-size: 12px;
      background: var(--border);
      color: var(--text);
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      margin-top: 6px;
    }

    /* Filters bar */
    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      align-items: center;
      flex-wrap: wrap;
    }
    .filters input, .filters select {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px 12px;
      color: var(--text);
      font-size: 14px;
    }
    .filters input:focus, .filters select:focus {
      outline: none;
      border-color: var(--accent);
    }

    /* Detail view */
    .detail-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 24px;
      margin-top: 16px;
    }
    .detail-panel h2 { margin-bottom: 16px; }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .detail-field .label { font-size: 12px; color: var(--text-dim); text-transform: uppercase; }
    .detail-field .value { margin-top: 2px; }

    .score-breakdown {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 12px;
    }
    .score-item {
      background: var(--bg);
      border-radius: 6px;
      padding: 8px;
      text-align: center;
    }
    .score-item .score-label { font-size: 11px; color: var(--text-dim); }
    .score-item .score-val { font-size: 18px; font-weight: 700; }

    .reasons-list { list-style: none; padding: 0; margin-top: 8px; }
    .reasons-list li {
      padding: 4px 0;
      font-size: 13px;
      color: var(--text-dim);
    }
    .reasons-list li::before { content: "→ "; color: var(--accent); }

    .btn {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
      text-decoration: none;
    }
    .btn-primary { background: var(--accent); color: white; }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
    .btn-outline:hover { border-color: var(--accent); color: var(--accent); }

    .btn-group { display: flex; gap: 8px; margin-top: 16px; }

    /* Table */
    table { width: 100%; border-collapse: collapse; }
    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
    }
    th { color: var(--text-dim); font-weight: 500; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    tr:hover td { background: var(--surface); }

    .htmx-indicator { display: none; }
    .htmx-request .htmx-indicator { display: inline; }
    .htmx-request.htmx-indicator { display: inline; }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="/" class="nav-brand">Donut Pipeline</a>
    <a href="/">Kanban</a>
    <a href="/list">List</a>
    <a href="/analytics">Analytics</a>
  </nav>
  <div class="container">
    ${body}
  </div>
</body>
</html>`;
}
