import { clamp, createCanvas, ctx2d, download } from "@/lib/utils";
import { ProjectAudioMixer } from "./audio";
import { renderFrame } from "./engine";
import { pickVideoMime } from "./generate";
import type { MediaAsset, Project } from "./model";
import { clipEnd } from "./model";

export interface ExportConfig {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  format: "auto" | "webm" | "mp4";
  start: number;
  end: number;
  audio: boolean;
}

export interface ExportProgress {
  phase: "preparando" | "gravando" | "finalizando" | "concluído" | "erro";
  progress: number;
  message: string;
}

function pickMime(format: ExportConfig["format"]): string {
  const auto = pickVideoMime();
  if (format === "mp4") {
    const mp4 = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4"].find(
      (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)
    );
    return mp4 ?? auto;
  }
  if (format === "webm") {
    const webm = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(
      (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)
    );
    return webm ?? auto;
  }
  return auto;
}

export function exportCapabilities() {
  const mime = pickVideoMime();
  return {
    supported: !!mime && typeof MediaRecorder !== "undefined",
    mp4: typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/mp4"),
    webm: typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/webm"),
    mime,
  };
}

/**
 * Exportador de vídeo em tempo real: renderiza o projeto quadro a quadro no
 * canvas e grava a saída (vídeo + áudio mixado) com MediaRecorder.
 */
export class VideoExporter {
  private cancelled = false;
  private recorder: MediaRecorder | null = null;
  private mixer: ProjectAudioMixer | null = null;

  cancel() {
    this.cancelled = true;
    // corta o áudio imediatamente; o quadro atual termina de ser gravado
    if (this.recorder?.state === "recording") this.mixer?.stop();
  }

  async run(
    project: Project,
    assets: MediaAsset[],
    config: ExportConfig,
    onProgress: (p: ExportProgress) => void
  ): Promise<Blob | null> {
    const mime = pickMime(config.format);
    if (!mime) {
      onProgress({ phase: "erro", progress: 0, message: "Este navegador não suporta gravação de vídeo (MediaRecorder)." });
      return null;
    }
    const duration = clamp(config.end - config.start, 0.2, 3600);
    const canvas = createCanvas(config.width, config.height);
    const ctx = ctx2d(canvas);

    onProgress({ phase: "preparando", progress: 0, message: "Preparando quadro inicial…" });
    await renderFrame(canvas, {
      project,
      assets,
      time: config.start,
      width: config.width,
      height: config.height,
      playing: false,
    });

    const videoStream = canvas.captureStream(config.fps);
    const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()];

    if (config.audio) {
      this.mixer = new ProjectAudioMixer();
      await this.mixer.start(project, assets, config.start);
      const audioStream = this.mixer.getStream();
      if (audioStream) tracks.push(...audioStream.getAudioTracks());
    }

    const stream = new MediaStream(tracks);
    const rec = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: config.bitrate,
      audioBitsPerSecond: 128_000,
    });
    this.recorder = rec;
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const stopped = new Promise<Blob>((resolve) => {
      rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
    });

    rec.start(250);
    const t0 = performance.now();
    onProgress({ phase: "gravando", progress: 0, message: "Gravando… mantenha esta aba em primeiro plano." });

    await new Promise<void>((resolve) => {
      const loop = () => {
        if (this.cancelled) {
          resolve();
          return;
        }
        const elapsed = (performance.now() - t0) / 1000;
        const time = config.start + elapsed;
        if (time >= config.end - 0.001) {
          resolve();
          return;
        }
        void renderFrame(canvas, {
          project,
          assets,
          time,
          width: config.width,
          height: config.height,
          playing: true,
        });
        onProgress({ phase: "gravando", progress: elapsed / duration, message: `Gravando ${elapsed.toFixed(1)}s de ${duration.toFixed(1)}s` });
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });

    onProgress({ phase: "finalizando", progress: 1, message: "Fechando arquivo…" });
    this.mixer?.stop();
    const blob = await new Promise<Blob>((resolve) => {
      rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
      rec.stop();
    });
    videoStream.getTracks().forEach((t) => t.stop());
    stopped.then(() => undefined).catch(() => undefined);
    this.recorder = null;
    void ctx;
    onProgress({
      phase: "concluído",
      progress: 1,
      message: `Pronto · ${(blob.size / 1024 / 1024).toFixed(1)} MB · ${mime.includes("mp4") ? "MP4" : "WebM"}`,
    });
    return blob;
  }
}

/** Exporta o quadro atual como PNG em alta resolução. */
export async function exportFrame(
  project: Project,
  assets: MediaAsset[],
  time: number,
  width = project.width,
  height = project.height
) {
  const canvas = createCanvas(width, height);
  await renderFrame(canvas, { project, assets, time, width, height, playing: false });
  canvas.toBlob((blob) => {
    if (blob) download(blob, `${project.name.replace(/\s+/g, "-").toLowerCase()}-quadro.png`);
  }, "image/png");
}

/** Monta uma folha de contato / storyboard com N quadros do projeto. */
export async function exportStoryboard(
  project: Project,
  assets: MediaAsset[],
  options: { count?: number; cols?: number; thumbWidth?: number } = {}
) {
  const count = options.count ?? 12;
  const cols = options.cols ?? 4;
  const tw = options.thumbWidth ?? 480;
  const th = Math.round((tw * project.height) / project.width);
  const rows = Math.ceil(count / cols);
  const gap = 12;
  const labelH = 34;
  const sheet = createCanvas(cols * tw + gap * (cols + 1), rows * (th + labelH) + gap * (rows + 1));
  const ctx = ctx2d(sheet);
  ctx.fillStyle = "#0b0b12";
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  const total = Math.max(...project.clips.map((c) => clipEnd(c)), 1);
  const frame = createCanvas(tw, th);
  for (let i = 0; i < count; i++) {
    const t = (i / count) * total;
    await renderFrame(frame, { project, assets, time: t, width: tw, height: th, playing: false });
    const cx = gap + (i % cols) * (tw + gap);
    const cy = gap + Math.floor(i / cols) * (th + labelH + gap);
    ctx.drawImage(frame, cx, cy, tw, th);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "16px Inter, sans-serif";
    ctx.fillText(`${String(i + 1).padStart(2, "0")} · ${t.toFixed(1)}s`, cx + 4, cy + th + 22);
  }
  ctx.fillStyle = "rgba(168,85,247,0.9)";
  ctx.font = "600 18px Inter, sans-serif";
  ctx.fillText(`editzz · ${project.name} · ${count} quadros`, gap, sheet.height - gap);
  await new Promise<void>((resolve) =>
    sheet.toBlob((blob) => {
      if (blob) download(blob, `${project.name.replace(/\s+/g, "-").toLowerCase()}-storyboard.png`);
      resolve();
    }, "image/png")
  );
}

/** Gera legenda SRT a partir dos clipes de texto do projeto. */
export function buildSrt(project: Project): string {
  const texts = project.clips.filter((c) => c.kind === "text" && c.text?.content).sort((a, b) => a.start - b.start);
  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.round((s % 1) * 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
  };
  return texts
    .map((c, i) => `${i + 1}\n${fmt(c.start)} --> ${fmt(clipEnd(c))}\n${c.text?.content ?? ""}\n`)
    .join("\n");
}

export function exportSrt(project: Project) {
  const srt = buildSrt(project);
  if (!srt.trim()) return false;
  download(new Blob([srt], { type: "text/plain;charset=utf-8" }), `${project.name.replace(/\s+/g, "-").toLowerCase()}.srt`);
  return true;
}
