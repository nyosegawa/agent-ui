# Fix Plan

This plan consolidates the 10 investigation rounds in `tmp/subagent-reports/`. Its purpose is not to add more inventory, but to turn the confirmed issues into a sequence that keeps correctness, security, protocol fidelity, package boundaries, and browser validation reviewable.

## Priority Model

| Priority | Meaning |
| --- | --- |
| P0 | Current default UX/API can return the wrong result for the user's intent. This is release-blocking correctness work. |
| P1 | Confirmed correctness, security, resource-boundary, protocol-fixture, or validation drift that should be fixed before broad refactors. |
| P2 | Hardening, public API cleanup, transport parity, package/schema workflow, and CI reproducibility after P0/P1 contracts are stable. |
| P3 | Polish, docs hygiene, accessibility/i18n, example cleanup, and lower-risk reviewability improvements. |

## Execution Principles

- `Approval` means only command/file/legacy decision-shaped requests. All other App Server server requests are host-owned integration requests and must not receive generic `{ decision }` responses from the default UI.
- Fix current core reducer invariants before adding paged-history features. P1 core work must not include `itemsView`, `thread/turns/list`, `initialTurnsPage`, `turn/snapshot`, or destructive full-snapshot replacement.
- Schema regeneration is blocked until import preflight, metadata consistency, fixture provenance, deprecated fixture cleanup, and test-only experimental classification are in place.
- Browser e2e may be called a CI gate only after split fixture/real-local commands exist and the corresponding GitHub workflow actually runs them.
- The Agent UI browser bridge is an Agent UI transport-event bridge over Codex stdio, not a transparent raw Codex WebSocket proxy.
- Package boundary cleanup and API snapshot readability are hardening work and must not precede P0/P1 correctness and security fixes unless done as isolated no-behavior-change guard PRs.

## Phase Order

| Phase | Priority | Theme |
| --- | --- | --- |
| 0 | P0/P1 gate | Contract decisions and failing tests |
| 1 | P0 | React approval / server-request boundary |
| 2 | P1 | Approval reachability and dynamic tool queue policy |
| 3 | P1 | Core reducer invariants |
| 4 | P1 | Server bridge security and resource boundary |
| 5 | P1 | Protocol fixture and classification contracts |
| 6 | P2 | Stored history pagination semantics |
| 7 | P2 | Transport and bridge contract hardening |
| 8 | P2 | Package/API/schema import/CI hardening |
| 9 | P3 | Docs, accessibility, i18n, and example cleanup |

## Phase 0: Contract Decisions And Failing Tests

Lock public contracts and regression tests before implementation. This phase should produce short decision notes and focused failing tests, not broad refactors.

Decisions:

- Approval subset: `commandApproval`, `fileChangeApproval`, `legacyExecApproval`, and `legacyPatchApproval`.
- Broad server request hook shape: prefer `useAgentServerRequests() -> { requests, respond, reject }`.
- Dynamic tool queue policy: prefer excluding `dynamicTool` from the default UI/server-request queue, or otherwise guarantee cleanup outside the bridge path.
- Fixture provenance: prefer `schemaCommit` plus `fixtureSourceCommit`, with a required `divergenceReason` when they differ.
- `skills/config/write` policy: productized default with precise docs, or host-only opt-in.
- Browser bridge initialize ownership: prefer bridge-owned initialize for bridge examples, with browser `initialize` rejected when bridge owns it.
- New typed redaction helpers: public server exports or internal-only helpers.
- API compatibility stance: clean breaks allowed for unshipped wrong behavior, or migration aliases required for published surfaces.

Tests to add first:

- Non-approval requests do not render default approve/decline actions.
- `useAgentApprovals()` and `useAgentServerRequests()` have separate approval-only and broad server-request boundaries.
- Dynamic tool requests cannot remain stale in default state.
- Pending approval hidden by transcript windowing remains visible.
- Core thread status, registry status, and registry buckets remain synchronized.
- Structured JSON-RPC errors are redacted, and attached WebSocket payload limits are enforced before App Server stdin.
- Fixture provenance and deprecated `item/fileChange/outputDelta` semantics are checked.

