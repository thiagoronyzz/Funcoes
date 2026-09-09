/* Zcode — engines de Estudos II: conteúdo rico + formatos novos */

function wrapEstudo({ titulo, sub, body, js, css }) {
  return {
    body: `
<div class="zhero"><h1>${titulo}</h1><p>${sub}</p></div>
${body}`,
    js,
    css: css || "",
  };
}

/* ── GUIA (artigo rico com busca e progresso) ───────────── */
export function guia({ nome, sub, secoes, chave }) {
  const body = `
<div class="row mb wrap">
  <input class="zinput grow" id="busca" placeholder="Buscar neste guia…" autocomplete="off" style="min-width:200px">
  <button class="zbtn ghost sm" id="imprimir" type="button">Imprimir / PDF</button>
</div>
<div class="zprog mb"><i id="barra" style="width:0%"></i></div>
<p class="dim mb" id="prog" style="font-size:13px"></p>
<div class="col" id="secoes"></div>`;
  const js = `
(function(){
  var SECOES=${JSON.stringify(secoes)};
  var CHAVE="guia-${chave}";
  var lidas=Z.store.get(CHAVE,{});
  function salva(){Z.store.set(CHAVE,lidas);}
  function render(filtro){
    var box=document.getElementById("secoes");
    box.innerHTML="";
    var t=(filtro||"").toLowerCase(),vis=0,tot=0;
    for(var i=0;i<SECOES.length;i++){
      (function(i){
        var s=SECOES[i];tot++;
        var txt=(s.t+" "+s.h).toLowerCase();
        if(t&&txt.indexOf(t)<0)return;
        vis++;
        var card=Z.el("div","zcard pad");
        var head=Z.el("div","row between wrap");
        var h=Z.el("h3");h.textContent=s.t;
        var lab=Z.el("label","row");
        lab.style.cssText="gap:6px;font-size:12.5px;color:var(--z-muted);cursor:pointer;flex:none";
        var cb=document.createElement("input");
        cb.type="checkbox";cb.checked=!!lidas[i];
        cb.style.cssText="width:16px;height:16px;accent-color:#10b981;cursor:pointer";
        cb.addEventListener("change",function(){lidas[i]=cb.checked;salva();progresso();});
        lab.appendChild(cb);
        var sp=document.createElement("span");sp.textContent="Lida";lab.appendChild(sp);
        head.appendChild(h);head.appendChild(lab);
        card.appendChild(head);
        var corpo=Z.el("div","guia-corpo");corpo.innerHTML=s.h;
        card.appendChild(corpo);
        box.appendChild(card);
      })(i);
    }
    if(!vis){
      var v=Z.el("div","zcard pad center");
      v.innerHTML="<p class='dim'>Nenhuma seção encontrada para essa busca.</p>";
      box.appendChild(v);
    }
    progresso();
  }
  function progresso(){
    var n=0;
    for(var i=0;i<SECOES.length;i++)if(lidas[i])n++;
    document.getElementById("barra").style.width=(n/SECOES.length*100)+"%";
    document.getElementById("prog").textContent=n+" de "+SECOES.length+" seções lidas";
  }
  document.getElementById("busca").addEventListener("input",function(){render(this.value);});
  document.getElementById("imprimir").addEventListener("click",function(){window.print();});
  render("");
})();
`;
  const css = `
.guia-corpo{margin-top:10px;font-size:15px;line-height:1.7;color:var(--z-text)}
.guia-corpo p{margin:0 0 10px}
.guia-corpo ul,.guia-corpo ol{margin:0 0 12px 20px}
.guia-corpo li{margin-bottom:6px}
.guia-corpo b,.guia-corpo strong{color:var(--z-brand-hi)}
.guia-corpo table{width:100%;border-collapse:collapse;margin:0 0 12px;font-size:14px}
.guia-corpo th{font-family:var(--z-fm);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--z-muted);text-align:left;padding:8px 10px;border-bottom:1px solid var(--z-line2)}
.guia-corpo td{padding:8px 10px;border-bottom:1px solid var(--z-line);vertical-align:top}
.guia-corpo blockquote{border-left:3px solid var(--z-acc);margin:0 0 12px;padding:8px 14px;background:rgba(255,255,255,.03);border-radius:0 10px 10px 0;color:var(--z-muted)}
.guia-corpo code{font-family:var(--z-fm);font-size:13px;background:rgba(255,255,255,.07);padding:1px 6px;border-radius:6px}
@media print{
  .ztop,.zfoot,#busca,#imprimir,.zprog,#prog,.guia-corpo label{display:none!important}
  body{background:#fff;color:#111}
  .zcard{border-color:#ddd;box-shadow:none;break-inside:avoid}
}`;
  return wrapEstudo({ titulo: nome, sub, body, js, css });
}

