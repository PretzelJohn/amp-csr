import { db } from "../db/index.js";
import type { DbExecutor } from "./types.js";

export async function withTransaction<T>(
  worker: (tx: DbExecutor) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => worker(tx as DbExecutor));
}
