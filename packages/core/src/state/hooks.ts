export interface AgentHook {
  id: string;
  name?: string;
  cwd?: string;
  enabled?: boolean;
  raw?: unknown;
}

export interface HooksState {
  byCwd: Record<string, AgentHook[]>;
}
