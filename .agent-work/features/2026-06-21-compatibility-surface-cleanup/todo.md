# TODO

## Status Summary

- Overall status: Planned
- Current phase: none
- Blockers: none for planning; implementation should decide whether to stack on PR #33 or split later.
- Last validation: `node .agents/skills/agent-ui-feature-planning/scripts/validate-artifacts.mjs .agent-work/features/2026-06-21-compatibility-surface-cleanup` passed
- Last review: Round 1-2 subagent review incorporated; Round 3 all four lanes ready
- PR/CI: current branch already backs draft PR #33; implementation must decide PR handling.

## Branch And Planning Commit

- Branch: `codex-upstream/64bdeed9f7ad`
- Planning commit: pending until planning artifacts are committed
- Remote: `origin`
- Push result: pending until planning commit is pushed
- Blockers: none

## Phase Checklist

- [ ] P001 Canonicalize approval kinds
  - Goal: remove public `legacyExecApproval` and `legacyPatchApproval` kinds while preserving legacy upstream method intake.
  - Scope: core state/selectors, Codex server-request normalizer, legacy approval payload normalization/display, server policy callbacks, React approval UI/tests, raw fixtures, docs/API snapshots.
  - Expected files/areas: `packages/core/src/state/server-requests.ts`, `packages/core/src/selectors.ts`, `packages/codex/src/normalizers/server-requests.ts`, `fixtures/app-server/v2-jsonrpc/`, `fixtures/app-server/v2-jsonrpc/manifest.json`, `packages/codex/test/protocol.test.ts`, `packages/codex/test/raw-jsonrpc-fixtures.test.ts`, `packages/server/test/websocket.test.ts`, `packages/react/src/components/approvals.tsx`, `packages/react/test/components.vitest.tsx`, `docs/guides/approvals.md`, `docs/reference/hooks.md`, `docs/reference/react-components.md`, `docs/reference/codex-protocol.md`, API snapshots.
  - Validation: focused Codex protocol test, raw fixture test, server websocket policy tests, core reducer tests, React component test, `bun run test:api-snapshots`.
  - Review: verify old App Server methods map to current product kinds, server policies still route correctly, legacy payload shape is displayable, and no React/core public type still names legacy approval kinds.
  - Commit: one phase commit.
  - Push: push to `origin/codex-upstream/64bdeed9f7ad`.
  - PR/CI: update PR notes with breaking public API cleanup.
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T001 Change public pending request kind union to canonical approval kinds only.
      - Expected files/areas: core state, selectors, API snapshots.
      - Validation note: typecheck and core tests must fail before all legacy references are removed.
    - [ ] T002 Map `execCommandApproval` and `applyPatchApproval` to canonical kinds.
      - Expected files/areas: Codex normalizer, protocol tests, raw JSONL fixtures, fixture manifest.
      - Validation note: raw fixtures and protocol tests must prove upstream legacy methods normalize to canonical public kinds.
    - [ ] T003 Remove React legacy approval branches and update docs/tests.
      - Expected files/areas: React approvals, docs/reference, docs/guides.
      - Validation note: component tests must assert only current approval kinds; docs must describe legacy upstream methods as compatibility inputs.
    - [ ] T004 Cover legacy approval payload and server policy behavior.
      - Expected files/areas: `packages/react/src/components/approvals.tsx`, `packages/server/test/websocket.test.ts`, server request policy tests.
      - Validation note: array commands render sensibly, `conversationId` can populate missing `threadId`, and legacy upstream methods still hit command/file policy callbacks.

