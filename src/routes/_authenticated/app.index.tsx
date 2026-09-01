import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, Wallet, Sprout, Truck, ArrowRight, AlertTriangle } from "lucide-react";

import { useCompany } from "@/lib/company-context";
import { modules } from "@/lib/modules";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DeviTech ERP Agro" },
      {
        name: "description",
        content:
          "Painel central do ERP DeviTech: indicadores financeiros, produção, estoque e frota da empresa selecionada.",
      },
      { property: "og:title", content: "Dashboard — DeviTech ERP Agro" },
      {
        property: "og:description",
        content: "Visão consolidada de finanças, safra, estoque e frota no ERP modular DeviTech.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const kpis = [
  { label: "Receita da safra", value: "R$ 4,2M", delta: "+12,4%", icon: TrendingUp },
  { label: "Saldo em caixa", value: "R$ 812 mil", delta: "+3,1%", icon: Wallet },
  { label: "Área plantada", value: "1.240 ha", delta: "84% da meta", icon: Sprout },
  { label: "Diesel no mês", value: "18.320 L", delta: "-6,2%", icon: Truck },
];

function Dashboard() {
  const { company, isModuleEnabled } = useCompany();
  const shortcuts = modules.filter((m) => m.slug !== "dashboard" && isModuleEnabled(m.slug));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Visão geral</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{company.name}</h1>
        <p className="text-sm text-muted-foreground">
          {company.segment} • CNPJ {company.document}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <article key={k.label} className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{k.label}</span>
              <k.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-xl font-semibold">{k.value}</p>
            <p className="text-xs text-primary">{k.delta}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4 text-primary" /> Pendências
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>3 contas a pagar vencem nos próximos 5 dias</li>
          <li>Estoque de defensivo abaixo do mínimo em 2 depósitos</li>
          <li>Manutenção preventiva de 1 colheitadeira em atraso</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Módulos</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map((m) => (
            <Link
              key={m.slug}
              to={m.path}
              className="group rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur transition-colors hover:border-primary/50"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <m.icon className="h-5 w-5" />
                </span>
                <span className="flex-1 text-sm font-semibold">{m.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{m.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
