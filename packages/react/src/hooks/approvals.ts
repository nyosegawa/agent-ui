import {
  selectPendingApprovals,
  selectServerRequestSummaries,
  type AgentError,
  type PendingServerRequest,
  type RequestId,
  type ThreadId,
} from "@nyosegawa/agent-ui-core/internal";
import { useCallback, useMemo } from "react";
import {
  agentApprovalRequestView,
  isLegacyApprovalRequest,
  legacyApprovalDecisionResult,
} from "../approval-view";
import {
  approvalDecisionResult,
  type AgentApprovalDecision,
} from "../approval-types";
import { useInternalAgentContext } from "../provider";

export function useAgentApprovals(threadId?: ThreadId) {
  const { state, transport } = useInternalAgentContext();
  const internalApprovals = useMemo(
    () => selectPendingApprovals(state, threadId),
    [state, threadId],
  );
  const approvals = useMemo(
    () => internalApprovals.map(agentApprovalRequestView),
    [internalApprovals],
  );
  const internalApprovalById = useMemo(
    () => new Map(internalApprovals.map((approval) => [approval.id, approval])),
    [internalApprovals],
  );

  const approve = useCallback(
    async (requestId: RequestId, decision: AgentApprovalDecision = "accept") => {
      const matchedApproval = internalApprovalById.get(requestId);
      await transport.respond(
        requestId,
        approvalResponseResult(matchedApproval, decision),
      );
    },
    [internalApprovalById, transport],
  );

  const reject = useCallback(
    async (requestId: RequestId, message = "Rejected by user") => {
      const error = { code: -32000, message };
      await transport.reject(requestId, error);
    },
    [transport],
  );

  return { approvals, approve, reject };
}

export function useAgentServerRequests(threadId?: ThreadId) {
  const { state, transport } = useInternalAgentContext();
  const requests = useMemo(
    () => selectServerRequestSummaries(state, threadId),
    [state, threadId],
  );
  const respond = useCallback(
    async (requestId: RequestId, result: unknown) => {
      await transport.respond(requestId, result);
    },
    [transport],
  );
  const reject = useCallback(
    async (requestId: RequestId, error: AgentError | string) => {
      await transport.reject(requestId, normalizeServerRequestError(error));
    },
    [transport],
  );
  return { requests, respond, reject };
}

function normalizeServerRequestError(error: AgentError | string): AgentError {
  if (typeof error === "string") return { code: -32000, message: error };
  return error;
}

function approvalResponseResult(
  approval: PendingServerRequest | undefined,
  decision: AgentApprovalDecision,
) {
  if (approval && isLegacyApprovalRequest(approval)) {
    return legacyApprovalDecisionResult(decision);
  }
  return approvalDecisionResult(decision);
}
