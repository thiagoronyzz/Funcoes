import { Check, Film, LayoutTemplate, Music2, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { generateSfx } from "@/core/audio";
import { assetFromAudioBuffer } from "@/core/audio";
import { createTextClip, type Clip } from "@/core/model";
import { store, useEditzz } from "@/core/store";
import { transport } from "@/core/transport";
import { Badge, Btn, Chip, Section, Toggle } from "@/components/ui";
import { CAPTION_STYLES, TEMPLATES } from "@/lib/presets";
import { cn, uid } from "@/lib/utils";

interface Recipe {
  aspect: [number, number];
  look: string;
  bg: { type: "color" | "gradient" | "blur" | "pattern"; from: string; to: string; pattern?: string };
  transition?: string;
  addTitle?: { text: string; animation: string; font: string; size: number; uppercase?: boolean; bgColor?: string; color?: string };
  captions?: string;
  sfx?: string;
  music?: string;
  effects?: { id: string; params?: Record<string, number> }[];
  steps: string[];
}

const RECIPES: Record<string, Recipe> = {
  reels_rapido: {
    aspect: [1080, 1920],
    look: "viral_pop",
    bg: { type: "blur", from: "#0b0b12", to: "#1b1b2a" },
    transition: "zoom_in",
    captions: "tiktok_box",
    music: "pop",
    effects: [{ id: "shake", params: { amount: 22, speed: 5 } }],
    steps: ["Formato 9:16 aplicado", "Cortes a cada 2s com zoom", "Legenda TikTok pronta", "Trilha pop sugerida"],
  },
  vlog_viagem: {
    aspect: [1920, 1080],
    look: "kodak_2383",
    bg: { type: "gradient", from: "#0f172a", to: "#1e293b" },
    transition: "dissolve",
    addTitle: { text: "MINHA VIAGEM", animation: "slide_up", font: "Space Grotesk", size: 92, uppercase: true },
    music: "lofi",
    steps: ["Formato 16:9 aplicado", "Título de abertura criado", "Transições suaves", "Trilha lo-fi sugerida"],
  },
  antes_depois: {
    aspect: [1080, 1080],
    look: "studio_beauty",
    bg: { type: "color", from: "#07070b", to: "#07070b" },
    transition: "wipe_l",
    captions: "outline_white",
    steps: ["Quadrado 1:1 aplicado", "Use máscara split + transição wipe", "Rótulos antes/depois com texto"],
  },
  trailer_cinema: {
    aspect: [2048, 858],
    look: "moody_teal",
    bg: { type: "color", from: "#000000", to: "#000000" },
    addTitle: { text: "EM BREVE", animation: "blur_in", font: "Georgia", size: 96, uppercase: true },
    sfx: "braam",
    music: "cinematic",
    effects: [{ id: "old_film", params: { amount: 30 } }, { id: "vignette_strong", params: { amount: 45 } }],
    steps: ["Formato cinema 2.39:1", "Braam adicionado", "Grão e vinheta cinematográficos"],
  },
  tutorial_legenda: {
    aspect: [1920, 1080],
    look: "studio_beauty",
    bg: { type: "color", from: "#0b0b12", to: "#0b0b12" },
    captions: "minimal",
    addTitle: { text: "PASSO 1", animation: "pop", font: "Inter", size: 72, uppercase: true, bgColor: "#a3e635", color: "#0b0b12" },
    steps: ["Formato aula 16:9", "Numeração de passos", "Legendas minimalistas", "Zoom no detalhe pelo inspetor"],
  },
  slides_musica: {
    aspect: [1080, 1350],
    look: "faded_matte",
    bg: { type: "gradient", from: "#3b0764", to: "#0e7490" },
    transition: "zoom_in",
    music: "ambient",
    steps: ["Retrato 4:5 para feed", "Animação Ken Burns (escala lenta)", "Batidas marcadas para sincronizar fotos"],
  },
  gameplay_hype: {
    aspect: [1080, 1920],
    look: "viral_pop",
    bg: { type: "color", from: "#07070b", to: "#07070b" },
    transition: "glitch",
    captions: "neon",
    effects: [{ id: "zoom_pulse", params: { amount: 35, bpm: 140 } }, { id: "chromatic_aberration", params: { amount: 30 } }],
    sfx: "whoosh",
    steps: ["Vertical 9:16", "Zoom pulse na batida (140 BPM)", "Glitch nas transições", "Legenda neon"],
  },
  podcast_clip: {
    aspect: [1080, 1080],
    look: "editorial",
    bg: { type: "color", from: "#1e293b", to: "#1e293b" },
    captions: "podcast",
    effects: [{ id: "bloom", params: { amount: 25 } }],
    steps: ["Formato quadrado", "Legenda estilo podcast", "Multicam alternado 2s", "Remover silêncio no painel de ferramentas"],
  },
  produto_loja: {
    aspect: [1080, 1080],
    look: "snow_clean",
    bg: { type: "gradient", from: "#f8fafc", to: "#e2e8f0" },
    addTitle: { text: "R$ 199,90", animation: "pop", font: "Inter", size: 78, uppercase: false, bgColor: "#0b0b12dd", color: "#a3e635" },
    sfx: "ding",
    steps: ["Fundo claro para produto", "Preço animado", "Sino de notificação", "Movimento circular pelo inspetor"],
  },
  meme_curto: {
    aspect: [1080, 1080],
    look: "none",
    bg: { type: "color", from: "#000000", to: "#000000" },
    addTitle: { text: "QUANDO VOCÊ DESCOBRE O EDITZZ", animation: "pop", font: "Impact", size: 70, uppercase: true },
    sfx: "boing",
    steps: ["Texto Impact com contorno", "Zoom brusco (zoom_pulse)", "SFX de boing"],
  },
  lyric_karaoke: {
    aspect: [1080, 1920],
    look: "viral_pop",
    bg: { type: "gradient", from: "#4c1d95", to: "#be185d" },
    captions: "karaoke_yellow",
    music: "pop",
    steps: ["Cole a letra em Legendas → Karaokê", "Estilo karaokê amarelo aplicado", "Batidas marcadas para sincronizar as linhas"],
  },
  aula_quadro: {
    aspect: [1920, 1080],
    look: "studio_beauty",
    bg: { type: "pattern", from: "#0b1220", to: "#101a2e", pattern: "grid" },
    addTitle: { text: "AULA COMPLETA", animation: "fade_in", font: "Inter", size: 68, uppercase: true, bgColor: "#4b3c27dd", color: "#ffffff" },
    steps: ["Fundo de grade técnica", "Título de abertura", "Adicione setas e formas no painel de formas", "Narre com o estúdio de áudio"],
  },
};

export default function Templates() {
  const { state, store: s } = useEditzz();
  const [tag, setTag] = useState<string>("Todos");
  const [applyBg, setApplyBg] = useState(true);
  const [applyText, setApplyText] = useState(true);
  const [applySfx, setApplySfx] = useState(false);
  const [applied, setApplied] = useState<string[]>([]);

  const tags = Array.from(new Set(TEMPLATES.flatMap((t) => t.tags)));
  const list = TEMPLATES.filter((t) => tag === "Todos" || t.tags.includes(tag));

  const apply = async (id: string) => {
    const recipe = RECIPES[id];
    if (!recipe) {
      store.toast("Modelo sem receita", "Este modelo ainda é apenas descritivo.", "warn");
      return;
    }
    const [w, h] = recipe.aspect;
    if (state.project.clips.length > 0) {
      s.setProjectFormat(w, h);
    } else {
      s.newProject(w, h, 30, recipe.aspect[0] > recipe.aspect[1] ? "Projeto 16:9" : "Projeto vertical");
    }

    // cor e look em todos os clipes visuais
    s.commit(`Modelo: ${TEMPLATES.find((t) => t.id === id)?.name}`, (p) => ({
      ...p,
      bg: applyBg
        ? {
            ...p.bg,
            type: recipe.bg.type,
            from: recipe.bg.from,
            to: recipe.bg.to,
            pattern: recipe.bg.pattern ?? p.bg.pattern,
            color: recipe.bg.type === "color" ? recipe.bg.from : p.bg.color,
          }
        : p.bg,
      clips: p.clips.map((c) => {
        if (c.kind === "audio") return c;
        const base = { ...c, look: recipe.look, lookIntensity: 85 };
        return recipe.effects?.length
          ? {
              ...base,
              effects: [
                ...c.effects,
                ...recipe.effects.map((e) => ({
                  id: e.id,
                  name: e.id,
                  enabled: true,
                  params: e.params ?? {},
                })),
              ],
            }
          : base;
      }),
    }));

    // transição de entrada em todos os clipes
    if (recipe.transition) {
      s.commit("Transições do modelo", (p) => ({
        ...p,
        clips: p.clips.map((c) => (c.kind === "audio" ? c : { ...c, transitionIn: { id: recipe.transition!, duration: 0.6 } })),
      }));
    }

    // título
    if (applyText && recipe.addTitle) {
      let textTrack = state.project.tracks.find((t) => t.kind === "text")?.id;
      if (!textTrack) {
        s.addTrack("text");
        textTrack = store.getSnapshot().project.tracks.find((t) => t.kind === "text")?.id;
      }
      if (!textTrack) textTrack = state.project.tracks[0].id;
      const title = recipe.addTitle;
      const clip: Clip = createTextClip(textTrack, transport.getTime(), 3.2, title.text);
      if (clip.text) {
        clip.text = {
          ...clip.text,
          font: title.font,
          size: title.size,
          animation: title.animation,
          uppercase: title.uppercase ?? false,
          weight: 800,
          color: title.color ?? "#ffffff",
          bgEnabled: !!title.bgColor,
          bgColor: title.bgColor ?? clip.text.bgColor,
          radius: 14,
          padding: 16,
        };
      }
      clip.id = uid("clip");
      s.commit("Título do modelo", (p) => ({ ...p, clips: [...p.clips, clip] }));
    }

    // estilo de legenda
    if (recipe.captions) {
      const style = CAPTION_STYLES.find((c) => c.id === recipe.captions);
      if (style) {
        s.commit("Estilo de legenda do modelo", (p) => ({
          ...p,
          clips: p.clips.map((c) =>
            c.kind === "text" && c.text
              ? {
                  ...c,
                  text: {
                    ...c.text,
                    bgEnabled: style.bg !== "transparent",
                    bgColor: style.bg,
                    color: style.color,
                    uppercase: style.uppercase,
                    weight: style.weight,
                    size: style.size,
                    radius: style.radius,
                    padding: style.padding,
                    strokeEnabled: style.stroke > 0,
                    strokeWidth: style.stroke,
                  },
                }
              : c
          ),
        }));
      }
    }

    // som
    if (applySfx && recipe.sfx) {
      try {
        const buffer = await generateSfx(recipe.sfx);
        const { asset } = assetFromAudioBuffer(`SFX ${recipe.sfx}`, buffer);
        s.addAssets([asset]);
        s.addAssetToTimeline(asset, undefined, 0);
      } catch {
        /* segue sem sfx */
      }
    }

    setApplied((list) => [...new Set([...list, id])]);
    store.toast("Modelo aplicado", recipe.steps.join(" · "), "ok");
    s.setView("video");
  };

  return (
    <div className="scroll-thin h-full min-h-0 overflow-y-auto p-3">
      <div className="mx-auto max-w-6xl space-y-3">
        <div className="panel flex flex-wrap items-center gap-2 p-3">
          <LayoutTemplate className="size-5 text-vio" />
          <div className="mr-auto">
            <h1 className="font-display text-lg font-semibold text-ink">Modelos de projeto</h1>
            <p className="text-[11.5px] text-muted">
              Cada modelo ajusta formato, cor, transições, títulos, legendas e som de uma vez — você continua no controle de tudo.
            </p>
          </div>
          <Badge color="#22d3ee">{TEMPLATES.length} modelos</Badge>
          <Chip>{applied.length} aplicados nesta sessão</Chip>
        </div>

        <div className="flex flex-wrap gap-1">
          <Chip active={tag === "Todos"} onClick={() => setTag("Todos")}>
            Todos
          </Chip>
          {tags.map((t) => (
            <Chip key={t} active={tag === t} onClick={() => setTag(t)}>
              {t}
            </Chip>
          ))}
        </div>

        <Section title="Ao aplicar, incluir" icon={<Wand2 className="size-3.5 text-vio" />}>
          <div className="flex flex-wrap gap-3">
            <Toggle label="Fundo e cor" checked={applyBg} onChange={setApplyBg} />
            <Toggle label="Título de abertura" checked={applyText} onChange={setApplyText} />
            <Toggle label="Efeito sonoro" checked={applySfx} onChange={setApplySfx} hint="Sintetiza um SFX no acervo" />
          </div>
        </Section>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => {
            const recipe = RECIPES[t.id];
            const done = applied.includes(t.id);
            return (
              <div key={t.id} className={cn("panel flex flex-col p-3 transition", done && "border-lime/40")}>
                <div
                  className="mb-2 h-24 rounded-xl border border-line"
                  style={{
                    background:
                      recipe?.bg.type === "gradient"
                        ? `linear-gradient(135deg, ${recipe.bg.from}, ${recipe.bg.to})`
                        : recipe?.bg.type === "pattern"
                          ? `repeating-linear-gradient(0deg, ${recipe.bg.from} 0 12px, ${recipe.bg.to} 12px 24px)`
                          : `linear-gradient(135deg, #16161f, #0b0b12)`,
                  }}
                />
                <div className="mb-1 flex items-center gap-1.5">
                  <p className="font-display text-[12.5px] font-semibold text-ink">{t.name}</p>
                  {done && <Check className="size-3.5 text-lime" />}
                </div>
                <p className="text-[11px] leading-relaxed text-muted">{t.desc}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {t.tags.map((x) => (
                    <span key={x} className="rounded-full border border-line px-1.5 py-0.5 text-[9px] text-dim">
                      {x}
                    </span>
                  ))}
                </div>
                {recipe && (
                  <ul className="mt-2 space-y-0.5 text-[10px] text-dim">
                    {recipe.steps.slice(0, 3).map((step) => (
                      <li key={step} className="flex gap-1">
                        <Sparkles className="mt-0.5 size-2.5 shrink-0 text-vio" />
                        {step}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                  <Btn size="sm" variant="primary" full icon={<Film className="size-3.5" />} onClick={() => void apply(t.id)}>
                    Aplicar modelo
                  </Btn>
                  {recipe?.music && (
                    <Btn
                      size="sm"
                      variant="soft"
                      title={`Compor trilha ${recipe.music}`}
                      onClick={async () => {
                        const { generateMusic } = await import("@/core/audio");
                        const { MUSIC_STYLES } = await import("@/lib/presets");
                        const def = MUSIC_STYLES.find((m) => m.id === recipe.music);
                        const buffer = await generateMusic({ style: recipe.music!, bpm: def?.bpm ?? 100, seconds: 24 });
                        const { asset } = assetFromAudioBuffer(`${def?.name ?? recipe.music} 24s`, buffer);
                        s.addAssets([asset]);
                        s.addAssetToTimeline(asset, undefined, 0);
                        store.toast("Trilha criada", def?.name ?? recipe.music!, "ok");
                      }}
                    >
                      <Music2 className="size-3.5" />
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
