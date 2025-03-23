// src/__root.tsx
import Header from "@/components/layout/header";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <div className="flex flex-col min-h-screen">
      <Header />
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  ),
});
