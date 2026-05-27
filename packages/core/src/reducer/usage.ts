import type { UsageEvent } from "../events";
import type { AgentSessionState } from "../state";

export function reduceUsageEvent(
  state: AgentSessionState,
  event: UsageEvent,
): AgentSessionState {
  switch (event.type) {
    case "usage/hostMetrics/updated":
      return {
        ...state,
        usage: { ...state.usage, hostMetrics: event.metrics },
      };
    default:
      throw new Error(`Unhandled usage event: ${JSON.stringify(event)}`);
  }
}
