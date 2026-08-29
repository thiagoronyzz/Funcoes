
/* ================================================== MUNDO, LUZ E MESHING === */
const CH = 16, CH2 = CH * CH, WH = 96, SEA = 34;
const bidx = (x, y, z) => ((y * CH) + z) * CH + x;
const ckey = (cx, cz) => cx * 1000003 + cz;
const BIOME = { OCEAN: 0, BEACH: 1, PLAINS: 2, FOREST: 3, DESERT: 4, SNOW: 5, MOUNTAIN: 6 };
const BNAME = ['Oceano', 'Praia', 'Planície', 'Floresta', 'Deserto', 'Tundra nevada', 'Montanha gelada'];

const world = {
  seed: 1, noise: makeNoise(1), chunks: new Map(), edits: new Map(), chests: new Map(),
  furnaceData: new Map(), heightAt: new Map(),
  chunk(cx, cz, make) {
    const k = ckey(cx, cz);
    let c = world.chunks.get(k);
    if (!c && make !== false) { c = { cx, cz, blocks: new Uint16Array(CH2 * WH), sky: new Uint8Array(CH2 * WH), blk: new Uint8Array(CH2 * WH), hmap: new Uint8Array(CH2), biome: new Uint8Array(CH2), gen: false, mesh: null, wmesh: null, dirty: true, lightDirty: true }; world.chunks.set(k, c); genChunk(c); }
    return c || null;
  },
  /* leitura fria: nunca dispara geração (isso recursaria entre chunks vizinhos) */
  block(x, y, z) {
    if (y < 0) return B.bedrock;
    if (y >= WH) return 0;
    const c = world.chunks.get(ckey(x >> 4, z >> 4));
    return c ? c.blocks[bidx(x & 15, y, z & 15)] : 0;
  },
  isSolid(x, y, z) { const d = DEFS[world.block(x, y, z)]; return !!(d && d.solid); },
  isOpaque(x, y, z) { const d = DEFS[world.block(x, y, z)]; return !!(d && d.opaque); },
  skyAt(x, y, z) { if (y >= WH) return 15; if (y < 0) return 0; const c = world.chunk(x >> 4, z >> 4, false); return c ? c.sky[bidx(x & 15, y, z & 15)] : 15; },
  blkAt(x, y, z) { if (y < 0 || y >= WH) return 0; const c = world.chunk(x >> 4, z >> 4, false); return c ? c.blk[bidx(x & 15, y, z & 15)] : 0; },
  set(x, y, z, id, record) {
    if (y < 0 || y >= WH) return false;
    const cx = x >> 4, cz = z >> 4, c = world.chunk(cx, cz);
    if (!c) return false;
    const i = bidx(x & 15, y, z & 15);
    if (c.blocks[i] === id) return false;
    c.blocks[i] = id;
    const k = ckey(cx, cz);
    let m = world.edits.get(k); if (!m) { m = new Map(); world.edits.set(k, m); }
    m.set(i, id);
    c.dirty = true; c.lightDirty = true;
    if ((x & 15) === 0) { const n = world.chunk(cx - 1, cz); if (n) n.dirty = true; }
    if ((x & 15) === 15) { const n = world.chunk(cx + 1, cz); if (n) n.dirty = true; }
    if ((z & 15) === 0) { const n = world.chunk(cx, cz - 1); if (n) n.dirty = true; }
    if ((z & 15) === 15) { const n = world.chunk(cx, cz + 1); if (n) n.dirty = true; }
    return true;
  },
  surfaceY(x, z) {
    for (let y = WH - 1; y >= 0; y--) { const d = DEFS[world.block(x, y, z)]; if (d && d.solid) return y + 1; }
    return SEA + 1;
  },
  lightOf(x, y, z) { return Math.max(world.skyAt(x, y, z) / 15 * Game.skyMul, world.blkAt(x, y, z) / 15); },
};

/* --------------------------------------------------------------- geração */
const PAD = 2;
const PS = CH + PAD * 2;
const PY = WH + 2;
let padB = new Uint16Array(PS * PS * PY);
let padS = new Uint8Array(PS * PS * PY), padK = new Uint8Array(PS * PS * PY);
const LQ = new Int32Array(PS * PS * PY * 3), LQMAX = PS * PS * PY * 3 - 12;
const DX = [1, -1, 0, 0, 0, 0], DY = [0, 0, 1, -1, 0, 0], DZ = [0, 0, 0, 0, 1, -1];
/* Tabelas de propriedade, montadas uma vez: os laços de luz e de malha só
   olham para aqui em vez de procurarem no DEFS a cada bloco. */
