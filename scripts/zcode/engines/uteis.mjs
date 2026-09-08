/* Zcode — engines de Úteis */
import { UNIDADES, CIDADES, FRASES, PALAVRAS_SENHA, NOMES_PERSONAGEM } from "../data/uteis.mjs";

/* ── CONVERSOR DE UNIDADES ──────────────────────────────── */
export function conversor({ nome, sub, cat }) {
  const d = UNIDADES[cat];
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <span class="zlabel">Valor</span>
  <input class="zinput mb" id="valor" type="number" step="any" value="1">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">De</span><select class="zselect" id="de"></select></div>
    <div><span class="zlabel">Para</span><select class="zselect" id="para"></select></div>
  </div>
  <div class="zcard center" style="background:var(--z-bg2);margin-bottom:14px">
    <p class="zchip" id="resultado">—</p>
    <p class="dim mono" id="resultado2" style="font-size:12px;margin-top:6px"></p>
  </div>
  <div class="row" style="justify-content:center"><button class="zbtn sm" id="trocar" type="button">⇄ Inverter</button></div>
</div>`;
  const js = `
(function(){
  var D = ${JSON.stringify(d)};
  function $id(x){return document.getElementById(x)}
  var de = $id("de"), para = $id("para");
  D.un.forEach(function(u, i){
    de.appendChild(new Option(u[0], i));
    para.appendChild(new Option(u[0], i));
  });
  para.selectedIndex = 1;
  function temp(t, deI){
    if(deI === 0) return t;
    if(deI === 1) return (t - 32) * 5 / 9;
    return t - 273.15;
  }
  function tempBack(c, paraI){
    if(paraI === 0) return c;
    if(paraI === 1) return c * 9 / 5 + 32;
    return c + 273.15;
  }
  function converter(){
    var v = parseFloat($id("valor").value);
    if(isNaN(v)){ $id("resultado").textContent = "Digite um número"; $id("resultado2").textContent = ""; return }
    var di = parseInt(de.value, 10), pi = parseInt(para.value, 10);
    var r;
    if(${JSON.stringify(cat)} === "temperatura"){
      r = tempBack(temp(v, di), pi);
    } else {
      r = (v * D.un[di][1]) / D.un[pi][1];
    }
    $id("resultado").textContent = v + " " + D.un[di][0] + " = " + Z.fmt(r, Math.abs(r) < 0.01 && r !== 0 ? 8 : 4) + " " + D.un[pi][0];
    $id("resultado2").textContent = "1 " + D.un[di][0] + " = " + Z.fmt((D.un[di][1] / D.un[pi][1]), 8) + " " + D.un[pi][0];
  }
  $id("trocar").addEventListener("click", function(){
    var a = de.value; de.value = para.value; para.value = a;
    converter();
  });
  ["valor", "de", "para"].forEach(function(idn){
    $id(idn).addEventListener("input", converter);
    $id(idn).addEventListener("change", converter);
  });
  converter();
})();
`;
  return { body, js };
}

/* ── CALCULADORA CIENTÍFICA ─────────────────────────────── */
export function calcCientifica({ nome, sub }) {
  const TECLAS = [
    ["sin(", "cos(", "tan(", "ln("],
    ["log(", "√(", "x²", "xʸ"],
    ["π", "e", "C", "←"],
    ["7", "8", "9", "÷"],
    ["4", "5", "6", "×"],
    ["1", "2", "3", "−"],
    ["(", "0", ")", "+"],
    ["%", ".", ",", "="],
  ];
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:400px;margin:0 auto">
  <div class="zcard" style="background:var(--z-bg2);text-align:right;padding:14px 16px;margin-bottom:12px;min-height:86px">
    <div class="dim mono" id="hist" style="font-size:12px;min-height:16px"></div>
    <div class="fd acc" id="tela" style="font-size:30px;word-break:break-all">0</div>
  </div>
  <div class="zgrid" id="teclas" style="grid-template-columns:repeat(4,1fr);gap:8px"></div>
</div>`;
  const js = `
(function(){
  var TECLAS = ${JSON.stringify(TECLAS)};
  var expr = "";
  var $id = function(x){return document.getElementById(x)};
  function atualizar(){
    $id("tela").textContent = expr || "0";
  }
  function valido(s){
    var tokens = s.replace(/Math\\.(sin|cos|tan|log|log10|sqrt|pow|PI|E|abs)/g, "");
    tokens = tokens.replace(/\\d+(?:\\.\\d+)?/g, "");
    return !/[^+\\-*/().,]/.test(tokens);
  }
  function calc(){
    if(!expr) return;
    var s = expr.replace(/÷/g, "/").replace(/×/g, "*").replace(/−/g, "-").replace(/,/g, "");
    var m = s.replace(/\\^/g, "**");
    if(!valido(m)) { Z.toast("Expressão inválida"); return }
    try {
      var v = new Function("return (" + m + ")")();
      if(!isFinite(v)) throw 0;
      $id("hist").textContent = expr + " =";
      expr = String(Math.round(v * 1e12) / 1e12);
      Z.snd(800, 0.06, "sine");
    } catch (e) { Z.toast("Erro na conta") }
    atualizar();
  }
  function tecla(t){
    if(t === "C"){ expr = ""; $id("hist").textContent = ""; atualizar(); return }
    if(t === "←"){ expr = expr.slice(0, -1); atualizar(); return }
    if(t === "="){ calc(); return }
    if(t === "x²"){ expr += "^2"; atualizar(); return }
    if(t === "xʸ"){ expr += "^"; atualizar(); return }
    if(t === "√("){ expr += "Math.sqrt("; atualizar(); return }
    if(t === "π"){ expr += "Math.PI"; atualizar(); return }
    if(t === "e"){ expr += "Math.E"; atualizar(); return }
    if(t === "%"){ expr = expr.slice(0, -1); atualizar(); return }
    expr += t;
    atualizar();
  }
  var box = $id("teclas");
  TECLAS.forEach(function(linha){
    linha.forEach(function(t){
      var b = document.createElement("button");
      b.className = t === "=" ? "zbtn" : "zbtn ghost";
      b.style.cssText = "padding:13px 6px;font-family:var(--z-fm);font-size:15px";
      b.textContent = t;
      b.addEventListener("click", function(){ tecla(t) });
      box.appendChild(b);
    });
  });
  document.addEventListener("keydown", function(e){
    if(e.key >= "0" && e.key <= "9") tecla(e.key);
    if("+\\-*/.()".indexOf(e.key) >= 0) tecla(e.key);
    if(e.key === "Enter"){ e.preventDefault(); tecla("=") }
    if(e.key === "Backspace") tecla("←");
    if(e.key === "Escape") tecla("C");
  });
  atualizar();
})();
`;
  return { body, js };
}

