import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Pencil, Plus, Receipt, RotateCcw, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { listCostCenters, type CostCenter } from "@/lib/cost-centers.functions";
import {
  deletePayable,
  listPayables,
  reopenPayable,
  savePayable,
  settlePayable,
  type Payable,
} from "@/lib/payables.functions";

type Draft = {
  id?: string;
  supplier: string;
  description: string;
  category: string;
  amount: string;
  dueDate: string;
  paidAt: string;
  costCenterId: string;
  notes: string;
  status: "open" | "paid" | "overdue" | "canceled";
};


const statusLabels: Record<Draft["status"], string> = {
  open: "Em aberto",
  paid: "Pago",
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
    supplier: "",
    description: "",
    category: "geral",
    amount: "",
    dueDate: today(),
    paidAt: "",
    costCenterId: "",
    notes: "",
    status: "open",
  };
}

function toDraft(p: Payable): Draft {
  return {
    id: p.id,
    supplier: p.supplier ?? "",
    description: p.description ?? "",
    category: p.category ?? "geral",
    amount: p.amount ? String(p.amount) : "",
    dueDate: (p.due_date ?? "").slice(0, 10),
    paidAt: p.paid_at ? p.paid_at.slice(0, 10) : "",
    costCenterId: p.cost_center_id ?? "",
    notes: p.notes ?? "",

    status: (p.status as Draft["status"]) ?? "open",
  };
}

function effectiveStatus(p: Payable): Draft["status"] {
  if (p.status === "paid" || p.paid_at) return "paid";
  if (p.status === "canceled") return "canceled";
  return p.due_date && p.due_date.slice(0, 10) < today() ? "overdue" : "open";
}

