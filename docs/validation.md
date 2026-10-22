# Validation

Validation records identify the tested source, artifact, environment and scope. Local checks, CI and maintainer-reported account acceptance are recorded separately.

## Published 1.3.4 pilot: October 22, 2026

- Release: [v1.3.4](https://github.com/rublaman/copilot-pace/releases/tag/v1.3.4), GitHub prerelease without Latest and with `preview: true`. Annotated tag and `develop` release SHA: `c0b44430308aedde5e2d96e622091f53bb6efeec`. Stable 1.2.1 remains Latest; earlier assets and the unpublished 1.3.2 candidate are unchanged.
- [Develop CI](https://github.com/rublaman/copilot-pace/actions/runs/39802148342) and [tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/39802739272) passed both Node and VS Code matrices, production packaging and dependency audit.
- Downloaded the tagged draft VSIX and verified its clean build record, checksum, identity and production contents. All 8 installed-package tests passed again on Windows 11 / VS Code 1.141.0 without rebuilding.
- An isolated CLI upgrade from the published 1.3.3 VSIX retained settings and a synthetic observed journal byte for byte; only 1.3.4 remained active.
- All five packaged README images resolve at the tagged commit and match repository bytes, including the 1104 × 998 status-mode GIF with four three-second frames. The anonymous public VSIX download matched SHA-256 `e15dbd278cd2ed414a6ab613407f486d37e479e0a1f5d710991b00c5f90bb416`.
- Runtime source and dependencies are unchanged from 1.3.3. Real-account daily billing/corporate-policy acceptance remains pending; Marketplace publication is separate.

## 1.3.4 candidate preflight: October 22, 2026

- Prepared on `develop` baseline `dd04d423cb96a22786a5020a2d6054fdecbbb205` with version 1.3.4 and `preview: true`. Runtime source and dependencies are unchanged from 1.3.3.
- Windows 11, standalone Node 26.11.1 and npm 11.20.0: `npm ci`, `npm run check` (298 unit/service/activation tests and 8 release-script tests), `npm run test:integration` (21 tests on each of VS Code 1.120.0 and 1.141.0), `npm run test:package` (8 installed-package tests and production inspection) and `npm audit` passed; zero vulnerabilities.
- Local preflight VSIX SHA-256: `3421c828ad249fea1f0d50b18420b0f9b920a415f6b8011d67ccec0a25f64982`. This working-tree build is not the publication artifact; the clean tagged workflow artifact must pass its own downloaded-package checks.
- Local Markdown links/anchors and `git diff --check` passed. Real-account daily billing/corporate-policy acceptance remains pending.

## Status mode image quality: October 22, 2026

- Documentation baseline: `62f252ee0eec8b3d4629997bc9fcef75037a63b1`. Runtime, manifests and packaging are unchanged.
- Recaptured the native tooltip and indicators at larger VS Code zoom levels, with no raster enlargement of either crop. Used the same synthetic fixture and waited for each tooltip transition to finish.
- The usage-number region is pixel-identical across all four raw tooltip captures. Reviewed all four frames decoded from the final GIF at 640-pixel display width, with particular attention to percentages and credit totals; no pointer, halo or Codex controls appear.
- `status-modes-hd-dark.gif`: 1104 × 998 pixels, four three-second frames and a twelve-second infinite loop. The playback adjustment changes only the four frame delays; all other bytes and decoded pixels are unchanged. It uses a shared 256-color palette without dithering, and README/Marketplace link to its full resolution.
- Documentation-only validation covers local links, matching README/Marketplace content, tracked assets, GIF metadata and `git diff --check`. No repeat local host tests or release publication.

## Enlarged status mode documentation: October 22, 2026

- Based on `develop` at `88d6f290b746969a474696fdae17dc804d7e99cb`. Runtime, manifests and packaging are unchanged.
- README and Marketplace overview now give the four modes a dedicated Status bar and tooltip section, with matching text and image references adjusted for their locations.
- `status-modes-dark.gif` reuses the reviewed native crops from the documented October 22 capture session. Each frame labels and enlarges the actual status indicator above its native tooltip, so Default, Compact, Segmented bar and Dots are distinguishable.
- All four final frames were visually reviewed without the pointer, capture halo or Codex controls. FFprobe confirms 530 × 484 pixels, four frames and sixteen seconds; FFmpeg sets a four-second delay for every frame and an infinite loop.
- Documentation-only checks cover local links, README/Marketplace consistency, tracked assets and `git diff --check`. No repeat local host tests or new release publication.

## Published 1.3.3 pilot: October 22, 2026

- Release: [v1.3.3](https://github.com/rublaman/copilot-pace/releases/tag/v1.3.3), a GitHub prerelease without Latest and with `preview: true`. Stable 1.2.1 remains Latest.
- Source: `3c31bb7852f2a4bd1fa76e2daa225ce989656936` on `develop`, squash-merged through [PR #50](https://github.com/rublaman/copilot-pace/pull/50). The annotated tag identifies this commit. The local history sign-in visibility fix was integrated through [PR #49](https://github.com/rublaman/copilot-pace/pull/49); its 1.3.2 candidate remains an unpublished draft, with tag/assets unchanged.
- [Develop CI](https://github.com/rublaman/copilot-pace/actions/runs/39748390371) and the [tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/39748883768) passed Node 24.21.0 / 26.11.1, lint/types, 298 unit/service/activation tests, 8 release-script tests, 21 integration tests per VS Code 1.120.0 / 1.141.0, 8 installed-production tests, package inspection and dependency audit.
- Published [copilot-pace-1.3.3.vsix](https://github.com/rublaman/copilot-pace/releases/download/v1.3.3/copilot-pace-1.3.3.vsix): 98,546 bytes; SHA-256 `43a1b07647a66ab7a898497959f53b4f24f41a832ef34b78da33053ca9fbe1cc`. The attached checksum and clean build record match the tag commit and workflow.
- Downloaded the exact draft attachment, inspected package boundaries and passed all 8 installed-package tests again on Windows 11 / VS Code 1.141.0 without rebuilding. After publication, an anonymous public download matched the checksum.
- An isolated CLI update from the published 1.3.1 VSIX retained language, calendar, chart/status preferences, polling interval and a synthetic observed journal byte for byte. The extension list contained only `rubenblancomanzano.copilot-pace@1.3.3`.
- All five packaged README image URLs are pinned to the tagged SHA, resolve publicly and match repository bytes. Both new GIFs contain four three-second frames with a twelve-second infinite loop; all eight final frames were visually reviewed without the pointer, its halo or Codex controls. [Capture provenance](images/README.md) distinguishes the synthetic harness from real-account acceptance.
- Real-account daily billing/corporate-policy acceptance remains pending. No Marketplace publication was performed; the updated overview is included in the tested VSIX. Earlier published releases and the 1.3.2 draft retain their identities and assets.

## 1.3.3 pilot preflight: October 22, 2026

Clean source `6b8da3c2888ab0494e308588c779bc18f4977707` before squash merge, Windows 11 / standalone Node 26.11.1 / npm 11.20.0:

- `npm ci`, lint/types, 298 unit/service/activation tests and 8 release-script tests passed.
- 21 integration tests passed on each of VS Code 1.120.0 and 1.141.0; all 8 installed-production tests and package inspection passed.
- `npm audit`: zero vulnerabilities. Local Markdown links, README/Marketplace consistency, tracked assets and `git diff --check` passed.
- Local preflight artifact: `dist/copilot-pace-1.3.3.vsix`, SHA-256 `365f3800101f5248e09b8e1d563fca00dade64e923f97ccf9c58d1d2b2d0d242`. This pre-merge artifact was not published; the published tag artifact is recorded above.

## 1.3.2 pilot preflight: October 22, 2026

Working tree based on `09e86a89612e788b3d75ed782b1b8713cd80eb7a`, version `1.3.2` with `preview: true`, Windows 11 / standalone Node 26.11.1 / npm 11.20.0:

- `npm ci`, lint/types, 298 unit/service/activation tests and 8 release-script tests passed.
- 21 integration tests passed on each of VS Code 1.120.0 and 1.141.0; all 8 installed-production tests and package inspection passed.
- Regression coverage checks hidden file controls without an account, sign-in/disconnect transitions in both languages, and disabled file access in the installed production extension without a session.
- `npm audit`: zero vulnerabilities. `git diff --check` passed.
- Local preflight artifact: `dist/copilot-pace-1.3.2.vsix`, SHA-256 `d13bed42fe5ffafbae9c1db0edba5809edbc36d2122ee2400eb738a062b5dd57`. This working-tree package is not the publication artifact; the final tag workflow must retain its clean source SHA, VSIX, checksum and build record.
- Real-account daily billing/corporate-policy acceptance remains pending.

## Published 1.3.1 pilot: October 21, 2026

- Release: [v1.3.1](https://github.com/rublaman/copilot-pace/releases/tag/v1.3.1), a GitHub prerelease without Latest and with `preview: true`. Stable 1.2.1 remains Latest.
- Source: `9fbac4c9bf3d34208bd2d85564bf4c0dc32c5675` on `develop`, squash-merged through [PR #47](https://github.com/rublaman/copilot-pace/pull/47). The annotated tag identifies this commit.
- [Develop CI](https://github.com/rublaman/copilot-pace/actions/runs/39667599935) and the [tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/39668152432) passed Node 24.21.0 / 26.11.1, lint/types, 297 unit/service/activation tests, 8 release-script tests, 21 integration tests per VS Code 1.120.0 / 1.141.0, 8 installed-production tests, package inspection and dependency audit.
- Published [copilot-pace-1.3.1.vsix](https://github.com/rublaman/copilot-pace/releases/download/v1.3.1/copilot-pace-1.3.1.vsix): 98,204 bytes; SHA-256 `2f8b9fdf45159e35c2dd9aca80d45e8919a4504310b9ab75f8ae7d6ba485d958`. The attached checksum and clean build record match the tag commit and workflow.
- Downloaded the exact draft attachment, inspected identity/content boundaries and passed all 8 installed-package tests again on Windows 11 / VS Code 1.141.0 without rebuilding. After publication, an anonymous public download matched the checksum.
- An isolated CLI update from the published 1.3.0 VSIX to this exact artifact retained language, calendar, chart/status preferences, polling interval and a synthetic observed journal byte for byte. The extension list contained only `rubenblancomanzano.copilot-pace@1.3.1`. This checks update retention; earlier unit/integration tests cover saved Area-to-Line resolution.
- The [mid-month review](reviews/chart-targets/README.md) records synthetic visual checks. Real-account daily billing/corporate-policy acceptance remains pending; no new account/network acceptance is inferred from this pilot publication.
- No Marketplace publication was performed. Earlier releases, tags and assets retain their identities.

## 1.3.1 pilot preflight: October 21, 2026

Working tree based on `132df1d7a6e84edae7aa1401b047815ef6c57df6`, prepared in PR #47 with version `1.3.1` and `preview: true`, Windows 11 / standalone Node 26.11.1 / npm 11.20.0:

- `npm ci`, lint/types, 297 unit/service/activation tests and 8 release-script tests passed.
- 21 integration tests passed on each of VS Code 1.120.0 and 1.141.0; all 8 installed-production tests and package inspection passed.
- `npm audit`: zero vulnerabilities. `git diff --check` passed.
- Local preflight artifact: `dist/copilot-pace-1.3.1.vsix`, SHA-256 `ca19bdba4dea5a048456b89e91a3e9a2b0c0cac5c15dd03078ec5b019e5e4ba5`. This dirty working-tree package is not the publication artifact. The final annotated tag workflow must retain and validate its clean source SHA, VSIX, checksum and build record.
- The [mid-month review](reviews/chart-targets/README.md) covers both chart styles, calendars, metrics and local/reported fixtures, plus the file/location controls. Real-account daily billing/corporate-policy acceptance remains pending.

## Published 1.3.0 pilot: October 21, 2026

- Release: [v1.3.0](https://github.com/rublaman/copilot-pace/releases/tag/v1.3.0), a GitHub prerelease without Latest and with `preview: true`. Stable 1.2.1 remains Latest.
- Source: `929291f5a43ed96bbc440483ba863bf12ff108e2` on `develop`, squash-merged through [PR #45](https://github.com/rublaman/copilot-pace/pull/45). The annotated tag identifies this commit.
- [Develop CI](https://github.com/rublaman/copilot-pace/actions/runs/39630142093) and the [tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/39630759375) passed Node 24.21.0 / 26.11.1, lint/types, 293 unit/service/activation tests, 8 release-script tests, 21 integration tests per VS Code 1.120.0 / 1.141.0, 8 installed-production tests, package inspection and dependency audit.
- Published [copilot-pace-1.3.0.vsix](https://github.com/rublaman/copilot-pace/releases/download/v1.3.0/copilot-pace-1.3.0.vsix): 96,019 bytes; SHA-256 `7a1571840f28b6221ec63a8a3a7348d70a211b878894a548a35a099f276876df`. The attached checksum and clean build record match the tag commit and workflow.
- Downloaded the exact draft attachment, inspected its identity/content boundaries and passed all 8 installed-package tests again on Windows 11 / VS Code 1.141.0 without rebuilding. After publication, an anonymous public download matched the same checksum.
- Earlier synthetic visual checks cover 12 local/API, daily/cumulative and area/line/column combinations. Real-account daily billing and corporate-policy acceptance remain pending. Acceptance of the older quota runtime does not establish acceptance of this billing integration.
- No Marketplace publication was performed. Earlier releases, tags and assets retain their identities.

## 1.3.0 pilot preflight: October 21, 2026

Working tree based on `16d46251717fca17d42e54086e311c2330d2f8b8`, prepared in PR #45 with version `1.3.0` and `preview: true`, Windows 11 / standalone Node 26.11.1 / npm 11.20.0:

- `npm ci`, lint/types, 293 unit/service/activation tests and 8 release-script tests passed.
- 21 integration tests passed on each of VS Code 1.120.0 and 1.141.0; all 8 installed-production tests and package inspection passed.
- `npm audit`: zero vulnerabilities. `git diff --check` passed.
- Local preflight artifact: `dist/copilot-pace-1.3.0.vsix`, SHA-256 `c337c4045ca130df7d3791d93efee9dca751eb9e5be431333a01f79b174f0a14`. This dirty working-tree build is not the publication artifact. The final annotated tag workflow must retain and validate its own clean SHA, VSIX, checksum and build record.
- Earlier illustrative chart reviews cover all local/API, daily/cumulative and area/line/column combinations. Actual billing access and corporate-policy acceptance remain pending; publication is an explicitly labeled pilot.

## Forecast, history and status styles: October 21, 2026

Local checks on `feature/usage-history-status-styles`, based on `develop` at `ecf9b2ef06dd4d7c55d807b837c0a23bbc5bf1f6`:

- Windows 11, standalone Node 26.11.1 and npm 11.20.0.
- `npm run check`: lint/types, 245 unit/service/activation tests and 8 release-script regressions passed. New coverage includes UTC weekday exhaustion, observation-anchored forecasts, history restoration/concurrent writers/account isolation, missing intervals/corrections, and validated status-style messages.
- `npm run test:integration`: 19 tests passed on each of VS Code 1.120.0 and 1.141.0, including actual status item updates and persisted appearance settings.
- `npm run test:package`: 8 installed-production tests passed in an isolated VS Code 1.141.0 profile; package contents and demo exclusion were inspected.
- Local candidate after grouping customization controls: `dist/copilot-pace-1.2.1.vsix`, SHA-256 `27713ba05ada73c22f2d8f97dd09087eb7ba952406dbf7bcd13b4438138a60a5`. This working-tree build retains the existing manifest version and is not a published release artifact.
- `npm audit`: zero vulnerabilities. Documentation links and `git diff --check` passed.
- Browser preview: the generated panel was inspected with illustrative observations in English/dark and Spanish/light at a 360-pixel content width. Language, weekday and appearance controls were exercised. This preview does not validate actual GitHub quotas or constitute real-account acceptance.
- The layout follow-up groups language and status appearance in a divided Customization / Personalización section immediately below the chart. Code checks, 19 integration tests on VS Code 1.141.0 and all 8 package tests passed again; both controls and section labels were checked in English and Spanish in the dark preview. The local 1.120.0 rerun was blocked at startup by the editor's `vscode-updating` mutex, including a retry, so its earlier result above applies to the preceding layout. Remote CI checks the follow-up revision independently.

Remote CI belongs to the feature PR's exact head revision. No new personal/corporate account or network acceptance was performed for these features; the previous distributed 1.2.1 release and its artifacts remain unchanged.

### Chart styles follow-up

Local Windows checks on the working tree based on `01c91fa2494ab36e12f77f5ad99e8e7fa86b961a`, using standalone Node 26.11.1 / npm 11.20.0:

- `npm run check`: lint/types, 246 unit/service/activation tests and 8 release-script regressions passed.
- `npm run test:integration`: 20 tests passed on each of VS Code 1.120.0 and 1.141.0. The saved chart choice updates without refreshing quota; unsupported panel values are rejected. Both editor hosts started successfully, resolving the earlier update-mutex block.
- `npm run test:package`: all 8 installed-production tests passed; package identity, contents and demo exclusion were checked.
- The generated panel was inspected with illustrative observations in dark and light themes. Gradient area, line and columns preserve missing intervals; columns use the last cumulative observation per UTC day. The Spanish Customization selector was exercised in the browser preview. These checks do not validate real-account quotas or constitute account acceptance.
- Final local working-tree candidate: `dist/copilot-pace-1.2.1.vsix`, SHA-256 `526ab61a93cf8b3c700b3fed3e9ddb13061ee3f0ab1a08d4b295679e86d5cddb`. This retains the existing manifest version and is not a published release artifact.
- `npm audit`: zero vulnerabilities. Local Markdown link targets and `git diff --check` passed. Remote CI validates the pushed PR head separately.

### Daily billing and observed fallback test build

Local uncommitted working tree based on `5c6b594a362dcfd8dfccb7f69df924e52ff99ef6`, October 21, 2026, Windows 11 / standalone Node 26.11.1 / npm 11.20.0:

- `npm run check`: lint/types, 285 unit/service/activation tests and 8 release-script tests passed. New fixtures cover personal, Business and Enterprise report routes, gross credit quantities, permission failures, missing days, account identity, cancellation, late responses, rate limits, daily deltas and chart metric controls.
- `npm run test:integration`: 21 tests passed on each of VS Code 1.120.0 and 1.141.0.
- `npm run test:package`: all 8 installed-production tests passed; package contents and demo exclusion checked.
- Tested VSIX: `dist/copilot-pace-1.2.1.vsix`, SHA-256 `fbb438036dafa12cd91fafcf2f2623cb2a12bf003e9db8000b42df78b1a5b671`. The user test copy at `dist/test/copilot-pace-1.2.1-daily-test.vsix` has the same bytes and checksum. Both retain the existing manifest version; this is a local test build, not a published release.
- Dark browser preview inspected all three daily chart styles with illustrative reported days, a missing day and a partial ongoing day. These fixtures do not validate actual billing access or corporate policies. Real-account daily billing acceptance remains pending.

### Chart budget colors follow-up

On the same local working tree and environment, after adding chart budget colors:

- `npm run check`: lint/types, 293 unit/service/activation tests and 8 release-script tests passed. Coverage includes all three styles with reported/local daily totals, exact-budget equality, cumulative pace, weekend budgets and neutral unknown budgets. SVG clip regions preserve disconnected paths and color crossings.
- `npm run test:integration`: 21 tests passed on each of VS Code 1.120.0 and 1.141.0. All 8 installed-production tests and package inspection passed again.
- Latest local test VSIX: `dist/copilot-pace-1.2.1.vsix`, SHA-256 `8fe169ab3c551ee5a6dd0e56e982861c64cdbc1705de79ca0b13e4b3db935df3`. The same bytes replace the earlier user test copy at `dist/test/copilot-pace-1.2.1-daily-test.vsix`. No release version or published artifact was changed.
- Generated panel inspected in a dark browser preview for local/API simulations, daily/cumulative metrics and area/line/column styles: 12 chart combinations. The fixture has a 6,000-credit budget, 4,855 cumulative credits, local recording from October 8 and offline days on October 14 and 18. Both sources exercise green/red daily values; the cumulative observations cross the budget reference. API responses are simulated, not real-account acceptance.

## GitHub.com and GHE acceptance: October 19, 2026

- Maintainer report: the distributed 1.2.0 pilot was validated in both environments and works correctly. This is real-environment acceptance reported by the maintainer, separate from the earlier synthetic connection fixtures.
- Accepted pilot: [v1.2.0](https://github.com/rublaman/copilot-pace/releases/tag/v1.2.0), commit `1ffd75220eecfecdc6310880c3667f4efd62e073`, VSIX SHA-256 `4e4a23aa7bd4ee39c6f2d37b07c49e5574c35639dba9077c70f2ea22d6027ccf`.
- Scope: GitHub.com and the maintainer's corporate GHE environment. Exact editor versions and individual account-switching, cancellation, proxy/certificate and quota-comparison checklist results were not separately supplied. Do not infer universal GitHub Enterprise Server compatibility or record unreported individual checks.
- Stable 1.2.1 retains the pilot's runtime and changes release metadata and documentation. Its final SHA and artifact validation are recorded in the [1.2.1 release record](https://github.com/rublaman/copilot-pace/releases/tag/v1.2.1).

Earlier records describe the state at the date of each check, including any publication or validation steps then pending.

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

These local Windows checks did not record a full commit SHA and artifact checksum, so they cannot identify an approved release artifact.

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

The [chart targets and history access review](reviews/chart-targets/README.md) records the October 21 follow-up, local test artifact and mid-month screenshots for Line/Columns, both calendars, Daily/Cumulative and reported/local fixtures.

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
