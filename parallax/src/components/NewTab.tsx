import { ArrowRight, Brain, Clock, Flame, Sparkles, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { SiteBadge } from "@/components/ui";
import { shortcutsOf } from "@/data/sites";
import { COGNITIVE_META } from "@/core/cognition";
import { graphStats } from "@/core/graph";
import { SITES, pageById, pagePlainText } from "@/data/sites";
import type { CognitionSnapshot, Page, ParallaxState } from "@/core/types";
import { Btn, Chip, ModeChip } from "@/components/ui";
import { useParallax } from "@/core/store";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
   Nova aba do Parallax: o "início" deixa de ser um feed e passa a ser um
   painel de retomada — intenção, onde você parou e o que merece atenção.
   ──────────────────────────────────────────────────────────────────────────── */

export function NewTab({
  onOpen,
  state,
  cognition,
}: {
  onOpen: (pageId: string, opts?: { newTab?: boolean }) => void;
  state: ParallaxState;
  cognition: CognitionSnapshot;
}) {
  const { dispatch } = useParallax();
  const shortcuts = useMemo(() => shortcutsOf(6), []);
  const resumed = useMemo(() => {
    return [...state.reads]
      .filter((r) => r.progress > 0.04 && r.progress < 0.98)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 3)
      .map((r) => ({ read: r, page: pageById(r.pageId) }))
      .filter((x): x is { read: (typeof state.reads)[number]; page: Page } => Boolean(x.page));
  }, [state.reads]);
  const stats = graphStats(state.graph);
  const cognitive = COGNITIVE_META[cognition.state];
  const words = state.reads.reduce((acc, r) => {
    const p = pageById(r.pageId);
    return acc + (p ? Math.round(pagePlainText(p).split(/\s+/).length * r.progress) : 0);
  }, 0);

  return (
    <div className="scroll-thin h-full overflow-y-auto bg-night2">
      <div className="mx-auto w-full max-w-4xl px-5 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.2em] text-faint">nova aba</p>
            <h1 className="m-0 mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
              {state.intent ? (
                <>
                  Você está <span className="text-gold">{state.intent.raw.toLowerCase()}</span>
                </>
              ) : (
                "Antes de abrir, o que você está tentando fazer?"
              )}
            </h1>
            <p className="m-0 mt-1 max-w-xl text-[12px] leading-relaxed text-dim">
              O Parallax usa a intenção para escolher como reescrever cada site. Sem intenção declarada, ele não muda nada.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2">
            <span className="grid size-8 place-items-center rounded-lg border" style={{ borderColor: `${cognitive.color}55`, background: `${cognitive.color}14`, color: cognitive.color }}>
              <Brain className="size-4" />
            </span>
            <div>
              <p className="m-0 text-[9px] uppercase tracking-wider text-faint">estado detectado</p>
              <p className="m-0 text-[12px] font-semibold" style={{ color: cognitive.color }}>
                {cognitive.label}
              </p>
            </div>
            <div className="ml-1 flex gap-1">
              <ModeChip mode={state.mode} />
            </div>
          </div>
        </div>

        {!state.intent && (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {[
              { raw: "Estou estudando machine learning para a faculdade", hint: "reescreve no seu nível e gera flashcards" },
              { raw: "Estou pesquisando energias renováveis para um relatório", hint: "layout uniforme, grafo e citações" },
              { raw: "Quero comprar um monitor 4K até R$ 3.000", hint: "preço real, reviews e dark patterns" },
              { raw: "Preciso terminar este código em 90 minutos", hint: "suprime estímulo e protege a tarefa" },
            ].map((p) => (
              <button
                key={p.raw}
                type="button"
                onClick={() => dispatch({ type: "setIntent", raw: p.raw })}
                className="group rounded-xl border border-line bg-panel/70 p-3 text-left transition hover:border-vio/50 hover:bg-panel2"
              >
                <span className="flex items-start gap-2">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border border-line bg-panel2 text-dim group-hover:text-vio">
                    <Sparkles className="size-3" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11.5px] font-medium text-ink">“{p.raw}”</span>
                    <span className="mt-0.5 block text-[10px] text-dim">{p.hint}</span>
                  </span>
                  <ArrowRight className="mt-1 size-3 shrink-0 text-faint group-hover:translate-x-0.5 group-hover:text-vio" />
                </span>
              </button>
            ))}
          </div>
        )}

        {resumed.length > 0 && (
          <section className="mt-7">
            <p className="m-0 mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-faint">
              <Clock className="size-3" /> retomar de onde parou
            </p>
            <div className="space-y-1.5">
              {resumed.map(({ read, page }) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => onOpen(page.id, { newTab: true })}
                  className="group flex w-full items-center gap-3 rounded-lg border border-line bg-panel/60 px-3 py-2 text-left transition hover:border-line2 hover:bg-panel2"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-md text-[10px] font-black text-white" style={{ background: SITES[page.siteId].accent }}>
                    {SITES[page.siteId].name.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11.5px] font-medium text-ink">{page.title}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-[9.5px] text-dim">
                      {SITES[page.siteId].host}
                      <span className="h-1 w-24 overflow-hidden rounded-full bg-white/8">
                        <span className="block h-full rounded-full bg-vio" style={{ width: `${Math.round(read.progress * 100)}%` }} />
                      </span>
                      {Math.round(read.progress * 100)}% lido
                    </span>
                  </span>
                  <ArrowRight className="size-3.5 text-faint group-hover:text-ink" />
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mt-7">
          <p className="m-0 mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-faint">
            <TrendingUp className="size-3" /> a web, indexada localmente
          </p>
          <div className="home-grid">
            {shortcuts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onOpen(p.id)}
                className="group flex min-w-0 flex-col rounded-xl border border-line bg-panel/60 p-3 text-left transition hover:border-line2 hover:bg-panel2"
              >
                <div className="mb-1.5 flex items-center gap-1.5">
                  <SiteBadge siteId={p.siteId} />
                  <span className="ml-auto text-[8.5px] text-faint">{SITES[p.siteId].host}</span>
                </div>
                <span className="line-clamp-2 text-[11.5px] font-medium leading-snug text-ink">{p.title}</span>
                <span className="mt-1 flex flex-wrap gap-1">
                  {p.concepts.slice(0, 2).map((c) => (
                    <span key={c} className="rounded bg-white/5 px-1.5 py-0.5 text-[8.5px] text-dim">
                      {c}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-7 grid gap-2 sm:grid-cols-4">
          {[
            { label: "palavras lidas hoje", value: words.toLocaleString("pt-BR"), icon: Flame, hint: "tempo de atenção, não cliques" },
            { label: "conceitos no grafo", value: stats.concepts, icon: Brain, hint: `${stats.crossSource} em 2+ fontes` },
            { label: "trocas por minuto", value: cognition.switchesLastMinute, icon: Clock, hint: cognition.reasons[0] ?? "sinal estável" },
            { label: "flashcards", value: state.cards.length, icon: Sparkles, hint: `${state.cards.filter((c) => c.dueAt <= Date.now()).length} vencidos` },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-line bg-panel/60 p-3">
              <k.icon className="size-3.5 text-dim" />
              <p className="m-0 mt-1.5 font-display text-xl font-bold text-ink">{k.value}</p>
              <p className="m-0 text-[9px] uppercase tracking-wider text-faint">{k.label}</p>
              <p className="m-0 mt-0.5 text-[9px] text-dim">{k.hint}</p>
            </div>
          ))}
        </section>

        <div className="mt-7 flex flex-wrap items-center gap-1.5 rounded-xl border border-dashed border-line bg-panel/40 px-3 py-2.5">
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium text-dim")}>
            <Sparkles className="size-3 text-gold" /> atalhos:
          </span>
          <Chip onClick={() => dispatch({ type: "mode", mode: "aprendizado" })}>aprender</Chip>
          <Chip onClick={() => dispatch({ type: "mode", mode: "pesquisa" })}>pesquisar</Chip>
          <Chip onClick={() => dispatch({ type: "mode", mode: "compra" })}>comprar</Chip>
          <Chip onClick={() => dispatch({ type: "mode", mode: "foco" })}>focar</Chip>
          <Chip onClick={() => dispatch({ type: "mode", mode: "calma" })}>calma</Chip>
          <span className="text-[9px] text-faint">·</span>
          <Btn size="xs" variant="ghost" onClick={() => dispatch({ type: "view", view: "cerebro" })}>
            abrir meu cérebro →
          </Btn>
        </div>
      </div>
    </div>
  );
}
