# Agent UI Repository Instructions

## Non-Negotiables

- When writing a name in a license file, use `{year} Sakasegawa`; confirm the year with `date +%Y`.
- Unless explicitly instructed otherwise, create repositories under `nyosegawa/{reponame}`.
- Use Bun as the package manager and day-to-day runner.
- Keep published packages and server integrations compatible with Node.js LTS.
- Use the Codex App Server protocol as the primary integration surface. When protocol behavior, generated schema, stable versus experimental status, or runtime semantics are unclear, inspect `third_party/codex/codex-rs/app-server`.
- For Codex App Server schema refreshes, drift checks, or update PRs, use `.agents/skills/codex-upstream-sync`.
- Do not edit files inside the upstream Codex submodule unless the user explicitly asks for that repository to be changed. Routine sync work may update the submodule pointer through the Codex upstream sync flow.

## Product Shape

Agent UI is a reusable Codex App Server UI component library, not a host application runtime.

- Build general primitives, hooks, adapters, and documented extension points for the Codex App Server UI surface.
- Keep host-specific workflows, orchestration layers, app panels, persistence policies, and sidecar lifecycle outside the core library. Host apps compose Agent UI primitives to implement those workflows.
- Do not add APIs only because one host app currently needs them.
- Treat `app/list` as Codex Apps/connectors protocol, not as a host workflow registry.
- Do not introduce host-specific stores, worker panes, tool names, examples, or public docs into this repo.
- Keep usage, status, diagnostics, thread, composer, approvals, apps, and browser-verification surfaces independently composable. `AgentChat` may wire them together, but hosts must be able to render usage-only, scoped-thread, and custom primitive layouts.
- Default to local-first, single-user, stdio-first, and stable-API-first unless docs explicitly mark a surface as experimental or host-only.

## UX Contract

The default product experience is transcript-first.

- User messages, assistant messages, tool calls, command output, file changes, approvals, and usage context belong in the conversation flow. Do not reintroduce a separate "work trace" concept.
- Do not collapse normal user or assistant messages behind details. Use disclosure for heavy tool bodies, command output, diffs, or verbose diagnostics while keeping readable previews inline.
- Keep the composer as the primary bottom-anchored interaction surface. Running state should turn the send affordance into Stop, keep normal Enter as a UI-local follow-up queue, and reserve `turn/steer` for Cmd/Ctrl+Enter or queued `Send now`.
- Pending approvals belong at the relevant point in the transcript, not in a separate scroll pane. Approval actions must remain reachable and hit-testable on desktop and mobile.
- Avoid nested vertical scroll traps in markdown, code blocks, command output, and diff previews. The transcript should own normal reading scroll unless a component is intentionally disclosed as a heavy body.
- Thread history must preserve readable titles and metadata. Clipped titles, broken metadata rows, horizontal page overflow, and manual "Load all" style history UX are regressions.
- Attachments are host-resolved local inputs. Browser `File` objects should be persisted by the host when Codex needs an absolute local path; images should show thumbnails, and arbitrary non-image files should be represented in a way the App Server can consume.
- Token usage belongs near the active conversation/composer context and should be inspectable without dominating the thread header or replacing transcript content.

## Implementation Practice

- Start by reading the relevant implementation, tests, examples, and docs. Do not rely on memory, generated summaries, or names alone when changing a public surface.
- Implement the complete requested behavior. Do not leave placeholder logic, temporary compatibility shims, or MVP-only surfaces unless the user explicitly asks for a temporary step.
- Work in small, reviewable slices. Prefer commits that map to one protocol surface, component boundary, example, or validation gate.
- Add or update focused tests with the behavior change. A public API, reducer path, protocol normalizer, bridge behavior, or visible UI state is not complete without coverage.
- When implementing or documenting bounded state retention, verify both the index/list and the backing entity store. If docs use words like "bounded", "retention", or "cannot grow indefinitely", add a test that proves the real backing map/entity data is bounded too.
- Refactor when implementation complexity hides protocol, state, UI, or bridge behavior. Do not preserve awkward old shapes for compatibility when the active docs call for a cleaner API.
- Do not perform purely mechanical file splits as a substitute for design. Read the owning files, identify stale code and old concepts, move behavior into intentional modules, and delete unused pieces.
- Use purpose-based names for fixtures, routes, screenshots, and tests. Do not preserve legacy or source-of-inspiration names once they no longer describe the current product surface.
- After each coherent slice, update docs as needed, run relevant validation, commit, push, verify the branch is clean, and follow CI to a concrete success or failure.

