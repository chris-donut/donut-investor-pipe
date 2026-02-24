import { Hono } from "hono";
import { logger } from "hono/logger";
import api from "./routes/api";
import pages from "./routes/pages";

const app = new Hono();

app.use("*", logger());

// API routes
app.route("/api", api);

// Page routes
app.route("/", pages);

const port = parseInt(process.env.PORT || "3456");

console.log(`Donut Investor Pipeline running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
