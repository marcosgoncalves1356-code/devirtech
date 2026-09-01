import { createFileRoute } from "@tanstack/react-router";

import { ModulePage } from "@/components/module-page";

export const Route = createFileRoute("/_authenticated/_authenticated/app/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários e permissões — DeviTech ERP Agro" },
      { name: "description", content: "Perfis, permissões por módulo e vínculo de usuários por empresa." },
      { property: "og:title", content: "Usuários e permissões — DeviTech ERP Agro" },
      { property: "og:description", content: "Perfis, permissões por módulo e vínculo de usuários por empresa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ModulePage slug="usuarios" />,
});
