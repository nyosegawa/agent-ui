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

## Goals

- Replace public `legacyExecApproval` and `legacyPatchApproval` kinds with canonical `commandApproval` and `fileChangeApproval`.
- Introduce an Agent UI-owned path boundary so product APIs do not prefer upstream `LegacyAppPathString`.
- Keep deprecated upstream inputs accepted at the protocol boundary but normalize them into current product concepts or raw diagnostics.
- Document generated-only compatibility names versus product API names.
- Add tests that prevent compatibility names from re-entering core/React public surfaces.
- Add changeset and API snapshot updates for npm-facing changes.

## Non-Goals

- Do not edit `third_party/codex`.
- Do not hand-edit `packages/codex/src/generated/**`.
- Do not remove generated schema exports from `stable-types`.
- Do not implement remote path authority, filesystem validation, auth, persistence, or host workflow policy in Agent UI core.
- Do not productize deprecated notifications such as `thread/compacted` or `item/fileChange/outputDelta`.

## Repo-Specific Constraints

- Agent UI is a reusable Codex App Server UI component library, not a hosted runtime.
- Host applications own auth, persistence, routing, process lifecycle, deployment, billing, workspace isolation, upload storage, and workflow state.
- Use Bun for repository package operations.
- Do not edit the vendored Codex submodule directly.
- Do not hand-edit auto-created schema files or compiled artifacts.
- Public API changes require docs, tests, API snapshots, package-resolution evidence, and a changeset.

## Design Decisions

- Approval canonicalization: map both legacy and current command/file approval methods to the same public core kinds. Preserve original method only in payload or diagnostic metadata if needed for auditing.
- Path boundary: define an Agent UI-owned path type in hand-written source, then normalize incoming generated path strings into it. Keep raw string serialization when sending requests to Codex.
- Generated subpath exception: allow `@nyosegawa/agent-ui-codex/stable-types` to expose upstream-generated compatibility names because it is explicitly raw/generated schema.
- Deprecated protocol handling: keep intake for `item/fileChange/outputDelta`, `thread/compacted`, `mcpAppResourceUri`, and legacy MCP enum schemas, but classify them as raw/fallback/adapter-only.
- Documentation: use docs to explain adapter-boundary compatibility, not to advertise legacy names as product APIs.

## Impacted Areas

- Agent UI-owned: `packages/core/src/state/server-requests.ts`, `packages/core/src/selectors.ts`, core reducer tests, React approval components/hooks/tests, Codex normalizers and request-builder facade, public docs.
- Host-owned: filesystem/path validation, MCP policy, config source interpretation, account billing/credit mutation.
- Protected: `third_party/codex`, `packages/codex/src/generated/**`, `dist/**`.
- Release-sensitive: public declarations in core/react/codex packages, API snapshots, changesets.
- Docs-only: protocol and package export references after behavior changes.
- Example-only: examples should need updates only if approval or path type names appear in public recipe code.

## Validation Plan

- Focused:
  - `bunx vitest run --config vitest.config.ts packages/codex/test/protocol.test.ts`
  - `bunx vitest run --config vitest.config.ts packages/core/test/reducer.test.ts`
  - `bunx vitest run --config vitest.config.ts packages/react/test/components.vitest.tsx`
- Broader:
  - `bun run test:protocol`
  - `bun run typecheck`
  - `bun run lint`
- Browser:
  - Run Playwright fixture approval coverage only if visual approval behavior or placement changes beyond labels/kinds.
- Package/API:
  - `bun run test:api-snapshots:update` after reviewing declaration changes.
  - `bun run test:api-snapshots`
  - `bun run test:package-resolution`
  - `bun run validate:packages`
- CI follow-through:
  - Push phase commits and inspect GitHub checks to concrete pass/fail before marking ready.

## Commit, PR, And CI Plan

- Branch: continue on `codex-upstream/64bdeed9f7ad` per user request.
- Phase commit policy: one commit per completed phase after validation and review.
- Task-level fallback policy: split a phase before implementation if declaration churn or behavior changes become too broad.
- PR title/body expectations: update existing PR or create follow-up PR with summary, public API impact, protocol impact, docs impact, changeset, validation, and residual risks.
- Required checks: Repository policy, Typecheck, Lint, Unit tests, Protocol and fixtures, Package validation, API snapshots, Package resolution; Playwright fixtures if path filters run them.
- CI follow-through: watch checks after push; record concrete success/failure in `todo.md`.

## Risks

- Removing public legacy approval kinds changes API snapshots and may require coordinated docs/examples updates.
- Path migration can become over-designed; keep first implementation to local/native path product boundary and avoid promising cross-host URI authority.
- Deprecated protocol inputs should not be removed if App Server still emits them.
- Updating this branch means the cleanup may be coupled to PR #33 unless later split.

## Completion Criteria

- No public core/react product kind uses `legacyExecApproval` or `legacyPatchApproval`.
- Codex normalizer still accepts old approval method names and maps them to canonical product kinds.
- Product API docs explain generated-only compatibility names and Agent UI-owned path boundary.
- `LegacyAppPathString` does not appear in preferred request-builder/product API declarations outside generated schema surfaces unless explicitly justified.
- Deprecated notification/field handling remains raw/fallback only and tested.
- Changeset exists for public API cleanup.
- Focused and package validation pass, and GitHub checks are followed to a concrete result.

## Open Questions

- Choose exact path type shape during implementation: branded string is lower churn; object shape is clearer but broader.
- Decide whether to keep this work stacked on PR #33 or split after upstream sync merges.
