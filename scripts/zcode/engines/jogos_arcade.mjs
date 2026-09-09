/* Zcode — ENGINES DE JOGOS · ARCADE (canvas)
   Todas recebem { titulo, sub, tema } e devolvem { body, js }.
   O runtime G (gbase.mjs) é injetado antes do js por jogos_index.mjs. */

import { hero, hud, dpad, help } from "./gbase.mjs";

const j = (v) => JSON.stringify(v);

/* ───────────────────────── 1. TRAVESSIA ─────────────────────────
   Atravesse o cenário de ponta a ponta driblando perigos móveis,
   coletando recursos e segurando o medidor antes que ele zere. */
export function travessia({ titulo, sub, tema = {} }) {
  const t = {
    heroi: "💧", perigo: "🔥", item: "🫧", chao: "#f6efe2",
    medidor: "Energia", coleta: "Gotas", meta: "Travessia",
    ...tema,
  };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: t.medidor, id: "gEner", val: "100%" },
    { rot: "Etapa", id: "gFase", val: "1" },
    { rot: "Pontos", id: "gPts", val: "0" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "▶ Começar", id: "gStart" },
  ])}
  <canvas class="zc" id="cv" width="820" height="440"></canvas>
  ${dpad()}
  ${help(`Use as setas (ou o direcional na tela) para levar ${t.heroi} até a faixa da direita. Desvie de ${t.perigo}, colete ${t.item} para recuperar ${t.medidor.toLowerCase()}.`)}
</div>`;
  const js = `
var T = ${j(t)};
var C = G.ctx2d("cv"), cnv = C.c, x = C.x, W = cnv.width, H = cnv.height;
var p, perigos, itens, ener, fase, pts, vivo = false, rec = Z.store.get("rec:${"trav"}" + document.body.dataset.app, 0);
G.txt("gRec", rec);

function novaFase(){
  p = { x: 34, y: H/2, r: 16 };
  perigos = []; itens = [];
  var n = 4 + fase * 2;
  for (var i = 0; i < n; i++){
    perigos.push({ x: G.rnd(120, W - 120), y: G.rnd(30, H - 30), r: 15,
      vx: G.rnd(-1, 1) * (0.7 + fase * 0.16), vy: G.rnd(-1.4, 1.4) * (0.7 + fase * 0.16) });
  }
  for (var k = 0; k < 4; k++) itens.push({ x: G.rnd(140, W - 90), y: G.rnd(30, H - 30), r: 13 });
}
function iniciar(){
  ener = 100; fase = 1; pts = 0; vivo = true;
  novaFase(); G.txt("gPts", 0); G.txt("gFase", 1);
}
function fim(){
  vivo = false;
  var b = G.best("trav:" + document.body.dataset.app, pts);
  G.txt("gRec", b.valor);
  Z.snd(140, .35, "sawtooth");
  G.over(b.novo ? "Novo recorde!" : "Fim de jogo", T.medidor + " esgotada. Pontos: " + pts, "Tentar de novo", iniciar);
}
function passo(dt){
  if(!vivo) return;
  var v = 3.1;
  if (G.keys.ArrowUp) p.y -= v * dt;
  if (G.keys.ArrowDown) p.y += v * dt;
  if (G.keys.ArrowLeft) p.x -= v * dt;
  if (G.keys.ArrowRight) p.x += v * dt;
  p.x = G.clamp(p.x, 14, W - 14); p.y = G.clamp(p.y, 14, H - 14);
  ener -= 0.075 * dt * (1 + fase * 0.06);
  for (var i = 0; i < perigos.length; i++){
    var o = perigos[i];
    o.x += o.vx * dt; o.y += o.vy * dt;
    if (o.x < 90 || o.x > W - 60) o.vx *= -1;
    if (o.y < 16 || o.y > H - 16) o.vy *= -1;
    if (Math.hypot(o.x - p.x, o.y - p.y) < o.r + p.r - 6){
      ener -= 16; p.x = Math.max(20, p.x - 42); Z.snd(180, .12, "square");
      o.x += o.vx > 0 ? 40 : -40;
    }
  }
  for (var k = itens.length - 1; k >= 0; k--){
    var it = itens[k];
    if (Math.hypot(it.x - p.x, it.y - p.y) < it.r + p.r){
      itens.splice(k, 1); ener = Math.min(100, ener + 13); pts += 25;
      G.txt("gPts", pts); Z.snd(760, .07);
    }
  }
  if (p.x > W - 40){
    fase++; pts += 120; G.txt("gPts", pts); G.txt("gFase", fase);
    ener = Math.min(100, ener + 22); Z.snd(880, .12); Z.toast("Etapa " + fase + "!");
    novaFase();
  }
  if (ener <= 0){ ener = 0; fim(); }
  G.txt("gEner", Math.round(ener) + "%");
}
function desenha(){
  if(!x) return;
  G.fundo(x, cnv, T.chao);
  x.fillStyle = "rgba(135,63,50,.10)"; x.fillRect(W - 34, 0, 34, H);
  x.fillStyle = "rgba(37,36,34,.05)"; x.fillRect(0, 0, 26, H);
  for (var i = 0; i < itens.length; i++) G.emoji(x, T.item, 24, itens[i].x, itens[i].y);
  for (var k = 0; k < perigos.length; k++) G.emoji(x, T.perigo, 28, perigos[k].x, perigos[k].y);
  G.emoji(x, T.heroi, 30, p.x, p.y);
  x.fillStyle = "rgba(37,36,34,.12)"; x.fillRect(14, 14, 190, 10);
  x.fillStyle = ener > 35 ? "#64716f" : "#9f5140"; x.fillRect(14, 14, 190 * Math.max(0, ener) / 100, 10);
}
iniciar(); vivo = false; desenha();
G.loop(function(dt){ passo(dt); desenha(); });
document.getElementById("gStart").addEventListener("click", function(){ iniciar(); Z.toast("Vai!"); });
`;
  return { body, js };
}

/* ───────────────────────── 2. VOO ─────────────────────────
   Pilotagem tipo "flappy": impulso contra a gravidade entre passagens. */
export function voo({ titulo, sub, tema = {} }) {
  const t = { heroi: "🎈", obst: "🌩️", ceu: "#eef3f7", moeda: "✨", nome: "Voo", ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Pontos", id: "gPts", val: "0" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "▶ Voar", id: "gStart" },
  ])}
  <canvas class="zc" id="cv" width="820" height="440"></canvas>
  ${help(`Clique na tela, toque ou pressione <span class="zkbd">espaço</span> para dar impulso. Passe entre os obstáculos ${t.obst} e recolha ${t.moeda}.`)}
</div>`;
  const js = `
var T = ${j(t)};
var C = G.ctx2d("cv"), cnv = C.c, x = C.x, W = cnv.width, H = cnv.height;
var y, vy, canos, moedas, pts, vivo = false, tick = 0;
function iniciar(){
  y = H/2; vy = 0; canos = []; moedas = []; pts = 0; tick = 0; vivo = true;
  G.txt("gPts", 0);
  var b = Z.store.get("rec:voo:" + document.body.dataset.app, 0); G.txt("gRec", b);
}
function impulso(){ if(vivo) { vy = -7.1; Z.snd(560, .05); } }
function fim(){
  vivo = false;
  var b = G.best("voo:" + document.body.dataset.app, pts); G.txt("gRec", b.valor);
  Z.snd(150, .3, "sawtooth");
  G.over(b.novo ? "Novo recorde!" : "Caiu!", "Você marcou " + pts + " ponto(s).", "Voar de novo", iniciar);
}
function passo(dt){
  if(!vivo) return;
  tick += dt;
  vy += 0.36 * dt; y += vy * dt;
  if (tick > 78 || canos.length === 0){
    tick = 0;
    var gap = 150, cy = G.rnd(90, H - 90 - gap);
    canos.push({ x: W + 40, cy: cy, gap: gap, ok: false });
    moedas.push({ x: W + 40 + 90, y: cy + gap/2, viva: true });
  }
  for (var i = canos.length - 1; i >= 0; i--){
    var c = canos[i]; c.x -= 2.9 * dt;
    if (c.x < -60) canos.splice(i, 1);
    else if (!c.ok && c.x < 90){ c.ok = true; pts += 10; G.txt("gPts", pts); Z.snd(820, .06); }
    if (Math.abs(c.x - 100) < 26 && (y < c.cy || y > c.cy + c.gap)) fim();
  }
  for (var k = moedas.length - 1; k >= 0; k--){
    var m = moedas[k]; m.x -= 2.9 * dt;
    if (m.x < -30) moedas.splice(k, 1);
    else if (m.viva && Math.abs(m.x - 100) < 22 && Math.abs(m.y - y) < 24){
      m.viva = false; pts += 15; G.txt("gPts", pts); Z.snd(1000, .06);
    }
  }
  if (y > H - 14 || y < 14) fim();
}
function desenha(){
  if(!x) return;
  G.fundo(x, cnv, T.ceu);
  for (var i = 0; i < canos.length; i++){
    var c = canos[i];
    x.fillStyle = "rgba(37,36,34,.14)";
    x.fillRect(c.x - 26, 0, 52, c.cy);
    x.fillRect(c.x - 26, c.cy + c.gap, 52, H - c.cy - c.gap);
    G.emoji(x, T.obst, 26, c.x, c.cy - 20);
    G.emoji(x, T.obst, 26, c.x, c.cy + c.gap + 22);
  }
  for (var k = 0; k < moedas.length; k++) if (moedas[k].viva) G.emoji(x, T.moeda, 22, moedas[k].x, moedas[k].y);
  G.emoji(x, T.heroi, 32, 100, y);
}
iniciar(); vivo = false; desenha();
G.loop(function(dt){ passo(dt); desenha(); });
cnv.addEventListener("pointerdown", function(e){ e.preventDefault(); impulso(); });
document.addEventListener("keydown", function(e){ if(e.key === " " || e.key === "ArrowUp") impulso(); });
document.getElementById("gStart").addEventListener("click", function(){ iniciar(); });
`;
  return { body, js };
}

