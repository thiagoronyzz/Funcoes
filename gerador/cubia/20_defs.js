
/* ============================================== BLOCOS, ITENS, RECEITAS === */
const DEFS = [];
const ID = Object.create(null);
const TAGS = Object.create(null);
function def(d) { d.idx = DEFS.length; DEFS.push(d); ID[d.key] = d.idx; (d.tags || []).forEach((t) => { (TAGS[t] = TAGS[t] || []).push(d.idx); }); return d.idx; }
const T3 = (t) => (typeof t === 'string' ? { all: t } : t);
function tilesOf(d) { return d.tiles; }
function blk(key, label, tiles, o) {
  const t = T3(tiles);
  const top = ATLAS.T(t.top || t.all), side = ATLAS.T(t.side || t.all), bottom = ATLAS.T(t.bottom || t.bot || t.all),
    front = ATLAS.T(t.front || t.side || t.all);
  return def(Object.assign({
    key, kind: 'block', label, tiles: { top, side, bottom, front },
    hard: 1, tool: null, tier: 0, solid: true, opaque: true, shape: 'cube', light: 0, stack: 64,
    drop: [[key, 1]], res: 0.5, tags: ['block'],
  }, o || {}));
}
function it(key, label, tile, o) {
  return def(Object.assign({ key, kind: 'item', label, icon: ATLAS.T(tile), stack: 64, tags: ['item'] }, o || {}));
}
function toolItem(key, label, tile, kind, tier, speed, dur, dmg, tags) {
  return it(key, label, tile, { kind: 'item', tool: kind, tier, speed, dur, dmg, stack: 1, use: 'break', tags: ['tool'].concat(tags || []) });
}

