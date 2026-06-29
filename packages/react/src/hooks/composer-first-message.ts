import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { AgentUserInput } from "../agent-input";
import {
  createFirstMessageOperationIds,
  useFirstMessageOperationRuntime,
} from "../first-message-state";
import { useAgentI18n } from "../i18n";
import { useInternalAgentContext } from "../provider";
import {
  codexThreadStartParams,
  codexTurnStartOptions,
  type ThreadStartOptions,
  type TurnStartOptions,
} from "../request-options";
import { agentRunPolicyTurnOptions } from "../run-policies";
import { rawThreadId, threadProjectPath } from "../thread-history";
import { useCodexSession } from "./codex-session";
import { composerActionError } from "./composer-errors";
import type { AgentThreadStartWithInputResult } from "./thread-lifecycle-types";
import { turnStartResultId } from "./thread-lifecycle-results";
import { syncRunSettingsFromRawThread } from "./thread-run-settings";
import {
  codexReasoningEffort,
  normalizeTurnInput,
  summarizeUserInput,
  textAgentInput,
} from "./turn-input";

interface ComposerFirstMessageStartOptions {
  setError: Dispatch<SetStateAction<string | undefined>>;
  setIsSubmitting: (next: boolean) => void;
  setValue: Dispatch<SetStateAction<string>>;
}

export function useComposerFirstMessageStart({
  setError,
  setIsSubmitting,
  setValue,
}: ComposerFirstMessageStartOptions) {
  const { t } = useAgentI18n();
  const { dispatch, runPolicies, state } = useInternalAgentContext();
  const codex = useCodexSession();
  const firstMessageRuntime = useFirstMessageOperationRuntime();
  const runSettings = state.runSettings;

  return useCallback(
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
      firstMessageRuntime.remember({
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
        const rawThreadRecord = asRecord(rawThread) ?? {};
        const nextThreadId = rawThreadId(rawThreadRecord);
        if (!nextThreadId) throw new Error("thread/start returned no thread id");
        canonicalThreadId = nextThreadId;
        firstMessageRuntime.remember({
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
        const turnStartResult = await codex.turn.start({
          clientUserMessageId: pending.userMessageId,
          effort: codexReasoningEffort(runSettings.effort),
          input: normalizedInput,
          model: runSettings.modelId,
          ...codexTurnStartOptions(
            agentRunPolicyTurnOptions(runSettings.policyId, runPolicies),
          ),
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
        firstMessageRuntime.forget(pending.operationId);
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
          firstMessageRuntime.forget(pending.operationId);
        } else {
          dispatch({
            itemId: pending.userMessageId,
            error,
            threadId: canonicalThreadId,
            turnId: pending.turnId,
            type: "item/failed",
          });
          dispatch({
            threadId: canonicalThreadId,
            turn: {
              id: pending.turnId,
              metadata: {
                optimistic: true,
                operationId: pending.operationId,
              },
              status: "failed",
              threadId: canonicalThreadId,
            },
            type: "turn/completed",
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
      firstMessageRuntime,
      runSettings.cwd,
      runSettings.effort,
      runSettings.modelId,
      runSettings.policyId,
      runPolicies,
      setError,
      setIsSubmitting,
      setValue,
      t,
    ],
  );
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function agentError(caught: unknown) {
  return {
    message: caught instanceof Error ? caught.message : String(caught),
  };
}
