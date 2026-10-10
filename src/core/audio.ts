import { clamp } from "@/lib/utils";
import { pool } from "./media";
import type { MediaAsset, Project } from "./model";
import { clipEnd } from "./model";

/* ══════════════════ utilidades de áudio ══════════════════ */

export function audioCtx(): AudioContext {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new Ctx();
}

/** Codifica um AudioBuffer como WAV PCM 16 bits. */
export function encodeWav(buffer: AudioBuffer): Blob {
  const numCh = Math.min(2, buffer.numberOfChannels);
  const len = buffer.length * numCh * 2;
  const ab = new ArrayBuffer(44 + len);
  const view = new DataView(ab);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + len, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * numCh * 2, true);
  view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, len, true);
  let off = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = clamp(buffer.getChannelData(c)[i], -1, 1);
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}

export function peaksFromBuffer(buffer: AudioBuffer, count = 400): number[] {
  const chan = buffer.getChannelData(0);
  const step = Math.max(1, Math.floor(chan.length / count));
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    let peak = 0;
    for (let j = 0; j < step; j += 2) peak = Math.max(peak, Math.abs(chan[i * step + j] ?? 0));
    out.push(peak);
  }
  return out;
}

export function rmsWindows(buffer: AudioBuffer, windowSec = 0.05): { rms: number[]; hop: number } {
  const sr = buffer.sampleRate;
  const hop = Math.max(1, Math.floor(sr * windowSec));
  const data = buffer.getChannelData(0);
  const rms: number[] = [];
  for (let i = 0; i < data.length; i += hop) {
    let sum = 0;
    const end = Math.min(data.length, i + hop);
    for (let j = i; j < end; j++) sum += data[j] * data[j];
    rms.push(Math.sqrt(sum / Math.max(1, end - i)));
  }
  return { rms, hop };
}

/** Detecta trechos silenciosos (útil para remover pausas). */
export function detectSilence(buffer: AudioBuffer, threshold = 0.012, minDur = 0.32): { start: number; end: number }[] {
  const sr = buffer.sampleRate;
  const { rms, hop } = rmsWindows(buffer, 0.03);
  const out: { start: number; end: number }[] = [];
  let start: number | null = null;
  rms.forEach((v, i) => {
    const quiet = v < threshold;
    if (quiet && start === null) start = i;
    if (!quiet && start !== null) {
      const s = (start * hop) / sr;
      const e = (i * hop) / sr;
      if (e - s >= minDur) out.push({ start: s, end: e });
      start = null;
    }
  });
  if (start !== null) {
    const s = (start * hop) / sr;
    if (buffer.duration - s >= minDur) out.push({ start: s, end: buffer.duration });
  }
  return out;
}

/* ── FFT simples para detecção de batidas (fluxo espectral) ── */
function fft(re: Float32Array, im: Float32Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cwr = 1;
      let cwi = 0;
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i + j];
        const ui = im[i + j];
        const vr = re[i + j + len / 2] * cwr - im[i + j + len / 2] * cwi;
        const vi = re[i + j + len / 2] * cwi + im[i + j + len / 2] * cwr;
        re[i + j] = ur + vr;
        im[i + j] = ui + vi;
        re[i + j + len / 2] = ur - vr;
        im[i + j + len / 2] = ui - vi;
        const nwr = cwr * wr - cwi * wi;
        cwi = cwr * wi + cwi * wr;
        cwr = nwr;
      }
    }
  }
}

