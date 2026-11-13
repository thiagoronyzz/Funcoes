import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  Copy,
  Download,
  GitCompare,
  Layers,
  ListChecks,
  Quote,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  Wand2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { PriceHistoryCard } from "@/components/Compare";
import { Badge, Btn, Chip, IconBtn, Input, Meter, ModeChip, Segmented, Select, SectionTitle, Tooltip } from "@/components/ui";
import { exportBibliography, formatCitation, sortCitations } from "@/core/citations";
import { detectDarkPatterns } from "@/core/darkpatterns";
import { graphStats } from "@/core/graph";
import { produceQuiz } from "@/core/quiz";
import { complexityOf, extractKeySentences } from "@/core/rewrite";
import { useParallax } from "@/core/store";
import { ALL_PAGES, PRODUCTS, SITES, pageById, pagePlainText, pageStats } from "@/data/sites";
import type { Level, Page, ParallaxState } from "@/core/types";
import { cn, download } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
   Painel lateral — o lugar onde o modo vira ferramenta.
   ──────────────────────────────────────────────────────────────────────────── */

export function SidePanel({ state, pageId }: { state: ParallaxState; pageId: string | null }) {
  const { dispatch } = useParallax();
  const page = pageId ? pageById(pageId) : null;
  const tabs = [
    { id: "assistente" as const, label: "Assistente", icon: Wand2 },
    { id: "grafo" as const, label: "Grafo", icon: Layers },
    { id: "citacoes" as const, label: "Citações", icon: Quote },
    { id: "pagina" as const, label: "Página", icon: ListChecks },
  ];

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-line bg-[#0b0e14]">
      <div className="flex shrink-0 items-center gap-1 border-b border-line px-2 py-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => dispatch({ type: "sidePanel", panel: t.id })}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition",
              state.sidePanel === t.id ? "bg-panel3 text-ink" : "text-dim hover:text-ink"
            )}
          >
            <t.icon className="size-3" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="shrink-0 px-2.5 pt-2.5">
        <ModeSelector state={state} />
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-2.5">
        {state.mode === "compra" && state.sidePanel === "assistente" && <CommercePanel state={state} pageId={pageId} />}
        {state.sidePanel === "assistente" && state.mode !== "compra" && <AssistantPanel state={state} pageId={pageId} />}
        {state.sidePanel === "grafo" && <GraphPanel state={state} />}
        {state.sidePanel === "citacoes" && <CitationsPanel state={state} />}
        {state.sidePanel === "pagina" && <PageInsights state={state} pageId={pageId} />}
      </div>

      {page && (
        <div className="shrink-0 border-t border-line px-3 py-1.5 text-[9.5px] text-faint">
          <span className="truncate">
            analisando <span className="text-dim">{page.title}</span>
          </span>
        </div>
      )}
    </aside>
  );
}

/* ── assistente ─────────────────────────────────────────────────────────────── */

const PRESETS = [
  "Estou estudando machine learning para a faculdade",
  "Estou pesquisando energias renováveis para um relatório",
  "Quero comprar um monitor 4K até R$ 3.000",
  "Preciso terminar este código em 90 minutos",
  "Estou exausto, só quero terminar o dia sem ansiedade",
];