const B = Object.create(null);
B.air = blk('air', 'Ar', 'stone', { solid: false, opaque: false, hard: 0, shape: 'none', drop: null, place: false, res: 0 });
B.stone = blk('stone', 'Pedra', 'stone', { hard: 1.5, tool: 'pick', tier: 1, drop: [['cobblestone', 1]], res: 6, tags: ['block', 'rock', 'mineable_pick'] });
B.granite = blk('granite', 'Granito', 'granite', { hard: 1.6, tool: 'pick', tier: 1, res: 6 });
B.diorite = blk('diorite', 'Diorito', 'diorite', { hard: 1.6, tool: 'pick', tier: 1, res: 6 });
B.andesite = blk('andesite', 'Andesito', 'andesite', { hard: 1.6, tool: 'pick', tier: 1, res: 6 });
B.deepslate = blk('deepslate', 'Xisto', 'deepslate', { hard: 3, tool: 'pick', tier: 1, res: 8 });
B.cobblestone = blk('cobblestone', 'Pedregulho', 'cobble', { hard: 2, tool: 'pick', tier: 1, res: 6 });
B.stonebricks = blk('stonebricks', 'Bricks de pedra', 'stonebricks', { hard: 1.5, tool: 'pick', tier: 1, res: 6 });
B.bricks = blk('bricks', 'Tijolos', 'bricks', { hard: 2, tool: 'pick', tier: 1, res: 6 });
B.dirt = blk('dirt', 'Terra', 'dirt', { hard: .5, tool: 'shovel', drop: [['dirt', 1]], res: .6, tags: ['block', 'diggable'] });
B.grass = blk('grass', 'Bloco de grama', { top: 'grass_top', side: 'grass_side', bottom: 'dirt' }, { hard: .6, tool: 'shovel', drop: [['dirt', 1]], res: .6, tags: ['block', 'diggable'] });
B.sand = blk('sand', 'Areia', 'sand', { hard: .5, tool: 'shovel', res: .5, tags: ['block', 'diggable'] });
B.sandstone = blk('sandstone', 'Arenito', 'sandstone', { hard: .8, tool: 'pick', tier: 1, res: .8 });
B.gravel = blk('gravel', 'Cascalho', 'gravel', { hard: .6, tool: 'shovel', res: .6 });
B.clay = blk('clay', 'Argila', 'clay', { hard: .6, tool: 'shovel', drop: [['clay_ball', 4]], res: .6 });
B.snowblock = blk('snowblock', 'Neve', 'snow', { hard: .2, tool: 'shovel', res: .1 });
B.ice = blk('ice', 'Gelo', 'ice', { hard: .5, tool: 'pick', solid: true, opaque: false, drop: null, res: .4, silk: true });
B.water = blk('water', 'Água', 'water', { solid: false, opaque: false, liquid: true, hard: 0, drop: null, place: false, res: 0 });
B.lava = blk('lava', 'Lava', 'lava', { solid: false, opaque: false, liquid: true, hard: 0, light: 15, drop: null, place: false, res: 0 });
B.bedrock = blk('bedrock', 'Rocha-mãe', 'bedrock', { hard: -1, drop: null, res: 18, place: false });
B.obsidian = blk('obsidian', 'Obsidiana', 'obsidian', { hard: 50, tool: 'pick', tier: 4, res: 12, tags: ['block', 'rock'] });
B.oaklog = blk('oaklog', 'Tronco de carvalho', { top: 'oak_log_top', side: 'oak_log', bottom: 'oak_log_top' }, { hard: 2, tool: 'axe', res: 3, tags: ['block', 'wood', 'log'] });
B.birchlog = blk('birchlog', 'Tronco de bétula', { top: 'birch_log_top', side: 'birch_log', bottom: 'birch_log_top' }, { hard: 2, tool: 'axe', res: 3, tags: ['block', 'wood', 'log'] });
B.sprucelog = blk('sprucelog', 'Tronco de pinheiro', { top: 'spruce_log_top', side: 'spruce_log', bottom: 'spruce_log_top' }, { hard: 2, tool: 'axe', res: 3, tags: ['block', 'wood', 'log'] });
B.oakleaves = blk('oakleaves', 'Folhas de carvalho', 'leaf_oak', { hard: .2, opaque: false, drop: null, dropFn: 'leaves', res: .3, tags: ['block', 'leaves'] });
B.birchleaves = blk('birchleaves', 'Folhas de bétula', 'leaf_birch', { hard: .2, opaque: false, drop: null, dropFn: 'leaves', res: .3, tags: ['block', 'leaves'] });
B.spruceleaves = blk('spruceleaves', 'Folhas de pinheiro', 'leaf_spruce', { hard: .2, opaque: false, drop: null, dropFn: 'leaves', res: .3, tags: ['block', 'leaves'] });
B.oakplanks = blk('oakplanks', 'Tábuas de carvalho', 'plank_oak', { hard: 2, tool: 'axe', res: 3, tags: ['block', 'wood', 'planks'] });
B.birchplanks = blk('birchplanks', 'Tábuas de bétula', 'plank_birch', { hard: 2, tool: 'axe', res: 3, tags: ['block', 'wood', 'planks'] });
B.spruceplanks = blk('spruceplanks', 'Tábuas de pinheiro', 'plank_spruce', { hard: 2, tool: 'axe', res: 3, tags: ['block', 'wood', 'planks'] });
B.crafttable = blk('crafttable', 'Bancada de trabalho', { top: 'craft_top', side: 'craft_side', bottom: 'plank_oak' }, { hard: 2.5, tool: 'axe', use: 'craft', res: 2.5, tags: ['block', 'wood', 'station'] });
B.furnace = blk('furnace', 'Fornalha', { top: 'furn_top', side: 'furn_side', bottom: 'furn_top', front: 'furn_front' }, { hard: 3.5, tool: 'pick', tier: 1, use: 'smelt', res: 3.5, tags: ['block', 'rock', 'station'] });
B.furnaceLit = blk('furnacelit', 'Fornalha acesa', { top: 'furn_top', side: 'furn_side', bottom: 'furn_top', front: 'furn_front_lit' }, { hard: 3.5, tool: 'pick', tier: 1, drop: [['furnace', 1]], light: 13, use: 'smelt', res: 3.5, place: false });
B.chest = blk('chest', 'Baú', { top: 'chest_top', side: 'chest_side', front: 'chest_front', bottom: 'chest_top' }, { hard: 2.5, tool: 'axe', use: 'chest', res: 2.5, tags: ['block', 'wood', 'container', 'station'] });
B.bookshelf = blk('bookshelf', 'Estante de livros', { top: 'plank_oak', side: 'bookshelf', bottom: 'plank_oak' }, { hard: 1.5, tool: 'axe', res: 1.5, tags: ['block', 'wood'] });
B.glass = blk('glass', 'Vidro', 'glass', { hard: .3, opaque: false, transparent: true, drop: null, silk: true, res: .3, tags: ['block'] });
B.torch = blk('torch', 'Tocha', 'torch', { hard: 0, solid: false, opaque: false, shape: 'cross', light: 14, res: 0, tags: ['block'] });
B.ladder = blk('ladder', 'Escada de mão', 'ladder', { hard: .4, tool: 'axe', solid: false, opaque: false, shape: 'pane', climb: true, res: .4, tags: ['block'] });
B.cactus = blk('cactus', 'Cacto', 'cactus', { hard: .4, opaque: false, hurt: 1, res: .4, tags: ['block'] });
B.tallgrass = blk('tallgrass', 'Erva alta', 'tallgrass', { hard: 0, solid: false, opaque: false, shape: 'cross', drop: [['plant', 1]], replaceable: true, res: 0, tags: ['block', 'plant'] });
B.rose = blk('rose', 'Rosa', 'rose', { hard: 0, solid: false, opaque: false, shape: 'cross', replaceable: true, res: 0, tags: ['block', 'plant'] });
B.dandelion = blk('dandelion', 'Dente-de-leão', 'dandelion', { hard: 0, solid: false, opaque: false, shape: 'cross', replaceable: true, res: 0, tags: ['block', 'plant'] });
B.woolwhite = blk('woolwhite', 'Lã branca', 'woolw', { hard: .8, res: .8, tags: ['block', 'wool'] });
B.woolred = blk('woolred', 'Lã vermelha', 'woolr', { hard: .8, res: .8, tags: ['block', 'wool'] });
B.woolblue = blk('woolblue', 'Lã azul', 'woolb', { hard: .8, res: .8, tags: ['block', 'wool'] });
B.woolyellow = blk('woolyellow', 'Lã amarela', 'wooly', { hard: .8, res: .8, tags: ['block', 'wool'] });
B.glowstone = blk('glowstone', 'Pedra luminosa', 'glowstone', { hard: .3, tool: 'pick', light: 15, res: .3, tags: ['block', 'rock'] });
B.bed = blk('bed', 'Cama', 'bed', { hard: .2, use: 'sleep', res: .2, tags: ['block'] });
B.enchant = blk('enchant', 'Mesa de encantamentos', { top: 'enchant_top', side: 'enchant_side', bottom: 'obsidian' }, { hard: 5, tool: 'pick', tier: 1, light: 7, use: 'enchant', res: 1200, tags: ['block', 'rock', 'station'] });
B.tnt = blk('tnt', 'Dinamite', 'tnt', { hard: 0, explodeOnBreak: true, res: 0, tags: ['block'] });
B.coalore = blk('coalore', 'Minério de carvão', 'coal_ore', { hard: 3, tool: 'pick', tier: 1, drop: [['coal', 1]], res: 5, xp: [0, 2], tags: ['block', 'rock', 'ore'] });
B.ironore = blk('ironore', 'Minério de ferro', 'iron_ore', { hard: 3, tool: 'pick', tier: 2, res: 5, xp: [0, 2], tags: ['block', 'rock', 'ore'] });
B.goldore = blk('goldore', 'Minério de ouro', { top: 'gold_ore', side: 'gold_ore', bottom: 'gold_ore' }, { hard: 3, tool: 'pick', tier: 3, res: 6, xp: [0, 2], tags: ['block', 'rock', 'ore'] });
B.diamondore = blk('diamondore', 'Minério de diamante', 'diamond_ore', { hard: 3, tool: 'pick', tier: 3, drop: [['diamond', 1]], res: 3, xp: [3, 7], tags: ['block', 'rock', 'ore'] });
B.redstoneore = blk('redstoneore', 'Minério de redstone', 'redstone_ore', { hard: 3, tool: 'pick', tier: 3, drop: [['redstone', 4]], res: 5, xp: [1, 5], tags: ['block', 'rock', 'ore'] });
B.lapisore = blk('lapisore', 'Minério de lápis-lazúli', 'lapis_ore', { hard: 3, tool: 'pick', tier: 2, drop: [['lapis', 6]], res: 3, tags: ['block', 'rock', 'ore'] });
B.emeraldore = blk('emeraldore', 'Minério de esmeralda', 'emerald_ore', { hard: 3, tool: 'pick', tier: 2, drop: [['emerald', 1]], res: 3, xp: [3, 7], tags: ['block', 'rock', 'ore'] });

