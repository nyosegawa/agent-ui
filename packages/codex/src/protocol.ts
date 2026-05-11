export const CODEX_PROTOCOL_COMMIT = "607b0dd1f06ce8b09db43f2ec3e0582daf21158e";
export const CODEX_PROTOCOL_GENERATED_AT = "2026-05-09T00:00:00.000+09:00";

export const stableClientMethods = [
  "initialize",
  "account/read",
  "account/login/start",
  "account/login/cancel",
  "account/logout",
  "model/list",
  "thread/start",
  "thread/resume",
  "thread/list",
  "thread/read",
  "thread/unsubscribe",
  "turn/start",
  "turn/steer",
  "turn/interrupt",
] as const;

export const stableServerRequestMethods = [
  "item/commandExecution/requestApproval",
  "item/fileChange/requestApproval",
  "item/tool/requestUserInput",
  "mcpServer/elicitation/request",
  "item/permissions/requestApproval",
  "item/tool/call",
  "account/chatgptAuthTokens/refresh",
  "applyPatchApproval",
  "execCommandApproval",
] as const;

export const stableNotificationMethods = [
  "account/login/completed",
  "account/updated",
  "configWarning",
  "error",
  "item/agentMessage/delta",
  "item/commandExecution/outputDelta",
  "item/completed",
  "item/fileChange/outputDelta",
  "item/fileChange/patchUpdated",
  "item/reasoning/summaryTextDelta",
  "item/started",
  "serverRequest/resolved",
  "thread/name/updated",
  "thread/started",
  "thread/status/changed",
  "thread/tokenUsage/updated",
  "turn/completed",
  "turn/diff/updated",
  "turn/plan/updated",
  "turn/started",
  "warning",
] as const;

export interface CodexClientInfo {
  name: string;
  title?: string;
  version?: string;
}

export interface CodexInitializeOptions {
  clientInfo: CodexClientInfo;
  experimentalApi?: boolean;
  optOutNotificationMethods?: string[];
}
