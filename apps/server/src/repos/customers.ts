import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { customersTable } from "../db/schema.js";
import { DbExecutor } from "./types.js";

export type Customer = typeof customersTable.$inferSelect;
export type CustomerInput = typeof customersTable.$inferInsert;

type CustomerRepo = {
  list(): Promise<Customer[]>;
  getById(id: number): Promise<Customer | null>;
  getByEmail(email: string): Promise<Customer | null>;
  getByPhone(phone: string): Promise<Customer | null>;
  update(id: number, input: Partial<CustomerInput>): Promise<Customer | null>;
};

export function createCustomerRepo(executor: DbExecutor = db): CustomerRepo {
  return {
    async list(): Promise<Customer[]> {
      return executor
        .select()
        .from(customersTable)
        .orderBy(desc(customersTable.id));
    },

    async getById(id: number): Promise<Customer | null> {
      const rows = await executor
        .select()
        .from(customersTable)
        .where(eq(customersTable.id, id))
        .limit(1);

      return rows[0] ?? null;
    },

    async getByEmail(email: string): Promise<Customer | null> {
      const rows = await executor
        .select()
        .from(customersTable)
        .where(eq(customersTable.email, email))
        .limit(1);

      return rows[0] ?? null;
    },

    async getByPhone(phone: string): Promise<Customer | null> {
      const rows = await executor
        .select()
        .from(customersTable)
        .where(eq(customersTable.phone, phone))
        .limit(1);

      return rows[0] ?? null;
    },

    async update(
      id: number,
      input: Partial<CustomerInput>,
    ): Promise<Customer | null> {
      const rows = await executor
        .update(customersTable)
        .set({
          ...input,
          updated_at: new Date(),
        })
        .where(eq(customersTable.id, id))
        .returning();

      return rows[0] ?? null;
    },
  };
}

export const customerRepo = createCustomerRepo();
