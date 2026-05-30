# Agent UI Documentation Rewrite Plan

This plan turns the documentation audit into staged work. It intentionally
separates urgent safety corrections from broad information-architecture work.

## Principles

- Correct unsafe public claims before broad rewrites.
- Add the public docs no-em-dash guard early. Exclude `tmp/**/*.md`.
- Establish canonical owners before deleting or shortening useful sections.
- Product boundary vocabulary comes before new maintenance information
  architecture.
- Entry pages should be accurate early, but final README polish should wait
  until owner pages are stable.
- Repeated mechanical facts need docs-sync tests. One-off safety prose still
  needs human review.
- Keep public docs current-state oriented. Roadmap language belongs in
  `ROADMAP.md`.

## Slice 0: Safety And Style Stopgap

Priority: P0

Goal: remove the highest-risk false or misleading public facts and add the first
style guard.

Files:

- `docs/examples/codex-local-web.md`
- `docs/reference/server-bridge.md`
- `docs/architecture/overview.md`
- `docs/reference/react-components.md`
- `docs/README.md`
- docs test files
- `package.json` if the guard is wired into a script

Changes:

- Replace the `codex-local-web` admission claim with the actual default:
  loopback bind guard, browser method filtering, inbound limits, idle timeout,
  backpressure, upload and directory-picker routes, dynamic tools disabled by
  default, and no configured per-connection admission.
- Fix normal `serverRequestPolicy.permissions` wording. Either document it as
  trusted host policy, or implement requested-subset bounding before keeping
  bounded language.
- Fix dynamic helper permission wording if it claims schema-wide bounding.
- Remove existing public em dash characters.
- Fix `docs/README.md` approval wording so user input is not an ordinary
  approval category.
- If nearby React snippets are touched, remove `AgentWorkspace` children usage
  and show standalone diagnostics with `useAgentBootstrap()`.

Exit criteria:

- Public Markdown in scope has no em dash characters.
- Public docs no longer claim `examples/codex-local-web` configures bridge
  admission.
- Permission docs no longer promise implementation bounding that is not present.
- The docs index no longer treats user input as a normal approval category.

Validation:

- Public Markdown typography guard.
- Focused docs tests.
- `bun run lint` if the guard is wired into lint.
- Focused server tests only if implementation behavior changes.

## Slice 1: Product Boundary Spine

Priority: P1

Goal: make one product boundary source that later docs can quote or link to.

Files:

- `docs/architecture/product-boundary.md`
- `docs/architecture/overview.md`
- `README.md`
- `docs/README.md`
- `docs/architecture/security.md`
- `docs/architecture/protocol-drift.md`
- `docs/examples/recipes.md` if it repeats boundary language

Changes:

- Rewrite `docs/architecture/product-boundary.md` around current ownership:
  Agent UI is a reusable Codex App Server UI component library; hosts own
  workflows, orchestration, sessions, persistence, routing, workspace and tenant
  isolation, sidecar lifecycle, auth, audit logging, and resource limits.
- Define Agent UI ownership: primitives, hooks, adapters, normalizers, public
  package surfaces, bridge helpers, and documented extension points.
- State bridge helpers are opt-in host integration utilities, not managed
  hosting or a host runtime.
- State `app/list` is Codex Apps/connectors metadata, not a host workflow
  registry.
- Replace `local release`, future multi-user phrasing, and broad host runtime
  wording with current support boundaries.
- Patch entry and architecture pages only where they conflict with the spine.

Exit criteria:

- `docs/architecture/product-boundary.md` is the source of truth for Agent UI
  ownership, host ownership, bridge helper scope, and Apps/connectors metadata.
- Entry and overview docs no longer contradict the boundary spine.
- Security and protocol drift pages link to the boundary spine instead of
  inventing new scope vocabulary.

Validation:

- No-em-dash guard.
- Link check when available.
- Optional terminology guard for the highest-risk phrases.

## Slice 2: Docs Guards And Sync Tests

Priority: P1

Goal: add minimum mechanical guards before repeated facts are normalized.

First-pass gates:

- Public Markdown typography lint.
- Local Markdown link check for missing relative files and assets.
- Package list sync from `packages/*/package.json` to entry and package docs.
- Package export docs sync derived from package `exports` maps.
- Validation script sync for `validate:fast`, `validate:protocol`,
  `validate:packages`, `validate:e2e`, and `validate:release`.
- Existing protocol method docs sync preserved or lightly extended in
  `packages/codex/test/protocol.test.ts`.
- One-shot RPC allowlist sync from implementation to
  `docs/reference/server-bridge.md`.
- Public stylesheet import sync through the existing style-boundary tests.

