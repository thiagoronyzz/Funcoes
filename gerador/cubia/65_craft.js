
/* ============================================== CRAFTING, FORNALHA, ENC. === */
const asItem = (id) => { const d = DEFS[id]; return d && d.kind === 'block' && d.item !== undefined ? d.item : id; };
function acceptIds(spec) {
  if (!spec) return null;
  const arr = Array.isArray(spec) ? spec : [spec], out = [];
  for (const a of arr) {
    if (typeof a === 'number') { out.push(a); continue; }
    if (a[0] === '@') { (TAGS[a.slice(1)] || []).forEach((id) => out.push(asItem(id))); }
    else if (ID[a] !== undefined) out.push(asItem(ID[a]));
  }
  return out.length ? out : null;
}
function gridState() {
  const size = UI.mode === 'craft3' ? 3 : 2, cells = [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const st = INV.craft[y * 3 + x];
    cells.push(st ? st.id : 0);
  }
  return { cells, size };
}
function matchRecipe(cells, size) {
  for (const r of RECIPES) {
    if (r.shapeless) {
      if (r.dynamic) { const got = r.dynamic(cells.filter((c) => c)); if (got) return { r, got: outOf(got) }; continue; }
      /* shapeless comum */
      const need = r.shapeless.map(([k, n]) => [asItem(ID[k] !== undefined ? ID[k] : k), n]).sort((a, b) => a[0] - b[0]);
      const have = cells.filter((c) => c).slice().sort((a, b) => a - b);
      if (need.reduce((s, x) => s + x[1], 0) !== have.length) continue;
      let ok = true, hi = 0;
      for (const [id, n] of need) { for (let k = 0; k < n; k++) { if (have[hi] !== id) { ok = false; break; } hi++; } if (!ok) break; }
      if (ok) return { r, got: outOf(r.out) };
      continue;
    }
    const pw = r.size[0], ph = r.size[1];
    if (pw > size || ph > size) continue;
    const acc = [];
    for (let y = 0; y < ph; y++) { const row = []; for (let x = 0; x < pw; x++) row.push(acceptIds(r.map[r.rows[y][x]])); acc.push(row); }
    for (let flip = 0; flip < (r.mirror ? 2 : 1); flip++) {
      const A = flip ? acc.map((row) => row.slice().reverse()) : acc;
      for (let oy = 0; oy <= size - ph; oy++) for (let ox = 0; ox <= size - pw; ox++) {
        let ok = true;
        for (let y = 0; y < size && ok; y++) for (let x = 0; x < size && ok; x++) {
          const cell = cells[y * size + x];
          const py = y - oy, px = x - ox;
          const want = (py >= 0 && py < ph && px >= 0 && px < pw) ? A[py][px] : null;
          if (!want) { if (cell) ok = false; }
          else if (!cell || !want.includes(cell)) ok = false;
        }
        if (ok) return { r, got: outOf(r.out) };
      }
    }
  }
  return null;
}
function outOf(spec) { const [k, n] = spec; const id = typeof k === 'string' ? asItem(ID[k]) : asItem(k); return id === undefined ? null : { id, n }; }
UI.syncCraft = function () {
  const { cells, size } = gridState();
  const m = cells.some((c) => c) ? matchRecipe(cells, size) : null;
  INV.craftOut = m ? { id: m.got.id, n: m.got.n } : null;
  const out = $('screenRoot').querySelector('.slot[data-list="out"]');
  if (out) this.paint(out, INV.craftOut);
  const arr = $('screenRoot').querySelector('.arrow');
  if (arr) arr.style.opacity = m ? 1 : .25;
};
UI.doCraft = function (times) {
  const { cells, size } = gridState();
  let made = 0;
  for (let t = 0; t < times; t++) {
    const m = cells.some((c) => c) ? matchRecipe(cells, size) : null;
    if (!m) break;
    for (let i = 0; i < size * size; i++) {
      const idx = (i / size | 0) * 3 + (i % size);
      const st = INV.craft[idx];
      if (st) { st.n--; if (st.n <= 0) INV.craft[idx] = null; }
    }
    const g = gridState(); cells.length = 0; Array.prototype.push.apply(cells, g.cells);
    made++;
    Sound.craft();
  }
  if (made) {
    const res = INV.craftOut;
    if (res) { const left = INV.add(res.id, res.n * made); if (left > 0) dropStackWorld({ id: res.id, n: left }); }
    if (res && DEFS[res.id].key === 'i_crafttable') statsInc('craftedTable');
    markDirtySave();
    this.syncCraft(); this.syncScreen(); this.syncHotbar();
    Adv.check();
    if (this.recipeBookElRef) this.refreshRecipes();
  }
};

