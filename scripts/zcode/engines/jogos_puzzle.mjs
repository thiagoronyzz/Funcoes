/* Zcode — ENGINES DE JOGOS · PUZZLE / GESTÃO / NARRATIVA (DOM)
   Assinatura: ({ titulo, sub, tema }) => { body, js } */

import { hero, hud, help } from "./gbase.mjs";

const j = (v) => JSON.stringify(v);

/* ───────────────────────── 13. PARES (memória temática) ───────────────────────── */
export function pares({ titulo, sub, tema = {} }) {
  const t = { icones: ["🎨", "🗿", "🖼️", "🏛️", "🕯️", "📜", "🔭", "🎭"], ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Jogadas", id: "gMov", val: "0" },
    { rot: "Pares", id: "gPar", val: "0/8" },
    { rot: "Tempo", id: "gTmp", val: "0s" },
    { rot: "Recorde", id: "gRec", val: "—" },
    { btn: "🔄 Embaralhar", id: "gStart" },
  ])}
  <div class="zboard" id="bd" style="grid-template-columns:repeat(4,1fr)"></div>
  ${help("Vire duas cartas por vez e memorize as posições. Termine com o menor número de jogadas possível.")}
</div>`;
  const js = `
var T = ${j(t)};
var bd = document.getElementById("bd");
var cartas, sel, pares, movs, t0, timer, travado;
var r0 = Z.store.get("rec:par:" + document.body.dataset.app, null);
G.txt("gRec", r0 === null ? "—" : r0 + " jogadas");
function iniciar(){
  var base = T.icones.slice(0, 8);
  cartas = G.shuffle(base.concat(base)).map(function(e, i){ return { e: e, i: i, aberta: false, feita: false }; });
  sel = []; pares = 0; movs = 0; travado = false; t0 = Date.now();
  clearInterval(timer);
  timer = setInterval(function(){ G.txt("gTmp", Math.floor((Date.now()-t0)/1000) + "s"); }, 500);
  G.txt("gMov", 0); G.txt("gPar", "0/8");
  render();
}
function render(){
  bd.innerHTML = "";
  cartas.forEach(function(c, idx){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "zcell" + (c.feita ? " done" : (c.aberta ? " flip" : ""));
    b.textContent = (c.aberta || c.feita) ? c.e : "?";
    b.addEventListener("click", function(){ clicar(idx); });
    bd.appendChild(b);
  });
}
function clicar(i){
  if (travado) return;
  var c = cartas[i];
  if (c.aberta || c.feita) return;
  c.aberta = true; sel.push(i); Z.snd(560, .04); render();
  if (sel.length === 2){
    movs++; G.txt("gMov", movs); travado = true;
    var a = cartas[sel[0]], b = cartas[sel[1]];
    if (a.e === b.e){
      a.feita = b.feita = true; pares++; G.txt("gPar", pares + "/8");
      sel = []; travado = false; Z.snd(880, .07); render();
      if (pares === 8){
        clearInterval(timer);
        var rec = G.best("par:" + document.body.dataset.app, movs, false);
        G.txt("gRec", rec.valor + " jogadas");
        G.over(rec.novo ? "Novo recorde!" : "Tudo encontrado!", "Concluído em " + movs + " jogadas e " + Math.floor((Date.now()-t0)/1000) + "s.", "Jogar de novo", iniciar);
      }
    } else {
      setTimeout(function(){
        a.aberta = b.aberta = false; sel = []; travado = false; render();
      }, 620);
    }
  }
}
iniciar();
document.getElementById("gStart").addEventListener("click", iniciar);
`;
  return { body, js };
}

/* ───────────────────────── 14. SEQUÊNCIA (Simon) ───────────────────────── */
export function sequencia({ titulo, sub, tema = {} }) {
  const t = { botoes: ["🔴", "🟡", "🟢", "🔵"], ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Rodada", id: "gRod", val: "0" },
    { rot: "Sequência", id: "gSeq", val: "0" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "▶ Começar", id: "gStart" },
  ])}
  <div class="zboard" id="bd" style="grid-template-columns:repeat(2,1fr);max-width:340px"></div>
  <p class="center mt" id="msg" style="font-family:var(--z-fd);font-size:17px">Pressione começar</p>
  ${help("Observe a sequência que pisca e repita na mesma ordem. A cada rodada ela cresce um passo.")}
</div>`;
  const js = `
var T = ${j(t)};
var bd = document.getElementById("bd"), msg = document.getElementById("msg");
var seq = [], entrada = [], rodada = 0, aceita = false, botoes = [];
G.txt("gRec", Z.store.get("rec:seq:" + document.body.dataset.app, 0));
T.botoes.forEach(function(e, i){
  var b = document.createElement("button");
  b.type = "button"; b.className = "zcell"; b.textContent = e;
  b.style.fontSize = "34px";
  b.addEventListener("click", function(){ tocar(i); });
  bd.appendChild(b); botoes.push(b);
});
function pisca(i, ms){
  botoes[i].classList.add("on");
  Z.snd(340 + i * 130, .16);
  setTimeout(function(){ botoes[i].classList.remove("on"); }, ms || 320);
}
function mostrar(){
  aceita = false; msg.textContent = "Observe...";
  seq.forEach(function(v, k){ setTimeout(function(){ pisca(v); }, 520 * k + 380); });
  setTimeout(function(){ aceita = true; entrada = []; msg.textContent = "Sua vez!"; }, 520 * seq.length + 480);
}
function proxima(){
  rodada++; G.txt("gRod", rodada);
  seq.push(G.ri(0, T.botoes.length - 1));
  G.txt("gSeq", seq.length);
  mostrar();
}
function tocar(i){
  if (!aceita) return;
  pisca(i, 200); entrada.push(i);
  var k = entrada.length - 1;
  if (entrada[k] !== seq[k]){
    aceita = false;
    var b = G.best("seq:" + document.body.dataset.app, rodada - 1); G.txt("gRec", b.valor);
    msg.textContent = "Errou a sequência!";
    Z.snd(150, .3, "sawtooth");
    G.over(b.novo ? "Novo recorde!" : "Sequência quebrada", "Você chegou à rodada " + rodada + ".", "Tentar de novo", iniciar);
    return;
  }
  if (entrada.length === seq.length){ aceita = false; msg.textContent = "Certo!"; setTimeout(proxima, 700); }
}
function iniciar(){ seq = []; entrada = []; rodada = 0; G.txt("gRod", 0); G.txt("gSeq", 0); proxima(); }
document.getElementById("gStart").addEventListener("click", iniciar);
`;
  return { body, js };
}

/* ───────────────────────── 15. GESTÃO DE RECURSOS ───────────────────────── */
export function gestao({ titulo, sub, tema = {} }) {
  const t = {
    recursos: [
      { id: "a", nome: "População", ini: 12, icone: "👥" },
      { id: "b", nome: "Suprimentos", ini: 60, icone: "🍞" },
      { id: "c", nome: "Materiais", ini: 40, icone: "🧱" },
      { id: "d", nome: "Moral", ini: 70, icone: "💛" },
    ],
    acoes: [
      { rot: "Produzir suprimentos", custo: { c: 3 }, ganho: { b: 14 }, txt: "As despensas foram reabastecidas." },
      { rot: "Extrair materiais", custo: { b: 6 }, ganho: { c: 15 }, txt: "Novos materiais chegaram." },
      { rot: "Expandir moradia", custo: { c: 22, b: 12 }, ganho: { a: 4, d: 6 }, txt: "Mais gente se juntou ao lugar." },
      { rot: "Festival da comunidade", custo: { b: 10 }, ganho: { d: 18 }, txt: "O ânimo geral melhorou muito." },
    ],
    meta: "Chegue ao turno 20 com população acima de 25 e moral acima de 50.",
    ...tema,
  };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Turno", id: "gTur", val: "1" },
    { rot: "Pontuação", id: "gPts", val: "0" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "⏭ Avançar turno", id: "gTurno" },
  ])}
  <div class="zbars mb" id="bars"></div>
  <div class="zshop" id="acoes"></div>
  <div class="zcard mt" style="background:var(--z-surface2)">
    <b class="fd">Diário</b>
    <div class="zlist mt" id="log"></div>
  </div>
  ${help(`Objetivo: ${t.meta} Cada turno consome suprimentos proporcionais à população.`)}
</div>`;
  const js = `
