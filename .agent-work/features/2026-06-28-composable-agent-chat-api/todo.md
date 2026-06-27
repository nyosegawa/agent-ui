## Status Summary

Planning package for a breaking composable `AgentChat` / headless /
primitives redesign. P001-P003 are implemented, validated, reviewed, committed,
and pushed; P004 is next.

## Branch And Planning Commit

- Branch: `codex/plan-composable-agent-chat-api`
- Planning commit: `19700bb` (`Plan composable AgentChat API`)
- Remote: `origin`
- Push result: pushed to `origin/codex/plan-composable-agent-chat-api`
- Blockers: none known

## Phase Checklist

- [x] Public contract and context invariant
- [x] Chat-flow controller and scoped composer ownership
- [ ] AgentChat composition surface
- [ ] Examples, docs, and migration story
- [ ] Package validation, changeset, PR, and CI follow-through

## Task Checklist By Phase

- [x] P001 Public contract and context invariant
  - Goal: Prove and lock one provider runtime across root, `/headless`, and
    `/primitives`.
  - Scope: React exports, shared provider context runtime, source guards,
    built package runtime tests.
  - Expected files/areas:
    `packages/react/src/index.ts`, `packages/react/src/headless.ts`,
    `packages/react/src/primitives.ts`, `packages/react/src/provider-root.ts`,
    `packages/react/src/provider.tsx`, `packages/react/package.json`,
    `test/runtime-export-policy.test.ts`,
    `packages/react/test/provider.vitest.tsx`,
    `scripts/package-resolution-smoke.mjs`,
    `test/api-snapshots/react__*.d.ts`.
  - Validation:
    `bunx vitest run packages/react/test/provider.vitest.tsx test/runtime-export-policy.test.ts`;
    package-resolution smoke after build.
  - Review: run 4 parallel subagent reviews for export-map/runtime identity,
    React provider/context behavior, package-resolution coverage, and
    product-boundary compliance before commit.
  - Commit: one phase commit after validation.
  - Push: push after phase commit if remote is available.
  - PR/CI: not required before all implementation phases, but record evidence.
  - Evidence:
    - Implementation: added a versioned shared React context registry for
      provider, composer queue, and i18n contexts; added a source-level test
      that renders root `AgentProvider`, `/headless` hook, and `/primitives`
      component together; expanded package-resolution smoke to install copied
      package directories into a temp consumer and verify root/headless/
      primitives context sharing across ESM, CJS, and mixed ESM/CJS entrypoints.
    - Validation: `bunx vitest run packages/react/test/provider.vitest.tsx
      test/runtime-export-policy.test.ts packages/react/test/source-structure.vitest.ts`;
      `bun run --cwd packages/react typecheck`; `bun run test:api-snapshots`;
      `bun run lint --quiet`; `bun run test:package-resolution`; `git diff
      --check`.
    - Review: 4 parallel subagent reviews completed for export/runtime
      identity, React provider/context behavior, package-resolution coverage,
      and product-boundary compliance. Findings addressed: include the new
      registry file, cover composer queue and i18n contexts, avoid symlink
      realpath false positives in package smoke, add mixed ESM/CJS coverage,
      and use versioned global context keys. The locked runtime contract is
      shared provider context compatibility, not strict exported function
      object identity.
    - Commit: `255daaf` (`Lock React subpath context runtime`).
    - Push: pushed to `origin/codex/plan-composable-agent-chat-api`.
  - Tasks:
    - [x] T001 Add source-level test rendering root `AgentProvider`,
      `/headless` hook, and `/primitives` component together.
      - Expected files/areas: `packages/react/test/provider.vitest.tsx` or a
        new focused React test.
      - Validation note: must fail if provider context identity splits.
    - [x] T002 Add built ESM/CJS package-resolution runtime checks for
      root/subpath context sharing.
      - Expected files/areas: `scripts/package-resolution-smoke.mjs`,
        `test/runtime-export-policy.test.ts`.
      - Validation note: run after `bun run build`.
    - [x] T003 Keep root preset-only and move new advanced surfaces to
      `/headless` or `/primitives`.
      - Expected files/areas: `packages/react/src/index.ts`,
        `packages/react/src/headless.ts`, `packages/react/src/primitives.ts`.
      - Validation note: root export policy must stay intentional.

