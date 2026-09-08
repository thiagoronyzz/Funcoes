/* Zcode — CATÁLOGO: fonte de verdade.
   100 apps por categoria:
     Estudos: 11 legacy + 89 gerados
     Jogos:    7 legacy + 93 gerados
     Úteis:    5 legacy + 95 gerados */
import * as D from "./data/estudos.mjs";
import { UNIDADES } from "./data/uteis.mjs";
import * as EST from "./engines/estudos.mjs";
import * as JOG from "./engines/jogos.mjs";
import * as UT1 from "./engines/uteis.mjs";
import * as UT2 from "./engines/uteis2.mjs";
import * as UT2B from "./engines/uteis2b.mjs";
import * as UT3 from "./engines/uteis3.mjs";

export const UTEIS = { ...UT1, ...UT2, ...UT2B, ...UT3 };
export const ENGINES = { estudos: EST.ESTUDOS, jogos: JOG.JOGOS, uteis: UTEIS };

/* ── helpers ─────────────────────────────────────────────── */
const GEN = (arr) => "function(){return " + JSON.stringify(arr) + "}";
const shuf = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
// item mcq: embaralha opções e recalcula o índice certo
const q = (t, a, op, dica) => {
  const ops = shuf(op);
  return { t, op: ops, a: ops.indexOf(a), ...(dica ? { dica } : {}) };
};

/* ── ESTUDOS ─────────────────────────────────────────────── */
const E = [];
const leg = (nome, desc, dir, page, imagem, destaque) =>
  E.push({ nome, desc, legacy: dir, page, imagem, destaque: !!destaque });

leg("Funções", "Visualizador matemático interativo de funções.", "funcoes(01)", "index.html", "images/editorial/study-desk.jpg", true);
leg("Calculadora", "Calculadora de estudo para resolver expressões.", "calculadorabasica(02)", "index.html", "images/editorial/study-desk.jpg");
leg("Tabela Periódica", "Tabela periódica interativa dos elementos.", "tabelaperiodica(03)", "index.html", "images/editorial/study-desk.jpg");
leg("Fórmulas", "Biblioteca de fórmulas das ciências da natureza.", "formulas(04)", "index.html", "images/editorial/study-desk.jpg");
leg("Citologia", "Explorador interativo das partes da célula.", "citologia(05)", "index.html", "images/editorial/study-desk.jpg");
leg("Sistemas do Corpo", "Atlas interativo dos sistemas do corpo humano.", "sistemas(06)", "index.html", "images/editorial/study-desk.jpg");
leg("Atlas Interativo", "Mapa vetorial interativo para estudar geografia.", "Atlas(07)", "index.html", "images/editorial/study-desk.jpg");
leg("Eras Geológicas", "Linha do tempo interativa da Terra.", "eras(08)", "index.html", "images/editorial/study-desk.jpg");
leg("Pomodoro", "Cronômetro de foco para sessões de estudo.", "pomodoro(09)", "index.html", "images/editorial/study-desk.jpg");
leg("Plotter 3D", "Plotter de funções em três dimensões.", "geometria(10)", "index.html", "images/editorial/study-desk.jpg");
leg("CSS Challenge", "Clone de designs famosos para treinar CSS.", "learncss(11)", "index.html", "images/editorial/study-desk.jpg");

const app = (nome, desc, engine, params, destaque) =>
  E.push({ nome, desc, engine, params, imagem: "", destaque: !!destaque });

/* flashcards ×14 */
const DECK_TIT = {
  matematica: "Matemática", ingles: "Inglês", historia: "História", ciencias: "Ciências",
  biologia: "Biologia", fisica: "Física", quimica: "Química", geografia: "Geografia",
  literatura: "Literatura", filosofia: "Filosofia", codigo: "Programação",
  gramatica: "Gramática", arte: "Arte", esportes: "Esportes",
};
for (const k of Object.keys(DECK_TIT)) {
  app("Flashcards: " + DECK_TIT[k], D.DECKS[k].length + " cartões para fixar o essencial do assunto.", "flashcards", { deck: D.DECKS[k] }, k === "matematica");
}

/* quiz mcq ×16 */
const QUIZ_TIT = {
  cultura: "Cultura Geral", mat: "Matemática", hist: "História", geo: "Geografia",
  cienc: "Ciências", ingles: "Inglês", logica: "Lógica", codigo: "Programação",
  arte: "Arte", esportes: "Esportes", biologia: "Biologia", fisica: "Física",
  quimica: "Química", brasil: "Brasil", cinemas: "Cinema", musica: "Música",
};
for (const k of Object.keys(QUIZ_TIT)) {
  const itens = D.QUIZ[k].map((e) => q(e.q, e.op[e.a], e.op, e.dica));
  app("Quiz: " + QUIZ_TIT[k], D.QUIZ[k].length + " questões de múltipla escolha sobre o tema.", "mcq", { gen: GEN(itens) }, k === "mat");
}

/* sequências ×4 (inputGame, gen autocontido) */
const ZN_SRC = "var ZN=function(a,b){return a+Math.floor(Math.random()*(b-a+1))}";
const PRIMOS_SRC = "var primosAté=function(n){var o=[];for(var x=2;x<=n;x++){var ok2=true;for(var d2=2;d2*d2<=x;d2++)if(x%d2===0){ok2=false;break}if(ok2)o.push(x)}return o}";
const genSeq = (k) =>
  "function(){" + ZN_SRC + ";" + PRIMOS_SRC + ";" +
  "var r=(" + D.SEQUENCIAS[k].gen.toString() + ")(0);" +
  "return {t:r.show.join(\", \")+\" , …\", a:r.next, dica:r.dica}}";
app("Sequências Aritméticas", "Descubra o próximo número da sequência aritmética.", "inputGame", { gen: genSeq("arit"), roundSeg: 60 });
app("Sequências Geométricas", "Descubra o próximo número da sequência geométrica.", "inputGame", { gen: genSeq("geo"), roundSeg: 60 });
app("Sequências de Fibonacci", "Cada termo é a soma dos dois anteriores. Descubra o próximo.", "inputGame", { gen: genSeq("fib"), roundSeg: 60 });
app("Sequências de Primos", "Sequências de números primos. Descubra o próximo.", "inputGame", { gen: genSeq("primo"), roundSeg: 60 });

