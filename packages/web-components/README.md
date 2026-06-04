# @nyosegawa/agent-ui-web-components

Web Components wrapper for Agent UI React components.

Use this package when a host cannot mount React directly but can consume custom
elements backed by Agent UI's React preset.

## Install

```sh
bun add @nyosegawa/agent-ui-web-components @nyosegawa/agent-ui-react
```

## Package Boundary

This package wraps Agent UI presentation as custom elements. Host applications
still own Codex connection setup, runtime lifecycle, persistence, credentials,
and app-specific workflows.

Pass transports, `agentOptions`, and the React `components` replacement map as
element properties. The custom element does not import CSS automatically,
spawn Codex, create auth, persist sessions, or provide hosted service policy.

See the repository docs for current package exports and integration guidance:
https://github.com/nyosegawa/agent-ui
