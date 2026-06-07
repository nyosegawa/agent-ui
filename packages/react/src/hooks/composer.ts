import {
  selectLatestRunningTurnId,
  selectRunSettings,
  selectThread,
  type AgentOperationView,
  type ThreadId,
} from "@nyosegawa/agent-ui-core";
import {
  useCallback,
  useMemo,
  useState,
} from "react";
import type { AgentUserInput } from "../agent-input";
import {
  useAgentComposerQueueStore,
  type QueuedFollowUpAttachment,
} from "../composer-queue";
import { useAgentI18n } from "../i18n";
import { useAgentContext } from "../provider";
import {
  codexThreadStartParams,
  codexTurnStartOptions,
  type ThreadStartOptions,
  type TurnStartOptions,
} from "../request-options";
import { rawThreadId, threadProjectPath } from "../thread-history";
import { useCodexSession } from "./codex-session";
import {
  createFirstMessageOperationIds,
  forgetFirstMessagePayload,
  rememberFirstMessagePayload,
  useFirstMessageOperationController,
} from "./first-message-operations";
import {
  composerActionError,
  followUpSendPreflightError,
} from "./composer-errors";
import type {
  AgentComposerController,
  AgentComposerDisabledReason,
  AgentComposerSubmitMode,
} from "./composer-types";
import type { AgentThreadStartWithInputResult } from "./thread-lifecycle-types";
import { AGENT_EXECUTION_MODES } from "./run-settings";
import { useAgentTurn } from "./turn";
import {
  codexReasoningEffort,
  hasSubmittableFirstInput,
  normalizeTurnInput,
  summarizeUserInput,
  textAgentInput,
} from "./turn-input";

export interface InternalAgentComposerController extends AgentComposerController {
  cancelOperation: (operationId: string) => void;
  getOperation: (operationId: string) => AgentOperationView | undefined;
  operationsById: Record<string, AgentOperationView>;
  retryOperation: (operationId: string) => Promise<void>;
  startWithMessage: (
    input: string | AgentUserInput[],
    params?: ThreadStartOptions,
    turnOptions?: TurnStartOptions,
  ) => Promise<AgentThreadStartWithInputResult>;
}

export function useAgentComposer(threadId?: ThreadId): AgentComposerController {
  return useAgentComposerController(threadId);
}

export function useAgentComposerController(
  threadId?: ThreadId,
): AgentComposerController {
  const {
    cancelOperation,
    getOperation,
    operationsById,
    retryOperation,
    startWithMessage,
    ...composer
  } = useInternalAgentComposerController(threadId);
  void cancelOperation;
  void getOperation;
  void operationsById;
  void retryOperation;
  return {
    ...composer,
    startThreadWithInput: (input, options) => {
      const inputItems = typeof input === "string" ? input.trim() : input;
      if (!hasSubmittableFirstInput(inputItems)) {
        return Promise.reject(new Error("Cannot start a thread without input."));
      }
      return startWithMessage(inputItems, options?.threadOptions, options?.turnOptions);
    },
  };
}

