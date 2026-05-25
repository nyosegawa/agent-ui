import { RequestId, AgentError, AgentApp, AgentEvent, AgentModel, AgentTransport, AgentTransportEvent } from '@nyosegawa/agent-ui-core';
import { C as CodexInitializeOptions } from './websocket-hif1sM_J.js';
export { a as CODEX_PROTOCOL_COMMIT, b as CODEX_PROTOCOL_GENERATED_AT, c as CodexCapabilityMetadata, d as CodexCapabilityStatus, e as CodexClientInfo, f as CodexInitializeCapabilities, g as CodexWebSocketReconnectOptions, h as CodexWebSocketTransportOptions, E as ExperimentalAvailableMethod, H as HostOnlyMethod, S as StableAvailableMethod, i as StableNotificationMethod, j as StableProductizedMethod, k as StableServerRequestMethod, l as codexCapabilityMetadata, m as codexInitializeParams, n as createCodexWebSocketTransport, o as experimentalAvailableMethods, p as hostOnlyMethods, s as stableAvailableMethods, q as stableClientMethods, r as stableNotificationMethods, t as stableProductizedMethods, u as stableServerRequestMethods } from './websocket-hif1sM_J.js';
export { AgentBrowserVerificationInputOptions, CodexUserInput, accountReadParams, agentBrowserSkillInput, agentBrowserVerificationInput, apiKeyLoginParams, appsListParams, authTokensLoginParams, cancelLoginParams, chatgptLoginParams, deviceCodeLoginParams, disabledProductMethods, hooksListParams, imageInput, localImageInput, mentionInput, modelListParams, skillInput, skillsConfigWriteParams, skillsListParams, textInput, threadArchiveParams, threadCompactStartParams, threadForkParams, threadInjectItemsParams, threadListParams, threadLoadedListParams, threadMetadataUpdateParams, threadReadParams, threadResumeParams, threadRollbackParams, threadSetNameParams, threadStartParams, threadUnarchiveParams, threadUnsubscribeParams, turnInterruptParams, turnStartParams, turnSteerParams } from './request-builders.js';
import { A as AppsListParams, H as HooksListParams, S as SkillsConfigWriteParams, a as SkillsListParams, c as ThreadForkParams, d as ThreadInjectItemsParams, e as ThreadListParams, f as ThreadLoadedListParams, g as ThreadMetadataUpdateParams, i as ThreadResumeParams, l as ThreadStartParams, U as UserInput, p as TurnStartParams, M as ModelListParams } from './TurnSteerParams-CYQ33vq2.js';
export { C as CancelLoginAccountParams, G as GetAccountParams, L as LoginAccountParams, T as ThreadArchiveParams, b as ThreadCompactStartParams, h as ThreadReadParams, j as ThreadRollbackParams, k as ThreadSetNameParams, m as ThreadUnarchiveParams, n as ThreadUnsubscribeParams, o as TurnInterruptParams, q as TurnSteerParams } from './TurnSteerParams-CYQ33vq2.js';
import { Writable, Readable } from 'node:stream';
import './InitializeParams-CDX1c2T9.js';

interface JsonRpcRequest {
    id: RequestId;
    method: string;
    params?: unknown;
    trace?: unknown;
}
interface JsonRpcNotification {
    method: string;
    params?: unknown;
}
interface JsonRpcSuccess {
    id: RequestId;
    result: unknown;
}
interface JsonRpcFailure {
    id: RequestId;
    error: AgentError;
}
type JsonRpcMessage = JsonRpcRequest | JsonRpcNotification | JsonRpcSuccess | JsonRpcFailure;
declare function encodeJsonRpcLine(message: JsonRpcMessage): string;
declare function parseJsonRpcLine(line: string): JsonRpcMessage;
declare function isJsonRpcResponse(message: unknown): message is JsonRpcSuccess | JsonRpcFailure;
declare function isJsonRpcRequest(message: unknown): message is JsonRpcRequest;
declare function isJsonRpcNotification(message: unknown): message is JsonRpcNotification;
declare function jsonRpcErrorObject(error: {
    code?: number;
    data?: unknown;
    message: string;
}): Error & {
    code?: number;
    data?: unknown;
};
declare function jsonRpcErrorPayload(error: unknown): AgentError;

