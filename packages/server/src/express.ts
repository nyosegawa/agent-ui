import { createCodexAppServerBridge, type CodexAppServerBridgeOptions } from "./bridge";

export interface MinimalExpressRequest {
  body?: { method?: string; params?: unknown };
}

export interface MinimalExpressResponse {
  json(value: unknown): void;
  status(code: number): MinimalExpressResponse;
}

export function createAgentUiExpressMiddleware(options: CodexAppServerBridgeOptions = {}) {
  return async function agentUiExpressMiddleware(
    req: MinimalExpressRequest,
    res: MinimalExpressResponse,
  ) {
    const bridge = createCodexAppServerBridge(options);
    try {
      await bridge.transport.connect();
      const method = req.body?.method;
      if (!method) {
        res.status(400).json({ error: { message: "Missing method" } });
        return;
      }
      const result = await bridge.transport.request(method, req.body?.params);
      res.json({ result });
    } catch (error) {
      res.status(500).json({
        error: { message: error instanceof Error ? error.message : String(error) },
      });
    } finally {
      await bridge.close();
    }
  };
}
