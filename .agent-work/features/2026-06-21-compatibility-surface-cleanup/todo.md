# TODO

## Status Summary

- Overall status: Planned
- Current phase: none
- Blockers: none for planning; implementation should decide whether to stack on PR #33 or split later.
- Last validation: `node .agents/skills/agent-ui-feature-planning/scripts/validate-artifacts.mjs .agent-work/features/2026-06-21-compatibility-surface-cleanup` passed
- Last review: planning self-review completed
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
  - Scope: core state/selectors, Codex server-request normalizer, React approval UI/tests, docs/API snapshots.
  - Expected files/areas: `packages/core/src/state/server-requests.ts`, `packages/core/src/selectors.ts`, `packages/codex/src/normalizers/server-requests.ts`, `packages/codex/test/protocol.test.ts`, `packages/react/src/components/approvals.tsx`, `packages/react/test/components.vitest.tsx`, docs, API snapshots.
  - Validation: focused Codex protocol test, core reducer tests, React component test, `bun run test:api-snapshots`.
  - Review: verify old App Server methods map to current product kinds and no React/core public type still names legacy approval kinds.
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
      - Expected files/areas: Codex normalizer, protocol tests.
      - Validation note: raw fixtures and protocol tests must still pass.
    - [ ] T003 Remove React legacy approval branches and update docs/tests.
      - Expected files/areas: React approvals, docs/reference, docs/guides.
      - Validation note: component tests must assert only current approval kinds.

- [ ] P002 Introduce Agent UI-owned path boundary
  - Goal: keep generated `LegacyAppPathString` out of preferred product APIs and normalize path values through Agent UI-owned types/helpers.
  - Scope: hand-written codex facade/request-builder types, core cwd/thread metadata, React cwd/run-settings public docs, server bridge path docs.
  - Expected files/areas: `packages/codex/src/request-builders.ts`, `packages/codex/src/stable-types.ts`, `packages/codex/src/normalizers/shared.ts`, `packages/core/src/state/*`, `packages/react/src/request-options.ts`, docs and snapshots.
  - Validation: typecheck, API snapshots, package resolution, focused React run-settings tests if declarations change.
  - Review: confirm generated schema remains untouched and `stable-types` generated subpath exception is documented.
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
    - [ ] T004 Choose and define path representation.
      - Expected files/areas: core or codex hand-written type module.
      - Validation note: avoid fake URI strings without parser/formatter rules.
    - [ ] T005 Convert generated path strings at adapter/request-builder boundaries.
      - Expected files/areas: Codex normalizers and request builders.
      - Validation note: generated files remain unchanged.
    - [ ] T006 Update product docs and snapshots.
      - Expected files/areas: docs/reference, API snapshots, examples if needed.
      - Validation note: `LegacyAppPathString` allowed only in generated schema subpath.

- [ ] P003 Contain deprecated protocol fallbacks
  - Goal: keep deprecated notifications and fields as raw/fallback intake only, with tests preventing product lifecycle promotion.
  - Scope: `item/fileChange/outputDelta`, `thread/compacted`, `mcpAppResourceUri`, MCP legacy enum schemas, account rate-limit compatibility view, config legacy source names.
  - Expected files/areas: notification coverage, normalizers, raw fixture tests, protocol docs, possibly server/dynamic tool docs.
  - Validation: `bun run test:protocol`, focused raw fixture tests, typecheck.
  - Review: confirm no deprecated/fallback field becomes default React behavior or host policy.
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
    - [ ] T007 Add explicit tests/docs for deprecated notification raw-only handling.
      - Expected files/areas: protocol tests, docs/reference/codex-protocol.md.
      - Validation note: raw fixture isolation remains intact.
    - [ ] T008 Normalize deprecated fields through current names where applicable.
      - Expected files/areas: MCP/dynamic tool normalizers and tests.
      - Validation note: current field wins over deprecated fallback.
    - [ ] T009 Keep account/config compatibility fields host-only or generated-only.
      - Expected files/areas: docs and protocol metadata tests.
      - Validation note: no new React default UI exposure.

