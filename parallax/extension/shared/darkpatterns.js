/* ────────────────────────────────────────────────────────────────────────────
   Parallax · detector de dark patterns (compartilhado)
   Roda no texto visível de qualquer página. Cada hit cita o trecho.
   ──────────────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";

  var RULES = [
    {
      kind: "escassez-falsa",
      label: "Escassez artificial",
      severity: "alta",
      re: /(s[óo]\s+restam?\s+\d+|últim[ao]s?\s+\d+\s+unidades?|quase\s+esgotad[oa]|estoque\s+limitad[oa])/gi,
      why: "O número muda ao recarregar e não corresponde ao estoque real."
    },
    {
      kind: "urgencia-falsa",
      label: "Urgência sem base",
      severity: "alta",
      re: /(s[óo]\s+hoje|última\s+chance|agora\s+ou\s+nunca|não\s+perca|antes\s+que\s+acabe|acaba\s+em)/gi,
      why: "O prazo reinicia a cada visita e nunca vence."
    },
    {
      kind: "contagem-regressiva",
      label: "Contagem regressiva",
      severity: "media",
      re: /(termine\s+em\s+\d|faltam?\s+\d{1,2}:\d{2}|\b\d{2}:\d{2}:\d{2}\b)/gi,
      why: "Timer reiniciado no cliente, sem oferta real por trás."
    },
    {
      kind: "prova-social-fabricada",
      label: "Prova social fabricada",
      severity: "media",
      re: /(\d+\s+(pessoas|usuários|clientes)\s+(est[ãa]o|viram|compraram)|em alta agora|mais de \d+ pessoas)/gi,
      why: "O número é gerado aleatoriamente por sessão."
    },
    {
      kind: "preco-riscado",
      label: "Âncora de preço",
      severity: "media",
      re: /(de\s+r\$\s?[\d.,]+\s+por\s+r\$\s?[\d.,]+|economize\s+r\$|-\d{2}\s?%)/gi,
      why: "O preço “original” quase nunca foi praticado."
    },
    {
      kind: "custo-oculto",
      label: "Custo revelado no fim",
      severity: "alta",
      re: /(frete\s+(calculado|somado)\s+(no|ao)\s+(carrinho|finalizar)|taxa\s+de\s+servi[çc]o\s+no\s+final|impostos?\s+no\s+checkout)/gi,
      why: "Aparece só depois do esforço de escolher."
    },
    {
      kind: "confirmshaming",
      label: "Confirmshaming",
      severity: "baixa",
      re: /(não\s+quero\s+(economizar|aproveitar)|prefiro\s+pagar\s+mais|quero\s+continuar\s+perdendo)/gi,
      why: "A opção de recusar é escrita para constranger."
    },
    {
      kind: "review-suspeita",
      label: "Avaliações suspeitas",
      severity: "alta",
      re: /(comprador\s+verificado|aprovado\s+por\s+\d+\s+clientes)/gi,
      why: "Padrão de reviews simultâneas, curtas e idênticas."
    }
  ];

  function scan(text) {
    var hits = [];
    var seen = {};
    if (!text || text.length < 20) return hits;
    for (var i = 0; i < RULES.length; i++) {
      var r = RULES[i];
      r.re.lastIndex = 0;
      var m = r.re.exec(text);
      if (!m) continue;
      if (seen[r.kind]) continue;
      seen[r.kind] = true;
      hits.push({
        kind: r.kind,
        label: r.label,
        severity: r.severity,
        evidence: "“" + m[0].trim().slice(0, 64) + "”",
        why: r.why
      });
    }
    return hits;
  }

  function estimateFakeReviews(comments) {
    var suspicious = 0;
    var seenMap = {};
    (comments || []).forEach(function (c) {
      var norm = c.toLowerCase().replace(/[^\p{L}\s]/gu, "").replace(/\s+/g, " ").trim();
      var exclamations = (c.match(/!/g) || []).length;
      var generic = /(excelente|maravilhos|perfeito|recomendo|melhor|top|nota 10|incrível|amei)/i.test(c) && norm.split(" ").length <= 12;
      seenMap[norm] = (seenMap[norm] || 0) + 1;
      if (generic && exclamations >= 2) suspicious += 1;
      else if (generic) suspicious += 0.6;
    });
    return { ratio: Math.min(1, suspicious / Math.max(1, (comments || []).length)), suspicious: Math.round(suspicious) };
  }

  root.ParallaxDarkPatterns = { scan: scan, estimateFakeReviews: estimateFakeReviews, RULES: RULES };
})(typeof globalThis !== "undefined" ? globalThis : window);
