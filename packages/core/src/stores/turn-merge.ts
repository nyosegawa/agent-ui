import type { AgentTurn, AgentTurnItemsView } from "../state";

const itemsViewRank: Record<AgentTurnItemsView, number> = {
  notLoaded: 0,
  summary: 1,
  full: 2,
};

export function mergeAgentTurn(existing: AgentTurn, incoming: AgentTurn): AgentTurn {
  const publicExisting = sanitizeTurnForMerge(existing);
  const publicIncoming = sanitizeTurnForMerge(incoming);
  const existingRank = rankItemsView(publicExisting.itemsView);
  const incomingRank = rankItemsView(publicIncoming.itemsView);
  return {
    ...publicExisting,
    ...publicIncoming,
    itemsView:
      publicIncoming.itemsView === undefined || incomingRank < existingRank
        ? publicExisting.itemsView
        : publicIncoming.itemsView,
  };
}

export function shouldApplyTurnItems(existing: AgentTurn, incoming: AgentTurn): boolean {
  return (
    incoming.itemsView === undefined ||
    rankItemsView(incoming.itemsView) >= rankItemsView(existing.itemsView)
  );
}

function rankItemsView(itemsView: AgentTurnItemsView | undefined): number {
  return itemsView === undefined ? -1 : itemsViewRank[itemsView];
}

function sanitizeTurnForMerge(turn: AgentTurn): AgentTurn {
  const { raw, ...publicTurn } = turn as AgentTurn & { raw?: unknown };
  void raw;
  return publicTurn;
}
