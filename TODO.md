# Host Integration Contract TODO

## Investigation

- [x] Read repository boundary docs and validation matrix.
- [x] Inspect React first-turn, thread lifecycle, run settings, retry, and
  canonical resume implementation.
- [x] Inspect server bridge resolver, admission, rejection, health event, and
  test coverage.
- [x] Inspect docs, examples, installation requirements, local media fallback,
  and `skills/agent-ui`.
- [x] Inspect upstream Codex App Server app-server protocol and runtime behavior
  without editing `third_party/codex`.
- [x] Decide whether additional subagents are needed after the first four
  investigations.
- [x] Create planning branch.
- [x] Write `PLAN.md` with findings, design decisions, implementation slices,
  validation plan, and non-goals.

## React First-Turn Contract

- [ ] Add public `AgentThreadStartWithInputOptions` with `threadOptions` and
  `turnOptions`.
- [ ] Update `AgentComposerController.startThreadWithInput()` to accept options.
- [ ] Thread options through internal `startWithMessage()` without exposing raw
  App Server params or responses.
- [ ] Merge `turnOptions` after execution-mode defaults for first-turn
  `turn/start`.
- [ ] Preserve `clientUserMessageId` and canonical thread reconciliation.
- [ ] Store first-message retry payloads with both thread and turn options.
- [ ] Return stable first-turn metadata: `threadId`, `operationId`, `turnId`,
  and `userMessageId`.
- [ ] Add tests for first-turn thread options, turn options, merge order, and
  canonical id usage.
- [ ] Add first-turn `localImage` coverage.

## Canonical Resume Diagnostics

- [ ] Define stable resume diagnostic reason codes.
- [ ] Emit a diagnostic when requested and canonical thread ids differ.
- [ ] Emit a diagnostic when resume response normalization fails.
- [ ] Keep diagnostics redacted and raw-free.
- [ ] Add reducer/React tests for resume diagnostics.

## Server Bridge Admission And Rejection

- [ ] Add structured bridge rejection/result types.
- [ ] Allow resolver rejection to carry status, body, close code, and reason.
- [ ] Allow admission callbacks to return structured accept/reject decisions.
- [ ] Rework `attachAgentUiWebSocketBridge()` to evaluate resolver/admission
  before upgrade and send host-controlled HTTP status/body.
- [ ] Keep `handleAgentUiWebSocketConnection()` usable for already-upgraded
  manual hosts.
- [ ] Add bridge health event reason codes for rejection and resolver failures.
- [ ] Prove rejected resolver/admission paths never spawn Codex.
- [ ] Add HTTP `403` and `409` bridge rejection tests.
- [ ] Update server API snapshots.

## WebSocket Token Subprotocol

- [ ] Add browser helper for bearer subprotocol construction.
- [ ] Add server parser for bearer subprotocol extraction.
- [ ] Reject malformed or mismatched subprotocol tokens safely.
- [ ] Add redaction tests for bearer subprotocol diagnostics.
- [ ] Update bridge recipes to avoid impossible browser custom headers.
- [ ] Document when to use cookies, server-side exchange, or subprotocol tokens.

## Local Media Fallback

- [ ] Add transcript image fallback tests when a returned URL fails to load.
- [ ] Add transcript video fallback tests when a returned URL fails to load.
- [ ] Document host route `403` and `404` fallback behavior explicitly.
- [ ] Keep raw filesystem paths out of browser preview URLs.

## Host-Gated Workflow Recipe

- [ ] Add typed recipe source for `AgentThreadTimeline` plus host approval bar
  plus delayed composer.
- [ ] Use `startThreadWithInput(input, { threadOptions, turnOptions })` in the
  recipe.
- [ ] Show plan/update-driven host gate without moving gate state into core.
- [ ] Add docs cross-links from recipe docs and host integration docs.
- [ ] Add focused fixture coverage if browser-visible behavior changes.

## Docs, Examples, And Skills

- [ ] Update `docs/reference/hooks.md`.
- [ ] Update `docs/reference/server-bridge.md`.
- [ ] Update `docs/guides/host-integration.md`.
- [ ] Update `docs/guides/attachments.md`.
- [ ] Update `docs/installation.md` with Node `>=22`.
- [ ] Update `docs/getting-started.md` with Node `>=22`.
- [ ] Update `docs/examples/recipes.md`.
- [ ] Update `skills/agent-ui/SKILL.md` for first-turn options, bridge
  admission, token subprotocols, local media fallback, and no obsolete slot
  language.

## Validation

- [ ] Run targeted React/controller tests.
- [ ] Run targeted server websocket tests.
- [ ] Run `bun run test:protocol`.
- [ ] Run `bun run test:fixtures`.
- [ ] Run `bun run --cwd examples/recipes typecheck`.
- [ ] Run `bun run test:skills`.
- [ ] Update and review API snapshots.
- [ ] Run `bun run validate:fast`.
- [ ] Run `bun run validate:protocol`.
- [ ] Run `bun run validate:packages`.
- [ ] Run `bun run test:package-resolution`.
- [ ] Run relevant Playwright fixture or real-local browser specs.
