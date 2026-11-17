# Devin Desktop — русский язык

Полная русификация [Devin Desktop](https://devin.ai) (форк VS Code / Windsurf):

| Что переводится | Откуда перевод |
|---|---|
| Меню, настройки, палитра команд, редактор (ядро VS Code) | языковой пакет Microsoft + дополнение для Devin |
| Окно агентов, сессии, настройки, ревью (интерфейс Devin) | собственный перевод, `l10n/ru` |
| Команды и настройки встроенных расширений Devin | собственный перевод |

## Установка

1. Скачай `devin-desktop-ru.vsix` и `install.ps1` из [Releases](https://github.com/ByredHub/devin-desktop-ru/releases/latest).
2. Windows (PowerShell):
   ```powershell
   powershell -ExecutionPolicy Bypass -File install.ps1
   ```
   Linux / macOS: `sh install.sh`
3. Полностью закрой и снова открой Devin Desktop. Русификатор применится и попросит перезапуск ещё раз.

Ручная установка: `devin-desktop --install-extension devin-desktop-ru.vsix`, затем в `settings.json` добавь:
```json
"extensions.supportAgentsWindow": { "jasperblck.devin-desktop-ru": true }
```
Без этой настройки окно агентов Devin не запускает сторонние расширения.

## Как это работает

- Расширение — обычный language pack (`contributes.localizations`) для ядра VS Code.
- Интерфейс Devin имеет свой i18next со списком языков. Расширение добавляет туда «Русский», кладёт рядом `chunk-ru-devin-*.js` и делает русский языком по умолчанию. Оригиналы сохраняются как `*.ru-orig`.
- После обновления Devin Desktop файлы перезаписываются. Расширение замечает новую версию и накатывает перевод заново.
- Откат: палитра команд → «Русификатор: Вернуть оригинальные файлы Devin».

Если Devin установлен в защищённую папку (`Program Files`, `/usr/share`), один раз запусти его от администратора или дай права на запись.

## Сборка

```sh
npm i
node scripts/extract.mjs <devin>/resources/app <ms-ru-pack>/extension   # исходные строки → l10n/en
node scripts/chunk.mjs 80000                                           # части для перевода → l10n/chunks
node scripts/validate.mjs l10n/chunks/NN.en.json l10n/parts/NN.ru.json  # проверка плейсхолдеров
node scripts/merge.mjs                                                  # l10n/parts → l10n/ru
npm run build                                                           # → build/devin-desktop-ru.vsix
```

Правила перевода и глоссарий: [l10n/GLOSSARY.md](l10n/GLOSSARY.md).

## Лицензия

MIT. Переводы ядра VS Code — из [Russian Language Pack](https://github.com/microsoft/vscode-loc) (MIT, Microsoft).