/* ── CALCULADORA DE PERCENTUAL ───────────────────────────── */
export function percentual({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zgrid" style="grid-template-columns:1fr;max-width:560px;margin:0 auto;gap:14px">
  <div class="zcard pad">
    <h3 class="fd mb">Quanto é <span class="acc">X%</span> de Y?</h3>
    <div class="zgrid zg3 mb"><input class="zinput" id="p1" type="number" placeholder="X (ex: 15)"><input class="zinput" id="p2" type="number" placeholder="Y (ex: 200)"><div class="zcard center" style="background:var(--z-bg2);display:grid;place-items:center"><b class="acc fd" id="r1">—</b></div></div>
  </div>
  <div class="zcard pad">
    <h3 class="fd mb">Y é <span class="acc">X%</span> de quanto?</h3>
    <div class="zgrid zg3 mb"><input class="zinput" id="p3" type="number" placeholder="Y (ex: 30)"><input class="zinput" id="p4" type="number" placeholder="X% (ex: 15)"><div class="zcard center" style="background:var(--z-bg2);display:grid;place-items:center"><b class="acc fd" id="r2">—</b></div></div>
  </div>
  <div class="zcard pad">
    <h3 class="fd mb">Variação percentual de X para Y</h3>
    <div class="zgrid zg3 mb"><input class="zinput" id="p5" type="number" placeholder="Valor inicial"><input class="zinput" id="p6" type="number" placeholder="Valor final"><div class="zcard center" style="background:var(--z-bg2);display:grid;place-items:center"><b class="acc fd" id="r3">—</b></div></div>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function a(){
    var x = parseFloat($id("p1").value), y = parseFloat($id("p2").value);
    $id("r1").textContent = !isNaN(x) && !isNaN(y) ? Z.fmt(x / 100 * y, 4) : "—";
  }
  function b(){
    var y = parseFloat($id("p3").value), x = parseFloat($id("p4").value);
    $id("r2").textContent = !isNaN(y) && !isNaN(x) && x !== 0 ? Z.fmt(y / (x / 100), 4) : "—";
  }
  function c(){
    var x = parseFloat($id("p5").value), y = parseFloat($id("p6").value);
    $id("r3").textContent = !isNaN(x) && !isNaN(y) && x !== 0 ? Z.fmt((y - x) / Math.abs(x) * 100, 2) + "%" : "—";
  }
  ["p1","p2"].forEach(function(i){ $id(i).addEventListener("input", a) });
  ["p3","p4"].forEach(function(i){ $id(i).addEventListener("input", b) });
  ["p5","p6"].forEach(function(i){ $id(i).addEventListener("input", c) });
})();
`;
  return { body, js };
}

/* ── CRONÔMETRO ─────────────────────────────────────────── */
export function cronometro({ nome, sub, voltas }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad center" style="max-width:480px;margin:0 auto">
  <div class="zbig mb" id="tempo">00:00.00</div>
  <div class="row" style="justify-content:center;gap:12px;margin-bottom:14px">
    <button class="zbtn big" id="inicio" type="button">▶ Iniciar</button>
    <button class="zbtn ghost big" id="zerar" type="button">Zerar</button>
    ${voltas ? '<button class="zbtn ghost big" id="volta" type="button">Fim Volta</button>' : ""}
  </div>
  <div class="col hidden" id="voltas" style="text-align:left"></div>
</div>`;
  const js = `
(function(){
  var rodando = false, t0 = 0, base = 0, tid = null;
  var $id = function(x){return document.getElementById(x)};
  function fmt(ms){
    var min = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60, d = Math.floor(ms / 10) % 100;
    return (min < 10 ? "0" : "") + min + ":" + (s < 10 ? "0" : "") + s + "." + (d < 10 ? "0" : "") + d;
  }
  function atualiza(){
    var agora = rodando ? Date.now() - t0 + base : base;
    $id("tempo").textContent = fmt(agora);
    document.title = fmt(agora) + " — ${nome}";
  }
  $id("inicio").addEventListener("click", function(){
    if(rodando){
      rodando = false;
      base = Date.now() - t0 + base;
      clearInterval(tid);
      this.textContent = "▶ Continuar";
    } else {
      rodando = true;
      t0 = Date.now();
      tid = setInterval(atualiza, 31);
      this.textContent = "⏸ Pausar";
      Z.snd(700, 0.05, "sine");
    }
  });
  $id("zerar").addEventListener("click", function(){
    rodando = false;
    clearInterval(tid);
    base = 0;
    $id("inicio").textContent = "▶ Iniciar";
    $id("voltas").innerHTML = "";
    $id("voltas").classList.add("hidden");
    atualiza();
    document.title = "${nome} — Zcode";
  });
  ${voltas ? `
  var v = 0;
  $id("volta").addEventListener("click", function(){
    if(!rodando){ Z.toast("Inicie o cronômetro primeiro"); return }
    v++;
    var baseAtual = Date.now() - t0 + base;
    var box = $id("voltas");
    box.classList.remove("hidden");
    var d = document.createElement("div");
    d.className = "zcard row between";
    d.style.cssText = "padding:10px 14px;font-family:var(--z-fm)";
    d.innerHTML = "<span>Volta " + v + "</span><b class='acc'>" + fmt(baseAtual) + "</b>";
    box.insertBefore(d, box.firstChild);
    Z.snd(900, 0.06, "sine");
  });
  ` : ""}
  atualiza();
})();
`;
  return { body, js };
}

