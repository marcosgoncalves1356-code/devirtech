import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/module-page";

export const Route = createFileRoute("/_authenticated/app/compras")({
  head: () => ({
    meta: [
      { title: "Compras — DeviTech ERP Agro" },
      { name: "description", content: "Requisições, cotações, pedidos de compra e fornecedores." },
      { property: "og:title", content: "Compras — DeviTech ERP Agro" },
      { property: "og:description", content: "Requisições, cotações, pedidos de compra e fornecedores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ModulePage slug="compras" />,
});
