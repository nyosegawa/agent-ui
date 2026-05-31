# Agent UI Roadmap

Agent UI is a reusable Codex App Server UI component library. The next phase is
not to turn the library into a host runtime. It is to keep the Codex integration
fresh, make the package easy to adopt, and publish concrete host-application
recipes around stable Agent UI primitives.

## Principles

- Keep the core packages focused on primitives, hooks, adapters, normalizers,
  server bridge utilities, and documented extension points.
- Treat host workflows as external compositions of Agent UI primitives, not as
  core package behavior.
- Productize stable Codex App Server surfaces first. Keep experimental,
  host-only, and unsupported protocol surfaces explicitly gated.
- Make upstream protocol drift cheap to detect and review before it reaches
  React or host examples.
- Prefer installable skills, recipes, examples, and docs over adding
  host-specific APIs to the core library.

## M0: Refresh The Documentation Baseline

Status: Complete.

Goal: make the repository documentation reflect the current implementation
before new roadmap work starts.

Documentation surfaces to audit:

- `README.md`
- `docs/README.md`
- `docs/**/*.md`
- `docs/examples/*.md`
- `docs/guides/*.md`
- `docs/reference/*.md`
- `docs/architecture/*.md`
- `examples/**/README.md`
- `examples/recipes/*.md`
- `packages/codex/src/generated/README.md`
- `AGENTS.md` and the symlinked `CLAUDE.md`
- `.changeset/*.md` when release notes are part of the change

Update pass:

- Align every public guide with the current package boundaries, public exports,
  supported protocol surface, and server bridge behavior.
- Remove stale planning language and dated implementation notes from public
  docs.
- Ensure docs describe Agent UI as a Codex App Server UI component library, not
  a host runtime.
- Keep `app/list` documented as Codex Apps/connectors protocol.
- Verify all documented imports use public package exports and the single React
  stylesheet import, `@nyosegawa/agent-ui-react/styles.css`.
- Refresh examples docs so they match the current example routes, package
  scripts, screenshots policy, validation commands, and security defaults.
- Add docs-sync tests where claims can drift mechanically, such as package
  exports, script names, protocol method lists, and example route lists.

Validation target:

- `bun run test:api-snapshots`
- `bun run test:package-resolution`
- `bun run test:styles` when style import or theming docs change
- focused docs/package script tests
- `bun run typecheck` when examples or documented snippets are backed by code

## M1: Automate Codex App Server Updates

Status: Complete.

Goal: make it routine to follow the latest Codex App Server schema without
guesswork or large manual audits.

Completed work:

- Added `third_party/codex` as the checked-in upstream submodule and made it the
  source of truth for schema generation.
- Added `.agents/skills/codex-upstream-sync` with review instructions and a
  Codex Automation prompt.
- Added `codex:upstream:info`, `codex:upstream:drift`, and
  `codex:upstream:prepare` scripts.
- Added protocol classification and submodule-pointer guard tests.
- Documented the weekly Sunday 09:00 Japan time automation setup in
  `docs/maintenance/codex-upstream-sync.md`.
- Proved the flow with PR #3, which refreshed Codex App Server schema to
  `3e7baa00e43419967d90d6ad9cef40f58d5ac89f` and merged with CI green.

Original scope:

- Add a maintenance guide at `docs/maintenance/codex-upstream-sync.md`.
- Add `third_party/codex` as the checked-in upstream submodule and make it the
  only source used by schema-update commands.
- Add a schema-update command that wraps the generated-schema flow:
  `bun --filter @nyosegawa/agent-ui-codex generate:schema`.
- Add a protocol drift report script that summarizes:
  - new, removed, and changed stable methods
  - new, removed, and changed experimental methods
  - generated type changes that affect request builders or method results
  - notification and server-request method changes
  - fixture manifest commit drift
- Keep the method classification reviewable:
  - `stableProductized`
  - `hostOnly`
  - `experimentalAvailable`
  - `experimentalUnsupported`
- Add a checklist for updating generated schemas, protocol metadata, fixtures,
  API snapshots, docs, and focused tests in one reviewable branch.
- Keep update automation local-first. CI can run the same commands later, but
  local scripts must be sufficient when hosted CI capacity is unavailable.

Validation target:

- `bun run test:protocol`
- `bun run test:api-snapshots`
- `bun run typecheck`
- `bun run test:package-resolution`
- focused Codex request-builder and normalizer tests when generated types change

## M2: Add Codex Hooks For Development Stability

Status: Complete.

Agent UI now has project-local Codex hooks for repository development stability.
The hook policy is implemented in `.codex/hooks.json` and
`scripts/codex-hooks/repo-policy.mjs`, with deterministic logic in
`scripts/codex-hooks/repo-policy-lib.mjs`.

Completed behavior:

- `SessionStart` and `SubagentStart` inject repository-specific development and
  review context.
- `UserPromptSubmit` adds context for upstream Codex checkout edits, package
  publication, and host-runtime boundary requests.
