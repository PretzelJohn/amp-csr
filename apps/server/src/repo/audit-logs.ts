import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { auditLogsTable } from "../db/schema.js";
import { DbExecutor } from "./types.js";

export type AuditLog = typeof auditLogsTable.$inferSelect;
export type AuditLogInput = typeof auditLogsTable.$inferInsert;

type AuditLogRepo = {
  list(): Promise<AuditLog[]>;
  listByCustomer(customerId: number): Promise<AuditLog[]>;
  create(input: AuditLogInput): Promise<AuditLog | null>;
};

export function createAuditLogRepo(executor: DbExecutor = db): AuditLogRepo {
  return {
    async list(): Promise<AuditLog[]> {
      return executor
        .select()
        .from(auditLogsTable)
        .orderBy(desc(auditLogsTable.created_at));
    },

    async listByCustomer(customerId: number): Promise<AuditLog[]> {
      return executor
        .select()
        .from(auditLogsTable)
        .where(eq(auditLogsTable.customer_id, customerId))
        .orderBy(desc(auditLogsTable.created_at));
    },

    async create(input: AuditLogInput): Promise<AuditLog | null> {
      const rows = await executor
        .insert(auditLogsTable)
        .values({
          customer_id: input.customer_id,
          table_name: input.table_name,
          record_id: input.record_id,
          action_type: input.action_type,
          from: input.from ?? null,
          to: input.to ?? null,
        })
        .returning();

      return rows[0] ?? null;
    },
  };
}

export const auditLogRepo = createAuditLogRepo();
