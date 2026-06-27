## Scope

Plan a breaking, non-MVP redesign for `@nyosegawa/agent-ui-react` so the root
`AgentProvider` / `AgentChat`, `/headless` hooks/controllers, and `/primitives`
visual pieces compose in the same React tree against one shared Agent UI state
model. The plan must also make `AgentChat` usable as a finished preset while
allowing host-specific UI to replace or extend documented areas, send messages
through the same chat lifecycle, control starter options, coordinate overlays,
and resolve local media without private DOM selectors or raw transport calls.

## Freshness Check

- Manifest:
  `.agents/skills/agent-ui-feature-planning/references/freshness-manifest.json`
- Last full research commit:
  `499a9020c1613923ae547411ad930e0bcefb8ed9`
- Current commit before planning:
  `d748a944db3af9565356f610fdedd6d1d21791e1`
- Command:
  `node .agents/skills/agent-ui-feature-planning/scripts/check-freshness.mjs`
- Result: `refresh-needed`.
- Changed watched files:
  `docs/architecture/product-boundary.md`,
  `docs/architecture/testing.md`, `docs/reference/package-exports.md`.
- Changed watched globs:
  `.agents/skills/*/references/*.md`, `docs/architecture/*.md`,
  `docs/reference/*.md`.
- Refresh mode: targeted refresh by reading the current changed docs and
  planning references directly. Full refresh was not selected because the
  package layout, build system, protected-file policy, and CI model did not
  appear structurally replaced.
- Manifest update: not updated in this planning pass; the generated artifacts
  cite current source files as the source of truth.
- Live/current web research: skipped. The plan depends on checked-in repo
  contracts and local package behavior, not external package registry,
  upstream Codex drift, or GitHub Actions state.

## Investigation Method

- Read repo guidance and the feature-planning skill contract:
  `AGENTS.md`,
  `.agents/skills/agent-ui-feature-planning/SKILL.md`,
  `.agents/skills/agent-ui-feature-planning/references/freshness-policy.md`,
  `.agents/skills/agent-ui-feature-planning/references/artifact-contract.md`,
  `.agents/skills/agent-ui-feature-planning/references/review-rubric.md`,
  `.agents/skills/agent-ui-feature-planning/references/repo-research-summary.md`.
- Read changed/current architecture and public API docs:
  `docs/architecture/product-boundary.md`,
  `docs/architecture/testing.md`,
  `docs/architecture/host-integration-design-gates.md`,
  `docs/reference/package-exports.md`,
  `docs/reference/hooks.md`,
  `docs/reference/react-components.md`,
  `docs/maintenance/ci-cd.md`.
- Inspected implementation and tests:
  `packages/react/package.json`,
  `packages/react/src/index.ts`,
  `packages/react/src/headless.ts`,
  `packages/react/src/primitives.ts`,
  `packages/react/src/provider-root.ts`,
  `packages/react/src/provider.tsx`,
  `packages/react/src/components/chat.tsx`,
  `packages/react/src/hooks/composer.ts`,
  `packages/react/src/hooks/composer-types.ts`,
  `packages/react/test/provider.vitest.tsx`,
  `packages/react/test/components.vitest.tsx`,
  `packages/react/test/source-structure.vitest.ts`,
  `test/runtime-export-policy.test.ts`,
  `test/api-snapshots/react__index.d.ts`,
  `test/api-snapshots/react__headless.d.ts`,
  `test/api-snapshots/react__primitives.d.ts`,
  `scripts/package-resolution-smoke.mjs`.
- Inspected examples:
  `examples/recipes/src/headless-chat-controller.tsx`,
  `examples/recipes/src/host-owned-composer.tsx`,
  `examples/recipes/src/host-gated-workflow.tsx`,
  `examples/local-react-vite/src/fixtures/public-component-catalog.ts`,
  `examples/local-react-vite/src/fixtures/visual-qa-manifest.ts`.
- Branch decision:
  created `codex/plan-composable-agent-chat-api` from clean `main`.

## Subagent Rounds

Round 1 used four parallel explorer lanes:

- Repo guidance lane: confirmed targeted freshness refresh, repo boundaries,
  planning artifact contract, and public API/docs expectations.
- Implementation surface lane: found no obvious duplicate `createContext` in
  source; root and `/headless` re-export the same provider module. The practical
  split is that `AgentChat` / `AgentComposerPanel` create internal composer
  controller instances while external UI calling `useAgentComposerController()`
  gets a separate hook-local draft value/error/submitting state.
