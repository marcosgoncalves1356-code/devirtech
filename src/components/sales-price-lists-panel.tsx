import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, ListChecks, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import {
  deleteSalesPriceList,
  listSalesPriceLists,
  saveSalesPriceList,
  setSalesPriceListStatus,
  type SalesPriceList,
} from "@/lib/sales-price-lists.functions";

type ItemDraft = { description: string; unit: string; price: string };
type Draft = { id?: string; name: string; validFrom: string; validUntil: string; status: SalesPriceList["status"]; notes: string; items: ItemDraft[] };
const LABELS: Record<SalesPriceList["status"], string> = { draft: "Rascunho", active: "Ativa", inactive: "Inativa" };
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const today = () => new Date().toISOString().slice(0, 10);
const emptyItem = (): ItemDraft => ({ description: "", unit: "un", price: "0" });
const emptyDraft = (): Draft => ({ name: "", validFrom: today(), validUntil: "", status: "draft", notes: "", items: [emptyItem()] });
const toDraft = (list: SalesPriceList): Draft => ({
  id: list.id, name: list.name, validFrom: list.valid_from.slice(0, 10), validUntil: list.valid_until?.slice(0, 10) ?? "",
  status: list.status, notes: list.notes, items: list.items.map((item) => ({ description: item.description, unit: item.unit, price: String(item.price) })),
});
const date = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");

