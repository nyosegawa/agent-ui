import {
  selectRunSettings,
  selectThread,
  type ThreadId,
  type ThreadState,
} from "@nyosegawa/agent-ui-core";
import { useCallback } from "react";
import type { AgentUserInput } from "../agent-input";
import { useAgentContext } from "../provider";
import { codexTurnStartOptions } from "../request-options";
import { useCodexSession } from "./codex-session";
import { AGENT_EXECUTION_MODES } from "./run-settings";
import { useAgentThread } from "./thread";
import type { AgentThreadResumeResult } from "./thread-lifecycle-types";
import { codexReasoningEffort, normalizeTurnInput } from "./turn-input";

export type ComposerTurnStartResult =
  | { threadId: ThreadId; type: "started" }
  | { activeTurnId?: string; threadId: ThreadId; type: "resumedRunning" }
  | { threadId: ThreadId; type: "resumedWaitingForInput" };

export function useComposerTurnStart(threadId?: ThreadId) {
  const { state } = useAgentContext();
  const codex = useCodexSession();
  const resolvedThreadId = threadId ?? state.threadLifecycle.activeThreadId;
  const thread = resolvedThreadId ? selectThread(state, resolvedThreadId) : undefined;
  const runSettings = selectRunSettings(state);
  const { resumeThread } = useAgentThread(threadId);

  return useCallback(
    async (input: AgentUserInput[]): Promise<ComposerTurnStartResult> => {
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
      const executionMode = AGENT_EXECUTION_MODES.find(
        (mode) => mode.id === runSettings.executionMode,
      );
      const turnRunSettings = composerTurnRunSettings(
        {
          cwd: runSettings.cwd,
          effort: runSettings.effort,
          modelId: runSettings.modelId,
        },
        resumeResult,
      );
      await codex.turn.start({
        cwd: turnRunSettings.cwd,
        effort: codexReasoningEffort(turnRunSettings.effort),
        input: normalizeTurnInput(input),
        model: turnRunSettings.modelId,
        ...codexTurnStartOptions(executionMode?.turnParams),
        threadId: targetThreadId,
      });
      return { threadId: targetThreadId, type: "started" };
    },
    [
      codex,
      resolvedThreadId,
      resumeThread,
      runSettings.cwd,
      runSettings.effort,
      runSettings.executionMode,
      runSettings.modelId,
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
  runSettings: { cwd?: string; effort?: string; modelId?: string },
  resumeResult: AgentThreadResumeResult | undefined,
) {
  if (resumeResult?.runSettings) return resumeResult.runSettings;
  return {
    cwd: runSettings.cwd,
    effort: runSettings.effort,
    modelId: runSettings.modelId,
  };
}
