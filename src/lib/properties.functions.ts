import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RuralProperty = {
  id: string; company_id: string; name: string; document: string; registry_number: string;
  total_area: number; area_unit: string; city: string; state: string; address: string;
  status: "active" | "inactive"; notes: string;
};

export type PropertyField = {
  id: string; company_id: string; property_id: string; name: string; registry_number: string;
  area: number; area_unit: string; crop_type: string; status: "active" | "inactive"; notes: string;
};

const companySchema = z.object({ companyId: z.string().uuid() });
const propertySchema = z.object({
  id: z.string().uuid().optional(), companyId: z.string().uuid(), name: z.string().trim().min(2).max(160),
  document: z.string().trim().max(30).default(""), registryNumber: z.string().trim().max(80).default(""),
  totalArea: z.coerce.number().min(0).default(0), areaUnit: z.string().trim().min(1).max(20).default("ha"),
  city: z.string().trim().max(120).default(""), state: z.string().trim().max(2).default(""),
  address: z.string().trim().max(240).default(""), status: z.enum(["active", "inactive"]),
  notes: z.string().trim().max(1000).default(""),
});
const fieldSchema = z.object({
  id: z.string().uuid().optional(), companyId: z.string().uuid(), propertyId: z.string().uuid(),
  name: z.string().trim().min(1).max(160), registryNumber: z.string().trim().max(80).default(""),
  area: z.coerce.number().min(0).default(0), areaUnit: z.string().trim().min(1).max(20).default("ha"),
  cropType: z.string().trim().max(80).default(""), status: z.enum(["active", "inactive"]),
  notes: z.string().trim().max(1000).default(""),
});

export const listRuralProperties = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.parse(input)).handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("rural_properties").select("*").eq("company_id", data.companyId).order("name");
    if (error) throw new Error(error.message);
    return (rows ?? []) as RuralProperty[];
  });

export const saveRuralProperty = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => propertySchema.parse(input)).handler(async ({ data, context }) => {
    const payload = { company_id: data.companyId, name: data.name, document: data.document, registry_number: data.registryNumber,
      total_area: data.totalArea, area_unit: data.areaUnit, city: data.city, state: data.state.toUpperCase(), address: data.address,
      status: data.status, notes: data.notes };
    const query = data.id ? context.supabase.from("rural_properties").update(payload).eq("id", data.id).eq("company_id", data.companyId)
      : context.supabase.from("rural_properties").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.code === "23505" ? "Já existe uma propriedade com este nome." : error.message);
    return { ok: true };
  });

export const deleteRuralProperty = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("rural_properties").delete().eq("id", data.id).eq("company_id", data.companyId);
    if (error) throw new Error(error.code === "23503" ? "A propriedade possui talhões ou safras vinculados e não pode ser excluída." : error.message);
    return { ok: true };
  });

export const listPropertyFields = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.parse(input)).handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("property_fields").select("*").eq("company_id", data.companyId).order("name");
    if (error) throw new Error(error.message);
    return (rows ?? []) as PropertyField[];
  });

export const savePropertyField = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => fieldSchema.parse(input)).handler(async ({ data, context }) => {
    const payload = { company_id: data.companyId, property_id: data.propertyId, name: data.name, registry_number: data.registryNumber,
      area: data.area, area_unit: data.areaUnit, crop_type: data.cropType, status: data.status, notes: data.notes };
    const query = data.id ? context.supabase.from("property_fields").update(payload).eq("id", data.id).eq("company_id", data.companyId)
      : context.supabase.from("property_fields").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.code === "23505" ? "Já existe um talhão com este nome nesta propriedade." : error.message);
    return { ok: true };
  });

export const deletePropertyField = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("property_fields").delete().eq("id", data.id).eq("company_id", data.companyId);
    if (error) throw new Error(error.code === "23503" ? "Este talhão está vinculado a uma safra e não pode ser excluído." : error.message);
    return { ok: true };
  });