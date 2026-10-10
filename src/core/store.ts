import { useCallback, useSyncExternalStore } from "react";
import {
  LOOKS,
  EFFECTS,
  TRANSITIONS,
  SPEED_CURVES,
  EXPORT_PRESETS,
  type Adjustments,
  type KeyframeProp,
} from "@/lib/presets";
import { uid, clamp } from "@/lib/utils";
import * as db from "./db";
import {
  clipEnd,
  createClip,
  createDefaultProject,
  createShapeClip,
  createTextClip,
  projectDuration,
  toggleKeyframe,
  type Clip,
  type MediaAsset,
  type Marker,
  type Project,
  type Track,
  type TrackKind,
} from "./model";

export type ViewId =
  | "inicio"
  | "video"
  | "foto"
  | "midia"
  | "audio"
  | "modelos"
  | "recursos"
  | "ajuda";

export interface Toast {
  id: string;
  title: string;
  desc?: string;
  kind: "info" | "ok" | "warn" | "erro";
}

export interface PreviewSettings {
  quality: 0.35 | 0.5 | 0.75 | 1;
  safeZones: "off" | "reels" | "tiktok" | "youtube";
  thirds: boolean;
  compare: number | null;
  showEnergy: boolean;
}

export interface ExportSettings {
  preset: string;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  format: "auto" | "webm" | "mp4";
  rangeOnly: boolean;
  useRange: boolean;
}

export interface EditzzState {
  view: ViewId;
  project: Project;
  assets: MediaAsset[];
  selectedClipIds: string[];
  assetFilter: string;
  playhead: number;
  playing: boolean;
  loop: boolean;
  zoom: number;
  scroll: number;
  snapping: boolean;
  preview: PreviewSettings;
  exportSettings: ExportSettings;
  toasts: Toast[];
  busy: string | null;
  historyLabel: string;
  canUndo: boolean;
  canRedo: boolean;
  savedProjects: db.StoredProject[];
  lastImageId: string | null;
}

interface HistoryEntry {
  project: Project;
  label: string;
  time: number;
}

const HISTORY_LIMIT = 80;

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

class Store {
  private listeners = new Set<() => void>();
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  private lastCommit = { label: "", time: 0 };
  state: EditzzState;

