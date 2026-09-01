import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Building2, Users, Blocks, KeyRound, LifeBuoy, LayoutDashboard, ArrowLeft } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldAlert } from "lucide-react";

import logo from "@/assets/devitech-logo.png";
import { getSessionContext } from "@/lib/session.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

export const adminNav = [
  { to: "/admin", label: "Painel DeviTech", icon: LayoutDashboard, exact: true },
  { to: "/admin/empresas", label: "Empresas clientes", icon: Building2 },
  { to: "/admin/usuarios", label: "Usuários globais", icon: Users },
  { to: "/admin/modulos", label: "Módulos e planos", icon: Blocks },
  { to: "/admin/acessos", label: "Acessos e auditoria", icon: KeyRound },
  { to: "/admin/suporte", label: "Suporte", icon: LifeBuoy },
] as const;

function AdminGuard({ children }: { children: React.ReactNode }) {
  const fetchSession = useServerFn(getSessionContext);
  const { data, isLoading } = useQuery({ queryKey: ["session-context"], queryFn: () => fetchSession() });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.isAdmin) {
    return (
      <div className="mx-auto mt-20 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center">
        <ShieldAlert className="h-8 w-8 text-destructive" />
        <h1 className="text-lg font-semibold">Área restrita</h1>
        <p className="text-sm text-muted-foreground">
          Somente o administrador DeviTech pode acessar esta área.
        </p>
        <Link to="/app" className="text-sm text-primary">Voltar ao ERP</Link>
      </div>
    );
  }

  return <>{children}</>;
}

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="tech-backdrop min-h-screen">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <img src={logo} alt="DeviTech" className="h-8 w-8" />
          <span className="text-base font-semibold">
            Devi<span className="text-primary">Tech</span>
            <span className="ml-2 rounded-md bg-primary/15 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-widest text-primary">
              Admin
            </span>
          </span>
          <Link
            to="/app"
            className="ml-auto flex items-center gap-2 rounded-xl border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao ERP
          </Link>
        </div>
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
          <ul className="flex gap-1 pb-2">
            {adminNav.map((item) => {
              const active = item.to === "/admin" ? pathname === "/admin" : pathname.startsWith(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition-colors",
                      active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <AdminGuard>
          <Outlet />
        </AdminGuard>
      </main>
    </div>
  );
}
