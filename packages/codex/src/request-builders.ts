import type { UserInput } from "./generated/stable/v2";
import type { CodexStableMethodParams } from "./method-params";

export type { UserInput } from "./generated/stable/v2";
export type {
  CodexExperimentalMethod,
  CodexExperimentalMethodParams,
  CodexStableMethod,
  CodexStableMethodParams,
} from "./method-params";
export type {
  CodexExperimentalMethodResult,
  CodexStableMethodResult,
} from "./method-results";

export type AppsListParams = CodexStableMethodParams<"app/list">;
export type CancelLoginAccountParams =
  CodexStableMethodParams<"account/login/cancel">;
export type GetAccountParams = CodexStableMethodParams<"account/read">;
export type HooksListParams = CodexStableMethodParams<"hooks/list">;
export type LoginAccountParams = CodexStableMethodParams<"account/login/start">;
export type ModelListParams = CodexStableMethodParams<"model/list">;
export type SkillsConfigWriteParams =
  CodexStableMethodParams<"skills/config/write">;
export type SkillsListParams = CodexStableMethodParams<"skills/list">;
export type ThreadArchiveParams = CodexStableMethodParams<"thread/archive">;
export type ThreadCompactStartParams =
  CodexStableMethodParams<"thread/compact/start">;
export type ThreadForkParams = CodexStableMethodParams<"thread/fork">;
export type ThreadInjectItemsParams =
  CodexStableMethodParams<"thread/inject_items">;
export type ThreadListParams = CodexStableMethodParams<"thread/list">;
export type ThreadLoadedListParams =
  CodexStableMethodParams<"thread/loaded/list">;
export type ThreadMetadataUpdateParams =
  CodexStableMethodParams<"thread/metadata/update">;
export type ThreadReadParams = CodexStableMethodParams<"thread/read">;
export type ThreadResumeParams = CodexStableMethodParams<"thread/resume">;
export type ThreadRollbackParams = CodexStableMethodParams<"thread/rollback">;
export type ThreadSetNameParams = CodexStableMethodParams<"thread/name/set">;
export type ThreadStartParams = CodexStableMethodParams<"thread/start">;
export type ThreadUnarchiveParams = CodexStableMethodParams<"thread/unarchive">;
export type ThreadUnsubscribeParams =
  CodexStableMethodParams<"thread/unsubscribe">;
export type TurnInterruptParams = CodexStableMethodParams<"turn/interrupt">;
export type TurnStartParams = CodexStableMethodParams<"turn/start">;
export type TurnSteerParams = CodexStableMethodParams<"turn/steer">;

export type CodexUserInput = UserInput;

export interface AgentBrowserVerificationInputOptions {
  prompt: string;
  skillPath: string;
  skillName?: string;
}

export const disabledProductMethods = ["thread/turns/items/list"] as const;

export function accountReadParams(refreshToken = false): GetAccountParams {
  return { refreshToken } satisfies GetAccountParams;
}

export function deviceCodeLoginParams(): LoginAccountParams {
  return { type: "chatgptDeviceCode" } satisfies LoginAccountParams;
}

export function chatgptLoginParams(codexStreamlinedLogin?: boolean): LoginAccountParams {
  return {
    type: "chatgpt",
    ...(codexStreamlinedLogin === undefined ? {} : { codexStreamlinedLogin }),
  } satisfies LoginAccountParams;
}

export function apiKeyLoginParams(apiKey: string): LoginAccountParams {
  return { apiKey, type: "apiKey" } satisfies LoginAccountParams;
}

export function authTokensLoginParams(params: {
  accessToken: string;
  chatgptAccountId: string;
  chatgptPlanType?: string | null;
}): LoginAccountParams {
  return { type: "chatgptAuthTokens", ...params } satisfies LoginAccountParams;
}

export function cancelLoginParams(loginId: string): CancelLoginAccountParams {
  return { loginId } satisfies CancelLoginAccountParams;
}

export function modelListParams(params: ModelListParams = {}): ModelListParams {
  return { ...params } satisfies ModelListParams;
}

export function threadListParams(params: ThreadListParams = {}): ThreadListParams {
  return {
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
  } satisfies ThreadListParams;
}

