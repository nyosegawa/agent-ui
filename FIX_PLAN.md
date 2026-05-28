# Agent UI Fix Plan

This plan captures the audit findings from the 12-subagent review and turns them
into an implementation order. The goal is to fix correctness and security issues
first, then reduce protocol drift and refactor pressure without changing the
product shape: Agent UI remains a Codex App Server UI component library.

## Principles

- Keep the Codex App Server protocol as the source of truth.
- Prefer focused patches with tests over broad rewrites.
- Update docs whenever behavior, public API, examples, or validation contracts
  change.
- Do not preserve stale shapes for compatibility when the active protocol and
  docs imply a cleaner API.
- Keep public surfaces intentionally small. If an internal helper is exported,
  treat it as public API or stop exporting it deliberately.

## Phase 1: Blocking Correctness And Security

### 1. Fix account state normalization

Current risk: `account/updated` can treat `{ authMode: null, planType: null }`
as authenticated because `accountStatus()` recognizes `authMethod: null` but not
the current `authMode: null` protocol shape.

Primary files:

- `packages/codex/src/normalizers/account.ts`
- `packages/codex/test/protocol.test.ts`
- `fixtures/app-server/v2-jsonrpc/account-login-rate-limit.jsonl`
- `packages/react/src/components/status.tsx` for UI verification only

Implementation shape:

- Treat an explicit `authMode: null` as unauthenticated.
- Keep legacy `authMethod: null` compatibility.
- Treat non-null `authMode` as authenticated.
- Preserve `planType` and raw payload.
- Update tests to cover authenticated and unauthenticated `account/updated`.
- Refresh stale fixture shape if it currently uses a non-protocol nested account
  object.

Validation:

- `bun run test:protocol`
- Focused React status/account tests if UI state changes.

### 2. Restrict one-shot RPC helpers by default

Current risk: `createAgentUiNextRpcRoute()` and
`createAgentUiExpressMiddleware()` forward caller-controlled App Server methods
directly. If copied into an unauthenticated route, this can expose host-only
methods such as `fs/readFile`, `command/exec`, `config/value/write`, or
`mcpServer/tool/call`.

Primary files:

- `packages/server/src/next.ts`
- `packages/server/src/express.ts`
- `packages/server/test/next.test.ts`
- Add or extend Express middleware tests.
- `docs/reference/server-bridge.md`
- `docs/examples/next-rpc-route.md`
- `examples/next-rpc-route/app/api/agent-ui/route.ts`

Implementation shape:

- Add a shared one-shot method policy.
- Default to productized methods only, matching the WebSocket bridge's safe
  browser method posture.
- Support an explicit `allowedMethods` option.
- Consider an explicit `"all"` escape hatch only if documented as unsafe.
- Validate request shape before spawning the bridge where possible.
- Return a JSON-RPC style `-32601` error or a clear HTTP error for disallowed
  methods.

Validation:

- `bun --filter @nyosegawa/agent-ui-server test`
- `bun run typecheck`
- Docs/examples review.

### 3. Repair pending server request lifecycle

Current risks:

- `serverRequest/created` changes the thread entity status to
  `waitingForInput` without syncing `thread.registryStatus` or
  `threadRegistry` buckets.
- `serverRequest/resolved` and `serverRequest/rejected` can move the thread
  back to `running` without syncing registry state.
- `connection/closed` clears pending requests while leaving affected threads in
  `waitingForInput`, which can leave the composer disabled with no approval UI.
- `connection/error` records diagnostics but does not reconcile pending
  requests or waiting threads.

Primary files:

- `packages/core/src/reducer/server-requests.ts`
- `packages/core/src/reducer/connection.ts`
- `packages/core/src/stores/thread-index.ts`
- `packages/core/src/stores/thread-entity.ts`
- `packages/core/test/reducer.test.ts`
- `packages/react/src/components/composer.tsx` for UI behavior verification

Implementation shape:

- Centralize thread status changes that affect registry classification.
- When server requests create waiting state, update:
  - `ThreadState.status`
  - `ThreadState.registryStatus`
  - `threadRegistry` bucket membership
- On resolve/reject, restore status only when no other pending request remains
  for the thread, and sync registry state.
- On terminal connection events, collect pending request thread IDs before
  clearing queues.
- Clear or reject pending requests consistently for `connection/closed` and
  `connection/error`.
- Move affected `waitingForInput` threads to a non-waiting recoverable status
  consistent with the rest of the state model.

