import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, Lock, Eye, EyeOff, Apple } from "lucide-react";

import logo from "@/assets/devitech-logo.png";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DeviTech — Login" },
      {
        name: "description",
        content:
          "Acesse sua conta DeviTech: tecnologia que impulsiona o campo, com login seguro para todos os sistemas da empresa.",
      },
      { property: "og:title", content: "DeviTech — Login" },
      {
        property: "og:description",
        content:
          "Acesse sua conta DeviTech: tecnologia que impulsiona o campo, com login seguro para todos os sistemas da empresa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.7l7.8 6.1C12.3 13.6 17.6 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7.1-10.2 7.1-17.6z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.2a14.6 14.6 0 0 1 0-8.4l-7.8-6.1a23.5 23.5 0 0 0 0 20.6l7.8-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 47.5c6.2 0 11.5-2 15.4-5.5l-7.6-5.9c-2.1 1.4-4.8 2.3-7.8 2.3-6.4 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.5 42.1 14.6 47.5 24 47.5z"
      />
    </svg>
  );
}

function Login() {
  const [showPassword, setShowPassword] = useState(false);

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
          <p className="mt-2 text-sm text-muted-foreground">
            Tecnologia que impulsiona o campo.
          </p>
        </div>

        <div className="mt-10 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Bem-vindo de volta!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Faça login para acessar sua conta
          </p>
        </div>

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <div className="field-shell">
            <User className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <input
              type="text"
              autoComplete="username"
              placeholder="E-mail ou CPF"
              aria-label="E-mail ou CPF"
              className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="field-shell">
            <Lock className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <input
              type={showPassword ? "text" : "password"}
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

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pt-1">
            <label className="flex min-w-0 items-center gap-3 text-sm text-foreground">
              <Checkbox className="h-5 w-5 shrink-0 rounded-md border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
              <span className="truncate">Lembrar-me</span>
            </label>
            <a
              href="#"
              className="text-sm text-primary transition-opacity hover:opacity-80"
            >
              Esqueci minha senha
            </a>
          </div>

          <Button type="submit" variant="glow" size="xl" className="w-full">
            Entrar
          </Button>
        </form>

        <div className="my-7 flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">ou continue com</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="social" size="lg">
            <GoogleIcon />
            Google
          </Button>
          <Button variant="social" size="lg">
            <Apple className="h-5 w-5" />
            Apple
          </Button>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Ainda não tem uma conta?{" "}
          <a href="#" className="text-primary transition-opacity hover:opacity-80">
            Criar conta
          </a>
        </p>
      </section>
    </main>
  );
}
