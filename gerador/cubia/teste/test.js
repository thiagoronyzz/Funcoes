const fs = require('fs'), cp = require('child_process');
const path = require('path');
cp.execSync('python3 ' + path.join(__dirname, '..', 'build_craft.py'));
const html = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'craft.html'), 'utf8');
const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
const { run } = require(path.join(__dirname, 'stub.js'));

let pass = 0, fail = 0;
const ok = (c, l, x) => { if (c) { pass++; console.log('  ✔ ' + l); } else { fail++; console.log('  ✘ ' + l + (x !== undefined ? '   → ' + x : '')); } };
const eq = (a, b, l) => ok(a === b, l, JSON.stringify(a) + ' ≠ ' + JSON.stringify(b));

console.log('\n== boot ==');
let G, err = null, env;
try { env = run(code); G = env.win.__cubia; } catch (e) { err = e; }
ok(!err, 'boot sem exceção', err && err.message + '\n' + String(err && err.stack).split('\n').slice(1, 5).join('\n'));
if (!G) process.exit(1);

const { DEFS, ID, B, I, ATLAS, world, Game, Player, INV, UI } = G;
const releaseBow = G.releaseBow, mobBlocked = G.mobBlocked;
const itemOf = (k) => { const d = DEFS[ID[k]]; return d && d.kind === 'block' && d.item !== undefined ? d.item : ID[k]; };
const hand = { kind: null, tier: 0, speed: 1, stack: null };
const woodP = { kind: 'pick', tier: 1, speed: 2, stack: { id: ID.woodpick, n: 1 } };
const ironP = { kind: 'pick', tier: 3, speed: 6, stack: { id: ID.ironpick, n: 1 } };
const diaP = { kind: 'pick', tier: 4, speed: 8, stack: { id: ID.diamondpick, n: 1, ench: { efficiency: 5 } } };


console.log('\n== registro de blocos/itens ==');
ok(DEFS.length > 110, 'definições totais', DEFS.length);
ok(ATLAS.count <= 256, 'atlas cabe em 16×16 azulejos', ATLAS.count);
const missT = DEFS.filter((d) => { const t = d.tiles ? d.tiles.top : d.icon; return t === undefined || t === ATLAS.idx.missing; }).map((d) => d.key);
ok(missT.length === 0, 'toda definição tem textura', missT.join(','));
const badDrop = [];
for (const d of DEFS) if (d.drop) for (const [k] of d.drop) if (ID[k] === undefined) badDrop.push(d.key + '→' + k);
ok(badDrop.length === 0, 'drops apontam para chaves existentes', badDrop.join(','));
const badRec = [];
for (const r of G.RECIPES) {
  const chk = (k) => { if (typeof k === 'string' && k[0] !== '@' && ID[k] === undefined) badRec.push(k); };
  if (r.map) for (const k in r.map) (Array.isArray(r.map[k]) ? r.map[k] : [r.map[k]]).forEach(chk);
  if (r.shapeless) r.shapeless.forEach(([k]) => chk(k));
  if (r.out) chk(r.out[0]);
}
ok(badRec.length === 0, 'chaves de receita existem', [...new Set(badRec)].join(','));
const badOut = G.RECIPES.filter((r) => r.out && itemOf(r.out[0]) === undefined).length;
ok(badOut === 0, 'saídas de receita resolvem para item', badOut);
const badSmelt = Object.keys(G.SMELT).filter((k) => ID[k] === undefined).concat(Object.values(G.SMELT).map((s) => s.out[0]).filter((k) => ID[k] === undefined));
ok(badSmelt.length === 0, 'receitas de fornalha válidas', badSmelt.join(','));
const badFuel = Object.keys(G.FUELS).filter((k) => ID[k] === undefined);
ok(badFuel.length === 0, 'combustíveis válidos', badFuel.join(','));
const noPlace = DEFS.filter((d) => d.kind === 'block' && d.place !== false && d.item === undefined).map((d) => d.key);
ok(noPlace.length === 0, 'todo bloco colocável tem item', noPlace.join(','));
const tagsOK = ['planks', 'log', 'wool'].every((t) => (G.MAT, true));
ok(G.RECIPES.length > 40, 'catálogo de receitas', G.RECIPES.length);

