# Host Integration Contract Plan

This plan covers the Agent UI changes needed after validating the requirements
against the current implementation, docs, and upstream Codex App Server
reference. Agent UI remains a reusable Codex App Server UI library. Host
workflow, authentication, workspace selection, persistence, process supervision,
and audit storage stay host-owned.

## Investigation Summary

Four parallel read-only investigations were run before planning:

- React/thread lifecycle: `startThreadWithInput()` is public but currently only
  accepts input. It safely waits for the canonical `thread/start` result before
  `turn/start`, but it cannot pass host-owned `threadOptions` and `turnOptions`
  together. Retry payloads also only remember thread options, and the stable
  return metadata is only `{ threadId }`.
- Server bridge/admission: `attachAgentUiWebSocketBridge()` uses
  `new WebSocketServer({ server, path })` and receives `connection` after HTTP
  upgrade. Resolver and admission rejection are therefore WebSocket close-only,
  not HTTP `403` or `409` responses. Admission callbacks are boolean-only and
  bridge health events lack stable rejection reason codes.
- Docs/examples/skills: product boundary docs are sound, local media fallback is
  mostly documented, and host workflow gates are described as composition. Gaps
  are browser-compatible token transport guidance, prominent Node `>=22`
  installation notes, and `skills/agent-ui` wording around slots.
- Upstream App Server: stable `thread/start` owns thread config such as model,
  cwd, approval policy, sandbox, instructions, personality, and source. Stable
  `turn/start` owns first-turn run controls such as input, model, effort,
  approval policy, sandbox policy, service tier, personality, summary, and
  `clientUserMessageId`. `thread/resume` can return a canonical `thread.id`
  different from the requested id. Direct upstream WebSocket auth uses
  `Authorization: Bearer ...`, rejects browser `Origin`, and does not expose a
  subprotocol pattern for Agent UI's same-origin bridge.

## Current Implementation Facts

### React Thread Lifecycle

- Public `AgentComposerController.startThreadWithInput(input)` is declared in
  `packages/react/src/hooks/composer-types.ts`.
- The public wrapper in `packages/react/src/hooks/composer.ts` validates input
  and calls internal `startWithMessage(inputItems)`.
- Internal first-message start creates an optimistic thread and user message,
  calls `thread/start`, reconciles the optimistic id to the canonical id, then
  calls `turn/start` with `clientUserMessageId`.
- Normal `useAgentTurn().startTurn(input, params)` already supports caller
  `TurnStartOptions`, merged after execution-mode defaults.
- `AgentUserInput` and normalization already preserve `localImage`; first-turn
  tests do not cover it yet.
- Resume success returns `{ threadId, requestedThreadId? }`, but resume failures
  are not wrapped with host-useful diagnostics.

### Server Bridge

- `resolveBridgeOptions` already runs before admission and spawn.
- `bridgePolicy.admission` is checked before `createCodexAppServerBridge()`.
- Rejection currently closes an upgraded WebSocket with fixed `1008` or `1011`
  reasons.
- High-level `attachAgentUiWebSocketBridge()` cannot return HTTP status/body
  because it attaches through the `ws` server's post-upgrade `connection` event.
- Health events cover phases and state, but not structured rejection reason
  codes such as `token_rejected`, `origin_rejected`, or `workspace_missing`.
- Browser transport accepts `protocols`, but the server package has no public
  bearer subprotocol helper or parser.

### Docs, Examples, And Skills

- `docs/architecture/product-boundary.md` is the controlling boundary document.
- `docs/reference/server-bridge.md` warns that Origin and same-origin routing
  are not authentication and that bearer tokens must not be placed in query
  strings.
- `docs/guides/attachments.md` documents local media fallback when resolver or
  browser media loading fails.
- `docs/installation.md` and `docs/getting-started.md` do not make Node `>=22`
  visible enough for packaged sidecar hosts.
