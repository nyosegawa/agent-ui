import type { HooksEvent } from "../events";
import { AGENT_RETENTION_POLICY, boundedRecordEntry } from "../retention";
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
          byCwd: boundedRecordEntry(
            state.hooks.byCwd,
            event.cwd,
            event.hooks,
            AGENT_RETENTION_POLICY.hooksCwdEntriesMax,
          ),
        },
      };
    default:
      throw new Error(`Unhandled hooks event: ${JSON.stringify(event)}`);
  }
}