- [x] P002 Chat-flow controller and scoped composer ownership
  - Goal: Introduce the public controller used by both `AgentChat` and external
    host UI for the same send lifecycle.
  - Scope: headless controller, composer state ownership, first-message start,
    follow-up queue, steering, stop, retry/cancel, canonical reconciliation.
  - Expected files/areas:
    `packages/react/src/hooks/composer.ts`,
    `packages/react/src/hooks/composer-types.ts`,
    new focused hook/controller files if needed,
    `packages/react/src/headless.ts`,
    `packages/react/test/components.vitest.tsx`,
    `packages/react/test/composer-submit-semantics.vitest.ts`.
  - Validation:
    focused Vitest for controller state sharing and lifecycle behavior.
  - Review: run 4 parallel subagent reviews for controller semantics,
    composer lifecycle parity, raw-free public API shape, and product-boundary
    compliance before commit.
  - Commit: one phase commit after validation.
  - Push: push after phase commit if remote is available.
  - PR/CI: record validation in PR notes.
  - Evidence:
    - Implementation: added provider-scoped shared composer draft state;
      introduced `useAgentChatController()` on `/headless`; added
      `sendMessage()` as the raw-free external-send controller with
      discriminated `started` / `sent` / `queued` / `blocked` results; routed
      `AgentChat` first-run prompt through the public controller; extracted
      first-message lifecycle into `composer-first-message`; forwarded
      per-call `turnOptions` for active-thread sends; updated docs and API
      snapshot.
    - Validation: `bun run --cwd packages/react typecheck`;
      `bunx vitest run packages/react/test/components.vitest.tsx
      --testNamePattern "external|public chat controller|public composer
      controller|first input|failed first|retry|queued follow-up|running
      composer"`; `bunx vitest run packages/react/test/source-structure.vitest.ts
      packages/react/test/composer-submit-semantics.vitest.ts`;
      `bun run test:api-snapshots`; `bun run lint --quiet`;
      `bun run test:package-resolution`; `git diff --check`.
    - Review: 4 parallel subagent reviews completed for controller semantics,
      composer lifecycle parity, raw-free public API shape, and product-boundary
      compliance. Findings addressed: refreshed API snapshot, documented
      `useAgentChatController().sendMessage()`, replaced sentinel/string
      external-send results with a discriminated union, renamed queue-only
      attachment ownership to `queuedAttachments`, and forwarded `turnOptions`
      on active idle sends.
    - Commit: this phase commit (`Add shared chat controller send lifecycle`).
    - Push: pushed to `origin/codex/plan-composable-agent-chat-api`.
  - Tasks:
    - [x] T004 Design `AgentChatController` / `useAgentChatController()`
      with explicit scope semantics.
      - Expected files/areas: new or existing files under
        `packages/react/src/hooks/`.
      - Validation note: avoid exposing operation maps or raw protocol payloads.
    - [x] T005 Refactor internal composer ownership so `AgentChat` can consume
      the public controller.
      - Expected files/areas: `components/chat.tsx`,
        `components/composer.tsx`, hook files.
      - Validation note: default composer behavior must stay unchanged.
    - [x] T006 Add external-send tests for no active thread, idle thread,
      running thread, failed first message, retry, stop, and canonical id.
      - Expected files/areas: React component/controller tests.
      - Validation note: host must not call raw transport methods.

