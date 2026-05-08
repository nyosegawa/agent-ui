# Testing

## Test Layers

```text
1. protocol conformance
2. normalizer/reducer
3. transport
4. React components
5. integration/e2e
```

## Protocol Conformance

Purpose:

- detect Codex App Server schema drift
- detect stable/experimental API changes
- protect generated type imports
- snapshot method lists

Tests:

- `ClientRequest` method list snapshot
- `ServerNotification` method list snapshot
- `ServerRequest` method list snapshot
- generated TypeScript importability
- stable vs experimental schema diff snapshot
- required fields and discriminated union parsing

These tests are allowed to fail when upstream Codex changes. Failure means the adapter must be updated.

## Normalizer and Reducer

Most important test layer.

Cases:

- `thread/started`
- `thread/status/changed`
- `turn/started`
- `item/agentMessage/delta`
- `item/reasoning/summaryTextDelta`
- `item/completed`
- `turn/completed`
- `thread/tokenUsage/updated`
- command output delta
- file patch update
- approval request/resolved
- failed turn
- interrupted turn
- out-of-order safe handling

Method:

- stream JSONL fixtures
- snapshot normalized events
- snapshot final state
- assert invariants

Important invariants:

- `item/completed` overwrites transient deltas with authoritative state.
- `turn/completed` clears active turn state.
- pending server requests are cleared by response, rejection, resolution, or disconnect.
- lossless events reach the reducer before rendering.

## Transport

Cases:

- stdio JSONL read/write
- request id correlation
- notification dispatch
- server request to client response
- malformed JSON
- child process exit
- stderr logging
- timeout
- overload error `-32001`
- websocket auth header
- websocket close/reconnect policy

Most transport tests use fake child process and fake websocket implementations.

## React Components

Component tests:

- render current thread
- stream message deltas
- submit prompt
- disable composer while blocked
- show pending approval
- approve/reject server requests
- render command output
- render file diff
- switch thread
- show auth/device-code state

Accessibility tests required from MVP:

- `AgentComposer`
- `AgentApprovalPrompt`
- dialog/modal approval variants
- `ThreadList`

Streaming log and diff viewer start with snapshot and keyboard smoke tests.

## Integration and E2E

Required for release confidence:

- real `codex app-server --listen stdio://`
- `initialize -> initialized`
- `account/read`
- `model/list`
- `thread/start`
- React example Playwright smoke

Optional/nightly:

- real authenticated turn
- Node.js LTS compatibility smoke
- pnpm compatibility smoke
- websocket remote demo

## CI Commands

Required PR gate:

```text
bun run typecheck
bun run lint
bun test
bun run build
bun run test:protocol
bun run test:fixtures
bun run publint
bun run attw
```

Optional/nightly:

```text
bun run test:e2e:real-codex
bun run test:e2e:playwright
bun run test:node-compat
bun run test:pnpm-compat
```

## Current Validation

Current MVP validation commands:

```text
bun run typecheck
bun run lint
bun test
bun run test
bun run build
bun run test:protocol
bun run test:fixtures
bun run publint
bun run attw
bun run test:e2e:playwright
```

Real Codex smoke has been verified locally through the server bridge for initialize, account/model reads, thread start, turn start, streaming text, token usage, and turn completion. Full approval-path real smoke still needs deterministic fixtures or a controlled Codex prompt that requests command/file approvals.
