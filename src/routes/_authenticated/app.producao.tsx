import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Sprout } from "lucide-react";

import { ProductionWorkspace } from "@/components/production-workspace";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { getModule } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/app/producao")({
  head: () => ({
    meta: [
      { title: "Produção — DeviTech ERP Agro" },
      { name: "description", content: "Safras, plantio, aplicações, colheita e produtividade agrícola." },
      { property: "og:title", content: "Produção — DeviTech ERP Agro" },
      { property: "og:description", content: "Safras, plantio, aplicações, colheita e produtividade agrícola." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductionModule,
});

function ProductionModule() {
  const { company, isModuleEnabled } = useCompany();
  const mod = getModule("producao");
  const enabled = isModuleEnabled("producao");

  return (
    <div className="module-frame mx-auto w-full max-w-6xl space-y-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Sprout className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Produção</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {mod?.description ?? "Safras, plantio, aplicações, colheita e produtividade agrícola."}
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
            O módulo <strong>Produção</strong> não está habilitado para <strong>{company.name}</strong> ou seu perfil
            não possui permissão de acesso.
          </p>
          <Button asChild variant="outline">
            <Link to="/app">Voltar ao dashboard</Link>
          </Button>
        </div>
      ) : (
        <ProductionWorkspace />
      )}
    </div>
  );
}
