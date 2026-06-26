# Agent UI Surface Redesign Research

## Scope

Plan a no-backwards-compatibility redesign of Agent UI's public React surface,
default components, protocol state model, examples, visual QA routes, docs, and
skills. The target is a coherent library design, not a compatibility patch.

The implementation is planned for the same branch:
`codex/fixture-system-redesign-plan`.

## Freshness Check

Command:

```sh
node .agents/skills/agent-ui-feature-planning/scripts/check-freshness.mjs
```

Result: `refresh-needed`.

Current commit at check time:
`039a1f967e0aadcc628566f90d864b7163021500`.

Last full research commit:
`499a9020c1613923ae547411ad930e0bcefb8ed9`.

Changed files called out by the freshness check:

- `docs/architecture/testing.md`
- `docs/reference/package-exports.md`

Changed globs called out by the freshness check:

- `.agents/skills/*/SKILL.md`
- `.agents/skills/*/references/*.md`
- `docs/architecture/*.md`
- `docs/reference/*.md`

Conclusion: targeted refresh was required and performed from the live checkout.

## Investigation Method

The main agent read the planning skill contract, freshness policy, artifact
contract, review rubric, repo research summary, relevant architecture docs,
React/core/Codex implementation files, package export docs, examples, fixture
routes, and testing docs. The user requested `4` parallel subagents across `5`
rounds; rounds 1-5 investigated, reviewed, and corrected the design package.

Branch decision: reuse existing branch
`codex/fixture-system-redesign-plan`; do not create a new branch.

No web research was required because the relevant source of truth is local:
the repository docs, generated Codex App Server schema, and vendored
`third_party/codex/codex-rs/app-server` sources.

## Subagent Rounds

Round 1:

- Public API responsibility boundary.
- Fixture/gallery/example structure.
- Codex App Server protocol semantics.
- Docs/skills/validation impact.

Round 2:

- Default UI responsibilities.
- Public API/export structure.
- Protocol state redesign.
- Showcase/maintainer gallery design.

Round 3:

- Composer integrations, mention, attachment, App/Plugin concepts.
- `AgentChat` default preset, routing, and chrome.
- Raw core/store exposure and view-model design.
- Run policy, working directory, model/effort, responsive composer controls.

Round 4:

- Design review for product/protocol boundary.
- Phase decomposition review.
- Docs/skills audit.
- Browser-visible UX and visual QA audit.

Key Round 4 corrections:

- Do not leave docs, tests, screenshots, or snapshots to a late cleanup phase;
  each owning phase must update its own contract and validation evidence.
- Split protocol classification from core reducer/runtime state.
- Extract direct-link open/resume semantics to a headless controller or recipe
  before deleting `threadUrlRouting`.
- Land a neutral composer integration replacement before deleting named
  App/Plugin props.
- Preserve the approval-only helper split from broad server request responses.
- Remove or convert the legacy `components.Item` raw-state leak before freezing
  the React public API.
- Test run policy/model/cwd merge ordering and default effort behavior before
  composer UI cleanup.
- Add browser-visible acceptance coverage for waiting labels such as
  `Needs approval`, user input, permissions, and auth states.

Round 5:

- Draft planning package review and final gap check before validation.

## Sources Inspected

