# Documentation Rewrite TODO

Follow `DOCS_REWRITE_PLAN.md` in order. Check an item only when the relevant
docs, tests, and validation notes are complete.

## S00: Safety And Style

- [ ] S00.01 Add a public Markdown no-em-dash guard that reports file and line
  number, excludes `tmp/**/*.md`, and covers public docs plus example README and
  recipe Markdown.
- [ ] S00.02 Remove current public em dash characters from
  `docs/reference/react-components.md`, `docs/architecture/overview.md`, and any
  other files in the first guard scope.
- [ ] S00.03 Correct `docs/examples/codex-local-web.md` so it no longer claims
  the example exercises bridge admission before process spawn unless
  `examples/codex-local-web/server.ts` actually configures `admission`.
- [ ] S00.04 Correct normal `serverRequestPolicy.permissions` docs so they
  describe trusted host policy today, or first implement requested-subset
  bounding before using bounded-permission language.
- [ ] S00.05 Correct entry-page approval wording so user input is not described
  as an ordinary approval category.
- [ ] S00.06 Keep safety corrections narrow and reviewable; do not block them on
  a full docs information-architecture rewrite.

## S01: Product Boundary

- [ ] S01.01 Rewrite `docs/architecture/product-boundary.md` as the boundary
  spine for Agent UI ownership, host ownership, local-first scope, bridge helper
  scope, and Codex App Server integration.
- [ ] S01.02 State that Agent UI is an embeddable Codex App Server UI component
  library, not a hosted Codex service, IDE, credential provider, billing layer,
  app runtime, or generic chatbot.
- [ ] S01.03 State the primary browser path as browser UI to same-origin host
  bridge to `codex app-server --listen stdio://`.
- [ ] S01.04 Document `app/list` as Codex Apps/connectors metadata, not a host
  workflow registry, and preserve generated `AppInfo` facts without inventing
  `installed` or `needsAuth`.
- [ ] S01.05 Patch `README.md`, `docs/README.md`, and
  `docs/architecture/overview.md` only where they conflict with the boundary
  spine.
- [ ] S01.06 Replace public `local release`, `host runtime`, and future
  multi-user phrasing with current support boundaries unless the page is
  explicitly describing host-owned deployment responsibilities.
- [ ] S01.07 Preserve explicit non-goals for remote or multi-user production
  hosting, realtime audio or voice UX, plugin marketplace administration,
  dynamic MCP resource and tool management, external ChatGPT auth token mode, and
  unsupported `thread/turns/items/list`.

## S02: Docs Guards

- [ ] S02.01 Add a local Markdown link check for missing files and missing
  relative targets in public docs, excluding external URLs and brittle generated
  anchor validation in the first pass.
- [ ] S02.02 Add package list sync that derives public package names from
  `packages/*/package.json` and checks `README.md`, `docs/README.md`, and
  `docs/reference/package-exports.md`, including
  `@nyosegawa/agent-ui-web-components`.
- [ ] S02.03 Replace hard-coded package export expectations with
  manifest-derived expectations from package `exports` maps, including the
  public React `styles.css` subpath and the type-only `stable-types` caveat.
- [ ] S02.04 Expand validation command sync so `docs/architecture/testing.md`
  stays aligned with root `package.json` for `validate:fast`,
  `validate:protocol`, `validate:packages`, `validate:e2e`, and
  `validate:release`.
- [ ] S02.05 Preserve or lightly extend the existing protocol method docs sync in
  `packages/codex/test/protocol.test.ts`; do not create a duplicate method-table
  test suite.
- [ ] S02.06 Add one-shot RPC allowlist sync so `docs/reference/server-bridge.md`
  matches `DEFAULT_ONE_SHOT_METHODS` and mentions denial before App Server spawn.
- [ ] S02.07 Keep public stylesheet import sync in or near
  `packages/react/test/style-duplication.vitest.ts`, and ensure public docs do
  not recommend deep style chunks, `dist/styles/*`, or source style imports.
- [ ] S02.08 Add upload-default docs sync only for exact user-facing defaults
  that are constants or behavior-tested, such as default size limit and accepted
  content types.
- [ ] S02.09 If `docs/guides/browser-verification.md` is rewritten in this pass,
  add a targeted guard against public examples that use internal `.aui-*`
  selectors or broad `querySelector` snippets unless marked maintainer-only.
- [ ] S02.10 Defer snippet typecheck, route sync, screenshot file existence
  checks, workflow sync, and recipe sync until the relevant docs surfaces are
  stable enough to avoid noisy failures.

## S03: Security, Bridge, Auth, Uploads

