# Documentation captures

## Current status modes and pace colors: October 22, 2026

`status-modes-hd-dark.gif` keeps the native 1104 × 998 resolution, a 640-pixel README/Marketplace display width and a full-resolution link. Its four labeled frames last two seconds each, reducing the infinite loop from twelve to eight seconds.

| Frame | Mode | Credits used | Projection at renewal | Pace |
| --- | --- | --- | --- | --- |
| 1 | Default — Percentage and pace | 2,100 / 6,000 (35%) | 4,200 (70%) | Comfortable · green |
| 2 | Compact | 3,115 / 6,000 (51.9%) | 6,230 (103.8%) | Over pace · red |
| 3 | Segmented bar | 2,100 / 6,000 (35%) | 4,200 (70%) | Comfortable · green |
| 4 | Dots | 3,115 / 6,000 (51.9%) | 6,230 (103.8%) | Over pace · red |

The green examples were captured in an isolated VS Code 1.143.0 harness using the actual presentation functions from `7d60a460c3a4910fc17db9f32ad5d773ba953a61`. They retain the earlier fictional account, fixed October 16, 2026 12:00 UTC clock and October cycle; only the quota fixture changes. Comfortable follows the calculated 70% projection, not a recoloring of the red example. No chart from this harness is included in this asset.

The tooltip uses native zoom level 4 and the indicators level 8, matching the earlier high-resolution captures. The tooltip opens through keyboard focus after transitions finish; the pointer and capture halo remain outside the crops. Temporary notifications were dismissed before capture, and indicator focus outlines are excluded. The red frames reuse the previously reviewed native compositions. FFmpeg assembles the crops without raster enlargement and encodes a shared 256-color palette without dithering. All four decoded frames were reviewed at the README display size for numbers, colors, complete text and absence of pointer/halo artifacts.

## Original high-resolution status captures: October 22, 2026

The original `status-modes-hd-dark.gif` (1104 × 998) replaced the enlarged low-resolution example in the README and Marketplace overview. Both documents displayed it at 640 pixels wide and linked to the full-resolution file. That version used four mode labels, three-second frame delays and a twelve-second infinite loop. Its timing adjustment changed only GIF delay metadata; image data and decoded pixels were unchanged. The current version above adds green examples and shortens the loop.

The isolated VS Code 1.143.0 harness was captured again with the same fixed fixture. The tooltip was rendered at zoom level 4 (about 207%) and the status indicator at zoom level 8 (about 430%). Both are native rasterizations at their capture size; neither crop is enlarged from a smaller screenshot. The renderer is unchanged from the source recorded below; the documentation baseline is `62f252ee0eec8b3d4629997bc9fcef75037a63b1`.

Each tooltip capture was taken after its transition completed. The usage-number region is pixel-identical across the four source frames, ruling out transitional double text in those figures. FFmpeg places each native indicator above its tooltip, adds the mode label and encodes a shared 256-color palette without dithering. The mouse pointer, halo and Codex controls stay outside the crops.

All four frames decoded from the final GIF were visually reviewed at the README display size, including the percentage, credit amounts and forecast. The earlier GIFs below remain as reference assets.

## Enlarged status modes: October 22, 2026

`status-modes-dark.gif` (530 × 484) makes the four status indicators visible above the native tooltip. Its frames are labeled Default — Percentage and pace, Compact, Segmented bar and Dots. Each frame lasts four seconds; the sixteen-second animation loops indefinitely.

The source is the four pointer-free native VS Code crops used for `status-styles-dark.gif`, described below. FFmpeg enlarges each actual indicator crop by a factor of two and places it above the corresponding tooltip, with a mode label outside the captured UI. The tooltip contents and synthetic values are unchanged. This is an annotated comparison, not a new UI layout or a generated rendering.

All four final frames were reviewed for readable labels, distinct indicators, complete tooltip content and absence of the mouse pointer, capture halo and Codex controls. The enlarged indicator crops also exclude VS Code's keyboard-focus outline. The README and Marketplace overview use this enlarged comparison; the original full crops remain reference assets.

## Current charts and status styles: October 22, 2026

`charts-dark.gif` (650 × 480) and `status-styles-dark.gif` (530 × 400) show the renderer from `51861f5a1ec18715de388c7d0f22c35ad5b62eec` (1.3.2), captured on Windows 11 / VS Code 1.143.0 with Default Dark Modern. Each GIF contains four frames held for three seconds, including the last frame, and loops every twelve seconds.

The captures use an isolated documentation harness with the actual `createViewModel`, `renderHtml`, `renderHover` and status text functions. VS Code renders the native status item, Markdown hover and webview. A fixed fixture uses October 16, 2026 at 12:00 UTC, 3,115 credits consumed from a 6,000-credit cycle budget, missing days 3 and 11, and a partial final day. The account is fictional. These are synthetic rendering examples, not account or billing acceptance.

