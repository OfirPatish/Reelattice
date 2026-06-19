# Generates branded NSIS installer bitmaps for Reelattice.
# Output: src-tauri/installer/sidebar.bmp (164x314), header.bmp (150x57)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$outDir = Join-Path $root "src-tauri\installer"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Save-Bmp {
    param(
        [System.Drawing.Bitmap]$Bitmap,
        [string]$Path
    )

    $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Bmp)
    $Bitmap.Dispose()
}

function New-SidebarBitmap {
    $width = 164
    $height = 314
    $bitmap = New-Object System.Drawing.Bitmap $width, $height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    $bg = [System.Drawing.Color]::FromArgb(255, 9, 9, 11)
    $accent = [System.Drawing.Color]::FromArgb(255, 56, 189, 248)
    $accentSoft = [System.Drawing.Color]::FromArgb(70, 56, 189, 248)
    $text = [System.Drawing.Color]::FromArgb(255, 244, 244, 245)
    $muted = [System.Drawing.Color]::FromArgb(255, 161, 161, 170)

    $graphics.Clear($bg)

    $accentBrush = New-Object System.Drawing.SolidBrush $accent
    $accentSoftBrush = New-Object System.Drawing.SolidBrush $accentSoft
    $textBrush = New-Object System.Drawing.SolidBrush $text
    $mutedBrush = New-Object System.Drawing.SolidBrush $muted

    $graphics.FillRectangle($accentBrush, 0, 0, 4, $height)

    $gridPen = New-Object System.Drawing.Pen $accentSoft, 1
    for ($x = 24; $x -le 140; $x += 28) {
        $graphics.DrawLine($gridPen, $x, 188, $x, 286)
    }
    for ($y = 188; $y -le 286; $y += 28) {
        $graphics.DrawLine($gridPen, 24, $y, 140, $y)
    }

    $highlightBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(120, 56, 189, 248))
    $graphics.FillRectangle($highlightBrush, 52, 216, 28, 28)

    $titleFont = [System.Drawing.Font]::new("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
    $bodyFont = [System.Drawing.Font]::new("Segoe UI", 8.5)
    $graphics.DrawString("Reelattice", $titleFont, $textBrush, 18, 42)
    $graphics.DrawString("Tesla Dashcam", $bodyFont, $mutedBrush, 18, 72)
    $graphics.DrawString("organizer", $bodyFont, $mutedBrush, 18, 88)
    $graphics.DrawString("Local-first review", $bodyFont, $mutedBrush, 18, 118)
    $graphics.DrawString("for Sentry & clips", $bodyFont, $mutedBrush, 18, 134)

    $graphics.Dispose()
    $accentBrush.Dispose()
    $accentSoftBrush.Dispose()
    $textBrush.Dispose()
    $mutedBrush.Dispose()
    $gridPen.Dispose()
    $titleFont.Dispose()
    $bodyFont.Dispose()
    $highlightBrush.Dispose()

    return $bitmap
}

function New-HeaderBitmap {
    $width = 150
    $height = 57
    $bitmap = New-Object System.Drawing.Bitmap $width, $height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $bg = [System.Drawing.Color]::FromArgb(255, 9, 9, 11)
    $accent = [System.Drawing.Color]::FromArgb(255, 56, 189, 248)
    $text = [System.Drawing.Color]::FromArgb(255, 244, 244, 245)
    $muted = [System.Drawing.Color]::FromArgb(255, 161, 161, 170)

    $graphics.Clear($bg)

    $accentBrush = New-Object System.Drawing.SolidBrush $accent
    $graphics.FillRectangle($accentBrush, 0, 0, $width, 3)

    $titleFont = [System.Drawing.Font]::new("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $bodyFont = [System.Drawing.Font]::new("Segoe UI", 8)
    $textBrush = New-Object System.Drawing.SolidBrush $text
    $mutedBrush = New-Object System.Drawing.SolidBrush $muted

    $graphics.DrawString("Reelattice Setup", $titleFont, $textBrush, 12, 14)
    $graphics.DrawString("Organize Tesla footage locally", $bodyFont, $mutedBrush, 12, 34)

    $graphics.Dispose()
    $accentBrush.Dispose()
    $titleFont.Dispose()
    $bodyFont.Dispose()
    $textBrush.Dispose()
    $mutedBrush.Dispose()

    return $bitmap
}

$sidebarPath = Join-Path $outDir "sidebar.bmp"
$headerPath = Join-Path $outDir "header.bmp"

Save-Bmp -Bitmap (New-SidebarBitmap) -Path $sidebarPath
Save-Bmp -Bitmap (New-HeaderBitmap) -Path $headerPath

Write-Host "Generated installer assets:"
Write-Host "  $sidebarPath"
Write-Host "  $headerPath"
