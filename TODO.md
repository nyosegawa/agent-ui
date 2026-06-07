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

- [x] Add public `AgentThreadStartWithInputOptions` with `threadOptions` and
  `turnOptions`.
- [x] Update `AgentComposerController.startThreadWithInput()` to accept options.
- [x] Thread options through internal `startWithMessage()` without exposing raw
  App Server params or responses.
- [x] Merge `turnOptions` after execution-mode defaults for first-turn
  `turn/start`.
- [x] Preserve `clientUserMessageId` and canonical thread reconciliation.
- [x] Store first-message retry payloads with both thread and turn options.
- [x] Return stable first-turn metadata: `threadId`, `operationId`, `turnId`,
  and `userMessageId`.
- [x] Add tests for first-turn thread options, turn options, merge order, and
  canonical id usage.
- [x] Add first-turn `localImage` coverage.

Evidence:

- `packages/react/src/hooks/thread-lifecycle-types.ts` defines
  `AgentThreadStartWithInputOptions` and richer
  `AgentThreadStartWithInputResult`.
- `packages/react/src/hooks/composer.ts` passes public `threadOptions` and
  `turnOptions` through first-message start, merges turn options after
  execution-mode defaults, and returns operation/thread/turn/user-message ids.
- `packages/react/src/hooks/first-message-operations.ts` persists
  `turnOptions` in first-message retry payloads and reuses them for retry.
- `packages/react/test/components.vitest.tsx` covers thread options, turn
  option precedence, canonical thread id use, returned metadata, and first-turn
  `localImage`.
- `docs/reference/hooks.md`, `docs/reference/package-exports.md`, and
  `docs/guides/host-integration.md` describe the new public first-turn
  signature and raw-free metadata.
- Validation: `bun vitest run --config vitest.config.ts --environment jsdom
  packages/react/test/components.vitest.tsx`; `bun run --cwd packages/react
  typecheck`; `bun run typecheck`; `bun run lint`; `bun run build`; `bun run
  test:api-snapshots:update`; `bun run test:api-snapshots`; `bunx vitest run
  test/docs-staleness.test.ts`.

## Canonical Resume Diagnostics

- [x] Define stable resume diagnostic reason codes.
- [x] Emit a diagnostic when requested and canonical thread ids differ.
- [x] Emit a diagnostic when resume response normalization fails.
- [x] Keep diagnostics redacted and raw-free.
- [x] Add reducer/React tests for resume diagnostics.

Evidence:

- `packages/core/src/state/diagnostics.ts` defines typed
  `AgentThreadResumeDiagnosticReasonCode` / `AgentDiagnosticReasonCode` and
  preserves structured requested/canonical thread ids on warning diagnostics.
- `packages/react/src/hooks/thread-lifecycle-types.ts` re-exports
  `AgentThreadResumeDiagnosticReasonCode` for React hook consumers.
- `packages/react/src/hooks/thread.ts` emits developer/audit diagnostics for
  `canonical_thread_id_mismatch`, `resume_response_missing_thread_id`, and
  `resume_response_normalization_failed` without storing raw responses, alias
  maps, or reducer internals.
- `packages/react/test/components.vitest.tsx` covers canonical mismatch,
  normalization failure, audience filtering, and raw-free diagnostic contents.
- `packages/react/test/thread-resume-diagnostics.vitest.tsx` covers
  `resume_response_normalization_failed` when a canonical id is known before
  normalization throws.
- `packages/core/test/reducer.test.ts` covers reducer retention of structured
  diagnostic fields and audience filtering.
- Validation: `bun vitest run --config vitest.config.ts --environment jsdom
  packages/react/test/components.vitest.tsx
  packages/react/test/thread-resume-diagnostics.vitest.tsx`; `bun vitest run
  --config vitest.config.ts packages/core/test/reducer.test.ts`; `bun run --cwd
  packages/react typecheck`; `bun run --cwd packages/core typecheck`; `bun run
  build`; `bun run test:api-snapshots:update`; `bun run test:api-snapshots`;
  `bun run lint`; `bun run typecheck`.

## Server Bridge Admission And Rejection

- [x] Add structured bridge rejection/result types.
- [x] Allow resolver rejection to carry status, body, close code, and reason.
- [x] Allow admission callbacks to return structured accept/reject decisions.
- [x] Rework `attachAgentUiWebSocketBridge()` to evaluate resolver/admission
  before upgrade and send host-controlled HTTP status/body.
- [x] Keep `handleAgentUiWebSocketConnection()` usable for already-upgraded
  manual hosts.
