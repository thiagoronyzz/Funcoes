import { createCanvas, ctx2d, uid } from "@/lib/utils";
import { putMedia } from "@/core/db";
import type { MediaAsset, MediaKind } from "./model";

/**
 * MediaPool — mantém elementos de vídeo/imagem/áudio decodificados e
 * prontos para o motor de render, além de gerar miniaturas e formas de onda.
 */
class MediaPool {
  private videos = new Map<string, HTMLVideoElement>();
  private images = new Map<string, HTMLImageElement>();
  private buffers = new Map<string, AudioBuffer>();
  private thumbs = new Map<string, string>();
  private peaksCache = new Map<string, number[]>();

  video(asset: MediaAsset): HTMLVideoElement {
    let el = this.videos.get(asset.id);
    if (!el) {
      el = document.createElement("video");
      el.src = asset.url;
      el.muted = true;
      el.playsInline = true;
      el.preload = "auto";
      el.crossOrigin = "anonymous";
      el.style.position = "absolute";
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      el.style.width = "1px";
      el.style.height = "1px";
      document.body.appendChild(el);
      this.videos.set(asset.id, el);
    }
    if (el.src !== asset.url && asset.url) {
      el.src = asset.url;
      el.load();
    }
    return el;
  }

  image(asset: MediaAsset): HTMLImageElement | null {
    const cached = this.images.get(asset.id);
    if (cached) return cached.complete ? cached : null;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = asset.url;
    this.images.set(asset.id, img);
    return img.complete ? img : null;
  }

  /** Aguarda a imagem carregar (ou devolve o que já existe). */
  async ensureImage(asset: MediaAsset): Promise<HTMLImageElement> {
    const existing = this.images.get(asset.id);
    const img = existing ?? new Image();
    if (!existing) {
      img.crossOrigin = "anonymous";
      img.src = asset.url;
      this.images.set(asset.id, img);
    }
    if (img.complete && img.naturalWidth) return img;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
    return img;
  }

  /** Prepara o vídeo no tempo pedido; em reprodução contínua deixa rolar sozinho. */
  prepareVideo(asset: MediaAsset, time: number, playing: boolean, playbackRate = 1): HTMLVideoElement {
    const el = this.video(asset);
    const target = Math.max(0, Math.min(time, (asset.duration || el.duration || 0) - 0.02));
    if (playing && !el.paused && Math.abs(el.playbackRate - playbackRate) > 0.01) el.playbackRate = playbackRate;
    if (playing) {
      if (Math.abs(el.currentTime - target) > 0.22) {
        try {
          el.currentTime = target;
        } catch {
          /* ignora */
        }
      }
      if (el.paused) void el.play().catch(() => undefined);
    } else {
      if (!el.paused) el.pause();
      if (Math.abs(el.currentTime - target) > 0.015) {
        try {
          el.currentTime = target;
        } catch {
          /* ignora */
        }
      }
    }
    return el;
  }