Validation:

- Add reducer tests for request create, resolve, reject, duplicate resolution,
  connection close, and connection error.
- `bun test packages/core/test/reducer.test.ts`
- Focused React composer/approval tests if UI disabled-state semantics change.

### 4. Keep approvals visible and FIFO ordered

Current risks:

- Approvals with `itemId` but no `turnId` are classified as anchored, excluded
  from tail fallback, then dropped by `approvalAnchorsForTurn()` because
  `turnId` is missing.
- `selectPendingApprovals()` uses `Object.values(byId)` and can reorder
  numeric-like request IDs instead of respecting FIFO queue order.

Primary files:

- `packages/react/src/components/thread.tsx`
- `packages/react/src/timeline/approval-anchors.tsx`
- `packages/core/src/selectors.ts`
- `packages/react/src/hooks/approvals.ts`
- `packages/core/test/reducer.test.ts`
- `packages/react/test/components.vitest.tsx`

Implementation shape:

- Make `selectPendingApprovals()` delegate to `selectServerRequestQueue()` or
  otherwise use `serverRequestQueue.order`.
- In `approvalAnchorsForTurn()`, only enforce `turnId` equality when `turnId`
  is present.
- Allow `itemId`-only approvals to anchor to the turn containing the item.
- Preserve tail fallback for metadata-free approvals and for anchored approvals
  that cannot find matching transcript context.

Validation:

- Core selector test with request IDs like `"10"` then `"2"`.
- React test for itemId-only approval anchoring after the matching item.
- React test for unmatched itemId fallback, if implemented.
- Existing approval placement tests.

## Phase 2: Protocol Drift Fixes

### 5. Decode `command/exec/outputDelta`

Current risk: `command/exec/outputDelta` uses `deltaBase64`, but the normalizer
only reads `delta`, `data`, or `chunk`, and `decodeDelta()` does not decode
base64. Standalone `command/exec` stream output can normalize to an empty string.

Primary files:

- `packages/codex/src/normalizers/items.ts`
- `packages/codex/src/normalizers/shared.ts`
- `packages/codex/test/protocol.test.ts`
- Optional raw JSONL fixture under `fixtures/app-server/v2-jsonrpc/`

Implementation shape:

- Add base64-aware decoding for explicit base64 fields.
- Use `params.deltaBase64` for `command/exec/outputDelta`.
- Keep existing plain `delta` behavior for item output notifications.
- Be explicit that `command/exec` is connection-scoped and may not have
  thread/turn/item metadata.

Validation:

- Protocol test with `deltaBase64: "aGkK"` producing `hi\n`.
- Fixture coverage if raw JSONL is intended to represent this path.

### 6. Fix nested error notification messages

Current risk: generated `error` notification has `params.error.message`, but
the normalizer reads only top-level `params.message`, hiding real failure
reasons behind `Codex error`.

Primary files:

- `packages/codex/src/normalizers/status.ts`
- `packages/codex/test/protocol.test.ts`
- `packages/react/src/components/status.tsx` for diagnostics display

Implementation shape:

- Read `params.error.message` before top-level fallback.
- Preserve useful error metadata in `raw` or diagnostics `data` if available.
- Keep compatibility with older top-level `message`.

Validation:

- Protocol test for schema-conformant error notification.
- React diagnostics test if message display path needs explicit coverage.

### 7. Normalize `item/fileChange/patchUpdated` to current schema

Current risk: generated protocol uses top-level `changes`, but the normalizer
and fixture prefer stale `patch` shape. The UI can recover in some cases, but
normalized state is semantically wrong and tests mask drift.

Primary files:

- `packages/codex/src/normalizers/items.ts`
- `fixtures/app-server/v2-jsonrpc/patch-streaming.jsonl`
- `packages/codex/test/protocol.test.ts`
- `packages/react/src/timeline/blocks.ts`
- `packages/react/src/diff-viewer.tsx`

Implementation shape:

- Prefer top-level `params.changes`.
- Store either the changes array or `{ changes: params.changes }`, consistently
  with what the React diff path expects.
- Keep `params.patch` only as a legacy fallback.
- Update fixture to use current `changes` shape.

Validation:

- Protocol test proving state does not pollute patch data with
  `threadId`/`turnId`/`itemId`.
- Existing diff viewer/rendering tests.

### 8. Decide the `process/*` notification contract

