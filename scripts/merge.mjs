// Собирает переведённые части l10n/parts/NN.ru.json в l10n/ru/<file>.json
import fs from "fs";
const out = {};
for (const f of fs.readdirSync("l10n/parts").filter(f => f.endsWith(".ru.json")).sort()) {
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(`l10n/parts/${f}`, "utf8")))) {
    const i = k.indexOf(":"); (out[k.slice(0, i)] ||= {})[k.slice(i + 1)] = v;
  }
}
fs.mkdirSync("l10n/ru", { recursive: true });
for (const [f, o] of Object.entries(out)) {
  const prev = fs.existsSync(`l10n/ru/${f}.json`) ? JSON.parse(fs.readFileSync(`l10n/ru/${f}.json`, "utf8")) : {};
  const merged = { ...prev, ...o }; const sorted = Object.fromEntries(Object.keys(merged).sort().map(k => [k, merged[k]]));
  fs.writeFileSync(`l10n/ru/${f}.json`, JSON.stringify(sorted, null, 1) + "\n"); console.log(f, Object.keys(sorted).length);
}
