import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Company = {
  id: string;
  name: string;
  document: string;
  segment: string;
  /** Módulos habilitados (slugs). Controlado pela área administrativa DeviTech. */
  enabledModules: string[];
};

/**
 * Dados de demonstração. Quando o backend for ligado, substituir por uma query
 * das empresas às quais o usuário autenticado tem vínculo (isolamento por empresa).
 */
export const demoCompanies: Company[] = [
  {
    id: "agro-vale-verde",
    name: "Agro Vale Verde",
    document: "12.345.678/0001-90",
    segment: "Grãos • Soja e milho",
    enabledModules: "dashboard empresas usuarios funcionarios financeiro compras estoque vendas folha-de-pagamento veiculos propriedades producao relatorios configuracoes".split(" "),
  },
  {
    id: "fazenda-santa-rita",
    name: "Fazenda Santa Rita",
    document: "98.765.432/0001-10",
    segment: "Pecuária de corte",
    enabledModules: "dashboard empresas usuarios funcionarios financeiro compras estoque vendas veiculos propriedades producao relatorios configuracoes".split(" "),
  },
  {
    id: "cafe-serra-alta",
    name: "Café Serra Alta",
    document: "45.678.912/0001-33",
    segment: "Café especial",
    enabledModules: "dashboard empresas usuarios funcionarios financeiro estoque vendas propriedades producao relatorios configuracoes".split(" "),
  },
];

type CompanyContextValue = {
  companies: Company[];
  company: Company;
  setCompanyId: (id: string) => void;
  isModuleEnabled: (slug: string) => boolean;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);

const STORAGE_KEY = "devitech.company";

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companyId, setCompanyIdState] = useState<string>(demoCompanies[0]!.id);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && demoCompanies.some((c) => c.id === saved)) setCompanyIdState(saved);
  }, []);

  const value = useMemo<CompanyContextValue>(() => {
    const company = demoCompanies.find((c) => c.id === companyId) ?? demoCompanies[0]!;
    return {
      companies: demoCompanies,
      company,
      setCompanyId: (id: string) => {
        setCompanyIdState(id);
        window.localStorage.setItem(STORAGE_KEY, id);
      },
      isModuleEnabled: (slug: string) => company.enabledModules.includes(slug),
    };
  }, [companyId]);

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany deve ser usado dentro de <CompanyProvider>");
  return ctx;
}
