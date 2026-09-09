import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  Warehouse as WarehouseIcon,
} from "lucide-react";

import { ModuleTabs } from "@/components/module-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import {
  applyInventoryCount,
  cancelInventoryCount,
  createInventoryCount,
  createStockTransfer,
  deleteInventoryItem,
  deleteStockMovement,
  deleteWarehouse,
  listInventoryCounts,
  listInventoryItems,
  listReceiptAllocations,
  listStockBalances,
  listStockMovements,
  listStockTransfers,
  listWarehouses,
  saveInventoryItem,
  saveStockMovement,
  saveWarehouse,
  setPurchaseItemStockLink,
  setReceiptWarehouse,
  type InventoryCount,
  type InventoryItem,
  type ReceiptAllocation,
  type StockBalance,
  type StockMovement,
  type StockTransfer,
  type Warehouse,
} from "@/lib/stock.functions";

type ItemDraft = { id?: string; name: string; unit: string; category: string; minQuantity: string; unitCost: string; status: "active" | "inactive" };
type WarehouseDraft = { id?: string; name: string; description: string; status: "active" | "inactive" };
type MovementDraft = { id?: string; kind: "in" | "out"; warehouseId: string; itemId: string; quantity: string; unitCost: string; movedAt: string; document: string; notes: string };
type TransferDraft = { itemId: string; sourceWarehouseId: string; destinationWarehouseId: string; quantity: string; unitCost: string; transferredAt: string; document: string; notes: string };
type CountDraft = { itemId: string; warehouseId: string; countedQuantity: string; countedAt: string; notes: string };

const today = () => new Date().toISOString().slice(0, 10);
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const qty = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
const date = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
const emptyMessage = (text: string) => <p className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">{text}</p>;

