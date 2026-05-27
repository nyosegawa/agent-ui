import type { AgentSkill } from "../state";

export type SkillsEvent = { type: "skills/updated"; cwd: string; skills: AgentSkill[] };
