# Architecture

The extension separates quota calculations from authentication, HTTP transport and VS Code presentation. [CONTRIBUTING.md](../CONTRIBUTING.md#validation) describes automated checks.

## Data flow

`VS Code session → HTTPS transport → normalizer → snapshot → pace calculation → view model → status bar / hover / panel`

| Module | Responsibility |
| --- | --- |
| `domain.ts` | Quota normalization, UTC cycles and pure pace calculations |
| `history.ts` | Validated numeric observations, hashed account/origin identity and atomic daily journals per window |
| `status.ts` | Validated status appearance preference and native text indicators |
| `chart.ts` | Validated chart preferences, shared SVG dimensions and budget comparison tones |
| `history-view.ts` | Current-cycle chart points, budget paths, calendar ticks and localized history labels |
| `formatters.ts` | Shared English/Spanish number and UTC date formatters |
| `daily.ts` | Same-day observed credit differences and reported-day precedence |
| `billing.ts` | Optional current-cycle daily billing retrieval, account discovery, caching and fallback |
| `connection.ts` | Provider resolution, validated Enterprise origins and matched quota destinations |
| `sessions.ts` | VS Code GitHub/GitHub Enterprise authentication with `read:user` |
| `transport.ts` | Matched HTTPS endpoint, cancellation, 10-second total timeout and 1 MiB response limit |
| `service.ts` | Deduplication, session changes, stale response rejection, retained snapshots and retry cooldowns |
| `view.ts` | Localized values and escaped Markdown hover |
| `i18n.ts` | English defaults and Spanish (Spain) strings |
| `presentation.ts` | Theme-aware webview with text-only values, nonce CSP and allowed actions |
| `webview.ts` | Typed browser rendering and panel action handlers |
| `extension.ts` | Status item, commands and one reusable detail panel |

## Presentation

The status item is right-aligned with priority 100.05. The hover shows the account, pace, remaining credits, daily allowance, projection and last update. Monthly averages, cycle progress and renewal are in the detail panel. Daily allowance divides remaining credits by eligible days left and is omitted when either value is unavailable.

Pace states use `charts.green`, `charts.yellow` and `charts.red`. The panel's `data-tone` attribute applies the same color to status, percentage, usage bar and forecast. Stale, disconnected and unavailable states clear the pace color. CSS theme variables follow editor theme changes.

The hover escapes dynamic Markdown values and enables commands through `hoverCommands`. Its only HTML is a fixed status `span` using a theme color. The webview uses a nonce-based CSP, restricted local images and `textContent` for dynamic values. Its message handler accepts `ready`, `refresh`, `connect`, `openHistory`, `revealHistory`, `dayMode` (`all` or `weekdays`), `language` (`en` or `es-ES`), `statusStyle` (`text`, `compact`, `bar` or `dots`), `chartStyle` (`line` or `columns`) and `chartMetric` (`cumulative` or `daily`). History actions resolve a journal from the active account identity in the extension host; they never accept a path from the webview. Paths remain in the host; the model exposes only whether the actions are available. Account changes disable the actions and invalidate pending file lookups/opens. History content does not become a webview resource.

Unavailable quotas carry reason codes, and HTTP failures carry their status separately from the diagnostic message. Localization uses these fields rather than matching English sentences. The panel script is TypeScript checked by the same lint/type commands as the host. The build compiles it for the browser and embeds the result in the nonce-authorized script; watch mode tracks its source dependencies. Production compilation removes its demo controls. Chart construction, the HTML template and the browser renderer share the dimensions in `chart.ts`.

`copilotPace.statusStyle` defaults to the existing percentage-and-pace label. Compact, segmented and dot indicators use native status item text; errors and pending estimates remain explicit, and accessibility labels retain the percentage and pace. The dropdown changes only presentation. A divided **Customization / Personalización** section below the history chart groups language, status appearance and chart style; account and refresh controls remain in the footer.

Exhaustion and excess are calculated from the last accepted snapshot's cycle average, anchored to its timestamp. Weekday exhaustion skips weekends in UTC. No new forecast is shown after a failed refresh or outside a known cycle. Excess represents projected credits above the quota, not an additional invoice amount.

## Local observations

After the service accepts a successful response, the extension records normalized numbers under `globalStorageUri`. A SHA-256 key separates provider, validated origin and account ID; labels and credentials are not stored. Each window writes a private daily journal using a unique temporary file and atomic rename. Readers merge journals, deduplicate timestamps and remove expired daily files after 90 days. Separate journals avoid shared-file write races and abandoned locks. A read or write failure is displayed without failing quota refreshes.

Only bounded or usage-only snapshots with known cycles are recorded. Pending/stale responses and demos are excluded. Account changes clear the visible history immediately; asynchronous storage completions must still match the selected identity before updating the panel. The current-cycle SVG uses numeric coordinates and text-only point titles. It connects observations only within two hours with nondecreasing usage and an unchanged budget. Unknown intervals and corrections remain disconnected; the dashed budget line follows the selected calendar.

The saved `copilotPace.chartStyle` defaults to Line; saved Area or unsupported values resolve to Line. Line views use disconnected segments. In cumulative mode, columns select the last observation per UTC day. The separate `copilotPace.chartMetric` preference defaults to cumulative and has a Daily / Cumulative switch above the chart. Daily columns represent that day's consumption; known adjacent days connect in Line mode. Missing days stay empty. Both styles use theme colors, explicit credit labels and a calendar-aware budget legend. The reference endpoint is labeled with the cycle budget or daily calendar limit. Weekday daily charts show short UTC dates at Saturday/Monday transitions, staggered on narrow cards. Style and metric changes do not fetch quota or change stored observations. SVG assets are local; CSP permissions remain unchanged.

Chart colors compare each daily total with its calendar-adjusted daily budget, or each cumulative observation with the budget elapsed at that timestamp. Values at the reference remain green; values above it are red. Unknown budgets stay neutral. Columns and point labels use their value's comparison; line paths use local SVG clip regions along the budget path so colors change at crossings without bridging missing intervals. All colors use editor theme variables, and the legend and point labels describe the comparison in text. Partial observations keep their partial labels and outlines.

### Optional daily billing

After publishing an accepted credit snapshot, the service starts a background billing read with the same VS Code session. It first verifies `/user` against the selected account ID, then tries a personal report or an unambiguous organization/enterprise report. Organization hints come from the quota response; a read-only GraphQL viewer query can discover accessible organizations and enterprise slugs. Identifiers are validated, reports for managed scopes always filter by the verified login, and multiple/truncated payer lists are not combined or guessed. Unsupported discovery or billing responses use local history.

The official `ai_credit/usage` report is queried for the current UTC cycle, using a monthly credit report to validate the payer and units before daily reads. Account identity, reporting period and nonnegative credit quantities are checked. Consumption uses `grossQuantity`, including credits covered by the plan, rather than net billed quantities. Legacy request counts are not converted to credits. Other users' records and unrecognized responses are rejected.

Billing uses the existing transport's matched HTTPS API origin, TLS/proxy integration, response limit, cancellation and timeout. A pass is limited to 40 requests and 30 seconds. It caches current/previous-day reports for one hour and older reports for 24 hours in memory; unavailable discovery is retried after 24 hours. Rate limits honor Retry-After and also delay subsequent quota reads. Redirects and cross-host fallback remain blocked. No additional authentication scopes, separate credentials or user-facing backend selector are introduced.

Background results must still match the current session, account, snapshot and service generation. A refresh, disconnect, account/provider change or disposal cancels earlier reads. Billing failures do not discard accepted quota or trigger reconnection. Demos never invoke billing. No complete API response, model record or discovery result is persisted.

For missing report days, local daily values sum only adjacent nondecreasing observations within two hours, with the same budget and UTC day. Midnight differences, long gaps and corrections are not attributed to a day. Reported days replace local values without addition. Local values and the ongoing UTC day are labeled Partial; API billing delays remain possible. Real-account acceptance of billing is separate from the previously accepted quota runtime.

`copilotPace.language` is an application setting, defaulting to `en`. The detail panel's language button reads **Spanish** in English and **Inglés** in Spanish. Switching language updates text, accessible labels and locale formatting in place, without fetching usage. Formatters use `en-US` or `es-ES`; dates and calculations remain in UTC.

## Quota contract

[VS Code configuration](https://github.com/microsoft/vscode/blob/main/product.json) selects `https://api.github.com/copilot_internal/user`. Its [quota service](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/services/chat/common/chatEntitlementService.ts) reads `token_based_billing` and `quota_snapshots.premium_interactions`.

For bounded quotas, `entitlement` supplies the budget, `quota_remaining` supplies the remaining credits and `percent_remaining` supplies the percentage. If credits are absent, usage can be derived from that percentage. `credits_used` represents usage without a known limit; it is not divided by an unrelated denominator. `has_quota` alone does not mean exhaustion. A quota-specific reset date takes precedence over the general reset.

Projections require a recognized UTC calendar-month cycle. Missing quotas, legacy billing or unknown shapes produce unavailable data. The extension never infers a budget from a plan name.

This is an internal endpoint without a guaranteed third-party API contract. Account authentication, network behavior and response values require real validation. See the [release guide](RELEASING.md#real-account-acceptance) for the acceptance procedure.

## Data limitations

The quota endpoint returns aggregate credits. It provides no daily or per-model breakdown. Local history contains observations collected by Pace, not reconstructed daily consumption. Polling those totals cannot recover model identities, project attribution or token counts.

The [Copilot SDK](https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/usage-and-billing) reports its own sessions rather than global editor usage.

## Build and test boundaries

Development demos use synthetic responses with the same quota shape and a current UTC calendar. Tests inject fixed clocks. Production removes the demo adapter, translations and contributions; see [CONTRIBUTING.md](../CONTRIBUTING.md).

The bundle targets ES2022/CommonJS. Node 22 types constrain API usage; build-time Node is separate from VS Code's embedded runtime. Versions are pinned in the manifest/lockfile. Mocha overrides address the [diff](https://github.com/advisories/GHSA-73rr-hh4g-fpgx) and serialize-javascript [RCE](https://github.com/advisories/GHSA-5c6j-r48x-rmvq), [CPU](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v) and [XSS](https://github.com/advisories/GHSA-m5mm-p8h7-m29v) advisories.

The Azure Identity dependency used by `@vscode/vsce` has a scoped MSAL Node 7.1.1 override for the [authorization-code disclosure advisory](https://github.com/advisories/GHSA-xcx6-jx8p-x3h5); Azure Identity's declared MSAL 6.x range excludes the fixed version. These dependencies belong to development and packaging tools and are excluded from the VSIX. Recheck the audit and the upstream dependency ranges when updating the overrides.
