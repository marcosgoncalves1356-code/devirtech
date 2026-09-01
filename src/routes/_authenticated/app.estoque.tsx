import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/module-page";

export const Route = createFileRoute("/_authenticated/_authenticated/app/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque e insumos — DeviTech ERP Agro" },
      { name: "description", content: "Controle de insumos, defensivos, sementes e peças por depósito." },
      { property: "og:title", content: "Estoque e insumos — DeviTech ERP Agro" },
      { property: "og:description", content: "Controle de insumos, defensivos, sementes e peças por depósito." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ModulePage slug="estoque" />,
});
