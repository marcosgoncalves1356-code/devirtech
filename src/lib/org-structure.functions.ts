import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Department = {
  id: string;
  company_id: string;
  name: string;
  description: string;
  status: string;
};

export type JobPosition = {
  id: string;
  company_id: string;
  department_id: string | null;
  name: string;
  description: string;
  status: string;
};

const companyInput = z.object({ companyId: z.string().uuid() });

/** Lista os departamentos da empresa (RLS isola por empresa). */
export const listDepartments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("departments")
      .select("id, company_id, name, description, status")
      .eq("company_id", data.companyId)
      .order("name");
    if (error) throw new Error(error.message);
    return (rows ?? []) as Department[];
  });

/** Cria ou atualiza um departamento da empresa. */
export const saveDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        companyId: z.string().uuid(),
        name: z.string().trim().min(2, "Informe o nome do departamento."),
        description: z.string().trim().default(""),
        status: z.enum(["active", "inactive"]).default("active"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const payload = {
      company_id: data.companyId,
      name: data.name,
      description: data.description,
      status: data.status,
    };
    if (data.id) {
      const { error } = await context.supabase.from("departments").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("departments").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

/** Remove um departamento da empresa. */
export const deleteDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("departments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Lista os cargos da empresa. */
export const listJobPositions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companyInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("job_positions")
      .select("id, company_id, department_id, name, description, status")
      .eq("company_id", data.companyId)
      .order("name");
    if (error) throw new Error(error.message);
    return (rows ?? []) as JobPosition[];
  });

/** Cria ou atualiza um cargo da empresa. */
export const saveJobPosition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        companyId: z.string().uuid(),
        departmentId: z.string().uuid().nullable().default(null),
        name: z.string().trim().min(2, "Informe o nome do cargo."),
        description: z.string().trim().default(""),
        status: z.enum(["active", "inactive"]).default("active"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.departmentId) {
      const { data: dep, error: depError } = await context.supabase
        .from("departments")
        .select("id")
        .eq("id", data.departmentId)
        .eq("company_id", data.companyId)
        .maybeSingle();
      if (depError) throw new Error(depError.message);
      if (!dep) throw new Error("Departamento não encontrado nesta empresa.");
    }

    const payload = {
      company_id: data.companyId,
      department_id: data.departmentId,
      name: data.name,
      description: data.description,
      status: data.status,
    };
    if (data.id) {
      const { error } = await context.supabase.from("job_positions").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("job_positions").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

/** Remove um cargo da empresa. */
export const deleteJobPosition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("job_positions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
