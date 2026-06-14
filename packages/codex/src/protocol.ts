import type {
  ClientInfo as StableClientInfo,
  InitializeCapabilities as StableInitializeCapabilities,
  InitializeParams,
} from "./generated/stable";
import type { generatedExperimentalOnlyClientMethods } from "./generated/protocol-capabilities";
import {
  generatedStableClientMethods,
  generatedStableNotificationMethods,
  generatedStableServerRequestMethods,
} from "./generated/protocol-capabilities";

export const CODEX_PROTOCOL_COMMIT = "5e9249ec0266f6331d1cb811d472c4d20cd5131d";
export const CODEX_PROTOCOL_GENERATED_AT = "2026-06-14T06:08:20.624Z";

export type CodexCapabilityStatus =
  | "stableAvailable"
  | "stableProductized"
  | "experimentalAvailable"
  | "experimentalUnsupported"
  | "hostOnly";

export const stableAvailableMethods = generatedStableClientMethods;

export const stableProductizedMethods = [
  "initialize",
  "account/read",
  "account/login/start",
  "account/login/cancel",
  "account/logout",
  "account/rateLimits/read",
  "account/usage/read",
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
  "skills/extraRoots/set",
  "thread/approveGuardianDeniedAction",
  "thread/delete",
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
  "process/kill",
  "process/resizePty",
  "process/spawn",
  "process/writeStdin",
  "remoteControl/disable",
  "remoteControl/enable",
  "remoteControl/client/list",
  "remoteControl/client/revoke",
  "remoteControl/pairing/start",
  "remoteControl/pairing/status",
  "remoteControl/status/read",
  "thread/backgroundTerminals/clean",
  "thread/backgroundTerminals/list",
  "thread/backgroundTerminals/terminate",
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
] as const satisfies readonly GeneratedExperimentalOnlyClientMethod[];

export const experimentalUnsupportedMethods = [
  "thread/turns/items/list",
] as const satisfies readonly GeneratedExperimentalOnlyClientMethod[];

const experimentalTestOnlyMethods = [
  "mock/experimentalMethod",
] as const satisfies readonly GeneratedExperimentalOnlyClientMethod[];

export const stableServerRequestMethods = generatedStableServerRequestMethods;

export const stableNotificationMethods = generatedStableNotificationMethods;

export const stableClientMethods = stableProductizedMethods;

export type StableAvailableMethod = (typeof stableAvailableMethods)[number];
export type StableProductizedMethod = (typeof stableProductizedMethods)[number];
export type ExperimentalAvailableMethod = (typeof experimentalAvailableMethods)[number];
export type ExperimentalUnsupportedMethod =
  (typeof experimentalUnsupportedMethods)[number];
export type HostOnlyMethod = (typeof hostOnlyMethods)[number];
export type StableServerRequestMethod = (typeof stableServerRequestMethods)[number];
export type StableNotificationMethod = (typeof stableNotificationMethods)[number];
type GeneratedExperimentalOnlyClientMethod =
  (typeof generatedExperimentalOnlyClientMethods)[number];

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
const experimentalTestOnlyMethodSet = new Set<string>(experimentalTestOnlyMethods);
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
  if (experimentalTestOnlyMethodSet.has(method)) return null;
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
