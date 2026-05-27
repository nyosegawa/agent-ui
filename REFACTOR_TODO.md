# Refactor TODO

## Phase 0: Validation Baseline

- [x] Change `.github/workflows/ci.yml` from `bun test` to the repository's
  intended validation scripts.
- [x] Change `.github/workflows/release.yml` from `bun test` to the repository's
  intended validation scripts.
- [x] Ensure `bun run test:protocol` includes every Codex protocol test,
  including websocket transport coverage.
- [x] Ensure Playwright preview servers cannot validate stale ignored `dist`
  output.
- [x] Fix the undefined `--aui-space-650` usage in
  `examples/local-react-vite/src/styles/usage-only.css`.
- [x] Fix screenshot capture readiness so routes that do not render `AgentChat`
  still have correct readiness checks.
- [x] Add or standardize clean build-output checks for `packages/*/dist`,
  `examples/*/dist`, and `examples/*/.next`.
- [x] Verify package-resolution checks cannot pass against stale local
  artifacts.
- [x] Update the root TypeScript project graph so every package that belongs to
  the monorepo contract is covered.
- [x] Decide canonical validation tier script names for fast, protocol,
  packages, e2e, and release validation.
- [x] Document the canonical validation tiers in `docs/architecture/testing.md`.

Acceptance:

- [x] `bun run typecheck` passes.
- [x] `bun run lint` passes.
- [x] `bun run test` runs the intended Vitest coverage.
- [x] `bun run test:protocol` includes all protocol tests.
- [x] `bun run test:styles` passes.
- [x] Docs contain no validation command that is missing from `package.json`.

## Phase 1: Package Boundary Cut

- [x] Define final responsibilities for `core`, `codex`, `react`, `server`, and
  `web-components`.
- [x] Remove `packages/react/src/codex-request-params.ts` from the React public
  API.
- [x] Remove React root exports for Codex request builders and Codex param
  helpers.
- [x] Move all Codex request construction behind Codex package clients or
  host-injected session/controllers.
- [x] Remove Codex imports from core tests.
- [x] Remove generic/non-App-Server adapters from the core public API.
- [x] Tighten `packages/core/src/index.ts`.
- [x] Tighten `packages/codex/src/index.ts`.
- [x] Tighten `packages/react/src/index.ts`.
- [x] Tighten `packages/server/src/index.ts`.
- [x] Tighten each package `exports` map.
- [x] Update `docs/reference/package-exports.md`.
- [x] Update API snapshots for the new ideal API.

Acceptance:

- [x] React no longer exports `threadStartParams`, `turnStartParams`,
  `textInput`, or Codex param types.
- [x] Core exports no generated Codex types and no request builders.
- [x] Codex is the only package that owns generated App Server schema.
- [x] `bun run test:api-snapshots` passes with the new public surface.
- [x] `bun run test:package-resolution` passes.
- [x] `bun run test:node-compat` passes.

## Phase 2: Core State Split

- [x] Split `packages/core/src/state.ts` into explicit domain store files.
- [x] Split `packages/core/src/events.ts` into domain event unions.
- [x] Split `packages/core/src/reducer.ts` into domain reducers plus a
  composition root.
- [x] Add `connectionStore`.
- [x] Add `threadIndexStore`.
- [x] Add `threadEntityStore`.
- [x] Add `turnStore`.
- [x] Add `itemStore`.
- [x] Add `serverRequestStore`.
- [x] Add `appsStore`.
- [x] Add `diagnosticsStore`.
- [x] Add `usageStore`.
- [x] Add selectors for thread, turn, item, approvals, apps, diagnostics, and
  usage surfaces.
- [x] Preserve merge semantics where omitted `Thread.turns` is not treated as
  history deletion.
- [x] Remove compatibility aliases from normalized state.
- [x] Add retention tests for ordered indexes.
- [x] Add retention tests for backing entity maps.
- [x] Update raw fixture tests to stay core-owned and protocol-neutral.

Acceptance:

- [x] Core state files map to protocol/product domains.
- [x] Thread index, thread entities, turns, items, and server requests can be
  reasoned about independently.
