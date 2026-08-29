/* ambiente mínimo (DOM + canvas + three.js) para exercitar a lógica do jogo no node */
const vm = require('vm');
const fs = require('fs');

function mkEl(tag, id) {
  const el = {
    tagName: (tag || 'div').toUpperCase(), id: id || '', _html: '', textContent: '', title: '',
    style: new Proxy({}, { get: (t, k) => (k === 'setProperty' ? () => {} : t[k] || ''), set: (t, k, v) => ((t[k] = v), true) }),
    dataset: {}, children: [], listeners: {}, value: '', checked: false, disabled: false,
    width: 0, height: 0, parentElement: null, firstChild: null, _parentFallback: null, offsetWidth: 100, offsetHeight: 100,
  };
  el.classList = {
    _s: new Set(),
    add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
    toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); },
    contains(c) { return this._s.has(c); },
  };
  Object.defineProperty(el, 'innerHTML', { get() { return el._html; }, set(v) { el._html = String(v); el.children = []; } });
  Object.defineProperty(el, 'parentElement', { get() { return el._parent || (el._parentFallback || (el._parentFallback = mkEl('div', 'fake-parent'))); }, set(v) { el._parent = v; } });
  Object.defineProperty(el, 'lastChild', { get() { return el.children[el.children.length - 1] || null; } });
  el.appendChild = (c) => { el.children.push(c); c.parentElement = el; el.firstChild = el.children[0]; return c; };
  el.removeChild = (c) => { const i = el.children.indexOf(c); if (i >= 0) el.children.splice(i, 1); return c; };
  el.remove = () => { if (el.parentElement) el.parentElement.removeChild(el); };
  el.addEventListener = (t, f) => { (el.listeners[t] = el.listeners[t] || []).push(f); };
  el.removeEventListener = () => {};
  el.dispatch = (t, ev) => (el.listeners[t] || []).forEach((f) => f(ev || { preventDefault() {}, stopPropagation() {} }));
  const matches = (c, sel) => {
    if (sel[0] === '.') { const cls = sel.slice(1).replace(/\[.*$/, ''); return (c.className || '').split(/\s+/).indexOf(cls) >= 0; }
    if (sel[0] === '#') return c.id === sel.slice(1);
    return c.tagName === sel.toUpperCase();
  };
  el.querySelector = (sel) => el.children.find((c) => matches(c, sel)) || null;
  el.querySelectorAll = (sel) => el.children.filter((c) => matches(c, sel.split(',')[0].trim()));

  el.closest = () => null;
  el.contains = () => false;
  el.setAttribute = () => {}; el.getAttribute = () => null;
  el.focus = () => {}; el.blur = () => {}; el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 });
  el.getContext = () => ctx2d();
  el.toDataURL = () => 'data:,';
  el.insertBefore = (a) => { el.children.push(a); return a; };
  el.setPointerCapture = () => {};
  el.requestPointerLock = () => {};
  el.scrollIntoView = () => {};
  return el;
}
function ctx2d() {
  const noop = () => {};
  return {
    imageSmoothingEnabled: false, globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1,
    fillRect: noop, clearRect: noop, strokeRect: noop, beginPath: noop, rect: noop, clip: noop, save: noop, restore: noop,
    translate: noop, rotate: noop, scale: noop, moveTo: noop, lineTo: noop, arc: noop, stroke: noop, fill: noop,
    drawImage: noop, fillText: noop, setTransform: noop, closePath: noop,
    createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }),
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: noop,
    getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)).fill(128) }),
  };
}
function V(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; }
V.prototype = {
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; },
  setY(y) { this.y = y; return this; },
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; },
  clone() { return new V(this.x, this.y, this.z); },
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; },
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; },
  addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; },
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; },
  setScalar(v) { this.x = v; this.y = v; this.z = v; return this; },
  addScalar(v) { this.x += v; this.y += v; this.z += v; return this; },
  length() { return Math.hypot(this.x, this.y, this.z); },
  lengthSq() { return this.x * this.x + this.y * this.y + this.z * this.z; },
  normalize() { const l = this.length() || 1; return this.multiplyScalar(1 / l); },
  distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); },
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; },
  crossVectors(a, b) { this.x = a.y * b.z - a.z * b.y; this.y = a.z * b.x - a.x * b.z; this.z = a.x * b.y - a.y * b.x; return this; },
  negate() { this.x = -this.x; this.y = -this.y; this.z = -this.z; return this; },
  lerp(v, t) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; this.z += (v.z - this.z) * t; return this; },
  applyQuaternion(q) {
    const { x, y, z, w } = q, vx = this.x, vy = this.y, vz = this.z;
    const ix = w * vx + y * vz - z * vy, iy = w * vy + z * vx - x * vz, iz = w * vz + x * vy - y * vx, iw = -x * vx - y * vy - z * vz;
    this.x = ix * w + iw * -x + iy * -z - iz * -y;
    this.y = iy * w + iw * -y + iz * -x - ix * -z;
    this.z = iz * w + iw * -z + ix * -y - iy * -x;
    return this;
  },
};
function C(hex) { this.r = 1; this.g = 1; this.b = 1; if (hex !== undefined) this.setHex(hex); }
C.prototype = {
  setHex(h) { this.r = ((h >> 16) & 255) / 255; this.g = ((h >> 8) & 255) / 255; this.b = (h & 255) / 255; return this; },
  copy(c) { this.r = c.r; this.g = c.g; this.b = c.b; return this; },
  clone() { const c = new C(); return c.copy(this); },
  lerp(c, t) { this.r += (c.r - this.r) * t; this.g += (c.g - this.g) * t; this.b += (c.b - this.b) * t; return this; },
  getHex() { return (Math.round(this.r * 255) << 16) | (Math.round(this.g * 255) << 8) | Math.round(this.b * 255); },
};
function eulerQuat(yaw, pitch, roll) {
  const c1 = Math.cos(pitch / 2), c2 = Math.cos(yaw / 2), c3 = Math.cos(roll / 2);
  const s1 = Math.sin(pitch / 2), s2 = Math.sin(yaw / 2), s3 = Math.sin(roll / 2);
  return { x: s1 * c2 * c3 + c1 * s2 * s3, y: c1 * s2 * c3 - s1 * c2 * s3, z: c1 * c2 * s3 + s1 * s2 * c3, w: c1 * c2 * c3 - s1 * s2 * s3 };
}
function obj3d(kind) {
  const o = {
    kind, position: new V(), rotation: { x: 0, y: 0, z: 0, order: 'XYZ', set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } }, scale: new V(1, 1, 1), children: [],
    visible: true, userData: {}, parent: null, matrixAutoUpdate: true,
    add(o) { this.children.push(o); o.parent = this; return this; },
    remove(o) { const i = this.children.indexOf(o); if (i >= 0) this.children.splice(i, 1); return this; },
    traverse(f) { f(this); this.children.forEach((c) => c.traverse && c.traverse(f)); },
    lookAt() { return this; },
    updateMatrixWorld() {}, updateProjectionMatrix() {},
  };
  Object.defineProperty(o, 'quaternion', { get() { return eulerQuat(this.rotation.y, this.rotation.x, this.rotation.z); } });
  return o;
}
function makeTHREE() {
  const T = {};
  T.Vector3 = V; T.Color = C;
  T.Object3D = function () { return obj3d('object'); };
  T.Group = function () { return obj3d('group'); };
  T.Scene = function () { const o = obj3d('scene'); o.fog = null; return o; };
  T.Mesh = function (geo, mat) { const o = obj3d('mesh'); o.geometry = geo || {}; o.material = mat || {}; return o; };
  T.Points = function (geo, mat) { const o = obj3d('points'); o.geometry = geo; o.material = mat; return o; };
  T.LineSegments = function (geo, mat) { const o = obj3d('lines'); o.geometry = geo; o.material = mat; return o; };
  const geo = () => ({
    attributes: {}, index: null, translate() { return this; }, computeBoundingSphere() {}, dispose() {},
    setAttribute(n, a) { this.attributes[n] = a; return this; }, setIndex(a) { this.index = Array.isArray(a) ? { count: a.length, array: a } : a; return this; },
    applyMatrix4() { return this; },
  });
  T.BufferGeometry = function () { return geo(); };
  T.BoxGeometry = T.PlaneGeometry = T.SphereGeometry = T.CircleGeometry = T.ConeGeometry = function () { return geo(); };
  T.EdgesGeometry = function () { return geo(); };
  T.BufferAttribute = function (arr, n) { return { array: arr, itemSize: n, count: arr.length / n, needsUpdate: false, setUsage() { return this; } }; };
  T.Float32BufferAttribute = function (arr, n) { return { array: arr, itemSize: n, count: arr.length / n, needsUpdate: false, setUsage() { return this; } }; };
  T.Uint32BufferAttribute = T.Uint16BufferAttribute = function (arr, n) { return { array: arr, itemSize: n || 1, count: (arr.length / (n || 1)) | 0 }; };
  const mat = (o) => Object.assign({ dispose() {}, needsUpdate: false }, o || {});
  T.MeshBasicMaterial = T.MeshLambertMaterial = T.MeshStandardMaterial = function (o) { const m = mat(o); m.color = new C(o && o.color !== undefined ? o.color : 0xffffff); return m; };
  T.PointsMaterial = T.LineBasicMaterial = function (o) { const m = mat(o); m.color = new C(o && o.color !== undefined ? o.color : 0xffffff); return m; };
  T.ShaderMaterial = function (o) { const m = mat(o); m.uniforms = (o && o.uniforms) || {}; m.defines = (o && o.defines) || {}; return m; };
  T.CanvasTexture = function (cv) { return { image: cv, offset: { x: 0, y: 0, set(a, b) { this.x = a; this.y = b; } }, repeat: { x: 1, y: 1, set(a, b) { this.x = a; this.y = b; } }, needsUpdate: false, dispose() {}, wrapping: 0 }; };
  T.Texture = T.CanvasTexture;
  T.Fog = function (c, n, f) { return { color: new C(c), near: n, far: f }; };
  T.FogExp2 = T.Fog;
  T.AmbientLight = function (c, i) { return { color: new C(c), intensity: i }; };
  T.DirectionalLight = function (c, i) { const o = { color: new C(c), intensity: i, position: new V() }; o.target = obj3d('target'); return o; };
  T.PerspectiveCamera = function () { const o = obj3d('camera'); o.fov = 75; o.aspect = 1; o.near = .1; o.far = 1000; return o; };
  Object.defineProperty(T.PerspectiveCamera.prototype || {}, 'quaternion', {});
  T.WebGLRenderer = function (o) {
    const r = { domElement: (o && o.canvas) || {}, outputEncoding: 0, shadowMap: { enabled: false }, capabilities: { isWebGL2: true } };
    r.setSize = () => {}; r.setPixelRatio = () => {}; r.setClearColor = () => {}; r.render = () => { r.frames = (r.frames || 0) + 1; };
    r.dispose = () => {}; r.info = { render: { triangles: 0, calls: 0 } };
    return r;
  };
  ['NearestFilter', 'NearestMipmapNearestFilter', 'LinearFilter', 'RGBAFormat', 'ClampToEdgeWrapping', 'RepeatWrapping',
    'FrontSide', 'BackSide', 'DoubleSide', 'DynamicDrawUsage', 'sRGBEncoding', 'SRGBColorSpace', 'AdditiveBlending', 'NormalBlending'].forEach((k, i) => { T[k] = i + 1; });
  T.UniformsUtils = { clone: (u) => JSON.parse(JSON.stringify(u)) };
  return T;
}
function makeDom() {
  const els = new Map();
  const get = (id) => { if (!els.has(id)) els.set(id, mkEl(id === 'gl' ? 'canvas' : 'div', id)); return els.get(id); };
  const documentStub = {
    getElementById: get,
    createElement: (t) => mkEl(t),
    body: mkEl('body'), head: mkEl('head'), documentElement: mkEl('html'),
    pointerLockElement: null,
    addEventListener: (t, f) => { (documentStub._l = documentStub._l || {})[t] = (documentStub._l[t] || []).concat(f); },
    removeEventListener: () => {}, exitPointerLock: () => {},
    querySelector: () => null, querySelectorAll: () => [],
  };
  return documentStub;
}
function run(code, opts) {
  const THREE = makeTHREE();
  const win = { THREE, __cubiaThree: THREE, devicePixelRatio: 1, innerWidth: 1600, innerHeight: 900 };
  const sandbox = {
    window: win, THREE, console, performance: { now: () => Date.now() },
    requestAnimationFrame: (cb) => { win.__raf = cb; return 1; },
    cancelAnimationFrame: () => {}, setTimeout: (f, ms) => { win.__timers = (win.__timers || 0) + 1; return 0; },
    clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
    localStorage: (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m }; })(),
    document: makeDom(), addEventListener: (t, f) => { (win._l = win._l || {})[t] = (win._l[t] || []).concat(f); },
    removeEventListener: () => {}, navigator: { userAgent: 'node' },
    Math, Date, JSON, Object, Array, Number, String, Set, Map, Float32Array, Uint8Array, Uint16Array, Uint32Array, Int32Array, Infinity, NaN,
  };
  sandbox.globalThis = sandbox;
  Object.assign(sandbox, { innerWidth: 1600, innerHeight: 900, devicePixelRatio: 1 });
  Object.defineProperty(win, 'document', { value: sandbox.document });
  Object.assign(win, { localStorage: sandbox.localStorage, addEventListener: sandbox.addEventListener, requestAnimationFrame: sandbox.requestAnimationFrame });
  vm.createContext(sandbox);
  const script = new vm.Script(code, { filename: 'craft-inline.js' });
  script.runInContext(sandbox);
  if (win.__cubiaMain) win.__cubiaMain();
  return { win, sandbox, THREE };
}
module.exports = { run, mkEl, makeTHREE, makeDom, V, C };
