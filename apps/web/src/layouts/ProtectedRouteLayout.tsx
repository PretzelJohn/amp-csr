import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { getCurrentUser, type AuthUser } from "../lib/auth";

export function ProtectedRouteLayout() {
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((nextUser) => {
        if (active) setUser(nextUser);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
