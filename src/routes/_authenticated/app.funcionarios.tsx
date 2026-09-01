import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/module-page";

export const Route = createFileRoute("/_authenticated/_authenticated/app/funcionarios")({
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
  component: () => <ModulePage slug="funcionarios" />,
});
