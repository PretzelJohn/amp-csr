import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { usersTable } from "../db/schema.js";
import { CreateRepoFunction, DbExecutor } from "./types.js";

export type User = typeof usersTable.$inferSelect;
export type UserInput = typeof usersTable.$inferInsert;

type UserRepo = {
  getById(id: number): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
};

export const createUserRepo: CreateRepoFunction<UserRepo> = (
  executor: DbExecutor = db,
) => {
  return {
    async getById(id: number): Promise<User | null> {
      const rows = await executor
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .limit(1);

      return rows[0] ?? null;
    },

    async getByEmail(email: string): Promise<User | null> {
      const rows = await executor
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      return rows[0] ?? null;
    },
  };
};

export const userRepo = createUserRepo();
