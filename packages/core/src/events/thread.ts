import type {
  AgentError,
  AgentOperationView,
  AgentThread,
  AgentThreadScope,
  AgentTurn,
  ThreadId,
  ThreadStatus,
  ThreadTokenUsage,
} from "../state";

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
  | { type: "thread/active/set"; threadId?: ThreadId }
  | {
      type: "thread/optimistic/created";
      operation: AgentOperationView;
      thread: AgentThread;
      status?: ThreadStatus;
      turns?: AgentTurn[];
    }
  | {
      type: "thread/reconciled";
      canonicalThreadId: ThreadId;
      threadId: ThreadId;
    }
  | {
      type: "thread/optimistic/rolledBack";
      operationId?: string;
      threadId: ThreadId;
    }
  | {
      type: "thread/collection/refreshStarted";
      scope: AgentThreadScope;
    }
  | {
      type: "thread/collection/pageReceived";
      ids: ThreadId[];
      nextCursor?: string | null;
      replace?: boolean;
      scope: AgentThreadScope;
      syncedAt?: number;
    }
  | {
      type: "thread/collection/synced";
      nextCursor?: string | null;
      scope: AgentThreadScope;
      syncedAt?: number;
    }
  | {
      type: "thread/collection/failed";
      error: AgentError;
      scope: AgentThreadScope;
    }
  | {
      type: "thread/operation/updated";
      operation: AgentOperationView;
    };
