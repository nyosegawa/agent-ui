import {
  createInitialAgentState as createInitialInternalAgentState,
  type AgentSessionState as InternalAgentSessionState,
} from "./state";

export type AgentSessionState = unknown;

export function createInitialAgentState(): AgentSessionState {
  return createInitialInternalAgentState() as unknown as AgentSessionState;
}

export function internalAgentSessionState(
  state: AgentSessionState,
): InternalAgentSessionState {
  return state as unknown as InternalAgentSessionState;
}

export function publicAgentSessionState(
  state: InternalAgentSessionState,
): AgentSessionState {
  return state as unknown as AgentSessionState;
}
