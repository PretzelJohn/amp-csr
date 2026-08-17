import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { subscriptionsTable } from "../db/schema.js";
import { CreateRepoFunction, DbExecutor } from "./types.js";
import { Vehicle } from "./vehicles.js";
import { SubscriptionPayment } from "./subscription-payments.js";

export type Subscription = typeof subscriptionsTable.$inferSelect;
export type SubscriptionInput = typeof subscriptionsTable.$inferInsert;
export type SubscriptionWithVehicleAndPayments = Subscription & {
  vehicle: Vehicle;
  payments: SubscriptionPayment[];
};

type SubscriptionRepo = {
  listByCustomer(
    customerId: number,
  ): Promise<SubscriptionWithVehicleAndPayments[]>;
  listByVehicle(
    vehicleId: number,
  ): Promise<SubscriptionWithVehicleAndPayments[]>;
  getById(id: number): Promise<Subscription | null>;
  create(input: SubscriptionInput): Promise<Subscription | null>;
  update(
    id: number,
    input: Partial<SubscriptionInput>,
  ): Promise<Subscription | null>;
  delete(id: number): Promise<Subscription | null>;
};

export const createSubscriptionRepo: CreateRepoFunction<SubscriptionRepo> = (
  executor: DbExecutor = db,
) => {
  return {
    async listByCustomer(
      customerId: number,
    ): Promise<SubscriptionWithVehicleAndPayments[]> {
      return executor.query.subscriptionsTable.findMany({
        where: eq(subscriptionsTable.customer_id, customerId),
        orderBy: desc(subscriptionsTable.starts_at),
        with: {
          vehicle: true,
          payments: true,
        },
      });
    },

    async listByVehicle(
      vehicleId: number,
    ): Promise<SubscriptionWithVehicleAndPayments[]> {
      return executor.query.subscriptionsTable.findMany({
        where: eq(subscriptionsTable.vehicle_id, vehicleId),
        orderBy: desc(subscriptionsTable.starts_at),
        with: {
          vehicle: true,
          payments: true,
        },
      });
    },

    async getById(id: number): Promise<Subscription | null> {
      const rows = await executor
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.id, id))
        .limit(1);

      return rows[0] ?? null;
    },

    async create(input: SubscriptionInput): Promise<Subscription | null> {
      const rows = await executor
        .insert(subscriptionsTable)
        .values({
          customer_id: input.customer_id,
          vehicle_id: input.vehicle_id,
          plan: input.plan,
          starts_at: input.starts_at ?? new Date(),
          ends_at: input.ends_at ?? null,
          status: input.status ?? "active",
        })
        .returning();

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

    async delete(id: number): Promise<Subscription | null> {
      const rows = await executor
        .delete(subscriptionsTable)
        .where(eq(subscriptionsTable.id, id))
        .returning();

      return rows[0] ?? null;
    },
  };
};

export const subscriptionData = createSubscriptionRepo();
