import type { AgentTurn, AgentTurnItemsView } from "../state";

const itemsViewRank: Record<AgentTurnItemsView, number> = {
  notLoaded: 0,
  summary: 1,
  full: 2,
};

export function mergeAgentTurn(existing: AgentTurn, incoming: AgentTurn): AgentTurn {
  const existingRank = rankItemsView(existing.itemsView);
  const incomingRank = rankItemsView(incoming.itemsView);
  return {
    ...existing,
    ...incoming,
    itemsView:
      incoming.itemsView === undefined || incomingRank < existingRank
        ? existing.itemsView
        : incoming.itemsView,
  };
}

function rankItemsView(itemsView: AgentTurnItemsView | undefined): number {
  return itemsView === undefined ? -1 : itemsViewRank[itemsView];
}
