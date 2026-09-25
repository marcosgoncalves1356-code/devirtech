import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Users } from "lucide-react";

import { AccessProfilesPanel } from "@/components/access-profiles-panel";
import { ModulePermissionsPanel } from "@/components/module-permissions-panel";
import { ModuleTabs, UpcomingSubmodule } from "@/components/module-tabs";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";

export const Route = createFileRoute("/_authenticated/app/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários e permissões — DeviTech ERP Agro" },
      { name: "description", content: "Perfis e papéis de acesso por empresa no ERP DeviTech." },
      { property: "og:title", content: "Usuários e permissões — DeviTech ERP Agro" },
      { property: "og:description", content: "Perfis e papéis de acesso por empresa no ERP DeviTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersModule,
});

function UsersModule() {
  const { company, isModuleEnabled } = useCompany();
  const enabled = isModuleEnabled("usuarios");

  return (
    <div className="module-frame mx-auto w-full max-w-6xl space-y-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Users className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Usuários e permissões</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Perfis, papéis e níveis de acesso dos usuários da empresa.
          </p>
        </div>
        <span className="col-span-2 max-w-full truncate rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground sm:col-span-1">
          {company.name}
        </span>
      </header>

      {!enabled ? (
        <div className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Lock className="h-4 w-4" /> Módulo indisponível
          </p>
          <p className="text-muted-foreground">
            O módulo <strong>Usuários e permissões</strong> não está habilitado para <strong>{company.name}</strong>{" "}
            ou seu perfil não possui permissão de acesso.
          </p>
          <Button asChild variant="outline">
            <Link to="/app">Voltar ao dashboard</Link>
          </Button>
        </div>
      ) : (
        <ModuleTabs
          moduleSlug="usuarios"
          tabs={[
            { value: "profiles", label: "Perfis e papéis", content: <AccessProfilesPanel /> },
            { value: "permissions", label: "Permissões por módulo", content: <ModulePermissionsPanel /> },
            {
              value: "company-users",
              label: "Vínculo usuário x empresa",
              content: <UpcomingSubmodule name="Vínculo usuário x empresa" />,
            },
            {
              value: "audit",
              label: "Auditoria de acesso",
              content: <UpcomingSubmodule name="Auditoria de acesso" />,
            },
          ]}
        />
      )}
    </div>
  );
}