- `AGENTS.md`
- `.agents/skills/agent-ui-feature-planning/SKILL.md`
- `.agents/skills/agent-ui-feature-planning/references/artifact-contract.md`
- `.agents/skills/agent-ui-feature-planning/references/freshness-policy.md`
- `.agents/skills/agent-ui-feature-planning/references/review-rubric.md`
- `.agents/skills/agent-ui-feature-planning/references/repo-research-summary.md`
- `docs/architecture/product-boundary.md`
- `docs/architecture/overview.md`
- `docs/architecture/testing.md`
- `docs/getting-started.md`
- `docs/reference/package-exports.md`
- `docs/reference/react-components.md`
- `docs/reference/hooks.md`
- `docs/reference/codex-protocol.md`
- `docs/guides/attachments.md`
- `docs/guides/browser-verification.md`
- `docs/guides/react.md`
- `docs/guides/host-integration.md`
- `docs/examples/local-react-vite.md`
- `docs/examples/codex-local-web.md`
- `docs/maintenance/repository-skills.md`
- `docs/maintenance/agent-ui-skills.md`
- `.agents/skills/browser-qa/SKILL.md`
- `.agents/skills/browser-qa/references/surface-map.md`
- `.agents/skills/browser-qa/references/agent-browser-workflow.md`
- `.agents/skills/agent-ui-review/references/review-rubric.md`
- `.agents/skills/agent-ui-review/references/validation-review.md`
- `packages/react/src/index.ts`
- `packages/react/src/components.ts`
- `packages/react/src/provider.tsx`
- `packages/react/src/components/chat.tsx`
- `packages/react/src/components/thread.tsx`
- `packages/react/src/components/composer.tsx`
- `packages/react/src/components/composer-attachments.ts`
- `packages/react/src/components/composer-mentions.ts`
- `packages/react/src/components/run-settings.tsx`
- `packages/react/src/components/starter-cwd.tsx`
- `packages/react/src/hooks.ts`
- `packages/react/src/hooks/thread.ts`
- `packages/react/src/hooks/transcript.ts`
- `packages/react/src/hooks/run-settings.ts`
- `packages/react/src/hooks/composer-turn-start.ts`
- `packages/react/src/hooks/turn-input.ts`
- `packages/react/src/resources.ts`
- `packages/react/package.json`
- `packages/react/tsup.config.ts`
- `packages/core/src/state/thread.ts`
- `packages/core/src/state/turn.ts`
- `packages/core/src/state/server-requests.ts`
- `packages/core/src/reducer/server-requests.ts`
- `packages/core/src/reducer/thread-commit.ts`
- `packages/core/src/reducer/turn.ts`
- `packages/core/src/selectors.ts`
- `packages/core/package.json`
- `packages/codex/src/generated/stable/v2/ThreadStatus.ts`
- `packages/codex/src/generated/stable/v2/ThreadStartParams.ts`
- `packages/codex/src/generated/stable/v2/TurnStartParams.ts`
- `packages/codex/src/generated/stable/v2/ThreadSettings.ts`
- `packages/codex/src/generated/stable/v2/UserInput.ts`
- `packages/codex/src/generated/stable/v2/TextElement.ts`
- `packages/codex/src/request-builders.ts`
- `packages/codex/src/normalizers/shared.ts`
- `packages/codex/src/normalizers/server-requests.ts`
- `third_party/codex/codex-rs/app-server/README.md`
- `third_party/codex/codex-rs/app-server/src/thread_status.rs`
- `third_party/codex/codex-rs/app-server/src/thread_state.rs`
- `examples/local-react-vite/src/main.tsx`
- `examples/local-react-vite/src/fixtures/visual-qa-manifest.ts`
- `examples/local-react-vite/src/fixtures/gallery.ts`
- `examples/local-react-vite/src/closeups/ComponentCloseupGallery.tsx`
- `examples/local-react-vite/src/closeups/FixturePreview.tsx`
- `examples/local-react-vite/e2e/visual-layout.e2e.ts`
- `examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts`
- `examples/local-react-vite/e2e/visual-closeups.e2e.ts`
- `packages/react/test/components.vitest.tsx`
- `packages/react/test/run-settings.vitest.ts`
- `packages/react/test/thread-url-routing.vitest.ts`
- `packages/react/test/source-structure.vitest.ts`
- `packages/core/test/reducer.test.ts`
- `packages/codex/test/protocol.test.ts`
- `test/api-snapshots/react__index.d.ts`
- `test/api-snapshots/core__index.d.ts`
- `test/runtime-export-policy.test.ts`
- `skills/agent-ui/SKILL.md`
- `skills/agent-ui/references/layout-composition.md`
- `skills/agent-ui/references/uploads.md`

## Findings

The current public React root exports too much. It mixes the default preset,
styled primitives, headless hooks, transcript helpers, resource helpers, usage
normalizers, i18n, and implementation details through `packages/react/src/index.ts`
and `packages/react/src/components.ts`.

The current default component API leaks host/runtime concepts:

- `threadUrlRouting` owns browser history, `popstate`, URL hydration, and thread
  resume/read behavior. That is host navigation policy.
- `AgentWorkspace` is a host product shell, not a reusable chat component.
- `onRequestAppMention` and `onRequestPluginMention` imply first-class App and
  Plugin picker semantics that Codex App Server does not define as a standard
  composer UX.
- Working directory selection and folder picker behavior are host-owned.
- `AgentRunSettingsPanel` keeps an older "settings panel" mental model that
  conflicts with the newer composer-first policy/model controls.

The current core status model collapses distinct protocol concepts. Upstream
Codex App Server represents thread status as `notLoaded | idle | systemError |
active { activeFlags }`; Agent UI collapses waiting flags into
`waitingForInput` and then often labels that as "Needs approval".

The current fixture gallery mixes public showcase routes, maintainer closeups,
debug probes, docs screenshot targets, iframe previews, and CSS specimens.

## Repo Guidance Findings

Agent UI is a reusable Codex App Server UI component library, not a hosted app
runtime. Host-specific workflow, auth, persistence, process lifecycle, billing,
deployment, and workspace isolation must remain outside core library scope.

Use Bun as the package manager. Do not edit vendored upstream Codex files except
through explicit upstream-sync work. Public API changes require package exports,
docs, tests, API snapshots, package resolution, and release-impact validation.

## Architecture / Boundary Findings

Final public React structure should be:

- Root default entrypoint: `@nyosegawa/agent-ui-react`
  - Keep the complete `AgentChat` preset and `AgentProvider` convenience entry.
  - Do not export every primitive or hook from root.
- Primitive subpath: `@nyosegawa/agent-ui-react/primitives`
  - Styled shell, thread, transcript, composer, approvals, status, usage,
    model/policy controls, theme/locale controls, diff viewer, and visual
    components.
