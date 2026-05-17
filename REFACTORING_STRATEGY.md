# Agent UI Refactoring Strategy

This is the current refactoring plan for Agent UI. It is a strategy and
acceptance reference, not a migration diary. The repository has completed the
first slices for Phases 0 through 7; it is not yet honest to claim every deeper
Phase 0-7 item is complete.

## Current Status

Completed first-slice foundations:

- Package export resolution, Node compatibility, API snapshots, dead-code
  checks, CSS ownership tests, and ordered package validation are root gates.
- API snapshots are now based on package export maps. Missing, changed, and
  stale public declaration snapshots fail without `--update`; `--update`
  refreshes public snapshots and deletes stale snapshots. Bundler hashed
  declaration chunks are internal unless an export map points at them.
- The bridge has an admission hook before process spawn, a productized
  browser method policy, deny-by-default dynamic tool handling, MCP tool
  approval metadata checks, JSON-RPC error metadata preservation, and bounded
  permission auto-resolution through a host callback.
- Codex initialize is typed from generated stable `InitializeParams` and sends
  required `clientInfo.version`, nullable `clientInfo.title`, required
  `experimentalApi`/`requestAttestation`, and optional nullable
  `optOutNotificationMethods`.
- Stdio and WebSocket transports emit `connection/connected` after initialize
  resolves. The `initialized` notification is sent after that response and is
  not treated as readiness.
- Core normalizer/state first-slice fixes cover upstream `threadName`, token
  usage `turnId`, `deltaBase64`, structured thread status, raw retention for
  relevant events, and idempotent `serverRequest/resolved`.
- React first-slice fixes keep normal messages expanded, approvals in the
  transcript, no work trace, no detached approval scroll pane, no optimistic
  approval clearing before upstream `serverRequest/resolved`, and no fixture
  CSS in distributed React CSS.
- Public docs and examples describe current package boundaries, bridge shape,
  protocol shape, testing gates, and example routes.

Remaining deeper slices are listed below. Do not present this repository as
Phase 0-7 fully complete until those items are either implemented with tests or
explicitly removed from scope.

## Non-Goals

- Do not modify `/Users/sakasegawa/src/github.com/openai/codex`; use
  `/Users/sakasegawa/src/github.com/openai/codex/codex-rs/app-server` only as a
  read-only protocol reference.
- Do not turn Agent UI into a host runtime. Watchers, skill-with-app registries,
  workflow orchestration, persistence policy, and sidecar lifecycle are
  host-owned.
- Do not reintroduce Work trace, collapsed normal messages, detached approval
  panes, or nested normal-reading scroll traps.
- Do not run build, `publint`, and `attw` independently for package validation;
  use `bun run validate:packages`.

## Phase 0: Gates And Source Of Truth

Done:

- Root scripts cover typecheck, lint, unit/protocol/fixture tests,
  package validation, dead-code, API snapshots, package resolution, and Node
  compatibility.
- Package resolution and Node compatibility read actual package export maps and
  include root plus documented subpaths.
- CSS ownership tests prevent example/demo/fixture route CSS from being
  published in `@nyosegawa/agent-ui-react/styles.css`.
- API snapshots are an actual gate and target public export declarations only.

Remaining:

- Keep CI and docs in lockstep whenever a new root gate is added.
- Periodically run package-local `bun run test`/`typecheck` from package
  directories when package scripts change.

## Phase 1: Server Request Security And Bridge Lifecycle

Done:

- `admission` runs before the Codex child process is spawned.
- Browser JSON-RPC defaults to productized UI-safe methods.
- Host-only methods require an explicit browser method policy.
- Dynamic tool helper execution is disabled unless the host opts in.
- MCP approval auto-resolution is limited to elicitations with
  `_meta.codex_approval_kind === "mcp_tool_call"`.
- Permission requests are manual by default. Auto-resolution requires a host
  callback that receives request id, thread id, turn id, cwd, requested
  filesystem/network permissions, and raw payload, then returns bounded grants.
- Bridge browser responses preserve App Server JSON-RPC `code` and `data`.

Remaining:

- Add inbound WebSocket message size and rate limits before parsing.
- Harden child shutdown with wait/escalation after SIGTERM.
- Add per-session upload cleanup/TTL hooks and stricter malformed header tests.
- Expand structured redaction for host/browser event sinks beyond current stderr
  redaction coverage.

## Phase 2: Protocol Schema And Transport Correctness

Done:

