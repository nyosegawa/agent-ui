import type { ReasoningEffort } from "@nyosegawa/agent-ui-core";
import type {
  AppsListParams,
  HooksListParams,
  SkillsConfigWriteParams,
  SkillsListParams,
  ThreadForkParams,
  ThreadListParams,
  ThreadResumeParams,
  ThreadStartParams,
  TurnStartParams,
} from "@nyosegawa/agent-ui-codex/stable-types";

export type AgentJsonValue =
  | null
  | boolean
  | number
  | string
  | AgentJsonValue[]
  | { [key: string]: AgentJsonValue | undefined };

export type AgentApprovalPolicy =
  | "untrusted"
  | "on-failure"
  | "on-request"
  | "never"
  | {
      granular: {
        mcp_elicitations: boolean;
        request_permissions: boolean;
        rules: boolean;
        sandbox_approval: boolean;
        skill_approval: boolean;
      };
    };

export type AgentApprovalsReviewer = "user" | "auto_review" | "guardian_subagent";
export type AgentReasoningSummary = "auto" | "concise" | "detailed" | "none";
export type AgentPersonality = "none" | "friendly" | "pragmatic";
export type AgentSandboxMode = "read-only" | "workspace-write" | "danger-full-access";
export type AgentThreadSource = "user" | "subagent" | "memory_consolidation";
export type AgentThreadStartSource = "startup" | "clear";
export type AgentThreadSortKey = "created_at" | "updated_at";
export type AgentSortDirection = "asc" | "desc";
export type AgentThreadSourceKind =
  | "cli"
  | "vscode"
  | "exec"
  | "appServer"
  | "subAgent"
  | "subAgentReview"
  | "subAgentCompact"
  | "subAgentThreadSpawn"
  | "subAgentOther"
  | "unknown";

export type AgentSandboxPolicy =
  | { type: "dangerFullAccess" }
  | { networkAccess: boolean; type: "readOnly" }
  | { networkAccess: "restricted" | "enabled"; type: "externalSandbox" }
  | {
      excludeSlashTmp: boolean;
      excludeTmpdirEnvVar: boolean;
      networkAccess: boolean;
      type: "workspaceWrite";
      writableRoots: string[];
    };

export interface AgentThreadConfigOptions {
  approvalPolicy?: AgentApprovalPolicy | null;
  approvalsReviewer?: AgentApprovalsReviewer | null;
  baseInstructions?: string | null;
  config?: { [key: string]: AgentJsonValue | undefined } | null;
  cwd?: string | null;
  developerInstructions?: string | null;
  model?: string | null;
  modelProvider?: string | null;
  personality?: AgentPersonality | null;
  serviceTier?: string | null;
}

export interface ThreadStartOptions extends AgentThreadConfigOptions {
  ephemeral?: boolean | null;
  sandbox?: AgentSandboxMode | null;
  sessionStartSource?: AgentThreadStartSource | null;
  threadSource?: AgentThreadSource | null;
}

export interface ThreadResumeOptions extends AgentThreadConfigOptions {
  sandbox?: AgentSandboxMode | null;
}

export interface ThreadForkOptions extends AgentThreadConfigOptions {
  ephemeral?: boolean;
  sandbox?: AgentSandboxMode | null;
  threadSource?: AgentThreadSource | null;
}

export interface ThreadHistoryParams {
  archived?: boolean | null;
  cursor?: string | null;
  cwd?: string | string[] | null;
  limit?: number | null;
  modelProviders?: string[] | null;
  searchTerm?: string | null;
  sortDirection?: AgentSortDirection | null;
  sortKey?: AgentThreadSortKey | null;
  sourceKinds?: AgentThreadSourceKind[] | null;
  useStateDbOnly?: boolean;
}

export interface TurnStartOptions {
  approvalPolicy?: AgentApprovalPolicy | null;
  approvalsReviewer?: AgentApprovalsReviewer | null;
  cwd?: string | null;
  effort?: ReasoningEffort | null;
  model?: string | null;
  outputSchema?: AgentJsonValue | null;
  personality?: AgentPersonality | null;
  sandboxPolicy?: AgentSandboxPolicy | null;
  serviceTier?: string | null;
  summary?: AgentReasoningSummary | null;
}

export interface AgentAppsRefreshOptions {
  cursor?: string | null;
  forceRefetch?: boolean;
  limit?: number | null;
  threadId?: string | null;
}

export interface AgentSkillsRefreshOptions {
  cwds?: string[];
  forceReload?: boolean;
}

export interface AgentSkillConfigWriteOptions {
  enabled: boolean;
  name?: string | null;
  path?: string | null;
}

export interface AgentHooksRefreshOptions {
  cwds?: string[];
}

export function codexAppsListParams(
  params: AgentAppsRefreshOptions = {},
): AppsListParams {
  return { ...params } as AppsListParams;
}

export function codexSkillsListParams(
  params: AgentSkillsRefreshOptions = {},
): SkillsListParams {
  return { ...params } as SkillsListParams;
}

export function codexSkillsConfigWriteParams(
  params: AgentSkillConfigWriteOptions,
): SkillsConfigWriteParams {
  return { ...params } as SkillsConfigWriteParams;
}

export function codexHooksListParams(
  params: AgentHooksRefreshOptions = {},
): HooksListParams {
  return { ...params } as HooksListParams;
}

export function codexThreadStartParams(
  params: ThreadStartOptions = {},
): ThreadStartParams {
  return { ...params } as ThreadStartParams;
}

export function codexThreadResumeParams(
  params: ThreadResumeOptions = {},
): Omit<ThreadResumeParams, "threadId"> {
  return { ...params } as Omit<ThreadResumeParams, "threadId">;
}

export function codexThreadForkParams(
  params: ThreadForkOptions = {},
): Omit<ThreadForkParams, "threadId"> {
  return { ...params } as Omit<ThreadForkParams, "threadId">;
}

export function codexThreadHistoryParams(
  params: ThreadHistoryParams = {},
): ThreadListParams {
  return { ...params } as ThreadListParams;
}

export function codexTurnStartOptions(
  params: TurnStartOptions = {},
): Omit<TurnStartParams, "input" | "threadId"> {
  return { ...params } as Omit<TurnStartParams, "input" | "threadId">;
}
