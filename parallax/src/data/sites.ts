import type { Level, SiteId } from "@/core/types";

/* ────────────────────────────────────────────────────────────────────────────
   Sites simulados
   Cada bloco guarda o texto canônico + variações prontas (o que um LLM cloud
   faria). O motor local reescreve o resto por heurística — e mostra o diff.
   Termos entre [[duplo colchete]] viram tooltip de glossário.
   ──────────────────────────────────────────────────────────────────────────── */

export type BlockKind =
  | "h2"
  | "h3"
  | "p"
  | "lead"
  | "quote"
  | "callout"
  | "list"
  | "stat"
  | "figure"
  | "ad"
  | "comments"
  | "video"
  | "product"
  | "specs";

export interface Block {
  kind: BlockKind;
  text?: string;
  items?: string[];
  caption?: string;
  /** variações de reescrita por nível (ground truth do "LLM") */
  variants?: Partial<Record<Level, string>>;
  /** para video: linhas de transcrição com timestamp */
  cues?: { t: string; text: string }[];
  /** para product: id no catálogo */
  productId?: string;
  /** para stat */
  value?: string;
  label?: string;
  tone?: "ok" | "warn" | "bad" | "info";
}

export interface PageRef {
  title: string;
  author?: string;
  year?: number;
  url: string;
  site: string;
}

export interface Page {
  id: string;
  siteId: SiteId;
  title: string;
  url: string;
  kicker?: string;
  byline?: { author: string; role: string; date: string };
  /** minuto de leitura estimado no original */
  blocks: Block[];
  /** termos → definição (tooltip + flashcards) */
  terms: { term: string; definition: string }[];
  /** conceitos para o grafo */
  concepts: string[];
  /** afirmações para o detector de contradição */
  claims?: { topic: string; text: string }[];
  refs?: PageRef[];
  /** palavras para a pílula de leitura */
  complexity?: number;
}

export interface Site {
  id: SiteId;
  name: string;
  host: string;
  tagline: string;
  accent: string;
  ink: string;
  bg: string;
  /** "editorial" | "social" | "commerce" | "video" | "news" | "health" */
  chrome: "editorial" | "social" | "commerce" | "video" | "news" | "health";
  homeId: string;
}

export const SITES: Record<SiteId, Site> = {
  wiki: {
    id: "wiki",
    name: "Wikipédia",
    host: "pt.wikipedia.org",
    tagline: "a enciclopédia livre",
    accent: "#3b6ea5",
    ink: "#202122",
    bg: "#ffffff",
    chrome: "editorial",
    homeId: "atencao",
  },
  devto: {
    id: "devto",
    name: "dev.to",
    host: "dev.to",
    tagline: "comunidade de programação",
    accent: "#3b49df",
    ink: "#08090a",
    bg: "#f7f8fa",
    chrome: "editorial",
    homeId: "dom-pesado",
  },
  health: {
    id: "health",
    name: "Clínica Aberta",
    host: "clinicaaberta.com.br",
    tagline: "saúde em linguagem humana",
    accent: "#0f766e",
    ink: "#1c2a2a",
    bg: "#f8fbfa",
    chrome: "health",
    homeId: "hipertensao",
  },
  shop: {
    id: "shop",
    name: "MegaShop",
    host: "megashop.com.br",
    tagline: "ofertas relâmpago todos os dias",
    accent: "#e11d48",
    ink: "#111827",
    bg: "#f3f4f6",
    chrome: "commerce",
    homeId: "monitor-oferta",
  },
  yt: {
    id: "yt",
    name: "YouTube",
    host: "youtube.com",
    tagline: "assista, aprenda, repita",
    accent: "#ff0033",
    ink: "#0f0f0f",
    bg: "#ffffff",
    chrome: "video",
    homeId: "transformer-aula",
  },
  news: {
    id: "news",
    name: "Folha do Tempo",
    host: "folhadotempo.com.br",
    tagline: "informação que respeita seu tempo",
    accent: "#b91c1c",
    ink: "#1a1a1a",
    bg: "#fffdf8",
    chrome: "news",
    homeId: "economia-atencao",
  },
};

/* ─────────────────────────────── páginas ─────────────────────────────────── */

