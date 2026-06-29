import { C as CodexAppServerOptions, D as DynamicToolDebugEvent, a as DynamicToolHandler, b as DynamicToolHelperPermissionPolicy } from './advanced-<chunk>.js';
export { c as CodexBridgeShutdownOptions, d as DynamicToolCallOutputContentItem, e as DynamicToolCallResponse, f as DynamicToolDebugEventDetails, g as DynamicToolDebugPhase, h as DynamicToolDebugRequest, i as DynamicToolHandlerContext, j as DynamicToolHelperPermissionContext, k as DynamicToolHelperPermissionDecision, l as DynamicToolRequest, M as McpDynamicToolHandlerOptions, m as McpDynamicToolMapping, n as createMcpDynamicToolHandler } from './advanced-<chunk>.js';
import { AgentDiagnosticAudience, AgentTransportEvent } from '@nyosegawa/agent-ui-core';
import { IncomingMessage, ServerResponse, Server } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import '@nyosegawa/agent-ui-codex';
import 'node:stream';

type OneShotRpcAllowedMethods = readonly string[] | "all";
interface OneShotRpcMethodPolicyOptions {
    allowedMethods?: OneShotRpcAllowedMethods;
}
declare const DEFAULT_ONE_SHOT_METHODS: readonly string[];
declare function isOneShotRpcMethodAllowed(method: string, options?: OneShotRpcMethodPolicyOptions): boolean;
declare function oneShotRpcInvalidRequestError(message: string, data?: unknown): {
    message: string;
    data?: {} | null | undefined;
    code: number;
};
declare function oneShotRpcMethodNotAllowedError(method: string): {
    code: number;
    data: {
        method: string;
    };
    message: string;
};

interface MinimalExpressRequest {
    body?: {
        method?: string;
        params?: unknown;
    };
}
interface MinimalExpressResponse {
    json(value: unknown): void;
    status(code: number): MinimalExpressResponse;
}
type AgentUiExpressMiddlewareOptions = CodexAppServerOptions & OneShotRpcMethodPolicyOptions;
declare function createAgentUiExpressMiddleware(options?: AgentUiExpressMiddlewareOptions): (req: MinimalExpressRequest, res: MinimalExpressResponse) => Promise<void>;

type AgentUiBridgeHealthPhase = "admissionChecked" | "rejected" | "processSpawned" | "initialized" | "connected" | "idleClosed" | "backpressureClosed" | "pendingRequestCount" | "diagnostic";
interface AgentUiBridgeHealthState {
    admissionChecked: boolean;
    connected: boolean;
    initialized: boolean;
    lastRedactedDiagnostic?: string;
    pendingRequestCount: number;
    processSpawned: boolean;
}
interface AgentUiBridgeHealthEvent {
    audience: readonly AgentDiagnosticAudience[];
    closeCode?: number;
    closeReason?: string;
    diagnostic?: string;
    phase: AgentUiBridgeHealthPhase;
    reasonCode?: string;
    state: AgentUiBridgeHealthState;
    timestamp: number;
    type: "bridgeHealth";
}
interface AgentUiHostEventSink {
    onBridgeHealthEvent?: (event: AgentUiBridgeHealthEvent) => void;
    onDynamicToolEvent?: (event: DynamicToolDebugEvent) => void;
    onServerRequest?: (event: AgentTransportEvent) => void;
    onThreadEvent?: (event: AgentTransportEvent) => void;
    onTransportEvent?: (event: AgentTransportEvent) => void;
    onTurnEvent?: (event: AgentTransportEvent) => void;
    onUsageEvent?: (event: AgentTransportEvent) => void;
}
declare function emitHostEvent(sink: AgentUiHostEventSink | undefined, event: AgentTransportEvent): void;

type AgentUiNextRpcRouteOptions = CodexAppServerOptions & OneShotRpcMethodPolicyOptions;
/**
 * Create a Next.js Route Handler for exactly one Codex App Server request.
 *
 * This helper intentionally does not power Agent UI chat. Chat needs a
 * long-lived WebSocket bridge so App Server notifications, approval requests,
 * and browser approval responses can flow in both directions.
 */
declare function createAgentUiNextRpcRoute(options?: AgentUiNextRpcRouteOptions): (request: Request) => Promise<Response>;

