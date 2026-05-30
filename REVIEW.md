# Implementation Review

This review covers the current uncommitted implementation against `FIX_PLAN.md` / `FIX_TODO.md`. It is based on five rounds of parallel subagent review reports under `tmp/`, source-level inspection, focused test evidence recorded by those reports, and targeted reproductions. GitHub Actions were intentionally not monitored.

## Findings

P0/P1: none found after triage. Earlier P1 candidates were downgraded because the raw upstream payload remains available or the issue is fixture/release evidence drift rather than an always-breaking runtime path. The P2 findings below should still block this branch because they affect security boundaries, public API contracts, required approval visibility, stable-vs-experimental policy, current protocol field preservation, public export docs, or handoff validation confidence.

### F01 - Hidden-Source Approvals Can Render Away From The Followed Viewport

Severity: P2, merge-blocking

Files: `packages/react/src/components/thread.tsx`, `packages/react/src/timeline.tsx`, `packages/react/src/timeline/scroll-follow.ts`, `packages/react/test/components.vitest.tsx`

Hidden-source approvals are now pinned near their resolved transcript source, but approval changes still drive the transcript follow-scroll to the bottom. A newly required approval can therefore render near an old pinned source above the current viewport while the composer is disabled for pending approval and the visible tail does not identify or jump to the off-screen decision. This is a reachability/discoverability regression, not a proven keyboard focus trap.

Suggested fix: when a newly pinned anchored approval arrives, scroll the anchor/source into view or show a persistent pending-approval jump affordance distinct from "Jump to latest". Add desktop and mobile-visible regression coverage that proves the decision actions are visible or reachable.

### F02 - Stable `thread/resume` Helpers Can Forward Experimental Fields At Runtime

Severity: P2, merge-blocking

Files: `packages/codex/src/request-builders.ts`, `packages/codex/src/generated/stable/v2/ThreadResumeParams.ts`, `packages/codex/src/generated/experimental/v2/ThreadResumeParams.ts`, `docs/reference/codex-protocol.md`

The type-test gate rejects `excludeTurns`, `initialTurnsPage`, and `path` for normal TypeScript callers, but `threadResumeParams()` still spreads all supplied runtime params. JavaScript or `any` callers can therefore send field-level experimental resume params through the stable facade without using `requestRaw()`. The protocol docs also still contain a Local Smoke claim for `thread/resume` with `excludeTurns: true`, contradicting the raw/host-managed policy.

Suggested fix: build `threadResumeParams()` from an explicit stable allowlist or reject known experimental fields at runtime. Add JS-shaped or `as any` runtime tests and align the Local Smoke docs so `excludeTurns` is raw/host-managed only.

### F03 - `app/list` Normalization And Current Fixtures Still Use Legacy App Vocabulary

Severity: P2, merge-blocking

Files: `packages/codex/src/normalizers/apps.ts`, `packages/core/src/state/apps.ts`, `packages/codex/src/generated/stable/v2/AppInfo.ts`, `fixtures/app-server/v2-jsonrpc/manifest.json`, `fixtures/app-server/v2-jsonrpc/apps-list-updates.jsonl`, `docs/reference/codex-protocol.md`, `docs/reference/hooks.md`

`normalizeApps()` preserves legacy/normalized `logos` and `metadata`, but current generated `AppInfo` exposes `logoUrl`, `logoUrlDark`, `distributionChannel`, and `appMetadata`. The current `apps-list-updates.jsonl` fixture is marked current while still using legacy fields such as `uri`, `installed`, and `needsAuth`. As a result, current app payloads can lose connector logos, marketplace metadata, and distribution information in normalized public fields while docs and fixtures imply current coverage.

Suggested fix: define the normalized logo/distribution shape, map `logoUrl`, `logoUrlDark`, `appMetadata`, and `distributionChannel`, and update generated-shape app tests. Refresh `apps-list-updates.jsonl` to current `AppInfo` vocabulary or mark it deprecated with a current-fixture shape guard.

### F04 - `ServerRequestQueueState` Has An Undocumented Public Typed-Key Contract

Severity: P2, merge-blocking

Files: `packages/core/src/request-id-key.ts`, `packages/core/src/state/server-requests.ts`, `packages/core/src/index.ts`, `test/api-snapshots/core__index.d.ts`, `docs/architecture/overview.md`, `examples/local-react-vite/src/fixtures/demo-state.ts`

The reducer now keys server requests with typed strings like `number:0` and `string:0`, but `ServerRequestQueueState` is still exported as `Record<string, PendingServerRequest>` and `string[]`, and `RequestIdKey` is not exported from the core barrel. Consumers that read or seed raw `AgentSessionState.serverRequestQueue` cannot tell whether prefixed keys are public raw state or private storage. Unprefixed host-seeded state can fail to dequeue on resolve/reject and leave threads stuck in `waitingForInput`.

