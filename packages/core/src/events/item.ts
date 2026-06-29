import type { AgentError, ItemId, ThreadId, TurnId } from "../state";

export interface AgentEventItem {
  id: ItemId;
  kind: string;
  metadata?: AgentEventItemMetadata;
  status: "inProgress" | "completed" | "failed";
  text?: string;
  threadId: ThreadId;
  turnId: TurnId;
}

export interface AgentEventItemMetadata {
  clientUserMessageId?: string;
  operationId?: string;
  optimistic?: boolean;
  retrying?: boolean;
}

export type ItemEvent =
  | { type: "item/started"; threadId: ThreadId; turnId: TurnId; item: AgentEventItem }
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
  | {
      type: "item/failed";
      threadId: ThreadId;
      turnId: TurnId;
      itemId: ItemId;
      error?: AgentError;
    }
  | { type: "item/completed"; threadId: ThreadId; turnId: TurnId; item: AgentEventItem };
