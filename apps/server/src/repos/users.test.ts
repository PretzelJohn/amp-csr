import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("../db/schema.js", () => ({
  usersTable: {
    id: "users.id",
    email: "users.email",
    first_name: "users.first_name",
    last_name: "users.last_name",
    password_hash: "users.password_hash",
    last_seen_at: "users.last_seen_at",
    created_at: "users.created_at",
    updated_at: "users.updated_at",
  },
}));

import { db } from "../db/index.js";
import { createUserRepo } from "./users.js";

const userRepo = createUserRepo(db);

const makeSelectQuery = (result: unknown[] = []) => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  then: (resolve: (value: unknown[]) => unknown[]) => resolve(result),
});

describe("userData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets a user by id", async () => {
    const expected = [{ id: 42, email: "admin@example.com" }];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await userRepo.getById(42);

    expect(result).toEqual(expected[0]);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
    expect(selectChain.limit).toHaveBeenCalledTimes(1);
  });

  it("gets a user by email", async () => {
    const expected = [{ id: 7, email: "person@example.com" }];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await userRepo.getByEmail("person@example.com");

    expect(result).toEqual(expected[0]);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
    expect(selectChain.limit).toHaveBeenCalledTimes(1);
  });
});
