import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { UserRound, Lock, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";

import logo from "@/assets/devitech-logo.png";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { signInWithIdentifier } from "@/lib/auth.functions";


export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "DeviTech ERP — Acesso restrito" },
      {
        name: "description",
        content:
          "Portal de acesso do ERP DeviTech para o agronegócio. Uso exclusivo de usuários cadastrados pelo administrador.",
      },
      { property: "og:title", content: "DeviTech ERP — Acesso restrito" },
      {
        property: "og:description",
        content:
          "Portal de acesso do ERP DeviTech para o agronegócio. Uso exclusivo de usuários cadastrados pelo administrador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

const REMEMBER_KEY = "devitech.remember-identifier";

function Login() {
  const navigate = useNavigate();
  const signIn = useServerFn(signInWithIdentifier);
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setIdentifier(saved);
      setRemember(true);
    }
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn({ data: { identifier: identifier.trim(), password } });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
      });
      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (remember) window.localStorage.setItem(REMEMBER_KEY, identifier.trim());
      else window.localStorage.removeItem(REMEMBER_KEY);

      navigate({ to: "/app", replace: true });
    } catch {
      setError("Não foi possível entrar agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="tech-backdrop relative flex min-h-screen items-center justify-center px-4 py-10">
      <section className="auth-card w-full max-w-md rounded-3xl p-8 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <img
            src={logo}
            alt="Logo DeviTech"
            width={816}
            height={816}
            className="h-24 w-24 object-contain drop-shadow-[0_0_24px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
          />
          <h1 className="mt-3 text-5xl font-bold tracking-tight">
            <span className="text-foreground">Devi</span>
            <span className="text-primary">Tech</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">ERP do agronegócio • acesso restrito</p>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Bem-vindo de volta!</h2>
          <p className="mt-1 text-sm text-muted-foreground">Entre com as credenciais fornecidas pelo administrador</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="field-shell">
            <Mail className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder="E-mail corporativo"
              aria-label="E-mail"
              className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="field-shell">
            <Lock className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Senha"
              aria-label="Senha"
              className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <label className="flex items-center gap-3 pt-1 text-sm text-foreground">
            <Checkbox
              checked={remember}
              onCheckedChange={(v) => setRemember(v === true)}
              className="h-5 w-5 shrink-0 !rounded-md border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <span className="truncate">Lembrar meu e-mail</span>
          </label>

          {error ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
              {error}
            </p>
          ) : null}

          <Button type="submit" variant="glow" size="xl" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
          </Button>
        </form>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border/60 bg-secondary/40 p-4 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Plataforma privada: não há cadastro público. Novos usuários são criados pelo administrador DeviTech e
            vinculados a uma empresa. Esqueceu a senha? Solicite a redefinição ao administrador.
          </p>
        </div>
      </section>
    </main>
  );
}