/* ------------------------------------------------------------- fornalha */
const SMELT_TIME = 6.2;
function furnaceData(x, y, z) {
  const k = x + ',' + y + ',' + z;
  let d = world.furnaceData.get(k);
  if (!d) { d = { in: null, fuel: null, out: null, burn: 0, burnMax: 0, cook: 0, k }; world.furnaceData.set(k, d); }
  return d;
}
function smeltFor(itemId) {
  const key = DEFS[itemId] && DEFS[itemId].key;
  if (!key) return null;
  const s = SMELT[key] || SMELT[key.replace(/^i_/, '')];
  if (!s) return null;
  return { out: outOf(s.out), xp: s.xp };
}
function fuelFor(itemId) {
  const key = DEFS[itemId] && DEFS[itemId].key;
  return FUELS[key] !== undefined ? FUELS[key] : FUELS[(key || '').replace(/^i_/, '')];
}
function updateFurnaces(dt) {
  for (const [k, d] of world.furnaceData) {
    let changed = false;
    if (d.burn > 0) { d.burn -= dt; if (d.burn < 0) d.burn = 0; }
    if (d.burn <= 0 && d.fuel) {
      const f = fuelFor(d.fuel.id);
      if (f !== undefined) { d.burnMax = f; d.burn = f; d.fuel.n--; if (d.fuel.n <= 0) d.fuel = null; changed = true; }
    }
    const rec = d.in ? smeltFor(d.in.id) : null;
    if (rec && d.burn > 0) {
      const canOut = !d.out || (d.out.id === rec.out.id && d.out.n < DEFS[rec.out.id].stack);
      if (canOut) {
        d.cook += dt;
        if (d.cook >= SMELT_TIME) {
          d.cook = 0;
          if (d.out) d.out.n += rec.out.n; else d.out = { id: rec.out.id, n: rec.out.n };
          d.in.n--; if (d.in.n <= 0) d.in = null;
          if (rec.xp) addXp(rec.xp);
          statsInc('smelted'); markDirtySave();
          changed = true;
        }
      }
    } else if (d.cook > 0) d.cook = Math.max(0, d.cook - dt * 2);
    const [x, y, z] = k.split(',').map(Number);
    const cur = world.block(x, y, z);
    const want = d.burn > 0 ? B.furnaceLit : B.furnace;
    if (cur !== want && (cur === B.furnace || cur === B.furnaceLit)) world.set(x, y, z, want);
    if (UI.open === 'furnace' && UI.key === k) UI.syncFurnaceUI();
    if (changed) { }
  }
}
UI.furnaceEl = function (mkSlot) {
  const box = document.createElement('div');
  box.style.cssText = 'display:flex;gap:14px;align-items:center';
  const col = document.createElement('div');
  col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px';
  const fin = mkSlot('fin', 0), flame = document.createElement('div'), ffuel = mkSlot('ffuel', 0);
  flame.className = 'flame'; flame.id = 'flameIcon';
  col.appendChild(fin); col.appendChild(flame); col.appendChild(ffuel);
  const ar = document.createElement('div'); ar.className = 'arrow'; ar.id = 'furnArrow';
  const fout = mkSlot('fout', 0);
  box.appendChild(col); box.appendChild(ar); box.appendChild(fout);
  const label = document.createElement('div');
  label.style.cssText = 'font-size:11.5px;color:var(--muted);margin-top:6px;max-width:190px';
  label.innerHTML = 'Entrada em cima, combustível embaixo. Cada item leva ' + SMELT_TIME + 's.';
  const wrap = document.createElement('div');
  wrap.appendChild(box); wrap.appendChild(label);
  const t = document.createElement('h4'); t.textContent = 'Fornalha';
  wrap.insertBefore(t, box);
  return wrap;
};
UI.syncFurnaceUI = function () {
  const d = this.furnace && this.furnace.data; if (!d) return;
  const root = $('screenRoot');
  const fa = root.querySelector('#furnArrow');
  if (fa) fa.style.setProperty('--p', Math.round(clamp(d.cook / SMELT_TIME, 0, 1) * 100) + '%'), fa.classList.add('busy');
  const fl = root.querySelector('#flameIcon');
  if (fl) { const f = d.burnMax ? clamp(d.burn / d.burnMax, 0, 1) : 0; fl.style.backgroundImage = f > 0 ? 'radial-gradient(circle at 50% 100%, #ffd166 ' + (f * 60) + '%, transparent ' + (f * 62) + '%)' : 'none'; }
  root.querySelectorAll('.slot[data-list="fin"],.slot[data-list="ffuel"],.slot[data-list="fout"]').forEach((el) => this.paint(el, this.slotStack(el.dataset.list, +el.dataset.i)));
};
function openFurnace(x, y, z) { UI.show('furnace', [x, y, z]); }
function openChest(x, y, z) {
  const k = x + ',' + y + ',' + z;
  if (!world.chests.has(k)) world.chests.set(k, new Array(27).fill(null));
  UI.show('chest', [x, y, z]);
}
function dropStackWorld(st) {
  if (!st) return;
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  spawnDrop(Player.pos.x + dir.x * .6, Player.pos.y + 1.1, Player.pos.z + dir.z * .6, st.id, st.n, dir.multiplyScalar(3), st.ench, st.dur);
}