/** Detecção de batidas por fluxo espectral com limiar adaptativo. */
export function detectBeats(buffer: AudioBuffer, sensitivity = 1.1): number[] {
  const sr = buffer.sampleRate;
  const size = 1024;
  const hop = 512;
  const data = buffer.getChannelData(0);
  const flux: number[] = [];
  let prev = new Float32Array(size / 2);
  const re = new Float32Array(size);
  const im = new Float32Array(size);
  for (let pos = 0; pos + size < data.length; pos += hop) {
    re.fill(0);
    im.fill(0);
    for (let i = 0; i < size; i++) re[i] = data[pos + i] * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (size - 1)));
    fft(re, im);
    let sum = 0;
    for (let i = 0; i < size / 2; i++) {
      const mag = Math.hypot(re[i], im[i]);
      const diff = mag - prev[i];
      if (diff > 0) sum += diff;
      prev[i] = mag;
    }
    flux.push(sum);
  }
  if (!flux.length) return [];
  const avg = flux.reduce((a, b) => a + b, 0) / flux.length;
  const beats: number[] = [];
  let last = -1;
  for (let i = 1; i < flux.length - 1; i++) {
    const local = (flux[i - 1] + flux[i] + flux[i + 1]) / 3;
    if (flux[i] > avg * sensitivity && flux[i] >= local && flux[i] > flux[i - 1] && flux[i] >= flux[i + 1]) {
      const t = (i * hop) / sr;
      if (last < 0 || t - last > 0.22) {
        beats.push(t);
        last = t;
      }
    }
  }
  return beats;
}

/** Picos de energia (para o mapa de calor da timeline). */
export function energyMap(buffer: AudioBuffer, buckets = 160): number[] {
  const sr = buffer.sampleRate;
  const per = Math.floor(buffer.length / buckets);
  const data = buffer.getChannelData(0);
  const out: number[] = [];
  for (let b = 0; b < buckets; b++) {
    let sum = 0;
    const from = b * per;
    for (let i = 0; i < per; i += 3) sum += Math.abs(data[from + i] ?? 0);
    out.push(sum / Math.max(1, per / 3));
  }
  const max = Math.max(...out, 0.0001);
  void sr;
  return out.map((v) => v / max);
}

/* ══════════════════ processamento offline ══════════════════ */

export interface ProcessOptions {
  highpass?: number;
  lowpass?: number;
  denoise?: number;
  normalize?: boolean;
  pitch?: number;
  voice?: string;
  reverb?: number;
  gain?: number;
  tempo?: number;
}

const VOICE_PRESETS: Record<string, { pitch: number; highpass: number; lowpass: number; reverb: number; gain: number }> = {
  none: { pitch: 0, highpass: 0, lowpass: 0, reverb: 0, gain: 0 },
  deep: { pitch: -5, highpass: 40, lowpass: 8000, reverb: 0.1, gain: 2 },
  chipmunk: { pitch: 9, highpass: 200, lowpass: 14000, reverb: 0, gain: 1 },
  robot: { pitch: 0, highpass: 300, lowpass: 4000, reverb: 0.05, gain: 4 },
  radio: { pitch: 0, highpass: 500, lowpass: 3400, reverb: 0, gain: 6 },
  phone: { pitch: 0, highpass: 800, lowpass: 3000, reverb: 0, gain: 8 },
  cave: { pitch: -2, highpass: 80, lowpass: 7000, reverb: 0.65, gain: 0 },
  monster: { pitch: -8, highpass: 60, lowpass: 5000, reverb: 0.35, gain: 4 },
  helium: { pitch: 12, highpass: 250, lowpass: 12000, reverb: 0.1, gain: 0 },
  megaphone: { pitch: 1, highpass: 700, lowpass: 3600, reverb: 0.2, gain: 10 },
};

