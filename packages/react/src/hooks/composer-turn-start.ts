import {
  selectRunSettings,
  selectThread,
  type ThreadId,
  type ThreadState,
} from "@nyosegawa/agent-ui-core/internal";
import { useCallback } from "react";
import type { AgentUserInput } from "../agent-input";
import { useInternalAgentContext } from "../provider";
import { codexTurnStartOptions, type TurnStartOptions } from "../request-options";
import { agentRunPolicyTurnOptions } from "../run-policies";
import { useCodexSession } from "./codex-session";
import { useAgentThread } from "./thread";
import type { AgentThreadResumeResult } from "./thread-lifecycle-types";
import { codexReasoningEffort, normalizeTurnInput } from "./turn-input";

export type ComposerTurnStartResult =
  | { threadId: ThreadId; type: "started" }
  | { activeTurnId?: string; threadId: ThreadId; type: "resumedRunning" }
  | { threadId: ThreadId; type: "resumedWaitingForInput" };

export function useComposerTurnStart(threadId?: ThreadId) {
  const { runPolicies, state } = useInternalAgentContext();
  const codex = useCodexSession();
  const resolvedThreadId = threadId ?? state.threadLifecycle.activeThreadId;
  const thread = resolvedThreadId ? selectThread(state, resolvedThreadId) : undefined;
  const runSettings = selectRunSettings(state);
  const { resumeThread } = useAgentThread(threadId);

  return useCallback(
    async (
      input: AgentUserInput[],
      turnOptions?: TurnStartOptions,
    ): Promise<ComposerTurnStartResult> => {
      if (!resolvedThreadId) throw new Error("No active thread");
      const resumeResult = shouldResumeBeforeTurnStart(thread)
        ? await resumeThread(resolvedThreadId)
        : undefined;
      const targetThreadId = resumeResult?.threadId ?? resolvedThreadId;
      if (resumeResult?.activity === "running") {
        return {
          ...(resumeResult.activeTurnId ? { activeTurnId: resumeResult.activeTurnId } : {}),
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
      await codex.turn.start({
        effort: codexReasoningEffort(turnRunSettings.effort),
        input: normalizeTurnInput(input),
        model: turnRunSettings.modelId,
        ...codexTurnStartOptions(
          agentRunPolicyTurnOptions(runSettings.policyId, runPolicies),
        ),
        ...codexTurnStartOptions(turnOptions),
        threadId: targetThreadId,
      });
      return { threadId: targetThreadId, type: "started" };
    },
    [
      codex,
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
