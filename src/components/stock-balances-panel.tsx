import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
  Warehouse as WarehouseIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import {
  deleteInventoryItem,
  deleteStockMovement,
  deleteWarehouse,
  listInventoryItems,
  listReceiptAllocations,
  listStockBalances,
  listStockMovements,
  listWarehouses,
  saveInventoryItem,
  saveStockMovement,
  saveWarehouse,
  setPurchaseItemStockLink,
  setReceiptWarehouse,
  type InventoryItem,
  type ReceiptAllocation,
  type StockBalance,
  type StockMovement,
  type Warehouse,
} from "@/lib/stock.functions";

type WarehouseDraft = { id?: string; name: string; description: string; status: "active" | "inactive" };
type ItemDraft = { id?: string; name: string; unit: string; minQuantity: string; unitCost: string };
type MovementDraft = {
  id?: string;
  kind: "in" | "out";
  warehouseId: string;
  itemId: string;
  quantity: string;
  unitCost: string;
  movedAt: string;
  document: string;
  notes: string;
};

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
const qty = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

export function StockBalancesPanel() {
  const { company, canEdit } = useCompany();
  const qc = useQueryClient();
  const editable = canEdit("estoque");

  const fetchWarehouses = useServerFn(listWarehouses);
  const fetchItems = useServerFn(listInventoryItems);
  const fetchBalances = useServerFn(listStockBalances);
  const fetchReceipts = useServerFn(listReceiptAllocations);
  const persistWarehouse = useServerFn(saveWarehouse);
  const removeWarehouse = useServerFn(deleteWarehouse);
  const persistItem = useServerFn(saveInventoryItem);
  const removeItem = useServerFn(deleteInventoryItem);
  const linkWarehouse = useServerFn(setReceiptWarehouse);
  const linkItem = useServerFn(setPurchaseItemStockLink);

  const [warehouseDraft, setWarehouseDraft] = useState<WarehouseDraft | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState("all");

  const args = { data: { companyId: company.id } };
  const enabled = Boolean(company.id);

  const warehousesQuery = useQuery({
    queryKey: ["warehouses", company.id],
    queryFn: () => fetchWarehouses(args),
    enabled,
  });
  const itemsQuery = useQuery({
    queryKey: ["inventory-items", company.id],
    queryFn: () => fetchItems(args),
    enabled,
  });
  const balancesQuery = useQuery({
    queryKey: ["stock-balances", company.id],
    queryFn: () => fetchBalances(args),
    enabled,
  });
  const receiptsQuery = useQuery({
    queryKey: ["stock-receipts", company.id],
    queryFn: () => fetchReceipts(args),
    enabled,
  });

  const warehouses = (warehousesQuery.data ?? []) as Warehouse[];
  const items = (itemsQuery.data ?? []) as InventoryItem[];
  const balances = (balancesQuery.data ?? []) as StockBalance[];
  const receipts = (receiptsQuery.data ?? []) as ReceiptAllocation[];

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: ["warehouses", company.id] });
    void qc.invalidateQueries({ queryKey: ["inventory-items", company.id] });
    void qc.invalidateQueries({ queryKey: ["stock-balances", company.id] });
    void qc.invalidateQueries({ queryKey: ["stock-receipts", company.id] });
  };

  const onError = (e: Error) => setError(e.message);

  const warehouseMutation = useMutation({
    mutationFn: (d: WarehouseDraft) =>
      persistWarehouse({
        data: {
          id: d.id,
          companyId: company.id,
          name: d.name,
          description: d.description,
          status: d.status,
        },
      }),
    onSuccess: () => {
      setWarehouseDraft(null);
      setError(null);
      invalidateAll();
    },
    onError,
  });

  const itemMutation = useMutation({
    mutationFn: (d: ItemDraft) =>
      persistItem({
        data: {
          id: d.id,
          companyId: company.id,
          name: d.name,
          unit: d.unit,
          minQuantity: Number(d.minQuantity || 0),
          unitCost: Number(d.unitCost || 0),
        },
      }),
    onSuccess: () => {
      setItemDraft(null);
      setError(null);
      invalidateAll();
    },
    onError,
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: (id: string) => removeWarehouse({ data: { id } }),
    onSuccess: invalidateAll,
    onError,
  });
  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => removeItem({ data: { id } }),
    onSuccess: invalidateAll,
    onError,
  });
  const receiptWarehouseMutation = useMutation({
    mutationFn: (v: { receiptId: string; warehouseId: string | null }) => linkWarehouse({ data: v }),
    onSuccess: invalidateAll,
    onError,
  });
  const itemLinkMutation = useMutation({
    mutationFn: (v: { purchaseItemId: string; inventoryItemId: string | null }) => linkItem({ data: v }),
    onSuccess: invalidateAll,
    onError,
  });

  const filtered = useMemo(
    () =>
      warehouseFilter === "all"
        ? balances
        : balances.filter((b) => (b.warehouse_id ?? "none") === warehouseFilter),
    [balances, warehouseFilter],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; rows: StockBalance[]; value: number }>();
    for (const b of filtered) {
      const key = b.warehouse_id ?? "none";
      const entry = map.get(key) ?? { name: b.warehouse_name, rows: [], value: 0 };
      entry.rows.push(b);
      entry.value += b.value;
      map.set(key, entry);
    }
    return [...map.entries()];
  }, [filtered]);

  const totalValue = filtered.reduce((s, b) => s + b.value, 0);
  const loading =
    warehousesQuery.isLoading || itemsQuery.isLoading || balancesQuery.isLoading || receiptsQuery.isLoading;

  return (
    <div className="space-y-8">
      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p>
      ) : null}

      {/* Depósitos */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">Depósitos</h2>
            <p className="text-sm text-muted-foreground">
              Locais de armazenagem de {company.name} usados para apurar o saldo dos itens.
            </p>
          </div>
          {editable ? (
            <Button
              variant="glow"
              onClick={() => setWarehouseDraft({ name: "", description: "", status: "active" })}
            >
              <Plus className="h-4 w-4" /> Novo depósito
            </Button>
          ) : null}
        </div>

        {warehouseDraft ? (
          <form
            className="space-y-4 rounded-2xl border border-primary/40 bg-card/80 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              warehouseMutation.mutate(warehouseDraft);
            }}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                className="field-shell text-sm"
                placeholder="Nome (armazém sede, galpão fazenda…)"
                value={warehouseDraft.name}
                onChange={(e) => setWarehouseDraft({ ...warehouseDraft, name: e.target.value })}
                required
                minLength={2}
              />
              <input
                className="field-shell text-sm"
                placeholder="Descrição / localização"
                value={warehouseDraft.description}
                onChange={(e) => setWarehouseDraft({ ...warehouseDraft, description: e.target.value })}
              />
              <select
                className="field-shell text-sm"
                value={warehouseDraft.status}
                onChange={(e) =>
                  setWarehouseDraft({ ...warehouseDraft, status: e.target.value as WarehouseDraft["status"] })
                }
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="glow" disabled={warehouseMutation.isPending}>
                {warehouseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar depósito"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setWarehouseDraft(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : null}

        {warehouses.length === 0 && !loading ? (
          <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
            Nenhum depósito cadastrado. Crie um depósito para direcionar as entradas dos recebimentos.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {warehouses.map((w) => (
              <article
                key={w.id}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <WarehouseIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{w.name}</h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {w.description || "Sem descrição"} • {w.status === "active" ? "Ativo" : "Inativo"}
                  </p>
                </div>
                {editable ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setWarehouseDraft({
                          id: w.id,
                          name: w.name,
                          description: w.description ?? "",
                          status: (w.status as WarehouseDraft["status"]) ?? "active",
                        })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Excluir o depósito ${w.name}?`)) deleteWarehouseMutation.mutate(w.id);
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

      {/* Itens */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">Itens de estoque</h2>
            <p className="text-sm text-muted-foreground">
              Cadastro de insumos e materiais utilizados na apuração do saldo.
            </p>
          </div>
          {editable ? (
            <Button
              variant="outline"
              onClick={() => setItemDraft({ name: "", unit: "un", minQuantity: "0", unitCost: "0" })}
            >
              <Plus className="h-4 w-4" /> Novo item
            </Button>
          ) : null}
        </div>

        {itemDraft ? (
          <form
            className="space-y-4 rounded-2xl border border-primary/40 bg-card/80 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              itemMutation.mutate(itemDraft);
            }}
          >
            <div className="grid gap-3 sm:grid-cols-4">
              <input
                className="field-shell text-sm sm:col-span-2"
                placeholder="Nome do item"
                value={itemDraft.name}
                onChange={(e) => setItemDraft({ ...itemDraft, name: e.target.value })}
                required
                minLength={2}
              />
              <input
                className="field-shell text-sm"
                placeholder="Unidade (kg, L, un)"
                value={itemDraft.unit}
                onChange={(e) => setItemDraft({ ...itemDraft, unit: e.target.value })}
                required
              />
              <input
                className="field-shell text-sm"
                type="number"
                min="0"
                step="0.001"
                placeholder="Estoque mínimo"
                value={itemDraft.minQuantity}
                onChange={(e) => setItemDraft({ ...itemDraft, minQuantity: e.target.value })}
              />
              <input
                className="field-shell text-sm"
                type="number"
                min="0"
                step="0.01"
                placeholder="Custo unitário"
                value={itemDraft.unitCost}
                onChange={(e) => setItemDraft({ ...itemDraft, unitCost: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="glow" disabled={itemMutation.isPending}>
                {itemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar item"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setItemDraft(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : null}

        {items.length === 0 && !loading ? (
          <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
            Nenhum item cadastrado.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((i) => (
              <article
                key={i.id}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Package className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{i.name}</h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {i.unit} • mín. {qty(Number(i.min_quantity ?? 0))} • {money(Number(i.unit_cost ?? 0))}
                  </p>
                </div>
                {editable ? (
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setItemDraft({
                          id: i.id,
                          name: i.name,
                          unit: i.unit,
                          minQuantity: String(i.min_quantity ?? 0),
                          unitCost: String(i.unit_cost ?? 0),
                        })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Excluir o item ${i.name}?`)) deleteItemMutation.mutate(i.id);
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

      {/* Entradas por recebimento */}
      <section className="space-y-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Entradas dos recebimentos de compras</h2>
          <p className="text-sm text-muted-foreground">
            Indique o depósito de entrada de cada recebimento e o item de estoque correspondente a cada produto
            recebido. O saldo é calculado automaticamente a partir dessas entradas.
          </p>
        </div>

        {receipts.length === 0 && !loading ? (
          <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
            Nenhum recebimento registrado em Compras.
          </p>
        ) : (
          <div className="space-y-3">
            {receipts.map((r) => (
              <article key={r.receipt_id} className="space-y-3 rounded-2xl border border-border/60 bg-card/80 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">
                      {new Date(`${r.received_at}T00:00:00`).toLocaleDateString("pt-BR")} •{" "}
                      {r.supplier || "Fornecedor não informado"}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.document ? `Documento ${r.document}` : "Sem documento"} • {r.lines.length} item(ns)
                    </p>
                  </div>
                  <select
                    className="field-shell text-sm"
                    value={r.warehouse_id ?? ""}
                    disabled={!editable}
                    onChange={(e) =>
                      receiptWarehouseMutation.mutate({
                        receiptId: r.receipt_id,
                        warehouseId: e.target.value || null,
                      })
                    }
                  >
                    <option value="">Sem depósito</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  {r.lines.map((line) => (
                    <div
                      key={line.purchase_item_id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-border/50 bg-background/40 px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">{line.description}</span>
                      <span className="text-xs text-muted-foreground">
                        {qty(line.quantity)} {line.unit}
                      </span>
                      <select
                        className="field-shell text-sm"
                        value={line.inventory_item_id ?? ""}
                        disabled={!editable}
                        onChange={(e) =>
                          itemLinkMutation.mutate({
                            purchaseItemId: line.purchase_item_id,
                            inventoryItemId: e.target.value || null,
                          })
                        }
                      >
                        <option value="">Não vinculado</option>
                        {items.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Saldos */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">Saldos por depósito</h2>
            <p className="text-sm text-muted-foreground">
              Total em estoque: <strong className="text-foreground">{money(totalValue)}</strong>
            </p>
          </div>
          <select
            className="field-shell text-sm"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="all">Todos os depósitos</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
            <option value="none">Sem depósito definido</option>
          </select>
        </div>

        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : grouped.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
            Nenhum saldo apurado. Registre recebimentos em Compras e vincule-os a um depósito.
          </p>
        ) : (
          <div className="space-y-4">
            {grouped.map(([key, group]) => (
              <div key={key} className="overflow-hidden rounded-2xl border border-border/60 bg-card/80">
                <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-3">
                  <Boxes className="h-4 w-4 text-primary" />
                  <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{group.name}</h3>
                  <span className="text-xs text-muted-foreground">{money(group.value)}</span>
                </div>
                <div className="divide-y divide-border/50">
                  {group.rows.map((row) => {
                    const low = row.min_quantity > 0 && row.quantity < row.min_quantity;
                    return (
                      <div
                        key={`${key}-${row.item_id ?? row.item_name}`}
                        className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
                      >
                        <span className="min-w-0 flex-1 truncate">{row.item_name}</span>
                        {low ? (
                          <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[11px]">
                            abaixo do mínimo
                          </span>
                        ) : null}
                        {!row.item_id ? (
                          <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                            item não vinculado
                          </span>
                        ) : null}
                        <span className="font-semibold">
                          {qty(row.quantity)} {row.unit}
                        </span>
                        <span className="w-28 text-right text-xs text-muted-foreground">{money(row.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
