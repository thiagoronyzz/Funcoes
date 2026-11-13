/* ────────────────────────────────────────────────────────────────────────────
   Parallax · motor de reescrita (compartilhado)
   Mesmo algoritmo do protótipo (src/core/rewrite.ts), em JS puro para rodar
   como content script sem bundler. Sem dependências, sem rede.
   ──────────────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";

  var PLAIN = [
    [/\butiliza(?:r|do|da|m)?\b/gi, "usa"],
    [/\bpossibilita\b/gi, "permite"],
    [/\bentretanto\b/gi, "mas"],
    [/\bcontudo\b/gi, "mas"],
    [/\bporém\b/gi, "mas"],
    [/\btodavia\b/gi, "mas"],
    [/\bportanto\b/gi, "por isso"],
    [/\bassim sendo\b/gi, "por isso"],
    [/\bdesse modo\b/gi, "assim"],
    [/\bdesta forma\b/gi, "assim"],
    [/\bde forma previsível\b/gi, "como esperado"],
    [/\bsistematicamente\b/gi, "passo a passo"],
    [/\bparcialmente dissociáveis\b/gi, "que funcionam meio separados"],
    [/\boperacionalizada?\b/gi, "medida"],
    [/\bparadigmas?\b/gi, "testes"],
    [/\bmodulad[ao]\b/gi, "influenciada"],
    [/\bcorrelatos\b/gi, "relações"],
    [/\bpersistente\b/gi, "que não passa"],
    [/\bprogressivo\b/gi, "que piora aos poucos"],
    [/\bsilencioso\b/gi, "sem avisar"],
    [/\bjustifica\b/gi, "explica por que"],
    [/\bsobretudo\b/gi, "principalmente"],
    [/\belevad[ao]\b/gi, "alta"],
    [/\bconsidera-se\b/gi, "podemos considerar"],
    [/\bmensurável\b/gi, "que dá para medir"],
    [/\bconsequência medida\b/gi, "resultado observado"],
    [/\bdesigna\b/gi, "chama"],
    [/\bsustenta\b/gi, "segura"],
    [/\brecruta(?:ria|m)?\b/gi, "usa"],
    [/\bsinaliza(?:do|m)?\b/gi, "indica"],
    [/\becológicas?\b/gi, "no dia a dia"],
    [/\bvigilância\b/gi, "monitoramento"]
  ];

  /**
   * Par reversível (simples ⇄ formal) usado nos dois sentidos. Fica separado das
   * listas direcionais para que nenhuma regra desfaça o trabalho da outra etapa.
   */
  var REVERSIBLE_SIMPLE = [
    [/\bpode\b/gi, "é capaz de"],
    [/\bfaz\b/gi, "realiza"],
    [/\busa\b/gi, "utiliza"],
    [/\bmuito\b/gi, "substancialmente"]
  ];

  var ADVANCED = [
    [/\bexplica por que\b/gi, "justifica"],
    [/\bfala sobre\b/gi, "discorre sobre"],
    [/\bfala\b/gi, "discorre"],
    [/\bboa parte\b/gi, "parcela significativa"],
    [/\bmuitas vezes\b/gi, "frequentemente"],
    [/\bao mesmo tempo\b/gi, "simultaneamente"]
  ];

  var UPGRADE = [
    [/\bque n[ãa]o passa\b/gi, "persistente"],
    [/\bpodemos considerar\b/gi, "considera-se"],
    [/\bn[ãa]o é\b/gi, "não corresponde a"],
    [/\bque d[áa] para medir\b/gi, "mensurável"],
    [/\busam\b/gi, "utilizam"],
    [/\busa\b/gi, "utiliza"],
    [/\bpode\b/gi, "é capaz de"]
  ];

  var DENSE = [
    [/\bmas\b(?!\s+(?:também|tanto))/gi, "contudo"],
    [/\bpor isso\b/gi, "portanto"],
    [/\bimportante\b/gi, "determinante"],
    [/\bmostra\b/gi, "evidencia"],
    [/\bdá para\b/gi, "é possível"]
  ];

  var STOP = {};
  ("a o e de da do das dos em no na nos nas para por com sem que se um uma uns umas ao aos à às é são foi ser " +
    "estar como mais menos muito pouco sobre entre até após antes quando onde qual quais seu sua seus suas este " +
    "esta esse essa isso isto aquilo não sim já também só então porque pois the of and to in is").split(/\s+/).forEach(function (w) {
    STOP[w] = true;
  });

  function words(text) {
    return text.split(/\s+/).filter(Boolean);
  }

  /** Mesma fórmula do protótipo (src/core/rewrite.ts): 0–100, normalizada p/ português. */
  function complexityOf(text) {
    var w = words(text);
    if (!w.length) return 0;
    var sentences = Math.max(1, (text.match(/[.!?](\s|$)/g) || []).length);
    var longWords = w.filter(function (x) {
      return x.replace(/\W/g, "").length >= 9;
    }).length;
    var syllables = w.reduce(function (acc, x) {
      var m = x.match(/[aeiouáéíóúâêôãõ]/gi);
      return acc + Math.max(1, m ? m.length : 0);
    }, 0);
    var asl = w.length / sentences;
    var asw = syllables / w.length;
    var longPct = longWords / w.length;
    return Math.round(clamp01((asl - 8) / 22) * 42 + clamp01((asw - 1.45) / 1.15) * 33 + clamp01(longPct / 0.35) * 25);
  }

  function clamp01(n) {
    return Math.max(0, Math.min(1, n));
  }

  function wordCount(s) {
    return s.split(/\s+/).filter(Boolean).length;
  }

  var BREAK_WORDS = {};
  "que para sem quando porque pois mas e ou se como onde enquanto sobre entre após antes até nem porém contudo portanto assim então".split(" ").forEach(function (w) {
    BREAK_WORDS[w] = true;
  });

  function bestBreak(words) {
    var mid = Math.floor(words.length / 2);
    var best = null;
    var bestDist = Infinity;
    for (var i = 4; i <= words.length - 4; i++) {
      var w = words[i].toLowerCase().replace(/[^\p{L}]/gu, "");
      if (!BREAK_WORDS[w]) continue;
      var dist = Math.abs(i - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  }

  function emitSentence(raw, maxWords, state) {
    var s = raw.trim().replace(/[,;:]+$/, "");
    if (!s) return;
    if (wordCount(s) <= maxWords) {
      if (!/[.!?]$/.test(s)) s += ".";
      state.out.push(s);
      return;
    }
    var words = s.split(/\s+/);
    var at = bestBreak(words);
    if (at === null) {
      if (!/[.!?]$/.test(s)) s += ".";
      state.out.push(s);
      return;
    }
    state.splits += 1;
    emitSentence(words.slice(0, at).join(" "), maxWords, state);
    var tail = words.slice(at).join(" ");
    emitSentence(tail.charAt(0).toUpperCase() + tail.slice(1), maxWords, state);
  }

  function shorten(text, maxWords) {
    var state = { out: [], splits: 0 };
    var sentences = text.match(/[^.!?]+[.!?]+["”’)]?|[^.!?]+$/g) || [text];
    sentences.forEach(function (raw) {
      var sentence = raw.trim();
      if (!sentence) return;
      if (wordCount(sentence) <= maxWords) {
        state.out.push(sentence);
        return;
      }
      var clauses = sentence.split(/(?<=[,;:])\s+/);
      var groups = [];
      var acc = "";
      clauses.forEach(function (clause) {
        var candidate = acc ? acc + " " + clause : clause;
        if (acc && wordCount(candidate) > maxWords) {
          groups.push(acc);
          acc = clause;
        } else {
          acc = candidate;
        }
      });
      if (acc) groups.push(acc);
      groups.forEach(function (group) {
        emitSentence(group, maxWords, state);
      });
    });
    return {
      text: state.out
        .join(" ")
        .replace(/\s+([.,;:!?])/g, "$1")
        .replace(/\.{2,}/g, ".")
        .trim(),
      splits: state.splits
    };
  }

  /** Conectores adversativos entre vírgulas: "o que, entretanto, não" vira "o que, mas não". */
  var CONTRAST_WORD = "(?:entretanto|contudo|porém|todavia|no entanto)";

  function absorbContrast(text) {
    var changed = [];
    var out = text
      .replace(new RegExp(",\\s*" + CONTRAST_WORD + "\\s*,", "gi"), function (m) {
        changed.push(m.trim());
        return ", mas";
      })
      .replace(new RegExp("\\b" + CONTRAST_WORD + "\\s*,", "gi"), function (m) {
        changed.push(m.trim());
        return "mas";
      })
      .replace(new RegExp(",\\s*" + CONTRAST_WORD + "\\b", "gi"), function (m) {
        changed.push(m.trim());
        return ", mas";
      });
    return { text: out, changed: changed };
  }

  function applyRules(text, rules, contrastNotes) {
    var notes = contrastNotes || [];
    var out = text;
    rules.forEach(function (rule) {
      var re = rule[0];
      var to = rule[1];
      var matches = out.match(re);
      if (!matches) return;
      notes.push({ from: matches[0], to: to });
      // offsets mudam a cada substituição: o capitalizador roda sobre o resultado final
      out = out.replace(re, to);
    });
    return { text: fixSentenceCase(out), notes: notes };
  }

  /** Após as regras, devolve maiúscula ao primeiro token de cada frase. */
  function fixSentenceCase(out) {
    return out.replace(/(^|[.!?]\s+)([a-zà-ÿ])/g, function (m, prefix, letter) {
      return prefix + letter.toUpperCase();
    });
  }

  function rewriteBlock(opts) {
    var t0 = performance.now();
    var text = opts.text || "";
    var level = opts.level || "intermediario";
    var intensity = typeof opts.intensity === "number" ? opts.intensity : 0.85;
    var before = complexityOf(text);
    var notes = [];
    var glossary = [];
    var out = text;

    if (level === "iniciante" && intensity > 0.35) {
      var contrast = absorbContrast(out);
      out = contrast.text;
      var notesFromContrast = contrast.changed.slice(0, 3).map(function (from) {
        return { from: from, to: "mas", why: "conector adversativo direto" };
      });
      var vocabulary = [
        [/\bhipertensão arterial sistêmica\b/gi, "pressão alta"],
        [/\bsistêmica\b/gi, "do corpo todo"],
        [/\bmultifatorial\b/gi, "de várias causas"],
        [/\bpressóric[oa]s?\b/gi, "de pressão"],
        [/\bórgãos-alvo\b/gi, "órgãos que sofrem com ela"],
        [/\bfrequentemente\b/gi, "muitas vezes"],
        [/\bsubsequentes\b/gi, "seguintes"],
        [/\brisco cardiovascular global\b/gi, "risco para o coração como um todo"],
        [/\bde forma padronizada\b/gi, "do mesmo jeito"],
        [/\bpadronizada\b/gi, "do mesmo jeito"],
        [/\belevação sustentada\b/gi, "aumento que não passa"]
      ];
      var plainWords = applyRules(out, vocabulary, []);
      out = plainWords.text;
      notesFromContrast = notesFromContrast.concat(plainWords.notes.map(function (n) {
        return { from: n.from, to: n.to, why: "termo técnico traduzido" };
      }));
      var plain = applyRules(out, PLAIN, notesFromContrast);
      out = plain.text;
      notes = notes.concat(plain.notes.map(function (n) { return { from: n.from, to: n.to, why: "linguagem simples" }; }));
      var short = shorten(out, 26);
      if (short.splits > 0) {
        out = short.text;
        notes.push({ from: "parágrafo longo", to: "frases curtas", why: short.splits + " frase(s) dividida(s)" });
      }
    } else if (level === "avancado" && intensity > 0.35) {
      // se o texto está na forma "simples" (só nesse caso), devolve o registro formal
      var upgradeHits = UPGRADE.reduce(function (acc, r) { return acc + (out.match(r[0]) || []).length; }, 0);
      if (upgradeHits >= 2) {
        var up = applyRules(out, UPGRADE);
        out = up.text;
        notes = notes.concat(up.notes.map(function (n) { return { from: n.from, to: n.to, why: "registro formal" }; }));
      }
      var reversible = applyRules(out, REVERSIBLE_SIMPLE);
      out = reversible.text;
      notes = notes.concat(reversible.notes.map(function (n) { return { from: n.from, to: n.to, why: "registro formal" }; }));
      var adv = applyRules(out, ADVANCED);
      out = adv.text;
      notes = notes.concat(adv.notes.map(function (n) { return { from: n.from, to: n.to, why: "densidade técnica" }; }));
      var dense = applyRules(out, DENSE);
      out = dense.text;
      notes = notes.concat(dense.notes.map(function (n) { return { from: n.from, to: n.to, why: "densidade técnica" }; }));
    }

    if (opts.calm) {
      out = out.replace(/!\s*/g, ". ");
      notes.push({ from: "!", to: ".", why: "modo calma remove urgentência" });
    }

    var terms = opts.terms || [];
    var lower = out.toLowerCase();
    terms.forEach(function (t) {
      if (lower.indexOf(String(t.term).toLowerCase()) !== -1) glossary.push(t);
    });

    out = fixSentenceCase(out);
    var after = complexityOf(out);
    return {
      text: out.trim(),
      notes: notes,
      complexityBefore: before,
      complexityAfter: after,
      glossary: glossary.slice(0, 8),
      ms: Math.round((performance.now() - t0) * 10) / 10
    };
  }

  function extractKeySentences(text, n) {
    n = n || 3;
    var clean = text.replace(/\s+/g, " ").trim();
    var sentences = clean
      .split(/(?<=[.!?])\s+/g)
      .map(function (s) {
        return s.trim();
      })
      .filter(function (s) {
        return words(s).length > 5;
      });
    if (sentences.length <= n) return sentences;
    var freq = {};
    words(clean.toLowerCase()).forEach(function (raw) {
      var k = raw.replace(/[^\p{L}\p{N}]/gu, "");
      if (k.length < 4 || STOP[k]) return;
      freq[k] = (freq[k] || 0) + 1;
    });
    var scored = sentences.map(function (s, i) {
      var ws = words(s.toLowerCase());
      var score =
        ws.reduce(function (a, w) {
          return a + (freq[w.replace(/[^\p{L}\p{N}]/gu, "")] || 0);
        }, 0) / Math.sqrt(ws.length + 4);
      return { s: s, score: score + (i === 0 ? 4 : 0), i: i };
    });
    return scored
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .slice(0, n)
      .sort(function (a, b) {
        return a.i - b.i;
      })
      .map(function (x) {
        return x.s;
      });
  }

  root.ParallaxRewrite = {
    rewriteBlock: rewriteBlock,
    complexityOf: complexityOf,
    extractKeySentences: extractKeySentences,
    LEVELS: {
      iniciante: { label: "Iniciante", factor: 0.55 },
      intermediario: { label: "Intermediário", factor: 0.8 },
      avancado: { label: "Avançado", factor: 1.05 }
    }
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
