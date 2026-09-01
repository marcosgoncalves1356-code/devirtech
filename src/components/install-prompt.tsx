import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

import { Button } from "@/components/ui/button";
import icon from "@/assets/devitech-logo.png";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "devitech.install.dismissed";

function isStandalone() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", () => setVisible(false));

    // iOS não dispara beforeinstallprompt: mostramos as instruções manuais.
    let timer: number | undefined;
    if (isIos()) {
      timer = window.setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 1500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    window.localStorage.setItem(DISMISS_KEY, "1");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    if (choice.outcome === "dismissed") window.localStorage.setItem(DISMISS_KEY, "1");
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="install-title"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-primary/40 bg-card/95 p-4 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:inset-x-auto sm:right-4"
    >
      <div className="flex items-start gap-3">
        <img src={icon} alt="" aria-hidden="true" className="h-11 w-11 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h2 id="install-title" className="text-sm font-semibold">
            Instalar o app DeviTech
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {iosHint ? (
              <>
                No Safari, toque em <Share className="inline h-3.5 w-3.5" aria-label="Compartilhar" /> e escolha
                “Adicionar à Tela de Início”.
              </>
            ) : (
              "Acesse o ERP direto da tela inicial, em tela cheia e com uso offline básico."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar aviso de instalação"
          className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!iosHint ? (
        <div className="mt-3 flex gap-2">
          <Button variant="glow" className="flex-1" onClick={install} id="installButton">
            <Download className="h-4 w-4" /> Instalar app
          </Button>
          <Button variant="outline" onClick={dismiss}>
            Agora não
          </Button>
        </div>
      ) : null}
    </div>
  );
}
