import type { ItemId, RequestId, ThreadId, TurnId } from "@nyosegawa/agent-ui-core";

export type AgentApprovalRequestKind =
  | "attestation"
  | "authRefresh"
  | "commandApproval"
  | "dynamicTool"
  | "fileChangeApproval"
  | "mcpElicitation"
  | "permissionsApproval"
  | "userInput"
  | "unknown";

export type AgentApprovalRisk = "high" | "medium" | "low";

export interface AgentApprovalDetail {
  label: string;
  value: string;
}

export interface AgentApprovalPatchChange {
  diff: string;
  kind: string;
  path: string;
}

export type AgentApprovalPatch =
  | string
  | {
      changes: AgentApprovalPatchChange[];
    };

export interface AgentApprovalRequest {
  id: RequestId;
  kind: AgentApprovalRequestKind;
  canDecide: boolean;
  risk: AgentApprovalRisk;
  threadId?: ThreadId;
  turnId?: TurnId;
  itemId?: ItemId;
  reason?: string;
  command?: string;
  cwd?: string;
  sandbox?: string;
  approvalPolicy?: string;
  path?: string;
  summary?: string;
  patch?: AgentApprovalPatch;
  prompt?: string;
  namespace?: string;
  tool?: string;
  argumentsText?: string;
  details: AgentApprovalDetail[];
}

export type AgentApprovalDecision = "accept" | "acceptForSession" | "decline";

export function approvalDecisionResult(decision: AgentApprovalDecision) {
  return { decision };
}
