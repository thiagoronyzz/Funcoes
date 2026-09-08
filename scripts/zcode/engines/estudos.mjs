/* Zcode — engines de Estudos.
   Cada engine: (p) => ({ body, js, css? }) */

/* ── MCQ genérico (quiz, enigmas, prob, stats, conj, trig, bandeiras, tradução, unidades, capitais, geoforms) ── */
function mcq({ titulo, sub, gen, tempoSeg, total }) {
  const tempoHtml = tempoSeg
    ? `<span class="zchip" id="timer" style="color:var(--z-red)">Tempo 0s</span>`
    : "";
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad" id="jogo">
  <div class="row between mb wrap">
    <span class="zchip" id="qnum">1/${total || "…"}</span>
    ${tempoHtml}
    <span class="zchip" id="score">Acertos: 0</span>
  </div>
  <div class="zprog mb"><i id="barra" style="width:0%"></i></div>
  <h3 id="pergunta" class="fd" style="font-size:21px;line-height:1.35;margin-bottom:18px;min-height:56px"></h3>
  <div class="col" id="opcoes"></div>
  <div class="row between mt" id="rodape" style="display:none">
    <span class="dim" id="dica" style="font-size:13.5px;max-width:60%"></span>
    <button class="zbtn" id="prox" type="button">Próxima →</button>
  </div>
</div>
<div class="zcard pad center hidden" id="fim">
  <p class="zchip mb" style="display:inline-flex">Resultado</p>
  <div class="zbig acc" id="fimnum">0%</div>
  <p class="dim mb" id="fimtxt"></p>
  <div class="row center" style="justify-content:center">
    <button class="zbtn ghost" id="rever" type="button">Ver erros</button>
    <button class="zbtn" id="reinicia" type="button">Jogar de novo</button>
  </div>
  <div class="col mt hidden" id="listaErros"></div>
</div>`;
  const js = `
var P = (function(){ var g = ${gen}; return g(); })();
var TOTAL = ${total || "P.length"};
var TEMPO = ${tempoSeg || 0};
var i = 0, acertos = 0, erros = [], bloqueado = false, timerId = null, restante = TEMPO;
var $q = function(id){return document.getElementById(id)};
function bar(){ var el=$q("barra"); if(el) el.style.width = ((i)/(TOTAL)*100)+"%"; }
function score(){ var el=$q("score"); if(el) el.textContent = "Acertos: "+acertos; }
function nova(){
  bloqueado = false;
  var p = P[i % P.length];
  if(!p){ fim(); return; }
  $q("qnum").textContent = (i+1)+"/"+TOTAL;
  $q("pergunta").innerHTML = p.t;
  $q("rodape").style.display = "none";
  var box = $q("opcoes"); box.innerHTML = "";
  var letras = ["A","B","C","D","E","F"];
  p.op.forEach(function(op, idx){
    var b = document.createElement("button");
    b.className = "zopty"; b.type = "button";
    b.innerHTML = "<i>"+(letras[idx]||idx+1)+"</i><span>"+op+"</span>";
    b.addEventListener("click", function(){ responder(idx, b); });
    box.appendChild(b);
  });
  bar(); score();
  if(TEMPO && !timerId){
    $q("timer").textContent = "Tempo "+restante+"s";
    timerId = setInterval(function(){
      restante--;
      $q("timer").textContent = "Tempo "+Math.max(restante,0)+"s";
      if(restante <= 0){
        clearInterval(timerId); timerId = null;
        fim();
      }
    }, 1000);
  }
}
function responder(idx, btn){
  if(bloqueado) return;
  bloqueado = true;
  clearInterval(timerId);
  var p = P[i % P.length];
  var botoes = Array.prototype.slice.call($q("opcoes").children);
  botoes.forEach(function(b){ b.disabled = true; });
  if(idx === p.a){
    btn.classList.add("ok"); acertos++;
    Z.snd(880, 0.09, "sine");
  } else {
    btn.classList.add("err");
    botoes[p.a].classList.add("ok");
    Z.snd(160, 0.16, "sawtooth", 0.04);
    erros.push({t: p.t, certo: p.op[p.a], seu: p.op[idx]});
  }
  $q("dica").textContent = p.dica || "";
  score();
  $q("rodape").style.display = "flex";
}
$prox();
function fim(){
  clearInterval(timerId);
  $q("jogo").classList.add("hidden");
  $q("fim").classList.remove("hidden");
  var pct = Math.round((acertos / TOTAL) * 100);
  $q("fimnum").textContent = pct + "%";
  $q("fimtxt").textContent = acertos + " de " + TOTAL + " acertos";
  var lista = $q("listaErros"); lista.innerHTML = "";
  erros.forEach(function(e, k){
    var d = Z.el("div", "zcard");
    d.style.padding = "12px 14px"; d.style.textAlign = "left";
    d.innerHTML = "<b class='acc'>" + (k + 1) + "</b> " + e.t + "<div class='dim' style='font-size:13px'>Resposta: " + e.certo + (e.seu ? " · Você: " + e.seu : "") + "</div>";
    lista.appendChild(d);
  });
}
function reiniciar(){
  clearInterval(timerId); timerId = null; restante = TEMPO;
  i = 0; acertos = 0; erros = [];
  P = Z.shuffle(P);
  $q("fim").classList.add("hidden");
  $q("listaErros").classList.add("hidden");
  $q("jogo").classList.remove("hidden");
  nova();
}
$prox();
function $prox(){ $q("prox").addEventListener("click", function(){ i++; if(i >= TOTAL){ fim(); } else nova(); }); }
$reinicia();
function $reinicia(){ $q("reinicia").addEventListener("click", reiniciar); }
$rever();
function $rever(){
  $q("rever").addEventListener("click", function(){
    var l = $q("listaErros"); l.classList.toggle("hidden");
    this.textContent = l.classList.contains("hidden") ? "Ver erros" : "Ocultar erros";
  });
}
reiniciar();
`;
  return { body, js };
}

/* ── Input genérico (drill aritmético, equações, sequências) ── */
function inputGame({ titulo, sub, gen, roundSeg, dec }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad center">
  <div class="row between mb wrap" style="justify-content:space-between">
    <span class="zchip" id="round">Rodada: 60s</span>
    <span class="zchip" id="acertos">OK 0</span>
    <span class="zchip" id="sequencia">Sequência: 0</span>
  </div>
  <div class="zbig acc mb" id="problema" style="min-height:84px;font-size:clamp(34px,7vw,60px)"></div>
  <div class="row" style="max-width:340px;margin:0 auto" id="linha">
    <input class="zinput" id="campo" type="text" inputmode="decimal" autocomplete="off" placeholder="sua resposta">
    <button class="zbtn" id="ok" type="button">OK</button>
  </div>
  <p class="dim mt" id="feedback" style="min-height:24px"></p>
  <div class="row mt" style="justify-content:center">
    <button class="zbtn ghost" id="nova" type="button">Pular (−1)</button>
  </div>
</div>
<div class="zcard pad center hidden" id="fim">
  <p class="zchip mb" style="display:inline-flex">Tempo esgotado!</p>
  <div class="zbig acc" id="fimnum">0</div>
  <p class="dim mb">respostas corretas nesta rodada</p>
  <button class="zbtn" id="reinicia" type="button">Nova rodada</button>
</div>`;
  const js = `
var G = ${gen};
var ROUND = ${roundSeg || 60};
var DEC = ${dec == null ? 2 : dec};
var t = ROUND, ok = 0, streak = 0, atual = null, bloqueado = false, tick = null;
function $id(x){return document.getElementById(x)}
function novo(){
  atual = G();
  $id("problema").textContent = atual.t;
  $id("campo").value = "";
  $id("feedback").textContent = "";
  $id("campo").focus();
  bloqueado = false;
}
function ch(x){
  if(bloqueado) return;
  var v = String(x).trim().replace(",", ".");
  if(v === "") return;
  var n = parseFloat(v);
  if(isNaN(n)){ $id("feedback").textContent = "Digite um número."; return; }
  var certo = Math.abs(n - atual.a) < Math.pow(10, -DEC) / 2 + 0.001;
  bloqueado = true;
  if(certo){
    ok++; streak++;
    Z.snd(840, 0.08, "sine");
    $id("feedback").textContent = "Correto! " + (atual.dica || "");
    $id("acertos").textContent = "OK " + ok;
    $id("sequencia").textContent = "Sequência: " + streak;
  } else {
    streak = 0;
    Z.snd(150, 0.16, "sawtooth", 0.04);
    $id("feedback").textContent = "Era " + atual.a + ". " + (atual.dica || "");
  }
  $id("sequencia").textContent = "Sequência: " + streak;
  setTimeout(novo, certo ? 420 : 900);
}
function iniciar(){
  t = ROUND; ok = 0; streak = 0;
  $id("fim").classList.add("hidden");
  novo();
  clearInterval(tick);
  tick = setInterval(function(){
    t--;
    $id("round").textContent = "Rodada: " + Math.max(t, 0) + "s";
    if(t <= 0){
      clearInterval(tick);
      $id("fim").classList.remove("hidden");
      $id("fimnum").textContent = ok;
      Z.snd(520, 0.3, "triangle", 0.06);
    }
  }, 1000);
}
$id("ok").addEventListener("click", function(){ ch($id("campo").value) });
$id("campo").addEventListener("keydown", function(e){ if(e.key === "Enter") ch(this.value) });
$id("nova").addEventListener("click", function(){ streak = 0; $id("feedback").textContent = "Pulou."; novo(); });
$id("reinicia").addEventListener("click", iniciar);
iniciar();
`;
  return { body, js };
}

