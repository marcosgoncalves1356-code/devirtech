import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type Customer = {
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
  notes: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export type SalesContract = {
  id: string;
  company_id: string;
  customer_id: string;
  contract_number: string;
  start_date: string;
  end_date: string | null;
  product: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  status: "draft" | "active" | "completed" | "canceled";
  notes: string;
  created_at: string;
  updated_at: string;
};

const companySchema = z.object({ companyId: z.string().uuid() });

const customerSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  name: z.string().trim().min(2, "Informe o nome do cliente.").max(180),
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
  notes: z.string().trim().max(1200).default(""),
  status: z.enum(["active", "inactive"]).default("active"),
});

const contractSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  customerId: z.string().uuid("Selecione um cliente."),
  contractNumber: z.string().trim().min(1, "Informe o número do contrato.").max(80),
  startDate: z.string().date(),
  endDate: z.string().date().nullable().optional(),
  product: z.string().trim().min(2, "Informe o produto ou cultura.").max(160),
  quantity: z.coerce.number().nonnegative("A quantidade não pode ser negativa."),
  unit: z.string().trim().min(1, "Informe a unidade.").max(30),
  unitPrice: z.coerce.number().nonnegative("O valor não pode ser negativo."),
  status: z.enum(["draft", "active", "completed", "canceled"]),
  notes: z.string().trim().max(1200).default(""),
});

async function assertCustomer(
  supabase: SupabaseClient<Database>,
  companyId: string,
  customerId: string,
) {
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (error || !data) throw new Error("Cliente inválido para esta empresa.");
}

export const listCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("customers")
      .select("*")
      .eq("company_id", data.companyId)
      .order("name");
    if (error) throw new Error(error.message);
    return (rows ?? []) as Customer[];
  });

export const saveCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => customerSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.email && !z.string().email().safeParse(data.email).success) throw new Error("Informe um e-mail válido.");
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
      notes: data.notes,
      status: data.status,
    };
    const query = data.id
      ? context.supabase.from("customers").update(payload).eq("id", data.id).eq("company_id", data.companyId)
      : context.supabase.from("customers").insert(payload);
    const { error } = await query;
    if (error?.code === "23505") throw new Error("Já existe um cliente com este documento nesta empresa.");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("customers").delete().eq("id", data.id).eq("company_id", data.companyId);
    if (error?.code === "23503") throw new Error("Este cliente possui contratos e não pode ser excluído.");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSalesContracts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("sales_contracts")
      .select("*")
      .eq("company_id", data.companyId)
      .order("start_date", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as SalesContract[];
  });

export const saveSalesContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => contractSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCustomer(context.supabase, data.companyId, data.customerId);
    if (data.endDate && data.endDate < data.startDate) throw new Error("A data final não pode ser anterior à inicial.");
    const payload = {
      company_id: data.companyId,
      customer_id: data.customerId,
      contract_number: data.contractNumber,
      start_date: data.startDate,
      end_date: data.endDate || null,
      product: data.product,
      quantity: data.quantity,
      unit: data.unit,
      unit_price: data.unitPrice,
      total: Math.round(data.quantity * data.unitPrice * 100) / 100,
      status: data.status,
      notes: data.notes,
    };
    const query = data.id
      ? context.supabase.from("sales_contracts").update(payload).eq("id", data.id).eq("company_id", data.companyId)
      : context.supabase.from("sales_contracts").insert(payload);
    const { error } = await query;
    if (error?.code === "23505") throw new Error("Já existe um contrato com este número nesta empresa.");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSalesContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("sales_contracts")
      .delete()
      .eq("id", data.id)
      .eq("company_id", data.companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });