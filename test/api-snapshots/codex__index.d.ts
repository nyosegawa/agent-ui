export { CodexAccountClient, CodexApprovalsClient, CodexAppsClient, CodexClients, CodexClientsOptions, CodexConnectionClient, CodexHooksClient, CodexModelsClient, CodexSkillsClient, CodexThreadForkOptions, CodexThreadMetadataUpdateOptions, CodexThreadResumeOptions, CodexThreadsClient, CodexTurnStartOptions, CodexTurnSteerOptions, CodexTurnsClient, createCodexClients } from './clients.js';
import { RequestId, AgentError, AgentTransport, AgentTransportEvent, AgentEvent } from '@nyosegawa/agent-ui-core';
export { AgentLocalPath, AgentMentionPath, AgentResourcePath, AgentSkillPath, AgentWorkingDirectory } from './request-builders.js';
import { C as CodexInitializeOptions } from './protocol-<chunk>.js';
export { a as CODEX_PROTOCOL_COMMIT, b as CODEX_PROTOCOL_GENERATED_AT, c as CodexCapabilityMetadata, d as CodexCapabilityStatus, e as CodexClientInfo, f as CodexInitializeCapabilities, g as CodexServerRequestMethodMetadata, h as CodexServerRequestRole, E as ExperimentalAvailableMethod, i as ExperimentalUnsupportedMethod, H as HostOnlyMethod, S as StableAvailableMethod, j as StableNotificationMethod, k as StableProductizedMethod, l as StableServerRequestMethod, m as assertCodexExperimentalMethod, n as assertCodexProductizedMethod, o as codexCapabilityMetadata, p as codexInitializeParams, q as codexServerRequestMethodMetadata, r as experimentalAvailableMethods, s as experimentalUnsupportedMethods, t as getCodexCapabilityStatus, u as getCodexServerRequestMethodMetadata, v as hostOnlyMethods, w as isCodexApprovalDecisionServerRequestMethod, x as isExperimentalAvailableMethod, y as isExperimentalUnsupportedMethod, z as isHostOnlyMethod, A as isStableProductizedMethod, B as isStableServerRequestMethod, D as stableAvailableMethods, F as stableClientMethods, G as stableNotificationMethods, I as stableProductizedMethods, J as stableServerRequestMethods } from './protocol-<chunk>.js';
export { CodexSession, CodexSessionOptions, createCodexSession } from './session.js';
import { Writable, Readable } from 'node:stream';
export { AGENT_UI_BEARER_SUBPROTOCOL_PREFIX, CodexWebSocketReconnectOptions, CodexWebSocketTransportOptions, createAgentUiBearerSubprotocol, createCodexWebSocketTransport } from './websocket.js';
import './method-params-<chunk>.js';
import './UserInput-<chunk>.js';
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
