import { selectAccountRateLimits } from "@nyosegawa/agent-ui-core/internal";
import { useCallback } from "react";
import { useInternalAgentContext } from "../provider";
import { useCodexSession } from "./codex-session";

export function useAgentUsage() {
  const { dispatch, state } = useInternalAgentContext();
  const codex = useCodexSession();
  const rateLimits = selectAccountRateLimits(state);
  const refreshUsage = useCallback(async () => {
    const response = await codex.account.rateLimitsRead();
    dispatch({ rateLimits: response, type: "account/rateLimits/updated" });
  }, [codex, dispatch]);
  return { rateLimits, refreshUsage };
}
