/* main.js — Corrida 3D: loop, física, câmera, HUD e integração. */
import * as THREE from '../lib/three.module.js';
import { createWorld } from './world.js';
import { createSky, createClouds } from './atmosphere.js';
import { createNature, createGrassField } from './nature.js';
import { createTraffic } from './traffic.js';
import { createPeople } from './people.js';
import { createEffects } from './effects.js';
import { createAudio } from './audio.js';
import { createCar, DIMS } from './vehicle.js';
import { createObstacles } from './obstacles.js';
import { clamp01, lerp } from './noise.js';

const ui = {
  overlay: document.getElementById('overlay'),
  menu: document.getElementById('menu'),
  loading: document.getElementById('loading'),
  hud: document.getElementById('hud'),
  speed: document.getElementById('speed'),
  gear: document.getElementById('gear'),
  unit: document.getElementById('unit'),
  lap: document.getElementById('lap'),
  time: document.getElementById('time'),
  best: document.getElementById('best'),
  ped: document.getElementById('ped'),
  crash: document.getElementById('crashFlash'),
  minimap: document.getElementById('minimap'),
  toast: document.getElementById('toast'),
  qualityBtns: document.querySelectorAll('input[name="quality"]'),
  pauseMenu: document.getElementById('pauseMenu'),
};

let renderer, scene, camera;
let world, skyCtx, clouds, nature, grass, traffic, people, effects, audio, obstacles;
let carMesh, playerState;
let keys = {};
let running = false;
let muted = false;
let camMode = 'chase';
let quality = 'alta';
let disposed = false;
let started = false;
let gameState = 'countdown';
let countdownT = 3;
let lapInfo, hudState;

/* ------------------------------- boot ------------------------------- */

function init() {
  ui.qualityBtns.forEach((b) => b.addEventListener('change', () => (quality = b.value)));
  document.getElementById('startBtn').addEventListener('click', () => {
    ui.menu.style.display = 'none';
    ui.overlay.classList.remove('visible');
    ui.overlay.classList.remove('hidden');
    ui.loading.style.display = 'flex';
    setTimeout(() => buildGame(), 30);
  });
  window.addEventListener('pointerdown', () => { if (audio) audio.resume(); });
  window.addEventListener('keydown', () => { if (audio) audio.resume(); });
  document.getElementById('pauseBtn').addEventListener('click', pauseToggle);
  document.getElementById('resumeBtn').addEventListener('click', pauseToggle);
  document.getElementById('quitBtn').addEventListener('click', () => location.reload());
  document.getElementById('soundBtn').addEventListener('click', (e) => {
    muted = !muted;
    e.currentTarget.textContent = muted ? '🔇' : '🔊';
    if (audio) audio.setEnabled(!muted);
  });
  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    keys[e.code] = true;
    if (e.code === 'KeyP' || e.code === 'Escape') pauseToggle();
    if (e.code === 'KeyM') document.getElementById('soundBtn').click();
  });
  window.addEventListener('keyup', (e) => (keys[e.code] = false));
  window.addEventListener('blur', () => (keys = {}));
  window.addEventListener('resize', onResize);

  // toque (mobile)
  if (('ontouchstart' in window) || navigator.maxTouchPoints > 0) {
    document.body.classList.add('touch');
    document.querySelectorAll('#touchUI .tbtn').forEach((b) => {
      const set = (v) => (keys[b.dataset.k] = v);
      b.addEventListener('touchstart', (e) => { e.preventDefault(); set(true); }, { passive: false });
      b.addEventListener('touchend', (e) => { e.preventDefault(); set(false); }, { passive: false });
      b.addEventListener('touchcancel', () => set(false));
      b.addEventListener('mousedown', () => set(true));
      b.addEventListener('mouseup', () => set(false));
      b.addEventListener('mouseleave', () => set(false));
    });
  }
}