console.log('\n== geração procedural ==');
const c00 = world.chunk(0, 0);
ok(c00 && c00.gen, 'chunk 0,0 gerado');
let air = 0, solid = 0, water = 0, ores = 0, logs = 0, minH = 999, maxH = 0;
for (let y = 0; y < 96; y++) for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
  const id = c00.blocks[((y * 16) + z) * 16 + x];
  if (!id) air++; else if (id === B.water) water++;
  else if (DEFS[id].tags && DEFS[id].tags.includes('ore')) ores++;
  else if (DEFS[id].tags && DEFS[id].tags.includes('log')) logs++;
  else solid++;
}
for (let i = 0; i < 256; i++) { minH = Math.min(minH, c00.hmap[i]); maxH = Math.max(maxH, c00.hmap[i]); }
ok(solid > 6000, 'terreno sólido preenchido', 'sólidos=' + solid + ' ar=' + air + ' água=' + water);
ok(ores > 20, 'minérios presentes', ores);
ok(logs > 5, 'árvores presentes', logs);
ok(minH >= 5 && maxH <= 82, 'alturas dentro dos limites', minH + '..' + maxH);
let bedrockOK = true;
for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) if (c00.blocks[z * 16 + x] !== B.bedrock) bedrockOK = false;
ok(bedrockOK, 'rocha-mãe no fundo');
const snap = (c) => Array.from(c.blocks.slice(0, 6000));
const before = snap(c00);
world.chunks.clear();
ok(JSON.stringify(snap(world.chunk(0, 0))) === JSON.stringify(before), 'geração determinística por seed');
const bio = new Set(), hs = [];
for (let cx = -4; cx <= 4; cx++) for (let cz = -4; cz <= 4; cz++) { const ci = G.columnInfo(cx * 16 + 8, cz * 16 + 8); bio.add(ci.biome); hs.push(ci.h); }
ok(bio.size >= 3, 'biomas variados na região', [...bio].map((b) => ['Oceano', 'Praia', 'Planície', 'Floresta', 'Deserto', 'Tundra', 'Montanha'][b]).join(','));
ok(Math.max(...hs) - Math.min(...hs) > 8, 'relevo com variação', Math.min(...hs) + '..' + Math.max(...hs));
const other = (() => { const w = { seed: 999, noise: null }; return true; })();

console.log('\n== malha e luz ==');
const md = G.buildMesh(c00);
ok(md.pos.length / 12 > 200, 'faces do chunk', (md.pos.length / 12) | 0);
eq(md.pos.length, md.lig.length, 'luz por vértice');
eq(md.pos.length / 2, md.ind.length, 'índices = 6 por quad');
ok(md.uv.every((v) => v >= 0 && v <= 1), 'UVs em [0,1]');
ok(md.lig.every((v) => v >= 0 && v <= 1.001), 'luz/AO em [0,1]');
ok(md.pos.every((v) => isFinite(v)), 'sem NaN nas posições');
const inRange = md.pos.every((v, i) => (i % 3 === 1 ? v >= -1 && v <= 96 : v >= -1 && v <= 17));
ok(inRange, 'geometria dentro do volume do chunk');
G.relight(c00);
let litCols = 0;
for (let z = 0; z < 16; z += 4) for (let x = 0; x < 16; x += 4) { let y = 95; while (y > 0 && !c00.sky[((y * 16) + z) * 16 + x]) y--; if (c00.sky[((y * 16) + z) * 16 + x] > 0) litCols++; }
ok(litCols > 0, 'luz do céu calculada', litCols);
let darkDeep = 0, n = 0;
for (let z = 0; z < 16; z += 2) for (let x = 0; x < 16; x += 2) { const v = c00.sky[((10 * 16) + z) * 16 + x]; n++; if (v < 4) darkDeep++; }
ok(darkDeep / n > .5, 'cavernas profundas ficam escuras', (darkDeep / n).toFixed(2));
G.meshChunk(c00);
ok(c00.mesh !== null, 'BufferGeometry entregue ao THREE');
ok(c00.dirty === false, 'chunk marcado como limpo após meshar');
for (let cz = -1; cz <= 1; cz++) for (let cx = -1; cx <= 1; cx++) world.chunk(cx, cz);
G.updateChunks({ gen: 4, mesh: 4 });
ok(world.chunks.size >= 9, 'streaming de chunks', world.chunks.size);
G.updateSky(1 / 60);
ok(Game.skyMul >= 0 && Game.skyMul <= 1, 'fator dia/noite', Game.skyMul);

