import { db } from "./index.js";
import { DbExecutor } from "../repo/types.js";

export async function withTransaction<T>(
  worker: (tx: DbExecutor) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => worker(tx));
}
