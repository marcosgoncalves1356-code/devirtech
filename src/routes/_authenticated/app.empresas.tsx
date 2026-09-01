import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/module-page";

export const Route = createFileRoute("/app/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas — DeviTech ERP Agro" },
      { name: "description", content: "Cadastro de empresas, filiais e dados fiscais no ERP DeviTech." },
      { property: "og:title", content: "Empresas — DeviTech ERP Agro" },
      { property: "og:description", content: "Cadastro de empresas, filiais e dados fiscais no ERP DeviTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ModulePage slug="empresas" />,
});
