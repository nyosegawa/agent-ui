import { createCodexSession } from "@nyosegawa/agent-ui-codex/session";
import { useMemo } from "react";
import { useAgentContext } from "../provider";

export function useCodexSession() {
  const { transport } = useAgentContext();
  return useMemo(() => createCodexSession(transport), [transport]);
}
