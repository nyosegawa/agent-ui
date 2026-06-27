# Product Boundary

Agent UI is an embeddable Codex App Server UI component library. It provides
general primitives, hooks, adapters, normalizers, bridge helpers, and documented
extension points that host applications compose into their own product surface.

Agent UI is not a hosted Codex service, IDE, credential provider, billing layer,
app runtime, plugin marketplace administrator, or generic chatbot unrelated to
Codex App Server.

## Primary Integration Shape

The default browser path is:

```text
browser Agent UI
  -> same-origin host WebSocket bridge
    -> codex app-server --listen stdio://
```

The host owns the HTTP server, WebSocket route, process lifecycle, admission,
authentication, workspace selection, upload storage, and deployment topology.
Agent UI's server package offers opt-in helpers for that host-owned bridge. The
helpers do not make Agent UI a managed hosting layer.

Package exports, examples, and host integration docs must preserve this split.
Breaking API work may remove or rename surfaces, but it should not move
host runtime, hosted service, authentication, persistence, tenant isolation, or
deployment policy into Agent UI core.

## Agent UI Owns

- Public package surfaces for core state, Codex adapters, React components,
  Web Components, and Node server helpers.
- Normalized thread, turn, item, usage, diagnostics, apps, skills, hooks, and
  server-request state.
- Transcript-first React primitives for messages, tool calls, command output,
  file changes, approvals, composer, status, usage, apps, skills, diagnostics,
  and thread history.
- Public React controllers and replacement maps that let hosts compose those
  primitives without depending on raw reducer state or internal CSS selectors.
- Codex App Server request builders, normalizers, transport adapters, and
  generated schema metadata needed by the public package surface.
- Local-first bridge helpers for same-origin WebSocket chat, local uploads,
  redaction, method policy, dynamic-tool delegation, and one-shot RPC.
- Structured browser resource metadata for local media display, including
  preview URLs, display names, redacted paths, MIME type, byte size, and
  fallback states.
- Diagnostic audience classification and redaction helpers for user,
  developer, and audit surfaces.
- Design-system tokens and the single public React stylesheet import,
  `@nyosegawa/agent-ui-react/styles.css`.

## Host Applications Own

- Product workflows, routing, app panels, orchestration, persistence, and custom
  state machines.
- User, session, workspace, project, and tenant isolation.
- Authentication, authorization, credential storage, account policy, billing
  context, audit logging, and resource limits.
- Codex App Server process lifecycle, sidecar deployment, remote access policy,
  and non-loopback exposure.
- Bridge admission beyond loopback defaults, browser method narrowing for
  hosted endpoints, and audit sinks for bridge health or diagnostic events.
- Upload persistence, cleanup policy, path redaction, static asset route
  authorization, and attachment resolver behavior.
- Diagnostic retention, alerting, support tooling, tenant/workspace mapping,
  and audit storage.
- Dynamic tool policy, MCP server access, custom tool execution, and any
  host-specific registry or marketplace.
- Realtime audio or voice UX, full IDE behavior, Git workflow ownership, and
  unsupported App Server surfaces.

## Local-First Scope

Agent UI defaults to local-first, single-user, stdio-first integration with
stable Codex App Server APIs. Remote and multi-user deployments are host-owned
advanced integrations that must add explicit admission, auth, isolation,
redaction, resource limits, and audit logging.

Direct upstream App Server WebSocket use may exist upstream, but it is not the
productized Agent UI browser path. The productized path is the host-owned
same-origin bridge to `codex app-server --listen stdio://`.

## Apps And Connectors

`app/list` is Codex Apps/connectors metadata. Agent UI may display upstream
connector fields such as labels, icons, plugin display names, `isAccessible`,
`isEnabled`, and `installUrl`. It is not a host workflow registry, and docs must
not invent fields such as `installed` or `needsAuth`.

## Protocol Boundaries

Stable, productized App Server methods are surfaced through package APIs and
React behavior. Stable but host-managed methods can remain available through
lower-level adapters without becoming default UI workflows. Experimental,
host-only, unsupported, or test-only methods stay explicitly labeled.

Thread lifecycle, first-message optimism, resource resolution, server request
state, bridge diagnostics, and one-shot RPC boundaries must be documented
against that classification before they are treated as stable public behavior.

Current non-goals include remote or multi-user production hosting, external
ChatGPT auth token mode, realtime audio or voice UX, plugin marketplace
administration, dynamic MCP resource and tool management as a core UI workflow,
and experimental item pagination such as `thread/items/list`.

## Naming

Use `Agent UI` for the product and `Codex App Server` for the integration
surface. Lowercase `app-server` should stay in commands and paths.
