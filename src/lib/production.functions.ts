import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CropSeason = {
  id: string;
  company_id: string;
  property_id: string | null;
  field_id: string | null;
  name: string;
  season_year: number;
  start_date: string | null;
  end_date: string | null;
  crop_type: string;
  terrain_type: string;
  cultivated_area: number;
  area_unit: string;
  production_unit: string;
  pick_rate: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type ProductionActivity = {
  id: string;
  company_id: string;
  season_id: string;
  kind: "planting" | "application";
  activity_date: string;
  description: string;
  inventory_item_id: string | null;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  employee_id: string | null;
  notes: string;
};

export type HarvestRecord = {
  id: string;
  company_id: string;
  season_id: string;
  harvested_at: string;
  employee_id: string | null;
  picker_name: string;
  quantity: number;
  unit_rate: number;
  total_amount: number;
  notes: string;
};

const companyInput = z.object({ companyId: z.string().uuid() });

const seasonSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  /** Vínculos preparados para o módulo Propriedades Rurais (ainda opcionais). */
  propertyId: z.string().uuid().nullable().default(null),
  fieldId: z.string().uuid().nullable().default(null),
  name: z.string().trim().min(2, "Informe o nome da safra.").max(160),
  seasonYear: z.coerce.number().int().min(1900).max(2200),
  startDate: z.string().trim().min(1).nullable().default(null),
  endDate: z.string().trim().min(1).nullable().default(null),
  cropType: z.string().trim().min(2, "Informe o tipo de cultivo.").max(80),
  terrainType: z.string().trim().max(80).default(""),
  cultivatedArea: z.coerce.number().min(0).default(0),
  areaUnit: z.string().trim().max(20).default("ha"),
  productionUnit: z.string().trim().min(1).max(20).default("saca"),
  pickRate: z.coerce.number().min(0).default(0),
  status: z.enum(["planned", "active", "harvesting", "closed"]).default("planned"),
  notes: z.string().trim().max(1000).default(""),
});

const activitySchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  seasonId: z.string().uuid(),
  kind: z.enum(["planting", "application"]),
  activityDate: z.string().trim().min(1, "Informe a data."),
  description: z.string().trim().min(2, "Informe a descrição.").max(300),
  inventoryItemId: z.string().uuid().nullable().default(null),
  quantity: z.coerce.number().min(0).default(0),
  unit: z.string().trim().max(20).default(""),
  unitCost: z.coerce.number().min(0).default(0),
  employeeId: z.string().uuid().nullable().default(null),
  notes: z.string().trim().max(1000).default(""),
});

const harvestSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  seasonId: z.string().uuid(),
  harvestedAt: z.string().trim().min(1, "Informe a data da colheita."),
  employeeId: z.string().uuid().nullable().default(null),
  pickerName: z.string().trim().max(160).default(""),
  quantity: z.coerce.number().gt(0, "Informe a quantidade colhida."),
  notes: z.string().trim().max(1000).default(""),
});

async function assertSeason(
  supabase: { from: (t: string) => any },
  seasonId: string,
  companyId: string,
): Promise<CropSeason> {
  const { data, error } = await supabase.from("crop_seasons").select("*").eq("id", seasonId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.company_id !== companyId) throw new Error("Safra inválida para esta empresa.");
  return data as CropSeason;
}

/** Lista as safras da empresa. */
export const listCropSeasons = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("crop_seasons")
      .select("*")
      .eq("company_id", data.companyId)
      .order("season_year", { ascending: false })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as CropSeason[];
  });

/** Cria ou atualiza uma safra. */
export const saveCropSeason = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => seasonSchema.parse(input))
  .handler(async ({ data, context }) => {
    const payload = {
      company_id: data.companyId,
      property_id: data.propertyId,
      field_id: data.fieldId,
      name: data.name,
      season_year: data.seasonYear,
      start_date: data.startDate,
      end_date: data.endDate,
      crop_type: data.cropType,
      terrain_type: data.terrainType,
      cultivated_area: data.cultivatedArea,
      area_unit: data.areaUnit,
      production_unit: data.productionUnit,
      pick_rate: data.pickRate,
      status: data.status,
      notes: data.notes,
      created_by: context.userId,
    };
    const query = data.id
      ? context.supabase.from("crop_seasons").update(payload).eq("id", data.id)
      : context.supabase.from("crop_seasons").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);

    if (data.id) {
      // O valor da apanha é único por safra: replica em todos os registros de colheita.
      const { error: syncError } = await context.supabase
        .from("harvest_records")
        .update({ unit_rate: data.pickRate })
        .eq("season_id", data.id);
      if (syncError) throw new Error(syncError.message);
      const { data: records } = await context.supabase
        .from("harvest_records")
        .select("id, quantity")
        .eq("season_id", data.id);
      for (const row of (records ?? []) as { id: string; quantity: number }[]) {
        await context.supabase
          .from("harvest_records")
          .update({ total_amount: Number(row.quantity) * data.pickRate })
          .eq("id", row.id);
      }
    }
    return { ok: true };
  });

/** Exclui uma safra e seus lançamentos vinculados. */
export const deleteCropSeason = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("crop_seasons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Lista plantios e aplicações da empresa. */
export const listProductionActivities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("production_activities")
      .select("*")
      .eq("company_id", data.companyId)
      .order("activity_date", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as ProductionActivity[];
  });

/** Cria ou atualiza um plantio/aplicação. */
export const saveProductionActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => activitySchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSeason(context.supabase as never, data.seasonId, data.companyId);
    const payload = {
      company_id: data.companyId,
      season_id: data.seasonId,
      kind: data.kind,
      activity_date: data.activityDate,
      description: data.description,
      inventory_item_id: data.inventoryItemId,
      quantity: data.quantity,
      unit: data.unit,
      unit_cost: data.unitCost,
      total_cost: data.quantity * data.unitCost,
      employee_id: data.employeeId,
      notes: data.notes,
      created_by: context.userId,
    };
    const query = data.id
      ? context.supabase.from("production_activities").update(payload).eq("id", data.id)
      : context.supabase.from("production_activities").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Exclui um plantio/aplicação. */
export const deleteProductionActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("production_activities").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Lista registros de colheita da empresa. */
export const listHarvestRecords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("harvest_records")
      .select("*")
      .eq("company_id", data.companyId)
      .order("harvested_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as HarvestRecord[];
  });

/** Cria ou atualiza um registro de colheita usando o valor da apanha da safra. */
export const saveHarvestRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => harvestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const season = await assertSeason(context.supabase as never, data.seasonId, data.companyId);
    const rate = Number(season.pick_rate ?? 0);
    if (!data.employeeId && data.pickerName.length < 2) {
      throw new Error("Informe o apanhador responsável pela colheita.");
    }
    const payload = {
      company_id: data.companyId,
      season_id: data.seasonId,
      harvested_at: data.harvestedAt,
      employee_id: data.employeeId,
      picker_name: data.pickerName,
      quantity: data.quantity,
      unit_rate: rate,
      total_amount: data.quantity * rate,
      notes: data.notes,
      created_by: context.userId,
    };
    const query = data.id
      ? context.supabase.from("harvest_records").update(payload).eq("id", data.id)
      : context.supabase.from("harvest_records").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Exclui um registro de colheita. */
export const deleteHarvestRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("harvest_records").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
