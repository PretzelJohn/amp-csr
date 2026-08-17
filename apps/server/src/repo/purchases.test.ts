import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("../db/schema.js", () => ({
  purchasesTable: {
    id: "purchases.id",
    customer_id: "purchases.customer_id",
    type: "purchases.type",
    description: "purchases.description",
    purchased_at: "purchases.purchased_at",
    amount: "purchases.amount",
    status: "purchases.status",
    created_at: "purchases.created_at",
    updated_at: "purchases.updated_at",
  },
}));

import { db } from "../db/index.js";
import { createPurchaseRepo } from "./purchases.js";

const purchaseRepo = createPurchaseRepo(db);

const makeSelectQuery = (result: unknown[] = []) => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  then: (resolve: (value: unknown[]) => unknown[]) => resolve(result),
});

describe("purchaseData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists purchases for a customer", async () => {
    const expected = [
      {
        id: 9,
        customer_id: 3,
        type: "wash",
        description: "Premium wash",
        amount: "19.99",
        status: "completed",
      },
    ];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await purchaseRepo.listByCustomer(3);

    expect(result).toEqual(expected);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
  });

  it("gets a purchase by id", async () => {
    const expected = [
      {
        id: 9,
        customer_id: 3,
        type: "wash",
        description: "Premium wash",
        amount: "19.99",
        status: "completed",
      },
    ];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await purchaseRepo.getById(9);

    expect(result).toEqual(expected[0]);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
  });
});
