/* noise.js — seedable value-noise + fbm (2D / 3D) used for terrain, forests and clouds. */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeNoise2D(seed = 1337) {
  const rand = mulberry32(seed);
  const SIZE = 256;
  const perm = new Uint8Array(SIZE * 2);
  const table = new Float32Array(SIZE);
  for (let i = 0; i < SIZE; i++) { table[i] = rand(); perm[i] = i; }
  for (let i = SIZE - 1; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
  }
  for (let i = 0; i < SIZE; i++) perm[i + SIZE] = perm[i];

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // Gradient-ish hash noise (Perlin style but with random unit gradients).
  const grad = [];
  for (let i = 0; i < 256; i++) {
    const a = rand() * Math.PI * 2;
    grad.push(Math.cos(a), Math.sin(a));
  }

  function perlin(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const p = perm;
    const aa = p[p[X] + Y], ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
    const g0 = (aa * 2); const g1 = (ba * 2); const g2 = (ab * 2); const g3 = (bb * 2);
    const d0 = grad[g0] * x + grad[g0 + 1] * y;
    const d1 = grad[g1] * (x - 1) + grad[g1 + 1] * y;
    const d2 = grad[g2] * x + grad[g2 + 1] * (y - 1);
    const d3 = grad[g3] * (x - 1) + grad[g3 + 1] * (y - 1);
    return lerp(lerp(d0, d1, u), lerp(d2, d3, u), v) * 0.7071;
  }

  return { noise: perlin, rand };
}

export function makeFbm2D(seed = 1337, octaves = 4) {
  const n = makeNoise2D(seed);
  return function fbm(x, y) {
    let sum = 0, amp = 1, freq = 1, norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += n.noise(x * freq, y * freq) * amp;
      norm += amp;
      amp *= 0.5; freq *= 2.13;
    }
    return sum / norm; // roughly [-1, 1]
  };
}

/* Soft domain warp helper: returns warped coords to feed a fbm. */
export function makeWarp2D(seed) {
  const a = makeFbm2D(seed, 3);
  const b = makeFbm2D(seed + 999, 3);
  return function (x, y, strength = 1) {
    return [x + a(x * 0.5, y * 0.5) * strength, y + b(x * 0.5, y * 0.5) * strength];
  };
}

/* 3D value-noise (used for water sparkle / clouds drifting). */
export function makeNoise3D(seed = 7) {
  const rand = mulberry32(seed);
  const SIZE = 128;
  const perm = new Uint8Array(SIZE * 2 + 2);
  const vals = new Float32Array(SIZE * SIZE * SIZE);
  for (let i = 0; i < SIZE; i++) perm[i] = i;
  for (let i = SIZE - 1; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
  }
  for (let i = 0; i < SIZE + 2; i++) perm[i + SIZE] = perm[i];
  for (let i = 0; i < SIZE * SIZE * SIZE; i++) vals[i] = rand();
  function idx(x, y, z) {
    return (perm[(perm[x & (SIZE - 1)] + y) & (SIZE - 1)] + z) & (SIZE - 1);
  }
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function vnoise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = fade(xf), v = fade(yf), w = fade(zf);
    const a = vals[idx(xi, yi, zi)], b = vals[idx(xi + 1, yi, zi)];
    const c = vals[idx(xi, yi + 1, zi)], d = vals[idx(xi + 1, yi + 1, zi)];
    const e = vals[idx(xi, yi, zi + 1)], f = vals[idx(xi + 1, yi, zi + 1)];
    const g = vals[idx(xi, yi + 1, zi + 1)], h = vals[idx(xi + 1, yi + 1, zi + 1)];
    const x1 = a + (b - a) * u, x2 = c + (d - c) * u;
    const x3 = e + (f - e) * u, x4 = g + (h - g) * u;
    const y1 = x1 + (x2 - x1) * v, y2 = x3 + (x4 - x3) * v;
    return y1 + (y2 - y1) * w * 2 - 1;
  }
  return vnoise;
}

export function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
export function smoothstep(a, b, x) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}
export function lerp(a, b, t) { return a + (b - a) * t; }
export function hash2(x, y, seed = 0) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