export const PAGES: Page[] = [
  /* ══════════════════════════ WIKIPÉDIA ══════════════════════════ */
  {
    id: "atencao",
    siteId: "wiki",
    title: "Janela de atenção",
    url: "https://pt.wikipedia.org/wiki/Janela_de_atenção",
    kicker: "Da Wikipédia, a enciclopédia livre",
    blocks: [
      {
        kind: "lead",
        text: "A [[janela de atenção]] é o intervalo em que uma pessoa consegue manter o foco numa tarefa antes de a [[carga cognitiva]] exceder a capacidade de processamento da [[memória de trabalho]]. O conceito é medido por tarefas de [[atenção sustentada]] e não corresponde a um número fixo: varia com sono, motivação, complexidade do estímulo e familiaridade com o conteúdo.",
        variants: {
          iniciante:
            "A janela de atenção é o tempo em que você consegue ficar concentrado numa tarefa. Ela muda de pessoa para pessoa e de momento para momento: depende de sono, vontade, dificuldade do assunto e costume.",
          avancado:
            "A janela de atenção designa o intervalo de manutenção do foco antes de a carga cognitiva ultrapassar a capacidade alocada à memória de trabalho, sendo operacionalizada por paradigmas de atenção sustentada (SART, CPT) e modulada por sono, motivação intrínseca, complexidade do estímulo e expertise prévia.",
        },
      },
      { kind: "h2", text: "História do conceito" },
      {
        kind: "p",
        text: "As primeiras medições sistemáticas de [[atenção sustentada]] datam do pós-guerra, quando psicólogos aplicaram tarefas de vigilância a operadores de radar. O achado central: o desempenho decai de forma previsível ao longo do tempo, mesmo com incentivo financeiro. A curva de decremento ficou conhecida como [[efeito de vigilância]].",
        variants: {
          iniciante:
            "Os primeiros estudos vieram da época do radar. Psicólogos notaram que quem vigiava a tela por muito tempo errava mais, mesmo ganhando dinheiro para acertar. Esse cansaço tem nome: efeito de vigilância.",
        },
      },
      {
        kind: "callout",
        text: "Não existe um “tempo de atenção” universal. Existe um orçamento de atenção que muda ao longo do dia — e que interfaces podem gastar por você.",
        tone: "info",
      },
      { kind: "h2", text: "Mecanismos neurais" },
      {
        kind: "p",
        text: "Modelos de [[controle executivo]] descrevem três redes parcialmente dissociáveis: alerta, orientação e controle inibitório. A rede de alerta regula o nível tônico de vigilância; a de orientação seleciona estímulos; a de controle inibitório suprime respostas prepotentes. O [[córtex pré-frontal dorsolateral]] sustenta a manutenção do objetivo, enquanto o [[núcleo accumbens]] modula o valor de recompensa associado à tarefa.",
        variants: {
          iniciante:
            "O cérebro tem três sistemas de atenção: um que te mantém acordado, um que escolhe no que prestar atenção e um que segura o impulso de trocar de assunto. A parte da frente do cérebro (pré-frontal) segura o objetivo; o centro de recompensa decide se a tarefa vale o esforço.",
          avancado:
            "Modelos de controle executivo distinguem redes de alerta, orientação e controle inibitório com correlatos neuroanatômicos parcialmente dissociáveis (Posner & Petersen). A manutenção de metas recrutaria o CPFDL, enquanto o valor esperado da tarefa é sinalizado por circuitos estriatais dopaminérgicos.",
        },
      },
      { kind: "h2", text: "Atenção e economia da informação" },
      {
        kind: "p",
        text: "Com a [[economia da atenção]], o custo de capturar um instante de foco caiu a quase zero para quem publica. A consequência medida é um deslocamento do custo para o leitor: cada [[efeito de troca de contexto|troca de contexto]] tem um custo de reconfiguração que pode chegar a 23 minutos em trabalho cognitivo não estruturado.",
        variants: {
          iniciante:
            "Hoje qualquer site consegue chamar sua atenção de graça. Quem paga a conta é você: cada vez que você troca de aba, seu cérebro gasta tempo para voltar ao ponto. Em tarefas difíceis, isso pode levar uns 20 minutos.",
        },
      },
      {
        kind: "ad",
        text: "Curso: “Aprenda a se concentrar em 7 dias” — 12x R$ 149",
      },
      { kind: "h2", text: "Críticas e limites" },
      {
        kind: "p",
        text: "Parte da literatura considera a metáfora de “orçamento” excessivamente econômica. Estudos ecológicos mostram que a [[atenção sustentada]] depende menos de um estoque finito e mais de [[autorregulação]] e do desenho do ambiente. A conclusão prática é a mesma: ambientes menos hostis reduzem a [[fadiga cognitiva]].",
        variants: {
          avancado:
            "A metáfora orçamentária é contestada por abordagens ecológicas: a atenção sustentada dependeria menos de um recurso finito e mais de autorregulação situada e do desenho do ambiente informacional (affordances).",
        },
      },
      {
        kind: "quote",
        text: "“A atenção não é um recurso que se acumula; é uma prática que se protege.” — resumo da literatura ecológica",
      },
      { kind: "h3", text: "Ver também" },
      {
        kind: "list",
        items: ["[[Carga cognitiva]]", "[[Memória de trabalho]]", "[[Economia da atenção]]", "[[Fluxo (psicologia)]]"],
      },
    ],
    terms: [
      { term: "janela de atenção", definition: "Intervalo de foco antes de a carga cognitiva passar da capacidade da memória de trabalho." },
      { term: "carga cognitiva", definition: "Quantidade de esforço mental usada ao mesmo tempo para entender e manipular informação." },
      { term: "memória de trabalho", definition: "Sistema que mantém poucos itens ativos por segundos — a 'mesa de trabalho' do pensamento." },
      { term: "atenção sustentada", definition: "Capacidade de manter o foco numa tarefa ao longo do tempo." },
      { term: "controle executivo", definition: "Conjunto de processos que planeja, inibe impulsos e alterna entre tarefas." },
      { term: "córtex pré-frontal dorsolateral", definition: "Região frontal ligada ao planejamento e à manutenção de objetivos." },
      { term: "núcleo accumbens", definition: "Estrutura ligada à motivação e ao prazer antecipado." },
      { term: "economia da atenção", definition: "Mercado em que a atenção humana é o recurso escasso disputado." },
      { term: "fadiga cognitiva", definition: "Queda de desempenho após esforço mental prolongado." },
      { term: "autorregulação", definition: "Capacidade de ajustar o próprio comportamento para atingir metas." },
    ],
    concepts: ["Atenção sustentada", "Carga cognitiva", "Memória de trabalho", "Economia da atenção", "Fadiga cognitiva", "Context switching"],
    claims: [
      {
        topic: "custo de troca de contexto",
        text: "Trocar de contexto em trabalho cognitivo pode custar até 23 minutos de reconfiguração.",
      },
      {
        topic: "custo de troca de contexto",
        text: "O custo de alternância é pequeno em tarefas familiares e bem estruturadas (< 30 segundos).",
      },
    ],
    refs: [
      { title: "Attention and effort", author: "Kahneman, D.", year: 1973, url: "https://doi.org/10.1017/CBO9780511813146", site: "Prentice-Hall" },
      { title: "The attention economy: an overview", author: "Davenport, T.; Beck, J.", year: 2001, url: "https://mitpress.mit.edu/9780262041966/", site: "MIT Press" },
      { title: "The cost of interrupted work: more speed and stress", author: "Mark, G.; Gudith, D.; Klocke, U.", year: 2008, url: "https://dl.acm.org/doi/10.1145/1357054.1357072", site: "CHI" },
    ],
  },
  {
    id: "recompensa",
    siteId: "wiki",
    title: "Recompensa variável",
    url: "https://pt.wikipedia.org/wiki/Reforço_intermitente",
    kicker: "Da Wikipédia, a enciclopédia livre",
    blocks: [
      {
        kind: "lead",
        text: "O [[reforço intermitente]] é um [[esquema de reforço]] em que apenas parte das respostas é recompensada. Esquemas de [[razão variável]] produzem as maiores taxas de resposta e a maior resistência à extinção — o mesmo mecanismo que sustenta caça-níqueis, notificações e [[feed infinito]].",
        variants: {
          iniciante:
            "Recompensa variável é quando você não sabe se vai ganhar algo ao fazer uma ação. É o que torna cassinos e notificações tão difíceis de largar: às vezes vem prêmio, às vezes não.",
        },
      },
      { kind: "h2", text: "Esquemas de reforço" },
      {
        kind: "p",
        text: "Skinner descreveu quatro esquemas básicos: razão fixa, razão variável, intervalo fixo e intervalo variável. A [[razão variável]] é a mais poderosa para instalar comportamento persistente porque a incerteza aumenta o valor subjetivo da próxima tentativa ([[desconto pela incerteza]]).",
        variants: {
          iniciante:
            "Existem quatro formas de dar recompensa: sempre, às vezes, depois de um tempo fixo ou depois de um tempo imprevisível. A imprevisível é a que mais vicia, porque a dúvida faz a próxima tentativa parecer mais valiosa.",
        },
      },
      {
        kind: "callout",
        text: "O feed infinito não é aleatório: ele é um esquema de razão variável com latência otimizada. A rolagem é o comportamento; o prêmio é a próxima novidade.",
        tone: "warn",
      },
      { kind: "h2", text: "No desenho de produto" },
      {
        kind: "p",
        text: "[[Gatilhos de engajamento]] — streak, badge, contador de curtidas — transformam recompensas sociais em [[reforço intermitente]]. Pesquisas com [[rastreamento ocular]] mostram que a atenção se desvia para métricas de vaidade mesmo quando o usuário declara querer lê-las.",
        variants: {
          iniciante:
            "Notificações, ofensivas e curtidas funcionam como prêmios imprevisíveis. O olho vai para os números mesmo quando você só queria ler o texto.",
        },
      },
      { kind: "h2", text: "Contrapontos" },
      {
        kind: "p",
        text: "A leitura estrita de laboratório não se transfere automaticamente para telas. Revisões de 2023 apontam que a [[resistência à extinção]] depende de contexto e de custo de resposta: quando cada tentativa custa caro, o padrão colapsa.",
      },
      { kind: "ad", text: "“Você é viciado em celular? Faça o teste.” — 8 perguntas, 1 resultado chocante." },
    ],
    terms: [
      { term: "reforço intermitente", definition: "Recompensa dada só em parte das vezes, o que torna o hábito mais resistente a acabar." },
      { term: "esquema de reforço", definition: "Regra que define quando uma recompensa aparece." },
      { term: "razão variável", definition: "Recompensa após um número imprevisível de respostas." },
      { term: "feed infinito", definition: "Lista que nunca termina e carrega mais conteúdo ao rolar." },
      { term: "resistência à extinção", definition: "Quanto um comportamento insiste depois que a recompensa para." },
    ],
    concepts: ["Recompensa variável", "Feed infinito", "Gamificação", "Gatilhos de engajamento"],
    refs: [
      { title: "Schedules of reinforcement", author: "Ferster, C.; Skinner, B.", year: 1957, url: "https://psycnet.apa.org/record/1958-01214-000", site: "Appleton-Century-Crofts" },
    ],
  },
  {
    id: "memoria-trabalho",
    siteId: "wiki",
    title: "Memória de trabalho",
    url: "https://pt.wikipedia.org/wiki/Memória_de_trabalho",
    kicker: "Da Wikipédia, a enciclopédia livre",
    blocks: [
      {
        kind: "lead",
        text: "A [[memória de trabalho]] é o sistema de capacidade limitada que mantém e manipula informação por curtos períodos. O modelo de Baddeley e Hitch propõe um executivo central, uma alça fonológica, um esboço visuoespacial e um buffer episódico. A capacidade clássica estimada é de 4 ± 1 blocos ([[número mágico]] revisado).",
        variants: {
          iniciante:
            "Memória de trabalho é a 'mesa' onde você segura ideias enquanto pensa. Cabe pouca coisa: mais ou menos 4 itens por vez. Se a página enche a mesa de coisas, você perde o fio.",
        },
      },
      { kind: "h2", text: "Por que interfaces lotadas cansam" },
      {
        kind: "p",
        text: "Cada elemento visual concorrente compete por recursos atencionais finitos. Quando a [[carga extrínseca]] sobe — banners, autoplay, modais — sobra menos [[carga germânica]] para o aprendizado real. O efeito é mensurável em compreensão de leitura e em tempo de recuperação da informação.",
        variants: {
          iniciante:
            "Cada banner, vídeo que toca sozinho e janela que pula na tela ocupa parte da sua mesa mental. Com a mesa cheia, sobra menos espaço para entender o assunto.",
        },
      },
      {
        kind: "stat",
        value: "4 ± 1",
        label: "blocos de informação simultâneos na memória de trabalho",
      },
      { kind: "h2", text: "Implicações para reescrita automática" },
      {
        kind: "p",
        text: "Simplificar texto sem reorganizar a estrutura pode reduzir a [[carga extrínseca]] mas também remover [[andaimagem]] necessária. A diretriz prática é preservar a hierarquia lógica e reduzir apenas a densidade lexical, mantendo [[sinais de recuperação]] (títulos, resumos, palavras-chave).",
        variants: {
          avancado:
            "Reescrita com preservação hierárquica reduz carga extrínseca sem colapsar a andaimagem semântica; recomenda-se compressão lexical com manutenção de sinais de recuperação (headings, sumários, termos-âncora).",
        },
      },
    ],
    terms: [
      { term: "memória de trabalho", definition: "Espaço mental de curto prazo onde você manipula informação." },
      { term: "número mágico", definition: "Estimativa de 7±2 itens, revisada para cerca de 4." },
      { term: "carga extrínseca", definition: "Esforço mental gasto com a forma da informação, não com o conteúdo." },
      { term: "carga germânica", definition: "Esforço útil, aquele que constrói entendimento." },
      { term: "andaimagem", definition: "Apoios temporários que ajudam a aprender algo novo." },
    ],
    concepts: ["Memória de trabalho", "Carga cognitiva", "Design de informação"],
  },

  /* ══════════════════════════ DEV.TO ══════════════════════════ */
  {
    id: "dom-pesado",
    siteId: "devto",
    title: "Por que sua extensão de navegador trava a aba (e como corrigir)",
    url: "https://dev.to/parallax/por-que-sua-extensao-trava-a-aba-3k1",
    kicker: "#performance · #extensions · 9 min de leitura",
    byline: { author: "Marina Duarte", role: "engenheira de plataforma", date: "11 nov 2026" },
    blocks: [
      {
        kind: "lead",
        text: "Toda extensão que reescreve o DOM enfrenta o mesmo inimigo: o [[MutationObserver]] disparando milhares de vezes por segundo em páginas que se atualizam sozinhas. O resultado é [[layout thrashing]], [[reflow]] em cascata e uma aba que aquece o processador. A solução não é observar menos — é observar melhor.",
        variants: {
          iniciante:
            "Se a sua extensão mexe na página, ela precisa saber quando a página muda. Mas em sites modernos a página muda o tempo todo. Se você reage a todas as mudanças, o navegador trava. O segredo é reagir só ao que importa.",
        },
      },
      { kind: "h2", text: "1. O inimigo invisível" },
      {
        kind: "p",
        text: "Um [[MutationObserver]] escutando `subtree: true` numa SPA de notícias recebe, em média, 1.400 notificações por minuto. Cada callback que lê `offsetHeight` força o navegador a recalcular o layout ([[reflow síncrono]]). O ciclo ler → escrever → ler é o que transforma uma extensão inofensiva em aquecedor de CPU.",
        variants: {
          iniciante:
            "Um observador de mudanças ligado em toda a página recebe mais de mil avisos por minuto em sites de notícia. Se o código mede a tela a cada aviso, o navegador recalcula o layout inteiro toda vez — e trava.",
          avancado:
            "Observers com subtree em SPAs noticiosas entregam ~1.4k mutações/min. Qualquer leitura geométrica dentro do callback (offsetHeight, getBoundingClientRect) dispara layout síncrono; o ciclo read-write-read é a causa raiz do thrashing.",
        },
      },
      {
        kind: "callout",
        text: "Regra de ouro: nunca meça o DOM dentro do callback do observer. Agende com requestAnimationFrame e bata apenas uma leitura por frame.",
        tone: "warn",
      },
      { kind: "h2", text: "2. Observer seletivo" },
      {
        kind: "p",
        text: "Em vez de observar o documento inteiro, observe os [[content roots]] identificados por heurística (maior ancestral com densidade de texto acima de 40%). Combine `childList` com filtro de relevância e ignore nós com `aria-hidden`, tamanho zero ou dentro de `iframe` cross-origin.",
        variants: {
          iniciante:
            "Não vigie o site todo. Descubra qual parte da página tem o texto principal e vigie só ela. Ignore menus, anúncios e partes escondidas.",
        },
      },
      {
        kind: "list",
        items: [
          "Filtre por densidade de texto (> 40%) antes de observar.",
          "Agrupe notificações com debounce de 120 ms e um Set de nós alterados.",
          "Use [[IdleDeadline]] para trabalho pesado fora do caminho crítico.",
          "Desligue o observer quando a aba está oculta (`visibilitychange`).",
        ],
      },
      { kind: "h2", text: "3. Onde a IA entra" },
      {
        kind: "p",
        text: "Modelos locais de 3B quantizados em [[ONNX Runtime Web]] rodam em 40–90 tokens/s em WebGPU — o suficiente para reescrever um parágrafo por vez sem bloquear a thread principal. A arquitetura correta é um [[Web Worker]] com fila priorizada e cancelamento por `AbortSignal`.",
        variants: {
          iniciante:
            "Uma IA pequena pode rodar dentro do navegador. Ela não é instantânea: leva alguns segundos por parágrafo. Por isso ela roda num processo separado, para não travar a página enquanto pensa.",
          avancado:
            "Modelos 3B quantizados (Q4) em ORT Web/WebGPU sustentam 40–90 tok/s; o requisito de UX é streaming por parágrafo com fila priorizada, cancelamento cooperativo e backpressure por visibility state.",
        },
      },
      {
        kind: "quote",
        text: "“Se a sua extensão aparece no monitor de atividades como ‘Google Chrome Helper (Renderer)’, você já perdeu.”",
      },
      { kind: "h3", text: "Checklist final" },
      {
        kind: "list",
        items: ["Observer escopado", "Leitura agendada", "Worker para IA", "Cache por URL + hash do bloco", "Kill switch por site"],
      },
    ],
    terms: [
      { term: "MutationObserver", definition: "API do navegador que avisa quando o DOM muda." },
      { term: "layout thrashing", definition: "Alternar leituras e escritas de layout, forçando recálculos caros." },
      { term: "reflow", definition: "Recálculo da posição e tamanho dos elementos na tela." },
      { term: "content roots", definition: "Elementos que concentram o texto principal de uma página." },
      { term: "IdleDeadline", definition: "Objeto que informa quanto tempo o navegador tem livre para trabalho extra." },
      { term: "ONNX Runtime Web", definition: "Runtime que executa modelos de IA no navegador via WebAssembly/WebGPU." },
      { term: "Web Worker", definition: "Thread separada que roda código sem travar a interface." },
      { term: "AbortSignal", definition: "Mecanismo para cancelar operações assíncronas." },
    ],
    concepts: ["MutationObserver", "Performance no DOM", "IA local no navegador", "Manifest V3", "WebGPU"],
    claims: [
      {
        topic: "IA local no navegador",
        text: "Modelos 3B quantizados rodam a 40–90 tokens/s em WebGPU, suficiente para reescrever em tempo real.",
      },
      {
        topic: "IA local no navegador",
        text: "Modelos acima de 1B são lentos demais no navegador: abaixo de 5 tok/s em hardware de 2025.",
      },
    ],
    refs: [
      { title: "MutationObserver API", author: "WHATWG", year: 2024, url: "https://dom.spec.whatwg.org/#mutation-observers", site: "DOM Standard" },
      { title: "WebGPU best practices", author: "W3C GPU WG", year: 2026, url: "https://www.w3.org/TR/webgpu/", site: "W3C" },
      { title: "ONNX Runtime Web: performance guide", author: "Microsoft", year: 2025, url: "https://onnxruntime.ai/docs/tutorials/web/", site: "ONNX Runtime" },
    ],
  },
  {
    id: "llm-local",
    siteId: "devto",
    title: "Rodando um LLM de 3B no navegador: o que ninguém te conta",
    url: "https://dev.to/parallax/llm-3b-no-navegador-2m4p",
    kicker: "#ai · #wasm · #privacidade · 12 min de leitura",
    byline: { author: "Caio Prado", role: "pesquisador de sistemas", date: "9 nov 2026" },
    blocks: [
      {
        kind: "lead",
        text: "Quantização Q4, [[WebGPU]], [[KV cache]] e um navegador que pode ser fechado no meio da inferência. Rodar um LLM localmente no cliente é viável — mas exige engenharia de [[memory footprint]] antes de qualquer prompt.",
        variants: {
          iniciante:
            "É possível rodar uma IA pequena direto no seu computador, dentro do navegador. Ela não precisa de internet e nada é enviado para fora. Mas ela precisa de memória, energia e paciência.",
        },
      },
      { kind: "h2", text: "Orçamento de memória" },
      {
        kind: "p",
        text: "Um modelo de 3,2B parâmetros em Q4_K_M ocupa ~2,1 GB. Somando weights, KV cache para 4k de contexto (~600 MB) e buffers do runtime, o piso prático é 3,5 GB de VRAM/[[memória unificada]]. Abaixo disso, o driver começa a paginar e a latência explode.",
        variants: {
          iniciante:
            "O modelo ocupa mais ou menos 2 GB. Com o contexto da conversa, chega a 3,5 GB. Se o computador não tiver isso livre, o sistema empresta do disco e tudo fica lento.",
        },
      },
      {
        kind: "stat",
        value: "40–90 tok/s",
        label: "modelo 3B Q4 em WebGPU (M2 / RTX 3060)",
      },
      { kind: "h2", text: "Quando faz sentido" },
      {
        kind: "p",
        text: "Para reescrita de parágrafo, resumo curto e classificação de intenção, o modelo local vence: latência de rede zero, custo marginal zero e [[privacidade por construção]]. Para raciocínio longo, contexto de 200k ou geração de código complexo, o fallback em nuvem ainda é indispensável.",
        variants: {
          iniciante:
            "Para tarefas curtas, a IA local é melhor: é instantânea, grátis e privada. Para perguntas complexas ou textos enormes, ainda vale usar um serviço na nuvem.",
          avancado:
            "Local ganha em tarefas de baixa entropia e alta frequência (reescrita, classificação, sumarização curta): latência de rede nula e custo marginal ~0 com garantia de privacidade. Cloud mantém vantagem em raciocínio multi-etapa e contextos longos.",
        },
      },
      {
        kind: "callout",
        text: "Arquitetura híbrida é a resposta: local para 90% das operações, nuvem só quando o usuário autoriza explicitamente — e nunca com o texto inteiro, apenas o delta.",
        tone: "info",
      },
      { kind: "h2", text: "O que ainda dói" },
      {
        kind: "list",
        items: [
          "Primeiro carregamento: 2 GB de download (resolve com cache em OPFS).",
          "Sem suporte a WebGPU em ~30% dos dispositivos móveis.",
          "Bateria: inferência contínua consome 4–7 W.",
          "Qualidade: um 3B alucina mais que um 70B — exigir validação para números e citações.",
        ],
      },
      {
        kind: "p",
        text: "A conclusão é menos empolgante e mais útil: [[IA local no navegador]] não substitui a nuvem — ela absorve o tráfego de fundo. É a diferença entre ter um estagiário no dispositivo e contratar um consultor por minuto.",
        variants: {
          iniciante:
            "A IA local não substitui a nuvem. Ela faz o trabalho do dia a dia, como um assistente que mora no seu computador. Para o trabalho pesado, você ainda chama alguém de fora.",
        },
      },
    ],
    terms: [
      { term: "WebGPU", definition: "API que dá à página acesso direto à placa de vídeo." },
      { term: "KV cache", definition: "Memória que guarda o contexto já processado para não repetir cálculo." },
      { term: "memory footprint", definition: "Quanta memória um programa ocupa enquanto roda." },
      { term: "privacidade por construção", definition: "Privacidade garantida pelo desenho — os dados nunca saem do dispositivo." },
      { term: "IA local no navegador", definition: "Executar modelos de IA dentro do navegador, sem servidor." },
    ],
    concepts: ["IA local no navegador", "WebGPU", "Quantização", "Privacidade", "LLM"],
    claims: [
      {
        topic: "latência de reescrita",
        text: "Reescrever um parágrafo com um modelo local leva 8 segundos, o que inviabiliza reescrever em tempo real.",
      },
    ],
    refs: [
      { title: "LLM in a browser: benchmark report", author: "Parallax Labs", year: 2026, url: "https://example.org/report", site: "Parallax" },
    ],
  },

  /* ══════════════════════════ SAÚDE ══════════════════════════ */
  {
    id: "hipertensao",
    siteId: "health",
    title: "Hipertensão: quando o coração trabalha demais",
    url: "https://clinicaaberta.com.br/hipertensao",
    kicker: "CARDIOLOGIA · 6 min de leitura · revisado por Dra. Lúcia Menezes",
    byline: { author: "Dr. André Salles", role: "cardiologista", date: "4 nov 2026" },
    blocks: [
      {
        kind: "lead",
        text: "A [[hipertensão arterial]] é a elevação persistente da pressão nas artérias. Na maioria dos casos não dá sintomas — e é justamente por isso que metade das pessoas com pressão alta não sabe que tem. Medir é simples, barato e continua sendo o melhor exame.",
        variants: {
          iniciante:
            "Pressão alta é quando a força do sangue nas paredes das artérias fica acima do normal por muito tempo. Quase sempre não dói e não avisa. Muita gente tem e não sabe. Medir com um aparelho é rápido e barato.",
        },
      },
      { kind: "h2", text: "O que os números significam" },
      {
        kind: "p",
        text: "Considera-se hipertensão quando, em medições repetidas, a pressão é igual ou maior que 140/90 [[mmHg]]. Pressão entre 130/85 e 139/89 é chamada de [[pré-hipertensão]] e merece atenção, sobretudo com histórico familiar, diabetes ou doença renal.",
        variants: {
          iniciante:
            "O número de cima é a pressão quando o coração aperta (sístole) e o de baixo entre uma batida e outra (diástole). A partir de 140 por 90, em várias medições, já é pressão alta. Doze por oito e meio (130/85) é um sinal amarelo.",
        },
      },
      {
        kind: "callout",
        text: "Uma leitura alta isolada não é diagnóstico. Meça em momentos diferentes, com a beira do braço à altura do coração e sem café nos 30 minutos anteriores.",
        tone: "info",
      },
      { kind: "h2", text: "Por que ela machuca sem avisar" },
      {
        kind: "p",
        text: "A pressão elevada lesiona lentamente o [[endotélio]] e acelera a [[aterosclerose]]. O resultado aparece anos depois como infarto, AVC, insuficiência cardíaca ou doença renal crônica. O dano é progressivo e silencioso, o que justifica tratamento mesmo sem sintomas.",
        variants: {
          iniciante:
            "A pressão alta vai gastando as paredes dos vasos aos poucos. Anos depois, isso pode virar infarto, derrame, coração fraco ou problema nos rins. Por isso tratamos mesmo quando a pessoa se sente bem.",
        },
      },
      { kind: "h3", text: "Fatores que a pressão não perdoa" },
      {
        kind: "list",
        items: [
          "[[Sal em excesso]] (> 5 g de sódio/dia) e ultraprocessados.",
          "Sono curto ou apneia do sono não tratada.",
          "Álcool frequente e tabagismo.",
          "Sedentarismo e ganho de peso abdominal.",
          "Estresse crônico e uso de simpatomiméticos.",
        ],
      },
      { kind: "h2", text: "O que funciona de verdade" },
      {
        kind: "p",
        text: "Reduzir sódio, caminhar 150 minutos por semana, perder 5 kg quando há sobrepeso e tratar a [[apneia do sono]] podem reduzir a pressão em 5 a 15 mmHg — às vezes o suficiente para adiar ou reduzir remédios, mas nunca para substituí-los por conta própria.",
        variants: {
          iniciante:
            "Comer menos sal, caminhar meia hora cinco vezes por semana, perder um pouco de peso e dormir melhor podem baixar a pressão. Em alguns casos isso reduz a necessidade de remédio — mas nunca pare o remédio sozinho.",
        },
      },
      {
        kind: "quote",
        text: "“Pressão alta não se sente. Se vê no aparelho e se trata no consultório.” — Dra. Lúcia Menezes",
      },
      {
        kind: "p",
        text: "Este texto é informativo e não substitui avaliação médica individual. Em caso de pressão acima de 180/120 com dor de cabeça forte, dor no peito, falta de ar ou alteração de visão, procure atendimento imediato.",
      },
    ],
    terms: [
      { term: "hipertensão arterial", definition: "Pressão do sangue nas artérias acima do normal de forma persistente." },
      { term: "mmHg", definition: "Milímetros de mercúrio — unidade usada para medir pressão." },
      { term: "pré-hipertensão", definition: "Pressão entre 130/85 e 139/89, mais perto do limite." },
      { term: "endotélio", definition: "Camada fina que reveste os vasos por dentro e regula seu tônus." },
      { term: "aterosclerose", definition: "Endurecimento e estreitamento das artérias por placas de gordura." },
      { term: "apneia do sono", definition: "Paradas curtas de respiração durante o sono, com engasgos e ronco." },
    ],
    concepts: ["Hipertensão", "Saúde cardiovascular", "Sono", "Prevenção"],
    claims: [
      {
        topic: "pressão alta e sintomas",
        text: "Pressão alta costuma não dar sintomas — por isso metade dos casos não é diagnosticada.",
      },
      {
        topic: "pressão alta e sintomas",
        text: "Dor de cabeça frequente é o principal sintoma de hipertensão leve.",
      },
    ],
    refs: [
      { title: "Diretrizes Brasileiras de Hipertensão Arterial", author: "SBC", year: 2020, url: "https://www.guidelinesportugues.com", site: "Sociedade Brasileira de Cardiologia" },
      { title: "Global burden of hypertension", author: "WHO", year: 2025, url: "https://www.who.int/news-room/fact-sheets/detail/hypertension", site: "OMS" },
    ],
  },
  {
    id: "sono",
    siteId: "health",
    title: "Sono e memória: o que o cérebro faz enquanto você dorme",
    url: "https://clinicaaberta.com.br/sono-e-memoria",
    kicker: "NEUROLOGIA · 5 min de leitura",
    byline: { author: "Dra. Lúcia Menezes", role: "neurologista", date: "28 out 2026" },
    blocks: [
      {
        kind: "lead",
        text: "Durante o [[sono profundo]], o [[sistema glinfático]] limpa resíduos metabólicos do cérebro e a [[consolidação de memória]] transfere aprendizados do dia para o córtex. Dormir mal não é só cansaço: é menos aprendizado — e menos limpeza.",
        variants: {
          iniciante:
            "Enquanto você dorme, o cérebro organiza o que aprendeu e limpa resíduos. Uma noite ruim prejudica o aprendizado do dia seguinte. Dormir não é pausa: é parte do trabalho.",
        },
      },
      { kind: "h2", text: "Ciclos e consolidação" },
      {
        kind: "p",
        text: "Cada ciclo de sono dura cerca de 90 minutos e alterna [[sono REM]] e ondas lentas. A consolidação declarativa depende mais das ondas lentas no início da noite; a memória procedural e a regulação emocional se beneficiam do REM no fim da noite. Cortar a segunda metade do sono, portanto, custa caro.",
        variants: {
          avancado:
            "Ciclos de ~90 min alternam NREM de ondas lentas e sono REM. A consolidação declarativa depende de spindles e slow waves no primeiro terço da noite, enquanto o REM do último terço sustenta memória procedural e reatividade emocional. Restrição da segunda metade do sono tem custo desproporcional.",
        },
      },
      {
        kind: "callout",
        text: "Aprendizado sem sono é como salvar arquivo sem disco: o conteúdo existe por alguns minutos e se perde.",
        tone: "warn",
      },
      { kind: "h2", text: "Higiene do sono que funciona" },
      {
        kind: "list",
        items: [
          "Horário fixo para acordar, inclusive no fim de semana.",
          "Luz forte pela manhã; luz baixa e quente à noite.",
          "Evitar cafeína depois das 14h.",
          "Cama apenas para dormir e ler em papel.",
          "Se não dormir em 20 minutos, levante e volte quando o sono chegar.",
        ],
      },
      {
        kind: "p",
        text: "A [[privação de sono]] crônica também eleva a [[resistência à insulina]] e a pressão arterial. Tratar o sono é uma intervenção cardiovascular, não um luxo.",
      },
    ],
    terms: [
      { term: "sono profundo", definition: "Fase de ondas lentas em que o cérebro consolida fatos e limpa resíduos." },
      { term: "sistema glinfático", definition: "Rede que lava o cérebro durante o sono, removendo resíduos." },
      { term: "consolidação de memória", definition: "Processo de estabilizar e guardar um aprendizado." },
      { term: "sono REM", definition: "Fase de sonhos vívidos, ligada a emoções e memória de habilidades." },
      { term: "privação de sono", definition: "Dormir menos do que o corpo precisa por dias seguidos." },
    ],
    concepts: ["Sono", "Memória de trabalho", "Saúde cardiovascular", "Aprendizado"],
    claims: [
      {
        topic: "pressão alta e sintomas",
        text: "A hipertensão costuma causar dor de cabeça frequente e é assim que a maioria descobre.",
      },
    ],
    refs: [
      { title: "Sleep and memory consolidation", author: "Walker, M.", year: 2017, url: "https://doi.org/10.1016/j.neuron.2017.05.011", site: "Neuron" },
    ],
  },

  /* ══════════════════════════ YOUTUBE ══════════════════════════ */
  {
    id: "transformer-aula",
    siteId: "yt",
    title: "Transformers explicados de verdade — a aula que eu queria ter tido",
    url: "https://youtube.com/watch?v=transformer-aula",
    kicker: "42:18 · Aula · 1,2 mi de visualizações · há 3 meses",
    byline: { author: "Lucas Ensina", role: "canal · 2,4 mi de inscritos", date: "ago 2026" },
    blocks: [
      {
        kind: "video",
        text: "Transformers explicados de verdade — a aula que eu queria ter tido",
        cues: [
          { t: "00:00", text: "Hoje eu vou mostrar por que o transformer funciona, sem meter uma fórmula sem contexto antes." },
          { t: "04:12", text: "A ideia central é a atenção: cada palavra olha para as outras e decide o quanto cada uma importa." },
          { t: "11:40", text: "Query, key e value são três projeções diferentes do mesmo vetor de entrada. Pensa em uma busca num índice." },
          { t: "18:05", text: "Multi-head é rodar várias atenções em paralelo e juntar as visões: sintaxe, semântica, posição." },
          { t: "26:31", text: "O feed-forward é onde o modelo guarda conhecimento factual. Cerca de dois terços dos parâmetros." },
          { t: "34:58", text: "Posição: como atenção não tem ordem, inserimos positional encoding para o modelo saber a sequência." },
          { t: "39:10", text: "Recapitulando: atenção pondera contexto, multi-head diversifica, FFN memoriza, e as normais estabilizam." },
        ],
        caption: "Prévia gerada pelo Parallax para o seu tópico: “atenção e memória”.",
      },
      {
        kind: "p",
        text: "Nesta aula, Lucas Ensina constrói um transformer do zero, token por token, e usa analogias de biblioteca para explicar a [[atenção]] em [[transformers]].",
      },
      {
        kind: "callout",
        text: "Parallax: 6 trechos desta aula citam conceitos que você marcou como seus. Os 3 minutos de introdução e o patrocínio (02:10–03:05) foram colapsados.",
        tone: "ok",
      },
      { kind: "h2", text: "Comentários em alta" },
      {
        kind: "comments",
        items: [
          "Minha mente explodiu quando entendi o KV cache. Obrigado!",
          "Alguém mais veio parar aqui pelo algoritmo às 3 da manhã?",
          "O exemplo da biblioteca foi genial. Melhor aula da internet.",
          "AD: curso de IA com desconto — link na fixada.",
        ],
      },
      {
        kind: "ad",
        text: "Antes de continuar: “Domine IA em 30 dias” — matrícula com 80% OFF só hoje.",
      },
    ],
    terms: [
      { term: "atenção", definition: "Mecanismo que pesa a relevância de cada parte da entrada para cada saída." },
      { term: "transformers", definition: "Arquitetura de rede neural baseada em atenção, base dos LLMs modernos." },
      { term: "query, key, value", definition: "Três representações usadas para calcular o quanto uma palavra importa para outra." },
      { term: "multi-head", definition: "Várias cabeças de atenção em paralelo, cada uma captando um tipo de relação." },
      { term: "feed-forward", definition: "Camada densa que processa cada posição e armazena conhecimento factual." },
      { term: "positional encoding", definition: "Sinal que informa ao modelo a ordem das palavras." },
    ],
    concepts: ["Transformers", "Atenção", "Aprendizado de máquina", "LLM"],
    claims: [
      { topic: "memória de trabalho", text: "O feed-forward guarda cerca de dois terços dos parâmetros do modelo." },
    ],
    refs: [{ title: "Attention is all you need", author: "Vaswani et al.", year: 2017, url: "https://arxiv.org/abs/1706.03762", site: "arXiv" }],
  },

  /* ══════════════════════════ NOTÍCIAS ══════════════════════════ */
  {
    id: "economia-atencao",
    siteId: "news",
    title: "A economia da atenção chegou ao limite: o que muda em 2027",
    url: "https://folhadotempo.com.br/economia-da-atencao-2027",
    kicker: "TECNOLOGIA · 7 min de leitura",
    byline: { author: "Renata Lopes", role: "repórter de tecnologia", date: "hoje, 06:12" },
    blocks: [
      {
        kind: "lead",
        text: "O tempo médio diário em telas estagnou pela primeira vez em vinte anos — e as plataformas reagiram aumentando a densidade de estímulos por minuto. É a [[economia da atenção]] no seu estágio final: não se conquista mais tempo, tenta-se extrair mais do mesmo tempo.",
        variants: {
          iniciante:
            "As pessoas já não passam mais tempo no celular do que antes. Para lucrar mais, as empresas agora tentam chamar sua atenção com mais força dentro do mesmo tempo. Isso deixa o uso mais cansativo.",
        },
      },
      { kind: "h2", text: "Três números que explicam" },
      {
        kind: "stat",
        value: "6h 40",
        label: "tempo médio diário em telas (estável desde 2024)",
      },
      {
        kind: "p",
        text: "A densidade de eventos por minuto subiu 38% em dois anos: notificações, autoplay, atualizações automáticas de feed. Ao mesmo tempo, pesquisas de percepção mostram queda de 12 pontos na sensação de controle sobre o próprio uso.",
        variants: {
          iniciante:
            "A quantidade de coisas piscando e mudando na tela cresceu 38% em dois anos. E as pessoas sentem que têm menos controle sobre o próprio celular.",
        },
      },
      {
        kind: "callout",
        text: "Atenção deixou de ser um recurso a ser capturado. Virou um recurso a ser defendido — e isso cria mercado para camadas de proteção.",
        tone: "info",
      },
      { kind: "h2", text: "A resposta das plataformas" },
      {
        kind: "p",
        text: "Duas estratégias dominam: [[personalização agressiva]] (conteúdo que acerta o gosto antes de você decidir) e [[fricção zero]] (remover cada passo entre impulso e consumo). Ambas aumentam o consumo por sessão e reduzem a capacidade de recusa.",
      },
      { kind: "h2", text: "O que pode mudar" },
      {
        kind: "p",
        text: "Reguladores europeus testam exigir “modo padrão de baixa estimulação” em feeds. No Brasil, o PL da [[regulação de IA]] inclui transparência sobre sistemas de recomendação. Especialistas divergem sobre eficácia: para uns, transparência basta; para outros, é preciso mudar o modelo de negócio.",
      },
      {
        kind: "p",
        text: "Enquanto a regra não chega, a defesa é individual e técnica: camadas que reduzem estímulo, controlam notificações e devolvem escolha. O usuário está virando, aos poucos, o seu próprio sistema operacional de atenção.",
      },
      { kind: "ad", text: "ASSINE: 3 meses por R$ 1,90. Depois, R$ 39,90/mês. Cancele quando quiser." },
    ],
    terms: [
      { term: "economia da atenção", definition: "Disputa pelo tempo e foco das pessoas como recurso escasso." },
      { term: "personalização agressiva", definition: "Recomendação que antecipa o desejo antes de o usuário escolher." },
      { term: "fricção zero", definition: "Remover passos entre o impulso e o consumo." },
      { term: "regulação de IA", definition: "Conjunto de regras para transparência e limites de sistemas automatizados." },
    ],
    concepts: ["Economia da atenção", "Regulação de IA", "Feeds", "Design de produto"],
    claims: [
      {
        topic: "tempo de tela",
        text: "O tempo médio diário em telas estagnou em cerca de 6h40 desde 2024.",
      },
      {
        topic: "tempo de tela",
        text: "O tempo de tela continua crescendo 8% ao ano, impulsionado por vídeos curtos.",
      },
    ],
    refs: [
      { title: "State of attention 2026", author: "Global Attention Lab", year: 2026, url: "https://example.org/attention", site: "GAL" },
      { title: "Digital 2026: Brazil", author: "We Are Social", year: 2026, url: "https://datareportal.com", site: "DataReportal" },
    ],
  },
  {
    id: "ia-brasil",
    siteId: "news",
    title: "PL da IA avança no Senado com foco em transparência de recomendação",
    url: "https://folhadotempo.com.br/pl-ia-senado",
    kicker: "POLÍTICA · 4 min de leitura",
    byline: { author: "Bruno Tavares", role: "repórter de política", date: "há 2 horas" },
    blocks: [
      {
        kind: "lead",
        text: "O texto aprovado em comissão exige que plataformas expliquem, em linguagem simples, por que um conteúdo foi recomendado. A [[regulação de IA]] segue para o plenário com disputa sobre obrigações para modelos de uso geral. Projeto ainda não tem data de votação.",
        variants: {
          iniciante:
            "O Senado quer obrigar os sites a explicar, de forma simples, por que mostraram certo conteúdo para você. O projeto ainda vai ser votado. Não há data.",
        },
      },
      { kind: "h2", text: "O que o texto diz" },
      {
        kind: "list",
        items: [
          "Aviso claro quando o conteúdo foi gerado por IA.",
          "Explicação do motivo da recomendação, acessível ao usuário.",
          "Direito de desativar personalização sem perder acesso ao serviço.",
          "Relatórios de risco para sistemas de alto impacto.",
        ],
      },
      {
        kind: "p",
        text: "Especialistas apontam que a exigência de explicação pode ser cumprida de forma superficial (“porque você gosta de esportes”). A discussão central é o nível de detalhe: [[explicabilidade]] suficiente para permitir escolha real ou apenas para cumprir formulário.",
        variants: {
          avancado:
            "O ponto crítico é o padrão de explicabilidade: exigências genéricas são satisfeitas por rótulos agregados, sem alterar a capacidade de agência do usuário. A alternativa regulatória é exigir controles operacionais (desligar personalização, ajustar fontes) além de texto explicativo.",
        },
      },
      { kind: "h2", text: "Próximos passos" },
      {
        kind: "p",
        text: "O relator prometeu um substitutivo com prazos escalonados: 12 meses para transparência, 24 meses para auditoria externa. Entidades de defesa do consumidor pedem prazo menor para relatórios de risco. A votação em plenário não está agendada.",
      },
    ],
    terms: [
      { term: "regulação de IA", definition: "Regras que definem deveres de transparência e segurança para sistemas de IA." },
      { term: "explicabilidade", definition: "Capacidade de explicar, em termos compreensíveis, por que um sistema decidiu algo." },
    ],
    concepts: ["Regulação de IA", "Explicabilidade", "Feeds", "Direitos digitais"],
    claims: [
      { topic: "regulação de IA", text: "O projeto prevê 12 meses para transparência e 24 para auditoria externa." },
      {
        topic: "tempo de tela",
        text: "O tempo de tela cresce 8% ao ano segundo o mesmo levantamento.",
      },
    ],
    refs: [{ title: "PL 2338/2023 — substitutivo", author: "Senado Federal", year: 2026, url: "https://www25.senado.leg.br", site: "Senado" }],
  },
];