/* ───────────────────────── 3. ESQUIVA / COLETA ─────────────────────────
   Cesta na base: pegue o que vale, evite o que fere. */
export function coleta({ titulo, sub, tema = {} }) {
  const t = { heroi: "🧺", bom: ["⭐", "🍀", "💎"], ruim: "💀", chao: "#fbfaf7", ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Pontos", id: "gPts", val: "0" },
    { rot: "Vidas", id: "gVid", val: "3" },
    { rot: "Nível", id: "gNiv", val: "1" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "▶ Começar", id: "gStart" },
  ])}
  <canvas class="zc" id="cv" width="820" height="430"></canvas>
  ${dpad()}
  ${help(`Mova com ← → (ou arraste no canvas). Pegue ${t.bom.join(" ")} e fuja de ${t.ruim}.`)}
</div>`;
  const js = `
var T = ${j(t)};
var C = G.ctx2d("cv"), cnv = C.c, x = C.x, W = cnv.width, H = cnv.height;
var px, itens, pts, vidas, niv, vivo = false, tick = 0;
G.txt("gRec", Z.store.get("rec:col:" + document.body.dataset.app, 0));
function iniciar(){
  px = W/2; itens = []; pts = 0; vidas = 3; niv = 1; vivo = true; tick = 0;
  G.txt("gPts", 0); G.txt("gVid", 3); G.txt("gNiv", 1);
}
function fim(){
  vivo = false;
  var b = G.best("col:" + document.body.dataset.app, pts); G.txt("gRec", b.valor);
  G.over(b.novo ? "Novo recorde!" : "Acabaram as vidas", "Pontuação final: " + pts, "Jogar de novo", iniciar);
}
function passo(dt){
  if(!vivo) return;
  if (G.keys.ArrowLeft) px -= 6.4 * dt;
  if (G.keys.ArrowRight) px += 6.4 * dt;
  px = G.clamp(px, 30, W - 30);
  tick += dt;
  if (tick > Math.max(14, 40 - niv * 2)){
    tick = 0;
    var mau = Math.random() < 0.26;
    itens.push({ x: G.rnd(28, W - 28), y: -20, mau: mau,
      e: mau ? T.ruim : G.pick(T.bom), v: 2 + niv * 0.28 + Math.random() });
  }
  for (var i = itens.length - 1; i >= 0; i--){
    var it = itens[i]; it.y += it.v * dt;
    if (it.y > H - 42 && it.y < H - 8 && Math.abs(it.x - px) < 42){
      itens.splice(i, 1);
      if (it.mau){ vidas--; G.txt("gVid", vidas); Z.snd(170, .18, "square"); if(vidas <= 0) fim(); }
      else { pts += 10 * niv; G.txt("gPts", pts); Z.snd(880, .05);
        if (pts > niv * 220){ niv++; G.txt("gNiv", niv); Z.toast("Nível " + niv); } }
    } else if (it.y > H + 20){
      itens.splice(i, 1);
      if (!it.mau){ vidas--; G.txt("gVid", vidas); if(vidas <= 0) fim(); }
    }
  }
}
function desenha(){
  if(!x) return;
  G.fundo(x, cnv, T.chao);
  x.fillStyle = "rgba(37,36,34,.08)"; x.fillRect(0, H - 26, W, 26);
  for (var i = 0; i < itens.length; i++) G.emoji(x, itens[i].e, 27, itens[i].x, itens[i].y);
  G.emoji(x, T.heroi, 40, px, H - 30);
}
iniciar(); vivo = false; desenha();
G.loop(function(dt){ passo(dt); desenha(); });
cnv.addEventListener("pointermove", function(e){ if(vivo) px = G.clamp(G.pos(cnv, e).x, 30, W - 30); });
document.getElementById("gStart").addEventListener("click", iniciar);
`;
  return { body, js };
}

/* ───────────────────────── 4. TIRO / DEFESA AÉREA ───────────────────────── */
export function tiro({ titulo, sub, tema = {} }) {
  const t = { heroi: "🚀", inimigo: "👾", tiro: "•", ceu: "#f4f3ef", ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Pontos", id: "gPts", val: "0" },
    { rot: "Onda", id: "gOnda", val: "1" },
    { rot: "Escudo", id: "gVid", val: "3" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "▶ Começar", id: "gStart" },
  ])}
  <canvas class="zc" id="cv" width="820" height="440"></canvas>
  ${dpad()}
  ${help(`← → movem, <span class="zkbd">espaço</span> (ou ▲ no direcional) dispara. Não deixe ${t.inimigo} alcançar a base.`)}
</div>`;
  const js = `
var T = ${j(t)};
var C = G.ctx2d("cv"), cnv = C.c, x = C.x, W = cnv.width, H = cnv.height;
var px, tiros, ini, pts, vidas, onda, vivo = false, cd = 0, spawn = 0;
G.txt("gRec", Z.store.get("rec:tiro:" + document.body.dataset.app, 0));
function iniciar(){
  px = W/2; tiros = []; ini = []; pts = 0; vidas = 3; onda = 1; vivo = true; cd = 0; spawn = 0;
  G.txt("gPts", 0); G.txt("gVid", 3); G.txt("gOnda", 1);
}
function fim(){
  vivo = false;
  var b = G.best("tiro:" + document.body.dataset.app, pts); G.txt("gRec", b.valor);
  G.over(b.novo ? "Novo recorde!" : "Base destruída", "Pontos: " + pts + " · Ondas: " + onda, "Jogar de novo", iniciar);
}
function atirar(){ if(vivo && cd <= 0){ tiros.push({ x: px, y: H - 54 }); cd = 11; Z.snd(680, .04, "square"); } }
function passo(dt){
  if(!vivo) return;
  cd -= dt;
  if (G.keys.ArrowLeft) px -= 6 * dt;
  if (G.keys.ArrowRight) px += 6 * dt;
  if (G.keys[" "] || G.keys.ArrowUp) atirar();
  px = G.clamp(px, 26, W - 26);
  spawn += dt;
  if (spawn > Math.max(18, 55 - onda * 3)){
    spawn = 0;
    ini.push({ x: G.rnd(30, W - 30), y: -18, v: 0.6 + onda * 0.13, hp: 1 + Math.floor(onda / 4) });
  }
  for (var i = tiros.length - 1; i >= 0; i--){
    tiros[i].y -= 8 * dt;
    if (tiros[i].y < -10) tiros.splice(i, 1);
  }
  for (var k = ini.length - 1; k >= 0; k--){
    var e = ini[k]; e.y += e.v * dt;
    for (var b2 = tiros.length - 1; b2 >= 0; b2--){
      if (Math.abs(tiros[b2].x - e.x) < 20 && Math.abs(tiros[b2].y - e.y) < 20){
        tiros.splice(b2, 1); e.hp--;
        if (e.hp <= 0){
          ini.splice(k, 1); pts += 20; G.txt("gPts", pts); Z.snd(900, .06);
          if (pts >= onda * 200){ onda++; G.txt("gOnda", onda); Z.toast("Onda " + onda); }
        }
        break;
      }
    }
    if (e.y > H - 30){ ini.splice(k, 1); vidas--; G.txt("gVid", vidas); Z.snd(160, .2, "sawtooth"); if(vidas <= 0) fim(); }
  }
}
function desenha(){
  if(!x) return;
  G.fundo(x, cnv, T.ceu);
  x.fillStyle = "rgba(159,81,64,.14)"; x.fillRect(0, H - 22, W, 22);
  x.fillStyle = "#252422";
  for (var i = 0; i < tiros.length; i++){ x.beginPath(); x.arc(tiros[i].x, tiros[i].y, 4, 0, 6.3); x.fill(); }
  for (var k = 0; k < ini.length; k++) G.emoji(x, T.inimigo, 28, ini[k].x, ini[k].y);
  G.emoji(x, T.heroi, 32, px, H - 38);
}
iniciar(); vivo = false; desenha();
G.loop(function(dt){ passo(dt); desenha(); });
cnv.addEventListener("pointerdown", function(e){ e.preventDefault(); px = G.pos(cnv, e).x; atirar(); });
document.getElementById("gStart").addEventListener("click", iniciar);
`;
  return { body, js };
}

