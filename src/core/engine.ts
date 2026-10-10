import { SPEED_CURVES, type KeyframeProp } from "@/lib/presets";
import { clamp, createCanvas, ctx2d, hexToRgb, lerp } from "@/lib/utils";
import {
  applyColorPipeline,
  applyDrawEffects,
  applyPixelEffect,
  lookRuntime,
  transformFromEffects,
} from "./effects";
import { pool } from "./media";
import {
  clipEnd,
  curveValue,
  evalKeyframe,
  sourceTimeFor,
  type Clip,
  type MediaAsset,
  type Project,
  type TextStyle,
} from "./model";

const PIXEL_EFFECT_IDS = new Set([
  "rgb_split", "wave", "ripple", "pixelate", "twirl", "fisheye", "bulge", "mirror", "kaleidoscope", "slice",
  "posterize", "threshold", "halftone", "dither", "emboss", "sketch", "cartoon", "oil", "thermal", "xray",
  "neon_edge", "hologram", "bloom", "glow_neon", "sharpen_pro", "denoise", "clarity", "upscale", "motion_blur",
  "tilt_shift", "mirror_kaleido_tile", "glitch", "glitch_scan", "comic", "watercolor", "datamosh", "film_burn",
  "old_film", "vhs", "crt", "ascii",
]);

export interface RenderRequest {
  project: Project;
  assets: MediaAsset[];
  time: number;
  width: number;
  height: number;
  playing: boolean;
  showZones?: "off" | "reels" | "tiktok" | "youtube";
  showThirds?: boolean;
  energy?: number[] | null;
}

const canvasCache = new Map<string, HTMLCanvasElement>();
function cachedCanvas(key: string, w: number, h: number) {
  let c = canvasCache.get(key);
  if (!c) {
    c = createCanvas(w, h);
    canvasCache.set(key, c);
  }
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  return c;
}

function localTime(clip: Clip, t: number) {
  return clamp(t - clip.start, 0, clip.duration);
}

function curveFor(clip: Clip): number[] {
  const def = SPEED_CURVES.find((s) => s.id === clip.speedCurve);
  if (!def || clip.speedCurve === "linear") return [clip.speed, clip.speed];
  return def.curve;
}

function kf(clip: Clip, prop: KeyframeProp, lt: number, fallback: number) {
  return evalKeyframe(clip, prop, lt, fallback);
}

/* ══════════════ desenho de fontes ══════════════ */

