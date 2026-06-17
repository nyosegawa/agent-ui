import type {
  AgentError,
  AgentOperationView,
  AgentThread,
  AgentThreadCollection,
  AgentThreadScope,
  ThreadId,
  ThreadLifecycleState,
  ThreadState,
  ThreadStatus,
} from "../state";
import { AGENT_RETENTION_POLICY, boundedUniqueAppend } from "../retention";

export const DEFAULT_THREAD_COLLECTION_KEY = "all";

export interface ThreadLifecycleStore {
  createInitialState(): ThreadLifecycleState;
  activeThreadId(state: ThreadLifecycleState): ThreadId | undefined;
  collectionKey(scope: AgentThreadScope | string): string;
  defaultScope(): AgentThreadScope;
  ensureCollection(
    state: ThreadLifecycleState,
    scope: AgentThreadScope,
  ): ThreadLifecycleState;
  upsertThread(
    state: ThreadLifecycleState,
    thread: ThreadState,
    options?: {
      activeThreadId?: ThreadId;
      collectionKeys?: readonly string[];
      preserveOrder?: boolean;
    },
  ): ThreadLifecycleState;
  setActiveThread(
    state: ThreadLifecycleState,
    threadId: ThreadId | undefined,
  ): ThreadLifecycleState;
  reconcileThread(
    state: ThreadLifecycleState,
    pendingThreadId: ThreadId,
    canonicalThreadId: ThreadId,
  ): ThreadLifecycleState;
  upsertOperation(
    state: ThreadLifecycleState,
    operation: AgentOperationView,
  ): ThreadLifecycleState;
  removeThreadIds(
    state: ThreadLifecycleState,
    retainedThreadIds: ReadonlySet<ThreadId>,
  ): ThreadLifecycleState;
  collectionRefreshStarted(
    state: ThreadLifecycleState,
    scope: AgentThreadScope,
  ): ThreadLifecycleState;
  collectionPageReceived(
    state: ThreadLifecycleState,
    scope: AgentThreadScope,
    ids: readonly ThreadId[],
    options?: { nextCursor?: string | null; replace?: boolean; syncedAt?: number },
  ): ThreadLifecycleState;
  collectionSynced(
    state: ThreadLifecycleState,
    scope: AgentThreadScope,
    options?: { nextCursor?: string | null; syncedAt?: number },
  ): ThreadLifecycleState;
  collectionFailed(
    state: ThreadLifecycleState,
    scope: AgentThreadScope,
    error: AgentError,
  ): ThreadLifecycleState;
}

export const threadLifecycleStore: ThreadLifecycleStore = {
  activeThreadId,
  collectionFailed,
  collectionKey,
  collectionPageReceived,
  collectionRefreshStarted,
  collectionSynced,
  createInitialState: createInitialThreadLifecycleState,
  defaultScope,
  ensureCollection,
  reconcileThread,
  removeThreadIds,
  setActiveThread,
  upsertOperation,
  upsertThread,
};

export function createInitialThreadLifecycleState(): ThreadLifecycleState {
  const collection = createCollection(defaultScope());
  return {
    aliasById: {},
    collections: {
      [collection.key]: collection,
    },
    defaultCollectionKey: collection.key,
    operations: {},
  };
}

export function defaultScope(): AgentThreadScope {
  return { key: DEFAULT_THREAD_COLLECTION_KEY, kind: "all" };
}

export function collectionKey(scope: AgentThreadScope | string): string {
  if (typeof scope === "string") return scope;
  if (scope.key) return scope.key;
  if (scope.kind === "all") return DEFAULT_THREAD_COLLECTION_KEY;
  if (scope.kind === "history") {
    const archived = scope.archived === undefined ? "all" : String(scope.archived);
    return [
      "history",
      scope.cwd ?? "",
      scope.searchTerm ?? "",
      archived,
    ].join(":");
  }
  return scope.key;
}

export function activeThreadId(state: ThreadLifecycleState): ThreadId | undefined {
  return state.activeThreadId
    ? canonicalThreadId(state, state.activeThreadId)
    : undefined;
}