function buildGame() {
  disposed = false;
  scene = new THREE.Scene();
  const fog = new THREE.Fog(0xf3d9b4, 150, 1900);
  scene.fog = fog;

  camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 9000);
  camera.position.set(0, 3, -14);

  renderer = new THREE.WebGLRenderer({ antialias: quality !== 'baixa', powerPreference: 'high-performance' });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, quality === 'alta' ? 1.9 : 1.25));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const holder = document.getElementById('canvasHolder');
  holder.innerHTML = '';
  holder.appendChild(renderer.domElement);

  // ambiente (reflexo suave de céu nos carros)
  setupEnvironmentMap();

  // céu / luz / nuvens
  skyCtx = createSky(scene, fog);
  scene.add(skyCtx.dome);
  scene.add(skyCtx.sun);
  scene.add(skyCtx.sun.target);
  scene.add(skyCtx.hemi);
  clouds = createClouds(scene, fog);
  scene.add(clouds.points);

  // mundo (terreno/estrada/lago)
  world = createWorld(scene, quality);

  // natureza, pessoas, tráfego, obstáculos
  nature = createNature(scene, world, {});
  grass = createGrassField(scene, world);
  traffic = createTraffic(world, { count: quality === 'baixa' ? 7 : 14, scene });
  people = createPeople(scene, world, { count: quality === 'baixa' ? 34 : 60 });
  obstacles = createObstacles(scene, world);
  effects = createEffects(scene);
  effects.setWorld(world.heightAt);
  audio = createAudio();
  audio.ensure();
  if (muted) audio.setEnabled(false);

  // carro do jogador
  const playerCar = createCar(0xd02020);
  scene.add(playerCar.group);
  carMesh = playerCar;

  const startI = Math.floor(world.road.count * 0.08);
  const sp = world.road.getPointAt(startI);
  playerState = {
    x: sp.x, z: sp.z, yaw: Math.atan2(-world.road.T[startI][1], world.road.T[startI][0]),
    vx: 0, vz: 0, yawRate: 0,
    spd: 0, fv: 0, lv: 0,
    roadI: startI, lastProg: 0, meters: 0, lap: 1,
    steering: 0, wheelSpin: 0,
    offroad: false, inWater: false, wasInWater: false,
    brake: false, skidding: false, touched: 0,
  };
  playerCar.group.position.set(sp.x, sp.y, sp.z);
  playerCar.group.rotation.y = playerState.yaw;
  // câmera já nasce atrás do carro na largada
  {
    const fx = Math.cos(playerState.yaw), fz = -Math.sin(playerState.yaw);
    camPos.set(sp.x - fx * 7.2, sp.y + 3.0, sp.z - fz * 7.2);
    camLook.set(sp.x, sp.y + 1.1, sp.z);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
  }

  lapInfo = {
    best: null, current: performance.now(), last: null,
    peds: 0, crashCount: 0,
  };
  hudState = { toastT: 0 };

  // minimapa
  buildMinimap();

  // contagem
  gameState = 'countdown';
  countdownT = 3.0;
  ui.overlay.classList.add('hidden');
  ui.loading.style.display = 'none';
  ui.hud.classList.remove('hidden');
  setToast('🏁 Prepare-se!');
  scheduleCrossing();

  running = true;
  renderer.setAnimationLoop(loop);
}

/* pequeno mapa de ambiente para reflexos realistas */
function setupEnvironmentMap() {
  try {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const cx = c.getContext('2d');
    const grad = cx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#5d8fd0');
    grad.addColorStop(0.45, '#a8cfe0');
    grad.addColorStop(0.75, '#efc084');
    grad.addColorStop(1, '#8a9b6a');
    cx.fillStyle = grad; cx.fillRect(0, 0, 1024, 512);
    cx.fillStyle = '#fff6d8';
    cx.beginPath(); cx.arc(790, 120, 44, 0, 7); cx.fill();
    cx.fillStyle = 'rgba(255,246,216,0.12)';
    cx.beginPath(); cx.arc(790, 120, 130, 0, 7); cx.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const rt = pmrem.fromEquirectangular(tex);
    scene.environment = rt.texture;
    scene.environmentIntensity = 0.55;
    pmrem.dispose();
  } catch (e) { /* sem ambiente = ok */ }
}

/* ------------------------------ câmera ------------------------------ */

const camPos = new THREE.Vector3(0, 3, -12);
const camLook = new THREE.Vector3();
const camShake = new THREE.Vector3();

