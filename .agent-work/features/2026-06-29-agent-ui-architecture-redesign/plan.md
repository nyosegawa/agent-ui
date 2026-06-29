# Plan

## Summary

Create one large breaking Agent UI PR that makes the public library surface
coherent: raw-free user-facing view models/controllers, explicit internal and
advanced protocol boundaries, cleaner React headless/primitives APIs, opaque
server bridge root, deterministic Web Component lifecycle semantics, and
release-grade docs/tests/build gates.

## Background

The review found repeated symptoms of the same architectural issue: internal
reducer/protocol state leaks into the public integration surface. React docs
already point toward raw-free controllers and primitives, but current source
still exposes raw core state, pending server request payloads, transcript block
payloads, and server child-process details. Downstream usage confirms the
library needs stronger generic primitives, not app-specific workflow APIs.

## Current State

- `packages/core/src/index.ts` exports internal state/reducer/selectors broadly.
- `packages/core/src/state/item.ts` and
  `packages/core/src/state/server-requests.ts` expose `unknown` payloads through
  public state.
- `packages/react/src/hooks/transcript.ts` builds public transcript entries
  from `ThreadState` and preserves broad block payload fields.
- `packages/react/src/agent-input.ts` uses `image_url`, while Codex stable v2
  input uses `url`.
- `packages/react/src/hooks/first-message-operations.ts` stores retry/cancel
  state in module globals.
- `packages/server/src/index.ts` exposes bridge process internals via
  `packages/server/src/bridge.ts`.
- `packages/web-components/src/index.tsx` exposes `AgentSessionState`, has
  ambiguous option reset semantics, and weak tag collision handling.
- `examples/recipes/src/headless-hooks.tsx` teaches raw reducer traversal.
- Root `build` couples package and example builds.

## Goals

- Make public React/headless/primitives APIs consume raw-free view models and
  controller methods.
- Move raw reducer/protocol details behind explicit internal or advanced
  package boundaries.
- Align React input shapes with Codex stable request builders.
- Make composer/first-message lifecycle provider-scoped and testable.
- Make server root high-level and opaque without absorbing host runtime policy.
- Define Web Component lifecycle, registration, and option semantics.
- Split build scripts without weakening ordered package validation.
- Update docs, examples, API snapshots, package-resolution smoke, changelogs,
  and changesets as part of the same PR.
- Add a PR evidence matrix proving public surface, docs, examples, tests, and
  release impact are aligned.

## Non-Goals

- No hosted service behavior.
- No host auth, billing, tenant/session isolation, credential storage, audit
  retention, upload storage, process supervision, or deployment policy.
- No product-specific workflow APIs or downstream app names in docs.
- No default experimental protocol workflows.
- No public `/testing` subpath in this PR.
- No direct edits under `third_party/codex`.
- No hand edits to generated schema or compiled output.
- No compatibility shims for unshipped branch behavior.

## Repo-Specific Constraints

- Agent UI is a reusable Codex App Server UI library.
- Bun is the package runner.
- Public API changes require docs, examples, tests, API snapshots or package
  resolution, and release impact.
- Protocol behavior must be checked against `third_party/codex/codex-rs/app-server`
  when classification is unclear.
- `bun run validate:packages` must preserve fresh build, packlist, Node
  compatibility, `publint`, and `attw` ordering.
- Browser-visible changes need Playwright evidence.

## Design Decisions

1. **Raw boundary definition**
   Public user/controller/view-model surfaces are raw-free. Raw data remains
   valid only at transport, Codex adapter/protocol, diagnostics/audit, and
   server host-policy boundaries.

2. **Core split**
   Core keeps reducer state internally, but exports stable public view models,
   selectors, transport contracts, ids, and action/controller planning helpers.
   Raw state moves out of root or becomes advanced/internal.

3. **React split**
   `/headless` returns view models and controller methods. `/primitives` renders
   view models. Root remains the drop-in preset.

4. **Approvals**
   Public approvals expose `AgentApprovalView` and action methods. Raw
   `PendingServerRequest.payload` is not a primitive rendering contract.

5. **Input shape**
   React image input aligns on `url`. A narrow normalization bridge may accept
   legacy `image_url` only if explicitly tested and documented as migration
   behavior.

