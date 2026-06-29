# TODO

## Status Summary

Planning package for a large breaking Agent UI architecture redesign.
Implementation has started. Execute phases on the same branch and keep each
phase reviewable, validated, committed, pushed, and recorded.

This is not an MVP plan. The implementation is complete only when every phase
is done or superseded by an equal-or-stronger design that satisfies the same
requirements with evidence.

Backward compatibility is not a design goal. Remove legacy public shapes,
aliases, duplicated docs, and compatibility shims when they conflict with the
clean redesigned API. Migration help belongs in rewritten docs and examples.

## Branch And Planning Commit

- Branch: `codex/agent-ui-architecture-redesign-plan`
- Planning commit: committed; final hash reported in final response because embedding
  a commit's own final hash is self-referential.
- Remote: `origin`
- Push result: pushed to `origin/codex/agent-ui-architecture-redesign-plan`
  after artifact validation.
- Blockers: none known

## Phase Checklist

- [x] Protocol, raw-boundary, and public-surface contract
- [x] Core view models, controllers, and internal state split
- [x] React input, transcript, approval, and controller cleanup
- [x] Composer and first-message lifecycle hardening
- [ ] Server bridge root and host-policy boundary cleanup
- [ ] Web Components lifecycle and option semantics
- [ ] Build/package/release gate hardening
- [ ] Examples, recipes, docs, migration, and changelog refresh
- [ ] Browser, package, downstream-smoke evidence and PR closeout

## Task Checklist By Phase

- [x] P001 Protocol, raw-boundary, and public-surface contract
  - Goal: define the precise raw-free contract before moving code.
  - Scope: docs, structural tests, package-export policy, diagnostics boundary.
  - Expected files/areas:
    - `docs/architecture/protocol-drift.md`
    - `docs/architecture/product-boundary.md`
    - `docs/reference/package-exports.md`
    - source-structure/API policy tests
  - Validation: `bun run validate:protocol`, focused structural tests.
  - Review: run 4 parallel subagent reviews before commit, covering boundary correctness, public API leaks, protocol/diagnostics classification, and docs/test alignment. Verify raw is allowed only at transport/codex/diagnostics/server-policy boundaries.
  - Commit: one phase commit.
  - Push: push after validation.
  - PR/CI: record protocol/docs impact.
  - Evidence:
    - Implementation: added a raw-boundary policy to protocol drift docs,
      clarified product and package-export boundaries, and tightened React
      source-structure tests so core/root/headless/primitives declaration
      raw-debt findings are fixed to explicit allowlists instead of loose
      counts. Root React declarations are asserted raw-debt-free.
    - Validation: `bunx vitest run packages/react/test/source-structure.vitest.ts`
      passed with 25 tests; `bun run validate:protocol` passed with 12 Codex
      protocol test files / 98 tests plus 82 core fixture tests.
    - Review: ran 4 parallel phase-review subagents. Resolved P1/P2 findings by
      moving `AgentItemBlock`/`AgentTranscriptBlockView` out of keep-public docs,
      narrowing experimental generated type wording, correcting diagnostics
      redaction wording to developer/audit raw diagnostics, adding React root
      snapshot coverage, and replacing count-based raw-debt guards with
      declaration-specific findings.
    - Commit: P001 phase commit contains this evidence; final hash is reported
      outside this file because embedding a commit's own final hash is
      self-referential.
    - Push: push after P001 phase commit.
  - Tasks:
    - [x] T001 Write raw-boundary decision record.
      - Expected files/areas: architecture and package-export docs.
      - Validation note: docs plus structural policy tests.
    - [x] T002 Add or tighten public raw-leak guards.
      - Expected files/areas: `packages/react/test`, core/source-structure tests.
      - Validation note: focused unit tests plus API snapshots.
    - [x] T003 Classify diagnostics as advanced/audience-filtered.
      - Expected files/areas: core diagnostics docs/tests.
      - Validation note: reducer/diagnostic tests.
    - [x] T004 Run 4 parallel phase-review subagents and resolve P0/P1 findings.
      - Expected files/areas: phase diff, docs, tests, API snapshots if changed.
      - Validation note: record subagent findings and remediation in Evidence.

