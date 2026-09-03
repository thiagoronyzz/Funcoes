/* nature.js — florestas, arbustos, flores, rochas e grama dinâmica. */
import * as THREE from '../lib/three.module.js';
import { makeFbm2D, hash2, clamp01 } from './noise.js';

const col = new THREE.Color();
const mtx = new THREE.Matrix4();
const ONE = new THREE.Vector3(1, 1, 1);

/* ------------------------- merge de geometrias ------------------------- */

function makeMerged(parts) {
  const pos = [], nrm = [], idx = [];
  let off = 0;
  for (const g of parts) {
    const p = g.attributes.position.array;
    const n = g.attributes.normal ? g.attributes.normal.array : null;
    const hasI = g.index;
    for (let i = 0; i < p.length; i += 3) {
      pos.push(p[i], p[i + 1], p[i + 2]);
      if (n) nrm.push(n[i], n[i + 1], n[i + 2]);
    }
    if (hasI) {
      for (let i = 0; i < hasI.count; i++) idx.push(hasI.getX(i) + off);
    } else {
      for (let i = 0; i < p.length / 3; i++) idx.push(i + off);
    }
    off += p.length / 3;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  if (nrm.length === pos.length) g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nrm), 3));
  g.setIndex(idx);
  if (!nrm.length) g.computeVertexNormals();
  return g;
}

/* ---------------------------- vento (shader) ---------------------------- */