const OPAQUE_LUT = new Uint8Array(1024), LIGHT_LUT = new Uint8Array(1024), LIQUID_LUT = new Uint8Array(1024);
const TILE3 = new Uint16Array(1024 * 3), TILEUV = new Float32Array(ATLAS_COLS * ATLAS_COLS * 4);
let LUT_OK = false;
function buildLUTs() {
  if (LUT_OK) return;
  LUT_OK = true;
  OPAQUE_LUT.fill(1);
  for (let i = 0; i < DEFS.length; i++) {
    const d = DEFS[i];
    if (!d) continue;
    OPAQUE_LUT[i] = d.opaque ? 1 : 0;
    LIGHT_LUT[i] = d.light ? d.light : 0;
    LIQUID_LUT[i] = d.liquid ? 1 : 0;
    const tl = d.tiles || {};
    const side = tl.side === undefined ? 0 : tl.side;
    TILE3[i * 3] = tl.top === undefined ? side : tl.top;
    TILE3[i * 3 + 1] = side;
    TILE3[i * 3 + 2] = tl.bottom === undefined ? side : tl.bottom;
  }
  for (let t = 0; t < ATLAS_COLS * ATLAS_COLS; t++) {
    const q = tileUV(t);
    TILEUV[t * 4] = q[0]; TILEUV[t * 4 + 1] = q[1]; TILEUV[t * 4 + 2] = q[2]; TILEUV[t * 4 + 3] = q[3];
  }
}
/* Índice do buffer palmilhado em coordenadas locais do chunk (podem ser
   negativas). A coluna fica contígua em y, que é o acesso mais frequente. */
const q3 = (x, y, z) => ((x + PAD) * PS + (z + PAD)) * PY + y + 1;
/* centro + 8 vizinhos, resolvidos uma vez por chunk */
function ringOf(ch) {
  const g = (dx, dz) => { const c = dx === 0 && dz === 0 ? ch : world.chunks.get(ckey(ch.cx + dx, ch.cz + dz)); return c && c.blocks ? c : null; };
  return [g(-1, -1), g(0, -1), g(1, -1), g(-1, 0), ch, g(1, 0), g(-1, 1), g(0, 1), g(1, 1)];
}
/* cópia dos blocos vizinhos para a palma: sem Map nem função por bloco */
function padBlocks(ch, r) {
  for (let z = -PAD; z < CH + PAD; z++) for (let x = -PAD; x < CH + PAD; x++) {
    const src = r[(z >> 4) + 1 + ((x >> 4) + 1) * 3];
    if (!src) { for (let y = 0, p = q3(x, 0, z); y < WH; y++, p++) padB[p] = 0; continue; }
    const bl = src.blocks, base = (z & 15) * CH + (x & 15);
    for (let y = 0, i = base, p = q3(x, 0, z); y < WH; y++, i += CH2, p++) padB[p] = bl[i];
  }
}

function columnInfo(wx, wz) {
  const nz = world.noise;
  const cont = nz.fbm2(wx * 0.0019, wz * 0.0019, 4, 2, .5);
  const ero = nz.fbm2(wx * 0.0052 + 91.3, wz * 0.0052 - 44.7, 3, 2, .5);
  const pk = nz.n2(wx * 0.013 - 17.1, wz * 0.013 + 63.5);
  const temp = nz.fbm2(wx * 0.0021 + 311.7, wz * 0.0021 + 57.1, 2, 2, .5);
  const hum = nz.fbm2(wx * 0.0034 - 77.3, wz * 0.0034 + 123.9, 3, 2, .5);
  const land = smooth(-.26, .02, cont);
  const mtn = smooth(.08, .62, ero * .5 + .5) * smooth(-.05, .5, cont);
  let h = SEA + 1 + land * (3 + mtn * 40 + (pk * .5 + .5) * 6 * land) - (1 - land) * (7 + (cont + 1) * 5);
  h = Math.round(clamp(h, 5, WH - 14));
  let biome;
  if (h < SEA - 1) biome = BIOME.OCEAN;
  else if (h <= SEA + 1) biome = BIOME.BEACH;
  else if (temp < -.34 || h > SEA + 34) biome = h > SEA + 44 ? BIOME.MOUNTAIN : BIOME.SNOW;
  else if (temp > .3 && hum < .02) biome = BIOME.DESERT;
  else if (hum > .1) biome = BIOME.FOREST;
  else biome = BIOME.PLAINS;
  return { h, biome, temp, hum };
}

