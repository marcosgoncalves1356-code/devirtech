import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Loader2 } from "lucide-react";

import { listAccessLogs } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/acessos")({
  head: () => ({
    meta: [
      { title: "Acessos e auditoria — Admin DeviTech" },
      { name: "description", content: "Histórico de logins, alterações de senha e ações administrativas no ERP." },
      { property: "og:title", content: "Acessos e auditoria — Admin DeviTech" },
      { property: "og:description", content: "Auditoria de acessos e ações do ERP DeviTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLogs,
});

function AdminLogs() {
  const fetchLogs = useServerFn(listAccessLogs);
  const { data: logs = [], isLoading } = useQuery({ queryKey: ["admin-logs"], queryFn: () => fetchLogs() });

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Acessos e auditoria</h1>
          <p className="text-sm text-muted-foreground">Últimos 100 eventos registrados na plataforma.</p>
        </div>
      </header>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : logs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
          Nenhum evento registrado ainda.
        </p>
      ) : (
        <ul className="divide-y divide-border/40 rounded-2xl border border-border/60 bg-card/60">
          {logs.map((log: any) => (
            <li key={log.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary">{log.action}</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{log.detail ?? "—"}</span>
              <time className="text-xs text-muted-foreground">
                {new Date(log.created_at).toLocaleString("pt-BR")}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