/* ── TABELA DE REFERÊNCIA (buscável) ────────────────────── */
export function tabelaRef({ nome, sub, colunas, linhas, chave }) {
  const body = `
<div class="row mb">
  <input class="zinput grow" id="busca" placeholder="Buscar… (ex.: ${String(colunas[0]).toLowerCase()})" autocomplete="off">
</div>
<p class="dim mb" id="cont" style="font-size:13px"></p>
<div class="zcard pad" style="padding:8px 10px;overflow-x:auto">
  <table class="ztable" id="tab"></table>
</div>`;
  const js = `
(function(){
  var COLS=${JSON.stringify(colunas)};
  var LINS=${JSON.stringify(linhas)};
  function render(f){
    var t=(f||"").toLowerCase();
    var head="<tr>"+COLS.map(function(c){return "<th>"+Z.esc(c)+"</th>"}).join("")+"</tr>";
    var n=0,rows="";
    for(var i=0;i<LINS.length;i++){
      var l=LINS[i];
      if(t&&l.join(" ").toLowerCase().indexOf(t)<0)continue;
      n++;
      rows+="<tr>"+l.map(function(c){return "<td>"+c+"</td>"}).join("")+"</tr>";
    }
    document.getElementById("tab").innerHTML=head+rows;
    document.getElementById("cont").textContent=n+" de "+LINS.length+" registros";
  }
  document.getElementById("busca").addEventListener("input",function(){render(this.value);});
  render("");
})();
`;
  return wrapEstudo({ titulo: nome, sub, body, js });
}

/* ── LINHA DO TEMPO (eventos expansíveis) ───────────────── */
export function linhaTempo({ nome, sub, eventos, chave }) {
  const body = `
<p class="dim mb" style="font-size:13.5px">Toque em cada marco para expandir os detalhes.</p>
<div class="lt-linha" id="linha"></div>`;
  const css = `
.lt-linha{display:flex;flex-direction:column;gap:0;max-width:640px;margin:0 auto}
.lt-ev{position:relative;padding:0 0 8px 30px;cursor:pointer}
.lt-ev::before{content:"";position:absolute;left:8px;top:26px;bottom:-4px;width:2px;background:var(--z-line2)}
.lt-ev:last-child::before{display:none}
.lt-ev::after{content:"";position:absolute;left:2px;top:6px;width:14px;height:14px;border-radius:50%;background:var(--z-surface);border:3px solid var(--z-acc)}
.lt-ano{font-family:var(--z-fm);font-size:11px;letter-spacing:.14em;color:var(--z-acc);text-transform:uppercase}
.lt-t{font-family:var(--z-fd);font-size:18px;font-weight:700;margin:2px 0 4px}
.lt-d{font-size:14px;color:var(--z-muted);line-height:1.6;max-height:0;overflow:hidden;transition:max-height .3s}
.lt-ev.aberto .lt-d{max-height:400px}
.lt-ev .zcard{padding:14px 16px;transition:border-color .2s}
.lt-ev.aberto .zcard{border-color:var(--z-acc)}`;
  const js = `
(function(){
  var EV=${JSON.stringify(eventos)};
  var box=document.getElementById("linha");
  for(var i=0;i<EV.length;i++){
    (function(i){
      var e=EV[i];
      var w=Z.el("div","lt-ev"+(i===0?" aberto":""));
      var card=Z.el("div","zcard");
      var ano=Z.el("div","lt-ano");ano.textContent=e.ano;
      var t=Z.el("div","lt-t");t.textContent=e.t;
      var d=Z.el("div","lt-d");d.innerHTML=e.d;
      card.appendChild(ano);card.appendChild(t);card.appendChild(d);
      w.appendChild(card);
      w.addEventListener("click",function(){w.classList.toggle("aberto");});
      box.appendChild(w);
    })(i);
  }
})();
`;
  return wrapEstudo({ titulo: nome, sub, body, js, css });
}

