/* Zcode — ENGINES DE ESTUDOS (Simuladores, Laboratórios, Matemática, Ciências) */

/* 1. MCQ (Quiz & Questões com timer, dicas e revisão) */
export function mcq({ titulo, sub, gen, tempoSeg, total }) {
  const tempoHtml = tempoSeg
    ? `<span class="zchip" id="timer" style="color:var(--z-red)">Tempo: ${tempoSeg}s</span>`
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
  <h3 id="pergunta" class="fd" style="font-size:20px;line-height:1.35;margin-bottom:18px;min-height:56px"></h3>
  <div class="col" id="opcoes"></div>
  <div class="row between mt" id="rodape" style="display:none">
    <span class="dim" id="dica" style="font-size:13.5px;max-width:65%"></span>
    <button class="zbtn" id="prox" type="button">Próxima →</button>
  </div>
</div>
<div class="zcard pad center hidden" id="fim">
  <p class="zchip mb" style="display:inline-flex">Resultado da Avaliação</p>
  <div class="zbig acc" id="fimnum">0%</div>
  <p class="dim mb" id="fimtxt"></p>
  <div class="row center" style="justify-content:center;gap:12px">
    <button class="zbtn ghost" id="rever" type="button">Ver Erros</button>
    <button class="zbtn" id="reinicia" type="button">Refazer Teste</button>
  </div>
  <div class="col mt hidden" id="listaErros" style="text-align:left"></div>
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
  if(!p || i >= TOTAL){ fim(); return; }
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
  if(TEMPO > 0){
    clearInterval(timerId); restante = TEMPO;
    $q("timer").textContent = "Tempo: "+restante+"s";
    timerId = setInterval(function(){
      restante--;
      $q("timer").textContent = "Tempo: "+restante+"s";
      if(restante <= 0){ clearInterval(timerId); responder(-1, null); }
    }, 1000);
  }
}
function responder(idx, btn){
  if(bloqueado) return;
  bloqueado = true;
  if(timerId) clearInterval(timerId);
  var p = P[i % P.length];
  var opts = $q("opcoes").children;
  if(idx === p.a){
    acertos++; Z.snd(780, 0.12, "sine", 0.08);
    if(btn) btn.classList.add("ok");
  } else {
    Z.snd(220, 0.2, "sawtooth", 0.08);
    if(btn) btn.classList.add("err");
    if(opts[p.a]) opts[p.a].classList.add("ok");
    erros.push({ q: p.t, resp: idx>=0 ? p.op[idx] : "Tempo Esgotado", certa: p.op[p.a] });
  }
  for(var k=0; k<opts.length; k++) opts[k].disabled = true;
  if(p.dica) $q("dica").textContent = "Dica: " + p.dica;
  $q("rodape").style.display = "flex";
}
$q("prox").addEventListener("click", function(){ i++; nova(); });
function fim(){
  $q("jogo").classList.add("hidden");
  $q("fim").classList.remove("hidden");
  var pct = Math.round((acertos/TOTAL)*100);
  $q("fimnum").textContent = pct + "%";
  $q("fimtxt").textContent = "Você acertou "+acertos+" de "+TOTAL+" questões de estudo.";
  Z.store.setBest("mcq_${titulo}", pct);
}
$q("reinicia").addEventListener("click", function(){
  i = 0; acertos = 0; erros = [];
  $q("fim").classList.add("hidden");
  $q("listaErros").classList.add("hidden");
  $q("jogo").classList.remove("hidden");
  nova();
});
$q("rever").addEventListener("click", function(){
  var box = $q("listaErros");
  box.classList.toggle("hidden");
  if(erros.length === 0){ box.innerHTML = "<p class='dim'>Nenhum erro registrado! Excelente desempenho!</p>"; return; }
  box.innerHTML = "<b>Questões Incorretas:</b>" + erros.map(function(e){
    return "<div class='zcard mt' style='font-size:13.5px'><p style='font-weight:600'>"+e.q+"</p><p class='acc'>Certa: "+e.certa+"</p><p style='color:var(--z-red)'>Sua resposta: "+e.resp+"</p></div>";
  }).join("");
});
nova();
`;
  return { body, js };
}

/* 2. FLASHCARDS & REPETIÇÃO ESPAÇADA (SM-2) */
export function flashcards({ titulo, sub, deck }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad center" id="cardBox" style="min-height:280px;display:flex;flex-direction:column;justify-content:center;cursor:pointer">
  <span class="zchip mb" id="cardTag" style="display:inline-flex;align-self:center">Cartão 1</span>
  <h2 class="fd" id="cardFront" style="font-size:24px;margin-bottom:12px"></h2>
  <div id="cardBack" class="mt hidden" style="border-top:1px solid var(--z-line);padding-top:16px">
    <p id="cardAns" style="font-size:18px;color:var(--z-acc);font-weight:600"></p>
    <p id="cardNote" class="dim mt" style="font-size:13px"></p>
  </div>
  <p class="dim mt" id="flipHint" style="font-size:12px">Clique para virar o cartão</p>
</div>
<div class="row center mt wrap" id="actionBtns" style="justify-content:center;gap:12px">
  <button class="zbtn danger" id="btnErro" type="button">Preciso Rever (Erro)</button>
  <button class="zbtn ghost" id="btnMedio" type="button">Difícil</button>
  <button class="zbtn" id="btnFacil" type="button">Fácil (Dominado)</button>
</div>
<div class="zcard pad mt">
  <div class="row between">
    <span class="zstat"><span>Progresso</span><b id="stProg">0%</b></span>
    <span class="zstat"><span>Cartões Vistos</span><b id="stVistos">0</b></span>
    <span class="zstat"><span>Retenção</span><b id="stRet">0%</b></span>
  </div>
</div>`;
  const js = `
var DECK = ${JSON.stringify(deck)};
var idx = 0, revelado = false, acertos = 0, vistos = 0;
var $q = function(id){return document.getElementById(id)};
function render(){
  revelado = false;
  var c = DECK[idx % DECK.length];
  $q("cardTag").textContent = "Cartão "+(idx+1)+" de "+DECK.length;
  $q("cardFront").textContent = c.f || c.pergunta || c.p || c[0];
  $q("cardAns").textContent = c.v || c.resposta || c.r || c[1];
  $q("cardNote").textContent = c.dica || c.explicacao || "";
  $q("cardBack").classList.add("hidden");
  $q("flipHint").textContent = "Clique no cartão para revelar a resposta";
  $q("stProg").textContent = Math.round(((idx)/DECK.length)*100)+"%";
}
$q("cardBox").addEventListener("click", function(){
  revelado = !revelado;
  if(revelado){
    $q("cardBack").classList.remove("hidden");
    $q("flipHint").textContent = "Avalie sua facilidade de recall abaixo";
    Z.snd(620, 0.08, "sine", 0.05);
  } else {
    $q("cardBack").classList.add("hidden");
  }
});
function prox(facilidade){
  vistos++;
  if(facilidade > 1) acertos++;
  idx = (idx + 1) % DECK.length;
  $q("stVistos").textContent = vistos;
  $q("stRet").textContent = Math.round((acertos/vistos)*100)+"%";
  render();
}
$q("btnErro").addEventListener("click", function(){ prox(1); });
$q("btnMedio").addEventListener("click", function(){ prox(2); });
$q("btnFacil").addEventListener("click", function(){ prox(3); });
render();
`;
  return { body, js };
}

