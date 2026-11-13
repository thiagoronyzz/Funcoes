// Parallax · empacotador da extensão
// Valida o manifest, confere os arquivos referenciados e gera um .zip em extension/dist.
// Sem dependências externas.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve("extension");
const OUT_DIR = path.join(ROOT, "dist");
const manifestPath = path.join(ROOT, "manifest.json");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const problems = [];
const required = new Set();

required.add("manifest.json");
if (manifest.background?.service_worker) required.add(manifest.background.service_worker);
if (manifest.action?.default_popup) required.add(manifest.action.default_popup);
for (const icon of Object.values(manifest.action?.default_icon ?? {})) required.add(icon);
for (const icon of Object.values(manifest.icons ?? {})) required.add(icon);
for (const cs of manifest.content_scripts ?? []) {
  (cs.js ?? []).forEach((f) => required.add(f));
  (cs.css ?? []).forEach((f) => required.add(f));
}
for (const res of manifest.web_accessible_resources ?? []) (res.resources ?? []).forEach((f) => required.add(f));

for (const file of required) {
  if (!fs.existsSync(path.join(ROOT, file))) problems.push(`arquivo referenciado não existe: ${file}`);
}

// CSS referenciado pelo shadow root e welcome embutido
const extra = ["content/parallax.css", "popup/popup.css", "popup/popup.js", "popup/welcome.html", "popup/welcome.js"];
for (const file of extra) if (!fs.existsSync(path.join(ROOT, file))) problems.push(`arquivo auxiliar ausente: ${file}`);

// checagem de sintaxe básica dos JS (evita zip com arquivo quebrado)
for (const file of required) {
  if (!file.endsWith(".js")) continue;
  const code = fs.readFileSync(path.join(ROOT, file), "utf8");
  try {
    // eslint-disable-next-line no-new-func
    new Function(code);
  } catch (err) {
    problems.push(`erro de sintaxe em ${file}: ${err.message}`);
  }
}

// permissões mínimas
const perms = manifest.permissions ?? [];
const suspicious = perms.filter((p) => ["tabs", "webRequest", "cookies", "history", "downloads", "clipboardRead"].includes(p));
if (suspicious.length) problems.push(`permissões além do necessário: ${suspicious.join(", ")}`);
if (!(manifest.host_permissions ?? []).includes("<all_urls>")) problems.push("host_permissions precisa de <all_urls> para o motor genérico");

if (problems.length) {
  console.error("✗ extensão inválida:");
  problems.forEach((p) => console.error("  -", p));
  process.exit(1);
}

const files = [...new Set([...required, ...extra])].sort();
const zip = buildZip(files);
fs.mkdirSync(OUT_DIR, { recursive: true });
const out = path.join(OUT_DIR, `parallax-extension-${manifest.version}.zip`);
fs.writeFileSync(out, zip);
const kb = (zip.length / 1024).toFixed(1);
console.log(`✓ manifest válido · ${files.length} arquivos`);
console.log(`✓ manifest v${manifest.version} · ${manifest.name}`);
console.log(`✓ ${manifest.commands ? Object.keys(manifest.commands).length : 0} atalhos · ${manifest.content_scripts.length} content script(s)`);
console.log(`✓ pacote: ${path.relative(process.cwd(), out)} (${kb} KB)`);

/* ---------- zip mínimo (store, sem compressão) ---------- */
function buildZip(fileList) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const file of fileList) {
    const nameBuf = Buffer.from(file, "utf8");
    const data = fs.readFileSync(path.join(ROOT, file));
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8); // store
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, data);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(data.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([cd, nameBuf]));

    offset += local.length + nameBuf.length + data.length;
  }

  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(fileList.length, 8);
  end.writeUInt16LE(fileList.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, centralBuf, end]);
}

function crc32(buf) {
  if (!crc32.table) {
    crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crc32.table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crc32.table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}
