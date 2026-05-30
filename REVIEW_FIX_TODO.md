# Review Fix Todo

These items correspond to `REVIEW.md`. P2 items should be fixed before merging this implementation branch. P3 items can be follow-up work if the team accepts the residual risk.

## P0/P1

No P0/P1 fixes are required by this review.

## P2

- [x] [F01] Fix hidden-source / pinned-source approval arrival so the required decision is visible or reachable when follow-scroll is at the transcript tail.
  - Completion condition: source anchoring remains intact, tail approvals keep their existing behavior, and a newly pinned anchored approval either scrolls its anchor/source into view or exposes a persistent pending-approval jump affordance distinct from "Jump to latest".
  - Focused validation: add focused React coverage for hidden-source approval arrival with follow mode active, plus desktop/mobile-visible coverage proving approval actions are visible or reachable, including a tall approval footer and mobile hit target.

- [x] [F02] Align stable `thread/resume` runtime behavior and docs with the stable-vs-raw policy.
  - Completion condition: `threadResumeParams()` and stable resume client paths whitelist stable fields or reject known experimental fields so JavaScript / `any` callers cannot forward `excludeTurns`, `initialTurnsPage`, or `path` through the stable facade; `docs/reference/codex-protocol.md` no longer claims stable local smoke coverage for `excludeTurns: true`.
  - Focused validation: add a runtime test using JS-shaped or `as any` params for `excludeTurns`, `initialTurnsPage`, and `path`; keep the existing type-test gate; run targeted Codex request-builder/client tests and Codex package typecheck if public types change.

- [x] [F03] Update `app/list` normalization and current fixtures to current generated `AppInfo` vocabulary.
  - Completion condition: current `app/list` and `app/list/updated` payloads preserve `logoUrl`, `logoUrlDark`, `appMetadata`, and `distributionChannel` in the documented normalized `AgentApp` contract; `apps-list-updates.jsonl` is refreshed to current `AppInfo` vocabulary or explicitly marked deprecated; current fixtures reject legacy-only `uri`, `installed`, and `needsAuth` as current evidence.
  - Focused validation: add generated-shape app/list normalizer/protocol tests and a current fixture-shape guard in the raw JSON-RPC fixture tests; run targeted Codex protocol / fixture tests and update API snapshots only if public declarations change.

- [x] [F04] Resolve the raw public `ServerRequestQueueState` key contract.
  - Completion condition: hosts that read or seed `AgentSessionState.serverRequestQueue.byId/order` can tell from types and docs whether `number:` / `string:` prefixed keys are public state or private storage; `serverRequest/resolved` and `serverRequest/rejected` dequeue host-seeded state according to the chosen contract.
  - Focused validation: add a reducer regression for host-seeded raw queue state; update seeded React/Codex fixtures to the chosen contract; run focused core reducer tests and update core API snapshots/docs if `RequestIdKey` or `ServerRequestQueueState` public typing changes.

- [x] [F05] Fix `FakeAgentTransport.close()` so extra same-generation waiters do not hang.
  - Completion condition: `close()` delivers or queues one `connection/closed` event, then drains all remaining same-generation pending `next()` calls with `{ done: true, value: undefined }`, matching real stdio/websocket/sdk transport finish semantics.
  - Focused validation: add `packages/core/test/fake-transport.test.ts` regressions for two pending reads on one iterator and pending reads across multiple iterators; run the focused fake transport test file.

- [x] [F06] Make one-shot default method enforcement private and immutable.
  - Completion condition: importing and mutating the public default-method export cannot widen omitted-`allowedMethods` policy; host-only methods such as `fs/readFile` remain denied unless a route explicitly allows them or uses the documented `"all"` escape hatch.
  - Focused validation: add a focused one-shot policy test proving public mutation or attempted mutation does not make `isOneShotRpcMethodAllowed("fs/readFile")` return `true`; update server API snapshots and server bridge docs if the exported symbol type changes.

- [x] [F07] Redact all plain-text `Authorization:` header values, not only Bearer tokens.
  - Completion condition: `Authorization: Basic ...`, mixed-case `authorization: Digest ...`, Bearer headers, and other schemes are redacted line-bounded without consuming the next diagnostic line; structured redaction behavior remains consistent.
  - Focused validation: add Basic, Digest, mixed-case, Bearer, and multiline cases to `packages/server/test/redaction.test.ts`; run the focused server redaction tests and update security docs only if documented behavior changes.

- [x] [F08] Add `@nyosegawa/agent-ui-codex/normalizer` to package export docs.
  - Completion condition: `docs/reference/package-exports.md` canonical public subpath list and Codex subpath guidance match `packages/codex/package.json`, package-resolution smoke expectations, runtime export policy, and the normalizer API snapshot.
  - Focused validation: run focused docs/package script tests and package-resolution smoke if a docs drift assertion is added; no API snapshot update is needed unless the public export surface changes.

