import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/auth";

export type CustomerVehicle = {
  id: number;
  year: number;
  make: string;
  model: string;
  license_plate: string;
  subscriptionStatus?: string | null;
  subscriptionPlan?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CustomerSubscription = {
  id: number | string;
  customer_id: number | string;
  vehicle_id: number | string;
  plan: string;
  status: string;
  starts_at?: string;
  ends_at?: string | null;
  created_at?: string;
  updated_at?: string;
  vehicle: CustomerVehicle;
};

export type SubscriptionPayment = {
  id: number | string;
  subscription_id: number | string;
  amount: number | string;
  payment_at?: string | null;
  status?: string | null;
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

const formatShortDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (value: number | string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const statusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "secondary";
    case "paused":
      return "outline";
    case "overdue":
      return "destructive";
    case "expired":
      return "outline";
    case "cancelled":
      return "destructive";
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
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<
    Record<string, SubscriptionPayment[]>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSubscription, setNewSubscription] = useState({
    vehicleId: "",
    plan: "",
    starts_at: "",
    ends_at: "",
    status: "active",
  });
  const [transferSubscription, setTransferSubscription] =
    useState<CustomerSubscription | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    if (!customerId) return;

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
    }
  }, [customerId]);

  const fetchVehicles = useCallback(async () => {
    if (!customerId) return;

    try {
      const response = await apiFetch(
        `/customers/${String(customerId)}/vehicles`,
      );
      setVehicles(
        Array.isArray(response.data)
          ? (response.data as CustomerVehicle[])
          : [],
      );
    } catch {
      setVehicles([]);
    }
  }, [customerId]);

  const fetchPaymentHistory = useCallback(
    async (subscriptionId: number | string) => {
      try {
        const response = await apiFetch(
          `/subscriptions/${String(subscriptionId)}/payments`,
        );

        const history = Array.isArray(response.data)
          ? (response.data as SubscriptionPayment[])
          : [];

        setPaymentHistory((current) => ({
          ...current,
          [String(subscriptionId)]: history,
        }));
      } catch {
        setPaymentHistory((current) => ({
          ...current,
          [String(subscriptionId)]: [],
        }));
      }
    },
    [],
  );

  useEffect(() => {
    setIsLoading(true);
    void Promise.all([fetchSubscriptions(), fetchVehicles()]).finally(() => {
      setIsLoading(false);
    });
  }, [fetchSubscriptions, fetchVehicles]);

  useEffect(() => {
    if (!subscriptions.length) {
      setPaymentHistory({});
      return;
    }

    void Promise.all(
      subscriptions.map((subscription) => fetchPaymentHistory(subscription.id)),
    );
  }, [fetchPaymentHistory, subscriptions]);

  const transferOptions = useMemo(() => {
    if (!transferSubscription) {
      return [] as CustomerVehicle[];
    }

    const seen = new Set<number>();
    const options: CustomerVehicle[] = [];

    const pushVehicle = (vehicle?: CustomerVehicle | null) => {
      if (!vehicle) {
        return;
      }

      const vehicleId = Number(vehicle.id);
      if (!Number.isFinite(vehicleId) || seen.has(vehicleId)) {
        return;
      }

      seen.add(vehicleId);
      options.push(vehicle);
    };

    pushVehicle(transferSubscription.vehicle);
    vehicles.forEach((vehicle) => pushVehicle(vehicle));

    return options.filter(
      (vehicle) =>
        Number(vehicle.id) !== Number(transferSubscription.vehicle_id),
    );
  }, [transferSubscription, vehicles]);

  const handleStatusChange = async (
    subscriptionId: number | string,
    nextStatus: string,
  ) => {
    setIsSubmitting(true);
    try {
      await apiFetch(`/subscriptions/${String(subscriptionId)}/status`, {
        method: "PATCH",
        data: { status: nextStatus },
      });
      await Promise.all([fetchSubscriptions(), fetchVehicles()]);
    } catch {
      // no-op
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransfer = async (
    subscriptionId: number | string,
    targetVehicleId: number,
  ) => {
    setIsSubmitting(true);
    try {
      await apiFetch(`/subscriptions/${String(subscriptionId)}/transfer`, {
        method: "POST",
        data: {
          vehicle_id: targetVehicleId,
        },
      });

      setTransferSubscription(null);
      await Promise.all([fetchSubscriptions(), fetchVehicles()]);
    } catch {
      // no-op
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubscription = async () => {
    const vehicleId = Number(newSubscription.vehicleId);
    const plan = newSubscription.plan.trim();

    if (!Number.isFinite(vehicleId) || vehicleId <= 0 || !plan) {
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch(`/customers/${String(customerId)}/subscriptions`, {
        method: "POST",
        data: {
          vehicle_id: vehicleId,
          plan,
          starts_at: newSubscription.starts_at || undefined,
          ends_at: newSubscription.ends_at || undefined,
          status: newSubscription.status,
        },
      });

      setIsCreateDialogOpen(false);
      setNewSubscription({
        vehicleId: "",
        plan: "",
        starts_at: "",
        ends_at: "",
        status: "active",
      });
      await Promise.all([fetchSubscriptions(), fetchVehicles()]);
    } catch {
      // no-op
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-xs uppercase tracking-[0.2em]">
            Customer subscriptions
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              {subscriptions.length} subscription
              {subscriptions.length === 1 ? "" : "s"}
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={vehicles.length === 0 || isSubmitting}
            >
              Add subscription
            </Button>
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
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
              {subscriptions.map((subscription) => {
                const vehicle = subscription.vehicle;
                const isActive = subscription.status.toLowerCase() === "active";
                const isPaused = subscription.status.toLowerCase() === "paused";
                const isOverdue =
                  subscription.status.toLowerCase() === "overdue";
                const isExpired =
                  subscription.status.toLowerCase() === "expired";
                const statusIsCancelled =
                  subscription.status.toLowerCase() === "cancelled";
                const canMarkOverdue =
                  !statusIsCancelled && (isActive || isPaused);
                const canResolveIssue =
                  !statusIsCancelled && (isOverdue || isExpired);
                const history = paymentHistory[String(subscription.id)] ?? [];
                const latestPayment = history[0];

                return (
                  <Card key={String(subscription.id)} className="p-1">
                    <CardContent className="space-y-3 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            Subscription
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {subscription.plan}
                            </span>
                            <Badge variant={statusVariant(subscription.status)}>
                              {subscription.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-right text-[11px] text-muted-foreground">
                          <div>{formatShortDate(subscription.starts_at)}</div>
                          <div>→ {formatShortDate(subscription.ends_at)}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-2.5 py-2 text-xs">
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            Vehicle
                          </div>
                          <div className="truncate font-medium text-foreground">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-muted-foreground">
                            {vehicle.license_plate.toUpperCase()}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            Latest
                          </div>
                          <div className="font-medium text-foreground">
                            {latestPayment
                              ? formatCurrency(latestPayment.amount)
                              : "No payments"}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-md border bg-muted/10 p-2">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            Payment history
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {history.length} total
                          </span>
                        </div>

                        {history.length === 0 ? (
                          <div className="text-xs text-muted-foreground">
                            No payments recorded yet.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {history.slice(0, 3).map((payment) => (
                              <div
                                key={String(payment.id)}
                                className="flex items-center justify-between gap-2 rounded-sm bg-background/80 px-2 py-1 text-xs"
                              >
                                <div>
                                  <div className="font-medium text-foreground">
                                    {formatCurrency(payment.amount)}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {formatDate(payment.payment_at)}
                                  </div>
                                </div>
                                <Badge
                                  variant={
                                    payment.status?.toLowerCase() === "failed"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="capitalize"
                                >
                                  {payment.status ?? "paid"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {isActive || isPaused ? (
                          <Button
                            size="sm"
                            variant={isActive ? "secondary" : "default"}
                            disabled={isSubmitting}
                            onClick={() =>
                              handleStatusChange(
                                subscription.id,
                                isActive ? "paused" : "active",
                              )
                            }
                          >
                            {isActive ? "Pause" : "Activate"}
                          </Button>
                        ) : null}

                        {canMarkOverdue ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() =>
                              handleStatusChange(subscription.id, "overdue")
                            }
                          >
                            Mark overdue
                          </Button>
                        ) : null}

                        {canResolveIssue ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isSubmitting}
                            onClick={() =>
                              handleStatusChange(subscription.id, "active")
                            }
                          >
                            Resolve issue
                          </Button>
                        ) : null}

                        {!statusIsCancelled ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isSubmitting}
                            onClick={() =>
                              handleStatusChange(subscription.id, "cancelled")
                            }
                          >
                            Cancel
                          </Button>
                        ) : null}

                        {!statusIsCancelled ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() =>
                              setTransferSubscription(subscription)
                            }
                          >
                            Transfer
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setNewSubscription({
              vehicleId: "",
              plan: "",
              starts_at: "",
              ends_at: "",
              status: "active",
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add subscription</DialogTitle>
            <DialogDescription>
              Create a new membership for this customer and assign it to one of
              their owned vehicles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Owned vehicle</label>
              <select
                value={newSubscription.vehicleId}
                onChange={(event) =>
                  setNewSubscription((current) => ({
                    ...current,
                    vehicleId: event.target.value,
                  }))
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select an owned vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={String(vehicle.id)}>
                    {vehicle.year} {vehicle.make} {vehicle.model} (
                    {vehicle.license_plate.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Plan</label>
              <Input
                value={newSubscription.plan}
                onChange={(event) =>
                  setNewSubscription((current) => ({
                    ...current,
                    plan: event.target.value,
                  }))
                }
                placeholder="e.g. Unlimited Wash"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Starts</label>
                <Input
                  type="date"
                  value={newSubscription.starts_at}
                  onChange={(event) =>
                    setNewSubscription((current) => ({
                      ...current,
                      starts_at: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ends</label>
                <Input
                  type="date"
                  value={newSubscription.ends_at}
                  onChange={(event) =>
                    setNewSubscription((current) => ({
                      ...current,
                      ends_at: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={newSubscription.status}
                onChange={(event) =>
                  setNewSubscription((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="overdue">Overdue</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => void handleCreateSubscription()}
              disabled={
                !newSubscription.vehicleId ||
                !newSubscription.plan.trim() ||
                isSubmitting
              }
            >
              {isSubmitting ? "Saving..." : "Create subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={transferSubscription !== null}
        onOpenChange={(open) => {
          if (!open) setTransferSubscription(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer subscription</DialogTitle>
            <DialogDescription>
              Choose another owned vehicle for this customer to move the
              subscription to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {transferSubscription
              ? transferOptions.map((vehicle) => (
                  <Button
                    key={vehicle.id}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() =>
                      void handleTransfer(
                        transferSubscription.id,
                        Number(vehicle.id),
                      )
                    }
                  >
                    <span>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {vehicle.license_plate.toUpperCase()}
                    </span>
                  </Button>
                ))
              : null}

            {transferSubscription && transferOptions.length === 0 ? (
              <div className="rounded-xl border p-3 text-sm text-muted-foreground">
                No alternate vehicle is available for this customer.
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose>
              <Button variant="secondary">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
