import { LOOKS, type Adjustments } from "@/lib/presets";
import { clamp, createCanvas, ctx2d, hexToRgb, rgbToHex } from "@/lib/utils";
import { applyColorPipeline, applyPixelEffect, lookRuntime } from "./effects";

/**
 * Motor de edição de imagem do editzz.
 * A edição é NÃO destrutiva: a receita (recorte, curvas, HSL, efeitos, pincéis
 * e camadas) é aplicada em ordem a partir da imagem original, o que permite
 * desfazer/reordenar qualquer etapa.
 */

export type CurveChannel = "rgb" | "r" | "g" | "b";
export interface CurvePoint {
  x: number;
  y: number;
}

export const HSL_BANDS = ["red", "orange", "yellow", "green", "aqua", "blue", "purple", "magenta"] as const;
export type HslBand = (typeof HSL_BANDS)[number];

export const BAND_RANGES: Record<HslBand, [number, number]> = {
  red: [345, 15],
  orange: [15, 45],
  yellow: [45, 70],
  green: [70, 165],
  aqua: [165, 195],
  blue: [195, 265],
  purple: [265, 290],
  magenta: [290, 345],
};

export interface HslAdjust {
  h: number;
  s: number;
  l: number;
}

export interface Wheel {
  h: number;
  s: number;
  l: number;
}

export interface OverlayBase {
  id: string;
  type: "text" | "shape" | "sticker" | "image";
  x: number;
  y: number;
  scale: number;
  rotate: number;
  opacity: number;
  blend: string;
  locked?: boolean;
}

export interface TextOverlay extends OverlayBase {
  type: "text";
  text: string;
  font: string;
  weight: number;
  size: number;
  color: string;
  align: "left" | "center" | "right";
  uppercase: boolean;
  letterSpacing: number;
  strokeColor: string;
  strokeWidth: number;
  shadow: boolean;
  bg: string;
  bgOpacity: number;
  radius: number;
}

export interface ShapeOverlay extends OverlayBase {
  type: "shape";
  shape: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface StickerOverlay extends OverlayBase {
  type: "sticker";
  emoji: string;
  size: number;
}

export interface ImageOverlay extends OverlayBase {
  type: "image";
  src: string;
  width: number;
  height: number;
}

export type Overlay = TextOverlay | ShapeOverlay | StickerOverlay | ImageOverlay;

export type BrushTool = "erase" | "heal" | "clone" | "smooth" | "teeth" | "redeye" | "dodge" | "burn" | "liquify_push" | "liquify_pinch" | "liquify_bulge";

export interface RasterOp {
  id: string;
  tool: BrushTool;
  size: number;
  strength: number;
  points: { x: number; y: number }[];
  /** deslocamento relativo (clone / liquify) por ponto */
  deltas?: { dx: number; dy: number }[];
  source?: { x: number; y: number };
}

export interface MaskOp {
  id: string;
  kind: "linear" | "radial" | "point";
  x: number;
  y: number;
  radius: number;
  angle: number;
  feather: number;
  invert: boolean;
  adjust: Partial<Adjustments>;
  exposure: number;
}

export interface FrameCfg {
  id: "none" | "polaroid" | "film" | "rounded" | "double" | "color" | "shadow" | "phone";
  color: string;
  width: number;
  radius: number;
}

export interface ImageRecipe {
  crop: { x: number; y: number; w: number; h: number };
  straighten: number;
  rotate90: number;
  flipH: boolean;
  flipV: boolean;
  resize: { w: number; h: number; keepRatio: boolean; mode: "lanczos" | "nearest" };
  perspective: { tl: [number, number]; tr: [number, number]; br: [number, number]; bl: [number, number] };
  vignetteShape: "off" | "circle" | "square";
  adjust: Adjustments;
  curves: Record<CurveChannel, CurvePoint[]>;
  levels: { black: number; white: number; gamma: number };
  hsl: Record<HslBand, HslAdjust>;
  grade: { shadows: Wheel; mids: Wheel; highlights: Wheel; balance: number; blending: number };
  look: string;
  lookIntensity: number;
  effects: { id: string; amount: number }[];
  frame: FrameCfg;
  watermark: { enabled: boolean; text: string; size: number; color: string; opacity: number; pos: string };
  palette: string[];
}

export const defaultRecipe = (w = 1000, h = 1000): ImageRecipe => ({
  crop: { x: 0, y: 0, w: 1, h: 1 },
  straighten: 0,
  rotate90: 0,
  flipH: false,
  flipV: false,
  resize: { w, h, keepRatio: true, mode: "lanczos" },
  perspective: { tl: [0, 0], tr: [0, 0], br: [0, 0], bl: [0, 0] },
  vignetteShape: "off",
  adjust: {
    exposure: 0, brightness: 0, contrast: 0, saturation: 0, vibrance: 0, temperature: 0, tint: 0,
    highlights: 0, shadows: 0, whites: 0, blacks: 0, clarity: 0, dehaze: 0, sharpen: 0, blur: 0,
    vignette: 0, grain: 0, fade: 0, hue: 0, bloom: 0, chromatic: 0,
  },
  curves: { rgb: [], r: [], g: [], b: [] },
  levels: { black: 0, white: 255, gamma: 1 },
  hsl: HSL_BANDS.reduce((acc, b) => {
    acc[b] = { h: 0, s: 0, l: 0 };
    return acc;
  }, {} as Record<HslBand, HslAdjust>),
  grade: {
    shadows: { h: 0, s: 0, l: 0 },
    mids: { h: 0, s: 0, l: 0 },
    highlights: { h: 0, s: 0, l: 0 },
    balance: 0,
    blending: 50,
  },
  look: "none",
  lookIntensity: 100,
  effects: [],
  frame: { id: "none", color: "#ffffff", width: 6, radius: 20 },
  watermark: { enabled: false, text: "editzz", size: 40, color: "#ffffff", opacity: 0.6, pos: "br" },
  palette: [],
});

/* ══════════════ curvas e níveis ══════════════ */

export function curveLut(points: CurvePoint[]): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256);
  const pts = [{ x: 0, y: 0 }, ...points.slice().sort((a, b) => a.x - b.x), { x: 1, y: 1 }];
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    let idx = 0;
    while (idx < pts.length - 2 && x > pts[idx + 1].x) idx++;
    const p0 = pts[Math.max(0, idx - 1)];
    const p1 = pts[idx];
    const p2 = pts[Math.min(pts.length - 1, idx + 1)];
    const p3 = pts[Math.min(pts.length - 1, idx + 2)];
    const t = p2.x === p1.x ? 0 : clamp((x - p1.x) / (p2.x - p1.x), 0, 1);
    const y =
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t * t +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t * t * t);
    lut[i] = clamp(y * 255, 0, 255);
  }
  return lut;
}