- [ ] S03.01 Make `docs/reference/server-bridge.md` the owner for bridge
  defaults, close codes, admission, dynamic tools, server requests, uploads,
  redaction, one-shot RPC, and direct upstream WebSocket warnings.
- [ ] S03.02 State that same-origin routing and upstream Origin checks are not
  authentication, and that non-loopback bridge or upload exposure requires
  host-owned auth, admission, workspace or session scoping, isolation, resource
  limits, and audit logging.
- [ ] S03.03 Update `docs/architecture/security.md`,
  `docs/guides/authentication.md`, `docs/guides/remote-deployment.md`,
  `docs/guides/nextjs.md`, and affected example pages to link back to the bridge
  reference instead of duplicating risky defaults.
- [ ] S03.04 Rewrite one-shot RPC docs around the exact default allowlist, exact
  HTTP request and response envelopes, pre-spawn denial, one process per allowed
  request, and host-owned route authentication.
- [ ] S03.05 State that one-shot RPC is not chat and has no built-in admission or
  authentication; document that `allowedMethods: "all"` removes the method
  policy.
- [ ] S03.06 Update upload docs to say missing `content-type` is accepted,
  present content types are validated against the supported list, the default
  limit is 16 MB, default cleanup TTL is one hour, and custom relative roots can
  produce relative returned paths.
- [ ] S03.07 Preserve attachment facts: browser `File` values require a host
  resolver, images become `localImageInput(path)`, non-images become explicit
  text such as `Attached file: /absolute/path`, and resolver errors surface
  inline.
- [ ] S03.08 Fix Next sidecar docs so they describe the custom Node HTTP server,
  `/agent-ui/ws`, `POST /agent-ui/upload`, lack of admission hook, image versus
  non-image mapping, and upload cleanup behavior.
- [ ] S03.09 Document dynamic tool execution narrowly: `item/tool/call` is
  normalized, handled by the bridge or host integration, not retained in the
  default core server request queue, and disabled for execution unless a handler
  exists.
- [ ] S03.10 Document permission bounding as two separate surfaces: normal
  server request policy is trusted host policy today, while helper-thread dynamic
  permissions need schema-aware bounding before broad bounded claims are safe.

## S04: Entry, Package, Web Components

- [ ] S04.01 Triage `README.md` and `docs/README.md` early by removing stale
  validation ladders and linking to `docs/architecture/testing.md` and
  `docs/architecture/toolchain.md` as owners.
- [ ] S04.02 Put deterministic fixture exploration before real local Codex
  exploration where entry docs guide first readers through examples.
- [ ] S04.03 Add `@nyosegawa/agent-ui-web-components` to installation, package
  overview, docs navigation, and current release package lists where the public
  package set is enumerated.
- [ ] S04.04 Keep package export internals, generated protocol method details,
  and maintenance workflow detail out of entry pages.
- [ ] S04.05 Update `docs/reference/package-exports.md` so public specifiers are
  complete: core root, codex root plus documented subpaths, react root plus
  `styles.css`, server root, and web-components root.
- [ ] S04.06 Document `@nyosegawa/agent-ui-codex/stable-types` as a type-only
  public subpath or add an equivalent resolver smoke that does not expect runtime
  named exports.
- [ ] S04.07 Update Web Components docs to list `transport`, `initialState`,
  `slots`, `agentOptions`, `agentOptions.className`, and `chat-class`.
- [ ] S04.08 State that Web Components require the Web Components package, React
  peer dependencies, and the public React stylesheet import; they do not create
  transports, spawn Codex, or import CSS automatically.
- [ ] S04.09 State that `chat-class` is not a broad reactive attribute API unless
  implementation support is added.
- [ ] S04.10 Fix `ROADMAP.md` or other release-planning lists that omit Web
  Components from the current public package set, without treating the package
  export table itself as wrong.

## S05: Protocol And Drift

- [ ] S05.01 Keep `docs/reference/codex-protocol.md` focused on productized
  semantics, server request categories, running-turn semantics, user input
  variants, Apps/connectors, and direct WebSocket warnings.
- [ ] S05.02 Preserve Local Smoke facts before moving or deleting that section:
  real Codex auth requirement, `codex app-server --listen stdio://`,
  `initialize`, account/model/rate-limit reads, thread list/read/resume/start,
  streamed assistant deltas, `turn/completed`, approval smoke, and
  account-dependent assertions.
- [ ] S05.03 Rename or replace the `Deferred:` list only after unsupported or
  host-owned boundaries remain documented, including external ChatGPT auth token
  mode.
- [ ] S05.04 Correct token usage replay wording so `thread/read` is not
  described as replaying usage notifications; replay belongs to resume, fork,
  and rejoin paths where upstream supports it.
