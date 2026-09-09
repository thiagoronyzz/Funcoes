/* Zcode — runtime compartilhado dos jogos (G).
   Injetado no início do JS de cada engine de jogo. */

export const GBASE = `
var G = (function(){
  function ctx2d(id){
    var c = document.getElementById(id);
    if(!c) return { c:null, x:null };
    var x = null;
    try { x = c.getContext ? c.getContext("2d") : null; } catch(e){ x = null; }
    return { c:c, x:x };
  }
  var keys = {};
  var BLOQ = [" ","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"];
  document.addEventListener("keydown", function(e){
    keys[e.key] = true;
    if(BLOQ.indexOf(e.key) >= 0) e.preventDefault();
  });
  document.addEventListener("keyup", function(e){ keys[e.key] = false; });

  function bindPad(){
    var pad = document.getElementById("zpad");
    if(!pad) return;
    var bs = pad.querySelectorAll("[data-k]");
    for(var i=0;i<bs.length;i++){
      (function(b){
        var k = b.getAttribute("data-k");
        function on(ev){ ev.preventDefault(); keys[k] = true; }
        function off(){ keys[k] = false; }
        b.addEventListener("pointerdown", on);
        b.addEventListener("pointerup", off);
        b.addEventListener("pointerleave", off);
        b.addEventListener("pointercancel", off);
        b.addEventListener("touchstart", on, { passive:false });
        b.addEventListener("touchend", off);
      })(bs[i]);
    }
  }

  function pos(cnv, ev){
    var r = cnv.getBoundingClientRect();
    var px = (ev.touches && ev.touches[0]) ? ev.touches[0].clientX : ev.clientX;
    var py = (ev.touches && ev.touches[0]) ? ev.touches[0].clientY : ev.clientY;
    return {
      x: (px - r.left) * (cnv.width / (r.width || cnv.width)),
      y: (py - r.top) * (cnv.height / (r.height || cnv.height))
    };
  }

  function loop(fn){
    var alive = true, last = 0, id = 0;
    function tick(t){
      if(!alive) return;
      var dt = last ? Math.min(3, (t - last) / 16.6667) : 1;
      last = t;
      try { fn(dt); } catch(e){ alive = false; return; }
      id = requestAnimationFrame(tick);
    }
    if(typeof requestAnimationFrame === "function") id = requestAnimationFrame(tick);
    return { stop: function(){ alive = false; try{ cancelAnimationFrame(id); }catch(e){} } };
  }

  function txt(id, v){ var e = document.getElementById(id); if(e) e.textContent = v; }

  function emoji(x, e, s, px, py){
    if(!x) return;
    x.save();
    x.font = s + "px system-ui, 'Apple Color Emoji','Segoe UI Emoji', sans-serif";
    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(e, px, py);
    x.restore();
  }

  function fundo(x, cnv, cor){
    if(!x) return;
    x.fillStyle = cor || "#fbfaf7";
    x.fillRect(0, 0, cnv.width, cnv.height);
  }

  function over(titulo, msg, rotulo, cb){
    var old = document.getElementById("zover");
    if(old) old.remove();
    var d = document.createElement("div");
    d.className = "zmodal"; d.id = "zover";
    d.innerHTML = '<div class="zbox"><h3></h3><p></p><button class="zbtn big" type="button"></button></div>';
    d.querySelector("h3").textContent = titulo;
    d.querySelector("p").textContent = msg;
    var b = d.querySelector("button");
    b.textContent = rotulo || "Jogar de novo";
    b.addEventListener("click", function(){ d.remove(); if(cb) cb(); });
    document.body.appendChild(d);
    try { b.focus(); } catch(e){}
  }

  function best(chave, valor, maior){
    var atual = Z.store.get("rec:" + chave, null);
    var novo = false;
    if(atual === null || (maior !== false ? valor > atual : valor < atual)){
      Z.store.set("rec:" + chave, valor); atual = valor; novo = true;
    }
    return { valor: atual, novo: novo };
  }

  function clamp(v, a, b){ return v < a ? a : (v > b ? b : v); }
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function ri(a, b){ return Math.floor(a + Math.random() * (b - a + 1)); }
  function pick(a){ return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a){
    var r = a.slice();
    for(var i = r.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = r[i]; r[i] = r[j]; r[j] = t; }
    return r;
  }

  bindPad();
  return { ctx2d:ctx2d, keys:keys, pos:pos, loop:loop, txt:txt, emoji:emoji, fundo:fundo,
           over:over, best:best, clamp:clamp, rnd:rnd, ri:ri, pick:pick, shuffle:shuffle };
})();
`;

