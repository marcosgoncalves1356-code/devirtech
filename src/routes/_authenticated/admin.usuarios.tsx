import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Lock, Pencil, Plus, RotateCcw, Trash2, Unlock, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  deleteUser,
  listCompanies,
  listUsers,
  resetUserPassword,
  saveUser,
  setUserStatus,
} from "@/lib/admin.functions";
import { modules } from "@/lib/modules";
import { listAccessProfiles, type AccessProfile } from "@/lib/access-profiles.functions";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários globais — Admin DeviTech" },
      {
        name: "description",
        content: "Cadastre usuários, defina senha inicial, vincule empresas e controle permissões por módulo.",
      },
      { property: "og:title", content: "Usuários globais — Admin DeviTech" },
      { property: "og:description", content: "Gestão de usuários, senhas e permissões do ERP DeviTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminUsers,
});

type Level = "none" | "view" | "edit";
type Draft = {
  id?: string;
  email: string;
  username: string;
  fullName: string;
  jobTitle: string;
  password?: string;
  companyId: string | null;
  accessProfileId: string | null;
  role: "devitech_admin" | "company_admin" | "manager" | "operator";
  status: "active" | "blocked";
  permissions: Record<string, Level>;
};


const roleLabels: Record<Draft["role"], string> = {
  devitech_admin: "Administrador DeviTech",
  company_admin: "Administrador da empresa",
  manager: "Gestor",
  operator: "Operador",
};

function defaultPerms(level: Level = "edit"): Record<string, Level> {
  return Object.fromEntries(modules.map((m) => [m.slug, level])) as Record<string, Level>;
}

