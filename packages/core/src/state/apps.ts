import type { ThreadId } from "./common";

export interface AgentApp {
  id: string;
  name?: string;
  uri?: string;
  installed?: boolean;
  needsAuth?: boolean;
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
