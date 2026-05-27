import type {
  ClientInfo as StableClientInfo,
  InitializeCapabilities as StableInitializeCapabilities,
  InitializeParams,
} from "./generated/stable";

export const CODEX_PROTOCOL_COMMIT = "64e340ad2809a4da61ec12535a056bcf58f5d6ef";
export const CODEX_PROTOCOL_GENERATED_AT = "2026-05-27T18:55:58+09:00";

export type CodexCapabilityStatus =
  | "stableAvailable"
  | "stableProductized"
  | "experimentalAvailable"
  | "experimentalUnsupported"
  | "hostOnly";

export const stableAvailableMethods = [
  "account/login/cancel",
  "account/login/start",
  "account/logout",
  "account/rateLimits/read",
  "account/read",
  "account/sendAddCreditsNudgeEmail",
  "app/list",
  "command/exec",
  "command/exec/resize",
  "command/exec/terminate",
  "command/exec/write",
  "config/batchWrite",
  "config/mcpServer/reload",
  "config/read",
  "config/value/write",
  "configRequirements/read",
  "experimentalFeature/enablement/set",
  "experimentalFeature/list",
  "externalAgentConfig/detect",
  "externalAgentConfig/import",
  "feedback/upload",
  "fs/copy",
  "fs/createDirectory",
  "fs/getMetadata",
  "fs/readDirectory",
  "fs/readFile",
  "fs/remove",
  "fs/unwatch",
  "fs/watch",
  "fs/writeFile",
  "fuzzyFileSearch",
  "getAuthStatus",
  "getConversationSummary",
  "gitDiffToRemote",
  "hooks/list",
  "initialize",
  "marketplace/add",
  "marketplace/remove",
  "marketplace/upgrade",
  "mcpServer/oauth/login",
  "mcpServer/resource/read",
  "mcpServer/tool/call",
  "mcpServerStatus/list",
  "model/list",
  "modelProvider/capabilities/read",
  "permissionProfile/list",
  "plugin/install",
  "plugin/installed",
  "plugin/list",
  "plugin/read",
  "plugin/share/checkout",
  "plugin/share/delete",
  "plugin/share/list",
  "plugin/share/save",
  "plugin/share/updateTargets",
  "plugin/skill/read",
  "plugin/uninstall",
  "review/start",
  "skills/config/write",
  "skills/list",
  "thread/approveGuardianDeniedAction",
  "thread/archive",
  "thread/compact/start",
  "thread/fork",
  "thread/goal/clear",
  "thread/goal/get",
  "thread/goal/set",
  "thread/inject_items",
  "thread/list",
  "thread/loaded/list",
  "thread/metadata/update",
  "thread/name/set",
  "thread/read",
  "thread/resume",
  "thread/rollback",
  "thread/shellCommand",
  "thread/start",
  "thread/unarchive",
  "thread/unsubscribe",
  "turn/interrupt",
  "turn/start",
  "turn/steer",
  "windowsSandbox/readiness",
  "windowsSandbox/setupStart",
] as const;

export const stableProductizedMethods = [
  "initialize",
  "account/read",
  "account/login/start",
  "account/login/cancel",
  "account/logout",
  "account/rateLimits/read",
  "model/list",
  "thread/start",
  "thread/resume",
  "thread/fork",
  "thread/list",
  "thread/loaded/list",
  "thread/read",
  "thread/archive",
  "thread/unarchive",
  "thread/name/set",
  "thread/metadata/update",
  "thread/compact/start",
  "thread/rollback",
  "thread/inject_items",
  "thread/unsubscribe",
  "turn/start",
  "turn/steer",
  "turn/interrupt",
  "skills/list",
  "skills/config/write",
  "hooks/list",
  "app/list",
] as const satisfies readonly StableAvailableMethod[];

