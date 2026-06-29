# Research

## Scope

- Feature/problem: Redesign Agent UI v3 new-adopter onboarding, docs, public Agent Skill guidance, repository skill guidance, and the small API/test gaps that currently force adopters to infer correct host boundaries from source.
- Canonical artifact directory: `.agent-work/features/2026-06-30-new-adopter-onboarding`
- Planning date: 2026-06-30
- Requested outcome: Produce a complete implementation plan. Backward compatibility is not required. Assume no production apps have already adopted the current shape.

## Freshness Check

- Manifest path: `.agents/skills/agent-ui-feature-planning/references/freshness-manifest.json`
- Last full research commit: `499a9020dde99b72e0f89ad0d4b2d9bcd0d7b642`
- Current commit: `de40a498107428b4f1741394a1202146d21922e0`
- Watched input result: `refresh-needed`
- Refresh mode: targeted refresh
- Files or globs refreshed: `package.json`, `docs/architecture/product-boundary.md`, `docs/architecture/testing.md`, `docs/maintenance/ci-cd.md`, `docs/reference/package-exports.md`, `.github/workflows/ci.yml`, `.github/workflows/compatibility.yml`, `.agents/skills/*/references/*.md`, `docs/architecture/*.md`, `docs/maintenance/*.md`, `docs/reference/*.md`
- Manifest updated: no. This planning package records the targeted refresh evidence and treats current files as canonical for implementation.
- Notes: The stale summary was used only as a navigation aid. All findings below are grounded in current files or subagent inspections on this branch.

## Investigation Method

- Repo root: `/Users/sakasegawa/src/github.com/nyosegawa/agent-ui`
- Subagents used: 4 concurrent lanes after the main-agent refresh pass.
- Research rounds: 1 main-agent repository pass, 1 four-lane subagent pass, plus prior 20-subagent opinion-gathering from the same conversation.
- Main-agent inspections: README, installation/getting-started, React guide, host-integration, server bridge, attachments, examples/recipes, package README files, public skill, repository skills, server bridge implementation, upload helper, React composer controller, core waiting reason model, fake App Server fixtures, CI/testing docs.
- Web/current research: `npm view @nyosegawa/agent-ui-{react,server,codex}` confirmed latest registry version `3.0.0` and `gitHead` `de40a498107428b4f1741394a1202146d21922e0`.

## Subagent Rounds

### Round 1

- Lane: Repo guidance and docs onboarding
- Prompt/source: Inspect current docs and skills for new adopter pain points.
- Findings: First-app path is split across README, installation, React guide, and server-bridge reference. `AgentChat` versus `components` versus `/headless` and `/primitives` needs a decision table. Recipes are file-list oriented instead of task oriented. Package README files need common import tables.
- Follow-up needed: Add a first-host-app guide or equivalent integrated flow, then synchronize README, docs index, React guide, host-integration, recipes, and package READMEs.

### Round 2

- Lane: Implementation and public surface
- Prompt/source: Inspect bridge, upload, controller, exports, and fixtures for gaps that affect new adopters.
- Findings: Unknown top-level `browserMethodPolicy` strings fall through to default productized behavior. Upload cleanup treats all stale root directories as Agent UI sessions. React composer returns only `approval` as blocked reason even though core distinguishes permission, user input, MCP elicitation, auth refresh, attestation, and unknown. Reusable success-path fake App Server fixture is not packaged or clearly available.
- Follow-up needed: Add fail-closed policy validation, managed-session upload cleanup, richer controller blocked reason, and a deliberate fake App Server fixture surface.

### Round 3

- Lane: Validation and CI
- Prompt/source: Inspect validation docs, workflows, and current branch state.
- Findings: Docs-only CI is intentionally light, so local focused validation must be recorded. Package/export/API changes require package validation and snapshots. Public skill and repo skills have separate test gates. PRs must be followed to concrete CI success or failure.
- Follow-up needed: Make validation mandatory per phase and record exact commands in `todo.md`.