Do not implement full permissions/MCP/user-input/dynamic/auth/attestation forms in this phase.

## Phase 1: P0 React Approval / Server-Request Boundary

Stop the default UI from sending invalid positive responses to non-approval App Server requests. This is the clearest release blocker: current UI can show "Approve" while upstream may interpret the response as an empty grant, decline, invalid auth/attestation response, or failed dynamic tool output.

Major work:

- Make `selectPendingApprovals()` and `useAgentApprovals()` approval-only.
- Keep `selectServerRequestQueue()` and `useAgentServerRequests()` as the broad protocol surface.
- Decouple `useAgentServerRequests()` from approval naming. Preferred clean API: `requests`, `respond(requestId, result)`, and `reject(requestId, error | message)`.
- Limit `AgentApprovalQueue` default decision actions to command/file/legacy approvals.
- Remove fallback `{ decision: "accept" }`, `{ decision: "acceptForSession" }`, and `{ decision: "decline" }` for non-approval kinds.
- Render non-approval server requests only as passive host-action-required context or through custom host rendering.
- Replace tests that currently lock non-command request decision behavior.
- Update `docs/reference/hooks.md`, `docs/reference/react-components.md`, and `docs/reference/codex-protocol.md` with a migration note pointing broad requests to `useAgentServerRequests()`.

Exclusions:

- Do not build kind-specific forms for permissions, MCP elicitation, user input, dynamic tool, auth refresh, or attestation.
- Do not add a public `AgentServerRequestQueue` before response-shape APIs are designed.
- Do not preserve broad `useAgentApprovals()` behavior with compatibility shims unless maintainers confirm it is a shipped host contract.

Validation:

```sh
bunx vitest run <focused-react-server-request-tests>
bunx vitest run packages/core/test/reducer.test.ts
bun run test:protocol
bun run typecheck
```

If hook return shapes or exported types change:

```sh
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
```

## Phase 2: P1 Approval Reachability And Dynamic Tool Queue

Keep pending approvals reachable in transcript-first UI and prevent dynamic tool requests from becoming stale queue entries outside the current bridge mitigation.

Major work:

- Make approval anchor classification renderability-aware by computing the visible transcript window before anchored/tail split.
- Treat an approval as anchored only if its `itemId` or `turnId` will actually render.
- Tail-fallback approvals whose source exists only outside the visible window.
- Add focused tests for source item outside the initial window, `turnId`-only approvals on itemless/windowed turns, and omitted/hidden source items.
- Fix dynamic tool queue policy. Preferred: do not enqueue `dynamicTool` into the default core/UI queue. Acceptable alternative: synthesize local cleanup on respond/reject or dequeue on matching item completion using `payload.callId`.
- Ensure direct stdio, direct WebSocket, and custom host paths cannot leave stale dynamic tool requests indefinitely.

Exclusions:

- Do not force-expand the transcript window in the first reachability fix; tail fallback is lower risk.
- Do not treat dynamic tools as approvals.
- Do not design a full host integration UI for dynamic tools in this phase.

Validation:

```sh
bunx vitest run <focused-react-approval-windowing-tests>
bun run test:fixtures
bun run test:protocol
bun run test:e2e:clean-ports
bun run test:e2e:fixtures
```

Before split e2e scripts exist, replace `test:e2e:fixtures` with:

```sh
bun run test:e2e:playwright
```

## Phase 3: P1 Core Reducer Invariants

Make normalized state internally consistent with upstream thread/turn semantics without public shape churn. This phase fixes confirmed current bugs only.

Major work:

