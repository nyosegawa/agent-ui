import type { AgentEvent } from "./events";
import { agentReducer } from "./reducer";
import type { AgentSessionState } from "./state";
import { createInitialAgentState } from "./state";

export interface FixtureStep {
  name?: string;
  event: AgentEvent;
}

export function runEventFixture(
  steps: FixtureStep[],
  initialState: AgentSessionState = createInitialAgentState(),
): AgentSessionState {
  return steps.reduce((state, step) => agentReducer(state, step.event), initialState);
}
