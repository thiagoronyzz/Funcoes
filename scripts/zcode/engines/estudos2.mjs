/* Zcode — ENGINES DE ESTUDOS 2 (Linhas do Tempo, Atlas, Redação, Código, Algoritmos) */

/* 1. LINHA DO TEMPO HISTÓRICA INTERATIVA */
export function timelineHist({ titulo, sub, eventos }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad mb">
  <div class="row wrap between mb">
    <input type="text" class="zinput" id="buscHist" placeholder="Filtrar eventos históricos..." style="max-width:320px">
    <span class="zchip" id="totEv">0 eventos</span>
  </div>
  <div id="timelineBox" class="col" style="gap:16px"></div>
</div>`;
  const js = `
var EV = ${JSON.stringify(eventos)};
var $q = function(id){return document.getElementById(id)};
function render(f){
  var box = $q("timelineBox"); box.innerHTML = "";
  var list = EV.filter(function(e){
    return !f || (e.ano + " " + e.titulo + " " + e.desc).toLowerCase().indexOf(f.toLowerCase()) >= 0;
  });
  $q("totEv").textContent = list.length + " eventos";
  list.forEach(function(e){
    var el = document.createElement("div");
    el.className = "zcard";
    el.style.borderLeft = "4px solid var(--z-acc)";
    el.innerHTML = "<div class='row between mb'><span class='zchip'>"+e.ano+"</span><b class='fd' style='font-size:17px'>"+e.titulo+"</b></div><p class='dim' style='font-size:14px;line-height:1.5'>"+e.desc+"</p>" + (e.tag ? "<span class='zbadge mt'>"+e.tag+"</span>" : "");
    box.appendChild(el);
  });
}
$q("buscHist").addEventListener("input", function(){ render(this.value); });
render("");
`;
  return { body, js };
}

/* 2. ATLAS GEOGRÁFICO & DADOS DE PAÍSES */
export function atlasGeo({ titulo, sub, paises }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zgrid zg2 mb">
  <div class="zcard pad">
    <label class="zlabel">Selecione o País / Região:</label>
    <select class="zselect" id="selPais"></select>
    <div id="detalhesPais" class="mt col" style="gap:10px"></div>
  </div>
  <div class="zcard pad center" id="quizPaisBox">
    <span class="zchip mb">Desafio de Geografia</span>
    <h3 class="fd mb" id="qPaisTitle">Qual é a capital?</h3>
    <div class="col" id="optsPais"></div>
    <span class="zchip mt" id="scPais">Pontos: 0</span>
  </div>
</div>`;
  const js = `
var LIST = ${JSON.stringify(paises)};
var $q = function(id){return document.getElementById(id)};
var score = 0;
var sel = $q("selPais");
LIST.forEach(function(p, i){
  var op = document.createElement("option");
  op.value = i; op.textContent = p.nome + " (" + p.continente + ")";
  sel.appendChild(op);
});
function showPais(idx){
  var p = LIST[idx];
  $q("detalhesPais").innerHTML =
    "<h2 class='fd' style='font-size:26px'>" + p.nome + "</h2>" +
    "<p><b>Capital:</b> " + p.capital + "</p>" +
    "<p><b>População:</b> " + p.pop + "</p>" +
    "<p><b>Idioma:</b> " + p.idioma + "</p>" +
    "<p><b>Moeda:</b> " + p.moeda + "</p>" +
    "<p class='dim mt' style='font-size:13.5px'>" + (p.curiosidade || "") + "</p>";
}
function newQuiz(){
  var p = LIST[Math.floor(Math.random()*LIST.length)];
  $q("qPaisTitle").textContent = "Qual é a capital de " + p.nome + "?";
  var optsBox = $q("optsPais"); optsBox.innerHTML = "";
  var caps = [p.capital];
  while(caps.length < 4){
    var r = LIST[Math.floor(Math.random()*LIST.length)].capital;
    if(caps.indexOf(r) < 0) caps.push(r);
  }
  caps.sort(function(){return Math.random()-0.5});
  caps.forEach(function(c){
    var b = document.createElement("button");
    b.className = "zbtn ghost w"; b.type = "button"; b.textContent = c;
    b.addEventListener("click", function(){
      if(c === p.capital){ score += 10; Z.snd(800,0.1); Z.toast("Correto! +10 pts"); }
      else { Z.snd(200,0.2); Z.toast("Incorreto! A resposta era "+p.capital); }
      $q("scPais").textContent = "Pontos: " + score;
      newQuiz();
    });
    optsBox.appendChild(b);
  });
}
sel.addEventListener("change", function(){ showPais(this.value); });
showPais(0); newQuiz();
`;
  return { body, js };
}

