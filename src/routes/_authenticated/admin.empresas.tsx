import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { demoCompanies } from "@/lib/company-context";
import { modules } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/admin/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas clientes — Admin DeviTech" },
      { name: "description", content: "Gestão das empresas clientes do ERP DeviTech, com dados isolados por empresa." },
      { property: "og:title", content: "Empresas clientes — Admin DeviTech" },
      { property: "og:description", content: "Cadastro e controle das empresas atendidas pela plataforma DeviTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminCompanies,
});

function AdminCompanies() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Empresas clientes</h1>
          <p className="text-sm text-muted-foreground">Cada empresa possui base de dados e usuários isolados.</p>
        </div>
        <Button variant="glow">
          <Plus className="mr-1 h-4 w-4" /> Nova empresa
        </Button>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/60 backdrop-blur">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">CNPJ</th>
              <th className="px-4 py-3">Segmento</th>
              <th className="px-4 py-3">Módulos</th>
            </tr>
          </thead>
          <tbody>
            {demoCompanies.map((c) => (
              <tr key={c.id} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.document}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.segment}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.enabledModules.length} de {modules.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
