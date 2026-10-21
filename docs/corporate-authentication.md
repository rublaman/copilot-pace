# Corporate authentication

Enterprise support was added in [#39](https://github.com/rublaman/copilot-pace/issues/39) and shipped in the 1.2.0 pilot. The maintainer accepted that pilot on GitHub.com and corporate GHE before stable 1.2.1 publication; see the [acceptance record](validation.md#githubcom-and-ghe-acceptance-october-19-2026). The implementation below includes the subsequent [switching and sign-out fixes](security-review.md). Historical test results are listed separately.

## Account selection

`copilotPace.authProvider` is an application preference:

| Value | Behavior |
| --- | --- |
| `auto` (default) | Follow `github.copilot.advanced.authProvider`; use GitHub.com otherwise |
| `github` | Use GitHub.com, including personal and Business accounts |
| `github-enterprise` | Use VS Code's configured Enterprise instance |

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
| Missing, invalid or multiple Enterprise origins | No session or HTTP quota request; localized configuration error |

This Enterprise API mapping follows the Copilot bundle in the locally cached VS Code 1.141.0 and is covered by the maintainer's subsequent GHE environment acceptance. It does not establish that every custom GitHub Enterprise Server exposes that endpoint. Do not substitute `/api/v3`, use a repository path or fall back to GitHub.com on an error.

The pinned stable `AuthenticationSession` type does not expose the selected authorization server. Pace therefore requires one valid origin before requesting a session or querying usage. It relies on the built-in provider restricting sessions to that instance; labels and session IDs are not used to infer a host. Effective instance changes block Enterprise session and HTTP requests until reload, because the provider may still expose an old cached session while applying its settings.

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

## Historical validation: October 19, 2026

The following checks preceded the published pilot and the maintainer's acceptance. Local Windows 11 validation used standalone Node 26.11.1 / npm 11.20.0:

- `npm ci --no-audit --no-fund`: pinned dependencies installed; lockfile unchanged.
- `npm run check`: lint/types, 198 unit/regression tests and 8 release-script tests passed.
- `npm run test:integration`: 18 tests passed in each of VS Code 1.120.0 and 1.141.0.
- `npm run test:package`: 8 installed-VSIX tests and production package inspection passed.
- `npm audit`: zero vulnerabilities. `git diff --check`: passed.

Local test artifact: `dist/copilot-pace-1.1.3.vsix`, SHA-256 `85e48ef1b85e3ad9284d699730c2ba5ed66b5458fb2d8782238b0e86d4cdc6dd`. Its build record identifies base commit `4691dc6012631b7ed31b6fee4852e4023ab179dc` with `dirty: true`, not a committed/released candidate. It retains the current manifest version for local testing and must not replace the published 1.1.3 package.

These were local checks of an uncommitted build. Published pilot CI and real-account acceptance are recorded in [validation.md](validation.md#githubcom-and-ghe-acceptance-october-19-2026).

### Additional native login attempt

The same package was tested in additional isolated VS Code 1.141.0 profiles:

- With a reserved `.invalid` Enterprise fixture and GitHub.com selected, Connect remained pending at provider selection, with no account or quota. Window capture failed, so this check has no visual verification.
- Without corporate configuration, Connect returned an authentication error. A direct provider call reported `DialogService: refused to show dialog in tests`. The assertion expecting a pending login failed because the test host blocked the dialog; no real login was validated.

Interactive acceptance requires sign-in outside the test runner. The probe scripts and profiles are ignored test material and excluded from the VSIX; the package hash above was unchanged.

### Regular desktop session check

The installed extension in the regular VS Code 1.142.0 profile matched the test package's bundle and provider setting. That profile had no Enterprise instance configured.

**Refresh Usage** cleared an authorization error using the existing GitHub.com session. The panel showed **Quota unavailable**, **Your budget or usage is unavailable**, and billing-cycle information. A quota response was processed, but it did not provide a usable budget for comparison.

**Connect GitHub** opened VS Code's consent dialog. After user-completed sign-in, the panel showed the same unavailable-budget state without an authorization error. Repeated refresh reused the session without a prompt. This checked connection handoff and session reuse; it did not check account switching, numeric quota correctness or all personal/Business plans.

The corporate connection was on another computer and was not tested in this profile. Quota normalization was unchanged; this result did not establish numeric quota acceptance for the desktop account.

### Synthetic prueba.ghe.com simulation

An isolated VS Code 1.141.0 profile loaded the same package with `github-enterprise.uris: ["https://prueba.ghe.com"]` and `copilotPace.authProvider: "auto"`. Connect remained pending at provider selection. Cancellation left the state disconnected with no quota and the preference still `auto`. The native-host probe passed; window capture failed, so there is no visual verification.

The connection activation suite also passed all 16 checks against that production bundle with `prueba.ghe.com` substituted for the corporate fixture. Authentication and HTTP requests were simulated; no credentials were sent to that domain. The ignored scripts/profile are under `.vscode-test/ghe-simulation-prueba`. The normal profile and VSIX hash were unchanged.

Enterprise availability comes from VS Code's configured instance or the selected provider; it is not discovered from the corporate network or repository URL. With `auto`, merely configuring an instance makes provider selection available while GitHub.com remains the default unless Copilot is configured to use Enterprise.

### 1.2.0 pilot preflight

Version 1.2.0 was prepared with `preview: true`. Local preflight with standalone Node 26.11.1 / npm 11.20.0 passed `npm ci`, `npm run check` (198 unit/regression and 8 release-script tests), `npm run test:integration` (18 tests each on VS Code 1.120.0 and 1.141.0), `npm run test:package` (8 installed-package tests and content inspection), `npm audit` (zero vulnerabilities) and `git diff --check`.

The final tagged CI run, commit, published VSIX and checksum are recorded in the [1.2.0 release notes](https://github.com/rublaman/copilot-pace/releases/tag/v1.2.0). The subsequent [acceptance record](validation.md#githubcom-and-ghe-acceptance-october-19-2026) covers the published pilot, rather than the earlier local 1.1.3 test build.