/* ───────────────────────── 5. CORRIDA EM PISTAS ───────────────────────── */
export function corrida({ titulo, sub, tema = {} }) {
  const t = { heroi: "🐌", obst: "🪨", bonus: "⚡", pista: "#f2eee6", ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Distância", id: "gDist", val: "0 m" },
    { rot: "Velocidade", id: "gVel", val: "1.0x" },
    { rot: "Recorde", id: "gRec", val: "0 m" },
    { btn: "▶ Largar", id: "gStart" },
  ])}
  <canvas class="zc" id="cv" width="820" height="430"></canvas>
  ${dpad()}
  ${help(`← → trocam de pista. Desvie de ${t.obst}, pegue ${t.bonus} para acelerar e ganhar distância.`)}
</div>`;
  const js = `
var T = ${j(t)};
var C = G.ctx2d("cv"), cnv = C.c, x = C.x, W = cnv.width, H = cnv.height;
var LAN = 3, faixa = 1, obs, dist, vel, vivo = false, tick = 0, cool = 0;
G.txt("gRec", Z.store.get("rec:cor:" + document.body.dataset.app, 0) + " m");
function lx(i){ return W * (i + 0.5) / LAN; }
function iniciar(){ faixa = 1; obs = []; dist = 0; vel = 1; vivo = true; tick = 0; }
function fim(){
  vivo = false;
  var d = Math.round(dist);
  var b = G.best("cor:" + document.body.dataset.app, d); G.txt("gRec", b.valor + " m");
  G.over(b.novo ? "Novo recorde!" : "Batida!", "Você percorreu " + d + " metros.", "Correr de novo", iniciar);
}
function passo(dt){
  if(!vivo) return;
  cool -= dt;
  if (cool <= 0){
    if (G.keys.ArrowLeft){ faixa = Math.max(0, faixa - 1); cool = 9; Z.snd(420, .04); }
    else if (G.keys.ArrowRight){ faixa = Math.min(LAN - 1, faixa + 1); cool = 9; Z.snd(420, .04); }
  }
  dist += vel * 0.9 * dt; vel = Math.min(4, vel + 0.0012 * dt);
  G.txt("gDist", Math.round(dist) + " m"); G.txt("gVel", vel.toFixed(1) + "x");
  tick += dt;
  if (tick > Math.max(12, 34 - vel * 4)){
    tick = 0;
    obs.push({ f: G.ri(0, LAN - 1), y: -30, bonus: Math.random() < 0.22 });
  }
  for (var i = obs.length - 1; i >= 0; i--){
    var o = obs[i]; o.y += (4 + vel * 2.2) * dt;
    if (o.y > H - 70 && o.y < H - 26 && o.f === faixa){
      if (o.bonus){ obs.splice(i, 1); dist += 40; vel = Math.min(4.5, vel + 0.28); Z.snd(950, .07); }
      else { Z.snd(150, .25, "sawtooth"); fim(); return; }
    } else if (o.y > H + 30) obs.splice(i, 1);
  }
}
function desenha(){
  if(!x) return;
  G.fundo(x, cnv, T.pista);
  x.strokeStyle = "rgba(37,36,34,.16)"; x.setLineDash([16, 18]); x.lineWidth = 3;
  for (var l = 1; l < LAN; l++){ x.beginPath(); x.moveTo(W*l/LAN, 0); x.lineTo(W*l/LAN, H); x.stroke(); }
  x.setLineDash([]);
  for (var i = 0; i < obs.length; i++) G.emoji(x, obs[i].bonus ? T.bonus : T.obst, 30, lx(obs[i].f), obs[i].y);
  G.emoji(x, T.heroi, 36, lx(faixa), H - 48);
}
iniciar(); vivo = false; desenha();
G.loop(function(dt){ passo(dt); desenha(); });
document.getElementById("gStart").addEventListener("click", iniciar);
`;
  return { body, js };
}

/* ───────────────────────── 6. COBRA TEMÁTICA ───────────────────────── */
export function cobra({ titulo, sub, tema = {} }) {
  const t = { heroi: "🐍", item: "🍎", fundo: "#f7f4ec", cor: "#64716f", ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Pontos", id: "gPts", val: "0" },
    { rot: "Tamanho", id: "gTam", val: "3" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "▶ Começar", id: "gStart" },
  ])}
  <canvas class="zc" id="cv" width="800" height="440"></canvas>
  ${dpad()}
  ${help("Setas ou direcional para virar. Cada item coletado aumenta o rastro e a pontuação.")}
</div>`;
  const js = `
var T = ${j(t)};
var C = G.ctx2d("cv"), cnv = C.c, x = C.x, GR = 20, CW = cnv.width/GR, CH = cnv.height/GR;
var corpo, dir, prox, alvo, pts, vivo = false, acc = 0;
G.txt("gRec", Z.store.get("rec:cob:" + document.body.dataset.app, 0));
function posLivre(){
  var p;
  do { p = { x: G.ri(0, CW-1), y: G.ri(0, CH-1) }; }
  while (corpo.some(function(s){ return s.x === p.x && s.y === p.y; }));
  return p;
}
function iniciar(){
  corpo = [{x:5,y:5},{x:4,y:5},{x:3,y:5}]; dir = {x:1,y:0}; prox = dir;
  pts = 0; vivo = true; acc = 0; alvo = posLivre();
  G.txt("gPts", 0); G.txt("gTam", 3);
}
function fim(){
  vivo = false;
  var b = G.best("cob:" + document.body.dataset.app, pts); G.txt("gRec", b.valor);
  G.over(b.novo ? "Novo recorde!" : "Fim de jogo", "Pontos: " + pts, "Jogar de novo", iniciar);
}
function passo(dt){
  if(!vivo) return;
  if (G.keys.ArrowUp && dir.y === 0) prox = {x:0,y:-1};
  if (G.keys.ArrowDown && dir.y === 0) prox = {x:0,y:1};
  if (G.keys.ArrowLeft && dir.x === 0) prox = {x:-1,y:0};
  if (G.keys.ArrowRight && dir.x === 0) prox = {x:1,y:0};
  acc += dt;
  if (acc < 6) return;
  acc = 0; dir = prox;
  var h = { x: corpo[0].x + dir.x, y: corpo[0].y + dir.y };
  if (h.x < 0 || h.y < 0 || h.x >= CW || h.y >= CH) return fim();
  for (var i = 0; i < corpo.length; i++) if (corpo[i].x === h.x && corpo[i].y === h.y) return fim();
  corpo.unshift(h);
  if (h.x === alvo.x && h.y === alvo.y){
    pts += 10; G.txt("gPts", pts); G.txt("gTam", corpo.length); Z.snd(760, .06); alvo = posLivre();
  } else corpo.pop();
}
function desenha(){
  if(!x) return;
  G.fundo(x, cnv, T.fundo);
  G.emoji(x, T.item, 22, alvo.x*GR + GR/2, alvo.y*GR + GR/2);
  for (var i = corpo.length - 1; i >= 0; i--){
    x.fillStyle = i === 0 ? "#252422" : T.cor;
    x.globalAlpha = i === 0 ? 1 : 0.78;
    x.fillRect(corpo[i].x*GR + 1, corpo[i].y*GR + 1, GR - 2, GR - 2);
  }
  x.globalAlpha = 1;
  G.emoji(x, T.heroi, 17, corpo[0].x*GR + GR/2, corpo[0].y*GR + GR/2);
}
iniciar(); vivo = false; desenha();
G.loop(function(dt){ passo(dt); desenha(); });
document.getElementById("gStart").addEventListener("click", iniciar);
`;
  return { body, js };
}

