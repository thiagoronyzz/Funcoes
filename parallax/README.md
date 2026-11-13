# Parallax

**A primeira camada de inteligência entre o seu cérebro e a web.**
Um protótipo funcional da ideia que você descreveu: em vez de bloquear a internet, re-renderizar cada site
em tempo real a partir da sua **intenção**, do seu **nível de conhecimento** e do seu **estado cognitivo**.

Este diretório contém duas coisas que rodam de verdade:

| Peça | O que é | Como rodar |
| --- | --- | --- |
| **`src/`** | o navegador-demo completo (5 modos, grafo, flashcards, dark patterns, benchmarking) | `npm install && npm run dev` |
| **`extension/`** | extensão Chrome **Manifest V3** com o mesmo motor rodando em qualquer site real | `npm run ext` → carregar `extension/` no Chrome |
| **`parallax-standalone.html`** | o app inteiro num arquivo só (707 kB, zero requisições) | duplo clique — não precisa de servidor |

```bash
npm install
npm run dev         # http://localhost:5173
npm test            # 20 testes: motor, dark patterns e paridade TS ⇄ extensão
npm run typecheck
npm run ext         # valida o manifest e empacota extension/dist/*.zip
npm run standalone  # regenera parallax-standalone.html a partir de dist/
```

O arquivo único **não é editado à mão**: `scripts/build-standalone.mjs` roda o build de produção,
embute CSS e JS no HTML, verifica que nenhuma referência externa sobrou e falha se sobrar.
É o formato que você manda num zip, abre offline e mostra sem servidor.

Nada sai do dispositivo: reescrita, glossário, grafo, citações, flashcards e detecção de padrões são todos locais.
Sem conta, sem backend, sem telemetria.

---

## O que está funcionando (e não é mockup)

### 1. Motor de reescrita real

`src/core/rewrite.ts` — e a versão espelhada em `extension/shared/rewrite.js` — recebe texto e devolve texto diferente,
com **métricas e justificativa por parágrafo**:

- **3 níveis** (iniciante / intermediário / avançado) aplicados a cada bloco.
- **Regras heurísticas** de simplificação (conectores formais, voz passiva, jargão) e de densificação.
- **Separação de frases longas** em pontos de quebra naturais (sem fragmentar).
- **Glossário** extraído dos termos da página, com tooltip em cada parágrafo.
- **Complexidade** antes/depois: índice 0–100 normalizado para o português (palavras por frase, sílabas por
  palavra e proporção de palavras longas), em vez do Flesch bruto, que satura com palavras longas em pt-BR.
- **Tempo por bloco** medido de verdade (`performance.now`), não estimado.
- Cada mudança é auditável: `o que → o que` e `por quê`. A demo expõe isso em “por que mudou”,
  e o laboratório (**Motor**) coloca original × 3 níveis lado a lado.

Testes em `tests/rewrite.test.mjs` cobrem idempotência, capitalização, calma, glossário, intensidade zero e
resumo extrativo. `tests/parity.test.mjs` compila o motor TypeScript e compara **texto por texto** com o motor
da extensão em 4 trechos × 3 níveis × 3 intensidades: se os dois lados divergirem, o teste quebra.
`npm test` roda tudo (20 testes) em ~200 ms.

### 2. Os cinco modos, aplicados ao DOM

| Modo | O que muda na página |
| --- | --- |
| **Aprendizado** | reescrita no seu nível (com tradução de jargão clínico/técnico), tooltips de glossário, flashcards e quiz gerados do texto |
| **Pesquisa** | resumo extrativo, layout uniforme, referências no estilo escolhido (ABNT/APA/BibTeX), grafo entre fontes |
| **Compra** | preço real × histórico de 90 dias, reviews filtradas, **dark patterns com o trecho que disparou** |
| **Foco** | anúncios, comentários e feeds suprimidos (não bloqueados), abas não essenciais dessaturadas, timer adaptativo |
| **Calma** | dessaturação, contraste reduzido, métricas de ansiedade escondidas, só 4 frases essenciais + respiração 60 s |

Os modos não são botões decorativos: o `MockPage` decide por bloco o que renderizar, e o `engine-strip`
mostra quantos estímulos foram suprimidos e em quantos milissegundos.

### 3. Conhecimento que se acumula

- **Grafo contextual** (`src/core/graph.ts`): nós de conceito/fonte/produto, arestas de coocorrência,
  citação e contradição. Layout determinístico em anéis — sem physics engine, sem dependências.
- **Contradições entre fontes**: detecta afirmações sobre o mesmo tópico que divergem em números ou negação,
  e mostra as duas fontes lado a lado.
- **Citações**: ABNT NBR 6023, APA 7 e BibTeX, com exportação `.txt` / `.bib`.
- **Memória de leitura**: progresso por página, tempo de atenção, flashcards com revisão espaçada (SM-2 simplificado)
  e exportação do “cérebro” em JSON.

### 4. Intenção e estado cognitivo — sem câmera

- **Parser de intenção** (`src/core/cognition.ts`): classifica a frase em aprender / pesquisar / comprar / focar / descansar,
  extrai tópico, orçamento e nível, e **explica as pistas** que usou.
- **Detector cognitivo**: focado / disperso / fatigado / flow a partir de trocas de aba, ritmo de rolagem, digitação
  e horário. Mostra foco, carga, fadiga, confiança e motivos — e nunca envia amostras.
- **Recomendação de modo**: quando detecta sobrecarga, propõe Calma ou Foco com o porquê (dispensável).

