# Builds a signed NSIS installer with updater artifacts.
# Auto-sets TAURI_SIGNING_PRIVATE_KEY_PATH when the default key exists.

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$keyPath = Join-Path $env:USERPROFILE ".tauri\reelattice.key"

Set-Location $root

& "$PSScriptRoot\generate-installer-assets.ps1"

if (Test-Path $keyPath) {
    $env:TAURI_SIGNING_PRIVATE_KEY_PATH = $keyPath
    Write-Host "Using signing key: $keyPath"
} else {
    Write-Host ""
    Write-Host "No signing key found at $keyPath" -ForegroundColor Yellow
    Write-Host "Run: npm run updater:keys" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

npm run tauri -- build --bundles nsis
