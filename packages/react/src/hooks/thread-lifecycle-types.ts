import type { ThreadId } from "@nyosegawa/agent-ui-core";

export interface AgentThreadStartResult {
  threadId: ThreadId;
}

export interface AgentThreadStartWithInputResult {
  threadId: ThreadId;
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