export function ensureCollection(
  state: ThreadLifecycleState,
  scope: AgentThreadScope,
): ThreadLifecycleState {
  const key = collectionKey(scope);
  if (state.collections[key]) {
    return updateCollection(state, key, (collection) => ({
      ...collection,
      scope: { ...scope, key },
    }));
  }
  return {
    ...state,
    collections: {
      ...state.collections,
      [key]: createCollection({ ...scope, key }),
    },
  };
}

export function upsertThread(
  state: ThreadLifecycleState,
  thread: ThreadState,
  options: {
    activeThreadId?: ThreadId;
    collectionKeys?: readonly string[];
    preserveOrder?: boolean;
  } = {},
): ThreadLifecycleState {
  let next = state;
  const activeThreadId = options.activeThreadId ?? state.activeThreadId;
  if (activeThreadId !== state.activeThreadId) {
    next = setActiveThread(next, activeThreadId);
  }

  const collectionKeys = options.collectionKeys ?? [state.defaultCollectionKey];
  for (const key of collectionKeys) {
    const existing = next.collections[key] ?? createCollection({ kind: "custom", key });
    const ids =
      options.preserveOrder && existing.ids.includes(thread.id)
        ? existing.ids
        : boundedUniqueAppend(
            existing.ids.filter((id) => id !== thread.id),
            thread.id,
            AGENT_RETENTION_POLICY.threadCollectionEntriesMax,
          );
    next = {
      ...next,
      collections: {
        ...next.collections,
        [key]: {
          ...existing,
          ids,
        },
      },
    };
  }
  return next;
}

export function setActiveThread(
  state: ThreadLifecycleState,
  threadId: ThreadId | undefined,
): ThreadLifecycleState {
  const canonical = threadId ? canonicalThreadId(state, threadId) : undefined;
  return state.activeThreadId === canonical ? state : { ...state, activeThreadId: canonical };
}

export function reconcileThread(
  state: ThreadLifecycleState,
  pendingThreadId: ThreadId,
  canonicalThreadIdValue: ThreadId,
): ThreadLifecycleState {
  if (pendingThreadId === canonicalThreadIdValue) return state;
  const aliasById = {
    ...state.aliasById,
    [pendingThreadId]: canonicalThreadIdValue,
  };
  const replaceId = (id: ThreadId) =>
    id === pendingThreadId ? canonicalThreadIdValue : id;
  const collections = Object.fromEntries(
    Object.entries(state.collections).map(([key, collection]) => [
      key,
      {
        ...collection,
        ids: unique(collection.ids.map(replaceId)),
      },
    ]),
  );
  return {
    ...state,
    activeThreadId:
      state.activeThreadId === pendingThreadId ? canonicalThreadIdValue : state.activeThreadId,
    aliasById,
    collections,
    operations: Object.fromEntries(
      Object.entries(state.operations).map(([id, operation]) => [
        id,
        operation.threadId === pendingThreadId
          ? { ...operation, threadId: canonicalThreadIdValue }
          : operation,
      ]),
    ),
  };
}

export function upsertOperation(
  state: ThreadLifecycleState,
  operation: AgentOperationView,
): ThreadLifecycleState {
  return {
    ...state,
    operations: {
      ...state.operations,
      [operation.id]: operation,
    },
  };
}

export function removeThreadIds(
  state: ThreadLifecycleState,
  retainedThreadIds: ReadonlySet<ThreadId>,
): ThreadLifecycleState {
  let changed = false;
  const collections = Object.fromEntries(
    Object.entries(state.collections).map(([key, collection]) => {
      const ids = collection.ids.filter((id) => retainedThreadIds.has(id));
      if (ids.length !== collection.ids.length) changed = true;
      return [key, { ...collection, ids }];
    }),
  );
  if (!changed) return state;
  return { ...state, collections };
}

export function collectionRefreshStarted(
  state: ThreadLifecycleState,
  scope: AgentThreadScope,
): ThreadLifecycleState {
  const next = ensureCollection(state, scope);
  const key = collectionKey(scope);
  return updateCollection(next, key, (collection) => ({
    ...collection,
    error: undefined,
    status: "loading",
  }));
}