/* ── Flashcards (estudo + teste) ── */
export function flashcards({ nome, deck }) {
  const data = JSON.stringify(deck);
  const body = `
<div class="zhero">
  <h1>${nome}</h1>
  <p>Estude no modo cartões ou desafie-se no modo teste. ${deck.length} cartões.</p>
</div>
<div class="row mb" style="justify-content:center">
  <button class="zbtn sm" id="modo-estudo" type="button">Leitura Estudo</button>
  <button class="zbtn sm ghost" id="modo-teste" type="button">Energia Teste</button>
  <button class="zbtn sm ghost" id="embaralhar" type="button">Ordem</button>
</div>
<div class="col" id="area" style="max-width:560px;margin:0 auto"></div>
<div class="row mt center" style="justify-content:center;gap:14px">
  <button class="zbtn ghost sm" id="prev" type="button">← Anterior</button>
  <span class="zchip" id="pos">1/12</span>
  <button class="zbtn ghost sm" id="next" type="button">Próxima →</button>
</div>
<div class="zcard pad center hidden" id="fim">
  <p class="zchip mb" style="display:inline-flex">Resultado do teste</p>
  <div class="zbig acc" id="fimnum">0%</div>
  <p class="dim mb" id="fimtxt"></p>
  <button class="zbtn" id="reinicia" type="button">Testar de novo</button>
</div>`;
  const js = `
var DECK = ${data};
var modo = "estudo", idx = 0, ordem = DECK.map(function(_,i){return i}), flip = false;
var tIdx = 0, tOk = 0, tN = 0;
function $id(x){return document.getElementById(x)}
function deckAtual(){ return ordem.map(function(i){return DECK[i]}) }
function rotulo(){ return $id("pos") }
function renderEstudo(){
  var d = deckAtual(); var c = d[idx % d.length];
  var area = $id("area"); area.innerHTML = "";
  var card = Z.el("div", "");
  card.style.cssText = "position:relative;perspective:1200px;cursor:pointer;height:260px";
  var inner = Z.el("div", "");
  inner.style.cssText = "position:relative;width:100%;height:100%;transition:transform .5s;transform-style:preserve-3d";
  var front = Z.el("div", "zcard pad");
  front.style.cssText = "position:absolute;inset:0;backface-visibility:hidden;display:grid;place-items:center;border:1px solid var(--z-acc);text-align:center";
  front.innerHTML = "<h2 class='fd acc'>? " + c[0] + "</h2><p class='dim' style='margin-top:10px'>toque para virar</p>";
  var back = Z.el("div", "zcard pad");
  back.style.cssText = "position:absolute;inset:0;backface-visibility:hidden;display:grid;place-items:center;transform:rotateY(180deg);text-align:center";
  back.innerHTML = "<p style='font-size:16.5px;line-height:1.5'><b class='acc'>" + c[0] + "</b><br><br>" + c[1] + "</p>";
  inner.appendChild(front); inner.appendChild(back);
  card.appendChild(inner);
  card.addEventListener("click", function(){ flip = !flip; inner.style.transform = flip ? "rotateY(180deg)" : "rotateY(0deg)"; });
  area.appendChild(card);
  rotulo().textContent = (idx % d.length + 1) + "/" + d.length;
}
function renderTeste(){
  var d = deckAtual();
  var p = d[tIdx % d.length];
  var area = $id("area"); area.innerHTML = "";
  var h = Z.el("h3", "fd center");
  h.style.fontSize = "24px"; h.innerHTML = "O que é <span class='acc'>" + p[0] + "</span>?";
  area.appendChild(h);
  var opts = [];
  opts.push(p[1]);
  var outros = Z.shuffle(d.filter(function(x){return x[1] !== p[1]})).slice(0, 3);
  outros.forEach(function(x){ opts.push(x[1]) });
  var certo = 0;
  Z.shuffle(opts).forEach(function(op, i){
    if(op === p[1]) certo = i;
    var b = Z.el("button", "zopty");
    b.innerHTML = "<i>" + ["A","B","C","D"][i] + "</i><span>" + op + "</span>";
    b.addEventListener("click", function(){
      area.querySelectorAll("button").forEach(function(x){ x.disabled = true; });
      if(i === certo){ tOk++; b.classList.add("ok"); Z.snd(840, .08, "sine"); }
      else { b.classList.add("err"); Z.snd(150, .15, "sawtooth", .04); }
      tN++;
      setTimeout(function(){
        tIdx++;
        if(tIdx >= d.length) fimTeste(); else renderTeste();
      }, 700);
    });
    area.appendChild(b);
  });
  rotulo().textContent = (tIdx % d.length + 1) + "/" + d.length;
}
function fimTeste(){
  $id("area").innerHTML = "";
  var pct = Math.round(tOk / tN * 100);
  $id("fim").classList.remove("hidden");
  $id("fimnum").textContent = pct + "%";
  $id("fimtxt").textContent = tOk + " de " + tN + " acertos";
}
function irPara(d, delta){
  if(modo === "estudo"){
    idx = (idx + delta + d.length) % d.length;
    flip = false; renderEstudo();
  } else if(tIdx < d.length){
    tIdx += delta;
    if(tIdx < 0) tIdx = d.length - 1;
    if(tIdx >= d.length) fimTeste(); else renderTeste();
  }
}
$id("modo-estudo").addEventListener("click", function(){
  modo = "estudo"; idx = 0; flip = false;
  $id("modo-estudo").classList.remove("ghost"); $id("modo-teste").classList.add("ghost");
  $id("fim").classList.add("hidden");
  renderEstudo();
});
$id("modo-teste").addEventListener("click", function(){
  modo = "teste"; tIdx = 0; tOk = 0; tN = 0;
  $id("modo-teste").classList.remove("ghost"); $id("modo-estudo").classList.add("ghost");
  $id("fim").classList.add("hidden");
  renderTeste();
});
$id("embaralhar").addEventListener("click", function(){
  ordem = Z.shuffle(ordem);
  Z.toast("Embaralhado!");
  if(modo === "estudo") renderEstudo(); else { tIdx = 0; tOk = 0; tN = 0; renderTeste(); }
});
$id("prev").addEventListener("click", function(){ irPara(deckAtual(), -1) });
$id("next").addEventListener("click", function(){ irPara(deckAtual(), 1) });
$id("reinicia").addEventListener("click", function(){
  $id("fim").classList.add("hidden");
  tIdx = 0; tOk = 0; tN = 0; renderTeste();
});
renderEstudo();
`;
  return { body, js };
}

