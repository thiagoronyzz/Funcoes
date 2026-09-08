/* Zcode — engines de Úteis (parte 3) */
import { NOMES_PERSONAGEM, FRASES } from "../data/uteis.mjs";

/* ── CSS PLAYGROUNDS ────────────────────────────────────── */
export function cssShadow({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <div class="zcard mb" style="background:var(--z-bg2);display:grid;place-items:center;height:180px"><div id="prev" style="width:120px;height:120px;border-radius:18px;background:var(--z-brand);transition:box-shadow .2s"></div></div>
  <div class="zgrid zg3 mb" style="gap:10px">
    <div><span class="zlabel">X (px)</span><input class="zinput" id="x" type="number" value="0"></div>
    <div><span class="zlabel">Y (px)</span><input class="zinput" id="y" type="number" value="12"></div>
    <div><span class="zlabel">Blur (px)</span><input class="zinput" id="blur" type="number" value="24"></div>
    <div><span class="zlabel">Spread (px)</span><input class="zinput" id="spread" type="number" value="0"></div>
    <div><span class="zlabel">Cor</span><input type="color" id="cor" value="#7c5cff" style="width:100%;height:42px;border-radius:10px;border:1px solid var(--z-line2);background:var(--z-surface2)"></div>
    <div class="row" style="align-items:flex-end"><label class="zcard row grow" style="padding:10px;cursor:pointer"><input type="checkbox" id="inset"> <span>Inset</span></label></div>
  </div>
  <div class="row" style="justify-content:center;gap:10px">
    <button class="zbtn" id="dupla" type="button">Sombra dupla (soft + dura)</button>
    <button class="zbtn ghost" id="copiar" type="button">📋 Copiar CSS</button>
  </div>
  <div class="zcard mt" style="background:var(--z-bg2);padding:12px"><code class="mono" id="css" style="font-size:12px;word-break:break-all"></code></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var dupla = false;
  function atualizar(){
    var x = $id("x").value, y = $id("y").value, b = $id("blur").value, s = $id("spread").value;
    var cor = $id("cor").value + "99";
    var inset = $id("inset").checked ? "inset " : "";
    var css1 = inset + x + "px " + y + "px " + b + "px " + s + "px " + cor;
    var css2 = css1;
    if(dupla){
      var c2 = $id("cor").value;
      css2 = (inset ? "inset " : "") + x + "px " + y + "px " + Math.max(0, b / 2) + "px " + s + "px " + c2 + ", " + x + "px " + y + "px " + b + "px " + s + "px " + cor;
    }
    $id("prev").style.boxShadow = css2;
    $id("css").textContent = "box-shadow: " + css2 + ";";
  }
  ["x", "y", "blur", "spread", "cor", "inset"].forEach(function(i){ $id(i).addEventListener("input", atualizar) });
  $id("dupla").addEventListener("click", function(){ dupla = !dupla; this.classList.toggle("ghost"); atualizar() });
  $id("copiar").addEventListener("click", function(){ Z.copy($id("css").textContent) });
  atualizar();
})();
`;
  return { body, js };
}

export function cssRadius({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <div class="zcard mb" style="background:var(--z-bg2);display:grid;place-items:center;height:200px"><div id="prev" style="width:140px;height:140px;background:var(--z-brand);transition:border-radius .2s"></div></div>
  <div class="zgrid" id="sliders" style="grid-template-columns:repeat(2,1fr);gap:12px"></div>
  <div class="row mt" style="justify-content:center;gap:10px">
    <button class="zbtn ghost" id="round" type="button">Círculo</button>
    <button class="zbtn ghost" id="zero" type="button">Quadrado</button>
    <button class="zbtn ghost" id="aleatorio" type="button">🎲 Aleatório</button>
    <button class="zbtn" id="copiar" type="button">📋 Copiar CSS</button>
  </div>
  <div class="zcard mt" style="background:var(--z-bg2);padding:12px"><code class="mono" id="css" style="font-size:12px;word-break:break-all"></code></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var NOME = ["Superior esquerda", "Superior direita", "Inferior direita", "Inferior esquerda"];
  var vals = [24, 24, 24, 24];
  var box = $id("sliders");
  NOME.forEach(function(n, i){
    var d = document.createElement("div");
    d.innerHTML = "<div class='row between'><span class='zlabel' style='margin:0'>" + n + "</span><b class='acc mono' id='v" + i + "'>24px</b></div><input type='range' min='0' max='100' value='24' id='s" + i + "' style='width:100%'>";
    box.appendChild(d);
  });
  function atualizar(){
    $id("prev").style.borderRadius = vals.join(" ") + "px";
    $id("css").textContent = "border-radius: " + vals.join(" ") + "px;";
    vals.forEach(function(v, i){ $id("v" + i).textContent = v + "px" });
  }
  for(var i = 0; i < 4; i++){
    (function(i2){
      $id("s" + i2).addEventListener("input", function(){ vals[i2] = parseInt(this.value, 10); atualizar() });
    })(i);
  }
  $id("round").addEventListener("click", function(){ vals = [100, 100, 100, 100]; sync(); atualizar() });
  $id("zero").addEventListener("click", function(){ vals = [0, 0, 0, 0]; sync(); atualizar() });
  $id("aleatorio").addEventListener("click", function(){ for(var k = 0; k < 4; k++) vals[k] = Z.rnd(0, 100); sync(); atualizar() });
  function sync(){ for(var k = 0; k < 4; k++) $id("s" + k).value = vals[k] }
  $id("copiar").addEventListener("click", function(){ Z.copy($id("css").textContent) });
  atualizar();
})();
`;
  return { body, js };
}

export function cssFlex({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:720px;margin:0 auto">
  <div class="zgrid zg3 mb" style="gap:10px">
    <div><span class="zlabel">Direction</span><select class="zselect" id="dir"><option>row</option><option>row-reverse</option><option>column</option><option>column-reverse</option></select></div>
    <div><span class="zlabel">Justify</span><select class="zselect" id="justify"><option>flex-start</option><option>center</option><option>flex-end</option><option>space-between</option><option>space-around</option><option>space-evenly</option></select></div>
    <div><span class="zlabel">Align</span><select class="zselect" id="align"><option>stretch</option><option>flex-start</option><option>center</option><option>flex-end</option><option>baseline</option></select></div>
    <div><span class="zlabel">Wrap</span><select class="zselect" id="wrap"><option>nowrap</option><option>wrap</option><option>wrap-reverse</option></select></div>
    <div><span class="zlabel">Gap (px)</span><input class="zinput" id="gap" type="number" value="10"></div>
  </div>
  <div class="zcard mb" style="background:var(--z-bg2);padding:14px;min-height:180px" id="arena">
    <div id="flex" style="display:flex;gap:10px;min-height:150px">
      <div class="item" style="width:80px;height:60px">1</div>
      <div class="item" style="width:120px;height:60px">2</div>
      <div class="item" style="width:90px;height:60px">3</div>
      <div class="item" style="width:70px;height:60px">4</div>
      <div class="item" style="width:100px;height:60px">5</div>
    </div>
  </div>
  <style>#flex .item{display:grid;place-items:center;background:var(--z-brand);color:#fff;border-radius:10px;font-family:var(--z-fd);font-weight:700;transition:.25s}</style>
  <div class="row" style="justify-content:center"><button class="zbtn" id="copiar" type="button">📋 Copiar CSS</button></div>
  <div class="zcard mt" style="background:var(--z-bg2);padding:12px"><code class="mono" id="css" style="font-size:12px;word-break:break-all"></code></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function atualizar(){
    var f = $id("flex");
    f.style.flexDirection = $id("dir").value;
    f.style.justifyContent = $id("justify").value;
    f.style.alignItems = $id("align").value;
    f.style.flexWrap = $id("wrap").value;
    f.style.gap = $id("gap").value + "px";
    $id("css").textContent = "display: flex;\\nflex-direction: " + $id("dir").value + ";\\njustify-content: " + $id("justify").value + ";\\nalign-items: " + $id("align").value + ";\\nflex-wrap: " + $id("wrap").value + ";\\ngap: " + $id("gap").value + "px;";
  }
  ["dir", "justify", "align", "wrap", "gap"].forEach(function(i){ $id(i).addEventListener("input", atualizar) });
  $id("copiar").addEventListener("click", function(){ Z.copy($id("css").textContent) });
  atualizar();
})();
`;
  return { body, js };
}

export function cssGrid({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:720px;margin:0 auto">
  <div class="zgrid zg3 mb" style="gap:10px">
    <div><span class="zlabel">Colunas</span><input class="zinput" id="cols" type="number" value="3" min="1" max="8"></div>
    <div><span class="zlabel">Linhas</span><input class="zinput" id="rows" type="number" value="3" min="1" max="6"></div>
    <div><span class="zlabel">Gap (px)</span><input class="zinput" id="gap" type="number" value="8"></div>
  </div>
  <div class="zcard mb" style="background:var(--z-bg2);padding:14px">
    <div id="grid" style="display:grid;gap:8px;min-height:200px"></div>
  </div>
  <p class="dim mb" style="font-size:13px">Toque em uma célula para a item 1 entrar nela (grid-area) e mudar a span.</p>
  <div class="row" style="justify-content:center"><button class="zbtn" id="copiar" type="button">📋 Copiar CSS</button></div>
  <div class="zcard mt" style="background:var(--z-bg2);padding:12px"><code class="mono" id="css" style="font-size:12px;word-break:break-all"></code></div>
</div>
<style>#grid .g{background:var(--z-surface2);border-radius:8px;cursor:pointer;min-height:48px;transition:.2s}#grid .g.sel{background:var(--z-acc)}#grid .g.item1{background:var(--z-brand);display:grid;place-items:center;color:#fff;font-family:var(--z-fd);font-weight:700}</style>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var span = 1;
  function atualizar(){
    var g = $id("grid");
    var cols = Math.max(1, Math.min(8, parseInt($id("cols").value || 3, 10)));
    var rows = Math.max(1, Math.min(6, parseInt($id("rows").value || 3, 10)));
    g.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    g.style.gridTemplateRows = "repeat(" + rows + ", 1fr)";
    g.style.gap = $id("gap").value + "px";
    g.innerHTML = "";
    for(var i = 0; i < cols * rows; i++){
      var d = document.createElement("div");
      d.className = "g";
      d.dataset.i = i;
      d.addEventListener("click", function(){
        g.querySelectorAll(".g").forEach(function(x){ x.classList.remove("sel", "item1") });
        this.classList.add("sel", "item1");
        this.textContent = "1";
      });
      g.appendChild(d);
    }
    $id("css").textContent = "display: grid;\\ngrid-template-columns: repeat(" + cols + ", 1fr);\\ngrid-template-rows: repeat(" + rows + ", 1fr);\\ngap: " + $id("gap").value + "px;";
  }
  ["cols", "rows", "gap"].forEach(function(i){ $id(i).addEventListener("input", atualizar) });
  $id("copiar").addEventListener("click", function(){ Z.copy($id("css").textContent) });
  atualizar();
})();
`;
  return { body, js };
}

