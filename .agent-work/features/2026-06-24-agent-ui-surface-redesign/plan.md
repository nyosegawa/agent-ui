# Agent UI Surface Redesign Plan

## Summary

Redesign Agent UI around a clean public model:

- A complete default chat preset for normal adopters.
- Explicit primitive and headless subpaths for custom hosts.
- Protocol-faithful core runtime state.
- Neutral composer integrations instead of App/Plugin-specific picker APIs.
- Run policy/model controls instead of the old Run settings panel.
- Split user-facing showcase routes from maintainer visual QA.
- Update docs, tests, screenshots, and skills in the same implementation.

This is a breaking redesign. No backwards compatibility is required.

## Background

The current fixture gallery and component set exposed several design problems:
debug UI appeared as product UI, App/Plugin concepts leaked into the composer,
working directory and run settings felt stale, responsive composer controls did
not consistently collapse, and "Needs approval" was used for broader waiting
states.

The deeper issue is that public API, internal state, protocol semantics, host
runtime hooks, examples, and docs are not separated clearly enough.

## Current State

Agent UI currently exposes a broad React root through
`packages/react/src/index.ts`. It includes default UI, primitives, hooks,
resources, i18n, timeline internals, usage helpers, and request option helpers.

`AgentChatProps` mixes preset concerns with routing, App/Plugin mention
callbacks, working directory selection, media resolution, component overrides,
usage/diagnostics, and thread URL synchronization.

Core thread state collapses upstream Codex runtime status, server requests,
turn completion, and UI activity into coarse values.

Examples route all public/demo/debug needs through one local Vite app and one
fixture gallery route.

Docs and skills contain guidance for surfaces that the redesigned API should
remove or rename.

## Goals

- Make the root React package a clear `AgentChat` preset entrypoint.
- Add explicit `./primitives` and `./headless` React subpaths.
- Remove App/Plugin-specific composer APIs and route any host picker through a
  neutral explicit-input integration model.
- Preserve Codex App Server protocol semantics instead of flattening them.
- Replace raw React store props with view-model types.
- Replace Run settings panel with run policy and model/effort controls.
- Keep working directory host-owned and starter/thread-start only.
- Split showcase and maintainer gallery routes.
- Update docs, examples, screenshots, tests, and skills.
- Require four parallel subagent reviews at each implementation phase boundary.

## Non-Goals

- No hosted runtime, auth system, process manager, billing, tenant isolation, or
  deployment policy in Agent UI.
- No upstream Codex submodule edits.
- No compatibility aliases for removed unshipped APIs.
- No root-level planning aliases outside `.agent-work/features/**`.
- No temporary MVP route or doc that must be cleaned later.

## Repo-Specific Constraints

- Agent UI-owned: public React package, core/codex adapters, view models,
  examples, visual QA routes, docs, skills, tests, snapshots, package exports.
- Host-owned: navigation/routing, workspace selection, native folder picker,
  upload storage, auth, process lifecycle, bridge admission, deployment,
  app/plugin marketplace UX, dangerous policy availability.
- Protected: `third_party/codex/**` and generated schema under
  `packages/codex/src/generated/**`.
- Example-only: local Vite routes, fixture data, visual QA manifests, demo
  bridge recipes.
- Docs-only: architecture/reference/guide updates and generated screenshot
  references.
- Release-sensitive: package export maps, API snapshots, package resolution,
  `publint`, `attw`, Node LTS compatibility.

## Design Decisions

1. Root React entrypoint is default-focused.

   Root keeps `AgentProvider` and the complete `AgentChat` preset. It stops
   exporting all primitives and hooks.

2. Add React subpaths.

   `@nyosegawa/agent-ui-react/primitives` contains styled, reusable components.
   `@nyosegawa/agent-ui-react/headless` contains controllers, provider
   internals needed by hosts, view-model types, run-policy state, and resource
   helpers.

3. Remove host routing from default.

   Delete `threadUrlRouting` from default props. Hosts that need URL sync compose
   routing with headless controllers. Preserve direct thread-link open/resume
   semantics by extracting the current `thread/read` + `thread/resume` behavior
   into an explicit headless controller or documented recipe before deletion.

4. Delete `AgentWorkspace` from the default public API.

   Product shells belong to examples or host apps.

5. Delete App/Plugin composer APIs.

   Remove `onRequestAppMention`, `onRequestPluginMention`, App/Plugin toolbar
   buttons, App/Plugin chip kinds, and fixture examples such as `app://browser`
   as product UI. Keep `app/list` metadata display separate from composer picker
   semantics.

6. Use neutral composer integrations only when needed.

   A host integration returns explicit `AgentUserInput` or `AgentUserInput[]`.
   React does not derive protocol mentions from labels or URI strings. Land the
   neutral integration path before removing named App/Plugin props so hosts are
   not forced to fork the composer.

7. Preserve text elements.

   React input conversion must preserve `AgentTextInput.text_elements` instead
   of replacing them with an empty array.

