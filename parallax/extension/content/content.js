/* ────────────────────────────────────────────────────────────────────────────
   Parallax · content script
   Este é o "DOM Rewriter" rodando de verdade numa página real:

   1. acha o content root por densidade de texto (não observa o documento todo)
   2. reescreve parágrafos com o motor local, guardando o original em WeakMap
   3. MutationObserver seletivo com debounce de 120 ms
   4. suprime estímulo nos modos foco/calma (sem bloquear acesso)
   5. detecta dark patterns e mostra no painel
   6. aplica/desfaz tudo com um clique — nada é destrutivo

   Sem fetch, sem eval, sem servidor. CSP da página respeitada.
   ──────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  if (window.__parallaxActive) return;
  window.__parallaxActive = true;

  var R = window.ParallaxRewrite;
  var D = window.ParallaxDarkPatterns;
  var S = window.ParallaxStore;
  if (!R || !D || !S) {
    console.warn("[Parallax] bibliotecas compartilhadas não carregaram; abortando.");
    return;
  }

  var MODES = {
    aprendizado: { label: "Aprendizado", cls: "parallax-learning" },
    pesquisa: { label: "Pesquisa", cls: "parallax-research" },
    compra: { label: "Compra", cls: "parallax-shopping" },
    foco: { label: "Foco", cls: "parallax-focus" },
    calma: { label: "Calma", cls: "parallax-calm" }
  };

  var state = null;
  var root = null;
  var shadow = null;
  var observer = null;
  var rewriteTimer = null;
  var originals = new WeakMap();
  var rewritten = 0;
  var removed = 0;
  var patterns = [];
  var glossaryIndex = buildGlossary();
  var domain = location.hostname;
  var panelOpen = false;
  /** restaurado pelo usuário: o observer não deve reescrever de novo */
  var restoredByUser = false;

  /* innerText não existe em todos os contextos; textContent é o fallback */
  function visibleText(el) {
    if (!el) return "";
    var t = el.innerText;
    if (typeof t === "string" && t.length) return t;
    return el.textContent || "";
  }

  /* ── glossário local ─────────────────────────────────────────────────────── */

  function buildGlossary() {
    var terms = {
      "atenção sustentada": "Capacidade de manter o foco numa tarefa ao longo do tempo.",
      "carga cognitiva": "Esforço mental simultâneo para entender e manipular informação.",
      "memória de trabalho": "Espaço mental de curto prazo: guarda poucos itens por segundos.",
      "economia da atenção": "Disputa pelo tempo e foco das pessoas como recurso escasso.",
      "viés de confirmação": "Tendência a aceitar o que confirma o que você já acredita.",
      "reforço intermitente": "Recompensa imprevisível — o mecanismo que sustenta feeds e caça-níqueis.",
      "dark pattern": "Desenho de interface que induz a uma escolha contra o seu interesse.",
      "cookie de rastreamento": "Identificador que acompanha você entre sites para perfilar comportamento.",
      "latitude": "Distância angular de um ponto em relação ao Equador.",
      "longitude": "Distância angular de um ponto em relação ao Meridiano de Greenwich.",
      "fotossíntese": "Processo em que plantas convertem luz em energia química.",
      "inflação": "Aumento generalizado e contínuo de preços.",
      "juros compostos": "Juros que incidem sobre juros já acumulados.",
      "algoritmo": "Sequência finita de passos para resolver um problema.",
      "machine learning": "Método em que o programa aprende padrões a partir de dados.",
      "biodiversidade": "Variedade de seres vivos em um ecossistema.",
      "mutação": "Alteração na sequência de DNA.",
      "proteína": "Molécula formada por aminoácidos com funções estruturais e catalíticas.",
      "energia renovável": "Energia de fontes que se regeneram, como sol, vento e água.",
      "inteligência artificial": "Sistemas capazes de executar tarefas que exigiriam inteligência humana.",
      "transformer": "Arquitetura de rede neural baseada em atenção usada por LLMs."
    };
    var out = [];
    Object.keys(terms).forEach(function (k) {
      out.push({ term: k, definition: terms[k] });
    });
    return out.sort(function (a, b) {
      return b.term.length - a.term.length;
    });
  }

  /* ── content root ───────────────────────────────────────────────────────── */

  function findContentRoot() {
    var candidates = document.querySelectorAll("article, main, [role=main], .content, #content, .post, .entry-content, section");
    var best = null;
    var bestScore = 0;

    function score(el) {
      var text = visibleText(el).trim();
      if (text.length < 400) return 0;
      var links = el.querySelectorAll("a").length;
      var paras = el.querySelectorAll("p").length;
      var density = text.length / Math.max(1, el.querySelectorAll("*").length);
      return paras * 12 + density * 1.6 - links * 3;
    }

    Array.prototype.forEach.call(candidates, function (el) {
      if (el.closest("#parallax-root")) return;
      var r = el.getBoundingClientRect();
      if (r.width < 260 || r.height < 120) return;
      var s = score(el);
      if (s > bestScore) {
        bestScore = s;
        best = el;
      }
    });

    if (!best) {
      var body = document.querySelector("main, article, body");
      if (body) best = body;
    }
    return best;
  }

  /* ── reescrita ──────────────────────────────────────────────────────────── */

  function collectParagraphs(rootEl) {
    var nodes = rootEl.querySelectorAll("p, li, blockquote, h2, h3");
    var out = [];
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.closest("#parallax-root")) return;
      if (el.closest("nav, footer, form, script, style, noscript")) return;
      if (el.querySelector("p, li, blockquote, h1, h2, h3, img, video, svg")) return;
      var text = visibleText(el).trim();
      if (text.length < 90 || text.length > 2400) return;
      if ((el.textContent.match(/[.!?]/g) || []).length < 2) return;
      out.push(el);
    });
    return out.slice(0, 220);
  }

  function applyRewrite(force) {
    try {
      applyRewriteInner(force);
    } catch (err) {
      console.warn("[Parallax] falha ao reescrever esta página:", err);
    }
  }

  function applyRewriteInner(force) {
    if (!state || !state.enabled) return;
    if (restoredByUser && !force) return;
    if (!force && !state.autoScan) return;
    var main = findContentRoot();
    if (!main) return;

    document.documentElement.classList.remove(
      "parallax-calm",
      "parallax-focus",
      "parallax-learning",
      "parallax-research",
      "parallax-shopping"
    );
    if (MODES[state.mode]) document.documentElement.classList.add(MODES[state.mode].cls);
    document.documentElement.classList.toggle("parallax-calm", state.mode === "calma");
    if (state.mode === "calma") document.documentElement.style.filter = "saturate(" + (0.2 + state.calmContrast * 0.4) + ") contrast(0.94)";

    var targets = collectParagraphs(main);
    var changed = 0;

    targets.forEach(function (el) {
      if (!originals.has(el)) originals.set(el, el.textContent);
      var original = originals.get(el);
      if (!original) return;

      if (state.mode === "calma") {
        if (state.suppressed && el.tagName === "BLOCKQUOTE") {
          el.classList.add("parallax-suppressed");
          return;
        }
      }

      var result = R.rewriteBlock({
        text: original,
        level: state.level,
        intensity: state.intensity,
        calm: state.mode === "calma",
        terms: glossaryIndex
      });

      if (result.text !== original) changed += 1;
      if (el.dataset.parallaxRewritten === "1" && el.textContent === result.text) return;

      el.textContent = result.text;
      el.dataset.parallaxRewritten = "1";
      el.title = "";
      el.setAttribute("data-parallax-before", String(result.complexityBefore));
      el.setAttribute("data-parallax-after", String(result.complexityAfter));
      if (result.notes.length > 0) {
        el.title = result.notes
          .slice(0, 5)
          .map(function (n) {
            return n.from + " → " + n.to + " (" + n.why + ")";
          })
          .join("\n");
      }
    });

    rewritten = changed;
    bumpStats({ rewrites: changed, pages: changed > 0 ? 1 : 0 });
    renderPanel();
  }

  function restoreAll() {
    restoredByUser = true;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (rewriteTimer) {
      clearTimeout(rewriteTimer);
      rewriteTimer = null;
    }
    var nodes = document.querySelectorAll("[data-parallax-rewritten='1'], .parallax-suppressed");
    Array.prototype.forEach.call(nodes, function (el) {
      var original = originals.get(el);
      if (typeof original === "string") el.textContent = original;
      delete el.dataset.parallaxRewritten;
      el.classList.remove("parallax-suppressed");
      el.removeAttribute("data-parallax-before");
      el.removeAttribute("data-parallax-after");
      el.title = "";
    });
    document.documentElement.classList.remove(
      "parallax-calm",
      "parallax-focus",
      "parallax-learning",
      "parallax-research",
      "parallax-shopping"
    );
    document.documentElement.style.filter = "";
    rewritten = 0;
    removed = 0;
    renderPanel();
  }

  function suppressStimulus() {
    if (!state || !state.suppressed) return;
    if (state.mode !== "foco" && state.mode !== "calma") return;
    var selectors = [
      "[class*='advert']",
      "[class*='sponsor']",
      "[class*='promo']",
      "[class*='newsletter']",
      "[class*='popup']",
      "[class*='cookie-banner']",
      "[class*='notification']",
      "[class*='autoplay']",
      "[class*='ticker']",
      "[id*='ad-']",
      "aside"
    ];
    var count = 0;
    selectors.forEach(function (sel) {
      try {
        document.querySelectorAll(sel).forEach(function (el) {
          if (el.closest("#parallax-root")) return;
          if (el.dataset.parallaxSuppressed === "1") return;
          if (el.tagName === "ASIDE" && state.mode === "foco") {
            el.classList.add("parallax-suppressed");
            el.dataset.parallaxSuppressed = "1";
            count += 1;
          } else if (sel !== "aside") {
            el.classList.add("parallax-suppressed");
            el.dataset.parallaxSuppressed = "1";
            count += 1;
          }
        });
      } catch (e) {
        /* seletor inválido em algum navegador antigo */
      }
    });
    removed = count;
    return count;
  }

  /* ── dark patterns ──────────────────────────────────────────────────────── */

  function scanPatterns() {
    if (!state) return [];
    var visible = visibleText(document.body);
    var comments = [];
    document.querySelectorAll("[class*='review'] p, [class*='comment'] p, [itemprop='reviewBody']").forEach(function (el) {
      var t = visibleText(el).trim();
      if (t && t.length < 400) comments.push(t);
    });
    var hits = D.scan(visible.slice(0, 60000));
    var fake = D.estimateFakeReviews(comments);
    if (fake.ratio > 0.25) {
      hits.push({
        kind: "review-suspeita",
        label: "Avaliações provavelmente artificiais",
        severity: fake.ratio > 0.5 ? "alta" : "media",
        evidence: fake.suspicious + " de " + comments.length + " reviews com elogio genérico e exclamações",
        why: "Padrão de reviews curtíssimas, simultâneas e com vocabulário repetido."
      });
    }
    patterns = hits;
    if (hits.length > 0) bumpStats({ patterns: hits.length });
    return hits;
  }

  /* ── painel (Shadow DOM) ────────────────────────────────────────────────── */

  function buildUI() {
    root = document.createElement("div");
    root.id = "parallax-root";
    root.style.all = "initial";
    shadow = root.attachShadow({ mode: "open" });
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("content/parallax.css");
    shadow.appendChild(link);
    var pill = document.createElement("div");
    pill.className = "px-pill";
    pill.id = "px-pill";
    shadow.appendChild(pill);
    var panel = document.createElement("div");
    panel.className = "px-panel";
    panel.id = "px-panel";
    panel.hidden = true;
    shadow.appendChild(panel);
    document.documentElement.appendChild(root);

    pill.addEventListener("click", function () {
      panelOpen = !panelOpen;
      panel.hidden = !panelOpen;
      if (panelOpen) {
        scanPatterns();
        renderPanel();
      }
    });
  }

  function renderPanel() {
    if (!shadow || !state) return;
    var pill = shadow.getElementById("px-pill");
    var panel = shadow.getElementById("px-panel");
    if (!pill || !panel) return;

    var active = MODES[state.mode] ? MODES[state.mode].label : state.mode;
    pill.innerHTML =
      '<span class="px-dot ' + (state.enabled ? "" : "px-off") + '"></span>' +
      '<span class="px-name">Parallax</span>' +
      '<span class="px-mode">' + esc(active) + (state.enabled ? "" : " · pausado") + "</span>" +
      (rewritten ? '<span class="px-count">' + rewritten + " blocos</span>" : "");

    var modeButtons = Object.keys(MODES)
      .map(function (m) {
        return (
          '<button type="button" class="px-mode-btn' +
          (state.mode === m ? " px-active" : "") +
          (m === "calma" ? " px-calma" : "") +
          '" data-mode="' + m + '">' + esc(MODES[m].label) + "</button>"
        );
      })
      .join("");

    var levels = ["iniciante", "intermediario", "avancado"]
      .map(function (l) {
        return (
          '<button type="button" class="px-level-btn' + (state.level === l ? " px-active" : "") + '" data-level="' + l + '">' +
          (l === "intermediario" ? "médio" : l) +
          "</button>"
        );
      })
      .join("");

    var patternHtml =
      patterns.length === 0
        ? '<p class="px-foot" style="border:0;margin:2px 0 0;padding:0">Nenhum dark pattern detectado nesta página.</p>'
        : patterns
            .slice(0, 5)
            .map(function (p) {
              return (
                '<div class="px-hit"><b><span class="px-sev ' + (p.severity === "media" ? "px-media" : p.severity === "baixa" ? "px-baixa" : "") + '"></span>' +
                esc(p.label) +
                "</b><em>" + esc(p.evidence) + "</em><small>" + esc(p.why) + "</small></div>"
              );
            })
            .join("");

    panel.innerHTML =
      '<h1>Parallax nesta página</h1>' +
      '<p class="px-sub">A reescrita acontece no seu dispositivo. Nenhum texto desta página foi enviado para lugar nenhum.</p>' +
      '<div class="px-row"><span>motor ativo</span><button type="button" class="px-toggle ' + (state.enabled ? "px-on" : "") + '" data-toggle="enabled"><i></i></button></div>' +
      '<div class="px-label"><span>modo</span><span>' + esc(active) + "</span></div>" +
      '<div class="px-modes">' + modeButtons + "</div>" +
      '<div class="px-label"><span>nível de reescrita</span><span>densidade</span></div>' +
      '<div class="px-levels">' + levels + "</div>" +
      '<div class="px-label"><span>intensidade</span><span class="mono">' + Math.round(state.intensity * 100) + "%</span></div>" +
      '<input class="px-range" type="range" min="10" max="100" value="' + Math.round(state.intensity * 100) + '" data-range="intensity">' +
      '<div class="px-label"><span>no modo foco/calma</span><span></span></div>' +
      '<div class="px-row"><span>suprimir estímulo (não bloqueia)</span><button type="button" class="px-toggle ' + (state.suppressed ? "px-on" : "") + '" data-toggle="suppressed"><i></i></button></div>' +
      '<div class="px-row"><span>reescrever automaticamente</span><button type="button" class="px-toggle ' + (state.autoScan ? "px-on" : "") + '" data-toggle="autoScan"><i></i></button></div>' +
      '<div class="px-label"><span>dark patterns</span><span>' + patterns.length + " nesta página</span></div>" +
      patternHtml +
      '<div class="px-label"><span>resultado</span><span></span></div>' +
      '<div class="px-stats">' +
      '<div class="px-stat"><b>' + rewritten + "</b><span>blocos</span></div>" +
      '<div class="px-stat"><b>' + removed + "</b><span>estímulos</span></div>" +
      '<div class="px-stat"><b>' + (state.stats ? state.stats.pages : 0) + "</b><span>páginas</span></div>" +
      "</div>" +
      '<div style="display:flex;gap:5px;margin-top:9px">' +
      '<button type="button" class="px-btn px-primary" data-action="apply" style="flex:1">reescrever agora</button>' +
      '<button type="button" class="px-btn" data-action="restore">restaurar original</button>' +
      "</div>" +
      '<p class="px-foot">' + (state.enabled ? "Ativo em " : "Pausado em ") + esc(domain) + " · nada é enviado para um servidor · <span class='mono'>Ctrl+Shift+P</span> abre/fecha este painel</p>";

    panel.querySelectorAll("[data-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setMode(btn.getAttribute("data-mode"));
      });
    });
    panel.querySelectorAll("[data-level]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.level = btn.getAttribute("data-level");
        S.patch({ level: state.level }).then(function () {
          applyRewrite(true);
          renderPanel();
        });
      });
    });
    panel.querySelectorAll("[data-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-toggle");
        var value = !state[key];
        state[key] = value;
        S.patch(define(key, value)).then(function () {
          if (key === "enabled" && !value) restoreAll();
          else applyRewrite(true);
          renderPanel();
        });
      });
    });
    var range = panel.querySelector("[data-range='intensity']");
    if (range) {
      range.addEventListener("change", function () {
        state.intensity = Number(range.value) / 100;
        S.patch({ intensity: state.intensity }).then(function () {
          applyRewrite(true);
          renderPanel();
        });
      });
    }
    var applyBtn = panel.querySelector("[data-action='apply']");
    if (applyBtn) {
      applyBtn.addEventListener("click", function () {
        restoredByUser = false;
        applyRewrite(true);
        observe();
        suppressStimulus();
        scanPatterns();
        renderPanel();
        nudge("Reescrito localmente · " + rewritten + " bloco(s)");
      });
    }
    var restoreBtn = panel.querySelector("[data-action='restore']");
    if (restoreBtn) {
      restoreBtn.addEventListener("click", function () {
        restoreAll();
        document.querySelectorAll(".parallax-suppressed").forEach(function (el) {
          el.classList.remove("parallax-suppressed");
          delete el.dataset.parallaxSuppressed;
        });
        nudge("Original restaurado");
        renderPanel();
      });
    }
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function define(key, value) {
    var o = {};
    o[key] = value;
    return o;
  }

  function setMode(mode) {
    state.mode = mode;
    document.documentElement.classList.toggle("parallax-calm", mode === "calma");
    S.patch({ mode: mode }).then(function () {
      applyRewrite(true);
      suppressStimulus();
      scanPatterns();
      renderPanel();
      nudge("Modo " + (MODES[mode] ? MODES[mode].label : mode) + " aplicado");
    });
  }

  function bumpStats(delta) {
    if (!state) return;
    var stats = Object.assign({}, state.stats || {});
    stats.rewrites = (stats.rewrites || 0) + (delta.rewrites || 0);
    stats.pages = (stats.pages || 0) + (delta.pages || 0);
    stats.patterns = (stats.patterns || 0) + (delta.patterns || 0);
    state.stats = stats;
    S.patch({ stats: stats });
  }

  /* ── aviso flutuante ────────────────────────────────────────────────────── */

  function nudge(text) {
    var old = shadow.querySelector(".parallax-nudge");
    if (old) old.remove();
    var el = document.createElement("div");
    el.className = "parallax-nudge";
    el.innerHTML = "<span>" + esc(text) + "</span><button type='button'>ok</button>";
    shadow.appendChild(el);
    el.querySelector("button").addEventListener("click", function () {
      el.remove();
    });
    setTimeout(function () {
      if (el.parentNode) el.remove();
    }, 5200);
  }

  /* ── observer seletivo ──────────────────────────────────────────────────── */

  function observe() {
    if (!state || !state.autoScan) return;
    if (restoredByUser) return;
    var main = findContentRoot();
    if (!main || observer) return;
    observer = new MutationObserver(function (mutations) {
      var relevant = false;
      for (var i = 0; i < mutations.length; i++) {
        var t = mutations[i].target;
        if (t && t.nodeType === 1 && t.closest && t.closest("#parallax-root")) continue;
        if (mutations[i].type === "childList" && mutations[i].addedNodes.length) {
          relevant = true;
          break;
        }
      }
      if (!relevant) return;
      if (rewriteTimer) clearTimeout(rewriteTimer);
      rewriteTimer = setTimeout(function () {
        applyRewrite(false);
      }, 120);
    });
    observer.observe(main, { childList: true, subtree: true });
  }

  /* ── glossário em termos ────────────────────────────────────────────────── */

  function annotateGlossary() {
    if (!state || state.mode === "foco") return;
    var main = findContentRoot();
    if (!main) return;
    var used = 0;
    glossaryIndex.forEach(function (t) {
      if (used >= 40) return;
      var walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          if (!node.nodeValue || node.nodeValue.length < 12) return NodeFilter.FILTER_REJECT;
          var parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest("#parallax-root, a, button, code, pre, h1, h2, h3, input, textarea")) return NodeFilter.FILTER_REJECT;
          if (parent.classList && parent.classList.contains("parallax-term")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var node;
      while ((node = walker.nextNode())) {
        var idx = node.nodeValue.toLowerCase().indexOf(t.term.toLowerCase());
        if (idx === -1) continue;
        var span = document.createElement("span");
        span.className = "parallax-term";
        span.textContent = node.nodeValue.slice(idx, idx + t.term.length);
        span.title = t.definition;
        var after = node.splitText(idx);
        after.nodeValue = after.nodeValue.slice(t.term.length);
        node.parentNode.insertBefore(span, after);
        used += 1;
        break;
      }
    });
  }

  /* ── mensagens do popup / service worker ────────────────────────────────── */

  function syncFromStorage() {
    restoredByUser = false;
    S.get().then(function (saved) {
      state = saved;
      if (!state.enabled) {
        restoreAll();
        renderPanel();
        return;
      }
      applyRewrite(true);
      suppressStimulus();
      annotateGlossary();
      scanPatterns();
      renderPanel();
      observe();
    });
  }

  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function (msg, sender, respond) {
      if (!msg || !msg.type) return;
      if (msg.type === "parallax:apply") {
        restoredByUser = false;
        syncFromStorage();
        respond && respond({ ok: true });
      }
      if (msg.type === "parallax:restore") {
        restoreAll();
        respond && respond({ ok: true });
      }
      if (msg.type === "parallax:togglePanel") {
        panelOpen = !panelOpen;
        var panel = shadow && shadow.getElementById("px-panel");
        if (panel) panel.hidden = !panelOpen;
        if (panelOpen) {
          scanPatterns();
          renderPanel();
        }
        respond && respond({ ok: true });
      }
      if (msg.type === "parallax:stats") {
        respond && respond({ rewritten: rewritten, removed: removed, patterns: patterns.length, host: domain });
      }
    });
  }

  /* ── teclado ────────────────────────────────────────────────────────────── */

  document.addEventListener(
    "keydown",
    function (e) {
      if (e.ctrlKey && e.shiftKey && (e.key === "P" || e.key === "p")) {
        e.preventDefault();
        panelOpen = !panelOpen;
        var panel = shadow && shadow.getElementById("px-panel");
        if (panel) panel.hidden = !panelOpen;
        if (panelOpen) {
          scanPatterns();
          renderPanel();
        }
      }
    },
    true
  );

  /* ── boot ───────────────────────────────────────────────────────────────── */

  function boot() {
    if (!/^https?:/.test(location.protocol)) return;
    buildUI();
    S.get().then(function (saved) {
      state = saved;
      var host = location.hostname;
      if ((state.domainBlocklist || []).indexOf(host) !== -1) {
        renderPanel();
        return;
      }
      if (!state.enabled) {
        renderPanel();
        return;
      }
      // atrasa um pouco para não competir com o carregamento do site
      setTimeout(function () {
        applyRewrite(false);
        suppressStimulus();
        annotateGlossary();
        scanPatterns();
        renderPanel();
        observe();
        bumpStats({ pages: 1 });
      }, 900);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
