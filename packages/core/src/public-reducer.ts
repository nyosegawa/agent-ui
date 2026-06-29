import type { AgentEvent } from "./events";
import { agentReducer as internalAgentReducer } from "./reducer";
import type { AgentSessionState as InternalAgentSessionState } from "./state";
import {
  internalAgentSessionState,
  publicAgentSessionState,
  type AgentSessionState,
} from "./public-state";

export function agentReducer(
  state: AgentSessionState | undefined,
  event: AgentEvent,
): AgentSessionState {
  return publicAgentSessionState(
    internalAgentReducer(
      state ? internalAgentSessionState(state) : undefined,
      event,
    ) as InternalAgentSessionState,
  );
}
