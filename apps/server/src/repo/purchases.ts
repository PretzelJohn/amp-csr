import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { purchasesTable } from "../db/schema.js";
import { DbExecutor } from "./types.js";

export type Purchase = typeof purchasesTable.$inferSelect;

type PurchaseRepo = {
  listByCustomer(customerId: number): Promise<Purchase[]>;
  getById(id: number): Promise<Purchase | null>;
};

export function createPurchaseRepo(executor: DbExecutor = db): PurchaseRepo {
  return {
    async listByCustomer(customerId: number): Promise<Purchase[]> {
      return executor
        .select()
        .from(purchasesTable)
        .where(eq(purchasesTable.customer_id, customerId))
        .orderBy(desc(purchasesTable.purchased_at));
    },

    async getById(id: number): Promise<Purchase | null> {
      const rows = await executor
        .select()
        .from(purchasesTable)
        .where(eq(purchasesTable.id, id))
        .limit(1);

      return rows[0] ?? null;
    },
  };
}

export const purchaseData = createPurchaseRepo();
