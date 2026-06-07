import type { ThreadId } from "@nyosegawa/agent-ui-core";
import type { ThreadStartOptions, TurnStartOptions } from "../request-options";

export interface AgentThreadStartResult {
  threadId: ThreadId;
}

export interface AgentThreadStartWithInputResult {
  operationId: string;
  threadId: ThreadId;
  turnId: string;
  userMessageId: string;
}

export interface AgentThreadStartWithInputOptions {
  threadOptions?: ThreadStartOptions;
  turnOptions?: TurnStartOptions;
}

export interface AgentThreadResumeResult {
  requestedThreadId?: ThreadId;
  threadId: ThreadId;
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
