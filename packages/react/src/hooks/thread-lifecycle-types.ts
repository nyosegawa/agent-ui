import type { ThreadId, ThreadStatus } from "@nyosegawa/agent-ui-core";
import type { ThreadStartOptions, TurnStartOptions } from "../request-options";

export interface AgentThreadStartResult {
  threadId: ThreadId;
}

export interface AgentThreadStartWithInputResult {
  operationId: string;
  optimisticTurnId: string;
  threadId: ThreadId;
  turnId: string;
  userMessageId: string;
}

export interface AgentThreadStartWithInputOptions {
  threadOptions?: ThreadStartOptions;
  turnOptions?: TurnStartOptions;
}

export interface AgentThreadResumeResult {
  activeTurnId?: string;
  activity?: AgentThreadActivity;
  requestedThreadId?: ThreadId;
  runSettings?: AgentThreadResumeRunSettings;
  status?: ThreadStatus;
  threadId: ThreadId;
}

export type AgentThreadActivity = "failed" | "idle" | "running" | "waitingForInput";

export type AgentThreadResumeDiagnosticReasonCode =
  | "canonical_thread_id_mismatch"
  | "resume_response_missing_thread_id"
  | "resume_response_normalization_failed";

export interface AgentThreadResumeRunSettings {
  cwd?: string;
  effort?: string;
  modelId?: string;
}

export interface AgentThreadReadResult {
  threadId: ThreadId;
}

export interface AgentThreadForkResult {
  threadId: ThreadId;
}

export interface AgentThreadHistoryResult {
  nextCursor: string | null;
  threadIds: ThreadId[];
}
