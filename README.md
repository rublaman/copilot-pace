# Copilot Pace

GitHub Copilot credit usage and estimated daily pace in your VS Code status bar.

**Tested with synthetic data; real account and corporate network validation is pending.** The extension uses an internal GitHub endpoint that may change. It targets GitHub.com on desktop VS Code for Windows. GHE.com and GitHub Enterprise Server are unsupported.

## Install and connect

Requires VS Code 1.120 or later. Install the VSIX downloaded from a test artifact or release:

```powershell
code --install-extension .\copilot-pace-<version>.vsix
```

Reload an open editor after upgrading. Run **Copilot Pace: Connect GitHub** and authorize access through VS Code. This authorization is separate from Copilot's own connection.

The hover and detail panel identify the GitHub account being queried. Use **Switch GitHub account…** to choose another account through VS Code, or **Reconnect GitHub** when authorization needs renewing. Copilot Pace displays one account at a time; selecting it does not change Copilot's own account.

Hover over the status item for remaining credits, daily allowance and projected usage. Click for details, or run **Copilot Pace: Show Details**. Use **Copilot Pace: Refresh Usage** to refresh manually.

## Reading the estimate

Figures represent credits. The percentage and budget come from Copilot's quota snapshot; the extension does not infer a budget from your plan name.

| Measure | Calculation |
| --- | --- |
| Your average | Used credits / elapsed eligible days |
| Available per day | Remaining credits / eligible days left |
| Cycle baseline | Budget / eligible days in the cycle |
| Projected at renewal | Used credits + daily average × eligible days left |

**Comfortable** (green) means projected usage below 90% of budget, **On track** (yellow) means 90–100%, and **Over pace** (red) means above 100%. Before one eligible day has elapsed, the status shows **Calculating pace**. A failed refresh marks retained data **Out of date**.

Calculations use UTC and include partial days. **Every day / Mon–Fri** selects the calendar; Mon–Fri excludes weekends without a holiday calendar. Projections require a known budget and a recognized monthly cycle. Daily history, individual sessions and usage by model are unavailable.

## Settings

| Setting | Default | Values |
| --- | --- | --- |
| `copilotPace.dayMode` | `all` | `all`, `weekdays` |
| `copilotPace.pollIntervalMinutes` | `15` | 5–120 minutes |

Settings apply to the application. Production packages use GitHub data and ignore old demo settings.

## Privacy and status

VS Code manages authentication with `read:user`. The extension does not read workspace files or conversations, log tokens or response bodies, or send telemetry. Requests use HTTPS with TLS verification. Corporate proxies and certificates require testing in the target environment.

Licensed under [MIT](LICENSE). Marketplace publication is pending. For development and demo scenarios, see [CONTRIBUTING.md](CONTRIBUTING.md). Report problems in [GitHub Issues](https://github.com/rublaman/copilot-pace/issues).
