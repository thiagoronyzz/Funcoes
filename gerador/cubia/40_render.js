
/* ============================================== RENDERER, CÉU, CHUNK MESH */
const Game = {
  mode: 'survival', hardcore: false, rd: 6, fov: 75, seed: 1, running: false, paused: false,
  time: 0.28,                      // fração do dia (0 = meio-dia, .5 = meia-noite) — ciclo de 20 min
  dayLen: 1200, skyMul: 1, t: 0, fps: 0, day: 1, worldName: 'mundo-1', sound: .6, autojump: false,
};
const canvas = $('gl');
let renderer, scene, camera, skyMesh, sunMesh, moonMesh, cloudMesh, starPts, chunkGroup, ambient, sunLight;
let solidMat, waterMat, atlasTex, crackMesh, selBox, particlePts, heldGroup;
const tileTexCache = new Map();

/* GLSL escrito à mão, sem #include: os chunks internos do three mudam entre
   versões e um varying esquecido faz o programa não compilar — e aí o chunk
   inteiro desaparece em silêncio no navegador. */
const SH_V = `
attribute vec3 aLight;
varying vec2 vUv; varying vec3 vL;
uniform float uWave; uniform float uTime;
#ifdef USE_FOG
varying float vFogDepth;
#endif
void main(){
  vec3 tp = position;
  #ifdef USE_WAVE
    tp.y += sin(uTime*1.6 + position.x*.7 + position.z*.5)*.045;
  #endif
  vUv = uv; vL = aLight;
  vec4 mvPosition = modelViewMatrix * vec4(tp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #ifdef USE_FOG
    vFogDepth = -mvPosition.z;
  #endif
}`;
const SH_F = `
uniform sampler2D map;
uniform vec3 uSky; uniform vec3 uBlk; uniform float uDay; uniform float uAlpha;
varying vec2 vUv; varying vec3 vL;
#ifdef USE_FOG
uniform vec3 fogColor; uniform float fogNear; uniform float fogFar; uniform float fogDensity;
varying float vFogDepth;
#endif
void main(){
  vec4 texel = texture2D(map, vUv);
  if (texel.a < .5) discard;
  vec3 sky = uSky * (vL.x * uDay);
  vec3 blk = uBlk * (vL.y * 1.25);
  vec3 l = max(sky, blk) + vec3(.085, .095, .13);
  vec3 col = texel.rgb * l * vL.z;
  gl_FragColor = vec4(col, texel.a * uAlpha);
  #ifdef USE_FOG
    float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
  #endif
}`;

