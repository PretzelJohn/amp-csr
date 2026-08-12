import { Navbar } from "@/components/navigation/navbar";
import { Outlet } from "react-router";

export const RootLayout = () => {
  return (
    <main className="w-full">
      <Navbar />
      <Outlet />
    </main>
  );
};