var T = ${j(t)};
var R = {}, turno = 1, pts = 0, fimJogo = false;
G.txt("gRec", Z.store.get("rec:ges:" + document.body.dataset.app, 0));
function iniciar(){
  T.recursos.forEach(function(r){ R[r.id] = r.ini; });
  turno = 1; pts = 0; fimJogo = false;
  G.txt("gTur", 1); G.txt("gPts", 0);
  document.getElementById("log").innerHTML = "";
  log("O projeto começa. Boa sorte.");
  bars();
}
function bars(){
  var h = "";
  T.recursos.forEach(function(r){
    var v = Math.round(R[r.id]);
    h += '<div><i>' + r.icone + " " + r.nome + '</i><span class="zprog grow"><i style="width:' +
      G.clamp(v, 0, 100) + '%"></i></span><b>' + v + "</b></div>";
  });
  document.getElementById("bars").innerHTML = h;
}
function log(m){
  var box = document.getElementById("log");
  var p = document.createElement("p");
  p.textContent = "Turno " + turno + " · " + m;
  box.prepend(p);
}
function podePagar(c){
  for (var k in c) if (R[k] < c[k]) return false;
  return true;
}
function agir(i){
  if (fimJogo) return;
  var a = T.acoes[i];
  if (!podePagar(a.custo)) { Z.toast("Recursos insuficientes"); return; }
  for (var k in a.custo) R[k] -= a.custo[k];
  for (var g in a.ganho) R[g] += a.ganho[g];
  pts += 12; G.txt("gPts", pts);
  Z.snd(640, .05); log(a.txt); bars();
}
function avancar(){
  if (fimJogo) return;
  turno++; G.txt("gTur", turno);
  var consumo = Math.round(R.a * 0.7);
  R.b -= consumo;
  if (R.b < 0){ R.a += Math.floor(R.b / 4); R.d -= 9; R.b = 0; log("Falta de suprimentos! Moral e população caíram."); }
  else log("Turno tranquilo. Consumo: " + consumo + " suprimentos.");
  R.d = G.clamp(R.d - 1.5, 0, 100);
  R.a = Math.max(0, R.a);
  pts += Math.round(R.a + R.d / 3);
  G.txt("gPts", pts);
  bars();
  if (R.a <= 0 || R.d <= 0){
    fimJogo = true;
    var b = G.best("ges:" + document.body.dataset.app, pts); G.txt("gRec", b.valor);
    G.over("O projeto ruiu", "Você resistiu " + turno + " turnos. Pontuação: " + pts, "Recomeçar", iniciar);
  } else if (turno >= 20){
    fimJogo = true;
    var venceu = R.a > 25 && R.d > 50;
    var b2 = G.best("ges:" + document.body.dataset.app, pts); G.txt("gRec", b2.valor);
    G.over(venceu ? "Missão cumprida!" : "Fim do prazo", "Pontuação: " + pts + (venceu ? " — metas atingidas." : " — metas não atingidas."), "Jogar de novo", iniciar);
  }
}
var cont = document.getElementById("acoes");
T.acoes.forEach(function(a, i){
  var custo = Object.keys(a.custo).map(function(k){
    var r = T.recursos.filter(function(x){ return x.id === k; })[0];
    return a.custo[k] + " " + r.nome.toLowerCase();
  }).join(" + ") || "grátis";
  var b = document.createElement("button");
  b.type = "button";
  b.innerHTML = "<b>" + a.rot + "</b>custo: " + custo;
  b.addEventListener("click", function(){ agir(i); });
  cont.appendChild(b);
});
document.getElementById("gTurno").addEventListener("click", avancar);
iniciar();
`;
  return { body, js };
}

/* ───────────────────────── 16. ATENDIMENTO (pedidos com prazo) ───────────────────────── */
export function atendimento({ titulo, sub, tema = {} }) {
  const t = {
    clientes: ["Cliente misterioso", "Visitante ilustre", "Antigo conhecido", "Recém-chegado", "Figura lendária"],
    pedidos: [
      { nome: "Pedido simples", itens: ["🍞", "💧"] },
      { nome: "Pedido caprichado", itens: ["🍲", "🍷", "🕯️"] },
      { nome: "Pedido exótico", itens: ["🌶️", "🐟", "🍋"] },
      { nome: "Pedido doce", itens: ["🍰", "☕"] },
    ],
    estoque: ["🍞", "💧", "🍲", "🍷", "🕯️", "🌶️", "🐟", "🍋", "🍰", "☕"],
    ...tema,
  };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Atendidos", id: "gOk", val: "0" },
    { rot: "Reputação", id: "gRep", val: "100" },
    { rot: "Tempo", id: "gTmp", val: "—" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "▶ Abrir", id: "gStart" },
  ])}
  <div class="zcard mb" style="background:var(--z-surface2)">
    <span class="ztag" id="cli">aguardando</span>
    <p class="mt" id="ped" style="font-family:var(--z-fd);font-size:19px">Abra o expediente para receber o primeiro pedido.</p>
    <p class="dim mt" id="bandeja" style="font-size:22px;letter-spacing:6px">—</p>
    <div class="zprog mt"><i id="barra" style="width:100%"></i></div>
  </div>
  <div class="zbins" id="itens"></div>
  <div class="row mt" style="justify-content:center;gap:10px">
    <button class="zbtn" id="gServir" type="button">✅ Entregar</button>
    <button class="zbtn ghost" id="gLimpar" type="button">↺ Limpar bandeja</button>
  </div>
  ${help("Monte exatamente o pedido solicitado (a ordem não importa) e entregue antes do tempo acabar.")}
</div>`;
  const js = `
var T = ${j(t)};
var bandeja = [], pedido = null, rep = 100, ok = 0, prazo = 0, maxPrazo = 0, vivo = false;
G.txt("gRec", Z.store.get("rec:ate:" + document.body.dataset.app, 0));
var cont = document.getElementById("itens");
T.estoque.forEach(function(e){
  var b = document.createElement("button");
  b.type = "button"; b.innerHTML = "<b>" + e + "</b>adicionar";
  b.addEventListener("click", function(){
    if (!vivo) return Z.toast("Abra o expediente primeiro");
    if (bandeja.length >= 6) return Z.toast("Bandeja cheia");
    bandeja.push(e); Z.snd(520, .04); pinta();
  });
  cont.appendChild(b);
});
function pinta(){ document.getElementById("bandeja").textContent = bandeja.length ? bandeja.join(" ") : "—"; }
function novo(){
  pedido = G.pick(T.pedidos);
  document.getElementById("cli").textContent = G.pick(T.clientes);
  document.getElementById("ped").textContent = pedido.nome + ": " + pedido.itens.join(" ");
  bandeja = []; pinta();
  maxPrazo = Math.max(6, 16 - ok * 0.4); prazo = maxPrazo;
}
function iniciar(){ rep = 100; ok = 0; vivo = true; G.txt("gOk", 0); G.txt("gRep", 100); novo(); }
function fim(){
  vivo = false;
  var b = G.best("ate:" + document.body.dataset.app, ok); G.txt("gRec", b.valor);
  G.over(b.novo ? "Novo recorde!" : "Expediente encerrado", "Você atendeu " + ok + " pedido(s).", "Abrir de novo", iniciar);
}
function servir(){
  if (!vivo || !pedido) return;
  var a = bandeja.slice().sort().join(""), b = pedido.itens.slice().sort().join("");
  if (a === b){
    ok++; G.txt("gOk", ok); rep = Math.min(100, rep + 4); G.txt("gRep", Math.round(rep));
    Z.snd(920, .09); Z.toast("Pedido perfeito!");
  } else {
    rep -= 18; G.txt("gRep", Math.round(rep)); Z.snd(180, .18, "square"); Z.toast("Pedido errado…");
    if (rep <= 0) return fim();
  }
  novo();
}
G.loop(function(dt){
  if (!vivo) return;
  prazo -= dt / 60;
  if (prazo <= 0){
    rep -= 22; G.txt("gRep", Math.max(0, Math.round(rep)));
    Z.snd(170, .2, "sawtooth"); Z.toast("Cliente cansou de esperar");
    if (rep <= 0) return fim();
    novo();
  }
  G.txt("gTmp", Math.ceil(prazo) + "s");
  document.getElementById("barra").style.width = G.clamp(100 * prazo / maxPrazo, 0, 100) + "%";
});
document.getElementById("gServir").addEventListener("click", servir);
document.getElementById("gLimpar").addEventListener("click", function(){ bandeja = []; pinta(); });
document.getElementById("gStart").addEventListener("click", iniciar);
`;
  return { body, js };
}