- `examples/recipes/src/bridge-policy.ts` currently uses an
  `x-agent-ui-session` header, which browser WebSocket clients cannot set.
- `skills/agent-ui/SKILL.md` still says `slots` generically even though the
  public contract is the components map, documented `className` props, host
  wrappers, `AgentWorkspace` panels, and `--aui-*` tokens.

## Design Decisions

### First-Turn Start

Add a stable React public options type:

```ts
export interface AgentThreadStartWithInputOptions {
  threadOptions?: ThreadStartOptions;
  turnOptions?: TurnStartOptions;
}
```

`startThreadWithInput(input, options)` must:

- keep the current optimistic first-message behavior;
- call `thread/start` with run-setting defaults plus
  `options.threadOptions`;
- wait for the canonical `ThreadStartResponse.thread.id`;
- reconcile the optimistic id before any turn work;
- call `turn/start` with run-setting defaults, execution-mode defaults, and
  `options.turnOptions` last;
- preserve `clientUserMessageId` for upstream item reconciliation;
- return stable metadata, not raw App Server responses.

The planned return shape is:

```ts
export interface AgentThreadStartWithInputResult {
  operationId: string;
  threadId: ThreadId;
  turnId: string;
  userMessageId: string;
}
```

Because backward compatibility is not required, the result can become richer
without keeping compatibility aliases.

Retry must remember both `threadOptions` and `turnOptions` so a failed
first-message turn retries with the same host intent.

### Canonical Resume Diagnostics

Keep canonical ids as the host-persisted identity. Add stable diagnostics for:

- requested id differs from returned canonical id;
- resume response is missing a usable thread id;
- resume normalization fails after a request id was known.

Diagnostics must be redacted, raw-free, and developer/audit oriented. They
should include stable fields such as `requestedThreadId`, `threadId` when known,
and `reasonCode`, but not raw responses or alias maps.

### Bridge Admission And HTTP Rejection

The high-level helper needs pre-upgrade control. The implementation should move
from post-upgrade-only `WebSocketServer({ server, path })` behavior to an
explicit upgrade handler for the configured path. That handler can resolve
bridge options and admission before calling `handleUpgrade()`.

Structured rejection should be shared by resolver and admission:

```ts
export interface AgentUiBridgeRejection {
  body?: string | Buffer;
  closeCode?: number;
  reason: AgentUiBridgeRejectionReason;
  status?: number;
  statusText?: string;
}
```

Reason should support stable built-ins and host-owned string codes:

- `request_context_missing`
- `loopback_required`
- `resolver_rejected`
- `resolver_failed`
- `admission_rejected`
- `admission_failed`
- `unsafe_admission_reason_missing`
- host-owned codes such as `token_rejected`, `origin_rejected`,
  `workspace_missing`

`attachAgentUiWebSocketBridge()` should send HTTP status/body for rejection
before upgrade. `handleAgentUiWebSocketConnection()` should keep a compatible
advanced path for callers that already own manual upgrade; in that path it can
close the already-upgraded socket with the rejection close code and reason.

The API should prove that no Codex child process is spawned on resolver or
admission rejection.

### WebSocket Token Subprotocol

Browser WebSocket clients cannot set arbitrary headers. Agent UI should provide
a documented local sidecar pattern using subprotocol tokens for the same-origin
bridge:

```ts
const protocols = createBearerSubprotocol("agent-ui", token);
const parsed = parseBearerSubprotocol(request.headers["sec-websocket-protocol"], "agent-ui");
```

The helper must:

- avoid query strings;
- use URL-safe token encoding;
- avoid exposing raw tokens in logs;
- be explicit that this is for host-owned local/session admission, not upstream
  App Server auth;
- integrate with redaction tests.

The upstream App Server still uses `Authorization: Bearer ...`; the subprotocol
pattern is for Agent UI's browser-to-host bridge.

### Local Media Fallback

Keep local media authorization host-owned. Do not make the React resolver
perform async server-side existence or permission checks. Instead:

