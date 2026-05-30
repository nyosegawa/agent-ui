# Protocol Drift

Codex App Server schema can change. Agent UI treats drift as expected maintenance, not as an exceptional event.

## Recorded Metadata

`@nyosegawa/agent-ui-codex` records:

- upstream Codex commit
- generated timestamp
- generator command
- stable and experimental generated schema files
- generated-schema-derived capability metadata split into `stableAvailable`,
  `stableProductized`, `experimentalAvailable`, `experimentalUnsupported`,
  and `hostOnly`

The generated schema lives under `packages/codex/src/generated`.
`packages/codex/src/generated/README.md` records the exact upstream commit,
commit date, subject, generated timestamp, and generator command for the
checked-in artifact.

## Update Flow

1. Inspect the upstream Codex checkout you intend to import from.
2. Run
   `CODEX_REPO=<codex-checkout> bun --filter @nyosegawa/agent-ui-codex generate:schema`.
   `CODEX_REPO` is required; the script does not fall back to a personal path.
   Before generation it validates `codex-rs/app-server` and
   `codex-rs/app-server-protocol`, rejects dirty focused paths, captures the
   upstream HEAD/date/subject, and generates into temporary directories before
   replacing the checked-in schema tree.
3. Review generated stable and experimental diffs.
4. Confirm the generated metadata changes. The generation script updates
   `CODEX_PROTOCOL_COMMIT`, `CODEX_PROTOCOL_GENERATED_AT`,
   `packages/codex/package.json` `agentUi`, and
   `packages/codex/src/generated/README.md` from the same captured upstream
   record.
5. Do not hand-edit generated metadata unless the import script itself is wrong.
6. Update `packages/codex/src/protocol.ts` capability classifications when the
   generated method surface changes. Generated method lists live in
   `packages/codex/src/generated/protocol-capabilities.ts`; productized,
   host-only, and unsupported policy overlays stay handwritten in
   `protocol.ts`.
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
- File patch payloads are retained per turn with a maximum item count. Evicting
  a synthetic patch-only body also removes that ID from `turn.itemOrder`; IDs
  with authored item state, streaming text, command output, or transcript blocks
  remain visible even if their heavy patch body falls out of the retention
  window.
- App connector results are retained per scope with a maximum scope count.
  Thread-scoped app result maps cannot grow indefinitely across long-running
  browsing sessions.
- Skill and hook results are retained per cwd with maximum cwd-entry counts so
  host cwd switching cannot grow the backing maps indefinitely.
- Thread registry snapshot retention bounds both the registry ID arrays and the
  backing `state.threads` entity map, so hydrated history cannot grow
  indefinitely during long sessions. Cold, preview, and stale loaded snapshots
  that fall out of the bounded registry windows are evicted from `state.threads`.
  Active threads, live threads, and threads referenced by pending server
  requests are retained because they may still be visible, resumable, or needed
  for approval anchoring.

The policy is implemented in `packages/core/src/retention.ts` and store-specific
bounded update helpers. Reducer tests assert both index lengths and backing map
sizes.
