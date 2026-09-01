import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Loader2, Sparkles } from "lucide-react";

import logo from "@/assets/devitech-logo.png";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { markWelcomeSeen } from "@/lib/session.functions";

export function greetingFor(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function WelcomeScreen() {
  const { session, company, refresh, viewAs } = useCompany();
  const qc = useQueryClient();
  const confirm = useServerFn(markWelcomeSeen);

  const mutation = useMutation({
    mutationFn: () => confirm({}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["session-context"] });
      refresh();
    },
  });

  if (!session || session.welcomeSeen || viewAs) return null;

  const firstName = (session.fullName || session.email).split(" ")[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-background/95 p-4 backdrop-blur-xl">
      <div className="tech-backdrop w-full max-w-lg rounded-3xl border border-primary/30 bg-card/90 p-8 text-center shadow-2xl">
        <div className="flex items-center justify-center gap-2">
          <img src={logo} alt="DeviTech" className="h-9 w-9" />
          <span className="text-lg font-semibold tracking-tight">
            Devi<span className="text-primary">Tech</span>
          </span>
        </div>

        <div className="my-7 flex flex-col items-center gap-3">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-border/60 bg-background">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={`Logo ${company.name}`} className="h-full w-full object-contain" />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{company.name}</h1>
          {company.segment ? <p className="text-xs text-muted-foreground">{company.segment}</p> : null}
        </div>

        <p className="text-2xl font-semibold tracking-tight">👋 Bem-vindo, {firstName}!</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Este é o seu ERP DeviTech. Todos os módulos liberados para a sua empresa já estão disponíveis no menu, tanto
          no navegador quanto no aplicativo.
        </p>

        <Button
          variant="glow"
          className="mt-7 w-full"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Começar a usar
        </Button>
      </div>
    </div>
  );
}
