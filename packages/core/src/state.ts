export type RequestId = string | number;
export type ThreadId = string;
export type TurnId = string;
export type ItemId = string;

export type ConnectionState =
  | { status: "idle" }
  | { status: "connecting" }
  | { status: "connected" }
  | { status: "closed"; reason?: string }
  | { status: "error"; error: AgentError };

export interface AgentError {
  code?: number;
  message: string;
  data?: unknown;
}

export interface AccountState {
  status: "unknown" | "unauthenticated" | "authenticating" | "authenticated";
  account?: Record<string, unknown>;
  login?: DeviceCodeLoginState;
  rateLimits?: unknown;
}

export interface DeviceCodeLoginState {
  loginId?: string;
  requestId?: RequestId;
  userCode?: string;
  verificationUrl?: string;
  expiresAt?: string;
}

export interface ModelState {
  models: AgentModel[];
  selectedModelId?: string;
}

export interface AgentModel {
  id: string;
  name?: string;
  defaultEffort?: ReasoningEffort;
  supportedEfforts?: ReasoningEffort[];
  raw?: unknown;
}

export type ReasoningEffort =
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | string;

export type ExecutionModeId = "review" | "auto" | "read-only" | "full-access" | string;

export interface RunSettingsState {
  executionMode: ExecutionModeId;
  modelId?: string;
  effort?: ReasoningEffort;
  cwd?: string;
}

export interface AgentThread {
  id: ThreadId;
  name?: string;
  path?: string | null;
  ephemeral?: boolean;
  raw?: unknown;
}

export type ThreadStatus =
  | "notLoaded"
  | "loaded"
  | "running"
  | "waitingForInput"
  | "complete"
  | "error"
  | string;

export interface ThreadTokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  raw?: unknown;
}

export interface ThreadState {
  thread: AgentThread;
  turns: Record<TurnId, TurnState>;
  orderedTurnIds: TurnId[];
  tokenUsage?: ThreadTokenUsage;
  status: ThreadStatus;
  registryStatus: ThreadRegistryStatus;
}

export type ThreadRegistryStatus = "cold" | "preview" | "live" | "loaded";

export interface ThreadRegistryState {
  activeThreadId?: ThreadId;
  coldThreadIds: ThreadId[];
  previewThreadIds: ThreadId[];
  liveThreadIds: ThreadId[];
  loadedThreadIds: ThreadId[];
}

export interface AgentTurn {
  id: TurnId;
  threadId: ThreadId;
  status?: string;
  raw?: unknown;
}

export interface TurnState {
  turn: AgentTurn;
  itemOrder: ItemId[];
  items: Record<ItemId, AgentItemState>;
  blocksByItemId: Record<ItemId, AgentItemBlock>;
  streamingTextByItemId: Record<ItemId, string>;
  commandOutputByItemId: Record<ItemId, string>;
  filePatchByItemId: Record<ItemId, unknown>;
  plan?: TurnPlanState;
  diff?: TurnDiffState;
}

export interface TurnPlanState {
  explanation?: string | null;
  plan: unknown;
  raw?: unknown;
}

export interface TurnDiffState {
  diff: unknown;
  raw?: unknown;
}

export interface AgentItemState {
  id: ItemId;
  turnId: TurnId;
  threadId: ThreadId;
  kind: string;
  status: "inProgress" | "completed" | "failed";
  text?: string;
  raw?: unknown;
}

export type AgentItemBlockKind =
  | "text"
  | "thinking"
  | "plan"
  | "commandExecution"
  | "fileChange"
  | "toolCall"
  | "mcpToolCall"
  | "collabToolCall"
  | "webSearch"
  | "image"
  | "systemInfo"
  | "unknown";

export interface AgentItemBlock {
  id: ItemId;
  kind: AgentItemBlockKind;
  status?: AgentItemState["status"];
  text?: string;
  raw?: unknown;
}

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

export interface WarningState {
  id: string;
  message: string;
  raw?: unknown;
}

export type StatusBannerKind =
  | "modelReroute"
  | "deprecationNotice"
  | "configWarning"
  | "accountStatus"
  | "mcpOAuth"
  | "rateLimit"
  | "system";

export interface StatusBannerState {
  id: string;
  kind: StatusBannerKind;
  message: string;
  raw?: unknown;
}

export interface DiagnosticsState {
  banners: StatusBannerState[];
  errors: AgentError[];
  warnings: WarningState[];
}

export interface UsageState {
  accountRateLimits?: unknown;
  hostMetrics?: unknown;
}

export interface AgentSkill {
  name: string;
  path?: string;
  cwd?: string;
  enabled?: boolean;
  raw?: unknown;
}

export interface SkillsState {
  byCwd: Record<string, AgentSkill[]>;
}

export interface AgentApp {
  id: string;
  name?: string;
  uri?: string;
  installed?: boolean;
  needsAuth?: boolean;
  raw?: unknown;
}

export interface AppsState {
  apps: AgentApp[];
  nextCursor?: string | null;
}

export interface AgentHook {
  id: string;
  name?: string;
  cwd?: string;
  enabled?: boolean;
  raw?: unknown;
}

export interface HooksState {
  byCwd: Record<string, AgentHook[]>;
}

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
    apps: { apps: [] },
    configWarnings: [],
    connection: { status: "idle" },
    diagnostics: { banners: [], errors: [], warnings: [] },
    errors: [],
    hooks: { byCwd: {} },
    models: { models: [] },
    pendingServerRequests: {},
    runSettings: { executionMode: "review" },
    serverRequestQueue: { byId: {}, order: [] },
    skills: { byCwd: {} },
    threadRegistry: {
      coldThreadIds: [],
      liveThreadIds: [],
      loadedThreadIds: [],
      previewThreadIds: [],
    },
    threads: {},
    usage: {},
  };
}
