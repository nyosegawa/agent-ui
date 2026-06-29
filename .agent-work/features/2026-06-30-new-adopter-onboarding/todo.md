# TODO

## Status Summary

- Overall status: In progress
- Current phase: P004 Repository skill and planning/review guardrails
- Blockers: None
- Last validation: P004 repo skill and public skill leakage validation passed locally; PR #42 P004 CI checks passed after push.
- Last review: P004 four-lane subagent review completed; public-skill leakage guard finding fixed.
- PR/CI: Draft PR #42 open; latest P004 checks passed.

## Branch And Planning Commit

- Branch: codex/new-adopter-onboarding-plan
- Planning commit: `211c00c38fb5b99f7bdfa348fc1a6558e6dc37f7`; review checkpoint update `bef201296285e3d8a025315fdf5880d8b07f68e8`
- Remote: `origin` (`ssh://git@github.com/nyosegawa/agent-ui.git`)
- Push result: planning, P001 docs commits, P002 docs/package README commits, P003 public skill commits, and P004 guardrail/evidence commits pushed
- Blockers: none

## Phase Checklist

- [x] P001 Canonical new-adopter docs path
  - Goal: Give a first-time host app one authoritative full-chat setup path.
  - Scope: README/docs navigation, install/getting-started split, first host app guide, React guide decision table, host-integration cross-links.
  - Expected files/areas: `README.md`, `docs/README.md`, `docs/installation.md`, `docs/getting-started.md`, `docs/guides/react.md`, `docs/guides/host-integration.md`, possible `docs/guides/first-host-app.md`.
  - Validation: `bunx vitest run test/package-scripts-docs.test.ts test/ci-workflow-policy.test.ts`; focused docs link/staleness tests if present.
  - Review: Fresh pass for host-boundary regressions and snippet completeness. Completed.
  - 4-Parallel Subagent Review: Run four independent subagent review lanes for this phase after validation and before commit.
  - Commit: `014ce7b5f0e36ad917af2650d2ba77b892cc8ec3`
  - Push: pushed to `origin/codex/new-adopter-onboarding-plan`
  - PR/CI: Draft PR #42 open; Detect changes, Detect compatibility changes, Repository policy, Typecheck, Lint, and Unit tests passed for pushed P001 docs commits. Path-filtered package/e2e jobs skipped.
  - Evidence:
    - Implementation: Added `docs/guides/first-host-app.md`; linked it from README, docs index, installation, getting-started, React, and host-integration docs; added the React surface decision table.
    - Validation: `bunx vitest run test/package-scripts-docs.test.ts test/ci-workflow-policy.test.ts` passed; `bunx vitest run test/docs-staleness.test.ts` passed.
    - Review: Manual pass confirmed public imports, host-owned boundary language, and contributor/adopter separation.
    - 4-Parallel Subagent Review: Completed. Lane 1 found no IA blocker and reminded to include new file; lane 2 found incorrect `AgentChat.components` wording and internal token source references, fixed; lane 3 found no bridge/security blockers; lane 4 found no broken links and requested TODO evidence updates, fixed.
    - Commit: `014ce7b5f0e36ad917af2650d2ba77b892cc8ec3`
    - Push: pushed to `origin/codex/new-adopter-onboarding-plan`
  - Tasks:
    - [x] T001 Add or integrate a first-host-app guide with browser code, server bridge code, stylesheet import, package install, Node requirements, Codex CLI/auth assumptions, same-origin WebSocket, and local-loopback admission.
      - Expected files/areas: docs guide plus README/docs index links.
      - Validation note: Check snippets use public imports only.
    - [x] T002 Add React entrypoint decision table for `AgentChat`, `components`, controller, `/headless`, and `/primitives`.
      - Expected files/areas: `docs/guides/react.md`, `docs/guides/host-integration.md`.
      - Validation note: Ensure `useAgentContext().state` and `internal` imports are discouraged.
    - [x] T003 Reframe getting-started so repo contributor setup does not masquerade as package adopter setup.
      - Expected files/areas: `docs/getting-started.md`, `docs/installation.md`, `README.md`.
      - Validation note: New adopter path must include `@nyosegawa/agent-ui-server` for full chat.

