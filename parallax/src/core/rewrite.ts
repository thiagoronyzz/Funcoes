import type { Level, RewriteNote, RewriteResult } from "@/core/types";

/* ────────────────────────────────────────────────────────────────────────────
   Motor de reescrita local (zero servidor)
   1. limpa o markup [[termo]] e preserva o glossário
   2. aplica a variação de nível pré-compilada (ground truth do "LLM")
   3. reescreve por heurística o que não tem variação
   4. mede complexidade antes/depois e registra cada mudança
   ──────────────────────────────────────────────────────────────────────────── */

export const LEVEL_META: Record<Level, { label: string; hint: string; factor: number }> = {
  iniciante: { label: "Iniciante", hint: "frases curtas, analogias, zero jargão", factor: 0.55 },
  intermediario: { label: "Intermediário", hint: "clareza sem perder precisão", factor: 0.8 },
  avancado: { label: "Avançado", hint: "termos técnicos preservados, densidade alta", factor: 1.05 },
};

/** Sinônimos: jargão → linguagem simples. Usado pelo modo iniciante. */
const PLAIN: { re: RegExp; to: string; why?: string }[] = [
  { re: /\butiliza(?:r|do|da|m)?\b/gi, to: "usa", why: "verbo rebuscado → comum" },
  { re: /\bpossibilita\b/gi, to: "permite", why: "palavra longa → curta" },
  { re: /\bentretanto\b/gi, to: "mas", why: "conector formal → cotidiano" },
  { re: /\bcontudo\b/gi, to: "mas", why: "conector formal → cotidiano" },
  { re: /\bporém\b/gi, to: "mas", why: "conector formal → cotidiano" },
  { re: /\btodavia\b/gi, to: "mas", why: "conector formal → cotidiano" },
  { re: /\bportanto\b/gi, to: "por isso", why: "conector formal → cotidiano" },
  { re: /\bassim sendo\b/gi, to: "por isso", why: "conector formal → cotidiano" },
  { re: /\bdesse modo\b/gi, to: "assim", why: "conector formal → cotidiano" },
  { re: /\bdesta forma\b/gi, to: "assim", why: "conector formal → cotidiano" },
  { re: /\bde forma previsível\b/gi, to: "como esperado", why: "locução abstrata → concreta" },
  { re: /\bsistematicamente\b/gi, to: "de propósito, passo a passo", why: "advérbio técnico → explicação" },
  { re: /\bparcialmente dissociáveis\b/gi, to: "que funcionam meio separados", why: "jargão neurocientífico" },
  { re: /\boperacionalizada?\b/gi, to: "medida", why: "jargão metodológico" },
  { re: /\bparadigmas?\b/gi, to: "testes", why: "jargão" },
  { re: /\bmodulad[ao]\b/gi, to: "influenciada", why: "jargão" },
  { re: /\bcorrelatos\b/gi, to: "relações", why: "jargão" },
  { re: /\bde forma discreta\b/gi, to: "aos poucos", why: "abstração → imagem" },
  { re: /\bpersistente\b/gi, to: "que não passa", why: "adjetivo técnico → frase" },
  { re: /\bprogressivo\b/gi, to: "que piora aos poucos", why: "adjetivo técnico → frase" },
  { re: /\bsilencioso\b/gi, to: "sem avisar", why: "metáfora → clareza" },
  { re: /\bjustifica\b/gi, to: "explica por que", why: "verbo formal → cotidiano" },
  { re: /\bsobretudo\b/gi, to: "principalmente", why: "advérbio formal" },
  { re: /\belevad[ao]\b/gi, to: "alta", why: "formal → direto" },
  { re: /\bconsidera-se\b/gi, to: "a gente considera", why: "voz passiva → ativa" },
  { re: /\bmensurável\b/gi, to: "que dá para medir", why: "adjetivo técnico" },
  { re: /\bconsequência medida\b/gi, to: "resultado observado", why: "nominalização" },
  { re: /\bnão corresponde a\b/gi, to: "não é", why: "rodeio verbal" },
  { re: /\bsustenta\b/gi, to: "segura", why: "metáfora → literal" },
  { re: /\brecruta(?:ria|m)?\b/gi, to: "usa", why: "jargão acadêmico" },
  { re: /\bsinaliza(?:do|m)?\b/gi, to: "indica", why: "jargão" },
  { re: /\bdesigna\b/gi, to: "chama", why: "formal → direto" },
  { re: /\bvigilância\b/gi, to: "monitoramento", why: "termo carregado → neutro" },
  { re: /\becológicas?\b/gi, to: "no dia a dia", why: "jargão" },
];

