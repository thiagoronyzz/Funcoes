import { createCanvas, ctx2d, uid } from "@/lib/utils";
import type { MediaAsset } from "./model";
import { pool } from "./media";

/**
 * Gerador de mídia procedural do editzz: cria imagens e clipes de vídeo
 * reais (gravados por canvas.captureStream) sem depender de arquivos externos.
 */

export type GenKind =
  | "gradiente"
  | "particulas"
  | "contagem"
  | "cartao"
  | "barras"
  | "neon"
  | "codigo"
  | "plasma"
  | "bokeh"
  | "ondas"
  | "grade"
  | "papel";

export interface GenDef {
  id: GenKind;
  name: string;
  desc: string;
  supports: ("foto" | "vídeo")[];
}

export const GENERATORS: GenDef[] = [
  { id: "gradiente", name: "Gradiente animado", desc: "Fundo em degradê que se move lentamente.", supports: ["foto", "vídeo"] },
  { id: "particulas", name: "Partículas", desc: "Nuvem de pontos luminosos em movimento.", supports: ["foto", "vídeo"] },
  { id: "contagem", name: "Contagem regressiva", desc: "Números grandes de 3 a 1 para abertura.", supports: ["vídeo"] },
  { id: "cartao", name: "Cartão de texto", desc: "Frase centralizada com fundo sólido.", supports: ["foto", "vídeo"] },
  { id: "barras", name: "Barras de cores (SMPTE)", desc: "Padrão de teste clássico de transmissão.", supports: ["foto", "vídeo"] },
  { id: "neon", name: "Túnel neon", desc: "Anéis retrofuturistas em perspectiva.", supports: ["foto", "vídeo"] },
  { id: "codigo", name: "Chuva de código", desc: "Colunas de caracteres caindo.", supports: ["vídeo"] },
  { id: "plasma", name: "Plasma", desc: "Fluido colorido estilo demo scene.", supports: ["foto", "vídeo"] },
  { id: "bokeh", name: "Bokeh", desc: "Bolinhas desfocadas coloridas.", supports: ["foto", "vídeo"] },
  { id: "ondas", name: "Ondas de som", desc: "Barras de áudio reagindo ao tempo.", supports: ["foto", "vídeo"] },
  { id: "grade", name: "Grade técnica", desc: "Malha de fundo para overlays e mockups.", supports: ["foto", "vídeo"] },
  { id: "papel", name: "Textura de papel", desc: "Grão e fibras neutras para composição.", supports: ["foto"] },
];

export interface GenOptions {
  width: number;
  height: number;
  c1: string;
  c2: string;
  text: string;
  seed: number;
}

export const defaultGenOptions = (): GenOptions => ({
  width: 1280,
  height: 720,
  c1: "#d7a45a",
  c2: "#526f6c",
  text: "editzz",
  seed: 7,
});