export function cssBezier({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <div class="zcard mb" style="background:var(--z-bg2);padding:14px">
    <div style="height:12px;background:var(--z-surface2);border-radius:99px;overflow:hidden"><div id="bar" style="height:100%;width:20%;background:var(--z-acc);border-radius:99px"></div></div>
    <div class="row mt" style="justify-content:center;gap:10px"><button class="zbtn sm" id="play" type="button">▶ Animar</button><button class="zbtn sm ghost" id="preset" type="button">Presets</button></div>
  </div>
  <div class="zgrid zg2 mb" style="gap:12px">
    <div><span class="zlabel">X1</span><input type="range" id="x1" min="-50" max="150" value="0"><b class="acc mono" id="vx1">0</b></div>
    <div><span class="zlabel">Y1</span><input type="range" id="y1" min="-200" max="300" value="0"><b class="acc mono" id="vy1">0</b></div>
    <div><span class="zlabel">X2</span><input type="range" id="x2" min="-50" max="150" value="1"><b class="acc mono" id="vx2">1</b></div>
    <div><span class="zlabel">Y2</span><input type="range" id="y2" min="-200" max="300" value="1"><b class="acc mono" id="vy2">1</b></div>
  </div>
  <div class="row" style="justify-content:center;gap:10px"><button class="zbtn" id="copiar" type="button">📋 Copiar CSS</button></div>
  <div class="zcard mt" style="background:var(--z-bg2);padding:12px"><code class="mono" id="css" style="font-size:12px;word-break:break-all"></code></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function atualizar(){
    $id("vx1").textContent = $id("x1").value;
    $id("vy1").textContent = $id("y1").value;
    $id("vx2").textContent = $id("x2").value;
    $id("vy2").textContent = $id("y2").value;
    $id("css").textContent = "transition-timing-function: cubic-bezier(" + $id("x1").value / 100 + ", " + $id("y1").value / 100 + ", " + $id("x2").value / 100 + ", " + $id("y2").value / 100 + ");";
    $id("bar").style.transitionTimingFunction = "cubic-bezier(" + $id("x1").value / 100 + ", " + $id("y1").value / 100 + ", " + $id("x2").value / 100 + ", " + $id("y2").value / 100 + ")";
  }
  ["x1", "y1", "x2", "y2"].forEach(function(i){ $id(i).addEventListener("input", atualizar) });
  $id("play").addEventListener("click", function(){
    var b = $id("bar");
    b.style.transition = "width 1.2s " + "cubic-bezier(" + $id("x1").value / 100 + ", " + $id("y1").value / 100 + ", " + $id("x2").value / 100 + ", " + $id("y2").value / 100 + ")";
    b.style.width = b.style.width === "80%" ? "20%" : "80%";
  });
  var presets = [[0, 0, 0.2, 1], [0.68, -0.55, 0.27, 1.55], [0.34, 1.56, 0.64, 1], [0.9, 0, 0.1, 1], [0, 0, 1, 1]];
  var pi = 0;
  $id("preset").addEventListener("click", function(){
    var p = presets[pi % presets.length];
    pi++;
    $id("x1").value = p[0] * 100; $id("y1").value = p[1] * 100;
    $id("x2").value = p[2] * 100; $id("y2").value = p[3] * 100;
    atualizar();
    Z.toast("Preset aplicado", 1200);
  });
  $id("copiar").addEventListener("click", function(){ Z.copy($id("css").textContent) });
  atualizar();
})();
`;
  return { body, js };
}

/* ── TIPOGRAFIA ─────────────────────────────────────────── */
export function tipografia({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:720px;margin:0 auto">
  <div class="zgrid zg3 mb" style="gap:10px">
    <div><span class="zlabel">Font family</span><select class="zselect" id="ff"><option>Space Grotesk</option><option>Inter</option><option>JetBrains Mono</option><option>Georgia, serif</option><option>system-ui</option></select></div>
    <div><span class="zlabel">Tamanho</span><input type="range" id="fs" min="12" max="96" value="40"><b class="acc mono" id="vfs">40px</b></div>
    <div><span class="zlabel">Peso</span><select class="zselect" id="fw"><option>400</option><option selected>600</option><option>700</option></select></div>
    <div><span class="zlabel">Line-height</span><input type="range" id="lh" min="80" max="200" value="120"><b class="acc mono" id="vlh">1.2</b></div>
    <div><span class="zlabel">Letter-spacing</span><input type="range" id="ls" min="-10" max="40" value="0"><b class="acc mono" id="vls">0</b></div>
    <div><span class="zlabel">Transform</span><select class="zselect" id="tc"><option>none</option><option>uppercase</option><option>capitalize</option></select></div>
  </div>
  <div class="zcard" id="prev" style="background:var(--z-bg2);padding:24px;min-height:140px">Zcode é a plataforma</div>
  <div class="row mt" style="justify-content:center"><button class="zbtn" id="copiar" type="button">📋 Copiar CSS</button></div>
  <div class="zcard mt" style="background:var(--z-bg2);padding:12px"><code class="mono" id="css" style="font-size:12px;word-break:break-all"></code></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function atualizar(){
    var p = $id("prev");
    p.style.fontFamily = $id("ff").value;
    p.style.fontSize = $id("fs").value + "px";
    p.style.fontWeight = $id("fw").value;
    p.style.lineHeight = $id("lh").value / 100;
    p.style.letterSpacing = ($id("ls").value / 1000 * 10 / 10) + "px";
    p.style.letterSpacing = ($id("ls").value / 100) / 10 + "em";
    p.style.textTransform = $id("tc").value;
    $id("vfs").textContent = $id("fs").value + "px";
    $id("vlh").textContent = ($id("lh").value / 100).toFixed(2).replace(/\\.?0+$/, "");
    $id("vls").textContent = $id("ls").value;
    $id("css").textContent = "font-family: '" + $id("ff").value + "';\\nfont-size: " + $id("fs").value + "px;\\nfont-weight: " + $id("fw").value + ";\\nline-height: " + ($id("lh").value / 100) + ";\\nletter-spacing: " + ($id("ls").value / 1000) + "em;\\ntext-transform: " + $id("tc").value + ";";
  }
  ["ff", "fs", "fw", "lh", "ls", "tc"].forEach(function(i){ $id(i).addEventListener("input", atualizar) });
  $id("copiar").addEventListener("click", function(){ Z.copy($id("css").textContent) });
  atualizar();
})();
`;
  return { body, js };
}

