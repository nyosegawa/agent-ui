import {
  selectRunSettings,
  selectThreadLifecycle,
} from "@nyosegawa/agent-ui-core/internal";
import type { CodexStable } from "@nyosegawa/agent-ui-codex/stable-types";
import { useCallback } from "react";
import type { AgentUserInput } from "../agent-input";
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

export interface FirstMessageOperationIds {
  operationId: string;
  threadId: string;
  turnId: string;
  userMessageId: string;
}

export interface FirstMessageRetryPayload {
  displayText: string;
  input: string | AgentUserInput[];
  normalizedInput: string | CodexStable.v2.TurnStartParams["input"];
  params?: ThreadStartOptions;
  pending: FirstMessageOperationIds;
  threadId?: string;
  turnOptions?: TurnStartOptions;
}

const firstMessagePayloads: Record<string, FirstMessageRetryPayload> = {};
const cancelledOperations = new Set<string>();
const retryingOperations = new Set<string>();

export function rememberFirstMessagePayload(payload: FirstMessageRetryPayload) {
  firstMessagePayloads[payload.pending.operationId] = payload;
}

export function forgetFirstMessagePayload(operationId: string) {
  delete firstMessagePayloads[operationId];
}

export function createFirstMessageOperationIds(): FirstMessageOperationIds {
  const id = randomOperationSuffix();
  return {
    operationId: `first-message-${id}`,
    threadId: `pending-thread-${id}`,
    turnId: `pending-turn-${id}`,
    userMessageId: `pending-user-message-${id}`,
  };
}

export function useFirstMessageOperationController(
  startWithMessage: (
    input: string | AgentUserInput[],
    params?: ThreadStartOptions,
    turnOptions?: TurnStartOptions,
  ) => Promise<AgentThreadStartWithInputResult>,
) {
  const { dispatch, runPolicies, state } = useInternalAgentContext();
  const codex = useCodexSession();
  const operationsById = selectThreadLifecycle(state).operations;
  const runSettings = selectRunSettings(state);
  const getOperation = useCallback(
    (operationId: string) => operationsById[operationId],
    [operationsById],
  );
  const retryOperation = useCallback(
    async (operationId: string) => {
      const payload = firstMessagePayloads[operationId];
      if (!payload) throw new Error(`No retry payload for operation ${operationId}`);
      if (retryingOperations.has(operationId)) {
        throw new Error(`Cannot retry operation ${operationId} while pending`);
      }
      const existingOperation = operationsById[operationId];
      if (existingOperation?.status !== "failed") {
        throw new Error(`Cannot retry operation ${operationId} while ${existingOperation?.status ?? "unknown"}`);
      }
      cancelledOperations.delete(operationId);
      retryingOperations.add(operationId);
      if (!payload.threadId) {
        try {
          await startWithMessage(payload.input, payload.params, payload.turnOptions);
        } finally {
          retryingOperations.delete(operationId);
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
        if (!cancelledOperations.has(operationId)) {
          dispatch({
            operation: {
              id: operationId,
              kind: "firstMessage",
              status: "succeeded",
              threadId: payload.threadId,
            },
            type: "thread/operation/updated",
          });
          forgetFirstMessagePayload(operationId);
        }
      } catch (caught) {
        const error = agentError(caught);
        if (!cancelledOperations.has(operationId)) {
          dispatch({
            error,
            itemId: payload.pending.userMessageId,
            threadId: payload.threadId,
            turnId: payload.pending.turnId,
            type: "item/failed",
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
        throw caught;
      } finally {
        retryingOperations.delete(operationId);
      }
    },
    [
      codex,
      dispatch,
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
      const payload = firstMessagePayloads[operationId];
      cancelledOperations.add(operationId);
      retryingOperations.delete(operationId);
      if (payload?.threadId) {
        dispatch({
          error: operation.error ?? { message: "Retry cancelled." },
          itemId: payload.pending.userMessageId,
          threadId: payload.threadId,
          turnId: payload.pending.turnId,
          type: "item/failed",
        });
      }
      forgetFirstMessagePayload(operationId);
      dispatch({
        operation: {
          ...operation,
          status: "cancelled",
        },
        type: "thread/operation/updated",
      });
    },
    [dispatch, operationsById],
  );
  return { cancelOperation, getOperation, operationsById, retryOperation };
}

function agentError(caught: unknown) {
  return {
    message: caught instanceof Error ? caught.message : String(caught),
  };
}

function randomOperationSuffix() {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
