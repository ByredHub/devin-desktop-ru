// Извлекает английские исходники строк из установленного Devin Desktop.
// node scripts/extract.mjs <path-to-resources/app> <path-to-unpacked-ms-ru-pack/extension>
import fs from "fs"; import path from "path"; import * as acorn from "acorn";
const [APP, MSRU] = process.argv.slice(2);
if (!APP || !MSRU) { console.error("usage: extract.mjs <resources/app> <ms-ru-pack/extension>"); process.exit(1); }
const out = p => path.join("l10n/en", p);
const rd = p => JSON.parse(fs.readFileSync(p, "utf8"));
const write = (f, o) => { fs.writeFileSync(out(f), JSON.stringify(o, null, 1) + "\n"); console.log(f, Object.keys(o).length); };

// 1. VS Code core NLS, которых нет в паке Microsoft
const keys = rd(path.join(APP, "out/nls.keys.json")), msgs = rd(path.join(APP, "out/nls.messages.json"));
const ru = rd(path.join(MSRU, "translations/main.i18n.json")).contents;
let i = 0; const core = {};
for (const [m, ks] of keys) for (const k of ks) { const key = typeof k === "string" ? k : k.key; if (!(ru[m] && key in ru[m])) core[`${m}#${key}`] = msgs[i]; i++; }
write("vscode-core.json", core);

// 2. Встроенные расширения: package.nls.json и l10n/bundle.l10n.json
const ext = {}; const extDir = path.join(APP, "extensions");
for (const d of fs.readdirSync(extDir)) {
  const pj = path.join(extDir, d, "package.json"); if (!fs.existsSync(pj)) continue;
  const p = rd(pj); const id = `${p.publisher || "vscode"}.${p.name}`;
  const tf = path.join(MSRU, "translations/extensions", id + ".i18n.json");
  const have = fs.existsSync(tf) ? rd(tf).contents : {};
  const add = (part, file) => { if (!fs.existsSync(file)) return; for (const [k, v] of Object.entries(rd(file))) { const s = typeof v === "string" ? v : v.message; if (!(have[part] && k in have[part])) ext[`${id}/${part}#${k}`] = s; } };
  add("package", path.join(extDir, d, "package.nls.json"));
  add("bundle", path.join(extDir, d, "l10n/bundle.l10n.json"));
  // фирменные расширения Devin без NLS: строки прямо в package.json
  if (/^windsurf/.test(d)) {
    const c = p.contributes || {};
    if (p.displayName) ext[`${id}/manifest#displayName`] = p.displayName;
    if (p.description) ext[`${id}/manifest#description`] = p.description;
    (c.commands || []).forEach(x => { if (x.title) ext[`${id}/manifest#command:${x.command}:title`] = x.title; if (x.category) ext[`${id}/manifest#command:${x.command}:category`] = x.category; });
    const cfg = Array.isArray(c.configuration) ? c.configuration : c.configuration ? [c.configuration] : [];
    cfg.forEach((g, gi) => { if (g.title) ext[`${id}/manifest#config:${gi}:title`] = g.title;
      for (const [k, v] of Object.entries(g.properties || {})) for (const f of ["description", "markdownDescription", "deprecationMessage", "markdownDeprecationMessage"]) if (typeof v[f] === "string") ext[`${id}/manifest#setting:${k}:${f}`] = v[f];
      for (const [k, v] of Object.entries(g.properties || {})) (v.enumDescriptions || v.markdownEnumDescriptions || []).forEach((s, j) => { if (s) ext[`${id}/manifest#setting:${k}:enum:${j}`] = s; }); });
    for (const [vc, views] of Object.entries(c.views || {})) views.forEach(v => { if (v.name) ext[`${id}/manifest#view:${v.id}:name`] = v.name; });
  }
}
write("vscode-ext.json", ext);

// 3. Интерфейс Devin (devin-webapp-host, i18next): английские ресурсы из entry-чанка
const assets = path.join(APP, "out/vs/workbench/devin-webapp-host/assets");
const entry = fs.readdirSync(assets).find(f => /^chunk-entry-host-editor-mode-menu-.*\.js$/.test(f));
const src = fs.readFileSync(path.join(assets, entry), "utf8");
// ищем функцию, где собирается список языков: cu=<translation>,lu=<review>,uu=[{code:`en`...
const mm = src.match(/([\w$]+)=([\w$]+),([\w$]+)=([\w$]+),([\w$]+)=\[\{code:`en`,label:`English`\}/);
if (!mm) throw new Error("language list not found");
const [, , trVar, , rvVar] = mm;
const ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: "module" });
const assignedIn = new Map(); // var -> function name, где ей присваивается объект
for (const n of ast.body) if (n.type === "FunctionDeclaration") {
  const body = src.slice(n.start, n.end);
  for (const v of [trVar, rvVar]) if (body.includes(`${v}={`)) assignedIn.set(v, n);
}
const fns = new Set([...assignedIn.values()]);
let code = ""; for (const f of fns) code += src.slice(f.start, f.end) + "\n";
const lazy = f => { let d = false; return () => { if (!d) { d = true; f(); } }; };
const res = new Function("e", `${code}; ${[...fns].map(f => f.id.name + "();").join("")} return {translation:${trVar}, review:${rvVar}};`)(lazy);
const flat = (o, p, acc) => { for (const [k, v] of Object.entries(o)) { const q = p ? `${p}.${k}` : k; if (typeof v === "string") acc[q] = v; else if (v && typeof v === "object") flat(v, q, acc); } return acc; };
write("devin-translation.json", flat(res.translation, "", {}));
write("devin-review.json", flat(res.review, "", {}));
fs.writeFileSync("l10n/en/SOURCE.json", JSON.stringify({ product: rd(path.join(APP, "product.json")).windsurfVersion, vscode: rd(path.join(APP, "package.json")).version, entry }, null, 1) + "\n");
