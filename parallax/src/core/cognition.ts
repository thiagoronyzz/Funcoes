import type { CognitiveSample, CognitiveState, CognitionSnapshot, Level, ModeId, ParallaxState, SiteId } from "@/core/types";

/* ────────────────────────────────────────────────────────────────────────────
   Detector de estado cognitivo
   Sinais: troca de abas, ritmo de scroll, digitação, tempo na aba, hora do dia.
   Tudo local, sem eye-tracking — e com explicação do porquê (auditável).
   ──────────────────────────────────────────────────────────────────────────── */

export const COGNITIVE_META: Record<CognitiveState, { label: string; color: string; hint: string }> = {
  flow: { label: "Em flow", color: "#7ce0b1", hint: "Alta continuidade, ritmo estável — não interromper" },
  focado: { label: "Focado", color: "#7c9cff", hint: "Poucas trocas, leitura contínua" },
  disperso: { label: "Disperso", color: "#f0c987", hint: "Muitas trocas de aba e rolagem errática" },
  fatigado: { label: "Fatigado", color: "#f08f8f", hint: "Sessão longa, ritmo caindo, horário tardio" },
};

const WINDOW_MS = 3 * 60 * 1000;

export function pushSample(
  samples: CognitiveSample[],
  patch: Partial<Omit<CognitiveSample, "t">>
): CognitiveSample[] {
  const base: CognitiveSample = samples[samples.length - 1] ?? { t: Date.now(), focus: 0.6, load: 0.3, typing: 0, scroll: 0, switches: 0 };
  const next: CognitiveSample = { t: Date.now(), focus: base.focus, load: base.load, typing: 0, scroll: 0, switches: 0, ...patch };
  const kept = samples.filter((s) => Date.now() - s.t < WINDOW_MS);
  return [...kept, next].slice(-90);
}

export function registerSwitch(samples: CognitiveSample[], at = Date.now()): CognitiveSample[] {
  const last = samples[samples.length - 1];
  if (last && at - last.t < 1200) {
    // agrupa rajadas
    return [...samples.slice(0, -1), { ...last, switches: last.switches + 1, focus: Math.max(0.08, last.focus - 0.09), load: Math.min(1, last.load + 0.07) }];
  }
  return pushSample(samples, { switches: 1, focus: 0.34, load: 0.62 });
}

export function registerReading(samples: CognitiveSample[], scrollDelta: number): CognitiveSample[] {
  const load = Math.min(0.92, Math.max(0.12, Math.abs(scrollDelta) > 900 ? 0.68 : 0.24));
  return pushSample(samples, { scroll: Math.abs(scrollDelta), load, focus: scrollDelta === 0 ? 0.72 : 0.58 });
}

export function registerTyping(samples: CognitiveSample[], chars: number): CognitiveSample[] {
  return pushSample(samples, { typing: chars, focus: 0.86, load: 0.4 });
}

export function detectCognition(state: ParallaxState, now = Date.now()): CognitionSnapshot {
  const samples = state.cognition.samples;
  const recent = samples.filter((s) => now - s.t <= WINDOW_MS);
  const activeMs = Math.max(0, now - (state.tabs[0]?.createdAt ?? now));
  const minutesInSession = Math.round(activeMs / 60000);

  const switchesLastMinute =
    recent.length === 0 ? 0 : recent.reduce((a, s) => a + s.switches, 0) * (60_000 / WINDOW_MS);

  const reading = recent.filter((s) => (s.typing ?? 0) > 0).length;
  const scrollVariance = variance(recent.map((s) => s.scroll));

  const focus = clamp01(
    0.72 +
      reading * 0.06 -
      Math.min(0.5, switchesLastMinute * 0.045) -
      Math.min(0.25, scrollVariance / 5200) +
      (state.focusTask ? 0.08 : 0)
  );
  const load = clamp01(0.24 + Math.min(0.5, switchesLastMinute * 0.05) + Math.min(0.2, scrollVariance / 6800));

  const hour = new Date(now).getHours();
  const lateNight = hour >= 23 || hour < 5;
  const fatigue = clamp01(0.1 + (minutesInSession / 120) * 0.5 + (lateNight ? 0.24 : 0) + Math.min(0.2, switchesLastMinute * 0.03));

  let cognitive: CognitiveState = "focado";
  const reasons: string[] = [];

  if (state.focusTask && focus > 0.62) {
    cognitive = "flow";
    reasons.push("tarefa de foco ativa com ritmo contínuo");
  } else if (switchesLastMinute >= 6 && load > 0.55) {
    cognitive = "disperso";
    reasons.push(`${Math.round(switchesLastMinute)} trocas de aba no último minuto`);
  } else if (fatigue > 0.6 || (lateNight && minutesInSession > 25)) {
    cognitive = "fatigado";
    reasons.push(lateNight ? "horário tardio" : "sessão longa com ritmo em queda");
  } else if (focus > 0.6) {
    cognitive = "focado";
    reasons.push("leitura contínua e poucas trocas");
  } else {
    cognitive = "disperso";
    reasons.push("alternância moderada entre contextos");
  }

  if (load > 0.6) reasons.push("carga visual alta (rolagem e estímulos)");
  if (scrollVariance > 1800) reasons.push("padrão de rolagem errático");

  const confidence = Math.min(0.96, 0.48 + recent.length * 0.03);

  return {
    state: cognitive,
    focus: round2(focus),
    load: round2(load),
    fatigue: round2(fatigue),
    confidence: round2(confidence),
    samples: samples.slice(-60),
    reasons: reasons.slice(0, 4),
    switchesLastMinute: Math.round(switchesLastMinute),
    minutesInSession,
    lateNight,
  };
}

