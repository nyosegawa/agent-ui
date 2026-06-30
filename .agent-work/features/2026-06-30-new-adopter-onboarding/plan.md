# Plan

## Summary

- Rework Agent UI v3 around a clean new-adopter path: install the right packages, wire `AgentProvider` and `AgentChat`, attach the same-origin WebSocket bridge, apply CSS, understand host-owned policy, and validate a successful turn.
- Synchronize repository docs, npm package READMEs, examples, public `skills/agent-ui`, and repo-maintainer skills so the same boundary language appears everywhere.
- Because backward compatibility is not required, fix unsafe or ambiguous package behavior that would otherwise undermine the docs: bridge policy validation, upload cleanup scope, blocked waiting reasons, and a reusable success-path fixture story.

## Background

- Current v3 APIs are mostly shaped correctly for new apps, especially apps that use `AgentChat` or consciously choose `/headless` plus `/primitives`.
- The remaining problem is not that Agent UI owns the wrong runtime responsibilities. The problem is that the new adopter must infer too much from separated references and source code.
- Existing downstream migrations are out of scope. The plan assumes no adopter depends on the current wording or narrow result types.

## Current State

- README and installation docs emphasize React plus codex packages first; the server package appears later even though full chat requires a bridge.
- Browser and server snippets are separated across React and server-bridge docs.
- Recipes are indexed by file rather than task.
- Public Agent Skill references contain good material but should prioritize first-app flow and safe copy-paste snippets.
- `browserMethodPolicy` accepts unknown top-level strings by falling back to default productized behavior.
- Upload cleanup treats every stale root child directory as an Agent UI session.
- React controller `sendMessage()` collapses all blocked waiting states to `approval`.
- A realistic fake Codex App Server success path exists in an example, but not as a reusable fixture surface.

## Goals

- Give new adopters one canonical, copy-pasteable full-chat path.
- Make package boundaries and import choices obvious from README, package README files, docs, examples, and skills.
- Make `AgentChat` preset versus `components` versus `/headless` plus `/primitives` a deliberate choice.
- Make bridge admission, bearer subprotocols, local media, dynamic tools, and `advanced` boundaries explicit without moving host policy into Agent UI.
- Provide a reusable success-path testing story for `thread/start` through `turn/completed`.
- Ensure public and repo skills stay aligned with docs and examples.
- Produce phase-level validation and review evidence before implementation is considered complete.

## Non-Goals

- Preserve compatibility with earlier v3 adopter code.
- Migrate existing downstream applications.
- Add hosted runtime, auth, persistence, workspace registry, billing, deployment, or process supervision to Agent UI core.
- Replace the Codex App Server protocol or edit the vendored Codex submodule.
- Publish packages or merge the implementation PR as part of this plan.

## Repo-Specific Constraints

- Agent UI is a reusable Codex App Server UI component library, not a hosted
  runtime.
- Host applications own auth, persistence, routing, process lifecycle,
  deployment, billing, workspace isolation, upload storage, and workflow state.
- Use Bun for repository package operations.
- Do not edit the vendored Codex submodule directly.
- Do not hand-edit auto-created schema files or compiled artifacts.

## Design Decisions

- First-host-app docs should include both browser and server code on the same path, with Node version, package install, stylesheet import, same-origin WebSocket, local-loopback admission, and validation.
- README should route quickly: new host app, customize React UI, server bridge, examples, repo contributor setup.
- `AgentChat` remains the default recommendation. `components` handle visual replacement. `useAgentChatController().sendMessage()` handles host-side actions. `/headless` and `/primitives` are for owned layouts.
- Server docs should default to root bridge APIs. `/advanced` is documented only for raw process/stdio/custom lifecycle cases.
- Invalid `browserMethodPolicy` should be rejected before spawn, including values returned from `resolveBridgeOptions`.
- Upload cleanup should remove only Agent UI managed session directories, using a marker or reserved prefix, and docs should recommend a dedicated empty upload root.
- React blocked reasons should align with core waiting reasons. UI copy can remain generic, but public controller results should not mislabel permission, user input, MCP elicitation, auth refresh, or attestation as approval.
- Fake App Server fixture should be explicit. Prefer a `test-fixtures` subpath if the fixture is meant for downstream hosts; otherwise keep it repo-internal and document only the validation recipe.
- Public `skills/agent-ui` stays external-host focused. Repo-maintainer commands stay in `.agents/skills` and maintenance docs.

## Impacted Areas

