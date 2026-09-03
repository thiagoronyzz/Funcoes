/* world.js — terreno, estrada (loop extenso), lago e colisões estáticas. */
import * as THREE from '../lib/three.module.js';
import { makeFbm2D, makeNoise2D, smoothstep, clamp01, lerp, hash2 } from './noise.js';

export const WATER_Y = 0.9;

const PAL = {
  grassDark: new THREE.Color('#1c5c2c'),
  grass: new THREE.Color('#2e7a38'),
  grassWarm: new THREE.Color('#5ba34a'),
  dirt: new THREE.Color('#8a6a45'),
  rock: new THREE.Color('#6f6a61'),
  sand: new THREE.Color('#c3ad77'),
  mountain: new THREE.Color('#828a79'),
  snow: new THREE.Color('#eae6d9'),
};

/* ------------------------------ height field ------------------------------ */

function makeHeightField(seed = 20260903) {
  const f1 = makeFbm2D(seed, 4);
  const f2 = makeFbm2D(seed + 5, 3);
  const f3 = makeFbm2D(seed + 11, 2);
  const r1 = makeNoise2D(seed + 77);

  const LAKE = { x: 40, z: 120 };

  function lakeQ(x, z) {
    const dx = x - LAKE.x, dz = z - LAKE.z;
    const a = Math.cos(0.22) * dx + Math.sin(0.22) * dz;
    const b = -Math.sin(0.22) * dx + Math.cos(0.22) * dz;
    return (a * a) / (360 * 360) + (b * b) / (265 * 265);
  }

  function hills(x, z) {
    const bell = (cx, cz, R, A) => {
      const d2 = (x - cx) * (x - cx) + (z - cz) * (z - cz);
      return A * Math.exp(-d2 / (R * R));
    };
    const e = hash2(Math.floor(x / 46), Math.floor(z / 46), 3);
    return bell(930, -160, 320, 150) + bell(-640, 900, 250, 80) + bell(140, -900, 200, 38) + (e - 0.5) * 0.7;
  }

  function mountainRing(x, z) {
    const d = Math.hypot(x - 60, z + 90);
    const m = smoothstep(1090, 1750, d);
    if (m <= 0) return 0;
    const jag = (f1(x * 0.0011 + 400, z * 0.0011 - 300) * 0.5 + 0.5);
    const peak = (f2(x * 0.0028 - 100, z * 0.0028 + 200) * 0.5 + 0.5);
    const a = 150 + jag * 95 + peak * 150;
    const rr = Math.max(0, d - 1090);
    return m * a * (0.6 + 0.4 * Math.exp(-rr * 0.0011));
  }

  function heightAt(x, z) {
    let h = 5.4
      + f1(x * 0.00135 + 13.7, z * 0.00135 - 5.1) * 7.0
      + f2(x * 0.0052 - 2.3, z * 0.0052 + 8.8) * 1.7
      + f3(x * 0.02, z * 0.02) * 0.2;
    h += hills(x, z) * 0.55;
    h += mountainRing(x, z);

    const q = lakeQ(x, z);
    if (q < 1.14) {
      // fundo do lago: mais profundo no centro, margem gradual e plana
      const depth = 3.4 * Math.pow(clamp01(1 - q), 1.15);
      const target = WATER_Y - depth;
      const ring = 1 - smoothstep(0.8, 1.1, q);
      h = lerp(h, target, ring);
      h = Math.min(h, WATER_Y + 3.5);
    }
    return h;
  }

  function terrainColor(x, z, h, slope, out) {
    const q = lakeQ(x, z);
    const nearWater = clamp01((1.25 - q) / 0.9);
    const d = Math.hypot(x - 60, z + 90);
    const mont = smoothstep(860, 1350, d);
    const forestMask = clamp01((f2(x * 0.0045 - 5, z * 0.0045 + 2) + 0.08) / 0.55);

    out.copy(PAL.grass).lerp(PAL.grassDark, forestMask * 0.92);
    const warm = r1.noise(x * 0.055, z * 0.055);
    out.lerp(PAL.grassWarm, clamp01(warm) * 0.2);

    if (slope > 0.15) out.lerp(PAL.dirt, clamp01((slope - 0.15) / 0.45) * 0.85);
    if (slope > 0.5) out.lerp(PAL.rock, clamp01((slope - 0.5) / 0.45));
    if (nearWater > 0.02 && h < WATER_Y + 5) {
      out.lerp(PAL.sand, nearWater * clamp01(1 - Math.max(0, h - WATER_Y) * 0.22) * 0.85);
    }
    if (mont > 0.02) out.lerp(PAL.mountain, mont * 0.85);
    if (h > 195) out.lerp(PAL.snow, clamp01((h - 195) / 55));
    out.multiplyScalar(0.92 + warm * 0.16);
    return out;
  }

  return { heightAt, terrainColor, lakeQ, lakeCenter: LAKE };
}

