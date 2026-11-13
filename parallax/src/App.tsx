import {
  BookOpen,
  Brain,
  Globe2,
  Keyboard,
  Microscope,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Toasts, Btn, IconBtn, Modal, Toggle, Slider, Segmented, MODE_META, ModeChip } from "@/components/ui";
import { COGNITIVE_META, detectCognition, recommendMode } from "@/core/cognition";
import { useHeartbeat, useParallax } from "@/core/store";
import Browser from "@/views/Browser";
import Cerebro from "@/views/Cerebro";
import Foco from "@/views/Foco";
import Lab from "@/views/Lab";
import Manifesto from "@/views/Manifesto";
import type { AppView } from "@/core/types";
import { cn, download } from "@/lib/utils";

const NAV: { id: AppView; label: string; icon: typeof Globe2; hint: string; key: string }[] = [
  { id: "navegador", label: "Navegar", icon: Globe2, hint: "O navegador com o motor ligado", key: "1" },
  { id: "cerebro", label: "Cérebro", icon: Brain, hint: "Grafo, memória e cartões", key: "2" },
  { id: "foco", label: "Foco", icon: Target, hint: "Sessões, respiração e abas", key: "3" },
  { id: "lab", label: "Motor", icon: Microscope, hint: "Reescrita lado a lado e benchmark", key: "4" },
  { id: "manifesto", label: "Tese", icon: BookOpen, hint: "O porquê, a arquitetura e o modelo", key: "5" },
];

