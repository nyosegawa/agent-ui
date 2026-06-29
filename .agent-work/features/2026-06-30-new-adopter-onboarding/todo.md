# TODO

## Status Summary

- Overall status: Not started
- Current phase: Planning package complete; implementation not started
- Blockers: None
- Last validation: Artifact validation pending
- Last review: Four-lane research pass complete; implementation review pending
- PR/CI: Not opened

## Branch And Planning Commit

- Branch: codex/new-adopter-onboarding-plan
- Planning commit: pending
- Remote: `origin` (`ssh://git@github.com/nyosegawa/agent-ui.git`)
- Push result: pending
- Blockers: none

## Phase Checklist

- [ ] P001 Canonical new-adopter docs path
  - Goal: Give a first-time host app one authoritative full-chat setup path.
  - Scope: README/docs navigation, install/getting-started split, first host app guide, React guide decision table, host-integration cross-links.
  - Expected files/areas: `README.md`, `docs/README.md`, `docs/installation.md`, `docs/getting-started.md`, `docs/guides/react.md`, `docs/guides/host-integration.md`, possible `docs/guides/first-host-app.md`.
  - Validation: `bunx vitest run test/package-scripts-docs.test.ts test/ci-workflow-policy.test.ts`; focused docs link/staleness tests if present.
  - Review: Fresh pass for host-boundary regressions and snippet completeness.
  - 4-Parallel Subagent Review: Run four independent subagent review lanes for this phase after validation and before commit.
  - Commit: pending
  - Push: pending
  - PR/CI: pending
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - 4-Parallel Subagent Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T001 Add or integrate a first-host-app guide with browser code, server bridge code, stylesheet import, package install, Node requirements, Codex CLI/auth assumptions, same-origin WebSocket, and local-loopback admission.
      - Expected files/areas: docs guide plus README/docs index links.
      - Validation note: Check snippets use public imports only.
    - [ ] T002 Add React entrypoint decision table for `AgentChat`, `components`, controller, `/headless`, and `/primitives`.
      - Expected files/areas: `docs/guides/react.md`, `docs/guides/host-integration.md`.
      - Validation note: Ensure `useAgentContext().state` and `internal` imports are discouraged.
    - [ ] T003 Reframe getting-started so repo contributor setup does not masquerade as package adopter setup.
      - Expected files/areas: `docs/getting-started.md`, `docs/installation.md`, `README.md`.
      - Validation note: New adopter path must include `@nyosegawa/agent-ui-server` for full chat.

- [ ] P002 Recipes and npm package README alignment
  - Goal: Make package-level docs and recipes self-contained for npm consumers.
  - Scope: Topic-based recipes index, package README common imports, root versus advanced server boundary, web-components stylesheet note.
  - Expected files/areas: `docs/examples/recipes.md`, `examples/recipes/README.md` if present, `packages/*/README.md`, `docs/reference/package-exports.md`.
  - Validation: `bun run test:package-resolution`; `bun run validate:packages`; example typecheck/builds for touched examples.
  - Review: Package export and npm README consistency review.
  - 4-Parallel Subagent Review: Run four independent subagent review lanes for this phase after validation and before commit.
  - Commit: pending
  - Push: pending
  - PR/CI: pending
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - 4-Parallel Subagent Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T004 Convert recipes docs from file-list index to task index: bridge/security, local media, customize AgentChat, headless layout, dynamic tools, remote deployment, validation.
      - Expected files/areas: `docs/examples/recipes.md`, `examples/recipes`.
      - Validation note: Cross-links should point to runnable examples or typed recipe files.
    - [ ] T005 Add common import tables to package README files.
      - Expected files/areas: `packages/react/README.md`, `packages/server/README.md`, `packages/codex/README.md`, `packages/core/README.md`, `packages/web-components/README.md`.
      - Validation note: Keep `@nyosegawa/agent-ui-core/internal` out of host guidance.
    - [ ] T006 Update package exports reference for any clarified or changed public surfaces.
      - Expected files/areas: `docs/reference/package-exports.md`.
      - Validation note: Align with actual `package.json` exports.

