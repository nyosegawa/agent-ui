# Codex Local Web

Full local Agent UI shell backed by a same-origin Node WebSocket bridge to
`codex app-server --listen stdio://`.

This is the primary real local example. The React app uses the transcript-first
`AgentChat` preset through `AgentProvider`, while `server.ts` owns the Codex App
Server process and browser WebSocket bridge. Usage and diagnostics are not
assumed preset rails; hosts can compose those primitives around the thread when
they want them.

## Composer attachments

The app wires `AgentChat`'s `resolveLocalAttachment` so pasted, dropped, and
picked image/file attachments become real Codex inputs. Because the Codex App
Server reads `localImage` inputs from disk and the browser only holds a `File`,
`server.ts` exposes a `POST /agent-ui/upload` endpoint that persists the upload
to a host temp directory and returns an absolute path. The resolver wraps that
path with `localImageInput` for images and `mentionInput` for other files.
This host-supplied resolver is the intended integration shape — the library
never treats browser-only blob URLs or `File.name` values as App Server paths.

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