function tileTexture(tile) {
  if (tileTexCache.has(tile)) return tileTexCache.get(tile);
  const c = document.createElement('canvas'); c.width = c.height = TILE;
  drawTileOn(c.getContext('2d'), tile, TILE);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
  tileTexCache.set(tile, t); return t;
}
function crackTexture() {
  const c = document.createElement('canvas'); c.width = 16 * 10; c.height = 16;
  const g = c.getContext('2d');
  const rnd = mulberry32(7331);
  for (let f = 0; f < 10; f++) {
    g.save(); g.translate(f * 16, 0);
    const lines = 3 + f * 3;
    for (let i = 0; i < lines; i++) {
      let x = (rnd() * 16) | 0, y = (rnd() * 16) | 0;
      for (let s = 0; s < 5 + f; s++) {
        g.fillStyle = 'rgba(0,0,0,.62)'; g.fillRect(x, y, 1, 1);
        x += rnd() < .5 ? (rnd() < .5 ? 1 : -1) : 0; y += rnd() < .55 ? 1 : -1;
        x = clamp(x, 0, 15); y = clamp(y, 0, 15);
      }
    }
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  return t;
}
let CRACK_TEX;

function initRender() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x9ec9ff);
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x9ec9ff, Game.rd * CH * .5, Game.rd * CH * 1.02);
  camera = new THREE.PerspectiveCamera(Game.fov, innerWidth / innerHeight, .06, 1400);
  chunkGroup = new THREE.Group(); scene.add(chunkGroup);

  atlasTex = makeAtlasTexture(ATLAS);
  const mkMat = (extra) => new THREE.ShaderMaterial(Object.assign({
    uniforms: {
      map: { value: atlasTex }, uDay: { value: 1 }, uTime: { value: 0 },
      uSky: { value: new THREE.Color(0xffffff) }, uBlk: { value: new THREE.Color(0xffb46a) },
      uAlpha: { value: 1 }, uWave: { value: 0 },
      fogColor: { value: new THREE.Color(0x9ec9ff) }, fogNear: { value: 60 }, fogFar: { value: 100 }, fogDensity: { value: .01 },
    },
    vertexShader: SH_V, fragmentShader: SH_F, fog: true,
  }, extra || {}));
  solidMat = mkMat({ defines: {} });
  waterMat = mkMat({ defines: { USE_WAVE: 1 }, transparent: true, depthWrite: false, side: THREE.DoubleSide, uAlphaFix: 0 });
  waterMat.uniforms.uWave.value = 1;
  CRACK_TEX = crackTexture();

  /* céu em gradiente + sol, lua, estrelas e nuvens */
  skyMesh = new THREE.Mesh(new THREE.SphereGeometry(700, 18, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: new THREE.Color(0x2f6fd0) }, uBot: { value: new THREE.Color(0xcfe6ff) }, uHor: { value: new THREE.Color(0xffd39b) }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uNight: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      varying vec3 vP; uniform vec3 uTop,uBot,uHor,uSun; uniform float uNight;
      void main(){
        float h = clamp(vP.y*.5+.5, 0., 1.);
        vec3 c = mix(uBot, uTop, pow(h, .62));
        float sun = pow(max(dot(normalize(vP), normalize(uSun)),0.), 220.)*.9;
        float halo = pow(max(dot(normalize(vP), normalize(uSun)),0.), 6.)*.28;
        c += (uHor*halo + vec3(1.,.92,.7)*sun) * (1.-uNight*.8);
        gl_FragColor = vec4(c,1.);
      }`,
  }));
  scene.add(skyMesh);
  const discTex = (col, glow) => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32);
    gr.addColorStop(0, col); gr.addColorStop(.42, col); gr.addColorStop(.5, glow); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  };
  sunMesh = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshBasicMaterial({ map: discTex('rgba(255,246,200,1)', 'rgba(255,214,120,.5)'), transparent: true, depthWrite: false, fog: false }));
  moonMesh = new THREE.Mesh(new THREE.PlaneGeometry(48, 48), new THREE.MeshBasicMaterial({ map: discTex('rgba(232,240,255,1)', 'rgba(150,180,240,.35)'), transparent: true, depthWrite: false, fog: false }));
  scene.add(sunMesh); scene.add(moonMesh);
  const stars = new Float32Array(900 * 3);
  const sr = mulberry32(4242);
  for (let i = 0; i < 900; i++) {
    const th = sr() * TAU, ph = Math.acos(sr() * 2 - 1), r = 640;
    stars[i * 3] = r * Math.sin(ph) * Math.cos(th); stars[i * 3 + 1] = Math.abs(r * Math.cos(ph)); stars[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(stars, 3));
  starPts = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
  scene.add(starPts);
  const cc = document.createElement('canvas'); cc.width = cc.height = 256;
  const cg = cc.getContext('2d'), cn = makeNoise(99), img = cg.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const v = cn.fbm2(x / 42, y / 42, 4) * .5 + .5;
    const a = clamp((v - .55) * 4.2, 0, 1);
    const i = (y * 256 + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = (a * 205) | 0;
  }
  cg.putImageData(img, 0, 0);
  const ct = new THREE.CanvasTexture(cc); ct.wrapS = ct.wrapT = THREE.RepeatWrapping; ct.repeat.set(6, 6);
  cloudMesh = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshBasicMaterial({ map: ct, transparent: true, opacity: .55, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  cloudMesh.rotation.x = -Math.PI / 2;
  scene.add(cloudMesh);

  selBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)), new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: .55, fog: false }));
  selBox.visible = false; scene.add(selBox);
  crackMesh = new THREE.Mesh(new THREE.BoxGeometry(1.006, 1.006, 1.006), new THREE.MeshBasicMaterial({ map: CRACK_TEX, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, fog: false }));
  crackMesh.material.map.repeat.set(.1, 1);
  crackMesh.visible = false; scene.add(crackMesh);

  /* partículas quadradas (estilo original) */
  const MAXP = 600, ppos = new Float32Array(MAXP * 3), pcol = new Float32Array(MAXP * 3);
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(ppos, 3).setUsage(THREE.DynamicDrawUsage));
  pg.setAttribute('color', new THREE.BufferAttribute(pcol, 3).setUsage(THREE.DynamicDrawUsage));
  particlePts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, transparent: true, fog: false }));
  particlePts.frustumCulled = false; scene.add(particlePts);
  particles.list = []; particles.MAX = MAXP; particles.pos = ppos; particles.col = pcol; particles.geo = pg;

  heldGroup = new THREE.Group(); camera.add(heldGroup); scene.add(camera);
  ambient = new THREE.AmbientLight(0xffffff, .55); scene.add(ambient);
  sunLight = new THREE.DirectionalLight(0xffffff, .85); scene.add(sunLight); scene.add(sunLight.target);
  window.addEventListener('resize', onResize);
  onResize();
}
function onResize() {
  if (!renderer) return;
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}

/* ------------------------------------------------------------ partículas */
const particles = {
  list: [], MAX: 600, pos: null, col: null, geo: null,
  spawn(x, y, z, color, n, spread, life) {
    for (let i = 0; i < (n || 6); i++) {
      if (this.list.length >= this.MAX) this.list.shift();
      this.list.push({
        x, y, z, vx: (Math.random() - .5) * (spread || 3), vy: Math.random() * (spread || 3) * .8, vz: (Math.random() - .5) * (spread || 3),
        life: (life || .6) * (.6 + Math.random() * .7), c: color,
      });
    }
  },
  update(dt) {
    const g = this.geo; if (!g) return;
    const arr = this.pos, carr = this.col;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) { this.list.splice(i, 1); continue; }
      p.vy -= 14 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (world.isSolid(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z))) { p.y = Math.floor(p.y) + 1.001; p.vy = Math.abs(p.vy) * .28; p.vx *= .55; p.vz *= .55; }
    }
    for (let i = 0; i < this.MAX; i++) {
      const p = this.list[i];
      if (p) { arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z; const c = p.c; carr[i * 3] = ((c >> 16) & 255) / 255; carr[i * 3 + 1] = ((c >> 8) & 255) / 255; carr[i * 3 + 2] = (c & 255) / 255; }
      else { arr[i * 3 + 1] = -9999; }
    }
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
  },
};
function blockColorOf(id) {
  const d = DEFS[id]; if (!d || !d.tiles) return 0x888888;
  const t = d.tiles.top !== undefined ? d.tiles.top : d.tiles.side;
  const col = t % ATLAS_COLS, row = (t / ATLAS_COLS) | 0;
  const g = ATLAS.canvas.getContext('2d');
  try {
    const px = g.getImageData(col * TILE + 4, row * TILE + 4, 6, 6).data;
    let r = 0, gg = 0, b = 0, n = 0;
    for (let i = 0; i < px.length; i += 4) { if (px[i + 3] < 40) continue; r += px[i]; gg += px[i + 1]; b += px[i + 2]; n++; }
    if (!n) return 0x888888;
    return ((r / n) << 16 | (gg / n) << 8 | (b / n)) >>> 0;
  } catch (e) { return 0x888888; }
}

/* ------------------------------------------------- gestão de chunks/meshes */
const genQueue = [];
function chunkDist2(cx, cz, px, pz) { const dx = cx - px, dz = cz - pz; return dx * dx + dz * dz; }
function updateChunks(budget) {
  const px = Math.floor(Player.pos.x / CH), pz = Math.floor(Player.pos.z / CH), RD = Game.rd;
  const want = [], pre = [];
  /* gerar com dois chunks de folga: assim o chão já existe antes de você
     chegar na beira e não aparece aquele buraco embaixo da terra */
  for (let dz = -RD - 3; dz <= RD + 3; dz++) for (let dx = -RD - 3; dx <= RD + 3; dx++) {
    const q = dx * dx + dz * dz;
    if (q > (RD + 3.2) * (RD + 3.2) || q <= (RD + 1.2) * (RD + 1.2)) continue;
    pre.push([px + dx, pz + dz, q]);
  }
  for (let dz = -RD - 1; dz <= RD + 1; dz++) for (let dx = -RD - 1; dx <= RD + 1; dx++) {
    if (dx * dx + dz * dz > (RD + 1.2) * (RD + 1.2)) continue;
    want.push([px + dx, pz + dz, dx * dx + dz * dz]);
  }
  want.sort((a, b) => a[2] - b[2]);
  pre.sort((a, b) => a[2] - b[2]);
  let made = 0, meshed = 0;
  /* quem gera mundo pesado não pode derrubar o quadro: quando o fps cai,
     fazemos menos chunks por vez em vez de travar tudo */
  const slow = (Game.lastMs || 0) > 21;
  const BUD = budget || (slow ? { gen: 1, mesh: 1 } : { gen: 2, mesh: 3 });
  const genRing = want.concat(pre);
  for (const [cx, cz] of genRing) {
    const ex = world.chunks.get(ckey(cx, cz));
    if (ex && ex.gen) continue;
    if (made >= BUD.gen) break;
    world.chunk(cx, cz); made++;
  }
  for (const [cx, cz] of want) {
    const c = world.chunks.get(ckey(cx, cz));
    if (!c || !c.gen || !c.dirty) continue;
    /* só fecha a malha quando os 4 vizinhos existem: luz e faceamento corretos na borda */
    const ready = world.chunks.has(ckey(cx - 1, cz)) && world.chunks.has(ckey(cx + 1, cz)) && world.chunks.has(ckey(cx, cz - 1)) && world.chunks.has(ckey(cx, cz + 1));
    if (!ready) continue;
    if (meshed++ > BUD.mesh) continue;
    if (c.lightDirty) relight(c);
    meshChunk(c);
  }
  for (const c of world.chunks.values()) {
    const d = Math.max(Math.abs(c.cx - px), Math.abs(c.cz - pz));
    if (d > RD + 4) disposeChunk(c);
  }
}
function disposeChunk(c) {
  if (c.mesh) { chunkGroup.remove(c.mesh); c.mesh.geometry.dispose(); c.mesh = null; }
  if (c.wmesh) { chunkGroup.remove(c.wmesh); c.wmesh.geometry.dispose(); c.wmesh = null; }
  world.chunks.delete(ckey(c.cx, c.cz));
}
/* Sonda de render: desenha um triângulo com o material dos chunks para uma
   textura de 1×1 e lê o pixel. Se o shader não compilar ou o atlas vier
   vazio, o mundo aparece sem blocos e sem erro visível — isto avisa antes. */
function gpuProbe() {
  try {
    const rt = new THREE.WebGLRenderTarget(8, 8, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    const sc = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    cam.position.z = 2;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, .5, 1, -1, .5, 1, 1, .5, -1, 1, .5], 3));
    const tl = DEFS[B.stone] ? DEFS[B.stone].tiles.side : 0, [au0, av0, au1, av1] = tileUV(tl);
    g.setAttribute('uv', new THREE.Float32BufferAttribute([au0, av0, au1, av0, au1, av1, au0, av1], 2));
    g.setAttribute('aLight', new THREE.Float32BufferAttribute([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    sc.add(new THREE.Mesh(g, solidMat));
    const oldRT = renderer.getRenderTarget ? renderer.getRenderTarget() : null;
    const oldClear = new THREE.Color(); renderer.getClearColor(oldClear);
    renderer.setClearColor(0x000000, 1);
    renderer.setRenderTarget(rt);
    renderer.render(sc, cam);
    const buf = new Uint8Array(8 * 8 * 4);
    renderer.readRenderTargetPixels(rt, 0, 0, 8, 8, buf);
    renderer.setRenderTarget(oldRT);
    renderer.setClearColor(oldClear, 1);
    let lit = 0;
    for (let i = 0; i < buf.length; i += 4) if (buf[i] + buf[i + 1] + buf[i + 2] > 24) lit++;
    g.dispose();
    if (rt.texture && rt.texture.dispose) rt.texture.dispose();
    if (rt.dispose) rt.dispose();
    if (lit < 4) {
      console.warn('[cubia] sonda de GPU: o material dos chunks não produziu pixel', lit);
      fail('O navegador não conseguiu desenhar os blocos: o shader dos chunks ou a textura do atlas falharam no WebGL desta placa/navegador. Recarregue a página; se continuar, teste em outro navegador com aceleração de hardware ligada.');
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[cubia] sonda indisponível:', e && e.message);
    return true;   /* sem sonda, segue o jogo */
  }
}

function makeGeo(a, b, c2, d, count) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(b, 2));
  g.setAttribute('aLight', new THREE.Float32BufferAttribute(c2, 3));
  g.setIndex(d);
  g.computeBoundingSphere();
  return g;
}
function meshChunk(ch) {
  const o = buildMesh(ch);
  ch.dirty = false;
  const ox = ch.cx * CH, oz = ch.cz * CH;
  if (o.pos.length) {
    const g = makeGeo(o.pos, o.uv, o.lig, o.ind);
    g.translate(ox, 0, oz);
    if (ch.mesh) { ch.mesh.geometry.dispose(); ch.mesh.geometry = g; } else { ch.mesh = new THREE.Mesh(g, solidMat); chunkGroup.add(ch.mesh); }
  } else if (ch.mesh) { chunkGroup.remove(ch.mesh); ch.mesh.geometry.dispose(); ch.mesh = null; }
  if (o.wpos.length) {
    const g2 = makeGeo(o.wpos, o.wuv, o.wlig, o.wind);
    g2.translate(ox, 0, oz);
    if (ch.wmesh) { ch.wmesh.geometry.dispose(); ch.wmesh.geometry = g2; } else { ch.wmesh = new THREE.Mesh(g2, waterMat); chunkGroup.add(ch.wmesh); }
  } else if (ch.wmesh) { chunkGroup.remove(ch.wmesh); ch.wmesh.geometry.dispose(); ch.wmesh = null; }
}
function markAllDirty() { for (const c of world.chunks.values()) if (c.gen) c.dirty = true; }

/* ------------------------------------------------------------- céu/tempo */
function updateSky(dt) {
  const ang = Game.time * TAU;                 // 0 = meio-dia
  const elev = Math.cos(ang) * .95, sunDir = new THREE.Vector3(Math.sin(ang) * .5, elev, Math.cos(ang) * .35).normalize();
  const day = clamp(elev * 2.6 + .25, 0, 1);
  Game.skyMul = day;
  const dusk = clamp(1 - Math.abs(elev) * 4.5, 0, 1);
  const top = new THREE.Color().setHex(0x1a2b52).lerp(new THREE.Color(0x2f6fd0), day);
  const bot = new THREE.Color().setHex(0x101830).lerp(new THREE.Color(0xa9d3ff), day).lerp(new THREE.Color(0xffb066), dusk * .55);
  const fog = new THREE.Color().setHex(0x0e1526).lerp(new THREE.Color(0x9ec9ff), day).lerp(new THREE.Color(0xff9d5c), dusk * .5);
  skyMesh.material.uniforms.uTop.value.copy(top);
  skyMesh.material.uniforms.uBot.value.copy(bot);
  skyMesh.material.uniforms.uHor.value.copy(new THREE.Color(0xffd39b).lerp(new THREE.Color(0x2b3a66), 1 - day));
  skyMesh.material.uniforms.uNight.value = 1 - day;
  skyMesh.material.uniforms.uSun.value.copy(sunDir);
  skyMesh.position.copy(camera.position);
  starPts.material.opacity = clamp(1 - day * 2.2, 0, .95);
  starPts.position.copy(camera.position); starPts.rotation.y = Game.time * TAU * .2;
  sunMesh.position.copy(camera.position).add(sunDir.clone().multiplyScalar(520));
  moonMesh.position.copy(camera.position).add(sunDir.clone().multiplyScalar(-520));
  sunMesh.lookAt(camera.position); moonMesh.lookAt(camera.position);
  cloudMesh.position.set(camera.position.x, WH + 26, camera.position.z);
  cloudMesh.material.map.offset.x = Game.t * .0022;
  cloudMesh.material.map.offset.y = Game.t * .0009;
  cloudMesh.material.opacity = .18 + day * .42;
  if (ambient) {
    ambient.intensity = .24 + day * .5; sunLight.intensity = .12 + day * .8;
    sunLight.color.setHex(0xfff2d8).lerp(new THREE.Color(0x7f96d8), 1 - day);
    sunLight.position.copy(camera.position).add(sunDir.clone().multiplyScalar(120));
    sunLight.target.position.copy(camera.position); sunLight.target.updateMatrixWorld();
  }
  renderer.setClearColor(fog);
  scene.fog.color.copy(fog);
  scene.fog.near = Game.rd * CH * .42; scene.fog.far = Game.rd * CH * 1.06;
  const skyCol = new THREE.Color().setHex(0xffffff).lerp(new THREE.Color(0x7f96d8), 1 - day).lerp(new THREE.Color(0xffb877), dusk * .4);
  for (const m of [solidMat, waterMat]) {
    m.uniforms.uDay.value = .16 + day * .92;
    m.uniforms.uSky.value.copy(skyCol);
    m.uniforms.uBlk.value.setHex(0xffb46a);
    m.uniforms.uTime.value = Game.t;
    m.uniforms.fogColor.value.copy(fog);
    m.uniforms.fogNear.value = scene.fog.near; m.uniforms.fogFar.value = scene.fog.far;
  }
}