- Validation lane: classified this as package-surface plus browser-visible
  React work and provided focused unit, package, example, and Playwright gates.
- Skill/design review lane: flagged the current docs' rejection of
  `AgentChatSlots`, required context tests across entrypoints, and insisted that
  external send use a public controller instead of transport exposure.

Additional rounds were not run because all lanes converged on the same design
pressure: preserve one shared provider identity, promote a public chat-flow
controller, and widen `AgentChat` only through documented raw-free composition
areas.

## Sources Inspected

- `AGENTS.md`
- `docs/architecture/product-boundary.md`
- `docs/architecture/testing.md`
- `docs/architecture/host-integration-design-gates.md`
- `docs/reference/package-exports.md`
- `docs/reference/hooks.md`
- `docs/reference/react-components.md`
- `docs/maintenance/ci-cd.md`
- `packages/react/package.json`
- `packages/react/src/index.ts`
- `packages/react/src/headless.ts`
- `packages/react/src/primitives.ts`
- `packages/react/src/provider-root.ts`
- `packages/react/src/provider.tsx`
- `packages/react/src/components/chat.tsx`
- `packages/react/src/components/composer.tsx`
- `packages/react/src/hooks/composer.ts`
- `packages/react/src/hooks/composer-types.ts`
- `packages/react/test/provider.vitest.tsx`
- `packages/react/test/components.vitest.tsx`
- `packages/react/test/source-structure.vitest.ts`
- `test/runtime-export-policy.test.ts`
- `test/api-snapshots/react__*.d.ts`
- `test/public-showcase-catalog.test.ts`
- `scripts/package-resolution-smoke.mjs`
- `examples/recipes/src/headless-chat-controller.tsx`
- `examples/recipes/src/host-owned-composer.tsx`
- `examples/recipes/src/host-gated-workflow.tsx`
- `examples/local-react-vite/src/fixtures/public-component-catalog.ts`
- `examples/local-react-vite/src/fixtures/visual-qa-manifest.ts`

## Findings

- The documented React package model is already three entrypoints:
  root preset, `/primitives` visual composition, and `/headless` controllers.
  `docs/reference/package-exports.md` says root should stay small and new
  host-composition surfaces should go to `/headless` or `/primitives`.
- Source currently defines one `AgentContext` in `packages/react/src/provider.tsx`.
  Root `AgentProvider` re-exports through `provider-root.ts`, and `/headless`
  exports `./provider`, so the source-level provider identity is already
  centralized.
- The plan still needs built-package runtime identity tests because real
  consumers can observe context splits when subpath bundles or duplicated
  physical package copies resolve differently.
- `AgentChat` currently accepts a constrained `AgentComponents` map:
  `Shell`, `Sidebar`, `EmptyState`, `ComposerPanel`, `Approval`, and `blocks`.
  Current docs explicitly say the old `AgentChatSlots` shape is removed.
- `useAgentComposerController()` already owns the raw-free lifecycle for
  first-message optimism, canonical thread reconciliation, queued follow-ups,
  steering, stop, retry, and failed pending messages.
- The missing design piece is not only an action method. The visual composer in
  `AgentChat` owns a separate hook-local controller instance. A host external UI
  can call the same lifecycle methods, but it cannot currently share the exact
  active chat-flow controller state with the preset composer.
- `AgentChat` has partial host extension points such as `statusBarEnd`,
  `components.Sidebar`, `composerIntegrations`, `onRequestWorkingDirectory`,
  `resolveLocalAttachment`, `resolveLocalMediaUrl`, `theme`, `locale`,
  `messages`, and `threadUrlRouting`, but these are not yet organized into a
  coherent public composition contract for header/status additions, start option
  policies, overlay coordination, local media, and external send.

## Repo Guidance Findings

- Use Bun for package operations.
- Do not push directly to `main`; planning and implementation should share one
  branch.
- Public API work must update docs and examples in the same change.
- Browser-visible behavior requires Playwright evidence.
- For public API/package-boundary changes, include export maps, API snapshots,
  package resolution, package validation, and release impact.

## Architecture / Boundary Findings

- Agent UI owns reusable package surfaces, normalized state, React controllers,
  primitives, request builders/normalizers, bridge helpers, structured resource
  metadata, diagnostics classification, and stylesheet tokens.
- Hosts own product workflow state, routing, persistence, auth, authorization,
  tenant/workspace isolation, process lifecycle, deployment, billing, upload
  persistence/static authorization, dynamic tool policy, and overlay managers
  outside the Agent UI preset.
