import {
  selectActiveThread,
  selectLatestRunningTurnId,
  selectOrderedThreads,
  selectOrderedTurns,
  selectRunSettings,
  selectThread,
  selectThreadRegistry,
  type ThreadId,
  type ThreadState,
} from "@nyosegawa/agent-ui-core";
import { useCallback, useMemo, useState } from "react";
import type {
  ThreadForkParams,
  ThreadListParams,
  ThreadResumeParams,
  ThreadStartParams,
} from "@nyosegawa/agent-ui-codex/stable-types";
import type { AgentUserInput } from "./agent-input";
import { useAgentContext } from "./provider";
import {
  useAgentComposerQueueStore,
  type QueuedFollowUpAttachment,
} from "./composer-queue";
import {
  rawThreadId,
  threadProjectPath,
  threadSnapshotEvents,
  threadUpsertEvent,
} from "./thread-history";
import { useAgentI18n, type AgentI18nKey } from "./i18n";
import { useCodexSession } from "./hooks/codex-session";
import { AGENT_EXECUTION_MODES } from "./hooks/run-settings";
import { useAgentTurn } from "./hooks/turn";
import {
  codexReasoningEffort,
  normalizeTurnInput,
  summarizeUserInput,
  textAgentInput,
} from "./hooks/turn-input";

export {
  useAgentAuth,
  useAgentBootstrap,
  useAgentUsage,
  type AgentBootstrapState,
} from "./hooks/account";
export {
  useAgentApps,
  useAgentHooks,
  useAgentModels,
  useAgentSkills,
} from "./hooks/connectors";
export { useAgentApprovals, useAgentServerRequests } from "./hooks/approvals";
export {
  AGENT_EXECUTION_MODES,
  useAgentRunSettings,
  type AgentExecutionMode,
} from "./hooks/run-settings";
export { useAgentTurn, useAgentTurnController } from "./hooks/turn";

type ThreadForkOptions = Omit<ThreadForkParams, "threadId">;
type ThreadResumeOptions = Omit<ThreadResumeParams, "threadId">;

