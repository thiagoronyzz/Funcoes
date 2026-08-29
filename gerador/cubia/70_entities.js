
/* ================================== ENTIDADES: DROPS, SETAS, MOBS, PARTÍCULAS */
const drops = [], arrows = [];
function spawnDrop(x, y, z, id, n, vel, ench, dur) {
  if (n <= 0) return;
  const def = DEFS[id] || DEFS[0];
  const bd = def.block !== undefined ? DEFS[def.block] : def;
  const tile = (bd.tiles && bd.tiles.top !== undefined) ? bd.tiles.top : def.icon;
  const isBlock = def.kind === 'block' || def.kind === 'blockitem';
  const m = new THREE.Mesh(isBlock ? new THREE.BoxGeometry(.3, .3, .3) : new THREE.PlaneGeometry(.36, .36),
    new THREE.MeshLambertMaterial({ map: tileTexture(tile), side: isBlock ? THREE.FrontSide : THREE.DoubleSide, alphaTest: .5 }));
  m.position.set(x, y, z);
  scene.add(m);
  drops.push({ mesh: m, id, n: n, ench, dur, vx: vel ? vel.x : (Math.random() - .5) * 2, vy: vel ? vel.y + 2.2 : 2.4, vz: vel ? vel.z : (Math.random() - .5) * 2, t: 0, pickup: .55 });
}
function updateDrops(dt) {
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.t += dt;
    d.vy -= 18 * dt;
    const nx = d.mesh.position.x + d.vx * dt, ny = d.mesh.position.y + d.vy * dt, nz = d.mesh.position.z + d.vz * dt;
    if (world.isSolid(Math.floor(nx), Math.floor(d.mesh.position.y), Math.floor(nz))) { d.vx *= .5; d.vz *= .5; } else { d.mesh.position.x = nx; d.mesh.position.z = nz; }
    if (world.isSolid(Math.floor(d.mesh.position.x), Math.floor(ny), Math.floor(d.mesh.position.z))) {
      if (d.vy < 0) { d.vy = 0; d.vx *= .72; d.vz *= .72; } else d.vy = 0;
    } else d.mesh.position.y = ny;
    d.mesh.rotation.y += dt * 1.6;
    d.mesh.position.y += Math.sin(d.t * 3) * .0012;
    const dist = d.mesh.position.distanceTo(Player.pos);
    if (d.t > .55 && dist < 2.4) {
      const pull = d.mesh.position.clone().sub(Player.pos).multiplyScalar(-dt * 7.5);
      d.mesh.position.add(pull);
    }
    if (Game.mode !== 'spectator' && !Player.dead && d.t > .5 && dist < 1) {
      const left = INV.addFull({ id: d.id, n: d.n, dur: d.dur, ench: d.ench });
      if (left <= 0) { drops.splice(i, 1); scene.remove(d.mesh); d.mesh.geometry.dispose(); Sound.pickup(); UI.syncHotbar(); Adv.check(); continue; }
      d.n = left;
    }
    if (d.t > 260) { scene.remove(d.mesh); d.mesh.geometry.dispose(); drops.splice(i, 1); }
  }
}
function spawnArrow(x, y, z, vel, dmg, fromPlayer) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(.08, .08, .6), new THREE.MeshBasicMaterial({ color: fromPlayer ? 0xe8eef6 : 0xd8d8dd }));
  m.position.set(x, y, z);
  m.lookAt(m.position.clone().add(vel));
  scene.add(m);
  arrows.push({ mesh: m, vel, dmg, life: 14, fromPlayer });
}
function updateArrows(dt) {
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    a.life -= dt;
    a.vel.y -= 18 * dt;
    const step = a.vel.clone().multiplyScalar(dt);
    a.mesh.position.add(step);
    a.mesh.lookAt(a.mesh.position.clone().add(a.vel));
    let hit = false;
    if (world.isSolid(Math.floor(a.mesh.position.x), Math.floor(a.mesh.position.y), Math.floor(a.mesh.position.z))) hit = true;
    if (!a.fromPlayer) {
      const p = Player.pos;
      if (a.mesh.position.distanceTo(new THREE.Vector3(p.x, p.y + .9, p.z)) < .8) { damage(a.dmg, 'arrow', { knock: true }); hit = true; }
    } else {
      for (const m of Mobs.list) {
        if (m.dead || m.type === 'enderman' && false) continue;
        if (a.mesh.position.distanceTo(new THREE.Vector3(m.pos.x, m.pos.y + m.def.h * .5, m.pos.z)) < m.def.w * 1.1) { m.hurt(a.dmg, false, null); hit = true; break; }
      }
    }
    if (hit || a.life <= 0 || a.mesh.position.y < -10) {
      scene.remove(a.mesh); a.mesh.geometry.dispose(); arrows.splice(i, 1);
      if (hit && Math.random() < .4 && !a.fromPlayer) toast('Você levou uma flechada!', 'bad');
    }
  }
}