function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Desenha um quadro do gerador no contexto informado (t em segundos). */
export function renderGenerator(kind: GenKind, ctx: CanvasRenderingContext2D, t: number, o: GenOptions) {
  const { width: w, height: h } = o;
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  switch (kind) {
    case "gradiente": {
      const ang = (t * 0.12) % 1;
      const g = ctx.createLinearGradient(0, h * ang, w, h * (1 - ang));
      g.addColorStop(0, o.c1);
      g.addColorStop(0.5, o.c2);
      g.addColorStop(1, o.c1);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case "particulas": {
      ctx.fillStyle = "#05060c";
      ctx.fillRect(0, 0, w, h);
      const r = rng(o.seed);
      const n = 160;
      for (let i = 0; i < n; i++) {
        const bx = r() * w;
        const by = r() * h;
        const sp = 12 + r() * 60;
        const size = 1 + r() * 3.4;
        const y = h - (((by + t * sp) % (h + 40)) - 20);
        const alpha = 0.25 + 0.75 * r();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = i % 3 === 0 ? o.c1 : o.c2;
        ctx.beginPath();
        ctx.arc(bx + Math.sin((t + i) * 0.6) * 14, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "contagem": {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);
      const n = 3 - Math.floor(t % 3);
      ctx.fillStyle = o.c1;
      ctx.font = `800 ${Math.round(h * 0.62)}px "Space Grotesk", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const pulse = 1 + 0.1 * Math.sin((t % 1) * Math.PI);
      ctx.translate(w / 2, h / 2);
      ctx.scale(pulse, pulse);
      ctx.fillText(String(n), 0, 0);
      break;
    }
    case "cartao": {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, o.c1);
      g.addColorStop(1, o.c2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, h / 2 - h * 0.13, w, h * 0.26);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.round(h * 0.11)}px "Space Grotesk", sans-serif`;
      ctx.fillText(o.text || "editzz", w / 2, h / 2);
      break;
    }
    case "barras": {
      const cols = ["#c0c0c0", "#c0c000", "#00c0c0", "#00c000", "#c000c0", "#c00000", "#0000c0"];
      const bw = w / cols.length;
      cols.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(i * bw, 0, bw + 1, h * 0.72);
      });
      ctx.fillStyle = "#101010";
      ctx.fillRect(0, h * 0.72, w, h * 0.28);
      const patches: [string, number][] = [["#ffffff", 0.16], ["#000000", 0.06], ["#c000c0", 0.5], ["#00c000", 0.72], ["#0000c0", 0.86]];
      patches.forEach(([c, x]) => {
        ctx.fillStyle = c;
        ctx.fillRect(w * x, h * 0.76, w * 0.1, h * 0.2);
      });
      break;
    }
    case "neon": {
      ctx.fillStyle = "#04030a";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        const p = ((i / 26 + (t * 0.18) % (1 / 26)) % 1) ** 2;
        const radius = p * Math.max(w, h) * 1.2 + 8;
        ctx.strokeStyle = i % 2 ? o.c1 : o.c2;
        ctx.lineWidth = 1 + p * 5;
        ctx.globalAlpha = 0.25 + p * 0.75;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 4 + 2 * Math.sin(t * 4), 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "codigo": {
      ctx.fillStyle = "#020502";
      ctx.fillRect(0, 0, w, h);
      const r = rng(o.seed);
      const size = 22;
      ctx.font = `600 ${size}px "JetBrains Mono", monospace`;
      for (let x = 0; x < w; x += size * 1.2) {
        const speed = 26 + r() * 90;
        const offset = r() * h;
        const chars = 16 + Math.floor(r() * 14);
        for (let i = 0; i < chars; i++) {
          const y = ((offset + i * size + t * speed) % (h + size * chars)) - size * chars * 0.3;
          if (y < -size || y > h + size) continue;
          const head = i === 0;
          ctx.fillStyle = head ? "#d1fae5" : `rgba(34,197,94,${Math.max(0.08, 0.9 - i / chars)})`;
          ctx.fillText(String.fromCharCode(0x30a0 + Math.floor(r() * 90)), x, y);
        }
      }
      break;
    }
    case "plasma": {
      const step = 8;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const v =
            Math.sin(x / 90 + t) +
            Math.sin(y / 70 - t * 0.8) +
            Math.sin((x + y) / 130 + t * 1.3) +
            Math.sin(Math.hypot(x - w / 2, y - h / 2) / 60 - t * 1.6);
          const hue = (v / 4 + 0.5) * 300;
          ctx.fillStyle = `hsl(${hue}, 82%, ${34 + 16 * Math.sin(v)}%)`;
          ctx.fillRect(x, y, step + 1, step + 1);
        }
      }
      break;
    }
    case "bokeh": {
      ctx.fillStyle = "#070311";
      ctx.fillRect(0, 0, w, h);
      const r = rng(o.seed + 3);
      for (let i = 0; i < 46; i++) {
        const bx = r() * w;
        const by = r() * h;
        const size = 16 + r() * 90;
        const sp = 8 + r() * 26;
        const y = (by - t * sp) % (h + 200);
        const g = ctx.createRadialGradient(bx, y, 0, bx, y, size);
        g.addColorStop(0, `${i % 2 ? o.c1 : o.c2}cc`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bx, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "ondas": {
      ctx.fillStyle = "#06070f";
      ctx.fillRect(0, 0, w, h);
      const bars = 64;
      const bw = w / bars;
      for (let i = 0; i < bars; i++) {
        const v = Math.abs(Math.sin(i * 0.35 + t * 3)) * 0.75 + Math.abs(Math.sin(i * 0.11 - t * 1.7)) * 0.25;
        const bh = v * h * 0.62;
        const g = ctx.createLinearGradient(0, h - bh, 0, h);
        g.addColorStop(0, o.c2);
        g.addColorStop(1, o.c1);
        ctx.fillStyle = g;
        ctx.fillRect(i * bw + 2, h - bh, bw - 4, bh);
      }
      break;
    }
    case "grade": {
      ctx.fillStyle = "#0b0b12";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.09)";
      ctx.lineWidth = 1;
      const gap = 40;
      const off = (t * 12) % gap;
      for (let x = -gap; x < w + gap; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x + off, 0);
        ctx.lineTo(x + off, h);
        ctx.stroke();
      }
      for (let y = -gap; y < h + gap; y += gap) {
        ctx.beginPath();
        ctx.moveTo(0, y + off);
        ctx.lineTo(w, y + off);
        ctx.stroke();
      }
      break;
    }
    case "papel": {
      ctx.fillStyle = "#f4f1ea";
      ctx.fillRect(0, 0, w, h);
      const r = rng(o.seed + 11);
      for (let i = 0; i < 26000; i++) {
        const x = r() * w;
        const y = r() * h;
        const a = 0.02 + r() * 0.06;
        ctx.fillStyle = r() > 0.5 ? `rgba(120,110,95,${a})` : `rgba(255,255,255,${a})`;
        ctx.fillRect(x, y, 1.4, 1.4);
      }
      for (let i = 0; i < 60; i++) {
        ctx.strokeStyle = `rgba(150,140,120,${0.03 + r() * 0.05})`;
        ctx.beginPath();
        const y = r() * h;
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y + r() * 20 - 10, w * 0.6, y + r() * 20 - 10, w, y);
        ctx.stroke();
      }
      break;
    }
  }
  ctx.restore();
}

