/* audio.js — áudio procedural (motor, vento, pneus, natureza, colisões). */
export function createAudio() {
  let ctx = null;
  let master, engineBus, envBus, fxBus;
  let engineOsc1, engineOsc2, engineSub, engineFilter, engineGain, engineSubGain;
  let windGain, windFilter, windSrc;
  let enabled = true;
  let birdTimer = 0, cricketTimer = 0;
  const noiseBufRef = { buf: null };

  function ensure() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { ctx = null; return; }
    const masterG = ctx.createGain();
    masterG.gain.value = 0.9;
    masterG.connect(ctx.destination);
    master = masterG;

    engineBus = ctx.createGain(); engineBus.gain.value = 1; engineBus.connect(master);
    envBus = ctx.createGain(); envBus.gain.value = 0.7; envBus.connect(master);
    fxBus = ctx.createGain(); fxBus.gain.value = 1; fxBus.connect(master);

    // ruído branco compartilhado
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseBufRef.buf = buf;

    // ---- motor ----
    engineOsc1 = ctx.createOscillator(); engineOsc1.type = 'sawtooth';
    engineOsc2 = ctx.createOscillator(); engineOsc2.type = 'square';
    engineSub = ctx.createOscillator(); engineSub.type = 'sine';
    engineFilter = ctx.createBiquadFilter(); engineFilter.type = 'lowpass'; engineFilter.frequency.value = 700;
    engineFilter.Q.value = 2.2;
    engineGain = ctx.createGain(); engineGain.gain.value = 0.0;
    engineSubGain = ctx.createGain(); engineSubGain.gain.value = 0.0;
    const g1 = ctx.createGain(); g1.gain.value = 0.28;
    const g2 = ctx.createGain(); g2.gain.value = 0.1;
    engineOsc1.connect(g1).connect(engineFilter);
    engineOsc2.connect(g2).connect(engineFilter);
    engineFilter.connect(engineGain).connect(engineBus);
    engineSub.connect(engineSubGain).connect(engineBus);
    engineOsc1.start(); engineOsc2.start(); engineSub.start();

    // ---- vento ----
    const windSrcNode = ctx.createBufferSource();
    windSrcNode.buffer = buf; windSrcNode.loop = true;
    windFilter = ctx.createBiquadFilter(); windFilter.type = 'bandpass'; windFilter.frequency.value = 480; windFilter.Q.value = 0.6;
    windGain = ctx.createGain(); windGain.gain.value = 0;
    windSrcNode.connect(windFilter).connect(windGain).connect(envBus);
    windSrcNode.start();
    windSrc = windSrcNode;
  }

  function resume() {
    if (!ctx && enabled) ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  /* colisão / impacto */
  function impact(kind = 'car') {
    if (!ctx || !master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const f0 = kind === 'ped' ? 140 : kind === 'metal' ? 120 : 80;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, f0 * 0.35), t + (kind === 'metal' ? 0.09 : 0.22));
    gain.gain.setValueAtTime(kind === 'ped' ? 0.5 : 0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'metal' ? 0.14 : 0.4));
    osc.connect(gain).connect(fxBus);
    osc.start(t); osc.stop(t + 0.5);
    // ruído de impacto
    const src = ctx.createBufferSource(); src.buffer = noiseBufRef.buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = kind === 'metal' ? 2600 : 900;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(kind === 'ped' ? 0.2 : 0.5, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    src.connect(bp).connect(ng).connect(fxBus);
    src.start(t); src.stop(t + 0.3);
  }

  function splash(intensity = 1) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBufRef.buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(1600, t);
    bp.frequency.exponentialRampToValueAtTime(300, t + 0.4);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.5 * intensity, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    src.connect(bp).connect(ng).connect(fxBus);
    src.start(t); src.stop(t + 0.6);
    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t); osc.frequency.exponentialRampToValueAtTime(60, t + 0.3);
    const og = ctx.createGain(); og.gain.setValueAtTime(0.3, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(og).connect(fxBus); osc.start(t); osc.stop(t + 0.4);
  }

  /* roçada em guard-rail — chiado metálico contínuo */
  function scrapeStart() {
    if (!ctx) return null;
    const src = ctx.createBufferSource(); src.buffer = noiseBufRef.buf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 3;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(bp).connect(g).connect(fxBus);
    src.start();
    return { node: src, g, bp, t: 0 };
  }
  function scrapeUpdate(sc, dt, intensity) {
    if (!sc || !ctx) return;
    sc.t += dt;
    sc.g.gain.value = Math.min(0.5, intensity);
    sc.bp.frequency.value = 1900 + Math.sin(sc.t * 60) * 500 + intensity * 500;
  }
  function scrapeStop(sc) {
    if (!sc || !ctx) return;
    const t = ctx.currentTime;
    sc.g.gain.setTargetAtTime(0, t, 0.03);
    sc.node.stop(t + 0.2);
  }

  /* chirp de pássaro */
  function bird() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = 3 + Math.floor(Math.random() * 4);
    let t0 = t;
    const f = 1800 + Math.random() * 900;
    for (let i = 0; i < notes; i++) {
      const osc = ctx.createOscillator(); osc.type = 'sine';
      const g = ctx.createGain();
      const dur = 0.05 + Math.random() * 0.05;
      const f1 = f * (1 + (Math.random() - 0.5) * 0.6);
      osc.frequency.setValueAtTime(f1, t0);
      osc.frequency.exponentialRampToValueAtTime(f1 * (0.7 + Math.random() * 0.6), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.03, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(envBus);
      osc.start(t0); osc.stop(t0 + dur + 0.05);
      t0 += dur + 0.02 + Math.random() * 0.02;
    }
  }

  /* grilo / insetos */
  function cricket() {
    if (!ctx) return;
    const t = ctx.currentTime;
    for (let p = 0; p < 8; p++) {
      const osc = ctx.createOscillator(); osc.type = 'sine';
      const g = ctx.createGain();
      const f = 3300 + Math.random() * 400;
      osc.frequency.setValueAtTime(f, t + p * 0.03);
      g.gain.setValueAtTime(0.012, t + p * 0.03);
      g.gain.setValueAtTime(0.0001, t + p * 0.03 + 0.02);
      osc.connect(g).connect(envBus);
      osc.start(t + p * 0.03); osc.stop(t + p * 0.03 + 0.05);
    }
  }

  let retryT = 0;
  function update(dt, state) {
    if (!ctx || !master) return;
    retryT -= dt;
    if (ctx.state === 'suspended' && retryT <= 0) {
      retryT = 1;
      ctx.resume().catch(() => {});
    }
    // estado: {rpm(0..1), throttle, speed m/s, slip, offroad}
    const t = ctx.currentTime;
    // motor
    const rpm = Math.max(0.06, Math.min(1.15, state.rpm));
    const f0 = 46 + rpm * 105;
    engineOsc1.frequency.setValueAtTime(f0, t);
    engineOsc2.frequency.setValueAtTime(f0 * 0.5, t);
    engineSub.frequency.setValueAtTime(f0 * 0.5, t);
    const load = 0.45 + state.throttle * 0.55;
    engineFilter.frequency.setValueAtTime(350 + rpm * 1600 * load, t);
    const vol = 0.10 + rpm * 0.16 + state.throttle * 0.08;
    engineGain.gain.setValueAtTime(vol, t);
    engineSubGain.gain.setValueAtTime(0.10 + rpm * 0.13 * load, t);
    // vento
    const sp = Math.max(0, state.speed);
    const targetWind = Math.min(0.5, (sp / 46) * (sp / 46) * 0.62) * (state.offroad ? 1.25 : 1);
    windGain.gain.setValueAtTime(targetWind, t);
    windFilter.frequency.setValueAtTime(300 + sp * 14, t);
    // pássaros / grilos eventuais
    birdTimer -= dt;
    if (birdTimer <= 0) {
      bird();
      birdTimer = 7 + Math.random() * 16;
    }
    cricketTimer -= dt;
    if (cricketTimer <= 0) {
      cricket();
      cricketTimer = 6 + Math.random() * 10;
    }
  }

  function setEnabled(on) {
    enabled = on;
    if (ctx) master.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.05);
  }

  return { ensure, resume, setEnabled, impact, splash, scrapeStart, scrapeUpdate, scrapeStop, update };
}
