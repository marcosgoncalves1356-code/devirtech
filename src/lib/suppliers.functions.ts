import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Supplier = {
  id: string;
  company_id: string;
  name: string;
  trade_name: string;
  document: string;
  state_registration: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  category: string;
  payment_terms: string;
  bank_info: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const supplierSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  name: z.string().trim().min(2, "Informe a razão social do fornecedor.").max(180),
  tradeName: z.string().trim().max(180).default(""),
  document: z.string().trim().max(30).default(""),
  stateRegistration: z.string().trim().max(40).default(""),
  contactName: z.string().trim().max(160).default(""),
  phone: z.string().trim().max(40).default(""),
  email: z.string().trim().max(160).default(""),
  address: z.string().trim().max(240).default(""),
  city: z.string().trim().max(120).default(""),
  state: z.string().trim().max(2).default(""),
  zipCode: z.string().trim().max(12).default(""),
  category: z.string().trim().max(120).default(""),
  paymentTerms: z.string().trim().max(160).default(""),
  bankInfo: z.string().trim().max(240).default(""),
  notes: z.string().trim().max(1000).default(""),
  status: z.enum(["active", "inactive"]).default("active"),
});

/** Lista os fornecedores da empresa (RLS isola por empresa). */
export const listSuppliers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("suppliers")
      .select("*")
      .eq("company_id", data.companyId)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Supplier[];
  });

/** Cria ou atualiza um fornecedor. */
export const saveSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => supplierSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.email && !z.string().email().safeParse(data.email).success) {
      throw new Error("Informe um e-mail válido.");
    }
    const payload = {
      company_id: data.companyId,
      name: data.name,
      trade_name: data.tradeName,
      document: data.document,
      state_registration: data.stateRegistration,
      contact_name: data.contactName,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      state: data.state.toUpperCase(),
      zip_code: data.zipCode,
      category: data.category,
      payment_terms: data.paymentTerms,
      bank_info: data.bankInfo,
      notes: data.notes,
      status: data.status,
    };

    const query = data.id
      ? context.supabase.from("suppliers").update(payload).eq("id", data.id)
      : context.supabase.from("suppliers").insert(payload);
    const { error } = await query;
    if (error) {
      if (error.code === "23505") throw new Error("Já existe um fornecedor com este CNPJ/CPF nesta empresa.");
      throw new Error(error.message);
    }
    return { ok: true };
  });

/** Remove um fornecedor. */
export const deleteSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("suppliers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
