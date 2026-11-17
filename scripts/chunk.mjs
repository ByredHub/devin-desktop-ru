// Режет l10n/en/*.json на части ~MAX символов для параллельного перевода: l10n/chunks/NN.en.json
import fs from "fs";
const MAX = +(process.argv[2] || 50000);
const files = ["vscode-core", "vscode-ext", "devin-review", "devin-translation"];
const chunks = []; let cur = {}, size = 0, curGroup = null;
const flush = () => { if (Object.keys(cur).length) chunks.push(cur); cur = {}; size = 0; };
for (const f of files) {
  const src = JSON.parse(fs.readFileSync(`l10n/en/${f}.json`, "utf8"));
  const keys = Object.keys(src).sort();
  for (const k of keys) {
    const group = f + ":" + (f.startsWith("vscode-core") ? k.split("#")[0].split("/").slice(0, 4).join("/") : k.split(/[.#]/)[0]);
    const s = src[k];
    // режем по границе группы, если часть уже достаточно большая
    if (size > MAX || (size > MAX * 0.6 && group !== curGroup)) flush();
    cur[`${f}:${k}`] = s; size += s.length + k.length / 2; curGroup = group;
  }
  flush();
}
fs.rmSync("l10n/chunks", { recursive: true, force: true }); fs.mkdirSync("l10n/chunks");
chunks.forEach((c, i) => fs.writeFileSync(`l10n/chunks/${String(i + 1).padStart(2, "0")}.en.json`, JSON.stringify(c, null, 1) + "\n"));
console.log(chunks.length, "chunks:", chunks.map(c => Object.keys(c).length + "/" + Object.values(c).reduce((a, s) => a + s.length, 0)).join(" "));
