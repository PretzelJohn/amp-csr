import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();

export default app;

const port = Number(process.env.PORT ?? 4000);
console.log(`AMP CSR API listening on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