/* ── COMPLETAR (lacunas) ────────────────────────────────── */
export function completar({ nome, sub, itens, chave }) {
  const body = `
<div class="row between wrap mb">
  <p class="dim" id="prog" style="font-size:13px"></p>
  <p class="dim" style="font-size:13px">Acertos: <b class="ok" id="pts">0</b> · Erros: <b class="bad" id="err">0</b></p>
</div>
<div class="zcard pad center" id="carta" style="font-size:17px;line-height:2"></div>
<p class="dim center mt" id="fb" style="min-height:22px;font-size:14px"></p>
<div class="row center mt wrap" id="botoes">
  <input class="zinput" id="resp" placeholder="Sua resposta" autocomplete="off" style="max-width:220px">
  <button class="zbtn sm" id="ok" type="button">Confirmar</button>
  <button class="zbtn ghost sm" id="dica" type="button">Dica</button>
</div>`;
  const js = `
(function(){
  var IT=${JSON.stringify(itens)};
  var CHAVE="compl-${chave}";
  var rec=Z.store.get(CHAVE,{best:0});
  var i=0,pts=0,err=0,ordem=Z.shuffle(IT.map(function(_,k){return k}));
  function norm(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").trim().replace(/\\s+/g," ");}
  function render(){
    document.getElementById("prog").textContent="Questão "+(i+1)+" de "+ordem.length+" · Recorde: "+rec.best;
    document.getElementById("pts").textContent=pts;
    document.getElementById("err").textContent=err;
    var it=IT[ordem[i]];
    var carta=document.getElementById("carta");
    carta.innerHTML="";
    var pre=document.createElement("span");pre.textContent=it.pre+" ";
    var lac=document.createElement("b");lac.textContent="_____";lac.style.color="var(--z-acc)";
    var pos=document.createElement("span");pos.textContent=" "+it.pos;
    carta.appendChild(pre);carta.appendChild(lac);carta.appendChild(pos);
    var fb=document.getElementById("fb");fb.textContent="";fb.className="dim center mt";
    var r=document.getElementById("resp");r.value="";r.focus();
  }
  function fim(){
    if(pts>rec.best){rec.best=pts;Z.store.set(CHAVE,rec);}
    var carta=document.getElementById("carta");
    carta.innerHTML="<b style='font-size:20px'>"+(err===0?"Perfeito! Nenhum erro.":(pts>=ordem.length*0.7?"Muito bem!":"Continue praticando."))+"</b><br><span class='dim'>"+pts+" acertos · "+err+" erros · Recorde: "+rec.best+"</span>";
    document.getElementById("botoes").innerHTML="<button class='zbtn sm' id='re' type='button'>Tentar de novo</button>";
    document.getElementById("re").addEventListener("click",function(){location.reload();});
  }
  function confere(){
    var it=IT[ordem[i]];
    var v=norm(document.getElementById("resp").value);
    var fb=document.getElementById("fb");
    var ok=it.alts.some(function(a){return norm(a)===v});
    if(ok){
      pts++;Z.snd(true);fb.textContent="Correto! "+(it.com||"");fb.className="ok center mt";Z.toast("Correto!");
      i++;
      if(i>=ordem.length)setTimeout(fim,900);else setTimeout(render,1100);
    }else{
      err++;Z.snd(false);fb.textContent="Não é isso. Tente de novo.";fb.className="bad center mt";
      document.getElementById("err").textContent=err;
    }
  }
  document.getElementById("ok").addEventListener("click",confere);
  document.getElementById("resp").addEventListener("keydown",function(e){if(e.key==="Enter")confere();});
  document.getElementById("dica").addEventListener("click",function(){
    var it=IT[ordem[i]];
    var fb=document.getElementById("fb");fb.textContent=it.dica||"Sem dica.";fb.className="dim center mt";
  });
  render();
})();
`;
  return wrapEstudo({ titulo: nome, sub, body, js });
}

