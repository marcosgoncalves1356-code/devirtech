import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Loader2, Scale, Sprout, TrendingDown, TrendingUp, Wheat } from "lucide-react";

import { ModuleTabs } from "@/components/module-tabs";
import { useCompany } from "@/lib/company-context";
import { listCropSeasons, type CropSeason } from "@/lib/production.functions";
import { getSeasonReport, type ReportsData } from "@/lib/reports.functions";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

function Metric({ label, value, icon: Icon, tone = "default" }: { label: string; value: string; icon: typeof Sprout; tone?: "default" | "good" | "bad" }) {
  const toneClass = tone === "good" ? "border-primary/40 bg-primary/10" : tone === "bad" ? "border-destructive/40 bg-destructive/10" : "border-border/60 bg-card/80";
  return <article className={`min-w-0 overflow-hidden rounded-lg border p-4 ${toneClass}`}><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4 shrink-0" />{label}</div><p className="mobile-value mt-2 text-xl font-semibold">{value}</p></article>;
}

function Bars({ rows, valueLabel }: { rows: { label: string; value: number }[]; valueLabel: (value: number) => string }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  if (rows.length === 0) return <p className="rounded-lg border border-dashed border-border/60 p-5 text-sm text-muted-foreground">Ainda não há dados para esta safra.</p>;
  return <div className="space-y-4">{rows.map((row) => <div key={row.label} className="min-w-0"><div className="mb-1 flex min-w-0 justify-between gap-3 text-xs"><span className="truncate text-muted-foreground">{row.label}</span><span className="shrink-0 font-medium">{valueLabel(row.value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.max((row.value / max) * 100, row.value > 0 ? 3 : 0)}%` }} /></div></div>)}</div>;
}

export function ReportsWorkspace() {
  const { company } = useCompany();
  const fetchSeasons = useServerFn(listCropSeasons);
  const fetchReport = useServerFn(getSeasonReport);
  const [seasonId, setSeasonId] = useState("");
  const { data: rawSeasons = [], isLoading: loadingSeasons } = useQuery({ queryKey: ["crop-seasons", company.id], queryFn: () => fetchSeasons({ data: { companyId: company.id } }), enabled: Boolean(company.id) });
  const seasons = rawSeasons as CropSeason[];
  useEffect(() => { if (!seasonId && seasons[0]?.id) setSeasonId(seasons[0].id); }, [seasonId, seasons]);
  const { data, isLoading, error } = useQuery({ queryKey: ["season-report", company.id, seasonId], queryFn: () => fetchReport({ data: { companyId: company.id, seasonId } }), enabled: Boolean(company.id && seasonId) });
  const reportData = data as ReportsData | undefined;
  const report = reportData?.report;
  const compareRows = reportData?.comparisons ?? [];

  if (loadingSeasons) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
  if (seasons.length === 0) return <p className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">Cadastre uma safra no módulo Produção para gerar relatórios.</p>;
  const selector = <label className="grid min-w-0 gap-1 text-xs text-muted-foreground sm:max-w-sm">Safra<select className="field-shell text-sm" value={seasonId} onChange={(event) => setSeasonId(event.target.value)}>{seasons.map((season) => <option key={season.id} value={season.id}>{season.name} • {season.season_year}</option>)}</select></label>;
  if (isLoading || !report) return <div className="space-y-4">{selector}{error ? <p className="text-sm text-destructive">{error.message}</p> : <Loader2 className="h-5 w-5 animate-spin text-primary" />}</div>;

  const p = report.production;
  const f = report.financial;
  const monthRows = report.harvestByMonth.map((row) => ({ label: row.month.split("-").reverse().join("/"), value: row.quantity }));

  return <section className="min-w-0 max-w-full space-y-5">
    <div className="grid gap-3 border-b border-border/60 pb-5 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,22rem)] sm:items-end"><div className="min-w-0"><h2 className="text-lg font-semibold">Relatórios por safra</h2><p className="text-sm text-muted-foreground">Produção, custos e resultado financeiro consolidados pela safra selecionada.</p></div>{selector}</div>
    <ModuleTabs moduleSlug="relatorios" tabs={[
      { value: "overview", label: "Visão geral", content: <div className="space-y-4"><div className="grid gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4"><Metric label="Produção total" value={`${number.format(p.harvested)} ${report.season.productionUnit}`} icon={Wheat} /><Metric label="Produtividade" value={`${number.format(p.productivity)} ${report.season.productionUnit}/${report.season.areaUnit}`} icon={Sprout} /><Metric label="Resultado realizado" value={currency.format(f.realizedBalance)} icon={f.realizedBalance >= 0 ? TrendingUp : TrendingDown} tone={f.realizedBalance >= 0 ? "good" : "bad"} /><Metric label="Resultado projetado" value={currency.format(f.projectedBalance)} icon={Scale} tone={f.projectedBalance >= 0 ? "good" : "bad"} /></div><div className="grid gap-3 sm:grid-cols-2"><article className="rounded-lg border border-border/60 bg-card/80 p-4"><h3 className="font-semibold">{report.season.name}</h3><p className="mt-2 text-sm text-muted-foreground">{report.season.cropType} • {report.season.seasonYear} • {number.format(report.season.cultivatedArea)} {report.season.areaUnit}</p></article><article className="rounded-lg border border-border/60 bg-card/80 p-4"><h3 className="font-semibold">Custos sem duplicidade</h3><p className="mt-2 text-sm text-muted-foreground">Operação da Produção: {currency.format(p.operationalCost)}. Pagamentos financeiros: {currency.format(f.paid)}.</p></article></div></div> },
      { value: "production", label: "Produção e produtividade", content: <div className="grid gap-4 lg:grid-cols-2"><article className="rounded-lg border border-border/60 bg-card/80 p-4"><h3 className="mb-4 text-sm font-semibold">Colheita por mês</h3><Bars rows={monthRows} valueLabel={(value) => `${number.format(value)} ${report.season.productionUnit}`} /></article><article className="rounded-lg border border-border/60 bg-card/80 p-4"><h3 className="mb-4 text-sm font-semibold">Produção por apanhador</h3><Bars rows={report.harvestByPicker.map((row) => ({ label: row.name, value: row.quantity }))} valueLabel={(value) => `${number.format(value)} ${report.season.productionUnit}`} /></article></div> },
      { value: "costs", label: "Custos da safra", content: <div className="space-y-4"><div className="grid gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4"><Metric label="Plantio e aplicações" value={currency.format(p.activityCost)} icon={Sprout} /><Metric label="Apanha e colheita" value={currency.format(p.harvestCost)} icon={Wheat} /><Metric label="Custo operacional" value={currency.format(p.operationalCost)} icon={TrendingDown} /><Metric label="Custo por unidade" value={currency.format(p.costPerUnit)} icon={Scale} /></div><article className="rounded-lg border border-border/60 bg-card/80 p-4"><Bars rows={report.costsByType} valueLabel={(value) => currency.format(value)} /><p className="mt-4 text-xs text-muted-foreground">Custos operacionais e pagamentos financeiros são exibidos separadamente para não duplicar valores.</p></article></div> },
      { value: "financial", label: "Financeiro da safra", content: <div className="grid gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4"><Metric label="Faturamento confirmado" value={currency.format(f.billed)} icon={BarChart3} /><Metric label="Recebido" value={currency.format(f.received)} icon={TrendingUp} tone="good" /><Metric label="A receber" value={currency.format(f.receivableOpen)} icon={TrendingUp} /><Metric label="Pago" value={currency.format(f.paid)} icon={TrendingDown} tone="bad" /><Metric label="A pagar" value={currency.format(f.payableOpen)} icon={TrendingDown} /><Metric label="Saldo realizado" value={currency.format(f.realizedBalance)} icon={Scale} tone={f.realizedBalance >= 0 ? "good" : "bad"} /><Metric label="Saldo projetado" value={currency.format(f.projectedBalance)} icon={Scale} tone={f.projectedBalance >= 0 ? "good" : "bad"} /></div> },
      { value: "comparison", label: "Comparativo de safras", content: <div className="w-full overflow-x-auto rounded-lg border border-border/60"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted/60 text-xs text-muted-foreground"><tr><th className="p-3">Safra</th><th className="p-3">Produção</th><th className="p-3">Produtividade</th><th className="p-3">Recebido</th><th className="p-3">Pago</th><th className="p-3">Resultado</th></tr></thead><tbody>{compareRows.map((row) => <tr key={row.id} className="border-t border-border/50"><td className="p-3 font-medium">{row.name} • {row.year}</td><td className="p-3">{number.format(row.harvested)}</td><td className="p-3">{number.format(row.productivity)}</td><td className="p-3">{currency.format(row.received)}</td><td className="p-3">{currency.format(row.paid)}</td><td className="p-3 font-medium">{currency.format(row.realizedBalance)}</td></tr>)}</tbody></table></div> },
    ]} />
  </section>;
}