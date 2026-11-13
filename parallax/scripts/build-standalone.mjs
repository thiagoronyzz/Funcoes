#!/usr/bin/env node
/**
 * Gera `parallax-standalone.html`: o app inteiro num único arquivo, sem servidor.
 *
 * Passos: build normal do Vite → lê dist/index.html → embute CSS e JS.
 * O bundle entra como <script> clássico (sem type="module"), pois módulos
 * inline não podem ser carregados de `file://` em vários navegadores.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const outFile = path.join(root, "parallax-standalone.html");

const fmt = (n) => `${(n / 1024).toFixed(1)} kB`;

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

console.log("· build de produção");
execFileSync("npx", ["vite", "build", "--logLevel", "warn"], { cwd: root, stdio: "inherit" });

const distHtml = path.join(dist, "index.html");
if (!fs.existsSync(distHtml)) fail("dist/index.html não existe — o build falhou?");

const assetsDir = path.join(dist, "assets");
const assets = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
const jsFile = assets.find((f) => f.endsWith(".js"));
const cssFile = assets.find((f) => f.endsWith(".css"));
if (!jsFile) fail("nenhum bundle .js encontrado em dist/assets");

const js = fs.readFileSync(path.join(assetsDir, jsFile), "utf8");
const css = cssFile ? fs.readFileSync(path.join(assetsDir, cssFile), "utf8") : "";

// Um <script> clássico roda antes do parse do <body>, então o bundle embutido
// precisa tolerar a ausência do #root no primeiro instante. Hoje o main.tsx
// procura #root na hora do mount — garantimos o elemento antes via defer lógico.
if (/\bimport\.meta\b/.test(js)) fail("o bundle usa import.meta e não roda como script clássico");
if (/^\s*(import|export)\s/m.test(js)) fail("o bundle tem import/export de topo — script clássico não serve");

let html = fs.readFileSync(distHtml, "utf8");
html = html
  .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>\s*/g, "")
  .replace(/<link[^>]*rel="stylesheet"[^>]*>\s*/g, "");

// substituição por função: strings com $&, $1 ou $' seriam interpretadas pelo replace
if (css) html = html.replace("</head>", () => `    <style>\n${css}\n</style>\n  </head>`);

// Escapa o terminador de script dentro do bundle (seguro: "/" não muda semântica em JS).
const safeJs = js.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");
html = html.replace("</body>", () => `    <script>\n${safeJs}\n</script>\n  </body>`);

fs.writeFileSync(outFile, html);
// checa só o markup (o bundle inline contém strings com src=/href=)
const markup = html.replace(/<script>[\s\S]*?<\/script>/g, "");
const external = (markup.match(/(?:src|href)="(?!data:)[^"]+"/g) || []).filter((m) => !m.includes("#"));
console.log(`✓ ${path.basename(outFile)} · ${fmt(Buffer.byteLength(html))} · ${fmt(Buffer.byteLength(js))} js · ${fmt(Buffer.byteLength(css))} css`);
if (external.length) {
  console.error(`✗ ainda há referências externas: ${external.slice(0, 5).join(", ")}`);
  process.exit(1);
}
// o bundle inteiro precisa estar dentro de um único <script>, sem tags vazando
const scriptBody = html.slice(html.indexOf("<script>") + 8, html.indexOf("</script>", html.indexOf("<script>")));
if (/<\/(html|body|head)>/i.test(scriptBody)) fail("o JS embutido contém tags HTML — substituição corrompida");
// "<script" isolado é inofensivo em script clássico; o perigoso é o fechamento e o
// início de comentário HTML, que colocam o tokenizer em estado de escape duplo.
if (/<\/script/i.test(scriptBody)) fail("o JS embutido fecha o próprio <script>");
if (/<!--/.test(scriptBody)) fail("o JS embutido contém comentário HTML (<!--)");

console.log("✓ nenhuma referência externa — abre com duplo clique, offline");
