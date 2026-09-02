import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AccessProfile = {
  id: string;
  company_id: string;
  name: string;
  description: string;
  status: "active" | "blocked";
  permissions: Record<string, string>;
  created_at: string;
  updated_at: string;
};

/** Lista os perfis de acesso de uma empresa (RLS garante o isolamento). */
export const listAccessProfiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("access_profiles")
      .select("*")
      .eq("company_id", data.companyId)
      .order("name");
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as AccessProfile[];
  });

/** Cria ou atualiza um perfil de acesso (somente administrador DeviTech, via RLS). */
export const saveAccessProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        companyId: z.string().uuid(),
        name: z.string().trim().min(2, "Informe um nome de perfil com ao menos 2 caracteres."),
        description: z.string().trim().max(240).default(""),
        status: z.enum(["active", "blocked"]).default("active"),
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
    const query = data.id
      ? context.supabase.from("access_profiles").update(payload).eq("id", data.id)
      : context.supabase.from("access_profiles").insert(payload);
    const { error } = await query;
    if (error) {
      if (error.code === "23505") throw new Error("Já existe um perfil com esse nome nesta empresa.");
      throw new Error(error.message);
    }
    return { ok: true };
  });

/** Ativa ou desativa um perfil de acesso. */
export const setAccessProfileStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["active", "blocked"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("access_profiles")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Exclui um perfil de acesso. */
export const deleteAccessProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("access_profiles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
