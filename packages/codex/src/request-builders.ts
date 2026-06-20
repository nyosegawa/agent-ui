import type { ApprovalsReviewer } from "./generated/stable/v2/ApprovalsReviewer";
import type { AskForApproval } from "./generated/stable/v2/AskForApproval";
import type { JsonValue } from "./generated/stable/serde_json/JsonValue";
import type { Personality } from "./generated/stable/Personality";
import type { ReasoningEffort } from "./generated/stable/ReasoningEffort";
import type { ReasoningSummary } from "./generated/stable/ReasoningSummary";
import type { SandboxMode } from "./generated/stable/v2/SandboxMode";
import type { SandboxPolicy } from "./generated/stable/v2/SandboxPolicy";
import type { SortDirection } from "./generated/stable/v2/SortDirection";
import type { ThreadSortKey } from "./generated/stable/v2/ThreadSortKey";
import type { ThreadSource } from "./generated/stable/v2/ThreadSource";
import type { ThreadSourceKind } from "./generated/stable/v2/ThreadSourceKind";
import type { ThreadStartSource } from "./generated/stable/v2/ThreadStartSource";
import type { UserInput } from "./generated/stable/v2/UserInput";
import type { CodexStableMethodParams as GeneratedCodexStableMethodParams } from "./method-params";
import type {
  AgentMentionPath,
  AgentResourcePath,
  AgentSkillPath,
  AgentWorkingDirectory,
} from "./path-types";

export type { UserInput } from "./generated/stable/v2/UserInput";
export type {
  AgentLocalPath,
  AgentMentionPath,
  AgentResourcePath,
  AgentSkillPath,
  AgentWorkingDirectory,
} from "./path-types";

export interface AppsListParams {
  cursor?: string | null;
  forceRefetch?: boolean;
  limit?: number | null;
  threadId?: string | null;
}
export interface CancelLoginAccountParams { loginId: string }
export interface GetAccountParams { refreshToken: boolean }
export interface HooksListParams { cwds?: AgentWorkingDirectory[] }
export type LoginAccountParams =
  | { type: "chatgptDeviceCode" }
  | { type: "chatgpt"; codexStreamlinedLogin?: boolean }
  | { type: "apiKey"; apiKey: string }
  | {
      type: "chatgptAuthTokens";
      accessToken: string;
      chatgptAccountId: string;
      chatgptPlanType?: string | null;
    };
export interface ModelListParams {
  cursor?: string | null;
  includeHidden?: boolean | null;
  limit?: number | null;
}
export interface SkillsConfigWriteParams {
  enabled: boolean;
  name?: string | null;
  path?: AgentSkillPath | null;
}
export interface SkillsListParams {
  cwds?: AgentWorkingDirectory[];
  forceReload?: boolean;
}
export interface ThreadArchiveParams { threadId: string }
export interface ThreadCompactStartParams { threadId: string }
export interface ThreadForkParams extends ThreadConfigOverrides {
  ephemeral?: boolean;
  threadId: string;
  threadSource?: ThreadSource | null;
}
export interface ThreadInjectItemsParams {
  items: JsonValue[];
  threadId: string;
}
export interface ThreadListParams {
  archived?: boolean | null;
  cursor?: string | null;
  cwd?: AgentWorkingDirectory | AgentWorkingDirectory[] | null;
  limit?: number | null;
  modelProviders?: string[] | null;
  searchTerm?: string | null;
  sortDirection?: SortDirection | null;
  sortKey?: ThreadSortKey | null;
  sourceKinds?: ThreadSourceKind[] | null;
  useStateDbOnly?: boolean;
}
export interface ThreadLoadedListParams {
  cursor?: string | null;
  limit?: number | null;
}
export interface ThreadMetadataUpdateParams {
  gitInfo?: {
    branch?: string | null;
    commit?: string | null;
    repository?: string | null;
  } | null;
  threadId: string;
}
export interface ThreadReadParams {
  includeTurns: boolean;
  threadId: string;
}
export interface ThreadResumeParams extends ThreadConfigOverrides {
  threadId: string;
}
export interface ThreadRollbackParams {
  numTurns: number;
  threadId: string;
}
export interface ThreadSetNameParams {
  name: string;
  threadId: string;
}
export interface ThreadStartParams extends ThreadConfigOverrides {
  ephemeral?: boolean | null;
  serviceName?: string | null;
  sessionStartSource?: ThreadStartSource | null;
  threadSource?: ThreadSource | null;
}
export interface ThreadUnarchiveParams { threadId: string }
export interface ThreadUnsubscribeParams { threadId: string }
export interface TurnInterruptParams {
  threadId: string;
  turnId: string;
}
export interface TurnStartParams extends TurnConfigOverrides {
  clientUserMessageId?: string | null;
  input: UserInput[];
  threadId: string;
}
export interface TurnSteerParams {
  clientUserMessageId?: string | null;
  expectedTurnId: string;
  input: UserInput[];
  threadId: string;
}