function AdminUsers() {
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listUsers);
  const fetchCompanies = useServerFn(listCompanies);
  const fetchProfiles = useServerFn(listAccessProfiles);
  const save = useServerFn(saveUser);
  const reset = useServerFn(resetUserPassword);
  const status = useServerFn(setUserStatus);
  const remove = useServerFn(deleteUser);

  const { data: users = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => fetchUsers() });
  const { data: companies = [] } = useQuery({ queryKey: ["admin-companies"], queryFn: () => fetchCompanies() });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { data: accessProfiles = [] } = useQuery({
    queryKey: ["access-profiles", draft?.companyId],
    queryFn: () => fetchProfiles({ data: { companyId: draft?.companyId ?? "" } }),
    enabled: Boolean(draft?.companyId),
  });
  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin-users"] });

  const term = search.trim().toLowerCase();
  const visibleUsers = (users as any[]).filter((u) => {
    const matchCompany =
      companyFilter === "all"
        ? true
        : companyFilter === "none"
          ? !u.company_id
          : u.company_id === companyFilter;
    const matchTerm =
      !term ||
      [u.full_name, u.username, u.email, u.job_title].some((v: string | null) =>
        (v ?? "").toLowerCase().includes(term),
      );
    return matchCompany && matchTerm;
  });

  const saveMutation = useMutation({
    mutationFn: (d: Draft) => save({ data: d }),
    onSuccess: () => {
      setDraft(null);
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Users className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Usuários globais</h1>
          <p className="text-sm text-muted-foreground">
            Não existe cadastro público: todo acesso é criado aqui, com senha inicial temporária e vínculo a uma
            empresa.
          </p>
        </div>
        <Button
          variant="glow"
          onClick={() =>
            setDraft({
              email: "",
              username: "",
              fullName: "",
              jobTitle: "",
              password: "",

              companyId: (companies[0] as any)?.id ?? null,
              accessProfileId: null,
              role: "operator",
              status: "active",
              permissions: defaultPerms("view"),
            })
          }
        >
          <Plus className="h-4 w-4" /> Novo usuário
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
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="field-shell text-sm"
              placeholder="Nome completo"
              value={draft.fullName}
              onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
              required
            />
            <input
              className="field-shell text-sm"
              placeholder="Cargo (ex.: Gerente de Produção)"
              value={draft.jobTitle}
              onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })}
            />
            <input
              className="field-shell text-sm"
              type="email"
              placeholder="E-mail de acesso"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              required
            />
            <input
              className="field-shell text-sm"
              type="text"
              placeholder="Nome de usuário (ex.: joao.silva)"
              value={draft.username}
              onChange={(e) => setDraft({ ...draft, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
              pattern="[a-z0-9._-]{3,32}"
              title="Use de 3 a 32 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado."
              autoCapitalize="none"
              spellCheck={false}
              required
            />

            <input
              className="field-shell text-sm"
              type="text"
              placeholder={draft.id ? "Nova senha (opcional)" : "Senha inicial (mín. 8 caracteres)"}
              value={draft.password ?? ""}
              onChange={(e) => setDraft({ ...draft, password: e.target.value })}
              {...(draft.id ? {} : { required: true, minLength: 8 })}
            />
            <select
              className="field-shell text-sm"
              value={draft.companyId ?? ""}
              onChange={(e) => setDraft({ ...draft, companyId: e.target.value || null, accessProfileId: null })}
              required={draft.role !== "devitech_admin"}
            >
              <option value="">
                {draft.role === "devitech_admin" ? "Sem empresa (uso interno DeviTech)" : "Selecione a empresa…"}
              </option>
              {companies.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select className="field-shell text-sm" value={draft.accessProfileId ?? ""}
              onChange={(e) => setDraft({ ...draft, accessProfileId: e.target.value || null })}
              disabled={!draft.companyId || draft.role === "devitech_admin"}>
              <option value="">Permissões individuais atuais</option>
              {(accessProfiles as AccessProfile[]).filter((profile) => profile.status === "active").map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.name}</option>
              ))}
            </select>
            <select
              className="field-shell text-sm"
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value as Draft["role"] })}
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className="field-shell text-sm"
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft["status"] })}
            >
              <option value="active">Ativo</option>
              <option value="blocked">Bloqueado</option>
            </select>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Permissões por módulo
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((m) => (
                <label key={m.slug} className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-xs">{m.label}</span>
                  <select
                    className="rounded-lg bg-secondary/60 px-2 py-1 text-xs"
                    value={draft.permissions[m.slug] ?? "none"}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        permissions: { ...draft.permissions, [m.slug]: e.target.value as Level },
                      })
                    }
                  >
                    <option value="none">Sem acesso</option>
                    <option value="view">Ver</option>
                    <option value="edit">Editar</option>
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="glow" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar usuário"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_260px]">
        <input
          className="field-shell text-sm"
          placeholder="Buscar por nome, usuário ou e-mail"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="field-shell text-sm"
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
        >
          <option value="all">Todas as empresas</option>
          <option value="none">Sem empresa (DeviTech)</option>
          {companies.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <div className="grid gap-3">
          {visibleUsers.map((u: any) => (
            <article
              key={u.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-4"
            >
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold">
                  {u.full_name || u.email}
                  {u.username ? <span className="ml-2 text-xs font-normal text-primary">@{u.username}</span> : null}
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email} • {u.company_name ?? "sem empresa"}{u.job_title ? ` • ${u.job_title}` : ""} • {roleLabels[u.role as Draft["role"]] ?? u.role}
                  {u.must_change_password ? " • senha temporária" : ""}
                </p>
              </div>
              <span
                className={
                  u.status === "active"
                    ? "rounded-full bg-primary/15 px-3 py-1 text-xs text-primary"
                    : "rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive"
                }
              >
                {u.status === "active" ? "Ativo" : "Bloqueado"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Editar"
                onClick={() =>
                  setDraft({
                    id: u.id,
                    email: u.email,
                    username: u.username ?? "",
                    fullName: u.full_name,
                    jobTitle: u.job_title ?? "",
                    password: "",
                    companyId: u.company_id,
                    accessProfileId: u.access_profile_id ?? null,
                    role: u.role,
                    status: u.status,
                    permissions: { ...defaultPerms("none"), ...(u.permissions ?? {}) },
                  })
                }
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Redefinir senha"
                onClick={async () => {
                  const pwd = window.prompt(`Nova senha temporária para ${u.email} (mín. 8 caracteres)`);
                  if (!pwd) return;
                  try {
                    await reset({ data: { id: u.id, password: pwd } });
                    invalidate();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={u.status === "active" ? "Bloquear" : "Desbloquear"}
                onClick={async () => {
                  await status({ data: { id: u.id, status: u.status === "active" ? "blocked" : "active" } });
                  invalidate();
                }}
              >
                {u.status === "active" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Excluir"
                onClick={async () => {
                  if (!window.confirm(`Excluir o acesso de ${u.email}?`)) return;
                  try {
                    await remove({ data: { id: u.id } });
                    invalidate();
                  } catch (e) {
                    setError((e as Error).message);
                  }
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
