# TODO

## Status Summary

- Overall status: In progress
- Current phase: P002
- Blockers: none for planning; implementation stays on this branch and must rewrite PR #33 scope if cleanup is stacked there.
- Last validation: `node .agents/skills/agent-ui-feature-planning/scripts/validate-artifacts.mjs .agent-work/features/2026-06-21-compatibility-surface-cleanup` passed after supplemental Round 4.
- Last review: Round 1-3 compatibility review incorporated; supplemental Round 4 skills/docs/examples/release review incorporated.
- PR/CI: current branch backs draft PR #33; implementation should retitle/rewrite it for schema refresh plus compatibility cleanup.

## Branch And Planning Commit

- Branch: `codex-upstream/64bdeed9f7ad`
- Planning commit: `ef0b358`, `27f3a31`, plus supplemental Round 4 commit reported by the final planning run.
- Remote: `origin`
- Push result: `27f3a31` pushed; supplemental Round 4 commit to be pushed by this planning run.
- Blockers: none

## Phase Checklist

- [x] P001 Canonicalize approval kinds
  - Goal: remove public `legacyExecApproval` and `legacyPatchApproval` kinds while preserving legacy upstream method intake.
  - Scope: core state/selectors, Codex server-request normalizer, legacy approval payload normalization/display, server policy callbacks, React approval UI/tests, raw fixtures, docs/API snapshots.
  - Expected files/areas: `packages/core/src/state/server-requests.ts`, `packages/core/src/selectors.ts`, `packages/core/test/public-surface.test.ts`, `packages/core/test/source-structure.test.ts`, `packages/codex/src/normalizers/server-requests.ts`, `fixtures/app-server/v2-jsonrpc/`, `packages/codex/test/protocol.test.ts`, `packages/codex/test/raw-jsonrpc-fixtures.test.ts`, `packages/server/test/websocket.test.ts`, `packages/react/src/components/approvals.tsx`, `packages/react/test/components.vitest.tsx`, approval docs, API snapshots.
  - Validation: focused Codex protocol/raw fixture tests, server websocket policy tests, core reducer/public-surface/source-structure tests, React component test, `bun run test:api-snapshots`.
  - Review: verify old App Server methods map to current product kinds, server policies still route correctly, legacy payload shape is displayable, and no React/core public type still names legacy approval kinds.
  - Commit: one phase commit.
  - Push: push to `origin/codex-upstream/64bdeed9f7ad`.
  - PR/CI: update PR notes with breaking public API cleanup.
  - Evidence:
    - Implementation: Removed `legacyExecApproval` / `legacyPatchApproval` from core public request kinds and React approval branches; mapped legacy upstream `execCommandApproval` / `applyPatchApproval` to canonical `commandApproval` / `fileChangeApproval`; normalized legacy `conversationId`, `callId`, and `command[]` at the Codex/server policy boundaries; added deprecated raw JSONL fixture coverage.
    - Validation: `bunx vitest run --config vitest.config.ts packages/codex/test/protocol.test.ts packages/codex/test/raw-jsonrpc-fixtures.test.ts` passed; `bunx vitest run --config vitest.config.ts packages/core/test/reducer.test.ts packages/core/test/public-surface.test.ts packages/core/test/source-structure.test.ts` passed; `bunx vitest run --config vitest.config.ts packages/react/test/components.vitest.tsx` passed; `bunx vitest run --config vitest.config.ts packages/server/test/websocket.test.ts` passed; `bun run typecheck` passed; `bun run build` passed; `bun run test:api-snapshots` passed after intentional snapshot update; `bun run test:protocol` passed; `bun run lint` passed.
    - Review: `rg -n "legacyExecApproval|legacyPatchApproval" packages docs examples skills test fixtures --glob '!packages/codex/src/generated/**'` returns only the core source-structure guard patterns.
    - Commit: `d36abcf` Canonicalize approval request kinds
    - Push: pushed to `origin/codex-upstream/64bdeed9f7ad`
  - Tasks:
    - [x] T001 Change public pending request kind union to canonical approval kinds only.
      - Expected files/areas: core state, selectors, public-surface/source-structure guards, API snapshots.
      - Validation note: typecheck and core tests must fail before all legacy references are removed.
    - [x] T002 Map `execCommandApproval` and `applyPatchApproval` to canonical kinds.
      - Expected files/areas: Codex normalizer, protocol tests, raw JSONL fixtures, fixture manifest.
      - Validation note: raw fixtures and protocol tests must prove upstream legacy methods normalize to canonical public kinds.
    - [x] T003 Remove React legacy approval branches and update docs/tests.
      - Expected files/areas: React approvals, `docs/guides/approvals.md`, `docs/reference/hooks.md`, `docs/reference/react-components.md`, `docs/reference/codex-protocol.md`.
      - Validation note: component tests must assert only current approval kinds; docs must describe legacy upstream methods as compatibility inputs.
    - [x] T004 Cover legacy approval payload and server policy behavior.
      - Expected files/areas: React approvals, `packages/server/test/websocket.test.ts`, server request policy tests.
      - Validation note: array commands render sensibly, `conversationId` can populate missing `threadId`, and legacy upstream methods still hit command/file policy callbacks.

