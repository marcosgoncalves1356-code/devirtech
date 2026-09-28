import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, PackageSearch } from "lucide-react";

import { ProductsServicesWorkspace } from "@/components/products-services-workspace";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { getModule } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/app/cadastros")({
  head: () => ({
    meta: [
      { title: "Cadastros mestres — DeviTech ERP" },
      { name: "description", content: "Cadastro compartilhado de produtos e serviços da empresa." },
      { property: "og:title", content: "Cadastros mestres — DeviTech ERP" },
      { property: "og:description", content: "Cadastro compartilhado de produtos e serviços da empresa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MasterDataModule,
});

function MasterDataModule() {
  const { company, isModuleEnabled, canViewSubmodule } = useCompany();
  const module = getModule("cadastros");
  const enabled = isModuleEnabled("cadastros") && canViewSubmodule("cadastros", "products-services");

  return (
    <div className="module-frame mx-auto w-full max-w-6xl space-y-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <PackageSearch className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold sm:text-3xl">Cadastros mestres</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{module?.description}</p>
        </div>
        <span className="col-span-2 max-w-full truncate rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground sm:col-span-1">
          {company.name}
        </span>
      </header>

      {!enabled ? (
        <div className="space-y-3 border-y border-destructive/40 bg-destructive/10 py-6 text-sm sm:rounded-lg sm:border sm:p-6">
          <p className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4" /> Cadastro indisponível</p>
          <p className="text-muted-foreground">Este cadastro não está liberado para a empresa ou para seu perfil.</p>
          <Button asChild variant="outline"><Link to="/app">Voltar ao dashboard</Link></Button>
        </div>
      ) : <ProductsServicesWorkspace />}
    </div>
  );
}