/* conjugação ×3 (mcq) */
const CONJ_TIT = { presente: "Presente", past: "Passado", futuro: "Futuro" };
for (const k of Object.keys(CONJ_TIT)) {
  const itens = D.CONJUGACAO[k].map((c) => q("Conjugue: " + c[0] + " (" + c[1] + ")", c[2][0], c[2], "Preste atenção na pessoa do verbo."));
  app("Conjugação: " + CONJ_TIT[k], "Conjugue o verbo no tempo " + CONJ_TIT[k].toLowerCase() + ".", "mcq", { gen: GEN(itens) });
}

/* traduções (mcq) */
{
  const itens = D.TRADUCOES.map((t) => q("“" + t[0] + "” em inglês?", t[1], t[2]));
  app("Tradução PT → EN", "Descubra a tradução correta em inglês.", "mcq", { gen: GEN(itens) });
  const rev = D.TRADUCOES.map((t, i) => {
    const outros = shuf(D.TRADUCOES.filter((_, j) => j !== i).map((u) => u[0])).slice(0, 3);
    return q("“" + t[1] + "” em português?", t[0], [t[0], ...outros]);
  });
  app("Tradução EN → PT", "Descubra a tradução correta em português.", "mcq", { gen: GEN(rev) });
}

/* unidades, capitais (mcq) */
{
  const itens = D.UNIDADES.map((u) => q("Qual é a unidade de " + u[0] + " no Sistema Internacional?", u[1][u[2]], u[1]));
  app("Unidades de Medida", "Qual é a unidade oficial no SI?", "mcq", { gen: GEN(itens) });
  const itensC = D.CAPITAIS.map((c) => q("Qual é a capital de " + c[0] + "?", c[1], c[2]));
  app("Capitais da Europa", "Associe o país à capital.", "mcq", { gen: GEN(itensC), total: 16 });
}

/* estatística (inputGame, gen autocontido) */
app("Estatística Rápida", "Calcule a média aritmética do conjunto em até 60 segundos.", "inputGame", {
  gen: "function(){" + ZN_SRC + ";var n=ZN(4,6),arr=[];for(var i=0;i<n;i++)arr.push(ZN(1,20));var s=0;for(var j=0;j<n;j++)s+=arr[j];return {t:'Média de ' + arr.join(' , ') + ' = ?', a:Math.round((s/n)*100)/100, dica:'Soma ÷ quantidade de números'} }",
  roundSeg: 60,
});

/* anagramas ×3 */
const ANAG_TIT = { facil: "Fácil", med: "Médio", ciencia: "Ciência" };
for (const k of Object.keys(ANAG_TIT)) {
  app("Anagramas: " + ANAG_TIT[k], "Desembrulhe as letras e forme a palavra.", "anagrama", { palavras: D.ANAGRAMAS[k].map((p) => p[1]) }, k === "med");
}

/* verdadeiro/falso ×6 */
const TF_TIT = { ciencia: "Ciências", hist: "História", geo: "Geografia", cultura: "Cultura", esporte: "Esportes", mat: "Matemática" };
for (const k of Object.keys(TF_TIT)) {
  app("V/F: " + TF_TIT[k], "Verdadeiro ou falso? " + D.TF[k].length + " afirmações.", "tf", { itens: D.TF[k] });
}

/* palavras escondidas ×3 */
const WS_TIT = { animais: "Animais", frutas: "Frutas", profissoes: "Profissões" };
for (const k of Object.keys(WS_TIT)) {
  app("Palavras Escondidas: " + WS_TIT[k], "Encontre as " + D.ESMESCIDAS[k].length + " palavras na grade.", "ws", { palavras: D.ESMESCIDAS[k] });
}

/* pares ×8 */
const PARES_TIT = { animais: "Animais", capitais: "Capitais", elementos: "Elementos", sinonimos: "Sinônimos", ant: "Antônimos", citacoes: "Citações", orgaos: "Órgãos", datas: "Datas Históricas" };
for (const k of Object.keys(PARES_TIT)) {
  app("Jogo dos Pares: " + PARES_TIT[k], "Encontre os pares de " + PARES_TIT[k].toLowerCase() + " e fixe o conteúdo.", "pares", { paresData: D.PARES[k] }, k === "animais");
}

/* SRS ×2 */
app("Repetição Espaçada: Fórmulas", "Fixe as principais fórmulas da matemática com repetição espaçada.", "srs", { itens: D.SRS.mat, key: "srs-mat" });
app("Repetição Espaçada: Inglês", "Vocabulário em inglês com repetição espaçada.", "srs", { itens: D.SRS.ingles, key: "srs-ingles" });

/* planner, caderno, ginástica */
app("Planner de Estudos", "Organize tarefas com assunto, duração e data. Salvo no navegador.", "planner", {}, true);
app("Caderno de Anotações", "Anotações rápidas com Markdown simples. Salvo no navegador.", "caderno", {});
app("Ginástica Cerebral", "Memorize sequências de dígitos que ficam cada vez maiores.", "ginastica", {});

/* enigmas ×3 (mcq) */
const ENIG_TIT = { facil: "Fácil", med: "Médio", dif: "Difícil" };
for (const k of Object.keys(ENIG_TIT)) {
  const itens = D.ENIGMAS[k].map((e) => q(e[0], e[1][0], e[1]));
  app("Enigmas: " + ENIG_TIT[k], "Quebra-cabeças de lógica e raciocínio.", "mcq", { gen: GEN(itens) });
}

/* probabilidade (mcq) */
{
  const itens = D.PROB.map((p) => {
    const a = p.f[0] + " / " + p.f[1];
    const d1 = (p.f[1] - p.f[0]) + " / " + p.f[1];
    const d2 = p.f[1] + " / " + p.f[0];
    const d3 = (p.f[0] + 1) + " / " + p.f[1];
    return q("Probabilidade de: " + p.t, a, [a, d1, d2, d3], p.desc);
  });
  app("Probabilidade", "Qual é a fração correta da probabilidade?", "mcq", { gen: GEN(itens) });
}

