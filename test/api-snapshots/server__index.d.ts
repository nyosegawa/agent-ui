import { CodexInitializeOptions } from '@nyosegawa/agent-ui-codex';
import { AgentTransport, AgentTransportEvent, PendingServerRequest } from '@nyosegawa/agent-ui-core';
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

type DynamicToolHandler$1 = (request: DynamicToolRequest, context: DynamicToolHandlerContext) => Promise<DynamicToolCallResponse> | DynamicToolCallResponse;
interface DynamicToolHandlerContext {
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
}, transport: ReturnType<typeof createCodexAppServerBridge>["transport"], handler: DynamicToolHandler$1, getMcpThreadId: () => Promise<string>): Promise<void>;
declare function defaultDynamicToolHandler(request: DynamicToolRequest): Promise<DynamicToolCallResponse>;
declare function createMcpDynamicToolHandler(options: McpDynamicToolHandlerOptions): DynamicToolHandler$1;
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

interface AgentUiHostEventSink {
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
    commandExecution?: "accept" | "acceptForSession" | "manual";
    fileChange?: "accept" | "acceptForSession" | "manual";
    mcpToolApproval?: "accept" | "manual";
    permissions?: PermissionApprovalPolicy | "manual";
    userInput?: "manual";
}
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
    commandExecution: NonNullable<ServerRequestPolicy$1["commandExecution"]>;
    fileChange: NonNullable<ServerRequestPolicy$1["fileChange"]>;
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
declare function createAgentUiLocalUploadHandler(options?: AgentUiUploadHandlerOptions): AgentUiUploadHandler;

interface WebSocketBackpressureOptions {
    maxBufferedBytes?: number | false;
}

interface AgentUiWebSocketBridgeOptions extends CodexAppServerBridgeOptions {
    admission?: AgentUiBridgeAdmissionHook;
    dynamicToolHandler?: DynamicToolHandler;
    dynamicToolHelperPermissions?: DynamicToolHelperPermissionPolicy;
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
}
interface AgentUiWebSocketInboundLimits {
    maxMessageBytes?: number;
    rateLimitIntervalMs?: number;
    rateLimitMessages?: number;
}
interface AgentUiWebSocketServerOptions extends AgentUiWebSocketBridgeOptions {
    server: Server;
}
type ServerRequestPolicy = ServerRequestPolicy$1;
type DynamicToolHandler = DynamicToolHandler$1;
type AgentUiBridgeAdmissionHook = (request: IncomingMessage) => boolean | Promise<boolean>;
type BrowserMethodPolicy = "productized" | "all" | {
    allowedMethods?: readonly string[];
    allowedNotifications?: readonly string[];
};
declare function attachAgentUiWebSocketBridge(options: AgentUiWebSocketServerOptions): WebSocketServer;
declare function handleAgentUiWebSocketConnection(socket: WebSocket, options?: AgentUiWebSocketBridgeOptions, request?: IncomingMessage): Promise<void>;

export { type AgentUiBridgeAdmissionHook, type AgentUiExpressMiddlewareOptions, type AgentUiHostEventSink, type AgentUiNextRpcRouteOptions, type AgentUiUploadHandler, type AgentUiUploadHandlerOptions, type AgentUiWebSocketBridgeOptions, type AgentUiWebSocketInboundLimits, type AgentUiWebSocketServerOptions, type BrowserMethodPolicy, type CodexAppServerBridge, type CodexAppServerBridgeOptions, type CodexBridgeShutdownOptions, type CodexChildProcess, type CodexSpawnOptions, DEFAULT_ONE_SHOT_METHODS, type DynamicToolCallOutputContentItem, type DynamicToolCallResponse, type DynamicToolHandler$1 as DynamicToolHandler, type DynamicToolHandlerContext, type DynamicToolHelperPermissionContext, type DynamicToolHelperPermissionDecision, type DynamicToolHelperPermissionPolicy, type DynamicToolRequest, type McpDynamicToolHandlerOptions, type McpDynamicToolMapping, type MinimalExpressRequest, type MinimalExpressResponse, type OneShotRpcAllowedMethods, type OneShotRpcMethodPolicyOptions, type PermissionApprovalContext, type PermissionApprovalDecision, type PermissionApprovalPolicy, type ResolvedServerRequestPolicy, type ServerRequestPolicy$1 as ServerRequestPolicy, attachAgentUiWebSocketBridge, createAgentUiExpressMiddleware, createAgentUiLocalUploadHandler, createAgentUiNextRpcRoute, createCodexAppServerBridge, createDynamicToolHelperThread, createMcpDynamicToolHandler, defaultDynamicToolHandler, dynamicToolFailure, emitHostEvent, handleAgentUiWebSocketConnection, handleDynamicToolRequest, isOneShotRpcMethodAllowed, maybeResolveHelperThreadRequest, oneShotRpcInvalidRequestError, oneShotRpcMethodNotAllowedError, redactSecrets, redactStructuredValue, redactTransportEvent, resolveServerRequestPolicy, responseForServerRequest };
