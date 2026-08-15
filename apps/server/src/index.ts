import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/health", (c) => c.json({ ok: true, service: "AMP CSR API" }));

// TODO: API Goes here

export default app;

const port = Number(process.env.PORT ?? 4000);
console.log(`AMP CSR API listening on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
