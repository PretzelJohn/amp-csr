import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface CustomerVehiclesProps {
  customerId: string | number;
}

export const CustomerVehicles = ({ customerId }: CustomerVehiclesProps) => {
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!customerId) return;

      setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };

    void fetchVehicles();
  }, [customerId]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-xs uppercase tracking-[0.2em]">
          Customer vehicles
        </CardTitle>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">
            Loading vehicles...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-xl border p-4 text-sm text-muted-foreground">
            No vehicles found for this customer.
          </div>
        ) : (
          <div className="space-y-3 overflow-y-scroll max-h-[300px] p-1">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id}>
                <CardContent>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </CardTitle>
                      <CardDescription>
                        Plate: {vehicle.license_plate.toLocaleUpperCase()}
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {vehicle.subscriptionStatus ? (
                        <Badge variant="secondary">
                          {vehicle.subscriptionStatus.charAt(0).toUpperCase() +
                            vehicle.subscriptionStatus.substring(1)}
                        </Badge>
                      ) : null}
                      {vehicle.subscriptionPlan ? (
                        <Badge variant="outline">
                          {vehicle.subscriptionPlan}
                        </Badge>
                      ) : null}
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
