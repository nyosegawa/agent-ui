# Codex Local Web

Primary real local example: browser Agent UI, same-origin WebSocket bridge, and
`codex app-server --listen stdio://`.

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