/* ── ORDENAR (sequência) ────────────────────────────────── */
export function ordenar({ nome, sub, itens, chave }) {
  const body = `
<p class="dim mb" style="font-size:13.5px">Toque nos itens fora de ordem para colocá-los na sequência correta.</p>
<p class="dim" style="font-size:13px">Sua ordem:</p>
<div class="col mb" id="slots" style="gap:8px"></div>
<p class="dim" style="font-size:13px">Itens:</p>
<div class="col mb" id="banco" style="gap:8px"></div>
<div class="row center wrap">
  <button class="zbtn sm" id="ok" type="button">Verificar ordem</button>
  <button class="zbtn ghost sm" id="limpa" type="button">Limpar</button>
</div>
<p class="center mt" id="fb" style="min-height:24px;font-size:14.5px"></p>`;
  const css = `
.ord-item{background:var(--z-surface2);border:1px solid var(--z-line2);border-radius:10px;padding:10px 14px;font-size:14.5px;cursor:pointer;transition:border-color .15s}
.ord-item:hover{border-color:var(--z-acc)}
.ord-slot{background:var(--z-surface);border:1px dashed var(--z-line2);border-radius:10px;padding:10px 14px;font-size:14.5px;min-height:20px;cursor:pointer}
.ord-slot.cheio{border-style:solid;cursor:pointer}
.ord-slot.ok{border-color:#10b981}.ord-slot.mau{border-color:#f43f5e}`;
  const js = `
(function(){
  var IT=${JSON.stringify(itens)};
  var CHAVE="ord-${chave}";
  var rec=Z.store.get(CHAVE,{best:0});
  var banco=Z.shuffle(IT.map(function(_,k){return k}));
  var slots=[];
  function render(){
    var sb=document.getElementById("slots"),bb=document.getElementById("banco");
    sb.innerHTML="";bb.innerHTML="";
    for(var s=0;s<IT.length;s++){
      (function(s){
        var d=Z.el("div","ord-slot"+(slots[s]!=null?" cheio":""));
        if(slots[s]!=null){d.textContent=(s+1)+". "+IT[slots[s]];d.addEventListener("click",function(){banco.push(slots[s]);slots[s]=null;render();});}
        else d.innerHTML="<span class='dim'>"+(s+1)+". —</span>";
        sb.appendChild(d);
      })(s);
    }
    for(var b=0;b<banco.length;b++){
      (function(b){
        var d=Z.el("div","ord-item");d.textContent=IT[banco[b]];
        d.addEventListener("click",function(){
          for(var s=0;s<IT.length;s++)if(slots[s]==null){slots[s]=banco[b];banco.splice(b,1);break;}
          render();
        });
        bb.appendChild(d);
      })(b);
    }
  }
  document.getElementById("limpa").addEventListener("click",function(){
    slots=[];banco=Z.shuffle(IT.map(function(_,k){return k}));
    document.getElementById("fb").textContent="";render();
  });
  document.getElementById("ok").addEventListener("click",function(){
    if(slots.some(function(s){return s==null})){Z.toast("Complete a ordem primeiro");return;}
    var certas=0,els=document.getElementById("slots").children;
    for(var s=0;s<IT.length;s++){
      var ok=slots[s]===s;
      if(ok)certas++;
      els[s].classList.add(ok?"ok":"mau");
      if(!ok)setTimeout((function(el){return function(){el.classList.remove("mau")}})(els[s]),1200);
    }
    var fb=document.getElementById("fb");
    if(certas===IT.length){
      fb.textContent="Ordem perfeita! Recorde: "+Math.max(rec.best,certas)+"/"+IT.length;fb.className="ok center mt";
      if(certas>rec.best){rec.best=certas;Z.store.set(CHAVE,rec);}
      Z.snd(true);
    }else{
      fb.textContent=certas+" de "+IT.length+" na posição certa. Ajuste e tente de novo.";fb.className="bad center mt";
      Z.snd(false);
    }
  });
  render();
})();
`;
  return wrapEstudo({ titulo: nome, sub, body, js, css });
}

