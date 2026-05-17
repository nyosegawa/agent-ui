# Agent UI Refactoring Strategy

This document is the result of a broad read-only audit across Agent UI, the
local Codex App Server checkout, tests, examples, package metadata, docs, and
CI. It is a refactoring execution plan, not a historical log.

Current implementation status: the first slices for Phases 0 through 7 are now
represented in code, tests, CI gates, and public docs. Keep this document as a
strategy/reference for any remaining deeper slices; do not treat historical
claims below as stronger than the current test suite and docs.

## Executive Summary

The most important refactor is not a React component split. The first problem is
contract hardness: the Codex App Server wire contract, server-request security,
transport lifecycle, package export boundary, and validation gates must be
made explicit before large UI reshaping.

The current implementation is already useful, but it has several high-risk
fault lines:

- App Server protocol details are partly generated and partly hand-rebuilt.
  The hand-built parts drift around `initialize`, `trace`, error metadata,
  `serverRequest/resolved` ordering, thread status, token usage, and several
  notification payload fields.
- The server bridge forwards browser JSON-RPC to the App Server too broadly,
  has no built-in auth/origin gate before process spawn, and defaults dynamic
  tool handling to a privileged helper thread.
- Transport lifecycle has no cancellation channel, unbounded event queues, weak
  close semantics, and incomplete backpressure handling.
- Core state keeps duplicated raw and normalized data indefinitely and flattens
  upstream concepts that need to remain distinct.
- React exposes useful primitives but still has preset-owned behavior,
  optimistic approval resolution, fragile mobile disclosures, and oversized
  test files.
- Distributed React CSS includes example-only styles and global page-level
  side effects.
- Package exports are broad but not frozen by a real API snapshot gate.

The right execution order is:

1. Baseline gates and protocol inventory.
2. Server-request security and bridge lifecycle.
3. Protocol schema and transport correctness.
4. CSS ownership first slice.
5. Core normalizer/state correctness and retention.
6. React primitive behavior and browser UX hardening.
7. Package API freeze.
8. Documentation, release gates, and full validation.

Bridge admission/method policy and protocol correctness can move in parallel
when independent tests make their boundaries clear. Docs should be updated in
the same slice as behavior changes, but the final public API/docs freeze should
happen after bridge and React behavior settle.

## Non-Goals

- Do not modify `/Users/sakasegawa/src/github.com/openai/codex` from this repo
  work. Treat it as the read-only upstream source of truth.
- Do not turn Agent UI into a host runtime. Watchers, workflow orchestration,
  persistence policy, sidecar lifecycle, and skill-with-app registries remain
  host-owned.
- Do not re-test the full Rust App Server in TypeScript. Agent UI should test
  the wire shapes and UI/state behavior it consumes.
- Do not make broad file splits as a substitute for design. Every split should
  protect a contract or reduce real coupling.
- Do not hide mobile usage/status/diagnostics to reduce layout pressure.
- Do not reintroduce a separate work trace. Transcript-first remains the UX
  contract.

## Phase 0: Baseline And Planning Source Of Truth

Purpose: make future work reviewable and prevent accidental regressions before
changing behavior.

Tasks:

- Keep this file as the durable refactor plan. If implementation starts, add a
  focused checklist file only if it will be actively maintained.
- Verify package-local test scripts still run from package cwd and do not
  depend on accidental repo-root paths.
- CI already has some gates and root scripts already include
  `check:dead-code`, `test:package-resolution`, `test:node-compat`, and the
  ordered package validation path. Align CI with the documented gates rather
  than adding duplicate scripts.
- Expand `scripts/package-resolution-smoke.mjs` beyond React root/styles:
  package roots, documented subpaths, CJS require/import behavior, and blocked
  deep imports.
- Expand `scripts/node-compat-smoke.mjs` to check important named exports from
  all packages.
- Add a built-declaration public API snapshot gate before moving exports.
- Add a CSS ownership smoke before moving style files so package CSS pollution
  is caught mechanically.

First slice:

- Make the existing package-resolution and node-compat smokes enumerate all
  documented package roots/subpaths and important named exports, then wire them
  into CI if they are not already required there.

Acceptance:

- `bun run typecheck`
- `bun run lint`
- `bun run test`
- `bun run check:dead-code`
- `bun run test:package-resolution`
- `bun run test:node-compat`

Recommended first commits:

- Package/API smoke expansion.
- CI workflow alignment with documented gates.
- CSS ownership smoke.

## Phase 1: Server Request Security And Bridge Lifecycle

Purpose: lock the host boundary before core state turns unsafe bridge behavior
into normal UI state.

Key issues:

- `attachAgentUiWebSocketBridge()` has no auth/origin gate before App Server
  process spawn.
- Browser JSON-RPC is forwarded as a raw App Server method tunnel.
- Default dynamic tool handling is too privileged for a reusable package.
- `mcpToolApproval: "accept"` accepts all MCP elicitations, not only tool
  approval elicitations.
- `permissions: "grant"` mirrors requested permissions without host scoping.
- Upload helper is useful for local development but lacks hardened
  per-session cleanup and malformed header handling.
- Stderr redaction is chunk-local and browser/host events can still carry raw
  structured data.
- Inbound WebSocket messages have no size/rate limit before parsing.
- Process close uses SIGTERM without wait/escalation.

Tasks:

- Add bridge-level auth/origin/admission hooks before spawning Codex.
- Add a method policy defaulting browser traffic to productized UI-safe methods.
  Host-only App Server methods must require explicit host policy.
- Change dynamic tool default to disabled or deny-by-default. Require explicit
  namespace/server/tool allowlists for helper execution.
- Remove `danger-full-access` and `approvalPolicy: "never"` as silent helper
  defaults. If hosts opt into that profile, make it visible and logged.
- Split MCP tool approvals from generic MCP elicitations by checking
  `_meta.codex_approval_kind === "mcp_tool_call"`.
- Replace blanket permission auto-grant with a callback policy that receives
  thread/cwd/path/network context and returns bounded grants.
- Add message size limits, connection limits, and parse-before-spawn rejection
  tests where possible.
- Harden process lifecycle: close transport, terminate child, wait, then
  escalate after a grace period.
- Harden upload helper with `mkdtemp` per session, malformed filename handling,
  method/content-type checks where applicable, TTL/cleanup hooks, and clear
  local-development docs.
- Expand redaction before stderr and structured browser/host event emission.

First slice:

- Add an admission hook that runs before `createCodexAppServerBridge()` and
  prove rejected WebSocket attempts do not spawn a child process. Then add the
  browser method policy in a separate commit.

Tests:

- `packages/server/test/websocket.test.ts`
- `packages/server/test/bridge.test.ts`
- `packages/server/test/upload.test.ts`
- `packages/server/test/redaction.test.ts`
- `packages/server/test/websocket-backpressure.test.ts`

Acceptance:

- Unauthenticated or rejected-origin WebSocket attempts do not spawn Codex.
- Disallowed methods are rejected before reaching App Server.
- Dynamic tools are not handled unless explicitly enabled.
- Generic MCP elicitations are never accepted by the MCP tool approval shortcut.
- Browser close, child stdout EOF, child exit, and slow browser paths clean up
  pending requests and processes deterministically.

## Phase 2: Protocol Schema And Transport Correctness

Purpose: make `@nyosegawa/agent-ui-codex` a faithful adapter to generated App
Server protocol instead of a partly inferred adapter.

Key issues:

- `CodexInitializeOptions` is weaker than generated `InitializeParams`.
- Both transports hand-build incomplete `capabilities`.
- `connection/connected` is emitted before protocol initialization completes.
- `initialized` is sent, but upstream currently only logs notifications; it
  must not be treated as readiness.
- JSON-RPC-lite supports top-level `trace`, but local types and transport APIs
  have no request options channel.
- WebSocket transport drops JSON-RPC error `code` and `data`.
- Experimental session opt-in is separate from initialized connection
  capability.
- Serialization scope is upstream-generated but not represented in local
  conformance tests.