/* ───────────────────────── 17. INVESTIGAÇÃO (dedução) ───────────────────────── */
export function investigacao({ titulo, sub, tema = {} }) {
  const t = {
    suspeitos: [
      { nome: "A testemunha", tracos: ["calmo", "canhoto", "usa relógio"] },
      { nome: "O vizinho", tracos: ["nervoso", "destro", "usa chapéu"] },
      { nome: "A colecionadora", tracos: ["calma", "destra", "usa luvas"] },
      { nome: "O visitante", tracos: ["nervoso", "canhoto", "usa luvas"] },
      { nome: "A guardiã", tracos: ["calma", "canhota", "usa chapéu"] },
      { nome: "O aprendiz", tracos: ["nervoso", "destro", "usa relógio"] },
    ],
    ...tema,
  };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Caso", id: "gCaso", val: "1" },
    { rot: "Pistas", id: "gPis", val: "0" },
    { rot: "Acertos", id: "gAcc", val: "0" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "🔍 Nova pista", id: "gPista" },
  ])}
  <div class="zcard" style="background:var(--z-surface2)">
    <b class="fd">Caderno de anotações</b>
    <div class="zlist mt" id="notas"><p class="dim">Peça uma pista para começar a investigação.</p></div>
  </div>
  <div class="zsus" id="sus"></div>
  ${help("Cada pista elimina suspeitos. Use no máximo 3 pistas: acusar com poucas pistas vale mais pontos.")}
</div>`;
  const js = `
var T = ${j(t)};
var culpado, usadas, caso = 1, acertos = 0, pontos = 0, resolvido = false;
G.txt("gRec", Z.store.get("rec:inv:" + document.body.dataset.app, 0));
function iniciar(){
  culpado = G.ri(0, T.suspeitos.length - 1);
  usadas = []; resolvido = false;
  G.txt("gPis", 0); G.txt("gCaso", caso);
  document.getElementById("notas").innerHTML = '<p class="dim">Peça uma pista para começar a investigação.</p>';
  render();
}
function render(){
  var c = document.getElementById("sus");
  c.innerHTML = "";
  T.suspeitos.forEach(function(s, i){
    var b = document.createElement("button");
    b.type = "button";
    b.innerHTML = "<b>" + s.nome + "</b>" + s.tracos.join(" · ");
    b.addEventListener("click", function(){ acusar(i); });
    c.appendChild(b);
  });
}
function pista(){
  if (resolvido) return;
  if (usadas.length >= 3) return Z.toast("Sem mais pistas: é hora de acusar");
  var tracos = T.suspeitos[culpado].tracos.filter(function(x){ return usadas.indexOf(x) < 0; });
  if (!tracos.length) return Z.toast("Todas as pistas já foram reveladas");
  var p = G.pick(tracos);
  usadas.push(p);
  G.txt("gPis", usadas.length);
  var box = document.getElementById("notas");
  if (usadas.length === 1) box.innerHTML = "";
  var el = document.createElement("p");
  el.textContent = "Pista " + usadas.length + ": o culpado é descrito como “" + p + "”.";
  box.prepend(el);
  Z.snd(700, .06);
}
function acusar(i){
  if (resolvido) return;
  resolvido = true;
  if (i === culpado){
    acertos++; pontos += Math.max(10, 40 - usadas.length * 10);
    G.txt("gAcc", acertos);
    var b = G.best("inv:" + document.body.dataset.app, pontos); G.txt("gRec", b.valor);
    Z.snd(950, .12);
    G.over("Caso resolvido!", T.suspeitos[i].nome + " era o culpado. Pontos: " + pontos, "Próximo caso", function(){ caso++; iniciar(); });
  } else {
    Z.snd(170, .25, "sawtooth");
    var b2 = G.best("inv:" + document.body.dataset.app, pontos); G.txt("gRec", b2.valor);
    G.over("Acusação errada", "O culpado era " + T.suspeitos[culpado].nome + ".", "Novo caso", function(){ caso++; pontos = Math.max(0, pontos - 10); iniciar(); });
  }
}
document.getElementById("gPista").addEventListener("click", pista);
iniciar();
`;
  return { body, js };
}

/* ───────────────────────── 18. COMBINAÇÃO (alquimia / receitas) ───────────────────────── */
export function combinacao({ titulo, sub, tema = {} }) {
  const t = {
    base: ["💧", "🔥", "🌬️", "🌱", "⭐", "🌑"],
    receitas: [
      { i: ["💧", "🔥"], r: "☁️", nome: "Vapor" },
      { i: ["🌱", "💧"], r: "🌳", nome: "Bosque" },
      { i: ["🔥", "🌬️"], r: "⚡", nome: "Faísca" },
      { i: ["⭐", "🌑"], r: "🌙", nome: "Eclipse" },
      { i: ["🌳", "⚡"], r: "🔥", nome: "Incêndio" },
      { i: ["☁️", "🌬️"], r: "🌧️", nome: "Chuva" },
      { i: ["🌧️", "⭐"], r: "🌈", nome: "Arco-íris" },
      { i: ["🌙", "🌈"], r: "🦄", nome: "Prodígio" },
    ],
    ...tema,
  };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Descobertas", id: "gDesc", val: "0" },
    { rot: "Total", id: "gTot", val: "0" },
    { rot: "Tentativas", id: "gTent", val: "0" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "↺ Recomeçar", id: "gStart" },
  ])}
  <div class="row center mb" style="justify-content:center;gap:16px;font-size:34px">
    <span id="s1">—</span><span class="dim" style="font-size:22px">+</span><span id="s2">—</span>
    <span class="dim" style="font-size:22px">=</span><span id="s3">?</span>
  </div>
  <div class="zbins" id="inv"></div>
  <div class="row mt" style="justify-content:center;gap:10px">
    <button class="zbtn" id="gMix" type="button">⚗️ Combinar</button>
    <button class="zbtn ghost" id="gClr" type="button">↺ Limpar seleção</button>
  </div>
  <div class="zcard mt" style="background:var(--z-surface2)">
    <b class="fd">Descobertas</b>
    <div class="zlist mt" id="log"><p class="dim">Combine dois elementos para descobrir novidades.</p></div>
  </div>
  ${help("Selecione dois elementos e combine. Cada nova combinação válida entra no seu inventário.")}
</div>`;
  const js = `
var T = ${j(t)};
var inv, sel, tent, desc;
G.txt("gRec", Z.store.get("rec:cmb:" + document.body.dataset.app, 0));
G.txt("gTot", T.receitas.length);
function iniciar(){
  inv = T.base.slice(); sel = []; tent = 0; desc = 0;
  G.txt("gDesc", 0); G.txt("gTent", 0);
  document.getElementById("log").innerHTML = '<p class="dim">Combine dois elementos para descobrir novidades.</p>';
  pinta();
}
function pinta(){
  var c = document.getElementById("inv");
  c.innerHTML = "";
  inv.forEach(function(e){
    var b = document.createElement("button");
    b.type = "button"; b.innerHTML = "<b>" + e + "</b>selecionar";
    if (sel.indexOf(e) >= 0) b.style.borderColor = "var(--z-acc)";
    b.addEventListener("click", function(){
      if (sel.length >= 2) sel = [];
      sel.push(e); Z.snd(520, .04); pinta();
    });
    c.appendChild(b);
  });
  document.getElementById("s1").textContent = sel[0] || "—";
  document.getElementById("s2").textContent = sel[1] || "—";
  document.getElementById("s3").textContent = "?";
}
function mix(){
  if (sel.length < 2) return Z.toast("Selecione dois elementos");
  tent++; G.txt("gTent", tent);
  var a = sel.slice().sort().join("");
  var achou = T.receitas.filter(function(r){ return r.i.slice().sort().join("") === a; })[0];
  if (achou){
    document.getElementById("s3").textContent = achou.r;
    if (inv.indexOf(achou.r) < 0){
      inv.push(achou.r); desc++; G.txt("gDesc", desc);
      var box = document.getElementById("log");
      if (desc === 1) box.innerHTML = "";
      var p = document.createElement("p");
      p.textContent = sel[0] + " + " + sel[1] + " = " + achou.r + " · " + achou.nome;
      box.prepend(p);
      Z.snd(920, .09);
      var b = G.best("cmb:" + document.body.dataset.app, desc); G.txt("gRec", b.valor);
      if (desc === T.receitas.length)
        G.over("Coleção completa!", "Você achou as " + T.receitas.length + " combinações em " + tent + " tentativas.", "Jogar de novo", iniciar);
    } else Z.toast("Você já conhecia essa combinação");
  } else { Z.snd(200, .1, "square"); Z.toast("Nada aconteceu…"); }
  sel = []; setTimeout(pinta, 700);
}
document.getElementById("gMix").addEventListener("click", mix);
document.getElementById("gClr").addEventListener("click", function(){ sel = []; pinta(); });
document.getElementById("gStart").addEventListener("click", iniciar);
iniciar();
`;
  return { body, js };
}