/* 3. LABORATÓRIO DE REDAÇÃO & ARGUMENTAÇÃO */
export function redacaoLab({ titulo, sub }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zgrid zg2">
  <div class="zcard pad">
    <label class="zlabel">Título / Tema da Redação:</label>
    <input type="text" class="zinput mb" id="tema" value="O impacto da inteligência artificial na educação">
    <label class="zlabel">Texto da Redação (Rascunho):</label>
    <textarea class="ztextarea" id="textoRed" style="min-height:220px" placeholder="Escreva seu texto aqui..."></textarea>
  </div>
  <div class="zcard pad col" style="gap:12px">
    <span class="zchip">Análise de Estrutura & Métricas</span>
    <div class="row between"><span class="dim">Total de Palavras:</span><b id="mPalavras">0</b></div>
    <div class="row between"><span class="dim">Parágrafos:</span><b id="mParagrafos">0</b></div>
    <div class="row between"><span class="dim">Conectivos Coesivos:</span><b id="mConectivos">0</b></div>
    <div class="row between"><span class="dim">Nota Estimada (0-1000):</span><b id="mNota" class="acc" style="font-size:22px">0</b></div>
    <div class="zcard mt" style="background:var(--z-surface2)">
      <b style="font-size:13px">Dicas de Conectivos:</b>
      <p class="dim mt" style="font-size:12px">Adição: além disso, ademais | Conclusão: portanto, em suma | Oposição: contudo, no entanto.</p>
    </div>
  </div>
</div>`;
  const js = `
var $q = function(id){return document.getElementById(id)};
var conectivosList = ["portanto","ademais","outrossim","contudo","entretanto","no entanto","em suma","por conseguinte","porém","além disso"];
function analisar(){
  var txt = $q("textoRed").value.trim();
  if(!txt){
    $q("mPalavras").textContent = "0"; $q("mParagrafos").textContent = "0";
    $q("mConectivos").textContent = "0"; $q("mNota").textContent = "0";
    return;
  }
  var palavras = txt.split(/\\s+/).filter(Boolean).length;
  var paragrafos = txt.split(/\\n+/).filter(Boolean).length;
  var lower = txt.toLowerCase();
  var conectivos = 0;
  conectivosList.forEach(function(c){ if(lower.indexOf(c) >= 0) conectivos++; });
  var nota = Math.min(1000, Math.round((palavras * 2) + (paragrafos * 80) + (conectivos * 60)));
  $q("mPalavras").textContent = palavras;
  $q("mParagrafos").textContent = paragrafos;
  $q("mConectivos").textContent = conectivos;
  $q("mNota").textContent = nota;
}
$q("textoRed").addEventListener("input", analisar);
`;
  return { body, js };
}

/* 4. PLAYGROUND DE CÓDIGO HTML/CSS/JS */
export function codePlayground({ titulo, sub, codeInicial }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zgrid zg2">
  <div class="zcard pad col" style="gap:10px">
    <div class="row between">
      <span class="zlabel">Editor de Código</span>
      <button class="zbtn sm" id="btnRodar" type="button">▶ Executar</button>
    </div>
    <textarea class="ztextarea" id="srcCode" style="min-height:300px;font-family:var(--z-fm);font-size:13px">${codeInicial || `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: sans-serif; background: #252422; color: #fff; padding: 20px; text-align: center; }
  h1 { color: #29e0ff; }
  button { padding: 10px 20px; font-size: 16px; background: #7c5cff; border: 0; color: #fff; border-radius: 8px; cursor: pointer; }
</style>
</head>
<body>
  <h1>Meu Primeiro App Zcode</h1>
  <p>Clique no botão para testar a interatividade:</p>
  <button onclick="alert('Funciona perfeitamente!')">Testar Clique</button>
</body>
</html>`}</textarea>
  </div>
  <div class="zcard pad col" style="gap:10px">
    <span class="zlabel">Resultado em Tempo Real (Preview)</span>
    <iframe id="previewIframe" style="width:100%;height:320px;border:1px solid var(--z-line2);border-radius:8px;background:#fff"></iframe>
  </div>
</div>`;
  const js = `
var $q = function(id){return document.getElementById(id)};
function runCode(){
  var html = $q("srcCode").value;
  var frame = $q("previewIframe");
  frame.srcdoc = html;
}
$q("btnRodar").addEventListener("click", runCode);
$q("srcCode").addEventListener("input", function(){ clearTimeout(window.runT); window.runT = setTimeout(runCode, 500); });
runCode();
`;
  return { body, js };
}

/* 5. VISUALIZADOR DE ALGORITMOS & ESTRUTURAS DE DADOS */
export function algoVisualizer({ titulo, sub }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad">
  <div class="row wrap between mb">
    <div class="col" style="flex:1">
      <label class="zlabel">Algoritmo:</label>
      <select class="zselect" id="selAlgo">
        <option value="bubble">Bubble Sort</option>
        <option value="selection">Selection Sort</option>
        <option value="insertion">Insertion Sort</option>
      </select>
    </div>
    <div class="row" style="gap:10px;align-self:flex-end">
      <button class="zbtn" id="btnSort" type="button">▶ Ordenar</button>
      <button class="zbtn ghost" id="btnReset" type="button">Embaralhar</button>
    </div>
  </div>
  <canvas class="zc" id="cnvAlgo" width="800" height="320"></canvas>
  <div class="row between mt">
    <span class="zstat"><span>Comparações</span><b id="stComp">0</b></span>
    <span class="zstat"><span>Trocas</span><b id="stTrocas">0</b></span>
  </div>
</div>`;
  const js = `
var cnv = document.getElementById("cnvAlgo");
var ctx = cnv.getContext("2d");
var $q = function(id){return document.getElementById(id)};
var arr = [], comp = 0, trocas = 0, ordenando = false;
function resetArr(){
  arr = []; comp = 0; trocas = 0; ordenando = false;
  for(var i=0; i<30; i++) arr.push(Z.rnd(10, 100));
  $q("stComp").textContent = "0"; $q("stTrocas").textContent = "0";
  draw([]);
}
function draw(highlight){
  ctx.clearRect(0,0,cnv.width,cnv.height);
  var w = cnv.width / arr.length;
  arr.forEach(function(val, i){
    var h = (val / 100) * (cnv.height - 40);
    ctx.fillStyle = (highlight.indexOf(i) >= 0) ? "#873f32" : "#3a7ca5";
    ctx.fillRect(i*w + 2, cnv.height - h, w - 4, h);
  });
}
async function bubbleSort(){
  ordenando = true;
  for(var i=0; i<arr.length; i++){
    for(var j=0; j<arr.length-i-1; j++){
      if(!ordenando) return;
      comp++; $q("stComp").textContent = comp;
      draw([j, j+1]);
      if(arr[j] > arr[j+1]){
        var t = arr[j]; arr[j] = arr[j+1]; arr[j+1] = t;
        trocas++; $q("stTrocas").textContent = trocas;
        Z.snd(200 + arr[j]*5, 0.03);
      }
      await new Promise(function(r){setTimeout(r, 40)});
    }
  }
  draw([]); Z.toast("Ordenação Concluída!"); ordenando = false;
}
$q("btnSort").addEventListener("click", bubbleSort);
$q("btnReset").addEventListener("click", resetArr);
resetArr();
`;
  return { body, js };
}

export const ESTUDOS2 = {
  timelineHist,
  atlasGeo,
  redacaoLab,
  codePlayground,
  algoVisualizer,
};
