import type { ThreadEvent } from "../events";
import type {
  AgentOperationView,
  AgentSessionState,
  AgentThreadScope,
  ThreadId,
  ThreadState,
} from "../state";
import { threadEntityStore } from "../stores/thread-entity";
import {
  threadLifecycleStore,
  threadMetadataFromThread,
} from "../stores/thread-lifecycle";
import { turnStore } from "../stores/turn";
import { mergeAgentTurn } from "../stores/turn-merge";
import { mergeOrderedTurnIds } from "../stores/turn-order";
import {
  isPreviewThreadStatus,
  preservesAgainstPreviewSnapshot,
} from "./shared";
import { commitThreadEntity } from "./thread-commit";

export function reduceThreadEvent(
  state: AgentSessionState,
  event: ThreadEvent,
): AgentSessionState {
  switch (event.type) {
    case "thread/optimistic/created": {
      const threadState = threadEntityStore.getOrCreate(state.threads, event.thread);
      const turns = { ...threadState.turns };
      const incomingTurnIds = (event.turns ?? []).map((turn) => turn.id);
      const orderedTurnIds = mergeOrderedTurnIds(
        threadState.orderedTurnIds,
        incomingTurnIds,
      );
      for (const turn of event.turns ?? []) {
        turns[turn.id] = turnStore.createTurnState(turn, event.thread.id);
      }
      const status = event.status ?? threadState.status;
      return threadEntityStore.pruneSnapshots(
        commitThreadEntity(
          {
            ...state,
            threadLifecycle: threadLifecycleStore.upsertOperation(
              state.threadLifecycle,
              event.operation,
            ),
          },
          {
            ...threadState,
            activity: "idle",
            availability: "available",
            metadata: {
              ...threadState.metadata,
              ...threadMetadataFromThread(event.thread),
            },
            operations: {
              ...threadState.operations,
              [event.operation.id]: event.operation,
            },
            orderedTurnIds,
            status,
            thread: { ...threadState.thread, ...event.thread },
            turns,
          },
          {
            activeThreadId: event.thread.id,
            collectionKeys: matchingCollectionKeys(
              state,
              event.thread.id,
              {
                ...threadState.metadata,
                ...threadMetadataFromThread(event.thread),
              },
              status,
            ),
          },
        ),
      );
    }
    case "thread/upserted":
    case "thread/started": {
      const threadState = threadEntityStore.getOrCreate(state.threads, event.thread);
      const stalePreviewStatus =
        state.threads[event.thread.id] &&
        isPreviewThreadStatus(event.status) &&
        preservesAgainstPreviewSnapshot(threadState.status) &&
        !isArchivedToLoadedStatus(threadState.status, event.status);
      const status = stalePreviewStatus
        ? threadState.status
        : (event.status ?? threadState.status);
      const turns = { ...threadState.turns };
      const incomingTurnIds = (event.turns ?? []).map((turn) => turn.id);
      const orderedTurnIds = mergeOrderedTurnIds(
        threadState.orderedTurnIds,
        incomingTurnIds,
      );
      for (const turn of event.turns ?? []) {
        const existingTurn = turns[turn.id];
        turns[turn.id] = existingTurn
          ? { ...existingTurn, turn: mergeAgentTurn(existingTurn.turn, turn) }
          : turnStore.createTurnState(turn, event.thread.id);
      }
      return threadEntityStore.pruneSnapshots(
        commitThreadEntity(
          state,
          {
            ...threadState,
            orderedTurnIds,
            thread: { ...threadState.thread, ...event.thread },
            status,
            turns,
          },
          {
            activeThreadId:
              event.type === "thread/started"
                ? event.thread.id
                : state.threadLifecycle.activeThreadId,
          },
        ),
      );
    }
    case "thread/status/changed": {
      const currentThread = state.threads[event.threadId];
      const currentStatus = currentThread?.status;
      if (!currentThread) return state;
      const status =
        currentStatus &&
        isPreviewThreadStatus(event.status) &&
        preservesAgainstPreviewSnapshot(currentStatus) &&
        !isArchivedToLoadedStatus(currentStatus, event.status)
          ? currentStatus
          : event.status;
      return threadEntityStore.pruneSnapshots(
        commitThreadEntity(state, {
          ...currentThread,
          status,
        }),
      );
    }
    case "thread/name/updated":
      return threadEntityStore.update(state, event.threadId, (thread) => ({
        ...thread,
        metadata: { ...thread.metadata, title: event.name },
        thread: { ...thread.thread, name: event.name },
      }));
    case "thread/tokenUsage/updated":
      return threadEntityStore.update(state, event.threadId, (thread) => ({
        ...thread,
        tokenUsage: event.tokenUsage,
      }));
    case "thread/active/set":
      return {
        ...state,
        threadLifecycle: threadLifecycleStore.setActiveThread(
          state.threadLifecycle,
          event.threadId,
        ),
      };
    case "thread/reconciled":
      return reconcileThread(state, event.threadId, event.canonicalThreadId);
    case "thread/optimistic/rolledBack":
      return rollbackOptimisticThread(state, event.threadId, event.operationId);
    case "thread/collection/refreshStarted":
      return {
        ...state,
        threadLifecycle: threadLifecycleStore.collectionRefreshStarted(
          state.threadLifecycle,
          event.scope,
        ),
      };
    case "thread/collection/pageReceived":
      return {
        ...state,
        threadLifecycle: threadLifecycleStore.collectionPageReceived(
          state.threadLifecycle,
          event.scope,
          event.ids,
          {
            nextCursor: event.nextCursor,
            replace: event.replace,
            syncedAt: event.syncedAt,
          },
        ),
      };
    case "thread/collection/synced":
      return {
        ...state,
        threadLifecycle: threadLifecycleStore.collectionSynced(
          state.threadLifecycle,
          event.scope,
          {
            nextCursor: event.nextCursor,
            syncedAt: event.syncedAt,
          },
        ),
      };
    case "thread/collection/failed":
      return {
        ...state,
        threadLifecycle: threadLifecycleStore.collectionFailed(
          state.threadLifecycle,
          event.scope,
          event.error,
        ),
      };
    case "thread/operation/updated":
      return updateOperation(state, event.operation);
    default:
      return assertNever(event);
  }
}

