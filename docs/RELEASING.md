# Releases

This guide defines the release workflow. Published versions, tested artifacts, commit SHAs and checksums are recorded in [GitHub Releases](https://github.com/rublaman/copilot-pace/releases).

## Published channels

- Stable: [1.2.1](https://github.com/rublaman/copilot-pace/releases/tag/v1.2.1) from `main`, with `preview: false` and Latest.
- Pilot: GitHub prereleases from `develop`, with `preview: true`, without Latest. See [GitHub Releases](https://github.com/rublaman/copilot-pace/releases) for published pilot versions.
- Real-account daily billing/corporate-policy acceptance remains pending. Synthetic tests do not establish that acceptance.
- Marketplace upload and store verification are separate from GitHub publication. The 1.3.2 candidate remains an unpublished draft; retain its tag and assets.

## Documentation records

Keep detailed validation records, working-tree artifact logs, internal security reviews, planning and capture notes in `.local/docs/`. This directory is ignored by Git and excluded from the VSIX. Keep shared development and release rules in the tracked contributor guides; record public release provenance with the corresponding GitHub Release.

## Branches and channels

Use `develop` for integration and pilots, and `main` for stable releases. Keep published tags and assets unchanged.

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
4. Test an update from the preceding published VSIX in an isolated profile. Check settings and local-history retention, the installed extension identity and reconnection. Production must never enable demos.
5. Record version, SHA, hash, editor/OS, date and results in the release notes. Use anonymized screenshots without tokens, complete responses or account identifiers.

Synthetic tests cover processing and integration; the internal `copilot_internal/user` endpoint remains unsupported as a public contract.

## Marketplace and failed releases

The root README supplies the packaged Marketplace overview. [MARKETPLACE.md](MARKETPLACE.md) mirrors its content, banner, badges and [UI images](images/), with relative paths adjusted for `docs/`. Update both when changing the overview. Commit and push referenced assets before packaging a publication candidate so the rewritten image URLs resolve to that commit.

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
