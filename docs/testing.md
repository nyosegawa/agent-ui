# Testing

## Test Layers

```text
1. protocol conformance
2. normalizer/reducer
3. transport
4. React components
5. integration/e2e
```

## Protocol Conformance

Purpose:

- detect Codex App Server schema drift
- detect stable/experimental API changes
- protect generated type imports
- snapshot method lists

Tests:

- `ClientRequest` method list snapshot
- `ServerNotification` method list snapshot
- `ServerRequest` method list snapshot
- generated TypeScript importability
- stable vs experimental schema diff snapshot
- required fields and discriminated union parsing

These tests are allowed to fail when upstream Codex changes. Failure means the adapter must be updated.

Schema-backed request tests cover the critical App Server params used by the real app path:

- `account/read { refreshToken: false }`
- `account/login/start { type: "chatgptDeviceCode" }`
- `account/login/cancel { loginId }`
- `account/logout` without params
- `account/rateLimits/read` without params
- `model/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- thread actions: fork, archive, unarchive, name, metadata, compact, rollback,
  inject items, loaded list, unsubscribe
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `skills/list`
- `skills/config/write`
- `hooks/list`
- `app/list`

## Normalizer and Reducer

Most important test layer.

Cases:

- `thread/started`
- `thread/status/changed`
- `turn/started`
- `item/agentMessage/delta`
- `item/reasoning/summaryTextDelta`
- `item/completed`
- `turn/completed`
- `thread/tokenUsage/updated`
- command output delta
- file patch update
- approval request/resolved
- unsupported App Server notifications become neutral warnings without storing raw payloads
- failed turn
- interrupted turn
- out-of-order safe handling

Method:

- stream JSONL fixtures
- snapshot normalized events
- snapshot final state
- assert invariants

Important invariants:

- `item/completed` overwrites transient deltas with authoritative state.
- `turn/completed` clears active turn state.
- pending server requests are cleared by response, rejection, resolution, or disconnect.
- lossless events reach the reducer before rendering.

## Transport

Cases:

- stdio JSONL read/write
- request id correlation
- notification dispatch
- server request to client response
- malformed JSON
- child process exit
- stderr logging
- stderr redaction before browser/UI forwarding
- timeout
- overload error `-32001`
- `-32001` retry only for idempotent reads and no retry for mutating methods
- websocket auth header
- websocket close/reconnect policy and pending request rejection

Most transport tests use fake child process and fake websocket implementations.

## React Components

Component tests:

- render current thread
- render user and assistant Markdown safely, including headings, lists, links, code blocks, tables, and escaped raw HTML
- stream message deltas
- submit prompt
- disable composer while blocked
- show pending approval
- approve/reject server requests
- render command output
- keep command output and file-change diffs inline with the surrounding transcript items rather than detached panels
- keep very large persisted command-output histories scroll-contained without reclassifying them into UI-owned activity groups
- keep user and assistant messages expanded in restored history instead of hiding normal chat text behind a disclosure
- keep command/tool execution context visible when a hydrated stored turn ends with file changes, even if the raw item-count window would otherwise show only the diff
- render structured App Server message content arrays as readable text
- show completed message status after real thread completion and hydrated history reads
- normalize stale `inProgress` item labels to completed in loaded hydrated history
- keep narrow-width persisted history vertical and scroll-contained
- keep the composer visible while the message list and sidebar own independent scroll containers
- keep narrow-width run settings collapsed into an expandable summary so the message timeline remains usable
- keep narrow-width usage collapsed into an expandable summary so the chat history remains the primary scroll surface
- collapse and expand the history sidebar through accessible controls
- preserve working directory from `cwd` in `thread/list`, `thread/read`, `thread/resume`, and `thread/start` responses while hiding internal `.codex/sessions/*.jsonl` paths
- show compact cwd context in stored-history rows and follow paginated `thread/list` cursors through infinite scroll plus the fallback Load more action
- keep history loading/count/pagination feedback outside the thread-list scroll container so real large histories do not rely on implicit grid rows
- keep App Server plugin manifest warnings in diagnostics instead of the primary chat flow
- suppress known low-value Codex plugin `interface.defaultPrompt` warnings from visible diagnostics
- suppress known low-value Codex skill icon path warnings from visible diagnostics and the real local web dev terminal
- render file diff
- switch thread
- show auth/device-code state

Accessibility tests required for release:

- `AgentComposerPanel`
- `AgentApprovalQueue`
- dialog/modal approval variants
- `ThreadList` / `AgentThreadSidebar`

Streaming log and diff viewer start with snapshot and keyboard smoke tests.

The fixture Vite example also exposes a dedicated `/qa` index for deterministic
visual states used in manual and automated QA:

- `/?state=empty`: authenticated account, usage/model data, no stored threads
- `/?state=unauth`: first-run device-code login state
- `/?state=bridge-error`: connection diagnostics without a running bridge
- `/?state=kitchen`: kitchen-derived renderer, banner, token-usage, and rich
  approval-card coverage
- `/`: approval, command output, diff, usage, run controls, and stored history
- `/qa`: visual QA index linking to every fixture-backed state

These states are fixture-backed and are not release proof for real Codex
behavior, but they make UI regressions reproducible before checking the real
local bridge.

## Integration and E2E

Required for release confidence:

- real `codex app-server --listen stdio://`
- `initialize -> initialized`
- `account/read`
- `model/list`
- `thread/start`
- React example Playwright smoke
- React example visual layout contract snapshots

Optional/nightly:

- real authenticated turn
- Node.js LTS compatibility smoke
- pnpm compatibility smoke
- websocket remote demo

## CI Commands

Required PR gate:

```text
bun run typecheck
bun run lint
bun test
bun run build
bun run test:protocol
bun run test:fixtures
bun run publint
bun run attw
```

Optional/nightly:

```text
bun run test:e2e:real-codex
bun run test:e2e:real-codex:approval
bun run test:e2e:playwright
bun run test:node-compat
bun run test:pnpm-compat
```

## Current Validation

Current release validation commands:

```text
bun run typecheck
bun run lint
bun test
bun run test
bun run build
bun run test:protocol
bun run test:fixtures
bun run publint
bun run attw
bun run test:e2e:playwright
```

Real Codex smoke has been verified locally through the server bridge for initialize, account/model reads, thread start, turn start, streaming text, token usage, turn completion, and `thread/resume` after a completed turn is persisted.

The current UI validation also checks the product shell behavior that fixture
tests previously missed: document-level horizontal overflow is forbidden, the
local web app keeps document scrolling disabled, the thread list and message
timeline are independent scroll surfaces, the composer remains in the viewport,
and the history sidebar can collapse and expand.

Latest manual real smoke:

- Date: 2026-05-10
- Codex CLI: `codex-cli 0.128.0`
- Command surface: `codex app-server --listen stdio://`
- Environment dependency: local ChatGPT/Codex auth was already present; no raw token or device-code secret was logged.
- Direct stdio smoke command: a Node script spawned `codex app-server --listen stdio://`, connected through `createCodexStdioTransport()`, sent `initialize`, then requested `account/read`, `model/list`, `account/rateLimits/read`, `thread/list`, `thread/read`, `thread/resume`, `thread/start`, and `turn/start`.
- Direct stdio result: authenticated account with redacted email, 6 models, first model `gpt-5.5`, usage present, 5 stored threads returned, `thread/read` and `thread/resume` succeeded, an ephemeral thread started, `item/agentMessage/delta` streamed `Agent UI real smoke ok.`, and `turn/completed` was observed.
- Real approval smoke command: `AGENT_UI_REAL_CODEX_TIMEOUT_MS=180000 node scripts/real-codex-smoke.mjs --approval`, with variants `--accept`, `--file-only`, and `--accept-for-session`.
- Real approval smoke result: using `approvalPolicy: "untrusted"`, `sandbox: "read-only"`, `sandboxPolicy: { type: "readOnly", networkAccess: false }`, and `approvalsReviewer: "user"` in a temporary cwd, the App Server emitted command approval and file-change approval requests. Command approval accepted and declined successfully. File-change approval accepted, declined, and accepted-for-session successfully. The temporary workspace was removed after each run.
- Post-hardening re-run on 2026-05-09: `bun run test:e2e:real-codex` returned authenticated account, 6 models, usage, 5 stored threads, assistant text `Agent UI real smoke ok.`, and 1 completed turn. `bun run test:e2e:real-codex:approval` observed a command approval request and declined it. `AGENT_UI_REAL_CODEX_TIMEOUT_MS=180000 node scripts/real-codex-smoke.mjs --approval --file-only` observed a file-change approval request and declined it.
- Final product-audit re-run on 2026-05-09: `bun run test:e2e:real-codex` again returned authenticated account, 6 models, usage, 5 stored threads, assistant text `Agent UI real smoke ok.`, and 1 completed turn. `AGENT_UI_REAL_CODEX_TIMEOUT_MS=180000 bun run test:e2e:real-codex:approval` observed a command approval request and declined it. `AGENT_UI_REAL_CODEX_TIMEOUT_MS=180000 node scripts/real-codex-smoke.mjs --approval --file-only` observed a file-change approval request and declined it.
- Post-history-UX re-run on 2026-05-10: `bun run test:e2e:real-codex` returned authenticated account, 6 models, usage, 5 stored threads, assistant text `Agent UI real smoke ok.`, and 1 completed turn. `AGENT_UI_REAL_CODEX_TIMEOUT_MS=180000 bun run test:e2e:real-codex:approval` observed a command approval request and declined it. `AGENT_UI_REAL_CODEX_TIMEOUT_MS=180000 node scripts/real-codex-smoke.mjs --approval --file-only` observed a file-change approval request and declined it.
- vNext Milestone 1 re-run on 2026-05-14: the first `bun run test:e2e:real-codex`
  attempt timed out during `initialize` after the previous fixed 10 second
  limit. The smoke script now supports
  `AGENT_UI_REAL_CODEX_INIT_TIMEOUT_MS`, and
  `AGENT_UI_REAL_CODEX_INIT_TIMEOUT_MS=30000 bun run test:e2e:real-codex`
  returned authenticated account, 6 models, usage, 5 stored threads, assistant
  text `Agent UI real smoke ok.`, and 1 completed turn.
  `AGENT_UI_REAL_CODEX_INIT_TIMEOUT_MS=30000 bun run test:e2e:real-codex:approval`
  observed a command approval request and declined it.
- vNext Milestone 3 re-run on 2026-05-14:
  `AGENT_UI_REAL_CODEX_INIT_TIMEOUT_MS=30000 bun run test:e2e:real-codex`
  returned authenticated account, usage, 5 stored threads, 6 models, assistant
  text `Agent UI real smoke ok.`, and 1 completed turn.
  `AGENT_UI_REAL_CODEX_INIT_TIMEOUT_MS=30000 bun run test:e2e:real-codex:approval`
  observed a command approval request and declined it.
- Browser smoke command: `bun run test:e2e:playwright`.
- Browser smoke result: 9 Playwright tests passed after the vNext React
  primitive API pass. The real local app target used a fake stdio App Server
  while exercising the actual browser WebSocket transport and same-origin
  bridge path.
- Playwright starts fresh local preview/dev servers for the fixture and real-local browser targets instead of reusing an existing `4173` or `4174` process. This avoids stale bridge/session state from hiding real regressions or creating local-only hangs after a failed run. If a local manual dev server is left behind, kill the orphan `examples/codex-local-web` process before re-running the smoke.
- Do not run `bun run build` concurrently with `bun run test:e2e:playwright`. The browser smoke previews built `dist` output; a simultaneous workspace build can clean or replace that output while Playwright is waiting on the first page. The full sweep should run build first, then Playwright.
- `examples/codex-local-web` disables Vite HMR in its custom middleware server. The production-like local bridge path needs a stable same-origin WebSocket endpoint for `/agent-ui/ws`; a separate dev HMR websocket is not part of the product path and can make browser automation noisy.
- Real local UI screen check after transcript and history hardening: in the in-app browser at `http://127.0.0.1:5174/`, an authenticated real session loaded account, usage, and stored threads; the latest stored session auto-previewed in the main pane; narrow-width layout showed the chat pane before the thread history; command/file-change items stayed inline with the transcript instead of a detached terminal shelf.

The history and usage smoke path has also been verified against `codex app-server --listen stdio://`:

- `model/list`: 6 visible models in this environment, first entry `gpt-5.5`
- `account/rateLimits/read`: 5-hour and weekly windows
- `thread/list`: stored sessions returned
- `thread/read(includeTurns: true)`: individual stored session history returned
- `thread/resume(excludeTurns: true)`: resume succeeds for the same stored id
- `examples/codex-local-web`: browser -> WebSocket bridge -> stdio App Server path loads model metadata, usage windows, stored thread list, `thread/read`, and `thread/resume` in this environment.
- `examples/codex-local-web` manual browser check on 2026-05-09: in the in-app browser at `http://127.0.0.1:5174/`, a real authenticated session loaded account, model, usage, and stored thread history; a new thread sent `Reply with exactly: agent-ui-ui-check-3`; the real App Server streamed the assistant response; reloading and reading that persisted thread showed user and assistant messages as completed with product-facing `Stored` and `Preview` history labels instead of raw protocol statuses.
- `examples/codex-local-web` real payload and layout audit on 2026-05-10: `thread/list` and `thread/read` returned internal JSONL session `path` plus real project `cwd`; Agent UI now normalizes `cwd` as the user-facing working directory and keeps the internal session path out of subtitles and cwd suggestions. Narrow browser inspection found that always-expanded usage and run controls could crush the message timeline, so mobile/narrow layouts now show compact expandable summaries. The grid rows for status, diagnostics, usage, thread header, timeline, approvals, and composer are explicitly assigned so optional diagnostics or approvals cannot shift the composer into the timeline row.
- `examples/codex-local-web` real browser turn check on 2026-05-10 after preview/readiness hardening: a headless browser opened `http://127.0.0.1:5174/`, started a new real thread, observed the thread as `Ready`, sent `Reply with exactly: agent-ui-browser-final-check-6`, observed the assistant message `agent-ui-browser-final-check-6`, saw the thread leave `Running` as `Complete`, and verified no horizontal overflow with the composer still visible and enabled.
- `examples/codex-local-web` real browser continuation check on 2026-05-10: a headless browser opened `http://127.0.0.1:5174/`, started a new real thread, sent `Reply with exactly: agent-ui-second-turn-one`, waited for completion, then sent `Reply with exactly: agent-ui-second-turn-two` in the same thread. The app showed the second assistant message, left `Running` as `Complete`, kept the composer enabled, and kept horizontal overflow at 0.
- `examples/codex-local-web` real history exhaustion check on 2026-05-10: a headless browser opened `http://127.0.0.1:5174/`, followed real `thread/list` cursors from 25 visible rows to 684 rows, reached `684 threads loaded · all loaded`, removed the fallback pagination control, and kept the narrow layout free of horizontal overflow.
- `examples/local-react-vite` agent-browser check on 2026-05-14: after
  reading `agent-browser skills get core`, a dev server ran at
  `http://127.0.0.1:5174/`; `agent-browser open`, `agent-browser snapshot -i`,
  and `agent-browser screenshot /tmp/agent-ui-m3-browser-check.png` confirmed
  the fixture shell exposed history, usage, pending approvals, run settings,
  and the disabled approval-gated composer through accessible browser refs.
- `examples/local-react-vite` Milestone 4 agent-browser check on 2026-05-14:
  after reading `agent-browser skills get core`, a dev server ran at
  `http://127.0.0.1:5174/`; `agent-browser open
  'http://127.0.0.1:5174/?state=kitchen'`, `agent-browser snapshot -i`, and
  `agent-browser screenshot /tmp/agent-ui-m4-kitchen-browser-check.png`
  confirmed the kitchen-derived QA state exposes status banners, rate usage,
  a fixed thread, plan/web-search renderers, rich command/user-input/dynamic
  tool approval cards, and a disabled approval-gated composer through
  accessible browser refs.
- Milestone 5 local CLI check on 2026-05-14: `agent-browser --version`
  returned `agent-browser 0.27.0`, and `agent-browser skills get core`
  returned the core skill guide. `detectAgentBrowser()` covers the same
  repo-skill, CLI-version, and core-skill checks in server tests.
- Milestone 5 boundary correction: skill-with-app-specific registry, storage,
  panel state, and client tools are external host-app concerns. The core
  library keeps `app/list` as Codex Apps/connectors support, generic workspace
  slots, and `agent-browser` verification helpers.
- Boundary-correction browser check on 2026-05-14: a dev server ran at
  `http://127.0.0.1:5174/`; `agent-browser skills get core`,
  `agent-browser open 'http://127.0.0.1:5174/?state=kitchen'`,
  `agent-browser snapshot -i`, and
  `agent-browser screenshot /tmp/agent-ui-boundary-correction-kitchen.png`
  confirmed the kitchen QA state still exposes status banners, usage, plan,
  web search, generic dynamic-tool approval, and disabled approval-gated
  composer after removing core skill-app runtime APIs.
- Milestone 7 examples are deterministic routes in `examples/local-react-vite`:
  `/scoped-thread-pane`, `/usage-only`, `/app-connectors`,
  `/host-workflow-recipe`, and `/fixture-gallery`. Playwright covers each route
  as generic Agent UI composition, not as external-app-specific migration code.
- Milestone 7 agent-browser check on 2026-05-14: a dev server ran at
  `http://127.0.0.1:5174/`; `agent-browser open
  'http://127.0.0.1:5174/fixture-gallery'`, `agent-browser snapshot -i`, and
  `agent-browser screenshot /tmp/agent-ui-m7-fixture-gallery.png` confirmed the
  gallery links all generic examples. `agent-browser --session m7-host open
  'http://127.0.0.1:5174/host-workflow-recipe'`, `agent-browser --session
  m7-host snapshot -i`, and `agent-browser --session m7-host screenshot
  /tmp/agent-ui-m7-host-workflow.png` confirmed the host-owned panel slot
  renders beside the generic Codex thread UI.
- Milestone 8 mobile agent-browser check on 2026-05-14: a dev server ran at
  `http://127.0.0.1:5174/`; `agent-browser --session m8-mobile open
  'http://127.0.0.1:5174/usage-only'`, `agent-browser --session m8-mobile set
  viewport 390 900`, `agent-browser --session m8-mobile snapshot -i`, and
  `agent-browser --session m8-mobile screenshot
  /tmp/agent-ui-m8-usage-only-mobile.png` confirmed the usage-only primitive
  remains accessible at a mobile-sized viewport with no chat/sidebar controls.
- Milestone 10 final agent-browser check on 2026-05-14: after reading
  `agent-browser skills get core`, a dev server ran at
  `http://127.0.0.1:5174/`; `agent-browser --session m10-final open
  'http://127.0.0.1:5174/'`, `agent-browser --session m10-final snapshot -i`,
  and `agent-browser --session m10-final screenshot
  /tmp/agent-ui-m10-final-home.png` confirmed the default fixture shell still
  exposes thread history, usage, approvals, run settings, App/Plugin mention
  buttons, and the approval-gated composer. `agent-browser --session
  m10-final-mobile open 'http://127.0.0.1:5174/usage-only'`, `agent-browser
  --session m10-final-mobile set viewport 390 900`, `agent-browser --session
  m10-final-mobile snapshot -i`, and `agent-browser --session
  m10-final-mobile screenshot /tmp/agent-ui-m10-final-usage-mobile.png`
  confirmed the usage-only primitive remains accessible at mobile width.
- Reopened UI-quality gate on 2026-05-14:
  - Commands:
    - `bun run --cwd examples/local-react-vite build`
    - `bun run typecheck`
    - `bunx vitest run packages/react/test/components.vitest.tsx`
    - `bun run test:e2e:playwright`
    - `AGENT_UI_REAL_CODEX_INIT_TIMEOUT_MS=30000 bun run test:e2e:real-codex`
    - `AGENT_UI_REAL_CODEX_INIT_TIMEOUT_MS=30000 bun run test:e2e:real-codex:approval`
    - `bun run --cwd examples/local-react-vite dev --host 127.0.0.1 --port 5174`
    - `agent-browser skills get core`
    - `agent-browser set viewport 1280 900`
    - `agent-browser open http://127.0.0.1:5174/`
    - `agent-browser open 'http://127.0.0.1:5174/?state=kitchen'`
    - `agent-browser open http://127.0.0.1:5174/host-workflow-recipe`
    - `agent-browser open http://127.0.0.1:5174/usage-only`
    - `agent-browser open http://127.0.0.1:5174/scoped-thread-pane`
    - `agent-browser open http://127.0.0.1:5174/app-connectors`
    - `agent-browser open http://127.0.0.1:5174/fixture-gallery`
    - `agent-browser set viewport 390 900`
    - repeat the route opens above for mobile-sized captures
  - Saved screenshots:
    - `docs/screenshots/agent-ui-home-desktop.png`
    - `docs/screenshots/agent-ui-home-mobile.png`
    - `docs/screenshots/agent-ui-kitchen-desktop.png`
    - `docs/screenshots/agent-ui-kitchen-mobile.png`
    - `docs/screenshots/agent-ui-host-workflow-desktop.png`
    - `docs/screenshots/agent-ui-host-workflow-mobile.png`
    - `docs/screenshots/agent-ui-usage-only-desktop.png`
    - `docs/screenshots/agent-ui-usage-only-mobile.png`
    - `docs/screenshots/agent-ui-scoped-thread-desktop.png`
    - `docs/screenshots/agent-ui-scoped-thread-mobile.png`
    - `docs/screenshots/agent-ui-app-connectors-desktop.png`
    - `docs/screenshots/agent-ui-app-connectors-mobile.png`
    - `docs/screenshots/agent-ui-fixture-gallery-desktop.png`
  - Results: `AgentChat` now renders the thread/transcript as the
    primary column, keeps status/usage/diagnostics in compact secondary chrome,
    and only repeats critical warnings inline near the thread. The
    host-workflow route is a concrete host-owned workflow panel with current
    thread summary, pending requests, plan/context, usage summary, and host
    actions. The fixture gallery renders desktop/mobile iframe previews rather
    than links only. Mobile checks keep the thread and host workflow readable
    without document-level horizontal overflow.
    The real Codex smoke returned an authenticated account, usage, 5 stored
    threads, 6 models, assistant text `Agent UI real smoke ok.`, and 1
    completed turn; the approval smoke observed and declined a command approval
    request.
  - Residual risk: the block model still uses the existing normalized item
    ordering. A future deeper kitchen-parity slice should
    add a selector for grouped `TimelineMessage` blocks, protocol-shaped
    approval decisions from normalized metadata, and fuzzy-search state
    renderers instead of considering those part of this visual-quality slice.
- Primitive-first UI gate on 2026-05-15:
  - Commands:
    - `bun run typecheck`
    - `bunx vitest run packages/react/test/components.vitest.tsx`
    - `bun run --cwd examples/local-react-vite build`
    - `bun run test:e2e:playwright`
    - `bun run --cwd examples/local-react-vite dev --host 127.0.0.1 --port 5174`
    - `agent-browser skills get core`
    - `agent-browser set viewport 1280 900`
    - `agent-browser open http://127.0.0.1:5174/`
    - `agent-browser open 'http://127.0.0.1:5174/?state=kitchen'`
    - `agent-browser open http://127.0.0.1:5174/host-workflow-recipe`
    - `agent-browser open http://127.0.0.1:5174/usage-only`
    - `agent-browser open http://127.0.0.1:5174/scoped-thread-pane`
    - `agent-browser open http://127.0.0.1:5174/app-connectors`
    - `agent-browser open http://127.0.0.1:5174/fixture-gallery`
    - `agent-browser set viewport 390 900`
    - repeat the route opens above for mobile screenshots
  - Saved screenshots:
    - `docs/screenshots/agent-ui-home-desktop.png`
    - `docs/screenshots/agent-ui-home-mobile.png`
    - `docs/screenshots/agent-ui-kitchen-desktop.png`
    - `docs/screenshots/agent-ui-kitchen-mobile.png`
    - `docs/screenshots/agent-ui-host-workflow-desktop.png`
    - `docs/screenshots/agent-ui-host-workflow-mobile.png`
    - `docs/screenshots/agent-ui-usage-only-desktop.png`
    - `docs/screenshots/agent-ui-usage-only-mobile.png`
    - `docs/screenshots/agent-ui-scoped-thread-desktop.png`
    - `docs/screenshots/agent-ui-scoped-thread-mobile.png`
    - `docs/screenshots/agent-ui-app-connectors-desktop.png`
    - `docs/screenshots/agent-ui-app-connectors-mobile.png`
    - `docs/screenshots/agent-ui-fixture-gallery-desktop.png`
  - Added Playwright checks:
    - mobile `/?state=kitchen` keeps `Agent context`, `Status summary`, and
      `Usage limits` visible instead of hiding secondary chrome
    - normal rate-limit text such as "below the warning threshold" does not
      create a critical thread notice
    - `/fixture-gallery` loads kitchen and host-workflow iframe previews with
      major text visible and includes reload controls
    - kitchen desktop and host-workflow mobile screenshots have nonblank buffer
      diversity
  - Results: React component tests passed, local Vite build passed, and
    Playwright passed 13 tests covering the fake local web bridge plus fixture
    routes. Visual layout JSON snapshots were refreshed after the mobile rail
    became reachable. `agent-browser` snapshots confirmed kitchen exposes the
    thread/timeline, approvals, status details, and usage, while host workflow
    exposes a primitive-composed thread plus host-owned context.
  - Residual risk: screenshot-buffer diversity is a smoke check, not a stable
    pixel baseline. It catches blank previews without making CI depend on
    platform-specific font rendering.
- The server package now includes a WebSocket integration test proving `createCodexWebSocketTransport()` can consume the local bridge, receive streaming assistant text, command output, and file patch events, and send approval responses back to the stdio side.
- Milestone 6 bridge checks cover host event callbacks, explicit server request
  policy opt-in, dynamic tool helper thread creation through generated
  `thread/start` params, stderr redaction, idle shutdown, and a focused
  WebSocket backpressure harness that closes slow consumers before the output
  buffer can grow without bound.
- `bun run test:e2e:playwright` also starts `examples/codex-local-web` against a fake stdio App Server and drives the real browser WebSocket transport through model list, usage, thread list/read/resume, thread start, turn start, streaming text, command output, structured diff preview, and command approval.
- The fake stdio browser smoke emits unique turn and item ids for repeated `turn/start` calls, and includes a deterministic same-thread continuation test that sends two turns, waits for `Complete`, verifies the composer re-enables, and checks that the local web app still has no horizontal overflow.

Fake stdio remains the deterministic CI gate for the browser approval UX, command output, and diff preview. Real Codex approval smoke is opt-in because it consumes a live model turn and depends on local auth, but it is now scripted and has been run successfully in this environment.

Latest real Codex smoke on 2026-05-14:

- `bun run test:e2e:real-codex`: authenticated account, usage present, 5 stored
  threads, 6 models, assistant text `Agent UI real smoke ok.`, and 1 completed
  turn.
- `bun run test:e2e:real-codex:approval`: authenticated account, usage present,
  5 stored threads, 6 models, and one command approval request observed and
  declined.

Latest real Codex smoke on 2026-05-15:

- `AGENT_UI_REAL_CODEX_INIT_TIMEOUT_MS=30000 bun run test:e2e:real-codex`:
  authenticated account, usage present, 5 stored threads, 6 models, assistant
  text `Agent UI real smoke ok.`, and 1 completed turn.
- `AGENT_UI_REAL_CODEX_INIT_TIMEOUT_MS=30000 bun run test:e2e:real-codex:approval`:
  authenticated account, usage present, 5 stored threads, 6 models, and one
  command approval request observed and declined.

### Visual quality rebuild gate on 2026-05-15

After the primitive-first gate closed, an external review still rejected the UI
as "low-quality bordered cards on a fixed shell". The visual design system,
preset hierarchy, host workflow recipe, fixture gallery, and mobile rail were
all rebuilt. Verification commands run from the repo root:

- `bun run typecheck`
- `bun run lint`
- `bunx vitest run --config vitest.config.ts --environment jsdom packages/react/test`
  → 67 tests in 5 files passed
- `bun test` (Bun fixture/protocol suite) → 60 tests passed
- `bun run test:protocol` → 26 tests, 4 snapshots
- `bun run test:fixtures` → 12 tests
- `bun run build`
- `bun run publint` (all packages green)
- `bun run attw` (node10/node16 CJS+ESM/bundler green)
- `bun run check:exports`
- `bun run test:e2e:playwright -- --update-snapshots`
  → 13 tests passed after refreshing the deliberately-changed layout-contract
  snapshots
- Browser verification with `agent-browser 0.27.0` on the fake local Vite
  example at port 5184 (5174 was in use):

```
agent-browser open http://127.0.0.1:5184/
agent-browser open 'http://127.0.0.1:5184/?state=kitchen'
agent-browser open http://127.0.0.1:5184/host-workflow-recipe
agent-browser open http://127.0.0.1:5184/usage-only
agent-browser open http://127.0.0.1:5184/scoped-thread-pane
agent-browser open http://127.0.0.1:5184/app-connectors
agent-browser open http://127.0.0.1:5184/fixture-gallery
agent-browser set viewport 1280 900
agent-browser set viewport 390 900
agent-browser screenshot docs/screenshots/agent-ui-<route>-<size>.png
```

All `docs/screenshots/agent-ui-*-{desktop,mobile}.png` files were rewritten
from this run, including the fixture-gallery desktop snapshot that now uses
grouped sections.

Visual-quality results:

- `AgentChat` is a thin preset that places `AgentThreadView` as the primary
  column and pushes `AgentStatusSummary`, `AgentStatusDetails`, `AgentUsagePanel`,
  and `AgentDiagnosticsPanel` into a compact secondary rail with cohesive
  cards instead of disconnected bordered boxes.
- The thread surface uses typography-led hierarchy: user messages are
  right-aligned chat bubbles, assistant text flows as full-width markdown,
  reasoning is rendered as an italic muted blockquote, plan blocks use a
  green-tinted callout, and command/diff blocks share a dark code surface.
- Approval cards use a warm tinted card with a strong primary `Approve` button
  and outline secondary actions so the highest-stakes decision is always the
  most prominent affordance.
- The `/host-workflow-recipe` route is rebuilt from primitives only — no
  `AgentChat` preset — with a real product header ("Verify Codex local build"),
  a two-column composition, host-owned blocks for workflow stats, validation
  checklist, pending requests, plan/context preview, and host actions wired to
  the visible verification command.
- The `/fixture-gallery` is rewritten as a true visual QA surface: previews
  are grouped by `Preset surfaces`, `Primitive compositions`, and `Lifecycle
  states`, each iframe is rendered inside a dark device frame with size and
  meta labels, and the loading state never collapses into a blank white area.
- Mobile keeps the secondary rail reachable: the rail becomes a horizontally
  scrollable strip of compact status / usage / diagnostics chips below the
  thread, and the host-workflow context stacks under the thread surface with
  its own scrollable region.
- Rate-limit notices that mention "below the warning threshold" are now `info`
  severity. They appear in `Status details` but never in the `Critical
  status` notice list.

Residual risk:

- The `AgentDiffViewer` CodeMirror surface still uses the same dark scheme;
  per-language theming was intentionally not part of this rebuild.
- Visual layout contract snapshots are still structural (boxes, columns,
  overflow) rather than per-pixel. Pixel-level diffs remain opt-in to avoid
  cross-OS font-rendering churn.

### Primitive craftsmanship rebuild on 2026-05-15 (later pass)

The 2026-05-15 visual-quality gate above closed after layouts were fixed, but
an external review still rejected the UI: **"layout を直しても composer / button
/ approval / input といった基本部品の作り込みが弱い限り、完成品には見えない"**. The
problem was diagnosed as *primitive craftsmanship*, not layout. This pass
rebuilt the interactive layer in place rather than re-arranging the screen.

Specifically:

- **Composer**: replaced the row-of-form-controls layout with a single
  bordered rounded card containing attachment chips, an auto-resizing
  textarea, and an inline icon-button toolbar (paperclip, image, App, Plugin,
  send). Focus/disabled/drag states have explicit `data-*` attributes for
  styling. `Enter` submits, `Shift+Enter` inserts a newline, IME composition
  is respected. Run settings now collapse behind a chip-shape `<details>`
  summary so the composer is the primary affordance, not run controls.
- **Buttons**: introduced an explicit `aui-btn` system with `primary /
  secondary / ghost / danger / subtle` variants plus `sm / md / lg` sizes
  and an `icon-only` modifier. `Approve` uses success green, `Decline` is
  danger red, `Approve for session` is a scoped secondary outline, scope
  decisions are clearly distinct from one another, and `New thread`,
  thread-action menu, sidebar collapse, and usage refresh are icon-led
  ghost buttons.
- **Inputs**: added a shared `aui-input-shell` with optional leading icon
  and a unified `aui-select` with a custom chevron, so the cwd input, search
  input, and selects share one visual language and a single focus ring.
- **Approval card**: rebuilt with a shield icon, humanized title, one-line
  reason, `LOW / MED / HIGH` risk pill driven by sandbox/command heuristics,
  command on a dark code surface, metadata grid for `Working directory /
  Sandbox / Approval policy`, and a divider footer with three explicit
  decisions where the primary uses success green and decline uses danger
  red.
- **Timeline**: user bubbles use a primary-tinted background with a tail and
  the `completed` meta label is suppressed on user/assistant content so it
  no longer competes with the message. Plan callouts use the primary tint
  rather than green to align with the rest of the system. Command and diff
  transcript items now share the same dark code surface.
- **Sidebar**: search input is now an `aui-input-shell` with a search icon,
  thread list items carry a coloured status dot per `data-status`, and
  Hide/Load/Load more use the subtle button variant instead of full secondary
  buttons.
- **Status / usage chips**: the rail summary widgets became pill-shape chips,
  visually distinct from the `Status details` disclosure card. The
  `running` status pill has a pulsing dot. The host workflow recipe and
  `AgentChat` rail are tested to never duplicate `AgentStatusSummary`.
- **Component close-up gallery**: `/fixture-gallery` now ends with a
  `Component close-ups` section that renders composer (normal / focused /
  approval pending / mobile), approval cards (command / user input),
  command and diff blocks, sidebar search + threads, usage and status
  chips, the full button palette, and inputs / selects / segmented as
  *live* primitives — not iframes — so reviewers can inspect part quality
  directly.

Verification commands run from the repo root after the rebuild:

- `bun run typecheck`
- `bun run lint`
- `bunx vitest run packages/react/test` → 67 tests in 5 files passed
- `bun test` (Bun fixture/protocol suite) → 60 tests passed
- `bun run build`
- `bun run test:e2e:playwright` → 19 Playwright tests passed, including new
  guards for composer states, approval risk + decisions, host workflow
  duplicate-status, mobile tap targets, and the close-up gallery render.
- `CAPTURE_DOCS_SCREENSHOTS=1 bunx playwright test
  examples/local-react-vite/e2e/capture-docs-screenshots.e2e.ts` refreshed
  every `docs/screenshots/agent-ui-*-{desktop,mobile}.png` against the new
  primitives.

Browser verification with Claude-in-Chrome at `http://127.0.0.1:5184/`
covered `/`, `/?state=kitchen`, `/host-workflow-recipe`, `/usage-only`,
`/fixture-gallery`, desktop 1280×900, and mobile 390×900. Port 5174 was
already bound by another local dev server so 5184 was used. No document-
level horizontal overflow was observed; the composer stayed visible after
completed turns; the host workflow rendered one `Status summary` (no
duplicate); the close-up gallery rendered every required section.

Residual risk:

- The CodeMirror diff viewer still uses the default vendored theme. It
  reads cleanly inside the new dark code surface but is not custom-tuned.
- The composer auto-resize cap is 220px; very long drafts still need
  manual scroll inside the textarea.
- Pixel-level visual regressions are still opt-in because cross-OS font
  rendering produces noisy diffs.

### Transcript-first repair gate on 2026-05-15

This pass removed the default UI-owned work grouping and made the transcript
the primary rendering contract. Commands, command output, tool calls, file
changes, diffs, reasoning, messages, and approvals now render inline in
turn/item order. The history sidebar uses cursor pagination through scroll
sentinels with a fallback manual next-page action, and the run settings surface
is a compact popover so it cannot displace the composer.

The 2026-05-15 follow-up completed the transcript-first gate: `AgentChat`
defaults to `usage={false}` and `diagnostics={false}`, `AgentMessageList`
renders large hydrated histories in batches with `Show earlier items`, user and
assistant messages remain expanded, and command output, JSON/tool bodies, and
CodeMirror diffs are not mounted until their disclosure is opened.
`scripts/real-local-web-layout-audit.mjs`
is the manual real-local-web gate for an already-running
`examples/codex-local-web` instance on port 5175.

Verification commands run from the repo root after the repair:

- `bun run typecheck`
- `bun run lint`
- `bun test` -> 60 tests passed
- `bunx vitest run packages/react/test` -> 83 tests passed
- `bunx vitest run packages/react/test/components.vitest.tsx` -> 60 tests passed
- `bun run test:protocol`
- `bun run test:fixtures`
- `bun run build`
- `bun run publint`
- `bun run attw`
- `bun run test:e2e:playwright` -> 33 passed, 1 skipped
- `bun run test:e2e:real-local-web-layout`
- `bunx playwright test examples/local-react-vite/e2e/visual-regression.e2e.ts --project=chromium --update-snapshots`
- `CAPTURE_DOCS_SCREENSHOTS=1 bunx playwright test examples/local-react-vite/e2e/capture-docs-screenshots.e2e.ts --project=chromium`

Browser verification covered the fixture app and the real local web example at
desktop 1280x900 and mobile 390x900. Checked routes:

- `http://127.0.0.1:5174/`
- `http://127.0.0.1:5174/fixture-gallery`
- `http://127.0.0.1:5174/host-workflow-recipe`
- `http://127.0.0.1:5174/usage-only`
- `http://127.0.0.1:5175/`

The DOM audit checks both document scroll width and bounding rects for the
message list, turns, messages, transcript cards, command output, diff viewer,
thread header, thread rows, composer, composer toolbar, composer run-settings
menu triggers, and approvals. It is intentionally a manual gate over an
already-running port-5175 `examples/codex-local-web` server; the script does
not start that server. The audit fails if the thread surface, message list,
compose panel, composer, composer run-settings menu trigger, the desktop
sidebar / thread list, the mobile `Threads` drawer trigger, or an open
run-settings menu panel is outside the viewport. It also hit-tests the Send
button center point in the closed phase, including the disabled
waiting-for-input state, so an overlaid or offscreen composer is a hard
failure. No horizontal overflow offenders were found on the checked desktop or
mobile viewports. The audit also verified that legacy work/trace classes,
labels, and a `Load all` control are absent from the rendered DOM.

### Composer / approvals / history / mobile rebuild gate on 2026-05-16

A follow-up review found the basic interaction surfaces still unfinished: the
composer hid run settings behind a separate "Run settings" disclosure, the
approval queue rendered every request as a full card inside a large scroll
pane, working directory was editable mid-thread, history needed an explicit
`Load` button, and the mobile layout stacked the whole thread sidebar under
the chat. This pass rebuilt them:

- The composer is the primary input surface. Mode and a combined model ·
  effort selector are compact anchored menus in the composer toolbar
  (`AuiMenu`) — anchored above the trigger on desktop, bottom sheets on
  mobile, with `Esc` / outside-click / arrow-key support. The standalone
  run-settings popover and `aui-run-settings-popover` / `aui-run-settings-sheet`
  CSS were deleted.
- `AgentApprovalQueue` is a compact pending-decision surface: one expanded
  card plus compact picker rows for any other pending requests, with inline
  (not three-column-card) metadata. (The 2026-05-16 approval-in-transcript
  gate below moved it inside the transcript scroll area.)
- Working directory is a thread-start setting only. The composer toolbar on an
  existing thread exposes no cwd editor; cwd shows read-only in the header.
- The thread sidebar auto-loads page one and debounce-filters from the search
  box; the standalone `Load` button is gone. On mobile it is an off-canvas
  drawer opened from a `Threads` trigger.
- Image / file attachments work through paste, drag-and-drop, and the toolbar
  pickers; `examples/codex-local-web` adds a real `POST /agent-ui/upload`
  host endpoint so a browser `File` becomes a real `localImage` path.

New `packages/react` vitest specs cover pasted/dropped/removed attachments,
sending image attachments as `localImage` input, the mode and model/effort
menus, existing-thread cwd absence, multi-approval compact-picker expansion,
and debounced history search. The Playwright suite checks the composer menus
open inside the viewport, the mobile thread drawer, and the compact approval
picker. `bun run test:e2e:real-local-web-layout` was re-run against a live
port-5175 `examples/codex-local-web` server (real Codex, 25 stored threads):
desktop and mobile, closed and run-settings-open phases, reported no overflow
offenders and a hit-testable Send button, and the real composer accepted a
pasted image that uploaded to the host endpoint and rendered as a chip.

### Approval-in-transcript gate on 2026-05-16

A follow-up review found the approval surface still failed: `AgentApprovalQueue`
was an independent `AgentThreadSurface` grid row with its own
`max-height` + `overflow: auto`, so on mobile the approval pane occupied
~350–400px while the message list collapsed to ~36px, and `.aui-command-line`
/ `.aui-metadata-grid` clipped past a 390px viewport. This pass moved the
approval into the transcript:

- `AgentMessageList` accepts a `footer` slot; `AgentThreadTimeline` renders the
  approval queue into it, so the approval is the final `<li>` of the transcript
  scroll area — a pending-decision item, not a pane between the transcript and
  the composer.
- `AgentThreadSurface` dropped the `.aui-approvals` grid row and the
  `:has(.aui-approvals)` row-shrink rule. It now has four rows: header,
  critical notices, transcript, composer.
- `.aui-approvals` lost its `max-height`, `overflow`, gradient background, and
  pane border — the transcript scroll area is the only scroll container.
- The approval card dropped the heavy elevation; command lines wrap
  (`white-space: pre-wrap`) and metadata wraps (`overflow-wrap: anywhere`) so
  nothing overflows a 390px viewport. Mobile actions are a 2-column grid with a
  full-width primary `Approve`.
- The transcript auto-scroll pulls back from the very bottom when a pending
  approval's decision footer would otherwise be clipped above the fold, so
  `Approve` / `Decline` stay visible and hit-testable without a manual scroll.

New coverage: a Playwright gate (`kitchen approval renders inside the
transcript, not a separate pane`) asserts, at desktop 1280×900 and mobile
390×900, that the approval is inside `.aui-message-list`, has no `max-height`,
is not an independent scroll pane, the message list stays ≥160px, and the
document has no horizontal overflow. `scripts/real-local-web-layout-audit.mjs`
gained the same checks (skipped when no approval is pending) and was run
against both port-5175 (real Codex) and port-5174 `/?state=kitchen` (approval
fixture): desktop and mobile reported message lists of 496px / 387px, the
approval inside the transcript, no independent scroll pane, and zero overflow
offenders.

## Visual Regression

`bun run test:e2e:playwright` includes browser-level layout contract snapshots for the local Vite example at desktop and mobile widths. These snapshots capture rendered dimensions, overflow behavior, display mode, grid columns, border radius, and key colors for the shell, sidebar, chat, run controls, usage, message list, inline activity, approvals, and composer.

The fixture smoke also captures screenshot buffers for kitchen desktop and host
workflow mobile routes and asserts they are not blank. The gallery smoke opens
iframe previews and checks visible text inside the kitchen and host workflow
frames, so the visual QA route cannot silently degrade into empty white preview
areas.

Image snapshots are intentionally not the default CI gate because OS font rendering can create noisy diffs across macOS and Linux. If pixel-level screenshots are added later, keep them in a separate opt-in job or generate Linux baselines in CI.

The browser smoke also asserts the real-local narrow layout contract that visual inspection caught on 2026-05-10: thread header actions must stay inside the thread header, the header bottom must be above the message-list top, the message timeline must remain usable, and the composer must stay in the viewport. `test-results/**` is ignored by ESLint so local lint runs do not race with Playwright while it recreates transient artifacts.

2026-05-15 mobile clipping guard: after the approval hit-test fix, the kitchen
route still rendered approval and composer children at 514px wide inside a
390px viewport because the mobile thread header could push the thread-surface
grid track to its min-content width while parent containers hid overflow. The
Playwright suite now checks selected thread, approval, composer, run-settings,
and close-up gallery elements with `getBoundingClientRect()` so hidden
horizontal clipping fails even when `documentElement.scrollWidth` remains equal
to `clientWidth`.

2026-05-17 refactor guard: the transcript renderer was split into internal
normalizer/formatter/preview helpers without changing public exports. React
regression tests now assert that user and assistant messages never collapse,
stored turns ending in file changes retain tool context, closed tool cards show
human-readable previews, opened tool cards expose Arguments / Result / Error,
thread rows keep title and metadata, and markdown/code blocks avoid nested
scroll traps.
Pure helper tests in `packages/react/test/timeline-pure.vitest.ts` exercise the
same contracts without React rendering: stored item block synthesis, transcript
window retention for same-turn execution context, hydrated status formatting,
and machine-output preview suppression.

The local Vite fixture app is intentionally split so browser QA fixtures remain
reviewable. `src/closeups/` owns direct primitive close-ups, `src/fixtures/`
owns deterministic fake state and route metadata, and `src/main.tsx` owns route
composition. The real Codex integration remains separate in
`examples/codex-local-web`.
