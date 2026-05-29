# Fix TODO

This TODO follows `FIX_PLAN.md`. Keep P0/P1 correctness and security work ahead of broad API/package/CI hardening unless a hardening change is an isolated no-behavior guard.

## Milestone 0: Contract Decisions And Regression Tests

Goal: lock public contracts and failing tests before implementation.

- [x] Decide the approval/server-request taxonomy.
  - Decision: `approval` is limited to `commandApproval`, `fileChangeApproval`, `legacyExecApproval`, and `legacyPatchApproval`; other App Server server requests are host integration requests surfaced through the broad server-request queue.
  - Completion: `approval` is explicitly limited to `commandApproval`, `fileChangeApproval`, `legacyExecApproval`, and `legacyPatchApproval`.
  - Completion: `permissionsApproval`, `mcpElicitation`, `userInput`, `dynamicTool`, `authRefresh`, and `attestation` are documented as broad server requests / host integration requests.
  - Completion: a failing test proves the default UI does not send decision-shaped responses to non-approval requests.

- [x] Decide the `useAgentServerRequests()` return shape.
  - Decision: take the clean break path: `useAgentServerRequests()` returns `{ requests, respond, reject }` and does not keep approval-named aliases.
  - API snapshot: React declaration snapshot is updated because the public hook return shape changed.
  - Completion: clean break path is `requests/respond/reject`, or compatibility path keeps `approve` as a deprecated alias.
  - Completion: docs, migration note, and API snapshot requirements are listed with the decision.

- [x] Decide the dynamic tool default queue policy.
  - Decision: exclude `dynamicTool` from the default core/UI server-request queue; bridge/host integrations handle dynamic tool calls out of band.
  - Test plan: reducer coverage proves normalized dynamic tool request events do not remain queued; Milestone 2 will add direct transport/bridge path coverage.
  - Completion: `dynamicTool` is either excluded from the default queue, or guaranteed to clean up on respond/reject or matching item completion.
  - Completion: direct transport/custom host regression tests are planned; bridge-only mitigation is not considered sufficient.

- [x] Decide fixture provenance.
  - Decision: use the flexible two-commit contract: `schemaCommit`, `fixtureSourceCommit`, and required `divergenceReason` when they differ.
  - Test plan: raw JSON-RPC fixture tests assert `schemaCommit === CODEX_PROTOCOL_COMMIT`, SHA-shaped fixture source commit, and divergence reason presence without reading a local upstream checkout.
  - Completion: choose strict equality with `CODEX_PROTOCOL_COMMIT`, or flexible `schemaCommit` + `fixtureSourceCommit` + `divergenceReason`.
  - Completion: normal protocol tests do not depend on local upstream ancestry.

- [x] Decide `skills/config/write` default policy.
  - Decision: keep `skills/config/write` productized by default for skill enablement through `useAgentSkills().setSkillEnabled()`.
  - Test plan: protocol classification distinguishes productized `skills/config/write` from host-only `config/value/write` and `config/batchWrite`.
  - Completion: if productized, docs/tests distinguish it from host `config/*` writes.
  - Completion: if host-only, default policies remove it and host opt-in/migration docs are planned.

- [x] Decide browser bridge initialize ownership.
  - Decision: bridge-owned initialize is authoritative when `attachAgentUiWebSocketBridge()` receives `initialize`; browser `initialize` is rejected in that mode, while omitting bridge `initialize` leaves browser-owned initialization available.
  - Test plan: WebSocket bridge test asserts App Server stdin receives one initialize and browser double-initialize receives a JSON-RPC error.
  - Completion: bridge-owned initialize and browser-owned initialize are not both allowed silently.
  - Completion: double initialize expected behavior is captured by a failing test.

- [x] Decide whether new redaction helpers are public or internal.
  - Decision: redaction helpers are public server exports when exposed from `@nyosegawa/agent-ui-server`; any new public helper must update the server API snapshot, otherwise it stays package-internal.
  - Test plan: redaction tests import helpers through the public server entrypoint so root-export drift is caught.
  - Completion: public helpers include server API snapshot updates.
  - Completion: internal helpers are not documented as public API.