/* ══════════════════════════ COMÉRCIO ══════════════════════════ */

export interface ShopProduct {
  id: string;
  name: string;
  store: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  fakeShare: number;
  specs: Record<string, string>;
  accent: string;
  glyph: string;
  longTermScore: number;
  /** dias de histórico, gerados de forma determinística */
  historyBase: number;
  historyTrend: number;
}

export const PRODUCTS: ShopProduct[] = [
  {
    id: "ms-ultrawide",
    name: 'Monitor Gamer UltraWide 34" 4K 144Hz IPS',
    store: "MegaShop",
    price: 2899,
    oldPrice: 4599,
    rating: 4.6,
    reviews: 1843,
    fakeShare: 0.34,
    specs: {
      Tamanho: '34"',
      Resolução: "3440 × 1440",
      Painel: "IPS",
      Taxa: "144 Hz",
      "Tempo de resposta": "1 ms (MPRT)",
      HDR: "HDR400",
      Garantia: "12 meses",
    },
    accent: "#e11d48",
    glyph: "▭",
    longTermScore: 7.8,
    historyBase: 3499,
    historyTrend: 0.05,
  },
  {
    id: "lb-4k",
    name: 'Monitor 4K UHD 32" 60Hz VA com USB-C',
    store: "LojaBoa",
    price: 2499,
    oldPrice: 2699,
    rating: 4.4,
    reviews: 612,
    fakeShare: 0.08,
    specs: {
      Tamanho: '32"',
      Resolução: "3840 × 2160",
      Painel: "VA",
      Taxa: "60 Hz",
      "Tempo de resposta": "4 ms",
      HDR: "HDR10",
      Garantia: "24 meses",
    },
    accent: "#0ea5e9",
    glyph: "▭",
    longTermScore: 8.6,
    historyBase: 2540,
    historyTrend: -0.02,
  },
  {
    id: "kab-27",
    name: 'Monitor 4K 27" 60Hz IPS sRGB 99%',
    store: "Kabum",
    price: 2199,
    oldPrice: 2399,
    rating: 4.7,
    reviews: 2981,
    fakeShare: 0.06,
    specs: {
      Tamanho: '27"',
      Resolução: "3840 × 2160",
      Painel: "IPS",
      Taxa: "60 Hz",
      "Tempo de resposta": "5 ms",
      HDR: "HDR10",
      Garantia: "36 meses",
    },
    accent: "#f59e0b",
    glyph: "▭",
    longTermScore: 9.1,
    historyBase: 2299,
    historyTrend: -0.03,
  },
  {
    id: "ml-uw",
    name: 'Monitor UltraWide 34" QHD 100Hz Curvo',
    store: "Mercado Livre",
    price: 2749,
    oldPrice: 3199,
    rating: 4.2,
    reviews: 877,
    fakeShare: 0.19,
    specs: {
      Tamanho: '34"',
      Resolução: "3440 × 1440",
      Painel: "VA",
      Taxa: "100 Hz",
      "Tempo de resposta": "4 ms",
      HDR: "HDR10",
      Garantia: "12 meses",
    },
    accent: "#22c55e",
    glyph: "◠",
    longTermScore: 6.9,
    historyBase: 2899,
    historyTrend: 0.01,
  },
];

