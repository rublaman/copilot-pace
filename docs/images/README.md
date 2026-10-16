# Documentation captures

The animated usage examples were captured on October 16, 2026, on Windows 11 with desktop VS Code 1.142.0. The extension UI is version 1.1.1 at source commit `abb04a73178c6edcf9b461b892ac9320ab13e01f`.

| File | Source | Size |
| --- | --- | --- |
| `hover-dark.gif` | Actual tooltip and status bar, Default Dark Modern. | 526 × 320 |
| `hover-light.gif` | Actual tooltip and status bar, Default Light Modern. | 526 × 320 |
| `details-dark.gif` | Actual detail panel opened by clicking the status item, Default Dark Modern. | 660 × 916 |
| `details-light.gif` | Actual detail panel opened by clicking the status item, Default Light Modern. | 660 × 916 |
| `commands.png` | Production bundle loaded in an isolated development host, filtered Command Palette. Captured on October 15 with VS Code 1.141.2 and extension 0.2.2 at `d19b28211df5e727dbca62ed21f92047504777bd`; the production commands are unchanged. | Static PNG |

Each GIF contains three screenshots, held for three seconds each, and loops every nine seconds. All examples use the same 3,900-credit budget, the Every day calendar and English UI:

| Frame | Development scenario | Used | Projected at renewal | Pace |
| --- | --- | --- | --- | --- |
| 1 | `3900-on-track` | 1,755 credits (45%) | About 89.3% | Comfortable · green |
| 2 | `budget-3900` | 1,950 credits (50%) | About 99.2% | On track · yellow |
| 3 | `3900-over-pace` | 2,340 credits (60%) | About 119% | Over pace · red |

Scenario names identify fixed demo quotas, not fixed pace labels. Dates and calculated pace use the UTC clock at capture time (approximately 15:01–15:04 UTC). The cycle is about 50.4% elapsed. Colors follow the renewal projection calculated from average consumption, so replaying these scenarios on another day can produce different labels.

The images are crops of the actual VS Code UI captured with Computer Use and assembled with FFmpeg. They are not generated mockups. Demo labels and simulated-data footers are retained. No real account, credentials or network responses were used for the captures. The GIFs replace the older static status-bar and detail-panel screenshots.

To refresh the usage examples:

1. Follow the development-host setup in [CONTRIBUTING.md](../../CONTRIBUTING.md). Use an isolated profile with no real GitHub session, English, Every day and the required theme.
2. Select each demo scenario, wait for the displayed values to settle, hover over the status item and click it to open the panel. Keep the same viewport and crop for all three frames. Verify the displayed pace labels; scenario names alone do not establish the colors.
3. Capture the actual UI, retaining the Demo label and simulated-data footer. Crop only the tooltip with its status item, or the complete panel including its footer.
4. Assemble the three crops as a looping GIF with a shared palette and a three-second delay per frame. Check all frames for readable text, correct colors and complete content in both themes.
5. Capture the Command Palette from the production bundle when its commands change, so development-only commands are not presented as product features.

These files are documentation assets. The existing `docs/**` rule in `.vscodeignore` excludes them from the VSIX; packaging rewrites README image references to the corresponding repository commit. Commit and push the assets before packaging a publication candidate. Marketplace needs a newly published package with the updated README; changing GitHub alone does not update the listing.