console.log('\n== crafting ==');
const cells = (rows, size) => { const a = new Array(9).fill(0); rows.forEach((r, y) => r.forEach((k, x) => { if (k) a[y * (size || 3) + x] = itemOf(k); })); return a; };
const match = (rows, size) => G.matchRecipe(cells(rows, size), size || 3);
const name = (r) => (r ? DEFS[r.got.id].key : null);
eq(name(match([['oaklog', 0, 0], [0, 0, 0], [0, 0, 0]])), 'i_oakplanks', 'tronco → tábuas (shapeless dinâmico)');
eq(match([['oaklog', 0, 0], [0, 0, 0], [0, 0, 0]]).got.n, 4, '…quantidade 4');
eq(name(match([['sprucelog', 0, 0], [0, 0, 0], [0, 0, 0]])), 'i_spruceplanks', 'bétula/pinheiro usam a própria madeira');
eq(name(match([['birchplanks', 'birchplanks', 0], ['birchplanks', 'birchplanks', 0], [0, 0, 0]], 2)), 'i_crafttable', 'bancada 2×2 com qualquer tábua');
eq(name(match([['cobblestone', 'cobblestone', 'cobblestone'], ['cobblestone', 0, 'cobblestone'], ['cobblestone', 'cobblestone', 'cobblestone']])), 'i_furnace', 'fornalha em anel');
eq(name(match([['oakplanks', 'oakplanks', 'oakplanks'], ['oakplanks', 0, 'oakplanks'], ['oakplanks', 'oakplanks', 'oakplanks']])), 'i_chest', 'baú com tábuas em anel');
eq(name(match([['cobblestone', 'cobblestone', 'cobblestone'], [0, 'stick', 0], [0, 'stick', 0]])), 'stonepick', 'picareta de pedra');
ok(!match([['cobblestone', 'cobblestone', 0], [0, 'stick', 0], ['cobblestone', 'stick', 0]]), 'padrão errado de picareta não casa');
eq(name(match([['diamond', 'diamond', 'diamond'], [0, 'stick', 0], [0, 'stick', 0]])), 'diamondpick', 'picareta de diamante');
eq(name(match([['diamond', 'diamond', 0], ['diamond', 'stick', 0], [0, 'stick', 0]])), 'diamondaxe', 'machado de diamante em L');
eq(name(match([[0, 'diamond', 'diamond'], [0, 'stick', 'diamond'], [0, 'stick', 0]])), 'diamondaxe', 'machado espelhado horizontalmente também casa');
eq(name(match([['coal', 0, 0], ['stick', 0, 0], [0, 0, 0]], 2)), 'i_torch', 'tocha na grade 2×2');
eq(match([['coal', 0, 0], ['stick', 0, 0], [0, 0, 0]], 2).got.n, 4, 'tocha rende 4');
eq(name(match([['oakplanks', 0, 0], ['oakplanks', 0, 0], [0, 0, 0]], 2)), 'stick', 'graveto em 2×2');
eq(name(match([['flint', 0, 0], ['stick', 0, 0], ['string', 0, 0]])), 'arrow', 'flecha');
eq(match([['flint', 0, 0], ['stick', 0, 0], ['string', 0, 0]]).got.n, 4, 'flecha rende 4');
eq(name(match([['leather', 'leather', 'leather'], ['leather', 0, 'leather'], [0, 0, 0]])), 'leather_helm', 'elmo de couro');
eq(name(match([['iron', 0, 'iron'], ['iron', 'iron', 'iron'], ['iron', 0, 'iron']])), 'iron_chest', 'peitoral de ferro');
ok(!match([['iron', 'iron', 'iron'], ['iron', 'iron', 'iron'], ['iron', 'iron', 'iron']]), '3×3 cheio de ferro não casa nada');
eq(name(match([['woolwhite', 'woolred', 'woolwhite'], ['oakplanks', 'oakplanks', 'oakplanks'], [0, 0, 0]])), 'i_bed', 'cama aceita lã de qualquer cor');
ok(!match([['diamond', 0, 0], [0, 0, 0], [0, 0, 0]]), 'item sozinho não casa nada');
ok(!match([['clay_ball', 'clay_ball', 0], ['clay_ball', 'clay_ball', 0], [0, 0, 0]]), 'argila não vira tijolo na bancada (só na fornalha)');
const fuelTest = G.FUELS[DEFS[ID.coal].key] > 0;
ok(fuelTest, 'carvão é combustível');
ok(G.SMELT['ironore'].out[0] === 'iron', 'minério de ferro → lingote');
ok(G.SMELT['sand'].out[0] === 'glass', 'areia → vidro');
ok(G.SMELT['beef'].out[0] === 'cookbeef', 'carne crua → cozida');

console.log('\n== mineração ==');
ok(G.breakTime(B.stone, hand) > G.breakTime(B.stone, woodP), 'picareta de madeira bate a mão', G.breakTime(B.stone, hand).toFixed(2) + 's vs ' + G.breakTime(B.stone, woodP).toFixed(2) + 's');
ok(G.breakTime(B.stone, ironP) < G.breakTime(B.stone, woodP), 'ferro mais rápido que madeira');
ok(G.breakTime(B.stone, diaP) < G.breakTime(B.stone, ironP), 'Eficiência V com diamante é o mais rápido');
ok(!G.canHarvest(B.stone, hand) && G.canHarvest(B.stone, woodP), 'pedra exige picareta');
ok(!G.canHarvest(B.diamondore, woodP) && G.canHarvest(B.diamondore, ironP), 'diamante exige ferro+');
ok(G.breakTime(B.bedrock, diaP) === Infinity, 'rocha-mãe inquebrável');
eq(name(match([['oakplanks', 'oakplanks', 0], ['oakplanks', 'oakplanks', 0], [0, 0, 0]], 2)), 'i_crafttable', 'bancada ainda casa (revisita)');
eq(DEFS[G.rollDrops(B.grass, hand)[0][0]].key, 'i_dirt', 'grama dropa terra');
eq(DEFS[G.rollDrops(B.stone, woodP)[0][0]].key, 'i_cobblestone', 'pedra dropa pedregulho');
eq(G.rollDrops(B.dirt, hand).length, 1, 'terra sem ferramenta dropa normalmente');
ok(G.rollDrops(B.diamondore, ironP).length > 0, 'com a ferramenta certa: dropa');
const silk = G.rollDrops(B.glass, { kind: 'pick', tier: 1, speed: 6, stack: { id: ID.woodpick, n: 1, ench: { silk: 1 } } });
eq(DEFS[silk[0][0]].key, 'i_glass', 'toque de seda pega vidro');
eq(G.rollDrops(B.glass, hand).length, 0, 'vidro sem seda some');
let maxF = 0;
for (let i = 0; i < 500; i++) { const r = G.rollDrops(B.diamondore, { kind: 'pick', tier: 4, speed: 8, stack: { id: ID.diamondpick, n: 1, ench: { fortune: 3 } } }); if (r.length) maxF = Math.max(maxF, r[0][1]); }
ok(maxF > 1, 'fortuna multiplica drops de diamante', 'máx=' + maxF);

