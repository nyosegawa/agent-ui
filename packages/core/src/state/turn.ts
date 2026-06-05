import type { ItemId, ThreadId, TurnId } from "./common";
import type { AgentItemBlock, AgentItemState } from "./item";

export interface AgentTurn {
  id: TurnId;
  threadId: ThreadId;
  itemsView?: AgentTurnItemsView;
  status?: string;
  metadata?: AgentTurnMetadata;
}

export interface AgentTurnMetadata {
  optimistic?: boolean;
  operationId?: string;
}

export type AgentTurnItemsView = "notLoaded" | "summary" | "full";

export interface TurnState {
  turn: AgentTurn;
  itemOrder: ItemId[];
  items: Record<ItemId, AgentItemState>;
  blocksByItemId: Record<ItemId, AgentItemBlock>;
  streamingTextByItemId: Record<ItemId, string>;
  commandOutputByItemId: Record<ItemId, string>;
  filePatchByItemId: Record<ItemId, unknown>;
  plan?: TurnPlanState;
  diff?: TurnDiffState;
}

export interface TurnPlanState {
  explanation?: string | null;
  plan: unknown;
}

export interface TurnDiffState {
  diff: unknown;
}