const I = Object.create(null);
const IT_FIRST = DEFS.length;
I.plant = it('plant', 'Erva', 'tallgrass', { tags: ['item', 'fiber'] });
I.clay_ball = it('clay_ball', 'Bola de argila', 'clay_ball');
I.brick = it('brick', 'Tijolo (cozido)', 'brick_item');
I.stick = it('stick', 'Graveto', 'stick', { tags: ['item', 'craft'] });
I.coal = it('coal', 'Carvão', 'coal', { fuel: 8, tags: ['item', 'fuel'] });
I.charcoal = it('charcoal', 'Carvão vegetal', 'charcoal', { fuel: 8, tags: ['item', 'fuel'] });
I.iron = it('iron', 'Lingote de ferro', 'ingot_iron', { tags: ['item', 'metal'] });
I.gold = it('gold', 'Lingote de ouro', 'ingot_gold', { tags: ['item', 'metal'] });
I.diamond = it('diamond', 'Diamante', 'gem_diamond', { tags: ['item', 'gem'] });
I.emerald = it('emerald', 'Esmeralda', 'gem_emerald', { tags: ['item', 'gem'] });
I.redstone = it('redstone', 'Pó de redstone', 'redstone');
I.lapis = it('lapis', 'Lápis-lazúli', 'lapis');
I.leather = it('leather', 'Couro', 'leather', { tags: ['item'] });
I.feather = it('feather', 'Pena', 'feather');
I.egg = it('egg', 'Ovo', 'egg', { food: 1, heal: 0 });
I.bone = it('bone', 'Osso', 'bone');
I.string = it('string', 'Corda de aranha', 'string');
I.gunpowder = it('gunpowder', 'Pólvora', 'gunpowder');
I.pearl = it('pearl', 'Pérola do end', 'pearl');
I.rotten = it('rotten', 'Carne podre', 'rotten', { food: 4, heal: -1, poison: true });
I.apple = it('apple', 'Maçã', 'apple', { food: 4, tags: ['item', 'food'] });
I.bread = it('bread', 'Pão de ervas', 'bread', { food: 5, tags: ['item', 'food'] });
I.beef = it('beef', 'Carne crua', 'meat_raw', { food: 3, tags: ['item', 'food', 'raw'] });
I.cookbeef = it('cookbeef', 'Bife', 'meat_cook', { food: 8, tags: ['item', 'food'] });
I.pork = it('pork', 'Costela crua', 'pork_raw', { food: 3, tags: ['item', 'food', 'raw'] });
I.cookpork = it('cookpork', 'Costela assada', 'pork_cook', { food: 8, tags: ['item', 'food'] });
I.chickenm = it('chickenm', 'Frango cru', 'chick_raw', { food: 2, poison: true, tags: ['item', 'food', 'raw'] });
I.cookchicken = it('cookchicken', 'Frango assado', 'chick_cook', { food: 6, tags: ['item', 'food'] });
I.goldapple = it('goldapple', 'Maçã dourada', 'golden_apple', { food: 10, heal: 8, regen: 12, tags: ['item', 'food'] });
I.paper = it('paper', 'Papel', 'paper');
I.flint = it('flint', 'Pederneira', 'flint');
I.book = it('book', 'Livro', 'book');
I.bow = it('bow', 'Arco', 'bow', { stack: 1, use: 'bow', dur: 165, dmg: 0, tags: ['item', 'weapon'] });
I.arrow = it('arrow', 'Flecha', 'arrow', { tags: ['item', 'ammo'] });
for (const mk of Object.keys(MAT)) {
  if (!['wood', 'stone', 'iron', 'gold', 'diamond'].includes(mk)) continue;
  const tname = ['madeira', 'pedra', 'ferro', 'ouro', 'diamante'][['wood', 'stone', 'iron', 'gold', 'diamond'].indexOf(mk)];
  const tier = [1, 2, 3, 3, 4][['wood', 'stone', 'iron', 'gold', 'diamond'].indexOf(mk)];
  const speed = [2, 4, 6, 12, 8][['wood', 'stone', 'iron', 'gold', 'diamond'].indexOf(mk)];
  const dur = [60, 132, 251, 33, 1562][['wood', 'stone', 'iron', 'gold', 'diamond'].indexOf(mk)];
  const base = [0, 1, 2, 2, 3][['wood', 'stone', 'iron', 'gold', 'diamond'].indexOf(mk)];
  toolItem(mk + 'pick', 'Picareta de ' + tname, mk + '_pick', 'pick', tier, speed, dur, base + 2, ['weapon']);
  toolItem(mk + 'axe', 'Machado de ' + tname, mk + '_axe', 'axe', tier, speed, dur, base + 3, ['weapon']);
  toolItem(mk + 'shovel', 'Pá de ' + tname, mk + '_shovel', 'shovel', tier, speed, dur, base + 1, []);
  toolItem(mk + 'sword', 'Espada de ' + tname, mk + '_sword', 'sword', tier, speed * .7 + 1, dur, base + 4, ['weapon']);
}
for (const mk of ['leather', 'iron', 'diamond']) {
  const tname = { leather: 'couro', iron: 'ferro', diamond: 'diamante' }[mk];
  const def_ = { leather: [1, 3, 2, 1], iron: [2, 6, 5, 2], diamond: [3, 8, 6, 3] }[mk];
  const dur = { leather: 56, iron: 165, diamond: 363 }[mk];
  ['helm', 'chest', 'legs', 'boots'].forEach((k, i) => it(mk + '_' + k, { helm: 'Elmo', chest: 'Peitoral', legs: 'Calça', boots: 'Botas' }[k] + ' de ' + tname, mk + '_' + k,
    { stack: 1, armor: i, defense: def_[i], dur, tags: ['armor'] }));
}
DEFS.slice(1).forEach((d) => { if (d.kind === 'block' && d.place !== false) { d.item = def({ key: 'i_' + d.key, kind: 'blockitem', label: d.label, block: d.idx, icon: d.tiles.top, stack: 64, place: true, tags: ['item', 'blockitem'] }); } });
const BYBLOCK = Object.create(null);
DEFS.forEach((d) => { if (d.kind === 'block') BYBLOCK[d.idx] = d.item === undefined ? d.idx : d.item; });
const ITEM_OF_BLOCK = (bid) => (DEFS[bid] ? DEFS[bid].item : undefined);
const BLOCK_OF_ITEM = (iid) => (DEFS[iid] && DEFS[iid].kind === 'blockitem' ? DEFS[iid].block : (DEFS[iid] && DEFS[iid].kind === 'block' ? iid : undefined));
const defOf = (id) => DEFS[id] || DEFS[0];
const labelOf = (id) => (DEFS[id] ? DEFS[id].label : '?');

