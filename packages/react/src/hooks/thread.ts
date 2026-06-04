import {
  selectActiveThread,
  selectOrderedThreads,
  selectOrderedTurns,
  selectRunSettings,
  selectThread,
  selectThreadLifecycle,
  type ThreadId,
  type ThreadState,
} from "@nyosegawa/agent-ui-core";
import {
  normalizeThreadReadResponse,
  normalizeThreadResumeResponse,
} from "@nyosegawa/agent-ui-codex/normalizer";
import { useCallback, useMemo, useState } from "react";
import { useAgentComposerQueueStore } from "../composer-queue";
import { useAgentContext } from "../provider";
import {
  codexThreadForkParams,
  codexThreadHistoryParams,
  codexThreadResumeParams,
  codexThreadStartParams,
  type ThreadForkOptions,
  type ThreadHistoryParams,
  type ThreadResumeOptions,
  type ThreadStartOptions,
} from "../request-options";
import {
  rawThreadId,
  threadProjectPath,
  threadUpsertEvent,
} from "../thread-history";
import { useCodexSession } from "./codex-session";

export type {
  ThreadForkOptions,
  ThreadHistoryParams,
  ThreadResumeOptions,
  ThreadStartOptions,
} from "../request-options";

export function useAgentThread(threadId?: ThreadId) {
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const resolvedThreadId = threadId ?? selectThreadLifecycle(state).activeThreadId;
  const thread: ThreadState | undefined = resolvedThreadId
    ? selectThread(state, resolvedThreadId)
    : selectActiveThread(state);
  const turns = resolvedThreadId ? selectOrderedTurns(state, resolvedThreadId) : [];
  const runSettings = selectRunSettings(state);

  const startThread = useCallback(
    async (params?: ThreadStartOptions) => {
      const result = await codex.thread.start({
        cwd: runSettings.cwd,
        model: runSettings.modelId,
        ...codexThreadStartParams(params),
      });
      const resultRecord = asRecord(result) ?? {};
      const rawThread = resultRecord.thread ?? result;
      const rawThreadRecord = asRecord(rawThread) ?? {};
      if (!hasThreadId(rawThread)) throw new Error("thread/start returned no thread id");
      const threadId = rawThreadId(rawThread);
      if (!threadId) throw new Error("thread/start returned no thread id");
      dispatch({
        status: "ready",
        thread: {
          ephemeral: Boolean(rawThreadRecord.ephemeral),
          id: threadId,
          name: stringValue(rawThreadRecord.name),
          path: threadProjectPath(rawThreadRecord),
          raw: rawThread,
        },
        type: "thread/started",
      });
      syncRunSettingsFromRawThread(dispatch, rawThreadRecord);
      return result;
    },
    [codex, dispatch, runSettings.cwd, runSettings.modelId],
  );

  const resumeThread = useCallback(
    async (id: ThreadId, params?: ThreadResumeOptions) => {
      const result = await codex.thread.resume(id, codexThreadResumeParams(params));
      const normalized = normalizeThreadResumeResponse(result, { activate: true });
      for (const event of normalized.events) dispatch(event);
      const rawThread = asRecord(result)?.thread ?? result;
      const rawThreadRecord = asRecord(rawThread);
      const canonicalThreadId = rawThreadRecord ? rawThreadId(rawThreadRecord) : undefined;
      if (canonicalThreadId && canonicalThreadId !== id) {
        dispatch({
          canonicalThreadId,
          threadId: id,
          type: "thread/reconciled",
        });
      }
      if (rawThreadRecord && hasThreadId(rawThreadRecord)) {
        syncRunSettingsFromRawThread(dispatch, rawThreadRecord);
      }
      return result;
    },
    [codex, dispatch],
  );

  return {
    resumeThread,
    startThread,
    thread,
    threadId: resolvedThreadId,
    turns,
  };
}

export const useAgentThreadController = useAgentThread;

