/* Zcode — ENGINES DE ÚTEIS 2 (Finanças, Design, Utilitários Domésticos, Geradores) */

/* 1. SIMULADOR DE JUROS COMPOSTOS & PATRIMÔNIO */
export function jurosCompostos({ titulo, sub }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad">
  <div class="zgrid zg3 mb">
    <div class="col">
      <label class="zlabel">Aporte Inicial (R$):</label>
      <input type="number" class="zinput" id="jInit" value="5000">
    </div>
    <div class="col">
      <label class="zlabel">Aporte Mensal (R$):</label>
      <input type="number" class="zinput" id="jMonthly" value="500">
    </div>
    <div class="col">
      <label class="zlabel">Taxa de Juros Anual (%):</label>
      <input type="number" class="zinput" id="jRate" value="12" step="0.1">
    </div>
  </div>
  <div class="zgrid zg2 mb">
    <div class="col">
      <label class="zlabel">Período (Anos):</label>
      <input type="range" class="zrange" id="jYears" min="1" max="40" value="10">
      <span class="dim mt" id="valYears">10 anos</span>
    </div>
  </div>
  <canvas class="zc mb" id="cnvJuros" width="800" height="300"></canvas>
  <div class="row between wrap">
    <span class="zstat"><span>Total Investido</span><b id="stInvest">R$ 0</b></span>
    <span class="zstat"><span>Juros Acumulados</span><b id="stJuros" style="color:var(--z-lime)">R$ 0</b></span>
    <span class="zstat"><span>Montante Final</span><b id="stTotal" class="acc" style="font-size:24px">R$ 0</b></span>
  </div>
</div>`;
  const js = `
var cnv = document.getElementById("cnvJuros");
var ctx = cnv.getContext("2d");
var $q = function(id){return document.getElementById(id)};
function calc(){
  var init = parseFloat($q("jInit").value) || 0;
  var monthly = parseFloat($q("jMonthly").value) || 0;
  var rateYr = parseFloat($q("jRate").value) || 0;
  var years = parseInt($q("jYears").value) || 1;
  $q("valYears").textContent = years + " anos (" + (years*12) + " meses)";
  var rateMo = Math.pow(1 + rateYr/100, 1/12) - 1;
  var months = years * 12;
  var history = [];
  var curr = init;
  var invested = init;
  for(var m=0; m<=months; m++){
    history.push({ m: m, total: curr, invested: invested });
    curr = curr * (1 + rateMo) + monthly;
    invested += monthly;
  }
  var last = history[history.length-1];
  var juros = last.total - last.invested;
  $q("stInvest").textContent = "R$ " + Z.fmt(last.invested, 2);
  $q("stJuros").textContent = "R$ " + Z.fmt(juros, 2);
  $q("stTotal").textContent = "R$ " + Z.fmt(last.total, 2);
  draw(history);
}
function draw(h){
  ctx.clearRect(0,0,cnv.width,cnv.height);
  var maxV = h[h.length-1].total * 1.1;
  var w = cnv.width / (h.length - 1);
  // Desenhar área investida
  ctx.fillStyle = "rgba(58,124,165,0.2)";
  ctx.beginPath(); ctx.moveTo(0, cnv.height);
  h.forEach(function(pt, i){
    var y = cnv.height - (pt.invested / maxV) * cnv.height;
    ctx.lineTo(i*w, y);
  });
  ctx.lineTo(cnv.width, cnv.height); ctx.fill();
  // Desenhar linha de montante total
  ctx.strokeStyle = "#873f32"; ctx.lineWidth = 3;
  ctx.beginPath();
  h.forEach(function(pt, i){
    var y = cnv.height - (pt.total / maxV) * cnv.height;
    if(i === 0) ctx.moveTo(0, y); else ctx.lineTo(i*w, y);
  });
  ctx.stroke();
}
["jInit","jMonthly","jRate","jYears"].forEach(function(id){ $q(id).addEventListener("input", calc); });
calc();
`;
  return { body, js };
}

/* 2. GERADOR DE SENHAS FORTES & FRASES */
export function pwdGenerator({ titulo, sub }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad col" style="gap:14px">
  <div class="row between">
    <div class="zinput" id="pwdRes" style="font-family:var(--z-fm);font-weight:700;font-size:20px;letter-spacing:1px;background:var(--z-surface2)">...</div>
    <button class="zbtn" id="btnCopyPwd" type="button">📋 Copiar</button>
  </div>
  <div class="row wrap between">
    <div class="col" style="flex:1;min-width:180px">
      <label class="zlabel">Tamanho da Senha: <b id="valLen">16</b></label>
      <input type="range" class="zrange" id="pwdLen" min="8" max="64" value="16">
    </div>
  </div>
  <div class="row wrap gap" style="gap:16px">
    <label class="row"><input type="checkbox" id="chkUpper" checked> Maiúsculas (A-Z)</label>
    <label class="row"><input type="checkbox" id="chkLower" checked> Minúsculas (a-z)</label>
    <label class="row"><input type="checkbox" id="chkNum" checked> Números (0-9)</label>
    <label class="row"><input type="checkbox" id="chkSym" checked> Símbolos (!@#$)</label>
  </div>
  <button class="zbtn ghost" id="btnGenPwd" type="button">🔄 Gerar Nova Senha</button>
</div>`;
  const js = `
var $q = function(id){return document.getElementById(id)};
function gen(){
  var len = parseInt($q("pwdLen").value);
  $q("valLen").textContent = len;
  var u = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var l = "abcdefghijklmnopqrstuvwxyz";
  var n = "0123456789";
  var s = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  var set = "";
  if($q("chkUpper").checked) set += u;
  if($q("chkLower").checked) set += l;
  if($q("chkNum").checked) set += n;
  if($q("chkSym").checked) set += s;
  if(!set) set = l + n;
  var res = "";
  for(var i=0; i<len; i++) res += set.charAt(Math.floor(Math.random() * set.length));
  $q("pwdRes").textContent = res;
}
["pwdLen","chkUpper","chkLower","chkNum","chkSym"].forEach(function(id){ $q(id).addEventListener("input", gen); });
$q("btnGenPwd").addEventListener("click", gen);
$q("btnCopyPwd").addEventListener("click", function(){ Z.copy($q("pwdRes").textContent); });
gen();
`;
  return { body, js };
}

