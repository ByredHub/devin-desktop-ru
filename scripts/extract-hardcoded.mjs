// Захардкоженные английские строки в JSX окна агентов и Cascade → l10n/en/devin-hardcoded.json
// usage: node scripts/extract-hardcoded.mjs <resources/app>
import fs from "fs"; import path from "path";
const readOrig = f => fs.readFileSync(fs.existsSync(f + ".ru-orig") ? f + ".ru-orig" : f, "utf8");
export const BUNDLES = ["out/vs/sessions/sessions.desktop.main.js", "out/vs/workbench/windsurf-chat-client/index.js"];
export const TERN_RE = /children:\[?!?[\w$.]+(?:===?"[^"\n]{0,40}")?\?"([A-Z](?:[^"\\\n|]|\\u[0-9a-fA-F]{4}){1,120})":"([A-Z](?:[^"\\\n|]|\\u[0-9a-fA-F]{4}){1,120})"/g;
export const PROP_RE = /([,{])((?:children|title|subtitle|placeholder|label|tooltip|description|"aria-label"|ariaLabel|confirmText|cancelText|heading|emptyText):\[?)"([A-Z][^"\\\n]{1,200})"/g;
const APP = process.argv[2];
if (!APP) { console.error("usage: extract-hardcoded.mjs <resources/app>"); process.exit(1); }
const out = {};
for (const b of BUNDLES) {
  const src = readOrig(path.join(APP, b));
  for (const m of src.matchAll(PROP_RE)) {
    const text = m[3]; const prop = m[2];
    if (!/[a-z]{2}/.test(text) || /^[A-Z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*$/.test(text) && !text.includes(" ")) continue; // CamelCase/идентификаторы
    const before = src.slice(Math.max(0, m.index - 600), m.index);
    const jsx = before.lastIndexOf(".jsx)(") >= 0 || before.lastIndexOf(".jsxs)(") >= 0 || before.lastIndexOf("createElement(") >= 0;
    if (!jsx) continue;
    out[`${prop}"${text}"`] = text;
  }
}
for (const b of BUNDLES) {
  const src = readOrig(path.join(APP, b));
  for (const m of src.matchAll(TERN_RE)) out[`?"${m[1]}":"${m[2]}"`] = `${m[1]}|${m[2]}`;
}
const sorted = Object.fromEntries(Object.keys(out).sort().map(k => [k, out[k]]));
fs.writeFileSync("l10n/en/devin-hardcoded.json", JSON.stringify(sorted, null, 1) + "\n");
console.log("devin-hardcoded.json", Object.keys(sorted).length);