- [x] P003 AgentChat composition surface
  - Goal: Make `AgentChat` partially composable through public props,
    controller, render areas, replacement map, and tokens.
  - Scope: thread history replacement, header/status additions, starter
    options, overlay/drawer coordination, local media resolver, controller
    injection/exposure.
  - Expected files/areas:
    `packages/react/src/components/chat.tsx`,
    `packages/react/src/components/shell.tsx`,
    `packages/react/src/components/sidebar.tsx`,
    `packages/react/src/components/status.tsx`,
    `packages/react/src/components/thread.tsx`,
    `packages/react/src/components/composer.tsx`,
    `packages/react/src/styles/*.css`,
    `packages/react/test/source-structure.vitest.ts`,
    `packages/react/test/components.vitest.tsx`.
  - Validation:
    focused component tests plus source-structure guard updates.
  - Review: run 4 parallel subagent reviews for accessibility/focus behavior,
    composition-boundary scope, mobile overlay/layer contracts, and CSS/token
    public-surface compliance before commit.
  - Commit: one phase commit after validation.
  - Push: push after phase commit if remote is available.
  - PR/CI: browser fixture evidence required before ready.
  - Evidence:
    - Implementation: added public `AgentChat` composition props for
      `startOptions`, controlled overlay `controls`, `threadHeaderEnd`, and
      `StatusBar` / `ThreadHeader` replacements; exported preset replacement
      prop types from root and primitive header types from `/primitives`;
      routed fixed first-message options through the shared chat controller;
      rendered fixed cwd as read-only accessible starter state; kept local
      media resolution on the existing structured resolver path; documented the
      new public replacement/render areas and overlay/token contracts.
    - Validation: `bun run --cwd packages/react typecheck`;
      `bunx vitest run packages/react/test/components.vitest.tsx`;
      `bunx vitest run packages/react/test/components.vitest.tsx
      --testNamePattern "fixed AgentChat start options|controlled mobile
      drawer|mutually exclusive|unrelated host rerenders"`;
      `bunx vitest run packages/react/test/source-structure.vitest.ts`;
      `bun run lint --quiet`; `bun run --cwd packages/react build`;
      `bun run test:api-snapshots`; `bun run test:package-resolution`;
      `git diff --check`.
    - Review: 4 parallel subagent reviews completed for accessibility/focus
      behavior, composition-boundary scope, mobile overlay/layer contracts, and
      CSS/token public-surface compliance. Findings addressed: avoid controlled
      overlay focus re-runs from inline `controls`, suppress simultaneous
      drawer/sheet rendering, use sheet layer tokens for the compact context
      sheet, preserve `props.end` in docs, expose fixed cwd with an accessible
      full-path label, avoid clipping mobile header focus rings, and update the
      theming guide replacement list.
    - Commit: `12baa1d` (`Add composable AgentChat surfaces`).
    - Push: pushed to `origin/codex/plan-composable-agent-chat-api`.
  - Tasks:
    - [x] T007 Define the replacement/render-area contract and remove or
      update old `AgentComponents` assumptions as needed.
      - Expected files/areas: `components/chat.tsx`,
        `source-structure.vitest.ts`, docs later in P004.
      - Validation note: no private DOM or generated payloads.
    - [x] T008 Add public props for fixed start options and host starter
      policies without taking over host workflow state.
      - Expected files/areas: `components/chat.tsx`, request option types.
      - Validation note: first-message path must still use controller lifecycle.
    - [x] T009 Add overlay/drawer public controls or callbacks where the
      preset owns drawer/sheet state.
      - Expected files/areas: chat/shell/sidebar/status CSS and tests.
      - Validation note: must keep focus, inert background, Escape, and tokens.
    - [x] T010 Keep local media resolution structured and documented.
      - Expected files/areas: chat/thread/timeline components and tests.
      - Validation note: no raw local path media `src`.

- [ ] P004 Examples, docs, and migration story
  - Goal: Teach the new public contract with package-name imports and
    browser-visible examples.
  - Scope: reference docs, guides, recipes, local React Vite showcase/catalog,
    docs-site examples, changeset notes.
  - Expected files/areas:
    `docs/reference/package-exports.md`,
    `docs/reference/hooks.md`,
    `docs/reference/react-components.md`,
    `docs/guides/host-integration.md`,
    `examples/recipes/src/*`,
    `examples/local-react-vite/src/fixtures/public-component-catalog.ts`,
    `examples/local-react-vite/src/fixtures/visual-qa-manifest.ts`,
    `examples/docs-site`.
  - Validation:
    example typechecks/builds, public showcase catalog test, fixture Playwright
    subset.
  - Review: run 4 parallel subagent reviews for docs/API consistency, recipe
    correctness, showcase/browser coverage, and migration/release-note clarity
    before commit.
  - Commit: one phase commit after validation.
  - Push: push after phase commit if remote is available.
  - PR/CI: docs and examples included in PR summary.
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T011 Update reference docs to describe root/headless/primitives,
      controller sharing, and `AgentChat` composition.
      - Expected files/areas: docs reference pages.
      - Validation note: docs must not mention private selectors as API.
    - [ ] T012 Add recipes for `AgentChat` plus external send controller,
      replaced thread history, fixed start options, overlay coordination, and
      local media resolution.
      - Expected files/areas: `examples/recipes/src`.
      - Validation note: imports must use package names.
    - [ ] T013 Add/update local React Vite showcase routes and manifest.
      - Expected files/areas: public catalog and visual QA manifest.
      - Validation note: manifest and route matrix must agree.
    - [ ] T014 Add migration guidance for removed/renamed public APIs.
      - Expected files/areas: docs and changeset.
      - Validation note: backward compatibility is not required, but migration
        must be explicit.

