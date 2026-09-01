import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getSessionContext, type SessionCompany, type SessionContext } from "@/lib/session.functions";

export type Company = {
  id: string;
  name: string;
  document: string;
  segment: string;
  enabledModules: string[];
};

const EMPTY_COMPANY: Company = {
  id: "",
  name: "Sem empresa vinculada",
  document: "—",
  segment: "Solicite o vínculo ao administrador DeviTech",
  enabledModules: [],
};

type CompanyContextValue = {
  session: SessionContext | null;
  loading: boolean;
  companies: Company[];
  company: Company;
  setCompanyId: (id: string) => void;
  isModuleEnabled: (slug: string) => boolean;
  canEdit: (slug: string) => boolean;
  refresh: () => void;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);

const STORAGE_KEY = "devitech.company";

function toCompany(c: SessionCompany): Company {
  return {
    id: c.id,
    name: c.name,
    document: c.document ?? "—",
    segment: c.segment ?? "",
    enabledModules: c.enabledModules,
  };
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const fetchSession = useServerFn(getSessionContext);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["session-context"],
    queryFn: () => fetchSession(),
    staleTime: 30_000,
  });

  const [companyId, setCompanyIdState] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setCompanyIdState(saved);
  }, []);

  const value = useMemo<CompanyContextValue>(() => {
    const session = data ?? null;
    const companies = (session?.companies ?? []).map(toCompany);
    const preferred =
      companies.find((c) => c.id === companyId) ??
      companies.find((c) => c.id === session?.companyId) ??
      companies[0] ??
      EMPTY_COMPANY;

    const isAdmin = session?.isAdmin ?? false;
    const perms = session?.permissions ?? {};
    const hasCustomPerms = Object.keys(perms).length > 0;

    const isModuleEnabled = (slug: string) => {
      if (!preferred.enabledModules.includes(slug)) return false;
      if (isAdmin) return true;
      if (!hasCustomPerms) return true;
      return (perms[slug] ?? "none") !== "none";
    };

    return {
      session,
      loading: isLoading,
      companies,
      company: preferred,
      setCompanyId: (id: string) => {
        if (!isAdmin && id !== session?.companyId) return;
        setCompanyIdState(id);
        window.localStorage.setItem(STORAGE_KEY, id);
      },
      isModuleEnabled,
      canEdit: (slug: string) => (isAdmin ? true : !hasCustomPerms ? true : perms[slug] === "edit"),
      refresh: () => void refetch(),
    };
  }, [data, isLoading, companyId, refetch]);

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany deve ser usado dentro de <CompanyProvider>");
  return ctx;
}
