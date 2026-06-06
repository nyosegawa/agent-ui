# Testing

This page is the current validation matrix. Keep dated validation logs out of
the public docs; they belong in pull requests, release notes, or local session
records.

## Test Layers

1. protocol conformance
2. normalized reducer/state behavior
3. transport and bridge behavior
4. React components and transcript rendering
5. browser layout and real local bridge smoke
6. package export and runtime compatibility

## Local Release Gate

Run this before publishing, changing package boundaries, or changing App Server
protocol handling:

```sh
bun run validate:release
bun run validate:e2e
```

`bun run validate:packages` is the ordered package path: build,
`test:packlist`, `test:node-compat`, `publint`, then `attw`. Do not run package
build, `publint`, or `attw` in parallel because build cleans package `dist/`
directories.

Canonical validation tiers:

- `bun run validate:fast`: typecheck, lint, and the normal Vitest suite.
- `bun run validate:protocol`: Codex protocol coverage plus core fixture
  normalization coverage. The legacy `bun run test:fixtures` command delegates
  to `bun run test:core-fixtures`; both are the core reducer/state fixture gate,
  not browser fixture e2e and not raw JSON-RPC conformance.
- `bun run validate:packages`: fresh package build, npm packlist smoke, Node
  compatibility smoke, `publint`, and `arethetypeswrong` in the required order.
- `bun run validate:e2e`: clean Playwright ports, then deterministic browser
  e2e.
- `bun run validate:release`: fast, protocol, packages, dead-code,
  API-snapshot, and package-resolution gates. `validate:release` does not repeat
  `test:node-compat` after `validate:packages` because the package gate already
  includes Node compatibility smoke. The explicit non-tier child gates are
  `check:dead-code`, `test:api-snapshots`, and `test:package-resolution`.

Focused maintenance gates:

- `bun run test:hooks`: Codex repository hook policy fixtures. Run it whenever
  `.codex/hooks.json` or `scripts/codex-hooks/` changes.
- `bun run test:skills`: public Agent UI skill layout, frontmatter,
  progressive-disclosure references, API terminology, and public-boundary
  guards. Run it whenever `skills/agent-ui/` or
  `docs/maintenance/agent-ui-skills.md` changes.
- `bun run test:repo-skills`: repository-maintainer skill layout, frontmatter,
  reference links, role separation, and ownership-boundary guard. Run it
  whenever `.agents/skills/` or
  `docs/maintenance/repository-skills.md` changes.

Focused example gates:

- `bun run --cwd examples/recipes typecheck`: typed recipe source snippets.
  Run it whenever recipe source files or recipe docs change.
- `bun run --cwd examples/next-rpc-route typecheck` and
  `bun run --cwd examples/next-rpc-route build`: one-shot Route Handler
  example. Run them when the route, Next config, package metadata, or related
  docs change.
- `bun run --cwd examples/next-with-bridge-sidecar typecheck` and
  `bun run --cwd examples/next-with-bridge-sidecar build`: full-chat Next
  sidecar example. Run them when sidecar bridge policy, upload/media handling,
  or related docs change.
- `bun run --cwd examples/codex-local-web typecheck`, `bun run --cwd
  examples/codex-local-web build`, and the relevant
  `playwright.real-local.config.ts` spec: real local browser behavior. Run
  these when bridge policy, diagnostics, first-message, thread routing, or
  local media behavior changes.
- `bun run --cwd examples/local-react-vite typecheck`, `bun run --cwd
  examples/local-react-vite build`, and the relevant
  `playwright.fixtures.config.ts` spec: deterministic fixture and visual
  contract behavior. Run these when fixture routes, close-ups, density,
  resource resolution, scoped lists, or mobile layout changes.

Fixture e2e is the pull request browser gate; real-local e2e is a release and
local validation gate.

Use `bun run check:clean-build-output` before claiming a clean-state validation
when package, example, declaration, or TypeScript graph changes should be proven
without ignored `dist` or `.next` output already present.

## CI Coverage

The main CI workflow validates the normal PR and `main` integration path with
focused jobs:

- `Repository policy`
- `Typecheck`
- `Lint`
- `Unit tests`
- `Protocol and fixtures`
- `Package validation`
- `API snapshots`
- `Package resolution`
- `Playwright fixtures`

