/* ────────────────────────────────────────────────────────────────────────────
   Parallax · estado compartilhado (chrome.storage.local)
   Um objeto pequeno e versionado. Nada sai do dispositivo: storage.local
   não sincroniza, não tem conta e não tem servidor.
   ──────────────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";

  var KEY = "parallax.v1";

  var DEFAULTS = {
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

  var memory = Object.assign({}, DEFAULTS);
  var hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

  function merge(saved) {
    if (!saved || typeof saved !== "object") return Object.assign({}, DEFAULTS, { stats: Object.assign({}, DEFAULTS.stats) });
    return Object.assign({}, DEFAULTS, saved, {
      stats: Object.assign({}, DEFAULTS.stats, saved.stats || {})
    });
  }

  function get() {
    return new Promise(function (resolve) {
      if (!hasChrome) return resolve(memory);
      chrome.storage.local.get(KEY, function (res) {
        memory = merge(res && res[KEY]);
        resolve(memory);
      });
    });
  }

  function patch(partial) {
    return new Promise(function (resolve) {
      get().then(function (current) {
        var next = Object.assign({}, current, partial, {
          stats: Object.assign({}, current.stats, (partial && partial.stats) || {})
        });
        memory = next;
        if (!hasChrome) return resolve(next);
        var obj = {};
        obj[KEY] = next;
        chrome.storage.local.set(obj, function () {
          resolve(next);
        });
      });
    });
  }

  function bump(field, by) {
    return get().then(function (current) {
      var stats = Object.assign({}, current.stats);
      stats[field] = (stats[field] || 0) + (by || 1);
      return patch({ stats: stats });
    });
  }

  function reset() {
    return patch(Object.assign({}, DEFAULTS, { stats: Object.assign({}, DEFAULTS.stats, { since: Date.now() }) }));
  }

  root.ParallaxStore = {
    get: get,
    patch: patch,
    bump: bump,
    reset: reset,
    DEFAULTS: DEFAULTS,
    KEY: KEY
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
