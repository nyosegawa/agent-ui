import { RequestId, AgentError, AgentRequestOptions, AgentTransport } from '@nyosegawa/agent-ui-core';
import { AppsListParams, HooksListParams, ModelListParams, SkillsConfigWriteParams, SkillsListParams, ThreadForkParams, ThreadInjectItemsParams, ThreadListParams, ThreadLoadedListParams, ThreadMetadataUpdateParams, ThreadResumeParams, ThreadStartParams, TurnStartParams, TurnSteerParams } from './request-builders.js';
import { C as CodexInitializeOptions } from './protocol-eUwq-oME.js';
import { U as UserInput } from './method-params-s6VeRfnU.js';
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
    initialize(options: CodexInitializeOptions, requestOptions?: AgentRequestOptions): Promise<unknown>;
    initialized(): void;
}
interface CodexAccountClient {
    cancelLogin(loginId: string): Promise<unknown>;
    loginDeviceCode(): Promise<unknown>;
    logout(): Promise<unknown>;
    read(refreshToken?: boolean): Promise<unknown>;
    rateLimitsRead(): Promise<unknown>;
}
interface CodexAppsClient {
    list(params?: AppsListParams): Promise<unknown>;
}
interface CodexHooksClient {
    list(params?: HooksListParams): Promise<unknown>;
}
interface CodexSkillsClient {
    configWrite(params: SkillsConfigWriteParams): Promise<unknown>;
    list(params?: SkillsListParams): Promise<unknown>;
}
interface CodexThreadsClient {
    archive(threadId: string): Promise<unknown>;
    compactStart(threadId: string): Promise<unknown>;
    fork(threadId: string, params?: CodexThreadForkOptions): Promise<unknown>;
    injectItems(threadId: string, items: ThreadInjectItemsParams["items"]): Promise<unknown>;
    list(params?: ThreadListParams): Promise<unknown>;
    loadedList(params?: ThreadLoadedListParams): Promise<unknown>;
    metadataUpdate(threadId: string, params?: CodexThreadMetadataUpdateOptions): Promise<unknown>;
    read(threadId: string, includeTurns?: boolean): Promise<unknown>;
    resume(threadId: string, params?: CodexThreadResumeOptions): Promise<unknown>;
    rollback(threadId: string, numTurns: number): Promise<unknown>;
    setName(threadId: string, name: string): Promise<unknown>;
    start(params?: ThreadStartParams): Promise<unknown>;
    unarchive(threadId: string): Promise<unknown>;
    unsubscribe(threadId: string): Promise<unknown>;
}
interface CodexTurnsClient {
    interrupt(threadId: string, turnId: string): Promise<unknown>;
    start(params: CodexTurnStartOptions): Promise<unknown>;
    steer(params: CodexTurnSteerOptions): Promise<unknown>;
}
interface CodexApprovalsClient {
    reject(requestId: RequestId, error: AgentError): Promise<void>;
    respond(requestId: RequestId, result: unknown): Promise<void>;
}
interface CodexModelsClient {
    list(params?: ModelListParams): Promise<unknown>;
}
interface CodexClients {
    account: CodexAccountClient;
    apps: CodexAppsClient;
    approvals: CodexApprovalsClient;
    connection: CodexConnectionClient;
    hooks: CodexHooksClient;
    models: CodexModelsClient;
    requestExperimental<TParams = unknown, TResult = unknown>(method: string, params?: TParams): Promise<TResult>;
    skills: CodexSkillsClient;
    threads: CodexThreadsClient;
    turns: CodexTurnsClient;
}
declare function createCodexClients(transport: AgentTransport, options?: CodexClientsOptions): CodexClients;

export { type CodexAccountClient, type CodexApprovalsClient, type CodexAppsClient, type CodexClients, type CodexClientsOptions, type CodexConnectionClient, type CodexHooksClient, type CodexModelsClient, type CodexSkillsClient, type CodexThreadForkOptions, type CodexThreadMetadataUpdateOptions, type CodexThreadResumeOptions, type CodexThreadsClient, type CodexTurnStartOptions, type CodexTurnSteerOptions, type CodexTurnsClient, createCodexClients };