Suggested validation:

```sh
bunx vitest run <new-focused-contract-tests>
bun run test:protocol
bun run typecheck
```

## Milestone 1: Approval / Server Request Boundary

Goal: stop the P0 correctness bug where default React UI can send invalid positive responses to non-approval App Server requests.

- [x] Make `selectPendingApprovals()` approval-only.
  - Implementation: keep `selectServerRequestQueue()` broad; filter `selectPendingApprovals()` to command/file/legacy approval kinds while preserving queue order.
  - Tests: include non-approval requests between approvals and assert the approval selector filters them while the broad selector keeps them.
  - Docs/API: no API snapshot if the signature stays the same; document the behavior correction.

- [x] Make `useAgentApprovals()` approval-only.
  - Implementation: read from `selectPendingApprovals()`.
  - Tests: focused React hook test proves permissions, MCP elicitation, user input, dynamic tool, auth refresh, and attestation are not returned.
  - Docs/API: update `docs/reference/hooks.md`; no snapshot if return shape is unchanged.

- [x] Make `useAgentServerRequests()` a broad neutral queue.
  - Implementation: return broad `requests`; clean break path exposes `respond(requestId, result)` and `reject(requestId, error)`.
  - Tests: broad hook returns non-approval requests and sends method-specific responses through `respond()`.
  - Docs/API: if the hook shape changes, update `react__index.d.ts` snapshots and add a migration note.

- [x] Limit `AgentApprovalQueue` default actions to approval kinds.
  - Implementation: show `Approve`, `Approve for session`, and `Decline` only for command/file/legacy approvals.
  - Implementation: remove fallback decision payloads for non-approval kinds.
  - Tests: non-approval requests do not render decision buttons and never send `{ decision: "accept" | "acceptForSession" | "decline" }`.
  - Docs/API: update `docs/reference/react-components.md`; no snapshot if props stay unchanged.

- [x] Render non-approval server requests only passively or through custom rendering.
  - Implementation: no full permissions/MCP/user-input/dynamic/auth/attestation forms in this milestone.
  - Tests: non-approval kinds show passive host-required context or custom renderer output only.
  - Docs/API: do not add a public `AgentServerRequestQueue` yet.

- [x] Replace existing wrong-behavior tests.
  - Implementation: remove/update tests that assert non-command server requests send decision-shaped accept/decline.
  - Tests: keep command/file/legacy accept/session/decline coverage.
  - Docs/API: docs migration lands in the same PR.

Suggested validation:

```sh
bunx vitest run <focused-react-server-request-tests>
bunx vitest run packages/core/test/reducer.test.ts
bun run test:protocol
bun run typecheck
```

If React public hook shape changes:

```sh
bun run validate:packages
bun run test:api-snapshots
```

## Milestone 2: Approval Reachability And Dynamic Tool Queue

Goal: keep pending approvals visible and prevent dynamic tool stale queue entries.

- [x] Implement window-aware approval anchor classification.
  - Implementation: classify as anchored only when the source item/turn actually renders in the visible transcript window.
  - Tests: source `itemId` outside initial window, `turnId` only with no visible item, and hidden/omitted source item all remain visible.
  - Docs/API: no public API change unless placement behavior is documented in detail.

- [x] Prefer tail fallback for the first reachability fix.
  - Implementation: do not change transcript window size or scroll behavior; move non-renderable anchors to the tail.
  - Tests: long transcript pending approval appears in the tail instead of disappearing.
  - Docs/API: browser-visible behavior requires fixture e2e.

- [x] Prevent `dynamicTool` from stale default queue state.
  - Implementation: follow the Milestone 0 policy: exclude from queue, or guarantee cleanup on local respond/reject or matching item completion.
  - Tests: direct stdio/WebSocket/custom host paths cannot leave `dynamicTool` indefinitely queued.
  - Docs/API: if excluded from broad state, document that dynamic tools are host/bridge integration requests handled out of band.

