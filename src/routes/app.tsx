import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { CompanyProvider } from "@/lib/company-context";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <CompanyProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </CompanyProvider>
  );
}
