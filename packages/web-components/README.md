# @nyosegawa/agent-ui-web-components

Web Components wrapper for Agent UI React components.

Use this package when a host cannot mount React directly but can consume custom
elements backed by Agent UI's React preset.

## Install

```sh
bun add @nyosegawa/agent-ui-web-components @nyosegawa/agent-ui-react
```

## Common Imports

| Use case | Import |
| --- | --- |
| Define the default custom element | `import { defineAgentChatElement } from "@nyosegawa/agent-ui-web-components";` |
| Type element options | `import type { AgentChatElementOptions } from "@nyosegawa/agent-ui-web-components";` |
| Type the element class | `import type { AgentChatElement } from "@nyosegawa/agent-ui-web-components";` |
| Style the underlying React preset | `import "@nyosegawa/agent-ui-react/styles.css";` |

## Package Boundary

This package wraps Agent UI presentation as custom elements. Host applications
still own Codex connection setup, runtime lifecycle, persistence, credentials,
and app-specific workflows.

Pass transports, opaque `initialState` snapshots, `agentOptions`, and the React
`components` replacement map as element properties. `agentOptions` is a complete
replacement for the element configuration. Replacing `transport` or
`initialState` remounts the underlying React provider.

Transcript display policy is also configured as JavaScript properties:
`element.transcriptDisplay`, `element.transcriptMode`, or the matching
`agentOptions` fields. Use `transcriptMode = "answer-focused"` for the built-in
answer-focused preset, or pass the same `transcriptDisplay` policy object used
by the React package.

The custom element does not import CSS automatically, spawn Codex, create auth,
persist sessions, or provide hosted service policy. Hosts should import
`@nyosegawa/agent-ui-react/styles.css` once and pass transports, callbacks, and
component replacements as JavaScript properties.

See the repository docs for current package exports and integration guidance:
https://github.com/nyosegawa/agent-ui
