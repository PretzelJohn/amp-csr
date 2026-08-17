import * as React from "react";

import { cn } from "@/lib/utils";

const SidebarContext = React.createContext<{ open: boolean } | null>(null);

function SidebarProvider({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <SidebarContext.Provider value={{ open }}>{children}</SidebarContext.Provider>
  );
}

function Sidebar({
  className,
  side = "right",
  open = true,
  ...props
}: React.ComponentProps<"aside"> & {
  side?: "left" | "right";
  open?: boolean;
}) {
  return (
    <aside
      data-slot="sidebar"
      data-side={side}
      data-state={open ? "open" : "closed"}
      className={cn(
        "fixed inset-y-0 z-50 flex h-full w-full max-w-md flex-col border-l bg-background text-foreground shadow-2xl transition-transform duration-200 ease-out",
        side === "right" ? "right-0 border-l" : "left-0 border-r",
        open ? "translate-x-0" : side === "right" ? "translate-x-full" : "-translate-x-full",
        className,
      )}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex items-center justify-between gap-2 border-b px-4 py-3", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("mt-auto border-t px-4 py-3", className)}
      {...props}
    />
  );
}

function SidebarTrigger({ className, ...props }: React.ComponentProps<typeof Button>) {
  return <button data-slot="sidebar-trigger" className={cn("", className)} {...props} />;
}

function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-inset" className={cn("flex flex-1 flex-col", className)} {...props} />;
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
};

function Button({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-input bg-background px-2 py-1 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}
