import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Layers, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import {
  deleteCostCenter,
  listCostCenters,
  saveCostCenter,
  type CostCenter,
} from "@/lib/cost-centers.functions";

type Draft = { id?: string; name: string; description: string; status: "active" | "inactive" };

export function CostCentersPanel() {
  const { company, canEdit } = useCompany();
  const qc = useQueryClient();
  const fetchAll = useServerFn(listCostCenters);
  const save = useServerFn(saveCostCenter);
  const remove = useServerFn(deleteCostCenter);
  const editable = canEdit("financeiro");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: centers = [], isLoading } = useQuery({
    queryKey: ["cost-centers", company.id],
    queryFn: () => fetchAll({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["cost-centers", company.id] });

  const saveMutation = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          id: d.id,
          companyId: company.id,
          name: d.name,
          description: d.description,
          status: d.status,
        },
      }),
    onSuccess: () => {
      setDraft(null);
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const rows = centers as CostCenter[];

  return (
    <section className="min-w-0 max-w-full space-y-4">
      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Centros de custo</h2>
          <p className="text-sm text-muted-foreground">
            Cadastre os centros de custo usados nos lançamentos financeiros de {company.name}.
          </p>
        </div>
        {editable ? (
          <Button
            className="w-full sm:w-auto"
            variant="glow"
            onClick={() => setDraft({ name: "", description: "", status: "active" })}
          >
            <Plus className="h-4 w-4" /> Novo centro de custo
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p>
      ) : null}

      {draft ? (
        <form
          className="min-w-0 max-w-full space-y-4 rounded-2xl border border-primary/40 bg-card/80 p-4 sm:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(draft);
          }}
        >
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              className="field-shell text-sm"
              placeholder="Nome (lavoura, frota, administrativo…)"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
              minLength={2}
            />
            <input
              className="field-shell text-sm"
              placeholder="Descrição"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
            <select
              className="field-shell text-sm"
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft["status"] })}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="glow" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar centro de custo"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
          Nenhum centro de custo cadastrado.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((c) => (
            <article
              key={c.id}
              className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Layers className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">{c.name}</h3>
                <p className="truncate text-xs text-muted-foreground">
                  {c.description || "Sem descrição"} • {c.status === "active" ? "Ativo" : "Inativo"}
                </p>
              </div>
              {editable ? (
                <div className="col-span-2 flex justify-end gap-2 sm:col-span-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDraft({
                        id: c.id,
                        name: c.name,
                        description: c.description ?? "",
                        status: (c.status as Draft["status"]) ?? "active",
                      })
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Excluir o centro de custo ${c.name}?`)) removeMutation.mutate(c.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