- [x] Align browser bridge dynamic tool handling with core policy.
  - Implementation: bridge dropping or out-of-band handling is not the only stale-prevention mechanism.
  - Tests: bridge path and direct path both avoid stale queue entries.
  - Docs/API: bridge docs state dynamic tools are not approval decisions.

Suggested validation:

```sh
bunx vitest run <focused-react-approval-windowing-tests>
bun run test:fixtures
bun run test:protocol
bun run test:e2e:fixtures
```

Before split e2e scripts exist:

```sh
bun run test:e2e:clean-ports
bun run test:e2e:playwright
```

## Milestone 3: Core Reducer Invariants

Goal: fix current reducer bugs within the existing event shape. Do not include `itemsView` or paged history here.

- [ ] Add a thread entity + registry commit helper.
  - Implementation: commit thread status, `registryStatus`, and registry bucket together for known threads.
  - Tests: after helper updates, each thread id is in exactly one bucket and matches `registryStatus`.
  - Docs/API: helper remains internal and is not root-exported.

- [ ] Treat `thread/status/changed` as a known-thread status-only event.
  - Implementation: unknown thread id is no-op; known thread classification uses existing turns.
  - Tests: unknown id creates no entity or dangling registry entry; known thread with turns plus `notLoaded` becomes preview-like, not cold.
  - Docs/API: no public API change.

- [ ] Synchronize registry on `turn/started` and `turn/completed`.
  - Implementation: route turn lifecycle reducer paths through the commit helper while preserving existing snapshot/status guards.
  - Tests: cold/preview thread becomes live on start; terminal completion keeps status, registry status, and bucket synchronized.
  - Docs/API: no public API change.

- [ ] Update metadata on repeated thread snapshots.
  - Implementation: latest `name`, `path`, `ephemeral`, and `raw` are merged/replaced while metadata-only updates preserve turns/items/token usage.
  - Tests: repeated `thread/upserted` changes metadata without removing ordered turns.
  - Docs/API: no public API change.

- [ ] Normalize stored snapshot items through the live item/block path.
  - Implementation: replace direct snapshot item assignment with `itemStore.upsert()` / `upsertMany()`-equivalent logic.
  - Tests: `selectItemBlock()` works for reasoning, command, file change, MCP/tool, web search, image, and system info blocks from stored items.
  - Docs/API: internal helper only.

- [ ] Fix `boundedRecordEntry()` recency.
  - Implementation: remove existing key, append updated key at the end, then trim to the last `maxEntries`.
  - Tests: helper-level update-then-insert coverage plus at least one reducer-level case for file patches, apps, skills, or hooks.
  - Docs/API: signature unchanged; snapshot unnecessary.

- [ ] Keep P1 core work free of stored-history pagination design.
  - Implementation: do not add `AgentTurn.itemsView`, `thread/turns/list`, `initialTurnsPage`, `turn/snapshot`, or full replacement/pruning in this milestone.
  - Tests: metadata-only snapshots are non-destructive under the current shape.
  - Docs/API: avoid public shape churn.

Suggested validation:

```sh
bunx vitest run packages/core/test/reducer.test.ts
bun run test:fixtures
bun run typecheck
```

If Codex/React history normalizers are touched:

```sh
bun run test:protocol
bunx vitest run packages/react/test/thread-history.vitest.ts
```

## Milestone 4: Server Bridge Security

Goal: align browser/log confidentiality and inbound resource limits with the documented contract.

- [ ] Extend `redactSecrets()` to colon-separated credentials.
  - Implementation: redact `OPENAI_API_KEY:`, `api_key:`, `api-key:`, `x-api-key:`, `token:`, `password:`, `secret:`, `device_code:`, `user_code:`, and `userCode:`.
  - Tests: table tests prove raw secrets are absent and existing key-value, JSON field, and bearer redaction still work.
  - Docs/API: update security docs; no signature change.

- [ ] Redact structured JSON-RPC error payloads before browser/HTTP responses.
  - Implementation: WebSocket browser RPC errors, Next one-shot route errors, and Express middleware errors pass through structured redaction.
  - Tests: error `code` and safe data remain; secret-bearing `message` and `data` are redacted.
  - Docs/API: public redaction helper export requires server API snapshot; internal helper does not.

