/* Smoke test sem navegador: monta o mundo completo em CPU pura (WebGL ausente). */
const ctxStub = new Proxy({}, {
  get(_t, prop) {
    if (prop === 'createRadialGradient' || prop === 'createLinearGradient') {
      return () => ({ addColorStop() {} });
    }
    if (prop === 'measureText') return () => ({ width: 0 });
    return () => 0;
  },
  set() { return true; },
});
globalThis.document = {
  createElement() { return { width: 128, height: 128, getContext: () => ctxStub }; },
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
};
globalThis.window = globalThis;
globalThis.performance = globalThis.performance || { now: () => Date.now() };

const t0 = Date.now();
const { createWorld } = await import('../src/world.js');
const { createNature, createGrassField, makeWindyMaterial } = await import('../src/nature.js');
const { createSky, createClouds } = await import('../src/atmosphere.js');
const { createTraffic } = await import('../src/traffic.js');
const { createPeople } = await import('../src/people.js');
const { createEffects } = await import('../src/effects.js');
const { createObstacles } = await import('../src/obstacles.js');
const { createCar, createTrafficCar } = await import('../src/vehicle.js');
const { createAudio } = await import('../src/audio.js');

async function build() {
  const THREE = (await import('../lib/three.module.js')).default ?? await import('../lib/three.module.js');
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf3d9b4, 150, 1900);

  const world = createWorld(scene, 'media');
  console.log('mundo: estrada', (world.road.length / 1000).toFixed(2) + ' km, pontos', world.road.count);
  const P0 = world.road.getPointAt(0);
  console.log('P0', P0.x.toFixed(1), P0.y.toFixed(1), P0.z.toFixed(1));
  console.log('heightAt(0,0) =', world.heightAt(0, 0).toFixed(2));
  console.log('heightAt(lago) =', world.heightAt(world.lakeCenter.x, world.lakeCenter.z).toFixed(2), '(água', world.waterLevel + ')');
  const n = world.normalAt(P0.x, P0.z);
  console.log('normal', n.x.toFixed(2), n.y.toFixed(2), n.z.toFixed(2));

  const nature_ = createNature(scene, world, {});
  const grass_ = createGrassField(scene, world);
  const sky = createSky(scene, scene.fog);
  const clouds_ = createClouds(scene, scene.fog);
  const traffic_ = createTraffic(world, { count: 10, scene });
  const people_ = createPeople(scene, world, { count: 40 });
  const obstacles_ = createObstacles(scene, world);
  const effects_ = createEffects(scene);
  effects_.setWorld(world.heightAt);
  const car = createCar(0xd02020);

  const t1 = Date.now();
  console.log('build ms', t1 - t0, '| natureza items', nature_ ? 'ok' : 'no', '| pessoas', people_.persons.length, '| cachorros', people_.dogs.length, '| obstáculos', obstacles_.items.length, '| tráfego', traffic_.cars.length);
  console.log('colisores estáticos:', world.colliders.items.length);

  // simula 8 segundos de jogo: tráfego avança
  const dt = 1 / 60;
  for (let s = 0; s < 8 * 60; s++) {
    traffic_.update(dt, s * dt, { pos: { x: 0, z: 0 }, speed: 0, i: 0, lat: 0 });
  }
  console.log('tráfego ainda ok, carro0 pos', traffic_.cars[0].group.position.x.toFixed(1), traffic_.cars[0].group.position.y.toFixed(1));

  // pessoas atualizam
  const playerSim = { pos: { x: 0, z: 0 }, speed: 30 };
  people_.update(dt, 1, playerSim);
  console.log('pessoas update ok');

  // obstáculos: derruba um cone
  const cone = obstacles_.items.find((o) => o.kind === 'cone' && o.state === 'rest');
  if (cone) {
    obstacles_.knock(cone, cone.x, cone.z, 1, 0, 2.2);
    for (let i = 0; i < 300; i++) obstacles_.update(dt);
    console.log('cone derrubado → estado', cone.state, 'em', cone.x.toFixed(1), cone.z.toFixed(1));
  }

  // efeitos
  effects_.dust(0, 1, 0, 3, 1, 1);
  effects_.splash(2, 1, 0, 1, 0, 1);
  effects_.sparks(1, 1, 1);
  effects_.skid(3, 3, 1.2, 0.2, 1);
  for (let i = 0; i < 60; i++) effects_.update(dt);
  console.log('efeitos ok');
  console.log('TUDO OK em', Date.now() - t0, 'ms');
}
build().catch((e) => { console.error('FALHA:', e && e.stack || e); process.exit(1); });
