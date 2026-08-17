import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/auth";
import { SectionAuditHistorySheet } from "@/components/customers/section-audit-history";

export type CustomerNote = {
  id: string | number;
  customer_id: string | number;
  note: string;
  created_at?: string;
  updated_at?: string;
};

interface CustomerNotesProps {
  customerId: string | number;
}

const emptyDraft = "";

export const CustomerNotes = ({ customerId }: CustomerNotesProps) => {
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!customerId) return;

    setIsLoading(true);
    try {
      const response = await apiFetch(`/customers/${String(customerId)}/notes`);
      setNotes(
        Array.isArray(response.data) ? (response.data as CustomerNote[]) : [],
      );
    } catch {
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  const sortedNotes = useMemo(
    () =>
      [...notes].sort((a, b) => {
        const aDate = new Date(String(a.created_at ?? 0)).getTime();
        const bDate = new Date(String(b.created_at ?? 0)).getTime();
        return bDate - aDate;
      }),
    [notes],
  );

  const handleCreate = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await apiFetch(`/customers/${String(customerId)}/notes`, {
        method: "POST",
        data: { note: trimmed },
      });
      setDraft(emptyDraft);
      await fetchNotes();
    } catch {
      // no-op
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (noteId: string | number) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await apiFetch(
        `/customers/${String(customerId)}/notes/${String(noteId)}`,
        {
          method: "PATCH",
          data: { note: trimmed },
        },
      );
      setEditingId(null);
      setEditingText("");
      await fetchNotes();
    } catch {
      // no-op
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string | number) => {
    if (!window.confirm("Delete this customer note?")) {
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch(
        `/customers/${String(customerId)}/notes/${String(noteId)}`,
        {
          method: "DELETE",
        },
      );
      await fetchNotes();
    } catch {
      // no-op
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-xs uppercase tracking-[0.2em]">
          Customer notes
        </CardTitle>
        <div className="flex items-center gap-3">
          <SectionAuditHistorySheet
            customerId={customerId}
            sectionLabel="Customer notes"
            tableName="notes"
          />
          <div className="text-sm text-muted-foreground">
            {sortedNotes.length} note{sortedNotes.length === 1 ? "" : "s"}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border border-dashed p-3">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Add note
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add internal customer note..."
            />
            <Button
              onClick={handleCreate}
              disabled={!draft.trim() || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Add note"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading notes...</div>
        ) : sortedNotes.length === 0 ? (
          <div className="rounded-xl border p-4 text-sm text-muted-foreground">
            No notes yet for this customer.
          </div>
        ) : (
          <div className="space-y-3 overflow-y-scroll max-h-[300px]">
            {sortedNotes.map((note) => {
              const isEditing = editingId === note.id;

              return (
                <div key={String(note.id)} className="rounded-xl border p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      {note.created_at
                        ? new Date(note.created_at).toLocaleString()
                        : "Recent note"}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingId(note.id);
                            setEditingText(note.note);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(note.id)}
                          disabled={isSubmitting}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(note.id)}
                          disabled={!editingText.trim() || isSubmitting}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingId(null);
                            setEditingText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {note.note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
