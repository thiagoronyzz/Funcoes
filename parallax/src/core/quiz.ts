import { pageById, pagePlainText, ALL_PAGES } from "@/data/sites";
import { quizFromTerms, extractKeySentences } from "@/core/rewrite";

/* ────────────────────────────────────────────────────────────────────────────
   Gerador de quiz
   Duas fontes de pergunta: definições de termos (glossário da página) e
   frases-chave com números. Sem LLM: extrativo e determinístico.
   ──────────────────────────────────────────────────────────────────────────── */

export interface Quiz {
  pageTitle: string;
  questions: { id: string; prompt: string; options: string[]; answer: number; explanation: string; pageTitle: string }[];
}

export function produceQuiz(pageId: string): Quiz {
  const page = pageById(pageId);
  if (!page) return { pageTitle: "—", questions: [] };

  const others = ALL_PAGES.filter((p) => p.id !== pageId).flatMap((p) => p.terms.map((t) => t.definition));
  const fromTerms = quizFromTerms(page.terms, page.title, others).map((q, i) => ({
    ...q,
    id: `q-${i}`,
    options: q.options.map((o) => truncate(o, 118)),
  }));

  const key = extractKeySentences(pagePlainText(page), 4).filter((s) => /\d/.test(s));
  const fromSentences = key.slice(0, Math.max(0, 5 - fromTerms.length)).map((sentence, i) => {
    const numbers = sentence.match(/\d+(?:[.,]\d+)?/g) ?? [];
    const target = numbers[0] ?? "—";
    const options = [target, ...pickDistractors(target, sentence)].sort();
    return {
      id: `qs-${i}`,
      prompt: `Complete com o dado correto do texto: “${truncate(sentence.replace(target, "____"), 150)}”`,
      options: options.map((o) => o),
      answer: options.indexOf(target),
      explanation: sentence,
      pageTitle: page.title,
    };
  });

  const questions = [...fromTerms, ...fromSentences].slice(0, 5);
  return { pageTitle: page.title, questions };
}

function pickDistractors(target: string, context: string): string[] {
  const base = Number(target.replace(",", "."));
  const numeric = Number.isFinite(base) && base > 0;
  const candidates = numeric
    ? [base * 2, base / 2, base + Math.max(1, Math.round(base * 0.35)), base - Math.max(1, Math.round(base * 0.25))]
    : ["23 minutos", "4 itens", "40%", "12 meses"];
  const fmt = (n: number) => (Number.isInteger(base) ? String(Math.max(1, Math.round(n))) : n.toFixed(1).replace(".", ","));
  const uniq = [...new Set(candidates.map((c) => (typeof c === "number" ? fmt(c) : c)))].filter((c) => c !== target);
  while (uniq.length < 3) uniq.push(`${uniq.length + 2} min`);
  void context;
  return uniq.slice(0, 3);
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
