# Recipes

Directory:

```text
examples/recipes
```

Recipes are typed host-integration examples. Use them when a guide explains the
boundary and you need a copyable implementation shape that imports only public
package entrypoints.

## Topics

| Need | Recipe | Related docs |
| --- | --- | --- |
| Customize `AgentChat` while keeping preset behavior | [custom components](../../examples/recipes/src/custom-components.tsx), [preset composition](../../examples/recipes/src/agent-chat-composition.tsx), [custom transcript blocks](../../examples/recipes/src/custom-transcript-blocks.tsx), [transcript display policy](../../examples/recipes/src/transcript-display.tsx) | [React](../guides/react.md), [React Components](../reference/react-components.md) |
| Build a host-owned layout from controllers and primitives | [headless controller](../../examples/recipes/src/headless-chat-controller.tsx), [headless hooks](../../examples/recipes/src/headless-hooks.tsx), [host composer](../../examples/recipes/src/host-owned-composer.tsx), [scoped thread list](../../examples/recipes/src/scoped-thread-list.tsx) | [React](../guides/react.md), [Hooks](../reference/hooks.md) |
| Gate Codex turns behind host workflow state | [host-gated workflow](../../examples/recipes/src/host-gated-workflow.tsx), [host integration checklist](../../examples/recipes/src/host-integration-checklist.ts) | [Host Integration](../guides/host-integration.md), [Product Boundary](../architecture/product-boundary.md) |
| Resolve local media and attachments | [local media helper](../../examples/recipes/src/local-media-helper.tsx) | [Attachments](../guides/attachments.md), [Server Bridge](../reference/server-bridge.md) |
| Attach a same-origin bridge safely | [bridge policy](../../examples/recipes/src/bridge-policy.ts), [WebSocket remote demo](../../examples/recipes/src/websocket-remote-demo.tsx) | [First Host App](../guides/first-host-app.md), [Server Bridge](../reference/server-bridge.md) |
| Add diagnostics or status chrome | [diagnostics panel](../../examples/recipes/src/diagnostics-panel.tsx), [host integration checklist](../../examples/recipes/src/host-integration-checklist.ts) | [Diagnostics](../guides/diagnostics.md), [Usage and Status](../guides/usage-and-status.md) |
| Theme the default UI with tokens | [themed example](../../examples/recipes/src/themed.tsx), [theme CSS](../../examples/recipes/src/themed.css) | [Theming](../guides/theming.md) |
| Plan advanced remote or multi-user deployment | [multi-user deployment](../../examples/recipes/multi-user-deployment.md), [API-key remote deployment](../../examples/recipes/api-key-remote-deployment.md) | [Remote Deployment](../guides/remote-deployment.md), [Security](../architecture/security.md) |

## Files

- `src/custom-components.tsx`: `AgentChat` `components` prop for custom
  approval and block rendering.
- `src/agent-chat-composition.tsx`: preset composition with external send
  controls, fixed start options, overlay coordination, and local media
  resolution.
- `src/custom-transcript-blocks.tsx`: custom transcript block renderers while
  preserving default block rendering.
- `src/transcript-display.tsx`: semantic transcript display policies using
  category and role rules, plus the `answer-focused` preset.
- `src/headless-chat-controller.tsx`: chat UI composed from public controllers.
- `src/headless-hooks.tsx`: custom layout built from public controllers and
  primitives without reading reducer turn internals.
- `src/scoped-thread-list.tsx`: host-owned thread list scope with search and
  pagination.
- `src/host-owned-composer.tsx`: transcript plus host toolbar using the public
  composer controller.
- `src/host-gated-workflow.tsx`: `AgentThreadTimeline` plus a host-owned
  approval bar and delayed composer.
- `src/local-media-helper.tsx`: upload/static handlers paired with structured
  attachment and transcript media resolvers.
- `src/bridge-policy.ts`: loopback bridge policy, local desktop admission, and
  host health-event logging.
- `src/diagnostics-panel.tsx`: standalone diagnostics rail composition.
- `src/host-integration-checklist.ts`: host integration checklist for Agent UI
  boundaries.
- `src/themed.tsx` and `src/themed.css`: scoped CSS variable theme override.
- `src/websocket-remote-demo.tsx`: optional same-origin WebSocket transport
  wiring.
- `multi-user-deployment.md`: host-owned multi-user bridge boundaries and audit
  checklist.
- `api-key-remote-deployment.md`: server-side API-key bridge constraints.

## Boundaries

Recipes show host composition patterns within the
[Product Boundary](../architecture/product-boundary.md). They should not
introduce workflow-specific APIs into the core library.

The bridge, diagnostics, and local-media recipes intentionally stop at typed
integration points. Host applications still own authentication, bridge
admission, tenant and workspace scoping, upload authorization, audit sinks,
Codex process lifecycle, persistence, billing, and deployment policy.

`src/headless-hooks.tsx` is intentionally built from public controllers and
primitives. It does not walk reducer turns, item maps, streaming text maps, or
raw App Server payloads. Hosts that need their own chrome should compose
`useAgentThreadController()`, `useAgentThreadListController()`,
`AgentThreadTimeline`, and `AgentComposer` instead of depending on internal
transcript storage.

`src/host-gated-workflow.tsx` composes `AgentThreadTimeline`, a host-owned
approval bar, and a delayed composer. The recipe keeps plan/update state in the
host and calls `startThreadWithInput(input, { threadOptions, turnOptions })`
only after the host gate approves the first Codex turn.

`src/agent-chat-composition.tsx` keeps the complete `AgentChat` preset while
using the public `components` prop, `threadHeaderEnd`, `startOptions`,
controlled overlay `controls`, local media resolvers, and
`useAgentChatController().sendMessage()` for external host UI. The host never
calls raw transport methods and does not depend on private DOM selectors.
Non-image attachments are rendered with safe browser metadata, but the App
Server input receives the absolute saved path because redacted display paths are
not readable by Codex.

`src/themed.css` intentionally demonstrates host theming by overriding `--aui-*`
tokens on a wrapper. It should not be read as permission to import
`dist/styles/*` chunks or target internal `.aui-*` selectors as a public
contract; hosts still import `@nyosegawa/agent-ui-react/styles.css` once.

Keep these recipes in `examples/recipes` for now. A future `docs/recipes/` tree
is not needed unless these pages stop being executable examples or need a
separate narrative structure.