- [ ] P002 Introduce Agent UI-owned path boundary
  - Goal: keep generated `LegacyAppPathString` out of preferred product APIs and normalize path values through Agent UI-owned types/helpers.
  - Scope: hand-written codex request-builder/product input types, generated-backed facade docs, core cwd/thread metadata, React cwd/resource public docs, server upload/path docs.
  - Expected files/areas: `packages/codex/src/path-types.ts`, `packages/codex/src/request-builders.ts`, `packages/codex/src/index.ts`, `packages/codex/src/stable-types.ts`, `packages/codex/src/clients.ts`, `packages/codex/src/session.ts`, `packages/codex/src/auth.ts`, `packages/codex/src/normalizers/shared.ts`, `packages/react/src/request-options.ts`, `packages/react/src/agent-input.ts`, `packages/react/src/resources.ts`, `packages/react/src/thread-history.ts`, `packages/server/src/upload.ts`, docs and snapshots.
  - Validation: typecheck, API snapshots, package resolution, Codex public-surface/session/type tests, React source-structure/thread-history tests, server upload tests.
  - Review: confirm generated schema remains untouched, `stable-types` generated subpath exception is documented, and `clients`/`session` result types are classified as generated-backed advanced facades.
  - Commit: one phase commit unless path object migration proves too broad.
  - Push: push after validation/review.
  - PR/CI: document public path API impact and host-owned path authority.
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T005 Choose and define low-churn path aliases.
      - Expected files/areas: `packages/codex/src/path-types.ts` or equivalent hand-written module.
      - Validation note: use string aliases such as `AgentLocalPath`; avoid fake URI strings, object wrappers, or opaque brands without runtime guarantees.
    - [ ] T006 Convert generated path strings at adapter/request-builder boundaries.
      - Expected files/areas: Codex normalizers and request builders.
      - Validation note: generated files remain unchanged.
    - [ ] T007 Add path public-surface guards.
      - Expected files/areas: `packages/codex/test/public-surface.test.ts`, `packages/react/test/source-structure.vitest.ts`, API snapshots.
      - Validation note: disallow `LegacyAppPathString` / `AbsolutePathBuf` in preferred product declarations; allow generated stable-types and explicitly generated-backed result snapshots.
    - [ ] T008 Update product docs, examples evidence, and snapshots.
      - Expected files/areas: `docs/reference/package-exports.md`, `docs/reference/codex-protocol.md`, `docs/reference/react-components.md`, `docs/reference/server-bridge.md`, `docs/guides/attachments.md`, examples if imports change.
      - Validation note: document generated-only exception and generated-backed clients/session result types.

- [ ] P003 Contain deprecated protocol fallbacks
  - Goal: keep deprecated notifications and fields as raw/fallback intake only, with tests preventing product lifecycle promotion.
  - Scope: `item/fileChange/outputDelta`, `thread/compacted`, `mcpAppResourceUri`, MCP legacy enum schemas, account rate-limit compatibility views, status formatting fallbacks, config legacy source names, deprecated model fields.
  - Expected files/areas: notification coverage, item/server-request normalizers, raw fixture tests, protocol docs, React usage/status formatting tests, source-structure guards.
  - Validation: `bun run test:protocol`, focused raw fixture tests, React usage/status-formatting/source-structure tests, typecheck.
  - Review: confirm no deprecated/fallback field becomes default React behavior or host policy; `item/fileChange/outputDelta` stays mapped compatibility fallback, not raw.
  - Commit: one phase commit.
  - Push: push after validation/review.
  - PR/CI: explain residual protocol compatibility accepted at adapter boundary.
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T009 Add explicit tests/docs for deprecated notification fallback handling.
      - Expected files/areas: protocol tests, docs/reference/codex-protocol.md.
      - Validation note: raw fixture isolation remains intact; `item/fileChange/outputDelta` stays mapped compatibility fallback.
    - [ ] T010 Normalize deprecated fields through current names where applicable.
      - Expected files/areas: MCP/dynamic tool normalizers and tests.
      - Validation note: current field wins over deprecated fallback.
    - [ ] T011 Keep account/config/model compatibility fields generated-only or view-adapter-only.
      - Expected files/areas: `packages/react/src/usage.ts`, `packages/react/src/components/status-formatting.ts`, docs, protocol metadata tests.
      - Validation note: rate-limit compatibility stays React view adapter; no new core raw schema promise.
    - [ ] T012 Add deprecated-name source-structure guards.
      - Expected files/areas: `packages/react/test/source-structure.vitest.ts`, API snapshots.
      - Validation note: guard core/react declarations against `mcpAppResourceUri`, `McpElicitationLegacyTitledEnumSchema`, `additionalSpeedTiers`, `legacyManagedConfig*`, raw rate-limit compatibility names, and path legacy names; exempt generated stable-types.

