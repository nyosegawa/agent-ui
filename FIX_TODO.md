# Agent UI Fix TODO

## Phase 1: Blocking Correctness And Security

### Account Normalization

- [x] Inspect `packages/codex/src/normalizers/account.ts`.
- [x] Treat explicit `authMode: null` as unauthenticated.
- [x] Preserve legacy `authMethod: null` unauthenticated compatibility.
- [x] Treat non-null `authMode` as authenticated.
- [x] Preserve `planType` and raw payload.
- [x] Add protocol test for `{ authMode: null, planType: null }`.
- [x] Add protocol test for `{ authMode: "chatgpt", planType: "plus" }`.
- [x] Review and update `fixtures/app-server/v2-jsonrpc/account-login-rate-limit.jsonl`.
- [x] Run `bun run test:protocol`.
- [x] Run focused React account/status test if display behavior changes.

### One-Shot RPC Method Policy

- [x] Inspect `packages/server/src/next.ts`.
- [x] Inspect `packages/server/src/express.ts`.
- [x] Define shared one-shot RPC method policy.
- [x] Default one-shot helpers to productized App Server methods only.
- [x] Add `allowedMethods` option.
- [x] Decide whether to support an explicit unsafe `"all"` escape hatch.
- [x] Validate method/body shape before spawning bridge where possible.
- [x] Return clear disallowed-method error for host-only methods.
- [x] Add Next route test allowing `model/list`.
- [x] Add Next route test rejecting `fs/readFile`.
- [x] Add Next route test rejecting `command/exec`.
- [x] Add Next route test for missing/invalid method.
- [x] Add Express middleware tests matching the Next route policy.
- [x] Confirm rejected methods are not written to App Server stdin.
- [x] Confirm bridge closes after allowed and rejected requests.
- [x] Update `docs/reference/server-bridge.md`.
- [x] Update `docs/examples/next-rpc-route.md`.
- [x] Review `examples/next-rpc-route/app/api/agent-ui/route.ts`.
- [x] Run `bun --filter @nyosegawa/agent-ui-server test`.
- [x] Run `bun run typecheck`.

### Pending Server Request Lifecycle

- [x] Inspect `packages/core/src/reducer/server-requests.ts`.
- [x] Inspect `packages/core/src/reducer/connection.ts`.
- [x] Inspect `packages/core/src/stores/thread-index.ts`.
- [x] Identify a single helper path for thread status plus registry updates.
- [x] On `serverRequest/created`, set thread status to `waitingForInput`.
- [x] On `serverRequest/created`, update `ThreadState.registryStatus`.
- [x] On `serverRequest/created`, update `threadRegistry` bucket membership.
- [x] On `serverRequest/resolved`, keep waiting state if the thread has another pending request.
- [x] On `serverRequest/resolved`, restore thread status when no pending request remains.
- [x] On `serverRequest/resolved`, sync `ThreadState.registryStatus`.
- [x] On `serverRequest/resolved`, sync `threadRegistry`.
- [x] On `serverRequest/rejected`, keep waiting state if the thread has another pending request.
- [x] On `serverRequest/rejected`, restore thread status when no pending request remains.
- [x] On `serverRequest/rejected`, sync `ThreadState.registryStatus`.
- [x] On `serverRequest/rejected`, sync `threadRegistry`.
- [x] Before `connection/closed` queue clearing, collect pending request thread IDs.
- [x] On `connection/closed`, clear pending server requests.
- [x] On `connection/closed`, move affected `waitingForInput` threads to a non-waiting state.
- [x] On `connection/closed`, sync affected registry entries.
- [x] Decide exact `connection/error` pending-request behavior.
- [x] On `connection/error`, reconcile pending requests and affected waiting threads consistently.
- [x] Add reducer test for server request create registry sync.
- [x] Add reducer test for server request resolve registry sync.
- [x] Add reducer test for server request reject registry sync.
- [x] Add reducer test for multiple pending requests on one thread.
- [x] Extend disconnect test to assert thread status recovery.
- [x] Extend disconnect test to assert registry recovery.
- [x] Add connection error lifecycle test.
- [x] Run `bun test packages/core/test/reducer.test.ts`.

### Approval Visibility And Ordering

