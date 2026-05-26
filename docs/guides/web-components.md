# Web Components

`@nyosegawa/agent-ui-web-components` wraps the React preset in a custom
element for hosts that cannot mount React directly.

```ts
import "@nyosegawa/agent-ui-react/styles.css";
import { defineAgentChatElement } from "@nyosegawa/agent-ui-web-components";

defineAgentChatElement();

const element = document.querySelector("agent-chat");
element.transport = transport;
```

The element accepts JavaScript properties:

- `transport`
- `initialState`
- `slots`
- `agentOptions`

It does not create a transport, spawn Codex, or import CSS automatically. Hosts
still own the same server bridge and authentication boundaries as React hosts.
Use the same single stylesheet import shown above; `dist/styles/*` chunks and
internal `.aui-*` selectors are not public web-component styling contracts.
Theme or restyle the embedded chat by applying `--aui-*` token overrides on the
element or a wrapper.