/* ── RELACIONAR (ligar colunas) ─────────────────────────── */
export function relacionar({ nome, sub, pares, chave }) {
  const body = `
<div class="row between wrap mb">
  <p class="dim" style="font-size:13px">Toque em um item da esquerda e depois no correspondente da direita.</p>
  <p class="dim" style="font-size:13px">Pares: <b class="ok" id="pts">0</b>/<span id="tot"></span> · Erros: <b class="bad" id="err">0</b></p>
</div>
<div class="rel-grid" id="grid"></div>
<p class="center mt" id="fb" style="min-height:26px;font-size:15px"></p>`;
  const css = `
.rel-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:640px;margin:0 auto}
.rel-col{display:flex;flex-direction:column;gap:8px}
.rel-item{background:var(--z-surface2);border:1px solid var(--z-line2);border-radius:10px;padding:10px 12px;font-size:14px;cursor:pointer;transition:border-color .15s,opacity .2s;word-break:break-word}
.rel-item:hover{border-color:var(--z-acc)}
.rel-item.sel{border-color:var(--z-acc);box-shadow:0 0 0 1px var(--z-acc)}
.rel-item.feito{opacity:.35;pointer-events:none;border-color:#10b981}`;
  const js = `
(function(){
  var PARES=${JSON.stringify(pares)};
  var ordemB=Z.shuffle(PARES.map(function(_,k){return k}));
  var selA=null,pts=0,err=0;
  document.getElementById("tot").textContent=PARES.length;
  var grid=document.getElementById("grid");
  var ca=Z.el("div","rel-col"),cb=Z.el("div","rel-col");
  grid.appendChild(ca);grid.appendChild(cb);
  var elsB={};
  for(var a=0;a<PARES.length;a++){
    (function(a){
      var d=Z.el("div","rel-item");d.textContent=PARES[a][0];
      d.addEventListener("click",function(){
        if(d.classList.contains("feito"))return;
        var prev=ca.querySelector(".sel");if(prev)prev.classList.remove("sel");
        d.classList.add("sel");selA=a;
      });
      ca.appendChild(d);
    })(a);
  }
  for(var b=0;b<ordemB.length;b++){
    (function(b){
      var idx=ordemB[b];
      var d=Z.el("div","rel-item");d.textContent=PARES[idx][1];
      elsB[idx]=d;
      d.addEventListener("click",function(){
        if(d.classList.contains("feito"))return;
        if(selA==null){Z.toast("Escolha primeiro um item da esquerda");return;}
        if(selA===idx){
          pts++;Z.snd(true);
          d.classList.add("feito");
          ca.children[selA].classList.add("feito");
          document.getElementById("pts").textContent=pts;
          selA=null;
          if(pts===PARES.length){
            var fb=document.getElementById("fb");
            fb.textContent=err===0?"Perfeito, sem nenhum erro!":"Concluído com "+err+" erro(s). Toque em atualizar para jogar de novo.";
            fb.className="ok center mt";
          }
        }else{
          err++;Z.snd(false);
          document.getElementById("err").textContent=err;
          Z.toast("Não combinam. Tente de novo.");
        }
      });
      cb.appendChild(d);
    })(b);
  }
})();
`;
  return wrapEstudo({ titulo: nome, sub, body, js, css });
}