/* trigonometria (mcq) */
{
  const itens = [];
  for (const t of D.TRIG) itens.push(q("sen(" + t.ang + ") = ?", t.sen, [t.sen, t.cos, t.tan, D.TRIG[(D.TRIG.indexOf(t) + 1) % D.TRIG.length].sen]));
  for (const t of D.TRIG) itens.push(q("cos(" + t.ang + ") = ?", t.cos, [t.cos, t.sen, t.tan, D.TRIG[(D.TRIG.indexOf(t) + 1) % D.TRIG.length].cos]));
  for (const t of D.TRIG) itens.push(q("tan(" + t.ang + ") = ?", t.tan, [t.tan, t.sen, t.cos, D.TRIG[(D.TRIG.indexOf(t) + 1) % D.TRIG.length].tan]));
  app("Trigonometria Básica", "Valores de seno, cosseno e tangente dos ângulos notáveis.", "mcq", { gen: GEN(itens) });
}

/* bandeiras ×2 (mcq) */
{
  const metade = Math.ceil(D.BANDEIRAS.length / 2);
  const partes = [D.BANDEIRAS.slice(0, metade), D.BANDEIRAS.slice(metade)];
  partes.forEach((parte, i) => {
    const itens = parte.map((b) => q("Qual país tem esta bandeira? " + b[0], b[1], b[2]));
    app("Bandeiras do Mundo " + (i + 1), "Identifique o país pela bandeira. Ronda " + (i + 1) + ".", "mcq", { gen: GEN(itens) }, i === 0);
  });
}

/* simulados ×3 (mcq com timer) */
const SIM_TIT = { mat: "Matemática", ciencias: "Ciências da Natureza", humanas: "Ciências Humanas" };
for (const k of Object.keys(SIM_TIT)) {
  const itens = D.SIMULADO[k].map((e) => q(e.q, e.op[e.a], e.op, e.dica));
  app("Simulado: " + SIM_TIT[k], D.SIMULADO[k].length + " questões mistas com tempo limite de 5 minutos.", "mcq", { gen: GEN(itens), tempoSeg: 300 }, k === "mat");
}

/* geoforms ×2 */
app("Geometria: Áreas", "Calcule áreas de triângulo, quadrado, círculo e retângulo em 60 segundos.", "geoforms", { tipo: "area" });
app("Geometria: Volumes", "Calcule volumes de prisma, cilindro e cubo em 60 segundos.", "geoforms", { tipo: "volume" });

/* tabuada ×3 (inputGame) */
const TAB = (n) =>
  "function(){var t=2+Math.floor(Math.random()*8);return {t:t+' × " + n + " = ?', a:t*" + n + "}}";
app("Tabuada do 7", "Treine a tabuada do 7 o máximo que puder em 60 segundos.", "inputGame", { gen: TAB(7), roundSeg: 60 }, true);
app("Tabuada do 9", "Treine a tabuada do 9 o máximo que puder em 60 segundos.", "inputGame", { gen: TAB(9), roundSeg: 60 });
app("Tabuada do 12", "Treine a tabuada do 12 o máximo que puder em 60 segundos.", "inputGame", { gen: TAB(12), roundSeg: 60 });

/* potências (inputGame) */
app("Potências Rápidas", "Calcule potências como 3^4 em até 60 segundos.", "inputGame", {
  gen: "function(){var b=2+Math.floor(Math.random()*4),e=2+Math.floor(Math.random()*4);return {t:b+'^'+e+' = ?', a:Math.pow(b,e), dica:b+' elevado a '+e}}",
  roundSeg: 60,
});

/* fórmulas de área (inputGame) */
{
  const itens = [
    { t: "Área do quadrado de lado 6 = ?", a: 36, dica: "A = l²" },
    { t: "Área do retângulo 7 × 5 = ?", a: 35, dica: "A = b × h" },
    { t: "Área do triângulo: base 10, altura 6 = ?", a: 30, dica: "A = b·h ÷ 2" },
    { t: "Área do círculo de raio 2 (π = 3,14) = ?", a: 12.56, dica: "A = πr²" },
    { t: "Área do trapézio: bases 6 e 4, altura 5 = ?", a: 25, dica: "A = (B + b)·h ÷ 2" },
    { t: "Área do losango: diagonais 8 e 6 = ?", a: 24, dica: "A = D·d ÷ 2" },
    { t: "Área do quadrado de lado 9 = ?", a: 81, dica: "A = l²" },
    { t: "Área do triângulo: base 12, altura 8 = ?", a: 48, dica: "A = b·h ÷ 2" },
  ];
  app("Fórmulas de Área", "Calcule a área das figuras em até 60 segundos.", "inputGame", {
    gen: "function(){var I=" + JSON.stringify(itens) + ";var x=I[Math.floor(Math.random()*I.length)];return {t:x.t, a:x.a, dica:x.dica}}",
    roundSeg: 60,
  });
}

/* movimento (inputGame) */
{
  const itens = [
    { t: "Velocidade: 200 km em 2 h → v = ?", a: 100, dica: "v = d ÷ t" },
    { t: "Tempo: 150 km a 50 km/h → t = ?", a: 3, dica: "t = d ÷ v" },
    { t: "Distância: 90 km/h por 2 h → d = ?", a: 180, dica: "d = v × t" },
    { t: "Velocidade: 120 km em 1,5 h → v = ?", a: 80, dica: "v = d ÷ t" },
    { t: "Tempo: 300 km a 60 km/h → t = ?", a: 5, dica: "t = d ÷ v" },
    { t: "Distância: 70 km/h por 3 h → d = ?", a: 210, dica: "d = v × t" },
    { t: "Velocidade: 480 m em 30 s → v (m/s) = ?", a: 16, dica: "v = d ÷ t" },
  ];
  app("Movimento Retílineo", "Resolva problemas de velocidade, tempo e distância em 60 segundos.", "inputGame", {
    gen: "function(){var I=" + JSON.stringify(itens) + ";var x=I[Math.floor(Math.random()*I.length)];return {t:x.t, a:x.a, dica:x.dica}}",
    roundSeg: 60,
  });
}

