# Repo Research Summary

This summary captures the baseline findings used to design the feature-planning
skill. Verify current files before relying on any rule for a concrete plan.

## Skill Location Decision

The feature-planning skill is a repository-maintainer workflow, so it belongs
under `.agents/skills/agent-ui-feature-planning/`. The public distributable
Agent UI integration skill lives under `skills/agent-ui/` and is for external
host applications, not Agent UI maintainer planning.

Existing maintainer skills use concise `SKILL.md` files with `name` and
`description` frontmatter, one-level `references/*.md` links, and focused
completion/validation sections.

## Freshness Baseline

Planning must run a lightweight freshness check every invocation before relying
on this summary. The canonical manifest is
`.agents/skills/agent-ui-feature-planning/references/freshness-manifest.json`.
Use targeted refresh when watched files or globs changed; update only affected
summary sections and manifest entries. Use full refresh only when repo
structure, CI/build systems, package boundaries, release policy, protected-file
rules, or agent guidance changed materially, or when the user asks for a
re-research pass.

This repo can execute local Node scripts, so the skill includes deterministic
artifact validation in `scripts/validate-artifacts.mjs` and a lightweight
freshness helper in `scripts/check-freshness.mjs`.

## Core Repo Guidance

Start with:

- `AGENTS.md`
- `docs/architecture/product-boundary.md`
- `docs/README.md`
- `CONTRIBUTING.md`
- `docs/architecture/testing.md`
- `docs/maintenance/ci-cd.md`
- `docs/reference/package-exports.md`
- `docs/architecture/host-integration-design-gates.md`
- `docs/architecture/security.md`
- `docs/architecture/toolchain.md`

Agent UI is an embeddable Codex App Server UI component library. It owns
composable UI primitives, hooks, adapters, normalizers, transports, bridge
helpers, public stylesheet tokens, and documented extension points. Host
applications own product workflows, routing, persistence, auth, authorization,
workspace and tenant isolation, process lifecycle, deployment, billing, upload
storage, dynamic tool policy, audit logging, and resource limits.

## Package And Surface Boundaries

- `@nyosegawa/agent-ui-core`: protocol-neutral state, reducer, selectors,
  transport contracts, and fixtures. No React, Node process management, or
  generated Codex request builders.
- `@nyosegawa/agent-ui-codex`: Codex App Server adapters, schema metadata,
  request builders, clients, transports, and protocol classification.
- `@nyosegawa/agent-ui-react`: root drop-in preset (`AgentProvider`,
  `AgentChat`, component map, i18n), `/primitives` visual composition surface,
  `/headless` controllers/hooks/types, and single public stylesheet import.
- `@nyosegawa/agent-ui-server`: Node bridge helpers, one-shot RPC, upload/local
  media helpers, dynamic-tool policy hooks, diagnostics, and redaction.
- `@nyosegawa/agent-ui-web-components`: custom-element wrapper over the React
  preset.

Public surface promotion requires agreement across package export maps, docs,
examples or recipes importing through package names, focused tests, API
snapshots, and package-resolution checks.

## Examples

- `examples/local-react-vite`: deterministic fixture and visual QA.
- `examples/codex-local-web`: real local same-origin bridge to
  `codex app-server --listen stdio://`.
- `examples/next-rpc-route`: one-shot RPC only; not chat-capable streaming.
- `examples/next-with-bridge-sidecar`: full-chat Next sidecar bridge.
- `examples/recipes`: typed host composition recipes.
- `examples/docs-site`: documentation/demo site surface.

## Protected Areas

- Do not edit the vendored Codex submodule directly unless explicitly asked to
  work in that upstream repository.
- Do not hand-edit auto-created schema files or compiled artifacts.
- Schema refreshes must move the submodule pointer and refreshed schema
  together through the upstream-sync workflow.
- Private CSS chunks and `.aui-*` implementation selectors are not host-facing
  contracts.

## Validation Matrix

Use Bun for repository package operations.

Common gates:

```sh
bun run validate:fast
bun run validate:protocol
bun run validate:packages
bun run validate:e2e
bun run validate:release
```

Focused gates:

```sh
bun run test:repo-skills
bun run test:skills
bun run test:hooks
bun run test:e2e:fixtures
bun run test:e2e:real-local
bun run test:api-snapshots
bun run test:package-resolution
bun run check:clean-build-output
```

`bun run validate:packages` is order-sensitive: build, packlist, Node
compatibility, `publint`, then `attw`. Do not parallelize package build,
`publint`, and `attw`.

Required PR checks include Repository policy, Typecheck, Lint, Unit tests,
Protocol and fixtures, Package validation, API snapshots, Package resolution,
and Playwright fixtures. Docs-only changes may get only the repository policy
gate in CI, but docs that affect package exports, protocol classification,
bridge policy, examples, or browser-visible contracts still need local focused
validation in the PR notes.

## Web And Current-State Research

Most feature plans should start with repo-local evidence. Use live web/current
research when the plan depends on facts that can drift outside the checkout:
OpenAI Codex or App Server behavior, package registry state, GitHub Actions or
PR state, dependency versions, browser/tooling behavior, or external API/spec
changes. Record sources in `research.md` or explicitly state why live research
was skipped.

## Release And PR Rules

Create purpose-based branches from `main`. Use one branch for both planning and
implementation; do not create planning-only branches. Do not push directly to
`main`. Use concise imperative commit subjects. PR bodies should cover summary,
test plan, release impact, UI impact, protocol/upstream impact, docs impact,
and security/secrets.

After planning artifacts pass validation, commit the planning package on the
same branch with one planning commit such as `Plan <feature slug>`. Push the
planning commit when remote push is possible. Completed phase commits should be
pushed to the feature branch before PR creation or update. Record branch,
planning commit, remote, pushed commit hash, push result, and blockers in
`todo.md`. Task-level commits are a fallback only when a phase is not reviewable
or committable as one unit; record the reason in `todo.md`. Escalate when
authentication, network, remote protection, or missing upstream blocks push and
therefore PR or CI follow-through.

Add a changeset for npm-consumer-facing changes: public API, components, hooks,
adapters, exports, types, CSS package surface, Codex adapter behavior, package
bug fixes, or npm-facing README/install guidance. Repository-only CI,
contributor docs, and tests with no shipped behavior usually do not need a
changeset.

## Security And Browser QA

Non-loopback bridge endpoints require host-owned auth, admission, isolation,
redaction, audit, and resource limits. Same-origin and Origin checks are not
authentication. Do not expose raw tokens, API keys, passwords, local `.npmrc`,
or unredacted diagnostics. Browser media must use structured resource metadata,
not raw filesystem paths.

Use Playwright as deterministic CI and `agent-browser` for exploratory local
browser verification. Browser-visible plans should check overflow, composer
reachability, hit testing, focus, scrolling, approvals, drawers/sheets, and
mobile behavior.
