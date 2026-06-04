import {
  selectOrderedCollectionThreads,
  selectThreadCollection,
  selectThreadView,
  type AgentError,
  type AgentThreadCollection,
  type AgentThreadScope,
  type AgentThreadView,
  type ThreadId,
} from "@nyosegawa/agent-ui-core";
import { useCallback, useMemo, useRef, useState } from "react";
import { useAgentContext } from "../provider";
import {
  codexThreadHistoryParams,
  type ThreadHistoryParams,
  type ThreadResumeOptions,
} from "../request-options";
import { rawThreadId, threadUpsertEvent } from "../thread-history";
import { useCodexSession } from "./codex-session";
import { useAgentThread, useAgentThreadReader } from "./thread";

export interface AgentThreadListController {
  activateThread: (threadId: ThreadId) => Promise<ThreadId>;
  collection?: AgentThreadCollection;
  error?: AgentError;
  hasLoaded: boolean;
  invalidate: () => void;
  isLoading: boolean;
  listThreads: (params?: AgentThreadListRequest) => Promise<AgentThreadListResult>;
  loadNextPage: () => Promise<AgentThreadListResult | undefined>;
  nextCursor: string | null;
  previewThread: (threadId: ThreadId) => Promise<void>;
  refresh: () => Promise<AgentThreadListResult>;
  resumeThread: (threadId: ThreadId, params?: ThreadResumeOptions) => Promise<ThreadId>;
  scope: AgentThreadScope;
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  threads: AgentThreadView[];
}

export interface AgentThreadListRequest extends ThreadHistoryParams {
  append?: boolean;
}

export interface AgentThreadListResult extends AgentThreadHistorySyncedEvent {
  stale: boolean;
}

export interface AgentThreadListControllerOptions {
  onHistorySynced?: (event: AgentThreadHistorySyncedEvent) => void;
}

export interface AgentThreadHistorySyncedEvent {
  append: boolean;
  nextCursor: string | null;
  scope: AgentThreadScope;
  searchTerm?: string;
  syncedAt: number;
  threadIds: ThreadId[];
}

const DEFAULT_HISTORY_SCOPE: AgentThreadScope = { kind: "history" };

