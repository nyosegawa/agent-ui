export interface AgentSkill {
  name: string;
  path?: string;
  cwd?: string;
  enabled?: boolean;
  raw?: unknown;
}

export interface SkillsState {
  byCwd: Record<string, AgentSkill[]>;
}