/* receitas: padrão com chaves; '@tag' casa qualquer membro da tag; '.' vazio */
const RECIPES = [];
function shaped(out, n, pattern, key, opt) {
  const rows = pattern.map((r) => r.split(''));
  const map = {};
  for (const k in key) map[k] = key[k];
  RECIPES.push(Object.assign({ out: [out, n], rows, map, size: [Math.max.apply(null, rows.map((r) => r.length)), rows.length], mirror: true }, opt || {}));
}
function shapeless(out, n, list) { RECIPES.push({ out: [out, n], shapeless: list }); }
const PL = '@planks';
const LOG_TO_PLANK = { oaklog: 'i_oakplanks', birchlog: 'i_birchplanks', sprucelog: 'i_spruceplanks' };
RECIPES.push({
  out: ['oakplanks', 4], preview: 'oakplanks', shapeless: [['@log', 1]],
  dynamic: (cells) => {
    for (const c of cells) {
      const d = DEFS[c];
      if (!d) continue;
      const bk = d.kind === 'blockitem' ? DEFS[d.block] : d;
      if (!bk || !bk.tags || !bk.tags.includes('log')) continue;
      const out = LOG_TO_PLANK[bk.key];
      if (out) return [out, 4];
    }
    return null;
  },
});
shaped('crafttable', 1, ['PP', 'PP'], { P: PL });
shaped('chest', 1, ['PPP', 'P.P', 'PPP'], { P: PL });
shaped('furnace', 1, ['CCC', 'C.C', 'CCC'], { C: 'cobblestone' });
shaped('bricks', 1, ['BB', 'BB'], { B: 'brick' });
shaped('stonebricks', 4, ['CC', 'CC'], { C: 'stone' });
shaped('stick', 4, ['W', 'W'], { W: PL });
shaped('torch', 4, ['C', 'S'], { C: ['coal', 'charcoal'], S: 'stick' });
shaped('ladder', 3, ['S.S', 'SSS', 'S.S'], { S: 'stick' });
shaped('bookshelf', 1, ['PPP', 'BBB', 'PPP'], { P: PL, B: 'book' });
shapeless('paper', 3, [['plant', 3]]);
shapeless('book', 1, [['paper', 3], ['leather', 1]]);
shapeless('bread', 3, [['plant', 2]]);
shaped('woolwhite', 1, ['SS', 'SS'], { S: 'string' });
shaped('tnt', 1, ['GSG', 'SGS', 'GSG'], { G: 'gunpowder', S: 'sand' });
shaped('glowstone', 1, ['GGG', 'GRG', 'GGG'], { G: 'glass', R: 'redstone' });
shaped('enchant', 1, ['OOO', 'ODO', 'OBO'], { O: 'obsidian', D: 'diamond', B: 'book' });
shaped('bed', 1, ['WWW', 'PPP'], { W: '@wool', P: PL });
for (const [m, tname] of [['wood', 'wood'], ['stone', 'stone'], ['iron', 'iron'], ['gold', 'gold'], ['diamond', 'diamond']]) {
  const mat = m === 'wood' ? PL : m === 'stone' ? 'cobblestone' : m === 'iron' ? 'iron' : m === 'gold' ? 'gold' : 'diamond';
  shaped(m + 'pick', 1, ['MMM', '.S.', '.S.'], { M: mat, S: 'stick' });
  shaped(m + 'axe', 1, ['MM', 'MS', '.S'], { M: mat, S: 'stick' });
  shaped(m + 'shovel', 1, ['M', 'S', 'S'], { M: mat, S: 'stick' });
  shaped(m + 'sword', 1, ['M', 'M', 'S'], { M: mat, S: 'stick' });
}
shaped('leather_helm', 1, ['LLL', 'L.L'], { L: 'leather' });
shaped('leather_chest', 1, ['L.L', 'LLL', 'LLL'], { L: 'leather' });
shaped('leather_legs', 1, ['LLL', 'L.L', 'L.L'], { L: 'leather' });
shaped('leather_boots', 1, ['L.L', 'L.L'], { L: 'leather' });
for (const [m, mat] of [['iron', 'iron'], ['diamond', 'diamond']]) {
  shaped(m + '_helm', 1, ['MMM', 'M.M'], { M: mat });
  shaped(m + '_chest', 1, ['M.M', 'MMM', 'M.M'], { M: mat });
  shaped(m + '_legs', 1, ['MMM', 'M.M', 'M.M'], { M: mat });
  shaped(m + '_boots', 1, ['M.M', 'M.M'], { M: mat });
}
shaped('bow', 1, ['#X', '#X', '#X'], { '#': 'stick', X: 'string' });
shaped('arrow', 4, ['F', 'S', 'X'], { F: ['flint', 'bone'], S: 'stick', X: 'string' });
shaped('goldapple', 1, ['GGG', 'GAG', 'GGG'], { G: 'gold', A: 'apple' });
shaped('flint', 1, ['GG', 'GG'], { G: 'gravel' });