export function useAgentThreadListController(
  scope: AgentThreadScope = DEFAULT_HISTORY_SCOPE,
  options: AgentThreadListControllerOptions = {},
): AgentThreadListController {
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const threadController = useAgentThread();
  const { readThread } = useAgentThreadReader();
  const onHistorySynced = options.onHistorySynced;
  const requestSequenceRef = useRef(0);
  const [searchTerm, setSearchTerm] = useState(
    scope.kind === "history" ? (scope.searchTerm ?? "") : "",
  );
  const collectionScope = useMemo(
    () => threadListScope(scope, searchTerm),
    [scope, searchTerm],
  );
  const collection = selectThreadCollection(state, collectionScope);
  const threads = useMemo(
    () =>
      selectOrderedCollectionThreads(state, collectionScope).flatMap((thread) => {
        const view = selectThreadView(state, thread.id);
        return view ? [view] : [];
      }),
    [collectionScope, state],
  );
  const isLoading = collection?.status === "loading";
  const error = collection?.error;
  const nextCursor = collection?.nextCursor ?? null;
  const hasLoaded =
    collection?.status === "ready" ||
    collection?.status === "error" ||
    collection?.syncedAt != null;

  const listThreads = useCallback(
    async (params: AgentThreadListRequest = {}) => {
      const requestSequence = ++requestSequenceRef.current;
      const requestSearchTerm =
        params.searchTerm == null ? searchTerm : String(params.searchTerm);
      const requestScope = threadListScope(scope, requestSearchTerm);
      dispatch({ scope: requestScope, type: "thread/collection/refreshStarted" });
      try {
        const response = await codex.thread.list(
          codexThreadHistoryParams({
            archived:
              params.archived ?? (requestScope.kind === "history"
                ? requestScope.archived
                : undefined),
            cursor: params.cursor,
            cwd:
              params.cwd ?? (requestScope.kind === "history" ? requestScope.cwd : undefined),
            limit: params.limit,
            modelProviders: params.modelProviders,
            searchTerm: requestSearchTerm || undefined,
            sortDirection: params.sortDirection ?? "desc",
            sortKey: params.sortKey ?? "updated_at",
            sourceKinds: params.sourceKinds,
            useStateDbOnly: params.useStateDbOnly,
          }),
        );
        const responseRecord = asRecord(response) ?? {};
        const rawThreads = responseThreads(responseRecord);
        const threadIds: ThreadId[] = [];
        for (const rawThread of rawThreads) {
          const threadId = rawThreadId(rawThread);
          if (!threadId) continue;
          threadIds.push(threadId);
        }
        const nextCursor = responseCursor(responseRecord);
        const syncedAt = Date.now();
        const result: AgentThreadListResult = {
          append: Boolean(params.append),
          nextCursor,
          scope: requestScope,
          searchTerm: requestSearchTerm || undefined,
          stale: requestSequence !== requestSequenceRef.current,
          syncedAt,
          threadIds,
        };
        if (result.stale) return result;
        for (const rawThread of rawThreads) {
          if (rawThreadId(rawThread)) dispatch(threadUpsertEvent(rawThread));
        }
        dispatch({
          ids: threadIds,
          nextCursor,
          replace: !params.append,
          scope: requestScope,
          syncedAt,
          type: "thread/collection/pageReceived",
        });
        dispatch({
          nextCursor,
          scope: requestScope,
          syncedAt,
          type: "thread/collection/synced",
        });
        onHistorySynced?.(result);
        return result;
      } catch (caught) {
        if (requestSequence !== requestSequenceRef.current) throw caught;
        const nextError = errorToAgentError(caught);
        dispatch({
          error: nextError,
          scope: requestScope,
          type: "thread/collection/failed",
        });
        throw caught;
      }
    },
    [codex, dispatch, onHistorySynced, scope, searchTerm],
  );

  const refresh = useCallback(
    () =>
      listThreads({
        cursor: null,
        limit: 25,
        searchTerm,
      }),
    [listThreads, searchTerm],
  );

  const loadNextPage = useCallback(() => {
    if (!nextCursor || isLoading) return Promise.resolve(undefined);
    return listThreads({
      append: true,
      cursor: nextCursor,
      limit: 25,
      searchTerm,
    });
  }, [isLoading, listThreads, nextCursor, searchTerm]);

  const invalidate = useCallback(() => {
    dispatch({
      ids: [],
      nextCursor: null,
      replace: true,
      scope: collectionScope,
      syncedAt: Date.now(),
      type: "thread/collection/pageReceived",
    });
  }, [collectionScope, dispatch]);

  const previewThread = useCallback(
    async (threadId: ThreadId) => {
      await readThread(threadId, {
        activate: false,
        includeTurns: true,
      });
    },
    [readThread],
  );

  const activateThread = useCallback(
    async (threadId: ThreadId) => {
      const response = await readThread(threadId, {
        activate: true,
        includeTurns: true,
      });
      return responseThreadId(response) ?? threadId;
    },
    [readThread],
  );

  const resumeThread = useCallback(
    async (threadId: ThreadId, params?: ThreadResumeOptions) => {
      const response = await threadController.resumeThread(threadId, params);
      return responseThreadId(response) ?? threadId;
    },
    [threadController],
  );

  return {
    activateThread,
    collection,
    error,
    hasLoaded,
    invalidate,
    isLoading,
    listThreads,
    loadNextPage,
    nextCursor,
    previewThread,
    refresh,
    resumeThread,
    scope: collectionScope,
    searchTerm,
    setSearchTerm,
    threads,
  };
}

function threadListScope(scope: AgentThreadScope, searchTerm: string): AgentThreadScope {
  if (scope.kind !== "history") return scope;
  return {
    ...scope,
    searchTerm: searchTerm || undefined,
  };
}

function responseThreads(response: Record<string, unknown>): Record<string, unknown>[] {
  const rawThreads = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.threads)
      ? response.threads
      : [];
  return rawThreads.filter(isRecord);
}

function responseThreadId(response: unknown): ThreadId | undefined {
  const responseRecord = asRecord(response);
  const rawThread = asRecord(responseRecord?.thread) ?? responseRecord;
  return rawThread ? rawThreadId(rawThread) : undefined;
}

function responseCursor(response: Record<string, unknown>): string | null {
  return stringValue(response.nextCursor) ?? stringValue(response.next_cursor) ?? null;
}

function errorToAgentError(error: unknown): AgentError {
  if (error instanceof Error) return { message: error.message };
  return { message: String(error) };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