- Add a central thread entity + registry commit helper.
- Keep `ThreadState.status`, `ThreadState.registryStatus`, and exactly one `threadRegistry` bucket synchronized for every known thread.
- Treat `thread/status/changed` as status-only: unknown thread id is a no-op, and known thread classification uses existing turns.
- Route `turn/started` and `turn/completed` through the central status/registry path.
- Merge latest thread metadata on repeated `thread/upserted`, `thread/started`, and read/list/resume snapshots while preserving existing turns/items for metadata-only updates.
- Route stored snapshot items through `itemStore.upsert()` or `upsertMany()` so `blocksByItemId` and `selectItemBlock()` work for rich block kinds.
- Fix `boundedRecordEntry()` recency by removing an existing key before appending the updated key, then trimming.
- Add reducer tests for status/registry sync, metadata upsert, block normalization, and recency.

Exclusions:

- Do not add `AgentTurn.itemsView`.
- Do not add `thread/turns/list` or `thread/resume.initialTurnsPage` normalizers.
- Do not introduce `turn/snapshot`.
- Do not implement destructive full snapshot replacement/pruning.
- Do not resolve `selectOrderedThreads()` ordering here unless the invariant work forces it.

Validation:

```sh
bunx vitest run packages/core/test/reducer.test.ts
bun run test:fixtures
bun run typecheck
```

If Codex or React history normalizers are touched:

```sh
bun run test:protocol
bunx vitest run packages/react/test/thread-history.vitest.ts
```

## Phase 4: P1 Server Bridge Security And Resource Boundary

Bring the server bridge browser/log boundary in line with the documented security and resource contract before recommending remote or non-loopback deployments.

Major work:

- Expand raw redaction to colon-separated credential formats: `OPENAI_API_KEY:`, `api_key:`, `api-key:`, `x-api-key:`, `token:`, `password:`, `secret:`, `device_code:`, `user_code:`, and `userCode:`.
- Redact structured JSON-RPC error payloads before browser WebSocket responses.
- Redact one-shot Next/Express RPC error responses.
- Redact bridge-owned diagnostics and dynamic tool handler failure text. Prefer redacting failure response text sent back to App Server as well, since it may become model-visible.
- Apply `inbound.maxMessageBytes ?? DEFAULT_MAX_INBOUND_MESSAGE_BYTES` to `WebSocketServer.maxPayload` in `attachAgentUiWebSocketBridge()`.
- Keep the existing post-message inbound guard for direct handler usage and defense in depth.
- Wrap admission hook execution in `try/catch`: `false` closes with `1008`; throw/reject closes with `1011`; no child spawn; no unhandled rejection; redacted diagnostics only.
- Update server bridge/security docs for redaction, parser-layer payload limits, and admission lifecycle.

Exclusions:

- Do not combine this with `skills/config/write` policy unless that decision is already made.
- Do not redesign bridge close/drain semantics here.
- Do not implement stdio writable backpressure here.
- Do not bundle package/API cleanup except necessary API snapshots if redaction helpers become public exports.

Validation:

```sh
bunx vitest run packages/server/test/redaction.test.ts packages/server/test/bridge.test.ts packages/server/test/websocket.test.ts packages/server/test/next.test.ts packages/server/test/express.test.ts packages/server/test/websocket-backpressure.test.ts
bun run lint
bun run typecheck
```

If new redaction helpers are exported:

```sh
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
```

## Phase 5: P1 Protocol Fixture And Generated-Surface Contracts

Make Codex protocol fixtures and method classification mechanically checked, and prevent stale/deprecated/test-only upstream surfaces from looking productized.

Major work:

