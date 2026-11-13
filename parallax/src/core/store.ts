import { useCallback, useEffect, useRef, useState } from "react";
import { detectCognition, parseIntent, pushSample, registerReading, registerSwitch, registerTyping, recommendMode } from "@/core/cognition";
import { contradictionsFrom, addPageToGraph } from "@/core/graph";
import { refToCitation } from "@/core/citations";
import { pageById, pagePlainText, pagesOfSite, PRODUCTS, SHOP_PAGES, SITES } from "@/data/sites";
import type {
  AppView,
  CognitiveSample,
  Flashcard,
  Intent,
  Level,
  ModeId,
  ParallaxState,
  SiteId,
  Toast,
} from "@/core/types";
import { uid } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
   Store do Parallax
   Reducer puro + persistência local. Nada sai do dispositivo.
   ──────────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = "parallax.v1";
const MAX_HISTORY = 120;

export const initialState: ParallaxState = {
  version: 1,
  onboarded: false,
  view: "navegador",
  recommendDismissed: false,
  readingPageId: null,
  sidePanel: "assistente",

  intent: null,
  intentHistory: [],
  mode: "aprendizado",
  level: "intermediario",

  tabs: [],
  activeTabId: "",
  history: [],

  graph: { nodes: [], edges: [] },
  reads: [],
  cards: [],
  quizzes: [],
  citations: [],
  contradictions: [],

  cart: [],
  wishlist: [],

  focusTask: null,
  breath: [],
  drift: 0,

  cognition: { samples: [], lastSwitchAt: 0 },

  settings: {
    calmContrast: 0.4,
    reducedMotion: false,
    rewriteIntensity: 0.85,
    autoRewrite: true,
    showCognition: true,
    showGraph: true,
    citeStyle: "abnt",
  },

  toasts: [],
  activeMs: 0,
  lastTickAt: Date.now(),
};

/* ── boot: abre a primeira aba e carrega o site inicial ────────────────────── */

function bootTabs(): { tabs: ParallaxState["tabs"]; activeTabId: string } {
  const first = pageById("atencao")!;
  const tab = {
    id: "tab-boot",
    pageId: first.id,
    title: first.title,
    siteId: first.siteId,
    pinned: true,
    essential: true,
    seconds: 0,
    createdAt: Date.now(),
  };
  return { tabs: [tab], activeTabId: tab.id };
}

export function initState(): ParallaxState {
  const saved = loadState();
  if (saved) return saved;
  const boot = bootTabs();
  return { ...initialState, ...boot, cognition: { samples: [], lastSwitchAt: 0 } };
}

function loadState(): ParallaxState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ParallaxState>;
    if (parsed.version !== 1) return null;
    return { ...initialState, ...parsed, toasts: [] };
  } catch {
    return null;
  }
}

/* ── reducer ──────────────────────────────────────────────────────────────── */

type Action =
  | { type: "hydrate"; state: ParallaxState }
  | { type: "view"; view: AppView }
  | { type: "sidePanel"; panel: ParallaxState["sidePanel"] }
  | { type: "mode"; mode: ModeId; why?: string }
  | { type: "level"; level: Level }
  | { type: "setIntent"; raw: string; auto?: boolean; mode?: ModeId; strength?: "soft" | "hard" }
  | { type: "clearIntent" }
  | { type: "navigate"; siteId: SiteId; pageId: string; newTab?: boolean; essential?: boolean }
  | { type: "activateTab"; tabId: string }
  | { type: "blankTab" }
  | { type: "recommendEnabled"; value: boolean }
  | { type: "closeTab"; tabId: string }
  | { type: "pinTab"; tabId: string }
  | { type: "essentialTab"; tabId: string; value: boolean }
  | { type: "tickTab"; tabId: string; seconds: number }
  | { type: "read"; pageId: string; seconds: number; progress: number }
  | { type: "reading"; pageId: string | null }
  | { type: "cognitive"; patch: Partial<Omit<CognitiveSample, "t">> }
  | { type: "switchSample"; recommended?: string }
  | { type: "dismissRecommendation" }
  | { type: "makeCards"; pageId: string }
  | { type: "reviewCard"; cardId: string; good: boolean }
  | { type: "saveQuiz"; pageId: string; score: number }
  | { type: "citePage"; pageId: string }
  | { type: "citeAll"; pageIds: string[] }
  | { type: "removeCitation"; id: string }
  | { type: "cartAdd"; productId: string }
  | { type: "cartRemove"; productId: string }
  | { type: "wishlist"; productId: string }
  | { type: "startFocus"; label: string; minutes: number }
  | { type: "pauseFocus" }
  | { type: "resumeFocus" }
  | { type: "endFocus"; completed: boolean }
  | { type: "pomodoro" }
  | { type: "breath"; seconds: number; source: "manual" | "calma" | "foco" }
  | { type: "settings"; patch: Partial<ParallaxState["settings"]> }
  | { type: "toast"; title: string; detail?: string; tone?: Toast["tone"] }
  | { type: "dismissToast"; id: string }
  | { type: "onboard"; onboarded: boolean }
  | { type: "reset" }
  | { type: "tick"; ms: number };

