import type { ItemId, RequestId, ThreadId, TurnId } from "./common";
import type { RequestIdKey } from "../request-id-key";

export type PendingServerRequestKind =
  | "attestation"
  | "authRefresh"
  | "commandApproval"
  | "dynamicTool"
  | "fileChangeApproval"
  | "mcpElicitation"
  | "permissionsApproval"
  | "userInput"
  | "unknown";

export interface PendingServerRequest {
  id: RequestId;
  kind: PendingServerRequestKind;
  threadId?: ThreadId;
  turnId?: TurnId;
  itemId?: ItemId;
  payload: unknown;
}

export interface ServerRequestQueueState {
  byId: Record<RequestIdKey, PendingServerRequest>;
  order: RequestIdKey[];
}
