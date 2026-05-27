# Agent UI Refactor Plan

## Goal

Refactor Agent UI into an ideal Codex App Server UI component library with no
backward-compatibility constraint.

The target product is:

- Codex App Server protocol -> typed adapter -> normalized thread/turn/item
  state -> composable React UI.
- A reusable library surface, not a host runtime.
- Stable App Server API first, with experimental protocol surfaces behind
  explicit opt-in.
- Transcript-first UX where user messages, assistant messages, tool calls,
  command output, file changes, approvals, usage, diagnostics, and the composer
  belong in composable conversation surfaces.
- Examples that prove the library is usable and visually intact after the
  library is corrected, not examples that preserve old API shapes.

## Non-Goals

- Preserving old public exports, old route names, old selectors, old examples,
  or compatibility shims.
- Building a watcher, skill-with-app registry, workflow orchestrator,
  persistence policy, sidecar lifecycle manager, or host runtime into the core
  library.
- Treating `app/list` as a skill registry. It is a Codex Apps/connectors
  surface.
- Hiding awkward API, package, test, or visual decisions behind adapters instead
  of deleting and replacing them.

## Audit Inputs

This plan is based on local repo inspection, upstream App Server inspection, and
parallel subagent review of package boundaries, protocol alignment, examples,
e2e, CI, and validation.

Important current risk areas:

- `.github/workflows/ci.yml` and `.github/workflows/release.yml` run `bun test`,
  which does not equal the repository's intended `bun run test` gate.
- `playwright.config.ts` can validate stale ignored `dist` output because it
  previews without a guaranteed fresh build.
- `bun run test:protocol` skips at least one Codex protocol test file outside
  the current package test glob.
- `examples/local-react-vite/src/styles/usage-only.css` references an undefined
  design token.
- `examples/local-react-vite/e2e/capture-docs-screenshots.e2e.ts` assumes
  routes render the same `AgentChat` test id even when they do not.
- `packages/react/src/codex-request-params.ts` and `packages/react/src/index.ts`
  expose Codex request builders from React.
- `packages/core/test/raw-jsonrpc-fixtures.test.ts` imports Codex from core
  tests, blurring the protocol-neutral core boundary.
- Large mixed-responsibility files hide product boundaries:
  - `packages/react/src/hooks.ts`
  - `packages/react/src/timeline.tsx`
  - `packages/core/src/reducer.ts`
  - `packages/core/src/state.ts`
  - `packages/core/src/events.ts`
  - `packages/codex/src/normalizer.ts`
  - `packages/server/src/websocket.ts`
  - `packages/react/test/components.vitest.tsx`
  - `packages/server/test/websocket.test.ts`
  - `examples/local-react-vite/src/main.tsx`
  - `examples/local-react-vite/src/closeups/ComponentCloseupGallery.tsx`
- `docs/screenshots` are tracked but not clearly tied to live docs as current
  product evidence.
- README-only example folders sit beside runnable examples and obscure which
  surfaces are executable.
- `examples/docs-site` is under-integrated relative to README and docs entry
  points.
- Root TypeScript and package validation scripts are not yet a single, reliable
  package-surface contract.

## Upstream App Server Facts

Source of truth:
`/Users/sakasegawa/src/github.com/openai/codex/codex-rs/app-server`.

Protocol facts that must shape the refactor:

- The primary UI model is Thread, Turn, and Item.
- The wire protocol is JSON-RPC-like but does not include a `"jsonrpc": "2.0"`
  field.
- The client must initialize before normal requests; experimental capability
  opt-in and notification opt-out are connection-level behavior.
- `thread/start` creates and subscribes to a thread.
- `thread/resume` reopens an existing thread for future turns.
- `thread/read` reads stored history without resuming.
- `Thread.turns` is often empty except for resume/read/fork/rollback flows;
  merging an empty turn list must not delete existing turn/item history unless
  the event is an explicit full snapshot.