export default function App() {
  const { state, dispatch, store } = useParallax();
  const [onboarding, setOnboarding] = useState(!state.onboarded);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [recOpen, setRecOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);

  useHeartbeat(20_000);

  const cognition = useMemo(() => detectCognition(state), [state]);
  const meta = COGNITIVE_META[cognition.state];
  const recommendation = useMemo(() => recommendMode(cognition, state.mode), [cognition, state.mode]);

  /* recomendação de modo quando o detector muda de estado */
  useEffect(() => {
    if (!recommendation || state.recommendDismissed || onboarding) return;
    const t = setTimeout(() => setRecOpen(true), 1200);
    return () => clearTimeout(t);
  }, [recommendation, state.recommendDismissed, onboarding]);

  /* modo calma aplica veu global */
  useEffect(() => {
    document.documentElement.dataset.mode = state.mode;
  }, [state.mode]);

  /* atalhos */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const editing = target?.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "F1" || (e.key === "?" && !editing)) {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
      }
      if (editing) return;
      const nav = NAV.find((n) => n.key === e.key);
      if (nav) dispatch({ type: "view", view: nav.id });
      if (e.key.toLowerCase() === "m") dispatch({ type: "mode", mode: nextMode(state.mode) });
      if (e.key.toLowerCase() === "f") {
        if (state.focusTask) dispatch({ type: "view", view: "foco" });
        else dispatch({ type: "view", view: "foco" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch, state.mode, state.focusTask]);

  const view =
    state.view === "cerebro" ? (
      <Cerebro />
    ) : state.view === "foco" ? (
      <Foco />
    ) : state.view === "lab" ? (
      <Lab />
    ) : state.view === "manifesto" ? (
      <Manifesto />
    ) : (
      <Browser />
    );

  return (
    <div className={cn("par-shell", railCollapsed && "par-shell-collapsed")}>
      {/* topbar */}
      <header className="par-topbar">
        <div className="par-brand-cell">
          <button type="button" onClick={() => dispatch({ type: "view", view: "manifesto" })} className="focus-ring grid place-items-center rounded-lg p-1" title="Sobre o Parallax" aria-label="Parallax — tese">
            <ParallaxMark />
          </button>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
          <div className="hidden min-w-0 items-baseline gap-2 sm:flex">
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">camada de cognição</span>
            <span className="truncate font-display text-[12.5px] font-semibold tracking-tight text-ink">
              {NAV.find((n) => n.id === state.view)?.hint}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span
              className="hidden items-center gap-1.5 rounded-full border px-2 py-1 text-[9.5px] font-medium md:inline-flex"
              style={{ color: meta.color, borderColor: `${meta.color}44`, background: `${meta.color}10` }}
              title={`${meta.hint} · confiança ${Math.round(cognition.confidence * 100)}%`}
            >
              <i className="par-pulse size-1.5 rounded-full" style={{ background: meta.color }} />
              {meta.label}
            </span>
            <span className="hidden items-center gap-1 rounded-full border border-line bg-panel2 px-2 py-1 text-[9.5px] text-dim lg:inline-flex">
              <Zap className="size-2.5 text-gold" /> {state.mode === "compra" ? "modo compra" : state.mode === "calma" ? "modo calma" : "motor local"}
            </span>
            <span className="hidden items-center gap-1 rounded-full border border-mint/25 bg-mint/8 px-2 py-1 text-[9.5px] text-mint xl:inline-flex">
              <ShieldCheck className="size-2.5" /> privacidade por construção
            </span>
            <IconBtn size="sm" title="Atalhos (?)" onClick={() => setShortcutsOpen(true)}>
              <Keyboard className="size-3.5" />
            </IconBtn>
            <IconBtn size="sm" title="Configurações" onClick={() => setSettingsOpen(true)}>
              <Settings2 className="size-3.5" />
            </IconBtn>
            <Btn size="sm" variant="ghost" onClick={() => setOnboarding(true)} className="hidden sm:inline-flex">
              onboarding
            </Btn>
          </div>
        </div>
      </header>

      {/* rail */}
      <nav className={cn("par-rail", railCollapsed && "par-rail-collapsed")} aria-label="Navegação principal">
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => dispatch({ type: "view", view: n.id })}
            className={cn("par-rail-btn", state.view === n.id && "is-active")}
            title={`${n.label} — ${n.hint} (${n.key})`}
            aria-current={state.view === n.id ? "page" : undefined}
          >
            <n.icon className="size-4" />
            <span>{n.label}</span>
          </button>
        ))}
        <div className="mt-auto flex flex-col gap-1 pb-1">
          <button
            type="button"
            onClick={() => dispatch({ type: "mode", mode: nextMode(state.mode) })}
            className="par-rail-btn"
            title="Alternar modo (M)"
          >
            <Sparkles className="size-4 text-gold" />
            <span>modo</span>
          </button>
          <button type="button" onClick={() => setRailCollapsed((v) => !v)} className="par-rail-btn" title="Recolher barra">
            {railCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            <span>barra</span>
          </button>
        </div>
      </nav>

      <main className="par-main">{view}</main>

      {/* status bar */}
      <footer className="par-statusbar">
        <span className="par-status-dot" />
        <span className="text-mint">motor local</span>
        <span className="hidden sm:inline">{MODE_META[state.mode].label}</span>
        <span className="hidden items-center gap-1 md:inline-flex">
          <ModeChip mode={state.mode} />
        </span>
        <span className="hidden lg:inline">nível {state.level}</span>
        <span className="hidden lg:inline">{state.tabs.length} abas · {state.reads.length} leituras · {state.cards.length} cartões</span>
        <span className="ml-auto hidden items-center gap-1 sm:flex">
          <span className="size-1 rounded-full bg-vio" /> {state.graph.nodes.length} nós
          <span className="mx-1 size-1 rounded-full bg-gold" /> {state.graph.edges.length} arestas
        </span>
        <span className="hidden xl:inline">nenhum byte enviado</span>
        <span className="mono">{Math.round(state.activeMs / 60000)} min ativos</span>
      </footer>

      <Toasts />

      {/* recomendação do detector */}
      <Modal
        open={recOpen && Boolean(recommendation) && !state.recommendDismissed}
        onClose={() => {
          setRecOpen(false);
          dispatch({ type: "dismissRecommendation" });
        }}
        title="O Parallax percebeu um padrão"
        subtitle={`Estado detectado: ${meta.label} · ${Math.round(cognition.confidence * 100)}% de confiança`}
        width={470}
      >
        {recommendation && (
          <div>
            <p className="m-0 text-[12px] leading-relaxed text-ink2">{recommendation.why}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {cognition.reasons.map((r, i) => (
                <span key={i} className="rounded-full border border-line bg-panel2 px-2 py-0.5 text-[9.5px] text-dim">
                  {r}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Btn
                variant="primary"
                onClick={() => {
                  dispatch({ type: "mode", mode: recommendation.mode, why: recommendation.why });
                  setRecOpen(false);
                }}
              >
                Ativar {MODE_META[recommendation.mode].label}
              </Btn>
              <Btn
                variant="ghost"
                onClick={() => {
                  setRecOpen(false);
                  dispatch({ type: "dismissRecommendation" });
                }}
              >
                continuar do jeito que está
              </Btn>
            </div>
            <p className="m-0 mt-3 text-[9.5px] leading-relaxed text-faint">
              Você pode desligar essas sugestões nas configurações. O detector nunca envia amostras para fora do dispositivo.
            </p>
          </div>
        )}
      </Modal>

      {/* onboarding */}
      <Onboarding
        open={onboarding}
        onClose={() => {
          setOnboarding(false);
          dispatch({ type: "onboard", onboarded: true });
          store.persist();
        }}
        onStart={(raw, mode) => {
          dispatch({ type: "onboard", onboarded: true });
          if (raw) dispatch({ type: "setIntent", raw, mode });
          setOnboarding(false);
          dispatch({ type: "view", view: "navegador" });
        }}
        state={state}
        cognition={cognition}
      />

      {/* settings */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Configurações do Parallax" subtitle="tudo fica neste dispositivo" width={620}>
        <div className="space-y-4">
          <section>
            <p className="eyebrow mb-1.5">reescrita</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-dim">nível padrão</span>
                <Segmented
                  value={state.level}
                  onChange={(v) => dispatch({ type: "level", level: v })}
                  options={[
                    { value: "iniciante", label: "iniciante", hint: "linguagem simples e frases curtas" },
                    { value: "intermediario", label: "intermediário", hint: "clareza com precisão" },
                    { value: "avancado", label: "avançado", hint: "densidade técnica" },
                  ]}
                />
              </div>
              <Slider label="intensidade da reescrita" value={Math.round(state.settings.rewriteIntensity * 100)} min={0} max={100} unit="%" onChange={(v) => dispatch({ type: "settings", patch: { rewriteIntensity: v / 100 } })} />
              <Toggle checked={state.settings.autoRewrite} onChange={(v) => dispatch({ type: "settings", patch: { autoRewrite: v } })} label="reescrever automaticamente ao abrir a página" hint="desligar mostra o site original em todo lugar" />
              <Toggle checked={state.settings.reducedMotion} onChange={(v) => dispatch({ type: "settings", patch: { reducedMotion: v } })} label="reduzir animações" hint="respeita prefers-reduced-motion por padrão do sistema" />
            </div>
          </section>

          <section>
            <p className="eyebrow mb-1.5">percepção</p>
            <div className="space-y-1">
              <Toggle checked={state.settings.showCognition} onChange={(v) => dispatch({ type: "settings", patch: { showCognition: v } })} label="mostrar estado cognitivo na barra" />
              <Toggle checked={state.settings.showGraph} onChange={(v) => dispatch({ type: "settings", patch: { showGraph: v } })} label="exibir grafo de conhecimento" />
              <Toggle
                checked={!state.recommendDismissed}
                onChange={(v) => dispatch({ type: "recommendEnabled", value: v })}
                label="sugerir mudança de modo"
                hint="o detector propõe calma ou foco quando vê sobrecarga"
              />
            </div>
          </section>

          <section>
            <p className="eyebrow mb-1.5">dados</p>
            <div className="flex flex-wrap gap-1.5">
              <Btn size="sm" variant="outline" icon={<ShieldCheck className="size-3.5" />} onClick={() => download(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }), "parallax-estado.json")}>
                exportar estado completo
              </Btn>
              <Btn
                size="sm"
                variant="outline"
                icon={<Sparkles className="size-3.5" />}
                onClick={() => {
                  store.persist();
                  dispatch({ type: "toast", title: "Salvo no dispositivo", detail: "localStorage atualizado com o estado atual.", tone: "ok" });
                }}
              >
                salvar agora
              </Btn>
              <Btn
                size="sm"
                variant="danger"
                onClick={() => {
                  if (confirm("Apagar todo o estado do Parallax neste dispositivo?")) {
                    store.reset();
                    setSettingsOpen(false);
                  }
                }}
              >
                apagar tudo
              </Btn>
            </div>
            <p className="m-0 mt-1.5 text-[9.5px] leading-relaxed text-faint">
              O estado inclui intenções, leituras, grafo e cartões. Nada disso sai do seu navegador — o export existe justamente
              porque não há nuvem.
            </p>
          </section>
        </div>
      </Modal>

      <Shortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <RecBadge />
    </div>
  );
}

/* ── componentes internos ─────────────────────────────────────────────────── */

function ParallaxMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="pm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c9cff" />
          <stop offset="100%" stopColor="#f0c987" />
        </linearGradient>
      </defs>
      <path d="M6 25c5-13 8-13 13 0" fill="none" stroke="url(#pm)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M19 25c2.6-6.6 4.4-6.6 7-0" fill="none" stroke="#f0c987" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
      <path d="M10 9h12" stroke="#e8ecf4" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <circle cx="16" cy="17" r="1.4" fill="#7ce0b1" />
    </svg>
  );
}

