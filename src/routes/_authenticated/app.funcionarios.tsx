import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Users } from "lucide-react";

import { EmployeeRecordsPanel } from "@/components/employee-records-panel";
import { OrgStructurePanel } from "@/components/org-structure-panel";
import { ModuleTabs, UpcomingSubmodule } from "@/components/module-tabs";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { getModule } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/app/funcionarios")({
  head: () => ({
    meta: [
      { title: "Funcionários — DeviTech ERP Agro" },
      { name: "description", content: "Cadastro de colaboradores, cargos, documentos e alocação." },
      { property: "og:title", content: "Funcionários — DeviTech ERP Agro" },
      { property: "og:description", content: "Cadastro de colaboradores, cargos, documentos e alocação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmployeesModule,
});

function EmployeesModule() {
  const { company, isModuleEnabled } = useCompany();
  const mod = getModule("funcionarios");
  const enabled = isModuleEnabled("funcionarios");
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Users className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Funcionários</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {mod?.description ?? "Cadastro de colaboradores, cargos, documentos e alocação."}
          </p>
        </div>
        <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
          {company.name}
        </span>
      </header>

      {!enabled ? (
        <div className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Lock className="h-4 w-4" /> Módulo indisponível
          </p>
          <p className="text-muted-foreground">
            O módulo <strong>Funcionários</strong> não está habilitado para <strong>{company.name}</strong> ou seu
            perfil não possui permissão de acesso.
          </p>
          <Button asChild variant="outline">
            <Link to="/app">Voltar ao dashboard</Link>
          </Button>
        </div>
      ) : (
        <ModuleTabs
          tabs={[
            { value: "records", label: "Ficha do colaborador", content: <EmployeeRecordsPanel /> },
            { value: "structure", label: "Cargos e departamentos", content: <OrgStructurePanel /> },
            {
              value: "documents",
              label: "Documentos e admissão",
              content: <UpcomingSubmodule name="Documentos e admissão" />,
            },
            {
              value: "allocation",
              label: "Escalas e alocação",
              content: <UpcomingSubmodule name="Escalas e alocação" />,
            },
          ]}
        />
      )}
    </div>
  );
}
