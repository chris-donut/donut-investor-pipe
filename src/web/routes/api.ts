import { Hono } from "hono";
import {
  getInvestor,
  listInvestors,
  updateInvestor,
  countByStatus,
  exportInvestorsJson,
} from "../../database/investors";
import { getOutreachStats, listInteractionsByInvestor } from "../../database/interactions";
import { scoreInvestor, runMatchingAndUpdate } from "../../matching/engine";
import {
  generateColdEmail,
  generateTwitterDM,
  generateTalkingPoints,
  saveOutreach,
  saveOutreachAsInteraction,
} from "../../outreach/generator";
import {
  investorDetail,
  kanbanBoard,
  generatedContentView,
} from "../views/components";

const api = new Hono();

// Get investor detail (htmx partial)
api.get("/investors/:id", (c) => {
  const investor = getInvestor(c.req.param("id"));
  if (!investor) return c.text("Investor not found", 404);
  const matchResult = scoreInvestor(investor);
  return c.html(investorDetail(investor, matchResult));
});

// Update investor status (htmx partial → returns kanban board)
api.post("/investors/:id/status", async (c) => {
  const body = await c.req.parseBody();
  const status = body.status as string;
  const id = c.req.param("id");
  updateInvestor(id, { status: status as any });
  const investors = listInvestors();
  return c.html(kanbanBoard(investors));
});

// Generate outreach content
api.post("/investors/:id/generate/:type", async (c) => {
  const investor = getInvestor(c.req.param("id"));
  if (!investor) return c.text("Investor not found", 404);

  const type = c.req.param("type");

  if (!process.env.ANTHROPIC_API_KEY) {
    return c.html(
      generatedContentView(
        "ANTHROPIC_API_KEY not set. Set it in your environment to enable AI-generated outreach.",
        type
      )
    );
  }

  try {
    let outreach;
    switch (type) {
      case "cold_email":
        outreach = await generateColdEmail(investor);
        break;
      case "twitter_dm":
        outreach = await generateTwitterDM(investor);
        break;
      case "talking_points":
        outreach = await generateTalkingPoints(investor);
        break;
      default:
        return c.text("Unknown outreach type", 400);
    }
    saveOutreach(outreach);
    saveOutreachAsInteraction(outreach, investor.id);
    return c.html(generatedContentView(outreach.content, type));
  } catch (err: any) {
    return c.html(
      generatedContentView(`Error generating content: ${err.message}`, type)
    );
  }
});

// Run matching engine
api.post("/match", (c) => {
  const results = runMatchingAndUpdate();
  return c.json({ matched: results.length, topScore: results[0]?.score });
});

// JSON API endpoints
api.get("/investors", (c) => {
  const status = c.req.query("status");
  const thesis = c.req.query("thesis");
  const minScore = c.req.query("minScore");
  const investors = listInvestors({
    status: status as any,
    thesis: thesis || undefined,
    minScore: minScore ? parseInt(minScore) : undefined,
  });
  return c.json(investors);
});

api.get("/stats", (c) => {
  const statusCounts = countByStatus();
  const outreachStats = getOutreachStats();
  return c.json({ statusCounts, outreachStats });
});

api.get("/export", (c) => {
  const json = exportInvestorsJson();
  c.header("Content-Type", "application/json");
  c.header("Content-Disposition", "attachment; filename=investors-export.json");
  return c.body(json);
});

api.get("/investors/:id/interactions", (c) => {
  const interactions = listInteractionsByInvestor(c.req.param("id"));
  return c.json(interactions);
});

export default api;