- [ ] P003 Public Agent Skill new-adopter refresh
  - Goal: Make `skills/agent-ui` route v3 first-time integration correctly and safely.
  - Scope: Public skill routing, local single-user path, server bridge reference, uploads reference, validation checklist, debug guide, integration profiles, OpenAI agent metadata.
  - Expected files/areas: `skills/agent-ui/SKILL.md`, `skills/agent-ui/references/*.md`, `skills/agent-ui/agents/openai.yaml`, `docs/maintenance/agent-ui-skills.md`, `test/agent-ui-skill.test.ts`.
  - Validation: `bun run test:skills`.
  - Review: Skill best-practices pass: short `SKILL.md`, progressive disclosure, no repo-maintainer command leakage, safe snippets.
  - 4-Parallel Subagent Review: Run four independent subagent review lanes for this phase after validation and before commit.
  - Commit: pending
  - Push: pending
  - PR/CI: pending
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - 4-Parallel Subagent Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T007 Prioritize triggers for `v3 new adopter`, `first host app`, `AgentChat preset`, `headless + primitives`, `same-origin bridge skeleton`, `Node >=22`, `新規導入`, `初回導入`, and `最小構成`.
      - Expected files/areas: `skills/agent-ui/SKILL.md`, agent metadata.
      - Validation note: Keep description concise and routing-oriented.
    - [ ] T008 Put safe browser + server bridge skeletons in the local single-user flow.
      - Expected files/areas: `skills/agent-ui/references/local-single-user.md`, `server-bridge.md`.
      - Validation note: Use root server APIs by default, not `/advanced`.
    - [ ] T009 Harden upload examples with `response.ok`, response shape checks, dedicated upload root wording, and no blind `asset.path` usage.
      - Expected files/areas: `skills/agent-ui/references/uploads.md`, `docs/guides/attachments.md`.
      - Validation note: `test:skills` should assert the safe pattern.
    - [ ] T010 Expand external host validation checklist for send, reload/resume, approval, upload, steer, interrupt, and mobile overflow.
      - Expected files/areas: `skills/agent-ui/references/validation.md`.
      - Validation note: Avoid repository-only commands.

- [ ] P004 Repository skill and planning/review guardrails
  - Goal: Ensure future repo agents keep docs, examples, package README files, and public skill in sync.
  - Scope: Maintainer skills and tests for onboarding review obligations.
  - Expected files/areas: `.agents/skills/agent-ui-feature-planning/**`, `.agents/skills/example-authoring/SKILL.md`, `.agents/skills/agent-ui-review/SKILL.md`, `docs/maintenance/repository-skills.md`, `test/repository-skills.test.ts`.
  - Validation: `bun run test:repo-skills`.
  - Review: Ensure maintainer guidance does not leak into public skill.
  - 4-Parallel Subagent Review: Run four independent subagent review lanes for this phase after validation and before commit.
  - Commit: pending
  - Push: pending
  - PR/CI: pending
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - 4-Parallel Subagent Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T011 Add new-adopter onboarding/docs/skills/examples synchronization as a planning and review concern.
      - Expected files/areas: feature-planning and review skills.
      - Validation note: Include public skill and package README in the expected inspection surface.
    - [ ] T012 Correct example-authoring wording around recipe locations and topic-based recipe indexes.
      - Expected files/areas: `.agents/skills/example-authoring/SKILL.md`.
      - Validation note: Do not point agents to non-existent `docs/recipes/` as an active destination.
    - [ ] T013 Update repo skill tests to assert public-skill/docs alignment expectations.
      - Expected files/areas: `test/repository-skills.test.ts`.
      - Validation note: Keep tests deterministic and text-based.

- [ ] P005 Bridge, upload, and React waiting-state hardening
  - Goal: Make package behavior match the safer docs and clean public API contract.
  - Scope: Server bridge policy validation, upload session cleanup, React blocked reason API, docs, snapshots, changesets.
  - Expected files/areas: `packages/server/src/websocket.ts`, `packages/server/test/websocket.test.ts`, `packages/server/src/upload.ts`, `packages/server/test/upload.test.ts`, `packages/react/src/hooks/composer.ts`, `packages/react/src/hooks/composer-types.ts`, React tests, `docs/reference/server-bridge.md`, `docs/reference/hooks.md`, `docs/guides/attachments.md`, `docs/reference/package-exports.md`, `.changeset/*`.
  - Validation: focused Vitest for server/react; `bun run test:api-snapshots`; `bun run test:package-resolution`; `bun run validate:packages`; `bun run test:e2e:real-local`.
  - Review: Security/API review focusing on pre-spawn rejection, cleanup scope, and public result semantics.
  - 4-Parallel Subagent Review: Run four independent subagent review lanes for this phase after validation and before commit.
  - Commit: pending
  - Push: pending
  - PR/CI: pending
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - 4-Parallel Subagent Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T014 Reject invalid top-level `browserMethodPolicy` values before spawn, including values returned by `resolveBridgeOptions`.
      - Expected files/areas: server websocket implementation/tests.
      - Validation note: Include unknown string, malformed object, valid `"productized"`, `"all"`, and valid capability object cases.
    - [ ] T015 Restrict upload TTL cleanup to Agent UI managed session directories.
      - Expected files/areas: server upload implementation/tests.
      - Validation note: Preserve unrelated stale directories; remove managed stale sessions; preserve current managed sessions; ignore malformed marker/symlink cases.
    - [ ] T016 Expand React composer blocked reasons to reflect core waiting reasons.
      - Expected files/areas: React composer types/implementation/tests, hooks docs, package exports docs.
      - Validation note: UI display may stay generic, but controller results must distinguish reasons.
    - [ ] T017 Add required changesets and regenerate API snapshots through scripts if public types change.
      - Expected files/areas: `.changeset`, API snapshot outputs generated by command.
      - Validation note: Inspect snapshot diff manually before commit.

