import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let seq = 0;
export function uid(prefix = "id") {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number) => (b === a ? 0 : (v - a) / (b - a));
export const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

export function fmtTime(s: number, withFrames = false, fps = 30) {
  const sign = s < 0 ? "-" : "";
  s = Math.abs(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const f = Math.floor((s % 1) * fps);
  const base = h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return withFrames ? `${sign}${base}:${String(f).padStart(2, "0")}` : `${sign}${base}`;
}

export function fmtBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function fmtDuration(sec: number) {
  if (!isFinite(sec) || sec <= 0) return "—";
  return `${sec.toFixed(sec < 10 ? 1 : 0)}s`;
}

export const clamp01 = (v: number) => clamp(v, 0, 1);

export function download(blobOrUrl: Blob | string, filename: string) {
  const url = typeof blobOrUrl === "string" ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (typeof blobOrUrl !== "string") setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h || "000000", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number) {
  const f = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
}

export function readableOn(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0b0b12" : "#ffffff";
}

export function safeAsync<T>(fn: () => Promise<T>): Promise<T | null> {
  return fn().catch(() => null);
}

export function debounce<F extends (...args: never[]) => void>(fn: F, ms = 120) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<F>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function createCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

export function ctx2d(canvas: HTMLCanvasElement) {
  const c = canvas.getContext("2d", { willReadFrequently: false });
  if (!c) throw new Error("Canvas 2D não disponível");
  return c;
}

export async function fileToAssetUrl(file: File) {
  return URL.createObjectURL(file);
}

export function isVideoFile(f: File) {
  return f.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogv|avi|mkv)$/i.test(f.name);
}
export function isImageFile(f: File) {
  return f.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i.test(f.name);
}
export function isAudioFile(f: File) {
  return f.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac|opus|weba)$/i.test(f.name);
}

export function pickFiles(accept: string, multiple = true): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    input.onchange = () => resolve(Array.from(input.files ?? []));
    input.click();
  });
}

export function slugifyName(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "editzz"
  );
}

export function timestampName(ext: string) {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}` + (ext ? `.${ext}` : "");
}

/** Simple event emitter for the media/audio engines. */
export class Emitter<T extends Record<string, unknown>> {
  private map = new Map<keyof T, Set<(v: never) => void>>();
  on<K extends keyof T>(k: K, fn: (v: T[K]) => void) {
    const set = this.map.get(k) ?? new Set();
    set.add(fn as (v: never) => void);
    this.map.set(k, set);
    return () => set.delete(fn as (v: never) => void);
  }
  emit<K extends keyof T>(k: K, v: T[K]) {
    this.map.get(k)?.forEach((fn) => (fn as (x: T[K]) => void)(v));
  }
}
