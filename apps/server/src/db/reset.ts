import { reset } from "drizzle-seed";
import { db } from "./index.js";
import * as schema from "./schema.js";
import { exit } from "process";

async function resetDatabase() {
  console.log("Resetting database...");
  await reset(db, schema);
  exit(0);
}

resetDatabase();
