---
"@nyosegawa/agent-ui-core": minor
"@nyosegawa/agent-ui-codex": minor
"@nyosegawa/agent-ui-react": minor
"@nyosegawa/agent-ui-server": minor
"@nyosegawa/agent-ui-web-components": minor
---

Establish the current host integration package boundary for Agent UI.

This release updates the public surface around thread lifecycle state, scoped
thread collections, host integration components, Codex protocol helper
subpaths, bridge helpers, and package export maps. Registry-bucket thread
types are replaced by the current lifecycle and thread-view APIs, React host
customization uses the component map instead of slots, and Codex normalizers
move to `@nyosegawa/agent-ui-codex/normalizer` rather than the package root.

Hosts still own runtime policy including auth, persistence, tenant isolation,
non-loopback bridge admission, upload/static authorization, process
supervision, billing, and deployment.
