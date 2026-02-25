import { listInvestors, getInvestor, updateInvestor, countByStatus, countByType, totalAum } from "./database/investors";
import { dashboardPage, investorApiResponse } from "./web/views/components";

const server = Bun.serve({
  port: 3456,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Health check
    if (path === "/health") {
      const stats = countByStatus();
      const types = countByType();
      const aum = totalAum();
      return Response.json({ status: "ok", investors: Object.values(stats).reduce((a,b)=>a+b,0), aum: `$${aum.toFixed(0)}B`, types, pipeline: stats });
    }

    // API: list investors
    if (path === "/api/investors" && req.method === "GET") {
      const type = url.searchParams.get("type") || undefined;
      const status = url.searchParams.get("status") || undefined;
      const search = url.searchParams.get("search") || undefined;
      const sort = url.searchParams.get("sort") || "aum";
      const dir = url.searchParams.get("dir") || "desc";
      const investors = listInvestors({ type, status, search, sort, dir });
      return Response.json(investorApiResponse(investors));
    }

    // API: single investor
    if (path.startsWith("/api/investors/") && req.method === "GET") {
      const id = path.replace("/api/investors/", "");
      const inv = getInvestor(id);
      if (!inv) return new Response("Not found", { status: 404 });
      return Response.json(inv);
    }

    // API: update investor
    if (path.startsWith("/api/investors/") && req.method === "PATCH") {
      const id = path.replace("/api/investors/", "");
      const body = await req.json();
      updateInvestor(id, body);
      return Response.json({ ok: true });
    }

    // Dashboard HTML
    if (path === "/" || path === "/dashboard") {
      const type = url.searchParams.get("type") || undefined;
      const sort = url.searchParams.get("sort") || "aum";
      const search = url.searchParams.get("search") || undefined;
      const investors = listInvestors({ type, sort, search });
      const query: Record<string,string> = {};
      if (type) query.type = type;
      if (sort) query.sort = sort;
      if (search) query.search = search;
      const html = dashboardPage(investors, query);
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Investor Pipeline running on http://localhost:${server.port}`);
console.log(`Dashboard: http://localhost:${server.port}/`);
console.log(`API: http://localhost:${server.port}/api/investors`);
console.log(`Health: http://localhost:${server.port}/health`);
