import type {
  PendingServerRequest,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import type React from "react";

export interface ApprovalAnchors {
  afterTurn: PendingServerRequest[];
  byItemId: Record<string, PendingServerRequest[]>;
  renderApprovalAnchor: (approval: PendingServerRequest) => React.ReactNode;
}

export interface TranscriptApprovalAnchors {
  requests: PendingServerRequest[];
  renderApprovalAnchor: (approval: PendingServerRequest) => React.ReactNode;
}

export function approvalAnchorsForTurn(
  turn: TurnState,
  anchors?: TranscriptApprovalAnchors,
): ApprovalAnchors | undefined {
  if (!anchors) return undefined;
  const byItemId: Record<string, PendingServerRequest[]> = {};
  const afterTurn: PendingServerRequest[] = [];
  for (const request of anchors.requests) {
    if (request.turnId && request.turnId !== turn.turn.id) continue;
    if (request.itemId && turn.itemOrder.includes(request.itemId)) {
      byItemId[request.itemId] = [...(byItemId[request.itemId] ?? []), request];
    } else if (request.turnId === turn.turn.id) {
      afterTurn.push(request);
    }
  }
  return { afterTurn, byItemId, renderApprovalAnchor: anchors.renderApprovalAnchor };
}

export function anchoredApprovalNodes(
  requests: PendingServerRequest[] | undefined,
  anchors?: ApprovalAnchors,
): React.ReactNode[] {
  return (requests ?? []).map((approval) => (
    <div className="aui-transcript-approval-anchor" key={`approval-${String(approval.id)}`}>
      {anchors?.renderApprovalAnchor(approval)}
    </div>
  ));
}