- [x] P002 Recipes and npm package README alignment
  - Goal: Make package-level docs and recipes self-contained for npm consumers.
  - Scope: Topic-based recipes index, package README common imports, root versus advanced server boundary, web-components stylesheet note.
  - Expected files/areas: `docs/examples/recipes.md`, `examples/recipes/README.md` if present, `packages/*/README.md`, `docs/reference/package-exports.md`.
  - Validation: `bun run test:package-resolution`; `bun run validate:packages`; example typecheck/builds for touched examples.
  - Review: Package export and npm README consistency review.
  - 4-Parallel Subagent Review: Run four independent subagent review lanes for this phase after validation and before commit.
  - Commit: `ce002c9e7542a853d2e48f3e669ca1550a4d1f08`
  - Push: pushed to `origin/codex/new-adopter-onboarding-plan`
  - PR/CI: Draft PR #42 open; P002 CI checks passed.
  - Evidence:
    - Implementation: Converted recipe docs to a topic-based index with direct links to typed recipe files; added package README Common Imports tables; clarified root versus `/advanced` server imports; added the web-components stylesheet note; updated package exports reference with common import paths and host-facing boundary guidance; added a patch changeset for the five public packages with npm-facing README changes.
    - Validation: `bun run test:package-resolution` passed; `bun run validate:packages` passed with existing non-failing publint repository URL suggestions; `bun run --cwd examples/recipes typecheck` passed; `bun run --cwd examples/recipes build` passed; `bunx changeset status --verbose` passed; `bunx vitest run test/package-scripts-docs.test.ts test/ci-workflow-policy.test.ts test/docs-staleness.test.ts` passed; artifact validator passed.
    - Review: Manual pass confirmed package README import paths, package export docs, and recipe links use public package surfaces and do not route host apps through `dist/*`, source files, generated schema chunks, or `@nyosegawa/agent-ui-core/internal`.
    - 4-Parallel Subagent Review: Completed. Lane 1 found non-clickable recipe entries in the topic indexes, fixed by linkifying recipe targets; lane 2 found no public import findings; lane 3 found no package boundary or changeset findings; lane 4 found stale TODO evidence, fixed here.
    - Commit: `ce002c9e7542a853d2e48f3e669ca1550a4d1f08`
    - Push: pushed to `origin/codex/new-adopter-onboarding-plan`
    - PR/CI: PR #42 checks passed for pushed P002 commits: Detect changes, Detect compatibility changes, Repository policy, Typecheck, Lint, Unit tests, API snapshots, Package resolution, Package validation, Protocol and fixtures, Playwright fixtures, and Real local smoke. Compatibility matrix jobs were skipped by path filters.
  - Tasks:
    - [x] T004 Convert recipes docs from file-list index to task index: bridge/security, local media, customize AgentChat, headless layout, dynamic tools, remote deployment, validation.
      - Expected files/areas: `docs/examples/recipes.md`, `examples/recipes`.
      - Validation note: Cross-links should point to runnable examples or typed recipe files.
    - [x] T005 Add common import tables to package README files.
      - Expected files/areas: `packages/react/README.md`, `packages/server/README.md`, `packages/codex/README.md`, `packages/core/README.md`, `packages/web-components/README.md`.
      - Validation note: Keep `@nyosegawa/agent-ui-core/internal` out of host guidance.
    - [x] T006 Update package exports reference for any clarified or changed public surfaces.
      - Expected files/areas: `docs/reference/package-exports.md`.
      - Validation note: Align with actual `package.json` exports.

