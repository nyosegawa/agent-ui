import type { ThreadId } from "./common";

export interface AgentApp {
  accessible?: boolean;
  enabled?: boolean;
  id: string;
  installUrl?: string;
  name?: string;
  uri?: string;
  raw?: unknown;
}

export interface AppsState {
  apps: AgentApp[];
  byScope: Record<string, ScopedAppsState>;
  nextCursor?: string | null;
}

export interface ScopedAppsState {
  apps: AgentApp[];
  nextCursor?: string | null;
  threadId?: ThreadId;
}
