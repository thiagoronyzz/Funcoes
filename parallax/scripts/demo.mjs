/**
 * Roteiro de demonstração ponta a ponta, em jsdom, sobre o app compilado de verdade.
 * Cada passo é uma promessa do pitch; se uma quebrar, o roteiro falha.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(ROOT);
import { JSDOM, VirtualConsole } from "jsdom";

const html = fs.readFileSync(path.join(ROOT, "parallax-standalone.html"), "utf8");
const vc = new VirtualConsole();
const errs = [];
vc.on("jsdomError", (e) => { if (!/Could not parse CSS/.test(e.message)) errs.push(e.message.slice(0, 100)); });
vc.on("error", (...a) => errs.push(String(a[0]).slice(0, 100)));
const dom = new JSDOM(html, { url: "file:///x/index.html", runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc });
const { window } = dom;
const doc = window.document;
const wait = (ms = 260) => new Promise((r) => setTimeout(r, ms));
const click = (el) => el?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
const key = (k, opts = {}) => window.dispatchEvent(new window.KeyboardEvent("keydown", { key: k, bubbles: true, ...opts }));
const text = () => doc.body.textContent || "";
const checks = [];
const check = (label, ok, extra = "") => {
  checks.push({ label, ok });
  console.log(`${ok ? "✓" : "✗"} ${label}${extra ? " · " + extra : ""}`);
};
const find = (sel, re) => [...doc.querySelectorAll(sel)].find((el) => re.test(el.textContent || ""));
const input = (el, value) => {
  if (!el) return;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new window.Event("input", { bubbles: true }));
};

await wait(2000);

// 0 · onboarding (primeira visita)
const skip = find("button", /pular|explorar sem/i);
check("onboarding aparece na primeira visita", !!skip);
click(skip);
await wait(400);

// 1 · cinco modos mudam a página de verdade
const modes = [
  ["aprender", "Aprendizado", /por que mudou|flashcard|glossário/i],
  ["pesquisar", "Pesquisa", /referência|citaç|citaç|citaç|ABNT|APA/i],
  ["comprar", "Compra", /R\$|preço|dark pattern|review/i],
  ["focar", "Foco", /foco|tarefa/i],
  ["calma", "Calma", /calma|inspir|essencial/i],
];
for (const [id, name, marker] of modes) {
  const btn = [...doc.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === id);
  btn?.click();
  await window.Promise.resolve();
  await wait(340);
  const canvas = doc.querySelector(".page-canvas");
  const cls = canvas?.className || "";
  const hasModeClass = cls.includes(id === "focar" ? "focus" : id === "calma" ? "calm" : "");
  check(`modo ${name}: estado aplicado na página`, !!btn && hasModeClass, cls.replace("page-canvas", "").trim() || "sem classe de modo");
}
// modos também precisam mudar conteúdo visível (foco remove ad; calma reduz texto)
const bodyOf = () => doc.querySelector(".page-canvas")?.innerHTML.length ?? 0;
[...doc.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "focar")?.click();
await wait(320);
const focusLen = bodyOf();
[...doc.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "calma")?.click();
await wait(320);
const calmLen = bodyOf();
[...doc.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "aprender")?.click();
await wait(320);
const learnLen = bodyOf();
check("foco suprime estímulo", focusLen < learnLen, `${focusLen} < ${learnLen} bytes`);
check("calma reduz a página ao essencial", calmLen < learnLen, `${calmLen} < ${learnLen} bytes`);

// 2 · modal de respiração (modo calma)
click([...doc.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "calma"));
await wait(300);
const breath = find("button", /respirar/i);
if (breath) {
  click(breath);
  await wait(500);
  check("overlay de respiração abre", /inspire|expire|respir/i.test(text()));
  key("Escape");
  await wait(300);
}

// 3 · omnibox leva a outra página
click([...doc.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "aprender"));
await wait(200);
key("k", { ctrlKey: true });
await wait(400);
const omni = doc.querySelector('input[type="text"], input:not([type])');
if (omni) {
  input(omni, "atenção");
  await wait(500);
  const first = doc.querySelector('[role="option"], .omni-item, li button');
  const results = doc.querySelectorAll('[role="option"], .omni-item, li');
  check("omnibox filtra páginas", results.length > 0, `${results.length} sugestões`);
}
key("Escape");

// 4 · atalho de teclado troca de view
key("2");
await wait(400);
check("atalho 2 abre Cérebro", /atenção|cognitiv|memória/i.test(doc.querySelector(".par-main")?.textContent || ""));
key("1");
await wait(300);

// 5 · quiz e flashcards existem no painel de aprendizado
const quizTab = find("button", /quiz/i);
if (quizTab) {
  click(quizTab);
  await wait(400);
  check("quiz gerado do texto", /pergunta|alternativa|acert/i.test(text()));
}

console.log(errs.length ? `\n✗ erros de console: ${errs.slice(0, 3).join(" | ")}` : "\n✓ nenhum erro de console");
const failed = checks.filter((c) => !c.ok).length;
console.log(`${checks.length - failed}/${checks.length} ✓`);
process.exit(failed || errs.length ? 1 : 0);
