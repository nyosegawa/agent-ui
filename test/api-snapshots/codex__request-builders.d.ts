import { A as AskForApproval, a as ApprovalsReviewer, J as JsonValue, P as Personality, S as SandboxMode, T as ThreadSource, b as SortDirection, c as ThreadSortKey, d as ThreadSourceKind, e as ThreadStartSource, R as ReasoningEffort, f as ReasoningSummary, U as UserInput, g as TextElement } from './UserInput-<chunk>.js';

type AgentLocalPath = string;
type AgentWorkingDirectory = AgentLocalPath;
type AgentResourcePath = AgentLocalPath;
type AgentSkillPath = AgentLocalPath;
type AgentMentionPath = AgentLocalPath;

interface AppsListParams {
    cursor?: string | null;
    forceRefetch?: boolean;
    limit?: number | null;
    threadId?: string | null;
}
interface CancelLoginAccountParams {
    loginId: string;
}
interface GetAccountParams {
    refreshToken: boolean;
}
interface HooksListParams {
    cwds?: AgentWorkingDirectory[];
}
type LoginAccountParams = {
    type: "chatgptDeviceCode";
} | {
    type: "chatgpt";
    codexStreamlinedLogin?: boolean;
} | {
    type: "apiKey";
    apiKey: string;
} | {
    type: "chatgptAuthTokens";
    accessToken: string;
    chatgptAccountId: string;
    chatgptPlanType?: string | null;
};
interface ModelListParams {
    cursor?: string | null;
    includeHidden?: boolean | null;
    limit?: number | null;
}
interface SkillsConfigWriteParams {
    enabled: boolean;
    name?: string | null;
    path?: AgentSkillPath | null;
}
interface SkillsListParams {
    cwds?: AgentWorkingDirectory[];
    forceReload?: boolean;
}
interface ThreadArchiveParams {
    threadId: string;
}
interface ThreadCompactStartParams {
    threadId: string;
}
interface ThreadForkParams extends ThreadConfigOverrides {
    ephemeral?: boolean;
    threadId: string;
    threadSource?: ThreadSource | null;
}
interface ThreadInjectItemsParams {
    items: JsonValue[];
    threadId: string;
}
interface ThreadListParams {
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
interface ThreadLoadedListParams {
    cursor?: string | null;
    limit?: number | null;
}
interface ThreadMetadataUpdateParams {
    gitInfo?: {
        branch?: string | null;
        commit?: string | null;
        repository?: string | null;
    } | null;
    threadId: string;
}
interface ThreadReadParams {
    includeTurns: boolean;
    threadId: string;
}
interface ThreadResumeParams extends ThreadConfigOverrides {
    threadId: string;
}
interface ThreadRollbackParams {
    numTurns: number;
    threadId: string;
}
interface ThreadSetNameParams {
    name: string;
    threadId: string;
}
interface ThreadStartParams extends ThreadConfigOverrides {
    ephemeral?: boolean | null;
    serviceName?: string | null;
    sessionStartSource?: ThreadStartSource | null;
    threadSource?: ThreadSource | null;
}
interface ThreadUnarchiveParams {
    threadId: string;
}
interface ThreadUnsubscribeParams {
    threadId: string;
}
interface TurnInterruptParams {
    threadId: string;
    turnId: string;
}
interface TurnStartParams extends TurnConfigOverrides {
    clientUserMessageId?: string | null;
    input: UserInput[];
    threadId: string;
}
interface TurnSteerParams {
    clientUserMessageId?: string | null;
    expectedTurnId: string;
    input: UserInput[];
    threadId: string;
}
type AgentSandboxPolicy = {
    type: "dangerFullAccess";
} | {
    networkAccess: boolean;
    type: "readOnly";
} | {
    networkAccess: "restricted" | "enabled";
    type: "externalSandbox";
} | {
    excludeSlashTmp: boolean;
    excludeTmpdirEnvVar: boolean;
    networkAccess: boolean;
    type: "workspaceWrite";
    writableRoots: AgentLocalPath[];
};
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
    sandboxPolicy?: AgentSandboxPolicy | null;
    serviceTier?: string | null;
    summary?: ReasoningSummary | null;
}
type CodexUserInput = UserInput;
interface AgentBrowserVerificationInputOptions {
    prompt: string;
    skillPath: AgentSkillPath;
    skillName?: string;
}
declare const disabledProductMethods: readonly [];
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
} & Omit<TurnSteerParams, "input" | "threadId" | "expectedTurnId">): TurnSteerParams;
declare function skillInput(name: string, path: AgentSkillPath): UserInput;
declare function mentionInput(name: string, path: AgentMentionPath): UserInput;
declare function localImageInput(path: AgentResourcePath): UserInput;
declare function imageInput(url: string): UserInput;
interface TextInputOptions {
    textElements?: TextElement[];
}
declare function textInput(text: string, options?: TextInputOptions): UserInput;
declare function agentBrowserSkillInput(path: AgentSkillPath): UserInput;
declare function agentBrowserVerificationInput({ prompt, skillName, skillPath, }: AgentBrowserVerificationInputOptions): UserInput[];
declare function turnInterruptParams(threadId: string, turnId: string): TurnInterruptParams;
declare function skillsListParams(params?: SkillsListParams): SkillsListParams;
declare function skillsConfigWriteParams(params: SkillsConfigWriteParams): SkillsConfigWriteParams;
declare function hooksListParams(params?: HooksListParams): HooksListParams;
declare function appsListParams(params?: AppsListParams): AppsListParams;

export { type AgentBrowserVerificationInputOptions, type AgentLocalPath, type AgentMentionPath, type AgentResourcePath, type AgentSandboxPolicy, type AgentSkillPath, type AgentWorkingDirectory, type AppsListParams, type CancelLoginAccountParams, type CodexUserInput, type GetAccountParams, type HooksListParams, type LoginAccountParams, type ModelListParams, type SkillsConfigWriteParams, type SkillsListParams, type TextInputOptions, type ThreadArchiveParams, type ThreadCompactStartParams, type ThreadForkParams, type ThreadInjectItemsParams, type ThreadListParams, type ThreadLoadedListParams, type ThreadMetadataUpdateParams, type ThreadReadParams, type ThreadResumeParams, type ThreadRollbackParams, type ThreadSetNameParams, type ThreadStartParams, type ThreadUnarchiveParams, type ThreadUnsubscribeParams, type TurnInterruptParams, type TurnStartParams, type TurnSteerParams, UserInput, accountReadParams, agentBrowserSkillInput, agentBrowserVerificationInput, apiKeyLoginParams, appsListParams, authTokensLoginParams, cancelLoginParams, chatgptLoginParams, deviceCodeLoginParams, disabledProductMethods, hooksListParams, imageInput, localImageInput, mentionInput, modelListParams, skillInput, skillsConfigWriteParams, skillsListParams, textInput, threadArchiveParams, threadCompactStartParams, threadForkParams, threadInjectItemsParams, threadListParams, threadLoadedListParams, threadMetadataUpdateParams, threadReadParams, threadResumeParams, threadRollbackParams, threadSetNameParams, threadStartParams, threadUnarchiveParams, threadUnsubscribeParams, turnInterruptParams, turnStartParams, turnSteerParams };
