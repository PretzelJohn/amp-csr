import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { subscriptionsTable } from "../db/schema.js";
import { DbExecutor } from "./types.js";

export type Subscription = typeof subscriptionsTable.$inferSelect;
export type SubscriptionInput = typeof subscriptionsTable.$inferInsert;

type SubscriptionRepo = {
  listByCustomer(customerId: number): Promise<Subscription[]>;
  listByVehicle(vehicleId: number): Promise<Subscription[]>;
  getById(id: number): Promise<Subscription | null>;
  update(id: number, input: Partial<SubscriptionInput>): Promise<Subscription | null>;
};

export function createSubscriptionRepo(
  executor: DbExecutor = db,
): SubscriptionRepo {
  return {
    async listByCustomer(customerId: number): Promise<Subscription[]> {
      return executor
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.customer_id, customerId))
        .orderBy(desc(subscriptionsTable.starts_at));
    },

    async listByVehicle(vehicleId: number): Promise<Subscription[]> {
      return executor
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.vehicle_id, vehicleId))
        .orderBy(desc(subscriptionsTable.starts_at));
    },

    async getById(id: number): Promise<Subscription | null> {
      const rows = await executor
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.id, id))
        .limit(1);

      return rows[0] ?? null;
    },

    async update(
      id: number,
      input: Partial<SubscriptionInput>,
    ): Promise<Subscription | null> {
      const rows = await executor
        .update(subscriptionsTable)
        .set({
          ...input,
          updated_at: new Date(),
        })
        .where(eq(subscriptionsTable.id, id))
        .returning();

      return rows[0] ?? null;
    },
  };
}

export const subscriptionData = createSubscriptionRepo();