- Headless subpath: `@nyosegawa/agent-ui-react/headless`
  - Controllers, provider internals needed by hosts, view models, run policy
    state, resource metadata, and request composition helpers.
- Internal-only:
  - Raw store access, transcript window helpers, Codex request-param conversion
    details, usage normalization, and source-only fixtures unless a deliberate
    advanced subpath is justified.

React public components and hooks should not expose `ThreadState`, `TurnState`,
or `PendingServerRequest`. Core should construct raw-free view models such as
`AgentThreadSummaryView`, `AgentTranscriptView`, `AgentServerRequestView`, and
`AgentApprovalView`.

Composer App/Plugin APIs should be deleted, not renamed for compatibility. If a
host needs toolbar integrations, expose a neutral `composerIntegrations` list
where each resolver returns explicit `AgentUserInput` values. React must not
derive protocol `mention` inputs from `{ label, value }` chips.

Low-level protocol `mentionInput(name, path)` remains in
`@nyosegawa/agent-ui-codex/request-builders`. App/plugin path semantics and
pickers remain host-owned.

Run settings should become a protocol-backed split:

- `AgentRunPolicy` captures approval policy, reviewer, sandbox policy, and
  capability metadata.
- Default local presets are provided but host can replace allowed policies.
- Model/effort controls are separate from policy controls.
- Working directory appears only in starter/thread-start context.
- The send/stop control remains pinned bottom-right in composer layouts.

## Validation / CI Findings

Expected validation gates:

- `bun run test:unit`
- `bun run test:api-snapshots`
- `bun run test:package-resolution`
- `bun run validate:packages`
- `bun run test:e2e:fixtures`
- `bun run test:e2e:real-local` when Codex bridge behavior changes
- `bun run test:repo-skills`
- `bun run test:skills`

Browser-visible work requires Playwright evidence for desktop and compact
viewports, including composer send button pinning, compact icon-only controls,
menu containment, status labels, and gallery route readiness.

## Existing Skill / Command Findings

The planning skill currently supports four-lane research, but the implementation
todo must explicitly require four parallel subagent reviews after each phase.

Skills requiring updates:

- `.agents/skills/agent-ui-feature-planning`
- `.agents/skills/agent-ui-review`
- `.agents/skills/browser-qa`
- `skills/agent-ui`

Public skill updates must be validated with `bun run test:skills`. Repo-local
skill changes must be validated with `bun run test:repo-skills`.

## Web / Current-State Findings

External web research was intentionally skipped. The plan depends on local
repository state, generated Codex App Server schema, and vendored upstream
sources, all of which were inspected directly.

## Freshness / Staleness Findings

The repo-local feature planning summary was stale for this task. The current
live files were used as source of truth.

## Generated / Vendored / Protected File Findings

Do not hand-edit generated schema or vendored upstream files:

- `packages/codex/src/generated/**`
- `third_party/codex/**`

Generated outputs and snapshots should be updated through existing repo commands
only when implementation changes require them.

Docs screenshots under `docs/screenshots/**` should be updated only from the
showcase route set, not maintainer debug galleries.

## Risks

- Over-thinning `AgentChat` would make the library hard to use. Mitigation: keep
  a complete drop-in preset.
- Keeping old App/Plugin names would preserve the wrong mental model. Mitigation:
  deletion-first neutral integration API.
- View models can become too weak for custom hosts. Mitigation: expose rich
  structured view models and intentional `payload: unknown` only on request views.
- Protocol state migration touches core, codex normalizers, React hooks, tests,
  and docs. Mitigation: make it Phase 1.
- Gallery split can break docs screenshot tooling. Mitigation: route manifest is
  the single inventory with `audience`, `kind`, and `docsScreenshot`.

## Decisions

- No backwards compatibility.
- Reuse branch `codex/fixture-system-redesign-plan`.
- Keep a complete default preset; do not reduce the package to primitives.
- Root React entrypoint becomes default-focused.
- Add `./primitives` and `./headless` subpaths.
- Remove `threadUrlRouting` from default props; routing is host-owned.
- Delete `AgentWorkspace` from default public API.
- Delete App/Plugin composer-specific APIs.
- Use neutral composer integrations only if needed.
- Preserve protocol text elements instead of dropping them in React conversion.
- Split runtime status, active turn, last turn result, and server request queue.
- Replace "Run settings panel" with run policy + model/effort controls.
- Show cwd only in starter/thread-start context.
- Split public showcase and maintainer gallery.
- Run four parallel subagent reviews after every implementation phase.

## Rejected Approaches

- Add shims for the old App/Plugin composer APIs.
- Keep `/fixture-gallery` as the single public/debug gallery.
- Keep raw `ThreadState`/`TurnState` as React component props.
- Keep `thread.status` as the single source of execution truth.
- Move host routing, workspace authorization, upload storage, or picker behavior
  into Agent UI core.
- Treat `app/list` as a plugin/app marketplace contract.

## Remaining Unknowns

- Whether a public `advanced` subpath is needed, or whether headless plus
  primitives cover all legitimate host customization.
- Whether core raw state exports should move to a subpath in the same major
  change or remain root core diagnostic API for one implementation phase.
