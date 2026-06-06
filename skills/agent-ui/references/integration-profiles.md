# Integration Profiles

Use this reference to classify the host app before implementing Agent UI.

## Local Single-User Codex App

Choose this profile when the app is for localhost, personal use, demos, local
developer tooling, or one trusted user on the same machine.

Expected shape:

- React UI uses Agent UI packages.
- The host exposes a same-origin WebSocket route.
- The route starts or connects to `codex app-server --listen stdio://`.
- Browser method policy stays on the productized full-chat surface.
- The host chooses a working directory and owns process lifetime.
- Any upload route is local and cleaned up by host policy.
- Per-connection bridge options come from trusted local host state, not browser
  supplied `cwd`, `env`, or method policy.
- Host workflow gates are route-local product controls around Agent UI
  primitives, not Agent UI core state machines.

This is the primary profile for the first implementation pass.

## Host-Owned Remote Or Multi-User App

Choose this profile when the app is deployed beyond loopback, has accounts,
supports multiple users or workspaces, or runs Codex processes remotely.

Do not treat Agent UI as a managed remote service. The host must own:

- authentication and authorization
- admission before bridge process spawn
- user/session/workspace isolation
- process, credential, and cwd policy
- upload storage, cleanup, and path redaction
- resource limits and audit logging
- explicit non-loopback exposure policy
- per-connection bridge option resolution before spawn
- product workflow gates in host UI and persistence

If these decisions are missing, stop at design guidance and ask the user for the
host policy before implementing a browser bridge.

## Existing Integration Debug Or Upgrade

Choose this profile when Agent UI is already installed but broken, outdated, or
miswired.

First inspect:

- package versions and export paths
- stylesheet import location
- transport and bridge setup
- method policy rejections
- App Server startup stderr
- approval and server-request handling
- upload path resolution
- canonical resume and stored-history preview behavior
- mobile drawer reachability
- layout overflow and composer reachability

Then use [debug](debug.md) and [validation](validation.md).

## Unsupported Or Design-First Work

Pause implementation and design first when the request asks Agent UI to provide:

- hosted Codex service behavior
- credential storage or billing
- multi-tenant process orchestration without host policy
- generic non-Codex chatbot behavior
- plugin marketplace administration
- remote App Server exposure without auth and isolation