- [x] P002 Core view models, controllers, and internal state split
  - Goal: stop making raw normalized store the normal public integration API.
  - Scope: core state exports, view models, selectors, controller planning helpers.
  - Expected files/areas:
    - `packages/core/src/**`
    - `packages/core/test/**`
    - `test/api-snapshots/*core*`
    - `docs/reference/package-exports.md`
  - Validation: `bun run validate:protocol`, `bun run test:api-snapshots`.
  - Review: run 4 parallel subagent reviews before commit, covering core API shape, reducer/internal boundary, React consumption path, and package/export impact. Confirm React can consume raw-free views without importing internal state.
  - Commit: one phase commit unless export-map migration needs split.
  - Push: push after validation.
  - PR/CI: package/API impact.
  - Evidence: - Implementation: added core public state/reducer/selector wrappers with
    opaque `AgentSessionState`; moved raw reducer state, raw selectors, and
    fixtures to `@nyosegawa/agent-ui-core/internal`; added package export,
    path alias, package-resolution, runtime-export-policy, and tsup support
    for the implementation boundary; rebuilt transcript block views as
    display-oriented view models with `argumentsText`, `resultText`,
    `errorText`, and `files` instead of raw `arguments`, `result`, `error`,
    `changes`, and `metadata`; updated React provider internals so public
    provider props use the opaque root state while implementation code reads
    internal state; updated server, web-components, examples, recipes, and
    docs to match the new boundary. - Validation: `bun run --workspaces --if-present typecheck` passed;
    `bun run validate:protocol` passed; `bun run test:package-resolution`
    passed; `bun run test:api-snapshots:update && bun run test:api-snapshots`
    passed; `bunx vitest run packages/core/test/public-surface.test.ts
packages/react/test/source-structure.vitest.ts packages/react/test/components.vitest.tsx`
    passed; `bun run validate:fast` passed with the existing
    `packages/react/src/hooks/composer.ts` React-hook warnings; `bun run
validate:packages` passed with existing publint repository-url
    suggestions. - Review: ran 4 parallel phase-review subagents. Resolved P1 findings for
    missing `/internal` aliases, public provider `initialState` leaking raw
    state, stale server/web-components snapshots, package-resolution
    canonical export mismatch, and runtime export policy drift. Resolved P2
    findings by removing public `selectThreadLifecycle`, replacing raw
    transcript block fields with display view fields, avoiding internal
    imports in public recipes, strengthening core root public-surface tests,
    and adding an explicit source-level allowlist for remaining root
    `AgentItemState`/`AgentItemMetadata` raw debt. - Commit: `a281a7b` (`Split core public state boundary`). - Push: pushed to `origin/codex/agent-ui-architecture-redesign-plan`.
  - Tasks:
    - [x] T001 Introduce core transcript/thread/approval/usage view models.
      - Expected files/areas: `packages/core/src`.
      - Validation note: core unit and fixture tests.
    - [x] T002 Move raw reducer/store exports out of root or behind advanced/internal boundary.
      - Expected files/areas: core entrypoints and package exports.
      - Validation note: API snapshots and package resolution.
    - [x] T003 Replace raw approval payload public views with canonical approval views.
      - Expected files/areas: core server-request selectors/tests.
      - Validation note: reducer tests for approval lifecycle.
    - [x] T004 Run 4 parallel phase-review subagents and resolve P0/P1 findings.
      - Expected files/areas: phase diff, docs, tests, API snapshots.
      - Validation note: record subagent findings and remediation in Evidence.