/* ------------------------------ road plan ------------------------------ */

const ROAD_CTRL = [
  [0, -1080], [620, -900], [1060, -520], [1230, 60],
  [1140, 660], [780, 1040], [230, 1170], [-420, 1090],
  [-950, 760], [-1230, 240], [-1170, -380], [-830, -830],
];

export function makeRoadPlan() {
  const ctrl = ROAD_CTRL.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(ctrl, true, 'catmullrom', 0.42);
  const total = curve.getLength();
  const count = Math.max(100, Math.floor(total / 2.4));
  const pts = [];
  for (let i = 0; i < count; i++) {
    const p = curve.getPointAt(i / count);
    pts.push([p.x, p.z]);
  }
  return { pts, total };
}

/* ------------------------ static collider registry ------------------------ */

export class StaticColliders {
  constructor(cell = 8) {
    this.cell = cell;
    this.items = [];
    this.grid = new Map();
  }
  _key(cx, cz) { return cx * 8192 + cz; }
  add(x, z, r, kind = 'solid', data = null) {
    const item = { x, z, r, kind, data };
    this.items.push(item);
    const cx = Math.floor(x / this.cell), cz = Math.floor(z / this.cell);
    const k = this._key(cx, cz);
    let arr = this.grid.get(k);
    if (!arr) { arr = []; this.grid.set(k, arr); }
    arr.push(item);
    return item;
  }
  /* busca itens com centro a menos de radius do ponto (x,z) */
  query(x, z, radius, out = []) {
    out.length = 0;
    const c = this.cell;
    const x0 = Math.floor((x - radius) / c), x1 = Math.floor((x + radius) / c);
    const z0 = Math.floor((z - radius) / c), z1 = Math.floor((z + radius) / c);
    const rr = radius * radius;
    for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
      const arr = this.grid.get(this._key(cx, cz));
      if (!arr) continue;
      for (const it of arr) {
        const dx = it.x - x, dz = it.z - z;
        if (dx * dx + dz * dz <= rr) out.push(it);
      }
    }
    return out;
  }
}

/* ------------------------------- textures -------------------------------- */

function asphaltCanvas() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#34363b'; ctx.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 5200; i++) {
    const v = Math.random();
    ctx.fillStyle = v > 0.5 ? `rgba(0,0,0,${(v - 0.5) * 0.55})` : `rgba(150,150,150,${(0.5 - v) * 0.14})`;
    const w = Math.random() * 2 + 0.4;
    ctx.fillRect(Math.random() * 128, Math.random() * 256, w, w);
  }
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = 'rgba(20,21,24,0.55)';
    ctx.beginPath();
    ctx.ellipse(Math.random() * 128, Math.random() * 256, 6 + Math.random() * 10, 8 + Math.random() * 16, Math.random() * 3, 0, 7);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function lineCanvas(color, frac) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 64, 256);
  ctx.fillStyle = color;
  const h = Math.max(2, 256 * frac);
  ctx.fillRect(0, (256 - h) / 2, 64, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------------------- build ribbons ----------------------------- */

// Cria uma tira ao longo do plano da estrada.
function ribbonMesh(P, T, halfW, offset, yOff, mat, distRepeat, uvAcross = 1) {
  const L = P.length;
  const pos = [];
  const uv = [];
  const idx = [];
  let acc = 0;
  for (let i = 0; i < L; i++) {
    const p = P[i];
    const tx = T[i][0], tz = T[i][1];
    const nx = -tz, nz = tx;
    if (i > 0) acc += Math.hypot(p.x - P[i - 1].x, p.z - P[i - 1].z);
    const o = offset || 0;
    pos.push(p.x + nx * (o - halfW), p.y + yOff, p.z + nz * (o - halfW));
    pos.push(p.x + nx * (o + halfW), p.y + yOff, p.z + nz * (o + halfW));
    uv.push(0, acc / distRepeat, uvAcross, acc / distRepeat);
    if (i > 0) {
      const k = i * 2;
      idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
    }
  }
  const k0 = L * 2;
  pos.push(P[0].x, P[0].y + yOff, P[0].z);
  pos.push(P[0].x, P[0].y + yOff, P[0].z);
  idx.push(k0 - 2, k0 - 1, k0, k0 - 1, k0 + 1, k0);
  uv.push(0, acc / distRepeat, uvAcross, acc / distRepeat);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  const mesh = new THREE.Mesh(g, mat);
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return mesh;
}

/* ------------------------------- createWorld ------------------------------- */

export function createWorld(scene, quality) {
  const HF = makeHeightField(20260903);
  const { heightAt, terrainColor, lakeQ } = HF;
  const colliders = new StaticColliders();
  const group = new THREE.Group();
  scene.add(group);

  const { pts, total } = makeRoadPlan();
  const L = pts.length;

  /* ponto 3D ao longo da estrada */
  const P = [];
  for (let i = 0; i < L; i++) P.push(new THREE.Vector3(pts[i][0], heightAt(pts[i][0], pts[i][1]) + 0.06, pts[i][1]));
  const T = [];
  for (let i = 0; i < L; i++) {
    const a = P[i], b = P[(i + 1) % L];
    const tx = b.x - a.x, tz = b.z - a.z;
    const len = Math.hypot(tx, tz) || 1;
    T.push([tx / len, tz / len]);
  }

  /* ---------- campo de distância da estrada (para pintura do solo) ---------- */
  const gs = 3.0;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const p of P) { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z; }
  const gw = Math.ceil((maxX - minX) / gs) + 3, gh = Math.ceil((maxZ - minZ) / gs) + 3;
  const field = new Float32Array(gw * gh).fill(999);
  for (let i = 0; i < L; i++) {
    const p0 = P[i], p1 = P[(i + 1) % L];
    const st = Math.ceil(Math.hypot(p1.x - p0.x, p1.z - p0.z) / 1.2);
    for (let s = 0; s <= st; s++) {
      const x = p0.x + ((p1.x - p0.x) * s) / st;
      const z = p0.z + ((p1.z - p0.z) * s) / st;
      const gx0 = Math.floor((x - minX) / gs), gz0 = Math.floor((z - minZ) / gs);
      for (let dx = -7; dx <= 7; dx++) for (let dz = -7; dz <= 7; dz++) {
        const ix = gx0 + dx, iz = gz0 + dz;
        if (ix < 0 || iz < 0 || ix >= gw || iz >= gh) continue;
        const cx = minX + (ix + 0.5) * gs, cz = minZ + (iz + 0.5) * gs;
        const d = Math.hypot(cx - x, cz - z);
        const j = iz * gw + ix;
        if (d < field[j]) field[j] = d;
      }
    }
  }

  /* ------------------------------ TERRAIN MESH ------------------------------ */
  const SIZE = 3400;
  const SEG = quality === 'baixa' ? 300 : 500;
  const vCount = (SEG + 1) * (SEG + 1);
  const positions = new Float32Array(vCount * 3);
  const colors = new Float32Array(vCount * 3);
  const normals = new Float32Array(vCount * 3);
  const col = new THREE.Color();
  let p = 0;
  for (let j = 0; j <= SEG; j++) {
    for (let i = 0; i <= SEG; i++) {
      const x = -SIZE / 2 + (i / SEG) * SIZE;
      const z = -SIZE / 2 + (j / SEG) * SIZE;
      const h = heightAt(x, z);
      const e = 2.6;
      const gx = heightAt(x + e, z) - h;
      const gz = heightAt(x, z + e) - h;
      const slope = Math.min(1, Math.hypot(gx, gz) / e);
      const lenN = Math.hypot(gx, e, gz);
      positions[p] = x; positions[p + 1] = h; positions[p + 2] = z;
      normals[p] = -gx / lenN; normals[p + 1] = e / lenN; normals[p + 2] = -gz / lenN;
      terrainColor(x, z, h, slope, col);
      const gi = Math.floor((x - minX) / gs), gj = Math.floor((z - minZ) / gs);
      if (gi >= 0 && gj >= 0 && gi < gw && gj < gh) {
        const dRoad = field[gj * gw + gi];
        if (dRoad < 3.2) col.lerp(new THREE.Color('#2c2d30'), 1 - dRoad / 3.2);
        else if (dRoad < 9) col.lerp(new THREE.Color('#77603f'), (9 - dRoad) / 5 * 0.45);
      }
      colors[p] = col.r; colors[p + 1] = col.g; colors[p + 2] = col.b;
      p += 3;
    }
  }
  const idx = new Uint32Array(SEG * SEG * 6);
  let k = 0;
  for (let j = 0; j < SEG; j++) for (let i = 0; i < SEG; i++) {
    const a = j * (SEG + 1) + i, b = a + 1, c = a + SEG + 1, d = c + 1;
    idx[k++] = a; idx[k++] = c; idx[k++] = b;
    idx[k++] = b; idx[k++] = c; idx[k++] = d;
  }
  const tgeo = new THREE.BufferGeometry();
  tgeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  tgeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  tgeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  tgeo.setIndex(new THREE.BufferAttribute(idx, 1));

  // detalhe de grama (speckle)
  const dc = document.createElement('canvas'); dc.width = 256; dc.height = 256;
  const dctx = dc.getContext('2d');
  dctx.fillStyle = '#ffffff'; dctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 14000; i++) {
    const v = Math.random();
    dctx.fillStyle = v > 0.5 ? `rgba(0,55,10,${(v - 0.5) * 0.55})` : `rgba(120,200,110,${(0.5 - v) * 0.28})`;
    const w = 1 + Math.random() * 2.6;
    dctx.fillRect(Math.random() * 256, Math.random() * 256, w, w);
  }
  const detailTex = new THREE.CanvasTexture(dc);
  detailTex.wrapS = detailTex.wrapT = THREE.RepeatWrapping;
  detailTex.repeat.set(400, 400);
  detailTex.colorSpace = THREE.SRGBColorSpace;
  const terrain = new THREE.Mesh(tgeo, new THREE.MeshStandardMaterial({
    vertexColors: true, map: detailTex, roughness: 1, metalness: 0,
  }));
  terrain.receiveShadow = true;
  group.add(terrain);

  /* ------------------------------- WATER ------------------------------- */
  const water = buildWater(HF);
  group.add(water.mesh);

  /* ------------------------------- ROAD ------------------------------- */
  const asphalt = asphaltCanvas();
  asphalt.repeat.set(1, 1);
  const roadSurfMat = new THREE.MeshStandardMaterial({
    map: asphalt, roughness: 0.94, metalness: 0,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const roadGroup = new THREE.Group();
  const surf = ribbonMesh(P, T, 4.7, 0, 0, roadSurfMat, 4.2);
  roadGroup.add(surf);

  const dashTex = lineCanvas('#e9e6d6', 0.16);
  const dashMat = new THREE.MeshBasicMaterial({ map: dashTex, alphaTest: 0.5, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  roadGroup.add(ribbonMesh(P, T, 0.17, 0, 0.045, dashMat, 3.4));

  const edgeTex = lineCanvas('#ddd9c8', 0.14);
  const edgeMat = new THREE.MeshBasicMaterial({ map: edgeTex, alphaTest: 0.5, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  roadGroup.add(ribbonMesh(P, T, 0.12, -3.55, 0.045, edgeMat, 3.4));
  roadGroup.add(ribbonMesh(P, T, 0.12, 3.55, 0.045, edgeMat, 3.4));
  group.add(roadGroup);

  /* linha de largada / chegada */
  addStartLine(roadGroup, P, T);

  /* -------------------- guard-rails visíveis + colliders -------------------- */
  addGuardrails(roadGroup, P, T, colliders);

  /* montanhas distantes */
  group.add(buildDistantMountains());

  const roadApi = {
    length: total,
    count: L,
    P, T,
    getPointAt(i) { i = ((i % L) + L) % L; return P[i]; },
    getTangent(i) { i = ((i % L) + L) % L; return T[i]; },
    getIndexAtParam(i) { return ((i % L) + L) % L; },
    nearest(x, z) {
      let best = 0, bd = Infinity;
      const step = 6;
      for (let i = 0; i < L; i += step) {
        const p = P[i];
        const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
        if (d < bd) { bd = d; best = i; }
      }
      for (let k = -step; k <= step; k++) {
        const i = (((best + k) % L) + L) % L;
        const p = P[i];
        const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
        if (d < bd) { bd = d; best = i; }
      }
      return { i: best, dist: Math.sqrt(bd), p: P[best] };
    },
  };

  /* distância aproximada até a pista (grade) */
  function roadDist(x, z) {
    const gi = Math.floor((x - minX) / gs), gj = Math.floor((z - minZ) / gs);
    if (gi < 0 || gj < 0 || gi >= gw || gj >= gh) return 999;
    return field[gj * gw + gi];
  }

  function normalAt(x, z) {
    const e = 1.0;
    const hx1 = heightAt(x - e, z), hx2 = heightAt(x + e, z);
    const hz1 = heightAt(x, z - e), hz2 = heightAt(x, z + e);
    const nv = new THREE.Vector3(hx1 - hx2, 2 * e, hz1 - hz2);
    return nv.normalize();
  }

  return {
    group, terrain, water,
    heightAt, normalAt, lakeQ, lakeCenter: HF.lakeCenter,
    colliders, road: roadApi,
    roadPts: P, roadT: T,
    roadDist,
    waterLevel: WATER_Y,
  };
}

/* ------------------------------- guardrails ------------------------------- */

const X_AXIS = new THREE.Vector3(1, 0, 0);
function orientFromX(dir) {
  const d = dir.clone().setY(0).normalize();
  const q = new THREE.Quaternion();
  if (d.lengthSq() < 1e-6) return q;
  q.setFromUnitVectors(X_AXIS, d);
  return q;
}

function addGuardrails(parent, P, T, colliders) {
  const L = P.length;
  // viga metálica (uma caixa por segmento de amostra, alinhada à tangente)
  const beamGeo = new THREE.BoxGeometry(1, 0.34, 0.1);
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x8e908d, metalness: 0.6, roughness: 0.42 });
  const postGeo = new THREE.BoxGeometry(0.14, 0.9, 0.14);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x6f6f6a, metalness: 0.35, roughness: 0.55 });
  const mtx = new THREE.Matrix4();
  const posV = new THREE.Vector3();
  const scaleV = new THREE.Vector3();
  const oneV = new THREE.Vector3(1, 1, 1);
  const qTmp = new THREE.Quaternion();
  const dirTmp = new THREE.Vector3();
  for (const side of [-1, 1]) {
    const step = 2;
    const beams = new THREE.InstancedMesh(beamGeo, beamMat, Math.ceil(L / step));
    const posts = new THREE.InstancedMesh(postGeo, postMat, Math.ceil(L / (step * 2)));
    let bI = 0, pI = 0;
    for (let i = 0; i < L; i++) {
      const p = P[i];
      const tx = T[i][0], tz = T[i][1];
      const nx = -tz, nz = tx;
      const sideOff = 5.05;
      const ox = p.x + nx * side * sideOff;
      const oz = p.z + nz * side * sideOff;
      const y = p.y + 0.6;
      if (i % step === 0 && bI < beams.count) {
        const pi2 = P[(i + step) % L];
        const segLen = Math.hypot(pi2.x - p.x, pi2.z - p.z);
        posV.set((p.x + pi2.x) / 2 + nx * side * sideOff, y, (p.z + pi2.z) / 2 + nz * side * sideOff);
        dirTmp.set(pi2.x - p.x, 0, pi2.z - p.z);
        orientFromXInto(dirTmp, qTmp);
        scaleV.set(segLen + 0.5, 1, 1);
        mtx.compose(posV, qTmp, scaleV);
        beams.setMatrixAt(bI++, mtx);
      }
      if (i % (step * 2) === 0 && pI < posts.count) {
        posV.set(ox, y - 0.28, oz);
        mtx.compose(posV, new THREE.Quaternion(), oneV);
        posts.setMatrixAt(pI++, mtx);
      }
      // colisão contínua ao longo da viga
      colliders.add(ox, oz, 0.34, 'guardrail');
    }
    beams.count = bI;
    posts.count = pI;
    beams.instanceMatrix.needsUpdate = true;
    posts.instanceMatrix.needsUpdate = true;
    beams.receiveShadow = true;
    parent.add(beams);
    parent.add(posts);
  }
}
const qOrient = new THREE.Quaternion();
function orientFromXInto(dir, out) {
  const d = dir.setY(0).normalize();
  if (d.lengthSq() < 1e-6) { out.identity(); return; }
  out.setFromUnitVectors(X_AXIS, d);
  void qOrient;
}

/* --------------------------- linha de largada --------------------------- */

function addStartLine(parent, P, T) {
  const START_FRAC = 0.08;
  const i0 = Math.floor(P.length * START_FRAC);
  const sq = 0.55;
  const across = 16;
  const rows = 8;
  const white = [0.95, 0.94, 0.88];
  const dark = [0.08, 0.08, 0.09];
  const pos = [];
  const colArr = [];
  const idx = [];
  const p0 = P[i0];
  const nx = -T[i0][1], nz = T[i0][0];
  const tx = T[i0][0], tz = T[i0][1];
  for (let s = 0; s < rows; s++) {
    for (let a = 0; a < across; a++) {
      const check = (a + s) % 2 === 0;
      const c3 = check ? white : dark;
      const x0 = -4.4 + a * sq, x1 = x0 + sq;
      const zA = s * sq, zB = zA + sq;
      const base = pos.length / 3;
      const corners = [[x0, zA], [x1, zA], [x1, zB], [x0, zB]];
      for (const [cx, cz] of corners) {
        pos.push(p0.x + nx * cx + tx * cz, p0.y + 0.06, p0.z + nz * cx + tz * cz);
        colArr.push(c3[0], c3[1], c3[2]);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colArr), 3));
  g.setIndex(idx);
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
  mesh.renderOrder = 3;
  parent.add(mesh);

  // pórtico simples de largada (vigas sobre a pista)
  const postMat = new THREE.MeshStandardMaterial({ color: 0xb9b9ac, metalness: 0.25, roughness: 0.55 });
  const dirAcross = new THREE.Vector3(nx, 0, nz); // normal lateral
  for (const side of [-1, 1]) {
    const px = p0.x + nx * side * 7.2;
    const pz = p0.z + nz * side * 7.2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 5.8, 10), postMat);
    post.position.set(px, p0.y + 2.9, pz);
    parent.add(post);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.42, 0.34), postMat);
  beam.position.set(p0.x + tx * 1.4, p0.y + 5.6, p0.z + tz * 1.4);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dirAcross);
  parent.add(beam);
}

/* ------------------------------ água (shader) ------------------------------ */

function buildWater(HF) {
  const geo = new THREE.CircleGeometry(860, 120);
  geo.rotateX(-Math.PI / 2);
  const c = HF.lakeCenter;
  const uni = {
    time: { value: 0 },
    deep: { value: new THREE.Color('#11506e') },
    shallow: { value: new THREE.Color('#2e8f86') },
    skyRef: { value: new THREE.Color('#f6bd73') },
    horizon: { value: new THREE.Color('#e8a05e') },
    sunDir: { value: new THREE.Vector3(0.42, 0.5, 0.3).normalize() },
    sunColor: { value: new THREE.Color('#ffe2b0') },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: uni,
    fog: true,
    vertexShader: `
      varying vec3 vWorld;
      #include <fog_pars_vertex>
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        vec4 mv = viewMatrix * w;
        gl_Position = projectionMatrix * mv;
        vFogDepth = -mv.z;
      }`,
    fragmentShader: `
      uniform float time; uniform vec3 deep; uniform vec3 shallow;
      uniform vec3 skyRef; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 sunColor;
      varying vec3 vWorld;
      #include <fog_pars_fragment>
      void main(){
        vec2 p = vWorld.xz;
        float t = time;
        float w1 = sin(p.x*0.045 + t*0.7);
        float w2 = cos(p.y*0.05 - t*0.6);
        float w3 = sin((p.x+p.y)*0.03 + t*0.4);
        float ddx = w1*0.30 + cos(p.y*0.075 + t*0.5)*0.35 + w3*0.2;
        float ddz = w2*0.30 + sin(p.x*0.075 - t*0.5)*0.35 + w3*0.2;
        vec3 n = normalize(vec3(ddx, 1.0, ddz));
        vec3 V = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - max(dot(V, n), 0.0), 2.6);
        vec3 skyCol = mix(horizon, skyRef, pow(max(n.y, 0.0), 0.35));
        vec3 col = mix(deep, shallow, smoothstep(-5.0, 0.4, vWorld.y - 0.9)*0.55 + 0.25);
        col = mix(col, skyCol, fres*0.82);
        vec3 H = normalize(sunDir + V);
        float spec = pow(max(dot(n, H), 0.0), 420.0)*1.6;
        float glint = pow(max(dot(reflect(-V, n), sunDir), 0.0), 140.0);
        col += sunColor*(spec*1.1 + glint*0.35);
        col *= 1.04;
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(c.x, WATER_Y, c.z);
  mesh.renderOrder = 4;
  mesh.frustumCulled = false;
  return { mesh, uni };
}

/* --------------------------- montanhas distantes --------------------------- */

function buildDistantMountains() {
  const n1 = makeFbm2D(701, 4);
  const n2 = makeFbm2D(702, 3);
  const SEG = 170;
  const pos = [];
  const colArr = [];
  const idx = [];
  const col = new THREE.Color();
  for (let j = 0; j < SEG; j++) {
    const a = (j / SEG) * Math.PI * 2;
    for (let i = 0; i < 2; i++) {
      const base = 1520 + i * 760;
      const x0 = Math.cos(a) * base, z0 = Math.sin(a) * base;
      const nn = n1(x0 * 0.0013 + 70, z0 * 0.0013 - 90);
      const rr = base * (1 + nn * 0.2);
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      const slopeIn = smoothstep(1250, 1600, rr);
      let h = 40 + slopeIn * (170 + n2(x * 0.0021, z * 0.0021) * 260 + nn * 60);
      pos.push(x, h, z);
      col.setHSL(0.23 + nn * 0.04, 0.14, 0.30 + slopeIn * 0.10 + nn * 0.05);
      colArr.push(col.r, col.g, col.b);
      if (i > 0 && j > 0) {
        const a0 = (j - 1) * 2 + (i - 1), b0 = (j - 1) * 2 + i;
        const a1 = j * 2 + (i - 1), b1 = j * 2 + i;
        idx.push(a0, a1, b0, b0, a1, b1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colArr), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
  mesh.frustumCulled = false;
  mesh.receiveShadow = true;
  return mesh;
}
