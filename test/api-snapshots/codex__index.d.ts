import { RequestId, AgentError, AgentApp, AgentEvent, AgentModel, AgentTransport, AgentTransportEvent } from '@nyosegawa/agent-ui-core';
export { a as CodexStableMethod, C as CodexStableMethodParams } from './method-params-BXDZnxMW.js';
import { C as CodexInitializeOptions } from './websocket-C91WDxhz.js';
export { a as CODEX_PROTOCOL_COMMIT, b as CODEX_PROTOCOL_GENERATED_AT, c as CodexCapabilityMetadata, d as CodexCapabilityStatus, e as CodexClientInfo, f as CodexInitializeCapabilities, g as CodexWebSocketReconnectOptions, h as CodexWebSocketTransportOptions, E as ExperimentalAvailableMethod, H as HostOnlyMethod, S as StableAvailableMethod, i as StableNotificationMethod, j as StableProductizedMethod, k as StableServerRequestMethod, l as codexCapabilityMetadata, m as codexInitializeParams, n as createCodexWebSocketTransport, o as experimentalAvailableMethods, p as hostOnlyMethods, s as stableAvailableMethods, q as stableClientMethods, r as stableNotificationMethods, t as stableProductizedMethods, u as stableServerRequestMethods } from './websocket-C91WDxhz.js';
export { CodexSession, CodexSessionOptions, CodexThreadForkOptions, CodexThreadMetadataUpdateOptions, CodexThreadResumeOptions, CodexTurnStartOptions, CodexTurnSteerOptions, createCodexSession } from './session.js';
import { Writable, Readable } from 'node:stream';
import './InitializeParams-CDX1c2T9.js';
import './request-builders.js';

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

export { CodexInitializeOptions, type CodexSdkLikeClient, type CodexStdioTransportOptions, type DeviceCodeLoginStart, type JsonRpcFailure, type JsonRpcMessage, type JsonRpcNotification, type JsonRpcRequest, type JsonRpcSuccess, cancelDeviceCodeLogin, createCodexSdkTransportAdapter, createCodexStdioTransport, encodeJsonRpcLine, isBackpressureRetrySafeMethod, isJsonRpcNotification, isJsonRpcRequest, isJsonRpcResponse, jsonRpcErrorObject, jsonRpcErrorPayload, normalizeApps, normalizeCodexServerMessage, normalizeModelListResponse, parseJsonRpcLine, startDeviceCodeLogin };