| Frame | Charts | Status styles |
| --- | --- | --- |
| 1 | Cumulative · Line · Every day | Percentage and pace |
| 2 | Cumulative · Columns · Every day | Compact |
| 3 | Daily · Line · Every day | Segmented bar |
| 4 | Daily · Columns · Mon–Fri | Dots |

The status animation keeps the same values, Every day calendar and native hover across all four styles. Its Demo and simulated-data labels remain visible. The chart animation crops the usage section, including the metric, style, budget labels, legends and partial-data notes. The README and Marketplace overview identify the chart data as illustrative.

Computer Use captured the application window. The hover was opened with keyboard focus, with the pointer parked outside both crops. FFmpeg cropped the frames and assembled each GIF with a shared palette. All eight final frames were reviewed for complete text, chart labels, colors and absence of the pointer, its halo and Codex controls. No screenshots were painted or generated.

## Earlier pace examples: October 16, 2026

The animated usage examples were captured on October 16, 2026, on Windows 11 with desktop VS Code 1.142.0. The extension UI is version 1.1.1 at source commit `abb04a73178c6edcf9b461b892ac9320ab13e01f`.

| File | Source | Size |
| --- | --- | --- |
| `hover-dark.gif` | Actual tooltip and status bar, Default Dark Modern. | 526 × 320 |
| `hover-light.gif` | Actual tooltip and status bar, Default Light Modern. | 526 × 320 |
| `details-dark.gif` | Actual detail panel opened by clicking the status item, Default Dark Modern. | 660 × 916 |
| `details-light.gif` | Actual detail panel opened by clicking the status item, Default Light Modern. | 660 × 916 |
| `commands.png` | Production bundle loaded in an isolated development host, filtered Command Palette. Captured on October 15 with VS Code 1.141.2 and extension 0.2.2 at `d19b28211df5e727dbca62ed21f92047504777bd`; the production commands are unchanged. | Static PNG |

Each earlier GIF contains three screenshots, held for two seconds each, and loops every six seconds. All four use the same frame order and timing. The README and Marketplace overview retain `details-dark.gif` to illustrate pace colors; the earlier hover and light-theme files remain reference assets. These examples use the same 3,900-credit budget, the Every day calendar and English UI:

| Frame | Development scenario | Used | Projected at renewal | Pace |
| --- | --- | --- | --- | --- |
| 1 | `3900-on-track` | 1,755 credits (45%) | About 89.2% | Comfortable · green |
| 2 | `budget-3900` | 1,950 credits (50%) | About 99.1% | On track · yellow |
| 3 | `3900-over-pace` | 2,340 credits (60%) | About 118.9% | Over pace · red |

Scenario names identify fixed demo quotas, not fixed pace labels. Dates and calculated pace use the UTC clock at capture time (approximately 15:20–15:21 UTC). The cycle is about 50.5% elapsed. Colors follow the renewal projection calculated from average consumption, so replaying these scenarios on another day can produce different labels.

The images are crops of the actual VS Code UI captured with Computer Use and assembled with FFmpeg. The hover is opened using keyboard focus, with the mouse pointer and its capture halo outside both crops. Tooltip and detail-panel frames for each theme and scenario come from the same screenshot. They are not generated mockups. Demo labels and simulated-data footers are retained. No real account, credentials or network responses were used for the captures. The GIFs replace the older static status-bar and detail-panel screenshots.

To refresh the usage examples:

1. Follow the development-host setup in [CONTRIBUTING.md](../../CONTRIBUTING.md). Use an isolated profile with no real GitHub session, English, Every day and the required theme.
2. Click the status item to open the panel. Run **View: Focus Status Bar**, then use **End** and **Left** to focus Copilot Pace and open its hover without the mouse. Move the pointer to a blank area outside both intended crops; confirm the hover stays open. Select each demo scenario and wait for the displayed values to settle. Keep the same viewport and crop for all three frames. Verify the displayed pace labels; scenario names alone do not establish the colors.
3. Capture the actual UI, retaining the Demo label and simulated-data footer. Crop the tooltip with its status item and the complete panel including its footer from the same screenshot. Check that neither crop contains the pointer or its halo.
4. Assemble the three crops as looping GIFs with a shared palette per GIF and a two-second delay for every frame, including the final frame. Use identical timing for all four files. Check all frames for readable text, correct colors and complete content in both themes.
5. Capture the Command Palette from the production bundle when its commands change, so development-only commands are not presented as product features.

These files are documentation assets. The existing `docs/**` rule in `.vscodeignore` excludes them from the VSIX; packaging rewrites README image references to the corresponding repository commit. Commit and push the assets before packaging a publication candidate. Marketplace needs a newly published package with the updated README; changing GitHub alone does not update the listing.