Later gates:

- Browser selector guard for `docs/guides/browser-verification.md`.
- Fixture route sync.
- Screenshot route and filename sync.
- Recipe file and command sync.
- Markdown snippet typecheck with explicit opt-in metadata.
- Workflow command sync after CI docs settle.

Exit criteria:

- The repo has cheap tests for public punctuation, local links, package names,
  package exports, validation tiers, protocol method lists, one-shot defaults,
  and public stylesheet imports.
- Tests produce actionable diagnostics.
- Brittle checks are explicitly deferred.

Validation:

- Focused docs test target or `bun run test`.
- `bun run test:protocol` if protocol docs sync changes.
- `bun run test:styles` if stylesheet import tests change.
- `bun run lint` for new helpers or scripts.

## Slice 3: Security And Bridge Correctness

Priority: P1

Goal: make bridge and security docs exact enough that host authors cannot mistake
examples for authenticated or production-safe infrastructure.

Files:

- `docs/reference/server-bridge.md`
- `docs/architecture/security.md`
- `docs/guides/authentication.md`
- `docs/guides/remote-deployment.md`
- `docs/guides/nextjs.md`
- `docs/examples/codex-local-web.md`
- `docs/examples/next-with-bridge-sidecar.md`
- `docs/examples/next-rpc-route.md`
- related example READMEs
- deployment recipes

Changes:

- Make `docs/reference/server-bridge.md` the owner for bridge defaults, close
  codes, admission, dynamic tools, server requests, uploads, redaction, one-shot
  RPC, and direct upstream WebSocket warnings.
- State the normative path: browser Agent UI to same-origin host WebSocket
  endpoint to Agent UI server bridge to `codex app-server --listen stdio://`.
- State same-origin routing and upstream Origin checks are not authentication.
- State `AGENT_UI_ALLOW_NON_LOOPBACK=1` is only a bind opt-in.
- Document non-loopback requirements: host-owned auth, session admission,
  workspace and upload scoping, process isolation, resource limits, and audit
  logging.
- Annotate Origin-only snippets as minimal admission examples, not
  authentication.
- Add the `handleAgentUiWebSocketConnection()` request caveat.
- Rewrite one-shot RPC as host-owned one-shot HTTP RPC, not chat and not a
  generic App Server proxy.
- List the exact default one-shot methods and the Next RPC example allowlist.
- Document request and response envelopes, pre-spawn denial, one process per
  allowed request, bridge-owned `initialize`, `allowedMethods: "all"` risk, and
  route-level auth expectations.
- Correct upload docs: missing `content-type` is accepted; present content types
  are validated; default limit is 16 MB; default temp root is local temp; default
  TTL is one hour; custom relative roots can return relative paths.
- Add direct upstream WebSocket warnings to remote docs and API-key recipe.

Exit criteria:

- No public page says an example route is authenticated or admitted unless the
  example config proves it.
- One-shot docs lead with exact allowlists, endpoint sensitivity, and pre-spawn
  denial.
- Bridge docs have an auditable defaults and close-code section.
- Security, auth, remote, Next, and example docs link back to bridge reference
  for exact option details.

Validation:

- One-shot docs sync.
- Focused server tests for WebSocket, admission, one-shot RPC, upload, redaction,
  permission policy, and dynamic tools when behavior changes.
- No-em-dash and link checks.
- `bun run test:protocol` if method policy or direct WebSocket docs are tied to
  protocol tests.

## Slice 4: Entry And Package Triage

Priority: P1

Goal: make first-reader docs accurate and navigable without doing final full
onboarding polish.

Files:

- `README.md`
- `docs/README.md`
- `docs/getting-started.md`
- `docs/installation.md`
- `docs/guides/react.md`
- `docs/guides/web-components.md`
- `docs/reference/package-exports.md`
- `docs/architecture/testing.md`
- `docs/architecture/toolchain.md`

Changes:

- Shorten validation detail in entry docs to concise pointers.
- Ensure `docs/architecture/testing.md` owns current validation tiers, especially
  `validate:packages` order: build, `test:packlist`, `test:node-compat`,
  `publint`, then `attw`.
- Fix stale validation prose in `docs/architecture/toolchain.md`.
- Add Web Components to docs navigation, installation paths, and package lists.
- Prefer deterministic fixture exploration before real local Codex in first-user
  paths.
- Keep entry docs out of package export internals, full protocol method detail,
  bridge option lists, and private style chunk warnings.
- Fix React guide examples for `AgentWorkspace` and standalone diagnostics.

Exit criteria:

- Entry docs accurately describe all five public packages.
- Entry docs link to validation owners instead of duplicating stale ladders.
- First-run docs point to fixture routes before requiring real Codex setup.
- React guide snippets no longer show impossible component usage.

Validation:

- Package list sync.
- Package export sync.
- Validation script sync.
- No-em-dash guard.
- Link check.
- `bun run test:package-resolution` when imports or package docs change.

## Slice 5: Protocol And Package Owners

Priority: P1

Goal: make protocol semantics and package surfaces canonical, test-backed, and
free of release-log drift.

Files:

- `docs/reference/codex-protocol.md`
- `docs/architecture/protocol-drift.md`
- `packages/codex/src/generated/README.md`
- `docs/reference/package-exports.md`
- `docs/installation.md`
- `docs/guides/web-components.md`
- related protocol, package, hooks, attachments, usage, and approvals docs

Changes:

- Keep `docs/reference/codex-protocol.md` focused on public protocol semantics:
  productized facade, stable productized methods, host-managed stable methods,
  experimental available methods, unsupported or test-only methods,
  notifications, server requests, running-turn semantics, user input variants,
  Apps/connectors, skills, Codex hook metadata, and direct upstream WebSocket
  warning.
- Move or link schema refresh mechanics and generated metadata workflow to
  `docs/architecture/protocol-drift.md` unless a later maintenance runbook
  exists.
- Preserve Local Smoke facts before moving or shortening that section.
- Rename `Deferred:` into current protocol non-goals and host-owned boundaries,
  or move true backlog to `ROADMAP.md` only after preservation.
- Correct protocol facts: no `queue/message`; UI-local queued follow-ups;
  `turn/steer` with `expectedTurnId`; Stop uses `turn/interrupt`; no
  `thread/read` token usage replay claim; stable user inputs are `text`,
  `image`, `localImage`, `skill`, and `mention`.
- Document dynamic tools narrowly: dynamic tool calls are normalized and handled
  out of band; stable `thread/start` and React `ThreadStartOptions` do not
  productize `dynamicTools`; generated experimental `thread/start` exposes it.
- Update package exports docs as the import boundary owner.
- Document `stable-types` as a type-only public subpath.
- Update Web Components API docs, including the `chat-class` caveat.

Exit criteria:

- Protocol reference no longer reads like a release diary.
- Method classification and server request terminology align with implementation
  and tests.
- Package exports docs include Web Components and are the canonical import
  boundary.
- Type-only exports and Web Components API caveats are explicit.

Validation:

- `bun run test:protocol`
- Package list and export docs sync.
- `bun run test:api-snapshots` if public API surfaces change.
- `bun run test:package-resolution` if public specifiers change.
- No-em-dash and link checks.

## Slice 6: React UX And Design Guides

Priority: P2

Goal: shrink the React reference into a durable API and behavior owner, while
moving token, theming, visual QA, and screenshot detail to better owners.

Files:

- `docs/reference/react-components.md`
- `docs/guides/react.md`
- `docs/reference/hooks.md`
- `docs/guides/approvals.md`
- `docs/guides/usage-and-status.md`
- `docs/guides/attachments.md`
- `docs/guides/theming.md`
- `docs/architecture/overview.md`
- `docs/architecture/testing.md`
- `docs/screenshots/README.md`

Changes:

- Preserve transcript-first layout, expanded normal messages, disclosed heavy
  bodies, approval anchoring, mobile reachability, sidebar drawer behavior,
  bottom-sheet menus, context usage near composer, and host-owned theme and
  locale state.
- Keep component API and accessibility contracts in `docs/reference/react-components.md`.
- Move attachment resolver depth to `docs/guides/attachments.md`.
- Move approval placement and custom renderer action wiring to
  `docs/guides/approvals.md`.
- Expand usage and status placement guidance in `docs/guides/usage-and-status.md`.
- Replace hand-copied token values with token groups, override examples, theme
  scope, private selector warnings, and `tokens.css` as source of truth unless
  values are generated or tested.
- Keep `@nyosegawa/agent-ui-react/styles.css` as the only public stylesheet
  import.
- Move visual QA, screenshot evidence, and e2e file ownership to testing and
  screenshots docs.

Exit criteria:

- React reference is no longer a dumping ground for token catalogs, screenshot
  policy, fixture proof, and browser QA commands.
- Theming guide describes stable token groups and override patterns without
  stale copied values.
- Public docs still preserve transcript, composer, approval, accessibility,
  mobile, attachment, usage, and status contracts.

Validation:

- `bun run test:styles` for theming and stylesheet boundary changes.
- No-em-dash, link, and public stylesheet import guards.
- Focused React tests if behavior changes.
- `bun run typecheck` if snippets become backed by source examples.

