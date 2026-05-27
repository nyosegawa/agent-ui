import { U as UserInput, G as GetAccountParams, L as LoginAccountParams, A as AppsListParams, C as CancelLoginAccountParams, H as HooksListParams, M as ModelListParams, S as SkillsConfigWriteParams, a as SkillsListParams, T as ThreadArchiveParams, b as ThreadCompactStartParams, c as ThreadForkParams, d as ThreadListParams, e as ThreadLoadedListParams, f as ThreadMetadataUpdateParams, g as ThreadReadParams, h as ThreadResumeParams, i as ThreadRollbackParams, j as ThreadSetNameParams, k as ThreadStartParams, l as ThreadUnarchiveParams, m as ThreadUnsubscribeParams, n as TurnInterruptParams, o as TurnStartParams, p as TurnSteerParams } from './TurnSteerParams-C1hpUYn_.js';
import { T as ThreadInjectItemsParams } from './ThreadInjectItemsParams-0F8pIWcm.js';

type CodexUserInput = UserInput;
interface AgentBrowserVerificationInputOptions {
    prompt: string;
    skillPath: string;
    skillName?: string;
}
declare const disabledProductMethods: readonly ["thread/turns/items/list"];
declare function accountReadParams(refreshToken?: boolean): GetAccountParams;
declare function deviceCodeLoginParams(): LoginAccountParams;
declare function chatgptLoginParams(codexStreamlinedLogin?: boolean): LoginAccountParams;
declare function apiKeyLoginParams(apiKey: string): LoginAccountParams;
declare function authTokensLoginParams(params: {
    accessToken: string;
    chatgptAccountId: string;
    chatgptPlanType?: string | null;
}): LoginAccountParams;
declare function cancelLoginParams(loginId: string): CancelLoginAccountParams;
declare function modelListParams(params?: ModelListParams): ModelListParams;
declare function threadListParams(params?: ThreadListParams): ThreadListParams;
declare function threadLoadedListParams(params?: ThreadLoadedListParams): ThreadLoadedListParams;
declare function threadReadParams(threadId: string, includeTurns?: boolean): ThreadReadParams;
declare function threadResumeParams(threadId: string, params?: Omit<ThreadResumeParams, "threadId">): ThreadResumeParams;
declare function threadStartParams(options?: ThreadStartParams): ThreadStartParams;
declare function threadForkParams(threadId: string, params?: Omit<ThreadForkParams, "threadId">): ThreadForkParams;
declare function threadArchiveParams(threadId: string): ThreadArchiveParams;
declare function threadUnarchiveParams(threadId: string): ThreadUnarchiveParams;
declare function threadSetNameParams(threadId: string, name: string): ThreadSetNameParams;
declare function threadMetadataUpdateParams(threadId: string, params?: Omit<ThreadMetadataUpdateParams, "threadId">): ThreadMetadataUpdateParams;
declare function threadCompactStartParams(threadId: string): ThreadCompactStartParams;
declare function threadRollbackParams(threadId: string, numTurns: number): ThreadRollbackParams;
declare function threadInjectItemsParams(threadId: string, items: ThreadInjectItemsParams["items"]): ThreadInjectItemsParams;
declare function threadUnsubscribeParams(threadId: string): ThreadUnsubscribeParams;
declare function turnStartParams(options: {
    input: string | UserInput[];
    threadId: string;
} & Omit<TurnStartParams, "input" | "threadId">): TurnStartParams;
declare function turnSteerParams(options: {
    expectedTurnId: string;
    input: string | UserInput[];
    threadId: string;
}): TurnSteerParams;
declare function skillInput(name: string, path: string): UserInput;
declare function mentionInput(name: string, path: string): UserInput;
declare function localImageInput(path: string): UserInput;
declare function imageInput(url: string): UserInput;
declare function textInput(text: string): UserInput;
declare function agentBrowserSkillInput(path: string): UserInput;
declare function agentBrowserVerificationInput({ prompt, skillName, skillPath, }: AgentBrowserVerificationInputOptions): UserInput[];
declare function turnInterruptParams(threadId: string, turnId: string): TurnInterruptParams;
declare function skillsListParams(params?: SkillsListParams): SkillsListParams;
declare function skillsConfigWriteParams(params: SkillsConfigWriteParams): SkillsConfigWriteParams;
declare function hooksListParams(params?: HooksListParams): HooksListParams;
declare function appsListParams(params?: AppsListParams): AppsListParams;

export { type AgentBrowserVerificationInputOptions, AppsListParams, CancelLoginAccountParams, type CodexUserInput, GetAccountParams, HooksListParams, LoginAccountParams, ModelListParams, SkillsConfigWriteParams, SkillsListParams, ThreadArchiveParams, ThreadCompactStartParams, ThreadForkParams, ThreadInjectItemsParams, ThreadListParams, ThreadLoadedListParams, ThreadMetadataUpdateParams, ThreadReadParams, ThreadResumeParams, ThreadRollbackParams, ThreadSetNameParams, ThreadStartParams, ThreadUnarchiveParams, ThreadUnsubscribeParams, TurnInterruptParams, TurnStartParams, TurnSteerParams, UserInput, accountReadParams, agentBrowserSkillInput, agentBrowserVerificationInput, apiKeyLoginParams, appsListParams, authTokensLoginParams, cancelLoginParams, chatgptLoginParams, deviceCodeLoginParams, disabledProductMethods, hooksListParams, imageInput, localImageInput, mentionInput, modelListParams, skillInput, skillsConfigWriteParams, skillsListParams, textInput, threadArchiveParams, threadCompactStartParams, threadForkParams, threadInjectItemsParams, threadListParams, threadLoadedListParams, threadMetadataUpdateParams, threadReadParams, threadResumeParams, threadRollbackParams, threadSetNameParams, threadStartParams, threadUnarchiveParams, threadUnsubscribeParams, turnInterruptParams, turnStartParams, turnSteerParams };
