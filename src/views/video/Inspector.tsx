import {
  ArrowDown,
  ArrowUp,
  Circle,
  Eye,
  EyeOff,
  Gauge,
  KeyRound,
  Layers,
  Minus,
  Music2,
  Palette,
  Pause,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Type as TypeIcon,
  Volume2,
  Wand2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { paletteFromAsset } from "@/core/analysis";
import { createCanvas, ctx2d } from "@/lib/utils";
import { renderToDataUrl, STABILIZER } from "@/core/engine";
import { computeStabilization } from "@/core/analysis";
import type { Adjustments } from "@/lib/presets";
import {
  ADJUST_DEFS,
  BLEND_MODES,
  EFFECTS,
  EFFECT_GROUPS,
  EASINGS,
  FONTS,
  KEYFRAME_PROPS,
  LOOKS,
  LOOK_GROUPS,
  MASK_SHAPES,
  SHAPES,
  SPEED_CURVES,
  STABILIZE_LEVELS,
  STICKER_GROUPS,
  TEXT_ANIMATIONS,
  TEXT_PRESETS,
  TRANSITIONS,
  VOICE_EFFECTS,
  type KeyframeProp,
} from "@/lib/presets";
import { autoEnhance } from "@/core/imageops";
import { clipEnd, type Clip } from "@/core/model";
import { store, useEditzz } from "@/core/store";
import { transport } from "@/core/transport";
import {
  Badge,
  Btn,
  Chip,
  EmptyState,
  IconBtn,
  NumField,
  Section,
  Sel,
  Slider,
  Tabs,
  TextField,
  Toggle,
} from "@/components/ui";
import { cn, clamp, hexToRgb, rgbToHex } from "@/lib/utils";

type InspectorTab = "transformar" | "cor" | "efeitos" | "texto" | "formas" | "audio" | "velocidade" | "mascara" | "keyframes" | "ia";

export default function Inspector() {
  const { state, store: s } = useEditzz();
  const [tab, setTab] = useState<InspectorTab>("transformar");
  const [effectGroup, setEffectGroup] = useState<string>("Todos");
  const [effectQuery, setEffectQuery] = useState("");

  const clips = state.project.clips.filter((c) => state.selectedClipIds.includes(c.id));
  const clip = clips[0];
  const multi = clips.length > 1;

  if (!clip) {
    return (
      <div className="flex h-full flex-col">
        <Tabs
          className="m-2"
          tabs={[{ id: "transformar" as InspectorTab, label: "Inspetor" }]}
          value="transformar"
          onChange={() => undefined}
        />
        <div className="p-3">
          <EmptyState
            icon={<Sparkles className="size-6" />}
            title="Nada selecionado"
            desc="Clique em um clipe na timeline para editar transformação, cor, efeitos, texto, áudio e keyframes. Selecione vários com Ctrl/Shift para editar em lote."
          />
          <div className="mt-3 space-y-1.5">
            <Btn size="sm" full icon={<TypeIcon className="size-3.5" />} onClick={() => s.addText()}>
              Adicionar texto
            </Btn>
            <Btn size="sm" full icon={<Wand2 className="size-3.5" />} onClick={() => s.addAdjustmentClip()}>
              Adicionar camada de ajuste
            </Btn>
            <Btn size="sm" full icon={<Circle className="size-3.5" />} onClick={() => s.addShape("rect")}>
              Adicionar forma
            </Btn>
          </div>
          <div className="mt-4">
            <p className="mb-1.5 text-[10.5px] uppercase tracking-wider text-dim">Atalhos</p>
            <div className="space-y-1 text-[11px] text-muted">
              {[
                ["Espaço", "reproduzir / pausar"],
                ["S", "dividir no playhead"],
                ["D", "duplicar seleção"],
                ["F", "congelar quadro"],
                ["M", "novo marcador"],
                ["Delete", "apagar seleção"],
                ["← →", "quadro a quadro"],
                ["Ctrl+Z / Ctrl+Shift+Z", "desfazer / refazer"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <span className="rounded border border-line bg-panel2 px-1.5 py-0.5 font-mono text-[10px] text-ink">{k}</span>
                  <span className="text-[10.5px] text-dim">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const patch = (p: Partial<Clip>, label?: string) => s.updateClip(clip.id, p, label ?? "Editar clipe");
  const patchAll = (p: Partial<Clip>, label?: string) => s.updateSelected(p, label ?? "Editar clipes");
  const lt = clamp(transport.getTime() - clip.start, 0, clip.duration);

  const applyToAll = async () => {
    if (!clip.adjust) return;
    s.commit("Look em todos", (proj) => ({
      ...proj,
      clips: proj.clips.map((c) => (c.kind === "audio" ? c : { ...c, look: clip.look, lookIntensity: clip.lookIntensity })),
    }));
    s.commit("Cor em todos", (proj) => ({
      ...proj,
      clips: proj.clips.map((c) => (c.kind === "audio" ? c : { ...c, adjust: { ...clip.adjust } })),
    }));
    store.toast("Aplicado em todos os clipes", "Cor e look replicados.", "ok");
  };

  const autoColor = async () => {
    const asset = state.assets.find((a) => a.id === clip.assetId);
    let source = createCanvas(320, 180);
    let ctx = ctx2d(source);
    if (asset && asset.kind !== "audio") {
      const url = await renderToDataUrl(state.project, state.assets, transport.getTime(), 320, 180, false);
      const img = new Image();
      img.src = url;
      await new Promise<void>((r) => {
        img.onload = () => r();
        img.onerror = () => r();
      });
      source = createCanvas(320, 180);
      ctx = ctx2d(source);
      ctx.drawImage(img, 0, 0, 320, 180);
    }
    const result = autoEnhance(source);
    if (result.adjust) {
      patch({ adjust: { ...clip.adjust, ...(result.adjust as Adjustments) } }, "Grade Inteligente");
      store.toast("Grade Inteligente aplicada", "Exposição, contraste e branco corrigidos por histograma.", "ok");
    }
  };

  const stabilize = async () => {
    const asset = state.assets.find((a) => a.id === clip.assetId);
    if (!asset || asset.kind !== "video") {
      store.toast("Selecione um clipe de vídeo", "A estabilização analisa o movimento entre quadros.", "warn");
      return;
    }
    s.set({ busy: "Analisando movimento…" });
    try {
      const track = await computeStabilization(asset, {
        from: clip.in,
        to: Math.min(asset.duration, clip.in + clip.duration),
        onProgress: (p) => s.set({ busy: `Analisando movimento… ${(p * 100).toFixed(0)}%` }),
      });
      STABILIZER.set(clip.id, track);
      patch({ stabilize: 0.6 }, "Estabilizar");
      store.toast("Estabilizado", `${track.length} amostras de movimento compensadas.`, "ok");
    } finally {
      s.set({ busy: null });
    }
  };

  const pickChromaColor = async () => {
    const url = await renderToDataUrl(state.project, state.assets, transport.getTime(), 160, 90, false);
    const img = new Image();
    img.src = url;
    await new Promise<void>((r) => {
      img.onload = () => r();
      img.onerror = () => r();
    });
    const c = createCanvas(160, 90);
    const g = ctx2d(c);
    g.drawImage(img, 0, 0);
    const px = g.getImageData(80, 45, 1, 1).data;
    const hex = rgbToHex(px[0], px[1], px[2]);
    patch({ chroma: { ...clip.chroma, color: hex, enabled: true } }, "Cor do chroma");
    store.toast("Cor capturada", hex, "ok");
  };

  const paletteToCaption = async () => {
    const asset = state.assets.find((a) => a.kind === "video" && a.id === clip.assetId) ?? state.assets.find((a) => a.kind === "video");
    if (!asset) {
      store.toast("Sem vídeo no projeto", "Adicione um clipe para extrair a paleta.", "warn");
      return;
    }
    const palette = await paletteFromAsset(asset, Math.min(1, asset.duration / 2));
    if (!palette.length) return;
    s.commit("Paleta nas legendas", (proj) => ({
      ...proj,
      clips: proj.clips.map((c) =>
        c.kind === "text" && c.text ? { ...c, text: { ...c.text, bgEnabled: true, bgColor: palette[0], color: palette[4] ?? "#ffffff", radius: 12, padding: 16 } } : c
      ),
    }));
    store.toast("Paleta aplicada às legendas", palette.join(" · "), "ok");
  };

  const filteredEffects = useMemo(
    () =>
      EFFECTS.filter(
        (e) =>
          (effectGroup === "Todos" || e.group === effectGroup) &&
          (!effectQuery ||
            e.name.toLowerCase().includes(effectQuery.toLowerCase()) ||
            e.desc.toLowerCase().includes(effectQuery.toLowerCase()))
      ),
    [effectGroup, effectQuery]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line p-2">
        <div className="mb-2 flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: clip.tag }} />
          <input
            value={clip.name}
            onChange={(e) => patch({ name: e.target.value }, "Renomear clipe")}
            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[12px] font-medium text-ink outline-none transition hover:border-line focus:border-vio/60"
          />
          {clip.locked && <Badge color="#fbbf24">bloqueado</Badge>}
          {multi && <Badge color="#22d3ee">{clips.length} selecionados</Badge>}
        </div>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "transformar" as InspectorTab, label: "Transformar" },
            { id: "cor" as InspectorTab, label: "Cor" },
            { id: "efeitos" as InspectorTab, label: "Efeitos" },
            { id: "texto" as InspectorTab, label: "Texto" },
            { id: "formas" as InspectorTab, label: "Formas" },
            { id: "audio" as InspectorTab, label: "Áudio" },
            { id: "velocidade" as InspectorTab, label: "Velocidade" },
            { id: "mascara" as InspectorTab, label: "Máscara" },
            { id: "keyframes" as InspectorTab, label: "Keyframes" },
            { id: "ia" as InspectorTab, label: "IA" },
          ]}
        />
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {tab === "transformar" && (
          <>
            <Section title="Posição e tamanho" icon={<Layers className="size-3.5 text-vio" />}>
              <Slider label="Posição X" value={clip.transform.x} min={-1} max={1} step={0.005} onChange={(v) => patchAll({ transform: { ...clip.transform, x: v } })} onReset={() => patchAll({ transform: { ...clip.transform, x: 0 } })} format={(v) => `${(v * 100).toFixed(1)}%`} />
              <Slider label="Posição Y" value={clip.transform.y} min={-1} max={1} step={0.005} onChange={(v) => patchAll({ transform: { ...clip.transform, y: v } })} onReset={() => patchAll({ transform: { ...clip.transform, y: 0 } })} format={(v) => `${(v * 100).toFixed(1)}%`} />
              <Slider label="Escala" value={clip.transform.scale} min={0.05} max={4} step={0.01} onChange={(v) => patchAll({ transform: { ...clip.transform, scale: v } })} onReset={() => patchAll({ transform: { ...clip.transform, scale: 1 } })} format={(v) => `${(v * 100).toFixed(0)}%`} />
              <Slider label="Rotação" value={clip.transform.rotate} min={-180} max={180} onChange={(v) => patchAll({ transform: { ...clip.transform, rotate: v } })} onReset={() => patchAll({ transform: { ...clip.transform, rotate: 0 } })} unit="°" />
              <div className="flex flex-wrap gap-1.5">
                <Chip active={clip.transform.flipH} onClick={() => patchAll({ transform: { ...clip.transform, flipH: !clip.transform.flipH } })}>Espelhar H</Chip>
                <Chip active={clip.transform.flipV} onClick={() => patchAll({ transform: { ...clip.transform, flipV: !clip.transform.flipV } })}>Espelhar V</Chip>
                <Chip onClick={() => patch({ transform: { x: 0, y: 0, scale: 1, rotate: 0, flipH: false, flipV: false } }, "Redefinir transformação")}>Redefinir</Chip>
              </div>
              <Slider label="Opacidade" value={clip.opacity} min={0} max={1} step={0.01} onChange={(v) => patchAll({ opacity: v })} onReset={() => patchAll({ opacity: 1 })} format={(v) => `${(v * 100).toFixed(0)}%`} />
              <Sel
                label="Modo de mistura"
                value={clip.blend}
                onChange={(v) => patchAll({ blend: v })}
                options={BLEND_MODES.map((b) => ({ value: b, label: b }))}
              />
            </Section>

            <Section title="Recorte (crop)" icon={<Minus className="size-3.5 text-cy" />}>
              {(["left", "right", "top", "bottom"] as const).map((side) => (
                <Slider
                  key={side}
                  label={{ left: "Esquerda", right: "Direita", top: "Topo", bottom: "Base" }[side]}
                  value={clip.crop[side]}
                  min={0}
                  max={0.45}
                  step={0.005}
                  onChange={(v) => patchAll({ crop: { ...clip.crop, [side]: v } })}
                  format={(v) => `${(v * 100).toFixed(0)}%`}
                  accent="#22d3ee"
                />
              ))}
              <Btn size="sm" full onClick={() => patchAll({ crop: { top: 0, right: 0, bottom: 0, left: 0 } }, "Limpar recorte")}>
                Limpar recorte
              </Btn>
            </Section>

            <Section title="Estabilização" icon={<Gauge className="size-3.5 text-lime" />} defaultOpen={false}>
              <Slider
                label="Força"
                value={clip.stabilize}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => patch({ stabilize: v })}
                format={(v) => `${(v * 100).toFixed(0)}%`}
                accent="#a3e635"
              />
              <div className="flex flex-wrap gap-1">
                {STABILIZE_LEVELS.map((lvl) => (
                  <Chip key={lvl.id} active={Math.abs(clip.stabilize - lvl.strength) < 0.02} onClick={() => patch({ stabilize: lvl.strength })}>
                    {lvl.name}
                  </Chip>
                ))}
              </div>
              <Btn size="sm" full variant="soft" icon={<Wand2 className="size-3.5" />} onClick={stabilize}>
                Analisar movimento e estabilizar
              </Btn>
              <p className="text-[10.5px] leading-relaxed text-dim">
                O editzz estima o deslocamento entre quadros em baixa resolução e aplica o contra-movimento suavizado.
              </p>
            </Section>
          </>
        )}

        {tab === "cor" && (
          <>
            <Section
              title="Look / filtro"
              icon={<Palette className="size-3.5 text-pink" />}
              right={
                <Btn size="xs" variant="ghost" onClick={applyToAll} title="Aplicar em todos os clipes">
                  aplicar em todos
                </Btn>
              }
            >
              <div className="scroll-thin grid max-h-52 grid-cols-3 gap-1.5 overflow-y-auto pr-1">
                {LOOKS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => patchAll({ look: l.id }, "Aplicar look")}
                    title={l.desc}
                    className={cn(
                      "group relative overflow-hidden rounded-lg border p-1.5 text-left transition",
                      clip.look === l.id ? "border-vio bg-vio/15" : "border-line bg-panel2/60 hover:border-line2"
                    )}
                  >
                    <span className="block truncate text-[10.5px] font-medium text-ink">{l.name}</span>
                    <span className="block truncate text-[9px] text-dim">{l.group}</span>
                  </button>
                ))}
              </div>
              <Slider label="Intensidade do look" value={clip.lookIntensity} min={0} max={100} onChange={(v) => patchAll({ lookIntensity: v })} format={(v) => `${v.toFixed(0)}%`} accent="var(--app-accent)" />
              <div className="flex flex-wrap gap-1">
                {LOOK_GROUPS.slice(0, 6).map((g) => (
                  <Chip key={g} onClick={() => patchAll({ look: LOOKS.find((l) => l.group === g)?.id ?? "none" }, "Look por grupo")}>
                    {g}
                  </Chip>
                ))}
              </div>
            </Section>

            <Section
              title="Ajustes de cor"
              icon={<Wand2 className="size-3.5 text-vio" />}
              right={
                <Btn size="xs" variant="ghost" onClick={autoColor}>
                  Grade Inteligente
                </Btn>
              }
            >
              {ADJUST_DEFS.map((d) => (
                <Slider
                  key={d.key}
                  label={d.label}
                  value={clip.adjust[d.key]}
                  min={d.min}
                  max={d.max}
                  onChange={(v) => clip.id && s.updateSelected({ adjust: { ...clip.adjust, [d.key]: v } }, "Ajuste de cor")}
                  onReset={() => s.updateSelected({ adjust: { ...clip.adjust, [d.key]: d.def } }, "Ajuste de cor")}
                  format={(v) => (d.max <= 100 && d.min >= -100 ? v.toFixed(0) : v.toFixed(0))}
                />
              ))}
              <div className="flex gap-1.5">
                <Btn
                  size="sm"
                  full
                  onClick={() =>
                    s.updateSelected(
                      { adjust: Object.fromEntries(ADJUST_DEFS.map((d) => [d.key, d.def])) as unknown as Adjustments },
                      "Redefinir cor"
                    )
                  }
                >
                  Redefinir cor
                </Btn>
                <Btn size="sm" full variant="soft" onClick={applyToAll}>
                  Cor em todos
                </Btn>
              </div>
            </Section>

            <Section title="Chroma key" icon={<Sparkles className="size-3.5 text-emerald" />} defaultOpen={false}>
              <Toggle label="Remover fundo colorido" checked={clip.chroma.enabled} onChange={(v) => patch({ chroma: { ...clip.chroma, enabled: v } })} hint="Funciona com fundo verde ou azul" />
              <div className="flex items-end gap-2">
                <TextField label="Cor-chave" value={clip.chroma.color} onChange={(v) => patch({ chroma: { ...clip.chroma, color: v } })} className="flex-1" mono />
                <input type="color" value={clip.chroma.color} onChange={(e) => patch({ chroma: { ...clip.chroma, color: e.target.value } })} className="size-9" />
              </div>
              <Btn size="sm" full variant="soft" onClick={pickChromaColor}>
                Capturar cor do centro do quadro
              </Btn>
              <Slider label="Tolerância" value={clip.chroma.tolerance} min={0} max={100} onChange={(v) => patch({ chroma: { ...clip.chroma, tolerance: v } })} accent="#34d399" />
              <Slider label="Suavidade da borda" value={clip.chroma.softness} min={0} max={100} onChange={(v) => patch({ chroma: { ...clip.chroma, softness: v } })} accent="#34d399" />
              <Slider label="Correção de spill" value={clip.chroma.spill} min={0} max={100} onChange={(v) => patch({ chroma: { ...clip.chroma, spill: v } })} accent="#34d399" />
            </Section>
          </>
        )}

        {tab === "efeitos" && (
          <>
            <Section title={`Efeitos do clipe (${clip.effects.length})`} icon={<Sparkles className="size-3.5 text-lime" />}>
              {clip.effects.length === 0 && <p className="text-[11px] text-dim">Nenhum efeito. Escolha na biblioteca abaixo.</p>}
              {clip.effects.map((eff, index) => {
                const def = EFFECTS.find((e) => e.id === eff.id);
                return (
                  <div key={`${eff.id}-${index}`} className="rounded-xl border border-line bg-panel2/60 p-2">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <button type="button" onClick={() => s.toggleEffect(clip.id, eff.id)} title="Ligar/desligar">
                        {eff.enabled ? <Eye className="size-3.5 text-emerald" /> : <EyeOff className="size-3.5 text-dim" />}
                      </button>
                      <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-ink">{def?.name ?? eff.id}</span>
                      <IconBtn size="sm" title="Mover para cima" onClick={() => s.reorderEffect(clip.id, index, index - 1)}>
                        <ArrowUp className="size-3" />
                      </IconBtn>
                      <IconBtn size="sm" title="Mover para baixo" onClick={() => s.reorderEffect(clip.id, index, index + 1)}>
                        <ArrowDown className="size-3" />
                      </IconBtn>
                      <IconBtn size="sm" title="Remover" onClick={() => s.removeEffect(clip.id, eff.id)}>
                        <Trash2 className="size-3 text-rose" />
                      </IconBtn>
                    </div>
                    {(def?.params ?? []).map((p) => (
                      <Slider
                        key={p.key}
                        compact
                        label={p.label}
                        value={eff.params[p.key] ?? p.def}
                        min={p.min}
                        max={p.max}
                        step={p.step ?? 1}
                        onChange={(v) => s.setEffectParam(clip.id, eff.id, p.key, v)}
                        accent="#a3e635"
                      />
                    ))}
                  </div>
                );
              })}
            </Section>

            <Section title="Biblioteca de efeitos" icon={<Plus className="size-3.5" />}>
              <TextField placeholder="Buscar efeito…" value={effectQuery} onChange={setEffectQuery} />
              <div className="scroll-thin flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                <Chip active={effectGroup === "Todos"} onClick={() => setEffectGroup("Todos")}>
                  Todos
                </Chip>
                {EFFECT_GROUPS.map((g) => (
                  <Chip key={g} active={effectGroup === g} onClick={() => setEffectGroup(g)}>
                    {g}
                  </Chip>
                ))}
              </div>
              <div className="scroll-thin grid max-h-72 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                {filteredEffects.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    title={e.desc}
                    onClick={() => s.addEffect(clip.id, e.id)}
                    className="rounded-lg border border-line bg-panel2/60 px-2 py-1.5 text-left transition hover:border-lime/60 hover:bg-lime/10"
                  >
                    <span className="block truncate text-[10.5px] font-medium text-ink">{e.name}</span>
                    <span className="block truncate text-[9px] text-dim">{e.group}</span>
                  </button>
                ))}
              </div>
            </Section>
          </>
        )}

        {tab === "texto" && (
          <TextPanel clip={clip} patch={patch} />
        )}

        {tab === "formas" && (
          <FormasPanel clip={clip} patch={patch} />
        )}

        {tab === "audio" && <AudioPanel clip={clip} patch={patch} />}

        {tab === "velocidade" && (
          <>
            <Section title="Velocidade" icon={<Gauge className="size-3.5 text-amber" />}>
              <Slider
                label="Multiplicador"
                value={clip.speed}
                min={0.1}
                max={8}
                step={0.05}
                onChange={(v) => s.setClipSpeed(clip.id, v)}
                format={(v) => `${v.toFixed(2)}x`}
                accent="#fbbf24"
              />
              <div className="flex flex-wrap gap-1">
                {[0.25, 0.5, 1, 1.5, 2, 4].map((v) => (
                  <Chip key={v} active={Math.abs(clip.speed - v) < 0.01} onClick={() => s.setClipSpeed(clip.id, v)}>
                    {v}x
                  </Chip>
                ))}
              </div>
              <Toggle label="Reproduzir ao contrário" checked={clip.reverse} onChange={(v) => patch({ reverse: v }, "Inverter clipe")} hint="Renderizado quadro a quadro na prévia" />
              <Btn size="sm" full variant="soft" icon={<Pause className="size-3.5" />} onClick={() => s.freezeFrameAt(transport.getTime())}>
                Congelar quadro atual (2s)
              </Btn>
            </Section>

            <Section title="Curva de velocidade" icon={<Gauge className="size-3.5 text-pink" />}>
              <div className="grid grid-cols-2 gap-1.5">
                {SPEED_CURVES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.desc}
                    onClick={() => s.setSpeedCurve(clip.id, c.id)}
                    className={cn(
                      "rounded-lg border p-1.5 text-left transition",
                      clip.speedCurve === c.id ? "border-vio bg-vio/15" : "border-line bg-panel2/60 hover:border-line2"
                    )}
                  >
                    <span className="block truncate text-[10.5px] text-ink">{c.name}</span>
                    <span className="mt-1 flex h-4 items-end gap-px">
                      {c.curve.slice(0, 12).map((v, i) => (
                        <span key={i} className="w-full rounded-sm bg-pink/70" style={{ height: `${clamp((v / 5) * 100, 8, 100)}%` }} />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
              <Slider
                label="Intensidade da curva"
                value={clip.curveAmount}
                min={0.2}
                max={2}
                step={0.05}
                onChange={(v) => patch({ curveAmount: v }, "Curva de velocidade")}
                format={(v) => `${v.toFixed(2)}x`}
                accent="var(--app-accent)"
              />
              <p className="text-[10.5px] leading-relaxed text-dim">
                O tempo de origem é calculado integrando a curva quadro a quadro — igual às rampas dos editores profissionais.
              </p>
            </Section>

            <Section title="Transição" icon={<Layers className="size-3.5 text-vio" />}>
              <Sel
                label="Transição de entrada"
                value={clip.transitionIn?.id ?? "none"}
                onChange={(v) => s.setTransition(clip.id, "in", v, clip.transitionIn?.duration ?? 0.6)}
                options={[{ value: "none", label: "Sem transição" }, ...TRANSITIONS.map((t) => ({ value: t.id, label: t.name }))]}
              />
              <Sel
                label="Transição de saída"
                value={clip.transitionOut?.id ?? "none"}
                onChange={(v) => s.setTransition(clip.id, "out", v, clip.transitionOut?.duration ?? 0.6)}
                options={[{ value: "none", label: "Sem transição" }, ...TRANSITIONS.map((t) => ({ value: t.id, label: t.name }))]}
              />
              <Slider
                label="Duração da transição"
                value={clip.transitionIn?.duration ?? clip.transitionOut?.duration ?? 0.6}
                min={0.1}
                max={2.5}
                step={0.05}
                onChange={(v) => {
                  if (clip.transitionIn) s.setTransition(clip.id, "in", clip.transitionIn.id, v);
                  if (clip.transitionOut) s.setTransition(clip.id, "out", clip.transitionOut.id, v);
                }}
                format={(v) => `${v.toFixed(2)}s`}
                accent="var(--app-accent)"
              />
            </Section>
          </>
        )}

        {tab === "mascara" && (
          <>
            <Section title="Máscara" icon={<Circle className="size-3.5 text-cy" />}>
              <div className="grid grid-cols-3 gap-1.5">
                {MASK_SHAPES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => patch({ mask: { ...clip.mask, shape: m.id } }, "Máscara")}
                    className={cn(
                      "rounded-lg border px-1.5 py-1 text-[10px] transition",
                      clip.mask.shape === m.id ? "border-vio bg-vio/15 text-white" : "border-line bg-panel2/60 text-muted hover:text-ink"
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
              <Toggle label="Inverter máscara" checked={clip.mask.invert} onChange={(v) => patch({ mask: { ...clip.mask, invert: v } }, "Máscara")} />
              <Slider label="Suavidade (feather)" value={clip.mask.feather} min={0} max={100} onChange={(v) => patch({ mask: { ...clip.mask, feather: v } }, "Máscara")} accent="#22d3ee" />
              <Slider label="Posição X" value={clip.mask.x} min={-1} max={1} step={0.01} onChange={(v) => patch({ mask: { ...clip.mask, x: v } }, "Máscara")} format={(v) => `${(v * 100).toFixed(0)}%`} accent="#22d3ee" />
              <Slider label="Posição Y" value={clip.mask.y} min={-1} max={1} step={0.01} onChange={(v) => patch({ mask: { ...clip.mask, y: v } }, "Máscara")} format={(v) => `${(v * 100).toFixed(0)}%`} accent="#22d3ee" />
              <Slider label="Tamanho" value={clip.mask.scale} min={0.05} max={3} step={0.01} onChange={(v) => patch({ mask: { ...clip.mask, scale: v } }, "Máscara")} format={(v) => `${(v * 100).toFixed(0)}%`} accent="#22d3ee" />
              <Slider label="Rotação" value={clip.mask.rotate} min={-180} max={180} onChange={(v) => patch({ mask: { ...clip.mask, rotate: v } }, "Máscara")} unit="°" accent="#22d3ee" />
            </Section>
            <Section title="Enquadramento" icon={<Layers className="size-3.5" />} defaultOpen={false}>
              <div className="flex gap-1.5">
                <Btn size="sm" full onClick={() => patch({ transform: { x: 0, y: 0, scale: 1, rotate: 0, flipH: false, flipV: false }, crop: { top: 0, right: 0, bottom: 0, left: 0 } }, "Centralizar")}>
                  Centralizar
                </Btn>
                <Btn size="sm" full onClick={() => patch({ transform: { ...clip.transform, scale: 1 } }, "Preencher quadro")}>
                  Preencher quadro
                </Btn>
              </div>
            </Section>
          </>
        )}

        {tab === "keyframes" && (
          <>
            <Section title="Animar propriedades" icon={<KeyRound className="size-3.5 text-amber" />}>
              <p className="text-[10.5px] text-dim">
                Playhead em <span className="font-mono text-ink">{lt.toFixed(2)}s</span> do clipe ({clip.duration.toFixed(2)}s).
              </p>
              {KEYFRAME_PROPS.map((p) => {
                const list = clip.keyframes[p.id] ?? [];
                const near = list.find((k) => Math.abs(k.t - lt) < 0.06);
                return (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-[11px] text-muted">{p.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const value =
                          p.id === "x"
                            ? clip.transform.x
                            : p.id === "y"
                              ? clip.transform.y
                              : p.id === "scale"
                                ? clip.transform.scale
                                : p.id === "rotate"
                                  ? clip.transform.rotate
                                  : p.id === "opacity"
                                    ? clip.opacity
                                    : p.id === "volume"
                                      ? clip.audio.volume
                                      : clip.adjust[p.id as keyof Adjustments];
                        s.toggleKeyframe(p.id as KeyframeProp, value);
                      }}
                      className={cn(
                        "flex size-6 items-center justify-center rounded-md border transition",
                        near ? "border-amber bg-amber/25 text-white" : "border-line bg-panel2 text-dim hover:text-ink"
                      )}
                      title="Adicionar/remover keyframe no playhead"
                    >
                      ◆
                    </button>
                    <span className="font-mono text-[10.5px] text-dim">{list.length} kf</span>
                    {list.length > 0 && (
                      <button type="button" className="text-[10px] text-dim hover:text-rose" onClick={() => patch({ keyframes: { ...clip.keyframes, [p.id]: [] } }, "Limpar keyframes")}>
                        limpar
                      </button>
                    )}
                  </div>
                );
              })}
            </Section>
            <Section title="Keyframes do clipe" icon={<KeyRound className="size-3.5" />}>
              {Object.entries(clip.keyframes).filter(([, v]) => v && v.length).length === 0 ? (
                <p className="text-[11px] text-dim">Nenhum keyframe ainda. Adicione acima e mova o playhead para criar novos pontos.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(clip.keyframes)
                    .filter(([, v]) => v && v.length)
                    .map(([prop, list]) => (
                      <div key={prop} className="rounded-lg border border-line bg-panel2/60 p-2">
                        <p className="mb-1 text-[11px] font-medium text-ink">{KEYFRAME_PROPS.find((p) => p.id === prop)?.label ?? prop}</p>
                        <div className="space-y-1">
                          {(list ?? []).map((k, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-12 font-mono text-[10px] text-dim">{k.t.toFixed(2)}s</span>
                              <NumField value={k.v} step={0.01} onChange={(v) => {
                                const next = (clip.keyframes[prop as KeyframeProp] ?? []).map((kk, idx) => (idx === i ? { ...kk, v } : kk));
                                patch({ keyframes: { ...clip.keyframes, [prop]: next } }, "Keyframe");
                              }} className="flex-1" />
                              <Sel
                                compact
                                value={k.e}
                                onChange={(e) => {
                                  const next = (clip.keyframes[prop as KeyframeProp] ?? []).map((kk, idx) => (idx === i ? { ...kk, e } : kk));
                                  patch({ keyframes: { ...clip.keyframes, [prop]: next } }, "Easing");
                                }}
                                options={EASINGS.map((e) => ({ value: e.id, label: e.name }))}
                              />
                              <IconBtn size="sm" title="Remover" onClick={() => patch({ keyframes: { ...clip.keyframes, [prop]: (clip.keyframes[prop as KeyframeProp] ?? []).filter((_, idx) => idx !== i) } }, "Remover keyframe")}>
                                <Trash2 className="size-3 text-rose" />
                              </IconBtn>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Section>
          </>
        )}

        {tab === "ia" && (
          <>
            <Section title="Ferramentas inteligentes" icon={<Sparkles className="size-3.5 text-vio" />}>
              <div className="space-y-1.5">
                <Btn size="sm" full variant="soft" onClick={autoColor}>Grade Inteligente (auto cor)</Btn>
                <Btn size="sm" full variant="soft" onClick={stabilize}>Estabilizar clipe</Btn>
                <Btn size="sm" full variant="soft" onClick={pickChromaColor}>Capturar cor para chroma key</Btn>
                <Btn size="sm" full variant="soft" onClick={paletteToCaption}>Paleta do vídeo → legendas</Btn>
                <Btn size="sm" full variant="soft" onClick={() => s.set({ view: "video" })}>Abrir painel de legendas automáticas</Btn>
              </div>
              <p className="text-[10.5px] leading-relaxed text-dim">
                Rastreamento, detecção de cenas, remoção de silêncio, corte na batida e auto-reframe ficam no painel
                <strong className="text-ink"> Ferramentas</strong> da barra superior do vídeo.
              </p>
            </Section>
            <Section title="Presets salvos" icon={<Save className="size-3.5 text-lime" />} defaultOpen={false}>
              <Btn size="sm" full variant="soft" onClick={() => saveLookFromClip(clip)}>
                Salvar look deste clipe
              </Btn>
              <div className="flex flex-wrap gap-1">
                {savedLooks().map((l) => (
                  <Chip key={l.name} onClick={() => patch({ look: "none", adjust: l.adjust, lookIntensity: 100 }, `Look salvo: ${l.name}`)}>
                    {l.name}
                  </Chip>
                ))}
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

/* ────────────── painel de texto ────────────── */

function TextPanel({ clip, patch }: { clip: Clip; patch: (p: Partial<Clip>, label?: string) => void }) {
  const ts = clip.text;
  if (!ts) {
    return (
      <div className="p-3">
        <EmptyState
          title="Este clipe não tem texto"
          desc="Adicione um clipe de texto para editar fonte, animação, contorno e legendas."
          action={<Btn size="sm" variant="primary" onClick={() => addTextNow()}>Adicionar texto no playhead</Btn>}
        />
      </div>
    );
  }
  const set = (p: Partial<typeof ts>, label = "Editar texto") => patch({ text: { ...ts, ...p } }, label);
  return (
    <>
      <Section title="Conteúdo" icon={<TypeIcon className="size-3.5 text-amber" />}>
        <TextField textarea rows={3} value={ts.content} onChange={(v) => set({ content: v })} placeholder="Digite a legenda ou o título…" />
        <div className="grid grid-cols-2 gap-2">
          <Sel label="Fonte" value={ts.font} onChange={(v) => set({ font: v })} options={FONTS.map((f) => ({ value: f.id, label: f.name }))} />
          <Sel
            label="Peso"
            value={String(ts.weight)}
            onChange={(v) => set({ weight: parseInt(v, 10) })}
            options={[300, 400, 500, 600, 700, 800, 900].map((w) => ({ value: String(w), label: String(w) }))}
          />
        </div>
        <Slider label="Tamanho" value={ts.size} min={12} max={240} onChange={(v) => set({ size: v })} unit="px" accent="#fbbf24" />
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Espaçamento de letras" value={ts.letterSpacing} onChange={(v) => set({ letterSpacing: v })} />
          <NumField label="Altura da linha" value={ts.lineHeight} step={0.05} onChange={(v) => set({ lineHeight: v })} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={ts.uppercase} onClick={() => set({ uppercase: !ts.uppercase })}>ABC</Chip>
          <Chip active={ts.italic} onClick={() => set({ italic: !ts.italic })}>itálico</Chip>
          <Chip active={ts.align === "left"} onClick={() => set({ align: "left" })}>esquerda</Chip>
          <Chip active={ts.align === "center"} onClick={() => set({ align: "center" })}>centro</Chip>
          <Chip active={ts.align === "right"} onClick={() => set({ align: "right" })}>direita</Chip>
        </div>
      </Section>

      <Section title="Cores e contorno" icon={<Palette className="size-3.5 text-pink" />}>
        <div className="flex items-center gap-2">
          <input type="color" value={ts.color} onChange={(e) => set({ color: e.target.value })} className="size-8" />
          <TextField value={ts.color} onChange={(v) => set({ color: v })} mono className="flex-1" />
        </div>
        <Toggle label="Gradiente no texto" checked={ts.gradientEnabled} onChange={(v) => set({ gradientEnabled: v })} />
        {ts.gradientEnabled && (
          <div className="grid grid-cols-3 gap-2">
            <ColorLite label="De" value={ts.gradientFrom} onChange={(v) => set({ gradientFrom: v })} />
            <ColorLite label="Até" value={ts.gradientTo} onChange={(v) => set({ gradientTo: v })} />
            <NumField label="Ângulo" value={ts.gradientAngle} onChange={(v) => set({ gradientAngle: v })} unit="°" />
          </div>
        )}
        <Toggle label="Contorno" checked={ts.strokeEnabled} onChange={(v) => set({ strokeEnabled: v })} />
        {ts.strokeEnabled && (
          <>
            <div className="flex items-center gap-2">
              <input type="color" value={ts.strokeColor} onChange={(e) => set({ strokeColor: e.target.value })} className="size-8" />
              <Slider label="Espessura" value={ts.strokeWidth} min={1} max={30} onChange={(v) => set({ strokeWidth: v })} accent="var(--app-accent)" />
            </div>
          </>
        )}
        <Toggle label="Sombra" checked={ts.shadowEnabled} onChange={(v) => set({ shadowEnabled: v })} />
        {ts.shadowEnabled && (
          <div className="grid grid-cols-2 gap-2">
            <NumField label="Desfoque" value={ts.shadowBlur} onChange={(v) => set({ shadowBlur: v })} />
            <NumField label="Desloc. Y" value={ts.shadowY} onChange={(v) => set({ shadowY: v })} />
          </div>
        )}
        <Toggle label="Caixa de fundo" checked={ts.bgEnabled} onChange={(v) => set({ bgEnabled: v })} />
        {ts.bgEnabled && (
          <div className="grid grid-cols-2 gap-2">
            <ColorLite label="Cor" value={ts.bgColor} onChange={(v) => set({ bgColor: v })} />
            <NumField label="Opacidade" value={ts.bgOpacity} step={0.05} onChange={(v) => set({ bgOpacity: v })} />
            <NumField label="Margem" value={ts.padding} onChange={(v) => set({ padding: v })} />
            <NumField label="Raio" value={ts.radius} onChange={(v) => set({ radius: v })} />
          </div>
        )}
      </Section>

      <Section title="Animação" icon={<Sparkles className="size-3.5 text-cy" />}>
        <div className="grid grid-cols-2 gap-1.5">
          {TEXT_ANIMATIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              title={a.desc}
              onClick={() => set({ animation: a.id }, "Animação de texto")}
              className={cn(
                "rounded-lg border px-1.5 py-1 text-left text-[10px] transition",
                ts.animation === a.id ? "border-vio bg-vio/15 text-white" : "border-line bg-panel2/60 text-muted hover:text-ink"
              )}
            >
              {a.name}
            </button>
          ))}
        </div>
        <Slider label="Velocidade da animação" value={ts.animationSpeed} min={0.2} max={4} step={0.05} onChange={(v) => set({ animationSpeed: v })} format={(v) => `${v.toFixed(2)}x`} accent="#22d3ee" />
      </Section>

      <Section title="Predefinições de texto" icon={<Save className="size-3.5" />} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-1.5">
          {TEXT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                patch(
                  {
                    text: {
                      ...ts,
                      font: p.font,
                      weight: p.weight,
                      size: p.size,
                      color: p.color,
                      uppercase: p.uppercase ?? false,
                      letterSpacing: p.letterSpacing ?? 0,
                      strokeEnabled: !!p.strokeColor,
                      strokeColor: p.strokeColor ?? ts.strokeColor,
                      strokeWidth: p.strokeWidth ?? ts.strokeWidth,
                      bgEnabled: !!p.bgColor,
                      bgColor: p.bgColor ?? ts.bgColor,
                      shadowEnabled: !!p.shadow,
                      animation: p.animation ?? ts.animation,
                    },
                  },
                  `Texto: ${p.name}`
                )
              }
              className="rounded-lg border border-line bg-panel2/60 px-2 py-1.5 text-left text-[10.5px] text-ink transition hover:border-amber/60"
            >
              {p.name}
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}

function addTextNow() {
  store.addText();
}

function ColorLite({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-muted">{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-full" />
    </label>
  );
}

/* ────────────── painel de formas ────────────── */

function FormasPanel({ clip, patch }: { clip: Clip; patch: (p: Partial<Clip>, label?: string) => void }) {
  const { store: s } = useEditzz();
  const sh = clip.shape;
  if (!sh) {
    return (
      <div className="space-y-3 p-3">
        <p className="text-[11px] text-dim">Adicione formas, adesivos e grafismos:</p>
        <div className="grid grid-cols-3 gap-1.5">
          {SHAPES.map((shape) => (
            <button
              key={shape.id}
              type="button"
              onClick={() => s.addShape(shape.id)}
              className="rounded-lg border border-line bg-panel2/60 px-1.5 py-1.5 text-[10px] text-muted transition hover:border-vio/60 hover:text-ink"
            >
              {shape.name}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-dim">Adesivos:</p>
        {STICKER_GROUPS.map((g) => (
          <div key={g.group}>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-dim">{g.group}</p>
            <div className="flex flex-wrap gap-1">
              {g.items.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => s.addSticker(emoji)}
                  className="rounded-md border border-line bg-panel2/60 px-1.5 py-1 text-base transition hover:border-vio/60"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  const set = (p: Partial<typeof sh>, label = "Editar forma") => patch({ shape: { ...sh, ...p } }, label);
  return (
    <>
      <Section title="Forma" icon={<Circle className="size-3.5 text-vio" />}>
        <div className="grid grid-cols-3 gap-1.5">
          {SHAPES.map((shape) => (
            <button
              key={shape.id}
              type="button"
              onClick={() => set({ shape: shape.id }, "Trocar forma")}
              className={cn(
                "rounded-lg border px-1.5 py-1 text-[10px] transition",
                sh.shape === shape.id ? "border-vio bg-vio/15 text-white" : "border-line bg-panel2/60 text-muted hover:text-ink"
              )}
            >
              {shape.name}
            </button>
          ))}
        </div>
        {sh.shape === "sticker" && (
          <>
            <TextField label="Emoji / caractere" value={sh.text} onChange={(v) => set({ text: v })} />
            <div className="flex flex-wrap gap-1">
              {STICKER_GROUPS.flatMap((g) => g.items)
                .slice(0, 24)
                .map((emoji) => (
                  <button key={emoji} type="button" onClick={() => set({ text: emoji })} className="rounded border border-line px-1.5 py-0.5 text-base">
                    {emoji}
                  </button>
                ))}
            </div>
          </>
        )}
        <div className="flex items-center gap-2">
          <ColorLite label="Cor" value={sh.fill} onChange={(v) => set({ fill: v })} />
          <ColorLite label="Cor 2" value={sh.fill2} onChange={(v) => set({ fill2: v })} />
        </div>
        <Toggle label="Gradiente" checked={sh.gradient} onChange={(v) => set({ gradient: v })} />
        <Slider label="Contorno" value={sh.strokeWidth} min={0} max={30} onChange={(v) => set({ strokeWidth: v })} />
        {(sh.shape === "rect" || sh.shape === "speech") && <Slider label="Cantos" value={sh.radius} min={0} max={80} onChange={(v) => set({ radius: v })} />}
        {sh.shape === "bars" && (
          <>
            <Slider label="Número de barras" value={sh.count} min={4} max={64} onChange={(v) => set({ count: v })} />
            <Slider label="Velocidade" value={sh.speed} min={0.2} max={4} step={0.05} onChange={(v) => set({ speed: v })} />
          </>
        )}
      </Section>
      <Section title="Posição" icon={<Layers className="size-3.5" />} defaultOpen={false}>
        <p className="text-[10.5px] text-dim">Ajuste posição, escala e rotação na aba Transformar.</p>
      </Section>
    </>
  );
}

/* ────────────── painel de áudio ────────────── */

function AudioPanel({ clip, patch }: { clip: Clip; patch: (p: Partial<Clip>, label?: string) => void }) {
  const { state, store: s } = useEditzz();
  const asset = state.assets.find((a) => a.id === clip.assetId);
  const set = (p: Partial<typeof clip.audio>, label = "Áudio") => patch({ audio: { ...clip.audio, ...p } }, label);
  const [busy, setBusy] = useState(false);

  const process = async (mode: "voice" | "denoise" | "isolate") => {
    if (!asset || asset.kind === "image") return;
    setBusy(true);
    s.set({ busy: "Processando áudio…" });
    try {
      const { processBuffer, isolateVoice, assetFromAudioBuffer } = await import("@/core/audio");
      const buffer = await import("@/core/media").then((m) => m.pool.decodeAudio(asset));
      if (!buffer) throw new Error("sem áudio");
      const out =
        mode === "isolate"
          ? await isolateVoice(buffer)
          : await processBuffer(buffer, {
              denoise: mode === "denoise" ? 70 : clip.audio.denoise,
              highpass: clip.audio.highpass,
              lowpass: clip.audio.lowpass,
              normalize: true,
              gain: clip.audio.gain,
              pitch: clip.audio.pitch,
              voice: clip.audio.voice,
            });
      const { asset: newAsset } = assetFromAudioBuffer(`${asset.name} (${mode === "isolate" ? "voz isolada" : mode === "denoise" ? "limpo" : "tratado"})`, out, "gerado");
      s.addAssets([newAsset]);
      s.addAssetToTimeline(newAsset, clip.trackId, clip.start);
      store.toast("Áudio processado", "Novo clipe criado na timeline.", "ok");
    } catch {
      store.toast("Não foi possível processar", "O arquivo pode não ter faixa de áudio decodificável.", "erro");
    } finally {
      setBusy(false);
      s.set({ busy: null });
    }
  };

  return (
    <>
      <Section title="Volume e fades" icon={<Volume2 className="size-3.5 text-cy" />}>
        <Slider label="Volume" value={clip.audio.volume} min={0} max={3} step={0.02} onChange={(v) => set({ volume: v })} onReset={() => set({ volume: 1 })} format={(v) => `${(v * 100).toFixed(0)}%`} accent="#22d3ee" />
        <Toggle label="Silenciar clipe" checked={clip.audio.muted} onChange={(v) => set({ muted: v })} />
        <Slider label="Fade in" value={clip.audio.fadeIn} min={0} max={Math.max(0.2, clip.duration)} step={0.05} onChange={(v) => set({ fadeIn: v })} format={(v) => `${v.toFixed(2)}s`} accent="#22d3ee" />
        <Slider label="Fade out" value={clip.audio.fadeOut} min={0} max={Math.max(0.2, clip.duration)} step={0.05} onChange={(v) => set({ fadeOut: v })} format={(v) => `${v.toFixed(2)}s`} accent="#22d3ee" />
        <Toggle label="Ducking" checked={clip.audio.ducking} onChange={(v) => set({ ducking: v })} hint="Abaixa a trilha quando há voz" />
      </Section>

      <Section title="Tratamento" icon={<Music2 className="size-3.5 text-emerald" />}>
        <Toggle label="É áudio de trilha" checked={clip.kind === "audio"} onChange={() => undefined} />
        <Slider label="Gate de ruído" value={clip.audio.denoise} min={0} max={100} onChange={(v) => set({ denoise: v })} accent="#34d399" />
        <Slider label="Passa-alta (Hz)" value={clip.audio.highpass} min={0} max={800} step={10} onChange={(v) => set({ highpass: v })} accent="#34d399" />
        <Slider label="Passa-baixa (Hz)" value={clip.audio.lowpass} min={0} max={16000} step={100} onChange={(v) => set({ lowpass: v })} format={(v) => (v ? `${v}Hz` : "livre")} accent="#34d399" />
        <Slider label="Ganho (dB)" value={clip.audio.gain} min={-20} max={20} step={0.5} onChange={(v) => set({ gain: v })} unit="dB" accent="#34d399" />
        <div className="grid grid-cols-2 gap-1.5">
          <Btn size="sm" disabled={busy} onClick={() => void process("denoise")}>Remover ruído</Btn>
          <Btn size="sm" disabled={busy} onClick={() => void process("isolate")}>Isolar voz</Btn>
          <Btn size="sm" disabled={busy} onClick={() => void process("voice")}>Aplicar voz</Btn>
          <Btn size="sm" disabled={busy} onClick={() => void process("denoise")}>Normalizar</Btn>
        </div>
      </Section>

      <Section title="Voz" icon={<Music2 className="size-3.5 text-pink" />} defaultOpen={false}>
        <Sel label="Efeito de voz" value={clip.audio.voice} onChange={(v) => set({ voice: v })} options={VOICE_EFFECTS.map((v) => ({ value: v.id, label: v.name }))} />
        <Slider label="Tom (pitch)" value={clip.audio.pitch} min={-12} max={12} onChange={(v) => set({ pitch: v })} unit=" semitons" accent="var(--app-accent)" />
        <p className="text-[10.5px] leading-relaxed text-dim">
          O efeito é aplicado ao processar o clipe (botão “Aplicar voz”), gerando um novo arquivo de áudio na timeline.
        </p>
      </Section>

      <Section title="Informações do arquivo" icon={<Eye className="size-3.5" />} defaultOpen={false}>
        <div className="space-y-1 text-[10.5px] text-dim">
          <p>Mídia: <span className="text-ink">{asset?.name ?? "—"}</span></p>
          <p>Duração de origem: <span className="text-ink">{asset?.duration.toFixed(2) ?? "—"}s</span></p>
          <p>Recorte na timeline: <span className="text-ink">{clip.in.toFixed(2)}s → {(clip.in + clip.duration * clip.speed).toFixed(2)}s</span></p>
          <p>Trecho na timeline: <span className="text-ink">{clip.start.toFixed(2)}s → {clipEnd(clip).toFixed(2)}s</span></p>
          {asset?.sizeBytes ? <p>Tamanho: <span className="text-ink">{(asset.sizeBytes / 1024 / 1024).toFixed(2)} MB</span></p> : null}
        </div>
      </Section>
    </>
  );
}

/* ────────────── presets de look salvos pelo usuário ────────────── */

const LOOK_KEY = "editzz.looks";

export function savedLooks(): { name: string; adjust: Adjustments }[] {
  try {
    return JSON.parse(localStorage.getItem(LOOK_KEY) ?? "[]") as { name: string; adjust: Adjustments }[];
  } catch {
    return [];
  }
}

export function saveLookFromClip(clip: Clip) {
  try {
    const list = savedLooks();
    const name = window.prompt("Nome do look:", `Meu look ${list.length + 1}`);
    if (!name) return;
    list.push({ name, adjust: clip.adjust });
    localStorage.setItem(LOOK_KEY, JSON.stringify(list));
    store.toast("Look salvo", `${name} disponível na aba IA e nos looks.`, "ok");
  } catch {
    store.toast("Não foi possível salvar", undefined, "erro");
  }
}

export function exportLooks() {
  const data = JSON.stringify({ app: "editzz", kind: "look", version: 1, looks: savedLooks() }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "editzz-looks.editzz-look.json";
  a.click();
}

export { hexToRgb };
