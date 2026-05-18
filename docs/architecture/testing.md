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

`bun run validate:packages` is the ordered package path: build, `publint`, then
`arethetypeswrong`. Do not run those three in parallel because build cleans
package `dist/` directories.

## CI Coverage

The main CI workflow validates the normal development path:

- install with the repo-pinned Bun version
- `bun run typecheck`
- `bun run lint`
- `bun run test`
- `bun run test:protocol`
- `bun run test:fixtures`
- `bun run validate:packages`
- `bun run check:dead-code`
- `bun run test:api-snapshots`
- `bun run test:package-resolution`
- `bun run test:node-compat`

Package validation repeats build/package checks for publish confidence.
Compatibility CI covers Node 20, 22, and 24 import/require smoke plus the
package-resolution smoke. The API snapshot gate is driven by package export
maps: missing, changed, and stale public declaration snapshots fail unless
`bun run test:api-snapshots:update` is run intentionally after reviewing the
public API change. Bundler implementation chunks are not snapshots unless an
export map points to them. pnpm compatibility is a smoke target only; Bun
remains the package manager and lockfile owner.

## Protocol Tests

Protocol tests guard the generated App Server boundary:

- stable and experimental method list snapshots
- generated TypeScript importability
- capability metadata derived from generated request/notification/request files
- schema-backed params for productized methods
- stable vs experimental drift snapshots

Failures usually mean the vendored App Server schema or request builders must
be reviewed. Do not accept snapshot changes without reading the upstream App
Server diff.

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
- raw App Server JSON-RPC fixture lines from
  `fixtures/app-server/v2-jsonrpc/`, parsed and normalized before reduction
- bounded retention for diagnostics, warnings, raw notifications, command
  output, file patches, and thread registry snapshots. Thread snapshot tests
  must assert both the registry ID arrays and the backing `state.threads`
  entity map, including eviction of stale cold/preview snapshots and retention
  of active, live, and pending-request threads.

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
  transcript item or turn, with metadata-free approvals at the transcript tail
- approvals embedded in the transcript, not as a separate pane
- approval actions send responses but keep pending state until upstream
  `serverRequest/resolved`
- composer visibility, attachment chips, resolver errors, and disabled states
- shared menu/popover/sheet keyboard behavior, focus return, outside click,
  Escape close, and internal-scroll stability
- thread history search, infinite scroll sentinel, and fallback Load more
- usage/status/diagnostic primitives as optional host chrome
- style selector duplication guards
- public source structure guards

Accessibility smoke should cover the composer, approval queue, dialogs/sheets,
and thread sidebar whenever their interaction model changes.

Running composer tests must keep the UI-local follow-up queue distinct from App
Server pending input: Enter queues locally, `Send now` and Cmd/Ctrl+Enter call
`turn/steer`, Stop calls `turn/interrupt`, unsent queued items survive Stop,
thread switching never mixes queues, active-turn mismatches keep the item, and
Edit restores queued attachment chips.

## Fixture Browser Tests

`bun run test:e2e:playwright` starts its own fixture preview servers. Do not
manually start port 5174 for this command.

The fixture routes are:

- `/`: default transcript-first surface with approvals, command output, diff,
  composer, usage primitives, and thread history
- `/rich-transcript`: intentionally dense transcript and approval stress fixture
- `/?state=empty`: authenticated account with no stored threads
- `/?state=unauth`: first-run device-code login state
- `/?state=bridge-error`: connection diagnostics
- `/fixture-gallery`: component close-ups plus full-route previews
- `/host-workflow-recipe`: host-composed primitive recipe
- `/usage-only`: standalone usage composition examples
- `/scoped-thread-pane`: fixed-thread composition example
- `/app-connectors`: Codex Apps/connectors example

The browser gate checks desktop and mobile layout contracts, horizontal
overflow, composer reachability, approval hit testing, sidebar behavior, and
that old UI concepts such as Work trace and Load all do not return.
It also protects CSS ownership: fixture, route, close-up, and usage-only styles
live in `examples/local-react-vite`, not in the distributed React stylesheet.

Keep Playwright failures fast and diagnostic. If a browser test is flaky,
do not increase the test timeout as the first fix. Separate the problem into
server readiness, stale ports, selector drift, and the actual UI contract.
Use a short retry only around opening an app whose preview server may still be
warming up, then keep clicks and visible/enabled assertions on explicit low
timeouts so a broken composer, resume button, or transcript state fails in a
few seconds instead of waiting for the suite-level timeout.

## Real Local Web Gate

`bun run test:e2e:real-local-web-layout` audits an already-running
`examples/codex-local-web` instance. Start it explicitly on port 5175:

```sh
AGENT_UI_PORT=5175 \
AGENT_UI_HOST=127.0.0.1 \
AGENT_UI_CODEX_CWD=/Users/sakasegawa/src/github.com/nyosegawa/agent-ui \
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
  --project=chromium
```

Regenerate screenshots only when the visual contract intentionally changes.