- [x] Add bridge health event reason codes for rejection and resolver failures.
- [x] Prove rejected resolver/admission paths never spawn Codex.
- [x] Add HTTP `403` and `409` bridge rejection tests.
- [x] Update server API snapshots.

Evidence:

- `packages/server/src/websocket.ts` defines structured bridge rejection/result
  and admission decision types, lets option resolvers and host admission
  callbacks return host-controlled rejection metadata, and evaluates
  resolver/admission before `attachAgentUiWebSocketBridge()` upgrades the HTTP
  request.
- `packages/server/src/websocket.ts` keeps
  `handleAgentUiWebSocketConnection()` compatible with already-upgraded manual
  hosts by translating the same structured rejection to WebSocket close
  code/reason.
- `packages/server/src/host-events.ts` adds the `rejected` health phase and
  stable `reasonCode` field for developer/audit health events.
- `packages/server/test/websocket.test.ts` covers pre-upgrade HTTP `403` and
  `409` resolver/admission rejections, rejected no-spawn paths, reason-coded
  health events, redacted resolver/admission failures, and the already-upgraded
  manual host close path.
- `docs/reference/server-bridge.md` and `docs/reference/package-exports.md`
  document the structured rejection API, HTTP-versus-WebSocket rejection
  behavior, health reason codes, and host-owned boundary.
- Validation: `bun vitest run --config vitest.config.ts
  packages/server/test/websocket.test.ts`; `bun run --cwd packages/server
  typecheck`; `bun run test:api-snapshots:update`; `bun run
  test:api-snapshots`; `bunx vitest run test/docs-staleness.test.ts`; `bun
  run lint`; `bun run typecheck`; `bun run validate:packages`; `git diff
  --check`.

## WebSocket Token Subprotocol

- [x] Add browser helper for bearer subprotocol construction.
- [x] Add server parser for bearer subprotocol extraction.
- [x] Reject malformed or mismatched subprotocol tokens safely.
- [x] Add redaction tests for bearer subprotocol diagnostics.
- [x] Update bridge recipes to avoid impossible browser custom headers.
- [x] Document when to use cookies, server-side exchange, or subprotocol tokens.

Evidence:

- `packages/codex/src/websocket-transport.ts` exports
  `createAgentUiBearerSubprotocol()` for browser-safe WebSocket protocol
  construction without query-string tokens or custom headers.
- `packages/server/src/websocket.ts` exports
  `parseAgentUiBearerSubprotocol()` and `verifyAgentUiBearerSubprotocol()` for
  host-callback admission, with stable rejection reason codes for missing,
  malformed, and mismatched tokens.
- `packages/server/src/redaction.ts` redacts encoded `agent-ui-bearer.*`
  values before diagnostics or host logs can preserve the browser token form.
- `packages/codex/test/websocket-transport.vitest.ts`,
  `packages/server/test/websocket.test.ts`, and
  `packages/server/test/redaction.test.ts` cover helper construction, parser
  failure modes, no-spawn admission rejection, and subprotocol redaction.
- `examples/recipes/src/websocket-remote-demo.tsx` uses the bearer subprotocol
  helper for optional short-lived bridge tokens, and
  `examples/recipes/src/bridge-policy.ts` parses the subprotocol server-side
  instead of expecting browser custom headers.
- `docs/reference/server-bridge.md`, `docs/guides/remote-deployment.md`,
  `docs/reference/codex-protocol.md`, `docs/reference/package-exports.md`, and
  `examples/recipes/README.md` document cookies, reverse-proxy/server-side
  exchange, and bearer subprotocol tradeoffs.
- Validation: `bun vitest run --config vitest.config.ts
  packages/codex/test/websocket-transport.vitest.ts
  packages/server/test/websocket.test.ts packages/server/test/redaction.test.ts`;
  `bun run --cwd packages/codex typecheck`; `bun run --cwd packages/server
  typecheck`; `bun run --cwd examples/recipes typecheck`; `bun run
  test:api-snapshots:update`; `bun run test:api-snapshots`; `bunx vitest run
  test/docs-staleness.test.ts`; `bun run lint`; `bun run typecheck`; `bun run
  validate:packages`.

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

- [x] Run targeted React/controller tests.
- [x] Run targeted server websocket tests.
- [ ] Run `bun run test:protocol`.
- [ ] Run `bun run test:fixtures`.
- [x] Run `bun run --cwd examples/recipes typecheck`.
- [ ] Run `bun run test:skills`.
- [x] Update and review API snapshots.
- [ ] Run `bun run validate:fast`.
- [ ] Run `bun run validate:protocol`.
- [ ] Run `bun run validate:packages`.
- [ ] Run `bun run test:package-resolution`.
- [ ] Run relevant Playwright fixture or real-local browser specs.