6. **Server root**
   Root keeps high-level bridge, policy, upload/media, redaction, and framework
   helpers. Raw child-process details leave the root public contract.

7. **Web Components**
   Web Components remain a thin wrapper. They get explicit SSR, registration,
   collision, reset, and remount semantics after React contracts are settled.

8. **Build gates**
   Add package/example build separation only if package validation still proves
   fresh package output before export checks.

## Impacted Areas

- Agent UI-owned:
  - `packages/core/src/**`
  - `packages/react/src/**`
  - `packages/codex/src/request-builders.ts`
  - `packages/server/src/**`
  - `packages/web-components/src/**`
  - package export maps and API snapshots
- Host-owned:
  - auth, admission beyond default helpers, workspace validation, upload
    storage, persistence, process supervision, audit sinks, deployment.
- Protected:
  - `third_party/codex/**`
  - `packages/codex/src/generated/**`
  - compiled `dist` / `.next` output
- Example-only:
  - `examples/recipes/**`
  - `examples/local-react-vite/**`
  - `examples/codex-local-web/**`
  - touched Next examples
- Docs-only:
  - docs that explain boundary and migration without shipped behavior changes.
- Release-sensitive:
  - package export maps
  - public declarations/API snapshots
  - package README/changelog
  - Changesets
  - release target checks

## Validation Plan

Baseline and closeout:

```sh
bun run validate:fast
bun run validate:protocol
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
bun run validate:release
bun run validate:e2e
```

Focused gates:

- React headless/primitives/controller changes:
  `bun run test` plus targeted `packages/react/test/*` and
  `bun run test:e2e:fixtures`.
- Server bridge changes:
  targeted `packages/server/test/*`, `bun run validate:packages`,
  `bun run test:package-resolution`, and `bun run test:e2e:real-local`.
- Protocol/input-shape changes:
  `bun run validate:protocol`, type tests, API snapshots, package resolution.
- Recipes:
  `bun run --cwd examples/recipes typecheck`.
- Example builds when touched:
  `bun run --cwd examples/local-react-vite typecheck && bun run --cwd examples/local-react-vite build`,
  `bun run --cwd examples/codex-local-web typecheck && bun run --cwd examples/codex-local-web build`,
  and touched Next example typecheck/build.
- Skill/doc guard changes:
  `bun run test:repo-skills` and/or `bun run test:skills`.

## Commit, PR, And CI Plan

- Continue on branch `codex/agent-ui-architecture-redesign-plan`.
- Commit this planning package first.
- Implement by phase, with one coherent commit per phase unless the phase is
  explicitly split before implementation.
- Push phase commits to the same branch.
- Open one giant PR after implementation phases are ready.
- PR body must include:
  - summary
  - public surface evidence matrix
  - test plan
  - release impact
  - docs impact
  - protocol/upstream impact
  - security/boundary impact
  - browser evidence
- Follow GitHub Actions to concrete success or failure before calling ready.

## Risks

- Public root cleanup can be too broad and break valid advanced integrations.
- Raw-free view models can become insufficient if they hide necessary display
  state; use explicit bounded fields instead of generic payloads.
- Web Component prop expansion can freeze unstable React internals.
- Build split can accidentally validate stale package output.
- Docs can leak downstream app concepts if examples are copied too literally.
- The PR can become too large to review if phase commits are not kept coherent.

## Completion Criteria

- Public React/headless/primitives APIs no longer expose raw reducer/protocol
  payloads for normal host composition.
- Raw/internal state boundaries are documented and tested.
- Image input shape is aligned with Codex request builders.
- Composer lifecycle is provider-scoped and covered by multi-provider/remount
  tests.
- Server root no longer exposes raw child-process internals as the primary
  contract.
- Web Component lifecycle and options are deterministic and tested.
- Recipes and docs teach controllers/view models/primitives, not raw store
  traversal.
- Package exports, API snapshots, package resolution, docs, examples, and
  changesets agree.
- `bun run validate:release` and `bun run validate:e2e` pass.
- PR CI completes green.

## Open Questions

- Exact internal/advanced subpath names for raw core/server surfaces.
- Whether React should accept legacy `image_url` during one breaking release or
  remove it directly.
- Whether Web Components should expose a narrow `chatProps` subset or remain
  minimal.
- Whether upstream protocol drift requires a separate upstream-sync PR before
  or during implementation.