function AssistantPanel({ state, pageId }: { state: ParallaxState; pageId: string | null }) {
  const { dispatch } = useParallax();
  const [draft, setDraft] = useState(state.intent?.raw ?? "");
  const [quizOpen, setQuizOpen] = useState(false);
  const page = pageId ? pageById(pageId) : null;

  const submit = () => {
    const raw = draft.trim();
    if (raw.length < 3) return;
    dispatch({ type: "setIntent", raw });
  };

  return (
    <div className="space-y-2.5">
      <div className="panel p-2.5">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Brain className="size-3.5 text-vio" />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink2">intenção da sessão</span>
          {state.intent && (
            <button type="button" onClick={() => dispatch({ type: "clearIntent" })} className="ml-auto text-faint hover:text-rose" title="Remover intenção">
              <X className="size-3" />
            </button>
          )}
        </div>

        {state.intent ? (
          <div className="space-y-1.5">
            <p className="m-0 text-[12px] font-medium leading-snug text-ink">“{state.intent.raw}”</p>
            <div className="flex flex-wrap items-center gap-1">
              <Badge color="#7c9cff">{state.intent.kind}</Badge>
              <Badge color="#f0c987">{state.intent.source === "auto" ? "inferida" : "declarada"}</Badge>
              <Badge color="#7ce0b1">{state.intent.level}</Badge>
              {state.intent.budget && <Badge color="#c7a6ff">R$ {state.intent.budget.toLocaleString("pt-BR")}</Badge>}
            </div>
            <p className="m-0 text-[10px] leading-relaxed text-dim">
              tópico: <span className="text-ink2">{state.intent.topic}</span>
            </p>
            <div>
              <div className="mb-1 flex items-center justify-between text-[9px] text-faint">
                <span>confiança do parser local</span>
                <span className="mono">{Math.round(state.intent.confidence * 100)}%</span>
              </div>
              <Meter value={state.intent.confidence} color="#7c9cff" />
            </div>
            <details className="text-[9.5px] text-dim">
              <summary className="cursor-pointer select-none text-faint hover:text-dim">por que o parser concluiu isso</summary>
              <ul className="mb-0 mt-1 space-y-0.5 pl-3">
                {state.intent.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
                <li>nenhum texto desta intenção saiu do dispositivo</li>
              </ul>
            </details>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="m-0 text-[10.5px] leading-relaxed text-dim">
              Declare o que você está tentando fazer. O motor usa isso para escolher o modo e reescrever as páginas.
            </p>
            <div className="flex gap-1">
              <Input value={draft} onChange={setDraft} placeholder="ex.: estudar transformadores" onKeyDown={(e) => e.key === "Enter" && submit()} />
              <Btn size="md" variant="primary" onClick={submit} icon={<ArrowRight className="size-3.5" />} title="Declarar intenção (Enter)" />
            </div>
            <div className="flex flex-wrap gap-1">
              {PRESETS.slice(0, 3).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setDraft(p);
                    dispatch({ type: "setIntent", raw: p });
                  }}
                  className="max-w-full truncate rounded-full border border-line bg-panel2/60 px-2 py-0.5 text-left text-[9.5px] text-dim hover:border-line2 hover:text-ink"
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                dispatch({ type: "setIntent", raw: state.history[1]?.title ?? "explorar assuntos recentes", auto: true });
              }}
              className="text-[9.5px] text-vio hover:underline"
            >
              ou deixe o Parallax inferir pelo seu histórico →
            </button>
          </div>
        )}
      </div>

      {page && (
        <div className="panel p-2.5">
          <SectionTitle icon={<BookOpen className="size-3.5" />} title="nesta página" hint={`${pageStats(page).words} palavras · complexidade ${pageStats(page).complexity}`} />
          <div className="space-y-1">
            {state.mode === "aprendizado" && (
              <>
                <ActionBtn icon={<Layers className="size-3.5" />} label="Gerar flashcards dos termos" onClick={() => dispatch({ type: "makeCards", pageId: page.id })} />
                <ActionBtn icon={<ListChecks className="size-3.5" />} label="Fazer quiz de 5 perguntas" onClick={() => setQuizOpen(true)} />
              </>
            )}
            {(state.mode === "pesquisa" || state.mode === "calma") && (
              <ActionBtn icon={<Quote className="size-3.5" />} label="Exportar referências (ABNT/APA)" onClick={() => dispatch({ type: "citePage", pageId: page.id })} />
            )}
            {state.mode === "compra" && (
              <ActionBtn icon={<GitCompare className="size-3.5" />} label="Adicionar à comparação" onClick={() => dispatch({ type: "cartAdd", productId: "ms-ultrawide" })} />
            )}
            <ActionBtn
              icon={<Search className="size-3.5" />}
              label="Ver o que o motor mudou"
              onClick={() => dispatch({ type: "sidePanel", panel: "pagina" })}
            />
            <ActionBtn
              icon={<Target className="size-3.5" />}
              label={state.focusTask ? "Ir para o painel de foco" : "Transformar isso em tarefa de foco"}
              onClick={() => {
                if (state.focusTask) dispatch({ type: "view", view: "foco" });
                else dispatch({ type: "startFocus", label: page.title.slice(0, 52), minutes: 45 });
              }}
            />
          </div>
        </div>
      )}

      {state.cards.length > 0 && (
        <div className="panel p-2.5">
          <SectionTitle
            icon={<Layers className="size-3.5" />}
            title="baralho"
            hint={`${state.cards.filter((c) => c.dueAt <= Date.now()).length} para revisar hoje`}
            right={<Chip onClick={() => dispatch({ type: "view", view: "cerebro" })}>abrir</Chip>}
          />
          <div className="space-y-1">
            {state.cards.slice(0, 2).map((c) => (
              <div key={c.id} className="rounded-md border border-line bg-panel2/50 px-2 py-1.5">
                <p className="m-0 text-[10.5px] font-medium text-ink">{c.front}</p>
                <p className="m-0 mt-0.5 line-clamp-2 text-[9.5px] leading-snug text-dim">{c.back}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.intentHistory.length > 1 && (
        <div className="panel p-2.5">
          <SectionTitle icon={<Wand2 className="size-3.5" />} title="intenções anteriores" />
          <div className="space-y-0.5">
            {state.intentHistory.slice(1, 4).map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => dispatch({ type: "setIntent", raw: i.raw })}
                className="block w-full truncate rounded px-1 py-0.5 text-left text-[9.5px] text-dim hover:bg-white/5 hover:text-ink"
              >
                “{i.raw}”
              </button>
            ))}
          </div>
        </div>
      )}

      {quizOpen && page && <QuizModal pageId={page.id} onClose={() => setQuizOpen(false)} />}
    </div>
  );
}

