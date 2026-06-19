# Removes baked-in checkerboard / white background from the icon source PNG.
# Makes corner pixels truly transparent so tauri icon + in-app logo render cleanly.

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$sourcePath = Join-Path $root "reelattice-icon-source.png"

if (-not (Test-Path $sourcePath)) {
    throw "Icon source not found: $sourcePath"
}

function Test-BackgroundPixel {
    param(
        [byte]$R,
        [byte]$G,
        [byte]$B,
        [byte]$A
    )

    if ($A -eq 0) {
        return $true
    }

    $avg = ($R + $G + $B) / 3
    $maxDiff = [Math]::Max(
        [Math]::Abs($R - $G),
        [Math]::Max([Math]::Abs($G - $B), [Math]::Abs($R - $B))
    )

    return ($avg -gt 155 -and $maxDiff -lt 35)
}

$bitmap = [System.Drawing.Bitmap]::FromFile($sourcePath)
$width = $bitmap.Width
$height = $bitmap.Height
$rect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
$data = $bitmap.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $data.Stride
$bytes = $stride * $height
$buffer = New-Object byte[] $bytes
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $buffer, 0, $bytes)

function Get-Pixel {
    param([int]$X, [int]$Y)

    $index = ($Y * $stride) + ($X * 4)
    return @{
        B = $buffer[$index]
        G = $buffer[$index + 1]
        R = $buffer[$index + 2]
        A = $buffer[$index + 3]
        Index = $index
    }
}

function Set-Transparent {
    param([int]$Index)

    $buffer[$Index] = 0
    $buffer[$Index + 1] = 0
    $buffer[$Index + 2] = 0
    $buffer[$Index + 3] = 0
}

$queue = [System.Collections.Generic.Queue[System.ValueTuple[int, int]]]::new()
$visited = New-Object "System.Collections.Generic.HashSet[int]"

function Enqueue-Seed {
    param([int]$X, [int]$Y)

    if ($X -lt 0 -or $Y -lt 0 -or $X -ge $width -or $Y -ge $height) {
        return
    }

    $key = ($Y * $width) + $X
    if ($visited.Contains($key)) {
        return
    }

    $pixel = Get-Pixel -X $X -Y $Y
    if (-not (Test-BackgroundPixel $pixel.R $pixel.G $pixel.B $pixel.A)) {
        return
    }

    $visited.Add($key) | Out-Null
    $queue.Enqueue([System.ValueTuple[int, int]]::new($X, $Y))
}

$right = $width - 1
$bottom = $height - 1
$centerX = [int]($width / 2)
$centerY = [int]($height / 2)

$seedPoints = @(
    @(0, 0), @($right, 0), @(0, $bottom), @($right, $bottom),
    @($centerX, 0), @($centerX, $bottom),
    @(0, $centerY), @($right, $centerY)
)

foreach ($seed in $seedPoints) {
    Enqueue-Seed -X $seed[0] -Y $seed[1]
}

while ($queue.Count -gt 0) {
    $point = $queue.Dequeue()
    $pixel = Get-Pixel -X $point.Item1 -Y $point.Item2
    Set-Transparent -Index $pixel.Index

    Enqueue-Seed -X ($point.Item1 - 1) -Y $point.Item2
    Enqueue-Seed -X ($point.Item1 + 1) -Y $point.Item2
    Enqueue-Seed -X $point.Item1 -Y ($point.Item2 - 1)
    Enqueue-Seed -X $point.Item1 -Y ($point.Item2 + 1)
}

[System.Runtime.InteropServices.Marshal]::Copy($buffer, 0, $data.Scan0, $bytes)
$bitmap.UnlockBits($data)

$tempPath = "$sourcePath.tmp"
$bitmap.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Dispose()
Move-Item -Force $tempPath $sourcePath

Write-Host "Fixed transparency: $sourcePath"
