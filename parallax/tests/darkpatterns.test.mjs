/**
 * Testes do detector de dark patterns compartilhado.
 * Cada acusação precisa vir com evidência citada — é isso que estes testes cobram.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(path.resolve("extension/shared/darkpatterns.js"), "utf8");
const context = { console };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: "darkpatterns.js" });
const D = context.ParallaxDarkPatterns;

test("escassez e urgência falsas são detectadas com evidência", () => {
  const hits = D.scan(
    "OFERTA RELÂMPAGO! Só restam 2 unidades neste preço. Última chance! Corra antes que acabe. Termine em 02:47:12. 27 pessoas estão vendo este produto agora."
  );
  const kinds = hits.map((h) => h.kind);
  assert.ok(kinds.includes("escassez-falsa"), kinds.join(","));
  assert.ok(kinds.includes("urgencia-falsa"), kinds.join(","));
  assert.ok(kinds.includes("contagem-regressiva"), kinds.join(","));
  assert.ok(kinds.includes("prova-social-fabricada"), kinds.join(","));
  hits.forEach((h) => {
    assert.ok(h.evidence && h.evidence.length > 3, "toda acusação cita o trecho");
    assert.ok(h.why, "toda acusação explica o padrão");
    assert.ok(["alta", "media", "baixa"].includes(h.severity));
  });
});

test("âncora de preço dispara em desconto percentual", () => {
  const hits = D.scan("De R$ 4.599 por R$ 2.899, economize R$ 1.700. -37%");
  assert.ok(hits.some((h) => h.kind === "preco-riscado"));
});

test("texto neutro não gera falso positivo", () => {
  const hits = D.scan(
    "A hipertensão é a elevação persistente da pressão nas artérias e costuma ser assintomática na maioria dos casos, segundo a diretriz da sociedade de cardiologia."
  );
  assert.equal(hits.length, 0, JSON.stringify(hits));
});

test("custo oculto é classificado como severidade alta", () => {
  const hits = D.scan("Frete calculado no carrinho. Taxa de serviço no final do pedido.");
  const hit = hits.find((h) => h.kind === "custo-oculto");
  assert.ok(hit);
  assert.equal(hit.severity, "alta");
});

test("deduplicação: um hit por tipo", () => {
  const hits = D.scan("Só hoje! Só hoje! Última chance! Só restam 2 unidades! Só restam 2 unidades!");
  const kinds = hits.map((h) => h.kind);
  assert.equal(kinds.length, new Set(kinds).size);
});

test("reviews artificiais: elogio genérico e exclamação contam", () => {
  const fake = D.estimateFakeReviews([
    "Produto excelente!!! Recomendo muito, chegou rápido.",
    "Melhor compra da vida. Nota 10!!!",
    "Não comprem, o painel veio com vazamento de luz e a assistência não resolveu o problema em três semanas.",
  ]);
  assert.ok(fake.ratio > 0.5, `ratio ${fake.ratio}`);
  assert.ok(fake.suspicious >= 2);
});

test("reviews legítimas não são acusadas", () => {
  const fake = D.estimateFakeReviews([
    "Uso para programar há oito meses: texto limpo, hub USB-C funciona bem e o painel VA tem preto profundo.",
    "Chegou em dois dias. O HDR é fraco, então não compre pensando nisso.",
  ]);
  assert.ok(fake.ratio < 0.5, `ratio ${fake.ratio}`);
});