- [x] P003 Public Agent Skill new-adopter refresh
  - Goal: Make `skills/agent-ui` route v3 first-time integration correctly and safely.
  - Scope: Public skill routing, local single-user path, server bridge reference, uploads reference, validation checklist, debug guide, integration profiles, OpenAI agent metadata.
  - Expected files/areas: `skills/agent-ui/SKILL.md`, `skills/agent-ui/references/*.md`, `skills/agent-ui/agents/openai.yaml`, `docs/maintenance/agent-ui-skills.md`, `test/agent-ui-skill.test.ts`.
  - Validation: `bun run test:skills`.
  - Review: Skill best-practices pass: short `SKILL.md`, progressive disclosure, no repo-maintainer command leakage, safe snippets.
  - 4-Parallel Subagent Review: Run four independent subagent review lanes for this phase after validation and before commit.
  - Commit: `09c4bcd494f64ef7efbb59945021874b10b45869`
  - Push: pushed to `origin/codex/new-adopter-onboarding-plan`
  - PR/CI: Draft PR #42 open; P003 CI checks passed.
  - Evidence:
    - Implementation: Prioritized new-adopter triggers in `skills/agent-ui/SKILL.md` and `agents/openai.yaml`; added first-host-app and `Node >=22` routing; added safe browser/server bridge skeleton guidance with root server APIs, `local-loopback` admission, and `browserMethodPolicy: "productized"`; hardened public skill and attachments upload snippets with `response.ok`, JSON shape checks for `path`/`previewUrl`/`url`, dedicated upload root wording, and no blind `asset.path` trust; expanded the external host validation checklist for send, `thread/start` through `turn/completed`, stop/interrupt, steer, approvals, image and non-image uploads, reload/resume, bridge admission, and mobile overflow; removed repo-maintainer validation commands/gates from the public skill.
    - Validation: `bun run test:skills` passed; `bunx vitest run test/package-scripts-docs.test.ts test/ci-workflow-policy.test.ts test/docs-staleness.test.ts` passed; forbidden maintainer-command/gate search over public skill and attachments docs had no matches; `git diff --check` passed; artifact validator passed.
    - Review: Manual pass confirmed public skill keeps progressive disclosure, host-owned runtime policy, root server bridge guidance, and external-host package-manager neutrality.
    - 4-Parallel Subagent Review: Completed. Lane 1 trigger/metadata review passed; lane 2 bridge first-app safety review passed; lane 3 found optional `previewUrl`/`url` fields were not validated in upload snippets, fixed; lane 4 found repo-maintainer validation leakage and incomplete checklist assertions, fixed by removing repository gates from the public skill and expanding tests.
    - Commit: `09c4bcd494f64ef7efbb59945021874b10b45869`
    - Push: pushed to `origin/codex/new-adopter-onboarding-plan`
    - PR/CI: PR #42 checks passed for pushed P003 commits: Detect changes, Detect compatibility changes, Repository policy, Typecheck, Lint, Unit tests, API snapshots, Package resolution, Package validation, Protocol and fixtures, Playwright fixtures, and Real local smoke. Compatibility matrix jobs were skipped by path filters.
  - Tasks:
    - [x] T007 Prioritize triggers for `v3 new adopter`, `first host app`, `AgentChat preset`, `headless + primitives`, `same-origin bridge skeleton`, `Node >=22`, `新規導入`, `初回導入`, and `最小構成`.
      - Expected files/areas: `skills/agent-ui/SKILL.md`, agent metadata.
      - Validation note: Keep description concise and routing-oriented.
    - [x] T008 Put safe browser + server bridge skeletons in the local single-user flow.
      - Expected files/areas: `skills/agent-ui/references/local-single-user.md`, `server-bridge.md`.
      - Validation note: Use root server APIs by default, not `/advanced`.
    - [x] T009 Harden upload examples with `response.ok`, response shape checks, dedicated upload root wording, and no blind `asset.path` usage.
      - Expected files/areas: `skills/agent-ui/references/uploads.md`, `docs/guides/attachments.md`.
      - Validation note: `test:skills` should assert the safe pattern.
    - [x] T010 Expand external host validation checklist for send, reload/resume, approval, upload, steer, interrupt, and mobile overflow.
      - Expected files/areas: `skills/agent-ui/references/validation.md`.
      - Validation note: Avoid repository-only commands.

