
/* ================================================ JOGADOR, FÍSICA, AÇÕES == */
const PW = .3;                      // meia-largura da caixa de colisão
const PH = 1.8;
const Player = {
  pos: new THREE.Vector3(0, SEA + 24, 0), vel: new THREE.Vector3(), onGround: false,
  yaw: 0, pitch: 0, sneak: false, sprint: false, fly: false, third: false, inWater: false, onLadder: false,
  hp: 20, maxHp: 20, food: 20, sat: 5, air: 10, xp: 0, xpTotal: 0, level: 0, xpNext: 7, needsKnock: 0, hurtT: 0, regenT: 0,
  fallStart: null, dead: false, eatT: 0, spawn: new THREE.Vector3(0, SEA + 24, 0), swing: 0, breakT: 0,
  target: null, mineBlock: null, mineProgress: 0, stepT: 0, breathDamage: 0, poisonT: 0, regenBoost: 0,
  inv: null, held: 0, keys: Object.create(null), lastSpace: 0, edgeGuard: true,
};
const INV = {
  hot: new Array(9).fill(null), main: new Array(27).fill(null), armor: new Array(4).fill(null), off: null,
  craft: new Array(9).fill(null), craftOut: null,
  add(id, n) {
    const def = DEFS[id] || DEFS[0]; const cap = def.stack || 1;
    const lists = [this.hot, this.main];
    for (const L of lists) for (let i = 0; i < L.length; i++) {
      const s = L[i];
      if (cap > 1 && s && s.id === id && s.n < cap) { const k = Math.min(cap - s.n, n); s.n += k; n -= k; if (n <= 0) return 0; }
    }
    for (const L of lists) for (let i = 0; i < L.length; i++) {
      if (!L[i]) { const k = Math.min(cap, n); L[i] = { id, n: k, dur: def.dur }; n -= k; if (n <= 0) return 0; }
    }
    markDirtySave();
    return n;
  },
  addFull(st) {
    if (!st) return 0;
    const left = this.add(st.id, st.n);
    if (left > 0) {
      for (const L of [this.hot, this.main]) for (let i = 0; i < L.length; i++) {
        if (!L[i]) { L[i] = { id: st.id, n: left, dur: st.dur, ench: st.ench }; markDirtySave(); return 0; }
      }
    }
    return left;
  },
  count(id) { let c = 0; for (const L of [this.hot, this.main]) for (const s of L) if (s && s.id === id) c += s.n; return c; },
  take(id, n) {
    for (const L of [this.hot, this.main]) for (let i = 0; i < L.length; i++) {
      const s = L[i]; if (!s || s.id !== id) continue;
      const t = Math.min(s.n, n); s.n -= t; n -= t;
      if (s.n <= 0) L[i] = null;
      if (n <= 0) return true;
    }
    return n <= 0;
  },
  heldStack() { return this.hot[Player.held] || null; },
};
const TIER_NAME = ['Mão', 'Madeira', 'Pedra', 'Ferro', 'Ouro', 'Diamante'];
function toolInfo() {
  const s = INV.heldStack(), d = s && DEFS[s.id];
  if (d && d.tool) return { kind: d.tool, tier: d.tier, speed: d.speed, stack: s, def: d };
  return { kind: null, tier: 0, speed: 1, stack: s, def: d };
}
function enchOf(stack, key) { return stack && stack.ench && stack.ench[key] ? stack.ench[key] : 0; }
function armorDefense(slot) { const s = INV.armor[slot]; return s ? DEFS[s.id].defense || 0 : 0; }
function totalDefense() { let d = 0, prot = 0; for (let i = 0; i < 4; i++) { const s = INV.armor[i]; if (!s) continue; d += DEFS[s.id].defense || 0; prot = Math.max(prot, enchOf(s, 'protection')); } return d * .04 * (1 + prot * .35); }

