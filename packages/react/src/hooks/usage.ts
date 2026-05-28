import { selectAccountRateLimits } from "@nyosegawa/agent-ui-core";
import { useCallback } from "react";
import { useAgentContext } from "../provider";
import { useCodexSession } from "./codex-session";

export function useAgentUsage() {
  const { dispatch, state } = useAgentContext();
  const codex = useCodexSession();
  const rateLimits = selectAccountRateLimits(state);
  const refreshUsage = useCallback(async () => {
    const response = await codex.account.rateLimitsRead();
    dispatch({ rateLimits: response, type: "account/rateLimits/updated" });
    return response;
  }, [codex, dispatch]);
  return { rateLimits, refreshUsage };
}
