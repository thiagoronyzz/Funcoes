/* Zcode — GERADOR
   Catalogo → 300 apps (HTML estáticos) + wrappers legacy + landings
   + apps.ts + ícones. Uso: node scripts/zcode/generate.mjs */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOGO, ENGINES, validar } from "./catalog.mjs";
import { appShell, KIT_CSS, KIT_JS, PALETA, CATEGORIAS } from "./kit.mjs";
import { GBASE, GCSS } from "./engines/gbase.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ZDIR = path.join(ROOT, "public", "ZCODE");
const CAT_DIR = { estudos: "Estudos", jogos: "Jogos", uteis: "Úteis" };

export function slugify(nome) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* slugs únicos por categoria (determinístico) */
export function buildSlugs(catId) {
  const usados = new Set();
  const out = [];
  for (const e of CATALOGO[catId]) {
    if (e.legacy) { out.push(e.legacy); continue; }
    let s = slugify(e.nome);
    let i = 2;
    while (usados.has(s)) s = slugify(e.nome) + "-" + i++;
    usados.add(s);
    out.push(s);
  }
  return out;
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

/* ── wrapper legacy: top bar Zcode + iframe ─────────────── */
function wrapperHtml({ nome, desc, page, rotulo, cor }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${nome} — Zcode</title>
<meta name="description" content="${desc}">
<meta name="theme-color" content="${PALETA.bg}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23f3f0ea'/%3E%3Cpath d='M20 18h24L20 46h24' fill='none' stroke='%23252422' stroke-width='7' stroke-linecap='square'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&display=swap" rel="stylesheet">
<style>
html,body{margin:0;height:100%;background:${PALETA.bg};font-family:'DM Sans',system-ui,sans-serif}
header{position:sticky;top:0;z-index:9;display:flex;align-items:center;gap:12px;height:56px;padding:0 14px;background:${PALETA.bg2};border-bottom:1px solid ${PALETA.line};color:${PALETA.text}}
.ztop-brand{color:${PALETA.text};font-family:Georgia,serif;font-size:21px;letter-spacing:-.04em;text-decoration:none;flex:0 0 auto}
header strong{font-size:15px;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chip{margin-left:auto;font-size:11.5px;color:${cor || PALETA.cyan};border:1px solid ${PALETA.line};padding:4px 10px;border-radius:4px;flex:0 0 auto}
.back{color:${PALETA.muted};text-decoration:none;font-size:13.5px;flex:0 0 auto}
.back:hover{color:${PALETA.text}}
iframe{display:block;width:100%;height:calc(100% - 56px);border:0}
</style>
</head>
<body>
<header>
  <a class="ztop-brand" href="/">Zcode</a>
  <strong>${nome}</strong>
  <span class="chip">${rotulo}</span>
  <a class="back" href="/">← Zcode</a>
</header>
<iframe src="${page}" title="${nome}"></iframe>
</body>
</html>`;
}

/* ── landing por categoria: grade de 100 + busca ────────── */
const TITULO = { estudos: "Estudos", jogos: "Jogos", uteis: "Úteis" };
function landingHtml(catId) {
  const info = { ...CATEGORIAS[catId], titulo: TITULO[catId] };
  const dir = CAT_DIR[catId];
  const slugs = buildSlugs(catId);
  const cards = CATALOGO[catId].map((e, i) => {
    const href = e.legacy ? `${e.legacy}/zcode.html` : `${slugs[i]}/index.html`;
    return `<a class="c" href="${href}"><b class="fd">${e.nome}</b><span>${e.desc}</span></a>`;
  }).join("\n");
  const data = JSON.stringify(CATALOGO[catId].map((e, i) => ({
    n: e.nome, d: e.desc, h: e.legacy ? `${e.legacy}/zcode.html` : `${slugs[i]}/index.html`,
  })));
  return `<!doctype html>
<html lang="pt-BR" data-cat="${catId}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${info.titulo} — Zcode</title>
<meta name="description" content="${CATALOGO[catId].length} apps de ${info.titulo.toLowerCase()} da plataforma Zcode.">
<meta name="theme-color" content="${PALETA.bg}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23f3f0ea'/%3E%3Cpath d='M20 18h24L20 46h24' fill='none' stroke='%23252422' stroke-width='7' stroke-linecap='square'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>${KIT_CSS}
.lgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin-top:16px}
.c{display:flex;flex-direction:column;gap:6px;background:var(--z-surface);border:1px solid var(--z-line);border-radius:16px;padding:14px 16px;text-decoration:none;color:var(--z-text);transition:transform .15s,border-color .15s}
.c:hover{transform:translateY(-2px);border-color:var(--z-acc)}
.c b{font-family:var(--z-fd);font-size:15.5px;color:var(--z-text)}
.c span{font-size:12.5px;color:var(--z-muted);line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
#busca{width:100%;max-width:420px;margin-top:18px}
</style>
</head>
<body>
<header class="ztop">
  <a class="ztop-brand" href="/">Zcode</a>
  <div class="ztop-mid"><strong>${info.titulo} — Zcode</strong></div>
  <a class="zback" href="/">← Home</a>
</header>
<main class="zmain">
  <div class="zhero">
    <h1>${info.titulo}</h1>
    <p>${CATALOGO[catId].length} aplicativos · escolha o seu</p>
    <input class="zinput" id="busca" placeholder="Buscar neste catálogo…" autocomplete="off">
  </div>
  <div class="lgrid" id="grid">
${cards}
  </div>
</main>
<footer class="zfoot"><b>Zcode</b> · ${CATALOGO.estudos.length + CATALOGO.jogos.length + CATALOGO.uteis.length} aplicativos em 3 categorias</footer>
<script>
${KIT_JS}
var D = ${data};
var g = document.getElementById("grid");
document.getElementById("busca").addEventListener("input", function(){
  var t = this.value.trim().toLowerCase();
  var cs = g.children;
  for(var i = 0; i < cs.length; i++){
    var d = D[i];
    cs[i].style.display = (!t || (d.n + " " + d.d).toLowerCase().indexOf(t) >= 0) ? "" : "none";
  }
});
</script>
</body>
</html>`;
}

/* ── apps.ts (hub React) ────────────────────────────────── */
const SOCIAL_APPS = [
  { nome: "Romanov", descricao: "Rede social para filósofos.", imagem: "/images/editorial/meeting.jpg", link: "shorturl.sh/romanov" },
  { nome: "Meus Links", descricao: "Todos os meus perfis e redes sociais em uma página só.", imagem: "/images/editorial/community.jpg", link: "#" },
  { nome: "Comenta Aí", descricao: "Mural aberto para deixar recados e sugestões de apps.", imagem: "/images/editorial/meeting.jpg", link: "#" },
];
const CAT_META = {
  estudos: { rotulo: "Categoria.01", titulo: "Estudos", descricao: "Ferramentas para aprender melhor: foco, revisão, quizzes e tudo que ajuda na hora de estudar." },
  jogos: { rotulo: "Categoria.02", titulo: "Jogos", descricao: "270 jogos originais: arcade, estratégia, puzzle, gestão e narrativa — cada um com mecânica própria." },
  uteis: { rotulo: "Categoria.03", titulo: "Úteis", descricao: "Calculadoras, conversores e ferramentas do dia a dia que resolvem em segundos." },
  social: { rotulo: "Categoria.04", titulo: "Social", descricao: "Onde me encontrar e interagir: chats, links e experimentos comunitários da plataforma." },
};
function ts(s) { return JSON.stringify(s); }
function genAppsTs() {
  const parts = [];
  for (const id of ["estudos", "jogos", "uteis"]) {
    const slugs = buildSlugs(id);
    const dir = CAT_DIR[id];
    const apps = CATALOGO[id].map((e, i) => ({
      nome: e.nome,
      descricao: e.desc,
      imagem: e.imagem || "",
      link: e.legacy ? `/ZCODE/${dir}/${e.legacy}/zcode.html` : `/ZCODE/${dir}/${slugs[i]}/index.html`,
    }));
    parts.push({ id, ...CAT_META[id], apps });
  }
  parts.push({ id: "social", ...CAT_META.social, apps: SOCIAL_APPS });
  const total = parts.reduce((a, c) => a + c.apps.length, 0);
  const bloco = (a) =>
    `      {\n        nome: ${ts(a.nome)},\n        descricao: ${ts(a.descricao)},\n        imagem: ${ts(a.imagem)},\n        link: ${ts(a.link)},\n      },`;
  const corpo = parts.map((c) =>
    `  {\n    id: ${ts(c.id)},\n    rotulo: ${ts(c.rotulo)},\n    titulo: ${ts(c.titulo)},\n    descricao:\n      ${ts(c.descricao)},\n    apps: [\n${c.apps.map(bloco).join("\n")}\n    ],\n  },`).join("\n");
  return `/* GERADE AUTOMATICAMENTE por scripts/zcode/generate.mjs — não editar à mão. */

export interface AppItem {
  nome: string;
  descricao: string;
  imagem: string;
  link: string;
}

export type CategoriaId = "estudos" | "jogos" | "uteis" | "social";

export interface Categoria {
  id: CategoriaId;
  rotulo: string;
  titulo: string;
  descricao: string;
  apps: AppItem[];
}

export const categorias: Categoria[] = [
${corpo}
];

export const totalApps = categorias.reduce((acc, c) => acc + c.apps.length, 0);
`;
}

/* ── main ───────────────────────────────────────────────── */
function main() {
  const erros = validar();
  if (erros.length) {
    console.error("CATÁLOGO INVÁLIDO:");
    erros.forEach((e) => console.error("  -", e));
    process.exit(1);
  }
  let escritos = 0;
  for (const id of ["estudos", "jogos", "uteis"]) {
    const dir = path.join(ZDIR, CAT_DIR[id]);
    const slugs = buildSlugs(id);
    CATALOGO[id].forEach((e, i) => {
      if (e.legacy) {
        const p = path.join(dir, e.legacy, "zcode.html");
        fs.writeFileSync(p, wrapperHtml({ nome: e.nome, desc: e.desc, page: e.page, rotulo: CATEGORIAS[id].rotulo, cor: CATEGORIAS[id].cor }));
        escritos++;
        return;
      }
      const engine = ENGINES[id][e.engine];
      if (!engine) throw new Error(`Engine inexistente: ${e.engine} (${e.nome})`);
      const args = { nome: e.nome, sub: e.desc, audio: true, ...e.params };
      if (args.gen !== undefined && !args.titulo) args.titulo = e.nome;
      if (e.engine === "mcq" && !args.total) {
        try { args.total = new Function("return " + args.gen + "()")().length; } catch { /* mantém padrão */ }
      }
      const r = engine(args);
      const ehJogo = id === "jogos";
      const html = appShell({
        cat: id,
        nome: e.nome,
        desc: e.desc,
        slug: slugs[i],
        body: r.body,
        js: ehJogo ? GBASE + "\n" + r.js : r.js,
        css: ehJogo ? (r.css || "") + GCSS : r.css,
        audio: true,
      });
      const p = path.join(dir, slugs[i], "index.html");
      ensureDir(path.dirname(p));
      fs.writeFileSync(p, html);
      escritos++;
    });
    fs.writeFileSync(path.join(dir, "index.html"), landingHtml(id));
    escritos++;
    console.log(`${CAT_DIR[id]}: ${CATALOGO[id].length} apps + landing`);
  }
  const tsPath = path.join(ROOT, "src", "data", "apps.ts");
  fs.writeFileSync(tsPath, genAppsTs());
  escritos++;
  console.log(`apps.ts reescrito (${escritos} arquivos no total)`);
}

export { main };
const __self = path.dirname(fileURLToPath(import.meta.url)) + path.sep + path.basename(fileURLToPath(import.meta.url));
if (process.argv[1] && path.resolve(process.argv[1]) === __self) main();
