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

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
```

The default URL is `http://127.0.0.1:5175/`.

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
