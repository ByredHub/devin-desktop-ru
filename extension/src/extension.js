"use strict";
const vscode = require("vscode");
const fs = require("fs");
const os = require("os");
const path = require("path");
const patcher = require("./patcher");

const STATE_KEY = "devinDesktopRu.appliedFor";

function dataDir(ctx) { return path.join(ctx.extensionPath, "data"); }
function manifests(ctx) { return JSON.parse(fs.readFileSync(path.join(dataDir(ctx), "manifests.ru.json"), "utf8")); }
function fingerprint(ctx) {
  const product = JSON.parse(fs.readFileSync(path.join(vscode.env.appRoot, "product.json"), "utf8"));
  return `${product.windsurfVersion || ""}|${product.commit || ""}|${vscode.env.appRoot}|${ctx.extension.packageJSON.version}`;
}

// ~/.devin/argv.json → "locale": "ru"
function setLocaleRu() {
  const product = JSON.parse(fs.readFileSync(path.join(vscode.env.appRoot, "product.json"), "utf8"));
  const dir = path.join(process.env.VSCODE_PORTABLE || os.homedir(), product.dataFolderName || ".devin");
  const file = path.join(dir, "argv.json");
  let text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "{\n}\n";
  if (/"locale"\s*:\s*"ru"/.test(text)) return false;
  if (/"locale"\s*:\s*"[^"]*"/.test(text)) text = text.replace(/"locale"\s*:\s*"[^"]*"/, '"locale": "ru"');
  else text = text.replace(/\{/, '{\n\t"locale": "ru",');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, text);
  return true;
}

function apply(ctx) {
  const root = vscode.env.appRoot;
  patcher.applyWebapp(root, dataDir(ctx));
  patcher.applyBundles(root, dataDir(ctx));
  patcher.applyManifests(root, manifests(ctx));
  return ctx.globalState.update(STATE_KEY, fingerprint(ctx));
}

async function offerRestart(message) {
  const choice = await vscode.window.showInformationMessage(message, "Перезапустить");
  if (choice) vscode.commands.executeCommand("workbench.action.reloadWindow");
}

async function activate(ctx) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand("devinDesktopRu.apply", async () => {
      try { await apply(ctx); setLocaleRu(); await offerRestart("Русификация применена. Перезапустите Devin Desktop."); }
      catch (e) { vscode.window.showErrorMessage("Русификатор: " + e.message); }
    }),
    vscode.commands.registerCommand("devinDesktopRu.restore", async () => {
      patcher.restoreWebapp(vscode.env.appRoot);
      patcher.restoreBundles(vscode.env.appRoot);
      patcher.restoreManifests(vscode.env.appRoot, manifests(ctx));
      await ctx.globalState.update(STATE_KEY, undefined);
      vscode.window.showInformationMessage("Оригинальные файлы Devin восстановлены. Язык интерфейса VS Code меняется командой «Configure Display Language».");
    })
  );
  if (ctx.globalState.get(STATE_KEY) === fingerprint(ctx) && patcher.isApplied(vscode.env.appRoot)) return;
  try {
    await apply(ctx);
    const localeChanged = setLocaleRu();
    await offerRestart(localeChanged || vscode.env.language !== "ru"
      ? "Русификатор установлен. Перезапустите Devin Desktop, чтобы включить русский язык."
      : "Devin Desktop обновился — русификация применена заново. Перезапустите окно.");
  } catch (e) {
    const hint = e.code === "EACCES" || e.code === "EPERM" ? " Нет прав на запись в папку установки Devin — запустите Devin Desktop от администратора один раз." : "";
    vscode.window.showErrorMessage("Русификатор: " + e.message + hint);
  }
}

function deactivate() {}
module.exports = { activate, deactivate };
