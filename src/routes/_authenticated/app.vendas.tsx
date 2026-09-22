import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Receipt } from "lucide-react";

import { SalesWorkspace } from "@/components/sales-workspace";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { getModule } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/app/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas — DeviTech ERP Agro" },
      { name: "description", content: "Clientes, contratos de comercialização, pedidos e faturamento." },
      { property: "og:title", content: "Vendas — DeviTech ERP Agro" },
      { property: "og:description", content: "Clientes, contratos de comercialização, pedidos e faturamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SalesModule,
});

function SalesModule() {
  const { company, isModuleEnabled } = useCompany();
  const mod = getModule("vendas");
  const enabled = isModuleEnabled("vendas");

  return (
    <div className="module-frame mx-auto w-full max-w-6xl space-y-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Receipt className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Vendas</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {mod?.description ?? "Clientes, contratos de comercialização, pedidos e faturamento da produção."}
          </p>
        </div>
        <span className="col-span-2 max-w-full truncate rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground sm:col-span-1">
          {company.name}
        </span>
      </header>

      {!enabled ? (
        <div className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Lock className="h-4 w-4" /> Módulo indisponível
          </p>
          <p className="text-muted-foreground">
            O módulo <strong>Vendas</strong> não está habilitado para <strong>{company.name}</strong> ou seu perfil não
            possui permissão de acesso.
          </p>
          <Button asChild variant="outline">
            <Link to="/app">Voltar ao dashboard</Link>
          </Button>
        </div>
      ) : (
        <SalesWorkspace />
      )}
    </div>
  );
}