function updateCamera(dt, t) {
  const yaw = playerState.yaw;
  const fwd = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const right = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const spd = Math.min(1, playerState.spd / 46);
  let distB = 7.1 - spd * 0.7;
  let height = 2.9 - spd * 0.55;

  if (camMode === 'hood') {
    distB = 0.2; height = 1.22;
  }
  const desired = new THREE.Vector3()
    .copy(carMesh.group.position)
    .addScaledVector(fwd, -distB)
    .addScaledVector(right, 0.35 * playerState.steering * 0.0)
    .addScaledVector(new THREE.Vector3(0, 1, 0), height);

  const groundCam = world.heightAt(desired.x, desired.z) + 0.35;
  if (desired.y < groundCam) desired.y = lerp(desired.y, groundCam, 0.5);
  if (camMode === 'hood') desired.y = Math.max(desired.y, carMesh.group.position.y + 1.05);

  const k = 1 - Math.exp(-dt * (camMode === 'hood' ? 30 : 5.2));
  camPos.lerp(desired, k);
  camLook.lerp(
    new THREE.Vector3(carMesh.group.position.x, carMesh.group.position.y + 1.1, carMesh.group.position.z)
      .addScaledVector(fwd, spd * 4.5),
    Math.min(1, dt * 14)
  );
  // tremor em impacto
  camShake.multiplyScalar(Math.exp(-dt * 8));
  camera.position.copy(camPos).add(camShake);
  camera.lookAt(camLook);
  const fov = 62 + spd * 14 + (playerState.spd > 40 ? Math.sin(t * 12) * 0.2 : 0);
  camera.fov += (fov - camera.fov) * Math.min(1, dt * 3);
  camera.updateProjectionMatrix();
}

/* ------------------------------ física ------------------------------ */

const PHYS_DT = 1 / 120;
let acc = 0;
let lastT = performance.now();
let frameCount = 0;
let fxTimer = 0;
let skidTimer = 0;
let crossingTimer = 6;

function loop() {
  if (!running) return;
  const now = performance.now();
  let dt = Math.min(0.1, (now - lastT) / 1000);
  lastT = now;
  if (dt <= 0) return;

  if (gameState === 'countdown') {
    countdownT -= dt;
    const show = Math.ceil(countdownT);
    if (countdownT <= 0) {
      gameState = 'drive';
      lapInfo.crossT = lapInfo.current = performance.now();
      setToast('VAI! 🏁');
      if (audio) { audio.ensure(); audio.resume(); }
    } else if (show !== hudState.cd) {
      hudState.cd = show;
      setToast(show <= 0 ? 'VAI! 🏁' : String(show));
    }
  } else if (gameState === 'drive') {
    acc += dt;
    let steps = 0;
    while (acc >= PHYS_DT && steps < 8) {
      physicsStep(PHYS_DT);
      acc -= PHYS_DT;
      steps++;
    }
    if (steps === 8) acc = 0;
  } else if (gameState === 'paused') {
    lastT = now;
    renderer.render(scene, camera);
    return;
  }

  // atualiza mundo
  const t = now / 1000;
  frameCount++;
  const playerInfo = { pos: { x: playerState.x, z: playerState.z }, speed: playerState.spd, i: playerState.roadI, lat: 0 };
  traffic.update(Math.min(dt, 1 / 30), t, playerState);
  people.update(Math.min(dt, 1 / 30), t, { pos: { x: playerState.x, z: playerState.z }, speed: playerState.spd, i: playerState.roadI });
  obstacles.update(dt);
  grass.update(playerState.x, playerState.z);
  clouds.update(dt, camera.position, t);
  nature.setWind(0.7 + Math.sin(t * 0.7) * 0.22 + Math.sin(t * 2.3) * 0.1);

  if (world.water) world.water.uni.time.value = t;
  updateCamera(dt, t);
  updateLights();
  updateFx(dt, t);
  updateAudio(dt);
  updateHUD();

  if (gameState === 'drive') {
    lapLogic();
    crossingLogic(dt);
    pedestrianHits();
  }
  updateMinimap();
  renderer.render(scene, camera);
}