- [ ] P006 Success-path fake App Server fixture and adopter validation story
  - Goal: Let maintainers and downstream host apps test `thread/start` through `turn/completed` without rebuilding the fake protocol by hand.
  - Scope: Decide fixture surface, extract or implement fixture, document usage, wire focused tests.
  - Expected files/areas: existing example fake App Server, package test support or explicit `test-fixtures` export, package exports docs, package README, host validation docs, tests.
  - Validation: fixture unit tests; relevant package tests; `bun run test:package-resolution` if exported; `bun run test:e2e:fixtures`; targeted real-local lifecycle suite.
  - Review: Public surface review before exporting anything new.
  - 4-Parallel Subagent Review: Run four independent subagent review lanes for this phase after validation and before commit.
  - Commit: pending
  - Push: pending
  - PR/CI: pending
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - 4-Parallel Subagent Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T018 Decide public `test-fixtures` subpath versus repo-internal fixture and record rationale in docs.
      - Expected files/areas: `docs/reference/package-exports.md`, package README or testing docs.
      - Validation note: If public, update package exports and package resolution tests.
    - [ ] T019 Cover canonical id, `thread/start`, `turn/start`, streamed delta, `turn/completed`, queued steer, and interrupt behavior.
      - Expected files/areas: fixture implementation/tests.
      - Validation note: Fixture should not hide host-owned auth/storage/process policy.
    - [ ] T020 Add adopter-facing success smoke guidance without requiring repository-only commands.
      - Expected files/areas: first-host-app docs, public skill validation reference.
      - Validation note: External guidance should describe observable behavior and host-appropriate test choices.

- [ ] P007 Final validation, release readiness, PR, and CI follow-through
  - Goal: Prove the whole package is coherent, shareable, and ready for review.
  - Scope: Broad local gates, changeset review, final docs/skill review, branch push, PR creation, CI monitoring.
  - Expected files/areas: all changed files, `todo.md` evidence, PR body.
  - Validation: `bun run validate:release`; `bun run validate:e2e`; `node scripts/check-release-targets.mjs`; any skipped checks recorded with blocker.
  - Review: Independent final review using `agent-ui-review` or a fresh-context manual review.
  - 4-Parallel Subagent Review: Run four independent subagent review lanes for this phase after validation and before final commit/PR readiness.
  - Commit: pending
  - Push: pending
  - PR/CI: pending
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - 4-Parallel Subagent Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T021 Run final broad validation and record exact command results.
      - Expected files/areas: `todo.md`.
      - Validation note: Include failures and fixes, not only final success.
    - [ ] T022 Review changesets, API snapshots, package exports, public skill, and repo skills as release-facing surfaces.
      - Expected files/areas: changed docs/tests/package files.
      - Validation note: Public package docs changes may require changesets.
    - [ ] T023 Push branch, create PR, and follow GitHub Actions to concrete success or failure.
      - Expected files/areas: PR metadata and `todo.md`.
      - Validation note: Use `gh pr checks` and failed-log inspection if needed.

## Task Checklist By Phase

### P001 Canonical new-adopter docs path

- [ ] T001 Add or integrate a first-host-app guide.
  - Expected files/areas: docs guide plus README/docs index links.
  - Validation note: Check snippets use public imports only.
- [ ] T002 Add React entrypoint decision table.
  - Expected files/areas: `docs/guides/react.md`, `docs/guides/host-integration.md`.
  - Validation note: Avoid `useAgentContext().state` and `internal` as host guidance.
- [ ] T003 Reframe getting-started for contributor versus adopter setup.
  - Expected files/areas: `docs/getting-started.md`, `docs/installation.md`, `README.md`.
  - Validation note: Full chat path includes server package.

### P002 Recipes and npm package README alignment