/* ───────────────────────── 7. SUBIDA (plataformas) ───────────────────────── */
export function subida({ titulo, sub, tema = {} }) {
  const t = { heroi: "🧗", plat: "#8b8b64", item: "🔆", fundo: "#f6f4ee", ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Altura", id: "gAlt", val: "0" },
    { rot: "Coletados", id: "gCol", val: "0" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "▶ Subir", id: "gStart" },
  ])}
  <canvas class="zc" id="cv" width="560" height="470" style="max-width:560px;margin:0 auto"></canvas>
  ${dpad()}
  ${help("← → controlam o movimento. O salto é automático ao tocar cada plataforma — não caia.")}
</div>`;
  const js = `
var T = ${j(t)};
var C = G.ctx2d("cv"), cnv = C.c, x = C.x, W = cnv.width, H = cnv.height;
var p, plats, itens, alt, col, vivo = false;
G.txt("gRec", Z.store.get("rec:sub:" + document.body.dataset.app, 0));
function iniciar(){
  p = { x: W/2, y: H - 80, vy: -9 };
  plats = [{ x: W/2 - 45, y: H - 40, w: 90 }];
  itens = []; alt = 0; col = 0; vivo = true;
  for (var i = 1; i < 12; i++) plats.push({ x: G.rnd(10, W - 100), y: H - 40 - i * 62, w: 90 });
  G.txt("gAlt", 0); G.txt("gCol", 0);
}
function fim(){
  vivo = false;
  var b = G.best("sub:" + document.body.dataset.app, Math.round(alt)); G.txt("gRec", b.valor);
  G.over(b.novo ? "Novo recorde!" : "Você caiu", "Altura: " + Math.round(alt) + " · coletados: " + col, "Subir de novo", iniciar);
}
function passo(dt){
  if(!vivo) return;
  if (G.keys.ArrowLeft) p.x -= 5.4 * dt;
  if (G.keys.ArrowRight) p.x += 5.4 * dt;
  if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
  p.vy += 0.34 * dt; p.y += p.vy * dt;
  if (p.vy > 0){
    for (var i = 0; i < plats.length; i++){
      var pl = plats[i];
      if (p.x > pl.x - 6 && p.x < pl.x + pl.w + 6 && p.y > pl.y - 12 && p.y < pl.y + 12){
        p.vy = -9.2; Z.snd(620, .05);
      }
    }
  }
  if (p.y < H * 0.42){
    var d = H * 0.42 - p.y; p.y = H * 0.42; alt += d / 6;
    G.txt("gAlt", Math.round(alt));
    for (var k = 0; k < plats.length; k++) plats[k].y += d;
    for (var m = 0; m < itens.length; m++) itens[m].y += d;
    for (var q = plats.length - 1; q >= 0; q--){
      if (plats[q].y > H + 20){
        var topo = Math.min.apply(null, plats.map(function(o){ return o.y; }));
        plats[q].y = topo - 62; plats[q].x = G.rnd(10, W - 100);
        plats[q].w = Math.max(58, 92 - alt / 60);
        if (Math.random() < 0.28) itens.push({ x: plats[q].x + plats[q].w/2, y: plats[q].y - 26, viva: true });
      }
    }
    for (var z = itens.length - 1; z >= 0; z--) if (itens[z].y > H + 30) itens.splice(z, 1);
  }
  for (var w = itens.length - 1; w >= 0; w--){
    if (itens[w].viva && Math.hypot(itens[w].x - p.x, itens[w].y - p.y) < 24){
      itens.splice(w, 1); col++; alt += 25; G.txt("gCol", col); Z.snd(980, .06);
    }
  }
  if (p.y > H + 30) fim();
}
function desenha(){
  if(!x) return;
  G.fundo(x, cnv, T.fundo);
  x.fillStyle = T.plat;
  for (var i = 0; i < plats.length; i++) x.fillRect(plats[i].x, plats[i].y, plats[i].w, 10);
  for (var k = 0; k < itens.length; k++) G.emoji(x, T.item, 22, itens[k].x, itens[k].y);
  G.emoji(x, T.heroi, 30, p.x, p.y - 14);
}
iniciar(); vivo = false; desenha();
G.loop(function(dt){ passo(dt); desenha(); });
document.getElementById("gStart").addEventListener("click", iniciar);
`;
  return { body, js };
}

/* ───────────────────────── 8. EMPILHAR ───────────────────────── */
export function empilhar({ titulo, sub, tema = {} }) {
  const t = { cor: "#873f32", cor2: "#64716f", fundo: "#f7f5ef", peca: "bloco", ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Andares", id: "gAnd", val: "0" },
    { rot: "Precisão", id: "gPre", val: "100%" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "▶ Começar", id: "gStart" },
  ])}
  <canvas class="zc" id="cv" width="560" height="470" style="max-width:560px;margin:0 auto"></canvas>
  <div class="row center mt" style="justify-content:center">
    <button class="zbtn big" id="gDrop" type="button">⬇ Soltar ${t.peca}</button>
  </div>
  ${help("Clique em soltar (ou a tecla espaço) no momento em que a peça estiver alinhada. O que passar do alinhamento é perdido.")}
</div>`;
  const js = `
var T = ${j(t)};
var C = G.ctx2d("cv"), cnv = C.c, x = C.x, W = cnv.width, H = cnv.height;
var pilha, atual, vivo = false, andares, perfeitos;
G.txt("gRec", Z.store.get("rec:emp:" + document.body.dataset.app, 0));
function iniciar(){
  pilha = [{ x: W/2 - 90, w: 180 }]; andares = 0; perfeitos = 0; vivo = true;
  atual = { x: 0, w: 180, v: 3.2 };
  G.txt("gAnd", 0); G.txt("gPre", "100%");
}
function fim(){
  vivo = false;
  var b = G.best("emp:" + document.body.dataset.app, andares); G.txt("gRec", b.valor);
  G.over(b.novo ? "Novo recorde!" : "A torre caiu", "Andares construídos: " + andares, "Construir de novo", iniciar);
}
function soltar(){
  if(!vivo) return;
  var base = pilha[pilha.length - 1];
  var e = Math.max(atual.x, base.x), d = Math.min(atual.x + atual.w, base.x + base.w);
  var w = d - e;
  if (w <= 6){ Z.snd(150, .3, "sawtooth"); return fim(); }
  if (w > atual.w - 6) perfeitos++;
  pilha.push({ x: e, w: w });
  andares++; G.txt("gAnd", andares);
  G.txt("gPre", Math.round(100 * perfeitos / andares) + "%");
  Z.snd(500 + andares * 12, .07);
  atual = { x: 0, w: w, v: (3.2 + andares * 0.14) * (Math.random() < .5 ? 1 : -1) };
  if (atual.v < 0) atual.x = W - w;
}
function passo(dt){
  if(!vivo) return;
  atual.x += atual.v * dt;
  if (atual.x < 0){ atual.x = 0; atual.v *= -1; }
  if (atual.x + atual.w > W){ atual.x = W - atual.w; atual.v *= -1; }
}
function desenha(){
  if(!x) return;
  G.fundo(x, cnv, T.fundo);
  var alt = 22, base = H - 20;
  var ini = Math.max(0, pilha.length - 18);
  for (var i = ini; i < pilha.length; i++){
    var b = pilha[i];
    x.fillStyle = i % 2 ? T.cor2 : T.cor;
    x.fillRect(b.x, base - (i - ini + 1) * alt, b.w, alt - 3);
  }
  x.fillStyle = "#252422";
  x.fillRect(atual.x, base - (pilha.length - ini + 1) * alt - 26, atual.w, alt - 3);
}
iniciar(); vivo = false; desenha();
G.loop(function(dt){ passo(dt); desenha(); });
document.getElementById("gDrop").addEventListener("click", soltar);
document.addEventListener("keydown", function(e){ if(e.key === " ") soltar(); });
document.getElementById("gStart").addEventListener("click", iniciar);
`;
  return { body, js };
}

