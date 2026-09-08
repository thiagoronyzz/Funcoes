/* Zcode — engines de Úteis (parte 4: cor, contraste, matemática) */

/* ── CORES ──────────────────────────────────────────────── */
export function cor({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <div class="row mb wrap" style="justify-content:center;gap:14px">
    <input type="color" id="pick" value="#7c5cff" style="width:84px;height:84px;border-radius:18px;border:2px solid var(--z-line2);background:var(--z-surface2);cursor:pointer">
    <div class="col grow" style="gap:8px;min-width:200px">
      <div><span class="zlabel">HEX</span><input class="zinput mono" id="hex" value="#7C5CFF" maxlength="7"></div>
      <div class="row" style="gap:8px">
        <div class="grow"><span class="zlabel">R</span><input class="zinput mono" id="r" type="number" value="124" min="0" max="255"></div>
        <div class="grow"><span class="zlabel">G</span><input class="zinput mono" id="g" type="number" value="92" min="0" max="255"></div>
        <div class="grow"><span class="zlabel">B</span><input class="zinput mono" id="b" type="number" value="255" min="0" max="255"></div>
      </div>
      <div><span class="zlabel">HSL</span><b class="mono acc" id="hsl">—</b></div>
    </div>
  </div>
  <span class="zlabel">Tons (claro → escuro)</span>
  <div class="row mb" id="tons" style="gap:6px"></div>
  <div class="row" style="justify-content:center;gap:10px">
    <button class="zbtn" id="aleatorio" type="button">Dado Cor aleatória</button>
    <button class="zbtn ghost" id="complementar" type="button">Complementar</button>
    <button class="zbtn ghost" id="copiar" type="button">Copiar Copiar</button>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function clamp(n){ return Math.max(0, Math.min(255, n)) }
  function rgb2hsl(r, g, b){
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2;
    if(mx !== mn){
      var d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if(mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if(mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }
  function atualizar(r, g, b){
    r = clamp(Math.round(r)); g = clamp(Math.round(g)); b = clamp(Math.round(b));
    var hex = "#" + [r, g, b].map(function(x){ return x.toString(16).padStart(2, "0") }).join("").toUpperCase();
    $id("hex").value = hex;
    $id("r").value = r; $id("g").value = g; $id("b").value = b;
    $id("pick").value = hex;
    var hsl = rgb2hsl(r, g, b);
    $id("hsl").textContent = "hsl(" + hsl[0] + ", " + hsl[1] + "%, " + hsl[2] + "%)";
    var box = $id("tons");
    box.innerHTML = "";
    for(var i = 0; i < 8; i++){
      // scale toward white (first 4) and black (last 4)
      var v;
      if(i < 4){ var w = i * 0.25; v = Math.round(r + (255 - r) * w) + "," + Math.round(g + (255 - g) * w) + "," + Math.round(b + (255 - b) * w) }
      else { var k = (i - 4) * 0.25; v = Math.round(r * (1 - k)) + "," + Math.round(g * (1 - k)) + "," + Math.round(b * (1 - k)) }
      var d = document.createElement("div");
      d.style.cssText = "flex:1;height:44px;border-radius:10px;background:rgb(" + v + ");cursor:pointer";
      d.title = "rgb(" + v + ")";
      d.addEventListener("click", function(){ Z.copy("rgb(" + v + ")"); Z.toast("Copiado!", 900) });
      box.appendChild(d);
    }
  }
  function doInput(){ atualizar(parseFloat($id("r").value), parseFloat($id("g").value), parseFloat($id("b").value)) }
  ["r", "g", "b"].forEach(function(x){ $id(x).addEventListener("input", doInput) });
  $id("hex").addEventListener("input", function(){
    var v = this.value.trim().replace(/^#/, "");
    if(v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
    if(/^[0-9a-fA-F]{6}$/.test(v)){
      atualizar(parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16));
    }
  });
  $id("pick").addEventListener("input", function(){
    var v = this.value.replace(/^#/, "");
    atualizar(parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16));
  });
  $id("aleatorio").addEventListener("click", function(){
    atualizar(Z.rnd(0, 255), Z.rnd(0, 255), Z.rnd(0, 255));
    Z.snd(800, 0.04, "sine", 0.02);
  });
  $id("complementar").addEventListener("click", function(){
    var r = parseInt($id("r").value, 10), g = parseInt($id("g").value, 10), b = parseInt($id("b").value, 10);
    atualizar(255 - r, 255 - g, 255 - b);
  });
  $id("copiar").addEventListener("click", function(){ Z.copy($id("hex").value) });
  atualizar(124, 92, 255);
})();
`;
  return { body, js };
}

/* ── CONTRASTE ──────────────────────────────────────────── */
export function contraste({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Acessibilidade WCAG.</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Cor do texto</span><input type="color" id="fg" value="#edf0ff" style="width:100%;height:52px;border-radius:10px;border:1px solid var(--z-line2);background:var(--z-surface2)"></div>
    <div><span class="zlabel">Fundo</span><input type="color" id="bg" value="#05070f" style="width:100%;height:52px;border-radius:10px;border:1px solid var(--z-line2);background:var(--z-surface2)"></div>
  </div>
  <div class="zcard mb" id="amostra" style="padding:20px;text-align:center">
    <div class="fd" style="font-size:22px">Texto grande (AA: 3:1)</div>
    <div style="font-size:14px">Texto normal (AA: 4.5:1 · AAA: 7:1)</div>
  </div>
  <div class="zcard center mb" style="background:var(--z-bg2)">
    <div class="zbig acc" id="razao">—</div>
    <p class="dim">razão de contraste</p>
  </div>
  <div class="zgrid" style="grid-template-columns:repeat(2,1fr)">
    <div class="zcard center"><span class="zlabel">Normal — AA</span><b class="fd" id="aa">—</b></div>
    <div class="zcard center"><span class="zlabel">Normal — AAA</span><b class="fd" id="aaa">—</b></div>
    <div class="zcard center"><span class="zlabel">Grande — AA</span><b class="fd" id="aag">—</b></div>
    <div class="zcard center"><span class="zlabel">Grande — AAA</span><b class="fd" id="aaag">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function lum(hex){
    var v = hex.replace("#", "");
    var rgb = [0, 2, 4].map(function(i){ return parseInt(v.slice(i, i + 2), 16) / 255 });
    var lin = rgb.map(function(c){ return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) });
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  }
  function calc(){
    var fg = $id("fg").value, bg = $id("bg").value;
    var l1 = lum(fg), l2 = lum(bg);
    var razao = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    $id("amostra").style.color = fg;
    $id("amostra").style.background = bg;
    $id("razao").textContent = Z.fmt(razao, 2) + " : 1";
    var marc = function(el, ok){ el.textContent = ok ? "OK Passa" : "Não Falha"; el.style.color = ok ? "var(--z-lime)" : "var(--z-red)" };
    marc($id("aa"), razao >= 4.5);
    marc($id("aaa"), razao >= 7);
    marc($id("aag"), razao >= 3);
    marc($id("aaag"), razao >= 4.5);
  }
  ["fg", "bg"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

/* ── MÉDIA PONDERADA ────────────────────────────────────── */
export function mediaPond({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad mb" style="max-width:560px;margin:0 auto">
  <div class="row mb wrap">
    <input class="zinput grow" id="nota" type="number" step="0.1" placeholder="Nota" min="0" max="10">
    <input class="zinput" id="peso" type="number" placeholder="Peso" value="1" style="width:90px">
    <button class="zbtn" id="add" type="button">Adicionar</button>
  </div>
  <div class="col" id="lista"></div>
</div>
<div class="zcard pad center" style="max-width:560px;margin:0 auto;background:var(--z-bg2)">
  <div class="zbig acc" id="media">—</div>
  <p class="dim">média ponderada</p>
  <p class="fd mt" id="situacao" style="font-size:16px;color:var(--z-acc)"></p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var items = [];
  function render(){
    var box = $id("lista");
    box.innerHTML = "";
    if(!items.length){
      box.innerHTML = "<p class='dim center'>Adicione notas com pesos. Ex.: prova 8 (peso 2) + trabalho 9 (peso 1).</p>";
    }
    items.forEach(function(it, i){
      var d = document.createElement("div");
      d.className = "zcard row between";
      d.style.cssText = "padding:10px 14px;margin-bottom:8px";
      d.innerHTML = "<span>#" + (i + 1) + ": nota <b class='mono acc'>" + it.nota + "</b> · peso <b class='mono'>" + it.peso + "</b></span><button class='zbtn sm danger' data-i='" + i + "'>Fechar</button>";
      box.appendChild(d);
      d.querySelector("button").addEventListener("click", function(){
        items.splice(parseInt(this.dataset.i, 10), 1);
        render();
      });
    });
    var pn = 0, s = 0;
    items.forEach(function(it){ pn += it.peso; s += it.nota * it.peso });
    if(pn > 0){
      var m = s / pn;
      $id("media").textContent = Z.fmt(m, 2);
      $id("situacao").textContent = m >= 7 ? "Concluído Aprovado!" : m >= 5 ? "Balança Na beirada…" : "Desconforto Reprovado — vale a recuperação";
    } else {
      $id("media").textContent = "—";
      $id("situacao").textContent = "";
    }
  }
  $id("add").addEventListener("click", function(){
    var n = parseFloat($id("nota").value), p = parseFloat($id("peso").value) || 1;
    if(isNaN(n) || n < 0 || n > 10 || p <= 0){ Z.toast("Nota 0-10 e peso maior que 0"); return }
    items.push({nota: n, peso: p});
    $id("nota").value = "";
    render();
    Z.snd(700, 0.04, "sine", 0.02);
  });
  render();
})();
`;
  return { body, js };
}

/* ── COMPARADOR DE NÚMEROS ───────────────────────────────── */
export function comparador({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <div class="row mb" style="align-items:center;gap:12px">
    <input class="zinput mono grow" id="a" type="number" step="any" value="42" style="font-size:24px;text-align:center">
    <b class="fd acc" id="sinal" style="font-size:34px;width:52px;text-align:center">=</b>
    <input class="zinput mono grow" id="b" type="number" step="any" value="42" style="font-size:24px;text-align:center">
  </div>
  <div class="zcard center" style="background:var(--z-bg2)">
    <p class="fd" id="frase" style="font-size:18px">—</p>
    <p class="mono dim" id="diff" style="font-size:14px"></p>
  </div>
  <div class="zgrid mt" style="grid-template-columns:repeat(2,1fr)">
    <div class="zcard center"><span class="zlabel">Maior</span><b class="fd acc" id="maior">—</b></div>
    <div class="zcard center"><span class="zlabel">Menor</span><b class="fd acc" id="menor">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var a = parseFloat($id("a").value), b = parseFloat($id("b").value);
    if(isNaN(a) || isNaN(b)){ $id("sinal").textContent = "—"; $id("frase").textContent = "Digite dois números."; return }
    var s = a > b ? ">" : a < b ? "<" : "=";
    $id("sinal").textContent = s;
    $id("maior").textContent = a >= b ? Z.fmt(Math.max(a, b), 6) : Z.fmt(Math.max(a, b), 6);
    $id("menor").textContent = Z.fmt(Math.min(a, b), 6);
    if(s === "="){
      $id("frase").textContent = "São iguais! Alvo";
      $id("diff").textContent = "";
    } else {
      var d = Math.abs(a - b);
      var pct = b !== 0 ? Z.fmt(d / Math.abs(b) * 100, 1) + "%" : "—";
      $id("frase").textContent = (a > b ? Z.fmt(a, 6) : Z.fmt(b, 6)) + " é maior";
      $id("diff").textContent = "Diferença: " + Z.fmt(d, 6) + " · " + pct + " de " + Z.fmt(Math.abs(b), 6);
    }
  }
  ["a", "b"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}