function physicsStep(dt) {
  const st = playerState;
  // entrada
  const throttle = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
  const steerIn = (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0) - (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0);
  const handbrake = !!(keys['Space'] || keys['ShiftLeft']);

  const fw = new THREE.Vector3(Math.cos(st.yaw), 0, -Math.sin(st.yaw));
  const rt = new THREE.Vector3(Math.sin(st.yaw), 0, Math.cos(st.yaw));

  // solo
  const h = world.heightAt(st.x, st.z);
  const dR = world.roadDist(st.x, st.z);
  const onRoad = dR < 4.4;
  const surface = onRoad ? 1 : 0.82; // terra reduz um pouco
  st.offroad = !onRoad;
  const qLake = world.lakeQ(st.x, st.z);
  st.inWater = qLake < 1.3 && h < world.waterLevel + 0.1;

  // velocidade atual
  let fv = st.vx * fw.x + st.vz * fw.z;
  let lv = st.vx * rt.x + st.vz * rt.z;

  // aceleração longitudinal
  let aF = 0;
  const spd = Math.hypot(st.vx, st.vz);
  st.spd = spd;
  if (throttle > 0) {
    if (st.inWater) aF += 2.6 * surface;
    else {
      const Pv = 137 / Math.max(1.4, Math.abs(fv));
      aF += Math.min(9.6, Pv) * surface * throttle;
    }
    aF -= 0.9;
  } else if (throttle < 0) {
    if (fv > 0.4) aF -= 9.5 * -throttle * surface;
    else aF += 3.4 * throttle; // ré
  } else {
    aF -= Math.sign(fv) * Math.min(2.6, 1.1 + spd * 0.05); // freio-motor
  }
  if (handbrake && spd > 1) aF -= Math.sign(fv) * 7.5;
  if (st.inWater) aF -= Math.sign(fv) * Math.min(5, Math.max(0, h - world.waterLevel) * 14);
  // arrasto
  const aero = 0.00028 * spd * spd + 0.30;
  if (spd > 0.01) {
    const ax = -(st.vx / spd) * aero;
    const az = -(st.vz / spd) * aero;
    st.vx += ax * dt;
    st.vz += az * dt;
  }
  st.vx += fw.x * aF * dt;
  st.vz += fw.z * aF * dt;

  // direção (bicicleta ideal + leve subviragem)
  const maxSteer = 0.5;
  const targetSteer = steerIn * maxSteer;
  st.steering += (targetSteer - st.steering) * Math.min(1, dt * 7);
  const steerLat = 0.34 * Math.exp(-spd * 0.016); // menos ângulo em alta velocidade
  const targetYawRate = Math.sign(st.steering) * Math.min(1.6, Math.abs(st.steering) * (spd / (DIMS.wheelBase * (1 + spd * spd * 0.0006))) * 6.2);
  const resp = 3.2 + Math.min(6, spd * 0.16);
  st.yawRate += (targetYawRate - st.yawRate) * Math.min(1, dt * resp);
  if (spd < 0.5 && Math.abs(st.yawRate) > 0) st.yawRate *= Math.exp(-dt * 9);
  st.yaw += st.yawRate * dt;

  // gira o vetor velocidade para o novo referencial (curva)
  const cosY = Math.cos(st.yawRate * dt), sinY = Math.sin(st.yawRate * dt);
  const oldX = st.vx, oldZ = st.vz;
  st.vx = oldX * cosY + oldZ * sinY;
  st.vz = -oldX * sinY + oldZ * cosY;

  // aderência lateral
  fv = st.vx * fw.x + st.vz * fw.z;
  lv = st.vx * rt.x + st.vz * rt.z;
  st.fv = fv; st.lv = lv;
  const gripLat = handbrake ? 4.2 : 14.5;
  const latDamp = Math.min(1, (Math.abs(lv) * 6) / gripLat) * 14 + 4;
  st.vx -= rt.x * lv * Math.min(1, dt * latDamp);
  st.vz -= rt.z * lv * Math.min(1, dt * latDamp);
  if (handbrake) {
    // ajuda a girar o carro
    st.yawRate += (targetYawRate * 1.5) * Math.min(1, dt * 4);
  }

  // estado de pneus (áudio/marcas/luzes)
  st.brake = (throttle < 0 && fv > 0.4) || handbrake;
  st.skidding = (Math.abs(lv) > 2.4 && spd > 3) || (handbrake && spd > 4);

  // movimento
  st.x += st.vx * dt;
  st.z += st.vz * dt;

  // limites do mundo
  const rr = Math.hypot(st.x, st.z);
  if (rr > 1550) {
    const push = (rr - 1550) * dt * 30;
    st.x -= (st.x / rr) * push * 10;
    st.z -= (st.z / rr) * push * 10;
  }

  // colisões com estáticos
  st.touched = Math.max(0, st.touched - dt);
  resolveCollisions(dt);

  // não deixa afundar na parte funda do lago
  const qL = world.lakeQ(st.x, st.z);
  if (qL < 0.6) {
    const e = 3;
    const qx1 = world.lakeQ(st.x + e, st.z), qx2 = world.lakeQ(st.x - e, st.z);
    const qz1 = world.lakeQ(st.x, st.z + e), qz2 = world.lakeQ(st.x, st.z - e);
    const gx = qx1 - qx2, gz = qz1 - qz2;
    const gl = Math.hypot(gx, gz) || 1;
    const push = (0.6 - qL) * 2.2;
    st.x += (gx / gl) * push;
    st.z += (gz / gl) * push;
    st.vx *= Math.exp(-dt * 3.2);
    st.vz *= Math.exp(-dt * 3.2);
  }

  // altura
  const hh = world.heightAt(st.x, st.z);
  if (st.inWater && qLake < 1.25) {
    // flutua levemente na água rasa
  }
  st.y = hh;

  // info estrada
  const near = world.road.nearest(st.x, st.z);
  st.roadI = near.i;
  const perIdx = world.road.length / world.road.count;

  // progresso ao longo da pista (assinado; permite volta)
  let dl = near.i - st.lastProg;
  const half = world.road.count / 2;
  if (dl > half) dl -= world.road.count;
  if (dl < -half) dl += world.road.count;
  st.meters += dl * perIdx;
  st.lastProg = near.i;
}

