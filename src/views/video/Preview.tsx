import {
  Crop,
  Grid3X3,
  Maximize2,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PREVIEW_VOLUME, setPreviewVolume, usePlayback } from "@/hooks/usePlayback";
import { projectDuration } from "@/core/model";
import { store, useEditzz } from "@/core/store";
import { transport, useTransport } from "@/core/transport";
import { Btn, IconBtn, Sel } from "@/components/ui";
import { cn, fmtTime } from "@/lib/utils";

export default function Preview() {
  const { state, store: s } = useEditzz();
  const { t, playing } = useTransport();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [masterVol, setMasterVol] = useState(PREVIEW_VOLUME.value);
  const { draw } = usePlayback(canvasRef);

  const duration = useMemo(() => projectDuration(state.project), [state.project]);
  const ratio = state.project.width / state.project.height;

  // atalhos de teclado do transporte
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        s.togglePlay();
        transport.setPlaying(!playing);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        const nt = Math.min(duration, transport.getTime() + (e.shiftKey ? 1 : 1 / state.project.fps));
        s.setPlayhead(nt);
        transport.seek(nt);
        void draw(nt, false);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        const nt = Math.max(0, transport.getTime() - (e.shiftKey ? 1 : 1 / state.project.fps));
        s.setPlayhead(nt);
        transport.seek(nt);
        void draw(nt, false);
      } else if (e.key === "Home") {
        s.setPlayhead(0);
        transport.seek(0);
      } else if (e.key === "End") {
        s.setPlayhead(duration);
        transport.seek(duration);
      } else if (e.key.toLowerCase() === "s" && !e.metaKey && !e.ctrlKey) {
        s.splitAt(transport.getTime());
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selectedClipIds.length) s.removeClips(state.selectedClipIds);
      } else if (e.key.toLowerCase() === "d" && !e.metaKey) {
        s.duplicateClips(state.selectedClipIds);
      } else if (e.key.toLowerCase() === "f") {
        s.freezeFrameAt(transport.getTime());
      } else if (e.key.toLowerCase() === "m") {
        s.addMarker(transport.getTime(), `Marcador ${state.project.markers.length + 1}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [duration, playing, state.project.fps, state.project.markers.length, state.selectedClipIds, s, draw]);

  const step = (dir: number) => {
    const nt = Math.max(0, Math.min(duration, transport.getTime() + dir / state.project.fps));
    s.setPlayhead(nt);
    transport.seek(nt);
    void draw(nt, false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1 rounded-xl border border-line bg-panel2/70 px-1.5 py-1">
          <IconBtn size="sm" title="Voltar 1 quadro (←)" onClick={() => step(-1)}>
            <SkipBack className="size-3.5" />
          </IconBtn>
          <IconBtn size="sm" title="Avançar 1 quadro (→)" onClick={() => step(1)}>
            <SkipForward className="size-3.5" />
          </IconBtn>
          <button
            type="button"
            onClick={() => {
              s.togglePlay();
              transport.setPlaying(!playing);
            }}
            className="grad-bg focus-ring flex size-9 items-center justify-center rounded-full text-white shadow-lg"
            title="Reproduzir / pausar (Espaço)"
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
          </button>
          <span className="px-1 font-mono text-[11px] tabular-nums text-ink">
            {fmtTime(t, true, state.project.fps)}
            <span className="text-dim"> / {fmtTime(duration, false)}</span>
          </span>
        </div>

        <IconBtn
          size="sm"
          title="Repetir (loop)"
          active={state.loop}
          onClick={() => {
            s.set({ loop: !state.loop });
            store.toast(state.loop ? "Loop desligado" : "Loop ligado", undefined, "info");
          }}
        >
          <Repeat className="size-3.5" />
        </IconBtn>

        <Btn size="sm" variant="ghost" title="Marcar entrada (I)" onClick={() => s.commit("Marcar entrada", (p) => ({ ...p, inPoint: transport.getTime() }))}>
          Entrada
        </Btn>
        <Btn size="sm" variant="ghost" title="Marcar saída (O)" onClick={() => s.commit("Marcar saída", (p) => ({ ...p, outPoint: transport.getTime() }))}>
          Saída
        </Btn>
        {(state.project.inPoint !== null || state.project.outPoint !== null) && (
          <Btn size="sm" variant="ghost" onClick={() => s.commit("Limpar intervalo", (p) => ({ ...p, inPoint: null, outPoint: null }))}>
            limpar
          </Btn>
        )}

        <div className="mx-1 h-5 w-px bg-line" />

        <Sel
          compact
          value={state.preview.quality === 1 ? "1" : String(state.preview.quality)}
          onChange={(v) =>
            s.set({ preview: { ...state.preview, quality: parseFloat(v) as 0.35 | 0.5 | 0.75 | 1 } })
          }
          options={[
            { value: "0.35", label: "Prévia rápida" },
            { value: "0.5", label: "Prévia equilibrada" },
            { value: "0.75", label: "Prévia alta" },
            { value: "1", label: "Prévia total" },
          ]}
        />

        <Sel
          compact
          value={state.preview.safeZones}
          onChange={(v) => s.set({ preview: { ...state.preview, safeZones: v } })}
          options={[
            { value: "off", label: "Sem zonas" },
            { value: "reels", label: "Zonas Reels" },
            { value: "tiktok", label: "Zonas TikTok" },
            { value: "youtube", label: "Zonas Shorts/YT" },
          ]}
        />

        <IconBtn
          size="sm"
          title="Grade de terços"
          active={state.preview.thirds}
          onClick={() => s.set({ preview: { ...state.preview, thirds: !state.preview.thirds } })}
        >
          <Grid3X3 className="size-3.5" />
        </IconBtn>

        <IconBtn
          size="sm"
          title="Mostrar quando a seleção está fora do quadro"
          active={false}
          onClick={() => store.toast("Enquadramento", "Use as setas + Alt para deslocar o clipe selecionado.", "info")}
        >
          <Crop className="size-3.5" />
        </IconBtn>

        <div className="ml-auto flex items-center gap-1.5">
          <IconBtn
            size="sm"
            title="Silenciar prévia"
            onClick={() => {
              const next = masterVol > 0 ? 0 : 1;
              setMasterVol(next);
              setPreviewVolume(next);
              store.toast(next > 0 ? "Prévia com som" : "Prévia muda", undefined, "info");
            }}
          >
            {masterVol > 0 ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
          </IconBtn>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVol}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setMasterVol(v);
              setPreviewVolume(v);
            }}
            className="w-20"
            title="Volume da prévia"
          />
          <IconBtn
            size="sm"
            title="Tela cheia"
            onClick={() => {
              const el = wrapRef.current;
              if (!el) return;
              if (document.fullscreenElement) void document.exitFullscreen();
              else void el.requestFullscreen().catch(() => undefined);
            }}
          >
            <Maximize2 className="size-3.5" />
          </IconBtn>
        </div>
      </div>

      <div
        ref={wrapRef}
        className={cn(
          "checker relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-line bg-bg2/60 p-3",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        )}
      >
        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full rounded-lg object-contain shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]"
          style={{ aspectRatio: ratio, width: state.project.width >= state.project.height ? "100%" : "auto", height: state.project.height > state.project.width ? "100%" : "auto" }}
        />
        {state.project.clips.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
            <p className="font-display text-sm font-semibold text-ink/80">Quadro vazio</p>
            <p className="text-[11.5px] text-muted">Importe mídia, gere arquivos de exemplo ou aplique um modelo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