/** Aplica filtros, gate de ruído, pitch e reverb, devolvendo um novo buffer. */
export async function processBuffer(input: AudioBuffer, opts: ProcessOptions, onProgress?: (p: number) => void): Promise<AudioBuffer> {
  const voice = VOICE_PRESETS[opts.voice ?? "none"] ?? VOICE_PRESETS.none;
  const pitch = (opts.pitch ?? 0) + voice.pitch;
  const highpass = Math.max(opts.highpass ?? 0, voice.highpass);
  const lowpass = opts.lowpass && voice.lowpass ? Math.min(opts.lowpass, voice.lowpass) : opts.lowpass || voice.lowpass;
  const reverb = Math.max(opts.reverb ?? 0, voice.reverb);
  const tempo = opts.tempo ?? 1;

  const ratio = Math.pow(2, pitch / 12);
  const targetLen = Math.max(1, Math.round((input.length / Math.max(0.05, ratio)) / tempo));
  const ctx = audioCtx();
  const offline = new OfflineAudioContext(input.numberOfChannels, targetLen, input.sampleRate);
  const src = offline.createBufferSource();
  src.buffer = input;

  let node: AudioNode = src;
  if (highpass > 20) {
    const hp = offline.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = highpass;
    hp.Q.value = 0.7;
    node.connect(hp);
    node = hp;
  }
  if (lowpass > 40) {
    const lp = offline.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = lowpass;
    node.connect(lp);
    node = lp;
  }
  const comp = offline.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 12;
  comp.ratio.value = 3;
  comp.attack.value = 0.005;
  comp.release.value = 0.2;
  node.connect(comp);
  node = comp;

  const gain = offline.createGain();
  const norm = opts.normalize ? normalizeGain(input) : 1;
  gain.gain.value = norm * Math.pow(10, (opts.gain ?? 0) / 20) * Math.pow(10, voice.gain / 20);
  node.connect(gain);
  node = gain;

  if (reverb > 0.01) {
    const conv = offline.createConvolver();
    conv.buffer = makeImpulse(offline, 1.6 + reverb * 1.6, 2.4);
    const wet = offline.createGain();
    wet.gain.value = reverb * 0.8;
    const dry = offline.createGain();
    dry.gain.value = 0.85;
    node.connect(dry);
    dry.connect(offline.destination);
    node.connect(conv);
    conv.connect(wet);
    wet.connect(offline.destination);
  } else {
    node.connect(offline.destination);
  }

  src.playbackRate.value = ratio * tempo;
  src.start(0);
  void onProgress;
  const rendered = await offline.startRendering();
  void ctx;
  if (opts.denoise && opts.denoise > 0) applyNoiseGate(rendered, opts.denoise / 100);
  return rendered;
}

function normalizeGain(buffer: AudioBuffer): number {
  let peak = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < d.length; i += 7) peak = Math.max(peak, Math.abs(d[i]));
  }
  return peak > 0.0001 ? Math.min(4, 0.94 / peak) : 1;
}

function makeImpulse(ctx: BaseAudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

/** Gate simples: reduz o que está abaixo do limiar adaptativo (remove ruído de fundo). */
function applyNoiseGate(buffer: AudioBuffer, amount: number) {
  const sr = buffer.sampleRate;
  const win = Math.floor(sr * 0.02);
  const threshold = 0.005 + amount * 0.05;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c);
    let env = 0;
    for (let i = 0; i < d.length; i += win) {
      let peak = 0;
      for (let j = i; j < Math.min(d.length, i + win); j++) peak = Math.max(peak, Math.abs(d[j]));
      const target = peak < threshold ? 0 : 1;
      env += (target - env) * 0.35;
      const g = 1 - env * (1 - Math.pow(0.02, amount)) * (peak < threshold ? 1 : 0) - (1 - env) * 0.9 * (peak < threshold ? 1 : 0);
      const gain = peak < threshold ? Math.max(0.0001, 1 - amount * 0.98) * env + (1 - env) : Math.max(g, 0.0001);
      for (let j = i; j < Math.min(d.length, i + win); j++) d[j] *= gain;
    }
  }
}

/** Isolamento de voz aproximado: corta graves e realça a faixa da fala. */
export async function isolateVoice(buffer: AudioBuffer): Promise<AudioBuffer> {
  return processBuffer(buffer, { highpass: 110, lowpass: 7200, denoise: 45, normalize: true });
}

/* ══════════════════ síntese musical procedural ══════════════════ */

const NOTE = (semi: number) => 440 * Math.pow(2, (semi - 9) / 12);

interface MusicStyleDef {
  bpm: number;
  chords: number[][];
  drums: boolean;
  lead: boolean;
  waveform: OscillatorType;
  padWave: OscillatorType;
  swing: number;
}

