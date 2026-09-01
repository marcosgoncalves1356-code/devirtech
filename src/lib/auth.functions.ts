import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GENERIC_ERROR = "Usuário/e-mail ou senha inválidos. Se você não tem acesso, fale com o administrador DeviTech.";

export type SignInResult =
  | { ok: true; accessToken: string; refreshToken: string }
  | { ok: false; message: string };

export const signInWithIdentifier = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ identifier: z.string().min(1).max(255), password: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }): Promise<SignInResult> => {
    const identifier = data.identifier.trim();
    let email = identifier.toLowerCase();

    if (!identifier.includes("@")) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .ilike("username", identifier)
        .maybeSingle();
      if (!profile?.email) return { ok: false, message: GENERIC_ERROR };
      email = profile.email.toLowerCase();
    }

    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'] ?? process.env['SUPABASE_ANON_KEY']!;
    const client = createClient(process.env['SUPABASE_URL']!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: session, error } = await client.auth.signInWithPassword({ email, password: data.password });
    if (error || !session.session) return { ok: false, message: GENERIC_ERROR };

    return {
      ok: true,
      accessToken: session.session.access_token,
      refreshToken: session.session.refresh_token,
    };
  });
