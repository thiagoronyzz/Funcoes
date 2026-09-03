/* people.js — pedestres (caminhada, travessia, pânico) e cachorros. */
import * as THREE from '../lib/three.module.js';
import { mulberry32, clamp01 } from './noise.js';

const SKIN_TONES = [0xe2b48c, 0xc98c5a, 0x8a5a2e, 0xf0c8a0, 0x6e4426];
const SHIRT = [0x3355aa, 0xc0392b, 0x27ae60, 0xe67e22, 0x8e44ad, 0x95a5a6, 0xffffff, 0x2c3e50, 0xd35400];
const PANTS = [0x34495e, 0x7f8c8d, 0x2c3e50, 0x6b4423, 0x3d3d3d];

function personParts() {
  const g = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.58, 0.24), new THREE.MeshStandardMaterial({ roughness: 0.9 }));
  torso.position.y = 1.06;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 10, 8), new THREE.MeshStandardMaterial({ roughness: 0.7 }));
  head.position.y = 1.52;
  head.scale.set(1, 1.15, 1);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), torso.material);
  armL.position.set(-0.27, 1.24, 0);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), torso.material);
  armR.position.set(0.27, 1.24, 0);
  const hips = new THREE.Group(); hips.position.y = 0.76;
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.72, 0.14), new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.95 }));
  legL.position.set(-0.1, -0.34, 0);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.72, 0.14), new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.95 }));
  legR.position.set(0.1, -0.34, 0);
  hips.add(legL, legR);
  g.add(torso, head, armL, armR, hips);
  return { g, hips, legL, legR, torso, head };
}

function dogParts() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x9a6b3f, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.16), mat);
  body.position.y = 0.3;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 0.14), mat);
  head.position.set(0.22, 0.38, 0);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.06), mat);
  tail.position.set(-0.2, 0.4, 0);
  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.05), mat);
  earL.position.set(0.2, 0.46, 0.07);
  const earR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.05), mat);
  earR.position.set(0.2, 0.46, -0.07);
  g.add(body, head, tail, earL, earR);
  return { g, tail };
}

function randomOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function createPeople(scene, world, opts = {}) {
  const group = new THREE.Group();
  scene.add(group);
  const persons = [];
  const dogs = [];
  const rand = mulberry32(4242);
  const total = Math.min(opts.count ?? 60, 90);

  function findSpot(pref) {
    for (let tries = 0; tries < 120; tries++) {
      const a = rand() * Math.PI * 2;
      const r = 60 + Math.sqrt(rand()) * 1150;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const dR = world.roadDist(x, z);
      const q = world.lakeQ(x, z);
      const h = world.heightAt(x, z);
      const e = 3;
      const slope = Math.hypot(world.heightAt(x + e, z) - h, world.heightAt(x, z + e) - h) / e;
      if (slope > 0.4) continue;
      if (pref === 'road') {
        if (dR > 5 && dR < 11 && Math.random() < 0.85) return [x, z, h];
      } else if (pref === 'lake') {
        if (q > 0.35 && q < 1.06 && h > world.waterLevel + 0.2 && h < world.waterLevel + 3.2) return [x, z, h];
      } else {
        if (dR > 20 && dR < 900 && Math.random() < 0.75) return [x, z, h];
      }
    }
    return null;
  }

  function spawnPerson(spot, role) {
    const p = personParts();
    p.torso.material.color.setHex(randomOf(SHIRT));
    p.torso.material.color.offsetHSL(Math.random() * 0.03 - 0.015, 0, 0);
    p.head.material = new THREE.MeshStandardMaterial({ color: randomOf(SKIN_TONES), roughness: 0.7 });
    p.legL.material.color.setHex(randomOf(PANTS));
    p.legR.material.color.copy(p.legL.material.color);
    group.add(p.g);
    const ped = {
      ...p, role: role || 'wander', pos: new THREE.Vector3(spot[0], spot[2], spot[1]),
      dir: new THREE.Vector3(rand() - 0.5, 0, rand() - 0.5).normalize(),
      speed: 0.7 + rand() * 0.8, phase: rand() * 9, state: 'idle', stateT: 0,
      dead: false, vel: new THREE.Vector3(), corpseT: 0, age: rand() * 10, alive: true,
      panicCd: 0, r: 0.45, scoreGiven: false, height: 1.7, seed: rand() * 10,
    };
    p.g.position.copy(ped.pos);
    p.g.position.y = world.heightAt(ped.pos.x, ped.pos.z);
    p.g.rotation.y = Math.atan2(ped.dir.x, ped.dir.z); // personagem olha +Z
    persons.push(ped);
  }

  function spawnDog(spot) {
    const d = dogParts();
    const tint = 0xffffff * 0;
    d.g.children.forEach(m => m.material.color.setHSL(0.07 + rand() * 0.05, 0.4, 0.3 + rand() * 0.4));
    void tint;
    group.add(d.g);
    const dog = {
      ...d, pos: new THREE.Vector3(spot[0], spot[2], spot[1]),
      dir: new THREE.Vector3(rand() - 0.5, 0, rand() - 0.5).normalize(),
      speed: 1.4 + rand() * 1.4, phase: rand() * 9, state: 'wander',
      panicCd: 0, r: 0.5, dead: false,
    };
    d.g.position.copy(dog.pos);
    dogs.push(dog);
  }

  // povoamento principal
  let placedRoad = 0, placedLake = 0, placedFree = 0;
  for (let n = 0; n < total && (placedRoad + placedLake + placedFree) < total; n++) {
    const roll = rand();
    let spot;
    if (roll < 0.45) spot = findSpot('road');
    else if (roll < 0.7) spot = findSpot('lake');
    else spot = findSpot('free');
    if (!spot) continue;
    if (world.roadDist(spot[0], spot[1]) < 6 && roll < 0.45) { /* keep */ }
    if (roll < 0.45) { spawnPerson(spot, 'cross'); placedRoad++; }
    else if (roll < 0.7) { spawnPerson(spot, 'lake'); placedLake++; }
    else { if (placedFree < 15) { spawnPerson(spot, 'wander'); placedFree++; } }
  }
  // cachorros
  const dogSpots = [];
  for (let i = 0; i < 7; i++) {
    const s = findSpot('free');
    if (s) { dogSpots.push(s); spawnDog(s); }
  }

  /* evento de travessia próximo ao jogador */
  function requestCrossing(worldI, laneFrom) {
    // encontra ponto na estrada
    const p = world.road.getPointAt(worldI);
    const tng = world.road.getTangent(worldI);
    const nx = -tng[1], nz = tng[0];
    const side = laneFrom === 'left' ? 4.4 : -4.4;
    const x = p.x + nx * side, z = p.z + nz * side;
    const spot = [x, z, world.heightAt(x, z)];
    if (world.lakeQ(x, z) < 0.9) return null;
    spawnPerson(spot, 'crossingNow');
    const ped = persons[persons.length - 1];
    ped.role = 'crossingNow';
    ped.dir.set(-nx, 0, -nz);
    ped.speed = 1.5 + Math.random();
    ped.state = 'walk';
    return ped;
  }

  const tmp = new THREE.Vector3();

  function update(dt, t, player) {
    const px = player ? player.pos.x : 0, pz = player ? player.pos.z : 0;
    for (const ped of persons) {
      const pos = ped.g.position;
      ped.age += dt;
      const dxp = pos.x - px, dzp = pos.z - pz;
      const distP = Math.hypot(dxp, dzp);
      if (distP > 620 && !ped.dead) { ped.g.visible = false; continue; }
      ped.g.visible = true;

      if (ped.dead) {
        // ragdoll simples
        ped.corpseT += dt;
        ped.vel.y -= 18 * dt;
        pos.x += ped.vel.x * dt;
        pos.z += ped.vel.z * dt;
        pos.y += ped.vel.y * dt;
        const gh = world.heightAt(pos.x, pos.z);
        if (pos.y < gh + 0.18) {
          pos.y = gh + 0.18;
          ped.vel.multiplyScalar(0.25);
          ped.vel.y = 0;
          ped.landed = true;
        }
        // tomba e fica deitado
        if (ped.g.rotation.x > -1.42) ped.g.rotation.x -= dt * (ped.landed ? 3.2 : 2.2);
        if (ped.g.rotation.x < -1.42) ped.g.rotation.x = -1.42;
        ped.g.rotation.z = Math.sin(ped.corpseT * 0.8 + ped.seed) * 0.06;
        if (ped.landed && ped.g.rotation.x <= -1.38) pos.y = gh + 0.05;
        if (ped.corpseT > 4 && ped.landed) { ped.g.visible = false; ped.alive = false; }
        continue;
      }
      const gh = world.heightAt(pos.x, pos.z);
      pos.y += (gh - pos.y) * Math.min(1, dt * 10);

      // pânico com o carro
      if (distP < 9 && player && player.speed > 6) {
        ped.panicCd = Math.max(ped.panicCd, 2.2);
        tmp.set(pos.x - px, 0, pos.z - pz).normalize();
        if (tmp.lengthSq() < 0.1) tmp.set(1, 0, 0);
        ped.dir.lerp(tmp, dt * 5);
        ped.speed = 4.6;
        ped.state = 'run';
      }
      if (ped.panicCd > 0) {
        ped.panicCd -= dt;
        ped.state = 'run';
      }

      // mudança de estado
      ped.stateT -= dt;
      if (ped.stateT <= 0 && ped.state !== 'run' && ped.panicCd <= 0) {
        ped.state = ped.state === 'walk' ? (Math.random() < 0.4 ? 'idle' : 'walk') : 'walk';
        if (ped.state === 'walk') {
          ped.dir.set(rand() - 0.5, 0, rand() - 0.5);
          const dL = ped.dir.length();
          if (dL > 0.001) ped.dir.divideScalar(dL);
          ped.speed = ped.role === 'crossingNow' ? 1.6 : 0.6 + rand() * 0.9;
        }
        ped.stateT = 0.6 + rand() * 3.4;
      }
      if (ped.state === 'idle') ped.speed = 0;

      // pedestre "cross" espera na beira; atravessa quando carro longe
      if (ped.role === 'cross' && ped.panicCd <= 0) {
        const n = world.road.nearest(pos.x, pos.z);
        if (n.dist < 6 && player) {
          const distToPlayer = Math.min(Math.abs(n.i - player.i), world.road.count - Math.abs(n.i - player.i));
          if (distToPlayer > 90) {
            const tng = world.road.getTangent(n.i);
            const cross = new THREE.Vector3(-tng[1], 0, tng[0]);
            if (ped.dir.dot(cross) < 0.1) { ped.dir.copy(cross); ped.speed = 1.5; }
            ped.state = 'walk';
            ped.role = 'wander';
          }
        }
      }

      if (ped.state === 'run') { ped.speed = Math.max(ped.speed, 3.2); }
      const sp = ped.speed * (ped.state === 'run' ? 1 : 1);
      pos.x += ped.dir.x * sp * dt;
      pos.z += ped.dir.z * sp * dt;
      ped.phase += dt * (2.4 + sp * 4.5);

      // orientação (frente = +Z local)
      const targetYaw = Math.atan2(ped.dir.x, ped.dir.z);
      let dy = targetYaw - ped.g.rotation.y;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      ped.g.rotation.y += dy * Math.min(1, dt * 7);
      // passos
      const step = Math.sin(ped.phase) * clamp01(sp * 0.7) * 0.55;
      ped.legL.rotation.x = step;
      ped.legR.rotation.x = -step;
      ped.g.position.y = gh;
    }
    for (let di = dogs.length - 1; di >= 0; di--) {
      const dog = dogs[di];
      const pos = dog.g.position;
      const dxp = pos.x - px, dzp = pos.z - pz;
      const distP = Math.hypot(dxp, dzp);
      dog.g.visible = distP < 520;
      if (!dog.g.visible && !dog.dead) continue;
      if (dog.dead) {
        dog.corpseT = (dog.corpseT || 0) + dt;
        pos.x += (dog.vel?.x ?? 0) * dt;
        pos.z += (dog.vel?.z ?? 0) * dt;
        pos.y += (dog.vel?.y ?? 0) * dt;
        if (dog.vel) dog.vel.y -= 18 * dt;
        const g2 = world.heightAt(pos.x, pos.z);
        const side = dog.side ?? 1;
        dog.g.rotation.z += (side * 1.55 - dog.g.rotation.z) * Math.min(1, dt * 4);
        if (dog.g.rotation.z * side > 1.4) pos.y = g2 + 0.06;
        if (dog.corpseT > 4) { dogs.splice(di, 1); continue; }
        continue;
      }
      const gh = world.heightAt(pos.x, pos.z);
      if (dog.panicCd > 0) {
        dog.panicCd -= dt;
        tmp.set(pos.x - px, 0, pos.z - pz).normalize();
        dog.dir.lerp(tmp, dt * 4);
        dog.speed = 9;
      } else if (distP < 16 && player && player.speed > 6) {
        dog.panicCd = 3;
      }
      pos.x += dog.dir.x * dog.speed * dt;
      pos.z += dog.dir.z * dog.speed * dt;
      pos.y += (gh - pos.y) * Math.min(1, dt * 8);
      dog.phase += dt * (4 + dog.speed * 3);
      const yaw = Math.atan2(-dog.dir.z, dog.dir.x); // focinho = +X local
      dog.g.rotation.y = yaw;
      dog.tail.rotation.x = Math.sin(dog.phase * 0.6) * 0.6;
      if (Math.random() < dt * 0.4 && dog.panicCd <= 0) {
        dog.dir.set(rand() - 0.5, 0, rand() - 0.5).normalize();
        dog.speed = 1.4 + rand() * 1.6;
      }
    }
    // remove mortos antigos
    for (let i = persons.length - 1; i >= 0; i--) {
      if (!persons[i].alive) { group.remove(persons[i].g); persons.splice(i, 1); }
    }
  }

  return { persons, dogs, group, update, requestCrossing };
}