/* ── LOREM IPSUM ────────────────────────────────────────── */
export function lorem({ nome, sub }) {
  const PAL = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <div class="row mb wrap" style="justify-content:center;gap:10px">
    <div><span class="zlabel">Parágrafos</span><input class="zinput" id="qtd" type="number" value="3" min="1" max="20" style="width:90px"></div>
    <button class="zbtn" id="gerar" type="button">Gerar</button>
    <button class="zbtn ghost" id="copiar" type="button">📋 Copiar</button>
  </div>
  <div class="zcard" style="background:var(--z-bg2);padding:16px;line-height:1.7;font-size:14px" id="saida"></div>
</div>`;
  const js = `
(function(){
  var PAL = ${JSON.stringify(PAL)};
  function $id(x){return document.getElementById(x)}
  function paragrafo(){
    var n = Z.rnd(40, 90), out = [];
    for(var i = 0; i < n; i++) out.push(PAL[Z.rnd(0, PAL.length - 1)]);
    var s = out.join(" ");
    s = s.charAt(0).toUpperCase() + s.slice(1);
    return s + " " + ["Finalemente, o texto termina aqui.", "Em resumo, nada acontece.", "E assim, o parágrafo se conclui.", "Ponto final com estilo."][Z.rnd(0, 3)];
  }
  function gerar(){
    var n = Math.max(1, Math.min(20, parseInt($id("qtd").value || 3, 10)));
    var html = "";
    for(var i = 0; i < n; i++) html += "<p>" + paragrafo() + "</p>";
    $id("saida").innerHTML = html;
  }
  $id("gerar").addEventListener("click", gerar);
  $id("copiar").addEventListener("click", function(){ Z.copy($id("saida").innerText) });
  gerar();
})();
`;
  return { body, js };
}

/* ── PALÍNDROMO ─────────────────────────────────────────── */
export function palindromo({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <input class="zinput mb" id="entrada" placeholder="Ex.: arara, a saia, SOCORRAM ME AO REVERSOS">
  <div class="zcard center" style="background:var(--z-bg2)">
    <div class="zbig acc" id="resultado">—</div>
    <p class="dim" id="espelho" style="font-family:var(--z-fm);word-break:break-all;font-size:13px;margin-top:8px"></p>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function norm(s){ return s.normalize("NFD").replace(/[\\\\u0300-\\\\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "") }
  function checar(){
    var t = $id("entrada").value;
    var n = norm(t);
    var inv = n.split("").reverse().join("");
    $id("espelho").textContent = inv;
    if(!n){ $id("resultado").textContent = "—"; return }
    $id("resultado").textContent = n === inv ? "✅ É palíndromo!" : "❌ Não é";
  }
  $id("entrada").addEventListener("input", checar);
})();
`;
  return { body, js };
}

/* ── FONE ───────────────────────────────────────────────── */
export function fone({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} — aplica máscara e valida.</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <span class="zlabel">Telefone</span>
  <input class="zinput mb" id="fone" placeholder="(11) 99999-9999" style="font-family:var(--z-fm);font-size:18px">
  <p class="acc fd" id="status" style="font-size:17px;min-height:26px"></p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  $id("fone").addEventListener("input", function(){
    var d = this.value.replace(/\\D/g, "").slice(0, 11);
    var out = d;
    if(d.length > 0) out = "(" + d.slice(0, 2);
    if(d.length >= 3) out += ") ";
    if(d.length > 4) out += d.slice(2, 6).replace(/(\\d{4})(\\d)/, "$1-$2");
    else if(d.length > 2) out += d.slice(2);
    if(d.length > 6) out = "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    if(d.length > 10) out = "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    this.value = out;
    if(d.length === 11 || d.length === 10){
      $id("status").textContent = "✅ Formato válido: " + (d.length === 11 ? "celular" : "fixo");
    } else if(d.length === 0){
      $id("status").textContent = "";
    } else {
      $id("status").textContent = "";
    }
  });
})();
`;
  return { body, js };
}

/* ── CPF ────────────────────────────────────────────────── */
export function cpf({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} — valida os dígitos verificadores.</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <span class="zlabel">CPF</span>
  <input class="zinput mb" id="cpf" placeholder="000.000.000-00" style="font-family:var(--z-fm);font-size:18px" maxlength="14">
  <p class="acc fd" id="status" style="font-size:17px;min-height:26px"></p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function digito(cpf){
    var soma = 0;
    for(var i = 0; i < cpf.length; i++) soma += parseInt(cpf[i], 10) * (cpf.length + 1 - i);
    var r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  }
  $id("cpf").addEventListener("input", function(){
    var d = this.value.replace(/\\D/g, "").slice(0, 11);
    var out = d;
    if(d.length > 3) out = d.slice(0, 3) + "." + d.slice(3);
    if(d.length > 6) out = out + "." + d.slice(6);
    if(d.length > 9) out = out + "-" + d.slice(9);
    this.value = out;
    if(d.length === 11){
      if(/^\\d{11}$/.test(d) && d === d[0].repeat(11)){ $id("status").textContent = "❌ CPF inválido (todos iguais)"; return }
      var d1 = digito(d.slice(0, 9));
      var d2 = digito(d.slice(0, 9) + d1);
      $id("status").textContent = (d1 === parseInt(d[9], 10) && d2 === parseInt(d[10], 10)) ? "✅ CPF válido" : "❌ Dígitos verificadores incorretos";
    } else $id("status").textContent = "";
  });
})();
`;
  return { body, js };
}

/* ── ROMANOS ────────────────────────────────────────────── */
export function romano({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} — 1 a 3999.</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Número</span><input class="zinput" id="num" type="number" min="1" max="3999" value="1994"></div>
    <div class="row" style="align-items:flex-end"><b class="fd acc" id="rom" style="font-size:28px">—</b></div>
  </div>
  <hr style="border:none;border-top:1px solid var(--z-line);margin:14px 0">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Romanos</span><input class="zinput mono" id="rom2" placeholder="MCMXCIV"></div>
    <div class="row" style="align-items:flex-end"><b class="fd acc" id="num2" style="font-size:28px">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  var TAB = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  function $id(x){return document.getElementById(x)}
  function paraRomano(n){
    var out = "";
    for(var i = 0; i < TAB.length; i++){
      while(n >= TAB[i][0]){ out += TAB[i][1]; n -= TAB[i][0] }
    }
    return out;
  }
  function deRomano(s){
    s = s.toUpperCase().trim();
    if(!/^[IVXLCDM]+$/.test(s)) return null;
    var VAL = {I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000};
    var total = 0;
    for(var i = 0; i < s.length; i++){
      var v = VAL[s[i]];
      if(s[i + 1] && VAL[s[i + 1]] > v) total -= v;
      else total += v;
    }
    return total;
  }
  $id("num").addEventListener("input", function(){
    var n = parseInt(this.value, 10);
    $id("rom").textContent = n >= 1 && n <= 3999 ? paraRomano(n) : "—";
  });
  $id("rom2").addEventListener("input", function(){
    var v = deRomano(this.value);
    $id("num2").textContent = v && v <= 3999 ? v : "—";
  });
  $id("num").dispatchEvent(new Event("input"));
})();
`;
  return { body, js };
}

/* ── BASES NUMÉRICAS ────────────────────────────────────── */
export function bases({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <span class="zlabel">Digite em qualquer base (o resto preenche)</span>
  <div class="zgrid zg2">
    <div><span class="zlabel">Binário (0-1)</span><input class="zinput mono" id="b" placeholder="1010"></div>
    <div><span class="zlabel">Octal (0-7)</span><input class="zinput mono" id="o" placeholder="12"></div>
    <div><span class="zlabel">Decimal (0-9)</span><input class="zinput mono" id="d" placeholder="10"></div>
    <div><span class="zlabel">Hexadecimal (0-F)</span><input class="zinput mono" id="h" placeholder="A"></div>
  </div>
  <p class="dim mt" id="erro" style="font-size:13px"></p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var IDS = ["b", "o", "d", "h"];
  var BASES = {b: 2, o: 8, d: 10, h: 16};
  function atualizar(fonte){
    var val = null;
    for(var i = 0; i < IDS.length; i++){
      var idn = IDS[i];
      var v = $id(idn).value.trim();
      if(!v || idn === fonte) continue;
      var n = parseInt(v, BASES[idn]);
      if(isNaN(n) || String(n).length !== 100000){
        var ok = /^[0-7a-fA-F]+$/.test(v);
        if(!ok || n.toString(BASES[idn]).toLowerCase() !== v.toLowerCase()){
          if(fonte === idn) return;
          continue;
        }
      }
      val = n;
      break;
    }
    if(val == null){
      $id("erro").textContent = "";
      return;
    }
    IDS.forEach(function(idn){
      if(idn === fonte) return;
      $id(idn).value = val.toString(BASES[idn]).toUpperCase();
    });
    $id("erro").textContent = "";
  }
  IDS.forEach(function(idn){
    $id(idn).addEventListener("input", function(){
      var v = this.value.trim();
      if(v && !new RegExp("^[0-9a-fA-F]{1,10}$", "i").test(v)) $id("erro").textContent = "Use apenas algarismos hexadecimais (0-9, A-F).";
      else $id("erro").textContent = "";
      atualizar(idn);
    });
  });
})();
`;
  return { body, js };
}

