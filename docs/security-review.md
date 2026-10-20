# Account switching and sign-out review

Reviewed on October 20, 2026, against `develop` at `8049e2a` and the changes in this branch. This is a focused source review with synthetic regression coverage, not an independent security certification or a new real-account acceptance record.

## Findings and changes

1. **Sign-in completion race (reproduced and fixed).** VS Code can emit a session event before an interactive `getSession` call has finished granting access and saving the selected account preference. Pace correctly invalidates the pending read, but its immediate silent refresh can find no session yet and leave the UI disconnected after successful login. After an invalidated interactive read settles, Pace now checks the current session silently. It never reuses the invalidated login result. Regression tests reproduce the original failure for both GitHub.com and Enterprise and verify that a late login after sign-out cannot restore access or quota.
2. **Ambiguous Enterprise configuration (hardening).** Several configured Enterprise origins already blocked quota requests at the transport boundary, but Pace still requested a native authentication session first. Authentication now also requires exactly one valid origin, before any silent or interactive session request. No cross-host credential disclosure was reproduced.

## Reviewed boundaries

| Scenario | Behavior and evidence |
| --- | --- |
| GitHub.com personal / Business | Both use `github` with `read:user` and `api.github.com`. Native account selection belongs to Pace independently of Copilot. Account changes clear the previous quota, including when session IDs are reused. |
| GitHub.com ↔ Enterprise | Replacing the service aborts the old request and invalidates late authentication/results. Tests use matching account IDs across providers and verify token-to-host pairing in both directions. |
| Sign-out / access removal | A selected-provider session event clears account, quota and timestamp immediately, cancels pending usage, and refreshes silently. A late network response or interactive login result cannot repopulate the cleared state. Unrelated-provider events leave the active state unchanged. |
| Other accounts remain signed in | VS Code may return another authorized session during silent resolution. Pace displays that account and clears the previous quota before reading its usage. Pace does not pin a signed-out account or sign accounts out globally. |
| Cancelled login / expired token | No fallback to the other provider. Authentication/authorization failures discard quota; a 401 requests renewed authorization only on an explicit connection action. |
| Enterprise destination changes | Effective instance changes block further Enterprise authentication/requests until reload. Invalid, empty or multiple origins cannot route a quota request. Untrusted workspace instance settings are ignored. |
| Transport | Fixed HTTPS quota destination per connection, no redirects or host fallback, normal TLS verification and VS Code proxy/certificate integration, timeout, cancellation and response-size limit. |
| Presentation / credentials | Account labels are escaped in Markdown and inserted as text in the nonce-protected webview. Explicit message/command allowlists remain. Session tokens are absent from service state, view models and hover output; no new credential storage, logs, telemetry or workspace reads were added. |

The [VS Code authentication API](https://code.visualstudio.com/api/references/vscode-api#authentication) delegates session selection and permissions to the editor. Its session-change event identifies the provider, without identifying the removed account; Pace therefore clears and re-resolves the selected provider rather than assuming which session changed.

## Validation

Automated coverage is in `test/unit/connection-activation.test.ts`, `sessions.test.ts`, `service.test.ts`, `transport.test.ts` and `presentation.test.ts`. The activation harness runs the compiled extension against simulated native services; it does not sign in to real GitHub accounts. Actual VS Code host and installed-package checks are recorded separately in the pull request.

Local Windows 11 validation with standalone Node 26.11.1 / npm 11.20.0 passed:

- `npm ci` and `npm run check`: lint/types, 208 unit/service tests and 8 release-script regressions.
- `npm run test:integration`: 18 tests each on VS Code 1.120.0 and 1.141.0.
- `npm run test:package`: 8 installed-production-VSIX tests on VS Code 1.141.0 and package content inspection. The internal review document remains excluded from distribution.
- `npm audit`: zero vulnerabilities; `git diff --check`, local documentation links and all four badge endpoints also passed.

These results apply to the development working tree. The local package retains manifest version 1.2.1 for testing and is not a new release or a replacement for the published 1.2.1 artifact. Remote CI validates the PR commit separately; no version, tag or published asset is changed here.

## Manual acceptance still required

Use an identified candidate VSIX in an isolated authorized profile, without recording credentials, full responses or account identifiers:

1. Keep a GitHub.com personal or Business account and one Enterprise account signed in. Switch Pace in both directions, verify the displayed account/quota, and confirm Copilot's account is unchanged.
2. Switch between two GitHub.com accounts, cancel an account picker, and cancel a fresh native login. Verify that any shown quota belongs to the displayed account.
3. Sign out of the active account through VS Code's Accounts menu with a refresh pending. Verify old quota disappears. Repeat while the other provider stays signed in, then sign out of that inactive provider and check the active display is unchanged.
4. With multiple authorized accounts on the same provider, sign out of the selected account. Verify the UI identifies any remaining session returned by VS Code, or shows **Connect GitHub** if none is available. Confirm a pending login cannot restore a removed session without new authorization.
5. Change the Enterprise instance, confirm the reload requirement, reload and reconnect to the intended instance. Check the corporate proxy/certificate path without disabling TLS.

The maintainer's earlier GitHub.com/GHE acceptance is recorded in [validation.md](validation.md). It does not establish results for this new switching/sign-out matrix, other Enterprise products or other networks.
