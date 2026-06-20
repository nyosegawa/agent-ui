# Research

## Scope

- Feature/problem: remove compatibility-shaped names and deprecated upstream details from Agent UI public product surfaces while preserving protocol intake at adapter boundaries.
- Canonical artifact directory: `.agent-work/features/2026-06-21-compatibility-surface-cleanup/`
- Planning date: 2026-06-21
- Requested outcome: plan all compatibility cleanup work on the current branch, without implementing it in this planning turn.

## Freshness Check

- Manifest path: `.agents/skills/agent-ui-feature-planning/references/freshness-manifest.json`
- Last full research commit: `499a9020c1613923ae547411ad930e0bcefb8ed9`
- Current commit: `78fe84ed8f23f95a057e14200dcc72929c110a3a`
- Watched input result: `refresh-needed`
- Refresh mode: targeted refresh
- Files or globs refreshed: `docs/architecture/testing.md`, `docs/reference/package-exports.md`, `docs/architecture/*.md`, `docs/reference/*.md`
- Manifest updated: no
- Notes: targeted refresh was sufficient because package-boundary and validation docs changed but repo structure, package layout, CI model, and protected-file rules remain recognizable.

## Investigation Method

- Repo root: `/Users/sakasegawa/.codex/worktrees/8ccc/agent-ui`
- Subagents used: four explorer subagents.
- Research rounds: three planned rounds. Rounds 1 and 2 completed before the artifact hardening pass; Round 3 reviews this updated package.
- Main-agent inspections: protocol docs, package export docs, core server-request state/selectors, Codex normalizers/request builders/stable type exports, React approval rendering/tests, raw JSON-RPC fixture tests, generated schema diff from PR #33.
- Web/current research: skipped intentionally; the plan depends on checked-out repo code and vendored upstream schema already refreshed in PR #33, not external live facts.

## Subagent Rounds

### Round 1

- Lane: approval compatibility cleanup.
- Prompt/source: explorer subagent `019ee6ca-ec44-73c2-a79e-911d3b7dcf62`.
- Findings: remove `legacyExecApproval` / `legacyPatchApproval` from public core/React kinds; keep `execCommandApproval` / `applyPatchApproval` in generated protocol and normalize them to canonical command/file approval kinds. Add payload display coverage for legacy `command: string[]`.
- Follow-up needed: server policy tests must prove legacy upstream methods still route to command/file callbacks after kind collapse.

- Lane: path compatibility cleanup.
- Prompt/source: explorer subagent `019ee6cb-029a-7173-9472-bc4ace496ce8`.
- Findings: prefer low-churn Agent UI-owned string aliases over object wrappers; `stable-types` remains a generated/raw exception; request-builders are the preferred product boundary and should hide generated path names.
- Follow-up needed: decide whether `clients`/`session` result types are generated-backed advanced facades or raw-free product view models.

- Lane: deprecated/raw protocol fallback cleanup.
- Prompt/source: explorer subagent `019ee6cb-130c-79f2-a5e6-8b01f4175996`.
- Findings: keep `item/fileChange/outputDelta` as a mapped compatibility fallback, keep `thread/compacted` raw, keep MCP/resource/account/config/model deprecated names generated-only or view-adapter-only.
- Follow-up needed: add source-structure guards rather than relying only on docs.

- Lane: public API/package/docs/release validation.
- Prompt/source: explorer subagent `019ee6cb-2283-7292-b196-b3d0f303e7ac`.
- Findings: unchanged export maps still need declaration snapshot review; add changeset bump guidance, `validate:release`, and `rg` sweeps. Prefer schema-only PR #33 plus follow-up cleanup PR, or explicitly rewrite PR #33 scope if stacked.
- Follow-up needed: refine P004 with exact bump levels and final CI evidence requirements.

### Round 2

- Lane: approval cross-check.
- Prompt/source: same approval explorer with Round 1 findings from other lanes.
- Findings: add `conversationId -> threadId` compatibility only at legacy payload normalization; add raw JSONL fixture for legacy approval methods; add server policy callback tests; examples likely need only verified-no-change evidence.
- Follow-up needed: implementation must preserve method provenance only if needed in payload/diagnostics, not as public kind.

- Lane: path cross-check.
- Prompt/source: same path explorer with other lane findings.
- Findings: treat `clients` and `session` as generated-backed advanced protocol facades for result types; `/request-builders` is the raw-free preferred request boundary. Add `packages/codex/src/index.ts`, `auth.ts`, React input/resource files, server upload docs/tests, and `docs/guides/attachments.md` to scope.
- Follow-up needed: add public-surface tests that disallow path compatibility names only in preferred facades, not generated stable-types.

