# Releases

This guide defines version preparation, validation and distribution. Read the workflows and scripts before using it; documentation alone does not publish a release.

## Chart refinement pilot 1.3.1

Published on October 21, 2026 as [v1.3.1](https://github.com/rublaman/copilot-pace/releases/tag/v1.3.1), a GitHub prerelease without Latest. [PR #47](https://github.com/rublaman/copilot-pace/pull/47) was squash-merged into `develop` at `9fbac4c9bf3d34208bd2d85564bf4c0dc32c5675`; the annotated tag identifies that commit. The manifest and lockfile use `1.3.1` with `preview: true`. Stable 1.2.1 remains Latest; the published 1.3.0 pilot and earlier assets are unchanged.

The follow-up labels monthly/daily chart targets and weekend transitions, keeps Line and Columns with Area-to-Line fallback, explains the renewal forecast and adds total used credits to the hover. Customization offers Show location and Open file for the active account's most recent observed journal; file paths stay in the extension host. The [visual review](reviews/chart-targets/README.md) records the synthetic mid-month scenarios. Real-account daily billing/corporate-policy acceptance remains pending.

[Develop CI](https://github.com/rublaman/copilot-pace/actions/runs/39667599935) and the [tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/39668152432) passed. The exact attached `copilot-pace-1.3.1.vsix` passed package inspection and all 8 installed-package tests on Windows 11 / VS Code 1.141.0 without rebuilding. An isolated upgrade from the published 1.3.0 VSIX retained preferences and a synthetic observed journal unchanged. Its anonymous public download matched SHA-256 `2f8b9fdf45159e35c2dd9aca80d45e8919a4504310b9ab75f8ae7d6ba485d958`. The release retains that VSIX, `SHA256SUMS.txt` and `build-info.json`; Marketplace publication remains separate.

## Usage history pilot 1.3.0

Published on October 21, 2026 as [v1.3.0](https://github.com/rublaman/copilot-pace/releases/tag/v1.3.0), a GitHub prerelease without Latest. [PR #45](https://github.com/rublaman/copilot-pace/pull/45) was squash-merged into `develop` at `929291f5a43ed96bbc440483ba863bf12ff108e2`; the annotated tag identifies that commit. The manifest and lockfile use `1.3.0` with `preview: true`. Stable 1.2.1 remains Latest.

The pilot adds exhaustion/excess forecasts, account-separated local history, daily billing retrieval with automatic observed fallback, selectable chart/status styles and green/red budget-pace colors. Billing access depends on account permissions and policy. Synthetic checks and illustrative chart reviews do not establish real-account billing acceptance; personal/corporate billing validation remains pending for this pilot.

[Develop CI](https://github.com/rublaman/copilot-pace/actions/runs/39630142093) and the [tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/39630759375) passed. The exact attached `copilot-pace-1.3.0.vsix` passed package inspection and all 8 installed-package tests on Windows 11 / VS Code 1.141.0 without rebuilding. Its anonymous public download matched SHA-256 `7a1571840f28b6221ec63a8a3a7348d70a211b878894a548a35a099f276876df`. The release retains that VSIX, `SHA256SUMS.txt` and `build-info.json`. Earlier tags/assets are unchanged; Marketplace publication remains separate.

## Stable 1.2.1

Version 1.2.1 promotes the accepted 1.2.0 runtime to stable with `preview: false` and updated GitHub.com/GHE setup documentation. The [acceptance record](validation.md#githubcom-and-ghe-acceptance-october-19-2026) identifies the tested pilot, environments and reported checks.

Prepared through [PR #41](https://github.com/rublaman/copilot-pace/pull/41) to `develop` and promoted to `main` through [PR #42](https://github.com/rublaman/copilot-pace/pull/42) with a merge commit at `733381fcc2557e46fc08d4c2a63df01cfe3a74a2`. The annotated `v1.2.1` release is stable with Latest. Its [release record](https://github.com/rublaman/copilot-pace/releases/tag/v1.2.1), attached `build-info.json` and `SHA256SUMS.txt` retain the exact final tagged CI run, clean SHA and tested VSIX checksum. Publish and download the tested artifact unchanged; Marketplace upload/store verification remain separate. The published 1.2.0 pilot and previous tags/assets are unchanged.

## Enterprise pilot 1.2.0

Feature [#39](https://github.com/rublaman/copilot-pace/issues/39) was integrated through [PR #40](https://github.com/rublaman/copilot-pace/pull/40) and published as [v1.2.0](https://github.com/rublaman/copilot-pace/releases/tag/v1.2.0), a prerelease without Latest, at `1ffd75220eecfecdc6310880c3667f4efd62e073`. Its VSIX SHA-256 is `4e4a23aa7bd4ee39c6f2d37b07c49e5574c35639dba9077c70f2ea22d6027ccf`. The [tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/39263413327) passed; the downloaded artifact passed all 8 installed-package tests without rebuilding and its anonymous public download matched. The subsequent maintainer acceptance above supersedes the pilot's original pending-corporate-validation status.

## Current state

Reviewed on October 21, 2026:

- Stable: [1.2.1](https://github.com/rublaman/copilot-pace/releases/tag/v1.2.1) from `main`, `preview: false`, publisher `rubenblancomanzano`. The [main CI](https://github.com/rublaman/copilot-pace/actions/runs/39267811489) and tagged release artifact validation identify the tested source and package. See the release's attached build record/checksum for artifact provenance.
- Pilot: [1.3.1](https://github.com/rublaman/copilot-pace/releases/tag/v1.3.1) from `develop`, `preview: true`, without Latest. The artifact and remaining billing acceptance are recorded above; 1.3.0 remains available with its original assets.
- Account support: GitHub.com personal/Business and GitHub Enterprise (GHE), with maintainer-reported real-environment acceptance of the 1.2.0 pilot. The stable runtime retains that behavior. The README contains account/setup guidance instead of test-environment history.
- [PR #43](https://github.com/rublaman/copilot-pace/pull/43) synchronized `main` back into `develop` with a merge commit on October 19.
- Marketplace upload and store verification of the exact tested 1.2.1 VSIX remain pending and separate from GitHub publication. Published pilots and older assets are retained.

## Previous stable release history

Historical release evidence through October 16, 2026:

- Public repository: `rublaman/copilot-pace`; default branch: `main`. There is no `master` branch.
- [Copilot Pace 1.1.3](https://github.com/rublaman/copilot-pace/releases/tag/v1.1.3) was published from `main` as a stable GitHub Release with `preview: false`, using publisher `rubenblancomanzano`; it is no longer Latest. Annotated tag `v1.1.3` identifies validated commit `04fe7d7c1e67664d605c324f5cbb82e916694808`.
- Preparation PR [#33](https://github.com/rublaman/copilot-pace/pull/33) was squash-merged into `develop`; promotion PR [#34](https://github.com/rublaman/copilot-pace/pull/34) merged `develop` into `main` with a merge commit. The main-to-develop synchronization for this release is tracked by PR #37 and uses a merge commit.
- [1.1.3 main CI](https://github.com/rublaman/copilot-pace/actions/runs/38969894818) and the [tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/38970336298) passed on the release commit, covering both Node and VS Code versions, production package inspection and dependency audit.
- Tested and published artifact: [copilot-pace-1.1.3.vsix](https://github.com/rublaman/copilot-pace/releases/download/v1.1.3/copilot-pace-1.1.3.vsix); SHA-256: `ea05b0d27efd4e71cce85ae161df7ace984b9a415d7f7d25493ff5a785039c2d`. The VSIX, checksum and build record match the tag workflow artifact. The downloaded VSIX installed in an isolated Windows 11 / VS Code 1.142.0 profile; its manifest confirms version 1.1.3, the expected publisher and `preview: false`. Its packaged README references the two dark GIFs pinned to the release commit. No extension runtime code changed, and this release adds no new real-account or corporate-network acceptance; see [validation evidence](validation.md).
- [Copilot Pace 1.1.2](https://github.com/rublaman/copilot-pace/releases/tag/v1.1.2) remains a published stable GitHub Release with `preview: false`, using publisher `rubenblancomanzano`. Annotated tag `v1.1.2` identifies validated commit `e63792f5e4e0949d13ec20a765b793098bbf09c0`; it is no longer Latest.
- Preparation PR [#28](https://github.com/rublaman/copilot-pace/pull/28) was squash-merged into `develop`; promotion PR [#29](https://github.com/rublaman/copilot-pace/pull/29) merged `develop` into `main`; synchronization PR [#30](https://github.com/rublaman/copilot-pace/pull/30) merged `main` back into `develop`. Promotion and synchronization used merge commits.
- [1.1.2 main CI](https://github.com/rublaman/copilot-pace/actions/runs/38939301667) and the [tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/38940066771) passed on the release commit, covering both Node and VS Code versions, production package inspection and dependency audit.
- Tested and published artifact: [copilot-pace-1.1.2.vsix](https://github.com/rublaman/copilot-pace/releases/download/v1.1.2/copilot-pace-1.1.2.vsix); SHA-256: `43c99b3cc0cd6c73a7572dd5435a0c2f7adbe29facb238d507b2203cf0e3f23c`. The VSIX, checksum and build record match the tag workflow artifact; an anonymous public download matched the tested hash. The exact package passed all seven installed-VSIX checks in the tag workflow without rebuilding. Its packaged README has four GIF URLs pinned to the release commit; they resolve to the committed assets and their downloaded bytes match.
- This release changes version metadata and documentation only; runtime source is unchanged from 1.1.1. It adds no new real-account or corporate-network acceptance; see [validation evidence](validation.md).
- [Copilot Pace 1.1.1](https://github.com/rublaman/copilot-pace/releases/tag/v1.1.1) remains a published stable GitHub Release with `preview: false`, using publisher `rubenblancomanzano`. Annotated tag `v1.1.1` identifies validated commit `ae4de23a0b8f032ec438f85cda75cb6e77bd447a`; it is no longer Latest.
- Preparation PR [#23](https://github.com/rublaman/copilot-pace/pull/23) was squash-merged into `develop`; promotion PR [#24](https://github.com/rublaman/copilot-pace/pull/24) merged `develop` into `main`; synchronization PR [#25](https://github.com/rublaman/copilot-pace/pull/25) merged `main` back into `develop`. Promotion and synchronization used merge commits.
- [1.1.1 main CI](https://github.com/rublaman/copilot-pace/actions/runs/38900515937) and the [tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/38900964228) passed on the release commit, covering both Node and VS Code versions, production package inspection and dependency audit. Local validation also passed before preparation.
- Tested and published artifact: [copilot-pace-1.1.1.vsix](https://github.com/rublaman/copilot-pace/releases/download/v1.1.1/copilot-pace-1.1.1.vsix); SHA-256: `0d88f21d977824eddd9cd656cf26d5be6b44e192bf57e3686e07bf23cadb60c6`. It matches the tag workflow artifact byte for byte. The exact VSIX passed all seven installed-package tests on Windows 11 / VS Code 1.141.0 without rebuilding, and an anonymous public download matched the hash.
- The maintainer approved the visual presentation shown in the [1.1.0 pilot](https://github.com/rublaman/copilot-pace/releases/tag/v1.1.0) on October 16. New real-account flow, quota-comparison, reconnection and corporate-network checks were not recorded for the changed UI; see [validation evidence](validation.md). The immutable `v1.1.0` pilot and all earlier tags/assets remain unchanged.
- [Copilot Pace 1.0.1](https://github.com/rublaman/copilot-pace/releases/tag/v1.0.1) remains a published stable GitHub Release with `preview: false`, using publisher `rubenblancomanzano` and author Ruben Blanco Manzano. Annotated tag `v1.0.1` identifies the validated `main` commit `12d1d03cc893eec706df212930af5bece07b2609`; it is no longer Latest.
- [Preparation PR #17](https://github.com/rublaman/copilot-pace/pull/17) was squash-merged into `develop`; [PR #19](https://github.com/rublaman/copilot-pace/pull/19) restored the prior main release ancestry. [Promotion PR #18](https://github.com/rublaman/copilot-pace/pull/18) merged `develop` into `main`, and [PR #20](https://github.com/rublaman/copilot-pace/pull/20) synchronized `main` back into `develop`. Synchronization and promotion used merge commits.
- [1.0.1 main CI](https://github.com/rublaman/copilot-pace/actions/runs/38786619309) and the [1.0.1 tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/38787282587) passed on that commit, including both Node and VS Code versions, production package inspection and dependency audit. The downloaded tag artifact passed all six package tests again on Windows 11 / VS Code 1.141.0 without rebuilding. An isolated update from the original 1.0.0 VSIX retained the calendar and refresh settings. Both categories, the shortened README and its five image URLs were verified.
- Tested and published 1.0.1 file: [copilot-pace-1.0.1.vsix](https://github.com/rublaman/copilot-pace/releases/download/v1.0.1/copilot-pace-1.0.1.vsix); SHA-256: `30ff515ce5b5f2ab42c3efb73500597f7f0c5c59a5e6e3b437129bb24b3f8630`. The release's VSIX, checksum and build record match the tested Actions artifact byte for byte. An anonymous public download matched after publication.
- Version 1.0.1 changes Marketplace categories to `Visualization` and `AI` and removes the earlier-pilot replacement section from the main README. Runtime source and dependencies are unchanged from 1.0.0, so no intermediate prerelease was needed. These artifact checks do not represent new real-account or corporate-network acceptance.
- The [public Marketplace listing](https://marketplace.visualstudio.com/items?itemName=rubenblancomanzano.copilot-pace) was last verified at 1.0.0 on October 15. The later GitHub releases do not prove a store update; Marketplace upload and verification remain separate.
- [Copilot Pace 1.0.0](https://github.com/rublaman/copilot-pace/releases/tag/v1.0.0) remains a published stable GitHub Release with `preview: false`. All previous tags and release assets retain their original identities and hashes.
- The [preparation PR #14](https://github.com/rublaman/copilot-pace/pull/14) was squash-merged into `develop`. The [promotion PR #15](https://github.com/rublaman/copilot-pace/pull/15) merged `develop` into `main` with a merge commit. Annotated tag `v1.0.0` identifies that validated commit, `9248a36bf329f11e12a18cfe1d9786c639accf85`. Permanent branches and release tags remain protected.
- [1.0.0 main CI](https://github.com/rublaman/copilot-pace/actions/runs/38777435380) and the [1.0.0 tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/38778032170) passed on the 1.0.0 commit, including both Node and VS Code versions, package inspection and dependency audit.
- The 1.0.0 local preflight passed lint/types, 133 unit/service tests, 8 release-script tests, 16 integration tests on each of VS Code 1.120.0 / 1.141.0, and 6 installed-package tests. `npm audit` reported zero vulnerabilities. Both local VS Code versions started successfully for that candidate.
- The downloaded 1.0.0 tagged VSIX passed all six automated package tests on Windows 11 / VS Code 1.141.0 without rebuilding. An isolated update from the published 0.2.3 VSIX retained the calendar and polling settings and left only `rubenblancomanzano.copilot-pace@1.0.0` active. All five packaged README images resolved at the tagged commit.
- Tested and published 1.0.0 file: [copilot-pace-1.0.0.vsix](https://github.com/rublaman/copilot-pace/releases/download/v1.0.0/copilot-pace-1.0.0.vsix); SHA-256: `6bc0c7f1d76a69ab58c9e07935f811b4ba58733359e1cb14e401e9c4239bfb4d`. The release's VSIX, checksum and build record matched the tested Actions artifact byte for byte. An anonymous public download matched the tested hash after publication.
- The [0.2.0](https://github.com/rublaman/copilot-pace/releases/tag/v0.2.0), [0.2.1](https://github.com/rublaman/copilot-pace/releases/tag/v0.2.1), [0.2.2](https://github.com/rublaman/copilot-pace/releases/tag/v0.2.2) and [0.2.3](https://github.com/rublaman/copilot-pace/releases/tag/v0.2.3) pilots retain their original annotated tags and assets. Pilots through 0.2.2 keep the old publisher identity; 0.2.3 uses the current one.
- The project uses the MIT license. On October 15, 2026, the maintainer confirmed successful real-account acceptance of 0.2.3 and the saved publisher name **Ruben Blanco Manzano** under `rubenblancomanzano`; see the acceptance record below and [publisher details](#marketplace-and-failed-releases). The Marketplace listing is public; store installation and package verification remain manual steps. The unused `CopilotPace` publisher can remain.

Next: upload the exact tested 1.2.1 VSIX to Marketplace and verify its listing, package hash and isolated store installation. Keep all published artifacts unchanged and check the remote state before any further publication.

The root README shows dark-theme animated tooltip and detail-panel captures of the 1.1.1 UI, with illustrative usage figures. Packaged README images are pinned to the packaged commit. Upload the exact tested 1.2.1 VSIX to refresh the Marketplace listing. Do not rebuild or replace any published artifact.

Pilots through `0.2.2` retain the `rublaman.copilot-pace` identity and their original assets. Starting with `0.2.3`, the identity is `rubenblancomanzano.copilot-pace`. VS Code treats it as a separate extension: uninstall the earlier pilot, install the new VSIX, reload and reconnect GitHub. Existing `copilotPace.*` user settings remain. Version `1.0.0` keeps the new identity for updates from `0.2.3` and future releases. The public publisher name is configured independently from the technical ID; see [publisher details](#marketplace-and-failed-releases).

## Branches and channels

The 1.1.0 and 1.2.0 pilots retain their immutable numeric tags from `develop`, manifest `preview: true` and the GitHub prerelease channel without Latest. Stable 1.2.1 is published from `main` with `preview: false`, carrying the accepted GitHub.com/GHE runtime and the simplified README. Maintainer acceptance and automated package validation are recorded separately.

| Work | Branch / event | Result |
| --- | --- | --- |
| Regular changes | `feature/*`, `fix/*` or `chore/*` → PR to `develop`, squash by default | One coherent commit per PR, with CI and reviewed changes |
| Test builds | Push to `develop` | Tested production VSIX in Actions artifacts |
| Pilot / beta | Annotated `vX.Y.Z` on `develop`, `preview: true` | Draft GitHub prerelease with tested VSIX |
| Stable | PR `develop` → `main` with a merge commit; annotated tag, `preview: false` | Draft stable GitHub Release |
| Hotfix | `hotfix/*` from `main` → PR to `main` | New patch; merge back to `develop` |

After stable promotion, synchronize `main` → `develop` through a PR with a merge commit. Avoid squash/rebase for promotions between these permanent branches. A separate release branch is unnecessary until a candidate needs to be frozen while development continues.

All VSIX artifacts are production builds. Demos belong to the development host, including when a VSIX comes from `develop`.

### Merge policy

Use **Squash and merge** by default for regular PRs from `feature/*`, `fix/*` or `chore/*` into `develop`. One PR should produce one coherent commit describing the final change, rather than retaining each development adjustment in `develop`. Use the final PR title as the squash commit subject and summarize the resulting behavior and relevant validation in its body.

A merge commit is an exception when the PR contains independently useful commits whose history needs to be preserved. Explain the reason in the PR. After a squash merge, start follow-up work from the updated `develop` in a new branch.

Use **Create a merge commit** for `develop` → `main` promotions and `main` → `develop` synchronization. These permanent branches need their shared ancestry preserved; do not squash or rebase those PRs.

Keep both squash and merge commits available in GitHub so each flow can use its intended method. This policy is a contributor and agent convention; documenting it does not configure automatic enforcement or change repository settings.

### Version policy

Prepare versions through a PR using `npm version <version> --no-git-tag-version`. The manifest, both lockfile version fields, tag and packaged manifests must agree. Package filenames derive from the manifest.

Use annotated numeric tags: `vMAJOR.MINOR.PATCH`. Never move a distributed tag or overwrite assets; fixes require a new version. After `1.0.0`, use patch for compatible fixes, minor for compatible features and major for incompatible changes.

Three controls have different roles:

- Manifest `preview`: project declaration of pilot (`true`) or stable (`false`).
- GitHub prerelease: release visibility/channel metadata, set from `preview`.
- Marketplace prerelease: a separate publishing channel using `--pre-release` and numeric versions. It is not configured here; define its update sequence before adopting it. [VS Code publishing reference](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#prerelease-extensions).

Use GitHub prereleases for beta testing rather than `-beta` or `-rc` tags. Ordinary CI artifacts can test multiple commits at the same manifest version; identify them by SHA/run and use a clean profile. Published pilots need distinct versions.

## Automation

`ci.yml` runs on PRs, configured branch pushes, manual dispatch and reusable calls. It preserves the Node/VS Code matrices, runs `npm audit`, packages once, tests the installed VSIX and inspects its identity and contents. The artifact contains the VSIX, `SHA256SUMS.txt` and `build-info.json` with the commit and run URL.

`release.yml` runs on tag pushes matching `v*`. It:

1. Rejects malformed/lightweight tags, mismatched versions, a missing preview flag, incomplete changelog or unresolved license. The tagged commit must be reachable from `develop` for pilots or `main` for stable versions. Stable versions must be at least `1.0.0`.
2. Calls the CI workflow on that tagged commit with read permissions. Candidate code receives no release-writing credentials.
3. Downloads the tested artifact in a separate job, checks its recorded SHA and checksum, and creates a draft with notes and assets. Existing releases cause failure; assets are never replaced.

Only the draft job has `contents: write`; it does not check out or execute candidate code. Neither workflow publishes to Marketplace or publishes the GitHub draft automatically.

Tag pushes run the workflow from the tagged commit. A pilot can therefore run from `develop` without promotion to `main`; manual Actions dispatch requires the workflow on the default branch. Push tags with the maintainer's identity: events created using `GITHUB_TOKEN` generally do not start another workflow. [GitHub event reference](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).

## Repository setup record

- Initial MVP/workflow integration passed CI at `7104271`. Pilot preparation used [PR #2](https://github.com/rublaman/copilot-pace/pull/2), [#5](https://github.com/rublaman/copilot-pace/pull/5), [#10](https://github.com/rublaman/copilot-pace/pull/10) and [#12](https://github.com/rublaman/copilot-pace/pull/12).
- Branch protections were configured to require PRs, resolved conversations, current branches and all five CI jobs, including for admins. Force pushes/deletion were blocked; merge commits remained enabled. No external approval was required with one maintainer.
- Tag protection was configured through the [immutability ruleset](https://github.com/rublaman/copilot-pace/rules/25017697) and the [creation ruleset](https://github.com/rublaman/copilot-pace/rules/25017698). Updates/deletion were blocked without bypass; creation was restricted to `rublaman`.

These are setup records. Check the live repository rules before relying on them. Completed releases, branch synchronizations and acceptance results are recorded in [the release history](#previous-stable-release-history) and [validation.md](validation.md).

## Release readiness

- [ ] Upload the exact tested 1.2.1 VSIX to Marketplace and verify the listing, package hash and isolated store installation.

## Create and review a candidate

1. Prepare version, preview flag, changelog and release notes in a PR. Run `npm ci`, `npm run check`, `npm run test:integration`, `npm run test:package` and `npm audit`. Review audit findings without automatic forced upgrades.
2. Merge to the intended branch and wait for CI on that SHA. For stable promotion, merge `develop` into `main` first.
3. With a clean checkout and authenticated `gh`, fetch branches/tags and tag the exact validated SHA. This example requires a prepared pilot version on `develop` without an existing tag:

```powershell
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
if (git status --porcelain) { throw 'Commit or preserve local changes first.' }
git fetch origin --tags
$releaseSha = (git rev-parse origin/develop).Trim()
if ((git rev-parse HEAD).Trim() -cne $releaseSha) { throw 'Check out the validated release commit first.' }
$releaseVersion = (Get-Content package.json -Raw | ConvertFrom-Json).version
$releaseTag = "v$releaseVersion"
if (git tag --list $releaseTag) { throw 'Version already tagged; prepare a new version.' }
gh run list --workflow ci.yml --branch develop --commit $releaseSha
# Review the successful run for this SHA before continuing.
git tag -a $releaseTag $releaseSha -m "Copilot Pace $releaseVersion pilot"
node scripts/release.mjs $releaseTag
git push origin "refs/tags/$releaseTag"
```

4. Wait for the tag workflow and review the draft. Download its VSIX and verify `SHA256SUMS.txt`; retain the full SHA, tag, run URL and hash.
5. Test that downloaded artifact in the target environment and add the results to the notes. Publish the draft explicitly: pilot as prerelease without Latest; stable as a normal release with Latest. Retain the tested assets unchanged.

If automation is unavailable, download `copilot-pace-production-vsix` from the successful branch CI run for the exact candidate SHA. Verify its metadata/hash and create a draft with `gh release create --verify-tag --draft --latest=false --notes-file <notes.md>`, attaching the VSIX, checksum and build record. Add `--prerelease` for a pilot. Do not rebuild an untested replacement during upload.

## Real account acceptance

An explicitly labeled pilot may leave corporate validation pending. Stable publication requires acceptance in an authorized target environment and testing of the final packaged artifact. Keep account validation, automated checks and untested environments distinct:

1. Install the identified VSIX in a clean profile. Check connect, refresh, hover, details, light/dark themes and Every day / Mon–Fri.
2. Compare used credits, budget, percentage and renewal with Copilot for the intended account. Test proxy/certificate behavior without disabling TLS.
3. Check disconnect/reconnect, cancelled login and stale data after a failure. With multiple GitHub.com accounts, verify that the hover and panel identify the selected account, the Switch action changes the displayed quota without changing Copilot's own account, and previous data disappears when the account changes. Use fixtures for 429 and special quotas rather than provoking service limits.
4. Test an update from the pilot, including legacy settings; production must never enable demos. For the publisher transition, first uninstall `rublaman.copilot-pace` and install `rubenblancomanzano.copilot-pace` in the same isolated profile. Check settings retention and reconnect; do not leave both identities active. Subsequent updates, including `0.2.3` to `1.0.0`, must keep the new identity.
5. Record version, SHA, hash, editor/OS, date and results in the release notes. Use anonymized screenshots without tokens, complete responses or account identifiers.

Synthetic tests cover processing and integration; the internal `copilot_internal/user` endpoint remains unsupported as a public contract.

### Maintainer acceptance: 0.2.3

Reported by the maintainer on October 15, 2026, for the Windows 11 development environment:

- Pilot: `0.2.3`, commit `bca8e8106395381cce7267f3f5391380573ea4d2`.
- Published artifact: `copilot-pace-0.2.3.vsix`; SHA-256 `579f46f994d65d84d8fc1530e7b06e2aa3c005f5224dfb53d12b75d5a20be690`.
- Confirmed: GitHub connection with the intended Copilot account; used credits, limit and renewal compared with GitHub; **Refresh Usage**; the detail panel; **Every day / Mon–Fri**; light and dark themes; data displayed again after restarting VS Code.
- Confirmed: the Marketplace publisher's **Details → Name** is saved as **Ruben Blanco Manzano** under `rubenblancomanzano`.
- Scope: maintainer-reported manual acceptance. The exact editor version, multiple-account switching, cancelled login, failure recovery and corporate proxy/certificate checks were not separately recorded. Do not infer those results from the general confirmation.
- Version `1.0.0` changes release metadata and documentation only; runtime source is unchanged from the accepted pilot, apart from the build-time version value. The final tagged artifact passed its own CI, checksum verification and installed-package tests without rebuilding, as recorded above. Those automated checks do not represent new real-account acceptance of 1.0.0.

## Marketplace and failed releases

The root README supplies the packaged Marketplace overview. [MARKETPLACE.md](MARKETPLACE.md) mirrors its content, banner, badges and [UI captures](images/README.md), with relative paths adjusted for `docs/`. Update both when changing the overview. Commit and push referenced assets before packaging a publication candidate so the rewritten image URLs resolve to that commit.

| Publisher field | Value |
| --- | --- |
| Publisher ID | `rubenblancomanzano` |
| Publisher name | Ruben Blanco Manzano |
| Extension ID | `rubenblancomanzano.copilot-pace` |
| Display name | Copilot Pace |

Edit the publisher profile through its [management page](https://marketplace.visualstudio.com/manage/publishers/rubenblancomanzano). The extension's short description, repository and issue links are configured in `package.json`.

Marketplace upload and store verification of stable 1.2.1 remain pending. Automated publishing and the Marketplace prerelease channel are unconfigured. Before adding automation, use restricted publishing permissions and check the current [secure publishing guidance](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#secure-automated-publishing-to-visual-studio-marketplace).

Publish the same VSIX from the reviewed GitHub Release, through the publisher portal or `vsce publish --azure-credential --packagePath <tested.vsix>` with configured credentials. Verify the listing and an install/update before recording success. Do not rebuild or use `--skip-duplicate` to hide an existing version.

If upload fails, check whether the destination received the asset before retrying. Retry only that tested file. Code or package changes after a remote tag require a new version/tag; after distribution, use a hotfix. Preserve the release history.

Keep this guide current with workflow changes. [CONTRIBUTING.md](../CONTRIBUTING.md) owns development commands; [AGENTS.md](../AGENTS.md) owns shared agent rules. `.github/copilot-instructions.md` remains a local, ignored summary with no exclusive rules.
