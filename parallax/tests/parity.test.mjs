/**
 * Paridade entre os dois motores de reescrita:
 *   src/core/rewrite.ts            (protótipo, TypeScript)
 *   extension/shared/rewrite.js    (content script, JS puro)
 *
 * Os dois deveriam produzir exatamente o mesmo texto. Se alguém editar um lado
 * só, este teste quebra — que foi exatamente o bug encontrado (nível avançado
 * "desfazendo" o próprio trabalho).
 *
 *   npm test
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import * as esbuild from "esbuild";

function loadTs() {
  const built = esbuild.buildSync({
    entryPoints: ["src/core/rewrite.ts"],
    bundle: true,
    format: "iife",
    globalName: "TS",
    platform: "neutral",
    write: false,
    alias: { "@": "./src" },
    logLevel: "silent",
  });
  const ctx = { console, performance: globalThis.performance };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(built.outputFiles[0].text, ctx, { filename: "rewrite.ts.js" });
  return ctx.TS;
}

function loadJs() {
  const ctx = { console, performance: globalThis.performance };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.resolve("extension/shared/rewrite.js"), "utf8"), ctx, {
    filename: "rewrite.js",
  });
  return ctx.ParallaxRewrite;
}

const TEXTS = [
  // jargão clínico com conector entre vírgulas
  "A hipertensão arterial sistêmica (HAS) é uma condição clínica multifatorial caracterizada por elevação sustentada dos níveis pressóricos, frequentemente associada a alterações funcionais e estruturais dos órgãos-alvo. Considera-se hipertenso o indivíduo com pressão arterial persistentemente elevada, o que, entretanto, não é suficiente para explicar o risco cardiovascular global. A mensuração da pressão arterial deve ser realizada de forma padronizada, sendo que o diagnóstico requer confirmação em consultas subsequentes.",
  // notícia com "mas" adversativo
  "A cidade amanheceu com o trânsito parado, depois de um acidente. Ninguém ficou ferido, mas a via ficou interditada por três horas.",
  // texto de dev com conector no início da frase
  "Para resolver o problema, criamos um hook que utiliza o cache e possibilita a invalidação manual. Entretanto, o componente é desmontado antes da resposta chegar.",
  // texto simples (avançado precisa elevar, não rebaixar)
  "O estudo mostra que o paradigma funciona. Mas o custo é muito importante para o time.",
];

test("motores: TS e extensão produzem texto idêntico", () => {
  const TS = loadTs();
  const JS = loadJs();
  const diffs = [];
  for (const text of TEXTS) {
    for (const level of ["iniciante", "intermediario", "avancado"]) {
      for (const intensity of [0, 0.6, 1]) {
        const a = TS.rewriteBlock({ text, level, intensity, terms: [] });
        const b = JS.rewriteBlock({ text, level, intensity, terms: [] });
        if (a.text !== b.text) diffs.push(`[${level} i=${intensity}]\n  ts: ${a.text}\n  js: ${b.text}`);
      }
    }
  }
  assert.equal(diffs.length, 0, `motores divergem:\n${diffs.slice(0, 2).join("\n")}`);
});

test("motores: complexidade e métricas também batem", () => {
  const TS = loadTs();
  const JS = loadJs();
  for (const text of TEXTS) {
    assert.equal(TS.complexityOf(text), JS.complexityOf(text), `complexidade divergente: ${text.slice(0, 40)}`);
  }
});

test("iniciante: conector entre vírgulas não gera \", mas,\"", () => {
  const JS = loadJs();
  const out = JS.rewriteBlock({
    text: "O dado é bom, o que, entretanto, não resolve o problema.",
    level: "iniciante",
    intensity: 1,
  });
  assert.ok(!/,\s*,\s*mas/.test(out.text), out.text);
  assert.ok(!/,\s*mas\s*,/.test(out.text), out.text);
  assert.ok(/mas não resolve/.test(out.text), out.text);
});

test("avançado: não rebaixa texto que já está no registro formal", () => {
  const JS = loadJs();
  const formal = "A análise da amostra evidencia a correlação estatística descrita na literatura.";
  const out = JS.rewriteBlock({ text: formal, level: "avancado", intensity: 1 });
  assert.ok(!/usa\b|muito\b/.test(out.text), out.text);
});