- Lane: deprecated/fallback cross-check.
- Prompt/source: same deprecated/fallback explorer with other lane findings.
- Findings: add source-structure guards for `mcpAppResourceUri`, `McpElicitationLegacyTitledEnumSchema`, `additionalSpeedTiers`, `legacyManagedConfig*`, raw rate-limit compatibility names, and path legacy names in public core/react declarations. Include `packages/react/src/components/status-formatting.ts`.
- Follow-up needed: keep `item/fileChange/outputDelta` mapped as fallback, not raw.

- Lane: release/package cross-check.
- Prompt/source: same release explorer with all implementation findings.
- Findings: recommend major bumps for core/react/codex when public union members and normalizer output change; final gate should include `bun run validate:release`; if cleanup stays stacked on PR #33, PR title/body must be rewritten as schema plus breaking cleanup.
- Follow-up needed: plan should include PR split decision before implementation commits.

### Round 3

- Lane: final artifact review.
- Prompt/source: four explorer subagents reviewed updated artifacts.
- Findings: approval lane ready; path lane ready; deprecated fallback lane ready; release/package/docs/validation lane ready.
- Follow-up needed: no blocking omissions or contradictions found. Re-run artifact validator, then commit/push updated plan.

## Sources Inspected

- `AGENTS.md`
- `docs/architecture/product-boundary.md`
- `docs/architecture/testing.md`
- `docs/reference/package-exports.md`
- `docs/reference/react-protocol-coverage.md`
- `docs/reference/codex-protocol.md`
- `packages/core/src/state/server-requests.ts`
- `packages/core/src/selectors.ts`
- `packages/codex/src/normalizers/server-requests.ts`
- `packages/codex/src/normalizers/notification-coverage.ts`
- `packages/codex/src/request-builders.ts`
- `packages/codex/src/method-params.ts`
- `packages/codex/src/stable-types.ts`
- `packages/codex/src/index.ts`
- `packages/codex/src/auth.ts`
- `packages/codex/src/clients.ts`
- `packages/codex/src/session.ts`
- `packages/codex/src/normalizers/items.ts`
- `packages/codex/src/normalizers/shared.ts`
- `packages/react/src/usage.ts`
- `packages/react/src/components/status-formatting.ts`
- `packages/react/src/request-options.ts`
- `packages/react/src/resources.ts`
- `packages/react/src/agent-input.ts`
- `packages/server/src/server-request-policy.ts`
- `packages/server/src/upload.ts`
- `packages/react/src/components/approvals.tsx`
- `packages/react/test/components.vitest.tsx`
- `packages/codex/test/protocol.test.ts`
- `packages/codex/test/raw-jsonrpc-fixtures.test.ts`
- `packages/codex/test/public-surface.test.ts`
- `packages/codex/test/session-api.test.ts`
- `packages/codex/test/type-tests/protocol-types.ts`
- `packages/server/test/websocket.test.ts`
- `packages/server/test/upload.test.ts`
- `packages/react/test/source-structure.vitest.ts`
- `packages/react/test/usage.vitest.ts`
- `packages/react/test/status-formatting.vitest.ts`
- `test/api-snapshots/*.d.ts`
- Relevant skills: `.agents/skills/agent-ui-feature-planning/SKILL.md`, `.agents/skills/codex-upstream-sync/references/protocol-review.md`
- Relevant workflows/scripts: `.agents/skills/agent-ui-feature-planning/scripts/check-freshness.mjs`, `scripts/check-api-snapshots.mjs`
- Web/current sources: none.

## Findings

- Approval compatibility currently leaks into public core state as `legacyExecApproval` and `legacyPatchApproval`, and React explicitly treats them as first-class approval kinds.
- Legacy approval payload shapes differ from current methods: `execCommandApproval.command` is an array, and legacy IDs may use `conversationId`; the cleanup must normalize/display these without preserving legacy public kinds.
- Upstream generated schema now exposes `LegacyAppPathString` in stable and experimental types. Generated files must not be hand-edited, but Agent UI product APIs can define their own path boundary.
- `@nyosegawa/agent-ui-codex/stable-types` intentionally re-exports generated schema, so upstream legacy names may remain there. Higher-level request builders, normalizers, core, React, and server helper APIs should not make those names the preferred product contract.
- `@nyosegawa/agent-ui-codex/clients` and `/session` should be documented as generated-backed advanced protocol facades for result types, while `/request-builders` should be treated as the preferred request construction boundary.
- Deprecated or compatibility protocol surfaces already exist: `item/fileChange/outputDelta`, `thread/compacted`, `mcpAppResourceUri`, `McpElicitationLegacyTitledEnumSchema`, account rate-limit single-bucket compatibility views, and managed-config legacy source names.
- Additional generated-only or fallback-only surfaces include `additionalSpeedTiers`, `legacyManagedConfig*`, `rateLimitsByLimitId` / `rate_limits_by_limit_id`, and `LegacyAppPathString` / `AbsolutePathBuf` outside preferred facades.
- Some compatibility surfaces are protocol evidence or host-only config and should remain raw or fallback-only, not become React lifecycle or product state.

