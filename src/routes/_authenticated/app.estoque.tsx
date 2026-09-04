import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, Lock } from "lucide-react";

import { StockBalancesPanel } from "@/components/stock-balances-panel";
import { ModuleTabs, UpcomingSubmodule } from "@/components/module-tabs";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { getModule } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/app/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque e insumos — DeviTech ERP Agro" },
      { name: "description", content: "Controle de insumos, defensivos, sementes e peças por depósito." },
      { property: "og:title", content: "Estoque e insumos — DeviTech ERP Agro" },
      { property: "og:description", content: "Controle de insumos, defensivos, sementes e peças por depósito." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StockModule,
});

function StockModule() {
  const { company, isModuleEnabled } = useCompany();
  const mod = getModule("estoque");
  const enabled = isModuleEnabled("estoque");
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Boxes className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Estoque e insumos</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {mod?.description ?? "Controle de insumos, defensivos, sementes, peças e movimentações por depósito."}
          </p>
        </div>
        <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
          {company.name}
        </span>
      </header>

      {!enabled ? (
        <div className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Lock className="h-4 w-4" /> Módulo indisponível
          </p>
          <p className="text-muted-foreground">
            O módulo <strong>Estoque e insumos</strong> não está habilitado para <strong>{company.name}</strong> ou
            seu perfil não possui permissão de acesso.
          </p>
          <Button asChild variant="outline">
            <Link to="/app">Voltar ao dashboard</Link>
          </Button>
        </div>
      ) : (
        <ModuleTabs
          tabs={[
            { value: "balances", label: "Saldos por depósito", content: <StockBalancesPanel view="balances" /> },
            { value: "movements", label: "Entradas e saídas", content: <StockBalancesPanel view="movements" /> },
            {
              value: "batches",
              label: "Lotes e validade",
              content: <UpcomingSubmodule name="Lotes e validade" />,
            },
            {
              value: "inventory",
              label: "Inventário e perdas",
              content: <UpcomingSubmodule name="Inventário e perdas" />,
            },
          ]}
        />
      )}
    </div>
  );
}
