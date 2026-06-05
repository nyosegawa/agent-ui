export interface AgentHook {
  id: string;
  name?: string;
  cwd?: string;
  enabled?: boolean;
}

export interface HooksState {
  byCwd: Record<string, AgentHook[]>;
}
