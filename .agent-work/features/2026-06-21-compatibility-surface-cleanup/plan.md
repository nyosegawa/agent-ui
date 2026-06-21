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
- Public `skills/agent-ui` guidance and example docs are host-facing integration surfaces and can preserve stale compatibility wording even after package APIs are cleaned.
- Current release policy is pre-1.0 fixed-version packages, so public API cleanup should use a minor changeset unless the maintainer explicitly chooses a 1.0/major release.

## Goals

- Replace public `legacyExecApproval` and `legacyPatchApproval` kinds with canonical `commandApproval` and `fileChangeApproval`.
- Introduce an Agent UI-owned path boundary so product APIs do not prefer upstream `LegacyAppPathString`.
- Keep deprecated upstream inputs accepted at the protocol boundary but normalize them into current product concepts or raw diagnostics.
- Document generated-only compatibility names versus product API names.
- Add tests that prevent compatibility names from re-entering core/React public surfaces.
- Add source-structure/API guard tests that separate generated-only compatibility names from preferred product declarations.
- Preserve fallback handling for upstream deprecated inputs where App Server may still emit them.
- Update docs, public Agent Skill guidance, examples, API snapshots, and changesets for npm-facing and host-facing guidance changes.

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
- Codex root export decision: explicitly decide whether generated method params/results should remain reachable from `@nyosegawa/agent-ui-codex` root; update `codex__index.d.ts` intentionally and add guards so generated detail does not leak by accident.
- Deprecated protocol handling: keep intake for `item/fileChange/outputDelta`, `thread/compacted`, `mcpAppResourceUri`, and legacy MCP enum schemas, but classify them as mapped fallback, raw, or generated-only as appropriate. Do not normalize deprecated top-level MCP resource fields unless they feed a canonical current field whose primary source is `appContext.resourceUri`.
- Documentation: use docs to explain adapter-boundary compatibility, not to advertise legacy names as product APIs.
- Public skill/examples strategy: treat `skills/agent-ui/**`, `docs/examples/**`, and example source as public integration guidance. Update them when wording or imports drift; otherwise record verified-no-change evidence.
- Release strategy: keep this work on PR #33 because the user asked to stay on this branch, and rewrite PR title/body/evidence from schema-only to schema refresh plus compatibility cleanup. Use phase commits.
- Versioning strategy: follow the repo's pre-1.0 fixed-version package policy; use minor bumps for public package surface changes unless an explicit 1.0/major policy decision is made.

## Impacted Areas

- Agent UI-owned: `packages/core/src/state/server-requests.ts`, `packages/core/src/selectors.ts`, core reducer tests, React approval components/hooks/tests, Codex normalizers, Codex request-builder facade, Codex root exports, public-surface guards, public docs, public integration skill guidance, and examples.
- Host-owned: filesystem/path validation, MCP policy, config source interpretation, account billing/credit mutation.
- Protected: `third_party/codex`, `packages/codex/src/generated/**`, `dist/**`.
- Release-sensitive: public declarations in core/react/codex/server/web-components fixed-version packages, API snapshots, changesets, package resolution, package validation.
- Docs-only: `docs/guides/approvals.md`, `docs/reference/hooks.md`, `docs/reference/react-components.md`, `docs/reference/codex-protocol.md`, `docs/reference/package-exports.md`, `docs/reference/server-bridge.md`, `docs/guides/attachments.md`, `docs/guides/diagnostics.md`, host-integration docs if path wording changes, and docs examples.
- Skill-owned: `skills/agent-ui/SKILL.md`, `skills/agent-ui/references/uploads.md`, `skills/agent-ui/references/local-single-user.md`, `skills/agent-ui/references/debug.md`, and `test/agent-ui-skill.test.ts`.
- Example-only: direct request-builder/local-media consumers in codex-local-web, next-with-bridge-sidecar, local-react-vite, and recipes must be audited and typechecked. Real-local fake server should remain current-method only; legacy intake belongs in raw fixtures.

## Validation Plan

