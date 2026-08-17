import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/index.js", () => ({
  db: {
    query: {
      usersTable: {
        findFirst: vi.fn(),
      },
    },
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
  rolesTable: {
    id: "roles.id",
    name: "roles.name",
  },
}));

import { db } from "../db/index.js";
import { createUserRepo } from "./users.js";

const userRepo = createUserRepo(db);

describe("userData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets a user by id", async () => {
    const expected = { id: 42, email: "admin@example.com", usersToRoles: [] };
    vi.mocked(db.query.usersTable.findFirst).mockResolvedValue(expected as never);

    const result = await userRepo.getById(42);

    expect(result).toEqual(expected);
    expect(db.query.usersTable.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.anything(),
        with: {
          usersToRoles: {
            with: {
              role: true,
            },
          },
        },
      }),
    );
  });

  it("gets a user by email", async () => {
    const expected = { id: 7, email: "person@example.com", usersToRoles: [] };
    vi.mocked(db.query.usersTable.findFirst).mockResolvedValue(expected as never);

    const result = await userRepo.getByEmail("person@example.com");

    expect(result).toEqual(expected);
    expect(db.query.usersTable.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.anything(),
        with: {
          usersToRoles: {
            with: {
              role: true,
            },
          },
        },
      }),
    );
  });
});