/* ------------------------------------------------------ livro de receitas */
UI.recipeBookEl = function () {
  const box = document.createElement('div');
  box.style.cssText = 'max-width:250px';
  const h = document.createElement('h4'); h.textContent = 'Livro de receitas';
  const sub = document.createElement('div'); sub.style.cssText = 'font-size:11px;color:var(--muted);margin-bottom:6px';
  sub.textContent = 'Clique para colocar na bancada. Só aparece o que você tem materials.';
  const grid = document.createElement('div'); grid.className = 'recipes'; grid.id = 'recipeBook';
  box.appendChild(h); box.appendChild(sub); box.appendChild(grid);
  this.recipeBookElRef = grid;
  setTimeout(() => this.refreshRecipes(), 0);
  return box;
};
UI.canMake = function (r) {
  const need = Object.create(null);
  if (r.shapeless) {
    if (r.dynamic) {
      const logs = TAGS.log || [];
      for (const lb of logs) if (INV.count(asItem(lb)) > 0) return true;
      return false;
    }
    for (const [k, n] of r.shapeless) { const id = asItem(ID[k]); if (id === undefined) return false; need[id] = (need[id] || 0) + n; }
  }
  else {
    for (const row of r.rows) for (const ch of row) {
      const acc = acceptIds(r.map[ch]);
      if (!acc) continue;
      need[acc[0]] = (need[acc[0]] || 0) + 1;
    }
  }
  for (const id in need) if (INV.count(+id) < need[id]) return false;
  return true;
};
UI.refreshRecipes = function () {
  const grid = this.recipeBookElRef; if (!grid) return;
  grid.innerHTML = '';
  const list = RECIPES.filter((r) => this.canMake(r));
  if (!list.length) { grid.innerHTML = '<div style="grid-column:1/-1;font-size:12px;color:var(--muted);padding:8px">Nenhuma receita disponível ainda. Quebre madeira para começar.</div>'; return; }
  for (const r of list) {
    const got = outOf(r.dynamic ? [r.preview, 4] : r.out);
    const el = document.createElement('div');
    el.className = 'slot';
    const cv = document.createElement('canvas'); cv.width = cv.height = 32; el.appendChild(cv);
    const n = document.createElement('div'); n.className = 'n'; n.textContent = got.n; el.appendChild(n);
    drawTileOn(cv.getContext('2d'), DEFS[got.id].tiles ? DEFS[got.id].tiles.top : DEFS[got.id].icon, 32);
    el.title = DEFS[got.id].label;
    el.onclick = (e) => { if (e.shiftKey) { this.autoCraft(r); } else this.fillGrid(r); };
    grid.appendChild(el);
  }
};
UI.fillGrid = function (r) {
  if (UI.mode !== 'craft3' && r.size && (r.size[0] > 2 || r.size[1] > 2)) { toast('Receita precisa da bancada 3×3', 'bad'); return; }
  if (r.dynamic) {
    INV.craft = new Array(9).fill(null);
    for (const lb of (TAGS.log || [])) { const lid = asItem(lb); if (INV.count(lid) > 0) { INV.craft[0] = { id: lid, n: 1 }; break; } }
    this.syncScreen();
    return;
  }
  const size = UI.mode === 'craft3' ? 3 : 2;
  INV.craft = new Array(9).fill(null);
  const used = Object.create(null);
  const takeOne = (ids) => {
    for (const L of [INV.hot, INV.main]) for (let i = 0; i < L.length; i++) {
      const s = L[i]; if (!s) continue;
      if (ids.includes(s.id) && (used[s.id] || 0) < s.n) { used[s.id] = (used[s.id] || 0) + 1; return s.id; }
    }
    return 0;
  };
  if (r.shapeless) {
    let k = 0;
    const slots = size === 2 ? [0, 1, 3, 4] : [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (const [key, n] of r.shapeless) {
      const acc = acceptIds(key);
      for (let i = 0; i < n; i++) { const id = takeOne(acc || [asItem(ID[key])]); if (!id) return this.syncCraft(); INV.craft[slots[k++]] = { id, n: 1 }; }
    }
  } else {
    const pw = r.size[0], ph = r.size[1];
    const ox = 0, oy = 0;
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
      const acc = acceptIds(r.map[r.rows[y][x]]);
      if (!acc) continue;
      const id = takeOne(acc);
      if (!id) { toast('Faltam materiais', 'bad'); return this.syncCraft(); }
      INV.craft[(oy + y) * 3 + (ox + x)] = { id, n: 1 };
    }
  }
  this.syncScreen();
};
UI.autoCraft = function (r) {
  this.fillGrid(r);
  const { cells, size } = gridState();
  if (cells.some((c) => c) && matchRecipe(cells, size)) this.doCraft(1);
};

