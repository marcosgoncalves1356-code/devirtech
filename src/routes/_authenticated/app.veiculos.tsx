import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck } from "lucide-react";

import { FleetWorkspace } from "@/components/fleet-workspace";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";

export const Route = createFileRoute("/_authenticated/app/veiculos")({
  head: () => ({
    meta: [
      { title: "Veículos e combustível — DeviTech ERP Agro" },
      { name: "description", content: "Frota, máquinas, abastecimentos, manutenção e custo por hora." },
      { property: "og:title", content: "Veículos e combustível — DeviTech ERP Agro" },
      { property: "og:description", content: "Frota, máquinas, abastecimentos, manutenção e custo por hora." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FleetModule,
});

function FleetModule() {
  const { company, isModuleEnabled } = useCompany();
  return <div className="module-frame mx-auto w-full max-w-6xl space-y-6">
    <header className="flex flex-wrap items-start gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"><Truck className="h-6 w-6" /></span>
      <div className="min-w-0 flex-1"><h1 className="text-2xl font-semibold sm:text-3xl">Veículos e combustível</h1><p className="mt-1 text-sm text-muted-foreground">{company.name}</p></div>
    </header>
    {isModuleEnabled("veiculos") ? <FleetWorkspace key={company.id} /> : <div className="space-y-3 border-y border-border/60 py-8 text-sm"><p>Módulo indisponível para esta empresa.</p><Button asChild variant="outline"><Link to="/app">Voltar ao dashboard</Link></Button></div>}
  </div>;
}
