# Agent UI Refactoring Strategy

This strategy is complete.

Agent UI now treats the Codex App Server protocol, package export maps, server
bridge security rules, bounded state retention policy, transcript-first React
UX, and validation ladder as ordinary repository practice. The ongoing rules
live in `AGENTS.md` and the current docs under `docs/`.

## Completed Scope

- Raw Codex App Server JSON-RPC fixture pack lives under
  `fixtures/app-server/v2-jsonrpc/` with a manifest that records upstream
  commit, source reference, method coverage, and purpose for every fixture.
- Parser, normalizer, and reducer tests read those raw JSON-RPC lines directly,
  so fixture coverage no longer depends only on normalized `AgentEvent` files.
- Core state has an explicit retention policy for diagnostics, warnings, raw
  notifications, command output, file patches, and thread registry snapshots.
  Thread snapshot retention bounds both registry ID arrays and the backing
  `state.threads` entity map.
- `AgentTransport.request()` accepts optional `trace`, `AbortSignal`, and
  timeout options. Stdio, WebSocket, and browser bridge paths preserve
  top-level JSON-RPC trace data and clean pending requests on abort, timeout,
  close, and disconnect.
- Browser-to-bridge WebSocket input is bounded by parse-before size checks and
  per-connection rate limits with documented close behavior.
- Codex App Server child shutdown waits after `SIGTERM` and escalates after the
  configured grace period while transport close rejects pending requests.
- Local uploads use per-session temp directories, method/content-type and
  malformed-header validation, size limits, TTL cleanup, and explicit cleanup
  hooks while preserving arbitrary sanitized extensions.
- Redaction applies to stderr, structured host event sinks, and browser-forwarded
  transport event envelopes.
- Approval rendering anchors pending decisions immediately after the source
  item or turn when App Server metadata is available, with transcript-tail
  fallback only for metadata-free requests.
- Shared menu behavior closes on Escape and outside click, keeps focus return,
  supports arrow/Home/End navigation, and does not close due to internal scroll.
- Execution mode controls use radiogroup semantics consistently.
- Generated `CodexStable` types are classified as an advanced public surface at
  `@nyosegawa/agent-ui-codex/stable-types`; the package root remains the stable
  productized facade.

## Permanent Gates

Use the current validation ladder in `docs/architecture/testing.md`. Package
build, `publint`, and `arethetypeswrong` stay ordered behind
`bun run validate:packages`.

The real local web layout gate remains separate from deterministic fixture
Playwright coverage and must run against an explicitly started
`examples/codex-local-web` server on port `5175` when bridge-backed behavior or
layout changes.
