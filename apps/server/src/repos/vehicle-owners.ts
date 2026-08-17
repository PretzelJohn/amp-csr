import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { vehicleOwnersTable } from "../db/schema.js";
import { CreateRepoFunction, DbExecutor } from "./types.js";

export type VehicleOwner = typeof vehicleOwnersTable.$inferSelect;
export type VehicleOwnerInput = typeof vehicleOwnersTable.$inferInsert;

type VehicleOwnerRepo = {
  listByCustomer(customerId: number): Promise<VehicleOwner[]>;
  listByVehicle(vehicleId: number): Promise<VehicleOwner[]>;
  create(input: VehicleOwnerInput): Promise<VehicleOwner | null>;
};

export const createVehicleOwnersRepo: CreateRepoFunction<VehicleOwnerRepo> = (
  executor: DbExecutor = db,
) => {
  return {
    async listByCustomer(customerId: number): Promise<VehicleOwner[]> {
      return executor
        .select()
        .from(vehicleOwnersTable)
        .where(eq(vehicleOwnersTable.customer_id, customerId))
        .orderBy(desc(vehicleOwnersTable.created_at));
    },

    async listByVehicle(vehicleId: number): Promise<VehicleOwner[]> {
      return executor
        .select()
        .from(vehicleOwnersTable)
        .where(eq(vehicleOwnersTable.vehicle_id, vehicleId))
        .orderBy(desc(vehicleOwnersTable.created_at));
    },

    async create(input: VehicleOwnerInput): Promise<VehicleOwner | null> {
      const rows = await executor
        .insert(vehicleOwnersTable)
        .values({
          vehicle_id: input.vehicle_id,
          customer_id: input.customer_id,
        })
        .returning();

      return rows[0] ?? null;
    },
  };
};

export const vehicleOwnerData = createVehicleOwnersRepo();
