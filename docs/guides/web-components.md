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