function fitRect(srcW: number, srcH: number, dstW: number, dstH: number, mode: "contain" | "cover") {
  if (!srcW || !srcH) return { x: 0, y: 0, w: dstW, h: dstH };
  const scale = mode === "cover" ? Math.max(dstW / srcW, dstH / srcH) : Math.min(dstW / srcW, dstH / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  return { x: (dstW - w) / 2, y: (dstH - h) / 2, w, h };
}

function cropSource(canvas: HTMLCanvasElement, clip: Clip) {
  const { left, right, top, bottom } = clip.crop;
  if (!left && !right && !top && !bottom) return canvas;
  const x = left * canvas.width;
  const y = top * canvas.height;
  const w = Math.max(2, canvas.width * (1 - left - right));
  const h = Math.max(2, canvas.height * (1 - top - bottom));
  const out = createCanvas(w, h);
  ctx2d(out).drawImage(canvas, x, y, w, h, 0, 0, w, h);
  return out;
}

function drawSourceWithTransform(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  clip: Clip,
  lt: number,
  w: number,
  h: number,
  extra: { dx: number; dy: number; zoom: number }
) {
  const fit = fitRect(srcW, srcH, w, h, clip.kind === "color" || clip.kind === "adjust" ? "cover" : "contain");
  const scale = kf(clip, "scale", lt, clip.transform.scale) * extra.zoom;
  const rot = (kf(clip, "rotate", lt, clip.transform.rotate) * Math.PI) / 180;
  const px = kf(clip, "x", lt, clip.transform.x) * w;
  const py = kf(clip, "y", lt, clip.transform.y) * h;
  ctx.save();
  ctx.translate(w / 2 + px + extra.dx, h / 2 + py + extra.dy);
  ctx.rotate(rot);
  ctx.scale((clip.transform.flipH ? -1 : 1) * scale, (clip.transform.flipV ? -1 : 1) * scale);
  ctx.globalAlpha = kf(clip, "opacity", lt, clip.opacity);
  ctx.drawImage(source, -fit.w / 2, -fit.h / 2, fit.w, fit.h);
  ctx.restore();
}

/* ══════════════ máscaras ══════════════ */

function maskPath(ctx: CanvasRenderingContext2D, clip: Clip, w: number, h: number) {
  const m = clip.mask;
  const cx = w / 2 + m.x * w;
  const cy = h / 2 + m.y * h;
  const rw = (w * m.scale) / 2;
  const rh = (h * m.scale) / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((m.rotate * Math.PI) / 180);
  switch (m.shape) {
    case "rect":
      ctx.beginPath();
      ctx.rect(-rw, -rh, rw * 2, rh * 2);
      break;
    case "circle":
      ctx.beginPath();
      ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
      break;
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(0, -rh);
      ctx.lineTo(rw, rh);
      ctx.lineTo(-rw, rh);
      ctx.closePath();
      break;
    case "star": {
      ctx.beginPath();
      const spikes = 5;
      for (let i = 0; i < spikes * 2; i++) {
        const rad = i % 2 === 0 ? rw : rw * 0.45;
        const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * rad;
        const y = Math.sin(a) * rad * (rh / rw);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
    case "heart": {
      ctx.beginPath();
      const s = rw;
      ctx.moveTo(0, rh * 0.75);
      ctx.bezierCurveTo(rw * 1.3, -rh * 0.2, rw * 0.35, -rh * 1.2, 0, -rh * 0.45);
      ctx.bezierCurveTo(-rw * 0.35, -rh * 1.2, -rw * 1.3, -rh * 0.2, 0, rh * 0.75);
      void s;
      ctx.closePath();
      break;
    }
    case "blinds": {
      ctx.beginPath();
      for (let i = 0; i < 9; i++) if (i % 2 === 0) ctx.rect(-rw, -rh + (i * 2 * rh) / 9, rw * 2, (2 * rh) / 9);
      break;
    }
    case "diagonal": {
      ctx.beginPath();
      ctx.moveTo(-rw, rh);
      ctx.lineTo(rw, -rh);
      ctx.lineTo(rw, rh);
      ctx.closePath();
      break;
    }
    case "split_l":
      ctx.beginPath();
      ctx.rect(-rw, -rh, rw, rh * 2);
      break;
    case "split_r":
      ctx.beginPath();
      ctx.rect(0, -rh, rw, rh * 2);
      break;
    default:
      ctx.beginPath();
      ctx.rect(-w, -h, w * 2, h * 2);
  }
  ctx.restore();
}

function applyMask(canvas: HTMLCanvasElement, clip: Clip, w: number, h: number) {
  const m = clip.mask;
  if (m.shape === "none") return canvas;
  const ctx = ctx2d(canvas);
  if (m.shape === "linear" || m.shape === "radial") {
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    const grad =
      m.shape === "linear"
        ? ctx.createLinearGradient(0, 0, w, h)
        : ctx.createRadialGradient(w / 2 + m.x * w, h / 2 + m.y * h, Math.min(w, h) * 0.02, w / 2 + m.x * w, h / 2 + m.y * h, Math.max(w, h) * 0.55 * m.scale);
    const feather = clamp(m.feather / 100, 0, 1);
    grad.addColorStop(0, m.invert ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)");
    grad.addColorStop(Math.max(0.02, 1 - feather - 0.02), m.invert ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)");
    grad.addColorStop(1, m.invert ? "rgba(0,0,0,1)" : "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return canvas;
  }
  const feather = clamp(m.feather / 100, 0, 1);
  ctx.save();
  ctx.globalCompositeOperation = m.invert ? "destination-out" : "destination-in";
  if (feather > 0.01) {
    ctx.filter = `blur(${feather * Math.min(w, h) * 0.04}px)`;
  }
  maskPath(ctx, clip, w, h);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();
  return canvas;
}

/* ══════════════ chroma key ══════════════ */

function applyChromaKey(img: ImageData, clip: Clip) {
  const c = clip.chroma;
  if (!c.enabled) return;
  const [kr, kg, kb] = hexToRgb(c.color);
  const tol = (c.tolerance / 100) * 441;
  const soft = Math.max(1, (c.softness / 100) * 200);
  const spill = c.spill / 100;
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const dr = d[i] - kr;
    const dg = d[i + 1] - kg;
    const db = d[i + 2] - kb;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist < tol) {
      d[i + 3] = 0;
    } else if (dist < tol + soft) {
      d[i + 3] = Math.round(((dist - tol) / soft) * 255);
    }
    if (spill > 0 && d[i + 3] > 0) {
      const maxGB = Math.max(d[i + 1], d[i + 2]);
      if (d[i] > maxGB) d[i] = lerp(d[i], maxGB, spill);
    }
  }
}

/* ══════════════ texto ══════════════ */

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  text.split("\n").forEach((paragraph) => {
    if (!paragraph) {
      lines.push("");
      return;
    }
    let current = "";
    paragraph.split(" ").forEach((word) => {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    });
    if (current) lines.push(current);
  });
  return lines;
}

function drawTextClip(ctx: CanvasRenderingContext2D, clip: Clip, lt: number, w: number, h: number) {
  const ts = clip.text;
  if (!ts) return;
  const text = ts.uppercase ? ts.content.toUpperCase() : ts.content;
  const progress = clamp(lt / Math.max(0.05, clip.duration), 0, 1);
  const anim = ts.animation;
  const speed = Math.max(0.2, ts.animationSpeed);
  let alpha = 1;
  let scale = 1;
  let dx = 0;
  let dy = 0;
  let rot = 0;
  let blur = 0;
  const animTime = lt * speed;
  const inPhase = clamp(animTime / 0.6, 0, 1);

  switch (anim) {
    case "fade_in":
      alpha = inPhase;
      break;
    case "pop":
      scale = 0.6 + 0.4 * inPhase + Math.sin(inPhase * Math.PI) * 0.12;
      alpha = inPhase;
      break;
    case "slide_up":
      dy = (1 - inPhase) * h * 0.12;
      alpha = inPhase;
      break;
    case "slide_left":
      dx = (1 - inPhase) * w * 0.2;
      alpha = inPhase;
      break;
    case "bounce":
      scale = 0.8 + 0.2 * inPhase + Math.abs(Math.sin(inPhase * Math.PI * 2)) * 0.08;
      dy = -Math.abs(Math.sin(inPhase * Math.PI)) * h * 0.03;
      break;
    case "blur_in":
      blur = (1 - inPhase) * 12;
      alpha = inPhase;
      break;
    case "wave_text":
      dy = Math.sin(animTime * 3) * h * 0.012;
      break;
    case "shake_text":
      dx = Math.sin(animTime * 40) * w * 0.004;
      dy = Math.cos(animTime * 33) * h * 0.004;
      break;
    case "neon_flicker":
      alpha = 0.72 + 0.28 * Math.abs(Math.sin(animTime * 9)) * (Math.random() > 0.06 ? 1 : 0.4);
      break;
    case "zoom_out":
      scale = 1.35 - 0.35 * inPhase;
      alpha = inPhase;
      break;
    case "rotate_in":
      rot = (1 - inPhase) * -0.6;
      alpha = inPhase;
      break;
    case "glitch_text":
      if (progress > 0.2 && Math.random() > 0.82) {
        dx = (Math.random() - 0.5) * w * 0.03;
      }
      break;
    case "scale_pulse":
      scale = 1 + Math.sin(animTime * 4) * 0.04;
      break;
    case "gradient_flow":
    case "typewriter":
    case "karaoke":
    case "word_by_word":
    case "none":
    default:
      break;
  }

  const fontSize = (ts.size / 1080) * h;
  ctx.save();
  ctx.translate(w / 2 + kf(clip, "x", lt, clip.transform.x) * w + dx, h / 2 + kf(clip, "y", lt, clip.transform.y) * h + dy);
  ctx.rotate(((kf(clip, "rotate", lt, clip.transform.rotate) * Math.PI) / 180) + rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha = kf(clip, "opacity", lt, clip.opacity) * alpha;
  if (blur > 0) ctx.filter = `blur(${blur}px)`;
  ctx.font = `${ts.italic ? "italic " : ""}${ts.weight} ${fontSize}px "${ts.font}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${(ts.letterSpacing / 1080) * h}px`;

  let display = text;
  if (anim === "typewriter") {
    const chars = Math.floor(clamp(progress / 0.7, 0, 1) * text.length);
    display = text.slice(0, chars);
  }
  if (anim === "word_by_word") {
    const words = text.split(" ");
    const shown = Math.ceil(clamp(progress / 0.75, 0, 1) * words.length);
    display = words.slice(0, shown).join(" ");
  }

  const maxWidth = w * 0.86;
  const lines = wrapText(ctx, display, maxWidth);
  const lineH = fontSize * ts.lineHeight;
  const totalH = lines.length * lineH;
  const blockW = Math.max(...lines.map((l) => ctx.measureText(l).width), 1);

  if (ts.bgEnabled) {
    ctx.save();
    ctx.globalAlpha = ctx.globalAlpha * ts.bgOpacity;
    ctx.fillStyle = ts.bgColor;
    const padX = (ts.padding / 1080) * h;
    const r = (ts.radius / 1080) * h;
    roundRect(ctx, -blockW / 2 - padX, -totalH / 2 - padX * 0.6, blockW + padX * 2, totalH + padX * 1.2, r);
    ctx.fill();
    ctx.restore();
  }

  const fill = ts.gradientEnabled
    ? (() => {
        const ang = (ts.gradientAngle * Math.PI) / 180;
        const g = ctx.createLinearGradient(-Math.cos(ang) * blockW * 0.6, -Math.sin(ang) * totalH * 0.6, Math.cos(ang) * blockW * 0.6, Math.sin(ang) * totalH * 0.6);
        g.addColorStop(0, ts.gradientFrom);
        g.addColorStop(1, ts.gradientTo);
        return g;
      })()
    : ts.color;

  lines.forEach((line, i) => {
    const y = -totalH / 2 + lineH * (i + 0.5);
    if (ts.shadowEnabled) {
      ctx.save();
      ctx.shadowColor = ts.shadowColor;
      ctx.shadowBlur = (ts.shadowBlur / 1080) * h;
      ctx.shadowOffsetX = (ts.shadowX / 1080) * h;
      ctx.shadowOffsetY = (ts.shadowY / 1080) * h;
      ctx.fillStyle = fill;
      ctx.fillText(line, 0, y);
      ctx.restore();
    }
    if (ts.strokeEnabled && ts.strokeWidth > 0) {
      ctx.lineWidth = (ts.strokeWidth / 1080) * h * 2;
      ctx.strokeStyle = ts.strokeColor;
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.strokeText(line, 0, y);
    }
    if (anim === "karaoke") {
      drawKaraokeLine(ctx, line, 0, y, progress, fill, ts);
    } else {
      ctx.fillStyle = fill;
      ctx.fillText(line, 0, y);
    }
  });
  ctx.restore();
}

function drawKaraokeLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  cx: number,
  y: number,
  progress: number,
  fill: string | CanvasGradient,
  ts: TextStyle
) {
  const words = line.split(" ");
  const widths = words.map((wd) => ctx.measureText(wd + " ").width);
  const total = widths.reduce((a, b) => a + b, 0);
  const elapsed = progress * line.length;
  let acc = 0;
  let x = cx - total / 2;
  words.forEach((wd, i) => {
    const visible = clamp(elapsed - acc, 0, wd.length + 1);
    ctx.fillStyle = visible >= wd.length ? (ts.gradientEnabled ? fill : "#fbbf24") : ts.color;
    ctx.fillStyle = visible >= wd.length ? fill : ts.color;
    ctx.textAlign = "left";
    ctx.fillText(wd, x, y);
    x += widths[i];
    acc += wd.length + 1;
  });
  ctx.textAlign = "center";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/* ══════════════ formas ══════════════ */

function drawShapeClip(ctx: CanvasRenderingContext2D, clip: Clip, lt: number, w: number, h: number) {
  const s = clip.shape;
  if (!s) return;
  const size = h * 0.3 * kf(clip, "scale", lt, clip.transform.scale);
  const px = w / 2 + kf(clip, "x", lt, clip.transform.x) * w;
  const py = h / 2 + kf(clip, "y", lt, clip.transform.y) * h;
  const rot = ((kf(clip, "rotate", lt, clip.transform.rotate) * Math.PI) / 180);
  ctx.save();
  ctx.globalAlpha = kf(clip, "opacity", lt, clip.opacity);
  ctx.translate(px, py);
  ctx.rotate(rot);
  const paint = s.gradient
    ? (() => {
        const g = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
        g.addColorStop(0, s.fill);
        g.addColorStop(1, s.fill2);
        return g;
      })()
    : s.fill;
  ctx.fillStyle = paint;
  ctx.strokeStyle = s.strokeColor;
  ctx.lineWidth = (s.strokeWidth / 540) * size;
  const path = new Path2D();
  switch (s.shape) {
    case "rect":
      path.roundRect(-size / 2, -size / 3, size, (size * 2) / 3, s.radius);
      break;
    case "ellipse":
      path.ellipse(0, 0, size / 2, size / 3, 0, 0, Math.PI * 2);
      break;
    case "triangle":
      path.moveTo(0, -size / 2);
      path.lineTo(size / 2, size / 2);
      path.lineTo(-size / 2, size / 2);
      path.closePath();
      break;
    case "star":
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? size / 2 : size / 5;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
      path.closePath();
      break;
    case "arrow":
      path.moveTo(-size / 2, -size / 8);
      path.lineTo(size / 8, -size / 8);
      path.lineTo(size / 8, -size / 3);
      path.lineTo(size / 2, 0);
      path.lineTo(size / 8, size / 3);
      path.lineTo(size / 8, size / 8);
      path.lineTo(-size / 2, size / 8);
      path.closePath();
      break;
    case "heart":
      path.moveTo(0, size / 3);
      path.bezierCurveTo(size * 0.7, -size * 0.1, size * 0.2, -size * 0.6, 0, -size * 0.22);
      path.bezierCurveTo(-size * 0.2, -size * 0.6, -size * 0.7, -size * 0.1, 0, size / 3);
      break;
    case "line":
      path.rect(-size / 2, -size / 40, size, size / 20);
      break;
    case "ring":
      path.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(4, size / 10);
      ctx.strokeStyle = typeof paint === "string" ? paint : s.fill;
      ctx.stroke(path);
      break;
    case "speech":
      path.roundRect(-size / 2, -size / 3, size, (size * 1.4) / 3, size / 12);
      path.moveTo(-size / 6, size / 6);
      path.lineTo(-size / 3, size / 2);
      path.lineTo(0, size / 6);
      break;
    case "play":
      path.arc(0, 0, size / 2, 0, Math.PI * 2);
      path.moveTo(-size / 8, -size / 5);
      path.lineTo(size / 4, 0);
      path.lineTo(-size / 8, size / 5);
      path.closePath();
      break;
    case "progress": {
      const p = clamp(lt / Math.max(0.1, clip.duration), 0, 1);
      path.roundRect(-size / 2, -size / 24, size, size / 12, size / 24);
      ctx.fill();
      ctx.fillStyle = s.fill2;
      const bar = new Path2D();
      bar.roundRect(-size / 2, -size / 24, size * p, size / 12, size / 24);
      ctx.fill(bar);
      ctx.restore();
      return;
    }
    case "countdown": {
      const remaining = Math.max(0, Math.ceil(clip.duration - lt));
      ctx.font = `800 ${size}px "Space Grotesk", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = paint;
      ctx.fillText(String(remaining), 0, 0);
      ctx.restore();
      return;
    }
    case "bars": {
      const barCount = Math.max(4, Math.round(s.count));
      const bw = size / (barCount * 1.6);
      for (let i = 0; i < barCount; i++) {
        const v = Math.abs(Math.sin(i * 0.8 + lt * s.speed * 6)) * 0.85 + 0.15;
        const bh = size * 0.35 * v;
        ctx.fillStyle = paint;
        ctx.fillRect(-size / 2 + i * bw * 1.6, size * 0.18 - bh, bw, bh);
      }
      ctx.restore();
      return;
    }
    case "grid":
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = Math.max(2, size * 0.006);
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-size / 2 + (size / 3) * i, -size / 2);
        ctx.lineTo(-size / 2 + (size / 3) * i, size / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-size / 2, -size / 2 + (size / 3) * i);
        ctx.lineTo(size / 2, -size / 2 + (size / 3) * i);
        ctx.stroke();
      }
      ctx.restore();
      return;
    case "polaroid":
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-size * 0.62, -size * 0.62, size * 1.24, size * 1.42);
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(-size * 0.52, -size * 0.52, size * 1.04, size * 1.04);
      ctx.restore();
      return;
    case "phone":
      ctx.fillStyle = "rgba(15,15,22,0.92)";
      path.roundRect(-size * 0.36, -size * 0.72, size * 0.72, size * 1.44, size * 0.12);
      ctx.fill(path);
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(-size * 0.3, -size * 0.62, size * 0.6, size * 1.24);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      path.roundRect(-size * 0.08, -size * 0.68, size * 0.16, size * 0.035, size * 0.02);
      ctx.fill(path);
      ctx.restore();
      return;
    case "sticker":
      ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.text || "🔥", 0, 0);
      ctx.restore();
      return;
    default:
      ctx.restore();
      return;
  }
  ctx.fill(path);
  if (s.strokeWidth > 0) ctx.stroke(path);
  ctx.restore();
}

/* ══════════════ render de um clipe ══════════════ */

async function renderClipSource(clip: Clip, asset: MediaAsset | undefined, lt: number, playing: boolean, w: number, h: number): Promise<HTMLCanvasElement> {
  const canvas = cachedCanvas(`src_${clip.id}`, w, h);
  const ctx = ctx2d(canvas);
  ctx.clearRect(0, 0, w, h);

  const curve = curveFor(clip);
  const srcTime = sourceTimeFor(clip, curve, lt);

  if (clip.kind === "text") {
    drawTextClip(ctx, clip, lt, w, h);
    return canvas;
  }
  if (clip.kind === "shape" || clip.kind === "sticker") {
    drawShapeClip(ctx, clip, lt, w, h);
    return canvas;
  }
  if (clip.kind === "color") {
    ctx.fillStyle = clip.color ?? "#000000";
    ctx.fillRect(0, 0, w, h);
    return canvas;
  }
  if (clip.kind === "adjust") {
    return canvas;
  }
  if (!asset) {
    ctx.fillStyle = "#1b1b2a";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#6b6b86";
    ctx.font = `${Math.round(h * 0.04)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("mídia indisponível", w / 2, h / 2);
    return canvas;
  }

  let source: CanvasImageSource | null = null;
  let srcW = asset.width || w;
  let srcH = asset.height || h;

  if (asset.kind === "video") {
    const el = clip.freeze
      ? await pool.seekVideo(asset, clip.in)
      : playing
        ? pool.prepareVideo(asset, srcTime, true, clamp(clip.speed, 0.1, 4))
        : await pool.seekVideo(asset, srcTime);
    if (el.readyState >= 2) {
      source = el;
      srcW = el.videoWidth || srcW;
      srcH = el.videoHeight || srcH;
    }
  } else {
    const img = await pool.ensureImage(asset);
    if (img.naturalWidth) {
      source = img;
      srcW = img.naturalWidth;
      srcH = img.naturalHeight;
    }
  }

  if (!source) return canvas;
  const stabilizer = clip.stabilize > 0 ? STABILIZER.read(clip, lt) : { dx: 0, dy: 0 };
  const fx = transformFromEffects(clip.effects, w, h, lt);
  drawSourceWithTransform(ctx, source, srcW, srcH, clip, lt, w, h, { dx: fx.dx + stabilizer.dx, dy: fx.dy + stabilizer.dy, zoom: fx.zoom * (1 + clip.stabilize * 0.06) });

  /* recorte: corta as bordas escolhidas e reenquadra o que sobrou */
  const cropped = cropSource(canvas, clip);
  if (cropped !== canvas) {
    const fit = fitRect(cropped.width, cropped.height, w, h, "cover");
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(cropped, (w - fit.w) / 2, (h - fit.h) / 2, fit.w, fit.h);
  }
  return canvas;
}

/** Ajustes de estabilização pré-calculados por clipe (preenchidos pela análise). */
export const STABILIZER = {
  data: new Map<string, { t: number; dx: number; dy: number }[]>(),
  set(clipId: string, track: { t: number; dx: number; dy: number }[]) {
    this.data.set(clipId, track);
  },
  read(clip: Clip, lt: number) {
    const trk = this.data.get(clip.id);
    if (!trk || !trk.length) return { dx: 0, dy: 0 };
    let best = trk[0];
    for (const p of trk) {
      if (p.t <= lt) best = p;
      else break;
    }
    const rel = Math.min(1, Math.max(0, (lt - best.t) / Math.max(0.001, (trk[0] ? 1 : 1))));
    void rel;
    return { dx: best.dx * clip.stabilize, dy: best.dy * clip.stabilize };
  },
};

/* ══════════════ transições ══════════════ */

function transitionMix(
  id: string,
  target: CanvasRenderingContext2D,
  from: HTMLCanvasElement,
  to: HTMLCanvasElement,
  p: number,
  w: number,
  h: number,
  t: number
) {
  const e = clamp(p, 0, 1);
  const easeInOut = e < 0.5 ? 2 * e * e : 1 - (-2 * e + 2) ** 2 / 2;
  switch (id) {
    case "dissolve":
      target.globalAlpha = 1;
      target.drawImage(from, 0, 0, w, h);
      target.globalAlpha = e;
      target.drawImage(to, 0, 0, w, h);
      break;
    case "fade_black":
      target.fillStyle = "#000";
      target.fillRect(0, 0, w, h);
      target.globalAlpha = e < 0.5 ? 1 - e * 2 : (e - 0.5) * 2;
      target.drawImage(e < 0.5 ? from : to, 0, 0, w, h);
      break;
    case "fade_white":
      target.fillStyle = "#fff";
      target.fillRect(0, 0, w, h);
      target.globalAlpha = e < 0.5 ? 1 - e * 2 : (e - 0.5) * 2;
      target.drawImage(e < 0.5 ? from : to, 0, 0, w, h);
      break;
    case "blur_dissolve": {
      target.globalAlpha = 1;
      target.filter = `blur(${(1 - e) * 14}px)`;
      target.drawImage(from, 0, 0, w, h);
      target.filter = `blur(${e * 14}px)`;
      target.globalAlpha = e;
      target.drawImage(to, 0, 0, w, h);
      target.filter = "none";
      break;
    }
    case "zoom_in":
      target.globalAlpha = 1;
      target.drawImage(from, 0, 0, w, h);
      target.save();
      target.globalAlpha = e;
      target.translate(w / 2, h / 2);
      target.scale(0.4 + e * 0.6, 0.4 + e * 0.6);
      target.drawImage(to, -w / 2, -h / 2, w, h);
      target.restore();
      break;
    case "zoom_out":
      target.globalAlpha = 1;
      target.drawImage(from, 0, 0, w, h);
      target.save();
      target.globalAlpha = e;
      target.globalCompositeOperation = "source-over";
      target.drawImage(to, 0, 0, w, h);
      target.restore();
      break;
    case "cross_zoom": {
      target.save();
      target.globalAlpha = 1;
      target.translate(w / 2, h / 2);
      target.scale(1 + e * 0.5, 1 + e * 0.5);
      target.globalAlpha = 1 - e;
      target.drawImage(from, -w / 2, -h / 2, w, h);
      target.restore();
      target.save();
      target.translate(w / 2, h / 2);
      target.scale(1.5 - e * 0.5, 1.5 - e * 0.5);
      target.globalAlpha = e;
      target.drawImage(to, -w / 2, -h / 2, w, h);
      target.restore();
      break;
    }
    case "punch":
      target.globalAlpha = 1;
      target.drawImage(from, 0, 0, w, h);
      target.save();
      target.globalAlpha = e;
      target.translate(w / 2, h / 2);
      const s = 1 + (1 - easeInOut) * 0.6;
      target.scale(s, s);
      target.drawImage(to, -w / 2, -h / 2, w, h);
      target.restore();
      if (e < 0.35) {
        target.fillStyle = `rgba(255,255,255,${(0.35 - e) * 1.6})`;
        target.fillRect(0, 0, w, h);
      }
      break;
    case "slide_l":
      target.drawImage(from, -easeInOut * w, 0, w, h);
      target.drawImage(to, (1 - easeInOut) * w, 0, w, h);
      break;
    case "slide_r":
      target.drawImage(from, easeInOut * w, 0, w, h);
      target.drawImage(to, -(1 - easeInOut) * w, 0, w, h);
      break;
    case "slide_up":
      target.drawImage(from, 0, -easeInOut * h, w, h);
      target.drawImage(to, 0, (1 - easeInOut) * h, w, h);
      break;
    case "slide_down":
      target.drawImage(from, 0, easeInOut * h, w, h);
      target.drawImage(to, 0, -(1 - easeInOut) * h, w, h);
      break;
    case "push_l":
      target.drawImage(from, -easeInOut * w * 0.5, 0, w, h);
      target.drawImage(to, w - easeInOut * w, 0, w, h);
      break;
    case "wipe_l":
      target.drawImage(from, 0, 0, w, h);
      target.save();
      target.beginPath();
      target.rect(0, 0, w * easeInOut, h);
      target.clip();
      target.drawImage(to, 0, 0, w, h);
      target.restore();
      break;
    case "wipe_r":
      target.drawImage(from, 0, 0, w, h);
      target.save();
      target.beginPath();
      target.rect(w - w * easeInOut, 0, w * easeInOut, h);
      target.clip();
      target.drawImage(to, 0, 0, w, h);
      target.restore();
      break;
    case "wipe_diag":
      target.drawImage(from, 0, 0, w, h);
      target.save();
      target.beginPath();
      target.moveTo(0, 0);
      const d = easeInOut * (w + h);
      target.lineTo(Math.min(w, d), 0);
      target.lineTo(Math.max(0, d - h), h);
      target.lineTo(0, Math.min(h, d));
      target.closePath();
      target.clip();
      target.drawImage(to, 0, 0, w, h);
      target.restore();
      break;
    case "circle_open":
      target.drawImage(from, 0, 0, w, h);
      target.save();
      target.beginPath();
      target.arc(w / 2, h / 2, Math.hypot(w, h) * 0.6 * easeInOut, 0, Math.PI * 2);
      target.clip();
      target.drawImage(to, 0, 0, w, h);
      target.restore();
      break;
    case "blinds": {
      const bands = 12;
      for (let i = 0; i < bands; i++) {
        const y = (i * h) / bands;
        const bh = h / bands;
        const grow = clamp((easeInOut - i / bands) * 3, 0, 1);
        target.drawImage(from, 0, y, w, bh, 0, y, w, bh);
        target.drawImage(to, 0, y + bh * (1 - grow) * 0.5, w, bh * grow, 0, y + bh * (1 - grow) * 0.5, w, bh * grow);
      }
      break;
    }
    case "squares": {
      const cols = 6;
      const rows = Math.ceil((cols * h) / w);
      const cw = w / cols;
      const ch = h / rows;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = y * cols + x;
          const total = cols * rows;
          const local = clamp((easeInOut - idx / total * 0.6) / 0.4, 0, 1);
          target.drawImage(from, x * cw, y * ch, cw, ch, x * cw, y * ch, cw, ch);
          const sw = cw * local;
          const sh = ch * local;
          target.drawImage(to, x * cw + (cw - sw) / 2, y * ch + (ch - sh) / 2, sw, sh * 0 + sh, x * cw + (cw - sw) / 2, y * ch + (ch - sh) / 2, sw, sh);
        }
      }
      break;
    }
    case "pixel_dissolve": {
      const blocks = 24;
      target.drawImage(from, 0, 0, w, h);
      const bw = w / blocks;
      const bh = (h / blocks) * (w / h) * (h / w) + 0;
      for (let y = 0; y < h; y += bh) {
        for (let x = 0; x < w; x += bw) {
          const rnd = Math.abs(Math.sin(x * 12.9898 + y * 78.233)) % 1;
          if (rnd < easeInOut) target.drawImage(to, x, y, bw, bh, x, y, bw, bh);
        }
      }
      break;
    }
    case "glitch": {
      target.drawImage(from, 0, 0, w, h);
      const slices = 14;
      for (let i = 0; i < slices; i++) {
        const sy = (i / slices) * h;
        const sh = h / slices;
        const key = Math.abs(Math.sin(i * 3.7 + Math.floor(t * 18)));
        if (key < easeInOut) {
          const off = (Math.sin(i * 5.1 + t * 22) * 30) | 0;
          target.drawImage(to, 0, sy, w, sh, off, sy, w, sh);
          target.globalCompositeOperation = "screen";
          target.drawImage(to, 0, sy, w, sh, off + 6, sy, w, sh);
          target.globalCompositeOperation = "source-over";
        }
      }
      break;
    }
    case "datamosh_t":
      target.drawImage(from, 0, 0, w, h);
      target.save();
      target.globalAlpha = easeInOut;
      target.drawImage(to, (Math.random() - 0.5) * 40, 0, w, h);
      target.restore();
      break;
    case "rgb_shift":
      target.drawImage(from, 0, 0, w, h);
      target.save();
      target.globalCompositeOperation = "screen";
      target.globalAlpha = easeInOut;
      target.drawImage(to, -easeInOut * 26, 0, w, h);
      target.drawImage(to, easeInOut * 26, 0, w, h);
      target.drawImage(to, 0, 0, w, h);
      target.restore();
      break;
    case "whip_pan":
      target.save();
      target.filter = `blur(${Math.sin(e * Math.PI) * 18}px)`;
      target.drawImage(from, -easeInOut * w * 1.2, 0, w, h);
      target.drawImage(to, (1 - easeInOut) * w * 1.2, 0, w, h);
      target.restore();
      break;
    case "spin":
      target.save();
      target.globalAlpha = 1 - easeInOut;
      target.translate(w / 2, h / 2);
      target.rotate(easeInOut * Math.PI * 0.5);
      target.scale(1 - easeInOut * 0.4, 1 - easeInOut * 0.4);
      target.drawImage(from, -w / 2, -h / 2, w, h);
      target.restore();
      target.save();
      target.globalAlpha = easeInOut;
      target.translate(w / 2, h / 2);
      target.rotate((1 - easeInOut) * -Math.PI * 0.5);
      target.scale(0.6 + easeInOut * 0.4, 0.6 + easeInOut * 0.4);
      target.drawImage(to, -w / 2, -h / 2, w, h);
      target.restore();
      break;
    case "swing":
      target.save();
      target.globalAlpha = 1;
      target.translate(w / 2, h / 2);
      target.rotate(Math.sin(easeInOut * Math.PI) * 0.6 * (1 - easeInOut));
      target.drawImage(from, -w / 2, -h / 2, w, h);
      target.restore();
      target.globalAlpha = easeInOut;
      target.drawImage(to, 0, 0, w, h);
      break;
    case "film_burn_t": {
      target.drawImage(from, 0, 0, w, h);
      target.globalAlpha = clamp(easeInOut * 1.6, 0, 1);
      target.drawImage(to, 0, 0, w, h);
      target.globalAlpha = 1;
      const g = target.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.hypot(w, h) * 0.55);
      g.addColorStop(0, `rgba(255,140,20,${Math.sin(e * Math.PI) * 0.9})`);
      g.addColorStop(0.6, `rgba(120,30,0,${Math.sin(e * Math.PI) * 0.5})`);
      g.addColorStop(1, "transparent");
      target.fillStyle = g;
      target.fillRect(0, 0, w, h);
      break;
    }
    case "light_leak_t": {
      target.drawImage(from, 0, 0, w, h);
      target.globalAlpha = easeInOut;
      target.drawImage(to, 0, 0, w, h);
      target.globalAlpha = 1;
      const g = target.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, `rgba(255,170,60,${Math.sin(e * Math.PI) * 0.85})`);
      g.addColorStop(0.5, `rgba(255,255,255,${Math.sin(e * Math.PI) * 0.5})`);
      g.addColorStop(1, "transparent");
      target.globalCompositeOperation = "screen";
      target.fillStyle = g;
      target.fillRect(0, 0, w, h);
      target.globalCompositeOperation = "source-over";
      break;
    }
    case "vhs_t": {
      const jitter = Math.sin(t * 40) * 12 * Math.sin(e * Math.PI);
      target.drawImage(from, jitter, 0, w, h);
      target.globalAlpha = easeInOut;
      target.drawImage(to, -jitter * 0.6, 0, w, h);
      target.globalAlpha = 1;
      target.fillStyle = `rgba(255,255,255,${Math.sin(e * Math.PI) * 0.16})`;
      for (let i = 0; i < 26; i++) {
        const y = (Math.sin(i * 7.3 + t * 12) * 0.5 + 0.5) * h;
        target.fillRect(0, y, w, 2);
      }
      break;
    }
    case "paper": {
      target.drawImage(from, 0, 0, w, h);
      target.save();
      target.beginPath();
      target.moveTo(0, 0);
      const steps = 26;
      for (let i = 0; i <= steps; i++) {
        const p2 = i / steps;
        const jag = p2 < easeInOut ? 1 : 0.72;
        target.lineTo(w * p2, jag * h);
        if (p2 >= easeInOut) break;
      }
      target.lineTo(w, 0);
      target.closePath();
      target.clip();
      target.drawImage(to, 0, 0, w, h);
      target.restore();
      break;
    }
    case "none":
    default:
      target.drawImage(e < 0.5 ? from : to, 0, 0, w, h);
      break;
  }
  target.globalAlpha = 1;
  target.filter = "none";
  target.globalCompositeOperation = "source-over";
}

