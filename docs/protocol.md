# Protocol

## Primary Backend

Agent UI's primary backend is Codex App Server.

Default startup:

```text
codex app-server --listen stdio://
```

The integration is protocol-based. Agent UI does not rely on a JavaScript SDK API for the primary Codex path.

## Transport Interface

```ts
export interface AgentTransport {
  connect(): Promise<void>;
  close(): Promise<void>;
  request<TParams, TResult>(method: string, params?: TParams): Promise<TResult>;
  notify(method: string, params?: unknown): void;
  events: AsyncIterable<AgentTransportEvent>;
  respond(requestId: RequestId, result: unknown): Promise<void>;
  reject(
    requestId: RequestId,
    error: { code: number; message: string; data?: unknown },
  ): Promise<void>;
}
```

## Stdio Transport

The default transport:

- spawns `codex app-server --listen stdio://`
- writes one JSON object per line
- reads one JSON object per line
- correlates request id to response promise
- exposes stderr logs separately
- fails fast on process exit
- supports server requests that require client responses

Implementation status:

- `@nyosegawa/agent-ui-codex` owns JSON-RPC-lite framing over existing stdio streams.
- `@nyosegawa/agent-ui-server` owns local process spawning for `codex app-server --listen stdio://`.
- `createCodexAppServerBridge()` returns an `AgentTransport` and redacts stderr before forwarding logs.
- The generated stable and experimental TypeScript schemas are vendored under `packages/codex/src/generated`.
- Protocol metadata records upstream commit `607b0dd1f06ce8b09db43f2ec3e0582daf21158e`.

## WebSocket Transport

WebSocket support is optional and advanced.

Rules:

- remote production deployment is not part of MVP
- non-loopback exposure requires explicit auth
- bearer tokens must not be logged or placed in query strings
- reconnect is opt-in
- multi-user use requires per-user process/credential/workspace separation

Implementation status:

- `createCodexWebSocketTransport()` speaks the same JSON-RPC-lite request/response shape over `WebSocket`.
- Browser-facing imports should use `@nyosegawa/agent-ui-codex/websocket`; the package root also contains Node stdio code.
- `@nyosegawa/agent-ui-server` exports `attachAgentUiWebSocketBridge()` for same-origin local web apps. It keeps a Codex App Server process alive for the browser session and forwards transport events through an Agent UI envelope.
- The same-origin bridge closes the App Server process when the browser socket closes and also has an idle timeout for abandoned browser sessions.
- `examples/codex-local-web` is the primary real local web app path.
- The transport accepts `url`, optional `protocols`, optional initialize metadata, and optional reconnect settings.
- Authentication belongs to the host endpoint, for example same-origin cookies or a reverse proxy session.
- Reconnect is opt-in with bounded exponential backoff. On close, pending requests are rejected so callers do not hang across a broken socket.

## Stable and Experimental API

Default public API uses stable App Server protocol only.

Experimental protocol support:

```tsx
<AgentProvider experimental={{ codex: true }}>
```

Generated experimental types may exist internally, but they must not appear in default public component props or normalized core state.

## Schema Drift

Codex App Server schema is expected to change.

Policy:

- vendor generated TypeScript schema
- record upstream Codex commit hash
- record generation timestamp
- snapshot protocol method lists
- fail protocol conformance tests when upstream changes break assumptions

Package metadata should include:

```json
{
  "agentUi": {
    "codexProtocolCommit": "<commit>",
    "generatedAt": "<iso timestamp>"
  }
}
```

## MVP Protocol Surface

Client requests:

- `initialize`
- `account/read`
- `account/login/start`
- `account/login/cancel`
- `account/logout`
- `model/list`
- `thread/start`
- `thread/resume`
- `thread/list`
- `thread/read`
- `thread/unsubscribe`
- `turn/start`
- `turn/steer`
- `turn/interrupt`

Server requests:

- command approval
- file change approval
- user input request

Notifications:

- thread lifecycle
- turn lifecycle
- item lifecycle
- agent message deltas
- command output deltas
- file patch updates
- plan/reasoning deltas
- account updated/login completed
- warnings/errors

Deferred:

- `process/*`
- plugin marketplace admin
- realtime/audio
- dynamic tools
- external ChatGPT auth token mode

## Local Smoke

The MVP smoke path verified locally:

```text
initialize
account/read
model/list
account/rateLimits/read
thread/list
thread/read includeTurns
thread/start
turn/start
stream item/agentMessage/delta
turn/completed
thread/resume after a completed turn is persisted
```

Latest real Codex verification against `codex app-server --listen stdio://` on 2026-05-09 with `codex-cli 0.128.0` confirmed:

- `model/list` currently returns models under `data`, including `gpt-5.5` as the first/default entry in this environment.
- `account/rateLimits/read` returns 5-hour and weekly windows through `primary` and `secondary`.
- `thread/list` returns stored sessions.
- `thread/read` with `includeTurns: true` returns persisted turn history without resuming.
- `thread/resume` succeeds from a stored history id with `excludeTurns: true`.
- `thread/start` can create an ephemeral thread for smoke verification.
- `turn/start` streams `item/agentMessage/delta` and emits `turn/completed`.
