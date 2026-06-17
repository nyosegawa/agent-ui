# Agent UI Recipes

Typed implementation recipes for host applications.

Detailed docs: [docs/examples/recipes.md](../../docs/examples/recipes.md).

- `src/custom-components.tsx`: `AgentChat` components map for custom approval and item rendering.
- `src/custom-transcript-blocks.tsx`: custom transcript block renderers while
  preserving default block rendering.
- `src/headless-chat-controller.tsx`: chat UI composed from public controllers.
- `src/headless-hooks.tsx`: custom layout built from hooks only.
- `src/scoped-thread-list.tsx`: host-owned thread list scope with search and
  pagination.
- `src/host-owned-composer.tsx`: transcript plus host toolbar using the public
  composer controller.
- `src/host-gated-workflow.tsx`: `AgentThreadTimeline` plus a host-owned
  approval bar and delayed composer that calls
  `startThreadWithInput(input, { threadOptions, turnOptions })` only after the
  host plan gate is approved.
- `src/support-console.tsx`: support SaaS composition where ticket routing,
  customer context, PII policy, reply review, and audit retention stay
  host-owned while Agent UI owns the assistant transcript and composer surface.
- `src/local-media-helper.tsx`: upload/static handlers paired with structured
  attachment and transcript media resolvers.
- `src/bridge-policy.ts`: loopback bridge policy, local desktop admission, and
  host health-event logging.
- `src/diagnostics-panel.tsx`: standalone diagnostics rail composition.
- `src/host-integration-checklist.ts`: host integration checklist for Agent UI
  boundaries.
- `src/themed.tsx` and `src/themed.css`: scoped CSS variable theme override that
  changes a small set of brand tokens while inheriting the rest of Agent UI's
  light, dark, and system token contract.
- `src/websocket-remote-demo.tsx`: optional same-origin WebSocket transport wiring.
- `multi-user-deployment.md`: host-owned multi-user bridge boundaries and audit checklist.
- `api-key-remote-deployment.md`: server-side API-key bridge constraints.

The WebSocket recipe only creates the browser transport for a host-owned
`/agent-ui/ws` endpoint. It does not implement authentication by itself. The
host endpoint must enforce authentication before it is exposed beyond loopback,
and bearer tokens must not be placed in query strings. Browser WebSocket
constructors cannot send custom headers; use same-origin cookies, server-side
token exchange, or the Agent UI bearer subprotocol helper for short-lived bridge
tokens.

External product workflows should compose Agent UI primitives rather than add
workflow-specific APIs to the library. Use `AgentThreadView` and headless hooks
for fixed-thread flows, `AgentUsagePanel` for usage-only chrome, `AgentAppsPanel`
for Codex Apps/connectors metadata, `AgentThreadTimeline` plus a host-owned
composer for delayed workflow gates, and `AgentWorkspace`'s `panel` /
`panelClassName` props for host-owned panels. Keep plan, routing, persistence,
and approval state in the host.