- [x] P002 Introduce Agent UI-owned path boundary
  - Goal: keep generated `LegacyAppPathString` / `AbsolutePathBuf` out of preferred product APIs and normalize path values through Agent UI-owned types/helpers.
  - Scope: hand-written Codex request-builder/product input types, Codex root export decision, generated-backed facade docs, core cwd/thread metadata, React cwd/resource public docs, server upload/path docs, public skill guidance.
  - Expected files/areas: `packages/codex/src/path-types.ts`, `packages/codex/src/request-builders.ts`, `packages/codex/src/index.ts`, `packages/codex/src/stable-types.ts`, `packages/codex/src/clients.ts`, `packages/codex/src/session.ts`, `packages/codex/src/auth.ts`, Codex/react/server path docs, `skills/agent-ui/**`, `test/agent-ui-skill.test.ts`, API snapshots.
  - Validation: typecheck, API snapshots, package resolution, Codex generated-ownership/public-surface/session/type tests, React source-structure/thread-history tests, server upload tests, `bun run test:skills`.
  - Review: confirm generated schema remains untouched, `stable-types` generated subpath exception is documented, `clients`/`session` result types are generated-backed advanced facades, and Codex root exports are intentional.
  - Commit: one phase commit unless path object migration proves too broad.
  - Push: push after validation/review.
  - PR/CI: document public path API impact and host-owned path authority.
  - Evidence:
    - Implementation: Added Agent UI-owned path aliases (`AgentLocalPath`, `AgentWorkingDirectory`, `AgentResourcePath`, `AgentSkillPath`, `AgentMentionPath`); moved preferred request-builder public params from generated method-param aliases to hand-written product types checked with `satisfies GeneratedCodexStableMethodParams`; removed generated method params/results from the Codex root barrel; updated docs and public Agent Skill upload wording to describe host-owned local paths rather than path URI or compatibility shims.
    - Validation: `bun run build` passed; `bunx vitest run --config vitest.config.ts packages/codex/test/public-surface.test.ts packages/codex/test/type-tests/protocol-types.ts test/agent-ui-skill.test.ts` passed after skill wording fix; `bun run test:api-snapshots` passed after intentional snapshot update; `bun run test:package-resolution` passed; `bun run typecheck` passed; `bun run lint` passed; `bun run test:skills` passed.
    - Review: `rg -n "LegacyAppPathString|AbsolutePathBuf|upload-only compatibility entry point|path URI|pathuri" packages/codex/src packages/codex/test docs skills examples test/api-snapshots --glob '!packages/codex/src/generated/**'` now shows generated path names only in generated-backed `codex__clients.d.ts` / `codex__stable-types.d.ts`, plus docs/tests that explicitly document or guard the exception.
    - Commit:
    - Push:
  - Tasks:
    - [x] T005 Choose and define low-churn path aliases.
      - Expected files/areas: `packages/codex/src/path-types.ts` or equivalent hand-written module.
      - Validation note: use string aliases such as `AgentLocalPath`; avoid fake URI strings, object wrappers, or opaque brands without runtime guarantees.
    - [x] T006 Convert generated path strings at adapter/request-builder boundaries.
      - Expected files/areas: Codex normalizers and request builders.
      - Validation note: generated files remain unchanged.
    - [x] T007 Add path and root-export public-surface guards.
      - Expected files/areas: `packages/codex/test/generated-ownership.test.ts`, `packages/codex/test/public-surface.test.ts`, `packages/react/test/source-structure.vitest.ts`, `test/api-snapshots/codex__index.d.ts`, `test/api-snapshots/codex__request-builders.d.ts`.
      - Validation note: disallow generated path names in preferred product declarations; allow generated stable-types and documented generated-backed result snapshots.
    - [x] T008 Update path/product guidance.
      - Expected files/areas: `docs/reference/package-exports.md`, `docs/reference/codex-protocol.md`, `docs/reference/react-components.md`, `docs/reference/server-bridge.md`, `docs/guides/attachments.md`, `skills/agent-ui/SKILL.md`, `skills/agent-ui/references/uploads.md`, `skills/agent-ui/references/local-single-user.md`, `skills/agent-ui/references/debug.md`, `test/agent-ui-skill.test.ts`.
      - Validation note: document generated-only exception, generated-backed clients/session result types, and remove stale "upload-only compatibility entry point" wording if that surface is de-emphasized.

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
      - Expected files/areas: protocol tests, `docs/reference/codex-protocol.md`, `docs/guides/diagnostics.md`.
      - Validation note: raw fixture isolation remains intact; `item/fileChange/outputDelta` stays mapped compatibility fallback.
    - [ ] T010 Normalize deprecated fields through current names where applicable.
      - Expected files/areas: MCP/dynamic tool normalizers and tests.
      - Validation note: current field wins over deprecated fallback.
    - [ ] T011 Keep account/config/model compatibility fields generated-only or view-adapter-only.
      - Expected files/areas: `packages/react/src/usage.ts`, `packages/react/src/components/status-formatting.ts`, docs, protocol metadata tests.
      - Validation note: rate-limit compatibility stays React view adapter; no new core raw schema promise.
    - [ ] T012 Add deprecated-name source-structure guards.
      - Expected files/areas: `packages/react/test/source-structure.vitest.ts`, API snapshots.
      - Validation note: guard core/react declarations against deprecated names; exempt generated stable-types.

