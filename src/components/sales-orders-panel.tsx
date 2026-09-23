import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardList, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { listCustomers, type Customer } from "@/lib/sales.functions";
import {
  deleteSalesOrder,
  listSalesOrders,
  saveSalesOrder,
  setSalesOrderStatus,
  type SalesOrder,
} from "@/lib/sales-orders.functions";

type ItemDraft = { description: string; unit: string; quantity: string; unitPrice: string };
type Draft = {
  id?: string;
  customerId: string;
  orderNumber: string;
  orderedAt: string;
  expectedDate: string;
  status: SalesOrder["status"];
  notes: string;
  items: ItemDraft[];
};

const STATUS_LABEL: Record<SalesOrder["status"], string> = {
  draft: "Rascunho",
  confirmed: "Confirmado",
  canceled: "Cancelado",
};
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const emptyItem = (): ItemDraft => ({ description: "", unit: "un", quantity: "1", unitPrice: "0" });
const emptyDraft = (): Draft => ({
  customerId: "",
  orderNumber: "",
  orderedAt: new Date().toISOString().slice(0, 10),
  expectedDate: "",
  status: "draft",
  notes: "",
  items: [emptyItem()],
});
const toDraft = (order: SalesOrder): Draft => ({
  id: order.id,
  customerId: order.customer_id,
  orderNumber: order.order_number,
  orderedAt: order.ordered_at.slice(0, 10),
  expectedDate: order.expected_date?.slice(0, 10) ?? "",
  status: order.status,
  notes: order.notes,
  items: order.items.map((item) => ({
    description: item.description,
    unit: item.unit,
    quantity: String(item.quantity),
    unitPrice: String(item.unit_price),
  })),
});

