# Real Codex Local Web Example

Directory:

```text
examples/codex-local-web
```

Purpose:

- prove the real local browser path
- run a same-origin WebSocket bridge
- start `codex app-server --listen stdio://`
- render real account, model, thread, turn, approval, usage, and diff events
- persist browser uploads so attachments become App Server-readable inputs
- mirror the active thread in `/threads/<threadId>` URLs so direct links and
  browser back/forward restore thread selection
- exercise the same loopback-first bridge defaults host apps can start from:
  browser method filtering, inbound limits, idle timeout, backpressure handling,
  upload and directory-picker routes, and no dynamic-tool execution unless a
  host handler is configured

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
```

The default URL is `http://127.0.0.1:5175/`.
The server refuses non-loopback `AGENT_UI_HOST` values by default because the
example exposes unauthenticated bridge, upload, and directory-picker routes. It
does not configure a per-connection bridge `admission` hook before spawning the
App Server process. For trusted host-owned networks only, set
`AGENT_UI_ALLOW_NON_LOOPBACK=1`; the server will print a warning before binding.
Before using that opt-in outside loopback, add host-owned auth, bridge
admission, workspace and upload scoping, process isolation, resource limits, and
audit logging. See [Server Bridge](../reference/server-bridge.md) for exact
bridge defaults.

The host page treats 5175 as a full-width, full-height app. `.agent-ui-local-app`
owns `width: 100%` and `height: 100dvh`, `AgentChat` consumes that height, and
the provided transcript area owns reading scroll. The composer is anchored at
the viewport bottom on desktop and mobile, including mobile safe-area padding,
so long transcripts, approvals, command output, and diffs do not push it below
the visible page.

The example imports `@nyosegawa/agent-ui-react/styles.css` once and keeps its
route CSS token-based. Any `.aui-*` classes produced by the React package are
internal implementation details of that stylesheet, not selectors this example
documents as a host contract.

Thread URL routing keeps browser history aligned with the visible thread. The
root route `/` remains the no-thread start screen while the sidebar loads
history without selecting a thread. Direct links to `/threads/<threadId>` read
that thread on first load. Explicit user selections, resumed threads, and new
threads push history entries, so browser back/forward returns to the previous
thread or to `/` when the previous state was the no-thread view.

The start screen's working-directory picker is backed by
`POST /agent-ui/select-directory` on macOS. Selecting a folder returns its
absolute path; canceling the native dialog returns no path and leaves the
current selection unchanged without showing a browser prompt.

Running turns follow Codex Desktop-style composer semantics on top of Codex App
Server methods. Enter stores text in the UI-local follow-up queue; `Send now`
and Cmd/Ctrl+Enter call `turn/steer` with the active turn as `expectedTurnId`.
On idle or complete threads, Cmd/Ctrl+Enter starts a normal new turn. The
running primary button is Stop and calls only `turn/interrupt`. Unsent follow-ups
remain in Agent UI state after Stop. Stored threads opened through the default
sidebar or thread URL resume automatically; approval-waiting turns remain
blocked until resolved.

The automatic resume path can replay restored token usage via
`thread/tokenUsage/updated`. The example shows nonzero context usage beside the
composer and hides the indicator when usage is absent or zero.

For the real layout audit:

```sh
AGENT_UI_PORT=5175 \
AGENT_UI_HOST=127.0.0.1 \
AGENT_UI_CODEX_CWD="$PWD" \
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev

bun run test:e2e:real-local-web-layout
```

The audit script checks an already-running page; it does not start the server.

For the deterministic real-local Playwright suite:

```sh
bun run test:e2e:real-local
```

This command starts `examples/codex-local-web` on port 4174 with the fake Codex
App Server and runs only the `examples/codex-local-web/e2e` specs.

The deterministic Playwright smoke suite for this example is split by App
Server integration contract:

- `real-local-thread-lifecycle.e2e.ts` protects stored-thread hydration,
  auto-resume, new-thread creation, direct thread URLs, browser back/forward,
  sidebar selection, and popstate cleanup.
- `real-local-attachments.e2e.ts` protects image paste, arbitrary file upload
  chips, attachment restoration for queued edits, and non-image upload payload
  text.
- `real-local-follow-ups.e2e.ts` protects running-turn composer semantics,
  queued follow-ups, `turn/steer`, `turn/interrupt`, queue compaction,
  anchored composer layout, and scroll-follow behavior.
- `e2e/support/real-local-page.ts` contains shared page helpers and app-open
  readiness. Do not hide user interactions behind DOM-only shortcuts in helpers;
  normal fill, click, keyboard, and hit-test operations should remain visible in
  the tests.

Attachment handling is host-owned. Image uploads are sent as `localImage`
inputs with the saved absolute path. Non-image uploads, including unknown
extensions such as `.3mf`, are saved to the same upload directory and sent as
explicit `Attached file: /absolute/path` text because App Server has no generic
local-file user input.

The local upload helper writes into a per-session temp directory, validates
method/content type/filename headers, enforces size limits, preserves arbitrary
sanitized extensions, exposes a cleanup hook, and runs TTL cleanup for expired
upload sessions before new writes. This example calls the cleanup hook
idempotently when the HTTP server closes or receives SIGINT/SIGTERM, so normal
dev-server shutdown removes the current session directory while TTL cleanup still
handles abandoned sessions.