/* química (mcq) */
{
  const ELS = [
    ["Ferro", "Fe"], ["Ouro", "Au"], ["Prata", "Ag"], ["Sódio", "Na"],
    ["Potássio", "K"], ["Cálcio", "Ca"], ["Cloro", "Cl"], ["Carbono", "C"],
    ["Hidrogênio", "H"], ["Oxigênio", "O"], ["Nitrogênio", "N"], ["Cobre", "Cu"],
  ];
  const itens = ELS.map((e, i) => {
    const outros = shuf(ELS.filter((_, j) => j !== i).map((u) => u[1])).slice(0, 3);
    return q("Qual é o símbolo do elemento " + e[0] + "?", e[1], [e[1], ...outros], "Na tabela periódica, cada elemento tem uma sigla de 1 ou 2 letras.");
  });
  app("Símbolos Químicos", "Associe o elemento ao seu símbolo na tabela periódica.", "mcq", { gen: GEN(itens) });
}

/* capitais do mundo (mcq) */
{
  const CAPS = [
    ["Japão", "Tóquio"], ["Canadá", "Ottawa"], ["Austrália", "Canberra"], ["Egito", "Cairo"],
    ["México", "Cidade do México"], ["Argentina", "Buenos Aires"], ["Chile", "Santiago"], ["Rússia", "Moscou"],
    ["Alemanha", "Berlim"], ["Grécia", "Atenas"], ["Índia", "Nova Délhi"], ["China", "Pequim"],
  ];
  const itens = CAPS.map((c) => {
    const outros = shuf(CAPS.filter((x) => x[0] !== c[0]).map((x) => x[1])).slice(0, 3);
    return q("Qual é a capital de " + c[0] + "?", c[1], [c[1], ...outros]);
  });
  app("Capitais do Mundo", "Teste seus conhecimentos em capitais do planeta.", "mcq", { gen: GEN(itens) });
}

/* sinônimos (mcq) */
{
  const EXTRAS = [["bonito", "lindo"], ["rápido", "veloz"], ["inteligente", "esperto"], ["difícil", "complicado"]];
  const todos = [...D.PARES.sinonimos, ...EXTRAS];
  const itens = todos.map((p) => {
    const outros = shuf(todos.filter((x) => x !== p).map((x) => x[1])).slice(0, 3);
    return q("Qual é o sinônimo de “" + p[0] + "”?", p[1], [p[1], ...outros]);
  });
  app("Sinônimos Relâmpagos", "Escolha o sinônimo correto.", "mcq", { gen: GEN(itens) });
}

/* cronologia (mcq) */
{
  const EV = [
    ["Início da Segunda Guerra Mundial", "1939", ["1935", "1941", "1914"]],
    ["Copa do Mundo no Brasil (Maracanã)", "1950", ["1974", "1962", "2002"]],
    ["Chegada do ser humano à Lua", "1969", ["1959", "1972", "1965"]],
    ["Criação da World Wide Web", "1989", ["1995", "1983", "2001"]],
    ["Lançamento do primeiro iPhone", "2007", ["2005", "2010", "2003"]],
    ["Queda do Muro de Berlim", "1989", ["1991", "1987", "1993"]],
    ["Primeira Copa do Mundo (Uruguai)", "1930", ["1926", "1934", "1950"]],
    ["Chegada de Cabral ao Brasil", "1500", ["1492", "1512", "1530"]],
    ["Primeira mensagem da ARPANET", "1969", ["1975", "1965", "1980"]],
    ["Proclamação da República no Brasil", "1889", ["1822", "1900", "1895"]],
  ];
  const itens = EV.map((e) => q("Em que ano ocorreu: " + e[0] + "?", e[1], [e[1], ...e[2]]));
  app("Cronologia", "Em que ano aconteceu o evento?", "mcq", { gen: GEN(itens) }, true);
}

/* ── JOGOS ───────────────────────────────────────────────── */
const J = [];
const jleg = (nome, desc, dir, page, imagem, destaque) =>
  J.push({ nome, desc, legacy: dir, page, imagem, destaque: !!destaque });

jleg("Bandeiras do Mundo", "Adivinhe o país pela bandeira.", "jogopaises(01)", "index.html", "images/editorial/chess-board.jpg", true);
jleg("Roleta da Fortuna", "Gire a roleta e acerte as perguntas.", "rodafortuna(02)", "index.html", "images/editorial/chess-board.jpg");
jleg("TRcraft", "Mundo voxel infinito para explorar e construir.", "minicraft(03)", "craft.html", "images/editorial/chess-board.jpg", true);
jleg("Hunterz", "A caçada na floresta: desvie e sobreviva.", "estilhacos(04)", "index.html", "images/editorial/chess-board.jpg");
jleg("MK: Ultimate Arena", "Jogo de luta com golpes especiais.", "mortalkombat(05)", "index.html", "images/editorial/chess-board.jpg");
jleg("Fuja das Esferas", "Corra e fuja das esferas que te perseguem.", "fujaesferas(06)", "index.html", "images/editorial/chess-board.jpg");
jleg("IFood Rider", "Corrida infinita entregando sem capotar.", "ifoodrunner(07)", "index.html", "images/editorial/chess-board.jpg");

const japp = (nome, desc, engine, params, destaque) =>
  J.push({ nome, desc, engine, params, imagem: "", destaque: !!destaque });

