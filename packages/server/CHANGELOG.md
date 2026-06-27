# @nyosegawa/agent-ui-server

## 1.1.0

### Minor Changes

- Expose the redesigned React package surfaces, refresh the vendored Codex App Server schema, and align the fixed public package set for the next npm release.

  React now publishes explicit `@nyosegawa/agent-ui-react/headless` and `@nyosegawa/agent-ui-react/primitives` entrypoints, updates run policy and composer behavior, and keeps the default package focused on the bundled chat experience. Core state now tracks thread runtime and workspace-message lifecycle details more explicitly, while the Codex package includes the latest generated App Server protocol types and request helpers.

### Patch Changes

- Updated dependencies
  - @nyosegawa/agent-ui-core@1.1.0
  - @nyosegawa/agent-ui-codex@1.1.0

## 1.0.0

### Minor Changes

- 6ee9789: Refresh the vendored Codex App Server schema and clean up compatibility-only
  protocol surfaces. Legacy upstream approval requests now normalize to canonical
  command and file-change approval kinds, preferred request builders expose
  Agent UI-owned path aliases, and deprecated protocol fields remain adapter-only
  fallback intake with current fields taking precedence.

### Patch Changes

- Updated dependencies [6ee9789]
- Updated dependencies [b8276c6]
  - @nyosegawa/agent-ui-core@1.0.0
  - @nyosegawa/agent-ui-codex@1.0.0

## 0.5.0

### Minor Changes

- Add host integration contracts for gated workflows, resumable thread startup, and WebSocket bridge lifecycle diagnostics.

  This release exposes typed first-message and thread lifecycle results in React, reports structured bridge diagnostics through core state, expands server-side WebSocket session handling and redaction, and documents the updated host, hook, package export, remote deployment, and server bridge contracts.

### Patch Changes

- Updated dependencies
  - @nyosegawa/agent-ui-core@0.5.0
  - @nyosegawa/agent-ui-codex@0.5.0

## 0.4.1

### Patch Changes

- ce121e6: Add a per-connection WebSocket bridge option resolver for local desktop and sidecar hosts.
  - @nyosegawa/agent-ui-core@0.4.1
  - @nyosegawa/agent-ui-codex@0.4.1

## 0.4.0

### Patch Changes

- Updated dependencies [b138db0]
  - @nyosegawa/agent-ui-codex@0.4.0
  - @nyosegawa/agent-ui-core@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies [2881f4b]
  - @nyosegawa/agent-ui-core@0.3.0
  - @nyosegawa/agent-ui-codex@0.3.0

## 0.2.1

### Patch Changes

- 47922d2: Fix npm release packaging so published tarballs include built `dist` artifacts.

  The release publish script now builds the workspace inside the publish job before
  running Changesets publish, and packlist validation checks the npm packlist for
  missing `dist` entries.

- Updated dependencies [47922d2]
  - @nyosegawa/agent-ui-core@0.2.1
  - @nyosegawa/agent-ui-codex@0.2.1

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

### Patch Changes

- Updated dependencies [ca83d35]
  - @nyosegawa/agent-ui-core@0.2.0
  - @nyosegawa/agent-ui-codex@0.2.0

## 0.1.1

### Patch Changes

- Rewrite internal Agent UI workspace dependency ranges before npm publish so registry package manifests can install correctly in consumer projects.
- Updated dependencies
  - @nyosegawa/agent-ui-core@0.1.1
  - @nyosegawa/agent-ui-codex@0.1.1

## 0.1.0

### Minor Changes

- 5c53b98: Stabilize the transcript-first Agent UI package set: generated Codex App Server protocol metadata and request builders, normalized core state, React primitives and headless hooks, local WebSocket bridge helpers, upload handling, optional SDK adapters, read-only diff rendering, and the Web Components wrapper.

### Patch Changes

- Updated dependencies [5c53b98]
  - @nyosegawa/agent-ui-core@0.1.0
  - @nyosegawa/agent-ui-codex@0.1.0
