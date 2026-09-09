/* Zcode — engines de Úteis IV: ferramentas profissionais */

function hero(nome, sub) {
  return `<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>`;
}
function moeda(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ── AMORTIZAÇÃO (PRICE × SAC) ──────────────────────────── */
export function amortizacao({ nome, sub }) {
  const body = `
${hero(nome, sub)}
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <div class="zgrid zg3 mb">
    <div><span class="zlabel">Valor financiado (R$)</span><input class="zinput" id="valor" type="number" min="1" step="any" value="300000"></div>
    <div><span class="zlabel">Taxa (% ao mês)</span><input class="zinput" id="taxa" type="number" min="0" step="any" value="0.8"></div>
    <div><span class="zlabel">Parcelas (meses)</span><input class="zinput" id="meses" type="number" min="1" max="420" step="1" value="360"></div>
  </div>
  <div class="row mb wrap">
    <button class="zbtn sm" id="calc" type="button">Simular</button>
    <span class="dim" style="font-size:12.5px">Compara PRICE (parcela fixa) × SAC (amortização fixa).</span>
  </div>
  <div id="resumo"></div>
</div>
<div class="zcard pad mt" id="cardTab" style="display:none;max-width:640px;margin-left:auto;margin-right:auto">
  <div class="row between wrap mb">
    <h3>Tabela de amortização</h3>
    <select class="zselect" id="sistema" style="max-width:200px">
      <option value="price">PRICE</option>
      <option value="sac">SAC</option>
    </select>
  </div>
  <div style="max-height:320px;overflow:auto">
    <table class="ztable" id="tab"></table>
  </div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function fmt(n){return n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
  var last=null;
  function simula(){
    var V=parseFloat($id("valor").value),i=parseFloat($id("taxa").value)/100,n=parseInt($id("meses").value,10);
    if(!(V>0)||isNaN(i)||i<0||!(n>0)){$id("resumo").innerHTML="<p class='bad'>Confira os valores digitados.</p>";return;}
    var tab={price:[],sac:[]},tot={price:0,sac:0},jur={price:0,sac:0};
    var p=0;
    if(i===0){p=V/n;}
    else{var f=Math.pow(1+i,n);p=V*i*f/(f-1);}
    var sd=V;
    for(var m=1;m<=n;m++){
      var j=sd*i,a=p-j;if(m===n){a=sd;p=sd+j;}
      sd-=a;tot.price+=p;jur.price+=j;
      tab.price.push([m,p,j,a,Math.max(sd,0)]);
    }
    var am=V/n;sd=V;
    for(var s2=1;s2<=n;s2++){
      var j2=sd*i,p2=am+j2;sd-=am;tot.sac+=p2;jur.sac+=j2;
      tab.sac.push([s2,p2,j2,am,Math.max(sd,0)]);
    }
    last={tab:tab,tot:tot,jur:jur};
    var econ=tot.price-tot.sac;
    $id("resumo").innerHTML=
      "<div class='zgrid zg2'>"+
      "<div class='zcard center' style='background:var(--z-bg2)'><p class='zlabel'>PRICE — 1ª parcela</p><p class='acc fd' style='font-size:21px'>"+fmt(tab.price[0][1])+"</p><p class='dim' style='font-size:12px'>Total: "+fmt(tot.price)+"<br>Juros: "+fmt(jur.price)+"</p></div>"+
      "<div class='zcard center' style='background:var(--z-bg2)'><p class='zlabel'>SAC — 1ª parcela</p><p class='acc fd' style='font-size:21px'>"+fmt(tab.sac[0][1])+"</p><p class='dim' style='font-size:12px'>Total: "+fmt(tot.sac)+"<br>Juros: "+fmt(jur.sac)+"</p></div>"+
      "</div><p class='center dim mt' style='font-size:13px'>O SAC economiza <b class='ok'>"+fmt(econ)+"</b> em juros, mas começa com parcelas maiores.</p>";
    $id("cardTab").style.display="block";
    renderTab();
  }
  function renderTab(){
    if(!last)return;
    var s=$id("sistema").value,t=last.tab[s];
    var h="<tr><th>Mês</th><th>Parcela</th><th>Juros</th><th>Amortização</th><th>Saldo</th></tr>";
    for(var k=0;k<t.length;k++){
      h+="<tr><td>"+t[k][0]+"</td><td>"+fmt(t[k][1])+"</td><td>"+fmt(t[k][2])+"</td><td>"+fmt(t[k][3])+"</td><td>"+fmt(t[k][4])+"</td></tr>";
    }
    $id("tab").innerHTML=h;
  }
  $id("calc").addEventListener("click",simula);
  $id("sistema").addEventListener("change",renderTab);
  simula();
})();
`;
  return { body, js };
}

/* ── INVESTIMENTO (aportes + juros compostos) ───────────── */
export function investimento({ nome, sub, modo }) {
  const isApos = modo === "aposentadoria";
  const body = `
${hero(nome, sub)}
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <div class="zgrid ${isApos ? "zg3" : "zg2"} mb">
    ${isApos ? `<div><span class="zlabel">Sua idade</span><input class="zinput" id="idade" type="number" min="10" max="100" value="30"></div>
    <div><span class="zlabel">Aposentar aos</span><input class="zinput" id="alvo" type="number" min="11" max="110" value="60"></div>
    <div><span class="zlabel">Rentab. (% ao ano)</span><input class="zinput" id="taxa" type="number" step="any" value="10"></div>
    <div><span class="zlabel">Aporte mensal (R$)</span><input class="zinput" id="aporte" type="number" min="0" step="any" value="1000"></div>
    <div><span class="zlabel">Já guardado (R$)</span><input class="zinput" id="inicial" type="number" min="0" step="any" value="10000"></div>
    <div><span class="zlabel">Renda pós (a.m. %)</span><input class="zinput" id="renda" type="number" step="any" value="0.6"></div>`
    : `<div><span class="zlabel">Valor inicial (R$)</span><input class="zinput" id="inicial" type="number" min="0" step="any" value="5000"></div>
    <div><span class="zlabel">Aporte mensal (R$)</span><input class="zinput" id="aporte" type="number" min="0" step="any" value="500"></div>
    <div><span class="zlabel">Taxa (% ao mês)</span><input class="zinput" id="taxa" type="number" step="any" value="0.8"></div>
    <div><span class="zlabel">Período (meses)</span><input class="zinput" id="meses" type="number" min="1" max="1200" value="120"></div>`}
  </div>
  <div class="row mb"><button class="zbtn sm" id="calc" type="button">Simular</button></div>
  <div id="saida"></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function fmt(n){return n.toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0})}
  var APOS=${isApos ? "true" : "false"};
  function simula(){
    var inicial=parseFloat($id("inicial").value)||0,aporte=parseFloat($id("aporte").value)||0;
    var meses,taxa;
    if(APOS){
      var id=parseInt($id("idade").value,10),al=parseInt($id("alvo").value,10);
      if(!(al>id)){$id("saida").innerHTML="<p class='bad'>A idade de aposentadoria deve ser maior que a atual.</p>";return;}
      meses=(al-id)*12;
      taxa=Math.pow(1+(parseFloat($id("taxa").value)||0)/100,1/12)-1;
    }else{
      meses=parseInt($id("meses").value,10);
      taxa=(parseFloat($id("taxa").value)||0)/100;
      if(!(meses>0)){$id("saida").innerHTML="<p class='bad'>Confira o período.</p>";return;}
    }
    var saldo=inicial,investido=inicial,porAno=[],maxV=1;
    for(var m=1;m<=meses;m++){
      saldo=saldo*(1+taxa)+aporte;investido+=aporte;
      if(m%12===0||m===meses){porAno.push(saldo);if(saldo>maxV)maxV=saldo;}
    }
    var juros=saldo-investido;
    var barras="";
    var passo=Math.ceil(porAno.length/20);
    for(var a=0;a<porAno.length;a+=passo){
      var h=Math.max(4,Math.round(porAno[a]/maxV*110));
      barras+="<div style='flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:2px'><div style='width:100%;max-width:26px;height:"+h+"px;background:linear-gradient(180deg,var(--z-acc),var(--z-brand));border-radius:4px 4px 0 0' title='Ano "+(a*passo+passo)+"'></div></div>";
    }
    var html="<div class='zgrid zg3 mb'>"+
      "<div class='zcard center' style='background:var(--z-bg2)'><p class='zlabel'>Montante</p><p class='acc fd' style='font-size:20px'>"+fmt(saldo)+"</p></div>"+
      "<div class='zcard center' style='background:var(--z-bg2)'><p class='zlabel'>Investido</p><p class='fd' style='font-size:20px'>"+fmt(investido)+"</p></div>"+
      "<div class='zcard center' style='background:var(--z-bg2)'><p class='zlabel'>Juros</p><p class='ok fd' style='font-size:20px'>"+fmt(juros)+"</p></div></div>"+
      "<p class='zlabel'>Evolução por ano</p><div class='row' style='align-items:flex-end;height:120px;gap:3px'>"+barras+"</div>";
    if(APOS){
      var r=(parseFloat($id("renda").value)||0)/100;
      html+="<p class='center mt'>Renda mensal estimada com "+($id("renda").value)+"% a.m.: <b class='ok fd' style='font-size:19px'>"+fmt(saldo*r)+"/mês</b></p>";
    }
    html+="<p class='center dim mt' style='font-size:12px'>Simulação sem impostos, taxas ou inflação. Rentabilidade passada não garante resultados.</p>";
    $id("saida").innerHTML=html;
  }
  $id("calc").addEventListener("click",simula);
  simula();
})();
`;
  return { body, js };
}

/* ── KANBAN ─────────────────────────────────────────────── */
export function kanban({ nome, sub }) {
  const body = `
${hero(nome, sub)}
<div class="row mb wrap" style="max-width:720px;margin-left:auto;margin-right:auto">
  <input class="zinput grow" id="nova" placeholder="Nova tarefa… (Enter adiciona)" autocomplete="off" style="min-width:200px">
  <button class="zbtn sm" id="add" type="button">Adicionar</button>
</div>
<div class="kb-grid" id="quadro"></div>
<p class="center dim mt" style="font-size:12.5px">Tudo salvo no navegador. Use ← → para mover os cartões.</p>`;
  const css = `
.kb-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:860px;margin:0 auto}
@media(max-width:640px){.kb-grid{grid-template-columns:1fr}}
.kb-col{background:var(--z-surface);border:1px solid var(--z-line);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px;min-height:180px}
.kb-col h3{font-family:var(--z-fm);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--z-muted);display:flex;justify-content:space-between}
.kb-card{background:var(--z-surface2);border:1px solid var(--z-line2);border-radius:10px;padding:10px 12px;font-size:14px}
.kb-card .row{margin-top:8px}
.kb-btn{background:none;border:1px solid var(--z-line2);border-radius:8px;color:var(--z-muted);cursor:pointer;font-size:12px;padding:3px 10px}
.kb-btn:hover{border-color:var(--z-acc);color:var(--z-text)}
.kb-btn.del:hover{border-color:#f43f5e;color:#f43f5e}`;
  const js = `
(function(){
  var CHAVE="kanban-1";
  var COLS=["A fazer","Fazendo","Feito"];
  var dados=Z.store.get(CHAVE,null)||{cards:[],seq:1};
  function salva(){Z.store.set(CHAVE,dados);}
  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  function render(){
    var q=document.getElementById("quadro");q.innerHTML="";
    for(var c=0;c<3;c++){
      (function(c){
        var col=Z.el("div","kb-col");
        var n=dados.cards.filter(function(k){return k.col===c}).length;
        col.innerHTML="<h3>"+COLS[c]+" <span>"+n+"</span></h3>";
        var lista=dados.cards.filter(function(k){return k.col===c});
        for(var i=0;i<lista.length;i++){
          (function(card){
            var d=Z.el("div","kb-card");
            d.innerHTML="<div>"+esc(card.t)+"</div>";
            var r=Z.el("div","row");r.style.gap="6px";
            if(c>0){var b1=Z.el("button","kb-btn");b1.type="button";b1.textContent="←";b1.title="Voltar";b1.addEventListener("click",function(){card.col--;salva();render();});r.appendChild(b1);}
            if(c<2){var b2=Z.el("button","kb-btn");b2.type="button";b2.textContent="→";b2.title="Avançar";b2.addEventListener("click",function(){card.col++;salva();render();});r.appendChild(b2);}
            var del=Z.el("button","kb-btn del");del.type="button";del.textContent="Excluir";del.style.marginLeft="auto";
            del.addEventListener("click",function(){dados.cards=dados.cards.filter(function(k){return k.id!==card.id});salva();render();});
            r.appendChild(del);
            d.appendChild(r);
            col.appendChild(d);
          })(lista[i]);
        }
        q.appendChild(col);
      })(c);
    }
  }
  function add(){
    var inp=document.getElementById("nova"),v=inp.value.trim();
    if(!v)return;
    dados.cards.push({id:dados.seq++,t:v,col:0});
    inp.value="";salva();render();inp.focus();
  }
  document.getElementById("add").addEventListener("click",add);
  document.getElementById("nova").addEventListener("keydown",function(e){if(e.key==="Enter")add();});
  render();
})();
`;
  return { body, js, css };
}

/* ── CURRÍCULO ──────────────────────────────────────────── */
export function curriculo({ nome, sub }) {
  const body = `
${hero(nome, sub)}
<div class="cv-wrap">
  <div class="zcard pad">
    <h3 class="mb">Seus dados</h3>
    <span class="zlabel">Nome completo</span><input class="zinput mb" id="f-nome" placeholder="Maria Silva" autocomplete="off">
    <span class="zlabel">Cargo pretendido</span><input class="zinput mb" id="f-cargo" placeholder="Analista de Marketing" autocomplete="off">
    <div class="zgrid zg2 mb">
      <div><span class="zlabel">E-mail</span><input class="zinput" id="f-email" placeholder="maria@email.com" autocomplete="off"></div>
      <div><span class="zlabel">Telefone</span><input class="zinput" id="f-fone" placeholder="(11) 99999-9999" autocomplete="off"></div>
    </div>
    <span class="zlabel">Resumo (2–3 linhas)</span><textarea class="zinput mb" id="f-resumo" rows="3" placeholder="Profissional com 5 anos de experiência em…"></textarea>
    <span class="zlabel">Experiência (uma por linha: cargo — empresa — período)</span><textarea class="zinput mb" id="f-exp" rows="3" placeholder="Analista — Empresa X — 2021 a hoje"></textarea>
    <span class="zlabel">Formação (uma por linha)</span><textarea class="zinput mb" id="f-edu" rows="2" placeholder="Bacharel em Administração — USP — 2019"></textarea>
    <span class="zlabel">Habilidades (separadas por vírgula)</span><input class="zinput" id="f-hab" placeholder="Excel, Inglês avançado, Liderança" autocomplete="off">
  </div>
  <div>
    <div class="cv-paper" id="previa"></div>
    <div class="row center mt"><button class="zbtn sm" id="pdf" type="button">Imprimir / Salvar PDF</button></div>
  </div>
</div>`;
  const css = `
.cv-wrap{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
@media(max-width:760px){.cv-wrap{grid-template-columns:1fr}}
.cv-paper{background:#fff;color:#1a1a1a;border-radius:12px;padding:32px 30px;font-size:13.5px;line-height:1.55;box-shadow:0 8px 30px rgba(0,0,0,.35)}
.cv-paper h2{font-size:22px;margin:0;color:#0b0f0d}
.cv-paper .cargo{color:#047857;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.06em;margin:2px 0 8px}
.cv-paper .cont{font-size:12px;color:#555;border-bottom:2px solid #10b981;padding-bottom:10px;margin-bottom:12px}
.cv-paper h4{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#047857;margin:14px 0 6px}
.cv-paper ul{margin:0 0 4px 18px;padding:0}
.cv-paper li{margin-bottom:3px}
.cv-paper .hab{display:flex;flex-wrap:wrap;gap:6px}
.cv-paper .hab span{background:#ecfdf5;border:1px solid #a7f3d0;border-radius:20px;padding:2px 10px;font-size:12px}
@media print{
  .ztop,.zfoot,.zhero,.cv-wrap>.zcard,#pdf,.row.center.mt{display:none!important}
  body{background:#fff}
  .cv-wrap{display:block}
  .cv-paper{box-shadow:none;border-radius:0;padding:0}
}`;
  const js = `
(function(){
  var CHAVE="cv-1";
  var dados=Z.store.get(CHAVE,{});
  var IDS=["nome","cargo","email","fone","resumo","exp","edu","hab"];
  function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  function linhas(s){return String(s||"").split("\\n").map(function(x){return x.trim()}).filter(Boolean);}
  function render(){
    var d={};
    for(var i=0;i<IDS.length;i++)d[IDS[i]]=document.getElementById("f-"+IDS[i]).value;
    Z.store.set(CHAVE,d);
    var h="<h2>"+esc(d.nome||"Seu nome")+"</h2>";
    h+="<div class='cargo'>"+esc(d.cargo||"Cargo pretendido")+"</div>";
    h+="<div class='cont'>"+esc(d.email||"email@exemplo.com")+" · "+esc(d.fone||"(00) 00000-0000")+"</div>";
    if(d.resumo)h+="<h4>Resumo</h4><p>"+esc(d.resumo)+"</p>";
    var ex=linhas(d.exp);
    if(ex.length){h+="<h4>Experiência</h4><ul>";for(var e=0;e<ex.length;e++)h+="<li>"+esc(ex[e])+"</li>";h+="</ul>";}
    var ed=linhas(d.edu);
    if(ed.length){h+="<h4>Formação</h4><ul>";for(var f=0;f<ed.length;f++)h+="<li>"+esc(ed[f])+"</li>";h+="</ul>";}
    var hb=String(d.hab||"").split(",").map(function(x){return x.trim()}).filter(Boolean);
    if(hb.length){h+="<h4>Habilidades</h4><div class='hab'>";for(var k=0;k<hb.length;k++)h+="<span>"+esc(hb[k])+"</span>";h+="</div>";}
    document.getElementById("previa").innerHTML=h;
  }
  for(var i=0;i<IDS.length;i++){
    (function(id){
      var el=document.getElementById("f-"+id);
      if(dados[id])el.value=dados[id];
      el.addEventListener("input",render);
    })(IDS[i]);
  }
  document.getElementById("pdf").addEventListener("click",function(){window.print();});
  render();
})();
`;
  return { body, js, css };
}

/* ── IMAGEM (redimensionar / comprimir) ─────────────────── */
export function imagem({ nome, sub, modo }) {
  const isRedim = modo === "redimensionar";
  const body = `
${hero(nome, sub)}
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <span class="zlabel">Escolha a imagem</span>
  <input class="zinput mb" id="arq" type="file" accept="image/*">
  <div class="zgrid ${isRedim ? "zg3" : "zg2"} mb">
    ${isRedim ? `<div><span class="zlabel">Largura (px)</span><input class="zinput" id="larg" type="number" min="1" value="800"></div>
    <div><span class="zlabel">Altura (px)</span><input class="zinput" id="alt" type="number" min="1" value="600"></div>
    <div><span class="zlabel">Formato</span><select class="zselect" id="fmt"><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></div>`
    : `<div><span class="zlabel">Qualidade: <b id="qv">80</b>%</span><input id="qual" type="range" min="10" max="100" value="80" style="width:100%"></div>
    <div><span class="zlabel">Formato</span><select class="zselect" id="fmt"><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option><option value="image/png">PNG</option></select></div>`}
  </div>
  <div class="row mb wrap">
    <button class="zbtn sm" id="go" type="button" disabled>Processar</button>
    <a class="zbtn ghost sm" id="down" style="display:none">Baixar resultado</a>
  </div>
  <p class="dim" id="info" style="font-size:13px"></p>
  <div class="row wrap" style="gap:12px">
    <div style="flex:1;min-width:200px"><p class="zlabel">Original</p><img id="prev1" style="max-width:100%;border-radius:10px;display:none"></div>
    <div style="flex:1;min-width:200px"><p class="zlabel">Resultado</p><img id="prev2" style="max-width:100%;border-radius:10px;display:none"></div>
  </div>
  <p class="dim mt" style="font-size:12px">Tudo acontece no seu navegador — a imagem nunca sai do seu aparelho.</p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var REDIM=${isRedim ? "true" : "false"};
  var img=new Image(),temImg=false;
  function kb(n){return n>1048576?(n/1048576).toFixed(2)+" MB":Math.max(1,Math.round(n/1024))+" KB"}
  $id("arq").addEventListener("change",function(){
    var f=this.files&&this.files[0];
    if(!f)return;
    var url=URL.createObjectURL(f);
    img.onload=function(){
      temImg=true;
      $id("prev1").src=url;$id("prev1").style.display="block";
      $id("go").disabled=false;
      if(REDIM){$id("larg").value=img.naturalWidth;$id("alt").value=img.naturalHeight;}
      $id("info").textContent="Original: "+img.naturalWidth+"×"+img.naturalHeight+" · "+kb(f.size);
    };
    img.src=url;
  });
  var qEl=$id("qual");
  if(qEl)qEl.addEventListener("input",function(){$id("qv").textContent=this.value;});
  $id("go").addEventListener("click",function(){
    if(!temImg)return;
    var cv=document.createElement("canvas");
    var W,H;
    if(REDIM){W=parseInt($id("larg").value,10)||img.naturalWidth;H=parseInt($id("alt").value,10)||img.naturalHeight;}
    else{W=img.naturalWidth;H=img.naturalHeight;}
    cv.width=W;cv.height=H;
    var ctx=cv.getContext("2d");
    if(!ctx){Z.toast("Canvas indisponível");return;}
    ctx.drawImage(img,0,0,W,H);
    var tipo=$id("fmt").value;
    var qual=qEl?(parseInt(qEl.value,10)/100):0.85;
    cv.toBlob(function(blob){
      if(!blob){Z.toast("Falha ao processar");return;}
      var url=URL.createObjectURL(blob);
      $id("prev2").src=url;$id("prev2").style.display="block";
      var d=$id("down");d.style.display="inline-block";d.href=url;
      d.download="imagem-"+W+"x"+H+"."+tipo.split("/")[1];
      $id("info").textContent="Resultado: "+W+"×"+H+" · "+kb(blob.size);
    },tipo,qual);
  });
})();
`;
  return { body, js };
}

/* ── PALETA DE IMAGEM ───────────────────────────────────── */
export function paleta({ nome, sub }) {
  const body = `
${hero(nome, sub)}
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <span class="zlabel">Escolha a imagem</span>
  <input class="zinput mb" id="arq" type="file" accept="image/*">
  <div class="row wrap mb" id="cores" style="gap:8px"></div>
  <p class="dim" id="info" style="font-size:13px">As 8 cores dominantes aparecem aqui. Clique para copiar o HEX.</p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function hex(r,g,b){return "#"+[r,g,b].map(function(v){var h=Math.round(v).toString(16);return h.length<2?"0"+h:h}).join("")}
  $id("arq").addEventListener("change",function(){
    var f=this.files&&this.files[0];
    if(!f)return;
    var url=URL.createObjectURL(f);
    var img=new Image();
    img.onload=function(){
      var cv=document.createElement("canvas");
      cv.width=48;cv.height=48;
      var ctx=cv.getContext("2d");
      if(!ctx)return;
      ctx.drawImage(img,0,0,48,48);
      var px=ctx.getImageData(0,0,48,48).data;
      var mapa={};
      for(var i=0;i<px.length;i+=4){
        var r=px[i]>>5,g=px[i+1]>>5,b=px[i+2]>>5;
        var k=r+","+g+","+b;
        if(!mapa[k])mapa[k]={n:0,r:0,g:0,b:0};
        mapa[k].n++;mapa[k].r+=px[i];mapa[k].g+=px[i+1];mapa[k].b+=px[i+2];
      }
      var arr=Object.keys(mapa).map(function(k){return mapa[k]});
      arr.sort(function(a,b){return b.n-a.n});
      var box=$id("cores");box.innerHTML="";
      var top=arr.slice(0,8);
      for(var j=0;j<top.length;j++){
        (function(c){
          var h=hex(c.r/c.n,c.g/c.n,c.b/c.n);
          var d=Z.el("button","zchip");d.type="button";
          d.style.cssText="cursor:pointer;border:1px solid var(--z-line2)";
          d.innerHTML="<span style='display:inline-block;width:14px;height:14px;border-radius:4px;background:"+h+";vertical-align:-2px;margin-right:6px'></span>"+h;
          d.addEventListener("click",function(){Z.copy(h);});
          box.appendChild(d);
        })(top[j]);
      }
      $id("info").textContent=top.length+" cores extraídas. Clique para copiar.";
    };
    img.src=url;
  });
})();
`;
  return { body, js };
}

/* ── JWT ────────────────────────────────────────────────── */
export function jwt({ nome, sub }) {
  const body = `
${hero(nome, sub)}
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <span class="zlabel">Cole o token JWT</span>
  <textarea class="zinput mb mono" id="tok" rows="4" placeholder="eyJhbGciOi…" style="font-size:12px"></textarea>
  <div class="row mb"><button class="zbtn sm" id="go" type="button">Decodificar</button></div>
  <div id="saida"><p class="dim" style="font-size:13px">Header e payload aparecem aqui. A assinatura não é verificada (exigiria a chave secreta).</p></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function b64url(s){
    s=s.replace(/-/g,"+").replace(/_/g,"/");
    while(s.length%4)s+="=";
    try{return decodeURIComponent(escape(atob(s)));}catch(e){return null;}
  }
  $id("go").addEventListener("click",function(){
    var t=$id("tok").value.trim();
    var partes=t.split(".");
    if(partes.length!==3){$id("saida").innerHTML="<p class='bad'>Token inválido: um JWT tem 3 partes separadas por ponto.</p>";return;}
    var h=b64url(partes[0]),p=b64url(partes[1]);
    if(h==null||p==null){$id("saida").innerHTML="<p class='bad'>Não foi possível decodificar (Base64 inválido).</p>";return;}
    var hj,pj;
    try{hj=JSON.stringify(JSON.parse(h),null,2);pj=JSON.stringify(JSON.parse(p),null,2);}
    catch(e){$id("saida").innerHTML="<p class='bad'>Conteúdo não é JSON válido.</p>";return;}
    var extra="";
    try{
      var pay=JSON.parse(p);
      if(pay.exp){
        var agora=Math.floor(Date.now()/1000),resta=pay.exp-agora;
        var dt=new Date(pay.exp*1000).toLocaleString("pt-BR");
        extra=resta>0
          ?"<p class='ok mt' style='font-size:13px'>Expira em "+dt+" (faltam "+Math.floor(resta/3600)+"h "+Math.floor(resta%3600/60)+"min).</p>"
          :"<p class='bad mt' style='font-size:13px'>Expirado desde "+dt+".</p>";
      }
      if(pay.iat)extra+="<p class='dim' style='font-size:12.5px'>Emitido em: "+new Date(pay.iat*1000).toLocaleString("pt-BR")+"</p>";
    }catch(e){}
    $id("saida").innerHTML="<p class='zlabel'>Header</p><pre class='mono' style='background:var(--z-bg2);padding:12px;border-radius:10px;overflow:auto;font-size:12.5px'>"+Z.esc(hj)+"</pre><p class='zlabel mt'>Payload</p><pre class='mono' style='background:var(--z-bg2);padding:12px;border-radius:10px;overflow:auto;font-size:12.5px'>"+Z.esc(pj)+"</pre>"+extra;
  });
})();
`;
  return { body, js };
}

/* ── CLIENTE REST ───────────────────────────────────────── */
export function rest({ nome, sub }) {
  const body = `
${hero(nome, sub)}
<p class="dim center mb" style="font-size:12.5px;max-width:640px;margin-left:auto;margin-right:auto">Mini Postman no navegador. Alguns sites bloqueiam chamadas externas (CORS) — nesse caso o erro aparece abaixo.</p>
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <div class="row mb wrap" style="gap:8px">
    <select class="zselect" id="met" style="max-width:130px;flex:none">
      <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
    </select>
    <input class="zinput grow" id="url" placeholder="https://api.exemplo.com/dados" style="min-width:200px" autocomplete="off">
    <button class="zbtn sm" id="go" type="button" style="flex:none">Enviar</button>
  </div>
  <span class="zlabel">Cabeçalhos (um por linha: Nome: valor)</span>
  <textarea class="zinput mb mono" id="heads" rows="2" style="font-size:12.5px" placeholder="Content-Type: application/json"></textarea>
  <span class="zlabel">Corpo (para POST/PUT/PATCH)</span>
  <textarea class="zinput mb mono" id="corpo" rows="4" style="font-size:12.5px" placeholder='{"nome": "Maria"}'></textarea>
  <div id="saida"><p class="dim" style="font-size:13px">A resposta aparece aqui.</p></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  $id("go").addEventListener("click",function(){
    var url=$id("url").value.trim();
    if(!url){$id("saida").innerHTML="<p class='bad'>Digite a URL.</p>";return;}
    var heads={};
    var linhas=$id("heads").value.split("\\n");
    for(var i=0;i<linhas.length;i++){
      var ix=linhas[i].indexOf(":");
      if(ix>0)heads[linhas[i].slice(0,ix).trim()]=linhas[i].slice(ix+1).trim();
    }
    var met=$id("met").value;
    var opt={method:met,headers:heads};
    if(met!=="GET"&&$id("corpo").value.trim())opt.body=$id("corpo").value;
    $id("saida").innerHTML="<p class='dim'>Enviando…</p>";
    var t0=Date.now();
    fetch(url,opt).then(function(r){
      var ms=Date.now()-t0;
      return r.text().then(function(txt){
        var corpo=txt;
        try{corpo=JSON.stringify(JSON.parse(txt),null,2);}catch(e){}
        var classe=(r.status>=200&&r.status<300)?"ok":"bad";
        $id("saida").innerHTML="<p class='"+classe+" fd' style='font-size:16px'>"+r.status+" "+Z.esc(r.statusText||"")+" <span class='dim' style='font-size:12px'>· "+ms+" ms · "+txt.length+" caracteres</span></p><pre class='mono' style='background:var(--z-bg2);padding:12px;border-radius:10px;overflow:auto;font-size:12px;max-height:320px'>"+Z.esc(corpo.slice(0,20000))+"</pre>";
      });
    }).catch(function(e){
      $id("saida").innerHTML="<p class='bad'>Falha na requisição: "+Z.esc(e.message||e)+"</p><p class='dim' style='font-size:12.5px'>Causa comum: o servidor não permite chamadas do navegador (CORS) ou a URL está inacessível.</p>";
    });
  });
})();
`;
  return { body, js };
}

/* ── ANALISADOR DE URL ──────────────────────────────────── */
export function urlparse({ nome, sub }) {
  const body = `
${hero(nome, sub)}
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <span class="zlabel">Cole a URL</span>
  <input class="zinput mb mono" id="url" placeholder="https://loja.com/prod?id=42&cor=azul#detalhes" style="font-size:13px" autocomplete="off">
  <div id="saida"><p class="dim" style="font-size:13px">As partes da URL aparecem aqui.</p></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function lin(k,v){return "<tr><td style='white-space:nowrap'><b>"+k+"</b></td><td class='mono' style='font-size:12.5px;word-break:break-all'>"+Z.esc(v||"—")+"</td></tr>"}
  $id("url").addEventListener("input",function(){
    var s=this.value.trim();
    if(!s){$id("saida").innerHTML="<p class='dim' style='font-size:13px'>As partes da URL aparecem aqui.</p>";return;}
    var u;
    try{u=new URL(s);}
    catch(e){try{u=new URL("https://"+s);}catch(e2){$id("saida").innerHTML="<p class='bad'>URL inválida.</p>";return;}}
    var h="<table class='ztable'>"+lin("Protocolo",u.protocol)+lin("Site (host)",u.host)+lin("Domínio",u.hostname)+lin("Porta",u.port||"(padrão)")+lin("Caminho",u.pathname)+lin("Busca (query)",u.search||"—")+lin("Âncora (hash)",u.hash||"—")+"</table>";
    var params=[];
    u.searchParams.forEach(function(v,k){params.push([k,v]);});
    if(params.length){
      h+="<p class='zlabel mt'>Parâmetros ("+params.length+")</p><table class='ztable'>";
      for(var i=0;i<params.length;i++)h+="<tr><td class='mono' style='font-size:12.5px'>"+Z.esc(params[i][0])+"</td><td class='mono' style='font-size:12.5px;word-break:break-all'>"+Z.esc(params[i][1])+"</td></tr>";
      h+="</table>";
    }
    $id("saida").innerHTML=h;
  });
})();
`;
  return { body, js };
}

/* ── EXPLICADOR DE CRON ─────────────────────────────────── */
export function crontab({ nome, sub }) {
  const body = `
${hero(nome, sub)}
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <span class="zlabel">Expressão cron (min hora dia mês semana)</span>
  <input class="zinput mb mono" id="exp" value="0 9 * * 1-5" style="font-size:17px;text-align:center" autocomplete="off" spellcheck="false">
  <div class="row wrap mb" style="gap:6px">
    <button class="zbtn ghost sm pre" type="button" data-e="* * * * *">A cada minuto</button>
    <button class="zbtn ghost sm pre" type="button" data-e="0 * * * *">Toda hora</button>
    <button class="zbtn ghost sm pre" type="button" data-e="0 9 * * *">Todo dia 9h</button>
    <button class="zbtn ghost sm pre" type="button" data-e="0 9 * * 1-5">Dias úteis 9h</button>
    <button class="zbtn ghost sm pre" type="button" data-e="0 0 1 * *">Dia 1º à meia-noite</button>
    <button class="zbtn ghost sm pre" type="button" data-e="*/15 * * * *">A cada 15 min</button>
  </div>
  <div class="zcard center" style="background:var(--z-bg2)"><p class="fd" id="hum" style="font-size:18px">—</p></div>
  <div id="det" class="mt"></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var DIAS=["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
  function descreve(campo,tipo){
    if(campo==="*")return tipo==="min"?"todo minuto":tipo==="hora"?"toda hora":tipo==="dom"?"todo dia":tipo==="mes"?"todo mês":"todo dia da semana";
    var m=campo.match(/^\\*\\/(\\d+)$/);
    if(m)return "a cada "+m[1]+(tipo==="min"?" minutos":tipo==="hora"?" horas":tipo==="dom"?" dias":" meses");
    if(campo.indexOf(",")>=0||campo.indexOf("-")>=0||campo.indexOf("/")>=0){
      if(tipo==="sem"){
        var ds=campo.replace(/\\//g,",").split(/[,-]/).map(function(x){return DIAS[parseInt(x,10)]||x});
        return "nas "+ds.join(", ");
      }
      return "em "+campo;
    }
    var n=parseInt(campo,10);
    if(isNaN(n))return null;
    if(tipo==="min")return "no minuto "+n;
    if(tipo==="hora")return "às "+n+"h";
    if(tipo==="dom")return "no dia "+n;
    if(tipo==="mes")return "em "+["","janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"][n];
    if(tipo==="sem")return DIAS[n]?"na "+DIAS[n]:"dia "+n;
    return campo;
  }
  function explica(){
    var p=$id("exp").value.trim().split(/\\s+/);
    if(p.length!==5){$id("hum").textContent="Use 5 campos separados por espaço.";$id("det").innerHTML="";return;}
    var tipos=["min","hora","dom","mes","sem"],nomes=["Minuto","Hora","Dia do mês","Mês","Dia da semana"],ds=[];
    for(var i=0;i<5;i++){var d=descreve(p[i],tipos[i]);if(d==null){$id("hum").textContent="Campo "+(i+1)+" inválido: "+p[i];$id("det").innerHTML="";return;}ds.push(d);}
    var h="";
    if(p[0]==="*"&&p[1]==="*"&&p[2]==="*"&&p[3]==="*"&&p[4]==="*")h="Executa a cada minuto.";
    else if(p[2]==="*"&&p[3]==="*"&&p[4]==="*")h="Executa "+ds[1]+" "+ds[0]+", todos os dias.";
    else h="Executa "+ds[1]+" "+ds[0]+", "+ds[2]+", "+ds[3]+", "+ds[4]+".";
    h=h.charAt(0).toUpperCase()+h.slice(1);
    $id("hum").textContent=h;
    var t="<table class='ztable'>";
    for(var j=0;j<5;j++)t+="<tr><td><b>"+nomes[j]+"</b></td><td class='mono'>"+Z.esc(p[j])+"</td><td class='dim'>"+Z.esc(ds[j])+"</td></tr>";
    $id("det").innerHTML=t+"</table>";
  }
  $id("exp").addEventListener("input",explica);
  var pres=document.querySelectorAll(".pre");
  for(var i=0;i<pres.length;i++)pres[i].addEventListener("click",function(){$id("exp").value=this.dataset.e;explica();});
  explica();
})();
`;
  return { body, js };
}

/* ── QUANTO COBRAR (freelancer) ─────────────────────────── */
export function freelancer({ nome, sub }) {
  const body = `
${hero(nome, sub)}
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <div class="zgrid zg3 mb">
    <div><span class="zlabel">Salário-alvo (R$/mês)</span><input class="zinput" id="sal" type="number" min="0" step="any" value="6000"></div>
    <div><span class="zlabel">Custos (R$/mês)</span><input class="zinput" id="cus" type="number" min="0" step="any" value="800"></div>
    <div><span class="zlabel">Impostos (%)</span><input class="zinput" id="imp" type="number" min="0" max="60" step="any" value="10"></div>
    <div><span class="zlabel">Dias úteis/mês</span><input class="zinput" id="dias" type="number" min="1" max="31" value="22"></div>
    <div><span class="zlabel">Horas/dia</span><input class="zinput" id="horas" type="number" min="1" max="24" value="6"></div>
    <div><span class="zlabel">Margem lucro (%)</span><input class="zinput" id="mar" type="number" min="0" max="200" step="any" value="20"></div>
  </div>
  <div class="row mb"><button class="zbtn sm" id="calc" type="button">Calcular</button></div>
  <div id="saida"></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function fmt(n){return n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
  function calc(){
    var sal=parseFloat($id("sal").value)||0,cus=parseFloat($id("cus").value)||0;
    var imp=(parseFloat($id("imp").value)||0)/100,mar=(parseFloat($id("mar").value)||0)/100;
    var dias=parseFloat($id("dias").value)||0,horas=parseFloat($id("horas").value)||0;
    if(!(dias>0)||!(horas>0)){$id("saida").innerHTML="<p class='bad'>Confira dias e horas.</p>";return;}
    var base=sal+cus;
    var comImposto=imp>=1?base:base/(1-imp);
    var comMargem=comImposto*(1+mar);
    var porHora=comMargem/(dias*horas);
    $id("saida").innerHTML="<div class='zgrid zg3 mb'>"+
      "<div class='zcard center' style='background:var(--z-bg2)'><p class='zlabel'>Valor/hora</p><p class='acc fd' style='font-size:22px'>"+fmt(porHora)+"</p></div>"+
      "<div class='zcard center' style='background:var(--z-bg2)'><p class='zlabel'>Valor/dia</p><p class='fd' style='font-size:22px'>"+fmt(porHora*horas)+"</p></div>"+
      "<div class='zcard center' style='background:var(--z-bg2)'><p class='zlabel'>Meta mensal</p><p class='fd' style='font-size:22px'>"+fmt(comMargem)+"</p></div></div>"+
      "<table class='ztable'><tr><td>Salário-alvo + custos</td><td>"+fmt(base)+"</td></tr>"+
      "<tr><td>Com impostos ("+$id("imp").value+"%)</td><td>"+fmt(comImposto)+"</td></tr>"+
      "<tr><td>Com margem ("+$id("mar").value+"%)</td><td>"+fmt(comMargem)+"</td></tr>"+
      "<tr><td>Horas faturáveis/mês</td><td>"+(dias*horas)+"h</td></tr></table>";
  }
  $id("calc").addEventListener("click",calc);
  calc();
})();
`;
  return { body, js };
}

/* ── SORTEADOR DE TIMES ─────────────────────────────────── */
export function times({ nome, sub }) {
  const body = `
${hero(nome, sub)}
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <span class="zlabel">Participantes (um por linha)</span>
  <textarea class="zinput mb" id="nomes" rows="6" placeholder="Ana&#10;Bruno&#10;Carla&#10;Diego…"></textarea>
  <div class="row mb wrap" style="gap:8px">
    <div><span class="zlabel">Nº de times</span><input class="zinput" id="nt" type="number" min="2" max="12" value="2" style="max-width:110px"></div>
    <div style="align-self:end"><button class="zbtn sm" id="go" type="button">Sortear times</button></div>
    <div style="align-self:end"><button class="zbtn ghost sm" id="copia" type="button">Copiar resultado</button></div>
  </div>
  <div id="saida"><p class="dim" style="font-size:13px">Os times sorteados aparecem aqui.</p></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var ultimo="";
  $id("go").addEventListener("click",function(){
    var nomes=$id("nomes").value.split("\\n").map(function(s){return s.trim()}).filter(Boolean);
    var nt=parseInt($id("nt").value,10)||2;
    if(nomes.length<nt){$id("saida").innerHTML="<p class='bad'>Você precisa de pelo menos "+nt+" participantes.</p>";return;}
    var emb=Z.shuffle(nomes.slice());
    var groups=[];
    for(var i=0;i<nt;i++)groups.push([]);
    for(var j=0;j<emb.length;j++)groups[j%nt].push(emb[j]);
    var h="<div class='zgrid zg2'>",txt="";
    var cores=["#10b981","#38bdf8","#f59e0b","#f43f5e","#a78bfa","#34d399"];
    for(var g=0;g<groups.length;g++){
      var cor=cores[g%cores.length];
      h+="<div class='zcard' style='border-top:3px solid "+cor+"'><p class='zlabel'>Time "+(g+1)+" ("+groups[g].length+")</p><ul style='margin:0 0 0 18px;font-size:14.5px'>";
      txt+="Time "+(g+1)+":\\n";
      for(var k=0;k<groups[g].length;k++){h+="<li>"+Z.esc(groups[g][k])+"</li>";txt+="- "+groups[g][k]+"\\n";}
      h+="</ul></div>";txt+="\\n";
    }
    ultimo=txt;
    $id("saida").innerHTML=h+"</div>";
  });
  $id("copia").addEventListener("click",function(){
    if(!ultimo){Z.toast("Sorteie primeiro");return;}
    Z.copy(ultimo);
  });
})();
`;
  return { body, js };
}

/* ── VALIDADOR DE CNPJ ──────────────────────────────────── */
export function cnpj({ nome, sub }) {
  const body = `
${hero(nome, sub)}
<div class="zcard pad" style="max-width:520px;margin:0 auto">
  <span class="zlabel">CNPJ</span>
  <input class="zinput mb" id="doc" placeholder="00.000.000/0000-00" style="font-family:var(--z-fm);font-size:17px" maxlength="18" autocomplete="off">
  <p class="acc fd" id="status" style="font-size:17px;min-height:26px"></p>
  <p class="dim" style="font-size:12.5px">Valida os dois dígitos verificadores (módulo 11). Não consulta a Receita Federal.</p>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function dig(d,pesos){
    var s=0;
    for(var i=0;i<pesos.length;i++)s+=parseInt(d[i],10)*pesos[i];
    var r=s%11;
    return r<2?0:11-r;
  }
  $id("doc").addEventListener("input",function(){
    var d=this.value.replace(/\\D/g,"").slice(0,14);
    var out=d;
    if(d.length>2)out=d.slice(0,2)+"."+d.slice(2);
    if(d.length>5)out=out+"."+d.slice(5);
    if(d.length>8)out=out+"/"+d.slice(8);
    if(d.length>12)out=out+"-"+d.slice(12);
    this.value=out;
    var st=$id("status");
    if(d.length<14){st.textContent="";return;}
    if(/^(\\d)\\1{13}$/.test(d)){st.textContent="✕ CNPJ inválido";st.className="bad fd";return;}
    var p1=[5,4,3,2,9,8,7,6,5,4,3,2],p2=[6,5,4,3,2,9,8,7,6,5,4,3,2];
    var v1=dig(d,p1),v2=dig(d+v1,p2);
    var ok=parseInt(d[12],10)===v1&&parseInt(d[13],10)===v2;
    st.textContent=ok?"✓ CNPJ válido":"✕ CNPJ inválido";
    st.className=(ok?"ok":"bad")+" fd";
  });
})();
`;
  return { body, js };
}

/* ── EXTRATOR DE CONTATOS ───────────────────────────────── */
export function extrator({ nome, sub }) {
  const body = `
${hero(nome, sub)}
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <span class="zlabel">Cole qualquer texto</span>
  <textarea class="zinput mb" id="txt" rows="6" placeholder="Cole e-mails, telefones e links aqui…"></textarea>
  <div class="row mb"><button class="zbtn sm" id="go" type="button">Extrair</button></div>
  <div id="saida"><p class="dim" style="font-size:13px">E-mails, telefones e URLs encontrados aparecem aqui.</p></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function unicos(a){var v={},o=[];for(var i=0;i<a.length;i++)if(!v[a[i]]){v[a[i]]=1;o.push(a[i])}return o}
  function bloco(titulo,lista){
    if(!lista.length)return "";
    var h="<p class='zlabel mt'>"+titulo+" ("+lista.length+")</p><div class='col' style='gap:6px'>";
    for(var i=0;i<lista.length;i++){
      h+="<div class='row between wrap' style='gap:8px;background:var(--z-bg2);border-radius:10px;padding:8px 12px'><span class='mono' style='font-size:13px;word-break:break-all'>"+Z.esc(lista[i])+"</span><button class='zbtn ghost sm cp' type='button' data-v='"+Z.esc(lista[i])+"'>Copiar</button></div>";
    }
    return h+"</div>";
  }
  $id("go").addEventListener("click",function(){
    var t=$id("txt").value||"";
    var emails=unicos(t.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g)||[]);
    var urls=unicos(t.match(/https?:\\/\\/[^\\s<>"']+/g)||[]);
    var fones=unicos(t.match(/(?:\\+?55\\s?)?(?:\\(?\\d{2}\\)?[\\s.-]?)?\\d{4,5}[\\s.-]?\\d{4}/g)||[]).filter(function(f){return f.replace(/\\D/g,"").length>=10});
    if(!emails.length&&!urls.length&&!fones.length){$id("saida").innerHTML="<p class='bad'>Nada encontrado nesse texto.</p>";return;}
    $id("saida").innerHTML=bloco("E-mails",emails)+bloco("Telefones",fones)+bloco("URLs",urls);
    var bts=document.querySelectorAll(".cp");
    for(var i=0;i<bts.length;i++)bts[i].addEventListener("click",function(){Z.copy(this.dataset.v);});
  });
})();
`;
  return { body, js };
}

/* ── DIAS ÚTEIS ─────────────────────────────────────────── */
export function diasUteis({ nome, sub }) {
  const body = `
${hero(nome, sub)}
<div class="zcard pad" style="max-width:560px;margin:0 auto">
  <div class="zgrid zg2 mb">
    <div><span class="zlabel">Data inicial</span><input class="zinput" id="ini" type="date"></div>
    <div><span class="zlabel">Data final</span><input class="zinput" id="fim" type="date"></div>
  </div>
  <span class="zlabel">Feriados (um por linha: AAAA-MM-DD) — opcional</span>
  <textarea class="zinput mb mono" id="fer" rows="3" style="font-size:12.5px" placeholder="2026-09-07&#10;2026-10-12"></textarea>
  <div class="row mb"><button class="zbtn sm" id="calc" type="button">Contar</button></div>
  <div id="saida"><p class="dim" style="font-size:13px">O resultado aparece aqui.</p></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  function calc(){
    var a=$id("ini").value,b=$id("fim").value;
    if(!a||!b){$id("saida").innerHTML="<p class='bad'>Escolha as duas datas.</p>";return;}
    var d0=new Date(a+"T12:00:00"),d1=new Date(b+"T12:00:00");
    if(d1<d0){var t=d0;d0=d1;d1=t;}
    var fers={};
    var fl=$id("fer").value.split("\\n");
    for(var i=0;i<fl.length;i++){var f=fl[i].trim();if(/^\\d{4}-\\d{2}-\\d{2}$/.test(f))fers[f]=1;}
    var uteis=0,fds=0,ferN=0,tot=0;
    var d=new Date(d0);
    while(d<=d1){
      tot++;
      var iso=d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
      var dw=d.getDay();
      if(fers[iso])ferN++;
      else if(dw===0||dw===6)fds++;
      else uteis++;
      d.setDate(d.getDate()+1);
    }
    $id("saida").innerHTML="<div class='zgrid zg3 mb'>"+
      "<div class='zcard center' style='background:var(--z-bg2)'><p class='zlabel'>Dias úteis</p><p class='acc fd' style='font-size:24px'>"+uteis+"</p></div>"+
      "<div class='zcard center' style='background:var(--z-bg2)'><p class='zlabel'>Fins de semana</p><p class='fd' style='font-size:24px'>"+fds+"</p></div>"+
      "<div class='zcard center' style='background:var(--z-bg2)'><p class='zlabel'>Feriados</p><p class='fd' style='font-size:24px'>"+ferN+"</p></div></div>"+
      "<p class='center dim' style='font-size:13px'>Total de "+tot+" dias no período (inclusive).</p>";
  }
  $id("calc").addEventListener("click",calc);
})();
`;
  return { body, js };
}

/* ── DADOS DE TESTE ─────────────────────────────────────── */
export function fakedata({ nome, sub }) {
  const body = `
${hero(nome, sub)}
<div class="zcard pad" style="max-width:640px;margin:0 auto">
  <p class="dim mb" style="font-size:13px">Pessoas fictícias para preencher formulários e testar sistemas. E-mails usam domínios de exemplo.</p>
  <div class="row mb wrap" style="gap:8px">
    <div><span class="zlabel">Quantidade</span><input class="zinput" id="qtd" type="number" min="1" max="50" value="5" style="max-width:110px"></div>
    <div style="align-self:end"><button class="zbtn sm" id="go" type="button">Gerar</button></div>
    <div style="align-self:end"><button class="zbtn ghost sm" id="csv" type="button">Copiar CSV</button></div>
  </div>
  <div style="overflow-x:auto"><table class="ztable" id="tab"></table></div>
</div>`;
  const js = `
(function(){
  function $id(x){return document.getElementById(x)}
  var PN=["Ana","Bruno","Carla","Diego","Elisa","Felipe","Gabi","Heitor","Igor","Julia","Kaique","Larissa","Marcos","Nina","Otávio","Paula","Rafael","Sofia","Tiago","Vitória","André","Beatriz","Caio","Daniela","Eduardo","Fernanda","Gustavo","Helena"];
  var SN=["Silva","Santos","Oliveira","Souza","Costa","Pereira","Almeida","Carvalho","Ribeiro","Martins","Rocha","Barbosa","Cardoso","Teixeira","Moreira","Correia","Dias","Nunes","Vieira","Moura"];
  var CID=["São Paulo-SP","Rio de Janeiro-RJ","Belo Horizonte-MG","Curitiba-PR","Salvador-BA","Fortaleza-CE","Porto Alegre-RS","Recife-PE","Goiânia-GO","Florianópolis-SC"];
  var dados=[];
  function tira(s){return s.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/[^a-z]/g,"")}
  $id("go").addEventListener("click",function(){
    var q=Math.min(50,Math.max(1,parseInt($id("qtd").value,10)||5));
    dados=[];
    for(var i=0;i<q;i++){
      var p=Z.pick(PN),s=Z.pick(SN);
      var nome=p+" "+s;
      var nasc=String(1+Math.floor(Math.random()*28)).padStart(2,"0")+"/"+String(1+Math.floor(Math.random()*12)).padStart(2,"0")+"/"+(1960+Math.floor(Math.random()*45));
      var email=tira(p)+"."+tira(s)+Math.floor(Math.random()*90+10)+"@exemplo.com";
      var fone="("+String(11+Math.floor(Math.random()*88))+") 9"+String(10000000+Math.floor(Math.random()*89999999));
      var cid=Z.pick(CID);
      dados.push([nome,nasc,email,fone,cid]);
    }
    var h="<tr><th>Nome</th><th>Nasc.</th><th>E-mail</th><th>Telefone</th><th>Cidade</th></tr>";
    for(var j=0;j<dados.length;j++)h+="<tr><td>"+Z.esc(dados[j][0])+"</td><td>"+dados[j][1]+"</td><td class='mono' style='font-size:12px'>"+Z.esc(dados[j][2])+"</td><td class='mono' style='font-size:12px'>"+dados[j][3]+"</td><td>"+Z.esc(dados[j][4])+"</td></tr>";
    $id("tab").innerHTML=h;
  });
  $id("csv").addEventListener("click",function(){
    if(!dados.length){Z.toast("Gere os dados primeiro");return;}
    var csv="nome;nascimento;email;telefone;cidade\\n";
    for(var i=0;i<dados.length;i++)csv+=dados[i].join(";")+"\\n";
    Z.copy(csv);
  });
  $id("go").click();
})();
`;
  return { body, js };
}