export const hostOnlyMethods = [
  "account/sendAddCreditsNudgeEmail",
  "command/exec",
  "command/exec/resize",
  "command/exec/terminate",
  "command/exec/write",
  "config/batchWrite",
  "config/mcpServer/reload",
  "config/read",
  "config/value/write",
  "configRequirements/read",
  "experimentalFeature/enablement/set",
  "experimentalFeature/list",
  "externalAgentConfig/detect",
  "externalAgentConfig/import",
  "feedback/upload",
  "fs/copy",
  "fs/createDirectory",
  "fs/getMetadata",
  "fs/readDirectory",
  "fs/readFile",
  "fs/remove",
  "fs/unwatch",
  "fs/watch",
  "fs/writeFile",
  "fuzzyFileSearch",
  "getAuthStatus",
  "getConversationSummary",
  "gitDiffToRemote",
  "marketplace/add",
  "marketplace/remove",
  "marketplace/upgrade",
  "mcpServer/oauth/login",
  "mcpServer/resource/read",
  "mcpServer/tool/call",
  "mcpServerStatus/list",
  "modelProvider/capabilities/read",
  "permissionProfile/list",
  "plugin/install",
  "plugin/installed",
  "plugin/list",
  "plugin/read",
  "plugin/share/checkout",
  "plugin/share/delete",
  "plugin/share/list",
  "plugin/share/save",
  "plugin/share/updateTargets",
  "plugin/skill/read",
  "plugin/uninstall",
  "review/start",
  "thread/approveGuardianDeniedAction",
  "thread/shellCommand",
  "thread/goal/clear",
  "thread/goal/get",
  "thread/goal/set",
  "windowsSandbox/readiness",
  "windowsSandbox/setupStart",
] as const satisfies readonly StableAvailableMethod[];

export const experimentalAvailableMethods = [
  "collaborationMode/list",
  "environment/add",
  "fuzzyFileSearch/sessionStart",
  "fuzzyFileSearch/sessionStop",
  "fuzzyFileSearch/sessionUpdate",
  "memory/reset",
  "mock/experimentalMethod",
  "process/kill",
  "process/resizePty",
  "process/spawn",
  "process/writeStdin",
  "remoteControl/disable",
  "remoteControl/enable",
  "remoteControl/status/read",
  "thread/backgroundTerminals/clean",
  "thread/decrement_elicitation",
  "thread/increment_elicitation",
  "thread/memoryMode/set",
  "thread/realtime/appendAudio",
  "thread/realtime/appendText",
  "thread/realtime/listVoices",
  "thread/realtime/start",
  "thread/realtime/stop",
  "thread/search",
  "thread/settings/update",
  "thread/turns/list",
] as const;

export const experimentalUnsupportedMethods = [
  "thread/turns/items/list",
] as const;

export const stableServerRequestMethods = [
  "account/chatgptAuthTokens/refresh",
  "applyPatchApproval",
  "attestation/generate",
  "execCommandApproval",
  "item/commandExecution/requestApproval",
  "item/fileChange/requestApproval",
  "item/permissions/requestApproval",
  "item/tool/call",
  "item/tool/requestUserInput",
  "mcpServer/elicitation/request",
] as const;

export const stableNotificationMethods = [
  "account/login/completed",
  "account/rateLimits/updated",
  "account/updated",
  "app/list/updated",
  "command/exec/outputDelta",
  "configWarning",
  "deprecationNotice",
  "error",
  "externalAgentConfig/import/completed",
  "fs/changed",
  "fuzzyFileSearch/sessionCompleted",
  "fuzzyFileSearch/sessionUpdated",
  "guardianWarning",
  "hook/completed",
  "hook/started",
  "item/agentMessage/delta",
  "item/autoApprovalReview/completed",
  "item/autoApprovalReview/started",
  "item/commandExecution/outputDelta",
  "item/commandExecution/terminalInteraction",
  "item/completed",
  "item/fileChange/outputDelta",
  "item/fileChange/patchUpdated",
  "item/mcpToolCall/progress",
  "item/plan/delta",
  "item/reasoning/summaryPartAdded",
  "item/reasoning/summaryTextDelta",
  "item/reasoning/textDelta",
  "item/started",
  "mcpServer/oauthLogin/completed",
  "mcpServer/startupStatus/updated",
  "model/rerouted",
  "model/verification",
  "process/exited",
  "process/outputDelta",
  "rawResponseItem/completed",
  "remoteControl/status/changed",
  "serverRequest/resolved",
  "skills/changed",
  "thread/archived",
  "thread/closed",
  "thread/compacted",
  "thread/goal/cleared",
  "thread/goal/updated",
  "thread/name/updated",
  "thread/realtime/closed",
  "thread/realtime/error",
  "thread/realtime/itemAdded",
  "thread/realtime/outputAudio/delta",
  "thread/realtime/sdp",
  "thread/realtime/started",
  "thread/realtime/transcript/delta",
  "thread/realtime/transcript/done",
  "thread/settings/updated",
  "thread/started",
  "thread/status/changed",
  "thread/tokenUsage/updated",
  "thread/unarchived",
  "turn/completed",
  "turn/diff/updated",
  "turn/plan/updated",
  "turn/started",
  "warning",
  "windows/worldWritableWarning",
  "windowsSandbox/setupCompleted",
] as const;

export const stableClientMethods = stableProductizedMethods;

