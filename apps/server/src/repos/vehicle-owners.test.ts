import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock("../db/schema.js", () => ({
  vehicleOwnersTable: {
    vehicle_id: "vehicle_owners.vehicle_id",
    customer_id: "vehicle_owners.customer_id",
    created_at: "vehicle_owners.created_at",
    updated_at: "vehicle_owners.updated_at",
  },
}));

import { db } from "../db/index.js";
import { createVehicleOwnersRepo } from "./vehicle-owners.js";

const vehicleOwnersRepo = createVehicleOwnersRepo(db);

const makeSelectQuery = (result: unknown[] = []) => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue(result),
  limit: vi.fn().mockReturnThis(),
});

const makeInsertChain = (result: unknown[] = []) => ({
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue(result),
});

describe("vehicleOwnersRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists vehicle owners by customer", async () => {
    const expected = [{ vehicle_id: 7, customer_id: 3 }];
    const selectQuery = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectQuery as never);

    const result = await vehicleOwnersRepo.listByCustomer(3);

    expect(result).toEqual(expected);
    expect(selectQuery.where).toHaveBeenCalledTimes(1);
    expect(selectQuery.orderBy).toHaveBeenCalledTimes(1);
  });

  it("lists vehicle owners by vehicle", async () => {
    const expected = [{ vehicle_id: 7, customer_id: 3 }];
    const selectQuery = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectQuery as never);

    const result = await vehicleOwnersRepo.listByVehicle(7);

    expect(result).toEqual(expected);
    expect(selectQuery.where).toHaveBeenCalledTimes(1);
    expect(selectQuery.orderBy).toHaveBeenCalledTimes(1);
  });

  it("creates a vehicle owner record", async () => {
    const expected = [{ vehicle_id: 7, customer_id: 3 }];
    const insertChain = makeInsertChain(expected);
    vi.mocked(db.insert).mockReturnValue(insertChain as never);

    const result = await vehicleOwnersRepo.create({
      vehicle_id: 7,
      customer_id: 3,
    });

    expect(result).toEqual(expected[0]);
    expect(insertChain.values).toHaveBeenCalledWith({
      vehicle_id: 7,
      customer_id: 3,
    });
  });
});