- Packages: `@nyosegawa/agent-ui-server`, `@nyosegawa/agent-ui-react`, possibly `@nyosegawa/agent-ui-core` or `@nyosegawa/agent-ui-codex` if a public test fixture is added.
- Examples: `examples/recipes`, `examples/codex-local-web`, `examples/next-with-bridge-sidecar`, `examples/local-react-vite` only as needed for docs and validation.
- Docs: `README.md`, `docs/README.md`, `docs/installation.md`, `docs/getting-started.md`, `docs/guides/react.md`, `docs/guides/host-integration.md`, `docs/reference/server-bridge.md`, `docs/reference/hooks.md`, `docs/guides/attachments.md`, `docs/examples/recipes.md`, package README files, maintenance skill docs.
- Tests: server websocket/upload tests, React composer tests, API snapshots, package resolution, package validation, skills tests, repo skills tests, docs/policy tests, targeted e2e.
- Workflows/scripts: no workflow change expected; use current CI and validation scripts.
- Skills: `skills/agent-ui/**`, `.agents/skills/agent-ui-feature-planning`, `.agents/skills/example-authoring`, `.agents/skills/agent-ui-review`, possibly release/browser/release-validation references if touched.
- Protected surfaces: vendored Codex submodule, generated schema, built `dist`, secrets, local tokens, `.npmrc`.

## Validation Plan

- Focused: unit tests for each touched package, including websocket policy, upload cleanup, React blocked reasons, and fixture behavior.
- Broader: `bun run validate:fast`, relevant example typechecks/builds, docs tests, `bun run test:skills`, and `bun run test:repo-skills`.
- Browser: `bun run test:e2e:fixtures`; run `bun run test:e2e:real-local` when bridge/upload/controller behavior changes; targeted Playwright route matrix when browser-visible docs/examples change.
- Package/API: `bun run test:api-snapshots`, `bun run test:package-resolution`, `bun run validate:packages`, and changeset review for npm-facing README/API changes.
- CI follow-through: after PR creation, run `gh pr checks <PR>` and follow GitHub Actions to concrete success or failure. Inspect failed logs and fix in-scope failures.

## Commit, PR, And CI Plan

- Branch: `codex/new-adopter-onboarding-plan`
- Phase commit policy: one coherent commit per completed phase after validation and review, unless a phase must be split for reviewability.
- Task-level fallback policy: if a phase is too large, split it before editing and record the split in `todo.md`.
- PR title/body expectations: summarize new adopter onboarding, public/repo skill alignment, API safety fixes, validation evidence, changeset impact, and any deferred checks.
- Required checks: current CI required checks plus local focused validation recorded for docs-only or skill-heavy changes.
- CI follow-through: watch running workflows; fix in-scope failures; record final success or exact blocker in `todo.md`.

## Risks

- The fake fixture can become a de facto public protocol shim if exported too broadly.
- Docs and public skill can diverge unless tests assert important shared phrases and links.
- Changes to blocked reason types can require broad API snapshot and example updates.
- Upload cleanup changes must avoid leaving unmanaged stale files forever while protecting host-owned directories.
- A large docs pass can accidentally bury the product boundary; every new first-app snippet must say what the host still owns.

## Completion Criteria

- A new adopter can follow one documented path to wire React, transport, server bridge, CSS, admission policy, local media assumptions, and a successful first turn.
- README, docs index, installation/getting-started, React guide, host-integration, server-bridge reference, attachments guide, recipes index, and package README files agree on package imports and boundaries.
- Public `skills/agent-ui` and repo-maintainer skills are updated and tested.
- Invalid bridge method policies are rejected before spawn.
- Upload cleanup only deletes Agent UI managed session directories.
- Controller blocked reasons no longer mislabel all waiting states as approval.
- Success-path fake App Server fixture strategy is implemented and documented.
- Relevant tests, package validation, skills validation, browser validation, changesets, PR, and CI evidence are recorded.

## Open Questions

- Should the fake App Server fixture be public under a `test-fixtures` export or stay repo-internal? Decide before implementation edits in the fixture phase.
- Should docs introduce a new `docs/guides/first-host-app.md` page or fold the canonical path into existing installation/getting-started docs? Prefer a dedicated page if it reduces duplicated snippets.
- Should public `AgentComposerBlockedReason` reuse the core waiting reason type directly or expose a React-owned union that maps from core? Prefer a React-owned exported type if it keeps UI semantics stable.