export type StableAvailableMethod = (typeof stableAvailableMethods)[number];
export type StableProductizedMethod = (typeof stableProductizedMethods)[number];
export type ExperimentalAvailableMethod = (typeof experimentalAvailableMethods)[number];
export type ExperimentalUnsupportedMethod =
  (typeof experimentalUnsupportedMethods)[number];
export type HostOnlyMethod = (typeof hostOnlyMethods)[number];
export type StableServerRequestMethod = (typeof stableServerRequestMethods)[number];
export type StableNotificationMethod = (typeof stableNotificationMethods)[number];

export interface CodexCapabilityMetadata {
  method: string;
  status: CodexCapabilityStatus;
}

export const codexCapabilityMetadata: readonly CodexCapabilityMetadata[] = [
  ...stableProductizedMethods.map((method) => ({
    method,
    status: "stableProductized" as const,
  })),
  ...hostOnlyMethods.map((method) => ({ method, status: "hostOnly" as const })),
  ...stableAvailableMethods
    .filter(
      (method) =>
        !stableProductizedMethods.includes(method as StableProductizedMethod) &&
        !hostOnlyMethods.includes(method as HostOnlyMethod),
    )
    .map((method) => ({ method, status: "stableAvailable" as const })),
  ...experimentalAvailableMethods.map((method) => ({
    method,
    status: "experimentalAvailable" as const,
  })),
  ...experimentalUnsupportedMethods.map((method) => ({
    method,
    status: "experimentalUnsupported" as const,
  })),
];

const stableAvailableMethodSet = new Set<string>(stableAvailableMethods);
const stableProductizedMethodSet = new Set<string>(stableProductizedMethods);
const experimentalAvailableMethodSet = new Set<string>(experimentalAvailableMethods);
const experimentalUnsupportedMethodSet = new Set<string>(
  experimentalUnsupportedMethods,
);
const hostOnlyMethodSet = new Set<string>(hostOnlyMethods);

export function getCodexCapabilityStatus(
  method: string,
): CodexCapabilityStatus | null {
  if (stableProductizedMethodSet.has(method)) return "stableProductized";
  if (hostOnlyMethodSet.has(method)) return "hostOnly";
  if (stableAvailableMethodSet.has(method)) return "stableAvailable";
  if (experimentalAvailableMethodSet.has(method)) {
    return "experimentalAvailable";
  }
  if (experimentalUnsupportedMethodSet.has(method)) {
    return "experimentalUnsupported";
  }
  return null;
}

export function isStableProductizedMethod(
  method: string,
): method is StableProductizedMethod {
  return stableProductizedMethodSet.has(method);
}

export function isExperimentalAvailableMethod(
  method: string,
): method is ExperimentalAvailableMethod {
  return experimentalAvailableMethodSet.has(method);
}

export function isExperimentalUnsupportedMethod(
  method: string,
): method is ExperimentalUnsupportedMethod {
  return experimentalUnsupportedMethodSet.has(method);
}

export function isHostOnlyMethod(method: string): method is HostOnlyMethod {
  return hostOnlyMethodSet.has(method);
}

export function assertCodexProductizedMethod(
  method: string,
): asserts method is StableProductizedMethod {
  if (!isStableProductizedMethod(method)) {
    const status = getCodexCapabilityStatus(method) ?? "unknown";
    throw new Error(`Codex method is not productized: ${method} (${status})`);
  }
}

export function assertCodexExperimentalMethod(
  method: string,
): asserts method is ExperimentalAvailableMethod {
  if (!isExperimentalAvailableMethod(method)) {
    const status = getCodexCapabilityStatus(method) ?? "unknown";
    throw new Error(`Codex method is not experimental: ${method} (${status})`);
  }
}

export type CodexClientInfo = StableClientInfo;
export type CodexInitializeCapabilities = StableInitializeCapabilities;
export type CodexInitializeOptions = InitializeParams;

export function codexInitializeParams(options: CodexInitializeOptions): InitializeParams {
  return {
    capabilities: normalizeInitializeCapabilities(options.capabilities),
    clientInfo: {
      name: options.clientInfo.name,
      title: options.clientInfo.title,
      version: options.clientInfo.version,
    },
  };
}

function normalizeInitializeCapabilities(
  capabilities: InitializeParams["capabilities"],
): InitializeParams["capabilities"] {
  if (capabilities === null) return null;
  return {
    experimentalApi: capabilities?.experimentalApi ?? false,
    requestAttestation: capabilities?.requestAttestation ?? false,
    ...(capabilities?.optOutNotificationMethods !== undefined
      ? { optOutNotificationMethods: capabilities.optOutNotificationMethods }
      : {}),
  };
}
