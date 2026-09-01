import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/module-page";

export const Route = createFileRoute("/_authenticated/app/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — DeviTech ERP Agro" },
      { name: "description", content: "Preferências, integrações, notificações e parâmetros da empresa." },
      { property: "og:title", content: "Configurações — DeviTech ERP Agro" },
      { property: "og:description", content: "Preferências, integrações, notificações e parâmetros da empresa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ModulePage slug="configuracoes" />,
});
