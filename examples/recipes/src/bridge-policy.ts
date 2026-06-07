import type { IncomingMessage, Server } from "node:http";
import {
  attachAgentUiWebSocketBridge,
  parseAgentUiBearerSubprotocol,
} from "@nyosegawa/agent-ui-server";

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

export interface DesktopSidecarSession {
  allowNoOrigin?: boolean;
  cwd: string;
  env?: NodeJS.ProcessEnv;
  token: string;
}

export function attachDesktopSidecarBridge({
  appOrigin,
  server,
  sessions,
}: {
  appOrigin: string;
  server: Server;
  sessions: ReadonlyMap<string, DesktopSidecarSession>;
}) {
  return attachAgentUiWebSocketBridge({
    path: "/agent-ui/ws",
    resolveBridgeOptions({ request }) {
      const session = resolveDesktopSidecarSession(request, sessions);
      if (!session) return false;

      const origin = request?.headers.origin;
      if (origin !== undefined && origin !== appOrigin) return false;
      if (origin === undefined && !session.allowNoOrigin) return false;

      return {
        bridgePolicy: {
          admission: {
            admit(admissionRequest) {
              return admissionRequest === request;
            },
            mode: "host-callback",
          },
        },
        browserMethodPolicy: "productized",
        cwd: validateDesktopWorkspace(session.cwd),
        dynamicToolPolicy: { mode: "disabled" },
        env: session.env,
      };
    },
    server,
  });
}

function resolveDesktopSidecarSession(
  request: IncomingMessage | undefined,
  sessions: ReadonlyMap<string, DesktopSidecarSession>,
): DesktopSidecarSession | undefined {
  const parsed = parseAgentUiBearerSubprotocol(request);
  return parsed.ok ? sessions.get(parsed.token) : undefined;
}

function validateDesktopWorkspace(cwd: string): string {
  if (!cwd.startsWith("/Users/example/Projects/")) {
    throw new Error("Workspace is outside the allowed desktop project root");
  }
  return cwd;
}
