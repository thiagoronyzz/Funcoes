/* Zcode — GERADOR
   Catalogo → 300 apps (HTML estáticos) + wrappers legacy + landings
   + páginas de recursos + apps.ts. Uso: node scripts/zcode/generate.mjs */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOGO, ENGINES, validar } from "./catalog.mjs";
import { appShell, KIT_CSS, KIT_JS, PALETA, CATEGORIAS } from "./kit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ZDIR = path.join(ROOT, "public", "ZCODE");
const CAT_DIR = { estudos: "Estudos", jogos: "Jogos", uteis: "Úteis" };
const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230b0f0d'/%3E%3Crect x='1' y='1' width='62' height='62' rx='13' fill='none' stroke='rgba(255,255,255,0.16)' stroke-width='2'/%3E%3Cpath d='M20 18h24L20 46h24' fill='none' stroke='%2310b981' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
const FONTS =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap";

export function slugify(nome) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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
<link rel="icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS}" rel="stylesheet">
<style>
html,body{margin:0;height:100%;background:${PALETA.bg};color:${PALETA.text};font-family:'Inter',system-ui,sans-serif}
header{position:sticky;top:0;z-index:9;display:flex;align-items:center;gap:12px;height:58px;padding:0 16px;background:rgba(9,13,11,.92);backdrop-filter:blur(12px);border-bottom:1px solid ${PALETA.line}}
.ztop-brand{display:inline-flex;align-items:center;gap:9px;color:${PALETA.text};font-family:'Sora',system-ui,sans-serif;font-weight:800;font-size:17px;text-decoration:none;flex:0 0 auto}
.zlogo{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#10b981,#0d8a63);color:#04120c;font-size:16px;font-weight:800}
header strong{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chip{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:${cor};border:1px solid ${PALETA.line};padding:3px 10px;border-radius:99px;flex:0 0 auto}
.back{color:${PALETA.muted};text-decoration:none;font-size:13px;font-weight:600;border:1px solid ${PALETA.line};border-radius:9px;padding:8px 14px;flex:0 0 auto}
.back:hover{color:${PALETA.text};border-color:${cor}}
iframe{display:block;width:100%;height:calc(100% - 58px);border:0;background:#000}
</style>
</head>
<body>
<header>
  <a class="ztop-brand" href="/"><span class="zlogo">Z</span>code</a>
  <strong>${nome}</strong>
  <span class="chip">${rotulo}</span>
  <a class="back" href="/">← Início</a>
</header>
<iframe src="${page}" title="${nome}"></iframe>
</body>
</html>`;
}

/* ── landing por categoria: diretório com busca ─────────── */
const TITULO = { estudos: "Estudos", jogos: "Jogos", uteis: "Úteis" };
const SUB = {
  estudos: "Guias, simulados e treinos para aprender de verdade — do ENEM ao dia a dia.",
  jogos: "Arcade, estratégia e puzzles. Jogos completos, direto no navegador.",
  uteis: "Calculadoras, conversores e ferramentas profissionais para o trabalho e a rotina.",
};
function landingHtml(catId) {
  const info = { ...CATEGORIAS[catId], titulo: TITULO[catId] };
  const dir = CAT_DIR[catId];
  const slugs = buildSlugs(catId);
  const cards = CATALOGO[catId].map((e, i) => {
    const href = e.legacy ? `${e.legacy}/zcode.html` : `${slugs[i]}/index.html`;
    const letra = e.nome.replace(/^(Flashcards|Quiz|Jogo|Campo|Sequências|Tabuada|Conversor de|Calculadora de|Gerador de|Validador de|Sorteador de)\s*:?\s*/i, "").trim().charAt(0).toUpperCase() || "Z";
    return `<a class="c" href="${href}"><span class="ic">${letra}</span><span class="tx"><b>${e.nome}</b><span>${e.desc}</span></span><span class="go">→</span></a>`;
  }).join("\n");
  const data = JSON.stringify(CATALOGO[catId].map((e) => ({ n: e.nome, d: e.desc })));
  return `<!doctype html>
<html lang="pt-BR" data-cat="${catId}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${info.titulo} — Zcode</title>
<meta name="description" content="100 apps de ${info.titulo.toLowerCase()} da plataforma Zcode: ${SUB[catId]}">
<meta name="theme-color" content="${PALETA.bg}">
<link rel="icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS}" rel="stylesheet">
<style>${KIT_CSS}
.lgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;margin-top:20px}
.c{display:flex;gap:12px;align-items:flex-start;background:var(--z-surface);border:1px solid var(--z-line);
  border-radius:12px;padding:14px 14px;text-decoration:none;color:var(--z-text);transition:.16s}
.c:hover{transform:translateY(-2px);border-color:var(--z-acc)}
.c .ic{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;flex:none;
  font-family:var(--z-fd);font-weight:800;font-size:17px;color:var(--z-acc);
  background:color-mix(in srgb,var(--z-acc) 13%, transparent);
  border:1px solid color-mix(in srgb,var(--z-acc) 30%, transparent)}
.c .tx{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.c b{font-size:14.5px;font-weight:600;letter-spacing:-.01em}
.c .tx>span{font-size:12.5px;color:var(--z-muted);line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.c .go{color:var(--z-muted);font-size:15px;flex:none;transition:.16s}
.c:hover .go{color:var(--z-acc);transform:translateX(3px)}
#busca{width:100%;max-width:460px;margin-top:18px}
.lstats{display:flex;gap:22px;margin-top:14px;flex-wrap:wrap}
.lstats b{font-family:var(--z-fd);font-size:19px}
.lstats span{display:block;font-size:11.5px;color:var(--z-muted)}
</style>
</head>
<body>
<header class="ztop">
  <a class="ztop-brand" href="/"><span class="zlogo">Z</span>code</a>
  <div class="ztop-mid"><strong>${info.titulo}</strong></div>
  <span class="zchip">100 apps</span>
  <a class="zback" href="/">← Início</a>
</header>
<main class="zmain">
  <div class="zhero">
    <p class="mono dim" style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;margin:0 0 10px">Zcode · Diretório</p>
    <h1>${info.titulo}</h1>
    <p>${SUB[catId]}</p>
    <input class="zinput" id="busca" placeholder="Buscar entre os 100 aplicativos…" autocomplete="off">
    <div class="lstats">
      <div><b>100</b><span>aplicativos</span></div>
      <div><b>0</b><span>cadastro exigido</span></div>
      <div><b>100%</b><span>no navegador</span></div>
    </div>
  </div>
  <div class="lgrid" id="grid">
${cards}
  </div>
  <p class="dim center mt" id="vazio" style="display:none">Nenhum aplicativo encontrado para essa busca.</p>
</main>
<footer class="zfoot"><b>Zcode</b> · 300 aplicativos em 3 categorias</footer>
<script>
${KIT_JS}
var D = ${data};
var g = document.getElementById("grid");
var vazio = document.getElementById("vazio");
document.getElementById("busca").addEventListener("input", function(){
  var t = this.value.trim().toLowerCase();
  var cs = g.children, vis = 0;
  for(var i = 0; i < cs.length; i++){
    var d = D[i];
    var ok = (!t || (d.n + " " + d.d).toLowerCase().indexOf(t) >= 0);
    cs[i].style.display = ok ? "" : "none";
    if(ok) vis++;
  }
  vazio.style.display = vis ? "none" : "";
});
</script>
</body>
</html>`;
}

/* ── páginas de recursos (ajuda, instalar, contato) ─────── */
function recursosHtml(pagina) {
  const PAGS = {
    ajuda: {
      nome: "Central de ajuda",
      desc: "Respostas diretas sobre a plataforma Zcode.",
      corpo: `
<div class="zhero"><h1>Central de <em>ajuda</em></h1><p>Respostas diretas sobre a plataforma. Se algo não estiver aqui, fale conosco.</p></div>
<div class="col">
<div class="zcard"><h3>O que é a Zcode?</h3><p class="dim">Uma plataforma com 300 aplicativos que rodam no navegador: guias de estudo, jogos completos e ferramentas para o trabalho e o dia a dia. Sem loja, sem download pesado, sem burocracia.</p></div>
<div class="zcard"><h3>Preciso criar uma conta?</h3><p class="dim">Não. Todos os aplicativos abrem direto, sem cadastro e sem login. Seu progresso em jogos e ferramentas fica salvo no seu próprio navegador.</p></div>
<div class="zcard"><h3>É gratuito?</h3><p class="dim">Sim. Todo o catálogo é gratuito e sem limite de uso.</p></div>
<div class="zcard"><h3>Funciona offline?</h3><p class="dim">Parcialmente: instale a Zcode na tela inicial e os aplicativos que você já visitou continuam abrindo sem internet.</p></div>
<div class="zcard"><h3>Funciona no celular?</h3><p class="dim">Sim. A plataforma e os aplicativos se adaptam a telas pequenas, com controles por toque nos jogos.</p></div>
<div class="zcard"><h3>Meus dados estão seguros?</h3><p class="dim">O que você digita nos aplicativos (anotações, metas, recordes) fica guardado localmente no seu navegador. Nada é enviado para servidores.</p></div>
<div class="zcard"><h3>Encontrei um erro. Como aviso?</h3><p class="dim">Use a página de contato e descreva o aplicativo, o aparelho e o que aconteceu. Prints ajudam bastante.</p></div>
<div class="zcard"><h3>Posso sugerir um aplicativo?</h3><p class="dim">Pode — e deve. Boas ideias entram na fila de produção. Envie pela página de contato.</p></div>
</div>`,
      js: "",
    },
    instalar: {
      nome: "Instalar a Zcode",
      desc: "Leve a plataforma na tela inicial e use até offline.",
      corpo: `
<div class="zhero"><h1>Instalar a <em>Zcode</em></h1><p>Instale direto pelo navegador: ocupa poucos KB, abre em tela cheia e libera o uso offline dos apps visitados.</p></div>
<div class="zgrid zg3">
<div class="zcard"><p class="zchip mb">iPhone / iPad</p><h3 class="mt">No Safari</h3><p class="dim">1. Toque em <b>Compartilhar</b>.<br>2. Escolha <b>Adicionar à Tela de Início</b>.<br>3. Confirme em <b>Adicionar</b>.</p></div>
<div class="zcard"><p class="zchip mb">Android</p><h3 class="mt">No Chrome</h3><p class="dim">1. Abra o menu <b>⋮</b>.<br>2. Toque em <b>Instalar app</b>.<br>3. Confirme e use o ícone criado.</p></div>
<div class="zcard"><p class="zchip mb">Computador</p><h3 class="mt">No Chrome / Edge</h3><p class="dim">1. Abra o menu do navegador.<br>2. Clique em <b>Instalar Zcode</b>.<br>3. O app abre em janela própria.</p></div>
</div>
<div class="zcallout mt"><b>Sem loja, sem atualização manual.</b> Sempre que você abrir com internet, a versão mais nova carrega sozinha.</div>`,
      js: "",
    },
    contato: {
      nome: "Fale conosco",
      desc: "Sugestões, erros e parcerias.",
      corpo: `
<div class="zhero"><h1>Fale <em>conosco</em></h1><p>Sugestões de aplicativos, relato de erros ou parcerias. Respondemos o quanto antes.</p></div>
<div class="zgrid zg2">
<div class="zcard pad">
  <label class="zlabel" for="ct-nome">Seu nome</label>
  <input class="zinput mb" id="ct-nome" autocomplete="name" placeholder="Como podemos te chamar?">
  <label class="zlabel" for="ct-assunto">Assunto</label>
  <select class="zselect mb" id="ct-assunto">
    <option>Sugestão de aplicativo</option>
    <option>Relato de erro</option>
    <option>Dúvida sobre a plataforma</option>
    <option>Parceria</option>
    <option>Outro assunto</option>
  </select>
  <label class="zlabel" for="ct-msg">Mensagem</label>
  <textarea class="ztextarea mb" id="ct-msg" placeholder="Descreva com detalhes. Se for um erro, diga o aplicativo e o aparelho."></textarea>
  <button class="zbtn w" id="ct-enviar" type="button">Abrir e-mail com a mensagem</button>
  <p class="dim mt" style="font-size:12.5px">O botão abre o seu aplicativo de e-mail com tudo preenchido. Nada é enviado sem a sua confirmação.</p>
</div>
<div class="col">
  <div class="zcard"><h3>E-mail direto</h3><p class="dim">Prefere escrever do seu jeito?</p><p class="mt"><a class="zbtn ghost" href="mailto:contato@zcode.dev">contato@zcode.dev</a></p></div>
  <div class="zcard"><h3>Relatando um erro?</h3><p class="dim">Inclua sempre: nome do aplicativo, aparelho/navegador e o passo a passo do problema. Com essas três infos, a correção chega muito mais rápido.</p></div>
</div>
</div>`,
      js: `
document.getElementById("ct-enviar").addEventListener("click", function(){
  var nome = document.getElementById("ct-nome").value.trim();
  var assunto = document.getElementById("ct-assunto").value;
  var msg = document.getElementById("ct-msg").value.trim();
  if(!msg){ Z.toast("Escreva a mensagem antes de enviar."); return; }
  var corpo = (nome ? "Nome: " + nome + "\\n\\n" : "") + msg;
  window.location.href = "mailto:contato@zcode.dev?subject=" + encodeURIComponent("[Zcode] " + assunto) + "&body=" + encodeURIComponent(corpo);
});
`,
    },
  };
  const p = PAGS[pagina];
  return appShell({ cat: "social", nome: p.nome, desc: p.desc, slug: pagina, body: p.corpo, js: p.js });
}

/* ── apps.ts (hub React) ────────────────────────────────── */
const SOCIAL_APPS = [
  { nome: "Central de Ajuda", descricao: "Respostas diretas sobre contas, offline, privacidade e erros.", imagem: "", link: "/ZCODE/Recursos/ajuda.html" },
  { nome: "Instalar a Zcode", descricao: "Passo a passo para iPhone, Android e computador.", imagem: "", link: "/ZCODE/Recursos/instalar.html" },
  { nome: "Fale Conosco", descricao: "Sugestões de apps, relato de erros e parcerias.", imagem: "", link: "/ZCODE/Recursos/contato.html" },
];
const CAT_META = {
  estudos: { rotulo: "Estudos", titulo: "Estudos", descricao: "Guias completos, simulados cronometrados e treinos focados para aprender de verdade." },
  jogos: { rotulo: "Jogos", titulo: "Jogos", descricao: "Arcade, estratégia e raciocínio: jogos completos que rodam direto no navegador." },
  uteis: { rotulo: "Úteis", titulo: "Úteis", descricao: "Calculadoras, conversores e ferramentas profissionais para trabalho e rotina." },
  social: { rotulo: "Recursos", titulo: "Recursos", descricao: "Ajuda, instalação e contato: tudo para aproveitar a plataforma ao máximo." },
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
  const bloco = (a) =>
    `      {\n        nome: ${ts(a.nome)},\n        descricao: ${ts(a.descricao)},\n        imagem: ${ts(a.imagem)},\n        link: ${ts(a.link)},\n      },`;
  const corpo = parts.map((c) =>
    `  {\n    id: ${ts(c.id)},\n    rotulo: ${ts(c.rotulo)},\n    titulo: ${ts(c.titulo)},\n    descricao:\n      ${ts(c.descricao)},\n    apps: [\n${c.apps.map(bloco).join("\n")}\n    ],\n  },`).join("\n");
  return `/* GERADO AUTOMATICAMENTE por scripts/zcode/generate.mjs — não editar à mão. */

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
      const html = appShell({
        cat: id,
        nome: e.nome,
        desc: e.desc,
        slug: slugs[i],
        body: r.body,
        js: r.js,
        css: r.css,
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
  const rdir = path.join(ZDIR, "Recursos");
  ensureDir(rdir);
  for (const p of ["ajuda", "instalar", "contato"]) {
    fs.writeFileSync(path.join(rdir, p + ".html"), recursosHtml(p));
    escritos++;
  }
  console.log("Recursos: 3 páginas");
  const tsPath = path.join(ROOT, "src", "data", "apps.ts");
  fs.writeFileSync(tsPath, genAppsTs());
  escritos++;
  console.log(`apps.ts reescrito (${escritos} arquivos no total)`);
}

export { main };
const __self = path.dirname(fileURLToPath(import.meta.url)) + path.sep + path.basename(fileURLToPath(import.meta.url));
if (process.argv[1] && path.resolve(process.argv[1]) === __self) main();