  constructor() {
    this.state = {
      view: "inicio",
      project: createDefaultProject(),
      assets: [],
      selectedClipIds: [],
      assetFilter: "",
      playhead: 0,
      playing: false,
      loop: false,
      zoom: 90,
      scroll: 0,
      snapping: true,
      preview: { quality: 0.5, safeZones: "off", thirds: false, compare: null, showEnergy: true },
      exportSettings: {
        preset: "reels",
        width: 1080,
        height: 1920,
        fps: 30,
        bitrate: 6_000_000,
        format: "auto",
        rangeOnly: false,
        useRange: false,
      },
      toasts: [],
      busy: null,
      historyLabel: "Projeto novo",
      canUndo: false,
      canRedo: false,
      savedProjects: [],
      lastImageId: null,
    };
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this.state;

  private emit() {
    this.listeners.forEach((l) => l());
  }

  set(patch: Partial<EditzzState>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  private pushHistory(label: string, project: Project) {
    const now = performance.now();
    const coalesce = this.lastCommit.label === label && now - this.lastCommit.time < 700;
    this.lastCommit = { label, time: now };
    if (!coalesce) {
      this.past.push({ project: clone(this.state.project), label, time: Date.now() });
      if (this.past.length > HISTORY_LIMIT) this.past.shift();
    }
    this.future = [];
    this.set({
      project,
      canUndo: true,
      canRedo: false,
      historyLabel: label,
    });
  }

  /* ───────────── projeto ───────────── */

  commit(label: string, mutator: (p: Project) => Project) {
    const next = mutator(clone(this.state.project));
    next.updatedAt = Date.now();
    this.pushHistory(label, next);
    this.scheduleAutosave();
  }

  commitQuiet(label: string, mutator: (p: Project) => Project) {
    const next = mutator(clone(this.state.project));
    next.updatedAt = Date.now();
    this.pushHistory(label, next);
  }

  undo() {
    const entry = this.past.pop();
    if (!entry) return;
    this.future.push({ project: clone(this.state.project), label: entry.label, time: Date.now() });
    this.set({
      project: entry.project,
      canUndo: this.past.length > 0,
      canRedo: true,
      historyLabel: `Desfeito: ${entry.label}`,
      selectedClipIds: this.state.selectedClipIds.filter((id) => entry.project.clips.some((c) => c.id === id)),
    });
    this.scheduleAutosave();
  }

  redo() {
    const entry = this.future.pop();
    if (!entry) return;
    this.past.push({ project: clone(this.state.project), label: entry.label, time: Date.now() });
    this.set({
      project: entry.project,
      canUndo: true,
      canRedo: this.future.length > 0,
      historyLabel: `Refeito: ${entry.label}`,
    });
    this.scheduleAutosave();
  }

  /* ───────────── toasts ───────────── */

  toast(title: string, desc?: string, kind: Toast["kind"] = "info") {
    const id = uid("toast");
    this.set({ toasts: [...this.state.toasts, { id, title, desc, kind }] });
    setTimeout(() => this.set({ toasts: this.state.toasts.filter((t) => t.id !== id) }), 4200);
  }

  dismissToast(id: string) {
    this.set({ toasts: this.state.toasts.filter((t) => t.id !== id) });
  }

  /* ───────────── mídia ───────────── */

  addAssets(assets: MediaAsset[]) {
    this.set({ assets: [...this.state.assets, ...assets] });
  }

  removeAsset(id: string) {
    this.commit("Remover mídia", (p) => ({ ...p, clips: p.clips.filter((c) => c.assetId !== id) }));
    this.set({ assets: this.state.assets.filter((a) => a.id !== id) });
    void db.deleteMedia(id);
  }

  getAsset(id?: string) {
    if (!id) return undefined;
    return this.state.assets.find((a) => a.id === id);
  }

  addAssetToTimeline(asset: MediaAsset, trackId?: string, at?: number) {
    const p = this.state.project;
    const track =
      trackId ??
      (asset.kind === "audio"
        ? p.tracks.find((t) => t.kind === "audio")?.id
        : p.tracks.find((t) => t.kind === "video")?.id) ??
      p.tracks[0].id;
    const start = at ?? (this.state.playhead || projectDuration(p));
    const dur = asset.kind === "image" ? 5 : Math.max(0.4, asset.duration || 5);
    const clip = createClip({
      kind: asset.kind === "audio" ? "audio" : asset.kind === "image" ? "image" : "video",
      assetId: asset.id,
      trackId: track,
      start,
      duration: dur,
      name: asset.name,
    });
    const placed = this.resolveOverlap(clip, p);
    this.commit("Adicionar clipe", (proj) => ({ ...proj, clips: [...proj.clips, placed] }));
    this.select([placed.id]);
    return placed;
  }

  /** Se o clipe colidir com outro da mesma faixa, move para a próxima faixa livre ou desloca. */
  private resolveOverlap(clip: Clip, p: Project): Clip {
    const trackKind = p.tracks.find((t) => t.id === clip.trackId)?.kind;
    if (trackKind === "audio" || trackKind === "text") return clip;
    let candidate = { ...clip };
    for (let guard = 0; guard < 12; guard++) {
      const conflict = p.clips.find(
        (c) => c.trackId === candidate.trackId && !(candidate.start >= clipEnd(c) || clipEnd(candidate) <= c.start)
      );
      if (!conflict) return candidate;
      const freeTrack = p.tracks.find(
        (t) =>
          (t.kind === "video" || t.kind === "overlay") &&
          !p.clips.some((c) => c.trackId === t.id && !(candidate.start >= clipEnd(c) || clipEnd(candidate) <= c.start))
      );
      if (freeTrack) return { ...candidate, trackId: freeTrack.id };
      candidate = { ...candidate, start: clipEnd(conflict) };
    }
    return candidate;
  }

  /* ───────────── clipes ───────────── */

  updateClip(id: string, patch: Partial<Clip>, label = "Ajustar clipe") {
    this.commit(label, (p) => ({ ...p, clips: p.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  }

  updateSelected(patch: Partial<Clip> | ((c: Clip) => Partial<Clip>), label = "Editar clipes") {
    const ids = this.state.selectedClipIds;
    if (!ids.length) return;
    this.commit(label, (p) => ({
      ...p,
      clips: p.clips.map((c) => (ids.includes(c.id) ? { ...c, ...(typeof patch === "function" ? patch(c) : patch) } : c)),
    }));
  }

  patchClipLive(id: string, patch: Partial<Clip>, label = "Ajustar clipe") {
    this.commit(label, (p) => ({ ...p, clips: p.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  }

  setAdjust(id: string, key: keyof Adjustments, value: number, label = "Ajuste de cor") {
    this.commit(label, (p) => ({
      ...p,
      clips: p.clips.map((c) => (c.id === id ? { ...c, adjust: { ...c.adjust, [key]: value } } : c)),
    }));
  }

  setLook(id: string, lookId: string, intensity?: number) {
    this.commit("Aplicar look", (p) => ({
      ...p,
      clips: p.clips.map((c) => (c.id === id ? { ...c, look: lookId, lookIntensity: intensity ?? c.lookIntensity } : c)),
    }));
  }

  applyLookToAll(lookId: string, intensity = 100) {
    this.commit("Look em todos os clipes", (p) => ({
      ...p,
      clips: p.clips.map((c) => (c.kind === "audio" ? c : { ...c, look: lookId, lookIntensity: intensity })),
    }));
    this.toast("Look aplicado no projeto", `${LOOKS.find((l) => l.id === lookId)?.name ?? lookId} em todos os clipes visuais`, "ok");
  }

  addEffect(clipId: string, effectId: string) {
    const def = EFFECTS.find((e) => e.id === effectId);
    if (!def) return;
    const params: Record<string, number> = {};
    def.params.forEach((p) => (params[p.key] = p.def));
    this.commit("Adicionar efeito", (p) => ({
      ...p,
      clips: p.clips.map((c) => {
        if (c.id !== clipId) return c;
        if (c.effects.some((e) => e.id === effectId && e.enabled)) {
          return { ...c, effects: c.effects.map((e) => (e.id === effectId ? { ...e, enabled: true } : e)) };
        }
        return { ...c, effects: [...c.effects, { id: effectId, name: def.name, enabled: true, params: { ...params } }] };
      }),
    }));
  }

  setEffectParam(clipId: string, effectId: string, key: string, value: number) {
    this.commit("Ajustar efeito", (p) => ({
      ...p,
      clips: p.clips.map((c) =>
        c.id === clipId
          ? {
              ...c,
              effects: c.effects.map((e) => (e.id === effectId ? { ...e, params: { ...e.params, [key]: value } } : e)),
            }
          : c
      ),
    }));
  }

  toggleEffect(clipId: string, effectId: string) {
    this.commit("Alternar efeito", (p) => ({
      ...p,
      clips: p.clips.map((c) =>
        c.id === clipId ? { ...c, effects: c.effects.map((e) => (e.id === effectId ? { ...e, enabled: !e.enabled } : e)) } : c
      ),
    }));
  }

  removeEffect(clipId: string, effectId: string) {
    this.commit("Remover efeito", (p) => ({
      ...p,
      clips: p.clips.map((c) => (c.id === clipId ? { ...c, effects: c.effects.filter((e) => e.id !== effectId) } : c)),
    }));
  }

  reorderEffect(clipId: string, from: number, to: number) {
    this.commit("Reordenar efeitos", (p) => ({
      ...p,
      clips: p.clips.map((c) => {
        if (c.id !== clipId) return c;
        const list = [...c.effects];
        const [item] = list.splice(from, 1);
        list.splice(clamp(to, 0, list.length), 0, item);
        return { ...c, effects: list };
      }),
    }));
  }

  setTransition(clipId: string, side: "in" | "out", id: string, duration = 0.6) {
    this.commit("Transição", (p) => ({
      ...p,
      clips: p.clips.map((c) =>
        c.id === clipId
          ? side === "in"
            ? { ...c, transitionIn: { id, duration } }
            : { ...c, transitionOut: { id, duration } }
          : c
      ),
    }));
  }

  removeClips(ids: string[], label = "Remover clipe") {
    if (!ids.length) return;
    this.commit(label, (p) => ({ ...p, clips: p.clips.filter((c) => !ids.includes(c.id)) }));
    this.set({ selectedClipIds: this.state.selectedClipIds.filter((id) => !ids.includes(id)) });
  }

  rippleDelete(ids: string[]) {
    this.commit("Ripple delete", (proj) => {
      let out = { ...proj, clips: proj.clips.filter((c) => !ids.includes(c.id)) };
      const removed = proj.clips.filter((c) => ids.includes(c.id));
      removed.forEach((r) => {
        out = {
          ...out,
          clips: out.clips.map((c) =>
            c.trackId === r.trackId && c.start >= clipEnd(r) ? { ...c, start: Math.max(0, c.start - r.duration) } : c
          ),
        };
      });
      return out;
    });
  }

  duplicateClips(ids: string[]) {
    const p = this.state.project;
    const clones: Clip[] = [];
    ids.forEach((id) => {
      const c = p.clips.find((x) => x.id === id);
      if (!c) return;
      clones.push({ ...clone(c), id: uid("clip"), start: clipEnd(c) });
    });
    if (!clones.length) return;
    this.commit("Duplicar clipe", (proj) => ({ ...proj, clips: [...proj.clips, ...clones] }));
    this.select(clones.map((c) => c.id));
  }

  splitAt(t: number, trackIds?: string[]) {
    const p = this.state.project;
    const newClips: Clip[] = [];
    const updated = p.clips.map((c) => {
      if (trackIds && !trackIds.includes(c.trackId)) return c;
      if (t <= c.start + 0.04 || t >= clipEnd(c) - 0.04) return c;
      const leftDur = t - c.start;
      const left: Clip = { ...clone(c), duration: leftDur };
      const right: Clip = {
        ...clone(c),
        id: uid("clip"),
        start: t,
        duration: c.duration - leftDur,
        in: c.in + leftDur * c.speed,
        transitionIn: undefined,
        keyframes: Object.fromEntries(
          Object.entries(c.keyframes).map(([k, list]) => [
            k,
            (list ?? []).filter((kf) => kf.t >= leftDur).map((kf) => ({ ...kf, t: kf.t - leftDur })),
          ])
        ),
      };
      left.keyframes = Object.fromEntries(
        Object.entries(c.keyframes).map(([k, list]) => [k, (list ?? []).filter((kf) => kf.t <= leftDur)])
      );
      newClips.push(right);
      return left;
    });
    if (!newClips.length) {
      this.toast("Nada para dividir", "Posicione o playhead dentro de um clipe.", "warn");
      return;
    }
    this.commit("Dividir clipe", (proj) => ({ ...proj, clips: [...updated, ...newClips] }));
    this.toast("Clipe dividido", `${newClips.length} corte(s) criado(s)`, "ok");
  }

  trimClip(id: string, side: "start" | "end", newTime: number) {
    this.commit("Aparar clipe", (p) => ({
      ...p,
      clips: p.clips.map((c) => {
        if (c.id !== id) return c;
        if (side === "start") {
          const maxStart = clipEnd(c) - 0.1;
          const start = clamp(newTime, 0, maxStart);
          const delta = start - c.start;
          return {
            ...c,
            start,
            duration: c.duration - delta,
            in: Math.max(0, c.in + delta * c.speed),
          };
        }
        const duration = Math.max(0.1, newTime - c.start);
        return { ...c, duration };
      }),
    }));
  }

  moveClip(id: string, trackId: string, start: number) {
    this.commit("Mover clipe", (p) => ({
      ...p,
      clips: p.clips.map((c) => (c.id === id ? { ...c, trackId, start: Math.max(0, start) } : c)),
    }));
  }

  freezeFrameAt(t: number) {
    const p = this.state.project;
    const clip = p.clips.find((c) => c.kind === "video" && t >= c.start && t < clipEnd(c));
    if (!clip) {
      this.toast("Nenhum vídeo no playhead", "Posicione o cursor sobre um clipe de vídeo.", "warn");
      return;
    }
    const fz = createClip({
      kind: clip.kind,
      assetId: clip.assetId,
      trackId: clip.trackId,
      start: t,
      duration: 2,
      in: clip.in + (t - clip.start) * clip.speed,
      name: `${clip.name} (congelado)`,
    });
    fz.freeze = true;
    fz.adjust = clone(clip.adjust);
    fz.look = clip.look;
    this.commit("Congelar quadro", (proj) => ({ ...proj, clips: [...proj.clips.map((c) => (c.id === clip.id ? { ...c, duration: Math.max(0.1, t - c.start) } : c)), fz] }));
    this.select([fz.id]);
    this.toast("Quadro congelado", "2 segundos de imagem parada adicionados.", "ok");
  }

  setClipSpeed(id: string, speed: number) {
    const p = this.state.project;
    const clip = p.clips.find((c) => c.id === id);
    if (!clip) return;
    this.commit("Velocidade", (proj) => ({
      ...proj,
      clips: proj.clips.map((c) => (c.id === id ? { ...c, speed, duration: (c.duration * c.speed) / speed } : c)),
    }));
  }

  /* ───────────── faixas e marcadores ───────────── */

  addTrack(kind: TrackKind = "overlay") {
    this.commit("Nova faixa", (p) => {
      const names: Record<TrackKind, string> = {
        video: "Vídeo",
        overlay: "Sobreposição",
        text: "Texto",
        audio: "Áudio",
        adjust: "Ajuste",
      };
      const count = p.tracks.filter((t) => t.kind === kind).length + 1;
      const track: Track = {
        id: uid("trk"),
        name: `${names[kind]} ${count}`,
        kind,
        height: kind === "audio" ? 54 : kind === "text" ? 50 : 58,
        muted: false,
        hidden: false,
        locked: false,
        solo: false,
      };
      const arr = [...p.tracks];
      if (kind === "audio") arr.push(track);
      else if (kind === "adjust") arr.splice(Math.max(1, arr.findIndex((t) => t.kind === "text")), 0, track);
      else arr.unshift(track);
      return { ...p, tracks: arr };
    });
  }

  updateTrack(id: string, patch: Partial<Track>) {
    this.commit("Editar faixa", (p) => ({ ...p, tracks: p.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  }

  removeTrack(id: string) {
    this.commit("Remover faixa", (p) => ({
      ...p,
      tracks: p.tracks.length > 1 ? p.tracks.filter((t) => t.id !== id) : p.tracks,
      clips: p.clips.filter((c) => c.trackId !== id),
    }));
  }

  setMarkers(markers: Marker[], label = "Marcadores") {
    this.commit(label, (p) => ({ ...p, markers }));
  }

  addMarker(t: number, label = "Marcador", kind: Marker["kind"] = "manual", color = "#fbbf24") {
    const m: Marker = { id: uid("mk"), t, label, color, kind };
    this.commit("Novo marcador", (p) => ({ ...p, markers: [...p.markers, m] }));
    return m;
  }

  removeMarker(id: string) {
    this.commit("Remover marcador", (p) => ({ ...p, markers: p.markers.filter((m) => m.id !== id) }));
  }

  clearMarkers(kind?: Marker["kind"]) {
    this.commit("Limpar marcadores", (p) => ({ ...p, markers: kind ? p.markers.filter((m) => m.kind !== kind) : [] }));
  }

  /* ───────────── textos, formas, adesivos ───────────── */

  addText(content?: string, trackId?: string, stylePatch?: Partial<Clip["text"]>) {
    const p = this.state.project;
    const track = trackId ?? p.tracks.find((t) => t.kind === "text")?.id ?? p.tracks[0].id;
    const clip = createTextClip(track, this.state.playhead, 3, content);
    if (stylePatch && clip.text) clip.text = { ...clip.text, ...stylePatch };
    this.commit("Adicionar texto", (proj) => ({ ...proj, clips: [...proj.clips, clip] }));
    this.select([clip.id]);
    return clip;
  }

  addShape(shape: string, trackId?: string) {
    const p = this.state.project;
    const track = trackId ?? p.tracks.find((t) => t.kind === "overlay")?.id ?? p.tracks[0].id;
    const clip = createShapeClip(track, this.state.playhead, 3, shape);
    this.commit("Adicionar forma", (proj) => ({ ...proj, clips: [...proj.clips, clip] }));
    this.select([clip.id]);
    return clip;
  }

  addSticker(emoji: string) {
    const p = this.state.project;
    const track = p.tracks.find((t) => t.kind === "text")?.id ?? p.tracks[0].id;
    const clip = createShapeClip(track, this.state.playhead, 3, "sticker");
    clip.shape = { ...clip.shape!, shape: "sticker", text: emoji, fill: "#ffffff" };
    clip.name = `Adesivo ${emoji}`;
    this.commit("Adicionar adesivo", (proj) => ({ ...proj, clips: [...proj.clips, clip] }));
    this.select([clip.id]);
    return clip;
  }

  addColorClip(color: string, duration = 3) {
    const p = this.state.project;
    const track = p.tracks.find((t) => t.kind === "video")!.id;
    const clip = createClip({ kind: "color", trackId: track, start: this.state.playhead, duration, name: `Cor ${color}` });
    clip.color = color;
    this.commit("Clipe de cor", (proj) => ({ ...proj, clips: [...proj.clips, clip] }));
    this.select([clip.id]);
  }

  addAdjustmentClip() {
    const p = this.state.project;
    let track = p.tracks.find((t) => t.kind === "adjust");
    if (!track) {
      this.addTrack("adjust");
      track = this.store_project().tracks.find((t) => t.kind === "adjust");
    }
    const clip = createClip({ kind: "adjust", trackId: track!.id, start: 0, duration: Math.max(1, projectDuration(p) || 5), name: "Camada de ajuste" });
    this.commit("Camada de ajuste", (proj) => ({ ...proj, clips: [...proj.clips, clip] }));
    this.select([clip.id]);
    this.toast("Camada de ajuste criada", "Efeitos e cor aplicados a todos os clipes abaixo.", "ok");
  }

  private store_project() {
    return this.state.project;
  }

  toggleKeyframe(prop: KeyframeProp, value: number) {
    const ids = this.state.selectedClipIds;
    if (!ids.length) return;
    this.commit("Keyframe", (proj) => ({
      ...proj,
      clips: proj.clips.map((c) => {
        if (!ids.includes(c.id)) return c;
        const local = this.state.playhead - c.start;
        return toggleKeyframe(c, prop, clamp(local, 0, c.duration), value);
      }),
    }));
  }

  /* ───────────── seleção / navegação ───────────── */

  select(ids: string[]) {
    this.set({ selectedClipIds: ids });
  }

  toggleSelect(id: string, additive = false) {
    const cur = this.state.selectedClipIds;
    if (!additive) this.set({ selectedClipIds: [id] });
    else this.set({ selectedClipIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  }

  setView(view: ViewId) {
    this.set({ view });
  }

  setPlayhead(t: number) {
    const max = Math.max(projectDuration(this.state.project), 1);
    this.set({ playhead: clamp(t, 0, max) });
  }

  play() {
    this.set({ playing: true });
  }
  pause() {
    this.set({ playing: false });
  }
  togglePlay() {
    this.set({ playing: !this.state.playing });
  }
  stepFrame(dir = 1) {
    const p = this.state.project;
    this.set({ playing: false, playhead: Math.max(0, this.state.playhead + dir / p.fps) });
  }

  setZoom(zoom: number) {
    this.set({ zoom: clamp(zoom, 12, 480) });
  }

  /* ───────────── projeto: novo, salvar, carregar ───────────── */

  newProject(width = 1920, height = 1080, fps = 30, name = "Projeto sem título") {
    this.past = [];
    this.future = [];
    this.set({
      project: createDefaultProject(name, width, height, fps),
      playhead: 0,
      playing: false,
      selectedClipIds: [],
      canUndo: false,
      canRedo: false,
      historyLabel: "Projeto novo",
    });
    this.toast("Projeto criado", `${width}×${height} · ${fps} fps`, "ok");
  }

  loadProject(project: Project, assets: MediaAsset[] = this.state.assets) {
    this.past = [];
    this.future = [];
    this.set({
      project,
      assets,
      playhead: 0,
      playing: false,
      selectedClipIds: [],
      canUndo: false,
      canRedo: false,
      historyLabel: "Projeto carregado",
    });
  }

  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private scheduleAutosave() {
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => void this.persist(false), 1200);
  }

  async persist(notify = true) {
    const { project } = this.state;
    const rec: db.StoredProject = {
      id: project.id,
      name: project.name,
      updatedAt: Date.now(),
      json: JSON.stringify({ project, assets: this.state.assets.map((a) => ({ ...a, url: "" })) }),
    };
    await db.saveProjectRecord(rec);
    this.set({ savedProjects: await db.listProjectRecords() });
    if (notify) this.toast("Projeto salvo", "Guardado no navegador (IndexedDB).", "ok");
  }

  async refreshProjects() {
    this.set({ savedProjects: await db.listProjectRecords() });
  }

  async openProject(id: string) {
    const rec = await db.readProjectRecord(id);
    if (!rec) return;
    try {
      const parsed = JSON.parse(rec.json) as { project: Project; assets: MediaAsset[] };
      const assets: MediaAsset[] = [];
      for (const a of parsed.assets) {
        const stored = await db.getMedia(a.id);
        if (stored?.blob) {
          let url = db.restoredUrls.get(a.id);
          if (!url) {
            url = URL.createObjectURL(stored.blob);
            db.restoredUrls.set(a.id, url);
          }
          assets.push({ ...a, url });
        } else {
          assets.push(a);
        }
      }
      this.loadProject(parsed.project, assets);
      this.set({ view: "video" });
      this.toast("Projeto aberto", rec.name, "ok");
    } catch {
      this.toast("Falha ao abrir", "Arquivo de projeto corrompido.", "erro");
    }
  }

  async deleteProject(id: string) {
    await db.deleteProjectRecord(id);
    this.set({ savedProjects: await db.listProjectRecords() });
  }

  async exportProjectFile() {
    const { project, assets } = this.state;
    const json = JSON.stringify(
      { app: "editzz", version: 1, project, assets: assets.map((a) => ({ ...a, url: "", thumb: a.thumb })) },
      null,
      2
    );
    const blob = new Blob([json], { type: "application/json" });
    const { download, slugifyName } = await import("@/lib/utils");
    download(blob, `${slugifyName(project.name)}.editzz.json`);
    this.toast("Projeto exportado", "Arquivo .editzz.json gerado.", "ok");
  }

  async importProjectFile(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { project: Project; assets?: MediaAsset[] };
      if (!parsed.project?.tracks) throw new Error("formato inválido");
      // o .editzz.json não carrega os arquivos: mantém os metadados dos assets
      // (nome, tamanho, duração) para religar a mídia depois, sem URLs.
      this.loadProject(parsed.project, (parsed.assets ?? []).map((a) => ({ ...a, url: "" })));
      this.set({ view: "video" });
      this.toast("Projeto importado", parsed.project.name, "ok");
    } catch {
      this.toast("Arquivo inválido", "Envie um .editzz.json exportado pelo editzz.", "erro");
    }
  }

  /* ───────────── export ───────────── */

  applyExportPreset(presetId: string) {
    const preset = EXPORT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    this.set({
      exportSettings: {
        ...this.state.exportSettings,
        preset: presetId,
        width: preset.w,
        height: preset.h,
        fps: preset.fps,
        bitrate: preset.vbr,
      },
    });
  }

  setProjectFormat(width: number, height: number) {
    this.commit("Formato do projeto", (p) => ({ ...p, width, height }));
  }

  setProjectFps(fps: number) {
    this.commit("FPS do projeto", (p) => ({ ...p, fps }));
  }

  renameProject(name: string) {
    this.commit("Renomear projeto", (p) => ({ ...p, name }));
  }

  setBg(patch: Partial<Project["bg"]>) {
    this.commit("Fundo do quadro", (p) => ({ ...p, bg: { ...p.bg, ...patch } }));
  }

  setWatermark(patch: Partial<Project["watermark"]>) {
    this.commit("Marca d'água", (p) => ({ ...p, watermark: { ...p.watermark, ...patch } }));
  }

  setSpeedCurve(clipId: string, curveId: string) {
    const def = SPEED_CURVES.find((s) => s.id === curveId);
    if (!def) return;
    this.commit("Curva de velocidade", (p) => ({
      ...p,
      clips: p.clips.map((c) => (c.id === clipId ? { ...c, speedCurve: curveId } : c)),
    }));
  }

  listTransitions() {
    return TRANSITIONS;
  }
}

export const store = new Store();

export function useEditzz() {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const actions = useCallback(() => store, [])();
  return { state, store: actions };
}

export function useSelectedClip(): Clip | null {
  const { state } = useEditzz();
  if (state.selectedClipIds.length !== 1) return null;
  return state.project.clips.find((c) => c.id === state.selectedClipIds[0]) ?? null;
}