/* snake ×8 */
japp("Snake Neon", "O clássico da cobrinha em neon. Coma e cresça!", "snake", { tema: "neon" }, true);
japp("Snake Retrô", "Cobrinha verde estilo arcade dos anos 80.", "snake", { tema: "retrô" });
japp("Snake Rosa", "A cobrinha rosa. Mesmas regras, outro charme.", "snake", { tema: "rosa" });
japp("Snake Violeta", "Cobrinha violeta para quem gosta de roxo.", "snake", { tema: "violeta" });
japp("Snake Amarelo", "Cobrinha amarela bem visível no escuro.", "snake", { tema: "amarelo" });
japp("Snake Ciano", "Cobrinha ciana, rápida e fria.", "snake", { tema: "ciano" });
japp("Turbo Snake", "Snake duas vezes mais rápido. Só para corajosos.", "snake", { tema: "neon", velocidade: 70 });
japp("Snake Sem Muro", "Atravesse as bordas do tabuleiro e saia do outro lado.", "snake", { tema: "neon", wrap: true });

/* 2048 ×6 */
japp("2048 Clássico", "Junte os blocos e chegue à tile 2048.", "jogo2048", { n: 4, alvo: 2048 }, true);
japp("1024 Compacto", "Mesma mecânica, meta mais curta: chegue a 1024.", "jogo2048", { n: 4, alvo: 1024 });
japp("512 Mini", "Grade 3×3 e meta de 512. Aperte o raciocínio.", "jogo2048", { n: 3, alvo: 512 });
japp("2048 XL", "Grade 5×5 com muito mais espaço para manobrar.", "jogo2048", { n: 5, alvo: 2048 });
japp("4096 Extremo", "Para quem não se contenta com 2048.", "jogo2048", { n: 4, alvo: 4096 });
japp("8192 Lendário", "O desafio lendário: alcance a tile 8192.", "jogo2048", { n: 4, alvo: 8192 });

/* memoria ×12 */
const MEM = [
  ["Frutas", ["Maçã", "", "Morango", "Abacaxi", "Abacate"], true],
  ["Animais", ["Cachorro", "Gato", "Rato", "", "Coelho"], false],
  ["Esportes", ["Bola", "Basquete", "Tênis", "", ""], false],
  ["Espaço", ["Nave", "Mundo", "Lua", "⭐", "Cometa"], false],
  ["Comida", ["Pizza", "Hambúrguer", "Batata", "", ""], false],
  ["Natureza", ["Pinheiro", "Cacto", "Girassol", "Cogumelo", ""], false],
  ["Objetos", ["Mochila", "Chave", "⌚", "", ""], false],
  ["Corações", ["Vermelho", "Laranja", "Amarelo", "Verde", "Azul"], false],
  ["Música", ["Violão", "Piano", "Trompete", "", "Bateria"], false],
  ["Clima", ["Sol", "Neve", "Energia", "Arco-íris", "Tempestade"], false],
  ["Festas", ["Concluído", "Presente", "Balão", "Bolo", ""], false],
  ["Carros", ["Carro", "", "", "", "Carro"], false],
];
for (const [t, emo, d] of MEM) japp("Memória: " + t, "Encontre os pares de " + t.toLowerCase() + " no menor número de jogadas.", "memoria", { emoji: emo, cols: 3 }, d);

/* velha ×2 */
japp("Velha vs CPU", "Jogo da velha contra o computador.", "velha", { cpu: true });
japp("Velha a Dois", "Jogo da velha para dois jogadores no mesmo aparelho.", "velha", { cpu: false });

/* minas ×5 */
japp("Campo Minado: Fácil", "Tabuleiro 8×8 com 8 minas.", "minas", { rows: 8, cols: 8, bombs: 8 });
japp("Campo Minado: Clássico", "O clássico 9×9 com 10 minas.", "minas", { rows: 9, cols: 9, bombs: 10 }, true);
japp("Campo Minado: Médio", "12×12 com 20 minas. Cuidado!", "minas", { rows: 12, cols: 12, bombs: 20 });
japp("Campo Minado: Difícil", "14×14 com 30 minas. Só experts.", "minas", { rows: 14, cols: 14, bombs: 30 });
japp("Campo Minado: Expert", "16×16 com 40 minas. Boa sorte.", "minas", { rows: 16, cols: 16, bombs: 40 });

/* pong ×2 */
japp("Pong Neon", "Pong em neon contra a CPU.", "pong", { neon: true }, true);
japp("Pong Clássico", "Pong estilo original, sem neons.", "pong", { neon: false });

/* simon ×2 */
japp("Simon Diz", "Repita a sequência de luzes e sons.", "simon", { turbo: false }, true);
japp("Simon Turbo", "Simon com sequências mais rápidas.", "simon", { turbo: true });

/* reflexos ×4 */
japp("Reflexos: Tempo", "Clique quando aparecer o verde o mais rápido possível.", "reflexos", { modo: "tempo" });
japp("Reflexos: Turbo", "Versão turbo: o verde aparece mais rápido e imprevisível.", "reflexos", { modo: "turbo" });
japp("Reflexos: Pare no Meio", "Mova o cursor e pare o mais perto possível do centro.", "reflexos", { modo: "pare" });
japp("Reflexos: Cores", "Memorize a cor e clique no nome dela em 30 segundos.", "reflexos", { modo: "cor" });

/* cacador ×5 */
const CAC = [
  ["Caça-Frutas", ["Maçã", ""], false],
  ["Caça-Doce", ["Rosquinha", "Doce"], false],
  ["Caça-Ferramentas", ["Martelo", "Ferramenta"], false],
  ["Caça-Símbolos", ["⭐", "Cristal"], false],
  ["Caça-Moedas", ["Moeda", "Moeda"], false],
];
for (const [t, emo, d] of CAC) japp(t, "Pegue os itens que caem antes que saiam da tela. 30 segundos.", "cacador", { emoji: emo }, d);

