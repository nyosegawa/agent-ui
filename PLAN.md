# Agent UI Current Plan

This file is the current direction document. Historical vNext planning lives in
[`docs/archive/2026-vnext-plan.md`](./docs/archive/2026-vnext-plan.md).

## Product Direction

Agent UI is an embeddable UI component system for applications built on Codex
App Server. The library owns generic Codex UI primitives, normalized state,
transports, and local bridge helpers. Host applications own product-specific
workflows, storage, sidecars, proposal flows, and deployment policy.

The default runtime remains:

```text
local browser UI -> same-origin host bridge -> codex app-server --listen stdio://
```

## Current Architecture

- `@nyosegawa/agent-ui-core`: protocol-neutral state, reducer, selectors,
  fixtures, fake transport, and host-owned OpenAI Agents SDK adapter.
- `@nyosegawa/agent-ui-codex`: generated Codex App Server types, JSON-RPC-lite
  framing, request builders, normalizers, stdio transport, WebSocket transport,
  session facade, auth helpers, and protocol capability metadata.
- `@nyosegawa/agent-ui-react`: React provider, headless hooks, transcript-first
  preset, primitive components, timeline renderers, composer, approvals,
  usage/status/apps/skills panels, CSS, and fixture UI.
- `@nyosegawa/agent-ui-server`: Node process bridge, same-origin WebSocket
  bridge, one-shot HTTP RPC helpers, upload helper, redaction, dynamic-tool
  helper bridge, server-request policy, Express/Next helpers, and
  agent-browser detection.
- `@nyosegawa/agent-ui-web-components`: custom element wrapper around the
  React preset for hosts that cannot mount React directly.

## UI Contract

- `AgentChat` is a convenience preset, not the architectural boundary.
- Host apps should be able to compose directly from `AgentThreadView`,
  `AgentMessageList`, `AgentComposerPanel`, `AgentApprovalQueue`,
  `AgentUsagePanel`, `AgentAppsPanel`, `AgentSkillsPanel`, status primitives,
  and headless hooks.
- User and assistant messages stay expanded. Tool, command, JSON, and diff
  bodies may lazy-mount behind details when heavy.
- Command/tool/file-change context stays inline with the transcript, including
  stored sessions.
- Pending approvals render as the final transcript item, not as a separate
  scroll pane.
- Composer mode/model/effort controls stay compact in the composer toolbar.
  Working directory is a thread-start setting and read-only after start.
- Attachments are host-resolved. Browser `File` objects must become App
  Server-readable paths or URLs through host-owned upload/persistence logic.

## Integration Contract

- Full chat requires a long-lived WebSocket bridge such as
  `attachAgentUiWebSocketBridge()`.
- `createAgentUiNextRpcRoute()` and `createAgentUiExpressMiddleware()` are
  one-shot HTTP RPC helpers. They are useful for host-owned metadata calls, not
  streaming chat, approvals, or browser response round-trips.
- Next.js full chat should follow `examples/next-with-bridge-sidecar`.
- The browser WebSocket transport should be imported from
  `@nyosegawa/agent-ui-codex/websocket`.
- Dynamic-tool helper behavior, upload persistence, and remote deployment
  boundaries must be documented as security-sensitive host integration points.

## Documentation Plan

Active docs should be concise and implementation-facing:

- `README.md`: overview, packages, examples, and quickstart.
- `docs/README.md`: documentation map.
- `docs/product.md`: product scope and non-goals.
- `docs/packages.md`: package responsibilities and public export boundaries.
- `docs/architecture.md`: state, reducer, protocol, bridge, and UI model.
- `docs/component-api.md`: React components, hooks, composition, and attachment
  APIs.
- `docs/server-bridge.md`: bridge lifecycle, upload handler, dynamic tools,
  HTTP RPC helper boundaries, and host responsibilities.
- `docs/security.md` and `docs/remote-deployment.md`: local, remote,
  multi-user, token, filesystem, and process-isolation constraints.
- `docs/testing.md`: current validation matrix only.
- `docs/archive/*`: historical planning, audit, and validation logs.

## Validation Baseline

Use the relevant subset for focused changes and the full ladder before release
or broad documentation/API changes:

```sh
bun run typecheck
bun run lint
bun run test
bun run test:protocol
bun run test:fixtures
bun run build
bun run check:exports
bun run check:dead-code
bun run test:package-resolution
bun run test:node-compat
bun run test:e2e:playwright
```

Manual real-local layout gate:

```sh
AGENT_UI_PORT=5175 AGENT_UI_HOST=127.0.0.1 \
AGENT_UI_CODEX_CWD=/Users/sakasegawa/src/github.com/nyosegawa/agent-ui \
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev

bun run test:e2e:real-local-web-layout
```

Real Codex smoke checks remain environment-dependent:

```sh
bun run test:e2e:real-codex
bun run test:e2e:real-codex:approval
```
