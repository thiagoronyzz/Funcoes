/* ────────────────────────────────────────────────────────────────────────────
   Parallax · service worker (MV3)
   Não faz rede. Só inicializa o estado e encaminha comandos do popup/atalhos
   para a aba ativa.
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

chrome.runtime.onInstalled.addListener(async (details) => {
  const current = await chrome.storage.local.get(KEY);
  if (!current[KEY]) {
    await chrome.storage.local.set({ [KEY]: DEFAULTS });
  }
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup/welcome.html") }).catch(() => {});
  }
});

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

async function sendToActive(message) {
  const tab = await activeTab();
  if (!tab || !tab.id) return { ok: false, error: "sem aba ativa" };
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (err) {
    return { ok: false, error: "content script não disponível nesta página" };
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-panel") await sendToActive({ type: "parallax:togglePanel" });
  if (command === "toggle-enabled") {
    const current = await chrome.storage.local.get(KEY);
    const state = current[KEY] || DEFAULTS;
    const next = { ...state, enabled: !state.enabled };
    await chrome.storage.local.set({ [KEY]: next });
    const tab = await activeTab();
    if (tab && tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: next.enabled ? "parallax:apply" : "parallax:restore" });
      } catch {
        /* página sem content script */
      }
    }
  }
});

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  (async () => {
    if (!msg || !msg.type) return respond({ ok: false });

    if (msg.type === "popup:apply") {
      const tab = await activeTab();
      if (tab && tab.id) {
        try {
          respond(await chrome.tabs.sendMessage(tab.id, { type: "parallax:apply" }));
          return;
        } catch {
          // injeta sob demanda em páginas abertas antes da instalação
          try {
            await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["content/parallax.css"] });
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["shared/rewrite.js", "shared/darkpatterns.js", "shared/store.js", "content/content.js"]
            });
            respond({ ok: true, injected: true });
            return;
          } catch (err) {
            respond({ ok: false, error: String(err) });
            return;
          }
        }
      }
      respond({ ok: false, error: "sem aba" });
      return;
    }

    if (msg.type === "popup:restore") {
      respond(await sendToActive({ type: "parallax:restore" }));
      return;
    }

    if (msg.type === "popup:stats") {
      respond(await sendToActive({ type: "parallax:stats" }));
      return;
    }

    if (msg.type === "popup:reset") {
      await chrome.storage.local.set({ [KEY]: { ...DEFAULTS, stats: { ...DEFAULTS.stats, since: Date.now() } } });
      respond({ ok: true });
      return;
    }

    respond({ ok: false, error: "comando desconhecido" });
  })();
  return true;
});
