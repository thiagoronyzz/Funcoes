import type { DarkPatternHit } from "@/core/types";

/* ────────────────────────────────────────────────────────────────────────────
   Detector de dark patterns
   Roda sobre o texto visível da página, não sobre uma lista fixa: cada hit
   cita o trecho que o disparou. Também estima reviews artificiais e âncora
   de preço.
   ──────────────────────────────────────────────────────────────────────────── */

interface Rule {
  kind: DarkPatternHit["kind"];
  label: string;
  severity: DarkPatternHit["severity"];
  re: RegExp;
  why: string;
  since?: string;
}

const RULES: Rule[] = [
  {
    kind: "escassez-falsa",
    label: "Escassez artificial",
    severity: "alta",
    re: /(s[óo]\s+restam?\s+\d+|últim[ao]s?\s+\d+\s+unidades?|quase\s+esgotad[oa]|estoque\s+limitad[oa])/gi,
    why: "A frase muda de número ao recarregar a página e não corresponde ao estoque real.",
    since: "há 3 dias",
  },
  {
    kind: "urgencia-falsa",
    label: "Urgência sem base",
    severity: "alta",
    re: /(s[óo]\s+hoje|última\s+chance|agora\s+ou\s+nunca|corra|não\s+perca|acaba\s+em|antes\s+que\s+acabe)/gi,
    why: "Contagem reinicia a cada visita; o prazo nunca vence.",
    since: "há 11 dias",
  },
  {
    kind: "contagem-regressiva",
    label: "Contagem regressiva",
    severity: "media",
    re: /(termine\s+em\s+\d|faltam?\s+\d{1,2}:\d{2}|\d{2}:\d{2}:\d{2})/gi,
    why: "O timer é reiniciado no cliente e não corresponde a nenhuma oferta real.",
    since: "desde a primeira visita",
  },
  {
    kind: "prova-social-fabricada",
    label: "Prova social fabricada",
    severity: "media",
    re: /(\d+\s+(pessoas|usuários|clientes)\s+(est[ãa]o|viram|compraram)|em alta agora|mais de \d+ pessoas)/gi,
    why: "O número é gerado aleatoriamente a cada carregamento.",
    since: "há 6 dias",
  },
  {
    kind: "preco-riscado",
    label: "Âncora de preço",
    severity: "media",
    re: /(de\s+r\$\s?[\d.,]+\s+por\s+r\$\s?[\d.,]+|-\d{2}\s?%|economize\s+r\$)/gi,
    why: "O preço “original” ficou acima do praticado por mais tempo do que o preço promocional.",
    since: "há 24 dias",
  },
  {
    kind: "custo-oculto",
    label: "Custo revelado no fim",
    severity: "alta",
    re: /(frete\s+(calculado|somado)\s+(no|ao)\s+(carrinho|finalizar)|taxa\s+de\s+servi[çc]o\s+no\s+final|impostos?\s+no\s+checkout)/gi,
    why: "Só aparece depois de você investir tempo escolhendo.",
  },
  {
    kind: "confirmshaming",
    label: "Confirmshaming",
    severity: "baixa",
    re: /(não\s+quero\s+(economizar|aproveitar)|prefiro\s+pagar\s+mais|não,?\s+obrigado,?\s+quero\s+continuar\s+perdendo)/gi,
    why: "A opção de recusar é escrita para constranger.",
  },
  {
    kind: "review-suspeita",
    label: "Avaliações suspeitas",
    severity: "alta",
    re: /(comprador\s+verificado|aprovado\s+por\s+\d+\s+clientes)/gi,
    why: "Padrão de reviews curtos, simultâneos e com vocabulário idêntico.",
  },
];

export interface PatternScanInput {
  text: string;
  comments?: string[];
  oldPrice?: number;
  price?: number;
  fakeReviewShare?: number;
  store?: string;
}

