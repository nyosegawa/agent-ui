import { createCodexSession } from "@nyosegawa/agent-ui-codex/session";
import { useMemo } from "react";
import { useInternalAgentContext } from "../provider";

export function useCodexSession() {
  const { transport } = useInternalAgentContext();
  return useMemo(() => createCodexSession(transport), [transport]);
}
