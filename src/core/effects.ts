import type { Adjustments } from "@/lib/presets";
import { LOOKS } from "@/lib/presets";
import { clamp, hexToRgb } from "@/lib/utils";
import type { EffectInstance } from "./model";

/**
 * Motor de efeitos do editzz — tudo roda em canvas/ImageData no próprio
 * navegador: ajustes de cor, efeitos de pixel e sobreposições animadas.
 */

/* ══════════════ buffers reutilizáveis ══════════════ */

const scratchCache = new Map<string, Float32Array | Uint8ClampedArray>();
function scratch(key: string, size: number, kind: "f32" | "u8" = "f32") {
  const k = `${key}:${size}`;
  let b = scratchCache.get(k);
  if (!b) {
    b = kind === "f32" ? new Float32Array(size) : new Uint8ClampedArray(size);
    scratchCache.set(k, b);
  }
  return b;
}

/* ══════════════ ajustes de cor ══════════════ */

function buildToneLut(adj: Adjustments): { lut: Uint8ClampedArray; mul: [number, number, number] } {
  const lut = new Uint8ClampedArray(256);
  const exposure = 2 ** (adj.exposure / 100);
  const brightness = adj.brightness / 100;
  const contrast = 1 + adj.contrast / 100;
  const whites = adj.whites / 100;
  const blacks = adj.blacks / 100;
  const fade = adj.fade / 100;
  for (let i = 0; i < 256; i++) {
    let v = i / 255;
    v *= exposure;
    v += brightness * 0.35;
    v = (v - 0.5) * contrast + 0.5;
    if (whites !== 0) v += whites * 0.22 * Math.pow(clamp(v, 0, 1), 2.2);
    if (blacks !== 0) v += blacks * 0.22 * (1 - Math.pow(clamp(v, 0, 1), 0.45));
    if (adj.dehaze !== 0) {
      const d = adj.dehaze / 100;
      v = v + d * 0.5 * (v - 0.5) * (1 - Math.abs(v - 0.5));
    }
    if (fade > 0) v = v * (1 - fade * 0.35) + fade * 0.35 * 0.6;
    lut[i] = clamp(v * 255, 0, 255);
  }
  const t = adj.temperature / 100;
  const ti = adj.tint / 100;
  const mul: [number, number, number] = [1 + t * 0.22 + ti * 0.05, 1 + ti * 0.16, 1 - t * 0.22 + ti * 0.05];
  return { lut, mul };
}

function hslShift(r: number, g: number, b: number, hueDeg: number): [number, number, number] {
  if (hueDeg === 0) return [r, g, b];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  h = (h + hueDeg / 360) % 1;
  if (h < 0) h += 1;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

export interface LookRuntime {
  matrix?: number[];
  mono?: boolean;
  intensity: number;
}

/** Aplica todos os ajustes de cor + look em uma única passada. */
export function applyColorPipeline(img: ImageData, adj: Adjustments, look?: LookRuntime) {
  const d = img.data;
  const { lut, mul } = buildToneLut(adj);
  const sat = 1 + adj.saturation / 100;
  const vib = adj.vibrance / 100;
  const hi = adj.highlights / 100;
  const sh = adj.shadows / 100;
  const hue = adj.hue;
  const intensity = look ? look.intensity / 100 : 1;
  const mat = look?.matrix;
  const mono = look?.mono;

  for (let i = 0; i < d.length; i += 4) {
    let r = lut[d[i]] * mul[0];
    let g = lut[d[i + 1]] * mul[1];
    let b = lut[d[i + 2]] * mul[2];

    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (hi !== 0) {
      const w = Math.max(0, luma - 0.55) / 0.45;
      const f = 1 + hi * 0.55 * w;
      r *= f;
      g *= f;
      b *= f;
    }
    if (sh !== 0) {
      const w = Math.max(0, 0.45 - luma) / 0.45;
      const add = sh * 70 * w;
      r += add;
      g += add;
      b += add;
    }

    if (sat !== 1 || vib !== 0) {
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      let s = sat;
      if (vib !== 0) {
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        const curSat = (mx - mn) / 255;
        s += vib * (1 - curSat) * 0.9;
      }
      r = gray + (r - gray) * s;
      g = gray + (g - gray) * s;
      b = gray + (b - gray) * s;
    }

    if (hue !== 0) {
      const [nr, ng, nb] = hslShift(clamp(r / 255, 0, 1), clamp(g / 255, 0, 1), clamp(b / 255, 0, 1), hue);
      r = nr * 255;
      g = ng * 255;
      b = nb * 255;
    }

    if (mat) {
      const mr = (mat[0] * r + mat[1] * g + mat[2] * b) / 255 + mat[3] / 255 * 255;
      const mg = (mat[4] * r + mat[5] * g + mat[6] * b) / 255 + mat[7] / 255 * 255;
      const mb = (mat[8] * r + mat[9] * g + mat[10] * b) / 255 + mat[11] / 255 * 255;
      r = r + (mr - r) * intensity;
      g = g + (mg - g) * intensity;
      b = b + (mb - b) * intensity;
    }

    if (mono) {
      const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = r + (y - r) * intensity;
      g = g + (y - g) * intensity;
      b = b + (y - b) * intensity;
    }

    const c = 1 + adj.clarity / 100;
    if (adj.clarity !== 0) {
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const amt = adj.clarity / 100;
      r += (r - gray) * amt * 0.25 + (gray - 128) * amt * 0.18 * c;
      g += (g - gray) * amt * 0.25 + (gray - 128) * amt * 0.18 * c;
      b += (b - gray) * amt * 0.25 + (gray - 128) * amt * 0.18 * c;
    }

    d[i] = clamp(r, 0, 255);
    d[i + 1] = clamp(g, 0, 255);
    d[i + 2] = clamp(b, 0, 255);
  }

  if (adj.blur > 0) blurImageData(img, (adj.blur / 100) * Math.max(2, Math.min(img.width, img.height) * 0.035));
  if (adj.sharpen > 0) unsharp(img, (adj.sharpen / 100) * 1.6);
  if (adj.bloom > 0) bloomPass(img, adj.bloom / 100);
  if (adj.grain > 0) grainPass(img, adj.grain / 100);
  if (adj.vignette !== 0) vignettePass(img, adj.vignette / 100);
  if (adj.chromatic > 0) chromaticPass(img, (adj.chromatic / 100) * Math.max(2, img.width * 0.012));
}

export function lookRuntime(lookId: string, intensity = 100): LookRuntime | undefined {
  const def = LOOKS.find((l) => l.id === lookId);
  if (!def || def.id === "none") return undefined;
  return { matrix: def.matrix, mono: def.mono, intensity };
}

/* ══════════════ primitivas ══════════════ */

export function blurImageData(img: ImageData, radius: number) {
  const r = Math.max(1, Math.round(radius));
  const { width: w, height: h, data } = img;
  const n = w * h;
  const chans = [scratch("blurR", n) as Float32Array, scratch("blurG", n) as Float32Array, scratch("blurB", n) as Float32Array];
  const tmp = scratch("blurT", n) as Float32Array;
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    chans[0][i] = data[p];
    chans[1][i] = data[p + 1];
    chans[2][i] = data[p + 2];
  }
  for (const c of chans) {
    boxBlurH(c, tmp, w, h, r);
    boxBlurV(tmp, c, w, h, r);
    boxBlurH(c, tmp, w, h, Math.max(1, r >> 1));
    boxBlurV(tmp, c, w, h, Math.max(1, r >> 1));
  }
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    data[p] = chans[0][i];
    data[p + 1] = chans[1][i];
    data[p + 2] = chans[2][i];
  }
}

