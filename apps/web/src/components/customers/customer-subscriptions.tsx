import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/auth";
import { SectionAuditHistorySheet } from "@/components/customers/section-audit-history";

export type CustomerSubscription = {
  id: number | string;
  customer_id: number | string;
  vehicle_id: number | string;
  plan: string;
  starts_at?: string;
  ends_at?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

interface CustomerSubscriptionsProps {
  customerId: string | number;
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const statusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "secondary";
    case "overdue":
      return "destructive";
    case "paused":
      return "outline";
    case "expired":
      return "secondary";
    default:
      return "outline";
  }
};

export const CustomerSubscriptions = ({
  customerId,
}: CustomerSubscriptionsProps) => {
  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!customerId) return;

      setIsLoading(true);
      try {
        const response = await apiFetch(
          `/customers/${String(customerId)}/subscriptions`,
        );
        setSubscriptions(
          Array.isArray(response.data)
            ? (response.data as CustomerSubscription[])
            : [],
        );
      } catch {
        setSubscriptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSubscriptions();
  }, [customerId]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-xs uppercase tracking-[0.2em]">
          Customer subscriptions
        </CardTitle>
        <div className="flex items-center gap-3">
          <SectionAuditHistorySheet
            customerId={customerId}
            sectionLabel="Customer subscriptions"
            tableName="subscriptions"
          />
          <div className="text-sm text-muted-foreground">
            {subscriptions.length} active record
            {subscriptions.length === 1 ? "" : "s"}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">
            Loading subscriptions...
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="rounded-xl border p-4 text-sm text-muted-foreground">
            No subscriptions found for this customer.
          </div>
        ) : (
          <div className="space-y-3 overflow-y-scroll max-h-[300px]">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id} className="p-0">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-foreground">
                        {subscription.plan}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Vehicle ID: {subscription.vehicle_id}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant(subscription.status)}>
                        {subscription.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border p-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        Starts
                      </div>
                      <div className="mt-2 text-sm font-medium">
                        {formatDate(subscription.starts_at)}
                      </div>
                    </div>

                    <div className="rounded-lg border p-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        Ends
                      </div>
                      <div className="mt-2 text-sm font-medium">
                        {formatDate(subscription.ends_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
