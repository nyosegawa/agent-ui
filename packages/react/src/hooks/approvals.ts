import {
  selectPendingApprovals,
  selectServerRequestQueue,
  type AgentError,
  type PendingServerRequest,
  type RequestId,
  type ThreadId,
} from "@nyosegawa/agent-ui-core";
import { useCallback, useMemo } from "react";
import { useAgentContext } from "../provider";

export function useAgentApprovals(threadId?: ThreadId) {
  const { state, transport } = useAgentContext();
  const approvals = useMemo(
    () => selectPendingApprovals(state, threadId),
    [state, threadId],
  );

  const approve = useCallback(
    async (
      requestId: RequestId,
      result: unknown = { decision: "accept" },
      approval?: PendingServerRequest,
    ) => {
      const matchedApproval =
        approval ?? approvals.find((candidate) => candidate.id === requestId);
      await transport.respond(
        requestId,
        matchedApproval
          ? approvalResponseResult(matchedApproval.payload, result)
          : result,
      );
    },
    [approvals, transport],
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
  const { state, transport } = useAgentContext();
  const requests = useMemo(
    () => selectServerRequestQueue(state, threadId),
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

function approvalResponseResult(payload: unknown, result: unknown): unknown {
  if (!isLegacyApprovalPayload(payload) || !isRecord(result)) return result;
  switch (result.decision) {
    case "accept":
      return { ...result, decision: "approved" };
    case "acceptForSession":
      return { ...result, decision: "approved_for_session" };
    case "decline":
      return { ...result, decision: "denied" };
    default:
      return result;
  }
}

function isLegacyApprovalPayload(payload: unknown): boolean {
  if (!isRecord(payload)) return false;
  return payload.upstreamMethod === "execCommandApproval" || payload.upstreamMethod === "applyPatchApproval";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