export function PayablesPanel() {
  const { company, canEdit } = useCompany();
  const qc = useQueryClient();
  const fetchPayables = useServerFn(listPayables);
  const fetchCostCenters = useServerFn(listCostCenters);
  const save = useServerFn(savePayable);
  const settle = useServerFn(settlePayable);
  const reopen = useServerFn(reopenPayable);
  const remove = useServerFn(deletePayable);
  const editable = canEdit("financeiro");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "overdue" | "paid">("all");
  const [error, setError] = useState<string | null>(null);

  const { data: payables = [], isLoading } = useQuery({
    queryKey: ["payables", company.id],
    queryFn: () => fetchPayables({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const { data: costCenters = [] } = useQuery({
    queryKey: ["cost-centers", company.id],
    queryFn: () => fetchCostCenters({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const centers = costCenters as CostCenter[];
  const centerName = (id: string | null) => centers.find((c) => c.id === id)?.name ?? null;

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["payables", company.id] });

  const saveMutation = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          id: d.id,
          companyId: company.id,
          supplier: d.supplier,
          description: d.description,
          category: d.category || "geral",
          amount: d.amount ? Number(d.amount) : 0,
          dueDate: d.dueDate,
          paidAt: d.paidAt || null,
          costCenterId: d.costCenterId || null,
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
    mutationFn: (id: string) => settle({ data: { id, paidAt: today() } }),
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
  const rows = payables as Payable[];

  const visible = useMemo(
    () =>
      rows.filter((p) => {
        const st = effectiveStatus(p);
        if (filter === "open" && st !== "open") return false;
        if (filter === "overdue" && st !== "overdue") return false;
        if (filter === "paid" && st !== "paid") return false;
        if (!term) return true;
        return [p.supplier, p.description, p.category, p.notes].some((v) =>
          (v ?? "").toLowerCase().includes(term),
        );
      }),
    [rows, term, filter],
  );

  const totals = useMemo(() => {
    let open = 0;
    let overdue = 0;
    let paid = 0;
    for (const p of rows) {
      const st = effectiveStatus(p);
      const value = Number(p.amount ?? 0);
      if (st === "paid") paid += value;
      else if (st === "overdue") overdue += value;
      else if (st === "open") open += value;
    }
    return { open, overdue, paid };
  }, [rows]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Contas a pagar</h2>
          <p className="text-sm text-muted-foreground">
            Cadastro, edição, baixa e consulta dos títulos a pagar de {company.name}.
          </p>
        </div>
        {editable ? (
          <Button variant="glow" onClick={() => setDraft(emptyDraft())}>
            <Plus className="h-4 w-4" /> Nova conta a pagar
          </Button>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3">
        <article className="rounded-2xl border border-border/60 bg-card/80 p-4">
          <p className="text-xs text-muted-foreground">Em aberto</p>
          <p className="mobile-value mt-1 text-xl font-semibold">{currency.format(totals.open)}</p>
        </article>
        <article className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-xs text-muted-foreground">Vencido</p>
          <p className="mobile-value mt-1 text-xl font-semibold text-destructive">{currency.format(totals.overdue)}</p>
        </article>
        <article className="min-w-0 rounded-2xl border border-primary/40 bg-primary/10 p-4 min-[360px]:col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Pago</p>
          <p className="mobile-value mt-1 text-xl font-semibold text-primary">{currency.format(totals.paid)}</p>
        </article>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p>
      ) : null}

      {draft ? (
        <form
          className="space-y-4 rounded-2xl border border-primary/40 bg-card/80 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(draft);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              className="field-shell text-sm sm:col-span-2"
              placeholder="Fornecedor"
              value={draft.supplier}
              onChange={(e) => setDraft({ ...draft, supplier: e.target.value })}
              required
              minLength={2}
            />
            <input
              className="field-shell text-sm"
              placeholder="Categoria (insumos, energia…)"
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
            <label className="grid gap-1 text-xs text-muted-foreground">
              Vencimento
              <input
                className="field-shell text-sm"
                type="date"
                value={draft.dueDate}
                onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                required
              />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              Data de pagamento
              <input
                className="field-shell text-sm"
                type="date"
                value={draft.paidAt}
                onChange={(e) => setDraft({ ...draft, paidAt: e.target.value })}
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
            <select

              className="field-shell text-sm"
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft["status"] })}
            >
              <option value="open">Em aberto</option>
              <option value="paid">Pago</option>
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

          <div className="flex gap-2">
            <Button type="submit" variant="glow" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar título"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-0 flex-1 basis-full sm:min-w-52 sm:basis-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="field-shell w-full pl-9 text-sm"
            placeholder="Buscar por fornecedor, descrição ou categoria"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="field-shell text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">Todos os títulos</option>
          <option value="open">Em aberto</option>
          <option value="overdue">Vencidos</option>
          <option value="paid">Pagos</option>
        </select>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
          Nenhuma conta a pagar encontrada.
        </p>
      ) : (
        <div className="grid gap-3">
          {visible.map((p) => {
            const st = effectiveStatus(p);
            return (
              <article
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Receipt className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">
                    {p.supplier || "Fornecedor não informado"} — {currency.format(Number(p.amount ?? 0))}
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {[p.description, p.category, centerName(p.cost_center_id)].filter(Boolean).join(" • ")} • Venc. {formatDate(p.due_date)}
                    {p.paid_at ? ` • Pago em ${formatDate(p.paid_at)}` : ""}
                  </p>
                  {p.notes ? <p className="truncate text-xs text-muted-foreground/80">{p.notes}</p> : null}
                </div>
                <span
                  className={
                    st === "paid"
                      ? "rounded-full bg-primary/15 px-3 py-1 text-xs text-primary"
                      : st === "overdue"
                        ? "rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive"
                        : "rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  }
                >
                  {statusLabels[st]}
                </span>
                {editable ? (
                  <div className="flex gap-2">
                    {st === "paid" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => reopenMutation.mutate(p.id)}
                        disabled={reopenMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4" /> Estornar
                      </Button>
                    ) : (
                      <Button
                        variant="glow"
                        size="sm"
                        onClick={() => settleMutation.mutate(p.id)}
                        disabled={settleMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Dar baixa
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setDraft(toDraft(p))}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Excluir o título de ${p.supplier || "fornecedor"}?`)) {
                          removeMutation.mutate(p.id);
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
