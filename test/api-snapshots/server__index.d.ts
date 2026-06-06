import { CodexInitializeOptions } from '@nyosegawa/agent-ui-codex';
import { AgentTransport, AgentDiagnosticAudience, AgentTransportEvent, PendingServerRequest } from '@nyosegawa/agent-ui-core';
import { Readable, Writable } from 'node:stream';
import { IncomingMessage, ServerResponse, Server } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

interface CodexAppServerBridgeOptions {
    args?: string[];
    command?: string;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    initialize?: CodexInitializeOptions;
    shutdown?: CodexBridgeShutdownOptions;
    spawn?: (command: string, args: string[], options: CodexSpawnOptions) => CodexChildProcess;
    stderr?: (line: string) => void;
}
interface CodexBridgeShutdownOptions {
    graceMs?: number;
    killSignal?: NodeJS.Signals | string;
    terminateSignal?: NodeJS.Signals | string;
}
interface CodexSpawnOptions {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
}
interface CodexChildProcess {
    killed?: boolean;
    stderr?: Readable | null;
    stdin?: Writable | null;
    stdout?: Readable | null;
    kill(signal?: NodeJS.Signals | string | number, error?: Error): boolean;
    once?: (event: "exit" | "close", listener: () => void) => unknown;
}
interface CodexAppServerBridge {
    close(): Promise<void>;
    process: CodexChildProcess;
    transport: AgentTransport;
}
declare function createCodexAppServerBridge(options?: CodexAppServerBridgeOptions): CodexAppServerBridge;

