import {
  Copy,
  Eye,
  EyeOff,
  Film,
  Flag,
  GripVertical,
  Layers,
  Lock,
  Magnet,
  Maximize,
  Music2,
  Plus,
  Scissors,
  Snowflake,
  Trash2,
  Type as TypeIcon,
  Unlock,
  VolumeX,
  Volume2,
  Wand2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { energyForAsset } from "@/core/analysis";
import { pool } from "@/core/media";
import { clipEnd, projectDuration, type Clip, type Track } from "@/core/model";
import { store, useEditzz } from "@/core/store";
import { transport, useTransport } from "@/core/transport";
import { Btn, Chip, IconBtn } from "@/components/ui";
import { EFFECTS, LOOKS } from "@/lib/presets";
import { cn, clamp, fmtTime } from "@/lib/utils";

interface DragState {
  ids: string[];
  startX: number;
  startY: number;
  originals: { id: string; start: number; trackId: string }[];
  mode: "move" | "trim-start" | "trim-end" | "playhead";
  moved: boolean;
}

const TRACK_ICONS: Record<Track["kind"], typeof Film> = {
  video: Film,
  overlay: Layers,
  text: TypeIcon,
  audio: Music2,
  adjust: Wand2,
};

export default function Timeline() {
  const { state, store: s } = useEditzz();
  const { t } = useTransport();
  const [drag, setDrag] = useState<DragState | null>(null);
  const [context, setContext] = useState<{ x: number; y: number; clipId: string } | null>(null);
  const [energy, setEnergy] = useState<Record<string, number[]>>({});
  const lanesRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pps = state.zoom;
  const duration = useMemo(() => Math.max(projectDuration(state.project), 8), [state.project]);
  const totalWidth = Math.max(600, duration * pps + 220);

  /* mapa de energia dos áudios (opcional) */
  useEffect(() => {
    if (!state.preview.showEnergy) return;
    const audioAssets = state.assets.filter((a) => a.kind !== "image" && a.hasAudio && !energy[a.id]);
    audioAssets.slice(0, 4).forEach((asset) => {
      void energyForAsset(asset, 320).then((data) => setEnergy((prev) => ({ ...prev, [asset.id]: data })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.assets, state.preview.showEnergy]);

  const snapPoints = useMemo(() => {
    const pts: number[] = [0, transport.getTime()];
    state.project.markers.forEach((m) => pts.push(m.t));
    state.project.clips.forEach((c) => {
      pts.push(c.start, clipEnd(c));
    });
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.project.clips, state.project.markers, t]);

  const snap = (value: number, px: number) => {
    if (!state.snapping) return value;
    let best = value;
    let bestDist = px / pps;
    snapPoints.forEach((p) => {
      const d = Math.abs(p - value);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    });
    return best;
  };

  /* ── arraste ── */
  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - drag.startX;
      if (Math.abs(dx) > 2) setDrag((d) => (d ? { ...d, moved: true } : d));
      if (drag.mode === "playhead") {
        const rect = lanesRef.current?.getBoundingClientRect();
        if (!rect) return;
        const nt = clamp((e.clientX - rect.left) / pps, 0, duration);
        s.setPlayhead(snap(nt, e.clientX - rect.left));
        transport.seek(snap(nt, e.clientX - rect.left));
        return;
      }
      const delta = dx / pps;
      if (drag.mode === "move") {
        // qual faixa está sob o cursor?
        const lanes = lanesRef.current?.querySelectorAll<HTMLElement>("[data-lane]");
        let targetTrack: string | null = null;
        lanes?.forEach((lane) => {
          const r = lane.getBoundingClientRect();
          if (e.clientY >= r.top && e.clientY <= r.bottom) targetTrack = lane.dataset.lane ?? null;
        });
        drag.originals.forEach((o) => {
          const clip = state.project.clips.find((c) => c.id === o.id);
          if (!clip) return;
          const nextStart = Math.max(0, snap(o.start + delta, Math.abs(dx)));
          const patch: Partial<Clip> = { start: nextStart };
          if (targetTrack && clip.kind !== "text" && clip.kind !== "audio") {
            const target = state.project.tracks.find((tr) => tr.id === targetTrack);
            if (target && target.kind !== "audio" && !target.locked) patch.trackId = target.id;
          } else if (targetTrack && clip.kind === "audio") {
            const target = state.project.tracks.find((tr) => tr.id === targetTrack);
            if (target?.kind === "audio") patch.trackId = target.id;
          }
          s.updateClip(o.id, patch, "Mover clipe");
        });
      } else if (drag.mode === "trim-start") {
        drag.originals.forEach((o) => {
          const clip = state.project.clips.find((c) => c.id === o.id);
          if (!clip) return;
          const nt = snap(o.start + delta, Math.abs(dx));
          s.trimClip(o.id, "start", clamp(nt, 0, clipEnd(clip) - 0.12));
        });
      } else if (drag.mode === "trim-end") {
        drag.originals.forEach((o) => {
          const clip = state.project.clips.find((c) => c.id === o.id);
          if (!clip) return;
          const nt = snap(clipEnd(clip) + delta, Math.abs(dx));
          s.trimClip(o.id, "end", Math.max(clip.start + 0.12, nt));
        });
      }
    };
    const onUp = () => setDrag(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, pps, duration, snapPoints, state.project.clips, state.project.tracks, state.snapping, s]);

  useEffect(() => {
    const close = () => setContext(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const startDrag = (e: React.PointerEvent, ids: string[], mode: DragState["mode"]) => {
    const originals = ids
      .map((id) => state.project.clips.find((c) => c.id === id))
      .filter((c): c is Clip => !!c)
      .map((c) => ({ id: c.id, start: c.start, trackId: c.trackId }));
    setDrag({ ids, startX: e.clientX, startY: e.clientY, originals, mode, moved: false });
  };

  const clickClip = (e: React.MouseEvent, clip: Clip) => {
    if (e.shiftKey && state.selectedClipIds.length) {
      const first = state.project.clips.find((c) => c.id === state.selectedClipIds[0]);
      if (first) {
        const list = state.project.clips.filter((c) => c.trackId === first.trackId).sort((a, b) => a.start - b.start);
        const i0 = list.findIndex((c) => c.id === first.id);
        const i1 = list.findIndex((c) => c.id === clip.id);
        const [from, to] = i0 < i1 ? [i0, i1] : [i1, i0];
        s.select(list.slice(from, to + 1).map((c) => c.id));
        return;
      }
    }
    if (e.metaKey || e.ctrlKey) s.toggleSelect(clip.id, true);
    else s.select([clip.id]);
  };

  const ruler = useMemo(() => {
    const stepBase = pps > 220 ? 0.25 : pps > 120 ? 0.5 : pps > 60 ? 1 : pps > 30 ? 2 : 5;
    const marks: number[] = [];
    for (let time = 0; time <= duration + stepBase; time += stepBase) marks.push(Math.round(time * 100) / 100);
    return marks;
  }, [pps, duration]);

  return (
    <div className="flex min-h-0 flex-col gap-2">
      {/* barra de ferramentas */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Btn size="sm" variant="primary" icon={<Scissors className="size-3.5" />} onClick={() => s.splitAt(transport.getTime())} title="Dividir no playhead (S)">
          Dividir
        </Btn>
        <Btn size="sm" icon={<Copy className="size-3.5" />} onClick={() => s.duplicateClips(state.selectedClipIds)} title="Duplicar (D)">
          Duplicar
        </Btn>
        <Btn size="sm" icon={<Trash2 className="size-3.5" />} onClick={() => s.removeClips(state.selectedClipIds)} title="Apagar (Delete)">
          Apagar
        </Btn>
        <Btn
          size="sm"
          variant="danger"
          onClick={() => s.rippleDelete(state.selectedClipIds)}
          title="Apagar e fechar a lacuna (ripple)"
        >
          Ripple
        </Btn>
        <Btn size="sm" icon={<Snowflake className="size-3.5" />} onClick={() => s.freezeFrameAt(transport.getTime())} title="Congelar quadro (F)">
          Congelar
        </Btn>
        <Btn size="sm" icon={<Flag className="size-3.5" />} onClick={() => s.addMarker(transport.getTime(), `Marcador ${state.project.markers.length + 1}`)} title="Marcador (M)">
          Marcador
        </Btn>

        <div className="mx-1 h-5 w-px bg-line" />

        <IconBtn size="sm" title="Diminuir zoom" onClick={() => s.setZoom(pps / 1.3)}>
          <ZoomOut className="size-3.5" />
        </IconBtn>
        <input
          type="range"
          min={12}
          max={480}
          value={pps}
          onChange={(e) => s.setZoom(parseFloat(e.target.value))}
          className="w-24"
          title="Zoom da timeline"
        />
        <IconBtn size="sm" title="Mais zoom" onClick={() => s.setZoom(pps * 1.3)}>
          <ZoomIn className="size-3.5" />
        </IconBtn>
        <IconBtn
          size="sm"
          title="Ajustar à janela"
          onClick={() => {
            const w = scrollRef.current?.clientWidth ?? 900;
            s.setZoom(clamp((w - 240) / Math.max(4, duration), 12, 480));
          }}
        >
          <Maximize className="size-3.5" />
        </IconBtn>
        <IconBtn
          size="sm"
          title="Encaixe magnético"
          active={state.snapping}
          onClick={() => s.set({ snapping: !state.snapping })}
        >
          <Magnet className="size-3.5" />
        </IconBtn>

        <div className="ml-auto flex items-center gap-1.5">
          <Chip active={state.preview.showEnergy} onClick={() => s.set({ preview: { ...state.preview, showEnergy: !state.preview.showEnergy } })}>
            mapa de energia
          </Chip>
          <Sel addTrack={(kind) => s.addTrack(kind)} />
        </div>
      </div>

      {/* timeline */}
      <div className="panel relative flex min-h-0 overflow-hidden">
        {/* cabeçalhos das faixas */}
        <div className="w-[172px] shrink-0 border-r border-line bg-bg2/50">
          <div className="flex h-7 items-center justify-between border-b border-line px-2 text-[10px] uppercase tracking-wider text-dim">
            faixas
            <span className="font-mono">{state.project.tracks.length}</span>
          </div>
          <div className="border-b border-line/60 bg-panel/60 px-2 py-1 text-[10px] text-dim">
            {state.project.markers.length} marcador(es)
          </div>
          <div className="scroll-thin overflow-hidden">
            {state.project.tracks.map((track) => {
              const Icon = TRACK_ICONS[track.kind];
              return (
                <div
                  key={track.id}
                  className="group flex items-center gap-1.5 border-b border-line/50 px-2"
                  style={{ height: track.height }}
                >
                  <GripVertical className="size-3 shrink-0 text-dim/60" />
                  <Icon className="size-3.5 shrink-0" style={{ color: track.kind === "audio" ? "#22d3ee" : track.kind === "text" ? "#fbbf24" : "#d7a45a" }} />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-ink/90">{track.name}</span>
                  <div className="flex items-center gap-0.5 opacity-60 transition group-hover:opacity-100">
                    <button
                      type="button"
                      title={track.muted ? "Reativar som" : "Silenciar faixa"}
                      onClick={() => s.updateTrack(track.id, { muted: !track.muted })}
                    >
                      {track.muted ? <VolumeX className="size-3 text-rose" /> : <Volume2 className="size-3 text-dim hover:text-ink" />}
                    </button>
                    <button
                      type="button"
                      title={track.hidden ? "Mostrar faixa" : "Ocultar faixa"}
                      onClick={() => s.updateTrack(track.id, { hidden: !track.hidden })}
                    >
                      {track.hidden ? <EyeOff className="size-3 text-rose" /> : <Eye className="size-3 text-dim hover:text-ink" />}
                    </button>
                    <button
                      type="button"
                      title={track.locked ? "Desbloquear" : "Bloquear"}
                      onClick={() => s.updateTrack(track.id, { locked: !track.locked })}
                    >
                      {track.locked ? <Lock className="size-3 text-amber" /> : <Unlock className="size-3 text-dim hover:text-ink" />}
                    </button>
                    <button type="button" title="Remover faixa" onClick={() => s.removeTrack(track.id)}>
                      <Trash2 className="size-3 text-dim hover:text-rose" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* área de faixas */}
        <div ref={scrollRef} className="scroll-thin relative min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
          <div ref={lanesRef} className="relative" style={{ width: totalWidth }}>
            {/* régua */}
            <div
              className="sticky top-0 z-20 h-7 cursor-col-resize border-b border-line bg-panel/95 backdrop-blur"
              onPointerDown={(e) => {
                const rect = lanesRef.current?.getBoundingClientRect();
                if (!rect) return;
                const nt = clamp((e.clientX - rect.left) / pps, 0, duration);
                s.setPlayhead(nt);
                transport.seek(nt);
                startDrag(e, [], "playhead");
              }}
            >
              {ruler.map((mark) => (
                <div key={mark} className="absolute top-0 h-full" style={{ left: mark * pps }}>
                  <div className="h-2 w-px bg-line2" />
                  <span className="absolute top-1.5 left-1 font-mono text-[9.5px] text-dim">{fmtTime(mark)}</span>
                </div>
              ))}
              {/* marcadores */}
              {state.project.markers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  title={`${m.label} (${fmtTime(m.t)})`}
                  onDoubleClick={() => s.removeMarker(m.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    s.setPlayhead(m.t);
                    transport.seek(m.t);
                  }}
                  className="absolute -bottom-1 z-30 h-3.5 w-1.5 -translate-x-1/2 rounded-sm"
                  style={{ left: m.t * pps, background: m.color }}
                />
              ))}
            </div>

            {/* faixas */}
            {state.project.tracks.map((track) => {
              const clips = state.project.clips
                .filter((c) => c.trackId === track.id)
                .sort((a, b) => a.start - b.start);
              const isAudio = track.kind === "audio";
              return (
                <div
                  key={track.id}
                  data-lane={track.id}
                  className={cn(
                    "tl-grid relative border-b border-line/50",
                    track.hidden && "opacity-40",
                    isAudio && "bg-[#0b1a20]/40"
                  )}
                  style={{
                    height: track.height,
                    backgroundSize: `${Math.max(8, pps / 2)}px 100%`,
                  }}
                >
                  {clips.map((clip) => (
                    <ClipBlock
                      key={clip.id}
                      clip={clip}
                      pps={pps}
                      selected={state.selectedClipIds.includes(clip.id)}
                      energy={
                        isAudio && clip.assetId && energy[clip.assetId] && state.preview.showEnergy
                          ? energy[clip.assetId]
                          : undefined
                      }
                      onPointerDown={(e, mode) => {
                        if (track.locked) {
                          store.toast("Faixa bloqueada", "Desbloqueie a faixa para editar.", "warn");
                          return;
                        }
                        if (mode === "move" && !state.selectedClipIds.includes(clip.id)) s.select([clip.id]);
                        startDrag(e, state.selectedClipIds.includes(clip.id) ? state.selectedClipIds : [clip.id], mode);
                      }}
                      onClick={(e) => clickClip(e, clip)}
                      onContext={(e) => {
                        e.preventDefault();
                        if (!state.selectedClipIds.includes(clip.id)) s.select([clip.id]);
                        setContext({ x: e.clientX, y: e.clientY, clipId: clip.id });
                      }}
                      onDoubleClick={() => {
                        s.setPlayhead(clip.start);
                        transport.seek(clip.start);
                      }}
                    />
                  ))}
                </div>
              );
            })}

            {/* playhead */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-30 w-px bg-white/90"
              style={{ left: t * pps }}
            >
              <div className="absolute -top-0.5 -left-[5px] size-2.5 rotate-45 rounded-[2px] bg-white" />
            </div>
          </div>
        </div>
      </div>

      {context && <ContextMenu x={context.x} y={context.y} clipId={context.clipId} onClose={() => setContext(null)} />}
    </div>
  );
}

/* ────────────── bloco de clipe ────────────── */

function ClipBlock({
  clip,
  pps,
  selected,
  energy,
  onPointerDown,
  onClick,
  onContext,
  onDoubleClick,
}: {
  clip: Clip;
  pps: number;
  selected: boolean;
  energy?: number[];
  onPointerDown: (e: React.PointerEvent, mode: DragState["mode"]) => void;
  onClick: (e: React.MouseEvent) => void;
  onContext: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}) {
  const { state } = useEditzz();
  const asset = state.assets.find((a) => a.id === clip.assetId);
  const width = Math.max(6, clip.duration * pps);
  const [wave, setWave] = useState<string>("");
  const isAudio = clip.kind === "audio";

  useEffect(() => {
    if (!isAudio || !asset || wave) return;
    void pool
      .waveformUrl(asset, 800, 80, "#22d3ee")
      .then((url) => url && setWave(url))
      .catch(() => undefined);
  }, [asset, isAudio, wave]);

  const effectCount = clip.effects.filter((e) => e.enabled).length;
  const lookName = clip.look !== "none" ? LOOKS.find((l) => l.id === clip.look)?.name : null;

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e, "move");
      }}
      onClick={onClick}
      onContextMenu={onContext}
      onDoubleClick={onDoubleClick}
      className={cn(
        "clip-glow group absolute top-[3px] overflow-hidden rounded-md border text-left",
        selected ? "z-10 border-white/80 ring-1 ring-white/60" : "border-black/40"
      )}
      style={{
        left: clip.start * pps,
        width,
        height: "calc(100% - 6px)",
        background: isAudio
          ? "linear-gradient(180deg,#0e2a33,#0a1b21)"
          : asset?.thumb
            ? `url(${asset.thumb}) center/auto 100% repeat-x, linear-gradient(180deg,${clip.tag}44,${clip.tag}22)`
            : `linear-gradient(135deg,${clip.tag}55,${clip.tag}22)`,
      }}
      title={`${clip.name} · ${fmtTime(clip.start)} → ${fmtTime(clipEnd(clip))}`}
    >
      <div className="absolute inset-x-0 top-0 flex items-center gap-1 bg-black/55 px-1 py-0.5 backdrop-blur-sm">
        <span className="size-1.5 shrink-0 rounded-full" style={{ background: clip.tag }} />
        <span className="min-w-0 flex-1 truncate text-[9.5px] font-medium text-white/95">{clip.name}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 px-1 pb-0.5">
        {clip.speed !== 1 && <span className="rounded bg-black/55 px-1 font-mono text-[8.5px] text-amber">{clip.speed.toFixed(2)}x</span>}
        {effectCount > 0 && <span className="rounded bg-black/55 px-1 font-mono text-[8.5px] text-lime">{effectCount}fx</span>}
        {lookName && <span className="hidden rounded bg-black/55 px-1 font-mono text-[8.5px] text-cy sm:inline">{lookName}</span>}
        {clip.transitionIn && clip.transitionIn.id !== "none" && (
          <span className="rounded bg-black/55 px-1 font-mono text-[8.5px] text-pink">▸{clip.transitionIn.id}</span>
        )}
        {clip.mask.shape !== "none" && <span className="rounded bg-black/55 px-1 font-mono text-[8.5px] text-vio">máscara</span>}
        {clip.chroma.enabled && <span className="rounded bg-black/55 px-1 font-mono text-[8.5px] text-emerald">chroma</span>}
        {Object.keys(clip.keyframes).length > 0 && (
          <span className="rounded bg-black/55 px-1 font-mono text-[8.5px] text-white">◆{Object.values(clip.keyframes).reduce((a, k) => a + (k?.length ?? 0), 0)}</span>
        )}
      </div>

      {isAudio && wave && (
        <img src={wave} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-fill opacity-80" />
      )}
      {isAudio && energy && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-full items-end gap-px opacity-45">
          {energy.map((v, i) => (
            <span key={i} className="flex-1 rounded-t-sm bg-[#d58f73]" style={{ height: `${v * 100}%` }} />
          ))}
        </div>
      )}
      {clip.kind === "text" && clip.text && (
        <span className="pointer-events-none absolute inset-x-0 bottom-3.5 truncate px-1 text-[9px] text-white/70">{clip.text.content}</span>
      )}

      {/* alças de apara */}
      <div
        className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize bg-white/0 transition group-hover:bg-white/30"
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDown(e, "trim-start");
        }}
      />
      <div
        className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize bg-white/0 transition group-hover:bg-white/30"
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDown(e, "trim-end");
        }}
      />
    </div>
  );
}