/* forca ×5 */
japp("Forca: Animais", "Palavras paraenses… digo, de bichos!", "forca", {
  palavras: ["cavalo", "tatu", "jacare", "arara", "onca", "capivara", "tucano", "morcego", "cobra", "sapo"],
}, true);
japp("Forca: Frutas", "Adivinhe a fruta antes de completar o boneco.", "forca", {
  palavras: ["mangueira", "goiaba", "abacaxi", "maracuja", "pitaya", "carambola", "jabuticaba", "mamon"],
});
japp("Forca: Profissões", "Palavras de quem trabalha para você passar.", "forca", {
  palavras: ["padeiro", "dentista", "carpinteiro", "mecanico", "programador", "pedreiro", "pintor", "piloto"],
});
japp("Forca: Lugares", "Cidades, países e lugares do Brasil e do mundo.", "forca", {
  palavras: ["amazonas", "recife", "lisboa", "patagonia", "patagonia", "marrakech", "belgrado", "salvador"],
});
japp("Forca: Palavras Longas", "Para quem já domina a forca: só palavras longas.", "forca", {
  palavras: ["xale", "burburinho", "borboleta", "borboleta", "carambola", "jornalista", "borboleteiro"],
});

/* adivinhe ×3 */
japp("Adivinhe o Número (100)", "O número está entre 1 e 100. Acerte em poucas tentativas.", "adivinhe", { max: 100 });
japp("Adivinhe o Número (500)", "Entre 1 e 500: pense em busca binária!", "adivinhe", { max: 500 });
japp("Adivinhe o Número (1000)", "Entre 1 e 1000. O logaritmo é seu amigo.", "adivinhe", { max: 1000 });

/* sudoku ×4 */
japp("Sudoku 4×4", "Sudoku de entrada: grade 4×4.", "sudoku", { n: 4, buracos: 8 });
japp("Sudoku 6×6", "Sudoku intermediário: grade 6×6.", "sudoku", { n: 6, buracos: 12 });
japp("Sudoku 9×9", "O clássico: grade 9×9.", "sudoku", { n: 9, buracos: 20 }, true);
japp("Sudoku 9×9: Difícil", "Grade 9×9 com poucos números iniciais.", "sudoku", { n: 9, buracos: 30 });

/* quinze ×2 */
japp("Quebra-Cabeça 8", "Ordene as peças 1 a 8 (grade 3×3).", "quinze", { n: 3 });
japp("Quebra-Cabeça 15", "Ordene as peças 1 a 15 (grade 4×4).", "quinze", { n: 4 });

/* asteroides ×2 */
japp("Asteroides Neon", "Destroie asteroides em estilo neon.", "asteroides", { neon: true });
japp("Asteroides Clássico", "Astrominado estilo arcade original.", "asteroides", { neon: false });

/* invasores ×2 */
japp("Invasores Espaciais", "Defenda a Terra das fileiras de invasores.", "invasores", { turbo: false });
japp("Invasores Turbo", "Invasores mais rápidos e sem piedade.", "invasores", { turbo: true });

/* flappy ×2 */
japp("Flappy Pipa", "Toque para voar. A pipa verde não para.", "flappy", { tema: "verde" }, true);
japp("Flappy Lua", "A pipa atravessa a noite lunar.", "flappy", { tema: "lua" });

/* runner ×4 */
japp("Runner Neon", "Corra e pule obstáculos em cenário neon.", "runner", { tema: "neon" }, true);
japp("Runner Dino", "O clássico dinossauro em versão Zcode.", "runner", { tema: "dino" });
japp("Runner Lua", "Corrida noturna em ritmo de sátiro… de lua.", "runner", { tema: "lua" });
japp("Runner Neo", "Corrida em roxo cyberpunk.", "runner", { tema: "neomex" });

/* alvo ×2 */
japp("Alvo Móvel", "Acerte o alvo antes que ele mude de lugar.", "alvo", { turbo: false });
japp("Alvo Turbo", "O alvo não fica parado: versão turbo.", "alvo", { turbo: true });

/* pilha ×2 */
japp("Pilha de Blocos", "Empilhe blocos sem deixar cair. Quanto mais alto, melhor.", "pilha", { neon: false }, true);
japp("Pilha Neon", "O empilhador em estilo neon.", "pilha", { neon: true });

/* stroop ×2 */
japp("Jogo Stroop", "Diga a COR da tinta, não a palavra.", "stroop", { turbo: false });
japp("Stroop Turbo", "Stroop com tempo encurtado.", "stroop", { turbo: true });

/* boliche ×1 */
japp("Boliche", "Arraste a bola e derrube as 10 pinos.", "boliche", {}, true);

/* dadoDuelo ×2 */
japp("Duelo do 7", "Vence quem chegar primeiro a somar 7 com dois dados.", "dadoDuelo", { alvo: 7 });
japp("Duelo do 12", "A soma máxima: chegue a 12 primeiro.", "dadoDuelo", { alvo: 12 });

/* blackjack ×1 */
japp("Blackjack 21", "Pegue até 21 sem estourar. Contra o dealer.", "blackjack", {}, true);

/* labirinto ×4 */
japp("Labirinto 9", "Encontre a saída no labirinto 9×9.", "labirinto", { n: 9 });
japp("Labirinto 13", "Labirinto 13×13, sem pressa — mas com paredes.", "labirinto", { n: 13 });
japp("Labirinto 11 com Fantasma", "Saia do labirinto antes que o fantasma te pegue.", "labirinto", { n: 11, perseguido: true }, true);
japp("Labirinto 17 com Fantasma", "Labirinto grande, fantasma ágil. Sorte!", "labirinto", { n: 17, perseguido: true });

/* bolhas ×2 */
japp("Bolhas", "Estoure todas as bolhas antes do tempo acabar.", "bolhas", { turbo: false });
japp("Bolhas Turbo", "Bolhas mais rápidas: reflexo afiado.", "bolhas", { turbo: true });

/* esquiva ×2 */
japp("Esquiva", "Desvie dos blocos que caem do topo.", "esquiva", { neon: false });
japp("Esquiva Neon", "A esquiva em neons psicodélicos.", "esquiva", { neon: true });

/* pintor ×2 */
japp("Pintor 6×6", "Repita o padrão de cores célula por célula.", "pintor", { n: 6 });
japp("Pintor 8×8", "Padrão 8×8: memória de cores em grau avançado.", "pintor", { n: 8 });

/* tapTempo ×1 */
japp("Tap Tempo", "Toque no ritmo exato do metrônomo. Precisão!", "tapTempo", {});