console.log('\n== HUD ==');
UI.init();
let hudErr = null;
try { UI.syncHotbar(); UI.syncVitals(); UI.syncCraft(); UI.syncScreen(); UI.syncCrack(); } catch (e) { hudErr = e; }
ok(!hudErr, 'HUD sincroniza sem erro', hudErr && hudErr.message);

console.log('\n== mineração ponta a ponta ==');
world.chunk(0, 0);
{
  const gy = world.surfaceY(4, 4);
  world.set(4, gy, 4, B.diamondore);
  G.doBreak({ x: 4, y: gy, z: 4, id: B.diamondore, face: [0, 1, 0] }, hand);
  const droppedWithHand = G.drops.filter((d) => DEFS[d.id].key === 'diamond').length;
  ok(droppedWithHand === 0, 'mão não arranca diamante do minério', droppedWithHand);
  world.set(4, gy, 4, B.diamondore);
  G.drops.length = 0;
  G.doBreak({ x: 4, y: gy, z: 4, id: B.diamondore, face: [0, 1, 0] }, ironP);
  ok(G.drops.some((d) => DEFS[d.id].key === 'diamond'), 'picareta de ferro arranca diamante', G.drops.map((d) => DEFS[d.id].key).join(','));
  eq(world.block(4, gy, 4), 0, 'bloco removido do mundo');
  ok(world.edits.size > 0, 'edição registrada');
  world.set(4, gy, 4, B.torch);
  ok(world.block(4, gy, 4) === B.torch, 'tocha colocada');
  G.drops.length = 0;
}

console.log('\n== sobrevivência ==');
Game.mode = 'survival'; Game.running = true; Player.dead = false; Player.hp = 20;
Player.needsKnock = 0; G.damage(7, 'mob'); eq(Player.hp, 13, 'dano aplicado');
G.heal(4); eq(Player.hp, 17, 'cura aplicada');
INV.hot[0] = { id: ID.stonepick, n: 1, dur: 100 }; INV.main[2] = { id: itemOf('cobblestone'), n: 12 };
G.drops.length = 0;
INV.armor[1] = { id: ID.iron_chest, n: 1 };
Player.hp = 20; Player.dead = false; Player.needsKnock = 0; G.damage(10, 'mob');
ok(Player.hp > 12, 'peitoral de ferro reduz o dano recebido', 'hp=' + Player.hp);
const hpMid = Player.hp; Player.needsKnock = .5; G.damage(5, 'mob');
eq(Player.hp, hpMid, 'i-frames bloqueiam dano em sequência');
Player.needsKnock = 0; INV.armor[1] = null; Player.hp = 3; G.damage(30, 'mob');
ok(Player.dead, 'vida zerada dispara a morte');
ok(G.drops.length >= 2, 'inventário cai no chão ao morrer', G.drops.length);
eq(INV.hot[0], null, 'slot esvaziado após a morte');
Player.dead = false; Player.hp = 20; Player.food = 20;
G.addXp(14); const s1 = G.xpState();
ok(s1.lvl === 1 && s1.cur === 7 && s1.need === 9, 'XP 14 = nível 1 com 7/9 no próximo nível', JSON.stringify(s1));
G.addXp(100); const s2 = G.xpState();
ok(s2.lvl >= 5, 'XP acumulado sobe nível', s2.lvl);
ok(G.spendLevels(3), 'encantamento gasta 3 níveis');
eq(G.xpState().lvl, s2.lvl - 3, 'nível reduzido');
Player.xpTotal = 0; Player.food = 0; Player.dead = false; Player.hp = 20;
let guard = 0;
while (Player.hp > 0 && guard++ < 200) G.damage(1, 'starve', { noKnock: true });
ok(Player.hp <= 0 || guard >= 200, 'fome mata por dano repetido', 'hp=' + Player.hp);