/* 3. SIMULADOR DE FÍSICA: PROJÉTIL & MOVIMENTO */
export function simProjetil({ titulo, sub }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad">
  <div class="row wrap between mb">
    <div class="col" style="flex:1;min-width:200px">
      <label class="zlabel">Ângulo de Lançamento (θ): <b id="valAng">45</b>°</label>
      <input type="range" class="zrange" id="ang" min="5" max="85" value="45">
    </div>
    <div class="col" style="flex:1;min-width:200px">
      <label class="zlabel">Velocidade Inicial (v₀): <b id="valVel">25</b> m/s</label>
      <input type="range" class="zrange" id="vel" min="5" max="60" value="25">
    </div>
    <div class="col" style="flex:1;min-width:200px">
      <label class="zlabel">Gravidade (g): <b id="valGrav">9.8</b> m/s²</label>
      <input type="range" class="zrange" id="grav" min="1" max="25" step="0.1" value="9.8">
    </div>
  </div>
  <canvas class="zc" id="cnv" width="800" height="400"></canvas>
  <div class="row between mt wrap">
    <button class="zbtn" id="btnDisparar" type="button">🚀 Fazer Lançamento</button>
    <button class="zbtn ghost" id="btnLimpar" type="button">Limpar Trajetória</button>
    <span class="zstat"><span>Alcance Máximo</span><b id="stAlcance">0 m</b></span>
    <span class="zstat"><span>Altura Máxima</span><b id="stAltura">0 m</b></span>
    <span class="zstat"><span>Tempo de Voo</span><b id="stTempo">0 s</b></span>
  </div>
</div>`;
  const js = `
var cnv = document.getElementById("cnv");
var ctx = cnv.getContext("2d");
var $q = function(id){return document.getElementById(id)};
var t = 0, animId = null, trajetoria = [];
function calc(){
  var a = parseFloat($q("ang").value) * Math.PI / 180;
  var v = parseFloat($q("vel").value);
  var g = parseFloat($q("grav").value);
  var v0x = v * Math.cos(a);
  var v0y = v * Math.sin(a);
  var tVoo = (2 * v0y) / g;
  var alcance = v0x * tVoo;
  var hMax = (v0y * v0y) / (2 * g);
  $q("stAlcance").textContent = Z.fmt(alcance, 1) + " m";
  $q("stAltura").textContent = Z.fmt(hMax, 1) + " m";
  $q("stTempo").textContent = Z.fmt(tVoo, 1) + " s";
  return { a: a, v: v, g: g, v0x: v0x, v0y: v0y, tVoo: tVoo, alcance: alcance, hMax: hMax };
}
function draw(){
  ctx.clearRect(0,0,cnv.width,cnv.height);
  // Solo
  ctx.fillStyle = "#e9e4dc"; ctx.fillRect(0, cnv.height-40, cnv.width, 40);
  ctx.strokeStyle = "rgba(37,36,34,0.3)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, cnv.height-40); ctx.lineTo(cnv.width, cnv.height-40); ctx.stroke();
  // Grid
  ctx.strokeStyle = "rgba(37,36,34,0.06)";
  for(var x=0; x<cnv.width; x+=50){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,cnv.height-40); ctx.stroke(); }
  for(var y=0; y<cnv.height-40; y+=40){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cnv.width,y); ctx.stroke(); }
  // Trajetórias anteriores
  trajetoria.forEach(function(p){
    ctx.strokeStyle = "rgba(135,63,50,0.4)"; ctx.lineWidth = 2;
    ctx.beginPath();
    p.pts.forEach(function(pt, idx){
      var cx = 30 + pt.x * 4;
      var cy = cnv.height - 40 - pt.y * 4;
      if(idx === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
  });
}
function disparar(){
  if(animId) cancelAnimationFrame(animId);
  var p = calc();
  var currPts = [];
  t = 0;
  function step(){
    t += 0.05;
    var x = p.v0x * t;
    var y = p.v0y * t - 0.5 * p.g * t * t;
    if(y >= 0){
      currPts.push({x:x, y:y});
      draw();
      // Desenhar trajetória atual
      ctx.strokeStyle = "#873f32"; ctx.lineWidth = 3;
      ctx.beginPath();
      currPts.forEach(function(pt, idx){
        var cx = 30 + pt.x * 4;
        var cy = cnv.height - 40 - pt.y * 4;
        if(idx === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
      // Desenhar projetil
      var px = 30 + x * 4;
      var py = cnv.height - 40 - y * 4;
      ctx.fillStyle = "#252422";
      ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI*2); ctx.fill();
      Z.snd(300 + y*5, 0.05, "sine", 0.02);
      animId = requestAnimationFrame(step);
    } else {
      trajetoria.push({pts: currPts});
      draw();
      Z.snd(120, 0.2, "square", 0.08);
    }
  }
  step();
}
["ang","vel","grav"].forEach(function(id){
  $q(id).addEventListener("input", function(){
    $q("val"+id.charAt(0).toUpperCase()+id.slice(1)).textContent = this.value;
    calc();
  });
});
$q("btnDisparar").addEventListener("click", disparar);
$q("btnLimpar").addEventListener("click", function(){ trajetoria = []; draw(); });
calc(); draw();
`;
  return { body, js };
}

/* 4. PLOTTER DE FUNÇÕES & CÁLCULO (Derivadas e Integrais) */
export function simFuncoes({ titulo, sub }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad">
  <div class="row wrap between mb">
    <div class="col" style="flex:2;min-width:240px">
      <label class="zlabel">Equação da Função f(x):</label>
      <input type="text" class="zinput" id="eq" value="x^2 - 4*x + 3" placeholder="ex: Math.sin(x), x^2, Math.cos(x)">
    </div>
    <div class="col" style="flex:1;min-width:140px">
      <label class="zlabel">Zoom (Escala):</label>
      <input type="range" class="zrange" id="zoom" min="10" max="80" value="30">
    </div>
    <div class="col" style="flex:1;min-width:140px">
      <label class="zlabel">Ponto x₀ Tangente:</label>
      <input type="range" class="zrange" id="x0" min="-5" max="5" step="0.1" value="1">
    </div>
  </div>
  <canvas class="zc" id="cnv" width="800" height="420"></canvas>
  <div class="row between mt wrap">
    <span class="zstat"><span>f(x₀)</span><b id="stFx">0</b></span>
    <span class="zstat"><span>Derivada f'(x₀)</span><b id="stDf">0</b></span>
    <span class="zstat"><span>Integral de -2 a x₀</span><b id="stInt">0</b></span>
  </div>
</div>`;
  const js = `
var cnv = document.getElementById("cnv");
var ctx = cnv.getContext("2d");
var $q = function(id){return document.getElementById(id)};
function evalF(expr, x){
  try {
    var clean = expr.replace(/x/g, "("+x+")").replace(/\^/g, "**");
    return Function("Math", "return " + clean)(Math);
  } catch(e){ return 0; }
}
function draw(){
  ctx.clearRect(0,0,cnv.width,cnv.height);
  var scale = parseFloat($q("zoom").value);
  var x0 = parseFloat($q("x0").value);
  var expr = $q("eq").value;
  var cx = cnv.width / 2;
  var cy = cnv.height / 2;
  // Eixos
  ctx.strokeStyle = "rgba(37,36,34,0.4)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(cnv.width, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, cnv.height); ctx.stroke();
  // Grid
  ctx.strokeStyle = "rgba(37,36,34,0.08)"; ctx.lineWidth = 1;
  for(var x=-15; x<=15; x++){
    var px = cx + x*scale;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, cnv.height); ctx.stroke();
  }
  for(var y=-15; y<=15; y++){
    var py = cy - y*scale;
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(cnv.width, py); ctx.stroke();
  }
  // Desenhar Função f(x)
  ctx.strokeStyle = "#873f32"; ctx.lineWidth = 3;
  ctx.beginPath();
  var first = true;
  for(var px=0; px<cnv.width; px+=2){
    var vx = (px - cx) / scale;
    var vy = evalF(expr, vx);
    var py = cy - vy * scale;
    if(isNaN(py) || py < -1000 || py > 2000){ first = true; continue; }
    if(first){ ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Ponto e Tangente
  var fx0 = evalF(expr, x0);
  var h = 0.0001;
  var dfx0 = (evalF(expr, x0+h) - evalF(expr, x0-h)) / (2*h);
  var px0 = cx + x0*scale;
  var py0 = cy - fx0*scale;
  // Desenhar Reta Tangente
  ctx.strokeStyle = "#3a7ca5"; ctx.lineWidth = 2;
  ctx.beginPath();
  var tx1 = -10, ty1 = fx0 + dfx0*(tx1 - x0);
  var tx2 = 10, ty2 = fx0 + dfx0*(tx2 - x0);
  ctx.moveTo(cx + tx1*scale, cy - ty1*scale);
  ctx.lineTo(cx + tx2*scale, cy - ty2*scale);
  ctx.stroke();
  // Desenhar ponto x0
  ctx.fillStyle = "#252422";
  ctx.beginPath(); ctx.arc(px0, py0, 6, 0, Math.PI*2); ctx.fill();
  $q("stFx").textContent = Z.fmt(fx0, 2);
  $q("stDf").textContent = Z.fmt(dfx0, 2);
}
["eq","zoom","x0"].forEach(function(id){
  $q(id).addEventListener("input", draw);
});
draw();
`;
  return { body, js };
}

export const ESTUDOS = {
  mcq,
  flashcards,
  simProjetil,
  simFuncoes,
};
