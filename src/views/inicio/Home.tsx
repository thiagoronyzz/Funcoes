import {
  ArrowRight,
  Box,
  Captions,
  Film,
  Image as ImageIcon,
  Layers,
  Mic,
  Music2,
  Package,
  Play,
  Rocket,
  Scissors,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { exportFrame } from "@/core/exporter";
import { projectDuration } from "@/core/model";
import { store, useEditzz } from "@/core/store";
import { transport } from "@/core/transport";
import { researchStats } from "@/data/research";
import { Badge, Btn, Chip } from "@/components/ui";
import { fmtBytes, fmtTime } from "@/lib/utils";

const HIGHLIGHTS: { icon: typeof Film; title: string; desc: string; view: "video" | "foto" | "audio" | "midia" }[] = [
  {
    icon: Film,
    title: "Timeline profissional",
    desc: "Multifaixa, ímã de encaixe, curvas de velocidade, keyframes, máscaras, chroma key e ~30 transições.",
    view: "video",
  },
  {
    icon: Captions,
    title: "Legendas automáticas",
    desc: "Transcrição por voz, roteiro → legendas, karaokê palavra por palavra e exportação .srt/.vtt.",
    view: "video",
  },
  {
    icon: Wand2,
    title: "Retoque de foto",
    desc: "Curvas, HSL por faixa, grade de cor, pincéis de reparo, liquify, remoção de fundo e molduras.",
    view: "foto",
  },
  {
    icon: Music2,
    title: "Trilha e SFX",
    desc: "8 estilos musicais compostos no navegador, 16 efeitos sonoros, tratamento de voz e mixer com ducking.",
    view: "audio",
  },
  {
    icon: Box,
    title: "Gerador de mídia",
    desc: "12 geradores procedurais de vídeo e imagem — fundos animados, partículas, barras e contagem.",
    view: "midia",
  },
  {
    icon: Zap,
    title: "Ferramentas autorais",
    desc: "Grade Inteligente, estabilizador, rastreio de objeto, corte na batida, auto-reframe e muito mais.",
    view: "video",
  },
];

export default function Home() {
  const { state, store: s } = useEditzz();
  const [busy, setBusy] = useState<string | null>(null);
  const stats = useMemo(() => researchStats(), []);
  const duration = projectDuration(state.project);

  const makeKit = async () => {
    if (!state.project.clips.length) {
      store.toast("Projeto vazio", "Adicione um clipe para gerar o kit social.", "warn");
      return;
    }
    setBusy("kit");
    try {
      const sizes: [number, number, string][] = [
        [1080, 1080, "quadrado"],
        [1080, 1920, "vertical"],
        [1920, 1080, "paisagem"],
        [1080, 1350, "retrato"],
        [1200, 630, "link"],
        [1080, 608, "twitter"],
      ];
      for (const [w, h, label] of sizes) {
        void label;
        await exportFrame(state.project, state.assets, transport.getTime(), w, h);
      }
      store.toast("Kit de criador gerado", "6 arquivos PNG nas medidas sociais.", "ok");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="scroll-thin h-full min-h-0 overflow-y-auto p-3">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* hero */}
        <section className="panel relative overflow-hidden p-5">
          <span className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-vio/20 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-cy/10 blur-3xl" />
          <div className="relative">
            <div className="mb-2 flex items-center gap-2">
              <span className="grad-bg flex size-9 items-center justify-center rounded-xl font-display text-[13px] font-bold text-white">ez</span>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
                  editzz — edição de vídeo e foto <span className="text-gradient">direto no navegador</span>
                </h1>
                <p className="text-[12px] text-muted">
                  {stats.apps} referências de mercado estudadas · {stats.total} recursos mapeados · {stats.original + 22} recursos próprios
                </p>
              </div>
            </div>
            <p className="max-w-3xl text-[12.5px] leading-relaxed text-muted">
              Corte como um NLE, corrija cor como no Lightroom, gere trilha como num estúdio — tudo local, sem upload,
              sem conta e sem marca d&apos;água. O processamento roda em Canvas 2D, Web Audio e IndexedDB.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Btn variant="primary" icon={<Rocket className="size-4" />} onClick={() => s.setView("video")}>
                Abrir estúdio de vídeo
              </Btn>
              <Btn icon={<ImageIcon className="size-4" />} onClick={() => s.setView("foto")}>
                Editar uma foto
              </Btn>
              <Btn icon={<Box className="size-4" />} onClick={() => s.setView("midia")}>
                Gerar mídia de exemplo
              </Btn>
              <Btn variant="soft" icon={<Package className="size-4" />} onClick={() => void makeKit()} disabled={busy === "kit"}>
                {busy === "kit" ? "Gerando kit…" : "Kit de criador (6 medidas)"}
              </Btn>
            </div>
          </div>
        </section>

        {/* estado do projeto */}
        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Projeto", value: state.project.name, hint: `${state.project.width}×${state.project.height} · ${state.project.fps}fps` },
            { label: "Clipes", value: String(state.project.clips.length), hint: `${state.project.tracks.length} faixas` },
            { label: "Duração", value: fmtTime(duration, false), hint: `${state.project.markers.length} marcadores` },
            { label: "Acervo", value: String(state.assets.length), hint: fmtBytes(state.assets.reduce((a, b) => a + (b.sizeBytes ?? 0), 0)) || "—" },
          ].map((card) => (
            <div key={card.label} className="panel p-3">
              <p className="text-[10.5px] uppercase tracking-wider text-dim">{card.label}</p>
              <p className="truncate font-display text-lg font-semibold text-ink">{card.value}</p>
              <p className="text-[10.5px] text-muted">{card.hint}</p>
            </div>
          ))}
        </section>

        {/* destaques */}
        <section className="space-y-2">
          <h2 className="font-display text-[13.5px] font-semibold text-ink">O que dá para fazer</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map((h) => (
              <button
                key={h.title}
                type="button"
                onClick={() => s.setView(h.view)}
                className="panel group p-3 text-left transition hover:border-vio/50"
              >
                <span className="mb-1.5 flex size-8 items-center justify-center rounded-lg bg-vio/15 text-vio">
                  <h.icon className="size-4" />
                </span>
                <p className="font-display text-[12.5px] font-semibold text-ink">{h.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{h.desc}</p>
                <span className="mt-2 flex items-center gap-1 text-[10.5px] text-vio opacity-0 transition group-hover:opacity-100">
                  abrir <ArrowRight className="size-3" />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* fluxo rápido */}
        <section className="panel p-4">
          <h2 className="mb-2 font-display text-[13.5px] font-semibold text-ink">Fluxo de 5 passos</h2>
          <div className="grid gap-2 sm:grid-cols-5">
            {[
              { n: "1", t: "Traga mídia", d: "Importe arquivos, grave a tela ou gere clipes procedurais.", icon: Box },
              { n: "2", t: "Monte", d: "Arraste para a timeline, corte, aplique curvas e transições.", icon: Scissors },
              { n: "3", t: "Corrija", d: "Grade Inteligente, looks e máscaras por clipe.", icon: Sparkles },
              { n: "4", t: "Sonorize", d: "Trilha procedural, SFX e ducking automático.", icon: Mic },
              { n: "5", t: "Exporte", d: "Vídeo, quadro, storyboard e legendas — tudo local.", icon: Play },
            ].map((step) => (
              <div key={step.n} className="rounded-xl border border-line bg-panel2/40 p-2.5">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="grad-bg flex size-5 items-center justify-center rounded-md text-[10px] font-bold text-white">{step.n}</span>
                  <step.icon className="size-3.5 text-cy" />
                </div>
                <p className="text-[11.5px] font-medium text-ink">{step.t}</p>
                <p className="text-[10.5px] leading-relaxed text-muted">{step.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* projetos recentes */}
        <section className="panel p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-[13.5px] font-semibold text-ink">Projetos guardados no navegador</h2>
            <Btn size="sm" variant="ghost" onClick={() => void s.refreshProjects()}>
              atualizar
            </Btn>
          </div>
          {state.savedProjects.length === 0 ? (
            <p className="text-[11.5px] text-muted">
              Nada salvo ainda. O editzz guarda automaticamente a cada alteração (IndexedDB) e você pode exportar um
              arquivo <span className="font-mono text-ink">.editzz.json</span> para levar a outro computador.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {state.savedProjects.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    void s.openProject(p.id).then(() => s.setView("video"));
                  }}
                  className="rounded-xl border border-line bg-panel2/40 p-2.5 text-left transition hover:border-vio/50"
                >
                  <p className="truncate text-[11.5px] font-medium text-ink">{p.name}</p>
                  <p className="text-[10px] text-dim">{new Date(p.updatedAt).toLocaleString("pt-BR")}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* rodapé */}
        <section className="panel flex flex-wrap items-center gap-2 p-3">
          <Badge color="#a3e635">100% local</Badge>
          <Badge color="#22d3ee">sem conta</Badge>
          <Badge color="#f472b6">sem marca d&apos;água obrigatória</Badge>
          <p className="text-[10.5px] text-dim">
            Seus arquivos nunca saem do dispositivo: tudo é processado em memória e guardado no IndexedDB do navegador.
          </p>
          <div className="ml-auto flex flex-wrap gap-1">
            <Chip onClick={() => s.setView("recursos")}>
              <Layers className="mr-1 inline size-3" />
              ver matriz de recursos
            </Chip>
            <Chip onClick={() => s.setView("ajuda")}>atalhos e ajuda</Chip>
          </div>
        </section>
      </div>
    </div>
  );
}