- [x] P003 React input, transcript, approval, and controller cleanup
  - Goal: make React headless/primitives consume and expose raw-free controller contracts.
  - Scope: React input types, transcript controller, approval hooks/primitives, recipes.
  - Expected files/areas:
    - `packages/react/src/agent-input.ts`
    - `packages/react/src/hooks/turn-input.ts`
    - `packages/react/src/hooks/transcript.ts`
    - `packages/react/src/hooks/approvals.ts`
    - `packages/react/src/components/**`
    - `packages/react/test/**`
  - Validation: `bun run validate:fast`, `bun run test:api-snapshots`,
    `bun run test:e2e:fixtures`.
  - Review: run 4 parallel subagent reviews before commit, covering input migration, transcript raw-free contract, approvals UX/API, and browser-visible behavior. Confirm no `PendingServerRequest.payload` or broad block payload in normal public UI.
  - Commit: one phase commit.
  - Push: push after validation.
  - PR/CI: React API and browser-visible impact.
  - Evidence: - Implementation: aligned `AgentImageInput` with Codex stable
    `{ type: "image", url }` input and rejected stale `image_url`; introduced
    React `AgentApprovalRequest`, `AgentApprovalDecision`, and structured
    `AgentApprovalPatch` view types; moved public approval hooks,
    `AgentApprovalQueue`, `AgentChat.components.Approval`,
    `AgentThreadTimeline.renderApproval`, transcript approval anchors, recipes,
    closeups, and component tests off `PendingServerRequest`/`payload` and onto
    raw-free approval views; changed `useAgentApprovals().approve()` to accept
    only `accept`, `acceptForSession`, or `decline`; kept broader
    server-request handling on neutral `useAgentServerRequests().respond()` /
    `.reject()`; preserved internal legacy decision mapping for old upstream
    approval request metadata; projected structured file-change `fileChanges`
    into renderable patch views so approval cards show changed files before
    decisions; updated docs, API snapshots, source-structure raw-debt
    allowlists, examples, and a major Changeset for the breaking React API. - Validation: `bun run --workspaces --if-present typecheck` passed;
    `bunx vitest run packages/react/test/source-structure.vitest.ts
packages/react/test/turn-input.vitest.ts
packages/react/test/components.vitest.tsx` passed with 236 tests;
    `bun --filter @nyosegawa/agent-ui-react build && bun run
test:api-snapshots:update && bun run test:api-snapshots` passed; `bun run
validate:fast` passed with the existing
    `packages/react/src/hooks/composer.ts` React-hook warnings; `bun run
test:package-resolution` passed; `bun run validate:packages` passed with
    existing publint repository-url suggestions; `bun run test:e2e:fixtures`
    passed with 231 passed / 1 skipped; `bunx changeset status --verbose`
    reported a fixed public package major bump to 3.0.0. - Review: ran 4 parallel phase-review subagents for input/API snapshots,
    approval API, transcript/controller anchoring, and examples/docs/browser
    risk. Three found no P0/P1 issues. Resolved one P1 by converting
    structured App Server file-change approval payloads into renderable
    approval patch views and adding a component test that asserts changed
    files are visible before approval actions. - Commit: P003 phase commit (`Clean React approval public contracts`). - Push: pushed to `origin/codex/agent-ui-architecture-redesign-plan`.
    Push evidence was recorded in a follow-up evidence-only commit because the
    repository hook blocks force-pushing an amended phase commit after the
    first successful push.
  - Tasks:
    - [x] T001 Align `AgentImageInput` with Codex `url`.
      - Expected files/areas: React input and turn normalization tests.
      - Validation note: test `normalizeTurnInput(imageInput(...))`.
    - [x] T002 Rebuild transcript entries from core view models.
      - Expected files/areas: transcript hook, timeline/primitives.
      - Validation note: component tests and fixture e2e.
    - [x] T003 Replace public approval payload APIs with approval views/controllers.
      - Expected files/areas: hooks, primitives, docs, tests.
      - Validation note: approval lifecycle tests.
    - [x] T004 Run 4 parallel phase-review subagents and resolve P0/P1 findings.
      - Expected files/areas: phase diff, React tests, fixture e2e notes, docs.
      - Validation note: record subagent findings and remediation in Evidence.

