# Validation

**The maintainer confirmed that the 1.2.0 pilot works correctly in both GitHub.com and corporate GitHub Enterprise (GHE) environments on October 19, 2026, and requested stable publication. Version 1.2.1 retains that runtime behavior and updates release metadata and documentation.**

## GitHub.com and GHE acceptance: October 19, 2026

- Maintainer report: the distributed 1.2.0 pilot was validated in both environments and works correctly. This is real-environment acceptance reported by the maintainer, separate from the earlier synthetic connection fixtures.
- Accepted pilot: [v1.2.0](https://github.com/rublaman/copilot-pace/releases/tag/v1.2.0), commit `1ffd75220eecfecdc6310880c3667f4efd62e073`, VSIX SHA-256 `4e4a23aa7bd4ee39c6f2d37b07c49e5574c35639dba9077c70f2ea22d6027ccf`.
- Scope: GitHub.com and the maintainer's corporate GHE environment. Exact editor versions and individual account-switching, cancellation, proxy/certificate and quota-comparison checklist results were not separately supplied. Do not infer universal GitHub Enterprise Server compatibility or record unreported individual checks.
- Stable 1.2.1 changes version/preview metadata and documentation only; no authentication, transport, service or quota-normalization logic changes. Its final tagged VSIX must pass separate CI, content/checksum inspection and installed-package tests. Final SHA and artifact evidence belong in the [1.2.1 release record](https://github.com/rublaman/copilot-pace/releases/tag/v1.2.1).

Earlier evidence below is historical and retains the scope recorded at the time.

## Stable 1.0.0: October 15, 2026

- Release: [v1.0.0](https://github.com/rublaman/copilot-pace/releases/tag/v1.0.0), stable with Latest and `preview: false`.
- Commit: `9248a36bf329f11e12a18cfe1d9786c639accf85`, on `main` after a merge-commit promotion from `develop`.
- Evidence: [main CI](https://github.com/rublaman/copilot-pace/actions/runs/38777435380), [tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/38778032170), and the release's `build-info.json` / `SHA256SUMS.txt`.
- Local preflight: Windows 11, standalone Node 26.11.1 / npm 11.20.0; lint/types, 133 unit/service tests, 8 release-script tests, 16 integration tests each on VS Code 1.120.0 / 1.141.0, and 6 installed-package tests passed. `npm audit` reported zero vulnerabilities.
- Final file: `copilot-pace-1.0.0.vsix`; SHA-256 `6bc0c7f1d76a69ab58c9e07935f811b4ba58733359e1cb14e401e9c4239bfb4d`.
- Downloaded artifact: all 6 installed-package tests passed on Windows 11 / VS Code 1.141.0 without rebuilding. Package identity, stable flag, content boundaries, demo exclusion and five commit-pinned README images were verified.
- Upgrade: installing the published 0.2.3 VSIX and then the final 1.0.0 VSIX in the same isolated profile retained the calendar and polling settings. The active extension list contained only `rubenblancomanzano.copilot-pace@1.0.0` for Copilot Pace.
- Publication: the release attachments matched the tested Actions files byte for byte; a subsequent anonymous public VSIX download matched the tested checksum.

The maintainer's manual confirmation covers GitHub connection, quota and renewal comparison, refresh, details, calendar modes, light/dark themes and data after restarting VS Code on 0.2.3. See the [acceptance record and its limits](RELEASING.md#maintainer-acceptance-023). Final-artifact automation does not imply a new real-account test. Marketplace upload, store installation verification and the subsequent branch synchronization remain pending.

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

The [account switching and sign-out review](security-review.md) records the October 20 source review, regression scenarios and remaining manual account/network checks.

- `npm run check`: lint, strict types, normalization, UTC cycles, pace thresholds, demos, service state, simulated transport, presentation escaping and release-script regressions.
- `npm run test:integration`: actual VS Code hosts; activation, commands, status item, Markdown trust, setting migration, webview initialization, allowed messages and source isolation.
- `npm run test:package`: production packaging, isolated installation, demo exclusion, ignored legacy settings, webview initialization, package identity/content inspection and checksum generation.
- `npm audit`: dependency advisories. It does not assess account compatibility.

Calendar regressions include partial days, weekdays, year rollover, leap years and month changes without restarting. Integration checks verify alignment/priority; visual proximity to Copilot depends on other installed extensions.

## Demo walkthrough

Use F5 and the Extension Development Host described in [CONTRIBUTING.md](../CONTRIBUTING.md). Production VSIX packages exclude the demo commands.

1. Run **Copilot Pace: Try Demo Scenarios**. Confirm `Demo` appears and the UI defaults to English. Use **Spanish** in the detail panel: check Spanish (Spain) labels, comma decimals, accessible labels and a live hover update. Confirm no language action appears in the hover. The panel button becomes **Inglés**. Restart with Spanish selected to check persistence, then switch back to English. Usage, calendar and status color must be preserved.
2. Inspect the hover and detail panel. Open details twice to confirm the panel is reused.
3. Check the 10,000 / 3,900 credit scenarios. Pace labels depend on the current UTC date. Verify green for Comfortable, yellow for On track and red for Over pace in the status bar, native hover and detail panel. Switch between Dark Modern, Light Modern, Dark High Contrast and Light High Contrast without reopening the panel; check the state label, percentage, usage bar, forecast, logo and hover check alignment. Missing or stale data must clear the pace colors.
4. Switch **Every day / Mon–Fri** and check allowance, cycle progress and projection.
5. Compare the budget scenarios: usage remains 1,950 while the percentage changes from 50% to 19.5%.
6. Try exhausted, unknown-budget, incomplete, disconnected, timeout and HTTP error states. Check the 429 cooldown and its reset after changing scenarios.
7. Run **Copilot Pace: Use GitHub**. Demo values disappear; without a session, the status becomes **Connect GitHub**.

## October 16: local pace-color validation

Uncommitted development working tree based on `94c708ec092581b4a8811d53c9252c3675c2a8a9`, on Windows 11 with standalone Node 26.11.1 / npm 11.20.0:

- `npm run check`: lint/types, 149 unit/service tests and 8 release-script regressions passed.
- `npm run test:integration`: 17 tests passed on each of VS Code 1.120.0 and 1.141.0, including colored native hover output, restricted commands, language changes and neutral recovery states.
- Manual desktop review on VS Code 1.142.0: all three demo pace states checked in Dark Modern, Light Modern, Dark High Contrast and Light High Contrast. Both the open detail panel and visible native hover followed live theme and scenario changes. Status text, percentage, usage bar and forecast used the expected state color; the native check stayed aligned.
- The light high-contrast review found an invisible panel logo. A theme-specific override was added, the host was rebuilt/restarted, and the logo was visibly verified. An incomplete response cleared the panel's pace colors. The isolated demo profile's original settings were restored byte for byte afterward.
- These are synthetic UI checks, not a new real-account acceptance or release-artifact validation. At the time of that UI review, the installed-package suite had not been rerun; pilot packaging is validated separately.

## 1.1.0 pilot preparation

Local preflight on Windows 11 / standalone Node 26.11.1 / npm 11.20.0 passed `npm ci`, lint/types, 149 unit/service tests, 8 release-script regressions, 17 integration tests on each of VS Code 1.120.0 and 1.141.0, 7 installed-production-VSIX tests and package inspection. `npm audit` reported zero vulnerabilities. English hover calendar labels are Mon–Sun / Mon–Fr; Spanish keeps the explicit day ranges.

The locally generated preflight VSIX identifies an uncommitted working tree and is not the publication artifact. The release workflow must validate the merged/tagged commit with both pinned Node versions and both VS Code versions, then retain the final VSIX, checksum, commit and run URL in the GitHub prerelease. Install and test that downloaded artifact without rebuilding before publishing. Real-account acceptance of the changed UI and corporate-network validation remain pending for this pilot.

## Stable 1.1.2 — October 16, 2026

- Stable GitHub release: [v1.1.2](https://github.com/rublaman/copilot-pace/releases/tag/v1.1.2), `preview: false`, Latest. Annotated tag points to `e63792f5e4e0949d13ec20a765b793098bbf09c0` on `main`.
- [Main CI](https://github.com/rublaman/copilot-pace/actions/runs/38939301667) and the [tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/38940066771) passed both pinned Node versions and both VS Code versions, package inspection and dependency audit. Local validation passed `npm ci`, `npm run check`, 17 integration tests per editor version, 7 installed-package tests and `npm audit` with zero vulnerabilities.
- Tested and published [copilot-pace-1.1.2.vsix](https://github.com/rublaman/copilot-pace/releases/download/v1.1.2/copilot-pace-1.1.2.vsix) (82,864 bytes); SHA-256: `43c99b3cc0cd6c73a7572dd5435a0c2f7adbe29facb238d507b2203cf0e3f23c`. The checksum and build record match the tag workflow artifact. The tagged VSIX passed all 7 installed-package tests without rebuilding, and an anonymous public download matched the tested hash.
- Reviewed the packaged README: all four GIF links point to commit `e63792f5e4e0949d13ec20a765b793098bbf09c0`, resolve publicly and return bytes matching the committed GIF files.
- The release changes documentation and version metadata only; runtime source is unchanged from 1.1.1. It adds no new real-account or corporate-network acceptance.
- The release was prepared in [PR #28](https://github.com/rublaman/copilot-pace/pull/28), promoted through [PR #29](https://github.com/rublaman/copilot-pace/pull/29), and synchronized back through [PR #30](https://github.com/rublaman/copilot-pace/pull/30), preserving shared branch history. Prior release tags and assets remain unchanged.
- Marketplace upload of this same VSIX and isolated store verification remain pending.

## Stable 1.1.1 — October 16, 2026

- Stable GitHub release: [v1.1.1](https://github.com/rublaman/copilot-pace/releases/tag/v1.1.1), `preview: false`, no longer Latest. Annotated tag points to `ae4de23a0b8f032ec438f85cda75cb6e77bd447a` on `main`.
- [Main CI](https://github.com/rublaman/copilot-pace/actions/runs/38900515937) and the [tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/38900964228) passed both pinned Node versions and both VS Code versions, package inspection and dependency audit. Local validation passed `npm ci`, lint/types, 149 unit/service tests, 8 release-script tests, 17 integration tests per editor version, 7 installed-package tests and `npm audit` with zero vulnerabilities.
- Tested and published [copilot-pace-1.1.1.vsix](https://github.com/rublaman/copilot-pace/releases/download/v1.1.1/copilot-pace-1.1.1.vsix); SHA-256: `0d88f21d977824eddd9cd656cf26d5be6b44e192bf57e3686e07bf23cadb60c6`. The checksum and build record match the tag workflow artifact. The exact downloaded VSIX passed all 7 installed-package tests on Windows 11 / VS Code 1.141.0 without rebuilding, and an anonymous public download matched.
- The maintainer reviewed the visual presentation in the published 1.1.0 pilot and approved stable promotion. This records visual approval; new real-account flow, quota comparison, reconnection and corporate-network checks were not recorded for the changed UI.
- The stable release was prepared in [PR #23](https://github.com/rublaman/copilot-pace/pull/23), promoted through [PR #24](https://github.com/rublaman/copilot-pace/pull/24), and synchronized back through [PR #25](https://github.com/rublaman/copilot-pace/pull/25), preserving shared branch history. The 1.1.0 pilot and prior release tags/assets remain unchanged.
- Marketplace upload of this same VSIX and isolated store verification remain pending.

## Release evidence

For each candidate, retain its full commit SHA, tag, CI URL, tested VSIX and SHA-256. Complete the [real account acceptance checks](RELEASING.md#real-account-acceptance) on that artifact before stable publication. Store anonymized results without credentials or complete responses.

### Stable 1.0.1 — October 15, 2026

- Commit: `12d1d03cc893eec706df212930af5bece07b2609`; annotated tag: `v1.0.1`.
- [Main CI](https://github.com/rublaman/copilot-pace/actions/runs/38786619309) and the [tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/38787282587) passed both pinned Node versions and both VS Code versions. Lint/types, 133 unit/service tests, 8 release-script tests, 16 integration tests per editor version, 6 package tests and the dependency audit passed.
- Tested and published [copilot-pace-1.0.1.vsix](https://github.com/rublaman/copilot-pace/releases/download/v1.0.1/copilot-pace-1.0.1.vsix); SHA-256: `30ff515ce5b5f2ab42c3efb73500597f7f0c5c59a5e6e3b437129bb24b3f8630`.
- The release's VSIX, checksum and build record match the tag workflow artifact byte for byte. The downloaded VSIX passed all six package tests on Windows 11 / VS Code 1.141.0 without rebuilding. An update from the original published 1.0.0 VSIX retained the calendar and refresh settings. Packaged categories `Visualization` and `AI`, the removed README section and all five README image URLs were checked.
- An anonymous public GitHub download matched the tested SHA-256. All earlier release asset identities/digests and annotated tags remain unchanged. The GitHub Release is stable and Latest; main-to-develop synchronization completed through [PR #20](https://github.com/rublaman/copilot-pace/pull/20).
- Runtime source and dependencies are unchanged from 1.0.0. The production JavaScript also matches after normalizing the build-time version value. Prior maintainer acceptance of the unchanged runtime is distinct from these automated checks; no new real-account or corporate-network acceptance is claimed.
- Marketplace upload of this same VSIX and store installation/package verification remain pending.
