window.__cubiaMain = function () {
'use strict';
/* ==========================================================================
   CUBIA — sandbox voxel de sobrevivência em arquivo único.
   Implementação do GDD: mundo procedural em chunks, mineração com dureza e
   hierarquia de ferramentas, crafting 2x2/3x3, fornalha, construção, fome/vida,
   mobs passivos/neutros/hostis com spawn por luz, XP + encantamentos,
   ciclo dia-noite de 20 min, 5 modos de jogo e autosave.
   ========================================================================== */

const THREE = window.__cubiaThree || window.THREE;
const boot = document.getElementById('bootMsg');
const sayBoot = (m) => { if (boot) boot.textContent = m; };

/* ------------------------------------------------------------------ utils */
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
const fmt = (n, d) => n.toFixed(d === undefined ? 1 : d);

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* hash inteiro determinístico para 3 coords + sal (usado em cavernas/minérios) */
function hash3(x, y, z, salt) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + salt * 1274126177) | 0;
  h = (h ^ (h >>> 13)) | 0; h = Math.imul(h, 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function strSeed(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* ------------------------------------------------------------- ruído Perlin */
function makeNoise(seed) {
  const rnd = mulberry32(seed >>> 0);
  const perm = new Uint8Array(512), p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad2 = (h, x, y) => {
    switch (h & 7) {
      case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y;
      case 4: return x * 1.414; case 5: return -x * 1.414; case 6: return y * 1.414; default: return -y * 1.414;
    }
  };
  const grad3 = (h, x, y, z) => {
    const u = h < 8 ? x : y, v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  };
  function n2(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1], ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
    return lerp(lerp(grad2(aa, x, y), grad2(ba, x - 1, y), u), lerp(grad2(ab, x, y - 1), grad2(bb, x - 1, y - 1), u), v) * 0.72;
  }
  function n3(x, y, z) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z, B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    const l = (a, b, t) => a + (b - a) * t;
    return l(l(l(grad3(perm[AA], x, y, z), grad3(perm[BA], x - 1, y, z), u),
      l(grad3(perm[AB], x, y - 1, z), grad3(perm[BB], x - 1, y - 1, z), u), v),
      l(l(grad3(perm[AA + 1], x, y, z - 1), grad3(perm[BA + 1], x - 1, y, z - 1), u),
        l(grad3(perm[AB + 1], x, y - 1, z - 1), grad3(perm[BB + 1], x - 1, y - 1, z - 1), u), v), w);
  }
  function fbm2(x, y, oct, lac, gain) {
    let s = 0, amp = 1, f = 1, norm = 0;
    for (let i = 0; i < (oct || 4); i++) { s += amp * n2(x * f, y * f); norm += amp; f *= (lac || 2); amp *= (gain || 0.5); }
    return s / (norm || 1);
  }
  function fbm3(x, y, z, oct) {
    let s = 0, amp = 1, f = 1, norm = 0;
    for (let i = 0; i < (oct || 3); i++) { s += amp * n3(x * f, y * f, z * f); norm += amp; f *= 2; amp *= 0.5; }
    return s / (norm || 1);
  }
  return { n2, n3, fbm2, fbm3 };
}

/* --------------------------------------------------------------- atlas 16px */
const TILE = 16, ATLAS_COLS = 16, ATLAS_PX = TILE * ATLAS_COLS;
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
const mixc = (a, b, t) => {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(lerp(ar, br, t)) << 16) | (Math.round(lerp(ag, bg, t)) << 8) | Math.round(lerp(ab, bb, t));
};