/* ── Pares (jogo de memória conceitual) ── */
export function pares({ nome, sub, paresData }) {
  const data = JSON.stringify(paresData);
  const n = paresData.length;
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="row mb" style="justify-content:center;gap:8px;flex-wrap:wrap" id="stats">
  <span class="zchip" id="moves">Jogadas: 0</span>
  <span class="zchip" id="tempo">Tempo 0s</span>
  <span class="zchip" id="achados">Pares: 0/${n}</span>
</div>
<div class="zgrid" id="tabuleiro" style="grid-template-columns:repeat(4,1fr);max-width:560px;margin:0 auto;gap:10px"></div>
<div class="zcard pad center hidden" id="fim">
  <div class="zbig acc">Vitória</div>
  <h3>Completou em <span class="acc" id="fimMoves">0</span> jogadas</h3>
  <p class="dim" id="fimTempo"></p>
  <button class="zbtn" id="reinicia" type="button">Jogar de novo</button>
</div>`;
  const js = `
var PAR = ${data};
var moves = 0, achados = 0, seg = 0, tick = null, first = null, travado = false;
function $id(x){return document.getElementById(x)}
function novo(){
  moves = 0; achados = 0; seg = 0; first = null; travado = false;
  clearInterval(tick);
  tick = setInterval(function(){ seg++; $id("tempo").textContent = "Tempo " + seg + "s" }, 1000);
  $id("fim").classList.add("hidden");
  var cards = [];
  PAR.forEach(function(p, i){ cards.push({id: i, rot: p[0] || "?", texto: p[0] || "—"}, {id: i, rot: p[1], texto: p[1]}) });
  Z.shuffle(cards).forEach(function(c){
    var b = Z.el("button", "zopty");
    b.style.cssText = "flex-direction:column;justify-content:center;min-height:86px;font-size:14px;padding:10px";
    b.innerHTML = "<b style='font-size:22px;color:var(--z-muted)'>&#10022;</b>";
    b.dataset.id = c.id; b.dataset.v = c.texto;
    b.addEventListener("click", function(){ virar(b) });
    $id("tabuleiro").appendChild(b);
  });
  atualizar();
}
function virar(b){
  if(travado || b.classList.contains("ok") || b === first) return;
  b.classList.add("ok");
  b.style.color = "var(--z-text)";
  b.innerHTML = "<b>" + b.dataset.v + "</b>";
  if(!first){ first = b; return; }
  travado = true; moves++;
  var a = first, c = b; first = null;
  setTimeout(function(){
    if(a.dataset.id === c.dataset.id){
      achados++;
      Z.snd(920, 0.09, "sine");
    } else {
      a.classList.remove("ok"); c.classList.remove("ok");
      a.innerHTML = "<b style='font-size:22px;color:var(--z-muted)'>&#10022;</b>"; c.innerHTML = "<b style='font-size:22px;color:var(--z-muted)'>&#10022;</b>";
      Z.snd(180, 0.12, "sawtooth", 0.03);
    }
    travado = false;
    atualizar();
    if(achados >= ${n}){
      clearInterval(tick);
      $id("fim").classList.remove("hidden");
      $id("fimMoves").textContent = moves;
      $id("fimTempo").textContent = "Tempo: " + seg + "s";
      Z.snd(1040, 0.25, "triangle", 0.06);
    }
  }, 450);
}
function atualizar(){
  $id("moves").textContent = "Jogadas: " + moves;
  $id("achados").textContent = "Pares: " + achados + "/${n}";
}
$id("reinicia").addEventListener("click", novo);
novo();
`;
  return { body, js };
}

/* ── Anagrama ── */
export function anagrama({ nome, sub, palavras }) {
  const data = JSON.stringify(palavras);
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad center">
  <div class="row between mb" style="justify-content:space-between">
    <span class="zchip" id="nivel">Nível 1</span>
    <span class="zchip" id="acertos">OK 0</span>
  </div>
  <p class="dim mb" id="dica"></p>
  <div class="row mb wrap" style="justify-content:center;gap:8px" id="letras"></div>
  <div class="row" style="max-width:340px;margin:0 auto">
    <input class="zinput" id="campo" type="text" autocomplete="off" placeholder="digite a palavra">
    <button class="zbtn" id="ok" type="button">OK</button>
  </div>
  <p class="dim mt" id="feedback" style="min-height:22px"></p>
</div>`;
  const js = `
var PAL = ${data};
var idx = 0, ok = 0;
function norm(s){ return s.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/\\s/g, "") }
function $id(x){return document.getElementById(x)}
function novo(){
  idx = (idx) % PAL.length;
  var w = PAL[idx];
  var letras = w.split("");
  var emb = Z.shuffle(letras);
  if(emb.join("") === w) emb.reverse();
  $id("nivel").textContent = "Palavra " + (idx + 1) + "/" + PAL.length;
  $id("dica").textContent = w.length + " letras · comece com: " + w[0].toUpperCase();
  $id("letras").innerHTML = "";
  emb.forEach(function(l){
    var s = Z.el("span", "zchip");
    s.style.cssText = "font-size:18px;padding:8px 12px;font-family:var(--z-fd);font-weight:700";
    s.textContent = l;
    $id("letras").appendChild(s);
  });
  $id("campo").value = ""; $id("feedback").textContent = "";
  $id("campo").focus();
}
function checar(){
  var v = norm($id("campo").value);
  if(!v) return;
  if(v === norm(PAL[idx])){
    ok++;
    $id("acertos").textContent = "OK " + ok;
    $id("feedback").textContent = "Correto! " + PAL[idx];
    Z.snd(840, 0.09, "sine");
    idx++;
    if(idx >= PAL.length){ $id("feedback").textContent = "Fim! Você acertou " + ok + "/" + PAL.length + "."; $id("campo").disabled = true; $id("ok").disabled = true; }
    else setTimeout(novo, 500);
  } else {
    $id("feedback").textContent = "Tente de novo (" + v.length + "/" + PAL[idx].length + " letras)";
    Z.snd(160, 0.12, "sawtooth", 0.03);
  }
}
$id("ok").addEventListener("click", checar);
$id("campo").addEventListener("keydown", function(e){ if(e.key === "Enter") checar() });
novo();
`;
  return { body, js };
}