/* ───────────────────────── 9. PESCARIA / GANCHO ───────────────────────── */
export function gancho({ titulo, sub, tema = {} }) {
  const t = { heroi: "🪝", alvos: [{ e: "🐟", v: 10 }, { e: "🐙", v: 25 }, { e: "💎", v: 50 }], ruim: "🥾", fundo: "#eef2f4", ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Pontos", id: "gPts", val: "0" },
    { rot: "Tempo", id: "gTmp", val: "60s" },
    { rot: "Meta", id: "gMeta", val: "300" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "▶ Começar", id: "gStart" },
  ])}
  <canvas class="zc" id="cv" width="820" height="440"></canvas>
  ${help("Clique (ou espaço) para lançar o gancho no momento certo. Ele desce, agarra o que encostar e volta.")}
</div>`;
  const js = `
var T = ${j(t)};
var C = G.ctx2d("cv"), cnv = C.c, x = C.x, W = cnv.width, H = cnv.height;
var ang, gx, gy, estado, presa, alvos, pts, tempo, vivo = false;
G.txt("gRec", Z.store.get("rec:gan:" + document.body.dataset.app, 0));
function iniciar(){
  ang = 0; estado = "mira"; presa = null; pts = 0; tempo = 60; vivo = true; alvos = [];
  for (var i = 0; i < 12; i++){
    var a = G.pick(T.alvos.concat([{ e: T.ruim, v: -15 }]));
    alvos.push({ x: G.rnd(40, W - 40), y: G.rnd(140, H - 30), e: a.e, v: a.v, vx: G.rnd(-1, 1) * 1.1 });
  }
  G.txt("gPts", 0); G.txt("gTmp", "60s");
}
function fim(){
  vivo = false;
  var b = G.best("gan:" + document.body.dataset.app, pts); G.txt("gRec", b.valor);
  G.over(pts >= 300 ? "Meta batida!" : "Tempo esgotado", "Pontuação: " + pts, "Pescar de novo", iniciar);
}
function lancar(){ if(vivo && estado === "mira"){ estado = "desce"; gx = W/2; gy = 66; Z.snd(360, .07); } }
function passo(dt){
  if(!vivo) return;
  tempo -= dt / 60; if (tempo <= 0){ tempo = 0; return fim(); }
  G.txt("gTmp", Math.ceil(tempo) + "s");
  for (var i = 0; i < alvos.length; i++){
    var a = alvos[i]; a.x += a.vx * dt;
    if (a.x < 24 || a.x > W - 24) a.vx *= -1;
  }
  if (estado === "mira"){ ang += 0.032 * dt; }
  else if (estado === "desce"){
    gx += Math.sin(ang) * 3.4 * dt; gy += 4.2 * dt;
    for (var k = 0; k < alvos.length; k++){
      if (Math.hypot(alvos[k].x - gx, alvos[k].y - gy) < 22){ presa = alvos.splice(k, 1)[0]; estado = "sobe"; Z.snd(700, .07); break; }
    }
    if (gy > H - 8 || gx < 6 || gx > W - 6) estado = "sobe";
  } else if (estado === "sobe"){
    gy -= (presa ? 3.2 : 6) * dt;
    if (presa){ presa.x = gx; presa.y = gy; }
    if (gy <= 66){
      if (presa){
        pts = Math.max(0, pts + presa.v); G.txt("gPts", pts);
        Z.snd(presa.v > 0 ? 950 : 200, .09);
        var nv = G.pick(T.alvos.concat([{ e: T.ruim, v: -15 }]));
        alvos.push({ x: G.rnd(40, W - 40), y: G.rnd(150, H - 30), e: nv.e, v: nv.v, vx: G.rnd(-1, 1) * 1.1 });
        presa = null;
      }
      estado = "mira";
    }
  }
}
function desenha(){
  if(!x) return;
  G.fundo(x, cnv, T.fundo);
  x.fillStyle = "rgba(37,36,34,.06)"; x.fillRect(0, 0, W, 66);
  for (var i = 0; i < alvos.length; i++) G.emoji(x, alvos[i].e, 26, alvos[i].x, alvos[i].y);
  var hx = estado === "mira" ? W/2 + Math.sin(ang) * 120 : gx;
  var hy = estado === "mira" ? 100 : gy;
  x.strokeStyle = "#252422"; x.lineWidth = 2;
  x.beginPath(); x.moveTo(W/2, 60); x.lineTo(hx, hy); x.stroke();
  G.emoji(x, T.heroi, 24, hx, hy);
  if (presa) G.emoji(x, presa.e, 24, presa.x, presa.y + 18);
}
iniciar(); vivo = false; desenha();
G.loop(function(dt){ passo(dt); desenha(); });
cnv.addEventListener("pointerdown", function(e){ e.preventDefault(); lancar(); });
document.addEventListener("keydown", function(e){ if(e.key === " ") lancar(); });
document.getElementById("gStart").addEventListener("click", iniciar);
`;
  return { body, js };
}

/* ───────────────────────── 10. DEFESA EM PISTAS (tower defense) ───────────────────────── */
export function defesa({ titulo, sub, tema = {} }) {
  const t = { defensor: "🗼", inimigo: "👹", base: "🏰", moeda: "ouro", fundo: "#f5f2ea", ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Vidas", id: "gVid", val: "10" },
    { rot: t.moeda, id: "gOuro", val: "120" },
    { rot: "Onda", id: "gOnda", val: "0" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "▶ Próxima onda", id: "gOndaBtn" },
  ])}
  <canvas class="zc" id="cv" width="820" height="400"></canvas>
  <div class="zshop mt">
    <button id="cT1" type="button"><b>${t.defensor} Posto rápido</b>40 ${t.moeda} · dano 8 · alcance médio</button>
    <button id="cT2" type="button"><b>${t.defensor} Posto pesado</b>80 ${t.moeda} · dano 22 · lento</button>
    <button id="cT3" type="button"><b>${t.defensor} Posto longo</b>110 ${t.moeda} · dano 14 · alcance longo</button>
  </div>
  ${help("Escolha um posto e clique no mapa (fora do caminho) para construí-lo. Cada inimigo derrotado rende recursos.")}
</div>`;
  const js = `
var T = ${j(t)};
var C = G.ctx2d("cv"), cnv = C.c, x = C.x, W = cnv.width, H = cnv.height;
var CAM = [{x:0,y:120},{x:200,y:120},{x:200,y:290},{x:470,y:290},{x:470,y:110},{x:700,y:110},{x:700,y:330},{x:820,y:330}];
var TIPOS = {
  t1: { c: 40, dano: 8, alc: 110, cd: 26 },
  t2: { c: 80, dano: 22, alc: 95, cd: 52 },
  t3: { c: 110, dano: 14, alc: 190, cd: 40 }
};
var torres = [], mobs = [], ouro = 120, vidas = 10, onda = 0, sel = "t1", emOnda = false, aSpawn = 0, faltam = 0;
G.txt("gRec", Z.store.get("rec:def:" + document.body.dataset.app, 0));
function distCaminho(px, py){
  var md = 1e9;
  for (var i = 0; i < CAM.length - 1; i++){
    var a = CAM[i], b = CAM[i+1];
    var dx = b.x - a.x, dy = b.y - a.y;
    var t2 = ((px - a.x) * dx + (py - a.y) * dy) / (dx*dx + dy*dy || 1);
    t2 = G.clamp(t2, 0, 1);
    md = Math.min(md, Math.hypot(px - (a.x + dx*t2), py - (a.y + dy*t2)));
  }
  return md;
}
function iniciarOnda(){
  if (emOnda) return Z.toast("Onda em andamento");
  onda++; G.txt("gOnda", onda); emOnda = true;
  faltam = 6 + onda * 2; aSpawn = 0;
}
function fim(){
  var b = G.best("def:" + document.body.dataset.app, onda); G.txt("gRec", b.valor);
  G.over(b.novo ? "Novo recorde!" : "A base caiu", "Você resistiu a " + onda + " onda(s).", "Defender de novo", function(){
    torres = []; mobs = []; ouro = 120; vidas = 10; onda = 0; emOnda = false;
    G.txt("gOuro", ouro); G.txt("gVid", vidas); G.txt("gOnda", 0);
  });
}
function passo(dt){
  if (emOnda && faltam > 0){
    aSpawn += dt;
    if (aSpawn > 34){ aSpawn = 0; faltam--;
      mobs.push({ x: CAM[0].x, y: CAM[0].y, i: 0, hp: 28 + onda * 14, max: 28 + onda * 14, v: 0.9 + onda * 0.045 }); }
  }
  for (var m = mobs.length - 1; m >= 0; m--){
    var e = mobs[m], alvo = CAM[e.i + 1];
    if (!alvo){ mobs.splice(m, 1); vidas--; G.txt("gVid", vidas); Z.snd(160, .2, "sawtooth"); if(vidas <= 0) return fim(); continue; }
    var dx = alvo.x - e.x, dy = alvo.y - e.y, d = Math.hypot(dx, dy);
    if (d < e.v * dt) e.i++;
    else { e.x += dx/d * e.v * dt; e.y += dy/d * e.v * dt; }
  }
  for (var i = 0; i < torres.length; i++){
    var tr = torres[i]; tr.cd -= dt;
    if (tr.cd > 0) continue;
    for (var k = 0; k < mobs.length; k++){
      if (Math.hypot(mobs[k].x - tr.x, mobs[k].y - tr.y) < tr.alc){
        mobs[k].hp -= tr.dano; tr.cd = tr.maxCd; tr.tiro = { x: mobs[k].x, y: mobs[k].y, t: 6 };
        Z.snd(620, .03);
        if (mobs[k].hp <= 0){ mobs.splice(k, 1); ouro += 12 + onda; G.txt("gOuro", ouro); }
        break;
      }
    }
  }
  if (emOnda && faltam === 0 && mobs.length === 0){
    emOnda = false; ouro += 45 + onda * 6; G.txt("gOuro", ouro); Z.toast("Onda " + onda + " repelida! +" + (45 + onda*6));
  }
}
function desenha(){
  if(!x) return;
  G.fundo(x, cnv, T.fundo);
  x.strokeStyle = "rgba(37,36,34,.16)"; x.lineWidth = 34; x.lineJoin = "round"; x.lineCap = "round";
  x.beginPath(); x.moveTo(CAM[0].x, CAM[0].y);
  for (var i = 1; i < CAM.length; i++) x.lineTo(CAM[i].x, CAM[i].y);
  x.stroke();
  G.emoji(x, T.base, 30, W - 26, CAM[CAM.length-1].y);
  for (var k = 0; k < torres.length; k++){
    var tr = torres[k];
    x.strokeStyle = "rgba(100,113,111,.35)"; x.lineWidth = 1;
    x.beginPath(); x.arc(tr.x, tr.y, tr.alc, 0, 6.3); x.stroke();
    G.emoji(x, T.defensor, 28, tr.x, tr.y);
    if (tr.tiro && tr.tiro.t > 0){
      tr.tiro.t--; x.strokeStyle = "#873f32"; x.lineWidth = 2;
      x.beginPath(); x.moveTo(tr.x, tr.y); x.lineTo(tr.tiro.x, tr.tiro.y); x.stroke();
    }
  }
  for (var m = 0; m < mobs.length; m++){
    var e = mobs[m];
    G.emoji(x, T.inimigo, 26, e.x, e.y);
    x.fillStyle = "rgba(37,36,34,.2)"; x.fillRect(e.x - 15, e.y - 22, 30, 4);
    x.fillStyle = "#9f5140"; x.fillRect(e.x - 15, e.y - 22, 30 * Math.max(0, e.hp) / e.max, 4);
  }
}
G.loop(function(dt){ passo(dt); desenha(); });
cnv.addEventListener("click", function(ev){
  var pnt = G.pos(cnv, ev), tp = TIPOS[sel];
  if (distCaminho(pnt.x, pnt.y) < 34) return Z.toast("Não dá para construir sobre o caminho");
  if (ouro < tp.c) return Z.toast("Recursos insuficientes");
  ouro -= tp.c; G.txt("gOuro", ouro);
  torres.push({ x: pnt.x, y: pnt.y, dano: tp.dano, alc: tp.alc, cd: 0, maxCd: tp.cd });
  Z.snd(520, .07);
});
document.getElementById("cT1").addEventListener("click", function(){ sel = "t1"; Z.toast("Posto rápido selecionado"); });
document.getElementById("cT2").addEventListener("click", function(){ sel = "t2"; Z.toast("Posto pesado selecionado"); });
document.getElementById("cT3").addEventListener("click", function(){ sel = "t3"; Z.toast("Posto longo selecionado"); });
document.getElementById("gOndaBtn").addEventListener("click", iniciarOnda);
desenha();
`;
  return { body, js };
}