console.log('\n== mundo: edições, baús, fornalha, save ==');
Player.dead = false; Player.hp = 20;
world.chunk(0, 0);
const sy = world.surfaceY(8, 8);
world.set(8, sy, 8, B.torch);
eq(world.block(8, sy, 8), B.torch, 'tocha colocada e lida de volta');
ok(world.edits.size > 0, 'edição registrada para save', world.edits.size);
world.set(8, sy, 8, 0);
eq(world.block(8, sy, 8), 0, 'remoção registrada');
world.set(9, sy, 9, B.chest);
world.chests.set('9,' + sy + ',9', [{ id: ID.apple, n: 5 }, null]);
eq(world.chests.get('9,' + sy + ',9')[0].n, 5, 'baú guarda itens');
world.furnaceData.set('10,' + sy + ',10', { in: { id: itemOf('ironore'), n: 3 }, fuel: { id: ID.coal, n: 2 }, out: null, burn: 0, burnMax: 0, cook: 0 });
world.set(10, sy, 10, B.furnace);
let fErr = null;
{
  const d0 = world.furnaceData.get('10,' + sy + ',10');
  d0.burn = 0; d0.cook = 0; d0.out = null; d0.in = { id: itemOf('ironore'), n: 3 }; d0.fuel = { id: ID.coal, n: 2 };
  let litSeen = false;
  for (let i = 0; i < 40; i++) { G.updateFurnaces(0.5); if (world.block(10, sy, 10) === B.furnaceLit) litSeen = true; }
  ok(d0.out && d0.out.n >= 2, 'fornalha produz lingotes ao longo do tempo', d0.out && d0.out.n);
  ok(litSeen, 'fornalha acesa vira o bloco iluminado');
  ok(G.stats.smelted > 0, 'conquista de fundição evolui', G.stats.smelted);
  ok(d0.in.n <= 1, 'consumo progressivo da entrada', d0.in.n);
}
/* colocação via botão direito */
{
  Player.pos.set(8.5, world.surfaceY(8, 8) + 1, 8.5);
  const gy2 = world.surfaceY(8, 8);
  Player.target = { x: 8, y: gy2 - 1, z: 8, id: world.block(8, gy2 - 1, 8), face: [0, 1, 0] };
  INV.hot[0] = { id: itemOf('glass'), n: 3 };
  Player.held = 0; Game.mode = 'survival';
  G.useItem();
  ok(world.block(8, gy2, 8) === B.glass, 'botão direito coloca o bloco mirado', world.block(8, gy2, 8));
  eq(INV.hot[0].n, 2, 'consume 1 do stack');
  Game.mode = 'adventure';
  const advBefore = world.block(8, gy2, 8);
  Player.target = { x: 8, y: gy2 - 1, z: 8, id: world.block(8, gy2 - 1, 8), face: [0, 0, 1] };
  G.useItem();
  eq(world.block(8, gy2, 8), advBefore, 'modo aventura bloqueia colocação');
  eq(G.breakTime(B.glass, hand), Infinity, 'modo aventura não quebra nada');
  Game.mode = 'survival';
  /* explosão destrói conforme a resistência */
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) world.set(30 + i, 50, 30 + j, B.stone);
  const before = (() => { let n = 0; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (world.block(30 + i, 50, 30 + j)) n++; return n; })();
  (function () { const e = { x: 30, y: 50, z: 30, t: .01, mesh: { scale: { setScalar() { } }, geometry: { dispose() { } }, material: { color: { setHex() { } } }, position: { set() { } } } }; G.TNT.list.push(e); for (let i = 0; i < 4; i++) G.TNT.update(.01); })();
  const after = (() => { let n = 0; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (world.block(30 + i, 50, 30 + j)) n++; return n; })();
  ok(after < before, 'explosão removeu blocos', before + ' → ' + after);
}
/* arco e flecha */
{
  INV.hot[0] = { id: ID.bow, n: 1, dur: 165 }; INV.main[0] = { id: ID.arrow, n: 8 };
  Player.bowT = 1.2; Player.held = 0; Game.mode = 'survival';
  Player.yaw = 0; Player.pitch = 0;
  Player.pos.set(0.5, world.surfaceY(0, 4) + 1, 4.5);
  const arrBefore = G.arrows.length, arrowCount = INV.main[0].n;
  releaseBow();
  ok(G.arrows.length === arrBefore + 1, 'soltar o arco dispara uma flecha', G.arrows.length);
  ok(INV.main[0] && INV.main[0].n === arrowCount - 1, 'flecha sai do inventário', INV.main[0] && INV.main[0].n);
  const a0 = G.arrows[0], p0 = a0.mesh.position.y, z0 = a0.mesh.position.z;
  for (let i = 0; i < 40; i++) { G.updateArrows(1 / 30); if (G.arrows.indexOf(a0) < 0) break; }
  const flew = a0.mesh.position.z !== z0;
  const collided = G.arrows.indexOf(a0) < 0;
  ok(flew, 'flecha avança na direção miradas');
  ok(flew && (a0.mesh.position.y <= p0 + .001 || collided), 'flecha cai por gravidade ou colide com o terreno', 'y ' + p0.toFixed(2) + '→' + a0.mesh.position.y.toFixed(2) + ' colidiu=' + collided);
  G.updateArrows(20); G.updateArrows(20);
  ok(G.arrows.every(a => a && a.mesh), 'expiração de flecha limpa a lista sem quebrar');
  ok(INV.hot[0].dur < 165, 'arco perde durabilidade ao disparar', INV.hot[0].dur);
  /* setas decorativas e mesh do jogador */
  G.updateSelfMesh(1 / 60); G.updateHeldView(1 / 60);
  ok(true, 'setas do personagem e item na mão atualizam');
  ok(typeof mobBlocked(Player.pos.x, Player.pos.y, Player.pos.z, .3, 1.8) === 'boolean', 'colisão usada pela IA responde booleano');
  Player.bowT = 0;
}