- `PreToolUse` and `PermissionRequest` block destructive git commands, force
  pushes, package publishes, non-Bun repository package mutations, direct
  upstream submodule edits, and direct generated/dist output mutations.
- `PostToolUse`, `SubagentStop`, and `Stop` inspect dirty paths and recommend
  focused validation without editing files or forcing continuation.

Completion artifacts:

- `docs/maintenance/codex-hooks.md` documents hook runtime facts, trust/review
  behavior, installed hook behavior, validation, and maintenance rules.
- `bun run test:hooks` covers the policy fixtures.
- `docs/architecture/testing.md` and package script docs mention the focused
  hook gate.

## M3: Publish User-Installable Agent UI Skills

Goal: let users install skills that help an agent integrate Agent UI into their
own applications.

Status: Complete.

User-facing skills live under `skills/<skill-name>/SKILL.md`; repository
maintainer skills stay under `.agents/skills/`.

Completed user-facing skill:

- `skills/agent-ui/SKILL.md`: orchestrator skill for integrating, customizing,
  debugging, and upgrading Agent UI in external Codex App Server host apps.
- `skills/agent-ui/references/`: focused references for integration profiles,
  local single-user apps, host-owned remote constraints, WebSocket bridge,
  layout composition, theming, uploads, dynamic tools, debugging, and validation.

Install examples supported by the docs:

```sh
npx skills add nyosegawa/agent-ui --skill agent-ui -a cursor -y
gh skill install nyosegawa/agent-ui agent-ui --agent cursor --scope project
gh skill install nyosegawa/agent-ui skills/agent-ui/SKILL.md --agent codex --scope project
```

Completion artifacts:

- `docs/maintenance/agent-ui-skills.md` documents install commands, public
  skill boundaries, reference files, and validation.
- `bun run test:skills` guards frontmatter, distribution layout, reference
  links, current Agent UI public API terminology, and public-skill boundary
  assumptions.
- `README.md`, `docs/README.md`, and `docs/architecture/testing.md` link the
  skill and focused validation gate.

## M4: Add Repository Development Skills

Goal: help maintainers work on Agent UI itself without mixing internal
maintenance instructions into user-installable skills.

Repository-development skills live under `.agents/skills/<skill-name>/SKILL.md`.
These are for contributors and maintainers working inside this repository.

Status: Complete.

Completed development skills:

- `.agents/skills/codex-upstream-sync/SKILL.md`: weekly or manual App Server
  drift checks, schema refreshes, and draft upstream sync PR creation.
- `.agents/skills/agent-ui-review/SKILL.md`: repository-specific PR, branch,
  diff, and generated-change review with findings-first output.
- `.agents/skills/release-validation/SKILL.md`: release, package boundary, API
  snapshot, package-resolution, CI, and publish-risk validation.
- `.agents/skills/example-authoring/SKILL.md`: examples, recipes, fixture routes,
  docs-site examples, and example docs while preserving package boundaries and
  design-system tokens.
- `.agents/skills/browser-qa/SKILL.md`: browser-visible QA with Playwright and
  agent-browser for transcript, composer, approvals, usage, layout, mobile,
  focus, hit testing, and overflow.

Completion artifacts:

- `docs/maintenance/repository-skills.md` documents maintainer-only skill
  purpose, development flow, public skill separation, and validation.
- `bun run test:repo-skills` guards frontmatter, one-level references, role
  separation, and ownership-boundary wording.
- `docs/architecture/testing.md` and package script docs mention the focused
  repository skill gate.

## M5: Make The Official Site Useful

Goal: create a clear public entry point for installation, examples, and API
guidance.

- Acquire and configure a project domain.
- Promote the docs site into the official page.
- Add an implementation-focused landing page:
  - what Agent UI is
  - what Agent UI is not
  - package overview
  - install commands
  - minimal React usage
  - Codex App Server bridge overview
  - theming and customization overview
- Add an examples index with screenshots or short videos.
- Add a skills page with install commands for `npx skills add` and
  `gh skill install`.
- Add a maintenance page explaining Codex App Server update strategy and support
  policy.

## M6: Expand Examples And Recipes

Goal: show how to compose Agent UI primitives in real host applications without
making the core library host-specific.

Planned examples:

- `examples/next-app-router`: minimal Next.js App Router integration.
- `examples/next-with-auth`: authenticated same-origin bridge example.
- `examples/next-saas-workspace`: workspace-scoped session and upload example.
- `examples/vite-minimal`: smallest useful Vite integration.
- `examples/custom-layout`: transcript, composer, usage, approvals, and apps
  rendered as separately composed primitives.
- `examples/approvals-only`: approval queue and transcript anchoring surface.
- `examples/apps-connectors`: Codex Apps/connectors list and refresh behavior.
- `examples/dynamic-tools`: host-owned tool calls with explicit permission
  decisions.