/* fornalha */
const SMELT = Object.create(null);
function smelt(inp, out, n, xp) { SMELT[inp] = { out: [out, n], xp: xp || 0 }; }
smelt('ironore', 'iron', 1, 2); smelt('goldore', 'gold', 1, 2);
smelt('sand', 'glass', 1, 0); smelt('clay_ball', 'brick', 1, 0);
smelt('oaklog', 'charcoal', 1, 1); smelt('birchlog', 'charcoal', 1, 1); smelt('sprucelog', 'charcoal', 1, 1);
smelt('cobblestone', 'stone', 1, 0); smelt('beef', 'cookbeef', 1, 0); smelt('pork', 'cookpork', 1, 0);
smelt('chickenm', 'cookchicken', 1, 0); 
const FUELS = Object.create(null);
[['coal', 8], ['charcoal', 8], ['oaklog', 15], ['birchlog', 15], ['sprucelog', 15], ['oakplanks', 7.5], ['birchplanks', 7.5], ['spruceplanks', 7.5], ['crafttable', 7.5], ['bookshelf', 7.5], ['stick', 2.5], ['ladder', 6], ['tnt', 12]].forEach(([k, t]) => { FUELS[k] = t; });

/* encantamentos */
const ENCH = {
  efficiency: { label: 'Eficiência', max: 5, on: ['tool'], desc: (l) => '+' + (l * 30) + '% na velocidade de mineração' },
  unbreaking: { label: 'Irrequebrável', max: 3, on: ['tool', 'armor', 'bow'], desc: (l) => Math.round(l * 20) + '% de chance de não gastar durabilidade' },
  fortune: { label: 'Fortuna', max: 3, on: ['pick'], desc: (l) => 'até ' + (l + 1) + '× drops em minérios' },
  silk: { label: 'Toque de seda', max: 1, on: ['pick', 'shovel'], desc: () => 'coleta o bloco inteiro (vidro, gelo)' },
  sharpness: { label: 'Fúria', max: 5, on: ['sword', 'axe'], desc: (l) => '+' + fmt(.5 * l + .5, 1) + ' de dano' },
  protection: { label: 'Proteção', max: 4, on: ['armor'], desc: (l) => '-' + (l * 4) + '% do dano recebido' },
  feather: { label: 'Queda suave', max: 4, on: ['boots'], desc: (l) => 'reduz dano de queda' },
  power: { label: 'Potência', max: 5, on: ['bow'], desc: (l) => '+' + (l * 25) + '% de dano do arco' },
};
const ENCH_POOL = {
  tool: ['efficiency', 'unbreaking', 'silk'], pick: ['efficiency', 'unbreaking', 'fortune', 'silk'],
  axe: ['efficiency', 'unbreaking', 'sharpness'], shovel: ['efficiency', 'unbreaking', 'silk'],
  sword: ['sharpness', 'unbreaking'], armor: ['protection', 'unbreaking'], boots: ['protection', 'feather', 'unbreaking'],
  bow: ['power', 'unbreaking'],
};
