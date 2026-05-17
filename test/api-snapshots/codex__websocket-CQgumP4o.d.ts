import { AgentTransport } from '@nyosegawa/agent-ui-core';

declare const CODEX_PROTOCOL_COMMIT = "6a225e4005209f2325ab3c681c7c6beba2907d4d";
declare const CODEX_PROTOCOL_GENERATED_AT = "2026-05-14T15:21:25+09:00";
type CodexCapabilityStatus = "stableAvailable" | "stableProductized" | "experimentalAvailable" | "hostOnly";
declare const stableAvailableMethods: readonly ["account/login/cancel", "account/login/start", "account/logout", "account/rateLimits/read", "account/read", "account/sendAddCreditsNudgeEmail", "app/list", "command/exec", "command/exec/resize", "command/exec/terminate", "command/exec/write", "config/batchWrite", "config/mcpServer/reload", "config/read", "config/value/write", "configRequirements/read", "experimentalFeature/enablement/set", "experimentalFeature/list", "externalAgentConfig/detect", "externalAgentConfig/import", "feedback/upload", "fs/copy", "fs/createDirectory", "fs/getMetadata", "fs/readDirectory", "fs/readFile", "fs/remove", "fs/unwatch", "fs/watch", "fs/writeFile", "fuzzyFileSearch", "getAuthStatus", "getConversationSummary", "gitDiffToRemote", "hooks/list", "initialize", "marketplace/add", "marketplace/remove", "marketplace/upgrade", "mcpServer/oauth/login", "mcpServer/resource/read", "mcpServer/tool/call", "mcpServerStatus/list", "model/list", "modelProvider/capabilities/read", "plugin/install", "plugin/list", "plugin/read", "plugin/share/checkout", "plugin/share/delete", "plugin/share/list", "plugin/share/save", "plugin/share/updateTargets", "plugin/skill/read", "plugin/uninstall", "review/start", "skills/config/write", "skills/list", "thread/approveGuardianDeniedAction", "thread/archive", "thread/compact/start", "thread/fork", "thread/inject_items", "thread/list", "thread/loaded/list", "thread/metadata/update", "thread/name/set", "thread/read", "thread/resume", "thread/rollback", "thread/shellCommand", "thread/start", "thread/unarchive", "thread/unsubscribe", "turn/interrupt", "turn/start", "turn/steer", "windowsSandbox/readiness", "windowsSandbox/setupStart"];
declare const stableProductizedMethods: readonly ["initialize", "account/read", "account/login/start", "account/login/cancel", "account/logout", "account/rateLimits/read", "model/list", "thread/start", "thread/resume", "thread/fork", "thread/list", "thread/loaded/list", "thread/read", "thread/archive", "thread/unarchive", "thread/name/set", "thread/metadata/update", "thread/compact/start", "thread/rollback", "thread/inject_items", "thread/unsubscribe", "turn/start", "turn/steer", "turn/interrupt", "skills/list", "skills/config/write", "hooks/list", "app/list"];
declare const hostOnlyMethods: readonly ["account/sendAddCreditsNudgeEmail", "command/exec", "command/exec/resize", "command/exec/terminate", "command/exec/write", "config/batchWrite", "config/mcpServer/reload", "config/read", "config/value/write", "configRequirements/read", "experimentalFeature/enablement/set", "experimentalFeature/list", "externalAgentConfig/detect", "externalAgentConfig/import", "feedback/upload", "fs/copy", "fs/createDirectory", "fs/getMetadata", "fs/readDirectory", "fs/readFile", "fs/remove", "fs/unwatch", "fs/watch", "fs/writeFile", "fuzzyFileSearch", "getAuthStatus", "getConversationSummary", "gitDiffToRemote", "marketplace/add", "marketplace/remove", "marketplace/upgrade", "mcpServer/oauth/login", "mcpServer/resource/read", "mcpServer/tool/call", "mcpServerStatus/list", "modelProvider/capabilities/read", "plugin/install", "plugin/list", "plugin/read", "plugin/share/checkout", "plugin/share/delete", "plugin/share/list", "plugin/share/save", "plugin/share/updateTargets", "plugin/skill/read", "plugin/uninstall", "review/start", "thread/approveGuardianDeniedAction", "thread/shellCommand", "windowsSandbox/readiness", "windowsSandbox/setupStart"];
declare const experimentalAvailableMethods: readonly ["collaborationMode/list", "environment/add", "fuzzyFileSearch/sessionStart", "fuzzyFileSearch/sessionStop", "fuzzyFileSearch/sessionUpdate", "memory/reset", "mock/experimentalMethod", "process/kill", "process/resizePty", "process/spawn", "process/writeStdin", "remoteControl/disable", "remoteControl/enable", "thread/backgroundTerminals/clean", "thread/decrement_elicitation", "thread/goal/clear", "thread/goal/get", "thread/goal/set", "thread/increment_elicitation", "thread/memoryMode/set", "thread/realtime/appendAudio", "thread/realtime/appendText", "thread/realtime/listVoices", "thread/realtime/start", "thread/realtime/stop", "thread/turns/items/list", "thread/turns/list"];
declare const stableServerRequestMethods: readonly ["account/chatgptAuthTokens/refresh", "applyPatchApproval", "attestation/generate", "execCommandApproval", "item/commandExecution/requestApproval", "item/fileChange/requestApproval", "item/permissions/requestApproval", "item/tool/call", "item/tool/requestUserInput", "mcpServer/elicitation/request"];
declare const stableNotificationMethods: readonly ["account/login/completed", "account/rateLimits/updated", "account/updated", "app/list/updated", "command/exec/outputDelta", "configWarning", "deprecationNotice", "error", "externalAgentConfig/import/completed", "fs/changed", "fuzzyFileSearch/sessionCompleted", "fuzzyFileSearch/sessionUpdated", "guardianWarning", "hook/completed", "hook/started", "item/agentMessage/delta", "item/autoApprovalReview/completed", "item/autoApprovalReview/started", "item/commandExecution/outputDelta", "item/commandExecution/terminalInteraction", "item/completed", "item/fileChange/outputDelta", "item/fileChange/patchUpdated", "item/mcpToolCall/progress", "item/plan/delta", "item/reasoning/summaryPartAdded", "item/reasoning/summaryTextDelta", "item/reasoning/textDelta", "item/started", "mcpServer/oauthLogin/completed", "mcpServer/startupStatus/updated", "model/rerouted", "model/verification", "process/exited", "process/outputDelta", "rawResponseItem/completed", "remoteControl/status/changed", "serverRequest/resolved", "skills/changed", "thread/archived", "thread/closed", "thread/compacted", "thread/goal/cleared", "thread/goal/updated", "thread/name/updated", "thread/realtime/closed", "thread/realtime/error", "thread/realtime/itemAdded", "thread/realtime/outputAudio/delta", "thread/realtime/sdp", "thread/realtime/started", "thread/realtime/transcript/delta", "thread/realtime/transcript/done", "thread/started", "thread/status/changed", "thread/tokenUsage/updated", "thread/unarchived", "turn/completed", "turn/diff/updated", "turn/plan/updated", "turn/started", "warning", "windows/worldWritableWarning", "windowsSandbox/setupCompleted"];
declare const stableClientMethods: readonly ["initialize", "account/read", "account/login/start", "account/login/cancel", "account/logout", "account/rateLimits/read", "model/list", "thread/start", "thread/resume", "thread/fork", "thread/list", "thread/loaded/list", "thread/read", "thread/archive", "thread/unarchive", "thread/name/set", "thread/metadata/update", "thread/compact/start", "thread/rollback", "thread/inject_items", "thread/unsubscribe", "turn/start", "turn/steer", "turn/interrupt", "skills/list", "skills/config/write", "hooks/list", "app/list"];
type StableAvailableMethod = (typeof stableAvailableMethods)[number];
type StableProductizedMethod = (typeof stableProductizedMethods)[number];
type ExperimentalAvailableMethod = (typeof experimentalAvailableMethods)[number];
type HostOnlyMethod = (typeof hostOnlyMethods)[number];
type StableServerRequestMethod = (typeof stableServerRequestMethods)[number];
type StableNotificationMethod = (typeof stableNotificationMethods)[number];
interface CodexCapabilityMetadata {
    method: string;
    status: CodexCapabilityStatus;
}
declare const codexCapabilityMetadata: readonly CodexCapabilityMetadata[];
interface CodexClientInfo {
    name: string;
    title?: string;
    version?: string;
}
interface CodexInitializeOptions {
    clientInfo: CodexClientInfo;
    experimentalApi?: boolean;
    optOutNotificationMethods?: string[];
}