interface ThreadConfigOverrides {
  approvalPolicy?: AskForApproval | null;
  approvalsReviewer?: ApprovalsReviewer | null;
  baseInstructions?: string | null;
  config?: Record<string, JsonValue | undefined> | null;
  cwd?: AgentWorkingDirectory | null;
  developerInstructions?: string | null;
  model?: string | null;
  modelProvider?: string | null;
  personality?: Personality | null;
  sandbox?: SandboxMode | null;
  serviceTier?: string | null;
}

interface TurnConfigOverrides {
  approvalPolicy?: AskForApproval | null;
  approvalsReviewer?: ApprovalsReviewer | null;
  cwd?: AgentWorkingDirectory | null;
  effort?: ReasoningEffort | null;
  model?: string | null;
  outputSchema?: JsonValue | null;
  personality?: Personality | null;
  sandboxPolicy?: SandboxPolicy | null;
  serviceTier?: string | null;
  summary?: ReasoningSummary | null;
}

export type CodexUserInput = UserInput;

export interface AgentBrowserVerificationInputOptions {
  prompt: string;
  skillPath: string;
  skillName?: string;
}

export const disabledProductMethods = ["thread/turns/items/list"] as const;

export function accountReadParams(refreshToken = false): GetAccountParams {
  const params = { refreshToken } satisfies GeneratedCodexStableMethodParams<"account/read">;
  return params;
}

export function deviceCodeLoginParams(): LoginAccountParams {
  const params = { type: "chatgptDeviceCode" } satisfies GeneratedCodexStableMethodParams<"account/login/start">;
  return params;
}

export function chatgptLoginParams(codexStreamlinedLogin?: boolean): LoginAccountParams {
  const params = {
    type: "chatgpt",
    ...(codexStreamlinedLogin === undefined ? {} : { codexStreamlinedLogin }),
  } satisfies GeneratedCodexStableMethodParams<"account/login/start">;
  return params;
}

export function apiKeyLoginParams(apiKey: string): LoginAccountParams {
  const params = { apiKey, type: "apiKey" } satisfies GeneratedCodexStableMethodParams<"account/login/start">;
  return params;
}

export function authTokensLoginParams(params: {
  accessToken: string;
  chatgptAccountId: string;
  chatgptPlanType?: string | null;
}): LoginAccountParams {
  const request = {
    type: "chatgptAuthTokens",
    ...params,
  } satisfies GeneratedCodexStableMethodParams<"account/login/start">;
  return request;
}

export function cancelLoginParams(loginId: string): CancelLoginAccountParams {
  const params = { loginId } satisfies GeneratedCodexStableMethodParams<"account/login/cancel">;
  return params;
}

export function modelListParams(params: ModelListParams = {}): ModelListParams {
  const request = { ...params } satisfies GeneratedCodexStableMethodParams<"model/list">;
  return request;
}

