import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardList, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import {
  deletePurchaseOrder,
  listPurchaseOrders,
  savePurchaseOrder,
  setPurchaseOrderStatus,
  type PurchaseOrder,
} from "@/lib/purchase-orders.functions";
import { listSuppliers, type Supplier } from "@/lib/suppliers.functions";

type ItemDraft = { description: string; unit: string; quantity: string; unitPrice: string };
type Draft = {
  id?: string;
  supplierId: string;
  supplier: string;
  purchasedAt: string;
  expectedDate: string;
  notes: string;
  status: "draft" | "confirmed" | "canceled";
  items: ItemDraft[];
};

const STATUS_LABEL: Record<Draft["status"], string> = {
  draft: "Rascunho",
  confirmed: "Confirmado",
  canceled: "Cancelado",
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const emptyItem = (): ItemDraft => ({ description: "", unit: "un", quantity: "1", unitPrice: "0" });

function emptyDraft(): Draft {
  return {
    supplierId: "",
    supplier: "",
    purchasedAt: new Date().toISOString().slice(0, 10),
    expectedDate: "",
    notes: "",
    status: "draft",
    items: [emptyItem()],
  };
}

function toDraft(o: PurchaseOrder): Draft {
  return {
    id: o.id,
    supplierId: o.supplier_id ?? "",
    supplier: o.supplier ?? "",
    purchasedAt: o.purchased_at?.slice(0, 10) ?? "",
    expectedDate: o.expected_date?.slice(0, 10) ?? "",
    notes: o.notes ?? "",
    status: o.status,
    items:
      (o.items ?? []).length > 0
        ? o.items.map((i) => ({
            description: i.description,
            unit: i.unit,
            quantity: String(i.quantity),
            unitPrice: String(i.unit_price),
          }))
        : [emptyItem()],
  };
}

export function PurchaseOrdersPanel() {
  const { company, canEdit } = useCompany();
  const qc = useQueryClient();
  const fetchOrders = useServerFn(listPurchaseOrders);
  const fetchSuppliers = useServerFn(listSuppliers);
  const save = useServerFn(savePurchaseOrder);
  const changeStatus = useServerFn(setPurchaseOrderStatus);
  const remove = useServerFn(deletePurchaseOrder);
  const editable = canEdit("compras");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Draft["status"]>("all");
  const [error, setError] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["purchase-orders", company.id],
    queryFn: () => fetchOrders({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers", company.id],
    queryFn: () => fetchSuppliers({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["purchase-orders", company.id] });

  const saveMutation = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          id: d.id,
          companyId: company.id,
          supplierId: d.supplierId || null,
          supplier: d.supplier,
          purchasedAt: d.purchasedAt,
          expectedDate: d.expectedDate || null,
          notes: d.notes,
          status: d.status,
          items: d.items.map((i) => ({
            description: i.description,
            unit: i.unit,
            quantity: Number(i.quantity || 0),
            unitPrice: Number(i.unitPrice || 0),
          })),
        },
      }),
    onSuccess: () => {
      setDraft(null);
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const statusMutation = useMutation({
    mutationFn: (v: { id: string; status: Draft["status"] }) => changeStatus({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const rows = orders as PurchaseOrder[];
  const supplierRows = suppliers as Supplier[];
  const term = search.trim().toLowerCase();

  const visible = useMemo(
    () =>
      rows.filter((o) => {
        if (filter !== "all" && o.status !== filter) return false;
        if (!term) return true;
        return (
          (o.supplier ?? "").toLowerCase().includes(term) ||
          (o.notes ?? "").toLowerCase().includes(term) ||
          (o.items ?? []).some((i) => i.description.toLowerCase().includes(term))
        );
      }),
    [rows, term, filter],
  );

  const draftTotal = draft
    ? draft.items.reduce((acc, i) => acc + Number(i.quantity || 0) * Number(i.unitPrice || 0), 0)
    : 0;
  const openTotal = visible.filter((o) => o.status !== "canceled").reduce((acc, o) => acc + Number(o.total ?? 0), 0);

  const updateItem = (index: number, patch: Partial<ItemDraft>) => {
    if (!draft) return;
    setDraft({ ...draft, items: draft.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Pedidos de compra</h2>
          <p className="text-sm text-muted-foreground">
            Cadastro, edição, consulta e alteração de status dos pedidos de {company.name}, com fornecedor, itens,
            quantidades e preços.
          </p>
        </div>
        {editable ? (
          <Button variant="glow" onClick={() => setDraft(emptyDraft())}>
            <Plus className="h-4 w-4" /> Novo pedido
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p>
      ) : null}

      {draft ? (
        <form
          className="space-y-4 rounded-2xl border border-primary/40 bg-card/80 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(draft);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              className="field-shell text-sm lg:col-span-2"
              value={draft.supplierId}
              onChange={(e) => {
                const found = supplierRows.find((s) => s.id === e.target.value);
                setDraft({
                  ...draft,
                  supplierId: e.target.value,
                  supplier: found ? found.name : draft.supplier,
                });
              }}
            >
              <option value="">Fornecedor avulso (digitar abaixo)</option>
              {supplierRows.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              className="field-shell text-sm lg:col-span-2"
              placeholder="Fornecedor"
              value={draft.supplier}
              onChange={(e) => setDraft({ ...draft, supplier: e.target.value })}
              required
              minLength={2}
            />
            <label className="text-xs text-muted-foreground">
              Data do pedido
              <input
                className="field-shell mt-1 w-full text-sm"
                type="date"
                value={draft.purchasedAt}
                onChange={(e) => setDraft({ ...draft, purchasedAt: e.target.value })}
                required
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Previsão de entrega
              <input
                className="field-shell mt-1 w-full text-sm"
                type="date"
                value={draft.expectedDate}
                onChange={(e) => setDraft({ ...draft, expectedDate: e.target.value })}
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Status
              <select
                className="field-shell mt-1 w-full text-sm"
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft["status"] })}
              >
                <option value="draft">Rascunho</option>
                <option value="confirmed">Confirmado</option>
                <option value="canceled">Cancelado</option>
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Itens do pedido</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDraft({ ...draft, items: [...draft.items, emptyItem()] })}
              >
                <Plus className="h-4 w-4" /> Adicionar item
              </Button>
            </div>
            {draft.items.map((item, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-border/60 p-3 sm:grid-cols-12">
                <input
                  className="field-shell text-sm sm:col-span-5"
                  placeholder="Descrição do item"
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  required
                />
                <input
                  className="field-shell text-sm sm:col-span-2"
                  placeholder="Unidade"
                  value={item.unit}
                  onChange={(e) => updateItem(index, { unit: e.target.value })}
                />
                <input
                  className="field-shell text-sm sm:col-span-2"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Qtd."
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                  required
                />
                <input
                  className="field-shell text-sm sm:col-span-2"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Preço unit."
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                  required
                />
                <div className="flex items-center justify-between gap-2 sm:col-span-1">
                  <span className="text-xs text-muted-foreground">
                    {brl(Number(item.quantity || 0) * Number(item.unitPrice || 0))}
                  </span>
                  {draft.items.length > 1 ? (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDraft({ ...draft, items: draft.items.filter((_, i) => i !== index) })}
                      aria-label="Remover item"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <textarea
            className="field-shell min-h-20 w-full text-sm"
            placeholder="Observações"
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-primary/15 px-4 py-1 text-sm font-semibold text-primary">
              Total: {brl(draftTotal)}
            </span>
            <Button type="submit" variant="glow" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar pedido"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="field-shell w-full pl-9 text-sm"
            placeholder="Buscar por fornecedor, item ou observação"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="field-shell text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">Todos</option>
          <option value="draft">Rascunhos</option>
          <option value="confirmed">Confirmados</option>
          <option value="canceled">Cancelados</option>
        </select>
        <span className="rounded-full border border-border/60 px-4 py-2 text-xs text-muted-foreground">
          Total listado: <strong className="text-foreground">{brl(openTotal)}</strong>
        </span>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
          Nenhum pedido de compra encontrado.
        </p>
      ) : (
        <div className="grid gap-3">
          {visible.map((o) => (
            <article key={o.id} className="rounded-2xl border border-border/60 bg-card/80 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{o.supplier}</h3>
                  <p className="truncate text-xs text-muted-foreground">
                    Pedido em {new Date(`${o.purchased_at}T12:00:00`).toLocaleDateString("pt-BR")}
                    {o.expected_date
                      ? ` • Entrega ${new Date(`${o.expected_date}T12:00:00`).toLocaleDateString("pt-BR")}`
                      : ""}
                    {` • ${(o.items ?? []).length} item(ns)`}
                  </p>
                </div>
                <span className="text-sm font-semibold">{brl(Number(o.total ?? 0))}</span>
                <span
                  className={
                    o.status === "confirmed"
                      ? "rounded-full bg-primary/15 px-3 py-1 text-xs text-primary"
                      : o.status === "canceled"
                        ? "rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive"
                        : "rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  }
                >
                  {STATUS_LABEL[o.status]}
                </span>
                {editable ? (
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="field-shell text-xs"
                      value={o.status}
                      onChange={(e) =>
                        statusMutation.mutate({ id: o.id, status: e.target.value as Draft["status"] })
                      }
                    >
                      <option value="draft">Rascunho</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="canceled">Cancelado</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={() => setDraft(toDraft(o))}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Excluir o pedido de ${o.supplier}?`)) removeMutation.mutate(o.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </div>

              {(o.items ?? []).length > 0 ? (
                <ul className="mt-3 grid gap-1 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  {o.items.map((i) => (
                    <li key={i.id} className="flex flex-wrap justify-between gap-2">
                      <span className="truncate">
                        {i.description} — {Number(i.quantity)} {i.unit} × {brl(Number(i.unit_price))}
                      </span>
                      <strong className="text-foreground">{brl(Number(i.total))}</strong>
                    </li>
                  ))}
                </ul>
              ) : null}

              {o.notes ? <p className="mt-2 text-xs text-muted-foreground/80">{o.notes}</p> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
