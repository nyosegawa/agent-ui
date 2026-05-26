import {
  selectActiveThread,
  selectOrderedThreads,
  selectOrderedTurns,
  selectPendingApprovals,
  selectRunSettings,
  selectServerRequestQueue,
  selectThread,
  type AgentApp,
  type AgentModel,
  type ExecutionModeId,
  type ReasoningEffort,
  type RequestId,
  type ThreadId,
  type ThreadState,
} from "@nyosegawa/agent-ui-core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  accountReadParams,
  cancelLoginParams,
  appsListParams,
  deviceCodeLoginParams,
  hooksListParams,
  modelListParams,
  skillsConfigWriteParams,
  skillsListParams,
  textInput,
  threadArchiveParams,
  threadCompactStartParams,
  threadForkParams,
  threadListParams,
  threadRollbackParams,
  threadSetNameParams,
  threadReadParams,
  threadResumeParams,
  threadStartParams,
  threadUnarchiveParams,
  turnInterruptParams,
  turnStartParams,
  turnSteerParams,
  type CancelLoginAccountParams,
  type AppsListParams,
  type CodexUserInput,
  type GetAccountParams,
  type HooksListParams,
  type LoginAccountParams,
  type ModelListParams,
  type SkillsConfigWriteParams,
  type SkillsListParams,
  type ThreadArchiveParams,
  type ThreadCompactStartParams,
  type ThreadForkParams,
  type ThreadListParams,
  type ThreadReadParams,
  type ThreadResumeParams,
  type ThreadRollbackParams,
  type ThreadSetNameParams,
  type ThreadStartParams,
  type ThreadUnarchiveParams,
  type TurnInterruptParams,
  type TurnStartParams,
  type TurnSteerParams,
} from "./codex-request-params";
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

export interface AgentExecutionMode {
  id: ExecutionModeId;
  label: string;
  description: string;
  turnParams: Record<string, unknown>;
}

export const AGENT_EXECUTION_MODES: AgentExecutionMode[] = [
  {
    description: "Ask before commands or file changes that need review.",
    id: "review",
    label: "Review",
    turnParams: {
      approvalPolicy: "on-request",
      sandboxPolicy: {
        excludeSlashTmp: false,
        excludeTmpdirEnvVar: false,
        networkAccess: false,
        type: "workspaceWrite",
        writableRoots: [],
      },
    },
  },
  {
    description: "Run in the workspace and ask only after a command fails.",
    id: "auto",
    label: "Auto",
    turnParams: {
      approvalPolicy: "on-failure",
      sandboxPolicy: {
        excludeSlashTmp: false,
        excludeTmpdirEnvVar: false,
        networkAccess: false,
        type: "workspaceWrite",
        writableRoots: [],
      },
    },
  },
  {
    description: "Read files and plan changes without writing to the workspace.",
    id: "read-only",
    label: "Read-only",
    turnParams: {
      approvalPolicy: "untrusted",
      sandboxPolicy: { networkAccess: false, type: "readOnly" },
    },
  },
  {
    description: "Allow full local access for trusted one-off work.",
    id: "full-access",
    label: "Full access",
    turnParams: {
      approvalPolicy: "never",
      sandboxPolicy: { type: "dangerFullAccess" },
    },
  },
];

