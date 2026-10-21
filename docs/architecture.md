# Architecture

The extension separates quota calculations from authentication, HTTP transport and VS Code presentation. [Corporate authentication](corporate-authentication.md) covers provider selection and Enterprise host restrictions; [validation](validation.md) records automated and real-account results.

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

## Presentation

The status item is right-aligned with priority 100.05. The hover shows the account, pace, remaining credits, daily allowance, projection and last update. Monthly averages, cycle progress and renewal are in the detail panel. Daily allowance divides remaining credits by eligible days left and is omitted when either value is unavailable.

Pace states use `charts.green`, `charts.yellow` and `charts.red`. The panel's `data-tone` attribute applies the same color to status, percentage, usage bar and forecast. Stale, disconnected and unavailable states clear the pace color. CSS theme variables follow editor theme changes.

The hover escapes dynamic Markdown values and enables commands through `hoverCommands`. Its only HTML is a fixed status `span` using a theme color. The webview uses a nonce-based CSP, restricted local images and `textContent` for dynamic values. Its message handler accepts `ready`, `refresh`, `connect`, `dayMode` (`all` or `weekdays`) and `language` (`en` or `es-ES`).

`copilotPace.language` is an application setting, defaulting to `en`. The detail panel's language button reads **Spanish** in English and **Inglés** in Spanish. Switching language updates text, accessible labels and locale formatting in place, without fetching usage. Formatters use `en-US` or `es-ES`; dates and calculations remain in UTC.

## Quota contract

[VS Code configuration](https://github.com/microsoft/vscode/blob/main/product.json) selects `https://api.github.com/copilot_internal/user`. Its [quota service](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/services/chat/common/chatEntitlementService.ts) reads `token_based_billing` and `quota_snapshots.premium_interactions`.

For bounded quotas, `entitlement` supplies the budget, `quota_remaining` supplies the remaining credits and `percent_remaining` supplies the percentage. If credits are absent, usage can be derived from that percentage. `credits_used` represents usage without a known limit; it is not divided by an unrelated denominator. `has_quota` alone does not mean exhaustion. A quota-specific reset date takes precedence over the general reset.

Projections require a recognized UTC calendar-month cycle. Missing quotas, legacy billing or unknown shapes produce unavailable data. The extension never infers a budget from a plan name.

This is an internal endpoint without a guaranteed third-party API contract. Account authentication, network behavior and response values require real validation. See [validation](validation.md) for the acceptance procedure.

## Data limitations

The quota endpoint returns aggregate credits. It provides no daily or per-model breakdown, and the extension records no local usage history. Polling those totals cannot recover model identities or token counts.

Separate billing sources were reviewed on October 16, 2026: the [billing REST API](https://docs.github.com/en/rest/billing/usage) documents model-level credit quantities and the downloadable [AI usage report](https://docs.github.com/en/billing/reference/billing-reports) includes token counts. Both require billing access beyond the current quota session. At that review, the [automation tutorial](https://docs.github.com/en/billing/tutorials/automate-usage-reporting) and endpoint reference disagreed on fine-grained-token support. A billing integration would need its own authentication and access validation. Neither source is integrated here.

The [Copilot SDK](https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/usage-and-billing) reports its own sessions rather than global editor usage.

## Build and test boundaries

Development demos use synthetic responses with the same quota shape and a current UTC calendar. Tests inject fixed clocks. Production removes the demo adapter, translations and contributions; see [CONTRIBUTING.md](../CONTRIBUTING.md).

The bundle targets ES2022/CommonJS. Node 22 types constrain API usage; build-time Node is separate from VS Code's embedded runtime. Versions are pinned in the manifest/lockfile. Mocha overrides address the [diff](https://github.com/advisories/GHSA-73rr-hh4g-fpgx) and serialize-javascript [RCE](https://github.com/advisories/GHSA-5c6j-r48x-rmvq) / [CPU](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v) advisories. Recheck the audit when dependencies change.
