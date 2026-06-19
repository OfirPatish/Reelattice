# Fix source transparency, regenerate Tauri icons, sync to public/ for the web UI.

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

& "$PSScriptRoot\fix-icon-transparency.ps1"
npm run tauri -- icon reelattice-icon-source.png

$publicIcons = Join-Path $root "public\icons"
New-Item -ItemType Directory -Force -Path $publicIcons | Out-Null

$srcIcons = Join-Path $root "src-tauri\icons"
Copy-Item (Join-Path $srcIcons "32x32.png") (Join-Path $publicIcons "32x32.png") -Force
Copy-Item (Join-Path $srcIcons "128x128.png") (Join-Path $publicIcons "128x128.png") -Force
Copy-Item (Join-Path $srcIcons "128x128@2x.png") (Join-Path $publicIcons "app-logo.png") -Force

Write-Host "Synced icons to public/icons"