- [x] P004 Repository skill and planning/review guardrails
  - Goal: Ensure future repo agents keep docs, examples, package README files, and public skill in sync.
  - Scope: Maintainer skills and tests for onboarding review obligations.
  - Expected files/areas: `.agents/skills/agent-ui-feature-planning/**`, `.agents/skills/example-authoring/SKILL.md`, `.agents/skills/agent-ui-review/SKILL.md`, `docs/maintenance/repository-skills.md`, `test/repository-skills.test.ts`.
  - Validation: `bun run test:repo-skills`.
  - Review: Ensure maintainer guidance does not leak into public skill.
  - 4-Parallel Subagent Review: Run four independent subagent review lanes for this phase after validation and before commit.
  - Commit: `1d83d396e91df305b496202fa0e98df6c67d510d`
  - Push: pushed to `origin/codex/new-adopter-onboarding-plan`
  - PR/CI: Draft PR #42 open; P004 CI checks passed.
  - Evidence:
    - Implementation: Added new-adopter onboarding synchronization obligations to feature-planning, repo research summary, agent-ui-review, repository skill docs, and example-authoring guidance; corrected recipe destinations to `examples/recipes` plus `docs/examples/recipes.md`; added deterministic tests for repo skill synchronization and public skill leakage guards.
    - Validation: `bun run test:repo-skills` passed; `bun run test:skills` passed; forbidden maintainer-command/gate search over `skills/agent-ui` returned no matches; `git diff --check` passed; artifact validator passed.
    - Review: Manual pass confirmed public `skills/agent-ui` remains external-host focused and repo-maintainer commands stay in `.agents/skills` and maintenance docs.
    - 4-Parallel Subagent Review: Completed. Lane 1 planning guardrails found no issues; lane 2 recipe location found no issues and noted only future `docs/recipes/` references outside active guidance; lane 3 review/maintenance docs found no issues; lane 4 found the public-skill leakage guard was too narrow, fixed by extending `test/agent-ui-skill.test.ts` and `test/repository-skills.test.ts`.
    - Commit: `1d83d396e91df305b496202fa0e98df6c67d510d`
    - Push: pushed `1d83d396e91df305b496202fa0e98df6c67d510d` and `1bd6df0b7c64d3a873f547e03185663febd5bd96` to `origin/codex/new-adopter-onboarding-plan`
    - PR/CI: PR #42 checks passed for pushed P004 commits: Detect changes, Detect compatibility changes, Repository policy, Typecheck, Lint, Unit tests, API snapshots, Package resolution, Package validation, Protocol and fixtures, Playwright fixtures, and Real local smoke. Compatibility matrix jobs were skipped by path filters.
  - Tasks:
    - [x] T011 Add new-adopter onboarding/docs/skills/examples synchronization as a planning and review concern.
      - Expected files/areas: feature-planning and review skills.
      - Validation note: Include public skill and package README in the expected inspection surface.
    - [x] T012 Correct example-authoring wording around recipe locations and topic-based recipe indexes.
      - Expected files/areas: `.agents/skills/example-authoring/SKILL.md`.
      - Validation note: Do not point agents to non-existent `docs/recipes/` as an active destination.
    - [x] T013 Update repo skill tests to assert public-skill/docs alignment expectations.
      - Expected files/areas: `test/repository-skills.test.ts`.
      - Validation note: Keep tests deterministic and text-based.

