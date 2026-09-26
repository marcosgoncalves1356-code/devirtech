import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import {
  deleteProductService,
  listProductsServices,
  saveProductService,
  type ProductService,
} from "@/lib/products-services.functions";

type Draft = {
  id?: string;
  kind: "product" | "service";
  code: string;
  name: string;
  description: string;
  unit: string;
  category: string;
  status: "active" | "inactive";
};

const EMPTY_DRAFT: Draft = {
  kind: "product",
  code: "",
  name: "",
  description: "",
  unit: "un",
  category: "",
  status: "active",
};

export function ProductsServicesWorkspace() {
  const { company, canCreate, canEdit, canDelete } = useCompany();
  const queryClient = useQueryClient();
  const fetchRecords = useServerFn(listProductsServices);
  const saveRecord = useServerFn(saveProductService);
  const removeRecord = useServerFn(deleteProductService);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const permissionKey = "cadastros.products-services";
  const queryKey = ["products-services", company.id];

  const { data: records = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchRecords({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const visibleRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) =>
      [record.code, record.name, record.category, record.description].some((value) => value.toLowerCase().includes(term)),
    );
  }, [records, search]);

  const invalidate = () => {
    setError(null);
    setDraft(null);
    void queryClient.invalidateQueries({ queryKey });
  };

  const saveMutation = useMutation({
    mutationFn: (value: Draft) => saveRecord({ data: { ...value, companyId: company.id } }),
    onSuccess: invalidate,
    onError: (cause: Error) => setError(cause.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeRecord({ data: { id, companyId: company.id } }),
    onSuccess: invalidate,
    onError: (cause: Error) => setError(cause.message),
  });

  const edit = (record: ProductService) => setDraft({
    id: record.id,
    kind: record.kind,
    code: record.code,
    name: record.name,
    description: record.description,
    unit: record.unit,
    category: record.category,
    status: record.status,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="field-shell flex min-w-0 flex-1 items-center gap-2 text-sm sm:min-w-72">
          <Search className="h-4 w-4 text-primary" />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none"
            placeholder="Buscar por código, nome ou categoria"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        {canCreate(permissionKey) ? (
          <Button variant="glow" onClick={() => setDraft({ ...EMPTY_DRAFT })}>
            <Plus className="h-4 w-4" /> Novo cadastro
          </Button>
        ) : null}
      </div>

      {error ? <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p> : null}

      {draft ? (
        <form
          className="space-y-4 border-y border-border/60 bg-card/40 px-3 py-5 sm:rounded-lg sm:border sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate(draft);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 text-xs text-muted-foreground">
              Tipo
              <select className="field-shell w-full text-sm" value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as Draft["kind"] })}>
                <option value="product">Produto</option>
                <option value="service">Serviço</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Código
              <input className="field-shell w-full text-sm" required value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2">
              Nome
              <input className="field-shell w-full text-sm" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Unidade
              <input className="field-shell w-full text-sm" required value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Categoria
              <input className="field-shell w-full text-sm" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Situação
              <select className="field-shell w-full text-sm" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Draft["status"] })}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2 lg:col-span-4">
              Descrição
              <textarea className="field-shell min-h-20 w-full resize-y text-sm" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancelar</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : visibleRecords.length === 0 ? (
        <p className="border-y border-border/60 py-8 text-center text-sm text-muted-foreground">Nenhum produto ou serviço encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-muted/30 text-left text-xs text-muted-foreground">
              <tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Unidade</th><th className="px-4 py-3">Situação</th><th className="px-4 py-3 text-right">Ações</th></tr>
            </thead>
            <tbody>
              {visibleRecords.map((record) => (
                <tr key={record.id} className="border-t border-border/50">
                  <td className="px-4 py-3 font-mono text-xs">{record.code}</td>
                  <td className="px-4 py-3 font-medium">{record.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{record.kind === "product" ? "Produto" : "Serviço"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{record.category || "—"}</td>
                  <td className="px-4 py-3">{record.unit}</td>
                  <td className="px-4 py-3">{record.status === "active" ? "Ativo" : "Inativo"}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      {canEdit(permissionKey) ? <Button size="icon" variant="ghost" aria-label={`Editar ${record.name}`} onClick={() => edit(record)}><Pencil className="h-4 w-4" /></Button> : null}
                      {canDelete(permissionKey) ? <Button size="icon" variant="ghost" aria-label={`Excluir ${record.name}`} disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`Excluir ${record.name}?`)) deleteMutation.mutate(record.id); }}><Trash2 className="h-4 w-4" /></Button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}