- codify that a host route may return `403` or `404`;
- default transcript media rendering must show fallback when media loading
  fails after a URL was returned;
- tests should cover HTTP/media load failure fallback for transcript image and
  video paths;
- docs and recipes should show safe asset-id URLs, not raw filesystem paths.

### Host-Gated Workflow Recipe

Do not add a plan-approval workflow to core. Add a recipe using public
controllers and primitives:

- `startThreadWithInput(input, { threadOptions, turnOptions })`;
- `AgentThreadTimeline`;
- host-owned approval bar;
- composer hidden or disabled until the host gate is satisfied;
- plan/update display from normalized transcript state.

This should live in docs/examples and typed recipe source, with fixture coverage
where browser-visible behavior matters.

### Runtime Requirements And Skill Updates

Make Node `>=22` visible in installation and getting-started docs. Keep Bun as
the repo package manager. Update `skills/agent-ui` so external integrations use
the new bridge/token/first-turn guidance and avoid private CSS or obsolete slot
language.

## Implementation Slices

1. React first-turn contract
   - Add `AgentThreadStartWithInputOptions`.
   - Thread public `startThreadWithInput(input, options)` through the internal
     first-message operation path.
   - Persist both thread and turn options in retry payloads.
   - Return stable operation, turn, and client user message ids.
   - Add first-turn localImage and options tests.

2. Canonical resume diagnostics
   - Define stable reason codes and diagnostic payload shape.
   - Emit diagnostics for canonical id changes and resume failures.
   - Add reducer/React tests without exposing raw App Server payloads.

3. Bridge rejection contract
   - Add public rejection/result types.
   - Allow `resolveBridgeOptions` and `bridgePolicy.admission` to reject with a
     structured result.
   - Rework `attachAgentUiWebSocketBridge()` to reject before upgrade with
     status/body when possible.
   - Preserve `handleAgentUiWebSocketConnection()` as the low-level advanced
     path for already-upgraded sockets.
   - Emit health events with structured rejection reasons.

4. Bearer subprotocol helpers
   - Add client/server helpers in the appropriate package surfaces.
   - Add redaction and parser tests.
   - Update recipe code away from impossible browser headers.

5. Local media fallback hardening
   - Add component tests for URL-returned-then-load-failed fallback.
   - Update docs to explicitly mention host `403` and `404` routes.

6. Host-gated workflow recipe
   - Add typed recipe source and docs cross-link.
   - Use public primitives only.
   - Avoid productizing host approval gate state in core.

7. Docs, examples, skill, and package surface
   - Update `docs/reference/hooks.md`, `docs/reference/server-bridge.md`,
     `docs/guides/host-integration.md`, `docs/guides/attachments.md`,
     `docs/installation.md`, `docs/getting-started.md`,
     `docs/examples/recipes.md`, and `skills/agent-ui`.
   - Update API snapshots intentionally.
   - Add changesets only when moving from plan to implementation release work.

## Validation Plan

Focused gates while implementing:

- `bun run test:protocol`
- `bun run test:fixtures`
- `bun run --cwd examples/recipes typecheck`
- `bun run test:skills`
- targeted Vitest files for React components and server websocket tests
- `bun run test:api-snapshots:update` after reviewing public API changes

Before claiming the implementation branch is ready:

- `bun run validate:fast`
- `bun run validate:protocol`
- `bun run validate:packages`
- `bun run test:api-snapshots`
- `bun run test:package-resolution`
- relevant Playwright fixture or real-local specs for browser-visible recipe and
  media fallback changes

## Non-Goals

- Do not edit `third_party/codex`.
- Do not move host auth, token storage, workspace registry, persistence, or
  process supervision into Agent UI core.
- Do not expose raw App Server responses, alias maps, reducer internals, or
  generated protocol payloads from React public APIs.
- Do not rely on internal `.aui-*` selectors or private CSS chunks in recipes.
