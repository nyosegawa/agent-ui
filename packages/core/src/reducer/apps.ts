import type { AppsEvent } from "../events";
import type { AgentSessionState } from "../state";

export function reduceAppsEvent(
  state: AgentSessionState,
  event: AppsEvent,
): AgentSessionState {
  switch (event.type) {
    case "apps/updated":
      return {
        ...state,
        apps: updateAppsState(state.apps, event),
      };
    default:
      throw new Error(`Unhandled apps event: ${JSON.stringify(event)}`);
  }
}

function updateAppsState(
  current: AgentSessionState["apps"],
  event: AppsEvent,
): AgentSessionState["apps"] {
  const scope = event.threadId ?? "";
  const nextScopeState = {
    apps: event.apps,
    nextCursor: event.nextCursor,
    threadId: event.threadId,
  };
  const next = {
    ...current,
    byScope: {
      ...current.byScope,
      [scope]: nextScopeState,
    },
  };
  if (!event.threadId) {
    next.apps = event.apps;
    next.nextCursor = event.nextCursor;
  }
  return next;
}
