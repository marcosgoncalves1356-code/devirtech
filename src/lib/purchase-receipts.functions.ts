import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PurchaseReceiptItem = {
  id: string;
  receipt_id: string;
  purchase_item_id: string;
  company_id: string;
  quantity: number;
};

export type PurchaseReceipt = {
  id: string;
  company_id: string;
  purchase_id: string;
  received_at: string;
  document: string;
  notes: string;
  created_at: string;
  updated_at: string;
  items: PurchaseReceiptItem[];
};

const receiptSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  purchaseId: z.string().uuid(),
  receivedAt: z.string().min(4),
  document: z.string().trim().max(120).default(""),
  notes: z.string().trim().max(1000).default(""),
  items: z
    .array(
      z.object({
        purchaseItemId: z.string().uuid(),
        quantity: z.coerce.number().min(0),
      }),
    )
    .min(1, "Informe ao menos um item recebido."),
});

/** Lista os recebimentos da empresa (opcionalmente de um pedido). */
export const listPurchaseReceipts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ companyId: z.string().uuid(), purchaseId: z.string().uuid().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("purchase_receipts")
      .select("*, items:purchase_receipt_items(*)")
      .eq("company_id", data.companyId)
      .order("received_at", { ascending: false });
    if (data.purchaseId) query = query.eq("purchase_id", data.purchaseId);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as PurchaseReceipt[];
  });

/** Cria ou atualiza um recebimento com as quantidades recebidas por item. */
export const savePurchaseReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => receiptSchema.parse(input))
  .handler(async ({ data, context }) => {
    const items = data.items.filter((i) => i.quantity > 0);
    if (items.length === 0) throw new Error("Informe ao menos uma quantidade recebida maior que zero.");

    const payload = {
      company_id: data.companyId,
      purchase_id: data.purchaseId,
      received_at: data.receivedAt,
      document: data.document,
      notes: data.notes,
    };

    let receiptId = data.id;
    if (receiptId) {
      const { error } = await context.supabase.from("purchase_receipts").update(payload).eq("id", receiptId);
      if (error) throw new Error(error.message);
      const { error: delError } = await context.supabase
        .from("purchase_receipt_items")
        .delete()
        .eq("receipt_id", receiptId);
      if (delError) throw new Error(delError.message);
    } else {
      const { data: created, error } = await context.supabase
        .from("purchase_receipts")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      receiptId = created.id as string;
    }

    const { error: itemsError } = await context.supabase.from("purchase_receipt_items").insert(
      items.map((i) => ({
        receipt_id: receiptId!,
        purchase_item_id: i.purchaseItemId,
        company_id: data.companyId,
        quantity: i.quantity,
      })),
    );
    if (itemsError) throw new Error(itemsError.message);

    return { ok: true, id: receiptId };
  });

/** Remove um recebimento e seus itens. */
export const deletePurchaseReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("purchase_receipts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