/* ───────────────────────── 11. LABIRINTO ───────────────────────── */
export function labirinto({ titulo, sub, tema = {} }) {
  const t = { heroi: "🧭", saida: "🚪", item: "🔑", fundo: "#f6f4ee", ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Nível", id: "gNiv", val: "1" },
    { rot: "Chaves", id: "gCh", val: "0/3" },
    { rot: "Passos", id: "gPas", val: "0" },
    { rot: "Melhor nível", id: "gRec", val: "1" },
    { btn: "🔄 Novo labirinto", id: "gStart" },
  ])}
  <canvas class="zc" id="cv" width="620" height="440" style="max-width:620px;margin:0 auto"></canvas>
  ${dpad()}
  ${help(`Recolha as ${t.item} e chegue até ${t.saida}. Cada nível gera um labirinto novo e maior.`)}
</div>`;
  const js = `
var T = ${j(t)};
var C = G.ctx2d("cv"), cnv = C.c, x = C.x, W = cnv.width, H = cnv.height;
var cols, rows, cel, grade, p, saida, chaves, pegas, niv = 1, passos = 0, cool = 0;
G.txt("gRec", Z.store.get("rec:lab:" + document.body.dataset.app, 1));
function gerar(){
  cols = Math.min(19, 9 + niv * 2); rows = Math.min(13, 7 + niv);
  cel = Math.floor(Math.min(W / cols, H / rows));
  grade = [];
  for (var r = 0; r < rows; r++){
    grade[r] = [];
    for (var c = 0; c < cols; c++) grade[r][c] = { n:1, s:1, l:1, o:1, v:0 };
  }
  var pilha = [{ r:0, c:0 }]; grade[0][0].v = 1;
  while (pilha.length){
    var at = pilha[pilha.length - 1];
    var viz = [];
    if (at.r > 0 && !grade[at.r-1][at.c].v) viz.push({ r:at.r-1, c:at.c, a:"n", b:"s" });
    if (at.r < rows-1 && !grade[at.r+1][at.c].v) viz.push({ r:at.r+1, c:at.c, a:"s", b:"n" });
    if (at.c > 0 && !grade[at.r][at.c-1].v) viz.push({ r:at.r, c:at.c-1, a:"o", b:"l" });
    if (at.c < cols-1 && !grade[at.r][at.c+1].v) viz.push({ r:at.r, c:at.c+1, a:"l", b:"o" });
    if (!viz.length){ pilha.pop(); continue; }
    var n = G.pick(viz);
    grade[at.r][at.c][n.a] = 0; grade[n.r][n.c][n.b] = 0; grade[n.r][n.c].v = 1;
    pilha.push({ r:n.r, c:n.c });
  }
  p = { r:0, c:0 }; saida = { r: rows-1, c: cols-1 }; passos = 0; pegas = 0;
  chaves = [];
  while (chaves.length < 3){
    var k = { r: G.ri(1, rows-1), c: G.ri(1, cols-1) };
    if (!chaves.some(function(o){ return o.r===k.r && o.c===k.c; })) chaves.push(k);
  }
  G.txt("gNiv", niv); G.txt("gCh", "0/3"); G.txt("gPas", 0);
}
function mover(dr, dc, par){
  if (grade[p.r][p.c][par]) return;
  p.r += dr; p.c += dc; passos++; G.txt("gPas", passos); Z.snd(420, .03);
  for (var i = chaves.length - 1; i >= 0; i--){
    if (chaves[i].r === p.r && chaves[i].c === p.c){
      chaves.splice(i, 1); pegas++; G.txt("gCh", pegas + "/3"); Z.snd(880, .07);
    }
  }
  if (p.r === saida.r && p.c === saida.c){
    if (pegas < 3) return Z.toast("Faltam chaves: " + (3 - pegas));
    Z.snd(1000, .16); niv++;
    var b = G.best("lab:" + document.body.dataset.app, niv); G.txt("gRec", b.valor);
    Z.toast("Nível " + niv + "!"); gerar();
  }
}
function desenha(){
  if(!x) return;
  G.fundo(x, cnv, T.fundo);
  var ox = (W - cols*cel)/2, oy = (H - rows*cel)/2;
  x.strokeStyle = "#252422"; x.lineWidth = 2;
  for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++){
    var g = grade[r][c], X = ox + c*cel, Y = oy + r*cel;
    x.beginPath();
    if (g.n){ x.moveTo(X, Y); x.lineTo(X+cel, Y); }
    if (g.s){ x.moveTo(X, Y+cel); x.lineTo(X+cel, Y+cel); }
    if (g.o){ x.moveTo(X, Y); x.lineTo(X, Y+cel); }
    if (g.l){ x.moveTo(X+cel, Y); x.lineTo(X+cel, Y+cel); }
    x.stroke();
  }
  for (var k = 0; k < chaves.length; k++) G.emoji(x, T.item, cel*0.66, ox + chaves[k].c*cel + cel/2, oy + chaves[k].r*cel + cel/2);
  G.emoji(x, T.saida, cel*0.72, ox + saida.c*cel + cel/2, oy + saida.r*cel + cel/2);
  G.emoji(x, T.heroi, cel*0.72, ox + p.c*cel + cel/2, oy + p.r*cel + cel/2);
}
gerar(); desenha();
G.loop(function(dt){
  cool -= dt;
  if (cool <= 0){
    if (G.keys.ArrowUp){ mover(-1, 0, "n"); cool = 8; }
    else if (G.keys.ArrowDown){ mover(1, 0, "s"); cool = 8; }
    else if (G.keys.ArrowLeft){ mover(0, -1, "o"); cool = 8; }
    else if (G.keys.ArrowRight){ mover(0, 1, "l"); cool = 8; }
  }
  desenha();
});
document.getElementById("gStart").addEventListener("click", function(){ gerar(); });
`;
  return { body, js };
}

/* ───────────────────────── 12. RITMO ───────────────────────── */
export function ritmo({ titulo, sub, tema = {} }) {
  const t = { notas: ["🎵", "🎶", "🎼", "🔔"], fundo: "#f6f4ef", ...tema };
  const body = `${hero(titulo, sub)}
