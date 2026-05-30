import { jsonRpcErrorPayload } from "@nyosegawa/agent-ui-codex";
import { createCodexAppServerBridge, type CodexAppServerBridgeOptions } from "./bridge";
import {
  isOneShotRpcMethodAllowed,
  oneShotRpcInvalidRequestError,
  oneShotRpcMethodNotAllowedError,
  type OneShotRpcMethodPolicyOptions,
} from "./one-shot-rpc-policy";
import { redactStructuredValue } from "./redaction";

export interface MinimalExpressRequest {
  body?: { method?: string; params?: unknown };
}

export interface MinimalExpressResponse {
  json(value: unknown): void;
  status(code: number): MinimalExpressResponse;
}

export type AgentUiExpressMiddlewareOptions = CodexAppServerBridgeOptions &
  OneShotRpcMethodPolicyOptions;

export function createAgentUiExpressMiddleware(
  options: AgentUiExpressMiddlewareOptions = {},
) {
  return async function agentUiExpressMiddleware(
    req: MinimalExpressRequest,
    res: MinimalExpressResponse,
  ) {
    const { allowedMethods, ...bridgeOptions } = options;
    const method = req.body?.method;
    if (typeof method !== "string") {
      res.status(400).json({ error: oneShotRpcInvalidRequestError("Missing or invalid method") });
      return;
    }
    if (!isOneShotRpcMethodAllowed(method, { allowedMethods })) {
      res.status(403).json({ error: oneShotRpcMethodNotAllowedError(method) });
      return;
    }
    let bridge: ReturnType<typeof createCodexAppServerBridge> | undefined;
    try {
      bridge = createCodexAppServerBridge(bridgeOptions);
      await bridge.transport.connect();
      const result = await bridge.transport.request(method, req.body?.params);
      res.json({ result });
    } catch (error) {
      res.status(500).json({
        error: redactStructuredValue(jsonRpcErrorPayload(error)),
      });
    } finally {
      await bridge?.close();
    }
  };
}
