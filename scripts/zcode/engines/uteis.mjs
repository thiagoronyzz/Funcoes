/* Zcode — ENGINES DE ÚTEIS (Produtividade, Dev Tools, Layouts) */

/* 1. QUADRO KANBAN PRO */
export function kanban({ titulo, sub }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad mb">
  <div class="row wrap between mb">
    <input type="text" class="zinput" id="taskInput" placeholder="Nova tarefa para fazer..." style="max-width:380px">
    <button class="zbtn" id="btnAddTask" type="button">+ Adicionar Tarefa</button>
  </div>
  <div class="zgrid zg3" style="gap:16px">
    <div class="zcard" style="background:var(--z-surface2)">
      <b class="fd" style="font-size:16px">📋 A Fazer</b>
      <div id="colTodo" class="col mt" style="min-height:200px"></div>
    </div>
    <div class="zcard" style="background:var(--z-surface2)">
      <b class="fd" style="font-size:16px;color:var(--z-amber)">⚡ Em Andamento</b>
      <div id="colDoing" class="col mt" style="min-height:200px"></div>
    </div>
    <div class="zcard" style="background:var(--z-surface2)">
      <b class="fd" style="font-size:16px;color:var(--z-lime)">✅ Concluído</b>
      <div id="colDone" class="col mt" style="min-height:200px"></div>
    </div>
  </div>
</div>`;
  const js = `
var tasks = Z.store.get("kanban_tasks", [
  { id: 1, text: "Pesquisar referências do projeto", status: "todo" },
  { id: 2, text: "Desenvolver protótipo da interface", status: "doing" },
  { id: 3, text: "Validar requisitos do cliente", status: "done" }
]);
var $q = function(id){return document.getElementById(id)};
function save(){ Z.store.set("kanban_tasks", tasks); render(); }
function render(){
  ["Todo","Doing","Done"].forEach(function(s){ $q("col"+s).innerHTML = ""; });
  tasks.forEach(function(t){
    var el = document.createElement("div");
    el.className = "zcard"; el.style.padding = "12px";
    el.innerHTML = "<p style='font-size:14px;margin-bottom:8px'>"+t.text+"</p><div class='row between'>" +
      (t.status !== "todo" ? "<button class='zbtn sm ghost' onclick='moveTask("+t.id+",\"prev\")'>←</button>" : "<span></span>") +
      "<button class='zbtn sm danger' onclick='delTask("+t.id+")'>✕</button>" +
      (t.status !== "done" ? "<button class='zbtn sm ghost' onclick='moveTask("+t.id+",\"next\")'>→</button>" : "<span></span>") +
      "</div>";
    var colId = t.status === "todo" ? "colTodo" : (t.status === "doing" ? "colDoing" : "colDone");
    $q(colId).appendChild(el);
  });
}
window.moveTask = function(id, dir){
  var t = tasks.find(function(x){return x.id === id});
  if(!t) return;
  if(dir === "next") t.status = t.status === "todo" ? "doing" : "done";
  else t.status = t.status === "done" ? "doing" : "todo";
  save();
};
window.delTask = function(id){
  tasks = tasks.filter(function(x){return x.id !== id});
  save();
};
$q("btnAddTask").addEventListener("click", function(){
  var val = $q("taskInput").value.trim();
  if(!val) return;
  tasks.push({ id: Date.now(), text: val, status: "todo" });
  $q("taskInput").value = "";
  save();
});
render();
`;
  return { body, js };
}

/* 2. CENTRAL DE CONVERSÃO DE UNIDADES COMPLETA */
export function converterHub({ titulo, sub }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad">
  <div class="zgrid zg3 mb">
    <div class="col">
      <label class="zlabel">Categoria de Unidade:</label>
      <select class="zselect" id="catUnits">
        <option value="comprimento">Comprimento (m, km, milhas, pés)</option>
        <option value="massa">Massa / Peso (kg, g, lbs, oz)</option>
        <option value="temperatura">Temperatura (°C, °F, K)</option>
        <option value="dados">Armazenamento (B, KB, MB, GB, TB)</option>
      </select>
    </div>
    <div class="col">
      <label class="zlabel">De:</label>
      <select class="zselect" id="uFrom"></select>
    </div>
    <div class="col">
      <label class="zlabel">Para:</label>
      <select class="zselect" id="uTo"></select>
    </div>
  </div>
  <div class="zgrid zg2 mb">
    <div class="col">
      <label class="zlabel">Valor de Entrada:</label>
      <input type="number" class="zinput" id="vIn" value="1">
    </div>
    <div class="col">
      <label class="zlabel">Resultado Convertido:</label>
      <div class="zinput" id="vOut" style="background:var(--z-surface2);font-weight:700;font-size:18px;color:var(--z-acc)">0</div>
    </div>
  </div>
</div>`;
  const js = `
var UNITS = {
  comprimento: {
    m: 1, km: 1000, cm: 0.01, mm: 0.001, milha: 1609.34, pe: 0.3048, polegada: 0.0254
  },
  massa: {
    kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, ton: 1000
  },
  dados: {
    B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776
  }
};
var $q = function(id){return document.getElementById(id)};
function loadOpts(){
  var cat = $q("catUnits").value;
  var f = $q("uFrom"), t = $q("uTo");
  f.innerHTML = ""; t.innerHTML = "";
  if(cat === "temperatura"){
    ["°C","°F","K"].forEach(function(u){
      f.appendChild(new Option(u,u)); t.appendChild(new Option(u,u));
    });
    t.selectedIndex = 1;
  } else {
    Object.keys(UNITS[cat]).forEach(function(u){
      f.appendChild(new Option(u,u)); t.appendChild(new Option(u,u));
    });
    t.selectedIndex = 1;
  }
  convert();
}
function convert(){
  var cat = $q("catUnits").value;
  var val = parseFloat($q("vIn").value) || 0;
  var from = $q("uFrom").value;
  var to = $q("uTo").value;
  var res = 0;
  if(cat === "temperatura"){
    if(from === to) res = val;
    else if(from === "°C" && to === "°F") res = (val * 9/5) + 32;
    else if(from === "°C" && to === "K") res = val + 273.15;
    else if(from === "°F" && to === "°C") res = (val - 32) * 5/9;
    else if(from === "°F" && to === "K") res = (val - 32) * 5/9 + 273.15;
    else if(from === "K" && to === "°C") res = val - 273.15;
    else if(from === "K" && to === "°F") res = (val - 273.15) * 9/5 + 32;
  } else {
    var inBase = val * UNITS[cat][from];
    res = inBase / UNITS[cat][to];
  }
  $q("vOut").textContent = Z.fmt(res, 4) + " " + to;
}
$q("catUnits").addEventListener("change", loadOpts);
["uFrom","uTo","vIn"].forEach(function(id){ $q(id).addEventListener("input", convert); });
loadOpts();
`;
  return { body, js };
}

