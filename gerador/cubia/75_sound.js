
/* ================================================== SOM PROCEDURAL (WebAudio) */
const Sound = (() => {
  let ctx = null, master = null, ok = true;
  function ensure() {
    if (!ok) return null;
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { ok = false; return null; }
        ctx = new AC(); master = ctx.createGain(); master.gain.value = Game.sound; master.connect(ctx.destination);
      } catch (e) { ok = false; return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f, dur, type, vol, f2) {
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, c.currentTime);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(24, f2), c.currentTime + dur);
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime((vol === undefined ? .12 : vol), c.currentTime + .008);
    g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + dur);
    o.connect(g); g.connect(master); o.start(); o.stop(c.currentTime + dur + .02);
  }
  function burst(dur, freq, q, vol, type) {
    const c = ensure(); if (!c) return;
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
    const g = c.createGain(); g.gain.value = vol === undefined ? .3 : vol;
    src.connect(f); f.connect(g); g.connect(master); src.start();
  }
  let lastStep = 0;
  return {
    resume() { ensure(); },
    setVol(v) { Game.sound = v; if (master) master.gain.value = v; },
    click() { tone(620, .05, 'square', .05, 460); },
    swing() { burst(.07, 900, .8, .07); },
    dig(id) {
      const d = DEFS[id] || {};
      if (d.tool === 'pick') burst(.055, 1650, 3.2, .13);
      else if (d.tool === 'axe') burst(.08, 620, 1.6, .14, 'lowpass');
      else if (d.tool === 'shovel') burst(.09, 340, 1.1, .12, 'lowpass');
      else burst(.05, 1100, 1.2, .07);
    },
    break_(id) { burst(.16, 700, .9, .2, 'lowpass'); tone(190, .12, 'triangle', .07, 110); },
    place() { burst(.07, 500, 1.4, .16, 'lowpass'); },
    step(id) {
      const now = performance.now();
      if (now - lastStep < 240) return;
      lastStep = now;
      const d = DEFS[id] || {};
      if (d.tool === 'pick') burst(.05, 480, 1.4, .075, 'lowpass');
      else if (d.tool === 'shovel') burst(.055, 260, .9, .07, 'lowpass');
      else burst(.045, 800, 1.1, .05);
    },
    jump() { tone(320, .07, 'sine', .05, 460); },
    hurt() { tone(220, .16, 'sawtooth', .1, 90); burst(.09, 300, .6, .1, 'lowpass'); },
    eat() { for (let i = 0; i < 3; i++) setTimeout(() => burst(.06, 320 + i * 90, 1.1, .09, 'lowpass'), i * 95); },
    pickup() { tone(880, .05, 'sine', .06, 1180); },
    orb() { tone(1240, .07, 'sine', .05, 1680); },
    craft() { burst(.09, 420, .8, .12, 'lowpass'); tone(300, .07, 'triangle', .05); },
    bow() { burst(.07, 1500, 2.4, .11); },
    fuse() { for (let i = 0; i < 5; i++) setTimeout(() => tone(1400 + i * 120, .04, 'square', .05), i * 240); },
    boom() { burst(.5, 120, .5, .42, 'lowpass'); tone(70, .5, 'sine', .22, 30); },
    mobHurt() { tone(180, .12, 'sawtooth', .07, 120); },
    mobDeath() { tone(150, .22, 'sawtooth', .07, 60); },
    spawn() { tone(90, .18, 'sine', .05, 60); },
    tp() { burst(.16, 900, 2.2, .1); tone(700, .16, 'sine', .06, 1500); },
    levelup() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, .16, 'triangle', .08), i * 90)); },
    adv() { tone(784, .12, 'triangle', .07); setTimeout(() => tone(1046, .2, 'triangle', .07), 110); },
  };
})();