- [ ] P004 Docs, skills, examples, and snapshots
  - Goal: make host-facing guidance, examples, and declaration snapshots match the cleaned public surface.
  - Scope: docs/reference, docs/guides, docs/examples, public `skills/agent-ui`, direct example consumers, API snapshots, compatibility-name sweeps.
  - Expected files/areas: `docs/guides/approvals.md`, `docs/reference/hooks.md`, `docs/reference/react-components.md`, `docs/reference/codex-protocol.md`, `docs/reference/package-exports.md`, `docs/reference/server-bridge.md`, `docs/guides/attachments.md`, `docs/guides/diagnostics.md`, `docs/examples/*.md`, `skills/agent-ui/**`, `examples/codex-local-web/src/main.tsx`, `examples/next-with-bridge-sidecar/app/page.tsx`, `examples/local-react-vite/src/main.tsx`, `examples/local-react-vite/src/closeups/ComponentCloseupGallery.tsx`, `examples/recipes/src/local-media-helper.tsx`, `test/api-snapshots/*.d.ts`.
  - Validation: `bun run test:skills`, docs staleness tests if present/touched, example package typecheck/build commands, `bun run build`, API snapshot update flow, final `rg` sweeps.
  - Review: docs must not advertise legacy names as public APIs; examples should use canonical request-builder/path terms; `codex__stable-types.d.ts` remains generated-only.
  - Commit: one phase commit after docs/examples/snapshots validation.
  - Push: push after validation/review.
  - PR/CI: record docs/skills/examples/API snapshot impact.
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T013 Update required docs surfaces.
      - Expected files/areas: approvals, hooks, React components, Codex protocol, package exports, server bridge, attachments, diagnostics, host-integration if path wording changes.
      - Validation note: no public docs list `legacyExecApproval` / `legacyPatchApproval` as product kinds; no local path docs use "path URI" for filesystem paths.
    - [ ] T014 Update public Agent Skill guidance and tests.
      - Expected files/areas: `skills/agent-ui/**`, `test/agent-ui-skill.test.ts`.
      - Validation note: run `bun run test:skills`; add negative assertions for stale compatibility names if the skill text changes.
    - [ ] T015 Audit/update examples and docs examples.
      - Expected files/areas: codex-local-web, next-with-bridge-sidecar, local-react-vite, recipes, docs examples.
      - Validation note: typecheck/build touched example packages; keep real-local fake server on current approval methods.
    - [ ] T016 Update and review API snapshots.
      - Expected files/areas: `core__index.d.ts`, `codex__request-builders.d.ts`, `codex__index.d.ts`, `react__index.d.ts`, `server__index.d.ts`, stable-types snapshot.
      - Validation note: build first, update snapshots intentionally, rerun `bun run test:api-snapshots`; stable-types is generated-only.
    - [ ] T017 Run final compatibility-name sweeps.
      - Expected files/areas: docs, examples, packages, skills, test snapshots.
      - Validation note: generated and documented generated-backed exceptions only.

