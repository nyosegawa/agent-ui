import type { UsageEvent } from "../events";
import type { AgentSessionState } from "../state";
import { usageStore } from "../stores/usage";

export function reduceUsageEvent(
  state: AgentSessionState,
  event: UsageEvent,
): AgentSessionState {
  switch (event.type) {
    case "usage/hostMetrics/updated":
      return {
        ...state,
        usage: usageStore.reduce(state.usage, event),
      };
    default:
      throw new Error(`Unhandled usage event: ${JSON.stringify(event)}`);
  }
}