/* ============================================== CONQUISTAS, TOASTS, MORTE = */
function toast(msg, kind) {
  const box = $('toasts');
  const el = document.createElement('div');
  el.className = 'toast' + (kind === 'bad' ? ' bad' : '');
  el.innerHTML = '<b>' + (kind === 'bad' ? 'Aviso' : 'Cubia') + '</b><span>' + msg + '</span>';
  box.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .4s, transform .4s'; el.style.opacity = 0; el.style.transform = 'translateX(16px)'; setTimeout(() => el.remove(), 420); }, 3400);
  while (box.children.length > 4) box.firstChild.remove();
}
const Adv = {
  list: [
    { key: 'wood', label: 'Madeira nova', desc: 'Quebre seu primeiro tronco', test: () => (stats.logs || 0) > 0 || InvStat('oaklog') + InvStat('birchlog') + InvStat('sprucelog') > 0 },
    { key: 'table', label: 'Bancada de trabalho', desc: 'Crie uma bancada', test: () => stats.craftedTable > 0 },
    { key: 'stone', label: 'Pedra sobre pedra', desc: 'Consiga um picareta de pedra', test: () => !!INV.count(ID.stonepick) },
    { key: 'iron', label: 'Fundição caseira', desc: 'Smeltar um lingote de ferro', test: () => stats.smelted >= 1 },
    { key: 'night', label: 'A primeira noite', desc: 'Sobreviva até o amanhecer', test: () => Game.day > 1 },
    { key: 'diamond', label: 'Diamantes!', desc: 'Minere um diamante', test: () => INV.count(I.diamond) > 0 },
    { key: 'dark', label: 'Morador das cavernas', desc: 'Desça abaixo de Y = 12', test: () => Player.pos.y < 12 },
    { key: 'kill', label: 'Caçador', desc: 'Derrote 10 criaturas', test: () => stats.kills >= 10 },
    { key: 'enchant', label: 'Poder arcano', desc: 'Encante um item', test: () => stats.enchanted > 0 },
    { key: 'obsidian', label: 'Noite escura e dura', desc: 'Quebre obsidiana', test: () => stats.obsidian > 0 },
  ],
  unlocked: new Set(),
  check() {
    for (const a of this.list) {
      if (this.unlocked.has(a.key)) continue;
      let ok = false;
      try { ok = !!a.test(); } catch (e) { ok = false; }
      if (ok) { this.unlocked.add(a.key); toast(a.label + ' — ' + a.desc); Sound.adv(); }
    }
  },
};
function InvStat(key) { return INV.count(ID[key] !== undefined ? ID[key] : key); }
const stats = { placed: 0, broken: 0, craftedTable: 0, smelted: 0, kills: 0, enchanted: 0, obsidian: 0 };
const statsInc = (k, n) => { stats[k] = (stats[k] || 0) + (n || 1); };
function die() {
  if (Player.dead) return;
  Player.dead = true;
  Player.hp = 0;
  if (UI.open) UI.close();                 /* senão a tela ficaria "aberta" para sempre */
  $('hud').classList.add('hidden');        /* na morte a barra sai de cena, como no Minecraft */
  const dropAll = () => {
    for (let i = 0; i < 9; i++) if (INV.hot[i]) { spawnDrop(Player.pos.x, Player.pos.y + 1, Player.pos.z, INV.hot[i].id, INV.hot[i].n, null, INV.hot[i].ench, INV.hot[i].dur); INV.hot[i] = null; }
    for (let i = 0; i < 27; i++) if (INV.main[i]) { spawnDrop(Player.pos.x, Player.pos.y + 1, Player.pos.z, INV.main[i].id, INV.main[i].n, null, INV.main[i].ench, INV.main[i].dur); INV.main[i] = null; }
    for (let i = 0; i < 4; i++) { if (INV.armor[i]) { spawnDrop(Player.pos.x, Player.pos.y + 1, Player.pos.z, INV.armor[i].id, 1, null, INV.armor[i].ench, INV.armor[i].dur); INV.armor[i] = null; } }
    Player.xpTotal = 0;
  };
  if (Game.mode !== 'creative' && Game.mode !== 'spectator') dropAll();
  Sound.hurt(); Sound.boom();
  document.exitPointerLock && document.exitPointerLock();
  if (Game.mode === 'hardcore') {
    localStorage.removeItem('cubia:world:' + Game.worldName);
    deathScreen(true);
  } else deathScreen(false);
  UI.syncVitals();
}
function deathScreen(hardcore) {
  const root = $('screenRoot');
  root.classList.add('on');
  const veil = document.createElement('div');
  veil.className = 'veil death';
  veil.style.position = 'absolute';
  veil.innerHTML =
    '<div class="panel" style="text-align:center;max-width:520px">' +
    '<p class="eyebrow">' + (hardcore ? 'Modo hardcore' : 'Você morreu') + '</p>' +
    '<h1>' + (hardcore ? 'Fim de jogo' : 'Que pena!') + '</h1>' +
    '<p class="lead">' + (hardcore ? 'No hardcore não há segunda chance: o mundo foi apagado.' : 'Seus itens ficaram caídos onde você caiu. Volte rápido antes que sumam.') + '</p>' +
    '<div class="btnrow" style="justify-content:center">' +
    (hardcore ? '<button class="btn btn--primary" id="mNew">Criar novo mundo</button>' : '<button class="btn btn--primary" id="mRespawn">Renascer</button>') +
    '<button class="btn btn--ghost" id="mMenu">Menu principal</button></div></div>';
  root.innerHTML = '';
  root.appendChild(veil);
  const r = $('mRespawn');
  if (r) r.onclick = () => { respawn(); root.classList.remove('on'); };
  const m = $('mNew');
  if (m) m.onclick = () => { location.reload(); };
  const mm = $('mMenu');
  if (mm) mm.onclick = () => location.reload();
}
function respawn() {
  Player.dead = false;
  $('hud').classList.remove('hidden');
  Player.hp = Player.maxHp; Player.food = 20; Player.sat = 5; Player.air = 10;
  Player.vel.set(0, 0, 0);
  const sp = Player.spawn.clone();
  sp.y = Math.max(2, findGround(Math.floor(sp.x), Math.floor(sp.z), WH - 4, 2) || sp.y);
  Player.pos.copy(sp);
  $('hurtvig').style.opacity = 0;
  UI.syncVitals(); UI.syncHotbar();
  resume();
}