export function StockWorkspace() {
  const { company, canEdit } = useCompany();
  const editable = canEdit("estoque");
  const qc = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [error, setError] = useState<string | null>(null);

  const server = {
    warehouses: useServerFn(listWarehouses), items: useServerFn(listInventoryItems), balances: useServerFn(listStockBalances),
    receipts: useServerFn(listReceiptAllocations), movements: useServerFn(listStockMovements), transfers: useServerFn(listStockTransfers), counts: useServerFn(listInventoryCounts),
    saveWarehouse: useServerFn(saveWarehouse), deleteWarehouse: useServerFn(deleteWarehouse), saveItem: useServerFn(saveInventoryItem), deleteItem: useServerFn(deleteInventoryItem),
    saveMovement: useServerFn(saveStockMovement), deleteMovement: useServerFn(deleteStockMovement), createTransfer: useServerFn(createStockTransfer),
    createCount: useServerFn(createInventoryCount), applyCount: useServerFn(applyInventoryCount), cancelCount: useServerFn(cancelInventoryCount),
    setReceiptWarehouse: useServerFn(setReceiptWarehouse), setItemLink: useServerFn(setPurchaseItemStockLink),
  };
  const args = { data: { companyId: company.id } };
  const enabled = Boolean(company.id);
  const queries = {
    warehouses: useQuery({ queryKey: ["warehouses", company.id], queryFn: () => server.warehouses(args), enabled }),
    items: useQuery({ queryKey: ["inventory-items", company.id], queryFn: () => server.items(args), enabled }),
    balances: useQuery({ queryKey: ["stock-balances", company.id], queryFn: () => server.balances(args), enabled }),
    receipts: useQuery({ queryKey: ["stock-receipts", company.id], queryFn: () => server.receipts(args), enabled }),
    movements: useQuery({ queryKey: ["stock-movements", company.id], queryFn: () => server.movements(args), enabled }),
    transfers: useQuery({ queryKey: ["stock-transfers", company.id], queryFn: () => server.transfers(args), enabled }),
    counts: useQuery({ queryKey: ["inventory-counts", company.id], queryFn: () => server.counts(args), enabled }),
  };
  const warehouses = (queries.warehouses.data ?? []) as Warehouse[];
  const items = (queries.items.data ?? []) as InventoryItem[];
  const balances = (queries.balances.data ?? []) as StockBalance[];
  const receipts = (queries.receipts.data ?? []) as ReceiptAllocation[];
  const movements = (queries.movements.data ?? []) as StockMovement[];
  const transfers = (queries.transfers.data ?? []) as StockTransfer[];
  const counts = (queries.counts.data ?? []) as InventoryCount[];
  const loading = Object.values(queries).some((query) => query.isLoading);
  const invalidate = () => {
    for (const key of ["warehouses", "inventory-items", "stock-balances", "stock-receipts", "stock-movements", "stock-transfers", "inventory-counts"]) void qc.invalidateQueries({ queryKey: [key, company.id] });
  };
  const mutation = <T,>(fn: (value: T) => Promise<unknown>, done?: () => void) => useMutation({ mutationFn: fn, onSuccess: () => { setError(null); done?.(); invalidate(); }, onError: (cause: Error) => setError(cause.message) });

  const [itemDraft, setItemDraft] = useState<ItemDraft | null>(null);
  const [warehouseDraft, setWarehouseDraft] = useState<WarehouseDraft | null>(null);
  const [movementDraft, setMovementDraft] = useState<MovementDraft | null>(null);
  const [transferDraft, setTransferDraft] = useState<TransferDraft | null>(null);
  const [countDraft, setCountDraft] = useState<CountDraft | null>(null);

  const itemMutation = mutation<ItemDraft>((d) => server.saveItem({ data: { ...d, companyId: company.id, minQuantity: Number(d.minQuantity), unitCost: Number(d.unitCost) } }), () => setItemDraft(null));
  const warehouseMutation = mutation<WarehouseDraft>((d) => server.saveWarehouse({ data: { ...d, companyId: company.id } }), () => setWarehouseDraft(null));
  const removeItem = mutation<string>((id) => server.deleteItem({ data: { id } }));
  const removeWarehouse = mutation<string>((id) => server.deleteWarehouse({ data: { id } }));
  const movementMutation = mutation<MovementDraft>((d) => server.saveMovement({ data: { ...d, companyId: company.id, quantity: Number(d.quantity), unitCost: Number(d.unitCost) } }), () => setMovementDraft(null));
  const removeMovement = mutation<string>((id) => server.deleteMovement({ data: { id } }));
  const transferMutation = mutation<TransferDraft>((d) => server.createTransfer({ data: { ...d, companyId: company.id, quantity: Number(d.quantity), unitCost: Number(d.unitCost) } }), () => setTransferDraft(null));
  const countMutation = mutation<CountDraft>((d) => server.createCount({ data: { ...d, companyId: company.id, countedQuantity: Number(d.countedQuantity) } }), () => setCountDraft(null));
  const applyCountMutation = mutation<string>((id) => server.applyCount({ data: { id } }));
  const cancelCountMutation = mutation<string>((id) => server.cancelCount({ data: { id } }));
  const receiptWarehouseMutation = mutation<{ receiptId: string; warehouseId: string | null }>((data) => server.setReceiptWarehouse({ data }));
  const itemLinkMutation = mutation<{ purchaseItemId: string; inventoryItemId: string | null }>((data) => server.setItemLink({ data }));

  const availableBalances = balances.filter((row) => row.warehouse_id && row.item_id);
  const pendingReceipts = receipts.filter((receipt) => !receipt.warehouse_id || receipt.lines.some((line) => !line.inventory_item_id));
  const summary = useMemo(() => {
    const positiveItemIds = new Set(availableBalances.filter((row) => row.quantity > 0).map((row) => row.item_id));
    const totals = new Map<string, number>();
    for (const row of availableBalances) if (row.item_id) totals.set(row.item_id, (totals.get(row.item_id) ?? 0) + row.quantity);
    return {
      inStock: positiveItemIds.size,
      totalValue: availableBalances.reduce((sum, row) => sum + row.value, 0),
      low: items.filter((item) => (totals.get(item.id) ?? 0) > 0 && item.min_quantity > 0 && (totals.get(item.id) ?? 0) < item.min_quantity).length,
      empty: items.filter((item) => item.status === "active" && (totals.get(item.id) ?? 0) <= 0).length,
    };
  }, [availableBalances, items]);

  const openMovement = (kind: "in" | "out") => { setTab("movements"); setMovementDraft({ kind, warehouseId: warehouses[0]?.id ?? "", itemId: items[0]?.id ?? "", quantity: "", unitCost: "0", movedAt: today(), document: "", notes: "" }); setTransferDraft(null); };
  const openTransfer = () => { setTab("movements"); setTransferDraft({ itemId: items[0]?.id ?? "", sourceWarehouseId: warehouses[0]?.id ?? "", destinationWarehouseId: warehouses[1]?.id ?? "", quantity: "", unitCost: "0", transferredAt: today(), document: "", notes: "" }); setMovementDraft(null); };
  const openInventory = () => { setTab("inventory"); setCountDraft({ itemId: items[0]?.id ?? "", warehouseId: warehouses[0]?.id ?? "", countedQuantity: "", countedAt: today(), notes: "" }); };

  return <div className="space-y-4">
    {error ? <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p> : null}
    <ModuleTabs value={tab} onValueChange={setTab} tabs={[
      { value: "overview", label: "Visão geral", content: <Overview summary={summary} balances={availableBalances} pending={pendingReceipts.length} loading={loading} onEntry={() => openMovement("in")} onExit={() => openMovement("out")} onTransfer={openTransfer} onInventory={openInventory} /> },
      { value: "items", label: "Itens", content: <ItemsPanel items={items} draft={itemDraft} setDraft={setItemDraft} editable={editable} loading={loading} save={(d: ItemDraft) => itemMutation.mutate(d)} saving={itemMutation.isPending} remove={(id: string) => { if (confirm("Excluir este item? Os vínculos existentes podem ser afetados.")) removeItem.mutate(id); }} /> },
      { value: "warehouses", label: "Depósitos", content: <WarehousesPanel warehouses={warehouses} balances={availableBalances} draft={warehouseDraft} setDraft={setWarehouseDraft} editable={editable} loading={loading} save={(d: WarehouseDraft) => warehouseMutation.mutate(d)} saving={warehouseMutation.isPending} remove={(id: string) => { if (confirm("Excluir este depósito?")) removeWarehouse.mutate(id); }} /> },
      { value: "movements", label: "Movimentações", content: <MovementsPanel items={items} warehouses={warehouses} movements={movements} receipts={receipts} transfers={transfers} pendingReceipts={pendingReceipts} movementDraft={movementDraft} setMovementDraft={setMovementDraft} transferDraft={transferDraft} setTransferDraft={setTransferDraft} editable={editable} loading={loading} openMovement={openMovement} openTransfer={openTransfer} saveMovement={(d: MovementDraft) => movementMutation.mutate(d)} saveTransfer={(d: TransferDraft) => transferMutation.mutate(d)} saving={movementMutation.isPending || transferMutation.isPending} remove={(id: string) => { if (confirm("Excluir esta movimentação manual?")) removeMovement.mutate(id); }} assignWarehouse={(data: { receiptId: string; warehouseId: string | null }) => receiptWarehouseMutation.mutate(data)} assignItem={(data: { purchaseItemId: string; inventoryItemId: string | null }) => itemLinkMutation.mutate(data)} /> },
      { value: "inventory", label: "Inventário", content: <InventoryPanel items={items} warehouses={warehouses} counts={counts} draft={countDraft} setDraft={setCountDraft} editable={editable} loading={loading} save={(d: CountDraft) => countMutation.mutate(d)} saving={countMutation.isPending} apply={(id: string) => { if (confirm("Aplicar a diferença ao saldo do estoque?")) applyCountMutation.mutate(id); }} cancel={(id: string) => cancelCountMutation.mutate(id)} /> },
    ]} />
  </div>;
}