- [x] [F09] Correct validation evidence and docs-sync overclaims.
  - Completion condition: `FIX_TODO.md` or the final handoff checklist only marks broad gates checked when durable local command evidence exists, or leaves them unchecked until rerun; validation docs-sync claims are narrowed to the scripts actually guarded or tests are broadened to cover the claimed ladder.
  - Focused validation: run focused package-scripts/docs tests for any docs-sync test changes; do not add GitHub Actions monitoring as a required validation step.

## P3

- [x] [F10] Make the dark/system token parity guard media-aware.
  - Completion condition: the parity test compares `[data-aui-theme="dark"]` with `[data-aui-theme="system"]` inside `@media (prefers-color-scheme: dark)`, not the shallow `--aui-color-scheme` blocks; preferably compare token values as well as names.
  - Focused validation: run `packages/react/test/style-duplication.vitest.ts` and ensure the test structure would fail if a token is missing from the real system-dark media block.

- [x] [F11] Handle rejecting Next sidecar upload cleanup without unhandled or cached rejections.
  - Completion condition: `server.on("close")` and signal-path cleanup failures are caught/reported, and the helper contract clearly defines whether a failed cleanup is retryable by resetting or intentionally retaining the cached promise.
  - Focused validation: add a rejecting-cleanup case to `test/next-sidecar-upload-cleanup.test.ts` proving no rejection escapes and pinning retry semantics; run that focused test.

- [x] [F12] Redact credential query parameters whose names are percent-encoded.
  - Completion condition: query keys that decode to credential-bearing names, including encoded underscore/dash variants such as `access%5Ftoken` and `api%2Dkey`, are redacted; malformed percent encodings do not make redaction throw.
  - Focused validation: add encoded-key and malformed-encoding safety cases to `packages/server/test/redaction.test.ts`; run the focused server redaction tests.

- [x] [F13] Decide and enforce or document dynamic helper permission callback value broadening.
  - Completion condition: callback grants that broaden requested filesystem mode/path or network values are either explicitly documented as host-owned exact decisions or rejected/narrowed by schema-aware subset validation.
  - Focused validation: add focused dynamic-tools coverage for a helper requesting read-only `/repo` while the callback returns workspace-write `/`; assert the behavior chosen by the contract and update server bridge/security docs if needed.

- [x] [F14] Strengthen method-result exactness beyond method-key coverage.
  - Completion condition: type coverage catches both missing/extra method keys and incorrect key-to-generated-response mappings; swapping response types between existing methods no longer satisfies typecheck.
  - Focused validation: add compile-only assertions for representative mappings such as `app/list`, `thread/resume`, `thread/read`, `turn/start`, `initialize`, and `thread/turns/list`, or derive the map from schema metadata; run focused Codex typecheck/tests and update API snapshots only if declarations change.

## Validation

- [x] [V01] Validate React approval and style fixes with focused local gates.
  - Completion condition: React approval behavior, scroll-follow behavior, and token parity guards have targeted automated evidence; browser-visible approval coverage includes desktop and mobile reachability.
  - Focused validation: run focused React component/timeline tests, focused fixture Playwright/e2e coverage for approval visibility, and `packages/react/test/style-duplication.vitest.ts` for token guard changes.

- [x] [V02] Validate Codex protocol, request-builder, app normalizer, fixture, and method-result fixes with targeted Codex gates.
  - Completion condition: stable resume runtime policy, current `AppInfo` preservation, current fixture shape, and method-result type exactness are covered without relying on stale legacy fixtures.
  - Focused validation: run targeted Codex request-builder/client tests, protocol normalizer tests, raw JSON-RPC fixture-shape tests, and Codex package typecheck when type-level assertions or public declarations change.

- [x] [V03] Validate core state and fake transport fixes with focused core tests.
  - Completion condition: fake transport close semantics and the chosen server request queue raw-state contract are covered for reducer-created and host-seeded state.
  - Focused validation: run `packages/core/test/fake-transport.test.ts` and the focused reducer tests that cover server request queue dequeue/cleanup.

- [x] [V04] Validate server security, bridge policy, dynamic-tools, and example cleanup fixes with focused server tests.
  - Completion condition: one-shot policy immutability, Authorization/query redaction, dynamic helper permission callback semantics, and Next sidecar cleanup rejection handling are pinned by targeted tests.
  - Focused validation: run focused server tests for one-shot policy, redaction, dynamic tools, and `test/next-sidecar-upload-cleanup.test.ts`.

- [x] [V05] Validate docs, package export lists, and API snapshots only where the public surface changed.
  - Completion condition: docs match package exports and validation evidence claims; API snapshots are updated only for changed exported symbols/types; broad release gates remain unchecked unless locally rerun with durable evidence.
  - Focused validation: run focused docs/package script tests and package-resolution smoke when public export docs or export maps change; do not include GitHub Actions monitoring.
