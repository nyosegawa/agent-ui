import type { ThreadId, TurnId } from "./common";
import type { TurnState } from "./turn";

export interface AgentThread {
  id: ThreadId;
  name?: string;
  path?: string | null;
  ephemeral?: boolean;
  raw?: unknown;
}

export type ThreadStatus =
  | "notLoaded"
  | "loaded"
  | "running"
  | "waitingForInput"
  | "complete"
  | "error"
  | string;

export interface ThreadTokenUsage {
  cachedInputTokens?: number;
  inputTokens?: number;
  last?: TokenUsageBreakdown;
  modelContextWindow?: number;
  outputTokens?: number;
  reasoningOutputTokens?: number;
  totalTokens?: number;
  turnId?: TurnId;
  raw?: unknown;
}

export interface TokenUsageBreakdown {
  cachedInputTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  reasoningOutputTokens?: number;
  totalTokens?: number;
}

export interface ThreadState {
  thread: AgentThread;
  turns: Record<TurnId, TurnState>;
  orderedTurnIds: TurnId[];
  tokenUsage?: ThreadTokenUsage;
  status: ThreadStatus;
  registryStatus: ThreadRegistryStatus;
}

export type ThreadRegistryStatus = "cold" | "preview" | "live" | "loaded";

export interface ThreadRegistryState {
  activeThreadId?: ThreadId;
  coldThreadIds: ThreadId[];
  previewThreadIds: ThreadId[];
  liveThreadIds: ThreadId[];
  loadedThreadIds: ThreadId[];
}
