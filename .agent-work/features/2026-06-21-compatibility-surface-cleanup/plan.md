# Plan

## Summary

Clean up compatibility-shaped public surfaces before Agent UI has consumers. Keep upstream compatibility at the Codex adapter boundary, but expose canonical Agent UI-owned concepts in core, React, request builders, docs, and examples.

## Background

The current upstream sync branch refreshed Codex App Server schema to `64bdeed9f7adbe60c725153b3fb74ed044a36221`. The generated schema now includes `LegacyAppPathString`, while Agent UI already exposes legacy approval kinds from older App Server request methods. The user wants to remove compatibility baggage instead of preserving unneeded backward compatibility.

## Current State

- Approval methods `execCommandApproval` and `applyPatchApproval` normalize to public core kinds `legacyExecApproval` and `legacyPatchApproval`.
- React approval UI and tests explicitly treat those legacy kinds as visible approvals.
- Generated `LegacyAppPathString` appears in `stable-types` and declaration snapshots.
- Product surfaces mostly use `string` for cwd, but request-builder declarations can expose generated path names.
- Deprecated notifications and fields are currently mapped, raw, or fixture-isolated, but docs and tests still mention compatibility behavior.
- `clients` and `session` expose generated-backed result types today; that is acceptable if documented as an advanced protocol facade rather than a raw-free view-model layer.
- Some docs currently present compatibility inputs as product categories, especially approval docs and protocol lifecycle lists.

## Goals

- Replace public `legacyExecApproval` and `legacyPatchApproval` kinds with canonical `commandApproval` and `fileChangeApproval`.
- Introduce an Agent UI-owned path boundary so product APIs do not prefer upstream `LegacyAppPathString`.
- Keep deprecated upstream inputs accepted at the protocol boundary but normalize them into current product concepts or raw diagnostics.
- Document generated-only compatibility names versus product API names.
- Add tests that prevent compatibility names from re-entering core/React public surfaces.
- Add source-structure/API guard tests that separate generated-only compatibility names from preferred product declarations.
- Preserve fallback handling for upstream deprecated inputs where App Server may still emit them.
- Add changeset and API snapshot updates for npm-facing changes.

## Non-Goals

- Do not edit `third_party/codex`.
- Do not hand-edit `packages/codex/src/generated/**`.
- Do not remove generated schema exports from `stable-types`.
- Do not implement remote path authority, filesystem validation, auth, persistence, or host workflow policy in Agent UI core.
- Do not productize deprecated notifications such as `thread/compacted`; keep `item/fileChange/outputDelta` only as a mapped compatibility output fallback.

## Repo-Specific Constraints

- Agent UI is a reusable Codex App Server UI component library, not a hosted runtime.
- Host applications own auth, persistence, routing, process lifecycle, deployment, billing, workspace isolation, upload storage, and workflow state.
- Use Bun for repository package operations.
- Do not edit the vendored Codex submodule directly.
- Do not hand-edit auto-created schema files or compiled artifacts.
- Public API changes require docs, tests, API snapshots, package-resolution evidence, and a changeset.

## Design Decisions

- Approval canonicalization: map both legacy and current command/file approval methods to the same public core kinds. Preserve original method only in payload or diagnostic metadata if needed for auditing. Normalize legacy `conversationId` to `threadId` only when `threadId` is absent, and handle legacy `command: string[]` display without exposing a legacy kind.
- Path boundary: define low-churn Agent UI-owned string aliases in hand-written source, then normalize incoming generated path strings into those aliases. Keep raw string serialization when sending requests to Codex. Avoid object wrappers or branded strings unless implementation finds an actual runtime guarantee to encode.
- Generated subpath exception: allow `@nyosegawa/agent-ui-codex/stable-types` to expose upstream-generated compatibility names because it is explicitly raw/generated schema.
- Generated-backed facade decision: treat `@nyosegawa/agent-ui-codex/clients` and `/session` result types as advanced protocol facades that can track generated response schemas; treat `/request-builders` as the preferred request-construction boundary that should hide generated path names.
- Deprecated protocol handling: keep intake for `item/fileChange/outputDelta`, `thread/compacted`, `mcpAppResourceUri`, and legacy MCP enum schemas, but classify them as mapped fallback, raw, or generated-only as appropriate. Do not normalize deprecated top-level MCP resource fields unless they feed a canonical current field whose primary source is `appContext.resourceUri`.
- Documentation: use docs to explain adapter-boundary compatibility, not to advertise legacy names as product APIs.
- Release strategy: prefer keeping PR #33 schema-only and landing this cleanup in a follow-up PR. If implementation stays stacked on PR #33, rewrite PR title/body and evidence to cover schema refresh plus breaking compatibility cleanup.

## Impacted Areas