function Metric({ icon, label, value, detail, tone = "primary" }: { icon: React.ReactNode; label: string; value: string; detail: string; tone?: "primary" | "warning" | "danger" }) {
  const style = tone === "danger" ? "border-destructive/30 bg-destructive/5 text-destructive" : tone === "warning" ? "border-warning/30 bg-warning/5 text-warning" : "border-border/60 bg-card/70 text-primary";
  return <article className={`grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border p-4 ${style}`}><span className="mt-0.5">{icon}</span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><strong className="block text-xl text-foreground">{value}</strong><p className="text-xs text-muted-foreground">{detail}</p></div></article>;
}

function Overview({ summary, balances, pending, loading, onEntry, onExit, onTransfer, onInventory }: any) {
  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={<Package className="h-5 w-5" />} label="Itens em estoque" value={String(summary.inStock)} detail="com saldo disponível" />
      <Metric icon={<Boxes className="h-5 w-5" />} label="Valor total do estoque" value={money(summary.totalValue)} detail="posição atual" />
      <Metric icon={<TriangleAlert className="h-5 w-5" />} label="Estoque baixo" value={String(summary.low)} detail="abaixo do mínimo" tone="warning" />
      <Metric icon={<TriangleAlert className="h-5 w-5" />} label="Sem estoque" value={String(summary.empty)} detail="itens ativos" tone="danger" />
    </div>
    {pending > 0 ? <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm"><TriangleAlert className="h-4 w-4 text-warning" /><span><strong>{pending}</strong> recebimento(s) aguardando armazenamento ou vínculo de item.</span></div> : null}
    <section className="overflow-hidden rounded-lg border border-border/60 bg-card/60"><div className="border-b border-border/60 p-4"><h2 className="font-semibold">Estoque atual</h2><p className="text-xs text-muted-foreground">Saldos disponíveis por item e depósito.</p></div><StockTable balances={balances} loading={loading} /></section>
    <section className="rounded-lg border border-border/60 bg-card/60 p-4"><div className="mb-4"><h2 className="font-semibold">Ações rápidas</h2><p className="text-xs text-muted-foreground">Registre uma operação sem perder o contexto do estoque.</p></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Quick icon={<ArrowDownLeft />} title="Entrada" subtitle="Registrar entrada" onClick={onEntry} /><Quick icon={<ArrowUpRight />} title="Saída" subtitle="Registrar saída" onClick={onExit} /><Quick icon={<ArrowRightLeft />} title="Transferência" subtitle="Entre depósitos" onClick={onTransfer} /><Quick icon={<ClipboardCheck />} title="Inventário" subtitle="Conferência física" onClick={onInventory} /></div></section>
  </div>;
}
function Quick({ icon, title, subtitle, onClick }: any) { return <Button variant="outline" className="h-auto justify-start gap-3 p-4 text-left" onClick={onClick}><span className="text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</span><span><strong className="block text-sm">{title}</strong><small className="font-normal text-muted-foreground">{subtitle}</small></span></Button>; }
function StockTable({ balances, loading }: { balances: StockBalance[]; loading: boolean }) { if (loading) return <Loader2 className="m-6 h-5 w-5 animate-spin text-primary" />; if (!balances.length) return emptyMessage("Nenhum saldo disponível. Recebimentos aguardando armazenamento são exibidos em Movimentações."); return <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead className="bg-muted/30 text-xs text-muted-foreground"><tr><th className="p-3 text-left">Item</th><th className="p-3 text-left">Depósito</th><th className="p-3 text-right">Quantidade</th><th className="p-3 text-left">Unidade</th><th className="p-3 text-right">Valor total</th><th className="p-3 text-left">Status</th></tr></thead><tbody>{balances.map((row) => { const low = row.quantity > 0 && row.min_quantity > 0 && row.quantity < row.min_quantity; return <tr key={`${row.warehouse_id}-${row.item_id}`} className="border-t border-border/50"><td className="p-3 font-medium">{row.item_name}</td><td className="p-3 text-muted-foreground">{row.warehouse_name}</td><td className="p-3 text-right font-semibold">{qty(row.quantity)}</td><td className="p-3">{row.unit}</td><td className="p-3 text-right">{money(row.value)}</td><td className="p-3"><Badge variant={row.quantity <= 0 ? "destructive" : "outline"} className={low ? "border-warning/40 text-warning" : ""}>{row.quantity <= 0 ? "Sem estoque" : low ? "Estoque baixo" : "Normal"}</Badge></td></tr>; })}</tbody></table></div>; }

function ItemsPanel({ items, draft, setDraft, editable, loading, save, saving, remove }: any) { return <section className="space-y-4"><PanelHeader title="Itens" description="Produtos, insumos e materiais utilizados no controle de estoque." action={editable ? <Button variant="glow" onClick={() => setDraft({ name: "", unit: "un", category: "", minQuantity: "0", unitCost: "0", status: "active" })}><Plus className="h-4 w-4" /> Novo item</Button> : null} />{draft ? <form className="grid gap-3 rounded-lg border border-primary/30 bg-card/70 p-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => { e.preventDefault(); save(draft); }}><Field value={draft.name} placeholder="Nome do item" required onChange={(v: string) => setDraft({ ...draft, name: v })} /><Field value={draft.unit} placeholder="Unidade (kg, L, un)" required onChange={(v: string) => setDraft({ ...draft, unit: v })} /><Field value={draft.category} placeholder="Categoria" onChange={(v: string) => setDraft({ ...draft, category: v })} /><Field type="number" value={draft.minQuantity} placeholder="Estoque mínimo" onChange={(v: string) => setDraft({ ...draft, minQuantity: v })} /><Field type="number" value={draft.unitCost} placeholder="Custo unitário" onChange={(v: string) => setDraft({ ...draft, unitCost: v })} /><Select value={draft.status} onChange={(v: string) => setDraft({ ...draft, status: v })} options={[["active","Ativo"],["inactive","Inativo"]]} /><FormActions saving={saving} cancel={() => setDraft(null)} /></form> : null}{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : items.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((item: InventoryItem) => <article key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border/60 bg-card/60 p-4"><Package className="h-5 w-5 shrink-0 text-primary" /><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{item.name}</h3><p className="truncate text-xs text-muted-foreground">{item.category || "Sem categoria"} • {item.unit} • mín. {qty(item.min_quantity)}</p><p className="text-xs text-muted-foreground">{money(item.unit_cost)} • {item.status === "active" ? "Ativo" : "Inativo"}</p></div>{editable ? <RowActions edit={() => setDraft({ id: item.id, name: item.name, unit: item.unit, category: item.category, minQuantity: String(item.min_quantity), unitCost: String(item.unit_cost), status: item.status })} remove={() => remove(item.id)} /> : null}</article>)}</div> : emptyMessage("Nenhum item cadastrado.")}</section>; }

