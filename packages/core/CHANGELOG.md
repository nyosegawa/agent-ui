# @nyosegawa/agent-ui-core

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
