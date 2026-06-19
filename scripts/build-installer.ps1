# Builds a signed NSIS installer with updater artifacts.
# Uses a passwordless minisign key at %USERPROFILE%\.tauri\reelattice.key

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$keyPath = Join-Path $env:USERPROFILE ".tauri\reelattice.key"

Set-Location $root

& "$PSScriptRoot\generate-installer-assets.ps1"

if (-not (Test-Path $keyPath)) {
    Write-Host ""
    Write-Host "No signing key found at $keyPath" -ForegroundColor Yellow
    Write-Host "Run: npm run updater:keys" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

$env:CI = "true"
$env:TAURI_SIGNING_PRIVATE_KEY = $keyPath
Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY_PATH -ErrorAction SilentlyContinue

Write-Host "Using signing key: $keyPath"

npx tauri build --bundles nsis --ci
