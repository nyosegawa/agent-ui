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
- `turn/start`

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
- keep command output and file-change diffs in per-turn Work traces rather than detached panels
- keep very large persisted command-output histories collapsed to recent Work trace activity
- keep long persisted messages behind a preview/expand affordance
- render structured App Server message content arrays as readable text
- show completed message status after real thread completion and hydrated history reads
- normalize stale `inProgress` item labels to completed in loaded hydrated history
- keep narrow-width persisted history vertical and scroll-contained
- keep the composer visible while the message list and sidebar own independent scroll containers
- keep narrow-width run settings collapsed into an expandable summary so the message timeline remains usable
- keep narrow-width usage collapsed into an expandable summary so the chat history remains the primary scroll surface
- collapse and expand the history sidebar through accessible controls
- preserve working directory from `cwd` in `thread/list`, `thread/read`, `thread/resume`, and `thread/start` responses while hiding internal `.codex/sessions/*.jsonl` paths
- show compact cwd context in stored-history rows and follow paginated `thread/list` cursors through the `Load all` history action
- keep history loading/count/pagination feedback outside the thread-list scroll container so real large histories do not rely on implicit grid rows
- keep App Server plugin manifest warnings in diagnostics instead of the primary chat flow
- suppress known low-value Codex plugin `interface.defaultPrompt` warnings from visible diagnostics
- suppress known low-value Codex skill icon path warnings from visible diagnostics and the real local web dev terminal
- render file diff
- switch thread
- show auth/device-code state

Accessibility tests required for release:

- `AgentComposer`
- `AgentApprovalPrompt`
- dialog/modal approval variants
- `ThreadList`

Streaming log and diff viewer start with snapshot and keyboard smoke tests.

The fixture Vite example also exposes a dedicated `/qa` index for deterministic
visual states used in manual and automated QA:

- `/?state=empty`: authenticated account, usage/model data, no stored threads
- `/?state=unauth`: first-run device-code login state
- `/?state=bridge-error`: connection diagnostics without a running bridge
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
- Browser smoke command: `bun run test:e2e:playwright`.
- Browser smoke result: 8 Playwright tests passed after the Work trace, deferred action, and local server hardening pass. The real local app target used a fake stdio App Server while exercising the actual browser WebSocket transport and same-origin bridge path.
- Playwright starts fresh local preview/dev servers for the fixture and real-local browser targets instead of reusing an existing `4173` or `4174` process. This avoids stale bridge/session state from hiding real regressions or creating local-only hangs after a failed run. If a local manual dev server is left behind, kill the orphan `examples/codex-local-web` process before re-running the smoke.
- Do not run `bun run build` concurrently with `bun run test:e2e:playwright`. The browser smoke previews built `dist` output; a simultaneous workspace build can clean or replace that output while Playwright is waiting on the first page. The full sweep should run build first, then Playwright.
- `examples/codex-local-web` disables Vite HMR in its custom middleware server. The production-like local bridge path needs a stable same-origin WebSocket endpoint for `/agent-ui/ws`; a separate dev HMR websocket is not part of the product path and can make browser automation noisy.
- Real local UI screen check after Work trace and history hardening: in the in-app browser at `http://127.0.0.1:5174/`, an authenticated real session loaded account, usage, and stored threads; the latest stored session auto-previewed in the main pane; narrow-width layout showed the chat pane before the thread history; command/file-change activity was grouped into per-turn Work traces instead of a detached terminal shelf.

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
- `examples/codex-local-web` real history exhaustion check on 2026-05-10: a headless browser opened `http://127.0.0.1:5174/`, clicked `Load all`, followed real `thread/list` cursors from 25 visible rows to 684 rows, reached `684 threads loaded · all loaded`, removed `Load more` / `Load all`, and kept the narrow layout free of horizontal overflow.
- The server package now includes a WebSocket integration test proving `createCodexWebSocketTransport()` can consume the local bridge, receive streaming assistant text, command output, and file patch events, and send approval responses back to the stdio side.
- `bun run test:e2e:playwright` also starts `examples/codex-local-web` against a fake stdio App Server and drives the real browser WebSocket transport through model list, usage, thread list/read/resume, thread start, turn start, streaming text, command output, structured diff preview, and command approval.
- The fake stdio browser smoke emits unique turn and item ids for repeated `turn/start` calls, and includes a deterministic same-thread continuation test that sends two turns, waits for `Complete`, verifies the composer re-enables, and checks that the local web app still has no horizontal overflow.

Fake stdio remains the deterministic CI gate for the browser approval UX, command output, and diff preview. Real Codex approval smoke is opt-in because it consumes a live model turn and depends on local auth, but it is now scripted and has been run successfully in this environment.

## Visual Regression

`bun run test:e2e:playwright` includes browser-level layout contract snapshots for the local Vite example at desktop and mobile widths. These snapshots capture rendered dimensions, overflow behavior, display mode, grid columns, border radius, and key colors for the shell, sidebar, chat, run controls, usage, message list, inline activity, approvals, and composer.

Image snapshots are intentionally not the default CI gate because OS font rendering can create noisy diffs across macOS and Linux. If pixel-level screenshots are added later, keep them in a separate opt-in job or generate Linux baselines in CI.

The browser smoke also asserts the real-local narrow layout contract that visual inspection caught on 2026-05-10: thread header actions must stay inside the thread header, the header bottom must be above the message-list top, the message timeline must remain usable, and the composer must stay in the viewport. `test-results/**` is ignored by ESLint so local lint runs do not race with Playwright while it recreates transient artifacts.
