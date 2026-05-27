import type { AppsEvent } from "../events";
import type { AppsState } from "../state";

export interface AppsStore {
  createInitialState(): AppsState;
  reduce(state: AppsState, event: AppsEvent): AppsState;
}

export const appsStore: AppsStore = {
  createInitialState: createInitialAppsState,
  reduce: reduceAppsState,
};

export function createInitialAppsState(): AppsState {
  return { apps: [], byScope: {} };
}

export function reduceAppsState(current: AppsState, event: AppsEvent): AppsState {
  switch (event.type) {
    case "apps/updated":
      return updateAppsState(current, event);
    default:
      return current;
  }
}

export function updateAppsState(
  current: AppsState,
  event: AppsEvent,
): AppsState {
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
