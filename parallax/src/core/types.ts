/* ────────────────────────────────────────────────────────────────────────────
   Parallax — tipos do núcleo
   Tudo é serializável: o estado vive no localStorage e o grafo é exportável.
   ──────────────────────────────────────────────────────────────────────────── */

export type ModeId = "aprendizado" | "pesquisa" | "compra" | "foco" | "calma";

export type Level = "iniciante" | "intermediario" | "avancado";

export type CognitiveState = "focado" | "disperso" | "fatigado" | "flow";

export type IntentKind = "aprender" | "pesquisar" | "comprar" | "focar" | "descansar" | "explorar";

export type SiteId = "wiki" | "devto" | "health" | "shop" | "yt" | "news";

/* ── grafo de conhecimento ─────────────────────────────────────────────────── */

export type NodeKind = "conceito" | "fonte" | "produto" | "tarefa" | "sessao";

export interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  /** primeira fonte onde apareceu */
  siteId?: SiteId;
  pageId?: string;
  pageTitle?: string;
  url?: string;
  /** quantas fontes/visitas tocaram neste conceito */
  weight: number;
  createdAt: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  /** "co-ocorre", "cita", "contradiz", "relaciona" */
  rel: "coocorre" | "cita" | "contradiz" | "relaciona";
  weight: number;
  createdAt: number;
}

/* ── leitura e conhecimento ────────────────────────────────────────────────── */

export interface ReadEntry {
  pageId: string;
  siteId: SiteId;
  title: string;
  url: string;
  /** segundos de atenção ativa */
  seconds: number;
  /** 0..1 — fração lida estimada */
  progress: number;
  createdAt: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  pageTitle: string;
  siteId?: SiteId;
  /** 0..5 */
  ease: number;
  dueAt: number;
  reviews: number;
  createdAt: number;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  pageTitle: string;
}

export interface Citation {
  id: string;
  title: string;
  url: string;
  site: string;
  author?: string;
  year?: number;
  accessed: number;
}

export interface Contradiction {
  id: string;
  topic: string;
  claimA: { text: string; source: string };
  claimB: { text: string; source: string };
  createdAt: number;
}

/* ── e-commerce ────────────────────────────────────────────────────────────── */

export interface PricePoint {
  day: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  store: string;
  url: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  fakeReviewShare: number;
  specs: Record<string, string>;
  history: PricePoint[];
  /** dark patterns que o detector encontrou nesta página */
  patterns: DarkPatternHit[];
  longTermScore: number;
  image: string;
  accent: string;
}

export interface DarkPatternHit {
  id: string;
  kind:
    | "urgencia-falsa"
    | "escassez-falsa"
    | "preco-riscado"
    | "contagem-regressiva"
    | "review-suspeita"
    | "custo-oculto"
    | "confirmshaming"
    | "prova-social-fabricada";
  label: string;
  evidence: string;
  severity: "alta" | "media" | "baixa";
  /** em % — há quanto tempo o padrão está sendo exibido */
  activeSince?: string;
}

export interface CartLine {
  productId: string;
  store: string;
  name: string;
}

/* ── foco e bem-estar ──────────────────────────────────────────────────────── */

export interface FocusTask {
  id: string;
  label: string;
  minutes: number;
  startedAt: number;
  endedAt?: number;
  completed: boolean;
  pomodoros: number;
}

export interface BreathingSession {
  id: string;
  startedAt: number;
  seconds: number;
  source: "manual" | "calma" | "foco";
}

export interface TabRecord {
  pageId: string;
  siteId: SiteId;
  title: string;
  openedAt: number;
  lastActiveAt: number;
  seconds: number;
  switches: number;
}

/* ── telemetria cognitiva ──────────────────────────────────────────────────── */

export interface CognitiveSample {
  t: number;
  focus: number;
  load: number;
  typing: number;
  scroll: number;
  switches: number;
}

export interface CognitionSnapshot {
  state: CognitiveState;
  focus: number;
  load: number;
  fatigue: number;
  confidence: number;
  samples: CognitiveSample[];
  reasons: string[];
  switchesLastMinute: number;
  minutesInSession: number;
  lateNight: boolean;
}

/* ── intenção ──────────────────────────────────────────────────────────────── */

export interface Intent {
  id: string;
  raw: string;
  kind: IntentKind;
  mode: ModeId;
  level: Level;
  topic: string;
  keywords: string[];
  budget?: number;
  createdAt: number;
  /** 0..1 — confiança do parser */
  confidence: number;
  source: "manual" | "auto";
  reasons: string[];
}

/* ── reescrita ─────────────────────────────────────────────────────────────── */

export interface RewriteNote {
  from: string;
  to: string;
  why: string;
}

export interface RewriteResult {
  text: string;
  notes: RewriteNote[];
  complexityBefore: number;
  complexityAfter: number;
  glossary: { term: string; definition: string }[];
  ms: number;
  engine: "local-heuristic" | "local-llm" | "cloud";
}

/* ── histórico de navegação ────────────────────────────────────────────────── */

export interface HistoryEntry {
  id: string;
  siteId: SiteId;
  pageId: string;
  title: string;
  url: string;
  at: number;
}

export interface TabInfo {
  id: string;
  pageId: string;
  title: string;
  siteId: SiteId;
  pinned: boolean;
  essential: boolean;
  seconds: number;
  createdAt: number;
}

export interface Toast {
  id: string;
  title: string;
  detail?: string;
  tone: "info" | "ok" | "warn" | "bad";
}

/* ── estado raiz ───────────────────────────────────────────────────────────── */

export type AppView = "navegador" | "cerebro" | "foco" | "lab" | "manifesto";

export type { Page, PageRef, Block } from "@/data/sites";

export interface ParallaxState {
  version: number;
  onboarded: boolean;
  view: AppView;

  /** recomendação de modo dispensada nesta sessão */
  recommendDismissed: boolean;

  /** página aberta no modo leitura completa */
  readingPageId: string | null;

  /** painel lateral direito: assistente/grafo/citações/insights */
  sidePanel: "assistente" | "grafo" | "citacoes" | "pagina";

  intent: Intent | null;
  intentHistory: Intent[];
  mode: ModeId;
  level: Level;

  tabs: TabInfo[];
  activeTabId: string;
  history: HistoryEntry[];

  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  reads: ReadEntry[];
  cards: Flashcard[];
  quizzes: { pageId: string; createdAt: number; score?: number }[];
  citations: Citation[];
  contradictions: Contradiction[];

  cart: CartLine[];
  wishlist: string[];

  focusTask: FocusTask | null;
  breath: BreathingSession[];
  /** minutos de navegação "sem intenção" hoje */
  drift: number;

  cognition: { samples: CognitiveSample[]; lastSwitchAt: number };

  settings: {
    /** contraste, animações, densidade */
    calmContrast: number;
    reducedMotion: boolean;
    rewriteIntensity: number;
    /** reescrever automaticamente ao abrir páginas */
    autoRewrite: boolean;
    /** mostrar painel de cognição */
    showCognition: boolean;
    /** grafo visível */
    showGraph: boolean;
    /** idioma de citação */
    citeStyle: "abnt" | "apa" | "bibtex";
  };

  toasts: Toast[];
  /** ms de tempo ativo no app (para métricas e sessão) */
  activeMs: number;
  lastTickAt: number;
}
