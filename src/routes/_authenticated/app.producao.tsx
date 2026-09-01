import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/module-page";

export const Route = createFileRoute("/_authenticated/app/producao")({
  head: () => ({
    meta: [
      { title: "Produção — DeviTech ERP Agro" },
      { name: "description", content: "Safras, ordens de serviço, aplicações, colheita e produtividade." },
      { property: "og:title", content: "Produção — DeviTech ERP Agro" },
      { property: "og:description", content: "Safras, ordens de serviço, aplicações, colheita e produtividade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ModulePage slug="producao" />,
});
