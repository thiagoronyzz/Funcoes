import type { Citation, PageRef } from "@/core/types";

/* ────────────────────────────────────────────────────────────────────────────
   Formatação de citações — ABNT NBR 6023, APA 7 e BibTeX
   ──────────────────────────────────────────────────────────────────────────── */

const accessed = (c: Citation) =>
  new Date(c.accessed).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export function formatCitation(c: Citation, style: "abnt" | "apa" | "bibtex"): string {
  const year = c.year ?? new Date(c.accessed).getFullYear();
  if (style === "abnt") {
    const author = c.author ?? c.site;
    return `${author.toUpperCase()}. ${c.title}. ${c.site}, ${year}. Disponível em: ${c.url}. Acesso em: ${accessed(c)}.`;
  }
  if (style === "apa") {
    const author = c.author ?? c.site;
    return `${author} (${year}). ${c.title}. ${c.site}. ${c.url}`;
  }
  const key = (c.author ?? c.site).split(/[,;]/)[0].trim().split(/\s+/).slice(-1)[0].toLowerCase() + year;
  return `@misc{${key},
  author = {${c.author ?? c.site}},
  title  = {${c.title}},
  year   = {${year}},
  url    = {${c.url}},
  note   = {Acesso em ${accessed(c)}}
}`;
}

export function refToCitation(ref: PageRef, accessedAt = Date.now()): Citation {
  return {
    id: `ci:${ref.url}`,
    title: ref.title,
    url: ref.url,
    site: ref.site,
    author: ref.author,
    year: ref.year,
    accessed: accessedAt,
  };
}

/** Lista em ordem alfabética, como pede a ABNT. */
export function sortCitations(citations: Citation[]) {
  return [...citations].sort((a, b) => (a.author ?? a.site).localeCompare(b.author ?? b.site, "pt-BR"));
}

export function exportBibliography(citations: Citation[], style: "abnt" | "apa" | "bibtex") {
  const body = sortCitations(citations)
    .map((c) => formatCitation(c, style))
    .join(style === "bibtex" ? "\n\n" : "\n\n");
  return `%% Parallax — bibliografia gerada em ${new Date().toLocaleString("pt-BR")}\n%% ${citations.length} fonte(s) · estilo ${style.toUpperCase()}\n\n${body}\n`;
}
