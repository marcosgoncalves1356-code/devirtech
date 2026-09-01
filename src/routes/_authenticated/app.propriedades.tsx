import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/module-page";

export const Route = createFileRoute("/_authenticated/_authenticated/app/propriedades")({
  head: () => ({
    meta: [
      { title: "Propriedades rurais — DeviTech ERP Agro" },
      { name: "description", content: "Fazendas, talhões, áreas, matrículas e arrendamentos." },
      { property: "og:title", content: "Propriedades rurais — DeviTech ERP Agro" },
      { property: "og:description", content: "Fazendas, talhões, áreas, matrículas e arrendamentos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ModulePage slug="propriedades" />,
});