### 5. Extensão Chrome MV3 (o motor na web de verdade)

`extension/` implementa o pipeline que o documento descreve:

```
content script → acha o content root por densidade de texto
               → reescreve parágrafos (motor local, originais guardados em WeakMap)
               → MutationObserver seletivo, debounce 120 ms
               → suprime estímulo no foco/calma
               → detecta dark patterns e mostra em painel Shadow DOM
               → “restaurar original” desfaz tudo, sem resíduo
```

- **Shadow DOM** + CSS escopado: nada vaza para o site.
- **Zero rede**: nenhuma permissão de rede é usada para reescrever; sem `eval`.
- **Permissões mínimas**: `storage`, `activeTab`, `scripting` + `<all_urls>` para o motor genérico.
- Popup com modos, nível, intensidade, toggle de supressão, estatísticas e reset.
- Atalhos: `Ctrl+Shift+P` (painel) e `Ctrl+Shift+Y` (pausar/retomar).
- **Página de teste** em `extension/tests/fixture.html` — abra e clique na pílula.

Por que a IA é heurística aqui: o documento propõe um LLM de 3B quantizado (Llama 3.2 / Phi-3) em ONNX Runtime Web.
Rodar isso exigiria 2 GB de pesos e WebGPU — inviável no contexto deste repositório. O motor mantém **a mesma
interface** (`rewriteBlock({ text, level, intensity, terms })`), então trocar a heurística por um Web Worker com
`ort-wasm` é uma mudança localizada, sem tocar no resto do produto. O laboratório mede a latência por bloco para
mostrar o orçamento que um LLM local teria de respeitar.

---

## O que é simulado (e por quê)

Honestidade técnica importa mais que demo bonita:

- **Os sites são páginas de demonstração** (Wikipédia, dev.to, YouTube, e-commerce, portal de notícias, clínica),
  recriadas em `src/data/sites.ts` com conteúdo realista — não são iframes da web real.
- **As variações de nível vêm de texto pré-compilado** nos blocos (`variants`) — é o “ground truth” que um LLM
  produziria. Quando a variação não existe, a heurística local reescreve e o diff mostra a diferença.
- **Preços, histórico de 90 dias e reviews são sintéticos**, gerados de forma determinística (`priceHistory`).
- **Não há eye-tracking**: o estado cognitivo vem de interação (scroll, abas, digitação, horário).
- **Sem backend**: o “sync entre dispositivos” do documento não existe; a alternativa é exportar o JSON do cérebro.

## Arquitetura

```
src/
  core/
    types.ts        modelo de estado serializável
    store.ts        reducer puro + store com assinantes + persistência local
    rewrite.ts      motor de reescrita e métricas (16 testes)
    cognition.ts    parser de intenção, detector cognitivo, recomendação
    darkpatterns.ts detector com evidência citada + estimativa de reviews falsas
    graph.ts        grafo, contradições, layout em anéis
    citations.ts    ABNT / APA / BibTeX
    quiz.ts         quiz determinístico a partir de termos e frases-chave
  components/       MockPage, RewrittenText, SidePanel, GraphCanvas, Compare, ui
  views/            Browser, Cerebro, Foco, Lab, Manifesto
  data/sites.ts     6 sites, 9 páginas, 4 produtos, 90 dias de preço
index.html          entrada do Vite (dev/build)
parallax-standalone.html  build embutido num arquivo — gerado por npm run standalone
scripts/            build-extension.mjs (manifest + zip), build-standalone.mjs (arquivo único)
extension/
  manifest.json     MV3
  shared/           rewrite.js, darkpatterns.js, store.js (JS puro, sem bundler)
  content/          content.js + parallax.css (Shadow DOM)
  popup/            popup + welcome
  tests/fixture.html
  dist/*.zip        pacote gerado por npm run ext
tests/              20 testes rodáveis com node --test (motor, dark patterns, paridade)
```

Estado: um objeto serializável em `localStorage` (`parallax.v1`). Nada de `any` no caminho crítico — `npm run typecheck`
roda com `strict`, `noUnusedLocals` e `noUnusedParameters`.

## Atalhos da demo

| Tecla | Ação |
| --- | --- |
| `1` `2` `3` `4` `5` | navegar · cérebro · foco · motor · tese |
| `M` | ciclar modos |
| `Ctrl+K` / `Ctrl+L` | omnibox |
| `Ctrl+T` | nova aba |
| `?` / `F1` | atalhos |

## Limites conhecidos

- A demo é **desktop-first**: em telas estreitas o painel lateral desce abaixo da página.
- O content script reescreve **parágrafos** (90–2400 caracteres). Não toca em `<h1>`, código, formulários ou iframes.
- Sites que renderizam texto em canvas/WebGL não são reescrevíveis por essa abordagem.
- O detector de contradições é lexical: compara números e negações sobre o mesmo tópico — não é inferência semântica.
- `npm test` cobre o motor compartilhado; a integração da extensão é validada pelo `npm run ext` (sintaxe + manifest)
  e pela página de teste.

## Próximo passo natural

1. Trocar a heurística por `ort-web` + Llama 3.2 3B Q4 em Web Worker, com streaming por parágrafo e cancelamento.
2. Regras por domínio (os 500 sites mais acessados) para não depender só de densidade de texto.
3. Sync opcional E2E: cifrar o JSON do cérebro no cliente e usar qualquer storage — o servidor nunca vê o conteúdo.
4. Painel de _diff_ público: “antes e depois” compartilhável, que o documento aponta como o onboarding viral.
