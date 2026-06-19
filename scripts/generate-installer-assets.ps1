# Generates branded NSIS installer bitmaps for Reelattice.
# Output: src-tauri/installer/sidebar.bmp (164x314), header.bmp (150x57)
# NSIS requires 24-bit BMPs; header appears on inner wizard pages (page 2+).

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$outDir = Join-Path $root "src-tauri\installer"
$iconPath = Join-Path $root "src-tauri\icons\128x128.png"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Save-Bmp {
    param(
        [System.Drawing.Bitmap]$Bitmap,
        [string]$Path
    )

    $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Bmp)
    $Bitmap.Dispose()
}

function New-BitmapCanvas {
    param(
        [int]$Width,
        [int]$Height
    )

    return New-Object System.Drawing.Bitmap $Width, $Height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
}

function Draw-BrandBackground {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$Width,
        [int]$Height
    )

    $bg = [System.Drawing.Color]::FromArgb(255, 9, 9, 11)
    $accent = [System.Drawing.Color]::FromArgb(255, 56, 189, 248)

    $graphics = $Graphics
    $graphics.Clear($bg)

    $accentBrush = New-Object System.Drawing.SolidBrush $accent
    $graphics.FillRectangle($accentBrush, 0, 0, $Width, 3)
    $accentBrush.Dispose()
}

function Draw-AppIcon {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$X,
        [int]$Y,
        [int]$Size
    )

    if (-not (Test-Path $iconPath)) {
        return
    }

    $icon = [System.Drawing.Bitmap]::FromFile($iconPath)
    $graphics = $Graphics
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($icon, $X, $Y, $Size, $Size)
    $icon.Dispose()
}

function New-SidebarBitmap {
    $width = 164
    $height = 314
    $bitmap = New-BitmapCanvas -Width $width -Height $height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    Draw-BrandBackground -Graphics $graphics -Width $width -Height $height

    $accent = [System.Drawing.Color]::FromArgb(255, 56, 189, 248)
    $accentSoft = [System.Drawing.Color]::FromArgb(70, 56, 189, 248)
    $text = [System.Drawing.Color]::FromArgb(255, 244, 244, 245)
    $muted = [System.Drawing.Color]::FromArgb(255, 161, 161, 170)

    $accentBrush = New-Object System.Drawing.SolidBrush $accent
    $graphics.FillRectangle($accentBrush, 0, 0, 4, $height)
    $accentBrush.Dispose()

    Draw-AppIcon -Graphics $graphics -X 58 -Y 28 -Size 48

    $titleFont = [System.Drawing.Font]::new("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
    $bodyFont = [System.Drawing.Font]::new("Segoe UI", 8.5)
    $textBrush = New-Object System.Drawing.SolidBrush $text
    $mutedBrush = New-Object System.Drawing.SolidBrush $muted

    $graphics.DrawString("Reelattice", $titleFont, $textBrush, 18, 88)
    $graphics.DrawString("Tesla Dashcam", $bodyFont, $mutedBrush, 18, 114)
    $graphics.DrawString("organizer", $bodyFont, $mutedBrush, 18, 130)
    $graphics.DrawString("Local-first review", $bodyFont, $mutedBrush, 18, 160)
    $graphics.DrawString("for Sentry & clips", $bodyFont, $mutedBrush, 18, 176)

    $graphics.Dispose()
    $titleFont.Dispose()
    $bodyFont.Dispose()
    $textBrush.Dispose()
    $mutedBrush.Dispose()

    return $bitmap
}

function New-HeaderBitmap {
    # Fixed NSIS header size — keep artwork inside safe zone (no text; NSIS stretches oddly).
    $width = 150
    $height = 57
    $bitmap = New-BitmapCanvas -Width $width -Height $height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    Draw-BrandBackground -Graphics $graphics -Width $width -Height $height
    Draw-AppIcon -Graphics $graphics -X 14 -Y 11 -Size 34

    $graphics.Dispose()

    return $bitmap
}

$sidebarPath = Join-Path $outDir "sidebar.bmp"
$headerPath = Join-Path $outDir "header.bmp"

Save-Bmp -Bitmap (New-SidebarBitmap) -Path $sidebarPath
Save-Bmp -Bitmap (New-HeaderBitmap) -Path $headerPath

Write-Host "Generated installer assets:"
Write-Host "  $sidebarPath"
Write-Host "  $headerPath"
