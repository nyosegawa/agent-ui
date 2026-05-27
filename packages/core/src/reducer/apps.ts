import type { AppsEvent } from "../events";
import type { AgentSessionState } from "../state";
import { appsStore } from "../stores/apps";

export function reduceAppsEvent(
  state: AgentSessionState,
  event: AppsEvent,
): AgentSessionState {
  switch (event.type) {
    case "apps/updated":
      return {
        ...state,
        apps: appsStore.reduce(state.apps, event),
      };
    default:
      throw new Error(`Unhandled apps event: ${JSON.stringify(event)}`);
  }
}
