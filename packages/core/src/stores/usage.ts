import type { UsageEvent } from "../events";
import type { UsageState } from "../state";

export interface UsageStore {
  createInitialState(): UsageState;
  reduce(state: UsageState, event: UsageEvent): UsageState;
  setAccountRateLimits(state: UsageState, accountRateLimits: unknown): UsageState;
  setHostMetrics(state: UsageState, hostMetrics: unknown): UsageState;
}

export const usageStore: UsageStore = {
  createInitialState: createInitialUsageState,
  reduce: reduceUsageState,
  setAccountRateLimits: updateAccountRateLimits,
  setHostMetrics: updateHostMetrics,
};

export function createInitialUsageState(): UsageState {
  return {};
}

export function reduceUsageState(state: UsageState, event: UsageEvent): UsageState {
  switch (event.type) {
    case "usage/hostMetrics/updated":
      return updateHostMetrics(state, event.metrics);
    default:
      return state;
  }
}

export function updateHostMetrics(
  state: UsageState,
  hostMetrics: unknown,
): UsageState {
  return { ...state, hostMetrics };
}

export function updateAccountRateLimits(
  state: UsageState,
  accountRateLimits: unknown,
): UsageState {
  return { ...state, accountRateLimits };
}
