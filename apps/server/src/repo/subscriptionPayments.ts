import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { subscriptionPaymentsTable, subscriptionsTable } from "../db/schema.js";
import { DbExecutor } from "./types.js";

export type SubscriptionPayment = typeof subscriptionPaymentsTable.$inferSelect;
export type SubscriptionPaymentInput =
  typeof subscriptionPaymentsTable.$inferInsert;
export type PaymentWithSubscription = {
  payment: SubscriptionPayment;
  subscription: typeof subscriptionsTable.$inferSelect;
};

type SubscriptionPaymentRepo = {
  listBySubscription(subscriptionId: number): Promise<SubscriptionPayment[]>;
  listByCustomer(customerId: number): Promise<PaymentWithSubscription[]>;
  getById(id: number): Promise<SubscriptionPayment | null>;
};

export function createSubscriptionPaymentRepo(
  executor: DbExecutor = db,
): SubscriptionPaymentRepo {
  return {
    async listBySubscription(
      subscriptionId: number,
    ): Promise<SubscriptionPayment[]> {
      return executor
        .select()
        .from(subscriptionPaymentsTable)
        .where(eq(subscriptionPaymentsTable.subscription_id, subscriptionId))
        .orderBy(desc(subscriptionPaymentsTable.payment_at));
    },

    async listByCustomer(customerId: number): Promise<PaymentWithSubscription[]> {
      const rows = await executor
        .select({
          payment: subscriptionPaymentsTable,
          subscription: subscriptionsTable,
        })
        .from(subscriptionPaymentsTable)
        .innerJoin(
          subscriptionsTable,
          eq(subscriptionPaymentsTable.subscription_id, subscriptionsTable.id),
        )
        .where(eq(subscriptionsTable.customer_id, customerId))
        .orderBy(desc(subscriptionPaymentsTable.payment_at));

      return rows;
    },

    async getById(id: number): Promise<SubscriptionPayment | null> {
      const rows = await executor
        .select()
        .from(subscriptionPaymentsTable)
        .where(eq(subscriptionPaymentsTable.id, id))
        .limit(1);

      return rows[0] ?? null;
    },
  };
}

export const subscriptionPaymentData = createSubscriptionPaymentRepo();