- [x] Inspect `packages/core/src/selectors.ts`.
- [x] Change `selectPendingApprovals()` to respect `serverRequestQueue.order`.
- [x] Consider delegating `selectPendingApprovals()` to `selectServerRequestQueue()`.
- [x] Add core selector test with request IDs `"10"` then `"2"`.
- [x] Inspect `packages/react/src/components/thread.tsx`.
- [x] Inspect `packages/react/src/timeline/approval-anchors.tsx`.
- [x] Allow itemId-only approvals to anchor to the turn containing the item.
- [x] Enforce turnId equality only when `turnId` is present.
- [x] Preserve tail fallback for metadata-free approvals.
- [x] Preserve or add fallback for anchored approvals whose transcript context is missing.
- [x] Add React test for itemId-only approval anchoring after matching item.
- [x] Add React test for unmatched itemId fallback if fallback is implemented.
- [x] Add React test that approval queue expands the FIFO first request.
- [x] Run relevant React component tests.
- [x] Run `bun test packages/core/test/reducer.test.ts`.

## Phase 2: Protocol Drift Fixes

### `command/exec/outputDelta`

- [x] Inspect `packages/codex/src/normalizers/items.ts`.
- [x] Inspect `packages/codex/src/normalizers/shared.ts`.
- [x] Add explicit base64 decode helper.
- [x] Use `params.deltaBase64` for `command/exec/outputDelta`.
- [x] Keep plain `delta` behavior for item output notifications.
- [x] Decide how to represent connection-scoped `processId` without thread/turn metadata.
- [x] Add protocol test with `deltaBase64: "aGkK"`.
- [x] Assert decoded output is `hi\n`.
- [x] Add raw JSONL fixture if fixture-pack coverage is desired.
- [x] Run `bun test packages/codex/test/protocol.test.ts`.

### Error Notification

- [x] Inspect `packages/codex/src/normalizers/status.ts`.
- [x] Read nested `params.error.message`.
- [x] Keep top-level `params.message` fallback.
- [x] Preserve useful `codexErrorInfo` or `additionalDetails` in raw/data.
- [x] Add protocol test for schema-conformant error notification.
- [x] Assert diagnostics error message is the nested message.
- [x] Run `bun run test:protocol`.

### File Change Patch Updates

- [x] Inspect `packages/codex/src/normalizers/items.ts`.
- [x] Inspect `packages/react/src/timeline/blocks.ts`.
- [x] Inspect `packages/react/src/diff-viewer.tsx`.
- [x] Prefer top-level `params.changes`.
- [x] Store patch data in the shape expected by the diff viewer.
- [x] Keep `params.patch` legacy fallback.
- [x] Update `fixtures/app-server/v2-jsonrpc/patch-streaming.jsonl` to current schema.
- [x] Add protocol test for top-level `changes`.
- [x] Assert stored patch data does not include `threadId`, `turnId`, or `itemId` pollution.
- [x] Run `bun run test:protocol`.
- [x] Run relevant React diff/timeline tests.

### Process Notifications

- [x] Inspect generated `ProcessOutputDeltaNotification`.
- [x] Inspect generated `ProcessExitedNotification`.
- [x] Decide whether Agent UI should expose a process store.
- [x] If no process store is added, document raw protocol notification preservation.
- [x] If no process store is added, add tests asserting process notifications are preserved as raw protocol notifications.
- [x] If a process store is added, define process state keyed by `processHandle`.
- [x] If a process store is added, decode stdout/stderr output deltas.
- [x] If a process store is added, store exit code and final stdout/stderr from `process/exited`.
- [x] Update `docs/reference/codex-protocol.md`.
- [x] Run `bun run test:protocol`.

## Phase 3: Server Runtime Hardening

### Dynamic MCP Tool Mapping

- [x] Inspect `packages/server/src/dynamic-tools.ts`.
- [x] Remove or deprecate regex-derived server-name routing.
- [x] Design explicit dynamic MCP tool mapping API.
- [x] Consider factory name such as `createMcpDynamicToolHandler`.
- [x] Require namespace/server/tool allowlist entries.
- [x] Fail unknown namespaces before helper thread creation.
- [x] Fail unknown tools before `mcpServer/tool/call`.
- [x] Update existing dynamic MCP tests to pass explicit mapping.
- [x] Add test for `mcp__rmcp` style namespace.
- [x] Add test for `mcp__codex_apps__calendar` style namespace if supported.
- [x] Add test for unknown namespace returning dynamic failure.
- [x] Add test proving unknown namespace does not call `mcpServer/tool/call`.
- [x] Update `docs/reference/server-bridge.md`.
- [x] Run `bun --filter @nyosegawa/agent-ui-server test`.

### Chunk-Safe Stderr Redaction

