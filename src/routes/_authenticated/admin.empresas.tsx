import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Loader2, Plus, Trash2, Lock, Unlock, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteCompany, listCompanies, saveCompany } from "@/lib/admin.functions";
import { modules } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/admin/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas clientes — Admin DeviTech" },
      { name: "description", content: "Cadastre, edite, bloqueie e exclua empresas clientes do ERP DeviTech." },
      { property: "og:title", content: "Empresas clientes — Admin DeviTech" },
      { property: "og:description", content: "Gestão global das empresas clientes do ERP DeviTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminCompanies,
});

type Draft = {
  id?: string;
  name: string;
  document: string;
  segment: string;
  status: "active" | "blocked";
  enabledModules: string[];
};

const emptyDraft: Draft = {
  name: "",
  document: "",
  segment: "",
  status: "active",
  enabledModules: modules.map((m) => m.slug),
};

function AdminCompanies() {
  const qc = useQueryClient();
  const fetchCompanies = useServerFn(listCompanies);
  const save = useServerFn(saveCompany);
  const remove = useServerFn(deleteCompany);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: () => fetchCompanies(),
  });

  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (d: Draft) => save({ data: d }),
    onSuccess: () => {
      setDraft(null);
      setError(null);
      void qc.invalidateQueries({ queryKey: ["admin-companies"] });
      void qc.invalidateQueries({ queryKey: ["session-context"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-companies"] }),
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Building2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Empresas clientes</h1>
          <p className="text-sm text-muted-foreground">
            Cada empresa possui dados totalmente isolados. Os módulos liberados definem o que os usuários enxergam.
          </p>
        </div>
        <Button variant="glow" onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="h-4 w-4" /> Nova empresa
        </Button>
      </header>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p>
      ) : null}

      {draft ? (
        <form
          className="space-y-4 rounded-2xl border border-primary/40 bg-card/70 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(draft);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              className="field-shell text-sm"
              placeholder="Razão social"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
            />
            <input
              className="field-shell text-sm"
              placeholder="CNPJ"
              value={draft.document}
              onChange={(e) => setDraft({ ...draft, document: e.target.value })}
            />
            <input
              className="field-shell text-sm"
              placeholder="Segmento"
              value={draft.segment}
              onChange={(e) => setDraft({ ...draft, segment: e.target.value })}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Módulos habilitados
            </p>
            <div className="flex flex-wrap gap-2">
              {modules.map((m) => {
                const on = draft.enabledModules.includes(m.slug);
                return (
                  <button
                    key={m.slug}
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        enabledModules: on
                          ? draft.enabledModules.filter((s) => s !== m.slug)
                          : [...draft.enabledModules, m.slug],
                      })
                    }
                    className={
                      on
                        ? "rounded-full bg-primary/20 px-3 py-1 text-xs text-primary"
                        : "rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground"
                    }
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="glow" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar empresa"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <div className="grid gap-3">
          {companies.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              Nenhuma empresa cadastrada ainda.
            </p>
          ) : null}
          {companies.map((c: any) => (
            <article
              key={c.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-4"
            >
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold">{c.name}</h2>
                <p className="truncate text-xs text-muted-foreground">
                  {c.document || "sem CNPJ"} • {c.segment || "sem segmento"} • {c.enabled_modules?.length ?? 0} módulos
                </p>
              </div>
              <span
                className={
                  c.status === "active"
                    ? "rounded-full bg-primary/15 px-3 py-1 text-xs text-primary"
                    : "rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive"
                }
              >
                {c.status === "active" ? "Ativa" : "Bloqueada"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Editar"
                onClick={() =>
                  setDraft({
                    id: c.id,
                    name: c.name,
                    document: c.document ?? "",
                    segment: c.segment ?? "",
                    status: c.status,
                    enabledModules: c.enabled_modules ?? [],
                  })
                }
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={c.status === "active" ? "Bloquear" : "Desbloquear"}
                onClick={() =>
                  saveMutation.mutate({
                    id: c.id,
                    name: c.name,
                    document: c.document ?? "",
                    segment: c.segment ?? "",
                    status: c.status === "active" ? "blocked" : "active",
                    enabledModules: c.enabled_modules ?? [],
                  })
                }
              >
                {c.status === "active" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Excluir"
                onClick={() => {
                  if (window.confirm(`Excluir ${c.name} e todos os seus usuários?`)) deleteMutation.mutate(c.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
