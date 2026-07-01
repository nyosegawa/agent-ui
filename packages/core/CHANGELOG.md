# @nyosegawa/agent-ui-core

## 4.0.0

## 3.1.0

### Patch Changes

- b872ea7: Clarify new-adopter package README import paths, recipe navigation, public package boundary guidance, and Codex success-path test fixture coverage.

## 3.0.0

### Major Changes

- e1f9d66: Redesign Agent UI public contracts around raw-free view models, controller
  composition, and Codex-stable input shapes.

  The core package now keeps reducer store shapes, raw protocol-normalized
  entities, raw selectors, fixtures, and compatibility helpers behind
  `@nyosegawa/agent-ui-core/internal`. The root core entrypoint exposes only the
  stable reusable library surface. Hosts should consume React controllers,
  primitives, or explicit core view models instead of depending on reducer
  internals.

  `AgentImageInput` now uses `{ type: "image", url }`. The old `image_url` shape
  is removed from the React public API.

  `useAgentApprovals()`, `AgentApprovalQueue`, `AgentChat.components.Approval`,
  `AgentThreadTimeline.renderApproval`, and transcript approval anchors now use
  `AgentApprovalRequest` views instead of internal pending server-request payloads.
  File-change approval views include renderable patch data for structured changed
  files.
  Approval decisions are sent with `AgentApprovalDecision` values:
  `accept`, `acceptForSession`, or `decline`.

  Broad server-request handling remains separate on `useAgentServerRequests()`
  with method-specific `respond()` / `reject()` actions.

  Composer sends on idle threads now create optimistic user messages with
  `clientUserMessageId` before `turn/start` resolves, and failed idle sends remain
  visible as failed transcript items while the optimistic turn is completed so the
  composer returns to send mode. First-message retry/cancel runtime state is
  provider-scoped instead of module-global, and failed pending messages expose
  whether they are still retryable after remount.

  `AgentComposerSubmitMode` is now `"send" | "stop"`; queued follow-ups are
  represented by the queued-follow-up controller state and send results, not by a
  submit-button mode.

  The codex package participates in the fixed-version major release so its
  normalizers and request builders target the redesigned core and React public
  contracts.

  The server package root now exposes only the high-level bridge, one-shot RPC,
  local media, policy, dynamic-tool mapping, host-event, and redaction surfaces.
  Raw stdio process helpers (`createCodexAppServerBridge`, child-process spawn
  types, and dynamic-tool helper-thread internals) moved to
  `@nyosegawa/agent-ui-server/advanced`. Bridge admission must be configured via
  `bridgePolicy.admission`; the legacy top-level `admission` option is removed.

  The Web Components wrapper now has deterministic lifecycle semantics:
  SSR/no-DOM registration returns `undefined`, same-tag registration is
  idempotent, foreign tag collisions throw, `agentOptions` is a full replacement
  for the element configuration, `chat-class` is the only observed attribute, and
  changing `transport` or `initialState` remounts the underlying provider.

  Recipes and integration docs now present the redesigned public composition
  boundary as the source of truth: headless examples compose controllers and
  primitives instead of reducer internals, arbitrary files send the absolute saved
  path as explicit text input, and downstream product names are guarded from
  public library documentation.

## 2.0.0

## 1.1.0

### Minor Changes

- Expose the redesigned React package surfaces, refresh the vendored Codex App Server schema, and align the fixed public package set for the next npm release.

  React now publishes explicit `@nyosegawa/agent-ui-react/headless` and `@nyosegawa/agent-ui-react/primitives` entrypoints, updates run policy and composer behavior, and keeps the default package focused on the bundled chat experience. Core state now tracks thread runtime and workspace-message lifecycle details more explicitly, while the Codex package includes the latest generated App Server protocol types and request helpers.

## 1.0.0

### Minor Changes

- 6ee9789: Refresh the vendored Codex App Server schema and clean up compatibility-only
  protocol surfaces. Legacy upstream approval requests now normalize to canonical
  command and file-change approval kinds, preferred request builders expose
  Agent UI-owned path aliases, and deprecated protocol fields remain adapter-only
  fallback intake with current fields taking precedence.

### Patch Changes

- b8276c6: Classify app-scoped MCP startup failures as developer/audit diagnostics, keep
  thread preview hydration and status updates from reordering history rows,
  preserve first-message titles through canonical reconciliation, and move
  tablet-width status/usage/diagnostics into the explicit context sheet.

## 0.5.0

### Minor Changes

- Add host integration contracts for gated workflows, resumable thread startup, and WebSocket bridge lifecycle diagnostics.

  This release exposes typed first-message and thread lifecycle results in React, reports structured bridge diagnostics through core state, expands server-side WebSocket session handling and redaction, and documents the updated host, hook, package export, remote deployment, and server bridge contracts.

## 0.4.1

## 0.4.0

## 0.3.0

### Minor Changes

- 2881f4b: Harden public Agent UI contracts by removing raw protocol payload exposure from core thread, turn, item, app, hook, skill, model, and token-usage state types.

  Codex normalizers now map App Server payload details into structured metadata while keeping unknown protocol fields internal. Public thread status is a closed Agent UI union derived from App Server state, and React local media resolvers now return explicit resource objects instead of string shorthands.

## 0.2.1

### Patch Changes

- 47922d2: Fix npm release packaging so published tarballs include built `dist` artifacts.

  The release publish script now builds the workspace inside the publish job before
  running Changesets publish, and packlist validation checks the npm packlist for
  missing `dist` entries.

## 0.2.0

### Minor Changes

- ca83d35: Establish the current host integration package boundary for Agent UI.

  This release updates the public surface around thread lifecycle state, scoped
  thread collections, host integration components, Codex protocol helper
  subpaths, bridge helpers, and package export maps. Registry-bucket thread
  types are replaced by the current lifecycle and thread-view APIs, React host
  customization uses the component map instead of slots, and Codex normalizers
  move to `@nyosegawa/agent-ui-codex/normalizer` rather than the package root.

  Hosts still own runtime policy including auth, persistence, tenant isolation,
  non-loopback bridge admission, upload/static authorization, process
  supervision, billing, and deployment.

## 0.1.1

### Patch Changes

- Rewrite internal Agent UI workspace dependency ranges before npm publish so registry package manifests can install correctly in consumer projects.

## 0.1.0

### Minor Changes

- 5c53b98: Stabilize the transcript-first Agent UI package set: generated Codex App Server protocol metadata and request builders, normalized core state, React primitives and headless hooks, local WebSocket bridge helpers, upload handling, optional SDK adapters, read-only diff rendering, and the Web Components wrapper.
