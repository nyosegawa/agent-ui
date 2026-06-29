import {
  selectActiveThread,
  selectOrderedThreads,
  selectOrderedTurns,
  selectRunSettings,
  selectThread,
  selectThreadLifecycle,
  type AgentEvent,
  type ThreadId,
  type ThreadState,
  type ThreadStatus,
} from "@nyosegawa/agent-ui-core/internal";
import {
  normalizeThreadReadResponse,
  normalizeThreadResumeResponse,
} from "@nyosegawa/agent-ui-codex/normalizer";
import { useCallback, useMemo, useState } from "react";
import { useAgentComposerQueueStore } from "../composer-queue";
import { useInternalAgentContext } from "../provider";
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
import type {
  AgentThreadForkResult,
  AgentThreadHistoryResult,
  AgentThreadReadResult,
  AgentThreadResumeDiagnosticReasonCode,
  AgentThreadResumeResult,
  AgentThreadStartResult,
} from "./thread-lifecycle-types";
import {
  runSettingsFromRawThread,
  syncRunSettingsFromRawThread,
} from "./thread-run-settings";

export type {
  ThreadForkOptions,
  ThreadHistoryParams,
  ThreadResumeOptions,
  ThreadStartOptions,
} from "../request-options";
export type {
  AgentThreadForkResult,
  AgentThreadHistoryResult,
  AgentThreadReadResult,
  AgentThreadResumeDiagnosticReasonCode,
  AgentThreadResumeResult,
  AgentThreadStartResult,
  AgentThreadStartWithInputResult,
} from "./thread-lifecycle-types";