function WarehousesPanel({ warehouses, balances, draft, setDraft, editable, loading, save, saving, remove }: any) { return <section className="space-y-4"><PanelHeader title="Depósitos" description="Locais físicos de armazenamento e seus saldos relacionados." action={editable ? <Button variant="glow" onClick={() => setDraft({ name: "", description: "", status: "active" })}><Plus className="h-4 w-4" /> Novo depósito</Button> : null} />{draft ? <form className="grid gap-3 rounded-lg border border-primary/30 bg-card/70 p-4 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); save(draft); }}><Field value={draft.name} placeholder="Nome do depósito" required onChange={(v: string) => setDraft({ ...draft, name: v })} /><Field value={draft.description} placeholder="Descrição / localização" onChange={(v: string) => setDraft({ ...draft, description: v })} /><Select value={draft.status} onChange={(v: string) => setDraft({ ...draft, status: v })} options={[["active","Ativo"],["inactive","Inativo"]]} /><FormActions saving={saving} cancel={() => setDraft(null)} /></form> : null}{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : warehouses.length ? <div className="space-y-3">{warehouses.map((warehouse: Warehouse) => { const related = balances.filter((row: StockBalance) => row.warehouse_id === warehouse.id); return <article key={warehouse.id} className="rounded-lg border border-border/60 bg-card/60"><div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4"><WarehouseIcon className="h-5 w-5 text-primary" /><div className="min-w-0"><h3 className="truncate font-semibold">{warehouse.name}</h3><p className="truncate text-xs text-muted-foreground">{warehouse.description || "Sem descrição"} • {warehouse.status === "active" ? "Ativo" : "Inativo"}</p></div>{editable ? <RowActions edit={() => setDraft({ id: warehouse.id, name: warehouse.name, description: warehouse.description, status: warehouse.status })} remove={() => remove(warehouse.id)} /> : null}</div><div className="border-t border-border/50 px-4 py-3 text-xs text-muted-foreground">{related.length ? `${related.length} item(ns) • ${money(related.reduce((sum: number, row: StockBalance) => sum + row.value, 0))}` : "Sem saldo neste depósito"}</div></article>; })}</div> : emptyMessage("Nenhum depósito cadastrado.")}</section>; }