Current state: `process/outputDelta` and `process/exited` are listed as stable
notifications and preserved as raw protocol notifications, but there is no
Agent UI process surface or store. Forcing them into item command output would
be wrong because they lack thread/turn/item correlation.

Primary files:

- `packages/codex/src/protocol.ts`
- `packages/codex/src/normalizer.ts`
- `packages/codex/src/normalizers/items.ts`
- `packages/core/src/state.ts` only if a process store is added
- `docs/reference/codex-protocol.md`

Decision options:

- Document the current behavior: process notifications are preserved as raw
  protocol notifications and are not rendered by default.
- Or add an explicit process event/store keyed by `processHandle`, with decoded
  stdout/stderr and exit state.

Recommended near-term path:

- Document raw preservation and add tests asserting process notifications remain
  available in diagnostics/protocol notification history.
- Add a process store only when there is a real UI or host API consumer.

## Phase 3: Server Runtime Hardening

### 9. Replace automatic dynamic MCP namespace mapping

Current risks:

- `defaultDynamicToolHandler()` maps namespaces by regex and global underscore
  replacement.
- Current Codex namespaces include forms like `mcp__rmcp` and
  `mcp__codex_apps__calendar`.
- Automatic mapping can misroute or over-broaden access when hosts opt in.

Primary files:

- `packages/server/src/dynamic-tools.ts`
- `packages/server/src/websocket.ts`
- `packages/server/test/websocket.test.ts`
- `docs/reference/server-bridge.md`

Implementation shape:

- Replace regex-derived server names with explicit host-provided mappings.
- Provide a factory such as `createMcpDynamicToolHandler({ tools: [...] })`.
- Fail unknown namespaces/tools before starting helper threads or calling
  `mcpServer/tool/call`.
- Document breaking behavior clearly.

Validation:

- Tests for allowed mappings.
- Tests for unknown namespace/tool returning dynamic failure.
- Tests proving no `mcpServer/tool/call` is written for disallowed requests.

### 10. Make stderr redaction chunk-safe

Current risk: redaction is applied independently to arbitrary stream chunks.
Secrets split across chunks can leak suffixes to the host callback or browser
transport events.

Primary files:

- `packages/server/src/bridge.ts`
- `packages/server/src/redaction.ts`
- `packages/server/test/bridge.test.ts`
- `packages/server/test/redaction.test.ts`

Implementation shape:

- Make redacted stderr line-buffered, or use a bounded rolling carry buffer.
- Redact before invoking `onStderr` and before writing to the redacted stream.
- Flush redacted residual data on end.
- Cap carry size to avoid unbounded memory.

Validation:

- Split `Authorization: Bearer raw.` + `secret\n` test.
- Split `OPENAI_API_KEY=sk-` + `raw\n` test.
- Assert callback and transport stream do not contain full or suffix secret.

### 11. Reject pending stdio requests on EOF or stream error

Current risk: `CodexStdioTransport` handles stdout lines but does not reject
pending requests when stdout ends or errors unexpectedly. Browser/one-shot
requests can hang until an external timeout.

Primary files:

- `packages/codex/src/stdio-transport.ts`
- `packages/codex/test/stdio-transport.test.ts`
- `packages/server/src/bridge.ts`
- `packages/server/src/websocket.ts`

Implementation shape:

- Listen for readline `close`, stdout `end`, and stdout `error`.
- Mark transport closed/disconnected.
- Reject all pending requests.
- Push `connection/closed` or `connection/error` as appropriate.
- Resolve async iterator waiters so React/server loops can exit.

Validation:

- Request pending then `stdout.end()` rejects.
- EOF during initialize rejects connect.
- No pending map leak.

### 12. Account for next outbound WebSocket payload in backpressure

Current risk: backpressure guard checks existing `bufferedAmount` before send,
but not `bufferedAmount + nextPayloadBytes`. A single large event can push the
socket far past the limit.

Primary files:

- `packages/server/src/websocket-backpressure.ts`
- `packages/server/test/websocket-backpressure.test.ts`
- `packages/server/src/websocket.ts`

Implementation shape:

- Serialize once.
- Compute `Buffer.byteLength(payload)`.
- Close with the existing overload code if `bufferedAmount + payloadBytes`
  exceeds the configured limit.
- Preserve exact-boundary behavior.

Validation:

- Payload larger than limit closes without send.
- Exact boundary sends.
- Existing buffered-over-limit test remains.

### 13. Guard non-loopback example hosts