function levelsLut(levels: ImageRecipe["levels"]) {
  const lut = new Uint8ClampedArray(256);
  const range = Math.max(1, levels.white - levels.black);
  for (let i = 0; i < 256; i++) {
    let v = (i - levels.black) / range;
    v = clamp(v, 0, 1) ** (1 / clamp(levels.gamma, 0.05, 5));
    lut[i] = clamp(v * 255, 0, 255);
  }
  return lut;
}

/* ══════════════ passada de cor completa (imagem) ══════════════ */

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [number, number, number];
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
  return [h * 360, s, l];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
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
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
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
  return [f(h / 360 + 1 / 3) * 255, f(h / 360) * 255, f(h / 360 - 1 / 3) * 255];
}

function bandFor(hue: number): HslBand | null {
  for (const band of HSL_BANDS) {
    const [a, b] = BAND_RANGES[band];
    if (a < b ? hue >= a && hue < b : hue >= a || hue < b) return band;
  }
  return null;
}

/** Aplica curva + níveis + HSL por faixa + color grading + look + ajustes. */
export function applyImageColor(img: ImageData, recipe: ImageRecipe) {
  const hasCurves = (["rgb", "r", "g", "b"] as CurveChannel[]).some((c) => recipe.curves[c].length > 0);
  const lv = levelsLut(recipe.levels);
  const lvActive = recipe.levels.black > 0 || recipe.levels.white < 255 || Math.abs(recipe.levels.gamma - 1) > 0.01;
  const hslActive = HSL_BANDS.some((b) => recipe.hsl[b].h !== 0 || recipe.hsl[b].s !== 0 || recipe.hsl[b].l !== 0);
  const gradeActive =
    recipe.grade.shadows.s !== 0 || recipe.grade.mids.s !== 0 || recipe.grade.highlights.s !== 0 ||
    recipe.grade.shadows.l !== 0 || recipe.grade.mids.l !== 0 || recipe.grade.highlights.l !== 0;
  const lookActive = recipe.look && recipe.look !== "none";
  const adjustActive = Object.values(recipe.adjust).some((v) => Math.abs(v) > 0.01);

  const d = img.data;
  const lutRgb = hasCurves ? curveLut(recipe.curves.rgb) : null;
  const lutR = hasCurves ? curveLut(recipe.curves.r) : null;
  const lutG = hasCurves ? curveLut(recipe.curves.g) : null;
  const lutB = hasCurves ? curveLut(recipe.curves.b) : null;
  const shadowsHsl = [recipe.grade.shadows.h, recipe.grade.shadows.s / 100, recipe.grade.shadows.l / 100] as const;
  const midsHsl = [recipe.grade.mids.h, recipe.grade.mids.s / 100, recipe.grade.mids.l / 100] as const;
  const highsHsl = [recipe.grade.highlights.h, recipe.grade.highlights.s / 100, recipe.grade.highlights.l / 100] as const;
  const balance = recipe.grade.balance / 100;

  if (!hasCurves && !lvActive && !hslActive && !gradeActive && !lookActive && !adjustActive) return;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    if (lutRgb) {
      r = lutRgb[r];
      g = lutRgb[g];
      b = lutRgb[b];
    }
    if (lutR) r = lutR[r];
    if (lutG) g = lutG[g];
    if (lutB) b = lutB[b];
    if (lvActive) {
      r = lv[r];
      g = lv[g];
      b = lv[b];
    }

    if (hslActive) {
      let [h, s, l] = rgbToHsl(r / 255, g / 255, b / 255);
      const band = bandFor(h);
      if (band) {
        const adj = recipe.hsl[band];
        h += adj.h;
        s = clamp(s * (1 + adj.s / 100), 0, 1);
        l = clamp(l * (1 + adj.l / 100), 0, 1);
        const [nr, ng, nb] = hslToRgb(h, s, l);
        r = nr;
        g = ng;
        b = nb;
      }
    }

    if (gradeActive) {
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const shW = clamp(1 - lum / (0.5 + balance * 0.3), 0, 1) ** 2;
      const hiW = clamp((lum - 0.5 + balance * 0.3) / 0.5, 0, 1) ** 2;
      const midW = clamp(1 - shW - hiW, 0, 1);
      const tiers: [number, number, number, number][] = [
        [shadowsHsl[0], shadowsHsl[1], shadowsHsl[2], shW],
        [midsHsl[0], midsHsl[1], midsHsl[2], midW],
        [highsHsl[0], highsHsl[1], highsHsl[2], hiW],
      ];
      let cr = 0;
      let cg = 0;
      let cb = 0;
      let wsum = 0;
      tiers.forEach(([hue, sat, light, weight]) => {
        if (weight <= 0.001 || (sat === 0 && light === 0)) return;
        const [tr, tg, tb] = hslToRgb(hue, clamp(sat, 0, 1), 0.5);
        cr += (tr - 128) * weight;
        cg += (tg - 128) * weight;
        cb += (tb - 128) * weight;
        wsum += weight;
      });
      if (wsum > 0) {
        const amt = (recipe.grade.blending / 100) * 0.9;
        r += (cr / wsum) * amt * 0.5;
        g += (cg / wsum) * amt * 0.5;
        b += (cb / wsum) * amt * 0.5;
        const lshift = (shadowsHsl[2] * shW + midsHsl[2] * midW + highsHsl[2] * hiW) * 150;
        r += lshift * 0.5;
        g += lshift * 0.5;
        b += lshift * 0.5;
      }
    }

    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }

  if (lookActive || adjustActive) {
    applyColorPipeline(img, recipe.adjust, lookActive ? lookRuntime(recipe.look, recipe.lookIntensity) : undefined);
  }
}

/** Converte o nome curto de efeito em parâmetros para o motor de pixel. */
export function photoEffectParams(id: string, amount: number): Record<string, number> {
  const a = amount;
  switch (id) {
    case "pixelate":
      return { size: 2 + (a / 100) * 40 };
    case "posterize":
      return { levels: Math.max(2, 12 - Math.round((a / 100) * 8)) };
    case "halftone":
      return { size: 3 + (a / 100) * 10, angle: 45 };
    case "dither":
      return { size: 1 + Math.round((a / 100) * 3) };
    case "wave":
      return { amount: a, freq: 18 };
    case "bulge":
    case "fisheye":
    case "twirl":
      return { amount: (a / 100) * 100, radius: 45 };
    case "mirror":
      return { mode: 0 };
    case "kaleidoscope":
      return { segments: 6, rotate: 0 };
    case "motion_blur":
      return { amount: a, angle: 0 };
    case "tilt_shift":
      return { amount: a, center: 50 };
    case "thermal":
    case "xray":
    case "hologram":
    case "watercolor":
    case "neon_edge":
    case "sketch":
    case "old_film":
    case "vhs":
    case "crt":
    case "datamosh":
    case "upscale":
    case "glow_neon":
      return { amount: a, hue: 300, glow: a };
    case "oil":
      return { radius: 1 + Math.round((a / 100) * 4), amount: a };
    case "cartoon":
      return { levels: 6, edge: a };
    case "comic":
      return { dot: 5, ink: a };
    case "threshold":
      return { level: 128 };
    case "ascii":
      return { size: 9, color: 1 };
    case "sharpen_pro":
    case "denoise":
    case "clarity":
    case "bloom":
    case "rgb_split":
    case "slice":
    case "mirror_kaleido_tile":
    case "emboss":
      return { amount: a, count: 10, cols: 2, rows: 2 };
    default:
      return { amount: a };
  }
}

