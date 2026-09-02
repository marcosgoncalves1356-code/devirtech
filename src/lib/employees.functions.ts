import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Employee = {
  id: string;
  company_id: string;
  full_name: string;
  cpf: string;
  rg: string;
  birth_date: string | null;
  phone: string;
  email: string;
  address: string;
  job_title: string;
  department: string;
  contract_type: string;
  admission_date: string | null;
  termination_date: string | null;
  salary: number;
  allocation: string;
  notes: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

const employeeSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  fullName: z.string().trim().min(3, "Informe o nome completo do colaborador."),
  cpf: z.string().trim().max(20).default(""),
  rg: z.string().trim().max(30).default(""),
  birthDate: optionalDate,
  phone: z.string().trim().max(30).default(""),
  email: z.string().trim().max(160).default(""),
  address: z.string().trim().max(240).default(""),
  jobTitle: z.string().trim().max(120).default(""),
  department: z.string().trim().max(120).default(""),
  contractType: z.enum(["clt", "safrista", "temporario", "diarista", "estagio", "pj"]).default("clt"),
  admissionDate: optionalDate,
  terminationDate: optionalDate,
  salary: z.coerce.number().min(0).default(0),
  allocation: z.string().trim().max(160).default(""),
  notes: z.string().trim().max(1000).default(""),
  status: z.enum(["active", "inactive"]).default("active"),
});

/** Lista os colaboradores de uma empresa (RLS isola por empresa). */
export const listEmployees = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("employees")
      .select("*")
      .eq("company_id", data.companyId)
      .order("full_name");
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Employee[];
  });

/** Cria ou atualiza a ficha de um colaborador. */
export const saveEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => employeeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const payload = {
      company_id: data.companyId,
      full_name: data.fullName,
      cpf: data.cpf,
      rg: data.rg,
      birth_date: data.birthDate,
      phone: data.phone,
      email: data.email,
      address: data.address,
      job_title: data.jobTitle,
      department: data.department,
      contract_type: data.contractType,
      admission_date: data.admissionDate,
      termination_date: data.terminationDate,
      salary: data.salary,
      allocation: data.allocation,
      notes: data.notes,
      status: data.status,
    };

    const query = data.id
      ? context.supabase.from("employees").update(payload).eq("id", data.id)
      : context.supabase.from("employees").insert(payload);
    const { error } = await query;
    if (error) {
      if (error.code === "23505") throw new Error("Já existe um colaborador com esse CPF nesta empresa.");
      throw new Error(error.message);
    }
    return { ok: true };
  });

/** Remove a ficha de um colaborador. */
export const deleteEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("employees").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