/**
 * Seletor de modo. Vive no nível do painel (e não dentro do assistente) porque
 * o modo compra troca o conteúdo do painel — o seletor precisa continuar ali.
 */
function ModeSelector({ state }: { state: ParallaxState }) {
  const { dispatch } = useParallax();
  return (
    <div className="panel p-2.5">

        <div className="mb-1.5 flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-gold" />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink2">modo ativo</span>
          <span className="ml-auto"><ModeChip mode={state.mode} /></span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {(["aprendizado", "pesquisa", "compra", "foco", "calma"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => dispatch({ type: "mode", mode: m })}
              className={cn(
                "rounded-md border px-1 py-1.5 text-[9.5px] font-medium capitalize transition",
                state.mode === m ? "border-vio/60 bg-vio/15 text-ink" : "border-line bg-panel2/50 text-dim hover:text-ink"
              )}
            >
              {m === "aprendizado" ? "aprender" : m === "pesquisa" ? "pesquisar" : m === "compra" ? "comprar" : m === "foco" ? "focar" : "calma"}
            </button>
          ))}
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-dim">nível de reescrita</span>
            <Segmented
              value={state.level}
              onChange={(v) => dispatch({ type: "level", level: v as Level })}
              options={[
                { value: "iniciante", label: "iniciante" },
                { value: "intermediario", label: "médio" },
                { value: "avancado", label: "avançado" },
              ]}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-dim">intensidade</span>
            <div className="flex flex-1 items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(state.settings.rewriteIntensity * 100)}
                onChange={(e) => dispatch({ type: "settings", patch: { rewriteIntensity: Number(e.target.value) / 100 } })}
                className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-vio"
              />
              <span className="mono w-7 text-right text-[9.5px] text-dim">{Math.round(state.settings.rewriteIntensity * 100)}</span>
            </div>
          </div>
        </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md border border-line bg-panel2/40 px-2 py-1.5 text-left text-[10.5px] text-ink2 transition hover:border-line2 hover:bg-panel3 hover:text-ink"
    >
      <span className="text-dim">{icon}</span>
      <span className="min-w-0 flex-1">{label}</span>
      <ArrowRight className="size-3 text-faint" />
    </button>
  );
}