/* ── Verdadeiro / Falso ── */
export function tf({ nome, sub, itens }) {
  const data = JSON.stringify(itens);
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · ${itens.length} afirmações.</p></div>
<div class="zcard pad center">
  <div class="row between mb" style="justify-content:space-between">
    <span class="zchip" id="qnum">1/${itens.length}</span>
    <span class="zchip" id="score">Acertos: 0</span>
  </div>
  <div class="zprog mb"><i id="barra" style="width:0%"></i></div>
  <h3 id="frase" class="fd" style="font-size:20px;min-height:70px;margin-bottom:22px"></h3>
  <div class="row" style="justify-content:center;gap:14px" id="botoes">
    <button class="zbtn big" id="v" type="button" style="background:var(--z-lime)">OK Verdadeiro</button>
    <button class="zbtn big danger" id="f" type="button">Não Falso</button>
  </div>
  <p class="dim mt" id="feedback" style="min-height:22px"></p>
</div>
<div class="zcard pad center hidden" id="fim">
  <div class="zbig acc" id="fimnum">0%</div>
  <p class="dim mb" id="fimtxt"></p>
  <button class="zbtn" id="reinicia" type="button">Jogar de novo</button>
</div>`;
  const js = `
var IT = Z.shuffle(${data});
var i = 0, ok = 0, travado = false;
function $id(x){return document.getElementById(x)}
function novo(){
  travado = false;
  var p = IT[i];
  $id("qnum").textContent = (i + 1) + "/" + IT.length;
  $id("barra").style.width = (i / IT.length * 100) + "%";
  $id("frase").textContent = p[0];
  $id("feedback").textContent = "";
  $id("v").disabled = false; $id("f").disabled = false;
}
function responder(resp){
  if(travado) return;
  travado = true;
  var p = IT[i];
  if(resp === p[1]){ ok++; Z.snd(860, 0.08, "sine"); $id("feedback").textContent = "Correto!"; }
  else { Z.snd(150, 0.15, "sawtooth", 0.04); $id("feedback").textContent = "Era: " + (p[1] ? "Verdadeiro" : "Falso") + "."; }
  $id("score").textContent = "Acertos: " + ok;
  $id("v").disabled = true; $id("f").disabled = true;
  setTimeout(function(){
    i++;
    if(i >= IT.length) fim(); else novo();
  }, 900);
}
function fim(){
  $id("fim").classList.remove("hidden");
  var pct = Math.round(ok / IT.length * 100);
  $id("fimnum").textContent = pct + "%";
  $id("fimtxt").textContent = ok + " de " + IT.length + " acertos";
}
$id("v").addEventListener("click", function(){ responder(true) });
$id("f").addEventListener("click", function(){ responder(false) });
$id("reinicia").addEventListener("click", function(){ i = 0; ok = 0; $id("fim").classList.add("hidden"); novo(); });
novo();
`;
  return { body, js };
}

/* ── Palavras escondidas ── */
export function ws({ nome, sub, palavras }) {
  const data = JSON.stringify(palavras);
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · ${palavras.length} palavras.</p></div>
<div class="row mb wrap" style="justify-content:center;gap:8px" id="achadas"></div>
<div class="zcard pad" style="max-width:460px;margin:0 auto">
  <div class="zgrid" id="grade" style="grid-template-columns:repeat(8,1fr);gap:5px"></div>
  <p class="dim center mt" style="font-size:13px">Toque na 1ª letra e depois na última para marcar uma palavra (horizontal, vertical ou diagonal).</p>
</div>
<div class="zcard pad center hidden" id="fim">
  <div class="zbig acc">Alvo</div>
  <h3>Você encontrou todas!</h3>
  <button class="zbtn" id="reinicia" type="button">Jogar de novo</button>
</div>`;
  const js = `
var PAL = ${data};
var LET = "ABCDEFGHIJKLMNOPQRSTUVWXZ";
var grid = [], start = null, achadas = {};
function $id(x){return document.getElementById(x)}
function gerar(){
  grid = [];
  for(var r = 0; r < 8; r++){ grid.push([]); for(var c = 0; c < 8; c++) grid[r].push("") }
  Z.shuffle(PAL).forEach(function(p){
    var colocado = false, tent = 0;
    while(!colocado && tent < 400){
      tent++;
      var dir = Z.rnd(0, 2);
      var r0 = Z.rnd(0, 7), c0 = Z.rnd(0, 7);
      var rr = r0, cc = c0;
      if(dir === 0) cc = c0 + p.length - 1;
      if(dir === 1) rr = r0 + p.length - 1;
      if(dir === 2){ rr = r0 + p.length - 1; cc = c0 + p.length - 1 }
      if(rr > 7 || cc > 7) continue;
      var ok2 = true;
      for(var k = 0; k < p.length; k++){
        var r = dir === 1 ? r0 + k : r0 + (dir === 2 ? k : 0);
        var c = dir === 0 ? c0 + k : c0 + (dir === 2 ? k : 0);
        if(grid[r][c] && grid[r][c] !== p[k]) { ok2 = false; break }
      }
      if(!ok2) continue;
      for(var k2 = 0; k2 < p.length; k2++){
        var r2 = dir === 1 ? r0 + k2 : r0 + (dir === 2 ? k2 : 0);
        var c2 = dir === 0 ? c0 + k2 : c0 + (dir === 2 ? k2 : 0);
        grid[r2][c2] = p[k2];
      }
      colocado = true;
    }
  });
  for(var r3 = 0; r3 < 8; r3++) for(var c3 = 0; c3 < 8; c3++) if(!grid[r3][c3]) grid[r3][c3] = LET[Z.rnd(0, LET.length - 1)];
}
function celulas(){ return Array.prototype.slice.call($id("grade").children) }
function marcar(r1, c1, r2, c2){
  var dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
  var L = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1)) + 1;
  var linha = "";
  for(var k = 0; k < L; k++){
    var r = r1 + dr * k, c = c1 + dc * k;
    if(r < 0 || r > 7 || c < 0 || c > 7) return false;
    linha += grid[r][c];
  }
  var invert = linha.split("").reverse().join("");
  var alvo = null;
  PAL.forEach(function(p){ if(linha === p || invert === p) alvo = p });
  if(!alvo) return false;
  var cel = celulas();
  for(var k2 = 0; k2 < L; k2++){
    var r2 = r1 + dr * k2, c2 = c1 + dc * k2;
    cel[r2 * 8 + c2].style.background = "color-mix(in srgb, var(--z-acc) 30%, var(--z-surface2))";
    cel[r2 * 8 + c2].style.borderRadius = "8px";
  }
  achadas[alvo] = true;
  Z.snd(900, 0.09, "sine");
  var s = Z.el("span", "zchip");
  s.textContent = "OK " + alvo;
  $id("achadas").appendChild(s);
  if(Object.keys(achadas).length === PAL.length){
    setTimeout(function(){ $id("fim").classList.remove("hidden"); Z.snd(1040, 0.3, "triangle", 0.06) }, 400);
  }
  return true;
}
function pintar(){
  $id("grade").innerHTML = "";
  grid.forEach(function(lin, r){
    lin.forEach(function(l, c){
      var s = Z.el("span", "mono");
      s.textContent = l;
      s.style.cssText = "display:grid;place-items:center;aspect-ratio:1;background:var(--z-surface2);border-radius:8px;font-size:15px;font-weight:600";
      s.dataset.r = r; s.dataset.c = c;
      s.addEventListener("click", function(){
        if(!start){ start = {r: r, c: c}; s.style.outline = "2px solid var(--z-acc)" }
        else {
          var okc = marcar(start.r, start.c, r, c);
          if(!okc) Z.snd(180, 0.1, "sawtooth", 0.03);
          start = null;
          celulas().forEach(function(x){ x.style.outline = "" });
        }
      });
      $id("grade").appendChild(s);
    });
  });
}
function novo(){
  achadas = {}; start = null;
  $id("achadas").innerHTML = "";
  $id("fim").classList.add("hidden");
  gerar(); pintar();
}
$id("reinicia").addEventListener("click", novo);
novo();
`;
  return { body, js };
}

