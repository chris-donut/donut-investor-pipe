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

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Investor Pipeline — 100 VCs by AUM</title>
<style>
:root{--bg:#0f1117;--s:#1a1d27;--b:#2a2d3a;--t:#e1e4ed;--d:#8b8fa3;--a:#6366f1;--g:#22c55e;--y:#eab308;--r:#ef4444}
*{margin:0;padding:0;box-sizing:border-box}
body{font:11px/1.3 -apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--t)}
.top{display:flex;align-items:center;gap:8px;padding:6px 12px;background:var(--s);border-bottom:1px solid var(--b);flex-wrap:wrap}
.top h1{font-size:14px;white-space:nowrap;color:var(--a)}
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
.rank{font-family:'SF Mono',Monaco,monospace;color:var(--d);font-size:10px;text-align:center;width:30px}
.aum{font-family:'SF Mono',Monaco,monospace;font-weight:700;color:var(--g)}
.loc{color:var(--d);font-size:10px}
.fund{color:var(--d);font-size:9px}
a{color:var(--a);text-decoration:none}
a:hover{text-decoration:underline}
.dp{width:380px;overflow-y:auto;padding:10px;background:var(--s);border-left:1px solid var(--b);font-size:11px;display:none}
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
</style>
</head><body>
<div class="top">
  <h1>Investor Pipeline</h1>
  <span class="sep"></span>
  <span class="kv hi"><b>${investors.length}</b> investors</span>
  <span class="kv" style="color:var(--g)"><b>$${totalAum.toFixed(0)}B</b> AUM tracked</span>
  <span class="sep"></span>
  <span class="kv"><b>${types['vc']||0}</b> VC</span>
  <span class="kv"><b>${types['crypto_fund']||0}</b> Crypto</span>
  <span class="kv"><b>${types['growth_equity']||0}</b> Growth</span>
  <span class="kv"><b>${types['sovereign']||0}</b> Sovereign</span>
  <span class="kv"><b>${types['angel']||0}</b> Angel</span>
  <span class="sep"></span>
  <span class="kv"><b>${dealsCount}</b> w/ deals</span>
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
    <option value="rank" ${currentSort==='rank'?'selected':''}>Rank (#1→#100)</option>
    <option value="name" ${currentSort==='name'?'selected':''}>Name (A→Z)</option>
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
        <th style="width:65px" class="${currentSort==='aum'?'sorted':''}">AUM</th>
        <th style="width:110px">Location</th>
        <th style="width:110px">Latest Fund</th>
        <th style="width:200px">Last Deal</th>
        <th style="width:150px">Key Contact</th>
        <th style="width:220px">Recent Coverage</th>
        <th style="width:60px">Status</th>
      </tr></thead>
      <tbody>
${investors.map(i => `        <tr onclick="sel('${i.id}')" id="r-${i.id}" style="cursor:pointer">
          <td class="rank">${i.aum_rank}</td>
          <td>${typeBadge(i.type)} <strong>${esc(i.name)}</strong> <span style="color:#4b5563;font-size:9px">${i.thesis.slice(0,3).join(' · ')}</span></td>
          <td class="aum">${fmtAum(i.aum)}</td>
          <td class="loc">${esc(i.location)}</td>
          <td class="fund">${esc(i.fund_size.substring(0,30))}</td>
          <td>${lastDeal(i)}</td>
          <td>${keyContact(i)}</td>
          <td>${coverage(i)}</td>
          <td>${statusBadge(i.status)}</td>
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
  fund_size:i.fund_size, recent_coverage:i.recent_coverage
})))};

let selRow = null;
function sel(id) {
  const i = investors.find(x => x.id === id);
  if (!i) return;
  if (selRow) document.getElementById('r-'+selRow)?.classList.remove('sel');
  selRow = id;
  document.getElementById('r-'+id)?.classList.add('sel');
  const dp = document.getElementById('dp');
  dp.classList.add('open');
  const fmtM = n => n>=1e9?'$'+(n/1e9).toFixed(1)+'B':n>=1e6?'$'+Math.round(n/1e6)+'M':'$'+Math.round(n/1e3)+'K';
  dp.innerHTML = \`
    <h3>\${i.name}<span class="cls" onclick="document.getElementById('dp').classList.remove('open')">✕</span></h3>
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
