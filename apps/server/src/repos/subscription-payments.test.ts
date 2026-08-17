import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("../db/schema.js", () => ({
  subscriptionPaymentsTable: {
    id: "subscription_payments.id",
    subscription_id: "subscription_payments.subscription_id",
    amount: "subscription_payments.amount",
    payment_at: "subscription_payments.payment_at",
    status: "subscription_payments.status",
    created_at: "subscription_payments.created_at",
    updated_at: "subscription_payments.updated_at",
  },
  subscriptionsTable: {
    id: "subscriptions.id",
    customer_id: "subscriptions.customer_id",
  },
}));

import { db } from "../db/index.js";
import { createSubscriptionPaymentRepo } from "./subscription-payments.js";

const subscriptionPaymentRepo = createSubscriptionPaymentRepo(db);

const makeSelectQuery = (result: unknown[] = []) => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  then: (resolve: (value: unknown[]) => unknown[]) => resolve(result),
});

describe("subscriptionPaymentData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists payments for a subscription", async () => {
    const expected = [
      { id: 5, subscription_id: 11, amount: "59.99", status: "completed" },
    ];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await subscriptionPaymentRepo.listBySubscription(11);

    expect(result).toEqual(expected);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
  });

  it("lists customer payment history for a subscription", async () => {
    const expected = [
      {
        payment: {
          id: 5,
          subscription_id: 11,
          amount: "59.99",
          status: "completed",
        },
        subscription: { id: 11, customer_id: 3 },
      },
    ];

    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await subscriptionPaymentRepo.listByCustomer(3);

    expect(result).toEqual(expected);
    expect(selectChain.innerJoin).toHaveBeenCalledTimes(1);
  });

  it("gets a payment by id", async () => {
    const expected = [
      { id: 5, subscription_id: 11, amount: "59.99", status: "completed" },
    ];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await subscriptionPaymentRepo.getById(5);

    expect(result).toEqual(expected[0]);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
  });
});