export function threadListParams(params: ThreadListParams = {}): ThreadListParams {
  const request = {
    cursor: params.cursor ?? null,
    limit: params.limit ?? 25,
    searchTerm: params.searchTerm ?? null,
    sortDirection: params.sortDirection ?? "desc",
    sortKey: params.sortKey ?? "updated_at",
    ...(params.archived !== undefined ? { archived: params.archived } : {}),
    ...(params.cwd !== undefined ? { cwd: params.cwd } : {}),
    ...(params.modelProviders !== undefined ? { modelProviders: params.modelProviders } : {}),
    ...(params.sourceKinds !== undefined ? { sourceKinds: params.sourceKinds } : {}),
    ...(params.useStateDbOnly !== undefined
      ? { useStateDbOnly: params.useStateDbOnly }
      : {}),
  } satisfies GeneratedCodexStableMethodParams<"thread/list">;
  return request;
}

export function threadLoadedListParams(
  params: ThreadLoadedListParams = {},
): ThreadLoadedListParams {
  const request = { ...params } satisfies GeneratedCodexStableMethodParams<"thread/loaded/list">;
  return request;
}

export function threadReadParams(
  threadId: string,
  includeTurns = true,
): ThreadReadParams {
  const params = { includeTurns, threadId } satisfies GeneratedCodexStableMethodParams<"thread/read">;
  return params;
}

export function threadResumeParams(
  threadId: string,
  params: Omit<ThreadResumeParams, "threadId"> = {},
): ThreadResumeParams {
  const request = {
    ...(params.model !== undefined ? { model: params.model } : {}),
    ...(params.modelProvider !== undefined ? { modelProvider: params.modelProvider } : {}),
    ...(params.serviceTier !== undefined ? { serviceTier: params.serviceTier } : {}),
    ...(params.cwd !== undefined ? { cwd: params.cwd } : {}),
    ...(params.approvalPolicy !== undefined ? { approvalPolicy: params.approvalPolicy } : {}),
    ...(params.approvalsReviewer !== undefined
      ? { approvalsReviewer: params.approvalsReviewer }
      : {}),
    ...(params.sandbox !== undefined ? { sandbox: params.sandbox } : {}),
    ...(params.config !== undefined ? { config: params.config } : {}),
    ...(params.baseInstructions !== undefined
      ? { baseInstructions: params.baseInstructions }
      : {}),
    ...(params.developerInstructions !== undefined
      ? { developerInstructions: params.developerInstructions }
      : {}),
    ...(params.personality !== undefined ? { personality: params.personality } : {}),
    threadId,
  } satisfies GeneratedCodexStableMethodParams<"thread/resume">;
  return request;
}

export function threadStartParams(options: ThreadStartParams = {}): ThreadStartParams {
  const request = { ...options } satisfies GeneratedCodexStableMethodParams<"thread/start">;
  return request;
}

export function threadForkParams(
  threadId: string,
  params: Omit<ThreadForkParams, "threadId"> = {},
): ThreadForkParams {
  const request = { ...params, threadId } satisfies GeneratedCodexStableMethodParams<"thread/fork">;
  return request;
}

export function threadArchiveParams(threadId: string): ThreadArchiveParams {
  const params = { threadId } satisfies GeneratedCodexStableMethodParams<"thread/archive">;
  return params;
}

export function threadUnarchiveParams(threadId: string): ThreadUnarchiveParams {
  const params = { threadId } satisfies GeneratedCodexStableMethodParams<"thread/unarchive">;
  return params;
}

export function threadSetNameParams(
  threadId: string,
  name: string,
): ThreadSetNameParams {
  const params = { name, threadId } satisfies GeneratedCodexStableMethodParams<"thread/name/set">;
  return params;
}

export function threadMetadataUpdateParams(
  threadId: string,
  params: Omit<ThreadMetadataUpdateParams, "threadId"> = {},
): ThreadMetadataUpdateParams {
  const request = { ...params, threadId } satisfies GeneratedCodexStableMethodParams<"thread/metadata/update">;
  return request;
}