const MUSIC: Record<string, MusicStyleDef> = {
  lofi: { bpm: 78, chords: [[57, 60, 64, 67], [55, 59, 62, 65], [53, 57, 60, 64], [52, 55, 59, 62]], drums: true, lead: true, waveform: "sine", padWave: "triangle", swing: 0.12 },
  trap: { bpm: 140, chords: [[45, 48, 52], [44, 47, 51], [41, 45, 48], [43, 46, 50]], drums: true, lead: true, waveform: "square", padWave: "sawtooth", swing: 0.03 },
  cinematic: { bpm: 90, chords: [[50, 57, 62], [48, 55, 60], [45, 52, 57], [43, 50, 55]], drums: false, lead: true, waveform: "sine", padWave: "sawtooth", swing: 0 },
  chiptune: { bpm: 128, chords: [[60, 64, 67], [59, 62, 67], [57, 60, 64], [55, 59, 62]], drums: true, lead: true, waveform: "square", padWave: "square", swing: 0 },
  pop: { bpm: 118, chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], drums: true, lead: true, waveform: "triangle", padWave: "sawtooth", swing: 0 },
  corporate: { bpm: 104, chords: [[60, 64, 67, 71], [57, 60, 64, 67], [55, 59, 62, 65], [53, 57, 60, 64]], drums: true, lead: true, waveform: "sine", padWave: "triangle", swing: 0 },
  ambient: { bpm: 60, chords: [[50, 57, 64], [48, 55, 62], [45, 52, 59]], drums: false, lead: false, waveform: "sine", padWave: "sine", swing: 0 },
  suspense: { bpm: 84, chords: [[38, 45], [38, 45], [37, 44], [36, 43]], drums: true, lead: false, waveform: "sawtooth", padWave: "sawtooth", swing: 0 },
};

export interface MusicOptions {
  style: string;
  bpm: number;
  seconds: number;
  brightness?: number;
  drums?: boolean;
}

export async function generateMusic(opts: MusicOptions): Promise<AudioBuffer> {
  const def = MUSIC[opts.style] ?? MUSIC.lofi;
  const bpm = opts.bpm || def.bpm;
  const beat = 60 / bpm;
  const seconds = clamp(opts.seconds, 1, 300);
  const sr = 44100;
  const ctx = new OfflineAudioContext(2, Math.floor(sr * seconds), sr);
  const master = ctx.createGain();
  master.gain.value = 0.75;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp);
  comp.connect(ctx.destination);

  const brightness = opts.brightness ?? 0.5;
  const totalBeats = Math.floor(seconds / beat);
  const chordLen = def.chords[0].length * 0.5 * beat;

  const bellOrLead = (freq: number, at: number, dur: number, kind: OscillatorType, vol: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900 + brightness * 6000;
    o.type = kind;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(f);
    f.connect(g);
    g.connect(master);
    o.start(at);
    o.stop(at + dur + 0.05);
  };

  const noise = (at: number, dur: number, vol: number, type: BiquadFilterType, freq: number) => {
    const len = Math.max(1, Math.floor(sr * dur));
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(at);
  };

  // acordes (pad)
  for (let b = 0; b < totalBeats; b++) {
    const at = b * beat;
    const chord = def.chords[Math.floor(b / 8) % def.chords.length];
    chord.forEach((semi, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = def.padWave;
      o.frequency.value = NOTE(semi);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.055 / (i + 1), at + 0.15);
      g.gain.linearRampToValueAtTime(0, at + chordLen * 1.05);
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 700 + brightness * 4200;
      o.connect(f);
      f.connect(g);
      g.connect(master);
      o.start(at);
      o.stop(at + chordLen * 1.1);
    });
  }

  // baixo
  for (let b = 0; b < totalBeats; b += 2) {
    const at = b * beat;
    const chord = def.chords[Math.floor(b / 8) % def.chords.length];
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = NOTE(chord[0] - 12);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.3, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, at + beat * 1.6);
    o.connect(g);
    g.connect(master);
    o.start(at);
    o.stop(at + beat * 1.7);
  }

  // bateria
  if ((opts.drums ?? def.drums) && def.drums) {
    for (let b = 0; b < totalBeats; b++) {
      const at = b * beat;
      if (b % 4 === 0) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(120, at);
        o.frequency.exponentialRampToValueAtTime(48, at + 0.14);
        g.gain.setValueAtTime(0.55, at);
        g.gain.exponentialRampToValueAtTime(0.001, at + 0.24);
        o.connect(g);
        g.connect(master);
        o.start(at);
        o.stop(at + 0.3);
      }
      if (b % 4 === 2) noise(at, 0.16, 0.24, "bandpass", 2000);
      if (def.swing > 0 || b % 4 === 1 || b % 4 === 3) noise(at + beat * (0.5 + def.swing), 0.06, b % 2 ? 0.09 : 0.14, "highpass", 7000);
      if (b % 8 === 7) noise(at + beat * 0.5, 0.3, 0.2, "bandpass", 1200);
    }
  }

  // melodia
  if (def.lead) {
    const scale = [0, 2, 3, 5, 7, 8, 10, 12];
    let seed = 1234 + opts.style.length * 77;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let b = 0; b < totalBeats; b++) {
      if (rnd() < 0.42) continue;
      const chord = def.chords[Math.floor(b / 8) % def.chords.length];
      const semi = chord[0] + 12 + scale[Math.floor(rnd() * scale.length)];
      const dur = beat * (rnd() < 0.3 ? 1.5 : 0.6);
      bellOrLead(NOTE(semi), b * beat, dur, def.waveform, 0.11 + rnd() * 0.06);
    }
  }

  // textura lo-fi
  if (opts.style === "lofi") {
    const len = Math.floor(sr * seconds);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.02;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 3200;
    const g = ctx.createGain();
    g.gain.value = 0.35;
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(0);
  }

  return ctx.startRendering();
}

