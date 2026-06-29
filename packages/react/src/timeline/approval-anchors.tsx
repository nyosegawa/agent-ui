import type {
  PendingServerRequest,
} from "@nyosegawa/agent-ui-core/internal";
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
