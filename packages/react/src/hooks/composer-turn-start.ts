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
import { codexReasoningEffort, normalizeTurnInput } from "./turn-input";

export function useComposerTurnStart(threadId?: ThreadId) {
  const { state } = useAgentContext();
  const codex = useCodexSession();
  const resolvedThreadId = threadId ?? state.threadLifecycle.activeThreadId;
  const thread = resolvedThreadId ? selectThread(state, resolvedThreadId) : undefined;
  const runSettings = selectRunSettings(state);
  const { resumeThread } = useAgentThread(threadId);

  return useCallback(
    async (input: AgentUserInput[]) => {
      if (!resolvedThreadId) throw new Error("No active thread");
      const targetThreadId = shouldResumeBeforeTurnStart(thread)
        ? (await resumeThread(resolvedThreadId)).threadId
        : resolvedThreadId;
      const executionMode = AGENT_EXECUTION_MODES.find(
        (mode) => mode.id === runSettings.executionMode,
      );
      await codex.turn.start({
        cwd: runSettings.cwd,
        effort: codexReasoningEffort(runSettings.effort),
        input: normalizeTurnInput(input),
        model: runSettings.modelId,
        ...codexTurnStartOptions(executionMode?.turnParams),
        threadId: targetThreadId,
      });
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
