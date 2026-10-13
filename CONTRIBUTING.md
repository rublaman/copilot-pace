# Contributing to Copilot Pace

Project guidance lives in [AGENTS.md](AGENTS.md). For branches, versions, tags, GitHub Releases and Marketplace publication, follow [the release guide](docs/RELEASING.md), including its list of work still pending. This file covers the existing development commands.

Use English for contribution documentation and pull request titles and descriptions so contributors can review them internationally. Keep the extension UI in English.

## Development and production builds

Build mode is explicit and independent of the Git branch. Keep demos and their tests with the application code so they evolve together. Every distributable VSIX is a production build.

| Command or launch | Output | Demos |
| --- | --- | --- |
| `npm run build` | `out/development/` and compiled tests in `out/test/` | Available in Development/Test hosts |
| F5: Copilot Pace: Extension | Builds and launches `out/development/` | Available from the demo command |
| `npm run watch` | Rebuilds the development bundle | Available after restarting the host |
| `npm run build:production` | `dist/extension.js` | Excluded at compile time |
| `npm run package` | `dist/copilot-pace-0.1.3.vsix` | Excluded; prepublish always rebuilds production |
| `npm run test:package` | Builds, installs and tests the production VSIX in an isolated profile | Verified absent |

## Run demos

Use standalone Node 24 or 26 with npm 11.20.0, PowerShell 7 (`pwsh`) and the VS Code CLI (`code`) on PATH. Run `npm ci`, open this repository in VS Code and press F5 with **Copilot Pace: Extension** selected. The launch configuration builds the extension, starts a separate development host using `scripts/debug.ps1`, and attaches the debugger on `127.0.0.1:9333`. The host uses `.vscode-test/debug-profile` for its settings and disables other installed extensions.

This separate launch avoids the native host crash observed with VS Code's `extensionHost` debug startup ([upstream report](https://github.com/microsoft/vscode/issues/336233)). The build task's **Terminal will be reused by tasks** message indicates that compilation finished; it is not an error.

The launcher reuses a matching debug host if it is still running. Close the existing development window before F5 for a fresh launch with rebuilt code. The host starts before the debugger attaches, so initial activation may finish before breakpoints are registered. The launcher refuses to attach if port 9333 belongs to a different process or profile.

In the Extension Development Host, run **Copilot Pace: Try Demo Scenarios**. Choose a scenario, then hover over the status item or open its details. **Copilot Pace: Use GitHub** returns that development host to the real adapter. Mock mode never authenticates or contacts GitHub.

Demo usage stays fixed while the calendar uses the current UTC date. Pace colors therefore change with the date and the Every day / Mon–Fri setting. Automated tests use fixed dates when checking specific thresholds and colors.

Restart `npm run watch` after changing either manifest, and reload the development host after rebuilding.

## How the separation works

- The root `package.json` is the production manifest. It exposes only the user commands and settings.
- `scripts/development.contributions.json` adds the demo commands and settings only to the generated development manifest. Never package `out/development/` for distribution.
- Esbuild replaces `__DEV__` with `true` for development/tests and `false` for production. All references to `src/development.ts` are guarded so it and `src/mocks.ts` disappear from the release bundle. The production build checks esbuild's metadata before writing the bundle and fails if either module contributes code.
- Development builds additionally require `ExtensionMode.Development` or `ExtensionMode.Test`. An ordinary installation cannot activate mocks through saved settings.
- Production always selects the GitHub adapter. Old `dataSource` and `mockScenario` settings are ignored, including inside a test host. No user setting or branch name can enable demos in a production bundle.
- Source, tests, development manifests, maps and this guide are excluded from the VSIX.

## Validation

```powershell
npm run check
npm run test:integration
npm run test:package
```

`check` runs lint, TypeScript and unit tests, including activation boundaries for Production, Development and Test modes. Integration tests run all demo scenarios in development builds on VS Code 1.120.0 and 1.141.0.

Package tests load the installed production bundle in an isolated test host. They verify the release manifest, absence of demo code and commands, ignored legacy mock settings, and initialization of the normal hover and webview. These checks do not require a corporate account or prove real account/network compatibility.

CI runs development tests and then builds/tests a production VSIX on every configured branch. The uploaded artifact is named `copilot-pace-production-vsix`. A feature branch is useful for reviewing changes; a permanent demo branch is unnecessary.

The current CI does not create tags, GitHub Releases or Marketplace publications. The package command still contains the literal version `0.1.3` in its output path; remove that coupling before the next version bump, as described in the release guide. A green run on an older commit does not validate local changes or a later merge commit.