export function useAgentThread(threadId?: ThreadId) {
  const { dispatch, state, transport } = useAgentContext();
  const resolvedThreadId = threadId ?? state.activeThreadId;
  const thread = resolvedThreadId
    ? selectThread(state, resolvedThreadId)
    : selectActiveThread(state);
  const turns = resolvedThreadId ? selectOrderedTurns(state, resolvedThreadId) : [];
  const runSettings = selectRunSettings(state);

  const startThread = useCallback(
    async (params?: Record<string, unknown>) => {
      const requestParams = threadStartParams({
        cwd: runSettings.cwd,
        model: runSettings.modelId,
        ...params,
      });
      const result = await transport.request<ThreadStartParams, unknown>(
        "thread/start",
        requestParams,
      );
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
    [dispatch, runSettings.cwd, runSettings.modelId, transport],
  );

  const startThreadWithInput = useCallback(
    async (
      input: string | CodexUserInput[],
      params?: Record<string, unknown>,
    ) => {
      const result = await startThread(params);
      const rawThread = asRecord(result)?.thread ?? result;
      const rawThreadRecord = asRecord(rawThread);
      const threadId = rawThreadRecord ? rawThreadId(rawThreadRecord) : undefined;
      if (!threadId) throw new Error("thread/start returned no thread id");
      const executionMode = AGENT_EXECUTION_MODES.find(
        (mode) => mode.id === runSettings.executionMode,
      );
      const requestParams = turnStartParams({
        cwd: runSettings.cwd,
        effort: runSettings.effort as TurnStartParams["effort"],
        input,
        model: runSettings.modelId,
        ...executionMode?.turnParams,
        threadId,
      });
      await transport.request<TurnStartParams>("turn/start", requestParams);
      return result;
    },
    [
      runSettings.cwd,
      runSettings.effort,
      runSettings.executionMode,
      runSettings.modelId,
      startThread,
      transport,
    ],
  );

  const resumeThread = useCallback(
    async (id: ThreadId, params?: Record<string, unknown>) => {
      const requestParams = threadResumeParams(id, params);
      const result = await transport.request<ThreadResumeParams, unknown>(
        "thread/resume",
        requestParams,
      );
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
    [dispatch, transport],
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
  const { dispatch, state, transport } = useAgentContext();
  const composerQueue = useAgentComposerQueueStore();
  const resolvedThreadId = threadId ?? state.activeThreadId;

  const requireThreadId = useCallback(() => {
    if (!resolvedThreadId) throw new Error("No thread selected");
    return resolvedThreadId;
  }, [resolvedThreadId]);

  const renameThread = useCallback(
    async (name: string) => {
      const id = requireThreadId();
      const params = threadSetNameParams(id, name);
      const response = await transport.request<ThreadSetNameParams, unknown>(
        "thread/name/set",
        params,
      );
      dispatch({ name, threadId: id, type: "thread/name/updated" });
      return response;
    },
    [dispatch, requireThreadId, transport],
  );

  const archiveThread = useCallback(async () => {
    const id = requireThreadId();
    const response = await transport.request<ThreadArchiveParams, unknown>(
      "thread/archive",
      threadArchiveParams(id),
    );
    composerQueue.clearThreadFollowUps(id);
    dispatch({ status: "archived", threadId: id, type: "thread/status/changed" });
    return response;
  }, [composerQueue, dispatch, requireThreadId, transport]);

  const unarchiveThread = useCallback(async () => {
    const id = requireThreadId();
    const response = await transport.request<ThreadUnarchiveParams, unknown>(
      "thread/unarchive",
      threadUnarchiveParams(id),
    );
    dispatch({ status: "loaded", threadId: id, type: "thread/status/changed" });
    return response;
  }, [dispatch, requireThreadId, transport]);

  const forkThread = useCallback(
    async (params: Omit<ThreadForkParams, "threadId"> = {}) => {
      const id = requireThreadId();
      return transport.request<ThreadForkParams, unknown>(
        "thread/fork",
        threadForkParams(id, params),
      );
    },
    [requireThreadId, transport],
  );

  const compactThread = useCallback(async () => {
    const id = requireThreadId();
    return transport.request<ThreadCompactStartParams, unknown>(
      "thread/compact/start",
      threadCompactStartParams(id),
    );
  }, [requireThreadId, transport]);

  const rollbackThread = useCallback(
    async (numTurns = 1) => {
      const id = requireThreadId();
      return transport.request<ThreadRollbackParams, unknown>(
        "thread/rollback",
        threadRollbackParams(id, numTurns),
      );
    },
    [requireThreadId, transport],
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
  const threads = useMemo(() => selectOrderedThreads(state), [state]);
  const setActiveThread = useCallback(
    (threadId?: ThreadId) => dispatch({ threadId, type: "thread/active/set" }),
    [dispatch],
  );
  return { activeThreadId: state.activeThreadId, setActiveThread, threads };
}

export interface ThreadHistoryParams {
  cursor?: string | null;
  limit?: number;
  searchTerm?: string;
}

export function useAgentThreadHistory() {
  const { dispatch, state, transport } = useAgentContext();
  const [isLoading, setIsLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>();
  const [error, setError] = useState<Error | undefined>();

  const listThreads = useCallback(
    async (params: ThreadHistoryParams = {}) => {
      setIsLoading(true);
      setError(undefined);
      try {
        const requestParams = threadListParams(params);
        const response = await transport.request<ThreadListParams, unknown>(
          "thread/list",
          requestParams,
        );
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
    [dispatch, transport],
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
  const { dispatch, transport } = useAgentContext();
  const readThread = useCallback(
    async (
      threadId: ThreadId,
      options: { activate?: boolean; includeTurns?: boolean } = {},
    ) => {
      const requestParams = threadReadParams(threadId, options.includeTurns ?? true);
      const response = await transport.request<ThreadReadParams, unknown>(
        "thread/read",
        requestParams,
      );
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
    [dispatch, transport],
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

export function useAgentTurn(threadId?: ThreadId) {
  const { state, transport } = useAgentContext();
  const resolvedThreadId = threadId ?? state.activeThreadId;
  const runSettings = selectRunSettings(state);

  const startTurn = useCallback(
    async (input: string | CodexUserInput[], params?: Record<string, unknown>) => {
      if (!resolvedThreadId) throw new Error("No active thread");
      const executionMode = AGENT_EXECUTION_MODES.find(
        (mode) => mode.id === runSettings.executionMode,
      );
      const requestParams = turnStartParams({
        cwd: runSettings.cwd,
        effort: runSettings.effort as TurnStartParams["effort"],
        input,
        model: runSettings.modelId,
        ...executionMode?.turnParams,
        ...params,
        threadId: resolvedThreadId,
      });
      return transport.request<TurnStartParams>("turn/start", requestParams);
    },
    [
      resolvedThreadId,
      runSettings.cwd,
      runSettings.effort,
      runSettings.executionMode,
      runSettings.modelId,
      transport,
    ],
  );

  const interruptTurn = useCallback(
    async (turnId: string) => {
      if (!resolvedThreadId) throw new Error("No active thread");
      return transport.request<TurnInterruptParams>(
        "turn/interrupt",
        turnInterruptParams(resolvedThreadId, turnId),
      );
    },
    [resolvedThreadId, transport],
  );

  const steerTurn = useCallback(
    async (expectedTurnId: string, input: string | CodexUserInput[]) => {
      if (!resolvedThreadId) throw new Error("No active thread");
      return transport.request<TurnSteerParams>(
        "turn/steer",
        turnSteerParams({ expectedTurnId, input, threadId: resolvedThreadId }),
      );
    },
    [resolvedThreadId, transport],
  );

  return { interruptTurn, startTurn, steerTurn };
}

export const useAgentTurnController = useAgentTurn;

export function useAgentApprovals(threadId?: ThreadId) {
  const { state, transport } = useAgentContext();
  const approvals = useMemo(
    () => selectPendingApprovals(state, threadId),
    [state, threadId],
  );

  const approve = useCallback(
    async (requestId: RequestId, result: unknown = { decision: "accept" }) => {
      await transport.respond(requestId, result);
    },
    [transport],
  );

  const reject = useCallback(
    async (requestId: RequestId, message = "Rejected by user") => {
      const error = { code: -32000, message };
      await transport.reject(requestId, error);
    },
    [transport],
  );

  return { approvals, approve, reject };
}

export function useAgentServerRequests(threadId?: ThreadId) {
  const approvals = useAgentApprovals(threadId);
  const { state } = useAgentContext();
  const queue = selectServerRequestQueue(state, threadId);
  return { ...approvals, requests: queue };
}

export function useAgentComposer(threadId?: ThreadId) {
  const { t } = useAgentI18n();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInterrupting, setIsInterrupting] = useState(false);
  const { dispatch, state } = useAgentContext();
  const composerQueue = useAgentComposerQueueStore();
  const resolvedThreadId = threadId ?? state.activeThreadId;
  const thread = resolvedThreadId ? selectThread(state, resolvedThreadId) : undefined;
  const { interruptTurn, startTurn, steerTurn } = useAgentTurn(threadId);
  const activeTurnId = latestRunningTurnId(thread);
  const isRunning = thread?.status === "running";
  const buildInput = useCallback(
    (items: CodexUserInput[] = []) => {
      const input = value.trim();
      if (!input && items.length === 0) return undefined;
      return {
        input: input ? [textInput(input), ...items] : items,
        text: input,
      };
    },
    [value],
  );
  const queueFollowUp = useCallback(
    (items: CodexUserInput[] = [], attachments: QueuedFollowUpAttachment[] = []) => {
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
    async (items: CodexUserInput[] = []) => {
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
      items: CodexUserInput[] = [],
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

function latestRunningTurnId(thread?: ThreadState): string | undefined {
  if (!thread) return undefined;
  return [...thread.orderedTurnIds]
    .reverse()
    .find((turnId) => {
      const status = thread.turns[turnId]?.turn.status;
      return (
        status === "running" ||
        status === "inProgress" ||
        (thread.status === "running" && status !== "completed" && status !== "interrupted")
      );
    });
}

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

function summarizeUserInput(input: CodexUserInput[], t: (key: AgentI18nKey) => string): string {
  const text = input
    .map((item) => (typeof item === "object" && "text" in item ? item.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
  return text || t("composer.attachedFollowUp");
}

export function useAgentRunSettings() {
  const { dispatch, state } = useAgentContext();
  const runSettings = selectRunSettings(state);
  const selectedModel =
    state.models.models.find((model) => model.id === runSettings.modelId) ??
    state.models.models.find((model) => isDefaultModel(model));
  const supportedEfforts =
    selectedModel?.supportedEfforts && selectedModel.supportedEfforts.length > 0
      ? selectedModel.supportedEfforts
      : [];

  const setExecutionMode = useCallback(
    (executionMode: ExecutionModeId) =>
      dispatch({ executionMode, type: "runSettings/updated" }),
    [dispatch],
  );
  const setModelId = useCallback(
    (modelId: string) => {
      const model = state.models.models.find((candidate) => candidate.id === modelId);
      dispatch({
        effort: model?.defaultEffort,
        modelId: modelId || undefined,
        type: "runSettings/updated",
      });
    },
    [dispatch, state.models.models],
  );
  const setEffort = useCallback(
    (effort: ReasoningEffort) =>
      dispatch({ effort: effort || undefined, type: "runSettings/updated" }),
    [dispatch],
  );
  const setCwd = useCallback(
    (cwd: string) =>
      dispatch({ cwd: cwd.trim() || undefined, type: "runSettings/updated" }),
    [dispatch],
  );

  return {
    executionModes: AGENT_EXECUTION_MODES,
    models: state.models.models,
    runSettings,
    selectedModel,
    setCwd,
    setEffort,
    setExecutionMode,
    setModelId,
    supportedEfforts,
  };
}

export function useAgentAuth() {
  const { dispatch, state, transport } = useAgentContext();
  const readAccount = useCallback(async () => {
    const params = accountReadParams(false);
    const response = await transport.request<GetAccountParams, unknown>(
      "account/read",
      params,
    );
    const responseRecord = asRecord(response);
    const account =
      responseRecord && Object.prototype.hasOwnProperty.call(responseRecord, "account")
        ? responseRecord.account
        : responseRecord && Object.keys(responseRecord).length > 0
          ? response
          : null;
    dispatch({
      account,
      status: account == null ? "unauthenticated" : "authenticated",
      type: "account/updated",
    });
    return response;
  }, [dispatch, transport]);
  const login = useCallback(async () => {
    const params = deviceCodeLoginParams();
    const raw = await transport.request<LoginAccountParams, unknown>(
      "account/login/start",
      params,
    );
    const record = asRecord(raw) ?? {};
    const loginState = {
      loginId: stringValue(record.loginId) ?? stringValue(record.login_id),
      userCode: stringValue(record.userCode) ?? stringValue(record.user_code),
      verificationUrl:
        stringValue(record.verificationUrl) ?? stringValue(record.verification_url),
    };
    dispatch({
      loginId: loginState.loginId,
      type: "account/login/deviceCodeStarted",
      userCode: loginState.userCode,
      verificationUrl: loginState.verificationUrl,
    });
    return loginState;
  }, [dispatch, transport]);
  const cancelLogin = useCallback(async () => {
    const loginId = state.account.login?.loginId;
    if (!loginId) return;
    const params = cancelLoginParams(loginId);
    await transport.request<CancelLoginAccountParams>("account/login/cancel", params);
    dispatch({ account: null, status: "unauthenticated", type: "account/updated" });
  }, [dispatch, state.account.login?.loginId, transport]);
  const logout = useCallback(async () => {
    const response = await transport.request("account/logout");
    dispatch({ account: null, status: "unauthenticated", type: "account/updated" });
    return response;
  }, [dispatch, transport]);
  return { account: state.account, cancelLogin, login, logout, readAccount };
}

export interface AgentBootstrapState {
  errors: Error[];
  isBootstrapping: boolean;
  status: "idle" | "loading" | "ready" | "error";
}

export function useAgentBootstrap(): AgentBootstrapState {
  const { state } = useAgentContext();
  const { readAccount } = useAgentAuth();
  const { refreshUsage } = useAgentUsage();
  const { refreshModels } = useAgentModels();
  const didBootstrap = useRef(false);
  const didAuthenticatedSync = useRef(false);
  const [bootstrap, setBootstrap] = useState<AgentBootstrapState>({
    errors: [],
    isBootstrapping: false,
    status: "idle",
  });

  useEffect(() => {
    if (state.connection.status !== "connected" || didBootstrap.current) return;
    didBootstrap.current = true;
    setBootstrap({ errors: [], isBootstrapping: true, status: "loading" });
    void (async () => {
      const errors: Error[] = [];
      let accountResponse: unknown;
      if (state.account.status === "unknown") {
        try {
          accountResponse = await readAccount();
        } catch (caught) {
          errors.push(caught instanceof Error ? caught : new Error(String(caught)));
        }
      }
      const isAuthenticated =
        state.account.status === "authenticated" ||
        accountResponseHasAccount(accountResponse);
      const tasks = [
        state.models.models.length === 0 ? refreshModels() : Promise.resolve(),
        isAuthenticated && state.account.rateLimits == null
          ? refreshUsage()
          : Promise.resolve(),
      ];
      const results = await Promise.allSettled(tasks);
      errors.push(
        ...results
          .filter(
            (result): result is PromiseRejectedResult => result.status === "rejected",
          )
          .map((result) =>
            result.reason instanceof Error
              ? result.reason
              : new Error(String(result.reason)),
          ),
      );
      setBootstrap({
        errors,
        isBootstrapping: false,
        status: errors.length > 0 ? "error" : "ready",
      });
      if (isAuthenticated && errors.length === 0) didAuthenticatedSync.current = true;
    })();
  }, [
    readAccount,
    refreshModels,
    refreshUsage,
    state.account.rateLimits,
    state.account.status,
    state.connection.status,
    state.models.models.length,
  ]);

  useEffect(() => {
    if (
      state.connection.status !== "connected" ||
      state.account.status !== "authenticated" ||
      didAuthenticatedSync.current
    ) {
      return;
    }
    didAuthenticatedSync.current = true;
    setBootstrap({ errors: [], isBootstrapping: true, status: "loading" });
    void (async () => {
      const errors: Error[] = [];
      const tasks = [
        state.account.account == null ? readAccount() : Promise.resolve(),
        state.models.models.length === 0 ? refreshModels() : Promise.resolve(),
        state.account.rateLimits == null ? refreshUsage() : Promise.resolve(),
      ];
      const results = await Promise.allSettled(tasks);
      errors.push(
        ...results
          .filter(
            (result): result is PromiseRejectedResult => result.status === "rejected",
          )
          .map((result) =>
            result.reason instanceof Error
              ? result.reason
              : new Error(String(result.reason)),
          ),
      );
      setBootstrap({
        errors,
        isBootstrapping: false,
        status: errors.length > 0 ? "error" : "ready",
      });
    })();
  }, [
    readAccount,
    refreshModels,
    refreshUsage,
    state.account.account,
    state.account.rateLimits,
    state.account.status,
    state.connection.status,
    state.models.models.length,
  ]);

  return bootstrap;
}

function accountResponseHasAccount(response: unknown): boolean {
  const record = asRecord(response);
  if (!record) return false;
  if (Object.prototype.hasOwnProperty.call(record, "account")) {
    return record.account != null;
  }
  return Object.keys(record).length > 0;
}

export function useAgentUsage() {
  const { dispatch, state, transport } = useAgentContext();
  const refreshUsage = useCallback(async () => {
    const response = await transport.request("account/rateLimits/read");
    dispatch({ rateLimits: response, type: "account/rateLimits/updated" });
    return response;
  }, [dispatch, transport]);
  return { rateLimits: state.account.rateLimits, refreshUsage };
}

export function useAgentSkills(cwd?: string) {
  const { dispatch, state, transport } = useAgentContext();
  const key = cwd ?? "";
  const skills = state.skills.byCwd[key] ?? [];
  const refreshSkills = useCallback(
    async (params: SkillsListParams = {}) => {
      const requestParams = skillsListParams(
        cwd && !params.cwds ? { ...params, cwds: [cwd] } : params,
      );
      const response = await transport.request<SkillsListParams, unknown>(
        "skills/list",
        requestParams,
      );
      const entries = normalizeSkillsList(response, cwd);
      for (const entry of entries) {
        dispatch({ cwd: entry.cwd, skills: entry.skills, type: "skills/updated" });
      }
      return entries;
    },
    [cwd, dispatch, transport],
  );
  const setSkillEnabled = useCallback(
    async (params: SkillsConfigWriteParams) => {
      const response = await transport.request<SkillsConfigWriteParams, unknown>(
        "skills/config/write",
        skillsConfigWriteParams(params),
      );
      const targetName = stringValue(params.name);
      const targetPath = stringValue(params.path);
      const updateCwd = cwd ?? key;
      dispatch({
        cwd: updateCwd,
        skills: (state.skills.byCwd[updateCwd] ?? []).map((skill) => {
          const matches =
            (targetPath && skill.path === targetPath) ||
            (!targetPath && targetName && skill.name === targetName);
          return matches ? { ...skill, enabled: params.enabled } : skill;
        }),
        type: "skills/updated",
      });
      return response;
    },
    [cwd, dispatch, key, state.skills.byCwd, transport],
  );
  return { refreshSkills, setSkillEnabled, skills };
}

export function useAgentHooks(cwd?: string) {
  const { dispatch, state, transport } = useAgentContext();
  const key = cwd ?? "";
  const hooks = state.hooks.byCwd[key] ?? [];
  const refreshHooks = useCallback(
    async (params: HooksListParams = {}) => {
      const requestParams = hooksListParams(
        cwd && !params.cwds ? { ...params, cwds: [cwd] } : params,
      );
      const response = await transport.request<HooksListParams, unknown>(
        "hooks/list",
        requestParams,
      );
      const entries = normalizeHooksList(response, cwd);
      for (const entry of entries) {
        dispatch({ cwd: entry.cwd, hooks: entry.hooks, type: "hooks/updated" });
      }
      return entries;
    },
    [cwd, dispatch, transport],
  );
  return { hooks, refreshHooks };
}

export function useAgentApps(threadId?: string) {
  const { dispatch, state, transport } = useAgentContext();
  const appScope = threadId ?? "";
  const scopedApps = state.apps.byScope[appScope] ?? {
    apps: threadId ? [] : state.apps.apps,
    nextCursor: threadId ? null : state.apps.nextCursor,
    threadId,
  };
  const refreshApps = useCallback(
    async (params: AppsListParams = {}) => {
      const requestParams = appsListParams(
        threadId && !params.threadId ? { ...params, threadId } : params,
      );
      const response = await transport.request<AppsListParams, unknown>(
        "app/list",
        requestParams,
      );
      const { apps, nextCursor } = normalizeAppsList(response);
      dispatch({
        apps: requestParams.cursor ? mergeApps(scopedApps.apps, apps) : apps,
        nextCursor,
        threadId: requestParams.threadId ?? undefined,
        type: "apps/updated",
      });
      return { apps, nextCursor };
    },
    [dispatch, scopedApps.apps, threadId, transport],
  );
  const loadMoreApps = useCallback(
    async () =>
      scopedApps.nextCursor ? refreshApps({ cursor: scopedApps.nextCursor }) : undefined,
    [refreshApps, scopedApps.nextCursor],
  );
  return {
    apps: scopedApps.apps,
    loadMoreApps,
    nextCursor: scopedApps.nextCursor,
    refreshApps,
  };
}

export function useAgentModels() {
  const { dispatch, state, transport } = useAgentContext();
  const refreshModels = useCallback(async () => {
    const params = modelListParams();
    const response = await transport.request<ModelListParams, unknown>(
      "model/list",
      params,
    );
    const models = normalizeModelList(response);
    dispatch({ models, type: "models/updated" });
    return models;
  }, [dispatch, transport]);
  return { models: state.models.models, refreshModels };
}

function normalizeModelList(response: unknown): AgentModel[] {
  const value = asRecord(response);
  const rawModels = Array.isArray(value?.data)
    ? value.data
    : Array.isArray(value?.models)
      ? value.models
      : Array.isArray(value)
        ? value
        : [];
  return rawModels
    .flatMap((model) => {
      const record = asRecord(model);
      return record ? [record] : [];
    })
    .map((model) => ({
      id: String(model.id ?? model.slug ?? model.model ?? model.name),
      defaultEffort: normalizeReasoningEffort(
        model.defaultReasoningEffort ??
          model.default_reasoning_effort ??
          model.default_effort,
      ),
      name: normalizeModelName(model),
      raw: model,
      supportedEfforts: normalizeSupportedEfforts(model),
    }));
}

function normalizeModelName(model: Record<string, unknown>): string | undefined {
  const display = model.displayName ?? model.display_name ?? model.name;
  if (typeof display === "string" && display.trim()) return display;
  const modelId = model.model ?? model.id;
  return typeof modelId === "string" && modelId.trim() ? modelId : undefined;
}

function normalizeSupportedEfforts(
  model: Record<string, unknown>,
): AgentModel["supportedEfforts"] {
  const efforts = model.supportedReasoningEfforts ?? model.supported_reasoning_efforts;
  if (!Array.isArray(efforts)) return undefined;
  const normalized = efforts
    .map((effort) => {
      if (typeof effort === "string") return effort;
      const record = asRecord(effort);
      if (!record) return undefined;
      return normalizeReasoningEffort(record.reasoningEffort ?? record.reasoning_effort);
    })
    .filter(
      (effort): effort is ReasoningEffort =>
        typeof effort === "string" && effort.length > 0,
    );
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeReasoningEffort(value: unknown): ReasoningEffort | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function normalizeSkillsList(response: unknown, fallbackCwd?: string) {
  const record = asRecord(response);
  const rawEntries = Array.isArray(record?.data)
    ? record.data
    : Array.isArray(response)
      ? response
      : [];
  return rawEntries.flatMap((entry) => {
    const entryRecord = asRecord(entry);
    if (!entryRecord) return [];
    const cwd = stringValue(entryRecord.cwd) ?? fallbackCwd ?? "";
    const rawSkills = Array.isArray(entryRecord.skills) ? entryRecord.skills : [];
    return [
      {
        cwd,
        skills: rawSkills.flatMap((skill) => {
          const skillRecord = asRecord(skill);
          if (!skillRecord) return [];
          return [
            {
              enabled: typeof skillRecord.enabled === "boolean" ? skillRecord.enabled : undefined,
              name: String(skillRecord.name ?? ""),
              path: stringValue(skillRecord.path),
              raw: skill,
            },
          ];
        }),
      },
    ];
  });
}

function normalizeHooksList(response: unknown, fallbackCwd?: string) {
  const record = asRecord(response);
  const rawEntries = Array.isArray(record?.data)
    ? record.data
    : Array.isArray(response)
      ? response
      : [];
  return rawEntries.flatMap((entry) => {
    const entryRecord = asRecord(entry);
    if (!entryRecord) return [];
    const cwd = stringValue(entryRecord.cwd) ?? fallbackCwd ?? "";
    const rawHooks = Array.isArray(entryRecord.hooks) ? entryRecord.hooks : [];
    return [
      {
        cwd,
        hooks: rawHooks.flatMap((hook) => {
          const hookRecord = asRecord(hook);
          if (!hookRecord) return [];
          return [
            {
              enabled: typeof hookRecord.enabled === "boolean" ? hookRecord.enabled : undefined,
              id: String(hookRecord.id ?? hookRecord.name ?? hookRecord.path),
              name: stringValue(hookRecord.name),
              raw: hook,
            },
          ];
        }),
      },
    ];
  });
}

function normalizeAppsList(response: unknown): { apps: AgentApp[]; nextCursor: string | null } {
  const record = asRecord(response);
  const rawApps = Array.isArray(record?.data)
    ? record.data
    : Array.isArray(record?.apps)
      ? record.apps
      : Array.isArray(response)
        ? response
        : [];
  return {
    apps: rawApps.flatMap((app) => {
      const appRecord = asRecord(app);
      if (!appRecord) return [];
      return [
        {
          id: String(appRecord.id ?? appRecord.uri ?? appRecord.name),
          installed:
            typeof appRecord.installed === "boolean"
              ? appRecord.installed
              : typeof appRecord.isEnabled === "boolean"
                ? appRecord.isEnabled
                : undefined,
          name: stringValue(appRecord.name),
          needsAuth:
            typeof appRecord.needsAuth === "boolean"
              ? appRecord.needsAuth
              : appRecord.isAccessible === false,
          raw: app,
          uri: stringValue(appRecord.uri) ?? stringValue(appRecord.installUrl),
        },
      ];
    }),
    nextCursor: stringValue(record?.nextCursor) ?? stringValue(record?.next_cursor) ?? null,
  };
}

function mergeApps(current: AgentApp[], next: AgentApp[]) {
  const byId = new Map(current.map((app) => [app.id, app]));
  for (const app of next) byId.set(app.id, app);
  return Array.from(byId.values());
}

function isDefaultModel(model: AgentModel): boolean {
  return asRecord(model.raw)?.isDefault === true;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
