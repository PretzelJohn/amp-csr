import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  useCustomerContext,
  type CustomerRecord,
} from "@/providers/customer-provider";

const variants = {
  default: "cursor-pointer",
  selected: "bg-primary-foreground",
};

interface CustomerCardProps {
  customer: CustomerRecord;
}

export const CustomerCard = ({ customer }: CustomerCardProps) => {
  const { selectedCustomerId, setSelectedCustomerId } = useCustomerContext();
  const isSelected = selectedCustomerId === customer.id;

  return (
    <Card
      className={isSelected ? variants.selected : variants.default}
      onClick={() => !isSelected && setSelectedCustomerId(customer.id)}
    >
      <CardHeader>
        <CardTitle>
          {customer.first_name} {customer.last_name}
        </CardTitle>
      </CardHeader>

      <CardContent className="text-muted-foreground">
        <p>{customer.email}</p>
        <p>{customer.phone}</p>
      </CardContent>
    </Card>
  );
};