The `API snapshots` job performs a fresh package build before checking
declaration snapshots because the snapshot script reads `dist` declaration
output.

Path filters skip expensive jobs for surfaces that cannot be affected by the
changed files. Docs-only changes run the repository policy gate. Package README
and changelog changes are package-surface changes, not docs-only changes.

The manual `Package Validation` workflow repeats build/package checks for
publish confidence without duplicating every PR run. Compatibility CI covers
Node 22 and 24 import/require smoke plus pnpm workspace smoke when changes
are not docs-only. The API snapshot gate is driven by package export maps:
missing, changed, and stale public declaration snapshots fail unless
`bun run test:api-snapshots:update` is run intentionally after reviewing the
public API change. Bundler implementation chunks are not snapshots unless an
export map points to them. pnpm compatibility is a smoke target only; Bun remains
the package manager and lockfile owner.

`bun run test:package-resolution` performs a fresh package build before it
creates an isolated consumer project, so it cannot pass by resolving stale
local `dist` artifacts left by an older build.

Markdown snippet typecheck is deferred until snippets opt in with explicit
metadata. When that guard is added, start with the React guide examples because
they cover the most user-facing component wiring and are already backed by
workspace TypeScript dependencies.

The release workflow runs `bun run validate:release` and then
`bun run validate:e2e`, so the real-local fake App Server suite is release
evidence without blocking every pull request. On a reviewed release PR merge,
the trusted `main` push path publishes only unpublished package versions after
release validation. The publish job runs `bun run release:publish`, which
performs its own package build before Changesets publishes immutable npm
tarballs, then runs post-publish registry install smoke.

## Protocol Tests

Protocol tests guard the generated App Server boundary:

- stable and experimental method list snapshots
- generated TypeScript importability
- capability metadata derived from generated request/notification/request files
- schema-backed params for productized methods
- stable vs experimental drift snapshots
- compile-only protocol and request-builder assertions under
  `packages/codex/test/type-tests/`, owned by
  `packages/codex/tsconfig.type-tests.json` and included in the Codex package
  typecheck path

Failures usually mean the vendored App Server schema or request builders must
be reviewed. Do not accept snapshot changes without reading the upstream App
Server diff.

Raw App Server JSON-RPC fixture lines from
`fixtures/app-server/v2-jsonrpc/` are Codex adapter coverage under
`bun run test:protocol`: the Codex tests parse and normalize the lines before
reducing them through core state. Core fixture tests stay protocol-neutral and
consume normalized `AgentEvent` fixtures only. Use
`bun run test:core-fixtures` for the explicit core-owned runner name;
`bun run test:fixtures` remains as a compatibility alias.

## Reducer And Normalizer Tests

Reducer tests assert that normalized events keep Codex session data structured:

- thread and turn lifecycle
- agent message and reasoning deltas
- command output and file patch updates
- command/file/user-input/MCP/dynamic-tool approval requests
- token usage, account, skills, hooks, apps, diagnostics, and warnings
- upstream `threadName`, token usage `turnId`, decoded command output
  deltas, and idempotent `serverRequest/resolved` notifications
- stale/hydrated history state from `thread/read`
- pending server-request queue cleanup on resolve, reject, or disconnect
- bounded retention for diagnostics, warnings, raw notifications, command
  output, file patches, and thread registry snapshots. File patch tests must
  assert patch-only transcript indexes shrink with the retained patch bodies
  while authored item IDs remain visible. Thread snapshot tests must assert both
  the registry ID arrays and the backing `state.threads` entity map, including
  eviction of stale cold/preview snapshots and retention of active, live, and
  pending-request threads.

Important invariant: `item/completed` and `turn/completed` are authoritative.
Transient streaming state must not override completed App Server state.

## React Component Tests

Component tests cover:

- transcript-first chat rendering
- user and assistant Markdown always expanded
- command/tool/diff/file-change items in App Server item order
- command/tool context retained beside hydrated file changes
- heavy command output and diff bodies mounted only when opened
- no nested vertical scroll traps in normal Markdown/code blocks
- approvals with `itemId` or `turnId` source metadata anchored after that
  transcript item or turn, including sources pinned from outside the visible
  window, with metadata-free or missing-source approvals at the transcript tail
- approvals embedded in the transcript, not as a separate pane
- approval actions send responses but keep pending state until upstream
  `serverRequest/resolved`