/* colisões do jogador com o mundo e itens dinâmicos */
const qRes = [];
function resolveCollisions(dt) {
  const st = playerState;
  const fw = new THREE.Vector3(Math.cos(st.yaw), 0, -Math.sin(st.yaw));
  const carR = 1.05;
  const centers = [
    { x: st.x + fw.x * 1.15, z: st.z + fw.z * 1.15, r: 0.95 },
    { x: st.x - fw.x * 1.15, z: st.z - fw.z * 1.15, r: 0.95 },
  ];
  const all = [];
  world.colliders.query(st.x, st.z, 4.2, qRes);
  all.push(...qRes);
  for (const ob of obstacles.near(st.x, st.z, 6)) all.push({ x: ob.x, z: ob.z, r: ob.r, kind: ob.kind, dyn: ob });
  for (let cIdx = 0; cIdx < centers.length; cIdx++) {
    const c = centers[cIdx];
    for (const item of all) {
      if (item.dyn && item.dyn.state !== 'rest') continue;
      const dx = c.x - item.x, dz = c.z - item.z;
      const d2 = dx * dx + dz * dz;
      const rSum = c.r + item.r;
      if (d2 >= rSum * rSum) continue;
      const d = Math.sqrt(d2) || 0.001;
      const nx = dx / d, nz = dz / d;
      const overlap = rSum - d;
      c.x += nx * overlap; c.z += nz * overlap;
      // velocidade relativa
      const vn = st.vx * nx + st.vz * nz;

      // obstáculos dinâmicos voam
      if (item.dyn) {
        const speed = Math.hypot(st.vx, st.vz);
        if (speed > 1.6) {
          obstacles.knock(item.dyn, st.x, st.z, fw.x, fw.z, Math.min(2.8, speed * 0.12 + 0.6));
          if (st.touched <= 0) {
            st.touched = 0.25;
            if (audio) audio.impact('car');
          }
          continue;
        }
      }
      const kind = item.kind || 'solid';
      if (vn < 0) {
        const hardness = kind === 'guardrail' ? 0.38 : kind === 'bush' ? 0.1 : 0.12;
        st.vx -= nx * vn * (1 + hardness);
        st.vz -= nz * vn * (1 + hardness);
        const after = st.vx * nx + st.vz * nz;
        if (after > -1) {
          if (kind === 'tree' || kind === 'rock' || kind === 'guardrail') {
            st.vx -= nx * (after - (-0.6)) * 0.7;
            st.vz -= nz * (after - (-0.6)) * 0.7;
            st.yawRate *= 0.3;
          }
        }
        if (kind === 'bush') { st.vx *= 0.995; st.vz *= 0.995; }
        // efeitos
        if (st.touched <= 0) {
          st.touched = 0.45;
          const impact = Math.abs(vn);
          if (impact > 3) {
            const ip = impact / 24;
            if (audio) audio.impact(kind === 'guardrail' ? 'metal' : 'car');
            camShake.set((Math.random() - 0.5) * 0.5, -Math.random() * 0.4, (Math.random() - 0.5) * 0.5).multiplyScalar(Math.min(1, ip));
            if (kind === 'guardrail' && ip > 0.35) hudState.crashFlash = 0.4;
          }
        }
        if (st.touched > 0 && kind === 'guardrail') {
          // risco contínuo
          if (Math.abs(vn) < 6 && Math.hypot(st.vx, st.vz) > 6) {
            const cx = (c.x + item.x) / 2, cz = (c.z + item.z) / 2;
            if (frameCount % 2 === 0) effects.sparks(cx, world.heightAt(cx, cz) + 0.6, cz);
          }
        }
      }
    }
  }
  st.x = (centers[0].x + centers[1].x) / 2;
  st.z = (centers[0].z + centers[1].z) / 2;
}