- [ ] S05.05 State that stable `thread/start` and React `ThreadStartOptions` do
  not expose `dynamicTools`, while generated experimental `thread/start` does.
- [ ] S05.06 Preserve stable user input variants as `text`, `image`,
  `localImage`, `skill`, and `mention`; do not document a generic local-file
  input.
- [ ] S05.07 Preserve running-turn facts: there is no App Server `queue/message`,
  UI follow-ups are local and thread-scoped, normal Enter queues while running,
  `Send now` and Cmd/Ctrl+Enter use `turn/steer`, and Stop uses
  `turn/interrupt`.
- [ ] S05.08 Keep process notifications documented as diagnostics rather than
  chat text.
- [ ] S05.09 Move schema refresh mechanics and generated metadata workflow only
  after an owner exists, either `docs/architecture/protocol-drift.md` or a later
  concrete maintenance runbook.
- [ ] S05.10 Keep full generated method-table automation out of the first safety
  pass unless it directly preserves existing protocol sync tests.

## S06: React, Approvals, Usage, Theming

- [ ] S06.01 Fix invalid React snippets immediately: `AgentWorkspace` is a
  preset around `AgentChat` plus optional `panel`, not a children-based layout
  surface.
- [ ] S06.02 Fix standalone diagnostics snippets so `AgentDiagnosticsPanel`
  receives `const bootstrap = useAgentBootstrap()` through its required
  `bootstrap` prop.
- [ ] S06.03 Keep `AgentChat.slots` as the documented slot surface for
  `renderApproval` and `renderItem`.
- [ ] S06.04 Preserve `docs/reference/react-components.md` as an API and
  behavior reference, not only a prop list.
- [ ] S06.05 Shrink `docs/reference/react-components.md` in phases, moving visual
  QA, screenshot policy, token policy, and attachment depth only after
  replacement owner pages contain the same public contracts.
- [ ] S06.06 Preserve transcript-first UX facts: approvals embedded in
  transcript, no separate approval scroll pane, mobile reachability, mobile
  sidebar drawer, bottom-sheet menus, usage near composer context, and no
  persistent usage or diagnostics rails by default.
- [ ] S06.07 Preserve composer accessibility facts: form named "Message
  composer", textarea described by visible shortcut hint, attachment chips expose
  filenames, mention buttons are hidden unless resolvers exist, and working
  directory is a thread-start setting.
- [ ] S06.08 Update approvals docs so pending approvals stay reachable at the
  relevant transcript point and source metadata remains available.
- [ ] S06.09 Update usage and status docs so token usage stays near active
  conversation and composer context without replacing transcript content.
- [ ] S06.10 Revise theming docs to prefer token groups, theme scope usage,
  selector warnings, and a small override example instead of a hand-copied exact
  token value catalog unless exact values become generated or tested.
- [ ] S06.11 Preserve stylesheet facts: `@nyosegawa/agent-ui-react/styles.css` is
  the only public React stylesheet import, `--aui-*` tokens are the
  design-system API, `tokens.css` is source of truth, internal `.aui-*` selectors
  are private, and recipe CSS may intentionally override tokens.

## S07: Examples, Browser QA, Recipes

- [ ] S07.01 Keep `docs/examples/local-react-vite.md` as the public route
  inventory for deterministic fixture review, including `/`, `/rich-transcript`,
  `/?state=empty`, `/?state=unauth`, `/?state=bridge-error`, `/fixture-gallery`,
  `/host-workflow-recipe`, `/usage-only`, `/scoped-thread-pane`, and
  `/app-connectors`.
- [ ] S07.02 Keep example docs user-facing when maintainer e2e file maps move;
  they should still explain surfaces demonstrated, commands, ports, and fixture
  versus real-local boundaries.
- [ ] S07.03 Correct `docs/screenshots/README.md` before consolidating screenshot
  command blocks, including the canonical fixture Playwright config and the
  route/filename set owned by `capture-docs-screenshots.e2e.ts`.
- [ ] S07.04 State that docs screenshots are opt-in release evidence, not CI
  output, and should be regenerated only for intentional visual contract changes.
- [ ] S07.05 State that screenshot capture covers a retained subset and is not
  the complete local React Vite public route inventory.
- [ ] S07.06 Rewrite public browser verification guidance away from internal
  selectors and broad DOM shortcuts; prefer roles, labels, text, and public
  user-visible behavior.
- [ ] S07.07 Keep `examples/docs-site` documented as an executable package
  overview and compile/style smoke surface, not the Markdown documentation source
  and not a host runtime.
