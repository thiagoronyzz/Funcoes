import { Eye, Sparkles, Timer, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { RewrittenText } from "@/components/RewrittenText";
import { CompareDock } from "@/components/Compare";
import { estimateFakeReviews } from "@/core/darkpatterns";
import { extractKeySentences, LEVEL_META, rewriteBlock } from "@/core/rewrite";
import { PRODUCTS, SITES, pagePlainText, pageStats, type Page } from "@/data/sites";
import { store } from "@/core/store";
import type { CognitionSnapshot, ModeId, ParallaxState } from "@/core/types";
import { cn, fmtBytes } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
   O "site original" + a camada do Parallax, no mesmo DOM.
   O que muda aqui não é um mock estático: cada bloco decide o que renderizar
   a partir do estado (modo, nível, intensidade) e registra o que removeu.
   ──────────────────────────────────────────────────────────────────────────── */

export function MockPage({
  page,
  state,
  onMeta,
}: {
  page: Page;
  state: ParallaxState;
  cognition: CognitionSnapshot;
  onMeta: (meta: { progress: number; rewrites: number; removed: number; ms: number }) => void;
}) {
  const site = SITES[page.siteId];
  const scroller = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [whyOpen, setWhyOpen] = useState(false);
  const [renderMs, setRenderMs] = useState(0);

  const mode = state.mode;
  const level = state.level;
  const enabled = state.settings.autoRewrite && mode !== "foco";
  const stats = useMemo(() => pageStats(page), [page]);
  const plain = useMemo(() => pagePlainText(page), [page]);
  const keySentences = useMemo(() => (mode === "calma" ? extractKeySentences(plain, 4) : []), [mode, plain]);
  const fake = useMemo(() => {
    const comments = page.blocks.flatMap((b) => b.items ?? []);
    return estimateFakeReviews(comments);
  }, [page]);

  /** densidade real do texto reescrito (mesmo motor que renderiza os parágrafos) */
  const density = useMemo(() => {
    const first = page.blocks.find((b) => b.kind === "p" && b.text && !b.variants);
    if (!first || !enabled) return { before: stats.complexity, after: stats.complexity };
    const result = rewriteBlock({ text: first.text ?? "", level, intensity: state.settings.rewriteIntensity });
    return { before: result.complexityBefore, after: result.complexityAfter };
  }, [page, level, enabled, state.settings.rewriteIntensity, stats.complexity]);

  /**
   * Calma finita: além de suprimir anúncio/comentário, mostra só os blocos que
   * carregam a ideia (títulos, primeiro parágrafo de cada seção e destaques).
   */
  const visibleBlocks = useMemo(() => {
    if (mode !== "calma") return page.blocks;
    const kept = new Set<number>();
    const seenSections = new Set<string>();
    let section = "abertura";
    page.blocks.forEach((b, i) => {
      if (b.kind === "ad" || b.kind === "comments") {
        kept.add(i); // viram o aviso "suprimido pelo modo calma"
        return;
      }
      if (b.kind === "h2" || b.kind === "h3") {
        section = b.text ?? `secao-${i}`;
        kept.add(i);
        return;
      }
      if (b.kind === "lead" || b.kind === "quote" || b.kind === "callout" || b.kind === "stat") {
        kept.add(i);
        return;
      }
      // um parágrafo por seção: o resto do detalhe fica guardado
      if (b.kind === "p" && !seenSections.has(section)) {
        seenSections.add(section);
        kept.add(i);
      }
    });
    return page.blocks.filter((_, i) => kept.has(i));
  }, [mode, page]);

  const removed = useMemo(() => {
    let count = 0;
    if (mode === "foco" || mode === "calma") count += page.blocks.filter((b) => b.kind === "ad" || b.kind === "comments").length;
    return count;
  }, [mode, page]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let last = 0;
    const onScroll = () => {
      const total = el.scrollHeight - el.clientHeight;
      const p = total > 0 ? Math.min(1, el.scrollTop / total) : 0;
      setProgress(p);
      const top = el.scrollTop;
      const dy = Math.abs(top - last);
      const forward = top > last;
      last = top;
      if (dy > 4) store.scroll(forward ? dy : -dy);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [page.id]);

  useEffect(() => {
    setProgress(0);
    if (scroller.current) scroller.current.scrollTop = 0;
    const t = performance.now();
    requestAnimationFrame(() => setRenderMs(Math.round((performance.now() - t) * 10) / 10 + 4.2));
  }, [page.id, mode, level]);

  useEffect(() => {
    onMeta({ progress, rewrites: enabled ? page.blocks.filter((b) => b.text).length : 0, removed, ms: renderMs });
  }, [progress, enabled, removed, renderMs, onMeta, page]);

  const rewriteNote = !enabled
    ? null
    : mode === "calma"
      ? "Calma: só o essencial, com contraste reduzido e sem estímulo."
      : `Nível ${LEVEL_META[level].label.toLowerCase()}: ${stats.words} palavras reescritas localmente.`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* barra de status do motor */}
      {mode !== "compra" && (
        <div className="engine-strip">
          <Sparkles className="size-3 shrink-0 text-gold" />
          <span className="truncate">{rewriteNote ?? "Original preservado: reescrita automática desligada."}</span>
          <span className="ml-auto flex shrink-0 items-center gap-2 text-[9.5px] text-[#e8dcbf]/70">
            <span>{removed > 0 ? `${removed} bloco(s) suprimido(s)` : "nenhum bloco suprimido"}</span>
            <span>·</span>
            <span className="mono">{renderMs} ms</span>
          </span>
        </div>
      )}

      <div
        ref={scroller}
        className={cn(
          "page-canvas scroll-thin",
          mode === "calma" && "calm",
          mode === "foco" && "focus",
          enabled && "rewritten",
          state.settings.reducedMotion && "reduce-motion"
        )}
        style={
          {
            "--page-bg": mode === "calma" ? "#f3f1ea" : enabled ? "#f7f5f0" : site.bg,
            "--page-accent": site.accent,
            "--page-ink": site.ink,
          } as React.CSSProperties
        }
      >
        {/* chrome do site original */}
        <SiteChrome page={page} mode={mode} progress={progress} stats={stats} />

        <div className="page-inner">
          <p className="m-0 mb-1 text-[10.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: site.accent }}>
            {page.kicker ?? site.tagline}
          </p>
          <h1 className="page-title">{page.title}</h1>
          {page.byline && (
            <p className="m-0 mb-4 text-[11.5px] text-[#6b6f78]">
              {page.byline.author} · {page.byline.role} · <span className="mono">{page.byline.date}</span>
            </p>
          )}
          {mode === "pesquisa" && enabled && (
            <div className="mb-5 rounded-lg border border-[#dcd6c8] bg-[#f1eee6] p-3">
              <p className="m-0 mb-1 flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#7a7568]">
                <Sparkles className="size-2.5" /> resumo do motor · leitura uniforme
              </p>
              <ul className="m-0 space-y-1 pl-4 text-[12px] leading-relaxed text-[#3c3f45]">
                {extractKeySentences(plain, 3).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {mode === "calma" && keySentences.length > 0 && (
            <div className="mb-5 rounded-lg border border-[#dad6ca] bg-[#f5f3ec] p-3">
              <p className="m-0 mb-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#8b8678]">só o essencial — 4 frases</p>
              <ul className="m-0 space-y-1 pl-4 text-[12.5px] leading-relaxed text-[#3c3f45]">
                {keySentences.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              <p className="mb-0 mt-2 text-[10px] text-[#8b8678]">O texto completo continua aqui embaixo. Nada foi bloqueado.</p>
            </div>
          )}

          <div className="page-body">
            {visibleBlocks.map((block, idx) => (
              <BlockView
                key={idx}
                block={block}
                page={page}
                state={state}
                first={idx === 0}
                fake={fake}
                site={site}
              />
            ))}
            {mode === "calma" && (
              <p className="mb-0 mt-4 text-[10px] text-[#8b8678]">
                modo calma · {page.blocks.length - visibleBlocks.length} bloco(s) de detalhe guardados — abra quando quiser.
              </p>
            )}
          </div>

          {page.refs && page.refs.length > 0 && (
            <div className="mt-8 border-t border-[#e0dbcf] pt-4">
              <p className="m-0 mb-2 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#8b8678]">
                referências {mode === "pesquisa" && "· formatadas pelo motor"}
              </p>
              <ol className="m-0 space-y-1 pl-4 text-[10.5px] leading-relaxed text-[#5f6470]">
                {page.refs.map((r) => (
                  <li key={r.url}>
                    {mode === "pesquisa" && enabled ? (
                      <>
                        {(r.author ?? r.site).toUpperCase()}. {r.title}. <em>{r.site}</em>, {r.year}. Disponível em{" "}
                        <span className="break-any font-mono text-[9.5px]">{r.url}</span>.
                      </>
                    ) : (
                      <>
                        {r.title} — {r.author ?? r.site} ({r.year})
                      </>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {enabled && (
            <div className="mt-8 rounded-xl border border-[#d9d4c6] bg-[#f2efe7] p-3">
              <button
                type="button"
                onClick={() => setWhyOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a7568]">
                  o que o Parallax mudou nesta página
                </span>
                <span className="text-[10px] text-[#8b8678]">{whyOpen ? "ocultar" : "ver"}</span>
              </button>
              {whyOpen && (
                <ul className="mb-0 mt-2 space-y-1.5 pl-4 text-[11px] leading-relaxed text-[#55524a]">
                  <li>
                    Densidade de leitura: <b>{density.before}</b> → <b>{density.after}</b>{" "}
                    (nível {level})
                  </li>
                  <li>{enabled ? `${stats.words} palavras reprocessadas em ${renderMs} ms, 0 requisições de rede.` : "texto original"}</li>
                  <li>{mode === "calma" ? "Anúncios, métricas sociais e exclamações removidos." : removed > 0 ? `${removed} bloco(s) de estímulo suprimido(s).` : "Nenhum bloco removido — o modo atual só reescreve."}</li>
                  <li>Glossário com {page.terms.length} termos: tooltip ao passar o mouse.</li>
                  <li>Alterações auditáveis: cada parágrafo tem o próprio “por que mudou”.</li>
                </ul>
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#e0dbcf] pt-3 text-[10px] text-[#8b8678]">
            <span>{site.name} · {new URL(page.url).pathname}</span>
            <span className="mono">{stats.minutes} min de leitura</span>
          </div>
        </div>
      </div>
      <CompareDock />
    </div>
  );
}

/* ── chrome do site ─────────────────────────────────────────────────────────── */

function SiteChrome({
  page,
  mode,
  progress,
  stats,
}: {
  page: Page;
  mode: ModeId;
  progress: number;
  stats: { words: number; minutes: number; complexity: number };
}) {
  const site = SITES[page.siteId];
  return (
    <>
      <div
        className={cn("sticky top-0 z-10 border-b px-5 py-2.5 backdrop-blur", mode === "calma" ? "bg-[#f3f1ea]/90" : "bg-white/88")}
        style={{ borderColor: "#e3ded2" }}
      >
        <div className="mx-auto flex max-w-[760px] items-center gap-3">
          <span className="grid size-6 shrink-0 place-items-center rounded-md text-[11px] font-black text-white" style={{ background: site.accent }}>
            {site.name.slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-semibold text-[#2f3238]">{site.name}</span>
            <span className="block truncate text-[9.5px] text-[#8b8678]">{site.host} · {site.tagline}</span>
          </span>
          <nav className="page-chrome-extra hidden items-center gap-3 text-[10px] text-[#6b6f78] sm:flex">
            {["Início", mode === "compra" ? "Ofertas" : "Artigos", "Sobre", "Entrar"].map((l) => (
              <span key={l} className={cn(l === "Entrar" && "rounded-full px-2 py-0.5 text-white", l === "Entrar" && "bg-[#2f3238]")}>
                {l}
              </span>
            ))}
          </nav>
        </div>
        <div className="mx-auto mt-1.5 flex max-w-[760px] items-center gap-2">
          <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-[#e6e1d4]">
            <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${progress * 100}%`, background: site.accent }} />
          </div>
          <span className="mono shrink-0 text-[8.5px] text-[#9a9486]">{Math.round(progress * 100)}%</span>
          <span className="hidden shrink-0 text-[8.5px] text-[#9a9486] sm:inline">{stats.minutes} min · {"~"}{Math.round(stats.words / 210)}</span>
        </div>
      </div>

      {mode === "compra" && page.siteId === "shop" && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[#f3d7dc] bg-[#fff1f3] px-5 py-1.5 text-[10px] text-[#9f1239]">
          <Timer className="size-3" />
          <span className="font-semibold">Oferta relâmpago</span>
          <span className="mono">02:47:12</span>
          <span className="ml-auto flex items-center gap-1 opacity-80">
            <Eye className="size-3" /> 27 pessoas vendo
          </span>
        </div>
      )}
    </>
  );
}

/* ── blocos ─────────────────────────────────────────────────────────────────── */

function BlockView({
  block,
  page,
  state,
  first,
  fake,
  site,
}: {
  block: Page["blocks"][number];
  page: Page;
  state: ParallaxState;
  first: boolean;
  fake: { fake: number; reasons: string[] };
  site: (typeof SITES)[keyof typeof SITES];
}) {
  const mode = state.mode;
  const level = state.level;
  const enabled = state.settings.autoRewrite && mode !== "foco";
  const intensity = state.settings.rewriteIntensity;

  /* estímulo suprimido */
  if ((mode === "foco" || mode === "calma") && (block.kind === "ad" || block.kind === "comments")) {
    return (
      <div className="my-3 flex items-center gap-2 rounded-md border border-dashed border-[#d8d2c4] bg-[#f0ede5] px-2.5 py-1.5 text-[9.5px] text-[#8b8678]">
        <span className="rounded bg-[#e6e1d4] px-1 py-0.5 font-semibold uppercase tracking-wider">
          {block.kind === "ad" ? "anúncio" : "comentários"}
        </span>
        suprimido pelo modo {mode} · texto original preservado
        <span className="ml-auto hidden items-center gap-1 sm:flex">
          <TrendingDown className="size-2.5" /> −1 estímulo
        </span>
      </div>
    );
  }

  switch (block.kind) {
    case "h2":
      return <h2>{block.text}</h2>;
    case "h3":
      return <h3>{block.text}</h3>;
    case "lead":
    case "p":
      return (
        <RewrittenText
          page={page}
          text={block.text ?? ""}
          variant={block.variants?.[level]}
          level={level}
          mode={mode}
          intensity={intensity}
          enabled={enabled}
          className={cn(first && "first-pron")}
        />
      );
    case "quote":
      return <blockquote className="page-quote">{block.text}</blockquote>;
    case "callout": {
      const tone =
        block.tone === "bad"
          ? { border: "#dc2626", bg: "#fef2f2", color: "#991b1b" }
          : block.tone === "warn"
            ? { border: "#d97706", bg: "#fffbeb", color: "#92400e" }
            : block.tone === "ok"
              ? { border: "#0d9488", bg: "#f0fdfa", color: "#115e59" }
              : { border: site.accent, bg: "#f4f6fa", color: site.ink };
      return (
        <div className="page-callout" style={{ borderColor: tone.border, background: tone.bg, color: tone.color }}>
          {block.text}
        </div>
      );
    }
    case "ad":
      return (
        <div className="page-ad">
          <span className="mb-1 block text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#9a9486]">publicidade</span>
          {block.text}
        </div>
      );
    case "list":
      return (
        <div className="my-2">
          <ul className="m-0 space-y-1.5 pl-4">
            {(block.items ?? []).map((item, i) => (
              <li key={i} className="text-[13.5px] leading-relaxed text-[#33363c]">
                <RewrittenText
                  page={page}
                  text={item}
                  level={level}
                  mode={mode}
                  intensity={intensity}
                  enabled={enabled}
                  as="span"
                />
              </li>
            ))}
          </ul>
        </div>
      );
    case "stat":
      return (
        <div className="my-4 rounded-lg border border-[#e0dbcf] bg-[#f6f3ec] p-3">
          <p className="m-0 font-display text-2xl font-bold" style={{ color: site.accent }}>
            {block.value}
          </p>
          <p className="m-0 text-[11px] text-[#5f6470]">{block.label}</p>
        </div>
      );
    case "video":
      return <VideoBlock block={block} mode={mode} siteAccent={site.accent} />;
    case "comments":
      return <CommentsBlock block={block} fake={fake} mode={mode} />;
    case "specs":
      return (
        <div className="my-3 overflow-hidden rounded-lg border border-[#e0dbcf]">
          {(block.items ?? []).map((item, i) => (
            <div key={i} className={cn("flex items-center justify-between gap-3 px-3 py-1.5 text-[11.5px]", i % 2 === 0 ? "bg-[#f7f4ed]" : "bg-white")}>
              <span className="text-[#7a7568]">{(item.split(":")[0] ?? "").trim()}</span>
              <span className="font-medium text-[#33363c]">{(item.split(":")[1] ?? "").trim()}</span>
            </div>
          ))}
        </div>
      );
    case "product":
      return <ProductBlock productId={block.productId} mode={mode} />;
    case "figure":
      return null;
    default:
      return null;
  }
}

function ProductBlock({ productId, mode }: { productId?: string; mode: ModeId }) {
  const p = PRODUCTS.find((x) => x.id === productId);
  if (!p) return null;
  const fakePrice = p.price * 1.012;
  const isCommerce = mode === "compra";

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-[#e0dbcf] bg-white">
      <div className="flex flex-col gap-3 p-3 sm:flex-row">
        <div className="grid h-32 w-full shrink-0 place-items-center rounded-lg sm:w-40" style={{ background: `linear-gradient(140deg, ${p.accent}22, ${p.accent}08)` }}>
          <span className="text-5xl" style={{ color: p.accent }}>
            {p.glyph}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[11px] uppercase tracking-wider" style={{ color: p.accent }}>
            {p.store}
          </p>
          <h3 className="m-0 mt-0.5 text-[15px] font-semibold leading-snug text-[#22252b]">{p.name}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-[#8b8678]">
            <span className="text-[#f0a500]">{"★".repeat(Math.round(p.rating))}</span>
            <span className="mono">{p.rating}</span>
            <span>·</span>
            <span>{p.reviews.toLocaleString("pt-BR")} avaliações</span>
          </div>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <span className="font-display text-2xl font-bold text-[#1d2026]">
              R$ {p.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            {p.oldPrice && <span className="text-[11px] text-[#9a9486] line-through">R$ {p.oldPrice.toLocaleString("pt-BR")}</span>}
            {p.oldPrice && (
              <span className="rounded bg-[#ffe4e6] px-1.5 py-0.5 text-[10px] font-semibold text-[#be123c]">
                −{Math.round((1 - p.price / p.oldPrice) * 100)}%
              </span>
            )}
          </div>
          {isCommerce && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9.5px]">
              <span className="rounded border border-[#d8d2c4] bg-[#f6f3ec] px-1.5 py-0.5 text-[#6a6659]">
                preço real no histórico: R$ {Math.min(...Array.from({ length: 6 }, (_, i) => p.price - i * 17)).toLocaleString("pt-BR")}–{(p.price + 90).toLocaleString("pt-BR")}
              </span>
              <span className="rounded border border-[#d8d2c4] bg-[#f6f3ec] px-1.5 py-0.5 text-[#6a6659]">hoje: R$ {fakePrice.toFixed(0)}</span>
              <span className="inline-flex items-center gap-1 rounded border border-[#f0c987] bg-[#fff7e8] px-1.5 py-0.5 text-[#8a6a20]">
                <TrendingUp className="size-2.5" /> 3ª vez em 7 dias que “acaba hoje”
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VideoBlock({ block, mode, siteAccent }: { block: Page["blocks"][number]; mode: ModeId; siteAccent: string }) {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const cues = block.cues ?? [];

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((v) => (v + 1) % Math.max(1, cues.length)), 1600);
    return () => clearInterval(id);
  }, [playing, cues.length]);

  const active = cues[t];

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-[#e0dbcf]">
      <div className="relative aspect-video" style={{ background: `linear-gradient(135deg, #10131a, ${siteAccent}55)` }}>
        <div className="absolute inset-0 grid place-items-center">
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            className="grid size-14 place-items-center rounded-full bg-white/90 text-[#111] shadow-xl transition hover:scale-105"
            aria-label={playing ? "Pausar" : "Reproduzir"}
          >
            {playing ? "❚❚" : "▶"}
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <p className="m-0 text-[11px] font-medium text-white">{block.text}</p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white/85" style={{ width: `${((t + 1) / Math.max(1, cues.length)) * 100}%` }} />
          </div>
        </div>
        {cues.length > 0 && (
          <div className="absolute left-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[9.5px] font-medium text-white">
            {active?.t} · trecho 0
          </div>
        )}
      </div>
      <div className="bg-white p-3">
        <p className="m-0 mb-1.5 flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#7a7568]">
          <Sparkles className="size-2.5" /> {block.caption ?? "sumário do Parallax"}
        </p>
        <div className="space-y-1">
          {cues.map((c, i) => (
            <button
              key={c.t}
              type="button"
              onClick={() => {
                setT(i);
                setPlaying(false);
              }}
              className={cn(
                "flex w-full items-start gap-2 rounded px-1.5 py-1 text-left transition",
                i === t && mode === "aprendizado" ? "bg-[#eef1fb]" : "hover:bg-[#f6f3ec]"
              )}
            >
              <span className="mono shrink-0 text-[9.5px] text-[#8b8678]">{c.t}</span>
              <span className="text-[10.5px] leading-snug text-[#44474e]">{c.text}</span>
            </button>
          ))}
        </div>
        {mode === "aprendizado" && (
          <div className="mt-2 rounded-md border border-[#d8d2c4] bg-[#f6f3ec] p-2 text-[9.5px] leading-relaxed text-[#7a7568]">
            Patrocínio (02:10–03:05) e introdução genérica colapsados. Trechos que citam seus conceitos ficaram no topo.
          </div>
        )}
      </div>
    </div>
  );
}

function CommentsBlock({
  block,
  fake,
  mode,
}: {
  block: Page["blocks"][number];
  fake: { fake: number; reasons: string[] };
  mode: ModeId;
}) {
  const [showAll, setShowAll] = useState(false);
  const items = block.items ?? [];
  const visible = mode === "calma" ? items.slice(0, 2) : showAll ? items : items.slice(0, 3);

  return (
    <div className="my-3 border-t border-[#e4e0d6] pt-2">
      <p className="m-0 mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#7a7568]">
        comentários ({items.length})
        {mode === "compra" && fake.fake > 0.15 && (
          <span className="rounded bg-[#fff1f3] px-1.5 py-0.5 text-[9px] font-semibold normal-case text-[#be123c]">
            {Math.round(fake.fake * 100)}% suspeitas (filtro local)
          </span>
        )}
      </p>
      {visible.map((c, i) => (
        <div key={i} className="page-comment">
          <span className="mb-0.5 flex items-center gap-1.5">
            <span className="grid size-4 place-items-center rounded-full bg-[#e6e1d4] text-[8px] font-bold text-[#7a7568]">U</span>
            <span className="text-[9.5px] font-medium text-[#8b8678]">usuário {1234 + i * 37}</span>
          </span>
          {c}
        </div>
      ))}
      {mode !== "calma" && items.length > 3 && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="text-[10px] font-medium text-[#6b6f78] underline-offset-2 hover:underline">
          {showAll ? "mostrar menos" : `ver todos os ${items.length}`}
        </button>
      )}
      {mode === "calma" && (
        <p className="mb-0 mt-1 text-[9.5px] text-[#8b8678]">modo calma: só 2 comentários — o resto pode esperar.</p>
      )}
    </div>
  );
}

export function pageWeight(page: Page) {
  return fmtBytes(pagePlainText(page).length + 4200);
}