/* ---------------------------------------------------- mão / item em 1ª pessoa */
let heldMesh = null, heldKey = -2;
function heldMaterialsFor(id) {
  const def = DEFS[id];
  if (def.kind === 'blockitem' || def.kind === 'block') {
    const bd = DEFS[def.block !== undefined ? def.block : id];
    const t = bd.tiles || { top: def.icon, side: def.icon, bottom: def.icon };
    const side = new THREE.MeshLambertMaterial({ map: tileTexture(t.side), transparent: true, alphaTest: .5 });
    const top = new THREE.MeshLambertMaterial({ map: tileTexture(t.top) });
    const bot = new THREE.MeshLambertMaterial({ map: tileTexture(t.bottom) });
    return [side, side, top, bot, side, side];
  }
  return new THREE.MeshLambertMaterial({ map: tileTexture(def.icon), transparent: true, alphaTest: .5, side: THREE.DoubleSide });
}
function updateHeldView() {
  if (!heldGroup) return;
  const st = INV.heldStack();
  const id = st ? st.id : -1;
  if (id !== heldKey) {
    heldKey = id;
    if (heldMesh) { heldGroup.remove(heldMesh); heldMesh = null; }
    if (id >= 0) {
      const def = DEFS[id];
      const isBlock = def.kind === 'blockitem' || def.kind === 'block';
      const geo = isBlock ? new THREE.BoxGeometry(.32, .32, .32) : new THREE.PlaneGeometry(.3, .3);
      heldMesh = new THREE.Mesh(geo, heldMaterialsFor(id));
      heldGroup.add(heldMesh);
    }
  }
  if (!heldMesh) return;
  const sw = Player.swing, bow = Player.bowT > 0;
  heldMesh.position.set(.42 - Math.sin(Math.min(1, sw) * Math.PI) * .12, -.34 + Math.sin(Game.t * 2.2) * .006 + (bow ? .1 : 0), -.62 + Math.sin(Math.min(1, sw) * Math.PI) * .1);
  heldMesh.rotation.set(bow ? -.4 : .18 + Math.sin(Math.min(1, sw) * Math.PI) * 1.2, .5 + (bow ? .5 : 0), bow ? .1 : -.35 + Math.sin(Math.min(1, sw) * Math.PI) * .5);
  if (!heldMesh.material.length && heldMesh) heldMesh.rotation.z += .4;
}
/* jogador em 3ª pessoa */
let selfMesh = null;
function updateSelfMesh() {
  if (!selfMesh) { selfMesh = buildMobMesh({ color: 0x3a6fd8, passive: false }); scene.add(selfMesh); }
  selfMesh.visible = Player.third && !Player.dead;
  if (!selfMesh.visible) return;
  selfMesh.position.copy(Player.pos);
  selfMesh.rotation.set(0, Player.yaw + Math.PI, 0);
}
