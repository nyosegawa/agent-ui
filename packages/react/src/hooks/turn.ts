import {
  selectRunSettings,
  selectThreadLifecycle,
  type ThreadId,
} from "@nyosegawa/agent-ui-core";
import { useCallback } from "react";
import type { AgentUserInput } from "../agent-input";
import { useAgentContext } from "../provider";
import { codexTurnStartOptions } from "../request-options";
import { AGENT_EXECUTION_MODES, type TurnStartOptions } from "./run-settings";
import { useCodexSession } from "./codex-session";
import { codexReasoningEffort, normalizeTurnInput } from "./turn-input";

export function useAgentTurn(threadId?: ThreadId) {
  const { state } = useAgentContext();
  const codex = useCodexSession();
  const resolvedThreadId = threadId ?? selectThreadLifecycle(state).activeThreadId;
  const runSettings = selectRunSettings(state);

  const startTurn = useCallback(
    async (input: string | AgentUserInput[], params?: TurnStartOptions) => {
      if (!resolvedThreadId) throw new Error("No active thread");
      const executionMode = AGENT_EXECUTION_MODES.find(
        (mode) => mode.id === runSettings.executionMode,
      );
      return codex.turn.start({
        cwd: runSettings.cwd,
        effort: codexReasoningEffort(runSettings.effort),
        input: normalizeTurnInput(input),
        model: runSettings.modelId,
        ...codexTurnStartOptions(executionMode?.turnParams),
        ...codexTurnStartOptions(params),
        threadId: resolvedThreadId,
      });
    },
    [
      codex,
      resolvedThreadId,
      runSettings.cwd,
      runSettings.effort,
      runSettings.executionMode,
      runSettings.modelId,
    ],
  );

  const interruptTurn = useCallback(
    async (turnId: string) => {
      if (!resolvedThreadId) throw new Error("No active thread");
      return codex.turn.interrupt(resolvedThreadId, turnId);
    },
    [codex, resolvedThreadId],
  );

  const steerTurn = useCallback(
    async (expectedTurnId: string, input: string | AgentUserInput[]) => {
      if (!resolvedThreadId) throw new Error("No active thread");
      return codex.turn.steer({
        expectedTurnId,
        input: normalizeTurnInput(input),
        threadId: resolvedThreadId,
      });
    },
    [codex, resolvedThreadId],
  );

  return { interruptTurn, startTurn, steerTurn };
}

export const useAgentTurnController = useAgentTurn;
