import {
  ArrowRight,
  AudioLines,
  Brain,
  Building2,
  Check,
  Cpu,
  Eye,
  Gauge,
  GitCompare,
  Globe2,
  Layers,
  LineChart,
  Lock,
  MonitorSmartphone,
  Puzzle,
  ScanEye,
  ServerOff,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { Badge, Btn, SectionTitle } from "@/components/ui";
import { COGNITIVE_META } from "@/core/cognition";
import { SITES } from "@/data/sites";
import { useParallax } from "@/core/store";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────────
   Manifesto / pitch
   A tese do produto em página, com o protótipo funcionando ao lado.
   ──────────────────────────────────────────────────────────────────────────── */

export default function Manifesto() {
  const { state, dispatch } = useParallax();

  return (
    <div className="scroll-thin h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        {/* hero */}
        <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-panel2 to-panel p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-vio/12 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 size-60 rounded-full bg-gold/8 blur-3xl" />
          <div className="relative">
            <Badge color="#f0c987">protótipo funcional · v0.1</Badge>
            <h1 className="m-0 mt-3 max-w-2xl font-display text-[30px] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[38px]">
              A web foi construída para <span className="text-gold">máquinas</span> renderizarem pixels.
              <br />
              O Parallax reconstrói para <span className="text-vio">cérebros</span> processarem significado.
            </h1>
            <p className="m-0 mt-3 max-w-2xl text-[13px] leading-relaxed text-dim sm:text-[14px]">
              Uma camada invisível que re-renderiza qualquer site, em tempo real, a partir da sua intenção, do seu nível de
              conhecimento e do estado da sua mente naquele segundo. Não bloqueia a internet — traduz.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Btn variant="primary" size="lg" icon={<Sparkles className="size-4" />} onClick={() => dispatch({ type: "view", view: "navegador" })}>
                Abrir o navegador
              </Btn>
              <Btn variant="outline" size="lg" icon={<GitCompare className="size-4" />} onClick={() => dispatch({ type: "view", view: "lab" })}>
                Ver o motor ao vivo
              </Btn>
              <span className="ml-1 flex items-center gap-1.5 text-[10.5px] text-dim">
                <Lock className="size-3 text-mint" /> tudo roda no dispositivo · sem conta · sem telemetria
              </span>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-4">
              {[
                { k: "5", l: "modos de re-renderização", i: Sparkles },
                { k: "6", l: "sites simulados nesta demo", i: Globe2 },
                { k: "100%", l: "local (zero rede na reescrita)", i: ServerOff },
                { k: "<20 ms", l: "por parágrafo neste protótipo", i: Gauge },
              ].map((s) => (
                <div key={s.l} className="rounded-lg border border-line bg-night2/60 px-2.5 py-2">
                  <s.i className="size-3.5 text-dim" />
                  <p className="m-0 mt-1 font-display text-lg font-bold text-ink">{s.k}</p>
                  <p className="m-0 text-[9px] leading-snug text-faint">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* problema */}
        <section className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="panel p-4">
            <p className="eyebrow mb-1.5">o problema</p>
            <h2 className="m-0 font-display text-[19px] font-semibold leading-snug text-ink">
              Todo mundo vê a mesma página. Nenhum cérebro é igual.
            </h2>
            <div className="mt-3 space-y-2.5 text-[11.5px] leading-relaxed text-dim">
              <p className="m-0">
                Um estudante de medicina e um paciente de 65 anos leem o mesmo artigo de saúde. Um precisa de terminologia
                técnica; o outro, de linguagem simples e calma. <span className="text-ink2">A página é idêntica.</span>
              </p>
              <p className="m-0">
                Você abre 14 abas para comprar um monitor. Cada site esconde o preço em outro lugar, inventa urgência e
                produz reviews em série. <span className="text-ink2">Seu cérebro gastou 80% da energia decodificando interfaces.</span>
              </p>
              <p className="m-0">
                A internet foi desenhada em 1996 com a premissa de que o layout resolve tudo para todos. O custo é a
                fricção cognitiva de 5 bilhões de pessoas — invisível e incalculável.
              </p>
            </div>
            <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
              {[
                { l: "Densidade média de anúncios", v: "+38% em 2 anos" },
                { l: "Tempo até a primeira distração", v: "11 s" },
                { l: "Custo de uma troca de contexto", v: "até 23 min" },
              ].map((s) => (
                <div key={s.l} className="rounded-md border border-line bg-panel2/50 px-2 py-1.5">
                  <p className="m-0 text-[10.5px] font-semibold text-ink">{s.v}</p>
                  <p className="m-0 text-[8.5px] leading-snug text-faint">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <p className="eyebrow mb-1.5">a tese</p>
            <h2 className="m-0 font-display text-[19px] font-semibold leading-snug text-ink">Quem controlar a camada, define a web.</h2>
            <div className="mt-3 space-y-2 text-[11.5px] leading-relaxed text-dim">
              <p className="m-0">
                Os sites não vão se adaptar individualmente a cada usuário — não há incentivo econômico. A única forma de
                personalizar a web é uma camada intermediária. Ela não existe.
              </p>
              <p className="m-0">
                O Parallax é o <span className="text-ink2">Cloudflare da cognição</span>: intercepta o que chega, reescreve
                para quem recebe e devolve controle. E é <span className="text-ink2">defensável</span> porque o produto não é
                o modelo — é o contexto acumulado do seu cérebro.
              </p>
            </div>
            <div className="mt-3 rounded-lg border border-vio/30 bg-vio/8 p-2.5">
              <p className="m-0 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-ink2">
                <Brain className="mt-0.5 size-3.5 shrink-0 text-vio" />
                Efeito de rede por confiança: quanto mais você usa, melhor ele entende você. E o entendimento mora no seu
                disco — não num data center.
              </p>
            </div>
          </div>
        </section>

        {/* modos */}
        <section className="mt-5">
          <div className="mb-2 flex items-end justify-between gap-2">
            <div>
              <p className="eyebrow mb-1">os cinco modos</p>
              <h2 className="m-0 font-display text-[19px] font-semibold text-ink">Um motor, cinco intenções</h2>
            </div>
            <span className="hidden text-[10px] text-dim sm:block">clique para ativar no protótipo →</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { id: "aprendizado" as const, icon: Brain, color: "#7c9cff", title: "Aprendizado", bullets: ["reescreve no seu nível", "tooltips gerados", "flashcards e quiz"] },
              { id: "pesquisa" as const, icon: Layers, color: "#7ce0b1", title: "Pesquisa", bullets: ["layout uniforme", "grafo entre fontes", "citação ABNT/APA"] },
              { id: "compra" as const, icon: Wallet, color: "#f0c987", title: "Compra", bullets: ["preço com histórico", "reviews filtradas", "dark patterns expostos"] },
              { id: "foco" as const, icon: Target, color: "#c7a6ff", title: "Foco", bullets: ["estímulo suprimido", "abas suavizadas", "timer adaptativo"] },
              { id: "calma" as const, icon: AudioLines, color: "#7fd1e8", title: "Calma", bullets: ["dessatura e reduz", "métricas escondidas", "feed finito"] },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  dispatch({ type: "mode", mode: m.id });
                  dispatch({ type: "view", view: "navegador" });
                }}
                className={cn(
                  "group rounded-xl border p-3 text-left transition hover:border-line2 hover:bg-panel2",
                  state.mode === m.id ? "border-vio/50 bg-panel2" : "border-line bg-panel/60"
                )}
              >
                <span className="grid size-7 place-items-center rounded-lg border" style={{ borderColor: `${m.color}44`, background: `${m.color}14`, color: m.color }}>
                  <m.icon className="size-3.5" />
                </span>
                <p className="m-0 mt-2 text-[12px] font-semibold text-ink">{m.title}</p>
                <ul className="m-0 mt-1 space-y-0.5 pl-3 text-[9.5px] leading-snug text-dim">
                  {m.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <span className="mt-2 flex items-center gap-1 text-[9px] text-faint group-hover:text-gold">
                  {state.mode === m.id ? "ativo agora" : "ativar"} <ArrowRight className="size-2.5" />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* antes e depois */}
        <section className="mt-5 panel p-4">
          <p className="eyebrow mb-1">o que muda, na prática</p>
          <h2 className="m-0 mb-3 font-display text-[19px] font-semibold text-ink">O mesmo site, três cérebros</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { mode: "iniciante", title: "Nível iniciante", text: "“Pressão alta é a força do sangue nas artérias acima do normal. Quase sempre não dói e não avisa.”", color: "#7ce0b1" },
              { mode: "intermediario", title: "Nível intermediário", text: "“A hipertensão é a elevação persistente da pressão nas artérias. Costuma ser assintomática — o que explica o subdiagnóstico.”", color: "#7c9cff" },
              { mode: "avancado", title: "Nível avançado", text: "“A hipertensão arterial designa elevação persistente da pressão sistêmica; assintomática na maioria dos casos, correlaciona-se com lesão endotelial progressiva.”", color: "#f0c987" },
            ].map((c) => (
              <div key={c.mode} className="rounded-lg border border-line bg-night2/60 p-3">
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold" style={{ color: c.color, borderColor: `${c.color}55`, background: `${c.color}12` }}>
                  <Check className="size-2.5" /> {c.title}
                </span>
                <p className="m-0 mt-2 font-serif text-[12.5px] leading-relaxed text-ink2">{c.text}</p>
              </div>
            ))}
          </div>
          <p className="m-0 mt-2.5 text-[10px] leading-relaxed text-faint">
            Texto de exemplo do site “Clínica Aberta” neste protótipo. No produto, a variação vem de um LLM local de 3B
            quantizado, com streaming por parágrafo e fallback opcional em nuvem.
          </p>
        </section>

        {/* arquitetura */}
        <section className="mt-5 panel p-4">
          <p className="eyebrow mb-1">arquitetura</p>
          <h2 className="m-0 mb-3 font-display text-[19px] font-semibold text-ink">Motor, grafo e memória — todos no dispositivo</h2>
          <div className="grid gap-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "DOM Rewriter",
                lines: ["MutationObserver seletivo (não no documento inteiro)", "debounce 120 ms + leitura agendada em rAF", "Shadow DOM + CSS custom properties", "cache por URL + hash do bloco"],
                color: "#7c9cff",
              },
              {
                icon: GitCompare,
                title: "Intent + Cognition",
                lines: ["parser de intenção por sinais (local)", "estado cognitivo por rolagem, abas e hora", "explica o porquê de cada decisão", "nenhum dado de entrada sai daqui"],
                color: "#f0c987",
              },
              {
                icon: Layers,
                title: "Knowledge Graph",
                lines: ["nós: conceito, fonte, produto, tarefa", "arestas: coocorrência, citação, contradição", "layout determinístico em anéis", "exportável em JSON"],
                color: "#7ce0b1",
              },
            ].map((b) => (
              <div key={b.title} className="rounded-lg border border-line bg-night2/50 p-3">
                <div className="flex items-center gap-1.5">
                  <span className="grid size-6 place-items-center rounded-md border" style={{ borderColor: `${b.color}44`, background: `${b.color}12`, color: b.color }}>
                    <b.icon className="size-3.5" />
                  </span>
                  <span className="text-[11.5px] font-semibold text-ink">{b.title}</span>
                </div>
                <ul className="m-0 mt-2 space-y-1 pl-3.5 text-[10px] leading-snug text-dim">
                  {b.lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-2 overflow-hidden rounded-lg border border-line bg-[#07090e] p-3">
            <pre className="m-0 overflow-x-auto text-[9px] leading-relaxed text-dim">
{`content script ──► observa content root ──► enfileira blocos
        │                                      │
        ▼                                      ▼
  parser de intenção                 reescritor local (nível/intensidade)
        │                                      │
        ▼                                      ▼
  detector cognitivo ────────────► renderer (Shadow DOM + CSS vars)
        │                                      │
        ▼                                      ▼
  grafo de conceitos ◄────────────  memória de leitura (flashcards, citações)`}
            </pre>
          </div>
        </section>

        {/* MVP / roadmap */}
        <section className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="panel p-4">
            <SectionTitle icon={<Timer className="size-3.5" />} title="o que já está neste protótipo" hint="tudo clicável, tudo local" />
            <ul className="m-0 space-y-1.5 text-[11px] leading-relaxed text-dim">
              {[
                "motor de reescrita com 3 níveis, intensidade e diff auditável",
                "5 modos que re-renderizam a página de verdade",
                "grafo de conhecimento entre páginas e sites",
                "detector de dark patterns com evidência citada",
                "flashcards, quiz e revisão espaçada",
                "citações ABNT / APA / BibTeX com exportação",
                "detector de estado cognitivo e de intenção",
                "modo foco com abas suavizadas + respiração 60 s",
                "configurações e memória exportáveis em JSON",
                "extensão Chrome MV3 que roda o mesmo pipeline",
              ].map((l) => (
                <li key={l} className="flex items-start gap-1.5">
                  <Check className="mt-0.5 size-3 shrink-0 text-mint" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-4">
            <SectionTitle icon={<LineChart className="size-3.5" />} title="o que vem depois" hint="roadmap de 3 anos" />
            <div className="space-y-2">
              {[
                { q: "2025 Q3–Q4", t: "MVP Chrome MV3 + lançamento", done: true },
                { q: "2026 Q1", t: "Firefox, Edge e Safari", done: false },
                { q: "2026 Q2", t: "app desktop (Tauri) com LLM 100% local", done: false },
                { q: "2026 Q3", t: "eye-tracking via webcam (MediaPipe) — opt-in", done: false },
                { q: "2026 Q4", t: "Parallax Mobile (WebView customizado)", done: false },
                { q: "2027", t: "API pública + AR/VR + camada de SO", done: false },
              ].map((r) => (
                <div key={r.q} className="flex items-start gap-2">
                  <span className={cn("mt-1 grid size-3.5 shrink-0 place-items-center rounded-full border text-[8px]", r.done ? "border-mint/60 bg-mint/20 text-mint" : "border-line text-faint")}>
                    {r.done ? <Check className="size-2.5" /> : ""}
                  </span>
                  <div className="min-w-0">
                    <p className="m-0 text-[9px] font-semibold uppercase tracking-wider text-faint">{r.q}</p>
                    <p className="m-0 text-[10.5px] leading-snug text-ink2">{r.t}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* modelo de negócio */}
        <section className="mt-5 panel p-4">
          <p className="eyebrow mb-1">modelo</p>
          <h2 className="m-0 mb-3 font-display text-[19px] font-semibold text-ink">Grátis para quem precisa, caro para quem escala</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Free", price: "R$ 0", items: ["modo leitura + foco básico", "50 reescritas/dia", "grafo local ilimitado"], accent: "#8b93a7" },
              { name: "Pro", price: "R$ 29/mês", items: ["todos os modos", "IA local ilimitada", "flashcards e citações"], accent: "#7c9cff", best: true },
              { name: "Student", price: "R$ 9/mês", items: ["tudo do Pro", "verificação de vínculo", "grupos de estudo"], accent: "#7ce0b1" },
              { name: "Teams", price: "R$ 59/assento", items: ["painel de produtividade", "SSO e políticas", "dados anonimizados"], accent: "#f0c987" },
            ].map((p) => (
              <div key={p.name} className={cn("relative rounded-xl border p-3", p.best ? "border-vio/50 bg-vio/8" : "border-line bg-panel2/40")}>
                {p.best && <span className="absolute -top-2 right-2 rounded-full bg-vio px-1.5 py-0.5 text-[8px] font-bold text-[#0a0d16]">recomendado</span>}
                <p className="m-0 text-[10px] font-bold uppercase tracking-wider" style={{ color: p.accent }}>
                  {p.name}
                </p>
                <p className="m-0 mt-0.5 font-display text-lg font-bold text-ink">{p.price}</p>
                <ul className="m-0 mt-1.5 space-y-0.5 pl-3 text-[9.5px] leading-snug text-dim">
                  {p.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-night2/50 px-2.5 py-2">
            <TrendingUp className="size-3.5 text-mint" />
            <p className="m-0 text-[10px] leading-relaxed text-dim">
              500k usuários free × 5% de conversão = <span className="text-ink2">R$ 725k/mês</span> · 50 empresas × 100 assentos ={" "}
              <span className="text-ink2">R$ 295k/mês</span> · total <span className="text-mint">~R$ 12M/ano</span> com equipe de 5–8 pessoas.
            </p>
          </div>
        </section>

        {/* riscos */}
        <section className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Gauge, t: "Performance", d: "observer seletivo, debounce e cache por domínio. Sem medir o DOM no callback.", level: "alta" },
            { icon: ShieldCheck, t: "Privacidade", d: "IA local por padrão. Nuvem só com autorização e apenas o delta do texto.", level: "alta" },
            { icon: Puzzle, t: "Compatibilidade", d: "500 sites com regras + fallback genérico por densidade de texto.", level: "média" },
            { icon: ScanEye, t: "Precisão da IA", d: "variações pré-compiladas, feedback do usuário e validação de números.", level: "média" },
          ].map((r) => (
            <div key={r.t} className="rounded-xl border border-line bg-panel/60 p-3">
              <div className="flex items-center gap-1.5">
                <r.icon className="size-3.5 text-dim" />
                <span className="text-[11px] font-semibold text-ink">{r.t}</span>
                <span className={cn("ml-auto rounded px-1 py-0.5 text-[8px] font-semibold uppercase", r.level === "alta" ? "bg-rose/15 text-rose" : "bg-gold/15 text-gold")}>
                  {r.level}
                </span>
              </div>
              <p className="m-0 mt-1 text-[9.5px] leading-relaxed text-dim">{r.d}</p>
            </div>
          ))}
        </section>

        {/* o que este protótipo não é */}
        <section className="mt-5 rounded-2xl border border-line bg-panel p-4">
          <SectionTitle icon={<Eye className="size-3.5" />} title="honestidade técnica" hint="o que é real aqui e o que é simulação" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="m-0 mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-mint">
                <Check className="size-3" /> real
              </p>
              <ul className="m-0 space-y-1 pl-3 text-[10px] leading-relaxed text-dim">
                <li>reescrita de texto, métricas e diff por bloco</li>
                <li>detecção de dark patterns com evidência</li>
                <li>grafo, citações, quiz e revisão espaçada</li>
                <li>estado cognitivo por sinais de interação</li>
                <li>extensão Chrome MV3 carregável com o mesmo motor</li>
              </ul>
            </div>
            <div>
              <p className="m-0 mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gold">
                <X className="size-3" /> simulado (e por quê)
              </p>
              <ul className="m-0 space-y-1 pl-3 text-[10px] leading-relaxed text-dim">
                <li>os sites são páginas de demonstração, não a web real</li>
                <li>as variações de nível usam texto pré-compilado no lugar de um LLM de 3B</li>
                <li>preços, histórico e reviews são dados sintéticos</li>
                <li>não há eye-tracking — o estado vem de interação, não de câmera</li>
                <li>nada é compartilhado entre dispositivos: sem backend</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge color="#7ce0b1"><Cpu className="mr-1 inline size-2.5" /> Shadow DOM</Badge>
            <Badge color="#7c9cff">Manifest V3</Badge>
            <Badge color="#f0c987">ONNX Runtime Web (roadmap)</Badge>
            <Badge color="#c7a6ff">WebGPU (roadmap)</Badge>
            <Badge color="#7fd1e8">localStorage / SQLite</Badge>
            <Badge color="#8b93a7"><MonitorSmartphone className="mr-1 inline size-2.5" />desktop-first</Badge>
            <span className="ml-auto text-[9px] text-faint">
              {Object.keys(SITES).length} sites simulados · {state.tabs.length} abas abertas · memória de {state.reads.length} leituras
            </span>
          </div>
        </section>

        {/* o resumo final */}
        <section className="relative mt-5 overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/10 via-panel to-vio/10 p-6 text-center">
          <p className="eyebrow mb-2">o resumo final</p>
          <p className="mx-auto m-0 max-w-2xl font-display text-[19px] font-medium leading-snug text-ink">
            O Parallax não é mais uma ferramenta de produtividade. É a primeira camada de inteligência entre o cérebro humano
            e a web — e o código da primeira versão cabe neste repositório.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Btn variant="gold" icon={<Sparkles className="size-4" />} onClick={() => dispatch({ type: "view", view: "navegador" })}>
              Explorar o protótipo
            </Btn>
            <Btn variant="outline" icon={<Building2 className="size-4" />} onClick={() => dispatch({ type: "view", view: "cerebro" })}>
              Ver a memória do sistema
            </Btn>
          </div>
          <p className="m-0 mt-3 text-[9.5px] text-dim">
            Rode <span className="mono text-gold">npm run dev</span> · carregue <span className="mono text-gold">extension/</span> no Chrome · nenhum dado sai do seu dispositivo
          </p>
        </section>

        <p className="m-0 py-5 text-center text-[9px] text-faint">
          Parallax v0.1 — protótipo construído no repositório Funcoes. Estado cognitivo: {COGNITIVE_META[state.mode === "calma" ? "fatigado" : "focado"].label}; memória local ativa.
        </p>
      </div>
    </div>
  );
}

