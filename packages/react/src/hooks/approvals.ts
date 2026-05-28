import {
  selectPendingApprovals,
  selectServerRequestQueue,
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
    async (requestId: RequestId, result: unknown = { decision: "accept" }) => {
      await transport.respond(requestId, result);
    },
    [transport],
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
  const approvals = useAgentApprovals(threadId);
  const { state } = useAgentContext();
  const queue = selectServerRequestQueue(state, threadId);
  return { ...approvals, requests: queue };
}