/* ── CAÇA-ERROS (ache o erro) ───────────────────────────── */
export function cacaErros({ nome, sub, itens, chave }) {
  const body = `
<div class="row between wrap mb">
  <p class="dim" id="prog" style="font-size:13px"></p>
  <p class="dim" style="font-size:13px">Acertos: <b class="ok" id="pts">0</b> · Erros: <b class="bad" id="err">0</b></p>
</div>
<div class="zcard pad" id="carta">
  <p class="dim mb" id="enun" style="font-size:13.5px"></p>
  <div class="row wrap" id="chips" style="gap:8px"></div>
</div>
<div class="zcard pad mt" id="expl" style="display:none;border-color:var(--z-acc)"></div>
<div class="row center mt"><button class="zbtn sm" id="prox" type="button" style="display:none">Próxima</button></div>`;
  const css = `
.caca-chip{background:var(--z-surface2);border:1px solid var(--z-line2);border-radius:10px;padding:10px 14px;font-size:15px;cursor:pointer;font-family:var(--z-fb)}
.caca-chip:hover{border-color:var(--z-acc)}
.caca-chip.certo{border-color:#10b981;background:rgba(16,185,129,.12)}
.caca-chip.errado{border-color:#f43f5e;background:rgba(244,63,94,.1)}
.caca-chip.travado{pointer-events:none}`;
  const js = `
(function(){
  var IT=${JSON.stringify(itens)};
  var ordem=Z.shuffle(IT.map(function(_,k){return k}));
  var i=0,pts=0,err=0,travou=false;
  function render(){
    travou=false;
    document.getElementById("prog").textContent="Questão "+(i+1)+" de "+ordem.length;
    document.getElementById("pts").textContent=pts;
    document.getElementById("err").textContent=err;
    document.getElementById("expl").style.display="none";
    document.getElementById("prox").style.display="none";
    var it=IT[ordem[i]];
    document.getElementById("enun").textContent=it.enun;
    var box=document.getElementById("chips");box.innerHTML="";
    for(var k=0;k<it.partes.length;k++){
      (function(k){
        var b=Z.el("button","caca-chip");b.type="button";b.textContent=it.partes[k];
        b.addEventListener("click",function(){clica(k,b);});
        box.appendChild(b);
      })(k);
    }
  }
  function clica(k,el){
    if(travou)return;
    var it=IT[ordem[i]];
    if(k===it.erro){
      travou=true;pts++;Z.snd(true);
      el.classList.add("certo");
      var box=document.getElementById("chips");
      for(var j=0;j<box.children.length;j++)box.children[j].classList.add("travado");
      document.getElementById("pts").textContent=pts;
      var ex=document.getElementById("expl");
      ex.innerHTML="<b class='ok'>Você achou!</b><br><span class='dim'>"+it.expl+"</span>";
      ex.style.display="block";
      var p=document.getElementById("prox");
      p.textContent=(i+1>=ordem.length)?"Ver resultado":"Próxima";
      p.style.display="inline-block";
    }else{
      err++;Z.snd(false);el.classList.add("errado","travado");
      document.getElementById("err").textContent=err;
      Z.toast("Esse está certo. Continue procurando!");
    }
  }
  document.getElementById("prox").addEventListener("click",function(){
    i++;
    if(i>=ordem.length){
      document.getElementById("carta").innerHTML="<b style='font-size:20px'>"+(err===0?"Caçador perfeito!":"Fim do desafio.")+"</b><br><span class='dim'>"+pts+" acertos · "+err+" erros</span>";
      document.getElementById("expl").style.display="none";
      this.style.display="none";
    }else render();
  });
  render();
})();
`;
  return wrapEstudo({ titulo: nome, sub, body, js, css });
}

