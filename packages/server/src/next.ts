import { jsonRpcErrorPayload } from "@nyosegawa/agent-ui-codex";
import {
  codexAppServerBridgeOptionsFromRoot,
  createCodexAppServerBridge,
  type CodexAppServerOptions,
} from "./bridge";
import {
  isOneShotRpcMethodAllowed,
  oneShotRpcInvalidRequestError,
  oneShotRpcMethodNotAllowedError,
  type OneShotRpcMethodPolicyOptions,
} from "./one-shot-rpc-policy";
import { redactStructuredValue } from "./redaction";

export type AgentUiNextRpcRouteOptions = CodexAppServerOptions &
  OneShotRpcMethodPolicyOptions;

/**
 * Create a Next.js Route Handler for exactly one Codex App Server request.
 *
 * This helper intentionally does not power Agent UI chat. Chat needs a
 * long-lived WebSocket bridge so App Server notifications, approval requests,
 * and browser approval responses can flow in both directions.
 */
export function createAgentUiNextRpcRoute(options: AgentUiNextRpcRouteOptions = {}) {
  return async function POST(request: Request): Promise<Response> {
    const { allowedMethods } = options;
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return Response.json(
        {
          error: oneShotRpcInvalidRequestError("Invalid JSON request body", {
            message: error instanceof Error ? error.message : String(error),
          }),
        },
        { status: 400 },
      );
    }
    if (!isRecord(body) || typeof body.method !== "string") {
      return Response.json(
        {
          error: oneShotRpcInvalidRequestError("Missing or invalid method"),
        },
        { status: 400 },
      );
    }
    if (!isOneShotRpcMethodAllowed(body.method, { allowedMethods })) {
      return Response.json(
        { error: oneShotRpcMethodNotAllowedError(body.method) },
        { status: 403 },
      );
    }
    let bridge: ReturnType<typeof createCodexAppServerBridge> | undefined;
    try {
      bridge = createCodexAppServerBridge(codexAppServerBridgeOptionsFromRoot(options));
      await bridge.transport.connect();
      const result = await bridge.transport.request(body.method, body.params);
      return Response.json({ result });
    } catch (error) {
      return Response.json(
        { error: redactStructuredValue(jsonRpcErrorPayload(error)) },
        { status: 500 },
      );
    } finally {
      await bridge?.close();
    }
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