- [x] P005 Bridge, upload, and React waiting-state hardening
  - Goal: Make package behavior match the safer docs and clean public API contract.
  - Scope: Server bridge policy validation, upload session cleanup, React blocked reason API, docs, snapshots, changesets.
  - Expected files/areas: `packages/server/src/websocket.ts`, `packages/server/test/websocket.test.ts`, `packages/server/src/upload.ts`, `packages/server/test/upload.test.ts`, `packages/react/src/hooks/composer.ts`, `packages/react/src/hooks/composer-types.ts`, React tests, `docs/reference/server-bridge.md`, `docs/reference/hooks.md`, `docs/guides/attachments.md`, `docs/reference/package-exports.md`, `.changeset/*`.
  - Validation: focused Vitest for server/react; `bun run test:api-snapshots`; `bun run test:package-resolution`; `bun run validate:packages`; `bun run test:e2e:real-local`.
  - Review: Security/API review focusing on pre-spawn rejection, cleanup scope, and public result semantics.
  - 4-Parallel Subagent Review: Run four independent subagent review lanes for this phase after validation and before commit.
  - Commit: `a854cb8a9a7d7dd3c1f7d7e368f0c590185bfb2a` - Harden bridge upload and composer states
  - Push: pending
  - PR/CI: pending
  - Evidence:
    - Implementation: Bridge preflight now rejects invalid top-level `browserMethodPolicy` values before admission/spawn, including invalid resolver-returned policies, while preserving explicit `productized`, `all`, and valid capability policies.
    - Implementation: Upload TTL cleanup now deletes only Agent UI marked managed sessions, skips live helper sessions in the same process, preserves unmanaged/malformed/symlink-marker directories, and does not convert existing unmarked host directories into managed deletion targets.
    - Implementation: React blocked send results now expose `AgentComposerBlockedReason`, propagate concrete waiting reasons across active waiting and resume-to-waiting paths, and use generic pending-input UI copy for non-approval waits.
    - Implementation: Updated server/react docs, public `skills/agent-ui` upload guidance, API snapshots, and `.changeset/quiet-bridges-clean.md`.
    - Validation: `bunx vitest run packages/server/test/websocket.test.ts packages/server/test/upload.test.ts packages/react/test/components.vitest.tsx packages/react/test/source-structure.vitest.ts test/agent-ui-skill.test.ts test/repository-skills.test.ts` passed after final fixes.
    - Validation: `bun run --cwd packages/server typecheck && bun run --cwd packages/react typecheck` passed.
    - Validation: `bun run build:packages && bun run test:api-snapshots:update && bun run test:api-snapshots` passed; snapshots were regenerated by script.
    - Validation: `bun run test` passed: 65 files, 737 tests.
    - Validation: `bun run lint` passed with 4 existing `react-hooks/exhaustive-deps` warnings in `packages/react/src/hooks/composer.ts`.
    - Validation: `bun run test:package-resolution` passed.
    - Validation: `bun run validate:packages` passed when rerun alone; an earlier parallel run with `test:package-resolution` failed because both commands concurrently cleaned package `dist` output.
    - Validation: `bun run test:e2e:real-local` passed: 20 Playwright tests.
    - Validation: `bunx changeset status --verbose` reported patch bumps for `@nyosegawa/agent-ui-react` and `@nyosegawa/agent-ui-server` from `.changeset/quiet-bridges-clean.md`.
    - Validation: `git diff --check` passed.
    - Review: Manual review confirmed the bridge rejection path runs before admission/spawn, upload cleanup remains host-boundary safe, React blocked result semantics match core waiting reasons, public skill guidance is updated, and API snapshots include the new public types/rejection reason.
    - 4-Parallel Subagent Review: Completed after final validation. Lane 1 found no bridge/security findings. Lane 2 found live managed sessions could be TTL-deleted by another helper and public upload skill guidance was stale; fixed with a process-local active managed-session registry, tests, docs, and skill updates. Lane 3 found resume-to-waiting `sendMessage()` returned `unknown`; fixed by propagating `waitingReasons` through resume/turn-start results, adding a resume-blocked test, and regenerating snapshots. Lane 4 found no release/docs/validation findings.
    - Commit: `a854cb8a9a7d7dd3c1f7d7e368f0c590185bfb2a` - Harden bridge upload and composer states.
    - Push:
  - Tasks:
    - [x] T014 Reject invalid top-level `browserMethodPolicy` values before spawn, including values returned by `resolveBridgeOptions`.
      - Expected files/areas: server websocket implementation/tests.
      - Validation note: Include unknown string, malformed object, valid `"productized"`, `"all"`, and valid capability object cases.
    - [x] T015 Restrict upload TTL cleanup to Agent UI managed session directories.
      - Expected files/areas: server upload implementation/tests.
      - Validation note: Preserve unrelated stale directories; remove managed stale sessions; preserve current managed sessions; ignore malformed marker/symlink cases.
    - [x] T016 Expand React composer blocked reasons to reflect core waiting reasons.
      - Expected files/areas: React composer types/implementation/tests, hooks docs, package exports docs.
      - Validation note: UI display may stay generic, but controller results must distinguish reasons.
    - [x] T017 Add required changesets and regenerate API snapshots through scripts if public types change.
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

- [x] T001 Add or integrate a first-host-app guide.
  - Expected files/areas: docs guide plus README/docs index links.
  - Validation note: Check snippets use public imports only.
- [x] T002 Add React entrypoint decision table.
  - Expected files/areas: `docs/guides/react.md`, `docs/guides/host-integration.md`.
  - Validation note: Avoid `useAgentContext().state` and `internal` as host guidance.
- [x] T003 Reframe getting-started for contributor versus adopter setup.
  - Expected files/areas: `docs/getting-started.md`, `docs/installation.md`, `README.md`.
  - Validation note: Full chat path includes server package.

### P002 Recipes and npm package README alignment

- [x] T004 Convert recipes docs to topic index.
  - Expected files/areas: `docs/examples/recipes.md`, `examples/recipes`.
  - Validation note: Cross-links point to runnable or typed examples.
- [x] T005 Add common import tables to package README files.
  - Expected files/areas: `packages/*/README.md`.
  - Validation note: Public imports only.
