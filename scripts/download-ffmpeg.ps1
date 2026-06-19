# Downloads a Windows ffmpeg binary for Tauri sidecar bundling.
# Output: src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $projectRoot "src-tauri\binaries"
$dest = Join-Path $binDir "ffmpeg-x86_64-pc-windows-msvc.exe"

if (Test-Path $dest) {
    Write-Host "FFmpeg sidecar already present: $dest"
    exit 0
}

New-Item -ItemType Directory -Force -Path $binDir | Out-Null

$zipUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$zipPath = Join-Path $env:TEMP "Reelattice-ffmpeg-essentials.zip"
$extractDir = Join-Path $env:TEMP "Reelattice-ffmpeg-extract"

Write-Host "Downloading FFmpeg essentials..."
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing

if (Test-Path $extractDir) {
    Remove-Item -Recurse -Force $extractDir
}
New-Item -ItemType Directory -Force -Path $extractDir | Out-Null

Write-Host "Extracting..."
Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force

$ffmpegExe = Get-ChildItem -Path $extractDir -Filter "ffmpeg.exe" -Recurse | Select-Object -First 1
if (-not $ffmpegExe) {
    throw "ffmpeg.exe not found in downloaded archive."
}

Copy-Item $ffmpegExe.FullName $dest -Force
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
Remove-Item $extractDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Installed FFmpeg sidecar to $dest"
