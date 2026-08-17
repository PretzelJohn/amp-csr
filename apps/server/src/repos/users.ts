import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { rolesTable, usersTable } from "../db/schema.js";
import { CreateRepoFunction, DbExecutor } from "./types.js";

export type User = typeof usersTable.$inferSelect & {
  usersToRoles: {
    role: typeof rolesTable.$inferSelect;
  }[];
};
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
      const row = await executor.query.usersTable.findFirst({
        where: eq(usersTable.id, id),
        with: {
          usersToRoles: {
            with: {
              role: true,
            },
          },
        },
      });

      return row ?? null;
    },

    async getByEmail(email: string): Promise<User | null> {
      const row = await executor.query.usersTable.findFirst({
        where: eq(usersTable.email, email),
        with: {
          usersToRoles: {
            with: {
              role: true,
            },
          },
        },
      });

      return row ?? null;
    },
  };
};

export const userRepo = createUserRepo();
