import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Ban, CheckCircle2, FileCheck2, Loader2, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { listCropSeasons, type CropSeason } from "@/lib/production.functions";
import {
  deleteSalesBilling,
  listSalesBillings,
  saveSalesBilling,
  setSalesBillingStatus,
  type SalesBilling,
} from "@/lib/sales.functions";

type BillingDraft = {
  id?: string;
  customer: string;
  soldAt: string;
  total: string;
  status: SalesBilling["status"];
  seasonId: string;
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const statusLabels: Record<SalesBilling["status"], string> = {
  draft: "Rascunho",
  confirmed: "Confirmado",
  canceled: "Cancelado",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR");
}

function emptyDraft(): BillingDraft {
  return { customer: "", soldAt: today(), total: "", status: "draft", seasonId: "" };
}

function toDraft(row: SalesBilling): BillingDraft {
  return {
    id: row.id,
    customer: row.customer,
    soldAt: row.sold_at.slice(0, 10),
    total: String(row.total),
    status: row.status,
    seasonId: row.season_id ?? "",
  };
}

export function SalesBillingPanel() {
  const { company, canEdit } = useCompany();
  const queryClient = useQueryClient();
  const fetchBillings = useServerFn(listSalesBillings);
  const fetchSeasons = useServerFn(listCropSeasons);
  const saveBilling = useServerFn(saveSalesBilling);
  const changeStatus = useServerFn(setSalesBillingStatus);
  const removeBilling = useServerFn(deleteSalesBilling);
  const editable = canEdit("vendas");

  const [draft, setDraft] = useState<BillingDraft | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | SalesBilling["status"]>("all");
  const [error, setError] = useState<string | null>(null);

  const { data: billings = [], isLoading } = useQuery({
    queryKey: ["sales-billings", company.id],
    queryFn: () => fetchBillings({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });
  const { data: rawSeasons = [] } = useQuery({
    queryKey: ["crop-seasons", company.id],
    queryFn: () => fetchSeasons({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });
  const seasons = rawSeasons as CropSeason[];
  const seasonName = (id: string | null) => seasons.find((season) => season.id === id)?.name ?? null;
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["sales-billings", company.id] });

  const saveMutation = useMutation({
    mutationFn: (value: BillingDraft) => saveBilling({
      data: {
        ...value,
        companyId: company.id,
        total: Number(value.total),
        seasonId: value.seasonId || null,
      },
    }),
    onSuccess: () => { setDraft(null); setError(null); refresh(); },
    onError: (caught: Error) => setError(caught.message),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SalesBilling["status"] }) =>
      changeStatus({ data: { id, companyId: company.id, status } }),
    onSuccess: () => { setError(null); refresh(); },
    onError: (caught: Error) => setError(caught.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeBilling({ data: { id, companyId: company.id } }),
    onSuccess: () => { setError(null); refresh(); },
    onError: (caught: Error) => setError(caught.message),
  });

  const totals = useMemo(() => billings.reduce(
    (result, row) => {
      result[row.status] += Number(row.total);
      return result;
    },
    { draft: 0, confirmed: 0, canceled: 0 },
  ), [billings]);
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return billings.filter((row) =>
      (filter === "all" || row.status === filter)
      && (!term || row.customer.toLowerCase().includes(term)),
    );
  }, [billings, filter, search]);

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Faturamento</h2>
          <p className="text-sm text-muted-foreground">Registro e acompanhamento das vendas emitidas por {company.name}.</p>
        </div>
        {editable ? (
          <Button className="shrink-0 px-3 sm:px-4" variant="glow" onClick={() => { setError(null); setDraft(emptyDraft()); }}>
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Novo faturamento</span><span className="sm:hidden">Novo</span>
          </Button>
        ) : null}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-3">
        <Summary label="Confirmado" value={totals.confirmed} tone="primary" />
        <Summary label="Em rascunho" value={totals.draft} />
        <div className="min-[360px]:col-span-2 sm:col-span-1"><Summary label="Cancelado" value={totals.canceled} tone="danger" /></div>
      </div>

      {error ? <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">{error}</p> : null}

      {draft ? (
        <form className="space-y-4 rounded-lg border border-primary/40 bg-card/80 p-4 sm:p-5" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(draft); }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="field-shell text-sm sm:col-span-2" placeholder="Cliente" required minLength={2} value={draft.customer} onChange={(event) => setDraft({ ...draft, customer: event.target.value })} />
            <label className="grid gap-1 text-xs text-muted-foreground">Data da venda / emissão<input className="field-shell text-sm" type="date" required value={draft.soldAt} onChange={(event) => setDraft({ ...draft, soldAt: event.target.value })} /></label>
            <label className="grid gap-1 text-xs text-muted-foreground">Valor total<input className="field-shell text-sm" type="number" min="0.01" step="0.01" required placeholder="R$ 0,00" value={draft.total} onChange={(event) => setDraft({ ...draft, total: event.target.value })} /></label>
            <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-2">Situação<select className="field-shell text-sm" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as SalesBilling["status"] })}><option value="draft">Rascunho</option><option value="confirmed">Confirmado</option><option value="canceled">Cancelado</option></select></label>
            <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-2">Safra<select className="field-shell text-sm" value={draft.seasonId} onChange={(event) => setDraft({ ...draft, seasonId: event.target.value })}><option value="">Sem safra vinculada</option>{seasons.map((season) => <option key={season.id} value={season.id}>{season.name} • {season.season_year}</option>)}</select></label>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button type="submit" variant="glow" disabled={saveMutation.isPending}>{saveMutation.isPending ? <Loader2 className="animate-spin" /> : <FileCheck2 />} Salvar</Button>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancelar</Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-[1fr_12rem]">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className="field-shell w-full pl-9 text-sm" placeholder="Buscar por cliente" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <select className="field-shell w-full text-sm" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">Todas as situações</option><option value="draft">Rascunhos</option><option value="confirmed">Confirmados</option><option value="canceled">Cancelados</option></select>
      </div>

      {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">Nenhum faturamento encontrado.</p>
      ) : (
        <div className="grid gap-3">
          {visible.map((row) => (
            <article key={row.id} className="min-w-0 overflow-hidden rounded-lg border border-border/60 bg-card/80 p-4">
              <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"><FileCheck2 className="h-5 w-5" /></span>
                <div className="min-w-0"><h3 className="truncate text-sm font-semibold">{row.customer}</h3><p className="mobile-value mt-0.5 text-lg font-semibold">{currency.format(Number(row.total))}</p><p className="truncate text-xs text-muted-foreground">Emitido em {formatDate(row.sold_at)}{seasonName(row.season_id) ? ` • ${seasonName(row.season_id)}` : ""}</p></div>
                <div className="col-span-2 justify-self-start sm:col-span-1 sm:justify-self-end"><Status status={row.status} /></div>
              </div>
              {editable ? (
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/50 pt-3 sm:flex sm:justify-end">
                  {row.status !== "confirmed" ? <Button size="sm" variant="glow" onClick={() => statusMutation.mutate({ id: row.id, status: "confirmed" })}><CheckCircle2 /> Confirmar</Button> : <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: row.id, status: "draft" })}><RotateCcw /> Rascunho</Button>}
                  {row.status !== "canceled" ? <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: row.id, status: "canceled" })}><Ban /> Cancelar</Button> : null}
                  <Button size="icon" variant="outline" aria-label={`Editar faturamento de ${row.customer}`} onClick={() => setDraft(toDraft(row))}><Pencil /></Button>
                  <Button size="icon" variant="outline" aria-label={`Excluir faturamento de ${row.customer}`} onClick={() => confirm(`Excluir o faturamento de ${row.customer}?`) && deleteMutation.mutate(row.id)}><Trash2 /></Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Summary({ label, value, tone = "muted" }: { label: string; value: number; tone?: "muted" | "primary" | "danger" }) {
  const classes = tone === "primary" ? "border-primary/40 bg-primary/10" : tone === "danger" ? "border-destructive/40 bg-destructive/10" : "border-border/60 bg-card/80";
  return <article className={`min-w-0 overflow-hidden rounded-lg border p-3 sm:p-4 ${classes}`}><p className="truncate text-xs text-muted-foreground">{label}</p><p className="mobile-value mt-1 text-base font-semibold sm:text-xl">{currency.format(value)}</p></article>;
}

function Status({ status }: { status: SalesBilling["status"] }) {
  const classes = status === "confirmed" ? "bg-primary/15 text-primary" : status === "canceled" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground";
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${classes}`}>{statusLabels[status]}</span>;
}