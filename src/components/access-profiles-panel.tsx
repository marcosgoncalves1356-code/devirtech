import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  deleteAccessProfile,
  listAccessProfiles,
  saveAccessProfile,
  setAccessProfileStatus,
  type AccessProfile,
} from "@/lib/access-profiles.functions";
import { useCompany } from "@/lib/company-context";

type FormState = { id?: string; name: string; description: string; status: "active" | "blocked" };

const emptyForm: FormState = { name: "", description: "", status: "active" };

export function AccessProfilesPanel() {
  const { company, session } = useCompany();
  const isAdmin = Boolean(session?.isAdmin);
  const qc = useQueryClient();

  const fetchProfiles = useServerFn(listAccessProfiles);
  const save = useServerFn(saveAccessProfile);
  const setStatus = useServerFn(setAccessProfileStatus);
  const remove = useServerFn(deleteAccessProfile);

  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryKey = ["access-profiles", company.id];
  const { data: profiles = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchProfiles({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const done = () => {
    setError(null);
    setForm(null);
    void qc.invalidateQueries({ queryKey });
  };
  const fail = (e: Error) => setError(e.message);

  const saveMutation = useMutation({
    mutationFn: (values: FormState) =>
      save({
        data: {
          ...(values.id ? { id: values.id } : {}),
          companyId: company.id,
          name: values.name,
          description: values.description,
          status: values.status,
        },
      }),
    onSuccess: done,
    onError: fail,
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: "active" | "blocked" }) => setStatus({ data: vars }),
    onSuccess: done,
    onError: fail,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: done,
    onError: fail,
  });

  if (!company.id) {
    return (
      <p className="rounded-2xl border border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
        Nenhuma empresa vinculada. Solicite o vínculo ao administrador DeviTech.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight">Perfis e papéis</h2>
          <p className="text-sm text-muted-foreground">
            Perfis de acesso de <strong>{company.name}</strong>. As permissões por módulo serão vinculadas a estes
            perfis em uma próxima etapa.
          </p>
        </div>
        {isAdmin ? (
          <Button onClick={() => { setError(null); setForm({ ...emptyForm }); }}>
            <Plus className="mr-1 h-4 w-4" /> Novo perfil
          </Button>
        ) : null}
      </header>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p>
      ) : null}

      {form ? (
        <form
          className="space-y-3 rounded-2xl border border-primary/40 bg-primary/5 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(form);
          }}
        >
          <div className="flex items-center gap-2">
            <h3 className="flex-1 text-sm font-semibold">{form.id ? "Editar perfil" : "Novo perfil"}</h3>
            <button type="button" onClick={() => setForm(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field-shell flex items-center gap-2 text-sm">
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                placeholder="Nome do perfil (ex.: Gerente de campo)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label className="field-shell flex items-center gap-2 text-sm">
              <select
                className="min-w-0 flex-1 bg-transparent outline-none"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "blocked" })}
              >
                <option value="active">Ativo</option>
                <option value="blocked">Inativo</option>
              </select>
            </label>
          </div>
          <label className="field-shell flex items-center gap-2 text-sm">
            <input
              className="min-w-0 flex-1 bg-transparent outline-none"
              placeholder="Descrição (opcional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Salvar perfil
            </Button>
            <Button type="button" variant="outline" onClick={() => setForm(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : profiles.length === 0 ? (
        <p className="rounded-2xl border border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
          Nenhum perfil cadastrado para esta empresa ainda.
        </p>
      ) : (
        <ul className="space-y-3">
          {(profiles as AccessProfile[]).map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {p.name}
                  <span
                    className={
                      p.status === "active"
                        ? "rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-primary"
                        : "rounded-full bg-muted px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-muted-foreground"
                    }
                  >
                    {p.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.description || "Sem descrição"}
                </p>
              </div>
              {isAdmin ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm({ id: p.id, name: p.name, description: p.description, status: p.status })
                    }
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={statusMutation.isPending}
                    onClick={() =>
                      statusMutation.mutate({ id: p.id, status: p.status === "active" ? "blocked" : "active" })
                    }
                  >
                    {p.status === "active" ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Excluir o perfil “${p.name}”?`)) deleteMutation.mutate(p.id);
                    }}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