- [x] Stored history is not lost when a protocol payload omits turns/items.
- [x] Bounded-state docs are backed by tests for both lists and maps.
- [x] `bun run test:fixtures` passes.

## Phase 3: Codex Adapter Split

- [x] Regenerate or verify generated schema against the selected upstream App
  Server checkout.
- [x] Record upstream commit metadata and generator command with generated
  schema.
- [x] Make generated schema the only source for Codex method params.
- [x] Split `packages/codex/src/normalizer.ts` into protocol-family modules.
- [x] Add normalizer modules for thread events.
- [x] Add normalizer modules for turn events.
- [x] Add normalizer modules for item events and streaming deltas.
- [x] Add normalizer modules for server requests and request resolution.
- [x] Add normalizer modules for apps/connectors events.
- [x] Add normalizer modules for diagnostics/status events.
- [x] Group typed clients by protocol primitive:
  `connection`, `threads`, `turns`, `approvals`, `apps`, `skills`, `hooks`,
  `models`, and `account`.
- [x] Enforce stable/productized/host-only/experimental capability
  classification at client construction and public exports.
- [x] Add generated-schema-backed tests for request builders.
- [x] Add tests for initialize and notification opt-out behavior.
- [x] Add tests for item lifecycle using `item/started`, deltas, and
  `item/completed`.
- [ ] Add tests for `thread/read`.
- [ ] Add tests for `thread/turns/list`.
- [ ] Mark `thread/turns/items/list` as unsupported/not productized.
- [ ] Add tests for `app/list` pagination and refresh/update behavior.

Acceptance:

- [ ] No hand-written Codex method param model exists outside `packages/codex`.
- [ ] Normalizer files are split by protocol family, not one broad switch.
- [ ] Unsupported experimental methods are represented but not exposed as a
  productized UI primitive.
- [ ] `bun run test:protocol` passes.

## Phase 4: React Hooks And Controllers

- [ ] Split `packages/react/src/hooks.ts` into domain hooks.
- [ ] Add or refine `useAgentThread`.
- [ ] Add or refine `useAgentTurn`.
- [ ] Add or refine `useAgentComposer`.
- [ ] Add or refine `useAgentApprovals`.
- [ ] Add or refine `useAgentAccount`.
- [ ] Add or refine `useAgentModels`.
- [ ] Add or refine `useAgentApps`.
- [ ] Add or refine `useAgentDiagnostics`.
- [ ] Add or refine `useAgentUsage`.
- [ ] Keep `AgentProvider` responsible for state, transport, and controller
  injection only.
- [ ] Move request construction out of React public API.
- [ ] Implement composer controller semantics:
  idle submit uses `turn/start`; running follow-up queues or uses validated
  `turn/steer`; Stop uses `turn/interrupt`.
- [ ] Preserve routing behavior where `/` is no-thread start state.
- [ ] Preserve direct `/threads/<id>` open behavior.
- [ ] Keep stored history readable without forcing resume semantics.
- [ ] Update React hook docs.
- [ ] Update React hook tests.

Acceptance:

- [ ] React hooks are grouped by product domain.
- [ ] React can be used with a host-provided Codex session/controller.
- [ ] Composer keyboard and running-state behavior matches App Server semantics.
- [ ] Usage/status can be rendered without assuming full chat shell usage.

## Phase 5: Transcript And UI Split

- [ ] Split `packages/react/src/timeline.tsx`.
- [ ] Move pure transcript block synthesis into focused modules.
- [ ] Move item renderers into focused modules.
- [ ] Move scroll-follow behavior into focused modules.
- [ ] Move windowing behavior into focused modules.
- [ ] Move approval anchoring into focused modules.
- [ ] Keep user and assistant messages readable inline.
- [ ] Use disclosure for heavy command output, diffs, tool bodies, and verbose
  diagnostics.
- [ ] Keep approvals inline in transcript and backed by server-request state.
- [ ] Add tests for command execution blocks.
- [ ] Add tests for file change blocks.
- [ ] Add tests for MCP/dynamic/collab tool blocks.
- [ ] Add tests for reasoning and compaction items.
- [ ] Add tests for approval placement and resolution.
- [ ] Add tests for stored-history transcript rendering.
- [ ] Add mobile hit-test coverage for composer and approval actions.