- `turn/start` creates a turn and streams `turn/started`, `item/started`,
  deltas, `item/completed`, and `turn/completed`.
- `turn/steer` applies only to an active regular turn and requires an expected
  turn id. It is not an idle send shortcut.
- `turn/interrupt` interrupts an active turn and can resolve pending work.
- Approvals are JSON-RPC server requests. The UI should render them inline near
  transcript context, but the backing state should remain request-centric until
  `serverRequest/resolved`.
- Attachments/user content variants include protocol inputs such as text,
  images, local images, skills, and mentions. Arbitrary browser `File` objects
  must be persisted/resolved by the host before the App Server consumes them.
- `thread/turns/list` is experimental pagination with `itemsView`.
- `thread/turns/items/list` shape exists but is currently unsupported upstream;
  do not build core retention or paging around it.
- `app/list` is Apps/connectors metadata. Treat stable versus experimental
  status carefully because generated stable files and upstream comments are not
  perfectly aligned.

## Target Package Architecture

### `@nyosegawa/agent-ui-core`

Core owns normalized App Server-shaped domain state and reducer composition.

It should contain:

- `connectionStore`
- `threadIndexStore`
- `threadEntityStore`
- `turnStore`
- `itemStore`
- `serverRequestStore`
- `appsStore`
- `diagnosticsStore`
- `usageStore`
- selectors
- retention policies
- transport interfaces

It should not contain:

- React
- Node-only code
- generated Codex types
- Codex request builders
- OpenAI Agents SDK adapters
- host runtime behavior

### `@nyosegawa/agent-ui-codex`

Codex owns the App Server adapter.

It should contain:

- generated stable and experimental schema
- protocol metadata and capability classification
- request builders
- JSON-RPC framing
- initialize/initialized lifecycle
- request/response/server-request routing
- backpressure behavior
- stdio and browser bridge transports
- typed clients grouped by protocol primitive:
  - connection
  - threads
  - turns
  - approvals/server requests
  - apps
  - skills
  - hooks
  - models
  - account
- normalizers split by notification/request family:
  - thread events
  - turn events
  - item events
  - server requests
  - apps events
  - diagnostics

Generated schema must be treated as a pinned artifact with upstream commit
metadata and generator command. Do not hand-model Codex method params outside
this package.

### `@nyosegawa/agent-ui-react`

React owns providers, headless hooks, primitives, and default composed UI.

It should contain:

- `AgentProvider`
- domain hooks such as:
  - `useAgentThread`
  - `useAgentTurn`
  - `useAgentComposer`
  - `useAgentApprovals`
  - `useAgentAccount`
  - `useAgentModels`
  - `useAgentApps`
  - `useAgentDiagnostics`
  - `useAgentUsage`
- selectors/controllers over explicit core stores
- transcript primitives
- item renderers
- approval anchoring
- composer controls
- usage/status components
- i18n
- `@nyosegawa/agent-ui-react/styles.css` as the only public stylesheet import

It should not export Codex generated types or request builders. React may consume
a host-provided Codex session/controller, but the Codex protocol boundary must
stay in the Codex package.

### `@nyosegawa/agent-ui-server`

Server owns Node-only integration helpers.

It should contain:

- local bridge
- upload helpers
- Next/Express helpers
- redaction
- host events
- dynamic tools policy
- backpressure and websocket behavior

It should not have browser exports.

### `@nyosegawa/agent-ui-web-components`

Web components should be a thin wrapper over React primitives only. They should
not own separate state, protocol, or visual behavior.

## Target Public API

- React root exports providers, hooks, components, i18n, transcript/diff
  primitives, and usage formatting only.
- React does not export `threadStartParams`, `turnStartParams`, `textInput`, or
  Codex param types.
- Core root exports normalized domain, selectors, retention, and transport
  primitives only.
- Codex root exports protocol/session/transport facade. Advanced generated types
  live on intentional subpaths.
- Server root exports host-side helpers only.
- API snapshots become a contract gate for the new ideal API, not a
  compatibility-preservation mechanism.