## Slice 7: Examples, Browser QA, And Recipes

Priority: P2

Goal: normalize examples and browser QA after canonical docs owners exist,
without hiding security-critical recipe checklists.

Files:

- `docs/examples/*.md`
- `examples/**/README.md`
- recipe markdown
- `docs/guides/browser-verification.md`
- `docs/screenshots/README.md`
- `docs/architecture/testing.md`
- relevant fixture e2e support files if route or screenshot sync is added

Changes:

- Make public example pages explain purpose, run commands, visible routes or
  surfaces, host-owned boundaries, and links to owner docs.
- Keep colocated example READMEs as short run cards.
- Preserve `docs/examples/local-react-vite.md` as the full public fixture route
  owner.
- Move maintainer e2e file ownership detail to `docs/architecture/testing.md`.
- Correct `docs/screenshots/README.md` as screenshot policy owner.
- State screenshot capture is a retained subset, not the full local React Vite
  public route inventory.
- Rewrite browser verification away from public internal selector examples.
- Keep recipes under `docs/examples/recipes.md` until the baseline is stable.
- Preserve concrete deployment checklists in multi-user and API-key recipes.

Exit criteria:

- Example docs follow a public docs page plus short README pattern.
- Browser verification guide uses public accessibility and interaction surfaces.
- Screenshot docs have one canonical policy and command, with route subset
  language.
- Deployment recipes keep operational security checklists intact.

Validation:

- No-em-dash and link checks.
- Route sync after route owner text is stable.
- Screenshot sync after canonical command is corrected.
- Recipe sync if recipe docs are touched.
- `bun run test:e2e:fixtures` for browser-visible fixture changes.
- `bun run test:e2e:real-local` for App Server backed behavior changes.

## Deferred Follow-Ups

- Create `docs/maintenance/README.md` only after at least one concrete runbook is
  needed.
- Add `docs/maintenance/codex-upstream-sync.md` after protocol reference and
  protocol drift ownership are settled.
- Add `docs/maintenance/docs-sync.md` after the first docs-sync tests exist.
- Add `docs/maintenance/public-api-change-checklist.md` after package export
  sync and release expectations are aligned.
- Add `docs/maintenance/release-checklist.md` after release facts are removed
  from entry docs and toolchain owns npm provenance.
- Add CI workflow docs sync only after a CI maintenance page exists.
- Add Markdown snippet typecheck only after snippets opt in with explicit
  metadata.
- Decide whether exact token values should ever be published. If yes, generate
  or test them against `tokens.css`.
- Decide whether normal permission callbacks should remain trusted host policy
  or gain requested-subset bounding in implementation.
- Decide whether dynamic helper permission bounding should be updated for the
  current stable permission schema.
- Decide whether one-shot RPC helpers need admission or auth callbacks.
- Decide whether Web Components should observe `chat-class` changes.
- Clean `ROADMAP.md`, agent instructions, changesets, fixture labels, screenshot
  filenames, and old audit files only after public docs blockers are closed.

## Validation Ladder

- Slice 0: public Markdown typography guard, focused docs tests, `bun run lint`
  if the guard is wired into lint.
- Docs ownership slices: no-em-dash guard, local link check, package list sync,
  package export sync, validation script sync, one-shot allowlist sync, public
  stylesheet import sync.
- Protocol slice: `bun run test:protocol`, no-em-dash guard, link check, package
  export sync when package docs change, `bun run test:api-snapshots` if public
  API surfaces change.
- Security and bridge slice: focused server tests for WebSocket, admission,
  one-shot RPC, upload, redaction, permission policy, and dynamic tools;
  one-shot docs sync; no-em-dash and link checks.
- Entry and package slice: package list sync, package export sync, validation
  script sync, `bun run test:package-resolution`, no-em-dash and link checks.
- React and theming slice: `bun run test:styles`, `bun run typecheck` when
  snippets or checked examples change, focused React tests when behavior
  changes, public stylesheet import sync, no-em-dash and link checks.
- Examples and browser QA slice: fixture route sync when added, screenshot sync
  when added, recipe sync when added, `bun run test:e2e:fixtures` for
  browser-visible fixture changes, `bun run test:e2e:real-local` for App Server
  backed behavior changes.
- Package output validation after package exports, stylesheet packaging, or build
  output changes: `bun run validate:packages`. Do not run build, `publint`, and
  `attw` in parallel.
- Broad release confidence after multiple slices: `bun run validate:fast`,
  `bun run validate:protocol`, `bun run validate:packages`,
  `bun run test:api-snapshots`, `bun run test:package-resolution`, and relevant
  e2e gates.
