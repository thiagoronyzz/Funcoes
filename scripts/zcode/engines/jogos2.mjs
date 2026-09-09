/* Zcode — ENGINES DE JOGOS 2 (Snake Arena, Memory Master, Campo Minado Pro, Retro Racer) */

/* 1. SNAKE ARENA ARCADE */
export function snakeArena({ titulo, sub }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad center">
  <div class="row between mb wrap">
    <span class="zstat"><span>Pontuação</span><b id="snScore">0</b></span>
    <span class="zstat"><span>Recorde</span><b id="snBest">0</b></span>
    <button class="zbtn" id="btnSnStart" type="button">▶ Jogar</button>
  </div>
  <canvas class="zc" id="cnvSn" width="600" height="400" style="max-width:100%"></canvas>
  <p class="dim mt" style="font-size:12px">Controles: Use as setas do teclado para mover a cobra</p>
</div>`;
  const js = `
var cnv = document.getElementById("cnvSn");
var ctx = cnv.getContext("2d");
var $q = function(id){return document.getElementById(id)};
var grid = 20, snake = [{x:10,y:10}], dir = {x:1,y:0}, food = {x:15,y:10}, score = 0, best = Z.store.best("snBest") || 0;
var running = false, timer = null;

$q("snBest").textContent = best;

function placeFood(){
  food.x = Math.floor(Math.random()*(cnv.width/grid));
  food.y = Math.floor(Math.random()*(cnv.height/grid));
}
function draw(){
  ctx.clearRect(0,0,cnv.width,cnv.height);
  // Comida
  ctx.fillStyle = "#873f32";
  ctx.fillRect(food.x*grid+2, food.y*grid+2, grid-4, grid-4);
  // Cobra
  snake.forEach(function(s, idx){
    ctx.fillStyle = idx === 0 ? "#3a7ca5" : "rgba(58,124,165,0.7)";
    ctx.fillRect(s.x*grid+1, s.y*grid+1, grid-2, grid-2);
  });
}
function step(){
  var head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
  if(head.x < 0 || head.x >= cnv.width/grid || head.y < 0 || head.y >= cnv.height/grid){
    gameOver(); return;
  }
  for(var i=0; i<snake.length; i++){
    if(snake[i].x === head.x && snake[i].y === head.y){ gameOver(); return; }
  }
  snake.unshift(head);
  if(head.x === food.x && head.y === food.y){
    score += 10; $q("snScore").textContent = score;
    Z.snd(600, 0.08); placeFood();
  } else snake.pop();
  draw();
}
function gameOver(){
  clearInterval(timer); running = false;
  if(score > best){ best = score; Z.store.setBest("snBest", best); $q("snBest").textContent = best; }
  Z.snd(150, 0.3, "sawtooth");
  Z.toast("Fim de Jogo! Pontos: " + score);
}
$q("btnSnStart").addEventListener("click", function(){
  snake = [{x:10,y:10}]; dir = {x:1,y:0}; score = 0; $q("snScore").textContent = 0;
  placeFood(); running = true;
  clearInterval(timer); timer = setInterval(step, 100);
});
Z.onKey({
  ArrowUp: function(){ if(dir.y===0) dir = {x:0,y:-1}; },
  ArrowDown: function(){ if(dir.y===0) dir = {x:0,y:1}; },
  ArrowLeft: function(){ if(dir.x===0) dir = {x:-1,y:0}; },
  ArrowRight: function(){ if(dir.x===0) dir = {x:1,y:0}; }
});
draw();
`;
  return { body, js };
}

/* 2. MEMORY MASTER RPG */
export function memoryMaster({ titulo, sub, deckIcons }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad center">
  <div class="row between mb">
    <span class="zstat"><span>Movimentos</span><b id="mmMov">0</b></span>
    <span class="zstat"><span>Pares Encontrados</span><b id="mmPares">0/8</b></span>
    <button class="zbtn" id="btnMmReset" type="button">🔄 Reiniciar</button>
  </div>
  <div id="gridMm" class="zgrid zg4" style="gap:12px;max-width:480px;margin:0 auto"></div>
</div>`;
  const js = `
var ICONS = ${JSON.stringify(deckIcons || ["🧠","⚛️","🔬","🧪","📐","🌍","🎨","🚀"])};
var $q = function(id){return document.getElementById(id)};
var cards = [], sel = [], pares = 0, movs = 0;

function init(){
  var deck = ICONS.concat(ICONS);
  deck.sort(function(){return Math.random()-0.5});
  var box = $q("gridMm"); box.innerHTML = "";
  cards = []; sel = []; pares = 0; movs = 0;
  $q("mmMov").textContent = 0; $q("mmPares").textContent = "0/" + ICONS.length;
  deck.forEach(function(icon, idx){
    var b = document.createElement("button");
    b.className = "zbtn ghost"; b.style.height = "80px"; b.style.fontSize = "28px";
    b.textContent = "❓";
    b.addEventListener("click", function(){ flip(b, icon, idx); });
    box.appendChild(b);
  });
}
function flip(btn, icon, idx){
  if(sel.length >= 2 || btn.disabled || sel.find(function(s){return s.btn === btn})) return;
  btn.textContent = icon;
  sel.push({ btn: btn, icon: icon });
  Z.snd(500, 0.05);
  if(sel.length === 2){
    movs++; $q("mmMov").textContent = movs;
    if(sel[0].icon === sel[1].icon){
      pares++; $q("mmPares").textContent = pares + "/" + ICONS.length;
      sel[0].btn.disabled = true; sel[1].btn.disabled = true;
      sel[0].btn.style.borderColor = "var(--z-lime)"; sel[1].btn.style.borderColor = "var(--z-lime)";
      sel = []; Z.snd(800, 0.1);
      if(pares === ICONS.length){ Z.toast("Parabéns! Você venceu em " + movs + " movimentos!"); }
    } else {
      setTimeout(function(){
        sel[0].btn.textContent = "❓"; sel[1].btn.textContent = "❓";
        sel = [];
      }, 800);
    }
  }
}
$q("btnMmReset").addEventListener("click", init);
init();
`;
  return { body, js };
}