declare function redactSecrets(input: string): string;
declare function redactStructuredValue<T>(value: T): T;
declare function redactTransportEvent(event: AgentTransportEvent): AgentTransportEvent;

interface ServerRequestPolicy$1 {
    commandExecution?: CommandApprovalPolicy | "manual";
    decide?: ServerRequestPolicyCallback;
    fileChange?: FileChangeApprovalPolicy | "manual";
    mcpToolApproval?: "accept" | "manual";
    permissions?: PermissionApprovalPolicy | "manual";
    userInput?: "manual";
}
interface ServerRequestPolicyContext {
    kind: string;
    payload: unknown;
    requestId: NonNullable<AgentTransportEvent["requestId"]>;
    threadId?: string;
    turnId?: string;
}
type ServerRequestPolicyDecision = {
    action: "respond";
    auditAction?: string;
    response: unknown;
} | {
    action: "manual";
} | null | undefined;
type ServerRequestPolicyCallback = (context: ServerRequestPolicyContext) => ServerRequestPolicyDecision;
interface CommandApprovalContext {
    command?: string;
    cwd?: string;
    itemId?: string;
    payload: unknown;
    reason?: string;
    requestId: NonNullable<AgentTransportEvent["requestId"]>;
    threadId?: string;
    turnId?: string;
}
type CommandApprovalDecision = {
    action: "accept";
    scope?: "request" | "session";
} | {
    action: "manual";
} | null | undefined;
type CommandApprovalPolicy = (context: CommandApprovalContext) => CommandApprovalDecision;
interface FileChangeApprovalContext {
    grantRoot?: string;
    itemId?: string;
    payload: unknown;
    reason?: string;
    requestId: NonNullable<AgentTransportEvent["requestId"]>;
    threadId?: string;
    turnId?: string;
}
type FileChangeApprovalDecision = {
    action: "accept";
    scope?: "request" | "session";
} | {
    action: "manual";
} | null | undefined;
type FileChangeApprovalPolicy = (context: FileChangeApprovalContext) => FileChangeApprovalDecision;
interface PermissionApprovalContext {
    cwd?: string;
    payload: unknown;
    requestId: NonNullable<AgentTransportEvent["requestId"]>;
    requested: {
        fileSystem?: unknown;
        network?: unknown;
    };
    threadId?: string;
    turnId?: string;
}
type PermissionApprovalDecision = {
    action: "grant";
    permissions: {
        fileSystem?: unknown;
        network?: unknown;
    };
    scope?: "session" | "turn";
} | {
    action: "manual";
} | null | undefined;
type PermissionApprovalPolicy = (context: PermissionApprovalContext) => PermissionApprovalDecision;
type ResolvedServerRequestPolicy = {
    commandExecution: CommandApprovalPolicy | "manual";
    decide?: ServerRequestPolicyCallback;
    fileChange: FileChangeApprovalPolicy | "manual";
    mcpToolApproval: NonNullable<ServerRequestPolicy$1["mcpToolApproval"]>;
    permissions: PermissionApprovalPolicy | "manual";
    userInput: NonNullable<ServerRequestPolicy$1["userInput"]>;
};
declare function resolveServerRequestPolicy(policy?: ServerRequestPolicy$1): ResolvedServerRequestPolicy;
declare function responseForServerRequest(event: AgentTransportEvent, policy: ResolvedServerRequestPolicy): {
    action: string;
    kind: string;
    requestId: NonNullable<AgentTransportEvent["requestId"]>;
    response: unknown;
} | undefined;

