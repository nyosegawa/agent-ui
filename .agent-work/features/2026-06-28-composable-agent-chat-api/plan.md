## Summary

Redesign the React public surface around one shared Agent UI provider state and
one public chat-flow controller. Root remains the drop-in preset entry;
`/headless` becomes the canonical controller layer; `/primitives` remains the
visual composition layer. `AgentChat` should be usable as a complete preset
while exposing documented, raw-free composition points for host chrome, thread
history, start policies, external send, mobile overlay coordination, and local
media resolution.

## Background

The desired contract is that these can be mixed in one React tree:

- `@nyosegawa/agent-ui-react` root `AgentProvider` / `AgentChat`
- `@nyosegawa/agent-ui-react/headless` hooks/controllers
- `@nyosegawa/agent-ui-react/primitives` UI primitives

They must reference the same provider context and the same active chat-flow
lifecycle. A host using `AgentChat` should not need private DOM classes,
internal state, or direct transport calls to add product-specific UI.

## Current State

- Root export is intentionally small and points `AgentProvider` through
  `provider-root.ts`.
- `/headless` exports `./provider`, hooks, controllers, run policies, resources,
  transcript window helpers, usage, and i18n.
- `/primitives` exports visual building blocks and no provider.
- Source has one `AgentContext` in `packages/react/src/provider.tsx`.
- `AgentChat` has `components`, `statusBarEnd`, starter options, local media,
  locale/theme, usage/diagnostics, sidebar, and URL-routing props.
- `useAgentComposerController()` has the lifecycle semantics needed for safe
  first-message start, follow-up/steer, queue, retry, stop, and reconciliation.
- `AgentChat` / visual composer components instantiate their own composer
  controller, so external UI cannot share exactly the same draft/error/submit
  state with the preset composer.

## Goals

- One provider runtime contract across root, `/headless`, and `/primitives`.
- Built ESM and CJS package output must prove root provider plus subpath hooks
  and primitives share context.
- A public `AgentChatController` that owns active thread, composer lifecycle,
  first-message start, follow-up queue/steer, stop, failed pending messages,
  canonical thread reconciliation, and public send entrypoints.
- `AgentChat` uses that same controller internally and can also receive or
  expose the controller for host-owned UI.
- Hosts can replace thread history, add header/status UI, fix cwd/start options,
  send from external UI, coordinate overlay layers, and resolve local media via
  public props/controllers/tokens.
- No private DOM selectors, raw reducer state, generated protocol payloads, or
  raw transport calls in the documented integration path.

## Non-Goals

- No host auth, authorization, persistence, tenant/workspace isolation,
  deployment, billing, Codex process lifecycle, or overlay manager ownership.
- No generic chatbot runtime unrelated to Codex App Server.
- No direct edits to `third_party/codex`, generated schema, or `dist`.
- No compatibility shim for old public shapes if the new contract supersedes
  them.
- No unbounded slot API that exposes scroll internals, approval placement,
  attachment mutation internals, sidebar pagination internals, or private CSS.

## Repo-Specific Constraints

- Use Bun.
- Keep Node.js LTS package compatibility.
- Public API changes require docs, examples, tests, API snapshots, package
  resolution, and release impact.
- Browser-visible changes require Playwright fixture evidence.
- `validate:packages` is order-sensitive and must not be split into parallel
  build / `publint` / `attw` assumptions.
- Work through a PR for `main`.

## Design Decisions

1. Preserve the three-entrypoint model.
   Root is preset setup. `/headless` owns controllers. `/primitives` owns visual
   composition. Do not expand root into a convenience barrel for all hooks.

2. Add a public chat-flow controller.
   Introduce `useAgentChatController()` and `AgentChatController` on
   `/headless`. It should wrap or refactor the existing composer/thread
   controllers into a stable object with:
   `activeThreadId`, `thread`, `composer`, `send(input, options)`,
   `start(input, options)`, `submitCurrentDraft()`, `stop()`,
   `setDraft()`, queue/failure state, and stable result metadata. Names may be
   adjusted during implementation, but the concept must survive.

3. Scope shared draft state explicitly.
   External UI and `AgentChat` should share the same controller state when they
   are in the same chat-flow scope. If multiple composers are intentionally
   independent, hosts should create independent scopes rather than accidentally
   sharing global draft state.

4. Make `AgentChat` controller-driven.
   Refactor `AgentChat` and the default composer path to consume the public
   chat-flow controller instead of a private internal composer instance. Allow
   a host to pass a controller or receive one through a render/control prop
   without exposing internals.

5. Replace "slots" with a constrained composition contract.
   Keep or replace `AgentComponents`, but document precise raw-free render
   areas. Include thread history/sidebar, header/status additions, empty state,
   composer panel, approval card, transcript blocks/items, and context rail
   additions. Do not expose rejected low-level internals.