/* ══════════════ geometria ══════════════ */

export function cropCanvas(src: HTMLCanvasElement, crop: ImageRecipe["crop"]): HTMLCanvasElement {
  const x = Math.round(crop.x * src.width);
  const y = Math.round(crop.y * src.height);
  const w = Math.max(2, Math.round(crop.w * src.width));
  const h = Math.max(2, Math.round(crop.h * src.height));
  if (x === 0 && y === 0 && w === src.width && h === src.height) return src;
  const out = createCanvas(w, h);
  ctx2d(out).drawImage(src, x, y, w, h, 0, 0, w, h);
  return out;
}

export function rotateCanvas(src: HTMLCanvasElement, degrees: number, flipH: boolean, flipV: boolean): HTMLCanvasElement {
  const rad = (degrees * Math.PI) / 180;
  const w = src.width;
  const h = src.height;
  const scale = Math.abs(Math.cos(rad)) * w + Math.abs(Math.sin(rad)) * h;
  const scaleY = Math.abs(Math.sin(rad)) * w + Math.abs(Math.cos(rad)) * h;
  const out = createCanvas(scale, scaleY);
  const ctx = ctx2d(out);
  ctx.translate(scale / 2, scaleY / 2);
  ctx.rotate(rad);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(src, -w / 2, -h / 2);
  return out;
}

/** Corrige perspectiva por 4 cantos (keystone). */
export function perspectiveCanvas(src: HTMLCanvasElement, corners: ImageRecipe["perspective"]): HTMLCanvasElement {
  const out = createCanvas(src.width, src.height);
  const ctx = ctx2d(out);
  const w = src.width;
  const h = src.height;
  const dx = corners.tl[0] * w;
  const dy = corners.tl[1] * h;
  const dx2 = corners.tr[0] * w;
  const dy2 = corners.tr[1] * h;
  const dy3 = corners.br[1] * h;
  // desenha em tiras verticais interpolando as bordas (warp aproximado)
  const strips = 160;
  for (let i = 0; i < strips; i++) {
    const p0 = i / strips;
    const p1 = (i + 1) / strips;
    const x0 = p0 * w;
    const x1 = p1 * w;
    const topL = [dx * (1 - p0), dy * (1 - p0)];
    const botL = [corners.bl[0] * w * (1 - p0), h + corners.bl[1] * h * (1 - p0)];
    const topR = [w + dx2 * p0, dy2 * p0];
    void topL;
    void botL;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(topR[0] - (topR[0] - x0 - dx * (1 - p0)) * 0, topR[1]);
    ctx.lineTo(x0, topR[1] * 0 + dy2 * p0);
    ctx.lineTo(x1, dy2 * p1);
    ctx.lineTo(x1, h + dy3 * p1);
    ctx.lineTo(x0, h + dy3 * p0);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(src, 0, 0, w, h, 0, 0, w, h);
    ctx.restore();
  }
  return out;
}

export function resizeCanvas(src: HTMLCanvasElement, w: number, h: number, smooth = true): HTMLCanvasElement {
  if (src.width === w && src.height === h) return src;
  const out = createCanvas(w, h);
  const ctx = ctx2d(out);
  ctx.imageSmoothingEnabled = smooth;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, w, h);
  return out;
}

/* ══════════════ remoção de fundo e inpainting ══════════════ */

export interface BgOptions {
  mode: "auto" | "chroma" | "luma";
  color: string;
  tolerance: number;
  feather: number;
  edgeShrink: number;
}

/** Recorte de fundo: chroma por cor escolhida ou automático pelas bordas da imagem. */
export function removeBackground(src: HTMLCanvasElement, opts: BgOptions): HTMLCanvasElement {
  const out = createCanvas(src.width, src.height);
  const ctx = ctx2d(out);
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, out.width, out.height);
  const d = img.data;
  const targets: [number, number, number][] = [];
  if (opts.mode === "chroma") {
    targets.push(hexToRgb(opts.color));
  } else {
    // amostra as quatro bordas para descobrir a cor de fundo dominante
    const w = out.width;
    const h = out.height;
    const samples: [number, number][] = [];
    for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 40))) {
      samples.push([x, 0], [x, h - 1]);
    }
    for (let y = 0; y < h; y += Math.max(1, Math.floor(h / 40))) {
      samples.push([0, y], [w - 1, y]);
    }
    const clusters = new Map<string, { n: number; r: number; g: number; b: number }>();
    samples.forEach(([x, y]) => {
      const i = (y * w + x) * 4;
      const key = `${d[i] >> 4}-${d[i + 1] >> 4}-${d[i + 2] >> 4}`;
      const cur = clusters.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
      cur.n++;
      cur.r += d[i];
      cur.g += d[i + 1];
      cur.b += d[i + 2];
      clusters.set(key, cur);
    });
    Array.from(clusters.values())
      .sort((a, b) => b.n - a.n)
      .slice(0, opts.mode === "auto" ? 2 : 1)
      .forEach((c) => targets.push([c.r / c.n, c.g / c.n, c.b / c.n]));
  }
  const tol = (opts.tolerance / 100) * 260;
  const soft = Math.max(4, (opts.feather / 100) * 120);

  for (let i = 0; i < d.length; i += 4) {
    let minDist = Infinity;
    for (const [tr, tg, tb] of targets) {
      const dist = Math.sqrt((d[i] - tr) ** 2 + (d[i + 1] - tg) ** 2 + (d[i + 2] - tb) ** 2);
      if (dist < minDist) minDist = dist;
    }
    if (minDist < tol) d[i + 3] = 0;
    else if (minDist < tol + soft) d[i + 3] = Math.round(((minDist - tol) / soft) * 255);
  }

  // limpeza de pixels isolados (remove halo de 1 pixel)
  const shrink = opts.edgeShrink;
  if (shrink > 0) {
    const copy = new Uint8ClampedArray(d);
    const w = img.width;
    const h = img.height;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        if (copy[i + 3] < 128) continue;
        let neighbors = 0;
        for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          if (copy[((y + oy) * w + (x + ox)) * 4 + 3] < 128) neighbors++;
        }
        if (neighbors >= shrink) d[i + 3] = Math.max(0, d[i + 3] - 190);
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