- The new controller must be generic chat-flow behavior, not host workflow
  orchestration.
- `AgentChat` can expose named render areas and controlled props for its own
  preset surfaces, but must not make private `.aui-*` selectors, raw reducer
  state, raw generated protocol payloads, or raw transport calls public.

## Validation / CI Findings

- Focused unit/source gates should cover provider identity, root/subpath
  composition, `AgentComponents`, controller behavior, source-structure limits,
  and runtime export policy.
- Package gates must include `bun run validate:packages`, then API snapshots and
  package-resolution checks.
- Example gates must include local React Vite, recipes, and docs-site typecheck
  or build where examples/docs are changed.
- Browser gates must include deterministic fixture Playwright for route matrix,
  smoke, composer retry, visual layout, and accessibility. Real-local e2e is
  required if implementation touches bridge/live thread lifecycle behavior.
- CI follow-through should inspect GitHub Actions to concrete success/failure
  after push/PR.

## Existing Skill / Command Findings

- The `agent-ui-feature-planning` skill requires artifacts only under
  `.agent-work/features/<date>-<slug>/`.
- `todo.md` must be phase-first, and phases should be split when a phase is too
  large, risky, or not reviewable/committable as one unit.
- `goal-prompt.md` must be <=4000 characters and include absolute artifact
  paths, same-branch execution, freshness result, forbidden edits, validation,
  review, commit, push, PR, and CI follow-through rules.

## Web / Current-State Findings

No web research was used. No external or time-sensitive fact is needed to decide
this package design plan. Current upstream Codex behavior is not being changed,
and no npm registry or GitHub Actions status was needed for planning.

## Freshness / Staleness Findings

The planning skill summary was stale for product-boundary, testing, and package
exports. This plan relies on the current checked-in docs and implementation
instead of the stale manifest hashes. The stale manifest should be refreshed by
a future maintenance pass if the team wants the feature-planning baseline to
stop reporting `refresh-needed`.

## Generated / Vendored / Protected File Findings

- Do not edit `third_party/codex`.
- Do not hand-edit generated Codex schema files under `packages/codex/src/generated`.
- Do not hand-edit `dist` output.
- Do not promote private CSS chunks or `.aui-*` implementation selectors as
  public host API.
- API snapshot files may be updated only through the snapshot update command
  after reviewing the intentional public API delta.

## Risks

- A slot API that is too broad will reintroduce private DOM/state coupling.
- A controller that owns host workflow state will violate product boundary.
- Sharing draft state with external UI can accidentally couple unrelated
  composers unless the scope is explicit.
- Built ESM/CJS/subpath output could pass source tests while still duplicating
  runtime context in consumer resolution.
- Breaking API cleanup requires changeset/release impact and migration docs,
  even though backward compatibility is not required.

## Decisions

- Treat this as a breaking package-surface redesign.
- Keep root as preset entry: `AgentProvider`, `AgentChat`, `AgentComponents`,
  `defaultAgentComponents`, `AgentChatProps`, and i18n helpers.
- Put new host-composition controllers and types on `/headless`.
- Put visual extension primitives and render-area prop types on `/primitives`
  when they are visual rather than lifecycle controllers.
- Replace the vague "slots" request with a documented `AgentChat` composition
  contract: constrained component map plus named render areas/props for header,
  status, thread history, start options, overlay layer coordination, and media
  resolution.
- Introduce a public chat-flow controller that `AgentChat` can use internally
  and external UI can access from the same provider scope.

## Rejected Approaches

- Re-export all hooks/primitives from the root package entrypoint.
- Restore an unbounded `AgentChatSlots` object.
- Tell hosts to call transport methods directly for external sends.
- Ask hosts to rely on private `.aui-*` selectors or internal state.
- Move host auth, persistence, workspace policy, overlay managers, or process
  lifecycle into Agent UI core.
- Patch generated schema, vendored Codex, or built `dist` output directly.

## Remaining Unknowns

- Exact final names for the new public controller and render-area props. The
  plan recommends `useAgentChatController()` / `AgentChatController` and
  `AgentChatRenderAreas`, but implementation should confirm naming against the
  final public declaration snapshot.
- Whether existing `AgentComponents` should be replaced or expanded. Because
  backward compatibility is not required, implementation may replace it, but it
  should preserve the narrow boundary and update docs/tests/examples together.
- Whether the package version change should be major or minor. Because the user
  explicitly removes backward compatibility and public APIs are likely renamed
  or removed, the default release assumption is a major changeset unless the
  final diff only adds APIs.
