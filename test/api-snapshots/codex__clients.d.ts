import { RequestId, AgentError, AgentRequestOptions, AgentTransport } from '@nyosegawa/agent-ui-core';
import { CodexStableMethodResult, AppsListParams, HooksListParams, ModelListParams, CodexExperimentalMethodResult, SkillsConfigWriteParams, SkillsListParams, ThreadForkParams, ThreadInjectItemsParams, ThreadListParams, ThreadLoadedListParams, ThreadMetadataUpdateParams, ThreadResumeParams, ThreadStartParams, TurnStartParams, TurnSteerParams } from './request-builders.js';
import { C as CodexInitializeOptions, E as ExperimentalAvailableMethod } from './protocol-iDYFX3vA.js';
import { C as CodexExperimentalMethodParams, U as UserInput } from './method-params-Cp7iY5rD.js';
import './InitializeParams-CDX1c2T9.js';

interface CodexClientsOptions {
    experimental?: boolean;
}
type CodexThreadForkOptions = Omit<ThreadForkParams, "threadId">;
type CodexThreadMetadataUpdateOptions = Omit<ThreadMetadataUpdateParams, "threadId">;
type CodexThreadResumeOptions = Omit<ThreadResumeParams, "threadId">;
type CodexTurnStartOptions = {
    input: string | UserInput[];
    threadId: string;
} & Omit<TurnStartParams, "input" | "threadId">;
type CodexTurnSteerOptions = {
    input: string | UserInput[];
} & Omit<TurnSteerParams, "input">;
interface CodexConnectionClient {
    initialize(options: CodexInitializeOptions, requestOptions?: AgentRequestOptions): Promise<CodexStableMethodResult<"initialize">>;
    initialized(): void;
}
interface CodexAccountClient {
    cancelLogin(loginId: string): Promise<CodexStableMethodResult<"account/login/cancel">>;
    loginDeviceCode(): Promise<CodexStableMethodResult<"account/login/start">>;
    logout(): Promise<CodexStableMethodResult<"account/logout">>;
    read(refreshToken?: boolean): Promise<CodexStableMethodResult<"account/read">>;
    rateLimitsRead(): Promise<CodexStableMethodResult<"account/rateLimits/read">>;
}
interface CodexAppsClient {
    list(params?: AppsListParams): Promise<CodexStableMethodResult<"app/list">>;
}
interface CodexHooksClient {
    list(params?: HooksListParams): Promise<CodexStableMethodResult<"hooks/list">>;
}
interface CodexSkillsClient {
    configWrite(params: SkillsConfigWriteParams): Promise<CodexStableMethodResult<"skills/config/write">>;
    list(params?: SkillsListParams): Promise<CodexStableMethodResult<"skills/list">>;
}
interface CodexThreadsClient {
    archive(threadId: string): Promise<CodexStableMethodResult<"thread/archive">>;
    compactStart(threadId: string): Promise<CodexStableMethodResult<"thread/compact/start">>;
    fork(threadId: string, params?: CodexThreadForkOptions): Promise<CodexStableMethodResult<"thread/fork">>;
    injectItems(threadId: string, items: ThreadInjectItemsParams["items"]): Promise<CodexStableMethodResult<"thread/inject_items">>;
    list(params?: ThreadListParams): Promise<CodexStableMethodResult<"thread/list">>;
    loadedList(params?: ThreadLoadedListParams): Promise<CodexStableMethodResult<"thread/loaded/list">>;
    metadataUpdate(threadId: string, params?: CodexThreadMetadataUpdateOptions): Promise<CodexStableMethodResult<"thread/metadata/update">>;
    read(threadId: string, includeTurns?: boolean): Promise<CodexStableMethodResult<"thread/read">>;
    resume(threadId: string, params?: CodexThreadResumeOptions): Promise<CodexStableMethodResult<"thread/resume">>;
    rollback(threadId: string, numTurns: number): Promise<CodexStableMethodResult<"thread/rollback">>;
    setName(threadId: string, name: string): Promise<CodexStableMethodResult<"thread/name/set">>;
    start(params?: ThreadStartParams): Promise<CodexStableMethodResult<"thread/start">>;
    unarchive(threadId: string): Promise<CodexStableMethodResult<"thread/unarchive">>;
    unsubscribe(threadId: string): Promise<CodexStableMethodResult<"thread/unsubscribe">>;
}
interface CodexTurnsClient {
    interrupt(threadId: string, turnId: string): Promise<CodexStableMethodResult<"turn/interrupt">>;
    start(params: CodexTurnStartOptions): Promise<CodexStableMethodResult<"turn/start">>;
    steer(params: CodexTurnSteerOptions): Promise<CodexStableMethodResult<"turn/steer">>;
}
interface CodexApprovalsClient {
    reject(requestId: RequestId, error: AgentError): Promise<void>;
    respond(requestId: RequestId, result: unknown): Promise<void>;
}
interface CodexModelsClient {
    list(params?: ModelListParams): Promise<CodexStableMethodResult<"model/list">>;
}
interface CodexClients {
    account: CodexAccountClient;
    apps: CodexAppsClient;
    approvals: CodexApprovalsClient;
    connection: CodexConnectionClient;
    hooks: CodexHooksClient;
    models: CodexModelsClient;
    requestExperimental<TMethod extends ExperimentalAvailableMethod>(method: TMethod, params: CodexExperimentalMethodParams<TMethod>): Promise<CodexExperimentalMethodResult<TMethod>>;
    requestRaw<TParams = unknown, TResult = unknown>(method: string, params?: TParams): Promise<TResult>;
    skills: CodexSkillsClient;
    threads: CodexThreadsClient;
    turns: CodexTurnsClient;
}
declare function createCodexClients(transport: AgentTransport, options?: CodexClientsOptions): CodexClients;

export { type CodexAccountClient, type CodexApprovalsClient, type CodexAppsClient, type CodexClients, type CodexClientsOptions, type CodexConnectionClient, type CodexHooksClient, type CodexModelsClient, type CodexSkillsClient, type CodexThreadForkOptions, type CodexThreadMetadataUpdateOptions, type CodexThreadResumeOptions, type CodexThreadsClient, type CodexTurnStartOptions, type CodexTurnSteerOptions, type CodexTurnsClient, createCodexClients };