function boxBlurH(src: Float32Array, dst: Float32Array, w: number, h: number, r: number) {
  const div = r * 2 + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let i = -r; i <= r; i++) sum += src[row + clamp(i, 0, w - 1)];
    for (let x = 0; x < w; x++) {
      dst[row + x] = sum / div;
      sum += src[row + clamp(x + r + 1, 0, w - 1)] - src[row + clamp(x - r, 0, w - 1)];
    }
  }
}

function boxBlurV(src: Float32Array, dst: Float32Array, w: number, h: number, r: number) {
  const div = r * 2 + 1;
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let i = -r; i <= r; i++) sum += src[clamp(i, 0, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = sum / div;
      sum += src[clamp(y + r + 1, 0, h - 1) * w + x] - src[clamp(y - r, 0, h - 1) * w + x];
    }
  }
}

export function unsharp(img: ImageData, amount: number) {
  const copy = new Uint8ClampedArray(img.data);
  blurImageData(img, 1.4);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = clamp(d[i] + (copy[i] - d[i]) * (1 + amount), 0, 255);
    d[i + 1] = clamp(d[i + 1] + (copy[i + 1] - d[i + 1]) * (1 + amount), 0, 255);
    d[i + 2] = clamp(d[i + 2] + (copy[i + 2] - d[i + 2]) * (1 + amount), 0, 255);
  }
}

function bloomPass(img: ImageData, amount: number) {
  const { data, width, height } = img;
  const n = width * height;
  const bright = new Uint8ClampedArray(n * 4);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const l = (data[p] + data[p + 1] + data[p + 2]) / 3;
    const f = Math.max(0, (l - 165) / 90);
    bright[p] = data[p] * f;
    bright[p + 1] = data[p + 1] * f;
    bright[p + 2] = data[p + 2] * f;
    bright[p + 3] = 255;
  }
  const bImg = new ImageData(bright, width, height);
  blurImageData(bImg, Math.max(3, Math.min(width, height) * 0.03));
  for (let p = 0; p < data.length; p += 4) {
    data[p] = clamp(data[p] + bImg.data[p] * amount * 1.25, 0, 255);
    data[p + 1] = clamp(data[p + 1] + bImg.data[p + 1] * amount * 1.25, 0, 255);
    data[p + 2] = clamp(data[p + 2] + bImg.data[p + 2] * amount * 1.25, 0, 255);
  }
}

function grainPass(img: ImageData, amount: number) {
  const d = img.data;
  const strength = amount * 46;
  let seed = 12345 + (img.width & 255);
  for (let i = 0; i < d.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const n = ((seed >> 8) & 255) / 255 - 0.5;
    const v = n * strength;
    d[i] = clamp(d[i] + v, 0, 255);
    d[i + 1] = clamp(d[i + 1] + v, 0, 255);
    d[i + 2] = clamp(d[i + 2] + v, 0, 255);
  }
}

function vignettePass(img: ImageData, amount: number) {
  const { data, width: w, height: h } = img;
  const cx = w / 2;
  const cy = h / 2;
  const max = Math.hypot(cx, cy);
  for (let y = 0, p = 0; y < h; y++) {
    for (let x = 0; x < w; x++, p += 4) {
      const dist = Math.hypot(x - cx, y - cy) / max;
      const f = 1 + amount * (0.25 - dist) * 1.35;
      data[p] = clamp(data[p] * f, 0, 255);
      data[p + 1] = clamp(data[p + 1] * f, 0, 255);
      data[p + 2] = clamp(data[p + 2] * f, 0, 255);
    }
  }
}

function chromaticPass(img: ImageData, shift: number) {
  const { data, width: w, height: h } = img;
  const copy = new Uint8ClampedArray(data);
  const s = Math.max(1, Math.round(shift));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      const rp = (y * w + Math.max(0, x - s)) * 4;
      const bp = (y * w + Math.min(w - 1, x + s)) * 4;
      data[p] = copy[rp];
      data[p + 2] = copy[bp + 2];
    }
  }
}

/* ══════════════ efeitos de pixel ══════════════ */

type PixelFn = (img: ImageData, p: Record<string, number>, t: number, seed: number) => void;

