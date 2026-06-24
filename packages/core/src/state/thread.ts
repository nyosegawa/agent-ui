import type { AgentError, ItemId, RequestId, ThreadId, TurnId } from "./common";
import type { AgentItemBlock } from "./item";
import type { PendingServerRequestKind } from "./server-requests";
import type { TurnState } from "./turn";

export interface AgentThread {
  id: ThreadId;
  name?: string;
  path?: string | null;
  ephemeral?: boolean;
  metadata?: AgentThreadMetadata;
}

export interface AgentThreadMetadata {
  optimistic?: boolean;
  operationId?: string;
}

export type ThreadStatus =
  | "notLoaded"
  | "loaded"
  | "ready"
  | "running"
  | "waitingForInput"
  | "complete"
  | "completed"
  | "interrupted"
  | "error"
  | "failed"
  | "archived"
  | "closed"
  | "systemError";

export type AgentThreadActiveFlag = "waitingOnApproval" | "waitingOnUserInput";

export type AgentThreadRuntimeStatus =
  | { type: "notLoaded" }
  | { type: "idle" }
  | { type: "systemError" }
  | { activeFlags: AgentThreadActiveFlag[]; type: "active" };

export type AgentTurnResult = "completed" | "error" | "failed" | "interrupted" | "unknown";

export interface AgentThreadLastTurnResult {
  result: AgentTurnResult;
  status?: string;
  turnId: TurnId;
}

export interface AgentThreadRuntimeState {
  activeTurnId?: TurnId;
  lastTurn?: AgentThreadLastTurnResult;
  status: AgentThreadRuntimeStatus;
}

export interface ThreadTokenUsage {
  cachedInputTokens?: number;
  inputTokens?: number;
  last?: TokenUsageBreakdown;
  modelContextWindow?: number;
  outputTokens?: number;
  reasoningOutputTokens?: number;
  totalTokens?: number;
  turnId?: TurnId;
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
  displayStatus:
    | "archived"
    | "complete"
    | "failed"
    | "preview"
    | "ready"
    | "running"
    | "waitingForInput";
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

export type AgentThreadWaitingReason =
  | "approval"
  | "attestation"
  | "authRefresh"
  | "mcpElicitation"
  | "permission"
  | "unknown"
  | "userInput";

export interface AgentThreadRuntimeView {
  activeFlags: AgentThreadActiveFlag[];
  activeTurnId?: TurnId;
  isRunning: boolean;
  lastTurn?: AgentThreadLastTurnResult;
  needsInput: boolean;
  status: AgentThreadRuntimeStatus["type"];
  waitingReasons: AgentThreadWaitingReason[];
}

export interface AgentServerRequestSummary {
  id: RequestId;
  itemId?: ItemId;
  kind: PendingServerRequestKind;
  threadId?: ThreadId;
  turnId?: TurnId;
  visible: boolean;
  waitingReason: AgentThreadWaitingReason;
}

export interface AgentThreadExecutionState {
  runtime: AgentThreadRuntimeView;
  serverRequests: AgentServerRequestSummary[];
}

export interface AgentThreadSummaryView extends AgentThreadView {
  execution: AgentThreadExecutionState;
}

export type AgentTranscriptBlockView = Pick<
  AgentItemBlock,
  | "arguments"
  | "changes"
  | "command"
  | "content"
  | "cwd"
  | "durationMs"
  | "error"
  | "exitCode"
  | "id"
  | "kind"
  | "metadata"
  | "output"
  | "path"
  | "query"
  | "resource"
  | "result"
  | "server"
  | "status"
  | "subtype"
  | "summary"
  | "text"
  | "tool"
  | "toolType"
>;

export interface AgentTranscriptTurnView {
  blocks: AgentTranscriptBlockView[];
  id: TurnId;
  itemIds: ItemId[];
  status?: string;
}

export interface AgentThreadTranscriptView {
  threadId: ThreadId;
  turns: AgentTranscriptTurnView[];
}

export interface AgentApprovalView {
  itemId?: ItemId;
  kind: "commandApproval" | "fileChangeApproval";
  requestId: RequestId;
  threadId?: ThreadId;
  turnId?: TurnId;
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
  runtime: AgentThreadRuntimeState;
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
