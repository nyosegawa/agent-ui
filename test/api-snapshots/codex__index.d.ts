export { CodexAccountClient, CodexApprovalsClient, CodexAppsClient, CodexClients, CodexClientsOptions, CodexConnectionClient, CodexHooksClient, CodexModelsClient, CodexSkillsClient, CodexThreadForkOptions, CodexThreadMetadataUpdateOptions, CodexThreadResumeOptions, CodexThreadsClient, CodexTurnStartOptions, CodexTurnSteerOptions, CodexTurnsClient, createCodexClients } from './clients.js';
import { RequestId, AgentError, AgentTransport, AgentTransportEvent, AgentEvent } from '@nyosegawa/agent-ui-core';
export { a as CodexExperimentalMethod, C as CodexExperimentalMethodParams, b as CodexStableMethod, c as CodexStableMethodParams } from './method-params-<chunk>.js';
export { CodexExperimentalMethodResult, CodexStableMethodResult } from './request-<chunk>.js';
export { normalizeApps, normalizeAppsListResponse, normalizeCodexServerMessage, normalizeModelListResponse, normalizeThreadReadResponse, normalizeThreadResumeResponse, normalizeThreadTurnsListResponse, normalizeTurnsPage } from './normalizer.js';
import { C as CodexInitializeOptions } from './protocol-<chunk>.js';
export { a as CODEX_PROTOCOL_COMMIT, b as CODEX_PROTOCOL_GENERATED_AT, c as CodexCapabilityMetadata, d as CodexCapabilityStatus, e as CodexClientInfo, f as CodexInitializeCapabilities, E as ExperimentalAvailableMethod, g as ExperimentalUnsupportedMethod, H as HostOnlyMethod, S as StableAvailableMethod, h as StableNotificationMethod, i as StableProductizedMethod, j as StableServerRequestMethod, k as assertCodexExperimentalMethod, l as assertCodexProductizedMethod, m as codexCapabilityMetadata, n as codexInitializeParams, o as experimentalAvailableMethods, p as experimentalUnsupportedMethods, q as getCodexCapabilityStatus, r as hostOnlyMethods, s as isExperimentalAvailableMethod, t as isExperimentalUnsupportedMethod, u as isHostOnlyMethod, v as isStableProductizedMethod, w as stableAvailableMethods, x as stableClientMethods, y as stableNotificationMethods, z as stableProductizedMethods, A as stableServerRequestMethods } from './protocol-<chunk>.js';
export { CodexSession, CodexSessionOptions, createCodexSession } from './session.js';
import { Writable, Readable } from 'node:stream';
export { CodexWebSocketReconnectOptions, CodexWebSocketTransportOptions, createCodexWebSocketTransport } from './websocket.js';
import './InitializeParams-<chunk>.js';

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

declare function isBackpressureRetrySafeMethod(method: string): boolean;

interface CodexStdioTransportOptions {
    stdin: Writable;
    stdout: Readable;
    stderr?: Readable;
    initialize?: CodexInitializeOptions;
    backpressure?: {
        baseDelayMs?: number;
        maxRetries?: number;
        maxWriteQueueBytes?: number;
    };
}
declare function createCodexStdioTransport(options: CodexStdioTransportOptions): AgentTransport;

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

export { CodexInitializeOptions, type CodexSdkLikeClient, type CodexStdioTransportOptions, type DeviceCodeLoginStart, type JsonRpcFailure, type JsonRpcMessage, type JsonRpcNotification, type JsonRpcRequest, type JsonRpcSuccess, cancelDeviceCodeLogin, createCodexSdkTransportAdapter, createCodexStdioTransport, encodeJsonRpcLine, isBackpressureRetrySafeMethod, isJsonRpcNotification, isJsonRpcRequest, isJsonRpcResponse, jsonRpcErrorObject, jsonRpcErrorPayload, parseJsonRpcLine, startDeviceCodeLogin };
