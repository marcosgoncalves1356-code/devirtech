import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "devitech_admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito ao administrador DeviTech.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/* ------------------------------- Empresas ------------------------------- */

export const listCompanies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context);
    const { data, error } = await admin.from("companies").select("*").order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(2),
        document: z.string().optional().default(""),
        segment: z.string().optional().default(""),
        status: z.enum(["active", "blocked"]).default("active"),
        enabledModules: z.array(z.string()).default([]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    const payload = {
      name: data.name,
      document: data.document,
      segment: data.segment,
      status: data.status,
      enabled_modules: data.enabledModules,
    };
    const query = data.id
      ? admin.from("companies").update(payload).eq("id", data.id)
      : admin.from("companies").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    const { data: members } = await admin.from("profiles").select("id").eq("company_id", data.id);
    for (const m of members ?? []) await admin.auth.admin.deleteUser(m.id);
    const { error } = await admin.from("companies").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------------------- Usuários ------------------------------- */

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context);
    const [{ data: profiles, error }, { data: roles }, { data: perms }, { data: companies }] =
      await Promise.all([
        admin.from("profiles").select("*").order("created_at"),
        admin.from("user_roles").select("user_id, role"),
        admin.from("user_module_permissions").select("user_id, module_slug, level"),
        admin.from("companies").select("id, name"),
      ]);
    if (error) throw new Error(error.message);
    return (profiles ?? []).map((p: any) => ({
      ...p,
      company_name: (companies ?? []).find((c: any) => c.id === p.company_id)?.name ?? null,
      role: (roles ?? []).find((r: any) => r.user_id === p.id)?.role ?? "operator",
      permissions: Object.fromEntries(
        (perms ?? []).filter((x: any) => x.user_id === p.id).map((x: any) => [x.module_slug, x.level]),
      ) as Record<string, string>,
    }));
  });

const userInput = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8).optional(),
  companyId: z.string().uuid().nullable().optional(),
  role: z.enum(["devitech_admin", "company_admin", "manager", "operator"]),
  status: z.enum(["active", "blocked"]).default("active"),
  permissions: z.record(z.string(), z.enum(["none", "view", "edit"])).default({}),
});

export const saveUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => userInput.parse(input))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    let userId = data.id;

    if (!userId) {
      if (!data.password) throw new Error("Defina uma senha inicial para o novo usuário.");
      const { data: created, error } = await admin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      });
      if (error) throw new Error(error.message);
      userId = created.user!.id;
      const { error: pErr } = await admin.from("profiles").insert({
        id: userId,
        email: data.email,
        full_name: data.fullName,
        company_id: data.companyId ?? null,
        status: data.status,
        must_change_password: true,
      });
      if (pErr) throw new Error(pErr.message);
    } else {
      const update: Record<string, unknown> = { email: data.email };
      if (data.password) update['password'] = data.password;
      const { error: aErr } = await admin.auth.admin.updateUserById(userId, {
        ...update,
        ban_duration: data.status === "blocked" ? "876000h" : "none",
      } as any);
      if (aErr) throw new Error(aErr.message);
      const { error: pErr } = await admin
        .from("profiles")
        .update({
          email: data.email,
          full_name: data.fullName,
          company_id: data.companyId ?? null,
          status: data.status,
          ...(data.password ? { must_change_password: true } : {}),
        })
        .eq("id", userId);
      if (pErr) throw new Error(pErr.message);
    }

    await admin.from("user_roles").delete().eq("user_id", userId);
    await admin.from("user_roles").insert({ user_id: userId, role: data.role });

    await admin.from("user_module_permissions").delete().eq("user_id", userId);
    const permRows = Object.entries(data.permissions).map(([module_slug, level]) => ({
      user_id: userId!,
      module_slug,
      level,
    }));
    if (permRows.length > 0) await admin.from("user_module_permissions").insert(permRows);

    await admin.from("access_logs").insert({
      user_id: context.userId,
      company_id: data.companyId ?? null,
      action: data.id ? "usuario_atualizado" : "usuario_criado",
      detail: data.email,
    });

    return { ok: true, userId };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), password: z.string().min(8) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    const { error } = await admin.auth.admin.updateUserById(data.id, { password: data.password });
    if (error) throw new Error(error.message);
    await admin.from("profiles").update({ must_change_password: true }).eq("id", data.id);
    await admin.from("access_logs").insert({
      user_id: context.userId,
      action: "senha_redefinida",
      detail: data.id,
    });
    return { ok: true };
  });

export const setUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["active", "blocked"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context);
    const { error } = await admin.auth.admin.updateUserById(data.id, {
      ban_duration: data.status === "blocked" ? "876000h" : "none",
    } as any);
    if (error) throw new Error(error.message);
    await admin.from("profiles").update({ status: data.status }).eq("id", data.id);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.id === context.userId) throw new Error("Você não pode excluir o próprio usuário.");
    const admin = await assertAdmin(context);
    const { error } = await admin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------------- Logs ---------------------------------- */

export const listAccessLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context);
    const { data, error } = await admin
      .from("access_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const logAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ action: z.string(), detail: z.string().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("company_id")
      .eq("id", context.userId)
      .maybeSingle();
    await context.supabase.from("access_logs").insert({
      user_id: context.userId,
      company_id: profile?.company_id ?? null,
      action: data.action,
      detail: data.detail ?? null,
    });
    return { ok: true };
  });
