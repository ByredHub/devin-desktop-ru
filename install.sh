#!/usr/bin/env sh
# Установка русификатора Devin Desktop (Linux/macOS): sh install.sh [devin-desktop-ru.vsix]
set -e
VSIX="${1:-$(dirname "$0")/devin-desktop-ru.vsix}"
if [ ! -f "$VSIX" ]; then
  VSIX=/tmp/devin-desktop-ru.vsix
  curl -fsSL -o "$VSIX" https://github.com/ByredHub/devin-desktop-ru/releases/latest/download/devin-desktop-ru.vsix
fi
CLI=$(command -v devin-desktop || true)
[ -z "$CLI" ] && [ -x "/Applications/Devin.app/Contents/Resources/app/bin/devin-desktop" ] && CLI="/Applications/Devin.app/Contents/Resources/app/bin/devin-desktop"
[ -z "$CLI" ] && { echo "devin-desktop не найден"; exit 1; }
"$CLI" --install-extension "$VSIX" --force
case "$(uname)" in Darwin) DIR="$HOME/Library/Application Support/Devin/User";; *) DIR="${XDG_CONFIG_HOME:-$HOME/.config}/Devin/User";; esac
mkdir -p "$DIR"; S="$DIR/settings.json"
[ -s "$S" ] || printf '{\n}\n' > "$S"
if ! grep -q 'extensions.supportAgentsWindow' "$S"; then
  awk 'BEGIN{d=0} !d && /\{/ {sub(/\{/, "{\n  \"extensions.supportAgentsWindow\": { \"jasperblck.devin-desktop-ru\": true },"); d=1} {print}' "$S" > "$S.tmp" && mv "$S.tmp" "$S"
elif ! grep -q 'jasperblck.devin-desktop-ru' "$S"; then
  echo "Добавь вручную в $S → extensions.supportAgentsWindow: \"jasperblck.devin-desktop-ru\": true"
fi
case "$(uname)" in Linux) [ -w /usr/share/devin-desktop/resources/app ] || echo "Внимание: Devin установлен в /usr/share — дай права: sudo chown -R \$USER /usr/share/devin-desktop/resources/app";; esac
echo "Готово. Перезапусти Devin Desktop."
