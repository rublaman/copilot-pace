# Changelog

Versions 0.1.x describe local development builds.

## [Unreleased]

## [1.2.1] - 2026-10-19

- Promote the Enterprise connection to stable after the maintainer confirmed that the 1.2.0 pilot works correctly in both GitHub.com and corporate GHE environments.
- Document support for GitHub.com personal/Business and GitHub Enterprise (GHE) accounts, with concise corporate connection instructions.
- Remove pilot wording and test-environment history from the README. Set `preview: false`; runtime behavior is unchanged from the accepted 1.2.0 pilot apart from the build-time version value.

## [1.2.0] - 2026-10-19

GitHub pilot with `preview: true`. Enterprise login, quota comparison and corporate proxy/certificate validation remain pending in the target environment.

- Follow Copilot's configured GitHub.com or GitHub Enterprise provider by default, with an independent account-service preference for Copilot Pace.
- Offer corporate/GitHub.com selection when an Enterprise connection is configured, using VS Code's native authentication with the existing `read:user` scope. Keep the normal GitHub.com flow for personal and Business accounts.
- Add experimental quota routing for a single configured HTTPS Enterprise origin, cancellation on connection changes and localized guidance for invalid or ambiguous configuration. Real corporate account/network acceptance remains pending.

## [1.1.3] - 2026-10-16

- Show only the dark-theme tooltip and detail-panel GIFs in the README, centered for readability.
- Keep the two animations on the same six-second cycle; no extension runtime code changed.

## [1.1.2] - 2026-10-16

- Refresh the README and Marketplace overview with looping dark- and light-theme GIFs of the tooltip and detail panel, showing green, yellow and red pace states.
- Keep each state visible for two seconds in matching six-second cycles.
- No extension runtime code changed.

## [1.1.1] - 2026-10-16

Promote the 1.1.0 pilot to stable after the maintainer reviewed and approved its visual presentation.

- Set `preview: false` for the stable GitHub release. The published `v1.1.0` pilot and its assets remain unchanged.
- Carry forward the localization, compact hover, daily allowance labels and theme-aware pace colors from the pilot; no feature changes were made after that review.
- This visual approval does not record new real-account flow, quota-comparison or corporate-network checks.

## [1.1.0] - 2026-10-16

GitHub pilot with `preview: true`. The maintainer reviewed and approved the visual presentation on October 16 before requesting stable promotion. New real-account flow, quota-comparison and corporate-network checks were not recorded for these UI changes.

- Add Spanish (Spain) with English as the default and a saved application-level language preference. Switch only from the detail panel using Spanish or Inglés; localize status, hover, panel, accessible labels, dates, numbers and connection guidance without refreshing usage.
- Simplify the hover to pace status, remaining credits, daily allowance, projected usage and last update, keeping account actions and recovery messages. Reuse the daily allowance from the panel with the selected Every day or Mon–Fri calendar.
- Align the Comfortable check with its label in the native hover.
- Apply the green, yellow and red pace colors to the hover status and the detail panel using VS Code theme colors; clear pace colors for unavailable or stale data.
- Keep the panel logo visible in the light high-contrast theme.
- Omit today's usage because the quota connection supplies no daily breakdown, including for connected accounts; do not substitute the monthly average or label credits as tokens.
- Label the hover's selected calendar as Mon–Sun or Mon–Fr in English and De lunes a domingo or De lunes a viernes in Spanish.

## [1.0.1] - 2026-10-15

- Categorize the extension as Visualization and AI in the Marketplace.
- Remove the earlier-pilot replacement section from the main README; migration details remain in the release documentation.

Stable metadata and documentation update with `preview: false`. Runtime source is unchanged from 1.0.0. The final tagged VSIX is validated separately before publication.

## [1.0.0] - 2026-10-15

- First stable release, retaining the GitHub Copilot credit tracking and pace estimates from the 0.2.3 pilot.
- Set `preview: false` and keep the `rubenblancomanzano.copilot-pace` identity for updates from 0.2.3.
- Replace pilot VSIX installation instructions with Marketplace installation steps and update compatibility information.
- Record the maintainer's successful real-account checks: GitHub connection, credits and renewal compared with GitHub, manual refresh, details, Every day / Mon–Fri, light/dark themes and data after restarting VS Code. The publisher profile name was also confirmed as Ruben Blanco Manzano.

Real-account acceptance was reported for 0.2.3 on October 15, 2026. No runtime code changed for 1.0.0. Other accounts and corporate networks are not covered by that confirmation. Marketplace publication is a separate manual step after the final GitHub release artifact is validated.

## [0.2.3] - 2026-10-15

- Align the extension, installed-package tests and release workflow with the final Marketplace publisher, `rubenblancomanzano` (Ruben Blanco Manzano).
- Add author and issue-reporting metadata while retaining the existing GitHub repository.
- Document replacing earlier pilots and the remaining validation before `1.0.0` stable.

This changes the extension ID from `rublaman.copilot-pace` to `rubenblancomanzano.copilot-pace`. Uninstall the earlier pilot before installing this VSIX, then reconnect GitHub. Existing `copilotPace.*` user settings are retained. This is a GitHub pilot release; Marketplace publication and real account/network validation remain pending.

## [0.2.2] - 2026-10-15

- Identify the selected GitHub account in the hover and detail panel, and label the account action as Connect, Switch account or Reconnect according to the current state.
- Add an illustrated README with the existing brand banner, usage examples in dark and light themes, and the production Command Palette.
- Prepare English Marketplace listing copy and improve the extension's short description.

Real account and corporate network compatibility remain unverified. This is a pilot release.

## [0.2.1] - 2026-10-14

- Use the GitHub green for the Connect GitHub button, with theme colors in high contrast modes.
- Add a short GitHub connection prompt to the panel and VS Code authorization dialog.
- Show credit usage and projections with up to one decimal place in the status bar, hover and detail panel; show positive usage that would round to zero as less than 0.1%.
- Use a circular extension icon with transparent corners while preserving the original logo.

Real account and corporate network compatibility remain unverified. This is a pilot release.

## [0.2.0] - 2026-10-13

- First pilot with GitHub Copilot credits, remaining allowance and estimated UTC monthly pace in the status bar, hover and detail panel.
- Support Every day / Mon–Fri estimates, manual refresh, retained stale data and retry cooldowns.
- Keep synthetic demos in development hosts; production packages use GitHub and exclude demo code, commands and settings.
- Add tested VSIX artifacts, SHA-256 checksums, build records and tagged release drafts.
- Include English documentation, the MIT license and Copilot Pace branding.

Real account and corporate network compatibility remain unverified. The extension uses an internal GitHub endpoint; GHE.com, GitHub Enterprise Server and web hosts are unsupported.

## [0.1.3] - 2026-10-13

- Use the Copilot Pace logo on a solid white background.
- Separate development demos from production packages.

## [0.1.2] - 2026-10-12

- Color status text by pace and keep detail-panel controls neutral.
- Use the current UTC calendar for demo estimates.

## [0.1.1] - 2026-10-12

- Add English presentation, a rich hover, daily allowance and cycle progress.
- Preserve saved demo choices during migration.

## [0.1.0] - 2026-10-12

- Add credit normalization, monthly pace estimates, GitHub connection and synthetic demos.
