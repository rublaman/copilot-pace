# Project instructions: Copilot Pace

## Context and references

Copilot Pace is a VS Code extension that displays GitHub Copilot credits and an estimated monthly usage pace. English is the default extension UI language; Spanish (Spain) is an explicit user preference. Keep Markdown and pull request content in English. Respond to each contributor in their preferred language; the current maintainer prefers Spanish.

- Read [CONTRIBUTING.md](CONTRIBUTING.md) for development and testing.
- Before changing versions, packaging, CI, branches, tags or publishing, read [docs/RELEASING.md](docs/RELEASING.md). It is the reference for the release workflow and outstanding work.
- Verify the actual state in Git, `package.json`, `package-lock.json`, `.github/workflows/ci.yml` and the scripts. A documented proposal does not mean automation is implemented or a check has run.
- Keep detailed validation records, internal reviews, planning and capture notes in `.local/docs/`; never commit them or package them in a VSIX. Keep shared rules and technical guides public.
- `docs/corporate-authentication.md` is a local-only reference: keep it ignored and untracked, without public documentation links to it.
- Update the guide when the workflow or outstanding work changes. If `.github/copilot-instructions.md` exists, keep it consistent with these instructions. The maintainer has chosen to keep it local and ignored by Git; do not commit it or store rules exclusively there.

## Environment and changes

- Local development uses Windows with PowerShell 7. Do not use WSL unless explicitly requested.
- Use a standalone Node installation compatible with `engines.node` and the npm version specified by `packageManager`. Check `Get-Command node,npm,npx,gh` and the effective versions. Do not use Codex's internal runtime to build this project.
- Install dependencies with `npm ci`; preserve the lockfile and pinned versions. Use project-local tools without unnecessary global installations.
- Review `git status` and the diff before editing. Preserve the user's changes. Do not revert someone else's work or include unreviewed changes through `git add .`.
- Use `rg` for searches. Check `gh auth status` before operating on GitHub; never print or store tokens.
- Keep the scope aligned with the request. Documenting a workflow does not authorize executing it or publishing a release.

## Code and documentation style

- Apply [Code and documentation style](CONTRIBUTING.md#code-and-documentation-style) to every feature, fix and review. It defines the shared writing and readability criteria for contributors and coding agents.
- Prefer explicit control flow, domain names and readable templates. Keep abstractions justified by current behavior, comments focused on reasoning, and tests focused on observable outcomes. Readability refactors must preserve behavior and security boundaries.
- Write factual, concise documentation. Separate user-facing changes from validation and release records; keep the Marketplace overview aligned with the README. Review the final diff for filler, repetition, stale code and unsupported claims before submitting.

## Architecture and invariants

- `src/domain.ts`: quota normalization and pure calculations. Values represent credits, not tokens; the calendar uses UTC. `weekdays` excludes Saturdays and Sundays, without a public holiday calendar.
- `src/connection.ts` and `src/sessions.ts`: select VS Code's `github` or `github-enterprise` provider with `read:user`. Preserve GitHub.com personal/Business behavior and independent Copilot Pace account preferences. Do not store credentials independently. Silent refresh must not open dialogs; interactive reconnection requires a user action.
- `src/transport.ts`: HTTPS to `https://api.github.com/copilot_internal/user` for GitHub.com, or the matched `https://api.<instance-host>/copilot_internal/user` for one validated Enterprise HTTPS origin. Multiple-instance quota routing is blocked; changing effective instance settings requires reload before Enterprise authentication/requests resume. Never send a token to another host as a fallback or follow redirects. The maintainer confirmed GitHub.com and corporate GHE acceptance of the 1.2.0 pilot; see the published 1.2.0 release and the local acceptance record for scope. Preserve TLS, timeouts, response limits and cancellation. Header versions come from `__EXTENSION_VERSION__`, defined from the manifest at build time.
- `src/billing.ts` and `src/daily.ts`: optional current-cycle daily billing reads on the matched API origin, with automatic fallback to partial same-day observed differences. Keep the existing session scopes, verified account identity, user-filtered managed reports, bounded requests, rate-limit handling and ambiguous-payer fallback. Do not convert premium requests into credits, invent missing daily totals or claim real-account billing acceptance from synthetic coverage.
- `src/service.ts`: concurrency, cancellation, sessions, refresh and retry backoff. Preserve stale response invalidation, the interactive connection queue and respect for `Retry-After`. Use the injected clock for testable time-dependent logic. Supplemental billing must not delay publishing accepted quota, and its late responses must remain isolated across account, provider and snapshot changes.
- `src/extension.ts`, `src/view.ts`, `src/presentation.ts` and `src/i18n.ts`: VS Code integration, presentation and English/Spanish (Spain) localization. The language switch belongs only in the detail panel, labeled Spanish in English and Inglés in Spanish. Keep UTC calculations independent of presentation language. Preserve the nonce-based CSP, restricted local resources, explicit webview action allowlist, Markdown escaping and hover command allowlist. Do not insert network responses as HTML or expose tokens to the panel.
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

- Published stable and pilot versions, exact commit SHAs and tested package checksums are recorded in GitHub Releases and `docs/RELEASING.md`. Detailed local evidence belongs in `.local/docs/validation.md`. Real-account daily billing/corporate-policy acceptance remains pending; do not infer it from synthetic tests.

- Regular changes: `feature/*`, `fix/*` or `chore/*` → PR to `develop` using **Squash and merge** by default, keeping one coherent commit per PR. Use the final PR title and description to describe the resulting change. A merge commit is an exception when independently useful commits need to be preserved; explain the reason in the PR.
- Stable promotion: PR from `develop` to `main` using a merge commit; synchronize `main` back into `develop` through a PR with a merge commit. Preserve the shared history between these permanent branches; do not squash or rebase those PRs.
- `develop` integrates changes and supports pilots through VSIX/GitHub prereleases. `main` contains stable versions. This workflow has no `master` branch.
- Stable `1.2.1` is published from `main` at `733381fcc2557e46fc08d4c2a63df01cfe3a74a2` with Latest and `preview: false` after the maintainer confirmed the 1.2.0 pilot works correctly in GitHub.com and corporate GHE environments. Authentication and quota runtime behavior are unchanged from that pilot. Final CI, tested VSIX and SHA-256 evidence are retained in the release's build record/checksum and `docs/RELEASING.md`. Synchronization carries `main` ancestry back into `develop` with a merge commit. Published pilot `v1.2.0` and earlier tags/assets remain unchanged. Marketplace upload and store verification remain separate and pending. Always check actual Git and release state.
- Use SemVer and annotated `vMAJOR.MINOR.PATCH` tags. The tag, manifest, lockfile and manifest inside the VSIX must agree. Create the tag on the validated SHA of the release branch, after merging.
- Do not move or overwrite published tags or assets. A distributed fix requires a new version.
- GitHub Releases retain notes, the VSIX and its SHA-256. Marketplace must receive the same tested VSIX, without rebuilding during publication.
- CI produces test artifacts; annotated tags prepare release drafts. Publishing those drafts and Marketplace releases requires explicit authorization. Keep candidate execution under read permissions and upload the tested artifact without rebuilding.
- The release guide defines the specific criteria, the distinction between preview and prerelease, and publisher requirements. Do not declare `1.0.0` ready while its blockers remain unresolved.
