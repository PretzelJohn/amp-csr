import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { subscriptionsTable, vehiclesTable } from "../db/schema.js";
import { DbExecutor } from "./types.js";

export type Vehicle = typeof vehiclesTable.$inferSelect;
export type VehicleInput = typeof vehiclesTable.$inferInsert;

type VehicleRepo = {
  listByCustomer(customerId: number): Promise<Vehicle[]>;
  getById(id: number): Promise<Vehicle | null>;
  create(input: VehicleInput): Promise<Vehicle | null>;
  update(id: number, input: Partial<VehicleInput>): Promise<Vehicle | null>;
};

export function createVehicleRepo(executor: DbExecutor = db): VehicleRepo {
  return {
    async listByCustomer(customerId: number): Promise<Vehicle[]> {
      const rows = await executor
        .select({ vehicle: vehiclesTable })
        .from(vehiclesTable)
        .innerJoin(
          subscriptionsTable,
          eq(subscriptionsTable.vehicle_id, vehiclesTable.id),
        )
        .where(eq(subscriptionsTable.customer_id, customerId))
        .orderBy(desc(vehiclesTable.created_at));

      return rows.map((row) => row.vehicle);
    },

    async getById(id: number): Promise<Vehicle | null> {
      const rows = await executor
        .select()
        .from(vehiclesTable)
        .where(eq(vehiclesTable.id, id))
        .limit(1);

      return rows[0] ?? null;
    },

    async create(input: VehicleInput): Promise<Vehicle | null> {
      const rows = await executor
        .insert(vehiclesTable)
        .values({
          year: input.year,
          make: input.make,
          model: input.model,
          license_plate: input.license_plate,
        })
        .returning();

      return rows[0] ?? null;
    },

    async update(
      id: number,
      input: Partial<VehicleInput>,
    ): Promise<Vehicle | null> {
      const rows = await executor
        .update(vehiclesTable)
        .set({
          ...input,
          updated_at: new Date(),
        })
        .where(eq(vehiclesTable.id, id))
        .returning();

      return rows[0] ?? null;
    },
  };
}

export const vehicleData = createVehicleRepo();
