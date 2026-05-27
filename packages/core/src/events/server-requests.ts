import type { AgentError, PendingServerRequest, RequestId } from "../state";

export type ServerRequestEvent =
  | { type: "serverRequest/created"; request: PendingServerRequest }
  | { type: "serverRequest/resolved"; requestId: RequestId }
  | { type: "serverRequest/rejected"; requestId: RequestId; error?: AgentError };