function damage(amount, source, opts) {
  if (Game.mode === 'creative' || Game.mode === 'spectator' || Player.dead || !Game.running) return;
  opts = opts || {};
  let amt = amount;
  if (!opts.trueDmg) {
    const red = totalDefense();
    amt = amt * (1 - clamp(red, 0, .68));
    const boots = INV.armor[3];
    if (source === 'fall' && boots) amt *= 1 - clamp(.35 * enchOf(boots, 'feather'), 0, .85);
  }
  amt = Math.max(amt, .5);
  if (Player.needsKnock > 0 && !opts.noKnock) return;
  Player.hp -= amt;
  Player.hurtT = .32;
  Player.needsKnock = .5;
  if (source && source !== 'fall' && source !== 'starve' && source !== 'drown' && opts.knock) {
    Player.vel.y = Math.max(Player.vel.y, 3.4);
  }
  $('flash').style.opacity = .55; $('hurtvig').style.opacity = 1;
  setTimeout(() => { $('flash').style.opacity = 0; if (Player.hp > 0) $('hurtvig').style.opacity = 0; }, 130);
  Sound.hurt();
  if (Player.hp <= 0) die();
  UI.syncVitals();
}
function heal(n) {
  Player.hp = clamp(Player.hp + n, 0, Player.maxHp);
  $('hurtvig').style.opacity = Player.hp / Player.maxHp > .5 ? 0 : $('hurtvig').style.opacity;
  UI.syncVitals();
}
const xpForLevel = (l) => (l < 16 ? 2 * l + 7 : l < 31 ? 5 * l - 38 : 9 * l - 158);
function xpState() {
  let pts = Player.xpTotal, lvl = 0;
  while (lvl < 200 && pts >= xpForLevel(lvl)) { pts -= xpForLevel(lvl); lvl++; }
  Player.level = lvl;
  return { lvl, cur: pts, need: xpForLevel(lvl) };
}
function addXp(n) {
  if (Game.mode === 'creative' || Game.mode === 'spectator' || n <= 0) return;
  Player.xpTotal += n;
  UI.syncVitals();
  Adv.check();
}
function spendLevels(k) {
  const st = xpState();
  if (st.lvl < k) return false;
  let pts = 0;
  for (let i = 0; i < st.lvl - k; i++) pts += xpForLevel(i);
  Player.xpTotal = pts;
  UI.syncVitals();
  return true;
}
/* --------------------------------------------------------- controles */
const Keys = Player.keys;
addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const c = e.code;
  if (c === 'Escape') { if (UI.open) UI.close(); else Game.paused ? resume() : pause(); e.preventDefault(); return; }
  if (c === 'F3') { $('debug').classList.toggle('hidden'); e.preventDefault(); return; }
  if (UI.open || !Game.running) return;
  Keys[c] = true;
  if (c === 'KeyE' || c === 'KeyI') { UI.openCraft(Player.nearCraft ? 'craft3' : 'inv'); e.preventDefault(); }
  else if (c === 'KeyF') { if (Game.mode === 'creative' || Game.mode === 'spectator') Player.fly = !Player.fly, toast(Player.fly ? 'Voo ligado' : 'Voo desligado'); }
  else if (c === 'KeyV') { Player.third = !Player.third; }
  else if (c === 'KeyQ') { dropHeld(); }
  else if (c === 'KeyR') { if (Player.nearCraft) useStation(Player.nearCraft); }
  else if (c === 'KeyG') { if (Game.mode !== 'creative') { toast('Modo: ' + ({ survival: 'Sobrevivência', creative: 'Criativo', spectator: 'Espectador' }[Game.mode] || Game.mode)); } }
  else if (c.startsWith('Digit')) { const n = +c.slice(5); if (n >= 1 && n <= 9) { Player.held = n - 1; UI.syncHotbar(); } }
  if (['Space', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(c)) e.preventDefault();
});
addEventListener('keyup', (e) => { Keys[e.code] = false; });
addEventListener('blur', () => { for (const k in Keys) Keys[k] = false; });
canvas.addEventListener('mousedown', (e) => {
  if (!Game.running || UI.open) return;
  if (!pointerLocked()) { requestLock(); return; }
  if (e.button === 0) { Mouse.left = true; startSwing(); }
  else if (e.button === 2) { Mouse.right = true; useItem(); }
});
addEventListener('mouseup', (e) => { if (e.button === 0) { Mouse.left = false; stopMine(); } else if (e.button === 2) { Mouse.right = false; releaseBow(); } });
addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('wheel', (e) => {
  if (!Game.running) return;
  /* com uma tela aberta ainda dá pra trocar o item da barra (como no Minecraft);
     só não roubamos a rolagem das listas de receitas/paleta */
  const over = e.target && e.target.closest ? e.target.closest('.recipes,.palette') : null;
  if (over) return;
  if (!UI.open && !pointerLocked()) return;
  Player.held = (Player.held + (e.deltaY > 0 ? 1 : 8)) % 9;
  UI.syncHotbar();
}, { passive: true });
const Mouse = { left: false, right: false };
function requestLock() { const c = $('gl'); c.requestPointerLock && c.requestPointerLock(); }
function pointerLocked() { return document.pointerLockElement === canvas; }
addEventListener('mousemove', (e) => {
  if (!pointerLocked() || UI.open) return;
  const s = .0022;
  Player.yaw -= e.movementX * s; Player.pitch = clamp(Player.pitch - e.movementY * s, -1.5533, 1.5533);
});
document.addEventListener('pointerlockchange', () => {
  if (!pointerLocked() && Game.running && !UI.open && !Player.dead) pause();
});

