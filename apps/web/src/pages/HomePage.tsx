import { useState } from "react";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { apiFetch } from "../lib/auth";
import { CustomerCard } from "@/components/customers/customer-card";
import { CustomerNotes } from "@/components/customers/customer-notes";
import { CustomerProfile } from "@/components/customers/customer-profile";
import { CustomerPurchases } from "@/components/customers/customer-purchases";
import { CustomerSubscriptions } from "@/components/customers/customer-subscriptions";
import { CustomerVehicles } from "@/components/customers/customer-vehicles";
import {
  CustomerProvider,
  useCustomerContext,
} from "@/providers/customer-provider";

type SubscriptionPlan = "Unlimited Wash" | "Premium Wash" | "Family Pass";
type SubscriptionStatus = "active" | "overdue" | "paused" | "expired";

type Subscription = {
  id: string;
  userId: string;
  vehicleName: string;
  plate: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  renewalDate: string;
  autoRenew: boolean;
  lastPayment?: string;
  amount?: number;
};

const emptySubscriptionForm = {
  vehicleName: "",
  plate: "",
  plan: "Unlimited Wash" as SubscriptionPlan,
  status: "active" as SubscriptionStatus,
  renewalDate: "",
  autoRenew: true,
  amount: 39.99,
};

const subscriptionStatusColor: Record<SubscriptionStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-300",
  overdue: "bg-amber-500/15 text-amber-200",
  paused: "bg-slate-500/15 text-slate-200",
  expired: "bg-rose-500/15 text-rose-200",
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const CustomerPageContent = () => {
  const {
    customers,
    selectedCustomerId,
    selectedCustomer,
    search,
    setSearch,
    refreshCustomers,
    refreshSelectedCustomer,
  } = useCustomerContext();
  const [newSubscription, setNewSubscription] = useState(emptySubscriptionForm);

  const handleSubscriptionUpdate = async (
    subscriptionId: string | number,
    updates: Partial<Subscription>,
  ) => {
    try {
      await apiFetch(
        `/customers/${String(selectedCustomerId)}/subscriptions/${String(subscriptionId)}`,
        {
          method: "PATCH",
          data: updates,
        },
      );
      if (selectedCustomerId) {
        await refreshSelectedCustomer(selectedCustomerId);
        await refreshCustomers(search);
      }
    } catch {
      // no-op
    }
  };

  const handleSubscriptionDelete = async (subscriptionId: string | number) => {
    try {
      await apiFetch(
        `/customers/${String(selectedCustomerId)}/subscriptions/${String(subscriptionId)}`,
        {
          method: "DELETE",
        },
      );
      if (selectedCustomerId) {
        await refreshSelectedCustomer(selectedCustomerId);
        await refreshCustomers(search);
      }
    } catch {
      // no-op
    }
  };

  const handleTransferSubscription = async (
    subscriptionId: string | number,
    targetUserId: string | number,
  ) => {
    if (!targetUserId || String(targetUserId) === String(selectedCustomerId))
      return;

    try {
      await apiFetch(
        `/customers/${String(selectedCustomerId)}/subscriptions/${String(subscriptionId)}`,
        {
          method: "PATCH",
          data: { userId: targetUserId },
        },
      );
      if (selectedCustomerId) {
        await refreshSelectedCustomer(selectedCustomerId);
        await refreshCustomers(search);
      }
    } catch {
      // no-op
    }
  };

  const handleAddSubscription = async () => {
    if (!selectedCustomer) return;

    const payload = {
      ...newSubscription,
      userId: selectedCustomer.id,
    };

    try {
      await apiFetch(`/customers/${selectedCustomer.id}/subscriptions`, {
        method: "POST",
        data: payload,
      });
      if (selectedCustomerId) {
        setNewSubscription(emptySubscriptionForm);
        await refreshSelectedCustomer(selectedCustomerId);
        await refreshCustomers(search);
      }
    } catch {
      // no-op
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between rounded-2xl border p-5 shadow-lg">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-(--amp-accent)">
              AMP Member Support
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-(--amp-text)">
              CSR Portal
            </h1>
          </div>
          <div className="rounded-full border px-3 py-1 text-sm">
            {customers.length} customers
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[350px_minmax(0,1fr)]">
          <aside className="rounded-2xl border p-4 shadow-lg">
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em]">
                Customer search
              </label>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, phone, email..."
              />
            </div>

            <div className="space-y-3">
              {customers?.map((customer) => (
                <CustomerCard key={customer.id} customer={customer} />
              ))}
            </div>
          </aside>

          <main className="space-y-6">
            {selectedCustomer ? (
              <>
                <CustomerProfile customer={selectedCustomer} />
                <CustomerNotes customerId={selectedCustomer.id} />
                <CustomerVehicles customerId={selectedCustomer.id} />
                <CustomerSubscriptions customerId={selectedCustomer.id} />
                <CustomerPurchases customerId={selectedCustomer.id} />

                <Card>
                  <CardHeader className="flex-row items-center justify-between gap-4">
                    <CardTitle className="">Vehicle subscriptions</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {selectedCustomer.subscriptions.length} active records
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedCustomer.subscriptions?.map((subscription) => (
                        <div
                          key={subscription.id}
                          className="rounded-xl border p-4"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="text-lg font-semibold">
                                {subscription.vehicleName}
                              </div>
                              <div className="mt-1 text-sm">
                                {subscription.plate}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${subscriptionStatusColor[subscription.status as SubscriptionStatus]}`}
                              >
                                {subscription.status}
                              </span>
                              <span className="rounded-full px-2.5 py-1 text-xs font-medium">
                                {subscription.plan}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-5">
                            <div>
                              <label className="mb-1 block text-[11px] uppercase tracking-[0.2em]">
                                Plan
                              </label>
                              <select
                                value={subscription.plan}
                                onChange={(event) =>
                                  handleSubscriptionUpdate(subscription.id, {
                                    plan: event.target
                                      .value as SubscriptionPlan,
                                  })
                                }
                                className="w-full rounded-md border px-3 py-2 text-sm"
                              >
                                <option>Unlimited Wash</option>
                                <option>Premium Wash</option>
                                <option>Family Pass</option>
                              </select>
                            </div>

                            <div>
                              <label className="mb-1 block text-[11px] uppercase tracking-[0.2em]">
                                Status
                              </label>
                              <select
                                value={subscription.status}
                                onChange={(event) =>
                                  handleSubscriptionUpdate(subscription.id, {
                                    status: event.target
                                      .value as SubscriptionStatus,
                                  })
                                }
                                className="w-full rounded-md border px-3 py-2 text-sm"
                              >
                                <option value="active">active</option>
                                <option value="overdue">overdue</option>
                                <option value="paused">paused</option>
                                <option value="expired">expired</option>
                              </select>
                            </div>

                            <div>
                              <label className="mb-1 block text-[11px] uppercase tracking-[0.2em]">
                                Renewal
                              </label>
                              <Input
                                type="date"
                                value={subscription.renewalDate}
                                onChange={(event) =>
                                  handleSubscriptionUpdate(subscription.id, {
                                    renewalDate: event.target.value,
                                  })
                                }
                                className="px-3 py-2 text-sm"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-[11px] uppercase tracking-[0.2em]">
                                Transfer
                              </label>
                              <select
                                defaultValue={selectedCustomer.id}
                                onChange={(event) =>
                                  handleTransferSubscription(
                                    subscription.id,
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-md border px-3 py-2 text-sm"
                              >
                                {customers?.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.first_name ?? ""}{" "}
                                    {user.last_name ?? ""}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-end gap-2">
                              <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={subscription.autoRenew}
                                  onChange={(event) =>
                                    handleSubscriptionUpdate(subscription.id, {
                                      autoRenew: event.target.checked,
                                    })
                                  }
                                />
                                Auto-renew
                              </label>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleSubscriptionDelete(subscription.id)
                                }
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 rounded-xl border border-dashed p-4">
                      <div className="mb-3 text-sm font-medium">
                        Add a new wash subscription
                      </div>
                      <div className="grid gap-3 md:grid-cols-6">
                        <div className="md:col-span-2">
                          <Input
                            placeholder="Vehicle name"
                            value={newSubscription.vehicleName}
                            onChange={(event) =>
                              setNewSubscription((current) => ({
                                ...current,
                                vehicleName: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="Plate"
                            value={newSubscription.plate}
                            onChange={(event) =>
                              setNewSubscription((current) => ({
                                ...current,
                                plate: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <select
                            value={newSubscription.plan}
                            onChange={(event) =>
                              setNewSubscription((current) => ({
                                ...current,
                                plan: event.target.value as SubscriptionPlan,
                              }))
                            }
                            className="h-10 w-full rounded-md border px-3 py-2 text-sm"
                          >
                            <option>Unlimited Wash</option>
                            <option>Premium Wash</option>
                            <option>Family Pass</option>
                          </select>
                        </div>
                        <div>
                          <Input
                            type="date"
                            value={newSubscription.renewalDate}
                            onChange={(event) =>
                              setNewSubscription((current) => ({
                                ...current,
                                renewalDate: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Button
                            className="w-full"
                            onClick={handleAddSubscription}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  Select a customer to review account details and subscriptions.
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export const HomePage = () => (
  <CustomerProvider>
    <CustomerPageContent />
  </CustomerProvider>
);