function rollbackOptimisticThread(
  state: AgentSessionState,
  threadId: ThreadId,
  operationId: string | undefined,
): AgentSessionState {
  const threads = { ...state.threads };
  delete threads[threadId];
  const collections = Object.fromEntries(
    Object.entries(state.threadLifecycle.collections).map(([key, collection]) => [
      key,
      {
        ...collection,
        ids: collection.ids.filter((id) => id !== threadId),
      },
    ]),
  );
  const operations = Object.fromEntries(
    Object.entries(state.threadLifecycle.operations).filter(
      ([id, operation]) =>
        id !== operationId &&
        operation.threadId !== threadId,
    ),
  );
  const aliasById = Object.fromEntries(
    Object.entries(state.threadLifecycle.aliasById).filter(
      ([alias, canonical]) => alias !== threadId && canonical !== threadId,
    ),
  );
  return {
    ...state,
    threadLifecycle: {
      ...state.threadLifecycle,
      activeThreadId:
        state.threadLifecycle.activeThreadId === threadId
          ? undefined
          : state.threadLifecycle.activeThreadId,
      aliasById,
      collections,
      operations,
    },
    threads,
  };
}

function updateOperation(
  state: AgentSessionState,
  operation: AgentOperationView,
): AgentSessionState {
  const canonicalOperation = canonicalizeOperation(state, operation);
  return {
    ...state,
    threadLifecycle: threadLifecycleStore.upsertOperation(
      state.threadLifecycle,
      canonicalOperation,
    ),
    threads: canonicalOperation.threadId
      ? updateThreadOperation(state, canonicalOperation)
      : state.threads,
  };
}

function isArchivedToLoadedStatus(
  currentStatus: string | undefined,
  incomingStatus: string | undefined,
): boolean {
  return currentStatus === "archived" && incomingStatus === "loaded";
}

function canonicalizeOperation(
  state: AgentSessionState,
  operation: AgentOperationView,
): AgentOperationView {
  return operation.threadId
    ? { ...operation, threadId: canonicalThreadId(state, operation.threadId) }
    : operation;
}

function canonicalThreadId(state: AgentSessionState, threadId: ThreadId): ThreadId {
  let current = threadId;
  const seen = new Set<ThreadId>();
  while (state.threadLifecycle.aliasById[current] && !seen.has(current)) {
    seen.add(current);
    current = state.threadLifecycle.aliasById[current]!;
  }
  return current;
}

