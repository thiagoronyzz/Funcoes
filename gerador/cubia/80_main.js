
/* ================================================ LAÇO, SAVE E MENU_PRINCIPAL */
let lastT = 0, fpsAcc = 0, fpsN = 0, debugT = 0, autosaveT = 0, saved = true;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = clamp((now - lastT) / 1000, 0, .05);
  lastT = now;
  Game.lastMs = Game.lastMs * .8 + dt * 1000 * .2;   /* média suave: manda no ritmo do carregamento */
  fpsAcc += dt; fpsN++;
  Game.t += dt;
  if (!Game.running) { if (renderer) renderer.render(scene, camera); return; }
  if (!Game.paused && !UI.open && !Player.dead) {
    Game.time += dt / Game.dayLen;
    if (Game.time >= 1) { Game.time -= 1; Game.day++; Adv.check(); }
    updatePlayer(dt);
    Mobs.update(dt);
    updateDrops(dt);
    updateArrows(dt);
    updateFurnaces(dt);
    TNT.update(dt);
    updateTargets();
  }
  particles.update(dt);
  updateSky(dt);
  updateChunks();
  updateHeldView();
  updateSelfMesh();
  if (Game.paused || UI.open) { camera.position.y += 0; }
  renderer.render(scene, camera);
  debugT -= dt;
  if (debugT <= 0 && !$('debug').classList.contains('hidden')) { debugT = .28; renderDebug(); }
  autosaveT -= dt;
  if (autosaveT <= 0 && !Game.paused) { autosaveT = 45; if (!saved && Game.mode !== 'spectator') { saveWorld(); toast('Autosave concluído'); } }
}
function renderDebug() {
  const p = Player.pos;
  const bi = world.chunk(Math.floor(p.x / CH), Math.floor(p.z / CH));
  const bi2 = bi ? bi.biome[(Math.floor(p.z) & 15) * CH + (Math.floor(p.x) & 15)] : 0;
  const st = xpState();
  const tgt = Player.target;
  const fps = fpsN / (fpsAcc || 1);
  let meshes = 0, tris = 0;
  for (const c of world.chunks.values()) if (c.mesh) { meshes++; tris += c.mesh.geometry.index ? c.mesh.geometry.index.count / 3 : 0; }
  $('debug').innerHTML =
    '<b>Cubia</b> ' + (fps | 0) + ' fps · ' + fmt(1000 / (fps || 1), 0) + ' ms\n' +
    'XYZ  ' + fmt(p.x, 2) + ' ' + fmt(p.y, 2) + ' ' + fmt(p.z, 2) + '\n' +
    'Chunk ' + Math.floor(p.x / CH) + ', ' + Math.floor(p.z / CH) + '  ·  bloco ' + Math.floor(p.x) + ' ' + Math.floor(p.y) + ' ' + Math.floor(p.z) + '\n' +
    'Bioma: ' + BNAME[bi2] + '   ·   semente ' + Game.seed + '\n' +
    'Olhando: ' + (tgt ? DEFS[tgt.id].label + ' (' + tgt.x + ',' + tgt.y + ',' + tgt.z + ')' : 'nada') + '\n' +
    'Horário: ' + clock() + ' (dia ' + Game.day + ')   ·   luz céu ' + fmt(Game.skyMul, 2) + '\n' +
    'Chunks carregados ' + world.chunks.size + ' · malhas ' + meshes + ' · triângulos ' + (tris | 0).toLocaleString('pt-BR') + '\n' +
    'Entidades ' + Mobs.list.length + ' · itens no chão ' + drops.length + ' · gotas/partículas ' + particles.list.length + '\n' +
    'Modo ' + Game.mode + '  ·  XP nível ' + st.lvl + ' (' + st.cur + '/' + st.need + ')  ·  edições ' + world.edits.size + ' chunks' +
    (Player.inWater ? '\nNa água (empurra com Espaço)' : '');
}
function clock() {
  const t = ((Game.time + .5) % 1) * 24;
  const hh = Math.floor(t), mm = Math.floor((t - hh) * 60);
  return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
}

