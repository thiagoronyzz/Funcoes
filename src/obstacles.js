/* obstacles.js — cones/barris interativos na pista (voam ao colidir). */
import * as THREE from '../lib/three.module.js';
import { hash2 } from './noise.js';

export function createObstacles(scene, world) {
  const group = new THREE.Group();
  scene.add(group);
  const items = []; // misto (cone e barril)
  const ZONES = 11;
  const L = world.road.count;

  function addItem(kind, x, z, seed) {
    if (world.lakeQ(x, z) < 0.96) return null;
    const r = kind === 'cone' ? 0.33 : 0.5;
    const y = kind === 'cone' ? world.heightAt(x, z) + 0.3 : world.heightAt(x, z) + 0.5;
    const it = {
      kind, x, z, y, r,
      homeX: x, homeZ: z,
      vx: 0, vz: 0, vy: 0, rotY: 0, spin: 0,
      state: 'rest', respawnT: 0, idx: items.length,
      seed,
    };
    items.push(it);
    return it;
  }

  /* zonas fixas pelo anel */
  for (let z = 0; z < ZONES; z++) {
    const baseFrac = (((z + 1) / ZONES) + hash2(z, 7, 3) * 0.05 + 0.02) % 1;
    const i0 = Math.floor(baseFrac * L);
    const side = hash2(z, 11, 5) < 0.5 ? -1 : 1;
    const taper = hash2(z, 13, 9); // >0.5 = fileira que invade a faixa
    const nCones = taper > 0.5 ? 6 : 3;
    for (let k = 0; k < nCones; k++) {
      const off = side * (taper > 0.5 ? 1.1 + (k / nCones) * 3.5 : 2.3 + (k / nCones) * 1.8);
      const i = (i0 + Math.floor(k * 12) + k) % L;
      const p = world.road.getPointAt(i);
      const tng = world.road.getTangent(i);
      const nx = -tng[1], nz = tng[0];
      const x = p.x + nx * off + (hash2(z, k, 21) - 0.5) * 0.6;
      const zz = p.z + nz * off + (hash2(z, k, 22) - 0.5) * 0.6;
      addItem('cone', x, zz, hash2(z, k, 4));
    }
    if (taper > 0.55) {
      const i = (i0 + Math.floor(nCones * 12) + nCones) % L;
      const p = world.road.getPointAt(i);
      const tng = world.road.getTangent(i);
      const nx = -tng[1], nz = tng[0];
      const off = side * 3.7;
      addItem('barrel', p.x + nx * off, p.z + nz * off, hash2(z, 31, 4));
    }
  }

  /* cones esparsos na beira */
  for (let i = 0; i < 22; i++) {
    const i0 = Math.floor(hash2(i, 41, 7) * L);
    const p = world.road.getPointAt(i0);
    const tng = world.road.getTangent(i0);
    const nx = -tng[1], nz = tng[0];
    const off = (hash2(i, 51, 8) < 0.5 ? -1 : 1) * (4.5 + hash2(i, 61, 8) * 2.6);
    addItem(hash2(i, 71, 4) < 0.75 ? 'cone' : 'barrel', p.x + nx * off, p.z + nz * off, hash2(i, 71, 4));
  }

  /* malhas instanciadas separadas por tipo */
  const coneList = items.filter((i) => i.kind === 'cone');
  const barrelList = items.filter((i) => i.kind === 'barrel');
  coneList.forEach((it, idx) => (it.idx = idx));
  barrelList.forEach((it, idx) => (it.idx = idx));

  const coneGeo = new THREE.ConeGeometry(0.31, 0.72, 9);
  coneGeo.translate(0, 0.36, 0);
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xff7f1a, roughness: 0.55 });
  const cones = new THREE.InstancedMesh(coneGeo, coneMat, Math.max(1, coneList.length));
  cones.receiveShadow = true;
  group.add(cones);

  const baseGeo = new THREE.CylinderGeometry(0.19, 0.24, 0.09, 9).translate(0, 0.045, 0);
  const bases = new THREE.InstancedMesh(baseGeo, new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 0.8 }), Math.max(1, coneList.length));
  group.add(bases);

  const barrelGeo = new THREE.CylinderGeometry(0.46, 0.46, 1.0, 12).translate(0, 0.5, 0);
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0xbfd7e8, roughness: 0.5, metalness: 0.15 });
  const barrels = new THREE.InstancedMesh(barrelGeo, barrelMat, Math.max(1, barrelList.length));
  barrels.receiveShadow = true;
  group.add(barrels);

  const mtx = new THREE.Matrix4();
  const euler = new THREE.Euler();
  const posV = new THREE.Vector3();
  const scl = new THREE.Vector3(1, 1, 1);

  function writeAll() {
    for (const it of items) {
      posV.set(it.x, it.y, it.z);
      euler.set(0, it.rotY, 0);
      const q = new THREE.Quaternion().setFromEuler(euler);
      mtx.compose(posV, q, scl);
      if (it.kind === 'cone') {
        cones.setMatrixAt(it.idx, mtx);
        bases.setMatrixAt(it.idx, mtx);
      } else {
        barrels.setMatrixAt(it.idx, mtx);
      }
    }
  }
  writeAll();
  cones.instanceMatrix.needsUpdate = true;
  barrels.instanceMatrix.needsUpdate = true;
  bases.instanceMatrix.needsUpdate = true;

  function update(dt) {
    const g = 14;
    let dirty = false;
    for (const it of items) {
      if (it.state === 'fly') {
        dirty = true;
        it.vy -= g * dt;
        it.vx *= Math.exp(-dt * 0.25);
        it.vz *= Math.exp(-dt * 0.25);
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.z += it.vz * dt;
        it.rotY += it.spin * dt;
        const qLake = world.lakeQ(it.x, it.z);
        const gh = world.heightAt(it.x, it.z);
        const target = qLake < 0.92 ? world.waterLevel : Math.max(gh, -10);
        if (it.vy < 0 && it.y <= target + (it.kind === 'cone' ? 0.02 : 0.02)) {
          it.y = target;
          if (Math.abs(it.vy) > 3.2 && target > 0.5) {
            it.vy = -it.vy * 0.38;
            it.vx *= 0.6; it.vz *= 0.6;
            it.spin *= 0.4;
          } else {
            it.vy = 0;
            it.state = 'down';
            it.spin *= 0.3;
          }
        }
        if (qLake < 0.92 && it.state === 'fly') {
          // flutua e deriva
          it.vx *= Math.exp(-dt * 2);
          it.vz *= Math.exp(-dt * 2);
        }
        writeOne(it);
      } else if (it.state === 'down') {
        dirty = true;
        const f = Math.exp(-dt * 4);
        it.vx *= f; it.vz *= f;
        it.x += it.vx * dt;
        it.z += it.vz * dt;
        it.rotY += it.spin * dt * 0.5;
        const gh = world.heightAt(it.x, it.z);
        const qLake = world.lakeQ(it.x, it.z);
        it.y = qLake < 0.92 ? world.waterLevel : gh + (it.kind === 'cone' ? 0.3 : 0.5);
        if (Math.abs(it.vx) + Math.abs(it.vz) < 0.4 && Math.abs(it.spin) < 0.5) {
          it.state = 'rest';
          it.spin = 0;
          it.respawnT = 40 + Math.random() * 25;
        }
        writeOne(it);
      } else if (it.state === 'rest' && it.respawnT > 0) {
        it.respawnT -= dt;
        if (it.respawnT <= 0) {
          it.x = it.homeX; it.z = it.homeZ;
          it.y = it.kind === 'cone' ? world.heightAt(it.x, it.z) + 0.3 : world.heightAt(it.x, it.z) + 0.5;
          it.rotY = 0; it.vx = 0; it.vz = 0; it.vy = 0;
          writeOne(it);
          dirty = true;
        }
      }
    }
    if (dirty) {
      cones.instanceMatrix.needsUpdate = true;
      bases.instanceMatrix.needsUpdate = true;
      barrels.instanceMatrix.needsUpdate = true;
    }
  }

  function writeOne(it) {
    posV.set(it.x, it.y, it.z);
    euler.set(0, it.rotY, 0);
    const q = new THREE.Quaternion().setFromEuler(euler);
    mtx.compose(posV, q, scl);
    if (it.kind === 'cone') { cones.setMatrixAt(it.idx, mtx); bases.setMatrixAt(it.idx, mtx); }
    else barrels.setMatrixAt(it.idx, mtx);
  }

  function near(x, z, r) {
    const out = [];
    for (const it of items) {
      if (it.state !== 'rest') continue;
      const dx = it.x - x, dz = it.z - z;
      if (dx * dx + dz * dz < r * r) out.push(it);
    }
    return out;
  }

  function knock(it, px, pz, dirX, dirZ, power) {
    const dx = it.x - px, dz = it.z - pz;
    const d = Math.hypot(dx, dz) || 1;
    it.vx = dirX * power * 0.45 + (dx / d) * power * 0.95;
    it.vz = dirZ * power * 0.45 + (dz / d) * power * 0.95;
    it.vy = 2.4 + Math.random() * 3 + power * 0.4;
    it.spin = (Math.random() - 0.5) * 16;
    it.state = 'fly';
  }

  return { group, items, update, near, knock };
}
