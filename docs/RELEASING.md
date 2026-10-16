# Releases

This guide defines version preparation, validation and distribution. Read the workflows and scripts before using it; documentation alone does not publish a release.

## Current state

Reviewed on October 15, 2026:

- Public repository: `rublaman/copilot-pace`; default branch: `main`. There is no `master` branch.
- [Copilot Pace 1.0.1](https://github.com/rublaman/copilot-pace/releases/tag/v1.0.1) is published as a stable GitHub Release with Latest and `preview: false`, using publisher `rubenblancomanzano` and author Ruben Blanco Manzano. Annotated tag `v1.0.1` identifies the validated `main` commit `12d1d03cc893eec706df212930af5bece07b2609`.
- [Preparation PR #17](https://github.com/rublaman/copilot-pace/pull/17) was squash-merged into `develop`; [PR #19](https://github.com/rublaman/copilot-pace/pull/19) restored the prior main release ancestry. [Promotion PR #18](https://github.com/rublaman/copilot-pace/pull/18) merged `develop` into `main`, and [PR #20](https://github.com/rublaman/copilot-pace/pull/20) synchronized `main` back into `develop`. Synchronization and promotion used merge commits.
- [1.0.1 main CI](https://github.com/rublaman/copilot-pace/actions/runs/38786619309) and the [1.0.1 tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/38787282587) passed on that commit, including both Node and VS Code versions, production package inspection and dependency audit. The downloaded tag artifact passed all six package tests again on Windows 11 / VS Code 1.141.0 without rebuilding. An isolated update from the original 1.0.0 VSIX retained the calendar and refresh settings. Both categories, the shortened README and its five image URLs were verified.
- Tested and published 1.0.1 file: [copilot-pace-1.0.1.vsix](https://github.com/rublaman/copilot-pace/releases/download/v1.0.1/copilot-pace-1.0.1.vsix); SHA-256: `30ff515ce5b5f2ab42c3efb73500597f7f0c5c59a5e6e3b437129bb24b3f8630`. The release's VSIX, checksum and build record match the tested Actions artifact byte for byte. An anonymous public download matched after publication.
- Version 1.0.1 changes Marketplace categories to `Visualization` and `AI` and removes the earlier-pilot replacement section from the main README. Runtime source and dependencies are unchanged from 1.0.0, so no intermediate prerelease was needed. These artifact checks do not represent new real-account or corporate-network acceptance.
- The [public Marketplace listing](https://marketplace.visualstudio.com/items?itemName=rubenblancomanzano.copilot-pace) still shows 1.0.0. Upload of the exact tested 1.0.1 VSIX and store installation/package verification remain pending.
- [Copilot Pace 1.0.0](https://github.com/rublaman/copilot-pace/releases/tag/v1.0.0) remains a published stable GitHub Release with `preview: false`; 1.0.1 is now Latest. All previous tags and release assets retain their original identities and hashes.
- The [preparation PR #14](https://github.com/rublaman/copilot-pace/pull/14) was squash-merged into `develop`. The [promotion PR #15](https://github.com/rublaman/copilot-pace/pull/15) merged `develop` into `main` with a merge commit. Annotated tag `v1.0.0` identifies that validated commit, `9248a36bf329f11e12a18cfe1d9786c639accf85`. Permanent branches and release tags remain protected.
- [1.0.0 main CI](https://github.com/rublaman/copilot-pace/actions/runs/38777435380) and the [1.0.0 tag workflow](https://github.com/rublaman/copilot-pace/actions/runs/38778032170) passed on the 1.0.0 commit, including both Node and VS Code versions, package inspection and dependency audit.
- The 1.0.0 local preflight passed lint/types, 133 unit/service tests, 8 release-script tests, 16 integration tests on each of VS Code 1.120.0 / 1.141.0, and 6 installed-package tests. `npm audit` reported zero vulnerabilities. Both local VS Code versions started successfully for that candidate.
- The downloaded 1.0.0 tagged VSIX passed all six automated package tests on Windows 11 / VS Code 1.141.0 without rebuilding. An isolated update from the published 0.2.3 VSIX retained the calendar and polling settings and left only `rubenblancomanzano.copilot-pace@1.0.0` active. All five packaged README images resolved at the tagged commit.
- Tested and published 1.0.0 file: [copilot-pace-1.0.0.vsix](https://github.com/rublaman/copilot-pace/releases/download/v1.0.0/copilot-pace-1.0.0.vsix); SHA-256: `6bc0c7f1d76a69ab58c9e07935f811b4ba58733359e1cb14e401e9c4239bfb4d`. The release's VSIX, checksum and build record matched the tested Actions artifact byte for byte. An anonymous public download matched the tested hash after publication.
- The [0.2.0](https://github.com/rublaman/copilot-pace/releases/tag/v0.2.0), [0.2.1](https://github.com/rublaman/copilot-pace/releases/tag/v0.2.1), [0.2.2](https://github.com/rublaman/copilot-pace/releases/tag/v0.2.2) and [0.2.3](https://github.com/rublaman/copilot-pace/releases/tag/v0.2.3) pilots retain their original annotated tags and assets. Pilots through 0.2.2 keep the old publisher identity; 0.2.3 uses the current one.
- The project uses the MIT license. On October 15, 2026, the maintainer confirmed successful real-account acceptance of 0.2.3 and the saved publisher name **Ruben Blanco Manzano** under `rubenblancomanzano`; see the acceptance record below and [MARKETPLACE.md](MARKETPLACE.md). The Marketplace listing is public; store installation and package verification remain manual steps. The unused `CopilotPace` publisher can remain.

Next: complete the 1.0.1 Marketplace upload and verify its listing, package hash and isolated store installation. The main-to-develop synchronization is complete. Keep all published artifacts unchanged and check the remote state before any further publication.

Pilots through `0.2.2` retain the `rublaman.copilot-pace` identity and their original assets. Starting with `0.2.3`, the identity is `rubenblancomanzano.copilot-pace`. VS Code treats it as a separate extension: uninstall the earlier pilot, install the new VSIX, reload and reconnect GitHub. Existing `copilotPace.*` user settings remain. Version `1.0.0` keeps the new identity for updates from `0.2.3` and future releases. The public publisher name is configured independently from the technical ID; see [MARKETPLACE.md](MARKETPLACE.md).

## Branches and channels

The 1.1.0 pilot uses a numeric `v1.1.0` tag from `develop`, manifest `preview: true` and the GitHub prerelease channel without Latest. It introduces English/Spanish (Spain) localization, a compact hover and theme-aware pace colors. Stable 1.0.1 remains on `main`; this pilot does not authorize a Marketplace upload or stable promotion. Final-artifact automated checks and the development-host UI review must be kept separate from real-account and corporate-network acceptance, which remain pending for the new UI.

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

Integrate the workflows into `develop` before the pilot. Tag pushes run the workflow from the tagged commit, so the pilot does not require promoting the extension to `main`. Manual Actions dispatch requires the workflow on the default branch. Push tags with the maintainer's identity: events created using `GITHUB_TOKEN` generally do not start another workflow. [GitHub event reference](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).

## Release readiness

- [x] Integrate the MVP and workflows into `develop`; CI passed at `7104271`.
- [x] Merge the [pilot preparation PR](https://github.com/rublaman/copilot-pace/pull/2), validate its final commit remotely and create the annotated `v0.2.0` tag.
- [x] Exercise tag-triggered automation, inspect and test the downloaded VSIX, publish the pilot without Latest and verify anonymous downloads.
- [x] Merge the [0.2.1 preparation PR](https://github.com/rublaman/copilot-pace/pull/5), validate its final commit and tagged artifact, and publish the updated pilot without replacing `0.2.0`.
- [x] Merge the [0.2.2 preparation PR](https://github.com/rublaman/copilot-pace/pull/10), validate the merged and tagged commit, test the downloaded VSIX without rebuilding, and publish the pilot with a matching anonymous download checksum.
- [x] Add the MIT license and align `package.json` and the lockfile. Packaging requires the license; release validation checks that it is tracked.
- [x] Prepare `0.2.1`, `preview: true` and its dated changelog entry. The workflow derives draft release notes from the changelog; package validation checks README, license, identity and required images.
- [x] Protect `main` and `develop`: PRs, resolved conversations, current branches and all five CI jobs are required, including for admins. Force pushes/deletion are blocked; merge commits remain allowed. No external approval is required while there is one maintainer.
- [x] Protect `refs/tags/v*`: the [immutability ruleset](https://github.com/rublaman/copilot-pace/rules/25017697) blocks updates/deletion without bypass, and the [creation ruleset](https://github.com/rublaman/copilot-pace/rules/25017698) permits creation only by `rublaman`.
- [x] Select the personal Marketplace publisher `rubenblancomanzano`, created by the maintainer at [Manage Publishers](https://marketplace.visualstudio.com/manage/publishers/rubenblancomanzano), and align the 0.2.3 manifest, release workflow and tests with it.
- [x] Merge the [0.2.3 preparation PR](https://github.com/rublaman/copilot-pace/pull/12), validate its merged/tagged commit, test the unchanged downloaded VSIX and replacement of the old identity, then publish the GitHub pilot with a matching anonymous download checksum.
- [x] Obtain the maintainer's confirmation of real-account acceptance of 0.2.3 and the saved publisher profile name, **Ruben Blanco Manzano**, on October 15, 2026. The acceptance scope and limits are recorded below.
- [x] Prepare `1.0.0` with `preview: false` through [PR #14](https://github.com/rublaman/copilot-pace/pull/14), promote `develop` to `main` with a merge commit through [PR #15](https://github.com/rublaman/copilot-pace/pull/15), validate the final SHA/VSIX and publish that same tested file as the stable GitHub Release with Latest. The anonymous public download matched the tested checksum.
- [x] Verify that the public Marketplace listing shows `1.0.0` under **Ruben Blanco Manzano** on October 15, 2026.
- [x] Merge the 1.0.1 preparation PR into `develop`, promote to `main` with a merge commit, validate the final SHA and tagged VSIX, and publish the stable GitHub Release with Latest. Previous release tags and assets remain unchanged.
- [x] Synchronize `main` back into `develop` with a merge commit through PR #20.
- [ ] Upload the exact tested 1.0.1 VSIX to Marketplace and verify the listing, package hash and isolated store installation.

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

English listing copy is maintained in [MARKETPLACE.md](MARKETPLACE.md). The root README supplies the full overview, with the existing brand banner and [documented UI screenshots](images/README.md). Commit and push all referenced assets before packaging a publication candidate so the rewritten image URLs resolve to that commit.

Marketplace automation remains pending. The selected publisher is `rubenblancomanzano`, and the manifest, release workflow and tests use `rubenblancomanzano.copilot-pace`. The maintainer confirmed the saved public publisher name **Ruben Blanco Manzano** on October 15, 2026. Keep the publisher profile suitable for multiple extensions; the extension manifest owns Copilot Pace's repository and issue links. The 0.2.3 release remains a GitHub pilot. Stable 1.0.1 is published on GitHub from `main`; its Marketplace upload and store verification remain pending. Marketplace's separate prerelease channel is unconfigured. Use an environment with restricted publishing permissions and verify the current [secure publishing guidance](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#secure-automated-publishing-to-visual-studio-marketplace) before implementing automation.

Publish the same VSIX from the reviewed GitHub Release, through the publisher portal or `vsce publish --azure-credential --packagePath <tested.vsix>` with configured credentials. Verify the listing and an install/update before recording success. Do not rebuild or use `--skip-duplicate` to hide an existing version.

If upload fails, check whether the destination received the asset before retrying. Retry only that tested file. Code or package changes after a remote tag require a new version/tag; after distribution, use a hotfix. Preserve the release history.

Keep this guide current with workflow changes. [CONTRIBUTING.md](../CONTRIBUTING.md) owns development commands; [AGENTS.md](../AGENTS.md) owns shared agent rules. `.github/copilot-instructions.md` remains a local, ignored summary with no exclusive rules.