/* -------------------------------------------------------------- save/load */
function serStack(s) { return s ? [s.id, s.n, s.dur === undefined ? 0 : s.dur, s.ench || 0] : 0; }
function deStack(a) { return a && a.length ? { id: a[0], n: a[1], dur: a[2] || undefined, ench: a[3] === 0 ? undefined : a[3] } : null; }
function saveWorld() {
  if (!world.chunks.size) return;
  try {
    const edits = [];
    for (const [k, m] of world.edits) {
      const arr = [];
      for (const [i, id] of m) arr.push(i, id);
      if (arr.length) edits.push([k, arr]);
    }
    const chests = [];
    for (const [k, arr] of world.chests) { const s = arr.map(serStack); if (s.some((x) => x)) chests.push([k, s]); }
    const furn = [];
    for (const [k, d] of world.furnaceData) furn.push([k, serStack(d.in), serStack(d.fuel), serStack(d.out), d.burn, d.burnMax, d.cook]);
    const obj = {
      v: 1, seed: Game.seed, mode: Game.mode, hardcore: Game.hardcore, rd: Game.rd, fov: Game.fov,
      time: Game.time, day: Game.day || 1, name: Game.worldName, sound: Game.sound,
      p: [Player.pos.x, Player.pos.y, Player.pos.z, Player.yaw, Player.pitch, Player.hp, Player.food, Player.sat, Player.xpTotal || 0, Player.held,
        Player.spawn.x, Player.spawn.y, Player.spawn.z, Player.air, Player.fly ? 1 : 0],
      inv: { hot: INV.hot.map(serStack), main: INV.main.map(serStack), armor: INV.armor.map(serStack), off: serStack(INV.off) },
      edits, chests, furn, stats, adv: [...Adv.unlocked],
    };
    localStorage.setItem('cubia:world:' + Game.worldName, JSON.stringify(obj));
    saved = true;
  } catch (e) {
    toast('Falha ao salvar (' + (e && e.name) + ') — mundo muito grande para o navegador', 'bad');
  }
}
function hasSave(name) { try { return !!localStorage.getItem('cubia:world:' + name); } catch (e) { return false; } }
function loadWorld(name) {
  let o = null;
  try { o = JSON.parse(localStorage.getItem('cubia:world:' + name)); } catch (e) { o = null; }
  if (!o) return false;
  applyState(o);
  return true;
}
function applyState(o) {
  Game.seed = o.seed | 0; world.seed = Game.seed; world.noise = makeNoise(Game.seed);
  Game.mode = o.mode || 'survival'; Game.hardcore = !!o.hardcore; Game.rd = o.rd || 6; Game.fov = o.fov || 75;
  Game.time = o.time || .3; Game.day = o.day || 1; Game.worldName = o.name || 'mundo-1'; Game.sound = o.sound === undefined ? .6 : o.sound;
  for (const c of [...world.chunks.values()]) disposeChunk(c);
  world.edits.clear(); world.chests.clear(); world.furnaceData.clear();
  const p = o.p || [0, SEA + 24, 0, 0, 0, 20, 20, 5, 0, 0, 0, SEA + 24, 0, 10, 0];
  Player.pos.set(p[0], p[1], p[2]); Player.yaw = p[3]; Player.pitch = p[4];
  Player.hp = p[5] || 20; Player.food = p[6] || 20; Player.sat = p[7] || 5; Player.xpTotal = p[8] || 0; Player.held = p[9] || 0;
  Player.spawn.set(p[10], p[11], p[12]); Player.air = p[13] === undefined ? 10 : p[13]; Player.fly = !!p[14];
  INV.hot = (o.inv && o.inv.hot || []).map(deStack); while (INV.hot.length < 9) INV.hot.push(null);
  INV.main = (o.inv && o.inv.main || []).map(deStack); while (INV.main.length < 27) INV.main.push(null);
  INV.armor = (o.inv && o.inv.armor || []).map(deStack); while (INV.armor.length < 4) INV.armor.push(null);
  INV.off = deStack(o.inv && o.inv.off); INV.craft = new Array(9).fill(null); INV.craftOut = null;
  for (const s of o.adv || []) Adv.unlocked.add(s);
  Object.assign(stats, o.stats || {});
  for (const [k, arr] of o.edits || []) {
    const cx = Math.floor(k / 1000003), cz = k - cx * 1000003;
    const c = world.chunk(cx, cz);
    if (!c) continue;
    const m = world.edits.get(k) || new Map();
    for (let i = 0; i < arr.length; i += 2) { m.set(arr[i], arr[i + 1]); c.blocks[arr[i]] = arr[i + 1]; }
    world.edits.set(k, m);
    c.dirty = true; c.lightDirty = true;
  }
  for (const [k, s] of o.chests || []) world.chests.set(k, s.map(deStack));
  for (const [k, a, b, c2, burn, bm, cook] of o.furn || []) {
    world.furnaceData.set(k, { in: deStack(a), fuel: deStack(b), out: deStack(c2), burn, burnMax: bm, cook, k });
  }
  scene.fog.near = Game.rd * CH * .42; scene.fog.far = Game.rd * CH * 1.06;
  UI.syncHotbar(); UI.syncVitals();
}
function markDirtySave() { saved = false; }

