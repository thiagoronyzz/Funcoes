import { clamp, createCanvas, ctx2d } from "@/lib/utils";
import { detectBeats, energyMap, rmsWindows } from "./audio";
import { pool } from "./media";
import type { MediaAsset, Project } from "./model";
import { clipEnd } from "./model";

/**
 * Análise de mídia do editzz: detecção de cenas, rastreamento de objeto,
 * estabilização, auto-reframe, sugestão de cortes e mapa de energia.
 * Tudo calculado localmente, em quadros reduzidos (160×90) para ser rápido.
 */

const AW = 160;
const AH = 90;

async function grayFrames(
  asset: MediaAsset,
  from: number,
  to: number,
  step: number,
  onProgress?: (p: number) => void
): Promise<{ t: number; gray: Float32Array }[]> {
  const canvas = createCanvas(AW, AH);
  const ctx = ctx2d(canvas);
  const out: { t: number; gray: Float32Array }[] = [];
  const total = Math.max(1, Math.floor((to - from) / step));
  let i = 0;
  for (let t = from; t < to; t += step) {
    const el = await pool.seekVideo(asset, t);
    if (el.readyState >= 2) {
      try {
        ctx.drawImage(el, 0, 0, AW, AH);
        const img = ctx.getImageData(0, 0, AW, AH).data;
        const gray = new Float32Array(AW * AH);
        for (let p = 0, g = 0; p < img.length; p += 4, g++) {
          gray[g] = (img[p] * 0.299 + img[p + 1] * 0.587 + img[p + 2] * 0.114) / 255;
        }
        out.push({ t, gray });
      } catch {
        /* falha pontual */
      }
    }
    i++;
    onProgress?.(i / total);
  }
  return out;
}

function meanAbsDiff(a: Float32Array, b: Float32Array) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

/** Detecta cortes de cena comparando quadros consecutivos. */
export async function detectScenes(
  asset: MediaAsset,
  opts: { from?: number; to?: number; threshold?: number; onProgress?: (p: number) => void } = {}
): Promise<number[]> {
  const from = opts.from ?? 0;
  const to = Math.min(opts.to ?? asset.duration, asset.duration);
  const step = Math.max(1 / 12, (to - from) / 260);
  const frames = await grayFrames(asset, from, to, step, opts.onProgress);
  const threshold = opts.threshold ?? 0.055;
  const cuts: number[] = [];
  for (let i = 1; i < frames.length; i++) {
    const diff = meanAbsDiff(frames[i].gray, frames[i - 1].gray);
    if (diff > threshold && (cuts.length === 0 || frames[i].t - cuts[cuts.length - 1] > 0.35)) cuts.push(frames[i].t);
  }
  return cuts;
}

/** Rastreia uma região (normalizada) e devolve o deslocamento por tempo. */
export async function trackObject(
  asset: MediaAsset,
  region: { x: number; y: number; w: number; h: number },
  opts: { from?: number; to?: number; step?: number; onProgress?: (p: number) => void } = {}
): Promise<{ t: number; x: number; y: number }[]> {
  const from = opts.from ?? 0;
  const to = Math.min(opts.to ?? asset.duration, asset.duration);
  const step = opts.step ?? 1 / 15;
  const frames = await grayFrames(asset, from, to, step, opts.onProgress);
  if (frames.length < 2) return [];
  const px = clamp(Math.round(region.x * AW), 0, AW - 4);
  const py = clamp(Math.round(region.y * AH), 0, AH - 4);
  const pw = clamp(Math.round(region.w * AW), 4, AW - px);
  const ph = clamp(Math.round(region.h * AH), 4, AH - py);
  const template = new Float32Array(pw * ph);
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) template[y * pw + x] = frames[0].gray[(py + y) * AW + px + x];
  const search = 10;
  const path: { t: number; x: number; y: number }[] = [];
  let cx = px + pw / 2;
  let cy = py + ph / 2;
  frames.forEach((f, idx) => {
    let bestScore = Infinity;
    let bestX = cx;
    let bestY = cy;
    if (idx > 0) {
      for (let dy = -search; dy <= search; dy += 2) {
        for (let dx = -search; dx <= search; dx += 2) {
          const sx = Math.round(cx + dx - pw / 2);
          const sy = Math.round(cy + dy - ph / 2);
          if (sx < 0 || sy < 0 || sx + pw > AW || sy + ph > AH) continue;
          let score = 0;
          for (let y = 0; y < ph; y += 2) {
            for (let x = 0; x < pw; x += 2) {
              score += Math.abs(template[y * pw + x] - f.gray[(sy + y) * AW + sx + x]);
            }
          }
          if (score < bestScore) {
            bestScore = score;
            bestX = sx + pw / 2;
            bestY = sy + ph / 2;
          }
        }
      }
      cx = cx * 0.6 + bestX * 0.4;
      cy = cy * 0.6 + bestY * 0.4;
      for (let y = 0; y < ph; y += 3) {
        for (let x = 0; x < pw; x += 3) {
          const sx = clamp(Math.round(cx - pw / 2 + x), 0, AW - 1);
          const sy = clamp(Math.round(cy - ph / 2 + y), 0, AH - 1);
          template[y * pw + x] = template[y * pw + x] * 0.7 + f.gray[sy * AW + sx] * 0.3;
        }
      }
    }
    path.push({ t: f.t, x: cx / AW - 0.5, y: cy / AH - 0.5 });
  });
  return path;
}

