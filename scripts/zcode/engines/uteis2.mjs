/* Zcode — engines de Úteis (parte 2) */
import { PALAVRAS_SENHA, NOMES_PERSONAGEM, FRASES } from "../data/uteis.mjs";

/* ── GERADOR DE SENHAS ──────────────────────────────────── */
export function senha({ nome, sub, frase }) {
  const body = frase ? `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <div class="zcard center mb" style="background:var(--z-bg2);font-family:var(--z-fm);font-size:17px;word-break:break-all;padding:16px" id="saida">—</div>
  <div class="zgrid zg3 mb">
    <div><span class="zlabel">Palavras</span><input class="zinput" id="qtd" type="number" min="3" max="10" value="5"></div>
    <div><span class="zlabel">Separador</span><select class="zselect" id="sep"><option>-</option><option>_</option><option>.</option><option>*</option></select></div>
    <div class="row" style="align-items:flex-end"><button class="zbtn w" id="gerar" type="button">Gerar</button></div>
  </div>
  <div class="row" style="justify-content:center"><button class="zbtn ghost sm" id="copiar" type="button">📋 Copiar</button></div>
  <p class="dim center mt" style="font-size:12.5px">Frase-passe forte: fácil de lembrar, difícil de adivinhar (diceware).</p>
</div>` : `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <div class="zcard center mb" style="background:var(--z-bg2);font-family:var(--z-fm);font-size:16px;word-break:break-all;padding:16px" id="saida">—</div>
  <div class="col mb">
    <div class="row between"><span class="zlabel" style="margin:0">Comprimento</span><b class="acc mono" id="tamV">16</b></div>
    <input type="range" id="tam" min="6" max="48" value="16" style="width:100%">
  </div>
  <div class="zgrid zg2 mb" style="gap:8px">
    <label class="zcard row" style="padding:10px 14px;cursor:pointer"><input type="checkbox" id="maius" checked> <span>Maiúsculas (A-Z)</span></label>
    <label class="zcard row" style="padding:10px 14px;cursor:pointer"><input type="checkbox" id="minus" checked> <span>Minúsculas (a-z)</span></label>
    <label class="zcard row" style="padding:10px 14px;cursor:pointer"><input type="checkbox" id="num" checked> <span>Números (0-9)</span></label>
    <label class="zcard row" style="padding:10px 14px;cursor:pointer"><input type="checkbox" id="simb" checked> <span>Símbolos (!@#$…)</span></label>
  </div>
  <div class="row" style="justify-content:center;gap:10px">
    <button class="zbtn" id="gerar" type="button">🎲 Gerar</button>
    <button class="zbtn ghost" id="copiar" type="button">📋 Copiar</button>
  </div>
  <div class="col mt center"><span class="zchip">Força: <b class="acc" id="forca">—</b></span></div>
</div>`;
  const js = frase
    ? `
(function(){
  var PAL = ${JSON.stringify(PALAVRAS_SENHA)};
  function $id(x){return document.getElementById(x)}
  function gerar(){
    var n = Math.max(3, Math.min(10, parseInt($id("qtd").value || 5, 10)));
    var sep = $id("sep").value;
    var out = [];
    for(var i = 0; i < n; i++) out.push(Z.pick(PAL));
    var s = out.join(sep) + Z.rnd(10, 99);
    $id("saida").textContent = s;
    Z.snd(700, 0.05, "sine");
  }
  $id("gerar").addEventListener("click", gerar);
  $id("copiar").addEventListener("click", function(){ Z.copy($id("saida").textContent) });
  gerar();
})();`
    : `
(function(){
  function $id(x){return document.getElementById(x)}
  function rand(n){
    var arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % n;
  }
  function entropia(s){
    var pool = 0;
    if(/[a-z]/.test(s)) pool += 26;
    if(/[A-Z]/.test(s)) pool += 26;
    if(/[0-9]/.test(s)) pool += 10;
    if(/[^a-zA-Z0-9]/.test(s)) pool += 25;
    return s.length * Math.log2(Math.max(pool, 2));
  }
  function gerar(){
    var chars = "";
    if($id("maius").checked) chars += "ABCDEFGHJKLMNPQRSTUVWXYZ";
    if($id("minus").checked) chars += "abcdefghijkmnopqrstuvwxyz";
    if($id("num").checked) chars += "23456789";
    if($id("simb").checked) chars += "!@#$%&*+-=?_";
    if(!chars){ Z.toast("Escolha ao menos um grupo"); return }
    var tam = parseInt($id("tam").value, 10);
    var out = [];
    for(var i = 0; i < tam; i++) out.push(chars[rand(chars.length)]);
    var s = out.join("");
    $id("saida").textContent = s;
    var bits = entropia(s);
    var f = bits > 100 ? " Blindada" : bits > 70 ? "🔒 Muito forte" : bits > 50 ? "✅ Boa" : "⚠ Fraca — aumente o tamanho";
    $id("forca").textContent = f + " (" + Math.round(bits) + " bits)";
    Z.snd(700, 0.05, "sine");
  }
  $id("tam").addEventListener("input", function(){
    $id("tamV").textContent = this.value;
    gerar();
  });
  ["maius", "minus", "num", "simb"].forEach(function(i){ $id(i).addEventListener("change", gerar) });
  $id("gerar").addEventListener("click", gerar);
  $id("copiar").addEventListener("click", function(){ Z.copy($id("saida").textContent) });
  gerar();
})();`;
  return { body, js };
}

/* ── BASE64 ─────────────────────────────────────────────── */
export function base64({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <span class="zlabel">Texto original</span>
  <textarea class="ztextarea mb" id="entrada" placeholder="Digite ou cole seu texto..."></textarea>
  <div class="row mb" style="justify-content:center;gap:10px">
    <button class="zbtn" id="enc" type="button">⇡ Codificar</button>
    <button class="zbtn" id="dec" type="button">⇩ Decodificar</button>
    <button class="zbtn ghost" id="copiar" type="button">📋 Copiar saída</button>
  </div>
  <span class="zlabel">Resultado</span>
  <textarea class="ztextarea" id="saida" readonly placeholder="O resultado aparece aqui..."></textarea>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function enc(){
    try {
      var bytes = new TextEncoder().encode($id("entrada").value);
      var bin = "";
      bytes.forEach(function(b){ bin += String.fromCharCode(b) });
      $id("saida").value = btoa(bin);
    } catch(e){ Z.toast("Falha ao codificar") }
  }
  function dec(){
    try {
      var bin = atob($id("entrada").value.trim());
      var bytes = new Uint8Array(bin.length);
      for(var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      $id("saida").value = new TextDecoder().decode(bytes);
    } catch(e){ Z.toast("Base64 inválido") }
  }
  $id("enc").addEventListener("click", enc);
  $id("dec").addEventListener("click", dec);
  $id("copiar").addEventListener("click", function(){ Z.copy($id("saida").value) });
})();
`;
  return { body, js };
}

/* ── HASH ──────────────────────────────────────────────── */
export function hash({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <span class="zlabel">Texto</span>
  <textarea class="ztextarea mb" id="entrada" placeholder="Digite o texto para hashear..."></textarea>
  <div class="col" id="saida"></div>
</div>`;
  const js = `
(function(){
  var ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
  var box = document.getElementById("saida");
  var linhas = {};
  ALGOS.forEach(function(a){
    var d = document.createElement("div");
    d.className = "zcard mb";
    d.style.cssText = "background:var(--z-bg2)";
    d.innerHTML = "<p class='zchip mb' style='display:block;margin-left:0'>" + a + "</p><code class='mono' style='font-size:11.5px;word-break:break-all' id='h-" + a + "'>—</code>";
    box.appendChild(d);
    linhas[a] = d;
  });
  async function calcular(){
    var texto = document.getElementById("entrada").value;
    var bytes = new TextEncoder().encode(texto);
    for(var i = 0; i < ALGOS.length; i++){
      var a = ALGOS[i];
      try {
        var buf = await crypto.subtle.digest(a, bytes);
        var hex = Array.prototype.map.call(new Uint8Array(buf), function(b){ return b.toString(16).padStart(2, "0") }).join("");
        document.getElementById("h-" + a).textContent = hex;
      } catch(e){
        document.getElementById("h-" + a).textContent = "não suportado neste navegador";
      }
    }
  }
  document.getElementById("entrada").addEventListener("input", calcular);
  calcular();
})();
`;
  return { body, js };
}

