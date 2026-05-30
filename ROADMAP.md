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

## M1: Automate Codex App Server Updates

Goal: make it routine to follow the latest Codex App Server schema without
guesswork or large manual audits.

- Add a maintenance guide at `docs/maintenance/codex-upstream-sync.md`.
- Add a schema-update command that wraps the existing generated-schema flow:
  `CODEX_REPO=<codex-checkout> bun --filter @nyosegawa/agent-ui-codex generate:schema`.
- Add a protocol drift report script that summarizes:
  - new, removed, and changed stable methods
  - new, removed, and changed experimental methods
  - generated type changes that affect request builders or method results
  - notification and server-request method changes
  - fixture manifest commit drift
- Keep the method classification reviewable:
  - `stableProductized`
  - `stableAvailable`
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

## M2: Publish User-Installable Agent UI Skills

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

## M3: Add Repository Development Skills

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

## M4: Make The Official Site Useful

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

## M5: Expand Examples And Recipes

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

## M6: Rebuild Existing Host Applications On Agent UI

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

## M7: Release And Support Operations

Goal: make publishing predictable and keep the public surface stable.

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
- Add browser QA expectations for release candidates:
  - desktop transcript and composer
  - mobile composer and approvals
  - long transcript and windowing
  - uploads
  - token usage
  - app connectors

## Suggested Order

1. M1: Codex App Server update automation.
2. M2: user-installable skills under `skills/`.
3. M3: repository development skills under `.agents/skills/`.
4. M4: official site and docs entry point.
5. M5: examples and recipes.
6. M6: host application rebuilds.
7. M7: release and support operations.

The guiding rule is simple: keep Agent UI itself small and stable, then make it
easy for host applications and agents to compose it correctly.