/* ───────────────────────── 19. ESCOLHAS (narrativa ramificada) ───────────────────────── */
export function escolhas({ titulo, sub, tema = {} }) {
  const t = {
    recurso: "Determinação",
    cenas: [
      { txt: "A jornada começa. Diante de você, três caminhos e pouco tempo.",
        ops: [{ r: "Seguir o caminho curto e arriscado", d: 12, p: 30 },
              { r: "Rodear pelo trajeto seguro", d: -4, p: 12 },
              { r: "Procurar alguém que conheça a região", d: 2, p: 20 }] },
      { txt: "Alguém pede ajuda no meio do percurso — atrasar pode custar caro.",
        ops: [{ r: "Ajudar sem pensar duas vezes", d: 8, p: 26 },
              { r: "Ajudar rápido e seguir", d: 2, p: 18 },
              { r: "Ignorar e continuar", d: -10, p: 8 }] },
      { txt: "Uma passagem estreita exige deixar algo para trás.",
        ops: [{ r: "Abrir mão do que pesa", d: -2, p: 24 },
              { r: "Improvisar uma solução", d: 10, p: 32 },
              { r: "Voltar e procurar outro caminho", d: -6, p: 10 }] },
      { txt: "O objetivo está próximo, mas o cansaço fala mais alto.",
        ops: [{ r: "Descansar um pouco", d: -3, p: 14 },
              { r: "Ir até o fim de uma vez", d: 14, p: 36 },
              { r: "Pedir apoio a quem te acompanha", d: 4, p: 24 }] },
      { txt: "Última decisão: o que você faz com o que conquistou?",
        ops: [{ r: "Compartilhar com todos", d: 6, p: 34 },
              { r: "Guardar para a próxima jornada", d: 2, p: 22 },
              { r: "Usar tudo agora", d: 10, p: 28 }] },
    ],
    ...tema,
  };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Capítulo", id: "gCap", val: "1" },
    { rot: t.recurso, id: "gRes", val: "50" },
    { rot: "Pontos", id: "gPts", val: "0" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "↺ Recomeçar", id: "gStart" },
  ])}
  <p id="txt" style="font-family:var(--z-fd);font-size:20px;line-height:1.45"></p>
  <div class="col mt" id="ops"></div>
  <div class="zcard mt" style="background:var(--z-surface2)">
    <b class="fd">Sua história</b>
    <div class="zlist mt" id="log"></div>
  </div>
  ${help("Cada escolha muda seus recursos e a pontuação final. Não existe caminho perfeito — só consequências.")}
</div>`;
  const js = `
var T = ${j(t)};
var i, res, pts;
G.txt("gRec", Z.store.get("rec:esc:" + document.body.dataset.app, 0));
function iniciar(){
  i = 0; res = 50; pts = 0;
  G.txt("gRes", 50); G.txt("gPts", 0);
  document.getElementById("log").innerHTML = "";
  cena();
}
function cena(){
  var c = T.cenas[i];
  G.txt("gCap", i + 1);
  document.getElementById("txt").textContent = c.txt;
  var box = document.getElementById("ops");
  box.innerHTML = "";
  c.ops.forEach(function(o, k){
    var b = document.createElement("button");
    b.type = "button"; b.className = "zopty";
    b.innerHTML = "<i>" + (k + 1) + "</i><span>" + o.r + "</span>";
    b.addEventListener("click", function(){ escolher(o); });
    box.appendChild(b);
  });
}
function escolher(o){
  res = G.clamp(res + o.d, 0, 100); pts += o.p;
  G.txt("gRes", res); G.txt("gPts", pts);
  var p = document.createElement("p");
  p.textContent = "Cap. " + (i + 1) + ": " + o.r;
  document.getElementById("log").prepend(p);
  Z.snd(640, .06);
  i++;
  if (res <= 0){
    var b0 = G.best("esc:" + document.body.dataset.app, pts); G.txt("gRec", b0.valor);
    return G.over("Você desistiu", T.recurso + " chegou a zero. Pontos: " + pts, "Recomeçar", iniciar);
  }
  if (i >= T.cenas.length){
    var b = G.best("esc:" + document.body.dataset.app, pts); G.txt("gRec", b.valor);
    var fim = pts >= 140 ? "Final glorioso" : (pts >= 100 ? "Final digno" : "Final discreto");
    return G.over(fim, "Pontuação: " + pts + " · " + T.recurso + ": " + res, "Jogar de novo", iniciar);
  }
  cena();
}
document.getElementById("gStart").addEventListener("click", iniciar);
iniciar();
`;
  return { body, js };
}

/* ───────────────────────── 20. ORDENAR (sequência lógica) ───────────────────────── */
export function ordenar({ titulo, sub, tema = {} }) {
  const t = {
    conjuntos: [
      { rot: "Do menor para o maior", itens: ["🐜", "🐁", "🐈", "🐎", "🐘", "🐋"] },
      { rot: "Do amanhecer à noite", itens: ["🌄", "🌅", "☀️", "🌇", "🌆", "🌃"] },
      { rot: "Da semente à árvore", itens: ["🌰", "🌱", "🪴", "🌿", "🎋", "🌳"] },
      { rot: "Da lua nova à cheia", itens: ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖"] },
    ],
    ...tema,
  };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Rodada", id: "gRod", val: "1" },
    { rot: "Acertos", id: "gAcc", val: "0" },
    { rot: "Tempo", id: "gTmp", val: "40s" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "▶ Começar", id: "gStart" },
  ])}
  <p class="center mb" id="rot" style="font-family:var(--z-fd);font-size:19px">Pressione começar</p>
  <div class="zboard" id="bd" style="grid-template-columns:repeat(6,1fr);max-width:520px"></div>
  <div class="row mt" style="justify-content:center">
    <button class="zbtn" id="gConf" type="button">✅ Conferir ordem</button>
  </div>
  ${help("Toque em duas peças para trocá-las de lugar até formar a ordem pedida.")}
</div>`;
  const js = `
var T = ${j(t)};
var atual, ordem, sel = -1, rod = 1, acc = 0, tempo = 40, vivo = false;
G.txt("gRec", Z.store.get("rec:ord:" + document.body.dataset.app, 0));
function iniciar(){ rod = 1; acc = 0; tempo = 40; vivo = true; G.txt("gAcc", 0); nova(); }
function nova(){
  atual = T.conjuntos[(rod - 1) % T.conjuntos.length];
  document.getElementById("rot").textContent = atual.rot;
  do { ordem = G.shuffle(atual.itens); } while (ordem.join("") === atual.itens.join(""));
  sel = -1; G.txt("gRod", rod); render();
}
function render(){
  var bd = document.getElementById("bd");
  bd.innerHTML = "";
  ordem.forEach(function(e, i){
    var b = document.createElement("button");
    b.type = "button"; b.className = "zcell" + (sel === i ? " sel" : "");
    b.textContent = e;
    b.addEventListener("click", function(){
      if (!vivo) return Z.toast("Pressione começar");
      if (sel < 0){ sel = i; }
      else if (sel === i){ sel = -1; }
      else { var t2 = ordem[sel]; ordem[sel] = ordem[i]; ordem[i] = t2; sel = -1; Z.snd(520, .04); }
      render();
    });
    bd.appendChild(b);
  });
}
function conferir(){
  if (!vivo) return;
  if (ordem.join("") === atual.itens.join("")){
    acc++; G.txt("gAcc", acc); tempo += 10; Z.snd(920, .1); Z.toast("Ordem correta! +10s");
    rod++; nova();
  } else { tempo -= 5; Z.snd(190, .14, "square"); Z.toast("Ainda não está certo (−5s)"); }
}
G.loop(function(dt){
  if (!vivo) return;
  tempo -= dt / 60;
  G.txt("gTmp", Math.max(0, Math.ceil(tempo)) + "s");
  if (tempo <= 0){
    vivo = false;
    var b = G.best("ord:" + document.body.dataset.app, acc); G.txt("gRec", b.valor);
    G.over(b.novo ? "Novo recorde!" : "Tempo esgotado", "Sequências corretas: " + acc, "Jogar de novo", iniciar);
  }
});
document.getElementById("gConf").addEventListener("click", conferir);
document.getElementById("gStart").addEventListener("click", iniciar);
nova(); vivo = false;
`;
  return { body, js };
}

/* ───────────────────────── 21. ENCONTRAR (achar o diferente / rápido) ───────────────────────── */
export function encontrar({ titulo, sub, tema = {} }) {
  const t = { comum: "🗝️", alvo: "🔑", fundoNome: "objetos", ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Nível", id: "gNiv", val: "1" },
    { rot: "Pontos", id: "gPts", val: "0" },
    { rot: "Tempo", id: "gTmp", val: "45s" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "▶ Começar", id: "gStart" },
  ])}
  <p class="center mb" style="font-size:15px">Ache o item diferente entre os ${t.fundoNome}: <b id="dica" style="font-size:24px">${t.alvo}</b></p>
  <div class="zboard" id="bd"></div>
  ${help("Cada acerto aumenta a grade e o tempo. Cliques errados custam segundos.")}