interface MethodMessage {
    id?: string | number;
    method: string;
    params?: unknown;
}
declare function normalizeCodexServerMessage(message: MethodMessage): AgentEvent[];
declare function normalizeApps(raw: unknown): AgentApp[];
declare function normalizeModelListResponse(response: unknown): AgentModel[];

interface CodexSessionOptions {
    experimental?: boolean;
}
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
        fork(threadId: string, params?: Omit<ThreadForkParams, "threadId">): Promise<unknown>;
        injectItems(threadId: string, items: ThreadInjectItemsParams["items"]): Promise<unknown>;
        list(params?: ThreadListParams): Promise<unknown>;
        loadedList(params?: ThreadLoadedListParams): Promise<unknown>;
        metadataUpdate(threadId: string, params?: Omit<ThreadMetadataUpdateParams, "threadId">): Promise<unknown>;
        read(threadId: string, includeTurns?: boolean): Promise<unknown>;
        resume(threadId: string, params?: Omit<ThreadResumeParams, "threadId">): Promise<unknown>;
        rollback(threadId: string, numTurns: number): Promise<unknown>;
        setName(threadId: string, name: string): Promise<unknown>;
        start(params?: ThreadStartParams): Promise<unknown>;
        unarchive(threadId: string): Promise<unknown>;
        unsubscribe(threadId: string): Promise<unknown>;
    };
    turn: {
        interrupt(threadId: string, turnId: string): Promise<unknown>;
        start(params: {
            input: string | UserInput[];
            threadId: string;
        } & Omit<TurnStartParams, "input" | "threadId">): Promise<unknown>;
        steer(params: {
            expectedTurnId: string;
            input: string | UserInput[];
            threadId: string;
        }): Promise<unknown>;
    };
    models: {
        list(params?: ModelListParams): Promise<unknown>;
    };
}
declare function createCodexSession(transport: AgentTransport, options?: CodexSessionOptions): CodexSession;

interface CodexStdioTransportOptions {
    stdin: Writable;
    stdout: Readable;
    stderr?: Readable;
    initialize?: CodexInitializeOptions;
    backpressure?: {
        baseDelayMs?: number;
        maxRetries?: number;
    };
}
declare function createCodexStdioTransport(options: CodexStdioTransportOptions): AgentTransport;
declare function isBackpressureRetrySafeMethod(method: string): boolean;

interface CodexSdkLikeClient {
    readonly events?: AsyncIterable<AgentTransportEvent | AgentEvent | unknown>;
    close?: () => Promise<void> | void;
    connect?: () => Promise<void> | void;
    notify?: (method: string, params?: unknown) => void;
    reject?: (requestId: RequestId, error: AgentError) => Promise<void> | void;
    request: <TParams = unknown, TResult = unknown>(method: string, params?: TParams) => Promise<TResult> | TResult;
    respond?: (requestId: RequestId, result: unknown) => Promise<void> | void;
}
declare function createCodexSdkTransportAdapter(client: CodexSdkLikeClient): AgentTransport;

interface DeviceCodeLoginStart {
    loginId?: string;
    userCode?: string;
    verificationUrl?: string;
    expiresIn?: number;
    raw: unknown;
}
declare function startDeviceCodeLogin(transport: AgentTransport): Promise<DeviceCodeLoginStart>;
declare function cancelDeviceCodeLogin(transport: AgentTransport, loginId: string): Promise<void>;

export { AppsListParams, CodexInitializeOptions, type CodexSdkLikeClient, type CodexSession, type CodexSessionOptions, type CodexStdioTransportOptions, type DeviceCodeLoginStart, HooksListParams, type JsonRpcFailure, type JsonRpcMessage, type JsonRpcNotification, type JsonRpcRequest, type JsonRpcSuccess, ModelListParams, SkillsConfigWriteParams, SkillsListParams, ThreadForkParams, ThreadInjectItemsParams, ThreadListParams, ThreadLoadedListParams, ThreadMetadataUpdateParams, ThreadResumeParams, ThreadStartParams, TurnStartParams, UserInput, cancelDeviceCodeLogin, createCodexSdkTransportAdapter, createCodexSession, createCodexStdioTransport, encodeJsonRpcLine, isBackpressureRetrySafeMethod, isJsonRpcNotification, isJsonRpcRequest, isJsonRpcResponse, jsonRpcErrorObject, jsonRpcErrorPayload, normalizeApps, normalizeCodexServerMessage, normalizeModelListResponse, parseJsonRpcLine, startDeviceCodeLogin };
