# Repository Development Skills

Agent UI keeps repository-maintainer skills under `.agents/skills/`. Codex scans
repository skills from `.agents/skills` in the current working directory, parent
directories, and the repository root. These skills are for work inside this
repository. They are separate from the distributable public Agent UI skill
source under `skills/agent-ui`.

## Skills

- `.agents/skills/codex-upstream-sync/`: weekly or manual Codex App Server drift
  checks, schema refreshes, and draft upstream sync PR creation.
- `.agents/skills/agent-ui-review/`: repository-specific PR, branch, diff, and
  generated-change review.
- `.agents/skills/release-validation/`: package, API snapshot, build output,
  release, CI, and publish-risk validation.
- `.agents/skills/npm-release/`: Changesets versioning, single release PR
  creation and review, automatic trusted `main` push publishing, npm provenance,
  GitHub Releases, post-publish smoke, rollback, and deprecation operations.
- `.agents/skills/agent-ui-feature-planning/`: pre-implementation feature
  planning packages with repo research, plan, executable TODO, and Codex
  `/goal` prompt artifacts under `.agent-work/features/<date>-<slug>/`.
- `.agents/skills/example-authoring/`: examples, recipes, fixture routes,
  docs-site examples, and example docs.
- `.agents/skills/browser-qa/`: Playwright and agent-browser QA for
  browser-visible behavior.

`.agents/skills/agent-browser/` is a local stub that points agents to the
installed `agent-browser` CLI guide. `browser-qa` uses that stub when exploratory
browser verification is needed.

## Development Flow

The weekly upstream flow remains owned by `codex-upstream-sync`: Codex App
Automation checks drift and opens a draft PR when needed. GitHub Actions are not
the scheduler for this flow. M4 skills cover review and daily maintenance around
that flow.

Use `agent-ui-review` when reviewing a PR, branch, diff, or generated update.
It should lead with findings and judge whether changes preserve Agent UI as a
reusable Codex App Server UI component library.

Use `release-validation` before release, before publish, after package export or
declaration changes, when CI/package validation fails, or when a PR needs
merge-readiness validation.

Use `npm-release` when preparing a Changesets release, creating or reviewing a
release PR, monitoring the automatic npm publish workflow, verifying
`NPM_TOKEN` and provenance behavior, or handling post-publish support tasks.

Use `agent-ui-feature-planning` when the user asks to plan a feature, solve a
problem group, research before implementation, or produce plan/TODO/goal-prompt
artifacts before coding. It should create planning artifacts only under
`.agent-work/features/<date>-<slug>/` and should not implement the feature.
For new-adopter, host-integration, public API, or npm-facing README work, plans
must inspect and synchronize README/docs, package README files,
`docs/examples/recipes.md`, `examples/recipes`, and the public external-host
skill under `skills/agent-ui`.

Use `example-authoring` when changing `examples/`, `docs/examples/`,
`examples/recipes`, fixture routes, Next.js/Vite integrations, uploads
examples, dynamic tools examples, or example docs. Recipe source stays in
`examples/recipes`; the docs entry point is the topic-based
`docs/examples/recipes.md` index.

Use `agent-ui-review` to catch onboarding drift when a change touches a
first-host-app path, package README, server bridge, attachments, React
composition, examples, or public skill content. Review should verify the public
`skills/agent-ui` skill stays external-host focused and does not inherit
repository-maintainer commands or CI gates.

Use `browser-qa` when a change is browser-visible. Playwright remains the
deterministic CI gate; agent-browser is for exploratory checks, screenshots,
accessibility-tree snapshots, and real interactions.

## Boundary

Repository skills may mention repo-specific commands and validation gates.
Public distributable skills must not depend on these maintainer workflows.

Keep repository skills centered on ownership boundaries:

- Agent UI packages expose composable primitives, hooks, adapters, transports,
  server bridge helpers, and documented extension points.
- Host applications own product workflows, routing, persistence, process
  lifecycle, deployment, credentials, resource policy, and app-specific
  orchestration.

Avoid narrow host-app vocabulary in skill trigger text unless a concrete
repository file or example requires it.

## Validation

Run the focused repository skill gate after changing `.agents/skills/`:

```sh
bun run test:repo-skills
```

For broader repository skill or docs changes, also run:

```sh
bun run typecheck
bun run lint
bun run test
```

For behavior-sensitive skill changes, run a `codex exec` smoke that explicitly
uses the changed skill and verifies it loads the expected references.