export function threadLoadedListParams(
  params: ThreadLoadedListParams = {},
): ThreadLoadedListParams {
  return { ...params } satisfies ThreadLoadedListParams;
}

export function threadReadParams(
  threadId: string,
  includeTurns = true,
): ThreadReadParams {
  return { includeTurns, threadId } satisfies ThreadReadParams;
}

export function threadResumeParams(
  threadId: string,
  params: Omit<ThreadResumeParams, "threadId"> = {},
): ThreadResumeParams {
  return { ...params, threadId } satisfies ThreadResumeParams;
}

export function threadStartParams(options: ThreadStartParams = {}): ThreadStartParams {
  return { ...options } satisfies ThreadStartParams;
}

export function threadForkParams(
  threadId: string,
  params: Omit<ThreadForkParams, "threadId"> = {},
): ThreadForkParams {
  return { ...params, threadId } satisfies ThreadForkParams;
}

export function threadArchiveParams(threadId: string): ThreadArchiveParams {
  return { threadId } satisfies ThreadArchiveParams;
}

export function threadUnarchiveParams(threadId: string): ThreadUnarchiveParams {
  return { threadId } satisfies ThreadUnarchiveParams;
}

export function threadSetNameParams(
  threadId: string,
  name: string,
): ThreadSetNameParams {
  return { name, threadId } satisfies ThreadSetNameParams;
}

export function threadMetadataUpdateParams(
  threadId: string,
  params: Omit<ThreadMetadataUpdateParams, "threadId"> = {},
): ThreadMetadataUpdateParams {
  return { ...params, threadId } satisfies ThreadMetadataUpdateParams;
}

export function threadCompactStartParams(threadId: string): ThreadCompactStartParams {
  return { threadId } satisfies ThreadCompactStartParams;
}

export function threadRollbackParams(
  threadId: string,
  numTurns: number,
): ThreadRollbackParams {
  return { numTurns, threadId } satisfies ThreadRollbackParams;
}

export function threadInjectItemsParams(
  threadId: string,
  items: ThreadInjectItemsParams["items"],
): ThreadInjectItemsParams {
  return { items, threadId } satisfies ThreadInjectItemsParams;
}

export function threadUnsubscribeParams(threadId: string): ThreadUnsubscribeParams {
  return { threadId } satisfies ThreadUnsubscribeParams;
}

export function turnStartParams(options: {
  input: string | UserInput[];
  threadId: string;
} & Omit<TurnStartParams, "input" | "threadId">): TurnStartParams {
  return {
    ...options,
    input: normalizeUserInput(options.input),
  } satisfies TurnStartParams;
}

export function turnSteerParams(options: {
  expectedTurnId: string;
  input: string | UserInput[];
  threadId: string;
}): TurnSteerParams {
  return {
    expectedTurnId: options.expectedTurnId,
    input: normalizeUserInput(options.input),
    threadId: options.threadId,
  } satisfies TurnSteerParams;
}

export function skillInput(name: string, path: string): UserInput {
  return { name, path, type: "skill" } satisfies UserInput;
}

export function mentionInput(name: string, path: string): UserInput {
  return { name, path, type: "mention" } satisfies UserInput;
}

export function localImageInput(path: string): UserInput {
  return { path, type: "localImage" } satisfies UserInput;
}

export function imageInput(url: string): UserInput {
  return { type: "image", url } satisfies UserInput;
}

export function textInput(text: string): UserInput {
  return { text, text_elements: [], type: "text" } satisfies UserInput;
}

export function agentBrowserSkillInput(path: string): UserInput {
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
  return { threadId, turnId } satisfies TurnInterruptParams;
}

export function skillsListParams(params: SkillsListParams = {}): SkillsListParams {
  return { ...params } satisfies SkillsListParams;
}

export function skillsConfigWriteParams(
  params: SkillsConfigWriteParams,
): SkillsConfigWriteParams {
  return { ...params } satisfies SkillsConfigWriteParams;
}

export function hooksListParams(params: HooksListParams = {}): HooksListParams {
  return { ...params } satisfies HooksListParams;
}

export function appsListParams(params: AppsListParams = {}): AppsListParams {
  return { ...params } satisfies AppsListParams;
}

function normalizeUserInput(input: string | UserInput[]): UserInput[] {
  return typeof input === "string" ? [textInput(input)] : input;
}
