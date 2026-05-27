import type { ItemId, RequestId, ThreadId, TurnId } from "./common";

export type PendingServerRequestKind =
  | "attestation"
  | "authRefresh"
  | "commandApproval"
  | "dynamicTool"
  | "fileChangeApproval"
  | "legacyExecApproval"
  | "legacyPatchApproval"
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
  byId: Record<string, PendingServerRequest>;
  order: string[];
}
