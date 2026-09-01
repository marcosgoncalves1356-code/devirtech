import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/module-page";

export const Route = createFileRoute("/_authenticated/app/veiculos")({
  head: () => ({
    meta: [
      { title: "Veículos e combustível — DeviTech ERP Agro" },
      { name: "description", content: "Frota, máquinas, abastecimentos, manutenção e custo por hora." },
      { property: "og:title", content: "Veículos e combustível — DeviTech ERP Agro" },
      { property: "og:description", content: "Frota, máquinas, abastecimentos, manutenção e custo por hora." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ModulePage slug="veiculos" />,
});
