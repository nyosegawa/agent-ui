# Protocol Drift

Codex App Server schema can change. Agent UI treats drift as expected
maintenance, not as an exceptional event. Productized, host-managed,
experimental, and unsupported protocol surfaces must stay aligned with
[Product Boundary](./product-boundary.md).

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

1. Inspect the checked-in upstream Codex submodule at `third_party/codex`.
2. Run `bun --filter @nyosegawa/agent-ui-codex generate:schema`.
   The script reads only `third_party/codex`; it does not fall back to a
   personal checkout or environment variable. Before generation it validates
   `codex-rs/app-server` and
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

## Raw Boundary Policy

Agent UI separates user-facing public surfaces from protocol and diagnostic
edges. The raw-free requirement applies to default user, controller,
view-model, and primitive surfaces. Raw protocol-shaped values are allowed only
at explicit boundary surfaces:

- `AgentTransport` and JSON-RPC transport plumbing, where arbitrary request
  params and results are the point of the abstraction.
- `@nyosegawa/agent-ui-codex` protocol adapters, generated stable types on the
  `stable-types` subpath, request builders, normalizers, and low-level clients.
  Experimental generated shapes remain adapter/internal or explicit
  experimental-client detail unless a future export gate promotes a documented
  experimental subpath.
- diagnostics, warnings, and protocol notification records that are bounded and
  audience-filtered. Raw protocol notification params are developer/audit
  diagnostics, not user-facing display data; hosts must not treat them as
  redacted output until an explicit redacted projection exists.
- `@nyosegawa/agent-ui-server` host-policy callbacks, dynamic-tool callbacks,
  server-request policy callbacks, and bridge diagnostics, where hosts make
  explicit runtime and audit decisions.

Everything else should expose stable Agent UI view models and controller
methods. React root, `/headless`, and `/primitives` should not ask hosts to
inspect generated protocol payloads, raw reducer state, `unknown` server
request payloads, or internal reconciliation maps.

## Raw Retention Policy

Reducer-internal thread, turn, item, token-usage, and block state may retain
bounded protocol-derived data while it is being normalized into public views.
Codex normalizers must project protocol payloads into Agent UI metadata,
lifecycle status, transcript blocks, diagnostics, or resource objects before
they cross the default public user/controller/view-model boundary:

- Thread lifecycle exposes closed Agent UI status/activity fields rather than
  arbitrary App Server status strings.
- Transcript items and blocks preserve renderable command, file-change, tool,
  image, and system-info fields without exposing generated payloads.
- Status banners, warnings, and protocol notifications may keep raw payloads for
  diagnostics, but those diagnostics are bounded by the reducer retention policy
  and audience-filtered before user display.
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

## Public Raw-Debt Gate

The current package surface still contains known raw-debt while the architecture
redesign is in progress. That debt is intentional only as an implementation
queue, not as a stable design:

- core root declarations still expose raw normalized store shapes such as
  `AgentSessionState`, `ThreadState`, `AgentItemBlock`, and
  `PendingServerRequest.payload`.
- React headless/primitives still expose `ThreadState` and
  `PendingServerRequest` in selected declarations.
- transcript declarations still derive their block view from `AgentItemBlock`.

`packages/react/test/source-structure.vitest.ts` fixes those known declaration
leaks to an exact allowlist so new raw public surface cannot be added while the
redesign proceeds. Follow-up phases must delete entries from that allowlist as
core view models, React controllers, and approval views replace the old
contracts.