Tasks:

- Type `CodexInitializeOptions` from generated stable shapes:
  require `clientInfo.version`, normalize nullable `title`, and include
  `requestAttestation`.
- Emit `connection/connected` only after initialize resolves, or split
  transport-open from protocol-ready in the event model.
- Keep sending `initialized` without params for protocol fidelity, but document
  and test that readiness is initialize response based.
- Add `AgentTransport.request(method, params, options?)` with optional `trace`
  and future `signal`/timeout room.
- Share JSON-RPC error construction between stdio and WebSocket so both preserve
  `code` and `data`.
- Add explicit experimental capability tracking so experimental requests fail
  locally when initialize did not opt in.
- Add pinned/generated serialization-scope metadata for tests and fake-server
  behavior. Do not duplicate upstream queueing in browser transports.
- Add raw JSON-RPC fixture coverage under `fixtures/app-server/v2-jsonrpc/`
  with a manifest recording upstream commit, source test, methods, and purpose.

First slice:

- Fix initialize readiness and JSON-RPC error metadata first: emit protocol-ready
  only after initialize resolves, preserve WebSocket error `code`/`data`, and
  add tests proving stdio and WebSocket expose the same request/response error
  shape.

Raw fixture starter set:

- `thread-start-basic.jsonl`
- `turn-text-stream.jsonl`
- `approvals-command-file.jsonl`
- `tool-requests.jsonl`
- `patch-streaming.jsonl`
- `thread-resume-usage.jsonl`
- `thread-history-state.jsonl`
- `apps-list-updates.jsonl`
- `account-login-rate-limit.jsonl`

Tests:

- `packages/codex/test/stdio-transport.test.ts`
- `packages/codex/test/websocket-transport.vitest.ts`
- `packages/codex/test/upstream-v2-jsonrpc-fixtures.test.ts`
- `packages/codex/test/upstream-v2-method-coverage.test.ts`
- Existing `bun run test:protocol`

Acceptance:

- Initialize request JSON exactly matches generated shape.
- JSON-RPC still omits `jsonrpc` and preserves optional `trace`.
- WebSocket and stdio expose the same error metadata.
- Raw upstream-shaped fixtures parse and normalize without relying on already
  normalized `AgentEvent` fixtures.

## Phase 3: CSS Ownership First Slice

Purpose: stop publishing example-only CSS as part of the core React package
before broader API freeze work.

Key issues:

- `packages/react/src/styles.css` imports example-only styles:
  `host-recipe.css`, `fixture-gallery.css`, `closeups.css`, and
  `usage-only.css`.
- `responsive.css` mixes core and example route rules.
- `.aui-status-summary` and `.aui-usage-summary` are defined in multiple
  modules with import-order behavior.
- `tokens.css` sets non-token page-level properties on `:root`.

Tasks:

- Add CSS ownership tests before moving files:
  public `styles.css` must not import example/demo/fixture chunks.
- Move example CSS to `examples/local-react-vite/src/styles/`.
- Split core responsive rules from route-specific responsive rules.
- Resolve status/usage selector collisions with base styles plus scoped
  variants.
- Move non-token document styling from `:root` to a documented Agent UI wrapper
  or theme class.

First slice:

- Add the CSS ownership test, then move only the obvious example route CSS out
  of the React package while keeping browser screenshots stable.

Tests:

- `packages/react/test/source-structure.vitest.ts`
- `packages/react/test/style-duplication.vitest.ts`
- `bun run test:e2e:playwright`

Acceptance:

- Distributed CSS contains no fixture/recipe/closeup/usage-only route classes.
- Fixture screenshots and layout contracts stay stable after moving example CSS.

## Phase 4: Core Normalizer And State Correctness

Purpose: make normalized state reflect upstream App Server concepts without
flattening away information needed by UI, approvals, usage, and status.

Key issues:

- `thread/name/updated` reads `name`, but upstream field is `threadName`.
- `thread/tokenUsage/updated` loses `turnId`.
- Structured upstream thread status and active flags are collapsed to
  `"running"`/`"loaded"`.