- [x] P004 Composer and first-message lifecycle hardening
  - Goal: make submit/retry/cancel/external send deterministic and provider-scoped.
  - Scope: first-message operations, composer controller, external send,
    optimistic user item reconciliation.
  - Expected files/areas:
    - `packages/react/src/hooks/first-message-operations.ts`
    - `packages/react/src/hooks/composer*.ts`
    - `packages/react/src/composer-state.tsx`
    - `packages/react/test/**`
    - fixture e2e route/tests
  - Validation: targeted React tests, `bun run test:e2e:fixtures`.
  - Review: run 4 parallel subagent reviews before commit, covering provider scoping, retry/cancel races, external send optimism, and composer public contract. Include two providers, remount, cancelled late retry, failed start paths.
  - Commit: one phase commit.
  - Push: push after validation.
  - PR/CI: browser-visible and public controller impact.
  - Evidence: - Implementation: moved first-message retry payloads, cancellation markers,
    and retry-in-flight guards into provider-scoped runtime state using the
    shared React context registry; made retry/cancel idempotent and
    cancellation-aware; added `retryable` to failed pending message views so
    remounted failed operations remain dismissible without offering broken
    Retry actions; changed idle-thread composer and external sends to create
    optimistic user messages with `clientUserMessageId` before `turn/start`
    resolves; completed optimistic turns on failed sends so composer state
    returns to send mode; removed `"queue"` from `AgentComposerSubmitMode`. - Validation: `bun run typecheck` passed; `bun run lint` passed with the
    existing composer hook warnings; `bunx vitest run
packages/react/test/components.vitest.tsx
packages/react/test/source-structure.vitest.ts` passed with 238 tests;
    `bun run test:api-snapshots` passed; `bun run
test:package-resolution` passed; `bun run test:node-compat` passed; `bun
run test:packlist` passed; `bun run test:e2e:fixtures` passed with 231
    passed / 1 skipped. - Review: ran 4 parallel phase-review subagents. Resolved P1 findings by
    completing optimistic turns on failed idle sends, making failed
    first-message operations non-retryable after provider remount when their
    runtime payload is gone, making double retry and cancel-late-failure
    races no-op/cancellation-aware instead of unhandled promise rejections,
    and switching the first-message runtime context to `sharedReactContext`
    so mixed ESM/CJS entrypoints share the provider. - Commit: P004 phase commit contains this evidence; final hash is reported
    outside this file because embedding a commit's own final hash is
    self-referential. - Push: push after P004 phase commit.
  - Tasks:
    - [x] T001 Remove or scope module-global first-message maps/sets.
      - Expected files/areas: first-message operations/provider state.
      - Validation note: multi-provider and remount tests.
    - [x] T002 Give existing idle-thread sends optimistic transcript behavior.
      - Expected files/areas: composer turn-start/controller tests.
      - Validation note: reconciliation tests for `clientUserMessageId`.
    - [x] T003 Resolve `AgentComposerSubmitMode` `"queue"` contract.
      - Expected files/areas: composer types/docs/tests.
      - Validation note: implement or remove consistently.
    - [x] T004 Run 4 parallel phase-review subagents and resolve P0/P1 findings.
      - Expected files/areas: phase diff, lifecycle tests, browser fixture evidence.
      - Validation note: record subagent findings and remediation in Evidence.

- [x] P005 Server bridge root and host-policy boundary cleanup
  - Goal: keep server root high-level while preserving host-owned policy hooks.
  - Scope: server root exports, bridge process internals, method policy tests,
    server docs.
  - Expected files/areas:
    - `packages/server/src/index.ts`
    - `packages/server/src/bridge.ts`
    - `packages/server/src/websocket.ts`
    - `packages/server/test/**`
    - `docs/reference/server-bridge.md`
  - Validation: server tests, `bun run validate:packages`,
    `bun run test:package-resolution`, `bun run test:e2e:real-local`.
  - Review: run 4 parallel subagent reviews before commit, covering bridge security, root export boundary, method policy, and host-owned runtime separation. Confirm no host auth/workspace/process supervision moved into Agent UI.
  - Commit: one phase commit, split if package exports and bridge policy diverge.
  - Push: push after validation.
  - PR/CI: security/boundary impact.
  - Evidence:
    - Implementation: split `@nyosegawa/agent-ui-server` into a high-level root
      export surface and `@nyosegawa/agent-ui-server/advanced` for raw stdio
      process helpers; removed root `admission`, raw `command`/`args`/`spawn`,
      child-process, and helper-thread exports from the primary contract.
      Root WebSocket/Next/Express helpers now construct sanitized App Server
      options and reject unsupported raw root keys before spawning. Browser
      method classification remains capability-based and covered by server
      tests. Docs, package exports, API snapshots, changeset, recipes, and
      real-local fake Codex setup were rewritten around the root/advanced
      boundary.
    - Validation: `bunx vitest run packages/server/test --config
      vitest.config.ts` (124 passed); `bun run typecheck` (all workspaces);
      `bun run lint` (0 errors, existing React hook warnings only);
      `bun run test:api-snapshots`; `bun run validate:packages`; `bun run
      test:package-resolution`; `bun run test:e2e:real-local` (20 passed).
      Note: one concurrent `validate:packages` attempt failed because it raced
      another build from `test:package-resolution` and hit a Next build lock;
      the same gate passed when rerun alone.
    - Review: 4 parallel subagent reviews completed. Bridge security review
      found P1 silent fail-open for legacy top-level `admission`; fixed by
      rejecting unsupported root keys before spawn and adding a regression
      test. Host-boundary review found P1 raw process override compatibility in
      root helpers and stale API-key recipe; fixed by sanitized root bridge
      options, source-only internal test seam, removing example command/args
      root overrides, PATH-based fake Codex e2e shim, and rewriting the recipe
      around `bridgePolicy.admission` / `resolveBridgeOptions`. Root export
      boundary and browser method policy reviews found no P0/P1 after the
      boundary changes.
    - Commit: phase commit `Clean server bridge public boundary`.
    - Push: pushed `4af3653` to
      `origin/codex/agent-ui-architecture-redesign-plan`.
  - Tasks:
    - [x] T001 Freeze browser method classification and policy tests.
      - Expected files/areas: server/codex policy tests.
      - Validation note: focused server tests.
    - [x] T002 Remove raw child-process details from root primary contract.
      - Expected files/areas: server entrypoints, API snapshots.
      - Validation note: package/API gates.
    - [x] T003 Update server docs to distinguish root, advanced, and host-owned policy.
      - Expected files/areas: server bridge docs/package exports.
      - Validation note: docs review and package snapshots.
    - [x] T004 Run 4 parallel phase-review subagents and resolve P0/P1 findings.
      - Expected files/areas: phase diff, server tests, docs, API snapshots.
      - Validation note: record subagent findings and remediation in Evidence.

