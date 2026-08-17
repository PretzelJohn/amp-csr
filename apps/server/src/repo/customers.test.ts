import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../db/schema.js", () => ({
  customersTable: {
    id: "customers.id",
    email: "customers.email",
    first_name: "customers.first_name",
    last_name: "customers.last_name",
    phone: "customers.phone",
    created_at: "customers.created_at",
    updated_at: "customers.updated_at",
  },
}));

import { db } from "../db/index.js";
import { createCustomerRepo } from "./customers.js";

const customerRepo = createCustomerRepo(db);

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

describe("customerData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists all customers", async () => {
    const expected = [{ id: 1, email: "ada@example.com" }];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await customerRepo.list();

    expect(result).toEqual(expected);
    expect(selectChain.from).toHaveBeenCalledTimes(1);
    expect(selectChain.orderBy).toHaveBeenCalledTimes(1);
  });

  it("gets a customer by id", async () => {
    const expected = [{ id: 42, email: "person@example.com" }];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await customerRepo.getById(42);

    expect(result).toEqual(expected[0]);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
    expect(selectChain.limit).toHaveBeenCalledTimes(1);
  });

  it("gets a customer by email", async () => {
    const expected = [{ id: 7, email: "person@example.com" }];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await customerRepo.getByEmail("person@example.com");

    expect(result).toEqual(expected[0]);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
  });

  it("gets a customer by phone", async () => {
    const expected = [{ id: 7, phone: "+15550000000" }];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await customerRepo.getByPhone("+15550000000");

    expect(result).toEqual(expected[0]);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
  });

  it("updates a customer record", async () => {
    const expected = [
      {
        id: 2,
        first_name: "Grace",
        last_name: "Hopper",
        email: "grace@example.com",
        phone: "+15551112222",
      },
    ];
    const updateChain = makeUpdateChain(expected);
    vi.mocked(db.update).mockReturnValue(updateChain as never);

    const result = await customerRepo.update(2, {
      first_name: "Grace",
      phone: "+15551112222",
    });

    expect(result).toEqual(expected[0]);
    expect(updateChain.set).toHaveBeenCalledWith({
      first_name: "Grace",
      phone: "+15551112222",
      updated_at: expect.any(Date),
    });
  });
});