- [ ] P005 Release, PR, and CI follow-through
  - Goal: make the stacked branch reviewable and releasable without temporary artifacts.
  - Scope: changeset, fixed-package release policy, final validation, PR #33 rewrite, push, CI follow-through.
  - Expected files/areas: `.changeset/*.md`, PR body/comment, TODO evidence.
  - Validation: `bun run validate:fast`, `bun run test:protocol`, `bun run typecheck`, `bun run lint`, `bun run build`, `bun run test:api-snapshots`, `bun run test:package-resolution`, `bun run validate:packages`, `bun run validate:release`.
  - Review: independent review or fresh-context self-review before final push.
  - Commit: final release/PR cleanup commit if not covered earlier.
  - Push: push final branch head.
  - PR/CI: rewrite PR #33 title/body and inspect GitHub Actions to concrete pass/fail.
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T018 Add changeset with correct pre-1.0 fixed-package policy.
      - Expected files/areas: `.changeset/`.
      - Validation note: use minor for public package surface changes unless an explicit 1.0/major policy decision is made; include fixed-version package rationale.
    - [ ] T019 Run final validation matrix.
      - Expected files/areas: validation logs in TODO evidence.
      - Validation note: include required final checks plus `bun run test:skills`; include `bun run test:repo-skills` only if maintainer skills changed.
    - [ ] T020 Rewrite PR #33 scope and final comment.
      - Expected files/areas: PR title/body/comment, TODO evidence.
      - Validation note: PR must say schema refresh plus compatibility cleanup, not schema-only.
    - [ ] T021 Push and follow CI.
      - Expected files/areas: PR and TODO evidence.
      - Validation note: record pass/fail, skipped checks, and residual risk.

## Task Checklist By Phase

Tasks are listed under each phase above. Execute by phase, not by isolated task, unless the implementation records why a task-level fallback was required.

## Implementation Notes

- Stay on `codex-upstream/64bdeed9f7ad` unless the user asks to split.
- Do not edit generated schema or vendored upstream files.
- Use phase-level commits by default.
- If path migration becomes too broad, split P002 into type-boundary and UI/docs commits.
- Keep `packages/codex/src/generated/**`, `third_party/codex`, and generated stable-type snapshots as exceptions for upstream schema names.
- If cleanup remains stacked on PR #33, update the PR scope before asking for review.
- Do not add compatibility-specific rules to unrelated release/browser/example-authoring skills.

## Validation Evidence

- Planning artifact validation passed after supplemental Round 4.

## Review Evidence

- Planning self-review checked required sections, same-branch rule, protected-file constraints, phase-first TODO shape, and validation coverage.
- Round 1-2 subagents reviewed approval, path, deprecated/fallback, and release/package lanes; deltas were incorporated.
- Round 3 final artifact review found no blocking omissions or contradictions: approval lane ready, path lane ready, deprecated fallback lane ready, release lane ready.
- Supplemental Round 4 reviewed Agent Skills, docs, examples, and release/package cross-cutting omissions; required changes were incorporated.

## Commit Log

- `ef0b358` Plan compatibility surface cleanup
- `27f3a31` Harden compatibility cleanup plan
- Supplemental Round 4 planning update to be recorded by this planning run.
- `d36abcf` Canonicalize approval request kinds

## Final Checklist

- [ ] Every phase is complete or explicitly deferred.
- [ ] Every task in completed phases is complete or explicitly skipped with a reason.
- [ ] Every completion criterion in `plan.md` is satisfied.
- [ ] Required validation passed or an explicit user-approved exception is recorded.
- [ ] Review evidence is recorded.
- [ ] Branch, planning commit, remote, push result, and blockers are recorded.
- [ ] Commit hashes are recorded for completed phases.
