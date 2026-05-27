import type { ModelsEvent } from "../events";
import type { AgentSessionState } from "../state";

export function reduceModelsEvent(
  state: AgentSessionState,
  event: ModelsEvent,
): AgentSessionState {
  switch (event.type) {
    case "models/updated":
      return {
        ...state,
        models: {
          models: event.models,
          selectedModelId: event.selectedModelId ?? state.models.selectedModelId,
        },
        runSettings: {
          ...state.runSettings,
          ...(event.selectedModelId ? { modelId: event.selectedModelId } : {}),
        },
      };
    default:
      throw new Error(`Unhandled models event: ${JSON.stringify(event)}`);
  }
}
