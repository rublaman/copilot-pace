# Corporate authentication

Feature [#39](https://github.com/rublaman/copilot-pace/issues/39), implemented on `feature/corporate-authentication` on October 19, 2026. Enterprise connection is experimental; real corporate account, quota and network acceptance remain pending. Published releases are unchanged.

## Account selection

`copilotPace.authProvider` is an application preference:

| Value | Behavior |
| --- | --- |
| `auto` (default) | Follow `github.copilot.advanced.authProvider`; use GitHub.com otherwise |
| `github` | Use GitHub.com, including personal and Business accounts |
| `github-enterprise` | Use VS Code's configured Enterprise instances |

A corporate instance configured for another extension does not automatically change Pace's provider. With no Enterprise configuration, Connect keeps the original GitHub.com flow without an additional picker. When Enterprise is configured, Connect/Switch offers the two providers through a native Quick Pick, with the current provider first. The choice is saved for Pace only; resetting the preference to `auto` follows Copilot again. After changing Enterprise instance settings while Pace is active, reload VS Code before using the corporate connection; GitHub.com remains available.

After provider selection, VS Code owns consent, account selection and sign-in through the stable `authentication.getSession` API. Both providers request only `read:user`. Background refresh always uses `silent: true`. Cancelling provider selection leaves the account, quota and settings unchanged; cancelled or rejected authentication never starts the other provider's login. Connect calls share one pending operation to avoid duplicate pickers.

Copilot's own account and configuration are never modified. Pace does not store tokens, read repository files, infer a host from Git remotes, collect telemetry or provide a credential form. The selected single Enterprise host appears alongside the account in the existing escaped presentation.

## Enterprise configuration and routing

`connection.ts` resolves an immutable provider/origin context. The extension inspects the installed built-in GitHub Authentication manifest to determine which settings it actually supports:

| Tested editor | Settings recognized by its provider |
| --- | --- |
| VS Code 1.120.0 | `github-enterprise.uri` |
| VS Code 1.141.0 | `github-enterprise.uris`, or the deprecated singular setting when no plural value is explicitly set |

An explicit plural empty list disables instances and does not fall back to the singular URI. Unsupported plural settings on older providers are ignored. In untrusted workspaces, only user-level Enterprise instance values participate. Granting trust recomputes the connection.

Enterprise origins must be HTTPS DNS hosts, optionally with port 443 and a trailing slash. Login/project/repository paths, credentials, query strings, fragments, IP addresses, local hostnames, nondefault ports and GitHub.com hosts are rejected. Only a single distinct normalized origin can be used for quota queries.

| Provider | Quota request |
| --- | --- |
| `github` | `https://api.github.com/copilot_internal/user` |
| `github-enterprise`, one valid origin | `https://api.<instance-host>/copilot_internal/user` |
| Missing, invalid or multiple Enterprise origins | No authenticated HTTP quota request; localized configuration error |

This Enterprise API mapping follows the Copilot bundle in the locally cached VS Code 1.141.0. It is an implementation choice awaiting target-environment verification, not evidence that every custom GitHub Enterprise Server exposes that endpoint. Do not substitute `/api/v3`, use a repository path or fall back to GitHub.com on an error.

VS Code can handle Enterprise sign-in with multiple configured instances. This version delegates that login to the provider but blocks quota requests because the stable `AuthenticationSession` type pinned by the project does not expose the selected authorization server. It does not parse labels/session IDs or use proposed APIs to guess the host. At startup with a single configured origin, it relies on the built-in provider restricting its sessions to that instance. A change to the effective instance configuration during activation blocks further Enterprise session/HTTP requests until VS Code reloads: this prevents pairing a provider's old cached session with the new quota destination while its asynchronous configuration update is still pending. Real corporate acceptance remains pending.

## Lifecycle and transport

The provider and normalized Enterprise origins form the real service's source key. Changing them disposes the old service, cancels its request and invalidates late authentication/HTTP results through the existing generation checks. The old account/quota are cleared. Instance changes require reload before corporate authentication resumes; changing only the provider with the same instance does not. Session events only refresh the selected provider. Copilot provider changes affect `auto`; an explicit GitHub.com preference remains GitHub.com.

Configuration errors stay distinct from authentication errors and discard prior quota without network backoff. TLS validation, VS Code's proxy/certificate integration, the 10-second total timeout, 1 MiB response limit, cancellation and Retry-After behavior are retained. HTTP redirects are not followed. No tokens, response bodies or account identifiers are logged.

## References and validation scope

- [VS Code Copilot setup](https://code.visualstudio.com/docs/setup/copilot#use-copilot-with-a-ghe-account): the existing GitHub.com/GHE.com sign-in experience.
- [Stable authentication API](https://code.visualstudio.com/api/references/vscode-api#authentication.getSession): provider-specific consent and account selection.
- [Built-in Enterprise provider](https://github.com/microsoft/vscode/blob/113947563a3837013dbff0095e2bf29880b5d354/extensions/github-authentication/src/githubEnterprise.ts): filtering sessions by configured instances and native instance selection.
- [Enterprise configuration resolver](https://github.com/microsoft/vscode/blob/113947563a3837013dbff0095e2bf29880b5d354/extensions/github-authentication/src/common/enterpriseConfiguration.ts): plural precedence and workspace trust.
- [Copilot enterprise resolver](https://github.com/microsoft/vscode/blob/113947563a3837013dbff0095e2bf29880b5d354/extensions/copilot/src/platform/authentication/common/enterprise.ts): upstream authorization-server metadata, absent from this project's pinned stable session interface.

Regression tests cover unchanged GitHub.com behavior for synthetic personal/Business accounts, provider selection, separate preferences, cancelled login, host pairing, malformed settings, old/new provider manifests, explicit empty lists, untrusted configuration, selected-provider events, cross-host fallback prevention and obsolete in-flight work. Real Extension Development Host and installed-VSIX tests exercise settings and recovery without interactive sign-in.

Local validation on Windows 11 with standalone Node 26.11.1 / npm 11.20.0:

- `npm ci --no-audit --no-fund`: pinned dependencies installed; lockfile unchanged.
- `npm run check`: lint/types, 198 unit/regression tests and 8 release-script tests passed.
- `npm run test:integration`: 18 tests passed in each of VS Code 1.120.0 and 1.141.0.
- `npm run test:package`: 8 installed-VSIX tests and production package inspection passed.
- `npm audit`: zero vulnerabilities. `git diff --check`: passed.

Local test artifact: `dist/copilot-pace-1.1.3.vsix`, SHA-256 `85e48ef1b85e3ad9284d699730c2ba5ed66b5458fb2d8782238b0e86d4cdc6dd`. Its build record identifies base commit `4691dc6012631b7ed31b6fee4852e4023ab179dc` with `dirty: true`, not a committed/released candidate. It retains the current manifest version for local testing and must not replace the published 1.1.3 package.

These local results do not establish remote CI, Node 24 validation or successful authentication/quota access with a real personal, Business or Enterprise account. Before publication, prepare a new version, validate its final VSIX and record real-account acceptance, quota comparisons, cancellation/reconnection and corporate proxy/certificate behavior. Never replace an existing release or publish the development package under an already distributed version.

### Additional native login attempt

On October 19, the maintainer requested a real login check. The installed test package above was launched in additional isolated VS Code 1.141.0 profiles through the project's test runner:

- With a reserved `.invalid` Enterprise fixture and GitHub.com selected, the native Connect command stayed pending at provider selection, with no account or quota. This verifies the command reaches the native picker path, not corporate authentication or endpoint compatibility. Window capture failed after the documented recovery attempt, so no visual approval is recorded.
- With no corporate configuration, the native Connect command returned an authentication error. A direct call to VS Code's GitHub provider established the test-host restriction: `DialogService: refused to show dialog in tests`. The assertion expecting a pending login did not pass; this result must not be described as a successful real login or a confirmed application regression.
- The regular editor's user settings did not contain an Enterprise instance configuration. No corporate hostname was inferred, no credentials were entered or extracted, and no real account quota was validated.

The Windows Computer Use skill prohibits automating user authentication dialogs. Real account acceptance still requires user-completed sign-in outside the test runner and inspection of the resulting quota. The extra probe scripts/profiles are ignored local test material, not production source or VSIX content. The tested package hash and runtime source are unchanged.

### Regular desktop session check

On the maintainer's subsequent request to use Computer Use, the regular VS Code desktop window became accessible after activation. A read-only bundle comparison confirmed that the installed extension matches the tested candidate, including its provider setting. The editor is VS Code 1.142.0, separate from the two pinned test-host versions above.

The initial UI showed an authorization error with no quota. Running **Copilot Pace: Refresh Usage** through the command palette cleared the authorization error without an interactive login. The panel then displayed **Quota unavailable**, **Your budget or usage is unavailable**, and billing-cycle information. This records successful reuse of the existing GitHub.com session and a processed quota response, but not a usable credit budget or quota comparison for this account. No account identifiers or response bodies are recorded here.

Running **Copilot Pace: Connect GitHub** opened the native **The extension 'Copilot Pace' wants to sign in using GitHub** consent dialog. The agent stopped before interacting with that authentication dialog and requested user completion. The user reported completion, after which the panel again showed **Quota unavailable** without an authorization error. Repeating **Refresh Usage** reused the session without another login prompt and retained the same unavailable-budget state. This validates the native connection handoff and session reuse for the account present in this desktop session, not a new-session issuance, switching between accounts, numeric quota correctness or all personal/Business plans.

Enterprise validation remains pending because the regular editor did not have an Enterprise instance configured. The user confirmed that the corporate connection is on another computer. No corporate instance was added or changed in the regular profile, and no authentication credential was entered by the agent. The quota-normalization source was not changed by this feature; the unavailable-budget result requires separate investigation before accepting quota display for this account.

### Synthetic prueba.ghe.com simulation

At the maintainer's request, an isolated VS Code 1.141.0 profile was configured with `github-enterprise.uris: ["https://prueba.ghe.com"]` and `copilotPace.authProvider: "auto"`. The existing tested production package was loaded without rebuilding. Its connection command remained pending at provider selection; cancellation completed with the state still disconnected, no quota snapshot and the preference still `auto`. This native-host probe passed. Windows Computer Use could not capture the test window: `window id 1247380 no longer belongs to Microsoft.VisualStudioCode; current owner is Microsoft.VisualStudioCode`, repeated after the documented recovery attempt. No visual verification is claimed.

The existing connection activation regression suite was also run against that exact production bundle, substituting `prueba.ghe.com` for the corporate fixture. All 16 checks passed with synthetic authentication and intercepted HTTP requests, covering Enterprise provider/API pairing, both picker choices, switching back to GitHub.com, personal/Business defaults, cancellation and stale-session isolation. No credentials were sent to the example domain and no real Enterprise authentication or quota was validated. The isolated scripts/profile remain ignored under `.vscode-test/ghe-simulation-prueba`; the normal editor's settings and tested VSIX hash are unchanged.

Enterprise availability comes from VS Code's configured instance or the selected provider; it is not discovered from the corporate network or repository URL. With `auto`, merely configuring an instance makes provider selection available while GitHub.com remains the default unless Copilot is configured to use Enterprise.

### 1.2.0 pilot preflight

The maintainer requested a downloadable prerelease on October 19. The pilot uses version 1.2.0 with `preview: true`; it does not replace the stable 1.1.3 release or publish to Marketplace. Local preflight with standalone Node 26.11.1 / npm 11.20.0 passed `npm ci`, `npm run check` (198 unit/regression and 8 release-script tests), `npm run test:integration` (18 tests each on VS Code 1.120.0 and 1.141.0), `npm run test:package` (8 installed-package tests and content inspection), `npm audit` (zero vulnerabilities) and `git diff --check`.

Those local checks describe the prepared working tree. The final tagged CI run, clean commit, downloadable VSIX and checksum must be retained in the [1.2.0 release notes](https://github.com/rublaman/copilot-pace/releases/tag/v1.2.0). Publish the tested CI artifact unchanged; do not substitute the earlier dirty local 1.1.3 test build. Real corporate acceptance remains pending.