/* ── quiz ───────────────────────────────────────────────────────────────────── */

function QuizModal({ pageId, onClose }: { pageId: string; onClose: () => void }) {
  const { dispatch } = useParallax();
  const quiz = useMemo(() => produceQuiz(pageId), [pageId]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);
  const score = quiz.questions.filter((q, i) => answers[i] === q.answer).length;

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[86dvh] w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-2.5">
          <div>
            <p className="m-0 text-[12.5px] font-semibold text-ink">Quiz gerado do texto</p>
            <p className="m-0 text-[10px] text-dim">{quiz.pageTitle} · 5 perguntas · gerado localmente</p>
          </div>
          <IconBtn size="sm" onClick={onClose} title="Fechar">
            <X className="size-3.5" />
          </IconBtn>
        </div>
        <div className="scroll-thin max-h-[62dvh] space-y-3 overflow-y-auto p-4">
          {quiz.questions.map((q, qi) => (
            <div key={q.id} className="rounded-lg border border-line bg-panel2/50 p-2.5">
              <p className="m-0 mb-1.5 text-[11.5px] font-medium leading-snug text-ink">
                {qi + 1}. {q.prompt}
              </p>
              <div className="space-y-1">
                {q.options.map((opt, oi) => {
                  const chosen = answers[qi] === oi;
                  const correct = done && oi === q.answer;
                  const wrong = done && chosen && oi !== q.answer;
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={done}
                      onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                      className={cn(
                        "flex w-full items-start gap-1.5 rounded-md border px-2 py-1 text-left text-[10.5px] leading-snug transition",
                        correct
                          ? "border-mint/60 bg-mint/12 text-mint"
                          : wrong
                            ? "border-rose/60 bg-rose/12 text-rose"
                            : chosen
                              ? "border-vio/60 bg-vio/12 text-ink"
                              : "border-line bg-night2/60 text-dim hover:border-line2 hover:text-ink"
                      )}
                    >
                      <span className="mt-0.5 grid size-3.5 shrink-0 place-items-center rounded-full border border-current text-[8px]">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {done && <p className="m-0 mt-1.5 text-[9.5px] leading-relaxed text-gold">por quê: {q.explanation}</p>}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
          <span className="text-[10.5px] text-dim">
            {done ? `resultado: ${score}/5 · salvo no seu cérebro` : `${Object.keys(answers).length}/5 respondidas`}
          </span>
          {done ? (
            <Btn size="sm" variant="outline" onClick={onClose}>
              fechar
            </Btn>
          ) : (
            <Btn
              size="sm"
              variant="primary"
              disabled={Object.keys(answers).length < quiz.questions.length}
              onClick={() => {
                setDone(true);
                dispatch({ type: "saveQuiz", pageId, score });
              }}
            >
              corrigir
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── grafo ──────────────────────────────────────────────────────────────────── */

function GraphPanel({ state }: { state: ParallaxState }) {
  const { dispatch } = useParallax();
  const stats = graphStats(state.graph);
  const [focus, setFocus] = useState<string | null>(null);
  const cross = state.graph.nodes.filter((n) => n.kind === "conceito" && n.weight >= 2).sort((a, b) => b.weight - a.weight);

  return (
    <div className="space-y-2.5">
      <div className="panel p-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink2">grafo contextual</span>
          <Badge color="#7ce0b1">local</Badge>
        </div>
        <GraphCanvas state={state} height={250} focusId={focus} onFocus={setFocus} />
        <div className="mt-1.5 grid grid-cols-3 gap-1">
          {[
            { label: "conceitos", value: stats.concepts },
            { label: "fontes", value: stats.sources },
            { label: "arestas", value: stats.edges },
          ].map((s) => (
            <div key={s.label} className="rounded-md border border-line bg-panel2/40 px-1.5 py-1">
              <p className="m-0 font-display text-[15px] font-bold text-ink">{s.value}</p>
              <p className="m-0 text-[8.5px] uppercase tracking-wider text-faint">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-2.5">
        <SectionTitle icon={<Layers className="size-3.5" />} title="conceitos em 2+ fontes" hint={`${stats.crossSource} conectados por você`} />
        {cross.length === 0 ? (
          <p className="m-0 text-[10px] leading-relaxed text-dim">Abra páginas de sites diferentes para o grafo ligar as ideias entre elas.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {cross.map((n) => (
              <Tooltip key={n.id} label={<span>{n.pageTitle ?? "—"}<br /><span className="text-faint">{n.weight} conexões</span></span>}>
                <button type="button" onClick={() => setFocus(n.id)} className="rounded-full border border-vio/35 bg-vio/10 px-2 py-0.5 text-[9.5px] text-ink2 hover:border-vio/70">
                  {n.label}
                </button>
              </Tooltip>
            ))}
          </div>
        )}
      </div>

      <div className="panel p-2.5">
        <SectionTitle
          icon={<Sparkles className="size-3.5" />}
          title="contradições entre fontes"
          hint={state.contradictions.length === 0 ? "nenhuma até agora" : `${state.contradictions.length} encontrada(s)`}
        />
        {state.contradictions.length === 0 ? (
          <p className="m-0 text-[10px] leading-relaxed text-dim">O detector compara afirmações numéricas sobre o mesmo tópico em fontes diferentes.</p>
        ) : (
          <div className="space-y-1.5">
            {state.contradictions.slice(0, 3).map((c) => (
              <div key={c.id} className="rounded-md border border-rose/30 bg-rose/8 p-2">
                <p className="m-0 text-[9px] font-bold uppercase tracking-wider text-rose">{c.topic}</p>
                <p className="m-0 mt-1 text-[10px] leading-snug text-ink2">
                  <span className="text-mint">A:</span> {c.claimA.text}
                </p>
                <p className="m-0 mt-0.5 text-[10px] leading-snug text-ink2">
                  <span className="text-rose">B:</span> {c.claimB.text}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    dispatch({ type: "toast", title: "Sugestão do motor", detail: "Vá à fonte B: o texto completo está aberto em outra aba. A divergência é sobre números — confira a data de publicação.", tone: "info" })
                  }
                  className="mt-1 text-[9px] text-vio hover:underline"
                >
                  como resolver →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── citações ───────────────────────────────────────────────────────────────── */

function CitationsPanel({ state }: { state: ParallaxState }) {
  const { dispatch } = useParallax();
  const [copied, setCopied] = useState(false);
  const sorted = sortCitations(state.citations);
  const text = exportBibliography(state.citations, state.settings.citeStyle);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      dispatch({ type: "toast", title: "Não foi possível copiar", detail: "Selecione o texto manualmente.", tone: "warn" });
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="panel p-2.5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink2">bibliografia</span>
          <Select
            value={state.settings.citeStyle}
            onChange={(v) => dispatch({ type: "settings", patch: { citeStyle: v } })}
            options={[
              { value: "abnt", label: "ABNT" },
              { value: "apa", label: "APA" },
              { value: "bibtex", label: "BibTeX" },
            ]}
            className="w-24"
          />
        </div>
        {state.citations.length === 0 ? (
          <p className="m-0 text-[10px] leading-relaxed text-dim">
            Abra uma página e use “Exportar referências”. O motor lê a lista de referências da página e formata no estilo escolhido.
          </p>
        ) : (
          <>
            <div className="scroll-thin max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {sorted.map((c) => (
                <div key={c.id} className="group rounded-md border border-line bg-panel2/50 p-1.5">
                  <p className="m-0 break-any text-[10px] leading-relaxed text-ink2">{formatCitation(c, state.settings.citeStyle)}</p>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "removeCitation", id: c.id })}
                    className="mt-1 inline-flex items-center gap-0.5 text-[8.5px] text-faint opacity-0 transition group-hover:opacity-100 hover:text-rose"
                  >
                    <Trash2 className="size-2.5" /> remover
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <Btn size="xs" variant="outline" icon={copied ? <Check className="size-3" /> : <Copy className="size-3" />} onClick={() => void copy()}>
                {copied ? "copiado" : "copiar"}
              </Btn>
              <Btn size="xs" variant="outline" icon={<Download className="size-3" />} onClick={() => download(new Blob([text], { type: "text/plain;charset=utf-8" }), `bibliografia.${state.settings.citeStyle === "bibtex" ? "bib" : "txt"}`)}>
                {state.settings.citeStyle === "bibtex" ? ".bib" : ".txt"}
              </Btn>
              <Btn size="xs" variant="danger" icon={<Trash2 className="size-3" />} onClick={() => sorted.forEach((c) => dispatch({ type: "removeCitation", id: c.id }))}>
                limpar
              </Btn>
            </div>
          </>
        )}
      </div>

      <div className="panel p-2.5">
        <SectionTitle icon={<Quote className="size-3.5" />} title="fontes já visitadas" hint="exporta todas de uma vez" />
        <div className="space-y-1">
          {[...new Set(state.reads.map((r) => r.url))].slice(0, 6).map((url) => {
            const r = state.reads.find((x) => x.url === url)!;
            return (
              <button
                key={url}
                type="button"
                onClick={() => {
                  dispatch({ type: "citeAll", pageIds: state.reads.map((x) => x.pageId) });
                }}
                className="block w-full truncate rounded px-1 py-0.5 text-left text-[9.5px] text-dim hover:bg-white/5 hover:text-ink"
                title={url}
              >
                {r.title}
              </button>
            );
          })}
          {state.reads.length === 0 && <p className="m-0 text-[10px] text-dim">Nenhuma leitura registrada ainda.</p>}
        </div>
      </div>
    </div>
  );
}

/* ── página ─────────────────────────────────────────────────────────────────── */

function PageInsights({ state, pageId }: { state: ParallaxState; pageId: string | null }) {
  const page = pageId ? pageById(pageId) : null;
  if (!page) return <p className="m-0 text-[10px] text-dim">Nenhuma página ativa.</p>;

  const plain = pagePlainText(page);
  const stats = pageStats(page);
  const product = PRODUCTS.find((p) => p.id === page.blocks.find((b) => b.kind === "product")?.productId);
  const patterns = detectDarkPatterns({
    text: plain,
    comments: page.blocks.flatMap((b) => b.items ?? []),
    price: product?.price,
    oldPrice: product?.oldPrice,
    fakeReviewShare: product?.fakeShare,
    store: product?.store,
  });
  const complexity = complexityOf(plain);
  const key = extractKeySentences(plain, 3);

  return (
    <div className="space-y-2.5">
      <div className="panel p-2.5">
        <SectionTitle icon={<ListChecks className="size-3.5" />} title="análise da página" hint={new URL(page.url).host} />
        <div className="kpi-grid">
          {[
            { l: "palavras", v: stats.words },
            { l: "minutos", v: stats.minutes },
            { l: "densidade", v: complexity },
            { l: "blocos", v: page.blocks.length },
          ].map((k) => (
            <div key={k.l} className="rounded-md border border-line bg-panel2/40 px-1.5 py-1">
              <p className="m-0 font-display text-[15px] font-bold text-ink">{k.v}</p>
              <p className="m-0 text-[8.5px] uppercase tracking-wider text-faint">{k.l}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-1">
          <Meter value={complexity / 100} color="#f0c987" label="densidade do original" hint={`${complexity}/100`} />
          <Meter value={Math.max(0.06, complexity / 100 - (state.level === "iniciante" ? 0.22 : 0.08))} color="#7ce0b1" label={`densidade no nível ${state.level}`} hint={`${Math.max(6, complexity - (state.level === "iniciante" ? 22 : 8))}/100`} />
          <Meter value={1 - patterns.length / 8} color="#7c9cff" label="higiene da interface" hint={`${patterns.length} padrão(ões) detectado(s)`} />
        </div>
      </div>

      <div className="panel p-2.5">
        <SectionTitle icon={<Sparkles className="size-3.5" />} title="resumo extrativo" hint="frequência de termos, sem LLM" />
        <ol className="m-0 space-y-1 pl-3.5 text-[10px] leading-relaxed text-dim">
          {key.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>

      <div className="panel p-2.5">
        <SectionTitle
          icon={<Search className="size-3.5" />}
          title="dark patterns"
          hint={patterns.length === 0 ? "nada suspeito nesta página" : `${patterns.length} encontrado(s)`}
        />
        <div className="space-y-1">
          {patterns.map((p) => (
            <div key={p.id} className="rounded-md border border-line bg-panel2/40 p-1.5">
              <p className="m-0 flex items-center gap-1 text-[10px] font-medium text-ink2">
                <span className={cn("size-1.5 rounded-full", p.severity === "alta" ? "bg-rose" : p.severity === "media" ? "bg-gold" : "bg-dim")} />
                {p.label}
                {p.activeSince && <span className="ml-auto text-[8.5px] font-normal text-faint">{p.activeSince}</span>}
              </p>
              <p className="m-0 mt-0.5 text-[9px] italic leading-snug text-dim">{p.evidence}</p>
            </div>
          ))}
          {patterns.length === 0 && <p className="m-0 text-[10px] text-dim">Esta página não usa urgência artificial, escassez falsa nem prova social fabricada.</p>}
        </div>
      </div>

      <div className="panel p-2.5">
        <SectionTitle icon={<Target className="size-3.5" />} title="glossário da página" hint={`${page.terms.length} termos`} />
        <div className="space-y-1">
          {page.terms.slice(0, 6).map((t) => (
            <details key={t.term} className="rounded border border-line bg-panel2/40 px-1.5 py-1">
              <summary className="cursor-pointer text-[10px] font-medium text-ink2">{t.term}</summary>
              <p className="m-0 mt-0.5 text-[9.5px] leading-relaxed text-dim">{t.definition}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── compra ─────────────────────────────────────────────────────────────────── */

function CommercePanel({ state, pageId }: { state: ParallaxState; pageId: string | null }) {
  const { dispatch } = useParallax();
  const page = pageId ? pageById(pageId) : null;
  const openProduct = page?.blocks.find((b) => b.kind === "product")?.productId;
  const product = PRODUCTS.find((p) => p.id === openProduct);
  const shopPages = ALL_PAGES.filter((p) => p.siteId === "shop");
  const comparisonCount = state.cart.length;

  return (
    <div className="space-y-2.5">
      <div className="panel p-2.5">
        <div className="mb-1.5 flex items-center gap-1.5">
          <GitCompare className="size-3.5 text-gold" />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink2">compra inteligente</span>
          <span className="ml-auto text-[9px] text-dim">{comparisonCount}/4 na comparação</span>
        </div>
        <p className="m-0 text-[10px] leading-relaxed text-dim">
          {state.intent?.budget
            ? `Orçamento declarado: R$ ${state.intent.budget.toLocaleString("pt-BR")}. O motor normaliza specs antes de comparar preço.`
            : "Sem orçamento declarado. Diga o teto (ex.: até R$ 3.000) para o filtro ficar exato."}
        </p>
        <div className="mt-2 space-y-1">
          {shopPages.map((p) => {
            const pid = p.blocks.find((b) => b.kind === "product")?.productId;
            const prod = PRODUCTS.find((x) => x.id === pid);
            const active = p.id === pageId;
            const overBudget = state.intent?.budget ? (prod?.price ?? 0) > state.intent.budget : false;
            return (
              <div key={p.id} className={cn("rounded-md border px-2 py-1.5", active ? "border-gold/50 bg-gold/8" : "border-line bg-panel2/40")}>
                <button type="button" onClick={() => dispatch({ type: "navigate", siteId: p.siteId, pageId: p.id })} className="flex w-full items-center gap-1.5 text-left">
                  <span className="size-1.5 shrink-0 rounded-full" style={{ background: SITES.shop.accent }} />
                  <span className="min-w-0 flex-1 truncate text-[10px] text-ink2">{prod?.store ?? "loja"} · {p.title.slice(0, 30)}…</span>
                  <span className={cn("mono shrink-0 text-[10px]", overBudget ? "text-rose" : "text-ink")}>
                    R$ {(prod?.price ?? 0).toLocaleString("pt-BR")}
                  </span>
                </button>
                {prod && (
                  <div className="mt-1 flex items-center gap-1">
                    <Btn size="xs" variant={state.cart.some((c) => c.productId === prod.id) ? "success" : "outline"} onClick={() => dispatch({ type: "cartAdd", productId: prod.id })}>
                      {state.cart.some((c) => c.productId === prod.id) ? "na comparação" : "comparar"}
                    </Btn>
                    <span className="text-[8.5px] text-faint">
                      {Math.round(prod.fakeShare * 100)}% reviews suspeitas · nota longa {prod.longTermScore}/10
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {comparisonCount >= 2 && (
          <Btn size="sm" variant="gold" full className="mt-2" icon={<GitCompare className="size-3.5" />} onClick={() => dispatch({ type: "toast", title: "Comparador pronto", detail: "Use a barra dourada abaixo da página para abrir lado a lado.", tone: "ok" })}>
            {comparisonCount} ofertas prontas para comparar
          </Btn>
        )}
      </div>

      {product && (
        <>
          <div className="panel p-2.5">
            <SectionTitle icon={<TrendingDown className="size-3.5" />} title={product.store} hint="preço real, não o riscado" />
            <PriceHistoryCard productId={product.id} />
          </div>
          <div className="panel p-2.5">
            <SectionTitle icon={<ShieldAlert className="size-3.5" />} title="dark patterns desta página" hint={`${detectDarkPatternsIn(product, page).length} com evidência`} />
            <div className="space-y-1">
              {detectDarkPatternsIn(product, page).map((p) => (
                <div key={p.id} className="rounded-md border border-line bg-panel2/40 p-1.5">
                  <p className="m-0 flex items-center gap-1 text-[10px] font-medium text-ink2">
                    <span className={cn("size-1.5 rounded-full", p.severity === "alta" ? "bg-rose" : "bg-gold")} />
                    {p.label}
                  </p>
                  <p className="m-0 mt-0.5 text-[9px] italic leading-snug text-dim">{p.evidence}</p>
                  {p.activeSince && <p className="m-0 mt-0.5 text-[8.5px] text-faint">exibido {p.activeSince}</p>}
                </div>
              ))}
              {detectDarkPatternsIn(product, page).length === 0 && <p className="m-0 text-[10px] text-dim">Nenhum padrão encontrado nesta oferta.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function detectDarkPatternsIn(product: (typeof PRODUCTS)[number], page: Page | null | undefined) {
  const text = page ? page.blocks.map((b) => [b.text, ...(b.items ?? [])].join(" ")).join(" ") : "";
  return detectDarkPatterns({
    text,
    comments: page?.blocks.flatMap((b) => b.items ?? []) ?? [],
    oldPrice: product.oldPrice,
    price: product.price,
    fakeReviewShare: product.fakeShare,
    store: product.store,
  });
}

/* util exportado para os outros painéis */
export function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[10px]">
      <span className="text-dim">{label}</span>
      <span className="mono font-medium" style={{ color: color ?? "var(--color-ink)" }}>
        {value}
      </span>
    </div>
  );
}