- [ ] Redact bridge-owned diagnostics and dynamic tool failure text.
  - Implementation: all bridge-owned stderr/log messages pass through `redactSecrets()`.
  - Implementation: dynamic tool handler failure response text is redacted before returning to App Server when the error text is included.
  - Tests: dynamic tool handler errors containing secrets do not leak to host stderr or failure response.
  - Docs/API: update server bridge/security docs.

- [ ] Apply `ws.maxPayload` in `attachAgentUiWebSocketBridge()`.
  - Implementation: pass `inbound.maxMessageBytes ?? DEFAULT_MAX_INBOUND_MESSAGE_BYTES` to `new WebSocketServer({ maxPayload, path, server })`.
  - Implementation: keep the post-message guard for direct handler usage.
  - Tests: attached-server oversized frame does not reach App Server stdin; assert close code `1009` when stable.
  - Docs/API: update inbound byte-limit docs.

- [ ] Make admission throw/reject deterministic.
  - Implementation: run admission before spawn inside `try/catch`.
  - Implementation: `false` closes `1008`; throw/reject closes `1011`; spawn count remains zero; diagnostics are redacted.
  - Tests: sync throw and async reject have no unhandled rejection and no child spawn.
  - Docs/API: update admission lifecycle docs.

Suggested validation:

```sh
bunx vitest run packages/server/test/redaction.test.ts packages/server/test/bridge.test.ts packages/server/test/websocket.test.ts packages/server/test/next.test.ts packages/server/test/express.test.ts packages/server/test/websocket-backpressure.test.ts
bun run lint
bun run typecheck
```

If exported redaction helpers are added:

```sh
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
```

## Milestone 5: Protocol Fixture And Classification Contracts

Goal: mechanically detect drift in generated schema metadata, raw fixtures, server request classification, and capability metadata.

- [ ] Add generated protocol metadata consistency tests.
  - Implementation: compare `CODEX_PROTOCOL_COMMIT` / `CODEX_PROTOCOL_GENERATED_AT` with `packages/codex/package.json` `agentUi` and `packages/codex/src/generated/README.md`.
  - Tests: `bun run test:protocol` passes with current matching values.
  - Docs/API: update protocol drift docs; snapshot unnecessary.

- [ ] Migrate raw fixture manifest to a provenance-aware schema.
  - Implementation: add `schemaCommit`, `fixtureSourceCommit`, and `divergenceReason` when commits differ.
  - Tests: `schemaCommit === CODEX_PROTOCOL_COMMIT`; `fixtureSourceCommit` is SHA-shaped; divergence reason is required when commits differ.
  - Docs/API: update fixture provenance docs.

- [ ] Remove or isolate deprecated `item/fileChange/outputDelta` fixture data.
  - Implementation: remove deprecated method from non-deprecated `patch-streaming.jsonl`, or move it to `deprecated-file-change-output-delta.jsonl`.
  - Implementation: deprecated compatibility fixture uses plain text `delta`, not base64-looking literal.
  - Tests: non-deprecated fixtures do not include deprecated method; reduced output is readable text if compatibility fixture remains.
  - Docs/API: document deprecated fixture policy.

- [ ] Replace server request heuristics with an exact generated table.
  - Implementation: use `Record<StableServerRequestMethod, PendingServerRequest["kind"]>`.
  - Implementation: remove substring heuristics for `Approval` and `requestUserInput`.
  - Tests: every `stableServerRequestMethods` entry has a kind; unknown substring methods do not become `serverRequest/created`.
  - Docs/API: keep table internal unless hosts need it.

- [ ] Add stable notification coverage registry.
  - Implementation: classify generated stable notifications as `mapped`, `raw`, `ignored`, or `unsupported`.
  - Tests: newly generated notifications fail tests until classified.
  - Docs/API: no snapshot if registry is internal.

- [ ] Move `mock/experimentalMethod` to test-only classification.
  - Implementation: exclude it from `experimentalAvailableMethods`, `assertCodexExperimentalMethod()`, and host capability metadata.
  - Tests: generated experimental coverage includes available + unsupported + test-only; asserting mock method throws.
  - Docs/API: update Codex docs and API snapshots if public arrays/types change.

