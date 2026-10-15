# Contributing to Copilot Pace

Keep the UI, Markdown and pull request content in English. Read [AGENTS.md](AGENTS.md) for project rules and [the release guide](docs/RELEASING.md) before changing versions, packaging or workflows.

## Setup

Use Windows, PowerShell 7, standalone Node 24 or 26, npm 11.20.0 and the VS Code CLI (`code`). Check the effective versions against `engines` and `packageManager`, then install pinned dependencies:

```powershell
npm ci
```

## Builds and demos

Build mode is explicit and independent of the branch.

| Command | Output | Demos |
| --- | --- | --- |
| `npm run build` | `out/development/` and `out/test/` | Development/Test hosts only |
| `npm run watch` | Rebuilt development bundle | Restart the host to load changes |
| `npm run build:production` | `dist/extension.js` | Excluded |
| `npm run package` | `dist/copilot-pace-<version>.vsix` | Excluded |
| `npm run test:package` | Packaged VSIX installed and tested in an isolated profile | Verified absent |

Open the repository in VS Code and press F5 with **Copilot Pace: Extension** selected. The launcher starts a separate development host with `.vscode-test/debug-profile`, disables other extensions and attaches on `127.0.0.1:9333`. This avoids the native `extensionHost` startup crash described in [the upstream issue](https://github.com/microsoft/vscode/issues/336233).

The launcher reuses a matching host. Close its window before F5 to load rebuilt code; initial activation can finish before the debugger attaches. It refuses to attach if the port belongs to another process or profile. The task message **Terminal will be reused by tasks** means the build finished.

Run **Copilot Pace: Try Demo Scenarios** in that host. **Copilot Pace: Use GitHub** returns to the real adapter. Demo usage is fixed, but dates and pace labels follow the current UTC calendar. Tests inject fixed clocks for threshold assertions.

The 1-credit and 2-credit demos use a 10,000-credit budget to check that the status bar, hover and detail panel show `<0.1%` instead of rounding positive usage to zero.

Restart watch after changing either manifest. `scripts/development.contributions.json` adds demo contributions to the generated development manifest. Production uses the root manifest, compiles with `__DEV__ = false` and rejects demo modules in esbuild metadata. Never distribute `out/development/`.

## Validation

```powershell
npm run check
npm run test:integration
npm run test:package
npm audit
```

- Code: `check` runs lint, strict types, unit/service tests and release-script regressions.
- Activation, commands, UI or VS Code integration: also run `test:integration` on VS Code 1.120.0 and 1.141.0. To select one: `npm run test:integration -- --label 1.141.0`.
- Manifest, build or packaging: also run `test:package`. It installs the production VSIX in a clean profile, checks demo exclusion and initializes the webview. It also inspects package contents and writes a checksum.
- Documentation only: check links, Git tracking, consistency and `git diff --check`.

Host profiles live under `.vscode-test`; close leftover test windows before rerunning. Synthetic tests do not prove real account or network compatibility. Record the tested SHA and artifact for a release.

## CI and branches

Open regular PRs from `feature/*`, `fix/*` or `chore/*` against `develop` and use **Squash and merge** by default: one coherent commit per PR. Keep the final PR title and description focused on the resulting change. If independently useful commits need to be preserved, explain the merge-commit exception in the PR. Start follow-up work from the updated `develop` in a new branch after a squash merge.

Use **Create a merge commit** for `develop` → `main` promotions and `main` → `develop` synchronization. The [release guide](docs/RELEASING.md#merge-policy) defines the merge policy.

CI checks Node 24.21.0 / 26.11.1 and both VS Code versions, audits dependencies, and uploads `copilot-pace-production-vsix` with its checksum and build record. The same validation is reused for tagged release candidates.

Pushes to `develop` provide installable test artifacts without creating a release or changing the version. Tagged pilots and stable promotion follow [RELEASING.md](docs/RELEASING.md). CI results apply only to the commit and artifact tested.