## Refactor Phases

### Phase 0: Make Validation Trustworthy

Correct validation before relying on it for the refactor.

- Change CI and release workflows from `bun test` to the intended validation
  scripts.
- Make `test:protocol` include all Codex protocol tests.
- Ensure Playwright cannot pass against stale build output.
- Fix the undefined example CSS token.
- Fix screenshot capture readiness so each route has an accurate readiness
  contract.
- Make package/public-surface scripts export-map driven instead of hard-coded.
- Ensure root TypeScript references include every package that is part of the
  monorepo contract.

### Phase 1: Cut Package Boundaries

Delete obsolete public shapes instead of preserving them.

- Remove React's Codex request-builder exports.
- Remove protocol-specific test imports from core tests.
- Remove generic/non-App-Server adapters from core public API.
- Tighten package export maps.
- Move every request-builder responsibility to Codex.
- Update docs and examples to describe the new boundary, not a migration path.

### Phase 2: Split Core State

Replace the single broad session reducer with explicit stores and selectors.

- Model thread index separately from thread entities.
- Model turns separately from items.
- Model server requests separately from transcript items while allowing React to
  anchor approvals in the transcript.
- Preserve stored history merge semantics: "not included" is not "delete".
- Add bounded-retention tests for both ordered indexes and backing entity maps.
- Keep event and reducer files grouped by product contract.

### Phase 3: Split Codex Adapter

Make Codex the only place that understands generated App Server schema.

- Regenerate or verify generated schema against the target upstream checkout.
- Record upstream commit and generator command.
- Split the normalizer by protocol family.
- Enforce stable/productized/host-only/experimental capability classification at
  client construction and public exports.
- Keep unsupported experimental methods represented but not productized.
- Add tests for initialization, notification opt-out, server-request lifecycle,
  thread/turn/item streaming, and app/list pagination/refresh.

### Phase 4: Rebuild React Controllers And Hooks

Move React from broad session hooks to domain hooks and controllers.

- Split `hooks.ts` by domain.
- Keep provider responsibilities narrow: state, transport, controller injection.
- Implement composer semantics as a controller:
  - idle submit -> `turn/start`
  - running follow-up queue or send-now -> validated `turn/steer`
  - Stop -> `turn/interrupt`
- Preserve routing semantics:
  - `/` is no-thread start state
  - direct `/threads/<id>` opens that thread
  - stored history is readable without implying resume
- Keep usage/status inspectable near the composer/conversation context without
  replacing transcript content.

### Phase 5: Split Transcript UI

Keep the transcript-first default while making the implementation maintainable.

- Split timeline/windowing/scrolling/approval anchoring/item rendering.
- Keep normal user and assistant messages readable inline.
- Use disclosure for heavy command output, diffs, tool bodies, and diagnostics.
- Keep approvals reachable and hit-testable on desktop and mobile.
- Avoid nested scroll traps in markdown, code blocks, command output, and diffs.
- Add tests around item lifecycle, stored history, command/file/tool blocks,
  approval placement, and mobile hit targets.

### Phase 6: Rebuild Design System Guarantees

Keep `packages/react/src/styles/tokens.css` as the visual source of truth.

- Audit all distributed CSS, example CSS, docs-site CSS, and inline style
  objects for token compliance.
- Keep `@nyosegawa/agent-ui-react/styles.css` as the only public stylesheet.
- Expand style guard tests when rules intentionally change.
- Do not add one-off tokens for local layout measurements.
- Update theming and component docs when visual contracts change.

### Phase 7: Rebuild Examples After The Library

Examples should be rebuilt only after the public library shape is corrected.

`examples/local-react-vite` should become the deterministic visual QA app. Keep
routes only when they validate durable primitives or compositions:

