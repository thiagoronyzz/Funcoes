/* effects.js — partículas, marcas de pneu e respingos. */
import * as THREE from '../lib/three.module.js';

export function createEffects(scene) {
  const group = new THREE.Group();
  scene.add(group);

  /* ---------- poça de partículas genérica ---------- */
  const MAX = 500;
  const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);

  const pos = new Float32Array(MAX * 3);
  const vel = new Float32Array(MAX * 3);
  const col = new Float32Array(MAX * 3);
  const siz = new Float32Array(MAX);
  const life = new Float32Array(MAX);
  const maxLife = new Float32Array(MAX);
  const grav = new Float32Array(MAX);
  const blend = new Int8Array(MAX); // 0 normal, 1 aditivo
  let head = 0, aliveCount = 0;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { tex: { value: tex } },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute vec3 color;
      attribute float aSize;
      varying vec3 vColor;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (300.0 / max(-mv.z, 1.0));
        gl_Position = projectionMatrix * mv;
        vColor = color;
      }`,
    fragmentShader: `
      uniform sampler2D tex; varying vec3 vColor;
      void main(){
        float a = texture2D(tex, gl_PointCoord).a;
        if (a < 0.02) discard;
        gl_FragColor = vec4(vColor, a * 0.92);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  group.add(points);

  const tmpCol = new THREE.Color();

  function spawnParticle(px, py, pz, vx, vy, vz, r, gg, size, additive) {
    const i = head;
    head = (head + 1) % MAX;
    if (life[i] > 0) aliveCount--;
    pos[i * 3] = px; pos[i * 3 + 1] = py; pos[i * 3 + 2] = pz;
    vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
    col[i * 3] = r.r; col[i * 3 + 1] = r.g; col[i * 3 + 2] = r.b;
    siz[i] = size;
    life[i] = maxLife[i] = 1;
    grav[i] = gg;
    blend[i] = additive ? 1 : 0;
    aliveCount++;
  }

  function burst(list) {
    for (const p of list) {
      if (aliveCount >= MAX - 4) break;
      spawnParticle(p.x, p.y, p.z, p.vx, p.vy, p.vz, tmpCol.setRGB(p.r, p.g, p.b), p.grav ?? 0, p.size ?? 1.2, p.additive);
    }
  }

  function dust(px, py, pz, n, spread, up) {
    const list = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * spread;
      list.push({
        x: px + Math.cos(a) * s, y: py + Math.random() * 0.3, z: pz + Math.sin(a) * s,
        vx: Math.cos(a) * (1 + Math.random() * 3) + (Math.random() - 0.5) * 1.4,
        vy: up * (0.4 + Math.random() * 0.9),
        vz: Math.sin(a) * (1 + Math.random() * 3) + (Math.random() - 0.5) * 1.4,
        r: 0.72 + Math.random() * 0.1, g: 0.62 + Math.random() * 0.1, b: 0.45 + Math.random() * 0.1,
        grav: -2.2, size: 0.9 + Math.random() * 1.2,
      });
    }
    burst(list);
  }

  function splash(px, py, pz, dirX, dirZ, power) {
    const list = [];
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2;
      list.push({
        x: px + (Math.random() - 0.5) * 2.2, y: py + 0.1 + Math.random() * 0.5, z: pz + (Math.random() - 0.5) * 2.2,
        vx: dirX * power * 0.5 + Math.cos(a) * (1 + Math.random() * 5),
        vy: 3 + Math.random() * 7,
        vz: dirZ * power * 0.5 + Math.sin(a) * (1 + Math.random() * 5),
        r: 0.92, g: 0.96, b: 1.0, grav: -6.5, size: 1 + Math.random() * 1.4,
      });
    }
    burst(list);
  }

  function sparks(px, py, pz) {
    const list = [];
    for (let i = 0; i < 14; i++) {
      list.push({
        x: px + (Math.random() - 0.5) * 0.4, y: py, z: pz + (Math.random() - 0.5) * 0.4,
        vx: (Math.random() - 0.5) * 9, vy: 0.5 + Math.random() * 8, vz: (Math.random() - 0.5) * 9,
        r: 1, g: 0.75 + Math.random() * 0.2, b: 0.25,
        grav: -7, size: 0.5 + Math.random() * 0.7, additive: true,
      });
    }
    burst(list);
  }

  const velArr = new Float32Array(3);

  function update(dt) {
    const p = geo.attributes.position.array;
    const c = geo.attributes.color.array;
    for (let i = 0; i < MAX; i++) {
      if (life[i] <= 0) continue;
      life[i] -= dt * 0.85;
      if (life[i] <= 0) { aliveCount--; siz[i] = 0; continue; }
      vel[i * 3 + 1] += grav[i] * dt;
      p[i * 3] += vel[i * 3] * dt;
      p[i * 3 + 1] += vel[i * 3 + 1] * dt;
      p[i * 3 + 2] += vel[i * 3 + 2] * dt;
      vel[i * 3] *= (1 - dt * 0.6);
      vel[i * 3 + 2] *= (1 - dt * 0.6);
      // fading do tamanho
      siz[i] *= (1 - dt * 0.5);
      const f = Math.max(0, life[i]);
      c[i * 3] *= f; c[i * 3 + 1] *= f; c[i * 3 + 2] *= f;
    }
    void velArr;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
    points.geometry.setDrawRange(0, MAX);
  }

  /* ---------- marcas de pneu (decais no asfalto) ---------- */
  const skids = [];
  const skidGeo = new THREE.PlaneGeometry(1, 1);
  skidGeo.rotateX(-Math.PI / 2);
  function skid(x, z, yaw, width, len) {
    if (skids.length > 90) {
      const old = skids.shift();
      group.remove(old.mesh);
      old.mesh.geometry.dispose();
      old.mesh.material.dispose();
    }
    const m = new THREE.Mesh(skidGeo, new THREE.MeshBasicMaterial({
      color: 0x101010, transparent: true, opacity: 0.34, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
    }));
    m.rotation.y = yaw;
    m.scale.set(width, len, 1);
    m.position.set(x, worldHeightForDecal(x, z), z);
    group.add(m);
    skids.push({ mesh: m, life: 7, y: m.position.y });
  }
  // função setada pelo mundo (evita import circular)
  let heightFn = () => 0;
  function worldHeightForDecal(x, z) { return heightFn(x, z) + 0.075; }

  function updateSkids(dt) {
    for (let i = skids.length - 1; i >= 0; i--) {
      const s = skids[i];
      s.life -= dt;
      if (s.life <= 0) {
        group.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.mesh.material.dispose();
        skids.splice(i, 1);
      } else if (s.life < 2) {
        s.mesh.material.opacity = Math.max(0, s.life / 2) * 0.4;
      }
    }
  }

  return {
    group, points,
    setWorld(fn) { heightFn = fn; },
    burst, dust, splash, sparks, skid,
    update, updateSkids,
  };
}