/* ── Revisão espaçada (SRS) ── */
export function srs({ nome, sub, itens, key }) {
  const data = JSON.stringify(itens);
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Repita até fixar: marque como <b class="acc">Errei / Tá bom / Fácil</b> e o app agenda as repetições.</p></div>
<div class="row mb" style="justify-content:center;gap:8px;flex-wrap:wrap">
  <span class="zchip" id="hoje">A revisar: 0</span>
  <span class="zchip" id="aprendidos">Fixados: 0</span>
</div>
<div class="col" style="max-width:520px;margin:0 auto">
  <div id="cardArea" style="height:220px"></div>
  <div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap">
    <button class="zbtn" id="mostrar" type="button">Mostrar resposta</button>
  </div>
  <div class="row hidden" id="notas" style="justify-content:center;gap:10px">
    <button class="zbtn danger sm" data-n="0" type="button">Errei</button>
    <button class="zbtn sm" data-n="1" type="button">Tá bom</button>
    <button class="zbtn ghost sm" data-n="2" type="button">Fácil</button>
  </div>
  <button class="zbtn ghost sm center mt" id="zerar" type="button" style="align-self:center">Zerar progresso</button>
</div>`;
  const js = `
var IT = ${data};
var CHAVE = ${JSON.stringify(key || "srs")};
var st = Z.store.get(CHAVE, {});
IT.forEach(function(p, i){ if(!st[i]) st[i] = {n: 0, prox: 0} });
var fila = [], pos = 0, flip = false;
function $id(x){return document.getElementById(x)}
function hoje(){ return Date.now() }
function filaHoje(){
  fila = [];
  IT.forEach(function(p, i){ if(st[i].prox <= hoje()) fila.push(i) });
  Z.shuffle(fila);
}
function fixados(){
  var n = 0;
  IT.forEach(function(p, i){ if(st[i].n >= 2) n++ });
  return n;
}
function atualizarStats(){
  $id("hoje").textContent = "A revisar: " + fila.length;
  $id("aprendidos").textContent = "Fixados: " + fixados() + "/" + IT.length;
}
function render(){
  flip = false;
  $id("notas").classList.add("hidden");
  $id("mostrar").disabled = false;
  var area = $id("cardArea"); area.innerHTML = "";
  if(pos >= fila.length){
    area.innerHTML = "<div class='zcard pad center'><div class='zbig acc'>Concluído</div><h3>Nada para revisar!</h3><p class='dim'>Volte amanhã ou marque como 'Fácil' para adiantar.</p></div>";
    atualizarStats();
    return;
  }
  var i = fila[pos];
  var card = Z.el("div", "zcard pad");
  card.style.cssText = "display:grid;place-items:center;text-align:center;cursor:pointer;min-height:220px";
  card.innerHTML = "<div><p class='zchip mb'>Cartão " + (pos + 1) + "/" + fila.length + "</p><h2 class='fd' id='face'>" + IT[i][0] + "</h2><p class='dim' id='verso' style='display:none;margin-top:14px;font-size:17px'></p></div>";
  card.addEventListener("click", function(){
    flip = !flip;
    $id("verso").style.display = flip ? "block" : "none";
    $id("verso").textContent = IT[i][1];
    if(flip) $id("notas").classList.remove("hidden");
  });
  area.appendChild(card);
}
function votar(nota){
  var i = fila[pos];
  var s = st[i];
  s.n = nota === 0 ? 0 : Math.min(s.n + 1, 6);
  var dias = [0, 0.02, 1, 3, 7, 14, 30][s.n] || 0.02;
  s.prox = hoje() + dias * 86400000;
  Z.store.set(CHAVE, st);
  pos++;
  Z.snd(700 + nota * 150, 0.08, "sine");
  atualizarStats();
  render();
}
Array.prototype.slice.call($id("notas").children).forEach(function(b){
  b.addEventListener("click", function(){ votar(parseInt(this.dataset.n, 10)) });
});
$id("mostrar").addEventListener("click", function(){
  $id("cardArea").firstChild.click();
});
$id("zerar").addEventListener("click", function(){
  Z.store.set(CHAVE, {});
  st = {}; IT.forEach(function(p, i){ st[i] = {n: 0, prox: 0} });
  pos = 0; filaHoje(); render();
  Z.toast("Progresso zerado");
});
filaHoje();
atualizarStats();
render();
`;
  return { body, js };
}

/* ── Planner de estudos ── */
export function planner() {
  const body = `
<div class="zhero"><h1>Planner de Estudos</h1><p>Organize suas tarefas de estudo com assunto, duração e data. Tudo fica salvo no seu navegador.</p></div>
<div class="zcard pad mb">
  <div class="zgrid zg3" style="grid-template-columns:1.4fr 0.8fr 1fr">
    <div><span class="zlabel">Assunto</span><input class="zinput" id="assunto" placeholder="Ex.: Revisar matemática"></div>
    <div><span class="zlabel">Duração (min)</span><input class="zinput" id="dur" type="number" min="5" step="5" value="25"></div>
    <div><span class="zlabel">Data</span><input class="zinput" id="data" type="date"></div>
  </div>
  <div class="row mt"><button class="zbtn" id="add" type="button">+ Adicionar</button><button class="zbtn ghost" id="limparFeitas" type="button">Marcar feitas como concluídas</button></div>
</div>
<div class="col" id="lista"></div>
<div class="row mt" style="justify-content:center;gap:8px">
  <span class="zchip" id="tot">Total: 0 tarefas</span>
  <span class="zchip" id="mins">Tempo planejado: 0 min</span>
</div>`;
  const js = `
var CHAVE = "planner";
var lista = Z.store.get(CHAVE, []);
function $id(x){return document.getElementById(x)}
function salvar(){ Z.store.set(CHAVE, lista) }
function fmtData(d){
  try { return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {weekday: "short", day: "2-digit", month: "short"}) }
  catch(e){ return d || "sem data" }
}
function render(){
  var box = $id("lista"); box.innerHTML = "";
  var mins = 0, feitas = 0;
  if(!lista.length){
    box.innerHTML = "<div class='zcard pad center dim'>Nenhuma tarefa ainda. Adicione a primeira acima! Editar</div>";
  }
  lista.slice().sort(function(a, b){ return (a.data || "9999").localeCompare(b.data || "9999") }).forEach(function(t){
    if(!t.feita) mins += t.dur;
    if(t.feita) feitas++;
    var d = Z.el("div", "zcard row between wrap");
    d.style.padding = "13px 16px";
    var esq = Z.el("div", "row");
    var chk = Z.el("button", "zbtn sm ghost");
    chk.textContent = t.feita ? "OK" : "○";
    chk.style.cssText = "width:34px;justify-content:center";
    chk.addEventListener("click", function(){ t.feita = !t.feita; salvar(); render() });
    var info = Z.el("div", "");
    info.innerHTML = "<b" + (t.feita ? " style='text-decoration:line-through;opacity:.55'" : "") + "> " + t.assunto + "</b> <span class='dim' style='font-size:13px'>· " + t.dur + " min · " + fmtData(t.data) + "</span>";
    esq.appendChild(chk); esq.appendChild(info);
    var del = Z.el("button", "zbtn sm danger"); del.textContent = "Fechar";
    del.addEventListener("click", function(){ lista = lista.filter(function(x){return x !== t}); salvar(); render() });
    d.appendChild(esq); d.appendChild(del);
    box.appendChild(d);
  });
  $id("tot").textContent = "Total: " + lista.length + " (" + feitas + " feitas)";
  $id("mins").textContent = "Tempo planejado: " + mins + " min";
}
$id("add").addEventListener("click", function(){
  var a = $id("assunto").value.trim();
  if(!a){ Z.toast("Escreva o assunto"); return }
  lista.push({assunto: a, dur: parseInt($id("dur").value || "25", 10), data: $id("data").value, feita: false});
  $id("assunto").value = "";
  salvar(); render(); Z.toast("Adicionada!");
});
$id("limparFeitas").addEventListener("click", function(){
  lista.forEach(function(t){ t.feita = true });
  salvar(); render();
});
render();
`;
  return { body, js };
}

/* ── Caderno de notas ── */
export function caderno() {
  const body = `