function sample(src: Uint8ClampedArray, w: number, h: number, x: number, y: number, out: Uint8ClampedArray, o: number) {
  const cx = x < 0 ? 0 : x >= w ? w - 1 : x;
  const cy = y < 0 ? 0 : y >= h ? h - 1 : y;
  const p = (cy * w + cx) * 4;
  out[o] = src[p];
  out[o + 1] = src[p + 1];
  out[o + 2] = src[p + 2];
  out[o + 3] = src[p + 3];
}

function remap(img: ImageData, fn: (x: number, y: number, w: number, h: number, out: [number, number]) => void) {
  const { data, width: w, height: h } = img;
  const src = new Uint8ClampedArray(data);
  const out: [number, number] = [0, 0];
  const px = new Uint8ClampedArray(4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      fn(x, y, w, h, out);
      sample(src, w, h, out[0], out[1], px, 0);
      const p = (y * w + x) * 4;
      data[p] = px[0];
      data[p + 1] = px[1];
      data[p + 2] = px[2];
      data[p + 3] = px[3];
    }
  }
}

function kernel3(img: ImageData, k: number[]) {
  const { data, width: w, height: h } = img;
  const src = new Uint8ClampedArray(data);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const cx = clamp(x + kx, 0, w - 1);
          const cy = clamp(y + ky, 0, h - 1);
          const p = (cy * w + cx) * 4;
          const kv = k[(ky + 1) * 3 + (kx + 1)];
          r += src[p] * kv;
          g += src[p + 1] * kv;
          b += src[p + 2] * kv;
        }
      }
      const p = (y * w + x) * 4;
      data[p] = clamp(Math.abs(r), 0, 255);
      data[p + 1] = clamp(Math.abs(g), 0, 255);
      data[p + 2] = clamp(Math.abs(b), 0, 255);
    }
  }
}

/**
 * Aplica um efeito pixel dentro de outro efeito, com valores neutros para
 * tempo e semente (usado pelas composições, ex.: cartoon = posterize + bordas).
 */
function px(id: string, img: ImageData, p: Record<string, number>, t = 0, seed = 0) {
  PIXEL_EFFECTS[id]?.(img, p, t, seed);
}

