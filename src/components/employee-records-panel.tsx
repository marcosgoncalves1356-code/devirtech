import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { deleteEmployee, listEmployees, saveEmployee, type Employee } from "@/lib/employees.functions";
import {
  listDepartments,
  listJobPositions,
  type Department,
  type JobPosition,
} from "@/lib/org-structure.functions";


type Draft = {
  id?: string;
  fullName: string;
  cpf: string;
  rg: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  jobTitle: string;
  department: string;
  contractType: "clt" | "safrista" | "temporario" | "diarista" | "estagio" | "pj";
  admissionDate: string;
  terminationDate: string;
  salary: string;
  allocation: string;
  notes: string;
  status: "active" | "inactive";
};

const contractLabels: Record<Draft["contractType"], string> = {
  clt: "CLT",
  safrista: "Safrista",
  temporario: "Temporário",
  diarista: "Diarista",
  estagio: "Estágio",
  pj: "Prestador (PJ)",
};

function emptyDraft(): Draft {
  return {
    fullName: "",
    cpf: "",
    rg: "",
    birthDate: "",
    phone: "",
    email: "",
    address: "",
    jobTitle: "",
    department: "",
    contractType: "clt",
    admissionDate: "",
    terminationDate: "",
    salary: "",
    allocation: "",
    notes: "",
    status: "active",
  };
}

