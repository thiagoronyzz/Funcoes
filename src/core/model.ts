import {
  defaultAdjustments,
  type Adjustments,
  type EasingId,
  type KeyframeProp,
} from "@/lib/presets";
import { uid } from "@/lib/utils";

/* ───────────────────────────── mídia ───────────────────────────── */

export type MediaKind = "video" | "image" | "audio";

export interface MediaAsset {
  id: string;
  name: string;
  kind: MediaKind;
  url: string;
  width: number;
  height: number;
  duration: number;
  hasAudio: boolean;
  thumb?: string;
  sizeBytes?: number;
  origin: "arquivo" | "amostra" | "gerado" | "gravação";
  generator?: string;
  peaks?: number[];
  createdAt: number;
}

/* ───────────────────────────── clipes ───────────────────────────── */

export type ClipKind = "video" | "image" | "audio" | "text" | "shape" | "sticker" | "adjust" | "color";

export interface Keyframe {
  t: number;
  v: number;
  e: EasingId;
}
export type Keyframes = Partial<Record<KeyframeProp, Keyframe[]>>;

export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  flipH: boolean;
  flipV: boolean;
}

export interface Crop {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface EffectInstance {
  id: string;
  name: string;
  enabled: boolean;
  params: Record<string, number>;
}

export interface ChromaKey {
  enabled: boolean;
  color: string;
  tolerance: number;
  softness: number;
  spill: number;
  removeMode: "auto" | "chroma";
}

export type MaskShapeId =
  | "none" | "rect" | "circle" | "linear" | "radial" | "heart" | "star"
  | "diagonal" | "split_l" | "split_r" | "triangle" | "blinds";

export interface MaskCfg {
  shape: MaskShapeId;
  invert: boolean;
  feather: number;
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

export interface AudioCfg {
  volume: number;
  muted: boolean;
  fadeIn: number;
  fadeOut: number;
  pitch: number;
  voice: string;
  denoise: number;
  highpass: number;
  lowpass: number;
  gain: number;
  ducking: boolean;
}

export interface TextStyle {
  content: string;
  font: string;
  weight: number;
  size: number;
  color: string;
  gradientEnabled: boolean;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  align: "left" | "center" | "right";
  letterSpacing: number;
  lineHeight: number;
  uppercase: boolean;
  italic: boolean;
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowX: number;
  shadowY: number;
  bgEnabled: boolean;
  bgColor: string;
  bgOpacity: number;
  padding: number;
  radius: number;
  animation: string;
  animationSpeed: number;
  highlight: number;
}

export interface ShapeCfg {
  shape: string;
  fill: string;
  fill2: string;
  gradient: boolean;
  strokeColor: string;
  strokeWidth: number;
  radius: number;
  count: number;
  speed: number;
  text: string;
}

export interface TransitionCfg {
  id: string;
  duration: number;
}

export interface Clip {
  id: string;
  kind: ClipKind;
  assetId?: string;
  trackId: string;
  name: string;
  start: number;
  duration: number;
  in: number;
  speed: number;
  reverse: boolean;
  freeze: boolean;
  speedCurve: string;
  curveAmount: number;
  opacity: number;
  blend: string;
  transform: Transform;
  crop: Crop;
  adjust: Adjustments;
  look: string;
  lookIntensity: number;
  effects: EffectInstance[];
  chroma: ChromaKey;
  mask: MaskCfg;
  stabilize: number;
  audio: AudioCfg;
  text?: TextStyle;
  shape?: ShapeCfg;
  keyframes: Keyframes;
  transitionIn?: TransitionCfg;
  transitionOut?: TransitionCfg;
  groupId?: string;
  tag: string;
  color?: string;
  locked: boolean;
}

export type TrackKind = "video" | "overlay" | "text" | "audio" | "adjust";

export interface Track {
  id: string;
  name: string;
  kind: TrackKind;
  height: number;
  muted: boolean;
  hidden: boolean;
  locked: boolean;
  solo: boolean;
}

export interface Marker {
  id: string;
  t: number;
  label: string;
  color: string;
  kind: "manual" | "batida" | "cena" | "sugestão";
}

export interface CanvasBg {
  type: "color" | "gradient" | "image" | "blur" | "pattern" | "transparent";
  color: string;
  from: string;
  to: string;
  angle: number;
  blurAmount: number;
  pattern: string;
  opacity: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  width: number;
  height: number;
  fps: number;
  tracks: Track[];
  clips: Clip[];
  markers: Marker[];
  bg: CanvasBg;
  watermark: { enabled: boolean; text: string; color: string; size: number; opacity: number; pos: string };
  inPoint: number | null;
  outPoint: number | null;
}

/* ───────────────────────────── padrões ───────────────────────────── */

export const TAG_COLORS = ["#a855f7", "#22d3ee", "#f472b6", "#a3e635", "#fbbf24", "#fb7185", "#34d399", "#818cf8"];

export const defaultTransform = (): Transform => ({ x: 0, y: 0, scale: 1, rotate: 0, flipH: false, flipV: false });
export const defaultCrop = (): Crop => ({ top: 0, right: 0, bottom: 0, left: 0 });
export const defaultChroma = (): ChromaKey => ({
  enabled: false,
  color: "#00b140",
  tolerance: 32,
  softness: 12,
  spill: 20,
  removeMode: "chroma",
});
export const defaultMask = (): MaskCfg => ({
  shape: "none",
  invert: false,
  feather: 12,
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
});
export const defaultAudioCfg = (): AudioCfg => ({
  volume: 1,
  muted: false,
  fadeIn: 0,
  fadeOut: 0,
  pitch: 0,
  voice: "none",
  denoise: 0,
  highpass: 0,
  lowpass: 0,
  gain: 0,
  ducking: false,
});

export const defaultTextStyle = (content = "Seu texto aqui"): TextStyle => ({
  content,
  font: "Space Grotesk",
  weight: 700,
  size: 72,
  color: "#ffffff",
  gradientEnabled: false,
  gradientFrom: "#d7a45a",
  gradientTo: "#78aaa5",
  gradientAngle: 45,
  align: "center",
  letterSpacing: 0,
  lineHeight: 1.2,
  uppercase: false,
  italic: false,
  strokeEnabled: false,
  strokeColor: "#000000",
  strokeWidth: 6,
  shadowEnabled: true,
  shadowColor: "#000000",
  shadowBlur: 14,
  shadowX: 0,
  shadowY: 4,
  bgEnabled: false,
  bgColor: "#000000",
  bgOpacity: 0.6,
  padding: 14,
  radius: 10,
  animation: "fade_in",
  animationSpeed: 1,
  highlight: -1,
});

export const defaultShapeCfg = (shape = "rect"): ShapeCfg => ({
  shape,
  fill: "#d7a45a",
  fill2: "#78aaa5",
  gradient: false,
  strokeColor: "#ffffff",
  strokeWidth: 0,
  radius: 12,
  count: 24,
  speed: 1,
  text: "",
});

interface ClipInit extends Partial<Clip> {
  kind: ClipKind;
  trackId: string;
  start: number;
  duration: number;
}

export function createClip(init: ClipInit): Clip {
  const base: Clip = {
    id: uid("clip"),
    kind: init.kind,
    assetId: init.assetId,
    trackId: init.trackId,
    name: init.name ?? "Clipe",
    start: init.start,
    duration: init.duration,
    in: init.in ?? 0,
    speed: 1,
    reverse: false,
    freeze: false,
    speedCurve: "linear",
    curveAmount: 1,
    opacity: 1,
    blend: "normal",
    transform: defaultTransform(),
    crop: defaultCrop(),
    adjust: defaultAdjustments(),
    look: "none",
    lookIntensity: 100,
    effects: [],
    chroma: defaultChroma(),
    mask: defaultMask(),
    stabilize: 0,
    audio: defaultAudioCfg(),
    keyframes: {},
    tag: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
    locked: false,
  };
  return {
    ...base,
    ...init,
    id: init.id ?? base.id,
    transform: { ...base.transform, ...(init.transform ?? {}) },
    crop: { ...base.crop, ...(init.crop ?? {}) },
    adjust: { ...base.adjust, ...(init.adjust ?? {}) },
    chroma: { ...base.chroma, ...(init.chroma ?? {}) },
    mask: { ...base.mask, ...(init.mask ?? {}) },
    audio: { ...base.audio, ...(init.audio ?? {}) },
    keyframes: init.keyframes ?? {},
    effects: init.effects ?? [],
  };
}

export function createTextClip(trackId: string, start: number, duration = 3, content = "Seu texto aqui"): Clip {
  const c = createClip({ kind: "text", trackId, start, duration, name: content.slice(0, 22) || "Texto" });
  c.text = defaultTextStyle(content);
  return c;
}

export function createShapeClip(trackId: string, start: number, duration = 3, shape = "rect"): Clip {
  const c = createClip({ kind: "shape", trackId, start, duration, name: `Forma: ${shape}` });
  c.shape = defaultShapeCfg(shape);
  return c;
}

export function createDefaultProject(name = "Projeto sem título", width = 1920, height = 1080, fps = 30): Project {
  const now = Date.now();
  const videoTrack: Track = { id: uid("trk"), name: "Vídeo 1", kind: "video", height: 62, muted: false, hidden: false, locked: false, solo: false };
  const overlay: Track = { id: uid("trk"), name: "Sobreposição", kind: "overlay", height: 52, muted: false, hidden: false, locked: false, solo: false };
  const text: Track = { id: uid("trk"), name: "Texto", kind: "text", height: 52, muted: false, hidden: false, locked: false, solo: false };
  const audio: Track = { id: uid("trk"), name: "Áudio 1", kind: "audio", height: 54, muted: false, hidden: false, locked: false, solo: false };
  return {
    id: uid("prj"),
    name,
    createdAt: now,
    updatedAt: now,
    width,
    height,
    fps,
    tracks: [videoTrack, overlay, text, audio],
    clips: [],
    markers: [],
    bg: { type: "color", color: "#000000", from: "#111827", to: "#000000", angle: 135, blurAmount: 40, pattern: "grid", opacity: 1 },
    watermark: { enabled: false, text: "editzz", color: "#ffffff", size: 28, opacity: 0.55, pos: "br" },
    inPoint: null,
    outPoint: null,
  };
}

/* ───────────────────────────── utilidades de projeto ───────────────────────────── */

export const clipEnd = (c: Clip) => c.start + c.duration;
export const projectDuration = (p: Project) => p.clips.reduce((m, c) => Math.max(m, clipEnd(c)), 0);

export function clipsOfTrack(p: Project, trackId: string) {
  return p.clips.filter((c) => c.trackId === trackId).sort((a, b) => a.start - b.start);
}

export function clipAt(p: Project, trackId: string, t: number) {
  return clipsOfTrack(p, trackId).find((c) => t >= c.start && t < clipEnd(c)) ?? null;
}

export function previousClip(p: Project, clip: Clip) {
  const list = clipsOfTrack(p, clip.trackId);
  const idx = list.findIndex((c) => c.id === clip.id);
  return idx > 0 ? list[idx - 1] : null;
}

export function trackOrder(p: Project) {
  return [...p.tracks].reverse();
}

export function isVisual(kind: ClipKind) {
  return kind !== "audio";
}

export function isAudioClip(c: Clip) {
  return c.kind === "audio";
}

export function evalKeyframe(clip: Clip, prop: KeyframeProp, localTime: number, fallback: number): number {
  const kfs = clip.keyframes[prop];
  if (!kfs || kfs.length === 0) return fallback;
  if (kfs.length === 1) return kfs[0].v;
  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  if (localTime <= sorted[0].t) return sorted[0].v;
  const last = sorted[sorted.length - 1];
  if (localTime >= last.t) return last.v;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (localTime >= a.t && localTime <= b.t) {
      const raw = (localTime - a.t) / Math.max(0.0001, b.t - a.t);
      const t = ease(raw, b.e ?? "ease_in_out");
      return a.v + (b.v - a.v) * t;
    }
  }
  return fallback;
}

export function ease(t: number, kind: EasingId): number {
  switch (kind) {
    case "linear":
      return t;
    case "ease_in":
      return t * t;
    case "ease_out":
      return 1 - (1 - t) * (1 - t);
    case "ease_in_out":
      return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    case "bounce": {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
    case "elastic": {
      if (t === 0 || t === 1) return t;
      const c4 = (2 * Math.PI) / 3;
      return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
    default:
      return t;
  }
}

export function hasKeyframes(clip: Clip, prop: KeyframeProp) {
  return (clip.keyframes[prop]?.length ?? 0) > 0;
}

export function toggleKeyframe(clip: Clip, prop: KeyframeProp, localTime: number, value: number): Clip {
  const list = clip.keyframes[prop] ?? [];
  const near = list.findIndex((k) => Math.abs(k.t - localTime) < 0.05);
  const next = near >= 0 ? list.filter((_, i) => i !== near) : [...list, { t: localTime, v: value, e: "ease_in_out" as EasingId }];
  return { ...clip, keyframes: { ...clip.keyframes, [prop]: next.sort((a, b) => a.t - b.t) } };
}

/** Aplica a velocidade variável do clipe devolvendo o tempo de origem para um tempo local. */
export function sourceTimeFor(clip: Clip, curve: number[], localTime: number): number {
  const d = Math.max(0.0001, clip.duration);
  const p = Math.min(1, Math.max(0, localTime / d));
  if (curve.length < 2) return clip.in + localTime * clip.speed;
  // integra numericamente a curva (multiplicadores em relação à velocidade base)
  const steps = 48;
  let area = 0;
  let upto = 0;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    if (t1 <= p) {
      area += curveValue(curve, (t0 + t1) / 2) / steps;
      upto = t1;
    } else if (t0 < p) {
      area += (curveValue(curve, (t0 + p) / 2) * (p - t0)) / 1;
      upto = p;
    }
  }
  void upto;
  const seconds = area * d * clip.speed * Math.max(0.02, clip.curveAmount);
  if (clip.reverse) {
    const total = clip.duration * clip.speed * Math.max(0.02, clip.curveAmount);
    return clip.in + (total - seconds);
  }
  return clip.in + seconds;
}

export function curveValue(curve: number[], p: number) {
  if (curve.length === 0) return 1;
  if (curve.length === 1) return curve[0];
  const x = Math.min(1, Math.max(0, p)) * (curve.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = curve[i];
  const b = curve[Math.min(curve.length - 1, i + 1)];
  return a + (b - a) * f;
}
