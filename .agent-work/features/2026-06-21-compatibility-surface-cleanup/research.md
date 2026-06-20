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
- Subagents used: none; the same repo guidance, implementation surface, validation, and skill-design lanes were researched sequentially by the main agent.
- Research rounds: one targeted round.
- Main-agent inspections: protocol docs, package export docs, core server-request state/selectors, Codex normalizers/request builders/stable type exports, React approval rendering/tests, raw JSON-RPC fixture tests, generated schema diff from PR #33.
- Web/current research: skipped intentionally; the plan depends on checked-out repo code and vendored upstream schema already refreshed in PR #33, not external live facts.

## Subagent Rounds

### Round 1

- Lane: repo guidance, implementation surface, validation, and public-boundary review.
- Prompt/source: `.agents/skills/agent-ui-feature-planning/SKILL.md` and referenced planning policy files.
- Findings: compatibility names are visible in core/React approval kinds and Codex generated type subpaths; path and deprecated protocol details can be hidden from product surfaces without editing generated schema.
- Follow-up needed: implementation should run an independent review after each phase because this is public API cleanup.

### Round 2

- Lane: not run.
- Prompt/source: not applicable.
- Findings: not applicable.
- Follow-up needed: not applicable.

### Round 3

- Lane: not run.
- Prompt/source: not applicable.
- Findings: not applicable.
- Follow-up needed: not applicable.

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
- `packages/react/src/components/approvals.tsx`
- `packages/react/test/components.vitest.tsx`
- `packages/codex/test/protocol.test.ts`
- `packages/codex/test/raw-jsonrpc-fixtures.test.ts`
- `test/api-snapshots/*.d.ts`
- Relevant skills: `.agents/skills/agent-ui-feature-planning/SKILL.md`, `.agents/skills/codex-upstream-sync/references/protocol-review.md`
- Relevant workflows/scripts: `.agents/skills/agent-ui-feature-planning/scripts/check-freshness.mjs`, `scripts/check-api-snapshots.mjs`
- Web/current sources: none.

## Findings

- Approval compatibility currently leaks into public core state as `legacyExecApproval` and `legacyPatchApproval`, and React explicitly treats them as first-class approval kinds.
- Upstream generated schema now exposes `LegacyAppPathString` in stable and experimental types. Generated files must not be hand-edited, but Agent UI product APIs can define their own path boundary.
- `@nyosegawa/agent-ui-codex/stable-types` intentionally re-exports generated schema, so upstream legacy names may remain there. Higher-level request builders, normalizers, core, React, and server helper APIs should not make those names the preferred product contract.
- Deprecated or compatibility protocol surfaces already exist: `item/fileChange/outputDelta`, `thread/compacted`, `mcpAppResourceUri`, `McpElicitationLegacyTitledEnumSchema`, account rate-limit single-bucket compatibility views, and managed-config legacy source names.
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
- Public API cleanup should also run focused core/react tests for server requests and approvals, plus package validation before claiming release readiness.
- API snapshots must be intentionally updated after reviewing declaration changes.
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

## Decisions

- Keep generated schema and `stable-types` generated subpath faithful to upstream.
- Remove `legacy...` approval names from core/React public product kinds by mapping old upstream methods to canonical `commandApproval` and `fileChangeApproval`.
- Introduce Agent UI-owned path representation or branded type for product surfaces, and convert generated legacy string paths at normalizer/request-builder boundaries.
- Keep deprecated notifications and fields as raw/fallback protocol intake only, with tests that they do not become product lifecycle behavior.
- Add changeset coverage because public npm declarations will change.

## Rejected Approaches

- Do not edit generated schema to rename `LegacyAppPathString`.
- Do not keep `legacyExecApproval` / `legacyPatchApproval` as public kinds just because upstream still emits old methods.
- Do not introduce a fake `PathUri = string` product API without parse/format rules.
- Do not delete deprecated protocol intake before upstream stable schema removes it.

## Remaining Unknowns

- Exact Agent UI path shape needs final implementation choice: branded string, `AgentLocalPath`, or object with `{ kind, value, displayPath }`.
- Whether `stable-types` should remain documented as generated/raw-only or be moved further away from normal docs needs review.
- Whether the cleanup should be stacked on PR #33 or split into a follow-up PR after #33 merges is a process decision; the user requested staying on this branch for planning.
