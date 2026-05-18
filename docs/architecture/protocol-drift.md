# Protocol Drift

Codex App Server schema can change. Agent UI treats drift as expected maintenance, not as an exceptional event.

## Recorded Metadata

`@nyosegawa/agent-ui-codex` records:

- upstream Codex commit
- generated timestamp
- stable and experimental generated schema files
- generated-schema-derived capability metadata split into `stableAvailable`,
  `stableProductized`, `experimentalAvailable`, and `hostOnly`

The generated schema lives under `packages/codex/src/generated`.

## Update Flow

1. Inspect `/Users/sakasegawa/src/github.com/openai/codex/codex-rs/app-server`.
2. Run `bun --filter @nyosegawa/agent-ui-codex generate:schema`. By default
   it reads `/Users/sakasegawa/src/github.com/openai/codex`; set `CODEX_REPO`
   only when intentionally testing another checkout.
3. Review generated stable and experimental diffs.
4. Update `CODEX_PROTOCOL_COMMIT` and `CODEX_PROTOCOL_GENERATED_AT` in
   `packages/codex/src/protocol.ts`. The generation script updates schema
   files; it does not make the metadata decision for you.
5. Update package/docs metadata that mentions the protocol commit when that
   metadata is part of the public release note or docs.
6. Update `packages/codex/src/protocol.ts` capability classifications when the
   generated method surface changes.
7. Update normalizer mappings when notification or request payloads changed.
8. Run protocol tests and accept method snapshots only after reviewing the App Server change.
9. Update docs when the public release surface changes.

## Tests

Protocol drift is guarded by:

- JSON-RPC-lite framing tests
- normalizer tests
- generated method inline snapshots
- capability metadata equality checks against generated `ClientRequest`,
  `ServerNotification`, and `ServerRequest` files
- raw readiness/error tests for stdio and WebSocket initialize behavior
- raw JSON-RPC fixture pack tests under `fixtures/app-server/v2-jsonrpc/`
- built declaration snapshots for public package API review
- package export validation

Use:

```sh
bun run test:protocol
bun run typecheck
bun run validate:packages
bun run test:api-snapshots
```

If the upstream schema adds methods outside the release surface, keep them generated but do not expose them through high-level React APIs unless the current product plan says so.

## Raw Retention Policy

Core state keeps raw payloads only where they support UI rendering, debug
inspection, docs examples, or host extension points:

- `AgentThread.raw`, `AgentTurn.raw`, `AgentItemState.raw`, and block `raw`
  preserve source protocol data needed to render current transcript items.
- Token usage, status banners, warnings, and protocol notifications keep raw
  payloads for diagnostics but are bounded by the reducer retention policy.
- Command output is retained per item with a maximum character window.
- File patch payloads are retained per turn with a maximum item count.
- Thread registry snapshot arrays are bounded so hydrated history cannot grow
  indefinitely during long sessions.

The policy is implemented in `packages/core/src/retention.ts` and covered by
reducer tests.
