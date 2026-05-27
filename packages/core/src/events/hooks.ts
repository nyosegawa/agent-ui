import type { AgentHook } from "../state";

export type HooksEvent = { type: "hooks/updated"; cwd: string; hooks: AgentHook[] };
