import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PurchaseItem = {
  id: string;
  purchase_id: string;
  company_id: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type PurchaseOrder = {
  id: string;
  company_id: string;
  supplier: string;
  supplier_id: string | null;
  total: number;
  purchased_at: string;
  expected_date: string | null;
  notes: string;
  status: "draft" | "confirmed" | "canceled";
  created_at: string;
  updated_at: string;
  items: PurchaseItem[];
};

const itemSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição do item.").max(240),
  unit: z.string().trim().max(20).default("un"),
  quantity: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
});

const orderSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  supplierId: z.string().uuid().nullable().optional(),
  supplier: z.string().trim().min(2, "Informe o fornecedor.").max(180),
  purchasedAt: z.string().min(4),
  expectedDate: z.string().optional().nullable(),
  notes: z.string().trim().max(1000).default(""),
  status: z.enum(["draft", "confirmed", "canceled"]).default("draft"),
  items: z.array(itemSchema).min(1, "Inclua ao menos um item no pedido."),
});

/** Lista os pedidos de compra da empresa com seus itens. */
export const listPurchaseOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("purchases")
      .select("*, items:purchase_items(*)")
      .eq("company_id", data.companyId)
      .order("purchased_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as PurchaseOrder[];
  });

/** Cria ou atualiza um pedido de compra e seus itens. */
export const savePurchaseOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => orderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const items = data.items.map((i) => ({
      description: i.description,
      unit: i.unit || "un",
      quantity: i.quantity,
      unit_price: i.unitPrice,
      total: Number((i.quantity * i.unitPrice).toFixed(2)),
    }));
    const total = Number(items.reduce((acc, i) => acc + i.total, 0).toFixed(2));

    const payload = {
      company_id: data.companyId,
      supplier_id: data.supplierId ?? null,
      supplier: data.supplier,
      purchased_at: data.purchasedAt,
      expected_date: data.expectedDate || null,
      notes: data.notes,
      status: data.status,
      total,
    };

    let purchaseId = data.id;
    if (purchaseId) {
      const { error } = await context.supabase.from("purchases").update(payload).eq("id", purchaseId);
      if (error) throw new Error(error.message);
      const { error: delError } = await context.supabase
        .from("purchase_items")
        .delete()
        .eq("purchase_id", purchaseId);
      if (delError) throw new Error(delError.message);
    } else {
      const { data: created, error } = await context.supabase
        .from("purchases")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      purchaseId = created.id as string;
    }

    const { error: itemsError } = await context.supabase
      .from("purchase_items")
      .insert(items.map((i) => ({ ...i, purchase_id: purchaseId!, company_id: data.companyId })));
    if (itemsError) throw new Error(itemsError.message);

    return { ok: true, id: purchaseId };
  });

/** Altera apenas o status de um pedido de compra. */
export const setPurchaseOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["draft", "confirmed", "canceled"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("purchases").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Remove um pedido de compra (itens em cascata). */
export const deletePurchaseOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("purchases").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
