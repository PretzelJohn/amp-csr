import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent } from "../ui/card";
import { useEffect, useState } from "react";
import type { AuthUser } from "@/lib/auth";

export const CustomerHeader = () => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };

    void fetchUser();
  }, []);

  return (
    <Card className="mb-6 p-5 shadow-lg">
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em]">
            AMP Member Support
          </p>
          <h1 className="mt-2 text-2xl font-semibold">CSR Portal</h1>
        </div>
        {user && (
          <div className="rounded-full border px-3 py-1 text-sm">
            Welcome, {user.first_name}!
          </div>
        )}
      </CardContent>
    </Card>
  );
};