function variance(xs: number[]) {
  if (xs.length < 2) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

/* ── recomendação de modo ──────────────────────────────────────────────────── */

export function recommendMode(cognition: CognitionSnapshot, mode: ModeId): { mode: ModeId; why: string } | null {
  if (cognition.state === "fatigado" && mode !== "calma") {
    return {
      mode: "calma",
      why: `Sessão de ${Math.round(cognition.minutesInSession)} min com ${Math.round(
        cognition.fatigue * 100
      )}% de sinal de fadiga${cognition.lateNight ? " e horário tardio" : ""}. O modo calma reduz estímulo sem bloquear nada.`,
    };
  }
  if (cognition.state === "disperso" && mode !== "foco" && mode !== "calma" && cognition.switchesLastMinute >= 5) {
    return {
      mode: "foco",
      why: `${cognition.switchesLastMinute} trocas de aba por minuto: o modo foco suaviza o que não é essencial à tarefa.`,
    };
  }
  return null;
}

/* ── intenção ──────────────────────────────────────────────────────────────── */

const INTENT_RULES: { re: RegExp; kind: "aprender" | "pesquisar" | "comprar" | "focar" | "descansar"; mode: ModeId; topic?: string }[] = [
  { re: /\b(estud\w*|aprender|aula|curso|prova|concurso|entender)\b/i, kind: "aprender", mode: "aprendizado" },
  { re: /\b(pesquis\w*|tcc|monografia|artigo|paper|relat[oó]rio|refer[eê]ncia|fonte)\b/i, kind: "pesquisar", mode: "pesquisa" },
  { re: /\b(comprar|compra|pre[çc]o|barat\w*|or[çc]amento|monitor|notebook|fone|celular)\b/i, kind: "comprar", mode: "compra" },
  { re: /\b(foco|focar|terminar|entregar|prazo|trabalhar|programar|c[oó]digo)\b/i, kind: "focar", mode: "foco" },
  { re: /\b(descans\w*|calma|ansiedade|respir\w*|pausa)\b/i, kind: "descansar", mode: "calma" },
];

export function parseIntent(raw: string): {
  kind: "aprender" | "pesquisar" | "comprar" | "focar" | "descansar" | "explorar";
  mode: ModeId;
  topic: string;
  keywords: string[];
  budget?: number;
  confidence: number;
  reasons: string[];
} {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const reasons: string[] = [];
  const hit = INTENT_RULES.find((r) => r.re.test(lower));
  const kind = hit?.kind ?? "explorar";
  const mode: ModeId = hit?.mode ?? "aprendizado";
  if (hit) reasons.push(`verbo de intenção detectado: /${hit.re.source.replace(/\\b/g, "")}/`);

  const budgetMatch = lower.match(/r\$\s?([\d.]+)(?:,(\d{2}))?/) ?? lower.match(/([\d.]+)\s?reais/);
  let budget: number | undefined;
  if (budgetMatch) {
    budget = Number(budgetMatch[1].replace(/\./g, "")) + (budgetMatch[2] ? Number(budgetMatch[2]) / 100 : 0);
    reasons.push(`orçamento explícito: R$ ${budget.toLocaleString("pt-BR")}`);
  }

  const afterDash = text.split(/[—–\-:]/).slice(1).join(" ").trim();
  const topicCandidate = (afterDash || text)
    .replace(/^(quero|estou|preciso|vou|fa[çc]a|me ajude a)\s+/i, "")
    .replace(/\b(estudando|pesquisando|comprando|para|sobre|um|uma|o|a|de)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const topic = (topicCandidate || text).slice(0, 70);

  const keywords = [...new Set(text.toLowerCase().replace(/[^\p{L}\s]/gu, " ").split(/\s+/))]
    .filter((w) => w.length > 3)
    .slice(0, 8);

  const confidence = Math.min(0.97, (hit ? 0.62 : 0.4) + (budget ? 0.14 : 0) + Math.min(0.2, keywords.length * 0.025));

  return { kind, mode, topic, keywords, budget, confidence, reasons };
}

export function intentFromHistory(state: ParallaxState): { topic: string; mode: ModeId; level: Level; why: string[] } {
  const recent = state.history.slice(0, 12);
  const counts: Partial<Record<SiteId, number>> = {};
  for (const h of recent) counts[h.siteId] = (counts[h.siteId] ?? 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const words = recent
    .flatMap((h) => h.title.toLowerCase().replace(/[^\p{L}\s]/gu, " ").split(/\s+/))
    .filter((w) => w.length > 4);
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  const topic = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([w]) => w).join(" ") || "navegação";

  const siteMode: Partial<Record<SiteId, ModeId>> = { shop: "compra", devto: "aprendizado", wiki: "pesquisa", health: "pesquisa", news: "pesquisa", yt: "aprendizado" };
  const mode = top ? siteMode[top[0] as SiteId] ?? "aprendizado" : "aprendizado";
  const why = [
    top ? `${top[1]} de ${recent.length} páginas recentes são de ${top[0]}` : "histórico insuficiente",
    `termos recorrentes: ${topic}`,
    "nível mantido do perfil",
  ];
  return { topic, mode, level: state.level, why };
}
