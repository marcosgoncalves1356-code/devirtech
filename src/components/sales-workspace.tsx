import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, FileText, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { ModuleTabs, UpcomingSubmodule } from "@/components/module-tabs";
import { SalesBillingPanel } from "@/components/sales-billing-panel";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import {
  deleteCustomer,
  deleteSalesContract,
  listCustomers,
  listSalesContracts,
  saveCustomer,
  saveSalesContract,
  type Customer,
  type SalesContract,
} from "@/lib/sales.functions";

type CustomerDraft = {
  id?: string; name: string; tradeName: string; document: string; stateRegistration: string; contactName: string;
  phone: string; email: string; address: string; city: string; state: string; zipCode: string; category: string;
  paymentTerms: string; notes: string; status: "active" | "inactive";
};
type ContractDraft = {
  id?: string; customerId: string; contractNumber: string; startDate: string; endDate: string; product: string;
  quantity: number; unit: string; unitPrice: number; status: SalesContract["status"]; notes: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const newCustomer = (): CustomerDraft => ({
  name: "", tradeName: "", document: "", stateRegistration: "", contactName: "", phone: "", email: "",
  address: "", city: "", state: "", zipCode: "", category: "", paymentTerms: "", notes: "", status: "active",
});
const editCustomer = (c: Customer): CustomerDraft => ({
  id: c.id, name: c.name, tradeName: c.trade_name, document: c.document, stateRegistration: c.state_registration,
  contactName: c.contact_name, phone: c.phone, email: c.email, address: c.address, city: c.city, state: c.state,
  zipCode: c.zip_code, category: c.category, paymentTerms: c.payment_terms, notes: c.notes, status: c.status,
});
const newContract = (): ContractDraft => ({
  customerId: "", contractNumber: "", startDate: today(), endDate: "", product: "", quantity: 0, unit: "saca",
  unitPrice: 0, status: "draft", notes: "",
});
const editContract = (c: SalesContract): ContractDraft => ({
  id: c.id, customerId: c.customer_id, contractNumber: c.contract_number, startDate: c.start_date,
  endDate: c.end_date ?? "", product: c.product, quantity: Number(c.quantity), unit: c.unit,
  unitPrice: Number(c.unit_price), status: c.status, notes: c.notes,
});
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const statusNames: Record<SalesContract["status"], string> = {
  draft: "Rascunho", active: "Ativo", completed: "Concluído", canceled: "Cancelado",
};

export function SalesWorkspace() {
  const { company, canEdit } = useCompany();
  const qc = useQueryClient();
  const fetchCustomers = useServerFn(listCustomers);
  const fetchContracts = useServerFn(listSalesContracts);
  const saveCustomerFn = useServerFn(saveCustomer);
  const saveContractFn = useServerFn(saveSalesContract);
  const deleteCustomerFn = useServerFn(deleteCustomer);
  const deleteContractFn = useServerFn(deleteSalesContract);
  const editable = canEdit("vendas");
  const [customerDraft, setCustomerDraft] = useState<CustomerDraft | null>(null);
  const [contractDraft, setContractDraft] = useState<ContractDraft | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [contractSearch, setContractSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const customersQuery = useQuery({
    queryKey: ["sales-customers", company.id], queryFn: () => fetchCustomers({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });
  const contractsQuery = useQuery({
    queryKey: ["sales-contracts", company.id], queryFn: () => fetchContracts({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });
  const customers = customersQuery.data ?? [];
  const contracts = contractsQuery.data ?? [];
  const customerNames = new Map(customers.map((c) => [c.id, c.name]));
  const refreshCustomers = () => void qc.invalidateQueries({ queryKey: ["sales-customers", company.id] });
  const refreshContracts = () => void qc.invalidateQueries({ queryKey: ["sales-contracts", company.id] });

  const customerSave = useMutation({
    mutationFn: (d: CustomerDraft) => saveCustomerFn({ data: { ...d, companyId: company.id } }),
    onSuccess: () => { setCustomerDraft(null); setError(null); refreshCustomers(); },
    onError: (e: Error) => setError(e.message),
  });
  const contractSave = useMutation({
    mutationFn: (d: ContractDraft) => saveContractFn({
      data: { ...d, companyId: company.id, endDate: d.endDate || null },
    }),
    onSuccess: () => { setContractDraft(null); setError(null); refreshContracts(); },
    onError: (e: Error) => setError(e.message),
  });
  const customerDelete = useMutation({
    mutationFn: (id: string) => deleteCustomerFn({ data: { id, companyId: company.id } }),
    onSuccess: refreshCustomers, onError: (e: Error) => setError(e.message),
  });
  const contractDelete = useMutation({
    mutationFn: (id: string) => deleteContractFn({ data: { id, companyId: company.id } }),
    onSuccess: refreshContracts, onError: (e: Error) => setError(e.message),
  });

  const visibleCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();
    return customers.filter((c) => !term || [c.name, c.trade_name, c.document, c.contact_name, c.city].some((v) => v.toLowerCase().includes(term)));
  }, [customers, customerSearch]);
  const visibleContracts = useMemo(() => {
    const term = contractSearch.trim().toLowerCase();
    return contracts.filter((c) => !term || [c.contract_number, c.product, customerNames.get(c.customer_id) ?? ""].some((v) => v.toLowerCase().includes(term)));
  }, [contracts, contractSearch, customerNames]);

  const customerPanel = (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1"><h2 className="text-lg font-semibold">Clientes</h2><p className="text-sm text-muted-foreground">Cadastro comercial dos clientes de {company.name}.</p></div>
        {editable ? <Button variant="glow" onClick={() => { setError(null); setCustomerDraft(newCustomer()); }}><Plus className="h-4 w-4" /> Novo cliente</Button> : null}
      </div>
      {error ? <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p> : null}
      {customerDraft ? (
        <form className="space-y-4 rounded-2xl border border-primary/40 bg-card/80 p-5" onSubmit={(e) => { e.preventDefault(); customerSave.mutate(customerDraft); }}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input className="field-shell text-sm sm:col-span-2" placeholder="Razão social / nome" required minLength={2} value={customerDraft.name} onChange={(e) => setCustomerDraft({ ...customerDraft, name: e.target.value })} />
            <input className="field-shell text-sm" placeholder="Nome fantasia" value={customerDraft.tradeName} onChange={(e) => setCustomerDraft({ ...customerDraft, tradeName: e.target.value })} />
            <input className="field-shell text-sm" placeholder="CNPJ / CPF" value={customerDraft.document} onChange={(e) => setCustomerDraft({ ...customerDraft, document: e.target.value })} />
            <input className="field-shell text-sm" placeholder="Inscrição estadual" value={customerDraft.stateRegistration} onChange={(e) => setCustomerDraft({ ...customerDraft, stateRegistration: e.target.value })} />
            <input className="field-shell text-sm" placeholder="Categoria" value={customerDraft.category} onChange={(e) => setCustomerDraft({ ...customerDraft, category: e.target.value })} />
            <input className="field-shell text-sm" placeholder="Contato responsável" value={customerDraft.contactName} onChange={(e) => setCustomerDraft({ ...customerDraft, contactName: e.target.value })} />
            <input className="field-shell text-sm" placeholder="Telefone" value={customerDraft.phone} onChange={(e) => setCustomerDraft({ ...customerDraft, phone: e.target.value })} />
            <input className="field-shell text-sm" type="email" placeholder="E-mail" value={customerDraft.email} onChange={(e) => setCustomerDraft({ ...customerDraft, email: e.target.value })} />
            <input className="field-shell text-sm sm:col-span-2" placeholder="Endereço" value={customerDraft.address} onChange={(e) => setCustomerDraft({ ...customerDraft, address: e.target.value })} />
            <input className="field-shell text-sm" placeholder="Cidade" value={customerDraft.city} onChange={(e) => setCustomerDraft({ ...customerDraft, city: e.target.value })} />
            <input className="field-shell text-sm" placeholder="UF" maxLength={2} value={customerDraft.state} onChange={(e) => setCustomerDraft({ ...customerDraft, state: e.target.value.toUpperCase() })} />
            <input className="field-shell text-sm" placeholder="CEP" value={customerDraft.zipCode} onChange={(e) => setCustomerDraft({ ...customerDraft, zipCode: e.target.value })} />
            <input className="field-shell text-sm" placeholder="Condições comerciais" value={customerDraft.paymentTerms} onChange={(e) => setCustomerDraft({ ...customerDraft, paymentTerms: e.target.value })} />
            <select className="field-shell text-sm" value={customerDraft.status} onChange={(e) => setCustomerDraft({ ...customerDraft, status: e.target.value as CustomerDraft["status"] })}><option value="active">Ativo</option><option value="inactive">Inativo</option></select>
            <textarea className="field-shell min-h-20 text-sm sm:col-span-2 lg:col-span-3" placeholder="Observações" value={customerDraft.notes} onChange={(e) => setCustomerDraft({ ...customerDraft, notes: e.target.value })} />
          </div>
          <div className="flex gap-2"><Button type="submit" variant="glow" disabled={customerSave.isPending}>{customerSave.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar cliente"}</Button><Button type="button" variant="outline" onClick={() => setCustomerDraft(null)}>Cancelar</Button></div>
        </form>
      ) : null}
      <SearchField value={customerSearch} onChange={setCustomerSearch} placeholder="Buscar por nome, documento, contato ou cidade" />
      {customersQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : visibleCustomers.length === 0 ? <Empty text="Nenhum cliente encontrado." /> : (
        <div className="grid gap-3">{visibleCustomers.map((c) => <article key={c.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Building2 className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{c.name}{c.trade_name ? ` – ${c.trade_name}` : ""}</h3><p className="truncate text-xs text-muted-foreground">{[c.document, c.contact_name, c.phone, c.email].filter(Boolean).join(" • ") || "Sem dados de contato"}</p></div><Status active={c.status === "active"} />{editable ? <div className="flex gap-2"><Button variant="outline" size="icon" aria-label={`Editar ${c.name}`} onClick={() => setCustomerDraft(editCustomer(c))}><Pencil className="h-4 w-4" /></Button><Button variant="outline" size="icon" aria-label={`Excluir ${c.name}`} onClick={() => confirm(`Excluir o cliente ${c.name}?`) && customerDelete.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button></div> : null}</article>)}</div>
      )}
    </section>
  );

  const contractPanel = (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3"><div className="min-w-0 flex-1"><h2 className="text-lg font-semibold">Contratos</h2><p className="text-sm text-muted-foreground">Contratos de comercialização vinculados aos clientes.</p></div>{editable ? <Button variant="glow" onClick={() => { setError(null); setContractDraft(newContract()); }}><Plus className="h-4 w-4" /> Novo contrato</Button> : null}</div>
      {error ? <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p> : null}
      {contractDraft ? (
        <form className="space-y-4 rounded-2xl border border-primary/40 bg-card/80 p-5" onSubmit={(e) => { e.preventDefault(); contractSave.mutate(contractDraft); }}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <select className="field-shell text-sm sm:col-span-2" required value={contractDraft.customerId} onChange={(e) => setContractDraft({ ...contractDraft, customerId: e.target.value })}><option value="">Selecione o cliente</option>{customers.filter((c) => c.status === "active" || c.id === contractDraft.customerId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <input className="field-shell text-sm" required placeholder="Número do contrato" value={contractDraft.contractNumber} onChange={(e) => setContractDraft({ ...contractDraft, contractNumber: e.target.value })} />
            <label className="space-y-1 text-xs text-muted-foreground">Início<input className="field-shell w-full text-sm" type="date" required value={contractDraft.startDate} onChange={(e) => setContractDraft({ ...contractDraft, startDate: e.target.value })} /></label>
            <label className="space-y-1 text-xs text-muted-foreground">Término<input className="field-shell w-full text-sm" type="date" value={contractDraft.endDate} onChange={(e) => setContractDraft({ ...contractDraft, endDate: e.target.value })} /></label>
            <input className="field-shell text-sm" required placeholder="Produto / cultura" value={contractDraft.product} onChange={(e) => setContractDraft({ ...contractDraft, product: e.target.value })} />
            <input className="field-shell text-sm" type="number" min="0" step="0.001" placeholder="Quantidade" value={contractDraft.quantity} onChange={(e) => setContractDraft({ ...contractDraft, quantity: Number(e.target.value) })} />
            <input className="field-shell text-sm" required placeholder="Unidade" value={contractDraft.unit} onChange={(e) => setContractDraft({ ...contractDraft, unit: e.target.value })} />
            <input className="field-shell text-sm" type="number" min="0" step="0.01" placeholder="Valor unitário" value={contractDraft.unitPrice} onChange={(e) => setContractDraft({ ...contractDraft, unitPrice: Number(e.target.value) })} />
            <div className="field-shell text-sm"><span className="text-xs text-muted-foreground">Valor total</span><strong className="block">{money.format(contractDraft.quantity * contractDraft.unitPrice)}</strong></div>
            <select className="field-shell text-sm" value={contractDraft.status} onChange={(e) => setContractDraft({ ...contractDraft, status: e.target.value as SalesContract["status"] })}>{Object.entries(statusNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <textarea className="field-shell min-h-20 text-sm sm:col-span-2 lg:col-span-3" placeholder="Observações" value={contractDraft.notes} onChange={(e) => setContractDraft({ ...contractDraft, notes: e.target.value })} />
          </div>
          <div className="flex gap-2"><Button type="submit" variant="glow" disabled={contractSave.isPending || customers.length === 0}>{contractSave.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar contrato"}</Button><Button type="button" variant="outline" onClick={() => setContractDraft(null)}>Cancelar</Button></div>
        </form>
      ) : null}
      {customers.length === 0 ? <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">Cadastre um cliente antes de criar o primeiro contrato.</p> : null}
      <SearchField value={contractSearch} onChange={setContractSearch} placeholder="Buscar por contrato, cliente ou produto" />
      {contractsQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : visibleContracts.length === 0 ? <Empty text="Nenhum contrato encontrado." /> : (
        <div className="grid gap-3">{visibleContracts.map((c) => <article key={c.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><FileText className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">Contrato {c.contract_number} – {customerNames.get(c.customer_id) ?? "Cliente"}</h3><p className="truncate text-xs text-muted-foreground">{c.product} • {Number(c.quantity).toLocaleString("pt-BR")} {c.unit} • {money.format(Number(c.total))}</p><p className="text-xs text-muted-foreground/80">Início: {new Date(`${c.start_date}T12:00:00`).toLocaleDateString("pt-BR")}{c.end_date ? ` • Término: ${new Date(`${c.end_date}T12:00:00`).toLocaleDateString("pt-BR")}` : ""}</p></div><span className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary">{statusNames[c.status]}</span>{editable ? <div className="flex gap-2"><Button variant="outline" size="icon" aria-label={`Editar contrato ${c.contract_number}`} onClick={() => setContractDraft(editContract(c))}><Pencil className="h-4 w-4" /></Button><Button variant="outline" size="icon" aria-label={`Excluir contrato ${c.contract_number}`} onClick={() => confirm(`Excluir o contrato ${c.contract_number}?`) && contractDelete.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button></div> : null}</article>)}</div>
      )}
    </section>
  );

  return <ModuleTabs tabs={[
    { value: "customers", label: "Clientes", content: customerPanel },
    { value: "contracts", label: "Contratos", content: contractPanel },
    { value: "orders", label: "Pedidos de venda", content: <UpcomingSubmodule name="Pedidos de venda" /> },
    { value: "prices", label: "Tabelas de preço", content: <UpcomingSubmodule name="Tabelas de preço" /> },
    { value: "billing", label: "Faturamento", content: <SalesBillingPanel /> },
  ]} />;
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className="field-shell w-full pl-9 text-sm" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></div>;
}
function Empty({ text }: { text: string }) { return <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">{text}; </p>; }
function Status({ active }: { active: boolean }) { return <span className={active ? "rounded-full bg-primary/15 px-3 py-1 text-xs text-primary" : "rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"}>{active ? "Ativo" : "Inativo"}</span>; }