export function useAgentThreadActions(threadId?: ThreadId) {
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const composerQueue = useAgentComposerQueueStore();
  const resolvedThreadId = threadId ?? selectThreadLifecycle(state).activeThreadId;

  const requireThreadId = useCallback(() => {
    if (!resolvedThreadId) throw new Error("No thread selected");
    return resolvedThreadId;
  }, [resolvedThreadId]);

  const renameThread = useCallback(
    async (name: string) => {
      const id = requireThreadId();
      const response = await codex.thread.setName(id, name);
      dispatch({ name, threadId: id, type: "thread/name/updated" });
      return response;
    },
    [codex, dispatch, requireThreadId],
  );

  const archiveThread = useCallback(async () => {
    const id = requireThreadId();
    const response = await codex.thread.archive(id);
    composerQueue.clearThreadFollowUps(id);
    dispatch({ status: "archived", threadId: id, type: "thread/status/changed" });
    return response;
  }, [codex, composerQueue, dispatch, requireThreadId]);

  const unarchiveThread = useCallback(async () => {
    const id = requireThreadId();
    const response = await codex.thread.unarchive(id);
    dispatch({ status: "loaded", threadId: id, type: "thread/status/changed" });
    return response;
  }, [codex, dispatch, requireThreadId]);

  const forkThread = useCallback(
    async (params: ThreadForkOptions = {}) => {
      const id = requireThreadId();
      return codex.thread.fork(id, codexThreadForkParams(params));
    },
    [codex, requireThreadId],
  );

  const compactThread = useCallback(async () => {
    const id = requireThreadId();
    return codex.thread.compactStart(id);
  }, [codex, requireThreadId]);

  const rollbackThread = useCallback(
    async (numTurns = 1) => {
      const id = requireThreadId();
      return codex.thread.rollback(id, numTurns);
    },
    [codex, requireThreadId],
  );

  return {
    archiveThread,
    compactThread,
    forkThread,
    renameThread,
    rollbackThread,
    threadId: resolvedThreadId,
    unarchiveThread,
  };
}

export function useAgentThreads() {
  const { dispatch, state } = useAgentContext();
  const activeThreadId = selectThreadLifecycle(state).activeThreadId;
  const threads = useMemo(() => selectOrderedThreads(state), [state]);
  const setActiveThread = useCallback(
    (threadId?: ThreadId) => dispatch({ threadId, type: "thread/active/set" }),
    [dispatch],
  );
  return { activeThreadId, setActiveThread, threads };
}

export function useAgentThreadHistory() {
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const [isLoading, setIsLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>();
  const [error, setError] = useState<Error | undefined>();

  const listThreads = useCallback(
    async (params: ThreadHistoryParams = {}) => {
      setIsLoading(true);
      setError(undefined);
      try {
        const response = await codex.thread.list(codexThreadHistoryParams(params));
        const responseRecord = asRecord(response);
        const rawThreads = Array.isArray(responseRecord?.data)
          ? responseRecord.data
          : Array.isArray(responseRecord?.threads)
            ? responseRecord.threads
            : [];
        for (const rawThread of rawThreads.filter(isRecordWithThreadId)) {
          dispatch(threadUpsertEvent(rawThread));
        }
        setCursor(
          stringValue(responseRecord?.nextCursor) ??
            stringValue(responseRecord?.next_cursor) ??
            null,
        );
        return responseRecord ?? {};
      } catch (caught) {
        const nextError = caught instanceof Error ? caught : new Error(String(caught));
        setError(nextError);
        throw nextError;
      } finally {
        setIsLoading(false);
      }
    },
    [codex, dispatch],
  );

  return {
    cursor,
    error,
    isLoading,
    listThreads,
    threads: selectOrderedThreads(state),
  };
}

export function useAgentThreadReader() {
  const { dispatch } = useAgentContext();
  const codex = useCodexSession();
  const readThread = useCallback(
    async (
      threadId: ThreadId,
      options: { activate?: boolean; includeTurns?: boolean } = {},
    ) => {
      const response = await codex.thread.read(threadId, options.includeTurns ?? true);
      const rawThread = asRecord(response)?.thread ?? response;
      let events;
      try {
        events = normalizeThreadReadResponse(response, {
          activate: options.activate ?? true,
        });
      } catch (caught) {
        if (caught instanceof Error && caught.message.includes("missing a thread id")) {
          throw new Error(`thread/read returned no thread for ${threadId}`, { cause: caught });
        }
        throw caught;
      }
      const rawThreadRecord = rawThread as Record<string, unknown>;
      for (const event of events) dispatch(event);
      if (options.activate !== false) {
        syncRunSettingsFromRawThread(dispatch, rawThreadRecord);
      }
      return response;
    },
    [codex, dispatch],
  );
  return { readThread };
}

function hasThreadId(value: unknown): value is Record<string, unknown> {
  const record = asRecord(value);
  return record ? rawThreadId(record) != null : false;
}

function isRecordWithThreadId(value: unknown): value is Record<string, unknown> {
  return hasThreadId(value);
}

function syncRunSettingsFromRawThread(
  dispatch: ReturnType<typeof useAgentContext>["dispatch"],
  rawThread: Record<string, unknown>,
) {
  const cwd = threadProjectPath(rawThread);
  const modelId = stringValue(rawThread.modelId) ?? stringValue(rawThread.model);
  const effort = stringValue(rawThread.effort) ?? stringValue(rawThread.reasoningEffort);
  if (cwd || modelId || effort) {
    dispatch({
      cwd,
      effort,
      modelId,
      type: "runSettings/updated",
    });
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
