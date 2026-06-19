# Builds a signed NSIS installer with updater artifacts.
# Loads the default minisign private key for Tauri signing.

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

$env:TAURI_SIGNING_PRIVATE_KEY = (Get-Content -Path $keyPath -Raw).Trim()
$env:TAURI_SIGNING_PRIVATE_KEY_PATH = $keyPath
Write-Host "Using signing key: $keyPath"

# Call the CLI directly so npm does not drop signing env vars.
npx tauri build --bundles nsis
