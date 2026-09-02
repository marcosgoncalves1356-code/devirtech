import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, PackageCheck, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { listPurchaseOrders, type PurchaseOrder } from "@/lib/purchase-orders.functions";
import {
  deletePurchaseReceipt,
  listPurchaseReceipts,
  savePurchaseReceipt,
  type PurchaseReceipt,
} from "@/lib/purchase-receipts.functions";

type Draft = {
  id?: string;
  purchaseId: string;
  receivedAt: string;
  document: string;
  notes: string;
  quantities: Record<string, string>;
};

const fmtDate = (v: string) => new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR");

function emptyDraft(purchaseId = ""): Draft {
  return {
    purchaseId,
    receivedAt: new Date().toISOString().slice(0, 10),
    document: "",
    notes: "",
    quantities: {},
  };
}

export function PurchaseReceiptsPanel() {
  const { company, canEdit } = useCompany();
  const qc = useQueryClient();
  const fetchOrders = useServerFn(listPurchaseOrders);
  const fetchReceipts = useServerFn(listPurchaseReceipts);
  const save = useServerFn(savePurchaseReceipt);
  const remove = useServerFn(deletePurchaseReceipt);
  const editable = canEdit("compras");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterOrder, setFilterOrder] = useState("all");

  const { data: orders = [] } = useQuery({
    queryKey: ["purchase-orders", company.id],
    queryFn: () => fetchOrders({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ["purchase-receipts", company.id],
    queryFn: () => fetchReceipts({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["purchase-receipts", company.id] });

  const saveMutation = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          id: d.id,
          companyId: company.id,
          purchaseId: d.purchaseId,
          receivedAt: d.receivedAt,
          document: d.document,
          notes: d.notes,
          items: Object.entries(d.quantities)
            .map(([purchaseItemId, quantity]) => ({ purchaseItemId, quantity: Number(quantity || 0) }))
            .filter((i) => i.quantity > 0),
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

  const orderRows = orders as PurchaseOrder[];
  const receiptRows = receipts as PurchaseReceipt[];
  const orderById = useMemo(() => new Map(orderRows.map((o) => [o.id, o])), [orderRows]);
  const selectedOrder = draft ? orderById.get(draft.purchaseId) : undefined;

  const visible = receiptRows.filter((r) => filterOrder === "all" || r.purchase_id === filterOrder);

  const startEdit = (r: PurchaseReceipt) => {
    const quantities: Record<string, string> = {};
    for (const i of r.items ?? []) quantities[i.purchase_item_id] = String(i.quantity);
    setDraft({
      id: r.id,
      purchaseId: r.purchase_id,
      receivedAt: r.received_at.slice(0, 10),
      document: r.document ?? "",
      notes: r.notes ?? "",
      quantities,
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Recebimentos</h2>
          <p className="text-sm text-muted-foreground">
            Registre as entregas dos pedidos de compra de {company.name}, informando itens e quantidades recebidas.
          </p>
        </div>
        {editable ? (
          <Button variant="glow" onClick={() => setDraft(emptyDraft(orderRows[0]?.id ?? ""))}>
            <Plus className="h-4 w-4" /> Novo recebimento
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
            <label className="text-xs text-muted-foreground lg:col-span-2">
              Pedido de compra
              <select
                className="field-shell mt-1 w-full text-sm"
                value={draft.purchaseId}
                onChange={(e) => setDraft({ ...draft, purchaseId: e.target.value, quantities: {} })}
                required
              >
                <option value="">Selecione um pedido</option>
                {orderRows.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.supplier} — {fmtDate(o.purchased_at)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Data do recebimento
              <input
                className="field-shell mt-1 w-full text-sm"
                type="date"
                value={draft.receivedAt}
                onChange={(e) => setDraft({ ...draft, receivedAt: e.target.value })}
                required
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Nota / documento
              <input
                className="field-shell mt-1 w-full text-sm"
                placeholder="NF-e, romaneio…"
                value={draft.document}
                onChange={(e) => setDraft({ ...draft, document: e.target.value })}
              />
            </label>
          </div>

          {selectedOrder ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Itens recebidos</h3>
              {(selectedOrder.items ?? []).map((item) => (
                <div key={item.id} className="grid gap-2 rounded-xl border border-border/60 p-3 sm:grid-cols-12">
                  <span className="text-sm sm:col-span-7">{item.description}</span>
                  <span className="text-xs text-muted-foreground sm:col-span-3">
                    Pedido: {Number(item.quantity)} {item.unit}
                  </span>
                  <input
                    className="field-shell text-sm sm:col-span-2"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Recebido"
                    value={draft.quantities[item.id] ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, quantities: { ...draft.quantities, [item.id]: e.target.value } })
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Selecione um pedido para listar os itens.</p>
          )}

          <textarea
            className="field-shell min-h-20 w-full text-sm"
            placeholder="Observações do recebimento"
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />

          <div className="flex gap-2">
            <Button type="submit" variant="glow" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar recebimento"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      <select
        className="field-shell text-sm"
        value={filterOrder}
        onChange={(e) => setFilterOrder(e.target.value)}
      >
        <option value="all">Todos os pedidos</option>
        {orderRows.map((o) => (
          <option key={o.id} value={o.id}>
            {o.supplier} — {fmtDate(o.purchased_at)}
          </option>
        ))}
      </select>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
          Nenhum recebimento registrado.
        </p>
      ) : (
        <div className="grid gap-3">
          {visible.map((r) => {
            const order = orderById.get(r.purchase_id);
            const itemById = new Map((order?.items ?? []).map((i) => [i.id, i]));
            return (
              <article key={r.id} className="rounded-2xl border border-border/60 bg-card/80 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <PackageCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">
                      {order?.supplier ?? "Pedido removido"}
                      {r.document ? ` — ${r.document}` : ""}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      Recebido em {fmtDate(r.received_at)} • {(r.items ?? []).length} item(ns)
                    </p>
                  </div>
                  {editable ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Excluir este recebimento?")) removeMutation.mutate(r.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>

                <ul className="mt-3 grid gap-1 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  {(r.items ?? []).map((i) => {
                    const item = itemById.get(i.purchase_item_id);
                    return (
                      <li key={i.id} className="flex flex-wrap justify-between gap-2">
                        <span className="truncate">{item?.description ?? "Item do pedido"}</span>
                        <strong className="text-foreground">
                          {Number(i.quantity)} {item?.unit ?? ""}
                          {item ? ` de ${Number(item.quantity)}` : ""}
                        </strong>
                      </li>
                    );
                  })}
                </ul>

                {r.notes ? <p className="mt-2 text-xs text-muted-foreground/80">{r.notes}</p> : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
