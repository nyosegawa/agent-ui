import { createCodexAppServerBridge, type CodexAppServerBridgeOptions } from "./bridge";

export type AgentUiNextRpcRouteOptions = CodexAppServerBridgeOptions;

/**
 * Create a Next.js Route Handler for exactly one Codex App Server request.
 *
 * This helper intentionally does not power Agent UI chat. Chat needs a
 * long-lived WebSocket bridge so App Server notifications, approval requests,
 * and browser approval responses can flow in both directions.
 */
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