- Agent UI-owned: `packages/core/src/state/server-requests.ts`, `packages/core/src/selectors.ts`, core reducer tests, React approval components/hooks/tests, Codex normalizers, Codex request-builder facade, public-surface guards, public docs.
- Host-owned: filesystem/path validation, MCP policy, config source interpretation, account billing/credit mutation.
- Protected: `third_party/codex`, `packages/codex/src/generated/**`, `dist/**`.
- Release-sensitive: public declarations in core/react/codex packages, API snapshots, changesets, package resolution, package validation.
- Docs-only: protocol, hooks, React component, approvals guide, attachments guide, server bridge, and package export references after behavior changes.
- Example-only: examples should need updates only if approval or path type names appear in public recipe code; otherwise record verified-no-change evidence.

## Validation Plan

- Focused:
  - `bunx vitest run --config vitest.config.ts packages/codex/test/protocol.test.ts`
  - `bunx vitest run --config vitest.config.ts packages/core/test/reducer.test.ts`
  - `bunx vitest run --config vitest.config.ts packages/react/test/components.vitest.tsx`
  - `bunx vitest run --config vitest.config.ts packages/server/test/websocket.test.ts`
  - `bunx vitest run --config vitest.config.ts packages/react/test/source-structure.vitest.ts packages/react/test/usage.vitest.ts packages/react/test/status-formatting.vitest.ts`
  - `bunx vitest run --config vitest.config.ts packages/codex/test/public-surface.test.ts packages/codex/test/session-api.test.ts packages/codex/test/type-tests/protocol-types.ts`
- Broader:
  - `bun run test:protocol`
  - `bun run typecheck`
  - `bun run lint`
- Browser:
  - Run Playwright fixture approval coverage only if visual approval behavior or placement changes beyond labels/kinds.
  - Run example typechecks if example imports or path/approval recipes change.
- Package/API:
  - `bun run build`
  - `bun run test:api-snapshots` to expose declaration drift.
  - `bun run test:api-snapshots:update` after reviewing declaration changes.
  - `bun run test:api-snapshots`
  - `bun run test:package-resolution`
  - `bun run validate:packages`
  - `bun run validate:release`
- Sweeps:
  - `rg -n "legacyExecApproval|legacyPatchApproval|LegacyAppPathString|McpElicitationLegacy|mcpAppResourceUri|additionalSpeedTiers|legacyManagedConfig|rateLimitsByLimitId|rate_limits_by_limit_id" docs examples packages test/api-snapshots`
  - Allow generated names only in `packages/codex/src/generated/**`, `@nyosegawa/agent-ui-codex/stable-types`, and explicitly documented generated-backed snapshots.
- CI follow-through:
  - Push phase commits and inspect GitHub checks to concrete pass/fail before marking ready.

## Commit, PR, And CI Plan

- Branch: continue on `codex-upstream/64bdeed9f7ad` per user request.
- Phase commit policy: one commit per completed phase after validation and review.
- Task-level fallback policy: split a phase before implementation if declaration churn or behavior changes become too broad.
- PR title/body expectations: prefer a follow-up PR after schema PR #33; if stacked on PR #33, retitle/rewrite the PR from schema-only to combined schema plus breaking compatibility cleanup. Include summary, public API impact, protocol impact, docs impact, changeset, validation, and residual risks.
- Required checks: Repository policy, Typecheck, Lint, Unit tests, Protocol and fixtures, Package validation, API snapshots, Package resolution; Playwright fixtures if path filters run them.
- CI follow-through: watch checks after push; record concrete success/failure in `todo.md`.

## Risks

- Removing public legacy approval kinds changes API snapshots and may require coordinated docs/examples updates.
- Collapsing approval kinds loses public method provenance; preserve original method only in payload/diagnostics if needed, and cover server policy callback behavior.
- Legacy approval payloads differ from current payloads; command array display and file patch payload rendering need explicit tests.
- Path migration can become over-designed; keep first implementation to local/native path product boundary and avoid promising cross-host URI authority.
- Under-cleaning path surfaces can leave `LegacyAppPathString` in request-builders or product docs; over-cleaning can incorrectly remove generated stable-types.
- Deprecated protocol inputs should not be removed if App Server still emits them.
- Updating this branch means the cleanup may be coupled to PR #33 unless later split.

## Completion Criteria

- No public core/react product kind uses `legacyExecApproval` or `legacyPatchApproval`.
- Codex normalizer still accepts old approval method names and maps them to canonical product kinds.
- Server bridge policy still handles legacy upstream approval methods through canonical command/file approval callbacks.
- Product API docs explain generated-only compatibility names and Agent UI-owned path boundary.
- `LegacyAppPathString` and `AbsolutePathBuf` do not appear in preferred request-builder/core/react/server product API declarations outside generated schema surfaces or explicitly documented generated-backed facades.
- Deprecated notification/field handling remains mapped fallback/raw/generated-only as designed and tested.
- Source-structure/API guards prevent compatibility names from returning to public core/react/product docs.
- Changeset exists with explicit package bump rationale.
- `validate:release` passes, focused validation passes, and GitHub checks are followed to a concrete result.

## Open Questions

- Confirm final changeset bump level: Round 2 release review recommends major for core/react/codex if public union members or normalizer output change, unless the repo explicitly chooses a pre-1.0 minor policy.
- Decide whether to keep this work stacked on PR #33 or split after upstream sync merges; preferred is a follow-up PR after PR #33.
