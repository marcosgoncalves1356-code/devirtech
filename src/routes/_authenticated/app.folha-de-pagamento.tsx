import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/module-page";

export const Route = createFileRoute("/_authenticated/app/folha-de-pagamento")({
  head: () => ({
    meta: [
      { title: "Folha de pagamento — DeviTech ERP Agro" },
      { name: "description", content: "Apuração de folha, encargos, holerites e integração financeira." },
      { property: "og:title", content: "Folha de pagamento — DeviTech ERP Agro" },
      { property: "og:description", content: "Apuração de folha, encargos, holerites e integração financeira." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ModulePage slug="folha-de-pagamento" />,
});