/* ── ÁREAS / PITÁGORAS / NOTA FINAL / VIAGEM / DISTÂNCIA ── */
export function areaFormas({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <span class="zlabel">Formato</span>
  <select class="zselect mb" id="forma">
    <option value="quad">Quadrado (lado)</option>
    <option value="ret">Retângulo (base × altura)</option>
    <option value="tri">Triângulo (base × altura)</option>
    <option value="circ">Círculo (raio)</option>
    <option value="trap">Trapézio (b1, b2, altura)</option>
  </select>
  <div class="zgrid" id="campos" style="grid-template-columns:repeat(2,1fr);gap:10px"></div>
  <div class="zcard center mt" style="background:var(--z-bg2)">
    <div class="zbig acc" id="area">—</div>
    <p class="dim">área (unidades²) · perímetro: <b class="acc mono" id="perim">—</b></p>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var FORMAS = {
    quad: {labels: ["Lado"], n: 1},
    ret: {labels: ["Base", "Altura"], n: 2},
    tri: {labels: ["Base", "Altura"], n: 2},
    circ: {labels: ["Raio"], n: 1},
    trap: {labels: ["Base maior", "Base menor", "Altura"], n: 3},
  };
  function montar(){
    var f = $id("forma").value;
    var box = $id("campos");
    box.innerHTML = "";
    FORMAS[f].labels.forEach(function(l, i){
      var d = document.createElement("div");
      d.innerHTML = "<span class='zlabel'>" + l + "</span><input class='zinput' type='number' step='any' id='c" + i + "' placeholder='0'>";
      box.appendChild(d);
      d.querySelector("input").addEventListener("input", calc);
    });
    calc();
  }
  function vals(f){
    var out = [];
    for(var i = 0; i < FORMAS[f].n; i++) out.push(parseFloat($id("c" + i).value) || 0);
    return out;
  }
  function calc(){
    var f = $id("forma").value;
    var v = vals(f);
    var A = 0, P = 0, ok = v.every(function(x){ return x > 0 });
    if(ok){
      if(f === "quad"){ A = v[0] * v[0]; P = 4 * v[0] }
      if(f === "ret"){ A = v[0] * v[1]; P = 2 * (v[0] + v[1]) }
      if(f === "tri"){ A = v[0] * v[1] / 2; P = "" }
      if(f === "circ"){ A = Math.PI * v[0] * v[0]; P = 2 * Math.PI * v[0] }
      if(f === "trap"){ A = (v[0] + v[1]) * v[2] / 2; P = "" }
    }
    $id("area").textContent = ok ? Z.fmt(A, 2) : "—";
    $id("perim").textContent = P === "" ? "—" : Z.fmt(P, 2);
  }
  $id("forma").addEventListener("change", montar);
  montar();
})();
`;
  return { body, js };
}

export function pitagoras({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · c² = a² + b²</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <span class="zlabel">O que calcular?</span>
  <select class="zselect mb" id="modo">
    <option value="c">Hipotenusa (a e b conhecidos)</option>
    <option value="a">Cateto a (c e b conhecidos)</option>
  </select>
  <div class="zgrid zg2 mb" id="campos"></div>
  <div class="zcard center" style="background:var(--z-bg2)">
    <div class="zbig acc" id="res">—</div>
    <p class="dim" id="ang"></p>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function montar(){
    var m = $id("modo").value;
    var box = $id("campos");
    box.innerHTML = "";
    var campos = m === "c" ? ["Cateto a", "Cateto b"] : ["Hipotenusa c", "Cateto b"];
    campos.forEach(function(l, i){
      var d = document.createElement("div");
      d.innerHTML = "<span class='zlabel'>" + l + "</span><input class='zinput' type='number' step='any' id='k" + i + "'>";
      box.appendChild(d);
      d.querySelector("input").addEventListener("input", calc);
    });
    calc();
  }
  function calc(){
    var m = $id("modo").value;
    var x = parseFloat($id("k0").value) || 0;
    var y = parseFloat($id("k1").value) || 0;
    if(x <= 0 || y <= 0){ $id("res").textContent = "—"; $id("ang").textContent = ""; return }
    var r;
    if(m === "c"){ r = Math.sqrt(x * x + y * y); $id("ang").textContent = "Ângulos: " + Math.round(Math.asin(x / r) * 180 / Math.PI) + "° e " + Math.round(Math.asin(y / r) * 180 / Math.PI) + "°" }
    else {
      if(x < y){ $id("res").textContent = "c < b — impossível"; return }
      r = Math.sqrt(x * x - y * y);
      $id("ang").textContent = "Ângulo oposto a b: " + Math.round(Math.asin(y / x) * 180 / Math.PI) + "°";
    }
    $id("res").textContent = Z.fmt(r, 4);
  }
  $id("modo").addEventListener("change", montar);
  montar();
})();
`;
  return { body, js };
}

