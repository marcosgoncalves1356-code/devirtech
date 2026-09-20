import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X, LogOut, Bell, Search, ShieldHalf, ChevronDown, Check, Building2, Smartphone, KeyRound, Eye } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

import logo from "@/assets/devitech-logo.png";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { useCompany } from "@/lib/company-context";
import { modules, moduleGroups, mobileNavSlugs } from "@/lib/modules";
import { cn } from "@/lib/utils";

function CompanyLogo({ company, className }: { company: { name: string; logoUrl: string }; className?: string }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-background",
        className,
      )}
    >
      {company.logoUrl ? (
        <img src={company.logoUrl} alt={`Logo ${company.name}`} className="h-full w-full object-contain" />
      ) : (
        <Building2 className="h-4 w-4 text-muted-foreground" />
      )}
    </span>
  );
}

function CompanySwitcher({ className }: { className?: string }) {
  const { companies, company, setCompanyId, session, viewAs } = useCompany();
  const [open, setOpen] = useState(false);
  const canSwitch = (session?.isAdmin ?? false) && !viewAs && companies.length > 1;

  if (!canSwitch) {
    return (
      <div className={cn("flex items-center gap-2 rounded-xl border border-border/70 bg-secondary/60 px-3 py-2", className)}>
        <CompanyLogo company={company} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">{company.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{company.segment || company.document}</span>
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-secondary/60 px-3 py-2 text-left transition-colors hover:border-primary/50"
      >
        <span className="flex min-w-0 items-center gap-2">
          <CompanyLogo company={company} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">{company.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{company.segment}</span>
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <ul className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-border/70 bg-popover p-1 shadow-xl">
            {companies.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCompanyId(c.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{c.document}</span>
                  </span>
                  {c.id === company.id ? <Check className="h-4 w-4 text-primary" /> : null}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { isModuleEnabled } = useCompany();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="space-y-5">
      {moduleGroups.map((group) => {
        const items = modules.filter((m) => m.group === group && isModuleEnabled(m.slug));
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {group}
            </p>
            <ul className="space-y-1">
              {items.map((m) => {
                const active = m.path === "/app" ? pathname === "/app" : pathname.startsWith(m.path);
                return (
                  <li key={m.slug}>
                    <Link
                      to={m.path}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_var(--color-primary)]"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <m.icon className="h-[1.05rem] w-[1.05rem] shrink-0" />
                      <span className="truncate">{m.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/app" className="flex items-center gap-3">
      <img src={logo} alt="DeviTech" className="h-9 w-9" />
      <span className="text-lg font-semibold tracking-tight">
        Devi<span className="text-primary">Tech</span>
        <span className="ml-2 rounded-md bg-secondary px-1.5 py-0.5 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
          ERP
        </span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isModuleEnabled, session, viewAs, exitViewAs, company } = useCompany();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const initials = (session?.fullName || session?.email || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const isAdmin = (session?.isAdmin ?? false) && !viewAs;
  const mobileItems = modules.filter((m) => mobileNavSlugs.includes(m.slug) && isModuleEnabled(m.slug));

  return (
    <div className="tech-backdrop min-h-screen">
      {/* Sidebar — versão web */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-border/60 bg-card/70 backdrop-blur-xl lg:flex">
        <div className="px-5 py-5">
          <Brand />
        </div>
        <div className="px-4 pb-4">
          <CompanySwitcher />
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-6">
          <NavList />
        </div>
        <div className="border-t border-border/60 p-4">
          {isAdmin ? (
          <Link
            to="/admin"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ShieldHalf className="h-[1.05rem] w-[1.05rem]" />
            Área administrativa
          </Link>
          ) : null}
          <Link
            to="/app/alterar-senha"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <KeyRound className="h-[1.05rem] w-[1.05rem]" />
            Alterar senha
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-[1.05rem] w-[1.05rem]" />
            Sair
          </button>
        </div>
      </aside>

      {/* Drawer — versão aplicativo */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col border-r border-border/60 bg-card">
            <div className="flex items-center justify-between px-5 py-4">
              <Brand />
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="px-4 pb-4">
              <CompanySwitcher />
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-6">
              <NavList onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-border/60 p-4">
              {isAdmin ? (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ShieldHalf className="h-[1.05rem] w-[1.05rem]" /> Área administrativa
              </Link>
              ) : null}
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-[1.05rem] w-[1.05rem]" /> Sair
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-w-0 max-w-full overflow-x-clip lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden flex-1 items-center gap-2 rounded-xl border border-border/60 bg-secondary/50 px-3 py-2 sm:flex sm:max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Buscar em todos os módulos"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="lg:hidden">
              <Brand />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-[0.68rem] text-muted-foreground md:inline-flex">
                <Smartphone className="h-3.5 w-3.5" /> Web + App
              </span>
              <Button variant="ghost" size="icon" aria-label="Notificações">
                <Bell className="h-5 w-5" />
              </Button>
              <span className="hidden text-right text-xs leading-tight sm:block">
                <span className="block max-w-[10rem] truncate font-medium text-foreground">
                  {session?.fullName || session?.email}
                </span>
                <span className="block text-muted-foreground">{isAdmin ? "Admin DeviTech" : "Usuário"}</span>
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {viewAs ? (
          <div className="border-b border-sky-400/40 bg-sky-400/10">
            <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-xs sm:px-6">
              <Eye className="h-4 w-4 text-sky-400" />
              <span className="text-foreground">
                Visualizando como{" "}
                <strong>{viewAs.userName ? `${viewAs.userName} (${viewAs.role ?? "usuário"})` : "empresa"}</strong> em{" "}
                <strong>{company.name}</strong> — módulos e permissões reais aplicados.
              </span>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto h-7"
                onClick={() => {
                  exitViewAs();
                  navigate({ to: "/admin/visualizar" });
                }}
              >
                Sair da visualização
              </Button>
            </div>
          </div>
        ) : null}

        <PullToRefresh>
          <main className="min-w-0 max-w-full px-4 pb-28 pt-6 sm:px-6 lg:pb-12">{children}</main>
        </PullToRefresh>
      </div>

      {/* Barra inferior — versão aplicativo */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur-xl lg:hidden">
        <ul className="grid grid-cols-5">
          {mobileItems.map((m) => {
            const active = m.path === "/app" ? pathname === "/app" : pathname.startsWith(m.path);
            return (
              <li key={m.slug}>
                <Link
                  to={m.path}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[0.68rem]",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <m.icon className="h-5 w-5" />
                  {m.short}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex w-full flex-col items-center gap-1 py-2.5 text-[0.68rem] text-muted-foreground"
            >
              <Menu className="h-5 w-5" />
              Mais
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
