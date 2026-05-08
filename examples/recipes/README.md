# Agent UI Recipes

Typed implementation recipes for host applications.

- `custom-components.tsx`: `AgentChat` slots for custom approval and item rendering.
- `headless-hooks.tsx`: custom layout built from hooks only.
- `themed.tsx` and `themed.css`: CSS variable theme override.
- `websocket-remote-demo.tsx`: optional authenticated WebSocket transport wiring.

The WebSocket recipe assumes the host application owns `/agent-ui/ws` authentication. Do not put bearer tokens in query strings.
