import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SalesOrderItem = {
  id: string;
  order_id: string;
  company_id: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type SalesOrder = {
  id: string;
  company_id: string;
  customer_id: string;
  order_number: string;
  ordered_at: string;
  expected_date: string | null;
  status: "draft" | "confirmed" | "canceled";
  notes: string;
  total: number;
  created_at: string;
  updated_at: string;
  items: SalesOrderItem[];
};

const itemSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição do item.").max(240),
  unit: z.string().trim().min(1, "Informe a unidade.").max(20),
  quantity: z.coerce.number().positive("A quantidade deve ser maior que zero."),
  unitPrice: z.coerce.number().nonnegative("O valor não pode ser negativo."),
});

const orderSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  customerId: z.string().uuid("Selecione um cliente."),
  orderNumber: z.string().trim().min(1, "Informe o número do pedido.").max(80),
  orderedAt: z.string().date("Informe uma data válida."),
  expectedDate: z.string().date().nullable().optional(),
  status: z.enum(["draft", "confirmed", "canceled"]).default("draft"),
  notes: z.string().trim().max(1200).default(""),
  items: z.array(itemSchema).min(1, "Inclua ao menos um item no pedido."),
});

const scopedIdSchema = z.object({ id: z.string().uuid(), companyId: z.string().uuid() });

export const listSalesOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("sales_orders")
      .select("*, items:sales_order_items(*)")
      .eq("company_id", data.companyId)
      .order("ordered_at", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as SalesOrder[];
  });

export const saveSalesOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => orderSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.expectedDate && data.expectedDate < data.orderedAt) {
      throw new Error("A previsão de entrega não pode ser anterior à data do pedido.");
    }

    const { data: customer, error: customerError } = await context.supabase
      .from("customers")
      .select("id")
      .eq("id", data.customerId)
      .eq("company_id", data.companyId)
      .maybeSingle();
    if (customerError || !customer) throw new Error("Cliente inválido para esta empresa.");

    const items = data.items.map((item) => ({
      company_id: data.companyId,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: Number((item.quantity * item.unitPrice).toFixed(2)),
    }));
    const total = Number(items.reduce((sum, item) => sum + item.total, 0).toFixed(2));
    const payload = {
      company_id: data.companyId,
      customer_id: data.customerId,
      order_number: data.orderNumber,
      ordered_at: data.orderedAt,
      expected_date: data.expectedDate || null,
      status: data.status,
      notes: data.notes,
      total,
    };

    let orderId = data.id;
    if (orderId) {
      const { data: current, error: currentError } = await context.supabase
        .from("sales_orders")
        .select("id, status")
        .eq("id", orderId)
        .eq("company_id", data.companyId)
        .maybeSingle();
      if (currentError || !current) throw new Error("Pedido não encontrado.");
      if (current.status !== "draft") throw new Error("Somente pedidos em rascunho podem ser editados.");

      const { error } = await context.supabase
        .from("sales_orders")
        .update(payload)
        .eq("id", orderId)
        .eq("company_id", data.companyId)
        .eq("status", "draft");
      if (error?.code === "23505") throw new Error("Já existe um pedido com este número nesta empresa.");
      if (error) throw new Error(error.message);

      const { error: deleteError } = await context.supabase
        .from("sales_order_items")
        .delete()
        .eq("order_id", orderId)
        .eq("company_id", data.companyId);
      if (deleteError) throw new Error(deleteError.message);
    } else {
      const { data: created, error } = await context.supabase
        .from("sales_orders")
        .insert(payload)
        .select("id")
        .single();
      if (error?.code === "23505") throw new Error("Já existe um pedido com este número nesta empresa.");
      if (error) throw new Error(error.message);
      orderId = created.id;
    }

    if (!orderId) throw new Error("Não foi possível identificar o pedido.");
    const { error: itemsError } = await context.supabase
      .from("sales_order_items")
      .insert(items.map((item) => ({ ...item, order_id: orderId })));
    if (itemsError) throw new Error(itemsError.message);
    return { ok: true, id: orderId };
  });

export const setSalesOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    scopedIdSchema.extend({ status: z.enum(["draft", "confirmed", "canceled"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("sales_orders")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("company_id", data.companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSalesOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => scopedIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: removed, error } = await context.supabase
      .from("sales_orders")
      .delete()
      .eq("id", data.id)
      .eq("company_id", data.companyId)
      .eq("status", "draft")
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!removed) throw new Error("Somente pedidos em rascunho podem ser excluídos.");
    return { ok: true };
  });