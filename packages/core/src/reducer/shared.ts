import type { AgentSessionState, ThreadId } from "../state";

export function hasPendingThreadRequest(
  requests: AgentSessionState["pendingServerRequests"],
  threadId: ThreadId,
): boolean {
  return Object.values(requests).some((request) => request.threadId === threadId);
}

export function recordOrUndefined(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

export function isPreviewThreadStatus(status?: string): boolean {
  return status === "notLoaded" || status === "loaded";
}

export function preservesAgainstPreviewSnapshot(status?: string): boolean {
  return Boolean(status) && !isPreviewThreadStatus(status);
}

export function isCompletedTurnStatus(status?: string): boolean {
  return status === "complete" || status === "completed";
}

export function enqueueServerRequest(
  queue: AgentSessionState["serverRequestQueue"],
  request: AgentSessionState["serverRequestQueue"]["byId"][string],
): AgentSessionState["serverRequestQueue"] {
  const id = String(request.id);
  return {
    byId: { ...queue.byId, [id]: request },
    order: queue.order.includes(id) ? queue.order : [...queue.order, id],
  };
}

export function dequeueServerRequest(
  queue: AgentSessionState["serverRequestQueue"],
  requestId: string,
): AgentSessionState["serverRequestQueue"] {
  const byId = { ...queue.byId };
  delete byId[requestId];
  return {
    byId,
    order: queue.order.filter((id) => id !== requestId),
  };
}

export function upsertById<T extends { id: string }>(values: T[], value: T): T[] {
  const index = values.findIndex((current) => current.id === value.id);
  if (index === -1) return [...values, value];
  const next = [...values];
  next[index] = value;
  return next;
}
