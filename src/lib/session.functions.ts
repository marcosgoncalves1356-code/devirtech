import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SessionCompany = {
  id: string;
  name: string;
  document: string | null;
  segment: string | null;
  status: "active" | "blocked";
  enabledModules: string[];
  logoUrl: string;
};

export type SessionContext = {
  userId: string;
  email: string;
  fullName: string;
  status: "active" | "blocked";
  mustChangePassword: boolean;
  welcomeSeen: boolean;
  isAdmin: boolean;
  roles: string[];
  companyId: string | null;
  companies: SessionCompany[];
  permissions: Record<string, "none" | "view" | "edit">;
};

export const getSessionContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SessionContext> => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: roleRows }, { data: permRows }] = await Promise.all([
      supabase
        .from("profiles")
        .select("company_id, full_name, email, status, must_change_password, welcome_seen_at")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("user_module_permissions").select("module_slug, level").eq("user_id", userId),
    ]);

    const roles = (roleRows ?? []).map((r) => r.role as string);
    const isAdmin = roles.includes("devitech_admin");

    const { data: companyRows } = await supabase
      .from("companies")
      .select("id, name, document, segment, status, enabled_modules, logo_url")
      .order("name");

    const companies: SessionCompany[] = (companyRows ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      document: c.document,
      segment: c.segment,
      status: c.status as "active" | "blocked",
      enabledModules: c.enabled_modules ?? [],
      logoUrl: c.logo_url ?? "",
    }));

    const permissions: Record<string, "none" | "view" | "edit"> = {};
    for (const p of permRows ?? []) permissions[p.module_slug] = p.level as "none" | "view" | "edit";

    return {
      userId,
      email: profile?.email ?? "",
      fullName: profile?.full_name ?? "",
      status: (profile?.status as "active" | "blocked") ?? "active",
      mustChangePassword: profile?.must_change_password ?? false,
      welcomeSeen: Boolean(profile?.welcome_seen_at),
      isAdmin,
      roles,
      companyId: profile?.company_id ?? null,
      companies,
      permissions,
    };
  });

export const markPasswordChanged = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markWelcomeSeen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ welcome_seen_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
