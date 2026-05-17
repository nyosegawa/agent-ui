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
  reject(requestId: RequestId, error: AgentError): Promise<void>;
}

type AgentError = {
  code?: number;
  message: string;
  data?: unknown;
};
```

## Stdio Transport

The default transport:

- spawns `codex app-server --listen stdio://`
- writes one JSON object per line
- reads one JSON object per line
- correlates request id to response promise
- retries App Server overload `-32001` responses for idempotent read methods
  only, with bounded backoff
- exposes stderr logs separately
- fails fast on process exit
- supports server requests that require client responses

Implementation status:

- `@nyosegawa/agent-ui-codex` owns JSON-RPC-lite framing over existing stdio streams.
- `@nyosegawa/agent-ui-server` owns local process spawning for `codex app-server --listen stdio://`.
- `createCodexAppServerBridge()` returns a `CodexAppServerBridge` with a
  `transport` property and redacts stderr before forwarding logs.
- The generated stable and experimental TypeScript schemas are vendored under `packages/codex/src/generated`.
- `request-builders.ts` is the product request boundary. Builders return
  params that satisfy generated stable App Server types; React re-exports those
  builders instead of owning Codex-specific request shapes.
- `createCodexSession()` is the stable facade for productized account, model,
  thread, turn, skills, hooks, and app methods. Experimental method calls must
  use `requestExperimental()` and require explicit opt-in.
- `thread/turns/items/list` is intentionally disabled in the product facade
  until upstream implements it.
- Protocol metadata records upstream commit `6a225e4005209f2325ab3c681c7c6beba2907d4d`.
- The schema refresh command used for this pass was
  `cargo run -p codex-app-server-protocol --bin export -- --out packages/codex/src/generated/stable`
  and the same command with `--experimental` for
  `packages/codex/src/generated/experimental`, run from
  `/Users/sakasegawa/src/github.com/openai/codex/codex-rs`.

## WebSocket Transport

Direct WebSocket support to Codex App Server is experimental and unsupported
upstream. Agent UI's productized browser path is a same-origin host bridge that
keeps Codex App Server on the default `stdio://` transport.

Rules:

- remote production deployment is not part of the local release
- non-loopback exposure requires explicit auth
- bearer tokens must not be logged or placed in query strings
- reconnect is opt-in
- multi-user use requires per-user process/credential/workspace separation

Implementation status:

- `createCodexWebSocketTransport()` speaks the same JSON-RPC-lite request/response shape over `WebSocket`.
- Browser-facing imports should use `@nyosegawa/agent-ui-codex/websocket`; the package root also contains Node stdio code.
- `@nyosegawa/agent-ui-server` exports `attachAgentUiWebSocketBridge()` for same-origin local web apps. It keeps a Codex App Server process alive for the browser session and forwards transport events through an Agent UI envelope.
- The same-origin bridge closes the App Server process when the browser socket closes and also has an idle timeout for abandoned browser sessions.
- The same-origin bridge closes slow browser consumers with WebSocket code
  `1013` when the outbound buffer exceeds its configured backpressure limit.
- `examples/codex-local-web` is the primary real local web app path.
- The transport accepts `url`, optional `protocols`, optional initialize metadata, and optional reconnect settings.
- Authentication belongs to the host endpoint, for example same-origin cookies or a reverse proxy session.
- Reconnect is opt-in with bounded exponential backoff. On close, pending requests are rejected so callers do not hang across a broken socket.

## Stable and Experimental API

Default public API uses stable App Server protocol only.

Experimental protocol support:

```ts
await transport.request("initialize", {
  clientInfo: { name: "agent_ui_host" },
  capabilities: { experimentalApi: true },
});
```

Generated experimental types may exist internally, but they must not appear in default public component props or normalized core state.

`createCodexSession(transport)` defaults to stable methods only. Hosts that
need experimental methods must opt in with
`createCodexSession(transport, { experimental: true })`; even then,
`thread/turns/items/list` remains disabled because it is not implemented
upstream.

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

## Release Protocol Surface

The current generated stable `ClientRequest` schema contains many App Server
methods. Agent UI intentionally productizes the real local chat path first and
does not claim complete Codex Desktop parity for every host utility. The
coverage status is:

Stable productized methods:

- `initialize`
- `account/read` with `{ refreshToken: false }` for startup bootstrap
- `account/login/start` with `{ type: "chatgptDeviceCode" }`
- `account/login/cancel` with `{ loginId }`
- `account/logout` without params
- `account/rateLimits/read` without params
- `model/list` with `{}` or stable pagination params
- `thread/start`
- `thread/resume`
- `thread/fork`
- `thread/list`
- `thread/loaded/list`
- `thread/read`
- `thread/archive`
- `thread/unarchive`
- `thread/name/set`
- `thread/metadata/update`
- `thread/compact/start`
- `thread/rollback`
- `thread/inject_items`
- `thread/unsubscribe`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `skills/list`
- `skills/config/write`
- `hooks/list`
- `app/list`