/* efeitos de solo / pneus */
function updateFx(dt, t) {
  const st = playerState;
  if (gameState !== 'drive') return;
  // contato roda
  const fw = new THREE.Vector3(Math.cos(st.yaw), 0, -Math.sin(st.yaw));
  const rt = new THREE.Vector3(Math.sin(st.yaw), 0, Math.cos(st.yaw));
  const spd = st.spd;
  const onRoad = !st.offroad;
  const hardBrake = st.brake && spd > 7;

  fxTimer -= dt;
  const rearX = st.x - fw.x * 1.3, rearZ = st.z - fw.z * 1.3;
  const hY = world.heightAt(st.x, st.z);
  const drift = !onRoad && spd > 4 && Math.abs(st.yawRate) > 0.12;

  if (fxTimer <= 0) {
    if (st.offroad && spd > 1.5) effects.dust(rearX, hY + 0.1, rearZ, 1, 1.2, 1.6);
    if (drift) effects.dust(st.x - fw.x * 1.9, hY, st.z - fw.z * 1.9, 2, 2.2, 2.2);
    if (st.inWater && !st.wasInWater) { effects.splash(st.x, world.waterLevel, st.z, st.vx, st.vz, Math.min(1, spd / 20)); if (audio) audio.splash(); }
    if (st.wasInWater && !st.inWater) { effects.splash(st.x, world.waterLevel, st.z, 0, 0, 0.5); if (audio) audio.splash(0.5); }
    st.wasInWater = st.inWater;
    fxTimer = st.offroad ? 0.05 : 0.09;
  }

  // derrapagens no asfalto
  skidTimer -= dt;
  const skidNow = (st.skidding || hardBrake) && onRoad && spd > 8;
  if (skidNow && skidTimer <= 0) {
    skidTimer = 0.02;
    const yawA = st.yaw + Math.PI / 2;
    effects.skid(rearX, rearZ, yawA, 0.24, Math.max(0.35, spd * 0.03));
    effects.skid(rearX - rt.x * 0.7, rearZ - rt.z * 0.7, yawA, 0.24, Math.max(0.35, spd * 0.03));
  }
  // rodas girando
  const spin = (spd * dt) / 0.33;
  for (const w of carMesh.axles.all) w.rotation.x -= spin * (playerState.vx * fw.x + playerState.vz * fw.z >= 0 ? 1 : -1) * (1 - clamp01(st.lv) * 0.2);
  const steerVis = st.steering * 2.6;
  carMesh.steer.wheelFL.rotation.y += (steerVis - carMesh.steer.wheelFL.rotation.y) * Math.min(1, dt * 8);
  carMesh.steer.wheelFR.rotation.y += (steerVis - carMesh.steer.wheelFR.rotation.y) * Math.min(1, dt * 8);

  // orientação do carro no terreno
  const n = world.normalAt(st.x, st.z);
  const q = alignCar(n, fw);
  carMesh.group.position.set(st.x, hY, st.z);
  carMesh.group.quaternion.copy(q);
  carMesh.setBrake(st.brake || hardBrake);
}

