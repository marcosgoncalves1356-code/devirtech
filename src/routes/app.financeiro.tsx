import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/module-page";

export const Route = createFileRoute("/app/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — DeviTech ERP Agro" },
      { name: "description", content: "Contas a pagar e receber, fluxo de caixa e centros de custo agrícolas." },
      { property: "og:title", content: "Financeiro — DeviTech ERP Agro" },
      { property: "og:description", content: "Contas a pagar e receber, fluxo de caixa e centros de custo agrícolas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ModulePage slug="financeiro" />,
});
