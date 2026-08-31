import { Link } from "@tanstack/react-router";
import { Construction, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { getModule } from "@/lib/modules";

export function ModulePage({ slug }: { slug: string }) {
  const mod = getModule(slug);
  const { company, isModuleEnabled } = useCompany();
  if (!mod) return null;

  const enabled = isModuleEnabled(slug);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <mod.icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{mod.label}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{mod.description}</p>
        </div>
        <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
          {company.name}
        </span>
      </header>

      {!enabled ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          Este módulo não está habilitado para <strong>{company.name}</strong>. Solicite a liberação na área
          administrativa DeviTech.
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        {mod.features.map((f) => (
          <article key={f} className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur">
            <h2 className="text-sm font-semibold">{f}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Estrutura pronta para receber telas, formulários e dados isolados por empresa.
            </p>
          </article>
        ))}
      </section>

      <section className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 sm:flex-row sm:items-center">
        <Construction className="h-6 w-6 text-primary" />
        <div className="flex-1">
          <h2 className="text-sm font-semibold">Módulo preparado para implementação</h2>
          <p className="text-xs text-muted-foreground">
            Rota, navegação, permissões e isolamento multiempresa já configurados. Peça a construção deste módulo
            quando quiser.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/modulos">
            Gerenciar módulos <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