/* 3. FORMATADOR & COMPRESSOR JSON */
export function jsonFormatter({ titulo, sub }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad col" style="gap:12px">
  <div class="row wrap between">
    <span class="zlabel">Código JSON:</span>
    <div class="row" style="gap:10px">
      <button class="zbtn sm" id="btnFmtJson" type="button">Indentado (2 Espaços)</button>
      <button class="zbtn sm ghost" id="btnMinJson" type="button">Minificar / Comprimir</button>
    </div>
  </div>
  <textarea class="ztextarea" id="jsonArea" style="min-height:260px" placeholder='{"nome":"Zcode","status":"ativo"}'></textarea>
  <div id="jsonMsg" class="dim" style="font-size:13px"></div>
</div>`;
  const js = `
var $q = function(id){return document.getElementById(id)};
function process(space){
  var txt = $q("jsonArea").value;
  try {
    var obj = JSON.parse(txt);
    $q("jsonArea").value = JSON.stringify(obj, null, space);
    $q("jsonMsg").style.color = "var(--z-lime)";
    $q("jsonMsg").textContent = "✓ JSON Válido e Formatado com sucesso!";
  } catch(e) {
    $q("jsonMsg").style.color = "var(--z-red)";
    $q("jsonMsg").textContent = "✕ Erro no JSON: " + e.message;
  }
}
$q("btnFmtJson").addEventListener("click", function(){ process(2); });
$q("btnMinJson").addEventListener("click", function(){ process(0); });
`;
  return { body, js };
}

export const UTEIS2 = {
  jurosCompostos,
  pwdGenerator,
  jsonFormatter,
};