/** Preenchimento por difusão: remove objetos e reconstrói a área com a vizinhança. */
export function inpaintMask(canvas: HTMLCanvasElement, mask: Uint8ClampedArray, iterations = 26): HTMLCanvasElement {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = ctx2d(canvas);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const known = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) known[i] = mask[i] > 90 ? 0 : 1;
  const work = new Float32Array(w * h * 4);
  for (let i = 0; i < w * h * 4; i++) work[i] = d[i];
  for (let it = 0; it < iterations; it++) {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        if (known[idx]) continue;
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 0;
        let n = 0;
        for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const ni = (y + oy) * w + (x + ox);
          if (!known[ni]) continue;
          const p = ni * 4;
          r += work[p];
          g += work[p + 1];
          b += work[p + 2];
          a += work[p + 3];
          n++;
        }
        if (!n) continue;
        const p = idx * 4;
        work[p] = r / n;
        work[p + 1] = g / n;
        work[p + 2] = b / n;
        work[p + 3] = a / n;
      }
    }
    // atualiza a fronteira
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        if (known[idx]) continue;
        let all = true;
        for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          if (!known[(y + oy) * w + (x + ox)] && mask[(y + oy) * w + (x + ox)] > 90) all = false;
        }
        if (all) known[idx] = 1;
      }
    }
  }
  for (let i = 0; i < w * h; i++) {
    if (mask[i] > 90) {
      const p = i * 4;
      d[p] = work[p];
      d[p + 1] = work[p + 1];
      d[p + 2] = work[p + 2];
      d[p + 3] = Math.max(d[p + 3], work[p + 3]);
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/* ══════════════ pincéis e retoque ══════════════ */

export function applyRasterOp(canvas: HTMLCanvasElement, op: RasterOp) {
  const ctx = ctx2d(canvas);
  const w = canvas.width;
  const h = canvas.height;
  const radius = Math.max(3, op.size);
  switch (op.tool) {
    case "erase":
    case "heal": {
      const mask = new Uint8ClampedArray(w * h);
      const blur = op.tool === "heal";
      op.points.forEach((p) => {
        const cx = p.x * w;
        const cy = p.y * h;
        for (let y = Math.max(0, cy - radius); y < Math.min(h, cy + radius); y++) {
          for (let x = Math.max(0, cx - radius); x < Math.min(w, cx + radius); x++) {
            const dist = Math.hypot(x - cx, y - cy);
            if (dist <= radius) mask[Math.floor(y) * w + Math.floor(x)] = Math.max(mask[Math.floor(y) * w + Math.floor(x)], 255 * (1 - dist / radius));
          }
        }
      });
      inpaintMask(canvas, mask, blur ? 12 : 30);
      break;
    }
    case "clone": {
      const src = op.source ?? { x: 0.2, y: 0.2 };
      const sx = src.x * w;
      const sy = src.y * h;
      const img = ctx.getImageData(0, 0, w, h);
      const copy = new Uint8ClampedArray(img.data);
      op.points.forEach((p, i) => {
        const dx = (op.deltas?.[i]?.dx ?? p.x - (op.points[0]?.x ?? p.x)) * w;
        const dy = (op.deltas?.[i]?.dy ?? p.y - (op.points[0]?.y ?? p.y)) * h;
        const cx = p.x * w;
        const cy = p.y * h;
        for (let y = Math.max(0, cy - radius); y < Math.min(h, cy + radius); y++) {
          for (let x = Math.max(0, cx - radius); x < Math.min(w, cx + radius); x++) {
            const dist = Math.hypot(x - cx, y - cy);
            if (dist > radius) continue;
            const sxi = clamp(Math.round(sx + (x - p.x * w) + dx), 0, w - 1);
            const syi = clamp(Math.round(sy + (y - p.y * h) + dy), 0, h - 1);
            const si = (syi * w + sxi) * 4;
            const di = (Math.floor(y) * w + Math.floor(x)) * 4;
            const alpha = (1 - dist / radius) * (op.strength / 100);
            img.data[di] = copy[si] * alpha + img.data[di] * (1 - alpha);
            img.data[di + 1] = copy[si + 1] * alpha + img.data[di + 1] * (1 - alpha);
            img.data[di + 2] = copy[si + 2] * alpha + img.data[di + 2] * (1 - alpha);
          }
        }
      });
      ctx.putImageData(img, 0, 0);
      break;
    }
    case "smooth":
    case "teeth":
    case "redeye":
    case "dodge":
    case "burn": {
      const img = ctx.getImageData(0, 0, w, h);
      const copy = new Uint8ClampedArray(img.data);
      const local = createCanvas(radius * 2, radius * 2);
      const lctx = ctx2d(local);
      op.points.forEach((p) => {
        const cx = p.x * w;
        const cy = p.y * h;
        const x0 = clamp(Math.round(cx - radius), 0, w - 1);
        const y0 = clamp(Math.round(cy - radius), 0, h - 1);
        const x1 = clamp(Math.round(cx + radius), 0, w - 1);
        const y1 = clamp(Math.round(cy + radius), 0, h - 1);
        const bw = x1 - x0;
        const bh = y1 - y0;
        if (bw < 2 || bh < 2) return;
        lctx.clearRect(0, 0, local.width, local.height);
        lctx.drawImage(canvas, x0, y0, bw, bh, 0, 0, bw, bh);
        const patch = lctx.getImageData(0, 0, bw, bh);
        const pd = patch.data;
        if (op.tool === "smooth" || op.tool === "teeth") {
          applyPixelEffect("denoise", patch, { amount: op.strength }, 0, 3);
        }
        for (let y = 0; y < bh; y++) {
          for (let x = 0; x < bw; x++) {
            const dist = Math.hypot(x0 + x - cx, y0 + y - cy);
            if (dist > radius) continue;
            const falloff = (1 - dist / radius) * (op.strength / 100);
            const pi = (y * bw + x) * 4;
            const di = ((y0 + y) * w + (x0 + x)) * 4;
            if (op.tool === "teeth") {
              const r = pd[pi];
              const g = pd[pi + 1] * 1.06;
              const b = pd[pi + 2];
              const target = Math.min(255, Math.max(r, g, b) * 1.15);
              img.data[di] += (target - img.data[di]) * falloff;
              img.data[di + 1] += (target - img.data[di + 1]) * falloff;
              img.data[di + 2] += (target - img.data[di + 2]) * falloff;
            } else if (op.tool === "redeye") {
              const r = copy[di];
              const g = copy[di + 1];
              const b = copy[di + 2];
              if (r > g * 1.35 && r > b * 1.35) {
                const v = (g + b) / 2;
                img.data[di] = img.data[di] * (1 - falloff) + v * falloff;
              }
            } else if (op.tool === "dodge") {
              img.data[di] = clamp(img.data[di] + 90 * falloff, 0, 255);
              img.data[di + 1] = clamp(img.data[di + 1] + 90 * falloff, 0, 255);
              img.data[di + 2] = clamp(img.data[di + 2] + 90 * falloff, 0, 255);
            } else if (op.tool === "burn") {
              img.data[di] = clamp(img.data[di] - 90 * falloff, 0, 255);
              img.data[di + 1] = clamp(img.data[di + 1] - 90 * falloff, 0, 255);
              img.data[di + 2] = clamp(img.data[di + 2] - 90 * falloff, 0, 255);
            } else {
              img.data[di] += (pd[pi] - img.data[di]) * falloff;
              img.data[di + 1] += (pd[pi + 1] - img.data[di + 1]) * falloff;
              img.data[di + 2] += (pd[pi + 2] - img.data[di + 2]) * falloff;
            }
          }
        }
      });
      ctx.putImageData(img, 0, 0);
      break;
    }
    case "liquify_push":
    case "liquify_pinch":
    case "liquify_bulge": {
      const img = ctx.getImageData(0, 0, w, h);
      const copy = new Uint8ClampedArray(img.data);
      const strength = op.strength / 100;
      op.points.forEach((p, i) => {
        const cx = p.x * w;
        const cy = p.y * h;
        const move = op.deltas?.[i] ?? { dx: 0, dy: 0 };
        for (let y = Math.max(0, cy - radius); y < Math.min(h, cy + radius); y++) {
          for (let x = Math.max(0, cx - radius); x < Math.min(w, cx + radius); x++) {
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.hypot(dx, dy);
            if (dist > radius) continue;
            const falloff = (1 - dist / radius) ** 2;
            let sx = x;
            let sy = y;
            if (op.tool === "liquify_push") {
              sx = x - move.dx * w * falloff * strength * 4;
              sy = y - move.dy * h * falloff * strength * 4;
            } else {
              const dir = op.tool === "liquify_pinch" ? 1 : -1;
              const k = 1 + dir * strength * falloff * 0.6;
              sx = cx + dx * k;
              sy = cy + dy * k;
            }
            const sxi = clamp(Math.round(sx), 0, w - 1);
            const syi = clamp(Math.round(sy), 0, h - 1);
            const si = (syi * w + sxi) * 4;
            const di = (Math.floor(y) * w + Math.floor(x)) * 4;
            img.data[di] = copy[si];
            img.data[di + 1] = copy[si + 1];
            img.data[di + 2] = copy[si + 2];
            img.data[di + 3] = copy[si + 3];
          }
        }
      });
      ctx.putImageData(img, 0, 0);
      break;
    }
  }
  return canvas;
}

/* ══════════════ máscaras locais ══════════════ */

function maskValue(op: MaskOp, x: number, y: number, w: number, h: number) {
  if (op.kind === "point") {
    const dist = Math.hypot(x * w - op.x * w, y * h - op.y * h);
    return clamp(1 - dist / (op.radius * Math.max(w, h)), 0, 1);
  }
  if (op.kind === "radial") {
    const dist = Math.hypot(x - op.x, y - op.y);
    return clamp(1 - dist / Math.max(0.01, op.radius), 0, 1) ** (op.feather / 40 + 0.4);
  }
  const ang = (op.angle * Math.PI) / 180;
  const proj = (x - op.x) * Math.cos(ang) + (y - op.y) * Math.sin(ang);
  const t = clamp(proj / Math.max(0.01, op.radius) + 0.5, 0, 1);
  const f = clamp(op.feather / 100, 0, 1);
  const v = clamp((t - (0.5 - f / 2)) / Math.max(0.001, f), 0, 1);
  return v;
}

export function applyLocalMasks(img: ImageData, masks: MaskOp[]) {
  if (!masks.length) return;
  const { width: w, height: h, data } = img;
  masks.forEach((m) => {
    const exposure = m.exposure / 100;
    const brightness = (m.adjust.brightness ?? 0) / 100;
    const contrast = (m.adjust.contrast ?? 0) / 100;
    const saturation = (m.adjust.saturation ?? 0) / 100;
    const temperature = (m.adjust.temperature ?? 0) / 100;
    const shadows = (m.adjust.shadows ?? 0) / 100;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let msk = maskValue(m, x / w, y / h, w, h);
        if (m.invert) msk = 1 - msk;
        if (msk <= 0.002) continue;
        const i = (y * w + x) * 4;
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        if (exposure !== 0) {
          const f = 1 + exposure * msk;
          r *= f;
          g *= f;
          b *= f;
        }
        if (brightness !== 0) {
          r += brightness * 90 * msk;
          g += brightness * 90 * msk;
          b += brightness * 90 * msk;
        }
        if (contrast !== 0) {
          const f = 1 + contrast * msk;
          r = (r - 128) * f + 128;
          g = (g - 128) * f + 128;
          b = (b - 128) * f + 128;
        }
        if (saturation !== 0) {
          const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const f = 1 + saturation * msk;
          r = gray + (r - gray) * f;
          g = gray + (g - gray) * f;
          b = gray + (b - gray) * f;
        }
        if (temperature !== 0) {
          r += temperature * 45 * msk;
          b -= temperature * 45 * msk;
        }
        if (shadows !== 0) {
          const lum = (r + g + b) / 765;
          const wsh = clamp(1 - lum * 2, 0, 1) * msk;
          r += shadows * 70 * wsh;
          g += shadows * 70 * wsh;
          b += shadows * 70 * wsh;
        }
        data[i] = clamp(r, 0, 255);
        data[i + 1] = clamp(g, 0, 255);
        data[i + 2] = clamp(b, 0, 255);
      }
    }
  });
}

