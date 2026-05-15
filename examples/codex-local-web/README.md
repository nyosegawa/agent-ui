# Codex Local Web

Full local Agent UI shell backed by a same-origin Node WebSocket bridge to
`codex app-server --listen stdio://`.

This is the primary real local example. The React app uses the transcript-first
`AgentChat` preset through `AgentProvider`, while `server.ts` owns the Codex App
Server process and browser WebSocket bridge. Usage and diagnostics are not
assumed preset rails; hosts can compose those primitives around the thread when
they want them.

Smoke path:

```bash
bun run --filter @nyosegawa/agent-ui-example-codex-local-web dev
bun run test:e2e:playwright
```

Manual real-local layout gate:

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
