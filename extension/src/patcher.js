// Патчер фирменного интерфейса Devin Desktop (devin-webapp-host + манифесты расширений windsurf*).
// Не трогает файлы из product.json → checksums, поэтому предупреждения «установка повреждена» нет.
"use strict";
const fs = require("fs");
const path = require("path");

const MARK = "/*devin-desktop-ru*/";
const RU_TR = "chunk-ru-devin-translation.js";
const RU_RV = "chunk-ru-devin-review.js";

function assetsDir(appRoot) { return path.join(appRoot, "out", "vs", "workbench", "devin-webapp-host", "assets"); }

function backup(file) {
  const b = file + ".ru-orig";
  if (!fs.existsSync(b)) fs.copyFileSync(file, b);
  return b;
}

function restoreFile(file) {
  const b = file + ".ru-orig";
  if (fs.existsSync(b)) { fs.copyFileSync(b, file); fs.unlinkSync(b); return true; }
  return false;
}

// Список языков: ...uu=[{code:`en`,label:`English`},{code:`ja`...  → добавляем русский вторым пунктом
function patchLanguageList(src) {
  if (src.includes(MARK)) return src;
  const re = /\{code:`en`,label:`English`\}/;
  if (!re.test(src)) return null;
  const ru = `{code:\`en\`,label:\`English\`},${MARK}{code:\`ru\`,label:\`Русский\`,translation:()=>import(\`./${RU_TR}\`).then(e=>e.default),review:()=>import(\`./${RU_RV}\`).then(e=>e.default)}`;
  return src.replace(re, ru);
}

// Язык по умолчанию: localStorage.getItem(`devin-language`)||`en` → `ru`
function patchDefaultLanguage(src) {
  const re = /(localStorage\.getItem\(([\w$]+)\)\|\|)`en`/;
  if (!re.test(src)) return src;
  return src.replace(re, `$1${MARK}\`ru\``);
}

function findEntryChunk(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith(".js") && !f.startsWith("chunk-ru-"))
    .find(f => { const s = fs.readFileSync(path.join(dir, f), "utf8"); return /\{code:`en`,label:`English`\},\{code:`ja`/.test(s) || s.includes(MARK); });
}

function applyWebapp(appRoot, dataDir) {
  const dir = assetsDir(appRoot);
  if (!fs.existsSync(dir)) throw new Error("devin-webapp-host не найден: " + dir);
  const entry = findEntryChunk(dir);
  if (!entry) throw new Error("не найден список языков в devin-webapp-host — формат изменился, нужна новая версия русификатора");
  const file = path.join(dir, entry);
  let src = fs.readFileSync(file, "utf8");
  const orig = src;
  src = patchLanguageList(src);
  if (src === null) throw new Error("не удалось вставить русский язык в " + entry);
  src = patchDefaultLanguage(src);
  for (const f of [RU_TR, RU_RV]) fs.copyFileSync(path.join(dataDir, f), path.join(dir, f));
  if (src !== orig) { backup(file); fs.writeFileSync(file, src); }
  return entry;
}

function restoreWebapp(appRoot) {
  const dir = assetsDir(appRoot);
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) if (f.endsWith(".ru-orig")) restoreFile(path.join(dir, f.slice(0, -8)));
  for (const f of [RU_TR, RU_RV]) { const p = path.join(dir, f); if (fs.existsSync(p)) fs.unlinkSync(p); }
}

// Манифесты фирменных расширений: строки команд/настроек без NLS → подставляем перевод
function applyManifests(appRoot, manifests) {
  let n = 0;
  for (const [id, tr] of Object.entries(manifests)) {
    const name = id.split(".").slice(1).join(".");
    const file = path.join(appRoot, "extensions", name, "package.json");
    if (!fs.existsSync(file)) continue;
    const b = backup(file);
    const p = JSON.parse(fs.readFileSync(b, "utf8"));
    const c = p.contributes || {};
    const get = k => tr[k];
    if (get("displayName")) p.displayName = get("displayName");
    if (get("description")) p.description = get("description");
    for (const x of c.commands || []) {
      if (get(`command:${x.command}:title`)) x.title = get(`command:${x.command}:title`);
      if (get(`command:${x.command}:category`)) x.category = get(`command:${x.command}:category`);
    }
    const cfg = Array.isArray(c.configuration) ? c.configuration : c.configuration ? [c.configuration] : [];
    cfg.forEach((g, gi) => {
      if (get(`config:${gi}:title`)) g.title = get(`config:${gi}:title`);
      for (const [k, v] of Object.entries(g.properties || {})) {
        for (const f of ["description", "markdownDescription", "deprecationMessage", "markdownDeprecationMessage"]) if (get(`setting:${k}:${f}`)) v[f] = get(`setting:${k}:${f}`);
        for (const f of ["enumDescriptions", "markdownEnumDescriptions"]) if (Array.isArray(v[f])) v[f] = v[f].map((s, j) => get(`setting:${k}:enum:${j}`) || s);
      }
    });
    for (const views of Object.values(c.views || {})) for (const v of views) if (get(`view:${v.id}:name`)) v.name = get(`view:${v.id}:name`);
    fs.writeFileSync(file, JSON.stringify(p, null, "\t"));
    n++;
  }
  return n;
}

function restoreManifests(appRoot, manifests) {
  for (const id of Object.keys(manifests)) restoreFile(path.join(appRoot, "extensions", id.split(".").slice(1).join("."), "package.json"));
}

module.exports = { applyWebapp, restoreWebapp, applyManifests, restoreManifests, patchLanguageList, patchDefaultLanguage, MARK };