export function notaFinal({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Qual nota você precisa para passar?</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Nota 1º bimestre</span><input class="zinput" id="n1" type="number" step="0.1" value="7"></div>
    <div><span class="zlabel">Peso 1º</span><input class="zinput" id="p1" type="number" value="3"></div>
    <div><span class="zlabel">Nota 2º bimestre</span><input class="zinput" id="n2" type="number" step="0.1" value="6"></div>
    <div><span class="zlabel">Peso 2º</span><input class="zinput" id="p2" type="number" value="4"></div>
  </div>
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">Média atual</span><b class="fd acc" id="media">—</b></div>
    <div class="zcard center"><span class="zlabel">Para média 7</span><b class="fd acc" id="n7" style="font-size:19px">—</b></div>
    <div class="zcard center"><span class="zlabel">Para média 9</span><b class="fd acc" id="n9" style="font-size:19px">—</b></div>
  </div>
  <p class="dim mt" style="font-size:13px">Nota final da prova de recuperação (peso do 3º = soma dos pesos 1º+2º).</p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var n1 = parseFloat($id("n1").value) || 0, p1 = parseFloat($id("p1").value) || 1;
    var n2 = parseFloat($id("n2").value) || 0, p2 = parseFloat($id("p2").value) || 1;
    var p3 = p1 + p2;
    var media = (n1 * p1 + n2 * p2) / (p1 + p2);
    $id("media").textContent = Z.fmt(media, 2);
    [7, 9].forEach(function(m){
      var falta = m * (p1 + p2 + p3) - (n1 * p1 + n2 * p2);
      var nota = falta / p3;
      $id("n" + m).textContent = nota > 10 ? "impossível" : Z.fmt(Math.max(0, nota), 2);
    });
  }
  ["n1", "p1", "n2", "p2"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

export function viagem({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="zgrid zg3 mb">
    <div><span class="zlabel">Distância (km)</span><input class="zinput" id="dist" type="number" value="350"></div>
    <div><span class="zlabel">Consumo (km/L)</span><input class="zinput" id="cons" type="number" value="12"></div>
    <div><span class="zlabel">Combustível (R$/L)</span><input class="zinput" id="comb" type="number" value="5.8" step="0.1"></div>
    <div><span class="zlabel">Pedágios (R$)</span><input class="zinput" id="ped" type="number" value="0"></div>
    <div><span class="zlabel">Pessoas</span><input class="zinput" id="pes" type="number" value="4"></div>
    <div><span class="zlabel">Hospedagem (R$)</span><input class="zinput" id="hos" type="number" value="0"></div>
  </div>
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">Combustível</span><b class="fd acc" id="c">—</b></div>
    <div class="zcard center"><span class="zlabel">Total da viagem</span><b class="fd acc" id="t">—</b></div>
    <div class="zcard center"><span class="zlabel">Por pessoa</span><b class="fd acc" id="pp">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var d = parseFloat($id("dist").value) || 0;
    var c = parseFloat($id("cons").value) || 1;
    var p = parseFloat($id("comb").value) || 0;
    var ped = parseFloat($id("ped").value) || 0;
    var n = Math.max(1, parseInt($id("pes").value || 1, 10));
    var hos = parseFloat($id("hos").value) || 0;
    var litro = d / c;
    var custoC = litro * p;
    var total = custoC + ped * 2 + hos;
    $id("c").textContent = "R$ " + Z.fmt(custoC, 2);
    $id("t").textContent = "R$ " + Z.fmt(total, 2);
    $id("pp").textContent = "R$ " + Z.fmt(total / n, 2);
  }
  ["dist", "cons", "comb", "ped", "pes", "hos"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

export function distancia({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Fórmula de Haversine.</p></div>
<div class="zcard pad" style="max-width:600px;margin:0 auto">
  <div class="zgrid zg2 mb" style="gap:14px">
    <div>
      <span class="zlabel">Ponto A</span>
      <input class="zinput mb" id="lat1" type="number" step="any" value="-23.55" placeholder="Latitude">
      <input class="zinput" id="lon1" type="number" step="any" value="-46.63" placeholder="Longitude">
    </div>
    <div>
      <span class="zlabel">Ponto B</span>
      <input class="zinput mb" id="lat2" type="number" step="any" value="-22.91" placeholder="Latitude">
      <input class="zinput" id="lon2" type="number" step="any" value="-43.17" placeholder="Longitude">
    </div>
  </div>
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">Distância</span><b class="fd acc" id="km">—</b></div>
    <div class="zcard center"><span class="zlabel">Voo (900 km/h)</span><b class="fd" id="voo" style="font-size:18px">—</b></div>
    <div class="zcard center"><span class="zlabel">Carro (100 km/h)</span><b class="fd" id="carro" style="font-size:18px">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var lat1 = parseFloat($id("lat1").value), lon1 = parseFloat($id("lon1").value);
    var lat2 = parseFloat($id("lat2").value), lon2 = parseFloat($id("lon2").value);
    if([lat1, lon1, lat2, lon2].some(isNaN)){ $id("km").textContent = "—"; return }
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    $id("km").textContent = Z.fmt(d, 1) + " km";
    $id("voo").textContent = Z.fmt(d / 900, 1) + " h";
    $id("carro").textContent = Z.fmt(d / 100, 1) + " h";
  }
  ["lat1", "lon1", "lat2", "lon2"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

export function velocidade({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="zgrid zg3 mb">
    <div><span class="zlabel">Distância (km)</span><input class="zinput" id="d" type="number" value="100"></div>
    <div><span class="zlabel">Horas</span><input class="zinput" id="h" type="number" value="1"></div>
    <div><span class="zlabel">Minutos</span><input class="zinput" id="m" type="number" value="15"></div>
  </div>
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">Velocidade média</span><b class="fd acc" id="v">—</b></div>
    <div class="zcard center"><span class="zlabel">Em m/s</span><b class="fd" id="ms" style="font-size:18px">—</b></div>
    <div class="zcard center"><span class="zlabel">Em mph</span><b class="fd" id="mph" style="font-size:18px">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var d = parseFloat($id("d").value) || 0;
    var h = parseFloat($id("h").value) || 0;
    var m = parseFloat($id("m").value) || 0;
    var t = h + m / 60;
    if(t <= 0 || d <= 0){ $id("v").textContent = "—"; return }
    var v = d / t;
    $id("v").textContent = Z.fmt(v, 2) + " km/h";
    $id("ms").textContent = Z.fmt(v / 3.6, 2);
    $id("mph").textContent = Z.fmt(v * 0.621371, 2);
  }
  ["d", "h", "m"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

export function proporcao({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Escalas de mapas e maquetes.</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <span class="zlabel">Escala</span>
  <select class="zselect mb" id="esc">
    <option value="100">1 : 100</option>
    <option value="250">1 : 250</option>
    <option value="500">1 : 500</option>
    <option value="1000">1 : 1.000</option>
    <option value="2500">1 : 2.500</option>
    <option value="5000">1 : 5.000</option>
    <option value="10000">1 : 10.000</option>
  </select>
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Medida no papel (cm)</span><input class="zinput" id="papel" type="number" value="10"></div>
    <div class="row" style="align-items:flex-end"><b class="fd acc" id="real" style="font-size:24px">—</b></div>
  </div>
  <p class="dim" id="troca" style="font-size:13px"></p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var e = parseInt($id("esc").value, 10);
    var p = parseFloat($id("papel").value) || 0;
    var real = p * e; // cm
    var m = real / 100;
    $id("real").textContent = m >= 1000 ? Z.fmt(m / 1000, 2) + " km" : Z.fmt(m, 2) + " m";
    var papelDeM = 20 / e;
    $id("troca").textContent = "Inverso: 20 m reais = " + Z.fmt(2000 / e, 3) + " cm no papel.";
  }
  ["esc", "papel"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

/* ── OBRAS: TERRENO / CIMENTO / TINTA / ENERGIA ─────────── */
export function terreno({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Comprimento (m)</span><input class="zinput" id="c" type="number" value="20"></div>
    <div><span class="zlabel">Largura (m)</span><input class="zinput" id="l" type="number" value="30"></div>
  </div>
  <div class="zgrid" style="grid-template-columns:repeat(4,1fr)">
    <div class="zcard center"><span class="zlabel">m²</span><b class="fd acc" id="m2">—</b></div>
    <div class="zcard center"><span class="zlabel">Hectares</span><b class="fd" id="ha" style="font-size:18px">—</b></div>
    <div class="zcard center"><span class="zlabel">Alqueires</span><b class="fd" id="alq" style="font-size:18px">—</b></div>
    <div class="zcard center"><span class="zlabel">Ar</span><b class="fd" id="ar" style="font-size:18px">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var c = parseFloat($id("c").value) || 0, l = parseFloat($id("l").value) || 0;
    var m2 = c * l;
    $id("m2").textContent = Z.fmt(m2, 0);
    $id("ha").textContent = Z.fmt(m2 / 10000, 3);
    $id("alq").textContent = Z.fmt(m2 / 48400, 3);
    $id("ar").textContent = Z.fmt(m2 / 10000, 3);
  }
  ["c", "l"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

export function cimento({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Estimativa para concreto simples (cimento:areia:brita ≈ 1:2:3).</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="zgrid zg3 mb">
    <div><span class="zlabel">Comprimento (m)</span><input class="zinput" id="c" type="number" value="5"></div>
    <div><span class="zlabel">Largura (m)</span><input class="zinput" id="l" type="number" value="3"></div>
    <div><span class="zlabel">Espessura (cm)</span><input class="zinput" id="e" type="number" value="10"></div>
  </div>
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">Volume (m³)</span><b class="fd acc" id="v">—</b></div>
    <div class="zcard center"><span class="zlabel">Sacolas 42,5 kg</span><b class="fd acc" id="s">—</b></div>
    <div class="zcard center"><span class="zlabel">Areia (m³)</span><b class="fd" id="a" style="font-size:18px">—</b></div>
  </div>
  <p class="dim mt" style="font-size:13px">Adicione ~10% de folga na hora da compra. Valore sempre com um profissional.</p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var c = parseFloat($id("c").value) || 0, l = parseFloat($id("l").value) || 0, e = (parseFloat($id("e").value) || 0) / 100;
    var v = c * l * e;
    var folga = v * 1.1;
    $id("v").textContent = Z.fmt(v, 2);
    $id("s").textContent = Math.ceil(folga * 13);
    $id("a").textContent = Z.fmt(folga * 0.5, 2);
  }
  ["c", "l", "e"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

export function tinta({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Rendimento médio: 6 m² por litro por demão.</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="zgrid zg3 mb">
    <div><span class="zlabel">Área (m²)</span><input class="zinput" id="a" type="number" value="40"></div>
    <div><span class="zlabel">Demãos</span><input class="zinput" id="d" type="number" value="2"></div>
    <div><span class="zlabel">Lata (L)</span><input class="zinput" id="lata" type="number" value="3.6" step="0.1"></div>
  </div>
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">Litros necessários</span><b class="fd acc" id="lit">—</b></div>
    <div class="zcard center"><span class="zlabel">Latas (c/ 10% folga)</span><b class="fd acc" id="latas">—</b></div>
    <div class="zcard center"><span class="zlabel">Custo (R$/L = 35)</span><b class="fd" id="custo" style="font-size:18px">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var a = parseFloat($id("a").value) || 0;
    var d = Math.max(1, parseInt($id("d").value || 2, 10));
    var lata = parseFloat($id("lata").value) || 3.6;
    var litros = a * d / 6;
    $id("lit").textContent = Z.fmt(litros, 2) + " L";
    $id("latas").textContent = Math.ceil(litros * 1.1 / lata) + " lata(s)";
    $id("custo").textContent = "R$ " + Z.fmt(litros * 35, 2);
  }
  ["a", "d", "lata"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

export function energia({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Estima o custo da sua conta de luz.</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="zgrid zg3 mb">
    <div><span class="zlabel">Potência (W)</span><input class="zinput" id="p" type="number" value="1000"></div>
    <div><span class="zlabel">Horas/dia</span><input class="zinput" id="h" type="number" value="4"></div>
    <div><span class="zlabel">Dias/mês</span><input class="zinput" id="d" type="number" value="30"></div>
  </div>
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">kWh/mês</span><b class="fd acc" id="kwh">—</b></div>
    <div class="zcard center"><span class="zlabel">Custo (R$ 0,95/kWh)</span><b class="fd acc" id="custo">—</b></div>
    <div class="zcard center"><span class="zlabel">Ano</span><b class="fd" id="ano" style="font-size:18px">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var p = parseFloat($id("p").value) || 0;
    var h = parseFloat($id("h").value) || 0;
    var d = parseFloat($id("d").value) || 0;
    var kwh = p * h * d / 1000;
    $id("kwh").textContent = Z.fmt(kwh, 1);
    $id("custo").textContent = "R$ " + Z.fmt(kwh * 0.95, 2);
    $id("ano").textContent = "R$ " + Z.fmt(kwh * 12 * 0.95, 2);
  }
  ["p", "h", "d"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

export function download({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="zgrid zg3 mb">
    <div><span class="zlabel">Tamanho (MB)</span><input class="zinput" id="t" type="number" value="2500"></div>
    <div><span class="zlabel">Velocidade (Mbps)</span><input class="zinput" id="v" type="number" value="200"></div>
    <div class="row" style="align-items:flex-end"><b class="fd acc" id="tempo" style="font-size:24px">—</b></div>
  </div>
  <p class="dim" style="font-size:13px">1 Mbps = 0,125 MB/s (megabits para megabytes).</p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var t = parseFloat($id("t").value) || 0;
    var v = parseFloat($id("v").value) || 0;
    if(t <= 0 || v <= 0){ $id("tempo").textContent = "—"; return }
    var seg = (t * 8) / v;
    var min = Math.floor(seg / 60), s = Math.round(seg % 60);
    $id("tempo").textContent = min + " min " + s + " s";
  }
  ["t", "v"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

/* ── DATA EVENTO / SEMANA / METAS ───────────────────────── */
export function dataEvento({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Contagem regressiva e aniversário.</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <span class="zlabel">Data do evento</span>
  <input class="zinput mb" id="data" type="date" value="2026-12-25">
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">Dias restantes</span><b class="fd acc" id="dias">—</b></div>
    <div class="zcard center"><span class="zlabel">Semanas</span><b class="fd" id="sem" style="font-size:18px">—</b></div>
    <div class="zcard center"><span class="zlabel">Em que dia da semana?</span><b class="fd" id="dia" style="font-size:18px">—</b></div>
  </div>
  <p class="dim center mt" id="obs" style="font-size:13.5px"></p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var alvo = new Date($id("data").value + "T00:00:00");
    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if(isNaN(alvo)){ $id("dias").textContent = "—"; return }
    var dias = Math.round((alvo - hoje) / 86400000);
    $id("dias").textContent = Math.abs(dias);
    $id("sem").textContent = Z.fmt(Math.abs(dias) / 7, 1);
    $id("dia").textContent = alvo.toLocaleDateString("pt-BR", { weekday: "long" });
    if(dias > 0) $id("obs").textContent = "Faltam " + dias + " dias! 🎉";
    else if(dias === 0) $id("obs").textContent = "É hoje! 🎊";
    else $id("obs").textContent = "Passou há " + (-dias) + " dia(s).";
  }
  $id("data").addEventListener("input", calc);
  calc();
})();
`;
  return { body, js };
}

export function semana({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <span class="zlabel">Data</span>
  <input class="zinput mb" id="data" type="date" value="2026-09-08">
  <div class="zgrid" style="grid-template-columns:repeat(2,1fr)">
    <div class="zcard center"><span class="zlabel">Dia da semana</span><b class="fd acc" id="dia">—</b></div>
    <div class="zcard center"><span class="zlabel">Semana ISO</span><b class="fd acc" id="sem">—</b></div>
    <div class="zcard center"><span class="zlabel">Dia do ano</span><b class="fd acc" id="dao">—</b></div>
    <div class="zcard center"><span class="zlabel">Trimestre</span><b class="fd acc" id="tri">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var d = new Date($id("data").value + "T00:00:00");
    if(isNaN(d)){ $id("dia").textContent = "—"; return }
    $id("dia").textContent = d.toLocaleDateString("pt-BR", { weekday: "long" });
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var diaSem = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - diaSem);
    var ano1 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    $id("sem").textContent = Math.ceil(((t - ano1) / 86400000 + 1) / 7);
    var iano = new Date(d.getFullYear(), 0, 1);
    $id("dao").textContent = Math.ceil((d - iano) / 86400000) + " de " + (d.getFullYear() % 4 === 0 && d.getFullYear() % 100 !== 0 || d.getFullYear() % 400 === 0 ? 366 : 365);
    $id("tri").textContent = "T" + (Math.floor(d.getMonth() / 3) + 1);
  }
  $id("data").addEventListener("input", calc);
  calc();
})();
`;
  return { body, js };
}

export function metas({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Salvo no navegador.</p></div>
<div class="zcard pad mb" style="max-width:600px;margin:0 auto">
  <div class="row mb wrap">
    <input class="zinput grow" id="nome" placeholder="Meta (ex.: ler 12 livros)">
    <input class="zinput" id="alvo" type="number" value="12" style="width:90px" title="Meta">
    <button class="zbtn" id="add" type="button">+</button>
  </div>
</div>
<div class="col" id="lista" style="max-width:600px;margin:0 auto"></div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var CHAVE = "metas";
  var metas = Z.store.get(CHAVE, []);
  function salvar(){ Z.store.set(CHAVE, metas) }
  function render(){
    var box = $id("lista"); box.innerHTML = "";
    if(!metas.length) box.innerHTML = "<p class='dim center'>Crie sua primeira meta. 🎯</p>";
    metas.forEach(function(m){
      var pct = Math.min(100, Math.round(m.atual / m.alvo * 100));
      var d = document.createElement("div");
      d.className = "zcard";
      d.style.cssText = "padding:12px 14px;margin-bottom:10px";
      d.innerHTML = "<div class='row between mb'><b class='fd'>" + m.nome + (pct >= 100 ? " 🏆" : "") + "</b><span class='mono acc'>" + pct + "%</span></div>" +
        "<div class='zprog mb'><i style='width:" + pct + "%'></i></div>" +
        "<div class='row between'><span class='dim mono' style='font-size:12px'>" + m.atual + " / " + m.alvo + "</span>" +
        "<div class='row' style='gap:6px'><button class='zbtn sm' data-acao='mais' data-i='" + metas.indexOf(m) + "'>+1</button><button class='zbtn sm ghost' data-acao='menos' data-i='" + metas.indexOf(m) + "'>−1</button><button class='zbtn sm danger' data-acao='del' data-i='" + metas.indexOf(m) + "'>✕</button></div></div>";
      box.appendChild(d);
    });
    box.querySelectorAll("button[data-acao]").forEach(function(b){
      b.addEventListener("click", function(){
        var i = parseInt(this.dataset.i, 10), acao = this.dataset.acao;
        if(acao === "del") metas.splice(i, 1);
        else if(acao === "mais") metas[i].atual++;
        else metas[i].atual = Math.max(0, metas[i].atual - 1);
        salvar(); render();
        Z.snd(650, 0.04, "sine", 0.02);
      });
    });
  }
  $id("add").addEventListener("click", function(){
    var n = $id("nome").value.trim(), a = parseInt($id("alvo").value || 1, 10);
    if(!n) return;
    metas.push({nome: n, alvo: a, atual: 0});
    $id("nome").value = "";
    salvar(); render();
  });
  $id("nome").addEventListener("keydown", function(e){ if(e.key === "Enter") $id("add").click() });
  render();
})();
`;
  return { body, js };
}

/* ── METRÔNOMO / RESPIRAÇÃO / FRASES ────────────────────── */
export function metronomo({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad center" style="max-width:440px;margin:0 auto">
  <div class="zbig acc mb" id="bpm">100</div>
  <input type="range" id="slider" min="40" max="220" value="100" style="width:100%">
  <div class="row mt" style="justify-content:center;gap:10px;font-size:30px">
    <span id="b1">●</span><span id="b2">●</span><span id="b3">●</span><span id="b4">●</span>
  </div>
  <div class="row mt" style="justify-content:center;gap:10px">
    <button class="zbtn big" id="play" type="button">▶ Iniciar</button>
    <button class="zbtn ghost" id="tap" type="button">Tap tempo</button>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var slider = document.getElementById("slider");
  var bpm = 100, rodando = false, prox = 0, beat = 0, tid = null, taps = [];
  var $bpm = $id("bpm");
  function tick(){
    var agora = performance.now();
    if(agora < prox) { requestAnimationFrame(tick); return }
    prox = agora + 60000 / bpm;
    beat = (beat + 1) % 4;
    for(var i = 0; i < 4; i++){
      var el = $id("b" + (i + 1));
      el.style.color = i === beat ? "var(--z-acc)" : "var(--z-surface2)";
      el.style.fontSize = i === beat ? "40px" : "30px";
    }
    Z.snd(beat === 0 ? 1000 : 700, 0.04, "square", 0.04);
    requestAnimationFrame(tick);
  }
  $id("play").addEventListener("click", function(){
    rodando = !rodando;
    this.textContent = rodando ? "⏸ Pausar" : "▶ Iniciar";
    if(rodando){
      beat = -1;
      prox = performance.now();
      requestAnimationFrame(tick);
    }
  });
  slider.addEventListener("input", function(){
    bpm = parseInt(this.value, 10);
    $bpm.textContent = bpm;
  });
  $id("tap").addEventListener("click", function(){
    var agora = performance.now();
    taps.push(agora);
    if(taps.length > 6) taps.shift();
    if(taps.length >= 2){
      var deltas = [];
      for(var i = 1; i < taps.length; i++) deltas.push(taps[i] - taps[i-1]);
      var media = deltas.reduce(function(a, b){ return a + b }, 0) / deltas.length;
      bpm = Math.max(40, Math.min(220, Math.round(60000 / media)));
      slider.value = bpm;
      $bpm.textContent = bpm;
    }
  });
})();
`;
  return { body, js };
}

export function respiracao({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · 4s inspira · 7s segura · 8s expira.</p></div>
<div class="zcard pad center" style="max-width:440px;margin:0 auto">
  <div style="position:relative;width:220px;height:220px;margin:10px auto 18px;display:grid;place-items:center">
    <div id="circ" style="width:80px;height:80px;border-radius:50%;background:radial-gradient(circle at 35% 35%, #b7ffd9, var(--z-lime));box-shadow:0 0 40px rgba(125,255,106,0.4);transition:transform 4s ease-in-out"></div>
    <b class="fd" id="fase" style="position:absolute;font-size:20px;opacity:0">—</b>
  </div>
  <div class="row" style="justify-content:center"><button class="zbtn big" id="play" type="button">▶ Começar</button></div>
  <p class="dim mt" id="ciclo">Ciclos: 0</p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var rodando = false, ciclos = 0, tid = null;
  function fase(nome, escala, dur){
    $id("fase").textContent = nome;
    $id("fase").style.opacity = 1;
    $id("circ").style.transitionDuration = dur + "s";
    $id("circ").style.transform = "scale(" + escala + ")";
  }
  function ciclo(){
    if(!rodando) return;
    fase("Inspire…", 1.9, 4);
    tid = setTimeout(function(){
      fase("Segure…", 1.9, 0.3);
      tid = setTimeout(function(){
        fase("Expire…", 0.8, 8);
        tid = setTimeout(function(){
          ciclos++;
          $id("ciclo").textContent = "Ciclos: " + ciclos;
          ciclo();
        }, 8200);
      }, 7300);
    }, 4200);
  }
  $id("play").addEventListener("click", function(){
    rodando = !rodando;
    this.textContent = rodando ? "⏸ Parar" : "▶ Começar";
    if(rodando) ciclo();
    else {
      clearTimeout(tid);
      $id("fase").style.opacity = 0;
      $id("circ").style.transform = "scale(1)";
    }
  });
})();
`;
  return { body, js };
}

export function frases({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad center" style="max-width:560px;margin:0 auto;min-height:220px;display:grid;place-items:center">
  <div>
    <p class="fd" id="frase" style="font-size:24px;line-height:1.4;min-height:70px">“—”</p>
    <p class="dim mt" id="autor" style="font-size:15px"></p>
    <div class="row mt" style="justify-content:center;gap:10px">
      <button class="zbtn" id="nova" type="button">✨ Nova frase</button>
      <button class="zbtn ghost" id="copiar" type="button">📋</button>
    </div>
  </div>
</div>`;
  const js = `
(function(){
  var FRASES = ${JSON.stringify(FRASES)};
  function $id(x){return document.getElementById(x)}
  function nova(){
    var f = Z.pick(FRASES);
    $id("frase").textContent = "“" + f[0] + "”";
    $id("autor").textContent = "— " + f[1];
    Z.snd(700, 0.04, "sine", 0.02);
  }
  $id("nova").addEventListener("click", nova);
  $id("copiar").addEventListener("click", function(){ Z.copy($id("frase").textContent + " — " + $id("autor").textContent) });
  nova();
})();
`;
  return { body, js };
}

/* ── TIMESTAMP / HEX / ROT13 / ORDEM / ÂNGULOS ──────────── */
export function timestamp({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <span class="zlabel">Timestamp UNIX (segundos ou milissegundos)</span>
  <input class="zinput mb" id="ts" type="number" value="${Math.floor(Date.now() / 1000)}">
  <div class="zcard mb" style="background:var(--z-bg2);padding:12px"><b class="mono" id="r1">—</b></div>
  <div class="row" style="justify-content:center;gap:10px">
    <button class="zbtn ghost sm" id="agora" type="button">Usar agora</button>
    <button class="zbtn sm" id="copiar" type="button">📋</button>
  </div>
  <hr style="border:none;border-top:1px solid var(--z-line);margin:16px 0">
  <span class="zlabel">Ou: data → timestamp</span>
  <div class="row">
    <input class="zinput grow" id="data" type="datetime-local">
    <button class="zbtn sm" id="para" type="button">Converter</button>
  </div>
  <div class="zcard mt" style="background:var(--z-bg2);padding:12px"><b class="mono" id="r2">—</b></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var v = $id("ts").value;
    if(!v){ $id("r1").textContent = "—"; return }
    var n = parseFloat(v);
    if(n < 1e12) n = n * 1000;
    var d = new Date(n);
    $id("r1").textContent = "Local: " + d.toLocaleString("pt-BR") + " · UTC: " + d.toISOString();
  }
  $id("ts").addEventListener("input", calc);
  $id("agora").addEventListener("click", function(){ $id("ts").value = Math.floor(Date.now() / 1000); calc() });
  $id("copiar").addEventListener("click", function(){ Z.copy($id("r1").textContent) });
  $id("para").addEventListener("click", function(){
    var d = new Date($id("data").value);
    if(isNaN(d)){ $id("r2").textContent = "—"; return }
    $id("r2").textContent = "Segundos: " + Math.floor(d.getTime() / 1000) + " · Milissegundos: " + d.getTime();
  });
  calc();
})();
`;
  return { body, js };
}

export function hexTexto({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <span class="zlabel">Texto</span>
  <input class="zinput mb" id="texto" value="Zcode">
  <div class="zcard mb" style="background:var(--z-bg2);padding:12px"><b class="mono" id="hex" style="font-size:13px;word-break:break-all">—</b></div>
  <span class="zlabel">Hex (pares de bytes)</span>
  <input class="zinput mb mono" id="hexIn" placeholder="5a 63 6f 64 65">
  <div class="zcard mb" style="background:var(--z-bg2);padding:12px"><b class="mono" id="textoOut" style="font-size:13px;word-break:break-all">—</b></div>
  <div class="row" style="justify-content:center;gap:10px">
    <button class="zbtn sm" id="p1" type="button">Texto → Hex</button>
    <button class="zbtn sm" id="p2" type="button">Hex → Texto</button>
    <button class="zbtn ghost sm" id="copiar" type="button">📋 Copiar hex</button>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  $id("p1").addEventListener("click", function(){
    var bytes = new TextEncoder().encode($id("texto").value);
    $id("hex").textContent = Array.prototype.map.call(bytes, function(b){ return b.toString(16).padStart(2, "0") }).join(" ");
  });
  $id("p2").addEventListener("click", function(){
    var partes = $id("hexIn").value.replace(/[^0-9a-fA-F]/g, "").match(/.{2}/g) || [];
    var bytes = partes.map(function(p){ return parseInt(p, 16) });
    $id("textoOut").textContent = new TextDecoder().decode(new Uint8Array(bytes));
  });
  $id("copiar").addEventListener("click", function(){ Z.copy($id("hex").textContent) });
  $id("p1").click();
})();
`;
  return { body, js };
}

export function rot13({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · CIFRA CLÁSSICA: aplique duas vezes para decifrar.</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <textarea class="ztextarea mb" id="entrada" placeholder="Escreva algo..."></textarea>
  <div class="row mb" style="justify-content:center;gap:10px">
    <button class="zbtn" id="rodar" type="button">Cifrar/Decifrar</button>
    <button class="zbtn ghost" id="copiar" type="button">📋</button>
  </div>
  <div class="zcard" style="background:var(--z-bg2);padding:14px;font-family:var(--z-fm);font-size:13px;min-height:100px" id="saida">—</div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function rot(s){
    return s.replace(/[a-zA-Z]/g, function(c){
      var base = c <= "Z" ? 65 : 97;
      return String.fromCharCode((c.charCodeAt(0) - base + 13) % 26 + base);
    });
  }
  $id("rodar").addEventListener("click", function(){
    $id("saida").textContent = rot($id("entrada").value);
    Z.snd(600, 0.04, "sine", 0.02);
  });
  $id("copiar").addEventListener("click", function(){ Z.copy($id("saida").textContent) });
})();
`;
  return { body, js };
}

export function ordem({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <span class="zlabel">Participantes (um por linha)</span>
  <textarea class="ztextarea mb" id="lista" placeholder="Ana\\nBruno\\nCarla\\nDiego"></textarea>
  <button class="zbtn w mb" id="sortear" type="button">🎲 Sortear ordem</button>
  <div class="col" id="resultado"></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  $id("sortear").addEventListener("click", function(){
    var nomes = $id("lista").value.split(/\\n|,/).map(function(s){ return s.trim() }).filter(Boolean);
    if(!nomes.length){ Z.toast("Adicione nomes"); return }
    var ordem = Z.shuffle(nomes);
    var box = $id("resultado");
    box.innerHTML = "";
    ordem.forEach(function(n, i){
      var d = document.createElement("div");
      d.className = "zcard row";
      d.style.cssText = "padding:10px 14px;margin-bottom:7px";
      d.innerHTML = "<b class='acc fd' style='width:34px'>" + (i + 1) + "º</b><span>" + n + "</span>";
      box.appendChild(d);
      setTimeout(function(){
        d.style.opacity = 1;
        Z.snd(500 + i * 80, 0.04, "sine", 0.02);
      }, i * 260);
    });
  });
})();
`;
  return { body, js };
}

export function angulos({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Graus (°)</span><input class="zinput" id="g" type="number" step="any" value="45"></div>
    <div><span class="zlabel">Radianos</span><input class="zinput" id="r" type="number" step="any"></div>
  </div>
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">Complemento</span><b class="fd acc" id="comp">—</b></div>
    <div class="zcard center"><span class="zlabel">Suplemento</span><b class="fd acc" id="sup">—</b></div>
    <div class="zcard center"><span class="zlabel">Voltantes</span><b class="fd acc" id="volt">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function deG(){
    var g = parseFloat($id("g").value);
    if(isNaN(g)) return;
    $id("r").value = Z.fmt(g * Math.PI / 180, 6);
    $id("comp").textContent = g <= 90 ? Z.fmt(90 - g, 2) + "°" : "—";
    $id("sup").textContent = g <= 180 ? Z.fmt(180 - g, 2) + "°" : "—";
    $id("volt").textContent = Z.fmt(g / 360, 4);
  }
  function deR(){
    var r = parseFloat($id("r").value);
    if(isNaN(r)) return;
    $id("g").value = Z.fmt(r * 180 / Math.PI, 4);
    deG();
  }
  $id("g").addEventListener("input", deG);
  $id("r").addEventListener("input", deR);
  deG();
})();
`;
  return { body, js };
}

export function jurosSimples({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · J = C · i · t</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <div class="zgrid zg3 mb">
    <div><span class="zlabel">Capital (R$)</span><input class="zinput" id="c" type="number" value="1000"></div>
    <div><span class="zlabel">Taxa ao mês (%)</span><input class="zinput" id="i" type="number" value="2" step="0.1"></div>
    <div><span class="zlabel">Meses</span><input class="zinput" id="t" type="number" value="6"></div>
  </div>
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">Juros</span><b class="fd acc" id="j">—</b></div>
    <div class="zcard center"><span class="zlabel">Montante</span><b class="fd acc" id="m">—</b></div>
    <div class="zcard center"><span class="zlabel">Juros simples no total</span><b class="fd" id="pct" style="font-size:18px">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var c = parseFloat($id("c").value) || 0;
    var i = (parseFloat($id("i").value) || 0) / 100;
    var t = Math.max(0, parseFloat($id("t").value) || 0);
    var j = c * i * t;
    $id("j").textContent = "R$ " + Z.fmt(j, 2);
    $id("m").textContent = "R$ " + Z.fmt(c + j, 2);
    $id("pct").textContent = Z.fmt(i * t * 100, 1) + "%";
  }
  ["c", "i", "t"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

export function personagem({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Para RPG, escrita criativa ou pura diversão.</p></div>
<div class="zcard pad center" style="max-width:520px;margin:0 auto">
  <div class="zbig acc" id="nome" style="font-size:clamp(26px,6vw,40px)">—</div>
  <p class="fd mt" id="classe" style="font-size:18px;color:var(--z-acc)">—</p>
  <p class="dim" id="origem" style="font-size:15px">—</p>
  <div class="row mt" style="justify-content:center;gap:10px">
    <button class="zbtn" id="novo" type="button">🎲 Novo personagem</button>
    <button class="zbtn ghost" id="copiar" type="button">📋</button>
  </div>
</div>`;
  const js = `
(function(){
  var D = ${JSON.stringify(NOMES_PERSONAGEM)};
  function $id(x){return document.getElementById(x)}
  function novo(){
    var nome = Z.pick(D.silabas) + Z.pick(D.finais);
    $id("nome").textContent = nome;
    $id("classe").textContent = Z.pick(D.classes);
    $id("origem").textContent = Z.pick(D.origens) + " · Nível " + Z.rnd(1, 20);
    Z.snd(700 + Z.rnd(0, 300), 0.05, "sine", 0.02);
  }
  $id("novo").addEventListener("click", novo);
  $id("copiar").addEventListener("click", function(){
    Z.copy($id("nome").textContent + ", " + $id("classe").textContent + " " + $id("origem").textContent);
  });
  novo();
})();
`;
  return { body, js };
}

/* ── NÚMERO POR EXTENSO ─────────────────────────────────── */
export function porExtenso({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Até 999.999.999.</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <input class="zinput mb" id="num" type="number" value="1234567">
  <div class="zcard" style="background:var(--z-bg2);padding:14px"><b id="saida" style="font-size:16px;line-height:1.5">—</b></div>
  <div class="row mt" style="justify-content:center"><button class="zbtn sm" id="copiar" type="button">📋 Copiar</button></div>
</div>`;
  const js = `
(function(){
  var UNI = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  var DEZ = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  var CENT = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
  function $id(x){return document.getElementById(x)}
  function trio(n){
    var c = Math.floor(n / 100), d = Math.floor((n % 100) / 10), u = n % 10;
    var partes = [];
    if(c) partes.push(CENT[c]);
    if(d && d === 1) partes.push(u ? UNI[10 + u] : "dez");
    else {
      if(d) partes.push(DEZ[d] + (u ? " e " + UNI[u] : ""));
      else if(!c && u) partes.push(UNI[u]);
    }
    if(partes.length === 2 && partes[0] !== "" && partes[1]) partes[1] = " e " + partes[1];
    return partes.join(" ");
  }
  function falar(n){
    if(n === 0) return "zero";
    var milhoes = Math.floor(n / 1e6);
    var milhares = Math.floor((n % 1e6) / 1000);
    var resto = n % 1000;
    var partes = [];
    if(milhoes) partes.push(milhoes === 1 ? "um milhão" : trio(milhoes) + " milhões");
    if(milhares) partes.push(milhares === 1 ? "mil" : trio(milhares) + " mil");
    if(resto) partes.push(trio(resto));
    return partes.join(" e ");
  }
  function atualizar(){
    var n = parseInt($id("num").value, 10);
    if(isNaN(n) || n < 0 || n > 999999999){ $id("saida").textContent = "—"; return }
    $id("saida").textContent = falar(n);
  }
  $id("num").addEventListener("input", atualizar);
  $id("copiar").addEventListener("click", function(){ Z.copy($id("saida").textContent) });
  atualizar();
})();
`;
  return { body, js };
}

/* ── DIVISÃO DE CONTA ───────────────────────────────────── */
export function dividaConta({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Divida a conta com ou sem gorjeta.</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Total da conta (R$)</span><input class="zinput" id="total" type="number" value="180"></div>
    <div><span class="zlabel">Pessoas que pagam</span><input class="zinput" id="n" type="number" value="4"></div>
  </div>
  <div class="col mb">
    <div class="row between"><span class="zlabel" style="margin:0">Gorjeta (%)</span><b class="acc mono" id="gV">10</b></div>
    <input type="range" id="g" min="0" max="30" value="10" style="width:100%">
  </div>
  <div class="zcard center" style="background:var(--z-bg2)">
    <div class="zbig acc" id="cada">—</div>
    <p class="dim">cada um paga</p>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var t = parseFloat($id("total").value) || 0;
    var n = Math.max(1, parseInt($id("n").value || 1, 10));
    var g = parseInt($id("g").value, 10);
    $id("gV").textContent = g + "%";
    var tot = t * (1 + g / 100);
    $id("cada").textContent = "R$ " + Z.fmt(tot / n, 2);
  }
  ["total", "n"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  $id("g").addEventListener("input", calc);
  calc();
})();
`;
  return { body, js };
}
