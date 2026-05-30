# Web Components

`@nyosegawa/agent-ui-web-components` wraps the React preset in a custom
element for hosts that cannot mount React directly. Install the Web Components
package alongside the React peer dependencies, and import the public React
stylesheet yourself.

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

The element accepts JavaScript properties:

- `transport`
- `initialState`
- `slots`
- `agentOptions`
- `agentOptions.className`

`agentOptions` is a combined property for the same values. `agentOptions.className`
and the `chat-class` attribute pass a class name to the rendered `AgentChat`.
The implementation reads `chat-class` when it renders; it is not a broad
reactive observed-attribute API.

The element does not create a transport, spawn Codex, or import CSS
automatically. Hosts still own the same server bridge and authentication
boundaries as React hosts. Use the same single stylesheet import shown above;
`dist/styles/*` chunks and internal `.aui-*` selectors are not public
web-component styling contracts. Theme or restyle the embedded chat by applying
`--aui-*` token overrides on the element or a wrapper.
