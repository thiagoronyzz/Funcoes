/* Zcode — engines de Jogos (29 engines jogáveis) */

function wrapGame({ titulo, sub, body, js, css }) {
  return {
    body: `
<div class="zhero"><h1>${titulo}</h1><p>${sub}</p></div>
${body}`,
    js,
    css: css || "",
  };
}

/* ── SNAKE ──────────────────────────────────────────────── */
export function snake({ nome, sub, tema, velocidade, wrap }) {
  const cor = { neon: "#29e0ff", retrô: "#7dff6a", rosa: "#ff4d8f", violeta: "#a78bfa", amarelo: "#ffd166", ciano: "#22d3ee" }[tema] || "#29e0ff";
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="score">Pontos: 0</span>
  <span class="zchip" id="best">Recorde: 0</span>
</div>
<div style="position:relative;max-width:440px;margin:0 auto">
  <canvas class="zc" id="cv" width="360" height="360"></canvas>
  <div class="zmodal hidden" id="fim" style="position:absolute;inset:0;border-radius:16px">
    <div class="zbox">
      <h3>Fim de jogo</h3>
      <p>Pontuação: <b class="acc" id="fimScore">0</b></p>
      <button class="zbtn" id="reinicia" type="button">Jogar de novo</button>
    </div>
  </div>
</div>
<p class="dim center mt" style="font-size:12.5px">← ↑ → ↓ ou WASD · no celular, deslize o dedo</p>`;
  const js = `
(function(){
  var cv = document.getElementById("cv");
  var ctx = cv.getContext ? cv.getContext("2d") : null;
  if(!ctx){ cv.outerHTML = "<p class='dim center'>Seu navegador não suporta canvas.</p>"; return; }
  var N = 18, W = 360, C = W / N;
  var cor = ${JSON.stringify(cor)}, vel = ${velocidade || 140}, WRAP = ${wrap ? "true" : "false"};
  var snake, dir, filaDir, food, score, over, last, acc, best = Z.store.best("snake-${tema}", 0);
  document.getElementById("best").textContent = "Recorde: " + best;
  function novo(){
    snake = [{x: 8, y: 9}, {x: 7, y: 9}, {x: 6, y: 9}];
    dir = {x: 1, y: 0}; filaDir = []; score = 0; over = false; last = performance.now(); acc = 0;
    document.getElementById("fim").classList.add("hidden");
    putFood(); atualizaHUD();
    requestAnimationFrame(loop);
  }
  function putFood(){
    do { food = {x: Z.rnd(0, N-1), y: Z.rnd(0, N-1)} }
    while(snake.some(function(s){ return s.x === food.x && s.y === food.y }));
  }
  function atualizaHUD(){ document.getElementById("score").textContent = "Pontos: " + score }
  function turnar(nx, ny){
    var ultimo = filaDir.length ? filaDir[filaDir.length - 1] : dir;
    if(nx === -ultimo.x && ny === -ultimo.y) return;
    if(nx === ultimo.x && ny === ultimo.y) return;
    filaDir.push({x: nx, y: ny});
    if(filaDir.length > 3) filaDir.shift();
  }
  Z.onKey({ArrowUp: function(){ turnar(0,-1) }, ArrowDown: function(){ turnar(0,1) }, ArrowLeft: function(){ turnar(-1,0) }, ArrowRight: function(){ turnar(1,0) },
    w: function(){ turnar(0,-1) }, s: function(){ turnar(0,1) }, a: function(){ turnar(-1,0) }, d: function(){ turnar(1,0) }});
  var tx = null, ty = null;
  cv.addEventListener("touchstart", function(e){ var t = e.touches[0]; tx = t.clientX; ty = t.clientY }, {passive: true});
  cv.addEventListener("touchend", function(e){
    if(tx == null) return;
    var t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
    if(Math.abs(dx) > Math.abs(dy)) turnar(dx > 0 ? 1 : -1, 0); else turnar(0, dy > 0 ? 1 : -1);
    tx = null;
  }, {passive: true});
  function passo(){
    if(filaDir.length) dir = filaDir.shift();
    var cab = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
    if(WRAP){ cab.x = (cab.x + N) % N; cab.y = (cab.y + N) % N; }
    else if(cab.x < 0 || cab.y < 0 || cab.x >= N || cab.y >= N) return fim();
    if(snake.some(function(s){ return s.x === cab.x && s.y === cab.y })) return fim();
    snake.unshift(cab);
    if(cab.x === food.x && cab.y === food.y){
      score++; atualizaHUD(); Z.snd(760, 0.06, "sine"); putFood();
    } else snake.pop();
  }
  function fim(){
    over = true;
    Z.snd(140, 0.3, "sawtooth", 0.05);
    if(score > best){ best = score; Z.store.setBest("snake-${tema}", best); document.getElementById("best").textContent = "Recorde: " + best }
    document.getElementById("fimScore").textContent = score;
    document.getElementById("fim").classList.remove("hidden");
  }
  function desenha(){
    ctx.fillStyle = "#0a0d1a"; ctx.fillRect(0, 0, W, W);
    ctx.fillStyle = "rgba(148,158,210,0.07)";
    for(var x = 0; x < N; x++) for(var y = 0; y < N; y++) ctx.fillRect(x*C + C/2 - 1, y*C + C/2 - 1, 2, 2);
    ctx.fillStyle = "#ff5c5c";
    ctx.beginPath(); ctx.arc(food.x*C + C/2, food.y*C + C/2, C/3, 0, 7); ctx.fill();
    for(var i = snake.length - 1; i >= 0; i--){
      var s = snake[i];
      ctx.fillStyle = i === 0 ? "#ffffff" : cor;
      var p = 2;
      ctx.beginPath();
      ctx.roundRect(s.x*C + p, s.y*C + p, C - 2*p, C - 2*p, 5);
      ctx.fill();
    }
  }
  function loop(ts){
    if(over) return;
    acc += ts - last; last = ts;
    var tick = Math.max(70, vel - Math.floor(score / 5) * 8);
    while(acc >= tick){ acc -= tick; passo(); if(over) return }
    desenha();
    requestAnimationFrame(loop);
  }
  document.getElementById("reinicia").addEventListener("click", novo);
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── 2048 ──────────────────────────────────────────────── */
export function jogo2048({ nome, sub, n, alvo }) {
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="score">Pontos: 0</span>
  <span class="zchip" id="best">Recorde: 0</span>
</div>
<div id="tabuleiro" style="max-width:420px;margin:0 auto;display:grid;gap:8px;grid-template-columns:repeat(${n},1fr)"></div>
<div class="row mt" style="justify-content:center;gap:10px">
  <button class="zbtn ghost sm" id="reinicia" type="button">Reiniciar</button>
</div>
<p class="dim center mt" style="font-size:12.5px">Setas ou deslize o dedo para mover. Alvo: <b class="acc">${alvo}</b></p>`;
  const js = `
(function(){
  var N = ${n}, ALVO = ${alvo};
  var grid, score, best = Z.store.best("2048-" + N, 0);
  document.getElementById("best").textContent = "Recorde: " + best;
  var CORES = {0: "var(--z-surface2)", 2: "#1b2440", 4: "#233258", 8: "#7c5cff", 16: "#8f6dff", 32: "#29e0ff", 64: "#19b8d8", 128: "#7dff6a", 256: "#57e84e", 512: "#ffd166", 1024: "#ffb347", 2048: "#ff4d8f", 4096: "#ff2d78"};
  function novo(){
    grid = [];
    for(var i = 0; i < N*N; i++) grid.push(0);
    score = 0;
    add(); add();
    render();
  }
  function add(){
    var zeros = [];
    grid.forEach(function(v, i){ if(!v) zeros.push(i) });
    if(!zeros.length) return;
    grid[zeros[Z.rnd(0, zeros.length - 1)]] = Math.random() < 0.9 ? 2 : 4;
  }
  function slide(linha){
    var arr = linha.filter(function(v){ return v });
    for(var i = 0; i < arr.length - 1; i++){
      if(arr[i] === arr[i+1]){ arr[i] *= 2; score += arr[i]; arr.splice(i+1, 1); }
    }
    while(arr.length < N) arr.push(0);
    return arr;
  }
  function move(dir){
    var antes = grid.join(",");
    var idx = function(r, c){ return r*N + c };
    if(dir === "L" || dir === "R"){
      for(var r = 0; r < N; r++){
        var linha = [];
        for(var c = 0; c < N; c++) linha.push(grid[idx(r, c)]);
        if(dir === "R") linha.reverse();
        linha = slide(linha);
        if(dir === "R") linha.reverse();
        for(var c2 = 0; c2 < N; c2++) grid[idx(r, c2)] = linha[c2];
      }
    } else {
      for(var c3 = 0; c3 < N; c3++){
        var col = [];
        for(var r2 = 0; r2 < N; r2++) col.push(grid[idx(r2, c3)]);
        if(dir === "B") col.reverse();
        col = slide(col);
        if(dir === "B") col.reverse();
        for(var r3 = 0; r3 < N; r3++) grid[idx(r3, c3)] = col[r3];
      }
    }
    if(grid.join(",") !== antes){
      add(); render();
      if(score > best){ best = score; Z.store.setBest("2048-" + N, best); document.getElementById("best").textContent = "Recorde: " + best }
      Z.snd(600, 0.04, "sine");
      checar();
    }
  }
  function pode(){
    for(var i = 0; i < grid.length; i++){
      if(!grid[i]) return true;
      var r = Math.floor(i / N), c = i % N;
      if(c < N-1 && grid[i+1] === grid[i]) return true;
      if(r < N-1 && grid[idx(r+1, c)] === grid[i]) return true;
    }
    return false;
    function idx(a, b){ return a*N + b }
  }
  function checar(){
    var ganhou = grid.some(function(v){ return v >= ALVO });
    if(ganhou || !pode()){
      var msg = ganhou ? "Vitória Você chegou a " + ALVO + "!" : "Sem mais jogadas!";
      Z.toast(msg, 3000);
    }
  }
  function render(){
    var t = document.getElementById("tabuleiro");
    t.innerHTML = "";
    grid.forEach(function(v){
      var d = document.createElement("div");
      d.style.cssText = "aspect-ratio:1;border-radius:12px;display:grid;place-items:center;font-family:var(--z-fd);font-weight:700;font-size:" + (v >= 1024 ? "17px" : v >= 128 ? "20px" : "24px") + ";background:" + (CORES[v] || "#ff2d78") + ";color:#fff;transition:.12s";
      d.textContent = v || "";
      t.appendChild(d);
    });
    document.getElementById("score").textContent = "Pontos: " + score;
  }
  Z.onKey({ArrowLeft: function(){ move("L") }, ArrowRight: function(){ move("R") }, ArrowUp: function(){ move("T") }, ArrowDown: function(){ move("B") }});
  var tx = null, ty = null;
  var tb = document.getElementById("tabuleiro");
  tb.addEventListener("touchstart", function(e){ var t = e.touches[0]; tx = t.clientX; ty = t.clientY }, {passive: true});
  tb.addEventListener("touchend", function(e){
    if(tx == null) return;
    var t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
    if(Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "R" : "L"); else move(dy > 0 ? "B" : "T");
    tx = null;
  }, {passive: true});
  document.getElementById("reinicia").addEventListener("click", novo);
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── MEMÓRIA ───────────────────────────────────────────── */
export function memoria({ nome, sub, emoji, cols }) {
  const n = emoji.length;
  const body = `
<div class="row mb" style="justify-content:center;gap:8px;flex-wrap:wrap">
  <span class="zchip" id="moves">Jogadas: 0</span>
  <span class="zchip" id="tempo">Tempo 0s</span>
  <span class="zchip" id="best">Recorde: ${n * 2} jogadas</span>
</div>
<div class="zgrid" id="tabuleiro" style="grid-template-columns:repeat(${cols},1fr);max-width:480px;margin:0 auto;gap:9px"></div>
<div class="zcard pad center hidden" id="fim">
  <div class="zbig acc">Vitória</div>
  <h3>Completou em <span class="acc" id="fimMoves">0</span> jogadas</h3>
  <p class="dim" id="fimTempo"></p>
  <button class="zbtn" id="reinicia" type="button">Jogar de novo</button>
</div>`;
  const js = `
(function(){
  var EMO = ${JSON.stringify(emoji)};
  var N = ${n};
  var moves, achados, seg, tick, first, travado, best = Z.store.best("mem-${nome}", 0);
  if(best){ document.getElementById("best").textContent = "Recorde: " + best + " jogadas" }
  function $id(x){return document.getElementById(x)}
  function novo(){
    moves = 0; achados = 0; seg = 0; first = null; travado = false;
    clearInterval(tick);
    tick = setInterval(function(){ seg++; $id("tempo").textContent = "Tempo " + seg + "s" }, 1000);
    $id("fim").classList.add("hidden");
    var cards = Z.shuffle(EMO.concat(EMO));
    var box = $id("tabuleiro"); box.innerHTML = "";
    cards.forEach(function(e){
      var b = document.createElement("button");
      b.className = "zopty";
      b.style.cssText = "min-height:78px;justify-content:center;font-size:34px;padding:8px";
      b.textContent = "";
      b.dataset.e = e;
      b.addEventListener("click", function(){ virar(b) });
      box.appendChild(b);
    });
    atualizar();
  }
  function virar(b){
    if(travado || b.classList.contains("ok") || b === first) return;
    b.classList.add("ok");
    b.style.color = "var(--z-text)";
    b.textContent = b.dataset.e;
    Z.snd(500, 0.03, "sine", 0.02);
    if(!first){ first = b; return }
    travado = true; moves++;
    var a = first; first = null;
    setTimeout(function(){
      if(a.dataset.e === b.dataset.e){
        achados++;
        Z.snd(880, 0.07, "sine");
      } else {
        a.classList.remove("ok"); b.classList.remove("ok");
        a.textContent = ""; b.textContent = "";
        Z.snd(180, 0.1, "sawtooth", 0.03);
      }
      travado = false;
      atualizar();
      if(achados >= N){
        clearInterval(tick);
        $id("fim").classList.remove("hidden");
        $id("fimMoves").textContent = moves;
        $id("fimTempo").textContent = "Tempo: " + seg + "s";
        if(!best || moves < best){ best = moves; Z.store.setBest("mem-${nome}", best); document.getElementById("best").textContent = "Recorde: " + best + " jogadas" }
        Z.snd(1040, 0.25, "triangle", 0.06);
      }
    }, 420);
  }
  function atualizar(){
    $id("moves").textContent = "Jogadas: " + moves;
  }
  $id("reinicia").addEventListener("click", novo);
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── JOGO DA VELHA ─────────────────────────────────────── */
export function velha({ nome, sub, cpu }) {
  const body = `
<div class="zcard pad" style="max-width:380px;margin:0 auto">
  <p class="zchip center mb" style="display:block;margin-left:auto;margin-right:auto" id="turno">Vez de: Fechar</p>
  <div class="zgrid" id="tabuleiro" style="grid-template-columns:repeat(3,1fr);gap:8px"></div>
  <div class="row mt" style="justify-content:center">
    <button class="zbtn ghost sm" id="reinicia" type="button">Reiniciar</button>
  </div>
</div>`;
  const js = `
(function(){
  var CPU = ${cpu ? "true" : "false"};
  var t = [], jogador = "Fechar", travado = false;
  function $id(x){return document.getElementById(x)}
  var L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function novo(){
    t = [null,null,null,null,null,null,null,null,null];
    jogador = "Fechar"; travado = false;
    $id("turno").textContent = "Vez de: Fechar";
    var box = $id("tabuleiro"); box.innerHTML = "";
    for(var i = 0; i < 9; i++){
      var b = document.createElement("button");
      b.className = "zopty";
      b.style.cssText = "min-height:92px;justify-content:center;font-size:40px;font-family:var(--z-fd)";
      b.dataset.i = i;
      b.addEventListener("click", function(){ jogar(this) });
      box.appendChild(b);
    }
  }
  function jogou(i, v){ t[i] = v; $id("tabuleiro").children[i].textContent = v; }
  function vencedor(){
    for(var k = 0; k < L.length; k++){
      var a = L[k][0];
      if(t[a] && t[a] === t[L[k][1]] && t[a] === t[L[k][2]]) return {v: t[a], linha: L[k]};
    }
    if(t.every(Boolean)) return {v: "="};
    return null;
  }
  function jogar(b){
    var i = parseInt(b.dataset.i, 10);
    if(travado || t[i] || (CPU && jogador === "○")) return;
    jogou(i, jogador);
    Z.snd(600, 0.05, "sine");
    var w = vencedor();
    if(w) return fim(w);
    jogador = jogador === "Fechar" ? "○" : "Fechar";
    $id("turno").textContent = "Vez de: " + jogador;
    if(CPU && jogador === "○") setTimeout(cpuJoga, 420);
  }
  function cpuJoga(){
    var v = achar("○");
    if(v == null) v = achar("Fechar");
    if(v == null && !t[4]) v = 4;
    if(v == null){
      var cantos = [0,2,6,8].filter(function(i){ return !t[i] });
      if(cantos.length) v = cantos[Z.rnd(0, cantos.length - 1)];
    }
    if(v == null){
      var livres = [];
      t.forEach(function(x, i){ if(!x) livres.push(i) });
      v = livres[Z.rnd(0, livres.length - 1)];
    }
    jogou(v, "○");
    Z.snd(440, 0.05, "sine");
    var w = vencedor();
    if(w) return fim(w);
    jogador = "Fechar";
    $id("turno").textContent = "Vez de: Fechar";
  }
  function achar(v){
    for(var k = 0; k < L.length; k++){
      var l = L[k], meus = 0, vazios = [];
      for(var j = 0; j < 3; j++){
        if(t[l[j]] === v) meus++;
        if(!t[l[j]]) vazios.push(l[j]);
      }
      if(meus === 2 && vazios.length) return vazios[0];
    }
    return null;
  }
  function fim(w){
    travado = true;
    if(w.linha) w.linha.forEach(function(i){ $id("tabuleiro").children[i].classList.add("ok") });
    $id("turno").textContent = w.v === "=" ? "Empate! Acordo" : "Venceu: " + w.v + (CPU ? (w.v === "Fechar" ? " Concluído" : " Computador") : " Concluído");
    Z.snd(w.v === "=" ? 300 : 900, 0.2, "triangle", 0.05);
  }
  $id("reinicia").addEventListener("click", novo);
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── MINESWEEPER ───────────────────────────────────────── */
export function minas({ nome, sub, rows, cols, bombs }) {
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="minas">Bomba ${bombs}</span>
  <span class="zchip" id="tempo">Tempo 0s</span>
</div>
<div class="zgrid" id="tabuleiro" style="grid-template-columns:repeat(${cols},1fr);max-width:${cols > 12 ? 560 : 440}px;margin:0 auto;gap:4px"></div>
<p class="dim center mt" style="font-size:12px">Botão direito (ou toque longo) para bandeiara Marcador</p>
<div class="row mt center" style="justify-content:center"><button class="zbtn" id="reinicia" type="button">Novo jogo</button></div>`;
  const js = `
(function(){
  var R = ${rows}, C = ${cols}, B = ${bombs};
  var g, started, over, seg, tick, abertas;
  var CORES = ["", "#29e0ff", "#7dff6a", "#ff5c5c", "#a78bfa", "#ffd166", "#ff4d8f", "#ffffff", "#97a0c4"];
  function $id(x){return document.getElementById(x)}
  function novo(){
    g = []; started = false; over = false; seg = 0; abertas = 0;
    clearInterval(tick);
    $id("tempo").textContent = "Tempo 0s";
    tick = setInterval(function(){ seg++; $id("tempo").textContent = "Tempo " + seg + "s" }, 1000);
    for(var r = 0; r < R; r++){ g.push([]); for(var c = 0; c < C; c++) g[r].push({m: 0, ab: 0, f: 0, n: 0}) }
    var box = $id("tabuleiro"); box.innerHTML = "";
    for(var r2 = 0; r2 < R; r2++) for(var c2 = 0; c2 < C; c2++){
      var b = document.createElement("button");
      b.className = "zopty";
      b.style.cssText = "min-height:38px;font-size:14px;padding:0";
      b.dataset.r = r2; b.dataset.c = c2;
      b.addEventListener("click", function(){ abrir(this) });
      b.addEventListener("contextmenu", function(e){ e.preventDefault(); bandeira(this) });
      var to = null;
      b.addEventListener("touchstart", function(){ to = setTimeout(function(){ bandeira(b) }, 450) }, {passive: true});
      b.addEventListener("touchend", function(){ clearTimeout(to) });
      box.appendChild(b);
    }
  }
  function cel(r, c){ return $id("tabuleiro").children[r*C + c] }
  function viz(r, c){
    var out = [];
    for(var dr = -1; dr <= 1; dr++) for(var dc = -1; dc <= 1; dc++){
      var rr = r + dr, cc = c + dc;
      if(rr >= 0 && rr < R && cc >= 0 && cc < C) out.push([rr, cc]);
    }
    return out;
  }
  function plantar(sr, sc){
    var p = 0;
    while(p < B){
      var r = Z.rnd(0, R-1), c = Z.rnd(0, C-1);
      if(r === sr && c === sc) continue;
      if(g[r][c].m) continue;
      g[r][c].m = 1; p++;
    }
    for(var r2 = 0; r2 < R; r2++) for(var c2 = 0; c2 < C; c2++){
      var n = 0;
      viz(r2, c2).forEach(function(v){ if(g[v[0]][v[1]].m) n++ });
      g[r2][c2].n = n;
    }
  }
  function abrir(b){
    if(over) return;
    var r = parseInt(b.dataset.r, 10), c = parseInt(b.dataset.c, 10);
    var cel2 = g[r][c];
    if(cel2.f || cel2.ab) return;
    if(!started){ started = true; plantar(r, c) }
    if(cel2.m){ perder(r, c); return }
    abrirTodas(r, c);
    checarVitoria();
  }
  function abrirTodas(r, c){
    var pilha = [[r, c]];
    while(pilha.length){
      var v = pilha.pop(), rr = v[0], cc = v[1];
      var cel2 = g[rr][cc];
      if(cel2.ab || cel2.f || cel2.m) continue;
      cel2.ab = 1; abertas++;
      var el = cel(rr, cc);
      el.classList.add("ok");
      el.style.color = "var(--z-text)";
      el.style.fontWeight = "700";
      if(cel2.n){
        el.textContent = cel2.n;
        el.style.color = CORES[cel2.n];
      }
      if(!cel2.n){
        viz(rr, cc).forEach(function(x){
          if(!g[x[0]][x[1]].ab && !g[x[0]][x[1]].m) pilha.push(x);
        });
      }
    }
    Z.snd(520, 0.03, "sine", 0.02);
  }
  function bandeira(b){
    if(over) return;
    var r = parseInt(b.dataset.r, 10), c = parseInt(b.dataset.c, 10);
    var cel2 = g[r][c];
    if(cel2.ab) return;
    cel2.f = cel2.f ? 0 : 1;
    b.textContent = cel2.f ? "Marcador" : "";
    Z.snd(cel2.f ? 700 : 300, 0.04, "sine");
  }
  function perder(r, c){
    over = true;
    clearInterval(tick);
    for(var r2 = 0; r2 < R; r2++) for(var c2 = 0; c2 < C; c2++){
      var el = cel(r2, c2);
      if(g[r2][c2].m){ el.textContent = "Bomba"; el.style.background = "rgba(255,92,92,0.25)" }
    }
    cel(r, c).style.background = "var(--z-red)";
    Z.snd(120, 0.4, "sawtooth", 0.06);
    Z.toast("Bum! Impacto", 1600);
  }
  function checarVitoria(){
    if(abertas === R*C - B){
      over = true;
      clearInterval(tick);
      Z.toast("Vitória Você venceu em " + seg + "s!", 3000);
      Z.snd(1040, 0.3, "triangle", 0.06);
    }
  }
  $id("reinicia").addEventListener("click", novo);
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── PONG ──────────────────────────────────────────────── */
export function pong({ nome, sub, neon }) {
  const corBola = neon ? "#29e0ff" : "#edf0ff";
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip">Você: <b class="acc" id="p1">0</b></span>
  <span class="zchip">CPU: <b id="p2" style="color:var(--z-red)">0</b></span>
</div>
<div style="max-width:460px;margin:0 auto;position:relative">
  <canvas class="zc" id="cv" width="400" height="300"></canvas>
  <div class="zmodal hidden" id="fim" style="position:absolute;inset:0;border-radius:16px">
    <div class="zbox"><h3 id="fimMsg">Fim!</h3><button class="zbtn" id="reinicia" type="button">Jogar de novo</button></div>
  </div>
</div>
<p class="dim center mt" style="font-size:12.5px">Mouse, toque ou W/S movem sua raquete. Primeiro a 5 pontos.</p>`;
  const js = `
(function(){
  var cv = document.getElementById("cv");
  var ctx = cv.getContext ? cv.getContext("2d") : null;
  if(!ctx){ cv.outerHTML = "<p class='dim center'>Seu navegador não suporta canvas.</p>"; return; }
  var W = 400, H = 300, PA = 56;
  var p1 = 0, p2 = 0, over = false;
  var pa = {y: H/2}, pb = {y: H/2}, bola, serve, dirY = -1;
  function servir(){
    bola = {x: W/2, y: H/2, vx: 4.2 * (Math.random() < 0.5 ? 1 : -1), vy: (Math.random()*4 - 2)};
  }
  function novo(){
    p1 = 0; p2 = 0; over = false;
    pa.y = H/2; pb.y = H/2;
    document.getElementById("fim").classList.add("hidden");
    hud(); servir();
    requestAnimationFrame(loop);
  }
  function hud(){
    document.getElementById("p1").textContent = p1;
    document.getElementById("p2").textContent = p2;
  }
  var alvoY = H/2;
  cv.addEventListener("mousemove", function(e){
    var r = cv.getBoundingClientRect();
    alvoY = (e.clientY - r.top) * (H / r.height);
  });
  cv.addEventListener("touchmove", function(e){
    var r = cv.getBoundingClientRect();
    alvoY = (e.touches[0].clientY - r.top) * (H / r.height);
  }, {passive: true});
  Z.onKey({w: function(){ alvoY -= 24 }, s: function(){ alvoY += 24 }});
  function fimJogo(msg){
    over = true;
    document.getElementById("fimMsg").textContent = msg;
    document.getElementById("fim").classList.remove("hidden");
    Z.snd(msg.indexOf("Você") === 0 ? 1000 : 160, 0.4, "triangle", 0.06);
  }
  function loop(){
    if(over) return;
    pa.y = Math.max(PA/2, Math.min(H - PA/2, pa.y + (alvoY - pa.y) * 0.25));
    var alvo = bola.y;
    if(Math.abs(bola.y - pb.y) > 6) pb.y += (bola.y > pb.y ? 1 : -1) * 3.6;
    pb.y = Math.max(PA/2, Math.min(H - PA/2, pb.y));
    bola.x += bola.vx; bola.y += bola.vy;
    if(bola.y < 8 || bola.y > H - 8) bola.vy *= -1;
    if(bola.x < 18 + 6 && Math.abs(bola.y - pa.y) < PA/2 + 8 && bola.vx < 0){
      bola.vx *= -1.05;
      bola.vy += (bola.y - pa.y) * 0.08;
      Z.snd(660, 0.04, "sine");
    }
    if(bola.x > W - 18 - 6 && Math.abs(bola.y - pb.y) < PA/2 + 8 && bola.vx > 0){
      bola.vx *= -1.05;
      bola.vy += (bola.y - pb.y) * 0.08;
      Z.snd(440, 0.04, "sine");
    }
    if(bola.x < -20){ p2++; hud(); Z.snd(200, 0.15, "sawtooth", 0.04); if(p2 >= 5) return fimJogo("CPU venceu! Computador"); servir() }
    if(bola.x > W + 20){ p1++; hud(); Z.snd(800, 0.1, "sine"); if(p1 >= 5) return fimJogo("Você venceu! Concluído"); servir() }
    desenha();
    requestAnimationFrame(loop);
  }
  function desenha(){
    ctx.fillStyle = "#0a0d1a"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(148,158,210,0.25)"; ctx.setLineDash([8, 10]);
    ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "${corBola}";
    ctx.beginPath(); ctx.arc(bola.x, bola.y, 7, 0, 7); ctx.fill();
    ctx.fillStyle = "#7dff6a";
    ctx.beginPath(); ctx.roundRect(12, pa.y - PA/2, 8, PA, 4); ctx.fill();
    ctx.fillStyle = "#ff5c5c";
    ctx.beginPath(); ctx.roundRect(W - 20, pb.y - PA/2, 8, PA, 4); ctx.fill();
  }
  document.getElementById("reinicia").addEventListener("click", novo);
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── SIMON ─────────────────────────────────────────────── */
export function simon({ nome, sub, turbo }) {
  const body = `
<div class="zcard pad center" style="max-width:420px;margin:0 auto">
  <div class="row between mb" style="justify-content:space-between">
    <span class="zchip" id="fase">Fase 1</span>
    <span class="zchip" id="best">Recorde: 0</span>
  </div>
  <p class="dim mb" id="status">Toque em iniciar</p>
  <div class="zgrid" style="grid-template-columns:repeat(2,1fr);gap:12px">
    <button class="zopty" data-i="0" style="min-height:130px;background:#123c2b;border-color:#1f5c40;font-size:30px" id="q0">Folha</button>
    <button class="zopty" data-i="1" style="min-height:130px;background:#4a1020;border-color:#7c1f3a;font-size:30px" id="q1">Flor</button>
    <button class="zopty" data-i="2" style="min-height:130px;background:#101f4a;border-color:#1f3a7c;font-size:30px" id="q2">Mirtilo</button>
    <button class="zopty" data-i="3" style="min-height:130px;background:#4a3d10;border-color:#7c6a1f;font-size:30px" id="q3">Girassol</button>
  </div>
  <div class="row mt" style="justify-content:center">
    <button class="zbtn" id="inicio" type="button">Iniciar</button>
  </div>
</div>`;
  const js = `
(function(){
  var FREQ = [392, 494, 587, 784];
  var LUM = ["#1f5c40", "#7c1f3a", "#1f3a7c", "#7c6a1f"];
  var seq = [], pos = 0, show = false, best = Z.store.best("simon", 0);
  var $id = function(x){return document.getElementById(x)};
  document.getElementById("best").textContent = "Recorde: " + best;
  function acender(i){
    var b = document.getElementById("q" + i);
    b.style.boxShadow = "0 0 26px 6px " + LUM[i];
    b.style.transform = "scale(1.04)";
  }
  function apagar(i){
    var b = document.getElementById("q" + i);
    b.style.boxShadow = "";
    b.style.transform = "";
  }
  function tocar(i){
    Z.snd(FREQ[i], ${turbo ? "0.35" : "0.5"}, "sine", 0.06);
  }
  function playSeq(){
    show = false;
    $id("status").textContent = "Observe a sequência...";
    var passo = ${turbo ? "420" : "600"};
    for(var k = 0; k < seq.length; k++){
      (function(k2){
        setTimeout(function(){
          acender(seq[k2]); tocar(seq[k2]);
          setTimeout(function(){ apagar(seq[k2]) }, passo * 0.6);
        }, 500 + k2 * passo);
      })(k);
    }
    setTimeout(function(){
      show = true; pos = 0;
      $id("status").textContent = "Sua vez! Repita a sequência.";
    }, 500 + seq.length * passo);
  }
  function proxima(){
    seq.push(Z.rnd(0, 3));
    $id("fase").textContent = "Fase " + seq.length;
    playSeq();
  }
  Array.prototype.slice.call(document.querySelectorAll(".zopty")).forEach(function(b){
    b.addEventListener("click", function(){
      if(!show) return;
      var i = parseInt(this.dataset.i, 10);
      acender(i); tocar(i);
      setTimeout(function(){ apagar(i) }, 200);
      if(i !== seq[pos]){
        Z.snd(120, 0.5, "sawtooth", 0.06);
        $id("status").textContent = "Errado! Você chegou à fase " + pos + ".";
        show = false;
        return;
      }
      pos++;
      if(pos === seq.length){
        $id("status").textContent = "Muito bem!";
        show = false;
        if(seq.length > best){ best = seq.length; Z.store.setBest("simon", best); document.getElementById("best").textContent = "Recorde: " + best }
        setTimeout(proxima, 900);
      }
    });
  });
  $id("inicio").addEventListener("click", function(){
    seq = [];
    proxima();
  });
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── REFLEXOS (3 modos) ────────────────────────────────── */
export function reflexos({ nome, sub, modo }) {
  const body = `
<div class="zcard pad center" style="max-width:520px;margin:0 auto">
  <div class="row mb" style="justify-content:center;gap:8px">
    <span class="zchip" id="tent">Tentativa 1</span>
    <span class="zchip" id="best">Recorde: —</span>
  </div>
  <div id="arena" style="height:280px;border-radius:16px;display:grid;place-items:center;background:#123c2b;cursor:pointer;font-family:var(--z-fd);font-size:26px;font-weight:700">
    Toque para começar
  </div>
  <p class="dim mt" id="status">Espere o verde e clique o mais rápido possível.</p>
</div>`;
  const js = `
(function(){
  var MODO = ${JSON.stringify(modo)};
  var arena = document.getElementById("arena");
  var estado = "idle", startT = 0, timer = null, tent = 0;
  var best = 0;
  function $id(x){return document.getElementById(x)}
  function recTxt(){
    if(!best) return "Recorde: —";
    return MODO === "pare" ? "Recorde: " + best + "px do centro" : "Recorde: " + best + " ms";
  }
  function pararArena(){
    estado = "done";
    clearTimeout(timer);
    arena.style.background = "var(--z-surface2)";
  }
  if(MODO === "tempo" || MODO === "turbo"){
    arena.addEventListener("click", function(){
      if(estado === "idle" || estado === "done"){
        tent++;
        $id("tent").textContent = "Tentativa " + tent;
        estado = "wait";
        arena.style.background = "#4a1020";
        arena.textContent = "Aguarde o verde...";
        var delay = ${modo === "turbo" ? 500 : 800} + Z.rnd(0, ${modo === "turbo" ? 1800 : 2600});
        timer = setTimeout(function(){
          estado = "go";
          startT = performance.now();
          arena.style.background = "#123c2b";
          arena.style.boxShadow = "0 0 40px #1f5c40";
          arena.textContent = "CLIQUE!";
        }, delay);
      } else if(estado === "wait"){
        Z.snd(150, 0.25, "sawtooth", 0.05);
        pararArena();
        arena.textContent = "Antes da hora! Tensão";
        $id("status").textContent = "Você clicou cedo. Toque para tentar de novo.";
      } else if(estado === "go"){
        var ms = Math.round(performance.now() - startT);
        pararArena();
        arena.style.boxShadow = "";
        arena.textContent = ms + " ms";
        $id("status").textContent = ms < 250 ? "Nave Reflexo de super-herói!" : ms < 400 ? "Energia Muito rápido!" : "Neutro Bom! Toque para tentar de novo.";
        Z.snd(900, 0.1, "sine");
        if(!best || ms < best){ best = ms; Z.store.setBest("ref-" + MODO, best); $id("best").textContent = recTxt() }
      }
    });
  } else if(MODO === "pare"){
    var LARG = Math.max(arena.clientWidth, 300);
    var x = 0, dir = 1, vel = 3.4, running = false, raf = null;
    var barra = document.createElement("div");
    barra.style.cssText = "position:absolute;top:0;width:10px;height:100%;background:var(--z-acc);border-radius:6px";
    var alvo = document.createElement("div");
    alvo.style.cssText = "position:absolute;left:" + (LARG/2 - 14) + "px;top:0;width:28px;height:100%;background:rgba(255,255,255,0.25);border-radius:6px";
    arena.style.cssText = "position:relative;overflow:hidden;display:block;background:var(--z-surface2)";
    arena.textContent = "";
    arena.appendChild(alvo); arena.appendChild(barra);
    function loop(){
      if(!running) return;
      x += dir * vel;
      if(x >= LARG || x <= 0) dir *= -1;
      barra.style.left = x + "px";
      raf = requestAnimationFrame(loop);
    }
    arena.addEventListener("click", function(){
      if(!running){
        tent++;
        $id("tent").textContent = "Tentativa " + tent;
        x = 0; dir = 1; vel = 3.2 + tent * 0.35;
        running = true;
        $id("status").textContent = "Pare a barra no centro branco!";
        raf = requestAnimationFrame(loop);
      } else {
        running = false;
        cancelAnimationFrame(raf);
        var dist = Math.abs(x + 5 - LARG/2);
        var d = Math.round(dist);
        $id("status").textContent = "Distância do centro: " + d + "px. Toque para tentar de novo.";
        Z.snd(700, 0.08, "sine");
        if(!best || d < best){ best = d; Z.store.setBest("ref-pace", best); $id("best").textContent = recTxt() }
      }
    });
  } else {
    // cor: clique na cor mostrada (30s)
    var CORES = [["Vermelho", "#ff5c5c"], ["Azul", "#29e0ff"], ["Verde", "#7dff6a"], ["Amarelo", "#ffd166"], ["Roxo", "#a78bfa"], ["Laranja", "#ffb347"]];
    var pontos = 0, fim30 = false;
    var botoes = "";
    arena.innerHTML = "";
    var caixa = document.createElement("div");
    caixa.style.cssText = "display:grid;grid-template-columns:repeat(2,1fr);gap:10px;width:100%;height:100%;align-content:center";
    arena.appendChild(caixa);
    var nomeAtual = "";
    function novaCor(){
      var c = CORES[Z.rnd(0, CORES.length - 1)];
      nomeAtual = c[0];
      arena.style.background = c[1];
      caixa.style.display = "none";
      setTimeout(function(){
        if(fim30) return;
        arena.style.background = "var(--z-surface2)";
        caixa.innerHTML = "";
        caixa.style.display = "grid";
        Z.shuffle(CORES).forEach(function(cc){
          var b = document.createElement("button");
          b.className = "zopty";
          b.style.padding = "10px";
          b.textContent = cc[0];
          b.addEventListener("click", function(){
            if(fim30) return;
            if(cc[0] === nomeAtual){ pontos++; Z.snd(850, 0.05, "sine"); }
            else Z.snd(160, 0.12, "sawtooth", 0.04);
            $id("tent").textContent = "Pontos: " + pontos;
            novaCor();
          });
          caixa.appendChild(b);
        });
      }, 900);
    }
    var tick30 = 30;
    var t30 = setInterval(function(){
      tick30--;
      $id("status").textContent = "Tempo: " + Math.max(tick30, 0) + "s";
      if(tick30 <= 0){
        fim30 = true;
        clearInterval(t30);
        Z.snd(1000, 0.3, "triangle", 0.06);
        if(pontos > best){ best = pontos; Z.store.setBest("ref-cor", best) }
      }
    }, 1000);
    $id("status").textContent = "Memorize a cor e clique no nome dela! 30 segundos.";
    novaCor();
  }
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── CAÇA-MORCEGOS ─────────────────────────────────────── */
export function cacador({ nome, sub, emoji, turbo }) {
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="score">Pontos: 0</span>
  <span class="zchip" id="tempo">Tempo 30s</span>
  <span class="zchip" id="best">Recorde: 0</span>
</div>
<div class="zgrid" id="buracos" style="grid-template-columns:repeat(3,1fr);max-width:420px;margin:0 auto;gap:12px"></div>`;
  const js = `
(function(){
  var EMO = ${JSON.stringify(emoji)};
  var TURBO = ${turbo ? "true" : "false"};
  var score = 0, tempo = 30, over = false, best = Z.store.best("cac-" + ${JSON.stringify(nome)}, 0);
  document.getElementById("best").textContent = "Recorde: " + best;
  var box = document.getElementById("buracos");
  var buracos = [];
  function $id(x){return document.getElementById(x)}
  for(var i = 0; i < 9; i++){
    var b = document.createElement("button");
    b.className = "zopty";
    b.style.cssText = "min-height:110px;justify-content:center;font-size:44px;overflow:hidden;padding:6px";
    b.textContent = "";
    (function(b2){
      b2.addEventListener("click", function(){
        if(over) return;
        if(b2.dataset.mole === "1"){
          b2.dataset.mole = "0";
          b2.textContent = "";
          score++;
          document.getElementById("score").textContent = "Pontos: " + score;
          Z.snd(760, 0.05, "sine");
        }
      });
    })(b);
    box.appendChild(b);
    buracos.push(b);
  }
  function pop(){
    if(over) return;
    var livre = buracos.filter(function(b){ return b.dataset.mole !== "1" });
    if(livre.length){
      var b = livre[Z.rnd(0, livre.length - 1)];
      b.dataset.mole = "1";
      b.textContent = EMO;
      Z.snd(400, 0.04, "sine", 0.02);
      var dur = (TURBO ? 550 : 850) - Math.min(score * ${turbo ? 18 : 10}, 350);
      setTimeout(function(){
        if(b.dataset.mole === "1"){ b.dataset.mole = "0"; b.textContent = "" }
      }, Math.max(400, dur));
    }
    setTimeout(pop, Z.rnd(350, 700));
  }
  var tick = setInterval(function(){
    tempo--;
    document.getElementById("tempo").textContent = "Tempo " + tempo + "s";
    if(tempo <= 0){
      over = true;
      clearInterval(tick);
      if(score > best){ best = score; Z.store.setBest("cac-" + ${JSON.stringify(nome)}, best); document.getElementById("best").textContent = "Recorde: " + best }
      Z.toast("Fim! Você fez " + score + " pontos.", 3000);
      Z.snd(900, 0.3, "triangle", 0.06);
    }
  }, 1000);
  pop();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── FORCA ─────────────────────────────────────────────── */
export function forca({ nome, sub, palavras }) {
  const body = `
<div class="row" style="justify-content:center;gap:20px;flex-wrap:wrap">
  <div class="zcard pad center" style="min-width:220px">
    <div id="boneco" style="font-size:52px;min-height:120px;display:grid;place-items:center">Madeira</div>
    <p class="dim" id="erros">Erros: 0/6</p>
  </div>
  <div class="zcard pad" style="flex:1;min-width:260px;max-width:420px">
    <div class="row wrap mb" style="justify-content:center;gap:8px;font-size:30px;font-family:var(--z-fd);font-weight:700;letter-spacing:.2em" id="palavra"></div>
    <div class="zgrid" id="teclado" style="grid-template-columns:repeat(6,1fr);gap:6px"></div>
    <div class="row mt" style="justify-content:center"><button class="zbtn sm" id="nova" type="button">Nova palavra</button></div>
  </div>
</div>
<p class="dim center mt" style="font-size:12.5px">Digite as letras no teclado ou clique nos botões.</p>`;
  const js = `
(function(){
  var PAL = ${JSON.stringify(palavras)};

  var STAGE = ["Madeira", "Madeira", "⭕", "⭕", "BraçoPerna", "⭕PernaPé", "Derrota"];
  var ABECEDARIO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  var palavra, reveladas, erros, fim;
  var $id = function(x){return document.getElementById(x)};
  function norm(s){ return s.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase() }
  function novo(){
    palavra = norm(PAL[Z.rnd(0, PAL.length - 1)]);
    reveladas = {}; erros = 0; fim = false;
    $id("erros").textContent = "Erros: 0/6";
    $id("boneco").textContent = STAGE[0];
    $id("boneco").style.color = "var(--z-text)";
    pintar();
    Z.toast("Palavra de " + palavra.length + " letras ", 2200);
  }
  function pintar(){
    var box = $id("palavra"); box.innerHTML = "";
    for(var i = 0; i < palavra.length; i++){
      var s = document.createElement("span");
      s.style.cssText = "min-width:26px;border-bottom:3px solid var(--z-acc);text-align:center";
      s.textContent = reveladas[palavra[i]] ? palavra[i].toUpperCase() : "";
      box.appendChild(s);
    }
  }
  function letra(l){
    if(fim || reveladas[l]) return;
    l = norm(l);
    if(palavra.indexOf(l) >= 0){
      reveladas[l] = true;
      Z.snd(760, 0.05, "sine");
      pintar();
      $id("teclado").children[ABECEDARIO.indexOf(l.toUpperCase())].classList.add("ok");
      var completa = true;
      for(var i = 0; i < palavra.length; i++) if(!reveladas[palavra[i]]) completa = false;
      if(completa) ganhar();
    } else {
      erros++;
      Z.snd(180, 0.15, "sawtooth", 0.04);
      $id("erros").textContent = "Erros: " + erros + "/6";
      $id("boneco").textContent = STAGE[erros];
      $id("teclado").children[ABECEDARIO.indexOf(l.toUpperCase())].classList.add("err");
      if(erros >= 6) perder();
    }
  }
  function ganhar(){
    fim = true;
    $id("boneco").textContent = "Concluído";
    $id("boneco").style.color = "var(--z-lime)";
    Z.toast("Você ganhou! " + palavra, 3500);
    Z.snd(1040, 0.3, "triangle", 0.06);
  }
  function perder(){
    fim = true;
    $id("boneco").textContent = "Derrota";
    $id("boneco").style.color = "var(--z-red)";
    Z.toast("Era: " + palavra, 3500);
    Z.snd(120, 0.5, "sawtooth", 0.06);
  }
  var tel = $id("teclado");
  ABECEDARIO.forEach(function(l){
    var b = document.createElement("button");
    b.className = "zopty";
    b.style.cssText = "justify-content:center;padding:9px;font-family:var(--z-fm)";
    b.textContent = l;
    b.addEventListener("click", function(){ letra(l) });
    tel.appendChild(b);
  });
  document.addEventListener("keydown", function(e){
    var l = e.key.toUpperCase();
    if(ABECEDARIO.indexOf(l) >= 0) letra(l);
  });
  $id("nova").addEventListener("click", novo);
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── ADIVINHE O NÚMERO ─────────────────────────────────── */
export function adivinhe({ nome, sub, max }) {
  const body = `
<div class="zcard pad center" style="max-width:460px;margin:0 auto">
  <div class="row between mb" style="justify-content:space-between">
    <span class="zchip" id="tent">Tentativas: 0</span>
    <span class="zchip" id="best">Recorde: —</span>
  </div>
  <h3 class="dim mb" id="dica">Pensei em um número entre 1 e ${max}...</h3>
  <div class="row" style="max-width:320px;margin:0 auto">
    <input class="zinput" id="campo" type="number" min="1" max="${max}" placeholder="seu palpite">
    <button class="zbtn" id="ok" type="button">Chutar</button>
  </div>
  <p class="acc mt fd" id="resposta" style="font-size:19px;min-height:28px"></p>
</div>`;
  const js = `
(function(){
  var MAX = ${max};
  var alvo, tent = 0, best = Z.store.best("adv-" + MAX, 0);
  function $id(x){return document.getElementById(x)}
  if(best) document.getElementById("best").textContent = "Recorde: " + best + " tentativas";
  function novo(){
    alvo = Z.rnd(1, MAX);
    tent = 0;
    $id("tent").textContent = "Tentativas: 0";
    $id("resposta").textContent = "";
    $id("campo").value = "";
    $id("campo").disabled = false;
    $id("ok").disabled = false;
    $id("campo").focus();
  }
  function chutar(){
    var v = parseInt($id("campo").value, 10);
    if(isNaN(v) || v < 1 || v > MAX){ Z.toast("Número entre 1 e " + MAX); return }
    tent++;
    $id("tent").textContent = "Tentativas: " + tent;
    if(v === alvo){
      $id("resposta").textContent = "Concluído Acertou em " + tent + " tentativa(s)!";
      $id("campo").disabled = true; $id("ok").disabled = true;
      Z.snd(1040, 0.25, "triangle", 0.06);
      if(!best || tent < best){ best = tent; Z.store.setBest("adv-" + MAX, best); document.getElementById("best").textContent = "Recorde: " + best + " tentativas" }
    } else {
      $id("resposta").textContent = v < alvo ? "Alta É maior que " + v : "Baixa É menor que " + v;
      Z.snd(v < alvo ? 660 : 330, 0.06, "sine");
    }
    $id("campo").value = "";
  }
  $id("ok").addEventListener("click", chutar);
  $id("campo").addEventListener("keydown", function(e){ if(e.key === "Enter") chutar() });
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── SUDOKU ────────────────────────────────────────────── */
export function sudoku({ nome, sub, n, buracos }) {
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="tempo">Tempo 0s</span>
  <span class="zchip" id="faltam">Faltam: 0</span>
</div>
<div class="zgrid" id="tabuleiro" style="grid-template-columns:repeat(${n},1fr);max-width:460px;margin:0 auto;gap:5px"></div>
<div class="zgrid mt" id="pad" style="grid-template-columns:repeat(5,1fr);max-width:460px;margin:0 auto;gap:5px"></div>
<div class="row mt center" style="justify-content:center;gap:10px">
  <button class="zbtn ghost sm" id="dica" type="button">Ideia Dica</button>
  <button class="zbtn sm" id="nova" type="button">Novo jogo</button>
</div>`;
  const js = `
(function(){
  var N = ${n}, BURACOS = ${buracos};
  var sol = [], jogo = [], sel = -1, t0 = 0, tick = null;
  function $id(x){return document.getElementById(x)}
  function idx(r, c){ return r*N + c }
  function mesmaCaixa(r1, c1, r2, c2){
    var bx = ${n === 4 ? "2" : n === 6 ? "3" : "3"}, by = ${n === 4 ? "2" : n === 6 ? "2" : "3"};
    return Math.floor(r1/bx) === Math.floor(r2/bx) && Math.floor(c1/by) === Math.floor(c2/by);
  }
  function okV(r, c, v){
    for(var i = 0; i < N; i++){
      if(jogo[idx(r, i)] === v && i !== c) return false;
      if(jogo[idx(i, c)] === v && i !== r) return false;
    }
    var bx = ${n === 4 ? "2" : "3"}, by = ${n === 4 ? "2" : "3"};
    for(var dr = -1; dr <= 1; dr++) for(var dc = -1; dc <= 1; dc++){
      var rr = Math.floor(r/bx)*bx + dr, cc = Math.floor(c/by)*by + dc;
      if(rr >= 0 && rr < N && cc >= 0 && cc < N && (rr !== r || cc !== c) && jogo[idx(rr, cc)] === v) return false;
    }
    return true;
  }
  function preencher(p){
    var vazio = -1;
    for(var i = 0; i < p.length; i++) if(!p[i]){ vazio = i; break }
    if(vazio < 0) return true;
    var r = Math.floor(vazio / N), c = vazio % N;
    var nums = Z.shuffle([1,2,3,4,5,6,7,8,9].slice(0, N));
    for(var k = 0; k < nums.length; k++){
      p[vazio] = nums[k];
      if(preencher(p)) return true;
      p[vazio] = 0;
    }
    return false;
  }
  function novo(){
    jogo = []; for(var i = 0; i < N*N; i++) jogo.push(0);
    if(!preencher(jogo)) return;
    sol = jogo.slice();
    var celulas = Z.shuffle(jogo.map(function(_, i){ return i }));
    var f = 0;
    for(var k = 0; k < celulas.length && f < BURACOS; k++){
      jogo[celulas[k]] = 0; f++;
    }
    sel = -1;
    clearInterval(tick);
    t0 = Date.now();
    tick = setInterval(function(){
      document.getElementById("tempo").textContent = "Tempo " + Math.floor((Date.now() - t0) / 1000) + "s";
    }, 1000);
    render();
  }
  function conflitos(){
    var conj = {};
    for(var r = 0; r < N; r++) for(var c = 0; c < N; c++){
      var v = jogo[idx(r, c)];
      if(!v) continue;
      for(var i = 0; i < N; i++){
        if(i !== c && jogo[idx(r, i)] === v) conj[idx(r, c)] = true;
        if(i !== r && jogo[idx(i, c)] === v) conj[idx(r, c)] = true;
      }
    }
    return conj;
  }
  function render(){
    var t = $id("tabuleiro"); t.innerHTML = "";
    var conf = conflitos();
    for(var i = 0; i < N*N; i++){
      var r = Math.floor(i / N), c = i % N;
      var b = document.createElement("button");
      b.className = "zopty";
      b.style.cssText = "justify-content:center;padding:0;min-height:44px;font-family:var(--z-fd);font-weight:700;font-size:19px";
      b.textContent = jogo[i] || "";
      if(conf[i]) b.classList.add("err");
      if(i === sel) b.style.borderColor = "var(--z-acc)";
      b.addEventListener("click", function(){ sel = i; render() });
      t.appendChild(b);
    }
    var faltam = 0;
    for(var j = 0; j < N*N; j++) if(!jogo[j]) faltam++;
    $id("faltam").textContent = "Faltam: " + faltam;
    if(faltam === 0) vencer();
  }
  function vencer(){
    clearInterval(tick);
    var ok = jogo.join(",") === sol.join(",");
    Z.toast(ok ? "Vitória Resolvido em " + Math.floor((Date.now() - t0) / 1000) + "s!" : "Confira as células vermelhas!", 3500);
  }
  function pad(){
    var box = $id("pad"); box.innerHTML = "";
    for(var v = 1; v <= N; v++){
      var b = document.createElement("button");
      b.className = "zbtn sm";
      b.textContent = v;
      b.addEventListener("click", function(){
        if(sel < 0) return;
        var r = Math.floor(sel / N), c = sel % N;
        if(jogo[sel] === v){ jogo[sel] = 0 }
        else if(okV(r, c, v)){ jogo[sel] = v; Z.snd(700, 0.04, "sine") }
        else { Z.snd(200, 0.08, "sawtooth", 0.03); Z.toast("Conflito!") }
        render();
      });
      box.appendChild(b);
    }
    var ap = document.createElement("button");
    ap.className = "zbtn sm ghost"; ap.textContent = "Fechar";
    ap.addEventListener("click", function(){ if(sel >= 0) jogo[sel] = 0; render() });
    box.appendChild(ap);
  }
  $id("dica").addEventListener("click", function(){
    var vazios = [];
    for(var i = 0; i < N*N; i++) if(!jogo[i]) vazios.push(i);
    if(!vazios.length){ Z.toast("Tabuleiro cheio"); return }
    var i = vazios[Z.rnd(0, vazios.length - 1)];
    jogo[i] = sol[i];
    Z.toast("Dica revelada Ideia", 1500);
    render();
  });
  $id("nova").addEventListener("click", novo);
  pad();
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── JOGO DO 15 ────────────────────────────────────────── */
export function quinze({ nome, sub, n }) {
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="moves">Movimentos: 0</span>
  <span class="zchip" id="best">Recorde: —</span>
</div>
<div class="zgrid" id="tabuleiro" style="grid-template-columns:repeat(${n},1fr);max-width:400px;margin:0 auto;gap:8px"></div>
<div class="row mt center" style="justify-content:center"><button class="zbtn" id="nova" type="button">Embaralhar</button></div>`;
  const js = `
(function(){
  var N = ${n}, TOTAL = N * N;
  var t, blank, moves, best = Z.store.best("15-" + N, 0);
  function $id(x){return document.getElementById(x)}
  if(best) document.getElementById("best").textContent = "Recorde: " + best + " mov.";
  function embaralhar(){
    t = [];
    for(var i = 1; i < TOTAL; i++) t.push(i);
    t.push(0);
    blank = TOTAL - 1;
    for(var k = 0; k < 300; k++){
      var v = vizinhos(blank);
      var i2 = v[Z.rnd(0, v.length - 1)];
      t[blank] = t[i2]; t[i2] = 0;
      blank = i2;
    }
    moves = 0;
    render();
  }
  function vizinhos(i){
    var r = Math.floor(i / N), c = i % N, out = [];
    if(r > 0) out.push(i - N);
    if(r < N - 1) out.push(i + N);
    if(c > 0) out.push(i - 1);
    if(c < N - 1) out.push(i + 1);
    return out;
  }
  function render(){
    var box = $id("tabuleiro"); box.innerHTML = "";
    t.forEach(function(v, i){
      var b = document.createElement("button");
      b.className = v === 0 ? "zopty" : "zbtn";
      b.style.cssText = "min-height:72px;justify-content:center;font-family:var(--z-fd);font-size:26px";
      b.textContent = v || "";
      if(v === 0) b.style.visibility = "hidden";
      b.addEventListener("click", function(){
        if(Math.abs(Math.floor(i / N) - Math.floor(blank / N)) + Math.abs(i % N - blank % N) === 1){
          t[blank] = t[i]; t[i] = 0;
          blank = i;
          moves++;
          document.getElementById("moves").textContent = "Movimentos: " + moves;
          Z.snd(600, 0.04, "sine");
          render();
          checar();
        }
      });
      box.appendChild(b);
    });
  }
  function checar(){
    for(var i = 0; i < TOTAL - 1; i++) if(t[i] !== i + 1) return;
    Z.toast("Vitória Resolvido em " + moves + " movimentos!", 3500);
    Z.snd(1040, 0.3, "triangle", 0.06);
    if(!best || moves < best){ best = moves; Z.store.setBest("15-" + N, best); document.getElementById("best").textContent = "Recorde: " + best + " mov." }
  }
  $id("nova").addEventListener("click", embaralhar);
  embaralhar();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── ASTEROIDES ────────────────────────────────────────── */
export function asteroides({ nome, sub, neon }) {
  const cor = neon ? "#29e0ff" : "#7dff6a";
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="score">Pontos: 0</span>
  <span class="zchip" id="vidas">Vermelho 3</span>
</div>
<div style="max-width:400px;margin:0 auto;position:relative">
  <canvas class="zc" id="cv" width="360" height="440"></canvas>
  <div class="zmodal hidden" id="fim" style="position:absolute;inset:0;border-radius:16px">
    <div class="zbox"><h3>Fim de jogo</h3><p>Pontuação: <b class="acc" id="fimScore">0</b></p><button class="zbtn" id="reinicia" type="button">Jogar de novo</button></div>
  </div>
</div>
<p class="dim center mt" style="font-size:12.5px">← → gira · ↑ ou espaço empurra/atira</p>`;
  const js = `
(function(){
  var cv = document.getElementById("cv");
  var ctx = cv.getContext ? cv.getContext("2d") : null;
  if(!ctx){ cv.outerHTML = "<p class='dim nav'>Seu navegador não suporta canvas.</p>"; return; }
  var W = 360, H = 440;
  var nav, asts, tiros, score, vidas, over, teclas = {};
  function novo(){
    nav = {x: W/2, y: H - 70, a: -Math.PI/2, vx: 0, vy: 0};
    asts = []; tiros = []; score = 0; vidas = 3; over = false;
    document.getElementById("fim").classList.add("hidden");
    spawn(); spawn();
    hud();
    requestAnimationFrame(loop);
  }
  function spawn(){
    var ang = Math.random() * 6.28;
    asts.push({
      x: Math.random() * W, y: Math.random() < 0.5 ? -30 : H + 30,
      vx: Math.cos(ang) * (0.6 + Math.random()), vy: Math.sin(ang) * (0.6 + Math.random()),
      r: 24, g: 0
    });
  }
  function hud(){
    document.getElementById("score").textContent = "Pontos: " + score;
    document.getElementById("vidas").textContent = "Vermelho " + vidas;
  }
  Z.onKey({ArrowUp: function(){ teclas.up = true }, ArrowDown: function(){ teclas.down = false }, ArrowLeft: function(){ teclas.l = true }, ArrowRight: function(){ teclas.r = true }, " ": function(){ teclas.fire = true }});
  document.addEventListener("keyup", function(e){
    if(e.key === "ArrowUp") teclas.up = false;
    if(e.key === "ArrowLeft") teclas.l = false;
    if(e.key === "ArrowRight") teclas.r = false;
    if(e.key === " ") teclas.fire = false;
  });
  function perderVida(){
    vidas--;
    Z.snd(140, 0.3, "sawtooth", 0.06);
    if(vidas <= 0) fim();
    else {
      nav = {x: W/2, y: H - 70, a: -Math.PI/2, vx: 0, vy: 0};
      hud();
    }
  }
  function fim(){
    over = true;
    document.getElementById("fimScore").textContent = score;
    document.getElementById("fim").classList.remove("hidden");
  }
  function loop(){
    if(over) return;
    if(teclas.l) nav.a -= 0.07;
    if(teclas.r) nav.a += 0.07;
    if(teclas.up){ nav.vx += Math.cos(nav.a) * 0.12; nav.vy += Math.sin(nav.a) * 0.12 }
    if(teclas.fire && tiros.length < 4){
      tiros.push({x: nav.x, y: nav.y, vx: Math.cos(nav.a) * 6 + nav.vx, vy: Math.sin(nav.a) * 6 + nav.vy, v: 80});
      Z.snd(900, 0.03, "sine", 0.02);
      teclas.fire = false;
    }
    nav.vx *= 0.985; nav.vy *= 0.985;
    nav.x = (nav.x + nav.vx + W) % W;
    nav.y = (nav.y + nav.vy + H) % H;
    asts.forEach(function(a){ a.x = (a.x + a.vx + W) % W; a.y = (a.y + a.vy + H) % H });
    for(var i = tiros.length - 1; i >= 0; i--){
      var t = tiros[i];
      t.x = (t.x + t.vx + W) % W; t.y = (t.y + t.vy + H) % H;
      t.v--;
      if(t.v <= 0){ tiros.splice(i, 1); continue }
      for(var j = asts.length - 1; j >= 0; j--){
        var a = asts[j];
        if(Math.hypot(t.x - a.x, t.y - a.y) < a.r){
          asts.splice(j, 1);
          tiros.splice(i, 1);
          score += a.r > 18 ? 20 : 50;
          Z.snd(500, 0.08, "square", 0.03);
          if(a.r > 18){
            for(var k = 0; k < 2; k++){
              var ang = Math.random() * 6.28;
              asts.push({x: a.x, y: a.y, vx: Math.cos(ang) * 1.6, vy: Math.sin(ang) * 1.6, r: 13, g: 1});
            }
          } else if(asts.length < 5 + Math.floor(score / 100)) spawn();
          hud();
          break;
        }
      }
    }
    for(var j2 = asts.length - 1; j2 >= 0; j2--){
      var a2 = asts[j2];
      if(Math.hypot(nav.x - a2.x, nav.y - a2.y) < a2.r + 8){
        asts.splice(j2, 1);
        perderVida();
        if(asts.length < 3) spawn();
      }
    }
    desenha();
    requestAnimationFrame(loop);
  }
  function desenha(){
    ctx.fillStyle = "#0a0d1a"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "${cor}";
    ctx.lineWidth = 2;
    asts.forEach(function(a){
      ctx.beginPath();
      for(var k = 0; k <= 8; k++){
        var ang = k / 8 * 6.28;
        var rr = a.r * (0.8 + Math.sin(k * 3.7) * 0.18);
        var px = a.x + Math.cos(ang) * rr, py = a.y + Math.sin(ang) * rr;
        if(k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    });
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.moveTo(nav.x + Math.cos(nav.a) * 14, nav.y + Math.sin(nav.a) * 14);
    ctx.lineTo(nav.x + Math.cos(nav.a + 2.5) * 10, nav.y + Math.sin(nav.a + 2.5) * 10);
    ctx.lineTo(nav.x + Math.cos(nav.a - 2.5) * 10, nav.y + Math.sin(nav.a - 2.5) * 10);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ffd166";
    tiros.forEach(function(t){
      ctx.beginPath(); ctx.arc(t.x, t.y, 2.5, 0, 7); ctx.fill();
    });
  }
  document.getElementById("reinicia").addEventListener("click", novo);
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── INVASORES ─────────────────────────────────────────── */
export function invasores({ nome, sub, turbo }) {
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="score">Pontos: 0</span>
  <span class="zchip" id="onda">Onda 1</span>
</div>
<div style="max-width:400px;margin:0 auto;position:relative">
  <canvas class="zc" id="cv" width="360" height="420"></canvas>
  <div class="zmodal hidden" id="fim" style="position:absolute;inset:0;border-radius:16px">
    <div class="zbox"><h3>Fim de jogo</h3><p>Pontuação: <b class="acc" id="fimScore">0</b></p><button class="zbtn" id="reinicia" type="button">Jogar de novo</button></div>
  </div>
</div>
<p class="dim center mt" style="font-size:12.5px">← → move · espaço atira</p>`;
  const js = `
(function(){
  var cv = document.getElementById("cv");
  var ctx = cv.getContext ? cv.getContext("2d") : null;
  if(!ctx){ cv.outerHTML = "<p class='dim center'>Seu navegador não suporta canvas.</p>"; return; }
  var W = 360, H = 420;
  var jogador, tiros, inimigos, dir, velBase, score, onda, over, teclas = {}, cd = 0;
  function novo(){
    jogador = {x: W/2, w: 34};
    tiros = []; score = 0; onda = 1; over = false;
    document.getElementById("fim").classList.add("hidden");
    novaOnda();
    requestAnimationFrame(loop);
  }
  function novaOnda(){
    inimigos = [];
    var cols = 7, rows = 4;
    for(var r = 0; r < rows; r++) for(var c = 0; c < cols; c++){
      inimigos.push({x: 40 + c * 42, y: 40 + r * 36, vivo: true});
    }
    dir = 1;
    velBase = ${turbo ? "1.7" : "1.1"} + onda * 0.25;
    document.getElementById("onda").textContent = "Onda " + onda;
  }
  function fim(){
    over = true;
    document.getElementById("fimScore").textContent = score;
    document.getElementById("fim").classList.remove("hidden");
  }
  Z.onKey({ArrowLeft: function(){ teclas.l = true }, ArrowRight: function(){ teclas.r = true }, " ": function(){ teclas.f = true }});
  document.addEventListener("keyup", function(e){
    if(e.key === "ArrowLeft") teclas.l = false;
    if(e.key === "ArrowRight") teclas.r = false;
    if(e.key === " ") teclas.f = false;
  });
  var tickN = 0;
  function loop(){
    if(over) return;
    if(teclas.l) jogador.x -= 4;
    if(teclas.r) jogador.x += 4;
    jogador.x = Math.max(20, Math.min(W - 20, jogador.x));
    cd--;
    if(teclas.f && cd <= 0){
      tiros.push({x: jogador.x, y: H - 40});
      cd = 18;
      Z.snd(950, 0.03, "sine", 0.02);
    }
    tickN++;
    if(tickN % 34 === 0){
      var vivos = inimigos.filter(function(i){ return i.vivo });
      vivos.forEach(function(i){
        i.x += dir * 10;
        if(i.x < 14 || i.x > W - 14){
          dir *= -1;
          vivos.forEach(function(i2){ i2.y += 12 });
        }
      });
      if(vivos.some(function(i){ return i.y > H - 90 })) fim();
    }
    for(var i = tiros.length - 1; i >= 0; i--){
      var t = tiros[i];
      t.y -= 8;
      if(t.y < -10){ tiros.splice(i, 1); continue }
      for(var j = 0; j < inimigos.length; j++){
        var a = inimigos[j];
        if(a.vivo && Math.abs(t.x - a.x) < 16 && Math.abs(t.y - a.y) < 14){
          a.vivo = false;
          tiros.splice(i, 1);
          score += 10;
          Z.snd(500, 0.06, "square", 0.03);
          document.getElementById("score").textContent = "Pontos: " + score;
          break;
        }
      }
    }
    if(!inimigos.some(function(i){ return i.vivo })){
      onda++;
      score += 50;
      document.getElementById("score").textContent = "Pontos: " + score;
      Z.snd(1040, 0.2, "triangle", 0.05);
      novaOnda();
    }
    desenha();
    requestAnimationFrame(loop);
  }
  function desenha(){
    ctx.fillStyle = "#0a0d1a"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ff4d8f";
    inimigos.forEach(function(a){
      if(!a.vivo) return;
      ctx.font = "20px sans-serif";
      ctx.fillText("Invasor", a.x - 12, a.y + 7);
    });
    ctx.fillStyle = "#7dff6a";
    ctx.font = "24px sans-serif";
    ctx.fillText("Nave", jogador.x - 12, H - 20);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(W/2 - 60, H - 4, 120, 4);
    ctx.fillStyle = "#fff";
    tiros.forEach(function(t){ ctx.fillRect(t.x - 1.5, t.y - 8, 3, 10) });
  }
  document.getElementById("reinicia").addEventListener("click", novo);
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── FLAPPY ────────────────────────────────────────────── */
export function flappy({ nome, sub, tema }) {
  const corPipa = { verde: "#1f7c40", lua: "#5b6b9e" }[tema] || "#1f7c40";
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="score">Pontos: 0</span>
  <span class="zchip" id="best">Recorde: 0</span>
</div>
<div style="max-width:360px;margin:0 auto;position:relative">
  <canvas class="zc" id="cv" width="320" height="440"></canvas>
  <div class="zmodal hidden" id="fim" style="position:absolute;inset:0;border-radius:16px">
    <div class="zbox"><h3>Fim de jogo</h3><p>Pontuação: <b class="acc" id="fimScore">0</b></p><button class="zbtn" id="reinicia" type="button">Jogar de novo</button></div>
  </div>
</div>
<p class="dim center mt" style="font-size:12.5px">Toque, clique ou espaço para bater as asas</p>`;
  const js = `
(function(){
  var cv = document.getElementById("cv");
  var ctx = cv.getContext ? cv.getContext("2d") : null;
  if(!ctx){ cv.outerHTML = "<p class='dim center'>Seu navegador não suporta canvas.</p>"; return; }
  var W = 320, H = 440;
  var y, vy, pipas, score, over, started, best = Z.store.best("flappy-${tema}", 0);
  document.getElementById("best").textContent = "Recorde: " + best;
  function novo(){
    y = H/2; vy = 0; score = 0; over = false; started = false;
    pipas = [];
    document.getElementById("fim").classList.add("hidden");
    requestAnimationFrame(loop);
  }
  function flap(){
    if(over) return;
    started = true;
    vy = -6.4;
    Z.snd(700, 0.04, "sine", 0.03);
  }
  Z.onKey({" ": flap});
  cv.addEventListener("mousedown", flap);
  cv.addEventListener("touchstart", function(e){ e.preventDefault(); flap() }, {passive: false});
  function fim(){
    over = true;
    Z.snd(150, 0.35, "sawtooth", 0.05);
    if(score > best){ best = score; Z.store.setBest("flappy-${tema}", best); document.getElementById("best").textContent = "Recorde: " + best }
    document.getElementById("fimScore").textContent = score;
    document.getElementById("fim").classList.remove("hidden");
  }
  function loop(){
    if(over) return;
    if(started){
      vy += 0.34;
      y += vy;
      if(Math.random() < 0.011){
        var gap = 130, top = Z.rnd(60, H - gap - 160);
        pipas.push({x: W + 20, top: top, gap: gap, passou: false});
      }
      pipas.forEach(function(p){
        p.x -= 2.4;
        if(!p.passou && p.x + 16 < 40){
          p.passou = true;
          score++;
          document.getElementById("score").textContent = "Pontos: " + score;
          Z.snd(880, 0.05, "sine");
        }
        if(40 > p.x - 16 && 40 < p.x + 16){
          if(y - 10 < p.top || y + 10 > p.top + p.gap) fim();
        }
      });
      pipas = pipas.filter(function(p){ return p.x > -40 });
      if(y > H - 14 || y < 10) fim();
    }
    desenha();
    if(!over) requestAnimationFrame(loop);
  }
  function desenha(){
    ctx.fillStyle = ${tema === "lua" ? '"#0a0d2a"' : '"#0a0d1a"'};
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(148,158,210,0.15)";
    for(var i = 0; i < 18; i++){
      var sx = (i * 53) % W, sy = (i * 97) % H;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.fillStyle = "${corPipa}";
    pipas.forEach(function(p){
      ctx.fillRect(p.x - 16, 0, 32, p.top);
      ctx.fillRect(p.x - 16, p.top + p.gap, 32, H);
    });
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(40, y, 11, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(44, y - 3, 3, 0, 7); ctx.fill();
    if(!started){
      ctx.fillStyle = "rgba(237,240,255,0.85)";
      ctx.font = "15px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Toque para começar", W/2, H/2 - 60);
      ctx.textAlign = "left";
    }
  }
  document.getElementById("reinicia").addEventListener("click", novo);
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── RUNNER ────────────────────────────────────────────── */
export function runner({ nome, sub, tema }) {
  const PALETA_T = {
    neon: { bg: "#0a0d1a", solo: "#151c33", player: "#29e0ff", obst: "#ff4d8f" },
    dino: { bg: "#101a2e", solo: "#1b2440", player: "#7dff6a", obst: "#97a0c4" },
    lua: { bg: "#0a0d2a", solo: "#1a1f3d", player: "#ffd166", obst: "#5b6b9e" },
    neomex: { bg: "#14101f", solo: "#221a38", player: "#a78bfa", obst: "#ff4d8f" },
  }[tema] || { bg: "#0a0d1a", solo: "#151c33", player: "#29e0ff", obst: "#ff4d8f" };
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="score">Distância: 0</span>
  <span class="zchip" id="best">Recorde: 0</span>
</div>
<div style="max-width:480px;margin:0 auto;position:relative">
  <canvas class="zc" id="cv" width="440" height="200"></canvas>
  <div class="zmodal hidden" id="fim" style="position:absolute;inset:0;border-radius:16px">
    <div class="zbox"><h3>Fim de jogo</h3><p>Distância: <b class="acc" id="fimScore">0</b></p><button class="zbtn" id="reinicia" type="button">Jogar de novo</button></div>
  </div>
</div>
<p class="dim center mt" style="font-size:12.5px">Espaço, clique ou toque para pular</p>`;
  const js = `
(function(){
  var cv = document.getElementById("cv");
  var ctx = cv.getContext ? cv.getContext("2d") : null;
  if(!ctx){ cv.outerHTML = "<p class='dim center'>Seu navegador não suporta canvas.</p>"; return; }
  var W = 440, H = 200, SOLO = 170;
  var P = ${JSON.stringify(PALETA_T)};
  var py, vy, salt, obst, score, vel, over, best = Z.store.best("run-${tema}", 0);
  document.getElementById("best").textContent = "Recorde: " + best;
  function novo(){
    py = SOLO; vy = 0; salt = false; score = 0; vel = 4.4; over = false;
    obst = [];
    document.getElementById("fim").classList.add("hidden");
    requestAnimationFrame(loop);
  }
  function pular(){
    if(over) return;
    if(!salt){
      vy = -10.6; salt = true;
      Z.snd(680, 0.05, "sine", 0.03);
    }
  }
  Z.onKey({" ": pular});
  cv.addEventListener("mousedown", pular);
  cv.addEventListener("touchstart", function(e){ e.preventDefault(); pular() }, {passive: false});
  function fim(){
    over = true;
    Z.snd(150, 0.3, "sawtooth", 0.05);
    var d = Math.floor(score);
    if(d > best){ best = d; Z.store.setBest("run-${tema}", best); document.getElementById("best").textContent = "Recorde: " + best }
    document.getElementById("fimScore").textContent = d;
    document.getElementById("fim").classList.remove("hidden");
  }
  function loop(){
    if(over) return;
    vy += 0.55;
    py += vy;
    if(py > SOLO){ py = SOLO; salt = false; vy = 0 }
    score += vel / 10;
    vel += 0.0012;
    if(Math.random() < 0.012 + vel * 0.0006){
      var h = Z.rnd(16, 34);
      obst.push({x: W + 20, w: Z.rnd(10, 26), h: h});
    }
    obst.forEach(function(o){ o.x -= vel });
    obst = obst.filter(function(o){ return o.x > -30 });
    var px = 60;
    for(var i = 0; i < obst.length; i++){
      var o = obst[i];
      if(px + 10 > o.x && px - 10 < o.x + o.w && py - 14 > SOLO - o.h){
        fim();
        break;
      }
    }
    desenha();
    if(!over) requestAnimationFrame(loop);
  }
  function desenha(){
    ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = P.solo;
    ctx.fillRect(0, SOLO + 14, W, H);
    ctx.fillStyle = P.player;
    ctx.beginPath();
    ctx.roundRect(46, py - 16, 26, 24, 6);
    ctx.fill();
    ctx.fillStyle = "#05070f";
    ctx.fillRect(62, py - 10, 4, 4);
    ctx.fillStyle = P.obst;
    obst.forEach(function(o){
      ctx.beginPath();
      ctx.roundRect(o.x, SOLO + 14 - o.h, o.w, o.h, 4);
      ctx.fill();
    });
    document.getElementById("score").textContent = "Distância: " + Math.floor(score);
  }
  document.getElementById("reinicia").addEventListener("click", novo);
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── TIRO AO ALVO ──────────────────────────────────────── */
export function alvo({ nome, sub, turbo }) {
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="score">Acertos: 0</span>
  <span class="zchip" id="tempo">Tempo 30s</span>
  <span class="zchip" id="best">Recorde: 0</span>
</div>
<div id="arena" style="position:relative;height:380px;max-width:560px;margin:0 auto;border-radius:16px;border:1px solid var(--z-line);background:radial-gradient(600px 200px at 50% 120%, rgba(124,92,255,0.12), transparent),var(--z-bg2);cursor:crosshair;overflow:hidden">
  <div id="mIRA" style="position:absolute;width:${turbo ? 44 : 64}px;height:${turbo ? 44 : 64}px;border-radius:50%;background:radial-gradient(circle,#ff5c5c 0 22%,#fff 22% 40%,#ff5c5c 40% 62%,#fff 62% 80%,#ff5c5c 80%);cursor:pointer;box-shadow:0 0 24px rgba(255,92,92,0.4)"></div>
</div>`;
  const js = `
(function(){
  var TURBO = ${turbo ? "true" : "false"};
  var score = 0, tempo = 30, over = false, best = Z.store.best("alvo-" + (TURBO ? "t" : "n"), 0);
  document.getElementById("best").textContent = "Recorde: " + best;
  var arena = document.getElementById("arena");
  var mira = document.getElementById("mIRA");
  function mover(){
    if(over) return;
    var mw = mira.offsetWidth, mh = mira.offsetHeight;
    mira.style.left = Z.rnd(8, arena.clientWidth - mw - 8) + "px";
    mira.style.top = Z.rnd(8, arena.clientHeight - mh - 8) + "px";
  }
  mira.addEventListener("click", function(e){
    e.stopPropagation();
    if(over) return;
    score++;
    document.getElementById("score").textContent = "Acertos: " + score;
    Z.snd(900, 0.04, "sine");
    mover();
  });
  var tick = setInterval(function(){
    tempo--;
    document.getElementById("tempo").textContent = "Tempo " + tempo + "s";
    if(TURBO && tempo % 3 === 0) mover();
    if(tempo <= 0){
      over = true;
      clearInterval(tick);
      if(score > best){ best = score; Z.store.setBest("alvo-" + (TURBO ? "t" : "n"), best); document.getElementById("best").textContent = "Recorde: " + best }
      Z.toast("Fim! " + score + " acertos Alvo", 3000);
      Z.snd(1000, 0.3, "triangle", 0.06);
    }
  }, 1000);
  mover();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── PILHA DE BLOCOS ───────────────────────────────────── */
export function pilha({ nome, sub, neon }) {
  const cor = neon ? "#29e0ff" : "#7c5cff";
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="score">Altura: 0</span>
  <span class="zchip" id="best">Recorde: 0</span>
</div>
<div id="arena" style="position:relative;height:420px;max-width:340px;margin:0 auto;border-radius:16px;border:1px solid var(--z-line);background:linear-gradient(180deg,var(--z-bg2),#0d1226);overflow:hidden;cursor:pointer">
  <div id="bloco" style="position:absolute;height:26px;background:${cor};border-radius:6px"></div>
</div>
<p class="dim center mt" style="font-size:12.5px">Toque/clique para soltar o bloco. O que sobrar nas bordas cai!</p>`;
  const js = `
(function(){
  var arena = document.getElementById("arena");
  var bloco = document.getElementById("bloco");
  var LARG_IN = 240;
var pilha = [], criados = [], x = 0, dir = 1, vel = 1.8, over = false, score = 0, raf = null;
  var best = Z.store.best("pilha", 0);
  document.getElementById("best").textContent = "Recorde: " + best;
  function base(){
    return {x: (arena.clientWidth - LARG_IN) / 2, w: LARG_IN, y: arena.clientHeight - 40};
  }
  function novo(){
    pilha = [base()];
    score = 0; over = false; x = 0; dir = 1;
    document.getElementById("score").textContent = "Altura: 0";
    posicionar();
    if(raf) cancelAnimationFrame(raf);
    loop();
  }
  function top(){ return pilha[pilha.length - 1] }
  function limites(){
    var t = top();
    var w = bloco.offsetWidth || t.w;
    return {min: 4 - t.x + t.w/2, max: arena.clientWidth - w - 4 - t.x + t.w/2};
  }
  function posicionar(){
    var t = top();
    bloco.style.width = t.w + "px";
    bloco.style.bottom = (arena.clientHeight - t.y) + "px";
  }
  function loop(){
    if(over) return;
    var t = top();
    var L = limites();
    x += dir * vel;
    if(x < L.min || x > L.max) dir *= -1;
    bloco.style.left = (t.x - t.w/2 + x) + "px";
    raf = requestAnimationFrame(loop);
  }
  function soltar(){
    if(over) return;
    cancelAnimationFrame(raf);
    var t = top();
    var esq = t.x - t.w/2 + x;
    var dir2 = esq + bloco.offsetWidth;
    var no = Math.max(esq, t.x - t.w/2);
    var fim2 = Math.min(dir2, t.x + t.w/2);
    var w = fim2 - no;
    if(w <= 14){
      fim();
      return;
    }
    pilha.push({x: (no + fim2) / 2, w: w, y: t.y - 26});
    score++;
    vel += 0.05;
    document.getElementById("score").textContent = "Altura: " + score;
    Z.snd(500 + score * 12, 0.05, "sine");
    var b2 = document.createElement("div");
    b2.style.cssText = "position:absolute;height:26px;background:${cor};border-radius:6px;left:" + no + "px;bottom:" + (arena.clientHeight - (t.y - 26)) + "px;width:" + w + "px";
    arena.appendChild(b2);
    criados.push(b2);
    if(criados.length > 14) criados.shift().remove();
    bloco.style.width = w + "px";
    x = 0; dir = 1;
    if(score > best){ best = score; Z.store.setBest("pilha", best); document.getElementById("best").textContent = "Recorde: " + best }
    loop();
  }
  function fim(){
    over = true;
    Z.snd(140, 0.4, "sawtooth", 0.06);
    Z.toast("Torre caiu na altura " + score + "!", 2500);
  }
  arena.addEventListener("click", soltar);
  Z.onKey({" ": soltar});
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── STROOP ────────────────────────────────────────────── */
export function stroop({ nome, sub, turbo }) {
  const CORES = [["Vermelho", "#ff5c5c"], ["Azul", "#29e0ff"], ["Verde", "#7dff6a"], ["Amarelo", "#ffd166"], ["Roxo", "#a78bfa"], ["Laranja", "#ffb347"]];
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="score">Acertos: 0</span>
  <span class="zchip" id="tempo">Tempo 30s</span>
  <span class="zchip" id="best">Recorde: 0</span>
</div>
<div class="zcard pad center" style="max-width:480px;margin:0 auto">
  <div class="zbig mb" id="palavra" style="font-size:clamp(40px,9vw,64px)">Azul</div>
  <div class="zgrid" id="botoes" style="grid-template-columns:repeat(3,1fr);gap:8px"></div>
</div>
<p class="dim center mt" style="font-size:12.5px">Clique na cor do TEXTO (não no que a palavra diz!).</p>`;
  const js = `
(function(){
  var CORES = ${JSON.stringify(CORES)};
  var TURBO = ${turbo ? "true" : "false"};
  var score = 0, tempo = 30, over = false, best = Z.store.best("stroop-" + (TURBO ? "t" : "n"), 0);
  document.getElementById("best").textContent = "Recorde: " + best;
  var box = document.getElementById("botoes");
  CORES.forEach(function(c){
    var b = document.createElement("button");
    b.className = "zopty";
    b.style.cssText = "justify-content:center;font-family:var(--z-fd);font-weight:600";
    b.textContent = c[0];
    b.addEventListener("click", function(){ responder(c[0]) });
    box.appendChild(b);
  });
  function nova(){
    var alvo = CORES[Z.rnd(0, CORES.length - 1)];
    var mostrado = TURBO ? CORES[Z.rnd(0, CORES.length - 1)] : alvo;
    var el = document.getElementById("palavra");
    el.textContent = mostrado[0];
    el.style.color = alvo[1];
  }
  function responder(c){
    if(over) return;
    var alvoAtual = document.getElementById("palavra").style.color;
    var nomeAlvo = "";
    CORES.forEach(function(x){ if(x[1] === alvoAtual) nomeAlvo = x[0] });
    if(c === nomeAlvo){
      score++;
      document.getElementById("score").textContent = "Acertos: " + score;
      Z.snd(840, 0.04, "sine");
    } else Z.snd(160, 0.1, "sawtooth", 0.03);
    nova();
  }
  var tick = setInterval(function(){
    tempo--;
    document.getElementById("tempo").textContent = "Tempo " + tempo + "s";
    if(tempo <= 0){
      over = true;
      clearInterval(tick);
      if(score > best){ best = score; Z.store.setBest("stroop-" + (TURBO ? "t" : "n"), best); document.getElementById("best").textContent = "Recorde: " + best }
      Z.toast("Fim! " + score + " acertos", 3000);
    }
  }, 1000);
  nova();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ─- BOLICHE ───────────────────────────────────────────── */
export function boliche({ nome, sub }) {
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="pinos">Pinos: 10</span>
  <span class="zchip" id="bola">Bola: 1/3</span>
  <span class="zchip" id="score">Pontos: 0</span>
</div>
<div style="max-width:380px;margin:0 auto;position:relative">
  <canvas class="zc" id="cv" width="340" height="380"></canvas>
  <div class="zmodal hidden" id="fim" style="position:absolute;inset:0;border-radius:16px">
    <div class="zbox"><h3>Game over</h3><p>Pontuação: <b class="acc" id="fimScore">0</b></p><button class="zbtn" id="reinicia" type="button">Jogar de novo</button></div>
  </div>
</div>
<div class="zcard pad mt" style="max-width:380px;margin-left:auto;margin-right:auto">
  <div class="col">
    <div><span class="zlabel">Angulação: <b class="acc" id="angV">0°</b></span><input type="range" id="ang" min="-30" max="30" value="0" style="width:100%"></div>
    <div><span class="zlabel">Força: <b class="acc" id="forV">70%</b></span><input type="range" id="for" min="40" max="100" value="70" style="width:100%"></div>
    <button class="zbtn" id="atirar" type="button" disabled>Boliche Atirar bola</button>
  </div>
</div>`;
  const js = `
(function(){
  var cv = document.getElementById("cv");
  var ctx = cv.getContext ? cv.getContext("2d") : null;
  if(!ctx){ cv.outerHTML = "<p class='dim center'>Seu navegador não suporta canvas.</p>"; return; }
  var W = 340, H = 380;
  var pinos, bola, rodando, pontos, bolaNum, fim;
  function novo(){
    pinos = [];
    var pos = [[0,0],[0,1],[0,2],[0,3],[1,1],[1,2],[1,3],[2,2],[2,3],[2,4]];
    pos.forEach(function(p, i){
      pinos.push({x: W/2 + (p[1] - 2) * 34, y: 70 + p[0] * 30, vivo: true, vx: 0, vy: 0});
    });
    bola = null; rodando = false; pontos = 0; bolaNum = 1; fim = false;
    document.getElementById("fim").classList.add("hidden");
    document.getElementById("atirar").disabled = false;
    hud();
    requestAnimationFrame(loop);
  }
  function hud(){
    var vivos = pinos.filter(function(p){ return p.vivo }).length;
    document.getElementById("pinos").textContent = "Pinos: " + vivos;
    document.getElementById("bola").textContent = "Bola: " + bolaNum + "/3";
    document.getElementById("score").textContent = "Pontos: " + pontos;
  }
  document.getElementById("ang").addEventListener("input", function(){ document.getElementById("angV").textContent = this.value + "°" });
  document.getElementById("for").addEventListener("input", function(){ document.getElementById("forV").textContent = this.value + "%" });
  document.getElementById("atirar").addEventListener("click", function(){
    if(rodando || fim) return;
    var ang = parseInt(document.getElementById("ang").value, 10) * Math.PI / 180;
    var forca = parseInt(document.getElementById("for").value, 10);
    bola = {x: W/2, y: H - 40, vx: Math.sin(ang) * forca * 0.16, vy: -forca * 0.11};
    rodando = true;
    document.getElementById("atirar").disabled = true;
    Z.snd(300, 0.1, "triangle", 0.05);
  });
  function fimJogo(){
    fim = true;
    document.getElementById("fimScore").textContent = pontos;
    document.getElementById("fim").classList.remove("hidden");
  }
  function loop(){
    if(fim) return;
    if(bola){
      bola.x += bola.vx; bola.y += bola.vy;
      pinos.forEach(function(p){
        if(!p.vivo) return;
        var d = Math.hypot(bola.x - p.x, bola.y - p.y);
        if(d < 20){
          p.vivo = false;
          var ang2 = Math.atan2(p.y - bola.y, p.x - bola.x);
          p.vx = Math.cos(ang2) * (4 + Math.random() * 4);
          p.vy = Math.sin(ang2) * (4 + Math.random() * 4);
          pontos += 10;
          Z.snd(700 + Math.random() * 300, 0.06, "square", 0.03);
        }
      });
      pinos.forEach(function(p){
        if(p.vivo) return;
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.94; p.vy *= 0.94;
      });
      if(bola.y < -20 || bola.x < -20 || bola.x > W + 20){
        bola = null;
        rodando = false;
        hud();
        var vivos = pinos.filter(function(p){ return p.vivo }).length;
        if(vivos === 0){
          pontos += 50;
          hud();
          fimJogo();
        } else if(bolaNum >= 3){
          fimJogo();
        } else {
          bolaNum++;
          hud();
          document.getElementById("atirar").disabled = false;
        }
      }
    }
    desenha();
    requestAnimationFrame(loop);
  }
  function desenha(){
    ctx.fillStyle = "#12100a"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#2a2418";
    ctx.fillRect(0, 0, W, 240);
    ctx.strokeStyle = "rgba(148,158,210,0.15)";
    ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(40, 240); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 40, 0); ctx.lineTo(W - 40, 240); ctx.stroke();
    pinos.forEach(function(p){
      if(!p.vivo && Math.abs(p.vx) + Math.abs(p.vy) < 0.3 && p.y > 300) return;
      ctx.fillStyle = p.vivo ? "#fff" : "rgba(255,255,255,0.4)";
      ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, 7); ctx.fill();
      if(p.vivo){
        ctx.fillStyle = "#ff4d8f";
        ctx.fillRect(p.x - 10, p.y - 3, 20, 5);
      }
    });
    if(bola){
      ctx.fillStyle = "#29e0ff";
      ctx.beginPath(); ctx.arc(bola.x, bola.y, 13, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath(); ctx.arc(bola.x - 4, bola.y - 4, 4, 0, 7); ctx.fill();
    }
  }
  document.getElementById("reinicia").addEventListener("click", novo);
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── CORRIDA DE DADOS ──────────────────────────────────── */
export function dadoDuelo({ nome, sub, alvo }) {
  const body = `
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <div class="zgrid" style="grid-template-columns:1fr 1fr;gap:14px">
    <div class="zcard center" style="border-color:var(--z-acc)">
      <p class="fd acc" style="font-size:20px">Você</p>
      <div class="zbig" id="d1">1</div>
      <p class="dim">Total: <b class="acc" id="t1">0</b> / ${alvo}</p>
    </div>
    <div class="zcard center" style="border-color:rgba(255,92,92,0.4)">
      <p class="fd" style="font-size:20px;color:var(--z-red)">CPU</p>
      <div class="zbig" id="d2">1</div>
      <p class="dim">Total: <b style="color:var(--z-red)" id="t2">0</b> / ${alvo}</p>
    </div>
  </div>
  <p class="center mt fd" id="msg" style="font-size:19px;min-height:30px">Sua vez — role o dado!</p>
  <div class="row mt" style="justify-content:center">
    <button class="zbtn" id="rolar" type="button">Dado Rolar</button>
    <button class="zbtn ghost" id="reinicia" type="button">Reiniciar</button>
  </div>
</div>`;
  const js = `
(function(){
  var ALVO = ${alvo};
  var FACES = ["1", "2", "3", "4", "5", "6"];
  var t1 = 0, t2 = 0, vez = "p", travado = false;
  function $id(x){return document.getElementById(x)}
  function atualizar(){
    $id("t1").textContent = t1;
    $id("t2").textContent = t2;
  }
  function animar(el, cb){
    var k = 0;
    var tick = setInterval(function(){
      el.textContent = FACES[Z.rnd(0, 5)];
      k++;
      if(k > 8){
        clearInterval(tick);
        cb();
      }
    }, 70);
  }
  function rolar(){
    if(travado) return;
    travado = true;
    var el = vez === "p" ? $id("d1") : $id("d2");
    $id("msg").textContent = vez === "p" ? "Rolando..." : "CPU rolou!";
    animar(el, function(){
      var v = Z.rnd(1, 6);
      el.textContent = FACES[v - 1];
      if(vez === "p"){ t1 += v; $id("msg").textContent = "Você tirou " + v + "!" }
      else { t2 += v; $id("msg").textContent = "CPU tirou " + v + "!" }
      atualizar();
      Z.snd(600, 0.06, "square", 0.04);
      if(t1 >= ALVO){ $id("msg").textContent = "Concluído Você venceu!"; Z.snd(1040, 0.3, "triangle", 0.06); travado = true; return }
      if(t2 >= ALVO){ $id("msg").textContent = "Computador CPU venceu!"; Z.snd(140, 0.4, "sawtooth", 0.05); travado = true; return }
      travado = false;
    });
  }
  $id("rolar").addEventListener("click", function(){
    if(travado) return;
    if(vez === "p") rolar();
    else {
      $id("msg").textContent = "CPU pensando...";
      setTimeout(function(){ rolar() }, 700);
    }
  });
  $id("reinicia").addEventListener("click", function(){
    t1 = 0; t2 = 0; vez = "p"; travado = false;
    $id("d1").textContent = "1"; $id("d2").textContent = "1";
    atualizar();
    $id("msg").textContent = "Sua vez — role o dado!";
  });
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── BLACKJACK ─────────────────────────────────────────── */
export function blackjack({ nome, sub }) {
  const body = `
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="row between mb wrap">
    <span class="zchip">Cartões: <b id="baralho" class="acc">312</b></span>
    <span class="zchip">Chips: <b class="acc" id="chips">100</b></span>
    <span class="zchip">Aposta: <b id="aposta">10</b></span>
  </div>
  <div class="zcard mb center" style="background:var(--z-bg2)">
    <p class="fd" style="color:var(--z-red)">Dealer <b class="acc" id="dv">0</b></p>
    <div class="row wrap" style="justify-content:center;gap:8px" id="dm"></div>
  </div>
  <div class="zcard mb center" style="background:var(--z-bg2)">
    <p class="fd">Você <b class="acc" id="pv">0</b></p>
    <div class="row wrap" style="justify-content:center;gap:8px" id="pm"></div>
  </div>
  <p class="center fd mb" id="msg" style="font-size:19px;min-height:28px">Faça sua aposta e comece!</p>
  <div class="row wrap" style="justify-content:center;gap:10px">
    <button class="zbtn sm" id="baixar" type="button" disabled>−5</button>
    <button class="zbtn sm" id="subir" type="button" disabled>+5</button>
    <button class="zbtn" id="dar" type="button" disabled>Coringa Dar carta</button>
    <button class="zbtn ghost" id="parar" type="button" disabled>Parar</button>
    <button class="zbtn ghost" id="nova" type="button" disabled>Nova mão</button>
  </div>
</div>`;
  const js = `
(function(){
  var CH = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
  var SU = ["Espadas", "Coração", "Ouros", "Paus"];
  var baralho = [], jogador = [], dealer = [], chips = 100, aposta = 10, jogando = false, fimMao = false;
  function $id(x){return document.getElementById(x)}
  function montar(){
    baralho = [];
    for(var s = 0; s < 4; s++) for(var c = 0; c < CH.length; c++) baralho.push(CH[c] + SU[s]);
    Z.shuffle(baralho);
    document.getElementById("baralho").textContent = baralho.length;
  }
  function valor(mao){
    var v = 0, as = 0;
    mao.forEach(function(c){
      var n = c.slice(0, -1);
      if(n === "A") { v += 11; as++ }
      else if(n === "K" || n === "Q" || n === "J") v += 10;
      else v += parseInt(n, 10);
    });
    while(v > 21 && as > 0){ v -= 10; as-- }
    return v;
  }
  function pintar(el, mao, oculta){
    el.innerHTML = "";
    mao.forEach(function(c, i){
      var d = document.createElement("span");
      var escondida = oculta && i === 0;
      d.style.cssText = "font-family:var(--z-fm);font-weight:700;font-size:17px;background:var(--z-surface2);border:1px solid var(--z-line2);border-radius:8px;padding:8px 10px;color:" + (c[1] === "Coração" || c[1] === "Ouros" ? "#ff5c5c" : "#edf0ff");
      d.textContent = escondida ? "?" : c;
      el.appendChild(d);
    });
  }
  function atualizar(oculta){
    $id("dv").textContent = valor(dealer);
    $id("pv").textContent = valor(jogador);
    $id("chips").textContent = chips;
    $id("aposta").textContent = aposta;
    pintar($id("dm"), dealer, oculta);
    pintar($id("pm"), jogador, false);
  }
  function botao(on){
    $id("dar").disabled = !on;
    $id("parar").disabled = !on;
    $id("nova").disabled = on;
    $id("baixar").disabled = on;
    $id("subir").disabled = on;
  }
  function puxar(mao){
    var c = baralho.pop();
    mao.push(c);
    document.getElementById("baralho").textContent = baralho.length;
    Z.snd(520, 0.04, "sine");
    return c;
  }
  function fim(jogadorVenceu, msg, pagar){
    fimMao = true; jogando = false;
    if(pagar) chips += pagar;
    $id("msg").textContent = msg;
    atualizar(false);
    botao(false);
    $id("nova").disabled = false;
    Z.snd(jogadorVenceu ? 1040 : 180, 0.3, "triangle", 0.05);
  }
  $id("baixar").addEventListener("click", function(){ if(aposta > 5){ aposta -= 5; atualizar(false) } });
  $id("subir").addEventListener("click", function(){ if(chips - chips % 1 >= aposta + 5){ aposta += 5; atualizar(false) } });
  $id("dar").addEventListener("click", function(){
    if(!jogando) return;
    puxar(jogador);
    atualizar(true);
    if(valor(jogador) > 21) fim(false, "Impacto Estourou! A aposta vai embora.", 0);
  });
  $id("parar").addEventListener("click", function(){
    if(!jogando) return;
    jogando = false;
    botao(false);
    function dealerJoga(){
      if(valor(dealer) < 17){
        puxar(dealer);
        atualizar(false);
        setTimeout(dealerJoga, 550);
        return;
      }
      var vd = valor(dealer);
      var vj = valor(jogador);
      if(vd > 21) fim(true, "Concluído Dealer estourou! Você leva " + aposta * 2 + " chips.", aposta * 2);
      else if(vj > vd) fim(true, "Concluído Você vence com " + vj + "!" , aposta * 2);
      else if(vj === vd) fim(false, "Acordo Empate — a aposta volta pra você.", aposta);
      else fim(false, "Dealer vence com " + vd + ". Até a próxima!", 0);
    }
    dealerJoga();
  });
  $id("nova").addEventListener("click", function(){
    if(chips <= 0){
      chips = 100;
      Z.toast("Chips repostados! Moeda", 2500);
    }
    if(baralho.length < 40) montar();
    jogador = []; dealer = [];
    puxar(jogador); puxar(dealer); puxar(jogador);
    jogando = true; fimMao = false;
    $id("msg").textContent = "Suas cartas: " + valor(jogador) + ". Continue ou pare?";
    atualizar(true);
    botao(true);
  });
  montar();
  $id("nova").disabled = false;
  $id("msg").textContent = "Clique em 'Nova mão' para começar. Blackjack = 21!";
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── LABIRINTO ─────────────────────────────────────────── */
export function labirinto({ nome, sub, n, perseguido }) {
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="moves">Passos: 0</span>
  <span class="zchip" id="status">Alvo Encontre a saída</span>
</div>
<div class="zgrid" id="maze" style="grid-template-columns:repeat(${n},1fr);max-width:${n * 18}px;margin:0 auto;gap:2px"></div>
<p class="dim center mt" style="font-size:12.5px">Use as setas ou WASD${perseguido ? " · cuidado com Fantasma" : ""}</p>
<div class="row mt center" style="justify-content:center"><button class="zbtn sm" id="novo" type="button">Novo labirinto</button></div>`;
  const js = `
(function(){
  var N = ${n};
  var walls = [], px = 1, py = 1, ghost = null, moves = 0, over = false;
  function $id(x){return document.getElementById(x)}
  function gerar(){
    walls = [];
    for(var r = 0; r < N; r++){ walls.push([]); for(var c = 0; c < N; c++) walls[r].push(1) }
    var pilha = [[1, 1]];
    walls[1][1] = 0;
    while(pilha.length){
      var cur = pilha[pilha.length - 1];
      var ops = [];
      if(cur[0] >= 2 && walls[cur[0]-2][cur[1]] === 1) ops.push([cur[0]-2, cur[1]]);
      if(cur[0] < N-2 && walls[cur[0]+2][cur[1]] === 1) ops.push([cur[0]+2, cur[1]]);
      if(cur[1] >= 2 && walls[cur[0]][cur[1]-2] === 1) ops.push([cur[0], cur[1]-2]);
      if(cur[1] < N-2 && walls[cur[0]][cur[1]+2] === 1) ops.push([cur[0], cur[1]+2]);
      if(!ops.length){ pilha.pop(); continue }
      var prox = ops[Z.rnd(0, ops.length - 1)];
      walls[(cur[0]+prox[0])/2][(cur[1]+prox[1])/2] = 0;
      walls[prox[0]][prox[1]] = 0;
      pilha.push(prox);
    }
    var alvo = N - 2;
    walls[alvo][alvo] = 0;
  }
  function render(){
    var box = $id("maze");
    box.innerHTML = "";
    for(var r = 0; r < N; r++) for(var c = 0; c < N; c++){
      var d = document.createElement("div");
      var fundo = walls[r][c] ? "#151c33" : "var(--z-bg2)";
      d.style.cssText = "aspect-ratio:1;background:" + fundo + ";border-radius:3px;display:grid;place-items:center;font-size:11px";
      if(r === py && c === px) d.textContent = "Pessoa";
      if(r === N-2 && c === N-2 && !(r === py && c === px)) d.textContent = "Marcador";
      if(ghost && ghost.r === r && ghost.c === c) d.textContent = "Fantasma";
      box.appendChild(d);
    }
  }
  function mover(dr, dc){
    if(over) return;
    var nr = py + dr, nc = px + dc;
    if(nr < 0 || nr >= N || nc < 0 || nc >= N || walls[nr][nc] === 1) return;
    py = nr; px = nc; moves++;
    $id("moves").textContent = "Passos: " + moves;
    Z.snd(400, 0.02, "sine", 0.015);
    if(${perseguido ? "true" : "false"}){
      if(moves % 2 === 0) moverGhost();
      if(ghost && ghost.r === py && ghost.c === px){
        over = true;
        $id("status").textContent = "Fantasma Foi pego!";
        Z.snd(140, 0.4, "sawtooth", 0.06);
        return;
      }
    }
    if(py === N-2 && px === N-2){
      over = true;
      $id("status").textContent = "Vitória Você saiu em " + moves + " passos!";
      Z.snd(1040, 0.3, "triangle", 0.06);
    }
    render();
  }
  function moverGhost(){
    if(!ghost){
      ghost = {r: 1, c: N-2};
      return;
    }
    var ops = [[-1,0],[1,0],[0,-1],[0,1]]
      .filter(function(o){
        var nr = ghost.r + o[0], nc = ghost.c + o[1];
        return nr >= 0 && nr < N && nc >= 0 && nc < N && walls[nr][nc] === 0;
      });
    if(!ops.length) return;
    ops.sort(function(a, b){
      var da = Math.abs(ghost.r + a[0] - py) + Math.abs(ghost.c + a[1] - px);
      var db = Math.abs(ghost.r + b[0] - py) + Math.abs(ghost.c + b[1] - px);
      return da - db;
    });
    var escolha = Math.random() < 0.75 ? ops[0] : ops[Z.rnd(0, ops.length - 1)];
    ghost.r += escolha[0];
    ghost.c += escolha[1];
  }
  Z.onKey({ArrowUp: function(){ mover(-1, 0) }, ArrowDown: function(){ mover(1, 0) }, ArrowLeft: function(){ mover(0, -1) }, ArrowRight: function(){ mover(0, 1) },
    w: function(){ mover(-1, 0) }, s: function(){ mover(1, 0) }, a: function(){ mover(0, -1) }, d: function(){ mover(0, 1) }});
  function novo(){
    moves = 0; over = false;
    px = 1; py = 1;
    ghost = null;
    $id("moves").textContent = "Passos: 0";
    $id("status").textContent = "Alvo Encontre a saída";
    gerar();
    render();
  }
  $id("novo").addEventListener("click", novo);
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── PEGADA DE BOLHAS ──────────────────────────────────── */
export function bolhas({ nome, sub, turbo }) {
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="score">Pontos: 0</span>
  <span class="zchip" id="combo">Combo x1</span>
  <span class="zchip" id="tempo">Tempo 45s</span>
  <span class="zchip" id="best">Recorde: 0</span>
</div>
<div id="arena" style="position:relative;height:420px;max-width:520px;margin:0 auto;border-radius:16px;border:1px solid var(--z-line);background:linear-gradient(180deg,#0a1230,#05070f);overflow:hidden">
</div>
<p class="dim center mt" style="font-size:12.5px">Toque nas bolhas antes que estourem no topo!</p>`;
  const js = `
(function(){
  var arena = document.getElementById("arena");
  var score = 0, tempo = 45, over = false, combo = 1, ultimo = 0;
  var best = Z.store.best("bolhas-" + ${JSON.stringify(nome)}, 0);
  document.getElementById("best").textContent = "Recorde: " + best;
  var bolhas = [];
  function spawn(){
    if(over) return;
    var el = document.createElement("div");
    var tam = Z.rnd(34, 62);
    var x = Z.rnd(10, arena.clientWidth - tam - 10);
    el.style.cssText = "position:absolute;width:" + tam + "px;height:" + tam + "px;border-radius:50%;cursor:pointer;left:" + x + "px;bottom:-70px;background:radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7), rgba(41,224,255,0.5) 40%, rgba(124,92,255,0.35));box-shadow:0 0 18px rgba(41,224,255,0.35)";
    var b = {el: el, y: -70, v: ${turbo ? "1.6" : "1.0"} + Math.random() * ${turbo ? "1.4" : "0.9"}};
    el.addEventListener("click", function(){
      if(over) return;
      var agora = Date.now();
      if(agora - ultimo < 1200) combo = Math.min(combo + 1, 8);
      else combo = 1;
      ultimo = agora;
      score += combo;
      document.getElementById("score").textContent = "Pontos: " + score;
      document.getElementById("combo").textContent = "Combo x" + combo;
      Z.snd(600 + combo * 90, 0.05, "sine");
      el.remove();
      bolhas = bolhas.filter(function(x2){ return x2 !== b });
    });
    arena.appendChild(el);
    bolhas.push(b);
  }
  var tickSpawn = setInterval(spawn, ${turbo ? "480" : "700"});
  var tick = setInterval(function(){
    tempo--;
    document.getElementById("tempo").textContent = "Tempo " + tempo + "s";
    if(tempo <= 0){
      over = true;
      clearInterval(tick); clearInterval(tickSpawn);
      bolhas.forEach(function(x){ x.el.remove() });
      if(score > best){ best = score; Z.store.setBest("bolhas-" + ${JSON.stringify(nome)}, best); document.getElementById("best").textContent = "Recorde: " + best }
      Z.toast("Fim! " + score + " pontos Bolha", 3000);
    }
  }, 1000);
  var raf = null;
  function loop(){
    if(over) return;
    bolhas.forEach(function(b){
      b.y += b.v;
      b.el.style.bottom = b.y + "px";
      if(b.y > arena.clientHeight){
        b.el.remove();
        bolhas = bolhas.filter(function(x){ return x !== b });
        combo = 1;
        document.getElementById("combo").textContent = "Combo x1";
      }
    });
    raf = requestAnimationFrame(loop);
  }
  loop();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── ESQUIVA 3 TRILHOS ─────────────────────────────────── */
export function esquiva({ nome, sub, neon }) {
  const corJ = neon ? "#29e0ff" : "#7dff6a";
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="score">Pontos: 0</span>
  <span class="zchip" id="vidas">VermelhoVermelhoVermelho</span>
</div>
<div id="arena" style="position:relative;height:440px;max-width:340px;margin:0 auto;border-radius:16px;border:1px solid var(--z-line);background:linear-gradient(180deg,var(--z-bg2),#0b0f1f);overflow:hidden">
  <div style="position:absolute;left:33.33%;top:0;bottom:0;width:1px;background:var(--z-line)"></div>
  <div style="position:absolute;left:66.66%;top:0;bottom:0;width:1px;background:var(--z-line)"></div>
  <div id="jogador" style="position:absolute;bottom:16px;width:56px;height:20px;border-radius:8px;background:${JSON.stringify(corJ)};left:33.3%;box-shadow:0 0 20px ${JSON.stringify(corJ)}"></div>
</div>
<p class="dim center mt" style="font-size:12.5px">← → (ou A/D) para trocar de trilha · toque nas bordas do campo</p>`;
  const js = `
(function(){
  var ARENA = document.getElementById("arena");
  var J = document.getElementById("jogador");
  var trilho = 1, score = 0, vidas = 3, over = false, obst = [], vel = 2.6, spawnT = 0;
  Z.onKey({ArrowLeft: function(){ troca(-1) }, ArrowRight: function(){ troca(1) }, a: function(){ troca(-1) }, d: function(){ troca(1) }});
  ARENA.addEventListener("touchstart", function(e){
    var r = ARENA.getBoundingClientRect();
    var x = e.touches[0].clientX - r.left;
    troca(x < r.width / 2 ? -1 : 1);
  }, {passive: true});
  function troca(d){
    if(over) return;
    trilho = Math.max(0, Math.min(2, trilho + d));
    J.style.left = (trilho * 33.33 + 3.4) + "%";
    Z.snd(500, 0.03, "sine", 0.02);
  }
  function spawn(){
    var t = Z.rnd(0, 2);
    var el = document.createElement("div");
    var w = Z.rnd(40, 80);
    el.style.cssText = "position:absolute;width:56px;height:" + w + "px;border-radius:10px;background:linear-gradient(180deg,#ff5c5c,#b8343c);left:" + (t * 33.33 + 3.4) + "%;top:-60px;box-shadow:0 0 16px rgba(255,92,92,0.4)";
    ARENA.appendChild(el);
    obst.push({el: el, y: -60, t: t});
  }
  function fim(){
    over = true;
    Z.snd(140, 0.4, "sawtooth", 0.06);
    Z.toast("Fim! Pontuação: " + score, 3000);
    Z.store.setBest("esq-" + ${JSON.stringify(nome)}, Math.max(score, Z.store.best("esq-" + ${JSON.stringify(nome)}, 0)));
  }
  function loop(){
    if(over) return;
    vel += 0.0008;
    spawnT++;
    if(spawnT > ${60} && Math.random() < 0.02 + vel * 0.004){ spawn(); spawnT = 0 }
    var jy = ARENA.clientHeight - 36;
    obst.forEach(function(o){
      o.y += vel;
      o.el.style.top = o.y + "px";
      if(o.t === trilho && o.y > jy - 16 && o.y + 40 < jy + 40){
        o.el.remove();
        obst = obst.filter(function(x){ return x !== o });
        vidas--;
        document.getElementById("vidas").textContent = "Vermelho".repeat(vidas) || "Perda";
        J.style.boxShadow = "0 0 30px #ff5c5c";
        setTimeout(function(){ J.style.boxShadow = "0 0 20px " + corJ }, 200);
        Z.snd(180, 0.2, "sawtooth", 0.05);
        if(vidas <= 0) fim();
        return;
      }
      if(o.y > ARENA.clientHeight){
        o.el.remove();
        obst = obst.filter(function(x){ return x !== o });
        score++;
        document.getElementById("score").textContent = "Pontos: " + score;
      }
    });
    requestAnimationFrame(loop);
  }
  loop();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── PINTOR DE BLOCOS ──────────────────────────────────── */
export function pintor({ nome, sub, n }) {
  const CORES = ["#7c5cff", "#29e0ff", "#ff4d8f", "#7dff6a", "#ffd166"];
  const body = `
<div class="row mb" style="justify-content:center;gap:14px;flex-wrap:wrap">
  <div class="zcard center" style="padding:10px">
    <p class="zchip">Alvo</p>
    <div class="zgrid" id="alvo" style="grid-template-columns:repeat(${n},1fr);gap:3px;margin-top:8px"></div>
  </div>
  <div class="zcard center" style="padding:10px">
    <p class="zchip">Seu quadro</p>
    <div class="zgrid" id="seu" style="grid-template-columns:repeat(${n},1fr);gap:3px;margin-top:8px"></div>
  </div>
</div>
<div class="zgrid mb" id="paleta" style="grid-template-columns:repeat(5,1fr);max-width:420px;margin:0 auto;gap:8px"></div>
<div class="row center" style="justify-content:center">
  <span class="zchip">Progresso: <b class="acc" id="pct">0%</b></span>
</div>
<div class="row mt center" style="justify-content:center"><button class="zbtn sm" id="nova" type="button">Novo quadro</button></div>`;
  const js = `
(function(){
  var N = ${n};
  var CORES = ${JSON.stringify(CORES)};
  var alvo = [], atual = [], corSel = 0;
  function $id(x){return document.getElementById(x)}
  function novo(){
    alvo = []; atual = [];
    for(var i = 0; i < N * N; i++){
      alvo.push(CORES[Z.rnd(0, CORES.length - 1)]);
      atual.push(null);
    }
    pintar();
  }
  function pintar(){
    var a = $id("alvo"); a.innerHTML = "";
    var s = $id("seu"); s.innerHTML = "";
    var ok = 0;
    for(var i = 0; i < N * N; i++){
      var d1 = document.createElement("div");
      d1.style.cssText = "aspect-ratio:1;border-radius:6px;background:" + alvo[i];
      a.appendChild(d1);
      var d2 = document.createElement("div");
      d2.style.cssText = "aspect-ratio:1;border-radius:6px;cursor:pointer;background:" + (atual[i] || "var(--z-surface2)") + (atual[i] === alvo[i] ? ";box-shadow:inset 0 0 0 2px var(--z-lime)" : "");
      (function(i2){
        d2.addEventListener("click", function(){
          atual[i2] = CORES[corSel];
          Z.snd(600, 0.03, "sine", 0.02);
          pintar();
        });
      })(i);
      s.appendChild(d2);
      if(atual[i] === alvo[i]) ok++;
    }
    var pct = Math.round(ok / (N * N) * 100);
    $id("pct").textContent = pct + "%";
    if(pct === 100){
      Z.toast("Vitória Quadro perfeito!", 3000);
      Z.snd(1040, 0.3, "triangle", 0.06);
    }
  }
  var pal = $id("paleta");
  CORES.forEach(function(c, i){
    var b = document.createElement("button");
    b.className = "zbtn";
    b.style.cssText = "height:44px;padding:0;background:" + c + ";border:" + (i === 0 ? "3px solid #fff" : "3px solid transparent");
    b.addEventListener("click", function(){
      corSel = i;
      Array.prototype.slice.call(pal.children).forEach(function(x, k){
        x.style.border = k === i ? "3px solid #fff" : "3px solid transparent";
      });
      Z.snd(700, 0.03, "sine", 0.02);
    });
    pal.appendChild(b);
  });
  $id("nova").addEventListener("click", novo);
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── TAP NO BEAT ───────────────────────────────────────── */
export function tapTempo({ nome, sub }) {
  const body = `
<div class="zcard pad center" style="max-width:480px;margin:0 auto">
  <p class="dim mb">Toque no ritmo! O app mede seu BPM e a precisão (variação).</p>
  <div class="zbig acc mb" id="bpm">—</div>
  <div class="row" style="justify-content:center;gap:14px">
    <div class="zstat"><span>Precisão</span><b id="prec">—</b></div>
    <div class="zstat"><span>Toques</span><b id="n">0</b></div>
  </div>
  <button class="zbtn big mt" id="tap" type="button" style="width:200px">Bateria TAP</button>
  <div class="row mt center" style="justify-content:center"><button class="zbtn ghost sm" id="zerar" type="button">Zerar</button></div>
</div>`;
  const js = `
(function(){
  var tempos = [];
  function $id(x){return document.getElementById(x)}
  function atualizar(){
    var n = tempos.length;
    if(n < 2){
      $id("bpm").textContent = "—";
      $id("prec").textContent = "—";
    } else {
      var deltas = [];
      for(var i = 1; i < n; i++) deltas.push(tempos[i] - tempos[i-1]);
      var media = deltas.reduce(function(a, b){ return a + b }, 0) / deltas.length;
      var bpm = Math.round(60000 / media);
      var variacao = Math.sqrt(deltas.reduce(function(a, b){ return a + Math.pow(b - media, 2) }, 0) / deltas.length) / media;
      $id("bpm").textContent = bpm;
      $id("prec").textContent = Math.round((1 - Math.min(variacao, 1)) * 100) + "%";
    }
    $id("n").textContent = n;
  }
  $id("tap").addEventListener("click", function(){
    var agora = performance.now();
    if(tempos.length && agora - tempos[tempos.length - 1] > 2000) tempos = [];
    tempos.push(agora);
    if(tempos.length > 30) tempos.shift();
    Z.snd(700, 0.03, "square", 0.03);
    atualizar();
  });
  $id("zerar").addEventListener("click", function(){
    tempos = [];
    atualizar();
  });
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── PEGA-QUEDAS ───────────────────────────────────────── */
export function pegaQuedas({ nome, sub, noite }) {
  const body = `
<div class="row mb" style="justify-content:center;gap:8px">
  <span class="zchip" id="score">Frutas: 0</span>
  <span class="zchip" id="vidas">VermelhoVermelhoVermelho</span>
</div>
<div style="max-width:380px;margin:0 auto;position:relative">
  <canvas class="zc" id="cv" width="340" height="420"></canvas>
  <div class="zmodal hidden" id="fim" style="position:absolute;inset:0;border-radius:16px">
    <div class="zbox"><h3>Fim de jogo</h3><p>Frutas: <b class="acc" id="fimScore">0</b></p><button class="zbtn" id="reinicia" type="button">Jogar de novo</button></div>
  </div>
</div>
<p class="dim center mt" style="font-size:12.5px">← → ou arraste o dedo · pegue Maçã Banana, fuja de Bomba</p>`;
  const js = `
(function(){
  var cv = document.getElementById("cv");
  var ctx = cv.getContext ? cv.getContext("2d") : null;
  if(!ctx){ cv.outerHTML = "<p class='dim center'>Seu navegador não suporta canvas.</p>"; return; }
  var W = 340, H = 420;
  var cx = W/2, itens, score, vidas, over, teclas = {};
  function novo(){
    cx = W/2; score = 0; vidas = 3; over = false; itens = [];
    document.getElementById("fim").classList.add("hidden");
    hud();
    requestAnimationFrame(loop);
  }
  function hud(){
    document.getElementById("score").textContent = "Frutas: " + score;
    document.getElementById("vidas").textContent = "Vermelho".repeat(vidas) || "Perda";
  }
  Z.onKey({ArrowLeft: function(){ teclas.l = true }, ArrowRight: function(){ teclas.r = true }});
  document.addEventListener("keyup", function(e){
    if(e.key === "ArrowLeft") teclas.l = false;
    if(e.key === "ArrowRight") teclas.r = false;
  });
  cv.addEventListener("touchmove", function(e){
    var r = cv.getBoundingClientRect();
    cx = (e.touches[0].clientX - r.left) * (W / r.width);
  }, {passive: true});
  cv.addEventListener("mousemove", function(e){
    var r = cv.getBoundingClientRect();
    cx = (e.clientX - r.left) * (W / r.width);
  });
  function fim(){
    over = true;
    Z.snd(140, 0.4, "sawtooth", 0.06);
    document.getElementById("fimScore").textContent = score;
    document.getElementById("fim").classList.remove("hidden");
  }
  function loop(){
    if(over) return;
    if(teclas.l) cx -= 5;
    if(teclas.r) cx += 5;
    cx = Math.max(24, Math.min(W - 24, cx));
    if(Math.random() < 0.028){
      var tipo = Math.random() < 0.18 ? "bomba" : Math.random() < 0.2 ? "banana" : "fruta";
      itens.push({x: Z.rnd(20, W - 20), y: -20, v: 1.6 + Math.random() * 1.6 + score * 0.03, tipo: tipo});
    }
    for(var i = itens.length - 1; i >= 0; i--){
      var it = itens[i];
      it.y += it.v;
      if(it.y > H - 46 && it.y < H - 10 && Math.abs(it.x - cx) < 26){
        if(it.tipo === "bomba"){
          vidas--;
          Z.snd(120, 0.25, "sawtooth", 0.06);
        } else {
          score += it.tipo === "banana" ? 3 : 1;
          Z.snd(it.tipo === "banana" ? 980 : 760, 0.05, "sine");
        }
        itens.splice(i, 1);
        hud();
        if(vidas <= 0){ fim(); return }
        continue;
      }
      if(it.y > H + 20) itens.splice(i, 1);
    }
    desenha();
    requestAnimationFrame(loop);
  }
  function desenha(){
    ctx.fillStyle = ${noite ? '"#070a1c"' : '"#0a0d1a"'};
    ctx.fillRect(0, 0, W, H);
    ctx.font = "26px sans-serif";
    ctx.textAlign = "center";
    itens.forEach(function(it){
      var emo = it.tipo === "bomba" ? "Bomba" : it.tipo === "banana" ? "Banana" : "Maçã";
      ctx.fillText(emo, it.x, it.y + 10);
    });
    ctx.font = "30px sans-serif";
    ctx.fillText("Cesta", cx, H - 14);
    ctx.textAlign = "left";
  }
  document.getElementById("reinicia").addEventListener("click", novo);
  novo();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

export const JOGOS = {
  snake, jogo2048, memoria, velha, minas, pong, simon, reflexos, cacador, forca,
  adivinhe, sudoku, quinze, asteroides, invasores, flappy, runner, alvo, pilha,
  stroop, boliche, dadoDuelo, blackjack, labirinto, bolhas, esquiva, pintor, tapTempo, pegaQuedas,
};
