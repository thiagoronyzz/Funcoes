
/* ================================================== HUD, INVENTÁRIO, TELAS = */
const UI = {
  open: null, pos: null, held: null, mode: null, flash: 0,
  tiles: { full: ATLAS.T('heart_full'), half: ATLAS.T('heart_half'), empty: ATLAS.T('heart_empty') },
  init() {
    const hb = $('hotbar');
    for (let i = 0; i < 9; i++) {
      const el = document.createElement('div');
      el.className = 'slot'; el.dataset.list = 'hot'; el.dataset.i = i;
      el.appendChild(document.createElement('canvas'));
      const n = document.createElement('div'); n.className = 'n'; el.appendChild(n);
      hb.appendChild(el);
    }
    const row = (host, n, cls) => {
      const host2 = $(host); host2.innerHTML = '';
      for (let i = 0; i < n; i++) { const c = document.createElement('canvas'); c.width = c.height = 24; host2.appendChild(c); }
      return host2;
    };
    this.hearts = row('hearts', 10); this.food = row('hunger', 10);
    this.armor = row('armorbar', 10); this.breath = row('breath', 10);
    this.syncHotbar(); this.syncVitals();
  },
  slotStack(list, i) {
    if (list === 'hot') return INV.hot[i];
    if (list === 'main') return INV.main[i];
    if (list === 'craft') return INV.craft[i];
    if (list === 'armor') return INV.armor[i];
    if (list === 'out') return INV.craftOut;
    if (list === 'off') return INV.off;
    if (list === 'fin') return this.furnace && this.furnace.data.in;
    if (list === 'ffuel') return this.furnace && this.furnace.data.fuel;
    if (list === 'fout') return this.furnace && this.furnace.data.out;
    if (list === 'chest') { const c = world.chests.get(this.key || ''); return c && c[i]; }
    return null;
  },
  setSlot(list, i, v) {
    if (list === 'hot') INV.hot[i] = v; else if (list === 'main') INV.main[i] = v;
    else if (list === 'craft') { INV.craft[i] = v; this.syncCraft(); }
    else if (list === 'armor') INV.armor[i] = v; else if (list === 'off') INV.off = v;
    else if (list === 'out') INV.craftOut = v;
    else if (list === 'fin') this.furnace.data.in = v;
    else if (list === 'ffuel') this.furnace.data.fuel = v;
    else if (list === 'fout') this.furnace.data.out = v;
    else if (list === 'chest') { const k = this.key || ''; if (!world.chests.has(k)) world.chests.set(k, new Array(27).fill(null)); world.chests.get(k)[i] = v; }
  },
  paint(el, st) {
    if (!el) return;
    const cv = el.querySelector('canvas'), g = cv.getContext('2d');
    const n = el.querySelector('.n') || (() => { const d = document.createElement('div'); d.className = 'n'; el.appendChild(d); return d; })();
    g.clearRect(0, 0, cv.width, cv.height);
    if (!st) { n.textContent = ''; const du = el.querySelector('.dur'); if (du) du.remove(); const ec = el.querySelector('.ench'); if (ec) ec.remove(); el.dataset.id = ''; return; }
    const def = DEFS[st.id];
    const tile = def.kind === 'blockitem' || def.kind === 'block' ? (def.tiles ? def.tiles.top : def.icon) : def.icon;
    drawTileOn(g, tile === undefined ? ATLAS.T('missing') : tile, cv.width);
    if (st.n > 1) n.textContent = st.n; else n.textContent = '';
    el.dataset.id = st.id;
    let du = el.querySelector('.dur');
    if (def.dur) {
      if (!du) {
        du = document.createElement('div'); du.className = 'dur';
        const bar = document.createElement('i'); du.appendChild(bar); el.appendChild(du);
      }
      const f = clamp((st.dur === undefined ? def.dur : st.dur) / def.dur, 0, 1);
      du.firstChild.style.width = (f * 100) + '%';
      du.firstChild.style.background = f > .5 ? 'var(--ok)' : f > .22 ? 'var(--warn)' : 'var(--danger)';
    } else if (du) du.remove();
    let ec = el.querySelector('.ench');
    if (st.ench && Object.keys(st.ench).length) { if (!ec) { ec = document.createElement('div'); ec.className = 'ench'; ec.textContent = '✦'; el.appendChild(ec); } }
    else if (ec) ec.remove();
  },
  syncHotbar() {
    const els = $('hotbar').children;
    if (!els || els.length < 9) return;
    for (let i = 0; i < 9; i++) { this.paint(els[i], INV.hot[i]); els[i].classList.toggle('sel', i === Player.held); }
    updateHeldView();
  },
  syncScreen() {
    const root = $('screenRoot');
    root.querySelectorAll('.slot[data-list]').forEach((el) => this.paint(el, this.slotStack(el.dataset.list, +el.dataset.i)));
    if (this.mode === 'inv' || this.mode === 'craft3') this.syncCraft();
  },
  syncCrack() {
    if (!Player.mineBlock || Player.mineProgress <= 0.001) { crackMesh.visible = false; return; }
    const [x, y, z] = Player.mineBlock.split(',').map(Number);
    crackMesh.visible = true;
    crackMesh.position.set(x + .5, y + .5, z + .5);
    const st = clamp(Math.floor(Player.mineProgress * 10), 0, 9);
    CRACK_TEX.offset.set(st / 10, 0);
    CRACK_TEX.needsUpdate = true;
    $('actionbar').textContent = Math.round(Player.mineProgress * 100) + '%  ·  ' + DEFS[world.block(x, y, z)].label;
  },
  syncVitals() {
    if (!this.hearts || !this.food) return;
    const hp = Player.hp, fd = Player.food;
    const st = xpState();
    for (let i = 0; i < 10; i++) {
      const c = this.hearts.children[i]; const v = clamp(hp - i * 2, 0, 2);
      drawTileOn(c.getContext('2d'), v >= 2 ? this.tiles.full : v >= 1 ? this.tiles.half : this.tiles.empty, 24);
    }
    for (let i = 0; i < 10; i++) {
      const c = this.food.children[i]; const v = clamp(Math.round(fd) - i, 0, 1);
      drawTileOn(c.getContext('2d'), v >= 1 ? ATLAS.T('food_full') : ATLAS.T('food_empty'), 24);
    }
    const def0 = totalDefense();
    const showArmor = def0 > 0 || INV.armor.some((s) => s);
    const armorBar = this.armor.parentElement || this.armor;
    if (armorBar) armorBar.style.display = showArmor ? 'flex' : 'none';
    if (showArmor) for (let i = 0; i < 10; i++) { const v = clamp(Math.ceil(def0 * 10) - i, 0, 1); drawTileOn(this.armor.children[i].getContext('2d'), v ? ATLAS.T('armor_full') : ATLAS.T('armor_empty'), 24); }
    const underwater = Player.air < 10;
    const breathBar = this.breath.parentElement || this.breath;
    if (breathBar) breathBar.style.display = underwater ? 'flex' : 'none';
    if (underwater) for (let i = 0; i < 10; i++) { const v = clamp(Math.ceil(Player.air) - i, 0, 1); drawTileOn(this.breath.children[i].getContext('2d'), v ? ATLAS.T('bubble_full') : ATLAS.T('bubble_empty'), 24); }
    $('xpfill').style.width = clamp(st.cur / st.need, 0, 1) * 100 + '%';
    $('xplevel').textContent = st.lvl;
  },
  /* ------------------------------------------------------------- telas */
  close() {
    if (this.held) { if (INV.addFull(this.held) > 0) dropStackWorld(this.held); this.held = null; $('held').classList.add('hidden'); }
    this.open = null; this.mode = null; this.pos = null; this.key = null; this.furnace = null;
    INV.craft = new Array(9).fill(null); INV.craftOut = null;
    $('screenRoot').innerHTML = ''; $('screenRoot').classList.remove('on');
    $('tooltip').classList.add('hidden');
    requestLock();
    Sound.click();
  },
  openCraft(mode) {
    this.show(mode, null);
  },
  show(mode, pos) {
    if (!Game.running) return;
    document.exitPointerLock && document.exitPointerLock();
    this.open = mode === 'inv' ? 'Inventário' : mode === 'craft3' ? 'Bancada de trabalho' : mode === 'furnace' ? 'Fornalha' : mode === 'chest' ? 'Baú' : mode === 'enchant' ? 'Mesa de encantamentos' : 'Criativo';
    this.mode = mode; this.pos = pos; this.key = pos ? pos.join(',') : null;
    if (mode === 'furnace') this.furnace = { data: furnaceData(pos[0], pos[1], pos[2]) };
    this.build();
    Sound.click();
  },
  build() {
    const root = $('screenRoot');
    const wrap = document.createElement('div');
    wrap.className = 'bench';
    const title = document.createElement('div');
    title.style.cssText = 'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:23;font-weight:700;font-size:14px;color:#dce8ff;text-shadow:0 2px 6px #000;pointer-events:none';
    title.textContent = this.open;
    const mkSlot = (list, i, cls) => {
      const el = document.createElement('div');
      el.className = 'slot ' + (cls || '');
      el.dataset.list = list; el.dataset.i = i;
      el.appendChild(document.createElement('canvas'));
      return el;
    };
    const grid = (list, n, cols) => {
      const g = document.createElement('div'); g.className = 'g g' + cols;
      for (let i = 0; i < n; i++) g.appendChild(mkSlot(list, i));
      return g;
    };
    const side = document.createElement('div');
    if (this.mode === 'inv' || this.mode === 'craft3') {
      const craftWrap = document.createElement('div');
      craftWrap.innerHTML = '<h4>' + (this.mode === 'craft3' ? 'Criação 3×3' : 'Criação 2×2') + '</h4>';
      const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:14px;align-items:center';
      const g = document.createElement('div'); g.className = 'g ' + (this.mode === 'craft3' ? 'g3' : 'g2');
      const cells = this.mode === 'craft3' ? 9 : 4;
      for (let i = 0; i < cells; i++) {
        const el = mkSlot('craft', this.mode === 'craft3' ? i : [0, 1, 3, 4][i]);
        g.appendChild(el);
      }
      const arrow = document.createElement('div'); arrow.className = 'arrow';
      const out = mkSlot('out', 0); out.style.boxShadow = 'inset 0 0 0 2px rgba(45,191,155,.6)';
      row.appendChild(g); row.appendChild(arrow); row.appendChild(out);
      craftWrap.appendChild(row);
      side.appendChild(craftWrap);
      if (this.mode === 'craft3') side.appendChild(this.recipeBookEl());
    }
    if (this.mode === 'furnace') side.appendChild(this.furnaceEl(mkSlot));
    if (this.mode === 'chest') side.appendChild(grid('chest', 27, 9));
    if (this.mode === 'enchant') side.appendChild(this.enchantEl());
    if (this.mode === 'creative') side.appendChild(this.paletteEl());
    wrap.appendChild(side);
    const playerBox = document.createElement('div');
    if (this.mode === 'inv' || this.mode === 'craft3') {
      const box = document.createElement('div'); box.style.cssText = 'display:flex;gap:16px;align-items:center';
      const ar = document.createElement('div');
      ar.className = 'g g2'; ar.style.gridTemplateColumns = 'repeat(1,48px)';
      ['Capacete', 'Peitoral', 'Calça', 'Botas'].forEach((nm, i) => { const el = mkSlot('armor', i); el.title = nm; ar.appendChild(el); });
      box.appendChild(ar);
      playerBox.appendChild(box);
    }
    const inv = document.createElement('div');
    inv.innerHTML = '<h4 style="margin-top:10px">Inventário</h4>';
    inv.appendChild(grid('main', 27, 9));
    const hb = document.createElement('div'); hb.style.marginTop = '8px';
    hb.innerHTML = '<h4 style="margin:8px 0 4px">Barra rápida</h4>';
    hb.appendChild(grid('hot', 9, 9));
    inv.appendChild(hb);
    const offCol = document.createElement('div');
    offCol.style.cssText = 'display:flex;flex-direction:column;gap:6px;align-items:center';
    offCol.appendChild(mkSlot('off', 0));
    const offLbl = document.createElement('div'); offLbl.textContent = 'Mão esq.'; offLbl.style.cssText = 'font-size:11px;color:var(--muted)';
    offCol.appendChild(offLbl);
    playerBox.appendChild(offCol);
    wrap.appendChild(playerBox);
    const btns = document.createElement('div');
    btns.className = 'btnrow';
    btns.style.cssText = 'position:fixed;right:16px;bottom:14px;z-index:23';
    const b1 = document.createElement('button'); b1.className = 'btn'; b1.textContent = 'Fechar (E)'; b1.onclick = () => UI.close();
    const b2 = document.createElement('button'); b2.className = 'btn btn--ghost'; b2.textContent = 'Salvar mundo'; b2.onclick = () => { saveWorld(); toast('Mundo salvo'); };
    btns.appendChild(b1); btns.appendChild(b2);
    root.innerHTML = '';
    root.appendChild(title); root.appendChild(wrap); root.appendChild(btns);
    root.classList.add('on');
    this.syncScreen();
    const el = wrap;
    el.addEventListener('mousedown', (e) => this.onSlot(e));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  },
  onSlot(e) {
    const el = e.target.closest('.slot');
    if (!el) return;
    const list = el.dataset.list, i = +el.dataset.i;
    const shift = e.shiftKey, right = e.button === 2;
    if (list === 'out') { this.doCraft(shift ? 99 : 1); return; }
    if (list === 'fout') {
      const st = this.slotStack('fout', 0);
      if (st) { const left = INV.add(st.id, st.n); this.setSlot('fout', 0, left > 0 ? { id: st.id, n: left } : null); this.syncScreen(); Sound.pickup(); }
      return;
    }
    const cur = this.slotStack(list, i);
    if (shift && cur && DEFS[cur.id].armor !== undefined && list !== 'armor') {
      const slot = DEFS[cur.id].armor;
      const old = INV.armor[slot];
      INV.armor[slot] = { id: cur.id, n: 1, dur: cur.dur, ench: cur.ench };
      this.setSlot(list, i, old || null);
      Sound.click(); this.syncScreen(); this.syncHotbar(); this.syncVitals();
      return;
    }
    if (shift && cur) {
      const toMain = list !== 'main' && list !== 'hot';
      const L = toMain ? INV.main : INV.hot;
      const other = toMain ? INV.hot : INV.main;
      const def = DEFS[cur.id];
      for (let k = 0; k < L.length; k++) if (L[k] && L[k].id === cur.id && L[k].n < def.stack) { const t = Math.min(def.stack - L[k].n, cur.n); L[k].n += t; cur.n -= t; if (cur.n <= 0) break; }
      if (cur.n > 0) for (let k = 0; k < L.length; k++) if (!L[k]) { L[k] = cur; cur = null; break; }
      this.setSlot(list, i, cur);
      Sound.click(); this.syncScreen(); this.syncHotbar();
      return;
    }
    if (!this.held) {
      if (!cur) return;
      if (right) { const half = Math.ceil(cur.n / 2); this.held = { id: cur.id, n: half, dur: cur.dur, ench: cur.ench }; cur.n -= half; if (cur.n <= 0) this.setSlot(list, i, null); }
      else { this.held = cur; this.setSlot(list, i, null); }
    } else {
      const h = this.held;
      if (!cur) {
        if (right) { this.setSlot(list, i, { id: h.id, n: 1, dur: h.dur, ench: h.ench }); h.n--; if (h.n <= 0) this.held = null; }
        else { this.setSlot(list, i, h); this.held = null; }
      } else if (cur.id === h.id && DEFS[cur.id].stack > 1) {
        const space = DEFS[cur.id].stack - cur.n;
        const t = right ? Math.min(1, space) : Math.min(space, h.n);
        cur.n += t; h.n -= t;
        if (h.n <= 0) this.held = null;
      } else { this.setSlot(list, i, h); this.held = cur; }
    }
    Sound.click();
    this.syncScreen(); this.syncHotbar();
    $('held').classList.toggle('hidden', !this.held);
    if (this.held) paintHeld(this.held);
  },
};
function paintHeld(st) {
  const el = $('held');
  el.innerHTML = '';
  const c = document.createElement('canvas'); c.width = c.height = 44;
  const def = DEFS[st.id];
  const bd = def.block !== undefined ? DEFS[def.block] : def;
  const tile = (bd.tiles && bd.tiles.top !== undefined) ? bd.tiles.top : def.icon;
  drawTileOn(c.getContext('2d'), tile, 44);
  el.appendChild(c);
  if (st.n > 1) { const n = document.createElement('div'); n.textContent = st.n; n.style.cssText = 'position:absolute;right:2px;bottom:-2px;font:700 13px var(--ui);text-shadow:1px 1px 0 #000'; el.appendChild(n); }
}
addEventListener('mousemove', (e) => {
  const h = $('held');
  h.style.left = e.clientX + 'px'; h.style.top = e.clientY + 'px';
  const t = e.target.closest ? e.target.closest('.slot[data-id]') : null;
  const tip = $('tooltip');
  if (t && t.dataset.id && UI.open) {
    const st = UI.slotStack(t.dataset.list, +t.dataset.i);
    if (st) {
      const def = DEFS[st.id];
      tip.innerHTML = '<b>' + def.label + '</b>';
      if (def.dur) tip.innerHTML += '<em>Durabilidade ' + (st.dur === undefined ? def.dur : st.dur) + ' / ' + def.dur + '</em>';
      if (def.food !== undefined) tip.innerHTML += '<i>' + def.food + ' pontos de fome' + (def.heal ? ' · +' + def.heal + ' vida' : '') + '</i>';
      if (def.tool) tip.innerHTML += '<i>' + TIER_NAME[def.tier] + ' · velocidade ' + fmt(def.speed, 0) + ' · dano ' + def.dmg + '</i>';
      if (def.armor !== undefined) tip.innerHTML += '<i>Armadura · defesa ' + def.defense + '</i>';
      if (st.ench) for (const k in st.ench) tip.innerHTML += '<em>✦ ' + ENCH[k].label + ' ' + roman(st.ench[k]) + '</em>';
      if (def.res !== undefined && def.kind === 'block') tip.innerHTML += '<i>Dureza ' + def.hard + ' · resistência ' + def.res + '</i>';
      tip.classList.remove('hidden');
      tip.style.left = Math.min(innerWidth - 300, e.clientX + 14) + 'px';
      tip.style.top = (e.clientY + 16) + 'px';
      return;
    }
  }
  tip.classList.add('hidden');
});
function roman(n) { return n >= 2 ? ['', '', 'II', 'III', 'IV', 'V'][n] || String(n) : ''; }