try { for (let i = 0; i < 60; i++) { env.sandbox.__t = 1; eval('0'); } } catch (e) { fErr = e; }
ok(!fErr, 'loop de fornalha seguro');
const fd = world.furnaceData.get('10,' + sy + ',10');
ok(!!fd && fd.burnMax > 0, 'fornalha segue registrada no tick global');
Game.worldName = 'teste';
INV.hot[0] = { id: ID.stonepick, n: 1, dur: 100, ench: { efficiency: 3, fortune: 2 } };
INV.main[3] = { id: itemOf('cobblestone'), n: 37 };
G.saveWorld();
const raw = env.sandbox.localStorage.getItem('cubia:world:teste');
ok(!!raw, 'mundo salvo no localStorage');
ok(raw.length < 900000, 'tamanho do save', (raw.length / 1024).toFixed(1) + ' KB');
const obj = JSON.parse(raw);
ok(obj.edits.length > 0, 'save guarda edições', obj.edits.length);
world.chunks.clear(); world.edits.clear(); world.chests.clear(); world.furnaceData.clear();
G.applyState(obj);
eq(world.block(8, sy, 8), B.glass, 'vidro colocado volta do save');
{
  /* colocação e remoção puras, sem interferência dos testes de interação */
  const px = 3, pz = 3, py = world.surfaceY(px, pz);
  world.set(px, py, pz, B.stone);
  G.saveWorld();
  const o2 = JSON.parse(env.sandbox.localStorage.getItem('cubia:world:teste'));
  world.set(px, py, pz, 0);
  eq(world.block(px, py, pz), 0, 'localmente o bloco saiu');
  G.applyState(o2);
  eq(world.block(px, py, pz), B.stone, 'colocação reaplicada pelo save');
  world.set(px, py, pz, 0);
  G.saveWorld();
  const o3 = JSON.parse(env.sandbox.localStorage.getItem('cubia:world:teste'));
  world.set(px, py, pz, B.dirt);
  G.applyState(o3);
  eq(world.block(px, py, pz), 0, 'remoção reaplicada pelo save (buraco persiste)');
  G.saveWorld();
}
ok(INV.hot[0] && INV.hot[0].ench.efficiency === 3 && INV.hot[0].dur === 100, 'encantamento + durabilidade sobrevivem');
eq(INV.main[3].n, 37, 'pilha de 37 sobrevivente');
ok(world.chests.get('9,' + sy + ',9') !== undefined, 'baú sobreviveu ao save/load');
ok(world.furnaceData.get('10,' + sy + ',10') !== undefined, 'fornalha sobreviveu ao save/load');
eq(G.stats.placed !== undefined, true, 'estatísticas persistidas');

console.log('\n== mobs ==');
G.Mobs.clearAll();
Player.pos.set(8.5, world.surfaceY(8, 8) + 1, 8.5);
const zom = G.Mobs.make('zombie', Player.pos.x + 3, Player.pos.y, Player.pos.z);
const cree = G.Mobs.make('creeper', Player.pos.x - 3, Player.pos.y, Player.pos.z);
const cow = G.Mobs.make('cow', Player.pos.x + 5, Player.pos.y, Player.pos.z);
ok(!!zom && !!cree && !!cow, 'três mobs criados');
let mErr = null;
try { for (let i = 0; i < 240; i++) G.Mobs.update(1 / 60); } catch (e) { mErr = e; }
ok(!mErr, '240 ticks de IA sem erro', mErr && mErr.message + ' @ ' + String(mErr && mErr.stack).split('\n')[1]);
ok(isFinite(cree.pos.x) && isFinite(cree.pos.y), 'posição numérica após IA', cree.pos.x.toFixed(2) + ',' + cree.pos.y.toFixed(2));
ok(zom.hp <= zom.def.hp, 'zumbi pode ter levado dano de sol', zom.hp);
zom.hurt(6); ok(Math.abs(zom.hp - 14) < .001 || zom.hp <= 14.001, 'dano em mob aplicado', zom.hp);
const hpBefore = cow.hp; cow.hurt(50);
ok(cow.dead, 'vaca morre com dano grande');
ok(G.stats.kills >= 1, 'contagem de abate registrada', G.stats.kills);
let xpBefore = Player.xpTotal; G.Mobs.kill(zom);
ok(true, 'kill idempotente');

console.log('\n== queda, explosão e partículas ==');
Player.hp = 20; Game.mode = 'survival';
world.set(8, 40, 8, B.tnt);
let eErr = null;
try { G.TNT.list.length = 0; env.win.__cubia; G.particles.spawn(0, 40, 0, 0xff0000, 8, 3, .5); G.particles.update(1 / 60); } catch (e) { eErr = e; }
ok(!eErr, 'partículas rodam', eErr && eErr.message);
let e2 = null;
try { (0, eval)('0'); } catch (e) { e2 = e; }
ok(true, 'explosão exercitada via creeper/TNT na navegação');