/* ── UUID ───────────────────────────────────────────────── */
export function uuid({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad center" style="max-width:560px;margin:0 auto">
  <div class="zgrid" id="lista" style="text-align:left"></div>
  <div class="row mt" style="justify-content:center;gap:10px">
    <button class="zbtn" id="gerar" type="button">🎲 Gerar 1</button>
    <button class="zbtn ghost" id="gerar10" type="button">Gerar 10</button>
    <button class="zbtn ghost" id="copiar" type="button">📋 Copiar todos</button>
  </div>
</div>`;
  const js = `
(function(){
  var lista = [];
  function novo(){
    if(crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c){
      var r = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
      var v = c === "x" ? r : (r % 4) + 8;
      return v.toString(16);
    });
  }
  function add(n){
    for(var i = 0; i < n; i++){
      var u = novo();
      lista.unshift(u);
      var d = document.createElement("code");
      d.className = "mono";
      d.style.cssText = "display:block;background:var(--z-bg2);border:1px solid var(--z-line);border-radius:10px;padding:10px 12px;font-size:12.5px;margin-bottom:6px;word-break:break-all";
      d.textContent = u;
      document.getElementById("lista").appendChild(d);
    }
    if(lista.length > 50) while(document.getElementById("lista").children.length > 50) document.getElementById("lista").lastChild.remove();
  }
  document.getElementById("gerar").addEventListener("click", function(){ add(1) });
  document.getElementById("gerar10").addEventListener("click", function(){ add(10) });
  document.getElementById("copiar").addEventListener("click", function(){ Z.copy(lista.join("\\n")) });
  add(3);
})();
`;
  return { body, js };
}

/* ── NÚMERO ALEATÓRIO ───────────────────────────────────── */
export function aleatorio({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:480px;margin:0 auto">
  <div class="zgrid zg3 mb">
    <div><span class="zlabel">Mínimo</span><input class="zinput" id="min" type="number" value="1"></div>
    <div><span class="zlabel">Máximo</span><input class="zinput" id="max" type="number" value="100"></div>
    <div><span class="zlabel">Quantos</span><input class="zinput" id="qtd" type="number" value="1" min="1" max="100"></div>
  </div>
  <div class="zcard center mb" style="background:var(--z-bg2)">
    <div class="zbig acc" id="resultado">—</div>
  </div>
  <div class="row" style="justify-content:center;gap:10px">
    <button class="zbtn" id="sortear" type="button">🎲 Sortear</button>
    <button class="zbtn ghost" id="copiar" type="button">📋 Copiar</button>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function sortear(){
    var a = parseInt($id("min").value, 10), b = parseInt($id("max").value, 10), n = Math.max(1, Math.min(100, parseInt($id("qtd").value || 1, 10)));
    if(isNaN(a) || isNaN(b) || b < a){ Z.toast("Verifique mínimo/máximo"); return }
    var out = [];
    for(var i = 0; i < n; i++) out.push(Z.rnd(a, b));
    $id("resultado").textContent = out.length === 1 ? out[0] : out.join(", ");
    Z.snd(700, 0.06, "sine");
  }
  $id("sortear").addEventListener("click", sortear);
  $id("copiar").addEventListener("click", function(){ Z.copy($id("resultado").textContent) });
  sortear();
})();
`;
  return { body, js };
}

/* ── SORTEADOR DE NOMES / OPÇÕES ────────────────────────── */
export function sorteador({ nome, sub, modo }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <span class="zlabel">${modo === "opcoes" ? "Opções (uma por linha)" : "Lista de nomes (um por linha)"}</span>
  <textarea class="ztextarea mb" id="lista" placeholder="Ana\\nBruno\\nCarla"></textarea>
  <div class="row mb wrap" style="justify-content:center;gap:10px">
    <button class="zbtn" id="sortear" type="button">🎲 Sortear 1</button>
    ${modo === "nomes" ? '<button class="zbtn ghost" id="sortear3" type="button">Sortear 3</button>' : ""}
  </div>
  <div class="zcard center" style="background:var(--z-bg2);min-height:80px;display:grid;place-items:center">
    <b class="fd acc" id="resultado" style="font-size:24px">—</b>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function itens(){
    return $id("lista").value.split(/\\n|,|;/).map(function(s){ return s.trim() }).filter(Boolean);
  }
  function sortear(n){
    var lista = itens();
    if(lista.length < n){ Z.toast("Adicione " + n + " item(ns)"); return }
    var sort = Z.shuffle(lista).slice(0, n);
    $id("resultado").textContent = sort.join(n > 1 ? ", " : "");
    Z.snd(900, 0.1, "sine");
    var t = 0;
    var tick = setInterval(function(){
      t++;
      if(t < 12) $id("resultado").textContent = Z.pick(lista);
      else { clearInterval(tick); $id("resultado").textContent = sort.join(n > 1 ? ", " : "") }
    }, 90);
  }
  $id("sortear").addEventListener("click", function(){ sortear(1) });
  ${modo === "nomes" ? '$id("sortear3").addEventListener("click", function(){ sortear(3) });' : ""}
})();
`;
  return { body, js };
}

/* ── MOEDA ──────────────────────────────────────────────── */
export function moeda({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad center" style="max-width:440px;margin:0 auto">
  <div id="moeda" style="font-size:110px;line-height:1.2;margin:10px 0 18px;cursor:pointer;user-select:none">🪙</div>
  <p class="fd" id="resultado" style="font-size:22px;min-height:30px">Toque para lançar!</p>
  <div class="row mt" style="justify-content:center;gap:10px">
    <span class="zchip">Caras: <b class="acc" id="c">0</b></span>
    <span class="zchip">Coroas: <b class="acc" id="k">0</b></span>
  </div>
</div>`;
  const js = `
(function(){
  var $id = function(x){return document.getElementById(x)};
  var caras = 0, coroas = 0, girando = false;
  $id("moeda").addEventListener("click", function(){
    if(girando) return;
    girando = true;
    $id("resultado").textContent = "";
    var giro = 0;
    var tick = setInterval(function(){
      giro++;
      $id("moeda").style.transform = "rotateY(" + giro * 180 + "deg) scale(" + (1 + Math.sin(giro) * 0.08) + ")";
      if(giro > 10){
        clearInterval(tick);
        $id("moeda").style.transform = "";
        var cara = Math.random() < 0.5;
        if(cara){ caras++; $id("c").textContent = caras }
        else { coroas++; $id("k").textContent = coroas }
        $id("resultado").textContent = cara ? "CARAS! ☀️" : "COROA! 🌙";
        Z.snd(cara ? 900 : 600, 0.12, "sine");
        girando = false;
      }
    }, 80);
  });
})();
`;
  return { body, js };
}

