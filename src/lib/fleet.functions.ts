import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FleetAsset = {
  id: string; company_id: string; name: string; code: string; kind: string; plate: string;
  meter_unit: string; initial_meter: number; status: "active" | "inactive"; notes: string;
};

export type FleetFuelRecord = {
  id: string; company_id: string; asset_id: string; recorded_at: string; meter: number;
  liters: number; unit_price: number; total: number; full_tank: boolean; supplier: string;
  property_id: string | null; cost_center_id: string | null; season_id: string | null; notes: string;
};

export type FleetMaintenanceRecord = {
  id: string; company_id: string; asset_id: string; description: string; scheduled_at: string;
  completed_at: string | null; meter: number; next_meter: number | null; amount: number;
  status: "scheduled" | "completed" | "canceled"; supplier: string;
  property_id: string | null; cost_center_id: string | null; season_id: string | null; notes: string;
};

const companySchema = z.object({ companyId: z.string().uuid() });
const optionalUuid = z.string().uuid().nullable().optional();

const assetSchema = z.object({
  id: z.string().uuid().optional(), companyId: z.string().uuid(),
  name: z.string().trim().min(2).max(160), code: z.string().trim().max(40).default(""),
  kind: z.string().trim().min(1).max(60).default("vehicle"), plate: z.string().trim().max(12).default(""),
  meterUnit: z.string().trim().min(1).max(10).default("km"), initialMeter: z.coerce.number().min(0).default(0),
  status: z.enum(["active", "inactive"]), notes: z.string().trim().max(1000).default(""),
});

const fuelSchema = z.object({
  id: z.string().uuid().optional(), companyId: z.string().uuid(), assetId: z.string().uuid(),
  recordedAt: z.string().min(8), meter: z.coerce.number().min(0).default(0),
  liters: z.coerce.number().positive(), unitPrice: z.coerce.number().min(0).default(0),
  fullTank: z.boolean().default(true), supplier: z.string().trim().max(160).default(""),
  propertyId: optionalUuid, costCenterId: optionalUuid, seasonId: optionalUuid,
  notes: z.string().trim().max(1000).default(""),
});

const maintenanceSchema = z.object({
  id: z.string().uuid().optional(), companyId: z.string().uuid(), assetId: z.string().uuid(),
  description: z.string().trim().min(2).max(240), scheduledAt: z.string().min(8),
  completedAt: z.string().nullable().optional(), meter: z.coerce.number().min(0).default(0),
  nextMeter: z.coerce.number().min(0).nullable().optional(), amount: z.coerce.number().min(0).default(0),
  status: z.enum(["scheduled", "completed", "canceled"]), supplier: z.string().trim().max(160).default(""),
  propertyId: optionalUuid, costCenterId: optionalUuid, seasonId: optionalUuid,
  notes: z.string().trim().max(1000).default(""),
});

export const listFleetAssets = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.parse(input)).handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("fleet_assets").select("*").eq("company_id", data.companyId).order("name");
    if (error) throw new Error(error.message);
    return (rows ?? []) as FleetAsset[];
  });

export const saveFleetAsset = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => assetSchema.parse(input)).handler(async ({ data, context }) => {
    const payload = { company_id: data.companyId, name: data.name, code: data.code, kind: data.kind, plate: data.plate.toUpperCase(),
      meter_unit: data.meterUnit, initial_meter: data.initialMeter, status: data.status, notes: data.notes };
    const query = data.id ? context.supabase.from("fleet_assets").update(payload).eq("id", data.id).eq("company_id", data.companyId)
      : context.supabase.from("fleet_assets").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.code === "23505" ? "Já existe um veículo com este código." : error.message);
    return { ok: true };
  });

export const deleteFleetAsset = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("fleet_assets").delete().eq("id", data.id).eq("company_id", data.companyId);
    if (error) throw new Error(error.code === "23503" ? "Este veículo possui abastecimentos ou manutenções e não pode ser excluído." : error.message);
    return { ok: true };
  });

export const listFleetFuelRecords = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.parse(input)).handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("fleet_fuel_records").select("*").eq("company_id", data.companyId).order("recorded_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as FleetFuelRecord[];
  });

export const saveFleetFuelRecord = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => fuelSchema.parse(input)).handler(async ({ data, context }) => {
    const payload = { company_id: data.companyId, asset_id: data.assetId, recorded_at: data.recordedAt, meter: data.meter,
      liters: data.liters, unit_price: data.unitPrice, full_tank: data.fullTank, supplier: data.supplier,
      property_id: data.propertyId ?? null, cost_center_id: data.costCenterId ?? null, season_id: data.seasonId ?? null, notes: data.notes };
    const query = data.id ? context.supabase.from("fleet_fuel_records").update(payload).eq("id", data.id).eq("company_id", data.companyId)
      : context.supabase.from("fleet_fuel_records").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFleetFuelRecord = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("fleet_fuel_records").delete().eq("id", data.id).eq("company_id", data.companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listFleetMaintenanceRecords = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.parse(input)).handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("fleet_maintenance_records").select("*").eq("company_id", data.companyId).order("scheduled_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as FleetMaintenanceRecord[];
  });

export const saveFleetMaintenanceRecord = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => maintenanceSchema.parse(input)).handler(async ({ data, context }) => {
    const payload = { company_id: data.companyId, asset_id: data.assetId, description: data.description,
      scheduled_at: data.scheduledAt, completed_at: data.completedAt || null, meter: data.meter,
      next_meter: data.nextMeter ?? null, amount: data.amount, status: data.status, supplier: data.supplier,
      property_id: data.propertyId ?? null, cost_center_id: data.costCenterId ?? null, season_id: data.seasonId ?? null, notes: data.notes };
    const query = data.id ? context.supabase.from("fleet_maintenance_records").update(payload).eq("id", data.id).eq("company_id", data.companyId)
      : context.supabase.from("fleet_maintenance_records").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFleetMaintenanceRecord = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("fleet_maintenance_records").delete().eq("id", data.id).eq("company_id", data.companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
