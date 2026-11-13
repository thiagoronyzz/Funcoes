import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(ROOT);
import { JSDOM, VirtualConsole } from "jsdom";
const html = fs.readFileSync(path.join(ROOT, "parallax-standalone.html"), "utf8");
const vc = new VirtualConsole();
const errs = [];
vc.on("jsdomError", (e) => { if (!/Could not parse CSS/.test(e.message)) errs.push(e.message.slice(0, 120)); });
vc.on("error", (...a) => errs.push(String(a[0]).slice(0, 120)));
const dom = new JSDOM(html, { url: "file:///x/index.html", runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc });
await new Promise((r) => setTimeout(r, 1800));
const { document: doc, window } = dom.window;
const click = (el) => el?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
const rail = [...doc.querySelectorAll("nav.par-rail button, nav.par-rail a")];
console.log("itens da rail:", rail.map((b) => (b.textContent || "").trim().slice(0, 14)).join(" | "));
const seen = [];
for (const b of rail) {
  click(b);
  await new Promise((r) => setTimeout(r, 260));
  const main = doc.querySelector(".par-main");
  seen.push(`${(b.textContent || "").trim().slice(0, 12)}:${main?.textContent?.length ?? 0}`);
}
console.log(seen.join("  "));
console.log("erros:", errs.length, errs.slice(0, 3).join(" | "));
process.exit(errs.length ? 1 : 0);
