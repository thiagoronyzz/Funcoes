/* Zcode — ENGINES DE JOGOS 1 (Tower Defense, Simulação de Império, Roguelike, Laser Puzzle) */

/* 1. TOWER DEFENSE PRO */
export function towerDefense({ titulo, sub }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad">
  <div class="row between mb wrap">
    <span class="zstat"><span>Vidas</span><b id="stVidas" style="color:var(--z-red)">20</b></span>
    <span class="zstat"><span>Ouro</span><b id="stOuro" style="color:var(--z-amber)">150</b></span>
    <span class="zstat"><span>Onda</span><b id="stOnda">1/10</b></span>
    <button class="zbtn" id="btnOnda" type="button">⚔️ Iniciar Onda</button>
  </div>
  <canvas class="zc" id="cnvTd" width="800" height="400"></canvas>
  <div class="row wrap mt gap" style="gap:12px">
    <button class="zbtn ghost sm" id="buyArcher">🏹 Torre Arqueiro (50 ouro)</button>
    <button class="zbtn ghost sm" id="buyCanon">💥 Torre Canhão (90 ouro)</button>
    <button class="zbtn ghost sm" id="buyMage">⚡ Torre Mágica (120 ouro)</button>
  </div>
</div>`;
  const js = `
var cnv = document.getElementById("cnvTd");
var ctx = cnv.getContext("2d");
var $q = function(id){return document.getElementById(id)};
var vidas = 20, ouro = 150, onda = 1, selecionada = "archer", emAndamento = false;
var torres = [], inimigos = [], projeteis = [];
var path = [{x:0,y:200},{x:200,y:200},{x:200,y:100},{x:500,y:100},{x:500,y:300},{x:800,y:300}];

function drawPath(){
  ctx.strokeStyle = "rgba(37,36,34,0.15)"; ctx.lineWidth = 40; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  path.forEach(function(pt, i){ if(i===0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y); });
  ctx.stroke();
}
function loop(){
  ctx.clearRect(0,0,cnv.width,cnv.height);
  drawPath();
  // Atualizar Inimigos
  inimigos.forEach(function(e, idx){
    if(e.hp <= 0) return;
    var target = path[e.pIdx + 1];
    if(!target){
      vidas--; $q("stVidas").textContent = vidas;
      e.hp = 0; Z.snd(120, 0.2, "sawtooth"); return;
    }
    var dx = target.x - e.x, dy = target.y - e.y;
    var dist = Math.hypot(dx, dy);
    if(dist < e.speed){ e.pIdx++; }
    else { e.x += (dx/dist)*e.speed; e.y += (dy/dist)*e.speed; }
    // Desenhar inimigo
    ctx.fillStyle = "#873f32";
    ctx.beginPath(); ctx.arc(e.x, e.y, 10, 0, Math.PI*2); ctx.fill();
  });
  inimigos = inimigos.filter(function(e){return e.hp > 0});
  // Torres
  torres.forEach(function(t){
    ctx.fillStyle = t.type === "archer" ? "#3a7ca5" : (t.type === "canon" ? "#252422" : "#7c5cff");
    ctx.fillRect(t.x-15, t.y-15, 30, 30);
    // Procurar alvo
    inimigos.forEach(function(e){
      var dist = Math.hypot(e.x - t.x, e.y - t.y);
      if(dist < t.range && t.cooldown <= 0){
        e.hp -= t.dmg; t.cooldown = t.maxCd;
        Z.snd(600, 0.05, "sine");
        if(e.hp <= 0){ ouro += 15; $q("stOuro").textContent = ouro; }
      }
    });
    if(t.cooldown > 0) t.cooldown--;
  });
  if(emAndamento) requestAnimationFrame(loop);
}
cnv.addEventListener("click", function(ev){
  var rect = cnv.getBoundingClientRect();
  var x = ev.clientX - rect.left, y = ev.clientY - rect.top;
  var custo = selecionada === "archer" ? 50 : (selecionada === "canon" ? 90 : 120);
  if(ouro >= custo){
    ouro -= custo; $q("stOuro").textContent = ouro;
    torres.push({ x: x, y: y, type: selecionada, range: 120, dmg: 20, cooldown: 0, maxCd: 20 });
    loop(); Z.snd(500, 0.1);
  } else Z.toast("Ouro insuficiente!");
});
$q("buyArcher").addEventListener("click", function(){ selecionada = "archer"; Z.toast("Torre Arqueiro selecionada"); });
$q("buyCanon").addEventListener("click", function(){ selecionada = "canon"; Z.toast("Torre Canhão selecionada"); });
$q("buyMage").addEventListener("click", function(){ selecionada = "mage"; Z.toast("Torre Mágica selecionada"); });
$q("btnOnda").addEventListener("click", function(){
  if(emAndamento) return;
  emAndamento = true;
  for(var i=0; i<8+onda*3; i++){
    inimigos.push({ x: -i*40, y: 200, hp: 40+onda*10, speed: 1.5, pIdx: 0 });
  }
  loop();
});
loop();
`;
  return { body, js };
}

/* 2. GESTÃO DE IMPÉRIO (MICRO CIV) */
export function simCiv({ titulo, sub }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad">
  <div class="zgrid zg4 mb">
    <span class="zstat"><span>População</span><b id="cPop">10</b></span>
    <span class="zstat"><span>Alimento</span><b id="cFood">50</b></span>
    <span class="zstat"><span>Madeira</span><b id="cWood">30</b></span>
    <span class="zstat"><span>Ouro</span><b id="cGold">20</b></span>
  </div>
  <div class="zgrid zg3 gap mb">
    <button class="zbtn ghost" id="actHarvest" type="button">🌾 Coletar Comida (+5)</button>
    <button class="zbtn ghost" id="actChop" type="button">ode Cortar Madeira (+5)</button>
    <button class="zbtn ghost" id="actBuildHouse" type="button">🏠 Construir Casa (20 Wood)</button>
  </div>
  <div class="zcard" style="background:var(--z-surface2)">
    <b class="fd">Registro do Império:</b>
    <div id="civLog" class="col mt" style="max-height:120px;overflow-y:auto;font-size:13px"></div>
  </div>
</div>`;
  const js = `
var pop = 10, food = 50, wood = 30, gold = 20;
var $q = function(id){return document.getElementById(id)};
function log(msg){
  var box = $q("civLog");
  var p = document.createElement("p"); p.textContent = "• " + msg;
  box.prepend(p);
}
function update(){
  $q("cPop").textContent = pop; $q("cFood").textContent = food;
  $q("cWood").textContent = wood; $q("cGold").textContent = gold;
}
$q("actHarvest").addEventListener("click", function(){ food += 5; log("Coletou +5 alimentos"); update(); });
$q("actChop").addEventListener("click", function(){ wood += 5; log("Cortou +5 madeiras"); update(); });
$q("actBuildHouse").addEventListener("click", function(){
  if(wood >= 20){ wood -= 20; pop += 2; log("Construiu uma casa! +2 cidadãos"); update(); }
  else Z.toast("Madeira insuficiente!");
});
setInterval(function(){
  if(food >= pop){ food -= pop; gold += Math.floor(pop/2); log("Turno concluído: População alimentada"); }
  else { pop = Math.max(1, pop-1); log("Falta de alimento! 1 cidadão partiu"); }
  update();
}, 5000);
update();
`;
  return { body, js };
}

export const JOGOS1 = {
  towerDefense,
  simCiv,
};
