import type { ThreadEvent } from "../events";
import type {
  AgentOperationView,
  AgentSessionState,
  AgentThread,
  AgentThreadScope,
  AgentTurn,
  ThreadId,
  ThreadState,
} from "../state";
import { threadEntityStore } from "../stores/thread-entity";
import { sanitizeThread } from "../stores/thread-entity";
import {
  threadLifecycleStore,
  threadMetadataFromThread,
} from "../stores/thread-lifecycle";
import {
  mergeRuntimeStatus,
  threadRuntimeFromStatus,
  runtimeWithServerRequestOverlay,
} from "../stores/thread-runtime";
import { turnStore } from "../stores/turn";
import { mergeAgentTurn } from "../stores/turn-merge";
import { mergeOrderedTurnIds } from "../stores/turn-order";
import { canonicalThreadId } from "../thread-alias";
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
      const incomingThread = sanitizeThread(event.thread);
      const threadState = threadEntityStore.getOrCreate(state.threads, incomingThread);
      const turns = { ...threadState.turns };
      const incomingTurnIds = (event.turns ?? []).map((turn) => turn.id);
      const orderedTurnIds = mergeOrderedTurnIds(
        threadState.orderedTurnIds,
        incomingTurnIds,
      );
      for (const turn of event.turns ?? []) {
        turns[turn.id] = turnStore.createTurnState(turn, incomingThread.id);
      }
      const status = event.status ?? threadState.status;
      const baseRuntime = event.runtimeStatus
        ? mergeRuntimeStatus(threadState.runtime, event.runtimeStatus)
        : threadRuntimeFromStatus(status);
      const runtime = runtimeWithServerRequestOverlay(
        state,
        { ...threadState, id: incomingThread.id, runtime: baseRuntime, status },
        baseRuntime.status,
      );
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
              ...threadMetadataFromThread(incomingThread),
            },
            operations: {
              ...threadState.operations,
              [event.operation.id]: event.operation,
            },
            orderedTurnIds,
            runtime,
            status,
            thread: sanitizeThread({ ...threadState.thread, ...incomingThread }),
            turns,
          },
          {
            activeThreadId: incomingThread.id,
            collectionKeys: matchingCollectionKeys(
              state,
              incomingThread.id,
              {
                ...threadState.metadata,
                ...threadMetadataFromThread(incomingThread),
              },
              status,
            ),
          },
        ),
      );
    }
    case "thread/upserted":
    case "thread/started": {
      const threadId = canonicalThreadId(state, event.thread.id);
      const incomingThread = sanitizeThread(canonicalThread(event.thread, threadId));
      const incomingTurns = (event.turns ?? []).map((turn) =>
        canonicalTurn(turn, threadId),
      );
      const threadState = threadEntityStore.getOrCreate(state.threads, incomingThread);
      const stalePreviewStatus =
        state.threads[threadId] &&
        isPreviewThreadStatus(event.status) &&
        preservesAgainstPreviewSnapshot(threadState.status) &&
        !isArchivedToLoadedStatus(threadState.status, event.status);
      const status = stalePreviewStatus
        ? threadState.status
        : (event.status ?? threadState.status);
      const baseRuntime =
        event.runtimeStatus && !stalePreviewStatus
          ? mergeRuntimeStatus(threadState.runtime, event.runtimeStatus)
          : threadRuntimeFromStatus(status);
      const runtime = runtimeWithServerRequestOverlay(
        state,
        { ...threadState, id: threadId, runtime: baseRuntime, status },
        baseRuntime.status,
      );
      const turns = { ...threadState.turns };
      const incomingTurnIds = incomingTurns.map((turn) => turn.id);
      const orderedTurnIds = mergeOrderedTurnIds(
        threadState.orderedTurnIds,
        incomingTurnIds,
      );
      for (const turn of incomingTurns) {
        const existingTurn = turns[turn.id];
        turns[turn.id] = existingTurn
          ? { ...existingTurn, turn: mergeAgentTurn(existingTurn.turn, turn) }
          : turnStore.createTurnState(turn, threadId);
      }
      return threadEntityStore.pruneSnapshots(
        commitThreadEntity(
          state,
          {
            ...threadState,
            orderedTurnIds,
            runtime,
            thread: mergeThread(threadState.thread, incomingThread),
            status,
            turns,
          },
          {
            activeThreadId:
              event.type === "thread/started"
                ? threadId
                : state.threadLifecycle.activeThreadId,
            preserveOrder: event.snapshot === true,
          },
        ),
      );
    }
    case "thread/status/changed": {
      const threadId = canonicalThreadId(state, event.threadId);
      const currentThread = state.threads[threadId];
      const currentStatus = currentThread?.status;
      if (!currentThread) return state;
      const status =
        currentStatus &&
        isPreviewThreadStatus(event.status) &&
        preservesAgainstPreviewSnapshot(currentStatus) &&
        !isArchivedToLoadedStatus(currentStatus, event.status)
          ? currentStatus
          : event.status;
      const baseRuntime =
        event.runtimeStatus && status === event.status
          ? mergeRuntimeStatus(currentThread.runtime, event.runtimeStatus)
          : threadRuntimeFromStatus(status);
      const runtime = runtimeWithServerRequestOverlay(
        state,
        { ...currentThread, runtime: baseRuntime, status },
        baseRuntime.status,
      );
      return threadEntityStore.pruneSnapshots(
        commitThreadEntity(
          state,
          {
            ...currentThread,
            runtime,
            status,
          },
          { preserveOrder: true },
        ),
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

function mergeThread(
  current: AgentThread,
  incoming: AgentThread | undefined,
): AgentThread {
  const { metadata: _currentMetadata, ...currentThread } = current;
  void _currentMetadata;
  const metadata = {
    ...current.metadata,
    ...(incoming?.metadata ?? {}),
  };
  delete metadata.optimistic;
  delete metadata.operationId;
  return sanitizeThread({
    ...currentThread,
    ...(incoming?.ephemeral !== undefined ? { ephemeral: incoming.ephemeral } : {}),
    ...(incoming?.name ? { name: incoming.name } : {}),
    ...(incoming?.path !== undefined ? { path: incoming.path } : {}),
    id: incoming?.id ?? current.id,
    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
  });
}

function canonicalThread(thread: AgentThread, threadId: ThreadId): AgentThread {
  return thread.id === threadId ? thread : { ...thread, id: threadId };
}

function canonicalTurn(turn: AgentTurn, threadId: ThreadId): AgentTurn {
  return turn.threadId === threadId ? turn : { ...turn, threadId };
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
        ...mergeThread(pendingThread.thread, canonicalThread?.thread),
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