- composer visibility, attachment chips, resolver errors, and disabled states
- shared menu/popover/sheet keyboard behavior, focus return, outside click,
  Escape close, and internal-scroll stability
- thread history search, infinite scroll sentinel, and fallback Load more
- usage/status/diagnostic primitives as optional host chrome
- style selector duplication guards
- design-system boundary guards for the single public stylesheet, private
  style chunks, internal `.aui-*` selectors, and token-based customization
- public source structure guards

Accessibility smoke should cover the composer, approval queue, dialogs/sheets,
and thread sidebar whenever their interaction model changes.

Running composer tests must keep the UI-local follow-up queue distinct from App
Server pending input: Enter queues locally, `Send now` and Cmd/Ctrl+Enter call
`turn/steer`, Stop calls `turn/interrupt`, unsent queued items survive Stop,
thread switching never mixes queues, active-turn mismatches keep the item, and
Edit restores queued attachment chips.

## Fixture Browser Tests

`bun run test:e2e:fixtures` starts its own fixture preview server on port 4173.
Do not manually start port 5174 for this command.
The fixture preview server builds `examples/local-react-vite` before previewing
it, so ignored `dist` output from a previous run cannot satisfy the browser
gate.

The fixture routes are:

- `/`: default transcript-first surface with approvals, command output, diff,
  composer, usage primitives, and thread history
- `/rich-transcript`: intentionally dense transcript and approval stress fixture
- `/?state=empty`: authenticated account with no stored threads
- `/?state=unauth`: first-run device-code login state
- `/?state=bridge-error`: connection diagnostics
- `/fixture-gallery`: component close-ups plus full-route previews
- `/host-workflow-recipe`: host integration reference shell with host header,
  embedded `AgentChat`, side panel, local attachment metadata, transcript
  local-media preview/fallback metadata, first-message optimistic mode, mobile
  drawer, and host-owned review sheet
- `/composer-retry`: failed first-message retry through the public composer
  controller
- `/resource-resolution`: structured local-media resource rendering without
  raw path exposure
- `/transcript-density`: compact transcript route with verbose command/file
  blocks and noncritical chat text filtered out
- `/scoped-thread-lists`: independent host-owned history list scopes
- `/usage-only`: standalone usage composition examples
- `/scoped-thread-pane`: fixed-thread composition example
- `/app-connectors`: Codex Apps/connectors example

The browser gate checks desktop and mobile layout contracts, horizontal
overflow, composer reachability, approval hit testing, sidebar behavior, and
that old UI concepts such as Work trace and Load all do not return.
It also protects CSS ownership: fixture, route, close-up, and usage-only styles
live in `examples/local-react-vite`, not in the distributed React stylesheet.
Those example styles should consume `--aui-*` tokens because they are visual QA
for the library. The recipes package may intentionally override tokens to show
host theming.

The deterministic fixture Playwright files are split by contract ownership:

- `smoke.e2e.ts` covers route availability, basic interaction, and blank-page
  regressions.
- `visual-layout.e2e.ts` owns shell layout contracts, viewport containment,
  menu reachability, and host layout examples. It checks presence, overflow,
  hit-testing, and viewport-relative dimensions instead of exact pixel snapshots.
  Host integration smoke checks also cover the mobile drawer plus host-owned
  sheet stacking contract.
- `visual-closeups.e2e.ts` owns the component close-up gallery and verifies that
  close-ups render real primitives instead of iframe or hand-written DOM
  substitutes.
- `composer-retry.e2e.ts` owns failed first-message retry through the public
  composer controller.
- `resource-resolution.e2e.ts` owns transcript local-media rendering through
  structured browser-safe metadata on desktop and mobile.
- `transcript-density.e2e.ts` owns density-mode behavior and overflow checks on
  desktop and mobile.
- `scoped-thread-lists.e2e.ts` owns independent scoped history list behavior.
- `visual-approvals.e2e.ts` owns approval layout, queue behavior, and hit-test
  reachability in transcript flow.
- `design-system-contract.e2e.ts` owns concrete token-backed UI contracts such
  as shared control heights, composer typography, icon button sizes, thread
  metadata alignment, and the absence of decorative left rails.
- `accessibility-contract.e2e.ts` owns ARIA snapshot coverage for the transcript,
  approvals, composer, and menu surfaces that must remain discoverable.
