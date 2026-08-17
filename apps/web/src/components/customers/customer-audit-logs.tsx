import { useEffect, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type AuditLogEntry = {
  id?: string | number;
  table_name?: string | null;
  action_type?: string | null;
  created_at?: string | null;
  from?: unknown;
  to?: unknown;
};

interface CustomerAuditLogsProps {
  customerId: string | number;
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

export const CustomerAuditLogs = ({ customerId }: CustomerAuditLogsProps) => {
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

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-xs uppercase tracking-[0.2em]">
          Audit history
        </CardTitle>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {logs.length} log
            {logs.length === 1 ? "" : "s"}
          </div>
        </div>
      </CardHeader>

      <CardContent className="rounded-none m-0 h-full w-full">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">
            Loading activity...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No audit history found for this section.
          </div>
        ) : (
          <div className="space-y-3 overflow-y-scroll max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow
                    key={String(
                      log.id ?? `${log.action_type}-${log.created_at}`,
                    )}
                  >
                    <TableCell className="font-medium capitalize">
                      {log.action_type ?? "updated"}
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
      </CardContent>
    </Card>
  );
};
