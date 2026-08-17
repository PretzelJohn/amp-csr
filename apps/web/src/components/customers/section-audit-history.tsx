import { useEffect, useMemo, useState } from "react";
import { History, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/auth";

type AuditLogEntry = {
  id?: string | number;
  table_name?: string | null;
  action_type?: string | null;
  created_at?: string | null;
  from?: unknown;
  to?: unknown;
};

interface SectionAuditHistorySheetProps {
  customerId: string | number;
  sectionLabel: string;
  tableName: string;
}

const summarizeChange = (value: unknown) => {
  if (!value) return "—";

  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const formatLogDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const SectionAuditHistorySheet = ({
  customerId,
  sectionLabel,
  tableName,
}: SectionAuditHistorySheetProps) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!customerId) return;

    const fetchLogs = async () => {
      setIsLoading(true);

      try {
        const response = await apiFetch(
          `/customers/${String(customerId)}/audit-logs`,
        );
        const nextLogs = Array.isArray(response.data)
          ? (response.data as AuditLogEntry[])
          : [];

        setLogs(nextLogs);
      } catch {
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLogs();
  }, [customerId]);

  const filteredLogs = useMemo(
    () =>
      logs.filter(
        (log) =>
          String(log.table_name ?? "").toLowerCase() ===
          tableName.toLowerCase(),
      ),
    [logs, tableName],
  );

  if (!open) return null;

  return (
    <Drawer swipeDirection="right" modal>
      <DrawerTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-3.5 w-3.5" />
            History
          </Button>
        }
      ></DrawerTrigger>
      <DrawerContent className="rounded-none m-0 h-full w-full sm:max-w-sm sm:rounded-l-lg">
        <DrawerHeader>
          <div>
            <div className="flex w-full justify-end text-muted-foreground">
              <DrawerClose
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close history"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
            <DrawerTitle>Audit history</DrawerTitle>
            <DrawerDescription className="mt-2">
              {sectionLabel}
            </DrawerDescription>
          </div>
        </DrawerHeader>

        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">
            Loading activity...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No audit history found for this section.
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow
                    key={String(
                      log.id ?? `${log.action_type}-${log.created_at}`,
                    )}
                  >
                    <TableCell className="font-medium capitalize">
                      {log.action_type ?? "updated"}
                    </TableCell>
                    <TableCell className="font-medium capitalize">
                      {log.table_name ?? "-"}
                    </TableCell>
                    <TableCell className="max-w-[18rem] whitespace-pre-wrap break-words text-xs">
                      <div>{summarizeChange(log.from)}</div>
                      {log.to ? (
                        <div className="mt-2 text-muted-foreground">
                          → {summarizeChange(log.to)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatLogDate(log.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};