- `/`: transcript-first default shell
- `/rich-transcript`: dense transcript stress state
- `/fixture-gallery`: component closeups and route previews
- `/usage-only`: usage/status without chat assumptions
- `/scoped-thread-pane`: scoped thread composition
- `/app-connectors`: `app/list` connector surface
- `/host-workflow-recipe`: only if it demonstrates generic host composition, not
  workflow orchestration

`examples/codex-local-web` should focus on real App Server integration:

- same-origin WebSocket bridge
- real/fake Codex App Server lifecycle
- thread URL routing
- upload persistence
- running-turn follow-up semantics
- approvals
- usage restoration

Next examples and recipes should be updated or rebuilt after server/package
exports settle. README-only route handoffs should become real docs recipes or be
deleted.

### Phase 8: Re-own E2E And Browser Verification

Split e2e by durable contract, not by old routes or file size.

Fixture e2e should cover:

- smoke and blank-page checks
- shell layout and viewport containment
- composer/sidebar/menu reachability
- primitive closeups
- transcript-anchored approvals
- design-system invariants
- opt-in screenshot capture

Real local e2e should cover:

- App Server lifecycle
- routing
- attachments
- follow-ups and interruption
- scrolling
- real layout audit against `examples/codex-local-web`

Use Playwright as deterministic CI. Use agent-browser or browser verification as
manual local evidence for visual/layout changes. At minimum verify:

- fixture gallery desktop
- rich transcript desktop
- usage-only mobile
- real local web desktop

### Phase 9: Refresh Docs And Screenshots

Docs must describe current product state, not migration history.

Update:

- `README.md`
- `docs/README.md`
- `docs/getting-started.md`
- `docs/architecture/overview.md`
- `docs/architecture/product-boundary.md`
- `docs/architecture/testing.md`
- `docs/architecture/toolchain.md`
- `docs/guides/browser-verification.md`
- `docs/guides/theming.md`
- `docs/reference/codex-protocol.md`
- `docs/reference/package-exports.md`
- `docs/reference/react-components.md`
- `docs/examples/*`

Regenerate `docs/screenshots/*` only after the visual contract intentionally
changes. Remove screenshots for deleted routes.

## Validation Ladder

Use targeted validation while iterating, then the full ladder before claiming
completion.

Baseline and package gates:

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
```

E2E and browser-visible gates:

```sh
bun run test:e2e:clean-ports
bun run test:e2e:playwright
```

Real local App Server layout gate:

```sh
AGENT_UI_PORT=5175 \
AGENT_UI_HOST=127.0.0.1 \
AGENT_UI_CODEX_CWD=/Users/sakasegawa/src/github.com/nyosegawa/agent-ui \
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev

bun run test:e2e:real-local-web-layout
```

Clean-state TypeScript gate after package boundary, declaration, build-output,
or example import changes:

```sh
find packages examples -name dist -type d -prune -exec rm -rf {} +
find examples -name .next -type d -prune -exec rm -rf {} +
bun run typecheck
```

Agent-browser/manual evidence should be recorded in PR notes, not committed as
dated validation logs in product docs.

## Completion Definition

The refactor is complete only when all of the following are true:

- The library's package boundaries match the target architecture.
- The public API is intentional, documented, snapshotted, and free of obsolete
  compatibility exports.
- Core state is protocol-shaped and retention-bounded across indexes and backing
  entity stores.
- Codex schema and capability metadata are generated/pinned/tested against the
  chosen upstream App Server checkout.
- React surfaces are composable primitives and default composed UI, not a host
  runtime.
- Transcript-first UX remains visually intact on desktop and mobile.
- Examples are rebuilt against the final public API and have clear purposes.
- E2E tests fail by durable product contract, not by legacy file boundaries.
- Playwright and agent-browser/manual checks show no blank pages, horizontal
  overflow, unreachable composer controls, unreachable approvals, or broken
  mobile layout.
- Docs and screenshots match the final product state.
- Local full validation passes.
- GitHub CI/package/compatibility/release workflows reach concrete success after
  push.
- `git status --short` is clean after generated docs/screenshots/snapshots are
  committed.
