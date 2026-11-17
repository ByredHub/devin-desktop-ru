// Собирает расширение: node scripts/build.mjs  → extension/ (translations, data) → npx vsce package
// Источники: vendor/ms-ru-*.vsix (пак Microsoft), l10n/ru/*.json (наш перевод, ключи как в l10n/en)
import fs from "fs"; import path from "path"; import { execSync } from "child_process";
const rd = p => JSON.parse(fs.readFileSync(p, "utf8"));
const EXT = "extension";
const vsix = fs.readdirSync("vendor").find(f => /^ms-ru-.*\.vsix$/.test(f));
const ms = path.join("build", "ms-ru");
fs.rmSync("build", { recursive: true, force: true }); fs.mkdirSync(ms, { recursive: true });
execSync(`unzip -qo ${path.join("vendor", vsix)} -d ${ms}`);
const msExt = path.join(ms, "extension");
const load = f => fs.existsSync(`l10n/ru/${f}.json`) ? rd(`l10n/ru/${f}.json`) : {};

// 1. main.i18n.json = Microsoft + наше ядро
const main = rd(path.join(msExt, "translations/main.i18n.json"));
let added = 0;
for (const [k, v] of Object.entries(load("vscode-core"))) { const i = k.indexOf("#"); const m = k.slice(0, i), key = k.slice(i + 1); (main.contents[m] ||= {})[key] = v; added++; }
fs.rmSync(path.join(EXT, "translations"), { recursive: true, force: true });
fs.mkdirSync(path.join(EXT, "translations/extensions"), { recursive: true });
fs.writeFileSync(path.join(EXT, "translations/main.i18n.json"), JSON.stringify(main));

// 2. расширения: Microsoft + наши; manifest-строки windsurf* — в data/manifests.ru.json для патчера
const msPkg = rd(path.join(msExt, "package.json"));
const translations = [{ id: "vscode", path: "./translations/main.i18n.json" }];
const extTr = {}; const manifests = {};
for (const t of msPkg.contributes.localizations[0].translations) if (t.id !== "vscode") {
  extTr[t.id] = rd(path.join(msExt, t.path));
}
for (const [k, v] of Object.entries(load("vscode-ext"))) {
  const [idPart, key] = [k.slice(0, k.indexOf("#")), k.slice(k.indexOf("#") + 1)];
  const [id, part] = idPart.split("/");
  if (part === "manifest") { (manifests[id] ||= {})[key] = v; continue; }
  const t = (extTr[id] ||= { version: "1.0.0", contents: {} }); ((t.contents ||= {})[part] ||= {})[key] = v;
}
for (const [id, t] of Object.entries(extTr)) {
  const p = `./translations/extensions/${id}.i18n.json`;
  fs.writeFileSync(path.join(EXT, p), JSON.stringify(t)); translations.push({ id, path: p });
}
const pkg = rd(path.join(EXT, "package.json"));
pkg.contributes.localizations[0].translations = translations;
fs.writeFileSync(path.join(EXT, "package.json"), JSON.stringify(pkg, null, 2) + "\n");

// 3. интерфейс Devin: вложенные объекты i18next → ESM-чанки
fs.rmSync(path.join(EXT, "data"), { recursive: true, force: true }); fs.mkdirSync(path.join(EXT, "data"));
const nest = flat => { const o = {}; for (const [k, v] of Object.entries(flat)) { const ps = k.split("."); let c = o; ps.slice(0, -1).forEach(p => { c = (c[p] ??= {}); }); c[ps.at(-1)] = v; } return o; };
for (const [ns, file] of [["translation", "chunk-ru-devin-translation.js"], ["review", "chunk-ru-devin-review.js"]]) {
  const flat = { ...rd(`l10n/en/devin-${ns}.json`), ...load(`devin-${ns}`) }; // недопереведённое — по-английски
  fs.writeFileSync(path.join(EXT, "data", file), "export default " + JSON.stringify(nest(flat)) + ";\n");
}
fs.writeFileSync(path.join(EXT, "data/manifests.ru.json"), JSON.stringify(manifests));
// окно агентов/Cascade: только переведённое (английский — fallback i18next) + захардкоженные строки
for (const ns of ["translation", "review"]) fs.writeFileSync(path.join(EXT, `data/ru-${ns}.json`), JSON.stringify(nest(load(`devin-${ns}`))));
fs.writeFileSync(path.join(EXT, "data/hardcoded.ru.json"), JSON.stringify(load("devin-hardcoded")));
for (const f of ["LICENSE", "README.md"]) if (fs.existsSync(f)) fs.copyFileSync(f, path.join(EXT, f));
console.log(`core +${added}, extension packs ${Object.keys(extTr).length}, manifests ${Object.keys(manifests).length}`);