- [x] P006 Web Components lifecycle and option semantics
  - Goal: make custom element behavior deterministic and aligned with final React contract.
  - Scope: registration, SSR, collision handling, option reset, transport replace,
    initial state/hydration semantics.
  - Expected files/areas:
    - `packages/web-components/src/index.tsx`
    - `packages/web-components/test/**`
    - `docs/guides/web-components.md`
    - `docs/reference/package-exports.md`
  - Validation: web-component tests, API snapshots, package resolution,
    fixture e2e if visible behavior changes.
  - Review: run 4 parallel subagent reviews before commit, covering SSR/custom-element lifecycle, option semantics, React contract alignment, and package/docs impact. Confirm wrapper stays thin; no transport creation or host runtime ownership.
  - Commit: one phase commit.
  - Push: push after validation.
  - PR/CI: web-components package impact.
  - Evidence:
    - Implementation: `defineAgentChatElement()` is now no-DOM safe, same-tag
      idempotent, foreign-collision rejecting, and multi-tag capable via
      per-tag subclasses. `AgentChatElement` observes only `chat-class`, treats
      `agentOptions` as a full replacement, and remounts `AgentProvider` when
      `transport` or opaque `initialState` changes. Web-component docs,
      README, package export docs, API snapshot, and changeset were updated.
    - Validation: `bunx vitest run packages/web-components/test --config
      vitest.config.ts`; `bun run typecheck`; `bun run lint` (0 errors, existing
      React hook warnings only); `bun run test:api-snapshots`; `bun run
      validate:packages`; `bun run test:package-resolution` (rerun alone after
      an intentional parallel Next build lock collision).
    - Review: 4 parallel subagent reviews completed. SSR/lifecycle: no P0/P1.
      Option semantics: no P0/P1; accepted P2 test hardening for omitted
      `agentOptions` fields and new transport reflection. React contract/product
      boundary: no P0/P1. Package/docs: fixed P1 stale API snapshot and accepted
      P2 docs wording cleanup.
    - Commit: `8f51658` (`Harden web component lifecycle semantics`).
    - Push: pushed `codex/agent-ui-architecture-redesign-plan` to origin
      (`ea555ac..8f51658`).
  - Tasks:
    - [x] T001 Define SSR and tag-collision behavior.
      - Expected files/areas: web-components source/tests.
      - Validation note: no-DOM import and foreign tag tests.
    - [x] T002 Define `initialState` replacement or raw-free hydration contract.
      - Expected files/areas: web-components and React provider docs/types.
      - Validation note: remount/reset tests.
    - [x] T003 Fix `agentOptions` and `chat-class` reset semantics.
      - Expected files/areas: web-components tests/docs.
      - Validation note: property/attribute tests.
    - [x] T004 Run 4 parallel phase-review subagents and resolve P0/P1 findings.
      - Expected files/areas: phase diff, web-component tests, package docs.
      - Validation note: record subagent findings and remediation in Evidence.

