# Product Boundary Review

Use this when a review touches package ownership, examples, host integration, or
new public APIs.

## Agent UI Owns

- Core normalized state and protocol-neutral transport primitives.
- Codex App Server adapters, request builders, normalizers, and generated schema
  metadata needed by package APIs.
- React root preset, headless controllers, and transcript-first UI primitives.
- Web Components wrapper around the React preset.
- Node server helpers for local same-origin WebSocket bridges, local uploads,
  redaction, one-shot RPC, method policy, and dynamic-tool delegation.
- Raw-free public view models and structured browser resource metadata for
  local media display.
- The `--aui-*` design-system token contract and the public React stylesheet.

## Host Applications Own

- Product workflow state, routing, persistence, panels, and custom orchestration.
- Authentication, authorization, credentials, billing context, audit logging,
  resource limits, and deployment topology.
- Workspace/session/user/tenant isolation.
- Codex App Server process lifecycle and non-loopback exposure policy.
- Upload storage, cleanup, path redaction, and attachment resolver behavior.
- Browser serving of local media URLs derived from App Server filesystem paths.
- Dynamic tool execution policy, MCP access policy, and app-specific registries.

## Review Questions

- Does the change add a reusable primitive, hook, adapter, or extension point, or
  does it hard-code one host application's workflow?
- Does it keep local-first defaults and make remote or multi-user assumptions
  explicit?
- Does it preserve `AgentChat` as the root convenience preset while keeping
  `/primitives` and `/headless` independently composable?
- Does it document host-owned responsibilities instead of silently absorbing
  them into public packages?