/* 3. CAMPO MINADO PRO */
export function minesweeperPro({ titulo, sub }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad center">
  <div class="row between mb wrap">
    <span class="zstat"><span>Minas</span><b id="msMines">10</b></span>
    <button class="zbtn" id="btnMsReset" type="button">😀 Novo Jogo</button>
  </div>
  <div id="gridMs" class="zgrid" style="grid-template-columns:repeat(8,1fr);gap:6px;max-width:380px;margin:0 auto"></div>
</div>`;
  const js = `
var rows = 8, cols = 8, totalMines = 10;
var grid = [], revealed = 0;
var $q = function(id){return document.getElementById(id)};

function init(){
  var box = $q("gridMs"); box.innerHTML = "";
  grid = []; revealed = 0;
  for(var r=0; r<rows; r++){
    grid[r] = [];
    for(var c=0; c<cols; c++){
      grid[r][c] = { mine: false, count: 0, open: false, btn: null };
    }
  }
  // Colocar minas
  var placed = 0;
  while(placed < totalMines){
    var rr = Math.floor(Math.random()*rows), cc = Math.floor(Math.random()*cols);
    if(!grid[rr][cc].mine){ grid[rr][cc].mine = true; placed++; }
  }
  // Calcular vizinhos
  for(var r=0; r<rows; r++){
    for(var c=0; c<cols; c++){
      if(grid[r][c].mine) continue;
      var count = 0;
      for(var dr=-1; dr<=1; dr++){
        for(var dc=-1; dc<=1; dc++){
          var nr = r+dr, nc = c+dc;
          if(nr>=0 && nr<rows && nc>=0 && nc<cols && grid[nr][nc].mine) count++;
        }
      }
      grid[r][c].count = count;
    }
  }
  // Criar botões
  for(var r=0; r<rows; r++){
    for(var c=0; c<cols; c++){
      (function(rr, cc){
        var b = document.createElement("button");
        b.className = "zbtn ghost sm"; b.style.height = "42px"; b.style.padding = "0";
        b.addEventListener("click", function(){ openCell(rr, cc); });
        grid[rr][cc].btn = b;
        box.appendChild(b);
      })(r, c);
    }
  }
}
function openCell(r, c){
  var cell = grid[r][c];
  if(cell.open) return;
  cell.open = true;
  cell.btn.disabled = true;
  if(cell.mine){
    cell.btn.textContent = "💣"; cell.btn.style.background = "var(--z-red)";
    Z.snd(120, 0.3, "sawtooth"); Z.toast("Bomba! Fim de Jogo!");
  } else {
    cell.btn.textContent = cell.count > 0 ? cell.count : "";
    cell.btn.style.background = "var(--z-surface2)";
    Z.snd(600, 0.05);
    if(cell.count === 0){
      for(var dr=-1; dr<=1; dr++){
        for(var dc=-1; dc<=1; dc++){
          var nr = r+dr, nc = c+dc;
          if(nr>=0 && nr<rows && nc>=0 && nc<cols) openCell(nr, nc);
        }
      }
    }
  }
}
$q("btnMsReset").addEventListener("click", init);
init();
`;
  return { body, js };
}

export const JOGOS2 = {
  snakeArena,
  memoryMaster,
  minesweeperPro,
};