function addToast(state: ParallaxState, title: string, detail?: string, tone: Toast["tone"] = "info"): Toast[] {
  const toast: Toast = { id: uid("t"), title, detail, tone };
  return [...state.toasts.slice(-3), toast];
}

function withRead(
  state: ParallaxState,
  pageId: string,
  seconds: number,
  progress: number
): ParallaxState {
  const page = pageById(pageId);
  if (!page) return state;
  const idx = state.reads.findIndex((r) => r.pageId === pageId);
  const entry = {
    pageId,
    siteId: page.siteId,
    title: page.title,
    url: page.url,
    seconds,
    progress,
    createdAt: Date.now(),
  };
  const reads = idx >= 0 ? state.reads.map((r, i) => (i === idx ? { ...r, seconds: r.seconds + seconds, progress: Math.max(r.progress, progress) } : r)) : [entry, ...state.reads];
  return { ...state, reads: reads.slice(0, 200) };
}

export function reducer(state: ParallaxState, action: Action): ParallaxState {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "view":
      return { ...state, view: action.view };

    case "sidePanel":
      return { ...state, sidePanel: action.panel };

    case "mode": {
      const next = { ...state, mode: action.mode };
      const label = { aprendizado: "Aprendizado", pesquisa: "Pesquisa", compra: "Compra inteligente", foco: "Foco absoluto", calma: "Calma" }[action.mode];
      return {
        ...next,
        toasts: addToast(next, `Modo ${label} ativo`, action.why ?? "A página foi re-renderizada para este modo.", "ok"),
      };
    }

    case "level":
      return { ...state, level: action.level, toasts: addToast(state, `Nível ${action.level}`, "O texto será reescrito com nova densidade.", "info") };

    case "setIntent": {
      const parsed = parseIntent(action.raw);
      const intent: Intent = {
        id: uid("in"),
        raw: action.raw,
        kind: parsed.kind,
        mode: action.mode ?? parsed.mode,
        level: state.level,
        topic: parsed.topic,
        keywords: parsed.keywords,
        budget: parsed.budget,
        createdAt: Date.now(),
        confidence: parsed.confidence,
        source: action.auto ? "auto" : "manual",
        reasons: parsed.reasons,
      };
      const mode = intent.mode;
      const next: ParallaxState = {
        ...state,
        intent,
        mode,
        intentHistory: [intent, ...state.intentHistory].slice(0, 30),
        recommendDismissed: false,
      };
      return {
        ...next,
        toasts: addToast(
          next,
          action.auto ? "Intenção inferida" : "Intenção declarada",
          `${intent.topic} · modo ${mode} · nível ${intent.level}${intent.budget ? ` · até R$ ${intent.budget.toLocaleString("pt-BR")}` : ""}`,
          "ok"
        ),
      };
    }

    case "clearIntent":
      return { ...state, intent: null, toasts: addToast(state, "Intenção removida", "A web volta ao estado original até você declarar uma nova.", "info") };

    case "navigate": {
      const page = pageById(action.pageId);
      if (!page) return state;
      const existing = state.tabs.find((t) => t.pageId === action.pageId);
      if (existing && !action.newTab) {
        return reducer(state, { type: "activateTab", tabId: existing.id });
      }
      const tab = {
        id: uid("tab"),
        pageId: page.id,
        title: page.title,
        siteId: page.siteId,
        pinned: false,
        essential: action.essential ?? false,
        seconds: 0,
        createdAt: Date.now(),
      };
      const tabs = [...state.tabs, tab].slice(-14);
      const history = [
        { id: uid("h"), siteId: page.siteId, pageId: page.id, title: page.title, url: page.url, at: Date.now() },
        ...state.history,
      ].slice(0, MAX_HISTORY);

      let next: ParallaxState = { ...state, tabs, activeTabId: tab.id, history, readingPageId: null };

      // grafo
      const g = addPageToGraph(next.graph, page, page.siteId);
      next = { ...next, graph: { nodes: g.nodes, edges: g.edges } };

      // contradições — compara com tudo o que já foi visitado (qualquer site)
      const visitedIds = new Set([page.id, ...next.reads.map((r) => r.pageId)]);
      const visitedPages = [...visitedIds]
        .map((id) => pageById(id))
        .filter((p): p is NonNullable<ReturnType<typeof pageById>> => Boolean(p));
      const found = contradictionsFrom(page, next.contradictions, [...visitedPages, ...pagesOfSite(page.siteId)]);
      if (found.length) {
        next = { ...next, contradictions: [...found, ...next.contradictions].slice(0, 40) };
      }
      return {
        ...next,
        toasts: found.length
          ? addToast(next, "Contradição entre fontes", `${found[0].topic}: “${found[0].claimA.text.slice(0, 48)}…” × “${found[0].claimB.text.slice(0, 48)}…”`, "warn")
          : state.toasts,
      };
    }

    case "activateTab": {
      const tab = state.tabs.find((t) => t.id === action.tabId);
      if (!tab) return state;
      const history = [
        { id: uid("h"), siteId: tab.siteId, pageId: tab.pageId, title: tab.title, url: pageById(tab.pageId)?.url ?? "", at: Date.now() },
        ...state.history,
      ].slice(0, MAX_HISTORY);
      return { ...state, activeTabId: tab.id, history, readingPageId: null, cognition: { ...state.cognition, lastSwitchAt: Date.now() } };
    }

    case "blankTab":
      return { ...state, activeTabId: "", readingPageId: null };

    case "recommendEnabled":
      return { ...state, recommendDismissed: !action.value };

    case "closeTab": {
      const tabs = state.tabs.filter((t) => t.id !== action.tabId);
      if (tabs.length === 0) return { ...state, tabs: [], activeTabId: "" };
      const activeTabId = state.activeTabId === action.tabId ? tabs[Math.max(0, state.tabs.findIndex((t) => t.id === action.tabId) - 1)].id : state.activeTabId;
      return { ...state, tabs, activeTabId };
    }

    case "pinTab":
      return { ...state, tabs: state.tabs.map((t) => (t.id === action.tabId ? { ...t, pinned: !t.pinned } : t)) };

    case "essentialTab":
      return { ...state, tabs: state.tabs.map((t) => (t.id === action.tabId ? { ...t, essential: action.value } : t)) };

    case "tickTab":
      return {
        ...state,
        tabs: state.tabs.map((t) => (t.id === action.tabId ? { ...t, seconds: t.seconds + action.seconds } : t)),
      };

    case "read": {
      const withHistory = withRead(state, action.pageId, action.seconds, action.progress);
      return withHistory;
    }

    case "reading":
      return { ...state, readingPageId: action.pageId };

    case "cognitive":
      return { ...state, cognition: { ...state.cognition, samples: pushSample(state.cognition.samples, action.patch) } };

    case "switchSample":
      return { ...state, cognition: { ...state.cognition, samples: registerSwitch(state.cognition.samples), lastSwitchAt: Date.now() } };

    case "dismissRecommendation":
      return { ...state, recommendDismissed: true };

    case "makeCards": {
      const page = pageById(action.pageId);
      if (!page) return state;
      const existing = new Set(state.cards.map((c) => c.front));
      const fresh: Flashcard[] = page.terms
        .filter((t) => !existing.has(t.term))
        .slice(0, 8)
        .map((t) => ({
          id: uid("card"),
          front: t.term,
          back: t.definition,
          pageTitle: page.title,
          siteId: page.siteId,
          ease: 0,
          dueAt: Date.now(),
          reviews: 0,
          createdAt: Date.now(),
        }));
      if (fresh.length === 0) return { ...state, toasts: addToast(state, "Nenhum cartão novo", "Os termos desta página já estão no seu baralho.", "info") };
      return { ...state, cards: [...fresh, ...state.cards], toasts: addToast(state, `${fresh.length} flashcards criados`, `A partir de “${page.title}”.`, "ok") };
    }

    case "reviewCard": {
      const cards = state.cards.map((c) => {
        if (c.id !== action.cardId) return c;
        const ease = Math.max(-2, Math.min(3, c.ease + (action.good ? 1 : -1)));
        const intervalDays = action.good ? Math.max(1, Math.round((c.reviews + 1) * 1.8)) : 0.02;
        return { ...c, ease, reviews: c.reviews + 1, dueAt: Date.now() + intervalDays * 86400_000 };
      });
      return { ...state, cards };
    }

    case "saveQuiz":
      return { ...state, quizzes: [{ pageId: action.pageId, createdAt: Date.now(), score: action.score }, ...state.quizzes].slice(0, 40) };

    case "citePage": {
      const page = pageById(action.pageId);
      if (!page) return state;
      const refs = page.refs ?? [];
      const newOnes = refs.map((r) => refToCitation(r)).filter((c) => !state.citations.some((x) => x.id === c.id));
      if (newOnes.length === 0) return { ...state, toasts: addToast(state, "Já citado", "As referências desta página estão na sua bibliografia.", "info") };
      return {
        ...state,
        citations: [...newOnes, ...state.citations],
        toasts: addToast(state, `${newOnes.length} referência(s) exportada(s)`, `Formatadas em ${state.settings.citeStyle.toUpperCase()}.`, "ok"),
      };
    }

    case "citeAll": {
      const all = action.pageIds.flatMap((id) => pageById(id)?.refs ?? []).map((r) => refToCitation(r));
      const merged = [...all, ...state.citations].filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);
      return { ...state, citations: merged, toasts: addToast(state, `Bibliografia com ${merged.length} fontes`, "Pronta para copiar ou baixar em .bib/.txt.", "ok") };
    }

    case "removeCitation":
      return { ...state, citations: state.citations.filter((c) => c.id !== action.id) };

    case "cartAdd": {
      const p = PRODUCTS.find((x) => x.id === action.productId);
      if (!p) return state;
      if (state.cart.some((c) => c.productId === p.id)) return state;
      return {
        ...state,
        cart: [...state.cart, { productId: p.id, store: p.store, name: p.name }],
        toasts: addToast(state, "Adicionado à comparação", `${p.name} · ${p.store}`, "ok"),
      };
    }

    case "cartRemove":
      return { ...state, cart: state.cart.filter((c) => c.productId !== action.productId) };

    case "wishlist":
      return {
        ...state,
        wishlist: state.wishlist.includes(action.productId) ? state.wishlist.filter((x) => x !== action.productId) : [...state.wishlist, action.productId],
      };

    case "startFocus": {
      const task = {
        id: uid("task"),
        label: action.label,
        minutes: action.minutes,
        startedAt: Date.now(),
        completed: false,
        pomodoros: 0,
      };
      return {
        ...state,
        focusTask: task,
        mode: "foco",
        view: "foco",
        tabs: state.tabs.map((t) => ({ ...t, essential: t.essential || t.id === state.activeTabId })),
        toasts: addToast(state, "Sessão de foco iniciada", `${action.label} · ${action.minutes} min. Abas não essenciais foram suavizadas.`, "ok"),
      };
    }

    case "pauseFocus": {
      if (!state.focusTask) return state;
      return { ...state, focusTask: { ...state.focusTask, startedAt: state.focusTask.startedAt } };
    }

    case "resumeFocus": {
      if (!state.focusTask) return state;
      return { ...state, focusTask: { ...state.focusTask, startedAt: Date.now() } };
    }

    case "endFocus": {
      if (!state.focusTask) return state;
      const done = { ...state.focusTask, endedAt: Date.now(), completed: action.completed };
      return {
        ...state,
        focusTask: null,
        toasts: addToast(state, action.completed ? "Sessão concluída" : "Sessão encerrada", `${done.label} · ${done.pomodoros} pomodoro(s)`, action.completed ? "ok" : "info"),
      };
    }

    case "pomodoro":
      return state.focusTask ? { ...state, focusTask: { ...state.focusTask, pomodoros: state.focusTask.pomodoros + 1, startedAt: Date.now() } } : state;

    case "breath":
      return {
        ...state,
        breath: [{ id: uid("b"), startedAt: Date.now(), seconds: action.seconds, source: action.source }, ...state.breath].slice(0, 40),
        toasts: addToast(state, "Respiração concluída", `${action.seconds}s · o modo calma volta ao ritmo normal.`, "ok"),
      };

    case "settings":
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case "toast":
      return { ...state, toasts: addToast(state, action.title, action.detail, action.tone ?? "info") };

    case "dismissToast":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    case "onboard":
      return { ...state, onboarded: action.onboarded };

    case "reset":
      return { ...initialState, ...bootTabs(), onboarded: true, cognition: { samples: [], lastSwitchAt: 0 }, lastTickAt: Date.now() };

    case "tick": {
      const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
      return {
        ...state,
        activeMs: state.activeMs + action.ms,
        lastTickAt: Date.now(),
        tabs: activeTab ? state.tabs.map((t) => (t.id === activeTab.id ? { ...t, seconds: t.seconds + action.ms / 1000 } : t)) : state.tabs,
        drift: activeTab ? state.drift : state.drift,
      };
    }

    default:
      return state;
  }
}

