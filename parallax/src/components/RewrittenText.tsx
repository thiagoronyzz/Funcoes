import { Info } from "lucide-react";
import { useMemo, useState } from "react";
import { complexityOf, rewriteBlock } from "@/core/rewrite";
import type { Level, ModeId, Page } from "@/core/types";
import { Tooltip } from "@/components/ui";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
   Renderiza um parágrafo passando pelo motor de reescrita.
   Os [[termos]] viram chips com tooltip; em nível iniciante todos os termos
   conhecidos ganham explicação. O "por quê" de cada mudança fica auditável.
   ──────────────────────────────────────────────────────────────────────────── */

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function RewrittenText({
  page,
  text,
  variant,
  level,
  mode,
  intensity,
  enabled,
  className,
  as = "p",
}: {
  page: Page;
  text: string;
  variant?: string;
  level: Level;
  mode: ModeId;
  intensity: number;
  enabled: boolean;
  className?: string;
  as?: "p" | "span" | "div";
}) {
  const [showWhy, setShowWhy] = useState(false);

  const result = useMemo(() => {
    if (!enabled) return null;
    return rewriteBlock({ text, level, variant, intensity, calm: mode === "calma" });
  }, [text, level, variant, intensity, enabled, mode]);

  const display = result?.text ?? text.replace(/\[\[([^\]]+)\]\]/g, "$1");

  const nodes = useMemo(() => {
    const terms = page.terms
      .filter((t) => display.toLowerCase().includes(t.term.toLowerCase()))
      .sort((a, b) => b.term.length - a.term.length)
      .slice(0, 12);
    if (terms.length === 0 || mode === "foco" || mode === "calma") return [display];
    const re = new RegExp(`(${terms.map((t) => escapeRe(t.term)).join("|")})`, "gi");
    const parts = display.split(re);
    return parts.map((part, i) => {
      const term = terms.find((t) => t.term.toLowerCase() === part.toLowerCase());
      if (!term) return part;
      return (
        <Tooltip
          key={`${term.term}-${i}`}
          label={
            <span>
              <span className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-gold">
                <Info className="size-2.5" /> glossário local
              </span>
              <strong className="block text-ink">{term.term}</strong>
              {term.definition}
            </span>
          }
        >
          <button type="button" className="term-chip">
            {part}
          </button>
        </Tooltip>
      );
    });
  }, [display, page.terms, mode]);

  const Tag = as;
  const before = result?.complexityBefore ?? complexityOf(text);
  const after = result?.complexityAfter ?? before;
  const delta = before - after;

  return (
    <div className="group/rw relative">
      <Tag className={cn(className)}>{nodes}</Tag>
      {result && (
        <div className="mt-1 flex flex-wrap items-center gap-2 opacity-0 transition-opacity group-hover/rw:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={() => setShowWhy((v) => !v)}
            className="inline-flex items-center gap-1 rounded border border-[#d8d2c4] bg-[#f4f1e9] px-1.5 py-0.5 text-[9.5px] font-medium text-[#6a6659] hover:border-[#b9b2a2]"
          >
            <Info className="size-2.5" />
            por que mudou ({result.notes.length})
          </button>
          <span className="text-[9.5px] text-[#8d887a]">
            densidade {before}→{after}
            {delta > 0 ? ` (−${delta})` : ""} · {result.ms} ms · {result.engine === "local-llm" ? "variação pré-compilada" : "heurística local"}
          </span>
        </div>
      )}
      {showWhy && result && (
        <div className="mt-1.5 space-y-1 rounded-lg border border-[#ded8ca] bg-[#f6f3ec] p-2 text-[10px] leading-relaxed text-[#5c5748]">
          {result.notes.length === 0 && <p className="m-0">Nenhuma alteração: o texto já estava no nível pedido.</p>}
          {result.notes.map((n, i) => (
            <div key={i} className="flex flex-wrap items-baseline gap-1">
              <span className="diff-del">{n.from}</span>
              <span className="text-[#a09a88]">→</span>
              <span className="diff-add">{n.to}</span>
              <span className="text-[#8d887a]">— {n.why}</span>
            </div>
          ))}
          {result.glossary.length > 0 && (
            <p className="m-0 border-t border-[#e3ddcf] pt-1 text-[#8d887a]">
              {result.glossary.length} termo(s) com definição sob demanda (passe o mouse nos pontilhados).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
