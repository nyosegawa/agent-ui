import type { AgentError, AgentItemState, ItemId, ThreadId, TurnId } from "../state";

export type ItemEvent =
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
  | {
      type: "item/failed";
      threadId: ThreadId;
      turnId: TurnId;
      itemId: ItemId;
      error?: AgentError;
    }
  | { type: "item/completed"; threadId: ThreadId; turnId: TurnId; item: AgentItemState };
