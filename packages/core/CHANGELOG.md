# @nyosegawa/agent-ui-core

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