/** histórico de preços determinístico (90 dias) */
export function priceHistory(p: ShopProduct): { day: number; price: number }[] {
  const out: { day: number; price: number }[] = [];
  const seed = p.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let d = 89; d >= 0; d--) {
    const anchor = p.oldPrice ?? p.price * 1.12;
    const wave = Math.sin((d + seed) / 9) * anchor * 0.045;
    const wave2 = Math.cos((d + seed) / 23) * anchor * 0.03;
    const trend = p.historyBase * (1 + p.historyTrend * ((90 - d) / 90));
    const price = d === 0 ? p.price : trend + wave + wave2;
    out.push({ day: 90 - d, price: Math.round(price / 10) * 10 });
  }
  out[out.length - 1].price = p.price;
  return out;
}

export const SHOP_PAGES: Page[] = [
  {
    id: "monitor-oferta",
    siteId: "shop",
    title: 'Monitor Gamer UltraWide 34" 4K 144Hz IPS',
    url: "https://megashop.com.br/produto/monitor-ultrawide-34-4k",
    kicker: "OFERTA RELÂMPAGO · termine em 02:47:12",
    blocks: [
      { kind: "product", productId: "ms-ultrawide" },
      {
        kind: "callout",
        text: "🔥 OFERTA RELÂMPAGO! Só restam 2 unidades neste preço. 27 pessoas estão vendo este produto agora. Última chance!",
        tone: "bad",
      },
      {
        kind: "p",
        text: "O monitor definitivo para quem não aceita menos: painel IPS de 34 polegadas com resolução 4K e 144 Hz. De R$ 4.599 por apenas R$ 2.899 — economia de 37%!",
        variants: {
          iniciante:
            "Este é um monitor grande e curvo, com imagem nítida e atualização rápida. Custa R$ 2.899 agora.",
        },
      },
      {
        kind: "p",
        text: "Aprovado por 1.843 clientes com nota 4,6! “Simplesmente o melhor monitor que já tive”, diz um comprador verificado. Frete grátis apenas hoje!",
      },
      { kind: "h3", text: "Especificações" },
      {
        kind: "specs",
        items: [
          'Tamanho: 34"',
          "Resolução: 3440 × 1440",
          "Painel: IPS",
          "Taxa de atualização: 144 Hz",
          "Tempo de resposta: 1 ms (MPRT)",
          "HDR: HDR400",
          "Garantia: 12 meses",
        ],
      },
      {
        kind: "list",
        items: [
          "Frete grátis para todo o Brasil (1 clique)",
          "12x sem juros no cartão",
          "Cupom de R$ 50 na próxima compra (não cumulativo)",
          "Assine o MegaPrime para devolução em 7 dias",
        ],
      },
      { kind: "ad", text: "Compre junto: suporte articulado por R$ 399 — aproveite antes que acabe." },
      {
        kind: "comments",
        items: [
          "Produto excelente!!! Recomendo muito, chegou rápido.",
          "Não comprem, o painel veio com vazamento de luz e a assistência não resolveu.",
          "Melhor compra da vida. Entrega em 2 dias. Nota 10.",
          "Preço subiu 200 reais em relação à semana passada?",
          "Qualidade incrível pelo preço! Comprei dois.",
        ],
      },
    ],
    terms: [],
    concepts: ["Monitor 4K", "Compra inteligente", "Dark patterns"],
  },
  {
    id: "monitor-loja-boa",
    siteId: "shop",
    title: 'Monitor 4K UHD 32" 60Hz VA com USB-C',
    url: "https://lojaboa.com.br/p/monitor-4k-32-usbc",
    kicker: "LojaBoa · envio em 24h",
    blocks: [
      { kind: "product", productId: "lb-4k" },
      {
        kind: "p",
        text: 'Monitor 4K de 32 polegadas com conexão USB-C, ideal para trabalho, programação e edição. Garantia de 24 meses no Brasil.',
        variants: {
          iniciante:
            "É um monitor grande, com imagem muito nítida. Conecta no notebook por um único cabo. Garantia de 2 anos.",
        },
      },
      {
        kind: "specs",
        items: [
          'Tamanho: 32"',
          "Resolução: 3840 × 2160",
          "Painel: VA",
          "Taxa: 60 Hz",
          "USB-C com 65 W e hub",
          "Garantia: 24 meses",
        ],
      },
      {
        kind: "list",
        items: ["Nota fiscal 100%", "Devolução em 30 dias", "Frete calculado no carrinho", "12x sem juros"],
      },
      {
        kind: "comments",
        items: [
          "Uso para programar e é ótimo: texto limpo e hub USB-C resolve.",
          "Painel VA tem preto profundo, mas fica estranho em ângulo.",
          "Chegou em 2 dias, bem embalado.",
          "O HDR é fraco, não compre por isso.",
        ],
      },
    ],
    terms: [],
    concepts: ["Monitor 4K", "Compra inteligente"],
  },
  {
    id: "monitor-kabum",
    siteId: "shop",
    title: 'Monitor 4K 27" 60Hz IPS sRGB 99%',
    url: "https://kabum.com.br/p/monitor-4k-27-ips",
    kicker: "Kabum · 3 anos de garantia",
    blocks: [
      { kind: "product", productId: "kab-27" },
      {
        kind: "p",
        text: 'Monitor profissional de 27 polegadas, 4K, fábrica calibrada em sRGB 99%. Perfeito para design, foto e leitura de código em alta densidade.',
        variants: {
          iniciante:
            "Monitor com imagem muito nítida e cores fiéis. Bom para trabalhar com foto e design, ou para ler código com letras limpas.",
        },
      },
      {
        kind: "specs",
        items: ['Tamanho: 27"', "Resolução: 3840 × 2160", "Painel: IPS", "sRGB: 99%", "Ajuste de altura: sim", "Garantia: 36 meses"],
      },
      {
        kind: "list",
        items: ["Garantia de 36 meses", "Frete grátis acima de R$ 199", "Nota 4,7 em 2.981 avaliações", "Pix com 5% de desconto"],
      },
      {
        kind: "comments",
        items: [
          "Melhor custo-benefício em 4K 27, uso há 8 meses sem problema.",
          "Cores ótimas para Lightroom. Recomendo calibrar mesmo assim.",
          "Embalagem veio amassada, mas o produto funcionou.",
        ],
      },
    ],
    terms: [],
    concepts: ["Monitor 4K", "Compra inteligente"],
  },
];

