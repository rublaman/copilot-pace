# Validation

**Synthetic tests passed in prior local builds; real account and corporate network validation is pending.**

## Historical local records

The previous validation notes reported these Windows results. They did not record a full commit SHA and SHA-256, so they are development records rather than release approval.

| Version | Date | Unit/service | Integration per VS Code version | Installed VSIX |
| --- | --- | --- | --- | --- |
| 0.1.0 | 2026-10-12 | 69 | 11 | 11 |
| 0.1.1 | 2026-10-12 | 75 | 13 | 13 |
| 0.1.2 | 2026-10-12 | 81 | 14 | 14 |
| 0.1.3 | 2026-10-13 | 84 | 14 | 6 |

These records used standalone Node 26.11.1, npm 11.20.0 and VS Code 1.120.0 / 1.141.0 in isolated profiles. The 0.1.2 dark-theme review checked red status text, neutral panel controls and current-date estimates. The 0.1.3 record checked packaged logo bytes and version.

Remote CI has successful runs for earlier feature commits. That history does not validate later local edits, merge commits or a release candidate.

## October 13 workflow review

Local checks passed on the working tree based on `2166526ec94c279d29d62aea4e1d944f2225aef6`:

- Lint/types, 101 unit/service tests and 8 release-script regressions.
- 14 integration tests on each VS Code version and 6 installed-VSIX tests.
- Package identity/content inspection, `npm audit` (zero vulnerabilities), and workflow validation with actionlint 1.7.12.

Tested file: `dist/copilot-pace-0.1.3.vsix`. SHA-256: `cffc2436d81330e836a7665c3e10e2ededb81523c8ed2a64fefb5eac92c1a334`. Its build record marks the checkout dirty; these local results do not approve a tagged release. The new workflows still require remote execution after integration.

## Automated coverage

- `npm run check`: lint, strict types, normalization, UTC cycles, pace thresholds, demos, service state, simulated transport, presentation escaping and release-script regressions.
- `npm run test:integration`: actual VS Code hosts; activation, commands, status item, Markdown trust, setting migration, webview initialization, allowed messages and source isolation.
- `npm run test:package`: production packaging, isolated installation, demo exclusion, ignored legacy settings, webview initialization, package identity/content inspection and checksum generation.
- `npm audit`: dependency advisories. It does not assess account compatibility.

Calendar regressions include partial days, weekdays, year rollover, leap years and month changes without restarting. Integration checks verify alignment/priority; visual proximity to Copilot depends on other installed extensions.

## Demo walkthrough

Use F5 and the Extension Development Host described in [CONTRIBUTING.md](../CONTRIBUTING.md). Production VSIX packages exclude the demo commands.

1. Run **Copilot Pace: Try Demo Scenarios**. Confirm `Demo` appears and the UI is English.
2. Inspect the hover and detail panel. Open details twice to confirm the panel is reused.
3. Check the 10,000 / 3,900 credit scenarios. Pace labels depend on the current UTC date; the panel stays neutral.
4. Switch **Every day / Mon–Fri** and check allowance, cycle progress and projection.
5. Compare the budget scenarios: usage remains 1,950 while the percentage changes from 50% to 19.5%.
6. Try exhausted, unknown-budget, incomplete, disconnected, timeout and HTTP error states. Check the 429 cooldown and its reset after changing scenarios.
7. Run **Copilot Pace: Use GitHub**. Demo values disappear; without a session, the status becomes **Connect GitHub**.

## Release evidence

For each candidate, retain its full commit SHA, tag, CI URL, tested VSIX and SHA-256. Complete the [real account acceptance checks](RELEASING.md#real-account-acceptance) on that artifact before stable publication. Store anonymized results without credentials or complete responses.
