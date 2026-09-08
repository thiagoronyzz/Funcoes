/* Zcode — QA: sintaxe + runtime (jsdom) + consistência do catálogo.
   Uso: node scripts/zcode/test.mjs */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { JSDOM, VirtualConsole } from "jsdom";
import { CATALOGO, validar } from "./catalog.mjs";
import { buildSlugs } from "./generate.mjs";

const ROOT = new URL("../..", import.meta.url).pathname;
const ZDIR = path.join(ROOT, "public", "ZCODE");
const CAT_DIR = { estudos: "Estudos", jogos: "Jogos", uteis: "Úteis" };

let falhas = 0;
function fail(msg) { falhas++; console.error("  Não", msg); }
function ok(msg) { console.log("  OK", msg); }

/* ── 1. catálogo ────────────────────────────────────────── */
console.log("1) Catálogo");
const er = validar();
if (er.length) er.forEach(fail); else ok("100 apps por categoria, nomes únicos");

/* ── 2. arquivos gerados ────────────────────────────────── */
console.log("2) Arquivos");
const todos = []; // {cat, file, e}
for (const cat of ["estudos", "jogos", "uteis"]) {
  const slugs = buildSlugs(cat);
  CATALOGO[cat].forEach((e, i) => {
    const file = e.legacy
      ? path.join(ZDIR, CAT_DIR[cat], e.legacy, "zcode.html")
      : path.join(ZDIR, CAT_DIR[cat], slugs[i], "index.html");
    todos.push({ cat, file, e });
  });
  todos.push({ cat, file: path.join(ZDIR, CAT_DIR[cat], "index.html"), e: null });
}
for (const t of todos) {
  if (!fs.existsSync(t.file)) fail(`arquivo ausente: ${t.file}`);
}
ok(`${todos.filter((t) => fs.existsSync(t.file)).length}/${todos.length} arquivos existem`);

/* ── 3. sintaxe dos scripts inline ───────────────────────── */
console.log("3) Sintaxe dos <script>");
let synOk = 0, synFail = 0;
const scripts = [];
for (const t of todos) {
  if (!fs.existsSync(t.file)) continue;
  const html = fs.readFileSync(t.file, "utf8");
  const re = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      new vm.Script(m[1], { filename: t.file });
      synOk++;
    } catch (e) {
      synFail++;
      fail(`${path.relative(ZDIR, t.file)}: ${e.message}`);
    }
  }
  const semScripts = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  if (/>[^<]*undefined|content="[^"]*undefined/.test(semScripts)) {
    fail(`${path.relative(ZDIR, t.file)}: contém "undefined" em HTML visível`);
  }
  scripts.push({ ...t, n: (html.match(/<script/g) || []).length });
}
ok("todos os scripts inline compilam (vm.Script)");

/* ── 4. runtime em jsdom ─────────────────────────────────── */
console.log("4) Runtime (jsdom)");
let ran = 0;
for (const t of scripts) {
  const html = fs.readFileSync(t.file, "utf8");
  const erros = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => {
    if (/not implemented/i.test(String(e.message))) return; // canvas etc.
    erros.push(e.message + (e.detail ? " :: " + e.detail : ""));
  });
  vc.on("error", (msg) => erros.push(String(msg)));
  let dom;
  try {
    dom = new JSDOM(html, {
      runScripts: "dangerously",
      pretendToBeVisual: true,
      url: "http://localhost/",
      virtualConsole: vc,
    });
  } catch (e) {
    fail(`${path.relative(ZDIR, t.file)}: JSDOM ${e.message}`);
    continue;
  }
  // captura erros na janela
  try {
    dom.window.onerror = (msg) => erros.push(String(msg));
  } catch {}
  await new Promise((r) => setTimeout(r, 120));
  try {
    // sanity: body montado (wrappers usam iframe, não <main>)
    if (!t.file.endsWith("zcode.html") && !dom.window.document.querySelector("main")) erros.push("sem <main>");
  } catch {}
  ran++;
  if (erros.length) {
    fail(`${path.relative(ZDIR, t.file)}: ${erros[0]}`);
  }
  try { dom.window.close(); } catch {}
}
ok(`${ran} páginas executaram em jsdom sem erros de runtime`);

/* ── 5. links do apps.ts ─────────────────────────────────── */
console.log("5) apps.ts");
const ts = fs.readFileSync(path.join(ROOT, "src/data/apps.ts"), "utf8");
const links = [...ts.matchAll(/link: "([^"]+)"/g)].map((m) => m[1]);
const cats = {};
for (const c of ["estudos", "jogos", "uteis", "social"]) {
  const re = new RegExp(`id: "${c}"[\\s\\S]*?apps: \\[([\\s\\S]*?)\\n    \\]`);
  const m = ts.match(re);
  cats[c] = m ? (m[1].match(/nome:/g) || []).length : -1;
}
for (const [c, n] of Object.entries(cats)) {
  if (c === "social") { if (n !== 3) fail(`social: ${n} apps (esperado 3)`); }
  else if (n !== 100) fail(`${c}: ${n} apps no apps.ts (esperado 100)`);
}
let linkFail = 0;
for (const l of links) {
  if (!l || l === "#" || !l.startsWith("/")) continue; // externos ou âncora
  const p = path.join(ROOT, "public", l.replace(/^\//, ""));
  if (!fs.existsSync(p)) { fail(`link inexistente: ${l}`); linkFail++; }
}
ok(`${links.length - linkFail} links verificados (100×3 + social)`);

/* ── resultado ───────────────────────────────────────────── */
console.log(falhas === 0 ? "\nOK TODOS OS TESTES PASSARAM" : `\nNão ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
