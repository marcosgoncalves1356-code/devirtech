import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SalesPriceListItem = {
  id: string;
  price_list_id: string;
  company_id: string;
  description: string;
  unit: string;
  price: number;
};

export type SalesPriceList = {
  id: string;
  company_id: string;
  name: string;
  valid_from: string;
  valid_until: string | null;
  status: "draft" | "active" | "inactive";
  notes: string;
  created_at: string;
  updated_at: string;
  items: SalesPriceListItem[];
};

const itemSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição do item.").max(240),
  unit: z.string().trim().min(1, "Informe a unidade.").max(20),
  price: z.coerce.number().nonnegative("O preço não pode ser negativo."),
});

const priceListSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  name: z.string().trim().min(2, "Informe o nome da tabela.").max(120),
  validFrom: z.string().date("Informe uma data inicial válida."),
  validUntil: z.string().date().nullable().optional(),
  status: z.enum(["draft", "active", "inactive"]).default("draft"),
  notes: z.string().trim().max(1200).default(""),
  items: z.array(itemSchema).min(1, "Inclua ao menos um item na tabela."),
});

const scopedIdSchema = z.object({ id: z.string().uuid(), companyId: z.string().uuid() });

export const listSalesPriceLists = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("sales_price_lists")
      .select("*, items:sales_price_list_items(*)")
      .eq("company_id", data.companyId)
      .order("valid_from", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as SalesPriceList[];
  });

export const saveSalesPriceList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => priceListSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.validUntil && data.validUntil < data.validFrom) {
      throw new Error("A vigência final não pode ser anterior à inicial.");
    }
    const normalized = new Set<string>();
    for (const item of data.items) {
      const key = item.description.trim().toLocaleLowerCase("pt-BR");
      if (normalized.has(key)) throw new Error(`O item “${item.description}” está repetido.`);
      normalized.add(key);
    }
    const payload = {
      company_id: data.companyId,
      name: data.name,
      valid_from: data.validFrom,
      valid_until: data.validUntil || null,
      status: data.status,
      notes: data.notes,
    };
    let priceListId = data.id;
    if (priceListId) {
      const { data: existing, error: existingError } = await context.supabase
        .from("sales_price_lists")
        .select("id")
        .eq("id", priceListId)
        .eq("company_id", data.companyId)
        .maybeSingle();
      if (existingError || !existing) throw new Error("Tabela de preços não encontrada.");
      const { error } = await context.supabase.from("sales_price_lists").update(payload)
        .eq("id", priceListId).eq("company_id", data.companyId);
      if (error?.code === "23505") throw new Error("Já existe uma tabela com este nome nesta empresa.");
      if (error) throw new Error(error.message);
      const { error: deleteError } = await context.supabase.from("sales_price_list_items").delete()
        .eq("price_list_id", priceListId).eq("company_id", data.companyId);
      if (deleteError) throw new Error(deleteError.message);
    } else {
      const { data: created, error } = await context.supabase.from("sales_price_lists").insert(payload).select("id").single();
      if (error?.code === "23505") throw new Error("Já existe uma tabela com este nome nesta empresa.");
      if (error) throw new Error(error.message);
      priceListId = created.id;
    }
    if (!priceListId) throw new Error("Não foi possível identificar a tabela de preços.");
    const { error: itemsError } = await context.supabase.from("sales_price_list_items").insert(
      data.items.map((item) => ({
        price_list_id: priceListId,
        company_id: data.companyId,
        description: item.description,
        unit: item.unit,
        price: item.price,
      })),
    );
    if (itemsError?.code === "23505") throw new Error("Não é permitido repetir um item na mesma tabela.");
    if (itemsError) throw new Error(itemsError.message);
    return { ok: true, id: priceListId };
  });

export const setSalesPriceListStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => scopedIdSchema.extend({ status: z.enum(["draft", "active", "inactive"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: changed, error } = await context.supabase.from("sales_price_lists")
      .update({ status: data.status }).eq("id", data.id).eq("company_id", data.companyId).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    if (!changed) throw new Error("Tabela de preços não encontrada.");
    return { ok: true };
  });

export const deleteSalesPriceList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => scopedIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: removed, error } = await context.supabase.from("sales_price_lists").delete()
      .eq("id", data.id).eq("company_id", data.companyId).neq("status", "active").select("id").maybeSingle();
    if (error) throw new Error(error.message);
    if (!removed) throw new Error("Desative a tabela antes de excluí-la.");
    return { ok: true };
  });