- `turn/completed` still assumes top-level `params.items`, while upstream item
  content arrives through item notifications and loaded reads/resumes.
- Several stable item stream notifications fall through to diagnostics.
- `command/exec/outputDelta` uses `deltaBase64` and process fields but is
  normalized as turn item command output.
- `pendingServerRequests` and `serverRequestQueue.byId` duplicate one map.
- Raw payload and normalized data are retained indefinitely.

Tasks:

- Normalize from generated stable notification/request shapes first, then
  derive core `AgentEvent`.
- Preserve structured thread status as raw/upstream status plus a display
  status. Map waiting-on-approval and waiting-on-user-input explicitly.
- Add turn-scoped usage state while keeping thread aggregate usage for existing
  UI.
- Remove phantom item merging from `turn/completed`; handle loaded items from
  `thread/read`/`thread/resume` explicitly.
- Add normalizer mappings for plan/reasoning deltas and raw response evidence
  only where they are UI-relevant.
- Separate host command process output from turn item command output.
- Consolidate server request queue storage.
- Add a raw-retention audit before deleting raw fields. Record which raw data
  is required for UI, debug, docs, and downstream host extension points.
- Add bounded retention policy for diagnostics, warnings, raw notifications,
  command output, file patches, and stale thread snapshots.

First slice:

- Add focused failing tests for `threadName`, token usage `turnId`, and
  `serverRequest/resolved` idempotency, then fix those normalizer/state paths
  without changing React layout.

Tests:

- `packages/core/test/upstream-v2-reducer-fixtures.test.ts`
- `packages/core/test/reducer.test.ts`
- Focused normalizer tests for `threadName`, `deltaBase64`, `turnId` usage,
  active flags, and `serverRequest/resolved`.

Acceptance:

- Raw upstream-shaped fixture streams produce stable visible state.
- Approvals stay pending until upstream `serverRequest/resolved`.
- Duplicate resolved/rejected notifications are idempotent.
- Long-running sessions have explicit caps or paging behavior.

## Phase 5: React Primitive Behavior And Browser UX

Purpose: improve composability without weakening transcript-first behavior.

Key issues:

- `useAgentApprovals()` optimistically dispatches `serverRequest/resolved` after
  `transport.respond()`, ahead of upstream ordering.
- `AgentThreadTimeline` appends pending approvals in the transcript footer,
  which is better than a side pane but not anchored to source item/turn.
- `AgentChat` wires bootstrap, URL routing, sidebar state, thread view, status,
  usage, diagnostics, and rail layout.
- Mobile rail expanded details can be clipped.
- Context usage popover can be clipped by composer overflow.
- Run settings menu closes on internal scroll and lacks full keyboard behavior.
- `AgentRunControls` uses `role="tablist"` with `aria-pressed`.

Tasks:

- Remove optimistic local approval resolution. Add a temporary "response sent"
  UI state if feedback is needed, but wait for upstream `serverRequest/resolved`
  to clear pending state.
- Extract approval placement logic into an ordered transcript-entry builder.
  Anchor approvals after source item when upstream payload contains item/turn
  metadata; keep transcript-tail fallback as the documented behavior when no
  source metadata exists.
- Keep `AgentChat` as a convenience preset. Improve primitives directly:
  thread surface, timeline, composer panel, status/usage/diagnostics surfaces.
- Add a shared disclosure/popover/sheet primitive for composer context usage,
  mobile status/usage/diagnostics, and menu surfaces.
- Fix menu scroll handling so internal panel scroll does not close the menu.
- Add Home/End and focus-return behavior.
- Convert segmented execution mode controls to `radiogroup` semantics or real
  tab semantics.

First slice:

- Remove optimistic approval resolution behind focused component/reducer tests,
  preserving a visible response-sent affordance only if needed. Do not combine
  this with menu, disclosure, or layout work.

Browser acceptance routes:

- `/`
- `/rich-transcript`
- `/fixture-gallery`
- `/host-workflow-recipe`
- `/usage-only`
- `/scoped-thread-pane`
- `/app-connectors`
- `examples/codex-local-web` `/threads/<threadId>`

