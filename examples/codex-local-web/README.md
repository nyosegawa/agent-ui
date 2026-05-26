# Codex Local Web

Primary real local example: browser Agent UI, same-origin WebSocket bridge, and
`codex app-server --listen stdio://`.

The app shell is full-width and full-height at `http://127.0.0.1:5175/`: the
transcript is the only scroll container, and the composer stays anchored to the
viewport bottom. Running-turn Enter creates UI-local follow-up cards; `Send now`
and Cmd/Ctrl+Enter use `turn/steer`, while idle Cmd/Ctrl+Enter starts a normal
turn; Stop uses only `turn/interrupt`. Restored context usage from
`thread/tokenUsage/updated` appears beside the composer when nonzero. The root
route stays on the start screen; stored threads are opened only through explicit
selection or `/threads/<id>` direct links.
Uploads use the local helper's per-session temp directory, validation, size
limit, TTL cleanup, and explicit cleanup hook. Images become `localImage`
inputs; non-images become explicit `Attached file: /absolute/path` text.

Detailed docs: [docs/examples/codex-local-web.md](../../docs/examples/codex-local-web.md).

Smoke path:

```bash
bun run --filter @nyosegawa/agent-ui-example-codex-local-web dev
bun run test:e2e:playwright
```

Manual real-local layout gate. Start this example on port 5175 first; the
audit script checks the already-running page and does not start the server:

```bash
AGENT_UI_PORT=5175 \
AGENT_UI_HOST=127.0.0.1 \
AGENT_UI_CODEX_CWD=/Users/sakasegawa/src/github.com/nyosegawa/agent-ui \
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev

bun run test:e2e:real-local-web-layout
```

Real Codex smoke, when local auth is available:

```bash
bun run test:e2e:real-codex
bun run test:e2e:real-codex:approval
```
