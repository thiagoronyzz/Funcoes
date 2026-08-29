
/* ============================================ MINERAÇÃO, USO E INTERAÇÃO === */
function raycastVoxel(maxDist) {
  const o = camera.position.clone();
  const d = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
  const stepX = Math.sign(d.x) || 1, stepY = Math.sign(d.y) || 1, stepZ = Math.sign(d.z) || 1;
  const tDeltaX = Math.abs(1 / (d.x || 1e-9)), tDeltaY = Math.abs(1 / (d.y || 1e-9)), tDeltaZ = Math.abs(1 / (d.z || 1e-9));
  let tMaxX = ((stepX > 0 ? x + 1 : x) - o.x) / d.x, tMaxY = ((stepY > 0 ? y + 1 : y) - o.y) / d.y, tMaxZ = ((stepZ > 0 ? z + 1 : z) - o.z) / d.z;
  if (tMaxX < 0) tMaxX = Infinity; if (tMaxY < 0) tMaxY = Infinity; if (tMaxZ < 0) tMaxZ = Infinity;
  let face = [0, 0, 0], t = 0;
  for (let i = 0; i < 160 && t <= maxDist; i++) {
    const id = world.block(x, y, z);
    const def = DEFS[id];
    if (id && def && !def.liquid && def.shape !== 'none') return { x, y, z, id, face, dist: t };
    if (id && def && def.liquid && face[1] === 0 && t > .05) { /* ignora água para mirar */ }
    if (tMaxX < tMaxY && tMaxX < tMaxZ) { x += stepX; t = tMaxX; tMaxX += tDeltaX; face = [-stepX, 0, 0]; }
    else if (tMaxY < tMaxZ) { y += stepY; t = tMaxY; tMaxY += tDeltaY; face = [0, -stepY, 0]; }
    else { z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; face = [0, 0, -stepZ]; }
    if (t > maxDist) break;
  }
  return null;
}
function breakTime(id, tool) {
  const d = DEFS[id];
  if (d.hard < 0) return Infinity;
  if (Game.mode === 'adventure') return Infinity;
  if (Game.mode === 'creative' || Game.mode === 'spectator') return 0;
  const match = d.tool && tool.kind === d.tool;
  let speed = match ? tool.speed : 1;
  if (d.tool && !match) speed = 1;
  const eff = tool.stack ? enchOf(tool.stack, 'efficiency') : 0;
  speed *= 1 + eff * .3;
  const can = canHarvest(id, tool);
  let t = d.hard * 1.5 / Math.max(.35, speed);
  if (!can) t = Math.max(t, d.hard > 0 ? d.hard * 5 : .35);
  return clamp(t, 0, 60);
}
function canHarvest(id, tool) {
  const d = DEFS[id];
  if (!d.tool) return true;
  if (d.hard < 0) return false;
  return (tool.tier || 0) >= (d.tier || 0);
}
function updateMining(dt) {
  Player.swing = Math.max(0, Player.swing - dt * 4.4);
  const hit = Player.target;
  const tm = Player.targetMob;
  if (Mouse.left && tm && Game.mode !== 'spectator' && (!hit || tm.dist <= hit.dist + .4)) { attackLoop(dt); if (Player.mineBlock) stopMine(); return; }
  if (Mouse.left && hit && Game.mode !== 'spectator') {
    const key = hit.x + ',' + hit.y + ',' + hit.z;
    if (Player.mineBlock !== key) { Player.mineBlock = key; Player.mineProgress = 0; }
    const tool = toolInfo();
    const need = breakTime(hit.id, tool);
    if (need === Infinity) { Player.mineProgress = 0; UI.syncCrack(); return; }
    if (need <= 0) { doBreak(hit, tool); return; }
    Player.mineProgress += dt / need;
    if (Math.random() < dt * 9) { particles.spawn(hit.x + .5 + (Math.random() - .5), hit.y + .3, hit.z + .5 + (Math.random() - .5), blockColorOf(hit.id), 1, 1.4, .35); Sound.dig(hit.id); }
    if (Player.mineProgress >= 1) { doBreak(hit, tool); Player.mineProgress = 0; }
    UI.syncCrack();
  } else stopMine();
}
function stopMine() { Player.mineProgress = 0; Player.mineBlock = null; UI.syncCrack(); }
function startSwing() { Player.swing = 1; Player.attackT = 0; Sound.swing(); }
function damageTool(kind, amount) {
  if (Game.mode === 'creative') return;
  const s = INV.heldStack(); if (!s) return;
  const d = DEFS[s.id];
  if (!d.dur) return;
  const unl = enchOf(s, 'unbreaking');
  if (unl > 0 && Math.random() > 1 / (1 + unl)) return;   /* Durabilidade: resiste ao desgaste */
  s.dur = (s.dur === undefined ? d.dur : s.dur) - (amount || 1);
  if (s.dur <= 0) { INV.hot[Player.held] = null; toast('Sua ' + d.label + ' quebrou', 'bad'); Sound.break_(); }
  UI.syncHotbar();
}
const resolveItem = (k) => {
  const id = typeof k === 'string' ? ID[k] : k;
  const d = DEFS[id];
  if (!d) return I.stick;
  if (d.kind === 'block') return d.item !== undefined ? d.item : id;
  return id;
};
function rollDrops(id, tool) {
  const d = DEFS[id];
  const silk = tool && tool.stack && enchOf(tool.stack, 'silk');
  const out = [];
  if (d.dropFn === 'leaves') {
    const r = Math.random();
    if (r < .05) out.push([I.apple, 1]);
    if (r > .9) out.push([I.stick, 1]);
    return out;
  }
  if (d.silk && !silk) return d.drop === null ? [] : d.drop;
  if (silk) { const it2 = ITEM_OF_BLOCK(id); return it2 === undefined ? [] : [[it2, 1]]; }
  if (!d.drop) return [];
  const fortune = tool && tool.stack ? enchOf(tool.stack, 'fortune') : 0;
  for (const [k, n] of d.drop) {
    let nn = n;
    if (fortune && d.tags && d.tags.includes('ore')) nn = n * (1 + ((Math.random() * fortune) | 0));
    out.push([resolveItem(k), nn]);
  }
  return out;
}
function doBreak(hit, toolIn) {
  const id = world.block(hit.x, hit.y, hit.z);
  const d = DEFS[id];
  if (!id || d.hard < 0) return;
  const tool = toolIn || toolInfo();
  const can = canHarvest(id, tool);
  const out = can ? rollDrops(id, tool) : [];
  world.set(hit.x, hit.y, hit.z, 0);
  statsInc('broken');
  if (id === B.obsidian) statsInc('obsidian');
  if (d.tags && d.tags.includes('log')) statsInc('logs');
  particles.spawn(hit.x + .5, hit.y + .5, hit.z + .5, blockColorOf(id), 12, 3.2, .6);
  Sound.break_();
  if (d.use === 'smelt' && world.furnaceData.has(hit.x + ',' + hit.y + ',' + hit.z)) {
    const fd = world.furnaceData.get(hit.x + ',' + hit.y + ',' + hit.z);
    for (const s of [fd.in, fd.fuel, fd.out]) if (s) spawnDrop(hit.x + .5, hit.y + .5, hit.z + .5, s.id, s.n);
    world.furnaceData.delete(hit.x + ',' + hit.y + ',' + hit.z);
  }
  if (d.use === 'chest' && world.chests.has(hit.x + ',' + hit.y + ',' + hit.z)) {
    for (const s of world.chests.get(hit.x + ',' + hit.y + ',' + hit.z)) if (s) spawnDrop(hit.x + .5, hit.y + .5, hit.z + .5, s.id, s.n);
    world.chests.delete(hit.x + ',' + hit.y + ',' + hit.z);
  }
  if (d.explodeOnBreak) igniteTnt(hit.x, hit.y, hit.z);
  if (d.replaceable) { /* nada */ }
  for (const [iid, n] of out) spawnDrop(hit.x + .5, hit.y + .5, hit.z + .5, iid, n);
  if (d.xp && Game.mode !== 'creative') addXp(d.xp[0] + ((Math.random() * (d.xp[1] - d.xp[0] + 1)) | 0));
  if (tool.stack && d.tool) damageTool('break', can ? 1 : 2);
  Adv.check();
}
const silkOf = (tool) => tool && tool.stack && enchOf(tool.stack, 'silk');
function canPlace(x, y, z) {
  const id = world.block(x, y, z);
  if (!id) return true;
  const d = DEFS[id];
  return !!(d.liquid || d.replaceable);
}
function overlapsPlayer(x, y, z) {
  const p = Player.pos;
  return (x + 1 > p.x - PW && x < p.x + PW && y + 1 > p.y && y < p.y + PH && z + 1 > p.z - PW && z < p.z + PW);
}
function placeBlock(hit, id) {
  if (Game.mode === 'adventure') { toast('Modo aventura: colocação bloqueada', 'bad'); return false; }
  const nx = hit.x + hit.face[0], ny = hit.y + hit.face[1], nz = hit.z + hit.face[2];
  if (ny < 0 || ny >= WH) return false;
  if (!canPlace(nx, ny, nz)) return false;
  const d = DEFS[id];
  if (d.solid && overlapsPlayer(nx, ny, nz)) { toast('Sem espaço aqui'); return false; }
  if (d.shape === 'cross' && !world.isSolid(nx, ny - 1, nz)) { toast('Precisa de um chão sólido'); return false; }
  world.set(nx, ny, nz, id);
  statsInc('placed');
  if (id === B.crafttable) statsInc('craftedTable');
  Sound.place();
  if (Game.mode !== 'creative') {
    const s = INV.heldStack();
    if (s) { s.n--; if (s.n <= 0) INV.hot[Player.held] = null; UI.syncHotbar(); }
  }
  Adv.check();
  return true;
}
function useItem() {
  const stack = INV.heldStack();
  if (!stack) return;
  const def = DEFS[stack.id];
  const hit = Player.target;
  if (Game.mode === 'spectator') return;
  if (hit) {
    const id = world.block(hit.x, hit.y, hit.z);
    const d = DEFS[id];
    if (d.use === 'craft') { Player.nearCraft = [hit.x, hit.y, hit.z]; UI.openCraft('craft3'); Sound.click(); return; }
    if (d.use === 'smelt') { openFurnace(hit.x, hit.y, hit.z); return; }
    if (d.use === 'chest') { openChest(hit.x, hit.y, hit.z); return; }
    if (d.use === 'enchant') { UI.openEnchant(hit.x, hit.y, hit.z); return; }
    if (d.use === 'sleep') { sleep(); return; }
    if (id === B.furnace || id === B.furnaceLit) { openFurnace(hit.x, hit.y, hit.z); return; }
  }
  if (Player.targetMob && def.key === 'apple') {
    const m = Player.targetMob.mob;
    if (m.def.breed) {
      if (m.breedCd > 0) { toast('Essa ' + m.def.label.toLowerCase() + ' ainda não está pronta'); return; }
      m.breedCd = 45; m.heal ? m.heal(4) : (m.hp = Math.min(m.def.hp, m.hp + 4));
      const baby = Mobs.make(m.type, m.pos.x + .8, m.pos.y, m.pos.z + .8);
      if (baby) { baby.hp = baby.def.hp; baby.age = -20; baby.mesh.scale.setScalar(.55); baby.def = Object.assign({}, baby.def); }
      if (!--stack.n) INV.hot[Player.held] = null;
      particles.spawn(m.pos.x, m.pos.y + 1, m.pos.z, 0xff9bb0, 12, 2, .8);
      toast('Um filhote nasceu!'); Sound.eat(); UI.syncHotbar();
      return;
    }
  }
  if (def.kind === 'blockitem') { if (hit) placeBlock(hit, def.block); else placeInFront(); return; }
  if (def.food !== undefined) { Player.eatT = def.food >= 8 ? 1.6 : 1.1; Player.eatItem = stack; return; }
  if (def.use === 'bow') { Player.bowT = 0.001; return; }
  if (def.key === 'egg' && hit) { const nx = hit.x + hit.face[0], ny = hit.y + hit.face[1], nz = hit.z + hit.face[2]; if (chickenCount() < 8) { spawnMob('chicken', nx + .5, ny + .2, nz + .5, true); if (!--stack.n) INV.hot[Player.held] = null; UI.syncHotbar(); } return; }
  toast('Item sem uso aqui: ' + def.label);
}
function placeInFront() {
  const o = camera.position.clone(), d = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  for (let t = 0; t < 4.6; t += .28) {
    const x = Math.floor(o.x + d.x * t), y = Math.floor(o.y + d.y * t), z = Math.floor(o.z + d.z * t);
    if (world.block(x, y, z)) continue;
    if (!world.isSolid(x, y - 1, z)) continue;
    if (overlapsPlayer(x, y, z)) continue;
    const id = DEFS[INV.heldStack().id].block;
    world.set(x, y, z, id); statsInc('placed'); Sound.place();
    if (Game.mode !== 'creative') { const s = INV.heldStack(); if (--s.n <= 0) INV.hot[Player.held] = null; UI.syncHotbar(); }
    return;
  }
}
function updateEat(dt) {
  if (Player.eatT > 0) {
    $('actionbar').textContent = 'Comendo…';
    Player.eatT -= dt;
    if (Player.eatT <= 0) {
      const s = Player.eatItem && INV.heldStack() === Player.eatItem ? Player.eatItem : INV.heldStack();
      const def = s && DEFS[s.id];
      if (def && def.food !== undefined) {
        Player.food = clamp(Player.food + def.food, 0, 20);
        Player.sat = clamp(Player.sat + def.food * .6, 0, Player.food);
        if (def.heal) heal(def.heal);
        if (def.regen) Player.regenBoost = def.regen;
        if (def.poison) Player.poisonT = 6;
        if (s && !--s.n) INV.hot[Player.held] = null;
        Sound.eat(); UI.syncHotbar(); UI.syncVitals(); Adv.check();
      }
      Player.eatItem = null;
      $('actionbar').textContent = '';
    }
  }
  if (Player.bowT > 0 && !Mouse.right) releaseBow();
  if (Player.bowT > 0) Player.bowT += dt;
}
function releaseBow() {
  if (Player.bowT <= 0) return;
  const charge = clamp(Player.bowT / 1.05, .3, 1);
  Player.bowT = 0;
  const s = INV.heldStack();
  if (!s || DEFS[s.id].use !== 'bow') return;
  if (!INV.take(I.arrow, 1)) { toast('Sem flechas', 'bad'); return; }
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  spawnArrow(camera.position.x, camera.position.y + .1, camera.position.z, dir.multiplyScalar(34 * (.5 + charge * .5)), 5 + charge * 4 + charge *enchOf(s, 'power') * 2, true);
  damageTool('bow', 1);
  Sound.bow();
  UI.syncHotbar();
}
function dropHeld() {
  const s = INV.heldStack();
  if (!s) return;
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  spawnDrop(Player.pos.x + dir.x * .7, Player.pos.y + 1.2, Player.pos.z + dir.z * .7, s.id, 1, dir.multiplyScalar(5.5));
  if (--s.n <= 0) INV.hot[Player.held] = null;
  UI.syncHotbar();
}
function updateTargets() {
  const hit = raycastVoxel(5.2);
  Player.target = hit;
  if (hit && DEFS[hit.id].use === 'craft') Player.nearCraft = [hit.x, hit.y, hit.z];
  else if (Player.nearCraft) {
    const nc = Player.nearCraft;
    if (Math.hypot(nc[0] + .5 - camera.position.x, nc[1] - camera.position.y, nc[2] + .5 - camera.position.z) > 6) Player.nearCraft = null;
  }
  let mob = null, md = 99;
  const dirv = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  for (const m of Mobs.list) {
    if (m.dead) continue;
    const cx = m.pos.x - camera.position.x, cy = m.pos.y + m.def.h * .5 - camera.position.y, cz = m.pos.z - camera.position.z;
    const proj = cx * dirv.x + cy * dirv.y + cz * dirv.z;
    if (proj <= .05 || proj > 4.2) continue;
    const perp = Math.hypot(cx - dirv.x * proj, cy - dirv.y * proj, cz - dirv.z * proj);
    if (perp > Math.max(.66, m.def.w * 1.05)) continue;
    if (proj < md) { md = proj; mob = m; }
  }
  Player.targetMob = mob ? { mob, dist: md } : null;
  if (hit) {
    selBox.position.set(hit.x + .5, hit.y + .5, hit.z + .5); selBox.visible = !Player.targetMob;
    const d = DEFS[hit.id];
    const tool = toolInfo();
    const t = breakTime(hit.id, tool);
    $('targetLabel').textContent = d.label + (Game.mode === 'creative' ? '' : (canHarvest(hit.id, tool) ? (isFinite(t) ? '  ·  ' + fmt(t) + 's' : '  ·  inquebrável') : '  ·  precisa de ' + (d.tool === 'pick' ? 'picareta ' : '') + TIER_NAME[d.tier])) ;
  } else { selBox.visible = false; $('targetLabel').textContent = ''; }
  if (Player.targetMob) { selBox.visible = false; $('targetLabel').textContent = Player.targetMob.mob.def.label + '  ·  ' + Math.ceil(Player.targetMob.mob.hp) + ' HP'; }
}
/* Bater num bicho: dano da ferramenta, crítico na queda, empurrão e o bicho
   reage — hostis/neutral te perseguem, passivo sai correndo. */