/* 3. TESTADOR DE EXPRESSÕES REGULARES (REGEX) */
export function regexTester({ titulo, sub }) {
  const body = `
<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>
<div class="zcard pad col" style="gap:14px">
  <div class="row wrap gap">
    <input type="text" class="zinput" id="rgPattern" value="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}" placeholder="Expressão Regex..." style="flex:2;font-family:var(--z-fm)">
    <input type="text" class="zinput" id="rgFlags" value="g" placeholder="Flags (g, i, m)" style="flex:0.5;font-family:var(--z-fm)">
  </div>
  <label class="zlabel">Texto de Teste:</label>
  <textarea class="ztextarea" id="rgText" style="min-height:160px">Entre em contato pelo e-mail contato@exemplo.com ou suporte@plataforma.org para dúvidas.</textarea>
  <div class="zcard" style="background:var(--z-surface2)">
    <b class="fd">Resultados Encontrados:</b>
    <div id="rgMatches" class="col mt" style="gap:6px"></div>
  </div>
</div>`;
  const js = `
var $q = function(id){return document.getElementById(id)};
function test(){
  var pat = $q("rgPattern").value;
  var flags = $q("rgFlags").value;
  var txt = $q("rgText").value;
  var box = $q("rgMatches"); box.innerHTML = "";
  try {
    var re = new RegExp(pat, flags);
    var matches = txt.match(re);
    if(!matches || matches.length === 0){
      box.innerHTML = "<p class='dim'>Nenhuma correspondência encontrada.</p>";
    } else {
      matches.forEach(function(m, i){
        var el = document.createElement("div");
        el.className = "zchip"; el.style.alignSelf = "flex-start";
        el.textContent = "#" + (i+1) + ": " + m;
        box.appendChild(el);
      });
    }
  } catch(e) {
    box.innerHTML = "<p style='color:var(--z-red)'>Sintaxe Regex Inválida: "+e.message+"</p>";
  }
}
["rgPattern","rgFlags","rgText"].forEach(function(id){ $q(id).addEventListener("input", test); });
test();
`;
  return { body, js };
}

export const UTEIS1 = {
  kanban,
  converterHub,
  regexTester,
};