/** Estima o movimento global e devolve uma trajetória de correção suavizada. */
export async function computeStabilization(
  asset: MediaAsset,
  opts: { from?: number; to?: number; strength?: number; onProgress?: (p: number) => void } = {}
): Promise<{ t: number; dx: number; dy: number }[]> {
  const from = opts.from ?? 0;
  const to = Math.min(opts.to ?? asset.duration, asset.duration);
  const step = 1 / 15;
  const frames = await grayFrames(asset, from, to, step, opts.onProgress);
  if (frames.length < 3) return [];
  const search = 6;
  const raw: { t: number; dx: number; dy: number }[] = [{ t: frames[0].t, dx: 0, dy: 0 }];
  let accX = 0;
  let accY = 0;
  for (let i = 1; i < frames.length; i++) {
    let bestScore = Infinity;
    let bx = 0;
    let by = 0;
    for (let dy = -search; dy <= search; dy++) {
      for (let dx = -search; dx <= search; dx++) {
        let score = 0;
        for (let y = search; y < AH - search; y += 4) {
          for (let x = search; x < AW - search; x += 4) {
            score += Math.abs(frames[i].gray[y * AW + x] - frames[i - 1].gray[(y + dy) * AW + x + dx]);
          }
        }
        if (score < bestScore) {
          bestScore = score;
          bx = dx;
          by = dy;
        }
      }
    }
    accX += bx;
    accY += by;
    raw.push({ t: frames[i].t, dx: accX, dy: accY });
  }
  // suaviza a trajetória e devolve a correção (suave - bruta) invertida
  const win = 6;
  return raw.map((p, i) => {
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (let j = Math.max(0, i - win); j <= Math.min(raw.length - 1, i + win); j++) {
      sx += raw[j].dx;
      sy += raw[j].dy;
      n++;
    }
    const smx = sx / n;
    const smy = sy / n;
    return { t: p.t, dx: -((smx - p.dx) / AW) * 2.2, dy: -((smy - p.dy) / AH) * 2.2 };
  });
}

/** Saliência aproximada: bordas + saturação + peso central. */
function saliencyColumn(gray: Float32Array): number {
  const cols = 24;
  const bw = Math.floor(AW / cols);
  const scores = new Array(cols).fill(0) as number[];
  for (let y = 1; y < AH - 1; y += 2) {
    for (let x = 1; x < AW - 1; x += 2) {
      const gx = Math.abs(gray[y * AW + x + 1] - gray[y * AW + x - 1]);
      const gy = Math.abs(gray[(y + 1) * AW + x] - gray[(y - 1) * AW + x]);
      const edge = gx + gy;
      const center = 1 - Math.abs(x / AW - 0.5) * 1.1;
      scores[Math.floor(x / bw)] += edge * center;
    }
  }
  let best = 0;
  for (let i = 1; i < cols; i++) if (scores[i] > scores[best]) best = i;
  // média ponderada das 3 melhores colunas vizinhas
  let sum = 0;
  let weight = 0;
  for (let i = Math.max(0, best - 2); i <= Math.min(cols - 1, best + 2); i++) {
    sum += ((i + 0.5) / cols) * scores[i];
    weight += scores[i];
  }
  return weight > 0 ? sum / weight : 0.5;
}

/** Auto-reframe: mantém o assunto dentro da nova proporção. */
export async function autoReframe(
  asset: MediaAsset,
  opts: { from?: number; to?: number; onProgress?: (p: number) => void } = {}
): Promise<{ t: number; x: number }[]> {
  const from = opts.from ?? 0;
  const to = Math.min(opts.to ?? asset.duration, asset.duration);
  const step = 1 / 8;
  const frames = await grayFrames(asset, from, to, step, opts.onProgress);
  const points = frames.map((f) => ({ t: f.t, x: saliencyColumn(f.gray) - 0.5 }));
  // suavização exponencial para evitar "pulos"
  let prev = points[0]?.x ?? 0;
  return points.map((p) => {
    prev = prev * 0.72 + p.x * 0.28;
    return { t: p.t, x: clamp(prev * 0.85, -0.5, 0.5) };
  });
}