interface CodexWebSocketTransportOptions {
    initialize?: CodexInitializeOptions;
    protocols?: string | string[];
    reconnect?: false | CodexWebSocketReconnectOptions;
    url: string | URL;
    webSocketImpl?: typeof WebSocket;
}
interface CodexWebSocketReconnectOptions {
    initialDelayMs?: number;
    maxAttempts?: number;
    maxDelayMs?: number;
    multiplier?: number;
}
declare function createCodexWebSocketTransport(options: CodexWebSocketTransportOptions): AgentTransport;

export { type CodexInitializeOptions as C, type ExperimentalAvailableMethod as E, type HostOnlyMethod as H, type StableAvailableMethod as S, CODEX_PROTOCOL_COMMIT as a, CODEX_PROTOCOL_GENERATED_AT as b, type CodexCapabilityMetadata as c, type CodexCapabilityStatus as d, type CodexClientInfo as e, type CodexWebSocketReconnectOptions as f, type CodexWebSocketTransportOptions as g, type StableNotificationMethod as h, type StableProductizedMethod as i, type StableServerRequestMethod as j, codexCapabilityMetadata as k, createCodexWebSocketTransport as l, experimentalAvailableMethods as m, hostOnlyMethods as n, stableClientMethods as o, stableNotificationMethods as p, stableProductizedMethods as q, stableServerRequestMethods as r, stableAvailableMethods as s };