Suggested fix: either export/type/document `RequestIdKey` and update snapshots, docs, and fixtures/tests, or hide typed storage behind selectors/helpers and keep public raw state request-id-oriented. Add a reducer regression for host-seeded raw state.

### F05 - `FakeAgentTransport.close()` Leaves Extra Same-Generation Waiters Unresolved

Severity: P2, merge-blocking

Files: `packages/core/src/fake-transport.ts`, `packages/core/test/fake-transport.test.ts`

`close()` sets the transport closed and pushes one `connection/closed` event, but `push()` resolves only the first same-generation waiter. A second pending `iterator.next()` or a pending read from another iterator can remain unresolved, unlike the real transport finish paths that emit a close event and resolve remaining waiters with `{ done: true }`.

Suggested fix: add a finish/drain path that delivers or queues one `connection/closed` event, then resolves all remaining same-generation waiters with `{ done: true, value: undefined }`. Cover same-iterator and multi-iterator pending reads.

### F06 - `DEFAULT_ONE_SHOT_METHODS` Is A Mutable Public Enforcement Set

Severity: P2, merge-blocking

Files: `packages/server/src/one-shot-rpc-policy.ts`, `test/api-snapshots/server__index.d.ts`

`DEFAULT_ONE_SHOT_METHODS` is exported as the same mutable `Set` used by `isOneShotRpcMethodAllowed()` when `allowedMethods` is omitted. Any in-process importer can mutate the default policy process-wide, for example by adding a host-only method before Express/Next checks run. That weakens the intended safe-by-omission one-shot boundary.

Suggested fix: keep the enforcement set private and immutable. Export only a readonly array/copy or a helper that returns a copy, and add a test proving public mutation cannot make `fs/readFile` pass under omitted `allowedMethods`.

### F07 - Plain-Text Redaction Misses Non-Bearer `Authorization:` Headers

Severity: P2, merge-blocking

Files: `packages/server/src/redaction.ts`, `packages/server/test/redaction.test.ts`

Plain-text redaction covers `Authorization: Bearer ...` and bare Bearer tokens, but it does not redact `Authorization: Basic ...`, Digest, or other schemes. Structured redaction treats `authorization` keys as credentials, so string and object behavior are inconsistent. Diagnostics, stderr callbacks, startup/admission errors, dynamic-tool failure text, or JSON-RPC errors containing non-Bearer headers can leak credentials.

Suggested fix: redact every plain-text `Authorization:` header value up to `\r`, `\n`, or end of string. Add mixed-case, Basic/Digest, Bearer, and multiline tests.

### F08 - Package Export Docs Omit The Codex Normalizer Subpath

Severity: P2, merge-blocking

Files: `docs/reference/package-exports.md`, `packages/codex/package.json`, `scripts/package-resolution-smoke.mjs`, `test/api-snapshots/codex__normalizer.d.ts`

`@nyosegawa/agent-ui-codex/normalizer` is a real public export in the package map, package-resolution smoke, runtime export policy, and API snapshot. It is missing from the canonical public subpath list and Codex subpath guidance in `docs/reference/package-exports.md`, so release docs contradict the actual public browser-safe export surface.

Suggested fix: add `@nyosegawa/agent-ui-codex/normalizer` to the canonical public subpath list and Codex guidance. Add a docs drift assertion if that list is intended to remain canonical.

### F09 - Validation Evidence And Docs-Sync Claims Are Overchecked

Severity: P2, merge-blocking for handoff

Files: `FIX_TODO.md`, `docs/architecture/testing.md`, `test/package-scripts-docs.test.ts`, `package.json`

`FIX_TODO.md` marks broad gates such as `validate:fast`, `validate:packages`, `test:package-resolution`, and fixture e2e as executed, but the review evidence records focused runs and explicitly notes missing browser viewport/manual coverage. Separately, the checked docs-sync test is narrower than the full validation ladder it appears to support. This can hand off the branch with false release confidence.

Suggested fix: attach durable local command evidence for checked broad gates or uncheck them until rerun. Narrow the docs-sync claim to the scripts it actually pins or broaden tests to cover the intended ladder.

### F10 - Dark/System Token Parity Guard Compares Shallow Blocks

Severity: P3

Files: `packages/react/test/style-duplication.vitest.ts`, `packages/react/src/styles/tokens.css`

The new parity guard reads the first shallow `[data-aui-theme="system"]` block, which only defines `--aui-color-scheme`. The real system-dark palette lives under `@media (prefers-color-scheme: dark)`, so future dark tokens can be omitted from system-dark mode without this guard failing. No current runtime palette mismatch was confirmed.

Suggested fix: make the helper media-aware and compare `[data-aui-theme="dark"]` with `[data-aui-theme="system"]` inside the dark media query, preferably comparing values as well as names.

### F11 - Next Sidecar Upload Cleanup Can Cache And Drop Rejecting Promises

Severity: P3

