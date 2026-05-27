import type {
  PendingServerRequest,
  ServerRequestQueueState,
  ThreadId,
} from "../state";

export type PendingServerRequestState = Record<string, PendingServerRequest>;

export interface ServerRequestStore {
  createInitialPendingState(): PendingServerRequestState;
  createInitialQueueState(): ServerRequestQueueState;
  dequeue(queue: ServerRequestQueueState, requestId: string): ServerRequestQueueState;
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
  const id = String(request.id);
  return {
    byId: { ...queue.byId, [id]: request },
    order: queue.order.includes(id) ? queue.order : [...queue.order, id],
  };
}

export function dequeueServerRequest(
  queue: ServerRequestQueueState,
  requestId: string,
): ServerRequestQueueState {
  const byId = { ...queue.byId };
  delete byId[requestId];
  return {
    byId,
    order: queue.order.filter((id) => id !== requestId),
  };
}
