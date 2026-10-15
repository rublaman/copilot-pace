# Documentation screenshots

Captured on October 15, 2026, on Windows 11 with desktop VS Code 1.141.2. The extension UI comes from version 0.2.2 at source commit `d19b28211df5e727dbca62ed21f92047504777bd`.

| File | Source |
| --- | --- |
| `status-bar.png` | Development host, `10000-comfortable` scenario, dark theme. |
| `details-dark.png` | Development host, `10000-comfortable` scenario, Default Dark Modern. |
| `details-light.png` | Development host, `3900-over-pace` scenario, Default Light Modern. |
| `commands.png` | Production bundle loaded in an isolated development host, filtered Command Palette. No demo commands are contributed. |

The images are crops of the actual VS Code UI. They are not generated mockups. Demo labels and the simulated-data footer are retained in the usage examples. No real account, credentials or network responses were used for the captures.

Demo quotas are fixed; dates and calculated pace use the UTC clock at capture time. The dark example shows 4,000 of 10,000 credits used and projects to about 85% at renewal. The light example shows 2,340 of 3,900 credits used and projects to about 128% at renewal.

To refresh the usage examples, follow the development-host setup in [CONTRIBUTING.md](../../CONTRIBUTING.md), select the named demo scenario and open **Copilot Pace: Show Details**. Use an isolated profile so screenshots do not expose a real account or alter a contributor's normal settings. Capture the Command Palette from the production bundle to avoid presenting development-only commands as product features.

These files are documentation assets. The existing `docs/**` rule in `.vscodeignore` excludes them from the VSIX; packaging rewrites README image references to the corresponding repository commit.