<div class="zhero"><h1>Caderno de Notas</h1><p>Escreva à vontade — tudo é salvo automaticamente no seu navegador.</p></div>
<div class="zcard pad">
  <textarea class="ztextarea" id="texto" style="min-height:320px" placeholder="Sua anotação..."></textarea>
  <div class="row between mt wrap">
    <span class="zchip" id="stats">0 palavras · 0 caracteres</span>
    <div class="row" style="gap:8px">
      <button class="zbtn sm ghost" id="copiar" type="button">Copiar</button>
      <button class="zbtn sm danger" id="apagar" type="button">Apagar tudo</button>
    </div>
  </div>
</div>
<p class="dim center mt" style="font-size:12px">Salvar Salvamento automático a cada tecla.</p>`;
  const js = `
var CHAVE = "caderno";
var ta = document.getElementById("texto");
ta.value = Z.store.get(CHAVE, "");
function atualizar(){
  var t = ta.value;
  var palavras = t.trim() ? t.trim().split(/\\s+/).length : 0;
  document.getElementById("stats").textContent = palavras + " palavras · " + t.length + " caracteres";
  Z.store.set(CHAVE, t);
}
ta.addEventListener("input", atualizar);
document.getElementById("copiar").addEventListener("click", function(){ Z.copy(ta.value) });
document.getElementById("apagar").addEventListener("click", function(){
  if(confirm("Apagar todas as notas?")){ ta.value = ""; atualizar() }
});
atualizar();
`;
  return { body, js };
}

/* ── Geometria (áreas/volumes) ── */
export function geoforms({ tipo }) {
  const gen = `function(){
  var r = function(a,b){return a + Math.floor(Math.random()*(b-a+1))};
  if(${JSON.stringify(tipo)} === "area"){
    var kind = Z.rnd(0, 3);
    if(kind === 0){ var b = r(3,15), a = r(3,15); return {t: "Área de um triângulo: base " + b + ", altura " + a + ". <span class='dim' style='font-size:14px'>Desenhe mentalmente o triângulo.</span>", a: b*a/2, dica: "A = b·h/2"} }
    if(kind === 1){ var l = r(2,12); return {t: "Área de um quadrado de lado " + l + ".", a: l*l, dica: "A = l²"} }
    if(kind === 2){ var ra = r(2,10); return {t: "Área de um círculo de raio " + ra + ". (use π = " + (Math.PI).toFixed(2) + ")", a: Math.round(Math.PI*ra*ra*100)/100, dica: "A = πr²", dec: 2} }
    var w = r(3,12), h = r(3,12); return {t: "Área de um retângulo " + w + " × " + h + ".", a: w*h, dica: "A = b·h"}
  } else {
    var kind2 = Z.rnd(0, 2);
    if(kind2 === 0){ var a2 = r(2,8), b2 = r(2,8), c2 = r(2,10); return {t: "Volume de uma caixa (prisma) " + a2 + " × " + b2 + " × " + c2 + ".", a: a2*b2*c2, dica: "V = a·b·c"} }
    if(kind2 === 1){ var r2 = r(2,8), h2 = r(2,10); return {t: "Volume de um cilindro: raio " + r2 + ", altura " + h2 + ". (π = " + (Math.PI).toFixed(2) + ")", a: Math.round(Math.PI*r2*r2*h2*100)/100, dica: "V = πr²h", dec: 2} }
    var l2 = r(2,8); return {t: "Volume de um cubo de lado " + l2 + ".", a: l2*l2*l2, dica: "V = l³"}
  }
}`;
  return inputGame({
    titulo: tipo === "area" ? "Geometria — Áreas" : "Geometria — Volumes",
    sub: "Calcule a área (ou volume) pedida. Você tem 60 segundos por rodada.",
    gen: `function(){ var p = (${gen})(); return {t: p.t.replace(/\\<[^>]+\\>/g, ""), a: p.a, dica: p.dica} }`,
    roundSeg: 60,
    dec: 2,
  });
}

/* ── Ginástica cerebral ── */
export function ginastica() {
  const body = `
