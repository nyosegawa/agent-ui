# Agent UI Recipes

Typed implementation recipes for host applications.

- `custom-components.tsx`: `AgentChat` slots for custom approval and item rendering.
- `headless-hooks.tsx`: custom layout built from hooks only.
- `themed.tsx` and `themed.css`: CSS variable theme override.
- `websocket-remote-demo.tsx`: optional authenticated WebSocket transport wiring.
- `multi-user-deployment.md`: host-owned multi-user bridge boundaries and audit checklist.
- `api-key-remote-deployment.md`: server-side API-key bridge constraints.

The WebSocket recipe assumes the host application owns `/agent-ui/ws` authentication. Do not put bearer tokens in query strings.

External product workflows should compose Agent UI primitives rather than add
workflow-specific APIs to the library. Use `AgentThreadView` and headless hooks
for fixed-thread flows, `AgentUsagePanel` for usage-only chrome, `AgentAppsPanel`
for Codex Apps/connectors metadata, and `AgentWorkspace`'s `panel` /
`panelClassName` props for host-owned panels.
