export interface AgentSkill {
  name: string;
  path?: string;
  cwd?: string;
  enabled?: boolean;
}

export interface SkillsState {
  byCwd: Record<string, AgentSkill[]>;
}
