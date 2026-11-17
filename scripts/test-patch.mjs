// Применяет патчи к оригинальным бандлам Devin в памяти и проверяет, что JS парсится
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import * as acorn from "acorn";
const require = createRequire(import.meta.url);
const p = require("../extension/src/patcher.js");
const app = process.argv[2] || "/usr/share/devin-desktop/resources/app";
const data = "extension/data";
const j = f => JSON.parse(fs.readFileSync(path.join(data, f), "utf8"));
const [ruT, ruR, hard] = [j("ru-translation.json"), j("ru-review.json"), j("hardcoded.ru.json")];
let bad = 0;
for (const rel of ["vs/sessions/sessions.desktop.main.js", "vs/workbench/windsurf-chat-client/index.js"]) {
  const f = path.join(app, "out", rel);
  const src = fs.readFileSync(fs.existsSync(f + ".ru-orig") ? f + ".ru-orig" : f, "utf8");
  const i18n = p.patchI18nInit(src, ruT, ruR);
  const { src: out, n } = p.patchHardcoded(i18n ?? src, hard);
  let ok = true;
  try { acorn.parse(out, { ecmaVersion: "latest", sourceType: "module" }); } catch (e) { ok = false; bad++; console.log(e.message, JSON.stringify(out.slice(e.pos - 120, e.pos + 60))); }
  console.log(rel, { i18n: i18n !== null, hardcoded: n, parses: ok });
}
process.exit(bad ? 1 : 0);