</div>`;
  const js = `
var T = ${j(t)};
var niv = 1, pts = 0, tempo = 45, vivo = false, alvoIdx = 0, lado = 3;
G.txt("gRec", Z.store.get("rec:enc:" + document.body.dataset.app, 0));
function iniciar(){ niv = 1; pts = 0; tempo = 45; vivo = true; G.txt("gPts", 0); monta(); }
function monta(){
  lado = Math.min(8, 2 + niv);
  G.txt("gNiv", niv);
  var n = lado * lado;
  alvoIdx = G.ri(0, n - 1);
  var bd = document.getElementById("bd");
  bd.style.gridTemplateColumns = "repeat(" + lado + ",1fr)";
  bd.innerHTML = "";
  for (var i = 0; i < n; i++){
    (function(i){
      var b = document.createElement("button");
      b.type = "button"; b.className = "zcell";
      b.style.fontSize = Math.max(15, 34 - lado * 2) + "px";
      b.textContent = i === alvoIdx ? T.alvo : T.comum;
      b.addEventListener("click", function(){ clicar(i); });
      bd.appendChild(b);
    })(i);
  }
}
function clicar(i){
  if (!vivo) return Z.toast("Pressione começar");
  if (i === alvoIdx){
    pts += 20 + niv * 5; niv++; tempo += 4;
    G.txt("gPts", pts); Z.snd(900, .07); monta();
  } else { tempo -= 3; Z.snd(180, .12, "square"); Z.toast("Não é esse (−3s)"); }
}
G.loop(function(dt){
  if (!vivo) return;
  tempo -= dt / 60;
  G.txt("gTmp", Math.max(0, Math.ceil(tempo)) + "s");
  if (tempo <= 0){
    vivo = false;
    var b = G.best("enc:" + document.body.dataset.app, pts); G.txt("gRec", b.valor);
    G.over(b.novo ? "Novo recorde!" : "Tempo esgotado", "Pontos: " + pts + " · nível " + niv, "Jogar de novo", iniciar);
  }
});
monta(); vivo = false;
document.getElementById("gStart").addEventListener("click", iniciar);
`;
  return { body, js };
}

/* ───────────────────────── 22. CULTIVO (fazenda por turnos) ───────────────────────── */
export function cultivo({ titulo, sub, tema = {} }) {
  const t = {
    semente: "🌱", maduro: "🌾", terra: "🟫", moeda: "💰",
    nomeCultura: "cultura", ciclos: 4,
    ...tema,
  };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Dia", id: "gDia", val: "1" },
    { rot: t.moeda + " Saldo", id: "gSaldo", val: "60" },
    { rot: "Colhidos", id: "gCol", val: "0" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "🌙 Passar o dia", id: "gDiaBtn" },
  ])}
  <p class="center mb dim" style="font-size:13px">Plantar custa 10 · colher rende 26 · a colheita estraga se ficar 3 dias madura.</p>
  <div class="zboard" id="bd" style="grid-template-columns:repeat(5,1fr);max-width:440px"></div>
  ${help(`Clique em um canteiro vazio para plantar. Depois de ${t.ciclos} dias a ${t.nomeCultura} amadurece — clique de novo para colher.`)}
</div>`;
  const js = `
var T = ${j(t)};
var lotes, dia, saldo, colhidos;
G.txt("gRec", Z.store.get("rec:cul:" + document.body.dataset.app, 0));
function iniciar(){
  lotes = []; for (var i = 0; i < 15; i++) lotes.push({ e: 0, idade: 0 });
  dia = 1; saldo = 60; colhidos = 0;
  G.txt("gDia", 1); G.txt("gSaldo", 60); G.txt("gCol", 0);
  render();
}
function render(){
  var bd = document.getElementById("bd");
  bd.innerHTML = "";
  lotes.forEach(function(l, i){
    var b = document.createElement("button");
    b.type = "button"; b.className = "zcell";
    b.textContent = l.e === 0 ? T.terra : (l.e === 1 ? T.semente : T.maduro);
    if (l.e === 2) b.classList.add("flip");
    b.addEventListener("click", function(){ tocar(i); });
    bd.appendChild(b);
  });
}
function tocar(i){
  var l = lotes[i];
  if (l.e === 0){
    if (saldo < 10) return Z.toast("Saldo insuficiente para plantar");
    saldo -= 10; l.e = 1; l.idade = 0; G.txt("gSaldo", saldo); Z.snd(520, .05);
  } else if (l.e === 2){
    saldo += 26; colhidos++; l.e = 0; l.idade = 0;
    G.txt("gSaldo", saldo); G.txt("gCol", colhidos); Z.snd(900, .07);
    var b = G.best("cul:" + document.body.dataset.app, colhidos); G.txt("gRec", b.valor);
  } else Z.toast("Ainda está crescendo…");
  render();
}
function passar(){
  dia++; G.txt("gDia", dia);
  var perdas = 0;
  lotes.forEach(function(l){
    if (l.e === 1){ l.idade++; if (l.idade >= T.ciclos) { l.e = 2; l.idade = 0; } }
    else if (l.e === 2){ l.idade++; if (l.idade >= 3){ l.e = 0; l.idade = 0; perdas++; } }
  });
  if (perdas) Z.toast(perdas + " colheita(s) estragaram");
  render();
  if (saldo < 10 && !lotes.some(function(l){ return l.e > 0; })){
    var b = G.best("cul:" + document.body.dataset.app, colhidos); G.txt("gRec", b.valor);
    G.over("Sem recursos", "Você colheu " + colhidos + " vez(es) em " + dia + " dias.", "Recomeçar", iniciar);
  }
}
document.getElementById("gDiaBtn").addEventListener("click", passar);
iniciar();
`;
  return { body, js };
}

/* ───────────────────────── 23. CONSTRUIR (encaixe / rota) ───────────────────────── */
export function construir({ titulo, sub, tema = {} }) {
  const t = { peca: "🟦", inicio: "🚩", fim: "🏁", ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Nível", id: "gNiv", val: "1" },
    { rot: "Peças usadas", id: "gPec", val: "0" },
    { rot: "Orçamento", id: "gOrc", val: "18" },
    { rot: "Melhor nível", id: "gRec", val: "1" },
    { btn: "↺ Reiniciar nível", id: "gStart" },
  ])}
  <div class="zboard" id="bd" style="grid-template-columns:repeat(8,1fr);max-width:520px"></div>
  <div class="row mt" style="justify-content:center">
    <button class="zbtn" id="gTest" type="button">🚚 Testar rota</button>
  </div>
  ${help(`Clique nas células para construir um caminho contínuo (ortogonal) de ${t.inicio} até ${t.fim} sem estourar o orçamento.`)}
</div>`;
  const js = `
