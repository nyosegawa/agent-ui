import type React from "react";
import type { AgentApprovalRequest } from "../approval-types";

export interface ApprovalAnchors {
  afterTurn: AgentApprovalRequest[];
  byItemId: Record<string, AgentApprovalRequest[]>;
  renderApprovalAnchor: (approval: AgentApprovalRequest) => React.ReactNode;
}

export interface TranscriptApprovalAnchors {
  requests: AgentApprovalRequest[];
  renderApprovalAnchor: (approval: AgentApprovalRequest) => React.ReactNode;
}

export function anchoredApprovalNodes(
  requests: AgentApprovalRequest[] | undefined,
  anchors?: ApprovalAnchors,
): React.ReactNode[] {
  return (requests ?? []).map((approval) => (
    <div className="aui-transcript-approval-anchor" key={`approval-${String(approval.id)}`}>
      {anchors?.renderApprovalAnchor(approval)}
    </div>
  ));
}
