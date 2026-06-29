# Research

## Scope

Plan one large breaking Agent UI PR that turns the current review findings into
a coherent architecture redesign. The plan covers raw-free public surfaces,
core view-model/controller boundaries, React headless/primitives cleanup,
Codex input-shape alignment, opaque server bridge root cleanup, Web Component
lifecycle/API semantics, build/package/release gates, examples, docs, and test
coverage.

This is planning only. No implementation changes are included in this artifact
package.

## Freshness Check

- Manifest path:
  `.agents/skills/agent-ui-feature-planning/references/freshness-manifest.json`
- Last full research commit: `499a9020c1613923ae547411ad930e0bcefb8ed9`
- Current commit: `ce5509438366547b988b76a551030b86faac0869`
- Command:
  `node .agents/skills/agent-ui-feature-planning/scripts/check-freshness.mjs`
- Result: `refresh-needed`
- Changed watched files:
  - `docs/architecture/product-boundary.md`
  - `docs/architecture/testing.md`
  - `docs/reference/package-exports.md`
- Changed watched globs:
  - `.agents/skills/*/references/*.md`
  - `docs/architecture/*.md`
  - `docs/reference/*.md`
- Refresh mode: targeted refresh.
- Targeted refresh performed by reading the changed current docs and relevant
  skill references before writing this plan.
- Manifest updated: no. The planning package records the targeted refresh
  evidence but does not rewrite skill-maintenance metadata.
- Web/current research: intentionally skipped. The plan is grounded in local
  repo source, generated protocol docs, and previous same-session review
  findings. No package registry, GitHub Actions, browser version, or external
  API fact is required to decide this implementation plan.

## Investigation Method

I used the `agent-ui-feature-planning` skill. I read:

- `AGENTS.md`
- `.agents/skills/agent-ui-feature-planning/SKILL.md`
- `.agents/skills/agent-ui-feature-planning/references/freshness-policy.md`
- `.agents/skills/agent-ui-feature-planning/references/artifact-contract.md`
- `.agents/skills/agent-ui-feature-planning/references/review-rubric.md`
- `.agents/skills/agent-ui-feature-planning/references/repo-research-summary.md`
- `docs/architecture/product-boundary.md`
- `docs/architecture/testing.md`
- `docs/architecture/protocol-drift.md`
- `docs/reference/package-exports.md`
- `docs/reference/server-bridge.md`
- `package.json`
- selected core, React, server, Web Component, and recipe source files listed
  below.

I also used the previous 15-round / 60-subagent review in this same session as
input, then ran four additional planning lanes:

- repo guidance researcher
- implementation surface researcher
- validation researcher
- skill/design reviewer

## Subagent Rounds

One feature-planning round with four parallel subagents:

- Repo guidance lane: confirmed product boundary, package-boundary constraints,
  non-goals, protected file rules, and release risks.
- Implementation surface lane: inspected core/react/server/web-components and
  identified sequencing risks around raw-free surfaces, image input, composer,
  server root, and Web Components.
- Validation lane: inspected scripts, CI docs, Playwright configs, package/API
  gates, and required local closeout.
- Skill/design lane: confirmed artifact contract, freshness requirements,
  downstream-leakage concerns, and validator limitations.

The broader source review before this planning pass used 60 subagents and found
the same high-level root causes: raw/internal public exposure, server bridge root
leakage, build/package validation coupling, Web Component lifecycle ambiguity,
docs/currentness drift, and insufficient browser/real-local coverage.

## Sources Inspected

- `AGENTS.md`
- `package.json`
- `docs/architecture/product-boundary.md`
- `docs/architecture/testing.md`
- `docs/architecture/protocol-drift.md`
- `docs/reference/package-exports.md`
- `docs/reference/server-bridge.md`
- `packages/core/src/index.ts`
- `packages/core/src/state/item.ts`
- `packages/core/src/state/server-requests.ts`
- `packages/react/src/hooks/transcript.ts`
- `packages/react/src/agent-input.ts`
- `packages/react/src/hooks/turn-input.ts`
- `packages/react/src/hooks/first-message-operations.ts`
- `packages/react/src/hooks/composer.ts`
- `packages/react/src/hooks/composer-turn-start.ts`
- `packages/server/src/index.ts`
- `packages/server/src/bridge.ts`
- `packages/web-components/src/index.tsx`
- `examples/recipes/src/headless-hooks.tsx`
- `examples/recipes/src/agent-chat-composition.tsx`

## Findings

1. `@nyosegawa/agent-ui-core` root exports too much internal state. The root
   barrel exports `events`, `fake-transport`, `fixtures`, `reducer`,
   `selectors`, `state`, and `transport`. Public state includes broad
   `unknown` payloads in item metadata, item blocks, and pending server
   requests.
2. React headless currently promises raw-free usage in docs, but
   `useAgentTranscriptController()` still derives entries from `ThreadState`
   and passes through broad block fields such as `arguments`, `changes`,
   `error`, `metadata`, and `result`.
3. Approval APIs expose `PendingServerRequest` and `payload: unknown` through
   public React hooks/primitives. Public approvals should expose canonical
   `AgentApprovalView` data and action methods.
4. React `AgentImageInput` uses `image_url`, while Codex stable v2 and
   `imageInput()` use `url`. This is a real breaking API cleanup candidate.
5. Composer and first-message lifecycle state is split between provider state
   and module-level maps/sets. That can leak retry/cancel state across
   providers or remounts.
6. Existing-thread external sends do not get the same optimistic
   `clientUserMessageId` transcript behavior as first messages.
7. Server root exports `CodexChildProcess`, spawn options, and
   `CodexAppServerBridge.process`. The root should be high-level and opaque;
   raw process details should not be the default public integration path.
