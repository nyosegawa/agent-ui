# Agent UI Repository Instructions

## Rules

- When writing a name in a license file, use `{year} Sakasegawa`. Confirm the current year using `date +%Y`.
- Unless explicitly instructed otherwise, create repositories under `nyosegawa/{reponame}`.
- Keep docs implementation-facing. Do not include competitor-research background in product docs.
- Use the Codex App Server protocol as the primary integration surface.
- Treat `README.md` and `docs/README.md` as the documentation entry points.
- Do not implement MVP shortcuts. The target is a complete Codex App Server UI
  component system with composable thread, usage, skills, apps, and browser
  verification surfaces.
- Keep external app workflows outside the core library. Proposal/session
  orchestration, app-specific panel runtimes, storage, and sidecar behavior
  belong in host applications that compose Agent UI primitives.
- Keep the default runtime local-first, single-user, stdio-first, and
  stable-API-first unless the active docs explicitly mark a surface as
  experimental or host-only.
- Use Bun as the primary package manager and development runner.
- Keep Node.js LTS compatibility for published packages and server integrations.

## Documentation Operations

- If a decision changes scope, public API, package boundary, validation,
  security, or host integration behavior, update the relevant file under
  `docs/` in the same change.
- Keep public docs current-state oriented. Do not add planning logs,
  migration diaries, or dated validation transcripts to the public docs.
- Do not leave stale README, docs, examples, or AGENTS instructions behind a
  code change. If the implementation changes public API, package boundaries,
  validation, or host integration behavior, update the corresponding docs in
  the same change.
- For broad documentation updates, do not rely on `rg` alone. Read the
  affected docs and compare them with the current implementation, examples,
  scripts, and tests before deciding what to update, merge, or delete.
- Use purpose-based names for fixtures, routes, screenshots, and tests. Do not
  preserve legacy or source-of-inspiration names once they no longer describe
  the current product surface.

## Default Work Loop

- Start by reading the relevant implementation, tests, examples, and docs.
  Do not rely on memory, generated summaries, or names alone when changing a
  public surface.
- Implement the complete requested behavior. Do not leave placeholder logic,
  temporary compatibility shims, or MVP-only surfaces unless the user
  explicitly asks for a temporary step.
- Add or update focused tests with the behavior change. A public API, reducer
  path, protocol normalizer, bridge behavior, or visible UI state is not
  complete without test coverage.
- For browser-visible changes, verify the running UI in a browser in addition
  to automated tests. Check desktop and mobile viewports when layout,
  interaction, overflow, scrolling, or responsive behavior changes.
- Update README, docs, examples, screenshots, and public API references in the
  same slice when behavior, package boundaries, setup, validation, or host
  integration changes.
- After each coherent slice, run the relevant validation, commit, push, verify
  the branch is clean, and follow CI to a concrete success or failure.

## Implementation Discipline

- Work in small, reviewable implementation slices. After each coherent slice,
  update the relevant docs, run the relevant tests, commit, push, and verify
  the branch is clean.
- Do not batch many unrelated changes into one commit. Prefer commits that
  map to one protocol surface, component boundary, example, or validation gate.
- Add or update tests with the behavior change. A public API, reducer path,
  protocol normalizer, bridge behavior, or visible UI state is not complete
  without focused test coverage.
- Run targeted validation after each slice and the full validation ladder before
  marking broad work complete.
- Refactor when implementation complexity starts hiding protocol, state, UI, or
  bridge behavior. Do not preserve awkward old shapes for compatibility when
  the active docs call for a cleaner API.
- Do not perform purely mechanical file splits as a substitute for design.
  When refactoring, read the owning files, identify stale code and old
  concepts, move behavior into intentional modules, and delete unused pieces.
- Use `/Users/sakasegawa/src/github.com/openai/codex/codex-rs/app-server` as
  the local App Server source of truth whenever protocol behavior, generated
  schema, stable versus experimental status, or runtime semantics are unclear.

## Validation Expectations

