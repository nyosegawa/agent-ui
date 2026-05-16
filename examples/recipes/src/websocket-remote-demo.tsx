import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex";
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/styles.css";

export function createRemoteTransport(origin = window.location.origin) {
  const url = new URL("/agent-ui/ws", origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return createCodexWebSocketTransport({
    initialize: {
      clientInfo: {
        name: "agent-ui-websocket-demo",
        version: "0.0.0",
      },
    },
    url,
  });
}

export function WebSocketRemoteDemo() {
  return (
    <AgentProvider transport={createRemoteTransport()}>
      <AgentChat />
    </AgentProvider>
  );
}