/* pegaQuedas ×2 */
japp("Pega Frutas", "Gire a cesta e pegue as frutas que caem.", "pegaQuedas", { noite: false }, true);
japp("Pega Frutas: Noite", "O mesmo jogo, agora no escuro. Cuidado com as bombas.", "pegaQuedas", { noite: true });

/* ── ÚTEIS ───────────────────────────────────────────────── */
const U = [];
const uleg = (nome, desc, dir, page, imagem, destaque) =>
  U.push({ nome, desc, legacy: dir, page, imagem, destaque: !!destaque });

uleg("Fauna Sonora", "Ouça o canto real dos animais.", "Sons(01)", "fauna.html", "images/editorial/study-notes.jpg", true);
uleg("Encurtador de Links", "Encurte e acompanhe seus links.", "diminuilink(02)", "index.html", "images/editorial/study-notes.jpg");
uleg("Lançador de Dados", "D3, D6, D20 e mais em 3D.", "dados(03)", "index.html", "images/editorial/study-notes.jpg");
uleg("Sorteador de Grupos", "Divida pessoas em grupos aleatórios.", "sorteargrupos(04)", "index.html", "images/editorial/study-notes.jpg");
uleg("Gerador de Gradiente", "Crie gradientes CSS e copie o código.", "cssatual(05)", "index.html", "images/editorial/study-notes.jpg");

const uapp = (nome, desc, engine, params, destaque) =>
  U.push({ nome, desc, engine, params, imagem: "", destaque: !!destaque });

/* conversores ×8 */
const CONV = {
  comprimento: "Comprimento", massa: "Massa", area: "Área", volume: "Volume",
  velocidade: "Velocidade", tempo: "Tempo", dados: "Dados", temperatura: "Temperatura",
};
for (const k of Object.keys(CONV)) {
  uapp("Conversor de " + CONV[k], "Converta entre as principais unidades de " + CONV[k].toLowerCase() + ".", "conversor", { cat: k }, k === "comprimento");
}