- Focused:
  - `bunx vitest run --config vitest.config.ts packages/codex/test/protocol.test.ts`
  - `bunx vitest run --config vitest.config.ts packages/core/test/reducer.test.ts`
  - `bunx vitest run --config vitest.config.ts packages/react/test/components.vitest.tsx`
  - `bunx vitest run --config vitest.config.ts packages/server/test/websocket.test.ts`
  - `bunx vitest run --config vitest.config.ts packages/react/test/source-structure.vitest.ts packages/react/test/usage.vitest.ts packages/react/test/status-formatting.vitest.ts`
  - `bunx vitest run --config vitest.config.ts packages/codex/test/generated-ownership.test.ts packages/codex/test/public-surface.test.ts packages/codex/test/session-api.test.ts packages/codex/test/type-tests/protocol-types.ts packages/core/test/public-surface.test.ts packages/core/test/source-structure.test.ts`
  - `bun run test:skills`
  - `bun run test:repo-skills` only if maintainer skills change.
- Broader:
  - `bun run test:protocol`
  - `bun run typecheck`
  - `bun run lint`
- Browser:
  - Run Playwright fixture approval coverage only if visual approval behavior or placement changes beyond labels/kinds.
  - Run example typechecks/builds for affected examples: `examples/codex-local-web`, `examples/next-with-bridge-sidecar`, `examples/local-react-vite`, `examples/recipes`, and `examples/docs-site` if docs-site copy changes.
  - Run resource/approval Playwright coverage if local-media behavior, approval rendering, labels, or placement changes.
- Package/API:
  - `bun run build`
  - `bun run test:api-snapshots` to expose declaration drift.
  - `bun run test:api-snapshots:update` after reviewing declaration changes.
  - `bun run test:api-snapshots`
  - `bun run test:package-resolution`
  - `bun run validate:packages`
  - `bun run validate:release`
- Sweeps:
  - `rg -n "legacyExecApproval|legacyPatchApproval|LegacyAppPathString|AbsolutePathBuf|McpElicitationLegacy|mcpAppResourceUri|additionalSpeedTiers|legacyManagedConfig|rateLimitsByLimitId|rate_limits_by_limit_id|upload-only compatibility entry point" docs examples packages skills test test/api-snapshots`
  - Allow generated names only in `packages/codex/src/generated/**`, `@nyosegawa/agent-ui-codex/stable-types`, and explicitly documented generated-backed snapshots.
- CI follow-through:
  - Push phase commits and inspect GitHub checks to concrete pass/fail before marking ready.

## Commit, PR, And CI Plan

- Branch: continue on `codex-upstream/64bdeed9f7ad` per user request.
- Phase commit policy: one commit per completed phase after validation and review.
- Task-level fallback policy: split a phase before implementation if declaration churn or behavior changes become too broad.
- PR title/body expectations: keep the current branch/PR #33 stacked per user request, and retitle/rewrite the PR from schema-only to combined schema refresh plus compatibility cleanup. Include summary, public API impact, protocol impact, docs/skills/examples impact, changeset, validation, and residual risks.
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
- Under-planning docs, skills, or examples can leave stale host-facing guidance even when the package API is clean.
- Wrong changeset level can accidentally force a 1.0/major release; follow the current pre-1.0 fixed-version policy unless explicitly changed.

## Completion Criteria

- No public core/react product kind uses `legacyExecApproval` or `legacyPatchApproval`.
- Codex normalizer still accepts old approval method names and maps them to canonical product kinds.
- Server bridge policy still handles legacy upstream approval methods through canonical command/file approval callbacks.
- Product API docs explain generated-only compatibility names and Agent UI-owned path boundary.
- `LegacyAppPathString` and `AbsolutePathBuf` do not appear in preferred request-builder/core/react/server product API declarations outside generated schema surfaces or explicitly documented generated-backed facades.
- Deprecated notification/field handling remains mapped fallback/raw/generated-only as designed and tested.
- Source-structure/API guards prevent compatibility names from returning to public core/react/product docs.
- Public `skills/agent-ui` guidance, docs examples, and direct request-builder/local-media examples are updated or recorded as verified-no-change.
- API snapshots are intentionally updated: `core__index.d.ts`, `codex__request-builders.d.ts`, and any root/react/server snapshots that drift; `codex__stable-types.d.ts` remains generated-only.
- Changeset exists with explicit pre-1.0 minor/fixed-package bump rationale unless a 1.0/major decision is made.
- `validate:release` passes, focused validation passes, and GitHub checks are followed to a concrete result.

## Open Questions

- Confirm whether any maintainer skill baseline should be updated after the public skill/docs/examples audit; if yes, run `bun run test:repo-skills`.