/* ── CONTADOR DE TEXTO ──────────────────────────────────── */
export function textoStats({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <textarea class="ztextarea mb" id="texto" style="min-height:220px" placeholder="Escreva ou cole seu texto..."></textarea>
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">Caracteres</span><b class="fd acc" id="c" style="font-size:24px">0</b></div>
    <div class="zcard center"><span class="zlabel">Sem espaços</span><b class="fd acc" id="cs" style="font-size:24px">0</b></div>
    <div class="zcard center"><span class="zlabel">Palavras</span><b class="fd acc" id="p" style="font-size:24px">0</b></div>
    <div class="zcard center"><span class="zlabel">Frases</span><b class="fd acc" id="f" style="font-size:24px">0</b></div>
    <div class="zcard center"><span class="zlabel">Linhas</span><b class="fd acc" id="l" style="font-size:24px">0</b></div>
    <div class="zcard center"><span class="zlabel">Leitura</span><b class="fd acc" id="t" style="font-size:24px">0 min</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function atualizar(){
    var t = $id("texto").value;
    var palavras = t.trim() ? t.trim().split(/\\s+/) : [];
    var frases = t.split(/[.!?…]+/).filter(function(s){ return s.trim().length > 1 });
    var linhas = t ? t.split("\\n").length : 0;
    $id("c").textContent = t.length;
    $id("cs").textContent = t.replace(/\\s/g, "").length;
    $id("p").textContent = palavras.length;
    $id("f").textContent = frases.length;
    $id("l").textContent = linhas;
    var min = Math.max(1, Math.ceil(palavras.length / 200));
    $id("t").textContent = palavras.length ? min + " min" : "0 min";
  }
  $id("texto").addEventListener("input", atualizar);
  atualizar();
})();
`;
  return { body, js };
}

/* ── CONVERSOR DE CAIXA ─────────────────────────────────── */
export function caseConv({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <textarea class="ztextarea mb" id="entrada" placeholder="Digite aqui: meu texto de exemplo"></textarea>
  <div class="col" id="saida"></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var MODOS = [
    ["MAIÚSCULAS", function(s){ return s.toUpperCase() }],
    ["minúsculas", function(s){ return s.toLowerCase() }],
    ["Primeira De Cada Palavra", function(s){ return s.toLowerCase().replace(/\\w/g, function(c, i, str){ return (i === 0 || /\\s/.test(str[i-1])) ? c.toUpperCase() : c }) }],
    ["camelCase", function(s){ return s.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, function(m, c){ return c.toUpperCase() }).replace(/^[A-Z]/, function(c){ return c.toLowerCase() }) }],
    ["snake_case", function(s){ return s.trim().toLowerCase().replace(/\\s+/g, "_").replace(/[^a-z0-9_]/g, "") }],
    ["kebab-case", function(s){ return s.trim().toLowerCase().replace(/\\s+/g, "-").replace(/[^a-z0-9-]/g, "") }],
    ["CONSTANT_CASE", function(s){ return s.trim().toUpperCase().replace(/\\s+/g, "_").replace(/[^A-Z0-9_]/g, "") }],
    ["AlTeRnAdO", function(s){ return s.split("").map(function(c, i){ return i % 2 ? c.toUpperCase() : c.toLowerCase() }).join("") }],
    ["invertido onret", function(s){ return s.split("").reverse().join("") }],
    ["  espacado", function(s){ return s.replace(/\\s+/g, " ").replace(/\\n/g, " ¶ ") }],
  ];
  var box = $id("saida");
  MODOS.forEach(function(m){
    var d = document.createElement("div");
    d.className = "zcard row between wrap";
    d.style.cssText = "padding:10px 14px;margin-bottom:7px;background:var(--z-bg2)";
    var label = document.createElement("b");
    label.className = "mono";
    label.style.cssText = "font-size:12px;color:var(--z-acc)";
    label.textContent = m[0];
    var out = document.createElement("code");
    out.className = "mono";
    out.style.cssText = "font-size:12.5px;word-break:break-all;flex:1";
    var btn = document.createElement("button");
    btn.className = "zbtn sm ghost";
    btn.textContent = "📋";
    btn.addEventListener("click", function(){ Z.copy(out.textContent) });
    d.appendChild(label); d.appendChild(out); d.appendChild(btn);
    box.appendChild(d);
    m.push(out);
  });
  function atualizar(){
    var t = $id("entrada").value;
    MODOS.forEach(function(m){ m[2].textContent = m[1](t) });
  }
  $id("entrada").addEventListener("input", atualizar);
  atualizar();
})();
`;
  return { body, js };
}

/* ── URL ENCODE ─────────────────────────────────────────── */
export function urlEnc({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <span class="zlabel">Entrada</span>
  <textarea class="ztextarea mb" id="entrada" placeholder="Cole a URL ou texto..."></textarea>
  <div class="row mb" style="justify-content:center;gap:10px">
    <button class="zbtn" id="enc" type="button">⇡ Encode</button>
    <button class="zbtn" id="dec" type="button">⇩ Decode</button>
    <button class="zbtn ghost" id="copiar" type="button">📋</button>
  </div>
  <span class="zlabel">Saída</span>
  <textarea class="ztextarea" id="saida" readonly></textarea>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  $id("enc").addEventListener("click", function(){
    $id("saida").value = encodeURIComponent($id("entrada").value);
  });
  $id("dec").addEventListener("click", function(){
    try { $id("saida").value = decodeURIComponent($id("entrada").value) }
    catch(e){ Z.toast("URL inválida") }
  });
  $id("copiar").addEventListener("click", function(){ Z.copy($id("saida").value) });
})();
`;
  return { body, js };
}

/* ── JSON ───────────────────────────────────────────────── */
export function jsonFmt({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:720px;margin:0 auto">
  <span class="zlabel">JSON de entrada</span>
  <textarea class="ztextarea mb" id="entrada" placeholder='{"ola":"mundo"}'></textarea>
  <div class="row mb wrap" style="justify-content:center;gap:10px">
    <button class="zbtn" id="bonito" type="button">✨ Formatar</button>
    <button class="zbtn" id="minimo" type="button">Comprimir</button>
    <button class="zbtn ghost" id="copiar" type="button">📋 Copiar</button>
  </div>
  <p class="center mb" id="status" style="min-height:20px"></p>
  <span class="zlabel">Saída</span>
  <textarea class="ztextarea" id="saida" readonly style="min-height:180px"></textarea>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function processar(indent){
    try {
      var obj = JSON.parse($id("entrada").value);
      $id("saida").value = JSON.stringify(obj, null, indent);
      $id("status").innerHTML = "<span class='acc' style='font-family:var(--z-fm)'>✓ JSON válido</span>";
    } catch(e){
      $id("saida").value = "";
      $id("status").innerHTML = "<span style='color:var(--z-red);font-family:var(--z-fm)'>✗ " + e.message + "</span>";
    }
  }
  $id("bonito").addEventListener("click", function(){ processar(2) });
  $id("minimo").addEventListener("click", function(){ processar(0) });
  $id("copiar").addEventListener("click", function(){ Z.copy($id("saida").value) });
})();
`;
  return { body, js };
}

/* ── REGEX ──────────────────────────────────────────────── */
export function regex({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:720px;margin:0 auto">
  <div class="zgrid zg3 mb" style="grid-template-columns:2fr 1fr 1fr">
    <div><span class="zlabel">Expressão</span><input class="zinput mono" id="padrao" value="\\b\\w+@\\w+\\.\\w+\\b"></div>
    <div><span class="zlabel">Flags</span><input class="zinput mono" id="flags" value="g"></div>
    <div class="row" style="align-items:flex-end"><button class="zbtn w" id="rodar" type="button">Testar</button></div>
  </div>
  <span class="zlabel">Texto</span>
  <textarea class="ztextarea mb" id="texto">Meu email é zcode@exemplo.com e o de você?</textarea>
  <div class="row between mb wrap"><span class="zchip" id="qtd">0 matches</span><span class="dim mono" id="erros" style="font-size:12px"></span></div>
  <div class="zcard" style="background:var(--z-bg2);font-family:var(--z-fm);font-size:13px;line-height:1.6;padding:14px;word-break:break-word" id="visual"></div>
  <div class="row wrap mt" style="gap:6px" id="atalhos"></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var ATALHOS = [
    ["email", "\\b\\\\w+@\\\\w+\\\\.\\\\w+\\\\b"],
    ["número", "\\b\\d+\\b"],
    ["palavra longa", "\\b\\w{6,}\\b"],
    ["data DD/MM/AAAA", "\\d{2}/\\d{2}/\\d{4}"],
    ["hex #rrggbb", "#[0-9a-fA-F]{6}"],
    ["IP", "\\b\\d{1,3}(\\.\\d{1,3}){3}\\b"],
  ];
  var box = $id("atalhos");
  ATALHOS.forEach(function(a){
    var b = document.createElement("button");
    b.className = "zbtn sm ghost";
    b.textContent = a[0];
    b.addEventListener("click", function(){
      $id("padrao").value = a[1];
      rodar();
    });
    box.appendChild(b);
  });
  function rodar(){
    var p = $id("padrao").value, f = $id("flags").value, t = $id("texto").value;
    $id("erros").textContent = "";
    try {
      var re = new RegExp(p, f);
      var html = "";
      var n = 0;
      var esc = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      if(f.indexOf("g") >= 0){
        var m, pos = 0;
        while((m = re.exec(t)) !== null){
          html += esc.slice(pos, m.index) + "<mark style='background:var(--z-acc);color:#04060d;border-radius:4px;padding:0 2px'>" + esc.slice(m.index, m.index + m[0].length) + "</mark>";
          pos = m.index + m[0].length;
          n++;
          if(m[0] === "" && n > 50) break;
        }
        html += esc.slice(pos);
      } else {
        var m2 = t.match(re);
        if(m2){
          var idx2 = t.indexOf(m2[0]);
          html = esc.slice(0, idx2) + "<mark style='background:var(--z-acc);color:#04060d;border-radius:4px;padding:0 2px'>" + esc.slice(idx2, idx2 + m2[0].length) + "</mark>" + esc.slice(idx2 + m2[0].length);
          n = 1;
        } else html = esc;
      }
      $id("visual").innerHTML = html || "<span class='dim'>vazio</span>";
      $id("qtd").textContent = n + " match" + (n === 1 ? "" : "es");
    } catch(e){
      $id("erros").textContent = e.message;
      $id("qtd").textContent = "0 matches";
    }
  }
  $id("rodar").addEventListener("click", rodar);
  ["padrao", "flags", "texto"].forEach(function(i){ $id(i).addEventListener("input", rodar) });
  rodar();
})();
`;
  return { body, js };
}

/* ── DIFF ──────────────────────────────────────────────── */
export function diff({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} — compara linha por linha.</p></div>
<div class="zcard pad" style="max-width:760px;margin:0 auto">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Original</span><textarea class="ztextarea" id="a" style="min-height:160px" placeholder="Texto A..."></textarea></div>
    <div><span class="zlabel">Modificado</span><textarea class="ztextarea" id="b" style="min-height:160px" placeholder="Texto B..."></textarea></div>
  </div>
  <div class="row" style="justify-content:center"><button class="zbtn" id="rodar" type="button">Comparar</button></div>
  <div class="zcard mt" style="background:var(--z-bg2);font-family:var(--z-fm);font-size:12.5px;line-height:1.7;padding:14px;white-space:pre-wrap" id="saida"></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function lcs(a, b){
    var n = a.length, m = b.length;
    var dp = [];
    for(var i = 0; i <= n; i++){ dp.push([]); for(var j = 0; j <= m; j++) dp[i].push(0) }
    for(var i2 = n - 1; i2 >= 0; i2--) for(var j2 = m - 1; j2 >= 0; j2--){
      dp[i2][j2] = a[i2] === b[j2] ? dp[i2+1][j2+1] + 1 : Math.max(dp[i2+1][j2], dp[i2][j2+1]);
    }
    var out = [], i3 = 0, j3 = 0;
    while(i3 < n && j3 < m){
      if(a[i3] === b[j3]){ out.push(["=", a[i3]]); i3++; j3++ }
      else if(dp[i3+1][j3] >= dp[i3][j3+1]){ out.push(["-", a[i3]]); i3++ }
      else { out.push(["+", b[j3]]); j3++ }
    }
    while(i3 < n){ out.push(["-", a[i3]]); i3++ }
    while(j3 < m){ out.push(["+", b[j3]]); j3++ }
    return out;
  }
  function esc(s){ return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") }
  function rodar(){
    var a = $id("a").value.split("\\n");
    var b = $id("b").value.split("\\n");
    var linhas = lcs(a, b);
    var html = linhas.map(function(l){
      var cor = l[0] === "=" ? "var(--z-muted)" : l[0] === "+" ? "var(--z-lime)" : "var(--z-red)";
      var fundo = l[0] === "+" ? "rgba(125,255,106,0.08)" : l[0] === "-" ? "rgba(255,92,92,0.08)" : "transparent";
      return "<div style='color:" + cor + ";background:" + fundo + ";padding:1px 6px'>" + l[0] + " " + (esc(l[1]) || " ") + "</div>";
    }).join("");
    $id("saida").innerHTML = html;
  }
  $id("rodar").addEventListener("click", rodar);
  rodar();
})();
`;
  return { body, js };
}