<div class="zhero"><h1>Ginástica Cerebral</h1><p>Memorize a sequência de dígitos o mais rápido que puder. A cada 3 acertos, aparece mais um dígito.</p></div>
<div class="zcard pad center">
  <div class="row between mb" style="justify-content:space-between">
    <span class="zchip" id="nivel">Nível 2 (2 dígitos)</span>
    <span class="zchip" id="recorde">Recorde: <b class="acc" id="recNum">2</b></span>
  </div>
  <div class="zbig acc mb" id="digits" style="letter-spacing:.15em;min-height:76px">?</div>
  <p class="dim mb" id="status">Memorize...</p>
  <div class="row" style="max-width:320px;margin:0 auto" id="linha">
    <input class="zinput" id="campo" type="text" inputmode="numeric" autocomplete="off" placeholder="digite a sequência" disabled>
    <button class="zbtn" id="ok" type="button" disabled>OK</button>
  </div>
  <p class="dim mt" id="feedback" style="min-height:22px"></p>
</div>`;
  const js = `
var nivel = 2, erros = 0, acertos = 0, rec = Z.store.best("ginastica", 2);
document.getElementById("recNum").textContent = rec;
function $id(x){return document.getElementById(x)}
function seq(){ var s = ""; for(var i = 0; i < nivel; i++) s += Z.rnd(0, 9); return s }
function mostrar(){
  var s = seq();
  $id("digits").textContent = s;
  $id("status").textContent = "Memorize...";
  $id("campo").disabled = true; $id("ok").disabled = true;
  $id("feedback").textContent = "";
  setTimeout(function(){
    $id("digits").textContent = "•".repeat(nivel);
    $id("status").textContent = "Agora digite a sequência:";
    $id("campo").disabled = false; $id("ok").disabled = false;
    $id("campo").value = ""; $id("campo").focus();
    $id("campo").dataset.s = s;
  }, 900 + nivel * 350);
}
function checar(){
  var v = $id("campo").value;
  $id("campo").disabled = true; $id("ok").disabled = true;
  if(v === $id("campo").dataset.s){
    acertos++;
    Z.snd(860, 0.09, "sine");
    if(acertos % 3 === 0){ nivel++; $id("nivel").textContent = "Nível " + nivel + " (" + nivel + " dígitos)" }
    if(nivel > rec){ rec = nivel; Z.store.setBest("ginastica", rec); $id("recNum").textContent = rec }
    $id("feedback").textContent = "Correto!";
    setTimeout(mostrar, 600);
  } else {
    erros++;
    Z.snd(150, 0.2, "sawtooth", 0.05);
    $id("feedback").textContent = "Era " + $id("campo").dataset.s + " — tente de novo.";
    setTimeout(mostrar, 1200);
  }
}
$id("ok").addEventListener("click", checar);
$id("campo").addEventListener("keydown", function(e){ if(e.key === "Enter") checar() });
mostrar();
`;
  return { body, js };
}

/* ── Exporta todos ── */
export const ESTUDOS = {
  mcq, inputGame, flashcards, pares, anagrama, tf, ws, srs, planner, caderno, geoforms, ginastica,
};
