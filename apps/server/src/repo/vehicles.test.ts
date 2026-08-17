import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../db/schema.js", () => ({
  vehiclesTable: {
    id: "vehicles.id",
    year: "vehicles.year",
    make: "vehicles.make",
    model: "vehicles.model",
    license_plate: "vehicles.license_plate",
    created_at: "vehicles.created_at",
    updated_at: "vehicles.updated_at",
  },
  subscriptionsTable: {
    id: "subscriptions.id",
    customer_id: "subscriptions.customer_id",
    vehicle_id: "subscriptions.vehicle_id",
  },
}));

import { db } from "../db/index.js";
import { createVehicleRepo } from "./vehicles.js";

const vehicleRepo = createVehicleRepo(db);

const makeChain = (result: unknown[] = []) => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue(result),
  orderBy: vi.fn().mockResolvedValue(result),
  returning: vi.fn().mockResolvedValue(result),
  values: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
});

const makeSelectQuery = (result: unknown[] = []) => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  then: (resolve: (value: unknown[]) => unknown[]) => resolve(result),
});

describe("vehicleData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists vehicles for a customer through subscriptions", async () => {
    const expectedVehicles = [{ id: 7, make: "Toyota", model: "Camry" }];
    const selectChain = makeSelectQuery([{ vehicle: expectedVehicles[0] }]);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await vehicleRepo.listByCustomer(3);

    expect(result).toEqual(expectedVehicles);
    expect(selectChain.innerJoin).toHaveBeenCalledTimes(1);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
  });

  it("gets a vehicle by id", async () => {
    const expected = [{ id: 7, make: "Toyota", model: "Camry" }];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await vehicleRepo.getById(7);

    expect(result).toEqual(expected[0]);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
  });

  it("creates a vehicle record", async () => {
    const created = [
      {
        id: 7,
        year: 2024,
        make: "Toyota",
        model: "Camry",
        license_plate: "ABC123",
      },
    ];

    const insertChain = makeChain(created);
    vi.mocked(db.insert).mockReturnValue(insertChain as never);

    const result = await vehicleRepo.create({
      year: 2024,
      make: "Toyota",
      model: "Camry",
      license_plate: "ABC123",
    });

    expect(result).toEqual(created[0]);
    expect(insertChain.values).toHaveBeenCalledWith({
      year: 2024,
      make: "Toyota",
      model: "Camry",
      license_plate: "ABC123",
    });
  });

  it("updates a vehicle record", async () => {
    const expected = [
      {
        id: 7,
        year: 2024,
        make: "Honda",
        model: "Civic",
        license_plate: "XYZ999",
      },
    ];
    const updateChain = makeChain(expected);
    vi.mocked(db.update).mockReturnValue(updateChain as never);

    const result = await vehicleRepo.update(7, {
      make: "Honda",
      model: "Civic",
      license_plate: "XYZ999",
    });

    expect(result).toEqual(expected[0]);
    expect(updateChain.set).toHaveBeenCalledWith({
      make: "Honda",
      model: "Civic",
      license_plate: "XYZ999",
      updated_at: expect.any(Date),
    });
  });
});