  async seekVideo(asset: MediaAsset, time: number): Promise<HTMLVideoElement> {
    const el = this.video(asset);
    if (!el.paused) el.pause();
    const target = Math.max(0, Math.min(time, (asset.duration || el.duration || 0) - 0.01));
    if (Math.abs(el.currentTime - target) < 0.01 && el.readyState >= 2) return el;
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        el.removeEventListener("seeked", finish);
        resolve();
      };
      el.addEventListener("seeked", finish, { once: true });
      try {
        el.currentTime = target;
      } catch {
        finish();
      }
      setTimeout(finish, 420);
    });
    return el;
  }

  pauseAll() {
    this.videos.forEach((v) => !v.paused && v.pause());
  }

  async decodeAudio(asset: MediaAsset): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(asset.id);
    if (cached) return cached;
    try {
      const res = await fetch(asset.url);
      const arr = await res.arrayBuffer();
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const buf = await ctx.decodeAudioData(arr.slice(0));
      void ctx.close();
      this.buffers.set(asset.id, buf);
      return buf;
    } catch {
      return null;
    }
  }

  peaksFor(buffer: AudioBuffer, count = 220): number[] {
    const key = `${buffer.length}:${count}`;
    const cached = this.peaksCache.get(key);
    if (cached) return cached;
    const chan = buffer.getChannelData(0);
    const step = Math.max(1, Math.floor(chan.length / count));
    const out: number[] = [];
    for (let i = 0; i < count; i++) {
      let max = 0;
      const from = i * step;
      for (let j = 0; j < step; j += 3) {
        const v = Math.abs(chan[from + j] ?? 0);
        if (v > max) max = v;
      }
      out.push(max);
    }
    this.peaksCache.set(key, out);
    return out;
  }

  async thumbnail(asset: MediaAsset, at?: number): Promise<string> {
    const cached = this.thumbs.get(asset.id);
    if (cached) return cached;
    if (asset.kind === "image") {
      const img = await this.ensureImage(asset);
      const c = createCanvas(240, 240 * (img.naturalHeight / Math.max(1, img.naturalWidth)) || 240);
      const g = ctx2d(c);
      g.drawImage(img, 0, 0, c.width, c.height);
      const url = c.toDataURL("image/jpeg", 0.7);
      this.thumbs.set(asset.id, url);
      return url;
    }
    if (asset.kind === "video") {
      const el = await this.seekVideo(asset, at ?? Math.min(0.6, (asset.duration || 2) / 3));
      const c = createCanvas(240, 240 * (el.videoHeight / Math.max(1, el.videoWidth)) || 135);
      const g = ctx2d(c);
      try {
        g.drawImage(el, 0, 0, c.width, c.height);
      } catch {
        /* vídeo ainda sem quadro */
      }
      const url = c.toDataURL("image/jpeg", 0.7);
      this.thumbs.set(asset.id, url);
      return url;
    }
    return "";
  }

  /** Gera a forma de onda em dataURL para desenhar na timeline. */
  async waveformUrl(asset: MediaAsset, width = 900, height = 90, color = "#22d3ee"): Promise<string> {
    const buf = await this.decodeAudio(asset);
    if (!buf) return "";
    const peaks = this.peaksFor(buf, width);
    const c = createCanvas(width, height);
    const g = ctx2d(c);
    g.fillStyle = "rgba(255,255,255,0.03)";
    g.fillRect(0, 0, width, height);
    g.strokeStyle = color;
    g.lineWidth = 1;
    g.beginPath();
    for (let i = 0; i < peaks.length; i++) {
      const v = peaks[i] * (height / 2 - 2);
      g.moveTo(i + 0.5, height / 2 - v);
      g.lineTo(i + 0.5, height / 2 + v);
    }
    g.stroke();
    return c.toDataURL("image/png");
  }

  /** Extrai informações do arquivo e cria o registro de mídia do editzz. */
  async registerFile(file: File): Promise<MediaAsset | null> {
    const kind: MediaKind | null = file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("audio/")
        ? "audio"
        : file.type.startsWith("image/")
          ? "image"
          : null;
    if (!kind) return null;
    const url = URL.createObjectURL(file);
    const asset: MediaAsset = {
      id: uid("asset"),
      name: file.name.replace(/\.[^.]+$/, ""),
      kind,
      url,
      width: 0,
      height: 0,
      duration: 0,
      hasAudio: kind === "audio",
      sizeBytes: file.size,
      origin: "arquivo",
      createdAt: Date.now(),
    };
    if (kind === "image") {
      const img = await this.ensureImage(asset);
      asset.width = img.naturalWidth;
      asset.height = img.naturalHeight;
      asset.duration = 5;
    } else if (kind === "video") {
      const el = this.video(asset);
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        el.addEventListener("loadedmetadata", done, { once: true });
        el.addEventListener("error", done, { once: true });
        setTimeout(done, 2500);
      });
      asset.width = el.videoWidth || 1280;
      asset.height = el.videoHeight || 720;
      asset.duration = isFinite(el.duration) ? el.duration : 5;
      asset.hasAudio = true;
    } else {
      const buf = await this.decodeAudio(asset);
      asset.duration = buf?.duration ?? 5;
      asset.hasAudio = true;
    }
    asset.thumb = await this.thumbnail(asset).catch(() => "");
    return asset;
  }

  /** Importa arquivos para o acervo e persiste no navegador. */
  async importFiles(files: File[]): Promise<MediaAsset[]> {
    const out: MediaAsset[] = [];
    for (const f of files) {
      const asset = await this.registerFile(f);
      if (asset) out.push(asset);
    }
    return out;
  }
}

export const pool = new MediaPool();

/**
 * Importa arquivos e guarda os bytes no IndexedDB, para que o projeto possa
 * ser reaberto depois com a mídia no lugar (o acervo guarda só metadados).
 */
export async function importFilesPersist(files: File[]): Promise<MediaAsset[]> {
  const out: MediaAsset[] = [];
  for (const file of files) {
    const asset = await pool.registerFile(file);
    if (!asset) continue;
    out.push(asset);
    void putMedia(asset.id, file, { id: asset.id, name: asset.name, kind: asset.kind });
  }
  return out;
}

/** Entrada de microfone para gravação de narração / voz. */
export async function recordMicrophone(): Promise<{ start: () => void; stop: () => Promise<Blob>; cancel: () => void } | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    return {
      start: () => rec.start(),
      stop: () =>
        new Promise<Blob>((resolve) => {
          rec.onstop = () => {
            stream.getTracks().forEach((t) => t.stop());
            resolve(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
          };
          rec.stop();
        }),
      cancel: () => {
        rec.stop();
        stream.getTracks().forEach((t) => t.stop());
      },
    };
  } catch {
    return null;
  }
}

/** Captura de tela do usuário (getDisplayMedia) para gravar demonstrações. */
export async function recordScreen(): Promise<{ start: () => void; stop: () => Promise<Blob> } | null> {
  try {
    const stream = await (navigator.mediaDevices as MediaDevices & { getDisplayMedia: (c: DisplayMediaStreamOptions) => Promise<MediaStream> }).getDisplayMedia({
      video: true,
      audio: true,
    });
    const rec = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    return {
      start: () => rec.start(),
      stop: () =>
        new Promise<Blob>((resolve) => {
          rec.onstop = () => {
            stream.getTracks().forEach((t) => t.stop());
            resolve(new Blob(chunks, { type: rec.mimeType || "video/webm" }));
          };
          rec.stop();
        }),
    };
  } catch {
    return null;
  }
}
