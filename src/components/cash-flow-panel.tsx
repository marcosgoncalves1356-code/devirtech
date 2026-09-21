import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownRight, ArrowUpRight, Loader2, Scale } from "lucide-react";

import { useCompany } from "@/lib/company-context";
import { listCostCenters, type CostCenter } from "@/lib/cost-centers.functions";
import { listPayables, type Payable } from "@/lib/payables.functions";
import { listReceivables, type Receivable } from "@/lib/receivables.functions";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function formatDate(value: string) {
  const [y, m, d] = value.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

type Movement = {
  id: string;
  date: string;
  description: string;
  party: string;
  amount: number;
  direction: "in" | "out";
  costCenterId: string | null;
  settled: boolean;
};

export function CashFlowPanel() {
  const { company } = useCompany();
  const fetchPayables = useServerFn(listPayables);
  const fetchReceivables = useServerFn(listReceivables);
  const fetchCostCenters = useServerFn(listCostCenters);

  const [mode, setMode] = useState<"realized" | "projected">("realized");
  const [center, setCenter] = useState("all");

  const { data: payables = [], isLoading: loadingP } = useQuery({
    queryKey: ["payables", company.id],
    queryFn: () => fetchPayables({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });
  const { data: receivables = [], isLoading: loadingR } = useQuery({
    queryKey: ["receivables", company.id],
    queryFn: () => fetchReceivables({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });
  const { data: costCenters = [] } = useQuery({
    queryKey: ["cost-centers", company.id],
    queryFn: () => fetchCostCenters({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const centers = costCenters as CostCenter[];

  const movements = useMemo<Movement[]>(() => {
    const list: Movement[] = [];
    for (const p of payables as Payable[]) {
      if (p.status === "canceled") continue;
      const settled = Boolean(p.paid_at) || p.status === "paid";
      list.push({
        id: p.id,
        date: (p.paid_at ?? p.due_date ?? "").slice(0, 10),
        description: p.description ?? "",
        party: p.supplier ?? "",
        amount: Number(p.amount ?? 0),
        direction: "out",
        costCenterId: p.cost_center_id ?? null,
        settled,
      });
    }
    for (const r of receivables as Receivable[]) {
      if (r.status === "canceled") continue;
      const settled = Boolean(r.paid_at) || r.status === "paid";
      list.push({
        id: r.id,
        date: (r.paid_at ?? r.due_date ?? "").slice(0, 10),
        description: r.description ?? "",
        party: r.supplier ?? "",
        amount: Number(r.amount ?? 0),
        direction: "in",
        costCenterId: r.cost_center_id ?? null,
        settled,
      });
    }
    return list
      .filter((m) => m.date)
      .filter((m) => (mode === "realized" ? m.settled : true))
      .filter((m) => (center === "all" ? true : center === "none" ? !m.costCenterId : m.costCenterId === center))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [payables, receivables, mode, center]);

  const totals = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    for (const m of movements) {
      if (m.direction === "in") inflow += m.amount;
      else outflow += m.amount;
    }
    return { inflow, outflow, balance: inflow - outflow };
  }, [movements]);

  const byMonth = useMemo(() => {
    const map = new Map<string, { key: string; label: string; inflow: number; outflow: number }>();
    for (const m of movements) {
      const key = m.date.slice(0, 7);
      const label = `${MONTHS[Number(key.slice(5, 7)) - 1]}/${key.slice(2, 4)}`;
      const row = map.get(key) ?? { key, label, inflow: 0, outflow: 0 };
      if (m.direction === "in") row.inflow += m.amount;
      else row.outflow += m.amount;
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1)).slice(0, 6);
  }, [movements]);

  const loading = loadingP || loadingR;

  return (
    <section className="min-w-0 max-w-full space-y-4">
      <div className="grid min-w-0 grid-cols-1 items-center gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Fluxo de caixa</h2>
          <p className="text-sm text-muted-foreground">
            Entradas, saídas e saldo a partir dos lançamentos de contas a pagar e a receber.
          </p>
        </div>
        <select
          className="field-shell text-sm lg:w-auto"
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
        >
          <option value="realized">Realizado (baixados)</option>
          <option value="projected">Previsto (todos os títulos)</option>
        </select>
        <select className="field-shell text-sm lg:w-auto" value={center} onChange={(e) => setCenter(e.target.value)}>
          <option value="all">Todos os centros de custo</option>
          <option value="none">Sem centro de custo</option>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid min-w-0 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3">
        <article className="min-w-0 overflow-hidden rounded-2xl border border-primary/40 bg-primary/10 p-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowUpRight className="h-4 w-4 text-primary" /> Entradas
          </p>
          <p className="mobile-value mt-1 text-xl font-semibold text-primary">{currency.format(totals.inflow)}</p>
        </article>
        <article className="min-w-0 overflow-hidden rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowDownRight className="h-4 w-4 text-destructive" /> Saídas
          </p>
          <p className="mobile-value mt-1 text-xl font-semibold text-destructive">{currency.format(totals.outflow)}</p>
        </article>
        <article className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4 min-[360px]:col-span-2 sm:col-span-1">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Scale className="h-4 w-4" /> Saldo
          </p>
          <p
            className={`mobile-value mt-1 text-xl font-semibold ${totals.balance < 0 ? "text-destructive" : "text-primary"}`}
          >
            {currency.format(totals.balance)}
          </p>
        </article>
      </div>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : movements.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
          Nenhuma movimentação encontrada para o filtro selecionado.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {byMonth.map((m) => (
              <article key={m.key} className="rounded-2xl border border-border/60 bg-card/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">{m.label}</p>
                <p className="mt-1 text-sm text-primary">Entradas {currency.format(m.inflow)}</p>
                <p className="text-sm text-destructive">Saídas {currency.format(m.outflow)}</p>
                <p className="mt-1 text-sm font-semibold">Saldo {currency.format(m.inflow - m.outflow)}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-2">
            {movements.slice(0, 20).map((m) => (
              <article
                key={`${m.direction}-${m.id}`}
                className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-xl border border-border/60 bg-card/60 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    m.direction === "in" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {m.direction === "in" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.party || "—"} — {m.description || "Sem descrição"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(m.date)} • {m.settled ? "Baixado" : "Previsto"}
                    {m.costCenterId
                      ? ` • ${centers.find((c) => c.id === m.costCenterId)?.name ?? "Centro de custo"}`
                      : ""}
                  </p>
                </div>
                <span
                  className={`mobile-value col-span-2 max-w-full text-right text-sm font-semibold sm:col-span-1 ${m.direction === "in" ? "text-primary" : "text-destructive"}`}
                >
                  {m.direction === "in" ? "+" : "-"} {currency.format(m.amount)}
                </span>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