/** Gera uma imagem (dataURL) de um quadro do gerador. */
export function generateImageDataUrl(kind: GenKind, o: GenOptions, quality = 0.92): string {
  const c = createCanvas(o.width, o.height);
  const ctx = ctx2d(c);
  renderGenerator(kind, ctx, 0, o);
  return c.toDataURL("image/jpeg", quality);
}

export function pickVideoMime(): string {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  if (typeof MediaRecorder === "undefined") return "";
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

/**
 * Grava um clipe de vídeo de verdade a partir de um gerador procedural.
 * A gravação acompanha o relógio real (é assim que o MediaRecorder funciona).
 */
export async function generateVideoBlob(
  kind: GenKind,
  o: GenOptions,
  seconds: number,
  onProgress?: (p: number) => void,
  fps = 30
): Promise<Blob | null> {
  const mime = pickVideoMime();
  if (!mime) return null;
  const canvas = createCanvas(o.width, o.height);
  const ctx = ctx2d(canvas);
  const stream = canvas.captureStream(fps);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Math.min(14_000_000, o.width * o.height * 0.16) });
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<Blob>((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
  });
  rec.start(120);
  const t0 = performance.now();
  await new Promise<void>((resolve) => {
    const loop = () => {
      const t = (performance.now() - t0) / 1000;
      renderGenerator(kind, ctx, t, o);
      onProgress?.(Math.min(1, t / seconds));
      if (t >= seconds) resolve();
      else requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  rec.stop();
  const blob = await done;
  stream.getTracks().forEach((t) => t.stop());
  return blob;
}

/** Cria um asset do acervo a partir de uma imagem gerada. */
export function assetFromImageDataUrl(name: string, dataUrl: string, width: number, height: number): MediaAsset {
  return {
    id: uid("asset"),
    name,
    kind: "image",
    url: dataUrl,
    width,
    height,
    duration: 5,
    hasAudio: false,
    origin: "gerado",
    thumb: dataUrl,
    createdAt: Date.now(),
  };
}

/** Cria um asset do acervo a partir de um blob de vídeo gravado. */
export async function assetFromVideoBlob(name: string, blob: Blob, generator: string): Promise<MediaAsset> {
  const url = URL.createObjectURL(blob);
  const asset: MediaAsset = {
    id: uid("asset"),
    name,
    kind: "video",
    url,
    width: 0,
    height: 0,
    duration: 0,
    hasAudio: false,
    origin: "gerado",
    generator,
    sizeBytes: blob.size,
    createdAt: Date.now(),
  };
  const el = document.createElement("video");
  el.src = url;
  el.muted = true;
  await new Promise<void>((resolve) => {
    el.addEventListener("loadedmetadata", () => resolve(), { once: true });
    el.addEventListener("error", () => resolve(), { once: true });
    setTimeout(resolve, 3000);
  });
  asset.width = el.videoWidth || 1280;
  asset.height = el.videoHeight || 720;
  asset.duration = isFinite(el.duration) ? el.duration : 5;
  asset.thumb = await pool.thumbnail(asset).catch(() => "");
  return asset;
}

/* ───────────── pacote de demonstração ───────────── */

export async function buildStarterAssets(): Promise<{ images: MediaAsset[]; audio: MediaAsset | null }> {
  const images: MediaAsset[] = [];
  const specs: [string, GenKind, Partial<GenOptions>][] = [
    ["Fundo gradiente (gerado)", "gradiente", { c1: "#d7a45a", c2: "#526f6c" }],
    ["Cartão de abertura", "cartao", { c1: "#171a1c", c2: "#526f6c", text: "editzz" }],
    ["Bokeh colorido", "bokeh", { c1: "#d58f73", c2: "#78aaa5" }],
    ["Grade técnica", "grade", {}],
    ["Plasma abstrato", "plasma", {}],
  ];
  specs.forEach(([name, kind, patch]) => {
    const o = { ...defaultGenOptions(), width: 1600, height: 900, ...patch };
    const url = generateImageDataUrl(kind, o, 0.9);
    images.push(assetFromImageDataUrl(name, url, o.width, o.height));
  });
  return { images, audio: null };
}
