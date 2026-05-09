import { createCodexAppServerBridge, type CodexAppServerBridgeOptions } from "./bridge";

export type AgentUiNextRpcRouteOptions = CodexAppServerBridgeOptions;

export function createAgentUiNextRpcRoute(options: AgentUiNextRpcRouteOptions = {}) {
  return async function POST(request: Request): Promise<Response> {
    const bridge = createCodexAppServerBridge(options);
    try {
      await bridge.transport.connect();
      const { method, params } = (await request.json()) as { method: string; params?: unknown };
      const result = await bridge.transport.request(method, params);
      return Response.json({ result });
    } catch (error) {
      return Response.json(
        { error: { message: error instanceof Error ? error.message : String(error) } },
        { status: 500 },
      );
    } finally {
      await bridge.close();
    }
  };
}

/**
 * @deprecated This helper is a one-shot RPC route, not a streaming chat bridge.
 * Use `createAgentUiNextRpcRoute()` for one-shot server calls or
 * `attachAgentUiWebSocketBridge()` for chat, streaming, and approvals.
 */
export const createAgentUiNextRoute = createAgentUiNextRpcRoute;
export type AgentUiNextRouteOptions = AgentUiNextRpcRouteOptions;