export function threadCompactStartParams(threadId: string): ThreadCompactStartParams {
  const params = { threadId } satisfies GeneratedCodexStableMethodParams<"thread/compact/start">;
  return params;
}

export function threadRollbackParams(
  threadId: string,
  numTurns: number,
): ThreadRollbackParams {
  const params = { numTurns, threadId } satisfies GeneratedCodexStableMethodParams<"thread/rollback">;
  return params;
}

export function threadInjectItemsParams(
  threadId: string,
  items: ThreadInjectItemsParams["items"],
): ThreadInjectItemsParams {
  const params = { items, threadId } satisfies GeneratedCodexStableMethodParams<"thread/inject_items">;
  return params;
}

export function threadUnsubscribeParams(threadId: string): ThreadUnsubscribeParams {
  const params = { threadId } satisfies GeneratedCodexStableMethodParams<"thread/unsubscribe">;
  return params;
}

export function turnStartParams(options: {
  input: string | UserInput[];
  threadId: string;
} & Omit<TurnStartParams, "input" | "threadId">): TurnStartParams {
  const request = {
    ...options,
    input: normalizeUserInput(options.input),
  } satisfies GeneratedCodexStableMethodParams<"turn/start">;
  return request;
}

export function turnSteerParams(options: {
  expectedTurnId: string;
  input: string | UserInput[];
  threadId: string;
} & Omit<TurnSteerParams, "input" | "threadId" | "expectedTurnId">): TurnSteerParams {
  const request = {
    ...options,
    input: normalizeUserInput(options.input),
  } satisfies GeneratedCodexStableMethodParams<"turn/steer">;
  return request;
}

export function skillInput(name: string, path: AgentSkillPath): UserInput {
  return { name, path, type: "skill" } satisfies UserInput;
}

export function mentionInput(name: string, path: AgentMentionPath): UserInput {
  return { name, path, type: "mention" } satisfies UserInput;
}

export function localImageInput(path: AgentResourcePath): UserInput {
  return { path, type: "localImage" } satisfies UserInput;
}

export function imageInput(url: string): UserInput {
  return { type: "image", url } satisfies UserInput;
}

export function textInput(text: string): UserInput {
  return { text, text_elements: [], type: "text" } satisfies UserInput;
}

export function agentBrowserSkillInput(path: AgentSkillPath): UserInput {
  return skillInput("agent-browser", path);
}

export function agentBrowserVerificationInput({
  prompt,
  skillName = "agent-browser",
  skillPath,
}: AgentBrowserVerificationInputOptions): UserInput[] {
  return [textInput(prompt), skillInput(skillName, skillPath)];
}

export function turnInterruptParams(
  threadId: string,
  turnId: string,
): TurnInterruptParams {
  const params = { threadId, turnId } satisfies GeneratedCodexStableMethodParams<"turn/interrupt">;
  return params;
}

export function skillsListParams(params: SkillsListParams = {}): SkillsListParams {
  const request = { ...params } satisfies GeneratedCodexStableMethodParams<"skills/list">;
  return request;
}

export function skillsConfigWriteParams(
  params: SkillsConfigWriteParams,
): SkillsConfigWriteParams {
  const request = { ...params } satisfies GeneratedCodexStableMethodParams<"skills/config/write">;
  return request;
}

export function hooksListParams(params: HooksListParams = {}): HooksListParams {
  const request = { ...params } satisfies GeneratedCodexStableMethodParams<"hooks/list">;
  return request;
}

export function appsListParams(params: AppsListParams = {}): AppsListParams {
  const request = { ...params } satisfies GeneratedCodexStableMethodParams<"app/list">;
  return request;
}

function normalizeUserInput(input: string | UserInput[]): UserInput[] {
  return typeof input === "string" ? [textInput(input)] : input;
}
