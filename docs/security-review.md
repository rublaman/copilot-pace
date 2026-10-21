# Account switching and sign-out review

Reviewed on October 20–21, 2026. Base: `develop` at `8049e2a`. Scope: authentication, account switching, sign-out and credential routing, with synthetic regression tests.

## Findings and changes

1. **Sign-in completion race.** A native session event can invalidate the interactive read before `getSession` saves access and account preferences. A silent lookup started before completion may return no session or the previous account. After login settles, Pace waits for that lookup and resolves the saved preference again. A synchronous event cannot replace the new operation with an invalidated one. Tests cover both event timings and providers, cancellation on sign-out/disposal, and preservation of rate limits and retry backoff.
2. **Ambiguous Enterprise configuration.** Multiple origins blocked HTTP quota requests but still allowed a native session request. Authentication now also requires exactly one valid origin. No cross-host credential disclosure was reproduced.

## Reviewed boundaries

| Scenario | Behavior and evidence |
| --- | --- |
| GitHub.com personal / Business | `github`, `read:user`, `api.github.com`. Account selection is independent of Copilot. Changing account clears quota even if the session ID is reused. |
| GitHub.com ↔ Enterprise | Service replacement aborts the old request and rejects late results. Tests use matching account IDs and check credential destinations in both directions. |
| Sign-out / access removal | Selected-provider events clear account, quota and timestamp, abort usage and refresh silently. Late results are discarded; other-provider events are ignored. |
| Other accounts remain signed in | Silent resolution may return another authorized account. Pace displays its identity and clears the old quota before querying usage. |
| Cancelled login / expired token | No fallback to the other provider. Authentication/authorization failures discard quota; a 401 requests renewed authorization only on an explicit connection action. |
| Enterprise destination changes | Instance changes block Enterprise authentication/requests until reload. Invalid, empty or multiple origins block authentication and HTTP. Untrusted workspace instance settings are ignored. |
| Transport | Fixed HTTPS quota destination per connection, no redirects or host fallback, normal TLS verification and VS Code proxy/certificate integration, timeout, cancellation and response-size limit. |
| Presentation / credentials | Escaped Markdown, webview `textContent`, nonce CSP and explicit action allowlists. Tokens are absent from service state, view models and hover output. No credential storage, telemetry or workspace reads. |

The [VS Code authentication API](https://code.visualstudio.com/api/references/vscode-api#authentication) delegates session selection and permissions to the editor. Its session-change event identifies the provider, without identifying the removed account; Pace therefore clears and re-resolves the selected provider rather than assuming which session changed.

## Validation

Coverage: `test/unit/connection-activation.test.ts`, `sessions.test.ts`, `service.test.ts`, `transport.test.ts` and `presentation.test.ts`. The activation harness uses the compiled extension with simulated authentication and HTTP. The host and package suites below run in VS Code without real sign-in.

Local Windows 11 validation with standalone Node 26.11.1 / npm 11.20.0 passed:

- `npm ci` and `npm run check`: lint/types, 221 unit/service tests and 8 release-script regressions. Thirteen added cases cover the delayed lookup and its cancellation/cooldown boundaries; the account regressions failed before the fix.
- `npm run test:integration`: 18 tests each on VS Code 1.120.0 and 1.141.0.
- `npm run test:package`: 8 installed-production-VSIX tests on VS Code 1.141.0 and package content inspection. The internal review document remains excluded from distribution.
- `npm audit`: zero vulnerabilities; `git diff --check` and local documentation links passed. Badge endpoints were checked on October 20.
- Comparison with `develop`: 1,120 view-model cases match. Panel text, accessibility attributes, controls and posted actions also match across those cases in both build modes; markup and minified CSS match after normalizing formatting.

These results apply to the October 21 follow-up to `984f904`. The local 1.2.1 VSIX is a test build, SHA-256 `7f72d73964d2bfea401bdb3b2a3be186d58187a55d48817a69592675193627df`. CI results for the committed changes are linked in the PR; published 1.2.1 artifacts are unchanged.

## Manual checks pending

Use an identified candidate VSIX in an isolated authorized profile, without recording credentials, full responses or account identifiers:

1. Keep a GitHub.com personal or Business account and one Enterprise account signed in. Switch Pace in both directions, verify the displayed account/quota, and confirm Copilot's account is unchanged.
2. Switch between two GitHub.com accounts, cancel an account picker, and cancel a fresh native login. Verify that any shown quota belongs to the displayed account.
3. Sign out of the active account through VS Code's Accounts menu with a refresh pending. Verify old quota disappears. Repeat while the other provider stays signed in, then sign out of that inactive provider and check the active display is unchanged.
4. With multiple authorized accounts on the same provider, sign out of the selected account. Verify the UI identifies any remaining session returned by VS Code, or shows **Connect GitHub** if none is available. Confirm a pending login cannot restore a removed session without new authorization.
5. Change the Enterprise instance, confirm the reload requirement, reload and reconnect to the intended instance. Check the corporate proxy/certificate path without disabling TLS.

The maintainer's earlier GitHub.com/GHE acceptance is recorded in [validation.md](validation.md). It does not establish results for this new switching/sign-out matrix, other Enterprise products or other networks.
