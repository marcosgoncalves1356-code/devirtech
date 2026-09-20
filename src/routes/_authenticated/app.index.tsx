import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingCart,
  Package,
  Users,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  AlertTriangle,
  Percent,
  Receipt,
  Building2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useCompany } from "@/lib/company-context";
import { greetingFor } from "@/components/welcome-screen";
import { modules } from "@/lib/modules";
import { getDashboardData, type DashboardData } from "@/lib/dashboard.functions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardPeriodFilter,
  DEFAULT_PERIOD,
  periodLabel,
  resolvePeriod,
  type PeriodFilter,
} from "@/components/dashboard-period-filter";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DeviTech ERP Agro" },
      {
        name: "description",
        content:
          "Painel central do ERP DeviTech: faturamento, despesas, saldo, contas a pagar e receber, vendas, compras, estoque e folha.",
      },
      { property: "og:title", content: "Dashboard — DeviTech ERP Agro" },
      {
        property: "og:description",
        content: "Visão financeira e operacional consolidada da empresa no ERP modular DeviTech.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);
const brlFull = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const PIE_COLORS = ["#34d399", "#38bdf8", "#a78bfa", "#fbbf24", "#f472b6", "#22d3ee"];

const chartTooltip = {
  contentStyle: {
    background: "oklch(0.24 0.02 200 / 0.96)",
    border: "1px solid oklch(0.48 0.04 200 / 0.6)",
    borderRadius: "0.9rem",
    fontSize: "0.75rem",
    color: "#f1f5f9",
  },
  labelStyle: { color: "#cbd5e1" },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-border/50 bg-card/80 p-5 shadow-lg shadow-black/10 backdrop-blur ${className}`}
    >
      {children}
    </section>
  );
}

const ACCENTS = {
  emerald: { icon: "text-emerald-300", chip: "bg-emerald-400/15", ring: "hover:border-emerald-300/50", bar: "from-emerald-400/70 to-emerald-200/10" },
  sky: { icon: "text-sky-300", chip: "bg-sky-400/15", ring: "hover:border-sky-300/50", bar: "from-sky-400/70 to-sky-200/10" },
  violet: { icon: "text-violet-300", chip: "bg-violet-400/15", ring: "hover:border-violet-300/50", bar: "from-violet-400/70 to-violet-200/10" },
  amber: { icon: "text-amber-300", chip: "bg-amber-400/15", ring: "hover:border-amber-300/50", bar: "from-amber-400/70 to-amber-200/10" },
  rose: { icon: "text-rose-300", chip: "bg-rose-400/15", ring: "hover:border-rose-300/50", bar: "from-rose-400/70 to-rose-200/10" },
  cyan: { icon: "text-cyan-300", chip: "bg-cyan-400/15", ring: "hover:border-cyan-300/50", bar: "from-cyan-400/70 to-cyan-200/10" },
} as const;

type Accent = keyof typeof ACCENTS;

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  accent = "emerald",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  tone?: "default" | "positive" | "negative";
  accent?: Accent;
}) {
  const a = ACCENTS[accent];
  const toneClass =
    tone === "positive" ? "text-emerald-300" : tone === "negative" ? "text-rose-300" : "text-muted-foreground";
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 shadow-lg shadow-black/10 backdrop-blur transition-colors ${a.ring}`}
    >
      <span className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${a.bar}`} />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${a.chip} ${a.icon}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint ? <p className={`text-xs ${toneClass}`}>{hint}</p> : null}
    </article>
  );
}

function Dashboard() {
  const { company, isModuleEnabled, session } = useCompany();
  const firstName = (session?.fullName || session?.email || "").split(" ")[0] || "usuário";
  const fetchDashboard = useServerFn(getDashboardData);

  const [period, setPeriod] = useState<PeriodFilter>(DEFAULT_PERIOD);
  const range = resolvePeriod(period);

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard", company.id, range.from, range.to],
    queryFn: () => fetchDashboard({ data: { companyId: company.id, from: range.from, to: range.to } }),
    enabled: Boolean(company.id),
    staleTime: 60_000,
  });

  const shortcuts = modules.filter((m) => m.slug !== "dashboard" && isModuleEnabled(m.slug));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-background">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={`Logo ${company.name}`} className="h-full w-full object-contain" />
          ) : (
            <Building2 className="h-6 w-6 text-muted-foreground" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {greetingFor()}, {firstName}!
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{company.name}</h1>
          <p className="text-sm text-muted-foreground">
            {company.segment} • CNPJ {company.document}
          </p>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <DashboardPeriodFilter value={period} onChange={setPeriod} />
        </div>
      </header>

      <p className="text-xs text-muted-foreground">
        Período aplicado: <span className="text-foreground">{periodLabel(period)}</span>
      </p>

      {!company.id ? (
        <Card className="border-destructive/40 bg-destructive/10 text-sm">
          Nenhuma empresa vinculada ao seu usuário. Solicite o vínculo ao administrador DeviTech.
        </Card>
      ) : isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Faturamento (12m)" value={brl(data.revenue)} hint="Recebimentos liquidados" icon={TrendingUp} tone="positive" accent="emerald" />
            <Kpi label="Despesas (12m)" value={brl(data.expenses)} hint="Pagamentos liquidados" icon={TrendingDown} tone="negative" accent="rose" />
            <Kpi
              label="Saldo"
              value={brl(data.balance)}
              hint={`Margem de ${data.margin.toFixed(1)}%`}
              icon={Wallet}
              accent="sky"
              tone={data.balance >= 0 ? "positive" : "negative"}
            />
            <Kpi
              label="Ticket médio"
              value={brl(data.ticket)}
              hint={`${data.salesCount} vendas no período`}
              icon={Percent}
              accent="violet"
            />
            <Kpi
              label="Contas a receber"
              value={brl(data.receivableOpen)}
              hint={data.receivableOverdue > 0 ? `${brl(data.receivableOverdue)} em atraso` : "Sem atrasos"}
              icon={ArrowDownRight}
              accent="cyan"
              tone={data.receivableOverdue > 0 ? "negative" : "positive"}
            />
            <Kpi
              label="Contas a pagar"
              value={brl(data.payableOpen)}
              hint={data.payableOverdue > 0 ? `${brl(data.payableOverdue)} em atraso` : "Sem atrasos"}
              icon={ArrowUpRight}
              accent="amber"
              tone={data.payableOverdue > 0 ? "negative" : "positive"}
            />
            <Kpi
              label="Estoque"
              value={brl(data.inventoryValue)}
              hint={`${data.inventoryItems} itens • ${data.inventoryLow} abaixo do mínimo`}
              icon={Package}
              accent="emerald"
              tone={data.inventoryLow > 0 ? "negative" : "positive"}
            />
            <Kpi
              label="Folha (último mês)"
              value={brl(data.payrollNet)}
              hint={`${data.payrollEmployees} funcionários`}
              icon={Users}
              accent="violet"
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h2 className="text-sm font-semibold">Faturamento x Despesas x Saldo</h2>
              <p className="text-xs text-muted-foreground">Últimos 12 meses</p>
              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthly} margin={{ left: -18, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb7185" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="oklch(0.55 0.02 200 / 0.28)" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="#a8b3c2" />
                    <YAxis
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      stroke="#a8b3c2"
                    />
                    <Tooltip formatter={(v) => brlFull(Number(v))} {...chartTooltip} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="faturamento" name="Faturamento" stroke="#34d399" fill="url(#gRev)" strokeWidth={2} />
                    <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#fb7185" fill="url(#gExp)" strokeWidth={2} />
                    <Area type="monotone" dataKey="saldo" name="Saldo" stroke="#a78bfa" fill="transparent" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h2 className="text-sm font-semibold">Despesas por categoria</h2>
              <p className="text-xs text-muted-foreground">Pagamentos liquidados</p>
              <div className="mt-4 h-64 w-full">
                {data.expensesByCategory.length === 0 ? (
                  <p className="pt-16 text-center text-xs text-muted-foreground">Sem despesas registradas.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.expensesByCategory}
                        dataKey="value"
                        nameKey="category"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {data.expensesByCategory.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => brlFull(Number(v))} {...chartTooltip} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <ShoppingCart className="h-4 w-4 text-primary" /> Vendas x Compras
              </h2>
              <p className="break-words text-xs text-muted-foreground">
                {brl(data.salesTotal)} vendidos • {brl(data.purchasesTotal)} comprados ({data.purchasesCount} compras)
              </p>
              <div className="mt-4 h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.salesVsPurchases} margin={{ left: -18, right: 8, top: 8 }}>
                    <CartesianGrid stroke="oklch(0.55 0.02 200 / 0.28)" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="#a8b3c2" />
                    <YAxis
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      stroke="#a8b3c2"
                    />
                    <Tooltip formatter={(v) => brlFull(Number(v))} {...chartTooltip} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="vendas" name="Vendas" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="compras" name="Compras" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Receipt className="h-4 w-4 text-primary" /> Vencimentos próximos
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.upcoming.length === 0 ? (
                  <li className="text-xs text-muted-foreground">Nenhum vencimento nos próximos 7 dias.</li>
                ) : (
                  data.upcoming.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{u.description}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(`${u.dueDate}T12:00:00`).toLocaleDateString("pt-BR")} •{" "}
                          {u.kind === "payable" ? "a pagar" : "a receber"}
                          {u.status === "overdue" ? " • atrasado" : ""}
                        </p>
                      </div>
                       <span className={`mobile-value max-w-32 shrink-0 text-right text-xs font-semibold ${u.kind === "payable" ? "text-rose-300" : "text-emerald-300"}`}>
                        {brl(u.amount)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </Card>
          </div>

          <Card>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-primary" /> Estoque abaixo do mínimo
            </h2>
            {data.lowStock.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">Todos os itens estão acima do estoque mínimo.</p>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {data.lowStock.map((i) => (
                  <div key={i.id} className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2">
                    <p className="truncate text-xs font-medium">{i.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {i.quantity} {i.unit} • mínimo {i.minQuantity} {i.unit}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

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
