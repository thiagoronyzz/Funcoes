import {
  ArrowLeftRight,
  Blend,
  Download,
  FolderOpen,
  Layers,
  Music2,
  Redo2,
  Save,
  Sparkles,
  Trash2,
  Undo2,
  Volume2,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { exportCapabilities } from "@/core/exporter";
import { assetFromAudioBuffer, generateSfx, generateMusic, SFX_LIST } from "@/core/audio";
import { projectDuration } from "@/core/model";
import { store, useEditzz } from "@/core/store";
import { ASPECTS, GRADIENT_PRESETS, MUSIC_STYLES, SOUND_EFFECTS, TRANSITION_GROUPS, TRANSITIONS } from "@/lib/presets";
import { Badge, Btn, Chip, IconBtn, Modal, Sel, Slider, Tabs, TextField } from "@/components/ui";
import { cn, fmtTime, pickFiles } from "@/lib/utils";
import ExportPanel from "./ExportPanel";
import Inspector from "./Inspector";
import MediaBin from "./MediaBin";
import Preview from "./Preview";
import Timeline from "./Timeline";
import ToolsPanel from "./ToolsPanel";

type RightTab = "inspetor" | "ferramentas" | "exportar";

export default function VideoStudio() {
  const { state, store: s } = useEditzz();
  const [right, setRight] = useState<RightTab>("inspetor");
  const [showProjects, setShowProjects] = useState(false);
  const [showBg, setShowBg] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [sfxBusy, setSfxBusy] = useState<string | null>(null);
  const duration = projectDuration(state.project);
  const caps = exportCapabilities();

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2">
      {/* ── barra do projeto ── */}
      <div className="panel flex flex-wrap items-center gap-1.5 px-2 py-1.5">
        <span className="grad-bg hidden size-6 items-center justify-center rounded-lg text-[11px] font-bold text-white sm:flex">ez</span>
        <input
          value={state.project.name}
          onChange={(e) => s.renameProject(e.target.value)}
          className="w-40 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 font-display text-[12.5px] font-semibold text-ink outline-none transition hover:border-line focus:border-vio/60"
        />
        <Chip>{state.project.width}×{state.project.height}</Chip>
        <Chip>{state.project.fps} fps</Chip>
        <Chip>{fmtTime(duration, false)}</Chip>

        <div className="mx-1 h-5 w-px bg-line" />

        <IconBtn size="sm" title="Desfazer (Ctrl+Z)" onClick={() => s.undo()} disabled={!state.canUndo}>
          <Undo2 className="size-3.5" />
        </IconBtn>
        <IconBtn size="sm" title="Refazer (Ctrl+Shift+Z)" onClick={() => s.redo()} disabled={!state.canRedo}>
          <Redo2 className="size-3.5" />
        </IconBtn>
        <span className="hidden min-w-24 max-w-40 truncate text-[10.5px] text-dim lg:inline">{state.historyLabel}</span>

        <Sel
          compact
          value={`${state.project.width}x${state.project.height}`}
          onChange={(v) => {
            const [w, h] = v.split("x").map(Number);
            s.setProjectFormat(w, h);
          }}
          options={ASPECTS.map((a) => ({ value: `${a.w}x${a.h}`, label: `${a.name} · ${a.hint}` }))}
        />

        <Btn size="sm" variant="ghost" icon={<Blend className="size-3.5" />} onClick={() => setShowBg(true)}>
          Fundo
        </Btn>
        <Btn size="sm" variant="ghost" icon={<Volume2 className="size-3.5" />} onClick={() => setShowAudio(true)}>
          Sons
        </Btn>
        <Btn
          size="sm"
          variant="ghost"
          icon={<Layers className="size-3.5" />}
          onClick={() =>
            s.commit("Watermark", (p) => ({ ...p, watermark: { ...p.watermark, enabled: !p.watermark.enabled } }))
          }
        >
          Marca d&apos;água
        </Btn>

        <div className="ml-auto flex items-center gap-1.5">
          <IconBtn size="sm" title="Novo projeto" onClick={() => { s.newProject(); store.toast("Novo projeto", "Timeline limpa e pronta.", "ok"); }}>
            <Sparkles className="size-3.5" />
          </IconBtn>
          <IconBtn size="sm" title="Abrir projeto salvo" onClick={() => void s.refreshProjects().then(() => setShowProjects(true))}>
            <FolderOpen className="size-3.5" />
          </IconBtn>
          <IconBtn size="sm" title="Salvar projeto" onClick={() => void s.persist()}>
            <Save className="size-3.5" />
          </IconBtn>
          <Btn
            size="sm"
            variant="primary"
            icon={<Download className="size-3.5" />}
            onClick={() => setRight("exportar")}
          >
            Exportar
          </Btn>
          <Badge color={caps.supported ? "#a3e635" : "#fbbf24"}>{caps.mp4 ? "MP4" : caps.webm ? "WebM" : "off"}</Badge>
        </div>
      </div>

      {/* ── corpo ── */}
      <div className="grid min-h-0 flex-1 gap-2 xl:grid-cols-[300px_minmax(0,1fr)_330px]">
        <div className="panel hidden min-h-0 flex-col p-2 xl:flex">
          <MediaBin />
        </div>

        <div className="flex min-h-0 flex-col gap-2">
          <div className="panel flex min-h-0 flex-[1.35] flex-col p-2">
            <Preview />
          </div>
          <TransitionsStrip />
          <div className="panel flex min-h-0 flex-1 flex-col p-2">
            <Timeline />
          </div>
        </div>

        <div className="panel flex min-h-0 flex-col">
          <Tabs
            className="m-2"
            value={right}
            onChange={setRight}
            tabs={[
              { id: "inspetor" as RightTab, label: "Inspetor" },
              { id: "ferramentas" as RightTab, label: "Ferramentas" },
              { id: "exportar" as RightTab, label: "Exportar" },
            ]}
          />
          <div className="min-h-0 flex-1">
            {right === "inspetor" && <Inspector />}
            {right === "ferramentas" && <ToolsPanel />}
            {right === "exportar" && <ExportPanel />}
          </div>
        </div>
      </div>

      {/* ── modais ── */}
      <Modal open={showProjects} onClose={() => setShowProjects(false)} title="Projetos salvos no navegador" wide>
        <div className="space-y-2">
          <div className="flex gap-1.5">
            <Btn
              size="sm"
              variant="primary"
              icon={<FolderOpen className="size-3.5" />}
              onClick={() => void pickFiles(".json,application/json").then((files) => files[0] && s.importProjectFile(files[0]))}
            >
              Importar .editzz.json
            </Btn>
            <Btn size="sm" icon={<Save className="size-3.5" />} onClick={() => void s.exportProjectFile()}>
              Exportar projeto atual
            </Btn>
          </div>
          {state.savedProjects.length === 0 && <p className="text-[11.5px] text-dim">Nenhum projeto salvo ainda. Use o botão de disquete para guardar.</p>}
          <div className="scroll-thin max-h-80 space-y-1.5 overflow-y-auto pr-1">
            {state.savedProjects.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl border border-line bg-panel2/60 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] text-ink">{p.name}</p>
                  <p className="text-[10px] text-dim">{new Date(p.updatedAt).toLocaleString("pt-BR")}</p>
                </div>
                <Btn size="sm" variant="soft" onClick={() => { void s.openProject(p.id); setShowProjects(false); }}>
                  abrir
                </Btn>
                <IconBtn size="sm" title="Excluir" onClick={() => void s.deleteProject(p.id)}>
                  <Trash2 className="size-3.5 text-rose" />
                </IconBtn>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal open={showBg} onClose={() => setShowBg(false)} title="Fundo do quadro">
        <div className="space-y-3">
          <Sel
            label="Tipo"
            value={state.project.bg.type}
            onChange={(v) => s.setBg({ type: v as typeof state.project.bg.type })}
            options={[
              { value: "color", label: "Cor sólida" },
              { value: "gradient", label: "Gradiente" },
              { value: "blur", label: "Desfoque da mídia" },
              { value: "pattern", label: "Padrão" },
              { value: "transparent", label: "Transparente" },
            ]}
          />
          <Sel
            label="Padrão"
            value={state.project.bg.pattern}
            onChange={(v) => s.setBg({ pattern: v, type: "pattern" })}
            options={[
              { value: "grid", label: "Grade" },
              { value: "dots", label: "Pontos" },
              { value: "stripes", label: "Listras" },
              { value: "checker", label: "Xadrez" },
              { value: "noise", label: "Ruído" },
            ]}
          />
          <div className="flex flex-wrap gap-1.5">
            {GRADIENT_PRESETS.map(([from, to]) => (
              <button
                key={`${from}${to}`}
                type="button"
                title="Aplicar gradiente"
                onClick={() => s.setBg({ type: "gradient", from, to })}
                className="h-8 w-14 rounded-lg border border-line"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-muted">Cor</span>
              <input type="color" value={state.project.bg.color.slice(0, 7)} onChange={(e) => s.setBg({ color: e.target.value, type: "color" })} className="h-9 w-full" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-muted">De</span>
              <input type="color" value={state.project.bg.from} onChange={(e) => s.setBg({ from: e.target.value })} className="h-9 w-full" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-muted">Até</span>
              <input type="color" value={state.project.bg.to} onChange={(e) => s.setBg({ to: e.target.value })} className="h-9 w-full" />
            </label>
            <Slider label="Ângulo" value={state.project.bg.angle} min={0} max={360} onChange={(v) => s.setBg({ angle: v })} unit="°" />
          </div>
          <Slider label="Desfoque" value={state.project.bg.blurAmount} min={0} max={60} onChange={(v) => s.setBg({ blurAmount: v })} />
          <Slider label="Opacidade" value={state.project.bg.opacity} min={0} max={1} step={0.02} onChange={(v) => s.setBg({ opacity: v })} format={(v) => `${(v * 100).toFixed(0)}%`} />
          <div className="rounded-xl border border-line bg-panel2/60 p-2">
            <p className="mb-1.5 text-[11px] font-medium text-ink">Marca d&apos;água</p>
            <TextField label="Texto" value={state.project.watermark.text} onChange={(v) => s.setWatermark({ text: v })} />
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <Sel
                label="Posição"
                value={state.project.watermark.pos}
                onChange={(v) => s.setWatermark({ pos: v })}
                options={[
                  { value: "tl", label: "Alto esquerda" },
                  { value: "tr", label: "Alto direita" },
                  { value: "bl", label: "Baixo esquerda" },
                  { value: "br", label: "Baixo direita" },
                  { value: "center", label: "Centro" },
                ]}
              />
              <Slider label="Opacidade" value={state.project.watermark.opacity} min={0.05} max={1} step={0.05} onChange={(v) => s.setWatermark({ opacity: v })} />
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={showAudio} onClose={() => setShowAudio(false)} title="Sons e trilhas" wide>
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-medium text-ink">
              <Music2 className="size-3.5 text-cy" /> Trilhas procedurais (8 estilos)
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {MUSIC_STYLES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={!!sfxBusy}
                  onClick={async () => {
                    setSfxBusy(m.id);
                    try {
                      const buffer = await generateMusic({ style: m.id, bpm: m.bpm, seconds: 24 });
                      const { asset } = assetFromAudioBuffer(`${m.name} 24s`, buffer);
                      s.addAssets([asset]);
                      s.addAssetToTimeline(asset);
                      store.toast("Trilha criada", `${m.name} · 24s na timeline`, "ok");
                    } finally {
                      setSfxBusy(null);
                    }
                  }}
                  title={m.desc}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-left transition",
                    sfxBusy === m.id ? "border-cy bg-cy/15" : "border-line bg-panel2/60 hover:border-cy/60"
                  )}
                >
                  <span className="block truncate text-[11px] text-ink">{m.name}</span>
                  <span className="block truncate text-[9.5px] text-dim">{m.bpm} BPM · {m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11.5px] font-medium text-ink">Efeitos sonoros (16)</p>
            <div className="flex flex-wrap gap-1">
              {SFX_LIST.map((id) => {
                const meta = SOUND_EFFECTS.find((s) => s.id === id);
                return (
                  <Chip
                    key={id}
                    title={meta?.desc}
                    onClick={async () => {
                      if (sfxBusy) return;
                      setSfxBusy(id);
                      try {
                        const buffer = await generateSfx(id);
                        const { asset } = assetFromAudioBuffer(meta?.name ?? id, buffer);
                        s.addAssets([asset]);
                        s.addAssetToTimeline(asset);
                        store.toast("Efeito adicionado", `${meta?.name ?? id} na timeline`, "ok");
                      } finally {
                        setSfxBusy(null);
                      }
                    }}
                  >
                    {meta?.name ?? id}
                  </Chip>
                );
              })}
            </div>
          </div>

          <p className="text-[10.5px] text-dim">
            Tudo é sintetizado no navegador com Web Audio (OfflineAudioContext) — nenhum arquivo é baixado da internet.
          </p>
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════ faixa de transições com prévia ao passar o mouse ══════════════ */

function TransitionsStrip() {
  const { state, store: s } = useEditzz();
  const [group, setGroup] = useState<string>("Todas");
  const [duration, setDuration] = useState(0.6);
  const [hover, setHover] = useState<string | null>(null);
  const clip = state.project.clips.find((c) => c.id === state.selectedClipIds[0]);
  const list = TRANSITIONS.filter((t) => group === "Todas" || t.group === group);

  const apply = (id: string) => {
    if (!clip) {
      store.toast("Selecione um clipe", "A transição é aplicada na entrada do clipe selecionado.", "warn");
      return;
    }
    s.setTransition(clip.id, "in", id, duration);
    store.toast("Transição aplicada", `${TRANSITIONS.find((t) => t.id === id)?.name ?? id} · ${duration.toFixed(2)}s`, "ok");
  };

  return (
    <div className="panel flex flex-col gap-1.5 p-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1 font-display text-[11.5px] font-semibold text-ink">
          <ArrowLeftRight className="size-3.5 text-pink" /> Transições
        </span>
        <div className="scroll-thin flex max-w-full gap-1 overflow-x-auto">
          <Chip active={group === "Todas"} onClick={() => setGroup("Todas")}>
            Todas
          </Chip>
          {TRANSITION_GROUPS.map((g) => (
            <Chip key={g} active={group === g} onClick={() => setGroup(g)}>
              {g}
            </Chip>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-dim">duração</span>
          <input type="range" min={0.1} max={2.5} step={0.05} value={duration} onChange={(e) => setDuration(parseFloat(e.target.value))} className="w-20" />
          <span className="w-10 font-mono text-[10px] text-muted">{duration.toFixed(2)}s</span>
          <Btn
            size="xs"
            variant="soft"
            icon={<Wand2 className="size-3" />}
            onClick={() =>
              s.commit("Transições em todos os cortes", (p) => {
                const first = [...p.clips].filter((c) => c.kind !== "audio").sort((a, b) => a.start - b.start)[0];
                return {
                  ...p,
                  clips: p.clips.map((c) => (c.id === first?.id ? c : { ...c, transitionIn: { id: hover ?? "dissolve", duration } })),
                };
              })
            }
            title="Aplica a transição em todos os cortes (exceto o primeiro clipe)"
          >
            aplicar em todos os cortes
          </Btn>
        </div>
      </div>

      <div className="scroll-thin flex gap-2 overflow-x-auto pb-1">
        {list.map((t) => (
          <button
            key={t.id}
            type="button"
            onMouseEnter={() => setHover(t.id)}
            onMouseLeave={() => setHover(null)}
            onClick={() => apply(t.id)}
            title={t.desc}
            className={cn(
              "group relative w-28 shrink-0 overflow-hidden rounded-xl border p-1.5 text-left transition",
              clip?.transitionIn?.id === t.id ? "border-pink bg-pink/15" : "border-line bg-panel2/50 hover:border-pink/60"
            )}
          >
            <span className="relative block h-12 overflow-hidden rounded-lg">
              <span className="absolute inset-0 bg-[linear-gradient(135deg,#a855f7,#22d3ee)]" />
              <span className="absolute inset-0 bg-[linear-gradient(135deg,#f472b6,#fbbf24)] opacity-70 mix-blend-screen" />
              <span
                className={cn(
                  "absolute inset-0 bg-bg2/85 transition-transform duration-700",
                  hover === t.id ? "-translate-x-full" : "translate-x-0",
                  t.group === "Deslizar" && "origin-left",
                  t.group === "Zoom" && "origin-center scale-100"
                )}
                style={{
                  transitionTimingFunction: t.group === "Suave" ? "ease-in-out" : "cubic-bezier(.6,0,.2,1)",
                }}
              />
              <span className="absolute inset-x-0 bottom-0 truncate px-1 text-[8.5px] text-white/80">{t.group}</span>
            </span>
            <span className="mt-1 block truncate text-[10.5px] text-ink">{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