- Add metadata consistency tests across `CODEX_PROTOCOL_COMMIT`, `CODEX_PROTOCOL_GENERATED_AT`, `packages/codex/package.json` `agentUi`, and `packages/codex/src/generated/README.md`.
- Migrate raw fixture manifest to a two-commit contract: `schemaCommit`, `fixtureSourceCommit`, and `divergenceReason` when commits differ.
- Assert `manifest.schemaCommit === CODEX_PROTOCOL_COMMIT`.
- Remove `item/fileChange/outputDelta` from the current non-deprecated `patch-streaming.jsonl`, or isolate it in a clearly named deprecated compatibility fixture.
- If the deprecated fixture remains, use plain text `delta`, not a base64-looking literal, and assert reduced output is human-readable.
- Replace heuristic server-request detection with an exact `Record<StableServerRequestMethod, PendingServerRequest["kind"]>` table.
- Add generated-driven exhaustiveness tests over `stableServerRequestMethods`.
- Add negative tests proving unknown methods containing `Approval` or `requestUserInput` are not treated as server requests.
- Classify `mock/experimentalMethod` as upstream test-only: not in `experimentalAvailableMethods`, rejected by `assertCodexExperimentalMethod()`, and absent from host-consumable capability metadata.
- Add method-only uniqueness for `codexCapabilityMetadata`.

Exclusions:

- Do not run actual schema regeneration in this phase unless schema import preflight already exists and passes.
- Do not adopt `thread/turns/list` normalization here unless Phase 6 is in scope.
- Keep the exact method-to-kind table internal unless hosts explicitly need it.

Validation:

```sh
bun run test:protocol
bunx vitest run packages/codex/test/protocol.test.ts packages/codex/test/raw-jsonrpc-fixtures.test.ts
bun run typecheck
```

If public capability arrays or types change:

```sh
bun run validate:packages
bun run test:api-snapshots
```

## Phase 6: P2 Stored History Pagination Semantics

Model upstream stored-history completeness before adopting paged history in UI. This prevents future data loss or hidden approval bugs when `thread/turns/list` and `initialTurnsPage` are used.

Major work:

- Add `itemsView?: "notLoaded" | "summary" | "full"` to turn state/public type.
- Define monotonic completeness: `notLoaded < summary < full`; partial views must not delete or downgrade existing full item data.
- Add `normalizeThreadTurnsListResponse()` / `normalizeTurnsPage()` helpers.
- Extend resume normalization to handle `initialTurnsPage`.
- Merge descending pages into chronological `orderedTurnIds`.
- Deduplicate `backwardsCursor` anchor turns.
- Preserve metadata-only and partial snapshots as non-destructive.
- Keep full snapshot replacement/pruning merge-only unless source strength is explicitly modeled.

Exclusions:

- Do not introduce destructive full replacement/pruning without a dedicated event/source-strength design.
- Do not let `summary` or `notLoaded` imply omitted command/file/tool items do not exist.
- Do not force approval anchors visible as a side effect of pagination; Phase 2 tail fallback remains the baseline.

Validation:

```sh
bun run test:protocol
bunx vitest run packages/core/test/reducer.test.ts packages/react/test/thread-history.vitest.ts
bun run typecheck
bun run test:api-snapshots
```

If public declarations change:

```sh
bun run validate:packages
bun run test:package-resolution
```

## Phase 7: P2 Transport And Bridge Contract Hardening

Align direct transports and browser bridge lifecycle with upstream semantics after the P1 security/resource boundary is fixed.

Major work:

- Make WebSocket and SDK event iterators finish after close, matching stdio: close event drains, next call returns `{ done: true }`, and pending waiters resolve on close.
- Add type-tagged JSON-RPC request id keys for pending maps so numeric `1` and string `"1"` do not collide.
- Share `-32001` safe retry policy between stdio and direct WebSocket: retry only read/list methods and never retry mutations.
- Bound or drain stdio writable pressure with a write queue / `drain` handling and tests.
- Decide bridge close semantics: document current abandon-session cleanup, or add explicit graceful stdio-drain mode.
- Decide and enforce browser bridge initialize ownership: if bridge owns initialize, reject browser `initialize`; if browser owns initialize, omit bridge initialize in that path.
- Add browser bridge envelope contract tests and docs: App Server notification/request/error to browser is `agent-ui/transport-event`; browser request response/error preserves browser id as JSON-RPC response.
- Clarify direct upstream WebSocket limitations: browser `Origin` rejection and unavailable non-loopback auth headers in standard browser WebSocket.

Exclusions:

