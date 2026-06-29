import {
  selectRunSettings,
  selectThread,
  type ThreadState,
} from "@nyosegawa/agent-ui-core/internal";
import type { ThreadId } from "@nyosegawa/agent-ui-core";
import { useCallback } from "react";
import type { AgentUserInput } from "../agent-input";
import { useInternalAgentContext } from "../provider";
import { codexTurnStartOptions, type TurnStartOptions } from "../request-options";
import { agentRunPolicyTurnOptions } from "../run-policies";
import { useCodexSession } from "./codex-session";
import { useAgentThreadController } from "./thread";
import type { AgentThreadResumeResult } from "./thread-lifecycle-types";
import { codexReasoningEffort, normalizeTurnInput } from "./turn-input";

export type ComposerTurnStartResult =
  | {
      optimisticTurnId: string;
      threadId: ThreadId;
      type: "started";
      userMessageId: string;
    }
  | { activeTurnId?: string; threadId: ThreadId; type: "resumedRunning" }
  | { threadId: ThreadId; type: "resumedWaitingForInput" };

export interface ComposerTurnStartOptions {
  displayText: string;
  turnOptions?: TurnStartOptions;
}

interface ComposerTurnOperationIds {
  turnId: string;
  userMessageId: string;
}

export function useComposerTurnStart(threadId?: ThreadId) {
  const { dispatch, runPolicies, state } = useInternalAgentContext();
  const codex = useCodexSession();
  const resolvedThreadId = threadId ?? state.threadLifecycle.activeThreadId;
  const thread = resolvedThreadId ? selectThread(state, resolvedThreadId) : undefined;
  const runSettings = selectRunSettings(state);
  const { resumeThread } = useAgentThreadController(threadId);

  return useCallback(
    async (
      input: AgentUserInput[],
      options: ComposerTurnStartOptions,
    ): Promise<ComposerTurnStartResult> => {
      if (!resolvedThreadId) throw new Error("No active thread");
      const resumeResult = shouldResumeBeforeTurnStart(thread)
        ? await resumeThread(resolvedThreadId)
        : undefined;
      const targetThreadId = resumeResult?.threadId ?? resolvedThreadId;
      if (resumeResult?.activity === "running") {
        return {
          ...(resumeResult.activeTurnId
            ? { activeTurnId: resumeResult.activeTurnId }
            : {}),
          threadId: targetThreadId,
          type: "resumedRunning",
        };
      }
      if (resumeResult?.activity === "waitingForInput") {
        return { threadId: targetThreadId, type: "resumedWaitingForInput" };
      }
      const turnRunSettings = composerTurnRunSettings(
        {
          effort: runSettings.effort,
          modelId: runSettings.modelId,
        },
        resumeResult,
      );
      const pending = createComposerTurnOperationIds();
      dispatch({
        threadId: targetThreadId,
        turn: {
          id: pending.turnId,
          metadata: { optimistic: true },
          status: "running",
          threadId: targetThreadId,
        },
        type: "turn/started",
      });
      dispatch({
        item: {
          id: pending.userMessageId,
          kind: "userMessage",
          metadata: {
            clientUserMessageId: pending.userMessageId,
            optimistic: true,
          },
          status: "inProgress",
          text: options.displayText,
          threadId: targetThreadId,
          turnId: pending.turnId,
        },
        threadId: targetThreadId,
        turnId: pending.turnId,
        type: "item/started",
      });
      try {
        await codex.turn.start({
          clientUserMessageId: pending.userMessageId,
          effort: codexReasoningEffort(turnRunSettings.effort),
          input: normalizeTurnInput(input),
          model: turnRunSettings.modelId,
          ...codexTurnStartOptions(
            agentRunPolicyTurnOptions(runSettings.policyId, runPolicies),
          ),
          ...codexTurnStartOptions(options.turnOptions),
          threadId: targetThreadId,
        });
      } catch (caught) {
        dispatch({
          error: {
            message: caught instanceof Error ? caught.message : String(caught),
          },
          itemId: pending.userMessageId,
          threadId: targetThreadId,
          turnId: pending.turnId,
          type: "item/failed",
        });
        dispatch({
          threadId: targetThreadId,
          turn: {
            id: pending.turnId,
            metadata: { optimistic: true },
            status: "failed",
            threadId: targetThreadId,
          },
          type: "turn/completed",
        });
        throw caught;
      }
      return {
        optimisticTurnId: pending.turnId,
        threadId: targetThreadId,
        type: "started",
        userMessageId: pending.userMessageId,
      };
    },
    [
      codex,
      dispatch,
      resolvedThreadId,
      resumeThread,
      runSettings.effort,
      runSettings.modelId,
      runSettings.policyId,
      runPolicies,
      thread,
    ],
  );
}

function shouldResumeBeforeTurnStart(thread: ThreadState | undefined): boolean {
  if (!thread) return false;
  return (
    thread.availability === "preview" ||
    (thread.storage === "stored" &&
      (thread.status === "notLoaded" || thread.status === "loaded"))
  );
}

function composerTurnRunSettings(
  runSettings: { effort?: string; modelId?: string },
  resumeResult: AgentThreadResumeResult | undefined,
) {
  if (resumeResult?.runSettings) return resumeResult.runSettings;
  return {
    effort: runSettings.effort,
    modelId: runSettings.modelId,
  };
}

function createComposerTurnOperationIds(): ComposerTurnOperationIds {
  const id = randomOperationSuffix();
  return {
    turnId: `pending-turn-${id}`,
    userMessageId: `pending-user-message-${id}`,
  };
}

function randomOperationSuffix() {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