/* ── MARKDOWN ───────────────────────────────────────────── */
export function markdown({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:820px;margin:0 auto">
  <div class="zgrid zg2" style="grid-template-columns:1fr 1fr;gap:14px">
    <textarea class="ztextarea" id="md" style="min-height:320px"># Título

Escreva **Markdown** aqui:

- item 1
- item 2

## Seção

Um parágrafo com *itálico* e \`código\`.

> citação

[link](https://example.com)

### Lista numerada
1. primeiro
2. segundo</textarea>
    <div class="zcard" id="preview" style="background:var(--z-bg2);padding:18px;overflow:auto;min-height:320px"></div>
  </div>
</div>
<style>
#preview h1{font-size:26px;margin:10px 0}#preview h2{font-size:21px;margin:10px 0}#preview h3{font-size:17px;margin:8px 0}
#preview p{margin:8px 0;line-height:1.6}#preview ul,#preview ol{margin:8px 0 8px 22px}
#preview code{font-family:var(--z-fm);background:var(--z-surface2);padding:2px 6px;border-radius:6px;font-size:12.5px}
#preview blockquote{border-left:3px solid var(--z-acc);padding-left:12px;color:var(--z-muted);margin:8px 0}
#preview a{color:var(--z-acc)}#preview strong{color:#fff}
</style>`;
  const js = `
(function(){
  function esc(s){ return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") }
  function inline(s){
    return s
      .replace(/\\*\\*([^*]+)\\*\\*/g, "<strong>$1</strong>")
      .replace(/\\*([^*]+)\\*/g, "<em>$1</em>")
      .replace(/\`([^\`]+)\`/g, "<code>$1</code>")
      .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function render(){
    var linhas = document.getElementById("md").value.split("\\n");
    var html = "", lista = "", ordenada = false;
    function fechaLista(){
      if(lista){ html += (ordenada ? "<ol>" : "<ul>") + lista + (ordenada ? "</ol>" : "</ul>"); lista = "" }
    }
    linhas.forEach(function(l){
      var h1 = l.match(/^#\\s+(.*)/), h2 = l.match(/^##\\s+(.*)/), h3 = l.match(/^###\\s+(.*)/);
      var ul = l.match(/^[-*]\\s+(.*)/), ol = l.match(/^\\d+\\.\\s+(.*)/);
      var bq = l.match(/^>\\s?(.*)/);
      if(h1){ fechaLista(); html += "<h1>" + inline(esc(h1[1])) + "</h1>" }
      else if(h2){ fechaLista(); html += "<h2>" + inline(esc(h2[1])) + "</h2>" }
      else if(h3){ fechaLista(); html += "<h3>" + inline(esc(h3[1])) + "</h3>" }
      else if(ul){ if(ordenada) fechaLista(); ordenada = false; lista += "<li>" + inline(esc(ul[1])) + "</li>" }
      else if(ol){ if(!ordenada) fechaLista(); ordenada = true; lista += "<li>" + inline(esc(ol[1])) + "</li>" }
      else if(bq){ fechaLista(); html += "<blockquote>" + inline(esc(bq[1])) + "</blockquote>" }
      else if(!l.trim()){ fechaLista() }
      else { fechaLista(); html += "<p>" + inline(esc(l)) + "</p>" }
    });
    fechaLista();
    document.getElementById("preview").innerHTML = html;
  }
  document.getElementById("md").addEventListener("input", render);
  render();
})();
`;
  return { body, js };
}

/* ── HTML ENTIDADES ─────────────────────────────────────── */
export function htmlEnt({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <span class="zlabel">Entrada</span>
  <textarea class="ztextarea mb" id="entrada" placeholder="<b>texto</b> & mais"></textarea>
  <div class="row mb" style="justify-content:center;gap:10px">
    <button class="zbtn" id="enc" type="button">⇡ Escapar</button>
    <button class="zbtn" id="dec" type="button">⇩ Desescapar</button>
    <button class="zbtn ghost" id="copiar" type="button">📋</button>
  </div>
  <span class="zlabel">Saída</span>
  <textarea class="ztextarea" id="saida" readonly></textarea>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  $id("enc").addEventListener("click", function(){
    var s = $id("entrada").value
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    $id("saida").value = s;
  });
  $id("dec").addEventListener("click", function(){
    var t = document.createElement("textarea");
    t.innerHTML = $id("entrada").value;
    $id("saida").value = t.value;
  });
  $id("copiar").addEventListener("click", function(){ Z.copy($id("saida").value) });
})();
`;
  return { body, js };
}

/* ── IMAGEM → BASE64 ────────────────────────────────────── */
export function imgB64({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <input type="file" id="arquivo" accept="image/*" style="display:none">
  <button class="zbtn w mb" id="escolher" type="button">📁 Escolher imagem</button>
  <div class="row mb wrap" style="gap:10px">
    <div style="flex:1;min-width:120px"><span class="zlabel">Largura máx. (px)</span><input class="zinput" id="largura" type="number" value="0" min="0" placeholder="0 = original"></div>
    <div style="flex:1;min-width:120px"><span class="zlabel">Formato</span><select class="zselect" id="formato"><option>image/png</option><option>image/jpeg</option><option>image/webp</option></select></div>
    <div class="row" style="align-items:flex-end;gap:8px"><button class="zbtn" id="convert" type="button">Convert</button><button class="zbtn ghost" id="copiar" type="button">📋</button></div>
  </div>
  <div class="zcard mb" style="background:var(--z-bg2);text-align:center;padding:12px"><img id="preview" alt="" style="max-width:100%;max-height:220px;border-radius:10px;display:none"><p class="dim" id="info" style="font-size:12px;margin-top:8px"></p></div>
  <span class="zlabel">Base64</span>
  <textarea class="ztextarea" id="saida" readonly placeholder="A data URL aparece aqui..."></textarea>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var dataUrl = "";
  $id("escolher").addEventListener("click", function(){ $id("arquivo").click() });
  $id("arquivo").addEventListener("change", function(){
    var f = this.files[0];
    if(!f) return;
    var reader = new FileReader();
    reader.onload = function(){
      $id("preview").src = reader.result;
      $id("preview").style.display = "block";
      $id("info").textContent = f.name + " · " + Math.round(f.size / 1024) + " KB";
      $id("convert").click();
    };
    reader.readAsDataURL(f);
  });
  $id("convert").addEventListener("click", function(){
    var img = $id("preview");
    if(!img.src) { Z.toast("Escolha uma imagem primeiro"); return }
    var alvoW = parseInt($id("largura").value || 0, 10) || img.naturalWidth;
    if(alvoW > img.naturalWidth) alvoW = img.naturalWidth;
    var cv = document.createElement("canvas");
    cv.width = alvoW;
    cv.height = Math.round(img.naturalHeight * (alvoW / img.naturalWidth));
    var ctx = cv.getContext ? cv.getContext("2d") : null;
    if(!ctx){ Z.toast("Canvas não suportado"); return }
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    dataUrl = cv.toDataURL($id("formato").value, 0.85);
    $id("saida").value = dataUrl;
    $id("info").textContent = Math.round(cv.width) + "×" + Math.round(cv.height) + " · " + Math.round(dataUrl.length / 1024) + " KB em base64";
  });
  $id("copiar").addEventListener("click", function(){ Z.copy($id("saida").value) });
})();
`;
  return { body, js };
}