export const PIXEL_EFFECTS: Record<string, PixelFn> = {
  rgb_split: (img, p) => {
    const shift = Math.max(1, Math.round((p.amount / 100) * 40));
    const { data, width: w, height: h } = img;
    const copy = new Uint8ClampedArray(data);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const rp = (y * w + clamp(x - shift, 0, w - 1)) * 4;
        const bp = (y * w + clamp(x + shift, 0, w - 1)) * 4;
        data[i] = copy[rp];
        data[i + 2] = copy[bp + 2];
      }
    }
  },
  wave: (img, p, t) => {
    const amp = (p.amount / 100) * 26;
    const freq = p.freq / 500;
    remap(img, (x, y, _w, _h, out) => {
      out[0] = x + Math.sin(y * freq + t * 3) * amp;
      out[1] = y;
    });
  },
  ripple: (img, p, t) => {
    const amp = (p.amount / 100) * 22;
    const speed = p.speed / 6;
    remap(img, (x, y, w, h, out) => {
      const dx = x - w / 2;
      const dy = y - h / 2;
      const d = Math.hypot(dx, dy);
      const off = Math.sin(d / 18 - t * speed * 3) * amp * (1 - d / Math.max(w, h));
      out[0] = x + (dx / (d || 1)) * off;
      out[1] = y + (dy / (d || 1)) * off;
    });
  },
  pixelate: (img, p) => {
    const size = Math.max(2, Math.round(p.size));
    const { data, width: w, height: h } = img;
    for (let y = 0; y < h; y += size) {
      for (let x = 0; x < w; x += size) {
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let yy = y; yy < Math.min(h, y + size); yy += 2) {
          for (let xx = x; xx < Math.min(w, x + size); xx += 2) {
            const i = (yy * w + xx) * 4;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }
        r /= Math.max(1, count);
        g /= Math.max(1, count);
        b /= Math.max(1, count);
        for (let yy = y; yy < Math.min(h, y + size); yy++) {
          for (let xx = x; xx < Math.min(w, x + size); xx++) {
            const i = (yy * w + xx) * 4;
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }
        }
      }
    }
  },
  twirl: (img, p) => {
    const amount = (p.amount / 100) * Math.PI;
    remap(img, (x, y, w, h, out) => {
      const cx = w / 2;
      const cy = h / 2;
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy);
      const maxR = Math.min(w, h) / 2;
      const f = 1 - clamp(d / maxR, 0, 1);
      const ang = amount * f;
      out[0] = cx + dx * Math.cos(ang) - dy * Math.sin(ang);
      out[1] = cy + dx * Math.sin(ang) + dy * Math.cos(ang);
    });
  },
  fisheye: (img, p) => {
    const amount = p.amount / 100;
    remap(img, (x, y, w, h, out) => {
      const cx = w / 2;
      const cy = h / 2;
      const nx = (x - cx) / cx;
      const ny = (y - cy) / cy;
      const r = Math.hypot(nx, ny);
      const f = 1 + amount * 0.65 * r * r;
      out[0] = cx + nx * f * cx;
      out[1] = cy + ny * f * cy;
    });
  },
  bulge: (img, p) => {
    const amount = p.amount / 100;
    const radius = (p.radius / 100) * Math.min(img.width, img.height) * 0.6;
    remap(img, (x, y, w, h, out) => {
      const cx = w / 2;
      const cy = h / 2;
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy);
      if (d > radius) {
        out[0] = x;
        out[1] = y;
        return;
      }
      const k = 1 - amount * 0.5 * Math.pow(1 - d / radius, 2);
      out[0] = cx + dx * k;
      out[1] = cy + dy * k;
    });
  },
  mirror: (img, p) => {
    const mode = Math.round(p.mode);
    const { width: w, height: h } = img;
    remap(img, (x, y, ww, hh, out) => {
      if (mode === 0) {
        out[0] = x < ww / 2 ? x : ww - 1 - x;
        out[1] = y;
      } else if (mode === 1) {
        out[0] = x;
        out[1] = y < hh / 2 ? y : hh - 1 - y;
      } else if (mode === 2) {
        out[0] = x < ww / 2 ? x * 2 : (ww - x) * 2;
        out[1] = y;
      } else {
        out[0] = ww - 1 - x;
        out[1] = hh - 1 - y;
      }
    });
    void w;
    void h;
  },
  kaleidoscope: (img, p, t) => {
    const seg = Math.max(2, Math.round(p.segments));
    const rot = ((p.rotate + t * 12) * Math.PI) / 180;
    remap(img, (x, y, w, h, out) => {
      const cx = w / 2;
      const cy = h / 2;
      const dx = x - cx;
      const dy = y - cy;
      let ang = Math.atan2(dy, dx) + rot;
      const d = Math.hypot(dx, dy);
      const slice = (Math.PI * 2) / seg;
      ang = Math.abs(((ang % slice) + slice) % slice - slice / 2);
      out[0] = cx + Math.cos(ang) * d;
      out[1] = cy + Math.sin(ang) * d;
    });
  },
  slice: (img, p, t) => {
    const rows = Math.max(2, Math.round(p.count));
    const { data, width: w, height: h } = img;
    const copy = new Uint8ClampedArray(data);
    const bandH = Math.max(1, Math.floor(h / rows));
    for (let i = 0; i < rows; i++) {
      const off = Math.round(Math.sin(i * 12.9898 + Math.floor(t * 12) * 78.233) * ((p.amount / 100) * 60));
      const y0 = i * bandH;
      for (let y = y0; y < Math.min(h, y0 + bandH); y++) {
        for (let x = 0; x < w; x++) {
          const sx = clamp(x + off, 0, w - 1);
          const si = (y * w + sx) * 4;
          const di = (y * w + x) * 4;
          data[di] = copy[si];
          data[di + 1] = copy[si + 1];
          data[di + 2] = copy[si + 2];
        }
      }
    }
  },
  posterize: (img, p) => {
    const levels = Math.max(2, Math.round(p.levels));
    const step = 255 / (levels - 1);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.round(d[i] / step) * step;
      d[i + 1] = Math.round(d[i + 1] / step) * step;
      d[i + 2] = Math.round(d[i + 2] / step) * step;
    }
  },
  threshold: (img, p) => {
    const level = p.level;
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      const v = l > level ? 255 : 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
    }
  },
  halftone: (img, p) => {
    const size = Math.max(2, Math.round(p.size));
    const angle = (p.angle * Math.PI) / 180;
    const { data, width: w, height: h } = img;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const rx = x * Math.cos(angle) - y * Math.sin(angle);
        const ry = x * Math.sin(angle) + y * Math.cos(angle);
        const gx = (rx % size + size) % size;
        const gy = (ry % size + size) % size;
        const i = (y * w + x) * 4;
        const l = (data[i] + data[i + 1] + data[i + 2]) / 765;
        const dist = Math.hypot(gx - size / 2, gy - size / 2) / (size / 2);
        const v = dist < l ? 255 : 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
      }
    }
  },
  dither: (img, p) => {
    const bayer = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];
    const size = Math.max(1, Math.round(p.size));
    const { data, width: w, height: h } = img;
    const stepX = Math.max(1, size);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const t = (bayer[Math.floor(y / stepX) % 4][Math.floor(x / stepX) % 4] / 16 - 0.5) * (255 / 3);
        data[i] = clamp(Math.round((data[i] + t) / 85) * 85, 0, 255);
        data[i + 1] = clamp(Math.round((data[i + 1] + t) / 85) * 85, 0, 255);
        data[i + 2] = clamp(Math.round((data[i + 2] + t) / 85) * 85, 0, 255);
      }
    }
  },
  emboss: (img) => kernel3(img, [-2, -1, 0, -1, 1, 1, 0, 1, 2]),
  sketch: (img, p) => {
    const copy = new Uint8ClampedArray(img.data);
    kernel3(img, [0, 1, 0, 1, -4, 1, 0, 1, 0]);
    const d = img.data;
    const amt = p.amount / 100;
    for (let i = 0; i < d.length; i += 4) {
      const inv = 255 - Math.max(d[i], d[i + 1], d[i + 2]);
      d[i] = clamp(255 - inv + (copy[i] - 255) * (1 - amt), 0, 255);
      d[i + 1] = clamp(255 - inv + (copy[i + 1] - 255) * (1 - amt), 0, 255);
      d[i + 2] = clamp(255 - inv + (copy[i + 2] - 255) * (1 - amt), 0, 255);
    }
  },
  cartoon: (img, p) => {
    px("posterize", img, { levels: p.levels });
    const edges = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
    kernel3(edges, [0, 1, 0, 1, -4, 1, 0, 1, 0]);
    const d = img.data;
    const e = edges.data;
    const amt = p.edge / 100;
    for (let i = 0; i < d.length; i += 4) {
      const edge = Math.max(e[i], e[i + 1], e[i + 2]) / 255;
      const k = 1 - edge * amt * 2.2;
      d[i] = clamp(d[i] * k, 0, 255);
      d[i + 1] = clamp(d[i + 1] * k, 0, 255);
      d[i + 2] = clamp(d[i + 2] * k, 0, 255);
    }
  },
  oil: (img, p) => {
    const radius = Math.max(1, Math.round(p.radius));
    const copy = new Uint8ClampedArray(img.data);
    const { data, width: w, height: h } = img;
    const bins = 12;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const counts = new Array(bins).fill(0) as number[];
        const sums = new Array(bins * 3).fill(0) as number[];
        for (let dy = -radius; dy <= radius; dy += 2) {
          for (let dx = -radius; dx <= radius; dx += 2) {
            const cx = clamp(x + dx, 0, w - 1);
            const cy = clamp(y + dy, 0, h - 1);
            const i = (cy * w + cx) * 4;
            const l = Math.floor((((copy[i] + copy[i + 1] + copy[i + 2]) / 3) / 255) * (bins - 1));
            counts[l]++;
            sums[l * 3] += copy[i];
            sums[l * 3 + 1] += copy[i + 1];
            sums[l * 3 + 2] += copy[i + 2];
          }
        }
        let best = 0;
        for (let b = 1; b < bins; b++) if (counts[b] > counts[best]) best = b;
        const c = Math.max(1, counts[best]);
        const di = (y * w + x) * 4;
        data[di] = sums[best * 3] / c;
        data[di + 1] = sums[best * 3 + 1] / c;
        data[di + 2] = sums[best * 3 + 2] / c;
      }
    }
  },
  thermal: (img, p) => {
    const amt = p.amount / 100;
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      const ramp: [number, number, number][] = [
        [4, 8, 60],
        [40, 20, 140],
        [150, 20, 120],
        [235, 90, 40],
        [255, 230, 120],
      ];
      const pos = clamp(l, 0, 1) * (ramp.length - 1);
      const i0 = Math.floor(pos);
      const i1 = Math.min(ramp.length - 1, i0 + 1);
      const f = pos - i0;
      const r = ramp[i0][0] + (ramp[i1][0] - ramp[i0][0]) * f;
      const g = ramp[i0][1] + (ramp[i1][1] - ramp[i0][1]) * f;
      const b = ramp[i0][2] + (ramp[i1][2] - ramp[i0][2]) * f;
      d[i] = d[i] + (r - d[i]) * amt;
      d[i + 1] = d[i + 1] + (g - d[i + 1]) * amt;
      d[i + 2] = d[i + 2] + (b - d[i + 2]) * amt;
    }
  },
  xray: (img, p) => {
    const amt = p.amount / 100;
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const inv = 255 - (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
      d[i] = d[i] + (inv * 0.6 - d[i]) * amt;
      d[i + 1] = d[i + 1] + (inv - d[i + 1]) * amt;
      d[i + 2] = d[i + 2] + (inv * 0.9 - d[i + 2]) * amt;
    }
  },
  neon_edge: (img, p) => {
    const hue = p.hue / 360;
    const edges = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
    kernel3(edges, [0, 1, 0, 1, -4, 1, 0, 1, 0]);
    const e = edges.data;
    const d = img.data;
    const glow = p.glow / 100;
    const [cr, cg, cb] = hslToRgb(hue, 1, 0.55);
    for (let i = 0; i < d.length; i += 4) {
      const intensity = Math.min(1, Math.max(e[i], e[i + 1], e[i + 2]) / 120);
      const base = 12 + intensity * 40;
      d[i] = clamp(base * 0.4 + cr * intensity * 255 * (0.7 + glow * 0.6), 0, 255);
      d[i + 1] = clamp(base * 0.4 + cg * intensity * 255 * (0.7 + glow * 0.6), 0, 255);
      d[i + 2] = clamp(base * 0.4 + cb * intensity * 255 * (0.7 + glow * 0.6), 0, 255);
    }
  },
  hologram: (img, p) => {
    const amt = p.amount / 100;
    const { data, width: w, height: h } = img;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const l = (data[i] + data[i + 1] + data[i + 2]) / 765;
        const scan = 0.85 + 0.15 * Math.sin(y * 0.6);
        const r = l * 90 * scan;
        const g = (120 + l * 135) * scan;
        const b = (150 + l * 105) * scan;
        data[i] = data[i] + (r - data[i]) * amt;
        data[i + 1] = data[i + 1] + (g - data[i + 1]) * amt;
        data[i + 2] = data[i + 2] + (b - data[i + 2]) * amt;
      }
    }
  },
  bloom: (img, p) => bloomPass(img, p.amount / 100),
  glow_neon: (img, p) => {
    bloomPass(img, p.amount / 100);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = clamp(d[i] * 1.08 + 8, 0, 255);
      d[i + 2] = clamp(d[i + 2] * 1.12 + 10, 0, 255);
    }
  },
  sharpen_pro: (img, p) => unsharp(img, (p.amount / 100) * 2.2),
  denoise: (img, p) => {
    const amt = p.amount / 100;
    const copy = new Uint8ClampedArray(img.data);
    blurImageData(img, 1 + amt * 2);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const edge = Math.abs(copy[i] - copy[i + 1]) + Math.abs(copy[i + 1] - copy[i + 2]);
      const keep = clamp(edge / 90, 0, 1);
      const k = amt * (1 - keep);
      d[i] = d[i] + (copy[i] - d[i]) * k;
      d[i + 1] = d[i + 1] + (copy[i + 1] - d[i + 1]) * k;
      d[i + 2] = d[i + 2] + (copy[i + 2] - d[i + 2]) * k;
    }
  },
  clarity: (img, p) => unsharp(img, (p.amount / 100) * 1.1),
  upscale: (img, p) => {
    const amt = p.amount / 100;
    unsharp(img, amt * 1.3);
    px("denoise", img, { amount: amt * 25 });
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = clamp(128 + (d[i] - 128) * (1 + amt * 0.14), 0, 255);
      d[i + 1] = clamp(128 + (d[i + 1] - 128) * (1 + amt * 0.14), 0, 255);
      d[i + 2] = clamp(128 + (d[i + 2] - 128) * (1 + amt * 0.14), 0, 255);
    }
  },
  motion_blur: (img, p) => {
    const dist = Math.round((p.amount / 100) * 30);
    if (dist < 1) return;
    const rad = (p.angle * Math.PI) / 180;
    const dx = Math.cos(rad) * dist * 0.5;
    const dy = Math.sin(rad) * dist * 0.5;
    const { data, width: w, height: h } = img;
    const copy = new Uint8ClampedArray(data);
    const px = new Uint8ClampedArray(4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let r = 0;
        let g = 0;
        let b = 0;
        const steps = 7;
        for (let s = 0; s < steps; s++) {
          const f = s / (steps - 1) - 0.5;
          sample(copy, w, h, x + dx * 2 * f, y + dy * 2 * f, px, 0);
          r += px[0];
          g += px[1];
          b += px[2];
        }
        const i = (y * w + x) * 4;
        data[i] = r / steps;
        data[i + 1] = g / steps;
        data[i + 2] = b / steps;
      }
    }
  },
  tilt_shift: (img, p) => {
    const { width: w, height: h } = img;
    const center = (p.center / 100) * h;
    const band = Math.max(12, h * (0.32 - (p.amount / 100) * 0.24));
    const blurred = new ImageData(new Uint8ClampedArray(img.data), w, h);
    blurImageData(blurred, Math.max(2, (p.amount / 100) * Math.min(w, h) * 0.06));
    const d = img.data;
    const bdata = blurred.data;
    for (let y = 0; y < h; y++) {
      const dist = Math.abs(y - center);
      const k = clamp((dist - band) / (h * 0.28), 0, 1);
      if (k <= 0.01) continue;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        d[i] += (bdata[i] - d[i]) * k;
        d[i + 1] += (bdata[i + 1] - d[i + 1]) * k;
        d[i + 2] += (bdata[i + 2] - d[i + 2]) * k;
      }
    }
  },
  mirror_kaleido_tile: (img, p) => {
    const cols = Math.max(1, Math.round(p.cols));
    const rows = Math.max(1, Math.round(p.rows));
    remap(img, (x, y, w, h, out) => {
      const cw = w / cols;
      const chh = h / rows;
      const cx = Math.floor(x / cw);
      const cy = Math.floor(y / chh);
      let lx = x - cx * cw;
      let ly = y - cy * chh;
      if (cx % 2) lx = cw - lx;
      if (cy % 2) ly = chh - ly;
      out[0] = lx;
      out[1] = ly;
    });
  },
  glitch: (img, p, t) => {
    px("slice", img, { amount: p.amount, count: p.slices }, t);
    px("rgb_split", img, { amount: p.amount * 0.5 });
  },
  glitch_scan: (img, p, t) => {
    px("slice", img, { amount: p.amount * 0.6, count: 24 }, t * (p.speed / 6));
    px("rgb_split", img, { amount: p.amount * 0.25 });
  },
  comic: (img, p) => {
    px("posterize", img, { levels: 5 });
    const edges = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
    kernel3(edges, [0, 1, 0, 1, -4, 1, 0, 1, 0]);
    const d = img.data;
    const e = edges.data;
    for (let i = 0; i < d.length; i += 4) {
      const ink = clamp(Math.max(e[i], e[i + 1], e[i + 2]) * (p.ink / 100) * 1.6, 0, 255);
      d[i] = clamp(d[i] - ink, 0, 255);
      d[i + 1] = clamp(d[i + 1] - ink, 0, 255);
      d[i + 2] = clamp(d[i + 2] - ink, 0, 255);
    }
    px("halftone", img, { size: p.dot, angle: 45 });
  },
  watercolor: (img, p) => {
    const amt = p.amount / 100;
    px("posterize", img, { levels: 8 });
    const copy = new Uint8ClampedArray(img.data);
    blurImageData(img, 2);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = d[i] + (copy[i] - d[i]) * (1 - amt * 0.5);
      d[i + 1] = d[i + 1] + (copy[i + 1] - d[i + 1]) * (1 - amt * 0.5);
      d[i + 2] = d[i + 2] + (copy[i + 2] - d[i + 2]) * (1 - amt * 0.5);
    }
  },
  datamosh: (img, p, t) => {
    px("slice", img, { amount: p.amount * 0.7, count: 8 }, t * 0.4);
    px("pixelate", img, { size: 3 + (p.amount / 100) * 10 });
  },
  film_burn: (img, p) => {
    const bx = img.width;
    const by = img.height * 0.5;
    const radius = ((p.amount / 100) * Math.min(img.width, img.height)) / 1.6;
    const d = img.data;
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < bx; x++) {
        const dist = Math.hypot(x - bx / 2, y - by) / radius;
        if (dist < 1) {
          const i = (y * bx + x) * 4;
          const burn = Math.pow(1 - dist, 2.2);
          d[i] = clamp(d[i] + 255 * burn * 1.6, 0, 255);
          d[i + 1] = clamp(d[i + 1] * (1 - burn) + 150 * burn, 0, 255);
          d[i + 2] = clamp(d[i + 2] * (1 - burn * 1.6), 0, 255);
        }
      }
    }
  },
  old_film: (img, p) => {
    const amt = p.amount / 100;
    const d = img.data;
    const { width: w, height: h } = img;
    for (let i = 0; i < d.length; i += 4) {
      const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      d[i] = clamp(l * 1.04 + 18 * amt, 0, 255);
      d[i + 1] = clamp(l * 0.98 + 10 * amt, 0, 255);
      d[i + 2] = clamp(l * 0.88, 0, 255);
    }
    grainPass(img, 0.35 * amt);
    for (let i = 0; i < 14; i++) {
      const x = Math.floor(Math.random() * w);
      for (let y = 0; y < h; y++) {
        if (Math.random() > 0.3) continue;
        const p = (y * w + x) * 4;
        d[p] = clamp(d[p] + 60 * amt, 0, 255);
        d[p + 1] = clamp(d[p + 1] + 60 * amt, 0, 255);
        d[p + 2] = clamp(d[p + 2] + 60 * amt, 0, 255);
      }
    }
  },
  vhs: (img, p, t) => {
    const amt = p.amount / 100;
    px("rgb_split", img, { amount: 16 * amt });
    px("slice", img, { amount: 40 * amt, count: 18 }, t * 6);
    const d = img.data;
    const { width: w, height: h } = img;
    for (let y = 0; y < h; y++) {
      const line = 1 - 0.16 * amt * (y % 3 === 0 ? 1 : 0);
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        d[i] *= line;
        d[i + 1] *= line;
        d[i + 2] *= line;
      }
    }
    grainPass(img, 0.22 * amt);
  },
  crt: (img, p) => {
    const amt = p.amount / 100;
    const d = img.data;
    const { width: w, height: h } = img;
    for (let y = 0; y < h; y++) {
      const mask = y % 3;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const f = y % 2 === 0 ? 1 : 1 - 0.22 * amt;
        d[i] = clamp(d[i] * f * (mask === 0 ? 1.08 : 0.94), 0, 255);
        d[i + 1] = clamp(d[i + 1] * f * (mask === 1 ? 1.08 : 0.94), 0, 255);
        d[i + 2] = clamp(d[i + 2] * f * (mask === 2 ? 1.08 : 0.94), 0, 255);
      }
    }
    bloomPass(img, 0.25 * amt);
  },
};

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}

