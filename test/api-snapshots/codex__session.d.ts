import { AgentTransport } from '@nyosegawa/agent-ui-core';
import { AppsListParams, HooksListParams, SkillsConfigWriteParams, SkillsListParams, ThreadForkParams, ThreadInjectItemsParams, ThreadListParams, ThreadLoadedListParams, ThreadMetadataUpdateParams, ThreadResumeParams, ThreadStartParams, TurnStartParams, TurnSteerParams, ModelListParams } from './request-builders.js';
import { U as UserInput } from './method-params-BXDZnxMW.js';
import './InitializeParams-CDX1c2T9.js';

interface CodexSessionOptions {
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
interface CodexSession {
    account: {
        cancelLogin(loginId: string): Promise<unknown>;
        loginDeviceCode(): Promise<unknown>;
        logout(): Promise<unknown>;
        read(refreshToken?: boolean): Promise<unknown>;
        rateLimitsRead(): Promise<unknown>;
    };
    apps: {
        list(params?: AppsListParams): Promise<unknown>;
    };
    hooks: {
        list(params?: HooksListParams): Promise<unknown>;
    };
    requestExperimental<TParams = unknown, TResult = unknown>(method: string, params?: TParams): Promise<TResult>;
    skills: {
        configWrite(params: SkillsConfigWriteParams): Promise<unknown>;
        list(params?: SkillsListParams): Promise<unknown>;
    };
    thread: {
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
    };
    turn: {
        interrupt(threadId: string, turnId: string): Promise<unknown>;
        start(params: CodexTurnStartOptions): Promise<unknown>;
        steer(params: CodexTurnSteerOptions): Promise<unknown>;
    };
    models: {
        list(params?: ModelListParams): Promise<unknown>;
    };
}
declare function createCodexSession(transport: AgentTransport, options?: CodexSessionOptions): CodexSession;

export { type CodexSession, type CodexSessionOptions, type CodexThreadForkOptions, type CodexThreadMetadataUpdateOptions, type CodexThreadResumeOptions, type CodexTurnStartOptions, type CodexTurnSteerOptions, createCodexSession };