Tests:

- Focused Vitest component tests before each behavior change.
- Playwright desktop and mobile checks for approval hit testing, composer
  anchoring, mobile rail reachability, menu focus, no horizontal overflow, and
  no independent approval scroll pane.
- Real local web layout audit extended to approval action hit testing.

Acceptance:

- Normal user/assistant messages remain expanded.
- Heavy command output/diffs remain disclosed without nested normal reading
  scroll traps.
- Approve/Decline are hit-testable on desktop and mobile.
- Usage-only and host-composed primitive routes remain independent of
  `AgentChat`.

## Phase 6: Package API Freeze

Purpose: make the published package boundary intentional.

Key issues:

- CSS chunks are copied into `dist/styles` and marked side-effectful, but only
  `./styles.css` is exported.
- `@nyosegawa/agent-ui-react` re-exports Codex request helpers but currently
  needs explicit package dependency scrutiny.
- Root barrels expose broad APIs without built declaration snapshots.
- `CodexStable` is public; generated schema churn must either be semver-public
  or moved to an advanced/unstable surface before freeze.
- This repo is still pre-freeze. Prefer clean public boundaries over preserving
  awkward aliases unless a documented consumer needs one.

Tasks:

- Decide whether CSS chunks are internal implementation files or public subpath
  imports. Prefer only `@nyosegawa/agent-ui-react/styles.css` as public unless
  there is a real host need.
- Add API/declaration snapshot tests from built `dist`.
- Classify exports as stable, advanced-public, or internal. Document removals
  as pre-freeze cleanup. Add changesets only for actual public API movement.
- Expand package-resolution and Node compatibility smokes for all packages and
  documented subpaths.

First slice:

- Generate a built declaration snapshot for current exports, classify it, and
  make the package-resolution smoke fail on undocumented deep imports.

Tests:

- New built API snapshot gate.
- `bun run test:package-resolution`
- `bun run test:node-compat`
- `bun run validate:packages`

Acceptance:

- Public exports are documented and mechanically checked.
- Package tarballs resolve through declared exports only.

## Phase 7: Documentation And Release Gate Closure

Purpose: align public docs with the final current-state behavior.

Tasks:

- Update `README.md` and `docs/README.md` only with current product usage, not
  migration diary.
- Update:
  - `docs/reference/codex-protocol.md`
  - `docs/reference/server-bridge.md`
  - `docs/reference/package-exports.md`
  - `docs/architecture/protocol-drift.md`
  - `docs/architecture/testing.md`
  - example READMEs
- Remove stale claims, especially around live smoke details, web component
  prop support, package validation, and CI coverage.
- Add release notes/changeset entries that match actual public API movement.

First slice:

- Read every public doc touched by protocol, bridge, React, CSS, and package
  export work. Delete or merge stale documents instead of preserving historical
  layers.

Final validation ladder:

```sh
find packages examples -name dist -type d -prune -exec rm -rf {} +
find examples -name .next -type d -prune -exec rm -rf {} +
bun run typecheck
bun run lint
bun run test
bun run test:protocol
bun run test:fixtures
bun run validate:packages
bun run check:dead-code
bun run test:package-resolution
bun run test:node-compat
bun run test:e2e:playwright
git status --short --branch
```

Run `bun run test:e2e:real-local-web-layout` when bridge, real local layout,
composer, approval placement, uploads, routing, or App Server-backed behavior
changes. Start `examples/codex-local-web` explicitly on port 5175 before that
gate.

## Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Protocol drift hidden by normalized fixtures | Real App Server messages break UI | Add raw JSON-RPC fixtures and upstream drift script |
| Server bridge exposes host-only methods | Local filesystem/process/security exposure | Method policy, auth/origin hooks, deny-by-default dynamic tools |
| Approval optimistic resolution hides pending state | UI order differs from App Server and user loses decisions | Wait for upstream `serverRequest/resolved`; add response-sent state only |
| Core state flattening loses upstream semantics | Usage/status/approval UI becomes inaccurate | Preserve upstream raw/structured fields plus display aliases |
| CSS file moves cause visual churn | Browser fixtures regress | Add CSS ownership tests first, then Playwright desktop/mobile |
| API cleanup breaks consumers silently | Published package regression | Built declaration snapshots and expanded package-resolution smoke |
| Full validation becomes too slow for every slice | Work stalls or skips tests | Use focused tests per slice, full ladder only before broad completion |

## Commit Slicing Rule

Every implementation commit should have one acceptance sentence. Add the
smallest failing test for that sentence, implement only enough to pass it, then
run the relevant validation ladder. Avoid mixing protocol, server security,
React layout, CSS, docs, and package exports in one commit unless the change is
impossible to split without lying about the contract.

## Long-Running Implementation Prompt

Copy this into a fresh Codex session when you want the strategy implemented end
to end:

```text
Work in /Users/sakasegawa/src/github.com/nyosegawa/agent-ui.

First read AGENTS.md and REFACTORING_STRATEGY.md completely. Then implement
REFACTORING_STRATEGY.md from Phase 0 through Phase 7 without stopping after a
partial cleanup or deciding that a smaller MVP is enough.

Important constraints:

- Do not modify /Users/sakasegawa/src/github.com/openai/codex. Use
  /Users/sakasegawa/src/github.com/openai/codex/codex-rs/app-server only as a
  read-only protocol and behavior reference.
- Agent UI is a reusable UI/component library for Codex App Server-backed
  hosts. Do not add watcher-specific, skill-with-app-specific, or app runtime
  orchestration features to the core packages.
- Do not do mechanical file splitting. Read the relevant files, understand the
  ownership boundaries, then make purpose-based changes with tests.
- Keep transcript-first UX: no separate Work trace, normal user/assistant
  messages expanded, approvals in transcript, no nested normal-reading scroll
  traps, composer anchored at the bottom, and thread history readable.
- Preserve all upstream-visible information. If state is normalized, keep
  enough structured upstream context for status, usage, approvals, diagnostics,
  and host extension points.
- Build/publint/attw must not be run in parallel. Use the ordered
  validate:packages path.

Execution process:

1. Start with Phase 0 gates and inventory. Confirm existing scripts, CI gates,
   package resolution, node compatibility, and CSS ownership tests before
   behavior changes.
2. For each phase, pick the documented first slice first. Add the smallest
   failing regression test, implement the fix, update docs in the same slice,
   run focused validation, then commit.
3. Continue through all phases. Do not leave stale docs, unused CSS/classes,
   obsolete examples, or historical TODO language behind.
4. Use subagents for read-only review or independent investigation when useful,
   but keep code edits deliberate and review the resulting diff yourself.
5. For UI-visible changes, verify both fixture routes and the real
   examples/codex-local-web app in desktop and mobile. Keep Playwright
   fail-fast; fix root causes instead of increasing timeouts.
6. After meaningful milestones, commit and push. After push, watch GitHub
   Actions to a concrete success/failure result and fix failures immediately.

Final acceptance:

- Phase 0 through Phase 7 are complete.
- Public package exports and CSS ownership are mechanically checked.
- Server bridge security defaults are deny-by-default and host-owned.
- Protocol fixtures and normalizers are aligned with generated Codex App Server
  stable shapes.
- React primitives remain composable, transcript-first, and browser-verified.
- README, docs, examples, AGENTS.md, and REFACTORING_STRATEGY.md match the
  actual implementation.
- Full validation passes:
  bun run typecheck
  bun run lint
  bun run test
  bun run test:protocol
  bun run test:fixtures
  bun run validate:packages
  bun run check:dead-code
  bun run test:package-resolution
  bun run test:node-compat
  bun run test:e2e:playwright
  bun run test:e2e:real-local-web-layout when App Server-backed behavior,
  bridge, routing, composer, approval placement, uploads, or real local layout
  changes.
- The working tree is clean, main is pushed, and GitHub Actions are green.
```