/* ══════════════ efeitos desenhados por cima ══════════════ */

export interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  t: number;
  seed: number;
}

type DrawFn = (c: DrawCtx, p: Record<string, number>) => void;

function mulberry(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DRAW_EFFECTS: Record<string, DrawFn> = {
  scanlines: ({ ctx, w, h }, p) => {
    const gap = Math.max(2, Math.round(p.spacing));
    ctx.save();
    ctx.globalAlpha = (p.amount / 100) * 0.5;
    ctx.fillStyle = "#000";
    for (let y = 0; y < h; y += gap) ctx.fillRect(0, y, w, 1);
    ctx.restore();
  },
  rain: ({ ctx, w, h, t, seed }, p) => {
    const n = Math.round((p.amount / 100) * 320);
    const rnd = mulberry(seed);
    ctx.save();
    ctx.strokeStyle = "rgba(200,225,255,0.55)";
    ctx.lineWidth = 1.4;
    for (let i = 0; i < n; i++) {
      const x = rnd() * w;
      const speed = 400 + rnd() * 900;
      const len = 20 + rnd() * 60;
      const y = (rnd() * h + t * speed) % (h + len);
      const ang = (p.angle * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.sin(ang) * len, y + len);
      ctx.stroke();
    }
    ctx.restore();
  },
  snow: ({ ctx, w, h, t, seed }, p) => {
    const n = Math.round((p.amount / 100) * 220);
    const rnd = mulberry(seed);
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < n; i++) {
      const x = rnd() * w;
      const speed = 30 + rnd() * 90;
      const r = 1 + rnd() * p.size;
      const y = (rnd() * h + t * speed) % (h + 20);
      ctx.globalAlpha = 0.5 + rnd() * 0.5;
      ctx.beginPath();
      ctx.arc(x + Math.sin((t + i) * 0.8) * 12, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },
  confetti: ({ ctx, w, h, t, seed }, p) => {
    const n = Math.round((p.amount / 100) * 180);
    const rnd = mulberry(seed);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = rnd() * w;
      const speed = 90 + rnd() * 260;
      const size = 4 + rnd() * 8;
      const rot = (t + i) * (1 + rnd() * 3);
      const y = (rnd() * h + t * speed) % (h + 40);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = `hsl(${(rnd() * 360) | 0}, 85%, 62%)`;
      ctx.fillRect(-size / 2, -size / 4, size, size * 0.5);
      ctx.restore();
    }
    ctx.restore();
  },
  sparks: ({ ctx, w, h, t, seed }, p) => {
    const n = Math.round((p.amount / 100) * 160);
    const rnd = mulberry(seed);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = rnd() * w;
      const speed = 60 + rnd() * 200;
      const y = h - ((rnd() * h + t * speed) % (h + 30));
      const r = 1 + rnd() * 2.4;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
      g.addColorStop(0, "rgba(255,210,120,0.95)");
      g.addColorStop(1, "rgba(255,120,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x + Math.sin((t + i) * 2) * 8, y, r * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },
  bokeh_particles: ({ ctx, w, h, t, seed }, p) => {
    const n = Math.round((p.amount / 100) * 40);
    const rnd = mulberry(seed + 5);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < n; i++) {
      const x = rnd() * w;
      const size = p.size * (0.5 + rnd());
      const speed = 12 + rnd() * 40;
      const y = (rnd() * h - t * speed + h) % h;
      const g = ctx.createRadialGradient(x, y, 0, x, y, size);
      g.addColorStop(0, `hsla(${(rnd() * 360) | 0},90%,70%,0.5)`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },
  dust: ({ ctx, w, h, t, seed }, p) => {
    const n = Math.round((p.amount / 100) * 260);
    const rnd = mulberry(seed + 9);
    ctx.save();
    ctx.fillStyle = "rgba(255,250,230,0.35)";
    for (let i = 0; i < n; i++) {
      const x = (rnd() * w + t * (8 + rnd() * 20)) % w;
      const y = (rnd() * h + Math.sin(t + i) * 10) % h;
      ctx.globalAlpha = 0.15 + rnd() * 0.5;
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    ctx.restore();
  },
  fog: ({ ctx, w, h, t, seed }, p) => {
    const rnd = mulberry(seed + 13);
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const y = h * (0.3 + rnd() * 0.7) + Math.sin(t * 0.4 + i) * 20;
      const g = ctx.createLinearGradient(0, y - h * 0.18, 0, y + h * 0.18);
      g.addColorStop(0, "transparent");
      g.addColorStop(0.5, `rgba(220,225,235,${(p.amount / 100) * 0.22})`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, y - h * 0.2, w, h * 0.4);
    }
    ctx.restore();
  },
  lightning: ({ ctx, w, h, t, seed }, p) => {
    const rnd = mulberry(seed + 21);
    const freq = 0.6 + (p.amount / 100) * 3;
    const flash = Math.max(0, Math.sin(t * freq * Math.PI * 2) - 0.86) / 0.14;
    if (flash > 0.02) {
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${flash * 0.55})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
    if (flash > 0.4 && rnd() > 0.5) {
      ctx.save();
      ctx.strokeStyle = "rgba(220,235,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      let x = w * (0.2 + rnd() * 0.6);
      ctx.moveTo(x, 0);
      for (let y = 0; y < h * 0.8; y += h * 0.08) {
        x += (rnd() - 0.5) * w * 0.08;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
  },
  light_leak: ({ ctx, w, h, t }, p) => {
    const x = ((t * 0.12 * (p.speed / 4)) % 1.4 - 0.2) * w;
    const g = ctx.createLinearGradient(x - w * 0.3, 0, x + w * 0.3, h);
    g.addColorStop(0, "transparent");
    g.addColorStop(0.5, `rgba(255,150,60,${(p.amount / 100) * 0.5})`);
    g.addColorStop(1, "transparent");
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  },
  lens_flare: ({ ctx, w, h }, p) => {
    const x = (p.x / 100) * w;
    const y = (p.y / 100) * h;
    const amt = p.amount / 100;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    [0.35, 0.6, 0.9].forEach((f, i) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(w, h) * f * 0.5);
      g.addColorStop(0, `rgba(${120 + i * 40},${180 + i * 20},255,${0.5 * amt})`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    ctx.restore();
  },
  vignette_pulse: ({ ctx, w, h, t }, p) => {
    const bpm = Math.max(30, p.bpm);
    const beat = (t * bpm) / 60;
    const pulse = 0.4 + 0.6 * Math.abs(Math.sin(beat * Math.PI));
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, "transparent");
    g.addColorStop(1, `rgba(0,0,0,${clamp((p.amount / 100) * pulse, 0, 0.95)})`);
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  },
  flash: ({ ctx, w, h, t }, p) => {
    const bpm = Math.max(30, p.bpm);
    const beat = (t * bpm) / 60;
    const f = Math.max(0, 1 - (beat % 1) * 4) * (p.amount / 100);
    if (f <= 0.01) return;
    ctx.save();
    ctx.fillStyle = `rgba(255,255,255,${f * 0.8})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  },
  matrix_rain: ({ ctx, w, h, t, seed }, p) => {
    const size = Math.max(12, Math.round(w / 70));
    const cols = Math.ceil(w / size);
    const rnd = mulberry(seed + 33);
    ctx.save();
    ctx.globalAlpha = clamp((p.amount / 100) * 0.9, 0, 0.9);
    ctx.font = `600 ${size}px "JetBrains Mono", monospace`;
    for (let c = 0; c < cols; c++) {
      const speed = 40 + rnd() * 160;
      const offset = rnd() * h;
      const y = (offset + t * speed) % (h + size * 12);
      const ch = String.fromCharCode(0x30a0 + Math.floor(rnd() * 90));
      ctx.fillStyle = "rgba(180,255,200,0.95)";
      ctx.fillText(ch, c * size, y);
      ctx.fillStyle = "rgba(34,197,94,0.55)";
      for (let i = 1; i < 8; i++) {
        ctx.globalAlpha = clamp((p.amount / 100) * (1 - i / 8), 0, 0.7);
        ctx.fillText(String.fromCharCode(0x30a0 + Math.floor(rnd() * 90)), c * size, y - i * size);
      }
      ctx.globalAlpha = clamp((p.amount / 100) * 0.9, 0, 0.9);
    }
    ctx.restore();
  },
  ascii: ({ ctx, w, h }, p) => {
    const size = Math.max(4, Math.round(p.size));
    const cols = Math.floor(w / size);
    const rows = Math.floor(h / size);
    const data = ctx.getImageData(0, 0, w, h);
    const chars = " .:-=+*#%@";
    ctx.save();
    ctx.fillStyle = "#05060a";
    ctx.fillRect(0, 0, w, h);
    ctx.font = `${size}px "JetBrains Mono", monospace`;
    ctx.textBaseline = "top";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * size;
        const y = r * size;
        const i = ((y + size / 2) * w + (x + size / 2)) * 4;
        const l = (data.data[i] + data.data[i + 1] + data.data[i + 2]) / 765;
        const ch = chars[Math.min(chars.length - 1, Math.floor(l * chars.length))];
        ctx.fillStyle = p.color > 0.5 ? `rgb(${data.data[i]},${data.data[i + 1]},${data.data[i + 2]})` : "#d1fae5";
        ctx.fillText(ch, x, y);
      }
    }
    ctx.restore();
  },
  shake: () => undefined,
  zoom_pulse: () => undefined,
};

/* ══════════════ aplicação em lote ══════════════ */

export function applyPixelEffect(id: string, img: ImageData, params: Record<string, number>, t: number, seed: number) {
  const fn = PIXEL_EFFECTS[id];
  if (!fn) return;
  fn(img, params, t, seed);
}

export function applyDrawEffects(ctx: CanvasRenderingContext2D, w: number, h: number, effects: EffectInstance[], t: number) {
  effects.forEach((e, i) => {
    if (!e.enabled) return;
    const fn = DRAW_EFFECTS[e.id];
    if (!fn) return;
    fn({ ctx, w, h, t, seed: 1000 + i * 37 }, e.params);
  });
}

/** Efeitos que deslocam o quadro inteiro (aplicados como transformação). */
export function transformFromEffects(effects: EffectInstance[], w: number, _h: number, t: number): { dx: number; dy: number; zoom: number } {
  let dx = 0;
  let dy = 0;
  let zoom = 1;
  effects.forEach((e, i) => {
    if (!e.enabled) return;
    if (e.id === "shake") {
      const amt = (e.params.amount / 100) * w * 0.04;
      const sp = e.params.speed;
      dx += Math.sin(t * sp * 3.1 + i) * amt;
      dy += Math.cos(t * sp * 2.7 + i * 1.7) * amt;
    }
    if (e.id === "zoom_pulse") {
      const bpm = Math.max(30, e.params.bpm);
      const beat = (t * bpm) / 60;
      const pulse = Math.max(0, 1 - (beat % 1) * 3);
      zoom *= 1 + (e.params.amount / 100) * 0.22 * pulse;
    }
  });
  return { dx, dy, zoom };
}

export function hexToRgbArr(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return [r, g, b] as [number, number, number];
}