/* ══════════════ camadas (overlays) ══════════════ */

export async function drawOverlays(canvas: HTMLCanvasElement, overlays: Overlay[]) {
  const ctx = ctx2d(canvas);
  for (const o of overlays) {
    ctx.save();
    ctx.globalAlpha = o.opacity;
    ctx.globalCompositeOperation = (o.blend || "normal") as GlobalCompositeOperation;
    ctx.translate(o.x * canvas.width, o.y * canvas.height);
    ctx.rotate((o.rotate * Math.PI) / 180);
    ctx.scale(o.scale, o.scale);
    if (o.type === "text") {
      const size = (o.size / 1000) * canvas.width;
      ctx.font = `${o.uppercase ? "" : ""}${o.weight} ${size}px "${o.font}", sans-serif`;
      ctx.textAlign = o.align;
      ctx.textBaseline = "middle";
      const text = o.uppercase ? o.text.toUpperCase() : o.text;
      const lines = text.split("\n");
      const lineH = size * 1.2;
      const width = Math.max(...lines.map((l) => ctx.measureText(l).width), 1);
      if (o.bg && o.bg !== "transparent") {
        ctx.save();
        ctx.globalAlpha = o.bgOpacity;
        ctx.fillStyle = o.bg;
        const pad = size * 0.3;
        const boxW = width + pad * 2;
        const boxH = lines.length * lineH + pad;
        const bx = o.align === "center" ? -boxW / 2 : o.align === "right" ? -boxW : 0;
        ctx.beginPath();
        ctx.roundRect(bx, -boxH / 2, boxW, boxH, o.radius);
        ctx.fill();
        ctx.restore();
      }
      lines.forEach((line, i) => {
        const y = -((lines.length - 1) * lineH) / 2 + i * lineH;
        if (o.shadow) {
          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.6)";
          ctx.shadowBlur = size * 0.18;
          ctx.fillStyle = o.color;
          ctx.fillText(line, 0, y);
          ctx.restore();
        }
        if (o.strokeWidth > 0) {
          ctx.lineWidth = (o.strokeWidth / 1000) * canvas.width * 2;
          ctx.strokeStyle = o.strokeColor;
          ctx.lineJoin = "round";
          ctx.strokeText(line, 0, y);
        }
        ctx.fillStyle = o.color;
        ctx.fillText(line, 0, y);
      });
    } else if (o.type === "shape") {
      const size = (o.strokeWidth > 0 ? 1 : 1) * canvas.width * 0.24;
      ctx.fillStyle = o.fill;
      ctx.strokeStyle = o.stroke;
      ctx.lineWidth = o.strokeWidth;
      ctx.beginPath();
      switch (o.shape) {
        case "rect":
          ctx.roundRect(-size / 2, -size / 3, size, (size * 2) / 3, 12);
          break;
        case "ellipse":
          ctx.ellipse(0, 0, size / 2, size / 3, 0, 0, Math.PI * 2);
          break;
        case "triangle":
          ctx.moveTo(0, -size / 2);
          ctx.lineTo(size / 2, size / 2);
          ctx.lineTo(-size / 2, size / 2);
          ctx.closePath();
          break;
        case "star":
          for (let i = 0; i < 10; i++) {
            const rr = i % 2 === 0 ? size / 2 : size / 5;
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
            const px = Math.cos(a) * rr;
            const py = Math.sin(a) * rr;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          break;
        case "arrow":
          ctx.moveTo(-size / 2, 0);
          ctx.lineTo(size / 4, 0);
          ctx.lineTo(size / 4, -size / 8);
          ctx.lineTo(size / 2, 0);
          ctx.lineTo(size / 4, size / 8);
          ctx.lineTo(size / 4, 0);
          ctx.closePath();
          break;
        case "line":
          ctx.rect(-size / 2, -2, size, 4);
          break;
        case "ring":
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          break;
        default:
          ctx.roundRect(-size / 2, -size / 3, size, (size * 2) / 3, 10);
      }
      if (o.shape === "ring") {
        ctx.lineWidth = Math.max(4, size * 0.12);
        ctx.strokeStyle = o.fill;
        ctx.stroke();
      } else {
        ctx.fill();
        if (o.strokeWidth > 0) ctx.stroke();
      }
    } else if (o.type === "sticker") {
      const size = (o.size / 1000) * canvas.width;
      ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(o.emoji, 0, 0);
    } else {
      const img = new Image();
      img.src = o.src;
      await new Promise<void>((resolve) => {
        if (img.complete) resolve();
        else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }
      });
      const w = o.width;
      const h = o.height;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    }
    ctx.restore();
  }
}