const COOKED = { beef: 'cookbeef', pork: 'cookpork', chickenm: 'cookchicken' };
function hitMob(m, dmg, tool) {
  if (!m || m.dead || m.hp <= 0) return false;
  const crit = !Player.onGround && !Player.inWater && Player.vel.y < -.4;
  let d = dmg || 1;
  if (crit) d *= 1.5;
  m.hurt(d, false);
  const dx = m.pos.x - Player.pos.x, dz = m.pos.z - Player.pos.z;
  const l = Math.hypot(dx, dz) || 1;
  m.vel.x += dx / l * 5.4; m.vel.z += dz / l * 5.4;
  if (m.onGround) m.vel.y = Math.max(m.vel.y, 3.6);
  if (m.def.hostile || m.def.neutral) m.aggro = 20;
  else if (m.def.passive) { m.state = 'flee'; m.aggro = 0; }
  const cy = m.pos.y + m.def.h * .6;
  particles.spawn(m.pos.x, cy, m.pos.z, crit ? 0xffe9a8 : 0xc9412f, crit ? 10 : 5, 2.4, .45);
  if (crit) toast('Golpe crítico!', 'good');
  Player.hitMobT = .18;
  return true;
}

function attackLoop(dt) {
  Player.attackT = (Player.attackT || 0) - dt;
  if (Player.attackT > 0) return;
  const tm = Player.targetMob;
  if (!tm) return;
  Player.attackT = Player.sprint ? .42 : .62;
  Player.swing = 1;
  if (tm.mob.def.boom) tm.mob.fuse = Math.min(tm.mob.fuse < 0 ? 99 : tm.mob.fuse, .9);
  const tool = toolInfo();
  let dmg = tool.def && tool.def.dmg ? tool.def.dmg : 1;
  const sharp = tool.stack ? enchOf(tool.stack, 'sharpness') : 0;
  if (sharp > 0) dmg += sharp * .5 + .5;                 /* Afiação: +0,5 por nível +0,5 */
  hitMob(tm.mob, dmg, tool);
  damageTool('attack');
}
function sleep() {
  if (Game.time < .3 || Game.time > .72) { toast('Só é possível dormir à noite'); return; }
  const near = Mobs.list.some((m) => m.def.hostile && m.pos.distanceTo(Player.pos) < 9);
  if (near) { toast('Monstros por perto — não é possível dormir', 'bad'); return; }
  Player.spawn.copy(Player.pos);
  toast('Dormiu — o amanhecer chegou');
  Game.time = .72;
  markAllDirty();
}
function igniteTnt(x, y, z) {
  world.set(x, y, z, 0);
  const e = { x, y, z, t: 1.5, mesh: null };
  const g = new THREE.Mesh(new THREE.BoxGeometry(.9, .9, .9), new THREE.MeshBasicMaterial({ map: tileTexture(DEFS[B.tnt].tiles.side), color: 0xffaaaa }));
  g.position.set(x + .5, y + .5, z + .5);
  scene.add(g); e.mesh = g;
  TNT.list.push(e);
  Sound.fuse();
}
const TNT = {
  list: [],
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const t = this.list[i];
      t.t -= dt;
      t.mesh.scale.setScalar(.9 + Math.sin(Game.t * 24) * .06);
      t.mesh.material.color.setHex(t.t < .5 ? 0xffffff : 0xff8866);
      if (t.t <= 0) { explode(Math.floor(t.x), Math.floor(t.y), Math.floor(t.z), 3.6); scene.remove(t.mesh); t.mesh.geometry.dispose(); this.list.splice(i, 1); }
    }
  },
};
function explode(cx, cy, cz, power) {
  Sound.boom();
  const R = Math.ceil(power);
  for (let y = -R; y <= R; y++) for (let z = -R; z <= R; z++) for (let x = -R; x <= R; x++) {
    const d = Math.sqrt(x * x + y * y + z * z);
    if (d > power + .5 - Math.random() * .8) continue;
    const wx = cx + x, wy = cy + y, wz = cz + z;
    const id = world.block(wx, wy, wz);
    if (!id) continue;
    const def = DEFS[id];
    if (def.hard < 0) continue;
    if (Math.random() < clamp(.85 - def.res * .06, .05, .95)) {
      if (Math.random() < .35) for (const [iid, n] of rollDrops(id, null)) spawnDrop(wx + .5, wy + .5, wz + .5, iid, n);
      world.set(wx, wy, wz, 0);
      if (def.explodeOnBreak) igniteTnt(wx, wy, wz);
    }
  }
  particles.spawn(cx + .5, cy + .5, cz + .5, 0xffb066, 40, 9, .7);
  particles.spawn(cx + .5, cy + .5, cz + .5, 0x555555, 26, 7, 1.1);
  const dp = Player.pos.distanceTo(new THREE.Vector3(cx + .5, cy + .5, cz + .5));
  if (dp < 5.5) {
    damage(clamp((5.5 - dp) * 3.4, 1, 20), 'explosion', { knock: true });
    const push = Player.pos.clone().sub(new THREE.Vector3(cx + .5, cy + .5, cz + .5)).normalize().multiplyScalar((5.5 - dp) * 1.5);
    Player.vel.x += push.x; Player.vel.y += Math.max(3, push.y); Player.vel.z += push.z;
  }
  for (const m of Mobs.list) {
    const d = m.pos.distanceTo(new THREE.Vector3(cx, cy, cz));
    if (d < 6) m.hurt(clamp((6 - d) * 4, 1, 14), true);
  }
}