- [ ] P004 Release, docs, and final validation
  - Goal: make the cleanup reviewable and releasable.
  - Scope: changeset, docs, API snapshots, package validation, PR/CI.
  - Expected files/areas: `.changeset/*.md`, docs, `test/api-snapshots/*.d.ts`, PR body/comment.
  - Validation: `bun run validate:fast`, `bun run test:protocol`, `bun run build`, `bun run test:api-snapshots`, `bun run test:package-resolution`, `bun run validate:packages`, `bun run validate:release`.
  - Review: independent review or fresh-context self-review before final push.
  - Commit: final cleanup commit if docs/changeset/snapshots were not covered earlier.
  - Push: push final branch head.
  - PR/CI: inspect GitHub Actions to concrete pass/fail.
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T013 Decide PR stacking strategy.
      - Expected files/areas: PR body/comment, TODO evidence.
      - Validation note: prefer schema-only PR #33 then follow-up cleanup PR; if stacked, retitle/rewrite PR scope.
    - [ ] T014 Add changeset for public API cleanup.
      - Expected files/areas: `.changeset/`.
      - Validation note: default to major for core/react/codex when public union members or normalizer output are removed/renamed, unless a pre-1.0 minor policy is explicitly chosen.
    - [ ] T015 Run final sweeps, validation, and API snapshots intentionally.
      - Expected files/areas: validation logs in TODO evidence, snapshots.
      - Validation note: build before API snapshots, update snapshots intentionally after reviewing diff, run final `validate:release`, and run `rg` sweeps for compatibility names with generated exceptions.
    - [ ] T016 Push and follow CI.
      - Expected files/areas: PR and TODO evidence.
      - Validation note: record pass/fail, skipped checks, and residual risk.

## Task Checklist By Phase

### P001 Canonicalize approval kinds

- [ ] T001 Change public pending request kind union to canonical approval kinds only.
  - Expected files/areas: core state, selectors, API snapshots.
  - Validation note: typecheck and core tests must fail before all legacy references are removed.
- [ ] T002 Map `execCommandApproval` and `applyPatchApproval` to canonical kinds.
  - Expected files/areas: Codex normalizer, protocol tests, raw JSONL fixtures, fixture manifest.
  - Validation note: raw fixtures and protocol tests must prove upstream legacy methods normalize to canonical public kinds.
- [ ] T003 Remove React legacy approval branches and update docs/tests.
  - Expected files/areas: React approvals, docs/reference, docs/guides.
  - Validation note: component tests must assert only current approval kinds; docs must describe legacy upstream methods as compatibility inputs.
- [ ] T004 Cover legacy approval payload and server policy behavior.
  - Expected files/areas: `packages/react/src/components/approvals.tsx`, `packages/server/test/websocket.test.ts`, server request policy tests.
  - Validation note: array commands render sensibly, `conversationId` can populate missing `threadId`, and legacy upstream methods still hit command/file policy callbacks.

### P002 Introduce Agent UI-owned path boundary

- [ ] T005 Choose and define low-churn path aliases.
  - Expected files/areas: `packages/codex/src/path-types.ts` or equivalent hand-written module.
  - Validation note: use string aliases such as `AgentLocalPath`; avoid fake URI strings, object wrappers, or opaque brands without runtime guarantees.
- [ ] T006 Convert generated path strings at adapter/request-builder boundaries.
  - Expected files/areas: Codex normalizers and request builders.
  - Validation note: generated files remain unchanged.
- [ ] T007 Add path public-surface guards.
  - Expected files/areas: `packages/codex/test/public-surface.test.ts`, `packages/react/test/source-structure.vitest.ts`, API snapshots.
  - Validation note: disallow `LegacyAppPathString` / `AbsolutePathBuf` in preferred product declarations; allow generated stable-types and explicitly generated-backed result snapshots.
