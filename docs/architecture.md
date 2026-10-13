# Architecture

Synthetic fixtures exercise the response contract; they are not captured corporate traffic.

## Data flow

`VS Code session → HTTPS transport → normalizer → snapshot → pace calculation → view model → status bar / hover / panel`

| Module | Responsibility |
| --- | --- |
| `domain.ts` | Quota normalization, UTC cycles and pure pace calculations |
| `sessions.ts` | VS Code GitHub authentication with `read:user` |
| `transport.ts` | Fixed HTTPS endpoint, cancellation, 10-second total timeout and 1 MiB response limit |
| `service.ts` | Deduplication, session changes, stale response rejection, retained snapshots and retry cooldowns |
| `view.ts` | English presentation and escaped Markdown hover |
| `presentation.ts` | Theme-aware webview with text-only values, nonce CSP and allowed actions |
| `extension.ts` | Status item, commands and one reusable detail panel |

The status item uses right alignment and priority 100.05. Pace states use VS Code theme colors; unavailable states clear the custom foreground. The panel provides labeled progress bars and keyboard focus. Messages are limited to `ready`, `refresh`, `connect` and `dayMode`, whose values are `all` or `weekdays`.

Development demos use the same response contract with a current UTC calendar. Tests inject fixed clocks. Production removes the demo adapter and contributions; see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Quota contract

[VS Code configuration](https://github.com/microsoft/vscode/blob/main/product.json) selects `https://api.github.com/copilot_internal/user`. Its [quota service](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/services/chat/common/chatEntitlementService.ts) reads `token_based_billing` and `quota_snapshots.premium_interactions`.

For bounded quotas, `entitlement` supplies the budget, `quota_remaining` supplies the remaining credits and `percent_remaining` supplies the percentage. If credits are absent, usage can be derived from that percentage. `credits_used` represents usage without a known limit; it is not divided by an unrelated denominator. `has_quota` alone does not mean exhaustion. A quota-specific reset date takes precedence over the general reset.

Projections require a recognized UTC calendar-month cycle. Missing quotas, legacy billing or unknown shapes produce unavailable data. The extension never infers a budget from a plan name.

This is an internal endpoint without a guaranteed third-party API contract. Account authentication, network behavior and response values require real validation. See [validation](validation.md) for the acceptance procedure.

## Other sources and tooling

The [billing usage REST API](https://docs.github.com/en/rest/billing/usage) requires access appropriate to personal, organization or enterprise reports. The extension does not request administrative PATs. [Usage monitoring](https://docs.github.com/en/copilot/how-tos/manage-and-track-spending/monitor-ai-usage) and [budgets](https://docs.github.com/en/copilot/concepts/billing-and-usage/organizations-and-enterprises/budgets) describe assigned allowances; they do not establish a readable per-model breakdown for an employee.

The [Copilot SDK](https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/usage-and-billing) reports its own sessions and is not a source of global editor history.

The bundle targets ES2022/CommonJS. Node 22 types constrain API usage; build-time Node is separate from VS Code's embedded runtime. Versions are pinned in the manifest/lockfile. Mocha overrides address the [diff](https://github.com/advisories/GHSA-73rr-hh4g-fpgx) and serialize-javascript [RCE](https://github.com/advisories/GHSA-5c6j-r48x-rmvq) / [CPU](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v) advisories. Recheck the audit when dependencies change.