- Initialize options use generated stable shape.
- Initialize request JSON is covered by transport tests.
- Readiness is initialize response based; `initialized` is a post-response
  notification.
- Stdio, WebSocket, and bridge paths preserve JSON-RPC error metadata.
- Backpressure retry remains limited to idempotent read methods.

Remaining:

- Add request options for optional `trace` and future abort/timeout handling.
- Track experimental capability at the session layer so experimental requests
  fail locally unless initialize opted in.
- Add raw App Server JSON-RPC fixtures under `fixtures/app-server/v2-jsonrpc/`
  with a manifest. The starter set is still not implemented:
  `thread-start-basic`, `turn-text-stream`, `approvals-command-file`,
  `tool-requests`, `patch-streaming`, `thread-resume-usage`,
  `thread-history-state`, `apps-list-updates`, and
  `account-login-rate-limit`.

## Phase 3: CSS Ownership

Done:

- Public React CSS no longer imports fixture gallery, closeup, host recipe, or
  usage-only route styles.
- Example route CSS lives under `examples/local-react-vite/src/styles`.
- CSS ownership tests guard distributed CSS against example/demo/fixture route
  pollution.

Remaining:

- Continue shrinking global selectors and page-level assumptions if future
  component styling needs finer host composition.

## Phase 4: Core Normalizer And State Correctness

Done:

- Upstream `threadName`, usage `turnId`, structured thread status,
  `deltaBase64`, raw event retention, and idempotent server-request resolution
  are covered by tests.
- Approvals remain pending until upstream `serverRequest/resolved`.

Remaining:

- Complete a raw-retention audit before deleting or bounding raw fields. Record
  which raw data is required by UI, debug views, docs, and host extension
  points.
- Add bounded retention policies for diagnostics, warnings, raw notifications,
  command output, file patches, and stale thread snapshots.
- Expand raw fixture-driven normalizer coverage once
  `fixtures/app-server/v2-jsonrpc/` exists.

## Phase 5: React Primitives And Browser UX

Done:

- Normal user/assistant messages stay expanded.
- Pending approvals render in transcript context, not a detached pane.
- Approval actions wait for upstream resolved state instead of optimistic local
  clearing.
- Composer remains bottom anchored and fixture/real-local browser gates cover
  desktop and mobile layout contracts.
- Work trace and Load all style regressions are covered by browser tests.

Remaining:

- Anchor approval placement immediately after source item/turn when upstream
  metadata is available; keep transcript-tail fallback only when source
  metadata is absent.
- Improve shared menu/popover/sheet focus and keyboard behavior.
- Convert execution mode controls to clearer radiogroup or tab semantics.

## Phase 6: Package API Freeze

Done:

- Public exports are the package export maps:
  `@nyosegawa/agent-ui-core`,
  `@nyosegawa/agent-ui-codex`,
  `@nyosegawa/agent-ui-codex/request-builders`,
  `@nyosegawa/agent-ui-codex/websocket`,
  `@nyosegawa/agent-ui-react`,
  `@nyosegawa/agent-ui-react/styles.css`,
  `@nyosegawa/agent-ui-server`, and
  `@nyosegawa/agent-ui-web-components`.
- Built declaration snapshots, package resolution, Node compatibility,
  `publint`, and `arethetypeswrong` guard this boundary.

Remaining:

- Decide whether `CodexStable` generated types remain stable public API or move
  behind an advanced/unstable surface before first public release.
- Classify exported React helpers as stable, advanced-public, or internal if
  the barrel grows further.

## Phase 7: Documentation And Release Closure

Done:

- README, docs index, package exports, server bridge, Codex protocol, testing,
  and relevant examples describe current behavior.
- Docs avoid historical validation logs and stale migration diary language.

Remaining:

- Keep example READMEs and docs synchronized with every future API or route
  change.
- Add release notes/changesets only when there is actual public API movement.

## Required Validation Ladder

Run this before claiming a broad refactor slice is complete:

```sh
bun run typecheck
bun run lint
bun run test
bun run test:protocol
bun run test:fixtures
bun run validate:packages
bun run check:dead-code
bun run test:api-snapshots
bun run test:package-resolution
bun run test:node-compat
bun run test:e2e:playwright
```

Run `bun run test:e2e:real-local-web-layout` against an explicitly started
`examples/codex-local-web` server on port 5175 whenever bridge, App
Server-backed behavior, routing, composer, approval placement, uploads, or real
local layout changes.