### Round 4

- Lane: Agent Skill design
- Prompt/source: Inspect `skills/agent-ui`, `.agents/skills`, and best practices.
- Findings: Public skill structure is good, but it should route new-adopter first and keep repo-maintainer commands out of external host guidance. Repo skills should require docs/examples/public-skill alignment for onboarding work. Upload examples need safe `response.ok` and shape validation.
- Follow-up needed: Refresh public and repo skills, and add skill tests for first-app, root versus advanced, uploads, Node version, and validation wording.

## Sources Inspected

- `AGENTS.md`
- `docs/architecture/product-boundary.md`
- `docs/README.md`
- `CONTRIBUTING.md`
- `docs/architecture/testing.md`
- `docs/maintenance/ci-cd.md`
- `docs/reference/package-exports.md`
- Relevant implementation: `packages/server/src/websocket.ts`, `packages/server/src/upload.ts`, `packages/react/src/hooks/composer.ts`, `packages/react/src/hooks/composer-types.ts`, `packages/core/src/stores/thread-runtime.ts`, `packages/core/src/fake-transport.ts`
- Relevant tests: `packages/server/test/websocket.test.ts`, `packages/server/test/upload.test.ts`, `test/agent-ui-skill.test.ts`, `test/repository-skills.test.ts`, docs and package script tests
- Relevant examples: `examples/codex-local-web/e2e/fake-codex-app-server.ts`, `examples/recipes`, Next sidecar example, local React Vite example
- Relevant skills: `skills/agent-ui/SKILL.md`, `skills/agent-ui/references/*.md`, `.agents/skills/agent-ui-feature-planning`, `.agents/skills/example-authoring`, `.agents/skills/agent-ui-review`, `.agents/skills/release-validation`, `.agents/skills/browser-qa`
- Relevant workflows/scripts: `.github/workflows/ci.yml`, `.github/workflows/compatibility.yml`, `scripts/check-release-targets.mjs`, `scripts/package-resolution-smoke.mjs`
- Web/current sources: npm registry via `npm view`

## Findings

- The user-supplied diagnosis is correct: new adoption is technically viable, but the fastest safe path is under-documented.
- Current docs explain product boundaries well, but force new adopters to stitch browser, server, transport, CSS, security policy, and validation from multiple pages.
- The plan must include actual package behavior fixes where docs alone would encode unsafe or ambiguous behavior.
- Backward compatibility is not a constraint, so the cleanest result is to remove old migration-centered wording and make v3 new-adopter boundaries explicit.

## Repo Guidance Findings

- Agent UI is a reusable Codex App Server UI component library, not a hosted app runtime.
- Host apps own auth, persistence, routing, process lifecycle, deployment, billing, workspace isolation, upload storage, dynamic tool policy, audit policy, and workflow state.
- Use Bun for repository operations.
- Do not edit `third_party/codex` directly.
- Do not hand-edit generated schema or compiled output.
- Package README and changelog changes are package-surface changes, not trivial docs-only changes.

## Architecture / Boundary Findings

- Full chat requires a same-origin WebSocket bridge. One-shot RPC routes are not an `AgentChat` transport.
- `@nyosegawa/agent-ui-server` root APIs should be the default; `/advanced` belongs only to raw process/stdio/control-plane ownership.
- `Origin` and same-origin routing reduce cross-site exposure but are not authentication.
- `resolveBridgeOptions` is the right per-connection customization point, but browser-provided cwd, env, and method policy must never be trusted.
- `@nyosegawa/agent-ui-core/internal` is published for Agent UI packages and tests, not for host apps.
- React public guidance should steer: `AgentChat` first, `components` for visual replacement, controller for host actions, `/headless` plus `/primitives` for owned layouts.

## Validation / CI Findings