/** Troca de conectores e densidade para o nível avançado. */
const DENSE: { re: RegExp; to: string; why?: string }[] = [
  { re: /\bmas\b(?!\s+(?:também|tanto))/gi, to: "contudo", why: "conector elevado (nível avançado)" },
  { re: /\bpor isso\b/gi, to: "portanto", why: "conector elevado (nível avançado)" },
  { re: /\bmuito\b/gi, to: "substancialmente", why: "intensificador preciso" },
  { re: /\bimportante\b/gi, to: "determinante", why: "precisão lexical" },
  { re: /\bmostra\b/gi, to: "evidencia", why: "precisão lexical" },
  { re: /\bdá para\b/gi, to: "é possível", why: "impessoalidade" },
];

const STOP = new Set(
  "a o e de da do das dos em no na nos nas para por com sem que se um uma uns umas ao aos à às é são foi ser estar como mais menos muito pouco sobre entre até após antes quando onde qual quais seu sua seus suas este esta esse essa isso isto aquilo não sim já também só então porque pois the of and to in is".split(
    " "
  )
);

function wordsOf(text: string) {
  return text.split(/\s+/).filter(Boolean);
}

export function complexityOf(text: string) {
  const words = wordsOf(text);
  const sentences = Math.max(1, (text.match(/[.!?](\s|$)/g) ?? []).length);
  const longWords = words.filter((w) => w.replace(/\W/g, "").length >= 9).length;
  const syllables = words.reduce((acc, w) => acc + Math.max(1, (w.match(/[aeiouáéíóúâêôãõ]/gi) ?? []).length), 0);
  const fk = 0.39 * (words.length / sentences) + 11.8 * (syllables / Math.max(1, words.length)) - 15.59;
  return Math.round(Math.max(0, Math.min(100, (longWords / Math.max(1, words.length)) * 180 + fk * 2.2)));
}

