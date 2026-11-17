# Установка русификатора Devin Desktop (Windows, PowerShell 5+)
# Запуск: powershell -ExecutionPolicy Bypass -File install.ps1 [путь\к\devin-desktop-ru.vsix]
param([string]$Vsix = "$PSScriptRoot\devin-desktop-ru.vsix")
$ErrorActionPreference = "Stop"
if (-not (Test-Path $Vsix)) {
  $Vsix = "$env:TEMP\devin-desktop-ru.vsix"
  Invoke-WebRequest "https://github.com/ByredHub/devin-desktop-ru/releases/latest/download/devin-desktop-ru.vsix" -OutFile $Vsix
}
$cli = (Get-Command devin-desktop -ErrorAction SilentlyContinue).Source
if (-not $cli) {
  $cli = @("$env:LOCALAPPDATA\Programs\Devin\bin\devin-desktop.cmd", "$env:ProgramFiles\Devin\bin\devin-desktop.cmd") | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $cli) { throw "Не нашёл devin-desktop. Поставь .vsix вручную: Расширения -> ... -> Установить из VSIX" }
& $cli --install-extension $Vsix --force

# Окно агентов Devin запускает только разрешённые расширения — разрешаем русификатор
$settings = "$env:APPDATA\Devin\User\settings.json"
New-Item -ItemType Directory -Force (Split-Path $settings) | Out-Null
$line = '"extensions.supportAgentsWindow": { "jasperblck.devin-desktop-ru": true },'
$text = if (Test-Path $settings) { Get-Content $settings -Raw -Encoding UTF8 } else { "" }
if (-not $text -or -not $text.Trim()) { $text = "{`n}" }
if ($text -match 'extensions\.supportAgentsWindow') {
  if ($text -notmatch 'jasperblck\.devin-desktop-ru') { Write-Warning "Добавь вручную в $settings в extensions.supportAgentsWindow: `"jasperblck.devin-desktop-ru`": true" }
} else {
  $i = $text.IndexOf("{")
  $text = $text.Substring(0, $i + 1) + "`n  " + $line + $text.Substring($i + 1)
  [IO.File]::WriteAllText($settings, $text, (New-Object Text.UTF8Encoding $false))
}
Write-Host "Готово. Перезапусти Devin Desktop (полностью закрой и открой)."