/* ----------------------------------------------- encantamentos e criativo */
function bookshelvesNear(x, y, z) {
  let n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    if (!dx && !dz) continue;
    for (let dy = 0; dy <= 1; dy++) if (world.block(x + dx, y + dy, z + dz) === B.bookshelf) n++;
  }
  return Math.min(15, n);
}
UI.openEnchant = function (x, y, z) { this.show('enchant', [x, y, z]); };
UI.enchantEl = function () {
  const box = document.createElement('div');
  box.className = 'ench';
  const st = INV.heldStack();
  const def = st && DEFS[st.id];
  const kind = def && def.tool ? def.tool : def && def.armor !== undefined ? 'armor' : def && def.use === 'bow' ? 'bow' : null;
  const shelves = bookshelvesNear(this.pos[0], this.pos[1], this.pos[2]);
  const maxLvl = Math.min(30, 5 + shelves * 2);
  const head = document.createElement('div');
  head.innerHTML = '<h4 style="margin:0 0 4px">Encantamentos</h4><div style="font-size:11.5px;color:var(--muted)">Estantes próximas: <b>' + shelves + '/15</b> · nível máx. ' + maxLvl + '<br>Custo: 1 lápis-lazúli + níveis de XP</div>';
  box.appendChild(head);
  if (!kind) { const p = document.createElement('div'); p.style.cssText = 'font-size:12.5px;color:var(--warn);padding:8px'; p.textContent = 'Segure uma ferramenta, arma, armadura ou arco na mão.'; box.appendChild(p); return box; }
  const poolFor = (dd) => {
    if (dd.tool) return ENCH_POOL[dd.tool] || ['efficiency', 'unbreaking'];
    if (dd.armor !== undefined) return dd.armor === 3 ? ['protection', 'feather', 'unbreaking'] : ['protection', 'unbreaking'];
    if (dd.use === 'bow') return ['power', 'unbreaking'];
    return ['unbreaking'];
  };
  const uniq = [...new Set(poolFor(def))];
  const st2 = xpState();
  [1, 2, 3].forEach((opt, oi) => {
    const cost = clamp(Math.round(maxLvl * [.25, .55, 1][oi]), 1, 30);
    const b = document.createElement('button');
    const has = INV.count(I.lapis) >= 1;
    const power = 1 + (cost >= 20 ? 2 : cost >= 12 ? 1 : 0) + oi;
    b.innerHTML = '<b>Opção ' + (oi + 1) + '</b> — ' + uniq.slice(0, 3).map((k) => ENCH[k].label + ' ' + roman(clamp(Math.ceil(power / 6), 1, ENCH[k].max))).join(' / ') +
      '<small>' + cost + ' níveis' + (st2.lvl >= cost ? '' : ' (você tem ' + st2.lvl + ')') + ' · 1 lápis</small>';
    b.disabled = !has || st2.lvl < cost;
    b.onclick = () => {
      if (!spendLevels(cost)) { toast('XP insuficiente', 'bad'); return; }
      if (!INV.take(I.lapis, 1)) return;
      const key = uniq[(Math.random() * uniq.length) | 0];
      const lvl = clamp(Math.ceil(power / 6), 1, ENCH[key].max);
      const s = INV.heldStack();
      if (s) { s.ench = s.ench || {}; s.ench[key] = Math.max(s.ench[key] || 0, lvl); }
      statsInc('enchanted'); Sound.orb(); toast('✦ ' + ENCH[key].label + ' ' + roman(lvl) + ' em ' + (s ? DEFS[s.id].label : 'item'));
      this.close();
      this.syncHotbar();
    };
    box.appendChild(b);
  });
  const em = document.createElement('button');
  em.innerHTML = '<b>Trocar 1 esmeralda</b> — +3 níveis de XP<small>Esmeraldas viram experiência</small>';
  em.disabled = INV.count(I.emerald) < 1;
  em.onclick = () => { if (INV.take(I.emerald, 1)) { addXp(60); this.build(); } };
  box.appendChild(em);
  const info = document.createElement('div');
  info.style.cssText = 'font-size:11px;color:var(--muted)';
  info.innerHTML = uniq.map((k) => '✦ ' + ENCH[k].label + ': ' + ENCH[k].desc(1)).join('<br>');
  box.appendChild(info);
  return box;
};
UI.paletteEl = function () {
  const box = document.createElement('div');
  box.style.cssText = 'width:min(620px,80vw)';
  const inp = document.createElement('input');
  inp.placeholder = 'Buscar bloco ou item…';
  inp.style.cssText = 'width:100%;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding:8px 10px;color:var(--text);margin-bottom:8px';
  const grid = document.createElement('div'); grid.className = 'palette';
  const render = () => {
    grid.innerHTML = '';
    const q = inp.value.toLowerCase();
    for (let i = 0; i < DEFS.length; i++) {
      const d = DEFS[i];
      let id;
      if (d.kind === 'block') { id = d.item; if (id === undefined) continue; }
      else if (d.kind === 'item') id = d.idx;
      else continue;
      const dd = DEFS[id];
      if (q && dd.label.toLowerCase().indexOf(q) < 0) continue;
      const el = document.createElement('div'); el.className = 'slot';
      const cv = document.createElement('canvas'); cv.width = cv.height = 32; el.appendChild(cv);
      drawTileOn(cv.getContext('2d'), dd.tiles ? dd.tiles.top : dd.icon, 32);
      el.title = dd.label;
      el.onclick = () => { UI.held = { id, n: dd.stack > 1 ? dd.stack : 1 }; $('held').classList.remove('hidden'); paintHeld(UI.held); Sound.click(); };
      grid.appendChild(el);
      if (grid.children.length > 400) break;
    }
  };
  inp.oninput = render;
  render();
  box.appendChild(inp); box.appendChild(grid);
  const note = document.createElement('div');
  note.style.cssText = 'font-size:11.5px;color:var(--muted);margin-top:6px';
  note.textContent = 'Modo criativo: clique para pegar um item; ele fica na mão do cursor e vai para o inventário ao fechar.';
  box.appendChild(note);
  return box;
};