- [ ] T004 Convert recipes docs to topic index.
  - Expected files/areas: `docs/examples/recipes.md`, `examples/recipes`.
  - Validation note: Cross-links point to runnable or typed examples.
- [ ] T005 Add common import tables to package README files.
  - Expected files/areas: `packages/*/README.md`.
  - Validation note: Public imports only.
- [ ] T006 Update package exports reference.
  - Expected files/areas: `docs/reference/package-exports.md`.
  - Validation note: Match package manifests.

### P003 Public Agent Skill new-adopter refresh

- [ ] T007 Prioritize new-adopter triggers.
  - Expected files/areas: public skill entry and metadata.
  - Validation note: Keep `SKILL.md` routing-focused.
- [ ] T008 Add safe first-app bridge skeletons.
  - Expected files/areas: local single-user and server bridge references.
  - Validation note: Root server APIs by default.
- [ ] T009 Harden upload examples.
  - Expected files/areas: public skill uploads reference and attachments guide.
  - Validation note: Assert with `test:skills`.
- [ ] T010 Expand external validation checklist.
  - Expected files/areas: public skill validation reference.
  - Validation note: No repo-only commands.

### P004 Repository skill and planning/review guardrails

- [ ] T011 Add onboarding sync to planning/review skills.
  - Expected files/areas: feature-planning and review skills.
  - Validation note: Include docs/examples/public-skill/package README.
- [ ] T012 Correct recipe location wording.
  - Expected files/areas: example-authoring skill.
  - Validation note: Use current recipe destinations.
- [ ] T013 Update repo skill tests.
  - Expected files/areas: `test/repository-skills.test.ts`.
  - Validation note: Deterministic text assertions.

### P005 Bridge, upload, and React waiting-state hardening

- [ ] T014 Reject invalid `browserMethodPolicy`.
  - Expected files/areas: server websocket implementation/tests.
  - Validation note: Reject before spawn.
- [ ] T015 Restrict upload cleanup to managed sessions.
  - Expected files/areas: server upload implementation/tests.
  - Validation note: Preserve unrelated directories.
- [ ] T016 Expand React blocked reasons.
  - Expected files/areas: React composer code/tests/docs.
  - Validation note: Match core waiting reasons.
- [ ] T017 Add changesets and regenerate API snapshots.
  - Expected files/areas: `.changeset`, generated snapshots.
  - Validation note: Inspect generated diff.

### P006 Success-path fake App Server fixture and adopter validation story

- [ ] T018 Decide fixture surface.
  - Expected files/areas: package exports/docs.
  - Validation note: Public export only if intentionally supported.
- [ ] T019 Cover success lifecycle fixture behavior.
  - Expected files/areas: fixture implementation/tests.
  - Validation note: Include streamed and queued cases.
- [ ] T020 Add adopter-facing success smoke guidance.
  - Expected files/areas: docs and public skill.
  - Validation note: Host-appropriate, not repo-only.

### P007 Final validation, release readiness, PR, and CI follow-through

- [ ] T021 Run final broad validation.
  - Expected files/areas: `todo.md` evidence.
  - Validation note: Record command results.
- [ ] T022 Review release-facing surfaces.
  - Expected files/areas: changed package/docs/skill files.
  - Validation note: Confirm changesets.
- [ ] T023 Push, create PR, and follow CI.
  - Expected files/areas: PR and `todo.md`.
  - Validation note: Concrete success/failure.

## Implementation Notes

- Start each phase by re-reading the specific files it touches.
- Update this TODO with status and evidence as work proceeds.
- Do not make public `skills/agent-ui` depend on Bun or repository-specific commands; external hosts may use npm, pnpm, yarn, or Bun.
- Keep the product boundary visible in every new first-app path.
- If public API changes are broader than expected, split P005 before editing.

## Validation Evidence

- Pending

## Review Evidence

- Planning research used four subagent lanes: docs onboarding, implementation/public surface, validation/CI, and skill design.

## Commit Log

- Pending

## Final Checklist

- [ ] Every phase is complete or explicitly deferred.
- [ ] Every task in completed phases is complete or explicitly skipped with a reason.
- [ ] Every completion criterion in `plan.md` is satisfied.
- [ ] Required validation passed or an explicit user-approved exception is recorded.
- [ ] Review evidence is recorded.
- [ ] Branch, planning commit, remote, push result, and blockers are recorded.
- [ ] Commit hashes are recorded for completed phases.
- [ ] Push evidence is recorded when commits need to be shared or a PR will be created.
- [ ] PR URL is recorded when applicable.
- [ ] CI was followed to concrete success or failure when applicable.
