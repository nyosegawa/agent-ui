import type { AccountState } from "./state/account";
import type { AppsState } from "./state/apps";
import type { AgentError, ThreadId } from "./state/common";
import type { ConnectionState } from "./state/connection";
import type { DiagnosticsState, WarningState } from "./state/diagnostics";
import type { HooksState } from "./state/hooks";
import type { ModelState } from "./state/models";
import type { RunSettingsState } from "./state/run-settings";
import type {
  PendingServerRequest,
  ServerRequestQueueState,
} from "./state/server-requests";
import type { SkillsState } from "./state/skills";
import type { ThreadRegistryState, ThreadState } from "./state/thread";
import type { UsageState } from "./state/usage";
import { createInitialConnectionState } from "./stores/connection";
import { createInitialThreadRegistryState } from "./stores/thread-index";

export type * from "./state/account";
export type * from "./state/apps";
export type * from "./state/common";
export type * from "./state/connection";
export type * from "./state/diagnostics";
export type * from "./state/hooks";
export type * from "./state/item";
export type * from "./state/models";
export type * from "./state/run-settings";
export type * from "./state/server-requests";
export type * from "./state/skills";
export type * from "./state/thread";
export type * from "./state/turn";
export type * from "./state/usage";

export interface AgentSessionState {
  connection: ConnectionState;
  account: AccountState;
  apps: AppsState;
  diagnostics: DiagnosticsState;
  hooks: HooksState;
  threads: Record<ThreadId, ThreadState>;
  threadRegistry: ThreadRegistryState;
  activeThreadId?: ThreadId;
  pendingServerRequests: Record<string, PendingServerRequest>;
  serverRequestQueue: ServerRequestQueueState;
  models: ModelState;
  runSettings: RunSettingsState;
  skills: SkillsState;
  usage: UsageState;
  configWarnings: WarningState[];
  errors: AgentError[];
}

export function createInitialAgentState(): AgentSessionState {
  return {
    account: { status: "unknown" },
    apps: { apps: [], byScope: {} },
    configWarnings: [],
    connection: createInitialConnectionState(),
    diagnostics: { banners: [], errors: [], protocolNotifications: [], warnings: [] },
    errors: [],
    hooks: { byCwd: {} },
    models: { models: [] },
    pendingServerRequests: {},
    runSettings: { executionMode: "review" },
    serverRequestQueue: { byId: {}, order: [] },
    skills: { byCwd: {} },
    threadRegistry: createInitialThreadRegistryState(),
    threads: {},
    usage: {},
  };
}
