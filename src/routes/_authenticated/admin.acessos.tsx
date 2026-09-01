import { createFileRoute } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_authenticated/admin/acessos")({
  head: () => ({
    meta: [
      { title: "Acessos e auditoria — Admin DeviTech" },
      { name: "description", content: "Histórico de acessos, sessões e auditoria de ações na plataforma DeviTech." },
      { property: "og:title", content: "Acessos e auditoria — Admin DeviTech" },
      { property: "og:description", content: "Acompanhe logins, sessões ativas e trilha de auditoria do ERP DeviTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminAccess,
});

const logs = [
  { user: "ana@valeverde.com.br", action: "Login realizado", when: "Hoje, 08:12", ip: "189.4.22.10" },
  { user: "carlos@santarita.com.br", action: "Exportou relatório financeiro", when: "Ontem, 17:40", ip: "177.9.55.2" },
  { user: "marcos@devitech.com.br", action: "Habilitou módulo Folha", when: "Ontem, 09:05", ip: "201.17.3.88" },
];

function AdminAccess() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Acessos e auditoria</h1>
        <p className="text-sm text-muted-foreground">Trilha de auditoria por empresa, usuário e ação.</p>
      </header>

      <ul className="space-y-3">
        {logs.map((l, i) => (
          <li
            key={i}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <KeyRound className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{l.action}</p>
              <p className="text-xs text-muted-foreground">
                {l.user} • IP {l.ip}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{l.when}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
