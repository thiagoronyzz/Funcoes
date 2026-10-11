import {
  BookOpen,
  Box,
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
import { useEditzz } from "@/core/store";
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
  { id: "inicio", label: "Visão geral", icon: HomeIcon, hint: "Projetos e atalhos" },
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
  const activeNav = NAV.find((item) => item.id === state.view) ?? NAV[0];

  /* atalhos globais */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const editingText = target?.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if ((e.ctrlKey || e.metaKey) && key === "z") {
        if (editingText || state.view === "foto") return;
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
      }
      if ((e.ctrlKey || e.metaKey) && key === "s") {
        e.preventDefault();
        void s.persist();
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !editingText) {
        if (key === "1") s.setView("video");
        if (key === "2") s.setView("foto");
        if (key === "3") s.setView("midia");
        if (key === "4") s.setView("audio");
        if (key === "0") s.setView("inicio");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s, state.view]);

  /* lista de projetos salvos ao abrir */
  useEffect(() => {
    void s.refreshProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* elemento direto (e não um componente inline) para não remontar a view a cada mudança de estado */
  const view =
    state.view === "video" ? (
      <VideoStudio />
    ) : state.view === "foto" ? (
      <PhotoStudio />
    ) : state.view === "midia" ? (
      <MidiaStudio />
    ) : state.view === "audio" ? (
      <AudioStudio />
    ) : state.view === "modelos" ? (
      <Templates />
    ) : state.view === "recursos" ? (
      <Resources />
    ) : state.view === "ajuda" ? (
      <Help />
    ) : (
      <Home />
    );

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-brand-cell">
          <button
            type="button"
            onClick={() => s.setView("inicio")}
            className="app-brand focus-ring"
            title="Voltar para a visão geral"
            aria-label="editzz — visão geral"
          >
            <img src="/editzz-mark.svg" alt="" className="app-brand-mark" />
            <span className="app-brand-wordmark">editzz</span>
          </button>
        </div>

        <div className="app-topbar-main">
          <div className="app-workspace-context">
            <span className="app-context-kicker">ESPAÇO DE TRABALHO</span>
            <span className="app-context-title">{activeNav.label}</span>
          </div>

          <div className="app-topbar-actions">
            {state.busy && (
              <span className="app-busy-indicator" role="status" aria-live="polite">
                <Loader2 className="size-3.5 animate-spin" />
                <span>{state.busy}</span>
              </span>
            )}
            <span className="app-history-label" title="Última ação no projeto">
              {state.historyLabel}
            </span>
            <button
              type="button"
              onClick={() => void s.persist()}
              title="Salvar projeto no navegador (Ctrl+S)"
              className="app-save-button focus-ring"
            >
              <Save className="size-4" />
              <span>Salvar</span>
            </button>
            <button
              type="button"
              onClick={() => s.setView("video")}
              title="Abrir o estúdio de vídeo"
              className={cn("app-editor-button focus-ring", state.view === "video" && "is-current")}
              aria-current={state.view === "video" ? "page" : undefined}
            >
              <Scissors className="size-4" />
              <span>Editor de vídeo</span>
            </button>
          </div>
        </div>
      </header>

      <aside className="app-sidebar" aria-label="Navegação principal">
        <p className="app-sidebar-caption">ESTÚDIO</p>
        <nav className="app-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.hint}
              aria-label={item.label}
              aria-current={state.view === item.id ? "page" : undefined}
              onClick={() => s.setView(item.id)}
              className={cn("app-nav-item focus-ring", state.view === item.id && "is-active")}
            >
              <item.icon className="app-nav-icon" aria-hidden="true" />
              <span className="app-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="app-sidebar-local">
          <span className="app-online-dot" />
          <div>
            <span className="app-sidebar-local-title">Privacidade local</span>
            <span className="app-sidebar-local-note">Arquivos no seu dispositivo</span>
          </div>
        </div>
      </aside>

      <main className="app-main">{view}</main>

      <footer className="app-statusbar">
        <span className="app-status-primary"><span className="app-online-dot" /> Tudo salvo localmente</span>
        <span className="app-status-meta">{state.project.width} × {state.project.height} · {state.project.fps} fps</span>
        <span className="app-status-meta app-status-shortcuts">Ctrl+S salvar · 1–4 alternar estúdio · 0 início</span>
      </footer>

      <Toasts />
    </div>
  );
}
