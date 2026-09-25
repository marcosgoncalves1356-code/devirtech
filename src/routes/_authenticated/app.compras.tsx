import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, ShoppingCart } from "lucide-react";

import { PurchaseOrdersPanel } from "@/components/purchase-orders-panel";
import { PurchaseReceiptsPanel } from "@/components/purchase-receipts-panel";
import { SuppliersPanel } from "@/components/suppliers-panel";
import { ModuleTabs, UpcomingSubmodule } from "@/components/module-tabs";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { getModule } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/app/compras")({
  head: () => ({
    meta: [
      { title: "Compras — DeviTech ERP Agro" },
      { name: "description", content: "Cadastro de fornecedores, requisições, cotações e pedidos de compra." },
      { property: "og:title", content: "Compras — DeviTech ERP Agro" },
      {
        property: "og:description",
        content: "Cadastro de fornecedores, requisições, cotações e pedidos de compra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PurchasesModule,
});

function PurchasesModule() {
  const { company, isModuleEnabled } = useCompany();
  const mod = getModule("compras");
  const enabled = isModuleEnabled("compras");
  return (
    <div className="module-frame mx-auto w-full max-w-6xl space-y-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <ShoppingCart className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Compras</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {mod?.description ?? "Requisições, cotações, pedidos de compra e homologação de fornecedores."}
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
            O módulo <strong>Compras</strong> não está habilitado para <strong>{company.name}</strong> ou seu perfil
            não possui permissão de acesso.
          </p>
          <Button asChild variant="outline">
            <Link to="/app">Voltar ao dashboard</Link>
          </Button>
        </div>
      ) : (
        <ModuleTabs
          moduleSlug="compras"
          tabs={[
            { value: "suppliers", label: "Fornecedores", content: <SuppliersPanel /> },
            { value: "orders", label: "Pedidos de compra", content: <PurchaseOrdersPanel /> },
            { value: "receipts", label: "Recebimentos", content: <PurchaseReceiptsPanel /> },
            {
              value: "quotes",
              label: "Requisição e cotação",
              content: <UpcomingSubmodule name="Requisição e cotação" />,
            },
          ]}
        />
      )}
    </div>
  );
}
