# Web Components

`@nyosegawa/agent-ui-web-components` wraps the React preset in a custom
element for hosts that can consume custom elements but do not want to mount
React directly. It is a thin presentation wrapper: the host still supplies an
`AgentTransport`, owns authentication and runtime lifecycle, and imports the
React stylesheet.

```ts
import "@nyosegawa/agent-ui-react/styles.css";
import {
  defineAgentChatElement,
  type AgentChatWebComponentElement,
} from "@nyosegawa/agent-ui-web-components";

defineAgentChatElement();

const element = document.querySelector<AgentChatWebComponentElement>("agent-chat")!;
element.transport = transport;
```

`defineAgentChatElement(tagName)` is browser-only. Importing the package in a
server or SSR build is safe, and calling `defineAgentChatElement()` without a
DOM returns `undefined`. In browsers, the function registers the requested tag
and returns the constructor registered for that tag. Calling it again for the
same tag is idempotent. If another library has already registered that tag, the
function throws instead of silently reusing a foreign element.

The element accepts JavaScript properties for object/function values:

- `transport`
- `initialState`
- `components`
- `agentOptions`
- `agentOptions.transport`
- `agentOptions.initialState`
- `agentOptions.components`
- `agentOptions.className`

`agentOptions` is a complete replacement for the same values. Setting
`element.agentOptions = undefined` clears the transport, initial state,
component replacements, and `chat-class`. Use individual properties when you
want to replace only one part of the configuration.

`initialState` accepts the opaque `AgentSessionState` snapshot produced by the
core public API. Replacing `initialState` or `transport` remounts the underlying
`AgentProvider` so old provider state cannot leak across sessions.

The only supported attribute is `chat-class`. `agentOptions.className` and the
`chat-class` attribute pass a class name to the rendered `AgentChat`.
`chat-class` is observed; setting or removing it updates the rendered chat.
Other `AgentChat` options are intentionally not modeled as attributes because
they require JavaScript objects or functions.

The element does not create a transport, spawn Codex, or import CSS
automatically. Hosts still own the same server bridge and authentication
boundaries as React hosts. Use the same single stylesheet import shown above;
`dist/styles/*` chunks and internal `.aui-*` selectors are not public
web-component styling contracts. Theme or restyle the embedded chat by applying
`--aui-*` token overrides on the element or a wrapper.