/* ══════════════════════════ helpers ══════════════════════════ */

export const ALL_PAGES: Page[] = [...PAGES, ...SHOP_PAGES];

export function pageById(id: string): Page | undefined {
  return ALL_PAGES.find((p) => p.id === id);
}

export function pagesOfSite(siteId: SiteId): Page[] {
  return ALL_PAGES.filter((p) => p.siteId === siteId);
}

export function pagePlainText(page: Page): string {
  return page.blocks
    .map((b) => [b.text, ...(b.items ?? []), b.label ?? "", ...(b.cues ?? []).map((c) => c.text)].join(" "))
    .join(" ")
    .replace(/\[\[|\]\]/g, "")
    .replace(/\|/g, " ");
}

export function pageStats(page: Page) {
  const text = pagePlainText(page);
  const words = text.split(/\s+/).filter(Boolean).length;
  const sentences = Math.max(1, (text.match(/[.!?](\s|$)/g) ?? []).length);
  const longWords = text.split(/\s+/).filter((w) => w.replace(/\W/g, "").length >= 9).length;
  const complexity = Math.min(100, Math.round((longWords / Math.max(1, words)) * 420 + (words / sentences) * 1.4));
  return {
    words,
    sentences,
    minutes: Math.max(1, Math.round(words / 210)),
    complexity,
  };
}

/** atalhos: uma página por site, na ordem do catálogo */
export function shortcutsOf(count = 6): Page[] {
  const seen = new Set<SiteId>();
  const out: Page[] = [];
  for (const p of ALL_PAGES) {
    if (seen.has(p.siteId)) continue;
    seen.add(p.siteId);
    out.push(p);
    if (out.length >= count) break;
  }
  return out;
}