interface AgentUiUploadHandlerOptions {
    directory?: string;
    maxBytes?: number;
    now?: () => number;
    sessionId?: string;
    ttlMs?: number;
}
interface AgentUiUploadHandler {
    directory: string;
    cleanup(): Promise<void>;
    handle(request: IncomingMessage, response: ServerResponse): Promise<void>;
}
interface AgentUiLocalMediaHelperOptions extends AgentUiUploadHandlerOptions {
    assetUrlPath?: string;
    createAssetId?: () => string;
    redactPath?: (path: string, name: string) => string;
    serveAsset?: {
        admitRequest?: (context: AgentUiLocalMediaServeContext) => boolean | Promise<boolean>;
    };
}
interface AgentUiLocalMediaServeContext {
    asset: AgentResolvedAttachment;
    request: IncomingMessage;
}
interface AgentResolvedAttachment {
    displayName: string;
    id: string;
    name: string;
    path: string;
    url: string;
    redactedPath: string;
    mimeType: string;
    sizeBytes: number;
    previewUrl: string;
}
interface AgentUiLocalMediaHelper {
    directory: string;
    assetUrl(id: string): string;
    cleanup(): Promise<void>;
    getAsset(id: string): AgentResolvedAttachment | undefined;
    handleUpload(request: IncomingMessage, response: ServerResponse): Promise<void>;
    releaseAsset(id: string): Promise<boolean>;
    resolveAssetPath(id: string): string | undefined;
    serveAssetHandler(request: IncomingMessage, response: ServerResponse): Promise<void>;
    uploadHandler: AgentUiUploadHandler;
}
declare function createAgentUiLocalUploadHandler(options?: AgentUiUploadHandlerOptions): AgentUiUploadHandler;
declare function createAgentUiLocalMediaHelper(options?: AgentUiLocalMediaHelperOptions): AgentUiLocalMediaHelper;

interface WebSocketBackpressureOptions {
    maxBufferedBytes?: number | false;
}

interface AgentUiWebSocketBridgeOptions extends CodexAppServerOptions {
    bridgePolicy?: AgentUiBridgePolicy;
    dynamicToolPolicy?: AgentUiDynamicToolPolicy;
    hostEvents?: AgentUiHostEventSink;
    idleTimeoutMs?: number | false;
    /**
     * Maximum browser socket output buffer before the bridge closes the session
     * with 1013. Set to false only for host-owned experiments.
     */
    maxBufferedBytes?: WebSocketBackpressureOptions["maxBufferedBytes"];
    inbound?: AgentUiWebSocketInboundLimits;
    /**
     * Policy for server requests that can block a turn. Defaults to manual forwarding
     * so application UIs stay in control unless they explicitly opt in.
     */
    serverRequestPolicy?: ServerRequestPolicy;
    path?: string;
    browserMethodPolicy?: BrowserMethodPolicy;
    resolveBridgeOptions?: AgentUiWebSocketBridgeOptionsResolver;
}
interface AgentUiWebSocketInboundLimits {
    maxMessageBytes?: number;
    rateLimitIntervalMs?: number;
    rateLimitMessages?: number;
}
interface AgentUiWebSocketBridgeOptionsResolverContext {
    request?: IncomingMessage;
}
type AgentUiResolvedWebSocketBridgeOptions = Omit<AgentUiWebSocketBridgeOptions, "resolveBridgeOptions">;
type AgentUiWebSocketBridgeOptionsResolver = (context: AgentUiWebSocketBridgeOptionsResolverContext) => AgentUiResolvedWebSocketBridgeOptions | AgentUiBridgeResult | false | null | undefined | Promise<AgentUiResolvedWebSocketBridgeOptions | AgentUiBridgeResult | false | null | undefined>;
interface AgentUiWebSocketServerOptions extends AgentUiWebSocketBridgeOptions {
    server: Server;
}
type ServerRequestPolicy = ServerRequestPolicy$1;
type AgentUiDynamicToolPolicy = {
    mode: "disabled";
} | {
    handler: DynamicToolHandler;
    helperPermissions?: DynamicToolHelperPermissionPolicy;
    mode: "host-callback";
};
type AgentUiBridgeRejectionReason = "request_context_missing" | "loopback_required" | "resolver_rejected" | "resolver_failed" | "admission_rejected" | "admission_failed" | "unsafe_admission_reason_missing" | "unsupported_root_bridge_option" | "invalid_browser_method_policy" | "bearer_subprotocol_missing" | "bearer_subprotocol_malformed" | "bearer_subprotocol_mismatch" | (string & {});
interface AgentUiBridgeRejection {
    body?: string | Buffer;
    closeCode?: number;
    closeReason?: string;
    reason: AgentUiBridgeRejectionReason;
    status?: number;
    statusText?: string;
}
type AgentUiBridgeResult = {
    accepted: true;
} | ({
    accepted: false;
} & AgentUiBridgeRejection);
type AgentUiBridgeAdmissionDecision = boolean | AgentUiBridgeResult;
type AgentUiBridgeAdmissionHook = (request: IncomingMessage) => AgentUiBridgeAdmissionDecision | Promise<AgentUiBridgeAdmissionDecision>;
interface AgentUiBridgePolicy {
    admission?: AgentUiBridgeAdmissionPolicy;
}
type AgentUiBearerSubprotocolParseResult = {
    ok: true;
    protocol: string;
    token: string;
} | {
    ok: false;
    reason: "bearer_subprotocol_missing" | "bearer_subprotocol_malformed";
};
type AgentUiBridgeAdmissionPolicy = {
    mode: "local-loopback";
} | {
    mode: "host-callback";
    admit: AgentUiBridgeAdmissionHook;
} | {
    mode: "unsafe-no-admission";
    reason: string;
};
type BrowserMethodPolicy = "productized" | "all" | {
    capabilities?: readonly BrowserMethodCapability[];
};
type BrowserMethodCapability = "connection" | "account" | "models" | "threadHistory" | "threadLifecycle" | "turns" | "skills" | "hooks" | "apps";
declare const AGENT_UI_BEARER_SUBPROTOCOL_PREFIX = "agent-ui-bearer.";
declare function attachAgentUiWebSocketBridge(options: AgentUiWebSocketServerOptions): WebSocketServer;
declare function parseAgentUiBearerSubprotocol(requestOrHeader: IncomingMessage | string | string[] | undefined): AgentUiBearerSubprotocolParseResult;
declare function verifyAgentUiBearerSubprotocol(request: IncomingMessage, expectedToken: string | undefined): AgentUiBridgeResult;
declare function handleAgentUiWebSocketConnection(socket: WebSocket, options?: AgentUiWebSocketBridgeOptions, request?: IncomingMessage): Promise<void>;

