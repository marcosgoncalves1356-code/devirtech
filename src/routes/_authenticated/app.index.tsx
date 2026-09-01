import { createFileRoute, Link } from "@tanstack/react-router";
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
import { modules } from "@/lib/modules";
import { getDashboardData, type DashboardData } from "@/lib/dashboard.functions";
import { Skeleton } from "@/components/ui/skeleton";

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

const PIE_COLORS = ["#22c55e", "#4ade80", "#16a34a", "#86efac", "#0ea5e9", "#f59e0b"];

const chartTooltip = {
  contentStyle: {
    background: "oklch(0.18 0.02 160 / 0.95)",
    border: "1px solid oklch(0.35 0.03 160)",
    borderRadius: "0.75rem",
    fontSize: "0.75rem",
    color: "#e5e7eb",
  },
  labelStyle: { color: "#a1a1aa" },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur ${className}`}>
      {children}
    </section>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  tone?: "default" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive" ? "text-primary" : tone === "negative" ? "text-destructive" : "text-muted-foreground";
  return (
    <article className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className={`text-xs ${toneClass}`}>{hint}</p> : null}
    </article>
  );
}

function Dashboard() {
  const { company, isModuleEnabled } = useCompany();
  const fetchDashboard = useServerFn(getDashboardData);

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard", company.id],
    queryFn: () => fetchDashboard({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
    staleTime: 60_000,
  });

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
            <Kpi label="Faturamento (12m)" value={brl(data.revenue)} hint="Recebimentos liquidados" icon={TrendingUp} tone="positive" />
            <Kpi label="Despesas (12m)" value={brl(data.expenses)} hint="Pagamentos liquidados" icon={TrendingDown} tone="negative" />
            <Kpi
              label="Saldo"
              value={brl(data.balance)}
              hint={`Margem de ${data.margin.toFixed(1)}%`}
              icon={Wallet}
              tone={data.balance >= 0 ? "positive" : "negative"}
            />
            <Kpi
              label="Ticket médio"
              value={brl(data.ticket)}
              hint={`${data.salesCount} vendas no período`}
              icon={Percent}
            />
            <Kpi
              label="Contas a receber"
              value={brl(data.receivableOpen)}
              hint={data.receivableOverdue > 0 ? `${brl(data.receivableOverdue)} em atraso` : "Sem atrasos"}
              icon={ArrowDownRight}
              tone={data.receivableOverdue > 0 ? "negative" : "positive"}
            />
            <Kpi
              label="Contas a pagar"
              value={brl(data.payableOpen)}
              hint={data.payableOverdue > 0 ? `${brl(data.payableOverdue)} em atraso` : "Sem atrasos"}
              icon={ArrowUpRight}
              tone={data.payableOverdue > 0 ? "negative" : "positive"}
            />
            <Kpi
              label="Estoque"
              value={brl(data.inventoryValue)}
              hint={`${data.inventoryItems} itens • ${data.inventoryLow} abaixo do mínimo`}
              icon={Package}
              tone={data.inventoryLow > 0 ? "negative" : "positive"}
            />
            <Kpi
              label="Folha (último mês)"
              value={brl(data.payrollNet)}
              hint={`${data.payrollEmployees} funcionários`}
              icon={Users}
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
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f87171" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="oklch(0.35 0.02 160 / 0.35)" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="#8b8f96" />
                    <YAxis
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      stroke="#8b8f96"
                    />
                    <Tooltip formatter={(v) => brlFull(Number(v))} {...chartTooltip} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="faturamento" name="Faturamento" stroke="#22c55e" fill="url(#gRev)" strokeWidth={2} />
                    <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#f87171" fill="url(#gExp)" strokeWidth={2} />
                    <Area type="monotone" dataKey="saldo" name="Saldo" stroke="#38bdf8" fill="transparent" strokeWidth={2} />
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
              <p className="text-xs text-muted-foreground">
                {brl(data.salesTotal)} vendidos • {brl(data.purchasesTotal)} comprados ({data.purchasesCount} compras)
              </p>
              <div className="mt-4 h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.salesVsPurchases} margin={{ left: -18, right: 8, top: 8 }}>
                    <CartesianGrid stroke="oklch(0.35 0.02 160 / 0.35)" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="#8b8f96" />
                    <YAxis
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      stroke="#8b8f96"
                    />
                    <Tooltip formatter={(v) => brlFull(Number(v))} {...chartTooltip} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="vendas" name="Vendas" fill="#22c55e" radius={[4, 4, 0, 0]} />
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
                      <span className={`text-xs font-semibold ${u.kind === "payable" ? "text-destructive" : "text-primary"}`}>
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