## Design System And CSS

Agent UI's design system is the `--aui-*` token contract in `packages/react/src/styles/tokens.css`.

- Treat `packages/react/src/styles/tokens.css` as the source of truth for color, surfaces, borders, text, semantic state, code surfaces, elevation, radii, spacing, type scale, line height, control heights, focus, and motion.
- Do not preserve awkward old values by hiding them behind variables. Read the UI and change the visual decision itself when consistency requires it.
- Keep `@nyosegawa/agent-ui-react/styles.css` as the only public stylesheet import. The files under `packages/react/src/styles/*` are private implementation chunks imported by `packages/react/src/styles.css`; do not document or rely on deep CSS imports.
- Distributed React CSS, bundled fixture/docs example CSS, and visual inline style objects in examples should use `--aui-*` tokens for colors, radii, type scale, spacing, control sizing, focus, elevation, and motion. Do not add raw colors, negative letter spacing, or pixel `border-radius` values outside `tokens.css`; `border-radius: 0` and `50%` are the only normal exceptions. React numeric `borderRadius` values count as pixel radii.
- Keep example route CSS aligned with the same token system. `examples/local-react-vite`, `examples/codex-local-web`, and `examples/docs-site` are visual QA surfaces for the library, not independent brand experiments. A recipe such as `examples/recipes/src/themed.css` may intentionally override token values to demonstrate host theming.
- Before adding a new token, read the existing token groups and choose a semantic name that can survive future visual changes. Add a token only when it represents a reusable design decision, not a one-off layout measurement.
- Before adding a new style chunk or selector family, read the owning component and nearby CSS chunk. Prefer extending the existing primitive system (`aui-btn`, inputs, menus, status pills, transcript blocks) over creating a parallel visual language.
- If a CSS change affects visual contracts, update `docs/guides/theming.md`, `docs/reference/react-components.md`, relevant example docs, screenshots, or AGENTS instructions in the same change.
- Preserve the CSS guard tests in `packages/react/test/style-duplication.vitest.ts`. When changing the rules intentionally, update the test and documentation together instead of loosening the guard silently.

## Documentation Practice

`README.md` and `docs/README.md` are the documentation entry points.

- Keep docs implementation-facing and current-state oriented. Do not include competitor-research background, planning logs, migration diaries, or dated validation transcripts in product docs.
- If a decision changes scope, public API, package boundary, validation, security, host integration behavior, examples, or screenshots, update the relevant docs in the same change.
- Do not leave stale README, docs, examples, or AGENTS instructions behind a code change.
- For broad documentation work, do not rely on `rg` alone. Read the affected docs and compare them with the current implementation, examples, scripts, and tests before deciding what to update, merge, or delete.

## Test And Validation

Use targeted validation while iterating, then run the full relevant ladder before claiming broad work complete.

Standard commands:

```sh
bun run typecheck
bun run lint
bun run test
bun run test:protocol
bun run test:fixtures
bun run build
bun run publint
bun run attw
```

Package validation:

- Do not run `bun run build` in parallel with `bun run publint` or `bun run attw`; build cleans package `dist/` directories.
- Prefer `bun run validate:packages` when validating package build output. It runs `build`, `publint`, and `attw` in the required order.
- Any browser check that resolves workspace packages through package exports depends on a completed `bun run build`. Rebuild and restart example servers after core/package changes.