/** Divide um parágrafo longo em frases curtas, sem gerar fragmentos nem duplicar trabalho. */
function shortenSentences(text: string, maxWords = 22): { text: string; splits: number } {
  const state = { out: [] as string[], splits: 0 };
  const sentences = text.match(/[^.!?]+[.!?]+["”’)]?|[^.!?]+$/g) ?? [text];

  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    if (wordCount(sentence) <= maxWords) {
      state.out.push(sentence);
      continue;
    }
    // agrupa cláusulas curtas para nunca criar fragmentos de 1–2 palavras
    const clauses = sentence.split(/(?<=[,;:])\s+/);
    const groups: string[] = [];
    let acc = "";
    for (const clause of clauses) {
      const candidate = acc ? `${acc} ${clause}` : clause;
      if (acc && wordCount(candidate) > maxWords) {
        groups.push(acc);
        acc = clause;
      } else {
        acc = candidate;
      }
    }
    if (acc) groups.push(acc);
    for (const group of groups) emitSentence(group, maxWords, state);
  }

  return {
    text: state.out
      .join(" ")
      .replace(/\s+([.,;:!?])/g, "$1")
      .replace(/\.{2,}/g, ".")
      .trim(),
    splits: state.splits,
  };
}

function wordCount(s: string) {
  return s.split(/\s+/).filter(Boolean).length;
}

const BREAK_WORDS = new Set(
  "que para sem quando porque pois mas e ou se como onde enquanto sobre entre após antes até nem porém contudo portanto assim então quando".split(" ")
);

/** escolhe o ponto de quebra mais próximo do meio que ainda produza duas frases com sentido */
function bestBreak(words: string[]): number | null {
  const mid = Math.floor(words.length / 2);
  let best: number | null = null;
  let bestDist = Infinity;
  for (let i = 4; i <= words.length - 4; i++) {
    const w = words[i].toLowerCase().replace(/[^\p{L}]/gu, "");
    if (!BREAK_WORDS.has(w)) continue;
    const dist = Math.abs(i - mid);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

function emitSentence(raw: string, maxWords: number, state: { out: string[]; splits: number }) {
  let s = raw.trim().replace(/[,;:]+$/, "");
  if (!s) return;
  if (wordCount(s) <= maxWords) {
    if (!/[.!?]$/.test(s)) s += ".";
    state.out.push(s);
    return;
  }
  const words = s.split(/\s+/);
  const at = bestBreak(words);
  // sem uma conjunção/preposição decente, é melhor manter a frase do que criar um fragmento
  if (at === null) {
    if (!/[.!?]$/.test(s)) s += ".";
    state.out.push(s);
    return;
  }
  state.splits += 1;
  emitSentence(words.slice(0, at).join(" "), maxWords, state);
  const tail = words.slice(at).join(" ");
  emitSentence(tail.charAt(0).toUpperCase() + tail.slice(1), maxWords, state);
}

/** Mantém maiúscula quando a substituição cai no início de uma frase. */
function replaceKeepingCase(out: string, rule: RegExp, to: string) {
  return out.replace(rule, (...args: unknown[]) => {
    const rest = args.slice(1) as unknown[];
    const offset = rest[rest.length - 2] as number;
    const before = out.slice(0, offset).trimEnd();
    const atStart = before === "" || /[.!?]$/.test(before);
    if (!atStart) return to;
    return to.charAt(0).toUpperCase() + to.slice(1);
  });
}

function plainify(text: string): { text: string; notes: RewriteNote[] } {
  let out = text;
  const notes: RewriteNote[] = [];
  for (const rule of PLAIN) {
    const matches = out.match(rule.re);
    if (!matches) continue;
    const example = matches[0];
    out = replaceKeepingCase(out, rule.re, rule.to);
    notes.push({ from: example, to: rule.to, why: rule.why ?? "simplificação" });
  }
  return { text: out, notes };
}

/** Caminho inverso: texto simples volta a ficar denso (usado no nível avançado). */
const UPGRADE: { re: RegExp; to: string; why?: string }[] = [
  { re: /\bexplica por que\b/gi, to: "justifica", why: "nominalização (nível avançado)" },
  { re: /\bque n[ãa]o passa\b/gi, to: "persistente", why: "adjetivo técnico (nível avançado)" },
  { re: /\bpodemos considerar\b/gi, to: "considera-se", why: "voz impessoal" },
  { re: /\bn[ãa]o é\b/gi, to: "não corresponde a", why: "registro formal" },
  { re: /\bque d[áa] para medir\b/gi, to: "mensurável", why: "adjetivo técnico" },
  { re: /\busam\b/gi, to: "utilizam", why: "registro formal" },
  { re: /\busa\b/gi, to: "utiliza", why: "registro formal" },
  { re: /\bpode\b/gi, to: "é capaz de", why: "registro formal" },
];

function densify(text: string): { text: string; notes: RewriteNote[] } {
  let out = text;
  const notes: RewriteNote[] = [];
  for (const rule of DENSE) {
    const matches = out.match(rule.re);
    if (!matches) continue;
    const example = matches[0];
    out = out.replace(rule.re, rule.to);
    notes.push({ from: example, to: rule.to, why: rule.why ?? "densidade" });
  }
  return { text: out, notes };
}

/** Resumo extrativo por frequência (usado no modo calma e nos cartões). */
export function extractKeySentences(text: string, n = 3): string[] {
  const clean = text.replace(/\[\[|\]\]/g, "");
  const sentences = clean
    .split(/(?<=[.!?])\s+/g)
    .map((s) => s.trim())
    .filter((s) => wordsOf(s).length > 5);
  if (sentences.length <= n) return sentences;
  const freq = new Map<string, number>();
  for (const w of wordsOf(clean.toLowerCase())) {
    const k = w.replace(/[^\p{L}\p{N}]/gu, "");
    if (k.length < 4 || STOP.has(k)) continue;
    freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  const scored = sentences.map((s, i) => {
    const ws = wordsOf(s.toLowerCase());
    const score = ws.reduce((a, w) => a + (freq.get(w.replace(/[^\p{L}\p{N}]/gu, "")) ?? 0), 0) / Math.sqrt(ws.length + 4);
    return { s, score: score + (i === 0 ? 4 : 0), i };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s);
}

export function keywordsOf(text: string, n = 8): string[] {
  const freq = new Map<string, number>();
  for (const raw of wordsOf(text.toLowerCase())) {
    const w = raw.replace(/[^\p{L}\p{N}-]/gu, "");
    if (w.length < 4 || STOP.has(w) || /^\d+$/.test(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

function plainifyWith(text: string, rules: { re: RegExp; to: string; why?: string }[]) {
  let out = text;
  const notes: RewriteNote[] = [];
  for (const rule of rules) {
    const matches = out.match(rule.re);
    if (!matches) continue;
    const example = matches[0];
    out = replaceKeepingCase(out, rule.re, rule.to);
    notes.push({ from: example, to: rule.to, why: rule.why ?? "densidade" });
  }
  return { text: out, notes };
}

/* ── API principal ─────────────────────────────────────────────────────────── */

export interface RewriteInput {
  text: string;
  level: Level;
  /** variation já pronta vinda do conteúdo (o "resultado do LLM") */
  variant?: string;
  /** intensidade 0..1 — quanto da reescrita aplicar */
  intensity?: number;
  /** modo calma reduz agressivamente */
  calm?: boolean;
}

export function rewriteBlock({ text, level, variant, intensity = 0.8, calm = false }: RewriteInput): RewriteResult {
  const t0 = performance.now();
  const before = complexityOf(text.replace(/\[\[|\]\]/g, ""));
  const notes: RewriteNote[] = [];
  const glossary: { term: string; definition: string }[] = [];

  // 1. extrai [[termo]] → glossário
  const termMatches = [...text.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1]);
  const clean = text.replace(/\[\[([^\]]+)\]\]/g, "$1");

  if (level === "iniciante") {
    for (const term of termMatches) {
      if (!glossary.some((g) => g.term === term)) {
        glossary.push({ term, definition: "__TOOLTIP__" });
        notes.push({ from: `[[${term}]]`, to: term, why: "termo técnico mantido com tooltip de glossário" });
      }
    }
  }

  // 2. variação de nível (ground truth do LLM) tem prioridade
  let out = variant && intensity > 0.35 ? variant : clean;
  if (variant && variant !== clean) {
    notes.push({
      from: clean.slice(0, 64) + (clean.length > 64 ? "…" : ""),
      to: variant.slice(0, 64) + (variant.length > 64 ? "…" : ""),
      why: `reescrita de nível ${level} (variação pré-compilada por LLM)`,
    });
  }

  // 3. heurística local
  if (level === "iniciante") {
    const plain = plainify(out);
    out = plain.text;
    notes.push(...plain.notes);
    const shortened = shortenSentences(out, 26);
    if (shortened.splits > 0) {
      out = shortened.text;
      notes.push({ from: "parágrafo longo", to: "frases curtas", why: `${shortened.splits} frase(s) dividida(s) em ≤ 26 palavras` });
    }
    if (calm) {
      out = out.replace(/!\s*/g, ". ").replace(/\s+/g, " ");
      notes.push({ from: "!", to: ".", why: "modo calma remove exclamações e urgência" });
    }
  } else if (level === "avancado") {
    // primeiro desfaz simplificações anteriores; só depois densifica
    const upgrade = plainifyWith(out, UPGRADE);
    out = upgrade.text;
    notes.push(...upgrade.notes);
    const dense = densify(out);
    out = dense.text;
    notes.push(...dense.notes);
  }

  const after = complexityOf(out);
  return {
    text: out.trim(),
    notes: notes.slice(0, 24),
    complexityBefore: before,
    complexityAfter: after,
    glossary,
    ms: Math.max(1, Math.round((performance.now() - t0) * 10) / 10),
    engine: variant ? "local-llm" : "local-heuristic",
  };
}

/** Resolve o glossário de um bloco usando o dicionário da página. */
export function buildTooltips(
  text: string,
  dictionary: { term: string; definition: string }[]
): { term: string; definition: string }[] {
  const found: { term: string; definition: string }[] = [];
  const lower = text.toLowerCase();
  for (const t of dictionary) {
    if (lower.includes(t.term.toLowerCase()) && !found.some((f) => f.term === t.term)) found.push(t);
  }
  return found.slice(0, 8);
}

/** Perguntas de quiz a partir das definições de termos da página. */
export function quizFromTerms(
  terms: { term: string; definition: string }[],
  pageTitle: string,
  others: string[] = []
): { prompt: string; options: string[]; answer: number; explanation: string; pageTitle: string }[] {
  const pool = terms.filter((t) => t.definition.length > 20);
  return pool.slice(0, 5).map((t) => {
    const distractors = pool.filter((x) => x.term !== t.term).map((x) => x.definition);
    const extra = others.filter((d) => d !== t.definition);
    const opts = [t.definition, ...distractors, ...extra].slice(0, 4);
    // embaralha de forma determinística pelo tamanho do termo
    const rot = t.term.length % opts.length;
    const options = [...opts.slice(rot), ...opts.slice(0, rot)];
    return {
      prompt: `O que significa “${t.term}” neste texto?`,
      options,
      answer: options.indexOf(t.definition),
      explanation: t.definition,
      pageTitle,
    };
  });
}