/* ══════════════ molduras e marca d'água ══════════════ */

export function applyFrame(canvas: HTMLCanvasElement, frame: FrameCfg, watermark: ImageRecipe["watermark"]): HTMLCanvasElement {
  const w = canvas.width;
  const h = canvas.height;
  if (frame.id === "none" && !watermark.enabled) return canvas;
  const out = createCanvas(w, h);
  const ctx = ctx2d(out);
  ctx.drawImage(canvas, 0, 0);
  switch (frame.id) {
    case "rounded": {
      const r = (frame.radius / 100) * Math.min(w, h) * 0.3;
      ctx.save();
      ctx.globalCompositeOperation = "destination-in";
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, r);
      ctx.fillStyle = "#000";
      ctx.fill();
      ctx.restore();
      break;
    }
    case "polaroid": {
      const border = Math.round(w * 0.035);
      const bottom = Math.round(border * 2.6);
      const canv = createCanvas(w + border * 2, h + border + bottom);
      const cctx = ctx2d(canv);
      cctx.fillStyle = frame.color;
      cctx.fillRect(0, 0, canv.width, canv.height);
      cctx.drawImage(canvas, border, border, w, h);
      cctx.fillStyle = "rgba(0,0,0,0.35)";
      cctx.font = `${Math.round(border * 0.7)}px "Space Grotesk", sans-serif`;
      cctx.textAlign = "center";
      cctx.fillText("editzz", canv.width / 2, h + border + bottom * 0.65);
      return cctx.canvas;
    }
    case "film": {
      const band = Math.round(h * 0.075);
      ctx.fillStyle = "#0b0b12";
      ctx.fillRect(0, 0, w, band);
      ctx.fillRect(0, h - band, w, band);
      ctx.fillStyle = frame.color;
      const holes = Math.max(6, Math.round(w / 90));
      for (let i = 0; i < holes; i++) {
        const x = (i + 0.5) * (w / holes);
        ctx.roundRect ? ctx.roundRect(x - 10, band * 0.28, 20, band * 0.44, 4) : ctx.rect(x - 10, band * 0.28, 20, band * 0.44);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x - 10, h - band * 0.72, 20, band * 0.44, 4) : ctx.rect(x - 10, h - band * 0.72, 20, band * 0.44);
        ctx.fill();
      }
      break;
    }
    case "double": {
      const bw = Math.max(3, Math.round(Math.min(w, h) * 0.012 * frame.width));
      ctx.strokeStyle = frame.color;
      ctx.lineWidth = bw;
      ctx.strokeRect(bw / 2, bw / 2, w - bw, h - bw);
      ctx.strokeRect(bw * 2.6, bw * 2.6, w - bw * 5.2, h - bw * 5.2);
      break;
    }
    case "color": {
      ctx.strokeStyle = frame.color;
      ctx.lineWidth = (frame.width / 100) * Math.min(w, h) * 0.16;
      ctx.strokeRect(0, 0, w, h);
      break;
    }
    case "shadow": {
      const pad = Math.round(Math.min(w, h) * 0.06);
      const canv = createCanvas(w + pad * 2, h + pad * 2);
      const cctx = ctx2d(canv);
      cctx.fillStyle = "#0b0b12";
      cctx.fillRect(0, 0, canv.width, canv.height);
      cctx.save();
      cctx.shadowColor = "rgba(0,0,0,0.75)";
      cctx.shadowBlur = pad * 1.2;
      cctx.drawImage(canvas, pad, pad);
      cctx.restore();
      return canv;
    }
    case "phone": {
      const bw = Math.round(w * 0.06);
      const bh = Math.round(h * 0.035);
      const canv = createCanvas(w + bw * 2, h + bh * 2);
      const cctx = ctx2d(canv);
      cctx.fillStyle = "#111118";
      cctx.beginPath();
      cctx.roundRect(0, 0, canv.width, canv.height, bh * 1.6);
      cctx.fill();
      cctx.drawImage(canvas, bw, bh, w, h);
      cctx.fillStyle = "rgba(255,255,255,0.25)";
      cctx.beginPath();
      cctx.roundRect(canv.width / 2 - 30, bh * 0.4, 60, bh * 0.22, 6);
      cctx.fill();
      return canv;
    }
    default:
      break;
  }
  if (watermark.enabled) {
    ctx.save();
    ctx.globalAlpha = watermark.opacity;
    ctx.fillStyle = watermark.color;
    const size = (watermark.size / 1000) * w * 0.6;
    ctx.font = `600 ${size}px "Space Grotesk", sans-serif`;
    const pad = w * 0.03;
    ctx.textBaseline = watermark.pos.startsWith("t") ? "top" : "bottom";
    ctx.textAlign = watermark.pos.endsWith("l") ? "left" : watermark.pos.endsWith("r") ? "right" : "center";
    const x = watermark.pos.endsWith("l") ? pad : watermark.pos.endsWith("r") ? w - pad : w / 2;
    const y = watermark.pos.startsWith("t") ? pad : h - pad;
    ctx.fillText(watermark.text, x, y);
    ctx.restore();
  }
  return out;
}

