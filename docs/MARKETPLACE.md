# Visual Studio Marketplace listing

English listing copy for the current development version. Publication and real account validation remain pending; this document does not announce a Marketplace release.

## Publisher setup

On October 15, 2026, the maintainer created and selected the personal publisher ID `rubenblancomanzano` for this and future extensions. The intended public publisher name is **Ruben Blanco Manzano**, separate from this extension's display name, **Copilot Pace**. The unused `CopilotPace` publisher does not need to be deleted to continue.

1. Open the selected publisher's [management page](https://marketplace.visualstudio.com/manage/publishers/rubenblancomanzano) and select **Details**.
2. Set **Name** to **Ruben Blanco Manzano** and save. Keep the immutable **ID** `rubenblancomanzano`. The publisher profile represents the developer across extensions: use a personal website or GitHub profile, a general contact if desired, and leave the source repository empty unless there is a shared repository. Copilot Pace's own repository and issue tracker belong in its extension manifest.
3. Version 0.2.3 uses `rubenblancomanzano.copilot-pace`; its manifest, release workflow and installed-package tests use this identity. Pilots through 0.2.2 retain `rublaman.copilot-pace`. Follow the [replacement instructions](../README.md#replace-an-earlier-pilot), since this is a separate extension rather than an automatic update.
4. Complete real account acceptance with the new pilot. Prepare `1.0.0`, `preview: false`, promote it to `main` and validate the final candidate as described in [RELEASING.md](RELEASING.md).
5. Upload that same tested `1.0.0` VSIX through **New extension → Visual Studio Code** under `rubenblancomanzano`, then verify the listing and installation. The 0.2.3 GitHub pilot does not publish to Marketplace.

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

**Preview:** targets GitHub.com on desktop VS Code for Windows, version 1.120 or later. Real account and corporate network validation is pending. The extension uses an internal GitHub endpoint that may change. GitHub Enterprise Server, GHE.com and browser-based VS Code are unsupported.

## Marketplace overview and images

The [root README](../README.md) is the full Marketplace overview, including installation, commands, settings, privacy and limitations. Keep it as the source for the published overview rather than maintaining a second copy here. See the official [Marketplace presentation guidance](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#marketplace-integration).

| Asset | Suggested caption |
| --- | --- |
| [Brand banner](../images/social-preview/copilot-pace.png) | GitHub Copilot credits and daily usage pace. |
| [Status bar](images/status-bar.png) | Check your used percentage and pace while you work. Simulated data. |
| [Detail panel · dark](images/details-dark.png) | Compare usage, remaining credits and daily allowance. Simulated data. |
| [Detail panel · light](images/details-light.png) | See when your current pace may exceed the budget. Simulated data. |
| [Command Palette](images/commands.png) | Connect GitHub, refresh usage or open details from the Command Palette. |

Screenshot provenance and capture notes are in [images/README.md](images/README.md).

The README uses relative PNG paths for local and GitHub viewing. The existing packaging script rewrites them to HTTPS URLs for the packaged commit. Commit and push the referenced assets before preparing a publication candidate, then verify those exact URLs resolve. The banner and documentation screenshots are hosted in the repository and excluded from the VSIX by the existing ignore rules.
