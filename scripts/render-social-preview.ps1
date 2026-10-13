[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$output = Join-Path $root 'images/social-preview/copilot-pace.png'
$null = New-Item -ItemType Directory -Path (Split-Path -Parent $output) -Force
Add-Type -AssemblyName System.Drawing
$canvas = [System.Drawing.Bitmap]::new(1280, 640)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$logo = [System.Drawing.Image]::FromFile((Join-Path $root 'images/transparent/copilot-pace-1024.png'))
try {
    $graphics.Clear([System.Drawing.Color]::White)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    function Draw-Text([string]$Text, [float]$Size, [System.Drawing.FontStyle]$Style, [float]$X, [float]$Y, [string]$Color) {
        $font = [System.Drawing.Font]::new('Segoe UI', $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
        $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($Color))
        try { $graphics.DrawString($Text, $font, $brush, [System.Drawing.PointF]::new($X, $Y)) }
        finally { $brush.Dispose(); $font.Dispose() }
    }
    function Draw-Block([float]$X, [float]$Y, [float]$Width, [float]$Height, [string]$Color) {
        $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($Color))
        try { $graphics.FillRectangle($brush, $X, $Y, $Width, $Height) }
        finally { $brush.Dispose() }
    }

    # Keep the identifying text and artwork inside GitHub's template margins.
    Draw-Text 'VS CODE EXTENSION' 18 Bold 94 99 '#57606A'
    Draw-Text 'Copilot Pace' 76 Bold 88 170 '#21262D'
    Draw-Text 'GitHub Copilot credits' 32 Regular 93 284 '#57606A'
    Draw-Text 'and daily usage pace.' 32 Regular 93 327 '#57606A'
    $graphics.DrawImage($logo, [System.Drawing.Rectangle]::new(852, 166, 320, 320))

    Draw-Block 96 411 178 8 '#238636'
    Draw-Block 290 411 156 8 '#9A6700'
    Draw-Block 462 411 174 8 '#CF222E'
    Draw-Text 'Comfortable' 21 Regular 93 431 '#57606A'
    Draw-Text 'On track' 21 Regular 287 431 '#57606A'
    Draw-Text 'Over pace' 21 Regular 459 431 '#57606A'

    Draw-Block 96 494 1088 1 '#D8DEE4'
    Draw-Text 'rublaman/copilot-pace' 22 Regular 93 523 '#57606A'
    Draw-Text 'MIT licensed' 22 Regular 1059 523 '#57606A'
    $canvas.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
} finally { $logo.Dispose(); $graphics.Dispose(); $canvas.Dispose() }

Write-Host "Created $output (1280 x 640 PNG)"
