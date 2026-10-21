# Visual Studio Marketplace listing

English listing copy and publication reference for Copilot Pace. See [RELEASING.md](RELEASING.md#current-state) for the current GitHub release, tested artifacts and recorded Marketplace verification. The [public Marketplace listing](https://marketplace.visualstudio.com/items?itemName=rubenblancomanzano.copilot-pace) is updated separately from this repository.

## Publisher setup

| Field | Value |
| --- | --- |
| Publisher ID | `rubenblancomanzano` |
| Publisher name | Ruben Blanco Manzano |
| Extension ID | `rubenblancomanzano.copilot-pace` |
| Display name | Copilot Pace |

Edit the publisher profile through its [management page](https://marketplace.visualstudio.com/manage/publishers/rubenblancomanzano). The extension's repository and issue links are configured in `package.json`.

Pilots through 0.2.2 used `rublaman.copilot-pace`, a separate extension ID. Migration instructions are in the [changelog](../CHANGELOG.md).

Follow [RELEASING.md](RELEASING.md) to upload the tested release VSIX, then verify the listing, package hash and store installation. Marketplace prerelease publishing is unconfigured.

## Display name

Copilot Pace

## Short description

Track GitHub Copilot credits, daily allowance and projected usage in your VS Code status bar.

This text matches `description` in [package.json](../package.json).

## Description

Copilot Pace shows the percentage of GitHub Copilot credits used and a pace indicator in the VS Code status bar. The hover shows remaining credits and daily allowance; the detail panel compares usage with elapsed cycle time and shows your daily average and projection. Choose Every day or Mon–Fri for the estimate.

Connect, switch accounts or reconnect through VS Code's GitHub authentication. Usage refreshes every 15 minutes by default, with a configurable interval and manual refresh.

No workspace access or telemetry. Figures represent credits, and estimates depend on the quota and monthly cycle reported by GitHub.

Supports personal and Business accounts on GitHub.com and GitHub Enterprise (GHE) accounts on desktop VS Code for Windows, version 1.120 or later. Corporate usage queries require a single HTTPS instance configured in VS Code. The extension uses an internal GitHub endpoint that may change. Browser-based VS Code is unsupported.

## Marketplace overview and images

The [root README](../README.md) is the full Marketplace overview, including installation, commands, settings, privacy and limitations. Keep it as the source for the published overview rather than maintaining a second copy here. See the official [Marketplace presentation guidance](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#marketplace-integration).

| Asset | Suggested caption |
| --- | --- |
| [Brand banner](../images/social-preview/copilot-pace.png) | GitHub Copilot credits and daily usage pace. |
| [Hover · dark](images/hover-dark.gif) | Watch the tooltip and status bar change from Comfortable to On track to Over pace. Simulated data. |
| [Detail panel · dark](images/details-dark.gif) | Compare average consumption, daily allowance and renewal projections across all three pace colors. Simulated data. |
| [Command Palette](images/commands.png) | Connect GitHub, refresh usage or open details from the Command Palette. |

The overview displays only the dark-theme GIFs on separate lines and centers both animations for readability. Light-theme captures remain available in the repository as reference assets. Screenshot provenance and capture notes are in [images/README.md](images/README.md).

The README uses relative PNG and GIF paths for local and GitHub viewing. The existing packaging script rewrites them to HTTPS URLs for the packaged commit. Commit and push the referenced assets before preparing a publication candidate, then verify those exact URLs resolve. The banner and documentation captures are hosted in the repository and excluded from the VSIX by the existing ignore rules.

The animated GIFs are documentation captures from the 1.1.1 UI; the GIF files themselves remain excluded from the package. Updating the GitHub README alone does not update the Marketplace overview. Stable 1.2.1 includes the simplified README and GitHub.com/GHE compatibility text. Upload the exact tested VSIX identified in its [release record](https://github.com/rublaman/copilot-pace/releases/tag/v1.2.1) to refresh the listing; do not rebuild or replace any published artifact. Store upload and verification remain separate from GitHub publication.
