/* Zcode — engines de Jogos II: jogos completos (canvas, fases, progressão) */

function wrapGame({ titulo, sub, body, js, css }) {
  return {
    body: `
<div class="zhero"><h1>${titulo}</h1><p>${sub}</p></div>
${body}`,
    js,
    css: css || "",
  };
}

function hudFim(tituloVitoria) {
  return `
  <div class="zmodal hidden" id="fim" style="position:absolute;inset:0;border-radius:14px">
    <div class="zbox">
      <h3 id="fimTitulo">${tituloVitoria}</h3>
      <p id="fimTxt"></p>
      <button class="zbtn" id="reinicia" type="button">Jogar de novo</button>
    </div>
  </div>`;
}

/* ── TETRIS ─────────────────────────────────────────────── */
export function tetris({ nome, sub, modo }) {
  const sprint = modo === "sprint";
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="score">Pontos: 0</span>
  <span class="zchip" id="linhas">Linhas: 0${sprint ? "/40" : ""}</span>
  <span class="zchip" id="nivel">Nível: 1</span>
  <span class="zchip" id="best">Recorde: 0</span>
</div>
<div class="row wrap" style="justify-content:center;align-items:flex-start;gap:16px">
  <div style="position:relative">
    <canvas class="zc" id="cv" width="300" height="600" style="max-width:min(300px,72vw)"></canvas>
    ${hudFim("Fim de jogo")}
  </div>
  <div class="col" style="min-width:150px">
    <div class="zcard" style="padding:12px;text-align:center">
      <span class="zlabel">Próxima</span>
      <canvas id="prox" width="120" height="72" style="width:120px;border-radius:8px;background:#070b09"></canvas>
    </div>
    <div class="row wrap">
      <button class="zbtn ghost sm" id="pausa" type="button">Pausar</button>
      <button class="zbtn ghost sm" id="novo" type="button">Reiniciar</button>
    </div>
    <div class="zgrid" style="grid-template-columns:repeat(3,1fr);gap:6px;max-width:180px">
      <button class="zbtn ghost sm" data-k="l" type="button">←</button>
      <button class="zbtn ghost sm" data-k="d" type="button">↓</button>
      <button class="zbtn ghost sm" data-k="r" type="button">→</button>
      <button class="zbtn ghost sm" data-k="g" type="button" style="grid-column:span 2">Girar</button>
      <button class="zbtn ghost sm" data-k="s" type="button">↓↓</button>
    </div>
  </div>
</div>
<p class="dim center mt" style="font-size:12.5px">← → mover · ↓ descer · ↑ ou X girar · Espaço soltar · P pausar</p>`;
  const js = `
(function(){
  var cv=document.getElementById("cv");
  var ctx=cv.getContext?cv.getContext("2d"):null;
  if(!ctx){cv.outerHTML="<p class='dim center'>Seu navegador não suporta canvas.</p>";return;}
  var px=document.getElementById("prox").getContext("2d");
  var SPRINT=${sprint ? "true" : "false"};
  var COLS=10,ROWS=20,T=30;
  var PECAS=[
    {c:"#22d3ee",m:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]]},
    {c:"#fbbf24",m:[[1,1],[1,1]]},
    {c:"#a78bfa",m:[[0,1,0],[1,1,1],[0,0,0]]},
    {c:"#4ade80",m:[[0,1,1],[1,1,0],[0,0,0]]},
    {c:"#f87171",m:[[1,1,0],[0,1,1],[0,0,0]]},
    {c:"#38bdf8",m:[[1,0,0],[1,1,1],[0,0,0]]},
    {c:"#fb923c",m:[[0,0,1],[1,1,1],[0,0,0]]}
  ];
  var grade,peca,px0,py0,fila,prox,score,linhas,nivel,over,win,pausado,acc,last,best;
  var CHAVE="tetris-${modo}";
  function zera(){
    grade=[];for(var y=0;y<ROWS;y++){grade.push([]);for(var x=0;x<COLS;x++)grade[y].push(null);}
    fila=[];score=0;linhas=0;nivel=1;over=false;win=false;pausado=false;acc=0;last=performance.now();
    best=Z.store.best(CHAVE);
    document.getElementById("best").textContent="Recorde: "+best;
    document.getElementById("fim").classList.add("hidden");
    document.getElementById("pausa").textContent="Pausar";
    novaPeca();novaPeca();
    hud();requestAnimationFrame(loop);
  }
  function tiraFila(){
    if(!fila.length){fila=Z.shuffle([0,1,2,3,4,5,6]);}
    return fila.pop();
  }
  function novaPeca(){
    var id=(prox==null)?tiraFila():prox;
    prox=tiraFila();
    peca=PECAS[id];px0=3;py0=(id===0)?0:-1;
    if(colide(px0,py0,peca.m))fim(false);
  }
  function gira(m){
    var n=m.length,r=[];
    for(var y=0;y<n;y++){r.push([]);for(var x=0;x<n;x++)r[y].push(m[n-1-x][y]);}
    return r;
  }
  function colide(ox,oy,m){
    for(var y=0;y<m.length;y++)for(var x=0;x<m[y].length;x++){
      if(!m[y][x])continue;
      var gx=ox+x,gy=oy+y;
      if(gx<0||gx>=COLS||gy>=ROWS)return true;
      if(gy>=0&&grade[gy][gx])return true;
    }
    return false;
  }
  function travar(){
    var m=peca.m;
    for(var y=0;y<m.length;y++)for(var x=0;x<m[y].length;x++){
      if(m[y][x]&&py0+y>=0)grade[py0+y][px0+x]=peca.c;
    }
    var n=0;
    for(var r=ROWS-1;r>=0;r--){
      var cheia=true;
      for(var c=0;c<COLS;c++)if(!grade[r][c]){cheia=false;break;}
      if(cheia){grade.splice(r,1);grade.unshift(new Array(COLS).fill(null));n++;r++;}
    }
    if(n){
      linhas+=n;
      score+=[0,100,300,500,800][n]*nivel;
      nivel=Math.floor(linhas/10)+1;
      Z.snd(660+n*120,0.1,"square",0.04);
      if(SPRINT&&linhas>=40){win=true;fim(true);return;}
    }
    hud();novaPeca();
  }
  function passo(){if(!colide(px0,py0+1,peca.m))py0++;else travar();}
  function soltar(){var d=0;while(!colide(px0,py0+1,peca.m)){py0++;d++;}score+=d*2;travar();Z.snd(220,0.08,"sawtooth",0.04);}
  function mover(dx){if(!colide(px0+dx,py0,peca.m))px0+=dx;}
  function girar(){var g=gira(peca.m);if(!colide(px0,py0,g)){peca={c:peca.c,m:g};return;}if(!colide(px0-1,py0,g)){px0--;peca={c:peca.c,m:g};}else if(!colide(px0+1,py0,g)){px0++;peca={c:peca.c,m:g};}}
  function hud(){
    document.getElementById("score").textContent="Pontos: "+score;
    document.getElementById("linhas").textContent="Linhas: "+linhas+(SPRINT?"/40":"");
    document.getElementById("nivel").textContent="Nível: "+nivel;
  }
  function fim(venceu){
    over=true;
    if(score>best){best=score;Z.store.setBest(CHAVE,best);document.getElementById("best").textContent="Recorde: "+best;}
    Z.snd(venceu?880:140,venceu?0.3:0.35,venceu?"sine":"sawtooth",0.05);
    document.getElementById("fimTitulo").textContent=venceu?"Missão cumprida!":"Fim de jogo";
    document.getElementById("fimTxt").innerHTML="Pontuação: <b class='acc'>"+score+"</b> · Linhas: <b class='acc'>"+linhas+"</b>";
    document.getElementById("fim").classList.remove("hidden");
  }
  function bloco(g,x,y,tam,cor,fantasma){
    g.fillStyle=fantasma?"rgba(255,255,255,0.10)":cor;
    g.beginPath();g.roundRect(x+1,y+1,tam-2,tam-2,4);g.fill();
    if(!fantasma){g.fillStyle="rgba(255,255,255,0.28)";g.fillRect(x+4,y+3,tam-8,3);}
  }
  function desenha(){
    ctx.fillStyle="#070b09";ctx.fillRect(0,0,300,600);
    ctx.strokeStyle="rgba(255,255,255,0.05)";ctx.lineWidth=1;
    for(var gx=0;gx<=COLS;gx++){ctx.beginPath();ctx.moveTo(gx*T,0);ctx.lineTo(gx*T,600);ctx.stroke();}
    for(var gy=0;gy<=ROWS;gy++){ctx.beginPath();ctx.moveTo(0,gy*T);ctx.lineTo(300,gy*T);ctx.stroke();}
    for(var y=0;y<ROWS;y++)for(var x=0;x<COLS;x++)if(grade[y][x])bloco(ctx,x*T,y*T,T,grade[y][x]);
    if(peca&&!over){
      var m=peca.m,dy=0;
      while(!colide(px0,py0+dy+1,m))dy++;
      for(var j=0;j<m.length;j++)for(var i=0;i<m[j].length;i++){
        if(m[j][i]){
          if(dy>0&&(py0+dy+j)>=0)bloco(ctx,(px0+i)*T,(py0+dy+j)*T,T,null,true);
          if(py0+j>=0)bloco(ctx,(px0+i)*T,(py0+j)*T,T,peca.c);
        }
      }
    }
    px.fillStyle="#070b09";px.fillRect(0,0,120,72);
    var pm=PECAS[prox].m;
    for(var q=0;q<pm.length;q++)for(var w=0;w<pm[q].length;w++)
      if(pm[q][w])bloco(px,30+w*18,8+q*18,18,PECAS[prox].c);
    if(pausado){ctx.fillStyle="rgba(0,0,0,0.6)";ctx.fillRect(0,0,300,600);ctx.fillStyle="#edf2ef";ctx.font="700 22px Sora,sans-serif";ctx.textAlign="center";ctx.fillText("PAUSADO",150,300);}
  }
  function loop(ts){
    if(over)return;
    if(!pausado){
      acc+=ts-last;
      var grav=Math.max(60,(SPRINT?420:700)-(nivel-1)*60);
      while(acc>=grav){acc-=grav;passo();if(over)return;}
      desenha();
    }
    last=ts;requestAnimationFrame(loop);
  }
  function acao(k){
    if(over||pausado)return;
    if(k==="l")mover(-1);else if(k==="r")mover(1);
    else if(k==="d")passo();else if(k==="g")girar();else if(k==="s")soltar();
    desenha();
  }
  Z.onKey({ArrowLeft:function(){acao("l")},ArrowRight:function(){acao("r")},ArrowDown:function(){acao("d")},
    ArrowUp:function(){acao("g")},x:function(){acao("g")}," ":function(){acao("s")},
    p:function(){pausado=!pausado;document.getElementById("pausa").textContent=pausado?"Continuar":"Pausar";if(!pausado)last=performance.now();desenha();}});
  var btns=document.querySelectorAll("[data-k]");
  for(var b=0;b<btns.length;b++)(function(el){el.addEventListener("click",function(){acao(el.getAttribute("data-k"))});})(btns[b]);
  document.getElementById("pausa").addEventListener("click",function(){pausado=!pausado;this.textContent=pausado?"Continuar":"Pausar";if(!pausado)last=performance.now();desenha();});
  document.getElementById("novo").addEventListener("click",zera);
  document.getElementById("reinicia").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── QUEBRA-BLOCOS (breakout) ───────────────────────────── */
export function breakout({ nome, sub, turbo }) {
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="score">Pontos: 0</span>
  <span class="zchip" id="fase">Fase: 1</span>
  <span class="zchip" id="vidas">Vidas: 3</span>
  <span class="zchip" id="best">Recorde: 0</span>
</div>
<div style="position:relative;max-width:440px;margin:0 auto">
  <canvas class="zc" id="cv" width="420" height="520"></canvas>
  ${hudFim("Fim de jogo")}
</div>
<p class="dim center mt" style="font-size:12.5px">Mouse, toque ou ← → para mover a base · Espaço para lançar</p>`;
  const js = `
(function(){
  var cv=document.getElementById("cv");
  var ctx=cv.getContext?cv.getContext("2d"):null;
  if(!ctx){cv.outerHTML="<p class='dim center'>Seu navegador não suporta canvas.</p>";return;}
  var TURBO=${turbo ? "true" : "false"};
  var W=420,H=520,FASES=TURBO?8:5;
  var CORES=["#38bdf8","#4ade80","#fbbf24","#fb923c","#f87171","#a78bfa"];
  var base,bola,tijolos,parts,score,fase,vidas,over,win,preso,best,last;
  var CHAVE="breakout-${turbo ? "turbo" : "normal"}";
  function zera(){
    score=0;fase=1;vidas=3;over=false;win=false;
    best=Z.store.best(CHAVE);
    document.getElementById("best").textContent="Recorde: "+best;
    document.getElementById("fim").classList.add("hidden");
    base={x:W/2,w:TURBO?62:76,h:12,y:H-34};
    montaFase();prende();
    hud();last=performance.now();requestAnimationFrame(loop);
  }
  function prende(){preso=true;bola={x:base.x,y:base.y-8,vx:0,vy:0,r:6};}
  function lancar(){
    if(!preso||over)return;preso=false;
    var v=TURBO?5.6:4.4,a=-Math.PI/2+(Math.random()*0.7-0.35);
    bola.vx=Math.cos(a)*v;bola.vy=Math.sin(a)*v;
  }
  function montaFase(){
    tijolos=[];
    var fileiras=Math.min(4+fase,8),cols=8,mw=(W-40)/cols;
    for(var r=0;r<fileiras;r++)for(var c=0;c<cols;c++){
      if((r*7+c*3+fase)%11===0)continue;
      tijolos.push({x:20+c*mw,y:52+r*24,w:mw-5,h:19,hp:((r+fase)%3===0)?2:1,cor:CORES[(r+fase)%CORES.length]});
    }
  }
  function hud(){
    document.getElementById("score").textContent="Pontos: "+score;
    document.getElementById("fase").textContent="Fase: "+fase+"/"+FASES;
    document.getElementById("vidas").textContent="Vidas: "+vidas;
  }
  function fim(venceu){
    over=true;
    if(score>best){best=score;Z.store.setBest(CHAVE,best);document.getElementById("best").textContent="Recorde: "+best;}
    Z.snd(venceu?880:140,0.3,venceu?"sine":"sawtooth",0.05);
    document.getElementById("fimTitulo").textContent=venceu?"Você venceu!":"Fim de jogo";
    document.getElementById("fimTxt").innerHTML="Pontuação: <b class='acc'>"+score+"</b> · Fase <b class='acc'>"+fase+"</b>";
    document.getElementById("fim").classList.remove("hidden");
  }
  function passo(){
    if(preso){bola.x=base.x;bola.y=base.y-8;return;}
    bola.x+=bola.vx;bola.y+=bola.vy;
    if(bola.x<bola.r+6){bola.x=bola.r+6;bola.vx*=-1;Z.snd(300,0.04,"square",0.02);}
    if(bola.x>W-bola.r-6){bola.x=W-bola.r-6;bola.vx*=-1;Z.snd(300,0.04,"square",0.02);}
    if(bola.y<bola.r+6){bola.y=bola.r+6;bola.vy*=-1;Z.snd(300,0.04,"square",0.02);}
    if(bola.vy>0&&bola.y+bola.r>=base.y&&bola.y+bola.r<=base.y+base.h+8&&Math.abs(bola.x-base.x)<=base.w/2+bola.r){
      var rel=(bola.x-base.x)/(base.w/2),v=Math.hypot(bola.vx,bola.vy)*1.005;
      var a=-Math.PI/2+rel*1.1;
      bola.vx=Math.cos(a)*v;bola.vy=Math.sin(a)*v;bola.y=base.y-bola.r-1;
      Z.snd(500,0.05,"sine",0.04);
    }
    for(var i=tijolos.length-1;i>=0;i--){
      var t=tijolos[i];
      if(bola.x+bola.r>t.x&&bola.x-bola.r<t.x+t.w&&bola.y+bola.r>t.y&&bola.y-bola.r<t.y+t.h){
        var dx=Math.min(bola.x+bola.r-t.x,t.x+t.w-(bola.x-bola.r));
        var dy=Math.min(bola.y+bola.r-t.y,t.y+t.h-(bola.y-bola.r));
        if(dx<dy)bola.vx*=-1;else bola.vy*=-1;
        t.hp--;
        if(t.hp<=0){tijolos.splice(i,1);score+=50;Z.snd(760,0.06,"square",0.035);}
        else{score+=10;Z.snd(440,0.05,"square",0.03);}
        estoura(bola.x,bola.y,t.cor);
        hud();break;
      }
    }
    if(!tijolos.length){
      score+=200*fase;
      if(fase>=FASES){fim(true);return;}
      fase++;montaFase();prende();hud();
      Z.snd(880,0.15,"sine",0.05);
    }
    if(bola.y>H+20){
      vidas--;hud();
      if(vidas<=0){fim(false);return;}
      Z.snd(160,0.2,"sawtooth",0.05);prende();
    }
    for(var p=parts.length-1;p>=0;p--){var q=parts[p];q.x+=q.vx;q.y+=q.vy;q.vida-=0.03;if(q.vida<=0)parts.splice(p,1);}
  }
  function estoura(x,y,cor){
    for(var i=0;i<10;i++){var a=Math.random()*6.28,v=1+Math.random()*2.5;parts.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vida:1,cor:cor});}
  }
  function desenha(){
    ctx.fillStyle="#070b09";ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="rgba(255,255,255,0.08)";ctx.lineWidth=2;ctx.strokeRect(5,5,W-10,H-10);
    for(var i=0;i<tijolos.length;i++){
      var t=tijolos[i];
      ctx.fillStyle=t.cor;ctx.globalAlpha=t.hp>1?1:0.75;
      ctx.beginPath();ctx.roundRect(t.x,t.y,t.w,t.h,5);ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.3)";ctx.fillRect(t.x+4,t.y+3,t.w-8,3);
      ctx.globalAlpha=1;
    }
    for(var p=0;p<parts.length;p++){var q=parts[p];ctx.globalAlpha=Math.max(q.vida,0);ctx.fillStyle=q.cor;ctx.fillRect(q.x-2,q.y-2,4,4);}
    ctx.globalAlpha=1;
    ctx.fillStyle="#edf2ef";
    ctx.beginPath();ctx.roundRect(base.x-base.w/2,base.y,base.w,base.h,6);ctx.fill();
    ctx.fillStyle="#10b981";
    ctx.beginPath();ctx.arc(bola.x,bola.y,bola.r,0,7);ctx.fill();
    if(preso&&!over){ctx.fillStyle="#8e9b94";ctx.font="600 13px Inter,sans-serif";ctx.textAlign="center";ctx.fillText("Espaço ou toque para lançar",W/2,H-70);}
  }
  function loop(ts){
    if(over)return;
    passo();desenha();
    requestAnimationFrame(loop);
  }
  function movePara(clientX){
    var r=cv.getBoundingClientRect();
    base.x=Math.max(base.w/2+6,Math.min(W-base.w/2-6,(clientX-r.left)*(W/r.width)));
  }
  cv.addEventListener("mousemove",function(e){movePara(e.clientX)});
  cv.addEventListener("touchstart",function(e){movePara(e.touches[0].clientX);lancar();},{passive:true});
  cv.addEventListener("touchmove",function(e){movePara(e.touches[0].clientX);},{passive:true});
  Z.onKey({" ":lancar,ArrowLeft:function(){base.x=Math.max(base.w/2+6,base.x-18)},ArrowRight:function(){base.x=Math.min(W-base.w/2-6,base.x+18)}});
  parts=[];
  document.getElementById("reinicia").addEventListener("click",function(){parts=[];zera();});
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── PAC-LABIRINTO ──────────────────────────────────────── */
const PAC_MAPAS = [
  [
    "###################",
    "#........#........#",
    "#.##.###.#.###.##.#",
    "#o##.###.#.###.##o#",
    "#.................#",
    "###.#.#####.#.###",
    "###.#.#GGG#.###",
    "....#.#GGG#....",
    "###.#.#####.#.###",
    "###.#.......#.###",
    "#.....###.....#",
    "#.##.#...#.##.#",
    "#o...#P#...#o#",
    "##.#.....#.##",
    "#....###....#",
    "#.##.###.##.#",
    "#........#........#",
    "###################",
  ],
  [
    "###################",
    "#o....#...#....o#",
    "#.###.#.#.#.###.#",
    "#.#.....#.....#.#",
    "#.#.###.###.#.#",
    "#...#GGG#...#",
    "###.#GGG#.###",
    ".....#####.....",
    "###.#.....#.###",
    "#...#.###.#...#",
    "#.###.#P#.###.#",
    "#.....#.....#",
    "##.###.###.##",
    "#o...#...#...o#",
    "#.###.#.#.###.#",
    "#.....#.....#",
    "###################",
  ],
];

export function pac({ nome, sub, mapa }) {
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="score">Pontos: 0</span>
  <span class="zchip" id="vidas">Vidas: 3</span>
  <span class="zchip" id="best">Recorde: 0</span>
</div>
<div style="position:relative;max-width:460px;margin:0 auto">
  <canvas class="zc" id="cv" width="456" height="432"></canvas>
  ${hudFim("Fim de jogo")}
</div>
<p class="dim center mt" style="font-size:12.5px">Setas ou WASD · no celular, deslize o dedo</p>`;
  const js = `
(function(){
  var cv=document.getElementById("cv");
  var ctx=cv.getContext?cv.getContext("2d"):null;
  if(!ctx){cv.outerHTML="<p class='dim center'>Seu navegador não suporta canvas.</p>";return;}
  var MAPA=(${JSON.stringify(PAC_MAPAS[mapa] || PAC_MAPAS[0])}).map(function(r){while(r.length<19)r+="#";return r;});
  var H=MAPA.length,W=19,T=24;
  cv.width=W*T;cv.height=H*T;
  var px,py,pdir,pnext,fantasmas,pontos,totalDots,vidas,score,over,win,medo,acc,last,best,tick;
  var CHAVE="pac-${mapa}";
  var CORESF=["#f87171","#f9a8d4","#22d3ee","#fb923c"];
  function zera(){
    pontos=[];totalDots=0;fantasmas=[];
    for(var y=0;y<H;y++)for(var x=0;x<W;x++){
      var ch=(MAPA[y]||"")[x];
      if(ch==="P"){px=x;py=y;}
      else if(ch==="."){pontos.push({x:x,y:y,p:false});totalDots++;}
      else if(ch==="o"){pontos.push({x:x,y:y,p:true});totalDots++;}
      else if(ch==="G"&&fantasmas.length<4){fantasmas.push({x:x,y:y,dir:{x:1,y:0},fora:0,cor:CORESF[fantasmas.length]});}
    }
    pdir={x:0,y:0};pnext=null;vidas=3;score=0;over=false;win=false;medo=0;acc=0;last=performance.now();tick=TURBO_X;
    best=Z.store.best(CHAVE);
    document.getElementById("best").textContent="Recorde: "+best;
    document.getElementById("fim").classList.add("hidden");
    hud();requestAnimationFrame(loop);
  }
  var TURBO_X=0;
  function parede(x,y){
    if(x<0||x>=W)return false;
    if(y<0||y>=H)return true;
    return (MAPA[y]||"")[x]==="#";
  }
  function hud(){
    document.getElementById("score").textContent="Pontos: "+score;
    document.getElementById("vidas").textContent="Vidas: "+vidas;
  }
  function fim(venceu){
    over=true;
    if(score>best){best=score;Z.store.setBest(CHAVE,best);document.getElementById("best").textContent="Recorde: "+best;}
    Z.snd(venceu?880:140,0.3,venceu?"sine":"sawtooth",0.05);
    document.getElementById("fimTitulo").textContent=venceu?"Fase completa!":"Fim de jogo";
    document.getElementById("fimTxt").innerHTML="Pontuação: <b class='acc'>"+score+"</b>";
    document.getElementById("fim").classList.remove("hidden");
  }
  function morrer(){
    vidas--;hud();
    Z.snd(160,0.3,"sawtooth",0.05);
    if(vidas<=0){fim(false);return;}
    for(var y=0;y<H;y++)for(var x=0;x<W;x++){if((MAPA[y]||"")[x]==="P"){px=x;py=y;}}
    pdir={x:0,y:0};pnext=null;medo=0;
    for(var i=0;i<fantasmas.length;i++){var f=fantasmas[i];f.fora=0;}
  }
  function passo(){
    if(pnext&&!parede(px+pnext.x,py+pnext.y)){pdir=pnext;}
    var nx=px+pdir.x,ny=py+pdir.y;
    if(nx<0)nx=W-1;if(nx>=W)nx=0;
    if(!parede(nx,ny)){px=nx;py=ny;}
    for(var i=pontos.length-1;i>=0;i--){
      if(pontos[i].x===px&&pontos[i].y===py){
        if(pontos[i].p){score+=50;medo=40;Z.snd(220,0.2,"square",0.04);}
        else{score+=10;Z.snd(660,0.03,"sine",0.02);}
        pontos.splice(i,1);totalDots--;hud();
        if(totalDots<=0){fim(true);return;}
      }
    }
    if(medo>0)medo--;
    var dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
    for(var g=0;g<fantasmas.length;g++){
      var f=fantasmas[g];
      if(f.fora>0){f.fora--;continue;}
      var ops=[];
      for(var d=0;d<4;d++){
        var dx=dirs[d].x,dy=dirs[d].y;
        if(dx===-f.dir.x&&dy===-f.dir.y)continue;
        var tx=f.x+dx,ty=f.y+dy;
        if(tx<0)tx=W-1;if(tx>=W)tx=0;
        if(!parede(tx,ty))ops.push({x:dx,y:dy});
      }
      if(!ops.length){f.dir={x:-f.dir.x,y:-f.dir.y};}
      else if(medo>0||g>=2){f.dir=ops[Math.floor(Math.random()*ops.length)];}
      else{
        var alvo=(g===1)?{x:px+pdir.x*2,y:py+pdir.y*2}:{x:px,y:py};
        var melhor=ops[0],md=1e9;
        for(var o=0;o<ops.length;o++){
          var dd=(f.x+ops[o].x-alvo.x)*(f.x+ops[o].x-alvo.x)+(f.y+ops[o].y-alvo.y)*(f.y+ops[o].y-alvo.y);
          if(dd<md){md=dd;melhor=ops[o];}
        }
        f.dir=melhor;
      }
      f.x+=f.dir.x;f.y+=f.dir.y;
      if(f.x<0)f.x=W-1;if(f.x>=W)f.x=0;
      if(f.x===px&&f.y===py){
        if(medo>0){score+=200;hud();Z.snd(990,0.12,"square",0.05);f.fora=25;
          for(var yy=0;yy<H;yy++)for(var xx=0;xx<W;xx++){if((MAPA[yy]||"")[xx]==="G"){f.x=xx;f.y=yy;yy=H;break;}}}
        else{morrer();return;}
      }
    }
  }
  function desenha(){
    ctx.fillStyle="#070b09";ctx.fillRect(0,0,W*T,H*T);
    for(var y=0;y<H;y++)for(var x=0;x<W;x++){
      if((MAPA[y]||"")[x]==="#"){
        ctx.fillStyle="rgba(56,189,248,0.16)";ctx.fillRect(x*T,y*T,T,T);
        ctx.strokeStyle="rgba(56,189,248,0.55)";ctx.lineWidth=1.5;ctx.strokeRect(x*T+1,y*T+1,T-2,T-2);
      }
    }
    for(var i=0;i<pontos.length;i++){
      var p=pontos[i];
      ctx.fillStyle="#e7dcc3";
      ctx.beginPath();ctx.arc(p.x*T+T/2,p.y*T+T/2,p.p?5:2.5,0,7);ctx.fill();
    }
    var boca=(Math.floor(performance.now()/140)%2===0)?0.25:0.02;
    var ang=pdir.x===1?0:pdir.x===-1?Math.PI:pdir.y===1?Math.PI/2:-Math.PI/2;
    ctx.fillStyle="#fbbf24";
    ctx.beginPath();ctx.moveTo(px*T+T/2,py*T+T/2);
    ctx.arc(px*T+T/2,py*T+T/2,T/2-2,ang+boca,ang+Math.PI*2-boca);ctx.fill();
    for(var g=0;g<fantasmas.length;g++){
      var f=fantasmas[g];
      if(f.fora>0)continue;
      var cx=f.x*T+T/2,cy=f.y*T+T/2,r=T/2-2;
      ctx.fillStyle=medo>0?"#3b82f6":f.cor;
      ctx.beginPath();ctx.arc(cx,cy-2,r,Math.PI,0);
      ctx.lineTo(cx+r,cy+r-2);
      for(var s=0;s<3;s++){ctx.lineTo(cx+r-(s*2+1)*r/3,cy+r-5);ctx.lineTo(cx+r-(s*2+2)*r/3,cy+r-2);}
      ctx.closePath();ctx.fill();
      ctx.fillStyle="#fff";
      ctx.beginPath();ctx.arc(cx-4,cy-3,2.6,0,7);ctx.arc(cx+4,cy-3,2.6,0,7);ctx.fill();
      ctx.fillStyle=medo>0?"#fff":"#0b0f0d";
      var ex=pdir.x*1.2,ey=pdir.y*1.2;
      ctx.beginPath();ctx.arc(cx-4+ex,cy-3+ey,1.3,0,7);ctx.arc(cx+4+ex,cy-3+ey,1.3,0,7);ctx.fill();
    }
  }
  function loop(ts){
    if(over)return;
    acc+=ts-last;last=ts;
    while(acc>=135){acc-=135;passo();if(over)return;}
    desenha();
    requestAnimationFrame(loop);
  }
  function dir(x,y){pnext={x:x,y:y};}
  Z.onKey({ArrowUp:function(){dir(0,-1)},ArrowDown:function(){dir(0,1)},ArrowLeft:function(){dir(-1,0)},ArrowRight:function(){dir(1,0)},
    w:function(){dir(0,-1)},s:function(){dir(0,1)},a:function(){dir(-1,0)},d:function(){dir(1,0)}});
  var tx=null,ty=null;
  cv.addEventListener("touchstart",function(e){var t=e.touches[0];tx=t.clientX;ty=t.clientY;},{passive:true});
  cv.addEventListener("touchend",function(e){
    if(tx==null)return;
    var t=e.changedTouches[0],dx=t.clientX-tx,dy=t.clientY-ty;
    if(Math.abs(dx)>Math.abs(dy))dir(dx>0?1:-1,0);else dir(0,dy>0?1:-1);
    tx=null;
  },{passive:true});
  document.getElementById("reinicia").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── FUGA DAS ESFERAS (arena survival) ──────────────────── */
export function fuga({ nome, sub, modo }) {
  const endless = modo === "endless";
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="tempo">Tempo: 0s</span>
  ${endless ? "" : '<span class="zchip">Meta: 60s</span>'}
  <span class="zchip" id="dash">Dash pronto</span>
  <span class="zchip" id="best">Recorde: 0s</span>
</div>
<div style="position:relative;max-width:440px;margin:0 auto">
  <canvas class="zc" id="cv" width="440" height="440"></canvas>
  ${hudFim("Fim de jogo")}
</div>
<div class="row mt" style="justify-content:center">
  <button class="zbtn ghost" id="dashBtn" type="button">Dash (Espaço)</button>
</div>
<p class="dim center mt" style="font-size:12.5px">Mouse, toque ou WASD/setas para mover · Espaço para o dash</p>`;
  const js = `
(function(){
  var cv=document.getElementById("cv");
  var ctx=cv.getContext?cv.getContext("2d"):null;
  if(!ctx){cv.outerHTML="<p class='dim center'>Seu navegador não suporta canvas.</p>";return;}
  var ENDLESS=${endless ? "true" : "false"};
  var W=440,H=440;
  var px,py,inimigos,parts,tempo,over,win,dashT,dashCD,spawnT,teclas,alvo,best,last;
  var CHAVE="fuga-${modo}";
  function zera(){
    px=W/2;py=H/2;inimigos=[];parts=[];tempo=0;over=false;win=false;
    dashT=0;dashCD=0;spawnT=0;teclas={};alvo=null;
    best=Z.store.best(CHAVE);
    document.getElementById("best").textContent="Recorde: "+Math.floor(best)+"s";
    document.getElementById("fim").classList.add("hidden");
    hud();last=performance.now();requestAnimationFrame(loop);
  }
  function hud(){
    document.getElementById("tempo").textContent=(ENDLESS?"Pontos: ":"Tempo: ")+Math.floor(tempo)+(ENDLESS?"":"s");
    document.getElementById("dash").textContent=dashCD<=0?"Dash pronto":"Dash…";
  }
  function fim(venceu){
    over=true;
    if(tempo>best){best=tempo;Z.store.setBest(CHAVE,best);}
    document.getElementById("best").textContent="Recorde: "+Math.floor(best)+"s";
    Z.snd(venceu?880:140,0.3,venceu?"sine":"sawtooth",0.05);
    document.getElementById("fimTitulo").textContent=venceu?"Você sobreviveu!":"Fim de jogo";
    document.getElementById("fimTxt").innerHTML=(ENDLESS?"Pontuação":"Tempo") + ": <b class='acc'>"+Math.floor(tempo)+(ENDLESS?"":"s")+"</b>";
    document.getElementById("fim").classList.remove("hidden");
  }
  function dash(){
    if(over||dashCD>0)return;
    dashT=0.18;dashCD=2.4;Z.snd(520,0.12,"sawtooth",0.04);
  }
  function passo(dt){
    tempo+=dt;
    if(!ENDLESS&&tempo>=60){fim(true);return;}
    if(dashCD>0){dashCD-=dt;if(dashCD<=0)hud();}
    if(dashT>0)dashT-=dt;
    var vx=0,vy=0;
    if(teclas.l)vx-=1;if(teclas.r)vx+=1;if(teclas.u)vy-=1;if(teclas.d)vy+=1;
    if(vx||vy){var m=Math.hypot(vx,vy);vx/=m;vy/=m;}
    else if(alvo){
      var dx=alvo.x-px,dy=alvo.y-py,d=Math.hypot(dx,dy);
      if(d>8){vx=dx/d;vy=dy/d;}
    }
    var vel=dashT>0?640:215;
    px=Math.max(12,Math.min(W-12,px+vx*vel*dt));
    py=Math.max(12,Math.min(H-12,py+vy*vel*dt));
    if(dashT>0&&parts.length<120)parts.push({x:px,y:py,vx:-vx*60,vy:-vy*60,vida:0.4,cor:"#34d399"});
    spawnT-=dt;
    var intervalo=Math.max(0.32,1.05-tempo*0.012);
    if(spawnT<=0){
      spawnT=intervalo;
      var lado=Math.floor(Math.random()*4),ex,ey;
      if(lado===0){ex=-14;ey=Math.random()*H;}else if(lado===1){ex=W+14;ey=Math.random()*H;}
      else if(lado===2){ex=Math.random()*W;ey=-14;}else{ex=Math.random()*W;ey=H+14;}
      if(Math.hypot(ex-px,ey-py)>160){
        var vmax=ENDLESS?245:200;
        inimigos.push({x:ex,y:ey,v:Math.min(vmax,92+tempo*2.4)*(0.9+Math.random()*0.2),r:9+Math.random()*7});
      }
    }
    for(var i=0;i<inimigos.length;i++){
      var e=inimigos[i];
      var ddx=px-e.x,ddy=py-e.y,dd=Math.hypot(ddx,ddy)||1;
      e.x+=ddx/dd*e.v*dt;e.y+=ddy/dd*e.v*dt;
      if(dd<e.r+9&&dashT<=0){fim(false);return;}
    }
    for(var p=parts.length-1;p>=0;p--){var q=parts[p];q.x+=q.vx*dt;q.y+=q.vy*dt;q.vida-=dt;if(q.vida<=0)parts.splice(p,1);}
    hud();
  }
  function desenha(){
    ctx.fillStyle="#070b09";ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(255,255,255,0.05)";
    for(var gx=20;gx<W;gx+=40)for(var gy=20;gy<H;gy+=40)ctx.fillRect(gx,gy,2,2);
    for(var p=0;p<parts.length;p++){var q=parts[p];ctx.globalAlpha=Math.max(q.vida*2,0);ctx.fillStyle=q.cor;ctx.beginPath();ctx.arc(q.x,q.y,5,0,7);ctx.fill();}
    ctx.globalAlpha=1;
    for(var i=0;i<inimigos.length;i++){
      var e=inimigos[i];
      var g=ctx.createRadialGradient(e.x,e.y,1,e.x,e.y,e.r+8);
      g.addColorStop(0,"#f87171");g.addColorStop(1,"rgba(248,113,113,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(e.x,e.y,e.r+8,0,7);ctx.fill();
      ctx.fillStyle="#ef4444";ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,7);ctx.fill();
    }
    if(dashCD>0&&dashT<=0){
      ctx.strokeStyle="rgba(52,211,153,0.35)";ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(px,py,15,-Math.PI/2,-Math.PI/2+(1-dashCD/2.4)*Math.PI*2);ctx.stroke();
    }
    ctx.fillStyle=dashT>0?"#a7f3d0":"#34d399";
    ctx.beginPath();ctx.arc(px,py,9,0,7);ctx.fill();
    ctx.fillStyle="#04120c";ctx.beginPath();ctx.arc(px,py,3.5,0,7);ctx.fill();
    if(!ENDLESS){
      ctx.fillStyle="rgba(255,255,255,0.1)";ctx.fillRect(20,H-18,W-40,6);
      ctx.fillStyle="#34d399";ctx.fillRect(20,H-18,(W-40)*Math.min(tempo/60,1),6);
    }
  }
  function loop(ts){
    if(over)return;
    var dt=Math.min((ts-last)/1000,0.05);last=ts;
    passo(dt);if(over)return;desenha();
    requestAnimationFrame(loop);
  }
  function pos(e){
    var r=cv.getBoundingClientRect();
    return {x:(e.clientX-r.left)*(W/r.width),y:(e.clientY-r.top)*(H/r.height)};
  }
  cv.addEventListener("mousemove",function(e){alvo=pos(e)});
  cv.addEventListener("touchstart",function(e){alvo=pos(e.touches[0]);},{passive:true});
  cv.addEventListener("touchmove",function(e){alvo=pos(e.touches[0]);},{passive:true});
  Z.onKey({" ":dash,
    ArrowLeft:function(){teclas.l=true},ArrowRight:function(){teclas.r=true},ArrowUp:function(){teclas.u=true},ArrowDown:function(){teclas.d=true},
    a:function(){teclas.l=true},d:function(){teclas.r=true},w:function(){teclas.u=true},s:function(){teclas.d=true}});
  document.addEventListener("keyup",function(e){
    var k=e.key;
    if(k==="ArrowLeft"||k==="a")teclas.l=false;
    if(k==="ArrowRight"||k==="d")teclas.r=false;
    if(k==="ArrowUp"||k==="w")teclas.u=false;
    if(k==="ArrowDown"||k==="s")teclas.d=false;
  });
  document.getElementById("dashBtn").addEventListener("click",dash);
  document.getElementById("reinicia").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── CAÇADA NA FLORESTA (top-down survival) ─────────────── */
export function cacada({ nome, sub, noite }) {
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="itens">Cogumelos: 0/8</span>
  <span class="zchip" id="vidas">Vidas: 3</span>
  <span class="zchip" id="best">Recorde: —</span>
</div>
<div style="position:relative;max-width:440px;margin:0 auto">
  <canvas class="zc" id="cv" width="440" height="440"></canvas>
  ${hudFim("Fim de jogo")}
</div>
<p class="dim center mt" style="font-size:12.5px">WASD, setas ou arraste o dedo · colete os 8 cogumelos sem ser pego</p>`;
  const js = `
(function(){
  var cv=document.getElementById("cv");
  var ctx=cv.getContext?cv.getContext("2d"):null;
  if(!ctx){cv.outerHTML="<p class='dim center'>Seu navegador não suporta canvas.</p>";return;}
  var NOITE=${noite ? "true" : "false"};
  var W=440,H=440;
  var dark=document.createElement("canvas");dark.width=W;dark.height=H;
  var dctx=dark.getContext?dark.getContext("2d"):null;
  var px,py,arvores,cogus,lobos,vagalumes,coletados,vidas,over,win,inv,tempo,teclas,alvo,best,last;
  var CHAVE="cacada-${noite ? "noite" : "dia"}";
  function livre(x,y,m){
    if(x<m||x>W-m||y<m||y>H-m)return false;
    for(var i=0;i<arvores.length;i++){if(Math.hypot(x-arvores[i].x,y-arvores[i].y)<arvores[i].r+m)return false;}
    return true;
  }
  function pontoLivre(m){
    for(var t=0;t<200;t++){var x=30+Math.random()*(W-60),y=30+Math.random()*(H-60);if(livre(x,y,m))return {x:x,y:y};}
    return {x:W/2,y:H/2};
  }
  function zera(){
    px=W/2;py=H-60;coletados=0;vidas=3;over=false;win=false;inv=0;tempo=0;teclas={};alvo=null;
    best=Z.store.best(CHAVE);
    document.getElementById("best").textContent="Recorde: "+(best?Math.floor(best)+"s":"—");
    document.getElementById("fim").classList.add("hidden");
    arvores=[];
    for(var i=0;i<14;i++){var p=pontoLivre(24);arvores.push({x:p.x,y:p.y,r:13+Math.random()*9});}
    cogus=[];
    for(var c=0;c<8;c++){var q=pontoLivre(18);cogus.push(q);}
    lobos=[];
    for(var l=0;l<3;l++){var w=pontoLivre(20);lobos.push({x:w.x,y:w.y,a:Math.random()*6.28,troca:0,vel:105+l*12});}
    vagalumes=[];
    for(var v=0;v<14;v++)vagalumes.push({x:Math.random()*W,y:Math.random()*H,a:Math.random()*6.28});
    hud();last=performance.now();requestAnimationFrame(loop);
  }
  function hud(){document.getElementById("itens").textContent="Cogumelos: "+coletados+"/8";document.getElementById("vidas").textContent="Vidas: "+vidas;}
  function fim(venceu){
    over=true;
    if(venceu&&(!best||tempo<best)){best=tempo;Z.store.setBest(CHAVE,best);}
    document.getElementById("best").textContent="Recorde: "+(best?Math.floor(best)+"s":"—");
    Z.snd(venceu?880:140,0.3,venceu?"sine":"sawtooth",0.05);
    document.getElementById("fimTitulo").textContent=venceu?"Floresta explorada!":"Fim de jogo";
    document.getElementById("fimTxt").innerHTML=venceu?("Tempo: <b class='acc'>"+Math.floor(tempo)+"s</b>"):("Cogumelos: <b class='acc'>"+coletados+"/8</b>");
    document.getElementById("fim").classList.remove("hidden");
  }
  function passo(dt){
    tempo+=dt;
    if(inv>0)inv-=dt;
    var vx=0,vy=0;
    if(teclas.l)vx-=1;if(teclas.r)vx+=1;if(teclas.u)vy-=1;if(teclas.d)vy+=1;
    if(vx||vy){var m=Math.hypot(vx,vy);vx/=m;vy/=m;}
    else if(alvo){var dx=alvo.x-px,dy=alvo.y-py,d=Math.hypot(dx,dy);if(d>10){vx=dx/d;vy=dy/d;}}
    var nx=px+vx*175*dt,ny=py+vy*175*dt;
    for(var i=0;i<arvores.length;i++){
      var a=arvores[i],dd=Math.hypot(nx-a.x,ny-a.y),min=a.r+10;
      if(dd<min&&dd>0){nx=a.x+(nx-a.x)/dd*min;ny=a.y+(ny-a.y)/dd*min;}
    }
    px=Math.max(12,Math.min(W-12,nx));py=Math.max(12,Math.min(H-12,ny));
    for(var c=cogus.length-1;c>=0;c--){
      if(Math.hypot(px-cogus[c].x,py-cogus[c].y)<18){
        cogus.splice(c,1);coletados++;hud();Z.snd(740,0.08,"sine",0.05);
        if(coletados>=8){fim(true);return;}
      }
    }
    for(var l=0;l<lobos.length;l++){
      var L=lobos[l];
      var dxp=px-L.x,dyp=py-L.y,dp=Math.hypot(dxp,dyp);
      if(dp<(NOITE?170:200)){L.a=Math.atan2(dyp,dxp);}
      else{L.troca-=dt;if(L.troca<=0){L.troca=1.5+Math.random()*2;L.a=Math.random()*6.28;}}
      L.x+=Math.cos(L.a)*L.vel*dt;L.y+=Math.sin(L.a)*L.vel*dt;
      L.x=Math.max(12,Math.min(W-12,L.x));L.y=Math.max(12,Math.min(H-12,L.y));
      if(dp<20&&inv<=0){
        vidas--;hud();Z.snd(150,0.25,"sawtooth",0.06);
        if(vidas<=0){fim(false);return;}
        inv=1.6;
        var f=pontoLivre(20);L.x=f.x;L.y=f.y;
      }
    }
    for(var v=0;v<vagalumes.length;v++){var V=vagalumes[v];V.a+=dt*0.7;V.x+=Math.cos(V.a)*14*dt;V.y+=Math.sin(V.a*1.3)*14*dt;}
  }
  function desenha(){
    ctx.fillStyle=NOITE?"#060a08":"#0a120d";ctx.fillRect(0,0,W,H);
    ctx.fillStyle=NOITE?"rgba(255,255,255,0.04)":"rgba(74,222,128,0.06)";
    for(var gx=14;gx<W;gx+=36)for(var gy=14;gy<H;gy+=36)ctx.fillRect(gx,gy,2,2);
    var i;
    for(i=0;i<arvores.length;i++){
      var a=arvores[i];
      ctx.fillStyle="#1d2b20";ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,7);ctx.fill();
      ctx.fillStyle="#2c4232";ctx.beginPath();ctx.arc(a.x-3,a.y-3,a.r*0.6,0,7);ctx.fill();
    }
    for(i=0;i<cogus.length;i++){
      var c=cogus[i],pul=1+Math.sin(performance.now()/300+i)*0.08;
      ctx.fillStyle="#e8e0cf";ctx.fillRect(c.x-2.5,c.y-2,5,9);
      ctx.fillStyle="#ef4444";ctx.beginPath();ctx.arc(c.x,c.y-2,8*pul,Math.PI,0);ctx.fill();
      ctx.fillStyle="#fff";ctx.fillRect(c.x-4,c.y-6,2,2);ctx.fillRect(c.x+1,c.y-8,2,2);
    }
    for(i=0;i<lobos.length;i++){
      var L=lobos[i];
      ctx.fillStyle="#3f3f46";ctx.beginPath();ctx.arc(L.x,L.y,11,0,7);ctx.fill();
      ctx.fillStyle="#52525b";
      ctx.beginPath();ctx.moveTo(L.x-9,L.y-6);ctx.lineTo(L.x-5,L.y-14);ctx.lineTo(L.x-1,L.y-6);ctx.fill();
      ctx.beginPath();ctx.moveTo(L.x+1,L.y-6);ctx.lineTo(L.x+5,L.y-14);ctx.lineTo(L.x+9,L.y-6);ctx.fill();
      var dxp=px-L.x,dyp=py-L.y,dp=Math.hypot(dxp,dyp)||1;
      ctx.fillStyle="#ef4444";
      ctx.beginPath();ctx.arc(L.x-4+dxp/dp*2,L.y-1+dyp/dp*2,1.8,0,7);ctx.arc(L.x+4+dxp/dp*2,L.y-1+dyp/dp*2,1.8,0,7);ctx.fill();
    }
    if(inv<=0||Math.floor(performance.now()/120)%2===0){
      ctx.fillStyle="#34d399";ctx.beginPath();ctx.arc(px,py,10,0,7);ctx.fill();
      ctx.fillStyle="#04120c";ctx.beginPath();ctx.arc(px-3,py-1,1.6,0,7);ctx.arc(px+3,py-1,1.6,0,7);ctx.fill();
    }
    for(i=0;i<vagalumes.length;i++){
      var V=vagalumes[i];
      ctx.fillStyle="rgba(251,191,36,"+(0.25+0.2*Math.sin(performance.now()/400+i*2))+")";
      ctx.beginPath();ctx.arc(V.x,V.y,2,0,7);ctx.fill();
    }
    if(NOITE&&dctx){
      dctx.globalCompositeOperation="source-over";
      dctx.clearRect(0,0,W,H);
      dctx.fillStyle="rgba(2,6,4,0.78)";dctx.fillRect(0,0,W,H);
      dctx.globalCompositeOperation="destination-out";
      var g=dctx.createRadialGradient(px,py,20,px,py,130);
      g.addColorStop(0,"rgba(0,0,0,1)");g.addColorStop(1,"rgba(0,0,0,0)");
      dctx.fillStyle=g;dctx.beginPath();dctx.arc(px,py,130,0,7);dctx.fill();
      ctx.drawImage(dark,0,0);
    }
  }
  function loop(ts){
    if(over)return;
    var dt=Math.min((ts-last)/1000,0.05);last=ts;
    passo(dt);if(over)return;desenha();
    requestAnimationFrame(loop);
  }
  function pos(e){var r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*(W/r.width),y:(e.clientY-r.top)*(H/r.height)};}
  cv.addEventListener("touchstart",function(e){alvo=pos(e.touches[0]);},{passive:true});
  cv.addEventListener("touchmove",function(e){alvo=pos(e.touches[0]);},{passive:true});
  cv.addEventListener("touchend",function(){alvo=null;},{passive:true});
  Z.onKey({
    ArrowLeft:function(){teclas.l=true},ArrowRight:function(){teclas.r=true},ArrowUp:function(){teclas.u=true},ArrowDown:function(){teclas.d=true},
    a:function(){teclas.l=true},d:function(){teclas.r=true},w:function(){teclas.u=true},s:function(){teclas.d=true}});
  document.addEventListener("keyup",function(e){
    var k=e.key;
    if(k==="ArrowLeft"||k==="a")teclas.l=false;
    if(k==="ArrowRight"||k==="d")teclas.r=false;
    if(k==="ArrowUp"||k==="w")teclas.u=false;
    if(k==="ArrowDown"||k==="s")teclas.d=false;
  });
  document.getElementById("reinicia").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── PLATAFORMA (pulo com fases) ─────────────────────────── */
const PLAT_NIVEIS = [
  [ // L1: tutorial — reta com um buraco
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "..........oo..........",
    "..P..oo....oo......E..",
    "##########..##########",
    "##########..##########",
  ],
  [ // L2: plataforma no meio do vão + espinho
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    ".........oo...........",
    "........####..........",
    "..Poo............^..E.",
    "#######......#########",
    "#######......#########",
  ],
  [ // L3: subida em degraus + queda para a saída
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "..........oo..........",
    ".........######.......",
    ".....oo...............",
    "....####..............",
    "..P..............^^.E.",
    "######..........######",
    "######..........######",
  ],
  [ // H1: vãos de 3 + plataforma alta + espinhos
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "..........oo..........",
    ".........####.........",
    ".....ooo......ooo.....",
    "..P.......^^.......^E.",
    "#####...######...#####",
    "#####...######...#####",
  ],
  [ // H2: corredor de espinhos + rotas alternativas
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "....oo.......oo.......",
    "...####.....####......",
    "..........oo..........",
    "..P.^^........^^....E.",
    "##########..##########",
    "##########..##########",
  ],
  [ // H3: escalada final
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "......................",
    "............oo........",
    "...........####.......",
    "........oo.....oo.....",
    ".......####...####....",
    "....oo................",
    "...####...............",
    "P.^...............^^.E",
    "####..............####",
    "####..............####",
  ],
];

export function platformer({ nome, sub, pack }) {
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="fase">Fase: 1/3</span>
  <span class="zchip" id="moedas">Moedas: 0</span>
  <span class="zchip" id="vidas">Vidas: 3</span>
</div>
<div style="position:relative;max-width:440px;margin:0 auto">
  <canvas class="zc" id="cv" width="440" height="360"></canvas>
  ${hudFim("Fim de jogo")}
</div>
<div class="row mt" style="justify-content:center;gap:8px">
  <button class="zbtn ghost" id="bEsq" type="button" style="padding:12px 22px">←</button>
  <button class="zbtn ghost" id="bPulo" type="button" style="padding:12px 26px">Pular</button>
  <button class="zbtn ghost" id="bDir" type="button" style="padding:12px 22px">→</button>
</div>
<p class="dim center mt" style="font-size:12.5px">Setas ou A/D para mover · Espaço para pular · chegue à porta</p>`;
  const js = `
(function(){
  var cv=document.getElementById("cv");
  var ctx=cv.getContext?cv.getContext("2d"):null;
  if(!ctx){cv.outerHTML="<p class='dim center'>Seu navegador não suporta canvas.</p>";return;}
  var PACK=${pack};
  var NIVEIS=${JSON.stringify(PLAT_NIVEIS)}.slice(PACK*3,PACK*3+3);
  var T=20,COLS=22,ROWS=18;
  var solidos,espinhos,moedas,saida,px,py,vx,vy,noChao,coyote;
  var fase,moedasN,vidas,over,win,esq,dir,last;
  function parse(n){
    solidos=[];espinhos=[];moedas=[];saida=null;
    for(var y=0;y<ROWS;y++)for(var x=0;x<COLS;x++){
      var ch=(NIVEIS[n][y]||"")[x];
      if(ch==="#")solidos.push({x:x*T,y:y*T});
      else if(ch==="^")espinhos.push({x:x*T+2,y:y*T+6,w:T-4,h:T-6});
      else if(ch==="o")moedas.push({x:x*T+T/2,y:y*T+T/2,ok:true});
      else if(ch==="P"){px=x*T+3;py=y*T+2;vx=0;vy=0;}
      else if(ch==="E")saida={x:x*T,y:y*T};
    }
  }
  function zera(){
    fase=0;moedasN=0;vidas=3;over=false;win=false;esq=false;dir=false;
    document.getElementById("fim").classList.add("hidden");
    parse(0);hud();last=performance.now();requestAnimationFrame(loop);
  }
  function hud(){
    document.getElementById("fase").textContent="Fase: "+(fase+1)+"/3";
    document.getElementById("moedas").textContent="Moedas: "+moedasN;
    document.getElementById("vidas").textContent="Vidas: "+vidas;
  }
  function fim(venceu){
    over=true;
    Z.snd(venceu?880:140,0.3,venceu?"sine":"sawtooth",0.05);
    document.getElementById("fimTitulo").textContent=venceu?"Todas as fases!":"Fim de jogo";
    document.getElementById("fimTxt").innerHTML="Moedas: <b class='acc'>"+moedasN+"</b> · Fase <b class='acc'>"+(fase+1)+"/3</b>";
    document.getElementById("fim").classList.remove("hidden");
  }
  function morte(){
    vidas--;hud();Z.snd(150,0.25,"sawtooth",0.06);
    if(vidas<=0){fim(false);return;}
    parse(fase);
  }
  function colide(px0,py0,w,h){
    for(var i=0;i<solidos.length;i++){
      var s=solidos[i];
      if(px0<s.x+T&&px0+w>s.x&&py0<s.y+T&&py0+h>s.y)return s;
    }
    return null;
  }
  function pular(){
    if(over)return;
    if(noChao||coyote>0){vy=-8.6;noChao=false;coyote=0;Z.snd(440,0.07,"square",0.03);}
  }
  function passo(){
    var PW=14,PH=18;
    vx=0;
    if(esq)vx-=2.7;if(dir)vx+=2.7;
    var nx=px+vx;
    if(!colide(nx,py,PW,PH))px=nx;
    else px=(vx>0)?Math.floor((nx+PW)/T)*T-PW-0.01:Math.floor(nx/T)*T+T+0.01;
    px=Math.max(0,Math.min(COLS*T-PW,px));
    vy=Math.min(vy+0.5,9);
    var ny=py+vy;
    noChao=false;
    var c=colide(px,ny,PW,PH);
    if(!c)py=ny;
    else{
      if(vy>0){py=c.y-PH;noChao=true;coyote=6;}
      else py=c.y+T;
      vy=0;
    }
    if(py>ROWS*T){morte();return;}
    if(coyote>0)coyote--;
    for(var i=0;i<espinhos.length;i++){
      var e=espinhos[i];
      if(px<e.x+e.w&&px+PW>e.x&&py<e.y+e.h&&py+PH>e.y){morte();return;}
    }
    for(var m=0;m<moedas.length;m++){
      var k=moedas[m];
      if(k.ok&&Math.abs(px+PW/2-k.x)<14&&Math.abs(py+PH/2-k.y)<16){k.ok=false;moedasN++;hud();Z.snd(990,0.06,"sine",0.04);}
    }
    if(saida&&px<saida.x+T&&px+PW>saida.x&&py<saida.y+T&&py+PH>saida.y){
      Z.snd(880,0.15,"sine",0.05);
      if(fase>=2){fim(true);return;}
      fase++;parse(fase);hud();
    }
  }
  function desenha(){
    ctx.fillStyle="#070b09";ctx.fillRect(0,0,440,360);
    ctx.fillStyle="rgba(255,255,255,0.04)";
    for(var sx=10;sx<440;sx+=44)for(var sy=10;sy<360;sy+=44)ctx.fillRect(sx,sy,2,2);
    for(var i=0;i<solidos.length;i++){
      var s=solidos[i];
      ctx.fillStyle="#12352a";ctx.fillRect(s.x,s.y,T,T);
      ctx.fillStyle="#1d5c46";ctx.fillRect(s.x,s.y,T,3);
      ctx.strokeStyle="rgba(52,211,153,0.25)";ctx.lineWidth=1;ctx.strokeRect(s.x+0.5,s.y+0.5,T-1,T-1);
    }
    for(var e=0;e<espinhos.length;e++){
      var p=espinhos[e];
      ctx.fillStyle="#ef4444";
      ctx.beginPath();ctx.moveTo(p.x,p.y+p.h);ctx.lineTo(p.x+p.w/2,p.y);ctx.lineTo(p.x+p.w,p.y+p.h);ctx.fill();
    }
    var t=performance.now()/300;
    for(var m=0;m<moedas.length;m++){
      var k=moedas[m];if(!k.ok)continue;
      ctx.fillStyle="#fbbf24";
      ctx.beginPath();ctx.arc(k.x,k.y,5+Math.sin(t+m)*1,0,7);ctx.fill();
      ctx.fillStyle="#92400e";ctx.fillRect(k.x-1,k.y-3,2,6);
    }
    if(saida){
      ctx.fillStyle="#2e1065";ctx.fillRect(saida.x,saida.y,T,T);
      ctx.strokeStyle="#a78bfa";ctx.lineWidth=2;ctx.strokeRect(saida.x+1,saida.y+1,T-2,T-2);
      ctx.fillStyle="#a78bfa";ctx.beginPath();ctx.arc(saida.x+T/2,saida.y+T/2,3,0,7);ctx.fill();
    }
    ctx.fillStyle="#34d399";
    ctx.beginPath();ctx.roundRect(px,py,14,18,4);ctx.fill();
    ctx.fillStyle="#04120c";ctx.fillRect(px+3,py+6,8,4);
  }
  function loop(ts){
    if(over)return;
    passo();if(over)return;desenha();
    requestAnimationFrame(loop);
  }
  document.addEventListener("keydown",function(e){
    if(["ArrowLeft","ArrowRight","ArrowUp"," ","a","d","w"].indexOf(e.key)>=0)e.preventDefault();
    if(e.key==="ArrowLeft"||e.key==="a")esq=true;
    if(e.key==="ArrowRight"||e.key==="d")dir=true;
    if(e.key==="ArrowUp"||e.key==="w"||e.key===" ")pular();
  });
  document.addEventListener("keyup",function(e){
    if(e.key==="ArrowLeft"||e.key==="a")esq=false;
    if(e.key==="ArrowRight"||e.key==="d")dir=false;
  });
  function segura(el,fn){
    var on=function(ev){ev.preventDefault();fn(true);},off=function(ev){ev.preventDefault();fn(false);};
    el.addEventListener("touchstart",on,{passive:false});el.addEventListener("touchend",off,{passive:false});
    el.addEventListener("mousedown",on);el.addEventListener("mouseup",off);el.addEventListener("mouseleave",function(){fn(false);});
  }
  segura(document.getElementById("bEsq"),function(v){esq=v;});
  segura(document.getElementById("bDir"),function(v){dir=v;});
  document.getElementById("bPulo").addEventListener("touchstart",function(e){e.preventDefault();pular();},{passive:false});
  document.getElementById("bPulo").addEventListener("mousedown",function(e){e.preventDefault();pular();});
  document.getElementById("reinicia").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── CORRIDA MALUCA (road fighter vertical) ─────────────── */
export function corrida({ nome, sub, noite }) {
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="dist">Distância: 0 m</span>
  <span class="zchip" id="comb">Combustível: 100%</span>
  <span class="zchip" id="vidas">Vidas: 3</span>
  <span class="zchip" id="best">Recorde: 0 m</span>
</div>
<div style="position:relative;max-width:400px;margin:0 auto">
  <canvas class="zc" id="cv" width="400" height="520"></canvas>
  ${hudFim("Fim de jogo")}
</div>
<p class="dim center mt" style="font-size:12.5px">Setas ou A/D para dirigir · pegue combustível · desvie dos carros</p>`;
  const js = `
(function(){
  var cv=document.getElementById("cv");
  var ctx=cv.getContext?cv.getContext("2d"):null;
  if(!ctx){cv.outerHTML="<p class='dim center'>Seu navegador não suporta canvas.</p>";return;}
  var NOITE=${noite ? "true" : "false"};
  var W=400,H=520,PISTA=300,PX=(W-PISTA)/2;
  var px,py,carros,itens,dist,comb,vidas,over,vel,scroll,inv,spawnT,itemT,esq,dir,arr,arr2,best,last;
  var CHAVE="corrida-${noite ? "noite" : "dia"}";
  function zera(){
    px=W/2;py=H-90;carros=[];itens=[];dist=0;comb=100;vidas=3;over=false;
    vel=260;scroll=0;inv=0;spawnT=0.8;itemT=2;esq=false;dir=false;arr=false;arr2=false;
    best=Z.store.best(CHAVE);
    document.getElementById("best").textContent="Recorde: "+Math.floor(best)+" m";
    document.getElementById("fim").classList.add("hidden");
    hud();last=performance.now();requestAnimationFrame(loop);
  }
  function hud(){
    document.getElementById("dist").textContent="Distância: "+Math.floor(dist)+" m";
    document.getElementById("comb").textContent="Combustível: "+Math.max(Math.ceil(comb),0)+"%";
    document.getElementById("vidas").textContent="Vidas: "+vidas;
  }
  function fim(){
    over=true;
    if(dist>best){best=dist;Z.store.setBest(CHAVE,best);}
    document.getElementById("best").textContent="Recorde: "+Math.floor(best)+" m";
    Z.snd(140,0.35,"sawtooth",0.05);
    document.getElementById("fimTxt").innerHTML="Distância: <b class='acc'>"+Math.floor(dist)+" m</b>";
    document.getElementById("fim").classList.remove("hidden");
  }
  function faixaLivre(){
    var faixas=[0,1,2,3],ok=[];
    for(var f=0;f<4;f++){
      var x=PX+37.5+f*75,livre=true;
      for(var i=0;i<carros.length;i++){if(Math.abs(carros[i].x-x)<70&&carros[i].y<160){livre=false;break;}}
      if(livre)ok.push(f);
    }
    return ok.length?ok[Math.floor(Math.random()*ok.length)]:-1;
  }
  function passo(dt){
    vel=Math.min(520,260+dist*0.35);
    dist+=vel*dt*0.5;scroll=(scroll+vel*dt)%48;
    comb-=dt*2.6;
    if(comb<=0){comb=0;hud();fim();return;}
    if(inv>0)inv-=dt;
    var vx=0;if(esq)vx-=1;if(dir)vx+=1;
    px=Math.max(PX+24,Math.min(PX+PISTA-24,px+vx*300*dt));
    var vy=0;if(arr)vy-=1;if(arr2)vy+=1;
    py=Math.max(H-200,Math.min(H-60,py+vy*220*dt));
    spawnT-=dt;
    if(spawnT<=0){
      spawnT=Math.max(0.42,1.05-dist*0.0006);
      var f=faixaLivre();
      if(f>=0)carros.push({x:PX+37.5+f*75,y:-70,vc:vel*(0.45+Math.random()*0.2),cor:["#f87171","#38bdf8","#fbbf24","#a78bfa"][Math.floor(Math.random()*4)]});
    }
    itemT-=dt;
    if(itemT<=0){
      itemT=3.5+Math.random()*2.5;
      var f2=Math.floor(Math.random()*4);
      itens.push({x:PX+37.5+f2*75,y:-30,tipo:Math.random()<0.6?"comb":"moeda"});
    }
    var i;
    for(i=carros.length-1;i>=0;i--){
      var c=carros[i];
      c.y+=(vel-c.vc)*dt;
      if(c.y>H+80){carros.splice(i,1);continue;}
      if(inv<=0&&Math.abs(c.x-px)<44&&Math.abs(c.y-py)<62){
        vidas--;hud();Z.snd(120,0.3,"sawtooth",0.06);
        carros.splice(i,1);
        if(vidas<=0){fim();return;}
        inv=1.8;
      }
    }
    for(i=itens.length-1;i>=0;i--){
      var it=itens[i];
      it.y+=vel*0.85*dt;
      if(it.y>H+30){itens.splice(i,1);continue;}
      if(Math.abs(it.x-px)<34&&Math.abs(it.y-py)<44){
        if(it.tipo==="comb"){comb=Math.min(100,comb+32);Z.snd(660,0.1,"sine",0.05);}
        else{dist+=60;Z.snd(990,0.08,"sine",0.05);}
        itens.splice(i,1);hud();
      }
    }
    hud();
  }
  function carro(x,y,cor,jogador){
    ctx.fillStyle="rgba(0,0,0,0.4)";
    ctx.beginPath();ctx.roundRect(x-21,y-29,42,62,9);ctx.fill();
    ctx.fillStyle=cor;
    ctx.beginPath();ctx.roundRect(x-19,y-31,38,58,8);ctx.fill();
    ctx.fillStyle="rgba(255,255,255,0.35)";
    ctx.beginPath();ctx.roundRect(x-15,jogador?y-24:y+2,30,14,4);ctx.fill();
    ctx.fillStyle="#0b0f0d";
    ctx.fillRect(x-23,y-22,5,12);ctx.fillRect(x+18,y-22,5,12);
    ctx.fillRect(x-23,y+10,5,12);ctx.fillRect(x+18,y+10,5,12);
    if(jogador||!NOITE){ctx.fillStyle="#fef9c3";ctx.fillRect(x-15,y+(jogador?-33:25),10,4);ctx.fillRect(x+5,y+(jogador?-33:25),10,4);}
    else{ctx.fillStyle="#ef4444";ctx.fillRect(x-15,y+25,10,4);ctx.fillRect(x+5,y+25,10,4);}
  }
  function desenha(){
    ctx.fillStyle=NOITE?"#05080a":"#0c1410";ctx.fillRect(0,0,W,H);
    ctx.fillStyle=NOITE?"#0a0f0c":"#10231a";ctx.fillRect(0,0,PX,H);ctx.fillRect(PX+PISTA,0,PX,H);
    ctx.fillStyle=NOITE?"#111715":"#16281f";ctx.fillRect(PX,0,PISTA,H);
    ctx.fillStyle=NOITE?"rgba(251,191,36,0.5)":"rgba(251,191,36,0.7)";
    ctx.fillRect(PX+4,0,3,H);ctx.fillRect(PX+PISTA-7,0,3,H);
    ctx.fillStyle=NOITE?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.45)";
    for(var f=1;f<4;f++)for(var y=-48;y<H+48;y+=48)ctx.fillRect(PX+f*75-2,y+scroll,4,24);
    var i;
    for(i=0;i<itens.length;i++){
      var it=itens[i];
      if(it.tipo==="comb"){
        ctx.fillStyle="#ef4444";ctx.beginPath();ctx.roundRect(it.x-9,it.y-11,18,22,4);ctx.fill();
        ctx.fillStyle="#fff";ctx.font="700 12px Inter,sans-serif";ctx.textAlign="center";ctx.fillText("F",it.x,it.y+4);
      }else{
        ctx.fillStyle="#fbbf24";ctx.beginPath();ctx.arc(it.x,it.y,9,0,7);ctx.fill();
        ctx.fillStyle="#92400e";ctx.fillRect(it.x-1,it.y-5,2,10);
      }
    }
    for(i=0;i<carros.length;i++)carro(carros[i].x,carros[i].y,carros[i].cor,false);
    if(inv<=0||Math.floor(performance.now()/120)%2===0)carro(px,py,"#34d399",true);
    if(NOITE){
      var g=ctx.createRadialGradient(px,py-40,40,px,py-40,260);
      g.addColorStop(0,"rgba(254,249,195,0.10)");g.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=g;ctx.fillRect(PX,0,PISTA,py);
    }
  }
  function loop(ts){
    if(over)return;
    var dt=Math.min((ts-last)/1000,0.05);last=ts;
    passo(dt);if(over)return;desenha();
    requestAnimationFrame(loop);
  }
  function movePara(clientX){
    var r=cv.getBoundingClientRect();
    px=Math.max(PX+24,Math.min(PX+PISTA-24,(clientX-r.left)*(W/r.width)));
  }
  cv.addEventListener("touchstart",function(e){movePara(e.touches[0].clientX);},{passive:true});
  cv.addEventListener("touchmove",function(e){movePara(e.touches[0].clientX);},{passive:true});
  document.addEventListener("keydown",function(e){
    if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","a","d","w","s"].indexOf(e.key)>=0)e.preventDefault();
    if(e.key==="ArrowLeft"||e.key==="a")esq=true;
    if(e.key==="ArrowRight"||e.key==="d")dir=true;
    if(e.key==="ArrowUp"||e.key==="w")arr=true;
    if(e.key==="ArrowDown"||e.key==="s")arr2=true;
  });
  document.addEventListener("keyup",function(e){
    if(e.key==="ArrowLeft"||e.key==="a")esq=false;
    if(e.key==="ArrowRight"||e.key==="d")dir=false;
    if(e.key==="ArrowUp"||e.key==="w")arr=false;
    if(e.key==="ArrowDown"||e.key==="s")arr2=false;
  });
  document.getElementById("reinicia").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── SOBREVIVA AOS ZUMBIS (arena survival) ──────────────── */
export function zumbis({ nome, sub, dificil }) {
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="onda">Onda: 1</span>
  <span class="zchip" id="hp">Vida: 100</span>
  <span class="zchip" id="kills">Abates: 0</span>
  <span class="zchip" id="best">Recorde: 0</span>
</div>
<div style="position:relative;max-width:440px;margin:0 auto">
  <canvas class="zc" id="cv" width="440" height="440"></canvas>
  ${hudFim("Fim de jogo")}
</div>
<p class="dim center mt" style="font-size:12.5px">WASD, setas ou arraste para mover · o tiro é automático no zumbi mais próximo</p>`;
  const js = `
(function(){
  var cv=document.getElementById("cv");
  var ctx=cv.getContext?cv.getContext("2d"):null;
  if(!ctx){cv.outerHTML="<p class='dim center'>Seu navegador não suporta canvas.</p>";return;}
  var DIFICIL=${dificil ? "true" : "false"};
  var W=440,H=440;
  var px,py,zs,balas,curas,hp,onda,kills,restam,tiroT,rapido,over,teclas,alvo,best,last,ondaT;
  var CHAVE="zumbis-${dificil ? "noite" : "normal"}";
  function zera(){
    px=W/2;py=H/2;zs=[];balas=[];curas=[];hp=100;onda=0;kills=0;
    tiroT=0;rapido=0;over=false;teclas={};alvo=null;ondaT=0;
    best=Z.store.best(CHAVE);
    document.getElementById("best").textContent="Recorde: "+best;
    document.getElementById("fim").classList.add("hidden");
    novaOnda();hud();last=performance.now();requestAnimationFrame(loop);
  }
  function novaOnda(){
    onda++;ondaT=0;
    var n=3+onda*2;
    for(var i=0;i<n;i++){
      var lado=Math.floor(Math.random()*4),ex,ey;
      if(lado===0){ex=-16;ey=Math.random()*H;}else if(lado===1){ex=W+16;ey=Math.random()*H;}
      else if(lado===2){ex=Math.random()*W;ey=-16;}else{ex=Math.random()*W;ey=H+16;}
      var tipo="z";
      if(onda>=5&&Math.random()<0.15)tipo="t";
      else if(onda>=3&&Math.random()<0.3)tipo="r";
      zs.push({x:ex,y:ey,
        hp:tipo==="t"?6:(tipo==="r"?1:2),
        v:(tipo==="t"?42:(tipo==="r"?105:62))*(DIFICIL?1.25:1)*(1+onda*0.04),
        r:tipo==="t"?15:(tipo==="r"?7:10),tipo:tipo,danoT:0});
    }
    restam=n;hud();
    Z.toast("Onda "+onda);
  }
  function hud(){
    document.getElementById("onda").textContent="Onda: "+onda;
    document.getElementById("hp").textContent="Vida: "+Math.max(Math.ceil(hp),0);
    document.getElementById("kills").textContent="Abates: "+kills;
  }
  function fim(){
    over=true;
    if(kills>best){best=kills;Z.store.setBest(CHAVE,best);}
    document.getElementById("best").textContent="Recorde: "+best;
    Z.snd(140,0.35,"sawtooth",0.05);
    document.getElementById("fimTitulo").textContent="Você caiu!";
    document.getElementById("fimTxt").innerHTML="Abates: <b class='acc'>"+kills+"</b> · Onda <b class='acc'>"+onda+"</b>";
    document.getElementById("fim").classList.remove("hidden");
  }
  function passo(dt){
    var vx=0,vy=0;
    if(teclas.l)vx-=1;if(teclas.r)vx+=1;if(teclas.u)vy-=1;if(teclas.d)vy+=1;
    if(vx||vy){var m=Math.hypot(vx,vy);vx/=m;vy/=m;}
    else if(alvo){var dx=alvo.x-px,dy=alvo.y-py,d=Math.hypot(dx,dy);if(d>10){vx=dx/d;vy=dy/d;}}
    px=Math.max(14,Math.min(W-14,px+vx*190*dt));
    py=Math.max(14,Math.min(H-14,py+vy*190*dt));
    if(rapido>0)rapido-=dt;
    tiroT-=dt;
    var alvo2=null,md=1e9,i;
    for(i=0;i<zs.length;i++){var dd=Math.hypot(zs[i].x-px,zs[i].y-py);if(dd<md){md=dd;alvo2=zs[i];}}
    if(alvo2&&tiroT<=0){
      tiroT=rapido>0?0.11:0.22;
      var a=Math.atan2(alvo2.y-py,alvo2.x-px);
      balas.push({x:px,y:py,vx:Math.cos(a)*520,vy:Math.sin(a)*520});
      Z.snd(880+Math.random()*120,0.04,"square",0.02);
    }
    for(i=balas.length-1;i>=0;i--){
      var b=balas[i];
      b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(b.x<-10||b.x>W+10||b.y<-10||b.y>H+10){balas.splice(i,1);continue;}
      for(var j=zs.length-1;j>=0;j--){
        var z=zs[j];
        if(Math.hypot(b.x-z.x,b.y-z.y)<z.r+3){
          balas.splice(i,1);z.hp--;
          if(z.hp<=0){
            zs.splice(j,1);kills++;restam--;hud();
            Z.snd(200,0.08,"sawtooth",0.03);
            if(Math.random()<0.06)curas.push({x:z.x,y:z.y,tipo:"vida",t:12});
            else if(Math.random()<0.05)curas.push({x:z.x,y:z.y,tipo:"rap",t:12});
          }
          break;
        }
      }
    }
    for(i=0;i<zs.length;i++){
      var z2=zs[i];
      var ddx=px-z2.x,ddy=py-z2.y,ddd=Math.hypot(ddx,ddy)||1;
      z2.x+=ddx/ddd*z2.v*dt;z2.y+=ddy/ddd*z2.v*dt;
      if(z2.danoT>0)z2.danoT-=dt;
      if(ddd<z2.r+10&&z2.danoT<=0){
        z2.danoT=0.8;hp-=z2.tipo==="t"?22:10;hud();
        Z.snd(130,0.15,"sawtooth",0.05);
        if(hp<=0){hp=0;hud();fim();return;}
      }
    }
    for(i=curas.length-1;i>=0;i--){
      var cu=curas[i];cu.t-=dt;
      if(cu.t<=0){curas.splice(i,1);continue;}
      if(Math.hypot(cu.x-px,cu.y-py)<18){
        if(cu.tipo==="vida"){hp=Math.min(100,hp+30);Z.toast("+30 de vida");}
        else{rapido=8;Z.toast("Tiro rápido!");}
        curas.splice(i,1);hud();
      }
    }
    if(!zs.length){
      ondaT+=dt;
      if(ondaT>1.6)novaOnda();
    }
  }
  function desenha(){
    ctx.fillStyle=DIFICIL?"#05080a":"#070b09";ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="rgba(255,255,255,0.045)";ctx.lineWidth=1;
    for(var g=0;g<W;g+=40){ctx.beginPath();ctx.moveTo(g,0);ctx.lineTo(g,H);ctx.stroke();ctx.beginPath();ctx.moveTo(0,g);ctx.lineTo(W,g);ctx.stroke();}
    var i;
    for(i=0;i<curas.length;i++){
      var cu=curas[i];
      ctx.fillStyle=cu.tipo==="vida"?"#ef4444":"#fbbf24";
      ctx.beginPath();ctx.roundRect(cu.x-8,cu.y-8,16,16,4);ctx.fill();
      ctx.fillStyle="#fff";ctx.font="700 11px Inter,sans-serif";ctx.textAlign="center";
      ctx.fillText(cu.tipo==="vida"?"+":"»",cu.x,cu.y+4);
    }
    for(i=0;i<balas.length;i++){
      ctx.fillStyle="#fef9c3";ctx.beginPath();ctx.arc(balas[i].x,balas[i].y,3,0,7);ctx.fill();
    }
    for(i=0;i<zs.length;i++){
      var z=zs[i];
      ctx.fillStyle=z.tipo==="t"?"#7f1d1d":(z.tipo==="r"?"#4d7c0f":"#3f6212");
      ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,7);ctx.fill();
      ctx.fillStyle="#a3e635";
      var a=Math.atan2(py-z.y,px-z.x);
      ctx.beginPath();ctx.arc(z.x+Math.cos(a-0.4)*z.r*0.45,z.y+Math.sin(a-0.4)*z.r*0.45,1.8,0,7);
      ctx.arc(z.x+Math.cos(a+0.4)*z.r*0.45,z.y+Math.sin(a+0.4)*z.r*0.45,1.8,0,7);ctx.fill();
    }
    ctx.fillStyle="#38bdf8";ctx.beginPath();ctx.arc(px,py,10,0,7);ctx.fill();
    ctx.fillStyle="#082f49";ctx.beginPath();ctx.arc(px,py,4,0,7);ctx.fill();
    ctx.fillStyle="rgba(0,0,0,0.5)";ctx.fillRect(14,14,120,10);
    ctx.fillStyle=hp>50?"#4ade80":(hp>25?"#fbbf24":"#f87171");
    ctx.fillRect(14,14,120*Math.max(hp,0)/100,10);
  }
  function loop(ts){
    if(over)return;
    var dt=Math.min((ts-last)/1000,0.05);last=ts;
    passo(dt);if(over)return;desenha();
    requestAnimationFrame(loop);
  }
  function pos(e){var r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*(W/r.width),y:(e.clientY-r.top)*(H/r.height)};}
  cv.addEventListener("touchstart",function(e){alvo=pos(e.touches[0]);},{passive:true});
  cv.addEventListener("touchmove",function(e){alvo=pos(e.touches[0]);},{passive:true});
  cv.addEventListener("touchend",function(){alvo=null;},{passive:true});
  Z.onKey({
    ArrowLeft:function(){teclas.l=true},ArrowRight:function(){teclas.r=true},ArrowUp:function(){teclas.u=true},ArrowDown:function(){teclas.d=true},
    a:function(){teclas.l=true},d:function(){teclas.r=true},w:function(){teclas.u=true},s:function(){teclas.d=true}});
  document.addEventListener("keyup",function(e){
    var k=e.key;
    if(k==="ArrowLeft"||k==="a")teclas.l=false;
    if(k==="ArrowRight"||k==="d")teclas.r=false;
    if(k==="ArrowUp"||k==="w")teclas.u=false;
    if(k==="ArrowDown"||k==="s")teclas.d=false;
  });
  document.getElementById("reinicia").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── ESQUADRÃO ESTELAR (shmup vertical) ─────────────────── */
export function shmup({ nome, sub, turbo }) {
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="score">Pontos: 0</span>
  <span class="zchip" id="onda">Onda: 1</span>
  <span class="zchip" id="vidas">Vidas: 3</span>
  <span class="zchip" id="best">Recorde: 0</span>
</div>
<div style="position:relative;max-width:400px;margin:0 auto">
  <canvas class="zc" id="cv" width="400" height="520"></canvas>
  ${hudFim("Fim de jogo")}
</div>
<p class="dim center mt" style="font-size:12.5px">Mouse, toque ou setas para mover · tiro automático · sobreviva às ondas</p>`;
  const js = `
(function(){
  var cv=document.getElementById("cv");
  var ctx=cv.getContext?cv.getContext("2d"):null;
  if(!ctx){cv.outerHTML="<p class='dim center'>Seu navegador não suporta canvas.</p>";return;}
  var TURBO=${turbo ? "true" : "false"};
  var W=400,H=520;
  var px,py,balas,tiros,ini,pows,estrelas,score,onda,vidas,over,tiroT,duplo,escudo,inv,chefe,chefeHp,ondaT,spawnT,best,last,esq,dir,cima,baixo;
  var CHAVE="shmup-${turbo ? "turbo" : "normal"}";
  function zera(){
    px=W/2;py=H-70;balas=[];tiros=[];ini=[];pows=[];
    score=0;onda=0;vidas=3;over=false;tiroT=0;duplo=0;escudo=0;inv=0;
    chefe=null;chefeHp=0;ondaT=0;spawnT=0;esq=false;dir=false;cima=false;baixo=false;
    estrelas=[];
    for(var i=0;i<70;i++)estrelas.push({x:Math.random()*W,y:Math.random()*H,v:30+Math.random()*90});
    best=Z.store.best(CHAVE);
    document.getElementById("best").textContent="Recorde: "+best;
    document.getElementById("fim").classList.add("hidden");
    novaOnda();hud();last=performance.now();requestAnimationFrame(loop);
  }
  function novaOnda(){
    onda++;ondaT=0;spawnT=0;
    if(onda%5===0){
      chefe={x:W/2,y:-50,hp:26+onda*4,max:26+onda*4,t:0,tiro:1.4};
      chefeHp=chefe.hp;Z.toast("Chefe se aproxima!");
    }
    hud();
  }
  function hud(){
    document.getElementById("score").textContent="Pontos: "+score;
    document.getElementById("onda").textContent="Onda: "+onda;
    document.getElementById("vidas").textContent="Vidas: "+vidas;
  }
  function fim(){
    over=true;
    if(score>best){best=score;Z.store.setBest(CHAVE,best);}
    document.getElementById("best").textContent="Recorde: "+best;
    Z.snd(140,0.35,"sawtooth",0.05);
    document.getElementById("fimTxt").innerHTML="Pontos: <b class='acc'>"+score+"</b> · Onda <b class='acc'>"+onda+"</b>";
    document.getElementById("fim").classList.remove("hidden");
  }
  function dano(){
    if(inv>0||over)return;
    if(escudo>0){escudo=0;Z.snd(300,0.15,"square",0.05);inv=1;return;}
    vidas--;hud();Z.snd(120,0.3,"sawtooth",0.06);
    if(vidas<=0){fim();return;}
    inv=2;
  }
  function passo(dt){
    var i;
    for(i=0;i<estrelas.length;i++){estrelas[i].y+=estrelas[i].v*dt;if(estrelas[i].y>H){estrelas[i].y=0;estrelas[i].x=Math.random()*W;}}
    var vx=0,vy=0;
    if(esq)vx-=1;if(dir)vx+=1;if(cima)vy-=1;if(baixo)vy+=1;
    px=Math.max(16,Math.min(W-16,px+vx*300*dt));
    py=Math.max(H/2,Math.min(H-30,py+vy*300*dt));
    if(inv>0)inv-=dt;if(duplo>0)duplo-=dt;if(escudo>0)escudo-=dt;
    tiroT-=dt;
    if(tiroT<=0){
      tiroT=duplo>0?0.13:0.2;
      balas.push({x:px,y:py-16,vx:0,vy:-460});
      if(duplo>0){balas.push({x:px-10,y:py-10,vx:-40,vy:-440});balas.push({x:px+10,y:py-10,vx:40,vy:-440});}
    }
    if(!chefe){
      spawnT-=dt;ondaT+=dt;
      if(spawnT<=0&&ondaT<14){
        spawnT=Math.max(0.3,(TURBO?0.7:1.0)-onda*0.04);
        var tipo=Math.random();
        if(tipo<0.45)ini.push({x:30+Math.random()*(W-60),y:-24,t:"reto",hp:1,v:120+onda*6,t:0});
        else if(tipo<0.75)ini.push({x:Math.random()<0.5?30:W-30,y:-24,t:"seno",hp:2,v:100+onda*5,t:0,dir:Math.random()<0.5?1:-1});
        else ini.push({x:60+Math.random()*(W-120),y:-24,t:"tank",hp:5,v:55+onda*3,t:0,tiro:1});
      }
      if(ondaT>=14&&!ini.length&&!tiros.length){novaOnda();return;}
    }
    for(i=balas.length-1;i>=0;i--){
      var b=balas[i];
      b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(b.y<-12){balas.splice(i,1);continue;}
      var acertou=false;
      for(var j=ini.length-1;j>=0;j--){
        var e=ini[j];
        if(Math.abs(b.x-e.x)<16&&Math.abs(b.y-e.y)<16){
          balas.splice(i,1);acertou=true;e.hp--;
          if(e.hp<=0){
            ini.splice(j,1);score+=e.t==="tank"?150:50;hud();
            Z.snd(240,0.07,"sawtooth",0.03);
            if(Math.random()<0.12)pows.push({x:e.x,y:e.y,tipo:["duplo","escudo","vida"][Math.floor(Math.random()*3)],vy:90});
          }
          break;
        }
      }
      if(acertou)continue;
      if(chefe&&Math.abs(b.x-chefe.x)<44&&b.y>chefe.y-24&&b.y<chefe.y+24){
        balas.splice(i,1);chefe.hp--;chefeHp=chefe.hp;
        if(chefe.hp<=0){
          score+=1000;hud();Z.snd(880,0.25,"sine",0.05);
          chefe=null;
          for(var k=0;k<3;k++)pows.push({x:W/2-40+k*40,y:120,tipo:["duplo","escudo","vida"][k],vy:70});
        }
      }
    }
    for(i=ini.length-1;i>=0;i--){
      var e2=ini[i];e2.t+=dt;
      if(e2.t==="seno"){e2.x+=e2.dir*140*dt;e2.y+=e2.v*dt;if(e2.x<20||e2.x>W-20)e2.dir*=-1;}
      else e2.y+=e2.v*dt;
      if(e2.t==="tank"){
        e2.tiro-=dt;
        if(e2.tiro<=0&&e2.y>0&&e2.y<H/2){
          e2.tiro=1.6;
          var a=Math.atan2(py-e2.y,px-e2.x);
          tiros.push({x:e2.x,y:e2.y+10,vx:Math.cos(a)*170,vy:Math.sin(a)*170});
        }
      }
      if(e2.y>H+30){ini.splice(i,1);continue;}
      if(Math.abs(e2.x-px)<24&&Math.abs(e2.y-py)<24){ini.splice(i,1);dano();if(over)return;}
    }
    if(chefe){
      chefe.t+=dt;
      chefe.y=Math.min(110,chefe.y+60*dt);
      chefe.x=W/2+Math.sin(chefe.t*1.2)*(W/2-70);
      chefe.tiro-=dt;
      if(chefe.tiro<=0&&chefe.y>60){
        chefe.tiro=TURBO?0.9:1.3;
        for(var s=0;s<5;s++){
          var aa=Math.PI/2+(s-2)*0.35;
          tiros.push({x:chefe.x,y:chefe.y+20,vx:Math.cos(aa)*190,vy:Math.sin(aa)*190});
        }
        Z.snd(180,0.12,"sawtooth",0.04);
      }
      if(Math.abs(chefe.x-px)<50&&Math.abs(chefe.y-py)<30){dano();if(over)return;}
    }
    for(i=tiros.length-1;i>=0;i--){
      var t=tiros[i];
      t.x+=t.vx*dt;t.y+=t.vy*dt;
      if(t.y>H+12||t.y<-12||t.x<-12||t.x>W+12){tiros.splice(i,1);continue;}
      if(Math.abs(t.x-px)<12&&Math.abs(t.y-py)<12){tiros.splice(i,1);dano();if(over)return;}
    }
    for(i=pows.length-1;i>=0;i--){
      var p=pows[i];
      p.y+=p.vy*dt;
      if(p.y>H+16){pows.splice(i,1);continue;}
      if(Math.abs(p.x-px)<22&&Math.abs(p.y-py)<22){
        if(p.tipo==="duplo"){duplo=12;Z.toast("Tiro duplo!");}
        else if(p.tipo==="escudo"){escudo=12;Z.toast("Escudo ativo!");}
        else{vidas=Math.min(5,vidas+1);hud();Z.toast("+1 vida!");}
        Z.snd(760,0.1,"sine",0.05);
        pows.splice(i,1);
      }
    }
    if(onda%5===0&&chefe===null&&!tiros.length&&!ini.length){
      var espera=(passo._e=(passo._e||0)+dt);
      if(espera>1.2){passo._e=0;novaOnda();}
    } else passo._e=0;
  }
  function desenha(){
    ctx.fillStyle="#05070f";ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(255,255,255,0.5)";
    for(var i=0;i<estrelas.length;i++)ctx.fillRect(estrelas[i].x,estrelas[i].y,2,2);
    for(i=0;i<pows.length;i++){
      var p=pows[i];
      ctx.fillStyle=p.tipo==="duplo"?"#38bdf8":(p.tipo==="escudo"?"#4ade80":"#f87171");
      ctx.beginPath();ctx.roundRect(p.x-10,p.y-10,20,20,6);ctx.fill();
      ctx.fillStyle="#04120c";ctx.font="700 12px Inter,sans-serif";ctx.textAlign="center";
      ctx.fillText(p.tipo==="duplo"?"2":(p.tipo==="escudo"?"E":"+"),p.x,p.y+4);
    }
    for(i=0;i<ini.length;i++){
      var e=ini[i];
      ctx.fillStyle=e.t==="tank"?"#b91c1c":(e.t==="seno"?"#c026d3":"#e11d48");
      ctx.beginPath();
      ctx.moveTo(e.x,e.y+12);ctx.lineTo(e.x-12,e.y-8);ctx.lineTo(e.x+12,e.y-8);
      ctx.closePath();ctx.fill();
    }
    if(chefe){
      ctx.fillStyle="#7f1d1d";
      ctx.beginPath();ctx.roundRect(chefe.x-44,chefe.y-22,88,44,10);ctx.fill();
      ctx.fillStyle="#ef4444";ctx.fillRect(chefe.x-30,chefe.y-6,60,12);
      ctx.fillStyle="#fecaca";ctx.fillRect(chefe.x-6,chefe.y-14,12,8);
      ctx.fillStyle="rgba(0,0,0,0.5)";ctx.fillRect(40,16,W-80,8);
      ctx.fillStyle="#ef4444";ctx.fillRect(40,16,(W-80)*Math.max(chefeHp,0)/chefe.max,8);
    }
    for(i=0;i<tiros.length;i++){
      ctx.fillStyle="#f87171";ctx.beginPath();ctx.arc(tiros[i].x,tiros[i].y,4.5,0,7);ctx.fill();
    }
    for(i=0;i<balas.length;i++){
      ctx.fillStyle="#a7f3d0";ctx.fillRect(balas[i].x-2,balas[i].y-8,4,12);
    }
    if(inv<=0||Math.floor(performance.now()/120)%2===0){
      ctx.fillStyle="#34d399";
      ctx.beginPath();
      ctx.moveTo(px,py-16);ctx.lineTo(px-11,py+10);ctx.lineTo(px,py+4);ctx.lineTo(px+11,py+10);
      ctx.closePath();ctx.fill();
    }
    if(escudo>0){ctx.strokeStyle="rgba(74,222,128,0.8)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,20,0,7);ctx.stroke();}
  }
  function loop(ts){
    if(over)return;
    var dt=Math.min((ts-last)/1000,0.05);last=ts;
    passo(dt);if(over)return;desenha();
    requestAnimationFrame(loop);
  }
  function movePara(clientX,clientY){
    var r=cv.getBoundingClientRect();
    px=Math.max(16,Math.min(W-16,(clientX-r.left)*(W/r.width)));
    py=Math.max(H/2,Math.min(H-30,(clientY-r.top)*(H/r.height)));
  }
  cv.addEventListener("mousemove",function(e){if(e.buttons)movePara(e.clientX,e.clientY)});
  cv.addEventListener("touchstart",function(e){movePara(e.touches[0].clientX,e.touches[0].clientY)},{passive:true});
  cv.addEventListener("touchmove",function(e){movePara(e.touches[0].clientX,e.touches[0].clientY)},{passive:true});
  document.addEventListener("keydown",function(e){
    if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].indexOf(e.key)>=0)e.preventDefault();
    if(e.key==="ArrowLeft")esq=true;
    if(e.key==="ArrowRight")dir=true;
    if(e.key==="ArrowUp")cima=true;
    if(e.key==="ArrowDown")baixo=true;
  });
  document.addEventListener("keyup",function(e){
    if(e.key==="ArrowLeft")esq=false;
    if(e.key==="ArrowRight")dir=false;
    if(e.key==="ArrowUp")cima=false;
    if(e.key==="ArrowDown")baixo=false;
  });
  document.getElementById("reinicia").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── MINI-GOLFE ─────────────────────────────────────────── */
const GOLFE_BURACOS = [
  [ // pack 0
    { w: [], s: [], b: [210, 60], p: [210, 386], par: 2 },
    { w: [[20, 180, 280, 16], [124, 290, 276, 16]], s: [], b: [210, 50], p: [210, 386], par: 3 },
    { w: [[200, 60, 16, 220]], s: [], b: [100, 60], p: [320, 386], par: 3 },
    { w: [], s: [[130, 170, 160, 120]], b: [210, 60], p: [210, 386], par: 3 },
    { w: [[150, 60, 120, 12], [150, 128, 120, 12], [150, 72, 12, 20], [150, 108, 12, 20], [258, 72, 12, 20], [258, 108, 12, 20]], s: [], b: [210, 94], p: [210, 386], par: 4 },
    { w: [[20, 140, 260, 14], [140, 230, 260, 14], [20, 320, 260, 14]], s: [], b: [320, 55], p: [100, 390], par: 4 },
  ],
  [ // pack 1
    { w: [[150, 40, 14, 360], [256, 40, 14, 360]], s: [[164, 200, 78, 60]], b: [210, 60], p: [210, 386], par: 3 },
    { w: [[20, 150, 300, 14], [80, 260, 320, 14]], s: [], b: [60, 55], p: [350, 390], par: 4 },
    { w: [[140, 80, 12, 120], [248, 80, 12, 120], [140, 188, 120, 12], [140, 80, 50, 12]], s: [], b: [200, 140], p: [210, 386], par: 4 },
    { w: [[20, 330, 240, 14]], s: [[60, 140, 110, 90], [250, 250, 110, 90]], b: [330, 60], p: [100, 390], par: 4 },
    { w: [[203, 80, 14, 90], [203, 220, 14, 60]], s: [], b: [320, 60], p: [100, 390], par: 4 },
    { w: [[20, 120, 280, 14], [120, 240, 280, 14]], s: [[150, 290, 120, 70]], b: [100, 55], p: [320, 390], par: 5 },
  ],
];

export function golfe({ nome, sub, pack }) {
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="bur">Buraco: 1/6</span>
  <span class="zchip" id="tac">Tacadas: 0</span>
  <span class="zchip" id="par">Parcial: 0 (par 0)</span>
</div>
<div style="position:relative;max-width:420px;margin:0 auto">
  <canvas class="zc" id="cv" width="420" height="440"></canvas>
  ${hudFim("Fim de jogo")}
</div>
<p class="dim center mt" style="font-size:12.5px">Arraste para trás a partir da bola e solte para tacar</p>`;
  const js = `
(function(){
  var cv=document.getElementById("cv");
  var ctx=cv.getContext?cv.getContext("2d"):null;
  if(!ctx){cv.outerHTML="<p class='dim center'>Seu navegador não suporta canvas.</p>";return;}
  var BURACOS=${JSON.stringify(GOLFE_BURACOS[pack] || GOLFE_BURACOS[0])};
  var W=420,H=440,R=6;
  var bi,tacadas,total,parTotal,bx,by,vx,vy,mirando,mx,my,over,avancando,last;
  function bordas(){
    return [[0, 0, W, 16], [0, H - 16, W, 16], [0, 0, 16, H], [W - 16, 0, 16, H]];
  }
  function zera(){
    bi=0;tacadas=0;total=0;parTotal=0;over=false;avancando=false;
    document.getElementById("fim").classList.add("hidden");
    novoBuraco();last=performance.now();requestAnimationFrame(loop);
  }
  function novoBuraco(){
    var b=BURACOS[bi];
    bx=b.p[0];by=b.p[1];vx=0;vy=0;tacadas=0;mirando=false;avancando=false;
    hud();
  }
  function hud(){
    document.getElementById("bur").textContent="Buraco: "+(bi+1)+"/6";
    document.getElementById("tac").textContent="Tacadas: "+tacadas+" (par "+BURACOS[bi].par+")";
    var dif=total-parTotal;
    document.getElementById("par").textContent="Parcial: "+total+" ("+(dif===0?"E":(dif>0?"+":"")+dif)+")";
  }
  function fim(){
    over=true;
    var dif=total-parTotal;
    var msg=dif<=-3?"Profissional!":(dif<=0?"Muito bem!":(dif<=4?"Bom jogo!":"Continue treinando!"));
    Z.snd(880,0.3,"sine",0.05);
    document.getElementById("fimTitulo").textContent=msg;
    document.getElementById("fimTxt").innerHTML="Total: <b class='acc'>"+total+"</b> tacadas ("+(dif===0?"E":(dif>0?"+":"")+dif)+")";
    document.getElementById("fim").classList.remove("hidden");
  }
  function naAreia(){
    var bs=BURACOS[bi].s;
    for(var i=0;i<bs.length;i++){var s=bs[i];if(bx>s[0]&&bx<s[0]+s[2]&&by>s[1]&&by<s[1]+s[3])return true;}
    return false;
  }
  function passo(dt){
    if(over||avancando)return;
    var sp=Math.hypot(vx,vy);
    if(sp>0){
      var fr=Math.pow(naAreia()?0.90:0.985,dt*60);
      vx*=fr;vy*=fr;
      if(Math.hypot(vx,vy)<9){vx=0;vy=0;}
      var subs=3;
      for(var k=0;k<subs;k++){
        bx+=vx*dt/subs;by+=vy*dt/subs;
        var muros=bordas().concat(BURACOS[bi].w);
        for(var i=0;i<muros.length;i++){
          var m=muros[i];
          var cx=Math.max(m[0],Math.min(bx,m[0]+m[2])),cy=Math.max(m[1],Math.min(by,m[1]+m[3]));
          var dx=bx-cx,dy=by-cy,d=Math.hypot(dx,dy);
          if(d<R){
            if(d===0){dx=0;dy=-1;d=1;}
            bx=cx+dx/d*R;by=cy+dy/d*R;
            var nx=dx/d,ny=dy/d,dot=vx*nx+vy*ny;
            if(dot<0){vx-=1.75*dot*nx;vy-=1.75*dot*ny;Z.snd(320,0.04,"square",0.025);}
          }
        }
      }
      var b=BURACOS[bi],db=Math.hypot(bx-b.b[0],by-b.b[1]);
      if(db<9&&Math.hypot(vx,vy)<320){
        avancando=true;vx=0;vy=0;
        total+=tacadas;parTotal+=b.par;hud();
        Z.snd(990,0.2,"sine",0.05);
        setTimeout(function(){
          if(over)return;
          if(bi>=5){fim();return;}
          bi++;novoBuraco();
        },1300);
      }
    }
  }
  function desenha(){
    ctx.fillStyle="#0b1a12";ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(74,222,128,0.05)";
    for(var gx=16;gx<W;gx+=32)for(var gy=16;gy<H;gy+=32)ctx.fillRect(gx,gy,2,2);
    var b=BURACOS[bi],i;
    for(i=0;i<b.s.length;i++){
      var s=b.s[i];
      ctx.fillStyle="rgba(251,191,36,0.28)";
      ctx.beginPath();ctx.roundRect(s[0],s[1],s[2],s[3],10);ctx.fill();
    }
    var muros=bordas().concat(b.w);
    for(i=0;i<muros.length;i++){
      var m=muros[i];
      ctx.fillStyle="#1d5c46";ctx.fillRect(m[0],m[1],m[2],m[3]);
      ctx.fillStyle="rgba(255,255,255,0.14)";ctx.fillRect(m[0],m[1],m[2],2);
    }
    ctx.fillStyle="#020604";ctx.beginPath();ctx.arc(b.b[0],b.b[1],9,0,7);ctx.fill();
    ctx.strokeStyle="#fbbf24";ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.b[0],b.b[1],9,0,7);ctx.stroke();
    ctx.strokeStyle="#e5e7eb";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(b.b[0],b.b[1]);ctx.lineTo(b.b[0],b.b[1]-26);ctx.stroke();
    ctx.fillStyle="#ef4444";ctx.beginPath();ctx.moveTo(b.b[0],b.b[1]-26);ctx.lineTo(b.b[0]+14,b.b[1]-21);ctx.lineTo(b.b[0],b.b[1]-16);ctx.fill();
    ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(bx,by,R,0,7);ctx.fill();
    if(mirando){
      var dx=bx-mx,dy=by-my,p=Math.min(Math.hypot(dx,dy),150);
      if(p>8){
        var a=Math.atan2(dy,dx);
        ctx.strokeStyle="#34d399";ctx.lineWidth=3;ctx.setLineDash([7,6]);
        ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(a)*p*1.4,by+Math.sin(a)*p*1.4);ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle="rgba(0,0,0,0.5)";ctx.fillRect(W-30,40,12,140);
        ctx.fillStyle=p>110?"#f87171":(p>70?"#fbbf24":"#4ade80");
        ctx.fillRect(W-30,40+140-140*p/150,12,140*p/150);
      }
    }
    if(avancando){
      ctx.fillStyle="rgba(2,6,4,0.55)";ctx.fillRect(0,0,W,H);
      ctx.fillStyle="#a7f3d0";ctx.font="800 26px Sora,sans-serif";ctx.textAlign="center";
      ctx.fillText(tacadas===1?"Hole in one!":"Buraco "+(bi+1)+"!",W/2,H/2);
    }
  }
  function loop(ts){
    if(over && !avancando && Math.hypot(vx,vy)===0){desenha();return;}
    var dt=Math.min((ts-last)/1000,0.05);last=ts;
    passo(dt);desenha();
    if(!over)requestAnimationFrame(loop);
  }
  function pos(e){
    var r=cv.getBoundingClientRect();
    return {x:(e.clientX-r.left)*(W/r.width),y:(e.clientY-r.top)*(H/r.height)};
  }
  function parado(){return Math.hypot(vx,vy)===0&&!avancando&&!over;}
  cv.addEventListener("mousedown",function(e){
    if(!parado())return;
    var p=pos(e);
    if(Math.hypot(p.x-bx,p.y-by)<40){mirando=true;mx=p.x;my=p.y;}
  });
  cv.addEventListener("mousemove",function(e){if(mirando){var p=pos(e);mx=p.x;my=p.y;}});
  function soltar(){
    if(!mirando)return;mirando=false;
    var dx=bx-mx,dy=by-my,p=Math.min(Math.hypot(dx,dy),150);
    if(p>8){
      var a=Math.atan2(dy,dx),f=p/150*880;
      vx=Math.cos(a)*f;vy=Math.sin(a)*f;
      tacadas++;hud();Z.snd(500,0.06,"square",0.03);
      var b=BURACOS[bi];
      if(tacadas>=b.par+4){
        setTimeout(function(){
          if(!over&&!avancando){avancando=true;total+=tacadas;parTotal+=b.par;
            if(bi>=5){fim();}else{bi++;novoBuraco();}}
        },2500);
      }
    }
  }
  cv.addEventListener("mouseup",soltar);
  cv.addEventListener("mouseleave",function(){mirando=false;});
  cv.addEventListener("touchstart",function(e){
    if(!parado())return;
    var p=pos(e.touches[0]);
    if(Math.hypot(p.x-bx,p.y-by)<48){mirando=true;mx=p.x;my=p.y;e.preventDefault();}
  },{passive:false});
  cv.addEventListener("touchmove",function(e){if(mirando){var p=pos(e.touches[0]);mx=p.x;my=p.y;e.preventDefault();}},{passive:false});
  cv.addEventListener("touchend",function(e){if(mirando){e.preventDefault();soltar();}});
  document.getElementById("reinicia").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── DAMAS (vs CPU, minimax) ────────────────────────────── */
export function damas({ nome, sub, nivel }) {
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="turno">Sua vez</span>
  <span class="zchip">${nivel === "dificil" ? "CPU difícil" : "CPU normal"}</span>
  <span class="zchip" id="placar">Você 12 × 12 CPU</span>
</div>
<div class="zcard pad" style="max-width:440px;margin:0 auto">
  <div id="tab" class="dm-tab"></div>
  <div class="row mt wrap" style="justify-content:center">
    <button class="zbtn ghost sm" id="novo" type="button">Nova partida</button>
  </div>
</div>
<details class="zcard mt" style="max-width:440px;margin-left:auto;margin-right:auto">
  <summary style="cursor:pointer;font-weight:700">Como jogar</summary>
  <p class="dim mt" style="font-size:13.5px">Você é o <b class="acc">verde</b> (embaixo) e sempre começa. Toque numa peça para ver os movimentos. A captura é <b>obrigatória</b>: se der para comer, tem que comer — inclusive em sequência. Peça na última fileira vira <b>dama</b> e anda quantas casas quiser na diagonal. Vence quem comer todas as peças ou travar o adversário.</p>
</details>`;
  const css = `
.dm-tab{display:grid;grid-template-columns:repeat(8,1fr);gap:0;border:1px solid var(--z-line2);border-radius:10px;overflow:hidden}
.dm-c{aspect-ratio:1;border:0;cursor:pointer;padding:0;display:grid;place-items:center;background:#15201b}
.dm-c.claro{background:#24352c;cursor:default}
.dm-c.alvo{cursor:pointer}
.dm-c .pc{width:72%;height:72%;border-radius:50%;display:grid;place-items:center;pointer-events:none}
.dm-c .pc.p{background:radial-gradient(circle at 32% 30%,#6ee7b7,#059669);box-shadow:0 3px 8px rgba(0,0,0,.5)}
.dm-c .pc.c{background:radial-gradient(circle at 32% 30%,#fda4af,#be123c);box-shadow:0 3px 8px rgba(0,0,0,.5)}
.dm-c.sel{outline:3px solid var(--z-acc);outline-offset:-3px}
.dm-c .pc.dama::after{content:"";width:38%;height:38%;border-radius:50%;border:2px solid rgba(255,255,255,.85)}
.dm-c .hint{width:30%;height:30%;border-radius:50%;background:var(--z-acc);opacity:.85;pointer-events:none}
.dm-c .hint.cap{width:82%;height:82%;background:transparent;border:3px solid var(--z-acc);opacity:.9}`;
  const js = `
(function(){
  var PROF=${nivel === "dificil" ? "5" : "3"};
  var tab,turno,sel,movsJog,perc,half,over,lastMove;
  function clona(t){return t.map(function(l){return l.slice()});}
  function dentro(r,c){return r>=0&&r<8&&c>=0&&c<8;}
  function dono(p){return p>0?1:(p<0?-1:0);}
  function rei(p){return Math.abs(p)===2;}
  function novoTab(){
    tab=[];
    for(var r=0;r<8;r++){tab.push([0,0,0,0,0,0,0,0]);}
    for(var a=0;a<3;a++)for(var c=0;c<8;c++)if((a+c)%2===1)tab[a][c]=-1;
    for(var b=5;b<8;b++)for(var c2=0;c2<8;c2++)if((b+c2)%2===1)tab[b][c2]=1;
  }
  function capsDe(t,r,c,s,cap,path,todas,orig){
    var p=t[r][c],achou=false;
    var dirs=[[1,1],[1,-1],[-1,1],[-1,-1]];
    if(!rei(p)){
      for(var i=0;i<4;i++){
        var r2=r+2*dirs[i][0],c2=c+2*dirs[i][1];
        if(dentro(r2,c2)&&dono(t[r+dirs[i][0]][c+dirs[i][1]])===-s&&t[r2][c2]===0){
          achou=true;
          var nt=clona(t);nt[r+dirs[i][0]][c+dirs[i][1]]=0;nt[r][c]=0;nt[r2][c2]=p;
          capsDe(nt,r2,c2,s,cap.concat([[r+dirs[i][0],c+dirs[i][1]]]),path.concat([[r2,c2]]),todas,orig);
        }
      }
    }else{
      for(var j=0;j<4;j++){
        var dr=dirs[j][0],dc=dirs[j][1];
        var rr=r+dr,cc=c+dc;
        while(dentro(rr,cc)&&t[rr][cc]===0){rr+=dr;cc+=dc;}
        if(!dentro(rr,cc)||dono(t[rr][cc])!==-s)continue;
        var lr=rr+dr,lc=cc+dc,tem=false;
        while(dentro(lr,lc)&&t[lr][lc]===0){
          tem=true;
          var nt2=clona(t);nt2[rr][cc]=0;nt2[r][c]=0;nt2[lr][lc]=p;
          capsDe(nt2,lr,lc,s,cap.concat([[rr,cc]]),path.concat([[lr,lc]]),todas,orig);
          lr+=dr;lc+=dc;
        }
        if(tem)achou=true;
      }
    }
    if(!achou&&cap.length)todas.push({orig:orig,seq:path,cap:cap});
  }
  function movSimples(t,r,c,s){
    var p=t[r][c],out=[];
    if(!rei(p)){
      var dr=s===1?-1:1;
      for(var dc=-1;dc<=1;dc+=2){
        if(dentro(r+dr,c+dc)&&t[r+dr][c+dc]===0)out.push({orig:[r,c],seq:[[r+dr,c+dc]],cap:[]});
      }
    }else{
      var dirs=[[1,1],[1,-1],[-1,1],[-1,-1]];
      for(var i=0;i<4;i++){
        var nr=r+dirs[i][0],nc=c+dirs[i][1];
        while(dentro(nr,nc)&&t[nr][nc]===0){out.push({orig:[r,c],seq:[[nr,nc]],cap:[]});nr+=dirs[i][0];nc+=dirs[i][1];}
      }
    }
    return out;
  }
  function todosMovimentos(t,s){
    var caps=[];
    for(var r=0;r<8;r++)for(var c=0;c<8;c++)if(dono(t[r][c])===s)capsDe(t,r,c,s,[],[],caps,[r,c]);
    if(caps.length)return caps;
    var mv=[];
    for(var a=0;a<8;a++)for(var b=0;b<8;b++)if(dono(t[a][b])===s)mv=mv.concat(movSimples(t,a,b,s));
    return mv;
  }
  function aplica(t,mv){
    var nt=clona(t),p=nt[mv.orig[0]][mv.orig[1]];
    nt[mv.orig[0]][mv.orig[1]]=0;
    for(var i=0;i<mv.cap.length;i++)nt[mv.cap[i][0]][mv.cap[i][1]]=0;
    var f=mv.seq[mv.seq.length-1];
    if(Math.abs(p)===1&&((p>0&&f[0]===0)||(p<0&&f[0]===7)))p=p>0?2:-2;
    nt[f[0]][f[1]]=p;
    return nt;
  }
  function valor(t,s){
    var v=0;
    for(var r=0;r<8;r++)for(var c=0;c<8;c++){
      var p=t[r][c];if(!p)continue;
      var base=Math.abs(p)===2?300:100;
      var av=Math.abs(p)===2?0:((p>0)?(7-r)*6:r*6);
      var centro=(c>=2&&c<=5)?4:0;
      v+=(base+av+centro)*(p>0?1:-1);
    }
    return v*s;
  }
  function nega(t,s,prof,alfa,beta){
    var mvs=todosMovimentos(t,s);
    if(!mvs.length)return -10000-prof;
    if(prof===0)return valor(t,s);
    var melhor=-1e9;
    for(var i=0;i<mvs.length;i++){
      var v=-nega(aplica(t,mvs[i]),-s,prof-1,-beta,-alfa);
      if(v>melhor)melhor=v;
      if(melhor>alfa)alfa=melhor;
      if(alfa>=beta)break;
    }
    return melhor;
  }
  function escolheCPU(){
    var mvs=todosMovimentos(tab,-1),melhor=null,mv=-1e9;
    var ord=Z.shuffle(mvs);
    for(var i=0;i<ord.length;i++){
      var v=-nega(aplica(tab,ord[i]),1,PROF-1,-1e9,1e9);
      if(v>mv){mv=v;melhor=ord[i];}
    }
    return melhor;
  }
  function contar(){
    var p=0,c=0;
    for(var r=0;r<8;r++)for(var cc=0;cc<8;cc++){if(tab[r][cc]>0)p++;if(tab[r][cc]<0)c++;}
    return [p,c];
  }
  function fim(jogVenceu,empate){
    over=true;
    var el=document.getElementById("turno");
    if(empate){el.textContent="Empate!";Z.toast("Empate por limite de lances.");}
    else if(jogVenceu){el.textContent="Você venceu!";Z.snd(880,0.3,"sine",0.05);Z.toast("Vitória!");}
    else{el.textContent="A CPU venceu.";Z.snd(140,0.3,"sawtooth",0.05);}
    render();
  }
  function vezCPU(){
    turno=-1;sel=null;perc=[];
    document.getElementById("turno").textContent="CPU pensando…";
    render();
    setTimeout(function(){
      if(over)return;
      var mv=escolheCPU();
      if(!mv){fim(true,false);return;}
      var eraCap=mv.cap.length>0;
      tab=aplica(tab,mv);
      half=eraCap?0:half+1;
      var n=contar();
      document.getElementById("placar").textContent="Você "+n[0]+" × "+n[1]+" CPU";
      if(!n[0]){fim(false,false);return;}
      var pm=todosMovimentos(tab,1);
      if(!pm.length){fim(false,false);return;}
      if(half>=80){fim(false,true);return;}
      turno=1;movsJog=pm;
      document.getElementById("turno").textContent=pm[0].cap.length?"Sua vez — capture!":"Sua vez";
      render();
    },420);
  }
  function alvosDe(){
    var out=[];
    for(var i=0;i<movsJog.length;i++){
      var m=movsJog[i];
      if(m.orig[0]!==sel[0]||m.orig[1]!==sel[1])continue;
      var ok=true;
      for(var k=0;k<perc.length;k++){
        if(!m.seq[k]||m.seq[k][0]!==perc[k][0]||m.seq[k][1]!==perc[k][1]){ok=false;break;}
      }
      if(ok&&m.seq[perc.length])out.push({pos:m.seq[perc.length],cap:m.cap.length>0});
    }
    return out;
  }
  function clique(r,c){
    if(over||turno!==1)return;
    if(sel&&perc.length){
      var al=alvosDe();
      for(var i=0;i<al.length;i++){
        if(al[i].pos[0]===r&&al[i].pos[1]===c){
          perc.push([r,c]);
          var resto=alvosDe();
          if(resto.length){sel=[r,c];Z.snd(600,0.05,"square",0.03);render();return;}
          var fin=null;
          for(var j=0;j<movsJog.length;j++){
            var m=movsJog[j];
            if(m.orig[0]===window.__org0&&m.orig[1]===window.__org1&&m.seq.length===perc.length){
              var ok=true;
              for(var k=0;k<perc.length;k++)if(m.seq[k][0]!==perc[k][0]||m.seq[k][1]!==perc[k][1]){ok=false;break;}
              if(ok){fin=m;break;}
            }
          }
          if(fin)concluir(fin);
          return;
        }
      }
      return;
    }
    if(sel){
      var al2=alvosDe();
      for(var a=0;a<al2.length;a++){
        if(al2[a].pos[0]===r&&al2[a].pos[1]===c){
          if(al2[a].cap){
            window.__org0=sel[0];window.__org1=sel[1];
            perc=[[r,c]];
            var resto2=alvosDe();
            if(resto2.length){sel=[r,c];Z.snd(600,0.05,"square",0.03);render();return;}
            for(var j2=0;j2<movsJog.length;j2++){
              var m2=movsJog[j2];
              if(m2.orig[0]===window.__org0&&m2.orig[1]===window.__org1&&m2.seq.length===1&&m2.seq[0][0]===r&&m2.seq[0][1]===c){concluir(m2);return;}
            }
          }else{
            for(var j3=0;j3<movsJog.length;j3++){
              var m3=movsJog[j3];
              if(m3.orig[0]===sel[0]&&m3.orig[1]===sel[1]&&m3.seq.length===1&&m3.seq[0][0]===r&&m3.seq[0][1]===c){concluir(m3);return;}
            }
          }
          return;
        }
      }
    }
    if(dono(tab[r][c])===1){
      var tem=false;
      for(var t=0;t<movsJog.length;t++)if(movsJog[t].orig[0]===r&&movsJog[t].orig[1]===c){tem=true;break;}
      if(tem){sel=[r,c];perc=[];Z.snd(520,0.04,"sine",0.03);render();}
      else Z.toast("Essa peça não tem lance.");
    }else{sel=null;render();}
  }
  function concluir(mv){
    var eraCap=mv.cap.length>0;
    tab=aplica(tab,mv);
    half=eraCap?0:half+1;
    sel=null;perc=[];
    Z.snd(eraCap?740:520,0.07,"sine",0.04);
    var n=contar();
    document.getElementById("placar").textContent="Você "+n[0]+" × "+n[1]+" CPU";
    if(!n[1]){fim(true,false);return;}
    if(half>=80){fim(false,true);return;}
    if(!todosMovimentos(tab,-1).length){fim(true,false);return;}
    vezCPU();
  }
  function render(){
    var el=document.getElementById("tab");
    el.innerHTML="";
    var al=sel?alvosDe():[];
    for(var r=0;r<8;r++)for(var c=0;c<8;c++){
      (function(r,c){
        var b=document.createElement("button");
        b.type="button";
        var escura=(r+c)%2===1;
        b.className="dm-c"+(escura?"":" claro");
        b.setAttribute("aria-label","Casa "+(r+1)+"-"+(c+1));
        var p=tab[r][c];
        if(p){
          var s=document.createElement("span");
          s.className="pc "+(p>0?"p":"c")+(rei(p)?" dama":"");
          b.appendChild(s);
        }
        if(sel&&sel[0]===r&&sel[1]===c)b.classList.add("sel");
        for(var i=0;i<al.length;i++){
          if(al[i].pos[0]===r&&al[i].pos[1]===c){
            var h=document.createElement("span");
            h.className="hint"+(al[i].cap?" cap":"");
            b.appendChild(h);
          }
        }
        if(escura)b.addEventListener("click",function(){clique(r,c);});
        el.appendChild(b);
      })(r,c);
    }
  }
  function zera(){
    novoTab();turno=1;sel=null;movsJog=[];perc=[];half=0;over=false;
    movsJog=todosMovimentos(tab,1);
    document.getElementById("turno").textContent="Sua vez";
    document.getElementById("placar").textContent="Você 12 × 12 CPU";
    render();
  }
  document.getElementById("novo").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js, css });
}

/* ── LIG-4 (vs CPU, minimax) ────────────────────────────── */
export function lig4({ nome, sub, nivel }) {
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="turno">Sua vez</span>
  <span class="zchip">${nivel === "dificil" ? "CPU difícil" : "CPU normal"}</span>
</div>
<div class="zcard pad" style="max-width:440px;margin:0 auto">
  <div id="tab" class="l4-tab"></div>
  <div class="row mt wrap" style="justify-content:center">
    <button class="zbtn ghost sm" id="novo" type="button">Nova partida</button>
  </div>
</div>
<p class="dim center mt" style="font-size:12.5px">Você é o <b class="acc">verde</b>. Clique numa coluna para soltar a peça.</p>`;
  const css = `
.l4-tab{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;background:#0b3b2e;border-radius:12px;padding:10px}
.l4-col{display:grid;gap:6px;cursor:pointer;border-radius:8px}
.l4-col:hover{background:rgba(52,211,153,0.12)}
.l4-c{aspect-ratio:1;border-radius:50%;background:#070b09;border:1px solid rgba(255,255,255,0.08)}
.l4-c.p{background:radial-gradient(circle at 32% 30%,#6ee7b7,#059669)}
.l4-c.c{background:radial-gradient(circle at 32% 30%,#fda4af,#be123c)}
.l4-c.win{outline:3px solid #fbbf24;outline-offset:-3px}`;
  const js = `
(function(){
  var PROF=${nivel === "dificil" ? "6" : "4"};
  var COLS=7,LIN=6;
  var tab,turno,over,winCells;
  function vazio(){var t=[];for(var r=0;r<LIN;r++){t.push([0,0,0,0,0,0,0]);}return t;}
  function livre(t,c){for(var r=LIN-1;r>=0;r--)if(!t[r][c])return r;return -1;}
  function vence(t,r,c,p){
    var dirs=[[0,1],[1,0],[1,1],[1,-1]];
    for(var d=0;d<4;d++){
      var cells=[[r,c]],dr=dirs[d][0],dc=dirs[d][1];
      var rr=r+dr,cc=c+dc;
      while(rr>=0&&rr<LIN&&cc>=0&&cc<COLS&&t[rr][cc]===p){cells.push([rr,cc]);rr+=dr;cc+=dc;}
      rr=r-dr;cc=c-dc;
      while(rr>=0&&rr<LIN&&cc>=0&&cc<COLS&&t[rr][cc]===p){cells.push([rr,cc]);rr-=dr;cc-=dc;}
      if(cells.length>=4)return cells;
    }
    return null;
  }
  function cheio(t){for(var c=0;c<COLS;c++)if(!t[0][c])return false;return true;}
  function janScore(w,pc){
    var n=0,v=0,adv=0;
    for(var i=0;i<4;i++){if(w[i]===pc)n++;else if(w[i]===0)v++;else adv++;}
    if(n===4)return 100000;
    if(n===3&&v===1)return 60;
    if(n===2&&v===2)return 8;
    if(n===3&&v===0&&adv===1)return 0;
    return 0;
  }
  function avalia(t){
    var s=0,r,c,w;
    for(c=0;c<COLS;c++){if(t[LIN-1][c]===2)s+=3;else if(t[LIN-1][c]===1)s-=3;}
    for(r=0;r<LIN;r++)for(c=0;c<COLS;c++){
      if(c+3<COLS){w=[t[r][c],t[r][c+1],t[r][c+2],t[r][c+3]];s+=janScore(w,2)-janScore(w,1);}
      if(r+3<LIN){w=[t[r][c],t[r+1][c],t[r+2][c],t[r+3][c]];s+=janScore(w,2)-janScore(w,1);}
      if(r+3<LIN&&c+3<COLS){w=[t[r][c],t[r+1][c+1],t[r+2][c+2],t[r+3][c+3]];s+=janScore(w,2)-janScore(w,1);}
      if(r-3>=0&&c+3<COLS){w=[t[r][c],t[r-1][c+1],t[r-2][c+2],t[r-3][c+3]];s+=janScore(w,2)-janScore(w,1);}
    }
    return s;
  }
  function ordem(t){
    var cs=[];
    for(var c=0;c<COLS;c++)if(livre(t,c)>=0)cs.push(c);
    cs.sort(function(a,b){return Math.abs(a-3)-Math.abs(b-3)});
    return cs;
  }
  function mini(t,prof,alfa,beta,maxi){
    var cs=ordem(t);
    if(!cs.length)return 0;
    if(prof===0)return avalia(t);
    if(maxi){
      var mel=-1e9;
      for(var i=0;i<cs.length;i++){
        var r=livre(t,cs[i]);t[r][cs[i]]=2;
        var v=vence(t,r,cs[i],2)?(100000+prof):mini(t,prof-1,alfa,beta,false);
        t[r][cs[i]]=0;
        if(v>mel)mel=v;
        if(mel>alfa)alfa=mel;
        if(alfa>=beta)break;
      }
      return mel;
    }
    var mel2=1e9;
    for(var j=0;j<cs.length;j++){
      var r2=livre(t,cs[j]);t[r2][cs[j]]=1;
      var v2=vence(t,r2,cs[j],1)?(-100000-prof):mini(t,prof-1,alfa,beta,true);
      t[r2][cs[j]]=0;
      if(v2<mel2)mel2=v2;
      if(mel2<beta)beta=mel2;
      if(alfa>=beta)break;
    }
    return mel2;
  }
  function jogadaCPU(){
    var cs=ordem(tab),melhor=cs[0],mv=-1e9;
    for(var i=0;i<cs.length;i++){
      var r=livre(tab,cs[i]);tab[r][cs[i]]=2;
      var v=vence(tab,r,cs[i],2)?(100000+PROF):mini(tab,PROF-1,-1e9,1e9,false);
      tab[r][cs[i]]=0;
      v+=Math.random()*4;
      if(v>mv){mv=v;melhor=cs[i];}
    }
    return melhor;
  }
  function fim(txt,win){
    over=true;
    document.getElementById("turno").textContent=txt;
    if(win){Z.snd(880,0.3,"sine",0.05);Z.toast("Você venceu!");}
    else if(txt.indexOf("CPU")>=0)Z.snd(140,0.3,"sawtooth",0.05);
    render();
  }
  function joga(c,p){
    var r=livre(tab,c);
    if(r<0)return false;
    tab[r][c]=p;
    Z.snd(p===1?520:300,0.06,"sine",0.04);
    var w=vence(tab,r,c,p);
    if(w){winCells=w;fim(p===1?"Você venceu!":"A CPU venceu.",p===1);return true;}
    if(cheio(tab)){fim("Empate! Deu velha.",false);return true;}
    return true;
  }
  function clique(c){
    if(over||turno!==1)return;
    if(livre(tab,c)<0){Z.toast("Coluna cheia.");return;}
    if(!joga(c,1))return;
    if(over)return;
    turno=2;
    document.getElementById("turno").textContent="CPU pensando…";
    render();
    setTimeout(function(){
      if(over)return;
      joga(jogadaCPU(),2);
      if(over)return;
      turno=1;
      document.getElementById("turno").textContent="Sua vez";
      render();
    },450);
  }
  function render(){
    var el=document.getElementById("tab");
    el.innerHTML="";
    for(var c=0;c<COLS;c++){
      (function(c){
        var col=document.createElement("div");
        col.className="l4-col";
        col.addEventListener("click",function(){clique(c);});
        for(var r=0;r<LIN;r++){
          var d=document.createElement("div");
          d.className="l4-c";
          if(tab[r][c]===1)d.classList.add("p");
          if(tab[r][c]===2)d.classList.add("c");
          for(var i=0;i<winCells.length;i++)if(winCells[i][0]===r&&winCells[i][1]===c)d.classList.add("win");
          col.appendChild(d);
        }
        el.appendChild(col);
      })(c);
    }
  }
  function zera(){
    tab=vazio();turno=1;over=false;winCells=[];
    document.getElementById("turno").textContent="Sua vez";
    render();
  }
  document.getElementById("novo").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js, css });
}

/* ── RESTA UM ───────────────────────────────────────────── */
export function resta1({ nome, sub, tabuleiro }) {
  const europeu = tabuleiro === "europeu";
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="pecas">Peças: ${europeu ? 36 : 32}</span>
  <span class="zchip" id="movs">Lances: 0</span>
  <span class="zchip">${europeu ? "Tabuleiro europeu" : "Tabuleiro inglês"}</span>
</div>
<div class="zcard pad" style="max-width:400px;margin:0 auto">
  <div id="tab" class="r1-tab"></div>
  <div class="row mt wrap" style="justify-content:center">
    <button class="zbtn ghost sm" id="novo" type="button">Recomeçar</button>
  </div>
</div>
<p class="dim center mt" style="font-size:12.5px">Toque numa peça e depois no buraco vazio: pule por cima para comer. Reste uma!</p>`;
  const css = `
.r1-tab{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
.r1-c{aspect-ratio:1;border-radius:50%;border:0;display:grid;place-items:center;background:rgba(255,255,255,0.06);cursor:default;padding:0}
.r1-c.off{background:transparent;pointer-events:none}
.r1-c.livre{cursor:pointer}
.r1-c.livre:hover{background:rgba(52,211,153,0.2)}
.r1-c .pc{width:78%;height:78%;border-radius:50%;background:radial-gradient(circle at 32% 30%,#6ee7b7,#059669);box-shadow:0 3px 8px rgba(0,0,0,.5);pointer-events:none;cursor:pointer}
.r1-c.sel{outline:3px solid #fbbf24;outline-offset:-2px}
.r1-c .hint{width:34%;height:34%;border-radius:50%;background:#fbbf24;pointer-events:none}`;
  const js = `
(function(){
  var EUR=${europeu ? "true" : "false"};
  var tab,sel,movs,over;
  function valido(r,c){
    if(r<0||r>6||c<0||c>6)return false;
    var canto=(r<2||r>4)&&(c<2||c>4);
    if(!canto)return true;
    if(!EUR)return false;
    return (r===1&&c===1)||(r===1&&c===5)||(r===5&&c===1)||(r===5&&c===5);
  }
  function zera(){
    tab=[];sel=null;movs=0;over=false;
    for(var r=0;r<7;r++){tab.push([]);for(var c=0;c<7;c++)tab[r].push(valido(r,c)?1:-1);}
    tab[3][3]=0;
    hud();render();
  }
  function contar(){var n=0;for(var r=0;r<7;r++)for(var c=0;c<7;c++)if(tab[r][c]===1)n++;return n;}
  function hud(){
    document.getElementById("pecas").textContent="Peças: "+contar();
    document.getElementById("movs").textContent="Lances: "+movs;
  }
  function destinos(r,c){
    var out=[],dirs=[[2,0],[-2,0],[0,2],[0,-2]];
    for(var i=0;i<4;i++){
      var nr=r+dirs[i][0],nc=c+dirs[i][1];
      if(valido(nr,nc)&&tab[nr][nc]===0&&tab[r+dirs[i][0]/2][c+dirs[i][1]/2]===1)out.push([nr,nc]);
    }
    return out;
  }
  function temLance(){
    for(var r=0;r<7;r++)for(var c=0;c<7;c++)if(tab[r][c]===1&&destinos(r,c).length)return true;
    return false;
  }
  function clique(r,c){
    if(over)return;
    if(sel){
      var ds=destinos(sel[0],sel[1]);
      for(var i=0;i<ds.length;i++){
        if(ds[i][0]===r&&ds[i][1]===c){
          tab[sel[0]][sel[1]]=0;
          tab[(sel[0]+r)/2][(sel[1]+c)/2]=0;
          tab[r][c]=1;
          sel=null;movs++;hud();
          Z.snd(660,0.06,"sine",0.04);
          var n=contar();
          if(n===1){
            over=true;
            if(tab[3][3]===1){Z.snd(880,0.35,"sine",0.05);Z.toast("Perfeito! Restou uma no centro.");}
            else{Z.snd(760,0.25,"sine",0.05);Z.toast("Você venceu! Tente terminar no centro.");}
          }else if(!temLance()){
            over=true;Z.snd(200,0.3,"sawtooth",0.05);
            Z.toast("Sem lances. Restaram "+n+" peças.");
          }
          render();return;
        }
      }
    }
    if(tab[r][c]===1){
      if(destinos(r,c).length){sel=[r,c];Z.snd(520,0.04,"sine",0.03);}
      else{Z.toast("Essa peça não tem lance.");sel=null;}
      render();
    }else sel=null;
  }
  function render(){
    var el=document.getElementById("tab");
    el.innerHTML="";
    var ds=sel?destinos(sel[0],sel[1]):[];
    for(var r=0;r<7;r++)for(var c=0;c<7;c++){
      (function(r,c){
        var b=document.createElement("button");
        b.type="button";
        if(!valido(r,c)){b.className="r1-c off";b.tabIndex=-1;el.appendChild(b);return;}
        b.className="r1-c livre";
        b.setAttribute("aria-label","Casa "+(r+1)+"-"+(c+1));
        if(tab[r][c]===1){
          var s=document.createElement("span");s.className="pc";b.appendChild(s);
        }
        if(sel&&sel[0]===r&&sel[1]===c)b.classList.add("sel");
        for(var i=0;i<ds.length;i++){
          if(ds[i][0]===r&&ds[i][1]===c){
            var h=document.createElement("span");h.className="hint";b.appendChild(h);
          }
        }
        b.addEventListener("click",function(){clique(r,c);});
        el.appendChild(b);
      })(r,c);
    }
  }
  document.getElementById("novo").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js, css });
}

/* ── TORRE DE HANÓI ─────────────────────────────────────── */
export function hanoi({ nome, sub, discos }) {
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="movs">Movimentos: 0</span>
  <span class="zchip" id="min">Mínimo: ${Math.pow(2, discos) - 1}</span>
  <span class="zchip">${discos} discos</span>
</div>
<div class="zcard pad" style="max-width:480px;margin:0 auto">
  <div id="torres" class="hn-torres"></div>
  <div class="row mt wrap" style="justify-content:center">
    <button class="zbtn ghost sm" id="novo" type="button">Recomeçar</button>
  </div>
</div>
<p class="dim center mt" style="font-size:12.5px">Toque numa torre para pegar o disco do topo e noutra para soltar. Leve todos para a última torre.</p>`;
  const css = `
.hn-torres{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.hn-t{min-height:220px;display:flex;flex-direction:column-reverse;align-items:center;gap:5px;background:rgba(255,255,255,0.03);border:1px solid var(--z-line);border-radius:10px;padding:14px 6px;cursor:pointer;position:relative}
.hn-t:hover{border-color:var(--z-acc)}
.hn-t.sel{outline:2px solid var(--z-acc);outline-offset:-2px}
.hn-t::before{content:"";position:absolute;top:14px;bottom:14px;width:6px;border-radius:3px;background:#2c3a33}
.hn-d{height:22px;border-radius:7px;position:relative;z-index:1;box-shadow:0 3px 8px rgba(0,0,0,.5)}`;
  const js = `
(function(){
  var N=${discos};
  var torres,sel,movs,over;
  var CORES=["#f87171","#fb923c","#fbbf24","#4ade80","#38bdf8","#a78bfa"];
  function zera(){
    torres=[[],[],[]];sel=null;movs=0;over=false;
    for(var i=N;i>=1;i--)torres[0].push(i);
    hud();render();
  }
  function hud(){document.getElementById("movs").textContent="Movimentos: "+movs;}
  function clique(t){
    if(over)return;
    if(sel===null){
      if(torres[t].length){sel=t;Z.snd(520,0.04,"sine",0.03);render();}
      return;
    }
    if(sel===t){sel=null;render();return;}
    var d=torres[sel][torres[sel].length-1];
    var topo=torres[t][torres[t].length-1];
    if(topo!==undefined&&topo<d){Z.toast("Não pode pôr disco maior sobre o menor.");return;}
    torres[sel].pop();torres[t].push(d);
    sel=null;movs++;hud();
    Z.snd(660,0.06,"sine",0.04);
    if(torres[2].length===N){
      over=true;Z.snd(880,0.35,"sine",0.05);
      var min=${Math.pow(2, discos) - 1};
      Z.toast(movs===min?"Perfeito! Mínimo de lances.":"Completo em "+movs+" lances.");
    }
    render();
  }
  function render(){
    var el=document.getElementById("torres");
    el.innerHTML="";
    for(var t=0;t<3;t++){
      (function(t){
        var col=document.createElement("div");
        col.className="hn-t"+(sel===t?" sel":"");
        col.setAttribute("role","button");
        col.setAttribute("aria-label","Torre "+(t+1));
        for(var i=0;i<torres[t].length;i++){
          var d=torres[t][i];
          var dv=document.createElement("div");
          dv.className="hn-d";
          dv.style.width=(26+d*(68/N))+"%";
          dv.style.background=CORES[(d-1)%CORES.length];
          col.appendChild(dv);
        }
        col.addEventListener("click",function(){clique(t);});
        el.appendChild(col);
      })(t);
    }
  }
  document.getElementById("novo").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js, css });
}

/* ── APAGUE AS LUZES ────────────────────────────────────── */
export function lights({ nome, sub, n }) {
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="movs">Toques: 0</span>
  <span class="zchip">Grade ${n}×${n}</span>
</div>
<div class="zcard pad" style="max-width:400px;margin:0 auto">
  <div id="grade" class="li-grade" style="grid-template-columns:repeat(${n},1fr)"></div>
  <div class="row mt wrap" style="justify-content:center">
    <button class="zbtn ghost sm" id="novo" type="button">Embaralhar</button>
  </div>
</div>
<p class="dim center mt" style="font-size:12.5px">Toque para inverter a lâmpada e as vizinhas. Apague todas!</p>`;
  const css = `
.li-grade{display:grid;gap:6px}
.li-l{aspect-ratio:1;border-radius:10px;border:1px solid var(--z-line2);cursor:pointer;background:#0b100d;padding:0}
.li-l.on{background:radial-gradient(circle at 50% 38%,#fde68a,#f59e0b);border-color:#fbbf24;box-shadow:0 0 18px -2px rgba(251,191,36,.55)}`;
  const js = `
(function(){
  var N=${n};
  var tab,movs,over;
  function zera(){
    tab=[];movs=0;over=false;
    for(var r=0;r<N;r++){tab.push([]);for(var c=0;c<N;c++)tab[r].push(false);}
    var vezes=N===5?12:22;
    for(var i=0;i<vezes;i++)inverte(Math.floor(Math.random()*N),Math.floor(Math.random()*N),true);
    if(ganhou())inverte(0,0,true);
    hud();render();
  }
  function inverte(r,c,sil){
    var ds=[[0,0],[1,0],[-1,0],[0,1],[0,-1]];
    for(var i=0;i<5;i++){
      var nr=r+ds[i][0],nc=c+ds[i][1];
      if(nr>=0&&nr<N&&nc>=0&&nc<N)tab[nr][nc]=!tab[nr][nc];
    }
    if(!sil){movs++;hud();Z.snd(560,0.05,"square",0.03);}
  }
  function hud(){document.getElementById("movs").textContent="Toques: "+movs;}
  function ganhou(){
    for(var r=0;r<N;r++)for(var c=0;c<N;c++)if(tab[r][c])return false;
    return true;
  }
  function clique(r,c){
    if(over)return;
    inverte(r,c,false);
    if(ganhou()){
      over=true;Z.snd(880,0.3,"sine",0.05);
      Z.toast("Apagou tudo em "+movs+" toques!");
    }
    render();
  }
  function render(){
    var el=document.getElementById("grade");
    el.innerHTML="";
    for(var r=0;r<N;r++)for(var c=0;c<N;c++){
      (function(r,c){
        var b=document.createElement("button");
        b.type="button";
        b.className="li-l"+(tab[r][c]?" on":"");
        b.setAttribute("aria-label","Lâmpada "+(r+1)+"-"+(c+1)+(tab[r][c]?" acesa":" apagada"));
        b.addEventListener("click",function(){clique(r,c);});
        el.appendChild(b);
      })(r,c);
    }
  }
  document.getElementById("novo").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js, css });
}

/* ── NONOGRAM (picross) ─────────────────────────────────── */
const NONO_PUZZLES = {
  facil: [
    { nome: "Coração", sol: [[1,1,0,1,1],[1,1,1,1,1],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]] },
    { nome: "Xis", sol: [[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1]] },
    { nome: "Casa", sol: [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[1,0,1,0,1],[1,1,1,1,1]] },
  ],
  medio: [
    { nome: "Invasor", sol: [
      [0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,1,0,0],[0,0,0,1,0,0,1,0,0,0],
      [0,0,1,1,1,1,1,1,0,0],[0,1,1,0,1,1,0,1,1,0],[1,1,1,1,1,1,1,1,1,1],
      [1,0,1,1,1,1,1,1,0,1],[1,0,1,0,0,0,0,1,0,1],[0,0,0,1,1,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0]] },
    { nome: "Máscara", sol: [
      [1,1,0,0,0,0,0,0,1,1],[1,1,0,0,0,0,0,0,1,1],[1,1,1,1,1,1,1,1,1,1],
      [1,0,1,1,1,1,1,1,0,1],[1,1,1,1,1,1,1,1,1,1],[1,1,0,1,1,1,1,0,1,1],
      [0,1,1,0,0,0,0,1,1,0],[0,0,1,1,1,1,1,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0]] },
  ],
};

export function nonogram({ nome, sub, pack }) {
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="qual">Desenho: 1</span>
  <span class="zchip" id="erros">Erros: 0</span>
  <span class="zchip" id="dicas">Dicas: 3</span>
</div>
<div class="zcard pad" style="max-width:520px;margin:0 auto;overflow-x:auto">
  <div id="tab" class="nn-tab"></div>
  <div class="row mt wrap" style="justify-content:center">
    <button class="zbtn sm" id="mPintar" type="button">Pintar</button>
    <button class="zbtn ghost sm" id="mX" type="button">Marcar X</button>
    <button class="zbtn ghost sm" id="dica" type="button">Dica</button>
    <button class="zbtn ghost sm" id="novo" type="button">Recomeçar</button>
  </div>
</div>
<p class="dim center mt" style="font-size:12.5px">Os números dizem quantos blocos seguidos há em cada linha e coluna.</p>`;
  const css = `
.nn-tab{display:grid;gap:3px;justify-content:center}
.nn-c{min-width:30px;min-height:30px;border-radius:7px;border:1px solid var(--z-line2);background:#0b100d;cursor:pointer;padding:0;color:var(--z-muted);font-family:var(--z-fm);font-size:11px}
.nn-c.fill{background:linear-gradient(135deg,#34d399,#059669);border-color:transparent}
.nn-c.x{color:#f87171;font-weight:700}
.nn-pista{background:transparent;border:0;cursor:default;display:flex;align-items:center;justify-content:center;gap:3px;flex-wrap:wrap}
.nn-pista.ok{opacity:.32}`;
  const js = `
(function(){
  var PUZZLES=${JSON.stringify(NONO_PUZZLES[pack] || NONO_PUZZLES.facil)};
  var pi,sol,N,tab,erros,dicasN,modo,over;
  function pistas(linha){
    var out=[],n=0;
    for(var i=0;i<linha.length;i++){
      if(linha[i])n++;
      else if(n){out.push(n);n=0;}
    }
    if(n)out.push(n);
    return out.length?out:[0];
  }
  function zera(){
    pi=0;erros=0;dicasN=3;modo="pintar";over=false;
    carrega();
  }
  function carrega(){
    sol=PUZZLES[pi].sol;N=sol.length;tab=[];
    for(var r=0;r<N;r++){tab.push([]);for(var c=0;c<N;c++)tab[r].push(0);}
    document.getElementById("qual").textContent="Desenho "+(pi+1)+"/"+PUZZLES.length+": "+PUZZLES[pi].nome;
    hud();render();
  }
  function hud(){
    document.getElementById("erros").textContent="Erros: "+erros;
    document.getElementById("dicas").textContent="Dicas: "+dicasN;
  }
  function linhaOk(v,liberada){
    for(var i=0;i<v.length;i++){
      var eh=(tab[liberada][i]===1);
      if(!!v[i]!==eh)return false;
    }
    return true;
  }
  function colunaOk(v,liberada){
    for(var i=0;i<v.length;i++){
      var eh=(tab[i][liberada]===1);
      if(!!v[i]!==eh)return false;
    }
    return true;
  }
  function venceu(){
    for(var r=0;r<N;r++)for(var c=0;c<N;c++){
      if((tab[r][c]===1)!==!!sol[r][c])return false;
    }
    return true;
  }
  function clique(r,c){
    if(over)return;
    if(modo==="pintar"){
      if(tab[r][c]===1)tab[r][c]=0;
      else{
        tab[r][c]=1;
        if(!sol[r][c]){erros++;hud();Z.snd(180,0.1,"sawtooth",0.04);}
        else Z.snd(660,0.05,"sine",0.03);
      }
    }else{
      tab[r][c]=tab[r][c]===2?0:2;
      Z.snd(440,0.04,"sine",0.02);
    }
    if(venceu()){
      Z.snd(880,0.3,"sine",0.05);
      if(pi<PUZZLES.length-1){Z.toast("Desenho completo! Próximo…");pi++;setTimeout(carrega,900);}
      else{over=true;Z.toast("Você completou todos os desenhos!");}
    }
    render();
  }
  function dica(){
    if(over||dicasN<=0){if(dicasN<=0)Z.toast("Sem dicas.");return;}
    var ops=[];
    for(var r=0;r<N;r++)for(var c=0;c<N;c++)if(sol[r][c]&&tab[r][c]!==1)ops.push([r,c]);
    if(!ops.length)return;
    var p=ops[Math.floor(Math.random()*ops.length)];
    tab[p[0]][p[1]]=1;dicasN--;hud();
    Z.snd(760,0.08,"sine",0.04);
    if(venceu()){
      if(pi<PUZZLES.length-1){Z.toast("Desenho completo! Próximo…");pi++;setTimeout(carrega,900);}
      else{over=true;Z.toast("Você completou todos os desenhos!");}
    }
    render();
  }
  function render(){
    var el=document.getElementById("tab");
    el.innerHTML="";
    el.style.gridTemplateColumns="auto repeat("+N+",minmax(26px,34px))";
    var corner=document.createElement("div");corner.className="nn-pista";el.appendChild(corner);
    var cols=[];
    for(var c=0;c<N;c++){var col=[];for(var r=0;r<N;r++)col.push(sol[r][c]);cols.push(col);}
    for(var cc=0;cc<N;cc++){
      var pc=document.createElement("div");
      pc.className="nn-pista"+(colunaOk(cols[cc],cc)?" ok":"");
      pc.style.flexDirection="column";
      pc.innerHTML=pistas(cols[cc]).join("<br>");
      el.appendChild(pc);
    }
    for(var r2=0;r2<N;r2++){
      var pr=document.createElement("div");
      pr.className="nn-pista"+(linhaOk(sol[r2],r2)?" ok":"");
      pr.textContent=pistas(sol[r2]).join(" ");
      el.appendChild(pr);
      for(var c2=0;c2<N;c2++){
        (function(r2,c2){
          var b=document.createElement("button");
          b.type="button";
          b.className="nn-c"+(tab[r2][c2]===1?" fill":(tab[r2][c2]===2?" x":""));
          if(tab[r2][c2]===2)b.textContent="✕";
          b.setAttribute("aria-label","Célula "+(r2+1)+"-"+(c2+1));
          b.addEventListener("click",function(){clique(r2,c2);});
          el.appendChild(b);
        })(r2,c2);
      }
    }
    document.getElementById("mPintar").className="zbtn sm"+(modo==="pintar"?"":" ghost");
    document.getElementById("mX").className="zbtn sm"+(modo==="x"?"":" ghost");
  }
  document.getElementById("mPintar").addEventListener("click",function(){modo="pintar";render();});
  document.getElementById("mX").addEventListener("click",function(){modo="x";render();});
  document.getElementById("dica").addEventListener("click",dica);
  document.getElementById("novo").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js, css });
}

/* ── DEFESA DA BASE (tower defense) ─────────────────────── */
export function defesa({ nome, sub, modo }) {
  const endless = modo === "endless";
  const body = `
<div class="row mb wrap" style="justify-content:center">
  <span class="zchip" id="onda">Onda: 0${endless ? "" : "/20"}</span>
  <span class="zchip" id="ouro">Ouro: 150</span>
  <span class="zchip" id="vidas">Vidas: 20</span>
  <span class="zchip" id="best">Recorde: onda 0</span>
</div>
<div class="zcard pad" style="max-width:480px;margin:0 auto">
  <div style="position:relative">
    <canvas class="zc" id="cv" width="440" height="400" style="border:0;background:transparent"></canvas>
    ${hudFim("Fim de jogo")}
  </div>
  <div class="row mt wrap" style="justify-content:center" id="loja"></div>
  <div class="row mt wrap" style="justify-content:center">
    <button class="zbtn sm" id="chamar" type="button">Chamar onda (+10 ouro)</button>
    <button class="zbtn ghost sm hidden" id="melhorar" type="button">Melhorar</button>
    <button class="zbtn ghost sm hidden" id="vender" type="button">Vender</button>
  </div>
  <p class="dim center mt" id="info" style="font-size:12.5px;min-height:20px">Escolha uma torre e toque no gramado para construir.</p>
</div>`;
  const js = `
(function(){
  var cv=document.getElementById("cv");
  var ctx=cv.getContext?cv.getContext("2d"):null;
  if(!ctx){cv.outerHTML="<p class='dim center'>Seu navegador não suporta canvas.</p>";return;}
  var ENDLESS=${endless ? "true" : "false"};
  var W=440,H=400;
  var ROTA=[[0,80],[360,80],[360,180],[40,180],[40,280],[440,280]];
  var TORRES=[
    {nome:"Canhão",custo:50,dano:8,alc:95,vel:1.6,cor:"#38bdf8"},
    {nome:"Gelo",custo:70,dano:3,alc:85,vel:1.2,cor:"#a5f3fc",gelo:true},
    {nome:"Míssil",custo:120,dano:26,alc:140,vel:0.7,cor:"#fb923c"}
  ];
  var torres,inis,efeitos,ouro,vidas,onda,over,win,sel,escolhida,filaOnda,spawnT,espera,best,last,ondaMax;
  var CHAVE="defesa-${modo}";
  function zera(){
    torres=[];inis=[];efeitos=[];ouro=150;vidas=20;onda=0;over=false;win=false;
    sel=-1;escolhida=-1;filaOnda=[];spawnT=0;espera=0;ondaMax=ENDLESS?1e9:20;
    best=Z.store.best(CHAVE);
    document.getElementById("best").textContent="Recorde: onda "+best;
    document.getElementById("fim").classList.add("hidden");
    loja();hud();last=performance.now();requestAnimationFrame(loop);
  }
  function hud(){
    document.getElementById("onda").textContent="Onda: "+onda+(ENDLESS?"":"/"+ondaMax);
    document.getElementById("ouro").textContent="Ouro: "+ouro;
    document.getElementById("vidas").textContent="Vidas: "+vidas;
  }
  function fim(venceu){
    over=true;
    if(onda>best){best=onda;Z.store.setBest(CHAVE,best);}
    document.getElementById("best").textContent="Recorde: onda "+best;
    Z.snd(venceu?880:140,0.35,venceu?"sine":"sawtooth",0.05);
    document.getElementById("fimTitulo").textContent=venceu?"Base defendida!":"Base destruída";
    document.getElementById("fimTxt").innerHTML="Onda alcançada: <b class='acc'>"+onda+"</b>";
    document.getElementById("fim").classList.remove("hidden");
  }
  function loja(){
    var el=document.getElementById("loja");
    el.innerHTML="";
    for(var i=0;i<TORRES.length;i++){
      (function(i){
        var t=TORRES[i];
        var b=document.createElement("button");
        b.type="button";
        b.className="zbtn sm"+(escolhida===i?"":" ghost");
        b.innerHTML="<span style='display:inline-block;width:10px;height:10px;border-radius:50%;background:"+t.cor+"'></span> "+t.nome+" $"+t.custo;
        b.addEventListener("click",function(){
          escolhida=(escolhida===i?-1:i);sel=-1;paineis();loja();
          document.getElementById("info").textContent=escolhida>=0?(t.nome+": dano "+t.dano+" · alcance "+t.alc+(t.gelo?" · desacelera":"")+". Toque no gramado."):("Escolha uma torre e toque no gramado para construir.");
        });
        el.appendChild(b);
      })(i);
    }
  }
  function paineis(){
    var m=document.getElementById("melhorar"),v=document.getElementById("vender");
    if(sel>=0&&torres[sel]){
      var t=torres[sel],custo=Math.round(TORRES[t.tipo].custo*0.8*t.nv);
      m.classList.remove("hidden");v.classList.remove("hidden");
      m.textContent="Melhorar nv"+(t.nv+1)+" ($"+custo+")";
    }else{m.classList.add("hidden");v.classList.add("hidden");}
  }
  function compOnda(n){
    var f=[];
    var q=4+Math.floor(n*1.3);
    for(var i=0;i<q;i++){
      var tipo="n";
      if(n>=4&&i%5===4)tipo="r";
      if(n>=6&&i%7===6)tipo="t";
      f.push(tipo);
    }
    if(n%5===0)f.push("boss");
    return f;
  }
  function novaOnda(){
    onda++;
    filaOnda=compOnda(onda);spawnT=0;
    hud();Z.toast("Onda "+onda);
  }
  function noCaminho(x,y){
    for(var i=0;i<ROTA.length-1;i++){
      var a=ROTA[i],b=ROTA[i+1];
      var dx=b[0]-a[0],dy=b[1]-a[1],L2=dx*dx+dy*dy;
      var t=L2?((x-a[0])*dx+(y-a[1])*dy)/L2:0;
      t=Math.max(0,Math.min(1,t));
      if(Math.hypot(x-(a[0]+dx*t),y-(a[1]+dy*t))<30)return true;
    }
    return false;
  }
  function passo(dt){
    var i;
    if(filaOnda.length){
      spawnT-=dt;
      if(spawnT<=0){
        spawnT=0.55;
        var tipo=filaOnda.shift();
        var base={n:{hp:26,v:52,ouro:6,r:9},r:{hp:16,v:95,ouro:7,r:7},t:{hp:90,v:38,ouro:14,r:12},boss:{hp:420+onda*22,v:30,ouro:80,r:17}}[tipo];
        var mult=1+onda*0.09;
        inis.push({x:ROTA[0][0]-20,y:ROTA[0][1],seg:0,hp:base.hp*mult,max:base.hp*mult,v:base.v,ouro:Math.round(base.ouro*(1+onda*0.03)),r:base.r,gelo:0,tipo:tipo});
      }
    }else if(!inis.length&&!over){
      espera+=dt;
      if(espera>9){espera=0;if(onda<ondaMax)novaOnda();else if(!ENDLESS){fim(true);return;}}
    }
    for(i=inis.length-1;i>=0;i--){
      var e=inis[i];
      if(e.gelo>0)e.gelo-=dt;
      var v=e.v*(e.gelo>0?0.5:1);
      var resto=v*dt,guard=0;
      while(resto>0&&guard++<6){
        var a=ROTA[e.seg],b=ROTA[e.seg+1];
        if(!b){e.x=W+30;break;}
        var dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy);
        var ja=Math.hypot(e.x-a[0],e.y-a[1]);
        var falta=d-ja;
        if(resto<falta){e.x+=dx/d*resto;e.y+=dy/d*resto;resto=0;}
        else{e.seg++;e.x=b[0];e.y=b[1];resto-=falta;}
      }
      if(e.x>=W-4){
        inis.splice(i,1);
        vidas-=e.tipo==="boss"?5:1;hud();
        Z.snd(130,0.15,"sawtooth",0.05);
        if(vidas<=0){vidas=0;hud();fim(false);return;}
      }
    }
    for(i=0;i<torres.length;i++){
      var t=torres[i];
      t.cd-=dt;
      if(t.cd>0)continue;
      var alvo=null,mp=-1;
      for(var j=0;j<inis.length;j++){
        var en=inis[j];
        if(Math.hypot(en.x-t.x,en.y-t.y)<=t.alc){
          var prog=en.seg*1000+en.x+en.y;
          if(prog>mp){mp=prog;alvo=en;}
        }
      }
      if(alvo){
        t.cd=1/t.vel;
        alvo.hp-=t.dano*(1+(t.nv-1)*0.6);
        if(t.gelo)alvo.gelo=1.6;
        efeitos.push({x1:t.x,y1:t.y,x2:alvo.x,y2:alvo.y,t:0.12,cor:t.cor});
        Z.snd(700+t.tipo*80,0.03,"square",0.015);
        if(alvo.hp<=0){
          ouro+=alvo.ouro;hud();
          var k=inis.indexOf(alvo);
          if(k>=0)inis.splice(k,1);
        }
      }
    }
    for(i=efeitos.length-1;i>=0;i--){efeitos[i].t-=dt;if(efeitos[i].t<=0)efeitos.splice(i,1);}
  }
  function desenha(){
    ctx.fillStyle="#0a120d";ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#2c3a33";ctx.lineWidth=34;ctx.lineJoin="round";ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(ROTA[0][0],ROTA[0][1]);
    for(var i=1;i<ROTA.length;i++)ctx.lineTo(ROTA[i][0],ROTA[i][1]);
    ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,0.14)";ctx.lineWidth=2;ctx.setLineDash([8,8]);
    ctx.beginPath();ctx.moveTo(ROTA[0][0],ROTA[0][1]);
    for(var j=1;j<ROTA.length;j++)ctx.lineTo(ROTA[j][0],ROTA[j][1]);
    ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#12352a";ctx.fillRect(W-14,250,14,60);
    var k;
    for(k=0;k<torres.length;k++){
      var t=torres[k];
      ctx.fillStyle="#0b100d";ctx.beginPath();ctx.arc(t.x,t.y,15,0,7);ctx.fill();
      ctx.fillStyle=t.cor;ctx.beginPath();ctx.arc(t.x,t.y,10,0,7);ctx.fill();
      ctx.fillStyle="#04120c";ctx.font="700 10px Inter,sans-serif";ctx.textAlign="center";
      ctx.fillText(t.nv,t.x,t.y+3.5);
      if(sel===k){ctx.strokeStyle="#fbbf24";ctx.lineWidth=2;ctx.beginPath();ctx.arc(t.x,t.y,17,0,7);ctx.stroke();
        ctx.strokeStyle="rgba(251,191,36,0.4)";ctx.beginPath();ctx.arc(t.x,t.y,t.alc,0,7);ctx.stroke();}
    }
    for(k=0;k<inis.length;k++){
      var e=inis[k];
      ctx.fillStyle=e.tipo==="boss"?"#7f1d1d":(e.tipo==="t"?"#9f1239":(e.tipo==="r"?"#a16207":"#166534"));
      ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,7);ctx.fill();
      if(e.gelo>0){ctx.strokeStyle="#a5f3fc";ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.r+2,0,7);ctx.stroke();}
      ctx.fillStyle="rgba(0,0,0,0.6)";ctx.fillRect(e.x-12,e.y-e.r-9,24,4);
      ctx.fillStyle="#4ade80";ctx.fillRect(e.x-12,e.y-e.r-9,24*Math.max(e.hp,0)/e.max,4);
    }
    for(k=0;k<efeitos.length;k++){
      var f=efeitos[k];
      ctx.strokeStyle=f.cor;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(f.x1,f.y1);ctx.lineTo(f.x2,f.y2);ctx.stroke();
    }
  }
  function loop(ts){
    if(over)return;
    var dt=Math.min((ts-last)/1000,0.05);last=ts;
    passo(dt);if(over)return;desenha();
    requestAnimationFrame(loop);
  }
  cv.addEventListener("click",function(e){
    if(over)return;
    var r=cv.getBoundingClientRect();
    var x=(e.clientX-r.left)*(W/r.width),y=(e.clientY-r.top)*(H/r.height);
    if(escolhida>=0){
      var t=TORRES[escolhida];
      if(ouro<t.custo){Z.toast("Ouro insuficiente.");return;}
      if(noCaminho(x,y)){Z.toast("Não dá para construir no caminho.");return;}
      for(var i=0;i<torres.length;i++)if(Math.hypot(torres[i].x-x,torres[i].y-y)<30){Z.toast("Perto demais de outra torre.");return;}
      ouro-=t.custo;
      torres.push({x:x,y:y,tipo:escolhida,dano:t.dano,alc:t.alc,vel:t.vel,cor:t.cor,gelo:!!t.gelo,nv:1,cd:0});
      Z.snd(520,0.07,"sine",0.04);
      hud();loja();return;
    }
    sel=-1;
    for(var j=0;j<torres.length;j++)if(Math.hypot(torres[j].x-x,torres[j].y-y)<18)sel=j;
    paineis();
    if(sel>=0){
      var s=torres[sel];
      document.getElementById("info").textContent=TORRES[s.tipo].nome+" nv"+s.nv+": dano "+Math.round(s.dano*(1+(s.nv-1)*0.6))+" · alcance "+s.alc+".";
    }
  });
  document.getElementById("chamar").addEventListener("click",function(){
    if(over||filaOnda.length||inis.length)return;
    if(onda>=ondaMax&&!ENDLESS)return;
    ouro+=10;novaOnda();espera=0;hud();
  });
  document.getElementById("melhorar").addEventListener("click",function(){
    if(sel<0||!torres[sel])return;
    var t=torres[sel],custo=Math.round(TORRES[t.tipo].custo*0.8*t.nv);
    if(ouro<custo){Z.toast("Ouro insuficiente.");return;}
    ouro-=custo;t.nv++;hud();paineis();Z.snd(760,0.08,"sine",0.04);
    document.getElementById("info").textContent=TORRES[t.tipo].nome+" nv"+t.nv+": dano "+Math.round(t.dano*(1+(t.nv-1)*0.6))+" · alcance "+t.alc+".";
  });
  document.getElementById("vender").addEventListener("click",function(){
    if(sel<0||!torres[sel])return;
    ouro+=Math.round(TORRES[torres[sel].tipo].custo*0.7);
    torres.splice(sel,1);sel=-1;hud();paineis();
    document.getElementById("info").textContent="Torre vendida.";
  });
  document.getElementById("reinicia").addEventListener("click",zera);
  zera();
})();
`;
  return wrapGame({ titulo: nome, sub, body, js });
}

/* ── ADEDONHA SOLO ──────────────────────────────────────── */
const DEDONHA_CATS = ["Nome", "Animal", "Fruta", "Cidade", "Objeto", "Cor", "Comida", "Profissão", "Filme ou série", "Time", "Marca", "País", "Cantor(a)", "Esporte", "Flor", "Jogo"];

export function adedonha({ nome, sub }) {
  const body = `
<div class="zhero"><h1>${nome}</h1><p>${sub}</p></div>
<div class="zcard pad center" style="max-width:560px;margin:0 auto">
  <p class="zlabel">Letra da rodada</p>
  <div class="zbig acc" id="letra">?</div>
  <div class="zprog mt mb"><i id="barra" style="width:100%"></i></div>
  <p class="mono" id="tempo" style="font-size:13px">90s restantes</p>
</div>
<div class="zcard pad mt" style="max-width:560px;margin-left:auto;margin-right:auto">
  <div class="col" id="campos"></div>
  <div class="row mt wrap" style="justify-content:center">
    <button class="zbtn" id="validar" type="button">Validar respostas</button>
    <button class="zbtn ghost" id="nova" type="button">Nova letra</button>
  </div>
</div>
<div class="zcard pad mt hidden" id="placar" style="max-width:560px;margin-left:auto;margin-right:auto"></div>`;
  const js = `
(function(){
  var CATS=${JSON.stringify(DEDONHA_CATS)};
  var letra,cats,restante,timerId,rodada,best;
  function zera(){
    clearInterval(timerId);
    var alfabeto="ABCDEFGHILMNOPRSTUVZ";
    letra=alfabeto[Math.floor(Math.random()*alfabeto.length)];
    cats=Z.shuffle(CATS).slice(0,6);
    restante=90;rodada=true;
    best=Z.store.best("adedonha");
    document.getElementById("letra").textContent=letra;
    document.getElementById("placar").classList.add("hidden");
    var box=document.getElementById("campos");
    box.innerHTML="";
    for(var i=0;i<cats.length;i++){
      var lab=document.createElement("label");
      lab.className="zlabel";
      lab.textContent=cats[i];
      var inp=document.createElement("input");
      inp.className="zinput";
      inp.id="c"+i;
      inp.setAttribute("autocomplete","off");
      inp.setAttribute("placeholder",cats[i]+" com "+letra+"…");
      box.appendChild(lab);box.appendChild(inp);
    }
    var first=document.getElementById("c0");
    if(first)first.focus();
    tick();
    timerId=setInterval(function(){
      restante--;
      tick();
      if(restante<=0)validar();
    },1000);
  }
  function norm(s){
    return (s||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().trim();
  }
  function tick(){
    document.getElementById("tempo").textContent=restante+"s restantes";
    document.getElementById("barra").style.width=(restante/90*100)+"%";
  }
  function validar(){
    if(!rodada)return;
    rodada=false;
    clearInterval(timerId);
    var pts=0,linhas=[];
    for(var i=0;i<cats.length;i++){
      var v=document.getElementById("c"+i).value;
      var ok=norm(v).length>=2&&norm(v)[0]===norm(letra)[0];
      if(ok)pts+=10;
      linhas.push("<tr><td>"+cats[i]+"</td><td>"+(Z.esc(v)||"<span class='dim'>—</span>")+"</td><td style='text-align:right;color:"+(ok?"var(--z-ok)":"var(--z-red)")+"'>"+(ok?"+10":"0")+"</td></tr>");
      document.getElementById("c"+i).disabled=true;
    }
    if(pts>best){best=pts;Z.store.setBest("adedonha",best);}
    Z.snd(pts>=50?880:440,0.25,pts>=50?"sine":"square",0.05);
    var pl=document.getElementById("placar");
    pl.classList.remove("hidden");
    pl.innerHTML="<h3 class='center'>"+pts+" pontos</h3><p class='dim center mb'>Recorde: "+best+"</p><div style='overflow-x:auto'><table class='ztable'><tr><th>Categoria</th><th>Resposta</th><th style='text-align:right'>Pontos</th></tr>"+linhas.join("")+"</table></div>";
    pl.scrollIntoView({behavior:"smooth",block:"nearest"});
  }
  document.getElementById("validar").addEventListener("click",validar);
  document.getElementById("nova").addEventListener("click",zera);
  zera();
})();
`;
  // adedonha monta o próprio hero (sem wrap duplo)
  return { body, js };
}

export const JOGOS2 = {
  tetris, breakout, pac, fuga, cacada, platformer, corrida, zumbis, shmup,
  golfe, damas, lig4, resta1, hanoi, nonogram, lights, defesa, adedonha,
};