export function collectionPageReceived(
  state: ThreadLifecycleState,
  scope: AgentThreadScope,
  ids: readonly ThreadId[],
  options: { nextCursor?: string | null; replace?: boolean; syncedAt?: number } = {},
): ThreadLifecycleState {
  const next = ensureCollection(state, scope);
  const key = collectionKey(scope);
  return updateCollection(next, key, (collection) => ({
    ...collection,
    error: undefined,
    ids: boundedUniqueThreadIds(options.replace ? ids : [...collection.ids, ...ids]),
    nextCursor:
      options.nextCursor === undefined ? collection.nextCursor : options.nextCursor,
    status: "ready",
    syncedAt: options.syncedAt ?? collection.syncedAt,
  }));
}

function boundedUniqueThreadIds(ids: readonly ThreadId[]): ThreadId[] {
  return unique(ids).slice(-AGENT_RETENTION_POLICY.threadCollectionEntriesMax);
}

export function collectionSynced(
  state: ThreadLifecycleState,
  scope: AgentThreadScope,
  options: { nextCursor?: string | null; syncedAt?: number } = {},
): ThreadLifecycleState {
  const next = ensureCollection(state, scope);
  const key = collectionKey(scope);
  return updateCollection(next, key, (collection) => ({
    ...collection,
    error: undefined,
    nextCursor:
      options.nextCursor === undefined ? collection.nextCursor : options.nextCursor,
    status: "ready",
    syncedAt: options.syncedAt ?? Date.now(),
  }));
}

export function collectionFailed(
  state: ThreadLifecycleState,
  scope: AgentThreadScope,
  error: AgentError,
): ThreadLifecycleState {
  const next = ensureCollection(state, scope);
  const key = collectionKey(scope);
  return updateCollection(next, key, (collection) => ({
    ...collection,
    error,
    status: "error",
  }));
}

export function threadActivityFromStatus(status?: ThreadStatus): ThreadState["activity"] {
  if (status === "running") return "running";
  if (status === "waitingForInput") return "waitingForInput";
  if (status === "error" || status === "failed" || status === "systemError") {
    return "failed";
  }
  return "idle";
}

export function threadAvailabilityFromStatus(
  status?: ThreadStatus,
): ThreadState["availability"] {
  if (status === "archived") return "archived";
  if (status === "closed") return "closed";
  if (status === "notLoaded") return "preview";
  return "available";
}

export function threadStorageFromThread(thread: AgentThread): ThreadState["storage"] {
  if (thread.ephemeral === true) return "ephemeral";
  if (thread.ephemeral === false) return "stored";
  return "unknown";
}

export function threadMetadataFromThread(thread: AgentThread): ThreadState["metadata"] {
  return {
    ...(thread.path ? { cwd: thread.path } : {}),
    ...(thread.name ? { title: thread.name } : {}),
  };
}

function canonicalThreadId(
  state: ThreadLifecycleState,
  threadId: ThreadId,
): ThreadId {
  let current = threadId;
  const seen = new Set<ThreadId>();
  while (state.aliasById[current] && !seen.has(current)) {
    seen.add(current);
    current = state.aliasById[current]!;
  }
  return current;
}

function createCollection(scope: AgentThreadScope): AgentThreadCollection {
  const key = collectionKey(scope);
  return {
    ids: [],
    key,
    nextCursor: null,
    scope: { ...scope, key },
    status: "idle",
  };
}

function updateCollection(
  state: ThreadLifecycleState,
  key: string,
  updater: (collection: AgentThreadCollection) => AgentThreadCollection,
): ThreadLifecycleState {
  const collection = state.collections[key];
  if (!collection) return state;
  return {
    ...state,
    collections: {
      ...state.collections,
      [key]: updater(collection),
    },
  };
}

function unique(ids: readonly ThreadId[]): ThreadId[] {
  return [...new Set(ids)];
}
