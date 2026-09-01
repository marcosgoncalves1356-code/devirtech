import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/module-page";

export const Route = createFileRoute("/_authenticated/app/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas — DeviTech ERP Agro" },
      { name: "description", content: "Clientes, contratos de comercialização, pedidos e faturamento." },
      { property: "og:title", content: "Vendas — DeviTech ERP Agro" },
      { property: "og:description", content: "Clientes, contratos de comercialização, pedidos e faturamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ModulePage slug="vendas" />,
});
