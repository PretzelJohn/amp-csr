import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock("../db/schema.js", () => ({
  auditLogsTable: {
    id: "audit_logs.id",
    customer_id: "audit_logs.customer_id",
    table_name: "audit_logs.table_name",
    record_id: "audit_logs.record_id",
    action_type: "audit_logs.action_type",
    from: "audit_logs.from",
    to: "audit_logs.to",
    created_at: "audit_logs.created_at",
  },
}));

import { db } from "../db/index.js";
import { createAuditLogRepo } from "./auditLogs.js";

const auditLogRepo = createAuditLogRepo(db);

const makeChain = (result: unknown[] = []) => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue(result),
  orderBy: vi.fn().mockResolvedValue(result),
  returning: vi.fn().mockResolvedValue(result),
  values: vi.fn().mockReturnThis(),
});

const makeSelectQuery = (result: unknown[] = []) => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  then: (resolve: (value: unknown[]) => unknown[]) => resolve(result),
});

describe("auditLogRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists all audit logs", async () => {
    const expected = [
      {
        id: 1,
        customer_id: 3,
        table_name: "customers",
        record_id: 3,
        action_type: "update",
      },
    ];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await auditLogRepo.list();

    expect(result).toEqual(expected);
    expect(selectChain.from).toHaveBeenCalledTimes(1);
    expect(selectChain.orderBy).toHaveBeenCalledTimes(1);
  });

  it("lists audit logs for a customer", async () => {
    const expected = [
      {
        id: 1,
        customer_id: 3,
        table_name: "customers",
        record_id: 3,
        action_type: "update",
      },
    ];
    const selectChain = makeSelectQuery(expected);
    vi.mocked(db.select).mockReturnValue(selectChain as never);

    const result = await auditLogRepo.listByCustomer(3);

    expect(result).toEqual(expected);
    expect(selectChain.where).toHaveBeenCalledTimes(1);
  });

  it("creates an audit log entry", async () => {
    const created = [
      {
        id: 1,
        customer_id: 3,
        table_name: "customers",
        record_id: 3,
        action_type: "update",
        from: { name: "old" },
        to: { name: "new" },
      },
    ];

    const insertChain = makeChain(created);
    vi.mocked(db.insert).mockReturnValue(insertChain as never);

    const result = await auditLogRepo.create({
      customer_id: 3,
      table_name: "customers",
      record_id: 3,
      action_type: "update",
      from: { name: "old" },
      to: { name: "new" },
    });

    expect(result).toEqual(created[0]);
    expect(insertChain.values).toHaveBeenCalledWith({
      customer_id: 3,
      table_name: "customers",
      record_id: 3,
      action_type: "update",
      from: { name: "old" },
      to: { name: "new" },
    });
  });
});