export function makeWindyMaterial(standardParams) {
  const mat = new THREE.MeshStandardMaterial(standardParams);
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = { value: 0.6 };
    mat.userData.windU = shader.uniforms.uWind;
    const decl = `
      attribute float aPhase;
      attribute float aAmp;
      uniform float uWind;
    `;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      '#include <common>\n' + decl
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      {
        float ph = aPhase;
        float amp = aAmp;
        float lift = clamp(transformed.y * 0.42, 0.0, 1.0);
        float sway1 = sin(transformed.y * 0.6 + uWind * 2.2 + ph);
        float sway2 = sin(uWind * 1.35 + ph * 1.9);
        transformed.x += (sway1 * 0.085 + sway2 * 0.04) * amp * lift;
        transformed.z += (cos(transformed.y * 0.5 + uWind * 1.8 + ph * 1.3) * 0.075 + sway2 * 0.02) * amp * lift;
      }`
    );
  };
  mat.userData.windU = null;
  return mat;
}

function addWindAttr(inst, count) {
  const phase = new Float32Array(count);
  const amp = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    phase[i] = Math.random() * Math.PI * 2;
    amp[i] = 0.6 + Math.random() * 0.9;
  }
  inst.geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
  inst.geometry.setAttribute('aAmp', new THREE.InstancedBufferAttribute(amp, 1));
  return inst;
}

/* --------------------------- geometrias de árvores --------------------------- */

function pineParts(h) {
  const trunk = new THREE.CylinderGeometry(0.09 + h * 0.008, 0.2 + h * 0.014, h * 0.32, 6);
  trunk.translate(0, h * 0.16, 0);
  const cones = [];
  const levels = [
    [0.30, 0.36], [0.50, 0.30], [0.68, 0.24], [0.84, 0.19],
  ];
  for (let i = 0; i < levels.length; i++) {
    const yF = levels[i][0];
    const rF = h * levels[i][1];
    const cone = new THREE.ConeGeometry(rF, h * (i === levels.length - 1 ? 0.30 : 0.22), 7);
    cone.translate(0, h * (yF + 0.1), 0);
    cones.push(cone);
  }
  return { trunk, foliage: makeMerged(cones) };
}

function oakParts(h) {
  const trunk = new THREE.CylinderGeometry(h * 0.09, h * 0.16, h * 0.5, 7);
  trunk.translate(0, h * 0.25, 0);
  const blobs = [];
  const sph = new THREE.IcosahedronGeometry(h * 0.26, 0);
  const main = sph.clone().translate(0, h * 0.62, 0);
  blobs.push(main);
  const b1 = sph.clone().scale(0.72, 0.55, 0.72).translate(h * 0.18, h * 0.52, h * 0.1);
  const b2 = sph.clone().scale(0.68, 0.5, 0.68).translate(-h * 0.16, h * 0.48, -h * 0.12);
  const b3 = sph.clone().scale(0.6, 0.5, 0.6).translate(0, h * 0.8, 0);
  blobs.push(b1, b2, b3);
  return { trunk, foliage: makeMerged(blobs) };
}

const PINE_H = [7.5, 10, 13];
const OAK_H = [7, 9.5, 12.5];

/* ------------------------------- criação ------------------------------- */

export function createNature(scene, world, opts = {}) {
  const group = new THREE.Group();
  scene.add(group);
  const { heightAt, lakeQ, roadDist } = world;
  const forestFbm = makeFbm2D(20260903 + 5, 3);
  const maxR = 1340;

  const pineMat = makeWindyMaterial({ color: 0x1e5230, roughness: 0.92, metalness: 0 });
  const oakMat = makeWindyMaterial({ color: 0x2f6b38, roughness: 0.94, metalness: 0 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b4630, roughness: 0.95 });

  const pineFols = PINE_H.map(() => null);
  const pineTrks = PINE_H.map(() => null);
  const oakFols = OAK_H.map(() => null);
  const oakTrks = OAK_H.map(() => null);

  const queue = { pine: [[], [], []], oak: [[], [], []] };
  const maxTrees = 13500;

  const cell = 14;
  let placed = 0;
  const rocksArr = [];
  const bushesArr = [];
  const flowersArr = [];
  const rockPos = [], rockCol = [], rockScl = [];
  const bushPos = [], bushCol = [], bushScl = [];
  const flowerPos = [], flowerCol = [];

  for (let gz = -maxR; gz < maxR && placed < maxTrees * 3; gz += cell) {
    for (let gx = -maxR; gx < maxR; gx += cell) {
      const cx = gx + hash2(gx, gz, 11) * cell;
      const cz = gz + hash2(gx, gz, 17) * cell;
      const r2 = cx * cx + cz * cz;
      if (r2 > maxR * maxR) continue;
      const q = lakeQ(cx, cz);
      if (q < 0.55) continue;
      const dRoad = roadDist(cx, cz);
      if (dRoad < 18) continue;
      const h = heightAt(cx, cz);
      if (h > 165) continue;
      const e = 5;
      const slope = Math.hypot(heightAt(cx + e, cz) - h, heightAt(cx, cz + e) - h) / e;
      if (slope > 0.55) continue;

      const hsh = hash2(gx, gz, 7);
      const hsh2 = hash2(gx, gz, 91);
      const mask = clamp01((forestFbm(cx * 0.0045 - 5, cz * 0.0045 + 2) + 0.08) / 0.55);

      if (hsh < 0.92) {
        // ---- árvores ----
        if (placed >= maxTrees) continue;
        let species, vi;
        const inForest = mask > 0.33;
        if (inForest) {
          species = hsh2 < 0.62 ? 'pine' : 'oak';
        } else {
          // clareiras: poucas árvores, preferência por carvalhos soltos
          if (hsh2 < 0.22) species = 'oak';
          else if (hsh2 < 0.36) species = 'pine';
          else continue;
        }
        if (hsh2 > 0.92 && species === 'oak') continue;
        vi = species === 'pine' ? (hsh2 > 0.78 ? 2 : hsh2 > 0.3 ? 1 : 0) : (hsh2 > 0.78 ? 2 : hsh2 > 0.3 ? 1 : 0);
        const s = (species === 'pine' ? PINE_H[vi] : OAK_H[vi]) * (0.85 + hsh * 0.5) / (species === 'pine' ? 10 : 9.5);
        queue[species][vi].push({ x: cx, z: cz, h, s, yaw: hash2(gx, gz, 23) * Math.PI * 2 });
        const baseR = species === 'pine' ? 0.32 * s : 0.45 * s;
        world.colliders.add(cx, cz, Math.max(0.4, baseR), 'tree', { s });
        placed++;
      } else if (hsh < 0.98 && dRoad > 30) {
        // ---- rocha ----
        rockPos.push(cx, heightAt(cx, cz), cz);
        const gray = 0.45 + hash2(gx, gz, 3) * 0.3;
        rockCol.push(gray, gray * 0.98, gray * 0.94);
        rockScl.push(0.7 + hash2(gx, gz, 5) * 2.6);
      } else if (dRoad < 95) {
        // ---- arbustos perto da pista ----
        bushPos.push(cx, heightAt(cx, cz), cz);
        const tint = 0.25 + hash2(gx, gz, 8) * 0.2;
        bushCol.push(0.13 + tint * 0.5, 0.42 + tint * 0.5, 0.14 + tint * 0.3);
        bushScl.push(0.5 + hash2(gx, gz, 9) * 1.2);
      }
    }
  }

  /* florzinhas em faixas perto do lago e da estrada */
  const flowerMatTone = null;
  for (let i = 0; i < 900; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random()) * (maxR - 200) + 200;
    const fx = Math.cos(a) * rr, fz = Math.sin(a) * rr;
    const q = lakeQ(fx, fz);
    const dR = roadDist(fx, fz);
    if ((q > 0.35 && q < 1.35) || (dR > 7 && dR < 22)) {
      const h = heightAt(fx, fz);
      if (h > 8 || Math.abs(h - world.waterLevel) > 7) {
        if (Math.random() < 0.5) continue;
      }
      const hsh = hash2(Math.floor(fx * 4), Math.floor(fz * 4), 31);
      const tone = hsh;
      const palette = [[1, 0.55, 0.85], [1, 0.95, 0.4], [1, 1, 1], [0.75, 0.5, 1]];
      const c2 = palette[Math.floor(tone * palette.length) % palette.length];
      flowerPos.push(fx, heightAt(fx, fz), fz);
      flowerCol.push(c2[0], c2[1], c2[2]);
    }
  }
  void flowerMatTone;

  /* ------------------------- construção das malhas ------------------------- */
  const builds = [
    { species: 'pine', geos: PINE_H, mats: [pineMat, trunkMat], list: queue.pine },
    { species: 'oak', geos: OAK_H, mats: [oakMat, trunkMat], list: queue.oak },
  ];
  const meshList = [];
  for (const b of builds) {
    for (let vi = 0; vi < 3; vi++) {
      const arr = b.list[vi];
      if (!arr.length) continue;
      const parts = b.species === 'pine' ? pineParts(b.geos[vi]) : oakParts(b.geos[vi]);
      const foil = new THREE.InstancedMesh(parts.foliage, b.mats[0], arr.length);
      const trunk = new THREE.InstancedMesh(parts.trunk, b.mats[1], arr.length);
      addWindAttr(foil, arr.length);
      const q = new THREE.Quaternion();
      const up = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < arr.length; i++) {
        const t = arr[i];
        q.setFromAxisAngle(up, t.yaw);
        mtx.compose(new THREE.Vector3(t.x, t.h, t.z), q, ONE.set(1, t.s, 1));
        foil.setMatrixAt(i, mtx);
        trunk.setMatrixAt(i, mtx);
        const leafTint = 0.9 + hash2(Math.floor(t.x), Math.floor(t.z), 41) * 0.35;
        foil.setColorAt(i, col.setRGB(b.species === 'pine' ? 0.22 * leafTint : 0.4 * leafTint, b.species === 'pine' ? 0.55 * leafTint : 0.68 * leafTint, 0.2 * leafTint));
        trunk.setColorAt(i, col.setHSL(0.08, 0.4, 0.2 + hash2(Math.floor(t.x), Math.floor(t.z), 43) * 0.14));
      }
      foil.instanceMatrix.needsUpdate = true;
      trunk.instanceMatrix.needsUpdate = true;
      foil.receiveShadow = true;
      group.add(foil);
      group.add(trunk);
      meshList.push(foil);
    }
  }

  /* rochas */
  const rockGeo = new THREE.IcosahedronGeometry(1, 1);
  if (rockPos.length) {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.98 });
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockPos.length / 3);
    const q = new THREE.Quaternion();
    const ax = new THREE.Vector3();
    for (let i = 0; i < rockPos.length; i += 3) {
      const x = rockPos[i], y = rockPos[i + 1], z = rockPos[i + 2];
      const s = rockScl[i / 3];
      ax.set(Math.random() - 0.5, 1, Math.random() - 0.5).normalize();
      q.setFromAxisAngle(ax, Math.random() * 6.28);
      mtx.compose(new THREE.Vector3(x, y, z), q, ONE.set(s * 1.1, s * 0.62, s));
      rocks.setMatrixAt(i / 3, mtx);
      rocks.setColorAt(i / 3, col.setRGB(rockCol[i], rockCol[i + 1], rockCol[i + 2]));
      world.colliders.add(x, z, s * 1.05, 'rock', { s });
    }
    rocks.instanceMatrix.needsUpdate = true;
    rocks.receiveShadow = true;
    group.add(rocks);
    meshList.push(rocks);
  }

  /* arbustos */
  if (bushPos.length) {
    const bushMat = makeWindyMaterial({ color: 0xffffff, roughness: 0.95 });
    const bushGeo = makeMerged([new THREE.IcosahedronGeometry(0.72, 0), new THREE.IcosahedronGeometry(0.5, 0).translate(0.5, 0.3, 0.3), new THREE.IcosahedronGeometry(0.45, 0).translate(-0.4, 0.2, -0.35)]);
    const bushes = new THREE.InstancedMesh(bushGeo, bushMat, bushPos.length / 3);
    addWindAttr(bushes, bushPos.length / 3);
    for (let i = 0; i < bushPos.length; i += 3) {
      const x = bushPos[i], y = bushPos[i + 1], z = bushPos[i + 2];
      const s = bushScl[i / 3];
      const yaw = Math.random() * Math.PI * 2;
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      mtx.compose(new THREE.Vector3(x, y - 0.12 * s, z), q, ONE.set(s, s, s));
      bushes.setMatrixAt(i / 3, mtx);
      bushes.setColorAt(i / 3, col.setRGB(bushCol[i], bushCol[i + 1], bushCol[i + 2]));
      world.colliders.add(x, z, 0.55 * s, 'bush');
    }
    bushes.instanceMatrix.needsUpdate = true;
    group.add(bushes);
    meshList.push(bushes);
  }

  /* flores (cruzetas coloridas) */
  if (flowerPos.length) {
    const fcanvas = document.createElement('canvas'); fcanvas.width = 64; fcanvas.height = 64;
    const fctx = fcanvas.getContext('2d');
    fctx.clearRect(0, 0, 64, 64);
    for (let p = 0; p < 7; p++) {
      fctx.fillStyle = '#ffffff';
      fctx.beginPath();
      fctx.arc(32, 32, 7 - p * 0.5, 0, 7);
      fctx.fill();
    }
    fctx.fillStyle = '#e8b13d';
    fctx.beginPath(); fctx.arc(32, 32, 3.4, 0, 7); fctx.fill();
    const ft = new THREE.CanvasTexture(fcanvas);
    ft.colorSpace = THREE.SRGBColorSpace;
    const fGeo = new THREE.PlaneGeometry(0.5, 0.5);
    fGeo.rotateX(-Math.PI / 2.1);
    const flowers = new THREE.InstancedMesh(fGeo, new THREE.MeshBasicMaterial({ map: ft, transparent: true, alphaTest: 0.4, depthWrite: false, side: THREE.DoubleSide }), flowerPos.length / 3);
    const q = new THREE.Quaternion();
    const ax = new THREE.Vector3();
    for (let i = 0; i < flowerPos.length; i += 3) {
      const x = flowerPos[i], y = flowerPos[i + 1] + 0.18, z = flowerPos[i + 2];
      ax.set(Math.random() - 0.5, 0.1, Math.random() - 0.5).normalize();
      q.setFromAxisAngle(ax, Math.random() * 0.4);
      mtx.compose(new THREE.Vector3(x, y, z), q, ONE.set(0.6 + Math.random() * 0.7, 1, 0.6 + Math.random() * 0.7));
      flowers.setMatrixAt(i / 3, mtx);
      flowers.setColorAt(i / 3, col.setRGB(flowerCol[i], flowerCol[i + 1], flowerCol[i + 2]));
    }
    flowers.instanceMatrix.needsUpdate = true;
    group.add(flowers);
    meshList.push(flowers);
  }

  return { group, meshList, setWind(w) { pineMat.userData.windU && (pineMat.userData.windU.value = w); oakMat.userData.windU && (oakMat.userData.windU.value = w); } };
}

/* ------------------------- grama (chão, perto da câmera) ------------------------- */

export function createGrassField(scene, world) {
  const cell = 2.4;
  const inner = 11, outer = 30;
  const poolSize = 1500;

  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 128, 128);
  const tones = ['rgba(140,205,120,0.95)', 'rgba(90,165,90,0.95)', 'rgba(60,130,70,0.95)', 'rgba(170,215,130,0.9)', 'rgba(120,180,110,0.95)'];
  for (let b = 0; b < 90; b++) {
    const bx = Math.random() * 128, bw = 1.5 + Math.random() * 3;
    const bh = 20 + Math.random() * 70;
    const colT = tones[Math.floor(Math.random() * tones.length)];
    ctx.fillStyle = colT;
    ctx.beginPath();
    ctx.moveTo(bx, 128);
    ctx.lineTo(bx + bw, 128 - bh);
    ctx.lineTo(bx + bw * 2, 128);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const plane = new THREE.PlaneGeometry(1, 1);
  // geometria: dois planos cruzados verticais saindo do chão
  const p1 = plane.clone().rotateY(0);
  const p2 = plane.clone().rotateY(Math.PI / 3);
  const p3 = plane.clone().rotateY(-Math.PI / 3);
  const g = makeMerged([p1, p2, p3]);
  g.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.35, roughness: 1, side: THREE.DoubleSide, depthWrite: true });
  const inst = new THREE.InstancedMesh(g, mat, poolSize);
  inst.frustumCulled = false;
  inst.renderOrder = 1;
  scene.add(inst);

  const occupied = new Map();
  const activeX = [], activeZ = [];
  let active = 0;
  const tmpCol = new THREE.Color();

  function key(cx, cz) { return (cx + 5000) * 10000 + (cz + 5000); }

  function update(px, pz) {
    let changed = false;
    // 1) remove células distantes
    const lim = outer + cell * 2.2;
    for (let i = 0; i < active; ) {
      if (Math.hypot(activeX[i] - px, activeZ[i] - pz) > lim) {
        occupied.delete(key(Math.floor(activeX[i] / cell), Math.floor(activeZ[i] / cell)));
        active--;
        activeX[i] = activeX[active]; activeZ[i] = activeZ[active];
        changed = true;
      } else i++;
    }
    // 2) ativa novas células
    const cx0 = Math.floor((px - outer) / cell), cx1 = Math.floor((px + outer) / cell);
    const cz0 = Math.floor((pz - outer) / cell), cz1 = Math.floor((pz + outer) / cell);
    const q = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    for (let cx = cx0; cx <= cx1 && active < poolSize; cx++) {
      for (let cz = cz0; cz <= cz1 && active < poolSize; cz++) {
        const wx = (cx + 0.5) * cell, wz = (cz + 0.5) * cell;
        const d = Math.hypot(wx - px, wz - pz);
        if (d > outer || d < 0.6 * cell) continue;
        const k = key(cx, cz);
        if (occupied.has(k)) continue;
        let dens;
        if (d < inner) dens = 0.9;
        else if (d < inner * 1.9) dens = 0.65;
        else dens = 0.34;
        if (hash2(cx, cz, 58) > dens) continue;
        const ox = wx + (hash2(cx, cz, 61) - 0.5) * cell * 0.85;
        const oz = wz + (hash2(cx, cz, 62) - 0.5) * cell * 0.85;
        const h = world.heightAt(ox, oz);
        const qq = world.lakeQ(ox, oz);
        if (qq < 0.95) continue;
        const dR = world.roadDist(ox, oz);
        if (dR < 4.6) continue;
        if (h > 60) continue;
        let s = 0.55 + hash2(cx, cz, 63) * 0.85;
        if (dR < 8.5) s *= 0.72;
        const lift = clamp01((h - world.waterLevel) * 0.5) * 0.16;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), hash2(cx, cz, 64) * Math.PI * 2);
        mtx.compose(new THREE.Vector3(ox, h + lift, oz), q, one.set(s * 0.8, s, s * 0.8));
        inst.setMatrixAt(active, mtx);
        const tt = 0.75 + hash2(cx, cz, 65) * 0.5;
        inst.setColorAt(active, tmpCol.setRGB(0.4 * tt, 0.92 * tt, 0.32 * tt));
        occupied.set(k, active);
        activeX[active] = ox; activeZ[active] = oz;
        active++;
        changed = true;
      }
    }
    if (changed) {
      inst.count = active;
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    }
  }

  return { update, inst };
}
