import type { SkillsEvent } from "../events";
import { AGENT_RETENTION_POLICY, boundedRecordEntry } from "../retention";
import type { AgentSessionState } from "../state";

export function reduceSkillsEvent(
  state: AgentSessionState,
  event: SkillsEvent,
): AgentSessionState {
  switch (event.type) {
    case "skills/updated":
      return {
        ...state,
        skills: {
          ...state.skills,
          byCwd: boundedRecordEntry(
            state.skills.byCwd,
            event.cwd,
            event.skills,
            AGENT_RETENTION_POLICY.skillsCwdEntriesMax,
          ),
        },
      };
    default:
      throw new Error(`Unhandled skills event: ${JSON.stringify(event)}`);
  }
}