- [x] P007 Build/package/release gate hardening
  - Goal: make package validation reliable for the redesigned public surface.
  - Scope: build scripts, release target checks, CI/docs policy tests.
  - Expected files/areas:
    - `package.json`
    - `scripts/**`
    - `.github/workflows/**`
    - `docs/architecture/testing.md`
    - `docs/maintenance/ci-cd.md`
    - release-readiness tests
  - Validation: `bun run validate:packages`, `bun run validate:release`,
    workflow/policy tests.
  - Review: run 4 parallel subagent reviews before commit, covering package build ordering, CI policy, release target behavior, and stale-output prevention. Confirm package checks cannot pass on stale output.
  - Commit: one phase commit.
  - Push: push after validation.
  - PR/CI: CI/build/release impact.
  - Evidence:
    - Implementation: split root build into `build:packages` and
      `build:examples` via `scripts/build-workspaces.mjs`; moved
      `validate:packages`, API snapshots, package resolution, and compatibility
      package checks onto fresh package-only builds; added release-target
      hard-fail for divergent public package versions; added CI `Real local
      smoke` path filtering for local-bridge-sensitive changes; updated
      package/release/CI docs and policy tests; removed dead internal React
      exports flagged by release validation.
    - Validation: `bunx vitest run test/package-scripts-docs.test.ts
      test/ci-workflow-policy.test.ts test/e2e-workflow-gate.test.ts
      test/api-snapshot-lib.test.ts test/release-targets.test.ts`; `bun run
      typecheck`; `bun run lint` (0 errors, existing React hook warnings only);
      `bun run validate:packages`; `bun run test:api-snapshots`; `bun run
      test:package-resolution`; `bun run build:examples`; `bun run
      validate:release`.
    - Review: 4 parallel subagent reviews completed. Package build ordering:
      no P0/P1. CI policy: no P0/P1. Release target behavior: no P0/P1; accepted
      release-docs supplement for divergent public package versions. Docs/tests
      coherence and stale-output prevention: no P0/P1.
    - Commit: `4fd3366` (`Harden package validation gates`).
    - Push: pushed `codex/agent-ui-architecture-redesign-plan` to origin
      (`625f501..4fd3366`).
  - Tasks:
    - [x] T001 Split package and example builds without weakening package validation.
      - Expected files/areas: root scripts/docs/tests.
      - Validation note: package validation and package-script docs tests.
    - [x] T002 Hard-fail divergent fixed package versions in release target checks.
      - Expected files/areas: release scripts/tests.
      - Validation note: npm release readiness tests.
    - [x] T003 Add/adjust CI gates for real-local-sensitive changes.
      - Expected files/areas: workflows/docs/tests.
      - Validation note: workflow policy tests.
    - [x] T004 Run 4 parallel phase-review subagents and resolve P0/P1 findings.
      - Expected files/areas: phase diff, scripts, workflow docs/tests.
      - Validation note: record subagent findings and remediation in Evidence.

- [ ] P008 Examples, recipes, docs, migration, and changelog refresh
  - Goal: make docs and examples the migration source of truth, rewriting
    affected pages around the new architecture instead of patching stale text.
  - Scope: README/docs/package READMEs/changelogs/recipes/changesets. This may
    include large rewrites of guides/reference pages whose current structure no
    longer matches the final API.
  - Expected files/areas:
    - `README.md`
    - `docs/**`
    - `packages/*/README.md`
    - `packages/*/CHANGELOG.md`
    - `.changeset/**`
    - `examples/recipes/**`
  - Validation: `bun run --cwd examples/recipes typecheck`,
    docs/skill/staleness tests, API snapshots as needed.
  - Review: run 4 parallel subagent reviews before commit, covering docs currentness, whole-page coherence, migration coherence, example correctness, and downstream-name leakage. Confirm no downstream app-specific names, product workflows, stale old/new duplicated API stories, or compatibility-shim guidance.
  - Commit: one phase commit, split if docs exceed reviewable size.
  - Push: push after validation.
  - PR/CI: docs/release impact.
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T001 Replace raw-state headless recipe with controller/primitives usage.
      - Expected files/areas: `examples/recipes/src/headless-hooks.tsx`.
      - Validation note: recipe typecheck.
    - [ ] T002 Fix attachment recipe to use real path for non-image App Server input.
      - Expected files/areas: `examples/recipes/src/agent-chat-composition.tsx`.
      - Validation note: recipe typecheck.
    - [ ] T003 Rewrite affected migration docs, package exports, package READMEs, changelogs, changeset.
      - Expected files/areas: docs and package metadata.
      - Validation note: docs review plus package/API gates; reject scattered partial edits when a page needs restructuring.
    - [ ] T004 Add downstream-name leakage guard.
      - Expected files/areas: docs staleness or repository policy tests.
      - Validation note: focused docs/staleness test.
    - [ ] T005 Run 4 parallel phase-review subagents and resolve P0/P1 findings.
      - Expected files/areas: phase diff, docs, recipes, changelog/changeset.
      - Validation note: record subagent findings and remediation in Evidence.

