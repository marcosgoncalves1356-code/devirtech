import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários globais — Admin DeviTech" },
      { name: "description", content: "Gestão de usuários da plataforma DeviTech e seus vínculos com cada empresa." },
      { property: "og:title", content: "Usuários globais — Admin DeviTech" },
      { property: "og:description", content: "Usuários, papéis e vínculos por empresa no ERP DeviTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminUsers,
});

const users = [
  { name: "Marcos Gonçalves", email: "marcos@devitech.com.br", role: "Admin DeviTech", company: "Todas" },
  { name: "Ana Ribeiro", email: "ana@valeverde.com.br", role: "Gestor", company: "Agro Vale Verde" },
  { name: "Carlos Souza", email: "carlos@santarita.com.br", role: "Financeiro", company: "Fazenda Santa Rita" },
  { name: "Júlia Prado", email: "julia@serraalta.com.br", role: "Operacional", company: "Café Serra Alta" },
];

function AdminUsers() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Usuários globais</h1>
          <p className="text-sm text-muted-foreground">Papéis da plataforma e vínculo com empresas clientes.</p>
        </div>
        <Button variant="glow">
          <Plus className="mr-1 h-4 w-4" /> Convidar usuário
        </Button>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/60 backdrop-blur">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3">Empresa</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.email} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs text-primary">{u.role}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.company}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
