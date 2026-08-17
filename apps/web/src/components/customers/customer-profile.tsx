import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { apiFetch } from "@/lib/auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SectionAuditHistorySheet } from "@/components/customers/section-audit-history";
import {
  useCustomerContext,
  type CustomerDetailRecord,
} from "@/providers/customer-provider";

interface CustomerProfileProps {
  customer: CustomerDetailRecord;
}

export const CustomerProfile = ({ customer }: CustomerProfileProps) => {
  const { setSelectedCustomer, updateCustomerInList } = useCustomerContext();
  const [isSaving, setIsSaving] = useState(false);

  const handleCustomerChange = (
    field: keyof CustomerDetailRecord,
    value: string | number,
  ) => {
    setSelectedCustomer((current) =>
      current
        ? ({ ...current, [field]: value } as CustomerDetailRecord)
        : current,
    );
  };

  const handleCustomerSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiFetch(`/customers/${customer.id}`, {
        method: "PATCH",
        data: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
        },
      });

      const updated = response.data as CustomerDetailRecord;
      updateCustomerInList(updated);
      setSelectedCustomer((current) =>
        current
          ? ({ ...current, ...updated } as CustomerDetailRecord)
          : current,
      );
    } catch {
      // no-op: keep UI state unchanged on failed save
    }

    setIsSaving(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em]">Customer profile</p>
          <CardTitle className="mt-2 text-2xl">
            {customer.first_name} {customer.last_name}
          </CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <SectionAuditHistorySheet
            customerId={customer.id}
            sectionLabel="Customer profile"
            tableName="customers"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCustomerSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Form className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <FormField>
              <FormItem>
                <FormLabel>Customer ID</FormLabel>
                <FormControl>
                  <Input value={customer.id} readOnly />
                </FormControl>
              </FormItem>
            </FormField>

            <FormField>
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input
                    value={customer.first_name}
                    onChange={(event) =>
                      handleCustomerChange("first_name", event.target.value)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField>
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                    value={customer.last_name}
                    onChange={(event) =>
                      handleCustomerChange("last_name", event.target.value)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField>
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    value={customer.email}
                    onChange={(event) =>
                      handleCustomerChange("email", event.target.value)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField>
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    value={customer.phone}
                    onChange={(event) =>
                      handleCustomerChange("phone", event.target.value)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border p-4">
              <div className="text-xs uppercase tracking-[0.2em]">
                Member since
              </div>
              <div className="mt-2 text-lg font-semibold">
                {customer.created_at
                  ? new Date(customer.created_at).toLocaleDateString()
                  : "—"}
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs uppercase tracking-[0.2em]">Vehicles</div>
              <div className="mt-2 text-lg font-semibold">0</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs uppercase tracking-[0.2em]">
                Total spend
              </div>
              <div className="mt-2 text-lg font-semibold">0</div>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};
