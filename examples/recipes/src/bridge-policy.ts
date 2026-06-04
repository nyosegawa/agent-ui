import type { Server } from "node:http";
import { attachAgentUiWebSocketBridge } from "@nyosegawa/agent-ui-server";

export function attachLoopbackProductizedBridge({
  cwd,
  server,
}: {
  cwd: string;
  server: Server;
}) {
  return attachAgentUiWebSocketBridge({
    bridgePolicy: { admission: { mode: "local-loopback" } },
    browserMethodPolicy: "productized",
    cwd,
    hostEvents: {
      onBridgeHealthEvent(event) {
        console.info("agent-ui bridge health", {
          phase: event.phase,
          pendingRequestCount: event.state.pendingRequestCount,
        });
      },
    },
    path: "/agent-ui/ws",
    server,
  });
}