- [ ] P005 Package validation, changeset, PR, and CI follow-through
  - Goal: Prove the public package is ready to merge.
  - Scope: package build, snapshots, package resolution, Playwright, changeset,
    commit/push/PR/CI.
  - Expected files/areas:
    `.changeset/*`, package snapshots, package metadata, PR notes.
  - Validation:
    `bun run validate:fast`, `bun run validate:protocol`,
    `bun run validate:packages`, `bun run test:api-snapshots`,
    `bun run test:package-resolution`, `bun run test:e2e:fixtures`; real-local
    if live bridge behavior changed.
  - Review: run 4 parallel subagent reviews for package/export readiness,
    validation evidence, release/changeset impact, and PR/CI readiness before
    marking the branch ready.
  - Commit: final validation/docs/release commit if needed.
  - Push: push branch.
  - PR/CI: open PR and watch required checks to success/failure.
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T015 Update API snapshots intentionally after reviewing the public
      declaration delta.
      - Expected files/areas: `test/api-snapshots/react__*.d.ts`.
      - Validation note: use `bun run test:api-snapshots:update`.
    - [ ] T016 Run package and browser gates.
      - Expected files/areas: validation logs in PR notes.
      - Validation note: keep `validate:packages` order intact.
    - [ ] T017 Add changeset with correct bump level.
      - Expected files/areas: `.changeset/*`.
      - Validation note: default to major if public removals/renames remain.
    - [ ] T018 Push, open PR, and watch CI.
      - Expected files/areas: GitHub PR/checks.
      - Validation note: report concrete success or failure.

## Implementation Notes

- Keep phases as the execution and commit unit unless a phase becomes too large
  to review or revert coherently.
- If a hook/controller file approaches source-structure size limits, extract a
  focused helper instead of compressing code in place.
- Do not make root a broad convenience barrel.
- Do not expose raw transport methods as the host external-send API.

## Validation Evidence

- P001 passed:
  - `bunx vitest run packages/react/test/provider.vitest.tsx test/runtime-export-policy.test.ts packages/react/test/source-structure.vitest.ts`
  - `bun run --cwd packages/react typecheck`
  - `bun run test:api-snapshots`
  - `bun run lint --quiet`
  - `bun run test:package-resolution`
  - `git diff --check`
- P002 passed:
  - `bun run --cwd packages/react typecheck`
  - `bunx vitest run packages/react/test/components.vitest.tsx --testNamePattern "external|public chat controller|public composer controller|first input|failed first|retry|queued follow-up|running composer"`
  - `bunx vitest run packages/react/test/source-structure.vitest.ts packages/react/test/composer-submit-semantics.vitest.ts`
  - `bun run test:api-snapshots`
  - `bun run lint --quiet`
  - `bun run test:package-resolution`
  - `git diff --check`

## Review Evidence

Four parallel subagent lanes were used during planning:
repo guidance, implementation surface, validation, and skill/design review.

P001 four parallel subagent reviews completed:

- Export-map/runtime identity: clarified that P001 guarantees shared provider
  context runtime compatibility across entrypoints, not strict exported function
  object identity; versioned global context keys added.
- React provider/context behavior: new `context-registry.ts` included; built
  package smoke now covers provider, composer queue, and i18n contexts.
- Package-resolution coverage: temp consumer now uses copied package
  directories instead of workspace package symlinks; mixed ESM/CJS context smoke
  added.
- Product-boundary compliance: no host runtime, auth, persistence, process, or
  transport policy moved into React core; root remains preset-only.

P002 four parallel subagent reviews completed:

- Controller semantics: active-thread `turnOptions` forwarding gap fixed;
  first-message, idle send, running queue, waiting-for-input, retry/cancel, and
  canonical reconciliation paths reviewed.
- Composer lifecycle parity: shared draft/error/submitting state reviewed across
  `AgentChat`, standalone composer primitives, composer panels, and external
  controllers.
- Raw-free API shape: snapshot refreshed; external-send result changed to a
  discriminated union; queue-only attachment ownership renamed
  `queuedAttachments`; root remains preset-only.
- Product-boundary compliance: provider-scoped state and lifecycle controller
  keep host workflow/auth/persistence/process/billing/deployment policy outside
  React core; docs now direct hosts away from raw transport sequencing.

## Commit Log

- Pending: planning package commit.

## Final Checklist

- [ ] Artifacts exist under `.agent-work/features/2026-06-28-composable-agent-chat-api/`.
- [ ] Freshness result recorded.
- [ ] Branch decision recorded.
- [ ] Phase-first TODO complete.
- [ ] Goal prompt references absolute artifact paths.
- [ ] Artifact validator passed.
- [ ] Planning package committed.
- [ ] Planning branch pushed or blocker recorded.