function nextMode(mode: import("@/core/types").ModeId): import("@/core/types").ModeId {
  const order = ["aprendizado", "pesquisa", "compra", "foco", "calma"] as const;
  return order[(order.indexOf(mode) + 1) % order.length];
}

function RecBadge() {
  const { state, dispatch } = useParallax();
  const cognition = useMemo(() => detectCognition(state), [state]);
  const rec = recommendMode(cognition, state.mode);
  if (!rec || state.recommendDismissed) return null;
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "mode", mode: rec.mode, why: rec.why })}
      className="fixed bottom-10 right-3 z-40 flex max-w-[260px] items-start gap-2 rounded-xl border border-gold/40 bg-[#141109]/95 px-2.5 py-2 text-left shadow-2xl backdrop-blur transition hover:border-gold/70"
      title={rec.why}
    >
      <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gold" />
      <span>
        <span className="block text-[10px] font-semibold text-gold">sugestão do detector</span>
        <span className="mt-0.5 block text-[9.5px] leading-snug text-dim">Mudar para {MODE_META[rec.mode].label}? {rec.why.slice(0, 74)}…</span>
      </span>
    </button>
  );
}

function Onboarding({
  open,
  onClose,
  onStart,
  state,
  cognition,
}: {
  open: boolean;
  onClose: () => void;
  onStart: (raw: string, mode?: import("@/core/types").ModeId) => void;
  state: ReturnType<typeof useParallax>["state"];
  cognition: ReturnType<typeof detectCognition>;
}) {
  const { dispatch } = useParallax();
  const [step, setStep] = useState(0);
  const [raw, setRaw] = useState("Estou estudando machine learning para a faculdade");
  const [level, setLevel] = useState(state.level);

  const steps = [
    {
      title: "A web não foi feita para o seu cérebro",
      body: (
        <div className="space-y-2.5 text-[11.5px] leading-relaxed text-dim">
          <p className="m-0">
            O Parallax é uma camada entre você e qualquer site. Ele lê a página, entende o que você está tentando fazer e
            reescreve o que aparece — tamanho do texto, jargão, layout, estímulo.
          </p>
          <p className="m-0">
            Não é bloqueador. Não é resumo. É um motor de re-renderização que usa a sua intenção como folha de estilo.
          </p>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {[
              { i: Brain, t: "entende a intenção", d: "estudar, pesquisar, comprar, focar" },
              { i: Sparkles, t: "reescreve a página", d: "nível, densidade e estímulo" },
              { i: ShieldCheck, t: "não vê um servidor", d: "memória e IA no dispositivo" },
            ].map((x) => (
              <div key={x.t} className="rounded-lg border border-line bg-panel2/50 p-2">
                <x.i className="size-3.5 text-vio" />
                <p className="m-0 mt-1 text-[10.5px] font-medium text-ink">{x.t}</p>
                <p className="m-0 text-[9px] leading-snug text-dim">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Comece declarando uma intenção",
      body: (
        <div className="space-y-2">
          <p className="m-0 text-[11.5px] leading-relaxed text-dim">
            Uma frase basta. O parser local extrai o verbo, o tópico e o orçamento (se houver) e escolhe um dos cinco modos.
          </p>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={3}
            className="focus-ring w-full resize-none rounded-lg border border-line bg-night2 p-2.5 text-[12px] text-ink"
            placeholder="ex.: quero comprar um monitor 4K até R$ 3.000"
          />
          <div className="flex flex-wrap gap-1">
            {[
              "Estou estudando machine learning para a faculdade",
              "Estou pesquisando energias renováveis para um relatório",
              "Quero comprar um monitor 4K até R$ 3.000",
              "Preciso terminar este código em 90 minutos",
            ].map((p) => (
              <button key={p} type="button" onClick={() => setRaw(p)} className="max-w-full truncate rounded-full border border-line bg-panel2 px-2 py-0.5 text-left text-[9.5px] text-dim hover:text-ink">
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-panel2/40 px-2 py-1.5">
            <span className="text-[10px] text-dim">em que nível você quer o texto?</span>
            <Segmented
              value={level}
              onChange={(v) => setLevel(v)}
              options={[
                { value: "iniciante", label: "iniciante" },
                { value: "intermediario", label: "médio" },
                { value: "avancado", label: "avançado" },
              ]}
            />
          </div>
        </div>
      ),
    },
    {
      title: "Você continua no controle",
      body: (
        <div className="space-y-2 text-[11.5px] leading-relaxed text-dim">
          <p className="m-0">
            Cada modo pode ser trocado, desligado ou reescrito. O motor mostra <span className="text-ink2">o que mudou e por quê</span>{" "}
            em cada parágrafo.
          </p>
          <ul className="m-0 space-y-1 pl-3.5">
            <li>modo calma não bloqueia nada — só reduz estímulo</li>
            <li>foco deixa abas acessíveis, apenas dessaturadas</li>
            <li>memória vive no seu navegador e é exportável em JSON</li>
            <li>estado cognitivo atual: <span style={{ color: COGNITIVE_META[cognition.state].color }}>{COGNITIVE_META[cognition.state].label}</span> (detectado por interação, sem câmera)</li>
          </ul>
          <div className="rounded-lg border border-mint/25 bg-mint/8 p-2 text-[10px] leading-relaxed text-mint">
            Nenhuma conta. Nenhum cookie de rastreamento. Nenhum byte sai daqui para reescrever uma página.
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title={`Parallax · ${step + 1} de ${steps.length}`} subtitle={steps[step].title} width={560}>
      {steps[step].body}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button type="button" onClick={onClose} className="text-[10px] text-faint hover:text-dim">
          pular onboarding
        </button>
        <div className="flex gap-1.5">
          {step > 0 && (
            <Btn size="sm" variant="ghost" onClick={() => setStep((s) => s - 1)}>
              voltar
            </Btn>
          )}
          {step < steps.length - 1 ? (
            <Btn size="sm" variant="primary" onClick={() => setStep((s) => s + 1)}>
              continuar
            </Btn>
          ) : (
            <Btn
              size="sm"
              variant="gold"
              icon={<Sparkles className="size-3.5" />}
              onClick={() => {
                dispatch({ type: "level", level });
                onStart(raw, undefined);
              }}
            >
              entrar no Parallax
            </Btn>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Shortcuts({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Atalhos" subtitle="funcionam em qualquer tela" width={460}>
      <div className="space-y-3">
        {[
          { group: "navegação", rows: [["1–5", "navegar · cérebro · foco · motor · tese"], ["M", "ciclar modos"], ["Ctrl+K", "busca / omnibox"], ["Ctrl+T", "nova aba"], ["F1 / ?", "esta ajuda"]] },
          { group: "leitura", rows: [["clique no termo", "glossário"], ["hover no parágrafo", "ver por que mudou"], ["scroll", "progresso salvo automaticamente"]] },
          { group: "motor", rows: [["modo", "o que faz"], ["Aprendizado", "reescreve no nível + flashcards"], ["Pesquisa", "grafo + citações"], ["Compra", "dark patterns + comparação"], ["Foco", "suprime estímulo"], ["Calma", "dessatura e simplifica"]] },
        ].map((g) => (
          <div key={g.group}>
            <p className="m-0 mb-1 text-[9px] font-bold uppercase tracking-wider text-faint">{g.group}</p>
            <div className="grid gap-1">
              {g.rows.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 rounded-md border border-line bg-panel2/40 px-2 py-1">
                  <span className="mono shrink-0 rounded bg-night2 px-1.5 py-0.5 text-[9.5px] text-gold">{k}</span>
                  <span className="text-right text-[10px] text-dim">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p className="m-0 text-[9px] leading-relaxed text-faint">
          Tudo funciona offline depois do primeiro carregamento — inclusive a reescrita, o grafo e as citações.
        </p>
      </div>
    </Modal>
  );
}