<div class="zcard pad">
  ${hud([
    { rot: "Pontos", id: "gPts", val: "0" },
    { rot: "Combo", id: "gCombo", val: "0" },
    { rot: "Precisão", id: "gPre", val: "100%" },
    { rot: "Recorde", id: "gRec", val: "0" },
    { btn: "▶ Tocar", id: "gStart" },
  ])}
  <canvas class="zc" id="cv" width="560" height="440" style="max-width:560px;margin:0 auto"></canvas>
  <div class="zlanes" id="lanes">
    <button data-l="0" type="button">D</button>
    <button data-l="1" type="button">F</button>
    <button data-l="2" type="button">J</button>
    <button data-l="3" type="button">K</button>
  </div>
  ${help("Acerte as teclas D F J K (ou os botões) quando a nota cruzar a linha. Combos multiplicam a pontuação.")}
</div>`;
  const js = `
var T = ${j(t)};
var C = G.ctx2d("cv"), cnv = C.c, x = C.x, W = cnv.width, H = cnv.height;
var LIN = H - 60, notas = [], pts = 0, combo = 0, acertos = 0, total = 0, vivo = false, tick = 0, fx = [0,0,0,0];
G.txt("gRec", Z.store.get("rec:rit:" + document.body.dataset.app, 0));
function iniciar(){ notas = []; pts = 0; combo = 0; acertos = 0; total = 0; vivo = true; tick = 0;
  G.txt("gPts", 0); G.txt("gCombo", 0); G.txt("gPre", "100%"); }
