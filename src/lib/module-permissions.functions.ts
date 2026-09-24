import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ModulePermission = {
  id: string;
  profile_id: string;
  company_id: string;
  module_slug: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

export type SubmodulePermission = ModulePermission & { submodule_slug: string };

const actionsSchema = z.object({
  can_view: z.boolean(),
  can_create: z.boolean(),
  can_edit: z.boolean(),
  can_delete: z.boolean(),
});

/** Lista as permissões por módulo de um perfil (RLS isola por empresa). */
export const listModulePermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ profileId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("access_profile_permissions")
      .select("id, profile_id, company_id, module_slug, can_view, can_create, can_edit, can_delete")
      .eq("profile_id", data.profileId);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as ModulePermission[];
  });

/**
 * Define (upsert) a permissão de um módulo para um perfil.
 * Valida no backend: o perfil precisa existir, pertencer à empresa informada e o
 * módulo precisa estar habilitado para essa empresa.
 */
export const setModulePermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        profileId: z.string().uuid(),
        moduleSlug: z.string().trim().min(1),
        actions: actionsSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: profile, error: profileError } = await context.supabase
      .from("access_profiles")
      .select("id, company_id")
      .eq("id", data.profileId)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile) throw new Error("Perfil de acesso não encontrado.");

    const { data: company, error: companyError } = await context.supabase
      .from("companies")
      .select("enabled_modules")
      .eq("id", profile.company_id)
      .maybeSingle();
    if (companyError) throw new Error(companyError.message);
    if (!company) throw new Error("Empresa do perfil não encontrada.");
    if (!(company.enabled_modules ?? []).includes(data.moduleSlug)) {
      throw new Error("Este módulo não está habilitado para a empresa.");
    }

    const actions = data.actions;
    const anyAction = actions.can_view || actions.can_create || actions.can_edit || actions.can_delete;

    if (!anyAction) {
      const { error } = await context.supabase
        .from("access_profile_permissions")
        .delete()
        .eq("profile_id", data.profileId)
        .eq("module_slug", data.moduleSlug);
      if (error) throw new Error(error.message);
      return { ok: true, removed: true };
    }

    // Criar/editar/excluir sempre implicam poder visualizar o módulo.
    const { error } = await context.supabase.from("access_profile_permissions").upsert(
      {
        profile_id: data.profileId,
        company_id: profile.company_id,
        module_slug: data.moduleSlug,
        can_view: true,
        can_create: actions.can_create,
        can_edit: actions.can_edit,
        can_delete: actions.can_delete,
      },
      { onConflict: "profile_id,module_slug" },
    );
    if (error) throw new Error(error.message);
    return { ok: true, removed: false };
  });

/** Remove todas as permissões de módulo de um perfil. */
export const clearModulePermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ profileId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("access_profile_permissions")
      .delete()
      .eq("profile_id", data.profileId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSubmodulePermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ profileId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("access_profile_submodule_permissions")
      .select("id, profile_id, company_id, module_slug, submodule_slug, can_view, can_create, can_edit, can_delete")
      .eq("profile_id", data.profileId);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as SubmodulePermission[];
  });

export const setSubmodulePermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    profileId: z.string().uuid(), moduleSlug: z.string().trim().min(1), submoduleSlug: z.string().trim().min(3), actions: actionsSchema,
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: profile, error: profileError } = await context.supabase
      .from("access_profiles").select("id, company_id").eq("id", data.profileId).maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile) throw new Error("Perfil de acesso não encontrado.");
    const { data: company, error: companyError } = await context.supabase
      .from("companies").select("enabled_modules, enabled_submodules").eq("id", profile.company_id).maybeSingle();
    if (companyError) throw new Error(companyError.message);
    if (!company?.enabled_modules?.includes(data.moduleSlug) || !company.enabled_submodules?.includes(data.submoduleSlug)) {
      throw new Error("Este submódulo não está liberado para a empresa.");
    }
    const actions = data.actions;
    if (!actions.can_view && !actions.can_create && !actions.can_edit && !actions.can_delete) {
      const { error } = await context.supabase.from("access_profile_submodule_permissions").delete()
        .eq("profile_id", data.profileId).eq("submodule_slug", data.submoduleSlug);
      if (error) throw new Error(error.message);
      return { ok: true, removed: true };
    }
    const { error } = await context.supabase.from("access_profile_submodule_permissions").upsert({
      profile_id: data.profileId, company_id: profile.company_id, module_slug: data.moduleSlug,
      submodule_slug: data.submoduleSlug, can_view: true, can_create: actions.can_create,
      can_edit: actions.can_edit, can_delete: actions.can_delete,
    }, { onConflict: "profile_id,module_slug,submodule_slug" });
    if (error) throw new Error(error.message);
    return { ok: true, removed: false };
  });
