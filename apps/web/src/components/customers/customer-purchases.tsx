import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/auth";
import { useEffect, useState } from "react";
import { SectionAuditHistorySheet } from "./section-audit-history";

export type CustomerPurchase = {
  id: string | number;
  description: string;
  type: string;
  date: string;
  amount: number;
  status: string;
};

type PurchaseApiRecord = {
  id?: string | number;
  description?: string;
  type?: string;
  purchased_at?: string | null;
  date?: string | null;
  amount?: number | string | null;
  status?: string | null;
  payment?: {
    amount?: number | string | null;
    payment_at?: string | null;
    status?: string | null;
  };
  subscription?: {
    plan?: string | null;
  };
};

interface CustomerPurchasesProps {
  customerId: string | number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const statusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "paid":
    case "completed":
      return "secondary";
    case "pending":
      return "outline";
    case "failed":
    case "refunded":
      return "destructive";
    default:
      return "outline";
  }
};

export const CustomerPurchases = ({ customerId }: CustomerPurchasesProps) => {
  const [purchases, setPurchases] = useState<CustomerPurchase[]>([]);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!customerId) return;

      try {
        const response = await apiFetch(
          `/customers/${String(customerId)}/purchases`,
        );

        const payload = response.data;
        const candidateArray = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { items?: unknown[] })?.items)
            ? (payload as { items: PurchaseApiRecord[] }).items
            : Array.isArray((payload as { purchases?: unknown[] })?.purchases)
              ? (payload as { purchases: PurchaseApiRecord[] }).purchases
              : [];

        const nextPurchases = candidateArray
          .map((item) => {
            const raw = item as PurchaseApiRecord;
            const amount = Number(raw.amount ?? raw.payment?.amount ?? 0);
            const date = String(
              raw.purchased_at ?? raw.date ?? raw.payment?.payment_at ?? "",
            );

            return {
              id:
                raw.id ??
                `${raw.description ?? raw.type ?? "purchase"}-${date}`,
              description:
                raw.description ??
                raw.subscription?.plan ??
                "Customer purchase",
              type: raw.type ?? raw.subscription?.plan ?? "purchase",
              date,
              amount: Number.isFinite(amount) ? amount : 0,
              status: String(raw.status ?? raw.payment?.status ?? "paid"),
            } satisfies CustomerPurchase;
          })
          .filter((purchase) => purchase && purchase.amount !== undefined);

        setPurchases(nextPurchases);
      } catch {
        setPurchases([]);
      }
    };

    void fetchPurchases();
  }, [customerId]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-xs uppercase tracking-[0.2em]">
          Customer purchase history
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <SectionAuditHistorySheet
            customerId={customerId}
            sectionLabel="Customer purchases"
            tableName="purchases"
          />
          {purchases.length} item{purchases.length === 1 ? "" : "s"}
        </div>
      </CardHeader>

      <CardContent>
        {purchases.length === 0 ? (
          <div className="rounded-xl border p-4 text-sm text-muted-foreground">
            No purchase history for this customer.
          </div>
        ) : (
          <div className="space-y-3 overflow-y-scroll max-h-[300px]">
            {purchases.map((purchase) => (
              <Card key={String(purchase.id)} className="p-0">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-foreground">
                        {purchase.description}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {purchase.type} • {formatDate(purchase.date)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(purchase.status)}>
                        {purchase.status}
                      </Badge>
                      <div className="text-right font-semibold text-foreground">
                        {formatCurrency(purchase.amount)}
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