var T = ${j(t)};
var L = 8, cel, niv = 1, orc = 18, inicio, fim2;
G.txt("gRec", Z.store.get("rec:con:" + document.body.dataset.app, 1));
function iniciar(){
  cel = [];
  for (var i = 0; i < L*L; i++) cel.push(0);
  inicio = 0; fim2 = L*L - 1;
  orc = Math.max(14, 22 - niv);
  // obstáculos
  var obs = Math.min(18, 4 + niv * 2);
  for (var k = 0; k < obs; k++){
    var p = G.ri(0, L*L - 1);
    if (p !== inicio && p !== fim2) cel[p] = 2;
  }
  G.txt("gNiv", niv); G.txt("gOrc", orc); G.txt("gPec", 0);
  render();
}
function usadas(){ return cel.filter(function(v){ return v === 1; }).length; }
function render(){
  var bd = document.getElementById("bd");
  bd.innerHTML = "";
  cel.forEach(function(v, i){
    var b = document.createElement("button");
    b.type = "button"; b.className = "zcell" + (v === 1 ? " on" : "");
    b.textContent = i === inicio ? T.inicio : (i === fim2 ? T.fim : (v === 2 ? "⛔" : (v === 1 ? T.peca : "")));
    b.addEventListener("click", function(){ clicar(i); });
    bd.appendChild(b);
  });
  G.txt("gPec", usadas());
}
function clicar(i){
  if (i === inicio || i === fim2 || cel[i] === 2) return;
  if (cel[i] === 1){ cel[i] = 0; }
  else {
    if (usadas() >= orc) return Z.toast("Orçamento esgotado");
    cel[i] = 1; Z.snd(520, .04);
  }
  render();
}
function livre(i){ return cel[i] === 1 || i === inicio || i === fim2; }
function testar(){
  var visto = {}, fila = [inicio];
  visto[inicio] = 1;
  while (fila.length){
    var c = fila.shift();
    if (c === fim2){
      Z.snd(980, .12);
      niv++;
      var b = G.best("con:" + document.body.dataset.app, niv); G.txt("gRec", b.valor);
      return G.over("Rota concluída!", "Você usou " + usadas() + " peça(s). Vamos ao nível " + niv + ".", "Próximo nível", iniciar);
    }
    var r = Math.floor(c / L), q = c % L;
    var viz = [];
    if (r > 0) viz.push(c - L);
    if (r < L-1) viz.push(c + L);
    if (q > 0) viz.push(c - 1);
    if (q < L-1) viz.push(c + 1);
    viz.forEach(function(v){ if (!visto[v] && livre(v)){ visto[v] = 1; fila.push(v); } });
  }
  Z.snd(190, .16, "square");
  Z.toast("A rota ainda não conecta os dois pontos");
}
document.getElementById("gTest").addEventListener("click", testar);
document.getElementById("gStart").addEventListener("click", function(){ iniciar(); });
iniciar();
`;
  return { body, js };
}

/* ───────────────────────── 24. TRIAGEM (classificar rápido) ───────────────────────── */
export function triagem({ titulo, sub, tema = {} }) {
  const t = {
    caixas: [
      { rot: "Grupo A", icone: "🅰️", itens: ["🍎", "🍐", "🍋", "🍇"] },
      { rot: "Grupo B", icone: "🅱️", itens: ["🔧", "🔩", "⚙️", "🪛"] },
      { rot: "Grupo C", icone: "🆑", itens: ["🐟", "🐙", "🦀", "🐬"] },
    ],
    ...tema,
  };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Acertos", id: "gAcc", val: "0" },
    { rot: "Erros", id: "gErr", val: "0" },
    { rot: "Tempo", id: "gTmp", val: "45s" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "▶ Começar", id: "gStart" },
  ])}
  <p class="center" style="font-size:64px;line-height:1.1" id="item">—</p>
  <div class="zbins" id="bins"></div>
  ${help("Envie cada item para o grupo correto o mais rápido possível. Erros descontam tempo.")}
</div>`;
  const js = `
var T = ${j(t)};
var atual, acc = 0, err = 0, tempo = 45, vivo = false;
G.txt("gRec", Z.store.get("rec:tri:" + document.body.dataset.app, 0));
var bins = document.getElementById("bins");
T.caixas.forEach(function(c, i){
  var b = document.createElement("button");
  b.type = "button"; b.innerHTML = "<b>" + c.icone + "</b>" + c.rot + "<br><span class=\\"dim\\">" + c.itens.join(" ") + "</span>";
  b.addEventListener("click", function(){ enviar(i); });
  bins.appendChild(b);
});
function sortear(){
  var g = G.ri(0, T.caixas.length - 1);
  atual = { g: g, e: G.pick(T.caixas[g].itens) };
  document.getElementById("item").textContent = atual.e;
}
function iniciar(){ acc = 0; err = 0; tempo = 45; vivo = true; G.txt("gAcc", 0); G.txt("gErr", 0); sortear(); }
function enviar(i){
  if (!vivo) return Z.toast("Pressione começar");
  if (i === atual.g){ acc++; G.txt("gAcc", acc); tempo += 1.2; Z.snd(880, .05); }
  else { err++; G.txt("gErr", err); tempo -= 4; Z.snd(180, .13, "square"); }
  sortear();
}
G.loop(function(dt){
  if (!vivo) return;
  tempo -= dt / 60;
  G.txt("gTmp", Math.max(0, Math.ceil(tempo)) + "s");
  if (tempo <= 0){
    vivo = false;
    var b = G.best("tri:" + document.body.dataset.app, acc); G.txt("gRec", b.valor);
    G.over(b.novo ? "Novo recorde!" : "Tempo esgotado", acc + " acertos e " + err + " erros.", "Jogar de novo", iniciar);
  }
});
sortear(); vivo = false;
document.getElementById("gStart").addEventListener("click", iniciar);
`;
  return { body, js };
}

/* ───────────────────────── 25. REFLEXO (aperte no tempo certo) ───────────────────────── */
export function reflexo({ titulo, sub, tema = {} }) {
  const t = { alvo: "🎯", espera: "⏳", ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad center">
  ${hud([
    { rot: "Rodada", id: "gRod", val: "0/8" },
    { rot: "Última", id: "gUlt", val: "—" },
    { rot: "Média", id: "gMed", val: "—" },
    { rot: "Recorde", id: "gRec", val: "—" },
    { btn: "▶ Começar", id: "gStart" },
  ])}
  <button id="zona" type="button" style="width:100%;min-height:230px;border-radius:16px;border:1px solid var(--z-line2);
    background:var(--z-surface2);color:var(--z-text);font-family:var(--z-fd);font-size:26px;cursor:pointer">
    Pressione começar
  </button>
  ${help("Espere o painel mudar e clique o mais rápido possível. Clicar antes da hora invalida a rodada.")}
</div>`;
  const js = `
var T = ${j(t)};
var zona = document.getElementById("zona");
var estado = "off", t0 = 0, tempos = [], rod = 0, timer = null;
var r0 = Z.store.get("rec:ref:" + document.body.dataset.app, null);
G.txt("gRec", r0 === null ? "—" : r0 + " ms");
function iniciar(){
  tempos = []; rod = 0; G.txt("gMed", "—"); G.txt("gUlt", "—");
  proxima();
}
function proxima(){
  rod++; G.txt("gRod", rod + "/8");
  estado = "espera";
  zona.textContent = T.espera + " aguarde…";
  zona.style.background = "var(--z-surface2)";
  clearTimeout(timer);
  timer = setTimeout(function(){
    estado = "vai"; t0 = Date.now();
    zona.textContent = T.alvo + " AGORA!";
    zona.style.background = "var(--z-acc)";
    Z.snd(880, .06);
  }, G.ri(900, 3200));
}
zona.addEventListener("click", function(){
  if (estado === "off") return;
  if (estado === "espera"){
    clearTimeout(timer);
    Z.snd(170, .18, "square");
    zona.textContent = "Cedo demais! Repetindo…";
    zona.style.background = "var(--z-surface2)";
    rod--; setTimeout(proxima, 900);
    return;
  }
  if (estado === "vai"){
    var d = Date.now() - t0;
    tempos.push(d);
    G.txt("gUlt", d + " ms");
    var med = Math.round(tempos.reduce(function(a,b){ return a+b; }, 0) / tempos.length);
    G.txt("gMed", med + " ms");
    Z.snd(640, .05);
    if (rod >= 8){
      estado = "off";
      zona.textContent = "Fim! Média " + med + " ms";
      zona.style.background = "var(--z-surface2)";
      var b = G.best("ref:" + document.body.dataset.app, med, false);
      G.txt("gRec", b.valor + " ms");
      G.over(b.novo ? "Novo recorde!" : "Teste concluído", "Média de reação: " + med + " ms", "Testar de novo", iniciar);
    } else { estado = "pausa"; setTimeout(proxima, 700); }
  }
});
document.getElementById("gStart").addEventListener("click", iniciar);
`;
  return { body, js };
}

/* ───────────────────────── 26. ILUMINAR (acender tudo / lights out) ───────────────────────── */
export function iluminar({ titulo, sub, tema = {} }) {
  const t = { on: "💡", off: "⚫", ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Nível", id: "gNiv", val: "1" },
    { rot: "Jogadas", id: "gMov", val: "0" },
    { rot: "Acesos", id: "gOn", val: "0" },
    { rot: "Melhor nível", id: "gRec", val: "1" },
    { btn: "↺ Novo tabuleiro", id: "gStart" },
  ])}
  <div class="zboard" id="bd" style="grid-template-columns:repeat(5,1fr);max-width:380px"></div>
  ${help("Clicar em uma célula inverte ela e as vizinhas. Acenda o tabuleiro inteiro para passar de nível.")}
</div>`;
  const js = `
var T = ${j(t)};
var L = 5, g, niv = 1, movs = 0;
G.txt("gRec", Z.store.get("rec:ilu:" + document.body.dataset.app, 1));
function inv(i){
  if (i < 0 || i >= L*L) return;
  g[i] = g[i] ? 0 : 1;
}
function aplicar(i){
  var r = Math.floor(i / L), c = i % L;
  inv(i);
  if (r > 0) inv(i - L);
  if (r < L-1) inv(i + L);
  if (c > 0) inv(i - 1);
  if (c < L-1) inv(i + 1);
}
function iniciar(){
  g = []; for (var i = 0; i < L*L; i++) g.push(1);
  var emb = 3 + niv * 2;
  for (var k = 0; k < emb; k++) aplicar(G.ri(0, L*L - 1));
  movs = 0; G.txt("gMov", 0); G.txt("gNiv", niv);
  render();
}
function render(){
  var bd = document.getElementById("bd");
  bd.innerHTML = "";
  g.forEach(function(v, i){
    var b = document.createElement("button");
    b.type = "button"; b.className = "zcell" + (v ? " on" : "");
    b.textContent = v ? T.on : T.off;
    b.addEventListener("click", function(){ clicar(i); });
    bd.appendChild(b);
  });
  G.txt("gOn", g.filter(function(v){ return v; }).length + "/" + (L*L));
}
function clicar(i){
  aplicar(i); movs++; G.txt("gMov", movs); Z.snd(560, .04); render();
  if (g.every(function(v){ return v === 1; })){
    Z.snd(980, .13);
    niv++;
    var b = G.best("ilu:" + document.body.dataset.app, niv); G.txt("gRec", b.valor);
    G.over("Tudo aceso!", "Resolvido em " + movs + " jogadas. Nível " + niv + " a seguir.", "Próximo nível", iniciar);
  }
}
document.getElementById("gStart").addEventListener("click", function(){ iniciar(); });
iniciar();
`;
  return { body, js };
}

/* ───────────────────────── 27. DESLIZAR (quebra-cabeça 3x3) ───────────────────────── */
export function deslizar({ titulo, sub, tema = {} }) {
  const t = { pecas: ["1", "2", "3", "4", "5", "6", "7", "8"], ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Jogadas", id: "gMov", val: "0" },
    { rot: "No lugar", id: "gOk", val: "0/8" },
    { rot: "Tempo", id: "gTmp", val: "0s" },
    { rot: "Recorde", id: "gRec", val: "—" },
    { btn: "🔀 Embaralhar", id: "gStart" },
  ])}
  <div class="zboard" id="bd" style="grid-template-columns:repeat(3,1fr);max-width:330px"></div>
  ${help("Clique numa peça vizinha do espaço vazio para deslizá-la. Recomponha a ordem original.")}
