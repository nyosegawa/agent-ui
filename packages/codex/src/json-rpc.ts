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
    throw new Error("JSON-RPC message must be an object");
  }
  return value;
}

export function isJsonRpcResponse(message: JsonRpcMessage): message is JsonRpcSuccess | JsonRpcFailure {
  return "id" in message && ("result" in message || "error" in message);
}

export function isJsonRpcRequest(message: JsonRpcMessage): message is JsonRpcRequest {
  return "id" in message && "method" in message && !("result" in message) && !("error" in message);
}

export function isJsonRpcNotification(message: JsonRpcMessage): message is JsonRpcNotification {
  return !("id" in message) && "method" in message;
}
