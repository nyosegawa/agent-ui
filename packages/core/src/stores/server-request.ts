import type {
  PendingServerRequest,
  RequestId,
  ServerRequestQueueState,
  ThreadId,
} from "../state";
import { requestIdKey, type RequestIdKey } from "../request-id-key";

export type PendingServerRequestState = Record<RequestIdKey, PendingServerRequest>;

export interface ServerRequestStore {
  createInitialPendingState(): PendingServerRequestState;
  createInitialQueueState(): ServerRequestQueueState;
  dequeue(queue: ServerRequestQueueState, requestId: RequestId): ServerRequestQueueState;
  enqueue(
    queue: ServerRequestQueueState,
    request: PendingServerRequest,
  ): ServerRequestQueueState;
  hasPendingThreadRequest(
    requests: PendingServerRequestState,
    threadId: ThreadId,
  ): boolean;
}

export const serverRequestStore: ServerRequestStore = {
  createInitialPendingState: createInitialPendingServerRequestState,
  createInitialQueueState: createInitialServerRequestQueueState,
  dequeue: dequeueServerRequest,
  enqueue: enqueueServerRequest,
  hasPendingThreadRequest,
};

export function createInitialPendingServerRequestState(): PendingServerRequestState {
  return {};
}

export function createInitialServerRequestQueueState(): ServerRequestQueueState {
  return { byId: {}, order: [] };
}

export function hasPendingThreadRequest(
  requests: PendingServerRequestState,
  threadId: ThreadId,
): boolean {
  return Object.values(requests).some((request) => request.threadId === threadId);
}

export function enqueueServerRequest(
  queue: ServerRequestQueueState,
  request: PendingServerRequest,
): ServerRequestQueueState {
  const key = requestIdKey(request.id);
  return {
    byId: { ...queue.byId, [key]: request },
    order: queue.order.includes(key) ? queue.order : [...queue.order, key],
  };
}

export function dequeueServerRequest(
  queue: ServerRequestQueueState,
  requestId: RequestId,
): ServerRequestQueueState {
  const key = requestIdKey(requestId);
  const byId = { ...queue.byId };
  delete byId[key];
  return {
    byId,
    order: queue.order.filter((id) => id !== key),
  };
}