Host-only or advanced local tooling:

- `thread/shellCommand`
- `thread/approveGuardianDeniedAction`
- `command/exec`
- `command/exec/write`
- `command/exec/terminate`
- `command/exec/resize`
- `fs/readFile`
- `fs/writeFile`
- `fs/createDirectory`
- `fs/getMetadata`
- `fs/readDirectory`
- `fs/remove`
- `fs/copy`
- `fs/watch`
- `fs/unwatch`
- `fuzzyFileSearch`
- `review/start`
- `getConversationSummary`
- `gitDiffToRemote`
- `getAuthStatus`
- `modelProvider/capabilities/read`
- `config/read`
- `config/value/write`
- `config/batchWrite`
- `configRequirements/read`
- `externalAgentConfig/detect`
- `externalAgentConfig/import`
- `account/sendAddCreditsNudgeEmail`
- `feedback/upload`
- `marketplace/add`
- `marketplace/remove`
- `marketplace/upgrade`
- `plugin/list`
- `plugin/read`
- `plugin/skill/read`
- `plugin/share/save`
- `plugin/share/updateTargets`
- `plugin/share/list`
- `plugin/share/checkout`
- `plugin/share/delete`
- `plugin/install`
- `plugin/uninstall`
- `experimentalFeature/list`
- `experimentalFeature/enablement/set`
- `mcpServer/oauth/login`
- `config/mcpServer/reload`
- `mcpServerStatus/list`
- `mcpServer/resource/read`
- `mcpServer/tool/call`
- `windowsSandbox/readiness`
- `windowsSandbox/setupStart`

Experimental available methods:

- `collaborationMode/list`
- `environment/add`
- `fuzzyFileSearch/sessionStart`
- `fuzzyFileSearch/sessionUpdate`
- `fuzzyFileSearch/sessionStop`
- `memory/reset`
- `mock/experimentalMethod`
- `process/spawn`
- `process/writeStdin`
- `process/resizePty`
- `process/kill`
- `remoteControl/enable`
- `remoteControl/disable`
- `thread/backgroundTerminals/clean`
- `thread/increment_elicitation`
- `thread/decrement_elicitation`
- `thread/goal/set`
- `thread/goal/get`
- `thread/goal/clear`
- `thread/memoryMode/set`
- `thread/realtime/start`
- `thread/realtime/appendAudio`
- `thread/realtime/appendText`
- `thread/realtime/listVoices`
- `thread/realtime/stop`
- `thread/turns/list`
- `thread/turns/items/list`

Server requests:

- command approval
- file change approval
- user input request
- MCP elicitation
- permissions approval
- dynamic tool call
- auth refresh
- attestation
- legacy `applyPatchApproval` and `execCommandApproval` compatibility requests

Notifications:

- thread lifecycle
- turn lifecycle
- item lifecycle
- agent message deltas
- command output deltas
- file patch updates
- plan, diff, and reasoning deltas
- account updated/login completed
- app list updates
- skills changed invalidation
- model reroutes, deprecation notices, config warnings, and MCP OAuth/status banners
- warnings/errors

Deferred:

- remote/multi-user production
- realtime/audio and voice UX
- plugin marketplace administration
- dynamic MCP resource/tool management as a product surface
- external ChatGPT auth token mode

Unrecognized notifications are never treated as chat text. The normalizer keeps
known message, command, file-change, approval, plan, usage, account, warning,
and error events structured; unknown or deferred App Server messages should
surface as redacted diagnostics or neutral timeline activity until explicitly
productized.

## Local Smoke

The release smoke path verified locally:

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

Latest real Codex verification against `codex app-server --listen stdio://` on
2026-05-14 confirmed the same protocol path; details and environment-specific
timeouts are recorded in `docs/testing.md`. The verified surfaces are:

- `model/list` currently returns models under `data`, including `gpt-5.5` as the first/default entry in this environment.
- `account/rateLimits/read` returns 5-hour and weekly windows through `primary` and `secondary`.
- `thread/list` returns stored sessions.
- `thread/read` with `includeTurns: true` returns persisted turn history without resuming.
- `thread/resume` succeeds from a stored history id with `excludeTurns: true`.
- `thread/start` can create an ephemeral thread for smoke verification.
- `turn/start` streams `item/agentMessage/delta` and emits `turn/completed`.
