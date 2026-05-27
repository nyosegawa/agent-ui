import type { AgentThread, AgentTurn, ThreadId, ThreadStatus, ThreadTokenUsage } from "../state";

export type ThreadEvent =
  | {
      type: "thread/upserted";
      thread: AgentThread;
      status?: ThreadStatus;
      turns?: AgentTurn[];
      snapshot?: boolean;
    }
  | {
      type: "thread/started";
      thread: AgentThread;
      status?: ThreadStatus;
      turns?: AgentTurn[];
      snapshot?: boolean;
    }
  | {
      type: "thread/status/changed";
      threadId: ThreadId;
      status: ThreadStatus;
      snapshot?: boolean;
    }
  | { type: "thread/name/updated"; threadId: ThreadId; name: string }
  | { type: "thread/tokenUsage/updated"; threadId: ThreadId; tokenUsage: ThreadTokenUsage }
  | { type: "thread/active/set"; threadId?: ThreadId };
