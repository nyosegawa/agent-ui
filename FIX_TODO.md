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

- [ ] Inspect `packages/core/src/selectors.ts`.
- [ ] Change `selectPendingApprovals()` to respect `serverRequestQueue.order`.
- [ ] Consider delegating `selectPendingApprovals()` to `selectServerRequestQueue()`.
- [ ] Add core selector test with request IDs `"10"` then `"2"`.
- [ ] Inspect `packages/react/src/components/thread.tsx`.
- [ ] Inspect `packages/react/src/timeline/approval-anchors.tsx`.
- [ ] Allow itemId-only approvals to anchor to the turn containing the item.
- [ ] Enforce turnId equality only when `turnId` is present.
- [ ] Preserve tail fallback for metadata-free approvals.
- [ ] Preserve or add fallback for anchored approvals whose transcript context is missing.
- [ ] Add React test for itemId-only approval anchoring after matching item.
- [ ] Add React test for unmatched itemId fallback if fallback is implemented.
- [ ] Add React test that approval queue expands the FIFO first request.
- [ ] Run relevant React component tests.
- [ ] Run `bun test packages/core/test/reducer.test.ts`.

## Phase 2: Protocol Drift Fixes

### `command/exec/outputDelta`

- [ ] Inspect `packages/codex/src/normalizers/items.ts`.
- [ ] Inspect `packages/codex/src/normalizers/shared.ts`.
- [ ] Add explicit base64 decode helper.
- [ ] Use `params.deltaBase64` for `command/exec/outputDelta`.
- [ ] Keep plain `delta` behavior for item output notifications.
- [ ] Decide how to represent connection-scoped `processId` without thread/turn metadata.
- [ ] Add protocol test with `deltaBase64: "aGkK"`.
- [ ] Assert decoded output is `hi\n`.
- [ ] Add raw JSONL fixture if fixture-pack coverage is desired.
- [ ] Run `bun test packages/codex/test/protocol.test.ts`.

### Error Notification

- [ ] Inspect `packages/codex/src/normalizers/status.ts`.
- [ ] Read nested `params.error.message`.
- [ ] Keep top-level `params.message` fallback.
- [ ] Preserve useful `codexErrorInfo` or `additionalDetails` in raw/data.
- [ ] Add protocol test for schema-conformant error notification.
- [ ] Assert diagnostics error message is the nested message.
- [ ] Run `bun run test:protocol`.

### File Change Patch Updates

- [ ] Inspect `packages/codex/src/normalizers/items.ts`.
- [ ] Inspect `packages/react/src/timeline/blocks.ts`.
- [ ] Inspect `packages/react/src/diff-viewer.tsx`.
- [ ] Prefer top-level `params.changes`.
- [ ] Store patch data in the shape expected by the diff viewer.
- [ ] Keep `params.patch` legacy fallback.
- [ ] Update `fixtures/app-server/v2-jsonrpc/patch-streaming.jsonl` to current schema.
- [ ] Add protocol test for top-level `changes`.
- [ ] Assert stored patch data does not include `threadId`, `turnId`, or `itemId` pollution.
- [ ] Run `bun run test:protocol`.
- [ ] Run relevant React diff/timeline tests.

### Process Notifications

- [ ] Inspect generated `ProcessOutputDeltaNotification`.
- [ ] Inspect generated `ProcessExitedNotification`.
- [ ] Decide whether Agent UI should expose a process store.
- [ ] If no process store is added, document raw protocol notification preservation.
- [ ] If no process store is added, add tests asserting process notifications are preserved as raw protocol notifications.
- [ ] If a process store is added, define process state keyed by `processHandle`.
- [ ] If a process store is added, decode stdout/stderr output deltas.
- [ ] If a process store is added, store exit code and final stdout/stderr from `process/exited`.
- [ ] Update `docs/reference/codex-protocol.md`.
- [ ] Run `bun run test:protocol`.

## Phase 3: Server Runtime Hardening

### Dynamic MCP Tool Mapping

- [ ] Inspect `packages/server/src/dynamic-tools.ts`.
- [ ] Remove or deprecate regex-derived server-name routing.
- [ ] Design explicit dynamic MCP tool mapping API.
- [ ] Consider factory name such as `createMcpDynamicToolHandler`.
- [ ] Require namespace/server/tool allowlist entries.
- [ ] Fail unknown namespaces before helper thread creation.
- [ ] Fail unknown tools before `mcpServer/tool/call`.
- [ ] Update existing dynamic MCP tests to pass explicit mapping.
- [ ] Add test for `mcp__rmcp` style namespace.
- [ ] Add test for `mcp__codex_apps__calendar` style namespace if supported.
- [ ] Add test for unknown namespace returning dynamic failure.
- [ ] Add test proving unknown namespace does not call `mcpServer/tool/call`.
- [ ] Update `docs/reference/server-bridge.md`.
- [ ] Run `bun --filter @nyosegawa/agent-ui-server test`.