/* ══════════════════ efeitos sonoros ══════════════════ */

export const SFX_LIST = [
  "whoosh", "pop", "click", "riser", "braam", "camera", "ding", "error",
  "boing", "typewriter", "transition_swipe", "crowd", "heartbeat", "static", "sparkle", "thunder",
] as const;

export async function generateSfx(id: string, seconds = 1.2): Promise<AudioBuffer> {
  const sr = 44100;
  const ctx = new OfflineAudioContext(2, Math.floor(sr * seconds), sr);
  const master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);

  const noiseBuf = (dur: number, curve = 2) => {
    const len = Math.max(1, Math.floor(sr * dur));
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, curve);
    return buf;
  };
  const play = (buf: AudioBuffer, at: number, filter: BiquadFilterType, freq: number, vol: number, q = 1) => {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(at);
  };
  const tone = (freq: number, at: number, dur: number, vol: number, type: OscillatorType = "sine", to?: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur);
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g);
    g.connect(master);
    o.start(at);
    o.stop(at + dur + 0.02);
  };

  switch (id) {
    case "whoosh":
      play(noiseBuf(0.7, 1.2), 0, "bandpass", 900, 0.5, 1.4);
      break;
    case "pop":
      tone(520, 0, 0.14, 0.5, "sine", 160);
      break;
    case "click":
      play(noiseBuf(0.05, 6), 0, "highpass", 3000, 0.5);
      break;
    case "riser":
      tone(180, 0, 1.6, 0.35, "sawtooth", 1600);
      play(noiseBuf(1.6, 0.6), 0, "highpass", 400, 0.25);
      break;
    case "braam":
      [55, 82.5, 110, 165].forEach((f, i) => tone(f, 0, 1.8, 0.28 / (i + 1), "sawtooth", f * 0.98));
      play(noiseBuf(1.8, 1.6), 0, "lowpass", 400, 0.35);
      break;
    case "camera":
      play(noiseBuf(0.06, 8), 0, "bandpass", 2200, 0.6);
      play(noiseBuf(0.1, 4), 0.07, "highpass", 1200, 0.4);
      break;
    case "ding":
      tone(1318, 0, 0.7, 0.35);
      tone(1976, 0.02, 0.6, 0.16);
      break;
    case "error":
      tone(220, 0, 0.24, 0.4, "square");
      tone(170, 0.18, 0.32, 0.4, "square");
      break;
    case "boing":
      tone(320, 0, 0.45, 0.45, "sine", 90);
      break;
    case "typewriter":
      for (let i = 0; i < 9; i++) play(noiseBuf(0.04, 9), i * 0.11 + Math.random() * 0.03, "highpass", 2600, 0.35);
      break;
    case "transition_swipe":
      play(noiseBuf(0.35, 1.5), 0, "bandpass", 1500, 0.45, 2);
      tone(900, 0, 0.3, 0.2, "triangle", 300);
      break;
    case "crowd":
      for (let i = 0; i < 130; i++) play(noiseBuf(0.09, 3), Math.random() * 1.4, "bandpass", 1200 + Math.random() * 2600, 0.16);
      break;
    case "heartbeat":
      [0, 0.3, 0.85, 1.12].forEach((t, i) => tone(i % 2 ? 58 : 48, t, 0.24, 0.5));
      break;
    case "static":
      play(noiseBuf(1.4, 0.15), 0, "bandpass", 2000, 0.35, 0.6);
      break;
    case "sparkle":
      [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, i * 0.07, 0.55, 0.16));
      break;
    case "thunder":
      play(noiseBuf(2.4, 1.1), 0, "lowpass", 220, 0.85);
      tone(48, 0, 2.2, 0.4, "sine", 30);
      break;
    default:
      tone(440, 0, 0.3, 0.35);
  }
  return ctx.startRendering();
}