/* ══════════════ fundo ══════════════ */

function drawBackground(ctx: CanvasRenderingContext2D, project: Project, w: number, h: number) {
  const bg = project.bg;
  switch (bg.type) {
    case "transparent":
      return;
    case "gradient": {
      const ang = (bg.angle * Math.PI) / 180;
      const g = ctx.createLinearGradient(w / 2 - Math.cos(ang) * w, h / 2 - Math.sin(ang) * h, w / 2 + Math.cos(ang) * w, h / 2 + Math.sin(ang) * h);
      g.addColorStop(0, bg.from);
      g.addColorStop(1, bg.to);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      return;
    }
    case "pattern": {
      ctx.fillStyle = project.bg.color === "#000000" ? "#0d0d16" : bg.color;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      const gap = Math.max(12, w / 40);
      for (let x = 0; x < w; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      return;
    }
    default:
      ctx.fillStyle = bg.color;
      ctx.fillRect(0, 0, w, h);
  }
}

/* ══════════════ render principal ══════════════ */

export async function renderFrame(canvas: HTMLCanvasElement, req: RenderRequest): Promise<void> {
  const { project, assets, time, width: w, height: h, playing } = req;
  canvas.width = Math.max(2, Math.round(w));
  canvas.height = Math.max(2, Math.round(h));
  const ctx = ctx2d(canvas);
  ctx.clearRect(0, 0, w, h);
  drawBackground(ctx, project, w, h);

  const orderedTracks = [...project.tracks].reverse().filter((t) => t.kind !== "audio" && !t.hidden);
  const adjustClips: Clip[] = [];

  for (const track of orderedTracks) {
    const clips = project.clips.filter((c) => c.trackId === track.id);
    for (const clip of clips) {
      const lt = localTime(clip, time);
      const active = time >= clip.start - 0.001 && time < clipEnd(clip) + 0.001;
      if (!active) continue;
      if (clip.kind === "adjust") {
        adjustClips.push(clip);
        continue;
      }

      const asset = clip.assetId ? assets.find((a) => a.id === clip.assetId) : undefined;
      const src = await renderClipSource(clip, asset, lt, playing, w, h);

      // pixel stack: cor + look + efeitos de pixel + chroma
      const needsPixels = clip.effects.some((e) => e.enabled) || clip.look !== "none" || clip.chroma.enabled || hasAdjust(clip);
      if (needsPixels) {
        const img = ctx2d(src).getImageData(0, 0, w, h);
        if (hasAdjust(clip) || clip.look !== "none") applyColorPipeline(img, clip.adjust, lookRuntime(clip.look, clip.lookIntensity));
        for (const eff of clip.effects) {
          if (!eff.enabled) continue;
          if (PIXEL_EFFECT_IDS.has(eff.id)) applyPixelEffect(eff.id, img, eff.params, lt, 7);
        }
        applyChromaKey(img, clip);
        ctx2d(src).putImageData(img, 0, 0);
      }

      applyMask(src, clip, w, h);

      const hasTransition = clip.transitionIn && clip.transitionIn.id !== "none" && lt < clip.transitionIn.duration;
      if (hasTransition && clip.transitionIn) {
        const prev = previousVisualClip(project, clip);
        const blend = cachedCanvas("transition", w, h);
        const bctx = ctx2d(blend);
        bctx.clearRect(0, 0, w, h);
        if (prev) {
          const prevAsset = prev.assetId ? assets.find((a) => a.id === prev.assetId) : undefined;
          const prevSrc = await renderClipSource(prev, prevAsset, prev.duration, false, w, h);
          const fitted = cachedCanvas("transition_from", w, h);
          const fctx = ctx2d(fitted);
          fctx.clearRect(0, 0, w, h);
          fctx.drawImage(prevSrc, 0, 0, w, h);
          transitionMix(clip.transitionIn.id, bctx, fitted, src, lt / Math.max(0.01, clip.transitionIn.duration), w, h, lt);
        } else {
          bctx.drawImage(src, 0, 0, w, h);
        }
        ctx.save();
        ctx.globalAlpha = kf(clip, "opacity", lt, clip.opacity);
        ctx.globalCompositeOperation = clip.blend as GlobalCompositeOperation;
        ctx.drawImage(blend, 0, 0, w, h);
        ctx.restore();
      } else {
        ctx.save();
        ctx.globalAlpha = kf(clip, "opacity", lt, clip.opacity);
        ctx.globalCompositeOperation = clip.blend as GlobalCompositeOperation;
        ctx.drawImage(src, 0, 0, w, h);
        ctx.restore();
      }

      // efeitos desenhados por cima do clipe
      const drawEffects = clip.effects.filter((e) => e.enabled);
      if (drawEffects.length) {
        ctx.save();
        ctx.globalAlpha = kf(clip, "opacity", lt, clip.opacity);
        applyDrawEffects(ctx, w, h, drawEffects, lt);
        ctx.restore();
      }
    }
  }

  // camadas de ajuste afetam todo o quadro acumulado
  for (const clip of adjustClips) {
    const lt = localTime(clip, time);
    if (!hasAdjust(clip) && !clip.effects.some((e) => e.enabled)) continue;
    const img = ctx.getImageData(0, 0, w, h);
    applyColorPipeline(img, clip.adjust, lookRuntime(clip.look, clip.lookIntensity));
    for (const eff of clip.effects) {
      if (!eff.enabled || !PIXEL_EFFECT_IDS.has(eff.id)) continue;
      applyPixelEffect(eff.id, img, eff.params, lt, 11);
    }
    ctx.putImageData(img, 0, 0);
    const drawEffects = clip.effects.filter((e) => e.enabled);
    if (drawEffects.length) applyDrawEffects(ctx, w, h, drawEffects, lt);
  }

  if (project.watermark.enabled) {
    ctx.save();
    ctx.globalAlpha = project.watermark.opacity;
    ctx.font = `${(project.watermark.size / 1080) * h * 2}px "Space Grotesk", sans-serif`;
    ctx.fillStyle = project.watermark.color;
    const pad = h * 0.04;
    const pos = project.watermark.pos;
    ctx.textBaseline = pos.startsWith("t") ? "top" : "bottom";
    ctx.textAlign = pos.endsWith("l") ? "left" : pos.endsWith("r") ? "right" : "center";
    const x = pos.endsWith("l") ? pad : pos.endsWith("r") ? w - pad : w / 2;
    const y = pos.startsWith("t") ? pad : h - pad;
    ctx.fillText(project.watermark.text, x, y);
    ctx.restore();
  }

  if (req.showThirds) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo((w / 3) * i, 0);
      ctx.lineTo((w / 3) * i, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (h / 3) * i);
      ctx.lineTo(w, (h / 3) * i);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (req.showZones && req.showZones !== "off") {
    drawSafeZones(ctx, w, h, req.showZones);
  }
}

function hasAdjust(clip: Clip) {
  return Object.entries(clip.adjust).some(([k, v]) => k !== "hue" && Math.abs(v as number) > 0.01) || Math.abs(clip.adjust.hue) > 0.01;
}

function previousVisualClip(project: Project, clip: Clip): Clip | null {
  const list = project.clips.filter((c) => c.trackId === clip.trackId).sort((a, b) => a.start - b.start);
  const idx = list.findIndex((c) => c.id === clip.id);
  return idx > 0 ? list[idx - 1] : null;
}

function drawSafeZones(ctx: CanvasRenderingContext2D, w: number, h: number, kind: "reels" | "tiktok" | "youtube") {
  ctx.save();
  ctx.fillStyle = "rgba(168,85,247,0.16)";
  if (kind === "reels") {
    ctx.fillRect(0, 0, w, h * 0.11);
    ctx.fillRect(0, h * 0.79, w, h * 0.21);
    ctx.fillRect(0, h * 0.11, w * 0.14, h * 0.68);
  } else if (kind === "tiktok") {
    ctx.fillRect(0, 0, w, h * 0.1);
    ctx.fillRect(0, h * 0.76, w, h * 0.24);
    ctx.fillRect(w * 0.82, h * 0.42, w * 0.18, h * 0.34);
  } else {
    ctx.fillRect(0, 0, w, h * 0.06);
    ctx.fillRect(0, h * 0.88, w, h * 0.12);
  }
  ctx.strokeStyle = "rgba(168,85,247,0.5)";
  ctx.strokeRect(w * 0.05, h * 0.05, w * 0.9, h * 0.9);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `${Math.round(h * 0.028)}px Inter, sans-serif`;
  ctx.fillText(`zonas seguras · ${kind}`, w * 0.05, h * 0.045);
  ctx.restore();
}

/** Renderiza um quadro em um canvas novo (usado para miniaturas e exportação de imagem). */
export async function renderToDataUrl(project: Project, assets: MediaAsset[], time: number, width: number, height: number, playing = false): Promise<string> {
  const canvas = createCanvas(width, height);
  await renderFrame(canvas, { project, assets, time, width, height, playing });
  return canvas.toDataURL("image/png");
}

/** Valor numérico de uma propriedade animada — usado pelo inspetor. */
export function currentProp(clip: Clip, prop: KeyframeProp, t: number): number {
  const lt = localTime(clip, t);
  const fallback =
    prop === "x"
      ? clip.transform.x
      : prop === "y"
        ? clip.transform.y
        : prop === "scale"
          ? clip.transform.scale
          : prop === "rotate"
            ? clip.transform.rotate
            : prop === "opacity"
              ? clip.opacity
              : prop === "volume"
                ? clip.audio.volume
                : (clip.adjust[prop as keyof typeof clip.adjust] as number) ?? 0;
  return kf(clip, prop, lt, fallback);
}

export { curveValue };