let CUT = null;
const FV = new Float64Array(64), WV = new Float64Array(64);

const CIM = CH + 8;
const CI_CACHE = new Array(CIM * CIM).fill(null);

function genChunk(ch) {
  const s = world.seed;
  const x0 = ch.cx * CH, z0 = ch.cz * CH;
  const cache = CI_CACHE;
  for (let i = 0; i < cache.length; i++) cache[i] = null;
  /* uma coluna só é lida do ruído uma vez por chunk (a varredura de árvores
     relê as mesmas bordas) */
  const ciOf = (wx, wz) => {
    const k = (wz - z0 + 4) * CIM + (wx - x0 + 4);
    if (k < 0 || k >= cache.length || (wx - x0 + 4 < 0) || (wx - x0 + 4 >= CIM) || (wz - z0 + 4 < 0) || (wz - z0 + 4 >= CIM)) return columnInfo(wx, wz);
    let v = cache[k];
    if (!v) cache[k] = v = columnInfo(wx, wz);
    return v;
  };
  for (let lz = 0; lz < CH; lz++) for (let lx = 0; lx < CH; lx++) {
    const wx = x0 + lx, wz = z0 + lz, ci = ciOf(wx, wz);
    const h = ci.h, bi = ci.biome;
    ch.hmap[lz * CH + lx] = Math.min(255, h);
    ch.biome[lz * CH + lx] = bi;
    const sub = bi === BIOME.DESERT || bi === BIOME.BEACH || bi === BIOME.OCEAN ? B.sand : B.dirt;
    const top = bi === BIOME.DESERT || bi === BIOME.BEACH ? B.sand : bi === BIOME.OCEAN ? (h >= SEA - 2 ? B.sand : B.gravel)
      : (bi === BIOME.SNOW || bi === BIOME.MOUNTAIN) ? B.snowblock : (h > SEA ? B.grass : B.dirt);
    for (let y = 0; y <= h; y++) {
      let id;
      if (y === 0) id = B.bedrock;
      else if (y <= 1 && hash3(wx, y, wz, s) < .55) id = B.bedrock;
      else if (y === h) id = top;
      else if (y > h - 4) id = sub;
      else {
        id = B.stone;
        const r = hash3(wx >> 2, y >> 2, wz >> 2, s + 71);
        if (r < .06) id = B.granite; else if (r < .12) id = B.diorite; else if (r < .18) id = B.andesite;
        if (y < 26) id = hash3(wx, y, wz, s + 33) < .7 ? B.deepslate : id;
      }
      ch.blocks[bidx(lx, y, lz)] = id;
    }
    for (let y = h + 1; y <= SEA; y++) ch.blocks[bidx(lx, y, lz)] = bi === BIOME.OCEAN && ci.temp < -.3 && y === SEA ? B.ice : B.water;
  }
  /* cavernas + minérios + lava profunda. O campo que abre os vãos é avaliado
     a cada 2 blocos em y e interpolado — o mesmo desenho de túnel com metade
     do ruído, que é o que pesa na geração. */
  const nz = world.noise, CTOP = WH - 14;
  if (!CUT) { CUT = new Uint8Array(Math.max(DEFS.length + 8, 64)); for (const id of [B.stone, B.dirt, B.granite, B.diorite, B.andesite, B.deepslate, B.sand]) CUT[id] = 1; }
  for (let lz = 0; lz < CH; lz++) for (let lx = 0; lx < CH; lx++) {
    const wx = x0 + lx, wz = z0 + lz, hs = ch.hmap[lz * CH + lx];
    const lim = Math.min(CTOP, hs);
    const ax = wx * .021, az = wz * .021, bx = wx * .011 + 40, bz = wz * .011 - 20;
    for (let k = 0, y = 2; y <= lim + 2; k++, y += 2) { FV[k] = nz.fbm3(ax, y * .036, az, 2); WV[k] = nz.n3(bx, y * .02, bz); }
    for (let y = 2; y < lim; y++) {
      const i = bidx(lx, y, lz), cur = ch.blocks[i];
      if (!CUT[cur]) continue;
      const k = (y - 2) >> 1, odd = (y & 1) === 1;
      if (y < hs - 1) {
        const c = odd ? (FV[k] + FV[k + 1]) * .5 : FV[k];
        const wide = odd ? (WV[k] + WV[k + 1]) * .5 : WV[k];
        if (c > .30 || (Math.abs(wide) < .055 && y < hs - 4)) {
          ch.blocks[i] = y <= 6 && hash3(wx, y, wz, s + 9) < .5 ? B.lava : 0;
          continue;
        }
      }
      if (cur === B.stone || cur === B.deepslate) {
        const r = hash3(wx, y, wz, s);
        let ore = 0;
        if (r < .0135 && y < 66) ore = B.coalore;
        else if (r > .02 && r < .0315 && y < 52) ore = B.ironore;
        else if (r > .04 && r < .0452 && y < 30) ore = B.goldore;
        else if (r > .05 && r < .0532 && y < 16) ore = B.diamondore;
        else if (r > .06 && r < .0692 && y < 18) ore = B.redstoneore;
        else if (r > .08 && r < .0872 && y < 30) ore = B.lapisore;
        else if (r > .1 && r < .1016 && y < 54 && hs > SEA + 22) ore = B.emeraldore;
        if (ore) {
          ch.blocks[i] = ore;
          for (let a = 0; a < 3; a++) {
            const dx = ((hash3(wx, y, wz, s + 400 + a) * 3) | 0) - 1, dz = ((hash3(wx, y, wz, s + 500 + a) * 3) | 0) - 1, dy = ((hash3(wx, y, wz, s + 600 + a) * 3) | 0) - 1;
            const nx = lx + dx, nz2 = lz + dz, ny = y + dy;
            if (nx < 0 || nz2 < 0 || nx > 15 || nz2 > 15 || ny < 1 || ny >= WH) continue;
            const j = bidx(nx, ny, nz2);
            if (ch.blocks[j] === B.stone) ch.blocks[j] = ore;
          }
        }
      }
    }
  }
  /* árvores e decoração (varre com margem para cruzar chunks) */
  const put = (wx, wy, wz, id, force) => {
    const lx = wx - x0, lz = wz - z0;
    if (lx < 0 || lz < 0 || lx >= CH || lz >= CH || wy < 0 || wy >= WH) return;
    const i = bidx(lx, wy, lz);
    if (!force && ch.blocks[i] !== 0 && ch.blocks[i] !== B.tallgrass && ch.blocks[i] !== B.rose && ch.blocks[i] !== B.dandelion) return;
    ch.blocks[i] = id;
    if (wy > ch.hmap[lz * CH + lx]) ch.hmap[lz * CH + lx] = Math.min(255, wy);
  };
  for (let dz = -3; dz < CH + 3; dz++) for (let dx = -3; dx < CH + 3; dx++) {
    const wx = x0 + dx, wz = z0 + dz, ci = ciOf(wx, wz), gy = ci.h;
    if (gy < SEA) continue;
    const r = hash3(wx, 0, wz, s + 1234);
    const p = ci.biome === BIOME.FOREST ? .055 : ci.biome === BIOME.PLAINS ? .011 : ci.biome === BIOME.SNOW ? .03 : ci.biome === BIOME.MOUNTAIN ? .008 : .004;
    if (ci.biome === BIOME.DESERT) {
      if (r < .012) { const hh = 1 + ((hash3(wx, 1, wz, s) * 3) | 0); for (let y = 1; y <= hh; y++) put(wx, gy + y, wz, B.cactus, true); }
      continue;
    }
    if (r >= p) {
      /* sem mato por cima de tudo: só flores esparsas, e só em campo aberto */
      if (dx >= 0 && dz >= 0 && dx < CH && dz < CH && r > .9955 && (ci.biome === BIOME.PLAINS || ci.biome === BIOME.FOREST)) {
        const t = hash3(wx, 7, wz, s + 5);
        if (ch.blocks[bidx(dx, gy + 1, dz)] === 0 || DEFS[ch.blocks[bidx(dx, gy + 1, dz)]].replaceable) put(wx, gy + 1, wz, t < .5 ? B.rose : B.dandelion, false);
      }
      continue;
    }
    /* árvore: checa espaçamento local */
    let near = false;
    for (let a = -2; a <= 2 && !near; a++) for (let b = -2; b <= 2 && !near; b++) {
      if (a === 0 && b === 0) continue;
      if (hash3(wx + a, 0, wz + b, s + 1234) < (ci.biome === BIOME.FOREST ? .055 : .011)) near = true;
    }
    if (near) continue;
    const kind = ci.biome === BIOME.SNOW || ci.biome === BIOME.MOUNTAIN ? 2 : ci.biome === BIOME.FOREST && hash3(wx, 3, wz, s) < .28 ? 1 : 0;
    const logId = [B.oaklog, B.birchlog, B.sprucelog][kind], leafId = [B.oakleaves, B.birchleaves, B.spruceleaves][kind];
    const th = 4 + ((hash3(wx, 5, wz, s + 2) * (kind === 2 ? 4 : 2.4)) | 0);
    for (let y = 1; y <= th; y++) put(wx, gy + y, wz, logId, true);
    if (kind === 2) {
      for (let ly = 0; ly < 5; ly++) {
        const rr = ly === 0 ? 2 : ly === 1 ? 2 : ly === 2 ? 1 : ly === 3 ? 1 : 0;
        for (let a = -rr; a <= rr; a++) for (let b = -rr; b <= rr; b++) {
          if (Math.abs(a) === rr && Math.abs(b) === rr && rr > 1) continue;
          put(wx + a, gy + th - 1 + ly, wz + b, leafId, false);
        }
      }
      put(wx, gy + th + 4, wz, leafId, false);
    } else {
      for (let ly = -2; ly <= 1; ly++) {
        const rr = ly <= -1 ? 2 : 1;
        for (let a = -rr; a <= rr; a++) for (let b = -rr; b <= rr; b++) {
          if (Math.abs(a) === rr && Math.abs(b) === rr && (ly === 1 || hash3(wx + a, ly, wz + b, s) < .4)) continue;
          put(wx + a, gy + th + ly, wz + b, leafId, false);
        }
      }
      put(wx, gy + th + 2, wz, leafId, false);
    }
  }
  /* obsidiana onde a lava encosta na rocha funda */
  for (let y = 2; y <= 8; y++) for (let lz = 0; lz < CH; lz++) for (let lx = 0; lx < CH; lx++) {
    if (ch.blocks[bidx(lx, y, lz)] !== B.lava) continue;
    for (const [dx, dy, dz] of [[0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]) {
      const nx = lx + dx, ny = y + dy, nz = lz + dz;
      if (nx < 0 || nz < 0 || nx > 15 || nz > 15 || ny < 1) continue;
      const j = bidx(nx, ny, nz), cur = ch.blocks[j];
      if ((cur === B.stone || cur === B.deepslate) && hash3(x0 + nx, ny, z0 + nz, s + 777) < .34) ch.blocks[j] = B.obsidian;
    }
  }
  ch.gen = true;
  relight(ch);
  ch.dirty = true;
}

/* ------------------------------------------------------------------ luz */
/* Luz do céu por coluna + propagação em largura para luz bloqueada e emitida.
   Os laços só tocam buffers locais — é isso que deixa o mundo carregar rápido. */
function relight(ch) {
  buildLUTs();
  const r = ringOf(ch);
  padBlocks(ch, r);
  for (let z = -PAD; z < CH + PAD; z++) for (let x = -PAD; x < CH + PAD; x++) {
    let open = true;
    for (let y = WH - 1, p = q3(x, y, z); y >= 0; y--, p--) {
      const b = padB[p];
      if (OPAQUE_LUT[b]) { padS[p] = 0; padK[p] = 0; open = false; continue; }
      const above = y === WH - 1 ? 15 : padS[p + 1];
      padS[p] = open ? 15 : (above > 3 ? above - 3 : 0);
      padK[p] = LIGHT_LUT[b];
    }
  }
  /* o anel externo herda a luz que os vizinhos já calcularam — sem isto a
     luz de uma tocha pararia na divisa dos chunks */
  const W = r[3], E = r[5], N = r[1], S = r[7];
  const inherit = (src, mine, theirs) => {
    if (!src) return;
    for (let k = 0; k < CH; k++) for (let y = 0; y < WH; y++) {
      const si = theirs(y, k), di = mine(y, k);
      if (src.sky[si] > padS[di]) padS[di] = src.sky[si];
      if (src.blk[si] > padK[di]) padK[di] = src.blk[si];
    }
  };
  inherit(W, (y, z) => q3(-1, y, z), (y, z) => (z * CH + CH - 1) + y * CH2);
  inherit(E, (y, z) => q3(CH, y, z), (y, z) => (z * CH) + y * CH2);
  inherit(N, (y, x) => q3(x, y, -1), (y, x) => (CH - 1) * CH + x + y * CH2);
  inherit(S, (y, x) => q3(x, y, CH), (y, x) => x + y * CH2);
  let tail = 0;
  for (let z = -PAD; z < CH + PAD; z++) for (let x = -PAD; x < CH + PAD; x++) for (let y = 0; y < WH; y++) {
    const p = q3(x, y, z), sv = padS[p], kv = padK[p];
    if (sv < 2 && kv < 2) continue;
    if (tail >= LQMAX) break;
    LQ[tail] = p; LQ[tail + 1] = sv; LQ[tail + 2] = kv; tail += 3;
  }
  for (let head = 0; head < tail; head += 3) {
    const p = LQ[head], s0 = LQ[head + 1], k0 = LQ[head + 2];
    const t = p - 1, y = t % PY, a = (t - y) / PY, zp = a % PS, xp = (a - zp) / PS;
    const x = xp - PAD, z = zp - PAD;
    if (s0 < 2 && k0 < 2) continue;
    for (let d = 0; d < 6; d++) {
      const nx = x + DX[d], ny = y + DY[d], nz = z + DZ[d];
      if (ny < 0 || ny >= WH || nx < -PAD || nx >= CH + PAD || nz < -PAD || nz >= CH + PAD) continue;
      const np = (xp + DX[d]) * PS * PY + (zp + DZ[d]) * PY + ny + 1;
      if (OPAQUE_LUT[padB[np]]) continue;
      if (s0 > 2 && s0 - 1 > padS[np]) { padS[np] = s0 - 1; if (tail < LQMAX) { LQ[tail] = np; LQ[tail + 1] = s0 - 1; LQ[tail + 2] = 0; tail += 3; } }
      if (k0 > 2 && k0 - 1 > padK[np]) { padK[np] = k0 - 1; if (tail < LQMAX) { LQ[tail] = np; LQ[tail + 1] = 0; LQ[tail + 2] = k0 - 1; tail += 3; } }
    }
  }
  for (let z = 0; z < CH; z++) for (let x = 0; x < CH; x++) {
    for (let y = 0, i = z * CH + x, p = q3(x, 0, z); y < WH; y++, i += CH2, p++) { ch.sky[i] = padS[p]; ch.blk[i] = padK[p]; }
  }
  ch.lightDirty = false;
}

/* ------------------------------------------------------------------ malha */
/* Sombra de contato por canto (0 = fechado, 3 = aberto). */
const AO_LVL = [.44, .68, .86, 1];
/* As seis faces do cubo. n é o eixo, sgn o lado, u/v as bases da textura e
   cada canto diz em que ponta do azulejo cai (i) e se é o de cima (j) — é
   isso que mantém a casca das árvores e as pranchas na vertical certa. */
const FACES = [
  { name: 'px', axis: 0, sgn: 1, tileIdx: 1, n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0], tileKey: 'side',
    corners: [{ p: [1, 0, 1], i: 0, j: 0 }, { p: [1, 0, 0], i: 1, j: 0 }, { p: [1, 1, 0], i: 1, j: 1 }, { p: [1, 1, 1], i: 0, j: 1 }] },
  { name: 'nx', axis: 0, sgn: -1, tileIdx: 1, n: [1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], tileKey: 'side',
    corners: [{ p: [0, 0, 0], i: 0, j: 0 }, { p: [0, 0, 1], i: 1, j: 0 }, { p: [0, 1, 1], i: 1, j: 1 }, { p: [0, 1, 0], i: 0, j: 1 }] },
  { name: 'py', axis: 1, sgn: 1, tileIdx: 0, n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], tileKey: 'top',
    corners: [{ p: [0, 1, 1], i: 0, j: 1 }, { p: [1, 1, 1], i: 1, j: 1 }, { p: [1, 1, 0], i: 1, j: 0 }, { p: [0, 1, 0], i: 0, j: 0 }] },
  { name: 'ny', axis: 1, sgn: -1, tileIdx: 2, n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], tileKey: 'bottom',
    corners: [{ p: [0, 0, 0], i: 0, j: 0 }, { p: [1, 0, 0], i: 1, j: 0 }, { p: [1, 0, 1], i: 1, j: 1 }, { p: [0, 0, 1], i: 0, j: 1 }] },
  { name: 'pz', axis: 2, sgn: 1, tileIdx: 1, n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], tileKey: 'side',
    corners: [{ p: [0, 0, 1], i: 0, j: 0 }, { p: [1, 0, 1], i: 1, j: 0 }, { p: [1, 1, 1], i: 1, j: 1 }, { p: [0, 1, 1], i: 0, j: 1 }] },
  { name: 'nz', axis: 2, sgn: -1, tileIdx: 1, n: [0, 0, 1], u: [-1, 0, 0], v: [0, 1, 0], tileKey: 'side',
    corners: [{ p: [1, 0, 0], i: 0, j: 0 }, { p: [0, 0, 0], i: 1, j: 0 }, { p: [0, 1, 0], i: 1, j: 1 }, { p: [1, 1, 0], i: 0, j: 1 }] },
];
/* UV do canto dentro do azulejo: nas faces laterais o eixo vertical do
   azulejo acompanha o Y do mundo; em cima/embaixo ele acompanha o Z. */
