import { Card, CardContent } from "../components/ui/card";
import { CustomerNotes } from "@/components/customers/customer-notes";
import { CustomerProfile } from "@/components/customers/customer-profile";
import { CustomerPurchases } from "@/components/customers/customer-purchases";
import { CustomerSubscriptions } from "@/components/customers/customer-subscriptions";
import {
  CustomerProvider,
  useCustomerContext,
} from "@/providers/customer-provider";
import { CustomerList } from "@/components/customers/customer-list";
import { CustomerHeader } from "@/components/customers/customer-header";
import { CustomerAuditLogs } from "@/components/customers/customer-audit-logs";

const CustomerPageContent = () => {
  const { selectedCustomer } = useCustomerContext();

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="mx-auto max-w-7xl p-4 pb-8 sm:px-6 lg:px-8">
        <CustomerHeader />

        <div className="grid gap-6 lg:grid-cols-[350px_minmax(0,1fr)]">
          <CustomerList />

          <div className="space-y-6">
            {selectedCustomer ? (
              <>
                <CustomerProfile customer={selectedCustomer} />
                <CustomerNotes customerId={selectedCustomer.id} />
                <CustomerSubscriptions customerId={selectedCustomer.id} />
                <CustomerPurchases customerId={selectedCustomer.id} />
                <CustomerAuditLogs customerId={selectedCustomer.id} />
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  Select a customer to review account details and subscriptions.
                </CardContent>
              </Card>
            )}
          </div>
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
