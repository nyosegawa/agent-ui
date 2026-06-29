import {
  selectRunSettings,
  selectThreadLifecycle,
} from "@nyosegawa/agent-ui-core/internal";
import type { ThreadId } from "@nyosegawa/agent-ui-core";
import { useCallback } from "react";
import type { AgentUserInput } from "../agent-input";
import { useInternalAgentContext } from "../provider";
import { codexTurnStartOptions } from "../request-options";
import { agentRunPolicyTurnOptions } from "../run-policies";
import type { TurnStartOptions } from "./run-settings";
import { useCodexSession } from "./codex-session";
import { codexReasoningEffort, normalizeTurnInput } from "./turn-input";

export interface AgentTurnController {
  interruptTurn: (turnId: string) => Promise<void>;
  startTurn: (input: string | AgentUserInput[], params?: TurnStartOptions) => Promise<void>;
  steerTurn: (expectedTurnId: string, input: string | AgentUserInput[]) => Promise<void>;
}

export function useInternalAgentTurn(threadId?: ThreadId): AgentTurnController {
  const { runPolicies, state } = useInternalAgentContext();
  const codex = useCodexSession();
  const resolvedThreadId = threadId ?? selectThreadLifecycle(state).activeThreadId;
  const runSettings = selectRunSettings(state);

  const startTurn = useCallback(
    async (input: string | AgentUserInput[], params?: TurnStartOptions) => {
      if (!resolvedThreadId) throw new Error("No active thread");
      await codex.turn.start({
        effort: codexReasoningEffort(runSettings.effort),
        input: normalizeTurnInput(input),
        model: runSettings.modelId,
        ...codexTurnStartOptions(
          agentRunPolicyTurnOptions(runSettings.policyId, runPolicies),
        ),
        ...codexTurnStartOptions(params),
        threadId: resolvedThreadId,
      });
    },
    [
      codex,
      resolvedThreadId,
      runSettings.effort,
      runSettings.modelId,
      runSettings.policyId,
      runPolicies,
    ],
  );

  const interruptTurn = useCallback(
    async (turnId: string) => {
      if (!resolvedThreadId) throw new Error("No active thread");
      await codex.turn.interrupt(resolvedThreadId, turnId);
    },
    [codex, resolvedThreadId],
  );

  const steerTurn = useCallback(
    async (expectedTurnId: string, input: string | AgentUserInput[]) => {
      if (!resolvedThreadId) throw new Error("No active thread");
      await codex.turn.steer({
        expectedTurnId,
        input: normalizeTurnInput(input),
        threadId: resolvedThreadId,
      });
    },
    [codex, resolvedThreadId],
  );

  return { interruptTurn, startTurn, steerTurn };
}

export function useAgentTurnController(threadId?: ThreadId): AgentTurnController {
  return useInternalAgentTurn(threadId);
}
