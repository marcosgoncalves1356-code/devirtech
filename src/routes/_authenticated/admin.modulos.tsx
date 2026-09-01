import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Blocks, Check, Loader2, X } from "lucide-react";

import { listCompanies, saveCompany } from "@/lib/admin.functions";
import { modules } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/admin/modulos")({
  head: () => ({
    meta: [
      { title: "Módulos e planos — Admin DeviTech" },
      { name: "description", content: "Habilite ou bloqueie módulos do ERP para cada empresa cliente da DeviTech." },
      { property: "og:title", content: "Módulos e planos — Admin DeviTech" },
      { property: "og:description", content: "Matriz de módulos habilitados por empresa no ERP DeviTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminModules,
});

function AdminModules() {
  const qc = useQueryClient();
  const fetchCompanies = useServerFn(listCompanies);
  const save = useServerFn(saveCompany);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: () => fetchCompanies(),
  });

  const toggle = useMutation({
    mutationFn: (vars: { company: any; slug: string }) => {
      const current: string[] = vars.company.enabled_modules ?? [];
      const next = current.includes(vars.slug)
        ? current.filter((s) => s !== vars.slug)
        : [...current, vars.slug];
      return save({
        data: {
          id: vars.company.id,
          name: vars.company.name,
          document: vars.company.document ?? "",
          segment: vars.company.segment ?? "",
          status: vars.company.status,
          enabledModules: next,
        },
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-companies"] });
      void qc.invalidateQueries({ queryKey: ["session-context"] });
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Blocks className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Módulos e planos</h1>
          <p className="text-sm text-muted-foreground">
            Clique nas células para liberar ou bloquear módulos por empresa.
          </p>
        </div>
      </header>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/60">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="p-3">Módulo</th>
                {companies.map((c: any) => (
                  <th key={c.id} className="p-3 font-medium">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.slug} className="border-b border-border/40 last:border-0">
                  <td className="p-3">{m.label}</td>
                  {companies.map((c: any) => {
                    const on = (c.enabled_modules ?? []).includes(m.slug);
                    return (
                      <td key={c.id} className="p-3">
                        <button
                          type="button"
                          aria-label={`${on ? "Desabilitar" : "Habilitar"} ${m.label} em ${c.name}`}
                          onClick={() => toggle.mutate({ company: c, slug: m.slug })}
                          className={
                            on
                              ? "flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary"
                              : "flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground"
                          }
                        >
                          {on ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
