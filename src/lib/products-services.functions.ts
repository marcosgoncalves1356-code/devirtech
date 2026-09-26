import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProductService = {
  id: string;
  company_id: string;
  kind: "product" | "service";
  code: string;
  name: string;
  description: string;
  unit: string;
  category: string;
  status: "active" | "inactive";
};

const companySchema = z.object({ companyId: z.string().uuid() });
const recordSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  kind: z.enum(["product", "service"]),
  code: z.string().trim().min(1, "Informe o código.").max(40),
  name: z.string().trim().min(2, "Informe o nome.").max(160),
  description: z.string().trim().max(500).default(""),
  unit: z.string().trim().min(1, "Informe a unidade.").max(20),
  category: z.string().trim().max(120).default(""),
  status: z.enum(["active", "inactive"]),
});

export const listProductsServices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("products_services")
      .select("id, company_id, kind, code, name, description, unit, category, status")
      .eq("company_id", data.companyId)
      .order("name");
    if (error) throw new Error(error.message);
    return (rows ?? []) as ProductService[];
  });

export const saveProductService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => recordSchema.parse(input))
  .handler(async ({ data, context }) => {
    const payload = {
      company_id: data.companyId,
      kind: data.kind,
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description,
      unit: data.unit,
      category: data.category,
      status: data.status,
    };
    const query = data.id
      ? context.supabase.from("products_services").update(payload).eq("id", data.id).eq("company_id", data.companyId)
      : context.supabase.from("products_services").insert(payload);
    const { error } = await query;
    if (error?.code === "23505") throw new Error("Já existe um cadastro com este código nesta empresa.");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProductService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("products_services")
      .delete()
      .eq("id", data.id)
      .eq("company_id", data.companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });