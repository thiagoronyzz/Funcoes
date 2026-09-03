/* vehicle.js — construção procedural de carros (coupé esportivo realista). */
import * as THREE from '../lib/three.module.js';

export const DIMS = { w: 1.86, l: 4.35, wheelBase: 2.62, h: 1.22 };

function mergeGeos(parts) {
  const pos = [], nrm = [], uv = [], idx = [];
  let off = 0;
  for (const g of parts) {
    const p = g.attributes.position.array;
    const n = g.attributes.normal ? g.attributes.normal.array : null;
    const u = g.attributes.uv ? g.attributes.uv.array : null;
    for (let i = 0; i < p.length; i += 3) {
      pos.push(p[i], p[i + 1], p[i + 2]);
      if (n) nrm.push(n[i], n[i + 1], n[i + 2]);
      if (u) uv.push(u[i], u[i + 1]);
    }
    const gi = g.index ? g.index : null;
    if (gi) for (let i = 0; i < gi.count; i++) idx.push(gi.getX(i) + off);
    else for (let i = 0; i < p.length / 3; i++) idx.push(i + off);
    off += p.length / 3;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  if (nrm.length) g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nrm), 3));
  if (uv.length) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  if (!nrm.length) g.computeVertexNormals();
  return g;
}

/* perfil lateral do coupé (shape 2D) — extrude ao longo da largura */
function bodyShape() {
  const L = DIMS.l;
  const shape = new THREE.Shape();
  const x0 = -L / 2;
  shape.moveTo(x0, 0.28);                       // traseira baixa
  shape.lineTo(x0 + 0.25, 0.55);                // traseira alta (deck)
  shape.quadraticCurveTo(x0 + 0.9, 0.62, x0 + 1.15, 0.58);
  shape.quadraticCurveTo(x0 + 1.95, 0.88, x0 + 2.45, 0.8);   // cintura subindo
  shape.quadraticCurveTo(x0 + 2.9, 1.02, x0 + 3.0, 0.92);    // teto
  shape.quadraticCurveTo(x0 + 3.15, 0.74, x0 + 3.1, 0.68);   // parabrisa
  shape.quadraticCurveTo(x0 + 3.6, 0.58, x0 + 3.8, 0.52);    // capô
  shape.quadraticCurveTo(x0 + 4.15, 0.42, x0 + 4.3, 0.42);   // frente
  shape.quadraticCurveTo(x0 + 4.35, 0.34, x0 + 4.35, 0.28);  // para-choque
  shape.lineTo(x0, 0.28);
  return shape;
}

function chassisGeom(paintColor) {
  const shape = bodyShape();
  const BODY_W = 1.5;
  const extrudeSettings = {
    depth: BODY_W,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.035,
    bevelSegments: 2,
    steps: 1,
  };
  const ext = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  ext.translate(0, 0, -BODY_W / 2);
  ext.computeVertexNormals();

  // geometria de pintura é apenas o exterior — simplificamos com a própria extrusão
  // e uma geometria "interior" escura por baixo
  const interior = new THREE.BoxGeometry(DIMS.l * 0.96, 0.18, BODY_W * 0.96).translate(0, 0.29, 0);
  const merged = mergeGeos([ext, interior]);
  return merged;
}

function glassGeom() {
  const L = DIMS.l;
  const g = new THREE.BoxGeometry(L * 0.22, 0.27, 1.38);
  g.translate(L * 0.03, 0.73, 0);
  return g;
}

function spoilerGeom() {
  const L = DIMS.l;
  const bx = -L / 2 + 0.42;
  const blade = new THREE.BoxGeometry(1.2, 0.055, 0.3);
  blade.translate(bx, 0.72, 0);
  const st1 = new THREE.BoxGeometry(0.08, 0.28, 0.09).translate(bx + 0.4, 0.58, 0.11);
  const st2 = st1.clone().translate(0, 0, -0.22);
  return mergeGeos([blade, st1, st2]);
}

function buildWheel() {
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.33, 0.33, 0.24, 14).rotateZ(Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95 })
  );
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.21, 0.21, 0.245, 8).rotateZ(Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xbfc2c6, metalness: 0.85, roughness: 0.25 })
  );
  const spokes = new THREE.Mesh(
    new THREE.TorusGeometry(0.155, 0.028, 6, 8).rotateX(Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xd7d9db, metalness: 0.9, roughness: 0.2 })
  );
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.25, 6).rotateZ(Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x8f9296, metalness: 0.8, roughness: 0.3 })
  );
  const wrap = new THREE.Group();
  wrap.add(tire, rim, spokes, hub);
  return wrap;
}

export function createCar(bodyColorHex = 0xc02222, opts = {}) {
  const group = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({
    color: bodyColorHex,
    metalness: 0.55,
    roughness: opts.paintRoughness ?? 0.3,
    clearcoat: 0.75,
    clearcoatRoughness: 0.22,
    envMapIntensity: 1.0,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x23242a, metalness: 0.2, roughness: 0.7 });
  const body = new THREE.Mesh(chassisGeom(), paint);
  body.castShadow = true;
  body.receiveShadow = true;
  const spoiler = new THREE.Mesh(spoilerGeom(), dark);
  const glass = new THREE.Mesh(glassGeom(), new THREE.MeshPhysicalMaterial({
    color: 0x101a28, metalness: 0.25, roughness: 0.06, transparent: true, opacity: 0.92,
    envMapIntensity: 0.7, clearcoat: 0.4,
  }));
  glass.renderOrder = 5;

  // detalhes: luzes, retrovisores, saias
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x101114, metalness: 0.1, roughness: 0.8 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
  const headMatR = headMat.clone();
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff2222, emissiveIntensity: 0.9 });
  const tailMatR = tailMat.clone();
  const fogMat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0xffdd99, emissiveIntensity: 0.25 });

  const L = DIMS.l;
  const noseY = 0.5, tailY = 0.56;
  function meshAt(geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return m;
  }
  const headL = meshAt(new THREE.BoxGeometry(0.62, 0.1, 0.09), headMat, L / 2 - 0.04, noseY, 0.6);
  const headR = meshAt(new THREE.BoxGeometry(0.62, 0.1, 0.09), headMatR, L / 2 - 0.04, noseY, -0.6);
  const tailL = meshAt(new THREE.BoxGeometry(0.2, 0.09, 0.1), tailMat, -L / 2 + 0.03, tailY, 0.6);
  const tailR = meshAt(new THREE.BoxGeometry(0.2, 0.09, 0.1), tailMatR, -L / 2 + 0.03, tailY, -0.6);
  const plateFront = meshAt(new THREE.BoxGeometry(0.28, 0.11, 0.02), dark, L / 2 - 0.02, 0.33, 0);
  const plateRear = meshAt(new THREE.BoxGeometry(0.28, 0.11, 0.02), dark, -(L / 2 - 0.02), 0.33, 0);
  const mirL = meshAt(new THREE.BoxGeometry(0.16, 0.06, 0.1), trimMat, L * 0.06, 0.95, 0.88);
  const mirR = meshAt(new THREE.BoxGeometry(0.16, 0.06, 0.1), trimMat, L * 0.06, 0.95, -0.88);

  const headlights = [headL, headR];
  const taillights = [tailL, tailR];

  body.add(spoiler, glass, headL, headR, tailL, tailR, plateFront, plateRear, mirL, mirR);

  // rodas (levemente para fora do corpo — postura esportiva)
  const wheelFL = buildWheel(); wheelFL.position.set(0, 0.33, 0.86);
  const wheelFR = buildWheel(); wheelFR.position.set(0, 0.33, -0.86);
  const wheelRL = buildWheel(); wheelRL.position.set(-DIMS.wheelBase, 0.33, 0.86);
  const wheelRR = buildWheel(); wheelRR.position.set(-DIMS.wheelBase, 0.33, -0.86);
  wheelFL.position.x = DIMS.l / 2 - 1.25;
  wheelFR.position.x = DIMS.l / 2 - 1.25;
  wheelRL.position.x = -DIMS.l / 2 + 1.05;
  wheelRR.position.x = -DIMS.l / 2 + 1.05;
  group.add(wheelFL, wheelFR, wheelRL, wheelRR, body);

  const steer = { wheelFL, wheelFR };
  const axles = { front: [wheelFL, wheelFR], rear: [wheelRL, wheelRR], all: [wheelFL, wheelFR, wheelRL, wheelRR] };

  return {
    group,
    body,
    steer,
    axles,
    parts: { headlights, taillights, fogMat },
    headMat, tailMat,
    setHeadlights(on) { for (const m of [headMat, headMatR]) m.emissiveIntensity = on ? 2.4 : 0.5; },
    setBrake(on) { for (const m of [tailMat, tailMatR]) m.emissiveIntensity = on ? 4.2 : 0.85; },
  };
}

export function createTrafficCar(color) {
  return createCar(color, { paintRoughness: 0.36 });
}