- Do not bundle all transport work into the P1 bridge security PR.
- Do not productize direct Node WebSocket auth/header/send-buffer management unless direct upstream WebSocket becomes a stronger public surface.

Validation:

```sh
bunx vitest run packages/codex/test/stdio-transport.test.ts packages/codex/test/websocket-transport.vitest.ts packages/codex/test/sdk-adapter.test.ts
bunx vitest run packages/server/test/websocket.test.ts packages/server/test/bridge.test.ts
bun run test:protocol
bun run typecheck
```

If real-local browser behavior changes:

```sh
bun run test:e2e:clean-ports
bun run test:e2e:real-local
```

## Phase 8: P2 Package, API, Schema Import, And CI Hardening

Make published surfaces, generated schema workflow, API snapshot tooling, and browser CI gates repeatable after correctness/security contracts are stable.

Major work:

- Add schema import preflight and metadata sync:
  - require or validate `CODEX_REPO`;
  - check focused upstream cleanliness for `codex-rs/app-server` and `codex-rs/app-server-protocol`;
  - capture upstream HEAD/date/subject before deleting generated output;
  - generate to temp directories before replacing;
  - update `protocol.ts`, package metadata, and generated README from the same captured record.
- Run actual schema refresh only after preflight lands.
- Add API snapshot preflight so missing `dist/*.d.ts` reports `bun run build` / `bun run validate:packages`, not raw `ENOENT`.
- Add packlist validation after build.
- Decide Codex generated source publishing: preferred is removing `src/generated` from package `files` if declarations are self-contained; otherwise keep it package-internal and block `./src/generated/*` deep imports.
- Add generated source blocked subpaths to package-resolution smoke.
- Slim `@nyosegawa/agent-ui-core` root exports as a deliberate public surface cleanup.
- Add Node/CJS declaration parity and representative runtime named export checks.
- Split Playwright execution into `test:e2e:fixtures`, `test:e2e:real-local`, and aggregate `validate:e2e`.
- Add fixture e2e as the first PR CI browser gate.
- Decide real-local e2e placement: PR required, release-only, scheduled, or local-only, and make docs honest.

Exclusions:

- Do not let package boundary cleanup precede P0/P1 correctness/security.
- Do not regenerate schema from a personal default path or dirty upstream checkout.
- Do not claim Playwright is a CI gate until workflow jobs exist.
- Do not make the current all-in-one Playwright config required CI as-is.

Validation:

Package/API/schema:

```sh
bun run typecheck
bun run lint
bun run test
bun run test:protocol
bun run test:fixtures
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
bun run test:node-compat
```

E2E split/CI:

```sh
bun run test:e2e:clean-ports
bun run test:e2e:fixtures
bun run test:e2e:real-local
bun run validate:e2e
```

Schema refresh:

```sh
CODEX_REPO=/home/sakasegawa/src/github.com/openai/codex bun --filter @nyosegawa/agent-ui-codex generate:schema
bun run test:protocol
bun run test:fixtures
bun run typecheck
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
```

## Phase 9: P3 Docs, Accessibility, I18n, And Example Cleanup

Close lower-risk quality gaps after correctness, security, and validation contracts are stable. These can be parallel docs-only or polish PRs, but should not distract from P0/P1.

Major work:

- Fix standalone `AgentComposer` accessibility: message-composer-oriented accessible name, attachment labels on file/list/chip surfaces, and assistive-tech reachable shortcut hints.
- Move follow-up and attachment rejection copy to locale-owned phrases instead of English interpolation nouns.
- Make `AgentProvider` transport lifecycle StrictMode-safe by deciding provider-owned vs externally owned transport and adding an option or deferred-close behavior if needed.
- Align Apps vocabulary with upstream `AppInfo`: do not treat `isEnabled` as installed state, and do not name `isAccessible === false` as direct `needsAuth` unless documented as a display approximation.
- Fix stale docs: screenshot command must not reference missing `examples/local-react-vite/playwright.config.ts`; real-local examples should use `AGENT_UI_CODEX_CWD="$PWD"` or `<repo-root>`; browser verification should use `.aui-approval`, not `.aui-approval-card`.
- Decide docs-site browser smoke: add a tiny e2e if it remains described as a browser smoke surface, or weaken wording.
- Fix upload cleanup docs/example drift with idempotent shutdown cleanup or accurate TTL cleanup wording.
- Clarify `test:fixtures` naming or document that it is a core state/fixture gate, not only JSON fixture validation.
- Decide `selectOrderedThreads()` ordering contract when history UI work touches it.