- [ ] Enforce capability metadata method uniqueness.
  - Implementation: uniqueness is by method, not by `status:method`.
  - Tests: same method cannot appear under multiple statuses.
  - Docs/API: no snapshot.

- [ ] Keep actual schema refresh out of this milestone.
  - Implementation: defer current upstream stable additions until schema import preflight in Milestone 8.
  - Tests: no generated tree refresh in this milestone.
  - Docs/API: no stable-types snapshot unless generated schema changes.

Suggested validation:

```sh
bun run test:protocol
bunx vitest run packages/codex/test/protocol.test.ts packages/codex/test/raw-jsonrpc-fixtures.test.ts
bun run typecheck
```

## Milestone 6: Stored History Pagination Semantics

Goal: handle upstream `itemsView` and paged history without data loss. This is P2 and separate from P1 core invariants.

- [ ] Add `itemsView` to `AgentTurn` / turn state.
  - Implementation: store `itemsView?: "notLoaded" | "summary" | "full"` from upstream turns.
  - Tests: all three values persist in reducer state.
  - Docs/API: update core API snapshots and public state docs.

- [ ] Implement completeness rank and non-destructive merge semantics.
  - Implementation: `notLoaded < summary < full`.
  - Implementation: `notLoaded` and `summary` do not delete or downgrade existing full item data.
  - Tests: partial views preserve command/file/tool items; `full` can upgrade summary data.
  - Docs/API: document merge rules.

- [ ] Add `thread/turns/list` normalizer.
  - Implementation: merge response pages with `itemsView`, cursor, and direction into chronological order.
  - Tests: descending pages merge correctly and `backwardsCursor` anchor refetch does not duplicate/misorder turns.
  - Docs/API: snapshot only if new public helper is exported.

- [ ] Add `thread/resume.initialTurnsPage` normalizer.
  - Implementation: resume metadata snapshot and initial turns page merge non-destructively.
  - Tests: `excludeTurns: true` with `initialTurnsPage` preserves existing transcript while adding page data.
  - Docs/API: snapshot only if public helper/export changes.

- [ ] Merge active turn snapshots idempotently.
  - Implementation: same turn id merges without duplication; stale interrupted snapshot does not clear streamed items unless full replacement is explicitly designed.
  - Tests: live in-progress turn receiving interrupted snapshot keeps item data and stable ordering.
  - Docs/API: no snapshot.

- [ ] Defer destructive full replacement/pruning.
  - Implementation: full snapshots remain merge-only until a source-strength event design exists.
  - Tests: absent items are not pruned.
  - Docs/API: no `turn/snapshot` API yet.

Suggested validation:

```sh
bun run test:protocol
bunx vitest run packages/core/test/reducer.test.ts packages/react/test/thread-history.vitest.ts
bun run typecheck
bun run test:api-snapshots
```

## Milestone 7: Transport Contract Parity

Goal: align stdio/WebSocket/SDK transports and browser bridge lifecycle contracts after P1 bridge security is fixed.

- [ ] Finish WebSocket / SDK event iterators after close.
  - Implementation: add stdio-like `ended` and waiter completion behavior.
  - Tests: close event drains, then `iterator.next()` returns `{ done: true }`; pending waiter close resolves.
  - Docs/API: update lifecycle docs; no type change.

- [ ] Type-tag JSON-RPC request id keys.
  - Implementation: shared internal helper distinguishes numeric `1` from string `"1"`.
  - Tests: string id response does not resolve numeric pending request in stdio/WebSocket transports.
  - Docs/API: no public helper unless intentionally exported.

- [ ] Add WebSocket `-32001` overload retry parity.
  - Implementation: share stdio retry-safe read/list method policy with WebSocket.
  - Tests: `thread/read` retries; `turn/start` does not; retry option is tested if exposed.
  - Docs/API: public option requires API snapshot.

