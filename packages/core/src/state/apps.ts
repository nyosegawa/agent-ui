import type { ThreadId } from "./common";

export interface AgentApp {
  accessible?: boolean;
  branding?: unknown;
  description?: string;
  enabled?: boolean;
  id: string;
  installUrl?: string;
  labels?: unknown;
  logoUrl?: string;
  logoUrlDark?: string;
  logos?: unknown;
  distributionChannel?: string;
  appMetadata?: unknown;
  metadata?: unknown;
  name?: string;
  pluginDisplayNames?: unknown;
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
