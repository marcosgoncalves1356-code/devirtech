import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import {
  deleteDepartment,
  deleteJobPosition,
  listDepartments,
  listJobPositions,
  saveDepartment,
  saveJobPosition,
  type Department,
  type JobPosition,
} from "@/lib/org-structure.functions";

type DepDraft = { id?: string; name: string; description: string; status: "active" | "inactive" };
type PosDraft = DepDraft & { departmentId: string };

export function OrgStructurePanel() {
  const { company, canEdit } = useCompany();
  const qc = useQueryClient();
  const editable = canEdit("funcionarios");

  const fetchDeps = useServerFn(listDepartments);
  const fetchPos = useServerFn(listJobPositions);
  const saveDep = useServerFn(saveDepartment);
  const savePos = useServerFn(saveJobPosition);
  const removeDep = useServerFn(deleteDepartment);
  const removePos = useServerFn(deleteJobPosition);

  const [depDraft, setDepDraft] = useState<DepDraft | null>(null);
  const [posDraft, setPosDraft] = useState<PosDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: departments = [], isLoading: loadingDeps } = useQuery({
    queryKey: ["departments", company.id],
    queryFn: () => fetchDeps({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });
  const { data: positions = [], isLoading: loadingPos } = useQuery({
    queryKey: ["job-positions", company.id],
    queryFn: () => fetchPos({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["departments", company.id] });
    void qc.invalidateQueries({ queryKey: ["job-positions", company.id] });
  };

  const depMutation = useMutation({
    mutationFn: (d: DepDraft) =>
      saveDep({
        data: { id: d.id, companyId: company.id, name: d.name, description: d.description, status: d.status },
      }),
    onSuccess: () => {
      setDepDraft(null);
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const posMutation = useMutation({
    mutationFn: (d: PosDraft) =>
      savePos({
        data: {
          id: d.id,
          companyId: company.id,
          departmentId: d.departmentId || null,
          name: d.name,
          description: d.description,
          status: d.status,
        },
      }),
    onSuccess: () => {
      setPosDraft(null);
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const depName = (id: string | null) =>
    (departments as Department[]).find((d) => d.id === id)?.name ?? "sem departamento";

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Cargos e departamentos</h2>
        <p className="text-sm text-muted-foreground">
          Cadastros usados nas listas de seleção da ficha do colaborador de {company.name}.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Departamentos */}
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card/70 p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="flex-1 text-sm font-semibold">Departamentos</h3>
            {editable ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDepDraft({ name: "", description: "", status: "active" })}
              >
                <Plus className="h-4 w-4" /> Novo
              </Button>
            ) : null}
          </div>

          {depDraft ? (
            <form
              className="space-y-2 rounded-xl border border-primary/40 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                depMutation.mutate(depDraft);
              }}
            >
              <input
                className="field-shell w-full text-sm"
                placeholder="Nome do departamento"
                value={depDraft.name}
                onChange={(e) => setDepDraft({ ...depDraft, name: e.target.value })}
                required
                minLength={2}
              />
              <input
                className="field-shell w-full text-sm"
                placeholder="Descrição (opcional)"
                value={depDraft.description}
                onChange={(e) => setDepDraft({ ...depDraft, description: e.target.value })}
              />
              <select
                className="field-shell w-full text-sm"
                value={depDraft.status}
                onChange={(e) => setDepDraft({ ...depDraft, status: e.target.value as DepDraft["status"] })}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
              <div className="flex gap-2">
                <Button type="submit" size="sm" variant="glow" disabled={depMutation.isPending}>
                  {depMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setDepDraft(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : null}

          {loadingDeps ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (departments as Department[]).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum departamento cadastrado.</p>
          ) : (
            <ul className="space-y-2">
              {(departments as Department[]).map((d) => (
                <li key={d.id} className="flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{d.name}</p>
                    {d.description ? (
                      <p className="truncate text-xs text-muted-foreground">{d.description}</p>
                    ) : null}
                  </div>
                  {d.status !== "active" ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Inativo</span>
                  ) : null}
                  {editable ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar departamento"
                        onClick={() =>
                          setDepDraft({
                            id: d.id,
                            name: d.name,
                            description: d.description ?? "",
                            status: (d.status as DepDraft["status"]) ?? "active",
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir departamento"
                        onClick={async () => {
                          if (!window.confirm(`Excluir o departamento ${d.name}?`)) return;
                          try {
                            await removeDep({ data: { id: d.id } });
                            invalidate();
                          } catch (err) {
                            setError((err as Error).message);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cargos */}
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card/70 p-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <h3 className="flex-1 text-sm font-semibold">Cargos</h3>
            {editable ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPosDraft({ name: "", description: "", status: "active", departmentId: "" })}
              >
                <Plus className="h-4 w-4" /> Novo
              </Button>
            ) : null}
          </div>

          {posDraft ? (
            <form
              className="space-y-2 rounded-xl border border-primary/40 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                posMutation.mutate(posDraft);
              }}
            >
              <input
                className="field-shell w-full text-sm"
                placeholder="Nome do cargo"
                value={posDraft.name}
                onChange={(e) => setPosDraft({ ...posDraft, name: e.target.value })}
                required
                minLength={2}
              />
              <select
                className="field-shell w-full text-sm"
                value={posDraft.departmentId}
                onChange={(e) => setPosDraft({ ...posDraft, departmentId: e.target.value })}
              >
                <option value="">Sem departamento</option>
                {(departments as Department[]).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <input
                className="field-shell w-full text-sm"
                placeholder="Descrição (opcional)"
                value={posDraft.description}
                onChange={(e) => setPosDraft({ ...posDraft, description: e.target.value })}
              />
              <select
                className="field-shell w-full text-sm"
                value={posDraft.status}
                onChange={(e) => setPosDraft({ ...posDraft, status: e.target.value as PosDraft["status"] })}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
              <div className="flex gap-2">
                <Button type="submit" size="sm" variant="glow" disabled={posMutation.isPending}>
                  {posMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setPosDraft(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : null}

          {loadingPos ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (positions as JobPosition[]).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum cargo cadastrado.</p>
          ) : (
            <ul className="space-y-2">
              {(positions as JobPosition[]).map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{depName(p.department_id)}</p>
                  </div>
                  {p.status !== "active" ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Inativo</span>
                  ) : null}
                  {editable ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar cargo"
                        onClick={() =>
                          setPosDraft({
                            id: p.id,
                            name: p.name,
                            description: p.description ?? "",
                            status: (p.status as PosDraft["status"]) ?? "active",
                            departmentId: p.department_id ?? "",
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir cargo"
                        onClick={async () => {
                          if (!window.confirm(`Excluir o cargo ${p.name}?`)) return;
                          try {
                            await removePos({ data: { id: p.id } });
                            invalidate();
                          } catch (err) {
                            setError((err as Error).message);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