- `capture-docs-screenshots.e2e.ts` is opt-in and only refreshes docs images
  when `CAPTURE_DOCS_SCREENSHOTS=1`.

Do not split e2e files mechanically by line count. A new file should correspond
to a durable product contract with its own failure story. Shared helpers belong
under `examples/local-react-vite/e2e/support/` and should be thin page-contract
helpers, not hidden test flows.

Keep Playwright failures fast and diagnostic. If a browser test is flaky,
do not increase the test timeout as the first fix. Separate the problem into
server readiness, stale ports, selector drift, and the actual UI contract.
Use a short retry only around opening an app whose preview server may still be
warming up, then keep clicks and visible/enabled assertions on explicit low
timeouts so a broken composer, stored-thread resume flow, or transcript state fails in a
few seconds instead of waiting for the suite-level timeout.

## Real Local Web Gate

`bun run test:e2e:real-local` starts `examples/codex-local-web` on port 4174
with the deterministic fake Codex App Server and runs only the
`examples/codex-local-web/e2e` specs. `bun run validate:e2e` runs the fixture
suite first and then this real-local suite.

The real-local specs are split by App Server integration contract:

- `real-local-thread-lifecycle.e2e.ts` owns stored-thread hydration, direct
  thread URLs, browser back/forward, first-message immediate reflection, and
  diagnostics rail presence.
- `real-local-attachments.e2e.ts` owns image paste, arbitrary file attachment
  payloads, same-origin transcript local-media URLs, missing-media fallback,
  and queued attachment restoration.
- `real-local-follow-ups.e2e.ts` owns running-turn follow-up queue behavior,
  `turn/steer`, `turn/interrupt`, and queued-item compaction.

`bun run test:e2e:real-local-web-layout` audits an already-running
`examples/codex-local-web` instance. Start it explicitly on port 5175:

```sh
AGENT_UI_PORT=5175 \
AGENT_UI_HOST=127.0.0.1 \
AGENT_UI_CODEX_CWD="$PWD" \
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev

bun run test:e2e:real-local-web-layout
```

This gate inspects the real local web page, including the thread surface,
sidebar, composer, run settings menu/sheet, approval placement when present,
document-level overflow, and fixed composer placement. It does not start or
stop the server. Browser smoke coverage also exercises stored-thread resume,
`/threads/<threadId>` URL restoration, browser back/forward, image thumbnails,
and arbitrary file upload chips. Non-image uploads are expected to reach Codex
as explicit `Attached file: /absolute/path` text, not as a generic App Server
file input.

The deterministic `examples/codex-local-web/e2e` Playwright files are split by
App Server integration contract:

- `real-local-thread-lifecycle.e2e.ts` covers stored-thread hydration and
  auto-resume, thread creation, URL routing, browser history, and stale-thread
  cleanup on popstate.
- `real-local-attachments.e2e.ts` covers paste/upload handling, image chips,
  arbitrary file chips, attachment restoration, and App Server payload text for
  non-image files.
- `real-local-follow-ups.e2e.ts` covers running-turn composer semantics,
  UI-local queued follow-ups, `turn/steer`, `turn/interrupt`, queue compaction,
  anchored composer layout, and scroll-follow behavior.
- `support/real-local-page.ts` contains the shared page helper layer and is the
  only place for app-open readiness retries. Interaction assertions in tests
  should remain explicit and low-timeout.

## Real Codex Smoke

Use these when local Codex auth is available and a real App Server turn is
acceptable:

```sh
bun run test:e2e:real-codex
bun run test:e2e:real-codex:approval
```

These scripts spawn `codex app-server --listen stdio://`, initialize the
protocol, read account/model/thread state, start a turn, and verify approval
request handling. They are intentionally environment-dependent and are not a
substitute for deterministic unit/protocol tests.

## Screenshots

Documentation screenshots are opt-in:

```sh
CAPTURE_DOCS_SCREENSHOTS=1 bunx playwright test \
  examples/local-react-vite/e2e/capture-docs-screenshots.e2e.ts \
  --config playwright.fixtures.config.ts
```

This is direct Playwright capture with the fixture config, not a normal CI gate.
Regenerate screenshots only when the visual contract intentionally changes. Do
not regenerate screenshots for documentation-only wording changes.