- [ ] Bound stdio writable backpressure.
  - Implementation: handle `stdin.write()` `false` with bounded queue or drain-aware writer loop.
  - Tests: fake writable delayed `drain` preserves order; threshold behavior is explicit.
  - Docs/API: public option requires snapshot.

- [ ] Fix bridge close semantics contract.
  - Implementation: document current abandon-session cleanup or add explicit graceful stdio-drain mode.
  - Tests: `stdin.end()`/`SIGTERM` order, pending request rejection, and `SIGKILL` escalation are fixed; graceful option tests natural exit if added.
  - Docs/API: new shutdown option requires server API snapshot.

- [ ] Enforce browser bridge initialize ownership.
  - Implementation: bridge-owned initialize rejects browser `initialize` before forwarding; browser-owned path still works when bridge initialize is absent.
  - Tests: App Server stdin receives initialize once; browser gets rejection in double-initialize scenario.
  - Docs/API: update server bridge, protocol, and package export docs.

- [ ] Test/document Agent UI bridge envelope vs raw Codex wire.
  - Implementation: App Server notification/request/stderr/error reaches browser as `{ type: "agent-ui/transport-event", event }`; browser request response preserves original id as JSON-RPC response.
  - Tests: raw upstream notification is not forwarded as raw `{ method, params }`.
  - Docs/API: no snapshot.

Suggested validation:

```sh
bunx vitest run packages/codex/test/stdio-transport.test.ts packages/codex/test/websocket-transport.vitest.ts packages/codex/test/sdk-adapter.test.ts
bunx vitest run packages/server/test/bridge.test.ts packages/server/test/websocket.test.ts
bun run test:protocol
bun run typecheck
```

## Milestone 8: Package / CI / Schema Import Hardening

Goal: make published surfaces, schema import workflow, and browser validation gates reproducible after P0/P1 work.

- [ ] Add schema import preflight and metadata sync.
  - Implementation: require or platform-safely resolve `CODEX_REPO`; validate upstream paths and focused cleanliness before generation; capture HEAD/date/subject; generate to temp directories; update generated trees and metadata together.
  - Tests: helper tests for missing `CODEX_REPO`, dirty focused path, and metadata rendering if factored.
  - Docs/API: update schema refresh docs; no snapshot for script-only changes.

- [ ] Run actual schema refresh as a separate task after preflight.
  - Implementation: update generated stable/experimental trees to current upstream.
  - Tests: protocol, fixtures, typecheck, package validation.
  - Docs/API: update stable type API snapshots and protocol drift docs.

- [ ] Add API snapshot missing-dist preflight.
  - Implementation: report missing declaration targets and recommend `bun run build` / `bun run validate:packages` instead of raw `ENOENT`.
  - Tests: missing-dist smoke/focused script test.
  - Docs/API: update docs; no public API change.

- [ ] Add package packlist validation.
  - Implementation: validate built package dry-run file lists against allowed prefixes.
  - Tests: script detects unexpected sources, stale artifacts, and private generated files.
  - Docs/API: document packlist gate.

- [ ] Decide and implement Codex generated source publishing policy.
  - Implementation: remove `src/generated` from package `files` if declarations/runtime are self-contained, or document it as package-internal.
  - Tests: package-resolution smoke blocks `./src/generated`, `./src/generated/stable`, `./src/generated/experimental`, and representative generated files.
  - Docs/API: update package docs and snapshots if declaration/export paths change.

- [ ] Clean up core root exports deliberately.
  - Implementation: remove store singletons/interfaces, reducer-internal helpers, and `boundedRecordEntry()` from root public API; add `internal-testing` subpath only if needed.
  - Tests: core public surface allowlist.
  - Docs/API: update `core__index.d.ts` snapshot and package export docs.

- [ ] Improve Codex client facade typing.
  - Implementation: derive stable results and experimental params/results from generated types; keep a raw escape hatch if compatibility requires it.
  - Tests: type-level tests for wrong params and non-`unknown` stable responses.
  - Docs/API: update Codex snapshots and docs.

