import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SeasonReport = {
  season: {
    id: string;
    name: string;
    seasonYear: number;
    cropType: string;
    status: string;
    cultivatedArea: number;
    areaUnit: string;
    productionUnit: string;
  };
  production: {
    harvested: number;
    productivity: number;
    activityCost: number;
    harvestCost: number;
    operationalCost: number;
    costPerUnit: number;
  };
  financial: {
    billed: number;
    receivableOpen: number;
    received: number;
    payableOpen: number;
    paid: number;
    projectedBalance: number;
    realizedBalance: number;
  };
  harvestByMonth: { month: string; quantity: number }[];
  harvestByPicker: { name: string; quantity: number; amount: number }[];
  costsByType: { label: string; value: number }[];
};

export type SeasonComparison = {
  id: string;
  name: string;
  year: number;
  harvested: number;
  productivity: number;
  billed: number;
  received: number;
  paid: number;
  operationalCost: number;
  realizedBalance: number;
};

export type ReportsData = {
  report: SeasonReport;
  comparisons: SeasonComparison[];
};

const inputSchema = z.object({ companyId: z.string().uuid(), seasonId: z.string().uuid() });

export const getSeasonReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }): Promise<ReportsData> => {
    const { supabase } = context;
    const [seasonsResult, activitiesResult, harvestResult, entriesResult, salesResult] = await Promise.all([
      supabase.from("crop_seasons").select("*").eq("company_id", data.companyId).order("season_year", { ascending: false }),
      supabase.from("production_activities").select("season_id, kind, activity_date, total_cost").eq("company_id", data.companyId),
      supabase.from("harvest_records").select("season_id, harvested_at, picker_name, quantity, total_amount").eq("company_id", data.companyId),
      supabase.from("financial_entries").select("season_id, kind, category, amount, status, paid_at").eq("company_id", data.companyId),
      supabase.from("sales").select("season_id, total, status").eq("company_id", data.companyId),
    ]);
    for (const result of [seasonsResult, activitiesResult, harvestResult, entriesResult, salesResult]) {
      if (result.error) throw new Error(result.error.message);
    }

    const seasons = seasonsResult.data ?? [];
    const selected = seasons.find((season) => season.id === data.seasonId);
    if (!selected) throw new Error("Safra inválida para esta empresa.");
    const activities = activitiesResult.data ?? [];
    const harvests = harvestResult.data ?? [];
    const entries = entriesResult.data ?? [];
    const sales = salesResult.data ?? [];

    const summarize = (seasonId: string) => {
      const season = seasons.find((row) => row.id === seasonId);
      if (!season) return null;
      const seasonActivities = activities.filter((row) => row.season_id === seasonId);
      const seasonHarvests = harvests.filter((row) => row.season_id === seasonId);
      const seasonEntries = entries.filter((row) => row.season_id === seasonId && row.status !== "canceled");
      const seasonSales = sales.filter((row) => row.season_id === seasonId && row.status === "confirmed");
      const harvested = seasonHarvests.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
      const activityCost = seasonActivities.reduce((sum, row) => sum + Number(row.total_cost ?? 0), 0);
      const harvestCost = seasonHarvests.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
      const received = seasonEntries.filter((row) => row.kind === "receivable" && row.status === "paid").reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
      const paid = seasonEntries.filter((row) => row.kind === "payable" && row.status === "paid").reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
      const receivableOpen = seasonEntries.filter((row) => row.kind === "receivable" && row.status !== "paid").reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
      const payableOpen = seasonEntries.filter((row) => row.kind === "payable" && row.status !== "paid").reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
      const billed = seasonSales.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
      const operationalCost = activityCost + harvestCost;
      const area = Number(season.cultivated_area ?? 0);
      return {
        season,
        harvested,
        productivity: area > 0 ? harvested / area : 0,
        activityCost,
        harvestCost,
        operationalCost,
        costPerUnit: harvested > 0 ? operationalCost / harvested : 0,
        billed,
        received,
        paid,
        receivableOpen,
        payableOpen,
        projectedBalance: received + receivableOpen - paid - payableOpen,
        realizedBalance: received - paid,
      };
    };

    const summary = summarize(data.seasonId);
    if (!summary) throw new Error("Safra não encontrada.");
    const selectedHarvests = harvests.filter((row) => row.season_id === data.seasonId);
    const monthMap = new Map<string, number>();
    const pickerMap = new Map<string, { quantity: number; amount: number }>();
    for (const row of selectedHarvests) {
      const month = row.harvested_at.slice(0, 7);
      monthMap.set(month, (monthMap.get(month) ?? 0) + Number(row.quantity ?? 0));
      const name = row.picker_name || "Não informado";
      const current = pickerMap.get(name) ?? { quantity: 0, amount: 0 };
      current.quantity += Number(row.quantity ?? 0);
      current.amount += Number(row.total_amount ?? 0);
      pickerMap.set(name, current);
    }

    return {
      report: {
        season: {
          id: summary.season.id,
          name: summary.season.name,
          seasonYear: summary.season.season_year,
          cropType: summary.season.crop_type,
          status: summary.season.status,
          cultivatedArea: Number(summary.season.cultivated_area ?? 0),
          areaUnit: summary.season.area_unit,
          productionUnit: summary.season.production_unit,
        },
        production: {
          harvested: summary.harvested,
          productivity: summary.productivity,
          activityCost: summary.activityCost,
          harvestCost: summary.harvestCost,
          operationalCost: summary.operationalCost,
          costPerUnit: summary.costPerUnit,
        },
        financial: {
          billed: summary.billed,
          receivableOpen: summary.receivableOpen,
          received: summary.received,
          payableOpen: summary.payableOpen,
          paid: summary.paid,
          projectedBalance: summary.projectedBalance,
          realizedBalance: summary.realizedBalance,
        },
        harvestByMonth: [...monthMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, quantity]) => ({ month, quantity })),
        harvestByPicker: [...pickerMap.entries()].map(([name, value]) => ({ name, ...value })).sort((a, b) => b.quantity - a.quantity),
        costsByType: [
          { label: "Plantio e aplicações", value: summary.activityCost },
          { label: "Apanha e colheita", value: summary.harvestCost },
          { label: "Despesas financeiras pagas", value: summary.paid },
        ],
      },
      comparisons: seasons.map((season) => summarize(season.id)).filter((row) => row !== null).map((row) => ({
        id: row.season.id,
        name: row.season.name,
        year: row.season.season_year,
        harvested: row.harvested,
        productivity: row.productivity,
        billed: row.billed,
        received: row.received,
        paid: row.paid,
        operationalCost: row.operationalCost,
        realizedBalance: row.realizedBalance,
      })),
    };
  });