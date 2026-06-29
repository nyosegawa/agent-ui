import type { AgentError, ItemId, RequestId, ThreadId, TurnId } from "../state";
import type { PendingServerRequestKind } from "../state/server-requests";

export interface AgentServerRequest {
  id: RequestId;
  itemId?: ItemId;
  kind: PendingServerRequestKind;
  payload: unknown;
  threadId?: ThreadId;
  turnId?: TurnId;
}

export type ServerRequestEvent =
  | { type: "serverRequest/created"; request: AgentServerRequest }
  | { type: "serverRequest/resolved"; requestId: RequestId }
  | { type: "serverRequest/rejected"; requestId: RequestId; error?: AgentError };
