import type { RequestId } from "./state";

export type RequestIdKey = `${"number" | "string"}:${string}`;

export function requestIdKey(requestId: RequestId): RequestIdKey {
  const prefix = typeof requestId === "number" ? "number" : "string";
  return `${prefix}:${String(requestId)}`;
}