/* ── CRUZADAS (palavras cruzadas fixas) ─────────────────── */
export function cruzadas({ nome, sub, grade, dicasH, dicasV, chave }) {
  const body = `
<div class="row wrap" style="gap:18px;align-items:flex-start;justify-content:center">
  <div class="xz-grade" id="grade"></div>
  <div class="xz-dicas">
    <h3>Horizontais</h3><ol id="dh"></ol>
    <h3>Verticais</h3><ol id="dv"></ol>
  </div>
</div>
<div class="row center mt wrap">
  <button class="zbtn sm" id="ok" type="button">Verificar</button>
  <button class="zbtn ghost sm" id="revela" type="button">Revelar letra</button>
  <button class="zbtn ghost sm" id="limpa" type="button">Limpar</button>
</div>
<p class="center mt" id="fb" style="min-height:26px;font-size:15px"></p>`;
  const css = `
.xz-grade{display:grid;gap:3px}
.xz-cel{width:44px;height:44px;text-align:center;font-family:var(--z-fm);font-size:20px;font-weight:700;text-transform:uppercase;background:var(--z-surface2);border:1px solid var(--z-line2);border-radius:8px;color:var(--z-text);caret-color:var(--z-acc)}
.xz-cel:focus{outline:2px solid var(--z-acc)}
.xz-cel.bloq{background:transparent;border-color:transparent;pointer-events:none}
.xz-cel.ok{border-color:#10b981;color:#10b981}
.xz-cel.mau{border-color:#f43f5e;color:#f43f5e}
.xz-dicas{max-width:280px;font-size:14px}
.xz-dicas h3{font-size:12px;font-family:var(--z-fm);letter-spacing:.14em;text-transform:uppercase;color:var(--z-acc);margin:6px 0}
.xz-dicas ol{margin:0 0 10px 20px;color:var(--z-muted)}
.xz-dicas li{margin-bottom:4px}`;
  const js = `
(function(){
  var GRADE=${JSON.stringify(grade)};
  var R=GRADE.length,C=GRADE[0].length;
  var box=document.getElementById("grade");
  box.style.gridTemplateColumns="repeat("+C+",44px)";
  var cels=[];
  function norm(s){return String(s||"").toUpperCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"");}
  for(var r=0;r<R;r++){
    cels.push([]);
    for(var c=0;c<C;c++){
      (function(r,c){
        var ch=GRADE[r][c];
        if(ch==="."){var v=Z.el("div","xz-cel bloq");box.appendChild(v);cels[r].push(null);return;}
        var inp=document.createElement("input");
        inp.className="xz-cel";inp.maxLength=1;inp.autocomplete="off";inp.dataset.r=r;inp.dataset.c=c;
        inp.addEventListener("input",function(){
          this.value=norm(this.value).replace(/[^A-Z]/g,"").slice(0,1);
          this.classList.remove("ok","mau");
        });
        inp.addEventListener("keydown",function(e){
          var rr=+this.dataset.r,cc=+this.dataset.c;
          var tr=rr,tc=cc;
          if(e.key==="ArrowUp")tr--;else if(e.key==="ArrowDown")tr++;
          else if(e.key==="ArrowLeft")tc--;else if(e.key==="ArrowRight")tc++;
          else return;
          e.preventDefault();
          if(tr>=0&&tr<R&&tc>=0&&tc<C&&cels[tr][tc])cels[tr][tc].focus();
        });
        box.appendChild(inp);cels[r].push(inp);
      })(r,c);
    }
  }
  function dicas(id,lista){
    var ol=document.getElementById(id);
    for(var i=0;i<lista.length;i++){var li=Z.el("li");li.textContent=lista[i];ol.appendChild(li);}
  }
  dicas("dh",${JSON.stringify(dicasH)});
  dicas("dv",${JSON.stringify(dicasV)});
  document.getElementById("ok").addEventListener("click",function(){
    var tot=0,ok=0;
    for(var r=0;r<R;r++)for(var c=0;c<C;c++){
      var inp=cels[r][c];if(!inp)continue;
      tot++;
      var certo=norm(inp.value)===norm(GRADE[r][c]);
      if(certo)ok++;
      inp.classList.remove("ok","mau");
      inp.classList.add(certo?"ok":"mau");
    }
    var fb=document.getElementById("fb");
    if(ok===tot){fb.textContent="Cruzada completa. Parabéns!";fb.className="ok center mt";Z.snd(true);}
    else{fb.textContent=ok+" de "+tot+" letras certas. Continue!";fb.className="bad center mt";Z.snd(false);}
  });
  document.getElementById("revela").addEventListener("click",function(){
    var vazias=[];
    for(var r=0;r<R;r++)for(var c=0;c<C;c++){
      var inp=cels[r][c];
      if(inp&&norm(inp.value)!==norm(GRADE[r][c]))vazias.push(inp);
    }
    if(!vazias.length)return;
    var um=Z.pick(vazias);
    var rr=+um.dataset.r,cc=+um.dataset.c;
    um.value=norm(GRADE[rr][cc]);um.classList.remove("mau");
  });
  document.getElementById("limpa").addEventListener("click",function(){
    for(var r=0;r<R;r++)for(var c=0;c<C;c++){
      var inp=cels[r][c];
      if(inp){inp.value="";inp.classList.remove("ok","mau");}
    }
    document.getElementById("fb").textContent="";
  });
})();
`;
  return wrapEstudo({ titulo: nome, sub, body, js, css });
}

