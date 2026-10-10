import {
  Box,
  BookOpen,
  Compass,
  Home as HomeIcon,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Music2,
  Save,
  Scissors,
  Video,
} from "lucide-react";
import { useEffect } from "react";
import type { ViewId } from "@/core/store";
import { store, useEditzz } from "@/core/store";
import { Toasts } from "@/components/ui";
import { cn } from "@/lib/utils";
import AudioStudio from "@/views/audio/AudioStudio";
import PhotoStudio from "@/views/foto/PhotoStudio";
import Help from "@/views/ajuda/Help";
import Home from "@/views/inicio/Home";
import MidiaStudio from "@/views/midia/MidiaStudio";
import Templates from "@/views/modelos/Templates";
import Resources from "@/views/recursos/Resources";
import VideoStudio from "@/views/video/VideoStudio";

const NAV: { id: ViewId; label: string; icon: typeof HomeIcon; hint: string }[] = [
  { id: "inicio", label: "Início", icon: HomeIcon, hint: "Visão geral e atalhos" },
  { id: "video", label: "Vídeo", icon: Video, hint: "Timeline, prévia, efeitos e exportação" },
  { id: "foto", label: "Foto", icon: ImageIcon, hint: "Retoque não destrutivo e arte" },
  { id: "midia", label: "Mídia", icon: Box, hint: "Acervo e gerador procedural" },
  { id: "audio", label: "Áudio", icon: Music2, hint: "Trilhas, SFX e tratamento de voz" },
  { id: "modelos", label: "Modelos", icon: LayoutTemplate, hint: "Projetos prontos para redes" },
  { id: "recursos", label: "Recursos", icon: Compass, hint: "Pesquisa de mercado e ferramentas próprias" },
  { id: "ajuda", label: "Ajuda", icon: BookOpen, hint: "Atalhos, FAQ e desempenho" },
];

export default function App() {
  const { state, store: s } = useEditzz();

  /* atalhos globais */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === "z") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
      }
      if ((e.ctrlKey || e.metaKey) && key === "s") {
        e.preventDefault();
        void s.persist();
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (key === "1") s.setView("video");
        if (key === "2") s.setView("foto");
        if (key === "3") s.setView("midia");
        if (key === "4") s.setView("audio");
        if (key === "0") s.setView("inicio");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* lista de projetos salvos ao abrir */
  useEffect(() => {
    void s.refreshProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const View = () => {
    switch (state.view) {
      case "video":
        return <VideoStudio />;
      case "foto":
        return <PhotoStudio />;
      case "midia":
        return <MidiaStudio />;
      case "audio":
        return <AudioStudio />;
      case "modelos":
        return <Templates />;
      case "recursos":
        return <Resources />;
      case "ajuda":
        return <Help />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-bg text-ink">
      {/* topo */}
      <header className="flex shrink-0 items-center gap-2 border-b border-line bg-panel/80 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => s.setView("inicio")}
          className="flex items-center gap-2 rounded-lg px-1 py-0.5 transition hover:bg-white/5"
          title="Início"
        >
          <span className="grad-bg flex size-7 items-center justify-center rounded-lg font-display text-[12px] font-bold text-white">ez</span>
          <span className="hidden font-display text-[14px] font-bold tracking-tight text-ink sm:block">
            edit<span className="text-gradient">zz</span>
          </span>
        </button>

        <nav className="scroll-thin flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.hint}
              onClick={() => s.setView(item.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] transition",
                state.view === item.id ? "bg-vio/20 text-white ring-1 ring-vio/50" : "text-muted hover:bg-white/5 hover:text-ink"
              )}
            >
              <item.icon className="size-3.5" />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {state.busy && (
            <span className="flex items-center gap-1.5 rounded-lg border border-vio/40 bg-vio/10 px-2 py-1 text-[10.5px] text-ink">
              <Loader2 className="size-3 animate-spin text-vio" />
              <span className="hidden max-w-48 truncate sm:inline">{state.busy}</span>
            </span>
          )}
          <span className="hidden font-mono text-[10px] text-dim lg:inline">
            {state.historyLabel}
          </span>
          <button
            type="button"
            onClick={() => void s.persist()}
            title="Salvar projeto no navegador (Ctrl+S)"
            className="flex items-center gap-1.5 rounded-lg border border-line bg-panel2/60 px-2 py-1 text-[10.5px] text-muted transition hover:text-ink"
          >
            <Save className="size-3.5" />
            <span className="hidden sm:inline">salvar</span>
          </button>
          <button
            type="button"
            onClick={() => s.setView("video")}
            title="Atalho para o estúdio de vídeo"
            className="flex items-center gap-1.5 rounded-lg border border-line bg-panel2/60 px-2 py-1 text-[10.5px] text-muted transition hover:text-ink"
          >
            <Scissors className="size-3.5" />
            <span className="hidden sm:inline">editar</span>
          </button>
        </div>
      </header>

      {/* conteúdo */}
      <main className="min-h-0 flex-1 overflow-hidden">
        <View />
      </main>

      <Toasts />
      <span className="pointer-events-none fixed bottom-2 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-line bg-panel/90 px-2.5 py-1 text-[9.5px] text-dim backdrop-blur">
        editzz · edição local de vídeo e foto · seus arquivos ficam no seu dispositivo
      </span>
      {!state.assets.length && state.view !== "inicio" && (
        <button
          type="button"
          onClick={() => store.toast("Acervo vazio", "Importe arquivos ou gere mídia no estúdio de mídia (tecla 3).", "info")}
          className="pointer-events-none fixed bottom-8 left-1/2 z-[55] hidden -translate-x-1/2 text-[10px] text-dim"
        >
          dica: importe mídia para começar
        </button>
      )}
    </div>
  );
}
