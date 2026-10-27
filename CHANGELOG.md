# Changelog

Versions 0.1.x were local development builds; 0.2.x, 1.1.0, 1.2.0, 1.3.0–1.3.5 and 1.3.7–1.3.8 are pilot versions. Published artifacts and validation records are in [GitHub Releases](https://github.com/rublaman/copilot-pace/releases); the release workflow is in [RELEASING.md](docs/RELEASING.md).

## [Unreleased]

## [1.3.8] - 2026-10-27

- Clean up expired local history at startup and each new UTC day, including when signed out, without blocking usage when a file cannot be deleted.
- Recover available history when a journal is damaged or unsupported, and preserve that file while continuing new observations in another journal.
- Load only the active account's current cycle for the history chart while retaining other observations for 90 days.

## [1.3.7] - 2026-10-26

- Keep Spanish quota and HTTP error messages independent of English diagnostic wording.
- Preserve panel controls and daily/cumulative chart behavior while moving browser rendering to typed source and separating chart construction.
- Refresh Marketplace availability and contributor documentation.

## [1.3.6] - 2026-10-22

- Release the validated 1.3.x features as stable: usage history, daily/cumulative charts, status indicator styles and local history file controls.
- Include the high-resolution animated examples and documentation privacy cleanup from 1.3.5.

## [1.3.5] - 2026-10-22

- Shorten the status-mode GIF to eight seconds and show both green Comfortable and red Over pace examples.
- Keep internal reports, review captures and the corporate authentication reference local and excluded from public documentation and extension packages.

## [1.3.4] - 2026-10-22

- Improve the README and Marketplace status-mode GIF with native high-resolution captures, explicit mode labels and a full-resolution link.
- Show each mode for three seconds while preserving the clarity of percentages and credit totals.

## [1.3.3] - 2026-10-22

- Add cursor-free animated examples of cumulative/daily charts and all four status bar styles to the README and Marketplace overview.
- Include the local history sign-in visibility fix from the unpublished 1.3.2 candidate.

## [1.3.2] - 2026-10-22

- Hide the local history file controls and explanatory text when no account is connected; show them again after sign-in.

## [1.3.1] - 2026-10-21

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
