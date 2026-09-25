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
  enabledSubmodules: string[];
  logoUrl: string;
};

export type ViewAs = {
  companyId: string;
  companyName: string;
  userId?: string;
  userName?: string;
  role?: string;
  permissions?: Record<string, "none" | "view" | "edit">;
};

const EMPTY_COMPANY: Company = {
  id: "",
  name: "Sem empresa vinculada",
  document: "—",
  segment: "Solicite o vínculo ao administrador DeviTech",
  enabledModules: [],
  enabledSubmodules: [],
  logoUrl: "",
};

type CompanyContextValue = {
  session: SessionContext | null;
  loading: boolean;
  companies: Company[];
  company: Company;
  setCompanyId: (id: string) => void;
  isModuleEnabled: (slug: string) => boolean;
  canEdit: (slug: string) => boolean;
  canViewSubmodule: (moduleSlug: string, submoduleValue: string) => boolean;
  canCreate: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  refresh: () => void;
  viewAs: ViewAs | null;
  exitViewAs: () => void;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);

const STORAGE_KEY = "devitech.company";
export const VIEW_AS_KEY = "devitech.viewas";

export function startViewAs(payload: ViewAs) {
  window.localStorage.setItem(VIEW_AS_KEY, JSON.stringify(payload));
}

export function readViewAs(): ViewAs | null {
  try {
    const raw = window.localStorage.getItem(VIEW_AS_KEY);
    return raw ? (JSON.parse(raw) as ViewAs) : null;
  } catch {
    return null;
  }
}

function toCompany(c: SessionCompany): Company {
  return {
    id: c.id,
    name: c.name,
    document: c.document ?? "—",
    segment: c.segment ?? "",
    enabledModules: c.enabledModules,
    enabledSubmodules: c.enabledSubmodules,
    logoUrl: c.logoUrl ?? "",
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
  const [viewAs, setViewAsState] = useState<ViewAs | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setCompanyIdState(saved);
    setViewAsState(readViewAs());
    const onStorage = (e: StorageEvent) => {
      if (e.key === VIEW_AS_KEY) setViewAsState(readViewAs());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<CompanyContextValue>(() => {
    const session = data ?? null;
    const companies = (session?.companies ?? []).map(toCompany);
    const sessionIsAdmin = session?.isAdmin ?? false;
    const impersonating = sessionIsAdmin ? viewAs : null;

    const preferred =
      (impersonating ? companies.find((c) => c.id === impersonating.companyId) : undefined) ??
      companies.find((c) => c.id === companyId) ??
      companies.find((c) => c.id === session?.companyId) ??
      companies[0] ??
      EMPTY_COMPANY;

    const isAdmin = impersonating ? false : sessionIsAdmin;
    const perms = impersonating ? (impersonating.permissions ?? {}) : (session?.permissions ?? {});
    const hasCustomPerms = Object.keys(perms).length > 0;
    const actionPermissions = impersonating ? {} : (session?.actionPermissions ?? {});
    const hasProfilePermissions = Object.keys(actionPermissions).length > 0;

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
        if (!sessionIsAdmin && id !== session?.companyId) return;
        setCompanyIdState(id);
        window.localStorage.setItem(STORAGE_KEY, id);
      },
      isModuleEnabled,
      canEdit: (slug: string) => {
        if (isAdmin) return true;
        const granular = actionPermissions[slug];
        if (granular) return granular.canEdit;
        return !hasCustomPerms ? true : perms[slug] === "edit";
      },
      canCreate: (slug: string) => isAdmin || (actionPermissions[slug]?.canCreate ?? (!hasProfilePermissions && (!hasCustomPerms || perms[slug] === "edit"))),
      canDelete: (slug: string) => isAdmin || (actionPermissions[slug]?.canDelete ?? (!hasProfilePermissions && (!hasCustomPerms || perms[slug] === "edit"))),
      canViewSubmodule: (moduleSlug: string, submoduleValue: string) => {
        if (!isModuleEnabled(moduleSlug)) return false;
        const key = `${moduleSlug}.${submoduleValue}`;
        if (!preferred.enabledSubmodules.includes(key)) return false;
        if (isAdmin) return true;
        return actionPermissions[key]?.canView ?? actionPermissions[moduleSlug]?.canView ?? true;
      },
      refresh: () => void refetch(),
      viewAs: impersonating,
      exitViewAs: () => {
        window.localStorage.removeItem(VIEW_AS_KEY);
        setViewAsState(null);
      },
    };
  }, [data, isLoading, companyId, refetch, viewAs]);

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany deve ser usado dentro de <CompanyProvider>");
  return ctx;
}
