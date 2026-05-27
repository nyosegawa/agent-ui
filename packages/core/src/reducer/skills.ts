import type { SkillsEvent } from "../events";
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
          byCwd: { ...state.skills.byCwd, [event.cwd]: event.skills },
        },
      };
    default:
      throw new Error(`Unhandled skills event: ${JSON.stringify(event)}`);
  }
}