8. Introduce protocol-faithful runtime state.

   Store runtime status as `notLoaded | idle | systemError | active` with active
   flags, separate active turn, last turn result, and server request queue.

9. Classify server requests.

   Distinguish approval, permissions, user input, MCP elicitation, auth refresh,
   attestation, dynamic tool, and unknown requests. UI labels must match the
   actual waiting reason. Keep approval-only decision helpers separate from
   broad request `respond`/`reject` helpers, and do not retain dynamic tool calls
   as normal pending approval items.

10. Use view models for React.

   React components and hooks consume `AgentThreadSummaryView`,
   `AgentTranscriptView`, `AgentServerRequestView`, and `AgentApprovalView`, not
   raw reducer entities. Remove or convert the legacy `components.Item` raw-state
   override before freezing the public export snapshot.

11. Replace Run settings panel.

   Use `AgentRunPolicy`, policy menu, and model/effort menu. Working directory
   remains starter/thread-start only. Hosts supply allowed policies and folder
   resolvers. Test first-message merge order, model default effort behavior, and
   cwd request composition before composer UI cleanup.

12. Composer layout is a contract.

   At compact widths, policy/model controls collapse to icon triggers and the
   send/stop button remains bottom-right pinned and hit-testable.

13. Split examples and visual QA.

   Use `/showcase/*` for user-facing examples and `/maintainer-gallery` for
   closeups, probes, specimens, and iframe previews. The manifest records
   `audience`, `kind`, viewport coverage, owner specs, and docs screenshot
   eligibility.

14. Phase review is mandatory.

   After every implementation phase: run focused validation, spawn four
   parallel subagents for review, fix P1/P2 findings in the same phase, rerun
   relevant checks, then commit/push.

## Impacted Areas

- Agent UI-owned: `packages/core`, `packages/codex`, `packages/react`,
  `packages/web-components`, examples, docs, tests, screenshots, repo-local
  skills, public `skills/agent-ui`.
- Host-owned: routing and picker UX is documented as outside core; example
  hosts may demonstrate composition but must not become default policy.
- Protected: no hand edits to generated schema or `third_party/codex`.
- Example-only: Vite route split and manifest restructure.
- Docs-only: reference/architecture/guide/skill updates.
- Release-sensitive: package exports, build entries, declaration snapshots,
  runtime export policy, package resolution, `validate:packages`.

## Validation Plan

Per phase:

- Run the smallest focused tests covering the changed surface.
- Update docs/tests/examples/snapshots owned by that phase; do not defer public
  contract evidence to a late cleanup phase.
- Run `bun run test:api-snapshots` when public types change.
- Run `bun run test:package-resolution` and `bun run validate:packages` when
  exports/build output change.
- Run `bun run test:e2e:fixtures` for browser-visible route/layout changes.
- Run real browser QA for composer layout and gallery pages.
- Run `bun run test:repo-skills` for `.agents/skills` changes.
- Run `bun run test:skills` for public `skills/agent-ui` changes.
- Run four parallel subagent reviews and record evidence in `todo.md`.

Final validation:

- `bun run validate:fast`
- `bun run validate:packages`
- `bun run validate:release`
- `bun run test:e2e:fixtures`
- `bun run test:repo-skills`
- `bun run test:skills`
- Add `bun run test:e2e:real-local` if Codex bridge semantics changed in a way
  not covered by fixtures.

## Commit, PR, And CI Plan

Implementation continues on `codex/fixture-system-redesign-plan`.

Each phase should be committed and pushed after validation and subagent review.
Open or update one PR for the branch, then follow GitHub Actions to concrete
success or failure before claiming readiness.

## Risks

- The public API change is broad. Mitigate with API snapshots, package
  resolution tests, and docs updates in the same phases.
- Protocol state changes can break rendering and retry behavior. Mitigate by
  implementing core/codex first with reducer/normalizer tests.
- Default may become too thin. Mitigate by keeping a complete default preset.
- Neutral composer integration could be underpowered. Mitigate by returning
  explicit `AgentUserInput[]` and rich chip metadata.
- Gallery split may invalidate screenshots. Mitigate by manifest-driven docs
  screenshots and route matrix tests.

## Completion Criteria

- Root, primitive, and headless APIs are clear and documented.
- No App/Plugin-specific composer picker API remains in React public surface.
- Raw reducer state is not required for React public component customization.
- Runtime state and server request UI preserve Codex protocol distinctions.
- Direct-link live-session resume is preserved via headless controller/recipe.
- Run policy/model/cwd responsibilities are clear and tested.
- Showcase and maintainer gallery are separate.
- Docs, skills, examples, tests, snapshots, and package exports match the new
  design.
- Each implementation phase has validation and four-subagent review evidence.
- Branch is pushed and CI outcome is recorded.

## Open Questions

- Decide whether an `advanced` React subpath is necessary after headless and
  primitives are implemented.
- Decide whether raw core state exports move to a core `state`/`testing`
  subpath immediately or stay in core root as a deliberate low-level API.