- [x] Inspect `packages/server/src/bridge.ts`.
- [x] Inspect `packages/server/src/redaction.ts`.
- [x] Decide line-buffered or bounded rolling-buffer approach.
- [x] Cap carry buffer size.
- [x] Redact before host `stderr` callback.
- [x] Redact before writing to redacted stream.
- [x] Flush redacted residual data on stream end.
- [x] Preserve stream error behavior.
- [x] Add bridge test for split bearer token.
- [x] Add bridge test for split `OPENAI_API_KEY`.
- [x] Assert callback does not contain full secret.
- [x] Assert callback does not contain suffix secret.
- [x] Assert transport stream does not contain full secret.
- [x] Assert transport stream does not contain suffix secret.
- [x] Run `bun --filter @nyosegawa/agent-ui-server test`.

### Stdio EOF And Pending Requests

- [x] Inspect `packages/codex/src/stdio-transport.ts`.
- [x] Add handling for readline `close`.
- [x] Add handling for stdout `end`.
- [x] Add handling for stdout `error`.
- [x] Reject all pending requests on unexpected EOF.
- [x] Push connection closed/error event on unexpected EOF.
- [x] Resolve async iterator waiters on terminal close if appropriate.
- [x] Ensure explicit `transport.close()` remains idempotent.
- [x] Add stdio transport test for pending request rejected on stdout EOF.
- [x] Add stdio transport test for EOF during initialize.
- [x] Add stdio transport test for no pending request leak.
- [x] Run `bun test packages/codex/test/stdio-transport.test.ts`.

### WebSocket Backpressure

- [x] Inspect `packages/server/src/websocket-backpressure.ts`.
- [x] Serialize outbound JSON payload once.
- [x] Compute `Buffer.byteLength(payload)`.
- [x] Check `bufferedAmount + payloadBytes`.
- [x] Close before send if next payload exceeds limit.
- [x] Preserve exact-boundary allowed behavior.
- [x] Add test for large single payload closing without send.
- [x] Add test for exact boundary sending.
- [x] Run `bun --filter @nyosegawa/agent-ui-server test`.

### Non-Loopback Example Hosts

- [x] Inspect `examples/codex-local-web/server.ts`.
- [x] Inspect `examples/next-with-bridge-sidecar/server.ts`.
- [x] Add loopback host resolver or guard.
- [x] Permit `127.0.0.1`.
- [x] Permit `localhost`.
- [x] Consider permitting `::1`.
- [x] Reject `0.0.0.0` by default.
- [x] Reject LAN IPs by default.
- [x] Add explicit unsafe opt-in environment variable.
- [x] Suggested env: `AGENT_UI_ALLOW_NON_LOOPBACK=1`.
- [x] Print warning when unsafe opt-in is active.
- [x] Add tests for loopback hosts.
- [x] Add tests for rejected non-loopback hosts.
- [x] Add tests for unsafe opt-in.
- [x] Update `docs/examples/codex-local-web.md`.
- [x] Update `docs/examples/next-with-bridge-sidecar.md`.

## Phase 4: Refactor And Design Health

### Protocol Capability Metadata

- [x] Inspect `packages/codex/scripts/import-schema.ts`.
- [x] Inspect `packages/codex/src/protocol.ts`.
- [x] Decide generated capability manifest shape.
- [x] Generate stable method list from schema.
- [x] Generate stable notification list from schema.
- [x] Generate stable server request list from schema.
- [x] Generate experimental method list from schema.
- [x] Keep productized method policy manually reviewed.
- [x] Keep host-only method policy manually reviewed.
- [x] Update protocol tests to compare generated lists and policy overlays.
- [x] Update `docs/architecture/protocol-drift.md`.
- [x] Run `bun run test:protocol`.

### AgentChat URL Routing Extraction

- [x] Inspect `packages/react/src/components/chat.tsx`.
- [x] Extract path helper for thread URL.
- [x] Extract path helper for home URL.
- [x] Extract parser for thread ID from path.
- [x] Create focused routing hook/module.
- [x] Move initial direct URL behavior into hook/module.
- [x] Move active-thread history push behavior into hook/module.
- [x] Move popstate behavior into hook/module.
- [x] Clarify direct URL `readThread` versus `resumeThread` semantics.
- [x] Update conflicting docs in `docs/reference/hooks.md`.
- [x] Add tests for default base path.
- [x] Add tests for custom base path.
- [x] Add tests for custom home path.
- [x] Add tests for browser back/forward.
- [x] Add tests for failed direct thread read.
- [x] Run relevant React component tests.

### Public Export Surface

- [ ] Inspect `packages/react/src/index.ts`.
- [ ] Inspect `packages/react/src/components.ts`.
- [ ] Inspect `packages/core/src/index.ts`.
- [ ] Inspect `docs/reference/package-exports.md`.
- [ ] Identify exported helpers that are intended public API.
- [ ] Identify exported helpers that are internal by accident.
- [ ] Decide whether `normalizedStatusNotices` should remain public.
- [ ] Decide whether `statusSummary` should remain public.
- [ ] Decide whether core store modules should remain root exports.
- [ ] Move accidental internals behind non-exported modules.
- [ ] Or document advanced public APIs intentionally.
- [ ] Update API snapshots intentionally after review.
- [ ] Run `bun run test:api-snapshots`.
- [ ] Run `bun run test:node-compat`.

