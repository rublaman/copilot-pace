# Feature opportunities and competitor review

Research date: October 21, 2026. Repository reviewed: `develop` at `ecf9b2ef06dd4d7c55d807b837c0a23bbc5bf1f6`, manifest version `1.2.1`.

This is a feasibility and prioritization review, not an implementation or release plan. Competitor features below are publisher claims unless a source inspection is explicitly identified. No competing extension was installed, no private billing request was made, and no local conversations were read.

Follow-up: the feature branch adds exhaustion/excess estimates, observed local history and selectable status styles. The current-state tables below describe the reviewed base revision; see [architecture](architecture.md) and [validation](validation.md#forecast-history-and-status-styles-october-21-2026) for the implementation and its checks. Model-level analytics and alerts remain proposals.

## Recommendation

Extend Pace around three questions: **Will my credits last? What changed? Which models consumed them?** Keep the existing GitHub quota view as the default. Add lightweight forecasting and alerts first, then optional analytics with an explicit source, period and coverage description.

A model leaderboard is feasible. It needs a new data source: saving the existing quota responses cannot recover model identities. Start with an explicit import to validate the analytics contract, compare a GitHub AI usage report with a local trace export, and only then choose automatic collection. A direct billing integration has additional access and authentication constraints.

The strongest positioning hypothesis is a small Copilot-specific monitor for individual developers, including corporate users without billing administration. Account separation, trustworthy totals and clear coverage could differentiate it. This is a hypothesis from the comparison, not evidence of an unserved market or willingness to pay.

## Current product

The [README](../README.md), [architecture](architecture.md), manifest and `src/` agree on the current scope:

| Capability | Current state |
| --- | --- |
| GitHub quota and remaining credits | Implemented through the internal quota endpoint |
| Daily allowance and monthly projection | Implemented using elapsed UTC time; every day or Monday–Friday |
| Account selection | Independent Pace selection through VS Code GitHub/GitHub Enterprise authentication |
| Detail panel and status bar | Implemented, with English and Spanish (Spain) presentation |
| Model, token, session and daily consumption breakdowns | Absent |
| Persistent usage history and period comparison | Absent; the service retains the current snapshot in memory |
| Budget notifications and depletion date | Absent |
| Billing reports, local trace readers and exports | Absent |

`src/domain.ts` deliberately normalizes aggregate credit snapshots. `src/sessions.ts` requests `read:user`. No existing reader or history store supplies model usage. The architecture already records a billing-source review dated October 16, 2026; the findings below extend that review.

## Model usage: source options

“Most used” needs an explicit measure. Credits identify the largest budget consumers; model calls identify frequency; tokens identify volume. An agent prompt can generate several model calls, including calls to different models. These rankings can disagree.

| Source | Useful information | Constraint | Suggested role |
| --- | --- | --- | --- |
| Existing quota endpoint | Aggregate usage, allowance and reset | No model identities or call history | Keep as the default balance source |
| Official billing API | Model credit quantities, period filters | Billing ownership and additional access | Later integration after access validation |
| Downloaded GitHub AI usage report | Dated model consumption and token details | Manual report and appropriate billing access | First import format to evaluate |
| Local OTel trace export or database | Model calls, tokens and timing | Recording must be enabled; schema/version and local coverage constraints | Preferred local experiment |
| Copilot debug/session files | Potential call-level usage | Private formats, sensitive adjacent content and incomplete history | Targeted compatibility fallback |
| Pace's own saved quota snapshots | Observed changes in account totals | Cannot attribute changes to models or projects | History and trend features |

### Official APIs

GitHub documents `GET /users/{username}/settings/billing/ai_credit/usage`, with model quantities and year/month/day filters. Its fine-grained access requirement is user **Plan: read**. The organization equivalent is `/organizations/{org}/settings/billing/ai_credit/usage`, requiring administration read access. User reports exclude organization- or enterprise-billed licenses. These are distinct from the existing quota API. [Billing endpoint reference](https://docs.github.com/en/rest/billing/usage).

Do not assume Pace's current OAuth session can read billing. The [automation tutorial](https://docs.github.com/en/billing/tutorials/automate-usage-reporting) still says classic PATs are required, contradicting the endpoint reference on fine-grained support. Treat the endpoint-specific reference as the implementation starting point and validate the actual token/account combination. Under current project rules, adding independent credential storage would require a separate design decision.

The [Copilot usage metrics announcement](https://github.blog/changelog/2026-06-19-ai-credits-consumed-per-user-now-in-the-copilot-usage-metrics-api/) describes daily per-user credit totals without a model, feature or surface cost breakdown. It is not a substitute for model-level billing data.

### Downloadable report

The [AI usage report reference](https://docs.github.com/en/billing/reference/billing-reports) describes aggregation by date, model and username, with input/output and cache token fields, quantities and billing amounts. AI reports cover at most 31 days. Keep gross consumption distinct from the net bill after included usage and discounts: zero additional charges do not mean zero credits consumed.

An import could provide a useful first model panel without a new authentication flow. It must identify the account and reporting period, validate units, replace overlapping imports rather than append totals, and retain provenance. A normal corporate developer may need an authorized administrator to supply a report; importing a file does not remove the access restriction.

### Local files and OpenTelemetry

[VS Code's OTel guide](https://code.visualstudio.com/docs/agents/guides/monitoring-agents) documents local SQLite span export with `github.copilot.chat.otel.dbSpanExporter.enabled`, and a JSONL file exporter. Traces expose requested/resolved model identifiers and token counts. Content capture is separately configurable and off by default. This makes metadata-only local analytics a viable experiment; verify export behavior and setting availability against the supported versions before promising compatibility.

Source inspection corroborated the following details:

- Microsoft's [SQLite trace store](https://github.com/microsoft/vscode-copilot-chat/blob/5863f5a7088958050792b5dccbe8b46c6e13eccc/src/platform/otel/node/sqlite/otelSqliteStore.ts) stores model/token columns, spans and attributes. This inspected `main` commit is dated May 20, 2026; it does not prove what every installed Copilot version emits.
- Copilot Cost Tracker's [trace reader](https://github.com/Hoxlegion/copilot-cost-tracker-vsc/blob/cf651d490c8314f5ce2f9df64dfb2e939df68db5/src/parser/tracesDbReader.ts) reads `<VS Code User>/globalStorage/github.copilot-chat/agent-traces.db`. It looks for `copilot_chat.copilot_usage_nano_aiu` and divides by `1e9` when present. That is evidence of a consumer implementation, not a guaranteed Microsoft schema contract.
- Its [CLI parser](https://github.com/Hoxlegion/copilot-cost-tracker-vsc/blob/cf651d490c8314f5ce2f9df64dfb2e939df68db5/src/parser/cliSessionParser.ts) reads `<COPILOT_HOME>/session-state/<id>/events.jsonl` and handles durable usage receipts and cumulative checkpoints. CLI collection should be a later independent adapter.

On a default Windows Stable installation, the trace database candidate is `%APPDATA%\Code\User\globalStorage\github.copilot-chat\agent-traces.db`. Treat this as a discovery candidate, not a universal location: profiles, Insiders, portable and remote installations need separate handling. Prefer an explicitly selected export in the first experiment.

Recording starts when a source starts retaining data. Deleted/rotated logs, other machines, IDEs and cloud sessions may be missing. A GitHub total and a local total must never be added together: they overlap. Show them as separate observations of consumption. Do not assume the account selected in Pace owns every local record.

The [Language Model API](https://code.visualstudio.com/api/extension-guides/ai/language-model) documents invoking models from an extension. I found no documented global usage subscription there that would give Pace all Copilot calls. The [Copilot SDK usage guide](https://github.com/github/copilot-sdk/blob/main/docs/features/usage-and-billing.md) covers calls and accumulated metrics within SDK sessions; that is not an editor-wide billing history API.

## Competitor comparison

This is a targeted feature comparison, not a market-share or reliability ranking. Listings were reviewed on the research date. Claims about Enterprise support, exactness and privacy have not been accepted as independently validated facts.

| Product | Publisher-described features relevant to Pace | Implication |
| --- | --- | --- |
| [Copilot Insights](https://marketplace.visualstudio.com/items?itemName=emanuelebartolesi.vscode-copilot-insights) | Durable daily history, ideal-versus-actual chart, period comparison, weighted forecast, estimated project attribution, exports and chat tools | History and projection alone are already competitive baseline features |
| [Copilot Cost Tracker](https://marketplace.visualstudio.com/items?itemName=Hoxlegion.copilot-cost-tracker) | Model/workspace analytics, budget alerts, Chat/CLI sources, cache/context analysis, latency and source fallbacks | Strong direct competitor for detailed local analytics; a larger dashboard needs a clear reason |
| [AI Credits Monitor](https://marketplace.visualstudio.com/items?itemName=BoykaChongyangZhu.ai-credits-monitor) | Local Copilot and Claude Code consumption, period switching, model tables and daily charts | Multi-provider and model tables are already available together |
| [Tokenyst](https://marketplace.visualstudio.com/items?itemName=TokenystCopilot.tokenyst-copilot) | Chat/CLI sources, model/token/source/repository breakdowns, historical import and optimization suggestions | Local-only analytics and Chat/CLI consolidation are established directions |
| [Copilot Tracer](https://marketplace.visualstudio.com/items?itemName=sauercherry.copilot-tracer) | Daily allowance, saved-versus-expected budget, forecast, session delta and optional PAT route | Very close to Pace's compact budgeting use case; daily allowance is not unique |
| [Copilot Insights (Local)](https://marketplace.visualstudio.com/items?itemName=RajatJaiswal.copilot-insights) | Searchable session index, model/workspace analytics, exports and optional provider APIs | Conversation search would move Pace into a different and crowded product category |
| [UsageDock](https://marketplace.visualstudio.com/items?itemName=anshuman55a.usage-dock) | Unified status/sidebar for multiple AI providers | Multi-provider expansion introduces a much wider authentication and maintenance surface |
| [Native VS Code session history](https://code.visualstudio.com/docs/agents/run/sessions/session-history) | Chronicle history queries and `/chronicle:cost-tips`; experimental session sync | Native tools can absorb general session insights; avoid relying on those alone for differentiation |

Pace already has useful foundations: a focused panel, explicit workday pacing, localized presentation and tightly constrained account/host routing. The review does not establish that competitors lack those properties. Its potential advantage is delivering a smaller, understandable workflow with tested behavior for its actual supported environments.

## Prioritized opportunities

Effort is relative to this repository, not a delivery estimate. Priorities reflect product judgment from this review, without user-demand or adoption measurements.

| Priority | Feature | User decision it supports | Data and effort |
| --- | --- | --- | --- |
| P1 | Estimated depletion date and projected surplus/shortfall | Decide whether to reduce consumption before renewal | Existing snapshot; low |
| P1 | Optional forecast alerts with snooze and deduplication | Notice projected exhaustion without watching the panel | Existing snapshot; low–medium |
| P1 | Persistent observed history and ideal-versus-actual chart | Understand whether consumption accelerated | New normalized snapshot store; medium |
| P1 experiment | Model leaderboard from an explicit report/trace import | Identify the largest model consumers | New parser and analytics contract; medium |
| P2 | Automatic metadata-only local model collection | Keep the model view current without repeated imports | Versioned readers, identity and deduplication; high |
| P2 | Recent observed pace alongside cycle average | Respond to a change in working pattern | History with enough coverage; medium |
| P2 | Personal planning cap when GitHub provides usage without a known limit | Plan against a self-selected target | Separate local target, never presented as a GitHub limit; low–medium |
| P2 | Export normalized history/analytics and clear local data | Inspect records and share a selected summary | Redacted export and retention controls; medium |
| P2 | Optional work schedule and planned leave | Adjust the remaining workday allowance | Calendar configuration, UTC rules and tests; medium |
| P3 | Direct billing integration | Retrieve authorized reports automatically | Authentication/access design and real-account validation; high |
| P3 | CLI adapter and source-specific views | Understand Chat-versus-CLI consumption | Separate parser and reconciliation rules; high |
| Defer | Project attribution from quota deltas | Allocate spend to repositories | A focused window is not evidence that it caused a global quota change |
| Defer | Multi-provider dashboard, conversation search, automatic model switching | Broader agent management | Large scope; weak fit with Pace's current purpose |

### Proposed panel behavior

Keep the existing overview at the top. Add a depletion estimate and a concise explanation of the forecast basis. A collapsible history section can compare observed usage with the budget line.

An optional **Models** section should provide:

- Current cycle, last seven days and custom imported period where data allows it.
- A table sorted by credits, with model, credits, share of observed credits, model calls and token columns only when available. Never label model calls as user prompts.
- A choice between credits, calls and token volume; an explicit unknown-model category.
- A source label, capture/import start, last update and known gaps. Say “observed locally” rather than “all your usage” for a local source.
- An empty state that explains how to import/enable a supported source, without turning on recording automatically.

If different sources disagree, show their dates and scopes. Do not allocate an unexplained difference proportionally across models. Only present an attribution percentage when account, period, units and accounting scope can be reconciled; otherwise mark the values as not directly comparable.

## Implementation constraints

Keep quota fetching, history and detailed analytics separate. History should consume accepted normalized snapshots after the service's stale-response checks. Imported or local analytics should have their own provenance and coverage rather than extending every quota snapshot with guessed values.

For an initial store, a small versioned JSON file under `ExtensionContext.globalStorageUri` is sufficient for bounded snapshot history. Use atomic replacement and coordinate writers across VS Code windows. Retain only needed aggregates, keyed by provider, validated origin, account identity and cycle; keep demo data out. Larger call histories may justify SQLite later. The build-time Node version is not proof that a native or `node:sqlite` API is available in every supported VS Code host.

History needs explicit observation semantics:

- The first observation supplies a baseline, not the user's previous daily history.
- Differences between snapshots measure changes observed between two polls; they do not locate spend precisely within an overnight or offline gap.
- Gaps stay visible. Without a midnight boundary or finer source, “today” is not an exact total.
- Resets, entitlement changes, corrections and account switches must not become ordinary spend events.
- Keep UTC calculation boundaries independent of display language.

Detailed analytics needs call identifiers, resolved model when present, source/version, time, known token counts, credits when recorded, and whether cost is estimated. Deduplicate exports, resumed sessions, re-read files and parent/child trace totals. Do not sum session aggregates with their model-call children. Separate BYOK or another provider's consumption when identifiable. Unknown credits stay unknown rather than zero.

Retain metadata only; discard prompts, responses, tool arguments and repository paths unless a later explicit feature needs them. Local recording is an optional new capability and needs accurate privacy documentation. Existing account isolation, HTTPS destination restrictions, cancellation, backoff, CSP and action allowlists remain requirements.

## Candidate sequence and acceptance gates

1. **Forecast improvement:** show depletion/surplus and optional deduplicated alerts. Check zero usage, stale responses, early-cycle uncertainty, renewal, usage without a known limit and workday boundaries.
2. **Observed history:** add bounded retention, reset/export controls and a chart. Verify restart, two windows, incomplete days, corrections and account/host separation.
3. **Model feasibility experiment:** compare one authorized AI report and one metadata-only trace export against the corresponding GitHub totals. Record source versions and missing fields. Decide whether import alone is useful and which local source merits automation.
4. **Model MVP:** release only with accurate period, account, units, source and partial-coverage labels. Verify repeated imports, unknown models, missing credit fields, multi-model turns and nested agents.
5. **Optional automation:** evaluate local watchers, direct billing and CLI independently after the preceding evidence is available.

For a code implementation, run the project's required `check`; UI/activation changes also require integration tests, and manifest/build/packaging changes require package tests. No implementation or host tests were run for this documentation-only review. Real personal and corporate validation remains necessary for any new source.

## Open questions

- Does the intended corporate account permit an AI report export, and can a regular developer obtain their own filtered records?
- Which exact supported VS Code/Copilot versions produce model and credit fields in local traces? Current upstream documentation alone does not establish minimum-version coverage.
- Can a local record be tied reliably to the selected account and Enterprise origin without reading credentials or conversations?
- How much data survives recording changes, log rotation, profiles and remote development?
- Do users mainly want “which model costs most” or “which model I invoke most”? The initial credit ranking should make that distinction testable.
- Does the proposed compact and transparent workflow improve on existing alternatives enough to motivate switching? A handful of maintainer/user trials should precede a broad analytics dashboard.
