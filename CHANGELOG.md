# Changelog

Versions 0.1.x were local development builds; 0.2.x, 1.1.0, 1.2.0 and 1.3.0 are pilot versions. Validation and publication records are in [validation.md](docs/validation.md) and [RELEASING.md](docs/RELEASING.md).

## [Unreleased]

- Label chart budget targets and daily weekend transitions with short UTC dates.
- Keep Line and Columns chart styles; existing Gradient area preferences display as Line.
- Explain projected usage at renewal and show total used credits in the status hover.
- Reveal the active account's observed-usage file location from Customization or open the file in VS Code.

## [1.3.0] - 2026-10-21

- Add estimated credit exhaustion and projected excess over the cycle budget.
- Add a local observed-usage chart with account/server separation and 90-day retention.
- Add compact, segmented-bar and dot status indicators, selectable in the panel and settings.
- Add gradient-area, line and column chart styles with saved selection in Customization.
- Add a Daily / Cumulative chart switch and optional daily billing retrieval with automatic fallback to partial local observations.
- Color usage charts green within budget pace and red above it, including line and area crossings.
- Fix successful sign-in appearing disconnected after an early VS Code session-change event.
- Reject Enterprise authentication when multiple instances are configured.
- Add README badges and simplify code and documentation for account connections.

## [1.2.1] - 2026-10-19

- Release the Enterprise connection from 1.2.0 as stable.
- Update GitHub.com and GHE setup instructions and remove pilot wording from the README.

## [1.2.0] - 2026-10-19

- Add Enterprise sign-in and quota queries for one configured HTTPS instance.
- Follow Copilot's authentication provider by default, with an independent provider and account selection for Pace.
- Cancel pending queries on connection changes and require reload after changing the Enterprise instance.

## [1.1.3] - 2026-10-16

- Use synchronized dark-theme GIFs in the README.

## [1.1.2] - 2026-10-16

- Add dark- and light-theme animated usage examples to the README and Marketplace overview.

## [1.1.1] - 2026-10-16

- Release the localization and pace-color changes from 1.1.0 as stable.

## [1.1.0] - 2026-10-16

- Add a saved Spanish (Spain) language preference, with English as the default and a switch in the detail panel.
- Compact the hover around account, pace, remaining credits, daily allowance, selected calendar, projection and last update.
- Apply theme-aware pace colors to the hover and detail panel; clear them for stale or unavailable data.
- Fix the hover check alignment and panel logo visibility in the light high-contrast theme.

## [1.0.1] - 2026-10-15

- Set Marketplace categories to Visualization and AI.
- Move legacy pilot migration instructions out of the README.

## [1.0.0] - 2026-10-15

- First stable release of Copilot credit tracking and monthly pace estimates, retaining the 0.2.3 runtime.
- Add Marketplace installation instructions and update compatibility information.

## [0.2.3] - 2026-10-15

- Change the extension ID from `rublaman.copilot-pace` to `rubenblancomanzano.copilot-pace`.
- Add author and issue-reporting metadata.

To upgrade from an earlier pilot, uninstall the old extension before installing this version, then reconnect GitHub. Existing `copilotPace.*` settings are retained.

## [0.2.2] - 2026-10-15

- Show the selected account in the hover and detail panel, with Connect, Switch account or Reconnect actions.
- Add illustrated usage examples and Marketplace listing copy.

## [0.2.1] - 2026-10-14

- Style the Connect GitHub button in green, using theme colors in high contrast modes.
- Add connection guidance to the panel and authorization dialog.
- Display credits and projections with up to one decimal place; use `<0.1%` when positive usage would round to zero.
- Use a circular extension icon with transparent corners.

## [0.2.0] - 2026-10-13

- First pilot with Copilot credits, remaining allowance and UTC monthly pace in the status bar, hover and detail panel.
- Add Every day / Mon–Fri estimates, manual refresh, stale data display and retry cooldowns.
- Restrict synthetic demos to development hosts and exclude them from production packages.
- Add VSIX test artifacts, checksums, build records and tagged release drafts.
- Add the MIT license and project branding.

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
