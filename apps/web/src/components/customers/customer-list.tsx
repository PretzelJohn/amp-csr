import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../ui/card";
import { Input } from "../ui/input";
import { CustomerCard } from "./customer-card";
import { useCustomerContext } from "@/providers/customer-provider";

export const CustomerList = () => {
  const { customers, search, setSearch } = useCustomerContext();

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-xs uppercase tracking-[0.2em]">
          Customer search
        </CardTitle>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {customers.length} found
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <CardDescription>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, phone, email..."
          />
        </CardDescription>

        {customers?.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </CardContent>
    </Card>
  );
};