Acceptance:

- [ ] The transcript remains the primary reading surface.
- [ ] Normal messages are not hidden behind disclosure.
- [ ] Heavy bodies are inspectable without creating nested scroll traps.
- [ ] Desktop and mobile approval actions are reachable.
- [ ] React component and transcript tests pass.

## Phase 6: Design System And CSS

- [ ] Audit `packages/react/src/styles/tokens.css` before adding or changing any
  token.
- [ ] Audit distributed React CSS for raw colors, raw radii, and private
  stylesheet assumptions.
- [ ] Audit example CSS for token compliance.
- [ ] Audit docs-site CSS for token compliance or explicitly host-owned theme
  overrides.
- [ ] Audit visual inline style objects in examples for token compliance.
- [ ] Keep `@nyosegawa/agent-ui-react/styles.css` as the only public stylesheet
  import.
- [ ] Expand `packages/react/test/style-duplication.vitest.ts` if the rule set
  intentionally changes.
- [ ] Update `docs/guides/theming.md` for token or stylesheet contract changes.
- [ ] Update screenshots only after intentional visual contract changes.

Acceptance:

- [ ] `bun run test:styles` passes.
- [ ] No undefined `--aui-*` token is referenced.
- [ ] Public docs do not mention private CSS chunk imports.
- [ ] Visual changes are verified in browser-visible routes.

## Phase 7: Examples Rebuild

- [ ] Rebuild `examples/local-react-vite` after public API changes settle.
- [ ] Keep `/` only as the transcript-first default shell.
- [ ] Keep `/rich-transcript` as dense transcript stress coverage.
- [ ] Keep `/fixture-gallery` as component closeups and route previews.
- [ ] Keep `/usage-only` as usage/status without chat assumptions.
- [ ] Keep `/scoped-thread-pane` as scoped thread composition.
- [ ] Keep `/app-connectors` as the Apps/connectors surface.
- [ ] Keep `/host-workflow-recipe` only if it remains generic host composition.
- [ ] Delete or replace obsolete route handoff README folders.
- [ ] Rebuild fixture data with purpose-based names.
- [ ] Rebuild `examples/codex-local-web` after core bridge/UI APIs settle.
- [ ] Keep codex-local-web focused on same-origin WebSocket bridge behavior.
- [ ] Keep codex-local-web focused on real/fake Codex App Server lifecycle.
- [ ] Keep codex-local-web focused on thread URL routing.
- [ ] Keep codex-local-web focused on upload persistence.
- [ ] Keep codex-local-web focused on running-turn follow-up semantics.
- [ ] Keep codex-local-web focused on approvals and usage restoration.
- [ ] Update `examples/next-rpc-route` after server API changes.
- [ ] Update `examples/next-with-bridge-sidecar` after server API changes.
- [ ] Update `examples/recipes` after React/server public APIs settle.
- [ ] Decide whether `examples/docs-site` remains executable, merges into docs,
  or is deleted.

Acceptance:

- [ ] Each retained example has a current purpose.
- [ ] Examples consume public package exports as a host would.
- [ ] No retained example exists only to preserve an obsolete API shape.
- [ ] Fixture app has no blank retained route.
- [ ] Example desktop and mobile routes have no document-level horizontal
  overflow.

## Phase 8: E2E And Browser Verification

- [ ] Restructure fixture e2e by durable contract, not route/file size.
- [ ] Add fixture smoke and blank-page checks.
- [ ] Add fixture visual layout and viewport containment checks.
- [ ] Add fixture composer/sidebar/menu reachability checks.
- [ ] Add fixture closeup checks for real component rendering.
- [ ] Add fixture approval hit-test checks.
- [ ] Add fixture design-system invariant checks.
- [ ] Keep screenshot capture as opt-in only.
- [ ] Restructure real-local e2e by App Server integration contract.
- [ ] Add real-local thread lifecycle and routing coverage.
- [ ] Add real-local attachments coverage.
- [ ] Add real-local follow-up/interruption/scrolling coverage.
- [ ] Move shared Playwright helpers under the correct `e2e/support/`
  directory.
