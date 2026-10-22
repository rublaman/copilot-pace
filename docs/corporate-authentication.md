# Corporate authentication

This guide describes provider selection, Enterprise configuration and credential routing. See the [README](../README.md#choose-the-right-account) for setup and [CONTRIBUTING.md](../CONTRIBUTING.md#validation) for automated validation commands.

## Account selection

`copilotPace.authProvider` is an application preference:

| Value | Behavior |
| --- | --- |
| `auto` (default) | Follow `github.copilot.advanced.authProvider`; use GitHub.com otherwise |
| `github` | Use GitHub.com, including personal and Business accounts |
| `github-enterprise` | Use VS Code's configured Enterprise instances |

A corporate instance configured for another extension does not automatically change Pace's provider. With no Enterprise configuration, Connect keeps the original GitHub.com flow without an additional picker. When Enterprise is configured, Connect/Switch offers the two providers through a native Quick Pick, with the current provider first. The choice is saved for Pace only; resetting the preference to `auto` follows Copilot again. After changing Enterprise instance settings while Pace is active, reload VS Code before using the corporate connection; GitHub.com remains available.

After provider selection, VS Code owns consent, account selection and sign-in through the stable `authentication.getSession` API. Both providers request only `read:user`. Background refresh always uses `silent: true`. Cancelling provider selection leaves the account, quota and settings unchanged; cancelled or rejected authentication never starts the other provider's login. Connect calls share one pending operation to avoid duplicate pickers.

Copilot's own account and configuration are never modified. Pace does not store tokens, read repository files, infer a host from Git remotes, collect telemetry or provide a credential form. The selected single Enterprise host appears alongside the account in the existing escaped presentation.

## Enterprise configuration and routing

`connection.ts` resolves an immutable provider/origin context. The extension inspects the installed built-in GitHub Authentication manifest to determine which settings it actually supports:

| Tested editor | Settings recognized by its provider |
| --- | --- |
| VS Code 1.120.0 | `github-enterprise.uri` |
| VS Code 1.141.0 | `github-enterprise.uris`, or the deprecated singular setting when no plural value is explicitly set |

An explicit plural empty list disables instances and does not fall back to the singular URI. Unsupported plural settings on older providers are ignored. In untrusted workspaces, only user-level Enterprise instance values participate. Granting trust recomputes the connection.

Enterprise origins must be HTTPS DNS hosts, optionally with port 443 and a trailing slash. Login/project/repository paths, credentials, query strings, fragments, IP addresses, local hostnames, nondefault ports and GitHub.com hosts are rejected. Only a single distinct normalized origin can be used for quota queries.

| Provider | Quota request |
| --- | --- |
| `github` | `https://api.github.com/copilot_internal/user` |
| `github-enterprise`, one valid origin | `https://api.<instance-host>/copilot_internal/user` |
| Missing, invalid or multiple Enterprise origins | No authenticated HTTP quota request; localized configuration error |

This Enterprise API mapping follows the Copilot bundle in the locally cached VS Code 1.141.0 and is covered by the maintainer's subsequent GHE environment acceptance. It does not establish that every custom GitHub Enterprise Server exposes that endpoint. Do not substitute `/api/v3`, use a repository path or fall back to GitHub.com on an error.

VS Code can handle Enterprise sign-in with multiple configured instances. This version delegates that login to the provider but blocks quota requests because the stable `AuthenticationSession` type pinned by the project does not expose the selected authorization server. It does not parse labels/session IDs or use proposed APIs to guess the host. At startup with a single configured origin, it relies on the built-in provider restricting its sessions to that instance. A change to the effective instance configuration during activation blocks further Enterprise session/HTTP requests until VS Code reloads: this prevents pairing a provider's old cached session with the new quota destination while its asynchronous configuration update is still pending.

## Lifecycle and transport

The provider and normalized Enterprise origins form the real service's source key. Changing them disposes the old service, cancels its request and invalidates late authentication/HTTP results through the existing generation checks. The old account/quota are cleared. Instance changes require reload before corporate authentication resumes; changing only the provider with the same instance does not. Session events only refresh the selected provider. Copilot provider changes affect `auto`; an explicit GitHub.com preference remains GitHub.com.

Configuration errors stay distinct from authentication errors and discard prior quota without network backoff. TLS validation, VS Code's proxy/certificate integration, the 10-second total timeout, 1 MiB response limit, cancellation and Retry-After behavior are retained. HTTP redirects are not followed. No tokens, response bodies or account identifiers are logged.

## References

- [VS Code Copilot setup](https://code.visualstudio.com/docs/setup/copilot#use-copilot-with-a-ghe-account): the existing GitHub.com/GHE.com sign-in experience.
- [Stable authentication API](https://code.visualstudio.com/api/references/vscode-api#authentication.getSession): provider-specific consent and account selection.
- [Built-in Enterprise provider](https://github.com/microsoft/vscode/blob/113947563a3837013dbff0095e2bf29880b5d354/extensions/github-authentication/src/githubEnterprise.ts): filtering sessions by configured instances and native instance selection.
- [Enterprise configuration resolver](https://github.com/microsoft/vscode/blob/113947563a3837013dbff0095e2bf29880b5d354/extensions/github-authentication/src/common/enterpriseConfiguration.ts): plural precedence and workspace trust.
- [Copilot enterprise resolver](https://github.com/microsoft/vscode/blob/113947563a3837013dbff0095e2bf29880b5d354/extensions/copilot/src/platform/authentication/common/enterprise.ts): upstream authorization-server metadata, absent from this project's pinned stable session interface.

Published package provenance is recorded in [GitHub Releases](https://github.com/rublaman/copilot-pace/releases). Real-account daily billing acceptance remains separate from the accepted quota connection.
