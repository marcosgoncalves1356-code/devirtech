import { createServerFn } from "@tanstack/react-start";

import { modules } from "@/lib/modules";

/**
 * Cria o acesso temporário do administrador DeviTech no primeiro uso.
 * Só executa enquanto não existir NENHUM usuário com papel devitech_admin.
 */
export const bootstrapAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: existing, error: checkError } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("role", "devitech_admin")
    .limit(1);
  if (checkError) throw new Error(checkError.message);
  if ((existing ?? []).length > 0) return { created: false as const };

  const email = "admin@devitech.com.br";
  const password = "DeviTech@2026";

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(error.message);
  const userId = created.user!.id;

  const { error: pErr } = await supabaseAdmin.from("profiles").insert({
    id: userId,
    email,
    full_name: "Administrador DeviTech",
    company_id: null,
    status: "active",
    must_change_password: true,
  });
  if (pErr) throw new Error(pErr.message);

  await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "devitech_admin" });
  await supabaseAdmin.from("user_module_permissions").insert(
    modules.map((m) => ({ user_id: userId, module_slug: m.slug, level: "edit" as const })),
  );
  await supabaseAdmin.from("access_logs").insert({
    user_id: userId,
    action: "admin_bootstrap",
    detail: email,
  });

  return { created: true as const, email };
});