function MovementsPanel(props: any) {
  const { items, warehouses, movements, receipts, transfers, pendingReceipts, movementDraft, setMovementDraft, transferDraft, setTransferDraft, editable, loading, openMovement, openTransfer, saveMovement, saveTransfer, saving, remove, assignWarehouse, assignItem } = props;
  const receiptRows = receipts.flatMap((r: ReceiptAllocation) => r.lines.map((line) => ({ ...line, receipt: r })));
  return <section className="space-y-6"><PanelHeader title="Movimentações" description="Histórico de entradas, saídas, transferências, ajustes e recebimentos de compras." action={editable ? <div className="flex flex-wrap gap-2"><Button variant="glow" onClick={() => openMovement("in")}><ArrowDownLeft className="h-4 w-4" /> Entrada</Button><Button variant="outline" onClick={() => openMovement("out")}><ArrowUpRight className="h-4 w-4" /> Saída</Button><Button variant="outline" onClick={openTransfer}><ArrowRightLeft className="h-4 w-4" /> Transferência</Button></div> : null} />
    {movementDraft ? <MovementForm draft={movementDraft} setDraft={setMovementDraft} items={items} warehouses={warehouses} save={saveMovement} saving={saving} /> : null}
    {transferDraft ? <TransferForm draft={transferDraft} setDraft={setTransferDraft} items={items} warehouses={warehouses} save={saveTransfer} saving={saving} /> : null}
    {pendingReceipts.length ? <section className="space-y-3 rounded-lg border border-warning/30 bg-warning/5 p-4"><div><h3 className="font-semibold">Recebidos — aguardando armazenamento</h3><p className="text-xs text-muted-foreground">Vincule o depósito e o item para disponibilizar o saldo. A origem permanece no módulo Compras.</p></div>{pendingReceipts.map((r: ReceiptAllocation) => <article key={r.receipt_id} className="space-y-3 rounded-lg border border-border/60 bg-background/50 p-3"><div className="text-sm font-medium">{date(r.received_at)} • {r.supplier || "Fornecedor não informado"} {r.document ? `• ${r.document}` : ""}</div><Select value={r.warehouse_id ?? ""} disabled={!editable} onChange={(value: string) => assignWarehouse({ receiptId: r.receipt_id, warehouseId: value || null })} options={[["","Selecione o depósito"], ...warehouses.map((w: Warehouse) => [w.id,w.name])]} />{r.lines.map((line) => <div key={line.purchase_item_id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_240px] sm:items-center"><span className="text-sm">{line.description}</span><span className="text-xs text-muted-foreground">{qty(line.quantity)} {line.unit}</span><Select value={line.inventory_item_id ?? ""} disabled={!editable} onChange={(value: string) => assignItem({ purchaseItemId: line.purchase_item_id, inventoryItemId: value || null })} options={[["","Recebido — aguardando vínculo"], ...items.map((i: InventoryItem) => [i.id,i.name])]} /></div>)}</article>)}</section> : null}
    <section className="overflow-hidden rounded-lg border border-border/60 bg-card/60"><div className="border-b border-border/60 p-4"><h3 className="font-semibold">Histórico de movimentações</h3></div>{loading ? <Loader2 className="m-5 h-5 w-5 animate-spin" /> : movements.length + receiptRows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead className="bg-muted/30 text-xs text-muted-foreground"><tr><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Data</th><th className="p-3 text-left">Item</th><th className="p-3 text-left">Origem</th><th className="p-3 text-left">Destino</th><th className="p-3 text-right">Quantidade</th><th className="p-3 text-left">Responsável</th><th className="p-3 text-left">Referência</th><th /></tr></thead><tbody>
      {receiptRows.map((row: any) => <tr key={`receipt-${row.receipt.receipt_id}-${row.purchase_item_id}`} className="border-t border-border/50"><td className="p-3"><Badge variant="outline">Recebimento</Badge></td><td className="p-3">{date(row.receipt.received_at)}</td><td className="p-3">{items.find((i: InventoryItem) => i.id === row.inventory_item_id)?.name ?? row.description}</td><td className="p-3">Compras</td><td className="p-3">{warehouses.find((w: Warehouse) => w.id === row.receipt.warehouse_id)?.name ?? "Aguardando armazenamento"}</td><td className="p-3 text-right">+{qty(row.quantity)} {row.unit}</td><td className="p-3 text-muted-foreground">Recebimento de compra</td><td className="p-3">{row.receipt.document || "—"}</td><td /></tr>)}
      {movements.map((m: StockMovement) => { const transfer = m.transfer_id ? transfers.find((t: StockTransfer) => t.id === m.transfer_id) : null; const isOut = m.kind === "out"; return <tr key={m.id} className="border-t border-border/50"><td className="p-3"><Badge variant={isOut ? "destructive" : "outline"}>{m.origin === "transfer" ? "Transferência" : m.origin === "inventory" ? "Ajuste" : isOut ? "Saída" : "Entrada"}</Badge></td><td className="p-3">{date(m.moved_at)}</td><td className="p-3">{items.find((i: InventoryItem) => i.id === m.item_id)?.name ?? "Item"}</td><td className="p-3">{m.origin === "transfer" ? warehouses.find((w: Warehouse) => w.id === transfer?.source_warehouse_id)?.name : isOut ? warehouses.find((w: Warehouse) => w.id === m.warehouse_id)?.name : "Externo"}</td><td className="p-3">{m.origin === "transfer" ? warehouses.find((w: Warehouse) => w.id === transfer?.destination_warehouse_id)?.name : !isOut ? warehouses.find((w: Warehouse) => w.id === m.warehouse_id)?.name : "Externo"}</td><td className={`p-3 text-right font-semibold ${isOut ? "text-destructive" : "text-primary"}`}>{isOut ? "−" : "+"}{qty(m.quantity)}</td><td className="p-3 text-muted-foreground">{m.responsible_name}</td><td className="p-3">{m.document || "—"}</td><td className="p-3">{editable && m.origin === "manual" ? <RowActions edit={() => setMovementDraft({ id: m.id, kind: m.kind, warehouseId: m.warehouse_id ?? "", itemId: m.item_id, quantity: String(m.quantity), unitCost: String(m.unit_cost), movedAt: m.moved_at, document: m.document, notes: m.notes })} remove={() => remove(m.id)} /> : null}</td></tr>; })}
    </tbody></table></div> : emptyMessage("Nenhuma movimentação registrada.")}</section>
  </section>;
}

function InventoryPanel({ items, warehouses, counts, draft, setDraft, editable, loading, save, saving, apply, cancel }: any) { return <section className="space-y-4"><PanelHeader title="Inventário" description="Conferência física e ajuste controlado dos saldos." action={editable ? <Button variant="glow" onClick={() => setDraft({ itemId: items[0]?.id ?? "", warehouseId: warehouses[0]?.id ?? "", countedQuantity: "", countedAt: today(), notes: "" })}><ClipboardCheck className="h-4 w-4" /> Nova conferência</Button> : null} />{draft ? <form className="grid gap-3 rounded-lg border border-primary/30 bg-card/70 p-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => { e.preventDefault(); save(draft); }}><Select value={draft.itemId} onChange={(v: string) => setDraft({ ...draft, itemId: v })} options={[["","Selecione o item"], ...items.map((i: InventoryItem) => [i.id,i.name])]} /><Select value={draft.warehouseId} onChange={(v: string) => setDraft({ ...draft, warehouseId: v })} options={[["","Selecione o depósito"], ...warehouses.map((w: Warehouse) => [w.id,w.name])]} /><Field type="number" value={draft.countedQuantity} placeholder="Quantidade contada" required onChange={(v: string) => setDraft({ ...draft, countedQuantity: v })} /><Field type="date" value={draft.countedAt} onChange={(v: string) => setDraft({ ...draft, countedAt: v })} /><Field value={draft.notes} placeholder="Observação" onChange={(v: string) => setDraft({ ...draft, notes: v })} /><FormActions saving={saving} cancel={() => setDraft(null)} /></form> : null}{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : counts.length ? <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/60"><table className="w-full min-w-[900px] text-sm"><thead className="bg-muted/30 text-xs text-muted-foreground"><tr><th className="p-3 text-left">Item</th><th className="p-3 text-left">Depósito</th><th className="p-3 text-right">No sistema</th><th className="p-3 text-right">Contado</th><th className="p-3 text-right">Diferença</th><th className="p-3 text-left">Responsável</th><th className="p-3 text-left">Data</th><th className="p-3 text-left">Status</th><th className="p-3 text-right">Ajuste</th></tr></thead><tbody>{counts.map((count: InventoryCount) => <tr key={count.id} className="border-t border-border/50"><td className="p-3 font-medium">{items.find((i: InventoryItem) => i.id === count.item_id)?.name ?? "Item"}</td><td className="p-3">{warehouses.find((w: Warehouse) => w.id === count.warehouse_id)?.name ?? "Depósito"}</td><td className="p-3 text-right">{qty(count.system_quantity)}</td><td className="p-3 text-right">{qty(count.counted_quantity)}</td><td className={`p-3 text-right font-semibold ${count.difference < 0 ? "text-destructive" : count.difference > 0 ? "text-primary" : ""}`}>{count.difference > 0 ? "+" : ""}{qty(count.difference)}</td><td className="p-3 text-muted-foreground">{count.responsible_name}</td><td className="p-3">{date(count.counted_at)}</td><td className="p-3"><Badge variant={count.status === "canceled" ? "destructive" : "outline"}>{count.status === "draft" ? "Em conferência" : count.status === "adjusted" ? "Ajustado" : "Cancelado"}</Badge></td><td className="p-3 text-right">{editable && count.status === "draft" ? <div className="flex justify-end gap-2"><Button size="sm" variant="glow" onClick={() => apply(count.id)}><CheckCircle2 className="h-4 w-4" /> Aplicar</Button><Button size="sm" variant="outline" onClick={() => cancel(count.id)}>Cancelar</Button></div> : count.status === "adjusted" ? qty(count.adjustment) : "—"}</td></tr>)}</tbody></table></div> : emptyMessage("Nenhuma conferência de inventário registrada.")}</section>; }

function MovementForm({ draft, setDraft, items, warehouses, save, saving }: any) { return <form className="grid gap-3 rounded-lg border border-primary/30 bg-card/70 p-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => { e.preventDefault(); save(draft); }}><Select value={draft.kind} onChange={(v: string) => setDraft({ ...draft, kind: v })} options={[["in","Entrada"],["out","Saída"]]} /><Select value={draft.itemId} onChange={(v: string) => setDraft({ ...draft, itemId: v })} options={[["","Selecione o item"], ...items.filter((i: InventoryItem) => i.status === "active").map((i: InventoryItem) => [i.id,i.name])]} /><Select value={draft.warehouseId} onChange={(v: string) => setDraft({ ...draft, warehouseId: v })} options={[["","Selecione o depósito"], ...warehouses.filter((w: Warehouse) => w.status === "active").map((w: Warehouse) => [w.id,w.name])]} /><Field type="number" value={draft.quantity} placeholder="Quantidade" required onChange={(v: string) => setDraft({ ...draft, quantity: v })} /><Field type="number" value={draft.unitCost} placeholder="Custo unitário" onChange={(v: string) => setDraft({ ...draft, unitCost: v })} /><Field type="date" value={draft.movedAt} onChange={(v: string) => setDraft({ ...draft, movedAt: v })} /><Field value={draft.document} placeholder="Referência / documento" onChange={(v: string) => setDraft({ ...draft, document: v })} /><Field value={draft.notes} placeholder="Observação" onChange={(v: string) => setDraft({ ...draft, notes: v })} /><FormActions saving={saving} cancel={() => setDraft(null)} /></form>; }
function TransferForm({ draft, setDraft, items, warehouses, save, saving }: any) { return <form className="grid gap-3 rounded-lg border border-primary/30 bg-card/70 p-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => { e.preventDefault(); save(draft); }}><Select value={draft.itemId} onChange={(v: string) => setDraft({ ...draft, itemId: v })} options={[["","Selecione o item"], ...items.filter((i: InventoryItem) => i.status === "active").map((i: InventoryItem) => [i.id,i.name])]} /><Select value={draft.sourceWarehouseId} onChange={(v: string) => setDraft({ ...draft, sourceWarehouseId: v })} options={[["","Depósito de origem"], ...warehouses.filter((w: Warehouse) => w.status === "active").map((w: Warehouse) => [w.id,w.name])]} /><Select value={draft.destinationWarehouseId} onChange={(v: string) => setDraft({ ...draft, destinationWarehouseId: v })} options={[["","Depósito de destino"], ...warehouses.filter((w: Warehouse) => w.status === "active").map((w: Warehouse) => [w.id,w.name])]} /><Field type="number" value={draft.quantity} placeholder="Quantidade" required onChange={(v: string) => setDraft({ ...draft, quantity: v })} /><Field type="number" value={draft.unitCost} placeholder="Custo unitário" onChange={(v: string) => setDraft({ ...draft, unitCost: v })} /><Field type="date" value={draft.transferredAt} onChange={(v: string) => setDraft({ ...draft, transferredAt: v })} /><Field value={draft.document} placeholder="Referência / documento" onChange={(v: string) => setDraft({ ...draft, document: v })} /><Field value={draft.notes} placeholder="Observação" onChange={(v: string) => setDraft({ ...draft, notes: v })} /><FormActions saving={saving} cancel={() => setDraft(null)} /></form>; }
function PanelHeader({ title, description, action }: any) { return <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3"><div className="min-w-0"><h2 className="text-lg font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div>{action}</header>; }
function Field({ value, onChange, type = "text", placeholder, required }: any) { return <input className="field-shell text-sm" type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? "0.001" : undefined} value={value} placeholder={placeholder} required={required} onChange={(e) => onChange(e.target.value)} />; }
function Select({ value, onChange, options, disabled }: any) { return <select className="field-shell text-sm" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>{options.map(([key,label]: [string,string]) => <option key={key} value={key}>{label}</option>)}</select>; }
function FormActions({ saving, cancel }: any) { return <div className="flex gap-2 sm:col-span-2 lg:col-span-3"><Button type="submit" variant="glow" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button><Button type="button" variant="outline" onClick={cancel}>Cancelar</Button></div>; }
function RowActions({ edit, remove }: any) { return <div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" aria-label="Editar" onClick={edit}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label="Excluir" onClick={remove}><Trash2 className="h-4 w-4" /></Button></div>; }