- Current CI jobs include repository policy, typecheck, lint, unit tests, protocol and fixtures, package validation, API snapshots, package resolution, Playwright fixtures, and real local smoke.
- Docs-only PRs can run a small CI subset; local focused validation must be recorded in the PR.
- `validate:packages` is order-sensitive and should not be decomposed into parallel build/publint/attw steps.
- Public skill changes require `bun run test:skills`.
- Repository skill changes require `bun run test:repo-skills`.
- Bridge, upload, controller, fixture, or browser-visible example changes require focused unit tests plus relevant real-local or Playwright coverage.

## Existing Skill / Command Findings

- Public `skills/agent-ui` already follows progressive disclosure: short `SKILL.md`, detailed references, and completion requirements.
- Public skill should route new-adopter/first-host-app requests before upgrade/debug paths.
- Public skill must not leak repo-maintainer commands such as repository Playwright route names to external hosts.
- `.agents/skills/example-authoring` still mentions `docs/recipes/`, while current docs say recipes stay under `examples/recipes` and `docs/examples/recipes.md`.
- Repo-maintainer skills should explicitly treat public skill/docs/examples/package README drift as reviewable onboarding regressions.

## Web / Current-State Findings

- npm latest for `@nyosegawa/agent-ui-react`, `@nyosegawa/agent-ui-server`, and `@nyosegawa/agent-ui-codex` is `3.0.0`.
- The published `gitHead` matches current `HEAD`, so current repo docs and package surfaces are the right planning baseline.

## Freshness / Staleness Findings

- The feature-planning freshness manifest is stale relative to current `main`.
- Current docs and package exports have moved since the last full research summary.
- Implementation should not rely on the stale summary for exact commands, exported names, or CI behavior.

## Generated / Vendored / Protected File Findings

- Do not edit the vendored Codex submodule for this work.
- Do not hand-edit `dist`, generated schema output, or API snapshot output by manual patch. Regenerate snapshots through repository scripts if API changes.
- Changesets may be required because package README changes are npm-facing and planned API behavior changes affect public packages.

## Risks

- A docs-only implementation would leave unsafe bridge/upload/controller ambiguity in place.
- A public fake App Server fixture may accidentally become an unstable API if it is exposed without a clear test-fixture boundary.
- Expanding blocked reasons is a public API change and must be reflected in docs, types, snapshots, and examples at the same time.
- Upload cleanup behavior can delete host-owned directories today if a shared root is configured; the fix must preserve managed sessions while avoiding arbitrary directory cleanup.
- Public skill guidance can become too repository-specific if validation commands are copied from maintainer docs.

## Decisions

- Plan the work as a breaking, v3-new-adopter-first redesign because backward compatibility is explicitly not required.
- Treat first-host-app onboarding as the canonical path, then make README, docs index, package README files, recipes, and public skill point to it.
- Fix API/behavior gaps that would otherwise make the docs lie or leave new adopters with unsafe defaults.
- Keep host runtime policy outside Agent UI core even while improving bridge helpers and validation examples.
- Keep implementation and planning on branch `codex/new-adopter-onboarding-plan`.

## Rejected Approaches

- Do not build a hosted app runtime or registry into Agent UI.
- Do not document `internal`, `dist`, or source imports as host-app escape hatches.
- Do not present one-shot RPC as sufficient for `AgentChat`.
- Do not make public `skills/agent-ui` a repository maintenance manual.
- Do not defer all issues to docs; several safety and public-result gaps need package changes.

## Remaining Unknowns

- The exact fake App Server fixture surface should be decided during implementation: public test-fixture subpath versus repo-internal helper. The plan recommends a deliberate `test-fixtures` surface only if downstream host tests are a stated goal for the package.
- The exact wording for generic UI labels for non-approval waiting states should be reviewed with the React component behavior during implementation.
- If public API snapshots change, the implementation agent must regenerate and inspect the resulting snapshot diff.