/* ------------------------------------------------------------- menus */
function veil(html, cls) {
  const root = $('screenRoot');
  root.innerHTML = '';
  root.classList.add('on');
  const v = document.createElement('div');
  v.className = 'veil ' + (cls || '');
  v.innerHTML = html;
  root.appendChild(v);
  return v;
}
function closeVeil() { $('screenRoot').innerHTML = ''; $('screenRoot').classList.remove('on'); }
const CONTROLS = [
  ['WASD', 'mover'], ['Espaço', 'pular / subir'], ['Ctrl', 'correr (sprint)'], ['Shift', 'agachar / descer'],
  ['Botão esq.', 'quebrar bloco / atacar'], ['Botão dir.', 'colocar / usar'], ['1…9 / roda', 'selecionar item'],
  ['E', 'inventário e criação'], ['Q', 'jogar item'], ['R', 'abrir bancada próxima'], ['V', '1ª / 3ª pessoa'],
  ['F', 'ligar voo (criativo)'], ['G', 'trocar de modo'], ['Esc', 'pausa'], ['F3', 'painel de depuração'],
];
function controlsTable() {
  return '<div class="keys">' + CONTROLS.map(([k, d]) => '<div><span>' + d + '</span><b class="kbd">' + k + '</b></div>').join('') + '</div>';
}
function mainMenu() {
  const canContinue = hasSave('mundo-1') || localStorage.getItem('cubia:last');
  const lastName = localStorage.getItem('cubia:last') || 'mundo-1';
  const html =
    '<div class="panel panel--wide">' +
    '<p class="eyebrow">Sandbox voxel de sobrevivência · arquivo único</p>' +
    '<h1>Cubia</h1>' +
    '<p class="lead">Mundo procedural infinito, mineração por dureza, crafting 2×2 e 3×3, fornalha, construção, ' +
    'mobs que nascem no escuro, fome, XP, encantamentos e ciclo dia-noite de 20 minutos. Tudo em um só HTML.</p>' +
    '<div class="cols"><div>' +
    '<h2>Novo mundo</h2>' +
    '<div class="field"><label for="seedIn">Semente (seed)</label><input id="seedIn" placeholder="ex.: floresta-77 (ou número)" value="' + Math.floor(Math.random() * 99999) + '"></div>' +
    '<div class="field" style="margin-top:8px"><label for="modeIn">Modo de jogo</label><select id="modeIn">' +
    '<option value="survival">Sobrevivência — vida, fome, mobs</option>' +
    '<option value="hardcore">Hardcore — uma vida só</option>' +
    '<option value="creative">Criativo — blocos infinitos e voo</option>' +
    '<option value="adventure">Aventura — sem quebrar/colocar</option>' +
    '<option value="spectator">Espectador — atravessa blocos</option></select></div>' +
    '<div class="btnrow"><button class="btn btn--primary" id="bNew">Criar e entrar</button>' +
    (hasSave(lastName) ? '<button class="btn" id="bCont">Continuar “' + lastName + '”</button>' : '') +
    '</div>' +
    '<h2>Ajustes</h2>' +
    '<div class="field"><label for="rdIn">Distância de renderização: <b id="rdVal">6</b> chunks</label><input type="range" id="rdIn" min="2" max="12" value="6"></div>' +
    '<div class="field" style="margin-top:8px"><label for="fovIn">Campo de visão: <b id="fovVal">75</b>°</label><input type="range" id="fovIn" min="55" max="105" value="75"></div>' +
    '<div class="field" style="margin-top:8px"><label for="volIn">Volume dos efeitos: <b id="volVal">60</b>%</label><input type="range" id="volIn" min="0" max="100" value="60"></div>' +
    '</div><div>' +
    '<h2>Controles</h2>' + controlsTable() +
    '<h2>O que está dentro</h2>' +
    '<div id="aboutBox"></div>' +
    '</div></div>' +
    '<div class="foot">Baseado no documento de design “Minecraft-like” deste repositório. Áudio e texturas são 100% procedurais: ' +
    'nada é baixado além da biblioteca three.js.</div></div>';
  const v = veil(html);
  $('aboutBox').innerHTML = aboutHtml();
  const rdIn = $('rdIn'), fovIn = $('fovIn'), volIn = $('volIn');
  rdIn.oninput = () => $('rdVal').textContent = rdIn.value;
  fovIn.oninput = () => $('fovVal').textContent = fovIn.value;
  volIn.oninput = () => { $('volVal').textContent = volIn.value; Sound.setVol(volIn.value / 100); };
  $('bNew').onclick = () => {
    const s = $('seedIn').value.trim();
    const seed = /^-?\d+$/.test(s) ? (Math.abs(parseInt(s, 10)) % 2147483647) || 1 : strSeed(s || 'cubia');
    startWorld(seed, $('modeIn').value, +rdIn.value, +fovIn.value, volIn.value / 100, 'mundo-' + (s || seed));
  };
  const bc = $('bCont');
  if (bc) bc.onclick = () => { if (loadWorld(lastName)) { Game.running = true; Game.paused = false; closeVeil(); $('hud').classList.remove('hidden'); requestLock(); } else toast('Save não encontrado', 'bad'); };
}
function aboutHtml() {
  const on = ['Mundo procedural infinito (chunks 16×96, Perlin multicamada: continentalidade, erosão, picos e vales)',
    '7 biomas com temperatura e umidade, cavernas 3D, lagos congelados, praias e deserto',
    '57 blocos e 66 itens com dureza, resistência a explosão, luz, transparência e drop próprio',
    'Hierarquia de ferramentas madeira → pedra → ferro → ouro → diamante (velocidade + nível mínimo)',
    'Crafting 2×2 no inventário e 3×3 na bancada, com livro de receitas automático e simetria horizontal',
    'Fornalha com combustível, tempo de cozimento, XP e estado aceso (ilumina a caverna)',
    'Baús de 27 slots, cama para dormir e definir o renascimento',
    'Vida (20 HP), fome (20), saturação, regeneração, veneno, afogamento, queda, lava, sufocação',
    'Inventário com 41 slots, durabilidade, arrastar-e-soltar, shift-clique e Q para largar',
    '10 tipos de mobs: passivos (que criam filhotes com maçã), neutros (provocáveis) e hostis com spawn por nível de luz',
    'Creeper que explode, esqueleto que atira, aranha que escala, enderman que se teletransporta — 10 criaturas ao todo',
    'XP, níveis e mesa de encantamentos com 8 encantamentos que realmente funcionam',
    'Dinamite, explosões que destroem blocos conforme a resistência, partículas e som procedural',
    '5 modos (sobrevivência, criativo, aventura, hardcore, espectador), autosave a cada 45 s e F3 de depuração'];
  const off = ['Redstone e automações (Fase 3 do roadmap)', 'Nether, End e chefões', 'Poções/brewing',
    'Multiplayer client-server', 'Trilhos, minecart e elevadores de água', 'Farming de trigo e vilas geradas'];
  return '<ul class="tight">' + on.map((x) => '<li>✔ ' + x + '</li>').join('') + '</ul>' +
    '<p style="margin-top:8px;color:var(--muted);font-size:12.5px">Fora deste escopo (ficam para as próximas fases do roadmap):</p>' +
    '<ul class="tight">' + off.map((x) => '<li>· ' + x + '</li>').join('') + '</ul>';
}
function startWorld(seed, mode, rd, fov, vol, name) {
  Game.seed = seed; world.seed = seed; world.noise = makeNoise(seed);
  Game.mode = mode; Game.hardcore = mode === 'hardcore'; Game.rd = rd; Game.fov = fov; Game.worldName = name;
  Sound.setVol(vol);
  Game.time = .12; Game.day = 1;
  Player.fly = mode === 'creative' || mode === 'spectator';
  Player.hp = Player.maxHp = 20; Player.food = 20; Player.sat = 5; Player.xpTotal = 0; Player.air = 10;
  INV.hot = new Array(9).fill(null); INV.main = new Array(27).fill(null); INV.armor = new Array(4).fill(null); INV.off = null;
  Mobs.clearAll();
  for (const d of drops) { scene.remove(d.mesh); }
  drops.length = 0;
  for (const a of arrows) scene.remove(a.mesh);
  arrows.length = 0;
  for (const c of [...world.chunks.values()]) disposeChunk(c);
  world.edits.clear(); world.chests.clear(); world.furnaceData.clear();
  /* gera um anel inicial ao redor do ponto de nascimento */
  const c0 = world.chunk(0, 0);
  const sy = world.surfaceY(8, 8);
  Player.pos.set(8.5, sy + .2, 8.5); Player.spawn.copy(Player.pos);
  for (let cz = -1; cz <= 1; cz++) for (let cx = -1; cx <= 1; cx++) world.chunk(cx, cz);
  if (mode === 'creative') {
    INV.add(ID.i_stone, 64); INV.add(ID.i_oakplanks, 64); INV.add(ID.i_glass, 64); INV.add(ID.i_torch, 64);
    INV.add(ID.diamondpick, 1); INV.add(ID.diamondsword, 1);
  } else {
    INV.add(ID.apple, 3);
  }
  $('hud').classList.remove('hidden');
  closeVeil();
  Game.running = true; Game.paused = false;
  scene.fog.near = Game.rd * CH * .42; scene.fog.far = Game.rd * CH * 1.06;
  UI.init(); gpuProbe();
  UI.syncHotbar(); UI.syncVitals();
  localStorage.setItem('cubia:last', name);
  Sound.resume();
  toast('Bem-vindo a Cubia · seed ' + seed + ' · ' + (mode[0].toUpperCase() + mode.slice(1)));
  toast('F3 mostra o painel de depuração · E abre a criação', 'bad');
  requestLock();
  markDirtySave();
}
function pause() {
  if (!Game.running || Game.paused) return;
  Game.paused = true;
  document.exitPointerLock && document.exitPointerLock();
  const html = '<div class="panel" style="max-width:660px">' +
    '<p class="eyebrow">Pausado</p><h1>Jogo pausado</h1>' +
    '<p class="lead">' + clock() + ' · dia ' + Game.day + ' · ' + Game.mode + ' · seed ' + Game.seed + '</p>' +
    '<div class="btnrow"><button class="btn btn--primary" id="pRes">Voltar</button>' +
    '<button class="btn" id="pSave">Salvar mundo</button>' +
    '<button class="btn btn--ghost" id="pMenu">Menu principal</button></div>' +
    '<h2>Controles</h2>' + controlsTable() +
    '<h2>Sistemas implementados</h2><div id="aboutBox2"></div>' +
    '<h2 style="margin-top:14px">Ajustes rápidos</h2>' +
    '<div class="field"><label for="rdIn2">Distância de renderização</label><input type="range" id="rdIn2" min="2" max="12" value="' + Game.rd + '"></div>' +
    '<div class="field" style="margin-top:8px"><label for="fovIn2">Campo de visão</label><input type="range" id="fovIn2" min="55" max="105" value="' + Game.fov + '"></div>' +
    '<div class="field" style="margin-top:8px"><label for="volIn2">Volume</label><input type="range" id="volIn2" min="0" max="100" value="' + Math.round(Game.sound * 100) + '"></div>' +
    '<label class="field" style="margin-top:10px"><span style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="ajIn" ' + (Game.autojump ? 'checked' : '') + '> Pulo automático ao bater em blocos</span></label>' +
    '<label class="field" style="margin-top:6px"><span style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="dayIn" ' + (Game.dayLen === 1200 ? 'checked' : '') + '> Dia de 20 minutos (desmarque para 4 min)</span></label>' +
    '</div>';
  veil(html);
  $('aboutBox2').innerHTML = aboutHtml();
  $('pRes').onclick = resume;
  $('pSave').onclick = () => { saveWorld(); toast('Mundo salvo em ' + new Date().toLocaleTimeString('pt-BR')); };
  $('pMenu').onclick = () => { saveWorld(); location.reload(); };
  $('rdIn2').oninput = (e) => { Game.rd = +e.target.value; scene.fog.near = Game.rd * CH * .42; scene.fog.far = Game.rd * CH * 1.06; markAllDirty(); };
  $('fovIn2').oninput = (e) => { Game.fov = +e.target.value; camera.fov = Game.fov; camera.updateProjectionMatrix(); };
  $('volIn2').oninput = (e) => Sound.setVol(e.target.value / 100);
  $('ajIn').onchange = (e) => { Game.autojump = e.target.checked; };
  $('dayIn').onchange = (e) => { Game.dayLen = e.target.checked ? 1200 : 240; };
}
function resume() {
  Game.paused = false;
  closeVeil();
  Sound.resume();
  requestLock();
}
addEventListener('beforeunload', () => { if (Game.running && !Player.dead) saveWorld(); });
addEventListener('error', (e) => { if (window.__cubiaFail && !Game.running) window.__cubiaFail(e.message); });