export function useAgentThread(threadId?: ThreadId) {
  const { dispatch, state } = useInternalAgentContext();
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
        },
        type: "thread/started",
      });
      syncRunSettingsFromRawThread(dispatch, rawThreadRecord);
      return { threadId } satisfies AgentThreadStartResult;
    },
    [codex, dispatch, runSettings.cwd, runSettings.modelId],
  );

  const resumeThread = useCallback(
    async (id: ThreadId, params?: ThreadResumeOptions) => {
      const result = await codex.thread.resume(id, codexThreadResumeParams(params));
      const resultRecord = asRecord(result) ?? {};
      const rawThread = resultRecord.thread ?? result;
      const rawThreadRecord = asRecord(rawThread);
      const canonicalThreadId = rawThreadRecord ? rawThreadId(rawThreadRecord) : undefined;
      const resumeRunSettings = rawThreadRecord
        ? runSettingsFromRawThread({ ...rawThreadRecord, ...resultRecord })
        : undefined;
      let normalized: ReturnType<typeof normalizeThreadResumeResponse>;
      try {
        normalized = normalizeThreadResumeResponse(result, { activate: true });
      } catch (caught) {
        dispatchResumeDiagnostic(dispatch, {
          reasonCode: canonicalThreadId
            ? "resume_response_normalization_failed"
            : "resume_response_missing_thread_id",
          requestedThreadId: id,
          threadId: canonicalThreadId,
        });
        throw caught;
      }
      for (const event of normalized.events) dispatch(event);
      if (canonicalThreadId && canonicalThreadId !== id) {
        dispatch({
          canonicalThreadId,
          threadId: id,
          type: "thread/reconciled",
        });
        dispatchResumeDiagnostic(dispatch, {
          reasonCode: "canonical_thread_id_mismatch",
          requestedThreadId: id,
          threadId: canonicalThreadId,
        });
      }
      if (rawThreadRecord && hasThreadId(rawThreadRecord)) {
        if (resumeRunSettings) {
          dispatch({
            ...resumeRunSettings,
            type: "runSettings/updated",
          });
        }
      }
      const resolvedThreadId = canonicalThreadId ?? id;
      const status = threadStatusFromEvents(normalized.events, resolvedThreadId);
      const activeTurnId = latestRunningTurnIdFromEvents(
        normalized.events,
        resolvedThreadId,
      );
      return {
        ...(activeTurnId ? { activeTurnId } : {}),
        ...(status ? { activity: threadActivityFromStatus(status), status } : {}),
        ...(resolvedThreadId !== id ? { requestedThreadId: id } : {}),
        ...(resumeRunSettings ? { runSettings: resumeRunSettings } : {}),
        threadId: resolvedThreadId,
      } satisfies AgentThreadResumeResult;
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
  const { dispatch, state } = useInternalAgentContext();
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
      await codex.thread.setName(id, name);
      dispatch({ name, threadId: id, type: "thread/name/updated" });
    },
    [codex, dispatch, requireThreadId],
  );

  const archiveThread = useCallback(async () => {
    const id = requireThreadId();
    await codex.thread.archive(id);
    composerQueue.clearThreadFollowUps(id);
    dispatch({ status: "archived", threadId: id, type: "thread/status/changed" });
  }, [codex, composerQueue, dispatch, requireThreadId]);

  const unarchiveThread = useCallback(async () => {
    const id = requireThreadId();
    await codex.thread.unarchive(id);
    dispatch({ status: "loaded", threadId: id, type: "thread/status/changed" });
  }, [codex, dispatch, requireThreadId]);

  const forkThread = useCallback(
    async (params: ThreadForkOptions = {}) => {
      const id = requireThreadId();
      const response = await codex.thread.fork(id, codexThreadForkParams(params));
      return { threadId: responseThreadId(response) ?? id } satisfies AgentThreadForkResult;
    },
    [codex, requireThreadId],
  );

  const compactThread = useCallback(async () => {
    const id = requireThreadId();
    await codex.thread.compactStart(id);
  }, [codex, requireThreadId]);

  const rollbackThread = useCallback(
    async (numTurns = 1) => {
      const id = requireThreadId();
      await codex.thread.rollback(id, numTurns);
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
  const { dispatch, state } = useInternalAgentContext();
  const activeThreadId = selectThreadLifecycle(state).activeThreadId;
  const threads = useMemo(() => selectOrderedThreads(state), [state]);
  const setActiveThread = useCallback(
    (threadId?: ThreadId) => dispatch({ threadId, type: "thread/active/set" }),
    [dispatch],
  );
  return { activeThreadId, setActiveThread, threads };
}

export function useAgentThreadHistory() {
  const { dispatch, state } = useInternalAgentContext();
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
        const threadIds: ThreadId[] = [];
        for (const rawThread of rawThreads.filter(isRecordWithThreadId)) {
          dispatch(threadUpsertEvent(rawThread));
          const threadId = rawThreadId(rawThread);
          if (threadId) threadIds.push(threadId);
        }
        const nextCursor =
          stringValue(responseRecord?.nextCursor) ??
          stringValue(responseRecord?.next_cursor) ??
          null;
        setCursor(nextCursor);
        return { nextCursor, threadIds } satisfies AgentThreadHistoryResult;
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
  const { dispatch } = useInternalAgentContext();
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
      return { threadId: rawThreadId(rawThreadRecord) ?? threadId } satisfies AgentThreadReadResult;
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

function threadStatusFromEvents(
  events: readonly AgentEvent[],
  threadId: ThreadId,
): ThreadStatus | undefined {
  let status: ThreadStatus | undefined;
  for (const event of events) {
    if (event.type === "thread/status/changed" && event.threadId === threadId) {
      status = event.status;
    }
    if (
      (event.type === "thread/started" || event.type === "thread/upserted") &&
      event.thread.id === threadId &&
      event.status
    ) {
      status = event.status;
    }
  }
  return status;
}

function latestRunningTurnIdFromEvents(
  events: readonly AgentEvent[],
  threadId: ThreadId,
): string | undefined {
  let turnId: string | undefined;
  for (const event of events) {
    if (
      event.type === "turn/started" &&
      event.threadId === threadId &&
      isRunningTurnStatus(event.turn.status)
    ) {
      turnId = event.turn.id;
    }
    if (
      (event.type === "thread/started" || event.type === "thread/upserted") &&
      event.thread.id === threadId
    ) {
      for (const turn of event.turns ?? []) {
        if (isRunningTurnStatus(turn.status, event.status)) turnId = turn.id;
      }
    }
  }
  return turnId;
}

function isRunningTurnStatus(
  turnStatus: string | undefined,
  threadStatus?: ThreadStatus,
): boolean {
  return (
    turnStatus === "running" ||
    turnStatus === "inProgress" ||
    (threadStatus === "running" &&
      turnStatus !== "completed" &&
      turnStatus !== "interrupted")
  );
}

function threadActivityFromStatus(status: ThreadStatus): ThreadState["activity"] {
  if (status === "running") return "running";
  if (status === "waitingForInput") return "waitingForInput";
  if (status === "error" || status === "failed" || status === "systemError") {
    return "failed";
  }
  return "idle";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function dispatchResumeDiagnostic(
  dispatch: ReturnType<typeof useInternalAgentContext>["dispatch"],
  diagnostic: {
    reasonCode: AgentThreadResumeDiagnosticReasonCode;
    requestedThreadId: ThreadId;
    threadId?: ThreadId;
  },
) {
  dispatch({
    type: "warning/added",
    warning: {
      audience: ["developer", "audit"],
      id: [
        "thread-resume",
        diagnostic.reasonCode,
        diagnostic.requestedThreadId,
        diagnostic.threadId,
      ]
        .filter(Boolean)
        .join(":"),
      message: resumeDiagnosticMessage(diagnostic),
      reasonCode: diagnostic.reasonCode,
      requestedThreadId: diagnostic.requestedThreadId,
      threadId: diagnostic.threadId,
    },
  });
}

function resumeDiagnosticMessage(diagnostic: {
  reasonCode: AgentThreadResumeDiagnosticReasonCode;
  requestedThreadId: ThreadId;
  threadId?: ThreadId;
}) {
  switch (diagnostic.reasonCode) {
    case "canonical_thread_id_mismatch":
      return `thread/resume returned canonical thread id ${diagnostic.threadId} for requested thread id ${diagnostic.requestedThreadId}.`;
    case "resume_response_missing_thread_id":
      return `thread/resume response did not include a usable thread id for requested thread id ${diagnostic.requestedThreadId}.`;
    case "resume_response_normalization_failed":
      return `thread/resume response normalization failed for requested thread id ${diagnostic.requestedThreadId}.`;
    default:
      return assertNever(diagnostic.reasonCode);
  }
}

function responseThreadId(response: unknown): ThreadId | undefined {
  const responseRecord = asRecord(response);
  const rawThread = asRecord(responseRecord?.thread) ?? responseRecord;
  return rawThread ? rawThreadId(rawThread) : undefined;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled resume diagnostic reason: ${String(value)}`);
}
