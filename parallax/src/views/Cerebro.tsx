import {
  Activity,
  Brain,
  Check,
  Download,
  Eye,
  Flame,
  Heart,
  Layers,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { Badge, Btn, Chip, IconBtn, Meter, SectionTitle, Toggle, Slider, Segmented } from "@/components/ui";
import { COGNITIVE_META, detectCognition } from "@/core/cognition";
import { graphStats } from "@/core/graph";
import { useParallax } from "@/core/store";
import { pageById } from "@/data/sites";
import { cn, download } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
   "Seu cérebro" — o grafo, a memória de leitura e os cartões.
   Tudo auditável, exportável e apagável: privacidade por construção.
   ──────────────────────────────────────────────────────────────────────────── */

export default function Cerebro() {
  const { state, dispatch, store } = useParallax();
  const [deckIndex, setDeckIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [graphFocus, setGraphFocus] = useState<string | null>(null);

  const cognition = useMemo(() => detectCognition(state), [state]);
  const stats = graphStats(state.graph);
  const meta = COGNITIVE_META[cognition.state];
  const due = state.cards.filter((c) => c.dueAt <= Date.now());
  const card = due[deckIndex % Math.max(1, due.length)];
  const recent = state.reads.slice(0, 8);

  const totalMinutes = Math.round(state.reads.reduce((a, r) => a + r.seconds, 0) / 60);
  const wordsRead = state.reads.reduce((acc, r) => {
    const p = pageById(r.pageId);
    return acc + (p ? Math.round(p.blocks.reduce((a, b) => a + (b.text?.split(/\s+/).length ?? 0), 0) * r.progress) : 0);
  }, 0);

  return (
    <div className="scroll-thin h-full overflow-y-auto p-3">
      <div className="mx-auto max-w-6xl space-y-3">
        {/* header */}
        <div className="panel p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl border border-vio/40 bg-vio/12 text-vio">
                <Brain className="size-5" />
              </span>
              <div>
                <h1 className="m-0 font-display text-lg font-semibold tracking-tight text-ink">Seu cérebro, do lado de fora</h1>
                <p className="m-0 text-[11px] text-dim">
                  {totalMinutes} min de leitura · {wordsRead.toLocaleString("pt-BR")} palavras · {state.cards.length} cartões · {state.reads.length} páginas
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Toggle
                checked={state.settings.showGraph}
                onChange={(v) => dispatch({ type: "settings", patch: { showGraph: v } })}
                label="exibir grafo"
              />
              <Badge color="#7ce0b1">nada sai do dispositivo</Badge>
            </div>
          </div>

          <div className="mt-3 kpi-grid">
            {[
              { label: "estado", value: meta.label, color: meta.color, hint: `${Math.round(cognition.confidence * 100)}% confiança` },
              { label: "foco", value: `${Math.round(cognition.focus * 100)}`, color: "#7c9cff", hint: "sinal composto" },
              { label: "carga", value: `${Math.round(cognition.load * 100)}`, color: "#f0c987", hint: "estimativa de esforço" },
              { label: "fadiga", value: `${Math.round(cognition.fatigue * 100)}`, color: "#f08f8f", hint: `${cognition.minutesInSession} min de sessão` },
              { label: "trocas/min", value: cognition.switchesLastMinute, color: "#c7a6ff", hint: "últimos 60s" },
              { label: "conceitos", value: stats.concepts, color: "#7ce0b1", hint: `${stats.crossSource} cross-fonte` },
            ].map((k) => (
              <div key={k.label} className="rounded-lg border border-line bg-panel2/40 p-2.5">
                <p className="m-0 text-[9px] uppercase tracking-wider text-faint">{k.label}</p>
                <p className="m-0 mt-0.5 font-display text-lg font-bold" style={{ color: k.color }}>
                  {k.value}
                </p>
                <p className="m-0 text-[9px] text-dim">{k.hint}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,1fr)]">
          {/* grafo */}
          <div className="panel p-3">
            <SectionTitle
              icon={<Layers className="size-3.5" />}
              title="grafo contextual"
              hint="conceitos, fontes e citações que você cruzou nas últimas 24h"
              right={
                <div className="flex gap-1">
                  <IconBtn size="sm" title="Recalcular layout" onClick={() => setGraphFocus(null)}>
                    <RefreshCw className="size-3" />
                  </IconBtn>
                  <Chip onClick={() => dispatch({ type: "view", view: "navegador" })}>abrir uma fonte</Chip>
                </div>
              }
            />
            {state.settings.showGraph ? (
              <GraphCanvas state={state} height={330} focusId={graphFocus} onFocus={setGraphFocus} />
            ) : (
              <p className="m-0 rounded-lg border border-dashed border-line p-6 text-center text-[11px] text-dim">Grafo oculto nas configurações.</p>
            )}
            <div className="mt-2 grid gap-1 sm:grid-cols-3">
              {[
                { label: "fontes com citação cruzada", value: `${stats.crossSource}/${stats.concepts}` },
                { label: "arestas no grafo", value: stats.edges },
                { label: "contradições detectadas", value: state.contradictions.length },
              ].map((s) => (
                <div key={s.label} className="rounded-md border border-line bg-panel2/40 px-2 py-1.5">
                  <p className="m-0 font-display text-[13px] font-bold text-ink">{s.value}</p>
                  <p className="m-0 text-[8.5px] uppercase tracking-wider text-faint">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* cognição + ajustes */}
          <div className="space-y-3">
            <div className="panel p-3">
              <SectionTitle icon={<Activity className="size-3.5" />} title="sinais do estado cognitivo" hint="3 minutos de amostras locais" />
              <div className="space-y-2">
                <Meter value={cognition.focus} color="#7c9cff" label="foco" hint={`${Math.round(cognition.focus * 100)}/100`} />
                <Meter value={cognition.load} color="#f0c987" label="carga" hint={`${Math.round(cognition.load * 100)}/100`} />
                <Meter value={cognition.fatigue} color="#f08f8f" label="fadiga" hint={`${Math.round(cognition.fatigue * 100)}/100`} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {cognition.reasons.map((r, i) => (
                  <span key={i} className="rounded-full border border-line bg-panel2/60 px-1.5 py-0.5 text-[9px] text-dim">
                    {r}
                  </span>
                ))}
              </div>
              <Sparkline samples={cognition.samples.map((s) => s.focus)} color="#7c9cff" />
              <p className="m-0 mt-1 text-[9px] leading-relaxed text-faint">
                Sinais usados: rolagem, trocas de aba, digitação e hora do dia. Nenhum eye-tracking, nenhuma webcam, nenhum envio.
              </p>
            </div>

            <div className="panel p-3">
              <SectionTitle icon={<Sparkles className="size-3.5" />} title="modelo de reescrita" hint="construído para rodar sem servidor" />
              <div className="mb-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-dim">nível</span>
                  <Segmented
                    value={state.level}
                    onChange={(v) => dispatch({ type: "level", level: v })}
                    options={[
                      { value: "iniciante", label: "iniciante" },
                      { value: "intermediario", label: "médio" },
                      { value: "avancado", label: "avançado" },
                    ]}
                  />
                </div>
                <Slider label="intensidade da reescrita" value={Math.round(state.settings.rewriteIntensity * 100)} min={0} max={100} onChange={(v) => dispatch({ type: "settings", patch: { rewriteIntensity: v / 100 } })} unit="%" />
                <Slider label="contraste no modo calma" value={Math.round(state.settings.calmContrast * 100)} min={0} max={100} onChange={(v) => dispatch({ type: "settings", patch: { calmContrast: v / 100 } })} unit="%" accent="#7fd1e8" />
              </div>
              <div className="flex flex-wrap gap-1">
                <Btn size="xs" variant="outline" icon={<Download className="size-3" />} onClick={() => download(new Blob([JSON.stringify(exportBrain(state), null, 2)], { type: "application/json" }), "parallax-cerebro.json")}>
                  exportar cérebro
                </Btn>
                <Btn
                  size="xs"
                  variant="outline"
                  icon={<Trash2 className="size-3" />}
                  onClick={() => {
                    if (confirm("Apagar grafo, leituras, cartões e citações deste dispositivo?")) {
                      store.reset();
                      dispatch({ type: "toast", title: "Memória apagada", detail: "Grafo, leituras e cartões removidos do dispositivo.", tone: "warn" });
                    }
                  }}
                >
                  apagar memória
                </Btn>
              </div>
            </div>
          </div>
        </div>

        {/* flashcards + leituras */}
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="panel p-3">
            <SectionTitle
              icon={<Layers className="size-3.5" />}
              title="revisão espaçada"
              hint={`${due.length} cartões vencidos de ${state.cards.length}`}
              right={
                <div className="flex gap-1">
                  <Chip
                    onClick={() => {
                      const pageId = state.tabs.find((t) => t.id === state.activeTabId)?.pageId;
                      if (pageId) dispatch({ type: "makeCards", pageId });
                    }}
                  >
                    gerar da aba atual
                  </Chip>
                </div>
              }
            />
            {due.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line bg-panel2/30 p-5 text-center">
                <p className="m-0 text-[11.5px] font-medium text-ink">Nenhum cartão vencido</p>
                <p className="m-0 mt-1 text-[10px] leading-relaxed text-dim">
                  Abra uma página no modo aprendizado e gere um baralho a partir dos termos do texto.
                </p>
                <Btn size="sm" variant="outline" className="mt-2" onClick={() => dispatch({ type: "view", view: "navegador" })}>
                  abrir uma página
                </Btn>
              </div>
            ) : card ? (
              <div>
                <button
                  type="button"
                  onClick={() => setRevealed((v) => !v)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition",
                    revealed ? "border-mint/40 bg-mint/8" : "border-line bg-panel2/60 hover:border-line2"
                  )}
                >
                  <p className="m-0 text-[9px] uppercase tracking-wider text-faint">
                    {revealed ? "resposta" : "frente"} · {card.pageTitle}
                  </p>
                  <p className="m-0 mt-1.5 text-[15px] font-semibold leading-snug text-ink">{revealed ? card.back : card.front}</p>
                  {!revealed && <p className="m-0 mt-2 text-[9.5px] text-dim">clique para revelar (forçar recordação ativa)</p>}
                </button>
                <div className="mt-2 flex items-center gap-1.5">
                  <Btn
                    size="sm"
                    variant="danger"
                    icon={<RotateCcw className="size-3" />}
                    onClick={() => {
                      dispatch({ type: "reviewCard", cardId: card.id, good: false });
                      setRevealed(false);
                      setDeckIndex((i) => i + 1);
                    }}
                  >
                    de novo em 10 min
                  </Btn>
                  <Btn
                    size="sm"
                    variant="success"
                    icon={<Check className="size-3" />}
                    onClick={() => {
                      dispatch({ type: "reviewCard", cardId: card.id, good: true });
                      setRevealed(false);
                      setDeckIndex((i) => i + 1);
                    }}
                  >
                    lembrei
                  </Btn>
                  <span className="ml-auto text-[9px] text-faint">
                    revisões: {card.reviews} · facilidade {card.ease > 0 ? `+${card.ease}` : card.ease}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="panel p-3">
            <SectionTitle icon={<Eye className="size-3.5" />} title="memória de leitura" hint="o que você realmente leu, não o que clicou" />
            {recent.length === 0 ? (
              <p className="m-0 text-[10.5px] text-dim">Nenhuma leitura registrada. Abra uma página e role o texto.</p>
            ) : (
              <div className="space-y-1">
                {recent.map((r) => (
                  <button
                    key={r.pageId + r.createdAt}
                    type="button"
                    onClick={() => dispatch({ type: "navigate", siteId: r.siteId, pageId: r.pageId, newTab: true })}
                    className="group flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-white/4"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[10.5px] text-ink2">{r.title}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-[8.5px] text-faint">
                        <span className="w-16 overflow-hidden rounded-full bg-white/8">
                          <span className="block h-1 rounded-full bg-mint" style={{ width: `${Math.round(r.progress * 100)}%` }} />
                        </span>
                        {Math.round(r.progress * 100)}% · {Math.round(r.seconds)}s
                      </span>
                    </span>
                    <Heart className={cn("size-3", r.seconds > 90 ? "text-rose" : "text-faint")} fill={r.seconds > 90 ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            )}
            {state.quizzes.length > 0 && (
              <div className="mt-2 border-t border-line pt-2">
                <p className="m-0 mb-1 text-[9px] font-bold uppercase tracking-wider text-faint">últimos quizzes</p>
                <div className="space-y-0.5">
                  {state.quizzes.slice(0, 3).map((q) => (
                    <div key={q.createdAt} className="flex items-center justify-between gap-2 text-[9.5px]">
                      <span className="truncate text-dim">{pageById(q.pageId)?.title ?? "—"}</span>
                      <span className="mono text-mint">{q.score}/5</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* intenções + contradições */}
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="panel p-3">
            <SectionTitle icon={<Target className="size-3.5" />} title="histórico de intenções" hint="o que você estava tentando fazer — o dado que ninguém mais tem" />
            {state.intentHistory.length === 0 ? (
              <p className="m-0 text-[10.5px] text-dim">Nenhuma intenção registrada.</p>
            ) : (
              <div className="space-y-1">
                {state.intentHistory.slice(0, 6).map((i) => (
                  <div key={i.id} className="rounded-md border border-line bg-panel2/40 px-2 py-1.5">
                    <p className="m-0 text-[10.5px] leading-snug text-ink2">“{i.raw}”</p>
                    <p className="m-0 mt-0.5 flex items-center gap-1.5 text-[8.5px] text-faint">
                      <Badge color="#7c9cff">{i.kind}</Badge>
                      <span>{new Date(i.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span>·</span>
                      <span>{i.source}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel p-3">
            <SectionTitle icon={<Flame className="size-3.5" />} title="contradições" hint="divergências entre fontes sobre o mesmo tópico" />
            {state.contradictions.length === 0 ? (
              <p className="m-0 text-[10.5px] leading-relaxed text-dim">
                Nenhuma ainda. Abra páginas de fontes diferentes sobre o mesmo tema — o detector compara afirmações numéricas e avisa quando divergem.
              </p>
            ) : (
              <div className="space-y-1.5">
                {state.contradictions.slice(0, 4).map((c) => (
                  <div key={c.id} className="rounded-md border border-rose/30 bg-rose/8 p-2">
                    <p className="m-0 text-[9px] font-bold uppercase tracking-wider text-rose">{c.topic}</p>
                    <p className="m-0 mt-1 text-[10px] leading-snug text-ink2">A · {c.claimA.text}</p>
                    <p className="m-0 mt-0.5 text-[10px] leading-snug text-ink2">B · {c.claimB.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel flex flex-wrap items-center gap-2 p-3">
          <Zap className="size-4 text-gold" />
          <p className="m-0 text-[10.5px] text-dim">
            O grafo, as leituras e os cartões vivem no seu navegador (localStorage). Exporte um JSON quando quiser levar para outro dispositivo — não existe servidor para onde levar.
          </p>
          <Btn size="xs" variant="ghost" className="ml-auto" icon={<TrendingUp className="size-3" />} onClick={() => dispatch({ type: "view", view: "lab" })}>
            ver o motor
          </Btn>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ samples, color }: { samples: number[]; color: string }) {
  const pts = samples.length > 1 ? samples : [0.5, 0.55, 0.5, 0.6];
  const w = 280;
  const h = 32;
  const path = pts
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (pts.length - 1)) * w} ${h - v * (h - 4) - 2}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-8 w-full" aria-hidden>
      <path d={path} fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill={color} opacity={0.1} />
    </svg>
  );
}

function exportBrain(state: ReturnType<typeof useParallax>["state"]) {
  return {
    exportedAt: new Date().toISOString(),
    generator: "Parallax v0.1 — protótipo local",
    stats: {
      pagesRead: state.reads.length,
      concepts: state.graph.nodes.filter((n) => n.kind === "conceito").length,
      sources: state.graph.nodes.filter((n) => n.kind === "fonte").length,
      flashcards: state.cards.length,
      citations: state.citations.length,
    },
    intentHistory: state.intentHistory,
    reads: state.reads,
    graph: state.graph,
    flashcards: state.cards,
    citations: state.citations,
    contradictions: state.contradictions,
    settings: state.settings,
  };
}