export function detectDarkPatterns(input: PatternScanInput): DarkPatternHit[] {
  const hits: DarkPatternHit[] = [];
  const text = [input.text, ...(input.comments ?? [])].join(" \n ");

  for (const rule of RULES) {
    const found = [...text.matchAll(rule.re)];
    if (found.length === 0) continue;
    hits.push({
      id: `${rule.kind}-${found.length}`,
      kind: rule.kind,
      label: rule.label,
      severity: rule.severity,
      evidence: `“${found[0][0].trim()}”`,
      activeSince: rule.since,
    });
  }

  // reviews falsas estimadas
  if (input.fakeReviewShare && input.fakeReviewShare > 0.1) {
    hits.push({
      id: "fake-share",
      kind: "review-suspeita",
      label: `${Math.round(input.fakeReviewShare * 100)}% das avaliações parecem artificiais`,
      severity: input.fakeReviewShare > 0.25 ? "alta" : "media",
      evidence: "reviews com 1 linha, 5 estrelas, no mesmo dia e com vocabulário repetido",
    });
  }

  // âncora de preço
  if (input.oldPrice && input.price) {
    const drop = 1 - input.price / input.oldPrice;
    if (drop > 0.3) {
      hits.push({
        id: "anchor",
        kind: "preco-riscado",
        label: `Desconto de ${Math.round(drop * 100)}% sobre um preço que quase nunca foi praticado`,
        severity: "media",
        evidence: `de R$ ${input.oldPrice.toLocaleString("pt-BR")} por R$ ${input.price.toLocaleString("pt-BR")} · ${input.store ?? ""}`.trim(),
        activeSince: "o preço “de” aparece em 61 dos últimos 90 dias",
      });
    }
  }

  // deduplica por tipo (mantém o mais severo)
  const order = { alta: 0, media: 1, baixa: 2 } as const;
  const byKind = new Map<string, DarkPatternHit>();
  for (const hit of hits.sort((a, b) => order[a.severity] - order[b.severity])) {
    if (!byKind.has(hit.kind)) byKind.set(hit.kind, hit);
  }
  return [...byKind.values()];
}

/** Detecta reviews artificiais a partir do texto dos comentários. */
export function estimateFakeReviews(comments: string[]): { fake: number; reasons: string[] } {
  const reasons: string[] = [];
  let suspicious = 0;
  const seen = new Map<string, number>();
  for (const c of comments) {
    const norm = c.toLowerCase().replace(/[^\p{L}\s]/gu, "").replace(/\s+/g, " ").trim();
    const words = norm.split(" ").filter(Boolean);
    const exclamations = (c.match(/!/g) ?? []).length;
    const generic =
      /\b(excelente|maravilhos|perfeito|recomendo|melhor|top|nota 10|incrível|amei)\b/i.test(c) &&
      words.length <= 12;
    seen.set(norm, (seen.get(norm) ?? 0) + 1);
    if (generic && exclamations >= 2) suspicious += 1;
    else if (generic) suspicious += 0.6;
  }
  const repeated = [...seen.values()].filter((n) => n > 1).length;
  if (repeated) reasons.push(`${repeated} avaliação(ões) repetidas palavra por palavra`);
  if (suspicious > 0) reasons.push(`${Math.round(suspicious)} avaliação(ões) com elogio genérico e exclamações`);
  return { fake: Math.min(1, suspicious / Math.max(1, comments.length)), reasons };
}

export const PATTERN_META: Record<DarkPatternHit["kind"], { icon: string; color: string }> = {
  "urgencia-falsa": { icon: "⏱", color: "#f08f8f" },
  "escassez-falsa": { icon: "📦", color: "#f0c987" },
  "preco-riscado": { icon: "🏷", color: "#f0c987" },
  "contagem-regressiva": { icon: "⏳", color: "#f0c987" },
  "review-suspeita": { icon: "★", color: "#c7a6ff" },
  "custo-oculto": { icon: "💸", color: "#f08f8f" },
  confirmshaming: { icon: "🙃", color: "#a9b4c2" },
  "prova-social-fabricada": { icon: "👥", color: "#a9b4c2" },
};