/* --------------------------------------------------------------- boot */
try {
  sayBoot('Desenhando ' + ATLAS.count + ' texturas 16×16…');
  initRender();
  sayBoot('Compilando shaders voxel e o céu dinâmico…');
  world.seed = 1; world.noise = makeNoise(1);
  world.chunk(0, 0);
  sayBoot('Pronto.');
  $('boot').classList.add('hidden');
  mainMenu();
  requestAnimationFrame((t) => { lastT = t; loop(t); });
  window.__cubia = {
    Game, world, chunks: world.chunks, Player, UI, INV, DEFS, ID, B, I, MAT: null, startWorld, saveWorld, loadWorld, applyState, Mobs, MOBDEF, Adv, stats,
    RECIPES, SMELT, FUELS, ENCH, ATLAS, matchRecipe, gridState, buildMesh, relight, genChunk, columnInfo, meshChunk, updateChunks, updateSky,
    breakTime, canHarvest, rollDrops, damage, heal, addXp, xpState, spendLevels, spawnDrop, spawnArrow, drops, arrows, particles, TNT, updateArrows, releaseBow, updateDrops, updateSelfMesh, updateHeldView, mobBlocked, findGround, hitMob, attackLoop, updateTargets, COOKED, camera, updateCameraRig, landFall, collides, die, respawn,
    raycastVoxel, solidAt, canPlace, clock, SHADERS: () => ({ V: SH_V, F: SH_F }), MATS: () => ({ solid: solidMat, water: waterMat }), clockFn: clock, loop, doBreak, useItem, updatePlayer, updateFurnaces, FACES, faceUV, AO_LVL, genChunk2: genChunk, CH, WH, SEA, placeBlock: null, tileUV, DEFSLEN: () => DEFS.length, COL: null,
  };
  window.__cubia.match = (cells, size) => matchRecipe(cells, size);
  window.__cubia.outOf = outOf;
} catch (err) {
  if (window.__cubiaFail) window.__cubiaFail(err && err.stack ? err.message : String(err));
  else throw err;
}
};
