# Architecture

The extension separates quota calculations from authentication, HTTP transport and VS Code presentation. [CONTRIBUTING.md](../CONTRIBUTING.md#validation) describes automated checks.

## Data flow

`VS Code session → HTTPS transport → normalizer → snapshot → pace calculation → view model → status bar / hover / panel`

| Module | Responsibility |
| --- | --- |
| `domain.ts` | Quota normalization, UTC cycles and pure pace calculations |
| `connection.ts` | Provider resolution, validated Enterprise origins and matched quota destinations |
| `sessions.ts` | VS Code GitHub/GitHub Enterprise authentication with `read:user` |
| `transport.ts` | Matched HTTPS endpoint, cancellation, 10-second total timeout and 1 MiB response limit |
| `service.ts` | Deduplication, session changes, stale response rejection, retained snapshots and retry cooldowns |
| `view.ts` | Localized values and escaped Markdown hover |
| `i18n.ts` | English defaults and Spanish (Spain) strings |
| `presentation.ts` | Theme-aware webview with text-only values, nonce CSP and allowed actions |
| `extension.ts` | Status item, commands and one reusable detail panel |

The status item uses right alignment and priority 100.05. Pace states use VS Code theme colors; unavailable states clear the custom foreground. The panel provides labeled progress bars and keyboard focus. Messages are limited to `ready`, `refresh`, `connect`, `dayMode` (values `all` or `weekdays`) and `language` (values `en` or `es-ES`).

`copilotPace.language` defaults to `en`, independently of VS Code's display language, and is stored as an application-level preference. Only the detail panel has a language button: Spanish in English, Inglés in Spanish. A language change updates the existing panel's text, accessible labels and HTML language, plus the status and hover, without replacing the panel or fetching usage. Display formatters use `en-US` or `es-ES`, retaining UTC for dates and calculations. Pace classification and tone are language-independent. Authentication details and safe failure messages are localized in presentation; provider scopes and transport behavior are unchanged. Development-only translations are excluded from production with the demo adapter.

The hover summarizes pace status, remaining credits, daily allowance, projection and last update, retaining account identity, recovery messages and actions. It reuses the existing allowance calculation (remaining credits divided by remaining eligible days) and identifies the selected calendar as Mon–Sun or Mon–Fr (De lunes a domingo or De lunes a viernes in Spanish). The allowance is omitted when it cannot be calculated. Monthly averages, cycle progress and renewal stay in the detail panel. Today's usage is omitted even for a connected account: the quota source has no daily breakdown, and no midnight baseline or daily history is recorded. Credits are not tokens. The Comfortable indicator uses a text check to share the label's baseline. Unsupported model usage is omitted from the panel for all accounts and demos.

Pace colors consistently use `charts.green`, `charts.yellow` and `charts.red` in the status bar, hover and detail panel. The hover enables VS Code's sanitized HTML subset only for a fixed status `span` with a fixed theme-color variable; all dynamic Markdown values remain escaped and the command allowlist is unchanged. The panel sets a `data-tone` attribute on every update, coloring the status, percentage, usage bar and forecast while keeping the cycle bar and other labels neutral. CSS theme variables update automatically when the editor theme changes. Stale, disconnected and unavailable states clear the pace colors rather than implying a healthy quota.

Development demos use the same response contract with a current UTC calendar. Tests inject fixed clocks. Production removes the demo adapter and contributions; see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Quota contract

[VS Code configuration](https://github.com/microsoft/vscode/blob/main/product.json) selects `https://api.github.com/copilot_internal/user`. Its [quota service](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/services/chat/common/chatEntitlementService.ts) reads `token_based_billing` and `quota_snapshots.premium_interactions`.

For bounded quotas, `entitlement` supplies the budget, `quota_remaining` supplies the remaining credits and `percent_remaining` supplies the percentage. If credits are absent, usage can be derived from that percentage. `credits_used` represents usage without a known limit; it is not divided by an unrelated denominator. `has_quota` alone does not mean exhaustion. A quota-specific reset date takes precedence over the general reset.

Projections require a recognized UTC calendar-month cycle. Missing quotas, legacy billing or unknown shapes produce unavailable data. The extension never infers a budget from a plan name.

This is an internal endpoint without a guaranteed third-party API contract. Account authentication, network behavior and response values require real validation. See the [release guide](RELEASING.md#real-account-acceptance) for the acceptance procedure.

## Other sources and tooling

The [billing usage REST API](https://docs.github.com/en/rest/billing/usage) requires access appropriate to personal, organization or enterprise reports. The extension does not request administrative PATs. [Usage monitoring](https://docs.github.com/en/copilot/how-tos/manage-and-track-spending/monitor-ai-usage) and [budgets](https://docs.github.com/en/copilot/concepts/billing-and-usage/organizations-and-enterprises/budgets) describe assigned allowances; they do not establish a readable per-model breakdown for an employee.

Quota responses provide aggregate credits. This stable version does not store local usage history or expose per-model token usage.

The [Copilot SDK](https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/usage-and-billing) reports its own sessions and is not a source of global editor history.

The bundle targets ES2022/CommonJS. Node 22 types constrain API usage; build-time Node is separate from VS Code's embedded runtime. Versions are pinned in the manifest/lockfile. Mocha overrides address the [diff](https://github.com/advisories/GHSA-73rr-hh4g-fpgx) and serialize-javascript [RCE](https://github.com/advisories/GHSA-5c6j-r48x-rmvq) / [CPU](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v) advisories. Recheck the audit when dependencies change.