6. Promote start policies as public preset configuration.
   Add or formalize props for fixed working directory, thread start options,
   default turn options, run-policy restrictions, and host starter behavior.
   These remain request options, not host workflow policy.

7. Formalize overlay/layer coordination through tokens and state props.
   Preserve `--aui-z-*` tokens and add public overlay/drawer state callbacks or
   controls only where the preset owns the drawer/sheet. Hosts own global modal
   managers.

8. Keep local media resolver structured.
   Preserve `resolveLocalAttachment` and `resolveLocalMediaUrl` as structured
   resource contracts. Do not ever use raw local paths directly as browser media
   URLs.

## Impacted Areas

- Agent UI-owned: `packages/react/src/provider.tsx`,
  `packages/react/src/headless.ts`, `packages/react/src/primitives.ts`,
  `packages/react/src/components/chat.tsx`,
  `packages/react/src/components/composer.tsx`,
  `packages/react/src/hooks/*`, React tests, package exports, API snapshots.
- Host-owned: auth, persistence, routing policy, workflow state, workspace and
  tenant semantics, global overlay management, upload/static authorization.
- Protected: `third_party/codex`, generated Codex schema, `dist`, private CSS
  chunks, private `.aui-*` selectors.
- Example-only: recipes, local React Vite showcase routes/catalog/manifest,
  docs-site examples.
- Docs-only: reference docs, guides, package export docs, testing docs if
  validation policy changes.
- Release-sensitive: changesets, package snapshots, package resolution,
  `validate:packages`, PR checks, npm release notes.

## Validation Plan

Focused while iterating:

```sh
bunx vitest run packages/react/test/provider.vitest.tsx packages/react/test/components.vitest.tsx packages/react/test/composer-submit-semantics.vitest.ts packages/react/test/source-structure.vitest.ts test/runtime-export-policy.test.ts test/public-showcase-catalog.test.ts
bun run --cwd examples/recipes typecheck
bun run --cwd examples/local-react-vite typecheck
bun run --cwd examples/local-react-vite build
bun run --cwd examples/docs-site typecheck
bun run --cwd examples/docs-site build
```

Package/public API:

```sh
bun run validate:packages
bun run build
bun run test:api-snapshots
bun run test:package-resolution
bun run check:clean-build-output
```

If declarations intentionally change:

```sh
bun run build
bun run test:api-snapshots:update
bun run test:api-snapshots
```

Browser-visible:

```sh
bun run test:e2e:clean-ports
env -u NO_COLOR -u FORCE_COLOR playwright test --config playwright.fixtures.config.ts examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts examples/local-react-vite/e2e/visual-route-matrix.e2e.ts examples/local-react-vite/e2e/smoke.e2e.ts examples/local-react-vite/e2e/composer-retry.e2e.ts examples/local-react-vite/e2e/visual-layout.e2e.ts examples/local-react-vite/e2e/accessibility-contract.e2e.ts
```

Real-local if live bridge lifecycle behavior changes:

```sh
bun run test:e2e:real-local
```

Pre-PR:

```sh
bun run validate:fast
bun run validate:protocol
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
bun run test:e2e:fixtures
```

## Commit, PR, And CI Plan

- Commit this planning package first on
  `codex/plan-composable-agent-chat-api`.
- Implement phase by phase on the same branch.
- Each phase should be reviewable and committable as one unit.
- Add a changeset for consumer-facing API changes. Default to a major changeset
  if public APIs are removed or renamed.
- Push the branch and open a PR.
- Watch CI to concrete success/failure with `gh pr checks --watch` or
  `gh run watch --exit-status`.

## Risks

- Sharing one chat controller globally can couple unrelated host composers; use
  explicit scopes.
- Too many render areas can undermine accessibility and scroll contracts.
- Built package context identity can fail even if source imports look shared.
- Breaking API docs can drift from API snapshots if examples are not updated in
  the same phase.
- Large controller refactors can exceed source-structure line-count gates.

## Completion Criteria

- Root, `/headless`, and `/primitives` composition works in source tests and
  built package resolution tests.
- `AgentChat` and external host UI can send through the same public controller
  lifecycle.
- `AgentChat` exposes documented raw-free composition points for the requested
  host customizations.
- Docs, examples, API snapshots, package resolution, changeset, and browser
  tests all reflect the final public API.
- PR has concrete local validation and CI status recorded.

## Open Questions

- Final public names for chat-flow controller and render-area props.
- Whether `AgentComponents` is expanded or replaced. Backward compatibility is
  not required, but the new shape must remain narrow and documented.
- Exact changeset bump after the final diff. The planning assumption is major
  if any current public shape is removed or renamed.