- Use targeted validation while iterating, then run the full relevant ladder
  before claiming broad work complete.
- Do not run `bun run build` in parallel with `bun run publint` or
  `bun run attw`. The build scripts clean package `dist/` directories, so
  package validation can race against missing build artifacts. Run build to
  completion first, then run package validation.
- Treat commands that read package build output as dependent on `bun run build`.
  This includes package validation and any browser check against examples that
  resolve workspace packages through package exports. Do not start those checks
  while build is still running.
- Prefer `bun run validate:packages` when validating package build output; it
  runs `build`, `publint`, and `attw` in the required order.
- Standard validation commands:
  - `bun run typecheck`
  - `bun run lint`
  - `bun run test`
  - `bun run test:protocol`
  - `bun run test:fixtures`
  - `bun run build`
  - `bun run publint`
  - `bun run attw`
- For React component, transcript, bridge, or UI behavior changes, also run the
  focused Vitest or Playwright suites that cover the changed surface.
- For browser-visible changes, run `bun run test:e2e:playwright`.
- `bun run test:e2e:playwright` cleans the Playwright-owned preview ports
  `4173` and `4174` before starting web servers. If a targeted Playwright
  command is run manually after an interrupted test, run
  `bun run test:e2e:clean-ports` first so a stale preview or fake Codex bridge
  cannot satisfy the port check with old state.
- Do not fix flaky e2e by simply increasing test timeouts. First identify
  whether the failure is server readiness, stale port state, an incorrect
  selector, or a real UI contract failure. Add short readiness retry only at
  the app-open boundary, then keep interaction assertions fail-fast with
  explicit low timeouts so regressions surface quickly.
- For real Codex local web layout or App Server bridge changes, run
  `bun run test:e2e:real-local-web-layout` against the real local web example
  when that server is available.
- When browser-checking examples that import workspace packages through built
  package exports, rerun `bun run build` after core/package changes and restart
  the example servers before judging the UI. Otherwise Vite may keep serving
  stale `dist/` artifacts.
- Keep ad-hoc browser checks aligned with the real DOM and public accessibility
  surface. Prefer roles, labels, and classes that exist in the component over
  invented `data-testid` selectors; if a manual check fails, first verify the
  selector and page state before treating it as an app regression.
- Before claiming clean-workspace typecheck or CI compatibility after package
  boundary, TypeScript config, declaration, build-output, or example import
  changes, remove ignored build artifacts and typecheck from a clean state:

  ```sh
  find packages examples -name dist -type d -prune -exec rm -rf {} +
  find examples -name .next -type d -prune -exec rm -rf {} +
  bun run typecheck
  ```

## Browser and UI Checks

- Use the fixture Vite app for component and layout review. Relevant routes
  include `/`, `/rich-transcript`, `/fixture-gallery`,
  `/host-workflow-recipe`, `/usage-only`, `/scoped-thread-pane`, and
  `/app-connectors`.
- Use `examples/codex-local-web` for real Codex App Server integration,
  history, bridge, upload, and transcript behavior.
- Keep fixture coverage and real-local coverage conceptually separate. Fixture
  routes are for deterministic component/stress states; `examples/codex-local-web`
  is for App Server-backed behavior such as history, resume, routing, uploads,
  streaming, steer, interrupt, and token usage.
- When interaction matters, do not rely only on screenshots. Verify hit tests,
  actual clicks, keyboard behavior, focus, scrolling, and overflow as
  appropriate.
- For layout changes, check at least a desktop viewport and a mobile viewport.
  Horizontal page overflow, clipped thread titles, nested scroll traps, hidden
  composer controls, and unreachable approval actions are regressions.

## CI/CD Follow-through

- After pushing, inspect GitHub Actions with `gh run list` or the GitHub app.
- If checks are running, wait for the final result. Do not report success from
  a pushed commit until the relevant workflows have passed.
- If a workflow fails, inspect the logs, reproduce locally when possible, fix
  the root cause, commit, push, and watch the replacement run.