uapp("Calculadora Científica", "Raízes, potências, trig, log e mais.", "calcCientifica", {}, true);
uapp("Calculadora de Percentual", "Quanto é X% de Y? E o aumento/desconto?", "percentual", {});
uapp("Cronômetro", "Cronômetro com voltas e precisão de 100 ms.", "cronometro", {}, true);
uapp("Timer de Contagem", "Contagem regressiva com alarme sonoro.", "timer", {}, true);
uapp("Relógio Mundial", "Hora local em 18 cidades do mundo, ao vivo.", "relogioMundial", {});
uapp("Calendário", "Calendário do mês com navegação por anos.", "calendario", {});
uapp("Bússola", "Use o sensor do aparelho como bússola (ou simulação).", "busola", {});
uapp("Nível Digital", "Nível de bolha na tela para nivelar objetos.", "nivel", {});
uapp("Lousa", "Desenhe com o dedo ou o mouse, com cores e borracha.", "lousa", {});
uapp("Lista de Tarefas", "To-do list com prioridades. Salvo no navegador.", "todo", {}, true);
uapp("Rastreador de Hábitos", "Acompanhe seus hábitos diários com streak.", "habitos", {});
uapp("Gerador de Cores", "Converte HEX/RGB/HSL e gera tons.", "cor", {});
uapp("Contraste WCAG", "Teste a acessibilidade da sua combinação de cores.", "contraste", {});
uapp("Gerador de Senha", "Senhas aleatórias fortes com escolha de tamanho e símbolos.", "senha", {}, true);
uapp("Frase-Senha", "Senha tipo diceware: 4 palavras fáceis de lembrar.", "senha", { frase: true });
uapp("Codificador Base64", "Codifique e decodifique Base64 em tempo real.", "base64", {}, true);
uapp("Gerador de Hash", "MD5, SHA-1, SHA-256 e SHA-512 instantâneos.", "hash", {});
uapp("Gerador de UUID", "Crie UUIDs v4 em lote.", "uuid", {});
uapp("Gerador de Números", "Números aleatórios com intervalo e sem repetição.", "aleatorio", {});
uapp("Sorteador de Opções", "Digite opções e deixe o sorteio escolher.", "sorteador", { modo: "opcoes" });
uapp("Sorteador de Nomes", "Sorteie um nome de uma lista (prêmios, equipes).", "sorteador", { modo: "nomes" });
uapp("Cara ou Coroa", "Moeda virtual para decisões difíceis.", "moeda", {});
uapp("Estatísticas de Texto", "Palavras, caracteres, frases e tempo de leitura.", "textoStats", {});
uapp("Conversor de Maiúsculas", "camelCase, SNAKE_CASE, kebab-case e mais 7 modos.", "caseConv", {});
uapp("Codificador de URL", "Encode/decode de parâmetros de URL.", "urlEnc", {});
uapp("Lorem Ipsum", "Gere parágrafos de texto de preenchimento.", "lorem", {});
uapp("Formatador JSON", "Formate, comprima e valide JSON.", "jsonFmt", {}, true);
uapp("Testador de Regex", "Teste expressões regulares com destaque ao vivo.", "regex", {});
uapp("Comparador de Texto", "Diferença lado a lado entre dois textos.", "diff", {});
uapp("Editor Markdown", "Escreva Markdown e veja a prévia instantânea.", "markdown", {});
uapp("Conversor HTML/Entidades", "Converta texto para entidades HTML e vice-versa.", "htmlEnt", {});
uapp("Imagem para Base64", "Cole uma imagem e copie o data-URI.", "imgB64", {});
uapp("Gerador de QR Code", "Transforme qualquer texto ou URL em QR Code.", "qr", {}, true);
uapp("Calculadora de IMC", "Índice de massa corporal com faixa de referência.", "imc", {}, true);
uapp("Calculadora de Gorjeta", "Divida a conta e calcule a gorjeta.", "gorjeta", {});
uapp("Divisão de Conta", "Quanto cada um paga, com ou sem gorjeta.", "dividaConta", {});
uapp("Juros Compostos", "Montante de juros compostos vs simples.", "juros", {});
uapp("Prestação de Empréstimo", "Prestação mensal no sistema PRICE.", "prestacao", {});
uapp("Juros Simples", "A fórmula J = C·i·t na prática.", "jurosSimples", {});
uapp("Gasto Calórico (TMB)", "Calcule seu metabolismo basal e gasto diário.", "tmb", {});
uapp("Orçamento Pessoal", "Registre entradas e saídas, mês a mês.", "orcamento", {});
uapp("Meta de Água", "Acompanhe seu consumo diário de água.", "agua", {});
uapp("Calculadora de Sono", "A que horas dormir (ou acordar) para ciclos inteiros?", "sono", {});
uapp("Respiração 4-7-8", "Respiração guiada para acalmar em minutos.", "respiracao", {});
uapp("Calculadora de Idade", "Sua idade exata em anos, meses e dias.", "idade", {});
uapp("Diferença de Datas", "Quantos dias entre duas datas.", "dataDiff", {});
uapp("Contagem de Evento", "Faltam X dias para o grande evento.", "dataEvento", {});
uapp("Cálculo de Gestação", "Data provável do parto (regra de Naegele).", "gestacao", {});
uapp("Semana e Trimestre", "Dia da semana, semana ISO e trimestre de qualquer data.", "semana", {});
uapp("Conversor CSV/JSON", "Transforme CSV em JSON e vice-versa.", "csvjson", {});
uapp("Sombra CSS", "Crie box-shadow e copie o CSS pronto.", "cssShadow", {}, true);
uapp("Raio CSS", "border-radius por canto, com prévia ao vivo.", "cssRadius", {});
uapp("Flexbox Playground", "Brinque com flexbox e copie o CSS.", "cssFlex", {});
uapp("CSS Grid Playground", "Explore grid-template com prévia interativa.", "cssGrid", {});
uapp("Curvas Bezier", "Ajuste cubic-bezier e veja a animação.", "cssBezier", {});
uapp("Tipografia", "Componha fonte, peso, linha e espaçamento.", "tipografia", {});
uapp("Palíndromo", "Verifique se a frase é lida igual aos dois sentidos.", "palindromo", {});
uapp("Máscara de Telefone", "Digite e veja o número formatado ao vivo.", "fone", {});
uapp("Validador de CPF", "Validação dos dígitos verificadores em tempo real.", "cpf", {}, true);
uapp("Conversor de Números Romanos", "Vá e volta entre arábicos e romanos.", "romano", {});
uapp("Conversor de Bases", "Binário, octal, decimal e hexadecimal em sincronia.", "bases", {});
uapp("Texto ↔ Hex", "Converta texto para bytes hex e vice-versa.", "hexTexto", {});
uapp("Cifra ROT13", "Cifre e decifre com o clássico ROT13.", "rot13", {});
uapp("Sorte de Ordem", "Sorteie a ordem de uma lista de participantes.", "ordem", {});
uapp("Conversor de Ângulos", "Graus ↔ radianos, complemento e suplemento.", "angulos", {});
uapp("Pitágoras", "Hipotenusa ou cateto, com os ângulos do triângulo.", "pitagoras", {});
uapp("Áreas de Formas", "Área e perímetro de 5 formas geométricas.", "areaFormas", {});
uapp("Média Ponderada", "Some notas com pesos e veja sua média final.", "mediaPond", {});
uapp("Nota da Recuperação", "Qual nota você precisa para alcançar a média?", "notaFinal", {});
uapp("Salário Líquido", "Simulação de INSS e IRRF sobre o bruto.", "salario", {});
uapp("Custo de Viagem", "Combustível, pedágio e hospedagem por pessoa.", "viagem", {});
uapp("Distância entre Pontos", "Haversine: distância real entre coordenadas.", "distancia", {});
uapp("Velocidade Média", "Calcule km/h, m/s e mph a partir de distância e tempo.", "velocidade", {});
uapp("Escala de Mapa", "Converta medidas de mapa em distância real.", "proporcao", {});
uapp("Área de Terreno", "m², hectares e alqueires de um terreno retangular.", "terreno", {});
uapp("Calculadora de Cimento", "Cimento, areia e brita para sua laje.", "cimento", {});
uapp("Calculadora de Tinta", "Litros e latas de tinta para sua parede.", "tinta", {});
uapp("Consumo de Energia", "Estime a conta de luz de um aparelho.", "energia", {});
uapp("Tempo de Download", "Quanto tempo leva para baixar aquele arquivo?", "download", {});
uapp("Gerador de Personagem", "Nomes e classes aleatórias para seu RPG.", "personagem", {});
uapp("Frase do Dia", "Citações curtas para inspirar o dia.", "frases", {});
uapp("Timestamp UNIX", "Converta datas e timestamps UNIX nos dois sentidos.", "timestamp", {});
uapp("Metrônomo", "BPM ajustável com tap tempo.", "metronomo", {});
uapp("Diário de Humor", "Registre seu humor e veja a tendência do mês.", "humor", {});
uapp("Rastreador de Metas", "Metas com barra de progresso e contagem.", "metas", {});
uapp("Número por Extenso", "Escreva qualquer número em palavras.", "porExtenso", {});
uapp("Comparador de Números", "Qual é maior, e por quanto?", "comparador", {});

/* ── export ─────────────────────────────────────────────── */
export const CATALOGO = { estudos: E, jogos: J, uteis: U };

export function validar() {
  const er = [];
  const cont = { estudos: E.length, jogos: J.length, uteis: U.length };
  for (const c of ["estudos", "jogos", "uteis"]) {
    if (cont[c] !== 100) er.push(`${c}: ${cont[c]} apps (esperado 100)`);
    const nomes = new Set();
    for (const e of CATALOGO[c]) {
      if (!e.nome || !e.desc) er.push(`${c}: app sem nome/desc`);
      if (nomes.has(e.nome)) er.push(`${c}: nome duplicado "${e.nome}"`);
      nomes.add(e.nome);
      if (!e.legacy && !e.engine) er.push(`${c}: "${e.nome}" sem engine nem legacy`);
    }
  }
  return er;
}
