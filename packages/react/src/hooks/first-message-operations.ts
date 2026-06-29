import {
  selectRunSettings,
  selectThreadLifecycle,
} from "@nyosegawa/agent-ui-core/internal";
import { useCallback } from "react";
import type { AgentUserInput } from "../agent-input";
import { useFirstMessageOperationRuntime } from "../first-message-state";
import { useInternalAgentContext } from "../provider";
import {
  codexTurnStartOptions,
  type ThreadStartOptions,
  type TurnStartOptions,
} from "../request-options";
import { agentRunPolicyTurnOptions } from "../run-policies";
import { useCodexSession } from "./codex-session";
import type { AgentThreadStartWithInputResult } from "./thread-lifecycle-types";
import { codexReasoningEffort } from "./turn-input";

export function useFirstMessageOperationController(
  startWithMessage: (
    input: string | AgentUserInput[],
    params?: ThreadStartOptions,
    turnOptions?: TurnStartOptions,
  ) => Promise<AgentThreadStartWithInputResult>,
) {
  const { dispatch, runPolicies, state } = useInternalAgentContext();
  const codex = useCodexSession();
  const firstMessageRuntime = useFirstMessageOperationRuntime();
  const operationsById = selectThreadLifecycle(state).operations;
  const runSettings = selectRunSettings(state);
  const getOperation = useCallback(
    (operationId: string) => operationsById[operationId],
    [operationsById],
  );
  const hasRetryPayload = useCallback(
    (operationId: string) => firstMessageRuntime.hasPayload(operationId),
    [firstMessageRuntime],
  );
  const retryOperation = useCallback(
    async (operationId: string) => {
      const payload = firstMessageRuntime.getPayload(operationId);
      if (!payload) throw new Error(`No retry payload for operation ${operationId}`);
      if (!firstMessageRuntime.beginRetry(operationId)) return;
      const existingOperation = operationsById[operationId];
      if (existingOperation?.status !== "failed") {
        firstMessageRuntime.stopRetry(operationId);
        throw new Error(
          `Cannot retry operation ${operationId} while ${existingOperation?.status ?? "unknown"}`,
        );
      }
      firstMessageRuntime.resetCancellation(operationId);
      if (!payload.threadId) {
        try {
          await startWithMessage(payload.input, payload.params, payload.turnOptions);
        } finally {
          firstMessageRuntime.stopRetry(operationId);
        }
        return;
      }
      dispatch({
        item: {
          id: payload.pending.userMessageId,
          kind: "userMessage",
          metadata: {
            clientUserMessageId: payload.pending.userMessageId,
            optimistic: true,
            operationId,
            retrying: true,
          },
          status: "inProgress",
          text: payload.displayText,
          threadId: payload.threadId,
          turnId: payload.pending.turnId,
        },
        threadId: payload.threadId,
        turnId: payload.pending.turnId,
        type: "item/started",
      });
      dispatch({
        operation: {
          ...(existingOperation ?? {
            id: operationId,
            kind: "firstMessage",
            threadId: payload.threadId,
          }),
          error: undefined,
          status: "pending",
        },
        type: "thread/operation/updated",
      });
      try {
        await codex.turn.start({
          clientUserMessageId: payload.pending.userMessageId,
          effort: codexReasoningEffort(runSettings.effort),
          input: payload.normalizedInput,
          model: runSettings.modelId,
          ...codexTurnStartOptions(
            agentRunPolicyTurnOptions(runSettings.policyId, runPolicies),
          ),
          ...codexTurnStartOptions(payload.turnOptions),
          threadId: payload.threadId,
        });
        if (!firstMessageRuntime.isCancelled(operationId)) {
          dispatch({
            operation: {
              id: operationId,
              kind: "firstMessage",
              status: "succeeded",
              threadId: payload.threadId,
            },
            type: "thread/operation/updated",
          });
          firstMessageRuntime.forget(operationId);
        }
      } catch (caught) {
        const error = agentError(caught);
        if (!firstMessageRuntime.isCancelled(operationId)) {
          dispatch({
            error,
            itemId: payload.pending.userMessageId,
            threadId: payload.threadId,
            turnId: payload.pending.turnId,
            type: "item/failed",
          });
          dispatch({
            threadId: payload.threadId,
            turn: {
              id: payload.pending.turnId,
              metadata: {
                optimistic: true,
                operationId,
              },
              status: "failed",
              threadId: payload.threadId,
            },
            type: "turn/completed",
          });
          dispatch({
            operation: {
              error,
              id: operationId,
              kind: "firstMessage",
              status: "failed",
              threadId: payload.threadId,
            },
            type: "thread/operation/updated",
          });
        }
        if (firstMessageRuntime.isCancelled(operationId)) return;
        throw caught;
      } finally {
        firstMessageRuntime.stopRetry(operationId);
      }
    },
    [
      codex,
      dispatch,
      firstMessageRuntime,
      operationsById,
      runSettings.effort,
      runSettings.modelId,
      runSettings.policyId,
      runPolicies,
      startWithMessage,
    ],
  );
  const cancelOperation = useCallback(
    (operationId: string) => {
      const operation = operationsById[operationId];
      if (!operation) return;
      const payload = firstMessageRuntime.getPayload(operationId);
      firstMessageRuntime.cancel(operationId);
      if (payload?.threadId) {
        dispatch({
          error: operation.error ?? { message: "Retry cancelled." },
          itemId: payload.pending.userMessageId,
          threadId: payload.threadId,
          turnId: payload.pending.turnId,
          type: "item/failed",
        });
        dispatch({
          threadId: payload.threadId,
          turn: {
            id: payload.pending.turnId,
            metadata: {
              optimistic: true,
              operationId,
            },
            status: "failed",
            threadId: payload.threadId,
          },
          type: "turn/completed",
        });
      }
      firstMessageRuntime.forget(operationId);
      dispatch({
        operation: {
          ...operation,
          status: "cancelled",
        },
        type: "thread/operation/updated",
      });
    },
    [dispatch, firstMessageRuntime, operationsById],
  );
  return {
    cancelOperation,
    getOperation,
    hasRetryPayload,
    operationsById,
    retryOperation,
  };
}

function agentError(caught: unknown) {
  return {
    message: caught instanceof Error ? caught.message : String(caught),
  };
}
