import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Building2,
  Loader2,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Pencil,
  Eye,
  X,
  Phone,
  MapPin,
  UserRound,
  Search,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteCompany, getCompanyDetail, listCompanies, saveCompany } from "@/lib/admin.functions";
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
  responsible: string;
  phone: string;
  address: string;
  logoUrl: string;
  status: "active" | "blocked";
  enabledModules: string[];
};

const emptyDraft: Draft = {
  name: "",
  document: "",
  segment: "",
  responsible: "",
  phone: "",
  address: "",
  logoUrl: "",
  status: "active",
  enabledModules: modules.map((m) => m.slug),
};

const roleLabels: Record<string, string> = {
  devitech_admin: "Admin DeviTech",
  company_admin: "Administrador",
  manager: "Gestor",
  operator: "Operador",
};

function toDraft(c: any): Draft {
  return {
    id: c.id,
    name: c.name,
    document: c.document ?? "",
    segment: c.segment ?? "",
    responsible: c.responsible ?? "",
    phone: c.phone ?? "",
    address: c.address ?? "",
    logoUrl: c.logo_url ?? "",
    status: c.status,
    enabledModules: c.enabled_modules ?? [],
  };
}

function AdminCompanies() {
  const qc = useQueryClient();
  const fetchCompanies = useServerFn(listCompanies);
  const fetchDetail = useServerFn(getCompanyDetail);
  const save = useServerFn(saveCompany);
  const remove = useServerFn(deleteCompany);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: () => fetchCompanies(),
  });

  const [draft, setDraft] = useState<Draft | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["admin-company-detail", detailId],
    queryFn: () => fetchDetail({ data: { id: detailId! } }),
    enabled: !!detailId,
  });

  const saveMutation = useMutation({
    mutationFn: (d: Draft) => save({ data: d }),
    onSuccess: () => {
      setDraft(null);
      setError(null);
      void qc.invalidateQueries({ queryKey: ["admin-companies"] });
      void qc.invalidateQueries({ queryKey: ["admin-company-detail"] });
      void qc.invalidateQueries({ queryKey: ["session-context"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      setDetailId(null);
      void qc.invalidateQueries({ queryKey: ["admin-companies"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const term = search.trim().toLowerCase();
  const visible = (companies as any[]).filter((c) =>
    !term
      ? true
      : [c.name, c.document, c.segment, c.responsible].some((v: string | null) =>
          (v ?? "").toLowerCase().includes(term),
        ),
  );

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

      <div className="field-shell max-w-md">
        <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <input
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Buscar por nome, CNPJ, responsável..."
          aria-label="Buscar empresas"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

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
          <h2 className="text-sm font-semibold">{draft.id ? "Editar empresa" : "Nova empresa"}</h2>
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
            <input
              className="field-shell text-sm"
              placeholder="Responsável"
              value={draft.responsible}
              onChange={(e) => setDraft({ ...draft, responsible: e.target.value })}
            />
            <input
              className="field-shell text-sm"
              placeholder="Telefone"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
            <select
              className="field-shell text-sm"
              value={draft.status}
              aria-label="Status"
              onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft["status"] })}
            >
              <option value="active">Ativa</option>
              <option value="blocked">Bloqueada</option>
            </select>
            <input
              className="field-shell text-sm sm:col-span-3"
              placeholder="Endereço completo"
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 bg-secondary/30 p-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-background">
              {draft.logoUrl ? (
                <img src={draft.logoUrl} alt="Logo da empresa" className="h-full w-full object-contain" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Logo da empresa</p>
              <p className="text-xs text-muted-foreground">PNG, JPG ou SVG de até 400 KB. Aparece para os usuários da empresa.</p>
            </div>
            <input
              id="company-logo-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (file.size > 400 * 1024) {
                  setError("A logo deve ter no máximo 400 KB.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => setDraft((d) => (d ? { ...d, logoUrl: String(reader.result) } : d));
                reader.readAsDataURL(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("company-logo-input")?.click()}
            >
              <Upload className="h-4 w-4" /> {draft.logoUrl ? "Alterar logo" : "Enviar logo"}
            </Button>
            {draft.logoUrl ? (
              <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, logoUrl: "" })}>
                <Trash2 className="h-4 w-4 text-destructive" /> Remover
              </Button>
            ) : null}
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
          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              {companies.length === 0 ? "Nenhuma empresa cadastrada ainda." : "Nenhuma empresa encontrada na busca."}
            </p>
          ) : null}
          {visible.map((c: any) => (
            <article
              key={c.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-4"
            >
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold">{c.name}</h2>
                <p className="truncate text-xs text-muted-foreground">
                  {c.document || "sem CNPJ"} • {c.segment || "sem segmento"} • {c.enabled_modules?.length ?? 0} módulos
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.responsible || "sem responsável"} {c.phone ? `• ${c.phone}` : ""}
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
              <Button variant="ghost" size="icon" aria-label="Ver detalhes" onClick={() => setDetailId(c.id)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setDraft(toDraft(c))}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={c.status === "active" ? "Bloquear" : "Desbloquear"}
                onClick={() =>
                  saveMutation.mutate({
                    ...toDraft(c),
                    status: c.status === "active" ? "blocked" : "active",
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

      {detailId ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-sm">
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-border/60 bg-card p-6">
            <div className="mb-4 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold">
                  {detailQuery.data?.company?.name ?? "Carregando..."}
                </h2>
                <p className="text-xs text-muted-foreground">Identificador único: {detailId}</p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Fechar" onClick={() => setDetailId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {detailQuery.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : detailQuery.error ? (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
                {(detailQuery.error as Error).message}
              </p>
            ) : detailQuery.data ? (
              <div className="space-y-6">
                <section className="grid gap-2 rounded-2xl border border-border/60 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Informações básicas
                  </p>
                  <p>CNPJ: {detailQuery.data.company.document || "—"}</p>
                  <p>Segmento: {detailQuery.data.company.segment || "—"}</p>
                  <p className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-primary" />
                    {detailQuery.data.company.responsible || "—"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    {detailQuery.data.company.phone || "—"}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {detailQuery.data.company.address || "—"}
                  </p>
                  <p>Status: {detailQuery.data.company.status === "active" ? "Ativa" : "Bloqueada"}</p>
                </section>

                <section className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Módulos contratados ({detailQuery.data.company.enabled_modules?.length ?? 0})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {modules.map((m) => {
                      const on = (detailQuery.data!.company.enabled_modules ?? []).includes(m.slug);
                      return (
                        <span
                          key={m.slug}
                          className={
                            on
                              ? "rounded-full bg-primary/20 px-3 py-1 text-xs text-primary"
                              : "rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground opacity-60"
                          }
                        >
                          {m.label}
                        </span>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Usuários vinculados ({detailQuery.data.users.length})
                  </p>
                  {detailQuery.data.users.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                      Nenhum usuário vinculado a esta empresa.
                    </p>
                  ) : (
                    detailQuery.data.users.map((u: any) => (
                      <article key={u.id} className="rounded-2xl border border-border/60 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">{u.full_name || u.username}</span>
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                            {roleLabels[u.role] ?? u.role}
                          </span>
                          <span
                            className={
                              u.status === "active"
                                ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                                : "rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive"
                            }
                          >
                            {u.status === "active" ? "Ativo" : "Bloqueado"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {u.username} • {u.email}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(u.permissions).filter(([, lvl]) => lvl !== "none").length === 0 ? (
                            <span className="text-xs text-muted-foreground">Sem permissões específicas.</span>
                          ) : (
                            Object.entries(u.permissions)
                              .filter(([, lvl]) => lvl !== "none")
                              .map(([slug, lvl]) => (
                                <span
                                  key={slug}
                                  className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                                >
                                  {modules.find((m) => m.slug === slug)?.label ?? slug}:{" "}
                                  {lvl === "edit" ? "editar" : "ver"}
                                </span>
                              ))
                          )}
                        </div>
                      </article>
                    ))
                  )}
                </section>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="glow"
                    onClick={() => {
                      setDraft(toDraft(detailQuery.data!.company));
                      setDetailId(null);
                    }}
                  >
                    <Pencil className="h-4 w-4" /> Editar empresa
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      saveMutation.mutate({
                        ...toDraft(detailQuery.data!.company),
                        status: detailQuery.data!.company.status === "active" ? "blocked" : "active",
                      })
                    }
                  >
                    {detailQuery.data.company.status === "active" ? "Bloquear" : "Ativar"}
                  </Button>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
