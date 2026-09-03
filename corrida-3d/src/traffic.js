/* traffic.js — tráfego de carros dirigindo na pista. */
import * as THREE from '../lib/three.module.js';
import { createTrafficCar } from './vehicle.js';
import { hash2 } from './noise.js';

const COLORS = [0x2c4a8a, 0x8a8f98, 0x224022, 0x9a8f2c, 0x3f5a8c, 0x8c2c3a, 0x26282e, 0xb06a2a, 0x345a5e, 0x7a7a6a];

export function createTraffic(world, opts = {}) {
  const count = opts.count ?? 14;
  const group = new THREE.Group();
  const scene = opts.scene;
  if (scene) scene.add(group);
  const road = world.road;
  const L = road.count;

  const cars = [];
  // distribui carros ao redor do anel
  const usedIdx = new Set();
  let guard = 0;
  while (cars.length < count && guard++ < 2000) {
    const i = Math.floor(hash2(Math.random() * 1e9 | 0, 5, 99) * L);
    if (usedIdx.has(i)) continue;
    // espaçamento mínimo
    let ok = true;
    for (const c of cars) {
      const d = Math.min(Math.abs(c.i - i), L - Math.abs(c.i - i));
      if (d < L * 0.02) { ok = false; break; }
    }
    if (!ok) continue;
    usedIdx.add(i);
    const car = createTrafficCar(COLORS[Math.floor(Math.random() * COLORS.length)]);
    const lat = Math.random() < 0.5 ? 2.15 : -2.15;
    const speed = 11 + Math.random() * 9;
    cars.push({ car, group: car.group, i, lat, speed, targetSpeed: speed, brake: 0, bob: Math.random() * 6, dim: 0.2 });
    group.add(car.group);
  }

  function nearestInfo(x, z) {
    const n = road.nearest(x, z);
    return n;
  }

  function update(dt, t, player) {
    for (const c of cars) {
      // velocidade desejada com variação
      c.targetSpeed += (Math.sin(t * 0.11 + c.bob) * 1.2 - (c.targetSpeed - c.speed) * 0.2) * dt;
      c.targetSpeed = THREE.MathUtils.clamp(c.targetSpeed, 10, 23);
      // frenagem se o jogador está logo atrás na mesma faixa
      if (player) {
        const n = nearestInfo(c.group.position.x, c.group.position.z);
        const distAhead = (player.i - c.i + L) % L;
        if (distAhead < L * 0.045 && distAhead > 0 && Math.abs(c.lat - player.lat) < 0.9) {
          c.targetSpeed = Math.min(c.targetSpeed, player.speed * 0.85);
        }
        const behind = (c.i - player.i + L) % L;
        if (behind < L * 0.03 && Math.abs(c.lat - player.lat) < 0.9) {
          // não fica colado atrás do jogador — troca de faixa
          if (Math.random() < dt * 0.25) c.lat *= -1;
        }
      }
      c.speed += (c.targetSpeed - c.speed) * Math.min(1, dt * 1.2);
      // avança ao longo da pista
      c.i = (c.i + (c.speed * dt) / (world.road.length / world.road.count)) % L;
      const p = world.road.getPointAt(Math.round(c.i));
      const tng = world.road.getTangent(Math.round(c.i));
      const nx = -tng[1], nz = tng[0];
      const px = p.x + nx * c.lat * 1.0;
      const pz = p.z + nz * c.lat * 1.0;
      const h = world.heightAt(px, pz);
      c.group.position.set(px, h, pz);
      const yaw = Math.atan2(-tng[1], tng[0]); // forward (cos,0,-sin) == tangente
      c.group.rotation.y = yaw;
      c.speedKmh = c.speed * 3.6;

      // rotação das rodas
      const spin = (c.speed * dt) / 0.33;
      for (const w of c.car.axles.all) w.rotation.x -= spin;
      // luzes de freio
      const braking = c.speed < c.targetSpeed - 1.5;
      c.car.setBrake(braking);
    }
    // colisão simples entre carros de tráfego (repulsão)
    for (let a = 0; a < cars.length; a++) for (let b = a + 1; b < cars.length; b++) {
      const ca = cars[a].group.position, cb = cars[b].group.position;
      const dx = ca.x - cb.x, dz = ca.z - cb.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < 9 && d2 > 1e-4) {
        const d = Math.sqrt(d2), push = (3 - d) * 0.02;
        const ux = dx / d, uz = dz / d;
        ca.x += ux * push; ca.z += uz * push;
        cb.x -= ux * push; cb.z -= uz * push;
      }
    }
  }

  return { cars, group, update };
}
