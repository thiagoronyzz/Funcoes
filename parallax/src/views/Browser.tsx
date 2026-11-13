import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CornerDownLeft,
  Globe2,
  History,
  Lock,
  Plus,
  RotateCw,
  Search,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MockPage } from "@/components/MockPage";
import { NewTab } from "@/components/NewTab";
import { SidePanel } from "@/components/SidePanel";
import { Btn, Chip, IconBtn, ModeChip, MODE_META, Tooltip } from "@/components/ui";
import { COGNITIVE_META, detectCognition } from "@/core/cognition";
import { useParallax } from "@/core/store";
import { ALL_PAGES, pageById, shortcutsOf, SITES } from "@/data/sites";
import type { Page } from "@/core/types";
import { cn, fmtDuration } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
   O navegador: abas, omnibox, página re-renderizada e assistente lateral.
   A "web" aqui é simulada em dados, mas o pipeline de reescrita é real.
   ──────────────────────────────────────────────────────────────────────────── */

export default function Browser() {
  const { state, dispatch } = useParallax();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeMeta, setActiveMeta] = useState({ progress: 0, rewrites: 0, removed: 0, ms: 0 });
  const [busy, setBusy] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const activeTab = state.tabs.find((t) => t.id === state.activeTabId) ?? null;
  const page = activeTab ? pageById(activeTab.pageId) : null;
  const cognition = useMemo(() => detectCognition(state), [state]);
  const activeSeconds = activeTab?.seconds ?? 0;

  /* navegação ─────────────────────────────────────────────────────────────── */
  const go = useCallback(
    (pageId: string, opts?: { newTab?: boolean; essential?: boolean }) => {
      const p = pageById(pageId);
      if (!p) return;
      setBusy(true);
      dispatch({ type: "switchSample" });
      dispatch({ type: "navigate", siteId: p.siteId, pageId: p.id, ...opts });
      window.setTimeout(() => setBusy(false), 260);
      setQuery("");
      setSuggestOpen(false);
    },
    [dispatch]
  );

  /* registra tempo de leitura e progresso ─────────────────────────────────── */
  const flushRef = useRef<{ pageId: string; seconds: number; progress: number } | null>(null);
  flushRef.current = page ? { pageId: page.id, seconds: 0, progress: activeMeta.progress } : null;

  useEffect(() => {
    const id = setInterval(() => {
      if (!flushRef.current) return;
      if (document.visibilityState !== "visible") return;
      dispatch({ type: "read", pageId: flushRef.current.pageId, seconds: 5, progress: flushRef.current.progress });
    }, 5000);
    return () => clearInterval(id);
  }, [dispatch]);

  /* atalhos ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        setSuggestOpen(true);
      }
      if (mod && e.key.toLowerCase() === "l") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (mod && e.key.toLowerCase() === "t") {
        e.preventDefault();
        dispatch({ type: "blankTab" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = ALL_PAGES.filter((p) =>
      q.length === 0 ? true : `${p.title} ${p.url} ${p.concepts.join(" ")} ${SITES[p.siteId].name}`.toLowerCase().includes(q)
    ).slice(0, 7);
    return pages;
  }, [query]);

  const visibleTabs = state.tabs.filter((t) => !t.pinned || true);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── tab strip ─────────────────────────────────────────────────────── */}
      <div className="br-tabstrip">
        {visibleTabs.map((t) => {
          const site = SITES[t.siteId];
          const isActive = t.id === state.activeTabId;
          const dimmed = state.mode === "foco" && !t.essential && !isActive;
          return (
            <div
              key={t.id}
              className={cn("br-tab", isActive && "is-active", dimmed && "is-dimmed")}
              onClick={() => {
                if (!isActive) {
                  dispatch({ type: "activateTab", tabId: t.id });
                  dispatch({ type: "switchSample" });
                }
              }}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && dispatch({ type: "activateTab", tabId: t.id })}
            >
              <span className="grid size-3.5 shrink-0 place-items-center rounded-[3px] text-[7.5px] font-black text-white" style={{ background: site.accent }}>
                {site.name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              {t.pinned && <Star className="size-2.5 shrink-0 text-gold" fill="currentColor" />}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: "closeTab", tabId: t.id });
                }}
                className="br-tab-close"
                aria-label={`Fechar ${t.title}`}
              >
                <X className="size-2.5" />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => dispatch({ type: "blankTab" })}
          className="mb-1 ml-1 grid size-6 shrink-0 place-items-center self-center rounded-md text-dim transition hover:bg-white/8 hover:text-ink"
          title="Nova aba (Ctrl+T)"
          aria-label="Nova aba"
        >
          <Plus className="size-3.5" />
        </button>
        <div className="mb-1 ml-auto hidden shrink-0 items-center gap-1.5 self-center pl-2 sm:flex">
          <span className="inline-flex items-center gap-1 rounded-full border border-mint/30 bg-mint/10 px-1.5 py-0.5 text-[8.5px] font-medium text-mint">
            <Lock className="size-2" /> 100% local
          </span>
          <Tooltip label="Cada modo re-renderiza a página de um jeito. Passar o mouse no nome mostra a descrição." side="bottom">
            <span className="inline-flex items-center gap-1 rounded-full border border-line bg-panel2 px-1.5 py-0.5 text-[8.5px] text-dim">
              <Zap className="size-2" /> motor ativo
            </span>
          </Tooltip>
        </div>
      </div>

      {/* ── omnibox ───────────────────────────────────────────────────────── */}
      <div className="br-omnibox">
        <div className="flex shrink-0 items-center gap-0.5">
          <IconBtn size="sm" title="Voltar ao início" onClick={() => dispatch({ type: "blankTab" })}>
            <ArrowLeft className="size-3.5" />
          </IconBtn>
          <IconBtn
            size="sm"
            title="Avançar"
            onClick={() => {
              const idx = state.history.findIndex((h) => h.pageId === page?.id);
              const next = state.history[idx + 2];
              if (next) go(next.pageId, { newTab: false });
            }}
          >
            <ArrowRight className="size-3.5" />
          </IconBtn>
          <IconBtn
            size="sm"
            title="Recarregar e reescrever"
            onClick={() => {
              setBusy(true);
              dispatch({ type: "toast", title: "Página re-renderizada", detail: "Motor local reaplicou o modo atual.", tone: "info" });
              window.setTimeout(() => setBusy(false), 420);
            }}
          >
            <RotateCw className={cn("size-3.5", busy && "animate-spin")} />
          </IconBtn>
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="br-url">
            <Lock className="size-3 shrink-0 text-mint" />
            <span className="hidden shrink-0 items-center gap-1 text-[10px] text-faint sm:flex">
              parallax://
            </span>
            <input
              ref={searchRef}
              value={focused ? query : query || page?.url.replace(/^https?:\/\//, "") || ""}
              onChange={(e) => {
                setQuery(e.target.value);
                setSuggestOpen(true);
              }}
              onFocus={() => {
                setFocused(true);
                setSuggestOpen(true);
                if (!query) searchRef.current?.select();
              }}
              onBlur={() => {
                window.setTimeout(() => {
                  setSuggestOpen(false);
                  setFocused(false);
                  setQuery("");
                }, 160);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && suggestions[0]) go(suggestions[0].id, { newTab: Boolean(query) });
                if (e.key === "Escape") setSuggestOpen(false);
              }}
              placeholder="Busque por um site, página ou conceito… (Ctrl+K)"
              aria-label="Barra de endereço"
              className="min-w-0 flex-1"
            />
            {page && (
              <button
                type="button"
                onClick={() => dispatch({ type: "pinTab", tabId: activeTab?.id ?? "" })}
                className={cn("shrink-0 rounded p-0.5", activeTab?.pinned ? "text-gold" : "text-faint hover:text-ink")}
                title={activeTab?.pinned ? "Desafixar aba" : "Fixar aba"}
                aria-label="Fixar aba"
              >
                <Star className="size-3.5" fill={activeTab?.pinned ? "currentColor" : "none"} />
              </button>
            )}
          </div>

          {suggestOpen && (
            <div className="absolute left-0 right-0 top-[34px] z-50 overflow-hidden rounded-xl border border-line2 bg-[#0c0f17] shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-line px-2.5 py-1.5 text-[9px] uppercase tracking-wider text-faint">
                <Search className="size-3" /> {query ? "resultados do índice local" : "abrir uma página"}
                <span className="ml-auto normal-case text-faint">{suggestions.length} de {ALL_PAGES.length}</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto scroll-thin py-1">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={() => go(p.id, { newTab: Boolean(query) })}
                    className="flex w-full items-start gap-2 px-2.5 py-1.5 text-left transition hover:bg-white/6"
                  >
                    <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded text-[8px] font-black text-white" style={{ background: SITES[p.siteId].accent }}>
                      {SITES[p.siteId].name.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-medium text-ink">{p.title}</span>
                      <span className="block truncate text-[9.5px] text-dim">
                        {SITES[p.siteId].host} · {p.concepts.slice(0, 2).join(" + ")}
                      </span>
                    </span>
                    <CornerDownLeft className="mt-1 size-3 shrink-0 text-faint" />
                  </button>
                ))}
                {suggestions.length === 0 && (
                  <p className="m-0 px-3 py-3 text-[10.5px] text-dim">Nada no índice local. Tente “atenção”, “monitor” ou “transformers”.</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1 border-t border-line bg-panel2/40 px-2 py-1.5">
                {[
                  { label: "atenção", q: "atenção" },
                  { label: "monitor 4K", q: "monitor" },
                  { label: "transformers", q: "transformer" },
                  { label: "hipertensão", q: "hipertensão" },
                  { label: "IA local", q: "llm" },
                ].map((s) => (
                  <Chip key={s.label} onClick={() => setQuery(s.q)}>
                    {s.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Tooltip label={`${MODE_META[state.mode].label} — ${MODE_META[state.mode].desc}`} side="bottom">
            <span className="hidden md:inline-flex">
              <ModeChip mode={state.mode} />
            </span>
          </Tooltip>
          <Tooltip label={`Estado cognitivo detectado: ${COGNITIVE_META[cognition.state].label} (${Math.round(cognition.confidence * 100)}% de confiança)`} side="bottom">
            <button
              type="button"
              onClick={() => dispatch({ type: "view", view: "cerebro" })}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9.5px] font-medium transition hover:brightness-110"
              style={{ color: COGNITIVE_META[cognition.state].color, borderColor: `${COGNITIVE_META[cognition.state].color}55`, background: `${COGNITIVE_META[cognition.state].color}12` }}
            >
              <Brain className="size-3" />
              <span className="hidden sm:inline">{COGNITIVE_META[cognition.state].label}</span>
              <span className="mono">{Math.round(cognition.focus * 100)}</span>
            </button>
          </Tooltip>
          <Btn size="sm" variant="primary" icon={<Sparkles className="size-3.5" />} onClick={() => dispatch({ type: "view", view: "lab" })} className="hidden sm:inline-flex">
            Motor
          </Btn>
        </div>
      </div>

      {/* ── corpo ─────────────────────────────────────────────────────────── */}
      <div className="browser-grid min-h-0 flex-1">
        <div className="relative flex min-h-0 min-w-0 flex-col bg-night2">
          {busy && <div className="absolute inset-x-0 top-0 z-30 h-0.5 overflow-hidden"><div className="par-shimmer h-full w-full" /></div>}

          {page ? (
            <MockPage
              key={page.id}
              page={page}
              state={state}
              cognition={cognition}
              onMeta={setActiveMeta}
            />
          ) : (
            <NewTab onOpen={(id, opts) => go(id, opts)} state={state} cognition={cognition} />
          )}

          {page && (
            <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-line bg-[#0b0e14] px-3 py-1 text-[9.5px] text-faint">
              <span className="inline-flex items-center gap-1">
                <Globe2 className="size-2.5" /> {SITES[page.siteId].host}
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden items-center gap-1 sm:inline-flex">
                <Lock className="size-2.5 text-mint" /> sem requisições externas
              </span>
              <span className="ml-auto flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <History className="size-2.5" /> {fmtDuration(activeSeconds)} nesta aba
                </span>
                <span className={cn("inline-flex items-center gap-1", cognition.state === "disperso" && "text-gold")}>
                  <Zap className="size-2.5" /> {activeMeta.removed} suprimido(s)
                </span>
                <span className="mono">{Math.round(activeMeta.progress * 100)}%</span>
              </span>
            </div>
          )}
        </div>

        <SidePanel state={state} pageId={page?.id ?? null} />
      </div>
    </div>
  );
}

/* ── helpers exportados ───────────────────────────────────────────────────── */

export function pageShortcuts(count = 6): Page[] {
  return shortcutsOf(count);
}