type DynamicToolHandler = (request: DynamicToolRequest, context: DynamicToolHandlerContext) => Promise<DynamicToolCallResponse> | DynamicToolCallResponse;
interface DynamicToolHandlerContext {
    emitDebugEvent(event: DynamicToolDebugEventDetails): void;
    getMcpThreadId(): Promise<string>;
    transport: ReturnType<typeof createCodexAppServerBridge>["transport"];
}
interface DynamicToolRequest {
    arguments?: unknown;
    callId: string;
    namespace: string | null;
    threadId: string;
    tool: string;
    turnId: string;
}
interface DynamicToolCallResponse {
    contentItems: DynamicToolCallOutputContentItem[];
    success: boolean;
}
type DynamicToolCallOutputContentItem = {
    type: "inputText";
    text: string;
} | {
    type: "inputImage";
    imageUrl: string;
};
type DynamicToolDebugPhase = "received" | "denied" | "helperThreadCreated" | "mcpCallStarted" | "timeout" | "completed" | "failed";
interface DynamicToolDebugRequest {
    callId: string;
    namespace: string | null;
    threadId: string;
    tool: string;
    turnId: string;
}
interface DynamicToolDebugEvent {
    audience?: readonly AgentDiagnosticAudience[];
    durationMs?: number;
    helperThreadId?: string;
    message?: string;
    phase: DynamicToolDebugPhase;
    request: DynamicToolDebugRequest;
    requestId: NonNullable<AgentTransportEvent["requestId"]>;
    server?: string;
    success?: boolean;
    type: "dynamicTool";
}
type DynamicToolDebugEventDetails = Omit<DynamicToolDebugEvent, "request" | "requestId" | "type">;
interface McpDynamicToolMapping {
    namespace: string;
    server: string;
    tools: readonly string[] | "all";
}
interface McpDynamicToolHandlerOptions {
    timeoutMs?: number;
    tools: readonly McpDynamicToolMapping[];
}
type DynamicToolHelperPermissionPolicy = "manual" | "deny" | "grantRequestedForTurn" | ((context: DynamicToolHelperPermissionContext) => DynamicToolHelperPermissionDecision);
interface DynamicToolHelperPermissionContext {
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
type DynamicToolHelperPermissionDecision = {
    action: "grant";
    permissions: {
        fileSystem?: unknown;
        network?: unknown;
    };
} | {
    action: "deny";
} | {
    action: "manual";
} | null | undefined;
declare function handleDynamicToolRequest(event: AgentTransportEvent & {
    request: PendingServerRequest;
    requestId: NonNullable<AgentTransportEvent["requestId"]>;
}, transport: ReturnType<typeof createCodexAppServerBridge>["transport"], handler: DynamicToolHandler, getMcpThreadId: () => Promise<string>, emitDynamicToolEvent?: (event: DynamicToolDebugEvent) => void): Promise<void>;
declare function createMcpDynamicToolHandler(options: McpDynamicToolHandlerOptions): DynamicToolHandler;
declare function createDynamicToolHelperThread(transport: ReturnType<typeof createCodexAppServerBridge>["transport"], cwd?: string): Promise<string>;
declare function maybeResolveHelperThreadRequest(event: AgentTransportEvent, transport: ReturnType<typeof createCodexAppServerBridge>["transport"], helperThreadId: Promise<string> | undefined, permissionPolicy?: DynamicToolHelperPermissionPolicy): Promise<boolean>;
declare function dynamicToolFailure(error: unknown): DynamicToolCallResponse;

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
type AgentUiExpressMiddlewareOptions = CodexAppServerBridgeOptions & OneShotRpcMethodPolicyOptions;
declare function createAgentUiExpressMiddleware(options?: AgentUiExpressMiddlewareOptions): (req: MinimalExpressRequest, res: MinimalExpressResponse) => Promise<void>;

type AgentUiBridgeHealthPhase = "admissionChecked" | "processSpawned" | "initialized" | "connected" | "idleClosed" | "backpressureClosed" | "pendingRequestCount" | "diagnostic";
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

type AgentUiNextRpcRouteOptions = CodexAppServerBridgeOptions & OneShotRpcMethodPolicyOptions;
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
    kind: PendingServerRequest["kind"];
    payload: unknown;
    request: PendingServerRequest;
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
    kind: PendingServerRequest["kind"];
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

interface AgentUiWebSocketBridgeOptions extends CodexAppServerBridgeOptions {
    admission?: AgentUiBridgeAdmissionHook;
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
type AgentUiWebSocketBridgeOptionsResolver = (context: AgentUiWebSocketBridgeOptionsResolverContext) => AgentUiResolvedWebSocketBridgeOptions | false | null | undefined | Promise<AgentUiResolvedWebSocketBridgeOptions | false | null | undefined>;
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
type AgentUiBridgeAdmissionHook = (request: IncomingMessage) => boolean | Promise<boolean>;
interface AgentUiBridgePolicy {
    admission?: AgentUiBridgeAdmissionPolicy;
}
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
declare function attachAgentUiWebSocketBridge(options: AgentUiWebSocketServerOptions): WebSocketServer;
declare function handleAgentUiWebSocketConnection(socket: WebSocket, options?: AgentUiWebSocketBridgeOptions, request?: IncomingMessage): Promise<void>;

export { type AgentResolvedAttachment, type AgentUiBridgeAdmissionHook, type AgentUiBridgeAdmissionPolicy, type AgentUiBridgeHealthEvent, type AgentUiBridgeHealthPhase, type AgentUiBridgeHealthState, type AgentUiBridgePolicy, type AgentUiDynamicToolPolicy, type AgentUiExpressMiddlewareOptions, type AgentUiHostEventSink, type AgentUiLocalMediaHelper, type AgentUiLocalMediaHelperOptions, type AgentUiLocalMediaServeContext, type AgentUiNextRpcRouteOptions, type AgentUiResolvedWebSocketBridgeOptions, type AgentUiUploadHandler, type AgentUiUploadHandlerOptions, type AgentUiWebSocketBridgeOptions, type AgentUiWebSocketBridgeOptionsResolver, type AgentUiWebSocketBridgeOptionsResolverContext, type AgentUiWebSocketInboundLimits, type AgentUiWebSocketServerOptions, type BrowserMethodCapability, type BrowserMethodPolicy, type CodexAppServerBridge, type CodexAppServerBridgeOptions, type CodexBridgeShutdownOptions, type CodexChildProcess, type CodexSpawnOptions, type CommandApprovalContext, type CommandApprovalDecision, type CommandApprovalPolicy, DEFAULT_ONE_SHOT_METHODS, type DynamicToolCallOutputContentItem, type DynamicToolCallResponse, type DynamicToolDebugEvent, type DynamicToolDebugEventDetails, type DynamicToolDebugPhase, type DynamicToolDebugRequest, type DynamicToolHandler, type DynamicToolHandlerContext, type DynamicToolHelperPermissionContext, type DynamicToolHelperPermissionDecision, type DynamicToolHelperPermissionPolicy, type DynamicToolRequest, type FileChangeApprovalContext, type FileChangeApprovalDecision, type FileChangeApprovalPolicy, type McpDynamicToolHandlerOptions, type McpDynamicToolMapping, type MinimalExpressRequest, type MinimalExpressResponse, type OneShotRpcAllowedMethods, type OneShotRpcMethodPolicyOptions, type PermissionApprovalContext, type PermissionApprovalDecision, type PermissionApprovalPolicy, type ResolvedServerRequestPolicy, type ServerRequestPolicy$1 as ServerRequestPolicy, type ServerRequestPolicyCallback, type ServerRequestPolicyContext, type ServerRequestPolicyDecision, attachAgentUiWebSocketBridge, createAgentUiExpressMiddleware, createAgentUiLocalMediaHelper, createAgentUiLocalUploadHandler, createAgentUiNextRpcRoute, createCodexAppServerBridge, createDynamicToolHelperThread, createMcpDynamicToolHandler, dynamicToolFailure, emitHostEvent, handleAgentUiWebSocketConnection, handleDynamicToolRequest, isOneShotRpcMethodAllowed, maybeResolveHelperThreadRequest, oneShotRpcInvalidRequestError, oneShotRpcMethodNotAllowedError, redactSecrets, redactStructuredValue, redactTransportEvent, resolveServerRequestPolicy, responseForServerRequest };
