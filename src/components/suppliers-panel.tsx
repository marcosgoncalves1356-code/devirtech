import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { deleteSupplier, listSuppliers, saveSupplier, type Supplier } from "@/lib/suppliers.functions";

type Draft = {
  id?: string;
  name: string;
  tradeName: string;
  document: string;
  stateRegistration: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  category: string;
  paymentTerms: string;
  bankInfo: string;
  notes: string;
  status: "active" | "inactive";
};

function emptyDraft(): Draft {
  return {
    name: "",
    tradeName: "",
    document: "",
    stateRegistration: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    category: "",
    paymentTerms: "",
    bankInfo: "",
    notes: "",
    status: "active",
  };
}

function toDraft(s: Supplier): Draft {
  return {
    id: s.id,
    name: s.name ?? "",
    tradeName: s.trade_name ?? "",
    document: s.document ?? "",
    stateRegistration: s.state_registration ?? "",
    contactName: s.contact_name ?? "",
    phone: s.phone ?? "",
    email: s.email ?? "",
    address: s.address ?? "",
    city: s.city ?? "",
    state: s.state ?? "",
    zipCode: s.zip_code ?? "",
    category: s.category ?? "",
    paymentTerms: s.payment_terms ?? "",
    bankInfo: s.bank_info ?? "",
    notes: s.notes ?? "",
    status: (s.status as Draft["status"]) ?? "active",
  };
}

export function SuppliersPanel() {
  const { company, canEdit } = useCompany();
  const qc = useQueryClient();
  const fetchSuppliers = useServerFn(listSuppliers);
  const save = useServerFn(saveSupplier);
  const remove = useServerFn(deleteSupplier);
  const editable = canEdit("compras");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [error, setError] = useState<string | null>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers", company.id],
    queryFn: () => fetchSuppliers({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["suppliers", company.id] });

  const saveMutation = useMutation({
    mutationFn: (d: Draft) => save({ data: { ...d, companyId: company.id } }),
    onSuccess: () => {
      setDraft(null);
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const rows = suppliers as Supplier[];
  const term = search.trim().toLowerCase();

  const visible = useMemo(
    () =>
      rows.filter((s) => {
        if (filter !== "all" && s.status !== filter) return false;
        if (!term) return true;
        return [s.name, s.trade_name, s.document, s.category, s.contact_name, s.city, s.email].some((v) =>
          (v ?? "").toLowerCase().includes(term),
        );
      }),
    [rows, term, filter],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Fornecedores</h2>
          <p className="text-sm text-muted-foreground">
            Cadastro, edição e consulta dos fornecedores de {company.name}, prontos para uso em pedidos de compra e
            contas a pagar.
          </p>
        </div>
        {editable ? (
          <Button variant="glow" onClick={() => setDraft(emptyDraft())}>
            <Plus className="h-4 w-4" /> Novo fornecedor
          </Button>
        ) : null}
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
              placeholder="Razão social / nome"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
              minLength={2}
            />
            <input
              className="field-shell text-sm"
              placeholder="Nome fantasia"
              value={draft.tradeName}
              onChange={(e) => setDraft({ ...draft, tradeName: e.target.value })}
            />
            <input
              className="field-shell text-sm"
              placeholder="CNPJ / CPF"
              value={draft.document}
              onChange={(e) => setDraft({ ...draft, document: e.target.value })}
            />
            <input
              className="field-shell text-sm"
              placeholder="Inscrição estadual"
              value={draft.stateRegistration}
              onChange={(e) => setDraft({ ...draft, stateRegistration: e.target.value })}
            />
            <input
              className="field-shell text-sm"
              placeholder="Categoria (insumos, combustível…)"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            />
            <input
              className="field-shell text-sm"
              placeholder="Contato responsável"
              value={draft.contactName}
              onChange={(e) => setDraft({ ...draft, contactName: e.target.value })}
            />
            <input
              className="field-shell text-sm"
              placeholder="Telefone"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
            <input
              className="field-shell text-sm"
              type="email"
              placeholder="E-mail"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
            <input
              className="field-shell text-sm sm:col-span-2"
              placeholder="Endereço"
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            />
            <input
              className="field-shell text-sm"
              placeholder="Cidade"
              value={draft.city}
              onChange={(e) => setDraft({ ...draft, city: e.target.value })}
            />
            <input
              className="field-shell text-sm"
              placeholder="UF"
              maxLength={2}
              value={draft.state}
              onChange={(e) => setDraft({ ...draft, state: e.target.value.toUpperCase() })}
            />
            <input
              className="field-shell text-sm"
              placeholder="CEP"
              value={draft.zipCode}
              onChange={(e) => setDraft({ ...draft, zipCode: e.target.value })}
            />
            <input
              className="field-shell text-sm"
              placeholder="Condições de pagamento (30/60 dias…)"
              value={draft.paymentTerms}
              onChange={(e) => setDraft({ ...draft, paymentTerms: e.target.value })}
            />
            <input
              className="field-shell text-sm sm:col-span-2"
              placeholder="Dados bancários (banco, agência, conta, PIX)"
              value={draft.bankInfo}
              onChange={(e) => setDraft({ ...draft, bankInfo: e.target.value })}
            />
            <select
              className="field-shell text-sm"
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft["status"] })}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
            <textarea
              className="field-shell min-h-20 text-sm sm:col-span-2 lg:col-span-3"
              placeholder="Observações"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="glow" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar fornecedor"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="field-shell w-full pl-9 text-sm"
            placeholder="Buscar por nome, CNPJ, categoria ou cidade"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="field-shell text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
          Nenhum fornecedor encontrado.
        </p>
      ) : (
        <div className="grid gap-3">
          {visible.map((s) => (
            <article
              key={s.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">
                  {s.name}
                  {s.trade_name ? ` — ${s.trade_name}` : ""}
                </h3>
                <p className="truncate text-xs text-muted-foreground">
                  {[s.document, s.category, s.contact_name, s.phone, s.email].filter(Boolean).join(" • ") ||
                    "Sem dados de contato"}
                </p>
                <p className="truncate text-xs text-muted-foreground/80">
                  {[[s.city, s.state].filter(Boolean).join("/"), s.payment_terms, s.bank_info]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              </div>
              <span
                className={
                  s.status === "active"
                    ? "rounded-full bg-primary/15 px-3 py-1 text-xs text-primary"
                    : "rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                }
              >
                {s.status === "active" ? "Ativo" : "Inativo"}
              </span>
              {editable ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDraft(toDraft(s))}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Excluir o fornecedor ${s.name}?`)) removeMutation.mutate(s.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