/* ------------------------------------------------------------- física */
function blockAtFeet() { return world.block(Math.floor(Player.pos.x), Math.floor(Player.pos.y), Math.floor(Player.pos.z)); }
function solidAt(x, y, z) {
  const d = DEFS[world.block(x, y, z)];
  return !!(d && d.solid);
}
function collides(px, py, pz) {
  const x0 = Math.floor(px - PW), x1 = Math.floor(px + PW), y0 = Math.floor(py), y1 = Math.floor(py + PH - .0001), z0 = Math.floor(pz - PW), z1 = Math.floor(pz + PW);
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const d = DEFS[world.block(x, y, z)];
    if (d && d.solid && !d.replaceable) return true;
  }
  return false;
}
function moveAxis(axis, amt) {
  if (amt === 0) return false;
  const p = Player.pos;
  const step = Math.sign(amt) * .06;
  let moved = 0;
  while (Math.abs(amt - moved) > 1e-6) {
    const inc = Math.abs(amt - moved) < Math.abs(step) ? amt - moved : step;
    p[axis] += inc;
    if (collides(p.x, p.y, p.z)) {
      p[axis] -= inc;
      if (axis === 'y') {
        if (inc < 0) {
          /* gruda o pé no topo do bloco: sem ficar descendo 0,06 por quadro,
             que era o que dava aquela tremida/pop ao pular e aterrissar */
          const top = Math.floor(p.y + inc) + 1;
          if (top <= p.y && !collides(p.x, top, p.z)) p.y = top;
          Player.onGround = true; landFall();
        }
        Player.vel.y = 0;
      }
      else if (Game.mode === 'creative' || Game.mode === 'spectator') { /* atravessa */ }
      else return true;
      return true;
    }
    moved += inc;
  }
  return false;
}
/* Altura de queda, não velocidade: um pulo comum (~1,4 bloco) nunca machuca.
   Como no Minecraft, só passa de 3 blocos de altura que tem dano. */
