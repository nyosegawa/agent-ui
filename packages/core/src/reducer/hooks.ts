import type { HooksEvent } from "../events";
import type { AgentSessionState } from "../state";

export function reduceHooksEvent(
  state: AgentSessionState,
  event: HooksEvent,
): AgentSessionState {
  switch (event.type) {
    case "hooks/updated":
      return {
        ...state,
        hooks: {
          ...state.hooks,
          byCwd: { ...state.hooks.byCwd, [event.cwd]: event.hooks },
        },
      };
    default:
      throw new Error(`Unhandled hooks event: ${JSON.stringify(event)}`);
  }
}
