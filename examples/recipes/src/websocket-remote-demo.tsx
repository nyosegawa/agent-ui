import {
  createAgentUiBearerSubprotocol,
  createCodexWebSocketTransport,
} from "@nyosegawa/agent-ui-codex/websocket";
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/styles.css";

export function createRemoteTransport({
  origin = window.location.origin,
  sessionToken,
}: {
  origin?: string;
  sessionToken?: string;
} = {}) {
  const url = new URL("/agent-ui/ws", origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return createCodexWebSocketTransport({
    initialize: {
      capabilities: {
        experimentalApi: false,
        requestAttestation: false,
      },
      clientInfo: {
        name: "agent-ui-websocket-demo",
        title: null,
        version: "0.0.0",
      },
    },
    protocols: sessionToken
      ? [createAgentUiBearerSubprotocol(sessionToken)]
      : undefined,
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