- `examples/uploads`: host-resolved local attachment paths and image thumbnails.
- `examples/read-only-thread`: history/resume/read-only transcript embedding.
- `examples/theme-customization`: token-based host theming.

Planned recipes:

- `docs/recipes/nextjs-app-router.md`
- `docs/recipes/server-bridge-auth.md`
- `docs/recipes/uploads.md`
- `docs/recipes/dynamic-tools.md`
- `docs/recipes/apps-connectors.md`
- `docs/recipes/custom-layouts.md`
- `docs/recipes/theming.md`
- `docs/recipes/approval-flows.md`

## M7: Rebuild Existing Host Applications On Agent UI

Goal: demonstrate concrete uses of the library in real applications while
keeping application orchestration outside the core packages.

- Identify existing host applications that should move to the current Agent UI
  package surface.
- Rebuild them as host applications that compose:
  - `@nyosegawa/agent-ui-core`
  - `@nyosegawa/agent-ui-codex`
  - `@nyosegawa/agent-ui-react`
  - `@nyosegawa/agent-ui-server`
- Keep app-specific state machines, persistence policies, routing, lifecycle,
  and orchestration in the host application.
- Convert useful host patterns into examples, recipes, or user-facing skills
  only when they generalize beyond one application.
- Avoid adding host-only APIs to Agent UI just because a rebuilt application
  needs them.

## M8: Improve CI/CD Reliability

Goal: make hosted validation useful and economical while preserving local-first
development.

- Keep local validation commands as the source of truth for developers.
- Split CI into focused jobs:
  - typecheck and lint
  - unit tests
  - protocol and fixture tests
  - package validation
  - API snapshots
  - package resolution smoke
  - Playwright fixtures
  - optional real-local App Server checks
- Add path filters so docs-only, package-only, protocol-only, and UI-only
  changes do not always run every expensive job.
- Add concurrency cancellation for superseded pushes.
- Cache Bun dependencies, Playwright browsers, and build artifacts where safe.
- Keep `build`, `publint`, and `attw` ordered; do not parallelize package
  output validation steps that mutate `dist/`.
- Upload Playwright traces, screenshots, logs, and package validation output as
  artifacts on failure.
- Add scheduled or manually triggered Codex upstream drift checks once CI
  capacity is available.
- Add release workflows that run the full release ladder before publish, but
  keep publish itself explicitly gated.
- Document which CI checks are required for PRs, releases, and upstream protocol
  refreshes.

Validation target:

- CI workflow dry run or local action lint where available
- existing local validation ladder
- a documented fallback path when hosted CI capacity is unavailable

## M9: Release And Support Operations

Goal: make publishing predictable and keep the public surface stable.

- Prepare npm package publishing for:
  - `@nyosegawa/agent-ui-core`
  - `@nyosegawa/agent-ui-codex`
  - `@nyosegawa/agent-ui-react`
  - `@nyosegawa/agent-ui-server`
  - `@nyosegawa/agent-ui-web-components`
- Decide the package access, provenance, registry, and npm automation token
  strategy before the first public release.
- Define stable and prerelease channels:
  - stable releases for reviewed package updates
  - prerelease or canary releases for protocol refresh validation
  - local package tarball smoke tests before publishing
- Use Changesets or an equivalent changelog workflow to collect package-scoped
  release notes during normal development.
- Document the continuous release path from merged change to npm publish:
  - version planning
  - changelog generation
  - package build
  - package validation
  - provenance-enabled publish
  - post-publish package-resolution smoke
  - docs/site update when public behavior changes
- Define semver policy for:
  - React component props
  - core state and event contracts
  - Codex generated type exposure
  - server bridge behavior
  - CSS token contract
  - behavioral security defaults
- Add or document release commands:
  - `bun run validate:fast`
  - `bun run validate:protocol`
  - `bun run validate:packages`
  - `bun run test:api-snapshots`
  - `bun run test:package-resolution`
  - `bun run check:dead-code`
- Keep `build`, `publint`, and `attw` ordered through
  `bun run validate:packages`.
- Add a release checklist at `docs/maintenance/release-checklist.md`.
- Decide whether to use Changesets or a lightweight changelog process.
- Add `docs/maintenance/npm-release.md` for first release, prerelease, stable
  release, rollback/deprecation, and post-publish verification.
- Add browser QA expectations for release candidates:
  - desktop transcript and composer
  - mobile composer and approvals
  - long transcript and windowing
  - uploads
  - token usage
  - app connectors

## Suggested Order

1. M0: documentation baseline refresh.
2. M1: Codex App Server update automation.
3. M2: Codex hooks for development stability.
4. M3: user-installable skills under `skills/`.
5. M4: repository development skills under `.agents/skills/`.
6. M5: official site and docs entry point.
7. M6: examples and recipes.
8. M7: host application rebuilds.
9. M8: CI/CD reliability.
10. M9: release and support operations.

The guiding rule is simple: keep Agent UI itself small and stable, then make it
easy for host applications and agents to compose it correctly.