8. Web Components still accept `AgentSessionState` as `initialState`, return an
   existing custom element constructor even if it was registered by something
   else, and have sticky `chat-class` semantics.
9. Root `build` mixes package and example builds. Package validation must keep
   fresh package build before packlist, Node compatibility, `publint`, and
   `attw`; examples should not block package surface validation accidentally.
10. Recipes still teach raw reducer traversal and `approval.payload` handling.
    Migration docs must teach controllers/view models/primitives instead.

## Repo Guidance Findings

- Agent UI is a reusable Codex App Server UI component library, not a hosted
  runtime.
- Host applications own auth, authorization, persistence, process lifecycle,
  deployment, workspace/tenant isolation, upload storage, audit sinks, resource
  limits, and product workflows.
- Public API promotion requires package exports, docs, examples, tests, API
  snapshots or package-resolution evidence, and release impact.
- Use Bun for package operations.
- Do not push directly to `main`; use a purpose branch and PR.

## Architecture / Boundary Findings

- The target is not "remove all raw data from the repo." Raw data remains valid
  at explicit boundaries: transport, Codex adapter/protocol surfaces,
  diagnostics/audit surfaces, and server host-policy callbacks.
- User-facing public React/headless/primitives surfaces should be raw-free
  view-model/controller APIs.
- Core needs a clearer split between internal reducer state and exported public
  views/controllers.
- Server root should stay high-level; low-level spawn/process details are not a
  normal host integration contract.
- Web Components should remain a thin wrapper over React, not a separate host
  runtime or transport creator.

## Validation / CI Findings

Required broad local closeout for this PR size:

```sh
bun run validate:release
bun run validate:e2e
```

Surface-specific gates:

- `bun run validate:fast`
- `bun run validate:protocol`
- `bun run validate:packages`
- `bun run test:api-snapshots`
- `bun run test:package-resolution`
- `bun run check:dead-code`
- `bun run test:e2e:fixtures`
- `bun run test:e2e:real-local`
- `bun run --cwd examples/recipes typecheck`
- touched Next example `typecheck` and `build` commands

PR CI does not run real-local e2e by default, so real-local bridge/media
evidence must be recorded locally for bridge, first-message, thread routing, or
local media changes.

## Existing Skill / Command Findings

- The feature-planning skill requires exactly four artifacts in
  `.agent-work/features/<date>-<slug>/`.
- `validate-artifacts.mjs` is a shape checker, not a prose-quality review.
- `todo.md` must be phase-first and include branch, planning commit, remote,
  push result, and blockers.
- `goal-prompt.md` must stay at or below 4000 characters and include absolute
  artifact paths, same-branch execution, validation, review, commit, push, PR,
  CI, evidence, forbidden edits, and stop/escalation rules.

## Web / Current-State Findings

No live web/current research was needed for this planning package. The decision
does not depend on current npm registry state, current GitHub Actions state,
external API behavior, or browser-version facts.

## Freshness / Staleness Findings

Freshness was stale relative to the feature-planning manifest. Targeted refresh
was sufficient because changed inputs were architecture/testing/package-export
docs and skill references; the repo structure and package layout remain
recognizable. The plan uses the current versions of those changed docs.

## Generated / Vendored / Protected File Findings

- Do not edit `third_party/codex` directly.
- Do not hand-edit generated schema under `packages/codex/src/generated`.
- Do not hand-edit compiled `dist`, `.next`, or generated declaration output.
- Protocol/schema changes must use the upstream-sync/generation workflow and
  then review generated stable/experimental diffs.

## Risks

- A raw-free redesign can accidentally expose a different raw shape under a new
  name. Structural tests and API snapshots must guard this.
- Moving server process types incorrectly could remove useful host diagnostics
  or create an accidental server-runtime abstraction. The root should be
  opaque, with any advanced escape hatch explicitly named and documented.
- Expanding Web Component props too early could freeze unstable React internals.
  Web Components should follow the final React contract.
- Build script splitting can create false green package validation if `publint`
  or `attw` runs against stale output.
- A single large PR can become unreviewable unless phases are reviewed and
  committed coherently.

## Decisions

- Use one large breaking PR, but implement it in phase-sized commits.
- Do not add public `/testing` subpaths in this PR.
- Define raw-free as "public user/controller/view-model surfaces are raw-free,"
  not as a ban on transport/protocol/diagnostic/server-policy raw boundaries.
- Fix React image input to align with Codex `url`.
- Keep docs generic. Do not mention downstream app names or encode downstream
  product workflow concepts.
- Require PR evidence matrix for public surface changes.

## Rejected Approaches

- Do not add host workflow flags such as product-specific prompt sources,
  approval workflows, or runtime modes.
- Do not hide host-submitted prompts via protocol/request metadata.
- Do not move auth, workspace policy, upload storage, process supervision, or
  deployment into Agent UI.
- Do not add `/testing` as convenience API without a separate export-gate PR.
- Do not retain branch-only compatibility aliases just to soften the breaking
  change.

## Remaining Unknowns

- Exact names for the internal/advanced core subpath are implementation
  decisions. The plan assumes one explicit non-root boundary.
- Exact server advanced surface is open, but the root must not expose raw child
  process details as the primary API.
- Whether Web Components should expose a selected `chatProps` subset or remain
  minimal must be decided after React view-model/controller cleanup.
- Upstream protocol drift may require a separate upstream-sync flow if
  implementation discovers schema mismatches.

## Branch Decision

- Branch: `codex/agent-ui-architecture-redesign-plan`
- Created from: `main...origin/main`
- Worktree before writing artifacts: clean.
- Planning commit: pending at initial artifact write; will be amended into
  `todo.md` and `goal-prompt.md` after validation and commit.
- Remote push: pending at initial artifact write.
- Blockers: none at planning time.