- [x] T006 Update package exports reference.
  - Expected files/areas: `docs/reference/package-exports.md`.
  - Validation note: Match package manifests.

### P003 Public Agent Skill new-adopter refresh

- [x] T007 Prioritize new-adopter triggers.
  - Expected files/areas: public skill entry and metadata.
  - Validation note: Keep `SKILL.md` routing-focused.
- [x] T008 Add safe first-app bridge skeletons.
  - Expected files/areas: local single-user and server bridge references.
  - Validation note: Root server APIs by default.
- [x] T009 Harden upload examples.
  - Expected files/areas: public skill uploads reference and attachments guide.
  - Validation note: Assert with `test:skills`.
- [x] T010 Expand external validation checklist.
  - Expected files/areas: public skill validation reference.
  - Validation note: No repo-only commands.

### P004 Repository skill and planning/review guardrails

- [x] T011 Add onboarding sync to planning/review skills.
  - Expected files/areas: feature-planning and review skills.
  - Validation note: Include docs/examples/public-skill/package README.
- [x] T012 Correct recipe location wording.
  - Expected files/areas: example-authoring skill.
  - Validation note: Use current recipe destinations.
- [x] T013 Update repo skill tests.
  - Expected files/areas: `test/repository-skills.test.ts`.
  - Validation note: Deterministic text assertions.

### P005 Bridge, upload, and React waiting-state hardening

- [x] T014 Reject invalid `browserMethodPolicy`.
  - Expected files/areas: server websocket implementation/tests.
  - Validation note: Reject before spawn.
- [x] T015 Restrict upload cleanup to managed sessions.
  - Expected files/areas: server upload implementation/tests.
  - Validation note: Preserve unrelated directories.
- [x] T016 Expand React blocked reasons.
  - Expected files/areas: React composer code/tests/docs.
  - Validation note: Match core waiting reasons.
- [x] T017 Add changesets and regenerate API snapshots.
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

- P001: `bunx vitest run test/package-scripts-docs.test.ts test/ci-workflow-policy.test.ts` passed.
- P001: `bunx vitest run test/docs-staleness.test.ts` passed.
- P001 PR #42 checks passed after push: Detect changes, Detect compatibility changes, Repository policy, Typecheck, Lint, and Unit tests. API snapshots, package resolution, package validation, protocol/fixtures, Playwright fixtures, real-local smoke, and compatibility matrix jobs were skipped by path filters.
- P002: `bun run test:package-resolution` passed.
- P002: `bun run validate:packages` passed with existing non-failing publint repository URL suggestions.
- P002: `bun run --cwd examples/recipes typecheck` passed.
- P002: `bun run --cwd examples/recipes build` passed.
- P002: `bunx changeset status --verbose` passed and reports patch bumps for the five public packages touched by npm-facing README changes.
- P002: `bunx vitest run test/package-scripts-docs.test.ts test/ci-workflow-policy.test.ts test/docs-staleness.test.ts` passed.
- P002: `node .agents/skills/agent-ui-feature-planning/scripts/validate-artifacts.mjs .agent-work/features/2026-06-30-new-adopter-onboarding` passed.
- P002 PR #42 checks passed after push: Detect changes, Detect compatibility changes, Repository policy, Typecheck, Lint, Unit tests, API snapshots, Package resolution, Package validation, Protocol and fixtures, Playwright fixtures, and Real local smoke. Compatibility matrix jobs were skipped by path filters.
- P003: `bun run test:skills` passed.
- P003: `bunx vitest run test/package-scripts-docs.test.ts test/ci-workflow-policy.test.ts test/docs-staleness.test.ts` passed.
- P003: forbidden maintainer-command/gate search over `skills/agent-ui` and `docs/guides/attachments.md` returned no matches.
- P003: `git diff --check` passed.
- P003: `node .agents/skills/agent-ui-feature-planning/scripts/validate-artifacts.mjs .agent-work/features/2026-06-30-new-adopter-onboarding` passed.
- P003 PR #42 checks passed after push: Detect changes, Detect compatibility changes, Repository policy, Typecheck, Lint, Unit tests, API snapshots, Package resolution, Package validation, Protocol and fixtures, Playwright fixtures, and Real local smoke. Compatibility matrix jobs were skipped by path filters.
- P004: `bun run test:repo-skills` passed.
- P004: `bun run test:skills` passed.
- P004: forbidden maintainer-command/gate search over `skills/agent-ui` returned no matches.
- P004: `git diff --check` passed.
- P004: `node .agents/skills/agent-ui-feature-planning/scripts/validate-artifacts.mjs .agent-work/features/2026-06-30-new-adopter-onboarding` passed.
- P004 PR #42 checks passed after push: Detect changes, Detect compatibility changes, Repository policy, Typecheck, Lint, Unit tests, API snapshots, Package resolution, Package validation, Protocol and fixtures, Playwright fixtures, and Real local smoke. Compatibility matrix jobs were skipped by path filters.
- P005: `bunx vitest run packages/server/test/websocket.test.ts packages/server/test/upload.test.ts packages/react/test/components.vitest.tsx packages/react/test/source-structure.vitest.ts test/agent-ui-skill.test.ts test/repository-skills.test.ts` passed.
- P005: `bun run --cwd packages/server typecheck && bun run --cwd packages/react typecheck` passed.
- P005: `bun run build:packages && bun run test:api-snapshots:update && bun run test:api-snapshots` passed.
- P005: `bun run test` passed: 65 files, 737 tests.
- P005: `bun run lint` passed with 4 existing React hook dependency warnings.
- P005: `bun run test:package-resolution` passed.
- P005: `bun run validate:packages` passed on standalone rerun; an earlier parallel run with `test:package-resolution` hit a shared `dist` cleanup race.
- P005: `bun run test:e2e:real-local` passed: 20 tests.
- P005: `bunx changeset status --verbose` reported patch bumps for `@nyosegawa/agent-ui-react` and `@nyosegawa/agent-ui-server` from `.changeset/quiet-bridges-clean.md`.
- P005: `git diff --check` passed.

