---
"@nyosegawa/agent-ui-react": major
---

Redesign the React package around one shared provider runtime across the root,
`/headless`, and `/primitives` entrypoints, and replace the old preset
customization shape with the public `AgentChat.components` map.

This is a breaking React composition release. Because Agent UI publishes the
public package set in a fixed version group, `@nyosegawa/agent-ui-core`,
`@nyosegawa/agent-ui-codex`, `@nyosegawa/agent-ui-server`, and
`@nyosegawa/agent-ui-web-components` will move in lockstep with the React major
even though the breaking API surface is in `@nyosegawa/agent-ui-react`.

`AgentChat` now supports targeted composition through `StatusBar` and
`ThreadHeader` replacements, `threadHeaderEnd`, fixed `startOptions`, controlled
mobile drawer/context-sheet `controls`, structured local media resolvers, and
the shared `useAgentChatController().sendMessage()` lifecycle for external host
UI. Host integrations should use these public props, hooks, primitives, and
tokens instead of private DOM selectors, raw transport sequencing, or direct
local media paths.

Removed or unsupported migration targets include the old `AgentChatSlots`
customization shape, raw `components.Item` preset replacement, `AgentWorkspace`,
private status/header DOM selector customization, direct local-media path
rendering, and host-owned `thread/start` plus `turn/start` transport sequencing.
Use `AgentChat.components`, `threadHeaderEnd`, `/headless` controllers,
`/primitives` UI, structured local media resolvers, and shared lifecycle
controllers instead.
