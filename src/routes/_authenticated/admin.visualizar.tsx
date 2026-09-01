import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, Loader2, Search, Smartphone, Monitor, UserRound, Building2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { startViewAs } from "@/lib/company-context";
import { getCompanyDetail, listCompanies } from "@/lib/admin.functions";
import { modules } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/admin/visualizar")({
  head: () => ({
    meta: [
      { title: "Visualizar como empresa — DeviTech Admin" },
      {
        name: "description",
        content: "Selecione uma empresa ou usuário e navegue no ERP exatamente como eles enxergam, na web ou no app.",
      },
      { property: "og:title", content: "Visualizar como empresa — DeviTech Admin" },
      {
        property: "og:description",
        content: "Simulação de acesso por empresa e usuário respeitando módulos e permissões.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ViewAsPage,
});

type Level = "none" | "view" | "edit";

function ViewAsPage() {
  const navigate = useNavigate();
  const fetchCompanies = useServerFn(listCompanies);
  const fetchDetail = useServerFn(getCompanyDetail);

  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const companiesQuery = useQuery({ queryKey: ["admin-companies"], queryFn: () => fetchCompanies() });
  const detailQuery = useQuery({
    queryKey: ["admin-company-detail", selected],
    queryFn: () => fetchDetail({ data: { id: selected as string } }),
    enabled: Boolean(selected),
  });

  const companies = useMemo(() => {
    const list = (companiesQuery.data ?? []) as any[];
    const t = term.trim().toLowerCase();
    if (!t) return list;
    return list.filter((c) =>
      [c.name, c.document, c.responsible].filter(Boolean).some((v: string) => v.toLowerCase().includes(t)),
    );
  }, [companiesQuery.data, term]);

  const detail = detailQuery.data as any;

  function enter(companyId: string, companyName: string, user?: any) {
    startViewAs({
      companyId,
      companyName,
      userId: user?.id,
      userName: user?.full_name || user?.username,
      role: user?.role,
      permissions: (user?.permissions ?? undefined) as Record<string, Level> | undefined,
    });
    navigate({ to: "/app" });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400">
          <Eye className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Visualizar como empresa</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Entre no ERP com a visão exata de qualquer empresa cliente — respeitando módulos contratados e o nível de
            permissão de cada usuário. A mesma sessão funciona na versão web e no aplicativo instalado.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
          <Monitor className="h-3.5 w-3.5" /> Web
          <span className="text-border">•</span>
          <Smartphone className="h-3.5 w-3.5" /> App
        </div>
      </header>

      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 sm:max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar empresa por nome, CNPJ ou responsável"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {companiesQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando empresas…
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="space-y-3">
            {companies.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada.</p>
            ) : (
              companies.map((c: any) => {
                const active = selected === c.id;
                const enabled: string[] = c.enabled_modules ?? [];
                return (
                  <article
                    key={c.id}
                    className={`rounded-2xl border p-4 transition-colors ${
                      active ? "border-primary/60 bg-primary/5" : "border-border/60 bg-card/60"
                    }`}
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                        <Building2 className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.document || "sem CNPJ"} • {enabled.length} módulos ativos
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.65rem] ${
                          c.status === "active"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {c.status === "active" ? "Ativa" : "Bloqueada"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => enter(c.id, c.name)}>
                        <Eye className="mr-1 h-4 w-4" /> Ver como empresa
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSelected(active ? null : c.id)}>
                        {active ? "Ocultar usuários" : "Ver como usuário"}
                      </Button>
                    </div>
                  </article>
                );
              })
            )}
          </section>

          <section className="rounded-2xl border border-border/60 bg-card/60 p-4">
            {!selected ? (
              <p className="text-sm text-muted-foreground">
                Selecione uma empresa para simular o acesso de um usuário específico.
              </p>
            ) : detailQuery.isLoading || !detail ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando usuários…
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold">{detail.company.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    Módulos contratados:{" "}
                    {(detail.company.enabled_modules ?? [])
                      .map((s: string) => modules.find((m) => m.slug === s)?.label ?? s)
                      .join(", ") || "nenhum"}
                  </p>
                </div>
                {detail.users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum usuário vinculado a esta empresa.</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.users.map((u: any) => (
                      <li
                        key={u.id}
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-border/50 px-3 py-2"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
                          <UserRound className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{u.full_name || u.username}</p>
                          <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                            <ShieldCheck className="h-3 w-3" /> {u.role} • @{u.username}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => enter(detail.company.id, detail.company.name, u)}
                        >
                          <Eye className="mr-1 h-4 w-4" /> Ver como
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
