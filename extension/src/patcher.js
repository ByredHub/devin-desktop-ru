// Патчер фирменного интерфейса Devin Desktop:
//  - devin-webapp-host: добавляет «Русский» в список языков (динамические чанки)
//  - окно агентов (sessions) и Cascade: встраивает русский в i18next и заменяет захардкоженные строки
//  - манифесты встроенных расширений windsurf*
//  - product.json → checksums для изменённых файлов (иначе «установка повреждена»)
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const cp = require("child_process");

const MARK = "/*devin-desktop-ru*/";
const RU_TR = "chunk-ru-devin-translation.js";
const RU_RV = "chunk-ru-devin-review.js";
const BUNDLES = ["vs/sessions/sessions.desktop.main.js", "vs/workbench/windsurf-chat-client/index.js"];
const MANIFEST_FLAG = "__devinDesktopRu";

const assetsDir = appRoot => path.join(appRoot, "out", "vs", "workbench", "devin-webapp-host", "assets");
const readJson = f => JSON.parse(fs.readFileSync(f, "utf8"));

// Оригинал файла: если текущий файл уже наш (isPatched) — берём бэкап, иначе текущий файл и есть
// оригинал (например, после обновления Devin) → обновляем бэкап.
function original(file, isPatched) {
  const b = file + ".ru-orig";
  const cur = fs.readFileSync(file, "utf8");
  if (isPatched(cur) && fs.existsSync(b)) return fs.readFileSync(b, "utf8");
  fs.writeFileSync(b, cur);
  return cur;
}

function restoreFile(file) {
  const b = file + ".ru-orig";
  if (fs.existsSync(b)) { fs.copyFileSync(b, file); fs.unlinkSync(b); return true; }
  return false;
}

// ---------- devin-webapp-host ----------
function patchLanguageList(src) {
  const re = /\{code:`en`,label:`English`\}/;
  if (!re.test(src)) return null;
  const ru = `${MARK}{code:\`ru\`,label:\`Русский\`,translation:()=>import(\`./${RU_TR}\`).then(e=>e.default),review:()=>import(\`./${RU_RV}\`).then(e=>e.default)}`;
  return src.replace(re, m => `${m},${ru}`);
}

function patchDefaultLanguage(src) {
  return src.replace(/(localStorage\.getItem\(([\w$]+)\)\|\|)`en`/, (m, a) => `${a}\`ru\``);
}

function findEntryChunk(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith(".js") && !f.startsWith("chunk-ru-"))
    .find(f => { const s = fs.readFileSync(path.join(dir, f), "utf8"); return /\{code:`en`,label:`English`\},(\{code:`ja`|\/\*devin-desktop-ru\*\/)/.test(s); });
}

function applyWebapp(appRoot, dataDir) {
  const dir = assetsDir(appRoot);
  if (!fs.existsSync(dir)) return null;
  const entry = findEntryChunk(dir);
  if (!entry) throw new Error("не найден список языков в devin-webapp-host — нужна новая версия русификатора");
  const file = path.join(dir, entry);
  const src = patchLanguageList(original(file, s => s.includes(MARK)));
  if (src === null) throw new Error("не удалось вставить русский язык в " + entry);
  for (const f of [RU_TR, RU_RV]) fs.copyFileSync(path.join(dataDir, f), path.join(dir, f));
  fs.writeFileSync(file, patchDefaultLanguage(src));
  return entry;
}

function restoreWebapp(appRoot) {
  const dir = assetsDir(appRoot);
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) if (f.endsWith(".ru-orig")) restoreFile(path.join(dir, f.slice(0, -8)));
  for (const f of [RU_TR, RU_RV]) { const p = path.join(dir, f); if (fs.existsSync(p)) fs.unlinkSync(p); }
}