/* ── store com assinantes (sem dependências) ──────────────────────────────── */

type Listener = () => void;

class Store {
  state: ParallaxState = initState();
  private listeners = new Set<Listener>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getSnapshot = () => this.state;

  dispatch = (action: Action) => {
    this.state = reducer(this.state, action);
    this.listeners.forEach((l) => l());
    this.queueSave();
  };

  private queueSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.persist(), 400);
  }

  persist() {
    try {
      const { toasts: _toasts, ...rest } = this.state;
      void _toasts;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    } catch {
      /* quota cheia: segue sem persistir */
    }
  }

  reset() {
    this.dispatch({ type: "reset" });
    localStorage.removeItem(STORAGE_KEY);
  }

  /** insere amostras de comportamento vindas dos painéis */
  sample = (patch: Partial<Omit<CognitiveSample, "t">>) => this.dispatch({ type: "cognitive", patch });
  scroll = (dy: number) => {
    this.state = { ...this.state, cognition: { ...this.state.cognition, samples: registerReading(this.state.cognition.samples, dy) } };
    this.listeners.forEach((l) => l());
  };
  typed = (chars: number) => {
    this.state = { ...this.state, cognition: { ...this.state.cognition, samples: registerTyping(this.state.cognition.samples, chars) } };
    this.listeners.forEach((l) => l());
  };
  switched = () => this.dispatch({ type: "switchSample" });

  cognition() {
    return detectCognition(this.state);
  }

  recommendation() {
    return recommendMode(detectCognition(this.state), this.state.mode);
  }
}