/* ────────────── menu de contexto ────────────── */

function ContextMenu({ x, y, clipId, onClose }: { x: number; y: number; clipId: string; onClose: () => void }) {
  const { store: s, state } = useEditzz();
  const clip = state.project.clips.find((c) => c.id === clipId);
  if (!clip) return null;
  const items: { label: string; action: () => void; danger?: boolean }[] = [
    { label: "Dividir no playhead", action: () => s.splitAt(transport.getTime(), [clip.trackId]) },
    { label: "Duplicar", action: () => s.duplicateClips([clipId]) },
    { label: "Congelar este quadro", action: () => s.freezeFrameAt(clip.start + clip.duration / 2) },
    { label: "Adicionar marcador aqui", action: () => s.addMarker(transport.getTime(), "Marcador") },
    { label: clip.mask.shape === "none" ? "Aplicar máscara circular" : "Remover máscara", action: () => s.updateClip(clipId, { mask: { ...clip.mask, shape: clip.mask.shape === "none" ? "circle" : "none" } }, "Máscara") },
    { label: clip.chroma.enabled ? "Desligar chroma key" : "Ligar chroma key (verde)", action: () => s.updateClip(clipId, { chroma: { ...clip.chroma, enabled: !clip.chroma.enabled } }, "Chroma key") },
    { label: "Copiar estilo", action: () => { copyStyle(clip); store.toast("Estilo copiado", "Use em outro clipe pelo inspetor.", "ok"); } },
    { label: "Colar estilo", action: () => { const st = pasteStyle(); if (st) s.updateClip(clipId, st, "Colar estilo"); else store.toast("Nada copiado", undefined, "warn"); } },
    { label: "Remover", action: () => s.removeClips([clipId]), danger: true },
  ];
  return (
    <div
      className="fixed z-[70] w-52 overflow-hidden rounded-xl border border-line bg-panel/98 py-1 shadow-2xl backdrop-blur"
      style={{ left: Math.min(x, window.innerWidth - 220), top: Math.min(y, window.innerHeight - 320) }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => {
            item.action();
            onClose();
          }}
          className={cn(
            "block w-full px-3 py-1.5 text-left text-[11.5px] transition hover:bg-white/8",
            item.danger ? "text-rose" : "text-ink/90"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ────────────── estilo copiado/colado ────────────── */

let styleClipboard: Partial<Clip> | null = null;
export function copyStyle(clip: Clip) {
  styleClipboard = {
    adjust: clip.adjust,
    look: clip.look,
    lookIntensity: clip.lookIntensity,
    effects: clip.effects,
    chroma: clip.chroma,
    mask: clip.mask,
    blend: clip.blend,
    opacity: clip.opacity,
  };
}
export function pasteStyle(): Partial<Clip> | null {
  return styleClipboard;
}

/* ────────────── botão de nova faixa ────────────── */

function Sel({ addTrack }: { addTrack: (kind: Track["kind"]) => void }) {
  const [open, setOpen] = useState(false);
  const kinds: { id: Track["kind"]; label: string }[] = [
    { id: "video", label: "Faixa de vídeo" },
    { id: "overlay", label: "Sobreposição (PIP)" },
    { id: "text", label: "Texto / legendas" },
    { id: "audio", label: "Áudio" },
    { id: "adjust", label: "Camada de ajuste" },
  ];
  return (
    <div className="relative">
      <Btn size="sm" icon={<Plus className="size-3.5" />} onClick={() => setOpen((v) => !v)}>
        Faixa
      </Btn>
      {open && (
        <div className="absolute right-0 top-8 z-[60] w-48 overflow-hidden rounded-xl border border-line bg-panel/98 py-1 shadow-2xl">
          {kinds.map((k) => (
            <button
              key={k.id}
              type="button"
              className="block w-full px-3 py-1.5 text-left text-[11.5px] text-ink/90 hover:bg-white/8"
              onClick={() => {
                addTrack(k.id);
                setOpen(false);
              }}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const EFFECT_NAMES = EFFECTS.map((e) => e.name);