</div>`;
  const js = `
var T = ${j(t)};
var meta = T.pecas.concat([""]), estado, movs, t0, timer;
var r0 = Z.store.get("rec:des:" + document.body.dataset.app, null);
G.txt("gRec", r0 === null ? "—" : r0 + " jogadas");
function vazio(){ return estado.indexOf(""); }
function podeMover(i){
  var v = vazio();
  var r1 = Math.floor(i/3), c1 = i%3, r2 = Math.floor(v/3), c2 = v%3;
  return Math.abs(r1-r2) + Math.abs(c1-c2) === 1;
}
function iniciar(){
  estado = meta.slice();
  for (var k = 0; k < 120; k++){
    var v = vazio(), cand = [];
    for (var i = 0; i < 9; i++) if (podeMover(i)) cand.push(i);
    var p = G.pick(cand);
    estado[v] = estado[p]; estado[p] = "";
  }
  movs = 0; t0 = Date.now();
  clearInterval(timer);
  timer = setInterval(function(){ G.txt("gTmp", Math.floor((Date.now()-t0)/1000) + "s"); }, 500);
  G.txt("gMov", 0);
  render();
}
function render(){
  var bd = document.getElementById("bd");
  bd.innerHTML = "";
  estado.forEach(function(v, i){
    var b = document.createElement("button");
    b.type = "button"; b.className = "zcell" + (v === "" ? " done" : "");
    b.style.fontFamily = "var(--z-fd)";
    b.textContent = v;
    b.addEventListener("click", function(){ clicar(i); });
    bd.appendChild(b);
  });
  var ok = 0;
  for (var i = 0; i < 9; i++) if (estado[i] !== "" && estado[i] === meta[i]) ok++;
  G.txt("gOk", ok + "/8");
}
function clicar(i){
  if (!podeMover(i)) return;
  var v = vazio();
  estado[v] = estado[i]; estado[i] = "";
  movs++; G.txt("gMov", movs); Z.snd(500, .04); render();
  if (estado.join("|") === meta.join("|")){
    clearInterval(timer);
    Z.snd(980, .14);
    var b = G.best("des:" + document.body.dataset.app, movs, false);
    G.txt("gRec", b.valor + " jogadas");
    G.over(b.novo ? "Novo recorde!" : "Resolvido!", "Você organizou tudo em " + movs + " jogadas.", "Embaralhar de novo", iniciar);
  }
}
document.getElementById("gStart").addEventListener("click", iniciar);
iniciar();
`;
  return { body, js };
}

/* ───────────────────────── 28. NEGOCIAR (compra e venda) ───────────────────────── */
export function negociar({ titulo, sub, tema = {} }) {
  const t = {
    moeda: "moedas",
    mercadorias: [
      { nome: "Item comum", base: 20, icone: "📦" },
      { nome: "Item raro", base: 55, icone: "💎" },
      { nome: "Item volátil", base: 35, icone: "🌀" },
    ],
    ...tema,
  };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Dia", id: "gDia", val: "1/20" },
    { rot: t.moeda, id: "gMoe", val: "200" },
    { rot: "Patrimônio", id: "gPat", val: "200" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "⏭ Próximo dia", id: "gDiaBtn" },
  ])}
  <div id="merc"></div>
  <div class="zcard mt" style="background:var(--z-surface2)">
    <b class="fd">Boletim do mercado</b>
    <div class="zlist mt" id="log"></div>
  </div>
  ${help("Compre barato, venda caro. Os preços oscilam todo dia — termine o dia 20 com o maior patrimônio.")}
</div>`;
  const js = `
var T = ${j(t)};
var precos, estoque, moedas, dia;
G.txt("gRec", Z.store.get("rec:neg:" + document.body.dataset.app, 0));
function iniciar(){
  precos = T.mercadorias.map(function(m){ return m.base; });
  estoque = T.mercadorias.map(function(){ return 0; });
  moedas = 200; dia = 1;
  document.getElementById("log").innerHTML = "";
  render();
}
function patrimonio(){
  return Math.round(moedas + estoque.reduce(function(a, q, i){ return a + q * precos[i]; }, 0));
}
function render(){
  G.txt("gDia", dia + "/20"); G.txt("gMoe", Math.round(moedas)); G.txt("gPat", patrimonio());
  var c = document.getElementById("merc");
  c.innerHTML = "";
  T.mercadorias.forEach(function(m, i){
    var row = document.createElement("div");
    row.className = "zcard mb";
    row.innerHTML = '<div class="row between wrap"><b class="fd" style="font-size:17px">' + m.icone + " " + m.nome +
      '</b><span class="ztag">preço ' + Math.round(precos[i]) + " · você tem " + estoque[i] + "</span></div>";
    var r2 = document.createElement("div");
    r2.className = "row mt wrap";
    var bc = document.createElement("button");
    bc.className = "zbtn sm"; bc.type = "button"; bc.textContent = "Comprar 1";
    bc.addEventListener("click", function(){ comprar(i); });
    var bv = document.createElement("button");
    bv.className = "zbtn ghost sm"; bv.type = "button"; bv.textContent = "Vender 1";
    bv.addEventListener("click", function(){ vender(i); });
    r2.appendChild(bc); r2.appendChild(bv);
    row.appendChild(r2);
    c.appendChild(row);
  });
}
function log(m){
  var p = document.createElement("p"); p.textContent = "Dia " + dia + " · " + m;
  document.getElementById("log").prepend(p);
}
function comprar(i){
  if (moedas < precos[i]) return Z.toast("Sem " + T.moeda + " suficientes");
  moedas -= precos[i]; estoque[i]++; Z.snd(560, .05); render();
}
function vender(i){
  if (estoque[i] <= 0) return Z.toast("Você não tem esse item");
  moedas += precos[i]; estoque[i]--; Z.snd(820, .05); render();
}
function proximo(){
  dia++;
  precos = precos.map(function(p, i){
    var vol = i === 2 ? 0.42 : 0.2;
    var np = p * (1 + G.rnd(-vol, vol));
    return G.clamp(np, T.mercadorias[i].base * 0.35, T.mercadorias[i].base * 2.4);
  });
  var ev = Math.random();
  if (ev < 0.18){ precos[1] *= 1.5; log("Boato de escassez: itens raros dispararam."); }
  else if (ev < 0.34){ precos[0] *= 0.7; log("Excesso de oferta: itens comuns despencaram."); }
  else log("Mercado sem grandes novidades.");
  render();
  if (dia > 20){
    var pat = patrimonio();
    var b = G.best("neg:" + document.body.dataset.app, pat); G.txt("gRec", b.valor);
    G.over(b.novo ? "Novo recorde!" : "Fim do período", "Patrimônio final: " + pat + " " + T.moeda, "Negociar de novo", iniciar);
  }
}
document.getElementById("gDiaBtn").addEventListener("click", proximo);
iniciar();
`;
  return { body, js };
}

