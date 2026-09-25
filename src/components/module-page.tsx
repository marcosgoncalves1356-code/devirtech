import { Link } from "@tanstack/react-router";
import { Construction, ArrowRight, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModuleTabs, UpcomingSubmodule } from "@/components/module-tabs";
import { useCompany } from "@/lib/company-context";
import { getModule } from "@/lib/modules";

export function ModulePage({ slug }: { slug: string }) {
  const mod = getModule(slug);
  const { company, isModuleEnabled } = useCompany();
  if (!mod) return null;

  const enabled = isModuleEnabled(slug);

  return (
    <div className="module-frame mx-auto w-full max-w-6xl space-y-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <mod.icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{mod.label}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{mod.description}</p>
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
            O módulo <strong>{mod.label}</strong> não está habilitado para <strong>{company.name}</strong> ou seu
            perfil não possui permissão de acesso. Solicite a liberação ao administrador DeviTech.
          </p>
          <Button asChild variant="outline">
            <Link to="/app">Voltar ao dashboard</Link>
          </Button>
        </div>
      ) : (
        <ModuleTabs
          moduleSlug={slug}
          tabs={mod.submodules.map((submodule) => ({
            value: submodule.value,
            label: submodule.label,
            content: (
              <div className="space-y-4">
                <UpcomingSubmodule name={submodule.label} />
                <section className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 sm:flex-row sm:items-center">
                  <Construction className="h-6 w-6 text-primary" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold">Módulo preparado para implementação</h2>
                    <p className="text-xs text-muted-foreground">
                      Rota, navegação, permissões e isolamento multiempresa já configurados. Peça a construção deste
                      módulo quando quiser.
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link to="/admin/modulos">
                      Gerenciar módulos <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </section>
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
}
