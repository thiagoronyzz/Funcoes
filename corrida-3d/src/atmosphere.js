/* atmosphere.js — sol, céu com gradiente, luz e nuvens. */
import * as THREE from '../lib/three.module.js';
import { mulberry32 } from './noise.js';

export const SUN_DIR = new THREE.Vector3(0.55, 0.16, 0.28).normalize();

export function createSky(scene, fog) {
  const sunColor = new THREE.Color('#ffd9a0');
  const skyTop = new THREE.Color('#3f7cc2');
  const skyMid = new THREE.Color('#a8cfe8');
  const skyHor = new THREE.Color('#f2c08a');
  const groundCol = new THREE.Color('#9aa186');

  const uniforms = {
    sunDir: { value: SUN_DIR.clone() },
    skyTop: { value: skyTop },
    skyMid: { value: skyMid },
    skyHor: { value: skyHor },
    groundCol: { value: groundCol },
    sunColor: { value: sunColor },
    uTime: { value: 0 },
  };

  const domeGeo = new THREE.SphereGeometry(5600, 40, 20);
  const domeMat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vDir;
      void main(){
        vDir = normalize(position);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_Position.z = gl_Position.w * 0.9999;
      }`,
    fragmentShader: `
      uniform vec3 sunDir; uniform vec3 skyTop; uniform vec3 skyMid; uniform vec3 skyHor;
      uniform vec3 groundCol; uniform vec3 sunColor; uniform float uTime;
      varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -1.0, 1.0);
        vec3 col;
        float s = smoothstep(0.02, 0.30, h);
        float horizonBand = pow(1.0 - abs(h), 3.0);
        col = mix(skyHor, skyTop, s);
        col = mix(col, skyMid, pow(1.0 - abs(h), 1.2) * 0.35);
        if (h < 0.0) col = mix(skyHor, groundCol, clamp(-h * 6.0, 0.0, 1.0) * 0.75);
        // sol
        float sd = dot(d, sunDir);
        float disc = smoothstep(0.9994, 0.9998, sd);
        float glow = pow(max(sd, 0.0), 700.0) * 0.9;
        float halo = pow(max(sd, 0.0), 6.0) * 0.45;
        col += sunColor * (disc * 4.0 + glow + halo * 0.9);
        // brilho ao redor do sol sobre o horizonte
        col += sunColor * 0.12 * exp(-max(sd, 0.0) * 2.2) * (0.5 + 0.5 * d.y);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });

  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.frustumCulled = false;
  dome.renderOrder = -10;

  /* -------- luzes -------- */
  const sun = new THREE.DirectionalLight(sunColor, 2.6);
  sun.position.copy(SUN_DIR).multiplyScalar(900);
  sun.castShadow = true;
  const S = 1200;
  sun.shadow.camera.left = -S; sun.shadow.camera.right = S;
  sun.shadow.camera.top = S; sun.shadow.camera.bottom = -S;
  sun.shadow.camera.near = 100; sun.shadow.camera.far = 3000;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.9;

  const hemi = new THREE.HemisphereLight(new THREE.Color('#cfe4f2'), new THREE.Color('#5c6848'), 0.85);

  return { dome, domeMat, sun, hemi, sunColor };
}

/* ------------------------------ nuvens ------------------------------ */

export function createClouds(scene, fog) {
  const rand = mulberry32(7331);
  const WIND = 7;
  const N = 260;
  const positions = new Float32Array(N * 3);
  const sizes = new Float32Array(N);
  const alphas = new Float32Array(N);
  const centerR = 1000;
  for (let i = 0; i < N; i++) {
    const ang = rand() * Math.PI * 2;
    const r = 250 + rand() * centerR;
    const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
    const y = 260 + rand() * 380;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    sizes[i] = 140 + rand() * 420;
    alphas[i] = 0.25 + rand() * 0.5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.92)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      tex: { value: tex },
      uWind: { value: 0 },
      fogColor: { value: fog ? fog.color : new THREE.Color() },
      fogNear: { value: fog ? fog.near : 1000 },
      fogFar: { value: fog ? fog.far : 5000 },
      cameraPos: { value: new THREE.Vector3() },
      sunDir: { value: SUN_DIR.clone() },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    vertexShader: `
      attribute float aSize; attribute float aAlpha;
      uniform float uWind; uniform vec3 cameraPos;
      varying float vA; varying float vFog; varying float vLit;
      void main(){
        vec4 wpos = modelMatrix * vec4(position, 1.0);
        wpos.x += uWind;
        vec4 mv = viewMatrix * wpos;
        float dist = length(mv.xyz);
        gl_PointSize = aSize * (420.0 / max(dist, 1.0));
        gl_Position = projectionMatrix * mv;
        vA = aAlpha;
        vFog = clamp((dist - 700.0) / 2600.0, 0.0, 1.0);
        vLit = 0.75 + 0.25 * clamp(dot(normalize(wpos.xyz - cameraPos), vec3(0.55, 0.16, 0.28)), 0.0, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D tex; uniform vec3 fogColor; uniform float fogNear; uniform float fogFar;
      varying float vA; varying float vFog; varying float vLit;
      void main(){
        vec2 uv = gl_PointCoord;
        float a = texture2D(tex, uv).a;
        if (a < 0.03) discard;
        vec3 base = mix(vec3(1.0), vec3(1.0, 0.95, 0.86), 0.25);
        vec3 col = base * vLit;
        col = mix(col, fogColor, vFog);
        gl_FragColor = vec4(col, a * vA * (1.0 - vFog * 0.85));
      }`,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.position.y = 0;
  const wrap = 1900;
  return {
    points,
    update(dt, cameraPos, time) {
      mat.uniforms.uWind.value += dt * WIND;
      const off = mat.uniforms.uWind.value;
      if (off > wrap) mat.uniforms.uWind.value -= wrap;
      mat.uniforms.cameraPos.value.copy(cameraPos);
    },
  };
}