/* ------------------------------------------------------------------ mobs */
const MOBDEF = {
  zombie: { label: 'Zumbi', hp: 20, spd: 2.5, dmg: 3.2, w: .6, h: 1.9, hostile: true, burn: true, xp: 5, drop: [['rotten', 1, .8]], color: 0x3d7a55 },
  skeleton: { label: 'Esqueleto', hp: 16, spd: 2.2, dmg: 4.5, w: .6, h: 1.95, hostile: true, ranged: true, burn: true, xp: 5, drop: [['bone', 1, .7], ['arrow', 2, .6]], color: 0xdfe3ea },
  creeper: { label: 'Creeper', hp: 20, spd: 2.6, w: .6, h: 1.7, hostile: true, boom: 2.6, xp: 5, drop: [['gunpowder', 1, .9]], color: 0x4f9a3c },
  spider: { label: 'Aranha', hp: 16, spd: 3.4, dmg: 2.4, w: 1.3, h: .9, hostile: true, climb: true, dayNeutral: true, xp: 5, drop: [['string', 1, .8]], color: 0x4b3730 },
  enderman: { label: 'Enderman', hp: 40, spd: 3.2, dmg: 4.5, w: .6, h: 2.9, neutral: true, stare: true, xp: 10, drop: [['pearl', 1, .9]], color: 0x1a1a22 },
  wolf: { label: 'Lobo', hp: 18, spd: 3.1, dmg: 4, w: .6, h: .85, neutral: true, xp: 4, drop: [], color: 0x8f8f8f },
  cow: { label: 'Vaca', hp: 10, spd: 1.5, w: .9, h: 1.3, passive: true, breed: true, xp: 2, drop: [['beef', 1, 1], ['leather', 1, 1]], color: 0x4b3a2a },
  pig: { label: 'Porco', hp: 10, spd: 1.5, w: .9, h: .9, passive: true, breed: true, xp: 2, drop: [['pork', 1, 1]], color: 0xe89a9a },
  sheep: { label: 'Ovelha', hp: 8, spd: 1.5, w: .9, h: 1.3, passive: true, breed: true, xp: 2, drop: [['woolwhite', 1, 1]], color: 0xeceef2 },
  chicken: { label: 'Galinha', hp: 4, spd: 1.7, w: .4, h: .7, passive: true, breed: true, lays: true, xp: 1, drop: [['chickenm', 1, 1], ['feather', 2, .8]], color: 0xf0f0ee },
};
function buildMobColors(def) { const c = def.color; return [c, mixc(c, 0xffffff, .34), mixc(c, 0x000000, .38), 0x2f4f8f, 0xf0a028, 0xf2f4f8, 0x444444]; }
function buildMobMesh(def) {
  const g = new THREE.Group();
  const c = def.color, dark = mixc(c, 0x000000, .38), light = mixc(c, 0xffffff, .34);
  const parts = [];
  const box = (w, h, d2, col, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d2), new THREE.MeshLambertMaterial({ color: col }));
    m.position.set(x, y, z); g.add(m); parts.push(m); return m;
  };
  if (def === MOBDEF.creeper) {
    box(.55, 1.05, .35, c, 0, .95, 0); box(.44, .44, .44, light, 0, 1.6, 0);
    box(.18, .5, .18, dark, -.22, .25, .16); box(.18, .5, .18, dark, .22, .25, .16);
    box(.18, .5, .18, dark, -.22, .25, -.16); box(.18, .5, .18, dark, .22, .25, -.16);
  } else if (def === MOBDEF.spider) {
    box(.8, .4, .8, c, 0, .42, -.1); box(.44, .34, .44, dark, 0, .48, .48);
    for (let i = 0; i < 4; i++) { box(.62, .07, .07, dark, -.55, .34, -.3 + i * .22); box(.62, .07, .07, dark, .55, .34, -.3 + i * .22); }
  } else if (def === MOBDEF.chicken) {
    box(.36, .4, .46, c, 0, .38, 0); box(.24, .24, .24, light, 0, .7, .08);
    box(.3, .09, .09, 0xf0a028, 0, .28, -.16);
    box(.09, .22, .09, 0xf0a028, -.12, .1, 0); box(.09, .22, .09, 0xf0a028, .12, .1, 0);
  } else if (def === MOBDEF.enderman) {
    box(.5, 1.9, .28, c, 0, 1.5, 0); box(.38, .38, .38, dark, 0, 2.66, 0);
    box(.11, .09, .03, 0xc9a6ff, -.1, 2.7, -.2); box(.11, .09, .03, 0xc9a6ff, .1, 2.7, -.2);
    box(.12, 1.6, .12, c, -.31, 1.4, 0); box(.12, 1.6, .12, c, .31, 1.4, 0);
  } else if (def === MOBDEF.wolf) {
    box(.42, .5, 1, c, 0, .62, 0); box(.36, .34, .36, light, 0, .74, .6);
    box(.14, .42, .14, dark, -.16, .2, .32); box(.14, .42, .14, dark, .16, .2, .32);
    box(.14, .42, .14, dark, -.16, .2, -.32); box(.14, .42, .14, dark, .16, .2, -.32);
  } else if (def.passive) {
    box(.62, .72, 1.1, c, 0, .78, 0); box(.46, .44, .4, mixc(c, 0xffffff, .18), 0, .95, .66);
    box(.18, .5, .18, dark, -.22, .26, .34); box(.18, .5, .18, dark, .22, .26, .34);
    box(.18, .5, .18, dark, -.22, .26, -.34); box(.18, .5, .18, dark, .22, .26, -.34);
    if (def === MOBDEF.cow) { box(.1, .16, .1, 0xf2f2f2, -.15, 1.14, .8); box(.1, .16, .1, 0xf2f2f2, .15, 1.14, .8); }
    if (def === MOBDEF.sheep) box(.72, .82, 1.16, 0xf2f4f8, 0, .8, 0);
  } else {
    const body = def === MOBDEF.skeleton ? c : 0x2f4f8f;
    box(.55, .95, .32, body, 0, .98, 0);
    box(.44, .44, .44, def === MOBDEF.skeleton ? dark : c, 0, 1.7, 0);
    box(.14, .8, .14, body, -.36, 1.08, 0); box(.14, .8, .14, body, .36, 1.08, 0);
    box(.16, .55, .16, dark, -.15, .28, 0); box(.16, .55, .16, dark, .15, .28, 0);
    if (def === MOBDEF.skeleton) box(.06, .5, .06, 0x9c7b46, .42, 1.05, .2);
    else { box(.15, .15, .05, 0x14202e, -.11, 1.78, -.22); box(.15, .15, .05, 0x14202e, .11, 1.78, -.22); }
  }
  g.userData.parts = parts;
  return g;
}
function disposeGroup(g) {
  g.traverse((o) => { if (o.geometry && o.geometry.dispose) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });
}
function mobBlocked(x, y, z, w, h) {
  const hw = w * .5;
  const x0 = Math.floor(x - hw), x1 = Math.floor(x + hw), z0 = Math.floor(z - hw), z1 = Math.floor(z + hw);
  const y0 = Math.floor(y + .05), y1 = Math.floor(y + h - .02);
  for (let yy = y0; yy <= y1; yy++) for (let zz = z0; zz <= z1; zz++) for (let xx = x0; xx <= x1; xx++) if (world.isSolid(xx, yy, zz)) return true;
  return false;
}
function findGround(x, z, y0, y1) {
  for (let y = Math.min(WH - 3, y0); y > Math.max(1, y1); y--) {
    if (world.isSolid(x, y, z) && !world.isSolid(x, y + 1, z) && !world.isSolid(x, y + 2, z)) return y + 1;
    if (world.isSolid(x, y, z)) return -1;
  }
  return -1;
}
const Mobs = {
  list: [], spawnT: 0,
  make(type, x, y, z) {
    const def = MOBDEF[type];
    if (!def) return null;
    const m = {
      type, def, pos: new THREE.Vector3(x, y, z), vel: new THREE.Vector3(), hp: def.hp, dead: false, deathT: 0,
      mesh: buildMobMesh(def), yaw: Math.random() * TAU, think: Math.random(), state: 'idle',
      onGround: false, atkCd: 0, fuse: -1, hurtT: 0, age: 0, aggro: 0, burnT: 0, shootCd: 0, breedCd: 0,
    };
    m.hurt = (dmg, quiet) => {
      if (m.dead) return;
      m.hp -= dmg; m.hurtT = .26;
      m.mesh.userData.parts.forEach((o) => o.material.color.setHex(0xff7a7a));
      if (!quiet) { m.aggro = 14; m.state = 'chase'; Sound.mobHurt(); particles.spawn(m.pos.x, m.pos.y + m.def.h * .6, m.pos.z, 0xc03030, 4, 2.4, .3); }
      if (m.hp <= 0) Mobs.kill(m);
    };
    m.mesh.position.set(x, y, z);
    scene.add(m.mesh);
    this.list.push(m);
    return m;
  },
  remove(m, i) {
    scene.remove(m.mesh); disposeGroup(m.mesh);
    const j = i === undefined ? this.list.indexOf(m) : i;
    if (j >= 0) this.list.splice(j, 1);
  },
  kill(m) {
    if (m.dead) return;
    m.dead = true; m.fuse = -1; m.mesh.scale.setScalar(1);
    for (const [k, n, p] of m.def.drop) if (Math.random() <= (p === undefined ? 1 : p)) spawnDrop(m.pos.x, m.pos.y + .4, m.pos.z, resolveItem(k), n);
    particles.spawn(m.pos.x, m.pos.y + m.def.h * .5, m.pos.z, m.def.color, 10, 3, .5);
    if (Game.mode !== 'creative' && Game.mode !== 'spectator') addXp(m.def.xp || 1);
    Sound.mobDeath();
    statsInc('kills'); Adv.check(); markDirtySave();
  },
  count(type) { let n = 0; for (const m of this.list) if (!m.dead && m.type === type) n++; return n; },
  clearAll() { while (this.list.length) this.remove(this.list[0]); },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const m = this.list[i], p = m.pos, vel = m.vel, def = m.def;
      m.age += dt;
      if (m.dead) {
        m.deathT += dt;
        m.mesh.rotation.z = Math.min(1.5, m.deathT * 3.4);
        m.mesh.position.y = p.y - m.deathT * .45;
        if (m.deathT > .95) this.remove(m, i);
        continue;
      }
      const dp = p.distanceTo(Player.pos);
      if (dp > 80 && m.age > 12) { this.remove(m, i); continue; }
      if (m.hurtT > 0) {
        m.hurtT -= dt;
        if (m.hurtT <= 0) { const base = buildMobColors(def); m.mesh.userData.parts.forEach((o, k) => o.material.color.setHex(base[k % base.length])); }
      }
      if (def.burn) {
        const sky = world.skyAt(Math.floor(p.x), Math.floor(p.y + 1), Math.floor(p.z));
        if (Game.skyMul > .6 && sky >= 14) { m.burnT += dt; m.hurt(2.2 * dt, true); if (Math.random() < dt * 8) particles.spawn(p.x, p.y + def.h * .6, p.z, 0xffa03c, 1, 1.4, .4); }
        else m.burnT = 0;
      }
      if (m.hp <= 0) { this.kill(m); continue; }
      m.think -= dt;
      const alive = !Player.dead && Game.mode !== 'spectator';
      const seen = dp < (def.ranged ? 17 : 16) && alive;
      let aggro = !!def.hostile && seen;
      if (def.neutral) aggro = seen && m.aggro > 0;
      if (aggro && m.aggro <= 0 && def.stare) aggro = false;
      if (def.dayNeutral && Game.skyMul > .55) aggro = false;
      if (m.think <= 0) {
        m.think = .7 + Math.random() * 1.7;
        if (aggro) m.state = 'chase';
        else if (def.passive && dp < 4.2) m.state = 'flee';
        else m.state = Math.random() < .5 ? 'walk' : 'idle';
        if (m.state === 'walk') m.yaw = Math.random() * TAU;
      }
      if (m.aggro > 0) m.aggro -= dt;
      let sp = def.spd;
      const dir = new THREE.Vector3();
      if (m.state === 'chase' && seen) {
        const to = Player.pos.clone().sub(p); to.y = 0;
        m.yaw = Math.atan2(to.x, to.z);
        dir.set(Math.sin(m.yaw), 0, Math.cos(m.yaw));
        if (def.ranged) {
          m.shootCd -= dt;
          if (m.shootCd <= 0 && dp < 15 && dp > 2.4) {
            m.shootCd = 2.1;
            const from = p.clone().add(new THREE.Vector3(0, def.h * .72, 0));
            const v = Player.pos.clone().add(new THREE.Vector3(0, .9, 0)).sub(from).normalize().multiplyScalar(23);
            v.y += dp * .26;
            spawnArrow(from.x, from.y, from.z, v, def.dmg, false);
            Sound.bow();
          }
          if (dp < 3.4) sp *= .35;
        }
        if (def.boom && dp < def.boom) { if (m.fuse < 0) { m.fuse = 1.4; Sound.fuse(); } sp = 0; }
      } else if (m.state === 'flee' && dp < 9) {
        const to = p.clone().sub(Player.pos); to.y = 0;
        m.yaw = Math.atan2(to.x, to.z);
        dir.set(Math.sin(m.yaw), 0, Math.cos(m.yaw)); sp *= 1.6;
      } else if (m.state === 'walk') dir.set(Math.sin(m.yaw), 0, Math.cos(m.yaw));
      if (m.fuse > 0) {
        m.fuse -= dt;
        m.mesh.scale.setScalar(1 + (1 - clamp(m.fuse / 1.4, 0, 1)) * .32);
        if (m.fuse <= 0) { explode(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z), 3.2); this.remove(m, i); continue; }
      } else if (m.mesh.scale.x !== 1) m.mesh.scale.setScalar(1);
      vel.y -= 26 * dt;
      if (vel.y < -36) vel.y = -36;
      const wallAhead = mobBlocked(p.x + dir.x * .42, p.y, p.z + dir.z * .42, def.w, def.h);
      if (def.climb && wallAhead) vel.y = Math.max(vel.y, 3.2);
      const nx2 = p.x + dir.x * sp * dt, nz2 = p.z + dir.z * sp * dt;
      if (!mobBlocked(nx2, p.y, p.z, def.w, def.h)) p.x = nx2;
      else if (m.state !== 'idle') { if (!mobBlocked(nx2, p.y + 1.02, p.z, def.w, def.h)) p.y += 1.01; else m.yaw += 2.2; }
      if (!mobBlocked(p.x, p.y, nz2, def.w, def.h)) p.z = nz2;
      else if (m.state !== 'idle') { if (!mobBlocked(p.x, p.y + 1.02, nz2, def.w, def.h)) p.y += 1.01; else m.yaw += 2.2; }
      p.y += vel.y * dt;
      m.onGround = false;
      if (vel.y <= 0 && mobBlocked(p.x, p.y - .04, p.z, def.w, def.h)) {
        let gy = Math.floor(p.y);
        while (gy < WH - 1 && world.isSolid(Math.floor(p.x), gy, Math.floor(p.z))) gy++;
        p.y = gy; vel.y = 0; m.onGround = true;
      }
      if (world.block(Math.floor(p.x), Math.floor(p.y + .2), Math.floor(p.z)) === B.water && vel.y < -2.4) vel.y = -1.5;
      if (p.y < -12) { this.remove(m, i); continue; }
      m.atkCd -= dt;
      if (aggro && !def.ranged && !def.boom && dp < def.w + 1.5 && Math.abs(p.y - Player.pos.y) < 2.1 && m.atkCd <= 0) {
        m.atkCd = 1.05;
        damage(def.dmg, 'mob', { knock: true });
        const k2 = Player.pos.clone().sub(p).setY(0).normalize().multiplyScalar(4.4);
        Player.vel.x += k2.x; Player.vel.z += k2.z; Player.vel.y = Math.max(Player.vel.y, 3.4);
      }
      if (def.lays && Math.random() < dt * .014) spawnDrop(p.x, p.y + .4, p.z, I.egg, 1);
      if (def.stare && seen && facing(m) && m.aggro <= 0) { m.aggro = 16; m.state = 'chase'; toast('Você encarou o Enderman nos olhos', 'bad'); }
      m.mesh.position.copy(p);
      m.mesh.rotation.y = m.yaw + Math.PI;
      const walking = (m.state === 'walk' || m.state === 'chase' || m.state === 'flee') && m.onGround;
      const swing = walking ? Math.sin(m.age * 9) * .45 : 0;
      const parts = m.mesh.userData.parts;
      for (let k = parts.length - 4; k < parts.length; k++) if (parts[k]) parts[k].rotation.x = (k % 2 ? swing : -swing);
    }
    this.spawnLogic(dt);
  },
  spawnLogic(dt) {
    if (Game.mode === 'creative' || Game.mode === 'spectator') return;
    this.spawnT -= dt;
    if (this.spawnT > 0) return;
    this.spawnT = .9;
    let hostile = 0;
    for (const m of this.list) if (m.def.hostile && !m.dead) hostile++;
    const passive = this.list.length - hostile;
    const night = Game.skyMul < .4;
    const cap = night ? Math.round(Game.rd * 3) : Math.round(Game.rd * 1.1);
    if (hostile < cap) {
      for (let t = 0; t < 8; t++) {
        const a = Math.random() * TAU, r = 15 + Math.random() * 22;
        const x = Math.floor(Player.pos.x + Math.cos(a) * r), z = Math.floor(Player.pos.z + Math.sin(a) * r);
        const y = findGround(x, z, Math.floor(Player.pos.y + 10), Math.floor(Player.pos.y - 14));
        if (y < 0) continue;
        const light = Math.max(world.skyAt(x, y, z) / 15 * Game.skyMul, world.blkAt(x, y, z) / 15);
        if (light > .38) continue;
        const pool = night ? ['zombie', 'skeleton', 'creeper', 'spider', 'zombie', 'skeleton', 'enderman'] : ['spider', 'zombie', 'skeleton'];
        this.make(pool[(Math.random() * pool.length) | 0], x + .5, y, z + .5);
        break;
      }
    }
    if (passive < Math.round(Game.rd * 1.7) && Math.random() < .6) {
      const a = Math.random() * TAU, r = 16 + Math.random() * 28;
      const x = Math.floor(Player.pos.x + Math.cos(a) * r), z = Math.floor(Player.pos.z + Math.sin(a) * r);
      const y = findGround(x, z, WH - 4, 3);
      if (y > 0 && world.block(x, y - 1, z) === B.grass) {
        const pool = ['cow', 'pig', 'sheep', 'chicken', 'sheep', 'cow'];
        this.make(pool[(Math.random() * pool.length) | 0], x + .5, y, z + .5);
      }
    }
    if (this.list.length > 60) this.remove(this.list[0]);
  },
};
function facing(m) {
  const to = m.pos.clone().sub(camera.position).normalize();
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  return to.dot(dir) > .97 && m.pos.distanceTo(camera.position) < 9;
}
function chickenCount() { return Mobs.count('chicken'); }