- [ ] Split e2e execution into fixture and real-local commands.
  - Implementation: add `test:e2e:fixtures`, `test:e2e:real-local`, and aggregate `validate:e2e`; targeted runs should not start unrelated servers.
  - Tests: both split commands and aggregate pass.
  - Docs/API: update testing/browser docs.

- [ ] Align browser e2e gate with CI/release/docs.
  - Implementation: add fixture e2e as first PR browser check; classify real-local as PR required, release, scheduled, or local-only.
  - Tests: verify local `validate:e2e` and workflow runs.
  - Docs/API: docs and workflows use the same gate wording.

- [ ] Add API snapshot readability / Node-CJS parity / runtime named-export smoke.
  - Implementation: separate semantic summary from private declaration chunk churn; add import/require declaration parity; check representative public named exports.
  - Tests: add scripts to package validation ladder.
  - Docs/API: docs update; no snapshot unless public declarations change.

Suggested validation:

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
bun run test:e2e:fixtures
bun run test:e2e:real-local
```

## Milestone 9: Docs, Accessibility, I18n, And Example Cleanup

Goal: address lower-risk UX/docs/example drift after correctness/security work. Docs-only quick fixes can land independently, but must not claim new CI behavior.

- [ ] Define queued follow-up post-turn policy.
  - Implementation: show `Send now` only when expected turn is active/steerable; otherwise show edit/move actions and preserve draft data.
  - Tests: focused composer queue tests and real-local e2e for bridge-backed follow-ups.
  - Docs/API: snapshot if hook return state changes.

- [ ] Make `AgentProvider` transport lifecycle StrictMode-safe.
  - Implementation: add `closeTransportOnUnmount` / `transportLifecycle` option or StrictMode-safe deferred close.
  - Tests: non-reconnectable fake transport under `<React.StrictMode>` is not prematurely closed.
  - Docs/API: provider prop/type snapshot and docs if option is added.

- [ ] Fix standalone `AgentComposer` accessible name and shortcut description.
  - Implementation: message composer label on form/region; attachment labels on file/list/chip surfaces; shortcut hint exposed with `aria-describedby` or equivalent.
  - Tests: focused accessibility tests and fixture e2e/ARIA snapshot.
  - Docs/API: component docs update.

- [ ] Move follow-up / attachment rejection copy into locale-owned phrases.
  - Implementation: do not pass English nouns such as `follow-up`, `attachments`, `file`, or `files` as interpolation values.
  - Tests: Japanese/non-English render tests contain no English noun leakage.
  - Docs/API: update React API snapshot if dictionary keys change.

- [ ] Align Apps normalizer vocabulary with upstream `AppInfo`.
  - Implementation: do not treat `isEnabled` as install state or `isAccessible === false` as direct auth truth without explicit docs.
  - Tests: apps normalizer semantic tests.
  - Docs/API: update `AgentApp` snapshots/docs if public type changes.

- [ ] Decide `selectOrderedThreads()` ordering contract.
  - Implementation: choose registry bucket/recency order, latest authoritative `thread/list` order, or current insertion order.
  - Tests: selector tests for chosen behavior.
  - Docs/API: selector docs update.

- [ ] Fix stale docs commands, paths, and selectors.
  - Implementation: remove missing `examples/local-react-vite/playwright.config.ts`; replace personal paths with `AGENT_UI_CODEX_CWD="$PWD"` or `<repo-root>`; use `.aui-approval` instead of `.aui-approval-card`.
  - Tests: optional docs guards for missing config paths, personal repo paths, and stale selectors.
  - Docs/API: docs-only.

- [ ] Decide docs-site browser smoke treatment.
  - Implementation: add tiny docs-site e2e if it remains a browser smoke surface, or weaken wording to compile/style smoke.
  - Tests: e2e or docs guard depending on chosen path.
  - Docs/API: docs-only.

- [ ] Resolve upload cleanup docs/example drift.
  - Implementation: add idempotent shutdown cleanup in `examples/codex-local-web`, or document TTL cleanup reliance and explicit cleanup hooks accurately.
  - Tests: idempotent shutdown cleanup test if implemented.
  - Docs/API: docs-only.

- [ ] Clarify `test:fixtures` naming / runner ownership.
  - Implementation: document that it is a core state/fixture gate, or rename toward `test:core-state` / `test:core-fixtures`.
  - Tests: script/docs consistency.
  - Docs/API: package scripts/docs only.

Suggested validation:

```sh
bun run lint
bun run test:styles
bun run typecheck
bun run test:e2e:fixtures
```

## Not To Do Early

- [ ] Do not start a broad `AgentApprovalQueue` presentational refactor before the non-approval invalid response bug is fixed.
- [ ] Do not mix `itemsView`, `thread/turns/list`, `initialTurnsPage`, `turn/snapshot`, or full replacement/pruning into the P1 core reducer fix.
- [ ] Do not start actual schema regeneration before import preflight, metadata consistency, fixture contract, deprecated fixture cleanup, and test-only experimental classification.
- [ ] Do not start core root export cleanup, Codex generated publishing cleanup, API snapshot readability, or CJS parity before P0/P1 correctness/security.
- [ ] Do not make the current all-in-one Playwright config a required PR CI gate; split fixture and real-local first.
- [ ] Do not document the Agent UI browser bridge as a transparent raw Codex WebSocket proxy.
- [ ] Do not build full permissions/MCP/user-input/dynamic/auth/attestation UI in P0; first stop generic decision responses.
- [ ] Do not run schema import from a default macOS path or dirty focused upstream checkout.

## Validation Ladders

### React Approval / Server Request

```sh
bunx vitest run <focused-react-server-request-tests>
bunx vitest run packages/core/test/reducer.test.ts
bun run test:protocol
bun run typecheck
```

Add when public React declarations change:

```sh
bun run validate:packages
bun run test:api-snapshots
```

### Browser-Visible Approval / Composer

```sh
bun run test:e2e:clean-ports
bun run test:e2e:fixtures
```

Add real-local when bridge-backed follow-up, upload, routing, streaming, steer, interrupt, or token usage changes:

```sh
bun run test:e2e:real-local
```

Before split e2e scripts exist:

```sh
bun run test:e2e:clean-ports
bun run test:e2e:playwright
```

### Core / Protocol

```sh
bunx vitest run packages/core/test/reducer.test.ts
bun run test:fixtures
bun run test:protocol
bun run typecheck
```

Add when public state/generated types change:

```sh
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
```

### Server Bridge

```sh
bunx vitest run packages/server/test/redaction.test.ts packages/server/test/bridge.test.ts packages/server/test/websocket.test.ts packages/server/test/next.test.ts packages/server/test/express.test.ts packages/server/test/websocket-backpressure.test.ts
bun run lint
bun run typecheck
```

### Transport

```sh
bunx vitest run packages/codex/test/stdio-transport.test.ts packages/codex/test/websocket-transport.vitest.ts packages/codex/test/sdk-adapter.test.ts
bun run test:protocol
bun run typecheck
```

### Package / API Boundary

```sh
bun run typecheck
bun run lint
bun run test
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
bun run test:node-compat
```

Add packlist/parity commands once introduced.

### Schema Refresh

```sh
CODEX_REPO=/home/sakasegawa/src/github.com/openai/codex bun --filter @nyosegawa/agent-ui-codex generate:schema
bun run test:protocol
bun run test:fixtures
bun run typecheck
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
```

### Final Broad Readiness

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
bun run test:e2e:fixtures
bun run test:e2e:real-local
```

## Final Priority Order

1. Contract decisions and failing tests.
2. Approval / server request boundary.
3. Approval reachability and dynamic tool queue cleanup.
4. Core reducer invariants: status/registry, metadata, block normalization, bounded recency.
5. Server bridge redaction, `ws.maxPayload`, admission exception handling.
6. Protocol fixture provenance, deprecated fileChange fixture cleanup, exact server request classification, test-only experimental classification.
7. Stored history `itemsView` and paged turn semantics.
8. Transport lifecycle/id/retry/backpressure and bridge initialize/close/envelope contracts.
9. Schema import preflight, actual schema refresh, package/API/CI hardening.
10. Docs/accessibility/i18n/apps/examples cleanup.