/* ───────────────────────── 29. CUIDAR (pet / criatura) ───────────────────────── */
export function cuidar({ titulo, sub, tema = {} }) {
  const t = {
    criatura: ["🥚", "🐣", "🐥", "🦅"],
    barras: [
      { id: "f", nome: "Fome", icone: "🍖", inicio: 70 },
      { id: "h", nome: "Humor", icone: "😊", inicio: 70 },
      { id: "e", nome: "Energia", icone: "🔋", inicio: 70 },
    ],
    acoes: [
      { rot: "Alimentar", ef: { f: 26, e: -4 }, txt: "Comeu com vontade." },
      { rot: "Brincar", ef: { h: 24, e: -12, f: -8 }, txt: "Divertiu-se bastante." },
      { rot: "Descansar", ef: { e: 30, h: -4 }, txt: "Tirou uma boa soneca." },
      { rot: "Cuidar / higiene", ef: { h: 12, e: -3 }, txt: "Ficou limpinho e contente." },
    ],
    ...tema,
  };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Idade", id: "gIda", val: "0 h" },
    { rot: "Estágio", id: "gEst", val: "1/4" },
    { rot: "Cuidado", id: "gPts", val: "0" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "⏭ Passar 1 hora", id: "gHora" },
  ])}
  <p class="center" style="font-size:74px;line-height:1.1" id="face">🥚</p>
  <div class="zbars mb" id="bars"></div>
  <div class="zshop" id="acoes"></div>
  <div class="zcard mt" style="background:var(--z-surface2)">
    <b class="fd">Registro de cuidados</b>
    <div class="zlist mt" id="log"></div>
  </div>
  ${help("Mantenha as três barras acima de zero. A criatura evolui a cada 10 horas bem cuidadas.")}
</div>`;
  const js = `
var T = ${j(t)};
var S = {}, horas, pts, vivo;
G.txt("gRec", Z.store.get("rec:cui:" + document.body.dataset.app, 0));
function iniciar(){
  T.barras.forEach(function(b){ S[b.id] = b.inicio; });
  horas = 0; pts = 0; vivo = true;
  document.getElementById("log").innerHTML = "";
  G.txt("gIda", "0 h"); G.txt("gPts", 0); G.txt("gEst", "1/4");
  render();
}
function render(){
  var h = "";
  T.barras.forEach(function(b){
    var v = Math.round(S[b.id]);
    h += '<div><i>' + b.icone + " " + b.nome + '</i><span class="zprog grow"><i style="width:' + G.clamp(v,0,100) + '%"></i></span><b>' + v + "</b></div>";
  });
  document.getElementById("bars").innerHTML = h;
  var est = Math.min(3, Math.floor(horas / 10));
  document.getElementById("face").textContent = T.criatura[est];
  G.txt("gEst", (est + 1) + "/4");
}
function log(m){
  var p = document.createElement("p"); p.textContent = horas + "h · " + m;
  document.getElementById("log").prepend(p);
}
function agir(i){
  if (!vivo) return;
  var a = T.acoes[i];
  for (var k in a.ef) S[k] = G.clamp(S[k] + a.ef[k], 0, 100);
  pts += 6; G.txt("gPts", pts);
  Z.snd(680, .05); log(a.txt); render();
}
function hora(){
  if (!vivo) return;
  horas++; G.txt("gIda", horas + " h");
  S.f = G.clamp(S.f - 9, 0, 100);
  S.h = G.clamp(S.h - 6, 0, 100);
  S.e = G.clamp(S.e - 7, 0, 100);
  var media = (S.f + S.h + S.e) / 3;
  pts += Math.round(media / 10); G.txt("gPts", pts);
  render();
  if (S.f <= 0 || S.h <= 0 || S.e <= 0){
    vivo = false;
    var b = G.best("cui:" + document.body.dataset.app, pts); G.txt("gRec", b.valor);
    G.over("A criatura precisou ir embora", "Você cuidou por " + horas + " horas. Pontos: " + pts, "Começar de novo", iniciar);
  } else if (horas >= 40){
    vivo = false;
    var b2 = G.best("cui:" + document.body.dataset.app, pts); G.txt("gRec", b2.valor);
    G.over("Criatura adulta!", "Criação completa com " + pts + " pontos de cuidado.", "Criar outra", iniciar);
  }
}
var cont = document.getElementById("acoes");
T.acoes.forEach(function(a, i){
  var b = document.createElement("button");
  b.type = "button"; b.innerHTML = "<b>" + a.rot + "</b>ação de cuidado";
  b.addEventListener("click", function(){ agir(i); });
  cont.appendChild(b);
});
document.getElementById("gHora").addEventListener("click", hora);
iniciar();
`;
  return { body, js };
}

/* ───────────────────────── 30. QUIZ TEMÁTICO ───────────────────────── */
export function desafioQuiz({ titulo, sub, tema = {} }) {
  const t = {
    perguntas: [
      { p: "Qual decisão costuma render mais no longo prazo?", o: ["Agir sem planejar", "Planejar e ajustar", "Esperar sem agir"], c: 1 },
      { p: "Diante de um recurso escasso, o melhor é…", o: ["Gastar tudo de uma vez", "Distribuir com prioridade", "Ignorar o problema"], c: 1 },
      { p: "O que caracteriza uma boa estratégia?", o: ["Rigidez total", "Adaptação às informações", "Pura sorte"], c: 1 },
      { p: "Quando algo dá errado, o mais útil é…", o: ["Repetir igual", "Entender a causa", "Desistir"], c: 1 },
      { p: "Em equipe, o que ajuda mais?", o: ["Comunicação clara", "Silêncio absoluto", "Competição interna"], c: 0 },
    ],
    ...tema,
  };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Questão", id: "gQ", val: "1" },
    { rot: "Acertos", id: "gAcc", val: "0" },
    { rot: "Pontos", id: "gPts", val: "0" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "↺ Recomeçar", id: "gStart" },
  ])}
  <div class="zprog mb"><i id="barra" style="width:0%"></i></div>
  <p id="perg" style="font-family:var(--z-fd);font-size:20px;line-height:1.4"></p>
  <div class="col mt" id="ops"></div>
  ${help("Escolha a alternativa que faz mais sentido dentro da lógica do jogo. Respostas rápidas valem mais.")}
</div>`;
  const js = `
var T = ${j(t)};
var i, acc, pts, ordem, travado;
G.txt("gRec", Z.store.get("rec:qz:" + document.body.dataset.app, 0));
function iniciar(){
  i = 0; acc = 0; pts = 0; ordem = G.shuffle(T.perguntas.map(function(_, k){ return k; }));
  G.txt("gAcc", 0); G.txt("gPts", 0);
  mostrar();
}
function mostrar(){
  travado = false;
  var q = T.perguntas[ordem[i]];
  G.txt("gQ", (i + 1) + "/" + T.perguntas.length);
  document.getElementById("barra").style.width = (100 * i / T.perguntas.length) + "%";
  document.getElementById("perg").textContent = q.p;
  var box = document.getElementById("ops");
  box.innerHTML = "";
  q.o.forEach(function(txt, k){
    var b = document.createElement("button");
    b.type = "button"; b.className = "zopty";
    b.innerHTML = "<i>" + String.fromCharCode(65 + k) + "</i><span>" + txt + "</span>";
    b.addEventListener("click", function(){ responder(k, b, q); });
    box.appendChild(b);
  });
}
function responder(k, btn, q){
  if (travado) return;
  travado = true;
  var bs = document.querySelectorAll("#ops .zopty");
  for (var n = 0; n < bs.length; n++) bs[n].disabled = true;
  if (k === q.c){ btn.classList.add("ok"); acc++; pts += 20; Z.snd(900, .08); }
  else { btn.classList.add("err"); bs[q.c].classList.add("ok"); Z.snd(190, .16, "square"); }
  G.txt("gAcc", acc); G.txt("gPts", pts);
  setTimeout(function(){
    i++;
    if (i >= T.perguntas.length){
      document.getElementById("barra").style.width = "100%";
      var b = G.best("qz:" + document.body.dataset.app, pts); G.txt("gRec", b.valor);
      G.over(acc === T.perguntas.length ? "Perfeito!" : "Rodada concluída", acc + "/" + T.perguntas.length + " acertos · " + pts + " pontos", "Jogar de novo", iniciar);
    } else mostrar();
  }, 900);
}
document.getElementById("gStart").addEventListener("click", iniciar);
iniciar();
`;
  return { body, js };
}

export const JOGOS_PUZZLE = {
  pares, sequencia, gestao, atendimento, investigacao, combinacao, escolhas,
  ordenar, encontrar, cultivo, construir, triagem, reflexo, iluminar,
  deslizar, negociar, cuidar, desafioQuiz,
};
