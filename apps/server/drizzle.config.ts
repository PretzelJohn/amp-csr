import { defineConfig } from "drizzle-kit";

// Drizzle CLI is LOCAL ONLY, so a hardcoded string is okay here
export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:postgres@localhost:5432/postgres",
  },
});
