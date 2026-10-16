# Visual Studio Marketplace listing

English listing copy and publication reference for Copilot Pace. See [RELEASING.md](RELEASING.md#current-state) for the current GitHub release, tested artifacts and recorded Marketplace verification. The [public Marketplace listing](https://marketplace.visualstudio.com/items?itemName=rubenblancomanzano.copilot-pace) is updated separately from this repository.

## Publisher setup

On October 15, 2026, the maintainer created and selected the personal publisher ID `rubenblancomanzano` for this and future extensions, and confirmed that **Details → Name** is saved as **Ruben Blanco Manzano**. This is separate from the extension's display name, **Copilot Pace**. The unused `CopilotPace` publisher does not need to be deleted to continue.

1. Open the selected publisher's [management page](https://marketplace.visualstudio.com/manage/publishers/rubenblancomanzano) and select **Details**.
2. Set **Name** to **Ruben Blanco Manzano** and save. Keep the immutable **ID** `rubenblancomanzano`. The publisher profile represents the developer across extensions: use a personal website or GitHub profile, a general contact if desired, and leave the source repository empty unless there is a shared repository. Copilot Pace's own repository and issue tracker belong in its extension manifest.
3. Version 0.2.3 and later use `rubenblancomanzano.copilot-pace`; the manifest, release workflow and installed-package tests use this identity. Pilots through 0.2.2 retain `rublaman.copilot-pace`. Migration details remain in the [release guide](RELEASING.md#current-state), since this is a separate extension rather than an automatic update.
4. Follow the stable release workflow in [RELEASING.md](RELEASING.md). Validate the final package independently of any earlier runtime acceptance.
5. Upload the exact tested VSIX identified in the release record under **Ruben Blanco Manzano**. Verify its public listing, package hash and store installation. Keep published artifacts unchanged.

Version 1.0.1 changes the categories from `Other` to `Visualization` and `AI` and removes the earlier-pilot replacement section from the main README. It uses the stable release workflow from `main` with `preview: false`. Marketplace prerelease publishing is a separate channel and remains unconfigured.

This repository change does not edit or save the online publisher profile. GitHub repository ownership and source URLs remain `rublaman/copilot-pace`. The manifest's `bugs` URL points to this extension's issue tracker.

## Display name

Copilot Pace

## Short description

Track GitHub Copilot credits, daily allowance and projected usage in your VS Code status bar.

This text matches `description` in [package.json](../package.json).

## Description

Keep your GitHub Copilot credit budget in view while you code. Copilot Pace shows your used percentage and estimated monthly pace in the VS Code status bar, with a hover summary and a detail panel when you need a closer look.

See used and remaining credits, compare consumption with cycle progress, and check how much is available per day. A projection at renewal helps you understand whether your current pace leaves room in the budget, is close to the limit, or may exceed it. Choose Every day or Mon–Fri for the estimate.

Connect through VS Code's GitHub authentication, see which account is selected, and switch or reconnect from the extension. Usage refreshes automatically at a configurable interval and can also be refreshed manually.

No workspace access or telemetry. Figures represent credits, and estimates depend on the quota and monthly cycle reported by GitHub.

Targets GitHub.com on desktop VS Code for Windows, version 1.120 or later. The maintainer validated the 0.2.3 runtime with a real Copilot account; 1.0.0 retains that behavior. Other accounts and corporate networks require separate validation. The extension uses an internal GitHub endpoint that may change. GitHub Enterprise Server, GHE.com and browser-based VS Code are unsupported.

## Marketplace overview and images

The [root README](../README.md) is the full Marketplace overview, including installation, commands, settings, privacy and limitations. Keep it as the source for the published overview rather than maintaining a second copy here. See the official [Marketplace presentation guidance](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#marketplace-integration).

| Asset | Suggested caption |
| --- | --- |
| [Brand banner](../images/social-preview/copilot-pace.png) | GitHub Copilot credits and daily usage pace. |
| [Hover · dark](images/hover-dark.gif) | Watch the tooltip and status bar change from Comfortable to On track to Over pace. Simulated data. |
| [Detail panel · dark](images/details-dark.gif) | Compare average consumption, daily allowance and renewal projections across all three pace colors. Simulated data. |
| [Command Palette](images/commands.png) | Connect GitHub, refresh usage or open details from the Command Palette. |

The overview displays only the dark-theme GIFs on separate lines and centers the tooltip animation for readability. Light-theme captures remain available in the repository as reference assets. Screenshot provenance and capture notes are in [images/README.md](images/README.md).

The README uses relative PNG and GIF paths for local and GitHub viewing. The existing packaging script rewrites them to HTTPS URLs for the packaged commit. Commit and push the referenced assets before preparing a publication candidate, then verify those exact URLs resolve. The banner and documentation captures are hosted in the repository and excluded from the VSIX by the existing ignore rules.

The animated GIFs are documentation captures from the 1.1.1 UI. The published [1.1.2 VSIX](https://github.com/rublaman/copilot-pace/releases/download/v1.1.2/copilot-pace-1.1.2.vsix) carries the updated README with HTTPS links to these repository assets; the GIF files themselves remain excluded from the package. Updating the GitHub README alone does not update the Marketplace overview. Upload the exact tested 1.1.2 VSIX from the [stable release](https://github.com/rublaman/copilot-pace/releases/tag/v1.1.2) to refresh the listing; do not rebuild or replace any published artifact. Store upload and verification remain pending.
