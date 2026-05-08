export type RequestId = string | number;
export type ThreadId = string;
export type TurnId = string;
export type ItemId = string;

export type ConnectionState =
  | { status: "idle" }
  | { status: "connecting" }
  | { status: "connected" }
  | { status: "closed"; reason?: string }
  | { status: "error"; error: AgentError };

export interface AgentError {
  code?: number;
  message: string;
  data?: unknown;
}

export interface AccountState {
  status: "unknown" | "unauthenticated" | "authenticating" | "authenticated";
  account?: Record<string, unknown>;
  login?: DeviceCodeLoginState;
}

export interface DeviceCodeLoginState {
  requestId?: RequestId;
  userCode?: string;
  verificationUrl?: string;
  expiresAt?: string;
}

export interface ModelState {
  models: AgentModel[];
  selectedModelId?: string;
}

export interface AgentModel {
  id: string;
  name?: string;
  raw?: unknown;
}

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
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  raw?: unknown;
}

export interface ThreadState {
  thread: AgentThread;
  turns: Record<TurnId, TurnState>;
  orderedTurnIds: TurnId[];
  tokenUsage?: ThreadTokenUsage;
  status: ThreadStatus;
}

export interface AgentTurn {
  id: TurnId;
  threadId: ThreadId;
  status?: string;
  raw?: unknown;
}

export interface TurnState {
  turn: AgentTurn;
  itemOrder: ItemId[];
  items: Record<ItemId, AgentItemState>;
  streamingTextByItemId: Record<ItemId, string>;
  commandOutputByItemId: Record<ItemId, string>;
  filePatchByItemId: Record<ItemId, unknown>;
}

export interface AgentItemState {
  id: ItemId;
  turnId: TurnId;
  threadId: ThreadId;
  kind: string;
  status: "inProgress" | "completed" | "failed";
  text?: string;
  raw?: unknown;
}

export type PendingServerRequestKind =
  | "commandApproval"
  | "fileChangeApproval"
  | "userInput"
  | "unknown";

export interface PendingServerRequest {
  id: RequestId;
  kind: PendingServerRequestKind;
  threadId?: ThreadId;
  turnId?: TurnId;
  itemId?: ItemId;
  payload: unknown;
}

export interface WarningState {
  id: string;
  message: string;
  raw?: unknown;
}

export interface AgentSessionState {
  connection: ConnectionState;
  account: AccountState;
  threads: Record<ThreadId, ThreadState>;
  activeThreadId?: ThreadId;
  pendingServerRequests: Record<string, PendingServerRequest>;
  models: ModelState;
  configWarnings: WarningState[];
  errors: AgentError[];
}

export function createInitialAgentState(): AgentSessionState {
  return {
    account: { status: "unknown" },
    configWarnings: [],
    connection: { status: "idle" },
    errors: [],
    models: { models: [] },
    pendingServerRequests: {},
    threads: {},
  };
}