function landFall() {
  const fall = Player.fallStart === null ? 0 : Math.max(0, Player.fallStart - Player.pos.y);
  Player.fallStart = null;
  if (fall <= 3.6 || Player.fly || Player.inWater || Player.onLadder ||
      Game.mode === 'creative' || Game.mode === 'spectator') return;
  const dmg = Math.max(1, Math.min(20, Math.round((fall - 3) * 2)));
  damage(dmg, 'fall');
  particles.spawn(Player.pos.x, Player.pos.y + .1, Player.pos.z, 0xdedede, 8, 2, .4);
  Player.lastFall = fall;
}
function updatePlayer(dt) {
  const K = Keys, p = Player.pos, v = Player.vel;
  if (!world.chunks.has(ckey(Math.floor(p.x / CH), Math.floor(p.z / CH)))) { v.set(0, 0, 0); return; }
  const spect = Game.mode === 'spectator';
  const creative = Game.mode === 'creative';
  const fly = Player.fly || spect;
  /* vetores de câmera */
  const fx = -Math.sin(Player.yaw), fz = -Math.cos(Player.yaw);
  const rx = Math.cos(Player.yaw), rz = -Math.sin(Player.yaw);
  let fwd = (K.KeyW ? 1 : 0) - (K.KeyS ? 1 : 0), str = (K.KeyD ? 1 : 0) - (K.KeyA ? 1 : 0);
  Player.sneak = !!K.ShiftLeft && !fly;
  if (K.KeyW && Player.prevW !== true) { const now = performance.now(); if (now - (Player.lastW || 0) < 300) Player.sprintT = 1.4; Player.lastW = now; }
  Player.prevW = !!K.KeyW;
  Player.sprintT = Math.max(0, (Player.sprintT || 0) - dt);
  if (Game.mode === 'survival' || Game.mode === 'hardcore') { if (Player.food < 6) Player.sprintT = 0; }
  Player.sprint = !Player.sneak && !fly && fwd > 0 && (!!K.ControlLeft || Player.sprintT > 0);
  const len = Math.hypot(fwd, str) || 1;
  fwd /= len; str /= len;
  const inWaterHere = DEFS[blockAtFeet()].liquid || DEFS[world.block(Math.floor(p.x), Math.floor(p.y + 1), Math.floor(p.z))].liquid;
  Player.inWater = !!inWaterHere;
  const onLadderHere = !!(DEFS[world.block(Math.floor(p.x), Math.floor(p.y + .5), Math.floor(p.z))].climb) ||
    !!(DEFS[world.block(Math.floor(p.x), Math.floor(p.y + 1.3), Math.floor(p.z))].climb);
  Player.onLadder = onLadderHere && !fly;
  let speed = 4.317;
  if (Player.sprint) speed = 5.612;
  if (Player.sneak) speed = 1.4;
  if (Player.inWater) speed = 2.2;
  if (fly) speed = Player.sprint ? 21 : 11;
  if (spect) speed = 26;
  const accel = fly ? 14 : Player.onGround ? 42 : 9;
  const wishX = (fx * fwd + rx * str) * speed, wishZ = (fz * fwd + rz * str) * speed;
  v.x += (wishX - v.x) * clamp(accel * dt, 0, 1);
  v.z += (wishZ - v.z) * clamp(accel * dt, 0, 1);
  if (Math.abs(wishX) < .01 && Math.abs(wishZ) < .01 && Player.onGround) { v.x *= Math.pow(.0016, dt); v.z *= Math.pow(.0016, dt); }

  if (!spect) {
    const g = Player.inWater ? 9 : 26;
    if (!fly) v.y -= g * dt;
    if (Player.inWater && !fly) v.y = Math.max(v.y, -3.2);
    if (Player.onLadder && !fly) v.y = clamp(v.y, -2.4, 2.4);
  } else v.y = 0;
  if (fly) v.y = 0;
  if (fly) {
    v.y = (K.Space ? 1 : 0) * 9 - (K.ShiftLeft ? 9 : 0);
    if (spect) v.y = (K.Space ? 10 : 0) - (K.ShiftLeft ? 10 : 0);
  } else if (K.Space) {
    if (Player.inWater) v.y = 3.6;
    else if (Player.onLadder) v.y = 3.4;
    else if (Player.onGround) { v.y = 8.6; Sound.jump(); if (Player.sprint) burnFood(.05); }
  }
  /* voo: F ou pulo duplo no criativo */
  if (K.Space && !fly && (creative || Game.mode === 'spectator')) {
    const now2 = performance.now();
    if (now2 - (Player.lastSpace || 0) < 320) { Player.fly = true; toast('Voo ativado'); }
    Player.lastSpace = now2;
  }
  Player.velPrevY = v.y;
  Player.onGround = false;
  if (!spect) {
    const prevX = p.x, prevZ = p.z;
    moveAxis('x', v.x * dt); moveAxis('z', v.z * dt);
    Player.onGroundBefore = Player.onGround;
    moveAxis('y', v.y * dt);
    if (Game.autojump && (K.KeyW || K.KeyA || K.KeyS || K.KeyD) && Player.onGround && !Player.inWater && !fly) {
      const dirs = [[fx, fz], [rx, rz], [-fx, -fz], [-rx, -rz]];
      for (const [dx, dz] of dirs) {
        /* dá um pulo mesmo, em vez de deslocar o jogador um bloco pra cima
           (o "teleporte" que dava aquela travada ao pular perto da parede) */
        if (collides(p.x + dx * .45, p.y, p.z + dz * .45) && !collides(p.x + dx * .45, p.y + 1.02, p.z + dz * .45)) {
          v.y = Math.max(v.y, 8.6); Sound.jump(); break;
        }
      }
    }
    if (Player.sneak && Player.onGround) {
      let support = false;
      for (const [dx, dz] of [[.34, .34], [-.34, .34], [.34, -.34], [-.34, -.34], [0, 0]])
        if (solidAt(Math.floor(p.x + dx), Math.floor(p.y - .3), Math.floor(p.z + dz))) support = true;
      if (!support) { p.x = prevX; p.z = prevZ; v.x = 0; v.z = 0; }
    }
    if (p.y < -6) { p.set(Player.spawn.x, WH - 2, Player.spawn.z); Player.vel.set(0, 0, 0); if (Game.mode !== 'creative') damage(4, 'void'); }
    if (p.y > WH + 30) { p.y = WH + 30; v.y = 0; }
  } else {
    p.x += v.x * dt; p.z += v.z * dt; p.y += (K.Space ? 12 : K.ShiftLeft ? -12 : 0) * dt;
  }
  /* afogamento, lava, cacto */
  const head = world.block(Math.floor(p.x), Math.floor(p.y + 1.62), Math.floor(p.z));
  const headDef = DEFS[head];
  if (headDef.liquid && head === B.water) {
    Player.air -= dt * (Player.sneak ? .5 : 1);
    if (Player.air <= 0) { Player.drownT = (Player.drownT || 0) + dt; if (Player.drownT > 1) { Player.drownT = 0; damage(2, 'drown'); } }
  } else Player.air = Math.min(10, Player.air + dt * 4);
  $('water').style.opacity = head === B.water ? (Player.air <= 0 && Game.mode !== 'creative' ? .9 : .55) : (Player.air < 3.2 ? .85 : 0);
  if (headDef.liquid && head === B.lava) { damage(4 * dt * 3, 'fire', { noKnock: true, trueDmg: true }); if (Math.random() < .35) particles.spawn(p.x, p.y + 1, p.z, 0xff8c1a, 2, 2, .5); }
  if (Player.inWater && Player.fireT) Player.fireT = 0;
  if (Player.fireT > 0) { Player.fireT -= dt; damage(2 * dt, 'fire', { noKnock: true, trueDmg: true }); if (Math.random() < .3) particles.spawn(p.x, p.y + .8, p.z, 0xffa03c, 1, 1.6, .4); }
  const feetB = world.block(Math.floor(p.x), Math.floor(p.y + .1), Math.floor(p.z));
  if (DEFS[feetB].hurt) damage(DEFS[feetB].hurt * dt * 2, 'cactus', { noKnock: true });
  /* sufocamento dentro de bloco */
  const inBlock = DEFS[world.block(Math.floor(p.x), Math.floor(p.y + 1.35), Math.floor(p.z))];
  if (!Player.inWater && !fly && !spect && inBlock && inBlock.solid && !inBlock.replaceable) {
    Player.stuckT = (Player.stuckT || 0) + dt;
    if (Player.stuckT > .5) { Player.stuckT = 0; damage(1, 'suffocate', { noKnock: true, trueDmg: true }); }
  } else Player.stuckT = 0;
  if (v.y <= 0 && !Player.onGround && !fly && !Player.inWater && !Player.onLadder && Player.fallStart === null) Player.fallStart = p.y;
  if (Player.onGround && Player.fallStart !== null) Player.fallStart = null;
  /* passos + fome */
  const hsp = Math.hypot(v.x, v.z);
  if (Player.onGround && hsp > 1.2) {
    Player.stepT -= dt * hsp;
    if (Player.stepT <= 0) { Player.stepT = 2.2; Sound.step(feetB); burnFood(Player.sprint ? .06 : .02); Adv.check(); }
  }
  if (Player.hurtT > 0) Player.hurtT -= dt;
  if (Player.needsKnock > 0) Player.needsKnock -= dt;
  if (Player.poisonT > 0) { Player.poisonT -= dt; if ((Player.poisonTick = (Player.poisonTick || 0) + dt) > 1) { Player.poisonTick = 0; damage(1, 'poison', { noKnock: true }); } }
  if (Player.regenBoost > 0) Player.regenBoost -= dt;
  if (Game.mode === 'survival' || Game.mode === 'hardcore') {
    Player.regenT += dt;
    if (Player.food >= 18 && Player.hp < Player.maxHp && Player.regenT > 4) { Player.regenT = 0; heal(1); burnFood(.6); }
    if (Player.food <= 0) { Player.starveT = (Player.starveT || 0) + dt; if (Player.starveT > 4) { Player.starveT = 0; damage(1, 'starve', { noKnock: true }); } }
    if (Player.food < 6) Player.sprint = false;
    if (Player.food < 18) { Player.foodProg = (Player.foodProg || 0) + dt; if (Player.foodProg > 4) { Player.foodProg = 0; if (Player.sat > 0) Player.sat = Math.max(0, Player.sat - 1); else Player.food = Math.max(0, Player.food - 1); UI.syncVitals(); } }
  }
  updateMining(dt);
  updateEat(dt);
  updateCameraRig(dt);
}
function burnFood(n) {
  if (Game.mode !== 'survival' && Game.mode !== 'hardcore') return;
  Player.foodDrain = (Player.foodDrain || 0) + n;
  while (Player.foodDrain >= 1) { Player.foodDrain -= 1; if (Player.sat > 0) Player.sat -= 1; else Player.food = Math.max(0, Player.food - 1); }
  UI.syncVitals();
}
function updateCameraRig(dt) {
  const p = Player.pos;
  const hsp = Math.hypot(Player.vel.x, Player.vel.z);
  /* a balançada entra e sai suavizada e com fase própria: antes ela era ligada
     no talo quando você saía do chão, e isso parecia um pequeno teleporte */
  const want = Player.onGround && hsp > 1 && !Player.fly ? 1 : 0;
  Player.bobK = (Player.bobK || 0) + (want - (Player.bobK || 0)) * clamp(dt * 8, 0, 1);
  Player.bobT = (Player.bobT || 0) + dt * (1.9 + hsp * .42) * (Player.sprint ? 1.35 : 1);
  const bob = Math.sin(Player.bobT * 2 * Math.PI) * (Player.sneak ? .012 : .032) * Player.bobK;
  const eye = p.y + (Player.sneak ? 1.52 : 1.62) + bob;
  camera.rotation.order = 'YXZ';
  camera.rotation.y = Player.yaw; camera.rotation.x = Player.pitch; camera.rotation.z = bob * .3;
  if (Player.third) {
    const dir = new THREE.Vector3(Math.sin(Player.yaw) * Math.cos(Player.pitch), Math.sin(Player.pitch), -Math.cos(Player.yaw) * Math.cos(Player.pitch)).negate();
    const target = new THREE.Vector3(p.x, eye, p.z).add(dir.multiplyScalar(3.6 + (world.isSolid(Math.floor(p.x + dir.x), Math.floor(eye + dir.y), Math.floor(p.z + dir.z)) ? -1.2 : 0)));
    camera.position.lerp(target, clamp(dt * 18, 0, 1));
  } else camera.position.set(p.x, eye, p.z);
  const fov = Game.fov + (Player.sprint ? 6 : 0) + (Player.fly ? 4 : 0);
  if (Math.abs(camera.fov - fov) > .05) { camera.fov += (fov - camera.fov) * clamp(dt * 8, 0, 1); camera.updateProjectionMatrix(); }
}
