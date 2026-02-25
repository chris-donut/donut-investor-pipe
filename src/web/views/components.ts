import type { Investor } from "../../database/investors";

function esc(s: string): string { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function fmtAum(aum: number): string {
  if (aum >= 100) return `$${Math.round(aum)}B`;
  if (aum >= 1) return `$${aum.toFixed(1)}B`;
  return `$${Math.round(aum * 1000)}M`;
}

function fmtCheck(min: number, max: number): string {
  const f = (n: number) => n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `$${Math.round(n/1e6)}M` : `$${Math.round(n/1e3)}K`;
  return `${f(min)}–${f(max)}`;
}

function typeBadge(t: string): string {
  const colors: Record<string,string> = {
    vc: "#6366f1", growth_equity: "#8b5cf6", crypto_fund: "#f59e0b",
    sovereign: "#22c55e", angel: "#ec4899", accelerator: "#06b6d4", family_office: "#64748b"
  };
  const labels: Record<string,string> = {
    vc: "VC", growth_equity: "Growth", crypto_fund: "Crypto",
    sovereign: "Sovereign", angel: "Angel", accelerator: "Accel", family_office: "Family"
  };
  const c = colors[t] || "#64748b";
  return `<span style="background:${c}18;color:${c};font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600">${labels[t]||t}</span>`;
}

function statusBadge(s: string): string {
  const colors: Record<string,string> = {
    researching: "#64748b", to_reach: "#3b82f6", reached_out: "#f59e0b",
    in_conversation: "#22c55e", passed: "#ef4444", committed: "#10b981"
  };
  const labels: Record<string,string> = {
    researching: "Research", to_reach: "To Reach", reached_out: "Reached",
    in_conversation: "Talking", passed: "Passed", committed: "Commit"
  };
  const c = colors[s] || "#64748b";
  return `<span style="background:${c}18;color:${c};font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600">${labels[s]||s}</span>`;
}

function lastDeal(i: Investor): string {
  if (!i.recent_deals?.length) return '<span style="color:#4b5563">—</span>';
  const d = i.recent_deals[0];
  return `<span style="color:#e1e4ed;font-weight:500">${esc(d.company)}</span> <span style="color:#8b8fa3">${esc(d.amount)} ${esc(d.date)}</span>`;
}

function keyContact(i: Investor): string {
  if (!i.partners?.length) return '<span style="color:#4b5563">—</span>';
  const p = i.partners[0];
  const link = p.linkedin ? `<a href="${esc(p.linkedin)}" target="_blank" style="color:#6366f1;text-decoration:none;font-size:10px" title="${esc(p.title)}">↗</a>` : '';
  return `<span style="color:#e1e4ed">${esc(p.name)}</span> ${link}`;
}

function coverage(i: Investor): string {
  if (!i.recent_coverage?.length) return '<span style="color:#4b5563">—</span>';
  const c = i.recent_coverage[0];
  return `<span style="color:#8b8fa3;font-size:9px" title="${esc(c.title)}">${esc(c.title.substring(0,40))}${c.title.length > 40 ? '…' : ''}</span> <span style="color:#4b5563;font-size:9px">${esc(c.source)} ${esc(c.date)}</span>`;
}

function scoreBar(score: number): string {
  const c = score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
  return `<div style="display:flex;align-items:center;gap:4px"><div style="width:30px;height:6px;background:#1f2230;border-radius:3px;overflow:hidden"><div style="width:${score}%;height:100%;background:${c};border-radius:3px"></div></div><span style="font-family:'SF Mono',Monaco,monospace;font-size:9px;color:${c};font-weight:600">${score}</span></div>`;
}

function generatePitchPoints(i: Investor): string[] {
  const points: string[] = [];
  const thesisStr = i.thesis.join(" ").toLowerCase();

  // Deal-based pitch
  const cryptoDeals = i.recent_deals.filter(d => {
    const s = `${d.company} ${d.relevance || ""}`.toLowerCase();
    return ["crypto", "defi", "blockchain", "trading", "web3", "ai"].some(kw => s.includes(kw));
  });
  if (cryptoDeals.length > 0) {
    points.push(`You backed ${cryptoDeals[0].company} — Donut is building the AI trading layer for on-chain perps, extending that thesis.`);
  }

  // Thesis-based pitch
  const thesisMap: Record<string,string> = {
    "ai": "AI-powered trading signals with real-time market analysis",
    "crypto": "on-chain execution across Solana DEXs with MEV protection",
    "defi": "DeFi aggregation and yield optimization across protocols",
    "fintech": "next-gen trading terminal for the crypto-native generation",
    "trading": "perpetual swap optimization with automated risk management"
  };
  for (const [kw, pitch] of Object.entries(thesisMap)) {
    if (thesisStr.includes(kw) && points.length < 3) {
      points.push(`Your ${kw.toUpperCase()} thesis aligns — Donut delivers ${pitch}.`);
      break;
    }
  }

  // Partner-based pitch
  const cryptoPartner = i.partners.find(p => {
    const f = p.focus?.join(" ").toLowerCase() || "";
    return ["defi", "crypto", "blockchain", "web3", "trading"].some(kw => f.includes(kw));
  });
  if (cryptoPartner && points.length < 3) {
    const focus = cryptoPartner.focus?.find(f =>
      ["defi", "crypto", "blockchain", "web3", "trading"].some(kw => f.toLowerCase().includes(kw))
    ) || "crypto";
    points.push(`${cryptoPartner.name} focuses on ${focus} — Donut's AI-powered Solana trading terminal fits this thesis.`);
  }

  // Coverage-based pitch
  if (i.recent_coverage?.length > 0 && points.length < 3) {
    const rc = i.recent_coverage.find(c => {
      const s = c.title.toLowerCase();
      return ["ai", "crypto", "trading", "defi", "blockchain"].some(kw => s.includes(kw));
    });
    if (rc) {
      points.push(`Recent coverage: "${rc.title.substring(0, 50)}..." connects to Donut's AI-first crypto trading vision.`);
    }
  }

  if (points.length === 0) {
    points.push(`Donut is building the AI-powered trading terminal for Solana — combining AI signals with on-chain execution.`);
  }

  return points.slice(0, 3);
}

function priorityClass(score: number): string {
  if (score >= 80) return 'priority-high';
  if (score >= 60) return 'priority-med';
  return '';
}

export function dashboardPage(investors: Investor[], query: Record<string,string> = {}): string {
  const totalAum = investors.reduce((s,i) => s + i.aum, 0);
  const types: Record<string,number> = {};
  investors.forEach(i => { types[i.type] = (types[i.type]||0) + 1; });
  const statuses: Record<string,number> = {};
  investors.forEach(i => { statuses[i.status] = (statuses[i.status]||0) + 1; });
  const dealsCount = investors.filter(i => i.recent_deals?.length > 0).length;
  const currentSort = query.sort || 'aum';
  const currentType = query.type || '';
  const currentSearch = query.search || '';
  const highPriority = investors.filter(i => i.score >= 80).length;
  const medPriority = investors.filter(i => i.score >= 60 && i.score < 80).length;
  const avgScore = investors.length > 0 ? Math.round(investors.reduce((s,i) => s + i.score, 0) / investors.length) : 0;

  // Compute pitch points server-side
  const pitchMap: Record<string, string[]> = {};
  investors.forEach(i => { pitchMap[i.id] = generatePitchPoints(i); });

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Investor Pipeline — 100 VCs by AUM</title>
<style>
:root{--bg:#0f1117;--s:#1a1d27;--b:#2a2d3a;--t:#e1e4ed;--d:#8b8fa3;--a:#6366f1;--g:#22c55e;--y:#eab308;--r:#ef4444}
*{margin:0;padding:0;box-sizing:border-box}
body{font:11px/1.3 -apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--t)}
.top{display:flex;align-items:center;gap:8px;padding:6px 12px;background:var(--s);border-bottom:1px solid var(--b);flex-wrap:wrap}
.top h1{font-size:14px;white-space:nowrap;color:var(--a)}
.home-link{color:var(--d);text-decoration:none;font-size:11px;display:flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;transition:all .15s}
.home-link:hover{background:var(--bg);color:var(--t)}
.sep{width:1px;height:16px;background:var(--b)}
.kv{font-size:10px;color:var(--d);white-space:nowrap}
.kv b{color:var(--t);font-family:'SF Mono',Monaco,monospace;font-size:12px}
.kv.hi b{color:var(--a)}
.tb{display:inline-flex;align-items:center;gap:3px;font-size:9px;padding:1px 6px;border-radius:3px;font-weight:600}
.filters{display:flex;gap:6px;padding:4px 12px;align-items:center;border-bottom:1px solid var(--b);background:var(--s)}
.filters select,.filters input{background:var(--bg);border:1px solid var(--b);border-radius:3px;padding:2px 6px;color:var(--t);font-size:10px}
.filters label{font-size:9px;color:var(--d);text-transform:uppercase;letter-spacing:.5px}
.main{display:flex;height:calc(100vh - 64px);overflow:hidden}
.tbl-wrap{flex:1;overflow:auto}
table{width:100%;border-collapse:collapse;font-size:10px}
thead{position:sticky;top:0;z-index:10}
th{background:var(--s);color:var(--d);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;padding:4px 6px;border-bottom:1px solid var(--b);text-align:left;white-space:nowrap;cursor:pointer;user-select:none}
th:hover{color:var(--t)}
th.sorted{color:var(--a)}
td{padding:3px 6px;border-bottom:1px solid #1f2230;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}
tr:hover{background:var(--s)}
tr.sel{background:var(--s);border-left:2px solid var(--a)}
tr.priority-high{background:#f59e0b08;border-left:3px solid #f59e0b}
tr.priority-high:hover{background:#f59e0b12}
tr.priority-med{background:#3b82f608;border-left:3px solid #3b82f6}
tr.priority-med:hover{background:#3b82f612}
tr.sel.priority-high{border-left:3px solid #f59e0b}
tr.sel.priority-med{border-left:3px solid #3b82f6}
.rank{font-family:'SF Mono',Monaco,monospace;color:var(--d);font-size:10px;text-align:center;width:30px}
.aum{font-family:'SF Mono',Monaco,monospace;font-weight:700;color:var(--g)}
.loc{color:var(--d);font-size:10px}
.fund{color:var(--d);font-size:9px}
a{color:var(--a);text-decoration:none}
a:hover{text-decoration:underline}
.dp{width:400px;overflow-y:auto;padding:10px;background:var(--s);border-left:1px solid var(--b);font-size:11px;display:none}
.dp.open{display:block}
.dp h3{font-size:14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
.dp .cls{cursor:pointer;color:var(--d);font-size:18px;line-height:1}
.dp .f{margin-bottom:8px}
.dp .l{font-size:9px;color:var(--d);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.dp .v{word-break:break-word}
.dp .tag{display:inline-block;background:var(--bg);border:1px solid var(--b);border-radius:3px;padding:1px 5px;font-size:9px;margin:1px}
.dp .deal-row{display:flex;gap:6px;padding:3px 0;border-bottom:1px solid var(--b);font-size:10px}
.dp .deal-row:last-child{border:none}
.dp .partner-card{background:var(--bg);border:1px solid var(--b);border-radius:4px;padding:6px;margin-bottom:4px}
.dp .partner-card .pname{font-weight:600;font-size:11px}
.dp .partner-card .ptitle{color:var(--d);font-size:10px}
.dp .relevance{background:#6366f108;border:1px solid #6366f130;border-radius:4px;padding:6px;font-size:10px;color:#a5b4fc;line-height:1.4}
.dp .coverage-item{font-size:10px;padding:3px 0;border-bottom:1px solid var(--b)}
.dp .empty{color:var(--d);font-style:italic;text-align:center;padding:30px}
.pitch-section{background:#f59e0b08;border:1px solid #f59e0b30;border-radius:6px;padding:8px;margin-bottom:8px}
.pitch-section .pitch-title{font-size:10px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;display:flex;align-items:center;gap:4px}
.pitch-section .pitch-point{font-size:10px;color:var(--t);line-height:1.5;padding:4px 0;border-bottom:1px solid #f59e0b15}
.pitch-section .pitch-point:last-child{border:none}
.pitch-section .pitch-bullet{color:#f59e0b;font-weight:700;margin-right:4px}
.score-display{display:flex;align-items:center;gap:8px;margin-bottom:2px}
.score-big{font-family:'SF Mono',Monaco,monospace;font-size:24px;font-weight:800}
.score-label{font-size:10px;color:var(--d)}
.status-select{background:var(--bg);border:1px solid var(--b);border-radius:4px;padding:3px 8px;color:var(--t);font-size:11px;cursor:pointer;width:100%}
.status-select:focus{border-color:var(--a);outline:none}
</style>
</head><body>
<div class="top">
  <a href="http://100.85.68.98:3000/" class="home-link">← CEO Intel</a>
  <span class="sep"></span>
  <h1>Investor Pipeline</h1>
  <span class="sep"></span>
  <span class="kv hi"><b>${investors.length}</b> investors</span>
  <span class="kv" style="color:var(--g)"><b>$${totalAum.toFixed(0)}B</b> AUM</span>
  <span class="kv" style="color:#f59e0b"><b>${highPriority}</b> high priority</span>
  <span class="kv" style="color:#3b82f6"><b>${medPriority}</b> medium</span>
  <span class="kv"><b>${avgScore}</b> avg score</span>
  <span class="sep"></span>
  <span class="kv"><b>${types['vc']||0}</b> VC</span>
  <span class="kv"><b>${types['crypto_fund']||0}</b> Crypto</span>
  <span class="kv"><b>${types['growth_equity']||0}</b> Growth</span>
  <span style="margin-left:auto">
    <span class="kv"><b>${statuses['researching']||0}</b> research</span>
    <span class="kv" style="color:var(--y)"><b>${statuses['reached_out']||0}</b> reached</span>
    <span class="kv" style="color:var(--g)"><b>${statuses['in_conversation']||0}</b> talking</span>
    <span class="kv" style="color:#10b981"><b>${statuses['committed']||0}</b> commit</span>
  </span>
</div>
<div class="filters">
  <label>Type</label>
  <select onchange="location.href='?type='+this.value+'&sort=${currentSort}&search=${currentSearch}'">
    <option value="">All</option>
    <option value="vc" ${currentType==='vc'?'selected':''}>VC (${types['vc']||0})</option>
    <option value="crypto_fund" ${currentType==='crypto_fund'?'selected':''}>Crypto (${types['crypto_fund']||0})</option>
    <option value="growth_equity" ${currentType==='growth_equity'?'selected':''}>Growth (${types['growth_equity']||0})</option>
    <option value="sovereign" ${currentType==='sovereign'?'selected':''}>Sovereign (${types['sovereign']||0})</option>
    <option value="angel" ${currentType==='angel'?'selected':''}>Angel (${types['angel']||0})</option>
    <option value="accelerator" ${currentType==='accelerator'?'selected':''}>Accel (${types['accelerator']||0})</option>
  </select>
  <label>Sort</label>
  <select onchange="location.href='?sort='+this.value+'&type=${currentType}&search=${currentSearch}'">
    <option value="aum" ${currentSort==='aum'?'selected':''}>AUM (high→low)</option>
    <option value="score" ${currentSort==='score'?'selected':''}>Score (high→low)</option>
    <option value="rank" ${currentSort==='rank'?'selected':''}>Rank (#1→#100)</option>
    <option value="name" ${currentSort==='name'?'selected':''}>Name (A→Z)</option>
  </select>
  <label>Priority</label>
  <select id="priorityFilter" onchange="filterPriority(this.value)">
    <option value="all">All</option>
    <option value="high">High (80+)</option>
    <option value="medium">Medium (60-79)</option>
  </select>
  <label>Search</label>
  <input type="text" placeholder="name, location, thesis..." value="${esc(currentSearch)}" onkeydown="if(event.key==='Enter')location.href='?search='+this.value+'&sort=${currentSort}&type=${currentType}'" style="width:140px">
  <span style="margin-left:auto;font-size:9px;color:var(--d)">Click row for detail</span>
</div>
<div class="main">
  <div class="tbl-wrap">
    <table>
      <thead><tr>
        <th style="width:30px" class="${currentSort==='rank'?'sorted':''}">#</th>
        <th style="min-width:160px">Investor</th>
        <th style="width:60px" class="${currentSort==='score'?'sorted':''}">Score</th>
        <th style="width:65px" class="${currentSort==='aum'?'sorted':''}">AUM</th>
        <th style="width:100px">Location</th>
        <th style="width:90px">Latest Fund</th>
        <th style="width:180px">Last Deal</th>
        <th style="width:140px">Key Contact</th>
        <th style="width:200px">Recent Coverage</th>
        <th style="width:60px">Status</th>
      </tr></thead>
      <tbody>
${investors.map(i => `        <tr onclick="sel('${i.id}')" id="r-${i.id}" class="${priorityClass(i.score)}" data-score="${i.score}" style="cursor:pointer">
          <td class="rank">${i.aum_rank}</td>
          <td>${typeBadge(i.type)} <strong>${esc(i.name)}</strong> <span style="color:#4b5563;font-size:9px">${i.thesis.slice(0,3).join(' · ')}</span></td>
          <td>${scoreBar(i.score)}</td>
          <td class="aum">${fmtAum(i.aum)}</td>
          <td class="loc">${esc(i.location)}</td>
          <td class="fund">${esc(i.fund_size.substring(0,25))}</td>
          <td>${lastDeal(i)}</td>
          <td>${keyContact(i)}</td>
          <td>${coverage(i)}</td>
          <td id="st-${i.id}">${statusBadge(i.status)}</td>
        </tr>`).join('\n')}
      </tbody>
    </table>
  </div>
  <div class="dp" id="dp"><div class="empty">Click any investor row to view details</div></div>
</div>
<script>
const investors = ${JSON.stringify(investors.map(i => ({
  id:i.id, name:i.name, type:i.type, aum:i.aum, aum_rank:i.aum_rank,
  location:i.location, thesis:i.thesis, stage:i.stage,
  check_size:i.check_size, portfolio:i.portfolio, partners:i.partners,
  geo:i.geo, status:i.status, score:i.score, notes:i.notes,
  recent_deals:i.recent_deals, donut_relevance:i.donut_relevance,
  fund_size:i.fund_size, recent_coverage:i.recent_coverage,
  pitch_points:pitchMap[i.id]||[]
})))};

let selRow = null;

function filterPriority(val) {
  document.querySelectorAll('tbody tr').forEach(tr => {
    const score = parseInt(tr.dataset.score || '0');
    if (val === 'all') tr.style.display = '';
    else if (val === 'high') tr.style.display = score >= 80 ? '' : 'none';
    else if (val === 'medium') tr.style.display = (score >= 60 && score < 80) ? '' : 'none';
  });
}

function changeStatus(id, newStatus) {
  fetch('/api/investors/' + id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  }).then(r => r.json()).then(() => {
    const inv = investors.find(x => x.id === id);
    if (inv) inv.status = newStatus;
    const statusColors = {researching:'#64748b',to_reach:'#3b82f6',reached_out:'#f59e0b',in_conversation:'#22c55e',passed:'#ef4444',committed:'#10b981'};
    const statusLabels = {researching:'Research',to_reach:'To Reach',reached_out:'Reached',in_conversation:'Talking',passed:'Passed',committed:'Commit'};
    const c = statusColors[newStatus] || '#64748b';
    const l = statusLabels[newStatus] || newStatus;
    const cell = document.getElementById('st-'+id);
    if (cell) cell.innerHTML = '<span style="background:'+c+'18;color:'+c+';font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600">'+l+'</span>';
  });
}

function sel(id) {
  const i = investors.find(x => x.id === id);
  if (!i) return;
  if (selRow) document.getElementById('r-'+selRow)?.classList.remove('sel');
  selRow = id;
  document.getElementById('r-'+id)?.classList.add('sel');
  const dp = document.getElementById('dp');
  dp.classList.add('open');
  const fmtM = n => n>=1e9?'$'+(n/1e9).toFixed(1)+'B':n>=1e6?'$'+Math.round(n/1e6)+'M':'$'+Math.round(n/1e3)+'K';
  const scoreColor = s => s >= 80 ? '#22c55e' : s >= 50 ? '#eab308' : '#ef4444';
  const scoreLabel = s => s >= 80 ? 'HIGH PRIORITY' : s >= 60 ? 'MEDIUM PRIORITY' : 'LOW PRIORITY';
  dp.innerHTML = \`
    <h3>\${i.name}<span class="cls" onclick="document.getElementById('dp').classList.remove('open')">✕</span></h3>
    <div class="f">
      <div class="score-display">
        <span class="score-big" style="color:\${scoreColor(i.score)}">\${i.score}</span>
        <div><div style="font-size:10px;font-weight:700;color:\${scoreColor(i.score)}">\${scoreLabel(i.score)}</div><div class="score-label">Donut Fit Score</div></div>
      </div>
    </div>
    <div class="f"><div class="l">Status</div>
      <select class="status-select" onchange="changeStatus('\${i.id}', this.value)">
        <option value="researching" \${i.status==='researching'?'selected':''}>Researching</option>
        <option value="to_reach" \${i.status==='to_reach'?'selected':''}>To Reach Out</option>
        <option value="reached_out" \${i.status==='reached_out'?'selected':''}>Reached Out</option>
        <option value="in_conversation" \${i.status==='in_conversation'?'selected':''}>In Conversation</option>
        <option value="committed" \${i.status==='committed'?'selected':''}>Committed</option>
        <option value="passed" \${i.status==='passed'?'selected':''}>Passed</option>
      </select>
    </div>
    \${i.pitch_points && i.pitch_points.length > 0 ? '<div class="pitch-section"><div class="pitch-title">Pitch Strategy</div>' + i.pitch_points.map(p => '<div class="pitch-point"><span class="pitch-bullet">→</span> '+p+'</div>').join('') + '</div>' : ''}
    <div class="f"><div class="l">Type / Rank / AUM</div><div class="v">\${i.type.replace('_',' ')} · #\${i.aum_rank} · $\${i.aum}B · \${i.location}</div></div>
    <div class="f"><div class="l">Check Size</div><div class="v">\${fmtM(i.check_size.min)} – \${fmtM(i.check_size.max)}</div></div>
    <div class="f"><div class="l">Latest Fund</div><div class="v">\${i.fund_size || '—'}</div></div>
    <div class="f"><div class="l">Thesis</div><div class="v">\${i.thesis.map(t=>'<span class="tag">'+t+'</span>').join(' ')}</div></div>
    <div class="f"><div class="l">Stage</div><div class="v">\${i.stage.map(s=>'<span class="tag">'+s+'</span>').join(' ')}</div></div>
    <div class="f"><div class="l">Geo</div><div class="v">\${i.geo.join(', ')}</div></div>
    \${i.donut_relevance ? '<div class="f"><div class="l">Why Donut?</div><div class="relevance">'+i.donut_relevance+'</div></div>' : ''}
    <div class="f"><div class="l">Portfolio</div><div class="v">\${i.portfolio.slice(0,8).map(p=>'<span class="tag">'+p+'</span>').join(' ')}</div></div>
    <div class="f"><div class="l">Recent Deals</div><div class="v">\${i.recent_deals.length ? i.recent_deals.map(d=>'<div class="deal-row"><strong>'+d.company+'</strong> <span style="color:var(--d)">'+d.round+' · '+d.amount+' · '+d.date+'</span></div>').join('') : '—'}</div></div>
    <div class="f"><div class="l">Key Contacts</div><div class="v">\${i.partners.map(p=>'<div class="partner-card"><div class="pname">'+p.name+(p.linkedin?' <a href="'+p.linkedin+'" target="_blank" style="color:var(--a)">LinkedIn ↗</a>':'')+'</div><div class="ptitle">'+p.title+'</div>'+(p.focus?'<div style="margin-top:2px">'+p.focus.map(f=>'<span class="tag">'+f+'</span>').join(' ')+'</div>':'')+'</div>').join('')}</div></div>
    <div class="f"><div class="l">Recent Coverage</div><div class="v">\${i.recent_coverage.length ? i.recent_coverage.map(c=>'<div class="coverage-item"><strong>'+c.title+'</strong> <span style="color:var(--d)">'+c.source+' · '+c.date+'</span></div>').join('') : '—'}</div></div>
    \${i.notes ? '<div class="f"><div class="l">Notes</div><div class="v" style="color:var(--d);font-size:10px">'+i.notes+'</div></div>' : ''}
  \`;
}
</script>
</body></html>`;
}

export function investorApiResponse(investors: Investor[]): object[] {
  return investors.map(i => ({
    id: i.id, name: i.name, type: i.type, aum: i.aum, aum_rank: i.aum_rank,
    location: i.location, thesis: i.thesis, stage: i.stage, check_size: i.check_size,
    portfolio: i.portfolio, partners: i.partners, geo: i.geo, status: i.status,
    score: i.score, recent_deals: i.recent_deals, donut_relevance: i.donut_relevance,
    fund_size: i.fund_size, recent_coverage: i.recent_coverage, notes: i.notes
  }));
}
