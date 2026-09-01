import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/_authenticated/admin/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte — Admin DeviTech" },
      { name: "description", content: "Central de chamados de suporte das empresas clientes do ERP DeviTech." },
      { property: "og:title", content: "Suporte — Admin DeviTech" },
      { property: "og:description", content: "Acompanhe e responda chamados das empresas clientes DeviTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminSupport,
});

const tickets = [
  { id: "#1042", title: "Erro ao importar notas de compra", company: "Agro Vale Verde", status: "Aberto" },
  { id: "#1039", title: "Solicitação de módulo Folha", company: "Café Serra Alta", status: "Em análise" },
  { id: "#1035", title: "Ajuste de permissão de usuário", company: "Fazenda Santa Rita", status: "Resolvido" },
];

function AdminSupport() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Suporte</h1>
          <p className="text-sm text-muted-foreground">Chamados abertos pelas empresas clientes.</p>
        </div>
        <Button variant="glow">
          <Plus className="mr-1 h-4 w-4" /> Novo chamado
        </Button>
      </header>

      <ul className="space-y-3">
        {tickets.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <LifeBuoy className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {t.id} — {t.title}
              </p>
              <p className="text-xs text-muted-foreground">{t.company}</p>
            </div>
            <span className="rounded-full border border-border/60 px-2.5 py-0.5 text-xs text-muted-foreground">
              {t.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
