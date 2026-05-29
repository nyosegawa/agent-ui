import type { RequestId } from "@nyosegawa/agent-ui-core";

export function requestIdKey(id: RequestId): string {
  return `${typeof id}:${String(id)}`;
}