const MAT = { wood: 0x9c7b46, stone: 0x8f8f96, iron: 0xd8d8dd, gold: 0xf7d154, diamond: 0x4fe6df, leather: 0x8a5a34, netherite: 0x4a3c46 };
function buildAtlas() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = ATLAS_PX;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  const names = [], idx = Object.create(null);

  const P = {
    grass: [0x6fa83c, 0x5c8f31, 0x82bd4c, 0x4e7d2a],
    dirt: [0x8b6144, 0x74513a, 0x9c6f4e, 0x5e4230],
    stone: [0x8f8f96, 0x7d7d85, 0xa1a1a9, 0x6c6c74],
    cobble: [0x86868d, 0x6f6f77, 0x9c9ca4, 0x55555c],
    sand: [0xe0d29a, 0xd3c389, 0xeee2b1, 0xc2b078],
    gravel: [0x8d8b8a, 0x74716f, 0xa5a29f, 0x5d5b59],
    clay: [0xa5a9bd, 0x9296aa, 0xb6bad0, 0x7e8296],
    snow: [0xf2f7ff, 0xe2eaf7, 0xffffff, 0xd3ddee],
    ice: [0x9ad2fb, 0x82bdf0, 0xb6e2ff, 0x6ea9e0],
    water: [0x2f6fd0, 0x2560c0, 0x3e82e6, 0x1c4f9f],
    bedrock: [0x4a4a52, 0x33333a, 0x5f5f68, 0x22222a],
    obsidian: [0x2b2140, 0x1d1630, 0x3d3057, 0x120d20],
    oak: [0x9c6b3f, 0x7d5331, 0xb07c4c, 0x5f3f24],
    oaktop: [0xc19a5b, 0xa9814a, 0xd7b173, 0x8a683a],
    birch: [0xd7d3c4, 0xbdb8a6, 0xeceded, 0x6c665a],
    spruce: [0x6b4b2a, 0x553a20, 0x7d5a34, 0x3d2915],
    leafoak: [0x4b8a2b, 0x3a7120, 0x5da138, 0x2c5716],
    leafbirch: [0x63a440, 0x4f8a30, 0x78bb53, 0x3c6f22],
    leafspruce: [0x2f6b3c, 0x245330, 0x3d8049, 0x1b3f24],
    plankoak: [0xb98d55, 0xa17944, 0xc99f66, 0x8a6738],
    glow: [0xd9b25c, 0xf0cf7e, 0xa87f38, 0xffe9a8],
    brick: [0x9d5b46, 0x864a37, 0xb06a53, 0x6d3a2b],
    woolw: [0xeceef2, 0xd8dae0, 0xffffff, 0xc0c3cb],
    woolr: [0xa62b2b, 0x8b2222, 0xbf3a3a, 0x6f1a1a],
    woolb: [0x2f4bb5, 0x263d94, 0x3d5dd0, 0x1c2e70],
    wooly: [0xd8c531, 0xbcaf25, 0xe8d84d, 0x8f7417],
  };
  P.plankbirch = [0xd3c193, 0xbcaa7c, 0xe4d5ab, 0x9c8a5f];
  P.plankspruce = [0x8a6740, 0x74552f, 0x9c784c, 0x5c4222];
  P.sandstone = [0xdad0a1, 0xc8bd8b, 0xe9e0b7, 0xb0a577];
  P.granite = [0x9d7f6e, 0x86685a, 0xb29382, 0x6f5446];
  P.diorite = [0xb0b3b8, 0x989ba1, 0xc8cbd0, 0x7f8288];
  P.andesite = [0x8a908d, 0x747a77, 0xa0a6a3, 0x5e6461];
  P.deep = [0x4b4d59, 0x3b3d47, 0x5c5f6c, 0x2c2e37];
  P.tnt = [0xb5412f, 0xffffff, 0x8c2f22, 0x333333];

  /* ruído em manchas (2×2) + grão fino, igual ao visual do Minecraft:
     a textura parece terra/pedra de verdade, não estática de TV.
     hash3 em vez de Math.random → o mundo fica igual a cada recarga. */
  function speckle(pal, density, opt) {
    opt = opt || {};
    const cl = opt.cluster || 2, sd = opt.seed || 0, k = density === undefined ? 1 : density;
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const patch = hash3((x / cl) | 0, (y / cl) | 0, sd, 977);
      const grain = hash3(x, y, sd + 31, 613);
      let r = (patch * .68 + grain * .32 - .5) * 1.9 + .5;
      r = r < 0 ? 0 : (r > 1 ? 1 : r);
      let c = pal[0];
      if (r < .09 * k) c = pal[1];
      else if (r < .2 * k) c = pal[2];
      else if (r > .965) c = pal[3];
      g.fillStyle = hex(c);
      g.fillRect(x, y, 1, 1);
    }
  }

  function base(c) { g.fillStyle = hex(c); g.fillRect(0, 0, TILE, TILE); }
  function dot(x, y, c) { if (x < 0 || y < 0 || x > 15 || y > 15) return; g.fillStyle = hex(c); g.fillRect(x, y, 1, 1); }
  function rct(x, y, w, h, c) { g.fillStyle = hex(c); g.fillRect(x, y, w, h); }
  function outline(c) { g.fillStyle = hex(c); g.fillRect(0, 0, TILE, 1); g.fillRect(0, 15, TILE, 1); g.fillRect(0, 0, 1, TILE); g.fillRect(15, 0, 1, TILE); }
  function blobs(pal, count, rng) {
    for (let i = 0; i < count; i++) {
      const cx = (rng() * 13 + 1) | 0, cy = (rng() * 13 + 1) | 0;
      const s = 1 + ((rng() * 2.4) | 0);
      for (let a = 0; a < s + 1; a++) for (let b = 0; b < s + 1; b++) {
        if (rng() < 0.72) dot(cx + a - (s >> 1), cy + b - (s >> 1), pal[rng() < 0.35 ? 1 : 0]);
      }
    }
  }
  const DRAW = {
    grass_top: () => {
      speckle(P.grass, 1.35, { cluster: 2, seed: 5 });
      for (let i = 0; i < 16; i++) { const x = (hash3(i, 2, 7, 43) * 16) | 0, y = (hash3(i, 5, 9, 71) * 16) | 0; dot(x, y, P.grass[3]); if (hash3(x, y, 1, 5) < .55) dot(x, y + (y > 0 ? -1 : 1), P.grass[2]); }
    },
    grass_side: () => {
      speckle(P.dirt, 1.1, { cluster: 2, seed: 11 });
      for (let x = 0; x < TILE; x++) {
        const h = 3 + ((hash3(x, 7, 1, 5) * 3) | 0);
        for (let y = 0; y < h; y++) {
          const k = hash3(x, y, 3, 17);
          dot(x, y, P.grass[k < .3 ? 1 : (k < .72 ? 0 : (k < .93 ? 2 : 3))]);
        }
        if (hash3(x, 13, 2, 23) < .32) dot(x, h, P.grass[1]);
      }
    },
    dirt: () => speckle(P.dirt, 1.15, { cluster: 2, seed: 11 }),
    stone: () => { speckle(P.stone, 1.05, { cluster: 3, seed: 3 }); for (let i = 0; i < 3; i++) { const x = (hash3(i, 4, 1, 61) * 13) | 0, y = (hash3(i, 8, 2, 83) * 13) | 0; for (let a = 0; a < 3 + (i & 1); a++) dot(x + a, y + (a & 1), P.stone[1]); } },
    cobble: () => {
      /* pedregulho: pedras irregulares com rejunte escuro entre elas */
      base(P.cobble[3]);
      const st = [[0, 0, 6, 4], [7, 0, 5, 3], [13, 0, 3, 5], [0, 5, 4, 4], [5, 4, 4, 5], [10, 4, 3, 4],
                  [13, 6, 3, 4], [0, 10, 5, 3], [6, 10, 4, 3], [11, 11, 5, 5], [0, 14, 5, 2], [6, 14, 4, 2],
                  [7, 1, 0, 0], [10, 9, 4, 1]];
      for (let i = 0; i < st.length; i++) {
        const q = st[i], cx = q[0], cy = q[1], w = q[2], h = q[3];
        if (w <= 0 || h <= 0) continue;
        const t = hash3(i, 3, 1, 71);
        const c0 = P.cobble[t < .34 ? 1 : (t < .74 ? 0 : 2)];
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const gx = cx + x, gy = cy + y;
          if (gx > 15 || gy > 15) continue;
          if ((x === 0 && y === 0) || (x === w - 1 && y === 0) || (x === 0 && y === h - 1) || (x === w - 1 && y === h - 1)) continue;
          let c = c0;
          if (y === 0 || x === 0) c = mixc(c0, P.cobble[2], .72);
          else if (y === h - 1 || x === w - 1) c = mixc(c0, P.cobble[3], .55);
          if (hash3(gx, gy, i, 13) < .17) c = mixc(c, P.cobble[3], .5);
          dot(gx, gy, c);
        }
      }
    },
    granite: () => speckle(P.granite, 1.4),
    diorite: () => speckle(P.diorite, 1.4),
    andesite: () => speckle(P.andesite, 1.4),
    deepslate: () => speckle(P.deep, 1.1),
    sand: () => speckle(P.sand, .8),
    sandstone: () => { speckle(P.sandstone, .6); g.fillStyle = hex(P.sandstone[3]); g.fillRect(0, 5, TILE, 1); g.fillRect(0, 11, TILE, 1); },
    gravel: () => speckle(P.gravel, 1.6),
    clay: () => speckle(P.clay, .9),
    snow: () => speckle(P.snow, .7),
    ice: () => { speckle(P.ice, .8); g.fillStyle = hex(P.ice[2]); g.fillRect(2, 2, 5, 1); g.fillRect(3, 3, 1, 3); },
    water: () => { speckle(P.water, 1.1); for (let y = 1; y < 16; y += 4) for (let x = 0; x < 16; x++) dot(x, y + ((x % 3) | 0), P.water[2]); },
    bedrock: () => speckle(P.bedrock, 2),
    obsidian: () => { speckle(P.obsidian, 1.4); for (let i = 0; i < 10; i++) dot((Math.random() * 16) | 0, (Math.random() * 16) | 0, 0x6a4bb0); },
    oak_log: () => { speckle(P.oak, 1.1); g.fillStyle = hex(P.oak[3]); for (let x = 1; x < 16; x += 4) { for (let y = 0; y < 16; y++) if (hash3(x, y, 0, 9) < .7) g.fillRect(x, y, 1, 1); } },
    oak_log_top: () => { speckle(P.oaktop, .8); g.strokeStyle = hex(P.oak[3]); g.lineWidth = 1; for (let r = 2; r < 8; r += 2) g.strokeRect(8 - r, 8 - r, r * 2, r * 2); },
    birch_log: () => { speckle(P.birch, .6); g.fillStyle = hex(0x3b372f); for (let i = 0; i < 5; i++) { const y = (i * 3 + 1), x = (hash3(i, 2, 0, 3) * 11) | 0; g.fillRect(x, y, 3, 1); } },
    birch_log_top: () => { speckle(P.oaktop, .6); g.fillStyle = hex(0xcfc7ae); g.fillRect(0, 0, 16, 16); speckle(P.birch, .4); g.strokeStyle = hex(0x9c8a5f); g.strokeRect(3.5, 3.5, 9, 9); },
    spruce_log: () => { speckle(P.spruce, 1.2); g.fillStyle = hex(P.spruce[3]); for (let x = 2; x < 16; x += 5) g.fillRect(x, 0, 1, 16); },
    spruce_log_top: () => { speckle(P.oaktop, .9); g.strokeStyle = hex(P.spruce[2]); g.strokeRect(2.5, 2.5, 11, 11); g.strokeRect(5.5, 5.5, 5, 5); },
    leaf_oak: () => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const r = Math.random(); g.fillStyle = r < .1 ? 'rgba(0,0,0,0)' : hex(P.leafoak[(r * 4) | 0]); g.fillRect(x, y, 1, 1); } },
    leaf_birch: () => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const r = Math.random(); g.fillStyle = r < .12 ? 'rgba(0,0,0,0)' : hex(P.leafbirch[(r * 4) | 0]); g.fillRect(x, y, 1, 1); } },
    leaf_spruce: () => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const r = Math.random(); g.fillStyle = r < .16 ? 'rgba(0,0,0,0)' : hex(P.leafspruce[(r * 4) | 0]); g.fillRect(x, y, 1, 1); } },
    plank_oak: () => { speckle(P.plankoak, .5); g.fillStyle = hex(P.plankoak[3]); for (let y = 3; y < 16; y += 4) g.fillRect(0, y, 16, 1); g.fillRect(7, 0, 1, 4); g.fillRect(3, 4, 1, 4); g.fillRect(11, 8, 1, 4); g.fillRect(6, 12, 1, 4); },
    plank_birch: () => { speckle(P.plankbirch, .5); g.fillStyle = hex(P.plankbirch[3]); for (let y = 3; y < 16; y += 4) g.fillRect(0, y, 16, 1); g.fillRect(9, 0, 1, 4); g.fillRect(4, 4, 1, 4); g.fillRect(12, 8, 1, 4); },
    plank_spruce: () => { speckle(P.plankspruce, .5); g.fillStyle = hex(P.plankspruce[3]); for (let y = 3; y < 16; y += 4) g.fillRect(0, y, 16, 1); g.fillRect(6, 0, 1, 4); g.fillRect(11, 4, 1, 4); g.fillRect(3, 8, 1, 4); },
    craft_top: () => { speckle(P.plankoak, .5); g.fillStyle = hex(0x6b4b2a); g.fillRect(0, 0, 16, 3); g.fillRect(0, 0, 3, 16); g.fillStyle = hex(0x8a6738); for (let i = 0; i < 3; i++) g.fillRect(4 + i * 4, 4, 3, 3); },
    craft_side: () => { speckle(P.plankoak, .5); g.fillStyle = hex(0x6b4b2a); g.fillRect(0, 0, 16, 4); g.fillStyle = hex(0x3b2a17); g.fillRect(2, 6, 5, 5); g.fillRect(9, 6, 5, 5); g.fillStyle = hex(0xb98d55); g.fillRect(3, 7, 3, 3); },
    furn_front: () => { speckle(P.stone, .6); g.fillStyle = hex(0x3a3a3f); g.fillRect(3, 4, 10, 8); g.fillStyle = hex(0x6b6b73); g.fillRect(4, 12, 8, 2); g.fillStyle = hex(0x24242a); g.fillRect(4, 5, 8, 3); },
    furn_front_lit: () => { speckle(P.stone, .6); g.fillStyle = hex(0x3a3a3f); g.fillRect(3, 4, 10, 8); g.fillStyle = hex(0xff9d2e); g.fillRect(4, 8, 8, 3); g.fillStyle = hex(0xffe07a); g.fillRect(5, 9, 6, 2); g.fillStyle = hex(0x6b6b73); g.fillRect(4, 12, 8, 2); },
    furn_side: () => speckle(P.stone, .7),
    furn_top: () => { speckle(P.stone, .5); g.fillStyle = hex(0x6b6b73); g.fillRect(2, 2, 12, 12); g.fillStyle = hex(0x4b4b52); g.fillRect(4, 4, 8, 8); },
    chest_front: () => { speckle(P.plankoak, .5); g.fillStyle = hex(0x6b4b2a); g.fillRect(0, 5, 16, 2); g.fillStyle = hex(0xd9b25c); g.fillRect(7, 5, 2, 4); },
    chest_side: () => { speckle(P.plankoak, .5); g.fillStyle = hex(0x6b4b2a); g.fillRect(0, 5, 16, 2); },
    chest_top: () => { speckle(P.plankoak, .5); g.fillStyle = hex(0x6b4b2a); g.fillRect(0, 0, 16, 2); g.fillRect(0, 14, 16, 2); },
    bookshelf: () => { speckle(P.plankoak, .3); g.fillStyle = hex(0x6b4b2a); g.fillRect(0, 0, 16, 2); g.fillRect(0, 7, 16, 2); g.fillRect(0, 14, 16, 2); const cs = [0xb5412f, 0x2f4bb5, 0x2fbf9b, 0xd8c531, 0xa62b2b]; for (let s = 0; s < 2; s++) for (let i = 0; i < 6; i++) { g.fillStyle = hex(cs[(i + s) % 5]); g.fillRect(1 + i * 2 + s, 2 + s * 7, 2, 5); } },
    glass: () => { g.clearRect(0, 0, 16, 16); g.fillStyle = hex(0xcfe9ff); g.globalAlpha = .34; g.fillRect(0, 0, 16, 16); g.globalAlpha = 1; g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16); g.fillRect(2, 11, 6, 1); g.fillRect(3, 10, 1, 1); },
    bricks: () => { base(0x9d5b46); for (let y = 0; y < 16; y += 4) { g.fillStyle = hex(0xbfb0a4); g.fillRect(0, y, 16, 1); for (let i = 0; i < 4; i++) g.fillRect(((y / 4) % 2 ? 2 : 6) + i * 4, y + 1, 1, 3); } for (let i = 0; i < 20; i++) dot((Math.random() * 16) | 0, (Math.random() * 16) | 0, 0x864a37); },
    stonebricks: () => { speckle(P.stone, .5); g.fillStyle = hex(0x6c6c74); for (let y = 0; y < 16; y += 8) g.fillRect(0, y, 16, 1); g.fillRect(8, 0, 1, 8); g.fillRect(4, 8, 1, 8); g.fillRect(12, 8, 1, 8); },
    torch: () => { g.clearRect(0, 0, 16, 16); g.fillStyle = hex(0x8a6738); g.fillRect(7, 7, 2, 9); g.fillStyle = hex(0x6b4b2a); g.fillRect(7, 12, 2, 4); g.fillStyle = hex(0xffd166); g.fillRect(6, 4, 4, 3); g.fillStyle = hex(0xff8c1a); g.fillRect(6, 5, 4, 2); g.fillStyle = hex(0xfff3b0); g.fillRect(7, 4, 2, 1); },
    ladder: () => { g.clearRect(0, 0, 16, 16); g.fillStyle = hex(0x9c7840); g.fillRect(2, 0, 2, 16); g.fillRect(12, 0, 2, 16); for (let y = 2; y < 16; y += 4) g.fillRect(2, y, 12, 2); },
    cactus: () => { speckle([0x3f8f3a, 0x2f7030, 0x53a848, 0x245c25], 1.1); g.fillStyle = hex(0x245c25); g.fillRect(2, 0, 1, 16); g.fillRect(13, 0, 1, 16); g.fillStyle = hex(0xdfe9c9); for (let y = 2; y < 16; y += 5) { g.fillRect(5, y, 1, 1); g.fillRect(10, y + 2, 1, 1); } },
    tallgrass: () => { g.clearRect(0, 0, 16, 16); for (let i = 0; i < 22; i++) { const x = (Math.random() * 16) | 0, h = 4 + ((Math.random() * 10) | 0); g.fillStyle = hex(mixc(P.grass[0], P.grass[i & 3], .5)); for (let y = 0; y < h; y++) dot(x, 15 - y, mixc(P.grass[1], P.grass[y & 3], .4)); } },
    rose: () => { g.clearRect(0, 0, 16, 16); g.fillStyle = hex(0x3f7a2c); g.fillRect(7, 8, 2, 8); g.fillRect(5, 10, 2, 1); g.fillRect(9, 12, 2, 1); g.fillStyle = hex(0xc23b3b); g.fillRect(5, 3, 6, 5); g.fillStyle = hex(0xe46060); g.fillRect(6, 4, 4, 3); g.fillStyle = hex(0x8f2020); g.fillRect(7, 2, 2, 2); },
    dandelion: () => { g.clearRect(0, 0, 16, 16); g.fillStyle = hex(0x3f7a2c); g.fillRect(7, 8, 2, 8); g.fillRect(4, 11, 3, 1); g.fillStyle = hex(0xf0d34a); g.fillRect(5, 3, 6, 5); g.fillStyle = hex(0xfff0a0); g.fillRect(6, 4, 4, 3); g.fillStyle = hex(0xc9a521); g.fillRect(7, 2, 2, 2); },
    glowstone: () => { speckle(P.glow, 1.3); for (let i = 0; i < 26; i++) dot((Math.random() * 16) | 0, (Math.random() * 16) | 0, 0xfff2c0); },
    bed: () => { base(0xd7dae2); g.fillStyle = hex(0xa62b2b); g.fillRect(0, 0, 16, 7); g.fillStyle = hex(0x8b2222); g.fillRect(0, 7, 16, 1); g.fillStyle = hex(0xf2f4f8); g.fillRect(2, 1, 5, 4); },
    woolw: () => speckle(P.woolw, 1.2), woolr: () => speckle(P.woolr, 1.2),
    woolb: () => speckle(P.woolb, 1.2), wooly: () => speckle(P.wooly, 1.2),
    tnt: () => { base(0xb5412f); g.fillStyle = hex(0xe8e8e8); g.fillRect(0, 5, 16, 6); g.fillStyle = hex(0x22222a); for (let i = 0; i < 3; i++) g.fillRect(2 + i * 5, 6, 3, 4); g.fillStyle = hex(0x6b4b2a); g.fillRect(7, 1, 2, 4); },
    lava: () => { speckle([0xe8631a, 0xc2400c, 0xffa03c, 0x8f2b06], 1.8); for (let i = 0; i < 14; i++) dot((Math.random() * 16) | 0, (Math.random() * 16) | 0, 0xffd166); },
    enchant_top: () => { base(0x1b1230); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const r = Math.random(); if (r < .5) g.fillRect(x, y, 1, 1); } g.fillStyle = hex(0x38d16a); g.fillRect(4, 3, 8, 2); g.fillStyle = hex(0x5ff0e6); g.fillRect(6, 6, 4, 4); g.fillStyle = hex(0xd9b25c); g.fillRect(2, 12, 12, 2); },
    enchant_side: () => { base(0x241a3a); for (let i = 0; i < 40; i++) dot((Math.random() * 16) | 0, (Math.random() * 16) | 0, 0x3d2c5c); g.fillStyle = hex(0xd9b25c); g.fillRect(0, 12, 16, 2); g.fillStyle = hex(0x5ff0e6); g.fillRect(7, 4, 2, 4); },
    golden_apple: () => { clear(); blob(8, 9, 5.4, 5.4, 0xf7d154, 0xc39a17); rct(7, 2, 2, 3, WOODD); rct(9, 3, 3, 2, 0x4b8a2b); dot(5, 7, 0xfff0a0); },
    coal_ore: () => { speckle(P.stone, 1); blobs([0x26262c, 0x141419], 6, Math.random); },
    iron_ore: () => { speckle(P.stone, 1); blobs([0xd8a081, 0xb87f63], 6, Math.random); },
    gold_ore: () => { speckle(P.deep, 1); blobs([0xf7d154, 0xd8a723], 6, Math.random); },
    diamond_ore: () => { speckle(P.deep, 1); blobs([0x5ff0e6, 0x2ec9c0], 5, Math.random); },
    redstone_ore: () => { speckle(P.stone, 1); blobs([0xff2b2b, 0xa81111], 7, Math.random); },
    lapis_ore: () => { speckle(P.stone, 1); blobs([0x2b4fd8, 0x18309c], 6, Math.random); },
    emerald_ore: () => { speckle(P.stone, 1); blobs([0x38d16a, 0x1d9147], 4, Math.random); },
  };

  /* --- helpers de desenho para itens (ícones 16x16) --- */
  function clear() { g.clearRect(0, 0, TILE, TILE); }
  function diag(x0, y0, x1, y1, c, w) {
    w = w || 1;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) {
      const x = Math.round(lerp(x0, x1, i / n)), y = Math.round(lerp(y0, y1, i / n));
      g.fillStyle = hex(c); g.fillRect(x, y, w, w);
    }
  }
  function blob(cx, cy, rx, ry, c1, c2) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry, d = dx * dx + dy * dy;
      if (d <= 1.05) { g.fillStyle = hex(c2 && d > .55 ? c2 : c1); g.fillRect(x, y, 1, 1); }
    }
  }
  const WOOD = 0x9c7b46, WOODD = 0x6b4b2a;
  function drawTool(kind, m) {
    const l = mixc(m, 0xffffff, .38), d = mixc(m, 0x000000, .42);
    if (kind === 'pick') { rct(2, 2, 12, 2, m); rct(2, 4, 2, 2, m); rct(12, 4, 2, 2, m); rct(3, 2, 5, 1, l); rct(7, 4, 2, 10, WOOD); rct(8, 6, 1, 8, WOODD); }
    else if (kind === 'axe') { rct(8, 1, 6, 7, m); rct(8, 1, 5, 1, l); rct(12, 3, 2, 5, d); rct(6, 3, 2, 4, m); rct(4, 3, 2, 11, WOOD); rct(4, 12, 3, 3, WOODD); }
    else if (kind === 'shovel') { rct(6, 1, 5, 6, m); rct(7, 2, 3, 4, d); rct(6, 1, 4, 1, l); rct(7, 7, 2, 7, WOOD); rct(6, 13, 4, 2, WOODD); }
    else if (kind === 'sword') { rct(10, 1, 3, 3, m); rct(7, 3, 5, 6, m); rct(7, 4, 2, 5, l); rct(11, 4, 1, 5, d); rct(5, 9, 8, 2, d); rct(4, 11, 2, 4, WOOD); rct(3, 14, 3, 1, WOODD); }
  }
  function drawArmor(kind, m) {
    const l = mixc(m, 0xffffff, .3), d = mixc(m, 0x000000, .4);
    if (kind === 'helm') { rct(2, 3, 12, 6, m); rct(2, 2, 12, 1, l); rct(5, 6, 6, 3, 0x1a2233); rct(2, 9, 3, 3, m); rct(11, 9, 3, 3, m); }
    else if (kind === 'chest') { rct(2, 2, 12, 3, m); rct(1, 4, 3, 7, m); rct(12, 4, 3, 7, m); rct(4, 5, 8, 8, m); rct(7, 5, 2, 8, l); rct(4, 12, 8, 1, d); }
    else if (kind === 'legs') { rct(3, 2, 10, 3, m); rct(3, 5, 4, 9, m); rct(9, 5, 4, 9, m); rct(4, 5, 2, 8, l); rct(7, 2, 2, 12, d); }
    else { rct(3, 3, 5, 6, m); rct(9, 3, 5, 6, m); rct(2, 9, 7, 4, m); rct(8, 9, 7, 4, m); rct(2, 12, 13, 1, d); }
  }

  for (const mk of Object.keys(MAT)) {
    for (const kind of ['pick', 'axe', 'shovel', 'sword']) {
      DRAW[mk + '_' + kind] = () => { clear(); drawTool(kind, MAT[mk]); };
    }
  }
  for (const mk of ['leather', 'iron', 'diamond']) {
    for (const kind of ['helm', 'chest', 'legs', 'boots']) DRAW[mk + '_' + kind] = () => { clear(); drawArmor(kind, MAT[mk]); };
  }
  Object.assign(DRAW, {
    stick: () => { clear(); diag(4, 12, 10, 3, WOOD, 2); diag(5, 12, 10, 4, WOODD, 1); },
    coal: () => { clear(); blob(8, 8, 5.5, 5, 0x2a2a30, 0x141419); dot(6, 6, 0x4d4d57); dot(9, 7, 0x4d4d57); },
    charcoal: () => { clear(); blob(8, 8, 5.5, 5, 0x3b3026, 0x211a13); dot(6, 6, 0x5d4d3d); dot(10, 9, 0x5d4d3d); },
    ingot_iron: () => { clear(); rct(3, 6, 10, 5, 0xd8d8dd); rct(4, 5, 8, 1, 0xf2f2f6); rct(3, 11, 10, 1, 0x8e9099); },
    ingot_gold: () => { clear(); rct(3, 6, 10, 5, 0xf7d154); rct(4, 5, 8, 1, 0xfff0a0); rct(3, 11, 10, 1, 0xc39a17); },
    gem_diamond: () => { clear(); for (let i = 0; i < 7; i++) { const w = [3, 5, 7, 9, 7, 5, 3][i]; rct(8 - (w >> 1), 3 + i, w, 1, i < 3 ? 0x9ff6f0 : 0x4fe6df); } rct(6, 5, 4, 1, 0xdffdff); },
    gem_emerald: () => { clear(); for (let i = 0; i < 8; i++) { const w = [4, 6, 8, 10, 10, 8, 6, 4][i]; rct(8 - (w >> 1), 4 + i / 1 | 0, w, 1, i < 3 ? 0x8ef9ad : 0x38d16a); } },
    redstone: () => { clear(); for (let i = 0; i < 22; i++) dot(2 + ((Math.random() * 12) | 0), 2 + ((Math.random() * 12) | 0), Math.random() < .3 ? 0xff6b6b : 0xc21f1f); },
    lapis: () => { clear(); blob(8, 8, 5, 4.4, 0x2b4fd8, 0x18309c); dot(6, 6, 0x7c9bff); },
    bone: () => { clear(); rct(5, 4, 3, 9, 0xeef1f5); rct(4, 3, 5, 2, 0xffffff); rct(4, 12, 5, 2, 0xd5dae2); rct(9, 5, 3, 2, 0xeef1f5); },
    string: () => { clear(); for (let y = 2; y < 14; y++) { const x = 8 + Math.round(Math.sin(y * .9) * 3); dot(x, y, 0xe6ebf2); dot(x + 1, y, 0xb9c2d0); } },
    gunpowder: () => { clear(); for (let i = 0; i < 26; i++) dot(3 + ((Math.random() * 11) | 0), 4 + ((Math.random() * 9) | 0), Math.random() < .4 ? 0x6d6f75 : 0x43454b); },
    pearl: () => { clear(); blob(8, 8, 5.4, 5.4, 0x2fbf9b, 0x155e4c); dot(6, 5, 0x9ff7dc); dot(10, 10, 0x155e4c); },
    feather: () => { clear(); diag(4, 13, 11, 2, 0x8f9aa8, 1); for (let i = 0; i < 8; i++) { rct(5 + i, 11 - i, 2, 1, 0xe8eef6); rct(4 + i, 12 - i, 2, 1, 0xb7c2d2); } },
    egg: () => { clear(); blob(8, 9, 4, 5, 0xf3ece0, 0xd8cdbb); dot(6, 6, 0xffffff); },
    apple: () => { clear(); blob(8, 9, 5.4, 5.4, 0xc93a3a, 0x8c2020); rct(7, 2, 2, 3, WOODD); rct(9, 3, 3, 2, 0x4b8a2b); dot(5, 7, 0xf0a0a0); },
    bread: () => { clear(); rct(2, 6, 12, 6, 0xc08b46); rct(3, 5, 10, 1, 0xe0ad63); rct(2, 11, 12, 1, 0x8a5a2a); for (let i = 0; i < 3; i++) rct(4 + i * 4, 8, 2, 1, 0xe0ad63); },
    meat_raw: () => { clear(); blob(8, 8, 5.6, 4.4, 0xe4727c, 0xb94a56); rct(4, 6, 3, 1, 0xf7c9cd); rct(9, 9, 3, 1, 0xf7c9cd); },
    meat_cook: () => { clear(); blob(8, 8, 5.6, 4.4, 0x9c5a34, 0x6f3c21); rct(3, 7, 4, 1, 0xc78a5e); rct(9, 10, 4, 1, 0x5a2f19); },
    pork_raw: () => { clear(); blob(8, 8, 5.6, 4.2, 0xf2a6ad, 0xcf7d86); rct(5, 6, 4, 1, 0xffd9dd); },
    pork_cook: () => { clear(); blob(8, 8, 5.6, 4.2, 0xc08b60, 0x93613c); rct(5, 6, 4, 1, 0xe3b78c); },
    chick_raw: () => { clear(); blob(8, 8, 4.6, 5, 0xf0c9a8, 0xd3a079); rct(6, 3, 4, 2, 0xffe9d2); },
    chick_cook: () => { clear(); blob(8, 8, 4.6, 5, 0xb4762f, 0x8a5520); rct(6, 3, 4, 2, 0xd99b52); },
    rotten: () => { clear(); blob(8, 9, 5.4, 4.4, 0x6f7a3f, 0x4d5528); dot(5, 7, 0x8e9a52); dot(10, 10, 0x3a4020); },
    leather: () => { clear(); rct(3, 3, 10, 10, 0xb5854f); rct(4, 4, 8, 8, 0xcf9d63); dot(3, 3, 0x8a5a2a); dot(12, 3, 0x8a5a2a); dot(3, 12, 0x8a5a2a); dot(12, 12, 0x8a5a2a); },
    paper: () => { clear(); rct(3, 2, 10, 12, 0xf5f7fb); rct(5, 5, 6, 1, 0xb9c2d0); rct(5, 8, 6, 1, 0xb9c2d0); rct(5, 11, 4, 1, 0xb9c2d0); },
    book: () => { clear(); rct(3, 3, 10, 11, 0x8b3b3b); rct(4, 4, 8, 9, 0xf2e9d6); rct(3, 3, 2, 11, 0x6b2a2a); },
    bow: () => { clear(); g.strokeStyle = hex(WOOD); g.lineWidth = 2; g.beginPath(); g.arc(4, 8, 6.4, -1.15, 1.15); g.stroke(); g.strokeStyle = hex(0xe8eef6); g.lineWidth = 1; g.beginPath(); g.moveTo(9, 2); g.lineTo(9, 14); g.stroke(); },
    arrow: () => { clear(); diag(4, 12, 11, 3, 0xb9a184, 1); rct(11, 1, 3, 3, 0xd8d8dd); rct(3, 11, 3, 3, 0xe8eef6); },
    flint: () => { clear(); rct(4, 4, 8, 8, 0x3c3f47); rct(5, 3, 5, 2, 0x585d68); rct(6, 9, 4, 3, 0x24262c); },
    clay_ball: () => { clear(); blob(8, 8, 4.4, 4, 0xa8adbf, 0x8b90a3); },
    brick_item: () => { clear(); rct(3, 6, 10, 5, 0x9d5b46); rct(3, 6, 10, 1, 0xb06a53); },
    seed: () => { clear(); for (let i = 0; i < 5; i++) { dot(5 + (i % 3) * 3, 6 + ((i / 3) | 0) * 3, 0x74a13a); dot(6 + (i % 3) * 3, 6 + ((i / 3) | 0) * 3, 0x53792a); } },
    heart_full: () => { clear(); heart(0xe8355a, 0x9c0f2e); },
    heart_half: () => { clear(); g.save(); g.beginPath(); g.rect(0, 0, 8, 16); g.clip(); heart(0xe8355a, 0x9c0f2e); g.restore(); },
    heart_empty: () => { clear(); g.save(); g.globalAlpha = .5; heart(0x2b3242, 0x1b2130); g.restore(); },
    food_full: () => { clear(); blob(7, 9, 4.6, 4, 0xc98a4b, 0x8f5c26); rct(9, 3, 4, 4, 0xe8eef6); dot(12, 2, 0xffffff); },
    food_half: () => { clear(); g.save(); g.beginPath(); g.rect(0, 0, 8, 16); g.clip(); blob(7, 9, 4.6, 4, 0xc98a4b, 0x8f5c26); g.restore(); },
    food_empty: () => { clear(); g.save(); g.globalAlpha = .5; blob(7, 9, 4.6, 4, 0x2b3242, 0x1b2130); g.restore(); },
    armor_full: () => { clear(); drawArmor('chest', 0xc9d4e4); },
    armor_empty: () => { clear(); g.save(); g.globalAlpha = .42; drawArmor('chest', 0x2b3242); g.restore(); },
    bubble_full: () => { clear(); blob(8, 8, 4.6, 4.6, 0x8fd0ff, 0x2f7fd0); dot(6, 5, 0xffffff); },
    bubble_empty: () => { clear(); g.save(); g.globalAlpha = .4; blob(8, 8, 4.6, 4.6, 0x2b3242, 0x1b2130); g.restore(); },
    missing: () => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.fillStyle = hex(((x >> 2) + (y >> 2)) & 1 ? 0xff00ff : 0x111111); g.fillRect(x, y, 1, 1); } },
  });
  function heart(c1, c2) {
    rct(2, 4, 4, 4, c1); rct(10, 4, 4, 4, c1); rct(1, 5, 6, 4, c1); rct(9, 5, 6, 4, c1);
    rct(3, 9, 10, 2, c1); rct(4, 11, 8, 2, c1); rct(5, 13, 6, 1, c1); rct(7, 14, 2, 1, c1);
    rct(3, 5, 2, 2, 0xff8fa5); rct(2, 6, 3, 3, c2); rct(11, 6, 3, 3, c2);
  }

  /* monta o atlas e devolve o índice de cada azulejo */
  const order = Object.keys(DRAW);
  order.forEach((name, i) => {
    const col = i % ATLAS_COLS, row = (i / ATLAS_COLS) | 0;
    idx[name] = i; names[i] = name;
    g.save(); g.translate(col * TILE, row * TILE);
    g.beginPath(); g.rect(0, 0, TILE, TILE); g.clip();
    g.fillStyle = 'rgba(0,0,0,1)'; g.fillRect(0, 0, TILE, TILE);
    DRAW[name]();
    g.restore();
  });
  const T = (n) => (idx[n] === undefined ? idx.missing : idx[n]);
  return { canvas: cv, idx, names, T, count: order.length };
}

/* textura do atlas -> THREE.Texture + utilitário para desenhar azulejo num <canvas> da UI */
function makeAtlasTexture(atlas) {
  const tex = new THREE.CanvasTexture(atlas.canvas);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
  tex.needsUpdate = true;
  return tex;
}
const ATLAS = buildAtlas();
function tileUV(t) {
  const col = t % ATLAS_COLS, row = (t / ATLAS_COLS) | 0;
  const s = 1 / ATLAS_COLS, e = 0.0009;
  return [col * s + e * 0.5, 1 - (row + 1) * s + e * 0.5, (col + 1) * s - e * 0.5, 1 - row * s - e * 0.5];
}
function drawTileOn(ctx, tile, size) {
  const col = tile % ATLAS_COLS, row = (tile / ATLAS_COLS) | 0;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(ATLAS.canvas, col * TILE, row * TILE, TILE, TILE, 0, 0, size, size);
}
function iconCanvas(tile, px) {
  const c = document.createElement('canvas');
  c.width = c.height = px || 32;
  drawTileOn(c.getContext('2d'), tile, c.width);
  return c;
}