/** Sugere pontos de corte combinando picos de áudio e mudanças de movimento. */
export async function suggestCuts(
  project: Project,
  assets: MediaAsset[],
  maxCuts = 8,
  onProgress?: (p: number) => void
): Promise<{ cuts: number[]; beats: number[] }> {
  const videoClips = project.clips.filter((c) => c.kind === "video" || c.kind === "image");
  const audioAsset = assets.find((a) => a.kind === "audio" && a.duration > 1);
  const beats: number[] = [];
  let energy: number[] = [];
  if (audioAsset) {
    const buf = await pool.decodeAudio(audioAsset);
    if (buf) {
      beats.push(...detectBeats(buf));
      energy = energyMap(buf, 200);
    }
  }
  const motion: number[] = [];
  for (const clip of videoClips.slice(0, 3)) {
    const asset = assets.find((a) => a.id === clip.assetId);
    if (!asset) continue;
    const frames = await grayFrames(asset, clip.in, Math.min(asset.duration, clip.in + clip.duration), 1 / 6, onProgress);
    for (let i = 1; i < frames.length; i++) motion.push(meanAbsDiff(frames[i].gray, frames[i - 1].gray));
  }
  const total = Math.max(...project.clips.map((c) => clipEnd(c)), 1);
  const candidates = new Set<number>();
  beats.forEach((b) => candidates.add(Math.round(b * 10) / 10));
  const motionPeaks = motion
    .map((v, i) => ({ v, i }))
    .sort((a, b) => b.v - a.v)
    .slice(0, maxCuts)
    .map((p) => (p.i / Math.max(1, motion.length)) * total);
  motionPeaks.forEach((m) => candidates.add(Math.round(m * 10) / 10));
  const cuts = Array.from(candidates)
    .filter((t) => t > 0.2 && t < total)
    .sort((a, b) => a - b)
    .slice(0, Math.max(maxCuts, beats.length));
  void energy;
  return { cuts, beats };
}

/** Mapa de energia de um áudio para desenhar na timeline. */
export async function energyForAsset(asset: MediaAsset, buckets = 160): Promise<number[]> {
  const buf = await pool.decodeAudio(asset);
  if (!buf) return [];
  return energyMap(buf, buckets);
}

/** Níveis de áudio por janela (usado para remover silêncios em clipes de vídeo). */
export async function silenceWindows(asset: MediaAsset, threshold = 0.012, minDur = 0.32) {
  const buf = await pool.decodeAudio(asset);
  if (!buf) return [];
  const { rms, hop } = rmsWindows(buf, 0.03);
  const windows: { start: number; end: number }[] = [];
  let start: number | null = null;
  rms.forEach((v, i) => {
    const quiet = v < threshold;
    if (quiet && start === null) start = i;
    if (!quiet && start !== null) {
      const s = (start * hop) / buf.sampleRate;
      const e = (i * hop) / buf.sampleRate;
      if (e - s >= minDur) windows.push({ start: s, end: e });
      start = null;
    }
  });
  if (start !== null) {
    const s = (start * hop) / buf.sampleRate;
    if (buf.duration - s >= minDur) windows.push({ start: s, end: buf.duration });
  }
  return windows;
}

/** Extrai paleta dominante de um quadro (usado para colorir legendas). */
export async function paletteFromAsset(asset: MediaAsset, at = 0.5): Promise<string[]> {
  const canvas = createCanvas(96, 54);
  const ctx = ctx2d(canvas);
  if (asset.kind === "video") {
    const el = await pool.seekVideo(asset, at);
    if (el.readyState < 2) return [];
    ctx.drawImage(el, 0, 0, 96, 54);
  } else {
    const img = await pool.ensureImage(asset);
    ctx.drawImage(img, 0, 0, 96, 54);
  }
  const data = ctx.getImageData(0, 0, 96, 54).data;
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const key = `${data[i] >> 5}-${data[i + 1] >> 5}-${data[i + 2] >> 5}`;
    const cur = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    cur.n++;
    cur.r += data[i];
    cur.g += data[i + 1];
    cur.b += data[i + 2];
    buckets.set(key, cur);
  }
  return Array.from(buckets.values())
    .sort((a, b) => b.n - a.n)
    .slice(0, 6)
    .map((v) => `#${[v.r / v.n, v.g / v.n, v.b / v.n].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`);
}
