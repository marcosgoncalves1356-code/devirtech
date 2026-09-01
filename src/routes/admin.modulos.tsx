import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";

import { demoCompanies } from "@/lib/company-context";
import { modules } from "@/lib/modules";

export const Route = createFileRoute("/admin/modulos")({
  head: () => ({
    meta: [
      { title: "Módulos e planos — Admin DeviTech" },
      { name: "description", content: "Liberação de módulos do ERP DeviTech por empresa cliente e por plano." },
      { property: "og:title", content: "Módulos e planos — Admin DeviTech" },
      { property: "og:description", content: "Controle quais módulos do ERP cada empresa cliente pode acessar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminModules,
});

function AdminModules() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Módulos e planos</h1>
        <p className="text-sm text-muted-foreground">
          Matriz de liberação: define quais módulos aparecem no menu de cada empresa.
        </p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/60 backdrop-blur">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="px-4 py-3 text-left">Módulo</th>
              {demoCompanies.map((c) => (
                <th key={c.id} className="px-4 py-3 text-center">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <tr key={m.slug} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 font-medium">
                    <m.icon className="h-4 w-4 text-primary" /> {m.label}
                  </span>
                </td>
                {demoCompanies.map((c) => (
                  <td key={c.id} className="px-4 py-3 text-center">
                    {c.enabledModules.includes(m.slug) ? (
                      <Check className="mx-auto h-4 w-4 text-primary" />
                    ) : (
                      <Minus className="mx-auto h-4 w-4 text-muted-foreground" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
