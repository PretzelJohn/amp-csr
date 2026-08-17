import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../db/schema.js", () => ({
  notesTable: {
    id: "notes.id",
    customer_id: "notes.customer_id",
    note: "notes.note",
    created_at: "notes.created_at",
    updated_at: "notes.updated_at",
  },
}));

import { db } from "../db/index.js";
import { createNoteRepo } from "./notes.js";

const noteRepo = createNoteRepo(db);

const makeChain = (result: unknown[] = []) => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue(result),
  orderBy: vi.fn().mockResolvedValue(result),
  returning: vi.fn().mockResolvedValue(result),
  values: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
});

const makeSelectQuery = (result: unknown[] = []) => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  then: (resolve: (value: unknown[]) => unknown[]) => resolve(result),
});

describe("noteData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists notes for a customer", async () => {
    const expected = [
      { id: 1, customer_id: 3, note: "Followed up with customer." },
    ];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await noteRepo.listByCustomer(3);

    expect(result).toEqual(expected);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
  });

  it("gets a note by id", async () => {
    const expected = [
      { id: 1, customer_id: 3, note: "Followed up with customer." },
    ];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await noteRepo.getById(1);

    expect(result).toEqual(expected[0]);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
  });

  it("creates a note", async () => {
    const created = [
      { id: 1, customer_id: 3, note: "Followed up with customer." },
    ];
    const insertChain = makeChain(created);
    vi.mocked(db.insert).mockReturnValue(insertChain as never);

    const result = await noteRepo.create({
      customer_id: 3,
      note: "Followed up with customer.",
    });

    expect(result).toEqual(created[0]);
    expect(insertChain.values).toHaveBeenCalledWith({
      customer_id: 3,
      note: "Followed up with customer.",
    });
  });

  it("updates a note", async () => {
    const expected = [{ id: 1, customer_id: 3, note: "Updated note" }];
    const updateChain = makeChain(expected);
    vi.mocked(db.update).mockReturnValue(updateChain as never);

    const result = await noteRepo.update(1, { note: "Updated note" });

    expect(result).toEqual(expected[0]);
    expect(updateChain.set).toHaveBeenCalledWith({
      note: "Updated note",
      updated_at: expect.any(Date),
    });
  });
});
