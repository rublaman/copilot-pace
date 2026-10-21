# Chart targets and history access review

October 21, 2026. These are browser captures of the extension's generated detail-panel HTML with synthetic data, not real-account billing acceptance. Native VS Code integration and installed-package checks are recorded separately below.

## Scenario

- Clock: October 16, 2026 at 12:00 UTC; cycle: October 1 to November 1 UTC.
- Budget: 6,000 credits; total consumed: 3,115 credits (51.9%).
- Observations exist on 14 days. October 3 and 11 are deliberately absent because the fixture simulates no work or observations on those days. The chart leaves gaps instead of fabricating zero totals.
- Daily values for October 1–16: 140, 280, missing, 100, 420, 220, 85, 340, 190, 70, missing, 480, 175, 125, 390, 100 credits.
- Local fixtures contain hourly same-day snapshots from 09:00 to 17:00, ending at 12:00 on October 16. Daily differences remain labeled partial. Reported fixtures contain the same daily values, with only October 16 marked partial; no live API was queried.
- Every-day reference: 6,000 / 31 = 193.5 credits per day. Mon–Fri reference: 6,000 / 22 = 272.7 credits per weekday, with zero budget on weekends.
- Projected cycle totals: 6,230 credits for Every day; 5,959.1 credits for Mon–Fri. These estimates apply the cycle average, not just the last day's spending.

The same fixture was checked for both sources, both metrics, both calendars and both remaining chart styles: 16 combinations. The local journal path in the panel captures belongs to this synthetic fixture.

## Captures

| Capture | Content |
| --- | --- |
| [Daily, reported fixture](daily-api.png) | Line and Columns, Every day and Mon–Fri; daily target labels and weekend transition dates |
| [Daily, local fixture](daily-local.png) | The same four views with partial observation outlines |
| [Cumulative, reported fixture](cumulative-api.png) | Monthly target labels in both styles and calendars |
| [Cumulative, local fixture](cumulative-local.png) | The same cumulative observations; API data does not change the saved quota history |
| [Spanish, dark](panel-dark-es.png) | Full panel, projection explanation and local journal controls |
| [English, light](panel-light-en.png) | Full panel after changing language, style and calendar through the controls |
| [360-pixel panel](panel-narrow.png) | Short weekend dates staggered into two rows, wrapped file path and controls |

## Validation

Windows 11, standalone Node 26.11.1 / npm 11.20.0, working tree based on `929291f5a43ed96bbc440483ba863bf12ff108e2`:

- `npm run check`: lint/types, 297 unit/service/activation tests and 8 release-script tests passed.
- `npm run test:integration`: 21 tests passed on each of VS Code 1.120.0 and 1.141.0.
- `npm run test:package`: all 8 installed-production tests and content inspection passed. The production package excludes demos and these review files.
- Local test VSIX: `dist/copilot-pace-1.3.0.vsix`; SHA-256 `eb3babffcb5a75e0b3b2a1c6b13d20741f17f80c9a80c8c3a43fa9d9db686dcb`. This dirty working-tree package retains the pilot version; it is not a new release and does not replace the published 1.3.0 artifact.
- Regressions cover target values, UTC weekend dates, unknown budgets, Area-to-Line fallback, localized hover totals/explanations, journal selection across windows, rejected external paths and account disconnection during an open operation.
- Browser interaction checks exercised language, style and calendar controls. Real-file routing was tested with the extension-host service harness; no signed-in account or corporate-network acceptance was performed.

Remote CI validates the PR's pushed revision independently. The published 1.3.0 pilot and stable 1.2.1 retain their tags and assets.
