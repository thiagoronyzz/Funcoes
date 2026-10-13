// Build a single-file HTML: Libraryz
// Reads book texts from public/books/*.txt and embeds them as JS strings.
import fs from 'node:fs';
import path from 'node:path';

const BOOKS_DIR = 'public/books';

const BOOKS_META = [
  { slug: 'alice',        title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll',     year: 1865, category: 'Fantasia',   coverColor: '#6b2f9d', accent: '#f4c542', spine: '#3b1766' },
  { slug: 'sherlock',     title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', year: 1892, category: 'Mistério',    coverColor: '#2f3a4a', accent: '#c49a4b', spine: '#121823' },
  { slug: 'pride',        title: 'Pride and Prejudice',               author: 'Jane Austen',        year: 1813, category: 'Romance',     coverColor: '#8e2430', accent: '#e8d7b0', spine: '#4a1217' },
  { slug: 'frankenstein', title: 'Frankenstein',                      author: 'Mary Shelley',       year: 1818, category: 'Terror',       coverColor: '#304a32', accent: '#bccaa4', spine: '#152414' },
  { slug: 'dorian',       title: 'The Picture of Dorian Gray',        author: 'Oscar Wilde',        year: 1890, category: 'Clássico',     coverColor: '#1d1d28', accent: '#d4af37', spine: '#0a0a12' },
  { slug: 'dracula',      title: 'Dracula',                           author: 'Bram Stoker',        year: 1897, category: 'Terror',       coverColor: '#5a0a0a', accent: '#d4d4d4', spine: '#2a0505' },
  { slug: 'metamorphosis',title: 'The Metamorphosis',                 author: 'Franz Kafka',        year: 1915, category: 'Ficção',       coverColor: '#4a3622', accent: '#e6d3a1', spine: '#24190e' },
];

function loadText(slug) {
  const p = path.join(BOOKS_DIR, slug + '.txt');
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf8');
}

const books = BOOKS_META.map(b => ({ ...b, text: loadText(b.slug) }));

function escapeForJS(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

const booksJS = books.map(b => `{
  slug: "${b.slug}",
  title: ${JSON.stringify(b.title)},
  author: ${JSON.stringify(b.author)},
  year: ${b.year},
  category: ${JSON.stringify(b.category)},
  coverColor: "${b.coverColor}",
  accent: "${b.accent}",
  spine: "${b.spine}",
  custom: false,
  text: \`${escapeForJS(b.text)}\`
}`).join(',\n');

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Libraryz</title>
<link rel="icon" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='10' fill='%23c49a4b'/><text x='50%25' y='56%25' font-family='serif' font-size='40' font-weight='bold' fill='%231a1410' text-anchor='middle'>Lz</text></svg>" />
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow-x:hidden}
body{
  font-family:'Georgia','Times New Roman',serif;
  background:
    radial-gradient(ellipse at top, #2b2118 0%, #150f0b 60%, #0a0706 100%);
  color:#e8dcc4;min-height:100vh;position:relative;
}
body::before{
  content:"";position:fixed;inset:0;pointer-events:none;opacity:.08;
  background-image:
    repeating-linear-gradient(45deg,#000 0 2px,transparent 2px 4px);
  z-index:0;
}
/* HEADER */
header{
  position:sticky;top:0;z-index:50;padding:18px 28px;
  background:linear-gradient(180deg,rgba(26,20,14,.95),rgba(26,20,14,.75));
  backdrop-filter:blur(8px);
  border-bottom:1px solid rgba(196,154,75,.25);
  display:flex;align-items:center;gap:24px;flex-wrap:wrap;
}
.logo{
  font-family:'Playfair Display',Georgia,serif;
  font-size:34px;font-weight:700;letter-spacing:2px;
  background:linear-gradient(135deg,#e5c77a,#c49a4b,#8a6320);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  text-shadow:0 1px 0 rgba(0,0,0,.3);
}
.logo span{font-weight:400;font-style:italic;opacity:.75}
.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-left:auto;align-items:center}
.btn{
  cursor:pointer;border:1px solid rgba(196,154,75,.5);
  background:linear-gradient(180deg,rgba(196,154,75,.18),rgba(196,154,75,.05));
  color:#f0e3c4;padding:8px 14px;border-radius:6px;
  font-family:inherit;font-size:13px;letter-spacing:.5px;
  transition:all .2s;display:inline-flex;align-items:center;gap:6px;
}
.btn:hover{background:linear-gradient(180deg,rgba(196,154,75,.35),rgba(196,154,75,.15));border-color:#c49a4b;transform:translateY(-1px)}
.btn.primary{background:linear-gradient(180deg,#c49a4b,#8a6320);border-color:#c49a4b;color:#1a1410;font-weight:700}
.btn.primary:hover{background:linear-gradient(180deg,#e5c77a,#c49a4b)}
input[type=file]{display:none}

/* CATEGORY TABS */
.tabs{
  position:sticky;top:74px;z-index:40;padding:12px 28px;
  background:rgba(20,14,10,.85);backdrop-filter:blur(6px);
  border-bottom:1px solid rgba(196,154,75,.15);
  display:flex;gap:8px;flex-wrap:wrap;
}
.tab{
  cursor:pointer;padding:6px 14px;border-radius:20px;
  border:1px solid rgba(196,154,75,.3);color:#c9b993;font-size:13px;
  font-family:inherit;transition:all .2s;background:transparent;
}
.tab:hover{background:rgba(196,154,75,.1);color:#f0e3c4}
.tab.active{background:linear-gradient(180deg,#c49a4b,#8a6320);color:#1a1410;border-color:#c49a4b;font-weight:700}

/* LIBRARY / SHELVES */
.library{padding:30px 28px 80px;position:relative;z-index:1}
.shelf-row{margin-bottom:30px;position:relative}
.shelf-title{
  font-family:'Playfair Display',Georgia,serif;
  font-size:22px;color:#e5c77a;margin-bottom:14px;letter-spacing:1px;
  padding-left:10px;border-left:3px solid #c49a4b;
}
.shelf{
  position:relative;padding:20px 24px 0;min-height:260px;
  display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap;
  background:
    linear-gradient(180deg,transparent 0,transparent 240px,
      linear-gradient(180deg,#6b4a2b 0%,#4a3220 40%,#2e1f14 100%) 240px);
  border-radius:4px;
  box-shadow:
    inset 0 -18px 24px rgba(0,0,0,.6),
    0 8px 16px rgba(0,0,0,.5);
}
.shelf::after{
  content:"";position:absolute;left:0;right:0;bottom:-14px;height:14px;
  background:linear-gradient(180deg,#3a2613,#1c1208);
  border-radius:0 0 4px 4px;box-shadow:0 6px 10px rgba(0,0,0,.5);
}
.shelf::before{
  content:"";position:absolute;left:0;right:0;top:240px;height:6px;
  background:linear-gradient(180deg,rgba(255,255,255,.08),transparent);
  pointer-events:none;
}
.empty{
  color:#7a6a4e;font-style:italic;padding:40px 10px;width:100%;text-align:center;
}

/* BOOK SPINE on shelf */
.book{
  position:relative;width:44px;height:230px;cursor:pointer;
  transform-origin:left center;transform-style:preserve-3d;
  transition:transform .35s cubic-bezier(.4,.2,.2,1), z-index 0s;
  flex-shrink:0;
}
.book:hover{transform:translateY(-12px) rotate(-2deg);z-index:5;filter:brightness(1.1)}
.book .spine{
  position:absolute;inset:0;
  background:linear-gradient(90deg,var(--spine) 0%,var(--cover) 40%,var(--spine) 100%);
  border-radius:2px 4px 4px 2px;
  box-shadow:
    inset 3px 0 6px rgba(255,255,255,.08),
    inset -3px 0 8px rgba(0,0,0,.4),
    0 6px 8px rgba(0,0,0,.5);
  display:flex;align-items:center;justify-content:center;overflow:hidden;
  border-top:2px solid var(--accent);
  border-bottom:2px solid var(--accent);
}
.book .spine::before{
  content:"";position:absolute;top:8px;bottom:8px;left:4px;right:4px;
  border:1px solid rgba(255,255,255,.1);border-radius:1px;pointer-events:none;
}
.book .spine-text{
  writing-mode:vertical-rl;transform:rotate(180deg);
  color:var(--accent);font-size:12px;font-weight:700;letter-spacing:2px;
  text-shadow:0 1px 2px rgba(0,0,0,.6);
  font-family:'Playfair Display',Georgia,serif;
  max-height:200px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;
}
.book .spine-author{
  position:absolute;bottom:6px;left:0;right:0;text-align:center;
  font-size:7px;color:var(--accent);opacity:.7;letter-spacing:1px;
}
.book .pages-edge{
  position:absolute;right:-3px;top:4px;bottom:4px;width:4px;
  background:repeating-linear-gradient(
    90deg, #f4ecd8 0 1px, #d9cfb5 1px 2px);
  border-radius:0 2px 2px 0;
  box-shadow:inset -1px 0 2px rgba(0,0,0,.3);
}

/* BOOK OPENING ANIMATION MODAL */
.reader-modal{
  position:fixed;inset:0;z-index:100;display:none;
  background:rgba(0,0,0,0);transition:background .5s;
  align-items:center;justify-content:center;perspective:2000px;
}
.reader-modal.open{display:flex;background:rgba(5,3,2,.92)}
.reader-stage{
  position:relative;transform-style:preserve-3d;
}
/* The book that grows from shelf */
.book-zoom{
  position:relative;width:54px;height:280px;transform-style:preserve-3d;
  transition:transform 1s cubic-bezier(.5,.1,.2,1);
}
.reader-modal.open .book-zoom{
  transform:translateX(-27px) rotateY(-90deg) scale(1);
}
.book-zoom .spine-z{
  position:absolute;inset:0;
  background:linear-gradient(90deg,var(--spine) 0%,var(--cover) 40%,var(--spine) 100%);
  border-radius:2px 4px 4px 2px;
  border-top:2px solid var(--accent);border-bottom:2px solid var(--accent);
  box-shadow:inset 3px 0 6px rgba(255,255,255,.08),inset -3px 0 8px rgba(0,0,0,.4);
}

/* Open book pages */
.open-book{
  position:absolute;top:0;left:27px;
  width:0;height:280px;
  display:flex;transform-style:preserve-3d;
  transition:width 1s .2s cubic-bezier(.5,.1,.2,1), height 1s .2s cubic-bezier(.5,.1,.2,1);
  overflow:hidden;
}
.reader-modal.open .open-book{width:820px;height:520px;left:-410px;top:-120px}
.cover-open{
  position:absolute;top:0;left:0;height:100%;width:50%;
  background:var(--cover);transform-origin:right center;transform:rotateY(0deg);
  transition:transform 1.2s .6s cubic-bezier(.6,.05,.3,1);
  backface-visibility:hidden;z-index:3;
  border-radius:0 4px 4px 0;
  border-top:2px solid var(--accent);border-bottom:2px solid var(--accent);
  box-shadow:inset -8px 0 20px rgba(0,0,0,.4),0 10px 30px rgba(0,0,0,.6);
  display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;
  color:var(--accent);text-align:center;
}
.reader-modal.open .cover-open{transform:rotateY(-170deg)}
.cover-open h2{font-family:'Playfair Display',serif;font-size:32px;margin-bottom:10px;text-shadow:0 2px 4px rgba(0,0,0,.5)}
.cover-open .author{font-size:16px;opacity:.85;font-style:italic}
.cover-open .deco{font-size:40px;margin:20px 0;opacity:.6}
.pages-inner{
  position:absolute;inset:0;display:flex;
  background:
    linear-gradient(90deg,rgba(0,0,0,.4) 0%,transparent 6%,transparent 94%,rgba(0,0,0,.4) 100%),
    linear-gradient(180deg,#f4ecd8 0%,#efe6cc 100%);
  border-radius:2px 6px 6px 2px;
  box-shadow:0 20px 60px rgba(0,0,0,.7),inset 0 0 40px rgba(120,90,40,.15);
  opacity:0;transition:opacity .3s 1s;
}
.reader-modal.open .pages-inner{opacity:1}
.page{
  width:50%;height:100%;padding:40px 36px;overflow-y:auto;
  color:#2a2218;font-size:15px;line-height:1.7;
  position:relative;
}
.page.left{border-right:1px solid rgba(100,70,30,.2);
  background:linear-gradient(90deg,#efe6cc,#f4ecd8)}
.page.right{border-left:1px solid rgba(100,70,30,.2);
  background:linear-gradient(90deg,#f4ecd8,#ebe2c8)}
.page::before{
  content:"";position:absolute;top:0;bottom:0;width:30px;pointer-events:none;
}
.page.left::before{right:0;background:linear-gradient(-90deg,rgba(0,0,0,.12),transparent)}
.page.right::before{left:0;background:linear-gradient(90deg,rgba(0,0,0,.12),transparent)}
.page h3{font-family:'Playfair Display',serif;font-size:22px;margin-bottom:14px;color:#4a2c11;text-align:center}
.page p{margin-bottom:10px;text-indent:1.5em;text-align:justify}
.page.right p:first-of-type{text-indent:0}

/* CLOSE BUTTON + controls */
.reader-controls{
  position:absolute;top:-44px;right:0;display:flex;gap:8px;
  opacity:0;transition:opacity .3s 1.2s;
}
.reader-modal.open .reader-controls{opacity:1}
.icon-btn{
  width:36px;height:36px;border-radius:50%;
  background:rgba(255,255,255,.08);border:1px solid rgba(196,154,75,.4);
  color:#e5c77a;cursor:pointer;display:grid;place-items:center;
  font-size:16px;transition:all .2s;
}
.icon-btn:hover{background:rgba(196,154,75,.3);transform:scale(1.08)}

.page-nav{
  position:absolute;bottom:-54px;left:50%;transform:translateX(-50%);
  display:flex;gap:14px;align-items:center;
  opacity:0;transition:opacity .3s 1.2s;
}
.reader-modal.open .page-nav{opacity:1}
.page-nav .pn{color:#c9b993;font-size:13px;min-width:80px;text-align:center}

/* PDF viewer inside modal */
.pdf-slot{
  position:absolute;inset:0;background:#1a1410;
  display:none;align-items:center;justify-content:center;
  opacity:0;transition:opacity .3s 1s;
}
.reader-modal.open .pdf-slot{display:flex;opacity:1}
.pdf-slot iframe{
  width:90vw;max-width:900px;height:85vh;border:none;border-radius:4px;
  box-shadow:0 20px 60px rgba(0,0,0,.7);background:#fff;
}
.pdf-slot .pdf-fallback{
  color:#e8dcc4;text-align:center;padding:30px;
}

/* CUSTOMIZE PANEL */
.customize-panel{
  position:fixed;right:0;top:0;bottom:0;width:340px;max-width:92vw;
  background:linear-gradient(180deg,#1f170f,#130d08);
  border-left:1px solid rgba(196,154,75,.25);
  z-index:200;padding:24px;overflow-y:auto;
  transform:translateX(100%);transition:transform .4s cubic-bezier(.4,.2,.2,1);
  box-shadow:-10px 0 30px rgba(0,0,0,.5);
}
.customize-panel.open{transform:translateX(0)}
.customize-panel h3{color:#e5c77a;font-family:'Playfair Display',serif;font-size:22px;margin-bottom:18px;border-bottom:1px solid rgba(196,154,75,.25);padding-bottom:10px}
.field{margin-bottom:16px}
.field label{display:block;font-size:12px;letter-spacing:1px;color:#c9b993;margin-bottom:6px;text-transform:uppercase}
.field input,.field select,.field textarea{
  width:100%;padding:9px 12px;background:#0e0a07;border:1px solid rgba(196,154,75,.25);
  color:#e8dcc4;border-radius:4px;font-family:inherit;font-size:14px;
}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:#c49a4b}
.color-row{display:flex;gap:8px;flex-wrap:wrap}
.swatch{width:30px;height:30px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:all .2s}
.swatch:hover{transform:scale(1.1)}
.swatch.active{border-color:#fff;box-shadow:0 0 0 2px #c49a4b}
.cover-preview{
  width:100%;aspect-ratio:2/3;margin:16px 0;border-radius:4px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:20px;text-align:center;color:var(--accent);
  box-shadow:0 8px 20px rgba(0,0,0,.5);
  border:2px solid var(--accent);
  background:var(--cover);
}
.cover-preview h4{font-family:'Playfair Display',serif;font-size:22px;margin-bottom:8px}
.cover-preview p{font-style:italic;font-size:13px;opacity:.85;margin-bottom:12px}
.cover-preview .dec{font-size:30px;opacity:.6}

/* Toast */
.toast{
  position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(100px);
  background:linear-gradient(180deg,#c49a4b,#8a6320);color:#1a1410;
  padding:12px 22px;border-radius:24px;font-weight:600;font-size:14px;
  z-index:300;transition:transform .4s;box-shadow:0 8px 20px rgba(0,0,0,.5);
}
.toast.show{transform:translateX(-50%) translateY(0)}

/* Page turn animation */
.page-flip{
  position:absolute;top:0;right:0;width:50%;height:100%;
  background:linear-gradient(90deg,#f4ecd8,#ebe2c8);
  transform-origin:left center;transform-style:preserve-3d;
  z-index:5;pointer-events:none;
  box-shadow:-2px 0 10px rgba(0,0,0,.2);
}

/* scrollbar */
.page::-webkit-scrollbar{width:6px}
.page::-webkit-scrollbar-track{background:transparent}
.page::-webkit-scrollbar-thumb{background:rgba(100,70,30,.3);border-radius:3px}

@media (max-width:900px){
  .reader-modal.open .open-book{width:94vw;height:70vh;left:-47vw;top:auto}
  .book{width:38px;height:200px}
  .logo{font-size:26px}
  .page{padding:24px 18px;font-size:13px}
  .cover-open h2{font-size:22px}
}
</style>
</head>
<body>

<header>
  <div class="logo">Libraryz<span> — estante</span></div>
  <div class="toolbar">
    <label class="btn primary" for="file-upload">＋ Adicionar PDF</label>
    <input type="file" id="file-upload" accept="application/pdf" />
    <button class="btn" id="btn-manage">✎ Personalizar selecionado</button>
    <button class="btn" id="btn-download">⬇ Download PDF</button>
    <button class="btn" id="btn-delete">✕ Remover</button>
  </div>
</header>

<div class="tabs" id="tabs"></div>

<main class="library" id="library"></main>

<!-- Reader modal -->
<div class="reader-modal" id="reader">
  <div class="reader-stage" id="stage">
    <div class="book-zoom" id="book-zoom">
      <div class="spine-z"></div>
    </div>
    <div class="open-book" id="open-book">
      <div class="cover-open" id="cover-open">
        <h2 id="cover-title">Título</h2>
        <div class="deco">✦</div>
        <p class="author" id="cover-author">Autor</p>
      </div>
      <div class="pages-inner" id="pages-inner">
        <div class="page left" id="page-left"></div>
        <div class="page right" id="page-right"></div>
      </div>
      <div class="pdf-slot" id="pdf-slot">
        <iframe id="pdf-iframe" title="pdf"></iframe>
        <div class="pdf-fallback" id="pdf-fallback" style="display:none">
          <p>Seu navegador não exibe PDFs embutido.</p>
          <p style="margin-top:10px"><button class="btn primary" id="pdf-open-new">Abrir em nova aba</button></p>
        </div>
      </div>
    </div>
    <div class="reader-controls">
      <button class="icon-btn" id="btn-close" title="Fechar">✕</button>
    </div>
    <div class="page-nav">
      <button class="btn" id="btn-prev">◀ Página anterior</button>
      <span class="pn" id="page-indicator">—</span>
      <button class="btn" id="btn-next">Próxima página ▶</button>
    </div>
  </div>
</div>

<!-- Customize panel -->
<div class="customize-panel" id="customize-panel">
  <h3>Personalizar capa</h3>
  <div class="cover-preview" id="cover-preview">
    <h4 id="pv-title">Título</h4>
    <p id="pv-author">Autor</p>
    <div class="dec">✦</div>
  </div>
  <div class="field">
    <label>Título</label>
    <input type="text" id="in-title" />
  </div>
  <div class="field">
    <label>Autor</label>
    <input type="text" id="in-author" />
  </div>
  <div class="field">
    <label>Categoria</label>
    <input type="text" id="in-category" list="catlist" />
    <datalist id="catlist"></datalist>
  </div>
  <div class="field">
    <label>Cor da capa</label>
    <div class="color-row" id="swatches-cover"></div>
    <input type="color" id="in-cover-color" style="margin-top:8px;width:100%" />
  </div>
  <div class="field">
    <label>Cor do texto/detalhes</label>
    <div class="color-row" id="swatches-accent"></div>
    <input type="color" id="in-accent-color" style="margin-top:8px;width:100%" />
  </div>
  <div style="display:flex;gap:8px;margin-top:20px">
    <button class="btn primary" id="btn-save-cust" style="flex:1">Salvar</button>
    <button class="btn" id="btn-close-cust">Cancelar</button>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
// ===================  DATA ===================
const INITIAL_BOOKS = [${booksJS}];

const COVER_PALETTE = ['#6b2f9d','#2f3a4a','#8e2430','#304a32','#1d1d28','#5a0a0a','#4a3622','#0f3b57','#7a3b00','#3a2a5a','#22422a','#8a6320','#101010','#5c2a6e'];
const ACCENT_PALETTE  = ['#f4c542','#c49a4b','#e8d7b0','#bccaa4','#d4af37','#d4d4d4','#e6d3a1','#ffc98a','#f2e9d0','#ffffff','#000000'];

let books = [];
let selectedId = null;
let activeCategory = 'Todos';
let openBook = null;
let pages = [];
let currentSpread = 0;

// ===================  PERSISTENCE ===================
const STORAGE_KEY = 'libraryz.v1';
function save(){
  // don't store pdf data urls forever in all cases? keep them for session.
  const toStore = books.map(b => ({
    ...b,
    pdfDataUrl: b.pdfDataUrl ? b.pdfDataUrl : undefined,
    text: b.custom ? b.text : undefined // don't double-store built-in texts
  }));
  try{localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))}catch(e){}
}
function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw){ books = INITIAL_BOOKS.map(b => ({...b, id: idFor(b.slug)})); return; }
    const stored = JSON.parse(raw);
    // merge with built-ins to keep texts
    const map = new Map();
    INITIAL_BOOKS.forEach(b => map.set(b.slug, {...b, id: idFor(b.slug)}));
    stored.forEach(b => {
      if(map.has(b.slug)){
        map.set(b.slug, {...map.get(b.slug), ...b, id: idFor(b.slug)});
      } else {
        b.id = idFor(b.slug);
        map.set(b.slug, b);
      }
    });
    books = Array.from(map.values());
  }catch(e){
    books = INITIAL_BOOKS.map(b => ({...b, id: idFor(b.slug)}));
  }
}
function idFor(slug){ return 'b_' + slug; }

// ===================  HELPERS ===================
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._to);
  t._to = setTimeout(()=>t.classList.remove('show'), 2200);
}
function categories(){
  const set = new Set();
  books.forEach(b => set.add(b.category || 'Outros'));
  return ['Todos', ...Array.from(set).sort()];
}
function darker(hex, amt=.4){
  const c = hex.replace('#','');
  const n = parseInt(c,16);
  let r = (n>>16)&255, g=(n>>8)&255, b=n&255;
  r=Math.floor(r*(1-amt)); g=Math.floor(g*(1-amt)); b=Math.floor(b*(1-amt));
  return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
}

// ===================  RENDER LIBRARY ===================
function render(){
  renderTabs();
  renderShelves();
}
function renderTabs(){
  const tabs = document.getElementById('tabs');
  tabs.innerHTML = '';
  categories().forEach(cat=>{
    const btn = document.createElement('button');
    btn.className = 'tab' + (cat===activeCategory?' active':'');
    btn.textContent = cat;
    btn.onclick = ()=>{ activeCategory = cat; render(); };
    tabs.appendChild(btn);
  });
  const dl = document.getElementById('catlist');
  dl.innerHTML = '';
  categories().filter(c=>c!=='Todos').forEach(c=>{
    const o=document.createElement('option');o.value=c;dl.appendChild(o);
  });
}
function renderShelves(){
  const lib = document.getElementById('library');
  lib.innerHTML = '';
  const groups = {};
  books.forEach(b=>{
    if(activeCategory!=='Todos' && b.category!==activeCategory) return;
    const key = b.category || 'Outros';
    (groups[key] = groups[key] || []).push(b);
  });
  const keys = Object.keys(groups).sort();
  if(keys.length===0){
    lib.innerHTML = '<div class="empty">Nenhum livro nesta categoria. Adicione um PDF para começar.</div>';
    return;
  }
  keys.forEach(k=>{
    const row = document.createElement('div');
    row.className = 'shelf-row';
    row.innerHTML = '<div class="shelf-title">'+k+'</div>';
    const shelf = document.createElement('div');
    shelf.className = 'shelf';
    groups[k].forEach(b=>shelf.appendChild(renderBook(b)));
    row.appendChild(shelf);
    lib.appendChild(row);
  });
}
function renderBook(b){
  const el = document.createElement('div');
  el.className = 'book';
  el.dataset.id = b.id;
  el.style.setProperty('--cover', b.coverColor);
  el.style.setProperty('--spine', b.spine || darker(b.coverColor,.55));
  el.style.setProperty('--accent', b.accent);
  if(selectedId===b.id) el.style.outline = '2px dashed #e5c77a';
  el.innerHTML =
    '<div class="spine">'+
      '<div class="spine-text">'+escapeHtml(b.title)+'</div>'+
      '<div class="spine-author">'+escapeHtml(b.author||'')+'</div>'+
    '</div>'+
    '<div class="pages-edge"></div>';
  el.addEventListener('click', e=>{
    if(e.shiftKey||e.ctrlKey||e.metaKey){ select(b.id); return; }
    openReader(b);
  });
  el.addEventListener('contextmenu', e=>{e.preventDefault(); select(b.id);});
  return el;
}
function select(id){
  selectedId = id;
  document.querySelectorAll('.book').forEach(el=>{
    el.style.outline = el.dataset.id===id ? '2px dashed #e5c77a' : '';
  });
  toast('Livro selecionado: '+books.find(b=>b.id===id)?.title);
}
function escapeHtml(s){return (s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

// ===================  READER: paginate + open/close animations ===================
function paginateText(text, title, author){
  // produce an array of page objects (each page = html). Two pages per spread.
  // Simple chunk-by-chars approach but try to break at paragraph boundaries.
  const CHARS_PER_PAGE = 1400;
  const paragraphs = text.split(/\n\n+/).map(p=>p.replace(/\n/g,' ').trim()).filter(Boolean);
  const pagesArr = [];
  // title page
  pagesArr.push({type:'title', title, author});
  let cur = '';
  const flush = ()=>{ if(cur.trim()){ pagesArr.push({type:'text', html: cur}); cur=''; } };
  paragraphs.forEach(p=>{
    const htmlP = '<p>'+escapeHtml(p)+'</p>';
    if((cur + htmlP).length > CHARS_PER_PAGE){ flush(); }
    cur += htmlP;
  });
  flush();
  return pagesArr;
}
function openReader(b){
  openBook = b;
  selectedId = b.id;
  const modal = document.getElementById('reader');
  const bz = document.getElementById('book-zoom');
  const ob = document.getElementById('open-book');
  bz.style.setProperty('--cover', b.coverColor);
  bz.style.setProperty('--spine', b.spine||darker(b.coverColor,.55));
  bz.style.setProperty('--accent', b.accent);
  ob.style.setProperty('--cover', b.coverColor);
  ob.style.setProperty('--accent', b.accent);
  document.getElementById('cover-title').textContent = b.title;
  document.getElementById('cover-author').textContent = b.author + (b.year?' — '+b.year:'');

  const pagesInner = document.getElementById('pages-inner');
  const pdfSlot = document.getElementById('pdf-slot');

  if(b.custom && b.pdfDataUrl){
    pagesInner.style.display='none';
    pdfSlot.style.display='flex';
    const ifr = document.getElementById('pdf-iframe');
    const fb = document.getElementById('pdf-fallback');
    try{ ifr.src = b.pdfDataUrl; fb.style.display='none'; }
    catch(e){ fb.style.display='block'; ifr.style.display='none'; }
    document.getElementById('pdf-open-new').onclick = ()=>{
      const w=window.open();w.document.write('<iframe src="'+b.pdfDataUrl+'" style="width:100vw;height:100vh;border:none"></iframe>');
    };
    document.getElementById('page-nav').style.display='none';
  } else {
    pagesInner.style.display='flex';
    pdfSlot.style.display='none';
    document.getElementById('page-nav').style.display='flex';
    pages = paginateText(b.text||'', b.title, b.author);
    currentSpread = 0;
    renderSpread();
  }

  modal.classList.add('open');
  document.body.style.overflow='hidden';
}
function renderSpread(){
  const L = document.getElementById('page-left');
  const R = document.getElementById('page-right');
  const left = pages[currentSpread*2];
  const right = pages[currentSpread*2+1];
  L.innerHTML = pageContent(left);
  R.innerHTML = pageContent(right);
  L.scrollTop=0; R.scrollTop=0;
  const total = Math.ceil(pages.length/2);
  document.getElementById('page-indicator').textContent = (currentSpread+1)+' / '+total;
  document.getElementById('btn-prev').disabled = currentSpread===0;
  document.getElementById('btn-next').disabled = currentSpread>=total-1;
}
function pageContent(p){
  if(!p) return '';
  if(p.type==='title'){
    return '<h3>'+escapeHtml(p.title)+'</h3><p style="text-align:center;font-style:italic;margin-top:40px">'+escapeHtml(p.author||'')+'</p><p style="text-align:center;margin-top:20px;font-size:24px;opacity:.4">✦</p>';
  }
  return p.html;
}
function flipPage(delta){
  const total = Math.ceil(pages.length/2);
  const next = currentSpread + delta;
  if(next<0||next>=total) return;
  const L = document.getElementById('page-left');
  const R = document.getElementById('page-right');
  // simple fade transition
  L.style.transition=R.style.transition='opacity .35s';
  L.style.opacity=R.style.opacity='0';
  setTimeout(()=>{
    currentSpread = next;
    renderSpread();
    L.style.opacity=R.style.opacity='1';
    setTimeout(()=>{L.style.transition=R.style.transition='';},400);
  },320);
}
function closeReader(){
  const modal = document.getElementById('reader');
  modal.classList.remove('open');
  document.body.style.overflow='';
  const ifr = document.getElementById('pdf-iframe');
  setTimeout(()=>{ ifr.src=''; openBook=null; pages=[]; }, 1200);
}

// ===================  CUSTOMIZE PANEL ===================
let custSlug = null;
function openCustomize(){
  const b = books.find(x=>x.id===selectedId);
  if(!b){ toast('Selecione um livro primeiro (clique com o botão direito ou shift+clique).'); return; }
  custSlug = b.slug;
  document.getElementById('in-title').value = b.title;
  document.getElementById('in-author').value = b.author||'';
  document.getElementById('in-category').value = b.category||'Outros';
  document.getElementById('in-cover-color').value = b.coverColor;
  document.getElementById('in-accent-color').value = b.accent;
  renderSwatches(b.coverColor, b.accent);
  updatePreview();
  document.getElementById('customize-panel').classList.add('open');
}
function closeCustomize(){ document.getElementById('customize-panel').classList.remove('open'); }
function renderSwatches(cover, accent){
  const cBox = document.getElementById('swatches-cover');
  cBox.innerHTML='';
  COVER_PALETTE.forEach(c=>{
    const s=document.createElement('div');s.className='swatch'+(c===cover?' active':' ');
    s.style.background=c;s.onclick=()=>{document.getElementById('in-cover-color').value=c;renderSwatches(c,document.getElementById('in-accent-color').value);updatePreview();};
    cBox.appendChild(s);
  });
  const aBox = document.getElementById('swatches-accent');aBox.innerHTML='';
  ACCENT_PALETTE.forEach(c=>{
    const s=document.createElement('div');s.className='swatch'+(c===accent?' active':' ');
    s.style.background=c;s.onclick=()=>{document.getElementById('in-accent-color').value=c;renderSwatches(document.getElementById('in-cover-color').value,c);updatePreview();};
    aBox.appendChild(s);
  });
}
function updatePreview(){
  const cov = document.getElementById('in-cover-color').value;
  const acc = document.getElementById('in-accent-color').value;
  const pv = document.getElementById('cover-preview');
  pv.style.setProperty('--cover', cov);
  pv.style.setProperty('--accent', acc);
  pv.style.background = cov;
  pv.style.color = acc;
  pv.style.borderColor = acc;
  document.getElementById('pv-title').textContent = document.getElementById('in-title').value;
  document.getElementById('pv-author').textContent = document.getElementById('in-author').value;
}
function saveCustomize(){
  const b = books.find(x=>x.slug===custSlug); if(!b) return;
  b.title = document.getElementById('in-title').value || b.title;
  b.author = document.getElementById('in-author').value || b.author;
  b.category = document.getElementById('in-category').value || 'Outros';
  b.coverColor = document.getElementById('in-cover-color').value;
  b.accent = document.getElementById('in-accent-color').value;
  b.spine = darker(b.coverColor,.55);
  b.custom = true;
  save(); closeCustomize(); render();
  toast('Capa atualizada');
}

// ===================  UPLOAD PDF ===================
function handleFile(file){
  if(!file) return;
  if(file.type!=='application/pdf'){ toast('Apenas arquivos PDF são suportados.'); return; }
  const reader = new FileReader();
  reader.onload = e=>{
    const guessTitle = file.name.replace(/\.pdf$/i,'').replace(/[_-]+/g,' ');
    const slug = 'usr_'+Date.now().toString(36);
    const colors = COVER_PALETTE[Math.floor(Math.random()*COVER_PALETTE.length)];
    const accents = ACCENT_PALETTE[Math.floor(Math.random()*ACCENT_PALETTE.length)];
    const b = {
      slug, id: idFor(slug),
      title: guessTitle, author:'Você', year:new Date().getFullYear(),
      category:'Meus Livros',
      coverColor: colors, accent: accents, spine:darker(colors,.55),
      custom:true, pdfDataUrl: e.target.result, text:''
    };
    books.push(b); selectedId = b.id; save(); render();
    toast('Livro adicionado: '+b.title);
    // auto-open customize
    custSlug = slug;
    document.getElementById('in-title').value = b.title;
    document.getElementById('in-author').value = b.author;
    document.getElementById('in-category').value = b.category;
    document.getElementById('in-cover-color').value = b.coverColor;
    document.getElementById('in-accent-color').value = b.accent;
    renderSwatches(b.coverColor,b.accent); updatePreview();
    document.getElementById('customize-panel').classList.add('open');
  };
  reader.readAsDataURL(file);
}

// ===================  DOWNLOAD PDF ===================
// For built-in books, generate a simple PDF by using the browser print dialog on a styled page.
// For user PDFs, open the data url directly.
function downloadPDF(){
  const b = books.find(x=>x.id===selectedId) || openBook;
  if(!b){ toast('Selecione ou abra um livro primeiro.'); return; }
  if(b.custom && b.pdfDataUrl){
    const a = document.createElement('a');
    a.href = b.pdfDataUrl; a.download = b.title+'.pdf';
    document.body.appendChild(a); a.click(); a.remove();
    return;
  }
  // open a printable version in new window so user can "Save as PDF"
  const w = window.open('','_blank');
  const html = '<!doctype html><html><head><meta charset="utf-8"><title>'+escapeHtml(b.title)+'</title>'+
    '<style>body{font-family:Georgia,serif;max-width:680px;margin:40px auto;padding:20px;color:#222;line-height:1.6}'+
    'h1{font-family:Georgia;text-align:center;border-bottom:2px solid #8a6320;padding-bottom:10px}h2{text-align:center;font-style:italic;font-weight:normal;color:#666;margin-bottom:40px}'+
    'p{margin-bottom:12px;text-align:justify;text-indent:1.5em}'+
    '@page{margin:2cm}</style></head><body>'+
    '<h1>'+escapeHtml(b.title)+'</h1><h2>'+escapeHtml(b.author)+'</h2>'+
    (b.text||'').split(/\n\n+/).map(p=>'<p>'+escapeHtml(p.replace(/\n/g,' '))+'</p>').join('')+
    '<script>window.onload=()=>{setTimeout(()=>window.print(),400)}<\\/script></body></html>';
  w.document.write(html); w.document.close();
  toast('Use "Salvar como PDF" na janela de impressão.');
}

function deleteBook(){
  const b = books.find(x=>x.id===selectedId);
  if(!b){toast('Selecione um livro.');return}
  if(!confirm('Remover "'+b.title+'"?')) return;
  books = books.filter(x=>x.id!==b.id);
  selectedId = null; save(); render();
  toast('Livro removido');
}

// ===================  INIT ===================
function init(){
  load(); render();

  document.getElementById('file-upload').addEventListener('change',e=>{
    const f = e.target.files[0]; handleFile(f); e.target.value='';
  });
  document.getElementById('btn-manage').onclick = openCustomize;
  document.getElementById('btn-download').onclick = downloadPDF;
  document.getElementById('btn-delete').onclick = deleteBook;
  document.getElementById('btn-close').onclick = closeReader;
  document.getElementById('reader').addEventListener('click',e=>{
    if(e.target.id==='reader') closeReader();
  });
  document.getElementById('btn-prev').onclick = ()=>flipPage(-1);
  document.getElementById('btn-next').onclick = ()=>flipPage(1);
  document.addEventListener('keydown',e=>{
    if(document.getElementById('reader').classList.contains('open')){
      if(e.key==='Escape') closeReader();
      if(e.key==='ArrowLeft') flipPage(-1);
      if(e.key==='ArrowRight') flipPage(1);
    }
  });
  document.getElementById('btn-save-cust').onclick = saveCustomize;
  document.getElementById('btn-close-cust').onclick = closeCustomize;
  ['in-title','in-author','in-category','in-cover-color','in-accent-color'].forEach(id=>{
    document.getElementById(id).addEventListener('input',()=>{
      renderSwatches(document.getElementById('in-cover-color').value,document.getElementById('in-accent-color').value);
      updatePreview();
    });
  });
}
init();
</script>
</body>
</html>
`;

fs.writeFileSync('index.html', html, 'utf8');
console.log('Wrote index.html:', html.length, 'bytes');