Focused validation:

- Before adding, moving, or substantially refactoring tests, read `docs/architecture/testing.md` and follow its current test-layer ownership, e2e file-boundary, readiness, and validation guidance.
- For React component, transcript, bridge, or UI behavior changes, run the focused Vitest or Playwright suites that cover the changed surface.
- For design-system or CSS-token changes, run `bun run test:styles` plus `bun run typecheck`, `bun run lint`, and the relevant browser-visible checks. If `packages/react/src/styles.css`, package exports, or copied package CSS changes, also run `bun run validate:packages` and `bun run test:package-resolution`. Run the full `bun run test` and `bun run build` before claiming broad CSS work complete.
- For browser-visible changes, run `bun run test:e2e:playwright`.
- `bun run test:e2e:playwright` owns preview ports `4173` and `4174` and cleans them before starting web servers.
- If running targeted Playwright after an interrupted test, run `bun run test:e2e:clean-ports` first so a stale preview or fake Codex bridge cannot satisfy the port check with old state.
- Do not fix flaky e2e by simply increasing timeouts. First classify the failure as server readiness, stale port state, selector drift, or a real UI contract failure. Add short readiness retry only at the app-open boundary; keep interaction assertions fail-fast with explicit low timeouts.
- Do not split e2e files mechanically. File boundaries must follow durable contracts: real App Server lifecycle/routing, attachments, follow-ups/scrolling, fixture layout, closeups, approvals, and design-system invariants. Shared helpers belong under `e2e/support/` and should expose thin page operations, not hidden DOM shortcuts or whole flows.
- For real Codex local web layout or App Server bridge changes, run `bun run test:e2e:real-local-web-layout` against an available `examples/codex-local-web` server.

Clean-state validation:

```sh
find packages examples -name dist -type d -prune -exec rm -rf {} +
find examples -name .next -type d -prune -exec rm -rf {} +
bun run typecheck
```

Use this before claiming clean-workspace typecheck or CI compatibility after package boundary, TypeScript config, declaration, build-output, or example import changes.

## Browser And UI Checks

- Use the fixture Vite app for deterministic component and layout review. Routes: `/`, `/rich-transcript`, `/fixture-gallery`, `/host-workflow-recipe`, `/usage-only`, `/scoped-thread-pane`, and `/app-connectors`.
- Use `examples/codex-local-web` for App Server-backed behavior: history, resume, routing, uploads, streaming, steer, interrupt, and token usage.
- Keep fixture coverage and real-local coverage conceptually separate. Fixtures are deterministic component/stress states; real-local is protocol integration.
- Use `agent-browser` for local agent-driven browser checks. If it is missing, install it with `npm i -g agent-browser`, run `agent-browser install`, confirm `agent-browser --version`, then read `docs/guides/browser-verification.md` and the installed `agent-browser skills get core` guide before relying on its command workflow. Playwright remains the deterministic CI gate.
- For browser-visible changes, verify the running UI in a browser in addition to automated tests. Check desktop and mobile viewports when layout, interaction, overflow, scrolling, or responsive behavior changes.
- When interaction matters, do not rely only on screenshots. Verify hit tests, actual clicks, keyboard behavior, focus, scrolling, and overflow.
- Keep ad-hoc browser checks aligned with the real DOM and accessibility surface. Prefer real roles, labels, and classes over invented selectors. If a manual check fails, verify the selector and page state before treating it as an app regression.
- Horizontal page overflow, clipped thread titles, nested scroll traps, hidden composer controls, and unreachable approval actions are regressions.

## CI/CD Follow-Through

- After pushing, inspect GitHub Actions with `gh run list` or the GitHub app.
- If checks are running, wait for the final result. Do not report success from a pushed commit until the relevant workflows pass.
- If a workflow fails, inspect logs, reproduce locally when possible, fix the root cause, commit, push, and watch the replacement run.
