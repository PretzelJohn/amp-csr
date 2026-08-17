import { db } from "../db/index.js";

export type DbClient = typeof db;
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbExecutor = DbClient | DbTransaction;
export type CreateRepoFunction<T> = (executor?: DbExecutor) => T;
