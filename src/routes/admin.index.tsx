import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Users, Blocks, LifeBuoy, ArrowRight } from "lucide-react";

import { demoCompanies } from "@/lib/company-context";
import { modules } from "@/lib/modules";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — DeviTech" },
      {
        name: "description",
        content:
          "Área administrativa DeviTech: gestão de empresas clientes, usuários, módulos, acessos e suporte do ERP agro.",
      },
      { property: "og:title", content: "Painel administrativo — DeviTech" },
      {
        property: "og:description",
        content: "Gerencie empresas, usuários, módulos e suporte da plataforma ERP DeviTech.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  const stats = [
    { label: "Empresas ativas", value: String(demoCompanies.length), icon: Building2, to: "/admin/empresas" },
    { label: "Usuários da plataforma", value: "27", icon: Users, to: "/admin/usuarios" },
    { label: "Módulos disponíveis", value: String(modules.length), icon: Blocks, to: "/admin/modulos" },
    { label: "Chamados abertos", value: "4", icon: LifeBuoy, to: "/admin/suporte" },
  ] as const;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Administração DeviTech</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Painel da plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Controle central de empresas clientes, liberação de módulos, acessos e suporte.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="group rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur transition-colors hover:border-primary/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-semibold">{s.value}</p>
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
              Gerenciar <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur">
        <h2 className="text-sm font-semibold">Atividade recente</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Agro Vale Verde habilitou o módulo Folha de pagamento</li>
          <li>Novo usuário administrador criado em Café Serra Alta</li>
          <li>Chamado #1042 aguardando resposta do suporte</li>
        </ul>
      </section>
    </div>
  );
}