### Companion Store Retention

- [ ] Inspect `packages/core/src/stores/apps.ts`.
- [ ] Inspect `packages/core/src/reducer/skills.ts`.
- [ ] Inspect `packages/core/src/reducer/hooks.ts`.
- [ ] Define retention limit for app scopes.
- [ ] Define retention limit for skills cwd entries.
- [ ] Define retention limit for hooks cwd entries.
- [ ] Tie thread-scoped app retention to thread entity retention where possible.
- [ ] Add tests proving app scope backing map is bounded.
- [ ] Add tests proving skills cwd backing map is bounded.
- [ ] Add tests proving hooks cwd backing map is bounded.
- [ ] Update docs if bounded state claims are broadened.
- [ ] Run `bun test packages/core/test/reducer.test.ts`.

### Composer Refactor

- [ ] Inspect `packages/react/src/components/composer.tsx`.
- [ ] Extract attachment state and preview URL lifecycle.
- [ ] Extract drag/drop handling.
- [ ] Extract mention attachment handling if useful.
- [ ] Extract submit mode decision for normal versus steer.
- [ ] Extract IME-aware Enter key handling if useful.
- [ ] Preserve attachment restore behavior for queued follow-up editing.
- [ ] Add focused tests for extracted attachment lifecycle.
- [ ] Add focused tests for submit/key semantics.
- [ ] Run relevant React component tests.

### Status Refactor

- [ ] Inspect `packages/react/src/components/status.tsx`.
- [ ] Extract status notice normalization.
- [ ] Extract rate-limit severity parsing.
- [ ] Extract diagnostics title logic.
- [ ] Fix fallback i18n coverage for exported helpers.
- [ ] Prefer shared English fallback dictionary or shared fallback adapter.
- [ ] Keep status UI components presentation-focused.
- [ ] Add focused tests for status notice normalization.
- [ ] Add focused tests for exported fallback helper output.
- [ ] Run relevant React component tests.

## Documentation Updates

- [ ] Update `docs/reference/server-bridge.md` after method policy changes.
- [ ] Update `docs/examples/next-rpc-route.md` after method policy changes.
- [ ] Update `docs/examples/codex-local-web.md` after non-loopback guard changes.
- [ ] Update `docs/examples/next-with-bridge-sidecar.md` after non-loopback guard changes.
- [ ] Update `docs/reference/codex-protocol.md` after protocol normalizer decisions.
- [ ] Update `docs/architecture/protocol-drift.md` after capability metadata changes.
- [ ] Update `docs/reference/hooks.md` after URL routing semantics are clarified.
- [ ] Update `docs/reference/package-exports.md` after export surface changes.
- [ ] Fix React component attachment example to return App Server-readable absolute paths.

## Validation Checklist

- [ ] Run `bun run typecheck`.
- [ ] Run `bun run lint`.
- [ ] Run `bun test packages/core/test/reducer.test.ts`.
- [ ] Run `bun test packages/codex/test/protocol.test.ts packages/codex/test/session-api.test.ts packages/codex/test/raw-jsonrpc-fixtures.test.ts`.
- [ ] Run `bun --filter @nyosegawa/agent-ui-server test`.
- [ ] Run focused React component tests for changed surfaces.
- [ ] Run `bun run test:styles`.
- [ ] Run `bun run validate:packages` after package/API changes.
- [ ] Run `bun run test:api-snapshots` after public declaration changes.
- [ ] Run `bun run test:package-resolution` after package export changes.
- [ ] Run `bun run test:node-compat` after package boundary changes.
- [ ] Run `bun run test:e2e:playwright` after browser-visible behavior changes.

## Clean-State Validation

- [ ] Remove package `dist` outputs before clean-state validation.
- [ ] Remove example `dist` outputs before clean-state validation.
- [ ] Remove example `.next` outputs before clean-state validation.
- [ ] Run `node scripts/check-clean-build-output.mjs`.
- [ ] Run `bun run typecheck` after cleanup.

## Current Known Baseline

- [x] `bun run typecheck` passes on the current checkout.
- [x] `bun run test:styles` passes on the current checkout.
- [x] Focused core/protocol tests pass on the current checkout.
- [ ] `node scripts/check-clean-build-output.mjs` passes on the current checkout.
- [ ] `bun run test:api-snapshots` passes on the current checkout.