Current state: local examples default to `127.0.0.1`, which is acceptable. If
`AGENT_UI_HOST=0.0.0.0` or a LAN IP is supplied, the examples expose bridge,
upload, and directory-picker routes without authentication.

Primary files:

- `examples/codex-local-web/server.ts`
- `examples/next-with-bridge-sidecar/server.ts`
- `docs/examples/codex-local-web.md`
- `docs/examples/next-with-bridge-sidecar.md`

Implementation shape:

- Reject non-loopback hosts unless explicit unsafe opt-in is set.
- Suggested env: `AGENT_UI_ALLOW_NON_LOOPBACK=1`.
- Print a clear warning when unsafe opt-in is active.
- Factor host resolution into a pure helper if tests are added.

Validation:

- Test `127.0.0.1` and `localhost` pass.
- Test `0.0.0.0` and LAN IP fail by default.
- Test explicit opt-in permits.

## Phase 4: Refactor And Design Health

### 14. Generate protocol capability metadata

Current issue: `packages/codex/src/protocol.ts` manually maintains large method
lists while docs imply stronger generated-schema-derived metadata. This is
drift-prone.

Implementation shape:

- Extend schema import/generation to emit generated method lists.
- Keep only productization and host-only policy decisions handwritten.
- Update protocol drift docs to match the actual automation level.
- Make tests compare generated lists and policy overlays.

### 15. Extract AgentChat URL routing

Current issue: `AgentChat` mixes preset composition with URL parsing, history
writes, `popstate`, `thread/read`, `thread/resume`, and active-thread selection.

Implementation shape:

- Create a focused hook/module such as `thread-url-routing.ts`.
- Move pure helpers for path parsing and path building.
- Add targeted tests for direct URL load, custom base/home path, popstate,
  read/resume semantics, and failed thread reads.
- Reconcile docs that currently conflict on direct URL read versus resume.

### 16. Narrow public export surfaces

Current issue: some internal helpers are public because barrels export entire
modules. This turns internal cleanup into API work.

Implementation shape:

- Audit React and core root barrels.
- Decide which helpers are intentionally public.
- Move internal helpers behind non-exported modules or document them as public.
- Update API snapshots intentionally after review.

### 17. Bound companion metadata stores

Current issue: thread entities and diagnostics are bounded, but apps by scope,
skills by cwd, and hooks by cwd can grow without a retention policy.

Implementation shape:

- Add bounded policies for scoped app, skill, and hook stores.
- Tie thread-scoped app retention to thread entity retention where possible.
- Add tests proving both indexes and backing maps are bounded.

### 18. Split high-responsibility React modules

Current issue: some modules pass line-count guards but mix responsibilities.

Targets:

- `packages/react/src/components/composer.tsx`
- `packages/react/src/components/status.tsx`

Implementation shape:

- Extract composer attachment lifecycle and preview URL handling.
- Extract composer submit/key semantics.
- Extract status notice normalization and rate-limit severity parsing.
- Keep UI components presentation-focused.
- Preserve existing tests, then add focused tests for extracted pure logic.

## Validation Ladder

Use targeted validation per phase, then broader validation before merging.

Suggested sequence for correctness/security fixes:

```sh
bun run typecheck
bun run lint
bun test packages/core/test/reducer.test.ts
bun test packages/codex/test/protocol.test.ts packages/codex/test/session-api.test.ts packages/codex/test/raw-jsonrpc-fixtures.test.ts
bun --filter @nyosegawa/agent-ui-server test
bun run test:styles
```

Before claiming package/API compatibility:

```sh
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
bun run test:node-compat
```

Before claiming clean-state compatibility:

```sh
find packages examples -name dist -type d -prune -exec rm -rf {} +
find examples -name .next -type d -prune -exec rm -rf {} +
bun run typecheck
node scripts/check-clean-build-output.mjs
```

## Current Known Validation State

At the time this plan was written:

- `bun run typecheck` passed.
- `bun run test:styles` passed.
- Focused core/protocol tests passed:
  - `bun test packages/core/test/reducer.test.ts packages/codex/test/protocol.test.ts packages/codex/test/session-api.test.ts packages/codex/test/raw-jsonrpc-fixtures.test.ts`
- `node scripts/check-clean-build-output.mjs` failed because existing ignored
  `dist` and `.next` outputs are present.
- `bun run test:api-snapshots` failed because `react__index.d.ts` is out of
  date against the current built declarations.
