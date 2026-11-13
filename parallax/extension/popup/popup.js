/* ────────────────────────────────────────────────────────────────────────────
   Parallax · popup
   Lê/escreve o estado local e manda comandos para a aba ativa.
   Não fala com nenhum servidor.
   ──────────────────────────────────────────────────────────────────────────── */

const KEY = "parallax.v1";
const DEFAULTS = {
  version: 1,
  enabled: true,
  mode: "aprendizado",
  level: "intermediario",
  intensity: 0.85,
  calmContrast: 0.35,
  suppressed: true,
  autoScan: true,
  domainAllowlist: [],
  domainBlocklist: [],
  stats: { pages: 0, rewrites: 0, patterns: 0, since: Date.now() }
};

const MODE_HINTS = {
  aprendizado: "reescreve no seu nível, cria glossário e reduz densidade sem perder conteúdo",
  pesquisa: "uniformiza a leitura e destaca termos definidos; ideal com o grafo da demo",
  compra: "evidencia urgência falsa, escassez e prova social fabricada",
  foco: "suprime anúncios, feeds e notificações — sem bloquear o acesso",
  calma: "dessatura a página, esconde métricas e reduz estímulo ao mínimo"
};

let state = { ...DEFAULTS, stats: { ...DEFAULTS.stats } };

function $(sel) {
  return document.querySelector(sel);
}

function toast(text) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

async function load() {
  const res = await chrome.storage.local.get(KEY);
  const saved = res[KEY];
  state = { ...DEFAULTS, ...(saved || {}), stats: { ...DEFAULTS.stats, ...((saved && saved.stats) || {}) } };
  if (!saved) await save();
  render();
  await refreshTabMeta();
}

async function save(patch = {}) {
  state = { ...state, ...patch, stats: { ...state.stats, ...(patch.stats || {}) } };
  await chrome.storage.local.set({ [KEY]: state });
  render();
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function refreshTabMeta() {
  const tab = await activeTab();
  const host = $("#host");
  if (!tab || !tab.url || !/^https?:/.test(tab.url)) {
    if (host) host.textContent = "página não suportada";
    return;
  }
  try {
    host.textContent = new URL(tab.url).hostname;
  } catch {
    host.textContent = "aba ativa";
  }
  try {
    const stats = await chrome.runtime.sendMessage({ type: "popup:stats" });
    if (stats && stats.ok !== false) {
      $("#s-blocks").textContent = stats.rewritten ?? "0";
      $("#s-removed").textContent = stats.removed ?? "0";
      $("#s-patterns").textContent = stats.patterns ?? "0";
    }
  } catch {
    $("#s-blocks").textContent = "—";
  }
}

function render() {
  const toggle = $("#toggle");
  toggle.setAttribute("aria-checked", String(state.enabled));

  document.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === state.mode);
    btn.onclick = async () => {
      await save({ mode: btn.dataset.mode });
      await send({ type: "popup:apply" });
      toast(`Modo ${btn.textContent} aplicado`);
      setTimeout(refreshTabMeta, 700);
    };
  });

  document.querySelectorAll("[data-level]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.level === state.level);
    btn.onclick = async () => {
      await save({ level: btn.dataset.level });
      await send({ type: "popup:apply" });
      setTimeout(refreshTabMeta, 700);
    };
  });

  const intensity = $("#intensity");
  intensity.value = String(Math.round(state.intensity * 100));
  $("#intensity-val").textContent = `${Math.round(state.intensity * 100)}%`;
  intensity.oninput = () => {
    $("#intensity-val").textContent = `${intensity.value}%`;
  };
  intensity.onchange = async () => {
    await save({ intensity: Number(intensity.value) / 100 });
    await send({ type: "popup:apply" });
  };

  $("#suppressed").checked = state.suppressed;
  $("#suppressed").onchange = async (e) => {
    await save({ suppressed: e.target.checked });
    await send({ type: "popup:apply" });
  };

  $("#autoscan").checked = state.autoScan;
  $("#autoscan").onchange = async (e) => {
    await save({ autoScan: e.target.checked });
    await send({ type: "popup:apply" });
  };

  $("#mode-hint").textContent = MODE_HINTS[state.mode] || "";

  $("#s-pages").textContent = state.stats.pages ?? 0;
  $("#s-total").textContent = state.stats.rewrites ?? 0;
  $("#s-patterns-total").textContent = state.stats.patterns ?? 0;
}

async function send(message) {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch {
    return { ok: false };
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await load();

  $("#toggle").onclick = async () => {
    const enabled = !state.enabled;
    await save({ enabled });
    await send({ type: enabled ? "popup:apply" : "popup:restore" });
    toast(enabled ? "Parallax ativo nesta página" : "Original restaurado");
    setTimeout(refreshTabMeta, 700);
  };

  $("#apply").onclick = async () => {
    const res = await send({ type: "popup:apply" });
    toast(res && res.ok ? "Reescrito localmente" : (res && res.error) || "Não foi possível nesta página");
    setTimeout(refreshTabMeta, 800);
  };

  $("#restore").onclick = async () => {
    await send({ type: "popup:restore" });
    toast("Original restaurado");
    setTimeout(refreshTabMeta, 500);
  };

  $("#reset").onclick = async () => {
    await chrome.storage.local.set({ [KEY]: { ...DEFAULTS, stats: { ...DEFAULTS.stats, since: Date.now() } } });
    state = { ...DEFAULTS, stats: { ...DEFAULTS.stats } };
    render();
    toast("Dados do dispositivo zerados");
  };

  $("#open-demo").onclick = () => {
    chrome.tabs.create({ url: "https://github.com/thiagoronyzz/Funcoes/tree/main/parallax" }).catch(() => toast("Abra parallax/ no repositório"));
  };
});