function reconcileThread(
  state: AgentSessionState,
  pendingThreadId: string,
  canonicalThreadId: string,
): AgentSessionState {
  if (pendingThreadId === canonicalThreadId) return state;
  const pendingThread = state.threads[pendingThreadId];
  const canonicalThread = state.threads[canonicalThreadId];
  const threads = { ...state.threads };
  if (pendingThread) {
    const operations = Object.fromEntries(
      Object.entries({
        ...pendingThread.operations,
        ...(canonicalThread?.operations ?? {}),
      }).map(([operationId, operation]) => [
        operationId,
        operation.threadId === pendingThreadId
          ? { ...operation, threadId: canonicalThreadId }
          : operation,
      ]),
    );
    const pendingTurnIds = pendingThread.orderedTurnIds;
    const canonicalTurnIds = canonicalThread?.orderedTurnIds ?? [];
    threads[canonicalThreadId] = {
      ...pendingThread,
      ...(canonicalThread ?? {}),
      canonicalId: canonicalThreadId,
      id: canonicalThreadId,
      metadata: {
        ...pendingThread.metadata,
        ...(canonicalThread?.metadata ?? {}),
      },
      operations,
      orderedTurnIds: mergeOrderedTurnIds(canonicalTurnIds, pendingTurnIds),
      thread: {
        ...pendingThread.thread,
        ...(canonicalThread?.thread ?? {}),
        id: canonicalThreadId,
      },
      turns: {
        ...reconcilePendingTurnThreadIds(
          pendingThread.turns,
          pendingThreadId,
          canonicalThreadId,
        ),
        ...(canonicalThread?.turns ?? {}),
      },
    };
    delete threads[pendingThreadId];
  }
  return {
    ...state,
    threadLifecycle: threadLifecycleStore.reconcileThread(
      state.threadLifecycle,
      pendingThreadId,
      canonicalThreadId,
    ),
    serverRequestQueue: {
      ...state.serverRequestQueue,
      byId: Object.fromEntries(
        Object.entries(state.serverRequestQueue.byId).map(([id, request]) => [
          id,
          request.threadId === pendingThreadId
            ? { ...request, threadId: canonicalThreadId }
            : request,
        ]),
      ),
    },
    threads,
  };
}

function reconcilePendingTurnThreadIds(
  turns: AgentSessionState["threads"][ThreadId]["turns"],
  pendingThreadId: ThreadId,
  canonicalThreadId: ThreadId,
) {
  return Object.fromEntries(
    Object.entries(turns).map(([turnId, turn]) => [
      turnId,
      {
        ...turn,
        items: Object.fromEntries(
          Object.entries(turn.items).map(([itemId, item]) => [
            itemId,
            item.threadId === pendingThreadId
              ? { ...item, threadId: canonicalThreadId }
              : item,
          ]),
        ),
        turn:
          turn.turn.threadId === pendingThreadId
            ? { ...turn.turn, threadId: canonicalThreadId }
            : turn.turn,
      },
    ]),
  );
}

function matchingCollectionKeys(
  state: AgentSessionState,
  threadId: ThreadId,
  metadata: ThreadState["metadata"],
  status: string | undefined,
) {
  const keys = Object.values(state.threadLifecycle.collections)
    .filter((collection) =>
      collectionMatchesThread(collection.scope, { metadata, status, threadId }),
    )
    .map((collection) => collection.key);
  return keys.length > 0 ? keys : [state.threadLifecycle.defaultCollectionKey];
}

function collectionMatchesThread(
  scope: AgentThreadScope,
  thread: {
    metadata: ThreadState["metadata"];
    status: string | undefined;
    threadId: ThreadId;
  },
) {
  if (scope.kind === "all") return true;
  if (scope.kind === "custom") return scope.key === thread.threadId;
  if (scope.archived !== undefined) {
    const archived = thread.status === "archived";
    if (scope.archived !== archived) return false;
  }
  if (scope.cwd && scope.cwd !== thread.metadata.cwd) return false;
  if (scope.searchTerm) {
    const haystack = `${thread.metadata.title ?? ""} ${thread.metadata.cwd ?? ""}`
      .toLocaleLowerCase();
    if (!haystack.includes(scope.searchTerm.toLocaleLowerCase())) return false;
  }
  return true;
}

function updateThreadOperation(
  state: AgentSessionState,
  operation: AgentOperationView,
) {
  const threadId = operation.threadId;
  if (!threadId) return state.threads;
  const thread = state.threads[threadId];
  if (!thread) return state.threads;
  return {
    ...state.threads,
    [threadId]: {
      ...thread,
      operations: {
        ...thread.operations,
        [operation.id]: operation,
      },
    },
  };
}

function assertNever(value: never): never {
  throw new Error(`Unhandled thread event: ${JSON.stringify(value)}`);
}
