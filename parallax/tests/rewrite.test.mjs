/**
 * Testes do motor de reescrita compartilhado (extension/shared/rewrite.js).
 * É o mesmo algoritmo do protótipo em src/core/rewrite.ts: se este passa,
 * a extensão e a demo estão alinhadas.
 *
 *   npm test
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(path.resolve("extension/shared/rewrite.js"), "utf8");
const context = { console, performance: globalThis.performance };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: "rewrite.js" });
const R = context.ParallaxRewrite;

const JARGON =
  "A hipertensão arterial é a elevação persistente da pressão nas artérias. Entretanto, a maioria dos pacientes não apresenta sintomas, o que justifica o tratamento mesmo quando a pessoa se sente bem. Desse modo, considera-se que a doença é silenciosa e progressiva.";

test("complexidade: texto técnico pontua acima de texto simples", () => {
  const hard = R.complexityOf(JARGON);
  const easy = R.complexityOf("A pressão alta é a força do sangue nas artérias. Quase sempre não dói. Por isso é preciso medir.");
  assert.ok(hard > easy, `esperava ${hard} > ${easy}`);
});

test("iniciante: troca conectores e reduz densidade", () => {
  const out = R.rewriteBlock({ text: JARGON, level: "iniciante", intensity: 0.9 });
  assert.ok(!/Entretanto/.test(out.text), "Entretanto deveria virar mas");
  assert.ok(!/Desse modo/.test(out.text), "Desse modo deveria virar assim");
  assert.ok(out.complexityAfter <= out.complexityBefore, `${out.complexityBefore} → ${out.complexityAfter}`);
  assert.ok(out.notes.length >= 3, `esperava ao menos 3 notas, veio ${out.notes.length}`);
  assert.ok(out.ms >= 0);
});

test("avançado: eleva conectores e não remove conteúdo", () => {
  const text = "O estudo mostra que a coisa funciona. Mas o custo é muito importante para o time.";
  const out = R.rewriteBlock({ text, level: "avancado", intensity: 0.9 });
  assert.ok(/contudo/i.test(out.text), "mas → contudo");
  assert.ok(/evidencia/.test(out.text), "mostra → evidencia");
  assert.ok(/determinante/.test(out.text), "importante → determinante");
  assert.equal(out.text.split(".").filter(Boolean).length, text.split(".").filter(Boolean).length);
});

test("intensidade zero não altera o texto", () => {
  const out = R.rewriteBlock({ text: JARGON, level: "iniciante", intensity: 0 });
  assert.equal(out.text, JARGON.trim());
  assert.equal(out.notes.length, 0);
});

test("modo calma remove exclamações", () => {
  const out = R.rewriteBlock({ text: "Só hoje! Não perca!", level: "intermediario", intensity: 0.9, calm: true });
  assert.ok(!out.text.includes("!"), out.text);
});

test("iniciante encurta frases longas", () => {
  const long =
    "O processo de reescrita automática de páginas depende de uma combinação de técnicas de processamento de linguagem natural que precisam ser executadas sem bloquear a thread principal do navegador para manter a experiência fluida.";
  const out = R.rewriteBlock({ text: long, level: "iniciante", intensity: 0.9 });
  const longest = Math.max(...out.text.split(/[.!?]/).map((s) => s.trim().split(/\s+/).filter(Boolean).length));
  assert.ok(longest <= 26, `maior frase ficou com ${longest} palavras`);
  assert.ok(out.notes.some((n) => /frase/i.test(n.why)), "deveria registrar a divisão de frases");
});

test("glossário: encontra termos presentes no texto", () => {
  const terms = [
    { term: "carga cognitiva", definition: "esforço mental simultâneo" },
    { term: "inflação", definition: "aumento de preços" },
  ];
  const out = R.rewriteBlock({ text: "A carga cognitiva aumenta em páginas lotadas.", level: "iniciante", intensity: 0.9, terms });
  assert.equal(out.glossary.length, 1);
  assert.equal(out.glossary[0].term, "carga cognitiva");
});

test("resumo extrativo devolve frases do próprio texto", () => {
  const summary = R.extractKeySentences(JARGON, 2);
  assert.equal(summary.length, 2);
  summary.forEach((s) => assert.ok(JARGON.includes(s.slice(0, 25)), s));
});

test("idempotência: reescrever o resultado não muda o texto", () => {
  const once = R.rewriteBlock({ text: JARGON, level: "iniciante", intensity: 0.9 });
  const twice = R.rewriteBlock({ text: once.text, level: "iniciante", intensity: 0.9 });
  assert.equal(twice.text, once.text);
});