export function useInternalAgentComposerController(
  threadId?: ThreadId,
): InternalAgentComposerController {
  const { t } = useAgentI18n();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInterrupting, setIsInterrupting] = useState(false);
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const composerQueue = useAgentComposerQueueStore();
  const resolvedThreadId = threadId ?? state.threadLifecycle.activeThreadId;
  const thread = resolvedThreadId ? selectThread(state, resolvedThreadId) : undefined;
  const runSettings = selectRunSettings(state);
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
  const startWithMessage = useCallback(
    async (
      input: string | AgentUserInput[],
      params?: ThreadStartOptions,
      turnOptions?: TurnStartOptions,
    ) => {
      const inputItems = typeof input === "string" ? [textAgentInput(input)] : input;
      const normalizedInput = normalizeTurnInput(inputItems);
      const promptText = summarizeUserInput(inputItems, t);
      const pending = createFirstMessageOperationIds();
      let canonicalThreadId: string | undefined;
      rememberFirstMessagePayload({
        displayText: promptText,
        input,
        normalizedInput,
        params,
        pending,
        turnOptions,
      });
      setError(undefined);
      setIsSubmitting(true);
      try {
        dispatch({
          operation: {
            id: pending.operationId,
            kind: "firstMessage",
            status: "pending",
            threadId: pending.threadId,
          },
          status: "running",
          thread: {
            ephemeral: true,
            id: pending.threadId,
            metadata: {
              optimistic: true,
              operationId: pending.operationId,
            },
            name: promptText,
            path: runSettings.cwd,
          },
          turns: [
            {
              id: pending.turnId,
              metadata: {
                optimistic: true,
                operationId: pending.operationId,
              },
              status: "running",
              threadId: pending.threadId,
            },
          ],
          type: "thread/optimistic/created",
        });
        dispatch({
          item: {
            id: pending.userMessageId,
            kind: "userMessage",
            metadata: {
              clientUserMessageId: pending.userMessageId,
              optimistic: true,
              operationId: pending.operationId,
            },
            status: "inProgress",
            text: promptText,
            threadId: pending.threadId,
            turnId: pending.turnId,
          },
          threadId: pending.threadId,
          turnId: pending.turnId,
          type: "item/started",
        });
        const result = await codex.thread.start({
          cwd: runSettings.cwd,
          model: runSettings.modelId,
          ...codexThreadStartParams(params),
        });
        const resultRecord = asRecord(result) ?? {};
        const rawThread = resultRecord.thread ?? result;
        const rawThreadRecord = asRecord(rawThread) ?? ({} as Record<string, unknown>);
        const nextThreadId = rawThreadId(rawThreadRecord);
        if (!nextThreadId) throw new Error("thread/start returned no thread id");
        canonicalThreadId = nextThreadId;
        rememberFirstMessagePayload({
          displayText: promptText,
          input,
          normalizedInput,
          params,
          pending,
          threadId: nextThreadId,
          turnOptions,
        });
        dispatch({
          status: "ready",
          thread: {
            ephemeral: Boolean(rawThreadRecord.ephemeral),
            id: nextThreadId,
            name: stringValue(rawThreadRecord.name),
            path: threadProjectPath(rawThreadRecord),
          },
          type: "thread/started",
        });
        syncRunSettingsFromRawThread(dispatch, rawThreadRecord);
        dispatch({
          canonicalThreadId: nextThreadId,
          threadId: pending.threadId,
          type: "thread/reconciled",
        });
        const executionMode = AGENT_EXECUTION_MODES.find(
          (mode) => mode.id === runSettings.executionMode,
        );
        const turnStartResult = await codex.turn.start({
          clientUserMessageId: pending.userMessageId,
          cwd: runSettings.cwd,
          effort: codexReasoningEffort(runSettings.effort),
          input: normalizedInput,
          model: runSettings.modelId,
          ...codexTurnStartOptions(executionMode?.turnParams),
          ...codexTurnStartOptions(turnOptions),
          threadId: nextThreadId,
        });
        const startedTurnId = turnStartResultId(turnStartResult) ?? pending.turnId;
        dispatch({
          operation: {
            id: pending.operationId,
            kind: "firstMessage",
            status: "succeeded",
            threadId: nextThreadId,
          },
          type: "thread/operation/updated",
        });
        forgetFirstMessagePayload(pending.operationId);
        setValue("");
        return {
          operationId: pending.operationId,
          optimisticTurnId: pending.turnId,
          threadId: nextThreadId,
          turnId: startedTurnId,
          userMessageId: pending.userMessageId,
        } satisfies AgentThreadStartWithInputResult;
      } catch (caught) {
        const error = agentError(caught);
        if (!canonicalThreadId) {
          dispatch({
            operationId: pending.operationId,
            threadId: pending.threadId,
            type: "thread/optimistic/rolledBack",
          });
          forgetFirstMessagePayload(pending.operationId);
        } else {
          dispatch({
            itemId: pending.userMessageId,
            error,
            threadId: canonicalThreadId,
            turnId: pending.turnId,
            type: "item/failed",
          });
          dispatch({
            operation: {
              error,
              id: pending.operationId,
              kind: "firstMessage",
              status: "failed",
              threadId: canonicalThreadId,
            },
            type: "thread/operation/updated",
          });
        }
        setError(composerActionError(caught, "start", t));
        throw caught;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      codex,
      dispatch,
      runSettings.cwd,
      runSettings.effort,
      runSettings.executionMode,
      runSettings.modelId,
      t,
    ],
  );
  const { cancelOperation, getOperation, operationsById, retryOperation } =
    useFirstMessageOperationController(startWithMessage);
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
  const failedPendingMessages = useMemo(
    () =>
      resolvedThreadId
        ? Object.values(operationsById)
            .filter(
              (operation) =>
                operation.kind === "firstMessage" &&
                operation.status === "failed" &&
                operation.threadId === resolvedThreadId,
            )
            .map((operation) => ({
              error: operation.error?.message,
              operationId: operation.id,
              threadId: resolvedThreadId,
            }))
        : [],
    [operationsById, resolvedThreadId],
  );
  const submitMode: AgentComposerSubmitMode = isRunning ? "stop" : "send";
  const hasTextInput = value.trim().length > 0;
  const disabledReason: AgentComposerDisabledReason | undefined = isSubmitting
    ? "submitting"
    : isInterrupting
      ? "interrupting"
      : !isRunning && !hasTextInput
        ? "empty"
        : undefined;
  const canSubmit = !disabledReason || disabledReason === "empty" ? isRunning || hasTextInput : false;
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
    canSubmit,
    cancelOperation,
    cancelFailedPendingMessage: cancelOperation,
    disabledReason,
    editQueuedFollowUp,
    error,
    failedPendingMessages,
    followUpErrors: composerQueue.followUpErrors,
    getOperation,
    isInterrupting,
    isRunning,
    isSubmitting,
    operationsById,
    queuedFollowUps: scopedQueuedFollowUps,
    removeQueuedFollowUp,
    sendQueuedFollowUp,
    sendingFollowUpIds: scopedSendingFollowUpIds,
    setError,
    setValue,
    startThreadWithInput: (input, options) =>
      startWithMessage(input, options?.threadOptions, options?.turnOptions),
    steerNow,
    stop,
    submitMode,
    submit,
    retryFailedPendingMessage: retryOperation,
    retryOperation,
    startWithMessage,
    value,
  };
}

export type { QueuedFollowUp, QueuedFollowUpAttachment } from "../composer-queue";
export type {
  AgentComposerController,
  AgentComposerDisabledReason,
  AgentComposerFailedPendingMessage,
  AgentComposerSubmitMode,
} from "./composer-types";

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

function turnStartResultId(response: unknown): string | undefined {
  const responseRecord = asRecord(response);
  const rawTurn = asRecord(responseRecord?.turn) ?? responseRecord;
  return stringValue(rawTurn?.id);
}

function agentError(caught: unknown) {
  return {
    message: caught instanceof Error ? caught.message : String(caught),
  };
}
