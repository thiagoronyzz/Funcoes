/* Valida estabilidade numérica da física do carro (espelho do main.js). */
import { createWorld } from '../src/world.js';
import { mulberry32 } from '../src/noise.js';
import * as THREE from '../lib/three.module.js';

const document = {
  createElement() { return { width: 16, height: 16, getContext: () => new Proxy({}, { get: () => () => 0 }) }; },
};
globalThis.document = document;

const scene = new THREE.Scene();
const world = createWorld(scene, 'media');

const st = {
  x: 0, z: -1070, yaw: 0, vx: 0, vz: 0, yawRate: 0,
  steering: 0, spd: 0, lastProg: 0, roadI: 0,
};
st.yaw = Math.atan2(-world.road.T[0][1], world.road.T[0][0]);
const dt = 1 / 120;
let throttle = 1, steer = 0;
const rand = mulberry32(1);
const SPEEDS = [];
let maxSpeed = 0, maxLateral = 0;
let guardrailHits = 0;

for (let s = 0; s < 30 * 120; s++) {
  if (s % (6 * 120) === 0) steer = (rand() - 0.5) * 1.6;
  if (s > 20 * 120) throttle = -1; // freia no final
  const fw = { x: Math.cos(st.yaw), z: -Math.sin(st.yaw) };
  const rt = { x: Math.sin(st.yaw), z: Math.cos(st.yaw) };
  const h = world.heightAt(st.x, st.z);
  const dR = world.roadDist(st.x, st.z);
  const onRoad = dR < 4.4;
  let fv = st.vx * fw.x + st.vz * fw.z;
  let lv = st.vx * rt.x + st.vz * rt.z;
  let aF = 0;
  const spd = Math.hypot(st.vx, st.vz);
  if (throttle > 0) aF += Math.min(9.6, 137 / Math.max(1.4, Math.abs(fv))) * (onRoad ? 1 : 0.82) * throttle - 0.9;
  else if (throttle < 0) aF -= 9.5 * -throttle * (onRoad ? 1 : 0.82);
  else aF -= Math.sign(fv) * Math.min(2.6, 1.1 + spd * 0.05);
  const aero = 0.00028 * spd * spd + 0.3;
  if (spd > 0.01) {
    st.vx -= (st.vx / spd) * aero * dt;
    st.vz -= (st.vz / spd) * aero * dt;
  }
  st.vx += fw.x * aF * dt;
  st.vz += fw.z * aF * dt;

  const targetSteer = steer * 0.5;
  st.steering += (targetSteer - st.steering) * Math.min(1, dt * 7);
  const targetYawRate = Math.sign(st.steering) * Math.min(1.6, Math.abs(st.steering) * (spd / (2.62 * (1 + spd * spd * 0.0006))) * 6.2);
  const resp = 3.2 + Math.min(6, spd * 0.16);
  st.yawRate += (targetYawRate - st.yawRate) * Math.min(1, dt * resp);
  st.yaw += st.yawRate * dt;
  const cosY = Math.cos(st.yawRate * dt), sinY = Math.sin(st.yawRate * dt);
  const oldX = st.vx, oldZ = st.vz;
  st.vx = oldX * cosY + oldZ * sinY;
  st.vz = -oldX * sinY + oldZ * cosY;
  fv = st.vx * fw.x + st.vz * fw.z;
  lv = st.vx * rt.x + st.vz * rt.z;
  const latDamp = Math.min(1, (Math.abs(lv) * 6) / 14.5) * 14 + 4;
  st.vx -= rt.x * lv * Math.min(1, dt * latDamp);
  st.vz -= rt.z * lv * Math.min(1, dt * latDamp);
  st.x += st.vx * dt;
  st.z += st.vz * dt;

  // cerca simples (guard-rail)
  const near = world.road.nearest(st.x, st.z);
  const tng = world.road.getTangent(near.i);
  const nx = -tng[1], nz = tng[0];
  const off = (st.x - near.p.x) * nx + (st.z - near.p.z) * nz;
  if (near.dist > 5.4) {
    // fora da pista: deixa andar (grama)
  }
  if (Math.abs(off) > 5.0 && near.dist < 5.2) {
    guardrailHits++;
    // projeta para dentro
    const sgn = Math.sign(off);
    st.x -= nx * sgn * (Math.abs(off) - 4.9);
    st.z -= nz * sgn * (Math.abs(off) - 4.9);
  }
  if (!isFinite(st.x) || !isFinite(st.vx)) { console.error('NaN/Inf em', s, st); process.exit(1); }
  maxSpeed = Math.max(maxSpeed, Math.hypot(st.vx, st.vz));
  maxLateral = Math.max(maxLateral, Math.abs(lv));
  if (s % 120 === 0) SPEEDS.push(Math.round(spd * 3.6));
}
console.log('vel max (km/h)', Math.round(maxSpeed * 3.6));
console.log('velocidades a cada segundo (amostra):', SPEEDS.filter((_, i) => i % 3 === 0).slice(0, 12).join(','));
console.log('derrapagem lateral max (m/s)', maxLateral.toFixed(2));
console.log('toques no guard-rail', guardrailHits);
console.log('posição final', st.x.toFixed(0), st.z.toFixed(0), 'spd', Math.round(Math.hypot(st.vx, st.vz) * 3.6), 'km/h');
console.log('FÍSICA OK');