export function SalesPriceListsPanel() {
  const { company, canEdit } = useCompany();
  const queryClient = useQueryClient();
  const fetchLists = useServerFn(listSalesPriceLists);
  const saveList = useServerFn(saveSalesPriceList);
  const changeStatus = useServerFn(setSalesPriceListStatus);
  const removeList = useServerFn(deleteSalesPriceList);
  const editable = canEdit("vendas");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | SalesPriceList["status"]>("all");
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["sales-price-lists", company.id], queryFn: () => fetchLists({ data: { companyId: company.id } }), enabled: Boolean(company.id),
  });
  const lists = query.data ?? [];
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["sales-price-lists", company.id] });
  const saveMutation = useMutation({
    mutationFn: (value: Draft) => saveList({ data: { ...value, companyId: company.id, validUntil: value.validUntil || null, items: value.items.map((item) => ({ ...item, price: Number(item.price || 0) })) } }),
    onSuccess: () => { setDraft(null); setError(null); refresh(); }, onError: (caught: Error) => setError(caught.message),
  });
  const statusMutation = useMutation({
    mutationFn: (value: { id: string; status: SalesPriceList["status"] }) => changeStatus({ data: { ...value, companyId: company.id } }),
    onSuccess: () => { setError(null); refresh(); }, onError: (caught: Error) => setError(caught.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeList({ data: { id, companyId: company.id } }),
    onSuccess: () => { setError(null); refresh(); }, onError: (caught: Error) => setError(caught.message),
  });
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return lists.filter((list) => (filter === "all" || list.status === filter) && (!term || [list.name, list.notes, ...list.items.map((item) => item.description)].some((value) => value.toLowerCase().includes(term))));
  }, [filter, lists, search]);
  const activeCount = lists.filter((list) => list.status === "active").length;
  const itemCount = visible.reduce((sum, list) => sum + list.items.length, 0);
  const updateItem = (index: number, patch: Partial<ItemDraft>) => {
    if (!draft) return;
    setDraft({ ...draft, items: draft.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  };

  return <section className="min-w-0 max-w-full space-y-4">
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1"><h2 className="text-lg font-semibold">Tabelas de preços</h2><p className="text-sm text-muted-foreground">Organize preços de venda por tabela e período de vigência.</p></div>
      {editable ? <Button className="w-full sm:w-auto" variant="glow" onClick={() => { setError(null); setDraft(emptyDraft()); }}><Plus /> Nova tabela</Button> : null}
    </div>
    <div className="grid min-w-0 grid-cols-2 gap-3 sm:max-w-md">
      <div className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3"><p className="text-xs text-muted-foreground">Tabelas ativas</p><strong className="mobile-value mt-1 text-lg">{activeCount}</strong></div>
      <div className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3"><p className="text-xs text-muted-foreground">Itens listados</p><strong className="mobile-value mt-1 text-lg">{itemCount}</strong></div>
    </div>
    {error ? <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p> : null}
    {draft ? <form className="min-w-0 space-y-4 rounded-2xl border border-primary/40 bg-card/80 p-4 sm:p-5" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(draft); }}>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input className="field-shell text-sm sm:col-span-2" required minLength={2} placeholder="Nome da tabela" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        <label className="min-w-0 text-xs text-muted-foreground">Início da vigência<input className="field-shell mt-1 text-sm" type="date" required value={draft.validFrom} onChange={(event) => setDraft({ ...draft, validFrom: event.target.value })} /></label>
        <label className="min-w-0 text-xs text-muted-foreground">Fim da vigência<input className="field-shell mt-1 text-sm" type="date" min={draft.validFrom} value={draft.validUntil} onChange={(event) => setDraft({ ...draft, validUntil: event.target.value })} /></label>
        <label className="min-w-0 text-xs text-muted-foreground">Situação<select className="field-shell mt-1 text-sm" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as SalesPriceList["status"] })}>{Object.entries(LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Itens e preços</h3><Button type="button" variant="outline" size="sm" onClick={() => setDraft({ ...draft, items: [...draft.items, emptyItem()] })}><Plus /> Adicionar item</Button></div>
        {draft.items.map((item, index) => <div key={index} className="grid min-w-0 gap-2 rounded-xl border border-border/60 p-3 sm:grid-cols-12">
          <input className="field-shell text-sm sm:col-span-6" required placeholder="Produto ou serviço" value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} />
          <input className="field-shell text-sm sm:col-span-2" required placeholder="Unidade" value={item.unit} onChange={(event) => updateItem(index, { unit: event.target.value })} />
          <input className="field-shell text-sm sm:col-span-3" type="number" min="0" step="0.01" required placeholder="Preço" value={item.price} onChange={(event) => updateItem(index, { price: event.target.value })} />
          <div className="flex items-center justify-end sm:col-span-1">{draft.items.length > 1 ? <Button type="button" variant="ghost" size="icon" aria-label="Remover item" onClick={() => setDraft({ ...draft, items: draft.items.filter((_, itemIndex) => itemIndex !== index) })}><X /></Button> : null}</div>
        </div>)}
      </div>
      <textarea className="field-shell min-h-20 text-sm" placeholder="Observações" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
      <div className="flex min-w-0 flex-wrap gap-2"><Button className="w-full sm:w-auto" type="submit" variant="glow" disabled={saveMutation.isPending}>{saveMutation.isPending ? <Loader2 className="animate-spin" /> : "Salvar tabela"}</Button><Button className="w-full sm:w-auto" type="button" variant="outline" onClick={() => setDraft(null)}>Cancelar</Button></div>
    </form> : null}
    <div className="flex min-w-0 flex-wrap gap-3">
      <div className="relative min-w-0 flex-1 basis-full sm:basis-auto"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className="field-shell pl-9 text-sm" placeholder="Buscar tabela ou item" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      <select className="field-shell text-sm sm:w-auto" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">Todas</option><option value="draft">Rascunhos</option><option value="active">Ativas</option><option value="inactive">Inativas</option></select>
    </div>
    {query.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : visible.length === 0 ? <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">Nenhuma tabela de preços encontrada.</p> : <div className="grid min-w-0 gap-3">{visible.map((list) => <article key={list.id} className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4">
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:flex sm:flex-wrap">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><ListChecks /></span>
        <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{list.name}</h3><p className="flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" /> {date(list.valid_from)} até {list.valid_until ? date(list.valid_until) : "sem término"} • {list.items.length} item(ns)</p></div>
        <span className={list.status === "active" ? "col-span-2 justify-self-start rounded-full bg-primary/15 px-3 py-1 text-xs text-primary sm:col-span-1" : "col-span-2 justify-self-start rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground sm:col-span-1"}>{LABELS[list.status]}</span>
        {editable ? <div className="col-span-2 flex min-w-0 flex-wrap gap-2 sm:col-span-1"><select className="field-shell text-xs sm:w-auto" value={list.status} onChange={(event) => statusMutation.mutate({ id: list.id, status: event.target.value as SalesPriceList["status"] })}>{Object.entries(LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Button variant="outline" size="icon" aria-label={`Editar ${list.name}`} onClick={() => setDraft(toDraft(list))}><Pencil /></Button>{list.status !== "active" ? <Button variant="outline" size="icon" aria-label={`Excluir ${list.name}`} onClick={() => confirm(`Excluir a tabela ${list.name}?`) && deleteMutation.mutate(list.id)}><Trash2 /></Button> : null}</div> : null}
      </div>
      <ul className="mt-3 grid min-w-0 gap-1 border-t border-border/50 pt-3 text-xs text-muted-foreground">{list.items.map((item) => <li key={item.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2"><span className="truncate">{item.description} • {item.unit}</span><strong className="mobile-value text-foreground">{money.format(Number(item.price))}</strong></li>)}</ul>
      {list.notes ? <p className="mt-2 break-words text-xs text-muted-foreground/80">{list.notes}</p> : null}
    </article>)}</div>}
  </section>;
}