function bater(l){
  fx[l] = 8;
  if (!vivo) return;
  var melhor = -1, md = 999;
  for (var i = 0; i < notas.length; i++){
    if (notas[i].l !== l || notas[i].morta) continue;
    var d = Math.abs(notas[i].y - LIN);
    if (d < md){ md = d; melhor = i; }
  }
  if (melhor >= 0 && md < 42){
    notas[melhor].morta = true; total++; acertos++;
    combo++; pts += md < 16 ? 30 + combo * 2 : 15 + combo;
    Z.snd(520 + l * 110, .06);
  } else { combo = 0; total++; Z.snd(180, .07, "square"); }
  G.txt("gPts", pts); G.txt("gCombo", combo);
  G.txt("gPre", Math.round(100 * acertos / Math.max(1, total)) + "%");
}
function passo(dt){
  for (var f = 0; f < 4; f++) if (fx[f] > 0) fx[f] -= dt;
  if(!vivo) return;
  tick += dt;
  if (tick > Math.max(16, 40 - pts / 90)){ tick = 0; notas.push({ l: G.ri(0,3), y: -20, e: G.pick(T.notas) }); }
  for (var i = notas.length - 1; i >= 0; i--){
    notas[i].y += (3.1 + pts / 1600) * dt;
    if (notas[i].y > H + 20){
      if (!notas[i].morta){ combo = 0; total++; G.txt("gCombo", 0);
        G.txt("gPre", Math.round(100 * acertos / Math.max(1, total)) + "%"); }
      notas.splice(i, 1);
    }
  }
  if (total >= 40){
    vivo = false;
    var b = G.best("rit:" + document.body.dataset.app, pts); G.txt("gRec", b.valor);
    G.over(b.novo ? "Novo recorde!" : "Fim da música", "Pontos: " + pts + " · precisão " + Math.round(100*acertos/Math.max(1,total)) + "%", "Tocar de novo", iniciar);
  }
}
function desenha(){
  if(!x) return;
  G.fundo(x, cnv, T.fundo);
  for (var l = 0; l < 4; l++){
    x.fillStyle = fx[l] > 0 ? "rgba(159,81,64,.18)" : "rgba(37,36,34,.045)";
    x.fillRect(l * W/4 + 4, 0, W/4 - 8, H);
  }
  x.strokeStyle = "#873f32"; x.lineWidth = 3;
  x.beginPath(); x.moveTo(0, LIN); x.lineTo(W, LIN); x.stroke();
  for (var i = 0; i < notas.length; i++)
    if (!notas[i].morta) G.emoji(x, notas[i].e, 30, notas[i].l * W/4 + W/8, notas[i].y);
}
iniciar(); vivo = false; desenha();
G.loop(function(dt){ passo(dt); desenha(); });
var bs = document.querySelectorAll("#lanes button");
for (var i = 0; i < bs.length; i++)
  (function(b){ b.addEventListener("click", function(){ bater(+b.getAttribute("data-l")); }); })(bs[i]);
document.addEventListener("keydown", function(e){
  var m = { d:0, f:1, j:2, k:3 };
  var k = (e.key || "").toLowerCase();
  if (m[k] !== undefined){ e.preventDefault(); bater(m[k]); }
});
document.getElementById("gStart").addEventListener("click", iniciar);
`;
  return { body, js };
}

export const JOGOS_ARCADE = {
  travessia, voo, coleta, tiro, corrida, cobra, subida, empilhar, gancho, defesa, labirinto, ritmo,
};