/* ══════════════ pipeline completo ══════════════ */

export interface PipelineOptions {
  maxSize?: number;
  skipFrame?: boolean;
}

export async function renderImage(
  source: HTMLImageElement | HTMLCanvasElement,
  recipe: ImageRecipe,
  ops: RasterOp[],
  masks: MaskOp[],
  overlays: Overlay[],
  opts: PipelineOptions = {}
): Promise<HTMLCanvasElement> {
  const srcW = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const srcH = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  let canvas = createCanvas(srcW, srcH);
  ctx2d(canvas).drawImage(source, 0, 0);
  void ctx2d(canvas).imageSmoothingQuality;

  if (recipe.rotate90 || recipe.flipH || recipe.flipV) canvas = rotateCanvas(canvas, recipe.rotate90, recipe.flipH, recipe.flipV);
  if (recipe.straighten) canvas = rotateCanvas(canvas, recipe.straighten, false, false);
  if (recipe.perspective.tl[0] || recipe.perspective.tr[0] || recipe.perspective.br[0]) canvas = perspectiveCanvas(canvas, recipe.perspective);
  canvas = cropCanvas(canvas, recipe.crop);

  const max = opts.maxSize ?? 0;
  if (max > 0 && Math.max(canvas.width, canvas.height) > max) {
    const ratio = max / Math.max(canvas.width, canvas.height);
    canvas = resizeCanvas(canvas, Math.round(canvas.width * ratio), Math.round(canvas.height * ratio));
  } else if (recipe.resize.w && recipe.resize.h && (recipe.resize.w < srcW || recipe.resize.h < srcH)) {
    canvas = resizeCanvas(canvas, recipe.resize.w, recipe.resize.h);
  }

  ops.forEach((op) => applyRasterOp(canvas, op));

  const needsColor =
    Object.values(recipe.adjust).some((v) => Math.abs(v) > 0.01) ||
    (["rgb", "r", "g", "b"] as CurveChannel[]).some((c) => recipe.curves[c].length > 0) ||
    recipe.levels.black > 0 ||
    recipe.levels.white < 255 ||
    Math.abs(recipe.levels.gamma - 1) > 0.01 ||
    HSL_BANDS.some((b) => recipe.hsl[b].h || recipe.hsl[b].s || recipe.hsl[b].l) ||
    recipe.look !== "none" ||
    recipe.effects.length > 0 ||
    masks.length > 0;

  if (needsColor) {
    const ctx = ctx2d(canvas);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyImageColor(img, recipe);
    for (const eff of recipe.effects) {
      applyPixelEffect(eff.id, img, photoEffectParams(eff.id, eff.amount), 0, 5);
    }
    applyLocalMasks(img, masks);
    ctx.putImageData(img, 0, 0);
    if (recipe.adjust.vignette !== 0 || recipe.adjust.grain > 0 || recipe.adjust.bloom > 0) {
      const img2 = ctx.getImageData(0, 0, canvas.width, canvas.height);
      applyColorPipeline(img2, { ...recipe.adjust, clarity: 0, sharpen: 0, blur: 0, chromatic: 0 });
      ctx.putImageData(img2, 0, 0);
    }
  }

  if (overlays.length) await drawOverlays(canvas, overlays);
  if (!opts.skipFrame) canvas = applyFrame(canvas, recipe.frame, recipe.watermark);
  return canvas;
}

/* ══════════════ utilitários criativos ══════════════ */

export function collage(images: HTMLCanvasElement[], cols: number, gap: number, bg: string, radius = 10): HTMLCanvasElement {
  const cellW = Math.max(...images.map((i) => i.width));
  const cellH = Math.max(...images.map((i) => i.height));
  const rows = Math.ceil(images.length / cols);
  const out = createCanvas(cols * cellW + gap * (cols + 1), rows * cellH + gap * (rows + 1));
  const ctx = ctx2d(out);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, out.width, out.height);
  images.forEach((img, i) => {
    const cx = gap + (i % cols) * (cellW + gap);
    const cy = gap + Math.floor(i / cols) * (cellH + gap);
    const target = resizeCanvas(img, cellW, cellH);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cx, cy, cellW, cellH, radius);
    ctx.clip();
    ctx.drawImage(target, cx, cy);
    ctx.restore();
  });
  return out;
}

export function pixelArt(src: HTMLCanvasElement, pixelSize: number, colors: number): HTMLCanvasElement {
  const small = resizeCanvas(src, Math.max(2, Math.round(src.width / pixelSize)), Math.max(2, Math.round(src.height / pixelSize)), false);
  const ctx = ctx2d(small);
  const img = ctx.getImageData(0, 0, small.width, small.height);
  const levels = Math.max(2, Math.round(Math.cbrt(colors)));
  const step = 255 / (levels - 1);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.round(d[i] / step) * step;
    d[i + 1] = Math.round(d[i + 1] / step) * step;
    d[i + 2] = Math.round(d[i + 2] / step) * step;
  }
  ctx.putImageData(img, 0, 0);
  return resizeCanvas(small, src.width, src.height, false);
}

export function asciiArt(src: HTMLCanvasElement, cols = 120): string {
  const ratio = src.height / src.width;
  const rows = Math.max(4, Math.round(cols * ratio * 0.5));
  const small = resizeCanvas(src, cols, rows);
  const data = ctx2d(small).getImageData(0, 0, cols, rows).data;
  const chars = "@%#*+=-:. ";
  let out = "";
  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const l = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      line += chars[Math.min(chars.length - 1, Math.floor(l * chars.length))];
    }
    out += line + "\n";
  }
  return out;
}