export function SalesOrdersPanel() {
  const { company, canEdit } = useCompany();
  const queryClient = useQueryClient();
  const fetchOrders = useServerFn(listSalesOrders);
  const fetchCustomers = useServerFn(listCustomers);
  const saveOrder = useServerFn(saveSalesOrder);
  const changeStatus = useServerFn(setSalesOrderStatus);
  const removeOrder = useServerFn(deleteSalesOrder);
  const editable = canEdit("vendas");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | SalesOrder["status"]>("all");
  const [error, setError] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["sales-orders", company.id],
    queryFn: () => fetchOrders({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });
  const customersQuery = useQuery({
    queryKey: ["sales-customers", company.id],
    queryFn: () => fetchCustomers({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });
  const orders = ordersQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const customerNames = useMemo(() => new Map(customers.map((customer) => [customer.id, customer.name])), [customers]);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["sales-orders", company.id] });

  const saveMutation = useMutation({
    mutationFn: (value: Draft) => saveOrder({
      data: {
        ...value,
        companyId: company.id,
        expectedDate: value.expectedDate || null,
        items: value.items.map((item) => ({
          description: item.description,
          unit: item.unit,
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
        })),
      },
    }),
    onSuccess: () => { setDraft(null); setError(null); refresh(); },
    onError: (caught: Error) => setError(caught.message),
  });
  const statusMutation = useMutation({
    mutationFn: (value: { id: string; status: SalesOrder["status"] }) =>
      changeStatus({ data: { ...value, companyId: company.id } }),
    onSuccess: () => { setError(null); refresh(); },
    onError: (caught: Error) => setError(caught.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeOrder({ data: { id, companyId: company.id } }),
    onSuccess: () => { setError(null); refresh(); },
    onError: (caught: Error) => setError(caught.message),
  });

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== "all" && order.status !== filter) return false;
      if (!term) return true;
      return [order.order_number, customerNames.get(order.customer_id) ?? "", order.notes]
        .some((value) => value.toLowerCase().includes(term)) ||
        order.items.some((item) => item.description.toLowerCase().includes(term));
    });
  }, [customerNames, filter, orders, search]);
  const draftTotal = draft?.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0,
  ) ?? 0;
  const listedTotal = visible.filter((order) => order.status !== "canceled")
    .reduce((sum, order) => sum + Number(order.total), 0);

  const updateItem = (index: number, patch: Partial<ItemDraft>) => {
    if (!draft) return;
    setDraft({ ...draft, items: draft.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  };

  return (
    <section className="min-w-0 max-w-full space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Pedidos de venda</h2>
          <p className="text-sm text-muted-foreground">Pedidos vinculados aos clientes, com itens, quantidades, preços e situação.</p>
        </div>
        {editable ? <Button className="w-full sm:w-auto" variant="glow" onClick={() => { setError(null); setDraft(emptyDraft()); }}><Plus /> Novo pedido</Button> : null}
      </div>

      {error ? <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p> : null}
      {draft ? (
        <form className="min-w-0 space-y-4 rounded-2xl border border-primary/40 bg-card/80 p-4 sm:p-5" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(draft); }}>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select className="field-shell text-sm sm:col-span-2" required value={draft.customerId} onChange={(event) => setDraft({ ...draft, customerId: event.target.value })}>
              <option value="">Selecione o cliente</option>
              {customers.filter((customer) => customer.status === "active" || customer.id === draft.customerId).map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <input className="field-shell text-sm sm:col-span-2" required placeholder="Número do pedido" value={draft.orderNumber} onChange={(event) => setDraft({ ...draft, orderNumber: event.target.value })} />
            <label className="text-xs text-muted-foreground">Data do pedido<input className="field-shell mt-1 text-sm" type="date" required value={draft.orderedAt} onChange={(event) => setDraft({ ...draft, orderedAt: event.target.value })} /></label>
            <label className="text-xs text-muted-foreground">Previsão de entrega<input className="field-shell mt-1 text-sm" type="date" value={draft.expectedDate} onChange={(event) => setDraft({ ...draft, expectedDate: event.target.value })} /></label>
            <label className="text-xs text-muted-foreground">Situação<select className="field-shell mt-1 text-sm" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as SalesOrder["status"] })}>{Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Itens do pedido</h3><Button type="button" variant="outline" size="sm" onClick={() => setDraft({ ...draft, items: [...draft.items, emptyItem()] })}><Plus /> Adicionar item</Button></div>
            {draft.items.map((item, index) => (
              <div key={index} className="grid min-w-0 gap-2 rounded-xl border border-border/60 p-3 sm:grid-cols-12">
                <input className="field-shell text-sm sm:col-span-5" required placeholder="Descrição do item" value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} />
                <input className="field-shell text-sm sm:col-span-2" required placeholder="Unidade" value={item.unit} onChange={(event) => updateItem(index, { unit: event.target.value })} />
                <input className="field-shell text-sm sm:col-span-2" type="number" min="0.001" step="0.001" required placeholder="Quantidade" value={item.quantity} onChange={(event) => updateItem(index, { quantity: event.target.value })} />
                <input className="field-shell text-sm sm:col-span-2" type="number" min="0" step="0.01" required placeholder="Valor unitário" value={item.unitPrice} onChange={(event) => updateItem(index, { unitPrice: event.target.value })} />
                <div className="flex min-w-0 items-center justify-between gap-2 sm:col-span-1"><span className="mobile-value text-xs text-muted-foreground">{money.format(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</span>{draft.items.length > 1 ? <Button type="button" variant="ghost" size="icon" aria-label="Remover item" onClick={() => setDraft({ ...draft, items: draft.items.filter((_, itemIndex) => itemIndex !== index) })}><X /></Button> : null}</div>
              </div>
            ))}
          </div>
          <textarea className="field-shell min-h-20 text-sm" placeholder="Observações" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
          <div className="flex min-w-0 flex-wrap items-center gap-3"><span className="mobile-value max-w-full rounded-full bg-primary/15 px-4 py-2 text-sm font-semibold text-primary">Total: {money.format(draftTotal)}</span><Button className="w-full sm:w-auto" type="submit" variant="glow" disabled={saveMutation.isPending || customers.length === 0}>{saveMutation.isPending ? <Loader2 className="animate-spin" /> : "Salvar pedido"}</Button><Button className="w-full sm:w-auto" type="button" variant="outline" onClick={() => setDraft(null)}>Cancelar</Button></div>
        </form>
      ) : null}

      {customers.length === 0 && !customersQuery.isLoading ? <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">Cadastre um cliente antes de criar o primeiro pedido.</p> : null}
      <div className="flex min-w-0 flex-wrap gap-3">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className="field-shell pl-9 text-sm" placeholder="Buscar por pedido, cliente, item ou observação" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <select className="field-shell text-sm sm:w-auto" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">Todos</option><option value="draft">Rascunhos</option><option value="confirmed">Confirmados</option><option value="canceled">Cancelados</option></select>
        <span className="mobile-value max-w-full rounded-full border border-border/60 px-4 py-2 text-xs text-muted-foreground">Total listado: <strong className="text-foreground">{money.format(listedTotal)}</strong></span>
      </div>

      {ordersQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : visible.length === 0 ? <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">Nenhum pedido de venda encontrado.</p> : (
        <div className="grid min-w-0 gap-3">{visible.map((order) => (
          <article key={order.id} className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:flex sm:flex-wrap">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><ClipboardList /></span>
              <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">Pedido {order.order_number} — {customerNames.get(order.customer_id) ?? "Cliente"}</h3><p className="truncate text-xs text-muted-foreground">{new Date(`${order.ordered_at}T12:00:00`).toLocaleDateString("pt-BR")}{order.expected_date ? ` • Entrega ${new Date(`${order.expected_date}T12:00:00`).toLocaleDateString("pt-BR")}` : ""} • {order.items.length} item(ns)</p></div>
              <strong className="mobile-value col-span-2 max-w-full text-sm sm:col-span-1 sm:max-w-48">{money.format(Number(order.total))}</strong>
              <span className={order.status === "confirmed" ? "col-span-2 justify-self-start rounded-full bg-primary/15 px-3 py-1 text-xs text-primary sm:col-span-1" : order.status === "canceled" ? "col-span-2 justify-self-start rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive sm:col-span-1" : "col-span-2 justify-self-start rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground sm:col-span-1"}>{STATUS_LABEL[order.status]}</span>
              {editable ? <div className="col-span-2 flex min-w-0 flex-wrap gap-2 sm:col-span-1"><select className="field-shell text-xs sm:w-auto" value={order.status} onChange={(event) => statusMutation.mutate({ id: order.id, status: event.target.value as SalesOrder["status"] })}>{Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{order.status === "draft" ? <><Button variant="outline" size="icon" aria-label={`Editar pedido ${order.order_number}`} onClick={() => setDraft(toDraft(order))}><Pencil /></Button><Button variant="outline" size="icon" aria-label={`Excluir pedido ${order.order_number}`} onClick={() => confirm(`Excluir o pedido ${order.order_number}?`) && deleteMutation.mutate(order.id)}><Trash2 /></Button></> : null}</div> : null}
            </div>
            <ul className="mt-3 grid min-w-0 gap-1 border-t border-border/50 pt-3 text-xs text-muted-foreground">{order.items.map((item) => <li key={item.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2"><span className="truncate">{item.description} — {Number(item.quantity).toLocaleString("pt-BR")} {item.unit} × {money.format(Number(item.unit_price))}</span><strong className="mobile-value text-foreground">{money.format(Number(item.total))}</strong></li>)}</ul>
            {order.notes ? <p className="mt-2 break-words text-xs text-muted-foreground/80">{order.notes}</p> : null}
          </article>
        ))}</div>
      )}
    </section>
  );
}