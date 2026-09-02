import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CostCenter = {
  id: string;
  company_id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const costCenterSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  name: z.string().trim().min(2, "Informe o nome do centro de custo.").max(160),
  description: z.string().trim().max(500).default(""),
  status: z.enum(["active", "inactive"]).default("active"),
});

/** Lista os centros de custo da empresa. */
export const listCostCenters = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("cost_centers")
      .select("*")
      .eq("company_id", data.companyId)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as CostCenter[];
  });

/** Cria ou atualiza um centro de custo. */
export const saveCostCenter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => costCenterSchema.parse(input))
  .handler(async ({ data, context }) => {
    const payload = {
      company_id: data.companyId,
      name: data.name,
      description: data.description,
      status: data.status,
    };
    const query = data.id
      ? context.supabase.from("cost_centers").update(payload).eq("id", data.id)
      : context.supabase.from("cost_centers").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Remove um centro de custo (os lançamentos ficam sem vínculo). */
export const deleteCostCenter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("cost_centers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