- [ ] Keep Playwright helpers thin: app open, readiness, viewport, durable
  accessibility queries.
- [ ] Keep readiness retries at app-open boundaries only.
- [ ] Use agent-browser or browser verification for fixture gallery desktop.
- [ ] Use agent-browser or browser verification for rich transcript desktop.
- [ ] Use agent-browser or browser verification for usage-only mobile.
- [ ] Use agent-browser or browser verification for real local web desktop.

Acceptance:

- [ ] `bun run test:e2e:clean-ports` passes.
- [ ] `bun run test:e2e:playwright` passes.
- [ ] A failing e2e file clearly identifies the broken product contract.
- [ ] No timeout increase is used as the primary flaky-test fix.
- [ ] Accessibility snapshots expose composer, approvals, menus, and main
  transcript where relevant.
- [ ] Mobile composer remains visible.
- [ ] Approval actions are clickable.

## Phase 9: Docs And Screenshots

- [ ] Update `README.md`.
- [ ] Update `docs/README.md`.
- [ ] Update `docs/getting-started.md`.
- [ ] Update `docs/architecture/overview.md`.
- [ ] Update `docs/architecture/product-boundary.md`.
- [ ] Update `docs/architecture/testing.md`.
- [ ] Update `docs/architecture/toolchain.md`.
- [ ] Update `docs/guides/browser-verification.md`.
- [ ] Update `docs/guides/theming.md`.
- [ ] Update `docs/reference/codex-protocol.md`.
- [ ] Update `docs/reference/package-exports.md`.
- [ ] Update `docs/reference/react-components.md`.
- [ ] Update `docs/examples/local-react-vite.md`.
- [ ] Update `docs/examples/codex-local-web.md`.
- [ ] Update other `docs/examples/*` pages to match retained examples.
- [ ] Remove docs for deleted examples/routes.
- [ ] Regenerate `docs/screenshots/*` only after intentional visual changes.
- [ ] Remove screenshots for deleted routes.
- [ ] Ensure screenshot names match current route purposes.

Acceptance:

- [ ] Docs describe current implementation state, not migration history.
- [ ] Documentation entry points route users to current examples and package
  exports.
- [ ] Screenshot set exactly matches retained visual QA routes.
- [ ] No screenshot refresh is required for wording-only docs changes.

## Final Validation

- [ ] Run `bun run typecheck`.
- [ ] Run `bun run lint`.
- [ ] Run `bun run test`.
- [ ] Run `bun run test:protocol`.
- [ ] Run `bun run test:fixtures`.
- [ ] Run `bun run validate:packages`.
- [ ] Run `bun run check:dead-code`.
- [ ] Run `bun run test:api-snapshots`.
- [ ] Run `bun run test:package-resolution`.
- [ ] Run `bun run test:node-compat`.
- [ ] Run `bun run test:e2e:clean-ports`.
- [ ] Run `bun run test:e2e:playwright`.
- [ ] Start real local web:
  `AGENT_UI_PORT=5175 AGENT_UI_HOST=127.0.0.1 AGENT_UI_CODEX_CWD=/Users/sakasegawa/src/github.com/nyosegawa/agent-ui bun --filter @nyosegawa/agent-ui-example-codex-local-web dev`.
- [ ] Run `bun run test:e2e:real-local-web-layout` against the 5175 server.
- [ ] Perform agent-browser/manual desktop checks for fixture and real-local
  routes.
- [ ] Perform agent-browser/manual mobile checks for fixture routes.
- [ ] Push the branch.
- [ ] Watch GitHub Actions with `gh run list` and `gh run watch`.

Completion:

- [ ] Local full validation passes.
- [ ] Deterministic Playwright passes.
- [ ] Real local web layout audit passes.
- [ ] Manual browser evidence shows no visual breakage.
- [ ] GitHub CI, package validation, compatibility, and release workflows reach
  concrete success.
- [ ] `git status --short` is clean after generated snapshots, screenshots,
  docs, and code changes are committed.