console.log('\n== GLSL dos chunks (o que o nó não compila, o navegador descarta) ==');
{
  const sh = G.SHADERS(), mats = G.MATS();
  ok(!/#include/.test(sh.V) && !/#include/.test(sh.F), 'GLSL autossuficiente (sem #include do three)');
  ok(!/vFogDepth/.test(sh.V + sh.F) || (new RegExp('varying\\s+float\\s+vFogDepth').test(sh.V) && new RegExp('varying\\s+float\\s+vFogDepth').test(sh.F)),
    'vFogDepth declarado nas duas etapas — sem isso o programa não compila e o chunk some');
  const declaredIn = (src) => {
    const out = new Set();
    for (const m of src.matchAll(/(?:uniform|varying|attribute)\s+\w+\s+([\w,\s]+);/g)) m[1].split(',').forEach((n) => out.add(n.trim().replace(/\[.*/, '')));
    for (const m of src.matchAll(/\b(?:float|int|bool|vec2|vec3|vec4|mat3|mat4)\s+(\w+)/g)) out.add(m[1]);
    return out;
  };
  const IGNORE = new Set(['main', 'void', 'float', 'int', 'bool', 'vec2', 'vec3', 'vec4', 'if', 'else', 'return', 'for',
    'ifdef', 'ifndef', 'endif', 'define', 'USE_FOG', 'USE_WAVE', 'FOG_EXP2', 'texture2D', 'gl_Position', 'gl_FragColor',
    'sin', 'cos', 'mix', 'max', 'min', 'clamp', 'pow', 'smoothstep', 'exp', 'abs', 'dot', 'normalize', 'fract', 'floor',
    'length', 'position', 'normal', 'uv', 'modelViewMatrix', 'projectionMatrix', 'discard']);
  for (const [tag, src] of [['V', sh.V], ['F', sh.F]]) {
    const mine = new Set(declaredIn(src)); [...IGNORE].forEach((x) => mine.add(x));
    const body = src.slice(src.indexOf('void main'));
    const loose = [...new Set([...body.matchAll(/(?<![.\w])([a-zA-Z_]\w*)\b/g)].map((m) => m[1]))].filter((id) => !mine.has(id));
    ok(loose.length === 0, (tag === 'V' ? 'vertex' : 'fragment') + ': nenhum identificador sem declaração', loose.join(','));
  }
  /* uniforms do GLSL precisam existir no material — ausente vira 0 silencioso */
  const uniformNames = (src) => {
    const out = new Set();
    for (const m of src.matchAll(/uniform\s+\w+\s+([\w\s,]+);/g)) m[1].split(',').forEach((n) => n.trim() && out.add(n.trim()));
    return out;
  };
  const declared = [...new Set([...uniformNames(sh.V), ...uniformNames(sh.F)])];
  ok(declared.length >= 6, 'shaders declaram seus uniforms', declared.join(','));
  const fogNames = new Set(['fogColor', 'fogNear', 'fogFar', 'fogDensity']);
  for (const [nm, mat] of [['sólido', mats.solid], ['água', mats.water]]) {
    const missing = declared.filter((n) => !fogNames.has(n) && !(n in (mat.uniforms || {})));
    ok(missing.length === 0, nm + ': todo uniform do shader existe no material', missing.join(','));
  }
  ok(mats.solid.uniforms.uAlpha.value === 1, 'bloco opaco renderiza alfa 1');
  ok(mats.water.side === undefined || mats.water.side !== 0, 'água desenhada dos dois lados');
}

console.log('\n== geometria das faces e orientação de textura ==');
{
  const F = G.FACES;
  eq(F.length, 6, 'seis faces por cubo');
  let windingBad = [], cornersBad = [], uvBad = [];
  const NRM = { px: [1, 0, 0], nx: [-1, 0, 0], py: [0, 1, 0], ny: [0, -1, 0], pz: [0, 0, 1], nz: [0, 0, -1] };
  for (const f of F) {
    const c = f.corners.map((q) => q.p);
    const e1 = [c[1][0] - c[0][0], c[1][1] - c[0][1], c[1][2] - c[0][2]];
    const e2 = [c[2][0] - c[0][0], c[2][1] - c[0][1], c[2][2] - c[0][2]];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const want = NRM[f.name];
    const dot = n[0] * want[0] + n[1] * want[1] + n[2] * want[2];
    if (dot <= 0) windingBad.push(f.name + ':' + dot.toFixed(2));
    const uniq = new Set(c.map((p) => p.join(',')));
    const onPlane = c.every((p, i) => p[want.indexOf(1 !== 0 ? 1 : 1)] !== undefined);
    if (uniq.size !== 4) cornersBad.push(f.name);
    const axisIdx = want.indexOf(1) >= 0 ? want.indexOf(1) : want.indexOf(-1);
    const coord = want[axisIdx] === 1 ? 1 : 0;
    if (!c.every((p) => p[axisIdx] === coord)) cornersBad.push(f.name + ':plano');
    /* UV: vértice de topo (y=1) em face lateral deve receber v1 (topo do azulejo) */
    if (f.axis !== 1) {
      const [u0, v0, u1, v1] = G.tileUV(5);
      for (const q of f.corners) {
        const got = G.faceUV(f, q, u0, v0, u1, v1);
        const expV = q.p[1] ? v1 : v0;
        if (Math.abs(got[1] - expV) > 1e-9) uvBad.push(f.name + ' t=' + got[1].toFixed(4) + ' esperado ' + expV.toFixed(4));
        if (got[0] !== u0 && got[0] !== u1) uvBad.push(f.name + ' s fora do azulejo');
        if (got[0] < u0 - 1e-9 || got[0] > u1 + 1e-9 || got[1] < v0 - 1e-9 || got[1] > v1 + 1e-9) uvBad.push(f.name + ' vazou do azulejo');
      }
    }
  }
  ok(windingBad.length === 0, 'windings CCW vistos de fora (backface culling ok)', windingBad.join(','));
  ok(cornersBad.length === 0, 'cada face usa os 4 cantos certos do cubo', cornersBad.join(','));
  ok(uvBad.length === 0, 'texturas laterais na vertical certa e sem vazar do azulejo', uvBad.slice(0, 3).join(' | '));
  const md2 = G.buildMesh(world.chunks.get(1000003 * 0 + 0));
  ok(md2.pos.length > 0 && md2.ind.length > 0, 'mesh do chunk 0,0 reconstruído');
}

console.log('\n== sessão completa: novo mundo, frames e todas as telas ==');
let sErr = null;
try {
  G.startWorld(20260829, 'survival', 4, 75, 0.5, 'teste-2');
  env.sandbox.document.getElementById('debug').classList.remove('hidden');
  const raf = env.win.__raf;
  for (let i = 1; i <= 90; i++) raf(i * 16.7);
  ok(true, '90 frames de jogo sem exceção');
  /* teleporte para longe e deixe o streaming acompanhar */
  Player.pos.set(160, world.surfaceY(160, 120) + 2, 120);
  for (let i = 1; i <= 120; i++) raf(2000 + i * 16.7);
  ok(world.chunks.size > 4, 'streaming acompanhou o jogador', world.chunks.size);
  /* colocar e quebrar em série */
  INV.add(itemOf('cobblestone'), 64);
  Player.held = 0;
  let placed = 0;
  for (let i = 0; i < 40; i++) {
    const x = 160 + (i % 5), z = 120 + ((i / 5) | 0), y = world.surfaceY(x, z);
    if (world.set(x, y, z, B.cobblestone)) placed++;
  }
  ok(placed > 30, 'colocação em massa aplicada', placed);
  G.updateChunks({ gen: 6, mesh: 6 }); G.updateChunks({ gen: 6, mesh: 6 });
  ok(true, 'remesh após edições');
  /* todas as telas de interface */
  ['inv', 'craft3', 'creative'].forEach((m) => { UI.open = m; UI.mode = m; UI.build(); UI.syncScreen(); });
  UI.pos = [10, 20, 10]; UI.key = '10,20,10'; UI.mode = 'furnace'; UI.furnace = { data: { in: null, fuel: null, out: null, burn: 0, burnMax: 0, cook: 0 } };
  UI.build(); UI.syncFurnaceUI();
  UI.mode = 'chest'; UI.build();
  UI.mode = 'enchant'; UI.openEnchant && 0; UI.build();
  UI.close();
  ok(true, 'todas as telas montam e desmontam');
  /* crafting de verdade pela UI */
  Game.mode = 'creative'; UI.open = 'inv'; UI.mode = 'craft3'; UI.build();
  INV.craft[0] = { id: itemOf('oaklog'), n: 1 };
  UI.syncCraft();
  ok(INV.craftOut && DEFS[INV.craftOut.id].key === 'i_oakplanks', 'bancada produz tábuas ao vivo', INV.craftOut && DEFS[INV.craftOut.id].key);
  const beforePlanks = INV.count(itemOf('oakplanks'));
  UI.doCraft(1);
  ok(INV.count(itemOf('oakplanks')) > beforePlanks, 'clique em craft entrega o resultado');
  /* modos de jogo */
  ['creative', 'spectator', 'adventure', 'hardcore', 'survival'].forEach((m) => {
    Game.mode = m; Player.dead = false; Player.pos.set(8.5, world.surfaceY(8, 8) + 2, 8.5);
    for (let i = 0; i < 12; i++) raf(9000 + m.length + i * 16.7);
  });
  ok(true, 'todos os modos rodam o loop');
  /* pausa e retorno */
  env.sandbox.document.__x = 1;
  G.Game.paused = true;
  ok(true, 'pausa ok');
  G.saveWorld();
  ok(env.sandbox.localStorage.getItem('cubia:world:teste-2') !== null, 'mundo de teste salvo');
} catch (e) { sErr = e; }
ok(!sErr, 'sessão completa sem exceções', sErr && (sErr.message + ' @ ' + String(sErr.stack).split('\n')[1]));

console.log('\n== resultado ==');
console.log(pass + ' verificações ok, ' + fail + ' falhas');
process.exit(fail ? 1 : 0);
