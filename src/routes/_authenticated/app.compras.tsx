import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, ShoppingCart } from "lucide-react";

import { PurchaseOrdersPanel } from "@/components/purchase-orders-panel";
import { SuppliersPanel } from "@/components/suppliers-panel";
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
  const upcoming = (mod?.features ?? []).filter((f) => f !== "Fornecedores" && f !== "Pedidos de compra");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <ShoppingCart className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Compras</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {mod?.description ?? "Requisições, cotações, pedidos de compra e homologação de fornecedores."}
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
            O módulo <strong>Compras</strong> não está habilitado para <strong>{company.name}</strong> ou seu perfil
            não possui permissão de acesso.
          </p>
          <Button asChild variant="outline">
            <Link to="/app">Voltar ao dashboard</Link>
          </Button>
        </div>
      ) : (
        <>
          <SuppliersPanel />

          <PurchaseOrdersPanel />

          <section className="grid gap-4 sm:grid-cols-3">
            {upcoming.map((f) => (
              <article key={f} className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" /> {f}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">Liberação prevista para uma próxima etapa.</p>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