- [ ] P009 Browser, package, downstream-smoke evidence and PR closeout
  - Goal: prove the giant PR is ready as one coherent release-sized change.
  - Scope: final validation, browser QA, downstream smoke, PR evidence matrix,
    CI follow-through.
  - Expected files/areas:
    - PR body
    - validation logs
    - package/API snapshots
    - browser screenshots or audit notes where useful
  - Validation: `bun run validate:release`, `bun run validate:e2e`,
    downstream build/test smoke where public surfaces changed.
  - Review: run 4 parallel final-review subagents before PR-ready claim, covering release readiness, browser QA, docs/currentness, and architecture boundary leaks. Require no unresolved P0/P1.
  - Commit: final evidence/docs commit if needed.
  - Push: push final branch.
  - PR/CI: open/update PR and follow required checks to success/failure.
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T001 Run full release/e2e closeout.
      - Expected files/areas: command evidence.
      - Validation note: `validate:release && validate:e2e`.
    - [ ] T002 Run downstream smoke without copying downstream concepts into docs.
      - Expected files/areas: external smoke notes only.
      - Validation note: record commands/results in PR notes.
    - [ ] T003 Create PR evidence matrix.
      - Expected files/areas: PR body.
      - Validation note: public surface -> docs -> tests -> examples -> changeset.
    - [ ] T004 Watch CI to concrete result.
      - Expected files/areas: GitHub Actions evidence.
      - Validation note: required checks green or exact failures recorded.
    - [ ] T005 Run 4 parallel final-review subagents and resolve P0/P1 findings.
      - Expected files/areas: full PR diff, PR evidence matrix, CI/browser/package evidence.
      - Validation note: record subagent findings and remediation in Evidence.

## Implementation Notes

- Keep implementation phase-first. Split a phase before coding if it mixes
  incompatible validation or cannot be reviewed as one unit.
- Do not narrow the work to an MVP, demo path, compatibility shim, or easiest
  passing subset. Scope reduction is allowed only when replaced by a stronger
  design that satisfies the same requirement and is recorded in Evidence.
- Do not preserve backward compatibility for its own sake. Remove old API
  shapes, docs, examples, and aliases when the new design supersedes them.
- Each implementation phase must run 4 parallel subagent reviews before its
  phase commit. Use distinct prompts for architecture/boundary, implementation
  correctness, validation coverage, and docs/release impact. Record findings,
  accepted risks, and remediations in the phase Evidence block.
- Use task-level execution only as a fallback and record why.
- Keep docs generic. Do not mention downstream apps or trial implementations.
- Do not add `/testing` subpaths in this PR.
- Do not hand-edit generated schema or compiled output.

## Validation Evidence

- Planning artifact validation:
  `node .agents/skills/agent-ui-feature-planning/scripts/validate-artifacts.mjs .agent-work/features/2026-06-29-agent-ui-architecture-redesign`
  passed.
- Implementation validation: pending.

## Review Evidence

- Previous same-session architecture review: 15 rounds / 60 subagents.
- Planning review lanes: four parallel subagents.
- Final implementation review: pending.

## Commit Log

- Planning commit: `56226daa25176ebc60e8f8859384b09f7b16905a`

## Final Checklist

- [ ] All phases complete or explicitly deferred.
- [ ] No unresolved P0/P1 findings.
- [ ] Product boundary intact.
- [ ] Public API changes documented, snapshotted, and package-resolution tested.
- [ ] Docs and examples current.
- [ ] Changeset/changelog accurate.
- [ ] `bun run validate:release` passed.
- [ ] `bun run validate:e2e` passed.
- [ ] PR opened/updated.
- [ ] CI followed to concrete success or failure.