export function extractPalette(src: HTMLCanvasElement, count = 8): string[] {
  const small = resizeCanvas(src, 80, 80);
  const data = ctx2d(small).getImageData(0, 0, 80, 80).data;
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const key = `${data[i] >> 4}-${data[i + 1] >> 4}-${data[i + 2] >> 4}`;
    const cur = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    cur.n++;
    cur.r += data[i];
    cur.g += data[i + 1];
    cur.b += data[i + 2];
    buckets.set(key, cur);
  }
  return Array.from(buckets.values())
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map((v) => rgbToHex(v.r / v.n, v.g / v.n, v.b / v.n));
}

export function histogram(src: HTMLCanvasElement): { r: number[]; g: number[]; b: number[]; l: number[] } {
  const data = ctx2d(src).getImageData(0, 0, src.width, src.height).data;
  const r = new Array(256).fill(0) as number[];
  const g = new Array(256).fill(0) as number[];
  const b = new Array(256).fill(0) as number[];
  const l = new Array(256).fill(0) as number[];
  for (let i = 0; i < data.length; i += 4) {
    r[data[i]]++;
    g[data[i + 1]]++;
    b[data[i + 2]]++;
    l[Math.round((data[i] + data[i + 1] + data[i + 2]) / 3)]++;
  }
  return { r, g, b, l };
}

/** Correção automática: níveis + balanço de branco por histograma. */
export function autoEnhance(src: HTMLCanvasElement): Partial<ImageRecipe> {
  const data = ctx2d(src).getImageData(0, 0, src.width, src.height).data;
  const hist = new Array(256).fill(0) as number[];
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const l = Math.round((data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114));
    hist[l]++;
    sr += data[i];
    sg += data[i + 1];
    sb += data[i + 2];
    n++;
  }
  const total = n;
  let acc = 0;
  let low = 0;
  let high = 255;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc > total * 0.005) {
      low = i;
      break;
    }
  }
  acc = 0;
  for (let i = 255; i >= 0; i--) {
    acc += hist[i];
    if (acc > total * 0.005) {
      high = i;
      break;
    }
  }
  const avgR = sr / n;
  const avgG = sg / n;
  const avgB = sb / n;
  const gray = (avgR + avgG + avgB) / 3;
  const temperature = clamp(((avgR - avgB) / 255) * -180, -60, 60);
  const contrast = clamp(((200 - (high - low)) / 200) * 45, 0, 42);
  const saturation = clamp((Math.abs(avgR - avgG) + Math.abs(avgG - avgB)) / 6, 0, 24);
  return {
    levels: { black: clamp(low - 4, 0, 60), white: clamp(high + 6, 180, 255), gamma: 1.02 },
    adjust: {
      ...defaultRecipe().adjust,
      brightness: clamp(((gray - 128) / 128) * -22, -25, 25),
      contrast,
      saturation,
      temperature,
      shadows: 12,
      highlights: -6,
      vibrance: 10,
    },
  };
}

export function recipeFromLook(lookId: string): Partial<ImageRecipe> {
  const def = LOOKS.find((l) => l.id === lookId);
  if (!def) return {};
  return { look: lookId, lookIntensity: 100, adjust: { ...defaultRecipe().adjust, ...(def.adjust ?? {}) } };
}

export function simulateColorBlindness(src: HTMLCanvasElement, type: "protan" | "deutan" | "tritan"): HTMLCanvasElement {
  const out = createCanvas(src.width, src.height);
  const ctx = ctx2d(out);
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, src.width, src.height);
  const matrices: Record<string, number[]> = {
    protan: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
    deutan: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
    tritan: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
  };
  const m = matrices[type];
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    d[i] = m[0] * r + m[1] * g + m[2] * b;
    d[i + 1] = m[3] * r + m[4] * g + m[5] * b;
    d[i + 2] = m[6] * r + m[7] * g + m[8] * b;
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

/* ══════════════ EXIF ══════════════ */

export interface ExifData {
  make?: string;
  model?: string;
  exposure?: string;
  fNumber?: string;
  iso?: string;
  focal?: string;
  date?: string;
  orientation?: number;
  software?: string;
}

const EXIF_TAGS: Record<number, keyof ExifData> = {
  0x010f: "make",
  0x0110: "model",
  0x0131: "software",
  0x0132: "date",
  0x0112: "orientation",
  0x829a: "exposure",
  0x829d: "fNumber",
  0x8827: "iso",
  0x920a: "focal",
};

export async function readExif(file: File | Blob): Promise<ExifData | null> {
  try {
    const buf = await file.slice(0, 256 * 1024).arrayBuffer();
    const view = new DataView(buf);
    if (view.getUint16(0) !== 0xffd8) return null;
    let offset = 2;
    while (offset < view.byteLength) {
      const marker = view.getUint16(offset);
      if ((marker & 0xff00) !== 0xff00) break;
      const size = view.getUint16(offset + 2);
      if (marker === 0xffe1) {
        const start = offset + 4;
        if (view.getUint32(start) !== 0x45786966) break;
        const tiff = start + 6;
        const little = view.getUint16(tiff) === 0x4949;
        const get16 = (o: number) => view.getUint16(o, little);
        const get32 = (o: number) => view.getUint32(o, little);
        const ifd0 = tiff + get32(tiff + 4);
        const entries = get16(ifd0);
        const out: ExifData = {};
        for (let i = 0; i < entries; i++) {
          const entry = ifd0 + 2 + i * 12;
          const tag = get16(entry);
          const key = EXIF_TAGS[tag];
          if (!key) continue;
          const type = get16(entry + 2);
          const count = get32(entry + 4);
          const valueOffset = entry + 8;
          const readString = (o: number, len: number) => {
            let s = "";
            for (let j = 0; j < len; j++) s += String.fromCharCode(view.getUint8(o + j));
            return s.replace(/\0.*$/, "").trim();
          };
          if (type === 2) {
            const o = count > 4 ? tiff + get32(valueOffset) : valueOffset;
            (out[key] as string) = readString(o, count);
          } else if (type === 3 && key === "orientation") {
            out.orientation = get16(valueOffset);
          } else if (type === 5 && count >= 1) {
            const o = tiff + get32(valueOffset);
            const num = get32(o);
            const den = get32(o + 4);
            const value = den ? num / den : 0;
            (out[key] as string) = key === "exposure" ? `1/${Math.round(1 / Math.max(0.0001, value))}s` : `${value.toFixed(1)}`;
          } else if (type === 4) {
            (out[key] as string) = String(get32(valueOffset));
          }
        }
        return out;
      }
      offset += 2 + size;
    }
  } catch {
    return null;
  }
  return null;
}

export { hexToHsl, rgbToHsl, hslToRgb };
