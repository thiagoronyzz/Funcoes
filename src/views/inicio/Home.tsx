import {
  ArrowRight,
  Box,
  Captions,
  Film,
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
    title: "Edição de vídeo",
    desc: "Timeline multifaixa, transições, keyframes, máscaras e ferramentas de montagem.",
    view: "video",
  },
  {
    icon: Captions,
    title: "Legendas e texto",
    desc: "Crie títulos e legendas sincronizadas; exporte em SRT ou VTT.",
    view: "video",
  },
  {
    icon: Wand2,
    title: "Retoque de foto",
    desc: "Curvas, cor, pincéis de reparo, camadas e remoção de fundo.",
    view: "foto",
  },
  {
    icon: Music2,
    title: "Trilha e efeitos",
    desc: "Componha música, gere efeitos sonoros e trate gravações de voz.",
    view: "audio",
  },
  {
    icon: Box,
    title: "Biblioteca de mídia",
    desc: "Organize seus arquivos ou crie imagens e clipes procedurais.",
    view: "midia",
  },
  {
    icon: Zap,
    title: "Ferramentas de edição",
    desc: "Estabilização, detecção de cenas, corte na batida e auto-reframe.",
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
      for (const [w, h] of sizes) {
        await exportFrame(state.project, state.assets, transport.getTime(), w, h);
      }
      store.toast("Kit de criador gerado", "6 arquivos PNG nas medidas sociais.", "ok");
    } catch {
      store.toast("Não foi possível gerar o kit", "Confira se o quadro atual pode ser renderizado.", "erro");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="home-page scroll-thin">
      <div className="home-content space-y-4">
        <header className="home-heading">
          <div>
            <p className="home-eyebrow">EDITZZ · ESPAÇO DE TRABALHO</p>
            <h1>Visão geral</h1>
            <p>Crie, edite e exporte seus projetos em um só lugar.</p>
          </div>
          <div className="home-heading-actions">
            <Btn variant="primary" icon={<Rocket className="size-4" />} onClick={() => s.setView("video")}>
              Continuar editando
            </Btn>
            <Btn
              variant="outline"
              icon={<Package className="size-4" />}
              onClick={() => void makeKit()}
              disabled={busy === "kit"}
              title="Exporta seis quadros do projeto atual em proporções para redes sociais"
            >
              {busy === "kit" ? "Gerando kit…" : "Kit para redes"}
            </Btn>
          </div>
        </header>

        <section className="panel p-3" aria-label="Resumo do projeto atual">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-md border border-line2 bg-panel2 text-muted">
                <Film className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="m-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-dim">Projeto atual</p>
                <p className="m-0 truncate text-[12px] font-semibold text-ink">{state.project.name}</p>
              </div>
            </div>
            <Btn size="sm" variant="ghost" icon={<Scissors className="size-3.5" />} onClick={() => s.setView("video")}>
              Abrir editor
            </Btn>
          </div>
          <div className="home-stat-grid">
            {[
              { label: "Formato", value: `${state.project.width} × ${state.project.height}`, hint: `${state.project.fps} quadros por segundo` },
              { label: "Clipes", value: String(state.project.clips.length), hint: `${state.project.tracks.length} faixas na timeline` },
              { label: "Duração", value: fmtTime(duration, false), hint: `${state.project.markers.length} marcadores` },
              { label: "Biblioteca", value: `${state.assets.length} itens`, hint: fmtBytes(state.assets.reduce((a, b) => a + (b.sizeBytes ?? 0), 0)) || "sem arquivos" },
            ].map((card) => (
              <div key={card.label} className="home-stat-card">
                <p className="home-stat-label">{card.label}</p>
                <p className="home-stat-value">{card.value}</p>
                <p className="home-stat-hint">{card.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="home-projects-grid">
          <section className="panel min-w-0 p-3">
            <div className="home-section-title">
              <span>Projetos recentes</span>
              <Btn size="xs" variant="ghost" onClick={() => void s.refreshProjects()}>
                Atualizar
              </Btn>
            </div>
            {state.savedProjects.length === 0 ? (
              <div className="rounded-md border border-dashed border-line2 bg-bg2/40 px-3 py-5">
                <p className="m-0 text-[11.5px] font-medium text-ink">Nenhum projeto salvo ainda</p>
                <p className="mb-0 mt-1 text-[10.5px] leading-relaxed text-muted">
                  Seus projetos são guardados neste navegador. Use Salvar ou Ctrl+S para criar o primeiro ponto de restauração.
                </p>
              </div>
            ) : (
              <div className="grid gap-1.5 sm:grid-cols-2">
                {state.savedProjects.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      void s.openProject(p.id).then(() => s.setView("video"));
                    }}
                    className="group flex min-w-0 items-center gap-2 rounded-md border border-line bg-panel2/50 p-2 text-left transition hover:border-line2 hover:bg-panel3"
                    title={`Abrir ${p.name}`}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded border border-line bg-bg2 text-dim transition group-hover:text-ink">
                      <Film className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-medium text-ink">{p.name}</span>
                      <span className="block text-[9px] text-dim">{new Date(p.updatedAt).toLocaleString("pt-BR")}</span>
                    </span>
                    <ArrowRight className="size-3 shrink-0 text-dim transition group-hover:translate-x-0.5 group-hover:text-ink" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="panel p-3">
            <div className="home-section-title"><span>Seu espaço de trabalho</span></div>
            <p className="mt-0 text-[11px] leading-relaxed text-muted">
              O editzz reúne <span className="font-semibold text-ink">{stats.apps} referências</span> e {stats.total} recursos mapeados para ajudar em cada etapa da edição.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge color="#9abd8e">Arquivos locais</Badge>
              <Badge color="#78aaa5">Sem conta</Badge>
              <Badge color="#d7a45a">Sem marca d&apos;água obrigatória</Badge>
            </div>
            <p className="mb-0 mt-3 border-t border-line pt-2.5 text-[10px] leading-relaxed text-dim">
              Mídia, edição e projetos ficam no seu dispositivo. Nada é enviado para um servidor.
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Chip onClick={() => s.setView("recursos")}>
                <Layers className="mr-1 inline size-3" /> Recursos mapeados
              </Chip>
              <Chip onClick={() => s.setView("ajuda")}>Atalhos e ajuda</Chip>
            </div>
          </section>
        </div>

        <section>
          <div className="home-section-title">
            <span>Acesso rápido</span>
            <span className="text-[10px] font-normal text-dim">Abra uma ferramenta para começar</span>
          </div>
          <div className="home-feature-grid">
            {HIGHLIGHTS.map((h) => (
              <button
                key={h.title}
                type="button"
                onClick={() => s.setView(h.view)}
                className="home-feature-card group"
              >
                <span className="home-feature-icon"><h.icon className="size-4" /></span>
                <span className="text-[12px] font-semibold text-ink">{h.title}</span>
                <span className="mt-1 text-[10.5px] leading-relaxed text-muted">{h.desc}</span>
                <span className="home-feature-link">Abrir ferramenta <ArrowRight className="size-3" /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel p-3">
          <div className="home-section-title">
            <span>Fluxo de trabalho</span>
            <span className="text-[10px] font-normal text-dim">Da importação à entrega</span>
          </div>
          <div className="home-steps">
            {[
              { n: "1", t: "Importe", d: "Traga arquivos, grave a tela ou gere mídia.", icon: Box },
              { n: "2", t: "Monte", d: "Organize faixas, cortes, textos e transições.", icon: Scissors },
              { n: "3", t: "Ajuste", d: "Trabalhe cor, som, máscaras e efeitos.", icon: Sparkles },
              { n: "4", t: "Revise", d: "Confira a prévia e refine os detalhes.", icon: Play },
              { n: "5", t: "Exporte", d: "Gere vídeo, imagem, áudio ou legendas.", icon: Mic },
            ].map((step) => (
              <div key={step.n} className="home-step-card">
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="home-step-number">{step.n}</span>
                  <step.icon className="size-3.5 text-muted" />
                </div>
                <p className="m-0 text-[11px] font-medium text-ink">{step.t}</p>
                <p className="mb-0 mt-0.5 text-[10px] leading-relaxed text-muted">{step.d}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
