// Проверяет перевод: node scripts/validate.mjs <en.json> <ru.json> [--fix-report out.json]
// en/ru: плоские объекты {key: string}. Ключи ru может дополнительно содержать формы _few/_many.
import fs from "fs";
const [enF, ruF] = process.argv.slice(2);
const en = JSON.parse(fs.readFileSync(enF, "utf8")), ru = JSON.parse(fs.readFileSync(ruF, "utf8"));
const pats = [/\{\{[^}]*\}\}/g, /\{[A-Za-z0-9_]+\}/g, /<\/?[A-Za-z0-9_]+\s*\/?>/g, /\$\([^)]*\)/g, /\$t\([^)]*\)/g, /%[sd]/g, /https?:\/\/[^\s)"'`<>]+/g];
const toks = s => { const r = []; for (const p of pats) r.push(...(s.match(p) || [])); return r.sort(); };
const errors = [], warns = [];
const plural = /_(one|other|few|many|zero|two)$/;
for (const [k, s] of Object.entries(en)) {
  const t = ru[k];
  if (typeof t !== "string" || !t.length && s.length) { errors.push([k, "missing"]); continue; }
  const a = toks(s).join("\u0001"), b = toks(t).join("\u0001");
  if (a !== b) errors.push([k, `placeholders/tags differ: en=${JSON.stringify(toks(s))} ru=${JSON.stringify(toks(t))}`]);
  const amp = x => (x.match(/&&/g) || []).length; if (amp(s) !== amp(t)) errors.push([k, "&& mnemonic count differs"]);
  const bt = x => (x.match(/`/g) || []).length; if (bt(s) !== bt(t)) warns.push([k, "backtick count differs"]);
  if (/^\s/.test(s) !== /^\s/.test(t) || /\s$/.test(s) !== /\s$/.test(t)) warns.push([k, "leading/trailing whitespace differs"]);
  if ((s.match(/\n/g) || []).length !== (t.match(/\n/g) || []).length) warns.push([k, "newline count differs"]);
  if (t === s && /[A-Za-z]{4,}\s+[A-Za-z]{3,}/.test(s.replace(/\{\{[^}]*\}\}|<[^>]+>|`[^`]*`|https?:\S+/g, ""))) warns.push([k, "looks untranslated"]);
  if (/_one$/.test(k)) { const base = k.slice(0, -4); for (const f of ["_few", "_many"]) if (typeof ru[base + f] !== "string") errors.push([base + f, "missing russian plural form"]); else if (toks(ru[base + f]).join() !== toks(s).join() && toks(ru[base + f]).join() !== toks(en[base + "_other"] || s).join()) errors.push([base + f, "plural form placeholders differ"]); }
}
for (const k of Object.keys(ru)) if (!(k in en) && !(/_(few|many)$/.test(k) && (k.replace(/_(few|many)$/, "_one") in en))) warns.push([k, "extra key"]);
console.log(JSON.stringify({ total: Object.keys(en).length, errors: errors.length, warnings: warns.length }));
for (const [k, m] of errors.slice(0, 200)) console.log("ERROR", k, "—", m);
for (const [k, m] of warns.slice(0, 100)) console.log("WARN ", k, "—", m);
process.exit(errors.length ? 1 : 0);
