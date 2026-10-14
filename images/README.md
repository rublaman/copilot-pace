# Logo assets

The manifest uses `copilot-pace-128.png`. The 1024 px PNG and SVG provide the same artwork on a white circular background with transparent corners. The `copilot-pace-ui.svg` and `copilot-pace-ui-dark.svg` variants are used by the extension UI.

Original transparent SVG (512 × 512 viewBox) and 128/1024 px PNGs are preserved in `transparent/`. Those originals and this guide are excluded from the VSIX.

The repository social preview is `social-preview/copilot-pace.png` (1280 × 640). Regenerate it on Windows with `pwsh -NoProfile -File scripts/render-social-preview.ps1`, then upload it under GitHub Settings → Social preview. It is excluded from the VSIX.