/* ══════════════════ mixer (prévia + exportação) ══════════════════ */

interface ScheduledClip {
  node: AudioScheduledSourceNode;
  gain: GainNode;
}

export interface MixerEvents {
  onEnded?: () => void;
}

/**
 * Mixer em tempo real: agenda todos os áudios do projeto no AudioContext,
 * com fades, volume por clipe, ducking e um MediaStream para exportar junto
 * com o vídeo.
 */
export class ProjectAudioMixer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  private scheduled: ScheduledClip[] = [];
  private started = false;

  async start(project: Project, assets: MediaAsset[], fromTime: number, events: MixerEvents = {}) {
    this.stop();
    this.ctx = audioCtx();
    await this.ctx.resume().catch(() => undefined);
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 1;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -8;
    comp.ratio.value = 4;
    this.master.connect(comp);
    comp.connect(ctx.destination);
    this.streamDest = ctx.createMediaStreamDestination();
    comp.connect(this.streamDest);

    const t0 = ctx.currentTime + 0.12;
    const activeClips = project.clips.filter((c) => clipEnd(c) > fromTime);

    // envelope de voz para ducking (clipes com fala = clipes de vídeo sem ducking)
    const voiceBuffers = new Map<string, AudioBuffer>();
    for (const clip of activeClips) {
      const asset = assets.find((a) => a.id === clip.assetId);
      if (!asset || asset.kind === "image" || !asset.hasAudio) continue;
      const buf = await pool.decodeAudio(asset);
      if (buf) voiceBuffers.set(clip.id, buf);
    }

    let musicGainForDuck: GainNode | null = null;

    for (const clip of activeClips) {
      const asset = assets.find((a) => a.id === clip.assetId);
      if (!asset) continue;
      const track = project.tracks.find((t) => t.id === clip.trackId);
      if (track?.muted || clip.audio.muted) continue;
      const buffer = voiceBuffers.get(clip.id) ?? (asset.hasAudio ? await pool.decodeAudio(asset) : null);
      if (!buffer) continue;

      const source = clip.reverse ? reverseBuffer(ctx, buffer) : buffer;
      const node = ctx.createBufferSource();
      node.buffer = source;
      node.playbackRate.value = clamp(clip.speed, 0.1, 4);

      const gain = ctx.createGain();
      const baseVol = clamp(clip.audio.volume, 0, 4);
      const clipStartOffset = Math.max(0, fromTime - clip.start);
      const startAt = t0 + Math.max(0, clip.start - fromTime);
      const inPoint = clip.in + clipStartOffset * clip.speed;
      const remaining = clip.duration - clipStartOffset;
      if (remaining <= 0.02 || inPoint >= source.duration) continue;

      const fadeIn = clip.audio.fadeIn;
      const fadeOut = clip.audio.fadeOut;
      const volAt = (local: number) => {
        let v = baseVol;
        if (fadeIn > 0 && local < fadeIn) v *= local / fadeIn;
        if (fadeOut > 0 && local > remaining - fadeOut) v *= Math.max(0, (remaining - local) / fadeOut);
        return Math.max(0, v);
      };
      gain.gain.setValueAtTime(volAt(clipStartOffset), startAt);
      if (fadeIn > clipStartOffset) gain.gain.linearRampToValueAtTime(baseVol, startAt + (fadeIn - clipStartOffset));
      if (fadeOut > 0) {
        gain.gain.setValueAtTime(volAt(Math.max(0, remaining - fadeOut)), startAt + Math.max(0, remaining - fadeOut - clipStartOffset));
        gain.gain.linearRampToValueAtTime(0.0001, startAt + (remaining - clipStartOffset));
      }

      node.connect(gain);
      const isMusic = asset.kind === "audio";
      if (isMusic && clip.audio.ducking) {
        musicGainForDuck = gain;
      } else {
        gain.connect(this.master);
      }
      node.start(startAt, clamp(inPoint, 0, Math.max(0, source.duration - 0.01)));
      node.stop(startAt + remaining / Math.max(0.1, clip.speed) + 0.05);
      this.scheduled.push({ node, gain });
    }

    if (musicGainForDuck) {
      const duck = ctx.createGain();
      duck.gain.value = 1;
      musicGainForDuck.connect(duck);
      duck.connect(this.master);
      // ducking simples: abaixa enquanto existir clipe de vídeo com áudio acima
      const voiceClips = project.clips.filter((c) => {
        const a = assets.find((x) => x.id === c.assetId);
        return a?.kind === "video" && a.hasAudio && clipEnd(c) > fromTime;
      });
      voiceClips.forEach((vc) => {
        const s = t0 + Math.max(0, vc.start - fromTime);
        const e = s + Math.min(vc.duration, vc.duration - Math.max(0, fromTime - vc.start));
        if (e <= s) return;
        duck.gain.setValueAtTime(1, Math.max(t0, s - 0.25));
        duck.gain.linearRampToValueAtTime(0.22, s + 0.12);
        duck.gain.setValueAtTime(0.22, Math.max(s + 0.12, e - 0.2));
        duck.gain.linearRampToValueAtTime(1, e + 0.3);
      });
    }

    const end = Math.max(...project.clips.map((c) => clipEnd(c)), 0);
    if (events.onEnded && end > fromTime) {
      const timer = window.setTimeout(() => events.onEnded?.(), (end - fromTime) * 1000 + 250);
      this.scheduled.push({
        node: { stop: () => window.clearTimeout(timer) } as unknown as AudioScheduledSourceNode,
        gain: this.master,
      });
    }
    this.started = true;
  }

  getStream(): MediaStream | null {
    return this.streamDest?.stream ?? null;
  }

  setMaster(v: number) {
    if (this.master) this.master.gain.value = clamp(v, 0, 2);
  }

  get running() {
    return this.started;
  }

  stop() {
    this.scheduled.forEach(({ node }) => {
      try {
        node.stop();
      } catch {
        /* já parado */
      }
    });
    this.scheduled = [];
    try {
      this.master?.disconnect();
      this.streamDest?.disconnect();
    } catch {
      /* ignora */
    }
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.master = null;
    this.streamDest = null;
    this.started = false;
  }
}

function reverseBuffer(ctx: BaseAudioContext, buffer: AudioBuffer): AudioBuffer {
  const out = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const src = buffer.getChannelData(c);
    const dst = out.getChannelData(c);
    for (let i = 0; i < src.length; i++) dst[i] = src[src.length - 1 - i];
  }
  return out;
}

/** Cria um asset de áudio a partir de um AudioBuffer (música/SFX gerados). */
export function assetFromAudioBuffer(name: string, buffer: AudioBuffer, origin: MediaAsset["origin"] = "gerado"): { asset: MediaAsset; blob: Blob } {
  const blob = encodeWav(buffer);
  const url = URL.createObjectURL(blob);
  const asset: MediaAsset = {
    id: `asset_${Math.random().toString(36).slice(2, 10)}`,
    name,
    kind: "audio",
    url,
    width: 0,
    height: 0,
    duration: buffer.duration,
    hasAudio: true,
    origin,
    sizeBytes: blob.size,
    peaks: peaksFromBuffer(buffer, 220),
    createdAt: Date.now(),
  };
  return { asset, blob };
}