- [ ] P004 Release, docs, and final validation
  - Goal: make the cleanup reviewable and releasable.
  - Scope: changeset, docs, API snapshots, package validation, PR/CI.
  - Expected files/areas: `.changeset/*.md`, docs, `test/api-snapshots/*.d.ts`, PR body/comment.
  - Validation: `bun run validate:fast`, `bun run test:protocol`, `bun run test:api-snapshots`, `bun run test:package-resolution`, `bun run validate:packages`.
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
    - [ ] T010 Add changeset for public API cleanup.
      - Expected files/areas: `.changeset/`.
      - Validation note: package-facing changes require changeset.
    - [ ] T011 Run final validation and update API snapshots intentionally.
      - Expected files/areas: validation logs in TODO evidence, snapshots.
      - Validation note: do not run package build gates in parallel.
    - [ ] T012 Push and follow CI.
      - Expected files/areas: PR and TODO evidence.
      - Validation note: record pass/fail, skipped checks, and residual risk.

## Task Checklist By Phase

### P001 Canonicalize approval kinds

- [ ] T001 Change public pending request kind union to canonical approval kinds only.
  - Expected files/areas: core state, selectors, API snapshots.
  - Validation note: typecheck and core tests must fail before all legacy references are removed.
- [ ] T002 Map `execCommandApproval` and `applyPatchApproval` to canonical kinds.
  - Expected files/areas: Codex normalizer, protocol tests.
  - Validation note: raw fixtures and protocol tests must still pass.
- [ ] T003 Remove React legacy approval branches and update docs/tests.
  - Expected files/areas: React approvals, docs/reference, docs/guides.
  - Validation note: component tests must assert only current approval kinds.

### P002 Introduce Agent UI-owned path boundary

- [ ] T004 Choose and define path representation.
  - Expected files/areas: core or codex hand-written type module.
  - Validation note: avoid fake URI strings without parser/formatter rules.
- [ ] T005 Convert generated path strings at adapter/request-builder boundaries.
  - Expected files/areas: Codex normalizers and request builders.
  - Validation note: generated files remain unchanged.
- [ ] T006 Update product docs and snapshots.
  - Expected files/areas: docs/reference, API snapshots, examples if needed.
  - Validation note: `LegacyAppPathString` allowed only in generated schema subpath.

### P003 Contain deprecated protocol fallbacks

- [ ] T007 Add explicit tests/docs for deprecated notification raw-only handling.
  - Expected files/areas: protocol tests, docs/reference/codex-protocol.md.
  - Validation note: raw fixture isolation remains intact.
- [ ] T008 Normalize deprecated fields through current names where applicable.
  - Expected files/areas: MCP/dynamic tool normalizers and tests.
  - Validation note: current field wins over deprecated fallback.
- [ ] T009 Keep account/config compatibility fields host-only or generated-only.
  - Expected files/areas: docs and protocol metadata tests.
  - Validation note: no new React default UI exposure.

### P004 Release, docs, and final validation

- [ ] T010 Add changeset for public API cleanup.
  - Expected files/areas: `.changeset/`.
  - Validation note: package-facing changes require changeset.
- [ ] T011 Run final validation and update API snapshots intentionally.
  - Expected files/areas: validation logs in TODO evidence, snapshots.
  - Validation note: do not run package build gates in parallel.
- [ ] T012 Push and follow CI.
  - Expected files/areas: PR and TODO evidence.
  - Validation note: record pass/fail, skipped checks, and residual risk.

## Implementation Notes

- Stay on `codex-upstream/64bdeed9f7ad` unless the user asks to split.
- Do not edit generated schema or vendored upstream files.
- Use phase-level commits by default.
- If path migration becomes too broad, split P002 into type-boundary and UI/docs commits.

## Validation Evidence

- Planning artifact validation passed with the feature-planning validator.

## Review Evidence

- Planning self-review checked required sections, same-branch rule, protected-file constraints, phase-first TODO shape, and validation coverage.

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
