import {
  Bell,
  CircleDot,
  Coffee,
  EyeOff,
  Heart,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  Wind,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Btn, IconBtn, Meter, SectionTitle, Segmented } from "@/components/ui";
import { COGNITIVE_META, detectCognition } from "@/core/cognition";
import { useParallax } from "@/core/store";
import { SITES } from "@/data/sites";
import { fmtTime } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
   Foco absoluto
   Não bloqueia nada: muda a aparência do que não serve à tarefa e pergunta
   com educação. O timer adapta o intervalo ao ritmo real de foco.
   ──────────────────────────────────────────────────────────────────────────── */

export default function Foco() {
  const { state, dispatch } = useParallax();
  const [now, setNow] = useState(Date.now());
  const [paused, setPaused] = useState(false);
  const [pausedMs, setPausedMs] = useState(0);
  const [draft, setDraft] = useState("");
  const [minutes, setMinutes] = useState(90);
  const [breathOpen, setBreathOpen] = useState(false);
  const pauseStart = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (paused) pauseStart.current = Date.now();
    else if (pauseStart.current) {
      setPausedMs((p) => p + (Date.now() - pauseStart.current!));
      pauseStart.current = null;
    }
  }, [paused]);

  const task = state.focusTask;
  const cognition = useMemo(() => detectCognition(state), [state]);
  const meta = COGNITIVE_META[cognition.state];

  const livePause = paused && pauseStart.current ? Date.now() - pauseStart.current : 0;
  const elapsed = task ? Math.max(0, (now - task.startedAt - pausedMs - livePause) / 1000) : 0;
  const total = (task?.minutes ?? minutes) * 60;
  const remaining = Math.max(0, total - elapsed);
  const pct = task ? Math.min(1, elapsed / total) : 0;

  const irrelevant = state.tabs.filter((t) => !t.essential);
  const essentialTabs = state.tabs.filter((t) => t.essential);

  const start = () => {
    const label = draft.trim() || "Terminar o que importa";
    dispatch({ type: "startFocus", label, minutes });
    setDraft("");
    setPausedMs(0);
    setPaused(false);
  };

  return (
    <div className="scroll-thin h-full overflow-y-auto p-3">
      <div className="mx-auto max-w-5xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg border border-lilac/40 bg-lilac/12 text-lilac">
              <Target className="size-4" />
            </span>
            <div>
              <h1 className="m-0 font-display text-base font-semibold text-ink">Foco absoluto</h1>
              <p className="m-0 text-[10.5px] text-dim">Nada é bloqueado. O que não serve à tarefa fica visualmente desinteressante.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge color={meta.color}>{meta.label}</Badge>
            <Btn size="sm" variant="outline" icon={<Wind className="size-3.5" />} onClick={() => setBreathOpen(true)}>
              respiração 60s
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => dispatch({ type: "view", view: "navegador" })}>
              voltar à web
            </Btn>
          </div>
        </div>

        {!task ? (
          <div className="panel p-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
              <div>
                <p className="eyebrow">nova sessão</p>
                <h2 className="m-0 mt-1 font-display text-xl font-semibold text-ink">Qual é a única coisa que precisa terminar?</h2>
                <p className="m-0 mt-1 text-[11.5px] leading-relaxed text-dim">
                  A tarefa fica fixa no topo. As abas que não forem marcadas como essenciais ganham dessaturação e blur leve — mas continuam acessíveis.
                </p>
                <div className="mt-3 flex flex-col gap-1.5 sm:flex-row">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && start()}
                    placeholder="ex.: terminar o capítulo 4 do TCC"
                    className="focus-ring h-9 min-w-0 flex-1 rounded-lg border border-line bg-night2 px-3 text-[12px] text-ink placeholder:text-faint"
                  />
                  <Btn variant="gold" icon={<Play className="size-3.5" />} onClick={start}>
                    iniciar
                  </Btn>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-dim">duração:</span>
                  <Segmented
                    value={String(minutes)}
                    onChange={(v) => setMinutes(Number(v))}
                    options={[
                      { value: "25", label: "25" },
                      { value: "45", label: "45" },
                      { value: "90", label: "90" },
                      { value: "120", label: "120" },
                    ]}
                  />
                  <span className="text-[9.5px] text-faint">min</span>
                </div>
              </div>
              <div className="rounded-xl border border-line bg-panel2/40 p-3">
                <p className="m-0 flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wider text-faint">
                  <ShieldCheck className="size-3" /> o que o modo faz
                </p>
                <ul className="m-0 mt-1.5 space-y-1 pl-3.5 text-[10px] leading-relaxed text-dim">
                  <li>abas não essenciais em grayscale + blur (não fechadas)</li>
                  <li>feeds laterais, autoplay e contadores removidos do DOM renderizado</li>
                  <li>pergunta gentil ao detectar desvio de contexto</li>
                  <li>intervalo sugerido pelo seu ritmo real de foco</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="panel relative overflow-hidden p-4">
              <div className="grid gap-4 md:grid-cols-[190px_minmax(0,1fr)] md:items-center">
                {/* anel */}
                <div className="relative mx-auto grid size-44 place-items-center">
                  <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#1d2331" strokeWidth="6" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke={elapsed > total * 0.8 ? "#f0c987" : "#c7a6ff"}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={`${2 * Math.PI * 52 * (1 - pct)}`}
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                  </svg>
                  <div className="text-center">
                    <p className="m-0 font-display text-3xl font-bold tabular-nums text-ink">{fmtTime(remaining)}</p>
                    <p className="m-0 text-[9.5px] uppercase tracking-wider text-faint">{paused ? "pausado" : "restantes"}</p>
                    <p className="m-0 mt-0.5 text-[9px] text-dim">{task.pomodoros} pomodoro(s)</p>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="eyebrow">sessão em andamento</p>
                  <h2 className="m-0 mt-1 truncate font-display text-lg font-semibold text-ink">{task.label}</h2>
                  <p className="m-0 mt-1 text-[10.5px] text-dim">
                    Ativação: {Math.round(pct * 100)}% · foco detectado {Math.round(cognition.focus * 100)} · trocas/min {cognition.switchesLastMinute}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Btn size="sm" variant={paused ? "gold" : "outline"} icon={paused ? <Play className="size-3" /> : <Pause className="size-3" />} onClick={() => setPaused((v) => !v)}>
                      {paused ? "continuar" : "pausar"}
                    </Btn>
                    <Btn size="sm" variant="outline" icon={<Coffee className="size-3" />} onClick={() => dispatch({ type: "pomodoro" })}>
                      próximo pomodoro
                    </Btn>
                    <Btn size="sm" variant="danger" icon={<X className="size-3" />} onClick={() => dispatch({ type: "endFocus", completed: elapsed >= total * 0.9 })}>
                      encerrar
                    </Btn>
                    <Btn size="sm" variant="ghost" onClick={() => dispatch({ type: "view", view: "navegador" })}>
                      abrir a página da tarefa
                    </Btn>
                  </div>
                  <div className="mt-3 space-y-2">
                    <Meter value={1 - pct} color="#c7a6ff" label="tempo restante" hint={`${fmtTime(remaining)} de ${fmtTime(total)}`} />
                    <Meter value={cognition.focus} color={meta.color} label="foco agora" hint={meta.label} />
                  </div>
                  <p className="m-0 mt-2 text-[9.5px] leading-relaxed text-faint">
                    sugestão adaptativa:{" "}
                    {cognition.focus > 0.7
                      ? "ritmo alto — intervalos de 52 min com 8 de pausa rendem mais que o Pomodoro clássico para você."
                      : "foco em queda — pausa de 5 min a cada 25 min restabelece a taxa de acerto."}
                  </p>
                </div>
              </div>
            </div>

            {irrelevant.length > 0 && (
              <div className="panel border-gold/30 bg-gold/6 p-3">
                <div className="flex items-start gap-2.5">
                  <CircleDot className="mt-0.5 size-4 shrink-0 text-gold" />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[11.5px] font-semibold text-ink">Isso faz parte da sua tarefa?</p>
                    <p className="m-0 mt-0.5 text-[10.5px] leading-relaxed text-dim">
                      Você tem {irrelevant.length} aba(s) fora do escopo de <span className="text-ink2">“{task.label}”</span>. Elas continuam abertas — só ficam menos chamativas.
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {irrelevant.slice(0, 4).map((t) => (
                        <span key={t.id} className="inline-flex max-w-[220px] items-center gap-1 rounded-full border border-line bg-panel2 px-2 py-0.5 text-[9.5px] text-dim">
                          <span className="size-1.5 rounded-full" style={{ background: SITES[t.siteId].accent }} />
                          <span className="truncate">{t.title}</span>
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Btn size="xs" variant="outline" icon={<Plus className="size-3" />} onClick={() => irrelevant.forEach((t) => dispatch({ type: "essentialTab", tabId: t.id, value: true }))}>
                        faz parte, manter
                      </Btn>
                      <Btn size="xs" variant="ghost" onClick={() => irrelevant.forEach((t) => dispatch({ type: "closeTab", tabId: t.id }))}>
                        fechar sem culpa
                      </Btn>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="panel p-3">
                <SectionTitle icon={<ShieldCheck className="size-3.5" />} title="abas essenciais" hint="estas ficam nítidas durante a sessão" />
                <div className="space-y-1">
                  {essentialTabs.length === 0 && <p className="m-0 text-[10.5px] text-dim">Nenhuma aba marcada. A aba ativa vira essencial automaticamente.</p>}
                  {essentialTabs.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 rounded-md border border-line bg-panel2/40 px-2 py-1.5">
                      <span className="size-1.5 rounded-full" style={{ background: SITES[t.siteId].accent }} />
                      <span className="min-w-0 flex-1 truncate text-[10.5px] text-ink2">{t.title}</span>
                      <Badge color="#c7a6ff">essencial</Badge>
                      <IconBtn size="sm" title="Remover do escopo" onClick={() => dispatch({ type: "essentialTab", tabId: t.id, value: false })}>
                        <EyeOff className="size-3" />
                      </IconBtn>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel p-3">
                <SectionTitle icon={<TimerReset className="size-3.5" />} title="ajustes do modo" hint="o resto é opcional" />
                <div className="space-y-1.5">
                  {[
                    { label: "dessaturar abas não essenciais", value: true },
                    { label: "remover feeds e contadores", value: true },
                    { label: "perguntar antes de abrir aba fora do escopo", value: true },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-2 rounded-md border border-line bg-panel2/40 px-2 py-1.5">
                      <span className="text-[10.5px] text-dim">{row.label}</span>
                      <span className="flex h-4 w-7 items-center rounded-full border border-lilac/60 bg-lilac/70 px-0.5">
                        <span className="ml-auto size-3 rounded-full bg-white" />
                      </span>
                    </div>
                  ))}
                </div>
                <p className="m-0 mt-2 flex items-start gap-1.5 text-[9.5px] leading-relaxed text-faint">
                  <Bell className="mt-0.5 size-3 shrink-0" />
                  Notificações do sistema não são tocadas: o Parallax não pede permissão de sistema — ele muda o que já está na sua tela.
                </p>
              </div>
            </div>
          </>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "sessões hoje", value: state.focusTask ? 1 : 0, hint: "contadas por tarefa concluída", icon: Target },
            { label: "tempo de foco", value: `${Math.round(elapsed / 60)} min`, hint: "tempo ativo nesta sessão", icon: Sparkles },
            { label: "respirações", value: state.breath.length, hint: "60s cada, opcionais", icon: Heart },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-line bg-panel/60 p-3">
              <k.icon className="size-3.5 text-dim" />
              <p className="m-0 mt-1 font-display text-xl font-bold text-ink">{k.value}</p>
              <p className="m-0 text-[9px] uppercase tracking-wider text-faint">{k.label}</p>
              <p className="m-0 mt-0.5 text-[9px] text-dim">{k.hint}</p>
            </div>
          ))}
        </div>
      </div>

      {breathOpen && <Breathing onClose={() => setBreathOpen(false)} onDone={(s) => dispatch({ type: "breath", seconds: s, source: "foco" })} />}
    </div>
  );
}

