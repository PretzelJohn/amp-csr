import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/index.js", () => ({
  db: {
    query: {
      subscriptionsTable: {
        findMany: vi.fn(),
      },
    },
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock("../db/schema.js", () => ({
  subscriptionsTable: {
    id: "subscriptions.id",
    customer_id: "subscriptions.customer_id",
    vehicle_id: "subscriptions.vehicle_id",
    plan: "subscriptions.plan",
    starts_at: "subscriptions.starts_at",
    ends_at: "subscriptions.ends_at",
    status: "subscriptions.status",
    created_at: "subscriptions.created_at",
    updated_at: "subscriptions.updated_at",
  },
}));

import { db } from "../db/index.js";
import { createSubscriptionRepo } from "./subscriptions.js";

const subscriptionRepo = createSubscriptionRepo(db);

const makeUpdateChain = (result: unknown[] = []) => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue(result),
  orderBy: vi.fn().mockResolvedValue(result),
  returning: vi.fn().mockResolvedValue(result),
  set: vi.fn().mockReturnThis(),
});

const makeSelectQuery = (result: unknown[] = []) => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  then: (resolve: (value: unknown[]) => unknown[]) => resolve(result),
});

const findManyForSubscriptions = vi.mocked(
  db.query.subscriptionsTable.findMany,
);

describe("subscriptionData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists subscriptions for a customer", async () => {
    const expected = [{ id: 11, customer_id: 3, status: "active" }];
    findManyForSubscriptions.mockResolvedValue(expected as never);

    const result = await subscriptionRepo.listByCustomer(3);

    expect(result).toEqual(expected);
    expect(findManyForSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.anything(),
        orderBy: expect.anything(),
        with: expect.objectContaining({
          vehicle: true,
          payments: true,
        }),
      }),
    );
  });

  it("lists subscriptions for a vehicle", async () => {
    const expected = [{ id: 11, vehicle_id: 7, status: "active" }];
    findManyForSubscriptions.mockResolvedValue(expected as never);

    const result = await subscriptionRepo.listByVehicle(7);

    expect(result).toEqual(expected);
    expect(findManyForSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.anything(),
        orderBy: expect.anything(),
        with: expect.objectContaining({
          vehicle: true,
          payments: true,
        }),
      }),
    );
  });

  it("gets a subscription by id", async () => {
    const expected = [{ id: 11, customer_id: 3, vehicle_id: 7 }];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await subscriptionRepo.getById(11);

    expect(result).toEqual(expected[0]);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
  });

  it("updates a subscription record", async () => {
    const expected = [
      {
        id: 11,
        customer_id: 3,
        vehicle_id: 7,
        plan: "Premium",
        status: "paused",
      },
    ];
    const updateChain = makeUpdateChain(expected);
    vi.mocked(db.update).mockReturnValue(updateChain as never);

    const result = await subscriptionRepo.update(11, {
      status: "paused",
      plan: "Premium",
    });

    expect(result).toEqual(expected[0]);
    expect(updateChain.set).toHaveBeenCalledWith({
      status: "paused",
      plan: "Premium",
      updated_at: expect.any(Date),
    });
  });
});
