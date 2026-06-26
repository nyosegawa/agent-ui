import type { AccountState } from "./state/account";
import type { AppsState } from "./state/apps";
import type { ThreadId } from "./state/common";
import type { ConnectionState } from "./state/connection";
import type { DiagnosticsState } from "./state/diagnostics";
import type { HooksState } from "./state/hooks";
import type { ModelState } from "./state/models";
import type { RunSettingsState } from "./state/run-settings";
import type { ServerRequestQueueState } from "./state/server-requests";
import type { SkillsState } from "./state/skills";
import type {
  ThreadLifecycleState,
  ThreadState,
} from "./state/thread";
import type { UsageState } from "./state/usage";
import { createInitialAppsState } from "./stores/apps";
import { createInitialConnectionState } from "./stores/connection";
import { createInitialDiagnosticsState } from "./stores/diagnostics";
import { createInitialServerRequestQueueState } from "./stores/server-request";
import { createInitialThreadEntityState } from "./stores/thread-entity";
import { createInitialThreadLifecycleState } from "./stores/thread-lifecycle";
import { createInitialUsageState } from "./stores/usage";

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
  threadLifecycle: ThreadLifecycleState;
  serverRequestQueue: ServerRequestQueueState;
  models: ModelState;
  runSettings: RunSettingsState;
  skills: SkillsState;
  usage: UsageState;
}

export function createInitialAgentState(): AgentSessionState {
  return {
    account: { status: "unknown" },
    apps: createInitialAppsState(),
    connection: createInitialConnectionState(),
    diagnostics: createInitialDiagnosticsState(),
    hooks: { byCwd: {} },
    models: { models: [] },
    runSettings: { policyId: "review" },
    serverRequestQueue: createInitialServerRequestQueueState(),
    skills: { byCwd: {} },
    threadLifecycle: createInitialThreadLifecycleState(),
    threads: createInitialThreadEntityState(),
    usage: createInitialUsageState(),
  };
}