- [ ] S07.08 Keep deployment recipes concrete; do not collapse multi-user and
  API-key remote deployment recipes into links only.
- [ ] S07.09 Preserve multi-user recipe requirements: per-user/session/workspace
  App Server process, separate credentials, explicit workspace root, host
  authorization, redaction, resource limits, audit events, and cleanup.
- [ ] S07.10 Preserve API-key remote recipe requirements: keys stay server-side
  only, never appear in browser URLs or logs, App Server auth support is
  verified, and device-code login remains the fallback when unsupported.
- [ ] S07.11 Keep `docs/examples/recipes.md` as the recipe index until a later
  `docs/recipes/` tree has settled ownership.

## S08: Validation And Cleanup

- [ ] S08.01 Run the focused docs guard tests added in this pass and record the
  exact command names in the implementation PR.
- [ ] S08.02 Run `bun run typecheck` after docs snippets, examples, package
  exports, or TypeScript-backed docs helpers change.
- [ ] S08.03 Run `bun run lint` after new docs tests, scripts, or Markdown lint
  helpers are added.
- [ ] S08.04 Run `bun run test:protocol` when protocol method lists, protocol
  reference semantics, generated metadata, or Codex request builders are touched.
- [ ] S08.05 Run `bun run test:styles` when theming docs, style import guards,
  token policy, or React stylesheet guidance changes.
- [ ] S08.06 Run `bun run test:package-resolution` when package exports, package
  list docs, Web Components docs, or public stylesheet specifiers change.
- [ ] S08.07 Run `bun run validate:packages` when package manifests, package
  exports, build output expectations, package docs, or public package surface
  tests change.
- [ ] S08.08 Run focused server tests for one-shot RPC, upload, server request
  policy, or dynamic tool docs when those docs are backed by behavior tests.
- [ ] S08.09 Do not create a large `docs/maintenance/` tree during M0; add it
  only when moving concrete operational content out of public references.
- [ ] S08.10 Do not create a new `docs/quickstart.md` or
  `docs/guides/host-integration.md` until existing entry, product boundary,
  bridge, security, auth, and remote deployment owners are corrected.
- [ ] S08.11 Do not delete historical `tmp/` audit reports as part of M0; clean
  them only after unresolved findings are tracked elsewhere.
- [ ] S08.12 Defer roadmap, agent-instruction, changeset, fixture label,
  screenshot filename, and old audit cleanup unless they directly affect public
  docs output or the guard scope selected for this pass.

## Decisions Needed

- [ ] D01 Decide whether normal `serverRequestPolicy.permissions` should remain
  documented as trusted host policy or gain implementation-level requested-subset
  bounding before docs use bounded language.
- [ ] D02 Decide whether `examples/codex-local-web` should gain an actual
  admission example or docs should explicitly say it has loopback bind guard and
  method filtering but no configured admission hook.
- [ ] D03 Decide the first no-em-dash guard scope, especially whether
  `.changeset/*.md` is always included or only included when release-note files
  change.
- [ ] D04 Decide whether `docs/maintenance/` is included in public Markdown lint
  scope as soon as it exists.
- [ ] D05 Decide whether Local Smoke belongs in `docs/architecture/testing.md` or
  a new maintenance runbook for real Codex smoke evidence and release
  interpretation.
- [ ] D06 Decide whether `Deferred:` protocol items should become current
  protocol non-goals, `ROADMAP.md` backlog, or a split between both.
- [ ] D07 Decide whether external ChatGPT auth token mode should be documented in
  authentication or remote deployment as an explicit unsupported mode before
  protocol cleanup.
- [ ] D08 Decide whether Web Components should observe `chat-class` changes or
  docs should present it as an initial or next-render class hook only.
- [ ] D09 Decide whether `@nyosegawa/agent-ui-codex/stable-types` needs an
  explicit type-only runtime export policy exemption.
- [ ] D10 Decide whether upload directories should be required or normalized as
  absolute paths so returned upload path wording can be exact.
- [ ] D11 Decide whether theming docs should publish exact token values at all,
  or only token names, token groups, theme scopes, and override examples backed
  by `tokens.css`.
- [ ] D12 Decide the canonical screenshot capture command, either direct
  Playwright invocation with fixture config or a package script wrapper.
- [ ] D13 Decide whether documentation screenshots are intended to be committed
  artifacts; if yes, route sync can also check file existence.
- [ ] D14 Decide which snippet group should opt into typecheck first: quickstart
  examples, React guide examples, package export examples, or server bridge
  examples.
- [ ] D15 Decide whether a future `docs/recipes/` tree is needed after
  `docs/examples/recipes.md` and existing recipe markdown are normalized.