/* ── TIMER ──────────────────────────────────────────────── */
export function timer({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad center" style="max-width:480px;margin:0 auto">
  <div class="zgrid zg3 mb" style="grid-template-columns:1fr 1fr 1fr">
    <div><span class="zlabel">Minutos</span><input class="zinput" id="min" type="number" min="0" max="599" value="5"></div>
    <div><span class="zlabel">Segundos</span><input class="zinput" id="seg" type="number" min="0" max="59" value="0"></div>
    <div class="row" style="align-items:flex-end"><button class="zbtn w" id="inicio" type="button">▶ Iniciar</button></div>
  </div>
  <div class="row wrap" style="justify-content:center;gap:8px;margin-bottom:16px">
    <button class="zbtn sm ghost" data-m="1" type="button">1 min</button>
    <button class="zbtn sm ghost" data-m="5" type="button">5 min</button>
    <button class="zbtn sm ghost" data-m="10" type="button">10 min</button>
    <button class="zbtn sm ghost" data-m="25" type="button">25 min (pomodoro)</button>
    <button class="zbtn sm ghost" data-m="50" type="button">50 min</button>
    <button class="zbtn sm ghost" data-m="60" type="button">1 h</button>
  </div>
  <div class="zbig acc mb" id="restante" style="opacity:.35">05:00</div>
  <div class="zprog mb"><i id="barra" style="width:100%"></i></div>
  <div class="row" style="justify-content:center">
    <button class="zbtn ghost" id="parar" type="button" disabled>Parar</button>
  </div>
</div>`;
  const js = `
(function(){
  var total = 0, restante = 0, tid = null, rodando = false;
  function $id(x){return document.getElementById(x)}
  function fmt(s){
    var m = Math.floor(s / 60), ss = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (ss < 10 ? "0" : "") + ss;
  }
  function setMin(m){
    $id("min").value = m;
    $id("seg").value = 0;
    pular();
  }
  function pular(){
    if(rodando) return;
    total = (parseInt($id("min").value || 0, 10) * 60) + (parseInt($id("seg").value || 0, 10));
    restante = total;
    $id("restante").textContent = total ? fmt(total) : "00:00";
    $id("restante").style.opacity = total ? 1 : 0.35;
    $id("barra").style.width = total ? 100 : 0 + "%";
    document.title = "${nome} — Zcode";
  }
  ["min", "seg"].forEach(function(i){ $id(i).addEventListener("input", pular) });
  Array.prototype.slice.call(document.querySelectorAll("[data-m]")).forEach(function(b){
    b.addEventListener("click", function(){ setMin(parseInt(this.dataset.m, 10)) });
  });
  $id("inicio").addEventListener("click", function(){
    if(!total){ Z.toast("Defina o tempo"); return }
    rodando = true;
    $id("inicio").disabled = true;
    $id("parar").disabled = false;
    $id("inicio").textContent = "⏳ Rodando...";
    var fim = Date.now() + restante * 1000;
    tid = setInterval(function(){
      restante = Math.max(0, Math.round((fim - Date.now()) / 1000));
      $id("restante").textContent = fmt(restante);
      $id("barra").style.width = (restante / total * 100) + "%";
      document.title = fmt(restante) + " Tempo ${nome}";
      if(restante <= 0){
        parar();
        Z.snd(880, 0.4, "sine", 0.07);
        setTimeout(function(){ Z.snd(880, 0.4, "sine", 0.07) }, 500);
        Z.toast("⏰ Tempo esgotado!", 4000);
      }
    }, 200);
  });
  function parar(){
    rodando = false;
    clearInterval(tid);
    $id("inicio").disabled = false;
    $id("inicio").textContent = "▶ Iniciar";
    $id("parar").disabled = true;
    document.title = "${nome} — Zcode";
  }
  $id("parar").addEventListener("click", function(){
    var agora = restante;
    parar();
    restante = agora;
    $id("restante").textContent = fmt(restante);
  });
  pular();
})();
`;
  return { body, js };
}

/* ── RELÓGIO MUNDIAL ────────────────────────────────────── */
export function relogioMundial({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zgrid zg2" id="lista" style="max-width:760px"></div>`;
  const js = `
(function(){
  var CID = ${JSON.stringify(CIDADES)};
  var box = document.getElementById("lista");
  CID.forEach(function(c){
    var d = document.createElement("div");
    d.className = "zcard";
    d.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:14px 16px";
    d.innerHTML = "<div><b class='fd'>" + c[0] + "</b><div class='dim mono' id='tz-" + c[1] + "' style='font-size:11px'></div></div><div class='fd acc' id='clk-" + c[1] + "' style='font-size:22px;font-variant-numeric:tabular-nums'></div>";
    box.appendChild(d);
  });
  function tick(){
    var agora = new Date();
    CID.forEach(function(c){
      try {
        document.getElementById("clk-" + c[1]).textContent = agora.toLocaleTimeString("pt-BR", { timeZone: c[1], hour: "2-digit", minute: "2-digit", second: "2-digit" });
        document.getElementById("tz-" + c[1]).textContent = agora.toLocaleDateString("pt-BR", { timeZone: c[1], weekday: "short", day: "2-digit", month: "short" });
      } catch (e) {}
    });
  }
  tick();
  setInterval(tick, 1000);
})();
`;
  return { body, js };
}

/* ── CALENDÁRIO ─────────────────────────────────────────── */
export function calendario({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <div class="row between mb">
    <button class="zbtn sm ghost" id="ant" type="button">← Mês</button>
    <b class="fd" id="mes" style="font-size:19px">—</b>
    <button class="zbtn sm ghost" id="pro" type="button">Mês →</button>
  </div>
  <div class="zgrid" id="grade" style="grid-template-columns:repeat(7,1fr);gap:5px"></div>
  <p class="dim center mt" id="info" style="font-size:13px"></p>
</div>`;
  const js = `
(function(){
  var hoje = new Date();
  var ano = hoje.getFullYear(), mes = hoje.getMonth();
  function $id(x){return document.getElementById(x)}
  function semanasDoAno(d){
    var data = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var dia = data.getUTCDay() || 7;
    data.setUTCDate(data.getUTCDate() + 4 - dia);
    var ano1 = new Date(Date.UTC(data.getUTCFullYear(), 0, 1));
    return Math.ceil(((data - ano1) / 86400000 + 1) / 7);
  }
  function pintar(){
    var nomes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    $id("mes").textContent = nomes[mes] + " " + ano;
    var g = $id("grade"); g.innerHTML = "";
    ["D","S","T","Q","Q","S","S"].forEach(function(d){
      var s = document.createElement("div");
      s.style.cssText = "text-align:center;font-family:var(--z-fm);font-size:11px;color:var(--z-muted);padding:4px";
      s.textContent = d;
      g.appendChild(s);
    });
    var primeiro = new Date(ano, mes, 1);
    var offset = (primeiro.getDay() + 6) % 7;
    var dias = new Date(ano, mes + 1, 0).getDate();
    for(var i = 0; i < offset; i++) g.appendChild(document.createElement("div"));
    for(var d = 1; d <= dias; d++){
      var c = new Date(ano, mes, d);
      var cell = document.createElement("div");
      var ehHoje = d === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
      cell.style.cssText = "aspect-ratio:1;display:grid;place-items:center;border-radius:10px;font-family:var(--z-fd);font-weight:600;background:" + (ehHoje ? "var(--z-acc)" : "var(--z-surface2)") + ";color:" + (ehHoje ? "#04060d" : "var(--z-text)") + ";cursor:pointer";
      cell.textContent = d;
      cell.title = "Semana " + semanasDoAno(c);
      (function(dia){
        cell.addEventListener("click", function(){
          var info = new Date(ano, mes, dia);
          $id("info").textContent = info.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " · Semana " + semanasDoAno(info) + " do ano · Dia " + diasDoAno(info) + " de " + (ano % 4 === 0 && ano % 100 !== 0 || ano % 400 === 0 ? 366 : 365);
          Z.snd(600, 0.03, "sine", 0.02);
        });
      })(d);
      g.appendChild(cell);
    }
    function diasDoAno(d2){
      var iano = new Date(d2.getFullYear(), 0, 1);
      return Math.ceil((d2 - iano) / 86400000);
    }
  }
  $id("ant").addEventListener("click", function(){ mes--; if(mes < 0){ mes = 11; ano-- } pintar() });
  $id("pro").addEventListener("click", function(){ mes++; if(mes > 11){ mes = 0; ano++ } pintar() });
  pintar();
})();
`;
  return { body, js };
}

/* ── BÚSSOLA ────────────────────────────────────────────── */
export function busola({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad center" style="max-width:440px;margin:0 auto">
  <div style="position:relative;width:240px;height:240px;margin:0 auto 18px">
    <div style="position:absolute;inset:0;border-radius:50%;border:2px solid var(--z-line2);background:radial-gradient(circle,var(--z-surface),var(--z-bg2))"></div>
    <div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);font-family:var(--z-fm);font-size:12px;color:var(--z-red)">N</div>
    <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);font-family:var(--z-fm);font-size:12px">S</div>
    <div style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-family:var(--z-fm);font-size:12px">O</div>
    <div style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-family:var(--z-fm);font-size:12px">L</div>
    <div id="aguilha" style="position:absolute;left:50%;top:50%;width:4px;height:90px;transform:translate(-50%,-50%);border-radius:4px;background:linear-gradient(180deg,var(--z-red) 50%,var(--z-text) 50%)"></div>
  </div>
  <div class="zbig acc" id="graus">—°</div>
  <p class="dim mt" id="dir">Gire o celular para orientar a bússola</p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var dirNomes = ["Norte", "Nordeste", "Leste", "Sudeste", "Sul", "Sudoeste", "Oeste", "Noroeste"];
  function atualizar(gamma, beta){
    var graus = Math.round(((360 - gamma) % 360 + 360) % 360);
    $id("aguilha").style.transform = "translate(-50%,-50%) rotate(" + (-graus) + "deg)";
    $id("graus").textContent = graus + "°";
    $id("dir").textContent = dirNomes[Math.round(graus / 45) % 8];
  }
  function handler(e){
    if(e.webkitCompassHeading != null){
      atualizar(-e.webkitCompassHeading, 0);
      return;
    }
    if(e.gamma != null) atualizar(e.gamma, e.beta || 0);
  }
  if(window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function"){
    var b = document.createElement("button");
    b.className = "zbtn mt";
    b.textContent = "Ativar sensores";
    b.addEventListener("click", function(){
      DeviceOrientationEvent.requestPermission().then(function(r){
        if(r === "granted"){
          window.addEventListener("deviceorientation", handler);
          b.remove();
        } else Z.toast("Permissão negada");
      }).catch(function(){ Z.toast("Não suportado") });
    });
    $id("dir").parentNode.insertBefore(b, $id("dir"));
  } else if("DeviceOrientationEvent" in window){
    window.addEventListener("deviceorientation", handler);
  } else {
    $id("dir").textContent = "Este dispositivo não tem sensores de orientação.";
  }
})();
`;
  return { body, js };
}

/* ── NÍVEL ──────────────────────────────────────────────── */
export function nivel({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad center" style="max-width:440px;margin:0 auto">
  <div style="position:relative;width:200px;height:200px;margin:0 auto 18px;border-radius:50%;border:2px solid var(--z-line2);background:var(--z-bg2);overflow:hidden">
    <div style="position:absolute;inset:70px;border-radius:50%;border:2px dashed var(--z-line2)"></div>
    <div id="bolha" style="position:absolute;left:50%;top:50%;width:34px;height:34px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 35% 35%, #b7ffd9, var(--z-lime));box-shadow:0 0 18px rgba(125,255,106,0.5)"></div>
  </div>
  <div class="row" style="justify-content:center;gap:16px">
    <div class="zstat"><span>Inclinação X</span><b id="gx">0.0°</b></div>
    <div class="zstat"><span>Inclinação Y</span><b id="gy">0.0°</b></div>
    <div class="zstat"><span>Status</span><b id="ok" class="acc">—</b></div>
  </div>
  <p class="dim mt" id="dica">Gire o aparelho para nivelar</p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var handler = function(e){
    if(e.gamma == null) return;
    var g = Math.max(-45, Math.min(45, e.gamma || 0));
    var b = Math.max(-45, Math.min(45, e.beta || 0));
    var x = g * 2.6, y = -b * 2.6;
    $id("bolha").style.transform = "translate(calc(-50% + " + x + "px), calc(-50% + " + y + "px))";
    $id("gx").textContent = (e.gamma || 0).toFixed(1) + "°";
    $id("gy").textContent = (e.beta || 0).toFixed(1) + "°";
    var plano = Math.abs(e.gamma || 0) < 3 && Math.abs((e.beta || 0) - 0) < 3;
    $id("ok").textContent = plano ? "Nivelado OK" : "Ajuste";
    $id("ok").style.color = plano ? "var(--z-lime)" : "var(--z-amber)";
  };
  if("DeviceOrientationEvent" in window){
    if(typeof DeviceOrientationEvent.requestPermission === "function"){
      var b2 = document.createElement("button");
      b2.className = "zbtn mt";
      b2.textContent = "Ativar sensores";
      b2.addEventListener("click", function(){
        DeviceOrientationEvent.requestPermission().then(function(r){
          if(r === "granted"){ window.addEventListener("deviceorientation", handler); b2.remove() }
        }).catch(function(){});
      });
      document.body.appendChild(b2);
    } else window.addEventListener("deviceorientation", handler);
  } else $id("dica").textContent = "Este dispositivo não tem giroscópio.";
})();
`;
  return { body, js };
}

/* ── LOUSA ──────────────────────────────────────────────── */
export function lousa({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="row mb wrap" style="justify-content:center;gap:8px">
  ${["#edf0ff", "#29e0ff", "#ff4d8f", "#7dff6a", "#ffd166", "#7c5cff"].map((c) => `<button class="zbtn sm" data-cor="${c}" type="button" style="background:${c};width:34px;height:34px;padding:0;border-radius:50%"></button>`).join("")}
  <button class="zbtn sm ghost" data-cor="apagar" type="button">Limpeza Borracha</button>
</div>
<div class="row mb wrap" style="justify-content:center;gap:8px">
  <span class="zchip">Traço: <b class="acc" id="tamV">4</b>px</span>
  <input type="range" id="tam" min="1" max="30" value="4" style="width:160px">
  <button class="zbtn sm ghost" id="limpar" type="button">Lixeira Limpar tudo</button>
  <button class="zbtn sm" id="baixar" type="button">⬇ PNG</button>
</div>
<div style="max-width:760px;margin:0 auto">
  <canvas class="zc" id="cv" width="760" height="460" style="background:#0b0f1f;cursor:crosshair"></canvas>
</div>`;
  const js = `
(function(){
  var cv = document.getElementById("cv");
  var ctx = cv.getContext ? cv.getContext("2d") : null;
  if(!ctx){ cv.outerHTML = "<p class='dim center'>Canvas não suportado.</p>"; return; }
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  var cor = "#edf0ff", desenhando = false, ultimo = null;
  document.querySelectorAll("[data-cor]").forEach(function(b){
    b.addEventListener("click", function(){
      cor = this.dataset.cor === "apagar" ? "rgba(11,15,31,1)" : this.dataset.cor;
      document.querySelectorAll("[data-cor]").forEach(function(x){ x.style.outline = "none" });
      this.style.outline = "3px solid var(--z-acc)";
    });
  });
  document.getElementById("tam").addEventListener("input", function(){
    ctx.lineWidth = parseInt(this.value, 10);
    document.getElementById("tamV").textContent = this.value;
  });
  function pos(e){
    var r = cv.getBoundingClientRect();
    var t = e.touches ? e.touches[0] : e;
    return {x: (t.clientX - r.left) * (cv.width / r.width), y: (t.clientY - r.top) * (cv.height / r.height)};
  }
  function iniciar(e){
    e.preventDefault();
    desenhando = true;
    ultimo = pos(e);
  }
  function mover(e){
    if(!desenhando) return;
    e.preventDefault();
    var p = pos(e);
    ctx.strokeStyle = cor;
    ctx.beginPath();
    ctx.moveTo(ultimo.x, ultimo.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ultimo = p;
  }
  function parar(){ desenhando = false }
  cv.addEventListener("mousedown", iniciar);
  cv.addEventListener("mousemove", mover);
  window.addEventListener("mouseup", parar);
  cv.addEventListener("touchstart", iniciar, {passive: false});
  cv.addEventListener("touchmove", mover, {passive: false});
  cv.addEventListener("touchend", parar);
  document.getElementById("limpar").addEventListener("click", function(){
    ctx.clearRect(0, 0, cv.width, cv.height);
  });
  document.getElementById("baixar").addEventListener("click", function(){
    var a = document.createElement("a");
    a.download = "lousa-zcode.png";
    a.href = cv.toDataURL("image/png");
    a.click();
    Z.toast("PNG salvo!");
  });
})();
`;
  return { body, js };
}

/* ── TO-DO ──────────────────────────────────────────────── */
export function todo({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Salvo no navegador.</p></div>
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="row mb">
    <input class="zinput grow" id="nova" placeholder="O que precisa ser feito?">
    <button class="zbtn" id="add" type="button">+</button>
  </div>
  <div class="row wrap mb" style="justify-content:center;gap:8px">
    <button class="zbtn sm" data-f="todas" type="button">Todas</button>
    <button class="zbtn sm ghost" data-f="pendentes" type="button">Pendentes</button>
    <button class="zbtn sm ghost" data-f="feitas" type="button">Feitas</button>
  </div>
  <div class="col" id="lista"></div>
  <p class="dim center mt" id="contador"></p>
</div>`;
  const js = `
(function(){
  var KEY = "todo";
  var itens = Z.store.get(KEY, []);
  var filtro = "todas";
  function $id(x){return document.getElementById(x)}
  function salvar(){ Z.store.set(KEY, itens) }
  function render(){
    var box = $id("lista"); box.innerHTML = "";
    var visiveis = itens.filter(function(t){
      if(filtro === "pendentes") return !t.feita;
      if(filtro === "feitas") return t.feita;
      return true;
    });
    if(!visiveis.length) box.innerHTML = "<p class='dim center'>Nada por aqui. </p>";
    visiveis.forEach(function(t){
      var d = document.createElement("div");
      d.className = "zcard row between wrap";
      d.style.cssText = "padding:11px 14px;margin-bottom:8px";
      var esq = document.createElement("div");
      esq.className = "row grow";
      var chk = document.createElement("button");
      chk.className = "zbtn sm ghost";
      chk.style.cssText = "width:32px;justify-content:center";
      chk.textContent = t.feita ? "OK" : "○";
      chk.addEventListener("click", function(){ t.feita = !t.feita; salvar(); render() });
      var span = document.createElement("span");
      span.textContent = t.txt;
      if(t.feita) span.style.cssText = "text-decoration:line-through;opacity:.5";
      esq.appendChild(chk); esq.appendChild(span);
      var del = document.createElement("button");
      del.className = "zbtn sm danger";
      del.textContent = "Fechar";
      del.addEventListener("click", function(){ itens = itens.filter(function(x){ return x !== t }); salvar(); render() });
      d.appendChild(esq); d.appendChild(del);
      box.appendChild(d);
    });
    var pend = itens.filter(function(t){ return !t.feita }).length;
    $id("contador").textContent = itens.length + " tarefas · " + pend + " pendente(s)";
  }
  $id("add").addEventListener("click", function(){
    var v = $id("nova").value.trim();
    if(!v) return;
    itens.unshift({txt: v, feita: false});
    $id("nova").value = "";
    salvar(); render();
  });
  $id("nova").addEventListener("keydown", function(e){ if(e.key === "Enter") $id("add").click() });
  document.querySelectorAll("[data-f]").forEach(function(b){
    b.addEventListener("click", function(){
      filtro = this.dataset.f;
      document.querySelectorAll("[data-f]").forEach(function(x){ x.classList.add("ghost") });
      this.classList.remove("ghost");
      render();
    });
  });
  render();
})();
`;
  return { body, js };
}

/* ── HÁBITOS ────────────────────────────────────────────── */
export function habitos({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub} · Marque os últimos 7 dias de cada hábito.</p></div>
<div class="zcard pad mb" style="max-width:640px;margin:0 auto">
  <div class="row">
    <input class="zinput grow" id="novo" placeholder="Novo hábito (ex.: beber 2L de água)">
    <button class="zbtn" id="add" type="button">+</button>
  </div>
</div>
<div class="col" id="lista" style="max-width:640px;margin:0 auto"></div>`;
  const js = `
(function(){
  var KEY = "habitos";
  var habitos = Z.store.get(KEY, []);
  function $id(x){return document.getElementById(x)}
  function salvar(){ Z.store.set(KEY, habitos) }
  function chaves7(){
    var out = [];
    for(var i = 6; i >= 0; i--){
      var d = new Date();
      d.setDate(d.getDate() - i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }
  var CHAVES = chaves7();
  function render(){
    var box = $id("lista"); box.innerHTML = "";
    if(!habitos.length) box.innerHTML = "<p class='dim center'>Crie seu primeiro hábito acima. Água</p>";
    habitos.forEach(function(h){
      var d = document.createElement("div");
      d.className = "zcard";
      d.style.cssText = "padding:12px 14px;margin-bottom:10px";
      var top = document.createElement("div");
      top.className = "row between mb";
      var nome = document.createElement("b");
      nome.className = "fd";
      nome.textContent = h.nome;
      var del = document.createElement("button");
      del.className = "zbtn sm danger";
      del.textContent = "Fechar";
      del.addEventListener("click", function(){ habitos = habitos.filter(function(x){ return x !== h }); salvar(); render() });
      top.appendChild(nome); top.appendChild(del);
      var dias = document.createElement("div");
      dias.className = "zgrid";
      dias.style.cssText = "grid-template-columns:repeat(7,1fr);gap:6px";
      CHAVES.forEach(function(k){
        var b = document.createElement("button");
        var on = h.dias && h.dias[k];
        b.className = "zbtn sm";
        b.style.cssText = "padding:8px 4px;font-size:11px;background:" + (on ? "var(--z-acc)" : "var(--z-surface2)") + ";color:" + (on ? "#04060d" : "var(--z-muted)");
        b.textContent = k.slice(8) + "/" + k.slice(5, 7);
        b.addEventListener("click", function(){
          h.dias = h.dias || {};
          if(h.dias[k]) delete h.dias[k]; else h.dias[k] = 1;
          salvar(); render();
          Z.snd(on ? 400 : 700, 0.04, "sine", 0.02);
        });
        dias.appendChild(b);
      });
      d.appendChild(top); d.appendChild(dias);
      box.appendChild(d);
    });
  }
  $id("add").addEventListener("click", function(){
    var v = $id("novo").value.trim();
    if(!v) return;
    habitos.push({nome: v, dias: {}});
    $id("novo").value = "";
    salvar(); render();
  });
  $id("novo").addEventListener("keydown", function(e){ if(e.key === "Enter") $id("add").click() });
  render();
})();
`;
  return { body, js };
}
