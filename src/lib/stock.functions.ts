import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Warehouse = {
  id: string;
  company_id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type InventoryItem = {
  id: string;
  company_id: string;
  name: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  unit_cost: number;
};

export type StockBalance = {
  warehouse_id: string | null;
  warehouse_name: string;
  item_id: string | null;
  item_name: string;
  unit: string;
  quantity: number;
  value: number;
  min_quantity: number;
};

export type ReceiptAllocation = {
  receipt_id: string;
  received_at: string;
  document: string;
  purchase_id: string;
  supplier: string;
  warehouse_id: string | null;
  lines: {
    purchase_item_id: string;
    description: string;
    unit: string;
    quantity: number;
    unit_price: number;
    inventory_item_id: string | null;
  }[];
};

const warehouseSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  name: z.string().trim().min(2, "Informe o nome do depósito.").max(160),
  description: z.string().trim().max(500).default(""),
  status: z.enum(["active", "inactive"]).default("active"),
});

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  name: z.string().trim().min(2, "Informe o nome do item.").max(160),
  unit: z.string().trim().min(1, "Informe a unidade.").max(20),
  minQuantity: z.coerce.number().min(0).default(0),
  unitCost: z.coerce.number().min(0).default(0),
});

/** Lista os depósitos da empresa. */
export const listWarehouses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("warehouses")
      .select("*")
      .eq("company_id", data.companyId)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Warehouse[];
  });

/** Cria ou atualiza um depósito. */
export const saveWarehouse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => warehouseSchema.parse(input))
  .handler(async ({ data, context }) => {
    const payload = {
      company_id: data.companyId,
      name: data.name,
      description: data.description,
      status: data.status,
    };
    const query = data.id
      ? context.supabase.from("warehouses").update(payload).eq("id", data.id)
      : context.supabase.from("warehouses").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Remove um depósito (recebimentos ficam sem depósito). */
export const deleteWarehouse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("warehouses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Lista os itens de estoque da empresa. */
export const listInventoryItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("inventory_items")
      .select("id, company_id, name, unit, quantity, min_quantity, unit_cost")
      .eq("company_id", data.companyId)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as InventoryItem[];
  });

/** Cria ou atualiza um item de estoque. */
export const saveInventoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => itemSchema.parse(input))
  .handler(async ({ data, context }) => {
    const payload = {
      company_id: data.companyId,
      name: data.name,
      unit: data.unit,
      min_quantity: data.minQuantity,
      unit_cost: data.unitCost,
    };
    const query = data.id
      ? context.supabase.from("inventory_items").update(payload).eq("id", data.id)
      : context.supabase.from("inventory_items").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Remove um item de estoque. */
export const deleteInventoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("inventory_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

type RawReceipt = {
  id: string;
  received_at: string;
  document: string | null;
  purchase_id: string;
  warehouse_id: string | null;
  purchase: { supplier: string | null } | null;
  items: {
    purchase_item_id: string;
    quantity: number | string;
    purchase_item: {
      id: string;
      description: string | null;
      unit: string | null;
      unit_price: number | string | null;
      inventory_item_id: string | null;
    } | null;
  }[];
};

async function fetchReceipts(supabase: any, companyId: string) {
  const { data: rows, error } = await supabase
    .from("purchase_receipts")
    .select(
      "id, received_at, document, purchase_id, warehouse_id, purchase:purchases(supplier), items:purchase_receipt_items(purchase_item_id, quantity, purchase_item:purchase_items(id, description, unit, unit_price, inventory_item_id))",
    )
    .eq("company_id", companyId)
    .order("received_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (rows ?? []) as RawReceipt[];
}

/** Recebimentos de compras com o vínculo de depósito e item de estoque. */
export const listReceiptAllocations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<ReceiptAllocation[]> => {
    const rows = await fetchReceipts(context.supabase, data.companyId);
    return rows.map((r) => ({
      receipt_id: r.id,
      received_at: r.received_at,
      document: r.document ?? "",
      purchase_id: r.purchase_id,
      supplier: r.purchase?.supplier ?? "",
      warehouse_id: r.warehouse_id,
      lines: r.items.map((i) => ({
        purchase_item_id: i.purchase_item_id,
        description: i.purchase_item?.description ?? "Item",
        unit: i.purchase_item?.unit ?? "un",
        quantity: Number(i.quantity ?? 0),
        unit_price: Number(i.purchase_item?.unit_price ?? 0),
        inventory_item_id: i.purchase_item?.inventory_item_id ?? null,
      })),
    }));
  });

/** Saldo dos itens por depósito, calculado a partir dos recebimentos de compras. */
export const listStockBalances = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<StockBalance[]> => {
    const [receipts, warehousesRes, itemsRes] = await Promise.all([
      fetchReceipts(context.supabase, data.companyId),
      context.supabase.from("warehouses").select("id, name").eq("company_id", data.companyId),
      context.supabase
        .from("inventory_items")
        .select("id, name, unit, min_quantity, unit_cost")
        .eq("company_id", data.companyId),
    ]);
    if (warehousesRes.error) throw new Error(warehousesRes.error.message);
    if (itemsRes.error) throw new Error(itemsRes.error.message);

    const warehouseName = new Map<string, string>(
      (warehousesRes.data ?? []).map((w: any) => [w.id as string, w.name as string]),
    );
    const items = new Map<string, any>((itemsRes.data ?? []).map((i: any) => [i.id as string, i]));

    const acc = new Map<string, StockBalance>();
    for (const receipt of receipts) {
      for (const line of receipt.items) {
        const itemId = line.purchase_item?.inventory_item_id ?? null;
        const qty = Number(line.quantity ?? 0);
        if (qty <= 0) continue;
        const key = `${receipt.warehouse_id ?? "none"}::${itemId ?? `free:${line.purchase_item?.description ?? ""}`}`;
        const item = itemId ? items.get(itemId) : null;
        const unitPrice = Number(item?.unit_cost ?? line.purchase_item?.unit_price ?? 0);
        const current = acc.get(key) ?? {
          warehouse_id: receipt.warehouse_id,
          warehouse_name: receipt.warehouse_id
            ? (warehouseName.get(receipt.warehouse_id) ?? "Depósito removido")
            : "Sem depósito definido",
          item_id: itemId,
          item_name: item?.name ?? line.purchase_item?.description ?? "Item",
          unit: item?.unit ?? line.purchase_item?.unit ?? "un",
          quantity: 0,
          value: 0,
          min_quantity: Number(item?.min_quantity ?? 0),
        };
        current.quantity += qty;
        current.value += qty * unitPrice;
        acc.set(key, current);
      }
    }
    return [...acc.values()].sort(
      (a, b) => a.warehouse_name.localeCompare(b.warehouse_name) || a.item_name.localeCompare(b.item_name),
    );
  });

/** Define o depósito de entrada de um recebimento de compra. */
export const setReceiptWarehouse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ receiptId: z.string().uuid(), warehouseId: z.string().uuid().nullable() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("purchase_receipts")
      .update({ warehouse_id: data.warehouseId })
      .eq("id", data.receiptId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Vincula um item de pedido de compra a um item de estoque. */
export const setPurchaseItemStockLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ purchaseItemId: z.string().uuid(), inventoryItemId: z.string().uuid().nullable() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("purchase_items")
      .update({ inventory_item_id: data.inventoryItemId })
      .eq("id", data.purchaseItemId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
