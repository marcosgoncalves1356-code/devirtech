import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company-context";
import { markPasswordChanged } from "@/lib/session.functions";

export const Route = createFileRoute("/_authenticated/app/alterar-senha")({
  head: () => ({
    meta: [
      { title: "Alterar senha — DeviTech ERP" },
      { name: "description", content: "Defina uma nova senha pessoal para acessar o ERP DeviTech." },
      { property: "og:title", content: "Alterar senha — DeviTech ERP" },
      { property: "og:description", content: "Defina uma nova senha pessoal para acessar o ERP DeviTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChangePassword,
});

function ChangePassword() {
  const { session, refresh } = useCompany();
  const confirmChange = useServerFn(markPasswordChanged);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ type: "error" | "ok"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setStatus({ type: "error", text: "A senha deve ter ao menos 8 caracteres." });
    if (password !== confirm) return setStatus({ type: "error", text: "As senhas não conferem." });

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      return setStatus({ type: "error", text: error.message });
    }
    await confirmChange({ data: undefined });
    refresh();
    setLoading(false);
    setStatus({ type: "ok", text: "Senha alterada com sucesso." });
    setTimeout(() => navigate({ to: "/app" }), 900);
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <header className="flex items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <KeyRound className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alterar senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {session?.mustChangePassword
              ? "Seu acesso foi criado com uma senha temporária. Defina uma senha pessoal para continuar."
              : "Defina uma nova senha pessoal de acesso."}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="field-shell">
          <Lock className="h-5 w-5 shrink-0 text-primary" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nova senha"
            aria-label="Nova senha"
            autoComplete="new-password"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="field-shell">
          <Lock className="h-5 w-5 shrink-0 text-primary" />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirmar nova senha"
            aria-label="Confirmar nova senha"
            autoComplete="new-password"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </div>

        {status ? (
          <p
            className={
              status.type === "error"
                ? "rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
                : "rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary"
            }
          >
            {status.text}
          </p>
        ) : null}

        <Button type="submit" variant="glow" size="xl" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar nova senha"}
        </Button>
      </form>
    </div>
  );
}