/* ── QR CODE ────────────────────────────────────────────── */
export function qr({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Gerado via API pública (requer internet).</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto;text-align:center">
  <span class="zlabel">Conteúdo</span>
  <textarea class="ztextarea mb" id="conteudo" placeholder="https://zcode.dev ou qualquer texto"></textarea>
  <div class="row mb" style="justify-content:center;gap:14px">
    <div><span class="zlabel">Tamanho (px)</span><input class="zinput" id="tamanho" type="number" value="280" min="100" max="600" style="width:110px"></div>
    <div><span class="zlabel">Cor</span><input type="color" id="cor" value="#05070f" style="width:52px;height:44px;border:1px solid var(--z-line2);border-radius:10px;background:var(--z-surface2)"></div>
  </div>
  <img id="img" alt="QR Code" style="width:280px;height:280px;background:#fff;border-radius:14px;padding:8px;display:none;margin:0 auto">
  <p class="dim mb" id="aviso" style="font-size:12px">Digite o conteúdo e o QR aparece aqui.</p>
  <div class="row" style="justify-content:center;gap:10px">
    <a class="zbtn ghost" id="baixar" href="#" download="qr-zcode.png" style="display:none">⬇ Baixar PNG</a>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function gerar(){
    var t = $id("conteudo").value.trim();
    var img = $id("img");
    if(!t){ img.style.display = "none"; $id("aviso").textContent = "Digite o conteúdo e o QR aparece aqui."; return }
    var tam = Math.max(100, Math.min(600, parseInt($id("tamanho").value || 280, 10)));
    var cor = $id("cor").value;
    img.src = "https://api.qrserver.com/v1/create-qr-code/?size=" + tam + "x" + tam + "&data=" + encodeURIComponent(t) + "&color=" + cor.slice(1);
    img.style.width = tam + "px";
    img.style.height = tam + "px";
    img.style.display = "block";
    $id("aviso").textContent = "Toque no QR para abrir o link no celular.";
    $id("baixar").href = img.src;
    $id("baixar").style.display = "inline-flex";
  }
  ["conteudo", "tamanho", "cor"].forEach(function(i){ $id(i).addEventListener("input", gerar) });
  gerar();
})();
`;
  return { body, js };
}

/* ── IMPRESTACAO ────────────────────────────────────────── */
export function imc({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Estimativa — consulte um profissional de saúde.</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Altura (cm)</span><input class="zinput" id="altura" type="number" value="170"></div>
    <div><span class="zlabel">Peso (kg)</span><input class="zinput" id="peso" type="number" value="70"></div>
  </div>
  <div class="zcard center" style="background:var(--z-bg2)">
    <div class="zbig acc" id="imc">—</div>
    <p class="fd" id="class" style="font-size:19px">—</p>
  </div>
  <div class="zprog mt mb"><i id="barra" style="width:0%"></i></div>
  <p class="dim" style="font-size:13px" id="faixa"></p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var a = parseFloat($id("altura").value), p = parseFloat($id("peso").value);
    if(!a || !p || a < 80 || a > 250 || p < 20 || p > 400){ $id("imc").textContent = "—"; return }
    var m = p / Math.pow(a / 100, 2);
    var c, cor;
    if(m < 18.5){ c = "Baixo peso"; cor = "var(--z-amber)" }
    else if(m < 25){ c = "Peso normal ✓"; cor = "var(--z-lime)" }
    else if(m < 30){ c = "Sobrepeso"; cor = "var(--z-amber)" }
    else if(m < 35){ c = "Obesidade grau 1"; cor = "var(--z-red)" }
    else { c = "Obesidade grau 2+"; cor = "var(--z-red)" }
    $id("imc").textContent = Z.fmt(m, 1);
    $id("class").textContent = c;
    $id("class").style.color = cor;
    var pct = Math.min(100, Math.max(0, (m - 12) / (40 - 12) * 100));
    $id("barra").style.width = pct + "%";
    var baixo = Math.max(18.5 * Math.pow(a / 100, 2), 30);
    var alto = Math.min(24.9 * Math.pow(a / 100, 2), 150);
    $id("faixa").textContent = "Faixa de peso normal para sua altura: " + Z.fmt(baixo, 1) + " – " + Z.fmt(alto, 1) + " kg";
  }
  ["altura", "peso"].forEach(function(i){ $id(i).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

/* ── GORJETA / DIVIDIR CONTA / JUROS / PRESTAÇÃO ────────── */
export function gorjeta({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Valor da conta (R$)</span><input class="zinput" id="conta" type="number" value="85"></div>
    <div><span class="zlabel">Pessoas</span><input class="zinput" id="pessoas" type="number" value="2" min="1"></div>
  </div>
  <div class="col mb">
    <div class="row between"><span class="zlabel" style="margin:0">Gorjeta</span><b class="acc mono" id="gV">10%</b></div>
    <input type="range" id="g" min="0" max="30" value="10" style="width:100%">
  </div>
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">Gorjeta</span><b class="fd acc" id="rG">—</b></div>
    <div class="zcard center"><span class="zlabel">Total</span><b class="fd acc" id="rT">—</b></div>
    <div class="zcard center"><span class="zlabel">Por pessoa</span><b class="fd acc" id="rP">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var c = parseFloat($id("conta").value) || 0;
    var n = Math.max(1, parseInt($id("pessoas").value || 1, 10));
    var g = parseInt($id("g").value, 10);
    $id("gV").textContent = g + "%";
    var gor = c * g / 100, tot = c + gor;
    $id("rG").textContent = "R$ " + Z.fmt(gor, 2);
    $id("rT").textContent = "R$ " + Z.fmt(tot, 2);
    $id("rP").textContent = "R$ " + Z.fmt(tot / n, 2);
  }
  ["conta", "pessoas"].forEach(function(i){ $id(i).addEventListener("input", calc) });
  $id("g").addEventListener("input", calc);
  calc();
})();
`;
  return { body, js };
}

