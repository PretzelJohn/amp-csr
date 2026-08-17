import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth.js";
import { authMiddleware } from "./middleware/auth.js";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "https://amp.lucashussey.com"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ ok: true, service: "AMP CSR API" }));

app.use("/api/v1/auth/me", authMiddleware);
app.route("/api/v1/auth", authRoutes);

export default app;

const port = Number(process.env.PORT ?? 4000);
console.log(`AMP CSR API listening on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