export const store = new Store();

export function useParallax() {
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);
  useEffect(() => {
    const unsub = store.subscribe(rerender);
    return () => {
      unsub();
    };
  }, [rerender]);
  return { state: store.state, dispatch: store.dispatch, store };
}

/** mantém as amostras em movimento quando o usuário está ativo */
export function useHeartbeat(ms = 20_000) {
  const last = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const active = document.visibilityState === "visible";
      if (!active) return;
      store.dispatch({ type: "tick", ms: now - last.current });
      last.current = now;
      if (!store.state.focusTask) store.sample({});
    }, ms);
    return () => clearInterval(id);
  }, [ms]);
}

/** util para o painel de leitura: marca progresso e tempo */
export function trackReading(pageId: string, seconds: number, progress: number) {
  store.dispatch({ type: "read", pageId, seconds, progress });
}

export function plainTextOf(pageId: string) {
  const p = pageById(pageId);
  return p ? pagePlainText(p) : "";
}

export function totalWordsRead() {
  return store.state.reads.reduce((acc, r) => {
    const p = pageById(r.pageId);
    return acc + (p ? Math.round(pagePlainText(p).split(/\s+/).length * r.progress) : 0);
  }, 0);
}

export function productsForCart(state: ParallaxState) {
  return state.cart.map((line) => PRODUCTS.find((p) => p.id === line.productId)).filter((p): p is (typeof PRODUCTS)[number] => Boolean(p));
}

export function shopHomePages() {
  return [SHOP_PAGES[0].id];
}

export function siteFor(id: SiteId) {
  return SITES[id];
}
