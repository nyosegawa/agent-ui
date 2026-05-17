import type { AgentError, RequestId } from "@nyosegawa/agent-ui-core";

export interface JsonRpcRequest {
  id: RequestId;
  method: string;
  params?: unknown;
}

export interface JsonRpcNotification {
  method: string;
  params?: unknown;
}

export interface JsonRpcSuccess {
  id: RequestId;
  result: unknown;
}

export interface JsonRpcFailure {
  id: RequestId;
  error: AgentError;
}

export type JsonRpcMessage =
  | JsonRpcRequest
  | JsonRpcNotification
  | JsonRpcSuccess
  | JsonRpcFailure;

export function encodeJsonRpcLine(message: JsonRpcMessage): string {
  return `${JSON.stringify(message)}\n`;
}

export function parseJsonRpcLine(line: string): JsonRpcMessage {
  const value = JSON.parse(line) as JsonRpcMessage;
  if (typeof value !== "object" || value == null) {
    throw jsonRpcErrorObject({
      code: -32600,
      data: { received: typeof value },
      message: "JSON-RPC message must be an object",
    });
  }
  return value;
}

export function isJsonRpcResponse(message: unknown): message is JsonRpcSuccess | JsonRpcFailure {
  return isRecord(message) && "id" in message && ("result" in message || "error" in message);
}

export function isJsonRpcRequest(message: unknown): message is JsonRpcRequest {
  return (
    isRecord(message) &&
    "id" in message &&
    "method" in message &&
    typeof message.method === "string" &&
    !("result" in message) &&
    !("error" in message)
  );
}

export function isJsonRpcNotification(message: unknown): message is JsonRpcNotification {
  return isRecord(message) && !("id" in message) && typeof message.method === "string";
}

export function jsonRpcErrorObject(error: {
  code?: number;
  data?: unknown;
  message: string;
}): Error & { code?: number; data?: unknown } {
  const next = new Error(error.message) as Error & { code?: number; data?: unknown };
  next.code = error.code;
  next.data = error.data;
  return next;
}

export function jsonRpcErrorPayload(error: unknown): AgentError {
  if (error instanceof Error) {
    const candidate = error as Error & { code?: unknown; data?: unknown };
    return {
      ...(typeof candidate.code === "number" ? { code: candidate.code } : {}),
      ...(candidate.data !== undefined ? { data: candidate.data } : {}),
      message: error.message,
    };
  }
  return { message: String(error) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
