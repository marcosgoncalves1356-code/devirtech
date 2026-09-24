import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, HandCoins, Loader2, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { listCostCenters, type CostCenter } from "@/lib/cost-centers.functions";
import { listCropSeasons, type CropSeason } from "@/lib/production.functions";
import {
  deleteReceivable,
  listReceivables,
  reopenReceivable,
  saveReceivable,
  settleReceivable,
  type Receivable,
} from "@/lib/receivables.functions";

type Draft = {
  id?: string;
  customer: string;
  description: string;
  category: string;
  amount: string;
  dueDate: string;
  receivedAt: string;
  costCenterId: string;
  seasonId: string;
  notes: string;
  status: "open" | "paid" | "overdue" | "canceled";
};

const statusLabels: Record<Draft["status"], string> = {
  open: "Em aberto",
  paid: "Recebido",
  overdue: "Vencido",
  canceled: "Cancelado",
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function emptyDraft(): Draft {
  return {
    customer: "",
    description: "",
    category: "geral",
    amount: "",
    dueDate: today(),
    receivedAt: "",
    costCenterId: "",
    seasonId: "",
    notes: "",
    status: "open",
  };
}

function toDraft(r: Receivable): Draft {
  return {
    id: r.id,
    customer: r.supplier ?? "",
    description: r.description ?? "",
    category: r.category ?? "geral",
    amount: r.amount ? String(r.amount) : "",
    dueDate: (r.due_date ?? "").slice(0, 10),
    receivedAt: r.paid_at ? r.paid_at.slice(0, 10) : "",
    costCenterId: r.cost_center_id ?? "",
    seasonId: r.season_id ?? "",
    notes: r.notes ?? "",
    status: (r.status as Draft["status"]) ?? "open",
  };
}

function effectiveStatus(r: Receivable): Draft["status"] {
  if (r.status === "paid" || r.paid_at) return "paid";
  if (r.status === "canceled") return "canceled";
  return r.due_date && r.due_date.slice(0, 10) < today() ? "overdue" : "open";
}

export function ReceivablesPanel() {
  const { company, canEdit } = useCompany();
  const qc = useQueryClient();
  const fetchReceivables = useServerFn(listReceivables);
  const fetchCostCenters = useServerFn(listCostCenters);
  const fetchSeasons = useServerFn(listCropSeasons);
  const save = useServerFn(saveReceivable);
  const settle = useServerFn(settleReceivable);
  const reopen = useServerFn(reopenReceivable);
  const remove = useServerFn(deleteReceivable);
  const editable = canEdit("financeiro");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "overdue" | "paid">("all");
  const [error, setError] = useState<string | null>(null);

  const { data: receivables = [], isLoading } = useQuery({
    queryKey: ["receivables", company.id],
    queryFn: () => fetchReceivables({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const { data: costCenters = [] } = useQuery({
    queryKey: ["cost-centers", company.id],
    queryFn: () => fetchCostCenters({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });
  const { data: cropSeasons = [] } = useQuery({
    queryKey: ["crop-seasons", company.id],
    queryFn: () => fetchSeasons({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const centers = costCenters as CostCenter[];
  const centerName = (id: string | null) => centers.find((c) => c.id === id)?.name ?? null;
  const seasons = cropSeasons as CropSeason[];
  const seasonName = (id: string | null) => seasons.find((season) => season.id === id)?.name ?? null;

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["receivables", company.id] });

  const saveMutation = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          id: d.id,
          companyId: company.id,
          customer: d.customer,
          description: d.description,
          category: d.category || "geral",
          amount: d.amount ? Number(d.amount) : 0,
          dueDate: d.dueDate,
          receivedAt: d.receivedAt || null,
          costCenterId: d.costCenterId || null,
          seasonId: d.seasonId || null,
          notes: d.notes,
          status: d.status,
        },
      }),
    onSuccess: () => {
      setDraft(null);
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const settleMutation = useMutation({
    mutationFn: (id: string) => settle({ data: { id, receivedAt: today() } }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const reopenMutation = useMutation({
    mutationFn: (id: string) => reopen({ data: { id } }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const term = search.trim().toLowerCase();
  const rows = receivables as Receivable[];

  const visible = useMemo(
    () =>
      rows.filter((r) => {
        const st = effectiveStatus(r);
        if (filter === "open" && st !== "open") return false;
        if (filter === "overdue" && st !== "overdue") return false;
        if (filter === "paid" && st !== "paid") return false;
        if (!term) return true;
        return [r.supplier, r.description, r.category, r.notes].some((v) =>
          (v ?? "").toLowerCase().includes(term),
        );
      }),
    [rows, term, filter],
  );

  const totals = useMemo(() => {
    let open = 0;
    let overdue = 0;
    let received = 0;
    for (const r of rows) {
      const st = effectiveStatus(r);
      const value = Number(r.amount ?? 0);
      if (st === "paid") received += value;
      else if (st === "overdue") overdue += value;
      else if (st === "open") open += value;
    }
    return { open, overdue, received };
  }, [rows]);

  return (
    <section className="min-w-0 max-w-full space-y-4">
      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Contas a receber</h2>
          <p className="text-sm text-muted-foreground">
            Cadastro, edição, baixa e consulta dos títulos a receber de {company.name}.
          </p>
        </div>
        {editable ? (
          <Button className="w-full sm:w-auto" variant="glow" onClick={() => setDraft(emptyDraft())}>
            <Plus className="h-4 w-4" /> Nova conta a receber
          </Button>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3">
        <article className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4">
          <p className="text-xs text-muted-foreground">Em aberto</p>
          <p className="mobile-value mt-1 text-xl font-semibold">{currency.format(totals.open)}</p>
        </article>
        <article className="min-w-0 overflow-hidden rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-xs text-muted-foreground">Vencido</p>
          <p className="mobile-value mt-1 text-xl font-semibold text-destructive">{currency.format(totals.overdue)}</p>
        </article>
        <article className="min-w-0 overflow-hidden rounded-2xl border border-primary/40 bg-primary/10 p-4 min-[360px]:col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Recebido</p>
          <p className="mobile-value mt-1 text-xl font-semibold text-primary">{currency.format(totals.received)}</p>
        </article>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p>
      ) : null}

      {draft ? (
        <form
          className="min-w-0 max-w-full space-y-4 rounded-2xl border border-primary/40 bg-card/80 p-4 sm:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(draft);
          }}
        >
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              className="field-shell text-sm sm:col-span-2"
              placeholder="Cliente"
              value={draft.customer}
              onChange={(e) => setDraft({ ...draft, customer: e.target.value })}
              required
              minLength={2}
            />
            <input
              className="field-shell text-sm"
              placeholder="Categoria (venda, serviço…)"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            />
            <input
              className="field-shell text-sm sm:col-span-2"
              placeholder="Descrição do título"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              required
              minLength={2}
            />
            <input
              className="field-shell text-sm"
              type="number"
              step="0.01"
              min="0"
              placeholder="Valor (R$)"
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              required
            />
            <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">
              Vencimento
              <input
                className="field-shell text-sm"
                type="date"
                value={draft.dueDate}
                onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                required
              />
            </label>
            <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">
              Data de recebimento
              <input
                className="field-shell text-sm"
                type="date"
                value={draft.receivedAt}
                onChange={(e) => setDraft({ ...draft, receivedAt: e.target.value })}
              />
            </label>
            <select
              className="field-shell text-sm"
              value={draft.costCenterId}
              onChange={(e) => setDraft({ ...draft, costCenterId: e.target.value })}
            >
              <option value="">Centro de custo (opcional)</option>
              {centers
                .filter((c) => c.status === "active" || c.id === draft.costCenterId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            <select className="field-shell text-sm" value={draft.seasonId} onChange={(e) => setDraft({ ...draft, seasonId: e.target.value })}>
              <option value="">Safra (opcional)</option>
              {seasons.map((season) => <option key={season.id} value={season.id}>{season.name} • {season.season_year}</option>)}
            </select>
            <select
              className="field-shell text-sm"
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft["status"] })}
            >
              <option value="open">Em aberto</option>
              <option value="paid">Recebido</option>
              <option value="overdue">Vencido</option>
              <option value="canceled">Cancelado</option>
            </select>
            <textarea
              className="field-shell min-h-20 text-sm sm:col-span-2 lg:col-span-3"
              placeholder="Observação"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="glow" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar título"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative min-w-0 flex-1 basis-full sm:min-w-52 sm:basis-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="field-shell w-full pl-9 text-sm"
            placeholder="Buscar por cliente, descrição ou categoria"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="field-shell text-sm sm:w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">Todos os títulos</option>
          <option value="open">Em aberto</option>
          <option value="overdue">Vencidos</option>
          <option value="paid">Recebidos</option>
        </select>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
          Nenhuma conta a receber encontrada.
        </p>
      ) : (
        <div className="grid gap-3">
          {visible.map((r) => {
            const st = effectiveStatus(r);
            const center = centerName(r.cost_center_id);
            return (
              <article
                key={r.id}
                className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <HandCoins className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">
                    {r.supplier || "Cliente não informado"} — {currency.format(Number(r.amount ?? 0))}
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {[r.description, r.category, center, seasonName(r.season_id)].filter(Boolean).join(" • ")} • Venc.{" "}
                    {formatDate(r.due_date)}
                    {r.paid_at ? ` • Recebido em ${formatDate(r.paid_at)}` : ""}
                  </p>
                  {r.notes ? <p className="truncate text-xs text-muted-foreground/80">{r.notes}</p> : null}
                </div>
                <span
                  className={
                    st === "paid"
                      ? "col-span-2 justify-self-start rounded-full bg-primary/15 px-3 py-1 text-xs text-primary sm:col-span-1"
                      : st === "overdue"
                        ? "col-span-2 justify-self-start rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive sm:col-span-1"
                        : "col-span-2 justify-self-start rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground sm:col-span-1"
                  }
                >
                  {statusLabels[st]}
                </span>
                {editable ? (
                  <div className="col-span-2 flex min-w-0 flex-wrap justify-end gap-2 sm:col-span-3">
                    {st === "paid" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => reopenMutation.mutate(r.id)}
                        disabled={reopenMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4" /> Estornar
                      </Button>
                    ) : (
                      <Button
                        variant="glow"
                        size="sm"
                        onClick={() => settleMutation.mutate(r.id)}
                        disabled={settleMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Dar baixa
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setDraft(toDraft(r))}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Excluir o título de ${r.supplier || "cliente"}?`)) {
                          removeMutation.mutate(r.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
