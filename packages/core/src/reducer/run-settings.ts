import type { RunSettingsEvent } from "../events";
import type { AgentSessionState } from "../state";

export function reduceRunSettingsEvent(
  state: AgentSessionState,
  event: RunSettingsEvent,
): AgentSessionState {
  switch (event.type) {
    case "runSettings/updated":
      return {
        ...state,
        models: {
          ...state.models,
          selectedModelId: event.modelId ?? state.models.selectedModelId,
        },
        runSettings: {
          ...state.runSettings,
          ...(event.executionMode ? { executionMode: event.executionMode } : {}),
          ...(event.modelId !== undefined ? { modelId: event.modelId || undefined } : {}),
          ...(event.effort !== undefined ? { effort: event.effort || undefined } : {}),
          ...(event.cwd !== undefined ? { cwd: event.cwd || undefined } : {}),
        },
      };
    default:
      throw new Error(`Unhandled run settings event: ${JSON.stringify(event)}`);
  }
}
