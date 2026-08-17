import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { notesTable } from "../db/schema.js";
import { DbExecutor } from "./types.js";

export type Note = typeof notesTable.$inferSelect;
export type NoteInput = typeof notesTable.$inferInsert;

type NoteRepo = {
  listByCustomer(customerId: number): Promise<Note[]>;
  getById(id: number): Promise<Note | null>;
  create(input: NoteInput): Promise<Note | null>;
  update(id: number, input: Partial<NoteInput>): Promise<Note | null>;
};

export function createNoteRepo(executor: DbExecutor = db): NoteRepo {
  return {
    async listByCustomer(customerId: number): Promise<Note[]> {
      return executor
        .select()
        .from(notesTable)
        .where(eq(notesTable.customer_id, customerId))
        .orderBy(desc(notesTable.created_at));
    },

    async getById(id: number): Promise<Note | null> {
      const rows = await executor
        .select()
        .from(notesTable)
        .where(eq(notesTable.id, id))
        .limit(1);

      return rows[0] ?? null;
    },

    async create(input: NoteInput): Promise<Note | null> {
      const rows = await executor
        .insert(notesTable)
        .values({
          customer_id: input.customer_id,
          note: input.note,
        })
        .returning();

      return rows[0] ?? null;
    },

    async update(id: number, input: Partial<NoteInput>): Promise<Note | null> {
      const rows = await executor
        .update(notesTable)
        .set({
          ...input,
          updated_at: new Date(),
        })
        .where(eq(notesTable.id, id))
        .returning();

      return rows[0] ?? null;
    },
  };
}

export const noteData = createNoteRepo();
