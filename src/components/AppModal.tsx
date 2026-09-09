import { X, ExternalLink, Star, Maximize2, RotateCw } from "lucide-react";
import { useState, useRef } from "react";
import type { AppItem } from "../data/apps";

interface Props {
  app: AppItem | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (appName: string) => void;
}

export default function AppModal({ app, onClose, isFavorite, onToggleFavorite }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!app) return null;

  const reloadIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = app.link;
    }
  };

  const toggleFullscreen = () => {
    if (!iframeRef.current) return;
    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 md:p-6">
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-line bg-paper shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-surface px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
              Zcode App
            </span>
            <h3 className="font-display text-lg font-bold text-ink truncate">
              {app.nome}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(app.nome)}
              className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition ${
                isFavorite
                  ? "border-amber-400 bg-amber-50 text-amber-800"
                  : "border-line bg-paper text-ink/70 hover:bg-surface"
              }`}
              title="Favoritar aplicativo"
            >
              <Star className={`size-3.5 ${isFavorite ? "fill-amber-400 text-amber-500" : ""}`} />
              <span className="hidden sm:inline">{isFavorite ? "Favoritado" : "Favoritar"}</span>
            </button>

            <button
              type="button"
              onClick={reloadIframe}
              className="rounded border border-line bg-paper p-1.5 text-ink/70 hover:bg-surface hover:text-ink"
              title="Recarregar"
            >
              <RotateCw className="size-4" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded border border-line bg-paper p-1.5 text-ink/70 hover:bg-surface hover:text-ink"
              title="Tela Cheia"
            >
              <Maximize2 className="size-4" />
            </button>

            <a
              href={app.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded border border-line bg-paper px-2.5 py-1.5 text-xs font-medium text-ink/70 hover:bg-surface hover:text-ink"
              title="Abrir em Nova Aba"
            >
              <ExternalLink className="size-3.5" />
              <span className="hidden sm:inline">Nova Aba</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="ml-2 rounded-full border border-line bg-paper p-1.5 text-ink/70 hover:bg-brand-600 hover:text-white"
              title="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Frame View */}
        <div className="relative flex-1 bg-surface2">
          <iframe
            ref={iframeRef}
            src={app.link}
            title={app.nome}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
