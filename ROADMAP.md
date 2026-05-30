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

Goal: use Codex hooks to make repeated repository work safer without replacing
normal validation or review.

Codex hook facts to preserve in docs and implementation:

- Hooks are enabled by default and can be disabled with `[features].hooks =
  false`; `hooks` is the canonical feature key.
- Codex discovers project-local `hooks.json` or inline `[hooks]` tables under
  `.codex/`, plus user, managed, and plugin-bundled hooks.
- Project-local hooks run only after the project `.codex/` layer is trusted.
  Non-managed command hooks must be reviewed and trusted through `/hooks`.
- Multiple matching hooks run, and matching command hooks for the same event can
  run concurrently.
- Only `type: "command"` handlers run today; `prompt`, `agent`, and async hooks
  are parsed but skipped or unsupported.
- Commands receive one JSON object on stdin and run with the session `cwd`.
- Useful events for this repo include `SessionStart`, `UserPromptSubmit`,
  `PreToolUse`, `PermissionRequest`, `PostToolUse`, `PreCompact`,
  `PostCompact`, `SubagentStart`, `SubagentStop`, and `Stop`.

Planned repo-local hooks:

- `SessionStart`: surface current Agent UI repository rules and remind agents
  to read `AGENTS.md`, relevant docs, tests, and examples before editing.
- `UserPromptSubmit`: warn when a request asks for host-runtime behavior inside
  the core library or asks to modify the upstream Codex checkout.
- `PreToolUse`: block or warn on destructive git commands, unsafe package
  publish commands, accidental upstream checkout edits, and direct reads from
  generated or dist output when a source file should be used.
- `PermissionRequest`: apply repository policy before elevated shell or file
  operations are approved.
- `PostToolUse`: detect changed generated artifacts, package exports, public
  API snapshots, or CSS token contracts and recommend focused validation.
- `Stop`: remind agents to report validation, dirty working tree state, and
  remaining risks before ending substantial work.
- `SubagentStart` and `SubagentStop`: inject repository-specific review
  criteria for protocol, React UX, server security, and package boundary
  subagents.

Implementation plan:

- Add `.codex/hooks.json` with minimal, documented project-local hooks.
- Keep hook scripts small, deterministic, and cross-platform where practical.
- Prefer Node or Bun scripts already compatible with the repository toolchain.
- Avoid hook behavior that silently edits files.
- Document trust, review, and disabling behavior in
  `docs/maintenance/codex-hooks.md`.
- Add fixture tests for hook scripts where they parse hook stdin or enforce
  repository policy.

Validation target:

- hook script unit tests
- `bun run lint`
- `bun run typecheck`
- manual `/hooks` review in Codex after hook definitions change

## M3: Publish User-Installable Agent UI Skills

Goal: let users install skills that help an agent integrate Agent UI into their
own applications.

User-facing skills live under `skills/<skill-name>/SKILL.md`. This layout is
discoverable by both `npx skills add` and `gh skill install`.

Planned user-facing skills:

- `skills/integrate-agent-ui/SKILL.md`: inspect a host app and integrate Agent
  UI packages, CSS, provider setup, transcript, composer, and validation.
- `skills/add-codex-server-bridge/SKILL.md`: add a local Codex App Server bridge
  with same-origin WebSocket routing, one-shot RPC policy, upload handling, and
  safe defaults.
- `skills/build-agent-ui-nextjs/SKILL.md`: add a Next.js App Router integration
  using Agent UI React components and server bridge helpers.
- `skills/customize-agent-ui-theme/SKILL.md`: apply host theming through
  `--aui-*` tokens without deep CSS imports or raw visual constants.
- `skills/add-dynamic-tools/SKILL.md`: add host-owned dynamic tools with manual
  permission review, bounded grants, and focused tests.
- `skills/upgrade-agent-ui/SKILL.md`: update an existing Agent UI integration
  across package versions, API snapshots, docs, and validation.

Install examples to support in the docs:

```sh
npx skills add nyosegawa/agent-ui --skill integrate-agent-ui -a cursor -y
npx skills add nyosegawa/agent-ui --skill '*' -a cursor
gh skill install nyosegawa/agent-ui integrate-agent-ui --agent cursor --scope project
gh skill install nyosegawa/agent-ui skills/integrate-agent-ui/SKILL.md --agent cursor --scope project
```

Compatibility notes:

- `npx skills add` supports GitHub shorthand, GitHub URLs, local paths, direct
  skill paths, `--skill`, `--agent`, `--global`, `--copy`, `--list`, and `-y`.
- `gh skill install` supports GitHub repositories, local directories with
  `--from-local`, exact skill paths, `--agent`, `--scope`, `--pin`, and source
  tracking for updates.
- The canonical published layout should remain `skills/*/SKILL.md`.
- User-facing skills should avoid repo-maintainer assumptions and should work
  in external SaaS, Next.js, Vite, and custom host applications.

## M4: Add Repository Development Skills

Goal: help maintainers work on Agent UI itself without mixing internal
maintenance instructions into user-installable skills.

Repository-development skills live under `.agents/skills/<skill-name>/SKILL.md`.
These are for contributors and maintainers working inside this repository.

Planned development skills:

- `.agents/skills/codex-upstream-sync/SKILL.md`: refresh Codex generated schema,
  classify protocol changes, update fixtures, and run focused validation.
- `.agents/skills/protocol-drift-review/SKILL.md`: review upstream schema drift
  and decide stable, host-only, experimental, or unsupported classification.
- `.agents/skills/release-validation/SKILL.md`: run the package validation ladder,
  API snapshots, package-resolution smoke, and release notes checks.
- `.agents/skills/example-authoring/SKILL.md`: add or update examples while
  preserving Agent UI package boundaries and design-system tokens.
- `.agents/skills/browser-qa/SKILL.md`: run browser-visible checks for transcript,
  composer, approvals, usage, layout, mobile reachability, and overflow.

Internal skills may use repository-specific commands and validation gates.
User-facing skills should not.

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
