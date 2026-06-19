# Generates a Tauri updater signing key pair (run once per machine / CI secret).
# Private key: %USERPROFILE%\.tauri\reelattice.key  (NEVER commit)
# Public key:   %USERPROFILE%\.tauri\reelattice.key.pub -> copied to src-tauri/updater.pub

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$keyPath = Join-Path $env:USERPROFILE ".tauri\reelattice.key"
$pubPath = "$keyPath.pub"
$projectPubPath = Join-Path $root "src-tauri\updater.pub"

New-Item -ItemType Directory -Force -Path (Split-Path $keyPath -Parent) | Out-Null

$env:CI = "true"
Set-Location $root
npm run tauri -- signer generate -w $keyPath -f

Copy-Item -Force $pubPath $projectPubPath

Write-Host ""
Write-Host "Updater keys ready."
Write-Host "  Private: $keyPath"
Write-Host "  Public:  $projectPubPath"
Write-Host ""
Write-Host "For local signed release builds:"
Write-Host '  $env:TAURI_SIGNING_PRIVATE_KEY_PATH = "' + $keyPath + '"'
Write-Host ""
Write-Host "For GitHub Actions, add repository secrets:"
Write-Host "  TAURI_SIGNING_PRIVATE_KEY = contents of the private key file"
Write-Host "  TAURI_SIGNING_PRIVATE_KEY_PASSWORD = (empty if no password)"
