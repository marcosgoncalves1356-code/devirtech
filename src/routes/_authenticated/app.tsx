import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { CompanyProvider, useCompany } from "@/lib/company-context";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

function Gate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useCompany();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!session) return;
    if (session.mustChangePassword && pathname !== "/app/alterar-senha") {
      navigate({ to: "/app/alterar-senha", replace: true });
    }
  }, [session, pathname, navigate]);

  if (loading && !session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (session && session.status === "blocked") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
        Seu acesso está bloqueado. Entre em contato com o administrador DeviTech.
      </div>
    );
  }

  return <>{children}</>;
}

function AppLayout() {
  return (
    <CompanyProvider>
      <AppShell>
        <Gate>
          <Outlet />
        </Gate>
      </AppShell>
    </CompanyProvider>
  );
}
