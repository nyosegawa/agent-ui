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
- exercise the same bridge security defaults as host apps: admission before
  process spawn, browser method filtering, and no dynamic-tool execution unless
  a host handler is configured

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
```

The default URL is `http://127.0.0.1:5175/`.

The host page treats 5175 as a full-height app. `.agent-ui-local-app` owns
`height: 100dvh`, `AgentChat` consumes that height, and only
`.aui-message-list` scrolls. The composer is anchored at the viewport bottom on
desktop and mobile, including mobile safe-area padding, so long transcripts,
approvals, command output, and diffs do not push it below the visible page.

Thread URL routing keeps browser history aligned with the visible thread. The
initial history auto-selection from `/` replaces the root entry with
`/threads/<threadId>` so first load does not create a dead back step. Explicit
user selections, resumed threads, and new threads push history entries, so
browser back/forward returns to the previous thread or to `/` when the previous
state was the no-thread view.

Running turns follow Codex App Server semantics: additional composer text sends
`turn/steer` with the active turn as `expectedTurnId`, and the empty running
primary button sends `turn/interrupt`. Preview-only stored threads and
approval-waiting turns remain blocked until resumed or resolved.

Resume can replay restored token usage via `thread/tokenUsage/updated`. The
example shows nonzero context usage beside the composer and hides the indicator
when usage is absent or zero.

For the real layout audit:

```sh
AGENT_UI_PORT=5175 \
AGENT_UI_HOST=127.0.0.1 \
AGENT_UI_CODEX_CWD=/Users/sakasegawa/src/github.com/nyosegawa/agent-ui \
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev

bun run test:e2e:real-local-web-layout
```

The audit script checks an already-running page; it does not start the server.

Attachment handling is host-owned. Image uploads are sent as `localImage`
inputs with the saved absolute path. Non-image uploads, including unknown
extensions such as `.3mf`, are saved to the same upload directory and sent as
explicit `Attached file: /absolute/path` text because App Server has no generic
local-file user input.