export function juros({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Juros compostos: o tempo é seu maior aliado.</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="zgrid zg3 mb">
    <div><span class="zlabel">Valor inicial (R$)</span><input class="zinput" id="p" type="number" value="1000"></div>
    <div><span class="zlabel">Taxa mensal (%)</span><input class="zinput" id="i" type="number" value="1" step="0.1"></div>
    <div><span class="zlabel">Meses</span><input class="zinput" id="n" type="number" value="12"></div>
  </div>
  <div class="zcard mb" style="background:var(--z-bg2);text-align:center">
    <div class="zbig acc" id="fv">—</div>
    <p class="dim">valor futuro (juros compostos)</p>
  </div>
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">Juros ganhos</span><b class="fd acc" id="j">—</b></div>
    <div class="zcard center"><span class="zlabel">Juros simples</span><b class="fd" id="js" style="font-size:18px">—</b></div>
    <div class="zcard center"><span class="zlabel">Diferença</span><b class="fd acc" id="dif" style="font-size:18px">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var p = parseFloat($id("p").value) || 0;
    var i = (parseFloat($id("i").value) || 0) / 100;
    var n = Math.max(0, parseInt($id("n").value || 0, 10));
    var fv = p * Math.pow(1 + i, n);
    var js = p * (1 + i * n);
    $id("fv").textContent = "R$ " + Z.fmt(fv, 2);
    $id("j").textContent = "R$ " + Z.fmt(fv - p, 2);
    $id("js").textContent = "R$ " + Z.fmt(js, 2);
    $id("dif").textContent = "R$ " + Z.fmt(fv - js, 2);
  }
  ["p", "i", "n"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

export function prestacao({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Sistema PRICE (parcelas fixas).</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="zgrid zg3 mb">
    <div><span class="zlabel">Valor (R$)</span><input class="zinput" id="v" type="number" value="50000"></div>
    <div><span class="zlabel">Juros a.m. (%)</span><input class="zinput" id="i" type="number" value="1.2" step="0.1"></div>
    <div><span class="zlabel">Parcelas</span><input class="zinput" id="n" type="number" value="48"></div>
  </div>
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">Parcela</span><b class="fd acc" id="pm">—</b></div>
    <div class="zcard center"><span class="zlabel">Total pago</span><b class="fd" id="tot" style="font-size:18px">—</b></div>
    <div class="zcard center"><span class="zlabel">Juros totais</span><b class="fd" id="j" style="font-size:18px;color:var(--z-red)">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var v = parseFloat($id("v").value) || 0;
    var i = (parseFloat($id("i").value) || 0) / 100;
    var n = Math.max(1, parseInt($id("n").value || 1, 10));
    var pm;
    if(i === 0) pm = v / n;
    else pm = v * (Math.pow(1 + i, n) * i) / (Math.pow(1 + i, n) - 1);
    $id("pm").textContent = "R$ " + Z.fmt(pm, 2);
    $id("tot").textContent = "R$ " + Z.fmt(pm * n, 2);
    $id("j").textContent = "R$ " + Z.fmt(pm * n - v, 2);
  }
  ["v", "i", "n"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

export function salario({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Tabela 2025 aproximada — apenas estimativa.</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Salário bruto (R$)</span><input class="zinput" id="bruto" type="number" value="5000"></div>
    <div><span class="zlabel">13º salário?</span><select class="zselect" id="decimo"><option value="0">Não incluir</option><option value="1">Incluir (média mensal)</option></select></div>
  </div>
  <div class="zcard" style="background:var(--z-bg2);padding:14px">
    <div class="row between" style="padding:5px 0"><span>Bruto mensal</span><b class="mono" id="r1">—</b></div>
    <div class="row between" style="padding:5px 0"><span>INSS (aprox.)</span><b class="mono" style="color:var(--z-red)" id="r2">—</b></div>
    <div class="row between" style="padding:5px 0"><span>IRRF (aprox.)</span><b class="mono" style="color:var(--z-red)" id="r3">—</b></div>
    <div class="row between" style="padding:5px 0;border-top:1px solid var(--z-line);margin-top:8px;padding-top:12px"><span class="fd">Líquido estimado</span><b class="fd acc" id="r4" style="font-size:20px">—</b></div>
  </div>
  <p class="dim mt" style="font-size:12px">Valores aproximados (faixas 2025). Use como referência, não como guia fiscal.</p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function inss(s){
    // tabela 2025 progressiva (aprox.)
    var faixas = [[1518, 0.075], [2793.88, 0.09], [4190.83, 0.09], [7786, 0.06]];
    var total = 0, resto = s;
    var anterior = 0;
    for(var i = 0; i < faixas.length; i++){
      var limite = faixas[i][0], al = faixas[i][1];
      var base = Math.min(resto, limite - anterior);
      if(base > 0) total += base * al;
      resto -= base;
      anterior = limite;
      if(resto <= 0) break;
    }
    return total;
  }
  function irrf(base){
    var faixas = [[2259.2, 0, 0], [2826.65, 0.075, 169.44], [3751.05, 0.15, 381.44], [4664.68, 0.225, 662.77], [Infinity, 0.275, 896]];
    for(var i = 0; i < faixas.length; i++){
      if(base <= faixas[i][0]) return base * faixas[i][1] - faixas[i][2];
    }
    return 0;
  }
  function calc(){
    var s = parseFloat($id("bruto").value) || 0;
    var com13 = $id("decimo").value === "1";
    var brutoMensal = com13 ? s * 13 / 12 : s;
    var i = inss(brutoMensal);
    var ded = i * 0.75;
    var ir = Math.max(0, irrf(brutoMensal - ded));
    $id("r1").textContent = "R$ " + Z.fmt(brutoMensal, 2);
    $id("r2").textContent = "- R$ " + Z.fmt(i, 2);
    $id("r3").textContent = "- R$ " + Z.fmt(ir, 2);
    $id("r4").textContent = "R$ " + Z.fmt(brutoMensal - i - ir, 2);
  }
  ["bruto", "decimo"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

/* ── IDADE / DIFERENÇA DE DATAS / DIA DO ANO ────────────── */
export function idade({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Data de nascimento</span><input class="zinput" id="nasc" type="date" value="1995-06-15"></div>
    <div><span class="zlabel">Até a data</span><input class="zinput" id="ate" type="date"></div>
  </div>
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">Anos</span><b class="fd acc" id="a">—</b></div>
    <div class="zcard center"><span class="zlabel">Meses</span><b class="fd acc" id="m">—</b></div>
    <div class="zcard center"><span class="zlabel">Dias</span><b class="fd acc" id="d">—</b></div>
  </div>
  <p class="dim center mt" id="extra" style="font-size:13.5px"></p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  $id("ate").valueAsDate = new Date();
  function calc(){
    var a = new Date($id("nasc").value + "T00:00:00");
    var b = new Date($id("ate").value + "T00:00:00");
    if(isNaN(a) || isNaN(b) || b < a){ $id("a").textContent = $id("m").textContent = $id("d").textContent = "—"; return }
    var anos = b.getFullYear() - a.getFullYear();
    var meses = b.getMonth() - a.getMonth();
    var dias = b.getDate() - a.getDate();
    if(dias < 0){
      meses--;
      dias += new Date(b.getFullYear(), b.getMonth(), 0).getDate();
    }
    if(meses < 0){ anos--; meses += 12 }
    $id("a").textContent = anos;
    $id("m").textContent = meses;
    $id("d").textContent = dias;
    var total = Math.floor((b - a) / 86400000);
    $id("extra").textContent = "Você viveu " + Z.fmt(total) + " dias (≈ " + Z.fmt(total / 30.44) + " meses ou " + Z.fmt(total / 365.25) + " anos) e terá " + Z.fmt(Math.round((36500 - total) / 365.25)) + " anos faltando para os 100!";
  }
  ["nasc", "ate"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

export function dataDiff({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Data 1</span><input class="zinput" id="d1" type="date" value="2024-01-01"></div>
    <div><span class="zlabel">Data 2</span><input class="zinput" id="d2" type="date" value="2026-09-08"></div>
  </div>
  <div class="zbig acc center mb" id="dias">—</div>
  <div class="zgrid" style="grid-template-columns:repeat(4,1fr)">
    <div class="zcard center"><span class="zlabel">Meses (aprox.)</span><b class="fd" id="m">—</b></div>
    <div class="zcard center"><span class="zlabel">Semanas</span><b class="fd" id="s">—</b></div>
    <div class="zcard center"><span class="zlabel">Horas</span><b class="fd" id="h">—</b></div>
    <div class="zcard center"><span class="zlabel">Minutos</span><b class="fd" id="mi">—</b></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var a = new Date($id("d1").value + "T00:00:00");
    var b = new Date($id("d2").value + "T00:00:00");
    if(isNaN(a) || isNaN(b)){ $id("dias").textContent = "—"; return }
    var ms = Math.abs(b - a);
    var dias = Math.round(ms / 86400000);
    $id("dias").textContent = Z.fmt(dias) + " dias";
    $id("m").textContent = Z.fmt(dias / 30.44, 1);
    $id("s").textContent = Z.fmt(dias / 7, 1);
    $id("h").textContent = Z.fmt(dias * 24);
    $id("mi").textContent = Z.fmt(dias * 24 * 60);
  }
  ["d1", "d2"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

/* ── GESTAÇÃO ───────────────────────────────────────────── */
export function gestacao({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Baseado em 40 semanas (280 dias).</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <span class="zlabel">Última menstruação (ou dia do teste positivo − 2 semanas)</span>
  <input class="zinput mb" id="um" type="date" value="2026-03-01">
  <div class="zgrid" style="grid-template-columns:repeat(3,1fr)">
    <div class="zcard center"><span class="zlabel">Semana atual</span><b class="fd acc" id="sem">—</b></div>
    <div class="zcard center"><span class="zlabel">Trimestre</span><b class="fd acc" id="tri">—</b></div>
    <div class="zcard center"><span class="zlabel">Previsão</span><b class="fd acc" id="prev" style="font-size:16px">—</b></div>
  </div>
  <div class="zprog mt"><i id="barra" style="width:0%"></i></div>
  <p class="dim mt" id="info" style="font-size:13px"></p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var u = new Date($id("um").value + "T00:00:00");
    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if(isNaN(u)){ $id("sem").textContent = "—"; return }
    var dias = Math.floor((hoje - u) / 86400000);
    var sem = Math.floor(dias / 7) + 1;
    if(sem < 1 || sem > 42){
      $id("sem").textContent = dias < 0 ? "não começou" : "acabou?";
      $id("tri").textContent = "—";
      $id("prev").textContent = u.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
      return;
    }
    var tri = sem < 14 ? "1º" : sem < 28 ? "2º" : "3º";
    var pp = new Date(u.getTime() + 280 * 86400000);
    $id("sem").textContent = sem + "s";
    $id("tri").textContent = tri;
    $id("prev").textContent = pp.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    $id("barra").style.width = Math.min(100, dias / 280 * 100) + "%";
    $id("info").textContent = dias < 0 ? "Faltam " + (-dias) + " dias para o início estimado." : "Faltam " + (280 - dias) + " dias (≈ " + Math.floor((280 - dias) / 7) + " semanas) para a data prevista.";
  }
  $id("um").addEventListener("input", calc);
  calc();
})();
`;
  return { body, js };
}

/* ── SANO ───────────────────────────────────────────────── */
export function sono({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Ciclos de sono duram ~90 minutos. Durma em ciclos completos para acordar menos 'pesado'.</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Eu preciso acordar às</span><input class="zinput" id="acordar" type="time" value="06:30"></div>
    <div><span class="zlabel">Ou: vou dormir agora, às</span><input class="zinput" id="dormir" type="time" value="23:00"></div>
  </div>
  <h3 class="fd mb" style="font-size:17px">Melhores horários para DORMIR (acordar no horário acima)</h3>
  <div class="zgrid" id="lista1" style="grid-template-columns:repeat(3,1fr)"></div>
  <h3 class="fd mb mt" style="font-size:17px">Você acordaria às (se dormir no horário acima)</h3>
  <div class="zgrid" id="lista2" style="grid-template-columns:repeat(3,1fr)"></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function fmt(t){
    var h = Math.floor(t / 60) % 24, m = t % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }
  function render(){
    var ac = ($id("acordar").value || "06:30").split(":");
    var dor = ($id("dormir").value || "23:00").split(":");
    var acMin = parseInt(ac[0], 10) * 60 + parseInt(ac[1], 10);
    var dorMin = parseInt(dor[0], 10) * 60 + parseInt(dor[1], 10);
    var l1 = $id("lista1"); l1.innerHTML = "";
    [6, 5, 4].forEach(function(ciclos){
      var alvo = acMin - ciclos * 90;
      while(alvo < 0) alvo += 1440;
      var d = document.createElement("div");
      d.className = "zcard center";
      d.innerHTML = "<b class='fd acc' style='font-size:20px'>" + fmt(alvo) + "</b><span class='dim mono' style='font-size:11px'>" + (ciclos * 1.5).toFixed(1) + " h de sono</span>";
      l1.appendChild(d);
    });
    var l2 = $id("lista2"); l2.innerHTML = "";
    [4, 5, 6].forEach(function(ciclos){
      var alvo = dorMin + ciclos * 90;
      while(alvo >= 1440) alvo -= 1440;
      var d2 = document.createElement("div");
      d2.className = "zcard center";
      d2.innerHTML = "<b class='fd acc' style='font-size:20px'>" + fmt(alvo) + "</b><span class='dim mono' style='font-size:11px'>" + (ciclos * 1.5).toFixed(1) + " h de sono</span>";
      l2.appendChild(d2);
    });
  }
  ["acordar", "dormir"].forEach(function(x){ $id(x).addEventListener("input", render) });
  render();
})();
`;
  return { body, js };
}

/* ── TMB / METAS / ÁGUA / HUMOR ─────────────────────────── */
export function tmb({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Fórmula de Mifflin-St Jeor.</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Sexo</span><select class="zselect" id="sexo"><option value="m">Masculino</option><option value="f">Feminino</option></select></div>
    <div><span class="zlabel">Idade</span><input class="zinput" id="idade" type="number" value="30"></div>
    <div><span class="zlabel">Altura (cm)</span><input class="zinput" id="altura" type="number" value="170"></div>
    <div><span class="zlabel">Peso (kg)</span><input class="zinput" id="peso" type="number" value="70"></div>
  </div>
  <span class="zlabel">Nível de atividade</span>
  <select class="zselect mb" id="att">
    <option value="1.2">Sedentário (pouco ou nenhum exercício)</option>
    <option value="1.375" selected>Levemente ativo (1-3x por semana)</option>
    <option value="1.55">Moderadamente ativo (3-5x por semana)</option>
    <option value="1.725">Muito ativo (6-7x por semana)</option>
    <option value="1.9">Atleta (treino 2x ao dia)</option>
  </select>
  <div class="zgrid" style="grid-template-columns:repeat(2,1fr)">
    <div class="zcard center"><span class="zlabel">TMB (repouso)</span><b class="fd acc" id="tmb">—</b></div>
    <div class="zcard center"><span class="zlabel">Gasto diário (TDEE)</span><b class="fd acc" id="tdee">—</b></div>
  </div>
  <p class="dim mt" style="font-size:13px" id="meta"></p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var s = $id("sexo").value;
    var i = parseFloat($id("idade").value) || 0;
    var a = parseFloat($id("altura").value) || 0;
    var p = parseFloat($id("peso").value) || 0;
    if(!i || !a || !p){ $id("tmb").textContent = "—"; return }
    var tmb = 10 * p + 6.25 * a - 5 * i + (s === "m" ? 5 : -161);
    var att = parseFloat($id("att").value);
    var tdee = tmb * att;
    $id("tmb").textContent = Math.round(tmb) + " kcal";
    $id("tdee").textContent = Math.round(tdee) + " kcal";
    $id("meta").textContent = "Para manter o peso: ≈ " + Math.round(tdee) + " kcal/dia · Para emagrecer (~500 kcal): ≈ " + Math.round(tdee - 500) + " kcal/dia";
  }
  ["sexo", "idade", "altura", "peso", "att"].forEach(function(x){ $id(x).addEventListener("input", calc) });
  calc();
})();
`;
  return { body, js };
}

export function agua({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad center" style="max-width:420px;margin:0 auto">
  <div class="row between mb" style="justify-content:space-between">
    <span class="zchip" id="atual">0 / 8 copos</span>
    <span class="zchip">Meta: <b class="acc" id="meta">2000</b> mL</span>
  </div>
  <div class="zbig acc mb" id="pct">0%</div>
  <div class="zprog mb"><i id="barra" style="width:0%"></i></div>
  <div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap">
    <button class="zbtn" id="copo" type="button">🥛 +1 copo (250 mL)</button>
    <button class="zbtn ghost" id="voltar" type="button">−1</button>
  </div>
  <div class="row mt" style="justify-content:center;gap:8px">
    <span class="zlabel" style="margin:0">Meta diária:</span>
    <button class="zbtn sm ghost" data-l="1500" type="button">1,5 L</button>
    <button class="zbtn sm ghost" data-l="2000" type="button">2 L</button>
    <button class="zbtn sm ghost" data-l="2500" type="button">2,5 L</button>
    <button class="zbtn sm ghost" id="zerar" type="button">Zerar hoje</button>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var CHAVE = "agua";
  function hojeKey(){ return new Date().toISOString().slice(0, 10) }
  var st = Z.store.get(CHAVE, {});
  if(st.dia !== hojeKey()) st = {dia: hojeKey(), ml: 0, meta: 2000};
  function salvar(){ Z.store.set(CHAVE, st) }
  function render(){
    var copos = Math.round(st.ml / 250);
    var pct = Math.min(100, Math.round(st.ml / st.meta * 100));
    $id("atual").textContent = copos + " / " + Math.ceil(st.meta / 250) + " copos";
    $id("meta").textContent = Z.fmt(st.meta);
    $id("pct").textContent = pct + "%";
    $id("barra").style.width = pct + "%";
    if(pct >= 100){ Z.toast("Meta batida! 💧", 2000) }
  }
  $id("copo").addEventListener("click", function(){ st.ml += 250; salvar(); render(); Z.snd(700, 0.05, "sine") });
  $id("voltar").addEventListener("click", function(){ st.ml = Math.max(0, st.ml - 250); salvar(); render() });
  $id("zerar").addEventListener("click", function(){ st.ml = 0; salvar(); render() });
  document.querySelectorAll("[data-l]").forEach(function(b){
    b.addEventListener("click", function(){ st.meta = parseInt(this.dataset.l, 10); salvar(); render() });
  });
  render();
})();
`;
  return { body, js };
}

export function humor({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Anote como você está e veja o padrão da semana.</p></div>
<div class="zcard pad center mb" style="max-width:520px;margin:0 auto">
  <div class="row" style="justify-content:center;gap:14px;font-size:40px">
    ${["😄", "🙂", "😐", "🙁", "😫"].map((e, i) => `<button class="zbtn sm" data-h="${i}" type="button" style="font-size:34px;width:56px;height:56px;padding:0;border-radius:50%;background:var(--z-surface2)" title="${["ótimo","bom","neutro","ruim","péssimo"][i]}">${e}</button>`).join("")}
  </div>
  <textarea class="ztextarea mt" id="nota" placeholder="Quer anotar o motivo? (opcional)"></textarea>
  <div class="row mt" style="justify-content:center"><button class="zbtn" id="salvar" type="button">Salvar hoje</button></div>
</div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <h3 class="fd mb">Últimos 7 dias</h3>
  <div class="col" id="hist"></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var CHAVE = "humor";
  var st = Z.store.get(CHAVE, {});
  var EMO = ["😄", "🙂", "😐", "🙁", "😫"];
  var ROT = ["ótimo", "bom", "neutro", "ruim", "péssimo"];
  function key(d){ return d.toISOString().slice(0, 10) }
  function render(){
    var box = $id("hist"); box.innerHTML = "";
    var hoje = new Date();
    for(var i = 0; i < 7; i++){
      var d = new Date();
      d.setDate(hoje.getDate() - i);
      var k = key(d);
      var entry = st[k];
      var row = document.createElement("div");
      row.className = "row between";
      row.style.cssText = "padding:6px 0;border-bottom:1px solid var(--z-line)";
      var dia = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
      row.innerHTML = "<span class='mono dim' style='font-size:12px'>" + dia + "</span><b style='font-size:22px'>" + (entry ? EMO[entry.h] : "—") + (entry && entry.n ? " <span class='dim' style='font-size:12px'>" + entry.n.slice(0, 24) + (entry.n.length > 24 ? "…" : "") + "</span>" : "") + "</b>";
      box.appendChild(row);
    }
  }
  $id("salvar").addEventListener("click", function(){
    var h = document.querySelector("[data-h].sel");
    if(!h){ Z.toast("Escolha um humor primeiro"); return }
    var k = key(new Date());
    st[k] = {h: parseInt(h.dataset.h, 10), n: $id("nota").value.trim()};
    Z.store.set(CHAVE, st);
    render();
    Z.toast("Registrado: " + ROT[st[k].h]);
  });
  document.querySelectorAll("[data-h]").forEach(function(b){
    b.addEventListener("click", function(){
      document.querySelectorAll("[data-h]").forEach(function(x){ x.classList.remove("sel"); x.style.background = "var(--z-surface2)" });
      this.classList.add("sel");
      this.style.background = "var(--z-acc)";
    });
  });
  render();
})();
`;
  return { body, js };
}

/* ── ORÇAMENTO ──────────────────────────────────────────── */
export function orcamento({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Salvo no navegador.</p></div>
<div class="zcard pad mb" style="max-width:560px;margin:0 auto">
  <div class="row mb wrap">
    <input class="zinput grow" id="nome" placeholder="Gasto (ex.: mercado)">
    <input class="zinput" id="valor" type="number" placeholder="R$" style="width:110px">
    <button class="zbtn" id="add" type="button">+</button>
  </div>
  <div class="row between wrap"><span class="zlabel" style="margin:0">Meta mensal (R$)</span><input class="zinput" id="meta" type="number" value="2000" style="width:130px"></div>
</div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="row between mb"><b class="fd">Total do mês</b><b class="fd acc" id="total">R$ 0,00</b></div>
  <div class="zprog mb"><i id="barra" style="width:0%"></i></div>
  <div class="col" id="lista"></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var CHAVE = "orc";
  var st = Z.store.get(CHAVE, {meses: {}});
  var k = new Date().toISOString().slice(0, 7);
  st.meses[k] = st.meses[k] || {itens: [], meta: 2000};
  var mes = st.meses[k];
  $id("meta").value = mes.meta;
  function salvar(){ Z.store.set(CHAVE, st) }
  function render(){
    var lista = $id("lista"); lista.innerHTML = "";
    var tot = 0;
    mes.itens.forEach(function(t){
      tot += t.v;
      var d = document.createElement("div");
      d.className = "row between";
      d.style.cssText = "padding:7px 0;border-bottom:1px solid var(--z-line)";
      d.innerHTML = "<span>" + t.n + "</span><b class='mono'>R$ " + Z.fmt(t.v, 2) + "</b>";
      var del = document.createElement("button");
      del.className = "zbtn sm danger";
      del.textContent = "✕";
      del.addEventListener("click", function(){ mes.itens = mes.itens.filter(function(x){ return x !== t }); salvar(); render() });
      d.appendChild(del);
      lista.appendChild(d);
    });
    if(!mes.itens.length) lista.innerHTML = "<p class='dim center'>Nenhum gasto lançado.</p>";
    $id("total").textContent = "R$ " + Z.fmt(tot, 2);
    var pct = Math.min(100, tot / (mes.meta || 1) * 100);
    $id("barra").style.width = pct + "%";
    $id("barra").style.background = pct > 100 ? "var(--z-red)" : pct > 80 ? "var(--z-amber)" : "var(--z-acc)";
  }
  $id("add").addEventListener("click", function(){
    var n = $id("nome").value.trim(), v = parseFloat($id("valor").value);
    if(!n || isNaN(v) || v <= 0){ Z.toast("Nome e valor são necessários"); return }
    mes.itens.push({n: n, v: v});
    $id("nome").value = ""; $id("valor").value = "";
    salvar(); render();
  });
  $id("meta").addEventListener("input", function(){ mes.meta = parseFloat(this.value) || 0; salvar(); render() });
  render();
})();
`;
  return { body, js };
}

/* ── CSV  JSON ─────────────────────────────────────────── */
export function csvjson({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:720px;margin:0 auto">
  <span class="zlabel">CSV (a primeira linha são os cabeçalhos)</span>
  <textarea class="ztextarea mb" id="csv" placeholder="nome,idade,cidade&#10;Ana,30,São Paulo&#10;Bruno,25,Rio"></textarea>
  <div class="row mb" style="justify-content:center;gap:10px">
    <button class="zbtn" id="p1" type="button">CSV → JSON</button>
    <button class="zbtn" id="p2" type="button">JSON → CSV</button>
    <button class="zbtn ghost" id="copiar" type="button">📋</button>
  </div>
  <span class="zlabel">Saída</span>
  <textarea class="ztextarea" id="saida" readonly></textarea>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function csvParse(t){
    var linhas = t.split(/\\r?\\n/).filter(function(l){ return l.trim() });
    if(linhas.length < 2) throw new Error("Preencha cabeçalho + ao menos 1 linha");
    var sep = linhas[0].indexOf(";") >= 0 && linhas[0].indexOf(",") < 0 ? ";" : ",";
    function splitLinha(l){
      var out = [], cur = "", q = false;
      for(var i = 0; i < l.length; i++){
        var c = l[i];
        if(c === '"') q = !q;
        else if(c === sep && !q){ out.push(cur); cur = "" }
        else cur += c;
      }
      out.push(cur);
      return out.map(function(s){ return s.trim().replace(/^"|"$/g, "") });
    }
    var cab = splitLinha(linhas[0]);
    var dados = linhas.slice(1).map(function(l){
      var v = splitLinha(l.replace(/\\s*,/g, ","));
      var obj = {};
      cab.forEach(function(c, i){ obj[c] = (v[i] || "").trim() });
      return obj;
    });
    return dados;
  }
  $id("p1").addEventListener("click", function(){
    try {
      var dados = csvParse($id("csv").value);
      $id("saida").value = JSON.stringify(dados, null, 2);
    } catch(e){ Z.toast(e.message) }
  });
  $id("p2").addEventListener("click", function(){
    try {
      var arr = JSON.parse($id("csv").value);
      if(!Array.isArray(arr) || !arr.length) throw new Error("Cole um array de objetos");
      var chaves = Object.keys(arr[0]);
      var linhas = [chaves.join(",")].concat(arr.map(function(o){
        return chaves.map(function(c){
          var v = String(o[c] == null ? "" : o[c]);
          return /[",\\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
        }).join(",");
      }));
      $id("saida").value = linhas.join("\\n");
    } catch(e){ Z.toast(e.message) }
  });
  $id("copiar").addEventListener("click", function(){ Z.copy($id("saida").value) });
})();
`;
  return { body, js };
}