export { AGENT_UI_BEARER_SUBPROTOCOL_PREFIX, type AgentResolvedAttachment, type AgentUiBearerSubprotocolParseResult, type AgentUiBridgeAdmissionDecision, type AgentUiBridgeAdmissionHook, type AgentUiBridgeAdmissionPolicy, type AgentUiBridgeHealthEvent, type AgentUiBridgeHealthPhase, type AgentUiBridgeHealthState, type AgentUiBridgePolicy, type AgentUiBridgeRejection, type AgentUiBridgeRejectionReason, type AgentUiBridgeResult, type AgentUiDynamicToolPolicy, type AgentUiExpressMiddlewareOptions, type AgentUiHostEventSink, type AgentUiLocalMediaHelper, type AgentUiLocalMediaHelperOptions, type AgentUiLocalMediaServeContext, type AgentUiNextRpcRouteOptions, type AgentUiResolvedWebSocketBridgeOptions, type AgentUiUploadHandler, type AgentUiUploadHandlerOptions, type AgentUiWebSocketBridgeOptions, type AgentUiWebSocketBridgeOptionsResolver, type AgentUiWebSocketBridgeOptionsResolverContext, type AgentUiWebSocketInboundLimits, type AgentUiWebSocketServerOptions, type BrowserMethodCapability, type BrowserMethodPolicy, CodexAppServerOptions, type CommandApprovalContext, type CommandApprovalDecision, type CommandApprovalPolicy, DEFAULT_ONE_SHOT_METHODS, DynamicToolDebugEvent, DynamicToolHandler, DynamicToolHelperPermissionPolicy, type FileChangeApprovalContext, type FileChangeApprovalDecision, type FileChangeApprovalPolicy, type MinimalExpressRequest, type MinimalExpressResponse, type OneShotRpcAllowedMethods, type OneShotRpcMethodPolicyOptions, type PermissionApprovalContext, type PermissionApprovalDecision, type PermissionApprovalPolicy, type ResolvedServerRequestPolicy, type ServerRequestPolicy$1 as ServerRequestPolicy, type ServerRequestPolicyCallback, type ServerRequestPolicyContext, type ServerRequestPolicyDecision, attachAgentUiWebSocketBridge, createAgentUiExpressMiddleware, createAgentUiLocalMediaHelper, createAgentUiLocalUploadHandler, createAgentUiNextRpcRoute, emitHostEvent, handleAgentUiWebSocketConnection, isOneShotRpcMethodAllowed, oneShotRpcInvalidRequestError, oneShotRpcMethodNotAllowedError, parseAgentUiBearerSubprotocol, redactSecrets, redactStructuredValue, redactTransportEvent, resolveServerRequestPolicy, responseForServerRequest, verifyAgentUiBearerSubprotocol };
