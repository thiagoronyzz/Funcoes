import { useCallback, useEffect, useState } from "react";

/** Evento nativo de instalação (ainda não tipado no TS padrão). */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type Plataforma = "android" | "ios" | "desktop";

const CHAVE_STORAGE = "zcode_app_instalado";

function detectarPlataforma(): Plataforma {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  const iosClassico = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = /Macintosh/.test(ua) && (navigator as Navigator).maxTouchPoints > 1;
  if (iosClassico || iPadOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function checarSeJaInstalado(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Já salvo em localStorage de instalação prévia
  try {
    if (localStorage.getItem(CHAVE_STORAGE) === "true") return true;
  } catch {}

  // 2. Display mode standalone / fullscreen / minimal-ui / window-controls-overlay
  const mqStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const mqFullscreen = window.matchMedia("(display-mode: fullscreen)").matches;
  const mqMinimalUi = window.matchMedia("(display-mode: minimal-ui)").matches;
  const mqWindowControls = window.matchMedia("(display-mode: window-controls-overlay)").matches;

  // 3. iOS Safari standalone
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  // 4. Referrer de app instalado Android TWA ou parâmetro de inicialização PWA
  const androidApp = typeof document !== "undefined" && document.referrer.includes("android-app://");
  const pwaQueryParam = typeof window !== "undefined" && (window.location.search.includes("source=pwa") || window.location.search.includes("pwa=true"));

  const estaInstalado = mqStandalone || mqFullscreen || mqMinimalUi || mqWindowControls || iosStandalone || androidApp || pwaQueryParam;

  if (estaInstalado) {
    try {
      localStorage.setItem(CHAVE_STORAGE, "true");
    } catch {}
  }

  return estaInstalado;
}

/**
 * Cuida de tudo que envolve "baixar o app":
 * guarda o evento beforeinstallprompt, sabe se já está instalado
 * e expõe uma função para disparar a instalação.
 */
export function usePwaInstall() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [instalado, setInstalado] = useState(() => checarSeJaInstalado());
  const [plataforma, setPlataforma] = useState<Plataforma>("desktop");

  useEffect(() => {
    setPlataforma(detectarPlataforma());
    const statusInstalado = checarSeJaInstalado();
    setInstalado(statusInstalado);

    const mediaQueries = [
      "(display-mode: standalone)",
      "(display-mode: fullscreen)",
      "(display-mode: minimal-ui)",
      "(display-mode: window-controls-overlay)",
    ];

    const matchers = mediaQueries.map((q) => {
      const m = window.matchMedia(q);
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) {
          marcarComoInstalado();
        }
      };
      m.addEventListener("change", handler);
      return { m, handler };
    });

    const marcarComoInstalado = () => {
      try {
        localStorage.setItem(CHAVE_STORAGE, "true");
      } catch {}
      setInstalado(true);
      setEvento(null);
    };

    const aoPoderInstalar = (e: Event) => {
      if (checarSeJaInstalado()) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
    };

    const aoInstalar = () => {
      marcarComoInstalado();
    };

    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    window.addEventListener("appinstalled", aoInstalar);

    return () => {
      window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
      window.removeEventListener("appinstalled", aoInstalar);
      matchers.forEach(({ m, handler }) => m.removeEventListener("change", handler));
    };
  }, []);

  const instalar = useCallback(async () => {
    if (!evento) return "indisponivel" as const;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    if (outcome === "accepted") {
      try {
        localStorage.setItem(CHAVE_STORAGE, "true");
      } catch {}
      setInstalado(true);
    }
    setEvento(null);
    return outcome;
  }, [evento]);

  return {
    /** true quando o navegador já liberou o instalador nativo */
    podeInstalar: Boolean(evento),
    instalado,
    plataforma,
    instalar,
  };
}
