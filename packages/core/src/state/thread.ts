import type { AgentError, ThreadId, TurnId } from "./common";
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

export type AgentOperationStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface AgentPendingThreadState {
  operationId: string;
  status: AgentOperationStatus;
  error?: AgentError;
}

export interface AgentOperationView {
  id: string;
  kind: string;
  status: AgentOperationStatus;
  error?: AgentError;
  threadId?: ThreadId;
}

export interface AgentThreadView {
  id: ThreadId;
  title: string;
  subtitle?: string;
  cwd?: string;
  isActive: boolean;
  isArchived: boolean;
  isPreview: boolean;
  isRunning: boolean;
  needsInput: boolean;
  lastActivityAt?: number;
  pending?: AgentPendingThreadState;
  error?: AgentError;
}

export interface ThreadState {
  id: ThreadId;
  canonicalId?: ThreadId;
  activity: "idle" | "running" | "waitingForInput" | "failed";
  availability: "available" | "preview" | "archived" | "closed";
  storage: "unknown" | "stored" | "ephemeral";
  metadata: {
    cwd?: string;
    lastActivityAt?: number;
    title?: string;
  };
  operations: Record<string, AgentOperationView>;
  thread: AgentThread;
  turns: Record<TurnId, TurnState>;
  orderedTurnIds: TurnId[];
  tokenUsage?: ThreadTokenUsage;
  status: ThreadStatus;
}

export type AgentThreadScope =
  | { kind: "all"; key?: string }
  | {
      kind: "history";
      key?: string;
      archived?: boolean;
      cwd?: string;
      searchTerm?: string;
    }
  | { kind: "custom"; key: string; label?: string };

export type AgentThreadCollectionStatus = "idle" | "loading" | "ready" | "error";

export interface AgentThreadCollection {
  key: string;
  scope: AgentThreadScope;
  ids: ThreadId[];
  nextCursor: string | null;
  status: AgentThreadCollectionStatus;
  error?: AgentError;
  syncedAt?: number;
}

export interface ThreadLifecycleState {
  activeThreadId?: ThreadId;
  aliasById: Record<ThreadId, ThreadId>;
  collections: Record<string, AgentThreadCollection>;
  defaultCollectionKey: string;
  operations: Record<string, AgentOperationView>;
}