### Chunk-Safe Stderr Redaction

- [ ] Inspect `packages/server/src/bridge.ts`.
- [ ] Inspect `packages/server/src/redaction.ts`.
- [ ] Decide line-buffered or bounded rolling-buffer approach.
- [ ] Cap carry buffer size.
- [ ] Redact before host `stderr` callback.
- [ ] Redact before writing to redacted stream.
- [ ] Flush redacted residual data on stream end.
- [ ] Preserve stream error behavior.
- [ ] Add bridge test for split bearer token.
- [ ] Add bridge test for split `OPENAI_API_KEY`.
- [ ] Assert callback does not contain full secret.
- [ ] Assert callback does not contain suffix secret.
- [ ] Assert transport stream does not contain full secret.
- [ ] Assert transport stream does not contain suffix secret.
- [ ] Run `bun --filter @nyosegawa/agent-ui-server test`.

### Stdio EOF And Pending Requests

- [ ] Inspect `packages/codex/src/stdio-transport.ts`.
- [ ] Add handling for readline `close`.
- [ ] Add handling for stdout `end`.
- [ ] Add handling for stdout `error`.
- [ ] Reject all pending requests on unexpected EOF.
- [ ] Push connection closed/error event on unexpected EOF.
- [ ] Resolve async iterator waiters on terminal close if appropriate.
- [ ] Ensure explicit `transport.close()` remains idempotent.
- [ ] Add stdio transport test for pending request rejected on stdout EOF.
- [ ] Add stdio transport test for EOF during initialize.
- [ ] Add stdio transport test for no pending request leak.
- [ ] Run `bun test packages/codex/test/stdio-transport.test.ts`.

### WebSocket Backpressure

- [ ] Inspect `packages/server/src/websocket-backpressure.ts`.
- [ ] Serialize outbound JSON payload once.
- [ ] Compute `Buffer.byteLength(payload)`.
- [ ] Check `bufferedAmount + payloadBytes`.
- [ ] Close before send if next payload exceeds limit.
- [ ] Preserve exact-boundary allowed behavior.
- [ ] Add test for large single payload closing without send.
- [ ] Add test for exact boundary sending.
- [ ] Run `bun --filter @nyosegawa/agent-ui-server test`.

### Non-Loopback Example Hosts

- [ ] Inspect `examples/codex-local-web/server.ts`.
- [ ] Inspect `examples/next-with-bridge-sidecar/server.ts`.
- [ ] Add loopback host resolver or guard.
- [ ] Permit `127.0.0.1`.
- [ ] Permit `localhost`.
- [ ] Consider permitting `::1`.
- [ ] Reject `0.0.0.0` by default.
- [ ] Reject LAN IPs by default.
- [ ] Add explicit unsafe opt-in environment variable.
- [ ] Suggested env: `AGENT_UI_ALLOW_NON_LOOPBACK=1`.
- [ ] Print warning when unsafe opt-in is active.
- [ ] Add tests for loopback hosts.
- [ ] Add tests for rejected non-loopback hosts.
- [ ] Add tests for unsafe opt-in.
- [ ] Update `docs/examples/codex-local-web.md`.
- [ ] Update `docs/examples/next-with-bridge-sidecar.md`.

## Phase 4: Refactor And Design Health

### Protocol Capability Metadata

- [ ] Inspect `packages/codex/scripts/import-schema.ts`.
- [ ] Inspect `packages/codex/src/protocol.ts`.
- [ ] Decide generated capability manifest shape.
- [ ] Generate stable method list from schema.
- [ ] Generate stable notification list from schema.
- [ ] Generate stable server request list from schema.
- [ ] Generate experimental method list from schema.
- [ ] Keep productized method policy manually reviewed.
- [ ] Keep host-only method policy manually reviewed.
- [ ] Update protocol tests to compare generated lists and policy overlays.
- [ ] Update `docs/architecture/protocol-drift.md`.
- [ ] Run `bun run test:protocol`.

### AgentChat URL Routing Extraction

- [ ] Inspect `packages/react/src/components/chat.tsx`.
- [ ] Extract path helper for thread URL.
- [ ] Extract path helper for home URL.
- [ ] Extract parser for thread ID from path.
- [ ] Create focused routing hook/module.
- [ ] Move initial direct URL behavior into hook/module.
- [ ] Move active-thread history push behavior into hook/module.
- [ ] Move popstate behavior into hook/module.
- [ ] Clarify direct URL `readThread` versus `resumeThread` semantics.
- [ ] Update conflicting docs in `docs/reference/hooks.md`.
- [ ] Add tests for default base path.
- [ ] Add tests for custom base path.
- [ ] Add tests for custom home path.
- [ ] Add tests for browser back/forward.
- [ ] Add tests for failed direct thread read.
- [ ] Run relevant React component tests.

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
