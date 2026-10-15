# Project instructions: Copilot Pace

## Context and references

Copilot Pace is a VS Code extension that displays GitHub Copilot credits and an estimated monthly usage pace. Keep the extension UI, Markdown and pull request content in English. Respond to each contributor in their preferred language; the current maintainer prefers Spanish.

- Read [CONTRIBUTING.md](CONTRIBUTING.md) for development and testing.
- Before changing versions, packaging, CI, branches, tags or publishing, read [docs/RELEASING.md](docs/RELEASING.md). It is the reference for the release workflow and outstanding work.
- Verify the actual state in Git, `package.json`, `package-lock.json`, `.github/workflows/ci.yml` and the scripts. A documented proposal does not mean automation is implemented or a check has run.
- Update the guide when the workflow or outstanding work changes. If `.github/copilot-instructions.md` exists, keep it consistent with these instructions. The maintainer has chosen to keep it local and ignored by Git; do not commit it or store rules exclusively there.

## Environment and changes

- Local development uses Windows with PowerShell 7. Do not use WSL unless explicitly requested.
- Use a standalone Node installation compatible with `engines.node` and the npm version specified by `packageManager`. Check `Get-Command node,npm,npx,gh` and the effective versions. Do not use Codex's internal runtime to build this project.
- Install dependencies with `npm ci`; preserve the lockfile and pinned versions. Use project-local tools without unnecessary global installations.
- Review `git status` and the diff before editing. Preserve the user's changes. Do not revert someone else's work or include unreviewed changes through `git add .`.
- Use `rg` for searches. Check `gh auth status` before operating on GitHub; never print or store tokens.
- Keep the scope aligned with the request. Documenting a workflow does not authorize executing it or publishing a release.

## Architecture and invariants

- `src/domain.ts`: quota normalization and pure calculations. Values represent credits, not tokens; the calendar uses UTC. `weekdays` excludes Saturdays and Sundays, without a public holiday calendar.
- `src/sessions.ts`: authentication through VS Code's `github` provider with `read:user`. Do not store credentials independently. Silent refresh must not open dialogs; interactive reconnection requires a user action.
- `src/transport.ts`: HTTPS to the fixed endpoint `https://api.github.com/copilot_internal/user`. Preserve TLS, timeouts, response limits and cancellation. Header versions come from `__EXTENSION_VERSION__`, defined from the manifest at build time.
- `src/service.ts`: concurrency, cancellation, sessions, refresh and retry backoff. Preserve stale response invalidation, the interactive connection queue and respect for `Retry-After`. Use the injected clock for testable time-dependent logic.
- `src/extension.ts`, `src/view.ts` and `src/presentation.ts`: VS Code integration and presentation. Preserve the nonce-based CSP, restricted local resources, explicit webview action allowlist, Markdown escaping and hover command allowlist. Do not insert network responses as HTML or expose tokens to the panel.
- The endpoint is internal to GitHub. Synthetic tests do not demonstrate compatibility with corporate accounts or networks. Do not claim support for GitHub Enterprise Server, GHE.com, web or other systems without implementing and validating it.
- Do not log tokens, complete response bodies or account data. Do not add telemetry or workspace access as a side effect of refactoring.

## Development and distribution

- Build mode is explicit and independent of the branch.
- `npm run build` produces `out/development/` and the tests. Demos require `__DEV__` and a Development/Test host.
- `npm run package` and `npm run test:package` produce production builds. `src/development.ts`, `src/mocks.ts` and their contributions must be excluded from the VSIX. Do not distribute `out/development/`.
- Production always uses GitHub. Legacy mock settings must not activate simulated data.
- Maintain `.vscodeignore`: source, tests, agent instructions and internal documentation must not be packaged. Review the README, changelog, license, required images and bundle for distribution.

## Validation

- Code changes: `npm run check`.
- Activation, command, UI or VS Code integration changes: also run `npm run test:integration`.
- Manifest, build or packaging changes, and every release candidate: `npm run test:package`. This command already packages and installs the VSIX in an isolated profile.
- Before a release: run all three commands above, review `npm audit` and inspect the VSIX contents. Retain evidence of the SHA and the tested file. The CI matrix defines the versions to validate.
- Documentation: check links, consistency, Git tracking and `git diff --check`; do not repeat host tests when neither code nor packaging changes.
- Add regression coverage for behavioral bugs. Do not weaken checks to make CI pass. Distinguish local tests, remote CI and manual validation; report checks that have not run.

## Release workflow

- Regular changes: `feature/*`, `fix/*` or `chore/*` → PR to `develop` using **Squash and merge** by default, keeping one coherent commit per PR. Use the final PR title and description to describe the resulting change. A merge commit is an exception when independently useful commits need to be preserved; explain the reason in the PR.
- Stable promotion: PR from `develop` to `main` using a merge commit; synchronize `main` back into `develop` through a PR with a merge commit. Preserve the shared history between these permanent branches; do not squash or rebase those PRs.
- `develop` integrates changes and supports pilots through VSIX/GitHub prereleases. `main` contains stable versions. This workflow has no `master` branch.
- Pilot `0.2.3` is published as a GitHub prerelease with the final publisher `rubenblancomanzano`; pilots through `0.2.2` retain `rublaman.copilot-pace` and their original assets. The maintainer confirmed real-account acceptance and the publisher profile on October 15, 2026. Version `1.0.0` is being prepared with `preview: false`; Marketplace publication remains manual. Always check the actual manifest, tags and release state.
- Use SemVer and annotated `vMAJOR.MINOR.PATCH` tags. The tag, manifest, lockfile and manifest inside the VSIX must agree. Create the tag on the validated SHA of the release branch, after merging.
- Do not move or overwrite published tags or assets. A distributed fix requires a new version.
- GitHub Releases retain notes, the VSIX and its SHA-256. Marketplace must receive the same tested VSIX, without rebuilding during publication.
- CI produces test artifacts; annotated tags prepare release drafts. Publishing those drafts and Marketplace releases requires explicit authorization. Keep candidate execution under read permissions and upload the tested artifact without rebuilding.
- The release guide defines the specific criteria, the distinction between preview and prerelease, and publisher requirements. Do not declare `1.0.0` ready while its blockers remain unresolved.