## Repo Guidance Findings

- Agent UI must remain a reusable Codex App Server UI library; host auth, persistence, process lifecycle, deployment, billing, and workspace isolation stay host-owned.
- Public API changes require docs, tests, API snapshots, package-resolution evidence, and release impact assessment.
- Use Bun for package operations.
- Do not edit `third_party/codex`.
- Do not hand-edit generated schema or dist output.
- Continue on the current branch because the user explicitly requested it.

## Architecture / Boundary Findings

- Agent UI-owned: normalized server-request kinds, core public state, React approval UI, Codex request-builder facade, path/resource view models, public docs and examples.
- Host-owned: raw filesystem selection, remote path authority, config source policy, billing/account mutation, MCP tool policy, auth and bridge admission.
- Protected: `third_party/codex`, `packages/codex/src/generated/**`, compiled `dist/**`.
- Release-sensitive: public core/react/codex declaration changes and API snapshots.

## Validation / CI Findings

- Required focused gates: `bun run test:protocol`, `bun run typecheck`, `bun run lint`, `bun run test:api-snapshots`, `bun run test:package-resolution`.
- Final release gate: `bun run validate:release`.
- Public API cleanup should also run focused core/react tests for server requests and approvals, plus package validation before claiming release readiness.
- API snapshots must be intentionally updated after reviewing declaration changes.
- API snapshot flow should build first, inspect failure, run `bun run test:api-snapshots:update`, review snapshot diff, then rerun `bun run test:api-snapshots`.
- Browser-visible approval changes should run relevant React component tests; Playwright fixture smoke is useful if rendered approval text or placement changes.

## Existing Skill / Command Findings

- The feature-planning skill requires artifacts under `.agent-work/features/<date>-<slug>/` and a phase-first `todo.md`.
- Current branch is `codex-upstream/64bdeed9f7ad`; planning and implementation should stay on this branch per user request.

## Web / Current-State Findings

- Live web research skipped; no current external API, package registry, or GitHub Actions fact is needed for this plan.

## Freshness / Staleness Findings

- Freshness helper reported targeted refresh needed for testing and package export docs.
- The inspected current docs provide enough up-to-date validation and package-boundary guidance for this plan.
- Manifest was not updated because this planning run should not mutate skill baseline metadata.

## Generated / Vendored / Protected File Findings

- Generated schema changes from PR #33 include `LegacyAppPathString` and changed path-bearing generated fields.
- Implementation must not edit generated schema by hand.
- The plan should add hand-written Agent UI path abstractions and adapters around generated types instead of changing generated files.

## Risks

- Renaming public approval kinds is a breaking API change even if no users exist yet; changesets and API snapshots must capture it.
- A too-broad path URI migration could accidentally move host-owned path authority into core.
- Removing deprecated protocol input handling entirely could break raw fixture coverage or App Server compatibility; keep fallback intake until upstream removes methods.
- Hidden generated type re-exports may still expose legacy names through `stable-types`; this should be documented as generated-only, not treated as product API failure.
- Stacking breaking cleanup onto PR #33 risks hiding a public API cleanup inside an upstream schema refresh; implementation should prefer a follow-up PR after #33 or explicitly rewrite PR #33 scope.

## Decisions

- Keep generated schema and `stable-types` generated subpath faithful to upstream.
- Remove `legacy...` approval names from core/React public product kinds by mapping old upstream methods to canonical `commandApproval` and `fileChangeApproval`.
- Introduce low-churn Agent UI-owned path aliases for product request surfaces, and convert generated legacy string paths at normalizer/request-builder boundaries.
- Treat `clients` and `session` result types as generated-backed advanced protocol facades unless a later phase explicitly designs raw-free result view models.
- Keep deprecated notifications and fields as raw/fallback protocol intake only, with tests that they do not become product lifecycle behavior.
- Add changeset coverage because public npm declarations will change. Default to major bumps for core/react/codex if public union members or normalizer output shapes are removed/renamed; document any deliberate pre-1.0 minor policy exception.

## Rejected Approaches

- Do not edit generated schema to rename `LegacyAppPathString`.
- Do not keep `legacyExecApproval` / `legacyPatchApproval` as public kinds just because upstream still emits old methods.
- Do not introduce a fake `PathUri = string` product API without parse/format rules.
- Do not delete deprecated protocol intake before upstream stable schema removes it.

## Remaining Unknowns

- Exact Agent UI path alias names need final implementation choice, but Round 2 recommends low-churn aliases such as `AgentLocalPath = string`, not object wrappers or opaque brands.
- Whether `stable-types` should remain documented as generated/raw-only or be moved further away from normal docs needs review.
- Whether the cleanup should be stacked on PR #33 or split into a follow-up PR after #33 merges is a process decision; the user requested staying on this branch for planning.