/* ── PASSO A PASSO (método + treino) ────────────────────── */
export function passoAPasso({ nome, sub, metodo, treino, chave }) {
  const body = `
<div class="zcard pad mb" id="metodo">
  <h3>Como resolver</h3>
  <div class="guia-corpo" id="passos"></div>
</div>
<h3 class="mb">Agora é sua vez</h3>
<div class="row between wrap mb">
  <p class="dim" id="prog" style="font-size:13px"></p>
  <p class="dim" style="font-size:13px">Acertos: <b class="ok" id="pts">0</b></p>
</div>
<div class="zcard pad center" style="font-size:19px" id="carta"></div>
<p class="dim center mt" id="fb" style="min-height:22px;font-size:14px"></p>
<div class="row center mt wrap" id="botoes">
  <input class="zinput" id="resp" placeholder="Resposta" autocomplete="off" inputmode="decimal" style="max-width:160px">
  <button class="zbtn sm" id="ok" type="button">Confirmar</button>
</div>`;
  const css = `
.guia-corpo{margin-top:10px;font-size:15px;line-height:1.7}
.guia-corpo ol{margin:0 0 6px 20px}
.guia-corpo li{margin-bottom:8px}
.guia-corpo b{color:var(--z-brand-hi)}
.guia-corpo code{font-family:var(--z-fm);font-size:13px;background:rgba(255,255,255,.07);padding:1px 6px;border-radius:6px}`;
  const js = `
(function(){
  var PASSOS=${JSON.stringify(metodo)};
  var TREINO=${JSON.stringify(treino)};
  var box=document.getElementById("passos");
  var ol=document.createElement("ol");
  for(var k=0;k<PASSOS.length;k++){var li=document.createElement("li");li.innerHTML=PASSOS[k];ol.appendChild(li);}
  box.appendChild(ol);
  var ordem=Z.shuffle(TREINO.map(function(_,k){return k}));
  var i=0,pts=0;
  function render(){
    document.getElementById("prog").textContent="Exercício "+(i+1)+" de "+ordem.length;
    document.getElementById("pts").textContent=pts;
    var t=TREINO[ordem[i]];
    var carta=document.getElementById("carta");carta.innerHTML="";
    var p=document.createElement("p");p.textContent=t.q;carta.appendChild(p);
    if(t.dica){var d=document.createElement("p");d.className="dim";d.style.fontSize="13px";d.textContent="Dica: "+t.dica;carta.appendChild(d);}
    document.getElementById("fb").textContent="";
    var r=document.getElementById("resp");r.value="";r.focus();
  }
  function norm(s){return String(s||"").trim().replace(",",".").replace(/\\s+/g,"").toLowerCase();}
  function confere(){
    var t=TREINO[ordem[i]];
    var v=norm(document.getElementById("resp").value);
    var fb=document.getElementById("fb");
    var ok=t.alts.some(function(a){return norm(a)===v});
    if(ok){
      pts++;Z.snd(true);Z.toast("Correto!");
      i++;
      if(i>=ordem.length){
        document.getElementById("carta").innerHTML="<b style='font-size:20px'>Método dominado!</b><br><span class='dim'>"+pts+" de "+ordem.length+" exercícios</span>";
        document.getElementById("botoes").innerHTML="<button class='zbtn sm' id='re' type='button'>Treinar de novo</button>";
        document.getElementById("re").addEventListener("click",function(){location.reload();});
      }else render();
    }else{
      Z.snd(false);fb.textContent="Revise os passos acima e tente de novo.";fb.className="bad center mt";
    }
  }
  document.getElementById("ok").addEventListener("click",confere);
  document.getElementById("resp").addEventListener("keydown",function(e){if(e.key==="Enter")confere();});
  render();
})();
`;
  return wrapEstudo({ titulo: nome, sub, body, js, css });
}
