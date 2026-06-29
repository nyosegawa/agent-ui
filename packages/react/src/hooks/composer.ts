import {
  selectLatestRunningTurnId,
  selectThread,
  type AgentOperationView,
} from "@nyosegawa/agent-ui-core/internal";
import type { ThreadId } from "@nyosegawa/agent-ui-core";
import { useCallback, useMemo, type SetStateAction } from "react";
import type { AgentUserInput } from "../agent-input";
import {
  useAgentComposerQueueStore,
  type QueuedFollowUpAttachment,
} from "../composer-queue";
import { useAgentComposerDraftState } from "../composer-state";
import { useAgentI18n } from "../i18n";
import { useInternalAgentContext } from "../provider";
import type { ThreadStartOptions, TurnStartOptions } from "../request-options";
import { useFirstMessageOperationController } from "./first-message-operations";
import { composerActionError, followUpSendPreflightError } from "./composer-errors";
import { useComposerFirstMessageStart } from "./composer-first-message";
import type {
  AgentChatController,
  AgentComposerController,
  AgentComposerDisabledReason,
  AgentComposerSendMessageOptions,
  AgentComposerSendMessageResult,
  AgentComposerSubmitMode,
} from "./composer-types";
import type { AgentThreadStartWithInputResult } from "./thread-lifecycle-types";
import { useInternalAgentTurn } from "./turn";
import { useComposerTurnStart } from "./composer-turn-start";
import {
  hasSubmittableFirstInput,
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

export function useAgentComposerController(threadId?: ThreadId): AgentComposerController {
  return usePublicAgentComposerController(threadId);
}

export function useAgentChatController(threadId?: ThreadId): AgentChatController {
  return usePublicAgentComposerController(threadId);
}

function usePublicAgentComposerController(threadId?: ThreadId): AgentChatController {
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
  const { dispatch, state } = useInternalAgentContext();
  const composerQueue = useAgentComposerQueueStore();
  const resolvedThreadId = threadId ?? state.threadLifecycle.activeThreadId;
  const thread = resolvedThreadId ? selectThread(state, resolvedThreadId) : undefined;
  const { interruptTurn, steerTurn } = useInternalAgentTurn(threadId);
  const startComposerTurn = useComposerTurnStart(threadId);
  const activeTurnId = resolvedThreadId
    ? selectLatestRunningTurnId(state, resolvedThreadId)
    : undefined;
  const composerScopeKey = resolvedThreadId ?? "__agent-ui-active-composer__";
  const [draftState, setDraftState] = useAgentComposerDraftState(composerScopeKey);
  const { error, isInterrupting, isSubmitting, value } = draftState;
  const setValue = useCallback(
    (update: SetStateAction<string>) => {
      setDraftState((previous) => ({
        ...previous,
        value: typeof update === "function" ? update(previous.value) : update,
      }));
    },
    [setDraftState],
  );
  const setError = useCallback(
    (update: SetStateAction<string | undefined>) => {
      setDraftState((previous) => ({
        ...previous,
        error: typeof update === "function" ? update(previous.error) : update,
      }));
    },
    [setDraftState],
  );
  const setIsSubmitting = useCallback(
    (next: boolean) => {
      setDraftState((previous) => ({ ...previous, isSubmitting: next }));
    },
    [setDraftState],
  );
  const setIsInterrupting = useCallback(
    (next: boolean) => {
      setDraftState((previous) => ({ ...previous, isInterrupting: next }));
    },
    [setDraftState],
  );
  const isRunning = thread?.activity === "running";
  const isWaitingForInput = thread?.activity === "waitingForInput";
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
  const buildExplicitInput = useCallback(
    (input: string | AgentUserInput[]) => {
      const inputItems = typeof input === "string" ? input.trim() : input;
      if (!hasSubmittableFirstInput(inputItems)) return undefined;
      const items =
        typeof inputItems === "string" ? [textAgentInput(inputItems)] : inputItems;
      return {
        input: items,
        source: inputItems,
        text: typeof inputItems === "string" ? inputItems : summarizeUserInput(items, t),
      };
    },
    [t],
  );
  const enqueueBuiltFollowUp = useCallback(
    (
      built: { input: AgentUserInput[]; text: string },
      attachments: QueuedFollowUpAttachment[] = [],
      options: { expectedTurnId?: string; threadId?: ThreadId } = {},
    ) => {
      const queueThreadId = options.threadId ?? resolvedThreadId;
      if (!built || !queueThreadId) return;
      const expectedTurnId = options.expectedTurnId ?? activeTurnId;
      const id = composerQueue.enqueueFollowUp({
        attachments,
        expectedTurnId,
        input: built.input,
        text: built.text || summarizeUserInput(built.input, t),
        threadId: queueThreadId,
      });
      setValue("");
      return id;
    },
    [activeTurnId, composerQueue, resolvedThreadId],
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
  const sendBuiltInput = useCallback(
    async (
      built: { input: AgentUserInput[]; text: string },
      options: { attachments?: QueuedFollowUpAttachment[] } = {},
    ) => {
      if (isWaitingForInput) {
        setError(t("composer.resolveApprovalReason"));
        return;
      }
      if (isRunning) {
        return enqueueBuiltFollowUp(built, options.attachments);
      }
      setError(undefined);
      setIsSubmitting(true);
      try {
        const result = await startComposerTurn(built.input, {
          displayText: built.text,
        });
        if (result.type === "resumedRunning") {
          return enqueueBuiltFollowUp(built, options.attachments, {
            expectedTurnId: result.activeTurnId,
            threadId: result.threadId,
          });
        }
        if (result.type === "resumedWaitingForInput") {
          setError(t("composer.resolveApprovalReason"));
          return;
        }
        setValue("");
        return "sent";
      } catch (caught) {
        setError(composerActionError(caught, "start", t));
        throw caught;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      enqueueBuiltFollowUp,
      isRunning,
      isWaitingForInput,
      setError,
      setIsSubmitting,
      setValue,
      startComposerTurn,
      t,
    ],
  );
  const submit = useCallback(
    async (
      items: AgentUserInput[] = [],
      options: { attachments?: QueuedFollowUpAttachment[] } = {},
    ) => {
      const built = buildInput(items);
      if (!built) return;
      return sendBuiltInput(built, options);
    },
    [buildInput, sendBuiltInput],
  );
  const startWithMessage = useComposerFirstMessageStart({
    setError,
    setIsSubmitting,
    setValue,
  });
  const {
    cancelOperation,
    getOperation,
    hasRetryPayload,
    operationsById,
    retryOperation,
  } = useFirstMessageOperationController(startWithMessage);
  const sendMessage = useCallback(
    async (
      input: string | AgentUserInput[],
      options: AgentComposerSendMessageOptions = {},
    ): Promise<AgentComposerSendMessageResult> => {
      const built = buildExplicitInput(input);
      if (!built) throw new Error("Cannot send a message without input.");
      if (!resolvedThreadId) {
        const result = await startWithMessage(
          built.source,
          options.threadOptions,
          options.turnOptions,
        );
        return { ...result, type: "started" };
      }
      if (isWaitingForInput) {
        setError(t("composer.resolveApprovalReason"));
        return { reason: "approval", threadId: resolvedThreadId, type: "blocked" };
      }
      if (isRunning) {
        const queuedFollowUpId = enqueueBuiltFollowUp(built, options.queuedAttachments);
        if (!queuedFollowUpId) {
          return { reason: "approval", threadId: resolvedThreadId, type: "blocked" };
        }
        return { queuedFollowUpId, threadId: resolvedThreadId, type: "queued" };
      }
      setError(undefined);
      setIsSubmitting(true);
      try {
        const result = await startComposerTurn(built.input, {
          displayText: built.text,
          turnOptions: options.turnOptions,
        });
        if (result.type === "resumedRunning") {
          const queuedFollowUpId = enqueueBuiltFollowUp(
            built,
            options.queuedAttachments,
            {
              expectedTurnId: result.activeTurnId,
              threadId: result.threadId,
            },
          );
          if (!queuedFollowUpId) throw new Error("Could not queue follow-up.");
          return { queuedFollowUpId, threadId: result.threadId, type: "queued" };
        }
        if (result.type === "resumedWaitingForInput") {
          setError(t("composer.resolveApprovalReason"));
          return { reason: "approval", threadId: result.threadId, type: "blocked" };
        }
        setValue("");
        return { threadId: result.threadId, type: "sent" };
      } catch (caught) {
        setError(composerActionError(caught, "start", t));
        throw caught;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      buildExplicitInput,
      enqueueBuiltFollowUp,
      isRunning,
      isWaitingForInput,
      resolvedThreadId,
      setError,
      setIsSubmitting,
      setValue,
      startComposerTurn,
      startWithMessage,
      t,
    ],
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
              retryable: hasRetryPayload(operation.id),
              threadId: resolvedThreadId,
            }))
        : [],
    [hasRetryPayload, operationsById, resolvedThreadId],
  );
  const submitMode: AgentComposerSubmitMode = isRunning ? "stop" : "send";
  const hasTextInput = value.trim().length > 0;
  const disabledReason: AgentComposerDisabledReason | undefined = isSubmitting
    ? "submitting"
    : isInterrupting
      ? "interrupting"
      : isWaitingForInput
        ? "approval"
        : !isRunning && !hasTextInput
          ? "empty"
          : undefined;
  const canSubmit =
    !disabledReason || disabledReason === "empty" ? isRunning || hasTextInput : false;
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
    sendMessage,
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
    threadId: resolvedThreadId,
    value,
  };
}

export type { QueuedFollowUp, QueuedFollowUpAttachment } from "../composer-queue";
export type {
  AgentComposerController,
  AgentChatController,
  AgentComposerDisabledReason,
  AgentComposerFailedPendingMessage,
  AgentComposerSendMessageOptions,
  AgentComposerSendMessageResult,
  AgentComposerSubmitMode,
} from "./composer-types";
