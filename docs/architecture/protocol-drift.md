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
- package export validation

Use:

```sh
bun run test:protocol
bun run typecheck
bun run build
```

If the upstream schema adds methods outside the release surface, keep them generated but do not expose them through high-level React APIs unless the current product plan says so.