Files: `examples/next-with-bridge-sidecar/server.ts`, `examples/next-with-bridge-sidecar/upload-cleanup.ts`, `test/next-sidecar-upload-cleanup.test.ts`

The close and signal paths drop `cleanupUploads()` without rejection handling, and the idempotent cleanup helper caches the first promise even if it rejects. A transient cleanup failure can surface as an unhandled rejection during shutdown and later cleanup attempts reuse the rejected promise instead of retrying.

Suggested fix: catch/report cleanup errors at both call sites or inside the helper, and reset the cached promise on rejection if retry is desired. Add a rejecting-cleanup test documenting retry semantics.

### F12 - Query Redaction Does Not Classify Percent-Encoded Credential Keys

Severity: P3

Files: `packages/server/src/redaction.ts`, `packages/server/test/redaction.test.ts`

Query-param redaction classifies raw key strings before percent-decoding. Encoded credential names such as `access%5Ftoken` can bypass `redactSecrets()` even though the decoded key would be treated as credential-bearing.

Suggested fix: safely percent-decode query keys before credential classification, or explicitly match common encoded `_` and `-` variants. Add tests for encoded and malformed encodings.

### F13 - Dynamic Helper Permission Callback Bounding Is Family-Only

Severity: P3

Files: `packages/server/src/dynamic-tools.ts`, `packages/server/test/dynamic-tools.test.ts`, `docs/reference/server-bridge.md`

Callback grants are bounded to requested top-level permission families, but not to requested permission values. A host callback can accidentally grant broader filesystem mode/path data than the helper requested. This is lower severity than the removed default auto-grant because the callback is host-owned.

Suggested fix: either document that callbacks own the exact granted permission value, or add schema-aware subset validation/tests for filesystem and network grant values.

### F14 - Method-Result Exactness Only Proves Method-Key Coverage

Severity: P3

Files: `packages/codex/src/method-results.ts`

The new exactness checks compare method key sets against stable/experimental method unions, but they do not prove that each key maps to the matching generated response type. Swapping two existing response types would still satisfy the current coverage assertion.

Suggested fix: add compile-only assertions for representative high-value mappings or generate/derive the method-to-response map from protocol metadata so value drift is checked with key drift.

## Good Changes

- React `resumeThread()` and `readThread()` now dispatch Codex normalizer events instead of rebuilding snapshots locally, preserving canonical ids and upstream status more faithfully.
- Empty Enter while running is a local no-op while the Stop button remains the interrupt path, matching the transcript-first composer contract.
- The Codex normalizer subpath is otherwise wired through exports, tsup entries, TS/Vitest aliases, runtime export policy, package-resolution smoke, and API snapshots.
- Server one-shot defaults are narrowed, WebSocket defaults reject direct host-only methods, dynamic tool execution remains disabled without a host handler, and helper permissions default to manual with `deny` available.
- Core reducer work improves server-request replay, cleanup idempotency, waiting-state transitions, connection-close handling, and bounded retention coverage for visible indexes and backing stores.
- React style and package boundary guardrails were strengthened around public stylesheet imports, token use, API snapshots, and fixture accessibility.

## Validation Reviewed

Validation evidence came from the round 01-05 subagent reports and focused reproductions. Broad release gates were not treated as proven unless a report recorded an actual run.

- Server focused tests passed in reported runs, including redaction, Express, Next, WebSocket, one-shot RPC policy, dynamic tools, runtime export policy, and Next sidecar upload cleanup coverage.
- React focused tests passed in reported runs, including `components.vitest.tsx`, `thread-history.vitest.ts`, `timeline-pure.vitest.ts`, and `style-duplication.vitest.ts`; one fixture accessibility Playwright test also passed via `bunx playwright`.
- Core focused tests passed in reported runs for reducer and fake transport coverage, but reproductions confirmed the multiple-waiter close hang remains uncovered.
- Protocol/package focused checks passed where run, including Codex package typecheck, `validate:protocol`, raw JSON-RPC fixture method-list checks, package scripts docs tests, dead-code check, API snapshots, and selected e2e/script config tests.
- Focused reproductions confirmed the mutable one-shot set, non-Bearer Authorization leak, encoded query key leak, stable resume runtime spread, dynamic helper value broadening, and cached/rejected upload cleanup behavior.
- GitHub Actions were intentionally not monitored.

## Open Questions / Residual Risk

- Should `AgentApp.logos` have a documented normalized light/dark shape, and should `distributionChannel` be a first-class public field or live under `metadata`?
- Is `AgentSessionState.serverRequestQueue` intended as host-seedable public raw state, or should consumers be steered to selectors/actions only?
- Should dynamic helper permission callbacks intentionally own exact granted permission values, or should the bridge enforce value-level subsets?
- Manual browser QA was not performed for pinned approvals, focus-return edge cases, or mobile hit-testing; those remain residual UI risks after focused tests.