Exclusions:

- Do not start pure/connected `AgentApprovalQueue` refactor before Phase 1 fixes invalid response behavior.
- Do not use docs quick fixes as a substitute for actual e2e CI/workflow changes.
- Do not add docs-site e2e before higher-priority browser contracts unless docs-site remains a claimed QA surface.

Validation:

```sh
bun run lint
bun run test:styles
bun run typecheck
```

For browser-visible polish:

```sh
bun run test:e2e:clean-ports
bun run test:e2e:fixtures
```

If public React types, i18n dictionaries, or provider props change:

```sh
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
```

## Validation Matrix

| Change type | Required validation |
| --- | --- |
| React server-request/approval behavior | Focused React tests, core reducer tests if selectors change, `bun run test:protocol`, `bun run typecheck`, API snapshots if hook types change |
| Approval visibility / browser-visible UI | Focused React tests, `bun run test:e2e:fixtures`, full Playwright aggregate until split scripts exist |
| Core reducer/state | `bunx vitest run packages/core/test/reducer.test.ts`, `bun run test:fixtures`, `bun run typecheck`; add `bun run test:protocol` when normalizers change |
| Codex protocol/fixtures | `bun run test:protocol`, focused protocol/raw fixture tests, `bun run typecheck`; package/API validation if public protocol exports change |
| Server bridge security | Server unit tests, `bun run lint`, `bun run typecheck`; package/API validation if new server helpers are public |
| Transport lifecycle | Codex transport tests, server bridge tests when bridge behavior changes, `bun run test:protocol`, `bun run typecheck` |
| Package/public API | `bun run typecheck`, `bun run lint`, `bun run test`, `bun run validate:packages`, `bun run test:api-snapshots`, `bun run test:package-resolution`, `bun run test:node-compat` |
| Schema refresh | `generate:schema` with explicit `CODEX_REPO`, `bun run test:protocol`, `bun run test:fixtures`, `bun run typecheck`, `bun run validate:packages`, API snapshots, package resolution |
| Browser CI/workflow | Split e2e commands, `bun run validate:e2e`, then GitHub Actions follow-through after push |

## Full Final Ladder

Use after a milestone that crosses multiple areas or before claiming broad readiness:

```sh
bun run typecheck
bun run lint
bun run test
bun run test:protocol
bun run test:fixtures
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
bun run test:node-compat
bun run test:e2e:clean-ports
bun run test:e2e:fixtures
bun run test:e2e:real-local
```

If split e2e commands are not available yet:

```sh
bun run test:e2e:playwright
```

Release-readiness shorthand after split:

```sh
bun run validate:release
bun run validate:e2e
```

Before split:

```sh
bun run validate:release
bun run test:e2e:clean-ports
bun run test:e2e:playwright
```

## Final Priority Summary

1. Contract decisions and focused failing tests.
2. P0 approval/server-request boundary.
3. P1 dynamic tool queue policy and approval windowing.
4. P1 core status/registry, metadata, block normalization, bounded recency.
5. P1 server bridge redaction, `maxPayload`, admission exception.
6. P1 fixture provenance, deprecated fileChange fixture, exact server request classification, test-only experimental classification.
7. P2 stored `itemsView` and paged turn semantics.
8. P2 transport parity and bridge protocol hardening.
9. P2 package boundary, schema import preflight, API snapshot preflight, e2e split/CI.
10. P3 docs, accessibility, i18n, apps, and examples cleanup.