## Review Evidence

- Planning research used four subagent lanes: docs onboarding, implementation/public surface, validation/CI, and skill design.
- P001 used four subagent review lanes after validation: information architecture, public package/API correctness, bridge/security boundary, and docs validation/link/TODO evidence.
- P002 used four subagent review lanes after validation: recipe topic index, public import correctness, package boundary/changeset, and validation/TODO evidence. Lane 1 found non-clickable recipe entries and lane 4 requested TODO evidence updates; both were fixed before commit.
- P003 used four subagent review lanes after validation: trigger/metadata, bridge first-app safety, upload/attachments safety, and validation/test leakage. Upload optional URL validation and public-skill maintainer-command leakage findings were fixed before commit.
- P004 used four subagent review lanes after validation: feature-planning guardrails, example-authoring recipe destinations, review/maintenance docs, and tests/public-skill leakage. Lane 4 found the public-skill leakage guard was too narrow; this was fixed before commit by extending public skill and repository skill tests.
- P005 used four subagent review lanes after final validation: server bridge security, upload ownership/cleanup safety, React composer waiting-state API/UI, and release/docs/validation evidence. Lane 2 found active managed sessions could be TTL-deleted by another helper and stale public upload skill guidance; both were fixed. Lane 3 found resume-to-waiting sends returned `unknown`; fixed by propagating waiting reasons through resume results and adding coverage. Lanes 1 and 4 found no blocking issues.

## Commit Log

- `211c00c38fb5b99f7bdfa348fc1a6558e6dc37f7` - Plan new adopter onboarding overhaul
- `bef201296285e3d8a025315fdf5880d8b07f68e8` - Add phase subagent review checkpoints
- `014ce7b5f0e36ad917af2650d2ba77b892cc8ec3` - Add first host app onboarding guide
- `ce002c9e7542a853d2e48f3e669ca1550a4d1f08` - Align recipe and package README guidance
- `09c4bcd494f64ef7efbb59945021874b10b45869` - Refresh public Agent UI onboarding skill
- `0eddec96a9dc66aba182aefa47f51ffbc7295158` - Record P003 onboarding evidence
- `05034dabf25e53a94dfd932614d414c28547269a` - Record P003 CI evidence
- `1d83d396e91df305b496202fa0e98df6c67d510d` - Add onboarding sync guardrails
- `1bd6df0b7c64d3a873f547e03185663febd5bd96` - Record P004 onboarding evidence
- `04f2e411cc5ab88c921e8a577dcd2e8f85b08680` - Record P004 CI evidence
- `a854cb8a9a7d7dd3c1f7d7e368f0c590185bfb2a` - Harden bridge upload and composer states

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
