import type {
  AgentError,
  AgentItemState,
  AgentModel,
  AgentThread,
  AgentTurn,
  ExecutionModeId,
  ItemId,
  PendingServerRequest,
  RequestId,
  ReasoningEffort,
  ThreadId,
  ThreadStatus,
  ThreadTokenUsage,
  TurnId,
  WarningState,
} from "./state";

export type AgentEvent =
  | { type: "connection/connecting" }
  | { type: "connection/connected" }
  | { type: "connection/closed"; reason?: string }
  | { type: "connection/error"; error: AgentError }
  | { type: "account/updated"; status?: "unauthenticated" | "authenticated"; account?: unknown }
  | { type: "account/rateLimits/updated"; rateLimits: unknown }
  | {
      type: "account/login/deviceCodeStarted";
      requestId?: RequestId;
      userCode?: string;
      verificationUrl?: string;
      expiresAt?: string;
    }
  | { type: "account/login/completed"; account?: unknown }
  | { type: "models/updated"; models: AgentModel[]; selectedModelId?: string }
  | {
      type: "runSettings/updated";
      executionMode?: ExecutionModeId;
      modelId?: string;
      effort?: ReasoningEffort;
      cwd?: string;
    }
  | { type: "thread/upserted"; thread: AgentThread; status?: ThreadStatus; turns?: AgentTurn[] }
  | { type: "thread/started"; thread: AgentThread; status?: ThreadStatus; turns?: AgentTurn[] }
  | { type: "thread/status/changed"; threadId: ThreadId; status: ThreadStatus }
  | { type: "thread/name/updated"; threadId: ThreadId; name: string }
  | { type: "thread/tokenUsage/updated"; threadId: ThreadId; tokenUsage: ThreadTokenUsage }
  | { type: "thread/active/set"; threadId?: ThreadId }
  | { type: "turn/started"; threadId: ThreadId; turn: AgentTurn }
  | { type: "turn/completed"; threadId: ThreadId; turn: AgentTurn; items?: AgentItemState[] }
  | { type: "turn/plan/updated"; threadId: ThreadId; turnId: TurnId; explanation?: string | null; plan: unknown; raw?: unknown }
  | { type: "item/started"; threadId: ThreadId; turnId: TurnId; item: AgentItemState }
  | {
      type: "item/agentMessage/delta";
      threadId: ThreadId;
      turnId: TurnId;
      itemId: ItemId;
      delta: string;
    }
  | {
      type: "item/reasoning/summaryTextDelta";
      threadId: ThreadId;
      turnId: TurnId;
      itemId: ItemId;
      delta: string;
    }
  | {
      type: "item/commandOutput/delta";
      threadId: ThreadId;
      turnId: TurnId;
      itemId: ItemId;
      delta: string;
    }
  | {
      type: "item/filePatch/updated";
      threadId: ThreadId;
      turnId: TurnId;
      itemId: ItemId;
      patch: unknown;
    }
  | { type: "item/completed"; threadId: ThreadId; turnId: TurnId; item: AgentItemState }
  | { type: "serverRequest/created"; request: PendingServerRequest }
  | { type: "serverRequest/resolved"; requestId: RequestId }
  | { type: "serverRequest/rejected"; requestId: RequestId; error?: AgentError }
  | { type: "warning/added"; warning: WarningState }
  | { type: "error/added"; error: AgentError };

export interface AgentTransportEvent {
  type: "event" | "request" | "response" | "error" | "stderr" | "raw";
  event?: AgentEvent;
  request?: PendingServerRequest;
  requestId?: RequestId;
  payload?: unknown;
  error?: AgentError;
  message?: string;
}
