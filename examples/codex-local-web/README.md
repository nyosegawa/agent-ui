# Codex Local Web

Full local Agent UI shell backed by a same-origin Node WebSocket bridge to
`codex app-server --listen stdio://`.

This is the primary real local example. The React app uses the vNext preset
shell, `AgentProvider` plus `AgentChat`, while `server.ts` owns the Codex App
Server process and browser WebSocket bridge.

Smoke path:

```bash
bun run --filter @nyosegawa/agent-ui-example-codex-local-web dev
bun run test:e2e:playwright
```

Real Codex smoke, when local auth is available:

```bash
bun run test:e2e:real-codex
bun run test:e2e:real-codex:approval
```
