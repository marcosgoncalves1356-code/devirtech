import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Blocks, Check, Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listCompanies, setCompanyModules } from "@/lib/admin.functions";
import { getSubmoduleKey, modules } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/admin/modulos")({
  head: () => ({
    meta: [
      { title: "Módulos por empresa — Admin DeviTech" },
      { name: "description", content: "Habilite ou bloqueie módulos do ERP para cada empresa cliente da DeviTech." },
      { property: "og:title", content: "Módulos por empresa — Admin DeviTech" },
      { property: "og:description", content: "Controle de módulos contratados por empresa no ERP DeviTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminModules,
});

/** Dashboard e Configurações são estruturais e ficam sempre disponíveis. */
const CORE_MODULES = ["dashboard", "configuracoes"];
const optionalModules = modules.filter((m) => !CORE_MODULES.includes(m.slug));

function AdminModules() {
  const qc = useQueryClient();
  const fetchCompanies = useServerFn(listCompanies);
  const saveModules = useServerFn(setCompanyModules);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: () => fetchCompanies(),
  });

  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: (vars: { companyId: string; enabledModules: string[]; enabledSubmodules: string[] }) => saveModules({ data: vars }),
    onMutate: (vars) => setPending(vars.companyId),
    onSuccess: () => {
      setError(null);
      void qc.invalidateQueries({ queryKey: ["admin-companies"] });
      void qc.invalidateQueries({ queryKey: ["session-context"] });
    },
    onError: (e: Error) => setError(e.message),
    onSettled: () => setPending(null),
  });

  const term = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      (companies as any[]).filter(
        (c) => !term || `${c.name} ${c.document ?? ""} ${c.segment ?? ""}`.toLowerCase().includes(term),
      ),
    [companies, term],
  );

  const setModules = (company: any, next: string[]) =>
    update.mutate({
      companyId: company.id,
      enabledModules: Array.from(new Set([...CORE_MODULES, ...next])),
      enabledSubmodules: company.enabled_submodules ?? [],
    });
  const setSubmodule = (company: any, moduleSlug: string, value: string, on: boolean) => {
    const key = getSubmoduleKey(moduleSlug, value);
    const current: string[] = company.enabled_submodules ?? [];
    update.mutate({ companyId: company.id, enabledModules: company.enabled_modules ?? [], enabledSubmodules: on ? [...current, key] : current.filter((item) => item !== key) });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Blocks className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Módulos por empresa</h1>
          <p className="text-sm text-muted-foreground">
            Ative ou desative os módulos contratados por cada empresa cliente. Usuários só enxergam os módulos
            liberados para a empresa à qual estão vinculados.
          </p>
        </div>
      </header>

      <label className="field-shell flex items-center gap-2 text-sm">
        <Search className="h-4 w-4 text-primary" />
        <input
          className="min-w-0 flex-1 bg-transparent outline-none"
          placeholder="Buscar empresa"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p>
      ) : null}

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
          Nenhuma empresa encontrada. Cadastre empresas em “Empresas clientes”.
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map((company: any) => {
            const enabled: string[] = company.enabled_modules ?? [];
            const active = optionalModules.filter((m) => enabled.includes(m.slug)).length;
            const busy = pending === company.id;
            return (
              <section key={company.id} className="rounded-2xl border border-border/60 bg-card/60 p-5">
                <header className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold">{company.name}</h2>
                    <p className="truncate text-xs text-muted-foreground">
                      {company.document || "sem CNPJ"} • {active} de {optionalModules.length} módulos ativos
                      {company.status === "blocked" ? " • empresa bloqueada" : ""}
                    </p>
                  </div>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModules(company, optionalModules.map((m) => m.slug))}
                  >
                    Ativar todos
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setModules(company, [])}>
                    Desativar todos
                  </Button>
                </header>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {optionalModules.map((m) => {
                    const on = enabled.includes(m.slug);
                    return (
                      <div key={m.slug} className="min-w-0">
                      <button
                        type="button"
                        disabled={busy}
                        aria-pressed={on}
                        onClick={() =>
                          setModules(
                            company,
                            on
                              ? enabled.filter((s: string) => s !== m.slug)
                              : [...enabled, m.slug],
                          )
                        }
                         className={
                           "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition " +
                          (on
                            ? "border-primary/50 bg-primary/10 text-foreground"
                            : "border-border/60 text-muted-foreground hover:border-border")
                        }
                      >
                        <span
                          className={
                            on
                              ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary"
                              : "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-border/60"
                          }
                        >
                          {on ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{m.label}</span>
                      </button>
                      {on && m.submodules.length ? (
                        <div className="mb-2 ml-3 mt-2 grid gap-1 border-l border-border/60 pl-3">
                          {m.submodules.map((submodule) => {
                            const key = getSubmoduleKey(m.slug, submodule.value);
                            const subOn = (company.enabled_submodules ?? []).includes(key);
                            return <label key={key} className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                              <input type="checkbox" checked={subOn} disabled={busy} onChange={(event) => setSubmodule(company, m.slug, submodule.value, event.target.checked)} />
                              {submodule.label}{!submodule.implemented ? " (em breve)" : ""}
                            </label>;
                          })}
                        </div>
                      ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Dashboard e Configurações permanecem sempre ativos por serem estruturais. As funcionalidades internas de cada
        módulo serão construídas em etapas seguintes.
      </p>
    </div>
  );
}