/* ── respiração 4-4-4-4 ─────────────────────────────────────────────────────── */

export function Breathing({ onClose, onDone }: { onClose: () => void; onDone: (seconds: number) => void }) {
  const [elapsed, setElapsed] = useState(0);
  const total = 60;
  const phaseLen = 4;
  const phaseIndex = Math.floor((elapsed % 16) / phaseLen);
  const phases = ["inspire", "sustente", "expire", "sustente"];
  const inPhase = elapsed % phaseLen;
  const done = elapsed >= total;

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [done]);

  const scale = phaseIndex === 0 ? 0.7 + (inPhase / phaseLen) * 0.3 : phaseIndex === 1 ? 1 : phaseIndex === 2 ? 1 - (inPhase / phaseLen) * 0.3 : 0.7;

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-[#070a0e]/96 backdrop-blur-md">
      <div className="relative flex w-full max-w-md flex-col items-center px-6 text-center">
        <button type="button" onClick={onClose} className="absolute -top-10 right-0 rounded-lg p-1 text-dim hover:bg-white/10 hover:text-ink" aria-label="Fechar respiração">
          <X className="size-4" />
        </button>
        <p className="m-0 text-[10px] font-bold uppercase tracking-[0.24em] text-faint">pausa de um minuto</p>
        <div className="relative my-8 grid size-56 place-items-center">
          <span
            className="absolute size-56 rounded-full border border-sky/30 bg-sky/8"
            style={{ transform: `scale(${scale})`, transition: "transform 1s ease-in-out" }}
          />
          <span
            className="absolute size-40 rounded-full border border-sky/40 bg-sky/12"
            style={{ transform: `scale(${0.8 + scale * 0.2})`, transition: "transform 1s ease-in-out" }}
          />
          <div className="relative z-10">
            <p className="m-0 font-display text-xl font-semibold text-ink">{done ? "pronto" : phases[phaseIndex]}</p>
            <p className="m-0 mono text-[10px] text-dim">{Math.max(0, total - elapsed)}s</p>
          </div>
        </div>
        <p className="m-0 max-w-xs text-[11px] leading-relaxed text-dim">
          Quatro tempos de quatro segundos. Nenhuma notificação vai aparecer — o Parallax só muda a sua tela, não o seu sistema.
        </p>
        <div className="mt-5 flex gap-1.5">
          {done ? (
            <Btn
              variant="primary"
              onClick={() => {
                onDone(total);
                onClose();
              }}
            >
              concluir
            </Btn>
          ) : (
            <Btn variant="outline" onClick={onClose}>
              sair mais tarde
            </Btn>
          )}
        </div>
        <p className="m-0 mt-3 text-[9px] text-faint">a respiração não bloqueia o navegador — a camada é dismissível a qualquer momento</p>
      </div>
    </div>
  );
}