export function useAgentThread(threadId?: ThreadId) {
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const resolvedThreadId = threadId ?? selectThreadRegistry(state).activeThreadId;
  const thread: ThreadState | undefined = resolvedThreadId
    ? selectThread(state, resolvedThreadId)
    : selectActiveThread(state);
  const turns = resolvedThreadId ? selectOrderedTurns(state, resolvedThreadId) : [];
  const runSettings = selectRunSettings(state);

  const startThread = useCallback(
    async (params?: ThreadStartParams) => {
      const result = await codex.thread.start({
        cwd: runSettings.cwd,
        model: runSettings.modelId,
        ...params,
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

  const startThreadWithInput = useCallback(
    async (
      input: string | AgentUserInput[],
      params?: ThreadStartParams,
    ) => {
      const result = await startThread(params);
      const rawThread = asRecord(result)?.thread ?? result;
      const rawThreadRecord = asRecord(rawThread);
      const threadId = rawThreadRecord ? rawThreadId(rawThreadRecord) : undefined;
      if (!threadId) throw new Error("thread/start returned no thread id");
      const executionMode = AGENT_EXECUTION_MODES.find(
        (mode) => mode.id === runSettings.executionMode,
      );
      await codex.turn.start({
        cwd: runSettings.cwd,
        effort: codexReasoningEffort(runSettings.effort),
        input: normalizeTurnInput(input),
        model: runSettings.modelId,
        ...executionMode?.turnParams,
        threadId,
      });
      return result;
    },
    [
      codex,
      runSettings.cwd,
      runSettings.effort,
      runSettings.executionMode,
      runSettings.modelId,
      startThread,
    ],
  );

  const resumeThread = useCallback(
    async (id: ThreadId, params?: ThreadResumeOptions) => {
      const result = await codex.thread.resume(id, params);
      const rawThread = asRecord(result)?.thread ?? result;
      const rawThreadRecord = asRecord(rawThread);
      if (rawThreadRecord && hasThreadId(rawThreadRecord)) {
        for (const event of threadSnapshotEvents(rawThreadRecord, true)) dispatch(event);
        syncRunSettingsFromRawThread(dispatch, rawThreadRecord);
      }
      dispatch({ status: "ready", threadId: id, type: "thread/status/changed" });
      dispatch({ threadId: id, type: "thread/active/set" });
      return result;
    },
    [codex, dispatch],
  );

  return {
    resumeThread,
    startThread,
    startThreadWithInput,
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
  const resolvedThreadId = threadId ?? selectThreadRegistry(state).activeThreadId;

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
      return codex.thread.fork(id, params);
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
  const activeThreadId = selectThreadRegistry(state).activeThreadId;
  const threads = useMemo(() => selectOrderedThreads(state), [state]);
  const setActiveThread = useCallback(
    (threadId?: ThreadId) => dispatch({ threadId, type: "thread/active/set" }),
    [dispatch],
  );
  return { activeThreadId, setActiveThread, threads };
}

export type ThreadHistoryParams = ThreadListParams;

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
        const response = await codex.thread.list(params);
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
      if (!hasThreadId(rawThread)) {
        throw new Error(`thread/read returned no thread for ${threadId}`);
      }
      const rawThreadRecord = rawThread as Record<string, unknown>;
      for (const event of threadSnapshotEvents(rawThreadRecord, options.activate ?? true)) {
        dispatch(event);
      }
      syncRunSettingsFromRawThread(dispatch, rawThreadRecord);
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

export function useAgentComposer(threadId?: ThreadId) {
  const { t } = useAgentI18n();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInterrupting, setIsInterrupting] = useState(false);
  const { dispatch, state } = useAgentContext();
  const composerQueue = useAgentComposerQueueStore();
  const resolvedThreadId = threadId ?? selectThreadRegistry(state).activeThreadId;
  const thread = resolvedThreadId ? selectThread(state, resolvedThreadId) : undefined;
  const { interruptTurn, startTurn, steerTurn } = useAgentTurn(threadId);
  const activeTurnId = resolvedThreadId
    ? selectLatestRunningTurnId(state, resolvedThreadId)
    : undefined;
  const isRunning = thread?.status === "running";
  const buildInput = useCallback(
    (items: AgentUserInput[] = []) => {
      const input = value.trim();
      if (!input && items.length === 0) return undefined;
      return {
        input: input ? [textAgentInput(input), ...items] : items,
        text: input,
      };
    },
    [value],
  );
  const queueFollowUp = useCallback(
    (items: AgentUserInput[] = [], attachments: QueuedFollowUpAttachment[] = []) => {
      const built = buildInput(items);
      if (!built || !resolvedThreadId) return;
      const expectedTurnId = activeTurnId;
      const id = composerQueue.enqueueFollowUp({
        attachments,
        expectedTurnId,
        input: built.input,
        text: built.text || summarizeUserInput(built.input, t),
        threadId: resolvedThreadId,
      });
      setValue("");
      return id;
    },
    [activeTurnId, buildInput, composerQueue, resolvedThreadId, t],
  );
  const steerNow = useCallback(
    async (items: AgentUserInput[] = []) => {
      const built = buildInput(items);
      if (!built) return;
      setError(undefined);
      setIsSubmitting(true);
      try {
        if (!activeTurnId) throw new Error("No active turn to steer.");
        await steerTurn(activeTurnId, built.input);
        setValue("");
      } catch (caught) {
        setError(composerActionError(caught, "steer", t));
        throw caught;
      } finally {
        setIsSubmitting(false);
      }
    },
    [activeTurnId, buildInput, steerTurn, t],
  );
  const submit = useCallback(
    async (
      items: AgentUserInput[] = [],
      options: { attachments?: QueuedFollowUpAttachment[] } = {},
    ) => {
      const built = buildInput(items);
      if (!built) return;
      if (isRunning) {
        return queueFollowUp(items, options.attachments);
      }
      setError(undefined);
      setIsSubmitting(true);
      try {
        await startTurn(built.input);
        setValue("");
        return "sent";
      } catch (caught) {
        setError(composerActionError(caught, "start", t));
        throw caught;
      } finally {
        setIsSubmitting(false);
      }
    },
    [buildInput, isRunning, queueFollowUp, startTurn, t],
  );
  const scopedQueuedFollowUps = useMemo(
    () =>
      resolvedThreadId
        ? composerQueue.queuedFollowUps.filter(
            (followUp) => followUp.threadId === resolvedThreadId,
          )
        : [],
    [composerQueue.queuedFollowUps, resolvedThreadId],
  );
  const scopedSendingFollowUpIds = useMemo(
    () =>
      scopedQueuedFollowUps
        .filter((followUp) => composerQueue.sendingFollowUpIds.includes(followUp.id))
        .map((followUp) => followUp.id),
    [composerQueue.sendingFollowUpIds, scopedQueuedFollowUps],
  );
  const sendQueuedFollowUp = useCallback(
    async (id: string) => {
      const item = composerQueue.queuedFollowUps.find(
        (followUp) => followUp.id === id && followUp.threadId === resolvedThreadId,
      );
      if (!item) return;
      const error = followUpSendPreflightError(activeTurnId, item.expectedTurnId, t);
      if (error) {
        composerQueue.setFollowUpError(id, error);
        return;
      }
      const expectedTurnId = item.expectedTurnId;
      if (!expectedTurnId) return;
      composerQueue.setFollowUpError(id, undefined);
      composerQueue.markFollowUpSending(id);
      try {
        await steerTurn(expectedTurnId, item.input);
        composerQueue.removeFollowUp(id, item.threadId, { revokePreviewUrls: true });
      } catch (caught) {
        composerQueue.setFollowUpError(id, composerActionError(caught, "steer", t));
      } finally {
        composerQueue.markFollowUpIdle(id);
      }
    },
    [activeTurnId, composerQueue, resolvedThreadId, steerTurn, t],
  );
  const editQueuedFollowUp = useCallback(
    (id: string) => {
      if (!resolvedThreadId) return undefined;
      const item = composerQueue.takeFollowUpForEdit(id, resolvedThreadId);
      if (!item) return undefined;
      setValue(item.text);
      return item;
    },
    [composerQueue, resolvedThreadId],
  );
  const removeQueuedFollowUp = useCallback(
    (id: string) => {
      if (resolvedThreadId) {
        composerQueue.removeFollowUp(id, resolvedThreadId, { revokePreviewUrls: true });
      }
    },
    [composerQueue, resolvedThreadId],
  );
  const stop = useCallback(async () => {
    if (!activeTurnId || !resolvedThreadId) return;
    setError(undefined);
    setIsInterrupting(true);
    try {
      await interruptTurn(activeTurnId);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      if (/no active turn/i.test(message)) {
        dispatch({
          status: "complete",
          threadId: resolvedThreadId,
          type: "thread/status/changed",
        });
      } else {
        setError(composerActionError(caught, "interrupt", t));
        throw caught;
      }
    } finally {
      setIsInterrupting(false);
    }
  }, [activeTurnId, dispatch, interruptTurn, resolvedThreadId, t]);
  return {
    activeTurnId,
    editQueuedFollowUp,
    error,
    followUpErrors: composerQueue.followUpErrors,
    isInterrupting,
    isRunning,
    isSubmitting,
    queuedFollowUps: scopedQueuedFollowUps,
    removeQueuedFollowUp,
    sendQueuedFollowUp,
    sendingFollowUpIds: scopedSendingFollowUpIds,
    setError,
    setValue,
    steerNow,
    stop,
    submit,
    value,
  };
}

export type { QueuedFollowUp, QueuedFollowUpAttachment } from "./composer-queue";

export type AgentComposerController = ReturnType<typeof useAgentComposer>;

function composerActionError(
  caught: unknown,
  action: "interrupt" | "start" | "steer",
  t: (key: AgentI18nKey, vars?: Record<string, string | number>) => string,
) {
  const message = caught instanceof Error ? caught.message : String(caught);
  if (action === "steer") {
    if (/not steerable|non.?steerable|review|compact/i.test(message)) {
      return t("composer.cannotAcceptFollowUp");
    }
    if (/expected.*turn|mismatch/i.test(message)) {
      return t("composer.followUpTurnChangedRefresh");
    }
    if (/no active turn/i.test(message)) {
      return t("composer.followUpNoActiveTurn");
    }
    return t("composer.couldNotSendAdditional", { message });
  }
  if (action === "interrupt") return t("composer.couldNotStop", { message });
  return t("composer.couldNotStart", { message });
}

function followUpSendPreflightError(
  activeTurnId: string | undefined,
  expectedTurnId: string | undefined,
  t: (key: AgentI18nKey) => string,
): string | undefined {
  if (!activeTurnId || !expectedTurnId) {
    return t("composer.followUpNoActiveTurn");
  }
  if (activeTurnId !== expectedTurnId) {
    return t("composer.followUpTurnChanged");
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