- [ ] T008 Update product docs, examples evidence, and snapshots.
  - Expected files/areas: `docs/reference/package-exports.md`, `docs/reference/codex-protocol.md`, `docs/reference/react-components.md`, `docs/reference/server-bridge.md`, `docs/guides/attachments.md`, examples if imports change.
  - Validation note: document generated-only exception and generated-backed clients/session result types.

### P003 Contain deprecated protocol fallbacks

- [ ] T009 Add explicit tests/docs for deprecated notification fallback handling.
  - Expected files/areas: protocol tests, docs/reference/codex-protocol.md.
  - Validation note: raw fixture isolation remains intact; `item/fileChange/outputDelta` stays mapped compatibility fallback.
- [ ] T010 Normalize deprecated fields through current names where applicable.
  - Expected files/areas: MCP/dynamic tool normalizers and tests.
  - Validation note: current field wins over deprecated fallback.
- [ ] T011 Keep account/config/model compatibility fields generated-only or view-adapter-only.
  - Expected files/areas: `packages/react/src/usage.ts`, `packages/react/src/components/status-formatting.ts`, docs, protocol metadata tests.
  - Validation note: rate-limit compatibility stays React view adapter; no new core raw schema promise.
- [ ] T012 Add deprecated-name source-structure guards.
  - Expected files/areas: `packages/react/test/source-structure.vitest.ts`, API snapshots.
  - Validation note: guard core/react declarations against `mcpAppResourceUri`, `McpElicitationLegacyTitledEnumSchema`, `additionalSpeedTiers`, `legacyManagedConfig*`, raw rate-limit compatibility names, and path legacy names; exempt generated stable-types.

### P004 Release, docs, and final validation

- [ ] T013 Decide PR stacking strategy.
  - Expected files/areas: PR body/comment, TODO evidence.
  - Validation note: prefer schema-only PR #33 then follow-up cleanup PR; if stacked, retitle/rewrite PR scope.
- [ ] T014 Add changeset for public API cleanup.
  - Expected files/areas: `.changeset/`.
  - Validation note: default to major for core/react/codex when public union members or normalizer output are removed/renamed, unless a pre-1.0 minor policy is explicitly chosen.
- [ ] T015 Run final sweeps, validation, and API snapshots intentionally.
  - Expected files/areas: validation logs in TODO evidence, snapshots.
  - Validation note: build before API snapshots, update snapshots intentionally after reviewing diff, run final `validate:release`, and run `rg` sweeps for compatibility names with generated exceptions.
- [ ] T016 Push and follow CI.
  - Expected files/areas: PR and TODO evidence.
  - Validation note: record pass/fail, skipped checks, and residual risk.

## Implementation Notes

- Stay on `codex-upstream/64bdeed9f7ad` unless the user asks to split.
- Do not edit generated schema or vendored upstream files.
- Use phase-level commits by default.
- If path migration becomes too broad, split P002 into type-boundary and UI/docs commits.
- Keep `packages/codex/src/generated/**`, `third_party/codex`, and generated stable-type snapshots as exceptions for upstream schema names.
- If cleanup remains stacked on PR #33, update the PR scope before asking for review.

## Validation Evidence

- Planning artifact validation passed with the feature-planning validator.

## Review Evidence

- Planning self-review checked required sections, same-branch rule, protected-file constraints, phase-first TODO shape, and validation coverage.
- Round 1-2 subagents reviewed approval, path, deprecated/fallback, and release/package lanes; deltas were incorporated.
- Round 3 final artifact review found no blocking omissions or contradictions: approval lane ready, path lane ready, deprecated fallback lane ready, release lane ready.

## Commit Log

- Pending planning commit.

## Final Checklist

- [ ] Every phase is complete or explicitly deferred.
- [ ] Every task in completed phases is complete or explicitly skipped with a reason.
- [ ] Every completion criterion in `plan.md` is satisfied.
- [ ] Required validation passed or an explicit user-approved exception is recorded.
- [ ] Review evidence is recorded.
- [ ] Branch, planning commit, remote, push result, and blockers are recorded.
- [ ] Commit hashes are recorded for completed phases.