function toDraft(e: Employee): Draft {
  return {
    id: e.id,
    fullName: e.full_name,
    cpf: e.cpf ?? "",
    rg: e.rg ?? "",
    birthDate: e.birth_date ?? "",
    phone: e.phone ?? "",
    email: e.email ?? "",
    address: e.address ?? "",
    jobTitle: e.job_title ?? "",
    department: e.department ?? "",
    contractType: (e.contract_type as Draft["contractType"]) ?? "clt",
    admissionDate: e.admission_date ?? "",
    terminationDate: e.termination_date ?? "",
    salary: e.salary ? String(e.salary) : "",
    allocation: e.allocation ?? "",
    notes: e.notes ?? "",
    status: (e.status as Draft["status"]) ?? "active",
  };
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function EmployeeRecordsPanel() {
  const { company, canEdit } = useCompany();
  const qc = useQueryClient();
  const fetchEmployees = useServerFn(listEmployees);
  const save = useServerFn(saveEmployee);
  const remove = useServerFn(deleteEmployee);
  const fetchDepartments = useServerFn(listDepartments);
  const fetchPositions = useServerFn(listJobPositions);
  const editable = canEdit("funcionarios");


  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees", company.id],
    queryFn: () => fetchEmployees({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", company.id],
    queryFn: () => fetchDepartments({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });
  const { data: positions = [] } = useQuery({
    queryKey: ["job-positions", company.id],
    queryFn: () => fetchPositions({ data: { companyId: company.id } }),
    enabled: Boolean(company.id),
  });

  const departmentNames = (departments as Department[])
    .filter((d) => d.status === "active")
    .map((d) => d.name);
  const positionNames = (positions as JobPosition[]).filter((p) => p.status === "active").map((p) => p.name);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["employees", company.id] });


  const saveMutation = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          id: d.id,
          companyId: company.id,
          fullName: d.fullName,
          cpf: d.cpf,
          rg: d.rg,
          birthDate: d.birthDate || null,
          phone: d.phone,
          email: d.email,
          address: d.address,
          jobTitle: d.jobTitle,
          department: d.department,
          contractType: d.contractType,
          admissionDate: d.admissionDate || null,
          terminationDate: d.terminationDate || null,
          salary: d.salary ? Number(d.salary) : 0,
          allocation: d.allocation,
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

  const term = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      (employees as Employee[]).filter(
        (e) =>
          !term ||
          [e.full_name, e.cpf, e.job_title, e.department, e.allocation].some((v) =>
            (v ?? "").toLowerCase().includes(term),
          ),
      ),
    [employees, term],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Ficha do colaborador</h2>
          <p className="text-sm text-muted-foreground">
            Cadastro e edição das fichas dos colaboradores de {company.name}.
          </p>
        </div>
        {editable ? (
          <Button variant="glow" onClick={() => setDraft(emptyDraft())}>
            <Plus className="h-4 w-4" /> Novo colaborador
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
              placeholder="Nome completo"
              value={draft.fullName}
              onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
              required
              minLength={3}
            />
            <input
              className="field-shell text-sm"
              placeholder="CPF"
              value={draft.cpf}
              onChange={(e) => setDraft({ ...draft, cpf: e.target.value })}
            />
            <input
              className="field-shell text-sm"
              placeholder="RG"
              value={draft.rg}
              onChange={(e) => setDraft({ ...draft, rg: e.target.value })}
            />
            <label className="grid gap-1 text-xs text-muted-foreground">
              Data de nascimento
              <input
                className="field-shell text-sm"
                type="date"
                value={draft.birthDate}
                onChange={(e) => setDraft({ ...draft, birthDate: e.target.value })}
              />
            </label>
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
            <select
              className="field-shell text-sm"
              value={draft.jobTitle}
              onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })}
            >
              <option value="">Cargo…</option>
              {positionNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              {draft.jobTitle && !positionNames.includes(draft.jobTitle) ? (
                <option value={draft.jobTitle}>{draft.jobTitle}</option>
              ) : null}
            </select>
            <select
              className="field-shell text-sm"
              value={draft.department}
              onChange={(e) => setDraft({ ...draft, department: e.target.value })}
            >
              <option value="">Departamento / setor…</option>
              {departmentNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              {draft.department && !departmentNames.includes(draft.department) ? (
                <option value={draft.department}>{draft.department}</option>
              ) : null}
            </select>

            <select
              className="field-shell text-sm"
              value={draft.contractType}
              onChange={(e) => setDraft({ ...draft, contractType: e.target.value as Draft["contractType"] })}
            >
              {Object.entries(contractLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="grid gap-1 text-xs text-muted-foreground">
              Admissão
              <input
                className="field-shell text-sm"
                type="date"
                value={draft.admissionDate}
                onChange={(e) => setDraft({ ...draft, admissionDate: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              Desligamento
              <input
                className="field-shell text-sm"
                type="date"
                value={draft.terminationDate}
                onChange={(e) => setDraft({ ...draft, terminationDate: e.target.value })}
              />
            </label>
            <input
              className="field-shell text-sm"
              type="number"
              step="0.01"
              min="0"
              placeholder="Salário (R$)"
              value={draft.salary}
              onChange={(e) => setDraft({ ...draft, salary: e.target.value })}
            />
            <input
              className="field-shell text-sm"
              placeholder="Alocação (fazenda / talhão)"
              value={draft.allocation}
              onChange={(e) => setDraft({ ...draft, allocation: e.target.value })}
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
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar ficha"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="field-shell w-full pl-9 text-sm"
          placeholder="Buscar por nome, CPF, cargo ou alocação"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
          Nenhum colaborador cadastrado ainda.
        </p>
      ) : (
        <div className="grid gap-3">
          {visible.map((e) => (
            <article
              key={e.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">{e.full_name}</h3>
                <p className="truncate text-xs text-muted-foreground">
                  {[e.job_title, e.department, contractLabels[(e.contract_type as Draft["contractType"]) ?? "clt"]]
                    .filter(Boolean)
                    .join(" • ")}
                  {e.salary ? ` • ${currency.format(Number(e.salary))}` : ""}
                  {e.allocation ? ` • ${e.allocation}` : ""}
                </p>
              </div>
              <span
                className={
                  e.status === "active"
                    ? "rounded-full bg-primary/15 px-3 py-1 text-xs text-primary"
                    : "rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                }
              >
                {e.status === "active" ? "Ativo" : "Inativo"}
              </span>
              {editable ? (
                <>
                  <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setDraft(toDraft(e))}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir"
                    onClick={async () => {
                      if (!window.confirm(`Excluir a ficha de ${e.full_name}?`)) return;
                      try {
                        await remove({ data: { id: e.id } });
                        invalidate();
                      } catch (err) {
                        setError((err as Error).message);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
