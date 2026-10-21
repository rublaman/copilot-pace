# Architecture

The extension separates quota calculations from authentication, HTTP transport and VS Code presentation. [Corporate authentication](corporate-authentication.md) covers provider selection and Enterprise host restrictions; [validation](validation.md) records automated and real-account results.

## Data flow

`VS Code session → HTTPS transport → normalizer → snapshot → pace calculation → view model → status bar / hover / panel`

| Module | Responsibility |
| --- | --- |
| `domain.ts` | Quota normalization, UTC cycles and pure pace calculations |
| `history.ts` | Validated numeric observations, hashed account/origin identity and atomic daily journals per window |
| `status.ts` | Validated status appearance preference and native text indicators |
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

The hover escapes dynamic Markdown values and enables commands through `hoverCommands`. Its only HTML is a fixed status `span` using a theme color. The webview uses a nonce-based CSP, restricted local images and `textContent` for dynamic values. Its message handler accepts `ready`, `refresh`, `connect`, `dayMode` (`all` or `weekdays`), `language` (`en` or `es-ES`) and `statusStyle` (`text`, `compact`, `bar` or `dots`).

`copilotPace.statusStyle` defaults to the existing percentage-and-pace label. Compact, segmented and dot indicators use native status item text; errors and pending estimates remain explicit, and accessibility labels retain the percentage and pace. The dropdown changes only presentation.

Exhaustion and excess are calculated from the last accepted snapshot's cycle average, anchored to its timestamp. Weekday exhaustion skips weekends in UTC. No new forecast is shown after a failed refresh or outside a known cycle. Excess represents projected credits above the quota, not an additional invoice amount.

## Local observations

After the service accepts a successful response, the extension records normalized numbers under `globalStorageUri`. A SHA-256 key separates provider, validated origin and account ID; labels and credentials are not stored. Each window writes a private daily journal using a unique temporary file and atomic rename. Readers merge journals, deduplicate timestamps and remove expired daily files after 90 days. Separate journals avoid shared-file write races and abandoned locks. A read or write failure is displayed without failing quota refreshes.

Only bounded or usage-only snapshots with known cycles are recorded. Pending/stale responses and demos are excluded. Account changes clear the visible history immediately; asynchronous storage completions must still match the selected identity before updating the panel. The current-cycle SVG uses numeric coordinates and text-only point titles. It connects observations only within two hours with nondecreasing usage and an unchanged budget. Unknown intervals and corrections remain disconnected; the dashed budget line follows the selected calendar.

`copilotPace.language` is an application setting, defaulting to `en`. The detail panel's language button reads **Spanish** in English and **Inglés** in Spanish. Switching language updates text, accessible labels and locale formatting in place, without fetching usage. Formatters use `en-US` or `es-ES`; dates and calculations remain in UTC.

## Quota contract

[VS Code configuration](https://github.com/microsoft/vscode/blob/main/product.json) selects `https://api.github.com/copilot_internal/user`. Its [quota service](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/services/chat/common/chatEntitlementService.ts) reads `token_based_billing` and `quota_snapshots.premium_interactions`.

For bounded quotas, `entitlement` supplies the budget, `quota_remaining` supplies the remaining credits and `percent_remaining` supplies the percentage. If credits are absent, usage can be derived from that percentage. `credits_used` represents usage without a known limit; it is not divided by an unrelated denominator. `has_quota` alone does not mean exhaustion. A quota-specific reset date takes precedence over the general reset.

Projections require a recognized UTC calendar-month cycle. Missing quotas, legacy billing or unknown shapes produce unavailable data. The extension never infers a budget from a plan name.

This is an internal endpoint without a guaranteed third-party API contract. Account authentication, network behavior and response values require real validation. See [validation](validation.md) for the acceptance procedure.

## Data limitations

The quota endpoint returns aggregate credits. It provides no daily or per-model breakdown. Local history contains observations collected by Pace, not reconstructed daily consumption. Polling those totals cannot recover model identities, project attribution or token counts.

Separate billing sources were reviewed on October 16, 2026: the [billing REST API](https://docs.github.com/en/rest/billing/usage) documents model-level credit quantities and the downloadable [AI usage report](https://docs.github.com/en/billing/reference/billing-reports) includes token counts. Both require billing access beyond the current quota session. At that review, the [automation tutorial](https://docs.github.com/en/billing/tutorials/automate-usage-reporting) and endpoint reference disagreed on fine-grained-token support. A billing integration would need its own authentication and access validation. Neither source is integrated here.

The [Copilot SDK](https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/usage-and-billing) reports its own sessions rather than global editor usage.

## Build and test boundaries

Development demos use synthetic responses with the same quota shape and a current UTC calendar. Tests inject fixed clocks. Production removes the demo adapter, translations and contributions; see [CONTRIBUTING.md](../CONTRIBUTING.md).

The bundle targets ES2022/CommonJS. Node 22 types constrain API usage; build-time Node is separate from VS Code's embedded runtime. Versions are pinned in the manifest/lockfile. Mocha overrides address the [diff](https://github.com/advisories/GHSA-73rr-hh4g-fpgx) and serialize-javascript [RCE](https://github.com/advisories/GHSA-5c6j-r48x-rmvq) / [CPU](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v) advisories. Recheck the audit when dependencies change.
