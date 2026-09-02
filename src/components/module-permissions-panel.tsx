import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeySquare, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listAccessProfiles, type AccessProfile } from "@/lib/access-profiles.functions";
import { useCompany } from "@/lib/company-context";
import {
  clearModulePermissions,
  listModulePermissions,
  setModulePermission,
  type ModulePermission,
} from "@/lib/module-permissions.functions";
import { modules } from "@/lib/modules";

type ActionKey = "can_view" | "can_create" | "can_edit" | "can_delete";

const ACTIONS: { key: ActionKey; label: string }[] = [
  { key: "can_view", label: "Visualizar" },
  { key: "can_create", label: "Criar" },
  { key: "can_edit", label: "Editar" },
  { key: "can_delete", label: "Excluir" },
];

const EMPTY = { can_view: false, can_create: false, can_edit: false, can_delete: false };

export function ModulePermissionsPanel() {
  const { company, session } = useCompany();
  const isAdmin = Boolean(session?.isAdmin);
  const qc = useQueryClient();

  const fetchProfiles = useServerFn(listAccessProfiles);
  const fetchPermissions = useServerFn(listModulePermissions);
  const savePermission = useServerFn(setModulePermission);
  const clearAll = useServerFn(clearModulePermissions);

  const [profileId, setProfileId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ["access-profiles", company.id],
    queryFn: () => fetchProfiles({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  useEffect(() => {
    const list = profiles as AccessProfile[];
    if (list.length && !list.some((p) => p.id === profileId)) setProfileId(list[0]!.id);
    if (!list.length && profileId) setProfileId("");
  }, [profiles, profileId]);

  const permKey = ["module-permissions", profileId];
  const { data: permissions = [], isLoading: loadingPerms } = useQuery({
    queryKey: permKey,
    queryFn: () => fetchPermissions({ data: { profileId } }),
    enabled: Boolean(profileId),
  });

  const permByModule = new Map(
    (permissions as ModulePermission[]).map((p) => [p.module_slug, p] as const),
  );

  const invalidate = () => {
    setError(null);
    void qc.invalidateQueries({ queryKey: permKey });
  };

  const toggleMutation = useMutation({
    mutationFn: (vars: { moduleSlug: string; actions: typeof EMPTY }) =>
      savePermission({ data: { profileId, moduleSlug: vars.moduleSlug, actions: vars.actions } }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const clearMutation = useMutation({
    mutationFn: () => clearAll({ data: { profileId } }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const selectAllMutation = useMutation({
    mutationFn: async () => {
      const allTrue = { can_view: true, can_create: true, can_edit: true, can_delete: true };
      for (const m of availableModules) {
        await savePermission({ data: { profileId, moduleSlug: m.slug, actions: allTrue } });
      }
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const availableModules = modules.filter(
    (m) => m.slug !== "dashboard" && company.enabledModules.includes(m.slug),
  );

  if (!company.id) return null;

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <KeySquare className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight">Permissões por módulo</h2>
          <p className="text-sm text-muted-foreground">
            Defina, para cada perfil de <strong>{company.name}</strong>, quais módulos podem ser acessados e as ações
            permitidas.
          </p>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p>
      ) : null}

      {loadingProfiles ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (profiles as AccessProfile[]).length === 0 ? (
        <p className="rounded-2xl border border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
          Cadastre um perfil de acesso acima para definir as permissões por módulo.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label className="field-shell flex min-w-[16rem] items-center gap-2 text-sm">
              <select
                className="min-w-0 flex-1 bg-transparent outline-none"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
              >
                {(profiles as AccessProfile[]).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.status === "blocked" ? " (inativo)" : ""}
                  </option>
                ))}
              </select>
            </label>
            {isAdmin ? (
              <Button
                type="button"
                variant="outline"
                disabled={clearMutation.isPending || !profileId}
                onClick={() => clearMutation.mutate()}
              >
                {clearMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Limpar permissões
              </Button>
            ) : null}
          </div>

          {availableModules.length === 0 ? (
            <p className="rounded-2xl border border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
              Nenhum módulo habilitado para esta empresa.
            </p>
          ) : loadingPerms ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/60">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Módulo</th>
                    {ACTIONS.map((a) => (
                      <th key={a.key} className="px-3 py-3 text-center font-medium">
                        {a.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {availableModules.map((m) => {
                    const current = permByModule.get(m.slug);
                    const values = current
                      ? {
                          can_view: current.can_view,
                          can_create: current.can_create,
                          can_edit: current.can_edit,
                          can_delete: current.can_delete,
                        }
                      : { ...EMPTY };
                    return (
                      <tr key={m.slug} className="border-b border-border/40 last:border-0">
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2 font-medium">
                            <m.icon className="h-4 w-4 text-primary" />
                            {m.label}
                          </span>
                        </td>
                        {ACTIONS.map((a) => (
                          <td key={a.key} className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[var(--primary)]"
                              disabled={!isAdmin || toggleMutation.isPending}
                              checked={values[a.key]}
                              onChange={(e) => {
                                const next = { ...values, [a.key]: e.target.checked };
                                if (a.key === "can_view" && !e.target.checked) {
                                  next.can_create = false;
                                  next.can_edit = false;
                                  next.can_delete = false;
                                }
                                if (a.key !== "can_view" && e.target.checked) next.can_view = true;
                                toggleMutation.mutate({ moduleSlug: m.slug, actions: next });
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!isAdmin ? (
            <p className="text-xs text-muted-foreground">
              Somente o administrador DeviTech pode alterar as permissões.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