function alignCar(normal, fwd) {
  // base ortonormal: frente = rumo no plano, cima ~ normal do terreno
  const x = fwd.clone().normalize();
  let z = new THREE.Vector3().crossVectors(x, normal);
  if (z.lengthSq() < 1e-8) z.set(0, 0, 1);
  z.normalize();
  const y = new THREE.Vector3().crossVectors(z, x).normalize();
  const m = new THREE.Matrix4().makeBasis(x, y, z);
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

/* luzes seguem o carro */
function updateLights() {
  const sun = skyCtx.sun;
  sun.position.set(playerState.x + 1000, 700, playerState.z + 500);
  sun.target.position.set(playerState.x, world.heightAt(playerState.x, playerState.z), playerState.z);
  sun.target.updateMatrixWorld();
}

function updateAudio(dt) {
  if (!audio) return;
  const st = playerState;
  const spd = st.spd;
  const gearF = Math.min(1, Math.max(0, ((spd % 21) / 21) * 0.82 + 0.18));
  audio.update(dt, {
    rpm: clamp01(gearF + (keys['KeyW'] && spd < 4 ? 0.5 : 0)),
    throttle: keys['KeyW'] || keys['ArrowUp'] ? 1 : 0,
    speed: spd,
    offroad: st.offroad ? 1 : 0,
  });
}

/* ------------------------------ HUD ------------------------------ */

function fmtTime(ms) {
  if (ms == null) return '--:--.---';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mm = Math.floor((ms % 1000));
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(mm).padStart(3, '0')}`;
}

function updateHUD() {
  const st = playerState;
  const kmh = Math.abs(st.spd * 3.6);
  ui.speed.textContent = Math.round(kmh);
  ui.unit.textContent = 'km/h';
  const gear = Math.max(1, Math.min(6, Math.floor(st.spd / 8.5) + (st.fv >= 0 ? 1 : 1)));
  ui.gear.textContent = st.fv < -0.5 ? 'R' : 'D' + Math.min(6, gear);
  ui.lap.textContent = `Volta ${Math.max(1, st.lap)}`;
  if (gameState === 'drive' && lapInfo.current) {
    ui.time.textContent = fmtTime(performance.now() - lapInfo.current);
  }
  ui.best.textContent = `Melhor: ${fmtTime(lapInfo.best)}`;
  ui.ped.textContent = `🚶 ${lapInfo.peds}`;
  if (hudState.crashFlash > 0) {
    hudState.crashFlash -= 1 / 60;
    ui.crash.style.opacity = String(Math.max(0, hudState.crashFlash));
  } else ui.crash.style.opacity = '0';
}

function setToast(msg, ms = 1600) {
  if (!ui.toast) return;
  ui.toast.textContent = msg;
  ui.toast.classList.add('show');
  clearTimeout(ui.toast._t);
  ui.toast._t = setTimeout(() => ui.toast.classList.remove('show'), ms);
}

function buildMinimap() {
  const cv = ui.minimap;
  if (!cv) return;
  const P = world.roadPts;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < P.length; i += 5) {
    minX = Math.min(minX, P[i].x); maxX = Math.max(maxX, P[i].x);
    minZ = Math.min(minZ, P[i].z); maxZ = Math.max(maxZ, P[i].z);
  }
  const pad = 8;
  const scl = Math.min((cv.width - pad * 2) / (maxX - minX), (cv.height - pad * 2) / (maxZ - minZ));
  function mapX(x) { return pad + (x - minX) * scl; }
  function mapZ(z) { return pad + (z - minZ) * scl; }
  // camada estática em canvas offscreen
  if (!cv._bg) {
    const bg = document.createElement('canvas');
    bg.width = cv.width; bg.height = cv.height;
    cv._bg = bg;
    const ctx = bg.getContext('2d');
    ctx.fillStyle = 'rgba(6,10,16,0.75)';
    ctx.fillRect(0, 0, bg.width, bg.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < P.length; i += 5) {
      const x = mapX(P[i].x), y = mapZ(P[i].z);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    const lc = world.lakeCenter;
    ctx.fillStyle = 'rgba(120,190,230,0.5)';
    ctx.beginPath();
    ctx.ellipse(mapX(lc.x), mapZ(lc.z), 330 * scl * 0.9, 265 * scl, 0, 0, 7);
    ctx.fill();
  }
  ui.minimap._map = { mapX, mapZ };
}

function updateMinimap() {
  const cv = ui.minimap;
  if (!cv || !cv._map) return;
  const ctx = cv.getContext('2d');
  const { mapX, mapZ } = cv._map;
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (cv._bg) ctx.drawImage(cv._bg, 0, 0);
  const st = playerState;
  const yaw = st.yaw;
  ctx.save();
  ctx.translate(mapX(st.x), mapZ(st.z));
  ctx.rotate(-yaw);
  ctx.fillStyle = '#ffd54a';
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(3.2, 3);
  ctx.lineTo(-3.2, 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* ------------------------------ voltas ------------------------------ */

function lapLogic() {
  const st = playerState;
  const lapMeters = world.road.length;
  const crossed = Math.floor(st.meters / lapMeters);
  const newLap = Math.max(1, crossed + 1);
  if (newLap !== st.lap) {
    const now = performance.now();
    if (crossed >= 1) {
      const lapMs = now - (lapInfo.crossT || now);
      if (lapInfo.best == null || lapMs < lapInfo.best) lapInfo.best = lapMs;
      lapInfo.last = lapMs;
      setToast(`Volta ${newLap} — ${fmtTime(lapMs)}`, 2400);
    }
    lapInfo.crossT = lapInfo.current = now;
    st.lap = newLap;
  }
}

/* eventos de pedestres atravessando */
const CROSS_ZONES = [0.1, 0.24, 0.38, 0.52, 0.66, 0.8, 0.94];
function scheduleCrossing() {
  crossingTimer = 6 + Math.random() * 8;
  hudState.nextCross = CROSS_ZONES[Math.floor(Math.random() * CROSS_ZONES.length)];
}

function crossingLogic(dt) {
  crossingTimer -= dt;
  if (crossingTimer <= 0 && gameState === 'drive') {
    const frac = ((hudState.nextCross ?? 0.5) + (Math.random() - 0.5) * 0.06 + 1) % 1;
    const zoneI = Math.floor(frac * world.road.count);
    const fromSide = Math.random() < 0.5 ? 'left' : 'right';
    const p = people.requestCrossing(zoneI, fromSide);
    if (p) setToast('Alguém está atravessando! ⚠️', 1400);
    scheduleCrossing();
  }
}

/* atropelamentos */
function pedestrianHits() {
  const st = playerState;
  const spd = st.spd;
  if (spd < 1.2 || gameState !== 'drive') return;
  const cx = st.x, cz = st.z;
  for (const p of people.persons) {
    if (p.dead || !p.alive) continue;
    const dx = p.g.position.x - cx, dz = p.g.position.z - cz;
    if (dx * dx + dz * dz > 3.1) continue;
    const d = Math.hypot(dx, dz) || 1;
    const fx = dx / d, fz = dz / d;
    if (spd > 3.2) {
      p.dead = true; p.landed = false;
      p.vel.set(
        st.vx * 0.42 + fx * 2.6 + (Math.random() - 0.5) * 2,
        4.4 + Math.random() * 2.2,
        st.vz * 0.42 + fz * 2.6 + (Math.random() - 0.5) * 2
      );
      p.g.rotation.set(0, p.g.rotation.y, (Math.random() - 0.5) * 0.35);
      p.legL.rotation.x = 0; p.legR.rotation.x = 0;
      lapInfo.peds++;
      hudState.crashFlash = 0.55;
      setToast('💥 Atropelamento!', 1500);
      if (audio) audio.impact('ped');
    } else {
      p.dir.set(fx, 0, fz);
      p.speed = 5.4;
      p.panicCd = 3.5;
    }
  }
  // cachorros também fogem/levam
  for (const dog of people.dogs) {
    if (dog.dead) continue;
    const dx = dog.g.position.x - cx, dz = dog.g.position.z - cz;
    if (dx * dx + dz * dz > 2.6) continue;
    const d = Math.hypot(dx, dz) || 1;
    if (spd > 3.6) {
      dog.dead = true;
      dog.vel = new THREE.Vector3(st.vx * 0.4 + (dx / d) * 2.4, 3.2 + Math.random(), st.vz * 0.4 + (dz / d) * 2.4);
      dog.corpseT = 0;
      dog.side = Math.random() < 0.5 ? 1 : -1;
    } else {
      dog.panicCd = 4;
      dog.dir.set(dx / d, 0, dz / d);
      dog.speed = 8;
    }
  }
}

/* ------------------------------ loop helpers ------------------------------ */

function onResize() {
  if (!camera) return;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

function pauseToggle() {
  if (!running) return;
  if (gameState === 'drive') {
    gameState = 'paused';
    ui.pauseMenu.classList.remove('hidden');
    renderer.setAnimationLoop(null);
  } else if (gameState === 'paused') {
    gameState = 'drive';
    ui.pauseMenu.classList.add('hidden');
    renderer.setAnimationLoop(loop);
    lastT = performance.now();
  }
}

init();
