import { AgentTransport } from '@nyosegawa/agent-ui-core';
import { T as ThreadInjectItemsParams } from './ThreadInjectItemsParams-0F8pIWcm.js';

interface CodexSessionOptions {
    experimental?: boolean;
}
type CodexRequestOptions = object;
type CodexSessionUserInput = {
    type: string;
};
interface CodexSession {
    account: {
        cancelLogin(loginId: string): Promise<unknown>;
        loginDeviceCode(): Promise<unknown>;
        logout(): Promise<unknown>;
        read(refreshToken?: boolean): Promise<unknown>;
        rateLimitsRead(): Promise<unknown>;
    };
    apps: {
        list(params?: CodexRequestOptions): Promise<unknown>;
    };
    hooks: {
        list(params?: CodexRequestOptions): Promise<unknown>;
    };
    requestExperimental<TParams = unknown, TResult = unknown>(method: string, params?: TParams): Promise<TResult>;
    skills: {
        configWrite(params: CodexRequestOptions): Promise<unknown>;
        list(params?: CodexRequestOptions): Promise<unknown>;
    };
    thread: {
        archive(threadId: string): Promise<unknown>;
        compactStart(threadId: string): Promise<unknown>;
        fork(threadId: string, params?: CodexRequestOptions): Promise<unknown>;
        injectItems(threadId: string, items: ThreadInjectItemsParams["items"]): Promise<unknown>;
        list(params?: CodexRequestOptions): Promise<unknown>;
        loadedList(params?: CodexRequestOptions): Promise<unknown>;
        metadataUpdate(threadId: string, params?: CodexRequestOptions): Promise<unknown>;
        read(threadId: string, includeTurns?: boolean): Promise<unknown>;
        resume(threadId: string, params?: CodexRequestOptions): Promise<unknown>;
        rollback(threadId: string, numTurns: number): Promise<unknown>;
        setName(threadId: string, name: string): Promise<unknown>;
        start(params?: CodexRequestOptions): Promise<unknown>;
        unarchive(threadId: string): Promise<unknown>;
        unsubscribe(threadId: string): Promise<unknown>;
    };
    turn: {
        interrupt(threadId: string, turnId: string): Promise<unknown>;
        start(params: {
            input: string | CodexSessionUserInput[];
            threadId: string;
            [key: string]: unknown;
        }): Promise<unknown>;
        steer(params: {
            expectedTurnId: string;
            input: string | CodexSessionUserInput[];
            threadId: string;
        }): Promise<unknown>;
    };
    models: {
        list(params?: CodexRequestOptions): Promise<unknown>;
    };
}
declare function createCodexSession(transport: AgentTransport, options?: CodexSessionOptions): CodexSession;

export { type CodexRequestOptions, type CodexSession, type CodexSessionOptions, type CodexSessionUserInput, createCodexSession };
