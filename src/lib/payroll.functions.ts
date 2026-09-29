import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PayrollEntry = { id: string; company_id: string; reference_month: string; employees_count: number; gross_total: number; deductions: number; net_total: number; status: "draft" | "confirmed" | "canceled" };
export type PayrollItem = { id: string; payroll_entry_id: string; company_id: string; employee_id: string; base_salary: number; earnings: number; deductions: number; net_total: number; notes: string };

const companySchema = z.object({ companyId: z.string().uuid() });
const entrySchema = z.object({ id: z.string().uuid().optional(), companyId: z.string().uuid(), referenceMonth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), status: z.enum(["draft", "confirmed", "canceled"]) });
const itemSchema = z.object({ id: z.string().uuid().optional(), companyId: z.string().uuid(), payrollEntryId: z.string().uuid(), employeeId: z.string().uuid(), baseSalary: z.coerce.number().min(0), earnings: z.coerce.number().min(0), deductions: z.coerce.number().min(0), notes: z.string().trim().max(1000).default("") });

async function syncTotals(supabase: any, entryId: string, companyId: string) {
  const { data, error } = await supabase.from("payroll_entry_items").select("base_salary, earnings, deductions, net_total").eq("payroll_entry_id", entryId).eq("company_id", companyId);
  if (error) throw new Error(error.message);
  const items = data ?? [];
  const gross = items.reduce((sum: number, item: any) => sum + Number(item.base_salary) + Number(item.earnings), 0);
  const deductions = items.reduce((sum: number, item: any) => sum + Number(item.deductions), 0);
  const net = items.reduce((sum: number, item: any) => sum + Number(item.net_total), 0);
  const { error: updateError } = await supabase.from("payroll_entries").update({ employees_count: items.length, gross_total: gross, deductions, net_total: net }).eq("id", entryId).eq("company_id", companyId);
  if (updateError) throw new Error(updateError.message);
}

export const listPayrollEntries = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.parse(input)).handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("payroll_entries").select("*").eq("company_id", data.companyId).order("reference_month", { ascending: false });
    if (error) throw new Error(error.message); return (rows ?? []) as PayrollEntry[];
  });
export const listPayrollItems = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid(), payrollEntryId: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("payroll_entry_items").select("*").eq("company_id", data.companyId).eq("payroll_entry_id", data.payrollEntryId).order("created_at");
    if (error) throw new Error(error.message); return (rows ?? []) as PayrollItem[];
  });
export const savePayrollEntry = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => entrySchema.parse(input)).handler(async ({ data, context }) => {
    const payload = { company_id: data.companyId, reference_month: data.referenceMonth, status: data.status };
    const query = data.id ? context.supabase.from("payroll_entries").update(payload).eq("id", data.id).eq("company_id", data.companyId) : context.supabase.from("payroll_entries").insert(payload);
    const { error } = await query; if (error) throw new Error(error.message); return { ok: true };
  });
export const savePayrollItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => itemSchema.parse(input)).handler(async ({ data, context }) => {
    const payload = { company_id: data.companyId, payroll_entry_id: data.payrollEntryId, employee_id: data.employeeId, base_salary: data.baseSalary, earnings: data.earnings, deductions: data.deductions, notes: data.notes };
    const query = data.id ? context.supabase.from("payroll_entry_items").update(payload).eq("id", data.id).eq("company_id", data.companyId) : context.supabase.from("payroll_entry_items").upsert(payload, { onConflict: "payroll_entry_id,employee_id" });
    const { error } = await query; if (error) throw new Error(error.message); await syncTotals(context.supabase, data.payrollEntryId, data.companyId); return { ok: true };
  });
export const deletePayrollItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), companyId: z.string().uuid(), payrollEntryId: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("payroll_entry_items").delete().eq("id", data.id).eq("company_id", data.companyId); if (error) throw new Error(error.message);
    await syncTotals(context.supabase, data.payrollEntryId, data.companyId); return { ok: true };
  });