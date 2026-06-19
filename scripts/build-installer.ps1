# Builds a signed NSIS installer with updater artifacts.
# Points Tauri at the default minisign private key (passwordless).

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

# Use the key file path — not raw contents (contents trigger a decrypt/password prompt).
$env:TAURI_SIGNING_PRIVATE_KEY = $keyPath
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""
Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY_PATH -ErrorAction SilentlyContinue

Write-Host "Using signing key: $keyPath"

# Call the CLI directly so npm does not drop signing env vars.
npx tauri build --bundles nsis