// ---------- окно агентов и Cascade (большие бандлы с i18next внутри) ----------
// let p={en:{translation:...,review:X}};return Z.use(W).init({resources:p,lng:"en"
const I18N_RE = /(let ([\w$]+)=\{en:\{translation:[^;]{0,160}?,review:[\w$]+\}\};)(return [\w$]+\.use\([\w$]+\)\.init\(\{resources:\2,lng:)"en"/;

function patchI18nInit(src, ruT, ruR) {
  if (!I18N_RE.test(src)) return null;
  const data = `${MARK}$2.ru={translation:JSON.parse(${JSON.stringify(JSON.stringify(ruT))}),review:JSON.parse(${JSON.stringify(JSON.stringify(ruR))})};`;
  return src.replace(I18N_RE, (m, decl, v, ret) => decl + data.replace("$2", v) + ret + '"ru"');
}

// hardcoded: { 'children:"Cancel"': "Отмена", 'children:["Sign up"': "Зарегистрироваться" }
function patchHardcoded(src, hard) {
  const map = new Map();
  for (const [key, ru] of Object.entries(hard)) {
    if (key.startsWith("?")) {
      const [a, b] = ru.split("|");
      if (b !== undefined) map.set(key, `?${JSON.stringify(a)}:${JSON.stringify(b)}`);
      continue;
    }
    const q = key.lastIndexOf('"', key.length - 2);
    map.set(key, key.slice(0, q) + JSON.stringify(ru));
  }
  if (!map.size) return { src, n: 0 };
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const alt = keys => keys.sort((a, b) => b.length - a.length).map(esc).join("|");
  const props = [...map.keys()].filter(k => !k.startsWith("?")), terns = [...map.keys()].filter(k => k.startsWith("?"));
  const parts = [];
  if (props.length) parts.push(`(?<=[,{])(?:${alt(props)})`);
  if (terns.length) parts.push(`(?<=")(?:${alt(terns)})`);
  const re = new RegExp(parts.join("|"), "g");
  let n = 0;
  return { src: src.replace(re, m => { n++; return map.get(m); }), n };
}

function parses(code) {
  const tmp = path.join(os.tmpdir(), `devin-desktop-ru-${process.pid}-${Date.now()}.mjs`);
  fs.writeFileSync(tmp, code);
  try {
    const r = cp.spawnSync(process.execPath, ["--check", tmp], { env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" }, stdio: "ignore", timeout: 180000 });
    return r.status === 0;
  } finally { fs.rmSync(tmp, { force: true }); }
}

function applyBundles(appRoot, dataDir) {
  const ruT = readJson(path.join(dataDir, "ru-translation.json"));
  const ruR = readJson(path.join(dataDir, "ru-review.json"));
  const hard = readJson(path.join(dataDir, "hardcoded.ru.json"));
  const changed = [];
  for (const rel of BUNDLES) {
    const file = path.join(appRoot, "out", rel);
    if (!fs.existsSync(file)) continue;
    let src = original(file, s => s.startsWith(MARK));
    const withI18n = patchI18nInit(src, ruT, ruR);
    if (withI18n === null) console.warn(`[devin-desktop-ru] i18next не найден в ${rel}`);
    else src = withI18n;
    src = patchHardcoded(src, hard).src;
    if (!parses(src)) { console.warn(`[devin-desktop-ru] патч ломает ${rel}, пропускаю`); fs.writeFileSync(file, original(file, x => x.startsWith(MARK))); changed.push(rel); continue; }
    fs.writeFileSync(file, MARK + "\n" + src);
    changed.push(rel);
  }
  fixChecksums(appRoot, changed);
  return changed;
}

function restoreBundles(appRoot) {
  for (const rel of BUNDLES) restoreFile(path.join(appRoot, "out", rel));
  restoreFile(path.join(appRoot, "product.json"));
}

// product.json → checksums: sha256 base64 без "=" (как в VS Code)
function fixChecksums(appRoot, rels) {
  const file = path.join(appRoot, "product.json");
  original(file, s => s.includes('"' + MANIFEST_FLAG + '"'));
  const p = readJson(file);
  if (!p.checksums) return;
  for (const rel of rels) if (rel in p.checksums) {
    p.checksums[rel] = crypto.createHash("sha256").update(fs.readFileSync(path.join(appRoot, "out", rel))).digest("base64").replace(/=+$/, "");
  }
  p[MANIFEST_FLAG] = true;
  fs.writeFileSync(file, JSON.stringify(p, null, "\t"));
}

// ---------- манифесты встроенных расширений ----------
function applyManifests(appRoot, manifests) {
  let n = 0;
  for (const [id, tr] of Object.entries(manifests)) {
    const file = path.join(appRoot, "extensions", id.split(".").slice(1).join("."), "package.json");
    if (!fs.existsSync(file)) continue;
    const p = JSON.parse(original(file, s => s.includes('"' + MANIFEST_FLAG + '"')));
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
    p[MANIFEST_FLAG] = true;
    fs.writeFileSync(file, JSON.stringify(p, null, "\t"));
    n++;
  }
  return n;
}

function restoreManifests(appRoot, manifests) {
  for (const id of Object.keys(manifests)) restoreFile(path.join(appRoot, "extensions", id.split(".").slice(1).join("."), "package.json"));
}

function isApplied(appRoot) {
  const f = path.join(appRoot, "out", BUNDLES[0]);
  try { const fd = fs.openSync(f, "r"); const b = Buffer.alloc(MARK.length); fs.readSync(fd, b, 0, b.length, 0); fs.closeSync(fd); return b.toString() === MARK; } catch { return false; }
}

module.exports = { applyWebapp, restoreWebapp, applyBundles, restoreBundles, applyManifests, restoreManifests, isApplied,
  patchLanguageList, patchDefaultLanguage, patchI18nInit, patchHardcoded, MARK };
