import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/module-page";

export const Route = createFileRoute("/_authenticated/app/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — DeviTech ERP Agro" },
      { name: "description", content: "Relatórios gerenciais, DRE por safra, custo por talhão e exportações." },
      { property: "og:title", content: "Relatórios — DeviTech ERP Agro" },
      { property: "og:description", content: "Relatórios gerenciais, DRE por safra, custo por talhão e exportações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ModulePage slug="relatorios" />,
});