/* CSS extra usado pelos jogos (d-pad, tabuleiros, listas) */
export const GCSS = `
.zpad{display:grid;grid-template-columns:repeat(3,58px);grid-template-rows:repeat(2,52px);gap:8px;justify-content:center;margin-top:14px}
.zpad button{font-size:19px;background:var(--z-surface2);border:1px solid var(--z-line2);border-radius:10px;
  color:var(--z-text);cursor:pointer;touch-action:none;user-select:none}
.zpad button:active{background:var(--z-acc);color:#fff}
.zpad .sp{visibility:hidden}
.zhelp{margin-top:12px;font-size:12.5px;color:var(--z-muted);line-height:1.5}
.zboard{display:grid;gap:9px;margin:0 auto;max-width:520px}
.zcell{aspect-ratio:1/1;display:grid;place-items:center;font-size:26px;cursor:pointer;user-select:none;
  background:var(--z-surface2);border:1px solid var(--z-line2);border-radius:10px;transition:.12s;padding:0}
.zcell:hover{border-color:var(--z-acc)}
.zcell.on{background:var(--z-acc);color:#fff;border-color:transparent}
.zcell.flip{background:var(--z-surface);border-color:var(--z-acc)}
.zcell.done{opacity:.35;cursor:default}
.zcell.sel{outline:3px solid var(--z-acc);outline-offset:-3px}
.zlist{display:flex;flex-direction:column;gap:8px;max-height:190px;overflow:auto;font-size:13.5px}
.zlist p{border-bottom:1px dashed var(--z-line);padding-bottom:5px}
.ztag{display:inline-block;font-family:var(--z-fm);font-size:11px;padding:3px 9px;border-radius:99px;
  border:1px solid var(--z-line2);color:var(--z-muted)}
.zbars{display:flex;flex-direction:column;gap:10px}
.zbars div{display:flex;align-items:center;gap:10px;font-size:13.5px}
.zbars i{font-style:normal;width:118px;color:var(--z-muted);font-family:var(--z-fm);font-size:11px;
  letter-spacing:.1em;text-transform:uppercase}
.zbars b{margin-left:auto;font-family:var(--z-fd);font-size:16px}
.zshop{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
.zshop button{text-align:left;padding:12px 14px;border-radius:10px;background:var(--z-surface2);
  border:1px solid var(--z-line2);color:var(--z-text);cursor:pointer;font-family:var(--z-f);font-size:13.5px}
.zshop button:hover:not(:disabled){border-color:var(--z-acc)}
.zshop button:disabled{opacity:.45;cursor:not-allowed}
.zshop b{display:block;font-family:var(--z-fd);font-size:15px;margin-bottom:2px}
.zlanes{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:420px;margin:10px auto 0}
.zlanes button{padding:12px 0;font-family:var(--z-fd);font-size:16px;background:var(--z-surface2);
  border:1px solid var(--z-line2);border-radius:10px;color:var(--z-text);cursor:pointer}
.zlanes button:active{background:var(--z-acc);color:#fff}
.zbins{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:520px;margin:12px auto 0}
.zbins button{padding:14px 8px;border-radius:10px;background:var(--z-surface2);border:1px solid var(--z-line2);
  color:var(--z-text);cursor:pointer;font-size:13px;font-family:var(--z-f)}
.zbins button b{display:block;font-size:24px}
.zsus{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:12px}
.zsus button{padding:12px;border-radius:10px;background:var(--z-surface2);border:1px solid var(--z-line2);
  color:var(--z-text);cursor:pointer;text-align:left;font-size:12.5px;line-height:1.5}
.zsus button b{display:block;font-family:var(--z-fd);font-size:15px;margin-bottom:3px}
.zsus button:hover{border-color:var(--z-acc)}
`;

/* Cabeçalho padrão + rodapé de ajuda usados por todos os jogos */
export function hero(titulo, sub) {
  return `<div class="zhero">
  <h1>${titulo}</h1>
  <p>${sub}</p>
</div>`;
}

export function hud(itens) {
  return `<div class="row between wrap mb" style="gap:14px">
${itens.map((i) => (i.btn
    ? `    <button class="zbtn" id="${i.id}" type="button">${i.btn}</button>`
    : `    <span class="zstat"><span>${i.rot}</span><b id="${i.id}">${i.val}</b></span>`)).join("\n")}
  </div>`;
}

export function dpad(cima = true) {
  return `<div class="zpad" id="zpad" aria-label="Controles">
  <button class="sp" tabindex="-1"></button>
  <button data-k="ArrowUp" aria-label="Cima">${cima ? "▲" : "▲"}</button>
  <button class="sp" tabindex="-1"></button>
  <button data-k="ArrowLeft" aria-label="Esquerda">◀</button>
  <button data-k="ArrowDown" aria-label="Baixo">▼</button>
  <button data-k="ArrowRight" aria-label="Direita">▶</button>
</div>`;
}

export function help(txt) {
  return `<p class="zhelp">${txt}</p>`;
}