function faceUV(f, c, u0, v0, u1, v1) {
  return [c.i ? u1 : u0, c.j ? v1 : v0];
}

let mB = new Uint16Array(PS * PS * PY), mS = new Uint8Array(PS * PS * PY), mK = new Uint8Array(PS * PS * PY);

function faceNeeded(cur, nb) {
  if (cur === nb) return false;
  const C = DEFS[cur], N = DEFS[nb];
  if (!N) return true;
  if (N.opaque) return false;
  if (C.liquid) return !N.liquid;
  if (N.liquid && C.opaque) return true;
  return true;
}

function buildMesh(ch) {
  buildLUTs();
  const r = ringOf(ch);
  for (let y = 0; y < WH; y++) for (let z = -PAD; z < CH + PAD; z++) for (let x = -PAD; x < CH + PAD; x++) {
    const src = r[(z >> 4) + 1 + ((x >> 4) + 1) * 3], p = q3(x, y, z);
    if (!src) { mB[p] = 0; mS[p] = 15; mK[p] = 0; continue; }
    const i = (z & 15) * CH + (x & 15) + y * CH2;
    mB[p] = src.blocks[i]; mS[p] = src.sky[i]; mK[p] = src.blk[i];
  }
  const pos = [], uv = [], lig = [], ind = [], wpos = [], wuv = [], wlig = [], wind = [];
  const M = { p: pos, u: uv, l: lig, i: ind }, WA = { p: wpos, u: wuv, l: wlig, i: wind };
  const cy = (v) => (v < 0 ? 0 : v > WH - 1 ? WH - 1 : v);
  for (let y = 0; y < WH; y++) for (let lz = 0; lz < CH; lz++) for (let lx = 0; lx < CH; lx++) {
    const id = mB[q3(lx, y, lz)];
    if (!id) continue;
    const C = DEFS[id];
    if (C.shape === 'cross') { emitCross(lx, y, lz, id, C, pos, uv, lig, ind); continue; }
    if (C.shape === 'pane') { emitPane(lx, y, lz, id, C, pos, uv, lig, ind); continue; }
    const isLiq = LIQUID_LUT[id] === 1, T = isLiq ? WA : M, t3 = id * 3, em = C.light ? 1 : 0;
    for (let fi = 0; fi < 6; fi++) {
      const f = FACES[fi];
      const nx = lx + f.n[0] * f.sgn, ny = y + f.n[1] * f.sgn, nz = lz + f.n[2] * f.sgn;
      if (ny < 0 || ny >= WH) continue;
      const np = q3(nx, ny, nz), nb = mB[np];
      if (nb === id || OPAQUE_LUT[nb] || (isLiq && LIQUID_LUT[nb])) continue;
      const tv = TILE3[t3 + f.tileIdx] * 4;
      const u0 = TILEUV[tv], v0 = TILEUV[tv + 1], u1 = TILEUV[tv + 2], v1 = TILEUV[tv + 3];
      const ux = f.u[0], uy = f.u[1], uz = f.u[2], vx = f.v[0], vy = f.v[1], vz = f.v[2];
      const base = T.p.length / 3;
      for (let ci = 0; ci < 4; ci++) {
        const c = f.corners[ci], cp = c.p, su = c.i ? 1 : -1, sv = c.j ? 1 : -1;
        const ax = nx + ux * su, ay = ny + uy * su, az = nz + uz * su;
        const bx = nx + vx * sv, by = ny + vy * sv, bz = nz + vz * sv;
        const dx = ax + vx * sv, dy = ay + vy * sv, dz = az + vz * sv;
        let py = cp[1];
        if (isLiq && py === 1) py = .88;
        T.p.push(lx + cp[0], y + py, lz + cp[2]);
        T.u.push(c.i ? u1 : u0, c.j ? v1 : v0);
        let ao = 3;
        if (!isLiq) {
          const s1 = OPAQUE_LUT[mB[q3(ax, cy(ay), az)]], s2 = OPAQUE_LUT[mB[q3(bx, cy(by), bz)]];
          ao = (s1 && s2) ? 0 : 3 - (s1 + s2 + OPAQUE_LUT[mB[q3(dx, cy(dy), dz)]]);
        }
        const sk = mS[q3(nx, cy(ny), nz)] + mS[q3(ax, cy(ay), az)] + mS[q3(bx, cy(by), bz)] + mS[q3(dx, cy(dy), dz)];
        const bl = mK[q3(nx, cy(ny), nz)] + mK[q3(ax, cy(ay), az)] + mK[q3(bx, cy(by), bz)] + mK[q3(dx, cy(dy), dz)];
        let L = sk / 60, K = bl / 60;
        if (em) { L = 1; K = K > C.light / 15 ? K : C.light / 15; }
        T.l.push(L, K, isLiq ? 1 : AO_LVL[ao]);
      }
      T.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  return { pos, uv, lig, ind, wpos, wuv, wlig, wind };
}
function lightCell(lx, y, lz) {
  const p = q3(lx, y, lz);
  return [Math.min(1, mS[p] / 15), Math.min(1, mK[p] / 15)];
}
/* plantas/velas: duas lâminas em X, com os dois lados */
function emitCross(lx, y, lz, id, C, pos, uv, lig, ind) {
  const tgt = { p: pos, u: uv, l: lig, i: ind };
  const [u0, v0, u1, v1] = tileUV(C.tiles.side);
  const s = C.small ? .17 : .5;
  const cy0 = y + (C.small ? 0 : 0), cy1 = y + (C.small ? .62 : 1);
  const L = lightCell(lx, y, lz), lum = Math.max(L[0], L[1], C.light ? 1 : 0);
  const U = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const cx = lx + .5, cz = lz + .5;
  const quad = (ax, az, bx, bz) => {
    for (let side = 0; side < 2; side++) {
      const base = tgt.p.length / 3;
      const P = [[cx + ax, cy0, cz + az], [cx + bx, cy0, cz + bz], [cx + bx, cy1, cz + bz], [cx + ax, cy1, cz + az]];
      for (let i = 0; i < 4; i++) {
        tgt.p.push(P[side ? 3 - i : i][0], P[side ? 3 - i : i][1], P[side ? 3 - i : i][2]);
        tgt.u.push(U[i][0], U[i][1]);
        tgt.l.push(L[0], L[1], .92 + .08 * aoEdge(lx, lz));
      }
      if (side) tgt.i.push(base, base + 2, base + 1, base, base + 3, base + 2);
      else tgt.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  };
  quad(-s, -s, s, s); quad(s, -s, -s, s);
  function aoEdge() { return 1; }
}
/* escada de mão: painel encostado na parede (ou lâminas em X se estiver solta) */
function emitPane(lx, y, lz, id, C, pos, uv, lig, ind) {
  const [u0, v0, u1, v1] = tileUV(C.tiles.side);
  const solidAt = (x, z) => { const d = DEFS[mB[q3(x, y, z)]]; return !!(d && d.solid); };
  let any = false;
  for (const [dx, dz, off] of [[1, 0, .94], [-1, 0, .06], [0, 1, .94], [0, -1, .06]]) {
    if (!solidAt(lx + dx, lz + dz)) continue;
    any = true;
    const L = lightCell(lx, y, lz);
    const P = dx
      ? [[lx + off, y, lz], [lx + off, y, lz + 1], [lx + off, y + 1, lz + 1], [lx + off, y + 1, lz]]
      : [[lx, y, lz + off], [lx + 1, y, lz + off], [lx + 1, y + 1, lz + off], [lx, y + 1, lz + off]];
    for (let side = 0; side < 2; side++) {
      const base = pos.length / 3;
      for (let i = 0; i < 4; i++) {
        const q = side ? 3 - i : i;
        pos.push(P[q][0], P[q][1], P[q][2]);
        uv.push(i === 1 || i === 2 ? u1 : u0, i < 2 ? v0 : v1);
        lig.push(L[0], L[1], 1);
      }
      if (side) ind.push(base, base + 2, base + 1, base, base + 3, base + 2);
      else ind.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  if (!any) emitCross(lx, y, lz, id, C, pos, uv, lig, ind);
}
